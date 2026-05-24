import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'
import TodayScreen from '../screens/employee/TodayScreen'
import ProfileScreen from '../screens/employee/ProfileScreen'

const Tab = createBottomTabNavigator()

export default function EmployeeNavigator() {
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
        name="Today"
        component={TodayScreen}
        options={{
          tabBarLabel: 'Hoy',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📅</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  )
}