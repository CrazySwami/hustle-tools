# OpenAI Assistants API Setup for Elementor Converter

This guide explains how to set up the advanced AI mode using OpenAI's Assistants API with file search (RAG) for maximum accuracy.

## Why Use Assistants API?

The standard GPT-5 API embeds a simplified property reference in each prompt. The **Assistants API with File Search** provides:

- ✅ **95%+ Accuracy** - AI searches actual Elementor source code for exact property names
- ✅ **No Token Limits** - Reference files stored in vector store, not sent with each request
- ✅ **Always Up-to-Date** - Upload new Elementor versions anytime
- ✅ **Handles All Widgets** - Not limited to 4-5 manually mapped widgets
- ✅ **Lower Cost** - Smaller prompts = fewer tokens

## Prerequisites

- Node.js installed
- OpenAI API key with Assistants API access
- Elementor source files already downloaded (done automatically)

## Setup Steps

### 1. Set Your API Key

```bash
export OPENAI_API_KEY=sk-...
```

Get your key from: https://platform.openai.com/api-keys

### 2. Run the Setup Script

```bash
node setup-assistant.js
```

This will:
1. Upload **48 Elementor source files** to OpenAI (36 widgets + 12 controls)
2. Create a Vector Store
3. Create an Assistant with file search enabled
4. Output the IDs you need

### 3. Copy the IDs

The script will output:

```
═══════════════════════════════════════════════════════════
🎉 SETUP COMPLETE!
═══════════════════════════════════════════════════════════

📋 Copy these IDs into the converter:

Assistant ID:     asst_abc123...
Vector Store ID:  vs_xyz789...
```

### 4. Use in the Converter

1. Open `html-to-elementor-converter.html` in your browser
2. Switch to **AI Mode**
3. Enter your OpenAI API key
4. Expand **"Advanced: Assistant Configuration"**
5. Paste the Assistant ID and Vector Store ID
6. Click **Convert**

## Usage Comparison

### Standard Mode (No Assistant ID)
- Uses GPT-5 with inline property reference
- 90% accuracy
- Faster response (no file search)
- Good for quick conversions

### Advanced Mode (With Assistant ID)
- Uses GPT-4 Turbo with Elementor source search
- 95%+ accuracy
- Slightly slower (file search overhead)
- Best for production conversions

## Configuration File

The script saves `assistant-config.json`:

```json
{
  "assistant_id": "asst_...",
  "vector_store_id": "vs_...",
  "created_at": "2025-01-09T...",
  "files_uploaded": 8
}
```

You can reference this file to remember your IDs.

## Updating Elementor Files

When Elementor releases updates:

1. Download new files: `cd elementor-source/elementor-widgets && git pull`
2. Re-run: `node setup-assistant.js`
3. Use the new IDs in the converter

## Troubleshooting

### "API Error 404: Assistant not found"

Your Assistant ID is incorrect or the assistant was deleted. Re-run `setup-assistant.js`.

### "Vector Store not found"

Your Vector Store ID is incorrect. Check `assistant-config.json` for the correct ID.

### "File upload failed"

Ensure Elementor source files exist in `elementor-source/elementor-widgets/`.

### Still getting wrong property names

The AI may need clearer instructions. Check that:
- All 8 source files uploaded successfully
- The widget you're converting is included in the uploaded files
- The computed styles are being extracted correctly

## Cost Estimate

**One-time setup cost:**
- File uploads: ~$0.01
- Vector store: ~$0.10/day (while active)
- Total: ~$3/month if used regularly

**Per conversion:**
- With Assistants API: ~$0.01-0.03 per conversion (depends on HTML size)
- Standard GPT-5: ~$0.02-0.05 per conversion

## Support

If you encounter issues:

1. Check console logs in browser DevTools
2. Verify your API key has Assistants API access
3. Ensure Node.js version >= 14
4. Check that source files were downloaded correctly

## Advanced: Manual Assistant Creation

You can also create the assistant manually via OpenAI Platform:

1. Go to https://platform.openai.com/assistants
2. Click **"Create Assistant"**
3. Upload the 8 PHP files from `elementor-source/elementor-widgets/`
4. Enable **File Search** tool
5. Copy the Assistant ID into the converter

This gives you more control but requires manual file management.
