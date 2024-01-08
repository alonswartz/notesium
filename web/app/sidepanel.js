var t = `
<div class="flex-none overflow-y-auto w-48 bg-gray-800 text-gray-400 p-2">
  <ul class="space-y-1 cursor-pointer text-sm font-medium">
    <li v-show="labels.length == 0" class="p-2 cursor-default" title="1-word titled notes are considered labels">no labels found</li>
    <li v-for="label in labels" :key="label.Filename"
      @click="$emit('note-open', label.Filename)"
      class="flex justify-between p-2 rounded-md hover:text-gray-100 hover:bg-gray-700">
      <span class="overflow-hidden truncate pr-2" v-text="label.Title" />
      <span title="links" @click.stop="$emit('finder-open', '/api/raw/links?color=true&filename=' + label.Filename)"
        class="text-gray-500 hover:text-gray-100 p-1">
        <Icon name="mini-arrows-right-left" size="h-3 w-3" />
      </span>
    </li>
  </ul>
</div>
`

import Icon from './icon.js'
export default {
  props: ['lastSave'],
  components: { Icon },
  emits: ['note-open', 'finder-open'],
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

