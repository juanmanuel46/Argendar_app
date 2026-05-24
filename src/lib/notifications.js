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
  if (!Device.isDevice) {
    console.log('Las notificaciones solo funcionan en dispositivo real')
    return null
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.log('Permiso de notificaciones denegado')
    return null
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data
  console.log('Push token:', token)
  return token
}

export async function savePushToken(userId, token) {
  await supabase
    .from('app_users')
    .update({ push_token: token })
    .eq('id', userId)
}