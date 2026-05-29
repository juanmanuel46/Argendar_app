import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useEffect, useState, useRef } from 'react'
import { View, ActivityIndicator, DeviceEventEmitter, Linking } from 'react-native'
import { supabase } from '../lib/supabase'
import { colors } from '../lib/theme'

import LoginScreen          from '../screens/auth/LoginScreen'
import RegisterScreen       from '../screens/auth/RegisterScreen'
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen'
import ConfirmEmailScreen   from '../screens/auth/ConfirmEmailScreen'
import ResetPasswordScreen  from '../screens/auth/ResetPasswordScreen'
import CreateBusinessScreen from '../screens/onboarding/CreateBusinessScreen'
import AddServicesScreen    from '../screens/onboarding/AddServicesScreen'
import SubscriptionScreen   from '../screens/subscription/SubscriptionScreen'
import EmployeeNavigator    from './EmployeeNavigator'
import AdminNavigator       from './AdminNavigator'

const Stack = createNativeStackNavigator()

export default function Navigation() {
  const [loading,  setLoading]  = useState(true)
  const [appState, setAppState] = useState('loading')
  const appStateRef = useRef('loading')

  function updateAppState(newState) {
    appStateRef.current = newState
    setAppState(newState)
  }

  // ── Auth + sesión ──────────────────────────────────────────────────
  useEffect(() => {
    Linking.getInitialURL().then(url => {
      if (url?.includes('reset-password')) {
        updateAppState('reset_password')
        setLoading(false)
        return
      }

      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) checkUserState(session.user)
        else { updateAppState('no_session'); setLoading(false) }
      })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Si estamos en reset_password, no interrumpir
      if (appStateRef.current === 'reset_password') return
      if (session) checkUserState(session.user)
      else { updateAppState('no_session'); setLoading(false) }
    })

    const eventSub = DeviceEventEmitter.addListener('recheck_user_state', async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) checkUserState(session.user)
    })

    return () => {
      subscription.unsubscribe()
      eventSub.remove()
    }
  }, [])

  // ── Deep links ─────────────────────────────────────────────────────
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url?.includes('reset-password')) updateAppState('reset_password')
      if (url?.includes('subscription-result')) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) checkUserState(session.user)
        })
      }
    })

    Linking.getInitialURL().then(url => {
      if (url?.includes('reset-password')) updateAppState('reset_password')
    })

    return () => sub.remove()
  }, [])

  async function checkUserState(user) {
    setLoading(true)

    const { data: appUser } = await supabase
      .from('app_users')
      .select('role, business_id, employee_id')
      .eq('id', user.id)
      .single()

    if (!appUser) {
      const { data: emp } = await supabase
        .from('employees')
        .select('id, business_id')
        .eq('email', user.email)
        .eq('active', true)
        .single()

      if (emp) {
        await supabase.from('app_users').insert({
          id:          user.id,
          business_id: emp.business_id,
          employee_id: emp.id,
          role:        'employee',
        })
        updateAppState('employee')
      } else {
        updateAppState('onboarding')
      }
      setLoading(false)
      return
    }

    if (appUser.role === 'employee') {
      updateAppState('employee')
      setLoading(false)
      return
    }

    if (!appUser.business_id) {
      updateAppState('onboarding')
      setLoading(false)
      return
    }

    const { data: biz } = await supabase
      .from('businesses')
      .select('subscription_status, trial_ends_at')
      .eq('id', appUser.business_id)
      .single()

    if (biz) {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const vencimiento = new Date(biz.trial_ends_at)
      vencimiento.setHours(0, 0, 0, 0)
      const expired = biz.subscription_status === 'trial' && hoy > vencimiento

      if (expired) {
        await supabase.from('businesses')
          .update({ subscription_status: 'expired' })
          .eq('id', appUser.business_id)
        updateAppState('subscription_expired')
      } else if (biz.subscription_status === 'expired') {
        updateAppState('subscription_expired')
      } else {
        updateAppState('admin')
      }
    } else {
      updateAppState('admin')
    }
    setLoading(false)
  }

  if (loading || appState === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>

        {appState === 'no_session' && (
          <>
            <Stack.Screen name="Login"          component={LoginScreen} />
            <Stack.Screen name="Register"       component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ConfirmEmail"   component={ConfirmEmailScreen} />
          </>
        )}

        {appState === 'reset_password' && (
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        )}

        {appState === 'onboarding' && (
          <>
            <Stack.Screen name="CreateBusiness" component={CreateBusinessScreen} />
            <Stack.Screen name="AddServices"    component={AddServicesScreen} />
          </>
        )}

        {appState === 'subscription_expired' && (
          <Stack.Screen name="Subscription" component={SubscriptionScreen} />
        )}

        {appState === 'admin' && (
          <Stack.Screen name="Admin" component={AdminNavigator} />
        )}

        {appState === 'employee' && (
          <Stack.Screen name="Employee" component={EmployeeNavigator} />
        )}

      </Stack.Navigator>
    </NavigationContainer>
  )
}