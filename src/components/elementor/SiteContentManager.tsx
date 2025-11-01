'use client';

import { useState, useEffect } from 'react';
import { SettingsIcon, FileTextIcon, UploadIcon, DownloadIcon, SaveIcon, TrashIcon, PlusIcon } from 'lucide-react';
import { OptionsButton } from '@/components/ui/OptionsButton';
import { BottomNav } from '@/components/ui/BottomNav';

interface SiteContentManagerProps {
  onPush: (config: any) => void;
  onPull: () => Promise<any>;
  playgroundReady?: boolean;
  chatVisible?: boolean;
  setChatVisible?: (visible: boolean) => void;
  tabBarVisible?: boolean;
  setTabBarVisible?: (visible: boolean) => void;
  isTabVisible?: boolean;
}

interface PageData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: 'publish' | 'draft' | 'private' | 'pending' | 'future';
  date: string;
  featuredImage?: string;
  author?: string;
  parentPage?: string;
  template?: string;
  menuOrder?: number;
  allowComments?: boolean;
  allowPingbacks?: boolean;
  customCSS?: string;
  yoast: {
    focusKeyword: string;
    metaTitle: string;
    metaDescription: string;
    canonicalUrl?: string;
    metaRobotsNoindex?: boolean;
    metaRobotsNofollow?: boolean;
  };
}

