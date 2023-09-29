var t = `
<div class="relative flex flex-col max-h-screen h-screen overflow-y bg-gray-50">

  <nav class="flex bg-gray-200 text-gray-800 h-9">
    <div class="flex flex-nowrap max-w-full w-full overflow-x-hidden items-center content-center mr-6">
      <!-- placeholder -->
    </div>
    <div class="flex w-auto py-2 mt-0 ml-auto items-center space-x-5 pr-5">
      <span title="list" @click="openFilter('/api/raw/list?color=true&prefix=label&sort=alpha');"
        class="cursor-pointer text-gray-400 hover:text-gray-700">
        <Icon name="mini-bars-three-bottom-left" size="4" />
      </span>
      <span title="links" @click="openFilter('/api/raw/links?color=true');"
        class="cursor-pointer text-gray-400 hover:text-gray-700">
        <Icon name="mini-arrows-right-left" size="4" />
      </span>
      <span title="lines" @click="openFilter('/api/raw/lines?color=true&prefix=title');"
        class="cursor-pointer text-gray-400 hover:text-gray-700">
        <Icon name="mini-magnifying-glass" size="4" />
      </span>
    </div>
  </nav>

  <main class="text-gray-800">
    <pre class="text-xs p-2" v-text="filterSelection"></pre>
    <pre class="text-xs p-2" v-text="note"></pre>
  </main>

  <Filter v-if="showFilter" :uri=filterUri @filter-selection="handleFilterSelection" />
  <div v-show="keySequence.length" v-text="keySequence.join(' ')" class="absolute bottom-0 right-0 p-4"></div>

</div>
`

import Filter from './filter.js'
import Icon from './icon.js'
export default {
  components: { Filter, Icon },
  data() {
    return {
      note: {},
      filterSelection: {},
      filterUri: '',
      showFilter: false,
      keySequence: [],
    }
  },
  methods: {
    openFilter(uri) {
      this.filterUri = uri;
      this.showFilter = true;
    },
    handleFilterSelection(value) {
      this.showFilter = false;
      if (value !== null) {
        this.filterSelection = value;
        this.fetchNote(value.Filename);
      }
    },
    fetchNote(filename) {
      fetch("/api/notes/" + filename)
        .then(response => response.json())
        .then(data => {
          this.note = data;
        });
    },
    handleKeyPress(event) {
      if (event.target.tagName !== 'BODY') return

      let timeoutId;
      const leaderKey = 'Space'
      if (event.code == leaderKey) {
        this.keySequence = [leaderKey];
        event.preventDefault();
        timeoutId = setTimeout(() => { this.keySequence = []; }, 2000);
        return;
      }

      if (this.keySequence[0] == leaderKey) {
        this.keySequence.push(event.code)
        event.preventDefault();

        switch(this.keySequence.join(' ')) {
          case `${leaderKey} KeyN KeyL`:
            this.openFilter('/api/raw/list?color=true&prefix=label&sort=alpha');
            this.keySequence = []; clearTimeout(timeoutId);
            break;
          case `${leaderKey} KeyN KeyC`:
            this.openFilter('/api/raw/list?color=true&prefix=ctime&sort=ctime');
            this.keySequence = []; clearTimeout(timeoutId);
            break;
          case `${leaderKey} KeyN KeyM`:
            this.openFilter('/api/raw/list?color=true&prefix=mtime&sort=mtime');
            this.keySequence = []; clearTimeout(timeoutId);
            break;
          case `${leaderKey} KeyN KeyK`:
            this.note.Filename
              ? this.openFilter('/api/raw/links?color=true&filename=' + this.note.Filename)
              : this.openFilter('/api/raw/links?color=true');
            this.keySequence = []; clearTimeout(timeoutId);
            break;
          case `${leaderKey} KeyN KeyS`:
            this.openFilter('/api/raw/lines?color=true&prefix=title');
            this.keySequence = []; clearTimeout(timeoutId);
            break;
        }
      }
    },
  },
  mounted() {
    document.addEventListener('keydown', this.handleKeyPress);
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeyPress);
  },
  created () {
    this.openFilter('/api/raw/list?color=true&prefix=label&sort=alpha');
  },
  template: t
}
