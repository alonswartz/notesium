var t = `
<div class="h-full w-full overflow-y-scroll pb-6">
  <div class="relative flex-1 px-6 mt-2 space-y-6">

    <div class="rounded-md border border-gray-200">
      <dl class="flex flex-wrap">
        <div class="flex-auto pl-6 py-2 bg-gray-100 border-b border-gray-200">
          <dt class="text-xs font-semibold leading-6 text-gray-900">Counts</dt>
        </div>
        <div class="divide-y divide-gray-100 w-full">
          <div v-for="stat in stats" :key="stat[0]" :title="stat[2]" @click="stat[3] ? $emit('finder-open', stat[3]) : undefined"
            :class="{'hover:bg-gray-50 cursor-pointer': stat[3]}"
            class="px-6 py-2 flex w-full flex-none items-center justify-center justify-between">
            <dt :class="stat[3] ? 'text-gray-900' : 'text-gray-600'" class="text-xs font-medium leading-6 flex" v-text="stat[1]"></dt>
            <dd :class="stat[3] ? 'text-gray-900' : 'text-gray-600'" class="text-xs font-mono leading-6" v-text="counts[stat[0]] || 'unknown'"></dd>
          </div>
        </div>
      </dl>
    </div>

  </div>
</div>
`

export default {
  emits: ['finder-open'],
  data() {
    return {
      counts: {},
      stats: [
        ['notes', 'Notes', 'All notes', '/api/raw/list?color=true&prefix=label&sort=alpha'],
        ['labels', 'Label notes', 'Notes with one-word titles', '/api/raw/list?color=true&labels=true&sort=alpha'],
        ['orphans', 'Orphan notes', 'Notes without incoming or outgoing links', '/api/raw/list?color=true&orphans=true&sort=alpha'],
        ['links', 'Links', 'Count of links', '/api/raw/links?color=true'],
        ['dangling', 'Dangling links', 'Count of broken links', '/api/raw/links?color=true&dangling=true'],
        ['lines', 'Lines', 'Count of lines spanning all notes', '/api/raw/lines?color=true&prefix=title'],
        ['words', 'Words', 'Count of words spanning all notes', null],
        ['chars', 'Characters', 'Count of characters spanning all notes', null],
      ],
    }
  },
  methods: {
    getCounts() {
      fetch('/api/raw/stats')
        .then(r => r.ok ? r.text() : r.text().then(e => Promise.reject(e)))
        .then(text => {
          this.counts = text.trim().split('\n').reduce((dict, line) => {
            const [key, val] = line.split(' '); dict[key] = val;
            return dict;
          }, {});
        })
        .catch(e => {
          console.error(e.Error);
        });
    },
  },
  created() {
    this.getCounts();
  },
  template: t
}
