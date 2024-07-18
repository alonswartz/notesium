var t = `
<div v-show="showDatePicker" @keyup.esc="$emit('periodic-close')" @click="$emit('periodic-close')" class="fixed inset-0 z-40" aria-hidden="true"></div>
<div v-if="showDatePicker" class="block absolute top-8 right-2 z-50 w-64 pt-3">
  <div class="rounded-md bg-white shadow-md border border-gray-200 p-3">
    <DatePicker :dottedDates="periodicNoteDates" @date-selected="(date) => periodicNoteDate = date" />
    <div class="flex space-x-2 items-center justify-items-center">
      <div @click="$emit('note-weekly', periodicNoteDate); $emit('periodic-close')"
        class="py-1 w-full text-xs text-center rounded-md hover:cursor-pointer hover:text-white bg-emerald-100 hover:bg-emerald-600 text-emerald-600">
        Weekly note
      </div>
      <div @click="$emit('note-daily', periodicNoteDate); $emit('periodic-close')"
        class="py-1 w-full text-xs text-center rounded-md hover:cursor-pointer hover:text-white bg-indigo-100 hover:bg-indigo-600 text-indigo-600">
        Daily note
      </div>
    </div>
  </div>
</div>
`

import DatePicker from './datepicker.js'
export default {
  components: { DatePicker },
  emits: ['note-daily', 'note-weekly', 'periodic-close'],
  data() {
    return {
      showDatePicker: false,
      periodicNoteDate: null,
      periodicNoteDates: {},
    }
  },
  methods: {
    fetchPeriodicNoteDates() {
      fetch('/api/raw/list?prefix=ctime&date=2006-01-02T15:04:05')
        .then(response => response.text())
        .then(text => {
          const dates = text.split('\n').reduce((acc, line) => {
            const parts = line.split(' ');
            if (parts.length > 1) {
              const date = parts[1].split('T')[0];
              const time = parts[1].split('T')[1];
              if (time === '00:00:00') {
                if (!acc[date]) acc[date] = [];
                if (!acc[date].includes('daily')) acc[date].push('daily');
              } else if (time === '00:00:01') {
                if (!acc[date]) acc[date] = [];
                if (!acc[date].includes('weekly')) acc[date].push('weekly');
              }
            }
            return acc;
          }, {});
          this.periodicNoteDates = dates;
          this.showDatePicker = true;
        });
    },
  },
  created() {
    this.fetchPeriodicNoteDates();
  },
  template: t
}
