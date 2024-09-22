var t = `
<div class="h-full w-full overflow-y-scroll pb-6">
  <div class="relative flex-1 px-6 mt-2 space-y-6">
    <div v-for="section in sections" :key="section.name" class="rounded-md border border-gray-200">

      <div class="px-6 py-2 bg-gray-100 border-b border-gray-200 items-center justify-items-center">
        <details v-if="section.name == 'vim'" class="w-full">
          <summary class="flex w-full items-center py-px justify-between hover:cursor-pointer focus:outline-none">
            <span class="text-xs font-semibold leading-6 text-gray-900" v-text="section.title"></span>
            <span class="text-gray-600 hover:text-gray-900"><Icon name="outline-information-circle" size="h-4 w-4" /></span>
          </summary>
          <div class="py-3 text-xs text-gray-700 space-y-2 leading-6">
            <p>Vim mode attempts to emulate the most useful features of Vim as
            faithfully as possible, but is not a complete implementation. It
            does however feature the following:</p>
            <ul class="list-disc pl-4 space-y-2">
              <li>All common motions and operators, including text objects</li>
              <li>Operator motion orthogonality</li>
              <li>Commands for write and quit (:q :q! :w :wq)</li>
              <li>Visual mode - characterwise, linewise, blockwise</li>
              <li>Full macro support (q @)</li>
              <li>Incremental highlighted search (/ ? # * g# g*)</li>
              <li>Search/replace with confirm (:substitute :%s)</li>
              <li>Search history</li>
              <li>Jump lists (ctrl-o ctrl-i)</li>
              <li>Sort (:sort)</li>
              <li>Marks (&#96; ')</li>
              <li>Cross-buffer yank/paste</li>
            </ul>
          </div>
        </details>
        <span v-else class="text-xs font-semibold leading-6 text-gray-900" v-text="section.title"></span>
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

import Icon from './icon.js'
export default {
  components: { Icon },
  data() {
    return {
      sections: [
        {
          name: 'default',
          title: 'Default mode',
          entries: [
            ['tab', 'Enter editing mode (focus active note)', 'none'],
            ['ctrl s', 'Save note', 'all'],
            ['[[', 'Insert note link from note list selection', 'edit'],
            ['shift tab', 'Auto-indent current line or selection', 'edit'],
            ['ctrl ]', 'Indent current line or selection', 'edit'],
            ['ctrl [', 'Dedent current line or selection', 'edit'],
            ['esc', 'Exit editing mode (unfocus)', 'edit'],
          ]
        },
        {
          name: 'vim',
          title: 'Vim mode',
          entries: [
            ['tab', 'Enter normal mode (focus active note)', 'none'],
            ['ctrl s', 'Save note and set normal mode', 'all'],
            ['ctrl h|l|6', 'Note tab keybinds passthrough', 'all'],
            ['space n <char>', 'Global keybinds passthrough', 'normal'],
            ['ge | gx', 'Open link under cursor', 'normal'],
            ['[[', 'Insert note link from note list selection', 'insert'],
            [':set [no]wrap', 'Set line wrapping', 'command'],
            [':set [no]conceal', 'Set conceal formatting', 'command'],
          ]
        },
        {
          name: 'table',
          title: 'Table formatting and navigation',
          entries: [
            ['tab', 'Format table and advance column (right)', 'table'],
            ['shift tab', 'Navigate to previous column (left)', 'table'],
            ['alt arrow', 'Navigate rows and columns', 'table'],
          ]
        },
      ],
    }
  },
  template: t
}
