# Image Generation & Editing Setup Guide

This guide explains how to set up and use the new **Images** tab in the Elementor Editor, which provides AI-powered image generation, editing, background removal, and reverse image search.

## Features

### 1. **Image Generation**
Generate high-quality images from text descriptions using:
- **GPT Image 1** (OpenAI) - Newest model, ~$0.02-0.19/img
- **DALL-E 3** (OpenAI) - Classic model, ~$0.04-0.08/img
- **Gemini Imagen 3** (Google via AI Gateway) - Fast & Standard variants

### 2. **Image Editing**
Edit existing images with AI using Google Gemini Flash (Imagen 3) via AI Gateway:
- Add or remove objects
- Change styles and colors
- Apply transformations
- Image-to-image modifications with text prompts

### 3. **Background Removal**
Remove backgrounds from images to create transparent PNGs using:
- remove.bg API (50 free/month)
- imgly API (free tier available)

### 4. **Reverse Image Search**
Find similar images or identify objects using:
- Google Cloud Vision API
- SerpAPI
- TinEye
- Google Lens (manual fallback)

---

## Required API Keys

Add these to your `.env.local` file:

```bash
# Image Generation
OPENAI_API_KEY=your_openai_api_key_here           # For DALL-E 3 & GPT Image 1
AI_GATEWAY_API_KEY=your_ai_gateway_api_key_here   # For Gemini Imagen 3 (via Vercel AI Gateway)

# Background Removal (optional, choose one)
REMOVE_BG_API_KEY=your_removebg_api_key_here      # remove.bg API
IMGLY_API_KEY=your_imgly_api_key_here             # imgly API (free tier available)

# Reverse Image Search (optional, choose one)
GOOGLE_CLOUD_VISION_API_KEY=your_vision_key_here  # Google Cloud Vision
SERPAPI_API_KEY=your_serpapi_key_here             # SerpAPI
TINEYE_API_KEY=your_tineye_api_key_here           # TinEye
TINEYE_PUBLIC_KEY=your_tineye_public_key_here     # TinEye public key
```

---

## Getting API Keys

### OpenAI (GPT Image 1 & DALL-E 3)
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add to `.env.local` as `OPENAI_API_KEY`

**Pricing (GPT Image 1)**:
- Low quality: ~$0.02 per image
- Medium quality: ~$0.07 per image
- High quality: ~$0.19 per image
- Uses token-based pricing: $5/1M text tokens, $10/1M image input tokens, $40/1M image output tokens

**Pricing (DALL-E 3)**:
- Standard quality: ~$0.04 per image
- HD quality: ~$0.08 per image

---

### Vercel AI Gateway (Gemini Imagen 3)
1. Go to your Vercel AI Gateway dashboard
2. Get your AI Gateway API key
3. Add to `.env.local` as `AI_GATEWAY_API_KEY`
4. Gemini Imagen 3 is accessed via the AI Gateway

**Pricing**: Depends on your AI Gateway provider settings. Google Imagen 3 has competitive pricing with OpenAI.

---

