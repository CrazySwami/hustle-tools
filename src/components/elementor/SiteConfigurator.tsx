'use client';

import { useState, useEffect } from 'react';
import { SparklesIcon, SettingsIcon, FileTextIcon, UploadIcon, SaveIcon, RefreshCwIcon } from 'lucide-react';

interface SiteConfiguratorProps {
  onApplySettings: (settings: any) => void;
}

interface PageConfig {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  yoast: {
    focusKeyword: string;
    metaTitle: string;
    metaDescription: string;
  };
}

export function SiteConfigurator({ onApplySettings }: SiteConfiguratorProps) {
  const [activeSection, setActiveSection] = useState<'ai' | 'settings' | 'pages'>('ai');
  const [generating, setGenerating] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // AI Generator State
  const [prompt, setPrompt] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [favicon, setFavicon] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState('openai/gpt-5');

  // WordPress Settings State
  const [wpSettings, setWpSettings] = useState({
    siteTitle: '',
    tagline: '',
    adminEmail: '',
    timezone: 'America/New_York',
    dateFormat: 'F j, Y',
    timeFormat: 'g:i a',
    startOfWeek: '0',
    postsPerPage: '10',
    homepageType: 'page', // 'posts' or 'page'
    homepageId: '',
    postsPageId: '',
    permalinkStructure: '/%postname%/'
  });

  // Pages State
  const [pages, setPages] = useState<PageConfig[]>([
    {
      id: 'home',
      title: 'Home',
      slug: 'home',
      content: '',
      excerpt: '',
      yoast: {
        focusKeyword: '',
        metaTitle: '',
        metaDescription: ''
      }
    }
  ]);

  const handleAIGenerate = async () => {
    setGenerating(true);
    try {
      // Convert images to base64 if provided
      let logoData = null;
      let faviconData = null;

      if (logo) {
        logoData = await fileToBase64(logo);
      }
      if (favicon) {
        faviconData = await fileToBase64(favicon);
      }

      // Call AI to generate site configuration
      const response = await fetch('/api/generate-site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          logo: logoData,
          favicon: faviconData,
          model: selectedModel
        })
      });

      const data = await response.json();

      if (data.settings) {
        setWpSettings(data.settings);
      }

      if (data.pages) {
        setPages(data.pages);
      }

      alert('✅ Site configuration generated! Review the settings and pages below.');
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate site configuration');
    } finally {
      setGenerating(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const syncFromWordPress = async () => {
    setSyncing(true);
    try {
      if (typeof window !== 'undefined' && (window as any).getWordPressSettings && (window as any).getWordPressPages) {
        const settings = await (window as any).getWordPressSettings();
        const fetchedPages = await (window as any).getWordPressPages();

        setWpSettings({
          ...wpSettings,
          siteTitle: settings.siteTitle || '',
          tagline: settings.tagline || '',
          adminEmail: settings.adminEmail || '',
          timezone: settings.timezone || 'America/New_York',
          dateFormat: settings.dateFormat || 'F j, Y',
          timeFormat: settings.timeFormat || 'g:i a',
          startOfWeek: String(settings.startOfWeek || '0'),
          postsPerPage: String(settings.postsPerPage || '10'),
          permalinkStructure: settings.permalinkStructure || '/%postname%/'
        });

        if (fetchedPages && fetchedPages.length > 0) {
          setPages(fetchedPages);
        }

        alert('✅ Synced from WordPress!');
      } else {
        alert('Playground not running. Please launch it first.');
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      alert(`Failed to sync: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const applyToPlayground = async () => {
    const config = {
      settings: wpSettings,
      pages
    };

    onApplySettings(config);
  };

  const addPage = () => {
    const newPage: PageConfig = {
      id: `page-${Date.now()}`,
      title: 'New Page',
      slug: 'new-page',
      content: '',
      excerpt: '',
      yoast: {
        focusKeyword: '',
        metaTitle: '',
        metaDescription: ''
      }
    };
    setPages([...pages, newPage]);
  };

  const updatePage = (id: string, updates: Partial<PageConfig>) => {
    setPages(pages.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePage = (id: string) => {
    setPages(pages.filter(p => p.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--background)' }}>
      {/* Section Tabs */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--card)'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setActiveSection('ai')}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            background: activeSection === 'ai' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'var(--muted)',
            color: activeSection === 'ai' ? 'white' : 'var(--foreground)',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <SparklesIcon style={{ width: '16px', height: '16px' }} />
          AI Generator
        </button>
        <button
          onClick={() => setActiveSection('settings')}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            background: activeSection === 'settings' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'var(--muted)',
            color: activeSection === 'settings' ? 'white' : 'var(--foreground)',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <SettingsIcon style={{ width: '16px', height: '16px' }} />
          WordPress Settings
        </button>
        <button
          onClick={() => setActiveSection('pages')}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            background: activeSection === 'pages' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'var(--muted)',
            color: activeSection === 'pages' ? 'white' : 'var(--foreground)',
            cursor: 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <FileTextIcon style={{ width: '16px', height: '16px' }} />
          Pages & SEO ({pages.length})
        </button>
        </div>

        <button
          onClick={syncFromWordPress}
          disabled={syncing}
          style={{
            padding: '10px 16px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: 'var(--background)',
            color: 'var(--foreground)',
            cursor: syncing ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: syncing ? 0.5 : 1
          }}
          title="Pull latest data from WordPress"
        >
          <RefreshCwIcon style={{ width: '14px', height: '14px' }} />
          {syncing ? 'Syncing...' : 'Sync from WP'}
        </button>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {/* AI Generator Section */}
        {activeSection === 'ai' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{
              padding: '24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              color: 'white',
              marginBottom: '24px'
            }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 700 }}>
                ✨ AI Site Generator
              </h2>
              <p style={{ margin: 0, opacity: 0.9 }}>
                Describe your site and let AI generate all settings, pages, and SEO content
              </p>
            </div>

            <div style={{
              padding: '24px',
              background: 'var(--card)',
              borderRadius: '12px',
              border: '1px solid var(--border)'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                  AI Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'var(--background)',
                    color: 'var(--foreground)'
                  }}
                >
                  <option value="openai/gpt-5">GPT-5</option>
                  <option value="openai/gpt-5-mini">GPT-5 Mini</option>
                  <option value="openai/gpt-5-nano">GPT-5 Nano</option>
                  <option value="openai/gpt-5-pro">GPT-5 Pro</option>
                </select>
              </div>

              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                Tell me about your site
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Create a modern photography portfolio site for wedding photographers. Include Home, Portfolio, About, Services, and Contact pages. Brand colors: navy blue and gold."
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '12px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                    Logo (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogo(e.target.files?.[0] || null)}
                    style={{ width: '100%' }}
                  />
                  {logo && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                      {logo.name}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                    Favicon (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFavicon(e.target.files?.[0] || null)}
                    style={{ width: '100%' }}
                  />
                  {favicon && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                      {favicon.name}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleAIGenerate}
                disabled={!prompt || generating}
                style={{
                  marginTop: '24px',
                  width: '100%',
                  padding: '14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: prompt && !generating ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'var(--muted)',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: prompt && !generating ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <SparklesIcon style={{ width: '20px', height: '20px' }} />
                {generating ? 'Generating...' : 'Generate Site Configuration'}
              </button>
            </div>
          </div>
        )}

        {/* WordPress Settings Section */}
        {activeSection === 'settings' && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 700 }}>
              ⚙️ WordPress Settings
            </h2>

            <div style={{
              padding: '24px',
              background: 'var(--card)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              marginBottom: '24px'
            }}>
              <h3 style={{ marginTop: 0, fontSize: '18px', fontWeight: 600 }}>General</h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                  Site Title
                </label>
                <input
                  type="text"
                  value={wpSettings.siteTitle}
                  onChange={(e) => setWpSettings({ ...wpSettings, siteTitle: e.target.value })}
                  placeholder="My Awesome Site"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                  Tagline
                </label>
                <input
                  type="text"
                  value={wpSettings.tagline}
                  onChange={(e) => setWpSettings({ ...wpSettings, tagline: e.target.value })}
                  placeholder="Just another WordPress site"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                  Admin Email
                </label>
                <input
                  type="email"
                  value={wpSettings.adminEmail}
                  onChange={(e) => setWpSettings({ ...wpSettings, adminEmail: e.target.value })}
                  placeholder="admin@example.com"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                  Timezone
                </label>
                <select
                  value={wpSettings.timezone}
                  onChange={(e) => setWpSettings({ ...wpSettings, timezone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px'
                  }}
                >
                  <option value="America/New_York">America/New York (EST/EDT)</option>
                  <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                  <option value="America/Denver">America/Denver (MST/MDT)</option>
                  <option value="America/Los_Angeles">America/Los Angeles (PST/PDT)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>

            <div style={{
              padding: '24px',
              background: 'var(--card)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              marginBottom: '24px'
            }}>
              <h3 style={{ marginTop: 0, fontSize: '18px', fontWeight: 600 }}>Reading</h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                  Homepage displays
                </label>
                <select
                  value={wpSettings.homepageType}
                  onChange={(e) => setWpSettings({ ...wpSettings, homepageType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px'
                  }}
                >
                  <option value="posts">Your latest posts</option>
                  <option value="page">A static page</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                  Blog pages show at most
                </label>
                <input
                  type="number"
                  value={wpSettings.postsPerPage}
                  onChange={(e) => setWpSettings({ ...wpSettings, postsPerPage: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px'
                  }}
                />
              </div>
            </div>

            <div style={{
              padding: '24px',
              background: 'var(--card)',
              borderRadius: '12px',
              border: '1px solid var(--border)'
            }}>
              <h3 style={{ marginTop: 0, fontSize: '18px', fontWeight: 600 }}>Permalinks</h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}>
                  Permalink structure
                </label>
                <select
                  value={wpSettings.permalinkStructure}
                  onChange={(e) => setWpSettings({ ...wpSettings, permalinkStructure: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px'
                  }}
                >
                  <option value="/%postname%/">Post name (recommended)</option>
                  <option value="/%year%/%monthnum%/%day%/%postname%/">Day and name</option>
                  <option value="/%year%/%monthnum%/%postname%/">Month and name</option>
                  <option value="/?p=%post_id%">Plain</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Pages & SEO Section */}
        {activeSection === 'pages' && (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>
                📄 Pages & SEO Manager
              </h2>
              <button
                onClick={addPage}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#10b981',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                + Add Page
              </button>
            </div>

            {pages.map((page) => (
              <div
                key={page.id}
                style={{
                  padding: '24px',
                  background: 'var(--card)',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                    {page.title || 'Untitled Page'}
                  </h3>
                  <button
                    onClick={() => deletePage(page.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ef4444',
                      background: 'transparent',
                      color: '#ef4444',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
                      Page Title
                    </label>
                    <input
                      type="text"
                      value={page.title}
                      onChange={(e) => updatePage(page.id, { title: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
                      Slug
                    </label>
                    <input
                      type="text"
                      value={page.slug}
                      onChange={(e) => updatePage(page.id, { slug: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
                    Content
                  </label>
                  <textarea
                    value={page.content}
                    onChange={(e) => updatePage(page.id, { content: e.target.value })}
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '8px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <details style={{ marginBottom: '16px' }}>
                  <summary style={{
                    padding: '12px',
                    background: '#fef3c7',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}>
                    🔍 Yoast SEO Settings
                  </summary>

                  <div style={{ padding: '16px', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 6px 6px' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
                        Focus Keyword
                      </label>
                      <input
                        type="text"
                        value={page.yoast.focusKeyword}
                        onChange={(e) => updatePage(page.id, {
                          yoast: { ...page.yoast, focusKeyword: e.target.value }
                        })}
                        placeholder="e.g., wedding photography"
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
                        SEO Title
                      </label>
                      <input
                        type="text"
                        value={page.yoast.metaTitle}
                        onChange={(e) => updatePage(page.id, {
                          yoast: { ...page.yoast, metaTitle: e.target.value }
                        })}
                        placeholder="Leave empty to use page title"
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '14px' }}>
                        Meta Description
                      </label>
                      <textarea
                        value={page.yoast.metaDescription}
                        onChange={(e) => updatePage(page.id, {
                          yoast: { ...page.yoast, metaDescription: e.target.value }
                        })}
                        placeholder="Brief description for search engines (155 chars recommended)"
                        style={{
                          width: '100%',
                          minHeight: '60px',
                          padding: '8px',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          resize: 'vertical'
                        }}
                      />
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--muted-foreground)' }}>
                        {page.yoast.metaDescription.length} / 155 characters
                      </p>
                    </div>
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Apply Button (Fixed at bottom) */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border)',
        background: 'var(--card)'
      }}>
        <button
          onClick={applyToPlayground}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(to right, #10b981, #059669)',
            color: 'white',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <SaveIcon style={{ width: '20px', height: '20px' }} />
          Apply to WordPress Playground
        </button>
      </div>
    </div>
  );
}
