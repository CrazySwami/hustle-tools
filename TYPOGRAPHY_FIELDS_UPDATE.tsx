// COMPLETE Typography Fields for StyleKitEditorAdvanced.tsx
// Replace the renderHeadingSection function (lines 812-903) with this:

const renderHeadingSection = (prefix: string) => {
  const headingStyle = getHeadingStyle(prefix as any);

  return (
    <div style={{
      marginBottom: '24px',
      padding: '20px',
      backgroundColor: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '8px'
    }}>
      {/* Preview */}
      <div style={{
        marginBottom: '20px',
        padding: '16px',
        backgroundColor: 'var(--muted)',
        borderRadius: '6px'
      }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px', textTransform: 'uppercase' }}>
          {prefix.toUpperCase()} PREVIEW
        </div>
        <div style={headingStyle}>
          The quick brown fox jumps over the lazy dog
        </div>
        <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>
          {headingStyle.fontFamily?.split(',')[0].replace(/'/g, '')} • {headingStyle.fontSize} • {headingStyle.fontWeight}
        </div>
      </div>

      {/* Font Family */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
          {getStatusIcon(getFieldStatus(s[`${prefix}_typography_font_family`], null))} Font Family
        </label>
        <input
          type="text"
          value={s[`${prefix}_typography_font_family`] || ''}
          onChange={(e) => updateSetting(`${prefix}_typography_font_family`, e.target.value)}
          placeholder="e.g., Roboto, Inter, Arial"
          style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
        />
      </div>

      {/* Font Weight & Text Color */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
            {getStatusIcon(getFieldStatus(s[`${prefix}_typography_font_weight`], null))} Weight
          </label>
          <select
            value={s[`${prefix}_typography_font_weight`] || '400'}
            onChange={(e) => updateSetting(`${prefix}_typography_font_weight`, e.target.value)}
            style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
          >
            <option value="300">300 - Light</option>
            <option value="400">400 - Normal</option>
            <option value="500">500 - Medium</option>
            <option value="600">600 - Semi Bold</option>
            <option value="700">700 - Bold</option>
            <option value="800">800 - Extra Bold</option>
            <option value="900">900 - Black</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>
            {getStatusIcon(getFieldStatus(s[`${prefix}_typography_text_color`], null))} Text Color
          </label>
          <input
            type="color"
            value={s[`${prefix}_typography_text_color`] || '#333333'}
            onChange={(e) => updateSetting(`${prefix}_typography_text_color`, e.target.value)}
            style={{ width: '100%', height: '38px', border: '2px solid var(--border)', borderRadius: '4px', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Responsive Font Sizes */}
      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--muted)/50', borderRadius: '6px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>
          📐 Responsive Font Sizes
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {/* Desktop */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: 'var(--muted-foreground)' }}>🖥️ Desktop</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                type="number"
                value={s[`${prefix}_typography_font_size`]?.size || ''}
                onChange={(e) => updateSize(`${prefix}_typography_font_size`, 'size', parseFloat(e.target.value))}
                placeholder="48"
                style={{ flex: 1, padding: '6px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
              />
              <select
                value={s[`${prefix}_typography_font_size`]?.unit || 'px'}
                onChange={(e) => updateSize(`${prefix}_typography_font_size`, 'unit', e.target.value)}
                style={{ padding: '6px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
              >
                <option value="px">px</option>
                <option value="em">em</option>
                <option value="rem">rem</option>
              </select>
            </div>
          </div>

          {/* Tablet */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: 'var(--muted-foreground)' }}>📱 Tablet</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                type="number"
                value={s[`${prefix}_typography_font_size_tablet`]?.size || ''}
                onChange={(e) => updateSize(`${prefix}_typography_font_size_tablet`, 'size', parseFloat(e.target.value))}
                placeholder="36"
                style={{ flex: 1, padding: '6px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
              />
              <select
                value={s[`${prefix}_typography_font_size_tablet`]?.unit || 'px'}
                onChange={(e) => updateSize(`${prefix}_typography_font_size_tablet`, 'unit', e.target.value)}
                style={{ padding: '6px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
              >
                <option value="px">px</option>
                <option value="em">em</option>
                <option value="rem">rem</option>
              </select>
            </div>
          </div>

          {/* Mobile */}
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: 'var(--muted-foreground)' }}>📲 Mobile</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                type="number"
                value={s[`${prefix}_typography_font_size_mobile`]?.size || ''}
                onChange={(e) => updateSize(`${prefix}_typography_font_size_mobile`, 'size', parseFloat(e.target.value))}
                placeholder="28"
                style={{ flex: 1, padding: '6px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
              />
              <select
                value={s[`${prefix}_typography_font_size_mobile`]?.unit || 'px'}
                onChange={(e) => updateSize(`${prefix}_typography_font_size_mobile`, 'unit', e.target.value)}
                style={{ padding: '6px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
              >
                <option value="px">px</option>
                <option value="em">em</option>
                <option value="rem">rem</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Line Height & Letter Spacing */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Line Height</label>
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              type="number"
              step="0.1"
              value={s[`${prefix}_typography_line_height`]?.size || ''}
              onChange={(e) => updateSize(`${prefix}_typography_line_height`, 'size', parseFloat(e.target.value))}
              placeholder="1.5"
              style={{ flex: 1, padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            />
            <select
              value={s[`${prefix}_typography_line_height`]?.unit || 'em'}
              onChange={(e) => updateSize(`${prefix}_typography_line_height`, 'unit', e.target.value)}
              style={{ padding: '8px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            >
              <option value="em">em</option>
              <option value="px">px</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Letter Spacing</label>
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              type="number"
              step="0.1"
              value={s[`${prefix}_typography_letter_spacing`]?.size || ''}
              onChange={(e) => updateSize(`${prefix}_typography_letter_spacing`, 'size', parseFloat(e.target.value))}
              placeholder="0"
              style={{ flex: 1, padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            />
            <select
              value={s[`${prefix}_typography_letter_spacing`]?.unit || 'px'}
              onChange={(e) => updateSize(`${prefix}_typography_letter_spacing`, 'unit', e.target.value)}
              style={{ padding: '8px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            >
              <option value="px">px</option>
              <option value="em">em</option>
            </select>
          </div>
        </div>
      </div>

      {/* Text Transform */}
      <div style={{ marginBottom: '0' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600 }}>Text Transform</label>
        <select
          value={s[`${prefix}_typography_text_transform`] || 'none'}
          onChange={(e) => updateSetting(`${prefix}_typography_text_transform`, e.target.value)}
          style={{ width: '100%', padding: '8px 10px', fontSize: '13px', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
        >
          <option value="none">None</option>
          <option value="uppercase">UPPERCASE</option>
          <option value="lowercase">lowercase</option>
          <option value="capitalize">Capitalize</option>
        </select>
      </div>
    </div>
  );
};

