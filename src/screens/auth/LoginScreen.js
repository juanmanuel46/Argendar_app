import { useState } from 'react'
import {View, Text, TextInput, TouchableOpacity,StyleSheet, Alert, ActivityIndicator,KeyboardAvoidingView, Platform, ScrollView, StatusBar} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { colors, radius, spacing } from '../../lib/theme'
import { Toast, useToast } from '../../components/Toast'

export default function LoginScreen({ navigation }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { toast, showToast, hideToast } = useToast()

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      showToast('Completá tu email y contraseña', 'warning')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password: password.trim(),
    })
    if (error) showToast('Email o contraseña incorrectos', 'error')
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        <View style={s.hero}>
          <View style={s.logoBubble}>
            <Feather name="calendar" size={26} color={colors.primary} />
          </View>
          <Text style={s.title}>Argendar</Text>
          <Text style={s.subtitle}>Gestión de turnos profesional</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Bienvenido de vuelta</Text>
          <Text style={s.cardSubtitle}>Iniciá sesión para continuar</Text>

          <View style={s.field}>
            <Text style={s.label}>Email</Text>
            <View style={s.input}>
              <Feather name="mail" size={16} color={colors.textMuted} />
              <TextInput
                placeholder="tu@email.com"
                placeholderTextColor={colors.textMuted}
                style={s.textInput}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={s.field}>
            <View style={s.labelRow}>
              <Text style={s.label}>Contraseña</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={s.forgotLink}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>
            <View style={s.input}>
              <Feather name="lock" size={16} color={colors.textMuted} />
              <TextInput
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                style={[s.textInput, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Feather name={showPass ? 'eye-off' : 'eye'} size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={s.button} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Text style={s.buttonText}>Ingresar</Text>
                  <Feather name="arrow-right" size={18} color="#fff" />
                </>
            }
          </TouchableOpacity>
        </View>

          <TouchableOpacity style={s.footer} onPress={() => navigation.navigate('Register')}>
          <Text style={s.footerText}>¿No tenés cuenta?</Text>
          <Text style={s.footerLink}>Crear negocio gratis</Text>
        </TouchableOpacity>

        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg },
  scroll:       { flexGrow: 1, justifyContent: 'center', padding: 20 },
  hero:         { alignItems: 'center', marginBottom: 28 },
  logoBubble:   { width: 70, height: 70, borderRadius: 20, backgroundColor: colors.primaryGlow, justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  title:        { fontSize: 34, fontWeight: '800', color: colors.textPrimary, letterSpacing: -1 },
  subtitle:     { fontSize: 14, color: colors.textMuted, marginTop: 6 },
  card:         { backgroundColor: colors.card, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.cardBorder },
  cardTitle:    { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  cardSubtitle: { fontSize: 13, color: colors.textMuted, marginBottom: 18 },
  field:        { marginBottom: 14 },
  labelRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label:        { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  forgotLink:   { fontSize: 12, color: colors.primary, fontWeight: '600' },
  input:        { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.input, borderRadius: 14, paddingHorizontal: 14, height: 52, borderWidth: 1, borderColor: colors.border, gap: 10 },
  textInput:    { flex: 1, color: colors.textPrimary, fontSize: 15 },
  button:       { flexDirection: 'row', backgroundColor: colors.primary, padding: 16, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 8, gap: 10 },
  buttonText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer:       { marginTop: 20, alignItems: 'center' },
  footerText:   { color: colors.textMuted, fontSize: 14 },
  footerLink:   { color: colors.primary, fontWeight: '600', marginTop: 4 },
})