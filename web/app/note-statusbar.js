var t = `
<div class="flex bg-gray-200 text-xs">
  <span v-if="vimMode" class="pl-3 pr-4 pt-1.5 pb-1 uppercase font-semibold text-white rounded-r-full" :class="vimModeCls" v-text="vimModeText"></span>
  <span v-else class="pl-3 pr-4 pt-1.5 pb-1 uppercase text-gray-500">not focused</span>
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
