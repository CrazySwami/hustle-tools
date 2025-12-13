'use client';

import { useState, useEffect } from 'react';

interface ParameterDoc {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  default?: string | number | boolean;
  enum?: string[];
}

interface SchemaDoc {
  request?: ParameterDoc[];
  response?: ParameterDoc[];
  queryParams?: ParameterDoc[];
}

interface APITesterProps {
  id: string;
  endpoint: string;
  methods: string[];
  selectedEndpoint?: string | null;
  schemaPath?: string;
  schema?: SchemaDoc;
}

interface RequestState {
  method: string;
  body: string;
  queryParams: string;
  headers: Record<string, string>;
}

interface ResponseState {
  status: number | null;
  statusText: string;
  body: string;
  time: number | null;
  error: string | null;
  contentType: string | null;
}

// Default request bodies for known APIs
const DEFAULT_BODIES: Record<string, Record<string, object>> = {
  brandfetch: {
    default: { domain: 'stripe.com' },
  },
  elevenlabs: {
    tts: {
      text: 'Hello, this is a test of the ElevenLabs text-to-speech API.',
      voiceId: '21m00Tcm4TlvDq8ikWAM',
      modelId: 'eleven_multilingual_v2',
      outputFormat: 'mp3_44100_128',
      responseFormat: 'json',
    },
    voices: {},
    models: {},
  },
};

// Default query params for GET requests
const DEFAULT_QUERY_PARAMS: Record<string, Record<string, string>> = {
  elevenlabs: {
    voices: 'search=&pageSize=10',
    models: '',
  },
};

/**
 * API Tester Component
 *
 * Interactive form for testing API endpoints directly from the showcase.
 * Features:
 * - Method selection
 * - Schema-driven default values
 * - Query parameter support for GET requests
 * - JSON body editor
 * - Response display with timing
 * - Audio playback for binary responses
 *
 * Created with Hustle API Dev Tools (v3.9.2)
 */
