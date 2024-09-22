var t = `
<div class="flex flex-nowrap max-w-full w-full h-9 overflow-x-hidden items-center content-center px-2 mr-6">
  <template v-for="note, index in notes" :key="note.Filename">
    <div :class="(note.Filename == activeFilename) ? 'text-gray-50' : 'text-transparent'" class="relative h-full">
      <svg class="absolute right-0 bottom-0" fill="currentColor" width="7" height="7"><path d="M 0 7 A 7 7 0 0 0 7 0 L 7 7 Z"></path></svg>
    </div>
    <div @click="$emit('note-activate', note.Filename)"
      draggable="true"
      @dragstart="dragStart(index, $event)"
      @dragend="dragTab = dragOver = null"
      @dragover.prevent
      @dragfinish.prevent
      :title="note.Title + ' (' + note.Filename + ')'"
      :class="(note.Filename == activeFilename) ? 'bg-gray-50 text-gray-800' : 'hover:bg-gray-100/75 hover:text-gray-700 text-gray-500'"
      class="flex rounded-t-lg justify-between basis-52 truncate text-xs h-full items-center pl-3 pr-2 cursor-pointer">
      <span class="truncate pt-px">
        <span v-show="note.isModified" class="inline-block h-2 w-2 rounded-full bg-yellow-400 mr-2"></span>
        <span v-text="note.Title"></span>
      </span>
      <span @click.stop="$emit('note-close', note.Filename)" class="hover:bg-gray-300 hover:rounded-full">
        <Icon name="mini-x-mark" size="h-4 w-4" />
      </span>
    </div>
    <div :class="(note.Filename == activeFilename) ? 'text-gray-50' : 'text-transparent'" class="relative h-full">
      <svg class="absolute bottom-0" fill="currentColor" width="7" height="7"><path d="M 0 0 A 7 7 0 0 0 7 7 L 0 7 Z"></path></svg>
    </div>

    <span
      v-if="(dragTab != null && dragTab != index && index != dragTab - 1)"
      v-text="dragOver === index ? notes[dragTab].Title : '|'"
      @dragenter="dragOver = index"
      @dragleave="dragOver = null"
      @drop.prevent="dragDrop(index)"
      @dragover.prevent
      :class="(dragOver === index) ? 'basis-52 truncate bg-gray-400 text-white text-xs pl-3 pr-2' : ''"
      class="flex z-50 h-full justify-between items-center text-gray-500">
    </span>
    <span v-else :class="(note.Filename != activeFilename) ? 'text-gray-300' : 'text-transparent'" class="z-1 -mr-1">|</span>
  </template>
</div>
`

import Icon from './icon.js'
export default {
  components: { Icon },
  props: ['notes', 'activeFilename', 'activeFilenamePrevious'],
  emits: ['note-activate', 'note-close', 'note-move'],
  data() {
    return {
      dragTab: null,
      dragOver: null,
    }
  },
  methods: {
    dragStart(index, event) {
      this.$emit('note-activate', this.notes[index].Filename)
      this.dragTab = index;
      event.dataTransfer.dropEffect = 'move';
    },
    dragDrop(index) {
      index = (index > this.dragTab) ? index : index + 1;
      this.$emit('note-move', this.notes[this.dragTab].Filename, index);
    },
    handleKeyPress(event) {
      if (event.target.tagName !== 'BODY') return

      if (event.ctrlKey && event.code == 'Digit6') {
        this.activeFilenamePrevious && this.$emit('note-activate', this.activeFilenamePrevious);
        event.preventDefault();
        return;
      }

      if (event.ctrlKey && (event.code == 'KeyH' || event.code == 'KeyL')) {
        const index = this.notes.findIndex(note => note.Filename === this.activeFilename);
        if (index === -1) return;
        const movement = event.code === 'KeyL' ? 1 : -1;
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
