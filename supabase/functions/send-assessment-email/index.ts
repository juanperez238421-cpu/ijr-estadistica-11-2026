import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
})

const escapeHtml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const formatDate = (value: unknown) => {
  if (!value) return '—'
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('es-CO', { timeZone: 'America/Bogota' })
}

function adminKey(): string | null {
  try {
    const modern = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}')
    if (modern.default) return modern.default
  } catch (_) {
    // Fall through to legacy hosted secret.
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || null
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405)

  const resendKey = Deno.env.get('RESEND_API_KEY')
  if (!resendKey) {
    return json({ ok: false, sent: false, configured: false, error: 'RESEND_API_KEY_not_configured' }, 503)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const secret = adminKey()
  if (!supabaseUrl || !secret) {
    return json({ ok: false, sent: false, error: 'supabase_admin_credentials_unavailable' }, 500)
  }

  let body: Record<string, unknown> = {}
  try { body = await request.json() } catch (_) { return json({ ok: false, error: 'invalid_json' }, 400) }

  const admin = createClient(supabaseUrl, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let outboxId = Number(body.outbox_id || 0)
  if (!outboxId && body.attempt_id) {
    const { data, error } = await admin
      .from('assessment_email_outbox')
      .select('id,status')
      .eq('attempt_id', String(body.attempt_id))
      .in('status', ['pending', 'sent'])
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) return json({ ok: false, sent: false, error: error.message }, 500)
    if (!data) return json({ ok: true, sent: false, queued: false, reason: 'no_outbox_row' }, 202)
    if (data.status === 'sent') return json({ ok: true, sent: true, already_sent: true, outbox_id: data.id })
    outboxId = Number(data.id)
  }

  if (!Number.isSafeInteger(outboxId) || outboxId <= 0) {
    return json({ ok: false, error: 'outbox_id_or_attempt_id_required' }, 400)
  }

  const { data: claim, error: claimError } = await admin.rpc('mailer_claim_assessment_email', {
    p_outbox_id: outboxId,
  })
  if (claimError) return json({ ok: false, sent: false, error: claimError.message }, 500)

  if (!claim?.claimable) {
    if (claim?.status === 'sent') {
      return json({ ok: true, sent: true, already_sent: true, outbox_id: outboxId, provider_message_id: claim.provider_message_id })
    }
    return json({ ok: true, sent: false, queued: false, outbox_id: outboxId, status: claim?.status || claim?.reason || 'not_claimable' }, 202)
  }

  const p = claim.payload || {}
  const rows = [
    ['Estudiante', p.student],
    ['Correo estudiantil', p.student_email],
    ['Grupo', p.group],
    ['Estado', p.status],
    ['Respondidas', p.answered_count],
    ['Correctas', p.correct_count],
    ['Incorrectas', p.incorrect_count],
    ['Puntaje', p.raw_points != null ? `${p.raw_points} / 15` : '—'],
    ['Nota', p.grade != null ? `${p.grade} / 5` : '—'],
    ['Eventos de integridad', p.integrity_strikes],
    ['Motivo de cierre', p.finish_reason],
    ['Inicio', formatDate(p.started_at)],
    ['Finalización', formatDate(p.submitted_at)],
    ['Attempt ID', p.attempt_id],
  ]

  const htmlRows = rows.map(([label, value]) => `
    <tr>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e5e5;font-weight:700;vertical-align:top">${escapeHtml(label)}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #e5e5e5;vertical-align:top">${escapeHtml(value ?? '—')}</td>
    </tr>`).join('')

  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#161616;line-height:1.45">
    <div style="max-width:720px;margin:auto">
      <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#666;font-weight:700">Instituto Jorge Robledo · Statistics 11</div>
      <h2 style="margin:8px 0 6px">Counting &amp; Permutations Assessment</h2>
      <p style="margin:0 0 18px">Registro automático de resultado y trazabilidad.</p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #ddd">${htmlRows}</table>
      <p style="font-size:12px;color:#666;margin-top:18px">Panel docente: https://juanperez238421-cpu.github.io/ijr-estadistica-11-2026/evaluacion-conteo-permutaciones/?teacher=1</p>
    </div>
  </body></html>`

  const text = rows.map(([label, value]) => `${label}: ${value ?? '—'}`).join('\n')
  const from = Deno.env.get('ASSESSMENT_EMAIL_FROM') || 'Instituto Jorge Robledo <onboarding@resend.dev>'

  let providerResponse: Response
  let providerPayload: any = null
  try {
    providerResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `ijr-stat11-outbox-${outboxId}`,
      },
      body: JSON.stringify({
        from,
        to: [claim.recipient_email],
        subject: claim.subject,
        html,
        text,
      }),
    })
    providerPayload = await providerResponse.json().catch(() => ({}))
  } catch (error) {
    await admin.rpc('mailer_mark_assessment_email_failed', {
      p_outbox_id: outboxId,
      p_error_message: error instanceof Error ? error.message : String(error),
    })
    return json({ ok: false, sent: false, outbox_id: outboxId, error: 'provider_network_error' }, 502)
  }

  if (!providerResponse.ok) {
    const message = providerPayload?.message || providerPayload?.error || `Resend HTTP ${providerResponse.status}`
    await admin.rpc('mailer_mark_assessment_email_failed', {
      p_outbox_id: outboxId,
      p_error_message: String(message),
    })
    return json({ ok: false, sent: false, outbox_id: outboxId, provider_status: providerResponse.status, error: message }, 502)
  }

  const providerId = String(providerPayload?.id || '')
  await admin.rpc('mailer_mark_assessment_email_sent', {
    p_outbox_id: outboxId,
    p_provider_message_id: providerId,
  })

  return json({ ok: true, sent: true, configured: true, outbox_id: outboxId, provider_message_id: providerId })
})
