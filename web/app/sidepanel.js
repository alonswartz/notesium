var t = `
<Pane v-if="$notesiumState.showLabelsPanel" name="labelsPanel" :defaultWidth="195" :minWidth="100">
  <div class="h-full overflow-y-auto bg-gray-800 text-gray-400 text-sm font-medium">
    <div title="notes with 1-word titles are considered labels"
      class="flex items-center justify-items-center h-9 border-b border-gray-700 bg-gray-700">
      <input class="h-full w-full pl-4 text-white placeholder:text-gray-400 bg-transparent focus:outline-none text-sm"
        @keydown.space.prevent
        @keyup.esc="newLabel=''; $refs.newLabelInput.blur()"
        @keyup.enter="createNewLabelNote()"
        v-model="newLabel" ref="newLabelInput" placeholder="new label..." type="text" autocomplete="off" spellcheck="false" />
      <div class="flex items-center pr-3">
        <Icon v-if="!newLabel" name="outline-plus" size="h-4 w-4" @click="$refs.newLabelInput.focus()" class="cursor-pointer hover:text-gray-200" />
        <Icon v-if="newLabelStatus.isValid" name="mini-check" size="h-4 w-4"  @click="createNewLabelNote()" class="text-green-400" />
        <span v-if="newLabelStatus.error" v-text="newLabelStatus.error" class="text-red-400 text-xs whitespace-nowrap mt-1"></span>
      </div>
    </div>

    <ul class="space-y-1 cursor-pointer mt-2 px-2">
      <li v-show="labels.length == 0" class="p-2">No labels found</li>
      <li v-for="label in labels" :key="label.Filename"
        @click="$notesiumState.showNotesPanel ? query='label:'+label.Title+' ' : $emit('note-open', label.Filename)"
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

  <Transition
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
    enter-active-class="transition duration-300 delay-200"
    leave-active-class="transition duration-200">
    <div v-if="previewFilename" class="absolute right-0 top-0 z-50">
      <div class="relative">
        <div class="absolute origin-top-right top-14 left-6 w-[40rem] h-[40rem] pl-4 py-4 rounded-lg shadow-2xl bg-white border border-gray-300
                    before:absolute before:bottom-0 before:top-0 before:-left-2 before:bg-white before:border-l before:border-b before:border-gray-300
                    before:w-4 before:h-4 before:rotate-45 before:-z-1 before:my-auto">
          <Preview :filename="previewFilename" />
        </div>
      </div>
    </div>
  </Transition>

  <div class="flex items-center justify-items-center h-9 border-b border-gray-200 bg-gray-100">
    <input ref="queryInput" v-model="query" placeholder="filter..." autocomplete="off" spellcheck="false"
      @keyup.esc="query = ''; $refs.queryInput.blur();"
      class="h-full w-full px-4 text-gray-900 placeholder:text-gray-400 bg-gray-100 ring-0 border-none focus:outline-none text-sm" />

    <div class="inline-flex items-center justify-items-center mt-3 m-2 h-full">
      <div v-show="query" @click="query = ''" title="clear" class="-mt-1 mr-2 pr-2 text-gray-400 hover:text-gray-700 cursor-pointer border-r border-gray-300">
        <Icon name="mini-x-mark" size="h-5 w-5" />
      </div>

      <div class="relative group inline-block text-left">
        <span title="sort" class="cursor-pointer text-gray-400 group-hover:text-gray-700">
          <Icon name="outline-bars-arrow-down" size="h-5 w-5" />
        </span>
        <div class="hidden group-hover:block absolute right-0 z-50 w-64 pt-3 -mt-1 origin-top-right">
          <div class="rounded-md bg-white shadow-md border border-gray-200">
            <ul class="divide-y divide-gray-100 text-sm">
              <li class="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50" @click="sortBy='title'">
                <span class="text-gray-600">Title</span>
                <span v-show="sortBy == 'title'" class="text-indigo-500"><Icon name="mini-check" size="h-5 w-5" /></span>
              </li>
              <li class="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50" @click="sortBy='mtime'">
                <span class="text-gray-600">Modified</span>
                <span v-show="sortBy == 'mtime'" class="text-indigo-500"><Icon name="mini-check" size="h-5 w-5" /></span>
              </li>
              <li class="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50" @click="sortBy='ctime'">
                <span class="text-gray-600">Created</span>
                <span v-show="sortBy == 'ctime'" class="text-indigo-500"><Icon name="mini-check" size="h-5 w-5" /></span>
              </li>
              <li class="bg-gray-200 pt-1"></li>
              <li class="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50" @click="dense=true">
                <span class="text-gray-600">Compact view</span>
                <span v-show="dense" class="text-indigo-500"><Icon name="mini-check" size="h-5 w-5" /></span>
              </li>
              <li class="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50" @click="dense=false">
                <span class="text-gray-600">Detailed view</span>
                <span v-show="!dense" class="text-indigo-500"><Icon name="mini-check" size="h-5 w-5" /></span>
              </li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  </div>

  <ul v-if="dense" class="h-full overflow-y-scroll">
    <li v-for="note in filteredNotes" :key="note.Filename"
      @click="$emit('note-open', note.Filename)"
      class="group flex justify-between py-1 pl-4 pr-2 cursor-pointer hover:bg-gray-50">
      <div class="text-sm leading-6 text-gray-600 overflow-hidden truncate" v-text="note.Title" :title="note.Title"></div>
      <div class="hidden group-hover:block text-gray-400 hover:text-gray-600 -mr-1 pr-1"
       @mouseenter="previewFilename=note.Filename" @mouseleave="previewFilename=''" v-text="'↗'">
      </div>
    </li>
  </ul>
  <ul v-else class="divide-y divide-gray-100 h-full overflow-y-scroll">
    <li v-for="note in filteredNotes" :key="note.Filename"
      @click="$emit('note-open', note.Filename)"
      class="group flex justify-between py-3 pl-4 pr-2 cursor-pointer hover:bg-gray-50">
      <div class="truncate">
        <div class="text-sm leading-6 text-gray-900 overflow-hidden truncate" v-text="note.Title" :title="note.Title"></div>
        <div class="flex space-x-1 overflow-hidden truncate text-xs text-gray-400 leading-6">
          <span v-if="sortBy == 'ctime'" v-text="note.CtimeFormatted" title="created" />
          <span v-else v-text="note.MtimeFormatted" title="modified" />
          <div class="space-x-1 overflow-hidden truncate">
            <template v-for="label in note.Labels">
              <span>·</span>
              <span class="hover:text-gray-600" v-text="label" @click.stop="query='label:'+label+' '"></span>
            </template>
          </div>
        </div>
      </div>
      <div class="hidden group-hover:block text-gray-400 hover:text-gray-600 -my-3 py-3 -mr-2 pr-2"
       @mouseenter="previewFilename=note.Filename" @mouseleave="previewFilename=''" v-text="'↗'">
      </div>
    </li>
  </ul>
</Pane>
`

