# ✅ Image Upload & Screenshot Feature

## Overview

Added **image upload** and **playground screenshot** capabilities with AI vision support. The AI can now analyze images you send along with your messages!

## Features Added

### 1. **🖼️ Image Upload Button**
- New purple image button next to the voice button
- Click to open menu with 2 options:
  - 📁 **Upload Image** - Select from your computer
  - 📸 **Screenshot Playground** - Capture current WordPress Playground view

### 2. **File Validation**
- **Allowed formats**: JPEG, JPG, PNG, WebP
- **Max file size**: 5MB
- Automatic validation with user-friendly error messages

### 3. **Image Preview**
- Preview appears above chat input after selecting
- Shows thumbnail (max 200x200px)
- Displays filename
- **Remove button** (red X) to clear the image

### 4. **AI Vision Integration**
- Images are sent to OpenAI GPT-4o with vision capabilities
- AI can analyze, describe, and extract information from images
- Perfect for showing design mockups, UI references, or errors

### 5. **Chat Display**
- Images appear inline in user messages
- Max 300x300px in chat
- Rounded corners and subtle border

## How to Use

### Upload an Image
1. Click the **🖼️** button (purple, next to 🎤)
2. Select **"📁 Upload Image"**
3. Choose a file (JPEG, JPG, PNG, or WebP, max 5MB)
4. Preview appears above input
5. Type your message
6. Press **Send** - image is included with your message
7. AI can now see and analyze the image!

### Screenshot Playground
1. Make sure WordPress Playground is running
2. Click the **🖼️** button
3. Select **"📸 Screenshot Playground"**
4. Screenshot is captured and added as preview
5. Ask AI questions about what it sees!

## Example Conversations

### With Image Upload:
```
You: [uploads mockup image]
     "Can you create a JSON structure similar to this design?"

AI: I can see a modern landing page with a hero section, feature cards,
    and a CTA button. I'll generate JSON to match this layout...
```

### With Screenshot:
```
You: [screenshots playground]
     "The heading looks too small, what size is it?"

AI: Looking at the screenshot, I can see the heading "Welcome to My Site".
    According to the JSON, it's set to 32px. Would you like me to increase it?
```

### Design Analysis:
```
You: [uploads reference image]
     "Match the color scheme from this image"

AI: I can see a blue and orange color palette. The primary blue appears
    to be around #2563eb and the accent orange is #f97316. I'll update
    your JSON to use these colors...
```

## Technical Details

### Files Modified

1. **`chat-editor.html`**
   - Added image upload button + hidden file input
   - Added image preview area with remove button
   - Added context menu for image options
   - New methods: `handleImageUpload()`, `screenshotPlayground()`, `displayImage()`, `removeImage()`
   - Updated `handleSendMessage()` to include images

2. **`modules/chat-ui.js`**
   - Updated `renderMessage()` to display images in chat
   - Images shown as `<img>` tags with proper styling

3. **`modules/openai-client.js`**
   - Updated `sendMessage()` to accept `imageBase64` parameter
   - Builds multimodal message format for GPT-4 Vision
   - Uses `image_url` content type with `detail: 'high'`

4. **`styles/chat-editor-styles.css`**
   - New styles for `.image-button`
   - Image preview area styling
   - Context menu styles
   - Message image display styles

### Image Format

Images are sent to OpenAI as base64-encoded data URLs:
```javascript
{
    type: 'image_url',
    image_url: {
        url: 'data:image/png;base64,iVBORw0KG...',
        detail: 'high'
    }
}
```

### Screenshot Implementation

Currently uses Canvas API to create a placeholder screenshot (white background with text). This can be enhanced with:
- `html2canvas` library for real iframe capture
- WordPress Playground API screenshot methods
- Server-side screenshot tools

## Limitations

### Current Screenshot Method
- Shows placeholder text instead of actual iframe content
- Due to CORS restrictions on cross-origin iframes
- Can be improved with proper screenshot libraries

### Image Restrictions
- Max 5MB per image
- Only visual formats (no PDFs, videos, etc.)
- One image per message (removed after sending)

## Future Enhancements

### Possible Improvements:
1. **Multiple images** per message
2. **Real iframe screenshots** using html2canvas or Playground API
3. **Image history** - keep uploaded images in conversation
4. **Image editing** - crop, resize before sending
5. **Drag & drop** upload support
6. **Paste from clipboard**
7. **OCR text extraction** from images

## Security & Privacy

- ✅ Images processed client-side
- ✅ Base64 encoding in browser
- ✅ File type validation
- ✅ Size validation (5MB limit)
- ✅ Images only sent to OpenAI API
- ✅ No server-side storage
- ⚠️ OpenAI processes images according to their privacy policy

## Cost Considerations

**OpenAI Vision API Pricing** (as of 2024):
- **High detail** (our setting): ~$0.01-0.02 per image
- Depends on image resolution
- Counted as additional tokens

**Recommendation**: Use images when necessary for design feedback, not for every message.

## Testing Checklist

- [x] Image button appears and opens menu
- [x] Upload image validates file type
- [x] Upload image validates file size (5MB)
- [x] Preview shows after upload
- [x] Remove button clears preview
- [x] Image included in chat message
- [x] Image sent to OpenAI API
- [x] Screenshot button available
- [x] Screenshot creates placeholder image
- [x] AI can respond to image content
- [x] Context menu closes when clicking outside

---

**Status**: ✅ Complete and ready to use
**Date**: January 14, 2025
