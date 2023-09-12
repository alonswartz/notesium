var t = `
<div class="h-screen mx-auto h-full flex flex-col overflow-y-auto p-24">
  <div class="bg-gray-300 flex p-2 items-center justify-items-center justify-between rounded-lg">
    <div class="text-sm space-x-1">
      <button class="bg-blue-600 text-white p-1 w-16 rounded-lg" @click="fetchRaw('/api/raw/list?color=true&prefix=label&sort=alpha')">list</button>
      <button class="bg-blue-600 text-white p-1 w-16 rounded-lg" @click="fetchRaw('/api/raw/links?color=true')">links</button>
      <button class="bg-blue-600 text-white p-1 w-16 rounded-lg" @click="fetchRaw('/api/raw/lines?color=true&prefix=title')">lines</button>
      <input class="border border-gray-400 py-1 px-2 w-96 rounded-lg" placeholder="/api/raw/..." v-model="uri" @change="fetchRaw(uri)" />
    </div>
  </div>

  <div class="flex py-2 items-center justify-items-center justify-between space-x-2">
    <input ref="queryInput" v-model="query" autofocus placeholder="filter..."
      @blur="$refs.queryInput && $refs.queryInput.focus()"
      @keydown.down.prevent="selectDown()"
      @keydown.up.prevent="selectUp()"
      @keydown.ctrl.j.prevent="selectDown()"
      @keydown.ctrl.k.prevent="selectUp()"
      class="border border-gray-400 py-2 px-2 w-full rounded-lg text-sm" />
    <p class="text-sm text-right w-20">{{ filteredItems.length }}/{{ itemsLength }}</p>
  </div>
  <div class="h-full overflow-y-auto grid grid-cols-2 divide-x divide-gray-300">
    <ul role="listbox" class="max-h-full overflow-y-auto py-1 text-sm font-mono text-gray-800 focus:outline-none">
      <template v-for="item, index in filteredItems">
        <li :id="'item'+index" @click="selected = index" role="option"
          :class="(index === selected) ? '!bg-blue-500 text-white' : ''"
          class="hover:bg-indigo-600/10 cursor-pointer select-none px-4 py-1 whitespace-nowrap">
          <b v-if="item.Colored" v-text="item.Colored"></b> {{ item.Content }}
        </li>
      </template>
    </ul>
    <div class="text-sm font-mono text-gray-800">
      <template v-if="filteredItems.length > 0">
        <pre v-text="filteredItems[selected].Filename"></pre>
      </template>
    </div>
  </div>
</div>
`

export default {
  data() {
    return {
      uri: '',
      query: '',
      items: [],
      selected: 0,
    }
  },
  methods: {
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
      this.uri = uri;
      this.query = '';
      this.selected = 0;
      fetch(this.uri)
        .then(response => response.text())
        .then(text => {
          const PATTERN = /^(.*?):(.*?):\s*(?:\x1b\[0;36m(.*?)\x1b\[0m\s*)?(.*)$/
          this.items = text.trim().split('\n').map(line => {
            const matches = PATTERN.exec(line);
            if (!matches) return null;
            const Filename = matches[1];
            const Linenum = matches[2];
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
      const qs = this.query.toLowerCase();
      const maxItems = 300;
      return !this.query
        ? this.items.slice(0, maxItems)
        : this.items.filter(item => item.SearchStr.includes(qs)).slice(0, maxItems);
    },
  },
  created () {
    this.fetchRaw('/api/raw/list?prefix=label&sort=alpha&color=true');
  },
  template: t
}
