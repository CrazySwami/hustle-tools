'use client';

import { useState, useEffect } from 'react';
import {
  isSupabaseConfigured,
  saveSnapshotToSupabase,
  listSnapshots,
  loadSnapshotFromSupabase,
  deleteSnapshot,
  type PlaygroundSnapshot,
} from '@/lib/playground-persistence';

export function PlaygroundSnapshotManager() {
  const [snapshots, setSnapshots] = useState<PlaygroundSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotDescription, setSnapshotDescription] = useState('');

  const supabaseConfigured = isSupabaseConfigured();

  useEffect(() => {
    if (supabaseConfigured) {
      loadSnapshotList();
    }
  }, [supabaseConfigured]);

  const loadSnapshotList = async () => {
    setLoading(true);
    setError(null);

    try {
      const list = await listSnapshots();
      setSnapshots(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load snapshots');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSnapshot = async () => {
    if (!snapshotName.trim()) {
      setError('Please enter a snapshot name');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await saveSnapshotToSupabase(snapshotName, snapshotDescription);
      setSuccess('Snapshot saved successfully!');
      setShowSaveDialog(false);
      setSnapshotName('');
      setSnapshotDescription('');
      await loadSnapshotList();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save snapshot');
    } finally {
      setSaving(false);
    }
  };

  const handleLoadSnapshot = async (snapshotId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await loadSnapshotFromSupabase(snapshotId);
      setSuccess('Snapshot loaded successfully! Refreshing page...');

      // Refresh page to reinitialize Playground with new state
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load snapshot');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSnapshot = async (snapshotId: string) => {
    if (!confirm('Are you sure you want to delete this snapshot? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await deleteSnapshot(snapshotId);
      setSuccess('Snapshot deleted');
      await loadSnapshotList();
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete snapshot');
    } finally {
      setLoading(false);
    }
  };

  if (!supabaseConfigured) {
    return (
      <div style={{
        padding: '24px',
        textAlign: 'center',
        color: 'var(--muted-foreground)',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
          Supabase Not Configured
        </h3>
        <p style={{ fontSize: '14px', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto' }}>
          To enable WordPress Playground state persistence, configure Supabase by setting:
        </p>
        <pre style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: 'var(--muted)',
          borderRadius: '6px',
          fontSize: '12px',
          textAlign: 'left',
          maxWidth: '500px',
          margin: '16px auto 0',
        }}>
          NEXT_PUBLIC_SUPABASE_URL=your_url{'\n'}
          NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
        </pre>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--background)',
      color: 'var(--foreground)',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--card)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            Playground Snapshots
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: 'var(--muted-foreground)' }}>
            Save and restore your WordPress Playground state
          </p>
        </div>
        <button
          onClick={() => setShowSaveDialog(true)}
          disabled={saving}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 500,
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          💾 Save Current State
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          margin: '16px 24px',
          padding: '12px',
          backgroundColor: 'var(--destructive)',
          color: 'var(--destructive-foreground)',
          borderRadius: '6px',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          margin: '16px 24px',
          padding: '12px',
          backgroundColor: '#10b981',
          color: 'white',
          borderRadius: '6px',
          fontSize: '14px',
        }}>
          {success}
        </div>
      )}

      {/* Info Box */}
      <div style={{
        margin: '16px 24px',
        padding: '16px',
        backgroundColor: 'var(--muted)',
        borderRadius: '6px',
        fontSize: '13px',
        color: 'var(--muted-foreground)',
        lineHeight: '1.6',
      }}>
        <strong>What gets saved:</strong> Complete WordPress installation including plugins, themes, media uploads,
        database, and all settings. Snapshots are stored in your Supabase account and can be restored anytime.
      </div>

      {/* Snapshots List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 24px 24px',
      }}>
        {loading && snapshots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--muted-foreground)' }}>
            Loading snapshots...
          </div>
        ) : snapshots.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px',
            color: 'var(--muted-foreground)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No snapshots yet</p>
            <p style={{ fontSize: '14px' }}>
              Click "Save Current State" to create your first snapshot
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                style={{
                  padding: '16px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  backgroundColor: 'var(--card)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600 }}>
                      {snapshot.name}
                    </h3>
                    {snapshot.description && (
                      <p style={{ margin: '0 0 8px', fontSize: '14px', color: 'var(--muted-foreground)' }}>
                        {snapshot.description}
                      </p>
                    )}
                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      fontSize: '13px',
                      color: 'var(--muted-foreground)',
                      flexWrap: 'wrap',
                    }}>
                      <span>📅 {new Date(snapshot.created_at).toLocaleDateString()}</span>
                      <span>💾 {(snapshot.file_size / 1024 / 1024).toFixed(2)} MB</span>
                      {snapshot.wordpress_version && (
                        <span>🌐 WordPress {snapshot.wordpress_version}</span>
                      )}
                      {snapshot.plugins && snapshot.plugins.length > 0 && (
                        <span>🔌 {snapshot.plugins.length} plugins</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleLoadSnapshot(snapshot.id)}
                      disabled={loading}
                      style={{
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: 500,
                        backgroundColor: 'var(--primary)',
                        color: 'var(--primary-foreground)',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      📥 Restore
                    </button>
                    <button
                      onClick={() => handleDeleteSnapshot(snapshot.id)}
                      disabled={loading}
                      style={{
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: 500,
                        backgroundColor: 'var(--destructive)',
                        color: 'var(--destructive-foreground)',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>

                {/* Plugin/Theme List */}
                {snapshot.plugins && snapshot.plugins.length > 0 && (
                  <details style={{ marginTop: '12px', fontSize: '13px' }}>
                    <summary style={{ cursor: 'pointer', color: 'var(--muted-foreground)' }}>
                      View installed plugins ({snapshot.plugins.length})
                    </summary>
                    <ul style={{
                      margin: '8px 0 0',
                      paddingLeft: '20px',
                      color: 'var(--muted-foreground)',
                    }}>
                      {snapshot.plugins.slice(0, 10).map((plugin, i) => (
                        <li key={i}>{plugin}</li>
                      ))}
                      {snapshot.plugins.length > 10 && (
                        <li>...and {snapshot.plugins.length - 10} more</li>
                      )}
                    </ul>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            width: '90%',
            maxWidth: '500px',
            backgroundColor: 'var(--card)',
            borderRadius: '8px',
            padding: '24px',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>
              Save Playground Snapshot
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
              }}>
                Snapshot Name *
              </label>
              <input
                type="text"
                value={snapshotName}
                onChange={(e) => setSnapshotName(e.target.value)}
                placeholder="My WordPress Setup"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 500,
              }}>
                Description (Optional)
              </label>
              <textarea
                value={snapshotDescription}
                onChange={(e) => setSnapshotDescription(e.target.value)}
                placeholder="What's included in this snapshot..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSnapshotName('');
                  setSnapshotDescription('');
                }}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  backgroundColor: 'var(--muted)',
                  color: 'var(--muted-foreground)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSnapshot}
                disabled={saving || !snapshotName.trim()}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  backgroundColor: saving || !snapshotName.trim() ? 'var(--muted)' : 'var(--primary)',
                  color: saving || !snapshotName.trim() ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: saving || !snapshotName.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Saving...' : '💾 Save Snapshot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
