export function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function validateEnv(env: Env): string | null {
  if (!env.FIREBASE_API_KEY) return 'FIREBASE_API_KEY is required';
  if (!env.LLM_API_KEY) return 'LLM_API_KEY is required';
  return null;
}