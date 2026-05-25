import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function SubscriptionScreen() {
  const [loading,    setLoading]    = useState(false)
  const [businessId, setBusinessId] = useState(null)
  const [negocio,    setNegocio]    = useState(null)

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: appUser } = await supabase.from('app_users').select('business_id').eq('id', user.id).single()
      if (appUser) {
        setBusinessId(appUser.business_id)
        const { data: biz } = await supabase.from('businesses').select('name, slug').eq('id', appUser.business_id).single()
        setNegocio(biz)
      }
    }
    fetchData()
  }, [])

  async function handlePagar() {
    // TODO: Integrar Mercado Pago cuando esté listo el backend
    // Por ahora abrimos el link de pago manual
    Alert.alert(
      'Activar suscripción',
      'Para activar tu suscripción por $5 USD/mes, contactanos por WhatsApp y te enviamos el link de pago.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Contactar', onPress: () => Linking.openURL('https://wa.me/5491100000000?text=Quiero%20activar%20mi%20suscripci%C3%B3n%20de%20Bookzy%20-%20Negocio:%20' + negocio?.name) },
      ]
    )
  }

  async function handleCerrarSesion() {
    await supabase.auth.signOut()
  }

  // Función para activar manualmente (para testing / admin)
  async function activarManual() {
    if (!businessId) return
    setLoading(true)
    await supabase.from('businesses').update({
      subscription_status: 'active',
      subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }).eq('id', businessId)
    // Refrescar sesión para que navigation detecte el cambio
    await supabase.auth.refreshSession()
    setLoading(false)
  }

  return (
    <View style={s.container}>
      <Text style={s.logo}>Argendar</Text>

      <View style={s.iconWrap}>
        <Text style={s.icon}>⏰</Text>
      </View>

      <Text style={s.titulo}>Tu prueba gratuita terminó</Text>
      <Text style={s.sub}>Activá tu suscripción para seguir usando Argendar y recibiendo reservas en {negocio?.name}.</Text>

      {/* Plan */}
      <View style={s.planCard}>
        <View style={s.planTop}>
          <Text style={s.planNombre}>Plan Argendar</Text>
        </View>
        <Text style={s.planPrecio}>$5 <Text style={s.planPrecioSub}>USD/mes</Text></Text>
        <View style={s.planFeatures}>
          {[
            '✓ Reservas ilimitadas',
            '✓ App para empleados',
            '✓ Dashboard con métricas',
            '✓ Notificaciones push',
            '✓ Gestión de empleados',
            '✓ Soporte incluido',
          ].map(f => (
            <Text key={f} style={s.planFeature}>{f}</Text>
          ))}
        </View>
      </View>

      <TouchableOpacity style={s.btnPagar} onPress={handlePagar} disabled={loading}>
        {loading
          ? <ActivityIndicator color="white" />
          : <Text style={s.btnPagarText}>Activar suscripción →</Text>
        }
      </TouchableOpacity>

      <Text style={s.garantia}>🔒 Podés cancelar cuando quieras. Sin permanencia.</Text>

      <TouchableOpacity style={s.btnLogout} onPress={handleCerrarSesion}>
        <Text style={s.btnLogoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#111', padding: 24, paddingTop: 60, alignItems: 'center' },
  logo:            { fontSize: 24, fontWeight: '800', color: '#c87aff', marginBottom: 32 },
  iconWrap:        { width: 80, height: 80, backgroundColor: 'rgba(155,77,255,0.15)', borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  icon:            { fontSize: 36 },
  titulo:          { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 12 },
  sub:             { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 28, paddingHorizontal: 10 },
  planCard:        { width: '100%', backgroundColor: '#1c1c1e', borderRadius: 20, padding: 20, borderWidth: 2, borderColor: '#7C5CFC', marginBottom: 20 },
  planTop:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  planNombre:      { fontSize: 16, fontWeight: '700', color: '#fff' },
  planPrecio:      { fontSize: 44, fontWeight: '800', color: '#fff', marginBottom: 16 },
  planPrecioSub:   { fontSize: 18, color: '#666', fontWeight: '400' },
  planFeatures:    { gap: 8 },
  planFeature:     { fontSize: 14, color: '#aaa' },
  btnPagar:        { width: '100%', backgroundColor: '#7C5CFC', borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 12 },
  btnPagarText:    { color: 'white', fontSize: 17, fontWeight: '800' },
  garantia:        { fontSize: 12, color: '#555', marginBottom: 24 },
  btnLogout:       { padding: 12 },
  btnLogoutText:   { color: '#555', fontSize: 14 },
})