import Icon from './icon.js'
import Pane from './pane.js'
import Preview from './preview.js'
export default {
  props: ['lastSave'],
  emits: ['note-open', 'note-new', 'finder-open'],
  components: { Pane, Icon, Preview },
  data() {
    return {
      query: '',
      sortBy: 'mtime',
      dense: false,
      notes: [],
      labels: [],
      newLabel: '',
      previewFilename: '',
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
              Mtime: new Date(note.Mtime),
              MtimeFormatted: this.formatDate(note.Mtime),
              Ctime: new Date(note.Ctime),
              CtimeFormatted: this.formatDate(note.Ctime),
              Labels: labels,
              IsLabel: note.IsLabel,
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
    createNewLabelNote() {
      if (this.newLabelStatus.isValid) {
        const content = `# ${this.newLabel}\n`;
        this.$emit('note-new', null, content);
        this.$refs.newLabelInput.blur();
        this.newLabel='';
      }
    },
  },
  computed: {
    newLabelStatus() {
      if (!this.newLabel) return { isValid: false, error: '' };
      if (this.newLabel.includes(' ')) return { isValid: false, error: 'not 1-word' };
      if (this.labels.some(label => label.Title.toLowerCase() === this.newLabel.toLowerCase())) return { isValid: false, error: 'exists' };
      return { isValid: true, error: '' };
    },
    sortedNotes() {
      switch(this.sortBy) {
        case 'title': return this.notes.sort((a, b) => a.Title.localeCompare(b.Title));
        case 'mtime': return this.notes.sort((a, b) => b.Mtime - a.Mtime);
        case 'ctime': return this.notes.sort((a, b) => b.Ctime - a.Ctime);
      }
    },
    filteredNotes() {
      const maxNotes = 300;
      const { query, sortedNotes } = this;
      if (!query) return sortedNotes.slice(0, maxNotes);
      const queryWords = query.toLowerCase().split(' ');
      const labelQuery = queryWords.find(word => word.startsWith('label:'));
      if (labelQuery) {
        const label = labelQuery.slice(6);
        if (!label) return sortedNotes.filter(note => note.IsLabel).slice(0, maxNotes);
        const notesSubset = sortedNotes.filter(note => note.Labels.includes(label) || note.Title === label);
        const remainingQueryWords = queryWords.filter(word => word !== labelQuery);
        return notesSubset.filter(note => remainingQueryWords.every(queryWord => note.SearchStr.includes(queryWord))).slice(0, maxNotes);
      }
      return sortedNotes.filter(note => queryWords.every(queryWord => note.SearchStr.includes(queryWord))).slice(0, maxNotes);
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

