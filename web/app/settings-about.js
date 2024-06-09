var t = `
<div class="h-full w-full overflow-y-scroll pb-6">
  <div class="relative flex-1 px-6 mt-2">
    <div class="rounded-lg border border-gray-200">
      <dl class="flex flex-wrap">
        <div class="flex-auto pl-6 py-2 bg-gray-100 border-b border-gray-200">
          <dt class="text-xs font-semibold leading-6 text-gray-900">Resources</dt>
        </div>
        <div class="divide-y divide-gray-100 w-full">
          <a target="_blank" :href="resource[1]" v-for="resource in resources"
            class="flex w-full px-6 py-2 flex-none items-center justify-items-center justify-between hover:bg-gray-50">
            <dt class="text-xs font-medium leading-6 text-gray-900" v-text="resource[0]"></dt>
            <dd><Icon name="outline-external-link" size="h-4 w-4" /></dd>
          </a>
        </div>
      </dl>
    </div>
  </div>
</div>
`

import Icon from './icon.js'
export default {
  components: { Icon },
  data() {
    return {
      resources: [
        ['Website', 'https://www.notesium.com'],
        ['GitHub', 'https://github.com/alonswartz/notesium'],
        ['Report an issue', 'https://github.com/alonswartz/notesium/issues/new'],
      ],
    }
  },
  template: t
}
