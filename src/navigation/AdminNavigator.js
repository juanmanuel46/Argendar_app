import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'
import DashboardScreen from '../screens/admin/DashboardScreen'
import AppointmentsScreen from '../screens/admin/AppointmentsScreen'
import EmployeesScreen from '../screens/admin/EmployeesScreen'
import SettingsScreen from '../screens/admin/SettingsScreen'

const Tab = createBottomTabNavigator()

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#1c1c1e', borderTopColor: '#222', height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: '#c87aff',
        tabBarInactiveTintColor: '#555',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Resumen', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📊</Text> }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{ tabBarLabel: 'Turnos', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📅</Text> }}
      />
      <Tab.Screen
        name="Employees"
        component={EmployeesScreen}
        options={{ tabBarLabel: 'Empleados', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👥</Text> }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Config', tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text> }}
      />
    </Tab.Navigator>
  )
}