export function APITester({ id, endpoint, methods, selectedEndpoint, schemaPath, schema }: APITesterProps) {
  // Get default body for this API/endpoint
  const getDefaultBody = () => {
    const apiDefaults = DEFAULT_BODIES[id];
    if (apiDefaults) {
      const endpointDefaults = apiDefaults[selectedEndpoint || 'default'];
      if (endpointDefaults && Object.keys(endpointDefaults).length > 0) {
        return JSON.stringify(endpointDefaults, null, 2);
      }
    }
    return JSON.stringify({}, null, 2);
  };

  // Get default query params for GET requests
  const getDefaultQueryParams = () => {
    const apiParams = DEFAULT_QUERY_PARAMS[id];
    if (apiParams && selectedEndpoint) {
      return apiParams[selectedEndpoint] || '';
    }
    return '';
  };

  const [request, setRequest] = useState<RequestState>({
    method: methods[0] || 'POST',
    body: getDefaultBody(),
    queryParams: getDefaultQueryParams(),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const [response, setResponse] = useState<ResponseState>({
    status: null,
    statusText: '',
    body: '',
    time: null,
    error: null,
    contentType: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Update defaults when endpoint changes
  useEffect(() => {
    setRequest((prev) => ({
      ...prev,
      method: methods[0] || 'POST',
      body: getDefaultBody(),
      queryParams: getDefaultQueryParams(),
    }));
    // Clear previous response
    setResponse({
      status: null,
      statusText: '',
      body: '',
      time: null,
      error: null,
      contentType: null,
    });
    setAudioUrl(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEndpoint, id]);

  const handleSubmit = async () => {
    setIsLoading(true);
    setResponse({ status: null, statusText: '', body: '', time: null, error: null, contentType: null });
    setAudioUrl(null);

    const startTime = performance.now();

    try {
      // Build URL with query params for GET
      let url = endpoint;
      if (request.method === 'GET' && request.queryParams.trim()) {
        url = `${endpoint}?${request.queryParams}`;
      }

      const fetchOptions: RequestInit = {
        method: request.method,
        headers: request.headers,
      };

      // Add body for non-GET requests
      if (request.method !== 'GET' && request.body.trim()) {
        fetchOptions.body = request.body;
      }

      const res = await fetch(url, fetchOptions);
      const endTime = performance.now();

      const contentType = res.headers.get('content-type') || '';
      let responseBody = '';

      // Handle different content types
      if (contentType.includes('audio/') || contentType.includes('application/octet-stream')) {
        // Binary audio response
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        responseBody = `[Audio Response - ${blob.size} bytes]\nContent-Type: ${contentType}`;
      } else if (contentType.includes('application/json')) {
        const json = await res.json();
        responseBody = JSON.stringify(json, null, 2);

        // Check if JSON contains base64 audio
        if (json.audio && typeof json.audio === 'string') {
          try {
            const format = json.format || 'mp3';
            const audioData = atob(json.audio);
            const bytes = new Uint8Array(audioData.length);
            for (let i = 0; i < audioData.length; i++) {
              bytes[i] = audioData.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: `audio/${format}` });
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
          } catch {
            // Not valid base64, ignore
          }
        }
      } else {
        responseBody = await res.text();
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        body: responseBody,
        time: Math.round(endTime - startTime),
        error: null,
        contentType,
      });
    } catch (error) {
      const endTime = performance.now();
      setResponse({
        status: null,
        statusText: '',
        body: '',
        time: Math.round(endTime - startTime),
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        contentType: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: number | null) => {
    if (!status) return 'text-gray-500';
    if (status >= 200 && status < 300) return 'text-green-500';
    if (status >= 400 && status < 500) return 'text-yellow-500';
    if (status >= 500) return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Request Panel */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-black dark:text-white">Request</h3>

        {/* Method Selection */}
        <div>
          <label className="mb-1 block text-sm font-bold text-black dark:text-white">Method</label>
          <div className="flex gap-2">
            {methods.map((method) => (
              <button
                key={method}
                onClick={() => setRequest((prev) => ({ ...prev, method }))}
                className={`border-2 px-4 py-2 text-sm font-medium transition-colors ${
                  request.method === method
                    ? 'border-[#BA0C2F] bg-[#BA0C2F] text-white'
                    : 'border-black bg-white text-black hover:border-[#BA0C2F] dark:border-gray-600 dark:bg-gray-800 dark:text-white'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Endpoint Display */}
        <div>
          <label className="mb-1 block text-sm font-bold text-black dark:text-white">Endpoint</label>
          <div className="flex items-center border-2 border-black bg-gray-50 px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
            <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{endpoint}</span>
          </div>
        </div>

        {/* Query Parameters (for GET requests) */}
        {request.method === 'GET' && (
          <div>
            <label className="mb-1 block text-sm font-bold text-black dark:text-white">Query Parameters</label>
            <input
              type="text"
              value={request.queryParams}
              onChange={(e) => setRequest((prev) => ({ ...prev, queryParams: e.target.value }))}
              className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-sm focus:border-[#BA0C2F] focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="key1=value1&key2=value2"
            />
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
              Add query string parameters (without the ?)
            </p>
          </div>
        )}

        {/* Body Editor (hide for GET) */}
        {request.method !== 'GET' && (
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-bold text-black dark:text-white">Body (JSON)</label>
              <button
                onClick={() => setRequest((prev) => ({ ...prev, body: getDefaultBody() }))}
                className="text-xs text-gray-600 hover:text-[#BA0C2F] dark:text-gray-400"
              >
                Reset to defaults
              </button>
            </div>
            <textarea
              value={request.body}
              onChange={(e) => setRequest((prev) => ({ ...prev, body: e.target.value }))}
              className="h-48 w-full border-2 border-black bg-white p-3 font-mono text-sm focus:border-[#BA0C2F] focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder='{"key": "value"}'
            />
          </div>
        )}

        {/* Parameter Documentation */}
        {schema && (schema.request?.length || schema.queryParams?.length) ? (
          <ParameterDocs
            requestParams={schema.request}
            queryParams={schema.queryParams}
            isGetRequest={request.method === 'GET'}
          />
        ) : null}

        {/* Headers */}
        <div>
          <label className="mb-1 block text-sm font-bold text-black dark:text-white">Headers</label>
          <div className="border-2 border-black bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800">
            {Object.entries(request.headers).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 text-sm">
                <span className="font-bold text-black dark:text-white">{key}:</span>
                <span className="text-gray-600 dark:text-gray-400">{value}</span>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            API keys loaded from .env automatically
          </p>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full border-2 border-black bg-[#BA0C2F] py-3 font-bold text-white transition-colors hover:bg-[#8a0923] disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Sending...
            </span>
          ) : (
            `Send ${request.method} Request`
          )}
        </button>
      </div>

      {/* Response Panel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-black dark:text-white">Response</h3>
          {response.time !== null && (
            <span className="text-sm text-gray-600 dark:text-gray-400">{response.time}ms</span>
          )}
        </div>

        {/* Status */}
        {response.status !== null && (
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${getStatusColor(response.status)}`}>
              {response.status}
            </span>
            <span className="text-gray-600 dark:text-gray-400">{response.statusText}</span>
          </div>
        )}

        {/* Error */}
        {response.error && (
          <div className="border-2 border-red-600 bg-red-50 p-4 dark:bg-red-900/20">
            <p className="text-sm text-red-800 dark:text-red-300">{response.error}</p>
          </div>
        )}

        {/* Audio Player */}
        {audioUrl && (
          <div className="border-2 border-black bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-800">
            <p className="mb-2 text-sm font-bold text-black dark:text-white">Audio Response</p>
            <audio controls className="w-full" src={audioUrl}>
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {/* Body */}
        {response.body ? (
          <div className="relative">
            <pre className="max-h-96 overflow-auto border-2 border-black bg-zinc-900 p-4 text-sm text-zinc-100">
              <code>{response.body}</code>
            </pre>
            <button
              onClick={() => navigator.clipboard.writeText(response.body)}
              className="absolute right-2 top-2 border border-zinc-600 bg-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-600"
            >
              Copy
            </button>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center border-2 border-dashed border-black dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isLoading ? 'Waiting for response...' : 'Send a request to see the response'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Parameter Documentation Component
 * Displays request body and query parameter documentation in a collapsible panel.
 */
function ParameterDocs({
  requestParams,
  queryParams,
  isGetRequest,
}: {
  requestParams?: ParameterDoc[];
  queryParams?: ParameterDoc[];
  isGetRequest: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const paramsToShow = isGetRequest ? queryParams : requestParams;
  if (!paramsToShow?.length) return null;

  return (
    <div className="border-2 border-black dark:border-gray-600">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between bg-gray-50 px-3 py-2 text-left dark:bg-gray-800"
      >
        <span className="text-sm font-bold text-black dark:text-white">
          {isGetRequest ? 'Query Parameters' : 'Request Body'} Documentation
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isExpanded && (
        <div className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
          {paramsToShow.map((param) => (
            <div key={param.name} className="px-3 py-2">
              <div className="flex items-center gap-2">
                <code className="text-sm font-bold text-[#BA0C2F]">{param.name}</code>
                <span className="border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {param.type}
                </span>
                {param.required && (
                  <span className="border border-red-300 bg-red-50 px-1.5 py-0.5 text-xs text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
                    required
                  </span>
                )}
              </div>
              {param.description && (
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  {param.description}
                </p>
              )}
              {param.enum && (
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="text-xs text-gray-500">Options:</span>
                  {param.enum.map((val) => (
                    <code
                      key={val}
                      className="border border-gray-200 bg-gray-50 px-1 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                    >
                      {val}
                    </code>
                  ))}
                </div>
              )}
              {param.default !== undefined && (
                <p className="mt-1 text-xs text-gray-500">
                  Default: <code className="text-gray-700 dark:text-gray-300">{String(param.default)}</code>
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
