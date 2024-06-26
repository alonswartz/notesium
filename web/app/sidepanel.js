var t = `
<Pane v-if="$notesiumState.showLabelsPanel" name="labelsPanel" :defaultWidth="195" :minWidth="100">
  <div class="h-full overflow-y-auto bg-gray-800 text-gray-400 px-2 text-sm font-medium divide-y divide-gray-700">
    <ul class="space-y-1 cursor-pointer py-2">
      <li title="notes sorted alphabetically"
        @click="$notesiumState.showNotesPanel ? (sortBy='title', query='') : $emit('finder-open', '/api/raw/list?color=true&prefix=label&sort=alpha')"
        class="p-2 rounded-md hover:text-gray-100 hover:bg-gray-700">All</li>
      <li title="notes sorted by modification date"
        @click="$notesiumState.showNotesPanel ? (sortBy='mtime', query='') : $emit('finder-open', '/api/raw/list?color=true&prefix=mtime&sort=mtime')"
        class="p-2 rounded-md hover:text-gray-100 hover:bg-gray-700">Recent</li>
    </ul>
    <ul class="space-y-1 cursor-pointer py-2">
      <li v-show="labels.length == 0" class="cursor-help p-2" title="notes with 1-word titles are considered labels">No labels found</li>
      <li v-for="label in labels" :key="label.Filename"
        @click="$notesiumState.showNotesPanel ? (sortBy='title', query=label.Title + ' ') : $emit('note-open', label.Filename)"
        class="flex justify-between p-2 rounded-md hover:text-gray-100 hover:bg-gray-700">
        <span class="overflow-hidden truncate pr-2" v-text="label.Title" />
        <span title="links" @click.stop="$emit('finder-open', '/api/raw/links?color=true&filename=' + label.Filename)"
          class="text-gray-500 hover:text-gray-100" v-text="label.IncomingLinks?.length || 0">
        </span>
      </li>
    </ul>
  </div>
</Pane>

<Pane v-if="$notesiumState.showNotesPanel" name="notesPanel" :defaultWidth="380" :minWidth="100" class="border-r border-gray-200">
  <div class="flex items-center justify-items-center h-9 border-b border-gray-200 bg-gray-100 ">
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
      <div class="flex space-x-1 overflow-hidden truncate text-xs text-gray-400 leading-6">
        <span v-text="note.MtimeFormatted" />
        <div class="space-x-1 overflow-hidden truncate">
          <template v-for="label in note.Labels">
            <span>·</span>
            <span class="hover:text-gray-600" v-text="label" @click.stop="query=label + ' '"></span>
          </template>
        </div>
      </div>
    </li>
  </ul>
</Pane>
`

import Icon from './icon.js'
import Pane from './pane.js'
export default {
  props: ['lastSave'],
  emits: ['note-open', 'finder-open'],
  components: { Pane, Icon },
  data() {
    return {
      query: '',
      sortBy: 'mtime',
      notes: [],
      labels: [],
    }
  },
  methods: {
    fetchNotes() {
      fetch("/api/notes")
        .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
        .then(response => {
          const notes = Object.values(response);
          this.labels = notes.filter(note => note.IsLabel).sort((a, b) => a.Title.localeCompare(b.Title));
          this.notes = notes.map(note => {
            const links = [...(note.IncomingLinks || []), ...(note.OutgoingLinks || [])];
            const labels = links.filter(link => link.Title !== '' && !link.Title.includes(' ')).map(link => link.Title)
            return {
              Filename: note.Filename,
              Title: note.Title,
              Mtime: note.Mtime,
              MtimeFormatted: this.formatDate(note.Mtime),
              Labels: labels,
              SearchStr: (note.Title + ' ' + labels.join(' ')).toLowerCase(),
            };
          })
        })
        .catch(e => {
          console.error(e);
        });
    },
    formatDate(dateStr) {
      const now = new Date();
      const nowTime = now.getTime();
      const date = new Date(dateStr);
      const dateTime = date.getTime();
      const diff = nowTime - dateTime;

      const minutes = Math.floor(diff / 60000); // 60 * 1000
      const hours = Math.floor(diff / 3600000); // 60 * 60 * 1000

      if (minutes < 1) {
        return 'Just now';
      } else if (minutes < 60) {
        return `${minutes}m ago`;
      } else if (hours < 24) {
        return `${hours}h ago`;
      } else if (hours < 48) {
        return `Yesterday`;
      } else {
        const formattedDate = `${date.toLocaleString('default', { month: 'short' })} ${date.getDate().toString().padStart(2, '0')}`;
        return now.getFullYear() === date.getFullYear() ? formattedDate : `${formattedDate}, ${date.getFullYear()}`;
      }
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
        : this.sortedNotes.filter(note => (queryWords.every(queryWord => note.SearchStr.includes(queryWord)))).slice(0, maxNotes);
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

