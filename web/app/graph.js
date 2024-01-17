var t = `
<div @keyup.esc="$emit('graph-close');" class="relative inset-0 z-50" aria-labelledby="settings" role="dialog" aria-modal="true">
  <div @click="$emit('graph-close');" class="fixed inset-0" aria-hidden="true"></div>
  <div class="absolute inset-0 overflow-hidden">
    <div class="pointer-events-none fixed inset-y-0 right-0 flex">
      <div class="pointer-events-auto max-w-2xl">
        <div class="flex flex-col h-full bg-white pb-6 shadow-xl">

          <div class="absolute top-0 right-0 w-full p-4 text-sm">
            <input ref="queryInput" v-model="query" autofocus placeholder="filter..." autocomplete="off" spellcheck="false"
              @blur="$refs.queryInput && $refs.queryInput.focus()"
              class="h-12 w-full border-0 rounded-lg px-4 ring-0 focus:outline-none backdrop-blur-sm bg-gray-400/10 text-gray-900 placeholder:text-gray-400" />
          </div>

          <GraphD3 v-if="graphData" :graphData=graphData :emphasizeNodes=filteredItems @title-click="$emit('note-open', $event)" />

        </div>
      </div>
    </div>
  </div>
</div>
`

import GraphD3 from './graph-d3.js'
export default {
  components: { GraphD3 },
  emits: ['graph-close', 'note-open'],
  data() {
    return {
      query: '',
      nodes: [],
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
          this.nodes = nodes;
          this.graphData = { nodes: nodes, links };
        })
        .catch(e => {
          console.error(e);
        });
    },
  },
  computed: {
    filteredItems() {
      const queryWords = this.query.toLowerCase().split(' ');
      return !this.query
        ? []
        : this.nodes.filter(node => queryWords.every(queryWord => node.title.toLowerCase().includes(queryWord))).map(node => node.id);
    }
  },
  mounted() {
    this.fetchGraph();
  },
  created() {
    this.$nextTick(() => { this.$refs.queryInput.focus(); });
  },
  template: t
}
