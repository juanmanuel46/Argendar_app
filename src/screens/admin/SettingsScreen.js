import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Switch, Alert, TextInput, Modal, FlatList
} from 'react-native'
import { supabase } from '../../lib/supabase'

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export default function SettingsScreen() {
  const [loading,    setLoading]    = useState(true)
  const [negocio,    setNegocio]    = useState(null)
  const [servicios,  setServicios]  = useState([])
  const [empleados,  setEmpleados]  = useState([])
  const [businessId, setBusinessId] = useState(null)

  // Modales
  const [modalServicio,  setModalServicio]  = useState(false)
  const [modalEmpleado,  setModalEmpleado]  = useState(false)
  const [editServicio,   setEditServicio]   = useState(null)
  const [editEmpleado,   setEditEmpleado]   = useState(null)

  // Forms
  const [sNombre,   setSNombre]   = useState('')
  const [sPrecio,   setSPrecio]   = useState('')
  const [sDuracion, setSDuracion] = useState('30')
  const [eNombre,   setENombre]   = useState('')
  const [eRol,      setERol]      = useState('')
  const [eEmail,    setEEmail]    = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: appUser } = await supabase.from('app_users').select('business_id').eq('id', user.id).single()
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
  }, [])

  async function toggleEmpleados(val) {
    await supabase.from('businesses').update({ allow_employee_selection: val }).eq('id', businessId)
    setNegocio(prev => ({ ...prev, allow_employee_selection: val }))
  }

  // SERVICIOS
  function abrirNuevoServicio() {
    setEditServicio(null)
    setSNombre(''); setSPrecio(''); setSDuracion('30')
    setModalServicio(true)
  }

  function abrirEditarServicio(s) {
    setEditServicio(s)
    setSNombre(s.name); setSPrecio(String(s.price)); setSDuracion(String(s.duration_minutes))
    setModalServicio(true)
  }

  async function guardarServicio() {
    if (!sNombre.trim() || !sPrecio.trim()) { Alert.alert('Completá nombre y precio'); return }
    const data = { name: sNombre.trim(), price: parseInt(sPrecio), duration_minutes: parseInt(sDuracion) || 30, business_id: businessId, active: true }
    if (editServicio) {
      await supabase.from('services').update(data).eq('id', editServicio.id)
    } else {
      await supabase.from('services').insert(data)
    }
    setModalServicio(false)
    fetchData()
  }

  async function toggleServicio(s) {
    await supabase.from('services').update({ active: !s.active }).eq('id', s.id)
    fetchData()
  }

  // EMPLEADOS
  function abrirNuevoEmpleado() {
    setEditEmpleado(null)
    setENombre(''); setERol(''); setEEmail('')
    setModalEmpleado(true)
  }

  function abrirEditarEmpleado(e) {
    setEditEmpleado(e)
    setENombre(e.name); setERol(e.role || ''); setEEmail(e.email || '')
    setModalEmpleado(true)
  }

  async function guardarEmpleado() {
    if (!eNombre.trim()) { Alert.alert('Ingresá el nombre del empleado'); return }
    const data = { name: eNombre.trim(), role: eRol.trim(), email: eEmail.trim().toLowerCase() || null, business_id: businessId, active: true }
    if (editEmpleado) {
      await supabase.from('employees').update(data).eq('id', editEmpleado.id)
    } else {
      await supabase.from('employees').insert(data)
    }
    setModalEmpleado(false)
    if (!editEmpleado && eEmail.trim()) {
      Alert.alert('✓ Empleado agregado', `Si ${eNombre} descarga Bookzy e inicia sesión con ${eEmail}, podrá ver sus turnos automáticamente.`)
    }
    fetchData()
  }

  async function toggleEmpleadoActivo(e) {
    await supabase.from('employees').update({ active: !e.active }).eq('id', e.id)
    fetchData()
  }

  if (loading) return <View style={s.center}><ActivityIndicator color="#7C5CFC" size="large" /></View>

  const diasTrialRestantes = negocio?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(negocio.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <>
      <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={s.titulo}>Configuración</Text>
        <Text style={s.sub}>{negocio?.name}</Text>

        {/* Suscripción */}
        <Text style={s.seccion}>Suscripción</Text>
        <View style={s.seccionCard}>
          <View style={s.subRow}>
            <View>
              <Text style={s.subEstado}>
                {negocio?.subscription_status === 'trial' ? '🟡 Período de prueba' :
                 negocio?.subscription_status === 'active' ? '🟢 Activa' : '🔴 Vencida'}
              </Text>
              {negocio?.subscription_status === 'trial' && diasTrialRestantes !== null && (
                <Text style={s.subDias}>{diasTrialRestantes} días restantes de prueba gratuita</Text>
              )}
              {negocio?.subscription_status === 'active' && (
                <Text style={s.subDias}>$5 USD/mes · Próximo cobro: 30 días</Text>
              )}
            </View>
            {negocio?.subscription_status !== 'active' && (
              <TouchableOpacity style={s.btnActivar} onPress={() => Alert.alert('Activar', 'Contactanos para activar tu suscripción por $5 USD/mes')}>
                <Text style={s.btnActivarText}>Activar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tu link */}
        <Text style={s.seccion}>Tu link de reservas</Text>
        <View style={s.seccionCard}>
          <View style={s.configItem}>
            <Text style={s.configIcon}>🔗</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.configTitulo}>bookzy.com.ar/{negocio?.slug}</Text>
              <Text style={s.configSub}>Compartí este link con tus clientes</Text>
            </View>
          </View>
        </View>

        {/* Servicios */}
        <View style={s.seccionHeader}>
          <Text style={s.seccion}>Servicios</Text>
          <TouchableOpacity onPress={abrirNuevoServicio}>
            <Text style={s.btnAgregar}>+ Agregar</Text>
          </TouchableOpacity>
        </View>
        <View style={s.seccionCard}>
          {servicios.length === 0 && (
            <View style={s.configItem}>
              <Text style={s.configSub}>No hay servicios. Agregá el primero.</Text>
            </View>
          )}
          {servicios.map((serv, i) => (
            <View key={serv.id}>
              {i > 0 && <View style={s.divider} />}
              <TouchableOpacity style={s.configItem} onPress={() => abrirEditarServicio(serv)}>
                <Text style={s.configIcon}>✂️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.configTitulo, !serv.active && { color: '#555' }]}>{serv.name}</Text>
                  <Text style={s.configSub}>{serv.duration_minutes} min · ${serv.price}</Text>
                </View>
                <Switch
                  value={serv.active}
                  onValueChange={() => toggleServicio(serv)}
                  trackColor={{ false: '#333', true: '#7C5CFC' }}
                  thumbColor="white"
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Empleados */}
        <View style={s.seccionHeader}>
          <Text style={s.seccion}>Empleados</Text>
          <TouchableOpacity onPress={abrirNuevoEmpleado}>
            <Text style={s.btnAgregar}>+ Agregar</Text>
          </TouchableOpacity>
        </View>
        <View style={s.seccionCard}>
          <View style={s.configItem}>
            <Text style={s.configIcon}>👥</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.configTitulo}>Selección de colaborador</Text>
              <Text style={s.configSub}>El cliente elige con quién atenderse</Text>
            </View>
            <Switch
              value={negocio?.allow_employee_selection || false}
              onValueChange={toggleEmpleados}
              trackColor={{ false: '#333', true: '#7C5CFC' }}
              thumbColor="white"
            />
          </View>
          {empleados.length > 0 && <View style={s.divider} />}
          {empleados.map((emp, i) => (
            <View key={emp.id}>
              {i > 0 && <View style={s.divider} />}
              <TouchableOpacity style={s.configItem} onPress={() => abrirEditarEmpleado(emp)}>
                <View style={s.empAvatar}>
                  <Text style={s.empAvatarText}>{emp.name.slice(0,2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.configTitulo, !emp.active && { color: '#555' }]}>{emp.name}</Text>
                  <Text style={s.configSub}>{emp.role || 'Empleado'}{emp.email ? ` · ${emp.email}` : ''}</Text>
                </View>
                <Switch
                  value={emp.active}
                  onValueChange={() => toggleEmpleadoActivo(emp)}
                  trackColor={{ false: '#333', true: '#7C5CFC' }}
                  thumbColor="white"
                />
              </TouchableOpacity>
            </View>
          ))}
          {empleados.length === 0 && (
            <View style={[s.configItem, { paddingTop: 0 }]}>
              <Text style={s.configSub}>No hay empleados. Agregá el primero.</Text>
            </View>
          )}
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity style={s.btnLogout} onPress={() => supabase.auth.signOut()}>
          <Text style={s.btnLogoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Servicio */}
      <Modal visible={modalServicio} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitulo}>{editServicio ? 'Editar servicio' : 'Nuevo servicio'}</Text>
            <Text style={s.modalLabel}>Nombre</Text>
            <TextInput style={s.modalInput} value={sNombre} onChangeText={setSNombre} placeholder="Corte de cabello" placeholderTextColor="#555" />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.modalLabel}>Precio $</Text>
                <TextInput style={s.modalInput} value={sPrecio} onChangeText={setSPrecio} keyboardType="numeric" placeholder="3500" placeholderTextColor="#555" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.modalLabel}>Duración (min)</Text>
                <TextInput style={s.modalInput} value={sDuracion} onChangeText={setSDuracion} keyboardType="numeric" placeholder="30" placeholderTextColor="#555" />
              </View>
            </View>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalBtnCancel} onPress={() => setModalServicio(false)}>
                <Text style={s.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalBtnOk} onPress={guardarServicio}>
                <Text style={s.modalBtnOkText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Empleado */}
      <Modal visible={modalEmpleado} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitulo}>{editEmpleado ? 'Editar empleado' : 'Nuevo empleado'}</Text>
            <Text style={s.modalLabel}>Nombre completo *</Text>
            <TextInput style={s.modalInput} value={eNombre} onChangeText={setENombre} placeholder="Matías Herrera" placeholderTextColor="#555" autoCapitalize="words" />
            <Text style={s.modalLabel}>Rol / Especialidad</Text>
            <TextInput style={s.modalInput} value={eRol} onChangeText={setERol} placeholder="Barbero Senior" placeholderTextColor="#555" />
            <Text style={s.modalLabel}>Email (para que inicie sesión en la app)</Text>
            <TextInput style={s.modalInput} value={eEmail} onChangeText={setEEmail} placeholder="matias@email.com" placeholderTextColor="#555" keyboardType="email-address" autoCapitalize="none" />
            <Text style={s.modalHint}>💡 Si ingresás el email, el empleado podrá descargar Bookzy e iniciar sesión para ver sus turnos automáticamente.</Text>
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.modalBtnCancel} onPress={() => setModalEmpleado(false)}>
                <Text style={s.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalBtnOk} onPress={guardarEmpleado}>
                <Text style={s.modalBtnOkText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  )
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#111', paddingTop: 56, paddingHorizontal: 20 },
  center:           { flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  titulo:           { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  sub:              { fontSize: 14, color: '#666', marginBottom: 24 },
  seccion:          { fontSize: 12, fontWeight: '600', color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 8 },
  seccionHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 10 },
  btnAgregar:       { color: '#c87aff', fontSize: 14, fontWeight: '600' },
  seccionCard:      { backgroundColor: '#1c1c1e', borderRadius: 16, borderWidth: 1, borderColor: '#2a2a2d', marginBottom: 8, overflow: 'hidden' },
  configItem:       { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  configIcon:       { fontSize: 22 },
  configTitulo:     { fontSize: 15, color: '#fff', fontWeight: '500' },
  configSub:        { fontSize: 12, color: '#666', marginTop: 2 },
  divider:          { height: 1, backgroundColor: '#222', marginHorizontal: 14 },
  subRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  subEstado:        { fontSize: 15, color: '#fff', fontWeight: '600', marginBottom: 4 },
  subDias:          { fontSize: 12, color: '#666' },
  btnActivar:       { backgroundColor: '#7C5CFC', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  btnActivarText:   { color: 'white', fontWeight: '700', fontSize: 13 },
  empAvatar:        { width: 36, height: 36, borderRadius: 18, backgroundColor: '#7C5CFC', justifyContent: 'center', alignItems: 'center' },
  empAvatarText:    { color: 'white', fontWeight: '800', fontSize: 13 },
  btnLogout:        { borderWidth: 1, borderColor: 'rgba(255,79,79,0.3)', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  btnLogoutText:    { color: '#ff6b6b', fontWeight: '600', fontSize: 15 },
  // Modal
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard:        { backgroundColor: '#1c1c1e', borderRadius: 24, padding: 24, paddingBottom: 36, borderTopWidth: 1, borderColor: '#2a2a2d' },
  modalTitulo:      { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 20 },
  modalLabel:       { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 6, marginTop: 8 },
  modalInput:       { backgroundColor: '#2a2a2d', borderRadius: 12, padding: 13, fontSize: 15, color: '#fff', borderWidth: 1, borderColor: '#333', marginBottom: 4 },
  modalHint:        { fontSize: 12, color: '#666', lineHeight: 18, marginTop: 8, marginBottom: 8 },
  modalBtns:        { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalBtnCancel:   { flex: 1, borderWidth: 1, borderColor: '#333', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalBtnCancelText: { color: '#888', fontWeight: '600' },
  modalBtnOk:       { flex: 1, backgroundColor: '#7C5CFC', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalBtnOkText:   { color: 'white', fontWeight: '700' },
})