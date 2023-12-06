var t = `
<div class="flex w-auto py-2 mt-0 ml-auto items-center space-x-5 pr-5">
  <span title="new" @click="$emit('note-new', '')"
    class="cursor-pointer text-gray-400 hover:text-gray-700">
    <Icon name="outline-plus" size="4" />
  </span>
  <span title="list" @click="$emit('filter-open', '/api/raw/list?color=true&prefix=label&sort=alpha')"
    class="cursor-pointer text-gray-400 hover:text-gray-700">
    <Icon name="mini-bars-three-bottom-left" size="4" />
  </span>
  <span title="links" @click="$emit('filter-open', '/api/raw/links?color=true')"
    class="cursor-pointer text-gray-400 hover:text-gray-700">
    <Icon name="mini-arrows-right-left" size="4" />
  </span>
  <span title="lines" @click="$emit('filter-open', '/api/raw/lines?color=true&prefix=title')"
    class="cursor-pointer text-gray-400 hover:text-gray-700">
    <Icon name="mini-magnifying-glass" size="4" />
  </span>
  <span title="settings" @click="$emit('settings-open')"
    class="cursor-pointer text-gray-400 hover:text-gray-700">
    <Icon name="outline-ellipsis-vertical" size="5" />
  </span>
</div>
`

import Icon from './icon.js'
export default {
  components: { Icon },
  emits: ['note-new', 'filter-open', 'settings-open'],
  template: t
}
