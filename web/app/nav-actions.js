var t = `
<div class="flex w-auto py-2 mt-0 ml-auto items-center space-x-5 pr-5">
  <span title="new" @click="$emit('note-new', '')"
    class="cursor-pointer text-gray-400 hover:text-gray-700">
    <Icon name="outline-plus" size="h-4 w-4" />
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
  <a title="graph" target="_blank" href="/graph/?noxdg"
    class="cursor-pointer text-gray-400 hover:text-gray-700">
    <Icon name="graph" size="h-4 w-4" />
  </a>
  <span title="settings" @click="$emit('settings-open')"
    class="cursor-pointer text-gray-400 hover:text-gray-700">
    <Icon name="outline-ellipsis-vertical" size="h-5 w-5" />
  </span>
</div>
`

import Icon from './icon.js'
export default {
  components: { Icon },
  emits: ['note-new', 'finder-open', 'settings-open'],
  template: t
}
