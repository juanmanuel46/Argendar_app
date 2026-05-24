import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native'
import { supabase } from '../../lib/supabase'

export default function RegisterScreen({ navigation }) {
  const [nombre,    setNombre]    = useState('')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [password2, setPassword2] = useState('')
  const [loading,   setLoading]   = useState(false)

  async function handleRegister() {
    if (!nombre.trim())    { Alert.alert('Ingresá tu nombre'); return }
    if (!email.trim())     { Alert.alert('Ingresá tu email'); return }
    if (password.length < 6) { Alert.alert('La contraseña debe tener al menos 6 caracteres'); return }
    if (password !== password2) { Alert.alert('Las contraseñas no coinciden'); return }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password.trim(),
      options: { data: { full_name: nombre.trim() } }
    })
    if (error) {
      Alert.alert('Error', error.message)
      setLoading(false)
      return
    }
    // La navegación al onboarding se maneja automáticamente en navigation/index.js
    // cuando se crea la sesión y no existe app_user
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.logoWrap}>
          <Text style={s.logo}>Bookzy</Text>
          <Text style={s.logoSub}>Probalo gratis por 30 días</Text>
        </View>

        <View style={s.card}>
          <Text style={s.titulo}>Crear cuenta 🚀</Text>
          <Text style={s.sub}>Registrá tu negocio sin tarjeta de crédito</Text>

          <Text style={s.label}>Tu nombre</Text>
          <TextInput
            style={s.input}
            placeholder="Juan García"
            placeholderTextColor="#555"
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
          />

          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            placeholder="tu@email.com"
            placeholderTextColor="#555"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={s.label}>Contraseña</Text>
          <TextInput
            style={s.input}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#555"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={s.label}>Repetir contraseña</Text>
          <TextInput
            style={s.input}
            placeholder="Repetí tu contraseña"
            placeholderTextColor="#555"
            value={password2}
            onChangeText={setPassword2}
            secureTextEntry
          />

          <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={s.btnText}>Crear cuenta →</Text>
            }
          </TouchableOpacity>

          <Text style={s.terminos}>Al registrarte aceptás nuestros términos de uso. 30 días gratis, luego $5 USD/mes.</Text>
        </View>

        <TouchableOpacity style={s.loginLink} onPress={() => navigation.navigate('Login')}>
          <Text style={s.loginLinkText}>¿Ya tenés cuenta? <Text style={s.loginLinkAccent}>Ingresá</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container:       { flexGrow: 1, backgroundColor: '#111', justifyContent: 'center', padding: 24 },
  logoWrap:        { alignItems: 'center', marginBottom: 28 },
  logo:            { fontSize: 36, fontWeight: '800', color: '#c87aff' },
  logoSub:         { fontSize: 13, color: '#555', marginTop: 4 },
  card:            { backgroundColor: '#1c1c1e', borderRadius: 20, padding: 24, borderWidth: 1.5, borderColor: '#2a2a2d', marginBottom: 20 },
  titulo:          { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  sub:             { fontSize: 14, color: '#666', marginBottom: 24 },
  label:           { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 6, marginTop: 4 },
  input:           { backgroundColor: '#2a2a2d', borderRadius: 12, padding: 14, fontSize: 15, color: '#fff', marginBottom: 14, borderWidth: 1, borderColor: '#333' },
  btn:             { backgroundColor: '#7C5CFC', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText:         { color: 'white', fontSize: 16, fontWeight: '700' },
  terminos:        { fontSize: 11, color: '#555', textAlign: 'center', marginTop: 14, lineHeight: 16 },
  loginLink:       { alignItems: 'center', padding: 12 },
  loginLinkText:   { color: '#666', fontSize: 14 },
  loginLinkAccent: { color: '#c87aff', fontWeight: '600' },
})