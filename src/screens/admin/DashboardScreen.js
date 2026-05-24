import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true)
  const [negocio, setNegocio] = useState(null)
  const [stats, setStats] = useState({
    turnosHoy: 0,
    pendientesHoy: 0,
    completadosHoy: 0,
    canceladosHoy: 0,
    turnosSemana: 0,
    ingresoEstimadoHoy: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: appUser } = await supabase.from('app_users').select('business_id').eq('id', user.id).single()
    if (!appUser) { setLoading(false); return }

    const { data: biz } = await supabase.from('businesses').select('name').eq('id', appUser.business_id).single()
    setNegocio(biz)

    const hoy = new Date().toISOString().split('T')[0]
    const semanaAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data: turnosHoy } = await supabase
      .from('appointments')
      .select('status, services(price)')
      .eq('business_id', appUser.business_id)
      .eq('date', hoy)

    const { data: turnosSemana } = await supabase
      .from('appointments')
      .select('id')
      .eq('business_id', appUser.business_id)
      .gte('date', semanaAtras)

    const pendientes = (turnosHoy || []).filter(t => t.status === 'pending').length
    const completados = (turnosHoy || []).filter(t => t.status === 'completed').length
    const cancelados = (turnosHoy || []).filter(t => t.status === 'cancelled').length
    const ingreso = (turnosHoy || [])
      .filter(t => t.status === 'completed')
      .reduce((acc, t) => acc + (t.services?.price || 0), 0)

    setStats({
      turnosHoy: (turnosHoy || []).length,
      pendientesHoy: pendientes,
      completadosHoy: completados,
      canceladosHoy: cancelados,
      turnosSemana: (turnosSemana || []).length,
      ingresoEstimadoHoy: ingreso,
    })
    setLoading(false)
  }

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color="#7C5CFC" size="large" />
    </View>
  )

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={s.saludo}>Hola 👋</Text>
      <Text style={s.negocio}>{negocio?.name}</Text>
      <Text style={s.fecha}>{new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>

      {/* Métricas de hoy */}
      <Text style={s.seccion}>Hoy</Text>
      <View style={s.grid}>
        <MetricCard titulo="Turnos" valor={stats.turnosHoy} icono="📅" />
        <MetricCard titulo="Pendientes" valor={stats.pendientesHoy} icono="⏳" />
        <MetricCard titulo="Completados" valor={stats.completadosHoy} icono="✅" />
        <MetricCard titulo="Cancelados" valor={stats.canceladosHoy} icono="❌" />
      </View>

      {/* Ingreso estimado */}
      <View style={s.ingresoCard}>
        <Text style={s.ingresoLabel}>💰 Ingreso estimado hoy</Text>
        <Text style={s.ingresoValor}>${stats.ingresoEstimadoHoy.toLocaleString('es-AR')}</Text>
        <Text style={s.ingresoSub}>Solo turnos completados</Text>
      </View>

      {/* Semana */}
      <Text style={s.seccion}>Últimos 7 días</Text>
      <View style={s.semanaCard}>
        <Text style={s.semanaLabel}>Total de turnos</Text>
        <Text style={s.semanaValor}>{stats.turnosSemana}</Text>
      </View>

      {/* Cerrar sesión */}
      <TouchableOpacity style={s.logout} onPress={() => supabase.auth.signOut()}>
        <Text style={s.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

function MetricCard({ titulo, valor, icono }) {
  return (
    <View style={s.metricCard}>
      <Text style={s.metricIcono}>{icono}</Text>
      <Text style={s.metricValor}>{valor}</Text>
      <Text style={s.metricTitulo}>{titulo}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 20, paddingTop: 60 },
  center: { flex: 1, backgroundColor: '#0A0A0F', justifyContent: 'center', alignItems: 'center' },
  saludo: { fontSize: 16, color: '#7A7A9A', marginBottom: 4 },
  negocio: { fontSize: 26, fontWeight: '800', color: '#F0F0F8', marginBottom: 4 },
  fecha: { fontSize: 14, color: '#7A7A9A', marginBottom: 24, textTransform: 'capitalize' },
  seccion: { fontSize: 13, fontWeight: '600', color: '#7A7A9A', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  metricCard: { backgroundColor: '#13131A', borderWidth: 1, borderColor: 'rgba(124,92,252,0.2)', borderRadius: 16, padding: 16, width: '47%', alignItems: 'center' },
  metricIcono: { fontSize: 24, marginBottom: 8 },
  metricValor: { fontSize: 32, fontWeight: '800', color: '#7C5CFC', marginBottom: 4 },
  metricTitulo: { fontSize: 12, color: '#7A7A9A' },
  ingresoCard: { backgroundColor: '#13131A', borderWidth: 1, borderColor: 'rgba(124,92,252,0.2)', borderRadius: 16, padding: 20, marginBottom: 16 },
  ingresoLabel: { fontSize: 14, color: '#7A7A9A', marginBottom: 8 },
  ingresoValor: { fontSize: 36, fontWeight: '800', color: '#4dd9ac', marginBottom: 4 },
  ingresoSub: { fontSize: 12, color: '#7A7A9A' },
  semanaCard: { backgroundColor: '#13131A', borderWidth: 1, borderColor: 'rgba(124,92,252,0.2)', borderRadius: 16, padding: 20, marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  semanaLabel: { fontSize: 15, color: '#F0F0F8', fontWeight: '600' },
  semanaValor: { fontSize: 32, fontWeight: '800', color: '#7C5CFC' },
  logout: { borderWidth: 1, borderColor: 'rgba(255,79,79,0.3)', borderRadius: 12, padding: 14, alignItems: 'center' },
  logoutText: { color: '#ff6b6b', fontWeight: '600', fontSize: 15 },
})