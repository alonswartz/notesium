var t = `
<div class="relative flex flex-col max-h-screen h-screen overflow-y bg-gray-50">

  <nav class="flex bg-gray-200 text-gray-800">
    <NavTabs :notes=notes :activeFilename=activeFilename :activeFilenamePrevious=activeFilenamePrevious
      @note-activate="activateNote" @note-close="closeNote" @note-move="moveNote" />
    <NavActions @note-new="newNote" @finder-open="openFinder" @settings-open="showSettings=true" />
  </nav>

  <Note v-show="note.Filename == activeFilename" :note=note v-for="note in notes" :key="note.Filename"
    @note-open="openNote" @note-save="saveNote" @finder-open="openFinder"/>

  <Empty v-if="notes.length == 0" @note-new="newNote" @finder-open="openFinder" />
  <Settings v-if="showSettings" @settings-close="showSettings=false"/>
  <Finder v-if="showFinder" :uri=finderUri :initialQuery=finderQuery @finder-selection="handleFinderSelection" />
  <div v-show="keySequence.length" v-text="keySequence.join(' ')" class="absolute bottom-0 right-0 p-4"></div>

  <div aria-live="assertive" class="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6">
    <div class="flex w-full flex-col items-center space-y-2 sm:items-end">
      <Alert :alert=alert :index=index v-for="(alert, index) in alerts" :key="index" @alert-dismiss="dismissAlert" />
    </div>
  </div>

</div>
`

