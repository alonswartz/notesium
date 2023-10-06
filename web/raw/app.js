var t = `
<div class="relative flex flex-col max-h-screen h-screen overflow-y bg-gray-50">

  <nav class="flex bg-gray-200 text-gray-800">
    <div class="flex flex-nowrap max-w-full w-full h-9 overflow-x-hidden items-center content-center px-2 mr-6">
      <template v-for="note in notes" :key="note.Filename">
        <div :class="(note.Filename == activeFilename) ? 'text-gray-50' : 'text-transparent'" class="relative h-full">
          <svg class="absolute right-0 bottom-0" fill="currentColor" width="7" height="7"><path d="M 0 7 A 7 7 0 0 0 7 0 L 7 7 Z"></path></svg>
        </div>
        <div @click="activeFilename = note.Filename"
          :title="note.Title + ' (' + note.Filename + ')'"
          :class="(note.Filename == activeFilename) ? 'bg-gray-50 text-gray-800' : 'hover:bg-gray-100/75 hover:text-gray-700 text-gray-500'"
          class="flex rounded-t-lg justify-between basis-52 truncate text-xs h-full items-center pl-3 pr-2 cursor-pointer">
          <span class="truncate pt-px" v-text="note.Title"></span>
          <span @click.stop="closeNote(note.Filename)" class="hover:bg-gray-300 hover:rounded-full">
            <Icon name="mini-x-mark" size="4" />
          </span>
        </div>
        <div :class="(note.Filename == activeFilename) ? 'text-gray-50' : 'text-transparent'" class="relative h-full">
          <svg class="absolute bottom-0" fill="currentColor" width="7" height="7"><path d="M 0 0 A 7 7 0 0 0 7 7 L 0 7 Z"></path></svg>
        </div>
        <span :class="(note.Filename != activeFilename) ? 'text-gray-300' : 'text-transparent'" class="z-1 -mr-1 ">|</span>
      </template>
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
    <template v-for="note in notes">
      <pre v-show="note.Filename == activeFilename" class="text-xs p-2" v-text="note"></pre>
    </template>
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
      notes: [],
      activeFilename: '',
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
        this.notes.some(note => note.Filename === this.filterSelection.Filename)
          ? this.activeFilename = this.filterSelection.Filename
          : this.fetchNote(this.filterSelection.Filename);
      }
    },
    fetchNote(filename) {
      fetch("/api/notes/" + filename)
        .then(response => response.json())
        .then(note => {
          this.notes.push(note);
          this.activeFilename = note.Filename;
        });
    },
    closeNote(filename) {
      const index = this.notes.findIndex(note => note.Filename === filename);
      if (index === -1) return;
      if (filename === this.activeFilename) {
        this.activeFilename =
          index < this.notes.length - 1 ? this.notes[index + 1].Filename :
          index > 0 ? this.notes[index - 1].Filename :
          null;
      }
      this.notes.splice(index, 1);
    },
    handleKeyPress(event) {
      if (event.target.tagName !== 'BODY') return

      if (event.ctrlKey && (event.code == 'KeyJ' || event.code == 'KeyK')) {
        const index = this.notes.findIndex(note => note.Filename === this.activeFilename);
        if (index === -1) return;
        const movement = event.code === 'KeyJ' ? 1 : -1;
        const newIndex = (index + movement + this.notes.length) % this.notes.length;
        this.activeFilename = this.notes[newIndex].Filename;
        event.preventDefault();
        return;
      }

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
            this.activeFilename
              ? this.openFilter('/api/raw/links?color=true&filename=' + this.activeFilename)
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
