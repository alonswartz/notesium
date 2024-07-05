var t = `
<div :class="{ 'cm-links-hover': clickableLinks }" class="h-full cm-conceal" ref="preview"></div>
`

export default {
  props: ['filename', 'lineNumber', 'clickableLinks', 'appendIncomingLinks'],
  emits: ['note-open'],
  methods: {
    fetchNote() {
      fetch("/api/notes/" + this.filename)
        .then(response => response.json())
        .then(note => {
          if (this.appendIncomingLinks && note.IncomingLinks?.length) {
            const sortedIncomingLinks = note.IncomingLinks.sort((a, b) => a.Title.localeCompare(b.Title));
            const linksMd = sortedIncomingLinks.map(link => `- [${link.Title}](${link.Filename})`).join('\n');
            this.cm.setValue(`${note.Content.replace(/\n+$/, '')}\n\n---\n\n**Incoming links**\n\n${linksMd}`);
          } else {
            this.cm.setValue(note.Content);
            this.lineNumberHL();
          }
        });
    },
    lineNumberHL() {
      if (!Number.isInteger(this.lineNumber) || this.lineNumber === undefined) return;
      this.$nextTick(() => {
        this.cm.setOption("styleActiveLine", true);
        this.cm.setCursor({line: this.lineNumber - 1, ch: 0});
      });
    },
  },
  mounted() {
    this.cm = new CodeMirror(this.$refs.preview, {
      value: '',
      readOnly: true,
      styleActiveLine: false,
      lineWrapping: this.$notesiumState.editorLineWrapping,
      theme: 'notesium-light',
      mode: {
        name: "gfm",
        highlightFormatting: true,
      },
    });

    if (this.clickableLinks) {
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
    }

    this.fetchNote();
  },
  watch: {
    filename: function() { this.fetchNote(); },
    lineNumber: function() { this.lineNumberHL(); },
  },
  template: t
}
