var t = `
<div class="mx-auto w-96">
  <h3 class="mt-40 font-medium text-gray-400 text-xl mx-auto text-center">notesium</h3>
  <div class="mt-10">
    <template v-for="entry in entries">
      <div class="flex items-center justify-between p-4 text-sm font-medium cursor-pointer hover:bg-gray-100 rounded-xl"
        @click="$emit(entry.emit[0], entry.emit[1])">
        <div class="flex items-center space-x-4 text-gray-500">
          <Icon :name="entry.icon" size="h-4 w-4" />
          <span v-text="entry.title"></span>
        </div>
        <span class="whitespace-nowrap text-gray-900 font-mono mt-1" v-text="entry.keybind"></span>
      </div>
    </template>
  </div>
</div>
`

import Icon from './icon.js'
export default {
  components: { Icon },
  emits: ['note-new', 'finder-open'],
  data() {
    return {
      entries: [
        {
          title: 'New note',
          keybind: 'space n n',
          icon: 'outline-plus',
          emit: ['note-new', ''],
        },
        {
          title: 'List notes',
          keybind: 'space n l',
          icon: 'mini-bars-three-bottom-left',
          emit: ['finder-open', '/api/raw/list?color=true&prefix=label&sort=alpha'],
        },
        {
          title: 'Search notes',
          keybind: 'space n s',
          icon: 'mini-magnifying-glass',
          emit: ['finder-open', '/api/raw/lines?color=true&prefix=title'],
        },
        {
          title: 'Graph view',
          keybind: 'space n g',
          icon: 'graph',
          emit: ['graph-open'],
        },
      ],
    }
  },
  template: t
}
