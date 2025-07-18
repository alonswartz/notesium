var t = `
<div class="relative flex max-h-screen h-screen overflow-hidden">

  <Ribbon :versionCheck=versionCheck :showPeriodic=showPeriodic
    @note-new="newNote" @finder-open="openFinder" @graph-open="showGraph=true" @settings-open="showSettings=true" @periodic-open="showPeriodic=true" />

  <SidePanel v-if="$notesiumState.showLabelsPanel || $notesiumState.showNotesPanel"
    :lastSave="lastSave" @note-open="openNote" @note-new="newNote" @finder-open="openFinder" />

  <GraphPanel v-if="$notesiumState.showGraphPanel" :lastSave=graphPanelWatcher :activeTabId=activeTabId @note-open="openNote" />

  <div class="flex flex-col h-full w-full overflow-x-auto">
    <nav class="flex bg-gray-200 text-gray-800">
      <NavTabs :tabs=tabs :activeTabId=activeTabId :previousTabId=previousTabId :notes=notes
        @tab-activate="activateTab" @tab-move="moveTab" @tab-close="closeTab" @note-close="closeNote" />
    </nav>
    <main class="h-full overflow-hidden bg-gray-50">
      <Empty v-if="tabs.length == 0" @note-new="newNote" @note-daily="dailyNote" @finder-open="openFinder" @graph-open="showGraph=true" />
      <Note v-show="note.Filename == activeTabId" :note=note v-for="note in notes" :key="note.Filename" :activeTabId=activeTabId
        @note-open="openNote" @note-close="closeNote" @note-save="saveNote" @note-delete="deleteNote" @finder-open="openFinder" />
    </main>
  </div>

  <Periodic v-if="showPeriodic" @note-daily="dailyNote" @note-weekly="weeklyNote" @periodic-close="showPeriodic=false" />
  <Graph v-if="showGraph" @graph-close="showGraph=false" @note-open="openNote" />
  <Settings v-if="showSettings" :versionCheck=versionCheck @settings-close="showSettings=false" @version-check="checkVersion" @finder-open="openFinder" />
  <Finder v-if="showFinder" :uri=finderUri :initialQuery=finderQuery @finder-selection="handleFinderSelection" />
  <Confirm ref="confirmDialog" />
  <div v-show="keySequence.length" v-text="keySequence.join(' ')" class="absolute bottom-6 right-4"></div>

  <div aria-live="assertive" class="pointer-events-none fixed inset-0 flex items-end sm:items-start p-2 z-50">
    <div class="flex w-full flex-col items-center space-y-2 sm:items-end">
      <Alert :alert=alert v-for="alert in alerts" :key="alert.id" @alert-dismiss="dismissAlert" />
    </div>
  </div>

</div>
`

