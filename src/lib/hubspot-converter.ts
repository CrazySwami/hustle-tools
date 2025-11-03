/**
 * HubSpot HTML to HubL Converter
 *
 * Programmatically converts HTML into HubL-ready module code with tokenized fields.
 * Based on the converter from src/components/hubspot/hubspot-module-converter.tsx
 *
 * Usage:
 * ```typescript
 * const result = convertHtmlToHubL(htmlString, {
 *   kind: 'email', // or 'page'
 *   moduleLabel: 'My Module',
 *   generateStyles: true
 * });
 * console.log(result.moduleHtml); // HubL-tokenized HTML
 * console.log(result.fields); // Field definitions for HubSpot
 * console.log(result.warnings); // Email compatibility warnings
 * ```
 */

export type ModuleKind = 'page' | 'email';

export interface HubSpotField {
  name: string;
  label: string;
  type: string;
  default?: any;
  group?: string;
  children?: any[];
}

export interface ConversionOptions {
  kind?: ModuleKind;
  moduleLabel?: string;
  generateStyles?: boolean;
  includePageCssBlock?: boolean;
  enableRepeater?: boolean;
}

export interface ConversionResult {
  moduleHtml: string;
  fields: HubSpotField[];
  instructions: string[];
  warnings: string[];
}

// ---------- Utilities ----------
const slug = (s: string) =>
  (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/__+/g, "_")
    .slice(0, 60) || "field";

const RESERVED = new Set([
  "body",
  "content",
  "module",
  "name",
  "id",
  "class",
  "type",
  "style",
  "image",
  "url",
  "link",
  "email",
  "html",
  "css",
  "script",
  "value",
  "label",
  "path",
  "global",
  "theme",
  "context",
]);

const safe = (n: string) => (RESERVED.has(n) ? `field_${n}` : n);

const uniqueName = (base: string, used: Set<string>) => {
  const b0 = slug(base || "field");
  const b = safe(b0);
  if (!used.has(b)) {
    used.add(b);
    return b;
  }
  let i = 2;
  while (used.has(`${b}_${i}`)) i++;
  const f = `${b}_${i}`;
  used.add(f);
  return f;
};

const parseStyle = (styleStr = "") => {
  const out: Record<string, string> = {};
  styleStr.split(";").forEach((pair) => {
    const [rawK, rawV] = pair.split(":");
    if (!rawK || !rawV) return;
    const k = rawK.trim().toLowerCase();
    const v = rawV.trim();
    if (!k) return;
    out[k] = v;
  });
  return out;
};

const styleToString = (obj: Record<string, string>) =>
  Object.entries(obj)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");

// Basic detection of card-like repeaters (3+ similar siblings)
function detectRepeater(root: HTMLElement) {
  const candidates = Array.from(root.querySelectorAll("section,div,ul,ol")).filter(
    (p) => p.children && p.children.length >= 3,
  );
  for (const parent of candidates) {
    const kids = Array.from(parent.children);
    const tag = kids[0].tagName;
    if (!kids.every((k) => k.tagName === tag)) continue;
    const proto = kids[0].cloneNode(true) as HTMLElement;
    const similar = kids.every((k) => k.querySelector("h1,h2,h3,p,img,a"));
    if (!similar) continue;
    return { parent, items: kids, template: proto };
  }
  return null;
}

/**
 * Convert HTML to HubL-ready module code
 *
 * @param rawHtml - The HTML string to convert
 * @param opts - Conversion options
 * @returns Conversion result with HubL HTML, fields, instructions, and warnings
 */
