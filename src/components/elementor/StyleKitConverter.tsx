'use client';

import { useState } from 'react';

interface ConvertedData {
  title: string;
  type: string;
  version: string;
  page_settings: any;
  content: any[];
}

export function StyleKitConverter() {
  const [input, setInput] = useState('');
  const [convertedData, setConvertedData] = useState<ConvertedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // PHP unserialize implementation for browser
  function unserialize(data: string): any {
    let offset = 0;

    function errorMsg(msg: string): never {
      throw new Error(msg + ' at position ' + offset);
    }

    function readUntil(char: string): string {
      const start = offset;
      while (offset < data.length && data[offset] !== char) {
        offset++;
      }
      return data.substring(start, offset);
    }

    function parseValue(): any {
      const type = data[offset++];

      if (data[offset++] !== ':') {
        errorMsg('Expected ":"');
      }

      switch (type) {
        case 's': { // string
          const strLen = parseInt(readUntil(':'));
          offset++; // skip ':'
          if (data[offset++] !== '"') errorMsg('Expected opening quote');
          const str = data.substr(offset, strLen);
          offset += strLen;
          if (data[offset++] !== '"') errorMsg('Expected closing quote');
          offset++; // skip ';'
          return str;
        }

        case 'i': { // integer
          const intStr = readUntil(';');
          offset++; // skip ';'
          return parseInt(intStr);
        }

        case 'd': { // double/float
          const floatStr = readUntil(';');
          offset++; // skip ';'
          return parseFloat(floatStr);
        }

        case 'b': { // boolean
          const boolVal = data[offset];
          offset += 2; // skip value and ';'
          return boolVal === '1';
        }

        case 'N': { // null
          offset++; // skip ';'
          return null;
        }

        case 'a': { // array
          const arrLen = parseInt(readUntil(':'));
          offset++; // skip ':'
          if (data[offset++] !== '{') errorMsg('Expected "{"');

          const result: any = {};
          let isNumericArray = true;

          for (let i = 0; i < arrLen; i++) {
            const key = parseValue();
            const value = parseValue();
            result[key] = value;

            if (typeof key !== 'number' || key !== i) {
              isNumericArray = false;
            }
          }

          if (data[offset++] !== '}') errorMsg('Expected "}"');

          // Convert to array if all keys are sequential numbers
          if (isNumericArray && arrLen > 0) {
            return Object.values(result);
          }

          return result;
        }

        default:
          errorMsg('Unknown type: ' + type);
      }
    }

    try {
      return parseValue();
    } catch (e) {
      console.error('Unserialize error:', e);
      throw e;
    }
  }

  function generateHashId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  function convert() {
    const trimmedInput = input.trim();

    // Hide previous messages
    setError(null);
    setSuccess(false);
    setConvertedData(null);

    if (!trimmedInput) {
      setError('Please paste your Elementor export JSON first.');
      return;
    }

    try {
      // Parse the JSON
      const parsed = JSON.parse(trimmedInput);

      // Check if it has a "data" field with serialized PHP
      if (!parsed.data || typeof parsed.data !== 'string') {
        setError('This JSON doesn\'t have a "data" field with serialized PHP data. It might already be in the correct format, or it\'s not an Elementor export.');
        return;
      }

      if (!parsed.data.startsWith('a:')) {
        setError('The "data" field doesn\'t contain PHP serialized data (should start with "a:"). Already in correct format?');
        return;
      }

      // Unserialize the PHP data
      console.log('Unserializing PHP data...');
      const unserialized = unserialize(parsed.data);

      // Create the proper structure
      const converted: ConvertedData = {
        title: parsed.title || 'Converted Kit',
        type: 'kit',
        version: '0.4',
        page_settings: unserialized,
        content: [],
      };

      // Fix: Convert empty objects to arrays for custom_colors and custom_typography
      if (!Array.isArray(converted.page_settings.custom_colors)) {
        converted.page_settings.custom_colors = [];
      }

      if (!Array.isArray(converted.page_settings.custom_typography)) {
        converted.page_settings.custom_typography = [];
      }

      // Extract colors from ang_global_* arrays if they exist
      const extractedColors: any[] = [];
      const angColorArrays = [
        'ang_global_background_colors',
        'ang_global_accent_colors',
        'ang_global_text_colors',
        'ang_global_extra_colors',
      ];

      angColorArrays.forEach((arrayName) => {
        if (Array.isArray(converted.page_settings[arrayName])) {
          converted.page_settings[arrayName].forEach((colorObj: any) => {
            if (colorObj.color) {
              extractedColors.push({
                _id: colorObj._id || generateHashId(),
                title: colorObj.title || 'Custom Color',
                color: colorObj.color,
              });
            }
          });
        }
      });

      // Add extracted colors to custom_colors
      if (extractedColors.length > 0) {
        converted.page_settings.custom_colors = extractedColors;
      }

      // Ensure system_colors exists and is an array
      if (!Array.isArray(converted.page_settings.system_colors)) {
        converted.page_settings.system_colors = [
          { _id: 'primary', title: 'Primary', color: '#000000' },
          { _id: 'secondary', title: 'Secondary', color: '#c3acd0' },
          { _id: 'text', title: 'Text', color: '#333333' },
          { _id: 'accent', title: 'Accent', color: '#7743db' },
        ];
      } else {
        // Add default colors if missing, or try to use extracted colors
        const defaultColors: Record<string, string> = {
          primary: extractedColors[0]?.color || '#000000',
          secondary: extractedColors[1]?.color || '#c3acd0',
          text: extractedColors[2]?.color || '#333333',
          accent: extractedColors[3]?.color || '#7743db',
        };

        converted.page_settings.system_colors = converted.page_settings.system_colors.map((color: any) => {
          if (!color.color) {
            return {
              ...color,
              color: defaultColors[color._id] || '#000000',
            };
          }
          return color;
        });
      }

      // Extract typography from ang_global_title_fonts and ang_global_text_fonts
      const extractedTypography: any[] = [];
      const angTypoArrays = ['ang_global_title_fonts', 'ang_global_text_fonts'];

      angTypoArrays.forEach((arrayName) => {
        if (Array.isArray(converted.page_settings[arrayName])) {
          converted.page_settings[arrayName].forEach((typoObj: any) => {
            extractedTypography.push({
              _id: typoObj._id || generateHashId(),
              title: typoObj.title || 'Custom Typography',
              typography_font_family: typoObj.typography_font_family || 'Roboto',
              typography_font_weight: typoObj.typography_font_weight || '400',
              typography_font_size: typoObj.typography_font_size,
              typography_line_height: typoObj.typography_line_height,
              typography_text_transform: typoObj.typography_text_transform,
              typography_letter_spacing: typoObj.typography_letter_spacing,
            });
          });
        }
      });

      // Add extracted typography to custom_typography
      if (extractedTypography.length > 0) {
        converted.page_settings.custom_typography = extractedTypography;
      }

      if (!Array.isArray(converted.page_settings.system_typography)) {
        converted.page_settings.system_typography = [
          { _id: 'primary', title: 'Primary', typography_font_family: 'Roboto', typography_font_weight: '600' },
          { _id: 'secondary', title: 'Secondary', typography_font_family: 'Roboto', typography_font_weight: '500' },
          { _id: 'text', title: 'Text', typography_font_family: 'Roboto', typography_font_weight: '400' },
          { _id: 'accent', title: 'Accent', typography_font_family: 'Roboto', typography_font_weight: '600' },
        ];
      } else {
        // Add default font properties if missing
        converted.page_settings.system_typography = converted.page_settings.system_typography.map((typo: any) => {
          return {
            typography_font_family: 'Roboto',
            typography_font_weight: '400',
            ...typo,
          };
        });
      }

      setConvertedData(converted);
      setSuccess(true);
      console.log('✅ Conversion successful!');
    } catch (e) {
      console.error('Conversion error:', e);
      setError(`Failed to convert: ${e instanceof Error ? e.message : 'Unknown error'}\n\nMake sure you pasted the complete JSON from Elementor's export.`);
    }
  }

  function downloadJSON() {
    if (!convertedData) return;

    const json = JSON.stringify(convertedData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (convertedData.title || 'converted-kit').toLowerCase().replace(/\s+/g, '-') + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyToClipboard() {
    if (!convertedData) return;

    const json = JSON.stringify(convertedData, null, 2);
    navigator.clipboard.writeText(json).then(
      () => {
        alert('✅ Copied to clipboard!');
      },
      (err) => {
        alert('Failed to copy: ' + err);
      }
    );
  }

  function clearAll() {
    setInput('');
    setError(null);
    setSuccess(false);
    setConvertedData(null);
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)',
        padding: '24px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          backgroundColor: '#e3f2fd',
          borderLeft: '4px solid #2196f3',
          padding: '15px',
          marginBottom: '20px',
          borderRadius: '4px',
        }}
      >
        <strong style={{ color: '#1976d2' }}>📋 What this does:</strong> Takes the JSON file from
        Elementor's export (which contains PHP serialized data in the "data" field) and converts it to proper JSON
        format that the Style Kit Editor can use.
      </div>

      <div
        style={{
          backgroundColor: 'var(--card)',
          borderLeft: '4px solid var(--primary)',
          padding: '20px',
          marginBottom: '20px',
          borderRadius: '4px',
        }}
      >
        <h3 style={{ color: 'var(--primary)', marginBottom: '10px', fontSize: '16px' }}>
          Step 1: Paste Your Elementor Export
        </h3>
        <p style={{ marginBottom: '10px', fontSize: '14px' }}>
          Paste the entire content of your exported JSON file below:
        </p>
        <textarea
          id="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='{"title":"Your Kit","data":"a:255:{...}"}'
          style={{
            width: '100%',
            padding: '15px',
            border: '2px solid var(--border)',
            borderRadius: '4px',
            fontFamily: '"Courier New", monospace',
            fontSize: '14px',
            resize: 'vertical',
            minHeight: '200px',
            backgroundColor: 'var(--background)',
            color: 'var(--foreground)',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={convert}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 500,
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          🔄 Convert to Clean JSON
        </button>
        <button
          onClick={clearAll}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 500,
            backgroundColor: 'var(--muted)',
            color: 'var(--muted-foreground)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          🗑️ Clear
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#ffebee',
            border: '2px solid #f44336',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          <h3 style={{ color: '#c62828', marginBottom: '10px', fontSize: '16px' }}>⚠️ Error</h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#c62828', whiteSpace: 'pre-wrap' }}>{error}</p>
        </div>
      )}

      {success && convertedData && (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#e7f4e7',
            border: '2px solid #4caf50',
            borderRadius: '4px',
          }}
        >
          <h3 style={{ color: '#2e7d32', marginBottom: '10px', fontSize: '16px' }}>✅ Conversion Successful!</h3>
          <p style={{ marginBottom: '10px', fontSize: '14px', color: '#2e7d32' }}>
            Your converted JSON is ready:
          </p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <button
              onClick={downloadJSON}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 500,
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              📥 Download JSON File
            </button>
            <button
              onClick={copyToClipboard}
              style={{
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: 500,
                backgroundColor: 'var(--muted)',
                color: 'var(--muted-foreground)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              📋 Copy to Clipboard
            </button>
          </div>
          <details style={{ marginTop: '15px' }}>
            <summary
              style={{
                cursor: 'pointer',
                color: 'var(--primary)',
                fontWeight: 500,
                fontSize: '14px',
              }}
            >
              📄 Preview Converted JSON
            </summary>
            <pre
              style={{
                backgroundColor: 'var(--card)',
                padding: '15px',
                borderRadius: '4px',
                overflowX: 'auto',
                maxHeight: '300px',
                fontSize: '12px',
                marginTop: '10px',
                border: '1px solid var(--border)',
              }}
            >
              {JSON.stringify(convertedData, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
