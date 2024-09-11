var t = `
<div class="flex justify-between bg-gray-200 text-xs">
  <span v-if="vimMode" class="pl-3 pr-4 pt-1.5 pb-1 uppercase font-semibold text-white rounded-r-full" :class="vimModeCls" v-text="vimModeText"></span>
  <span v-else class="pl-3 pr-4 pt-1.5 pb-1 uppercase text-gray-500">not focused</span>

  <div class="flex space-x-5 px-4 items-center justify-items-center text-gray-500 bg-gray-300 rounded-l-full">
    <span title="line wrapping" @click="$notesiumState.editorLineWrapping = !$notesiumState.editorLineWrapping"
      class="cursor-pointer hover:text-gray-700" v-text="$notesiumState.editorLineWrapping ? 'wrap' : 'nowrap'" />
    <span title="conceal formatting" @click="$notesiumState.editorConcealFormatting = !$notesiumState.editorConcealFormatting"
      class="cursor-pointer hover:text-gray-700" v-text="$notesiumState.editorConcealFormatting ? 'conceal' : 'noconceal'" />
  </div>
</div>
`

export default {
  props: ['vimMode'],
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
