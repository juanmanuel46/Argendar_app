import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function TodayScreen() {
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTurnos()
  }, [])

  async function fetchTurnos() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: appUser } = await supabase.from('app_users').select('employee_id, business_id').eq('id', user.id).single()
    if (!appUser) { setLoading(false); return }

    const hoy = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('appointments')
      .select('*, clients(name, phone), services(name, price)')
      .eq('date', hoy)
      .eq('employee_id', appUser.employee_id)
      .order('time')

    setTurnos(data ?? [])
    setLoading(false)
  }

  async function cambiarEstado(id, nuevoEstado) {
    await supabase.from('appointments').update({ status: nuevoEstado }).eq('id', id)
    fetchTurnos()
  }

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color="#7C5CFC" />
    </View>
  )

  return (
    <View style={s.container}>
      <Text style={s.titulo}>Mis turnos de hoy</Text>
      <Text style={s.fecha}>{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>

      {turnos.length === 0 && (
        <View style={s.center}>
          <Text style={s.empty}>No tenés turnos para hoy 🎉</Text>
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
              <View style={[s.badge, s.badgeColors[item.status] || s.badgeColors.pending]}>
                <Text style={s.badgeText}>{ESTADOS[item.status] || item.status}</Text>
              </View>
            </View>
            <Text style={s.cliente}>{item.clients?.name}</Text>
            <Text style={s.servicio}>{item.services?.name} · ${item.services?.price}</Text>
            <Text style={s.tel}>{item.clients?.phone}</Text>

            {(item.status === 'pending') && (
              <View style={s.acciones}>
                <TouchableOpacity style={s.btnListo} onPress={() => cambiarEstado(item.id, 'completed')}>
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

const ESTADOS = { pending: 'Pendiente', completed: '✓ Listo', cancelled: 'Cancelado' }

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 20, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 24, fontWeight: '800', color: '#F0F0F8', marginBottom: 4 },
  fecha: { fontSize: 14, color: '#7A7A9A', marginBottom: 24, textTransform: 'capitalize' },
  empty: { color: '#7A7A9A', fontSize: 16 },
  card: { backgroundColor: '#13131A', borderWidth: 1, borderColor: 'rgba(124,92,252,0.2)', borderRadius: 16, padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  hora: { fontSize: 20, fontWeight: '700', color: '#F0F0F8' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  badgeColors: {
    pending: { backgroundColor: 'rgba(124,92,252,0.15)' },
    completed: { backgroundColor: 'rgba(77,217,172,0.15)' },
    cancelled: { backgroundColor: 'rgba(255,79,79,0.12)' },
  },
  cliente: { fontSize: 16, fontWeight: '600', color: '#F0F0F8', marginBottom: 2 },
  servicio: { fontSize: 13, color: '#7A7A9A', marginBottom: 2 },
  tel: { fontSize: 13, color: '#7A7A9A', marginBottom: 12 },
  acciones: { flexDirection: 'row', gap: 8 },
  btnListo: { flex: 1, backgroundColor: '#7C5CFC', borderRadius: 10, padding: 10, alignItems: 'center' },
  btnListoText: { color: 'white', fontWeight: '700', fontSize: 14 },
  btnCancelar: { flex: 1, backgroundColor: '#1C1C26', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  btnCancelarText: { color: '#ff6b6b', fontWeight: '600', fontSize: 14 },
})