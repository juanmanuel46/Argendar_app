import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function ProfileScreen() {
  const [user, setUser]     = useState(null)
  const [emp, setEmp]       = useState(null)
  const [negocio, setNegocio] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data: appUser } = await supabase.from('app_users').select('employee_id, business_id, role').eq('id', user.id).single()
      if (appUser?.employee_id) {
        const { data: e } = await supabase.from('employees').select('name, role').eq('id', appUser.employee_id).single()
        setEmp(e)
      }
      if (appUser?.business_id) {
        const { data: b } = await supabase.from('businesses').select('name').eq('id', appUser.business_id).single()
        setNegocio(b)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return <View style={s.center}><ActivityIndicator color="#7C5CFC" /></View>

  const initials = emp?.name ? emp.name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase() : '👤'

  return (
    <View style={s.container}>
      <Text style={s.titulo}>Mi perfil</Text>

      <View style={s.avatarWrap}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <Text style={s.nombre}>{emp?.name || user?.email}</Text>
        <Text style={s.rol}>{emp?.role || 'Empleado'}</Text>
        <Text style={s.negocio}>{negocio?.name}</Text>
      </View>

      <View style={s.infoCard}>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Email</Text>
          <Text style={s.infoVal}>{user?.email}</Text>
        </View>
      </View>

      <TouchableOpacity style={s.btnLogout} onPress={() => supabase.auth.signOut()}>
        <Text style={s.btnLogoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#111', paddingTop: 56, paddingHorizontal: 20 },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titulo:      { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 32 },
  avatarWrap:  { alignItems: 'center', marginBottom: 32 },
  avatar:      { width: 80, height: 80, borderRadius: 40, backgroundColor: '#7C5CFC', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText:  { color: 'white', fontWeight: '800', fontSize: 28 },
  nombre:      { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  rol:         { fontSize: 14, color: '#c87aff', marginBottom: 4 },
  negocio:     { fontSize: 13, color: '#666' },
  infoCard:    { backgroundColor: '#1c1c1e', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#2a2a2d' },
  infoRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  infoLabel:   { fontSize: 14, color: '#666' },
  infoVal:     { fontSize: 14, color: '#fff', fontWeight: '500' },
  btnLogout:   { borderWidth: 1, borderColor: 'rgba(255,79,79,0.3)', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnLogoutText: { color: '#ff6b6b', fontWeight: '600', fontSize: 15 },
})