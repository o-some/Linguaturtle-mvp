import { corsHeaders, errorJson, json, readJson } from '../_shared/http.ts';
import { authenticatedUser } from '../_shared/supabase.ts';

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const body = await readJson(request);
    const { user, userClient, adminClient } = await authenticatedUser(request);

    if (body.action === 'snapshot') {
      const { data, error } = await userClient.rpc('wallet_snapshot');
      if (error) throw error;
      return json(data);
    }

    if (body.action === 'spend') {
      if (typeof body.itemId !== 'string' || typeof body.eventId !== 'string') {
        return json({ error: 'invalid_spend_request' }, 422);
      }
      const { data, error } = await userClient.rpc('spend_shells', {
        p_item_id: body.itemId,
        p_event_id: body.eventId,
      });
      if (error) throw error;
      return json(data);
    }

    if (body.action === 'create_ad_ticket') {
      const audience = body.audience === 'adult' ? 'adult' : 'child';
      const { data, error } = await userClient.rpc('create_ad_reward_ticket', {
        p_audience: audience,
      });
      if (error) throw error;
      return json(data);
    }

    if (body.action === 'complete_ad_ticket') {
      if (typeof body.ticketId !== 'string' || body.proof?.completed !== true) {
        return json({ error: 'invalid_ad_completion' }, 422);
      }
      const { data, error } = await adminClient.rpc('complete_ad_reward', {
        p_user_id: user.id,
        p_ticket_id: body.ticketId,
        p_provider_proof: {
          provider: 'kidoz',
          completed: true,
          platform: body.proof.platform || 'unknown',
          receivedAt: new Date().toISOString(),
        },
      });
      if (error) throw error;
      return json(data);
    }

    if (body.action === 'gameplay_reward') {
      const amount = Number(body.amount);
      if (!Number.isInteger(amount) || amount < 1 || amount > 300 || typeof body.eventId !== 'string') {
        return json({ error: 'invalid_gameplay_reward' }, 422);
      }
      const reason = typeof body.reason === 'string' ? body.reason : 'learning';
      const { data, error } = await adminClient.rpc('credit_gameplay_reward', {
        p_user_id: user.id,
        p_event_id: body.eventId,
        p_amount: amount,
        p_reason: reason,
      });
      if (error) throw error;
      return json(data);
    }

    return json({ error: 'unknown_action' }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes('authentication_required') ? 401
      : message.includes('insufficient_shells') || message.includes('daily_limit') ? 409
      : 400;
    return errorJson(error, status);
  }
});
