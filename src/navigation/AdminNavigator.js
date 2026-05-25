import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { View } from 'react-native'
import { Feather } from '@expo/vector-icons'

import DashboardScreen from '../screens/admin/DashboardScreen'
import AppointmentsScreen from '../screens/admin/AppointmentsScreen'
import EmployeesScreen from '../screens/admin/EmployeesScreen'
import SettingsScreen from '../screens/admin/SettingsScreen'
import EmployeeScheduleScreen from '../screens/admin/EmployeeScheduleScreen'
import SubscriptionScreen from '../screens/subscription/SubscriptionScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0B0B0F' },
        headerTintColor: '#A78BFA',
        headerTitleStyle: { color: '#fff', fontWeight: '700' }
      }}
    >
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="EmployeeSchedule"
        component={EmployeeScheduleScreen}
        options={{ title: 'Horarios' }}
      />

      <Stack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  )
}

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarStyle: {
          backgroundColor: '#0B0B0F',
          borderTopColor: '#1f1f25',
          height: 64,
          paddingBottom: 10,
          paddingTop: 6
        },

        tabBarActiveTintColor: '#A78BFA',
        tabBarInactiveTintColor: '#666',

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600'
        },

        tabBarIcon: ({ color, focused }) => {
          let iconName

          switch (route.name) {
            case 'Dashboard':
              iconName = 'bar-chart-2'
              break
            case 'Appointments':
              iconName = 'calendar'
              break
            case 'Employees':
              iconName = 'users'
              break
            case 'Settings':
              iconName = 'settings'
              break
          }

          return (
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: focused
                  ? 'rgba(167,139,250,0.15)'
                  : 'transparent'
              }}
            >
              <Feather name={iconName} size={18} color={color} />
            </View>
          )
        }
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Resumen' }}
      />

      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{ tabBarLabel: 'Turnos' }}
      />

      <Tab.Screen
        name="Employees"
        component={EmployeesScreen}
        options={{ tabBarLabel: 'Equipo' }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsStack}
        options={{ tabBarLabel: 'Ajustes' }}
      />
    </Tab.Navigator>
  )
}