var t = `
<pre class="w-full h-full overflow-auto p-1"><template v-for="line, index in noteLines"><span :id="'line'+(index+1)" v-text="line+'\\n'"></span></template></pre>
`

export default {
  props: ['filename', 'lineNumber'],
  data() {
    return {
      note: {},
    }
  },
  methods: {
    fetchNote() {
      fetch("/api/notes/" + this.filename)
        .then(response => response.json())
        .then(data => {
          this.note = data;
          this.lineNumberHL(this.lineNumber, null);
        });
    },
    lineNumberHL(newLineNumber, oldLineNumber) {
      this.$nextTick(() => {
        if (oldLineNumber) {
          const oldLineEl = document.getElementById(`line${oldLineNumber}`);
          if (oldLineEl) { oldLineEl.classList.remove('bg-blue-600/10'); }
        }
        const newLineEl = document.getElementById(`line${newLineNumber}`);
        if (newLineEl) { newLineEl.classList.add('bg-blue-600/10', 'block', 'w-full'); newLineEl.scrollIntoView({ block: 'nearest' }); }
      });
    },
  },
  computed: {
    noteLines() {
      if (this.note.Content) return this.note.Content.split('\n');
    },
  },
  watch: {
    filename: function() { this.fetchNote(); },
    lineNumber: function(newVal, oldVal) { this.lineNumberHL(newVal, oldVal); },
  },
  created() {
    this.fetchNote();
  },
  template: t
}
