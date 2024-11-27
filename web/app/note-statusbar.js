var t = `
<div class="flex h-7 justify-between items-center justify-items-center bg-gray-200 text-xs">
  <div class="flex h-full">
    <span v-if="vimMode" class="pl-3 pr-4 pt-1.5 pb-1 uppercase font-semibold text-white rounded-r-full" :class="vimModeCls" v-text="vimModeText"></span>
    <span v-else class="pl-3 pr-4 pt-1.5 pb-1 uppercase text-gray-500 truncate" v-text="hasFocus ? 'focused' : 'not focused'"></span>
  </div>

  <div class="flex h-full bg-gray-900/5 rounded-l-full text-gray-500">
    <div class="flex h-full space-x-5 px-4 items-center justify-items-center">
      <span title="toggle vim mode" @click="$notesiumState.editorVimMode = !$notesiumState.editorVimMode"
        class="cursor-pointer hover:text-gray-700" v-text="$notesiumState.editorVimMode ? 'mode:vim' : 'mode:default'" />
    </div>
    <div class="flex h-full space-x-5 px-4 items-center justify-items-center bg-gray-300 rounded-l-full border-l border-gray-400">
      <span title="line wrapping" @click="$notesiumState.editorLineWrapping = !$notesiumState.editorLineWrapping"
        class="cursor-pointer hover:text-gray-700" v-text="$notesiumState.editorLineWrapping ? 'wrap' : 'nowrap'" />
      <span title="conceal formatting" @click="$notesiumState.editorConcealFormatting = !$notesiumState.editorConcealFormatting"
        class="cursor-pointer hover:text-gray-700" v-text="$notesiumState.editorConcealFormatting ? 'conceal' : 'noconceal'" />
      <span title="fold gutter" @click="$notesiumState.editorFoldGutter = !$notesiumState.editorFoldGutter"
        class="cursor-pointer hover:text-gray-700" v-text="$notesiumState.editorFoldGutter ? 'fold' : 'nofold'" />
      <template v-if="!note.ghost && !$notesiumState.showNoteSidebar">
        <span title="incoming links" class="cursor-pointer hover:text-gray-700 -mb-px"
          @click="$emit('finder-open', '/api/raw/links?color=true&incoming=true&filename=' + note.Filename)">
          {{note.IncomingLinks?.length || 0}}&swarr;
        </span>
        <span title="outgoing links" class="cursor-pointer hover:text-gray-700 -mb-px"
          @click="$emit('finder-open', '/api/raw/links?color=true&outgoing=true&filename=' + note.Filename)">
          {{note.OutgoingLinks?.length || 0}}&nearr;
        </span>
        <span title="links" @click="$emit('finder-open', '/api/raw/links?color=true&filename=' + note.Filename)"
          class="cursor-pointer hover:text-gray-700">
          <Icon name="mini-arrows-right-left" size="h-3 w-3" />
        </span>
        <span title="graph panel" @click="$notesiumState.showGraphPanel=!$notesiumState.showGraphPanel"
          class="cursor-pointer hover:text-gray-700">
          <Icon name="graph" size="h-3 w-3" />
        </span>
        <span title="delete note" @click="$emit('note-delete', note.Filename, note.Mtime)"
          class="cursor-pointer hover:text-red-700">
          <Icon name="outline-trash" size="h-4 w-4" />
        </span>
      </template>
    </div>
  </div>

</div>
`

import Icon from './icon.js'
export default {
  components: { Icon },
  props: ['note', 'vimMode', 'hasFocus' ],
  emits: ['note-delete', 'finder-open'],
  computed: {
    vimModeText() {
      const modeText = { 'visual-linewise': 'v-line', 'visual-blockwise': 'v-block' };
      return modeText[`${this.vimMode.mode}-${this.vimMode.subMode}`] || this.vimMode.mode;
    },
    vimModeCls() {
      const modeCls = { normal: 'bg-slate-500', insert: 'bg-yellow-500', visual: 'bg-pink-500', replace: 'bg-red-500', command: 'bg-sky-500' };
      return modeCls[this.vimMode.mode]
    },
  },
  template: t
}
