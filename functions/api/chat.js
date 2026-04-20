export async function onRequestPost(context) {
  const { env, request } = context;
  const jsonHeaders = { 'Content-Type': 'application/json' };

  if (!env.OPENROUTER_KEY) {
    return new Response(
      JSON.stringify({ error: 'Server misconfiguration: missing OPENROUTER_KEY' }),
      { status: 500, headers: jsonHeaders }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const { messages, model, max_tokens, temperature } = body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'messages must be a non-empty array' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }
  if (messages.length > 40) {
    return new Response(JSON.stringify({ error: 'messages exceeds limit (40)' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  let totalChars = 0;
  for (const m of messages) {
    if (!m || typeof m.role !== 'string' || typeof m.content !== 'string') {
      return new Response(JSON.stringify({ error: 'invalid message shape' }), {
        status: 400,
        headers: jsonHeaders,
      });
    }
    totalChars += m.content.length;
  }
  if (totalChars > 20000) {
    return new Response(JSON.stringify({ error: 'messages content exceeds 20000 chars' }), {
      status: 400,
      headers: jsonHeaders,
    });
  }

  const safeMaxTokens = Math.min(
    typeof max_tokens === 'number' && max_tokens > 0 ? max_tokens : 200,
    500
  );
  const safeTemperature =
    typeof temperature === 'number' && temperature >= 0 && temperature <= 2 ? temperature : 0.7;
  const safeModel =
    typeof model === 'string' && model.length > 0 && model.length < 200
      ? model
      : 'meta-llama/llama-3.3-70b-instruct:free';

  const origin = request.headers.get('Origin') || request.headers.get('Referer') || '';

  let upstream;
  try {
    upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENROUTER_KEY}`,
        'HTTP-Referer': origin,
        'X-Title': 'KNZN Klaus Agent',
      },
      body: JSON.stringify({
        model: safeModel,
        messages,
        max_tokens: safeMaxTokens,
        temperature: safeTemperature,
      }),
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Upstream fetch failed' }), {
      status: 502,
      headers: jsonHeaders,
    });
  }

  let data;
  try {
    data = await upstream.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Upstream returned invalid JSON' }), {
      status: 502,
      headers: jsonHeaders,
    });
  }

  return new Response(JSON.stringify(data), {
    status: upstream.status,
    headers: jsonHeaders,
  });
}
