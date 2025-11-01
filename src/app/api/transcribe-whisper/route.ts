import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    console.log('🎤 Transcribing audio with OpenAI Whisper...');
    console.log('📊 Audio file size:', audioFile.size, 'bytes');

    // Send to OpenAI Whisper API
    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile);
    whisperFormData.append('model', 'whisper-1');
    whisperFormData.append('language', 'en'); // Optional: remove for auto-detect
    whisperFormData.append('response_format', 'json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: whisperFormData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Whisper API error:', error);
      throw new Error(error.error?.message || 'Whisper API error');
    }

    const result = await response.json();
    console.log('✅ Transcription complete:', result.text);

    return NextResponse.json({
      text: result.text,
      duration: result.duration,
    });
  } catch (error: any) {
    console.error('❌ Transcription error:', error);
    return NextResponse.json({
      error: error.message || 'Transcription failed'
    }, { status: 500 });
  }
}
