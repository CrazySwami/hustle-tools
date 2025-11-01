import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface StreamingState {
  isStreaming: boolean
  from: number
  to: number
  streamedText: string
  cursorPos: number
}

const streamingPluginKey = new PluginKey('streaming')

export const StreamingExtension = Extension.create({
  name: 'streaming',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: streamingPluginKey,
        state: {
          init() {
            return {
              isStreaming: false,
              from: 0,
              to: 0,
              streamedText: '',
              cursorPos: 0,
            } as StreamingState
          },
          apply(tr, value) {
            const meta = tr.getMeta(streamingPluginKey)
            if (meta) {
              return { ...value, ...meta }
            }
            return value
          },
        },
        props: {
          decorations(state) {
            const streamingState = streamingPluginKey.getState(state) as StreamingState

            if (!streamingState.isStreaming) {
              return DecorationSet.empty
            }

            const decorations: Decoration[] = []

            // Add purple highlight decoration to the streaming text
            if (streamingState.from < streamingState.to) {
              decorations.push(
                Decoration.inline(
                  streamingState.from,
                  streamingState.from + streamingState.cursorPos,
                  {
                    class: 'streaming-text',
                    style: 'background-color: #ede9fe; color: #4c1d95; padding: 0 2px;'
                  }
                )
              )

              // Add cursor decoration
              if (streamingState.cursorPos < streamingState.streamedText.length) {
                const cursorPos = streamingState.from + streamingState.cursorPos
                decorations.push(
                  Decoration.widget(cursorPos, () => {
                    const cursor = document.createElement('span')
                    cursor.className = 'streaming-cursor'
                    cursor.style.cssText = `
                      display: inline-block;
                      width: 2px;
                      height: 16px;
                      background-color: #8b5cf6;
                      margin-left: 2px;
                      animation: pulse 1s ease-in-out infinite;
                    `
                    return cursor
                  })
                )
              }
            }

            return DecorationSet.create(state.doc, decorations)
          },
        },
      }),
    ]
  },
})

// Helper function to update streaming state
export function updateStreamingState(view: any, update: Partial<StreamingState>) {
  const { state, dispatch } = view
  const tr = state.tr.setMeta(streamingPluginKey, update)
  dispatch(tr)
}

// Helper function to get current streaming state
export function getStreamingState(view: any): StreamingState {
  return streamingPluginKey.getState(view.state) as StreamingState
}
