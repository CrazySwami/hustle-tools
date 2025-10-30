// Diagnostic endpoint to check MORPH_API_KEY environment variable
// This helps debug Vercel environment variable issues
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  console.log('🔍 Checking environment variables...');

  // Get all env var keys
  const allKeys = Object.keys(process.env);

  // Filter for relevant keys
  const morphKeys = allKeys.filter(k => k.includes('MORPH'));
  const apiKeys = allKeys.filter(k => k.includes('API') || k.includes('KEY'));

  // Check MORPH_API_KEY specifically
  const hasMorphKey = !!process.env.MORPH_API_KEY;
  const morphKeyLength = process.env.MORPH_API_KEY?.length || 0;
  const morphKeyPrefix = process.env.MORPH_API_KEY?.substring(0, 10) || 'NOT SET';

  console.log('Has MORPH_API_KEY:', hasMorphKey);
  console.log('MORPH-related keys:', morphKeys);
  console.log('API-related keys count:', apiKeys.length);

  return Response.json({
    success: true,
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
    checks: {
      hasMorphKey,
      morphKeyLength,
      morphKeyPrefix,
      morphKeysFound: morphKeys,
      totalEnvVars: allKeys.length,
      apiRelatedKeysCount: apiKeys.length,
    },
    hint: hasMorphKey
      ? '✅ MORPH_API_KEY is present! If Morph still fails, check the API key is valid at morphllm.com'
      : '❌ MORPH_API_KEY not found. Go to Vercel Dashboard → Settings → Environment Variables → Add MORPH_API_KEY, then redeploy.',
  });
}
