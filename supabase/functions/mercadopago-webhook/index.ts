import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { type, data } = body

    // Solo procesar eventos de suscripción
    if (type !== 'subscription_preapproval') {
      return new Response('ok', { status: 200, headers: corsHeaders })
    }

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')!

    // Obtener detalle completo de la preapproval
    const mpResp = await fetch(`https://api.mercadopago.com/preapproval/${data.id}`, {
      headers: { 'Authorization': `Bearer ${mpToken}` },
    })

    const preapproval = await mpResp.json()

    const businessId = preapproval.external_reference
    if (!businessId) {
      return new Response('sin external_reference', { status: 200, headers: corsHeaders })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    if (preapproval.status === 'authorized') {
      const endsAt = preapproval.next_payment_date
        ? new Date(preapproval.next_payment_date).toISOString()
        : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString()

      await supabaseAdmin
        .from('businesses')
        .update({
          subscription_status: 'active',
          subscription_ends_at: endsAt,
          mp_subscription_id: preapproval.id,
        })
        .eq('id', businessId)
    } else if (preapproval.status === 'cancelled' || preapproval.status === 'paused') {
      await supabaseAdmin
        .from('businesses')
        .update({ subscription_status: 'expired' })
        .eq('id', businessId)
    }

    return new Response('ok', { status: 200, headers: corsHeaders })
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