import Finder from './finder.js'
import NavTabs from './nav-tabs.js'
import NavActions from './nav-actions.js'
import Note from './note.js'
import Empty from './empty.js'
import Alert from './alert.js'
import Settings from './settings.js'
export default {
  components: { Finder, NavTabs, NavActions, Note, Empty, Alert, Settings },
  data() {
    return {
      notes: [],
      activeFilename: '',
      activeFilenamePrevious: '',
      finderUri: '',
      finderQuery: '',
      showFinder: false,
      showSettings: false,
      keySequence: [],
      alerts: [],
    }
  },
  methods: {
    openFinder(uri, query) {
      this.finderUri = uri;
      this.finderQuery = query;
      this.showFinder = true;
    },
    handleFinderSelection(value) {
      this.showFinder = false;
      this.finderQuery = '';
      if (value !== null) {
        const note = this.notes.find(note => note.Filename === value.Filename);
        if (note) {
          note.Linenum = value.Linenum;
          this.activateNote(value.Filename);
        } else {
          this.fetchNote(value.Filename, value.Linenum);
        }
      }
    },
    fetchNote(filename, linenum, insertAfterActive = false) {
      fetch("/api/notes/" + filename)
        .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
        .then(note => {
          note.Linenum = linenum;
          const index = insertAfterActive ? this.notes.findIndex(note => note.Filename === this.activeFilename) : -1;
          (index === -1) ? this.notes.push(note) : this.notes.splice(index + 1, 0, note);
          this.activateNote(note.Filename);
        })
        .catch(e => {
          this.alerts.push({type: 'error', title: 'Error fetching note', body: e.Error, sticky: true})
        });
      ;
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
        .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
        .then(note => {
          const index = this.notes.findIndex(n => n.Filename === filename);
          this.notes[index] = note;
          this.activateNote(note.Filename);

          // update other notes IncomingLinks due to potential changes
          this.notes.forEach(openNote => {
            if (openNote.Filename == note.Filename) return;
            if (openNote.ghost) return;
            fetch("/api/notes/" + openNote.Filename)
              .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
              .then(fetchedNote => { openNote.IncomingLinks = fetchedNote.IncomingLinks; })
              .catch(e => { console.error('Error fetching note for IncomingLinks: ', e); });
          });
        })
        .catch(e => {
          this.alerts.push({type: 'error', title: 'Error saving note', body: e.Error, sticky: true})
        });
    },
    newNote(content) {
      const note = {Filename: 'ghost-' + Date.now().toString(36), Title: 'untitled', Content: content, isModified: false, Mtime: '0', ghost: true};
      this.notes.push(note);
      this.activateNote(note.Filename);
    },
    openNote(filename, linenum) {
      const index = this.notes.findIndex(note => note.Filename === filename);
      if (index !== -1) {
        this.notes[index].Linenum = linenum;
        this.activateNote(filename);
      } else {
        this.fetchNote(filename, linenum, true);
      }
    },
    activateNote(filename) {
      this.activeFilenamePrevious = this.activeFilename;
      this.activeFilename = filename;
    },
    closeNote(filename) {
      const index = this.notes.findIndex(note => note.Filename === filename);
      if (index === -1) return;
      if (this.notes[index].isModified && !this.notes[index].ghost) {
          this.alerts.push({type: 'error', title: 'Note has unsaved changes'});
          return;
      }
      this.notes.splice(index, 1);
      const notesLength = this.notes.length;
      switch(notesLength) {
        case 0:
          this.activeFilename = '';
          this.activeFilenamePrevious = '';
          break;
        case 1:
          this.activeFilename = this.notes[0].Filename;
          this.activeFilenamePrevious = '';
          break;
        default:
          const lastFilename = this.notes.at(-1).Filename;
          if (filename == this.activeFilename) {
            const previousExists = this.notes.some(note => note.Filename === this.activeFilenamePrevious);
            this.activeFilename = previousExists ? this.activeFilenamePrevious : lastFilename;
          }
          this.activeFilenamePrevious = (this.activeFilename !== lastFilename) ? lastFilename : this.notes.at(-2).Filename;
          break;
      }
    },
    moveNote(filename, newIndex) {
      const index = this.notes.findIndex(note => note.Filename === filename);
      if (index === -1) return;
      this.notes.splice(newIndex, 0, this.notes.splice(index, 1)[0]);
    },
    dismissAlert(index) {
      this.alerts.splice(index, 1);
    },
    handleBeforeUnload(event) {
      if (this.notes.some(note => note.isModified)) {
        const message = 'You have unsaved changes.';
        event.returnValue = message;
        return message;
      }
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
            this.openFinder('/api/raw/list?color=true&prefix=label&sort=alpha');
            this.keySequence = []; clearTimeout(timeoutId);
            break;
          case `${leaderKey} KeyN KeyC`:
            this.openFinder('/api/raw/list?color=true&prefix=ctime&sort=ctime');
            this.keySequence = []; clearTimeout(timeoutId);
            break;
          case `${leaderKey} KeyN KeyM`:
            this.openFinder('/api/raw/list?color=true&prefix=mtime&sort=mtime');
            this.keySequence = []; clearTimeout(timeoutId);
            break;
          case `${leaderKey} KeyN KeyK`:
            this.activeFilename
              ? this.openFinder('/api/raw/links?color=true&filename=' + this.activeFilename)
              : this.openFinder('/api/raw/links?color=true');
            this.keySequence = []; clearTimeout(timeoutId);
            break;
          case `${leaderKey} KeyN KeyS`:
            this.openFinder('/api/raw/lines?color=true&prefix=title');
            this.keySequence = []; clearTimeout(timeoutId);
            break;
          case `${leaderKey} KeyN KeyN`:
            this.newNote('');
            break;
        }
      }
    },
    handleHeartbeat(action) {
      const sendHeartbeat = () => {
        fetch("/api/heartbeat").then(r => { !r.ok && this.handleHeartbeat('stop') });
      };
      switch (action) {
        case 'start':
          !this.heartbeatInterval && (this.heartbeatInterval = setInterval(sendHeartbeat, 5000));
          break;
        case 'stop':
          this.heartbeatInterval && clearInterval(this.heartbeatInterval);
          this.heartbeatInterval = null;
          break;
      }
    },
  },
  mounted() {
    document.addEventListener('keydown', this.handleKeyPress);
    window.addEventListener('beforeunload', this.handleBeforeUnload);
    this.handleHeartbeat('start');
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeyPress);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    this.handleHeartbeat('stop');
  },
  template: t
}
