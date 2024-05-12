var t = `
<div class="relative flex h-full">
  <div class="grow overflow-y-auto">
    <div :class="{'cm-conceal cm-unconceal': conceal }" class="h-full p-2 pr-1 cm-links-hover" ref="codemirror"></div>
  </div>

  <div v-if="!showSidebar || note.ghost" class="absolute right-0 mt-2 mr-6 h-7 z-10 inline-flex items-center">
    <button type="button" :disabled="!this.note.isModified" @click="handleSave()"
      :class="this.note.isModified ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-300 text-gray-400'"
      class="rounded px-10 pt-2 pb-1 text-xs">Save</button>
  </div>

  <NoteSidebar v-if="showSidebar && !note.ghost" :note=note
    @conceal-toggle="conceal=!conceal"
    @note-save="handleSave()"
    @note-open="(...args) => $emit('note-open', ...args)"
    @finder-open="(...args) => $emit('finder-open', ...args)"
    @graph-open="(...args) => $emit('graph-open', ...args)" />

  <Finder v-if="showFinder" uri="/api/raw/list?sort=mtime" small=true @finder-selection="handleFinderSelection" />
</div>
`

import CodeMirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
// import 'codemirror/theme/material.css'
import 'codemirror/mode/markdown/markdown'
import 'codemirror/mode/gfm/gfm'
import 'codemirror/addon/mode/overlay'
import 'codemirror/addon/selection/active-line'
import 'codemirror/addon/display/placeholder'

import * as Table from './cm-table.js'
import NoteSidebar from './note-sidebar.js'
import Finder from './finder.js'
import Icon from './icon.js'

export default {
  components: { NoteSidebar, Finder, Icon },
  props: ['note', 'showSidebar'],
  emits: ['note-open', 'note-save', 'finder-open', 'graph-open'],
  data() {
    return {
      showFinder: false,
      conceal: true,
    }
  },
  methods: {
    handleLeftBracket() {
      const cursorPos = this.cm.getCursor();
      const startPos = { line: cursorPos.line, ch: cursorPos.ch - 1 };
      const prevChar = this.cm.getRange(startPos, cursorPos);
      if (prevChar === '[') {
        this.showFinder = true;
      } else {
        this.cm.replaceRange('[', cursorPos, cursorPos);
      }
    },
    handleFinderSelection(value) {
      this.showFinder = false;
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
        this.$emit('note-save', this.note.Filename, this.cm.getValue(), this.note.Mtime );
      }
    },
    handleTab() {
      if (this.cm.somethingSelected()) return CodeMirror.Pass;
      if (Table.isCursorInTable(this.cm)) {
        Table.formatTableAndAdvance(this.cm, this.conceal);
      } else {
        this.cm.execCommand('insertSoftTab');
      }
    },
    handleBackspace() {
      if (this.cm.somethingSelected()) return CodeMirror.Pass;
      const cursorPos = this.cm.getCursor();
      const indentUnit = this.cm.getOption('indentUnit');
      const spacesForIndentUnit = ' '.repeat(indentUnit);
      const checkFrom = {line: cursorPos.line, ch: Math.max(0, cursorPos.ch - indentUnit)};
      if (this.cm.getRange(checkFrom, cursorPos) === spacesForIndentUnit) {
        this.cm.replaceRange('', checkFrom, cursorPos);
      } else {
        return CodeMirror.Pass;
      }
    },
    lineNumberHL(linenum) {
      if (!Number.isInteger(linenum) || linenum === undefined) return;
      this.$nextTick(() => {
        this.cm.setOption("styleActiveLine", true);
        this.cm.setCursor({line: linenum - 1});
        this.note.Linenum = undefined;
      });
    },
  },
  mounted() {
    this.cm = new CodeMirror(this.$refs.codemirror, {
      value: this.note.Content,
      placeholder: '# title',
      lineNumbers: false,
      styleActiveLine: false,
      tabSize: 4,
      indentUnit: 4,
      theme: 'notesium-light',
      mode: {
        name: "gfm",
        highlightFormatting: true,
      },
      extraKeys: {
        "[": this.handleLeftBracket,
        "Esc": function(cm){ cm.display.input.blur(); document.body.focus(); },
        "Ctrl-S": this.handleSave,
        "Tab": this.handleTab,
        "Backspace": this.handleBackspace,
        "Shift-Tab": function(cm) { return Table.navigateTable(cm, 'left'); },
        "Alt-Up": function(cm) { return Table.navigateTable(cm, 'up'); },
        "Alt-Down": function(cm) { return Table.navigateTable(cm, 'down'); },
        "Alt-Left": function(cm) { return Table.navigateTable(cm, 'left'); },
        "Alt-Right": function(cm) { return Table.navigateTable(cm, 'right'); },
      },
    });

    if (Number.isInteger(this.note.Linenum) && this.note.Linenum > 1) {
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
      let el = e.composedPath()[0];
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
    'note.Mtime': function() { this.cm.doc.markClean(); },
  },
  template: t
}
