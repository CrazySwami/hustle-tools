import { Extension } from '@tiptap/core'

export interface LineHeightOptions {
  types: string[]
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineHeight: {
      /**
       * Set the line height
       */
      setLineHeight: (lineHeight: string) => ReturnType
      /**
       * Unset the line height
       */
      unsetLineHeight: () => ReturnType
    }
  }
}

export const LineHeight = Extension.create<LineHeightOptions>({
  name: 'lineHeight',

  addOptions() {
    return {
      types: ['textStyle'],
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: element => element.style.lineHeight?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.lineHeight) {
                return {}
              }

              return {
                style: `line-height: ${attributes.lineHeight}`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setLineHeight: (lineHeight: string) => ({ chain }) => {
        return chain()
          .setMark('textStyle', { lineHeight })
          .run()
      },
      unsetLineHeight: () => ({ chain }) => {
        return chain()
          .setMark('textStyle', { lineHeight: null })
          .removeEmptyTextStyle()
          .run()
      },
    }
  },
})
