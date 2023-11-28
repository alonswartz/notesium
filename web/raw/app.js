var t = `
<div class="relative flex flex-col max-h-screen h-screen overflow-y bg-gray-50">

  <nav class="flex bg-gray-200 text-gray-800">
    <Tabs :notes=notes :activeFilename=activeFilename @note-activate="activateNote" @note-close="closeNote" @note-move="moveNote" />

    <div class="flex w-auto py-2 mt-0 ml-auto items-center space-x-5 pr-5">
      <span title="new" @click="newNote('');"
        class="cursor-pointer text-gray-400 hover:text-gray-700">
        <Icon name="outline-plus-small" size="5" />
      </span>
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

  <Note v-show="note.Filename == activeFilename" :note=note v-for="note in notes" :key="note.Filename" @note-open="openNote" @note-save="saveNote"/>

  <Filter v-if="showFilter" :uri=filterUri @filter-selection="handleFilterSelection" />
  <div v-show="keySequence.length" v-text="keySequence.join(' ')" class="absolute bottom-0 right-0 p-4"></div>

  <div aria-live="assertive" class="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6">
    <div class="flex w-full flex-col items-center space-y-2 sm:items-end">
      <Alert :alert=alert :index=index v-for="(alert, index) in alerts" :key="index" @alert-dismiss="dismissAlert" />
    </div>
  </div>

</div>
`

import Filter from './filter.js'
import Tabs from './tabs.js'
import Note from './note.js'
import Icon from './icon.js'
import Alert from './alert.js'
export default {
  components: { Filter, Tabs, Note, Icon, Alert },
  data() {
    return {
      notes: [],
      activeFilename: '',
      filterUri: '',
      showFilter: false,
      keySequence: [],
      alerts: [],
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
        const note = this.notes.find(note => note.Filename === value.Filename);
        if (note) {
          note.Linenum = value.Linenum;
          this.activeFilename = value.Filename;
        } else {
          this.fetchNote(value.Filename, value.Linenum);
        }
      }
    },
    fetchNote(filename, linenum) {
      fetch("/api/notes/" + filename)
        .then(response => response.json())
        .then(note => {
          note.Linenum = linenum;
          this.notes.push(note);
          this.activeFilename = note.Filename;
        });
    },
    saveNote(filename, content, lastmtime) {
      let uri;
      let params = { method: null, body: null, headers: {"Content-type": "application/json"} }
      if (filename.startsWith('ghost-')) {
        uri = "/api/notes/";
        params.method = "POST";
        params.body = JSON.stringify({Content: content});
      } else {
        uri = "/api/notes/" + filename;
        params.method = "PATCH"
        params.body = JSON.stringify({ Content: content, LastMtime: lastmtime });
      }
      fetch(uri, params)
        .then(response => response.ok ? response.json() : response.text().then(errText => Promise.reject(errText)))
        .then(note => {
          const index = this.notes.findIndex(n => n.Filename === filename);
          this.notes[index] = note;
          this.activeFilename = note.Filename;

          // update other notes IncomingLinks due to potential changes
          this.notes.forEach(openNote => {
            if (openNote.Filename == note.Filename) return;
            if (openNote.ghost) return;
            fetch("/api/notes/" + openNote.Filename)
              .then(response => response.json())
              .then(fetchedNote => { openNote.IncomingLinks = fetchedNote.IncomingLinks; })
              .catch(error => { console.error('Error fetching note:', error); });
          });
        })
        .catch(error => {
          this.alerts.push({type: 'error', title: 'Error saving note', body: error, sticky: true})
        });
    },
    newNote(content) {
      const note = {Filename: 'ghost-' + Date.now().toString(36), Title: 'untitled', Content: content, isModified: false, Mtime: '0', ghost: true};
      this.notes.push(note);
      this.activeFilename = note.Filename;
    },
    openNote(filename, linenum) {
      const index = this.notes.findIndex(note => note.Filename === filename);
      if (index !== -1) {
        this.notes[index].Linenum = linenum;
        this.activeFilename = filename;
      } else {
        this.fetchNote(filename, linenum);
      }
    },
    activateNote(filename) {
      this.activeFilename = filename;
    },
    closeNote(filename) {
      const index = this.notes.findIndex(note => note.Filename === filename);
      if (index === -1) return;
      if (this.notes[index].isModified && !this.notes[index].ghost) {
          this.alerts.push({type: 'error', title: 'Note has changes'});
          return;
      }
      if (filename === this.activeFilename) {
        this.activeFilename =
          index < this.notes.length - 1 ? this.notes[index + 1].Filename :
          index > 0 ? this.notes[index - 1].Filename :
          null;
      }
      this.notes.splice(index, 1);
    },
    moveNote(filename, newIndex) {
      const index = this.notes.findIndex(note => note.Filename === filename);
      if (index === -1) return;
      this.notes.splice(newIndex, 0, this.notes.splice(index, 1)[0]);
    },
    dismissAlert(index) {
      this.alerts.splice(index, 1);
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
            this.activeFilename
              ? this.openFilter('/api/raw/links?color=true&filename=' + this.activeFilename)
              : this.openFilter('/api/raw/links?color=true');
            this.keySequence = []; clearTimeout(timeoutId);
            break;
          case `${leaderKey} KeyN KeyS`:
            this.openFilter('/api/raw/lines?color=true&prefix=title');
            this.keySequence = []; clearTimeout(timeoutId);
            break;
          case `${leaderKey} KeyN KeyN`:
            this.newNote('');
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
