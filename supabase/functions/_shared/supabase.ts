import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export function clients(request: Request) {
  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceRoleKey) throw new Error('supabase_server_config_missing');

  const authorization = request.headers.get('Authorization') || '';
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const adminClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { userClient, adminClient };
}

export async function authenticatedUser(request: Request) {
  const { userClient, adminClient } = clients(request);
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) throw new Error('authentication_required');
  return { user, userClient, adminClient };
}
