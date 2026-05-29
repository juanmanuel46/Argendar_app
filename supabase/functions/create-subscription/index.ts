import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const MP_PLAN_ID = '34695537cf3c4e1da3aaaeb7cc75de5b'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { business_id } = await req.json()

    if (!business_id) {
      throw new Error('Falta business_id')
    }

    // Construir URL del checkout de MP con external_reference para identificar el negocio en el webhook
    const init_point = `https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=${MP_PLAN_ID}&external_reference=${encodeURIComponent(business_id)}`

    return new Response(
      JSON.stringify({ init_point }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
