'use client';

import { useState } from 'react';
import { CartesiaTTSService } from '@/lib/voice/cartesia-tts';

export default function TestCartesiaPage() {
  const [status, setStatus] = useState('');
  const [tts, setTts] = useState<CartesiaTTSService | null>(null);

  const initCartesia = async () => {
    try {
      setStatus('Initializing Cartesia...');
      const apiKey = process.env.NEXT_PUBLIC_CARTESIA_API_KEY || '';
      console.log('🔑 API Key:', apiKey ? 'Found' : 'Missing');

      const service = new CartesiaTTSService(apiKey);
      await service.connect();
      setTts(service);
      setStatus('✅ Connected to Cartesia!');
    } catch (error: any) {
      console.error('❌ Init error:', error);
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  const testSpeak = async () => {
    if (!tts) {
      setStatus('❌ Please initialize first');
      return;
    }

    try {
      setStatus('🗣️ Speaking...');
      await tts.speak('Hello! This is a test of Cartesia Sonic 3 text to speech.', {
        emotion: 'neutral',
      });
      setStatus('✅ Speech complete!');
    } catch (error: any) {
      console.error('❌ Speak error:', error);
      setStatus(`❌ Speak error: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <h1 className="text-3xl font-bold mb-8">Cartesia TTS Test</h1>

      <div className="mb-4 text-lg text-center">
        <p>Status: {status || 'Not initialized'}</p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={initCartesia}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          1. Initialize Cartesia
        </button>

        <button
          onClick={testSpeak}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
          disabled={!tts}
        >
          2. Test Speech
        </button>
      </div>

      <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg max-w-md">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <strong>Instructions:</strong><br />
          1. Click "Initialize Cartesia"<br />
          2. Wait for ✅ confirmation<br />
          3. Click "Test Speech"<br />
          4. You should hear audio!
        </p>
      </div>

      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-xs font-mono">
          Check browser console for detailed logs
        </p>
      </div>
    </div>
  );
}
