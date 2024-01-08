var t = `
<div class="flex-none overflow-y-auto w-48 bg-gray-800 text-gray-400 px-2 text-sm font-medium divide-y divide-gray-600">
  <ul class="space-y-1 cursor-pointer py-2">
    <li v-for="finder in staticFinders" :key="finder.name" :title="finder.hover"
      @click="$emit('finder-open', finder.uri)"
      class="p-2 rounded-md hover:text-gray-100 hover:bg-gray-700">
      <span class="overflow-hidden truncate pr-2" v-text="finder.title" />
    </li>
  </ul>
  <ul class="space-y-1 cursor-pointer py-1">
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
      staticFinders: [
        { title: 'all', hover: 'notes sorted alphabetically', uri: '/api/raw/list?color=true&prefix=label&sort=alpha' },
        { title: 'recent', hover: 'notes sorted by modification date', uri: '/api/raw/list?color=true&prefix=mtime&sort=mtime' },
        { title: 'orphans', hover: 'notes without incoming or outgoing links', uri: '/api/raw/list?orphans=true&sort=alpha' },
        { title: 'dangling links', hover: 'notes with broken outgoing links', uri: '/api/raw/links?dangling=true' },
      ],
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

