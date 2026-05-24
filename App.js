import { useEffect } from 'react'
import { registerForPushNotifications } from './src/lib/notifications'
import Navigation from './src/navigation'

export default function App() {
  useEffect(() => {
    registerForPushNotifications()
  }, [])

  return <Navigation />
}