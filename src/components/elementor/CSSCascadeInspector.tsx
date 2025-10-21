'use client';

import { useState, useEffect } from 'react';
import type grapesjs from 'grapesjs';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';

interface StyleSource {
  type: 'inline' | 'class' | 'global' | 'computed';
  selector: string;
  value: string;
  specificity: [number, number, number, number];
  active: boolean;
  priority?: number;
}

interface CSSCascadeInspectorProps {
  editor: grapesjs.Editor | null;
  selectedComponent: grapesjs.Component | null;
  globalCss: string;
}

export function CSSCascadeInspector({
  editor,
  selectedComponent,
  globalCss,
}: CSSCascadeInspectorProps) {
  const [properties, setProperties] = useState<Record<string, StyleSource[]>>({});
  const [expandedProps, setExpandedProps] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!selectedComponent || !editor) {
      setProperties({});
      return;
    }

    analyzeComponentStyles();
  }, [selectedComponent, editor, globalCss]);

  const analyzeComponentStyles = () => {
    if (!selectedComponent || !editor) return;

    const element = selectedComponent.getEl();
    if (!element) return;

    const computed = window.getComputedStyle(element);
    const propertyMap: Record<string, StyleSource[]> = {};

    // Key CSS properties to analyze
    const cssProperties = [
      'font-family',
      'font-size',
      'font-weight',
      'line-height',
      'color',
      'background-color',
      'background',
      'width',
      'height',
      'max-width',
      'min-height',
      'margin',
      'margin-top',
      'margin-right',
      'margin-bottom',
      'margin-left',
      'padding',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left',
      'border',
      'border-radius',
      'box-shadow',
      'display',
      'position',
      'top',
      'right',
      'bottom',
      'left',
      'z-index',
      'opacity',
      'transform',
      'transition',
    ];

    cssProperties.forEach(prop => {
      const sources = getStyleSources(selectedComponent, prop, computed);
      if (sources.length > 0) {
        propertyMap[prop] = sources;
      }
    });

    setProperties(propertyMap);
  };

  const getStyleSources = (
    component: grapesjs.Component,
    property: string,
    computed: CSSStyleDeclaration
  ): StyleSource[] => {
    const sources: StyleSource[] = [];

    // 1. Check inline styles
    const inlineStyles = component.getStyle();
    const inlineValue = inlineStyles[property];
    if (inlineValue) {
      sources.push({
        type: 'inline',
        selector: 'Inline Style',
        value: inlineValue,
        specificity: [1, 0, 0, 0],
        active: true,
      });
    }

    // 2. Check class-based styles from GrapeJS CSS manager
    const classes = component.getClasses();
    classes.forEach((cls: string) => {
      try {
        const rule = editor?.Css.getRule(`.${cls}`);
        if (rule) {
          const ruleStyles = rule.getStyle();
          const value = ruleStyles[property];
          if (value) {
            sources.push({
              type: 'class',
              selector: `.${cls}`,
              value,
              specificity: calculateSpecificity(`.${cls}`),
              active: false,
            });
          }
        }
      } catch (e) {
        // Rule might not exist
      }
    });

    // 3. Check global CSS
    if (globalCss) {
      const globalRules = parseGlobalCSS(globalCss);
      globalRules.forEach(rule => {
        if (matchesSelector(component, rule.selector)) {
          const value = rule.styles[property];
          if (value) {
            sources.push({
              type: 'global',
              selector: `${rule.selector} (Global CSS)`,
              value,
              specificity: calculateSpecificity(rule.selector),
              active: false,
            });
          }
        }
      });
    }

    // 4. Add computed value if no explicit styles
    const computedValue = computed.getPropertyValue(property);
    if (computedValue && sources.length === 0) {
      sources.push({
        type: 'computed',
        selector: 'Browser Default',
        value: computedValue,
        specificity: [0, 0, 0, 0],
        active: true,
      });
    }

    // Sort by specificity (highest first)
    sources.sort((a, b) => compareSpecificity(b.specificity, a.specificity));

    // Mark highest specificity as active (if not inline)
    if (sources.length > 0 && !sources[0].active) {
      sources[0].active = true;
    }

    return sources;
  };

  const calculateSpecificity = (selector: string): [number, number, number, number] => {
    // Returns [inline, id, class, element]
    const inline = 0;
    const ids = (selector.match(/#/g) || []).length;
    const classes = (selector.match(/\./g) || []).length +
                    (selector.match(/\[/g) || []).length +
                    (selector.match(/:/g) || []).length;
    const elements = selector.split(/\s+/).filter(s =>
      s && !s.startsWith('.') && !s.startsWith('#') && !['>', '+', '~'].includes(s)
    ).length;

    return [inline, ids, classes, elements];
  };

  const compareSpecificity = (
    a: [number, number, number, number],
    b: [number, number, number, number]
  ): number => {
    for (let i = 0; i < 4; i++) {
      if (a[i] !== b[i]) return a[i] - b[i];
    }
    return 0;
  };

  const parseGlobalCSS = (css: string): { selector: string; styles: Record<string, string> }[] => {
    const rules: { selector: string; styles: Record<string, string> }[] = [];

    try {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);

      const sheet = style.sheet as CSSStyleSheet;

      for (let i = 0; i < sheet.cssRules.length; i++) {
        const rule = sheet.cssRules[i];

        if (rule instanceof CSSStyleRule) {
          const styles: Record<string, string> = {};

          for (let j = 0; j < rule.style.length; j++) {
            const prop = rule.style[j];
            styles[prop] = rule.style.getPropertyValue(prop);
          }

          rules.push({
            selector: rule.selectorText,
            styles,
          });
        }
      }

      document.head.removeChild(style);
    } catch (e) {
      console.error('Error parsing global CSS:', e);
    }

    return rules;
  };

  const matchesSelector = (component: grapesjs.Component, selector: string): boolean => {
    try {
      const element = component.getEl();
      if (!element) return false;

      // Simple selector matching (can be improved)
      const classes = component.getClasses();
      const componentName = component.getName();

      // Check if selector matches component tag name
      if (selector === componentName) return true;

      // Check if selector matches any class
      if (selector.startsWith('.')) {
        const className = selector.slice(1);
        return classes.includes(className);
      }

      // Use browser's matches if available
      if (element.matches) {
        return element.matches(selector);
      }

      return false;
    } catch (e) {
      return false;
    }
  };

  const toggleProperty = (property: string) => {
    setExpandedProps(prev => {
      const next = new Set(prev);
      if (next.has(property)) {
        next.delete(property);
      } else {
        next.add(property);
      }
      return next;
    });
  };

  const getTypeColor = (type: StyleSource['type']): string => {
    switch (type) {
      case 'inline':
        return 'text-blue-600 dark:text-blue-400';
      case 'class':
        return 'text-green-600 dark:text-green-400';
      case 'global':
        return 'text-orange-600 dark:text-orange-400';
      case 'computed':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeBadge = (type: StyleSource['type']): string => {
    switch (type) {
      case 'inline':
        return '🔵 Inline';
      case 'class':
        return '🟢 Class';
      case 'global':
        return '🟠 Global';
      case 'computed':
        return '⚪ Default';
      default:
        return '';
    }
  };

  if (!selectedComponent) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <div className="text-muted-foreground">
          <p className="text-sm">Click an element in the canvas to inspect its CSS cascade</p>
          <p className="text-xs mt-2">See where each style comes from: Inline, Classes, or Global CSS</p>
        </div>
      </div>
    );
  }

  const filteredProperties = Object.entries(properties).filter(([prop]) =>
    prop.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="text-sm font-semibold mb-2">CSS Cascade Inspector</h3>
        <div className="text-xs text-muted-foreground mb-3">
          <code className="bg-muted px-2 py-1 rounded">
            {`<${selectedComponent.getName()}${selectedComponent.getClasses().length > 0 ? ` class="${selectedComponent.getClasses().join(' ')}"` : ''}>`}
          </code>
        </div>
        <input
          type="text"
          placeholder="Filter properties..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded bg-background"
        />
      </div>

      {/* Properties List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredProperties.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            {searchQuery ? 'No properties match your search' : 'No CSS properties found'}
          </div>
        ) : (
          filteredProperties.map(([property, sources]) => {
            const isExpanded = expandedProps.has(property);
            const activeSource = sources.find(s => s.active);

            return (
              <div key={property} className="border rounded bg-card">
                {/* Property Header */}
                <button
                  onClick={() => toggleProperty(property)}
                  className="w-full p-3 flex items-start justify-between hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDownIcon size={14} className="text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronRightIcon size={14} className="text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="font-mono text-sm font-medium">{property}</span>
                    </div>
                    {activeSource && (
                      <div className="ml-6 mt-1 text-xs text-muted-foreground">
                        <span className="font-mono">{activeSource.value}</span>
                        <span className="ml-2 opacity-70">({getTypeBadge(activeSource.type)})</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {sources.length} source{sources.length !== 1 ? 's' : ''}
                  </div>
                </button>

                {/* Property Sources */}
                {isExpanded && (
                  <div className="border-t">
                    {sources.map((source, index) => (
                      <div
                        key={index}
                        className={`p-3 border-b last:border-b-0 ${
                          source.active ? 'bg-muted/30' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-medium ${getTypeColor(source.type)}`}>
                                {getTypeBadge(source.type)}
                              </span>
                              <code className="text-xs font-mono text-muted-foreground">
                                {source.selector}
                              </code>
                              {source.active && (
                                <span className="text-xs text-green-600 dark:text-green-400">
                                  ✓ ACTIVE
                                </span>
                              )}
                            </div>
                            <div className="text-sm font-mono pl-4">
                              {property}: <span className="text-primary">{source.value}</span>;
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 pl-4">
                              Specificity: ({source.specificity.join(', ')})
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="p-4 border-t bg-muted/30 text-xs space-y-1">
        <div className="font-semibold mb-2">Legend:</div>
        <div className="flex items-center gap-2">
          <span className="text-blue-600 dark:text-blue-400">🔵 Inline</span>
          <span className="text-muted-foreground">Highest priority (style attribute)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-600 dark:text-green-400">🟢 Class</span>
          <span className="text-muted-foreground">Component classes</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-orange-600 dark:text-orange-400">🟠 Global</span>
          <span className="text-muted-foreground">External stylesheet</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-400">⚪ Default</span>
          <span className="text-muted-foreground">Browser default</span>
        </div>
      </div>
    </div>
  );
}