export function SiteContentManager({ onPush, onPull, playgroundReady, chatVisible, setChatVisible, tabBarVisible, setTabBarVisible, isTabVisible = true }: SiteContentManagerProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'pages'>('settings');
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // WordPress Settings State
  const [settings, setSettings] = useState({
    siteTitle: '',
    tagline: '',
    adminEmail: '',
    timezone: 'America/New_York',
    dateFormat: 'F j, Y',
    timeFormat: 'g:i a',
    startOfWeek: '0',
    postsPerPage: '10',
    permalinkStructure: '/%postname%/',
    siteIcon: '',
    blogPublic: '1'
  });

  // Pages State
  const [pages, setPages] = useState<PageData[]>([]);
  const [selectedPage, setSelectedPage] = useState<PageData | null>(null);
  const [editingPage, setEditingPage] = useState(false);

  // Auto-sync from WordPress when playground is ready
  useEffect(() => {
    if (playgroundReady) {
      console.log('🔄 SiteContentManager: Playground ready, auto-pulling WordPress settings...');
      handlePull();
    }
  }, [playgroundReady]);

  const handlePull = async () => {
    setLoading(true);
    try {
      const data = await onPull();
      if (data.settings) {
        setSettings(data.settings);
      }
      if (data.pages) {
        setPages(data.pages);
      }
    } catch (error) {
      console.error('Pull error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePush = () => {
    onPush({ settings, pages });
  };

  const addNewPage = () => {
    const newPage: PageData = {
      id: `new-${Date.now()}`,
      title: 'New Page',
      slug: 'new-page',
      content: '',
      excerpt: '',
      status: 'draft',
      date: new Date().toISOString(),
      author: 'admin',
      parentPage: '0',
      template: 'default',
      menuOrder: 0,
      allowComments: true,
      allowPingbacks: true,
      customCSS: '',
      yoast: {
        focusKeyword: '',
        metaTitle: '',
        metaDescription: '',
        canonicalUrl: '',
        metaRobotsNoindex: false,
        metaRobotsNofollow: false
      }
    };
    setPages([...pages, newPage]);
    setSelectedPage(newPage);
    setEditingPage(true);
  };

  const deletePage = (id: string) => {
    if (confirm('Delete this page?')) {
      setPages(pages.filter(p => p.id !== id));
      if (selectedPage?.id === id) {
        setSelectedPage(null);
        setEditingPage(false);
      }
    }
  };

  const updatePage = (id: string, updates: Partial<PageData>) => {
    setPages(pages.map(p => p.id === id ? { ...p, ...updates } : p));
    if (selectedPage?.id === id) {
      setSelectedPage({ ...selectedPage, ...updates });
    }
  };

  return (
    <div className="tab-panel" style={{ position: 'relative' }}>
      {/* Content Area */}
      <div style={{ flex: 1, overflow: 'auto', background: 'var(--background)' }}>
        {activeTab === 'settings' && (
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>
            {/* General Settings */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--foreground)' }}>
                General
              </h3>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--muted-foreground)' }}>
                    Site Title
                  </label>
                  <input
                    type="text"
                    value={settings.siteTitle}
                    onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      background: 'var(--card)',
                      color: 'var(--foreground)',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--muted-foreground)' }}>
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={settings.tagline}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      background: 'var(--card)',
                      color: 'var(--foreground)',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--muted-foreground)' }}>
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={settings.adminEmail}
                    onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      background: 'var(--card)',
                      color: 'var(--foreground)',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Localization */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--foreground)' }}>
                Localization
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--muted-foreground)' }}>
                    Timezone
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      background: 'var(--card)',
                      color: 'var(--foreground)',
                      fontSize: '14px'
                    }}
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--muted-foreground)' }}>
                    Date Format
                  </label>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      background: 'var(--card)',
                      color: 'var(--foreground)',
                      fontSize: '14px'
                    }}
                  >
                    <option value="F j, Y">January 1, 2025</option>
                    <option value="m/d/Y">01/01/2025</option>
                    <option value="d/m/Y">01/01/2025</option>
                    <option value="Y-m-d">2025-01-01</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--muted-foreground)' }}>
                    Time Format
                  </label>
                  <select
                    value={settings.timeFormat}
                    onChange={(e) => setSettings({ ...settings, timeFormat: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      background: 'var(--card)',
                      color: 'var(--foreground)',
                      fontSize: '14px'
                    }}
                  >
                    <option value="g:i a">12-hour (1:30 pm)</option>
                    <option value="H:i">24-hour (13:30)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reading Settings */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--foreground)' }}>
                Reading
              </h3>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--muted-foreground)' }}>
                    Posts per page
                  </label>
                  <input
                    type="number"
                    value={settings.postsPerPage}
                    onChange={(e) => setSettings({ ...settings, postsPerPage: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      background: 'var(--card)',
                      color: 'var(--foreground)',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--muted-foreground)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.blogPublic === '0'}
                      onChange={(e) => setSettings({ ...settings, blogPublic: e.target.checked ? '0' : '1' })}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    Discourage search engines from indexing this site
                  </label>
                </div>
              </div>
            </div>

            {/* Site Identity */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--foreground)' }}>
                Site Identity
              </h3>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--muted-foreground)' }}>
                  Site Icon URL
                </label>
                <input
                  type="text"
                  value={settings.siteIcon}
                  onChange={(e) => setSettings({ ...settings, siteIcon: e.target.value })}
                  placeholder="https://example.com/icon.png"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    background: 'var(--card)',
                    color: 'var(--foreground)',
                    fontSize: '14px'
                  }}
                />
                <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
                  Appears in browser tabs and bookmarks. Recommended size: 512×512px
                </div>
              </div>
            </div>

            {/* Permalinks */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: 'var(--foreground)' }}>
                Permalinks
              </h3>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--muted-foreground)' }}>
                  Permalink Structure
                </label>
                <select
                  value={settings.permalinkStructure}
                  onChange={(e) => setSettings({ ...settings, permalinkStructure: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    background: 'var(--card)',
                    color: 'var(--foreground)',
                    fontSize: '14px'
                  }}
                >
                  <option value="/%postname%/">Post name (/sample-post/)</option>
                  <option value="/%year%/%monthnum%/%postname%/">Day and name (/2025/01/sample-post/)</option>
                  <option value="/%category%/%postname%/">Category and name (/category/sample-post/)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pages' && (
          <div style={{ height: '100%', display: 'flex' }}>
            {/* Pages Table */}
            <div style={{ flex: editingPage ? '0 0 400px' : '1', borderRight: editingPage ? '1px solid var(--border)' : 'none', overflow: 'auto' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', background: 'var(--muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>All Pages</h3>
                <button
                  onClick={addNewPage}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '13px' }}
                >
                  <PlusIcon size={14} />
                  Add New
                </button>
              </div>

              <table style={{ width: '100%', fontSize: '13px' }}>
                <thead style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--muted-foreground)' }}>Title</th>
                    <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--muted-foreground)' }}>Slug</th>
                    <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--muted-foreground)' }}>Status</th>
                    <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--muted-foreground)' }}>Date</th>
                    <th style={{ padding: '8px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--muted-foreground)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((page) => (
                    <tr
                      key={page.id}
                      onClick={() => {
                        setSelectedPage(page);
                        setEditingPage(true);
                      }}
                      style={{
                        cursor: 'pointer',
                        background: selectedPage?.id === page.id ? 'var(--muted)' : 'transparent',
                        borderBottom: '1px solid var(--border)'
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 500 }}>{page.title}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--muted-foreground)', fontFamily: 'monospace', fontSize: '12px' }}>/{page.slug}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          background: page.status === 'publish' ? '#10b98133' : '#f59e0b33',
                          color: page.status === 'publish' ? '#10b981' : '#f59e0b'
                        }}>
                          {page.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--muted-foreground)', fontSize: '12px' }}>
                        {new Date(page.date).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePage(page.id);
                          }}
                          style={{
                            padding: '4px 8px',
                            border: 'none',
                            background: 'transparent',
                            color: '#ef4444',
                            cursor: 'pointer',
                            borderRadius: '4px'
                          }}
                        >
                          <TrashIcon size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {pages.length === 0 && (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                  <FileTextIcon size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
                  <p style={{ margin: 0 }}>No pages yet. Click "Add New" to create your first page.</p>
                </div>
              )}
            </div>

            {/* Page Editor */}
            {editingPage && selectedPage && (
              <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
                <div style={{ maxWidth: '800px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Edit Page</h3>
                    <button
                      onClick={() => setEditingPage(false)}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid var(--border)',
                        background: 'var(--background)',
                        color: 'var(--foreground)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      Close
                    </button>
                  </div>

                  <div style={{ display: 'grid', gap: '20px' }}>
                    {/* Title */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--muted-foreground)' }}>
                        Title
                      </label>
                      <input
                        type="text"
                        value={selectedPage.title}
                        onChange={(e) => updatePage(selectedPage.id, { title: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          background: 'var(--card)',
                          color: 'var(--foreground)',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    {/* Slug */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--muted-foreground)' }}>
                        Slug
                      </label>
                      <input
                        type="text"
                        value={selectedPage.slug}
                        onChange={(e) => updatePage(selectedPage.id, { slug: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          background: 'var(--card)',
                          color: 'var(--foreground)',
                          fontSize: '14px',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>

                    {/* Status & Date */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--muted-foreground)' }}>
                          Status
                        </label>
                        <select
                          value={selectedPage.status}
                          onChange={(e) => updatePage(selectedPage.id, { status: e.target.value as any })}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            background: 'var(--card)',
                            color: 'var(--foreground)',
                            fontSize: '14px'
                          }}
                        >
                          <option value="publish">Published</option>
                          <option value="draft">Draft</option>
                          <option value="private">Private</option>
                          <option value="pending">Pending Review</option>
                          <option value="future">Scheduled</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--muted-foreground)' }}>
                          Date
                        </label>
                        <input
                          type="datetime-local"
                          value={selectedPage.date.slice(0, 16)}
                          onChange={(e) => updatePage(selectedPage.id, { date: new Date(e.target.value).toISOString() })}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            background: 'var(--card)',
                            color: 'var(--foreground)',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>

                    {/* Featured Image */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--muted-foreground)' }}>
                        Featured Image URL
                      </label>
                      <input
                        type="url"
                        value={selectedPage.featuredImage || ''}
                        onChange={(e) => updatePage(selectedPage.id, { featuredImage: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          background: 'var(--card)',
                          color: 'var(--foreground)',
                          fontSize: '14px'
                        }}
                      />
                    </div>

                    {/* Page Attributes */}
                    <div style={{ padding: '20px', background: 'var(--muted)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600 }}>Page Attributes</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--muted-foreground)' }}>
                            Author
                          </label>
                          <input
                            type="text"
                            value={selectedPage.author || ''}
                            onChange={(e) => updatePage(selectedPage.id, { author: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              background: 'var(--card)',
                              color: 'var(--foreground)',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--muted-foreground)' }}>
                            Template
                          </label>
                          <select
                            value={selectedPage.template || 'default'}
                            onChange={(e) => updatePage(selectedPage.id, { template: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              background: 'var(--card)',
                              color: 'var(--foreground)',
                              fontSize: '14px'
                            }}
                          >
                            <option value="default">Default Template</option>
                            <option value="elementor_canvas">Elementor Canvas</option>
                            <option value="elementor_header_footer">Elementor Full Width</option>
                            <option value="page-fullwidth">Full Width</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--muted-foreground)' }}>
                            Parent Page ID
                          </label>
                          <input
                            type="text"
                            value={selectedPage.parentPage || ''}
                            onChange={(e) => updatePage(selectedPage.id, { parentPage: e.target.value })}
                            placeholder="0 for no parent"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              background: 'var(--card)',
                              color: 'var(--foreground)',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--muted-foreground)' }}>
                            Menu Order
                          </label>
                          <input
                            type="number"
                            value={selectedPage.menuOrder || 0}
                            onChange={(e) => updatePage(selectedPage.id, { menuOrder: parseInt(e.target.value) })}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              background: 'var(--card)',
                              color: 'var(--foreground)',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Discussion */}
                    <div style={{ padding: '20px', background: 'var(--muted)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600 }}>Discussion</h4>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--muted-foreground)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={selectedPage.allowComments ?? true}
                            onChange={(e) => updatePage(selectedPage.id, { allowComments: e.target.checked })}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          Allow comments
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--muted-foreground)', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={selectedPage.allowPingbacks ?? true}
                            onChange={(e) => updatePage(selectedPage.id, { allowPingbacks: e.target.checked })}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          Allow pingbacks & trackbacks
                        </label>
                      </div>
                    </div>

                    {/* Content */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--muted-foreground)' }}>
                        Content
                      </label>
                      <textarea
                        value={selectedPage.content}
                        onChange={(e) => updatePage(selectedPage.id, { content: e.target.value })}
                        style={{
                          width: '100%',
                          minHeight: '200px',
                          padding: '8px 12px',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          background: 'var(--card)',
                          color: 'var(--foreground)',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    {/* Excerpt */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--muted-foreground)' }}>
                        Excerpt
                      </label>
                      <textarea
                        value={selectedPage.excerpt}
                        onChange={(e) => updatePage(selectedPage.id, { excerpt: e.target.value })}
                        style={{
                          width: '100%',
                          minHeight: '80px',
                          padding: '8px 12px',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          background: 'var(--card)',
                          color: 'var(--foreground)',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    {/* Yoast SEO */}
                    <div style={{ padding: '20px', background: 'var(--muted)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600 }}>Yoast SEO</h4>

                      <div style={{ display: 'grid', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--muted-foreground)' }}>
                            Focus Keyword
                          </label>
                          <input
                            type="text"
                            value={selectedPage.yoast.focusKeyword}
                            onChange={(e) => updatePage(selectedPage.id, {
                              yoast: { ...selectedPage.yoast, focusKeyword: e.target.value }
                            })}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              background: 'var(--card)',
                              color: 'var(--foreground)',
                              fontSize: '14px'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--muted-foreground)' }}>
                            SEO Title (50-60 chars)
                          </label>
                          <input
                            type="text"
                            value={selectedPage.yoast.metaTitle}
                            onChange={(e) => updatePage(selectedPage.id, {
                              yoast: { ...selectedPage.yoast, metaTitle: e.target.value }
                            })}
                            maxLength={60}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              background: 'var(--card)',
                              color: 'var(--foreground)',
                              fontSize: '14px'
                            }}
                          />
                          <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
                            {selectedPage.yoast.metaTitle.length}/60 characters
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--muted-foreground)' }}>
                            Meta Description (150-160 chars)
                          </label>
                          <textarea
                            value={selectedPage.yoast.metaDescription}
                            onChange={(e) => updatePage(selectedPage.id, {
                              yoast: { ...selectedPage.yoast, metaDescription: e.target.value }
                            })}
                            maxLength={160}
                            style={{
                              width: '100%',
                              minHeight: '60px',
                              padding: '8px 12px',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              background: 'var(--card)',
                              color: 'var(--foreground)',
                              fontSize: '14px',
                              fontFamily: 'inherit',
                              resize: 'vertical'
                            }}
                          />
                          <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
                            {selectedPage.yoast.metaDescription.length}/160 characters
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--muted-foreground)' }}>
                            Canonical URL
                          </label>
                          <input
                            type="url"
                            value={selectedPage.yoast.canonicalUrl || ''}
                            onChange={(e) => updatePage(selectedPage.id, {
                              yoast: { ...selectedPage.yoast, canonicalUrl: e.target.value }
                            })}
                            placeholder="https://example.com/page"
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              background: 'var(--card)',
                              color: 'var(--foreground)',
                              fontSize: '14px'
                            }}
                          />
                        </div>

                        <div style={{ display: 'grid', gap: '12px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--muted-foreground)', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={selectedPage.yoast.metaRobotsNoindex ?? false}
                              onChange={(e) => updatePage(selectedPage.id, {
                                yoast: { ...selectedPage.yoast, metaRobotsNoindex: e.target.checked }
                              })}
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            Noindex (discourage search engines from indexing this page)
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500, color: 'var(--muted-foreground)', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={selectedPage.yoast.metaRobotsNofollow ?? false}
                              onChange={(e) => updatePage(selectedPage.id, {
                                yoast: { ...selectedPage.yoast, metaRobotsNofollow: e.target.checked }
                              })}
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            Nofollow (don't follow links on this page)
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Custom CSS */}
                    <div style={{ padding: '20px', background: 'var(--muted)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600 }}>Additional CSS</h4>
                      <textarea
                        value={selectedPage.customCSS || ''}
                        onChange={(e) => updatePage(selectedPage.id, { customCSS: e.target.value })}
                        placeholder=".my-custom-class { color: blue; }"
                        style={{
                          width: '100%',
                          minHeight: '100px',
                          padding: '8px 12px',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          background: 'var(--card)',
                          color: 'var(--foreground)',
                          fontSize: '13px',
                          fontFamily: 'monospace',
                          resize: 'vertical'
                        }}
                      />
                      <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
                        Custom CSS specific to this page
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation with Options Button */}
      <BottomNav
        pageActions={
          <OptionsButton
            isMobile={isMobile}
            isVisible={isTabVisible}
            options={[
              // Settings/Pages toggle
              {
                label: activeTab === 'settings' ? `📄 Switch to Pages (${pages.length})` : '⚙️ Switch to Settings',
                onClick: () => setActiveTab(activeTab === 'settings' ? 'pages' : 'settings'),
                divider: true
              },
              // Pull from WordPress
              {
                label: '⬇️ Pull from WordPress',
                onClick: handlePull,
                disabled: loading
              },
              // Push to WordPress
              {
                label: '⬆️ Push to WordPress',
                onClick: handlePush,
                disabled: loading,
                divider: true
              },
              // Chat toggle
              ...(setChatVisible ? [{
                label: chatVisible ? 'Hide Chat' : 'Show Chat',
                onClick: () => setChatVisible(!chatVisible),
                type: 'toggle' as const,
                active: chatVisible
              }] : []),
              // Tab bar toggle
              ...(setTabBarVisible ? [{
                label: tabBarVisible ? 'Hide Tab Bar' : 'Show Tab Bar',
                onClick: () => setTabBarVisible(!tabBarVisible),
                type: 'toggle' as const,
                active: tabBarVisible
              }] : [])
            ]}
          />
        }
      />
    </div>
  );
}
