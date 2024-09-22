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
