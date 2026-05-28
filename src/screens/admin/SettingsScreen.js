import { useState, useCallback } from 'react'
import {View, Text, StyleSheet, TouchableOpacity, ScrollView,ActivityIndicator, Switch, Alert, TextInput, Modal, Image} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Feather } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../lib/supabase'
import { colors, radius, spacing } from '../../lib/theme'
import { getCategoryIcon } from '../../lib/categoryIcons'
import { Toast, useToast } from '../../components/Toast'

export default function SettingsScreen({ navigation }) {
  const [loading,     setLoading]     = useState(true)
  const [negocio,     setNegocio]     = useState(null)
  const [servicios,   setServicios]   = useState([])
  const [empleados,   setEmpleados]   = useState([])
  const [businessId,  setBusinessId]  = useState(null)
  const [user,        setUser]        = useState(null)

  // Modales
  const [modalServicio, setModalServicio] = useState(false)
  const [modalEmpleado, setModalEmpleado] = useState(false)
  const [editServicio,  setEditServicio]  = useState(null)
  const [editEmpleado,  setEditEmpleado]  = useState(null)

  // Form servicio
  const [sNombre,   setSNombre]   = useState('')
  const [sPrecio,   setSPrecio]   = useState('')
  const [sDuracion, setSDuracion] = useState('30')

  // Form empleado
  const [eNombre,      setENombre]      = useState('')
  const [eRol,         setERol]         = useState('')
  const [eEmail,       setEEmail]       = useState('')
  const [eAvatarUri,   setEAvatarUri]   = useState(null)
  const [uploadingImg, setUploadingImg] = useState(false)

  const { toast, showToast, hideToast } = useToast()

  useFocusEffect(useCallback(() => { fetchData() }, []))

  async function fetchData() {
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)
    const { data: appUser } = await supabase
      .from('app_users').select('business_id').eq('id', u.id).single()
    if (!appUser) { setLoading(false); return }
    setBusinessId(appUser.business_id)

    const [{ data: biz }, { data: servs }, { data: emps }] = await Promise.all([
      supabase.from('businesses').select('*').eq('id', appUser.business_id).single(),
      supabase.from('services').select('*').eq('business_id', appUser.business_id).order('name'),
      supabase.from('employees').select('*').eq('business_id', appUser.business_id).order('name'),
    ])
    setNegocio(biz)
    setServicios(servs ?? [])
    setEmpleados(emps ?? [])
    setLoading(false)
  }

  // ── Toggle selección empleados ──────────────────────────────────────────
  async function toggleSeleccionEmpleado(val) {
    await supabase.from('businesses').update({ allow_employee_selection: val }).eq('id', businessId)
    setNegocio(prev => ({ ...prev, allow_employee_selection: val }))
  }

  // ── Servicios ───────────────────────────────────────────────────────────
  function abrirNuevoServicio() {
    setEditServicio(null); setSNombre(''); setSPrecio(''); setSDuracion('30')
    setModalServicio(true)
  }
  function abrirEditarServicio(s) {
    setEditServicio(s); setSNombre(s.name); setSPrecio(String(s.price)); setSDuracion(String(s.duration_minutes))
    setModalServicio(true)
  }
  async function guardarServicio() {
    if (!sNombre.trim() || !sPrecio.trim()) { showToast('Completá nombre y precio', 'warning'); return }
    const row = { name: sNombre.trim(), price: parseInt(sPrecio), duration_minutes: parseInt(sDuracion)||30, business_id: businessId, active: true }
    editServicio
      ? await supabase.from('services').update(row).eq('id', editServicio.id)
      : await supabase.from('services').insert(row)
    setModalServicio(false); fetchData()
  }
  async function eliminarServicio(s) {
    Alert.alert('Eliminar servicio', `¿Eliminar "${s.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await supabase.from('services').delete().eq('id', s.id); fetchData()
      }},
    ])
  }
  async function toggleServicio(s) {
    await supabase.from('services').update({ active: !s.active }).eq('id', s.id)
    setServicios(prev => prev.map(x => x.id===s.id ? {...x,active:!s.active} : x))
  }

  // ── Empleados ───────────────────────────────────────────────────────────
  function abrirNuevoEmpleado() {
    setEditEmpleado(null); setENombre(''); setERol(''); setEEmail(''); setEAvatarUri(null)
    setModalEmpleado(true)
  }
  function abrirEditarEmpleado(e) {
    setEditEmpleado(e); setENombre(e.name); setERol(e.role||''); setEEmail(e.email||'')
    setEAvatarUri(e.avatar_url||null); setModalEmpleado(true)
  }
// ── Picker: cámara O galería ─────────────────────────────────────────
async function pickImage() {
  Alert.alert(
    'Foto del empleado',
    '¿De dónde querés elegir la foto?',
    [
      {
        text: 'Cámara',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync()
          if (status !== 'granted') { Alert.alert('Permiso de cámara denegado'); return }
          const r = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6,
          })
          if (!r.canceled) setEAvatarUri(r.assets[0].uri)
        }
      },
      {
        text: 'Galería',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
          if (status !== 'granted') { Alert.alert('Permiso de galería denegado'); return }
          const r = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6,
          })
          if (!r.canceled) setEAvatarUri(r.assets[0].uri)
        }
      },
      { text: 'Cancelar', style: 'cancel' }
    ]
  )
}
async function uploadAvatar(uri) {
  try {
    const ext  = uri.split('.').pop()?.split('?')[0] || 'jpg'
    const path = `empleados/${Date.now()}.${ext}`

    const resp       = await fetch(uri)
    const arrayBuffer = await resp.arrayBuffer()

    const { error } = await supabase.storage
      .from('avatars')
      .upload(path, arrayBuffer, { contentType: `image/${ext}`, upsert: true })

    if (error) throw error

    return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
  } catch (e) {
    console.error('Upload:', e)
    return null
  }
}
async function guardarEmpleado() {
  if (!eNombre.trim()) { showToast('Ingresá el nombre del empleado', 'warning'); return }
  setUploadingImg(true)

  let avatarUrl = editEmpleado?.avatar_url || null
  if (eAvatarUri && eAvatarUri !== editEmpleado?.avatar_url) {
    avatarUrl = await uploadAvatar(eAvatarUri)
  }

  const row = {
    name:        eNombre.trim(),
    role:        eRol.trim() || null,
    email:       eEmail.trim().toLowerCase() || null,
    avatar_url:  avatarUrl,
    business_id: businessId,
    active:      true,
  }

  if (editEmpleado) {
    await supabase.from('employees').update(row).eq('id', editEmpleado.id)
  } else {
    const { data: empInsertado } = await supabase
      .from('employees')
      .insert(row)
      .select()
      .single()

    if (eEmail.trim() && empInsertado) {
      const { error: fnError } = await supabase.functions.invoke('invite-employee', {
        body: { email: eEmail.trim().toLowerCase(), negocio: negocio?.name }
      })
      if (fnError) {
        showToast(`${eNombre} fue agregado`, 'success')
      } else {
        showToast(`Invitación enviada a ${eEmail}`, 'success')
      }
    } else {
      showToast(`${eNombre} fue agregado`, 'success')
    }
  }

  setUploadingImg(false)
  setModalEmpleado(false)
  fetchData()
}
  async function eliminarEmpleado(e) {
    Alert.alert('Eliminar empleado', `¿Eliminar a ${e.name} del sistema? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        await supabase.from('employees').delete().eq('id', e.id); fetchData()
      }},
    ])
  }
  async function toggleEmpleadoActivo(e) {
    await supabase.from('employees').update({ active: !e.active }).eq('id', e.id)
    setEmpleados(prev => prev.map(x => x.id===e.id ? {...x,active:!e.active} : x))
  }

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>

  const diasTrial = negocio?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(negocio.trial_ends_at) - new Date()) / 86400000))
    : null

  return (
    <>
      <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Text style={s.titulo}>Ajustes</Text>
        <Text style={s.sub}>{negocio?.name}</Text>

        {/* ── Negocio ── */}
        <Text style={s.seccion}>Mi negocio</Text>
        <View style={s.card}>
          <TouchableOpacity
            style={s.row}
            onPress={() => navigation.navigate('EditBusiness', { businessId })}
            activeOpacity={0.7}
          >
            <View style={[s.iconBox, { backgroundColor: colors.primaryGlow }]}>
              <Feather name="briefcase" size={15} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>{negocio?.name}</Text>
              <Text style={s.rowSub}>{negocio?.category} · Editar info del negocio</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={s.divider} />

          <View style={s.row}>
            <View style={[s.iconBox, { backgroundColor: colors.primaryGlow }]}>
              <Feather name="link" size={15} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>argendar.com.ar/{negocio?.slug}</Text>
              <Text style={s.rowSub}>Tu link de reservas · compartí con tus clientes</Text>
            </View>
          </View>
        </View>

        {/* ── Suscripción ── */}
        <Text style={s.seccion}>Suscripción</Text>
        <TouchableOpacity
          style={s.card}
          onPress={() => navigation.navigate('Subscription')}
          activeOpacity={0.7}
        >
          <View style={s.row}>
            <View style={[s.iconBox, { backgroundColor: colors.warningBg }]}>
              <Feather name="zap" size={15} color={colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>
                {negocio?.subscription_status === 'trial'  ? 'Período de prueba' :
                 negocio?.subscription_status === 'active' ? 'Plan activo' : 'Suscripción vencida'}
              </Text>
              <Text style={s.rowSub}>
                {negocio?.subscription_status === 'trial' && diasTrial !== null
                  ? `${diasTrial} días restantes · Tocá para activar`
                  : negocio?.subscription_status === 'active'
                  ? '$5 USD/mes'
                  : 'Activá tu plan para seguir recibiendo reservas'}
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </View>
        </TouchableOpacity>

        {/* ── Servicios ── */}
        <View style={s.seccionRow}>
          <Text style={s.seccion}>Servicios</Text>
          <TouchableOpacity onPress={abrirNuevoServicio}>
            <Text style={s.addBtn}>+ Agregar</Text>
          </TouchableOpacity>
        </View>
        <View style={s.card}>
          {servicios.length === 0 && (
            <Text style={s.emptyMsg}>No hay servicios. Agregá el primero.</Text>
          )}
          {servicios.map((serv, i) => (
            <View key={serv.id}>
              {i > 0 && <View style={s.divider} />}
              <View style={s.row}>
                <View style={[s.iconBox, { backgroundColor: colors.primaryGlow }]}>
                  <Feather name={getCategoryIcon(negocio?.category)} size={14} color={colors.primary} />
                </View>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => abrirEditarServicio(serv)}>
                  <Text style={[s.rowTitle, !serv.active && { color: colors.textMuted }]}>{serv.name}</Text>
                  <Text style={s.rowSub}>{serv.duration_minutes} min · ${serv.price}</Text>
                </TouchableOpacity>
                <Switch value={serv.active} onValueChange={() => toggleServicio(serv)} trackColor={{false:'#333',true:colors.primary}} thumbColor="white" />
                <TouchableOpacity onPress={() => eliminarServicio(serv)} style={{ padding: 6, marginLeft: 4 }}>
                  <Feather name="trash-2" size={14} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* ── Empleados ── */}
        <View style={s.seccionRow}>
          <Text style={s.seccion}>Empleados</Text>
          <TouchableOpacity onPress={abrirNuevoEmpleado}>
            <Text style={s.addBtn}>+ Agregar</Text>
          </TouchableOpacity>
        </View>
        <View style={s.card}>
          {/* Toggle selección */}
          <View style={s.row}>
            <View style={[s.iconBox, { backgroundColor: colors.primaryGlow }]}>
              <Feather name="users" size={14} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>Selección de colaborador</Text>
              <Text style={s.rowSub}>El cliente elige con quién atenderse</Text>
            </View>
            <Switch value={negocio?.allow_employee_selection||false} onValueChange={toggleSeleccionEmpleado} trackColor={{false:'#333',true:colors.primary}} thumbColor="white" />
          </View>

          {empleados.map((emp, i) => (
            <View key={emp.id}>
              <View style={s.divider} />
              <View style={s.row}>
                {/* Avatar */}
                {emp.avatar_url
                  ? <Image source={{ uri: emp.avatar_url }} style={s.empAvatar} />
                  : <View style={s.empAvatarFallback}>
                      <Text style={s.empAvatarText}>{emp.name.slice(0,2).toUpperCase()}</Text>
                    </View>
                }
                {/* Info → toca para horarios */}
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => navigation.navigate('EmployeeSchedule', { employee: emp })}
                >
                  <Text style={[s.rowTitle, !emp.active && { color: colors.textMuted }]}>{emp.name}</Text>
                  <Text style={s.rowSub}>
                    {emp.role || 'Empleado'}
                    {emp.email ? ` · ${emp.email}` : ''}
                    {' · '}
                    <Text style={{ color: colors.primary }}>Ver horarios →</Text>
                  </Text>
                </TouchableOpacity>
                {/* Editar */}
                <TouchableOpacity onPress={() => abrirEditarEmpleado(emp)} style={{ padding: 6 }}>
                  <Feather name="edit-2" size={14} color={colors.textMuted} />
                </TouchableOpacity>
                {/* Eliminar */}
                <TouchableOpacity onPress={() => eliminarEmpleado(emp)} style={{ padding: 6 }}>
                  <Feather name="trash-2" size={14} color={colors.danger} />
                </TouchableOpacity>
                {/* Toggle activo */}
                <Switch value={emp.active} onValueChange={() => toggleEmpleadoActivo(emp)} trackColor={{false:'#333',true:colors.primary}} thumbColor="white" />
              </View>
            </View>
          ))}
          {empleados.length === 0 && (
            <><View style={s.divider} /><Text style={s.emptyMsg}>No hay empleados. Agregá el primero.</Text></>
          )}
        </View>

        {/* ── Cuenta ── */}
        <Text style={s.seccion}>Cuenta</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={[s.iconBox, { backgroundColor: colors.card }]}>
              <Feather name="user" size={15} color={colors.textMuted} />
            </View>
            <Text style={[s.rowTitle, { flex: 1 }]}>{user?.email}</Text>
          </View>
        </View>

        <TouchableOpacity style={s.btnLogout} onPress={() => supabase.auth.signOut()}>
          <Feather name="log-out" size={16} color={colors.danger} />
          <Text style={s.btnLogoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Modal Servicio ── */}
      <Modal visible={modalServicio} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>{editServicio ? 'Editar servicio' : 'Nuevo servicio'}</Text>
            <Text style={s.sheetLabel}>Nombre</Text>
            <TextInput style={s.sheetInput} value={sNombre} onChangeText={setSNombre} placeholder="Corte de cabello" placeholderTextColor={colors.textMuted} />
            <View style={{ flexDirection:'row', gap:12 }}>
              <View style={{ flex:1 }}>
                <Text style={s.sheetLabel}>Precio $</Text>
                <TextInput style={s.sheetInput} value={sPrecio} onChangeText={setSPrecio} keyboardType="numeric" placeholder="3500" placeholderTextColor={colors.textMuted} />
              </View>
              <View style={{ flex:1 }}>
                <Text style={s.sheetLabel}>Duración (min)</Text>
                <TextInput style={s.sheetInput} value={sDuracion} onChangeText={setSDuracion} keyboardType="numeric" placeholder="30" placeholderTextColor={colors.textMuted} />
              </View>
            </View>
            <View style={s.sheetBtns}>
              <TouchableOpacity style={s.sheetCancel} onPress={() => setModalServicio(false)}>
                <Text style={s.sheetCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.sheetOk} onPress={guardarServicio}>
                <Text style={s.sheetOkText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal Empleado ── */}
      <Modal visible={modalEmpleado} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>{editEmpleado ? 'Editar empleado' : 'Nuevo empleado'}</Text>
            {/* Foto */}
            <TouchableOpacity style={s.fotoPicker} onPress={pickImage} activeOpacity={0.8}>
              {eAvatarUri
                ? <Image source={{ uri: eAvatarUri }} style={s.fotoImg} />
                : <View style={s.fotoPlaceholder}>
                    <Feather name="camera" size={22} color={colors.textMuted} />
                    <Text style={s.fotoLabel}>Foto</Text>
                  </View>
              }
            </TouchableOpacity>
            <Text style={s.sheetLabel}>Nombre *</Text>
            <TextInput style={s.sheetInput} value={eNombre} onChangeText={setENombre} placeholder="Matías Herrera" placeholderTextColor={colors.textMuted} autoCapitalize="words" />
            <Text style={s.sheetLabel}>Rol / Especialidad</Text>
            <TextInput style={s.sheetInput} value={eRol} onChangeText={setERol} placeholder="Barbero Senior" placeholderTextColor={colors.textMuted} />
            <Text style={s.sheetLabel}>Email (acceso a la app)</Text>
            <TextInput style={s.sheetInput} value={eEmail} onChangeText={setEEmail} placeholder="matias@email.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
            <Text style={s.sheetHint}>
              Con el email, el empleado puede descargar la app e iniciar sesión para ver sus turnos.
            </Text>
            <View style={s.sheetBtns}>
              <TouchableOpacity style={s.sheetCancel} onPress={() => setModalEmpleado(false)}>
                <Text style={s.sheetCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.sheetOk} onPress={guardarEmpleado} disabled={uploadingImg}>
                {uploadingImg ? <ActivityIndicator color="white" size="small" /> : <Text style={s.sheetOkText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </>
  )
}

const s = StyleSheet.create({
  root:             { flex:1, backgroundColor:colors.bg, paddingTop:56, paddingHorizontal:20 },
  center:           { flex:1, backgroundColor:colors.bg, justifyContent:'center', alignItems:'center' },
  titulo:           { fontSize:26, fontWeight:'800', color:colors.textPrimary, marginBottom:4 },
  sub:              { fontSize:14, color:colors.textMuted, marginBottom:24 },
  seccion:          { fontSize:12, fontWeight:'700', color:colors.textMuted, textTransform:'uppercase', letterSpacing:1, marginBottom:8, marginTop:12 },
  seccionRow:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:12, marginBottom:8 },
  addBtn:           { color:colors.primary, fontSize:14, fontWeight:'600' },
  card:             { backgroundColor:colors.card, borderRadius:radius.lg, borderWidth:1, borderColor:colors.cardBorder, overflow:'hidden', marginBottom:4 },
  row:              { flexDirection:'row', alignItems:'center', padding:14, gap:12 },
  rowTitle:         { fontSize:15, color:colors.textPrimary, fontWeight:'500' },
  rowSub:           { fontSize:12, color:colors.textMuted, marginTop:2 },
  iconBox:          { width:34, height:34, borderRadius:radius.sm, justifyContent:'center', alignItems:'center' },
  divider:          { height:1, backgroundColor:colors.border, marginHorizontal:14 },
  emptyMsg:         { padding:14, color:colors.textMuted, fontSize:13 },
  empAvatar:        { width:36, height:36, borderRadius:radius.full },
  empAvatarFallback:{ width:36, height:36, borderRadius:radius.full, backgroundColor:colors.primaryGlow, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:colors.border },
  empAvatarText:    { color:colors.primary, fontWeight:'700', fontSize:12 },
  btnLogout:        { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, borderWidth:1, borderColor:'rgba(248,113,113,0.3)', borderRadius:radius.md, padding:16, marginTop:24 },
  btnLogoutText:    { color:colors.danger, fontWeight:'600', fontSize:15 },
  overlay:          { flex:1, backgroundColor:'rgba(0,0,0,0.75)', justifyContent:'flex-end' },
  sheet:            { backgroundColor:colors.card, borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, paddingBottom:40, borderTopWidth:1, borderColor:colors.border },
  handle:           { width:36, height:4, borderRadius:2, backgroundColor:colors.border, alignSelf:'center', marginBottom:20 },
  sheetTitle:       { fontSize:18, fontWeight:'700', color:colors.textPrimary, marginBottom:20 },
  sheetLabel:       { fontSize:12, color:colors.textMuted, fontWeight:'600', textTransform:'uppercase', letterSpacing:0.8, marginBottom:6, marginTop:12 },
  sheetInput:       { backgroundColor:colors.input, borderRadius:radius.md, padding:13, fontSize:15, color:colors.textPrimary, borderWidth:1, borderColor:colors.border },
  sheetHint:        { fontSize:12, color:colors.textMuted, lineHeight:18, marginTop:10 },
  sheetBtns:        { flexDirection:'row', gap:12, marginTop:20 },
  sheetCancel:      { flex:1, borderWidth:1, borderColor:colors.border, borderRadius:radius.md, padding:14, alignItems:'center' },
  sheetCancelText:  { color:colors.textMuted, fontWeight:'600' },
  sheetOk:          { flex:1, backgroundColor:colors.primary, borderRadius:radius.md, padding:14, alignItems:'center' },
  sheetOkText:      { color:'white', fontWeight:'700' },
  fotoPicker:       { alignSelf:'center', marginBottom:8 },
  fotoImg:          { width:72, height:72, borderRadius:radius.full },
  fotoPlaceholder:  { width:72, height:72, borderRadius:radius.full, backgroundColor:colors.input, borderWidth:1, borderColor:colors.border, justifyContent:'center', alignItems:'center', gap:4 },
  fotoLabel:        { fontSize:10, color:colors.textMuted },
})