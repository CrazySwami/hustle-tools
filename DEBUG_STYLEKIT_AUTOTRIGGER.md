# Debugging StyleKit Auto-Trigger

## Overview
This document explains how to debug the inline "Regenerate" button auto-trigger functionality for StyleKit sections.

## Expected Flow

When clicking an inline regenerate button (e.g., "Regenerate" next to "Colors" section header):

1. `openDialogForStage(stage)` is called → sets `preSelectedStage` and opens dialog
2. Dialog opens with `preSelectedStage` prop set
3. useEffect fires in StyleKitGeneratorDialog → schedules handleGenerate after 100ms
4. handleGenerate is called → validates data and calls onGenerate
5. onGenerate (handleAIGenerate) → sets state, auto-closes dialog, calls API
6. API streams response → updates progress bar and populates fields

## Console Logs to Watch

Open browser console (F12) and click an inline "Regenerate" button. You should see these logs in sequence:

### 1. Auto-Trigger useEffect (StyleKitGeneratorDialog.tsx)
```
🔍 Auto-trigger useEffect fired: {
  preSelectedStage: 1,
  isGenerating: false,
  brandfetchData: true/false,
  stylePreferences: "",
  images: 0
}
```

**What to check:**
- `preSelectedStage` should be 1, 2, 3, or 4 (the stage being regenerated)
- `isGenerating` should be `false`
- If both are true, you should see:
  ```
  ✅ Auto-trigger conditions met, scheduling handleGenerate in 100ms
  ```

### 2. Auto-Trigger Execution
```
🚀 Auto-trigger firing handleGenerate with stage: 1
```

### 3. handleGenerate Validation (StyleKitGeneratorDialog.tsx)
```
📝 handleGenerate called with: {
  stage: 1,
  preSelectedStage: 1,
  stylePreferences: "",
  hasBrandfetchData: true,
  imageCount: 0
}

🔍 isAutoTrigger: true
✅ Validation passed, starting generation...
```

**What to check:**
- `isAutoTrigger` should be `true` (this bypasses validation)
- Should see "Validation passed" even if no data is provided

### 4. onGenerate Call
```
📤 Calling onGenerate with: {
  model: "gpt-5",
  hasBrandfetchData: true,
  hasStylePreferences: false,
  hasIndustry: false,
  imageCount: 0,
  stage: 1
}

✅ onGenerate completed successfully
```

### 5. handleAIGenerate (StyleKitEditorAdvanced.tsx)
```
🎯 handleAIGenerate called with config: {
  model: "gpt-5",
  hasBrandfetchData: true,
  hasStylePreferences: false,
  hasIndustry: false,
  imageCount: 0,
  stage: 1
}

📊 Generation state updated: {
  isGenerating: true,
  currentGeneratingStage: 1,
  generationProgress: "Generating Stage 1..."
}

🚪 Auto-closing dialog (stage generation)
```

**What to check:**
- `isGenerating` should become `true`
- `currentGeneratingStage` should match the stage being regenerated
- Should see "Auto-closing dialog" log

### 6. API Fetch
```
📡 Fetching /api/generate-stylekit with payload: {
  model: "gpt-5",
  hasBrandfetchData: true,
  hasStylePreferences: false,
  hasIndustry: false,
  imageCount: 0,
  stage: 1
}

📡 API response received: {
  ok: true,
  status: 200,
  statusText: "OK"
}
```

**What to check:**
- API response should have `ok: true` and `status: 200`
- If not, check for error logs

## Common Issues

### Issue 1: useEffect doesn't fire
**Symptoms:** No "🔍 Auto-trigger useEffect fired" log

**Possible causes:**
- `preSelectedStage` prop not being passed to dialog
- Dialog not mounting properly

**Fix:** Check that `openDialogForStage` is setting state correctly

### Issue 2: Auto-trigger conditions not met
**Symptoms:** See "❌ Auto-trigger conditions NOT met" log

**Possible causes:**
- `preSelectedStage` is undefined
- `isGenerating` is already true

**Fix:** Ensure dialog state is reset properly between opens

### Issue 3: Validation fails
**Symptoms:** See "❌ Validation failed: no data provided" log

**Possible causes:**
- `isAutoTrigger` is `false` when it should be `true`
- `stage` parameter doesn't match `preSelectedStage`

**Fix:** Check that `stage` parameter is being passed correctly through the call chain

### Issue 4: No API call
**Symptoms:** No "📡 Fetching /api/generate-stylekit" log

**Possible causes:**
- Error in handleGenerate before API call
- onGenerate throwing exception

**Fix:** Look for error logs before API fetch

### Issue 5: API returns error
**Symptoms:** See "❌ API error:" log

**Possible causes:**
- Server-side validation failing
- AI Gateway issues
- Invalid data format

**Fix:** Check API route logs (server console)

## Testing Checklist

1. ✅ Fetch Brandfetch data for a domain first
2. ✅ Click inline "Regenerate" button next to a section (Colors, Fonts, Headings, or Components)
3. ✅ Verify dialog opens briefly (should auto-close after ~100ms)
4. ✅ Verify progress bar appears at bottom of page
5. ✅ Verify console shows all expected logs in sequence
6. ✅ Verify fields populate with generated data
7. ✅ Verify generation completes successfully

## Expected Timeline

- **0ms:** Click regenerate button
- **0ms:** Dialog opens, useEffect fires
- **100ms:** handleGenerate called
- **100-200ms:** onGenerate called, dialog closes, progress bar appears
- **200ms:** API fetch starts
- **2-10s:** Streaming response updates progress
- **2-10s:** Generation completes, fields populate

## Debug Mode

To enable verbose logging for all generation steps, open browser console before clicking regenerate.

All debug logs use emoji prefixes for easy scanning:
- 🔍 = Investigation/checking
- ✅ = Success/condition met
- ❌ = Error/condition not met
- 📝 = Function call
- 📤 = Data being sent
- 📡 = API request/response
- 🎯 = Handler called
- 📊 = State update
- 🚪 = UI transition
- 🚀 = Action triggered

## Next Steps

If you still see "nothing happening" after verifying all logs:

1. Check if Brandfetch data was actually fetched (click "Fetch" button first)
2. Verify the API is returning data (check server logs)
3. Check if results are being applied to fields (look for state update logs)
4. Try manually opening the dialog and generating to isolate the issue
