import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { colors, typography, spacing, radius } from '../../lib/theme'

export default function ProfileScreen() {
  const [user, setUser]       = useState(null)
  const [emp, setEmp]         = useState(null)
  const [negocio, setNegocio] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      const { data: appUser } = await supabase
        .from('app_users')
        .select('employee_id, business_id, role')
        .eq('id', user.id)
        .single()

      if (appUser?.employee_id) {
        const { data: e } = await supabase
          .from('employees')
          .select('name, role')
          .eq('id', appUser.employee_id)
          .single()
        setEmp(e)
      }

      if (appUser?.business_id) {
        const { data: b } = await supabase
          .from('businesses')
          .select('name')
          .eq('id', appUser.business_id)
          .single()
        setNegocio(b)
      }

      setLoading(false)
    }
    fetchData()
  }, [])

  function handleLogout() {
    Alert.alert(
      'Cerrar sesión',
      '¿Seguro que querés salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: () => supabase.auth.signOut() },
      ]
    )
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  const initials = emp?.name
    ? emp.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '👤'

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={s.scroll}>

        {/* HEADER */}
        <View style={s.header}>
          <Text style={s.kicker}>Mi cuenta</Text>
          <Text style={s.title}>Perfil</Text>
        </View>

        {/* AVATAR CARD */}
        <View style={s.avatarCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>

          <Text style={s.nombre}>{emp?.name || user?.email}</Text>

          {emp?.role && (
            <View style={s.rolBadge}>
              <Text style={s.rolText}>{emp.role}</Text>
            </View>
          )}

          {negocio?.name && (
            <View style={s.negocioRow}>
              <Feather name="briefcase" size={13} color={colors.textMuted} />
              <Text style={s.negocio}>{negocio.name}</Text>
            </View>
          )}
        </View>

        {/* INFO SECTION */}
        <Text style={s.section}>Información</Text>

        <View style={s.infoCard}>
          <View style={s.infoRow}>
            <View style={s.infoIcon}>
              <Feather name="mail" size={15} color={colors.primary} />
            </View>
            <View style={s.infoText}>
              <Text style={s.infoLabel}>Email</Text>
              <Text style={s.infoVal}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* LOGOUT */}
        <TouchableOpacity style={s.btnLogout} onPress={handleLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={16} color={colors.danger} />
          <Text style={s.btnLogoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  )
}

/* ──────────── STYLES ──────────── */
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingTop: 60,
    paddingHorizontal: 18,
    paddingBottom: 40,
  },

  /* HEADER */
  header: {
    marginBottom: spacing.lg,
  },
  kicker: {
    ...typography.label,
  },
  title: {
    ...typography.h2,
    marginTop: 4,
  },

  /* AVATAR CARD */
  avatarCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primaryGlow,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 32,
    letterSpacing: -0.5,
  },
  nombre: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  rolBadge: {
    backgroundColor: colors.primaryGlow,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
  },
  rolText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  negocioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  negocio: {
    fontSize: 13,
    color: colors.textMuted,
  },

  /* INFO */
  section: {
    ...typography.label,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoVal: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },

  /* LOGOUT */
  btnLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.dangerBg,
    backgroundColor: 'transparent',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  btnLogoutText: {
    color: colors.danger,
    fontWeight: '600',
    fontSize: 15,
  },
})