### remove.bg (Background Removal)
1. Go to [https://www.remove.bg/api](https://www.remove.bg/api)
2. Sign up for a free account (50 free credits/month)
3. Get your API key from the dashboard
4. Add to `.env.local` as `REMOVE_BG_API_KEY`

**Pricing**:
- Free: 50 credits/month
- Paid: Starting at $9/month for 200 credits

---

### imgly (Background Removal - Free Alternative)
1. Go to [https://img.ly/](https://img.ly/)
2. Sign up for a free account
3. Get your API key
4. Add to `.env.local` as `IMGLY_API_KEY`

**Pricing**: Free tier available

---

### Google Cloud Vision (Reverse Image Search)
1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Enable the Vision API
3. Create credentials (API key)
4. Add to `.env.local` as `GOOGLE_CLOUD_VISION_API_KEY`

**Pricing**:
- Free: 1,000 calls/month
- Paid: $1.50 per 1,000 calls

---

### SerpAPI (Reverse Image Search)
1. Go to [https://serpapi.com/](https://serpapi.com/)
2. Sign up for a free account (100 free searches/month)
3. Get your API key
4. Add to `.env.local` as `SERPAPI_API_KEY`

**Pricing**:
- Free: 100 searches/month
- Paid: Starting at $50/month

---

### TinEye (Reverse Image Search)
1. Go to [https://services.tineye.com/](https://services.tineye.com/)
2. Sign up for an account
3. Get your API key and public key
4. Add to `.env.local` as `TINEYE_API_KEY` and `TINEYE_PUBLIC_KEY`

**Pricing**: Pay-as-you-go ($200 minimum)

---

## Usage

### From the UI (Images Tab)

1. Navigate to `/elementor-editor`
2. Click the **Images** tab in the right panel
3. Choose one of the 4 sub-tabs:
   - **Generate**: Create new images from text
   - **Edit**: Modify existing images with AI
   - **BG Remove**: Remove backgrounds
   - **Search**: Reverse image search

#### Generate Tab
1. Select provider (OpenAI or Gemini)
2. Select model:
   - **OpenAI**: GPT Image 1 (newest) or DALL-E 3 (classic)
   - **Gemini**: Imagen 3 Fast or Standard
3. Enter your prompt
4. Adjust settings:
   - **Size**: 1024x1024, 1536x1536 (gpt-image-1 only), 1792x1024, 1024x1792
   - **Quality**: Low/Medium/High (gpt-image-1) or Standard/HD (dall-e-3)
   - **Style**: Vivid/Natural (DALL-E 3 only)
   - **Aspect Ratio**: For Gemini models
5. Click "Generate Image"
6. Download or copy the result

#### Edit Tab
1. Upload a reference image (or use selected)
2. Enter edit instructions
3. Click "Edit Image"
4. Download the edited result

#### BG Remove Tab
1. Select an image (or upload one)
2. Click "Remove Background"
3. Download transparent PNG

#### Search Tab
1. Select an image (or upload one)
2. Click "Reverse Image Search"
3. View results (labels, similar images, pages)

---

### From the Chat

You can also use image tools via chat commands:

#### Generate Image
```
Generate an image of a sunset over the ocean with palm trees, vivid style, HD quality
```

The AI will call the `generateImage` tool and display a widget with the result.

#### Edit Image
```
Edit this image to add a rainbow in the sky
[Provide image URL or upload]
```

#### Remove Background
```
Remove the background from this product photo
[Provide image URL or upload]
```

#### Reverse Image Search
```
Find similar images or identify objects in this image
[Provide image URL or upload]
```

---

## API Endpoints

All image operations are handled by dedicated API routes:

- `/api/generate-image-openai` - DALL-E 3 generation
- `/api/generate-image-gemini` - Imagen 3 generation
- `/api/edit-image-gemini` - Imagen 3 editing
- `/api/remove-background` - Background removal
- `/api/reverse-image-search` - Reverse image search

---

## Tool Definitions

Image tools are registered in `/src/lib/tools.ts`:

```typescript
export const tools = {
  // ... other tools
  generateImage: generateImageTool,          // ⭐ AI image generation
  editImage: editImageTool,                  // ⭐ AI image editing
  removeBackground: removeBackgroundTool,    // ⭐ Background removal
  reverseImageSearch: reverseImageSearchTool, // ⭐ Reverse image search
};
```

---

## Widget Components

Custom UI widgets render tool results in the chat:

- `GenerateImageWidget` - Image generation results
- `EditImageWidget` - Image editing results
- `RemoveBackgroundWidget` - Background removal results
- `ReverseImageSearchWidget` - Reverse search results

All widgets support:
- Download generated images
- Copy image URLs
- Open in new tab
- Regenerate/retry

---

## Architecture

### Streaming Pattern

Unlike the HTML generator which streams code directly to Monaco editor, image tools use a **metadata-first** approach:

1. **Tool returns immediately** with metadata (not the image)
2. **Widget component** handles API calls and streaming
3. **Global state** updates when image is ready
4. **No waiting** for AI to finish in the chat

This prevents the 2-3 minute wait issue mentioned in your reference.

### Example Flow

```
User: "Generate a logo for my coffee shop"
  ↓
AI calls generateImage tool
  ↓
Tool returns { prompt, provider, status: 'ready' } IMMEDIATELY
  ↓
Widget renders "Generate Image" button
  ↓
User clicks button
  ↓
Widget calls /api/generate-image-openai
  ↓
Image streams from OpenAI
  ↓
Widget displays image as it arrives
  ↓
User downloads or copies URL
```

---

## Troubleshooting

### "No API key configured"
- Make sure you've added the required API keys to `.env.local`
- Restart the dev server after adding keys

### "Failed to generate image"
- Check your API key is valid
- Verify you have sufficient credits/quota
- Check console for detailed error messages

### "Image not loading"
- Some APIs return base64 data URLs (large)
- Others return external URLs (may have CORS issues)
- Try downloading the image instead of viewing inline

### "Background removal not working"
- Ensure you have at least one BG removal API key configured
- remove.bg requires a valid subscription
- imgly has a free tier but may have rate limits

### "Reverse search returns no results"
- Configure at least one reverse search API key
- Without API keys, you'll get a Google Lens URL for manual search
- Image must be publicly accessible (not base64) for some APIs

---

## Cost Optimization

### Free Tier Options
- **Gemini Imagen 3**: Generous free tier via Google AI Studio
- **imgly**: Free background removal
- **Google Cloud Vision**: 1,000 free calls/month
- **SerpAPI**: 100 free searches/month

### Paid Options (Best Quality)
- **DALL-E 3**: ~$0.04-0.08 per image (high quality, creative)
- **remove.bg**: $9/month for 200 credits (best BG removal)
- **Google Cloud Vision**: $1.50 per 1,000 calls (comprehensive results)

### Recommendations
For **testing**: Use free tiers (Gemini, imgly, Google Vision free tier)
For **production**: Use paid tiers for better quality and reliability

---

## Next Steps

1. **Add API keys** to `.env.local`
2. **Restart dev server**: `npm run dev`
3. **Test image generation** in the Images tab
4. **Try chat commands** to generate images via conversation
5. **Integrate images** into your sections and designs

---

## Support

For issues or questions:
- Check the console for detailed error messages
- Verify API keys are correct
- Ensure you have sufficient credits/quota
- Review API provider documentation for specific errors

Happy image generating! 🎨✨
