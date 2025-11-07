"use client"

import { useMemo, useState } from "react"
import { SiHubspot } from "react-icons/si"
import type { ModuleKind } from "./types" // Assuming ModuleKind is declared in a separate file

// HubSpot Module Converter (Browser/React)
// Paste HTML → get HubL-ready module HTML, field manifest, and import instructions.
// Supports page/email modules, email-safe warnings, style tokenization, and repeater detection.

// Built-in examples (enhanced with richer inline styles)
const EXAMPLES = {
  "Page — Gradient Hero": `
<section class="hero" style="background:linear-gradient(135deg,#8B9B7A,#A7C957);color:#fff;padding:80px 20px;text-align:center;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.12)">
  <h1 style="font-size:2.8rem;margin-bottom:10px;">Grow Your Business with Style</h1>
  <p style="font-size:1.1rem;max-width:640px;margin:0 auto 25px;line-height:1.6;opacity:.95">Bring your ideas to life using stunning HubSpot modules that blend clean design with powerful editing controls.</p>
  <a href="#" class="btn" style="background:#fff;color:#1b1b1b;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;display:inline-block;box-shadow:0 2px 0 rgba(0,0,0,.15)">Get Started</a>
</section>`,

  "Page — Image Feature Split": `
<section class="feature-split" style="display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:30px;max-width:1100px;margin:60px auto;padding:40px;background:#f8fafc;border-radius:20px;box-shadow:0 8px 24px rgba(2,6,23,.08)">
  <div>
    <h2 style="font-size:2rem;margin-bottom:12px;color:#0f172a;">Designed for Growth</h2>
    <p style="color:#334155;margin-bottom:20px;">Every section adapts perfectly across devices and is built for marketers to customize in HubSpot with no code required.</p>
    <a href="#" class="btn" style="padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;">Learn More</a>
  </div>
  <div>
    <img src="https://via.placeholder.com/550x400/8B9B7A/ffffff?text=Feature+Image" alt="Feature image" width="550" height="400" style="border-radius:12px;box-shadow:0 8px 20px rgba(0,0,0,0.1)"/>
  </div>
</section>`,

  "Email — Centered Hero": `
<!doctype html>
<html><body style="margin:0;padding:0;background:#E9ECEF;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:30px 0;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td align="center" style="padding:40px 20px;">
          <h1 style="font-size:28px;color:#333;margin-bottom:12px;">Welcome to Our Community</h1>
          <p style="font-size:16px;color:#555;margin:0 0 24px;">You're now part of a growing network of creators and entrepreneurs using HubSpot to grow smarter.</p>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#111;border-radius:8px;">
            <a href="#" class="btn" style="display:inline-block;padding:14px 24px;color:#fff;text-decoration:none;font-weight:bold;">Explore Resources</a>
          </td></tr></table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,

  "Email — Product Highlights": `
<!doctype html>
<html><body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 0;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;">
        <tr><td style="padding:30px 40px;">
          <h2 style="font-size:22px;margin-bottom:16px;color:#111;">New Arrivals</h2>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" width="50%" style="padding:10px;">
                <img src="https://via.placeholder.com/250x180/8B9B7A/ffffff?text=Product+1" alt="Product 1" width="250" height="180" style="display:block;border:0;border-radius:8px;"/>
                <p style="font-size:14px;color:#333;margin:8px 0 0;">Product One</p>
              </td>
              <td align="center" width="50%" style="padding:10px;">
                <img src="https://via.placeholder.com/250x180/A7C957/ffffff?text=Product+2" alt="Product 2" width="250" height="180" style="display:block;border:0;border-radius:8px;"/>
                <p style="font-size:14px;color:#333;margin:8px 0 0;">Product Two</p>
              </td>
            </tr>
          </table>
          <div style="text-align:center;margin-top:24px;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#111;border-radius:8px;">
              <a href="#" class="btn" style="display:inline-block;padding:12px 22px;color:#fff;text-decoration:none;font-weight:bold;">Shop Now</a>
            </td></tr></table>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
}

