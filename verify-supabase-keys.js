// Quick script to verify Supabase keys are correct
// Run with: node verify-supabase-keys.js

require('dotenv').config({ path: '.env.local' });

const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔍 Supabase Key Verification\n');
console.log('Instance:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('');

// Decode JWT (just the payload part, no verification)
function decodeJWT(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], 'base64').toString());
  } catch (e) {
    return null;
  }
}

const anonPayload = decodeJWT(anonKey);
const servicePayload = decodeJWT(serviceKey);

console.log('📝 Anon Key:');
if (anonPayload) {
  console.log('  Role:', anonPayload.role);
  console.log('  Project:', anonPayload.ref);
  console.log('  ✅ Valid JWT structure');
} else {
  console.log('  ❌ Invalid JWT');
}

console.log('');

console.log('🔐 Service Role Key:');
if (servicePayload) {
  console.log('  Role:', servicePayload.role);
  console.log('  Project:', servicePayload.ref);

  if (servicePayload.role === 'service_role') {
    console.log('  ✅ Correct role (service_role)');
  } else if (servicePayload.role === 'anon') {
    console.log('  ⚠️  WARNING: This is an anon key, not a service role key!');
    console.log('  🔧 Fix: Go to Supabase Dashboard → Settings → API');
    console.log('      Copy the "service_role" key (NOT the anon key)');
  } else {
    console.log('  ❌ Unknown role:', servicePayload.role);
  }
} else {
  console.log('  ❌ Invalid JWT');
}

console.log('');

if (anonKey === serviceKey) {
  console.log('⚠️  ISSUE: Both keys are identical!');
  console.log('   The service role key should be different from the anon key.');
  console.log('');
  console.log('🔧 To Fix:');
  console.log('   1. Go to: https://supabase.com/dashboard/project/racltbidxkdiyhlgpgar/settings/api');
  console.log('   2. Scroll down to "Project API keys"');
  console.log('   3. Copy the "service_role" key (it will be hidden, click "Reveal")');
  console.log('   4. Update SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.log('   5. Restart your dev server');
  console.log('');
} else {
  console.log('✅ Keys are different (good!)');
  console.log('');
}
