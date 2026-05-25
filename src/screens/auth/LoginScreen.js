import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar
} from 'react-native'
import { Feather } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { colors, radius, spacing } from '../../lib/theme'

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Completá tu email y contraseña')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    })

    if (error) {
      Alert.alert('Error', 'Email o contraseña incorrectos')
    }

    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* HEADER / BRAND */}
        <View style={s.hero}>
          <View style={s.logoBubble}>
            <Feather name="calendar" size={26} color={colors.primary} />
          </View>

          <Text style={s.title}>Argendar</Text>
          <Text style={s.subtitle}>Gestioná tus turnos de forma profesional</Text>
        </View>

        {/* CARD */}
        <View style={s.card}>

          <Text style={s.cardTitle}>Bienvenido de vuelta</Text>
          <Text style={s.cardSubtitle}>Iniciá sesión para continuar</Text>

          {/* EMAIL */}
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
              />
            </View>
          </View>

          {/* PASSWORD */}
          <View style={s.field}>
            <Text style={s.label}>Contraseña</Text>
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
                <Feather
                  name={showPass ? 'eye-off' : 'eye'}
                  size={16}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* BUTTON */}
          <TouchableOpacity
            style={s.button}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={s.buttonText}>Ingresar</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

        </View>

        {/* FOOTER */}
        <TouchableOpacity
          style={s.footer}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={s.footerText}>
            ¿No tenés cuenta?
          </Text>
          <Text style={s.footerLink}>
            Crear negocio gratis
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg
  },

  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20
  },

  hero: {
    alignItems: 'center',
    marginBottom: 28
  },

  logoBubble: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border
  },

  title: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1
  },

  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 6
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary
  },

  cardSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 18
  },

  field: {
    marginBottom: 14
  },

  label: {
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 1
  },

  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.input,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10
  },

  textInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15
  },

  button: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 10
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700'
  },

  footer: {
    marginTop: 20,
    alignItems: 'center'
  },

  footerText: {
    color: colors.textMuted,
    fontSize: 14
  },

  footerLink: {
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4
  }
})