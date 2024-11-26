var t = `
<div class="h-full w-full overflow-y-scroll pb-6">
  <div class="relative flex-1 px-6 mt-2 space-y-6">

    <div class="rounded-md border border-gray-200">
      <div class="px-6 py-2 bg-gray-100 border-b border-gray-200 items-center justify-items-center">
        <span class="text-xs font-semibold leading-6 text-gray-900" v-text="settings.title"></span>
      </div>
      <div class="divide-y divide-gray-100 w-full">
        <div v-for="entry in settings.entries" :key="entry.name" class="px-6 py-2 flex w-full flex-none items-center justify-center justify-between">
          <span class="text-xs text-gray-900 font-medium leading-6 mt-1" v-text="entry.title"></span>
          <button @click="$notesiumState[entry.name] = !$notesiumState[entry.name]" type="button" role="switch"
            :class="$notesiumState[entry.name] ? 'bg-indigo-600' : 'bg-gray-200'"
            class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
                   transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2">
            <span aria-hidden="true"
              :class="$notesiumState[entry.name] ? 'translate-x-5' : 'translate-x-0'"
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
          </button>
        </div>
      </div>
    </div>

    <div v-for="keymap in keymaps" :key="keymap.name" class="rounded-md border border-gray-200">
      <div class="px-6 py-2 bg-gray-100 border-b border-gray-200 items-center justify-items-center">
        <details v-if="keymap.info" class="w-full">
          <summary class="flex w-full items-center py-px justify-between hover:cursor-pointer focus:outline-none">
            <span class="text-xs font-semibold leading-6 text-gray-900" v-text="keymap.title"></span>
            <span class="text-gray-600 hover:text-gray-900"><Icon name="outline-information-circle" size="h-4 w-4" /></span>
          </summary>
          <div class="py-3 text-xs text-gray-700 space-y-2 leading-6">
            <template v-if="keymap.name == 'vim'">
              <p>Vim mode attempts to emulate the most useful features of Vim
              as faithfully as possible, but is not a complete implementation.
              It does however feature the following:</p>
              <ul class="list-disc pl-4 space-y-2">
                <li>All common motions and operators, including text objects</li>
                <li>Operator motion orthogonality</li>
                <li>Commands for write and quit (:w :wq :q :q!)</li>
                <li>Visual mode - characterwise, linewise, blockwise</li>
                <li>Full macro support (q @)</li>
                <li>Folding support (za zo zc zO zC)</li>
                <li>Incremental highlighted search (/ ? # * g# g*)</li>
                <li>Search/replace with confirm (:substitute :%s)</li>
                <li>Search history</li>
                <li>Jump lists (C-o C-i)</li>
                <li>Sort (:sort)</li>
                <li>Marks (&#96; ')</li>
                <li>Cross-buffer yank/paste</li>
              </ul>
            </template>
            <template v-else-if="keymap.name == 'table'">
              <p>The editor will recognize when the cursor is placed within a
              table structure (identified by lines starting with the |
              character), and provide formatting and navigation.</p>
              <ul class="list-disc pl-4 space-y-2">
                <li><b>Automatic table formatting:</b> Pressing Tab not only
                navigates through the table but also automatically formats it.
                This includes adjusting cell padding to align text according
                to the column specifications defined in the header row.</li>
                <li><b>Column alignment:</b> The alignment for each column is
                determined by the syntax used in the header separator row
                (--- left, :---: center, ---: right).</li>
                <li><b>Dynamic column adjustment:</b> If the cursor is at the
                end of a row and Tab is pressed, a new column will be added.
                When the cursor is on the header row, pressing Tab ensures the
                header separator row exists and matches the column count of
                the header, adjusting as necessary.</li>
                <li><b>Concealment support:</b> When concealment is enabled,
                the formatting logic takes this into account, calculating the
                maximum length of each column without the concealed text,
                ensuring a visually consistent table layout.</li>
                <li><b>Navigation:</b> Move across table cells and rows with
                the provided keybindings.</li>
              </ul>
            </template>
          </div>
        </details>
        <span v-else class="text-xs font-semibold leading-6 text-gray-900" v-text="keymap.title"></span>
      </div>

      <div class="divide-y divide-gray-100 w-full">
        <div v-for="entry in keymap.entries" class="w-full flex px-6 py-2 text-xs items-center justify-items-center justify-between">
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
      settings: {
        name: 'settings',
        title: 'Settings',
        entries: [
          {name: 'editorVimMode', title: 'Vim mode'},
          {name: 'editorLineWrapping', title: 'Line wrapping'},
          {name: 'editorConcealFormatting', title: 'Conceal formatting'},
          {name: 'editorFoldGutter', title: 'Fold gutter'},
        ]
      },
      keymaps: [
        {
          name: 'default',
          title: 'Default mode',
          entries: [
            ['Tab', 'Enter editing mode (focus active note)', 'none'],
            ['C-s', 'Save note', 'all'],
            ['[[', 'Insert selected note link via Finder (mtime sorted)', 'edit'],
            ['Alt-k', 'Insert selected note link via Finder (mtime sorted)', 'edit'],
            ['Shift-Tab', 'Auto-indent current line or selection', 'edit'],
            ['C-]', 'Indent current line or selection', 'edit'],
            ['C-[', 'Dedent current line or selection', 'edit'],
            ['C-Enter', 'Toggle section fold', 'edit'],
            ['Esc', 'Exit editing mode (unfocus)', 'edit'],
          ]
        },
        {
          name: 'vim',
          title: 'Vim mode',
          info: true,
          entries: [
            ['Tab', 'Enter normal mode (focus active note)', 'none'],
            ['C-s', 'Save note and set normal mode', 'all'],
            ['C-h C-l C-6', 'Note tab keybinds passthrough', 'all'],
            ['space n <char>', 'Global keybinds passthrough', 'normal'],
            ['ge | gx', 'Open link under cursor', 'normal'],
            ['z<char> | C-Enter', 'Fold, unfold, toggle sections', 'normal'],
            ['[[', 'Insert selected note link via Finder (mtime sorted)', 'insert'],
            ['Alt-k', 'Insert selected note link via Finder (mtime sorted)', 'insert'],
            [':set [no]wrap', 'Set line wrapping', 'command'],
            [':set [no]conceal', 'Set conceal formatting', 'command'],
          ]
        },
        {
          name: 'table',
          title: 'Table formatting and navigation',
          info: true,
          entries: [
            ['Tab', 'Format table and advance column (right)', 'table'],
            ['Shift-Tab', 'Navigate to previous column (left)', 'table'],
            ['Alt-Arrow', 'Navigate rows and columns', 'table'],
          ]
        },
      ],
    }
  },
  template: t
}
