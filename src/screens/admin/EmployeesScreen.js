import { useState, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { supabase } from '../../lib/supabase'
import { Feather } from '@expo/vector-icons'

export default function EmployeesScreen() {
  const [empleados, setEmpleados] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useFocusEffect(useCallback(() => {
    fetchData()
  }, []))

  async function fetchData() {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { data: appUser } = await supabase
      .from('app_users')
      .select('business_id')
      .eq('id', user.id)
      .single()

    if (!appUser) return setLoading(false)

    const { data: emps } = await supabase
      .from('employees')
      .select('*')
      .eq('business_id', appUser.business_id)
      .order('name')

    const today = new Date().toISOString().split('T')[0]

    const { data: turnos } = await supabase
      .from('appointments')
      .select('employee_id, status')
      .eq('business_id', appUser.business_id)
      .eq('date', today)

    const map = {}

    for (const t of turnos || []) {
      if (!map[t.employee_id]) {
        map[t.employee_id] = { total: 0, ok: 0, cancel: 0 }
      }
      map[t.employee_id].total++
      if (t.status === 'completed') map[t.employee_id].ok++
      if (t.status === 'cancelled') map[t.employee_id].cancel++
    }

    setEmpleados(emps || [])
    setStats(map)
    setLoading(false)
  }

  async function toggle(emp) {
    await supabase
      .from('employees')
      .update({ active: !emp.active })
      .eq('id', emp.id)

    fetchData()
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#A78BFA" size="large" />
      </View>
    )
  }

  return (
    <View style={s.container}>

      {/* HEADER */}
      <View style={s.header}>
        <Text style={s.title}>Empleados</Text>
        <Text style={s.subtitle}>Rendimiento de hoy</Text>
      </View>

      <FlatList
        data={empleados}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ paddingBottom: 40, gap: 12 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>No hay empleados registrados</Text>
          </View>
        }
        renderItem={({ item }) => {
          const st = stats[item.id] || { total: 0, ok: 0, cancel: 0 }

          const initials = item.name
            .split(' ')
            .slice(0, 2)
            .map(w => w[0])
            .join('')
            .toUpperCase()

          return (
            <View style={[s.card, !item.active && s.cardInactive]}>

              {/* TOP */}
              <View style={s.topRow}>

                <View style={s.left}>
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>{initials}</Text>
                  </View>

                  <View>
                    <Text style={s.name}>{item.name}</Text>
                    <Text style={s.role}>{item.role || 'Empleado'}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => toggle(item)}
                  style={[
                    s.statusBadge,
                    item.active ? s.active : s.inactive
                  ]}
                >
                  <Text style={item.active ? s.activeText : s.inactiveText}>
                    {item.active ? 'Activo' : 'Inactivo'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* STATS */}
              <View style={s.stats}>

                <View style={s.statBox}>
                  <Feather name="calendar" size={14} color="#A78BFA" />
                  <Text style={s.statNum}>{st.total}</Text>
                  <Text style={s.statLabel}>Turnos</Text>
                </View>

                <View style={s.statBox}>
                  <Feather name="check-circle" size={14} color="#4dd9ac" />
                  <Text style={[s.statNum, { color: '#4dd9ac' }]}>{st.ok}</Text>
                  <Text style={s.statLabel}>Listos</Text>
                </View>

                <View style={s.statBox}>
                  <Feather name="x-circle" size={14} color="#ff6b6b" />
                  <Text style={[s.statNum, { color: '#ff6b6b' }]}>{st.cancel}</Text>
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

/* ---------------- STYLE MODERNO ---------------- */

const s = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#0B0B0F',
    paddingHorizontal: 18,
    paddingTop: 60
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0B0F'
  },

  header: {
    marginBottom: 18
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: 'white'
  },

  subtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 4
  },

  emptyBox: {
    padding: 20,
    alignItems: 'center'
  },

  emptyText: {
    color: '#666'
  },

  card: {
    backgroundColor: '#141420',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#222'
  },

  cardInactive: {
    opacity: 0.55
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },

  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#A78BFA',
    justifyContent: 'center',
    alignItems: 'center'
  },

  avatarText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 12
  },

  name: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white'
  },

  role: {
    fontSize: 12,
    color: '#777',
    marginTop: 2
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999
  },

  active: {
    backgroundColor: 'rgba(167,139,250,0.15)'
  },

  inactive: {
    backgroundColor: 'rgba(255,107,107,0.12)'
  },

  activeText: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '600'
  },

  inactiveText: {
    color: '#ff6b6b',
    fontSize: 12,
    fontWeight: '600'
  },

  stats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingTop: 12
  },

  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2
  },

  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#A78BFA'
  },

  statLabel: {
    fontSize: 11,
    color: '#777'
  }
})