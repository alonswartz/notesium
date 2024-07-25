var t = `
<Pane name="graphPanel" :defaultWidth="540" :minWidth="100">
  <div class="h-full w-full border-r border-gray-300 bg-gray-50">

    <div class="flex flex-nowrap max-w-full w-full h-9 overflow-x-hidden items-center content-center px-2 mr-6 bg-gray-200">
      <div class="relative h-full text-gray-50">
        <svg class="absolute right-0 bottom-0" fill="currentColor" width="7" height="7"><path d="M 0 7 A 7 7 0 0 0 7 0 L 7 7 Z"></path></svg>
      </div>
      <div class="flex rounded-t-lg justify-between basis-52 truncate text-xs h-full items-center pl-3 pr-2 bg-gray-50 text-gray-800">
        <span class="truncate pt-px">graph view</span>
        <span title="close" @click="$notesiumState.showGraphPanel=false" class="hover:bg-gray-300 hover:rounded-full cursor-pointer">
          <Icon name="mini-x-mark" size="h-4 w-4" />
        </span>
      </div>
      <div class="relative h-full text-gray-50">
        <svg class="absolute bottom-0" fill="currentColor" width="7" height="7"><path d="M 0 0 A 7 7 0 0 0 7 7 L 0 7 Z"></path></svg>
      </div>
    </div>

    <GraphD3 v-if="graphData" :graphData=graphData :emphasizeNodeIds=emphasizeNodeIds
      @title-click="$emit('note-open', $event)"
    />

  </div>
</Pane>
`

import Pane from './pane.js'
import Icon from './icon.js'
import GraphD3 from './graph-d3.js'
export default {
  components: { Pane, Icon, GraphD3 },
  props: ['activeFilename', 'lastSave'],
  emits: ['note-open'],
  data() {
    return {
      graphData: null,
    }
  },
  methods: {
    fetchGraph() {
      fetch("/api/notes")
        .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
        .then(response => {
          let nodes = [];
          let links = [];
          const notes = Object.values(response);
          notes.forEach(note => {
            nodes.push({ id: note.Filename, title: note.Title, isLabel: note.IsLabel });
            if (note.OutgoingLinks) {
              note.OutgoingLinks.forEach(link => {
                if (link.Title !== '') links.push({ source: note.Filename, target: link.Filename });
              });
            }
          });
          this.graphData = { nodes, links };
        })
        .catch(e => {
          console.error(e);
        });
    },
  },
  computed: {
    emphasizeNodeIds() {
      return this.activeFilename ? [this.activeFilename] : null;
    },
  },
  created() {
    this.fetchGraph();
  },
  watch: {
    'lastSave': function() { this.graphData = null; this.fetchGraph(); },
  },
  template: t
}
