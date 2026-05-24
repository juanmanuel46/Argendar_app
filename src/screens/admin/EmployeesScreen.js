import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function EmployeesScreen() {
  const [empleados, setEmpleados] = useState([])
  const [stats, setStats]         = useState({})
  const [loading, setLoading]     = useState(true)
  const [businessId, setBusinessId] = useState(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: appUser } = await supabase.from('app_users').select('business_id').eq('id', user.id).single()
    if (!appUser) { setLoading(false); return }
    setBusinessId(appUser.business_id)

    const { data: emps } = await supabase.from('employees').select('*').eq('business_id', appUser.business_id).order('name')

    const hoy = new Date().toISOString().split('T')[0]
    const { data: turnos } = await supabase
      .from('appointments')
      .select('employee_id, status')
      .eq('business_id', appUser.business_id)
      .eq('date', hoy)

    const statsMap = {}
    for (const t of (turnos || [])) {
      if (!statsMap[t.employee_id]) statsMap[t.employee_id] = { total: 0, completados: 0, cancelados: 0 }
      statsMap[t.employee_id].total++
      if (t.status === 'completed') statsMap[t.employee_id].completados++
      if (t.status === 'cancelled') statsMap[t.employee_id].cancelados++
    }

    setEmpleados(emps ?? [])
    setStats(statsMap)
    setLoading(false)
  }

  async function toggleActivo(emp) {
    await supabase.from('employees').update({ active: !emp.active }).eq('id', emp.id)
    fetchData()
  }

  if (loading) return <View style={s.center}><ActivityIndicator color="#7C5CFC" size="large" /></View>

  return (
    <View style={s.container}>
      <Text style={s.titulo}>Empleados</Text>
      <Text style={s.sub}>Rendimiento de hoy</Text>

      <FlatList
        data={empleados}
        keyExtractor={e => e.id}
        contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.center}>
            <Text style={s.empty}>No hay empleados registrados</Text>
          </View>
        }
        renderItem={({ item }) => {
          const st = stats[item.id] || { total: 0, completados: 0, cancelados: 0 }
          const initials = item.name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()
          return (
            <View style={[s.card, !item.active && s.cardInactivo]}>
              <View style={s.cardTop}>
                <View style={s.empLeft}>
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>{initials}</Text>
                  </View>
                  <View>
                    <Text style={s.empNombre}>{item.name}</Text>
                    <Text style={s.empRol}>{item.role || 'Empleado'}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[s.badgeActivo, !item.active && s.badgeInactivo]}
                  onPress={() => toggleActivo(item)}
                >
                  <Text style={[s.badgeActivoText, !item.active && s.badgeInactivoText]}>
                    {item.active ? 'Activo' : 'Inactivo'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={s.statsRow}>
                <View style={s.statItem}>
                  <Text style={s.statNum}>{st.total}</Text>
                  <Text style={s.statLabel}>Turnos</Text>
                </View>
                <View style={s.statItem}>
                  <Text style={[s.statNum, { color: '#4dd9ac' }]}>{st.completados}</Text>
                  <Text style={s.statLabel}>Listos</Text>
                </View>
                <View style={s.statItem}>
                  <Text style={[s.statNum, { color: '#ff6b6b' }]}>{st.cancelados}</Text>
                  <Text style={s.statLabel}>Cancelados</Text>
                </View>
              </View>
            </View>
          )
        }}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#111', paddingTop: 56, paddingHorizontal: 20 },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titulo:          { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  sub:             { fontSize: 13, color: '#666', marginBottom: 20, textTransform: 'capitalize' },
  empty:           { color: '#444', fontSize: 15 },
  card:            { backgroundColor: '#1c1c1e', borderWidth: 1.5, borderColor: '#2a2a2d', borderRadius: 16, padding: 16 },
  cardInactivo:    { opacity: 0.5 },
  cardTop:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  empLeft:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:          { width: 44, height: 44, borderRadius: 22, backgroundColor: '#7C5CFC', justifyContent: 'center', alignItems: 'center' },
  avatarText:      { color: 'white', fontWeight: '800', fontSize: 16 },
  empNombre:       { fontSize: 15, fontWeight: '600', color: '#fff' },
  empRol:          { fontSize: 12, color: '#666', marginTop: 2 },
  badgeActivo:     { backgroundColor: 'rgba(77,217,172,0.15)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  badgeActivoText: { color: '#4dd9ac', fontSize: 12, fontWeight: '600' },
  badgeInactivo:   { backgroundColor: 'rgba(255,79,79,0.12)' },
  badgeInactivoText: { color: '#ff6b6b' },
  statsRow:        { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#222', paddingTop: 12, gap: 8 },
  statItem:        { flex: 1, alignItems: 'center' },
  statNum:         { fontSize: 22, fontWeight: '700', color: '#c87aff' },
  statLabel:       { fontSize: 11, color: '#666', marginTop: 2 },
})