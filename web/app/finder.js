var t = `
<div @keyup.esc="handleSelection(null)" class="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20" role="dialog" aria-modal="true" >
  <div @click="handleSelection(null)" class="fixed inset-0 bg-gray-500 bg-opacity-25 transition-opacity" aria-hidden="true"></div>
  <div :class="(small && !preview) ? 'max-w-2xl h-96' : 'w-full h-full'"
    class="mx-auto flex flex-col transform overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-black ring-opacity-5">
    <div class="relative group flex items-center justify-items-center justify-between space-x-2 border-b border-gray-200">
      <input ref="queryInput" v-model="query" autofocus placeholder="filter..." autocomplete="off" spellcheck="false"
        @blur="$refs.queryInput && $refs.queryInput.focus()"
        @keydown.down.prevent="selectDown()"
        @keydown.up.prevent="selectUp()"
        @keydown.ctrl.j.prevent="selectDown()"
        @keydown.ctrl.k.prevent="selectUp()"
        @keydown.ctrl.p.prevent="preview=!preview"
        @keyup.enter.prevent="(filteredItems.length === 0) ? undefined : handleSelection(selected)"
        @keydown.tab.prevent
        class="h-12 bg-gray-100 w-full border-0 m-2 rounded-lg px-4 text-gray-900 placeholder:text-gray-400 ring-0 focus:outline-none text-sm" />
      <p class="text-sm px-4">{{ filteredItems.length }}/{{ itemsLength }}</p>
    </div>
    <div :class="(preview) ? 'grid-cols-2' : 'grid-cols-1'" class="h-full overflow-y-auto grid divide-x divide-gray-200">
      <ul role="listbox" class="max-h-full overflow-y-auto py-1 text-sm font-mono text-gray-800 focus:outline-none">
        <template v-for="item, index in filteredItems">
          <li :id="'item'+index" @click="selected = index" @dblclick="handleSelection(index)" role="option"
            :class="{'!bg-blue-500 text-white': index === selected }"
            class="hover:bg-indigo-600/10 cursor-pointer select-none px-4 py-1 whitespace-nowrap truncate">
            <b v-if="item.Colored" v-text="item.Colored"></b> {{ item.Content }}
          </li>
        </template>
      </ul>
      <div class="max-h-full overflow-y-auto p-1 text-sm font-mono text-gray-800">
        <template v-if="filteredItems.length > 0 && preview">
          <Preview :filename=filteredItems[selected].Filename :lineNumber=filteredItems[selected].Linenum />
        </template>
      </div>
    </div>
  </div>
</div>
`
import Preview from './preview.js'
export default {
  components: { Preview },
  props: ['uri', 'small', 'initialQuery'],
  emits: ['finder-selection'],
  data() {
    return {
      query: '',
      items: [],
      selected: 0,
      preview: true,
    }
  },
  methods: {
    handleSelection(selected) {
      this.$emit('finder-selection', selected !== null ? this.filteredItems[selected] : null);
    },
    selectUp() {
      if (this.selected !== 0) {
        this.selected -= 1; this.scrollIntoView(`item${this.selected}`)
      }
    },
    selectDown() {
      if (this.selected !== this.filteredItems.length - 1) {
        this.selected += 1; this.scrollIntoView(`item${this.selected}`)
      }
    },
    scrollIntoView(id) {
      document.getElementById(id).scrollIntoView({ block: 'nearest' });
    },
    fetchRaw(uri) {
      this.query = '';
      this.selected = 0;
      fetch(uri)
        .then(response => response.text())
        .then(text => {
          const PATTERN = /^(.*?):(.*?):\s*(?:\x1b\[0;36m(.*?)\x1b\[0m\s*)?(.*)$/
          this.items = text.trim().split('\n').map(line => {
            const matches = PATTERN.exec(line);
            if (!matches) return null;
            const Filename = matches[1];
            const Linenum = parseInt(matches[2], 10);
            const Colored = matches[3] || '';
            const Content = matches[4];
            const SearchStr = Colored ? `${Colored} ${Content}`.toLowerCase() : Content.toLowerCase();
            return { Filename, Linenum, Colored, Content, SearchStr };
          }).filter(Boolean);
        });
    },
  },
  computed: {
    itemsLength() {
      return this.items.length;
    },
    filteredItems() {
      this.selected = 0;
      const maxItems = 300;
      const queryWords = this.query.toLowerCase().split(' ');
      return !this.query
        ? this.items.slice(0, maxItems)
        : this.items.filter(item => (queryWords.every(queryWord => item.SearchStr.includes(queryWord)))).slice(0, maxItems);
    },
  },
  created() {
    this.preview = this.small ? false : this.preview;
    this.fetchRaw(this.uri);
    this.$nextTick(() => { this.query = this.initialQuery ? this.initialQuery : ''; this.$refs.queryInput.focus(); });
  },
  template: t
}
