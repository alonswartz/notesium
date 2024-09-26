var t = `
<div class="h-full w-full overflow-y-scroll pb-6">
  <div class="relative flex-1 px-6 mt-2 space-y-6">
    <div v-for="section in sections" :key="section.name" class="rounded-md border border-gray-200">
      <div class="pl-6 py-2 bg-gray-100 border-b border-gray-200 items-center justify-items-center">
        <span class="text-xs font-semibold leading-6 text-gray-900" v-text="section.title"></span>
      </div>
      <div class="divide-y divide-gray-100 w-full">
        <div v-for="entry in section.entries" class="w-full flex px-6 py-2 text-xs items-center justify-items-center justify-between">
          <div class="flex">
            <span v-if="entry[2]" class="text-gray-600 font-medium w-20 mt-1" v-text="entry[2]"></span>
            <span class="text-gray-900 font-medium mt-1" v-text="entry[1]"></span>
          </div>
          <span class="text-gray-900 font-mono bg-gray-200 rounded-md p-2 pb-1" v-text="entry[0]"></span>
        </div>
      </div>
    </div>
  </div>
</div>
`

export default {
  data() {
    return {
      sections: [
        {
          name: 'global',
          title: 'Global',
          entries: [
            ['space n n', 'Open new note for editing'],
            ['space n d', 'Open new or existing daily note'],
            ['space n w', 'Open new or existing weekly note'],
            ['space n l', 'Finder: List with prefixed label, sorted alphabetically'],
            ['space n c', 'Finder: List with prefixed date created, sorted by ctime'],
            ['space n m', 'Finder: List with prefixed date modified, sorted by mtime'],
            ['space n k', 'Finder: Links related notes to active note (or all if none open)'],
            ['space n s', 'Finder: Full text search across all notes'],
            ['space n g', 'Open fullscreen force graph view'],
          ]
        },
        {
          name: 'finder',
          title: 'Finder',
          entries: [
            ['C-p', 'Toggle preview'],
            ['↓ | C-j', 'Select next entry (down)'],
            ['↑ | C-k', 'Select previous entry (up)'],
            ['Enter', 'Submit selected entry'],
            ['Esc', 'Dismiss finder'],
          ]
        },
        {
          name: 'tabs',
          title: 'Note tabs',
          entries: [
            ['C-h', 'Switch to note tab on the left of the active note tab'],
            ['C-l', 'Switch to note tab on the right of the active note tab'],
            ['C-^ | C-6', 'Switch to previously active tab'],
          ]
        },
      ],
    }
  },
  template: t
}