// ---------- Utilities ----------
const slug = (s) =>
  (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/__+/g, "_")
    .slice(0, 60) || "field"
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
])
const safe = (n) => (RESERVED.has(n) ? `field_${n}` : n)
const uniqueName = (base, used) => {
  const b0 = slug(base || "field")
  const b = safe(b0)
  if (!used.has(b)) {
    used.add(b)
    return b
  }
  let i = 2
  while (used.has(`${b}_${i}`)) i++
  const f = `${b}_${i}`
  used.add(f)
  return f
}

const parseStyle = (styleStr = "") => {
  const out = {}
  styleStr.split(";").forEach((pair) => {
    const [rawK, rawV] = pair.split(":")
    if (!rawK || !rawV) return
    const k = rawK.trim().toLowerCase()
    const v = rawV.trim()
    if (!k) return
    out[k] = v
  })
  return out
}

const styleToString = (obj) =>
  Object.entries(obj)
    .map(([k, v]) => `${k}:${v}`)
    .join(";")

// Basic detection of card-like repeaters (3+ similar siblings)
function detectRepeater(root) {
  const candidates = Array.from(root.querySelectorAll("section,div,ul,ol")).filter(
    (p) => p.children && p.children.length >= 3,
  )
  for (const parent of candidates) {
    const kids = Array.from(parent.children)
    const tag = kids[0].tagName
    if (!kids.every((k) => k.tagName === tag)) continue
    const proto = kids[0].cloneNode(true)
    const similar = kids.every((k) => k.querySelector("h1,h2,h3,p,img,a"))
    if (!similar) continue
    return { parent, items: kids, template: proto }
  }
  return null
}

