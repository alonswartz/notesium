var t = `
<div class="flex h-full w-full overflow-x-auto gap-1 p-2">
  <div class="relative overflow-y-auto w-4/6">
    <div :class="{ 'conceal': conceal }" class="p-2 h-full" ref="codemirror"></div>
  </div>
  <div class="relative overflow-y-auto w-2/6 rounded-lg border border-gray-200 bg-white">
    <div class="p-2 border-b flex space-x-4">
      <button type="button" :disabled="!this.note.isModified" @click="handleSave()"
        :class="this.note.isModified ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-300 text-gray-400'"
        class="rounded px-2 pt-px text-xs shadow-sm">Save</button>
      <div class="flex h-6 text-xs items-center content-center">
        <input type="checkbox" v-model="conceal" id="conceal-checkbox" tabindex="-1" @click="event => event.target.blur()">
        <label for="conceal-checkbox" class="ml-1">conceal</label>
      </div>
    </div>
    <pre class="p-2 font-mono text-gray-800 text-xs" v-text="note"></pre>
  </div>
  <Filter v-if="showFilter" :uri=filterUri small=true @filter-selection="handleFilterSelection" />
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
      conceal: true,
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
        const formattedLink = `[${value.Content}](${value.Filename})`;
        this.cm.replaceRange(formattedLink, startPos, cursorPos);
      }
      this.$nextTick(() => { this.cm.focus(); } );
    },
    handleSave() {
      if (this.note.isModified) {
        // TODO: perform actual save.
        console.log('note-save', this.note.Filename, this.cm.getValue() );
        this.note.isModified = false;
        this.cm.doc.markClean();
      }
    },
    lineNumberHL(linenum) {
      this.$nextTick(() => {
        this.cm.setOption("styleActiveLine", true);
        this.cm.setCursor({line: linenum - 1});
      });
    },
  },
  mounted() {
    this.cm = new CodeMirror(this.$refs.codemirror, {
      value: this.note.Content,
      lineNumbers: false,
      styleActiveLine: false,
      theme: 'notesium-light',
      mode: {
        name: "gfm",
        highlightFormatting: true,
      },
      extraKeys: {
        "[": this.handleLeftBracket,
        "Esc": function(cm){ cm.display.input.blur(); document.body.focus(); },
        "Ctrl-S": this.handleSave,
      },
    });

    if (this.note.Linenum > 1) {
      this.lineNumberHL(this.note.Linenum);
    }

    this.cm.on('focus', (cm, e) => {
      this.cm.setOption("styleActiveLine", true);
    });
    this.cm.on('blur', (cm, e) => {
      this.cm.setOption("styleActiveLine", false);
    });
    this.cm.on('changes', (cm, changes) => {
      this.note.isModified = !cm.doc.isClean();
    });

    this.cm.on('mousedown', (cm, e) => {
      let el = e.path[0];
      if (el.classList.contains('cm-link') || el.classList.contains('cm-url')) {
        const getNextNSibling = (element, n) => { for (; n > 0 && element; n--, element = element.nextElementSibling); return element; };

        if (el.classList.contains('cm-formatting')) {
          switch (el.textContent) {
            case '[': el = getNextNSibling(el, 4); break;
            case ']': el = getNextNSibling(el, 2); break;
            case '(': el = getNextNSibling(el, 1); break;
            case ')': el = el.previousElementSibling; break;
            default: return;
          }
          if (!el?.classList.contains('cm-url')) return;
        }

        if (el.classList.contains('cm-link')) {
          const potentialUrlElement = getNextNSibling(el, 3);
          el = potentialUrlElement?.classList.contains('cm-url') ? potentialUrlElement : el;
        }

        const link = el.textContent;
        const isMdFile = /^[0-9a-f]{8}\.md$/i.test(link);
        const hasProtocol = /^[a-zA-Z]+:\/\//.test(link);
        (isMdFile) ? this.$emit('note-open', link) : window.open(hasProtocol ? link : 'https://' + link, '_blank');
        e.preventDefault();
      }
    });
  },
  watch: {
    'note.Linenum': function(newVal) { this.lineNumberHL(newVal); },
  },
  template: t
}
