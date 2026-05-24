import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

import LoginScreen from '../screens/auth/LoginScreen'
import EmployeeNavigator from './EmployeeNavigator'
import AdminNavigator from './AdminNavigator'

const Stack = createNativeStackNavigator()

export default function Navigation() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchRole(session.user.id)
      else setLoading(false)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchRole(session.user.id)
      else { setRole(null); setLoading(false) }
    })
  }, [])

  async function fetchRole(userId) {
    const { data } = await supabase.from('app_users').select('role').eq('id', userId).single()
    setRole(data?.role ?? 'employee')
    setLoading(false)
  }

  if (loading) return null

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : role === 'admin' ? (
          <Stack.Screen name="Admin" component={AdminNavigator} />
        ) : (
          <Stack.Screen name="Employee" component={EmployeeNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}