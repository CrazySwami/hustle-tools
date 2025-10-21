/**
 * OpenAIAudio - Whisper API integration for voice input
 */
export class OpenAIAudio {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.openai.com/v1';
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.stream = null;
    }

    /**
     * Start audio recording from microphone
     */
    async startRecording() {
        try {
            // Request microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            // Create MediaRecorder
            const options = { mimeType: 'audio/webm' };

            // Try different formats if webm not supported
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'audio/mp4';
            }
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'audio/ogg';
            }
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                delete options.mimeType; // Use browser default
            }

            this.mediaRecorder = new MediaRecorder(this.stream, options);
            this.audioChunks = [];

            // Collect audio data
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            // Start recording
            this.mediaRecorder.start();
            this.isRecording = true;

            console.log('🎤 Recording started');
        } catch (error) {
            console.error('Failed to start recording:', error);
            throw new Error('Microphone access denied or not available');
        }
    }

    /**
     * Stop audio recording and return audio blob
     */
    async stopRecording() {
        if (!this.mediaRecorder || !this.isRecording) {
            throw new Error('No active recording');
        }

        return new Promise((resolve, reject) => {
            this.mediaRecorder.onstop = () => {
                try {
                    // Create blob from chunks
                    const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
                    const audioBlob = new Blob(this.audioChunks, { type: mimeType });

                    // Stop all tracks
                    if (this.stream) {
                        this.stream.getTracks().forEach(track => track.stop());
                        this.stream = null;
                    }

                    this.isRecording = false;
                    this.audioChunks = [];

                    console.log('🎤 Recording stopped, blob size:', audioBlob.size);
                    resolve(audioBlob);
                } catch (error) {
                    reject(error);
                }
            };

            this.mediaRecorder.onerror = (error) => {
                reject(error);
            };

            this.mediaRecorder.stop();
        });
    }

    /**
     * Transcribe audio blob using OpenAI Whisper API
     */
    async transcribeAudio(audioBlob) {
        try {
            // Create form data
            const formData = new FormData();

            // Convert blob to file with proper extension
            const extension = this.getExtensionFromMimeType(audioBlob.type);
            const audioFile = new File([audioBlob], `audio.${extension}`, {
                type: audioBlob.type
            });

            formData.append('file', audioFile);
            formData.append('model', 'whisper-1');
            formData.append('language', 'en'); // Can be removed for auto-detection
            formData.append('response_format', 'json'); // or 'text', 'srt', 'verbose_json', 'vtt'

            console.log('🔄 Sending audio to Whisper API...');

            // Call Whisper API
            const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `Whisper API error: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Transcription complete:', result.text);

            return result.text;
        } catch (error) {
            console.error('Transcription error:', error);
            throw error;
        }
    }

    /**
     * Get file extension from MIME type
     */
    getExtensionFromMimeType(mimeType) {
        const map = {
            'audio/webm': 'webm',
            'audio/mp4': 'm4a',
            'audio/mpeg': 'mp3',
            'audio/ogg': 'ogg',
            'audio/wav': 'wav',
            'audio/x-m4a': 'm4a'
        };

        return map[mimeType] || 'webm';
    }

    /**
     * Combined convenience method: record and transcribe
     */
    async recordAndTranscribe() {
        await this.startRecording();
        // Note: User must call stopRecording separately to control recording duration
    }

    /**
     * Cancel recording without transcribing
     */
    cancelRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();

            // Stop all tracks
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }

            this.isRecording = false;
            this.audioChunks = [];

            console.log('🛑 Recording cancelled');
        }
    }

    /**
     * Check if browser supports audio recording
     */
    static isSupported() {
        return !!(navigator.mediaDevices &&
                  navigator.mediaDevices.getUserMedia &&
                  window.MediaRecorder);
    }

    /**
     * Check microphone permission status
     */
    static async checkPermission() {
        if (!navigator.permissions) {
            return 'unknown';
        }

        try {
            const result = await navigator.permissions.query({ name: 'microphone' });
            return result.state; // 'granted', 'denied', or 'prompt'
        } catch (error) {
            return 'unknown';
        }
    }

    /**
     * Get recording duration (if recording is active)
     */
    getRecordingDuration() {
        if (this.mediaRecorder && this.isRecording) {
            // This is approximate - for exact duration, track start time
            return Math.floor((Date.now() - this.recordingStartTime) / 1000);
        }
        return 0;
    }

    /**
     * Test microphone access without starting full recording
     */
    static async testMicrophone() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            return false;
        }
    }
}
