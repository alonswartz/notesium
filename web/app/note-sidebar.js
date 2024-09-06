var t = `
<Pane name="noteSidebar" :defaultWidth="384" :minWidth="200" direction="left">
<aside class="h-full overflow-y-auto my-2 mr-2 rounded-lg border border-gray-200 bg-white">

  <div class="flex flex-wrap gap-x-5 gap-y-2 p-2 border-b sticky top-0 z-10 bg-white">
    <button type="button" :disabled="!note.isModified" @click="$emit('note-save')"
      :class="note.isModified ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-300 text-gray-400'"
      class="flex-grow max-w-xs rounded px-2 pt-2 pb-1 text-xs shadow-sm">Save</button>
    <div class="flex flex-wrap w-auto gap-x-5 gap-y-2 mt-0 ml-auto items-center justify-center">
      <span title="vim mode" @click="$notesiumState.editorVimMode = !$notesiumState.editorVimMode"
        class="cursor-pointer text-gray-400 hover:text-gray-700 text-xs font-mono mt-1">
        Vim
      </span>
      <span title="conceal formatting" @click="$notesiumState.editorConcealFormatting = !$notesiumState.editorConcealFormatting"
        class="cursor-pointer text-gray-400 hover:text-gray-700">
        <Icon name="outline-code" size="h-4 w-4" />
      </span>
      <span title="line wrapping" @click="$notesiumState.editorLineWrapping = !$notesiumState.editorLineWrapping"
        class="cursor-pointer text-gray-400 hover:text-gray-700 rotate-180">
        <Icon name="micro-arrow-uturn-right" size="h-3 w-3" />
      </span>
      <span title="links" @click="$emit('finder-open', '/api/raw/links?color=true&filename=' + note.Filename)"
        class="cursor-pointer text-gray-400 hover:text-gray-700">
        <Icon name="mini-arrows-right-left" size="h-3 w-3" />
      </span>
      <span title="graph panel" @click="$notesiumState.showGraphPanel=!$notesiumState.showGraphPanel"
        class="cursor-pointer text-gray-400 hover:text-gray-700">
        <Icon name="graph" size="h-3 w-3" />
      </span>
      <span title="delete note" @click="$emit('note-delete', note.Filename, note.Mtime)"
        class="cursor-pointer text-gray-400 hover:text-red-700">
        <Icon name="outline-trash" size="h-4 w-4" />
      </span>
      <a title="open via xdg" :href="'notesium://' + note.Path"
        class="cursor-pointer text-gray-400 hover:text-gray-700">
        <Icon name="outline-external-link" size="h-4 w-4" />
      </a>
      <span title="close" @click="$notesiumState.showNoteSidebar=false"
        class="cursor-pointer text-gray-400 hover:text-gray-700">
        <Icon name="mini-x-mark" size="h-4 w-4" />
      </span>
    </div>
  </div>

  <dl class="m-2 grid grid-cols-3 gap-2">
    <div class="overflow-hidden rounded-lg bg-gray-50 px-4 py-3 space-y-2">
      <dd class="text-sm font-semibold text-gray-700" v-text="note.Lines"></dd>
      <dt class="text-sm text-gray-400">Lines</dt>
    </div>
    <div class="overflow-hidden rounded-lg bg-gray-50 px-4 py-3 space-y-2">
      <dd class="text-sm font-semibold text-gray-700" v-text="note.Words"></dd>
      <dt class="text-sm text-gray-400">Words</dt>
    </div>
    <div class="overflow-hidden rounded-lg bg-gray-50 px-4 py-3 space-y-2">
      <dd class="text-sm font-semibold text-gray-700" v-text="note.Chars"></dd>
      <dt class="text-sm text-gray-400">Chars</dt>
    </div>
  </dl>

  <dl class="m-2 grid grid-cols-1 gap-2">
    <div class="overflow-hidden rounded-lg bg-gray-50 px-4 py-3 space-y-6">
      <div class="space-y-2">
        <dd class="text-sm font-semibold tracking-tight text-gray-700" v-text="formattedDate(note.Mtime)"></dd>
        <dt class="text-sm text-gray-400 hover:underline cursor-pointer flex items-center space-x-2"
          title="list notes modified same day"
          @click="$emit('finder-open', '/api/raw/list?color=true&date=2006-01-02&prefix=mtime&sort=mtime', note.Mtime.split('T')[0] + ' ')">
          <span>Modified</span>
          <Icon name="mini-bars-three-bottom-left" size="h-3 w-3" />
        </dt>
      </div>
      <div class="space-y-2">
        <dd class="text-sm font-semibold tracking-tight text-gray-700" v-text="formattedDate(note.Ctime)"></dd>
        <dt class="text-sm text-gray-400 hover:underline cursor-pointer flex items-center space-x-2"
          title="list notes created same day"
          @click="$emit('finder-open', '/api/raw/list?color=true&date=2006-01-02&prefix=ctime&sort=ctime', note.Ctime.split('T')[0] + ' ')">
          <span>Created</span>
          <Icon name="mini-bars-three-bottom-left" size="h-3 w-3" />
        </dt>
      </div>
    </div>
  </dl>

  <div class="m-2 overflow-hidden rounded-lg bg-gray-50 pl-4 pr-2 py-3">
    <div class="flex justify-between mt-1 mb-2 text-sm">
      <h3 class="leading-6 font-semibold tracking-tight text-gray-700">Links incoming</h3>
      <span class="text-gray-400 mr-2" v-text="countIncomingLinks"></span>
    </div>
    <LinkTree v-for="link in sortedIncomingLinks"
      :title="link.Title" :filename="link.Filename" :linenum="link.LineNumber" :key="link.Filename + link.LineNumber"
      @note-open="(...args) => $emit('note-open', ...args)" />

    <div class="flex justify-between mt-4 mb-2 text-sm">
      <h3 class="leading-6 font-semibold tracking-tight text-gray-700">Links outgoing</h3>
      <span class="text-gray-400 mr-2" v-text="countOutgoingLinks"></span>
    </div>
    <LinkTree v-for="link in existingOutgoingLinks"
      :title="link.Title" :filename="link.Filename" linenum="1" :key="link.Filename + link.LineNumber"
      @note-open="(...args) => $emit('note-open', ...args)" />

    <div v-for="link in danglingOutgoingLinks" class="flex justify-between text-sm text-red-700 my-1">
      <div class="overflow-hidden truncate">
        <span class="font-mono pr-2">!</span>
        <span class="cursor-pointer hover:underline"
          @click="$emit('note-open', note.Filename, link.LineNumber)"
          v-text="link.Filename + ' (line ' + link.LineNumber + ')'">
        </span>
      </div>
      <span class="mr-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-red-50 ring-red-500/10">dangling</span>
    </div>
  </div>

</aside>
</Pane>
`

import Pane from './pane.js'
import Icon from './icon.js'
import LinkTree from './link-tree.js'
import { formatDate } from './dateutils.js';
export default {
  components: { Pane, Icon, LinkTree },
  props: ['note'],
  emits: ['note-open', 'note-save', 'note-delete', 'finder-open'],
  methods: {
    formattedDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return formatDate(date, '%b %d %Y at %H:%M');
    },
  },
  computed: {
    sortedIncomingLinks() {
      return this.note.IncomingLinks?.sort((a, b) => a.Title.localeCompare(b.Title)) || [];
    },
    countIncomingLinks() {
      return this.note.IncomingLinks?.length || 0;
    },
    existingOutgoingLinks() {
      return this.note.OutgoingLinks?.filter(l => l.Title !== '') || [];
    },
    danglingOutgoingLinks() {
      return this.note.OutgoingLinks?.filter(l => l.Title == '') || [];
    },
    countOutgoingLinks() {
      return this.note.OutgoingLinks?.length || 0;
    },
  },
  template: t
}
