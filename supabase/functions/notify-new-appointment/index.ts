import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { record } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Obtener datos del turno
  const { data: appointment } = await supabase
    .from('appointments')
    .select('*, clients(name), services(name), businesses(name), employees(name)')
    .eq('id', record.id)
    .single()

  if (!appointment) return new Response('No appointment', { status: 404 })

  // Obtener push tokens de admin y empleado del negocio
  const { data: appUsers } = await supabase
    .from('app_users')
    .select('push_token')
    .eq('business_id', appointment.business_id)
    .not('push_token', 'is', null)

  if (!appUsers || appUsers.length === 0) return new Response('No tokens', { status: 200 })

  const tokens = appUsers.map(u => u.push_token).filter(Boolean)

  // Enviar notificación via Expo
  const messages = tokens.map(token => ({
    to: token,
    sound: 'default',
    title: '📅 Nuevo turno',
    body: `${appointment.clients?.name} reservó ${appointment.services?.name} a las ${appointment.time?.slice(0, 5)}`,
    data: { appointmentId: record.id },
  }))

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  })

  return new Response(JSON.stringify({ sent: tokens.length }), { status: 200 })
})