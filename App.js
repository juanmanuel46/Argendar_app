import { useEffect } from 'react'
import { registerForPushNotifications, savePushToken } from './src/lib/notifications'
import Navigation from './src/navigation'
import { supabase } from './src/lib/supabase'

export default function App() {
  useEffect(() => {
    async function setup() {
      const token = await registerForPushNotifications()
      if (token) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) await savePushToken(user.id, token)
      }
    }
    setup()
  }, [])

  return <Navigation />
}