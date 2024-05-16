var t = `
<div class="flex w-auto py-2 mt-0 ml-auto items-center space-x-5 pr-5">
  <span title="new" @click="$emit('note-new')"
    class="cursor-pointer text-gray-400 hover:text-gray-700">
    <Icon name="outline-plus" size="h-4 w-4" />
  </span>
  <span title="daily" @click="$emit('note-daily')"
    class="cursor-pointer text-gray-400 hover:text-gray-700">
    <Icon name="outline-calendar" size="h-4 w-4" />
  </span>
  <span title="list" @click="$emit('finder-open', '/api/raw/list?color=true&prefix=label&sort=alpha')"
    class="cursor-pointer text-gray-400 hover:text-gray-700">
    <Icon name="mini-bars-three-bottom-left" size="h-4 w-4" />
  </span>
  <span title="links" @click="$emit('finder-open', '/api/raw/links?color=true')"
    class="cursor-pointer text-gray-400 hover:text-gray-700">
    <Icon name="mini-arrows-right-left" size="h-4 w-4" />
  </span>
  <span title="lines" @click="$emit('finder-open', '/api/raw/lines?color=true&prefix=title')"
    class="cursor-pointer text-gray-400 hover:text-gray-700">
    <Icon name="mini-magnifying-glass" size="h-4 w-4" />
  </span>
  <span title="graph" @click="$emit('graph-open')"
    class="cursor-pointer text-gray-400 hover:text-gray-700">
    <Icon name="graph" size="h-4 w-4" />
  </span>

  <div class="relative group inline-block text-left">
    <span title="panels" class="cursor-pointer text-gray-400 group-hover:text-gray-700">
      <Icon name="outline-view-columns" size="h-5 w-5" />
    </span>
    <div class="hidden group-hover:block absolute right-0 z-50 w-64 pt-3 -mt-1 origin-top-right">
      <div class="rounded-md bg-white shadow-md border border-gray-200">
        <ul class="divide-y divide-gray-100">
          <li v-for="entry in panelsDropdownEntries" :key="entry.prop" @click="$emit(entry.emit)"
            class="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer" >
            <div class="flex space-x-4 select-none">
              <span class="text-gray-400"><Icon :name="entry.icon" size="h-5 w-5" /></span>
              <p class="text-sm text-gray-600" v-text="entry.title"></p>
            </div>
            <span v-show="this[entry.prop]" class="text-indigo-600">
              <Icon name="mini-check" size="h-5 w-5" />
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>

  <span title="settings" @click="$emit('settings-open')"
    class="cursor-pointer text-gray-400 hover:text-gray-700">
    <Icon name="outline-ellipsis-vertical" size="h-5 w-5" />
  </span>
</div>
`

import Icon from './icon.js'
export default {
  components: { Icon },
  props: ['showNoteSidebar', 'showLabelsPanel', 'showNotesPanel'],
  emits: ['note-new', 'note-daily', 'finder-open', 'settings-open', 'graph-open', 'notesidebar-toggle', 'notespanel-toggle', 'labelspanel-toggle'],
  data() {
    return {
      panelsDropdownEntries: [
        { title: "Labels panel",  emit: "labelspanel-toggle", prop: 'showLabelsPanel', icon: "outline-tag" },
        { title: "Notes panel",   emit: "notespanel-toggle",  prop: 'showNotesPanel',  icon: "outline-queue-list" },
        { title: "Note metadata", emit: "notesidebar-toggle", prop: 'showNoteSidebar', icon: "panel-right", },
      ],
    }
  },
  template: t
}
