import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StatusBar
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { colors, radius, spacing } from '../../lib/theme'

export default function RegisterScreen({ navigation }) {
  const [nombre,    setNombre]    = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [password2, setPassword2] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [showPass,  setShowPass]  = useState(false)

  async function handleRegister() {
    if (!nombre.trim())      { Alert.alert('Ingresá tu nombre'); return }
    if (!email.trim())       { Alert.alert('Ingresá tu email'); return }
    if (password.length < 6) { Alert.alert('La contraseña debe tener al menos 6 caracteres'); return }
    if (password !== password2) { Alert.alert('Las contraseñas no coinciden'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password.trim(),
      options: { data: { full_name: nombre.trim() } }
    })
    if (error) { Alert.alert('Error', error.message); setLoading(false) }
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Feather name="arrow-left" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={s.badge}>
            <Feather name="gift" size={12} color={colors.primary} />
            <Text style={s.badgeText}>30 días gratis</Text>
          </View>
        </View>

        <Text style={s.titulo}>Registrá tu negocio</Text>
        <Text style={s.sub}>Sin tarjeta de crédito. Cancelá cuando quieras.</Text>

        <View style={s.card}>
          {[
            { label: 'Tu nombre', icon: 'user', val: nombre, set: setNombre, placeholder: 'Juan García', cap: 'words', secure: false },
            { label: 'Email', icon: 'mail', val: email, set: setEmail, placeholder: 'tu@email.com', cap: 'none', secure: false, type: 'email-address' },
          ].map(f => (
            <View key={f.label} style={s.field}>
              <Text style={s.fieldLabel}>{f.label}</Text>
              <View style={s.inputWrap}>
                <Feather name={f.icon} size={16} color={colors.textMuted} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.textMuted}
                  value={f.val}
                  onChangeText={f.set}
                  autoCapitalize={f.cap}
                  keyboardType={f.type || 'default'}
                  autoCorrect={false}
                />
              </View>
            </View>
          ))}

          <View style={s.field}>
            <Text style={s.fieldLabel}>Contraseña</Text>
            <View style={s.inputWrap}>
              <Feather name="lock" size={16} color={colors.textMuted} style={s.inputIcon} />
              <TextInput style={[s.input, { flex: 1 }]} placeholder="Mínimo 6 caracteres" placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry={!showPass} />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ padding: 4 }}>
                <Feather name={showPass ? 'eye-off' : 'eye'} size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.fieldLabel}>Repetir contraseña</Text>
            <View style={s.inputWrap}>
              <Feather name="lock" size={16} color={colors.textMuted} style={s.inputIcon} />
              <TextInput style={s.input} placeholder="Repetí tu contraseña" placeholderTextColor={colors.textMuted} value={password2} onChangeText={setPassword2} secureTextEntry />
            </View>
          </View>

          <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="white" /> : <>
              <Text style={s.btnText}>Crear cuenta</Text>
              <Feather name="arrow-right" size={18} color="white" />
            </>}
          </TouchableOpacity>

          <Text style={s.terminos}>Al registrarte aceptás los Términos de uso. $5 USD/mes después del período de prueba.</Text>
        </View>

        <TouchableOpacity style={s.loginRow} onPress={() => navigation.navigate('Login')}>
          <Text style={s.loginText}>¿Ya tenés cuenta?</Text>
          <Text style={s.loginLink}> Ingresá</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: colors.bg },
  scroll:     { flexGrow: 1, padding: spacing.lg, paddingTop: 56 },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  backBtn:    { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  badge:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primaryGlow, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  badgeText:  { color: colors.primary, fontSize: 12, fontWeight: '600' },
  titulo:     { fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5, marginBottom: 6 },
  sub:        { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 20 },
  card:       { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.lg },
  field:      { marginBottom: spacing.md },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  inputWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.input, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14 },
  inputIcon:  { marginRight: 10 },
  input:      { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.textPrimary },
  btn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: radius.md, padding: 16, marginTop: 8 },
  btnText:    { color: 'white', fontSize: 16, fontWeight: '700' },
  terminos:   { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 14, lineHeight: 16 },
  loginRow:   { flexDirection: 'row', justifyContent: 'center' },
  loginText:  { color: colors.textMuted, fontSize: 14 },
  loginLink:  { color: colors.primary, fontSize: 14, fontWeight: '600' },
})