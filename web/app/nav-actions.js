var t = `
<div class="flex w-auto py-2 mt-0 ml-auto items-center space-x-5 pr-5">
  <span title="new" @click="$emit('note-new')"
    class="cursor-pointer text-gray-400 hover:text-gray-700">
    <Icon name="outline-plus" size="h-4 w-4" />
  </span>

  <div class="relative group inline-block text-left">
    <!-- only getDaily notes on click if enabling -->
    <span title="daily" @click="toggleDatePicker()"
      class="cursor-pointer text-gray-400 hover:text-gray-700">
      <Icon name="outline-calendar" size="h-4 w-4" />
    </span>
    <div v-show="showDatePicker" @click="toggleDatePicker()" class="fixed inset-0 z-40" aria-hidden="true"></div>
    <div v-if="showDatePicker" class="block absolute right-0 z-50 w-64 pt-3 -mt-1 origin-top-right">
      <div class="rounded-md bg-white shadow-md border border-gray-200 p-3">
        <DatePicker :dottedDates="dailyNoteDates" @date-selected="(date) => dailyNoteDate = date" />
        <div @click="$emit('note-daily', dailyNoteDate); toggleDatePicker();"
          class="bg-indigo-500 hover:bg-indigo-400 hover:cursor-pointer py-1 text-sm text-center text-white rounded-md shadow-sm">
          Daily note ({{ formattedDailyNoteDate }})
        </div>
      </div>
    </div>
  </div>

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
          <li v-for="entry in panelsDropdownEntries" :key="entry.key" @click="$notesiumState[entry.key] = !$notesiumState[entry.key]"
            class="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer" >
            <div class="flex space-x-4 select-none">
              <span class="text-gray-400"><Icon :name="entry.icon" size="h-5 w-5" /></span>
              <p class="text-sm text-gray-600" v-text="entry.title"></p>
            </div>
            <span v-show="$notesiumState[entry.key]" class="text-indigo-600">
              <Icon name="mini-check" size="h-5 w-5" />
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>

  <span v-if="versionCheck.comparison == '-1'" title="An update is available" @click="$emit('settings-open')"
    class="py-1 -my-1 cursor-pointer text-red-700 hover:text-red-700 bg-red-100 hover:bg-red-200 ring-1 ring-inset ring-red-700 rounded-2xl">
    <div class="flex items-center justify-items-center px-1">
      <span class="text-xs mt-1 pl-2 font-semibold ">Update</span>
      <Icon name="outline-ellipsis-vertical" size="h-5 w-5" />
    </div>
  </span>
  <span v-else title="settings" @click="$emit('settings-open')"
    class="cursor-pointer text-gray-400 hover:text-gray-700">
    <Icon name="outline-ellipsis-vertical" size="h-5 w-5" />
  </span>

</div>
`

import Icon from './icon.js'
import DatePicker from './datepicker.js'
export default {
  components: { Icon, DatePicker },
  props: ['versionCheck'],
  emits: ['note-new', 'note-daily', 'finder-open', 'settings-open', 'graph-open'],
  data() {
    return {
      panelsDropdownEntries: [
        { title: "Labels panel",  key: 'showLabelsPanel', icon: "outline-tag" },
        { title: "Notes panel",   key: 'showNotesPanel',  icon: "outline-queue-list" },
        { title: "Note metadata", key: 'showNoteSidebar', icon: "panel-right" },
      ],
      showDatePicker: null,
      dailyNoteDate: null,
      dailyNoteDates: new Set(),
    }
  },
  methods: {
    toggleDatePicker() {
      if (this.showDatePicker) {
        this.showDatePicker = false;
        this.dailyNoteDates = new Set();
        return;
      }
      fetch('/api/raw/list?prefix=ctime&date=2006-01-02T15:04:05')
        .then(response => response.text())
        .then(text => {
          const dates = text.split('\n').reduce((acc, line) => {
            const parts = line.split(' ');
            if (parts.length > 1 && parts[1].endsWith('00:00:00')) {
              acc.add(parts[1].split('T')[0]);
            }
            return acc;
          }, new Set());
          this.dailyNoteDates = dates;
          this.showDatePicker = true;
        });
    },
  },
  computed: {
    formattedDailyNoteDate() {
      const date = new Date(this.dailyNoteDate);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('default', { month: 'short' });
      return `${month} ${day}`;
    },
  },
  template: t
}