import Finder from './finder.js'
import NavTabs from './nav-tabs.js'
import Ribbon from './ribbon.js'
import SidePanel from './sidepanel.js'
import GraphPanel from './graph-panel.js'
import Note from './note.js'
import Periodic from './periodic.js'
import Graph from './graph.js'
import Empty from './empty.js'
import Alert from './alert.js'
import Confirm from './confirm.js'
import Settings from './settings.js'
import { formatDate } from './dateutils.js';
import { initCodeMirrorVimEx } from './cm-vim.js'
export default {
  components: { Finder, NavTabs, Ribbon, SidePanel, GraphPanel, Note, Periodic, Graph, Empty, Alert, Confirm, Settings },
  data() {
    return {
      notes: [],
      tabs: [],
      tabHistory: [],
      finderUri: '',
      finderQuery: '',
      showGraph: false,
      showFinder: false,
      showPeriodic: false,
      showSettings: false,
      versionCheck: {},
      keySequence: [],
      alerts: [],
      lastSave: null,
      graphPanelWatcher: null,
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
      if (value === null) {
        this.refocusActiveTab();
      } else {
        const note = this.notes.find(note => note.Filename === value.Filename);
        if (note) {
          note.Linenum = value.Linenum;
          this.activateTab(value.Filename);
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
          this.notes.push(note);
          this.addTab('note', note.Filename, insertAfterActive);
          this.activateTab(note.Filename);
        })
        .catch(e => {
          this.addAlert({type: 'error', title: 'Error fetching note', body: e.Error, sticky: true})
        });
    },
    saveNote(filename, content, timestamp, isGhost) {
      let uri;
      let params = { method: null, body: null, headers: {"Content-type": "application/json"} }
      if (isGhost) {
        uri = "/api/notes/";
        params.method = "POST";
        params.body = JSON.stringify({Content: content, Ctime: timestamp});
      } else {
        uri = "/api/notes/" + filename;
        params.method = "PATCH"
        params.body = JSON.stringify({ Content: content, LastMtime: timestamp });
      }
      fetch(uri, params)
        .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
        .then(note => {
          const index = this.notes.findIndex(n => n.Filename === filename);

          // trigger graph panel refresh if needed
          if (this.$notesiumState.showGraphPanel) {
            if (params.method == "POST") {
              this.graphPanelWatcher = note.Mtime;
            } else if (this.notes[index].Title !== note.Title) {
              this.graphPanelWatcher = note.Mtime;
            } else {
              const stringifyLinks = (links) => { return JSON.stringify(links?.map(link => link.Filename).sort() || []); }
              if (stringifyLinks(this.notes[index].OutgoingLinks) !== stringifyLinks(note.OutgoingLinks)) {
                this.graphPanelWatcher = note.Mtime;
              }
            }
          }

          this.notes[index] = note;
          this.activateTab(note.Filename);

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
    async deleteNote(filename, timestamp) {
      const note = this.notes.find(note => note.Filename === filename);
      if (!note) return;
      if (note.ghost) return;
      if (note.isModified) { this.addAlert({type: 'error', title: 'Note has unsaved changes'}); return; }
      if ((note.IncomingLinks?.length || 0) > 0) { this.addAlert({type: 'error', title: 'Refusing deletion, note has incoming links'}); return; }

      const confirmCfg = {
        title: 'Delete note',
        body: `Are you sure you want to delete this note? This action cannot be undone.\n\n${note.Filename}: ${note.Title}`,
        button: 'Delete note',
      };
      if (!await this.$refs.confirmDialog.open(confirmCfg)) return;

      let params = {};
      params.method = 'DELETE';
      params.body = JSON.stringify({ LastMtime: timestamp });
      params.headers = {"Content-type": "application/json"};
      fetch("/api/notes/" + filename, params)
        .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
        .then(response => {
          this.addAlert({type: 'success', title: 'Note deleted successfully'});
          this.closeNote(filename);

          // update lastSave to force sidepanel refresh
          this.lastSave = new Date().toISOString();

          // trigger graph panel refresh if needed
          this.graphPanelWatcher = this.lastSave;

          // update other notes IncomingLinks due to potential changes
          this.notes.forEach(openNote => {
            if (openNote.ghost) return;
            fetch("/api/notes/" + openNote.Filename)
              .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
              .then(fetchedNote => { openNote.IncomingLinks = fetchedNote.IncomingLinks; })
              .catch(e => { console.error('Error fetching note for IncomingLinks: ', e); });
          });
        })
        .catch(e => {
          this.addAlert({type: 'error', title: 'Error deleting note', body: e.Error, sticky: true})
        });
    },
    newNote(ctime, content) {
      const baseUri = '/api/raw/new';
      let params = new URLSearchParams({ verbose: 'true' });
      if (ctime) params.append('ctime', ctime);
      const uri = `${baseUri}?${params.toString()}`;
      fetch(uri)
        .then(r => r.ok ? r.text() : r.text().then(e => Promise.reject(e)))
        .then(text => {
          const noteInfo = text.trim().split('\n').reduce((dict, line) => {
            const [key, value] = line.split(/:(.+)/); dict[key] = value;
            return dict;
          }, {});

          if (noteInfo.exists === "true") { this.openNote(noteInfo.filename, 1); return; }

          const index = this.notes.findIndex(note => note.Filename === noteInfo.filename);
          if (index !== -1) { this.activateTab(noteInfo.filename); return; }

          const ghost = {
            Filename: noteInfo.filename,
            Title: 'untitled',
            Content: content ? content : '',
            isModified: content ? true : false,
            Mtime: '0',
            Ctime: noteInfo.ctime,
            ghost: true,
          };
          this.notes.push(ghost);
          this.addTab('note', ghost.Filename);
          this.activateTab(ghost.Filename);
        })
        .catch(e => {
          this.addAlert({type: 'error', title: 'Error retrieving new note metadata', body: e.Error, sticky: true});
        });
    },
    dailyNote(customDate = null) {
      const date = customDate ? new Date(customDate) : new Date();
      const ctime = formatDate(date, '%Y-%m-%dT00:00:00');
      const content = `# ${formatDate(date, '%b %d, %Y (%A)')}`;
      this.newNote(ctime, content);
    },
    weeklyNote(customDate = null) {
      const date = customDate ? new Date(customDate) : new Date();
      const epoch = date.getTime() / 1000;
      const day = date.getDay() === 0 ? 7 : date.getDay();
      const diff = (day - this.$notesiumState.startOfWeek + 7) % 7;
      const weekBegEpoch = epoch - (diff * 86400);
      const weekBegDate = new Date(weekBegEpoch * 1000);
      const weekBegStr = formatDate(weekBegDate, '%a %b %d');
      const weekEndEpoch = weekBegEpoch + (6 * 86400);
      const weekEndDate = new Date(weekEndEpoch * 1000);
      const weekEndStr = formatDate(weekEndDate, '%a %b %d');
      const year = formatDate(weekBegDate, '%Y');
      const weekFmt = this.$notesiumState.startOfWeek === 0 ? '%U' : '%V';
      const weekNum = formatDate(weekBegDate, weekFmt);

      const ctime = formatDate(weekBegDate, '%Y-%m-%dT00:00:01');
      const content = `# ${year}: Week${weekNum} (${weekBegStr} - ${weekEndStr})`;
      this.newNote(ctime, content);
    },
    openNote(filename, linenum) {
      const index = this.notes.findIndex(note => note.Filename === filename);
      if (index !== -1) {
        this.notes[index].Linenum = linenum;
        this.activateTab(filename);
      } else {
        this.fetchNote(filename, linenum, true);
      }
    },
    addTab(tabType, tabId, insertAfterActive = false) {
      const tab = {type: tabType, id: tabId}
      const index = this.tabs.findIndex(t => t.id === this.activeTabId);
      if (insertAfterActive && index !== -1) {
        this.tabs.splice(index + 1, 0, tab);
      } else {
        this.tabs.push(tab);
      }
    },
    activateTab(tabId) {
      if (tabId == this.activeTabId) return;
      this.tabHistory = this.tabHistory.filter(id => id !== tabId);
      this.tabHistory.push(tabId);
    },
    refocusActiveTab() {
      // required for cancelled keybind and finder
      if (!this.activeTabId) return;
      const tabId = this.activeTabId;
      this.tabHistory = this.tabHistory.filter(id => id !== tabId);
      this.$nextTick(() => { this.activateTab(tabId) });
    },
    moveTab(tabId, newIndex) {
      const index = this.tabs.findIndex(t => t.id === tabId);
      if (index === -1) return;
      this.tabs.splice(newIndex, 0, this.tabs.splice(index, 1)[0]);
    },
    closeTab(tabId) {
      const index = this.tabs.findIndex(t => t.id === tabId);
      if (index !== -1) this.tabs.splice(index, 1);
      this.tabHistory = this.tabHistory.filter(id => id !== tabId);
    },
    async closeNote(filename, confirmIfModified = true) {
      const index = this.notes.findIndex(note => note.Filename === filename);
      if (index === -1) return;
      if (this.notes[index].isModified && !this.notes[index].ghost && confirmIfModified) {
        const confirmCfg = {
          title: 'Note has unsaved changes',
          body: `Are you sure you want to discard changes and close? This action cannot be undone.\n\n${filename}: ${this.notes[index].Title}`,
          button: 'Close without saving',
        };
        if (!await this.$refs.confirmDialog.open(confirmCfg)) return;
      }

      this.notes.splice(index, 1);
      this.closeTab(filename);
    },
    addAlert({type, title, body, sticky = false}) {
      this.alerts.push({type, title, body, sticky, id: Date.now().toString(36)});
    },
    dismissAlert(id) {
      const index = this.alerts.findIndex(alert => alert.id === id);
      if (index !== -1) this.alerts.splice(index, 1);
    },
    checkVersion() {
      this.versionCheck.error = '';
      this.versionCheck.comparison = '';
      this.versionCheck.latestVersion = '';
      this.versionCheck.inprogress = true;
      fetch('/api/raw/version?verbose=true&check=true')
        .then(r => r.ok ? r.text() : r.text().then(e => Promise.reject(e)))
        .then(text => {
          if (text.toLowerCase().startsWith('error')) {
            this.versionCheck.error = text.trim();
            return;
          }
          const lines = text.split('\n');
          lines.forEach(line => {
            const [key, ...rest] = line.split(':');
            const value = rest.join(':').trim();
            switch (key) {
              case 'comparison': this.versionCheck.comparison = value; break;
              case 'latest.version': this.versionCheck.latestVersion = value; break;
            }
          });
        })
        .catch(e => {
          this.versionCheck.error = e.Error;
        })
        .finally(() => {
          this.versionCheck.inprogress = false;
          this.versionCheck.date = new Date();
        });
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

      const leaderKey = 'Space'
      if (this.keySequence.length == 0 && event.code == leaderKey) {
        this.keySequence = [leaderKey];
        event.preventDefault();
        setTimeout(() => {
          if (this.keySequence.length > 0) {
            this.keySequence = [];
            this.refocusActiveTab();
          }
        }, 2000);
        return;
      }

      if (this.keySequence[0] == leaderKey) {
        this.keySequence.push(event.code)
        event.preventDefault();

        switch(this.keySequence.join(' ')) {
          case `${leaderKey} KeyN KeyL`:
            this.keySequence = [];
            this.openFinder('/api/raw/list?color=true&prefix=label&sort=alpha');
            break;
          case `${leaderKey} KeyN KeyC`:
            this.keySequence = [];
            this.openFinder('/api/raw/list?color=true&prefix=ctime&sort=ctime');
            break;
          case `${leaderKey} KeyN KeyM`:
            this.keySequence = [];
            this.openFinder('/api/raw/list?color=true&prefix=mtime&sort=mtime');
            break;
          case `${leaderKey} KeyN KeyK`:
            this.keySequence = [];
            const tab = this.tabs.find(t => t.id === this.activeTabId);
            const extraParams = tab?.type === 'note' ? `&filename=${tab.id}` : '';
            this.openFinder('/api/raw/links?color=true' + extraParams);
            break;
          case `${leaderKey} KeyN KeyS`:
            this.keySequence = [];
            this.openFinder('/api/raw/lines?color=true&prefix=title');
            break;
          case `${leaderKey} KeyN KeyN`:
            this.keySequence = [];
            this.newNote();
            break;
          case `${leaderKey} KeyN KeyD`:
            this.keySequence = [];
            this.dailyNote();
            break;
          case `${leaderKey} KeyN KeyW`:
            this.keySequence = [];
            this.weeklyNote();
            break;
          case `${leaderKey} KeyN KeyG`:
            this.keySequence = [];
            this.showGraph = true;
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
    handleCheckVersion(action) {
      switch (action) {
        case 'start':
          this.checkVersion();
          !this.checkVersionInterval && (this.checkVersionInterval = setInterval(this.checkVersion, 86400000)); // 24 hours
          break;
        case 'stop':
          this.checkVersionInterval && clearInterval(this.checkVersionInterval);
          this.checkVersionInterval = null;
          break;
      }
    },
    handleRuntimeWebOpts() {
      fetch("/api/runtime")
        .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
        .then(runtime => {
          if (runtime.web["stop-on-idle"]) this.handleHeartbeat('start');
          if (runtime.web["daily-version-check"]) this.handleCheckVersion('start');
        })
        .catch(e => { console.error(e); });
    },
  },
  computed: {
    activeTabId() {
      return this.tabHistory[this.tabHistory.length - 1] || '';
    },
    previousTabId() {
      return this.tabHistory[this.tabHistory.length - 2] || '';
    },
  },
  mounted() {
    document.addEventListener('keydown', this.handleKeyPress);
    window.addEventListener('beforeunload', this.handleBeforeUnload);
    this.handleRuntimeWebOpts();
    initCodeMirrorVimEx(this.$notesiumState);
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeyPress);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    this.handleHeartbeat('stop');
    this.handleCheckVersion('stop');
  },
  template: t
}
