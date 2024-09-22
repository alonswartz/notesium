var t = `
<div @keyup.esc="$emit('settings-close');" class="relative inset-0 z-50" aria-labelledby="settings" role="dialog" aria-modal="true">
  <div @click="$emit('settings-close');" class="fixed inset-0" aria-hidden="true"></div>
  <div class="absolute inset-0 overflow-hidden">
    <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
      <div class="pointer-events-auto">
        <div class="flex h-full bg-white shadow-xl">
          <div class="flex-col h-full w-48 bg-gray-100 border-x border-gray-200">
            <ul class="space-y-1 cursor-pointer mt-2 p-2 text-sm">
              <li v-for="section in sections"
                @click="active=section[0]" :class="{'bg-gray-200': active == section[0] }"
                class="flex justify-between p-2 rounded-md text-gray-800 hover:bg-gray-200">
                <span class="overflow-hidden truncate pr-2" v-text="section[1]" />
                <span class="text-gray-500 hover:text-gray-100"></span>
              </li>
            </ul>
          </div>
          <div class="h-full w-[40rem] pr-1 mt-2">
            <KeyBinds v-if="active == 'keybinds'" />
            <Editor v-else-if="active == 'editor'" />
            <Stats v-else-if="active == 'stats'" @finder-open="(...args) => $emit('finder-open', ...args)" />
            <About v-else-if="active == 'about'" @version-check="(...args) => $emit('version-check', ...args)" :versionCheck=versionCheck />
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`

import KeyBinds from './settings-keybinds.js'
import Editor from './settings-editor.js'
import About from './settings-about.js'
import Stats from './settings-stats.js'
export default {
  components: { KeyBinds, Editor, About, Stats },
  props: ['versionCheck'],
  emits: ['settings-close', 'version-check', 'finder-open'],
  data() {
    return {
      active: 'keybinds',
      sections: [
        ['keybinds', 'Key Bindings'],
        ['editor', 'Editor'],
        ['stats', 'Statistics'],
        ['about', 'About'],
      ],
    }
  },
  created() {
    if (this.versionCheck.comparison == '-1') this.active = 'about';
  },
  template: t
}
