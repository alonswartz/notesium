var t = `
<div class="flex-none h-full drop-shadow-md w-12 px-2 divide-y border-r divide-gray-600 border-gray-600 bg-gray-700 text-gray-400">

  <div class="flex flex-col items-center justify-items-center py-0.5">
    <span title="New note" @click="$emit('note-new', '')"
      class="p-2 cursor-pointer rounded-md hover:text-gray-100 hover:bg-gray-600">
      <Icon name="outline-plus" size="h-4 w-4" />
    </span>
  </div>

  <div class="flex flex-col items-center justify-items-center py-2 space-y-2">
    <span title="Labels panel" @click="$notesiumState.showLabelsPanel=!$notesiumState.showLabelsPanel"
      :class="{'text-gray-100': $notesiumState.showLabelsPanel}"
      class="p-2 cursor-pointer rounded-md hover:text-gray-100 hover:bg-gray-600">
      <Icon name="outline-tag" size="h-4 w-4" />
    </span>
    <span title="Notes list panel" @click="$notesiumState.showNotesPanel=!$notesiumState.showNotesPanel"
      :class="{'text-gray-100': $notesiumState.showNotesPanel}"
      class="p-2 cursor-pointer rounded-md hover:text-gray-100 hover:bg-gray-600">
      <Icon name="outline-queue-list" size="h-4 w-4" />
    </span>
    <span title="Graph panel" @click="$notesiumState.showGraphPanel=!$notesiumState.showGraphPanel"
      :class="{'text-gray-100': $notesiumState.showGraphPanel}"
      class="p-2 cursor-pointer rounded-md hover:text-gray-100 hover:bg-gray-600">
      <Icon name="graph" size="h-4 w-4" />
    </span>
    <span title="Periodic notes" @click="$emit('periodic-open')"
      :class="{'text-gray-100': showPeriodic}"
      class="p-2 cursor-pointer rounded-md hover:text-gray-100 hover:bg-gray-600">
      <Icon name="outline-calendar" size="h-4 w-4" />
    </span>
  </div>

  <div class="flex flex-col items-center justify-items-center py-2 space-y-2">
    <span title="Search notes" @click="$emit('finder-open', '/api/raw/lines?color=true&prefix=title')"
      class="p-2 cursor-pointer rounded-md hover:text-gray-100 hover:bg-gray-600">
      <Icon name="mini-magnifying-glass" size="h-4 w-4" />
    </span>
    <span title="List notes" @click="$emit('finder-open', '/api/raw/list?color=true&prefix=label&sort=alpha')"
      class="p-2 cursor-pointer rounded-md hover:text-gray-100 hover:bg-gray-600">
      <Icon name="mini-bars-three-bottom-left" size="h-4 w-4" />
    </span>
    <span title="List notes (modified)" @click="$emit('finder-open', '/api/raw/list?color=true&prefix=mtime&sort=mtime')"
      class="p-2 pb-1 pr-1 cursor-pointer rounded-md hover:text-gray-100 hover:bg-gray-600">
      <Icon name="outline-bars-arrow-down" size="h-5 w-5" />
    </span>
    <span title="List links" @click="$emit('finder-open', '/api/raw/links?color=true')"
      class="p-2 cursor-pointer rounded-md hover:text-gray-100 hover:bg-gray-600">
      <Icon name="mini-arrows-right-left" size="h-4 w-4" />
    </span>
    <span title="List broken links" @click="$emit('finder-open', '/api/raw/links?color=true&dangling=true')"
      class="p-2 cursor-pointer rounded-md hover:text-gray-100 hover:bg-gray-600">
      <Icon name="outline-link-slash" size="h-4 w-4" />
    </span>
    <span title="Graph view" @click="$emit('graph-open')"
      class="p-2 cursor-pointer rounded-md hover:text-gray-100 hover:bg-gray-600">
      <Icon name="graph" size="h-4 w-4" />
    </span>
  </div>

  <div class="flex flex-col items-center justify-items-center py-2 space-y-2">
    <span :title="updateAvailable ? 'An update is available' : 'Settings'" @click="$emit('settings-open')"
      class="p-2 cursor-pointer rounded-md hover:text-gray-100 hover:bg-gray-600">
      <div :class="{'rounded-full -m-1 p-1 bg-red-500 text-gray-100': updateAvailable}">
        <Icon name="outline-adjustments-horizontal" size="h-5 w-5" />
      </div>
    </span>
  </div>

</div>
`

import Icon from './icon.js'
export default {
  components: { Icon },
  props: ['versionCheck', 'showPeriodic'],
  emits: ['note-new', 'finder-open', 'periodic-open', 'settings-open', 'graph-open'],
  computed: {
    updateAvailable() {
      return this.versionCheck.comparison == '-1';
    },
  },
  template: t
}
