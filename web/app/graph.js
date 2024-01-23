var t = `
<div @keyup.esc="$emit('graph-close');" class="relative inset-0 z-50" aria-labelledby="settings" role="dialog" aria-modal="true">
  <div @click="$emit('graph-close');" class="fixed inset-0" aria-hidden="true"></div>
  <div class="absolute inset-0 overflow-hidden">
    <div class="pointer-events-none fixed inset-y-0 right-0 flex">
      <div :class="display.fullScreen.value ? 'w-screen' : 'max-w-2xl'" class="pointer-events-auto">
        <div class="flex flex-col h-full bg-white pb-6 shadow-xl">

          <div title="close" @click="$emit('graph-close')"
            class="cursor-pointer text-gray-400 hover:text-gray-700 absolute top-0 right-0 p-4">
            <Icon name="mini-x-mark" size="h-5 w-5" />
          </div>

          <div class="absolute top-0 left-0 w-60 p-3">
            <div class="flex flex-1 flex-col overflow-y-auto border border-gray-200 rounded-md backdrop-blur-md bg-gray-50/10 space-y-1">
              <div class="flex space-x-1" :class="{ 'border-b border-gray-200': showSettings }">
                <span title="settings" @click="showSettings=!showSettings"
                  class="h-10 px-2 cursor-pointer inline-flex items-center justify-items-center text-gray-400 hover:text-gray-700">
                  <Icon name="outline-adjustments-horizontal" size="h-5 w-5" />
                </span>
                <input ref="queryInput" v-model="query" autofocus placeholder="filter notes..." autocomplete="off" spellcheck="false"
                  @blur="$refs.queryInput && $refs.queryInput.focus()"
                  class="h-10 w-full py-2 pr-2 focus:outline-none backdrop-blur-md bg-inherit text-sm text-gray-700 placeholder:text-gray-400" />
              </div>
              <div v-show="showSettings">
                <div @click="showSettingsDisplay=!showSettingsDisplay"
                  class="hover:bg-gray-50 cursor-pointer flex items-center w-full text-left p-2 space-x-3">
                  <span class="text-gray-400 shrink-0" :class="{ 'rotate-90' : showSettingsDisplay }">
                    <Icon name="chevron-right" size="h-5 w-5" />
                  </span>
                  <span class="text-sm leading-6 text-gray-700">display</span>
                </div>
                <ul v-show="showSettingsDisplay" class="mt-1 ml-px px-2 text-xs leading-6 text-gray-700">
                  <li v-for="(option, key) in display" :key="key" @click="option.value=!option.value"
                    class="flex items-center justify-items-center justify-between hover:bg-gray-50 block rounded-md py-2 pr-2 pl-8">
                    <label v-text="option.title"></label>
                    <input v-model="option.value" type="checkbox" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500" />
                  </li>
                </ul>
                <div @click="showSettingsForces=!showSettingsForces"
                  class="hover:bg-gray-50 cursor-pointer flex items-center w-full text-left p-2 gap-x-3">
                  <span class="text-gray-400 shrink-0" :class="{ 'rotate-90' : showSettingsForces }">
                    <Icon name="chevron-right" size="h-5 w-5" />
                  </span>
                  <span class="text-sm leading-6 text-gray-700">forces</span>
                </div>
                <ul v-show="showSettingsForces" class="mt-1 ml-px px-2 text-xs leading-6 text-gray-700">
                  <li v-for="(option, key) in forces" :key="key"
                    class="items-center justify-items-center justify-between block rounded-md py-2 pr-2 pl-8">
                    <div class="flex items-center justify-between">
                      <span v-text="option.title"></span>
                      <span v-text="option.value"></span>
                    </div>
                    <input class="w-full" type="range" v-model="option.value" :min="option.min" :max="option.max" :step="option.step" />
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div v-if="display.fullScreen.value && selectedNodeId" class="absolute top-0 right-0 w-[38rem] h-full bg-white shadow-xl">
            <div class="flex items-center justify-end mx-2 pt-2 space-x-3">
              <span title="open for editing" @click="$emit('note-open', selectedNodeId); $emit('graph-close')"
                class="cursor-pointer text-gray-400 hover:text-gray-700">
                <Icon name="pencil-solid" size="h-4 w-4" />
              </span>
              <span title="close preview" @click="selectedNodeId=''"
                class="cursor-pointer text-gray-400 hover:text-gray-700">
                <Icon name="mini-x-mark" size="h-5 w-5" />
              </span>
            </div>
            <div class="h-full pl-4 pb-4 mr-1">
              <Preview clickableLinks=true appendIncomingLinks=true :filename=selectedNodeId @note-open="selectedNodeId = $event" />
            </div>
          </div>

          <GraphD3 v-if="graphData"
            :graphData=graphData
            :emphasizeNodeIds=emphasizeNodeIds
            :display=display
            :forces=forces
            @click="(query = '', selectedNodeId = '')"
            @title-click="(query = '', selectedNodeId = $event, (!display.fullScreen.value) ? $emit('note-open', $event) : undefined)"
          />
        </div>
      </div>
    </div>
  </div>
</div>
`

import Icon from './icon.js'
import GraphD3 from './graph-d3.js'
import Preview from './preview.js'
export default {
  components: { Icon, GraphD3, Preview },
  props: ['config'],
  emits: ['graph-close', 'note-open'],
  data() {
    return {
      query: '',
      nodes: [],
      graphData: null,
      selectedNodeId: '',
      showSettings: false,
      showSettingsDisplay: false,
      showSettingsForces: false,
      display: {
        fullScreen:        { value: true,  title: 'fullscreen' },
        showTitles:        { value: true,  title: 'show titles' },
        scaleTitles:       { value: true,  title: 'auto-scale titles' },
        dynamicNodeRadius: { value: false, title: 'size nodes per links' },
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
          this.nodes = nodes;
          this.graphData = { nodes, links };
        })
        .catch(e => {
          console.error(e);
        });
    },
  },
  computed: {
    emphasizeNodeIds() {
      if (this.query) {
        const queryWords = this.query.toLowerCase().split(' ');
        return this.nodes.filter(node => queryWords.every(queryWord => node.title.toLowerCase().includes(queryWord))).map(node => node.id);
      }
      return this.selectedNodeId ? [this.selectedNodeId] : [];
    }
  },
  mounted() {
    this.selectedNodeId = this.config.selectedNodeId;
    this.display.fullScreen.value = this.config.fullscreen;
    this.fetchGraph();
  },
  created() {
    this.$nextTick(() => { this.$refs.queryInput.focus(); });
  },
  template: t
}
