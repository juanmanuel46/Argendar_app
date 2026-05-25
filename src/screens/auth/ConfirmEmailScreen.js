import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { colors, radius, spacing } from '../../lib/theme'

export default function ConfirmEmailScreen({ route, navigation }) {
  const { email } = route.params

  async function reenviar() {
    await supabase.auth.resend({ type: 'signup', email })
    Alert.alert('Listo ✓', 'Te reenviamos el email de confirmación.')
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      <View style={s.iconWrap}>
        <Feather name="mail" size={32} color={colors.primary} />
      </View>

      <Text style={s.titulo}>Revisá tu email</Text>
      <Text style={s.sub}>
        Te mandamos un link a{'\n'}
        <Text style={s.email}>{email}</Text>
        {'\n\n'}
        Tocá el link para confirmar tu cuenta y continuar.
      </Text>

      <View style={s.card}>
        <View style={s.paso}>
          <View style={s.pasoBubble}><Text style={s.pasoNum}>1</Text></View>
          <Text style={s.pasoText}>Abrí tu casilla de email</Text>
        </View>
        <View style={s.paso}>
          <View style={s.pasoBubble}><Text style={s.pasoNum}>2</Text></View>
          <Text style={s.pasoText}>Buscá el email de Bookzy</Text>
        </View>
        <View style={s.paso}>
          <View style={s.pasoBubble}><Text style={s.pasoNum}>3</Text></View>
          <Text style={s.pasoText}>Tocá "Confirmar cuenta"</Text>
        </View>
      </View>

      <TouchableOpacity style={s.btnReenviar} onPress={reenviar} activeOpacity={0.7}>
        <Feather name="refresh-cw" size={14} color={colors.primary} />
        <Text style={s.btnReenviarText}>Reenviar email</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={s.btnLogin}
        onPress={() => navigation.navigate('Login')}
        activeOpacity={0.7}
      >
        <Text style={s.btnLoginText}>Ya confirmé → Ir al login</Text>
        <Feather name="arrow-right" size={16} color="white" />
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.bg, padding: spacing.lg, paddingTop: 80, alignItems: 'center' },
  iconWrap:       { width: 80, height: 80, borderRadius: 24, backgroundColor: colors.primaryGlow, justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  titulo:         { fontSize: 26, fontWeight: '800', color: colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  sub:            { fontSize: 15, color: colors.textMuted, textAlign: 'center', lineHeight: 24, marginBottom: 28 },
  email:          { color: colors.primary, fontWeight: '600' },
  card:           { width: '100%', backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.cardBorder, gap: 16, marginBottom: 24 },
  paso:           { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pasoBubble:     { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryGlow, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  pasoNum:        { color: colors.primary, fontWeight: '700', fontSize: 13 },
  pasoText:       { color: colors.textSecondary, fontSize: 14 },
  btnReenviar:    { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, marginBottom: 12 },
  btnReenviarText:{ color: colors.primary, fontWeight: '600', fontSize: 14 },
  btnLogin:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: radius.md, padding: 16, width: '100%' },
  btnLoginText:   { color: 'white', fontWeight: '700', fontSize: 15 },
})