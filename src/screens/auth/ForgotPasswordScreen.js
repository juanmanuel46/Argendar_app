import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { colors, radius, spacing } from '../../lib/theme'
import { Toast, useToast } from '../../components/Toast'

export default function ForgotPasswordScreen({ navigation }) {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const { toast, showToast, hideToast } = useToast()

  async function handleReset() {
    if (!email.trim()) { showToast('Ingresá tu email', 'warning'); return }
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: 'argendar://reset-password' }
    )
    setLoading(false)
    if (error) { showToast(error.message, 'error'); return }
    setSent(true)
  }

if (sent) return (
  <View style={s.root}>
    <StatusBar barStyle="light-content" />
    <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
      <Feather name="arrow-left" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
    <View style={s.sentWrap}>
      <View style={s.sentIcon}>
        <Feather name="check-circle" size={36} color={colors.success} />
      </View>
      <Text style={s.sentTitle}>Email enviado</Text>
      <Text style={s.sentText}>
        Revisá tu bandeja de entrada en{'\n'}
        <Text style={{ color: colors.primary, fontWeight: '600' }}>{email}</Text>
        {'\n\n'}Seguí las instrucciones para restablecer tu contraseña.
      </Text>
      <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Login')} activeOpacity={0.85}>
        <Text style={s.btnText}>Volver al login</Text>
        <Feather name="arrow-right" size={18} color="white" />
      </TouchableOpacity>
    </View>
    <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
  </View>
)

return (
  <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <StatusBar barStyle="light-content" />
    <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
      <Feather name="arrow-left" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
    <View style={s.content}>
      <View style={s.iconWrap}>
        <Feather name="key" size={28} color={colors.primary} />
      </View>
      <Text style={s.title}>Olvidé mi contraseña</Text>
      <Text style={s.sub}>Ingresá tu email y te enviamos un link para crear una nueva.</Text>
      <Text style={s.label}>Email</Text>
      <View style={s.inputWrap}>
        <Feather name="mail" size={16} color={colors.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={s.input}
          placeholder="tu@email.com"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <TouchableOpacity style={s.btn} onPress={handleReset} disabled={loading} activeOpacity={0.85}>
        {loading
          ? <ActivityIndicator color="white" />
          : <>
              <Text style={s.btnText}>Enviar instrucciones</Text>
              <Feather name="send" size={16} color="white" />
            </>
        }
      </TouchableOpacity>
    </View>
    <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
  </KeyboardAvoidingView>
)
} 
const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: colors.bg, paddingTop: 56, padding: spacing.lg },
  backBtn:   { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl },
  content:   { flex: 1, justifyContent: 'center' },
  iconWrap:  { width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.primaryGlow, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  title:     { fontSize: 26, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5, marginBottom: 8 },
  sub:       { fontSize: 14, color: colors.textMuted, lineHeight: 22, marginBottom: spacing.xl },
  label:     { fontSize: 12, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.input, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, marginBottom: spacing.lg },
  input:     { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.textPrimary },
  btn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: radius.md, padding: 16 },
  btnText:   { color: 'white', fontSize: 16, fontWeight: '700' },
  sentWrap:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sentIcon:  { width: 80, height: 80, borderRadius: radius.full, backgroundColor: colors.successBg, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg, borderWidth: 1, borderColor: 'rgba(34,211,165,0.3)' },
  sentTitle: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginBottom: 12 },
  sentText:  { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 24, marginBottom: spacing.xl },
})