import { useState, useCallback, useRef } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, StatusBar
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Feather } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { colors, radius, spacing } from '../../lib/theme'

const FILTROS = [
  { label: 'Todos',       value: null },
  { label: 'Pendientes',  value: 'pending' },
  { label: 'Completados', value: 'completed' },
  { label: 'Cancelados',  value: 'cancelled' },
]

const STATUS = {
  pending:   { label: 'Pendiente',  color: colors.warning, bg: colors.warningBg,  icon: 'clock' },
  completed: { label: 'Completado', color: colors.success, bg: colors.successBg,  icon: 'check-circle' },
  cancelled: { label: 'Cancelado',  color: colors.danger,  bg: colors.dangerBg,   icon: 'x-circle' },
}

function formatDate(date) {
  const hoy     = new Date(); hoy.setHours(0,0,0,0)
  const mañana  = new Date(hoy); mañana.setDate(hoy.getDate()+1)
  const ayer    = new Date(hoy); ayer.setDate(hoy.getDate()-1)
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
  const [filtro,     setFiltro]     = useState(null)
  const [fecha,      setFecha]      = useState(new Date())
  const businessIdRef = useRef(null)

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

    const { data } = await q
    setTurnos(data ?? [])
    setLoading(false)
    setRefreshing(false)
  }

  function cambiarDia(delta) {
    const nueva = new Date(fecha)
    nueva.setDate(nueva.getDate() + delta)
    setFecha(nueva)
  }

  async function marcarListo(id) {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'completed' })   // ← SIEMPRE 'completed', nunca 'done'
      .eq('id', id)
    if (error) { Alert.alert('Error', error.message); return }
    setTurnos(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' } : t))
  }

  async function cancelar(id, nombre) {
    Alert.alert('Cancelar turno', `¿Cancelar el turno de ${nombre}?`, [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: async () => {
        const { error } = await supabase
          .from('appointments')
          .update({ status: 'cancelled' })
          .eq('id', id)
        if (error) { Alert.alert('Error', error.message); return }
        setTurnos(prev => prev.map(t => t.id === id ? { ...t, status: 'cancelled' } : t))
      }},
    ])
  }

  const pendientes  = turnos.filter(t => t.status === 'pending').length
  const completados = turnos.filter(t => t.status === 'completed').length

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.kicker}>Agenda</Text>

        {/* Navegador de fecha */}
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

        {/* Ir a hoy */}
        {toISO(fecha) !== toISO(new Date()) && (
          <TouchableOpacity style={s.todayBtn} onPress={() => setFecha(new Date())}>
            <Text style={s.todayBtnText}>Ir a hoy</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Resumen del día */}
      <View style={s.summary}>
        <View style={s.summaryItem}>
          <Text style={s.summaryNum}>{turnos.length}</Text>
          <Text style={s.summaryLabel}>Total</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Text style={[s.summaryNum, { color: colors.warning }]}>{pendientes}</Text>
          <Text style={s.summaryLabel}>Pendientes</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Text style={[s.summaryNum, { color: colors.success }]}>{completados}</Text>
          <Text style={s.summaryLabel}>Completados</Text>
        </View>
      </View>

      {/* Filtros */}
      <View style={s.filtros}>
        {FILTROS.map(f => (
          <TouchableOpacity
            key={f.label}
            style={[s.filtroBtn, filtro === f.value && s.filtroBtnActive]}
            onPress={() => setFiltro(f.value)}
            activeOpacity={0.7}
          >
            <Text style={[s.filtroText, filtro === f.value && s.filtroTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
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
                <Text style={s.emptyText}>
                  No hay turnos {filtro ? FILTROS.find(f=>f.value===filtro)?.label?.toLowerCase() : ''} para {formatDate(fecha).toLowerCase()}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const cfg = STATUS[item.status] || STATUS.pending
              return (
                <View style={[
                  s.card,
                  item.status === 'cancelled' && s.cardCancelled,
                  item.status === 'completed' && s.cardDone,
                ]}>
                  {/* Hora + estado */}
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

                  {/* Cliente */}
                  <View style={s.clientRow}>
                    <View style={s.avatar}>
                      <Text style={s.avatarText}>
                        {item.clients?.name?.slice(0,1)?.toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.clientName}>{item.clients?.name}</Text>
                      <Text style={s.clientPhone}>{item.clients?.phone}</Text>
                    </View>
                    <View style={s.priceTag}>
                      <Text style={s.price}>${item.services?.price}</Text>
                    </View>
                  </View>

                  {/* Meta */}
                  <View style={s.metaRow}>
                    <View style={s.metaItem}>
                      <Feather name="scissors" size={12} color={colors.textMuted} />
                      <Text style={s.metaText}>{item.services?.name}</Text>
                    </View>
                    {item.employees?.name && (
                      <View style={s.metaItem}>
                        <Feather name="user" size={12} color={colors.textMuted} />
                        <Text style={s.metaText}>{item.employees.name}</Text>
                      </View>
                    )}
                  </View>

                  {/* Acciones */}
                  {item.status === 'pending' && (
                    <View style={s.actions}>
                      <TouchableOpacity
                        style={s.btnComplete}
                        onPress={() => marcarListo(item.id)}
                        activeOpacity={0.8}
                      >
                        <Feather name="check" size={15} color="white" />
                        <Text style={s.btnCompleteText}>Marcar listo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.btnCancel}
                        onPress={() => cancelar(item.id, item.clients?.name)}
                        activeOpacity={0.8}
                      >
                        <Feather name="x" size={15} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )
            }}
          />
      }
    </View>
  )
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.bg },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:         { paddingTop: 60, paddingHorizontal: 18, paddingBottom: 8 },
  kicker:         { fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  dateNav:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.lg, padding: 4, borderWidth: 1, borderColor: colors.border },
  dateArrow:      { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: radius.md },
  dateLabelWrap:  { flex: 1, alignItems: 'center' },
  dateLabel:      { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  dateSubLabel:   { fontSize: 12, color: colors.textMuted, marginTop: 1, textTransform: 'capitalize' },
  todayBtn:       { alignSelf: 'center', marginTop: 8, backgroundColor: colors.primaryGlow, paddingHorizontal: 16, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  todayBtnText:   { color: colors.primary, fontSize: 12, fontWeight: '600' },
  summary:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12 },
  summaryItem:    { flex: 1, alignItems: 'center' },
  summaryNum:     { fontSize: 22, fontWeight: '800', color: colors.primary },
  summaryLabel:   { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  summaryDivider: { width: 1, height: 30, backgroundColor: colors.border },
  filtros:        { flexDirection: 'row', paddingHorizontal: 18, gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  filtroBtn:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  filtroBtnActive:{ backgroundColor: colors.primaryGlow, borderColor: colors.primary },
  filtroText:     { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  filtroTextActive:{ color: colors.primary },
  list:           { paddingHorizontal: 18, paddingBottom: 40, gap: 10 },
  empty:          { alignItems: 'center', paddingTop: 50, gap: 10 },
  emptyIcon:      { width: 60, height: 60, borderRadius: radius.full, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  emptyTitle:     { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  emptyText:      { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  card:           { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder },
  cardCancelled:  { opacity: 0.4 },
  cardDone:       { borderColor: 'rgba(34,211,165,0.2)', backgroundColor: '#0A1510' },
  cardTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  timeRow:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  time:           { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  duration:       { fontSize: 12, color: colors.textMuted, backgroundColor: colors.input, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badge:          { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  badgeText:      { fontSize: 12, fontWeight: '600' },
  clientRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatar:         { width: 38, height: 38, borderRadius: radius.full, backgroundColor: colors.primaryGlow, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  avatarText:     { color: colors.primary, fontWeight: '700', fontSize: 14 },
  clientName:     { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  clientPhone:    { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  priceTag:       { backgroundColor: colors.primaryGlow, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm },
  price:          { color: colors.primary, fontWeight: '700', fontSize: 13 },
  metaRow:        { flexDirection: 'row', gap: 14, marginBottom: 12, flexWrap: 'wrap' },
  metaItem:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText:       { fontSize: 12, color: colors.textMuted },
  actions:        { flexDirection: 'row', gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  btnComplete:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: radius.md, padding: 11 },
  btnCompleteText:{ color: 'white', fontWeight: '700', fontSize: 14 },
  btnCancel:      { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.dangerBg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)' },
})