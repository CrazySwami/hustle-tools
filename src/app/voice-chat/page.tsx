'use client';

import { useState, useRef, useEffect } from 'react';
import { VoiceAgentPanel } from '@/components/voice/VoiceAgentPanel';

export default function VoiceChatPage() {
  // Session state
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [userName, setUserName] = useState('');
  const [userNameInput, setUserNameInput] = useState('');

  // Turn-based conversation state
  const [isAiTurn, setIsAiTurn] = useState(true); // AI goes first with greeting
  const [isMuted, setIsMuted] = useState(false);

  // Voice selection state
  const availableVoices = [
    { id: 'a0e99841-438c-4a64-b679-ae501e7d6091', name: 'Kyle', description: 'Warm, conversational male', gender: 'male' },
    { id: '79a125e8-cd45-4c13-8a67-188112f4dd22', name: 'Leo', description: 'Deep, authoritative male', gender: 'male' },
    { id: '2ee87190-8f84-4925-97da-e52547f9462c', name: 'Gavin', description: 'Friendly, enthusiastic male', gender: 'male' },
    { id: '726d5ae5-055f-4c3d-8355-d9677de68937', name: 'Maya', description: 'Professional, clear female', gender: 'female' },
    { id: '79f8b5fb-2cc8-479a-80df-29f7a7cf1a3e', name: 'Tessa', description: 'Warm, empathetic female', gender: 'female' },
  ];

  const [selectedVoice, setSelectedVoice] = useState(availableVoices[0]);
  const [isPreviewingVoice, setIsPreviewingVoice] = useState<string | null>(null);

  // Conversation state
  const [conversationMessages, setConversationMessages] = useState<Array<{
    id: string;
    type: 'user' | 'assistant';
    text: string;
    timestamp: number;
  }>>([]);

  // Background work state
  const [backgroundMessages, setBackgroundMessages] = useState<any[]>([]);
  const [showBackgroundPanel, setShowBackgroundPanel] = useState(false);
  const [isBackgroundWorking, setIsBackgroundWorking] = useState(false);

  // Model selection
  const [conversationModel, setConversationModel] = useState('anthropic/claude-haiku-4-5-20251001');
  const [summarizerModel, setSummarizerModel] = useState('anthropic/claude-haiku-4-5-20251001');
  const [showModelSelector, setShowModelSelector] = useState(false);

  // Audio
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [conversationContext, setConversationContext] = useState({
    overallSentiment: 'neutral, friendly',
    conversationDirection: 'general conversation',
    topics: [] as string[],
    userName: '', // Store user's name
  });

  const voiceAgentRef = useRef<any>(null);

  // Initialize audio on mount
  useEffect(() => {
    // Create audio element once
    const audio = new Audio('https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3');
    audio.loop = true;
    audio.volume = 0.15;
    audioRef.current = audio;

    return () => {
      // Cleanup
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Start session with animation and AI greeting
  const handleStartSession = async () => {
    if (!userNameInput.trim()) {
      alert('Please enter your name');
      return;
    }

    setIsAnimating(true);
    setUserName(userNameInput);

    // Update conversation context with user name
    setConversationContext(prev => ({
      ...prev,
      userName: userNameInput,
    }));

    // Start background music
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log('Audio autoplay blocked:', err));
    }

    // Animate in
    setTimeout(async () => {
      setSessionStarted(true);
      setIsAnimating(false);

      // AI greets user first
      await generateAiGreeting(userNameInput);
    }, 800);
  };

  // Generate AI greeting when session starts
  const generateAiGreeting = async (name: string) => {
    console.log('👋 Generating AI greeting for:', name);

    try {
      const response = await fetch('/api/voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `My name is ${name}. Please greet me and offer to help with whatever I need.`
          }],
          model: conversationModel,
          conversationContext: {
            ...conversationContext,
            userName: name,
          },
        }),
      });

      if (!response.ok) throw new Error('Greeting error');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let greeting = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          greeting += decoder.decode(value);
        }

        // Add to conversation
        setConversationMessages([{
          id: Date.now().toString(),
          type: 'assistant',
          text: greeting,
          timestamp: Date.now(),
        }]);

        // Speak greeting with excited emotion
        if (typeof (window as any).__voiceAgentSpeakSummary === 'function') {
          await (window as any).__voiceAgentSpeakSummary(greeting, {
            voiceId: selectedVoice.id,
            emotion: 'excited', // Always excited for greetings
          });
        }

        // Now it's user's turn
        setIsAiTurn(false);
      }
    } catch (error) {
      console.error('❌ Greeting error:', error);
    }
  };

  // Intelligent classification - determines if task needs background work
  const classifyTaskComplexity = (transcript: string): 'SIMPLE' | 'COMPLEX' => {
    const lower = transcript.toLowerCase();

    // Complex tasks that need background processing
    const complexPatterns = [
      /\b(write|create|make|generate|build|design|draft|compose)\b.*\b(story|article|essay|plan|code|website|app|content|script|page|html|css|javascript)\b/,
      /\b(analyze|review|evaluate|assess|investigate)\b.*\b(data|report|document|code|file)\b/,
      /\b(research|compile|summarize)\b.*\b(about|on|regarding)\b/,
      /\b(explain|teach|walk me through)\b.*\b(how to|in detail)\b/,
      /\b(multiple|several|many|list of)\b/,
      /\blonger than\b.*\b(paragraph|page|section)\b/,
    ];

    for (const pattern of complexPatterns) {
      if (lower.match(pattern)) {
        return 'COMPLEX';
      }
    }

    return 'SIMPLE';
  };

  // Handle transcript from voice agent
  const handleTranscript = async (transcript: string) => {
    console.log('📝 Transcript received:', transcript);

    // Check if muted or not user's turn
    if (isMuted) {
      console.log('🔇 Muted - ignoring transcript');
      return;
    }

    if (isAiTurn) {
      console.log('⏸️ AI is speaking - ignoring transcript');
      return;
    }

    // Now it's AI's turn
    setIsAiTurn(true);

    // Add user message to conversation
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      text: transcript,
      timestamp: Date.now(),
    };
    setConversationMessages(prev => [...prev, userMessage]);

    try {
      // ⚡ STEP 1: CLASSIFY TASK COMPLEXITY
      const complexity = classifyTaskComplexity(transcript);
      console.log('🎯 Task complexity:', complexity);

      // ⚡ STEP 2: HANDLE BASED ON COMPLEXITY
      if (complexity === 'COMPLEX') {
        // Complex tasks: Get instant ack, then do background work
        const startTime = performance.now();
        const ackResponse = await fetch('/api/voice-acknowledge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript }),
        });

        if (ackResponse.ok && ackResponse.body) {
          const reader = ackResponse.body.getReader();
          const decoder = new TextDecoder();
          let acknowledgment = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            acknowledgment += chunk;

            // Speak as soon as we have 5 words
            const wordCount = acknowledgment.trim().split(/\s+/).length;
            if (wordCount >= 5) {
              const totalTime = performance.now() - startTime;
              console.log(`⚡ First 5 words in ${totalTime.toFixed(2)}ms, speaking now!`);

              // Add to conversation
              setConversationMessages(prev => [...prev, {
                id: Date.now().toString(),
                type: 'assistant',
                text: acknowledgment,
                timestamp: Date.now(),
              }]);

              // Speak with emotion
              if (typeof (window as any).__voiceAgentSpeakSummary === 'function') {
                const emotion = detectEmotion(acknowledgment);
                (window as any).__voiceAgentSpeakSummary(acknowledgment, {
                  voiceId: selectedVoice.id,
                  emotion,
                });
              }

              break;
            }
          }
        }

        await handleComplexTask(transcript);
      } else {
        // Simple conversations: Skip ack, go straight to response
        await handleSimpleConversation(transcript);
      }

      // AI is done speaking, user's turn now
      setIsAiTurn(false);

    } catch (error) {
      console.error('❌ Error:', error);
      setIsAiTurn(false); // Reset on error
    }
  };

  // Handle complex tasks with background work + fluff
  const handleComplexTask = async (transcript: string) => {
    console.log('🔄 Complex task detected - starting background work...');

    setShowBackgroundPanel(true);
    setIsBackgroundWorking(true);

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: transcript,
    };

    setBackgroundMessages(prev => [...prev, userMessage]);

    try {
      // Start background chat response
      const chatPromise = fetch('/api/voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...backgroundMessages, userMessage],
          model: conversationModel,
          conversationContext,
        }),
      });

      // Generate "fluff" to speak while background work happens
      const fluffResponse = await fetch('/api/voice-fluff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: transcript }),
      });

      if (fluffResponse.ok && fluffResponse.body) {
        const reader = fluffResponse.body.getReader();
        const decoder = new TextDecoder();
        let fluff = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          fluff += chunk;
        }

        // Speak the fluff with emotion
        console.log('💬 Speaking fluff:', fluff);
        if (typeof (window as any).__voiceAgentSpeakSummary === 'function') {
          const emotion = detectEmotion(fluff);
          await (window as any).__voiceAgentSpeakSummary(fluff, {
            voiceId: selectedVoice.id,
            emotion,
          });
        }

        // Add to conversation
        setConversationMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          text: fluff,
          timestamp: Date.now(),
        }]);
      }

      // Wait for background chat to complete
      const chatResponse = await chatPromise;
      if (!chatResponse.ok) throw new Error('Chat error');

      const reader = chatResponse.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullResponse += chunk;

          // Update background panel in real-time
          setBackgroundMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage?.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: fullResponse }
              ];
            } else {
              return [
                ...prev,
                {
                  id: Date.now().toString(),
                  role: 'assistant',
                  content: fullResponse
                }
              ];
            }
          });
        }

        // Generate and speak high-level summary
        await generateHighLevelSummary(fullResponse);
        updateConversationContext(transcript, fullResponse);
      }
    } catch (error) {
      console.error('❌ Complex task error:', error);
    } finally {
      setIsBackgroundWorking(false);
    }
  };

  // Handle simple conversation (no background work)
  const handleSimpleConversation = async (transcript: string) => {
    console.log('💬 Simple conversation...');

    try {
      // Build messages array including current transcript
      const messages = [
        ...conversationMessages.map(msg => ({
          role: msg.type,
          content: msg.text,
        })),
        {
          role: 'user',
          content: transcript,
        }
      ];

      const response = await fetch('/api/voice-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          model: conversationModel,
          conversationContext,
        }),
      });

      if (!response.ok) throw new Error('Chat error');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          fullResponse += chunk;
        }

        // Add to conversation
        setConversationMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          text: fullResponse,
          timestamp: Date.now(),
        }]);

        // Speak directly with emotion detection
        if (typeof (window as any).__voiceAgentSpeakSummary === 'function') {
          const emotion = detectEmotion(fullResponse);
          await (window as any).__voiceAgentSpeakSummary(fullResponse, {
            voiceId: selectedVoice.id,
            emotion,
          });
        }

        updateConversationContext(transcript, fullResponse);
      }
    } catch (error) {
      console.error('❌ Conversation error:', error);
    }
  };

  // Generate high-level bullet-point style summary
  const generateHighLevelSummary = async (fullResponse: string) => {
    try {
      console.log('📝 Generating high-level summary...');

      const response = await fetch('/api/voice-summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullResponse,
          conversationContext,
          summarizerModel,
          summaryStyle: 'high-level', // NEW: bullet-point style
        }),
      });

      if (!response.ok) throw new Error('Summary error');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let summary = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          summary += decoder.decode(value);
        }

        console.log('✅ High-level summary:', summary);

        // Add to conversation
        setConversationMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          text: summary,
          timestamp: Date.now(),
        }]);

        // Speak the summary with emotion detection
        if (typeof (window as any).__voiceAgentSpeakSummary === 'function') {
          const emotion = detectEmotion(summary);
          await (window as any).__voiceAgentSpeakSummary(summary, {
            voiceId: selectedVoice.id,
            emotion,
          });
        }
      }
    } catch (error) {
      console.error('❌ Summary error:', error);
    }
  };

  const updateConversationContext = (transcript: string, response: string) => {
    const words = (transcript + ' ' + response).toLowerCase().split(' ');
    const newTopics = words.filter(w => w.length > 5).slice(0, 3);

    setConversationContext(prev => ({
      ...prev,
      topics: [...new Set([...prev.topics, ...newTopics])].slice(-10),
    }));
  };

  // Detect appropriate emotion for response
  const detectEmotion = (text: string): string => {
    const lowerText = text.toLowerCase();

    // Greeting/excitement patterns
    if (lowerText.match(/^(hey|hi|hello|great|awesome|wonderful|fantastic|perfect)/)) {
      return 'excited';
    }

    // Sad/empathetic patterns
    if (lowerText.match(/(sorry|unfortunately|sad|disappointed|my apologies)/)) {
      return 'apologetic';
    }

    // Angry/frustrated patterns
    if (lowerText.match(/(error|failed|wrong|issue|problem)/)) {
      return 'content'; // Stay calm during errors
    }

    // Happy/satisfied patterns
    if (lowerText.match(/(done|complete|finished|ready|success)/)) {
      return 'content';
    }

    // Scared/concerned patterns
    if (lowerText.match(/(careful|warning|alert|urgent)/)) {
      return 'concerned';
    }

    // Default to neutral for most responses
    return 'neutral';
  };

  // Voice preview function
  const previewVoice = async (voice: typeof availableVoices[0]) => {
    if (isPreviewingVoice) return; // Prevent multiple previews at once

    setIsPreviewingVoice(voice.id);

    try {
      const sampleText = `Hi there! I'm ${voice.name}. I'm here to help you today.`;

      // Call CartesiaTTS with this voice
      if (typeof (window as any).__voiceAgentSpeakSummary === 'function') {
        await (window as any).__voiceAgentSpeakSummary(sampleText, {
          voiceId: voice.id,
          emotion: 'excited',
        });
      }
    } catch (error) {
      console.error('❌ Voice preview error:', error);
    } finally {
      setIsPreviewingVoice(null);
    }
  };

  // Model options
  const modelOptions = [
    { id: 'anthropic/claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
    { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.5 Flash' },
    { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano' },
  ];

  if (!sessionStarted) {
    // Start Screen
    return (
      <div className="h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex items-center justify-center overflow-hidden">
        <div className={`text-center transition-all duration-1000 ${isAnimating ? 'scale-110 opacity-0' : 'scale-100 opacity-100'}`}>
          <div className="mb-8">
            <div className="inline-block p-6 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full border-2 border-purple-500/30 mb-6 animate-pulse">
              <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Voice Assistant
            </h1>
            <p className="text-xl text-gray-400 mb-12">
              Your AI companion for natural conversation
            </p>
          </div>

          {/* Name Input */}
          <div className="mb-8">
            <input
              type="text"
              value={userNameInput}
              onChange={(e) => setUserNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && userNameInput.trim()) {
                  handleStartSession();
                }
              }}
              placeholder="Enter your name..."
              className="w-80 px-6 py-4 bg-gray-800/50 border-2 border-purple-500/30 rounded-xl text-white text-lg text-center placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all"
              autoFocus
            />
            <p className="mt-3 text-sm text-gray-500">
              Press Enter to continue
            </p>
          </div>

          {/* Voice Selection */}
          <div className="mb-8 max-w-2xl mx-auto">
            <label className="block text-sm font-medium text-gray-400 mb-4 text-center">
              Choose a voice:
            </label>
            <div className="grid grid-cols-5 gap-3">
              {availableVoices.map((voice) => (
                <div key={voice.id} className="flex flex-col items-center">
                  <button
                    onClick={() => setSelectedVoice(voice)}
                    className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                      selectedVoice.id === voice.id
                        ? 'bg-purple-500/30 border-purple-500 shadow-lg shadow-purple-500/30'
                        : 'bg-gray-800/30 border-gray-700/50 hover:border-purple-500/50'
                    }`}
                  >
                    <div className="text-white font-medium text-sm mb-1">{voice.name}</div>
                    <div className="text-xs text-gray-500">{voice.description}</div>
                  </button>
                  <button
                    onClick={() => previewVoice(voice)}
                    disabled={isPreviewingVoice === voice.id}
                    className="mt-2 px-3 py-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-md border border-blue-500/30 transition-all disabled:opacity-50"
                  >
                    {isPreviewingVoice === voice.id ? 'Playing...' : 'Preview'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleStartSession}
            disabled={isAnimating || !userNameInput.trim()}
            className="group relative px-12 py-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl text-white font-bold text-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="relative z-10">Begin Session</span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          <p className="mt-8 text-sm text-gray-500">
            Immersive experience with ambient audio
          </p>
        </div>
      </div>
    );
  }

  // Main Interface
  return (
    <div className="relative h-screen overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">

      {/* Main Voice Interface - Left Side */}
      <div className={`h-full flex transition-all duration-300 ${showBackgroundPanel ? 'mr-96' : 'mr-0'}`}>
        <div className="flex-1 flex flex-col">
          {/* Header with Model Selector */}
          <div className="px-8 py-4 border-b border-gray-800/50 bg-gradient-to-r from-purple-900/10 via-blue-900/10 to-purple-900/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-500/30">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Voice Assistant</h1>
                  <p className="text-xs text-gray-400">
                    {userName && `Chatting with ${userName}`}
                    {!userName && 'Natural conversation'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Turn Indicator */}
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <div className={`w-2 h-2 rounded-full ${isAiTurn ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
                  <span className="text-xs text-gray-400">
                    {isAiTurn ? 'AI speaking...' : 'Your turn'}
                  </span>
                </div>

                {/* Mute Button */}
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-2 rounded-lg border transition-all ${
                    isMuted
                      ? 'bg-red-500/20 border-red-500/50 hover:bg-red-500/30'
                      : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  )}
                </button>

                {/* Model Selector */}
                <div className="relative">
                <button
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700/50 transition-colors text-sm"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-300">Models</span>
                </button>

                {showModelSelector && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 p-4">
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-400 mb-2">Conversation Model</label>
                      <select
                        value={conversationModel}
                        onChange={(e) => setConversationModel(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                      >
                        {modelOptions.map(model => (
                          <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Summarizer Model</label>
                      <select
                        value={summarizerModel}
                        onChange={(e) => setSummarizerModel(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                      >
                        {modelOptions.map(model => (
                          <option key={model.id} value={model.id}>{model.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>

          {/* Conversation Display - Chat Style */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {conversationMessages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${msg.type === 'user' ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {msg.type === 'user' ? 'You said' : 'AI said'}
                    </span>
                  </div>
                  <div className={`pl-4 border-l-2 ${msg.type === 'user' ? 'border-purple-500/30' : 'border-blue-500/30'}`}>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))}

              {conversationMessages.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-gray-500 text-sm">Press the microphone to start speaking...</p>
                </div>
              )}
            </div>
          </div>

          {/* Voice Controls */}
          <div className="border-t border-gray-800/50 bg-gray-900/30 backdrop-blur-xl">
            <VoiceAgentPanel
              ref={voiceAgentRef}
              onTranscript={handleTranscript}
            />
          </div>
        </div>
      </div>

      {/* Background Work Panel - Slides in from right */}
      <div
        className={`absolute top-0 right-0 h-full w-96 bg-gray-900/95 backdrop-blur-xl border-l border-gray-700/50 shadow-2xl transform transition-transform duration-300 ${
          showBackgroundPanel ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-700/50 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Background Assistant</h2>
                  <p className="text-xs text-gray-400">Detailed work in progress</p>
                </div>
              </div>
              <button
                onClick={() => setShowBackgroundPanel(false)}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              {backgroundMessages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${msg.role === 'user' ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                    <span className="text-xs font-medium text-gray-400 uppercase">
                      {msg.role}
                    </span>
                  </div>
                  <div className="pl-4 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap border-l-2 border-gray-700/50">
                    {msg.content}
                  </div>
                </div>
              ))}
              {isBackgroundWorking && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Processing...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
