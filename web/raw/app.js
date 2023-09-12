var t = `
<div class="bg-gray-200 flex p-2 items-center justify-items-center justify-between">
  <div class="text-sm space-x-2">
    <button class="bg-blue-600 text-white p-1 w-16 rounded-lg" @click="openFilter('/api/raw/list?color=true&prefix=label&sort=alpha')">list</button>
    <button class="bg-blue-600 text-white p-1 w-16 rounded-lg" @click="openFilter('/api/raw/links?color=true')">links</button>
    <button class="bg-blue-600 text-white p-1 w-16 rounded-lg" @click="openFilter('/api/raw/lines?color=true&prefix=title')">lines</button>
    <input class="border border-gray-400 py-1 px-2 w-96 rounded-lg" placeholder="/api/raw/..." v-model="uri" @change="openFilter(uri)" />
  </div>
</div>

<Filter v-if="showFilter" :uri=uri @filter-selection="handleFilterSelection" />
`

import Filter from './filter.js'
export default {
  components: { Filter },
  data() {
    return {
      uri: '',
      showFilter: false,
      filterConfig: {},
    }
  },
  methods: {
    openFilter(uri) {
      this.uri = uri;
      this.showFilter = true;
    },
    handleFilterSelection(value) {
      this.showFilter = false;
    },
  },
  created () {
    this.openFilter('/api/raw/list?color=true&prefix=label&sort=alpha');
  },
  template: t
}
