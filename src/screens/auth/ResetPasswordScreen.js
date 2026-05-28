import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, StatusBar, KeyboardAvoidingView, Platform
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { colors, radius, spacing } from '../../lib/theme'

export default function ResetPasswordScreen({ navigation }) {
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading,         setLoading]         = useState(false)
  const [showPassword,    setShowPassword]    = useState(false)

  async function handleReset() {
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

Alert.alert(
  '✓ Contraseña actualizada',
  'Ya podés ingresar con tu nueva contraseña',
  [{ text: 'OK', onPress: () => {
    const { DeviceEventEmitter } = require('react-native')
    DeviceEventEmitter.emit('recheck_user_state')
  }}]
)
    } catch (e) {
      Alert.alert('Error', e.message)
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
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="white" />
            : <Text style={s.btnText}>Actualizar contraseña</Text>
          }
        </TouchableOpacity>
      </View>
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