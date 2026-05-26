import { useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl, StatusBar } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Feather } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { colors, radius, spacing } from '../../lib/theme'

const STATUS_CONFIG = {
  pending:   { label: 'Pendiente',   color: colors.warning, bg: colors.warningBg,  icon: 'clock' },
  completed: { label: 'Completado',  color: colors.success, bg: colors.successBg,  icon: 'check-circle' },
  cancelled: { label: 'Cancelado',   color: colors.danger,  bg: colors.dangerBg,   icon: 'x-circle' },
}

function TurnoCard({ item, onComplete, onCancel }) {
  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending
  return (
    <View style={[s.card, item.status === 'cancelled' && s.cardCancelled, item.status === 'completed' && s.cardDone]}>
      <View style={s.cardHeader}>
        <View style={s.timeWrap}>
          <Feather name="clock" size={12} color={colors.textMuted} />
          <Text style={s.time}>{item.time?.slice(0,5)}</Text>
        </View>
        <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
          <Feather name={cfg.icon} size={11} color={cfg.color} />
          <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      <View style={s.clientRow}>
        <View style={s.clientAvatar}>
          <Text style={s.clientAvatarText}>{item.clients?.name?.slice(0,1)?.toUpperCase() || '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.clientName}>{item.clients?.name}</Text>
          <Text style={s.clientPhone}>{item.clients?.codigo_pais} {item.clients?.phone}</Text>
        </View>
        <View style={s.priceTag}>
          <Text style={s.price}>${item.services?.price}</Text>
        </View>
      </View>

      <View style={s.serviceRow}>
        <Feather name="scissors" size={12} color={colors.textMuted} />
        <Text style={s.serviceName}>{item.services?.name}</Text>
      </View>

      {item.status === 'pending' && (
        <View style={s.actions}>
          <TouchableOpacity style={s.btnComplete} onPress={onComplete} activeOpacity={0.8}>
            <Feather name="check" size={16} color="white" />
            <Text style={s.btnCompleteText}>Marcar listo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnCancel} onPress={onCancel} activeOpacity={0.8}>
            <Feather name="x" size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

export default function TodayScreen() {
  const [turnos,     setTurnos]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [empInfo,    setEmpInfo]    = useState({ name: '', negocio: '' })

  useFocusEffect(useCallback(() => { fetchTurnos() }, []))

  async function fetchTurnos() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: appUser } = await supabase
      .from('app_users')
      .select('employee_id, business_id, employees(name), businesses(name)')
      .eq('id', user.id)
      .single()

    if (!appUser) { setLoading(false); return }
    setEmpInfo({ name: appUser.employees?.name || '', negocio: appUser.businesses?.name || '' })

    const hoy = new Date().toISOString().split('T')[0]
    let query = supabase
      .from('appointments')
      .select('id, time, status, clients(name, phone, codigo_pais), services(name, price)')
      .eq('date', hoy)
      .order('time')

    query = appUser.employee_id
      ? query.eq('employee_id', appUser.employee_id)
      : query.eq('business_id', appUser.business_id)

    const { data } = await query
    setTurnos(data ?? [])
    setLoading(false)
    setRefreshing(false)
  }

  async function handleComplete(id) {
    await supabase.from('appointments').update({ status: 'completed' }).eq('id', id)
    setTurnos(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' } : t))
  }

  async function handleCancel(id, nombre) {
    Alert.alert('Cancelar turno', `¿Cancelar el turno de ${nombre}?`, [
      { text: 'No', style: 'cancel' },
      { text: 'Cancelar turno', style: 'destructive', onPress: async () => {
        await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id)
        setTurnos(prev => prev.map(t => t.id === id ? { ...t, status: 'cancelled' } : t))
      }},
    ])
  }

  const pendientes  = turnos.filter(t => t.status === 'pending').length
  const completados = turnos.filter(t => t.status === 'completed').length
  const fechaHoy = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  if (loading) return <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerLabel}>Argendar</Text>
          <Text style={s.headerBusiness}>{empInfo.negocio}</Text>
        </View>
        {empInfo.name ? (
          <View style={s.avatarWrap}>
            <Text style={s.avatarText}>{empInfo.name.slice(0,2).toUpperCase()}</Text>
          </View>
        ) : null}
      </View>

      {/* Summary */}
      <View style={s.summary}>
        <View style={s.summaryLeft}>
          <Text style={s.summaryDate}>{fechaHoy}</Text>
          <Text style={s.summaryTitle}>Mis turnos</Text>
        </View>
        <View style={s.summaryStats}>
          <View style={s.summaryStatItem}>
            <Text style={s.summaryStatNum}>{pendientes}</Text>
            <Text style={s.summaryStatLabel}>Pendientes</Text>
          </View>
          <View style={[s.summaryStatItem, { borderLeftWidth: 1, borderLeftColor: colors.border, paddingLeft: 16 }]}>
            <Text style={[s.summaryStatNum, { color: colors.success }]}>{completados}</Text>
            <Text style={s.summaryStatLabel}>Listos</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={turnos}
        keyExtractor={t => t.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTurnos() }} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyIcon}><Feather name="inbox" size={32} color={colors.textMuted} /></View>
            <Text style={s.emptyTitle}>Sin turnos por hoy</Text>
            <Text style={s.emptyText}>Cuando lleguen reservas aparecerán acá</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TurnoCard
            item={item}
            onComplete={() => handleComplete(item.id)}
            onCancel={() => handleCancel(item.id, item.clients?.name)}
          />
        )}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: colors.bg },
  center:            { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' },
  header:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 56, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerLabel:       { fontSize: 12, color: colors.primary, fontWeight: '700', letterSpacing: 1 },
  headerBusiness:    { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  avatarWrap:        { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.primaryGlow, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  avatarText:        { color: colors.primary, fontWeight: '700', fontSize: 14 },
  summary:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  summaryLeft:       { flex: 1 },
  summaryDate:       { fontSize: 12, color: colors.textMuted, textTransform: 'capitalize', marginBottom: 2 },
  summaryTitle:      { fontSize: 22, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  summaryStats:      { flexDirection: 'row', gap: 16 },
  summaryStatItem:   { alignItems: 'center' },
  summaryStatNum:    { fontSize: 24, fontWeight: '800', color: colors.primary },
  summaryStatLabel:  { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  list:              { paddingHorizontal: spacing.lg, paddingBottom: 40, gap: spacing.sm },
  empty:             { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon:         { width: 72, height: 72, borderRadius: radius.full, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  emptyTitle:        { fontSize: 17, fontWeight: '600', color: colors.textSecondary },
  emptyText:         { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  card:              { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder },
  cardCancelled:     { opacity: 0.45 },
  cardDone:          { borderColor: 'rgba(34,211,165,0.2)', backgroundColor: '#0D1A15' },
  cardHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  timeWrap:          { flexDirection: 'row', alignItems: 'center', gap: 6 },
  time:              { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  statusBadge:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full },
  statusText:        { fontSize: 12, fontWeight: '600' },
  clientRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  clientAvatar:      { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.primaryGlow, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  clientAvatarText:  { color: colors.primary, fontWeight: '700', fontSize: 16 },
  clientName:        { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  clientPhone:       { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  priceTag:          { backgroundColor: colors.primaryGlow, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.sm },
  price:             { color: colors.primary, fontWeight: '700', fontSize: 14 },
  serviceRow:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  serviceName:       { fontSize: 13, color: colors.textMuted },
  actions:           { flexDirection: 'row', gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  btnComplete:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: radius.md, padding: 12 },
  btnCompleteText:   { color: 'white', fontWeight: '700', fontSize: 14 },
  btnCancel:         { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.dangerBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)' },
})