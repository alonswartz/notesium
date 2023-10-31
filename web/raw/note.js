var t = `
<div class="flex h-full w-full overflow-x-auto gap-1 p-2">
  <div class="relative overflow-y-auto w-4/6">
    <div class="p-2" ref="codemirror"></div>
  </div>
  <div class="relative overflow-y-auto w-2/6 rounded-lg border border-gray-200 bg-white">
    <pre class="p-2 font-mono text-gray-800 text-xs" v-text="note"></pre>
  </div>
  <Filter v-if="showFilter" :uri=filterUri @filter-selection="handleFilterSelection" />
</div>
`

import Filter from './filter.js'
export default {
  components: { Filter },
  props: ['note'],
  emits: ['note-open'],
  data() {
    return {
      filterUri: '/api/raw/list?sort=mtime',
      showFilter: false,
    }
  },
  methods: {
    handleLeftBracket() {
      const cursorPos = this.cm.getCursor();
      const startPos = { line: cursorPos.line, ch: cursorPos.ch - 1 };
      const prevChar = this.cm.getRange(startPos, cursorPos);
      if (prevChar === '[') {
        this.showFilter = true;
      } else {
        this.cm.replaceRange('[', cursorPos, cursorPos);
      }
    },
    handleFilterSelection(value) {
      this.showFilter = false;
      if (value !== null) {
        const cursorPos = this.cm.getCursor();
        const startPos = { line: cursorPos.line, ch: cursorPos.ch - 1 };
        const formattedLink = `[${value.SearchStr}](${value.Filename})`;
        this.cm.replaceRange(formattedLink, startPos, cursorPos);
      }
      this.$nextTick(() => { this.cm.focus(); } );
    },
  },
  mounted() {
    this.cm = new CodeMirror(this.$refs.codemirror, {
      value: this.note.Content,
      lineNumbers: false,
      theme: 'notesium-light',
      mode: {
        name: "markdown",
      },
      extraKeys: {
        "[": this.handleLeftBracket,
      },
    });
    this.cm.setSize("100%", "100%");

    this.cm.on('mousedown', (cm, e) => {
      const el = e.path[0];
      if (el.classList.contains('cm-url')) {
        let link = el.textContent.slice(1, -1);
        if (this.note.OutgoingLinks.some(l => l.Filename === link)) {
          this.$emit('note-open', link);
        } else {
          link = link.match(/^[a-zA-Z]+:\/\//) ? link : 'https://' + link;
          window.open(link, '_blank');
        }
        e.preventDefault();
      }
    });
  },
  template: t
}
