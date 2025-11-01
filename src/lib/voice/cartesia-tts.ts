import { CartesiaClient } from '@cartesia/cartesia-js';

export class CartesiaTTSService {
  private client: CartesiaClient;
  private ws: any = null;
  private audioContext: AudioContext | null = null;
  private nextStartTime: number = 0;
  private contextId: string;
  private isConnected: boolean = false;

  constructor(apiKey: string) {
    this.client = new CartesiaClient({ apiKey });
    this.contextId = crypto.randomUUID();
  }

  async connect() {
    if (this.isConnected) {
      console.log('🎙️ Already connected to Cartesia');
      return;
    }

    try {
      console.log('🔌 Connecting to Cartesia WebSocket...');

      // WebSocket only supports 'raw' container
      this.ws = this.client.tts.websocket({
        container: 'raw',
        encoding: 'pcm_s16le', // 16-bit PCM
        sampleRate: 22050,
      });

      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.nextStartTime = this.audioContext.currentTime;

      this.isConnected = true;
      console.log('✅ Cartesia WebSocket connected (raw PCM format)');
    } catch (error) {
      console.error('❌ Failed to connect Cartesia:', error);
      throw error;
    }
  }

  async speak(text: string, options?: {
    voiceId?: string;
    speed?: number;
    emotion?: string;
  }) {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      console.log('🗣️ Speaking with Sonic-3:', text.substring(0, 50) + '...');

      const response = await this.ws.send({
        modelId: 'sonic-3', // Using latest Sonic-3 model (90ms latency!)
        transcript: text,
        voice: {
          mode: 'id',
          id: options?.voiceId || 'a0e99841-438c-4a64-b679-ae501e7d6091', // Default voice
          __experimental_controls: {
            speed: options?.speed ? String(options.speed) : 'normal', // 'slowest', 'slow', 'normal', 'fast', 'fastest'
            emotion: options?.emotion ? [options.emotion] : ['neutral'],
          },
        },
        contextId: this.contextId,
      });

      // Play audio chunks as they arrive
      let chunkCount = 0;
      for await (const rawMessage of response.events('message')) {
        // Parse the message if it's a string
        let messageData: any;

        if (typeof rawMessage === 'string') {
          try {
            messageData = JSON.parse(rawMessage);
            console.log('📦 Parsed message type:', messageData.type);
            if (messageData.type === 'error') {
              console.error('❌ Cartesia error:', messageData);
            }
          } catch (e) {
            console.error('❌ Failed to parse message:', e);
            continue;
          }
        } else {
          messageData = rawMessage;
          console.log('📦 Received message (object):', messageData.type);
        }

        // Check for error messages
        if (messageData.type === 'error') {
          console.error('❌ Cartesia API error:', {
            error: messageData.error,
            message: messageData.message,
            statusCode: messageData.status_code,
            full: messageData
          });
          throw new Error(messageData.message || 'Cartesia API error');
        }

        if (messageData.type === 'chunk' && messageData.data) {
          chunkCount++;
          console.log(`🎵 Processing audio chunk ${chunkCount}, data length:`, messageData.data.length);

          try {
            // Decode base64 audio data
            const audioData = Uint8Array.from(atob(messageData.data), c => c.charCodeAt(0));
            console.log('🎵 Decoded audio data, buffer size:', audioData.byteLength);
            await this.playAudioChunk(audioData.buffer);
          } catch (decodeError) {
            console.error('❌ Error decoding audio chunk:', decodeError);
          }
        }

        if (messageData.done) {
          console.log(`✅ Speech complete (${chunkCount} chunks processed)`);
          break;
        }
      }

      if (chunkCount === 0) {
        console.warn('⚠️ No audio chunks received from Cartesia!');
      }
    } catch (error) {
      console.error('❌ Speech error:', error);
      throw error;
    }
  }

  private async playAudioChunk(data: ArrayBuffer) {
    if (!this.audioContext) {
      console.error('❌ No audio context available');
      return;
    }

    try {
      console.log('🎧 Processing raw PCM audio, buffer size:', data.byteLength);

      // Convert raw PCM s16le to AudioBuffer
      const sampleRate = 22050;
      const numSamples = data.byteLength / 2; // 16-bit = 2 bytes per sample
      const audioBuffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
      const channelData = audioBuffer.getChannelData(0);

      // Convert Int16 PCM to Float32 for Web Audio API
      const view = new DataView(data);
      for (let i = 0; i < numSamples; i++) {
        const int16 = view.getInt16(i * 2, true); // true = little-endian
        channelData[i] = int16 / 32768; // Normalize to -1.0 to 1.0
      }

      console.log('✅ PCM audio converted:', {
        duration: audioBuffer.duration,
        channels: audioBuffer.numberOfChannels,
        sampleRate: audioBuffer.sampleRate,
        samples: audioBuffer.length
      });

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      // Resume audio context if suspended (browser autoplay policy)
      if (this.audioContext.state === 'suspended') {
        console.log('🔊 Resuming audio context...');
        await this.audioContext.resume();
      }

      const startTime = Math.max(this.nextStartTime, this.audioContext.currentTime);
      source.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;

      console.log('🔊 Audio chunk scheduled to play at', startTime);
    } catch (error) {
      console.error('❌ Error playing audio chunk:', error);
      console.error('❌ Error details:', {
        name: (error as any).name,
        message: (error as any).message,
        bufferSize: data.byteLength
      });
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.isConnected = false;
      console.log('🔌 Cartesia disconnected');
    }
  }

  // Reset context for new conversation
  resetContext() {
    this.contextId = crypto.randomUUID();
    console.log('🔄 Context reset for new conversation');
  }
}
