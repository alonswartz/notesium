var t = `
<div class="flex flex-nowrap max-w-full w-full h-9 overflow-x-hidden items-center content-center px-2 mr-6">
  <template v-for="note in notes" :key="note.Filename">
    <div :class="(note.Filename == activeFilename) ? 'text-gray-50' : 'text-transparent'" class="relative h-full">
      <svg class="absolute right-0 bottom-0" fill="currentColor" width="7" height="7"><path d="M 0 7 A 7 7 0 0 0 7 0 L 7 7 Z"></path></svg>
    </div>
    <div @click="$emit('note-activate', note.Filename)"
      :title="note.Title + ' (' + note.Filename + ')'"
      :class="(note.Filename == activeFilename) ? 'bg-gray-50 text-gray-800' : 'hover:bg-gray-100/75 hover:text-gray-700 text-gray-500'"
      class="flex rounded-t-lg justify-between basis-52 truncate text-xs h-full items-center pl-3 pr-2 cursor-pointer">
      <span class="truncate pt-px" v-text="note.Title"></span>
      <span @click.stop="$emit('note-close', note.Filename)" class="hover:bg-gray-300 hover:rounded-full">
        <Icon name="mini-x-mark" size="4" />
      </span>
    </div>
    <div :class="(note.Filename == activeFilename) ? 'text-gray-50' : 'text-transparent'" class="relative h-full">
      <svg class="absolute bottom-0" fill="currentColor" width="7" height="7"><path d="M 0 0 A 7 7 0 0 0 7 7 L 0 7 Z"></path></svg>
    </div>
    <span :class="(note.Filename != activeFilename) ? 'text-gray-300' : 'text-transparent'" class="z-1 -mr-1 ">|</span>
  </template>
</div>
`

import Icon from './icon.js'
export default {
  components: { Icon },
  props: ['notes', 'activeFilename'],
  emits: ['note-activate', 'note-close'],
  methods: {
    handleKeyPress(event) {
      if (event.target.tagName !== 'BODY') return

      if (event.ctrlKey && (event.code == 'KeyJ' || event.code == 'KeyK')) {
        const index = this.notes.findIndex(note => note.Filename === this.activeFilename);
        if (index === -1) return;
        const movement = event.code === 'KeyJ' ? 1 : -1;
        const newIndex = (index + movement + this.notes.length) % this.notes.length;
        this.$emit('note-activate', this.notes[newIndex].Filename);
        event.preventDefault();
        return;
      }
    },
  },
  mounted() {
    document.addEventListener('keydown', this.handleKeyPress);
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeyPress);
  },
  template: t
}
