import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email.trim() || !password.trim()) { Alert.alert('Completá todos los campos'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    })
    if (error) { Alert.alert('Error', error.message); setLoading(false); return }
    setLoading(false)
  }

  return (
    <View style={s.container}>
      <Text style={s.logo}>Bookzy</Text>
      <Text style={s.title}>Hola 👋</Text>
      <Text style={s.subtitle}>Ingresá para continuar</Text>

      <TextInput
        style={s.input}
        placeholder="tu@email.com"
        placeholderTextColor="#7A7A9A"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={s.input}
        placeholder="Contraseña"
        placeholderTextColor="#7A7A9A"
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
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', justifyContent: 'center', padding: 32 },
  logo: { fontSize: 32, fontWeight: '800', color: '#7C5CFC', textAlign: 'center', marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: '#F0F0F8', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#7A7A9A', marginBottom: 32 },
  input: { backgroundColor: '#13131A', borderWidth: 1, borderColor: 'rgba(124,92,252,0.2)', borderRadius: 12, padding: 16, fontSize: 16, color: '#F0F0F8', marginBottom: 16 },
  btn: { backgroundColor: '#7C5CFC', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText: { color: 'white', fontSize: 16, fontWeight: '700' },
})