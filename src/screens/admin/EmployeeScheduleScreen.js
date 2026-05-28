import { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
  Alert,
  StatusBar,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { colors, typography, spacing, radius } from '../../lib/theme'
import { Toast, useToast } from '../../components/Toast'

const DIAS = [
  { id: 1, nombre: 'Lunes',     corto: 'L' },
  { id: 2, nombre: 'Martes',    corto: 'M' },
  { id: 3, nombre: 'Miércoles', corto: 'X' },
  { id: 4, nombre: 'Jueves',    corto: 'J' },
  { id: 5, nombre: 'Viernes',   corto: 'V' },
  { id: 6, nombre: 'Sábado',    corto: 'S' },
  { id: 0, nombre: 'Domingo',   corto: 'D' },
]

const HORAS_INICIO = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00']
const HORAS_FIN    = ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00']

export default function EmployeeScheduleScreen({ route, navigation }) {
  const { employee } = route.params
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [horarios, setHorarios] = useState({})
  const { toast, showToast, hideToast } = useToast()

  useEffect(() => {
    navigation.setOptions({ title: employee.name })
    fetchHorarios()
  }, [])

  async function fetchHorarios() {
    const { data } = await supabase
      .from('employee_schedules')
      .select('*')
      .eq('employee_id', employee.id)

    const map = {}
    for (const dia of DIAS) {
      const found = (data || []).find(h => h.day_of_week === dia.id)
      map[dia.id] = {
        active:     !!found,
        start_time: found?.start_time?.slice(0, 5) || '09:00',
        end_time:   found?.end_time?.slice(0, 5)   || '18:00',
        id:         found?.id || null,
      }
    }
    setHorarios(map)
    setLoading(false)
  }

  function toggleDia(diaId) {
    setHorarios(prev => ({
      ...prev,
      [diaId]: { ...prev[diaId], active: !prev[diaId].active }
    }))
  }

  function cambiarHora(diaId, tipo, hora) {
    setHorarios(prev => ({
      ...prev,
      [diaId]: { ...prev[diaId], [tipo]: hora }
    }))
  }

  async function guardar() {
    setSaving(true)
    for (const dia of DIAS) {
      const h = horarios[dia.id]
      if (h.active) {
        const data = {
          employee_id: employee.id,
          day_of_week: dia.id,
          start_time:  h.start_time,
          end_time:    h.end_time,
          active:      true,
        }
        if (h.id) {
          await supabase.from('employee_schedules').update(data).eq('id', h.id)
        } else {
          await supabase.from('employee_schedules').insert(data)
        }
      } else if (h.id) {
        await supabase.from('employee_schedules').delete().eq('id', h.id)
      }
    }
    setSaving(false)
    showToast('Horarios guardados', 'success')
    setTimeout(() => navigation.goBack(), 1500)
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  // Contar días activos para mostrar resumen
  const diasActivos = DIAS.filter(d => horarios[d.id]?.active).length

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={s.scroll}>

        {/* HEADER */}
        <View style={s.header}>
          <Text style={s.kicker}>Configuración</Text>
          <Text style={s.title}>Horarios de {employee.name}</Text>
          <Text style={s.subtitle}>
            Activá los días que trabaja y configurá los rangos horarios
          </Text>
        </View>

        {/* RESUMEN */}
        <View style={s.resumen}>
          <View style={s.resumenIcon}>
            <Feather name="calendar" size={16} color={colors.primary} />
          </View>
          <View style={s.resumenText}>
            <Text style={s.resumenLabel}>Días activos</Text>
            <Text style={s.resumenVal}>
              {diasActivos} de 7 días
            </Text>
          </View>
        </View>

        {/* DÍAS */}
        <Text style={s.section}>Configuración semanal</Text>

        {DIAS.map(dia => {
          const h = horarios[dia.id]
          return (
            <View
              key={dia.id}
              style={[s.card, !h.active && s.cardInactivo]}
            >
              {/* HEADER DEL DÍA */}
              <View style={s.cardHeader}>
                <View style={s.diaInfo}>
                  <View style={[s.diaCorto, h.active && s.diaCortoActive]}>
                    <Text style={[s.diaCortoText, h.active && s.diaCortoTextActive]}>
                      {dia.corto}
                    </Text>
                  </View>
                  <View>
                    <Text style={[s.diaNombre, !h.active && s.textMuted]}>
                      {dia.nombre}
                    </Text>
                    {h.active && (
                      <Text style={s.diaHora}>
                        {h.start_time} → {h.end_time}
                      </Text>
                    )}
                  </View>
                </View>
                <Switch
                  value={h.active}
                  onValueChange={() => toggleDia(dia.id)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="white"
                />
              </View>

              {/* SELECTORES DE HORA */}
              {h.active && (
                <View style={s.horasWrap}>
                  <View style={s.horaGroup}>
                    <Text style={s.horaLabel}>DESDE</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={s.chipsRow}
                    >
                      {HORAS_INICIO.map(hora => {
                        const active = h.start_time === hora
                        return (
                          <TouchableOpacity
                            key={hora}
                            style={[s.chip, active && s.chipActive]}
                            onPress={() => cambiarHora(dia.id, 'start_time', hora)}
                            activeOpacity={0.7}
                          >
                            <Text style={[s.chipText, active && s.chipTextActive]}>
                              {hora}
                            </Text>
                          </TouchableOpacity>
                        )
                      })}
                    </ScrollView>
                  </View>

                  <View style={s.horaGroup}>
                    <Text style={s.horaLabel}>HASTA</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={s.chipsRow}
                    >
                      {HORAS_FIN.map(hora => {
                        const active = h.end_time === hora
                        return (
                          <TouchableOpacity
                            key={hora}
                            style={[s.chip, active && s.chipActive]}
                            onPress={() => cambiarHora(dia.id, 'end_time', hora)}
                            activeOpacity={0.7}
                          >
                            <Text style={[s.chipText, active && s.chipTextActive]}>
                              {hora}
                            </Text>
                          </TouchableOpacity>
                        )
                      })}
                    </ScrollView>
                  </View>
                </View>
              )}
            </View>
          )
        })}
      </ScrollView>

      {/* BOTÓN FIJO ABAJO */}
      <View style={s.footer}>
        <TouchableOpacity
          style={s.btnGuardar}
          onPress={guardar}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="white" />
            : (
              <>
                <Feather name="check" size={18} color="white" />
                <Text style={s.btnGuardarText}>Guardar horarios</Text>
              </>
            )
          }
        </TouchableOpacity>
      </View>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
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
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingTop: 24,
    paddingHorizontal: 18,
    paddingBottom: 120,
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
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },

  /* RESUMEN */
  resumen: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  resumenIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resumenText: {
    flex: 1,
  },
  resumenLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  resumenVal: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '600',
  },

  /* SECTION */
  section: {
    ...typography.label,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },

  /* CARD DEL DÍA */
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardInactivo: {
    opacity: 0.55,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  diaCorto: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diaCortoActive: {
    backgroundColor: colors.primaryGlow,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  diaCortoText: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 15,
  },
  diaCortoTextActive: {
    color: colors.primary,
  },
  diaNombre: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  diaHora: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  textMuted: {
    color: colors.textMuted,
  },

  /* HORAS */
  horasWrap: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  horaGroup: {
    gap: 8,
  },
  horaLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    backgroundColor: colors.input,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primaryGlow,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  /* FOOTER */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btnGuardar: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  btnGuardarText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
})