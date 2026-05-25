import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Switch, Alert
} from 'react-native'
import { supabase } from '../../lib/supabase'

const DIAS = [
  { id: 1, nombre: 'Lunes' },
  { id: 2, nombre: 'Martes' },
  { id: 3, nombre: 'Miércoles' },
  { id: 4, nombre: 'Jueves' },
  { id: 5, nombre: 'Viernes' },
  { id: 6, nombre: 'Sábado' },
  { id: 0, nombre: 'Domingo' },
]

const HORAS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2,'0')}:00`)

export default function EmployeeScheduleScreen({ route, navigation }) {
  const { employee } = route.params
  const [loading, setLoading]     = useState(true)
  const [saving,  setSaving]      = useState(false)
  const [horarios, setHorarios]   = useState({})

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
        start_time: found?.start_time?.slice(0,5) || '09:00',
        end_time:   found?.end_time?.slice(0,5)   || '18:00',
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
    Alert.alert('✓ Horarios guardados', '', [{ text: 'OK', onPress: () => navigation.goBack() }])
  }

  if (loading) return <View style={s.center}><ActivityIndicator color="#7C5CFC" size="large" /></View>

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={s.titulo}>Horarios de {employee.name}</Text>
        <Text style={s.sub}>Activá los días que trabaja y configurá los horarios</Text>

        {DIAS.map(dia => {
          const h = horarios[dia.id]
          return (
            <View key={dia.id} style={[s.card, !h.active && s.cardInactivo]}>
              <View style={s.cardHeader}>
                <Text style={[s.diaNombre, !h.active && s.textInactivo]}>{dia.nombre}</Text>
                <Switch
                  value={h.active}
                  onValueChange={() => toggleDia(dia.id)}
                  trackColor={{ false: '#333', true: '#7C5CFC' }}
                  thumbColor="white"
                />
              </View>

              {h.active && (
                <View style={s.horasRow}>
                  <View style={s.horaGroup}>
                    <Text style={s.horaLabel}>Desde</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={s.horaChips}>
                        {['07:00','08:00','09:00','10:00','11:00','12:00'].map(hora => (
                          <TouchableOpacity
                            key={hora}
                            style={[s.chip, h.start_time === hora && s.chipActive]}
                            onPress={() => cambiarHora(dia.id, 'start_time', hora)}
                          >
                            <Text style={[s.chipText, h.start_time === hora && s.chipTextActive]}>{hora}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                  <View style={s.horaGroup}>
                    <Text style={s.horaLabel}>Hasta</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={s.horaChips}>
                        {['14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'].map(hora => (
                          <TouchableOpacity
                            key={hora}
                            style={[s.chip, h.end_time === hora && s.chipActive]}
                            onPress={() => cambiarHora(dia.id, 'end_time', hora)}
                          >
                            <Text style={[s.chipText, h.end_time === hora && s.chipTextActive]}>{hora}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                </View>
              )}
            </View>
          )
        })}
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.btnGuardar} onPress={guardar} disabled={saving}>
          {saving
            ? <ActivityIndicator color="white" />
            : <Text style={s.btnGuardarText}>Guardar horarios</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#111', paddingTop: 20, paddingHorizontal: 20 },
  center:         { flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  titulo:         { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  sub:            { fontSize: 13, color: '#666', marginBottom: 20 },
  card:           { backgroundColor: '#1c1c1e', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a2d' },
  cardInactivo:   { opacity: 0.5 },
  cardHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  diaNombre:      { fontSize: 16, fontWeight: '600', color: '#fff' },
  textInactivo:   { color: '#555' },
  horasRow:       { marginTop: 14, gap: 10 },
  horaGroup:      { gap: 6 },
  horaLabel:      { fontSize: 12, color: '#888', fontWeight: '600' },
  horaChips:      { flexDirection: 'row', gap: 8 },
  chip:           { backgroundColor: '#2a2a2d', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: '#333' },
  chipActive:     { backgroundColor: 'rgba(124,92,252,0.2)', borderColor: '#7C5CFC' },
  chipText:       { color: '#888', fontSize: 13 },
  chipTextActive: { color: '#c87aff', fontWeight: '600' },
  footer:         { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#111', borderTopWidth: 1, borderTopColor: '#222' },
  btnGuardar:     { backgroundColor: '#7C5CFC', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnGuardarText: { color: 'white', fontSize: 16, fontWeight: '700' },
})