var t = `
<div class="hidden flex-none overflow-y-auto w-48 bg-gray-800 text-gray-400 px-2 text-sm font-medium divide-y divide-gray-600">
  <ul class="space-y-1 cursor-pointer py-2">
    <li v-for="finder in staticFinders" :key="finder.name" :title="finder.hover"
      @click="$emit('finder-open', finder.uri)"
      class="p-2 rounded-md hover:text-gray-100 hover:bg-gray-700">
      <span class="overflow-hidden truncate pr-2" v-text="finder.title" />
    </li>
  </ul>
  <ul class="space-y-1 cursor-pointer py-1">
    <li v-show="labels.length == 0" class="p-2 cursor-default" title="1-word titled notes are considered labels">no labels found</li>
    <li v-for="label in labels" :key="label.Filename"
      @click="$emit('note-open', label.Filename)"
      class="flex justify-between p-2 rounded-md hover:text-gray-100 hover:bg-gray-700">
      <span class="overflow-hidden truncate pr-2" v-text="label.Title" />
      <span title="links" @click.stop="$emit('finder-open', '/api/raw/links?color=true&filename=' + label.Filename)"
        class="text-gray-500 hover:text-gray-100" v-text="label.IncomingLinks?.length || 0">
      </span>
    </li>
  </ul>
</div>

<div class="flex-none w-96">
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-items-center h-9 border-b border-r border-gray-200 bg-gray-100 ">
      <input ref="queryInput" v-model="query" placeholder="filter..." autocomplete="off" spellcheck="false"
        @keyup.esc="query = ''; $refs.queryInput.blur();"
        class="h-full w-full px-4 text-gray-900 placeholder:text-gray-400 bg-gray-100 ring-0 border-none focus:outline-none text-sm" />
      <div class="relative group cursor-pointer inline-flex items-center justify-items-center mt-3 m-2 h-full">
        <span class="group-hover:hidden text-gray-400">
          <Icon name="outline-bars-arrow-down" size="h-5 w-5" />
        </span>
        <div class="hidden group-hover:flex text-gray-700 space-x-1 font-medium text-xs whitespace-nowrap">
          <span class="hover:underline" @click="sortBy='title'">Title</span>
          <span class="hover:underline" @click="sortBy='mtime'">Modified</span>
        </div>
      </div>
    </div>

    <ul role="list" class="divide-y divide-gray-100 h-full overflow-y-scroll">
      <li v-for="note in filteredNotes" :key="note.Filename"
        @click="$emit('note-open', note.Filename)"
        class="py-3 pl-4 pr-2 cursor-pointer hover:bg-gray-50">
        <div class="text-sm leading-6 text-gray-900 overflow-hidden truncate" v-text="note.Title" :title="note.Title"></div>
        <div class="text-xs leading-6 text-gray-400" v-text="note.Mtime.split('T')[0]"></div>
      </li>
    </ul>
  </div>
</div>
`

import Icon from './icon.js'
export default {
  props: ['lastSave'],
  emits: ['note-open', 'finder-open'],
  components: { Icon },
  data() {
    return {
      query: '',
      sortBy: 'title',
      notes: [],
      labels: [],
      staticFinders: [
        { title: 'all', hover: 'notes sorted alphabetically', uri: '/api/raw/list?color=true&prefix=label&sort=alpha' },
        { title: 'recent', hover: 'notes sorted by modification date', uri: '/api/raw/list?color=true&prefix=mtime&sort=mtime' },
        { title: 'orphans', hover: 'notes without incoming or outgoing links', uri: '/api/raw/list?orphans=true&sort=alpha' },
        { title: 'dangling links', hover: 'notes with broken outgoing links', uri: '/api/raw/links?dangling=true' },
      ],
    }
  },
  methods: {
    fetchNotes() {
      fetch("/api/notes")
        .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
        .then(notes => {
          this.notes = Object.values(notes);
          this.labels = this.notes.filter(note => note.IsLabel).sort((a, b) => a.Title.localeCompare(b.Title));
        })
        .catch(e => {
          console.error(e);
        });
    },
  },
  computed: {
    sortedNotes() {
      switch(this.sortBy) {
        case 'title': return this.notes.sort((a, b) => a.Title.localeCompare(b.Title));
        case 'mtime': return this.notes.sort((a, b) => new Date(b.Mtime) - new Date(a.Mtime));
      }
    },
    filteredNotes() {
      const maxNotes = 300;
      const queryWords = this.query.toLowerCase().split(' ');
      return !this.query
        ? this.sortedNotes.slice(0, maxNotes)
        : this.sortedNotes.filter(note => (queryWords.every(queryWord => note.Title.includes(queryWord)))).slice(0, maxNotes);
    },
  },
  created() {
    this.fetchNotes();
  },
  watch: {
    'lastSave': function() { this.fetchNotes(); },
  },
  template: t
}

