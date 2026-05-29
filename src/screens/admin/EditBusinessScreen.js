import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet,Alert, ActivityIndicator, ScrollView, Switch, StatusBar} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { colors, radius, spacing } from '../../lib/theme'
import { Image } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Toast, useToast } from '../../components/Toast'

const CATEGORIAS = [
  { icon: '✂️', nombre: 'Barbería' },   { icon: '💇', nombre: 'Peluquería' },
  { icon: '🧖', nombre: 'Spa' },        { icon: '🩺', nombre: 'Médico' },
  { icon: '🦷', nombre: 'Dentista' },   { icon: '🐾', nombre: 'Veterinaria' },
  { icon: '💪', nombre: 'Gimnasio' },   { icon: '💅', nombre: 'Estética' },
  { icon: '🤲', nombre: 'Masajes' },    { icon: '🚗', nombre: 'Lavadero' },
  { icon: '🎾', nombre: 'Canchas' },    { icon: '🏪', nombre: 'Otro' },
]

export default function EditBusinessScreen({ route, navigation }) {
  const { businessId } = route.params
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [nombre,   setNombre]   = useState('')
  const [desc,     setDesc]     = useState('')
  const [categoria, setCategoria] = useState('')
  const [allowEmp, setAllowEmp] = useState(false)
  const [eAvatarUri,   setEAvatarUri]   = useState(null)
  const [currentLogo, setCurrentLogo] = useState(null)
  const { toast, showToast, hideToast } = useToast()

  useEffect(() => {
    fetchBiz()
  }, [])

  async function fetchBiz() {
    const { data } = await supabase
      .from('businesses')
      .select('name, description, category, allow_employee_selection, logo_url')
      .eq('id', businessId)
      .single()
    if (data) {
      setNombre(data.name || '')
      setDesc(data.description || '')
      setCategoria(data.category || '')
      setAllowEmp(data.allow_employee_selection || false)
      setCurrentLogo(data.logo_url || null)
    }
    setLoading(false)
  }

async function uploadLogo(uri, businessId) {
  try {
    const ext = uri.split('.').pop()?.split('?')[0] || 'jpg'
    const path = `businesses/${businessId}-${Date.now()}.${ext}`

    const resp = await fetch(uri)
    const arrayBuffer = await resp.arrayBuffer()

    const { error } = await supabase.storage
      .from('businesses')
      .upload(path, arrayBuffer, {
        contentType: `image/${ext}`,
        upsert: true,
      })

    if (error) throw error

    return supabase.storage
      .from('businesses')
      .getPublicUrl(path).data.publicUrl

  } catch (e) {
    console.log('UPLOAD ERROR LOGO:', e)
    return null
  }
}

  async function pickImage() {
    Alert.alert(
      'Logo del comercio',
      '¿De dónde querés elegir la foto?',
      [
        {
          text: 'Cámara',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync()
            if (status !== 'granted') { showToast('Permiso de cámara denegado', 'error'); return }
            const r = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.6,
            })
            if (!r.canceled) setEAvatarUri(r.assets[0].uri)
          }
        },
        {
          text: 'Galería',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
            if (status !== 'granted') { showToast('Permiso de galería denegado', 'error'); return }
            const r = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.6,
            })
            if (!r.canceled) setEAvatarUri(r.assets[0].uri)
          }
        },
        { text: 'Cancelar', style: 'cancel' }
      ]
    )
  }
  
  async function guardar() {
    if (!nombre.trim()) {
      showToast('El nombre es requerido', 'warning')
      return
    }

    setSaving(true)

    try {
      let logoUrl = currentLogo

      if (eAvatarUri) {
        logoUrl = await uploadLogo(eAvatarUri, businessId)
      }
      const updateData = {
        name: nombre.trim(),
        description: desc.trim(),
        category: categoria,
        allow_employee_selection: allowEmp,
      }

      updateData.logo_url = logoUrl

      const { error } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', businessId)

      if (error) throw error

      showToast('Negocio actualizado', 'success')
      setTimeout(() => navigation.goBack(), 1500)

    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>
  )

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <StatusBar barStyle="light-content" />

      <Text style={s.titulo}>Editar negocio</Text>
      <Text style={s.sub}>Esta información la ven tus clientes al reservar</Text>
      <TouchableOpacity
        style={s.fotoPicker}
        onPress={pickImage}
        activeOpacity={0.85}
      >
        {eAvatarUri ? (
          <Image source={{ uri: eAvatarUri }} style={s.fotoImg} />
        ) : currentLogo ? (
          <Image source={{ uri: currentLogo }} style={s.fotoImg} />
        ) : (
          <View style={s.fotoPlaceholder}>
            <Feather name="camera" size={26} color={colors.textMuted} />
            <Text style={s.fotoLabel}>Cambiar foto</Text>
          </View>
        )}
      </TouchableOpacity>
      <Text style={s.label}>Nombre del negocio</Text>
      <View style={s.inputWrap}>
        <Feather name="briefcase" size={16} color={colors.textMuted} style={s.inputIcon} />
        <TextInput
          style={s.input}
          placeholder="Ej: Barbería El Toro"
          placeholderTextColor={colors.textMuted}
          value={nombre}
          onChangeText={setNombre}
          autoCapitalize="words"
        />
      </View>

      <Text style={s.label}>Descripción</Text>
      <TextInput
        style={s.inputMulti}
        placeholder="Contá brevemente qué ofrecés..."
        placeholderTextColor={colors.textMuted}
        value={desc}
        onChangeText={setDesc}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      <Text style={s.label}>Categoría</Text>
      <View style={s.categorias}>
        {CATEGORIAS.map(cat => (
          <TouchableOpacity
            key={cat.nombre}
            style={[s.catBtn, categoria === cat.nombre && s.catBtnActive]}
            onPress={() => setCategoria(cat.nombre)}
            activeOpacity={0.7}
          >
            <Text style={s.catIcon}>{cat.icon}</Text>
            <Text style={[s.catLabel, categoria === cat.nombre && { color: colors.primary }]}>
              {cat.nombre}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.toggleTitle}>Selección de colaborador</Text>
          <Text style={s.toggleSub}>El cliente puede elegir con quién atenderse</Text>
        </View>
        <Switch
          value={allowEmp}
          onValueChange={setAllowEmp}
          trackColor={{ false: '#333', true: colors.primary }}
          thumbColor="white"
        />
      </View>

      <TouchableOpacity style={s.btn} onPress={guardar} disabled={saving} activeOpacity={0.85}>
        {saving
          ? <ActivityIndicator color="white" />
          : <>
              <Text style={s.btnText}>Guardar cambios</Text>
              <Feather name="check" size={18} color="white" />
            </>
        }
      </TouchableOpacity>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </ScrollView>
  )
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg, paddingTop: 20, paddingHorizontal: spacing.lg },
  center:       { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  titulo:       { fontSize: 24, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5, marginBottom: 4 },
  sub:          { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg },
  label:        { fontSize: 12, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 12 },
  inputWrap:    { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14 },
  inputIcon:    { marginRight: 10 },
  input:        { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.textPrimary },
  inputMulti:   { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 14, fontSize: 14, color: colors.textPrimary, minHeight: 90, textAlignVertical: 'top' },
  categorias:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  catBtn:       { width: '30%', backgroundColor: colors.card, borderRadius: radius.md, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  catBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryGlow },
  catIcon:      { fontSize: 22, marginBottom: 4 },
  catLabel:     { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  toggleRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: 16, borderWidth: 1, borderColor: colors.border, marginTop: 16, marginBottom: 8 },
  toggleTitle:  { fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  toggleSub:    { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  btn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: radius.lg, padding: 16, marginTop: 24 },
  btnText:      { color: 'white', fontSize: 16, fontWeight: '700' },
  fotoPicker: {
  alignSelf: 'center',
  marginBottom: 20,
},

fotoImg: {
  width: 100,
  height: 100,
  borderRadius: 50,
  borderWidth: 2,
  borderColor: colors.primary,
},

fotoPlaceholder: {
  width: 100,
  height: 100,
  borderRadius: 50,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: colors.card,
  borderWidth: 1,
  borderColor: colors.border,
},

fotoLabel: {
  fontSize: 11,
  color: colors.textMuted,
  marginTop: 4,
  fontWeight: '600',
},

fotoHint: {
  fontSize: 9,
  color: colors.textMuted,
  opacity: 0.7,
},
})