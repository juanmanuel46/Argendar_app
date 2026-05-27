import { useState } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { colors, typography, spacing, radius } from '../lib/theme'

const MOTIVOS = [
  { id: 'cliente_no_pudo', label: 'El cliente no pudo asistir', icon: 'user-x' },
  { id: 'enfermedad',      label: 'Enfermedad o emergencia',    icon: 'thermometer' },
  { id: 'reprogramado',    label: 'Se reprogramó',              icon: 'repeat' },
  { id: 'no_show',         label: 'No se presentó',             icon: 'eye-off' },
  { id: 'otro',            label: 'Otro motivo',                icon: 'more-horizontal' },
]

export default function CancelAppointmentModal({ visible, onClose, onConfirm }) {
  const [motivoSeleccionado, setMotivoSeleccionado] = useState(null)
  const [motivoOtro, setMotivoOtro]                 = useState('')
  const [saving, setSaving]                         = useState(false)

  function reset() {
    setMotivoSeleccionado(null)
    setMotivoOtro('')
    setSaving(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleConfirm() {
    if (!motivoSeleccionado) return

    const motivoFinal = motivoSeleccionado === 'otro'
      ? motivoOtro.trim()
      : MOTIVOS.find(m => m.id === motivoSeleccionado)?.label

    if (motivoSeleccionado === 'otro' && !motivoOtro.trim()) {
      return // No deja confirmar si "Otro" está vacío
    }

    setSaving(true)
    await onConfirm(motivoFinal)
    setSaving(false)
    reset()
  }

  const puedeConfirmar = motivoSeleccionado && 
    (motivoSeleccionado !== 'otro' || motivoOtro.trim().length > 0)

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.sheet}>
          
          {/* HANDLE */}
          <View style={s.handle} />

          {/* HEADER */}
          <View style={s.header}>
            <View style={s.iconWrap}>
              <Feather name="x-circle" size={20} color={colors.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>Cancelar turno</Text>
              <Text style={s.subtitle}>Elegí un motivo para la cancelación</Text>
            </View>
            <TouchableOpacity onPress={handleClose} hitSlop={10}>
              <Feather name="x" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* MOTIVOS */}
          <ScrollView 
            style={{ maxHeight: 400 }}
            showsVerticalScrollIndicator={false}
          >
            {MOTIVOS.map(motivo => {
              const selected = motivoSeleccionado === motivo.id
              return (
                <TouchableOpacity
                  key={motivo.id}
                  style={[s.motivoRow, selected && s.motivoRowActive]}
                  onPress={() => setMotivoSeleccionado(motivo.id)}
                  activeOpacity={0.7}
                >
                  <View style={[s.motivoIcon, selected && s.motivoIconActive]}>
                    <Feather 
                      name={motivo.icon} 
                      size={16} 
                      color={selected ? colors.primary : colors.textMuted} 
                    />
                  </View>
                  <Text style={[s.motivoLabel, selected && s.motivoLabelActive]}>
                    {motivo.label}
                  </Text>
                  {selected && (
                    <Feather name="check" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )
            })}

            {/* INPUT PARA "OTRO" */}
            {motivoSeleccionado === 'otro' && (
              <View style={s.otroWrap}>
                <Text style={s.otroLabel}>Especificá el motivo</Text>
                <TextInput
                  style={s.otroInput}
                  placeholder="Ej: Surgió un imprevisto"
                  placeholderTextColor={colors.textMuted}
                  value={motivoOtro}
                  onChangeText={setMotivoOtro}
                  multiline
                  maxLength={200}
                  autoFocus
                />
                <Text style={s.contador}>{motivoOtro.length}/200</Text>
              </View>
            )}
          </ScrollView>

          {/* BOTONES */}
          <View style={s.footer}>
            <TouchableOpacity
              style={s.btnCancelar}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={s.btnCancelarText}>Volver</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.btnConfirmar, !puedeConfirmar && s.btnDisabled]}
              onPress={handleConfirm}
              disabled={!puedeConfirmar || saving}
              activeOpacity={0.85}
            >
              {saving 
                ? <ActivityIndicator color="white" />
                : <Text style={s.btnConfirmarText}>Cancelar turno</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.dangerBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...typography.h3,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  /* MOTIVOS */
  motivoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginBottom: 8,
  },
  motivoRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  motivoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
  motivoIconActive: {
    backgroundColor: colors.primaryGlow,
  },
  motivoLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  motivoLabelActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },

  /* OTRO */
  otroWrap: {
    marginTop: 6,
    marginBottom: spacing.sm,
  },
  otroLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  otroInput: {
    backgroundColor: colors.input,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  contador: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },

  /* FOOTER */
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  btnCancelar: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  btnCancelarText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  btnConfirmar: {
    flex: 1.4,
    backgroundColor: colors.danger,
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnConfirmarText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
})