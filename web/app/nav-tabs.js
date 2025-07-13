var t = `
<div class="flex flex-nowrap max-w-full w-full h-9 overflow-x-hidden items-center content-center px-2 mr-6">
  <template v-for="tab, index in getTabs" :key="tab.id">
    <div :class="isActive(tab.id) ? 'text-gray-50' : 'text-transparent'" class="relative h-full">
      <svg class="absolute right-0 bottom-0" fill="currentColor" width="7" height="7"><path d="M 0 7 A 7 7 0 0 0 7 0 L 7 7 Z"></path></svg>
    </div>
    <div
      @click="$emit('tab-activate', tab.id)"
      draggable="true"
      @dragstart="onDragStart(index)"
      @dragover.prevent="onDragOver(index)"
      @drop="onDrop"
      @dragend="onDragEnd"
      :title="tab.titleHover"
      :class="isActive(tab.id) ? 'bg-gray-50 text-gray-800' : 'hover:bg-gray-100/75 hover:text-gray-700 text-gray-500'"
      class="flex rounded-t-lg justify-between basis-52 truncate text-xs h-full items-center pl-3 pr-2 cursor-pointer">
      <span class="truncate pt-px">
        <span v-show="tab.isModified" class="inline-block h-2 w-2 rounded-full bg-yellow-400 mr-2"></span>
        <span v-text="tab.title"></span>
      </span>
      <span @click.stop="handleClose(tab.id, tab.type)" class="hover:bg-gray-300 hover:rounded-full">
        <Icon name="mini-x-mark" size="h-4 w-4" />
      </span>
    </div>
    <div :class="isActive(tab.id) ? 'text-gray-50' : 'text-transparent'" class="relative h-full">
      <svg class="absolute bottom-0" fill="currentColor" width="7" height="7"><path d="M 0 0 A 7 7 0 0 0 7 7 L 0 7 Z"></path></svg>
    </div>
    <span :class="!isActive(tab.id) ? 'text-gray-300' : 'text-transparent'" class="z-1 -mr-1">|</span>
  </template>
</div>
`

import Icon from './icon.js'
export default {
  components: { Icon },
  props: ['tabs', 'activeTabId', 'previousTabId', 'notes'],
  emits: ['tab-activate', 'tab-move', 'tab-close', 'note-close'],
  data() {
    return {
      dragIndex: null,
    }
  },
  methods: {
    onDragStart(index) {
      this.$emit('tab-activate', this.tabs[index].id)
      this.dragIndex = index;
    },
    onDragOver(overIndex) {
      if (this.dragIndex === null || this.dragIndex === overIndex) return;

      this.$emit('tab-move', this.tabs[this.dragIndex].id, overIndex);
      this.dragIndex = overIndex;
    },
    onDrop() {
      this.dragIndex = null;
    },
    onDragEnd() {
      this.dragIndex = null;
    },
    isActive(tabId) {
      return this.activeTabId == tabId;
    },
    handleClose(tabId, tabType) {
      if (tabType === 'note') {
        this.$emit('note-close', tabId);
        return;
      }
      this.$emit('tab-close', tabId);
    },
    handleKeyPress(event) {
      if (event.target.tagName !== 'BODY') return

      if (event.ctrlKey && event.code == 'Digit6') {
        this.previousTabId && this.$emit('tab-activate', this.previousTabId);
        event.preventDefault();
        return;
      }

      if (event.ctrlKey && (event.code == 'KeyH' || event.code == 'KeyL')) {
        const index = this.tabs.findIndex(t => t.id === this.activeTabId);
        if (index === -1) return;
        const movement = event.code === 'KeyL' ? 1 : -1;
        const newIndex = (index + movement + this.tabs.length) % this.tabs.length;
        this.$emit('tab-activate', this.tabs[newIndex].id);
        event.preventDefault();
        return;
      }
    },
  },
  computed: {
    getTabs() {
      return this.tabs.map(tab => {
        if (tab.type === 'note') {
          const note = this.notes.find(n => n.Filename === tab.id);
          return {
            id: tab.id,
            type: tab.type,
            title: note.Title,
            titleHover: `${note.Title} (${note.Filename})`,
            isModified: note.isModified || false,
          };
        }
      });
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
