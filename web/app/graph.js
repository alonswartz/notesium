var t = `
<div class="relative inset-0 z-50" aria-labelledby="settings" role="dialog" aria-modal="true">
  <div @click="$emit('graph-close');" class="fixed inset-0" aria-hidden="true"></div>
  <div class="absolute inset-0 overflow-hidden">
    <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
      <div class="pointer-events-auto w-screen max-w-2xl">
        <div class="flex h-full flex-col overflow-y-scroll bg-white pb-6 shadow-xl">
          <div title="close" @click="$emit('graph-close')"
            class="cursor-pointer text-gray-400 hover:text-gray-700 absolute top-0 right-0 p-4">
            <Icon name="mini-x-mark" size="h-5 w-5" />
          </div>
          <GraphD3 v-if="graphData" :graphData=graphData />
        </div>
      </div>
    </div>
  </div>
</div>
`

import Icon from './icon.js'
import GraphD3 from './graph-d3.js'
export default {
  components: { Icon, GraphD3 },
  emits: ['graph-close'],
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
            nodes.push({ id: note.Filename, title: note.Title });
            if (note.OutgoingLinks) {
              note.OutgoingLinks.forEach(link => {
                if (link.Title !== '') links.push({ source: note.Filename, target: link.Filename });
              });
            }
          });
          this.graphData = { nodes, links }
        })
        .catch(e => {
          console.error(e);
        });
    },
  },
  mounted() {
    this.fetchGraph();
  },
  template: t
}
