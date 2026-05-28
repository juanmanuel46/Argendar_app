import { useState, useCallback, useRef } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, StatusBar } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Feather } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { colors, radius, spacing } from '../../lib/theme'
import CancelAppointmentModal from '../../components/CancelAppointmentModal'
import { getCategoryIcon } from '../../lib/categoryIcons'
import { Toast, useToast } from '../../components/Toast'

const STATUS = {
  pending:     { label: 'Pendiente',  color: colors.warning, bg: colors.warningBg,  icon: 'clock' },
  in_progress: { label: 'En curso',   color: colors.primary, bg: colors.primaryGlow, icon: 'activity' },
  done:        { label: 'Completado', color: colors.success, bg: colors.successBg,  icon: 'check-circle' },
  cancelled:   { label: 'Cancelado',  color: colors.danger,  bg: colors.dangerBg,   icon: 'x-circle' },
}

function formatDate(date) {
  const hoy    = new Date(); hoy.setHours(0,0,0,0)
  const mañana = new Date(hoy); mañana.setDate(hoy.getDate()+1)
  const ayer   = new Date(hoy); ayer.setDate(hoy.getDate()-1)
  const d = new Date(date); d.setHours(0,0,0,0)
  if (d.getTime() === hoy.getTime())    return 'Hoy'
  if (d.getTime() === mañana.getTime()) return 'Mañana'
  if (d.getTime() === ayer.getTime())   return 'Ayer'
  return date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function toISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth()+1).padStart(2,'0')
  const d = String(date.getDate()).padStart(2,'0')
  return `${y}-${m}-${d}`
}

