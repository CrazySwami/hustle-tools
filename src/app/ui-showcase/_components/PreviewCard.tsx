'use client';

interface PreviewCardProps {
  id: string;
  type: 'component' | 'page';
  name: string;
  description?: string;
  variants?: string[];
  usesComponents?: string[];
  route?: string;
  file?: string;
  onClick: () => void;
}

/**
 * Preview Card Component
 *
 * Displays a preview card for a component or page in the UI Showcase grid.
 * - Pages: Shows ACTUAL iframe preview of the live route (scaled down)
 * - Components: Shows generated HTML preview matching Sandpack style
 *
 * Hustle Together branding with boxy 90s style.
 * Hover: Solid red shadow (4px 4px 0 #BA0C2F), no border change.
 *
 * Created with Hustle API Dev Tools (v3.9.2)
 */
export function PreviewCard({
  id,
  type,
  name,
  description,
  variants,
  usesComponents,
  route,
  file,
  onClick,
}: PreviewCardProps) {
  // Get page route from file path or prop
  const getPageRoute = () => {
    if (route) return route;
    if (file?.includes('src/app/')) {
      const match = file.match(/src\/app\/(.+?)\/page\.tsx?$/);
      if (match) return `/${match[1]}`;
    }
    return `/${id}`;
  };

  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden border-2 border-black bg-white text-left transition-all hover:shadow-[4px_4px_0_#BA0C2F] focus:outline-none focus:ring-2 focus:ring-[#BA0C2F] focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-900"
    >
      {/* Preview Area */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
        {type === 'page' ? (
          // REAL iframe preview for pages - scaled down to fit
          <iframe
            src={getPageRoute()}
            title={`Preview of ${name}`}
            className="pointer-events-none h-full w-full origin-top-left scale-[0.5]"
            style={{ width: '200%', height: '200%' }}
            loading="lazy"
          />
        ) : (
          // Component preview - generated HTML matching Sandpack style
          <ComponentPreview
            id={id}
            name={name}
            variants={variants}
          />
        )}

        {/* Type Badge */}
        <div className="absolute right-2 top-2">
          <span className="border border-black bg-white px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-black dark:border-gray-600 dark:bg-gray-800 dark:text-white">
            {type === 'component' ? 'Component' : 'Page'}
          </span>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="border-2 border-white bg-[#BA0C2F] px-4 py-2 text-sm font-bold text-white">
            Click to Preview
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col border-t-2 border-black p-4 dark:border-gray-700">
        <h3 className="font-bold text-black group-hover:text-[#BA0C2F] dark:text-white">
          {name}
        </h3>

        {description && (
          <p className="mt-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        )}

        {/* Variants or Used Components */}
        <div className="mt-auto pt-3">
          {variants && variants.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {variants.slice(0, 3).map((variant) => (
                <span
                  key={variant}
                  className="border border-gray-300 bg-gray-50 px-1.5 py-0.5 text-xs text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
                >
                  {variant}
                </span>
              ))}
              {variants.length > 3 && (
                <span className="border border-gray-300 bg-gray-50 px-1.5 py-0.5 text-xs text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  +{variants.length - 3}
                </span>
              )}
            </div>
          )}

          {usesComponents && usesComponents.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Uses: {usesComponents.slice(0, 3).join(', ')}
              {usesComponents.length > 3 && ` +${usesComponents.length - 3}`}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

/**
 * Component Preview
 * Generates a mini HTML preview of the component based on its name/type.
 * Uses the same approach as the modal's Sandpack but renders as inline HTML.
 */
function ComponentPreview({
  id,
  name,
  variants,
}: {
  id: string;
  name: string;
  variants?: string[];
}) {
  const previewHtml = generatePreviewHtml(name, variants?.[0] || 'primary');

  return (
    <iframe
      srcDoc={previewHtml}
      title={`Preview of ${name}`}
      className="pointer-events-none h-full w-full"
      loading="lazy"
      sandbox="allow-scripts"
    />
  );
}

/**
 * Generate HTML preview for component types
 * Matches the same visual style as the modal's Sandpack previews
 */
function generatePreviewHtml(name: string, variant: string): string {
  const lowerName = name.toLowerCase();

  let content = '';

  if (lowerName.includes('button')) {
    content = `
      <div style="display: flex; gap: 8px; align-items: center;">
        <button style="
          padding: 8px 16px;
          font-size: 12px;
          font-weight: bold;
          border: 2px solid #BA0C2F;
          background: #BA0C2F;
          color: white;
          cursor: pointer;
        ">Primary</button>
        <button style="
          padding: 8px 16px;
          font-size: 12px;
          font-weight: bold;
          border: 2px solid #000;
          background: white;
          color: black;
          cursor: pointer;
        ">Secondary</button>
      </div>
    `;
  } else if (lowerName.includes('card')) {
    content = `
      <div style="
        border: 2px solid #000;
        background: white;
        width: 140px;
        font-size: 11px;
      ">
        <div style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Card Title</div>
        <div style="padding: 8px; color: #666;">Card content goes here...</div>
        <div style="padding: 8px; border-top: 1px solid #eee; background: #f8f8f8;">
          <button style="padding: 4px 8px; background: #BA0C2F; color: white; border: none; font-size: 10px; font-weight: bold;">Action</button>
        </div>
      </div>
    `;
  } else if (lowerName.includes('input') || lowerName.includes('field') || lowerName.includes('form')) {
    content = `
      <div style="width: 140px;">
        <label style="display: block; font-size: 11px; font-weight: bold; margin-bottom: 4px;">Label</label>
        <input type="text" placeholder="Enter text..." style="
          width: 100%;
          padding: 6px 8px;
          border: 2px solid #000;
          font-size: 11px;
          box-sizing: border-box;
        " />
        <p style="font-size: 10px; color: #666; margin: 4px 0 0;">Helper text</p>
      </div>
    `;
  } else if (lowerName.includes('table')) {
    content = `
      <div style="border: 2px solid #000; font-size: 10px; width: 160px;">
        <div style="display: flex; background: #f0f0f0; border-bottom: 1px solid #ccc;">
          <div style="flex: 1; padding: 4px 6px; font-weight: bold;">Name</div>
          <div style="flex: 1; padding: 4px 6px; font-weight: bold;">Status</div>
        </div>
        <div style="display: flex; border-bottom: 1px solid #eee;">
          <div style="flex: 1; padding: 4px 6px;">Item 1</div>
          <div style="flex: 1; padding: 4px 6px; color: #22c55e;">Active</div>
        </div>
        <div style="display: flex;">
          <div style="flex: 1; padding: 4px 6px;">Item 2</div>
          <div style="flex: 1; padding: 4px 6px; color: #BA0C2F;">Pending</div>
        </div>
      </div>
    `;
  } else if (lowerName.includes('header') || lowerName.includes('nav')) {
    content = `
      <div style="border: 2px solid #000; background: white; padding: 8px 12px; width: 180px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="width: 24px; height: 12px; background: #BA0C2F;"></div>
          <div style="display: flex; gap: 8px; font-size: 10px;">
            <span>Home</span>
            <span>About</span>
            <span>Contact</span>
          </div>
        </div>
      </div>
    `;
  } else if (lowerName.includes('modal') || lowerName.includes('dialog')) {
    content = `
      <div style="position: relative; width: 140px; height: 100px;">
        <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.3);"></div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          border: 2px solid #000;
          padding: 12px;
          width: 100px;
          font-size: 10px;
        ">
          <div style="font-weight: bold; margin-bottom: 8px;">Modal Title</div>
          <div style="background: #f0f0f0; height: 20px; margin-bottom: 8px;"></div>
          <div style="display: flex; justify-content: flex-end; gap: 4px;">
            <button style="padding: 2px 6px; border: 1px solid #000; background: white; font-size: 9px;">Cancel</button>
            <button style="padding: 2px 6px; background: #BA0C2F; color: white; border: none; font-size: 9px;">Save</button>
          </div>
        </div>
      </div>
    `;
  } else {
    // Generic component preview
    content = `
      <div style="text-align: center; padding: 12px;">
        <div style="
          width: 40px;
          height: 40px;
          margin: 0 auto 8px;
          border: 2px solid #BA0C2F;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
        ">
          <span style="font-size: 16px;">⬛</span>
        </div>
        <div style="font-size: 11px; font-weight: bold;">${name}</div>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #f8f8f8;
            padding: 8px;
          }
        </style>
      </head>
      <body>${content}</body>
    </html>
  `;
}
