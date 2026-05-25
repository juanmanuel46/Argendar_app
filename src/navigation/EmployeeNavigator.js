import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import TodayScreen   from '../screens/employee/TodayScreen'
import ProfileScreen from '../screens/employee/ProfileScreen'
import { colors } from '../lib/theme'

const Tab = createBottomTabNavigator()

export default function EmployeeNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0B0B0F',
          borderTopColor: '#1f1f25',
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor:   '#A78BFA',
        tabBarInactiveTintColor: '#555',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, focused }) => {
          const icon = route.name === 'Today' ? 'calendar' : 'user'
          return (
            <View style={{
              width: 34, height: 34, borderRadius: 10,
              justifyContent: 'center', alignItems: 'center',
              backgroundColor: focused ? 'rgba(167,139,250,0.15)' : 'transparent',
            }}>
              <Feather name={icon} size={18} color={color} />
            </View>
          )
        },
      })}
    >
      <Tab.Screen name="Today"   component={TodayScreen}   options={{ tabBarLabel: 'Hoy' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Perfil' }} />
    </Tab.Navigator>
  )
}