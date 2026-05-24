import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import TodayScreen from '../screens/employee/TodayScreen'

const Tab = createBottomTabNavigator()

export default function EmployeeNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#13131A', borderTopColor: 'rgba(124,92,252,0.2)' },
        tabBarActiveTintColor: '#7C5CFC',
        tabBarInactiveTintColor: '#7A7A9A',
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{ tabBarLabel: 'Hoy' }}
      />
    </Tab.Navigator>
  )
}