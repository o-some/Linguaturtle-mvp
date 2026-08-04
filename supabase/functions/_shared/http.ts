export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

export const errorJson = (error: unknown, status = 400) => {
  const message = error instanceof Error ? error.message : String(error || 'unknown_error');
  return json({ error: message }, status);
};

export const readJson = async (request: Request) => {
  try {
    return await request.json();
  } catch {
    throw new Error('invalid_json');
  }
};
