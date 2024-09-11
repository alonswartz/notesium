var t = `
<div class="flex justify-between bg-gray-200 text-xs">
  <span v-if="vimMode" class="pl-3 pr-4 pt-1.5 pb-1 uppercase font-semibold text-white rounded-r-full" :class="vimModeCls" v-text="vimModeText"></span>
  <span v-else class="pl-3 pr-4 pt-1.5 pb-1 uppercase text-gray-500 truncate">not focused</span>

  <div class="flex space-x-5 px-4 items-center justify-items-center text-gray-500 bg-gray-300 rounded-l-full">
    <span title="line wrapping" @click="$notesiumState.editorLineWrapping = !$notesiumState.editorLineWrapping"
      class="cursor-pointer hover:text-gray-700" v-text="$notesiumState.editorLineWrapping ? 'wrap' : 'nowrap'" />
    <span title="conceal formatting" @click="$notesiumState.editorConcealFormatting = !$notesiumState.editorConcealFormatting"
      class="cursor-pointer hover:text-gray-700" v-text="$notesiumState.editorConcealFormatting ? 'conceal' : 'noconceal'" />

    <template v-if="!note.ghost">
      <span title="graph panel" @click="$notesiumState.showGraphPanel=!$notesiumState.showGraphPanel"
        class="cursor-pointer hover:text-gray-700">
        <Icon name="graph" size="h-3 w-3" />
      </span>

      <span title="links" @click="$emit('finder-open', '/api/raw/links?color=true&filename=' + note.Filename)"
        class="cursor-pointer hover:text-gray-700">
        <Icon name="mini-arrows-right-left" size="h-3 w-3" />
      </span>

      <span title="incoming links" class="cursor-pointer hover:text-gray-700 -mb-1"
        @click="$emit('finder-open', '/api/raw/links?color=true&incoming=true&filename=' + note.Filename)">
        {{note.IncomingLinks?.length || 0}}&swarr;
      </span>

      <span title="outgoing links" class="cursor-pointer hover:text-gray-700 -mb-1"
        @click="$emit('finder-open', '/api/raw/links?color=true&&outgoing=true&filename=' + note.Filename)">
        {{note.OutgoingLinks?.length || 0}}&nearr;
      </span>
    </template>
  </div>
</div>
`

import Icon from './icon.js'
export default {
  components: { Icon },
  props: ['vimMode', 'note'],
  emits: ['finder-open'],
  computed: {
    vimModeText() {
      const modeText = { 'visual-linewise': 'v-line', 'visual-blockwise': 'v-block' };
      return modeText[`${this.vimMode.mode}-${this.vimMode.subMode}`] || this.vimMode.mode;
    },
    vimModeCls() {
      const modeCls = { normal: 'bg-slate-500', insert: 'bg-yellow-500', visual: 'bg-pink-500', replace: 'bg-red-500' };
      return modeCls[this.vimMode.mode]
    },
  },
  template: t
}
