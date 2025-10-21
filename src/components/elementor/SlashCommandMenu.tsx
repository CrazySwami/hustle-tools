'use client';

import { useEffect, useState } from 'react';

interface SlashCommand {
  command: string;
  icon: string;
  name: string;
  description: string;
  example: string;
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: '/search',
    icon: '🔍',
    name: 'Search Elementor Docs',
    description: 'Search for Elementor widget documentation',
    example: '/search button widget properties'
  },
  {
    command: '/convert',
    icon: '🎨',
    name: 'Convert HTML to Elementor',
    description: 'Convert HTML/CSS/JS code to Elementor JSON',
    example: '/convert <paste HTML here>'
  },
  {
    command: '/patch',
    icon: '🔧',
    name: 'Generate JSON Patch',
    description: 'Create surgical edits to your JSON',
    example: '/patch change heading color to red'
  },
  {
    command: '/playground',
    icon: '🚀',
    name: 'Open in Playground',
    description: 'Launch or refresh WordPress Playground',
    example: '/playground launch'
  },
  {
    command: '/help',
    icon: '❓',
    name: 'Show Help',
    description: 'Display all available commands',
    example: '/help'
  }
];

interface SlashCommandMenuProps {
  show: boolean;
  filter: string;
  onSelect: (command: SlashCommand) => void;
  position?: { top: number; left: number };
}

export function SlashCommandMenu({ show, filter, onSelect, position }: SlashCommandMenuProps) {
  const [filteredCommands, setFilteredCommands] = useState(SLASH_COMMANDS);

  useEffect(() => {
    if (filter) {
      const query = filter.toLowerCase();
      setFilteredCommands(
        SLASH_COMMANDS.filter(
          cmd =>
            cmd.command.toLowerCase().includes(query) ||
            cmd.name.toLowerCase().includes(query) ||
            cmd.description.toLowerCase().includes(query)
        )
      );
    } else {
      setFilteredCommands(SLASH_COMMANDS);
    }
  }, [filter]);

  if (!show) return null;

  return (
    <div
      className="slash-command-menu"
      style={{
        position: 'absolute',
        bottom: '100%',
        left: position?.left || 0,
        marginBottom: '8px',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        maxWidth: '400px',
        maxHeight: '300px',
        overflowY: 'auto',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid #e5e7eb',
          fontSize: '12px',
          fontWeight: '600',
          color: '#6b7280',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        🛠️ Available Commands
      </div>
      <div>
        {filteredCommands.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
            No commands found
          </div>
        ) : (
          filteredCommands.map((cmd) => (
            <button
              key={cmd.command}
              onClick={() => onSelect(cmd)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: 'none',
                background: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.15s',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontSize: '20px', flexShrink: 0 }}>{cmd.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '2px' }}>
                  {cmd.command}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                  {cmd.description}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#9ca3af',
                    fontFamily: 'monospace',
                    fontStyle: 'italic',
                  }}
                >
                  {cmd.example}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
