import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, FlatList, KeyboardAvoidingView,
  Platform, DeviceEventEmitter, StatusBar
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { colors, radius, spacing } from '../../lib/theme'
import { Toast, useToast } from '../../components/Toast'

const SUGERIDOS = [
  { nombre: 'Corte de cabello', duracion: 30,  precio: 3500 },
  { nombre: 'Barba',            duracion: 20,  precio: 2000 },
  { nombre: 'Corte + Barba',    duracion: 50,  precio: 5000 },
  { nombre: 'Coloración',       duracion: 90,  precio: 8000 },
  { nombre: 'Lavado',           duracion: 20,  precio: 1500 },
  { nombre: 'Turno 30 min',     duracion: 30,  precio: 0 },
  { nombre: 'Turno 1 hora',     duracion: 60,  precio: 0 },
]

export default function AddServicesScreen({ route }) {
  const { businessId } = route.params

  const [servicios, setServicios] = useState([])
  const [nombre,    setNombre]    = useState('')
  const [precio,    setPrecio]    = useState('')
  const [duracion,  setDuracion]  = useState('30')
  const [saving,    setSaving]    = useState(false)
  const { toast, showToast, hideToast } = useToast()
  
  function agregarServicio() {
    if (!nombre.trim()) { showToast('Ingresá el nombre del servicio', 'warning'); return }
    if (!precio.trim()) { showToast('Ingresá el precio', 'warning'); return }
    setServicios(prev => [...prev, {
      id:      Date.now().toString(),
      nombre:  nombre.trim(),
      precio:  parseInt(precio) || 0,
      duracion: parseInt(duracion) || 30,
    }])
    setNombre(''); setPrecio(''); setDuracion('30')
  }

  function agregarSugerido(s) {
    if (servicios.find(x => x.nombre === s.nombre)) return
    setServicios(prev => [...prev, { id: Date.now().toString(), ...s }])
  }

  function eliminar(id) {
    setServicios(prev => prev.filter(s => s.id !== id))
  }

  async function guardar() {
    if (servicios.length === 0) { showToast('Agregá al menos un servicio', 'warning'); return }
    setSaving(true)
    const rows = servicios.map(s => ({
      business_id:      businessId,
      name:             s.nombre,
      price:            s.precio,
      duration_minutes: s.duracion,
      active:           true,
    }))
    const { error } = await supabase.from('services').insert(rows)
    if (error) { showToast(error.message, 'error'); setSaving(false); return }
    setSaving(false)

    // Disparar re-check de estado en el navigation root
    // El listener en navigation/index.js redirige al admin automáticamente
    DeviceEventEmitter.emit('recheck_user_state')
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <View style={s.root}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.logo}>Argendar</Text>
          <View style={s.chip}><Text style={s.chipText}>Paso 2 de 2</Text></View>
        </View>

        <Text style={s.titulo}>¿Qué servicios ofrecés?</Text>
        <Text style={s.sub}>Podés agregar, editar o eliminar servicios después desde Ajustes.</Text>

        {/* Sugeridos */}
        <Text style={s.label}>Sugeridos · tocá para agregar</Text>
        <View style={s.sugeridosRow}>
          {SUGERIDOS.map(sg => {
            const ya = !!servicios.find(x => x.nombre === sg.nombre)
            return (
              <TouchableOpacity
                key={sg.nombre}
                style={[s.sugeridoBtn, ya && s.sugeridoBtnActive]}
                onPress={() => ya ? eliminar(servicios.find(x=>x.nombre===sg.nombre)?.id) : agregarSugerido(sg)}
                activeOpacity={0.7}
              >
                {ya && <Feather name="check" size={11} color={colors.primary} />}
                <Text style={[s.sugeridoText, ya && { color: colors.primary }]}>{sg.nombre}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Formulario personalizado */}
        <Text style={s.label}>Agregar personalizado</Text>
        <TextInput
          style={s.input}
          placeholder="Nombre del servicio"
          placeholderTextColor={colors.textMuted}
          value={nombre}
          onChangeText={setNombre}
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput
            style={[s.input, { flex: 1 }]}
            placeholder="Precio $"
            placeholderTextColor={colors.textMuted}
            value={precio}
            onChangeText={setPrecio}
            keyboardType="numeric"
          />
          <TextInput
            style={[s.input, { flex: 1 }]}
            placeholder="Minutos"
            placeholderTextColor={colors.textMuted}
            value={duracion}
            onChangeText={setDuracion}
            keyboardType="numeric"
          />
        </View>
        <TouchableOpacity style={s.btnAdd} onPress={agregarServicio} activeOpacity={0.8}>
          <Feather name="plus" size={16} color={colors.primary} />
          <Text style={s.btnAddText}>Agregar servicio</Text>
        </TouchableOpacity>

        {/* Lista agregados */}
        {servicios.length > 0 && (
          <FlatList
            data={servicios}
            keyExtractor={i => i.id}
            style={{ maxHeight: 160, marginTop: 8 }}
            contentContainerStyle={{ gap: 6 }}
            renderItem={({ item }) => (
              <View style={s.servicioRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.servicioNombre}>{item.nombre}</Text>
                  <Text style={s.servicioSub}>{item.duracion} min{item.precio > 0 ? ` · $${item.precio}` : ''}</Text>
                </View>
                <TouchableOpacity onPress={() => eliminar(item.id)} style={{ padding: 8 }}>
                  <Feather name="x" size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        {/* Botón final */}
        <TouchableOpacity
          style={[s.btnFinal, servicios.length === 0 && s.btnFinalDisabled]}
          onPress={guardar}
          disabled={saving || servicios.length === 0}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="white" />
            : <>
                <Text style={s.btnFinalText}>
                  {servicios.length === 0 ? 'Agregá al menos un servicio' : 'Finalizar y entrar →'}
                </Text>
                {servicios.length > 0 && <Feather name="arrow-right" size={18} color="white" />}
              </>
          }
        </TouchableOpacity>

        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, paddingTop: 56 },
  header:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  logo:              { fontSize: 22, fontWeight: '800', color: colors.primary },
  chip:              { backgroundColor: colors.primaryGlow, paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  chipText:          { color: colors.primary, fontSize: 12, fontWeight: '600' },
  titulo:            { fontSize: 24, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5, marginBottom: 6 },
  sub:               { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 20 },
  label:             { fontSize: 12, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 12 },
  sugeridosRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  sugeridoBtn:       { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.card, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: colors.border },
  sugeridoBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryGlow },
  sugeridoText:      { color: colors.textSecondary, fontSize: 13 },
  input:             { backgroundColor: colors.card, borderRadius: radius.md, padding: 13, fontSize: 14, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  btnAdd:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.primaryGlow, marginBottom: 4 },
  btnAddText:        { color: colors.primary, fontWeight: '600', fontSize: 14 },
  servicioRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.border },
  servicioNombre:    { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
  servicioSub:       { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  btnFinal:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: radius.lg, padding: 16, marginTop: 16 },
  btnFinalDisabled:  { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  btnFinalText:      { color: 'white', fontSize: 16, fontWeight: '700' },
})