export function convertHtmlToHubL(
  rawHtml: string,
  opts?: ConversionOptions
): ConversionResult {
  const {
    kind = "page",
    moduleLabel = "Converted Section",
    generateStyles = true,
    includePageCssBlock = true,
    enableRepeater = true,
  } = opts || {};

  // Only run in browser environment
  if (typeof window === 'undefined') {
    throw new Error('convertHtmlToHubL can only be called in the browser');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");
  const root = doc.body;

  const fields: HubSpotField[] = [];
  const used = new Set<string>();
  const warnings: string[] = [];

  const addField = (f: HubSpotField) => {
    fields.push(f);
    return f;
  };
  const addColor = (label: string, def: string, nameHint: string) => {
    const name = uniqueName(nameHint || label, used);
    return addField({ name, label, type: "color", default: def, group: "Styles" });
  };
  const addNumber = (label: string, def: number, nameHint: string) => {
    const name = uniqueName(nameHint || label, used);
    return addField({ name, label, type: "number", default: def, group: "Styles" });
  };

  // -------- Content mapping
  let headingIndex = 0;
  root.querySelectorAll("h1,h2").forEach((el) => {
    const label = headingIndex === 0 ? "Title" : `Title ${headingIndex + 1}`;
    const name = uniqueName(label, used);
    addField({ name, label, type: "text", default: el.textContent?.trim(), group: "Content" });
    el.textContent = `{{ module.${name} }}`;
    headingIndex++;
  });

  root.querySelectorAll("p,li,blockquote").forEach((el) => {
    if (el.innerHTML.includes("{{ module.")) return;
    const label = el.tagName === "LI" ? "List Item" : "Rich Body";
    const name = uniqueName(label === "Rich Body" ? "rich_body" : label, used);
    addField({ name, label, type: "richtext", default: el.innerHTML.trim(), group: "Content" });
    el.innerHTML = `{{ module.${name} }}`;
  });

  root.querySelectorAll("img").forEach((img, i) => {
    const label = i === 0 ? "Image" : `Image ${i + 1}`;
    const name = uniqueName(label, used);
    addField({ name, label, type: "image", default: img.getAttribute('src'), group: "Images" });
    img.setAttribute('src', `{{ module.${name}.src }}`);
    img.setAttribute('alt', `{{ module.${name}.alt }}`);
  });

  root.querySelectorAll("a").forEach((a) => {
    const isButton = /\b(btn|button)\b/i.test(a.className || "");
    const textLabel = isButton ? "Button Text" : "Link Text";
    const urlLabel = isButton ? "Button URL" : "Link URL";
    const textName = uniqueName(textLabel, used);
    const urlName = uniqueName(urlLabel, used);
    addField({ name: textName, label: textLabel, type: "text", default: a.textContent?.trim(), group: "Links & CTAs" });
    addField({
      name: urlName,
      label: urlLabel,
      type: "url",
      default: a.getAttribute("href") || "#",
      group: "Links & CTAs",
    });
    a.textContent = `{{ module.${textName} }}`;
    a.setAttribute("href", `{{ module.${urlName} }}`);
  });

  // -------- Repeater detection (cards)
  if (enableRepeater) {
    const rep = detectRepeater(root);
    if (rep) {
      const groupName = uniqueName("items", used);
      const title = uniqueName("item_title", used);
      const body = uniqueName("item_body", used);
      const image = uniqueName("item_image", used);
      const linkText = uniqueName("item_link_text", used);
      const linkUrl = uniqueName("item_link_url", used);

      // Replace first item as the template
      const t = rep.template;
      const h = t.querySelector("h1,h2,h3");
      if (h) h.textContent = `{{ item.${title} }}`;
      const p = t.querySelector("p");
      if (p) p.innerHTML = `{{ item.${body} }}`;
      const im = t.querySelector("img");
      if (im) {
        im.setAttribute('src', `{{ item.${image}.src }}`);
        im.setAttribute('alt', `{{ item.${image}.alt }}`);
      }
      const a = t.querySelector("a");
      if (a) {
        a.textContent = `{{ item.${linkText} }}`;
        a.setAttribute("href", `{{ item.${linkUrl} }}`);
      }

      // Swap original children with HubL loop
      rep.parent.innerHTML = `{% for item in module.${groupName} %}` + t.outerHTML + `{% endfor %}`;

      // Define repeater field structure (for instructions/UI only)
      addField({
        name: groupName,
        label: "Items",
        type: "repeater",
        group: "Content",
        children: [
          { name: title, label: "Item Title", type: "text" },
          { name: body, label: "Item Body", type: "richtext" },
          { name: image, label: "Item Image", type: "image" },
          { name: linkText, label: "Item Link Text", type: "text" },
          { name: linkUrl, label: "Item Link URL", type: "url" },
        ],
      });
    }
  }

  // -------- Style tokenization
  const styleTokens: Record<string, string> = {};
  if (generateStyles) {
    // Root styles
    const rootEl = root.firstElementChild || root;
    const rootStyle = parseStyle(rootEl.getAttribute("style") || "");

    if (rootStyle["background"] || rootStyle["background-color"]) {
      const c = rootStyle["background-color"] || rootStyle["background"];
      const f = addColor("Background Color", c, "styles_bg_color");
      styleTokens.bg = f.name;
      if (kind === "email") {
        if (rootStyle["background-color"]) rootStyle["background-color"] = `{{ module.${f.name}.color }}`;
        else rootStyle["background"] = `{{ module.${f.name}.color }}`;
      }
    }
    if (rootStyle["color"]) {
      const f = addColor("Text Color", rootStyle["color"], "styles_text_color");
      styleTokens.text = f.name;
      if (kind === "email") rootStyle["color"] = `{{ module.${f.name}.color }}`;
    }
    if (rootStyle["border-radius"]) {
      const val = rootStyle["border-radius"].replace("px", "");
      const f = addNumber("Border Radius (px)", Number.parseInt(val, 10) || 0, "styles_radius");
      styleTokens.radius = f.name;
      if (kind === "email") rootStyle["border-radius"] = `{{ module.${f.name} }}px`;
    }
    // Basic padding (treat as y/x for simplicity)
    if (rootStyle["padding"]) {
      const parts = rootStyle["padding"].split(" ").map((s) => Number.parseInt(s, 10) || 0);
      const py = parts[0] || 0;
      const px = parts[1] || parts[0] || 0;
      const fy = addNumber("Padding Y (px)", py, "styles_pad_y");
      const fx = addNumber("Padding X (px)", px, "styles_pad_x");
      styleTokens.padY = fy.name;
      styleTokens.padX = fx.name;
      if (kind === "email") rootStyle["padding"] = `{{ module.${fy.name} }}px {{ module.${fx.name} }}px`;
    }
    rootEl.setAttribute("style", styleToString(rootStyle));

    // Button styles
    const btn = root.querySelector("a.btn");
    if (btn) {
      const s = parseStyle(btn.getAttribute("style") || "");
      if (s["background"]) {
        const f = addColor("Button Background", s["background"], "styles_btn_bg");
        styleTokens.btnBg = f.name;
        if (kind === "email") s["background"] = `{{ module.${f.name}.color }}`;
      }
      if (s["color"]) {
        const f = addColor("Button Text Color", s["color"], "styles_btn_text");
        styleTokens.btnText = f.name;
        if (kind === "email") s["color"] = `{{ module.${f.name}.color }}`;
      }
      if (s["border-radius"]) {
        const val = Number.parseInt(s["border-radius"], 10) || 0;
        const f = addNumber("Button Radius (px)", val, "styles_btn_radius");
        styleTokens.btnRadius = f.name;
        if (kind === "email") s["border-radius"] = `{{ module.${f.name} }}px`;
      }
      if (s["padding"]) {
        const parts = s["padding"].split(" ").map((x) => Number.parseInt(x, 10) || 0);
        const py = parts[0] || 0;
        const px = parts[1] || parts[0] || 0;
        const fy = addNumber("Button Pad Y (px)", py, "styles_btn_pad_y");
        const fx = addNumber("Button Pad X (px)", px, "styles_btn_pad_x");
        if (kind === "email") s["padding"] = `{{ module.${fy.name} }}px {{ module.${fx.name} }}px`;
      }
      btn.setAttribute("style", styleToString(s));
    }
  }

  // -------- Email warnings
  if (kind === "email") {
    if (root.querySelector("style")) warnings.push("Email modules cannot rely on <style> tags.");
    if (root.querySelector("script")) warnings.push("Scripts are not supported in email modules.");
    if (/display\s*:\s*(grid|flex)/i.test(root.innerHTML)) warnings.push("Grid/Flex not supported in email.");
    if (/@media/i.test(root.innerHTML)) warnings.push("Many clients ignore @media queries.");
    if (root.querySelector("form")) warnings.push("Forms are unsupported in email modules.");
    if (root.querySelector("video,audio,iframe")) warnings.push("Media embeds are unsupported in email.");
    if (/background-image/i.test(root.innerHTML)) warnings.push("Background images are unreliable in email.");
    if (/@font-face|<link/i.test(root.innerHTML)) warnings.push("Web fonts are not supported.");
    if (/position\s*:\s*(fixed|absolute)/i.test(root.innerHTML))
      warnings.push("Absolute/fixed positioning fails in email.");
  }

  // -------- Final HubL HTML + optional page CSS block
  const inner = root.innerHTML.trim();
  let moduleHtml = `<section class='hs-converted-module'>${inner}</section>`;

  if (kind === "page" && generateStyles && includePageCssBlock) {
    const cssLines = [];
    cssLines.push(
      ".hs-converted-module{\n" +
        (styleTokens.bg ? `  background: {{ module.${styleTokens.bg}.color }};\n` : "") +
        (styleTokens.text ? `  color: {{ module.${styleTokens.text}.color }};\n` : "") +
        (styleTokens.padY
          ? `  padding: {{ module.${styleTokens.padY} }}px {{ module.${styleTokens.padX} }}px;\n`
          : "") +
        (styleTokens.radius ? `  border-radius: {{ module.${styleTokens.radius} }}px;\n` : "") +
        "}\n",
    );
    if (styleTokens.btnBg || styleTokens.btnText || styleTokens.btnRadius) {
      cssLines.push(
        ".hs-converted-module a.btn{\n" +
          (styleTokens.btnBg ? `  background: {{ module.${styleTokens.btnBg}.color }};\n` : "") +
          (styleTokens.btnText ? `  color: {{ module.${styleTokens.btnText}.color }};\n` : "") +
          (styleTokens.btnRadius ? `  border-radius: {{ module.${styleTokens.btnRadius} }}px;\n` : "") +
          "}\n",
      );
    }

    const cssBlock = `\n{% require_css %}\n<style>\n{% scope_css %}\n${cssLines.join("\n")}\n{% end_scope_css %}\n</style>\n{% end_require_css %}`;
    moduleHtml += cssBlock;
  }

  // -------- Instructions
  const instructions = [
    `Create a Custom Module labeled "${moduleLabel}" in Design Manager.`,
    `Paste the Module HTML below into the module's HTML + HubL editor.`,
    `Create fields as listed (type & name matter). Use groups to organize Content, Images, Links & CTAs, Styles.`,
    kind === "page"
      ? `Pages: styles are emitted via {% require_css %} and {% scope_css %}.`
      : `Emails: all styling is inline; avoid external CSS or {% require_css %}.`,
    `For repeaters (if present): add a Repeater field named exactly as shown, then add the child fields inside it.`,
  ];

  const result = { moduleHtml, fields, instructions, warnings };
  return result;
}
