import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform,
  DeviceEventEmitter
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { colors, radius, spacing } from '../../lib/theme'
import { Toast, useToast } from '../../components/Toast'
import { useState, useEffect, useRef } from 'react'

export default function ResetPasswordScreen({ navigation, route }) {
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading,         setLoading]         = useState(false)
  const [showPassword,    setShowPassword]    = useState(false)
  const [sessionReady,    setSessionReady]    = useState(false)
  const { toast, showToast, hideToast } = useToast()
  const sessionReadyRef = useRef(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') && session) {
        sessionReadyRef.current = true
        setSessionReady(true)
      }
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        sessionReadyRef.current = true
        setSessionReady(true)
      }
    })

    const timeout = setTimeout(() => {
      if (!sessionReadyRef.current) {
        showToast('El link expiró. Pedí una nueva invitación.', 'error')
      }
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function handleReset() {
    if (password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'warning')
      return
    }
    if (password !== confirmPassword) {
      showToast('Las contraseñas no coinciden', 'warning')
      return
    }

    if (!sessionReady) {
      showToast('El link expiró. Pedí una nueva invitación.', 'error')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      showToast('Contraseña actualizada', 'success')
      setTimeout(() => {
        DeviceEventEmitter.emit('recheck_user_state')
      }, 1500)
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />
      <View style={s.content}>
        <View style={s.iconWrap}>
          <Feather name="lock" size={32} color={colors.primary} />
        </View>

        <Text style={s.titulo}>Nueva contraseña</Text>
        <Text style={s.sub}>Elegí una contraseña segura para tu cuenta</Text>

        <View style={s.inputWrap}>
          <Feather name="lock" size={16} color={colors.textMuted} style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder="Nueva contraseña"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={s.eye}>
            <Feather name={showPassword ? 'eye-off' : 'eye'} size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={s.inputWrap}>
          <Feather name="lock" size={16} color={colors.textMuted} style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder="Confirmar contraseña"
            placeholderTextColor={colors.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={s.btn}
          onPress={handleReset}
          disabled={loading || !sessionReady}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="white" />
            : <Text style={s.btnText}>Actualizar contraseña</Text>
          }
        </TouchableOpacity>
      </View>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: colors.bg },
  content:    { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  iconWrap:   { width: 72, height: 72, backgroundColor: colors.primaryGlow, borderRadius: 20, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  titulo:     { fontSize: 24, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', letterSpacing: -0.5, marginBottom: 8 },
  sub:        { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  inputWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, marginBottom: 12 },
  inputIcon:  { marginRight: 10 },
  input:      { flex: 1, fontSize: 15, color: colors.textPrimary, paddingVertical: 14 },
  eye:        { padding: 6 },
  btn:        { backgroundColor: colors.primary, borderRadius: radius.md, padding: 16, alignItems: 'center', marginTop: 12 },
  btnText:    { color: 'white', fontSize: 15, fontWeight: '700' },
})