// ---------- Core Converter ----------
function convertHtmlToHubSpotModule(rawHtml, opts) {
  const {
    kind = "page",
    moduleLabel = "Converted Section",
    generateStyles = true,
    includePageCssBlock = true,
    enableRepeater = true,
  } = opts || {}

  // Only run in browser environment
  if (typeof window === 'undefined') {
    throw new Error('convertHtmlToHubSpotModule can only be called in the browser');
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(rawHtml, "text/html")
  const root = doc.body

  /** @type {{name:string,label:string,type:string,default?:any,group?:string,children?:any[]}[]} */
  const fields = []
  const used = new Set()
  const warnings = []

  const addField = (f) => {
    fields.push(f)
    return f
  }
  const addColor = (label, def, nameHint) => {
    const name = uniqueName(nameHint || label, used)
    return addField({ name, label, type: "color", default: def, group: "Styles" })
  }
  const addNumber = (label, def, nameHint) => {
    const name = uniqueName(nameHint || label, used)
    return addField({ name, label, type: "number", default: def, group: "Styles" })
  }

  // -------- Content mapping
  let headingIndex = 0
  root.querySelectorAll("h1,h2").forEach((el) => {
    const label = headingIndex === 0 ? "Title" : `Title ${headingIndex + 1}`
    const name = uniqueName(label, used)
    addField({ name, label, type: "text", default: el.textContent.trim(), group: "Content" })
    el.textContent = `{{ module.${name} }}`
    headingIndex++
  })

  root.querySelectorAll("p,li,blockquote").forEach((el) => {
    if (el.innerHTML.includes("{{ module.")) return
    const label = el.tagName === "LI" ? "List Item" : "Rich Body"
    const name = uniqueName(label === "Rich Body" ? "rich_body" : label, used)
    addField({ name, label, type: "richtext", default: el.innerHTML.trim(), group: "Content" })
    el.innerHTML = `{{ module.${name} }}`
  })

  root.querySelectorAll("img").forEach((img, i) => {
    const label = i === 0 ? "Image" : `Image ${i + 1}`
    const name = uniqueName(label, used)
    addField({ name, label, type: "image", default: img.src, group: "Images" })
    img.src = `{{ module.${name}.src }}`
    img.alt = `{{ module.${name}.alt }}`
  })

  root.querySelectorAll("a").forEach((a) => {
    const isButton = /\b(btn|button)\b/i.test(a.className || "")
    const textLabel = isButton ? "Button Text" : "Link Text"
    const urlLabel = isButton ? "Button URL" : "Link URL"
    const textName = uniqueName(textLabel, used)
    const urlName = uniqueName(urlLabel, used)
    addField({ name: textName, label: textLabel, type: "text", default: a.textContent.trim(), group: "Links & CTAs" })
    addField({
      name: urlName,
      label: urlLabel,
      type: "url",
      default: a.getAttribute("href") || "#",
      group: "Links & CTAs",
    })
    a.textContent = `{{ module.${textName} }}`
    a.setAttribute("href", `{{ module.${urlName} }}`)
  })

  // -------- Repeater detection (cards)
  const repeater = null
  if (enableRepeater) {
    const rep = detectRepeater(root)
    if (rep) {
      const groupName = uniqueName("items", used)
      const title = uniqueName("item_title", used)
      const body = uniqueName("item_body", used)
      const image = uniqueName("item_image", used)
      const linkText = uniqueName("item_link_text", used)
      const linkUrl = uniqueName("item_link_url", used)

      // Replace first item as the template
      const t = rep.template
      const h = t.querySelector("h1,h2,h3")
      if (h) h.textContent = `{{ item.${title} }}`
      const p = t.querySelector("p")
      if (p) p.innerHTML = `{{ item.${body} }}`
      const im = t.querySelector("img")
      if (im) {
        im.src = `{{ item.${image}.src }}`
        im.alt = `{{ item.${image}.alt }}`
      }
      const a = t.querySelector("a")
      if (a) {
        a.textContent = `{{ item.${linkText} }}`
        a.setAttribute("href", `{{ item.${linkUrl} }}`)
      }

      // Swap original children with HubL loop
      rep.parent.innerHTML = `{% for item in module.${groupName} %}` + t.outerHTML + `{% endfor %}`

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
      })
    }
  }

  // -------- Style tokenization
  const styleTokens = {}
  if (generateStyles) {
    // Root styles
    const rootEl = root.firstElementChild || root
    const rootStyle = parseStyle(rootEl.getAttribute("style") || "")

    if (rootStyle["background"] || rootStyle["background-color"]) {
      const c = rootStyle["background-color"] || rootStyle["background"]
      const f = addColor("Background Color", c, "styles_bg_color")
      styleTokens.bg = f.name
      if (kind === "email") {
        if (rootStyle["background-color"]) rootStyle["background-color"] = `{{ module.${f.name}.color }}`
        else rootStyle["background"] = `{{ module.${f.name}.color }}`
      }
    }
    if (rootStyle["color"]) {
      const f = addColor("Text Color", rootStyle["color"], "styles_text_color")
      styleTokens.text = f.name
      if (kind === "email") rootStyle["color"] = `{{ module.${f.name}.color }}`
    }
    if (rootStyle["border-radius"]) {
      const val = rootStyle["border-radius"].replace("px", "")
      const f = addNumber("Border Radius (px)", Number.parseInt(val, 10) || 0, "styles_radius")
      styleTokens.radius = f.name
      if (kind === "email") rootStyle["border-radius"] = `{{ module.${f.name} }}px`
    }
    // Basic padding (treat as y/x for simplicity)
    if (rootStyle["padding"]) {
      const parts = rootStyle["padding"].split(" ").map((s) => Number.parseInt(s, 10) || 0)
      const py = parts[0] || 0
      const px = parts[1] || parts[0] || 0
      const fy = addNumber("Padding Y (px)", py, "styles_pad_y")
      const fx = addNumber("Padding X (px)", px, "styles_pad_x")
      styleTokens.padY = fy.name
      styleTokens.padX = fx.name
      if (kind === "email") rootStyle["padding"] = `{{ module.${fy.name} }}px {{ module.${fx.name} }}px`
    }
    rootEl.setAttribute("style", styleToString(rootStyle))

    // Button styles
    const btn = root.querySelector("a.btn")
    if (btn) {
      const s = parseStyle(btn.getAttribute("style") || "")
      if (s["background"]) {
        const f = addColor("Button Background", s["background"], "styles_btn_bg")
        styleTokens.btnBg = f.name
        if (kind === "email") s["background"] = `{{ module.${f.name}.color }}`
      }
      if (s["color"]) {
        const f = addColor("Button Text Color", s["color"], "styles_btn_text")
        styleTokens.btnText = f.name
        if (kind === "email") s["color"] = `{{ module.${f.name}.color }}`
      }
      if (s["border-radius"]) {
        const val = Number.parseInt(s["border-radius"], 10) || 0
        const f = addNumber("Button Radius (px)", val, "styles_btn_radius")
        styleTokens.btnRadius = f.name
        if (kind === "email") s["border-radius"] = `{{ module.${f.name} }}px`
      }
      if (s["padding"]) {
        const parts = s["padding"].split(" ").map((x) => Number.parseInt(x, 10) || 0)
        const py = parts[0] || 0
        const px = parts[1] || parts[0] || 0
        const fy = addNumber("Button Pad Y (px)", py, "styles_btn_pad_y")
        const fx = addNumber("Button Pad X (px)", px, "styles_btn_pad_x")
        if (kind === "email") s["padding"] = `{{ module.${fy.name} }}px {{ module.${fx.name} }}px`
      }
      btn.setAttribute("style", styleToString(s))
    }
  }

  // -------- Email warnings
  if (kind === "email") {
    if (root.querySelector("style")) warnings.push("Email modules cannot rely on <style> tags.")
    if (root.querySelector("script")) warnings.push("Scripts are not supported in email modules.")
    if (/display\s*:\s*(grid|flex)/i.test(root.innerHTML)) warnings.push("Grid/Flex not supported in email.")
    if (/@media/i.test(root.innerHTML)) warnings.push("Many clients ignore @media queries.")
    if (root.querySelector("form")) warnings.push("Forms are unsupported in email modules.")
    if (root.querySelector("video,audio,iframe")) warnings.push("Media embeds are unsupported in email.")
    if (/background-image/i.test(root.innerHTML)) warnings.push("Background images are unreliable in email.")
    if (/@font-face|<link/i.test(root.innerHTML)) warnings.push("Web fonts are not supported.")
    if (/position\s*:\s*(fixed|absolute)/i.test(root.innerHTML))
      warnings.push("Absolute/fixed positioning fails in email.")
  }

  // -------- Final HubL HTML + optional page CSS block
  const inner = root.innerHTML.trim()
  let moduleHtml = `<section class='hs-converted-module'>${inner}</section>`

  if (kind === "page" && generateStyles && includePageCssBlock) {
    const cssLines = []
    cssLines.push(
      ".hs-converted-module{\n" +
        (styleTokens.bg ? `  background: {{ module.${styleTokens.bg}.color }};\n` : "") +
        (styleTokens.text ? `  color: {{ module.${styleTokens.text}.color }};\n` : "") +
        (styleTokens.padY
          ? `  padding: {{ module.${styleTokens.padY} }}px {{ module.${styleTokens.padX} }}px;\n`
          : "") +
        (styleTokens.radius ? `  border-radius: {{ module.${styleTokens.radius} }}px;\n` : "") +
        "}\n",
    )
    if (styleTokens.btnBg || styleTokens.btnText || styleTokens.btnRadius) {
      cssLines.push(
        ".hs-converted-module a.btn{\n" +
          (styleTokens.btnBg ? `  background: {{ module.${styleTokens.btnBg}.color }};\n` : "") +
          (styleTokens.btnText ? `  color: {{ module.${styleTokens.btnText}.color }};\n` : "") +
          (styleTokens.btnRadius ? `  border-radius: {{ module.${styleTokens.btnRadius} }}px;\n` : "") +
          "}\n",
      )
    }

    const cssBlock = `\n{% require_css %}\n<style>\n{% scope_css %}\n${cssLines.join("\n")}\n{% end_scope_css %}\n</style>\n{% end_require_css %}`
    moduleHtml += cssBlock
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
  ]

  const result = { moduleHtml, fields, instructions, warnings }
  return result
}