export default function AppointmentsScreen() {
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [turnos,     setTurnos]     = useState([])
  const [todosLosTurnos, setTodosLosTurnos] = useState([])
  const [filtro,     setFiltro]     = useState(null)
  const [fecha,      setFecha]      = useState(new Date())
  const businessIdRef = useRef(null)
  const [cancelModalVisible,  setCancelModalVisible]  = useState(false)
  const [appointmentToCancel, setAppointmentToCancel] = useState(null)
  const [businessCategory,    setBusinessCategory]    = useState(null)
  const { toast, showToast, hideToast } = useToast()

  useFocusEffect(useCallback(() => {
    fetchAll()
  }, [fecha, filtro]))

  async function fetchAll() {
    if (!businessIdRef.current) {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: appUser } = await supabase
        .from('app_users').select('business_id').eq('id', user.id).single()
      if (!appUser) { setLoading(false); return }
      businessIdRef.current = appUser.business_id
      const { data: biz } = await supabase
        .from('businesses').select('category').eq('id', appUser.business_id).single()
      setBusinessCategory(biz?.category)
    }
    fetchTurnos()
  }

  async function fetchTurnos() {
    setLoading(true)
    const fechaStr = toISO(fecha)

    let q = supabase
      .from('appointments')
      .select('*, clients(name, phone), services(name, price, duration_minutes), employees(name)')
      .eq('business_id', businessIdRef.current)
      .eq('date', fechaStr)
      .order('time')
    if (filtro) q = q.eq('status', filtro)

    const qTodos = supabase
      .from('appointments')
      .select('status')
      .eq('business_id', businessIdRef.current)
      .eq('date', fechaStr)

    const [resultFiltrado, resultTodos] = await Promise.all([q, qTodos])

    setTurnos(resultFiltrado.data ?? [])
    setTodosLosTurnos(resultTodos.data ?? [])
    setLoading(false)
    setRefreshing(false)
  }

  function cambiarDia(delta) {
    const nueva = new Date(fecha)
    nueva.setDate(nueva.getDate() + delta)
    setFecha(nueva)
  }

  async function marcarListo(id) {
    const { error } = await supabase.from('appointments').update({ status: 'done' }).eq('id', id)
    if (error) { showToast(error.message, 'error'); return }
    setTurnos(prev => prev.map(t => t.id === id ? { ...t, status: 'done' } : t))
    setTodosLosTurnos(prev => prev.map(t => t.id === id ? { ...t, status: 'done' } : t))
  }

  function abrirModalCancelar(turno) {
    setAppointmentToCancel(turno)
    setCancelModalVisible(true)
  }

  async function confirmarCancelacion(motivo) {
    if (!appointmentToCancel) return
    const { error } = await supabase.from('appointments').update({
      status: 'cancelled',
      cancellation_reason: motivo,
      cancelled_at: new Date().toISOString(),
      cancelled_by: 'admin'
    }).eq('id', appointmentToCancel.id)
    if (error) { showToast(error.message, 'error'); return }
    setTurnos(prev => prev.map(t =>
      t.id === appointmentToCancel.id ? { ...t, status: 'cancelled', cancellation_reason: motivo } : t
    ))
    setTodosLosTurnos(prev => prev.map(t =>
      t.id === appointmentToCancel.id ? { ...t, status: 'cancelled' } : t
    ))
    setCancelModalVisible(false)
    setAppointmentToCancel(null)
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      <View style={s.header}>
        <Text style={s.kicker}>Agenda</Text>
        <View style={s.dateNav}>
          <TouchableOpacity style={s.dateArrow} onPress={() => cambiarDia(-1)}>
            <Feather name="chevron-left" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={s.dateLabelWrap}>
            <Text style={s.dateLabel}>{formatDate(fecha)}</Text>
            <Text style={s.dateSubLabel}>
              {fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <TouchableOpacity style={s.dateArrow} onPress={() => cambiarDia(1)}>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        {toISO(fecha) !== toISO(new Date()) && (
          <TouchableOpacity style={s.todayBtn} onPress={() => setFecha(new Date())}>
            <Text style={s.todayBtnText}>Ir a hoy</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={s.summary}>
        {[
          { label: 'Total',       value: todosLosTurnos.length,                                      color: colors.primary, filtro: null },
          { label: 'Pendientes',  value: todosLosTurnos.filter(t => t.status === 'pending').length,   color: colors.warning, filtro: 'pending' },
          { label: 'Completados', value: todosLosTurnos.filter(t => t.status === 'done').length,      color: colors.success, filtro: 'done' },
          { label: 'Cancelados',  value: todosLosTurnos.filter(t => t.status === 'cancelled').length, color: colors.danger,  filtro: 'cancelled' },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[s.summaryItem, filtro === item.filtro && s.summaryItemActive]}
            onPress={() => setFiltro(filtro === item.filtro ? null : item.filtro)}
            activeOpacity={0.7}
          >
            <Text style={[s.summaryNum, { color: filtro === item.filtro ? item.color : colors.textSecondary }]}>
              {item.value}
            </Text>
            <Text style={[s.summaryLabel, filtro === item.filtro && { color: item.color }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading
        ? <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>
        : <FlatList
            data={turnos}
            keyExtractor={t => t.id}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => { setRefreshing(true); fetchTurnos() }}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={s.empty}>
                <View style={s.emptyIcon}>
                  <Feather name="calendar" size={28} color={colors.textMuted} />
                </View>
                <Text style={s.emptyTitle}>Sin turnos</Text>
                <Text style={s.emptyText}>No hay turnos {filtro ? filtro : ''}</Text>
              </View>
            }
            renderItem={({ item }) => {
              const cfg = STATUS[item.status] || STATUS.pending
              return (
                <View style={[s.card, item.status === 'cancelled' && s.cardCancelled, item.status === 'done' && s.cardDone]}>
                  <View style={s.cardTop}>
                    <View style={s.timeRow}>
                      <Feather name="clock" size={12} color={colors.textMuted} />
                      <Text style={s.time}>{item.time?.slice(0,5)}</Text>
                      {item.services?.duration_minutes && (
                        <Text style={s.duration}>{item.services.duration_minutes} min</Text>
                      )}
                    </View>
                    <View style={[s.badge, { backgroundColor: cfg.bg }]}>
                      <Feather name={cfg.icon} size={11} color={cfg.color} />
                      <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  </View>
                  <View style={s.clientRow}>
                    <View style={s.avatar}>
                      <Text style={s.avatarText}>{item.clients?.name?.slice(0,1)?.toUpperCase() || '?'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.clientName}>{item.clients?.name}</Text>
                      <Text style={s.clientPhone}>{item.clients?.phone}</Text>
                    </View>
                    {item.services?.price > 0 && (
                      <View style={s.priceTag}>
                        <Text style={s.price}>${item.services.price.toLocaleString('es-AR')}</Text>
                      </View>
                    )}
                  </View>
                  <View style={s.metaRow}>
                    <View style={s.metaItem}>
                      <Feather name={getCategoryIcon(businessCategory)} size={12} color={colors.textMuted} />
                      <Text style={s.metaText}>{item.services?.name}</Text>
                    </View>
                    {item.employees?.name && (
                      <View style={s.metaItem}>
                        <Feather name="user" size={12} color={colors.textMuted} />
                        <Text style={s.metaText}>{item.employees.name}</Text>
                      </View>
                    )}
                  </View>
                  {item.status === 'cancelled' && item.cancellation_reason && (
                    <View style={s.cancelReason}>
                      <Feather name="info" size={12} color={colors.danger} />
                      <Text style={s.cancelReasonText}>{item.cancellation_reason}</Text>
                    </View>
                  )}
                  {item.status === 'pending' && (
                    <View style={s.actions}>
                      <TouchableOpacity style={s.btnComplete} onPress={() => marcarListo(item.id)} activeOpacity={0.8}>
                        <Feather name="check" size={15} color="white" />
                        <Text style={s.btnCompleteText}>Marcar listo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.btnCancel} onPress={() => abrirModalCancelar(item)} activeOpacity={0.8}>
                        <Feather name="x" size={15} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )
            }}
          />
      }

      <CancelAppointmentModal
        visible={cancelModalVisible}
        onClose={() => { setCancelModalVisible(false); setAppointmentToCancel(null) }}
        onConfirm={confirmarCancelacion}
      />
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </View>
  )
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: colors.bg },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:           { paddingTop: 60, paddingHorizontal: 18, paddingBottom: 8 },
  kicker:           { fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  dateNav:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.lg, padding: 4, borderWidth: 1, borderColor: colors.border },
  dateArrow:        { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: radius.md },
  dateLabelWrap:    { flex: 1, alignItems: 'center' },
  dateLabel:        { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  dateSubLabel:     { fontSize: 12, color: colors.textMuted, marginTop: 1, textTransform: 'capitalize' },
  todayBtn:         { alignSelf: 'center', marginTop: 8, backgroundColor: colors.primaryGlow, paddingHorizontal: 16, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  todayBtnText:     { color: colors.primary, fontSize: 12, fontWeight: '600' },
  summary:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12 },
  summaryItem:      { flex: 1, alignItems: 'center' },
  summaryItemActive:{ borderBottomWidth: 2, borderBottomColor: colors.primary, paddingBottom: 2 },
  summaryNum:       { fontSize: 22, fontWeight: '800', color: colors.primary },
  summaryLabel:     { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  list:             { paddingHorizontal: 18, paddingBottom: 40, gap: 10 },
  empty:            { alignItems: 'center', paddingTop: 50, gap: 10 },
  emptyIcon:        { width: 60, height: 60, borderRadius: radius.full, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  emptyTitle:       { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  emptyText:        { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  card:             { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder },
  cardCancelled:    { opacity: 0.4 },
  cardDone:         { borderColor: 'rgba(34,211,165,0.2)', backgroundColor: '#0A1510' },
  cardTop:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  timeRow:          { flexDirection: 'row', alignItems: 'center', gap: 6 },
  time:             { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  duration:         { fontSize: 12, color: colors.textMuted, backgroundColor: colors.input, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badge:            { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  badgeText:        { fontSize: 12, fontWeight: '600' },
  clientRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar:           { width: 38, height: 38, borderRadius: radius.full, backgroundColor: colors.primaryGlow, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  avatarText:       { color: colors.primary, fontWeight: '700', fontSize: 14 },
  clientName:       { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  clientPhone:      { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  priceTag:         { backgroundColor: colors.primaryGlow, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm },
  price:            { color: colors.primary, fontWeight: '700', fontSize: 13 },
  metaRow:          { flexDirection: 'row', gap: 14, marginBottom: 12, flexWrap: 'wrap' },
  metaItem:         { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText:         { fontSize: 12, color: colors.textMuted },
  actions:          { flexDirection: 'row', gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  btnComplete:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: radius.md, padding: 11 },
  btnCompleteText:  { color: 'white', fontWeight: '700', fontSize: 14 },
  btnCancel:        { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.dangerBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)' },
  cancelReason:     { flexDirection: 'row', alignItems: 'flex-start', gap: 6, padding: 10, backgroundColor: colors.dangerBg, borderRadius: radius.md, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)' },
  cancelReasonText: { flex: 1, fontSize: 12, color: colors.danger, lineHeight: 17 },
})