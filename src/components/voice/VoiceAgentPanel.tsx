'use client';

import { useState, useEffect, useRef } from 'react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { CartesiaTTSService } from '@/lib/voice/cartesia-tts';
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from 'lucide-react';

interface VoiceAgentPanelProps {
  onTranscript: (text: string) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

export function VoiceAgentPanel({ onTranscript, onSpeakingChange }: VoiceAgentPanelProps) {
  const { isRecording, startRecording, stopRecording } = useVoiceRecorder();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState<string | null>(null);
  const ttsServiceRef = useRef<CartesiaTTSService | null>(null);

  // Initialize TTS service
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_CARTESIA_API_KEY || '';
    if (!apiKey) {
      console.error('❌ NEXT_PUBLIC_CARTESIA_API_KEY not found');
      setError('Cartesia API key not configured');
      return;
    }

    ttsServiceRef.current = new CartesiaTTSService(apiKey);

    return () => {
      ttsServiceRef.current?.disconnect();
    };
  }, []);

  // Notify parent of speaking state changes
  useEffect(() => {
    onSpeakingChange?.(isSpeaking);
  }, [isSpeaking, onSpeakingChange]);

  const handleMicClick = async () => {
    if (isRecording) {
      // Stop recording and transcribe
      try {
        setIsTranscribing(true);
        setError(null);

        const audioBlob = await stopRecording();
        console.log('🎤 Audio recorded, sending to Whisper...');

        // Send to Whisper API
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        const response = await fetch('/api/transcribe-whisper', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Transcription failed');
        }

        const { text } = await response.json();
        console.log('✅ Transcribed:', text);

        setTranscript(text);
        onTranscript(text);
      } catch (error: any) {
        console.error('❌ Transcription error:', error);
        setError(error.message || 'Failed to transcribe audio');
      } finally {
        setIsTranscribing(false);
      }
    } else {
      // Start recording
      try {
        setError(null);
        await startRecording();
        setTranscript('');
        setSummary('');
      } catch (error: any) {
        console.error('❌ Recording error:', error);
        setError('Microphone access denied. Please allow microphone access.');
      }
    }
  };

  // Public method to speak summary (called from parent)
  const speakSummary = async (summaryText: string, options?: {
    voiceId?: string;
    emotion?: string;
    speed?: number;
  }) => {
    if (!ttsServiceRef.current) {
      console.error('❌ TTS service not initialized');
      return;
    }

    setIsSpeaking(true);
    setSummary(summaryText);

    try {
      await ttsServiceRef.current.speak(summaryText, {
        voiceId: options?.voiceId,
        emotion: options?.emotion || 'neutral',
        speed: options?.speed,
      });
    } catch (error) {
      console.error('❌ TTS error:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  // Expose speakSummary method to parent via ref
  useEffect(() => {
    (window as any).__voiceAgentSpeakSummary = speakSummary;
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Avatar / Visualization */}
      <div className="mb-8">
        <div
          className={`w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl transition-all ${
            isSpeaking ? 'animate-pulse scale-110' : 'scale-100'
          } ${isRecording ? 'ring-4 ring-red-400 animate-pulse' : ''}`}
        >
          {isSpeaking ? (
            <Volume2 className="w-16 h-16 text-white" />
          ) : isTranscribing ? (
            <Loader2 className="w-16 h-16 text-white animate-spin" />
          ) : (
            <VolumeX className="w-16 h-16 text-white opacity-50" />
          )}
        </div>
      </div>

      {/* Status Text */}
      <div className="mb-4">
        {isRecording && (
          <p className="text-sm font-medium text-red-600 dark:text-red-400 animate-pulse">
            Recording...
          </p>
        )}
        {isTranscribing && (
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Transcribing...
          </p>
        )}
        {isSpeaking && (
          <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
            Speaking...
          </p>
        )}
      </div>

      {/* Transcript Display */}
      {transcript && !isRecording && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg max-w-md text-center shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
            You said:
          </p>
          <p className="text-lg font-medium">{transcript}</p>
        </div>
      )}

      {/* Mic Button */}
      <button
        onClick={handleMicClick}
        disabled={isTranscribing}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600 animate-pulse scale-110'
            : 'bg-blue-500 hover:bg-blue-600 hover:scale-105'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isTranscribing ? (
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-10 h-10 text-white" />
        ) : (
          <Mic className="w-10 h-10 text-white" />
        )}
      </button>

      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        {isRecording ? 'Click to stop recording' : 'Click to speak'}
      </p>

      {/* Speaking Status */}
      {isSpeaking && summary && (
        <div className="mt-6 p-4 bg-purple-100 dark:bg-purple-900 rounded-lg max-w-md text-center shadow-lg">
          <p className="text-sm font-medium text-purple-900 dark:text-purple-100">{summary}</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-6 p-4 bg-red-100 dark:bg-red-900 rounded-lg max-w-md text-center">
          <p className="text-sm font-medium text-red-900 dark:text-red-100">{error}</p>
        </div>
      )}
    </div>
  );
}
