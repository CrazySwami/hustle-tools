# Vercel Environment Variables Fix

## Issue
`MORPH_API_KEY not configured` error on Vercel production despite adding the variable to Vercel dashboard.

## Root Cause
Environment variables in Vercel need to be:
1. Added in the dashboard
2. Applied to the correct environment (Production/Preview/Development)
3. The app needs to be **redeployed** after adding variables

## Fix Applied

### Code Changes
**File**: `src/app/api/morph-apply/route.ts`

1. **Explicitly set runtime to Node.js**:
```typescript
export const runtime = 'nodejs'; // Explicitly use Node.js runtime for env vars
```

This ensures the API route uses Node.js runtime where `process.env` is fully supported.

2. **Improved error logging**:
```typescript
if (!process.env.MORPH_API_KEY) {
  console.error('❌ MORPH_API_KEY not found in environment variables');
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('MORPH')));
  return Response.json({
    error: 'MORPH_API_KEY not configured. Get one at https://morphllm.com',
    hint: 'Check Vercel dashboard > Settings > Environment Variables. Make sure MORPH_API_KEY is set for Production environment and redeploy.'
  }, { status: 500 });
}
```

Now logs will show which MORPH-related env vars are available (if any).

## Steps to Fix on Vercel

### 1. Verify Environment Variable in Vercel Dashboard

Go to: **Vercel Dashboard** → **Your Project** → **Settings** → **Environment Variables**

Check:
- ✅ Variable name is exactly: `MORPH_API_KEY` (case-sensitive!)
- ✅ Value is your Morph API key (starts with `sk-morph-...`)
- ✅ Applied to: **Production** ✓ (and optionally Preview, Development)

### 2. Redeploy Your Application

**Option A: Trigger new deployment**
```bash
git add .
git commit -m "fix: add runtime=nodejs for MORPH_API_KEY"
git push origin main
```

**Option B: Redeploy from Vercel Dashboard**
1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Select **"Use existing Build Cache"** ✗ (uncheck to force fresh build)
5. Click **"Redeploy"**

### 3. Verify the Fix

After redeployment:
1. Go to your production site
2. Try using the Morph Fast Apply feature
3. Check browser console for any new error messages
4. Check Vercel Function Logs:
   - Go to **Deployments** → **Your deployment** → **Functions**
   - Click on `/api/morph-apply`
   - Look for console logs

## Common Issues & Solutions

### Issue: "Variable not found" after adding

**Cause**: Environment variables are baked into the build. Adding a variable doesn't update existing deployments.

**Solution**: Redeploy (see Step 2 above).

---

### Issue: Variable works in Preview but not Production

**Cause**: Variable not applied to Production environment.

**Solution**:
1. Go to **Settings** → **Environment Variables**
2. Click **Edit** on `MORPH_API_KEY`
3. Make sure **Production** is checked ✓
4. Click **Save**
5. Redeploy

---

### Issue: Still not working after redeploy

**Possible causes**:
1. **Typo in variable name**
   - Must be exactly: `MORPH_API_KEY`
   - Check for extra spaces, wrong case, etc.

2. **Edge Runtime issue**
   - Some env vars don't work in Edge Runtime
   - Fix: We've added `export const runtime = 'nodejs'` to force Node.js runtime

3. **Build cache**
   - Old build cached with missing variable
   - Fix: Redeploy with "Use existing Build Cache" unchecked

4. **Git branch mismatch**
   - Deploying from wrong branch
   - Fix: Check Vercel dashboard → Settings → Git → Production Branch

---

### Issue: Variable works locally but not on Vercel

**Cause**: Local `.env.local` vs Vercel environment variables are separate.

**Solution**:
- **Local development**: Add to `.env.local`
- **Vercel production**: Add to Vercel dashboard → Environment Variables

They must be added separately!

---

## Debugging Steps

### 1. Check Vercel Function Logs

After the fix, the API route now logs helpful debug info:

```typescript
console.error('❌ MORPH_API_KEY not found in environment variables');
console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('MORPH')));
```

This will show you:
- If the variable is missing
- What MORPH-related variables ARE present (if any, with typos)

To view logs:
1. Vercel Dashboard → Deployments → Latest Deployment
2. Click **Functions** tab
3. Find `/api/morph-apply` function
4. Click to see logs

### 2. Test with cURL

```bash
curl -X POST https://your-app.vercel.app/api/morph-apply \
  -H "Content-Type: application/json" \
  -d '{
    "instruction": "test",
    "originalCode": "",
    "lazyEdit": "test",
    "fileType": "html"
  }'
```

Expected responses:
- **✅ Success**: Returns merged code
- **❌ Error**: Returns error message with hint

### 3. Create Diagnostic Endpoint (Optional)

If you want to test env vars directly, create:

**File**: `src/app/api/test-env/route.ts`
```typescript
export const runtime = 'nodejs';

export async function GET() {
  return Response.json({
    hasMorphKey: !!process.env.MORPH_API_KEY,
    morphKeyPrefix: process.env.MORPH_API_KEY?.substring(0, 10) || 'NOT SET',
    allEnvKeys: Object.keys(process.env).filter(k =>
      k.includes('MORPH') || k.includes('API') || k.includes('KEY')
    ),
  });
}
```

Then visit: `https://your-app.vercel.app/api/test-env`

This safely shows if the key is present without exposing the full value.

---

## Verification Checklist

After fix:
- [ ] Code change committed: `export const runtime = 'nodejs'`
- [ ] Code pushed to main branch
- [ ] Environment variable verified in Vercel dashboard
  - [ ] Name: `MORPH_API_KEY` (exact)
  - [ ] Value: Your Morph API key
  - [ ] Environment: Production ✓
- [ ] Redeployed application (without build cache)
- [ ] Tested Morph Fast Apply feature on production
- [ ] Checked Vercel function logs for errors
- [ ] No console errors in browser

---

## Prevention

To avoid this in the future:

1. **Document all env vars** in `.env.example`:
```bash
# .env.example
MORPH_API_KEY=sk-morph-your-key-here
AI_GATEWAY_API_KEY=your-gateway-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
```

2. **Always redeploy after adding env vars** to Vercel

3. **Use `export const runtime = 'nodejs'`** for API routes that need env vars

4. **Test in Preview environment first** before promoting to Production

5. **Check Vercel function logs** immediately after deployment

---

## Related Documentation

- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Next.js Runtime](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes)
- [Vercel Function Logs](https://vercel.com/docs/observability/runtime-logs)

---

## Summary

**The fix**:
1. ✅ Added `export const runtime = 'nodejs'` to API route
2. ✅ Improved error logging
3. → Push to GitHub
4. → Redeploy on Vercel (without build cache)
5. → Verify it works

**Why it works**:
- Explicitly using Node.js runtime ensures `process.env` works correctly
- Better error messages help diagnose issues
- Redeployment bakes the environment variable into the build

**Next steps**:
- Push the code changes
- Verify `MORPH_API_KEY` is in Vercel dashboard
- Redeploy
- Test on production
