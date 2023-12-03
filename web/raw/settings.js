var t = `
<div @keyup.esc="$emit('settings-close');" class="relative inset-0 z-50" aria-labelledby="settings" role="dialog" aria-modal="true">
  <div @click="$emit('settings-close');" class="fixed inset-0" aria-hidden="true"></div>
  <div class="absolute inset-0 overflow-hidden">
    <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
      <div class="pointer-events-auto w-screen max-w-2xl">
        <div class="flex h-full flex-col overflow-y-scroll bg-white pb-6 shadow-xl">
          <div class="relative mt-4 flex-1 px-4 sm:px-6">
            <div class="relative group flex items-center justify-items-center justify-between space-x-2 pb-2 border-b border-gray-200">
              <input ref="queryInput" v-model="query" autofocus placeholder="keybindings search..." autocomplete="off" spellcheck="false"
                @blur="$refs.queryInput && $refs.queryInput.focus()"
                class="h-12 bg-gray-100 w-full border-0 my-2 rounded-lg px-4 text-gray-900 placeholder:text-gray-400 ring-0 focus:outline-none text-sm" />
            </div>
            <dl class="mt-2 space-y-2 divide-y divide-gray-100 text-xs">
              <div v-for="keybind in filteredItems" class="pt-2 sm:flex items-center">
                <dt class="font-medium text-gray-900 hover:underline cursor-pointer sm:w-16 flex-none" v-text="keybind[0]" @click="query=keybind[0]"></dt>
                <dd class="flex justify-between gap-x-6 items-center sm:flex-auto">
                  <span class="text-gray-600" v-text="keybind[3]"></span>
                  <span class="text-gray-900 font-mono bg-gray-200 rounded-md px-2 pt-2 pb-1" v-text="keybind[2]"></span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`

export default {
  emits: ['settings-close'],
  data() {
    return {
      query: '',
      keybinds: [
        ['global', 'note-new', 'space n n', 'Open new note for editing'],
        ['global', 'filter-open-list-default', 'space n l', 'Open list with prefixed label, sorted alphabetically'],
        ['global', 'filter-open-list-ctime', 'space n c', 'Open list with prefixed date created, sorted by ctime'],
        ['global', 'filter-open-list-mtime', 'space n m', 'Open list with prefixed date modified, sorted by mtime'],
        ['global', 'filter-open-links', 'space n k', 'Open list of related notes to open note, or all note links if none open'],
        ['global', 'filter-open-search', 'space n s', 'Open full text search'],
        ['filter', 'filter-entry-next', 'ctrl j', 'Select next entry'],
        ['filter', 'filter-entry-previous', 'ctrl k', 'Select previous entry'],
        ['filter', 'filter-entry-select', 'enter', 'Submit selected entry'],
        ['filter', 'filter-preview-toggle', 'ctrl p', 'Toggle preview'],
        ['filter', 'filter-dismiss', 'esc', 'Dismiss filter'],
        ['note', 'note-insert-link', '[[', 'Insert note link from note list selection'],
        ['note', 'note-save', 'ctrl s', 'Save note'],
        ['note', 'note-focus', 'tab', 'Insert editing mode'],
        ['note', 'note-unfocus', 'esc', 'Exit editing mode'],
        ['tab', 'tab-next', 'ctrl j', 'Switch to next tab'],
        ['tab', 'tab-previous', 'ctrl k', 'Switch to previous tab'],
      ]
    }
  },
  computed: {
    filteredItems() {
      const queryWords = this.query.toLowerCase().split(' ');
      return !this.query
        ? this.keybinds
        : this.keybinds.filter(item => 
            queryWords.every(queryWord => 
              item[0].toLowerCase().includes(queryWord) || 
              item[1].toLowerCase().includes(queryWord) ||
              item[3].toLowerCase().includes(queryWord)
            )
          );
    },
  },
  created() {
    this.$nextTick(() => { this.$refs.queryInput.focus(); });
  },
  template: t
}
