import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native'
import { supabase } from '../../lib/supabase'

export default function LoginScreen({ navigation }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleLogin() {
    if (!email.trim())    { Alert.alert('Ingresá tu email'); return }
    if (!password.trim()) { Alert.alert('Ingresá tu contraseña'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    })
    if (error) {
      Alert.alert('Error al ingresar', 'Email o contraseña incorrectos')
    }
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.logoWrap}>
          <Text style={s.logo}>Bookzy</Text>
          <Text style={s.logoSub}>Gestión de turnos inteligente</Text>
        </View>

        <View style={s.card}>
          <Text style={s.titulo}>Bienvenido 👋</Text>
          <Text style={s.sub}>Ingresá a tu cuenta</Text>

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
            placeholder="Tu contraseña"
            placeholderTextColor="#555"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={s.btnText}>Ingresar →</Text>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.registerLink} onPress={() => navigation.navigate('Register')}>
          <Text style={s.registerLinkText}>¿No tenés cuenta? <Text style={s.registerLinkAccent}>Registrá tu negocio gratis</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container:       { flexGrow: 1, backgroundColor: '#111', justifyContent: 'center', padding: 24 },
  logoWrap:        { alignItems: 'center', marginBottom: 32 },
  logo:            { fontSize: 36, fontWeight: '800', color: '#c87aff' },
  logoSub:         { fontSize: 13, color: '#555', marginTop: 4 },
  card:            { backgroundColor: '#1c1c1e', borderRadius: 20, padding: 24, borderWidth: 1.5, borderColor: '#2a2a2d', marginBottom: 20 },
  titulo:          { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  sub:             { fontSize: 14, color: '#666', marginBottom: 24 },
  label:           { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 6, marginTop: 4 },
  input:           { backgroundColor: '#2a2a2d', borderRadius: 12, padding: 14, fontSize: 15, color: '#fff', marginBottom: 14, borderWidth: 1, borderColor: '#333' },
  btn:             { backgroundColor: '#7C5CFC', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText:         { color: 'white', fontSize: 16, fontWeight: '700' },
  registerLink:    { alignItems: 'center', padding: 12 },
  registerLinkText:{ color: '#666', fontSize: 14 },
  registerLinkAccent: { color: '#c87aff', fontWeight: '600' },
})