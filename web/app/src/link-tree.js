var t = `
<div class="text-sm my-1">
  <div class="flex justify-between">
    <div class="overflow-hidden truncate">
      <span class="cursor-pointer hover:font-bold text-gray-500 font-mono pr-2" v-text="expanded ? '-' : '+'" @click="toggle" ></span>
      <span class="cursor-pointer hover:underline text-indigo-700"
        v-text="title" :title="title + ' (line: ' + linenum + ')'"
        @click="$emit('note-open', filename, linenum)"></span>
    </div>
    <span v-if="direction" v-text="direction"
      :class="direction == 'incoming' ? 'bg-green-50 text-green-600 ring-green-500/10' : 'bg-yellow-50 text-yellow-600 ring-yellow-500/10'"
      class="mr-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset"></span>
  </div>

  <div class="ml-5" v-if="expanded">
    <LinkTree v-for="child in children"
      :title="child.title" :filename="child.filename" :linenum="child.linenum" :direction="child.direction" :key="child.filename + child.linenum"
      @note-open="(...args) => $emit('note-open', ...args)" />
  </div>
</div>
`

export default {
  name: 'LinkTree',
  props: ['filename', 'title', 'linenum', 'direction'],
  emits: ['note-open'],
  data() {
    return {
      expanded: false,
      children: [],
    }
  },
  methods: {
    toggle() {
      this.expanded = !this.expanded;
      if (this.expanded && this.children.length === 0) {
        this.fetchChildren();
      }
    },
    fetchChildren() {
      fetch('/api/raw/links?color=true&filename=' + this.filename)
        .then(response => response.text())
        .then(text => {
          const PATTERN = /^(.*?):(.*?):\s*(?:\x1b\[0;36m(.*?)\x1b\[0m\s*)?(.*)$/
          this.children = text.trim().split('\n').map(line => {
            const matches = PATTERN.exec(line);
            if (!matches) return null;
            const Filename = matches[1];
            const Linenum = parseInt(matches[2], 10);
            const Colored = matches[3] || '';
            const Content = matches[4];
            return { title: Content, filename: Filename, linenum: (Colored == 'outgoing') ? 1 : Linenum, direction: Colored };
          }).filter(Boolean);
        });
    },
  },
  template: t
}
