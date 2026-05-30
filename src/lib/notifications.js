import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { supabase } from './supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export async function registerForPushNotifications() {
  if (!Device.isDevice) return null

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') return null

  try {
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: '93636524-c681-479e-b195-8b7bc28a9a90',
    })).data
    return token
  } catch {
    return null
  }
}

export async function savePushToken(userId, token) {
  await supabase
    .from('app_users')
    .update({ push_token: token })
    .eq('id', userId)
}
