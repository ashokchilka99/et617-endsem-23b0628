import { challengeSchema, validateChallenge } from '../tutor.mjs';

const endpoint = 'https://ai-gateway.vercel.sh/v1/chat/completions';
const defaultModel = 'openai/gpt-4.1-mini';

function offline(res, reason) {
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30');
  return res.status(200).json({ source: 'offline', reason });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Use GET' });
  }
  const params = new URL(req.url, 'https://balance.example').searchParams;
  const variant = params.get('variant');
  if (params.size !== 1 || !/^[0-3]$/.test(variant ?? '')) {
    return res.status(400).json({ error: 'Choose a known challenge variant' });
  }
  const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || req.headers['x-vercel-oidc-token'];
  if (!token) return offline(res, 'credentials-unavailable');

  const coefficient = -2 - Number(variant);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      signal: AbortSignal.timeout(4200),
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.AI_GATEWAY_MODEL || defaultModel,
        max_tokens: 120,
        messages: [
          { role: 'system', content: 'Create one Class 8 linear equation ax + b = c. Return the four integer fields a, b, c and x only. The listed x must be the solution. Use small values suitable for mental arithmetic.' },
          { role: 'user', content: 'Generate a harder equation for a learner who just solved two items correctly without hints. Set a to ' + coefficient + '. Pick b between 2 and 9 and x between -8 and -2. Compute c = a*x+b.' },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: 'linear_equation', strict: true, schema: challengeSchema },
        },
      }),
    });
    if (!response.ok) {
      console.warn('AI Gateway challenge response:', response.status);
      return offline(res, 'gateway-unavailable');
    }
    const payload = await response.json();
    const question = JSON.parse(payload.choices?.[0]?.message?.content ?? 'null');
    if (!validateChallenge(question) || question.a !== coefficient) return offline(res, 'validation-failed');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=43200');
    return res.status(200).json({ source: 'ai', question });
  } catch {
    return offline(res, 'request-failed');
  }
}
