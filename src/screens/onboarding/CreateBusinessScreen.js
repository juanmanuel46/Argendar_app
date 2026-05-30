import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { Toast, useToast } from '../../components/Toast'

const CATEGORIAS = [
  { icon: '✂️', nombre: 'Barbería' },
  { icon: '💇', nombre: 'Peluquería' },
  { icon: '🧖', nombre: 'Spa' },
  { icon: '🩺', nombre: 'Médico' },
  { icon: '🦷', nombre: 'Dentista' },
  { icon: '🐾', nombre: 'Veterinaria' },
  { icon: '💪', nombre: 'Gimnasio' },
  { icon: '💅', nombre: 'Estética' },
  { icon: '🤲', nombre: 'Masajes' },
  { icon: '🚗', nombre: 'Lavadero' },
  { icon: '🎾', nombre: 'Canchas' },
  { icon: '🏪', nombre: 'Otro' },
]

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export default function CreateBusinessScreen({ navigation }) {
  const [nombre,     setNombre]     = useState('')
  const [categoria,  setCategoria]  = useState(null)
  const [slug,       setSlug]       = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [loading,    setLoading]    = useState(false)
  const { toast, showToast, hideToast } = useToast()

  function onNombreChange(text) {
    setNombre(text)
    setSlug(slugify(text))
  }

async function handleCrear() {
    if (!nombre.trim())    { showToast('Ingresá el nombre de tu negocio', 'warning'); return }
    if (!categoria)        { showToast('Elegí una categoría', 'warning'); return }
    if (!slug.trim())      { showToast('El slug no puede estar vacío', 'warning'); return }

    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;

      const payload = {
        name: nombre.trim(),
        category: categoria?.nombre,
        slug: slug.trim(),
        description: descripcion.trim() || null,
        active: true,
        allow_employee_selection: false,
        owner_email: user?.email,
        owner_id: user?.id,
        trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_status: 'trial',
      };

      const { data: biz, error: bizError } = await supabase
        .from('businesses')
        .insert(payload)
        .select()
        .single();

      if (bizError) {
        showToast(bizError.message, 'error')
        setLoading(false);
        return;
      }

      setLoading(false);
      navigation.navigate('AddServices', { businessId: biz.id, businessName: biz.name });

    } catch (err) {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        
        {/* Header */}
        <View style={s.header}>
          <Text style={s.logo}>Argendar</Text>
          <View style={s.paso}>
            <Text style={s.pasoText}>Paso 1 de 2</Text>
          </View>
        </View>

        <Text style={s.titulo}>Contanos sobre tu negocio 🏪</Text>
        <Text style={s.sub}>Esta info la verán tus clientes al reservar un turno</Text>

        {/* Nombre */}
        <Text style={s.label}>Nombre del negocio *</Text>
        <TextInput
          style={s.input}
          placeholder="Ej: Barbería El Toro"
          placeholderTextColor="#555"
          value={nombre}
          onChangeText={onNombreChange}
          autoCapitalize="words"
        />

        {/* URL preview */}
        {slug ? (
          <View style={s.slugPreview}>
            <Text style={s.slugPreviewLabel}>Tu URL de reservas:</Text>
            <Text style={s.slugPreviewUrl}>argendar.com.ar/<Text style={s.slugAccent}>{slug}</Text></Text>
            <TextInput
              style={s.slugInput}
              value={slug}
              onChangeText={setSlug}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="personalizar-url"
              placeholderTextColor="#555"
            />
          </View>
        ) : null}

        {/* Categoría */}
        <Text style={s.label}>Categoría *</Text>
        <View style={s.categoriasGrid}>
          {CATEGORIAS.map(cat => (
            <TouchableOpacity
              key={cat.nombre}
              style={[s.categoriaBtn, categoria?.nombre === cat.nombre && s.categoriaBtnActive]}
              onPress={() => setCategoria(cat)}
            >
              <Text style={s.categoriaIcon}>{cat.icon}</Text>
              <Text style={[s.categoriaNombre, categoria?.nombre === cat.nombre && s.categoriaNombreActive]}>
                {cat.nombre}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Descripción */}
        <Text style={s.label}>Descripción (opcional)</Text>
        <TextInput
          style={[s.input, s.inputMulti]}
          placeholder="Contá brevemente qué ofrecés..."
          placeholderTextColor="#555"
          value={descripcion}
          onChangeText={setDescripcion}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <TouchableOpacity style={s.btn} onPress={handleCrear} disabled={loading}>
          {loading
            ? <ActivityIndicator color="white" />
            : <Text style={s.btnText}>Siguiente: Agregar servicios →</Text>
          }
        </TouchableOpacity>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container:            { flexGrow: 1, backgroundColor: '#111', padding: 24, paddingTop: 56 },
  header:               { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  logo:                 { fontSize: 22, fontWeight: '800', color: '#c87aff' },
  paso:                 { backgroundColor: 'rgba(155,77,255,0.15)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  pasoText:             { color: '#c87aff', fontSize: 12, fontWeight: '600' },
  titulo:               { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 6 },
  sub:                  { fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 20 },
  label:                { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 8, marginTop: 8 },
  input:                { backgroundColor: '#1c1c1e', borderRadius: 12, padding: 14, fontSize: 15, color: '#fff', marginBottom: 4, borderWidth: 1.5, borderColor: '#2a2a2d' },
  inputMulti:           { height: 80, marginBottom: 20 },
  slugPreview:          { backgroundColor: '#1c1c1e', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1.5, borderColor: '#2a2a2d' },
  slugPreviewLabel:     { fontSize: 11, color: '#666', marginBottom: 4 },
  slugPreviewUrl:       { fontSize: 14, color: '#fff', marginBottom: 10 },
  slugAccent:           { color: '#c87aff', fontWeight: '600' },
  slugInput:            { backgroundColor: '#2a2a2d', borderRadius: 8, padding: 10, fontSize: 14, color: '#fff', borderWidth: 1, borderColor: '#333' },
  categoriasGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  categoriaBtn:         { width: '30%', backgroundColor: '#1c1c1e', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#2a2a2d' },
  categoriaBtnActive:   { borderColor: '#7C5CFC', backgroundColor: 'rgba(124,92,252,0.12)' },
  categoriaIcon:        { fontSize: 24, marginBottom: 4 },
  categoriaNombre:      { fontSize: 11, color: '#888', textAlign: 'center' },
  categoriaNombreActive:{ color: '#c87aff', fontWeight: '600' },
  btn:                  { backgroundColor: '#7C5CFC', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 40 },
  btnText:              { color: 'white', fontSize: 16, fontWeight: '700' },
})