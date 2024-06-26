var t = `
<div>

  <div class="flex items-center pl-1 pr-2">
    <h2 class="flex-auto text-sm text-gray-900" v-text="formattedMonthYear"></h2>
    <div class="flex space-x-4 -mr-2">
      <button @click="changeMonth(-1)" type="button" class="flex flex-none items-center justify-center text-gray-400 hover:text-gray-500">
        <span class="sr-only">Previous month</span>
        <Icon name="chevron-right" size="h-5 w-5" class="rotate-180"/>
      </button>
      <button @click="setSelectedDate(this.today)" type="button" class="flex flex-none items-center justify-center text-gray-400 hover:text-gray-500">
        <span class="text-xs mt-1">Today</span>
      </button>
      <button @click="changeMonth(1)" type="button" class="flex flex-none items-center justify-center text-gray-400 hover:text-gray-500">
        <span class="sr-only">Next month</span>
        <Icon name="chevron-right" size="h-5 w-5" />
      </button>
    </div>
  </div>

  <div class="mt-5 grid grid-cols-7 text-center text-xs leading-6 text-gray-500" style="font-size: 0.65rem;">
    <div v-for="(day, index) in sortedDaysOfWeek" :key="day" v-text="day" class="hover:cursor-pointer hover:underline"
      title="set as start of week" @click="$notesiumState.startOfWeek = ($notesiumState.startOfWeek + index) % 7"></div>
  </div>

  <div class="mt-2 grid grid-cols-7 pb-4 select-none" style="font-size: 0.65rem;">
    <div v-for="day in displayedMonthDates" :key="day.date" class="flex flex-col py-0.5">
      <button type="button" @click="setSelectedDate(day.date)" @dblclick="$emit('date-dblclick', day.date)"
        class="mx-auto flex h-6 w-6 items-center justify-center rounded-full"
        :class="[
          selectedDate === day.date ? 'text-white' : day.isToday ? 'text-indigo-500' : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400',
          selectedDate === day.date ? (day.isToday ? 'bg-indigo-500' : 'bg-gray-500') : 'hover:bg-gray-200',
          (selectedDate === day.date || day.isToday) ? 'font-semibold' : '']">
        <span v-text="day.day"></span>
      </button>
      <span v-show="dottedDates.has(day.date)"
        :class="selectedDate == day.date ? 'text-white' : 'text-gray-300'"
        class="text-center -mt-2.5 h-3 hover:cursor-pointer">•</span>
    </div>
  </div>

</div>
`

import Icon from './icon.js'
export default {
  props: {
    dottedDates: { type: Set, default: new Set() },
  },
  emits: ['date-selected', 'date-dblclick'],
  components: { Icon },
  data() {
    return {
      today: null,
      selectedDate: null,
      displayedMonth: null,
    }
  },
  methods: {
    getCalendarDays(year, month) {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0); // Last day of the month
      const days = [];

      // Previous month days
      let startDayOfWeek = startDate.getDay() - this.$notesiumState.startOfWeek;
      if (startDayOfWeek < 0) startDayOfWeek += 7;
      for (let i = startDayOfWeek; i > 0; i--) {
        const date = new Date(year, month, 1 - i);
        days.push({
          date: this.formatDateToISOString(date),
          day: date.getDate(),
        });
      }

      // Current month days
      for (let day = 1; day <= endDate.getDate(); day++) {
        const date = new Date(year, month, day);
        const dateStr = this.formatDateToISOString(date);
        days.push({
          date: dateStr,
          day: day,
          isCurrentMonth: true,
          isToday: dateStr === this.today,
        });
      }

      // Next month days to complete the week
      let endDayOfWeek = endDate.getDay();
      let daysToAdd = 6 - ((endDayOfWeek - this.$notesiumState.startOfWeek + 7) % 7);
      for (let i = 1; i <= daysToAdd; i++) {
        const date = new Date(year, month + 1, i);
        days.push({
          date: this.formatDateToISOString(date),
          day: date.getDate(),
        });
      }

      return days;
    },
    setSelectedDate(dateStr) {
      this.selectedDate = dateStr;
      this.$emit('date-selected', this.selectedDate);
      const dateParts = this.selectedDate.split('-');
      const selectedYear = parseInt(dateParts[0], 10);
      const selectedMonth = parseInt(dateParts[1], 10);
      const displayedMonthDate = new Date(this.displayedMonth);
      if (selectedYear !== displayedMonthDate.getFullYear() || selectedMonth !== displayedMonthDate.getMonth() + 1) {
        this.displayedMonth = new Date(selectedYear, selectedMonth - 1, 1);
      }
    },
    changeMonth(increment) {
      this.displayedMonth = new Date(this.displayedMonth.getFullYear(), this.displayedMonth.getMonth() + increment, 1);
    },
    formatDateToISOString(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
  },
  computed: {
    formattedMonthYear() {
      return this.displayedMonth.toLocaleString('default', { month: 'short', year: 'numeric' });
    },
    displayedMonthDates() {
      const year = this.displayedMonth.getFullYear();
      const month = this.displayedMonth.getMonth(); // getMonth is 0-indexed
      return this.getCalendarDays(year, month)
    },
    sortedDaysOfWeek() {
      const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      return [...daysOfWeek.slice(this.$notesiumState.startOfWeek), ...daysOfWeek.slice(0, this.$notesiumState.startOfWeek)];
    },
  },
  created() {
    this.displayedMonth = new Date();
    this.today = this.formatDateToISOString(this.displayedMonth);
  },
  mounted() {
    this.setSelectedDate(this.today);
  },
  template: t
}
