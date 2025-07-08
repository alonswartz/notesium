var t = `
<div class="flex flex-nowrap max-w-full w-full h-9 overflow-x-hidden items-center content-center px-2 mr-6">
  <template v-for="tab, index in getTabs" :key="tab.id">
    <div :class="isActive(tab.id) ? 'text-gray-50' : 'text-transparent'" class="relative h-full">
      <svg class="absolute right-0 bottom-0" fill="currentColor" width="7" height="7"><path d="M 0 7 A 7 7 0 0 0 7 0 L 7 7 Z"></path></svg>
    </div>
    <div @click="$emit('tab-activate', tab.id)"
      draggable="true"
      @dragstart="dragStart(index, $event)"
      @dragend="dragTab = dragOver = null"
      @dragover.prevent
      @dragfinish.prevent
      :title="tab.titleHover"
      :class="isActive(tab.id) ? 'bg-gray-50 text-gray-800' : 'hover:bg-gray-100/75 hover:text-gray-700 text-gray-500'"
      class="flex rounded-t-lg justify-between basis-52 truncate text-xs h-full items-center pl-3 pr-2 cursor-pointer">
      <span class="truncate pt-px">
        <span v-show="tab.isModified" class="inline-block h-2 w-2 rounded-full bg-yellow-400 mr-2"></span>
        <span v-text="tab.title"></span>
      </span>
      <span @click.stop="$emit('note-close', tab.id)" class="hover:bg-gray-300 hover:rounded-full">
        <Icon name="mini-x-mark" size="h-4 w-4" />
      </span>
    </div>
    <div :class="isActive(tab.id) ? 'text-gray-50' : 'text-transparent'" class="relative h-full">
      <svg class="absolute bottom-0" fill="currentColor" width="7" height="7"><path d="M 0 0 A 7 7 0 0 0 7 7 L 0 7 Z"></path></svg>
    </div>
    <span
      v-if="(dragTab != null && dragTab != index && index != dragTab - 1)"
      v-text="dragOver === index ? getTabs[dragTab].title : '|'"
      @dragenter="dragOver = index"
      @dragleave="dragOver = null"
      @drop.prevent="dragDrop(index)"
      @dragover.prevent
      :class="{'basis-52 truncate bg-gray-400 text-white text-xs pl-3 pr-2': (dragOver === index)}"
      class="flex z-50 h-full justify-between items-center text-gray-500">
    </span>
    <span v-else :class="!isActive(tab.id) ? 'text-gray-300' : 'text-transparent'" class="z-1 -mr-1">|</span>
  </template>
</div>
`

import Icon from './icon.js'
export default {
  components: { Icon },
  props: ['tabs', 'activeTabId', 'previousTabId', 'notes'],
  emits: ['tab-activate', 'tab-move', 'note-close'],
  data() {
    return {
      dragTab: null,
      dragOver: null,
    }
  },
  methods: {
    dragStart(index, event) {
      this.$emit('tab-activate', this.tabs[index])
      this.dragTab = index;
      event.dataTransfer.dropEffect = 'move';
    },
    dragDrop(index) {
      index = (index > this.dragTab) ? index : index + 1;
      this.$emit('tab-move', this.tabs[this.dragTab], index);
    },
    isActive(tabId) {
      return this.activeTabId == tabId;
    },
    handleKeyPress(event) {
      if (event.target.tagName !== 'BODY') return

      if (event.ctrlKey && event.code == 'Digit6') {
        this.previousTabId && this.$emit('tab-activate', this.previousTabId);
        event.preventDefault();
        return;
      }

      if (event.ctrlKey && (event.code == 'KeyH' || event.code == 'KeyL')) {
        const index = this.tabs.findIndex(t => t === this.activeTabId);
        if (index === -1) return;
        const movement = event.code === 'KeyL' ? 1 : -1;
        const newIndex = (index + movement + this.tabs.length) % this.tabs.length;
        this.$emit('tab-activate', this.tabs[newIndex]);
        event.preventDefault();
        return;
      }
    },
  },
  computed: {
    getTabs() {
      return this.tabs.map(tabId => {
        const note = this.notes.find(n => n.Filename === tabId);
        return {
          id: tabId,
          title: note.Title,
          titleHover: `${note.Title} (${note.Filename})`,
          isModified: note.isModified || false,
        };
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