// ---------- UI ----------
export default function HubSpotModuleConverter() {
  const [html, setHtml] = useState(EXAMPLES["Page — Gradient Hero"])
  const [kind, setKind] = useState(/** @type {ModuleKind} */ ("page"))
  const [label, setLabel] = useState("Converted Section")
  const [generateStyles, setGenerateStyles] = useState(true)
  const [includePageCssBlock, setIncludePageCssBlock] = useState(true)
  const [enableRepeater, setEnableRepeater] = useState(true)
  const [showFields, setShowFields] = useState(true)
  const [previewTab, setPreviewTab] = useState<"original" | "filled">("original")
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({})
  const [splitWidth, setSplitWidth] = useState(35) // 35% for form, 65% for preview
  const [isDragging, setIsDragging] = useState(false)
  const [copied, setCopied] = useState(false)

  const result = useMemo(
    () =>
      convertHtmlToHubSpotModule(html, {
        kind,
        moduleLabel: label,
        generateStyles,
        includePageCssBlock,
        enableRepeater,
      }),
    [html, kind, label, generateStyles, includePageCssBlock, enableRepeater],
  )

  useMemo(() => {
    const newValues: Record<string, any> = {}
    result.fields.forEach((field) => {
      if (field.default !== undefined) {
        newValues[field.name] = field.default
      }
    })
    setFieldValues(newValues)
  }, [result.fields])

  const filledHtml = useMemo(() => {
    let filled = html
    result.fields.forEach((field) => {
      const value = fieldValues[field.name]
      if (value !== undefined && field.default !== undefined) {
        // Only replace content fields (text, richtext, url, image), not style fields (color, number)
        if (field.type === "text" || field.type === "richtext" || field.type === "url") {
          const escapedDefault = String(field.default).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          filled = filled.replace(new RegExp(escapedDefault, "g"), String(value))
        } else if (field.type === "image") {
          const escapedDefault = String(field.default).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          filled = filled.replace(new RegExp(escapedDefault, "g"), String(value))
        }
        // Skip color and number fields to preserve original styling including gradients
      }
    })
    return filled
  }, [html, result.fields, fieldValues])

  const filledPreviewDoc = useMemo(
    () =>
      `<!doctype html><html><head><meta charset='utf-8'/><meta name='viewport' content='width=device-width,initial-scale=1'/><style>html,body{margin:0;padding:0;font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif}img{max-width:100%;height:auto}*,*:before,*:after{box-sizing:border-box}</style></head><body>${filledHtml}</body></html>`,
    [filledHtml],
  )

  const previewDoc = useMemo(
    () =>
      `<!doctype html><html><head><meta charset='utf-8'/><meta name='viewport' content='width=device-width,initial-scale=1'/><style>html,body{margin:0;padding:0;font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif}img{max-width:100%;height:auto}*,*:before,*:after{box-sizing:border-box}</style></head><body>${html}</body></html>`,
    [html],
  )

  const handleMouseDown = () => {
    setIsDragging(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    const container = document.getElementById("split-container")
    if (!container) return
    const rect = container.getBoundingClientRect()
    const newWidth = ((e.clientX - rect.left) / rect.width) * 100
    if (newWidth >= 20 && newWidth <= 80) {
      setSplitWidth(newWidth)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useMemo(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove as any)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove as any)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result.moduleHtml)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("[v0] Failed to copy:", err)
    }
  }

  return (
    <div className="h-full overflow-y-auto" style={{ padding: '8px' }}>
      <div className="h-full rounded-lg bg-background shadow-sm" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="px-4 sm:px-6 pt-8 pb-4">
          <div className="flex items-center gap-3 justify-center">
            <SiHubspot className="text-3xl text-orange-500" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">HubSpot Module Converter</h1>
          </div>
        </div>

        <div className="px-4 sm:px-6 pb-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left Column: Input Configuration */}
          <div className="rounded-lg border-2 bg-white border-gray-200 p-4 sm:p-6 transition-colors">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Input Configuration</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Target Module Type</label>
              <select
                className="border-2 bg-white border-gray-300 text-gray-900 rounded-md px-3 py-2 text-sm transition-colors"
                value={kind}
                onChange={(e) => setKind(e.target.value as ModuleKind)}
              >
                <option value="page">Page Module</option>
                <option value="email">Email Module</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Load Example</label>
              <select
                className="border-2 bg-white border-gray-300 text-gray-900 rounded-md px-3 py-2 text-sm transition-colors"
                onChange={(e) => {
                  const k = e.target.value
                  if (!k) return
                  setHtml(EXAMPLES[k])
                  setKind(k.startsWith("Email") ? "email" : "page")
                }}
              >
                <option value="">— choose example —</option>
                {Object.keys(EXAMPLES).map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={generateStyles}
                onChange={(e) => setGenerateStyles(e.target.checked)}
              />
              <span className="text-sm text-gray-700">Generate style fields</span>
            </label>

            {kind === "page" && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={includePageCssBlock}
                  onChange={(e) => setIncludePageCssBlock(e.target.checked)}
                />
                <span className="text-sm text-gray-700">Emit CSS block</span>
              </label>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={enableRepeater}
                onChange={(e) => setEnableRepeater(e.target.checked)}
              />
              <span className="text-sm text-gray-700">Detect repeaters</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={showFields}
                onChange={(e) => setShowFields(e.target.checked)}
              />
              <span className="text-sm text-gray-700">Show fields table</span>
            </label>
          </div>

          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-sm font-medium text-gray-700">HTML Input</label>
            <textarea
              className="w-full h-72 border-2 bg-white border-gray-300 text-gray-900 rounded-md p-3 font-mono text-xs transition-colors"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              className="w-full sm:w-auto border-2 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md px-4 py-2 text-sm font-medium transition-colors"
              onClick={() => {
                const blob = new Blob([result.moduleHtml], { type: "text/html" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = "module.html"
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
              }}
            >
              Download Module HTML
            </button>
            <button
              className="w-full sm:w-auto border-2 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md px-4 py-2 text-sm font-medium transition-colors"
              onClick={() => {
                const blob = new Blob([JSON.stringify(result.fields, null, 2)], { type: "application/json" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = "fields.json"
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
              }}
            >
              Download Fields JSON
            </button>
            <button
              className="w-full sm:w-auto border-2 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md px-4 py-2 text-sm font-medium transition-colors"
              onClick={() => {
                const blob = new Blob([result.instructions.join("\n")], { type: "text/plain" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = "instructions.txt"
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
              }}
            >
              Download Instructions
            </button>
          </div>
        </div>

        {/* Right Column: Module HTML Output + Setup Instructions */}
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border-2 bg-white border-gray-200 p-4 sm:p-6 transition-colors relative">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Module HTML Output</h3>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1.5 text-xs font-medium border-2 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="p-3 bg-gray-50 text-gray-900 rounded-md text-xs whitespace-pre-wrap overflow-auto max-h-64">
              {result.moduleHtml}
            </pre>
          </div>

          <div className="rounded-lg border-2 bg-white border-gray-200 p-4 sm:p-6 transition-colors">
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Setup Instructions</h3>
            <div className="p-3 bg-gray-50 text-gray-700 rounded-md text-xs whitespace-pre-wrap">
              {result.instructions.join("\n")}
            </div>
          </div>

          {result.warnings.length > 0 && (
            <div className="rounded-lg border-2 bg-red-50 border-red-200 text-red-700 p-4 transition-colors">
              <div className="font-semibold mb-2 flex items-center gap-2">
                <span>⚠️</span>
                <span>Email Safety Warnings</span>
              </div>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {result.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
        <div className="rounded-lg border-2 bg-white border-gray-200 p-4 sm:p-6 transition-colors">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Live Preview</h3>
          <div
            id="split-container"
            className="flex flex-col lg:flex-row gap-4 lg:gap-0 relative"
            style={{ userSelect: isDragging ? "none" : "auto" }}
          >
            {/* Form Section - 35% on desktop */}
            <div className="w-full lg:pr-2" style={{ width: `${splitWidth}%` }}>
              <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                {result.fields.map((field) => (
                  <div key={field.name} className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-700">{field.label}</label>
                    {field.type === "richtext" ? (
                      <textarea
                        className="border-2 bg-white border-gray-300 text-gray-900 rounded-md px-2 py-1 text-xs transition-colors"
                        value={fieldValues[field.name] || ""}
                        onChange={(e) => setFieldValues({ ...fieldValues, [field.name]: e.target.value })}
                        rows={2}
                      />
                    ) : field.type === "color" ? (
                      <input
                        type="color"
                        className="border-2 bg-white border-gray-300 rounded-md h-8 transition-colors"
                        value={fieldValues[field.name] || "#000000"}
                        onChange={(e) => setFieldValues({ ...fieldValues, [field.name]: e.target.value })}
                      />
                    ) : field.type === "number" ? (
                      <input
                        type="number"
                        className="border-2 bg-white border-gray-300 text-gray-900 rounded-md px-2 py-1 text-xs transition-colors"
                        value={fieldValues[field.name] || 0}
                        onChange={(e) => setFieldValues({ ...fieldValues, [field.name]: e.target.value })}
                      />
                    ) : (
                      <input
                        type="text"
                        className="border-2 bg-white border-gray-300 text-gray-900 rounded-md px-2 py-1 text-xs transition-colors"
                        value={fieldValues[field.name] || ""}
                        onChange={(e) => setFieldValues({ ...fieldValues, [field.name]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Draggable divider - hidden on mobile */}
            <div
              className="hidden lg:block w-1 bg-gray-300 hover:bg-gray-400 cursor-col-resize transition-colors"
              onMouseDown={handleMouseDown}
              style={{ cursor: "col-resize" }}
            />

            {/* Preview Section - 65% on desktop */}
            <div className="w-full lg:pl-2" style={{ width: `${100 - splitWidth}%` }}>
              <iframe
                className="w-full h-96 border-2 rounded-md bg-white"
                srcDoc={filledPreviewDoc}
                title="Live Preview"
                sandbox="allow-same-origin"
                key={filledPreviewDoc}
              />
            </div>
          </div>
        </div>
      </div>

        {showFields && (
          <div className="px-4 sm:px-6 pb-6">
            <div className="rounded-lg border-2 bg-white border-gray-200 p-4 sm:p-6 transition-colors">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Field Manifest</h3>
              <div className="overflow-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-2 pr-3 font-semibold text-gray-700">Label</th>
                      <th className="py-2 pr-3 font-semibold text-gray-700">Name</th>
                      <th className="py-2 pr-3 font-semibold text-gray-700">Type</th>
                      <th className="py-2 pr-3 font-semibold text-gray-700">Group</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.fields.map((f, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-2 pr-3 text-gray-700">{f.label}</td>
                        <td className="py-2 pr-3 font-mono text-orange-600">{f.name}</td>
                        <td className="py-2 pr-3 text-gray-600">{f.type}</td>
                        <td className="py-2 pr-3 text-gray-600">{f.group || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
