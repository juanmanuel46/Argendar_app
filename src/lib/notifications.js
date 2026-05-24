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
    console.log('No es dispositivo real')
    return null
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  console.log('Status permisos:', existingStatus)

  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  console.log('Final status:', finalStatus)

  if (finalStatus !== 'granted') {
    console.log('Permiso denegado')
    return null
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: '93636524-c681-479e-b195-8b7bc28a9a90',
    })).data
    console.log('Token:', token)
    return token
  } catch (e) {
    console.log('Error obteniendo token:', e.message)
    return null
  }
}

export async function savePushToken(userId, token) {
  await supabase
    .from('app_users')
    .update({ push_token: token })
    .eq('id', userId)
}