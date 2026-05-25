import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { supabase } from '../../lib/supabase'

const FILTROS = ['Todos', 'Pendientes', 'Completados', 'Cancelados']
const STATUS_MAP = { 'Todos': null, 'Pendientes': 'pending', 'Completados': 'done', 'Cancelados': 'cancelled' }
const ESTADOS = { pending: 'Pendiente', done: '✓ Listo', cancelled: 'Cancelado' }
const BADGE = { pending: { bg: 'rgba(124,92,252,0.15)', color: '#a78bfa' }, done: { bg: 'rgba(77,217,172,0.15)', color: '#4dd9ac' }, cancelled: { bg: 'rgba(255,79,79,0.12)', color: '#ff6b6b' } }

export default function AppointmentsScreen() {
  const [loading, setLoading] = useState(true)
  const [turnos, setTurnos] = useState([])
  const [filtro, setFiltro] = useState('Todos')
  const [businessId, setBusinessId] = useState(null)

  useEffect(() => {
    fetchBusinessId()
  }, [])

  useEffect(() => {
    if (businessId) fetchTurnos()
  }, [businessId, filtro])

  async function fetchBusinessId() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: appUser } = await supabase.from('app_users').select('business_id').eq('id', user.id).single()
    setBusinessId(appUser?.business_id)
  }

  async function fetchTurnos() {
    setLoading(true)
    const hoy = new Date().toISOString().split('T')[0]
    let query = supabase
      .from('appointments')
      .select('*, clients(name, phone), services(name, price), employees(name)')
      .eq('business_id', businessId)
      .eq('date', hoy)
      .order('time')

    const status = STATUS_MAP[filtro]
    if (status) query = query.eq('status', status)

    const { data } = await query
    setTurnos(data ?? [])
    setLoading(false)
  }

  async function cambiarEstado(id, nuevoEstado) {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: nuevoEstado })
      .eq('id', id)
      .select()

    console.log('nuevoEstado:', nuevoEstado)
    console.log('data:', data)
    console.log('error:', error)
  }

  return (
    <View style={s.container}>
      <Text style={s.titulo}>Turnos de hoy</Text>
      <Text style={s.fecha}>{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>

      {/* Filtros */}
      <View style={s.filtros}>
        {FILTROS.map(f => (
          <TouchableOpacity key={f} onPress={() => setFiltro(f)}
            style={[s.filtroBtn, filtro === f && s.filtroBtnActive]}>
            <Text style={[s.filtroText, filtro === f && s.filtroTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && <ActivityIndicator color="#7C5CFC" style={{ marginTop: 40 }} />}

      {!loading && turnos.length === 0 && (
        <View style={s.center}>
          <Text style={s.empty}>No hay turnos {filtro !== 'Todos' ? filtro.toLowerCase() : ''} hoy</Text>
        </View>
      )}

      <FlatList
        data={turnos}
        keyExtractor={t => t.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardTop}>
              <Text style={s.hora}>{item.time?.slice(0, 5)}</Text>
              <View style={[s.badge, { backgroundColor: BADGE[item.status]?.bg }]}>
                <Text style={[s.badgeText, { color: BADGE[item.status]?.color }]}>{ESTADOS[item.status]}</Text>
              </View>
            </View>
            <Text style={s.cliente}>{item.clients?.name}</Text>
            <Text style={s.servicio}>{item.services?.name} · ${item.services?.price}</Text>
            {item.employees?.name && <Text style={s.empleado}>👤 {item.employees.name}</Text>}
            <Text style={s.tel}>{item.clients?.phone}</Text>

            {item.status === 'pending' && (
              <View style={s.acciones}>
                <TouchableOpacity style={s.btnListo} onPress={() => cambiarEstado(item.id, 'done')}>
                  <Text style={s.btnListoText}>✓ Listo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btnCancelar} onPress={() => cambiarEstado(item.id, 'cancelled')}>
                  <Text style={s.btnCancelarText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 20, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  titulo: { fontSize: 24, fontWeight: '800', color: '#F0F0F8', marginBottom: 4 },
  fecha: { fontSize: 14, color: '#7A7A9A', marginBottom: 16, textTransform: 'capitalize' },
  filtros: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  filtroBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(124,92,252,0.2)', backgroundColor: '#13131A' },
  filtroBtnActive: { backgroundColor: 'rgba(124,92,252,0.15)', borderColor: '#7C5CFC' },
  filtroText: { fontSize: 13, color: '#7A7A9A', fontWeight: '500' },
  filtroTextActive: { color: '#7C5CFC' },
  empty: { color: '#7A7A9A', fontSize: 16 },
  card: { backgroundColor: '#13131A', borderWidth: 1, borderColor: 'rgba(124,92,252,0.2)', borderRadius: 16, padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  hora: { fontSize: 20, fontWeight: '700', color: '#F0F0F8' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  cliente: { fontSize: 16, fontWeight: '600', color: '#F0F0F8', marginBottom: 2 },
  servicio: { fontSize: 13, color: '#7A7A9A', marginBottom: 2 },
  empleado: { fontSize: 13, color: '#7A7A9A', marginBottom: 2 },
  tel: { fontSize: 13, color: '#7A7A9A', marginBottom: 12 },
  acciones: { flexDirection: 'row', gap: 8 },
  btnListo: { flex: 1, backgroundColor: '#7C5CFC', borderRadius: 10, padding: 10, alignItems: 'center' },
  btnListoText: { color: 'white', fontWeight: '700', fontSize: 14 },
  btnCancelar: { flex: 1, backgroundColor: '#1C1C26', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  btnCancelarText: { color: '#ff6b6b', fontWeight: '600', fontSize: 14 },
})