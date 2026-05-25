import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { supabase } from '../lib/supabase'

// Tus pantallas de autenticación
import LoginScreen         from '../screens/auth/LoginScreen'
import RegisterScreen      from '../screens/auth/RegisterScreen'

// Tus pantallas de Onboarding y Suscripción
import CreateBusinessScreen from '../screens/onboarding/CreateBusinessScreen'
import AddServicesScreen  from '../screens/onboarding/AddServicesScreen'
import SubscriptionScreen from '../screens/subscription/SubscriptionScreen'

// Tus navegadores secundarios (Anidados)
import EmployeeNavigator  from './EmployeeNavigator'
import AdminNavigator     from './AdminNavigator'

const Stack = createNativeStackNavigator()

export default function Navigation() {
  const [session, setSession]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [appState, setAppState] = useState('loading') 
  // appState puede ser: 'loading' | 'no_session' | 'onboarding' | 'subscription_expired' | 'admin' | 'employee'

  useEffect(() => {
    // 1. Verificar si ya hay una sesión guardada en el dispositivo al abrir la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        checkUserState(session.user)
      } else {
        setAppState('no_session')
        setLoading(false)
      }
    })

    // 2. Escuchar en tiempo real si el usuario inicia o cierra sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        checkUserState(session.user)
      } else {
        setAppState('no_session')
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkUserState(user) {
    setLoading(true)

    // 1. Buscar si el usuario existe en app_users
    const { data: appUser } = await supabase
      .from('app_users')
      .select('role, business_id, employee_id')
      .eq('id', user.id)
      .single()

    if (!appUser) {
      // Usuario nuevo — verificar si su email está en employees (fue invitado)
      const { data: emp } = await supabase
        .from('employees')
        .select('id, business_id')
        .eq('email', user.email)
        .eq('active', true)
        .single()

      if (emp) {
        // Es empleado invitado — crear app_user automáticamente
        await supabase.from('app_users').insert({
          id: user.id,
          business_id: emp.business_id,
          employee_id: emp.id,
          role: 'employee',
        })
        setAppState('employee')
      } else {
        // Es nuevo dueño — ir al onboarding
        setAppState('onboarding')
      }
      setLoading(false)
      return
    }

    if (appUser.role === 'employee') {
      setAppState('employee')
      setLoading(false)
      return
    }

    // Es admin — verificar suscripción
    if (appUser.business_id) {
      const { data: biz } = await supabase
        .from('businesses')
        .select('subscription_status, trial_ends_at')
        .eq('id', appUser.business_id)
        .single()

      if (biz) {
        const ahora = new Date()
        const trialVence = new Date(biz.trial_ends_at)
        if (biz.subscription_status === 'trial' && ahora > trialVence) {
          // Trial expirado
          await supabase.from('businesses').update({ subscription_status: 'expired' }).eq('id', appUser.business_id)
          setAppState('subscription_expired')
        } else if (biz.subscription_status === 'expired') {
          setAppState('subscription_expired')
        } else {
          setAppState('admin')
        }
      } else {
        setAppState('admin')
      }
    } else {
      setAppState('onboarding')
    }
    setLoading(false)
  }

  // SI ESTÁ CARGANDO: Bloqueamos la app con la pantalla de carga para que no intente renderizar rutas vacías.
  if (loading || appState === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#7C5CFC" size="large" />
      </View>
    )
  }

  // SI YA TERMINÓ DE CARGAR: Muestra el navegador correspondiente de forma segura.
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        
        {/* Flujo de Autenticación */}
        {appState === 'no_session' && (
          <>
            <Stack.Screen name="Login"    component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
        
        {/* Flujo de Onboarding */}
        {appState === 'onboarding' && (
          <>
            <Stack.Screen name="CreateBusiness" component={CreateBusinessScreen} />
            <Stack.Screen name="AddServices"    component={AddServicesScreen} />
          </>
        )}
        
        {/* Suscripción Expirada */}
        {appState === 'subscription_expired' && (
          <Stack.Screen name="Subscription" component={SubscriptionScreen} />
        )}
        
        {/* Flujo de Administrador */}
        {appState === 'admin' && (
          <Stack.Screen name="Admin" component={AdminNavigator} />
        )}
        
        {/* Flujo de Empleado */}
        {appState === 'employee' && (
          <Stack.Screen name="Employee" component={EmployeeNavigator} />
        )}

      </Stack.Navigator>
    </NavigationContainer>
  )
}