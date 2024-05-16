var t = `
<div class="relative flex max-h-screen h-screen overflow-hidden">

  <SidePanel v-if="showLabelsPanel || showNotesPanel"
    :showLabels=showLabelsPanel :showNotes=showNotesPanel :lastSave="lastSave"
    @note-open="openNote" @finder-open="openFinder" />

  <div class="flex flex-col h-full w-full overflow-x-auto">
    <nav class="flex bg-gray-200 text-gray-800">
      <NavTabs :notes=notes :activeFilename=activeFilename :activeFilenamePrevious=activeFilenamePrevious
        @note-activate="activateNote" @note-close="closeNote" @note-move="moveNote" />
      <NavActions :showNoteSidebar=showNoteSidebar :showLabelsPanel=showLabelsPanel :showNotesPanel=showNotesPanel
        @note-new="newNote" @finder-open="openFinder" @graph-open="openGraph" @settings-open="showSettings=true"
        @notespanel-toggle="showNotesPanel=!showNotesPanel" @labelspanel-toggle="showLabelsPanel=!showLabelsPanel"
        @notesidebar-toggle="showNoteSidebar=!showNoteSidebar" />
    </nav>
    <main class="h-full overflow-hidden bg-gray-50">
      <Empty v-if="notes.length == 0" @note-new="newNote" @finder-open="openFinder" @graph-open="openGraph" />
      <Note v-show="note.Filename == activeFilename" :note=note v-for="note in notes" :key="note.Filename" :showSidebar=showNoteSidebar
        @note-open="openNote" @note-save="saveNote" @finder-open="openFinder" @graph-open="openGraph" />
    </main>
  </div>

  <Graph v-if="showGraph" :config=graphConfig @graph-close="closeGraph" @note-open="openNote" />
  <Settings v-if="showSettings" @settings-close="showSettings=false" />
  <Finder v-if="showFinder" :uri=finderUri :initialQuery=finderQuery @finder-selection="handleFinderSelection" />
  <div v-show="keySequence.length" v-text="keySequence.join(' ')" class="absolute bottom-0 right-0 p-4"></div>

  <div aria-live="assertive" class="pointer-events-none fixed inset-0 flex items-end sm:items-start p-2 z-50">
    <div class="flex w-full flex-col items-center space-y-2 sm:items-end">
      <Alert :alert=alert v-for="alert in alerts" :key="alert.id" @alert-dismiss="dismissAlert" />
    </div>
  </div>

</div>
`

import Finder from './finder.js'
import NavTabs from './nav-tabs.js'
import NavActions from './nav-actions.js'
import SidePanel from './sidepanel.js'
import Note from './note.js'
import Graph from './graph.js'
import Empty from './empty.js'
import Alert from './alert.js'
import Settings from './settings.js'
export default {
  components: { Finder, NavTabs, NavActions, SidePanel, Note, Graph, Empty, Alert, Settings },
  data() {
    return {
      notes: [],
      activeFilename: '',
      activeFilenamePrevious: '',
      finderUri: '',
      finderQuery: '',
      graphConfig: {},
      showGraph: false,
      showFinder: false,
      showSettings: false,
      showNoteSidebar: true,
      showLabelsPanel: false,
      showNotesPanel: false,
      keySequence: [],
      alerts: [],
      lastSave: null,
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
    openGraph(filename = '') {
      this.graphConfig = { selectedNodeId: filename, fullscreen: filename === '' };
      this.showGraph = true;
    },
    closeGraph() {
      this.showGraph = false;
      this.graphConfig = {};
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
          this.addAlert({type: 'error', title: 'Error fetching note', body: e.Error, sticky: true})
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
        .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
        .then(note => {
          const index = this.notes.findIndex(n => n.Filename === filename);
          this.notes[index] = note;
          this.activateNote(note.Filename);

          // track lastSave to force sidepanel refresh
          this.lastSave = note.Mtime;

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
          this.addAlert({type: 'error', title: 'Error saving note', body: e.Error, sticky: true})
        });
    },
    newNote(content) {
      fetch('/api/raw/new?verbose=true')
        .then(r => r.ok ? r.text() : r.text().then(e => Promise.reject(e)))
        .then(text => {
          const noteInfo = text.trim().split('\n').reduce((dict, line) => {
            const [key, value] = line.split(/:(.+)/); dict[key] = value;
            return dict;
          }, {});

          if (noteInfo.exists === "true") { this.openNote(noteInfo.filename, 1); return; }

          const index = this.notes.findIndex(note => note.Filename === noteInfo.filename);
          if (index !== -1) { this.activateNote(noteInfo.filename); return; }

          const ghost = {
            Filename: noteInfo.filename,
            Title: 'untitled',
            Content: content,
            isModified: false,
            Mtime: '0',
            Ctime: noteInfo.ctime,
            ghost: true,
          };
          this.notes.push(ghost);
          this.activateNote(ghost.Filename);
        })
        .catch(e => {
          this.addAlert({type: 'error', title: 'Error retrieving new note metadata', body: e.Error, sticky: true});
        });
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
        this.addAlert({type: 'error', title: 'Note has unsaved changes'});
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
    addAlert({type, title, body, sticky = false}) {
      this.alerts.push({type, title, body, sticky, id: Date.now().toString(36)});
    },
    dismissAlert(id) {
      const index = this.alerts.findIndex(alert => alert.id === id);
      if (index !== -1) this.alerts.splice(index, 1);
    },
    handleBeforeUnload(event) {
      this.savePanelState();
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
          case `${leaderKey} KeyN KeyG`:
            this.openGraph();
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
    savePanelState() {
      const panels = ['showNoteSidebar', 'showLabelsPanel', 'showNotesPanel'];
      panels.forEach(key => { sessionStorage.setItem(key, this[key]); });
    },
    loadPanelState() {
      const getBoolSessionItem = (k, dv) => { const v = sessionStorage.getItem(k); return v !== null ? v === 'true' : dv; };
      const panels = ['showNoteSidebar', 'showLabelsPanel', 'showNotesPanel'];
      panels.forEach(key => { this[key] = getBoolSessionItem(key, this[key]); });
    },
  },
  mounted() {
    document.addEventListener('keydown', this.handleKeyPress);
    window.addEventListener('beforeunload', this.handleBeforeUnload);
    this.loadPanelState();
    this.handleHeartbeat('start');
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeyPress);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    this.handleHeartbeat('stop');
  },
  template: t
}
