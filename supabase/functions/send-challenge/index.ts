import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (request: Request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const auth = request.headers.get('Authorization') ?? '';
  const client = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { challenge_id } = await request.json();
  const { data: challenge, error } = await client.from('game_challenges').select('id,challenger_id,challenged_id,status,stake_points').eq('id', challenge_id).single();
  if (error || !challenge || challenge.challenger_id !== user.id || challenge.status !== 'pending') return Response.json({ error: 'Challenge not found' }, { status: 404 });
  const { data: sender } = await client.from('game_profiles').select('username').eq('id', user.id).maybeSingle();
  const apiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');
  const appId = Deno.env.get('ONESIGNAL_APP_ID');
  if (!apiKey || !appId) return Response.json({ error: 'Push delivery is not configured on the server.' }, { status: 503 });
  const pushed = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: { Authorization: `Key ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: appId,
      target_channel: 'push',
      include_aliases: { external_id: [challenge.challenged_id] },
      headings: { en: 'Egg challenge!' },
      contents: { en: challenge.stake_points ? `${sender?.username || 'A player'} challenged you for ${challenge.stake_points} points. Match the stake to accept.` : `${sender?.username || 'A player'} invited you to a casual battle. Tap to accept or decline.` },
      data: { type: 'egg_challenge', challenge_id: challenge.id },
    }),
  });
  const result = await pushed.json().catch(() => ({}));
  return Response.json(result, { status: pushed.ok ? 200 : 502 });
});
