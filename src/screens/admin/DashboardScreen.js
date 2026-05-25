import { useState, useCallback, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Animated,
  Pressable
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Feather } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { colors } from '../../lib/theme'

/* -------------------- Stat Card -------------------- */
function StatCard({ icon, label, value, color }) {
  return (
    <View style={s.statCard}>
      <View style={[s.statIcon, { backgroundColor: `${color}15` }]}>
        <Feather name={icon} size={16} color={color} />
      </View>

      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  )
}

/* -------------------- Insight -------------------- */
function InsightCard({ icon, value, label, color }) {
  return (
    <View style={s.insightCard}>
      <Feather name={icon} size={18} color={color} />
      <Text style={s.insightValue}>{value}</Text>
      <Text style={s.insightLabel}>{label}</Text>
    </View>
  )
}

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState(null)
  const [periodo, setPeriodo] = useState('hoy')

  const fade = useRef(new Animated.Value(1)).current

  useFocusEffect(
    useCallback(() => {
      fetchData()
    }, [periodo])
  )

  function animate() {
    Animated.sequence([
      Animated.timing(fade, {
        toValue: 0.4,
        duration: 120,
        useNativeDriver: true
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true
      })
    ]).start()
  }

  async function fetchData() {
    animate()

    const { data: { user } } = await supabase.auth.getUser()

    const { data: appUser } = await supabase
      .from('app_users')
      .select('business_id, businesses(name, slug, subscription_status, trial_ends_at)')
      .eq('id', user.id)
      .single()

    if (!appUser) {
      setLoading(false)
      return
    }

    const biz = appUser.businesses

    const today = new Date()
    let from = today.toISOString().split('T')[0]

    if (periodo === 'semana') {
      const d = new Date(today)
      d.setDate(today.getDate() - 7)
      from = d.toISOString().split('T')[0]
    } else if (periodo === 'mes') {
      const d = new Date(today)
      d.setDate(1)
      from = d.toISOString().split('T')[0]
    }

    const { data: turnos } = await supabase
      .from('appointments')
      .select('status, client_id, services(price, name)')
      .eq('business_id', appUser.business_id)
      .gte('date', from)
      .lte('date', today.toISOString().split('T')[0])

    const list = turnos || []

    const completed = list.filter(t => t.status === 'completed')

    const income = completed.reduce(
      (acc, t) => acc + (t.services?.price || 0),
      0
    )

    const uniqueClients = new Set(list.map(t => t.client_id)).size

    const count = {}
    list.forEach(t => {
      const n = t.services?.name
      if (n) count[n] = (count[n] || 0) + 1
    })

    const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'

    setData({
      business: biz?.name,
      slug: biz?.slug,
      stats: {
        total: list.length,
        pending: list.filter(t => t.status === 'pending').length,
        completed: completed.length,
        cancelled: list.filter(t => t.status === 'cancelled').length,
        income,
        uniqueClients,
        top
      }
    })

    setLoading(false)
    setRefreshing(false)
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  const { business, slug, stats } = data

  const date = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              fetchData()
            }}
            tintColor={colors.primary}
          />
        }
      >

        {/* HEADER */}
        <View style={s.header}>
          <Text style={s.kicker}>Panel de control</Text>
          <Text style={s.title}>{business}</Text>
          <Text style={s.subtitle}>{date}</Text>
        </View>

        {/* SEGMENT CONTROL */}
        <View style={s.segment}>
          {[
            ['hoy', 'Hoy'],
            ['semana', '7 días'],
            ['mes', 'Mes']
          ].map(([val, label]) => (
            <Pressable
              key={val}
              onPress={() => setPeriodo(val)}
              style={[s.segmentBtn, periodo === val && s.segmentActive]}
            >
              <Text style={[s.segmentText, periodo === val && s.segmentTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* CONTENT */}
        <Animated.View style={{ opacity: fade }}>

          <Text style={s.section}>Resumen</Text>

          <View style={s.grid}>
            <StatCard icon="calendar" label="Total" value={stats.total} color={colors.primary} />
            <StatCard icon="clock" label="Pendientes" value={stats.pending} color={colors.warning} />
            <StatCard icon="check" label="Completados" value={stats.completed} color={colors.success} />
            <StatCard icon="x" label="Cancelados" value={stats.cancelled} color={colors.danger} />
          </View>

          {/* HERO CARD */}
          <View style={s.heroCard}>
            <Text style={s.heroLabel}>Ingresos estimados</Text>
            <Text style={s.heroValue}>
              ${stats.income.toLocaleString('es-AR')}
            </Text>
            <Text style={s.heroHint}>Solo turnos completados</Text>
          </View>

          {/* INSIGHTS */}
          <Text style={s.section}>Insights</Text>

          <View style={s.insights}>
            <InsightCard icon="users" value={stats.uniqueClients} label="Clientes" color={colors.primary} />
            <InsightCard icon="star" value={stats.top} label="Más pedido" color={colors.warning} />
          </View>

          {/* LINK */}
          <View style={s.link}>
            <Feather name="link" size={14} color={colors.primary} />
            <Text style={s.linkText}>argendar.com.ar/{slug}</Text>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  )
}

/* -------------------- STYLE -------------------- */
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg
  },

  scroll: {
    paddingTop: 60,
    paddingHorizontal: 18,
    paddingBottom: 40
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg
  },

  header: {
    marginBottom: 18
  },

  kicker: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary
  },

  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4
  },

  segment: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 4,
    marginBottom: 18
  },

  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12
  },

  segmentActive: {
    backgroundColor: colors.primaryGlow
  },

  segmentText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600'
  },

  segmentTextActive: {
    color: colors.primary
  },

  section: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 16
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },

  statCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border
  },

  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },

  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary
  },

  statLabel: {
    fontSize: 12,
    color: colors.textMuted
  },

  heroCard: {
    marginTop: 14,
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border
  },

  heroLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1
  },

  heroValue: {
    fontSize: 38,
    fontWeight: '900',
    color: colors.success,
    marginTop: 6
  },

  heroHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4
  },

  insights: {
    flexDirection: 'row',
    gap: 10
  },

  insightCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border
  },

  insightValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 6
  },

  insightLabel: {
    fontSize: 11,
    color: colors.textMuted
  },

  link: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    alignItems: 'center'
  },

  linkText: {
    color: colors.primary,
    fontWeight: '600'
  }
})