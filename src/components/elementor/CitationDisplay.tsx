'use client';

interface Citation {
  url: string;
  title?: string;
  index: number;
}

interface CitationDisplayProps {
  citations: Citation[];
}

export function CitationDisplay({ citations }: CitationDisplayProps) {
  if (!citations || citations.length === 0) return null;

  return (
    <div style={{
      marginTop: '16px',
      padding: '12px 16px',
      background: '#f0f9ff',
      borderLeft: '4px solid #3b82f6',
      borderRadius: '8px',
    }}>
      <div style={{
        fontSize: '12px',
        fontWeight: 600,
        color: '#1e40af',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        🔗 Sources
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {citations.map((citation, i) => (
          <a
            key={i}
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '13px',
              color: '#2563eb',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              padding: '4px 0',
            }}
          >
            <span style={{
              flexShrink: 0,
              fontSize: '11px',
              background: '#3b82f6',
              color: '#fff',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 600,
            }}>
              {citation.index}
            </span>
            <span style={{
              flex: 1,
              wordBreak: 'break-word',
            }}>
              {citation.title || citation.url}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
