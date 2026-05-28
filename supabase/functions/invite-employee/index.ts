import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { email, negocio } = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Primero intentamos invitar normalmente
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { invited_as: 'employee' },
      redirectTo: 'argendar://reset-password',
    })

    // Si falla porque ya existe, generamos un link de recovery
    if (inviteError) {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: 'argendar://reset-password' },
      })

      if (linkError) throw linkError

      // Mandamos el correo manualmente
      const { error: mailError } = await supabaseAdmin.auth.admin.sendRawEmail({
        to: email,
        subject: `Tu acceso a Argendar${negocio ? ` — ${negocio}` : ''}`,
        html: `
          <p>Hola,</p>
          <p>Tu cuenta ya existe en Argendar. Tocá el botón para establecer tu contraseña:</p>
          <a href="${linkData.properties.action_link}" style="background:#8B5CF6;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0;">
            Establecer contraseña
          </a>
          <p>Si no esperabas este correo, ignoralo.</p>
        `,
      })

      if (mailError) throw mailError
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})