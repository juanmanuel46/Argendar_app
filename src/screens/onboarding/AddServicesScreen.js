import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform
} from 'react-native'
import { supabase } from '../../lib/supabase'

const SERVICIOS_SUGERIDOS = [
  { nombre: 'Corte de cabello', duracion: 30, precio: 3500 },
  { nombre: 'Barba',            duracion: 20, precio: 2000 },
  { nombre: 'Corte + Barba',    duracion: 50, precio: 5000 },
  { nombre: 'Coloración',       duracion: 90, precio: 8000 },
  { nombre: 'Lavado',           duracion: 20, precio: 1500 },
]

export default function AddServicesScreen({ route, navigation }) {
  const { businessId, businessName } = route.params
  const [servicios, setServicios] = useState([])
  const [nombre,    setNombre]    = useState('')
  const [precio,    setPrecio]    = useState('')
  const [duracion,  setDuracion]  = useState('30')
  const [loading,   setLoading]   = useState(false)
  const [saving,    setSaving]    = useState(false)

  function agregarServicio() {
    if (!nombre.trim()) { Alert.alert('Ingresá el nombre del servicio'); return }
    if (!precio.trim()) { Alert.alert('Ingresá el precio'); return }
    setServicios(prev => [...prev, {
      id: Date.now().toString(),
      nombre: nombre.trim(),
      precio: parseInt(precio),
      duracion: parseInt(duracion) || 30,
    }])
    setNombre('')
    setPrecio('')
    setDuracion('30')
  }

  function agregarSugerido(s) {
    if (servicios.find(x => x.nombre === s.nombre)) return
    setServicios(prev => [...prev, { id: Date.now().toString(), ...s }])
  }

  function eliminarServicio(id) {
    setServicios(prev => prev.filter(s => s.id !== id))
  }

  async function guardarYContinuar() {
    if (servicios.length === 0) {
      Alert.alert('Agregá al menos un servicio', 'Tus clientes necesitan saber qué ofrecés')
      return
    }
    setSaving(true)
    const rows = servicios.map(s => ({
      business_id:      businessId,
      name:             s.nombre,
      price:            s.precio,
      duration_minutes: s.duracion,
      active:           true,
    }))
    const { error } = await supabase.from('services').insert(rows)
    if (error) { Alert.alert('Error guardando servicios', error.message); setSaving(false); return }
    setSaving(false)
    // La navegación al admin se maneja automáticamente porque app_user ya existe
    // Forzamos refetch del estado
    await supabase.auth.refreshSession()
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.logo}>Bookzy</Text>
          <View style={s.paso}><Text style={s.pasoText}>Paso 2 de 2</Text></View>
        </View>

        <Text style={s.titulo}>¿Qué servicios ofrecés? ✂️</Text>
        <Text style={s.sub}>Podés agregar más después desde la app</Text>

        {/* Sugeridos */}
        <Text style={s.label}>Sugeridos (tocá para agregar)</Text>
        <View style={s.sugeridosRow}>
          {SERVICIOS_SUGERIDOS.map(s2 => (
            <TouchableOpacity
              key={s2.nombre}
              style={[s.sugeridoBtn, servicios.find(x => x.nombre === s2.nombre) && s.sugeridoBtnActive]}
              onPress={() => agregarSugerido(s2)}
            >
              <Text style={s.sugeridoText}>{s2.nombre}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Formulario */}
        <Text style={s.label}>Agregar personalizado</Text>
        <View style={s.formRow}>
          <TextInput
            style={[s.input, { flex: 2 }]}
            placeholder="Nombre del servicio"
            placeholderTextColor="#555"
            value={nombre}
            onChangeText={setNombre}
          />
        </View>
        <View style={s.formRow}>
          <TextInput
            style={[s.input, { flex: 1, marginRight: 8 }]}
            placeholder="Precio $"
            placeholderTextColor="#555"
            value={precio}
            onChangeText={setPrecio}
            keyboardType="numeric"
          />
          <TextInput
            style={[s.input, { flex: 1 }]}
            placeholder="Min (30)"
            placeholderTextColor="#555"
            value={duracion}
            onChangeText={setDuracion}
            keyboardType="numeric"
          />
        </View>
        <TouchableOpacity style={s.btnAgregar} onPress={agregarServicio}>
          <Text style={s.btnAgregarText}>+ Agregar</Text>
        </TouchableOpacity>

        {/* Lista */}
        {servicios.length > 0 && (
          <>
            <Text style={s.label}>Servicios agregados ({servicios.length})</Text>
            <FlatList
              data={servicios}
              keyExtractor={item => item.id}
              style={{ maxHeight: 180 }}
              contentContainerStyle={{ gap: 8 }}
              renderItem={({ item }) => (
                <View style={s.servicioItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.servicioNombre}>{item.nombre}</Text>
                    <Text style={s.servicioSub}>{item.duracion} min · ${item.precio}</Text>
                  </View>
                  <TouchableOpacity onPress={() => eliminarServicio(item.id)}>
                    <Text style={{ color: '#ff6b6b', fontSize: 18 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </>
        )}

        <TouchableOpacity
          style={[s.btn, servicios.length === 0 && s.btnDisabled]}
          onPress={guardarYContinuar}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="white" />
            : <Text style={s.btnText}>{servicios.length === 0 ? 'Agregá servicios para continuar' : 'Finalizar y entrar →'}</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#111', padding: 24, paddingTop: 56 },
  header:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  logo:              { fontSize: 22, fontWeight: '800', color: '#c87aff' },
  paso:              { backgroundColor: 'rgba(155,77,255,0.15)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  pasoText:          { color: '#c87aff', fontSize: 12, fontWeight: '600' },
  titulo:            { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 6 },
  sub:               { fontSize: 14, color: '#666', marginBottom: 20 },
  label:             { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 8, marginTop: 12 },
  sugeridosRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  sugeridoBtn:       { backgroundColor: '#1c1c1e', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1.5, borderColor: '#2a2a2d' },
  sugeridoBtnActive: { borderColor: '#7C5CFC', backgroundColor: 'rgba(124,92,252,0.15)' },
  sugeridoText:      { color: '#ccc', fontSize: 13 },
  formRow:           { flexDirection: 'row', gap: 8, marginBottom: 4 },
  input:             { backgroundColor: '#1c1c1e', borderRadius: 12, padding: 12, fontSize: 14, color: '#fff', borderWidth: 1.5, borderColor: '#2a2a2d' },
  btnAgregar:        { backgroundColor: '#2a2a2d', borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 4, borderWidth: 1, borderColor: '#7C5CFC' },
  btnAgregarText:    { color: '#c87aff', fontWeight: '600', fontSize: 14 },
  servicioItem:      { backgroundColor: '#1c1c1e', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#2a2a2d' },
  servicioNombre:    { color: '#fff', fontWeight: '600', fontSize: 14 },
  servicioSub:       { color: '#666', fontSize: 12, marginTop: 2 },
  btn:               { backgroundColor: '#7C5CFC', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16 },
  btnDisabled:       { backgroundColor: '#333' },
  btnText:           { color: 'white', fontSize: 15, fontWeight: '700' },
})