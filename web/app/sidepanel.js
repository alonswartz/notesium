var t = `
<div class="flex-none overflow-y-auto w-48 bg-gray-800 text-gray-400 p-2">
  <ul class="space-y-1 cursor-pointer text-sm font-medium">
    <li v-show="labels.length == 0" class="p-2 cursor-default" title="1-word titled notes are considered labels">no labels found</li>
    <li v-for="label in labels" :key="label.Filename"
      @click="$emit('note-open', label.Filename)"
      class="flex p-2 rounded-md hover:text-gray-100 hover:bg-gray-700">
      <span class="overflow-hidden truncate" v-text="label.Title" />
    </li>
  </ul>
</div>
`

export default {
  props: ['lastSave'],
  emits: ['note-open'],
  data() {
    return {
      labels: [],
    }
  },
  methods: {
    fetchLabels() {
      fetch('/api/raw/list?labels=true&sort=alpha')
        .then(response => response.text())
        .then(text => {
          const PATTERN = /^(.*?):(.*?):\s*(.*)$/
          this.labels = text.trim().split('\n').map(line => {
            const matches = PATTERN.exec(line);
            if (!matches) return null;
            const Filename = matches[1];
            const Title = matches[3];
            return { Filename, Title };
          }).filter(Boolean);
        });
    },
  },
  created() {
    this.fetchLabels();
  },
  watch: {
    'lastSave': function() { this.fetchLabels(); },
  },
  template: t
}

