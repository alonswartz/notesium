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

    <div v-show="!showSettings" class="absolute top-9 right-0 p-3">
      <div class="border border-gray-200 rounded-md backdrop-blur-md">
        <span title="settings" @click="showSettings=true"
          class="h-8 px-2 cursor-pointer inline-flex items-center justify-items-center text-gray-400 hover:text-gray-700">
          <Icon name="outline-adjustments-horizontal" size="h-5 w-5" />
        </span>
      </div>
    </div>

    <div v-show="showSettings" class="absolute top-9 right-0 p-3 w-60">
      <div class="flex flex-1 flex-col border border-gray-200 rounded-md backdrop-blur-md space-y-1">
        <div class="flex border-b border-gray-200">
          <input ref="queryInput" v-model="query" placeholder="filter..." autocomplete="off" spellcheck="false"
            @keyup.esc="query=''"
            @keyup.enter.prevent
            @keydown.tab.prevent
            class="h-8 w-full p-2 focus:outline-none backdrop-blur-md bg-inherit text-sm text-gray-700 placeholder:text-gray-400" />
          <span title="settings" @click="showSettings=false"
            class="h-8 pr-2 cursor-pointer inline-flex items-center justify-items-center text-gray-400 hover:text-gray-700">
            <Icon name="outline-adjustments-horizontal" size="h-5 w-5" />
          </span>
        </div>
        <div>
          <details class="flex w-full flex-none cursor-pointer [&_svg]:open:rotate-90">
            <summary class="flex py-1 px-2 items-center justify-items-center justify-between hover:cursor-pointer focus:outline-none">
              <span class="text-sm font-medium leading-6 text-gray-700">display</span>
              <span class="text-gray-400 -mr-px"><Icon name="chevron-right" size="h-5 w-5" /></span>
            </summary>
            <ul class="mt-1 ml-px px-2 text-xs leading-6 text-gray-700">
              <li v-for="(option, key) in display" :key="key" @click="option.value=!option.value"
                class="flex items-center justify-items-center justify-between block p-2 pr-0">
                <label v-text="option.title"></label>
                <input v-model="option.value" type="checkbox" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500" />
              </li>
            </ul>
          </details>
          <details class="flex w-full flex-none [&_svg]:open:rotate-90">
            <summary class="flex py-1 px-2 items-center justify-items-center justify-between hover:cursor-pointer focus:outline-none">
              <span class="text-sm font-medium leading-6 text-gray-700">forces</span>
              <span class="text-gray-400 -mr-px"><Icon name="chevron-right" size="h-5 w-5" /></span>
            </summary>
            <ul class="mt-1 ml-px px-2 text-xs leading-6 text-gray-700">
              <li v-for="(option, key) in forces" :key="key"
                class="items-center justify-items-center justify-between block p-2 pr-0">
                <div class="flex items-center justify-between">
                  <span v-text="option.title"></span>
                  <span v-text="option.value"></span>
                </div>
                <input class="w-full cursor-pointer" type="range" v-model="option.value" :min="option.min" :max="option.max" :step="option.step" />
              </li>
            </ul>
          </details>
        </div>
      </div>
    </div>

    <GraphD3 v-if="graphData"
      :graphData=graphData
      :display=display
      :forces=forces
      :emphasizeNodeIds=emphasizeNodeIds
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
      query: '',
      showSettings: false,
      display: {
        showTitles:        { value: true,  title: 'show titles' },
        scaleTitles:       { value: true,  title: 'auto-scale titles' },
        dynamicNodeRadius: { value: false, title: 'size nodes per links' },
        emphasizeActive:   { value: true,  title: 'emphasize active note' },
      },
      forces: {
        chargeStrength:  { value: -30, min: -100, max: 0,  step: 1,    title: 'repel force' },
        collideRadius:   { value: 1,   min: 1,    max: 50, step: 1,    title: 'collide radius' },
        collideStrength: { value: 0.5, min: 0,    max: 1,  step: 0.05, title: 'collide strength' },
      },
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
      if (this.showSettings && this.query) {
        const queryWords = this.query.toLowerCase().split(' ');
        return this.graphData.nodes.filter(node => queryWords.every(queryWord => node.title.toLowerCase().includes(queryWord))).map(node => node.id);
      }
      return (this.display.emphasizeActive.value && this.activeFilename) ? [this.activeFilename] : null;
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
