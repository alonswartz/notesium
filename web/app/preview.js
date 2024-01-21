var t = `
<div class="h-full cm-conceal" ref="preview"></div>
`

export default {
  props: ['filename', 'lineNumber'],
  methods: {
    fetchNote() {
      fetch("/api/notes/" + this.filename)
        .then(response => response.json())
        .then(note => {
          this.cm.setValue(note.Content);
          this.lineNumberHL();
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
      theme: 'notesium-light',
      mode: {
        name: "gfm",
        highlightFormatting: true,
      },
    });
    this.fetchNote();
  },
  watch: {
    filename: function() { this.fetchNote(); },
    lineNumber: function() { this.lineNumberHL(); },
  },
  template: t
}
