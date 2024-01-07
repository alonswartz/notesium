var t = `
<aside class="flex-none overflow-y-auto my-2 mr-2 w-[28rem] rounded-lg border border-gray-200 bg-white">

  <div class="flex p-2 border-b sticky top-0 z-10 bg-white">
    <button type="button" :disabled="!note.isModified" @click="$emit('note-save')"
      :class="note.isModified ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-300 text-gray-400'"
      class="rounded px-10 pt-2 pb-1 text-xs shadow-sm">Save</button>
    <div class="flex w-auto mt-0 ml-auto items-center space-x-5 pr-1">
      <span title="conceal formatting" @click="$emit('conceal-toggle')" class="cursor-pointer text-gray-400 hover:text-gray-700">
        <Icon name="outline-code" size="h-4 w-4" />
      </span>
      <span title="links" @click="$emit('finder-open', '/api/raw/links?color=true&filename=' + note.Filename)"
        class="cursor-pointer text-gray-400 hover:text-gray-700">
        <Icon name="mini-arrows-right-left" size="h-3 w-3" />
      </span>
      <a title="open via xdg" :href="'notesium://' + note.Path" class="text-gray-400 hover:text-gray-700">
        <Icon name="outline-external-link" size="h-4 w-4" />
      </a>
    </div>
  </div>

  <dl class="m-2 grid grid-cols-3 gap-2">
    <div class="overflow-hidden rounded-lg bg-gray-50 px-4 py-2">
      <dd class="mt-1 text-sm font-semibold tracking-tight text-gray-900" v-text="note.Lines"></dd>
      <dt class="text-sm font-medium text-gray-500">Lines</dt>
    </div>
    <div class="overflow-hidden rounded-lg bg-gray-50 px-4 py-2">
      <dd class="mt-1 text-sm font-semibold tracking-tight text-gray-900" v-text="note.Words"></dd>
      <dt class="text-sm font-medium text-gray-500">Words</dt>
    </div>
    <div class="overflow-hidden rounded-lg bg-gray-50 px-4 py-2">
      <dd class="mt-1 text-sm font-semibold tracking-tight text-gray-900" v-text="note.Chars"></dd>
      <dt class="text-sm font-medium text-gray-500">Chars</dt>
    </div>
  </dl>

  <dl class="m-2 grid grid-cols-1 gap-2">
    <div class="overflow-hidden rounded-lg bg-gray-50 px-4 py-2">
      <dd class="mt-1 text-sm font-semibold tracking-tight text-gray-900" v-text="formatDate(note.Mtime)"></dd>
      <dt class="text-sm font-medium text-gray-500 hover:text-gray-700 hover:cursor-pointer flex items-center space-x-1"
        title="list notes modified same day"
        @click="$emit('finder-open', '/api/raw/list?color=true&date=2006-01-02&prefix=mtime&sort=mtime', note.Mtime.split('T')[0] + ' ')">
        <span>Modified</span>
        <Icon name="mini-bars-three-bottom-left" size="h-3 w-3" />
      </dt>
      <dd class="mt-4 text-sm font-semibold tracking-tight text-gray-900" v-text="formatDate(note.Ctime)"></dd>
      <dt class="text-sm font-medium text-gray-500 hover:text-gray-700 hover:cursor-pointer flex items-center space-x-1"
        title="list notes created same day"
        @click="$emit('finder-open', '/api/raw/list?color=true&date=2006-01-02&prefix=ctime&sort=ctime', note.Ctime.split('T')[0] + ' ')">
        <span>Created</span>
        <Icon name="mini-bars-three-bottom-left" size="h-3 w-3" />
      </dt>
    </div>
  </dl>

  <div class="m-2 overflow-hidden rounded-lg bg-gray-50 pl-4 pr-2 py-2">
    <div class="flex justify-between mt-1 mb-2 text-sm">
      <h3 class="font-semibold text-gray-900">Incoming links</h3>
      <span class="font-medium text-gray-500 mr-2" v-text="countIncomingLinks"></span>
    </div>
    <LinkTree v-for="link in sortedIncomingLinks"
      :title="link.Title" :filename="link.Filename" :linenum="link.LineNumber" :key="link.Filename + link.LineNumber"
      @note-open="(...args) => $emit('note-open', ...args)" />

    <div class="flex justify-between mt-4 mb-2 text-sm">
      <h3 class="font-semibold text-gray-900">Outgoing links</h3>
      <span class="font-medium text-gray-500 mr-2" v-text="countOutgoingLinks"></span>
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
`

import Icon from './icon.js'
import LinkTree from './link-tree.js'
export default {
  components: { Icon, LinkTree },
  props: ['note'],
  emits: ['note-open', 'note-save', 'finder-open', 'conceal-toggle'],
  methods: {
    formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      const formattedDate = `${day} ${month} ${year}`;
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      return `${formattedDate} at ${formattedTime}`;
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