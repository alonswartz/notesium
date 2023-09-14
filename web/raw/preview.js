var t = `
<pre class="w-full h-full overflow-auto p-1" v-text="note.Content"></pre>
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
        });
    },
  },
  watch: {
    filename: function() { this.fetchNote(); },
  },
  created() {
    this.fetchNote();
  },
  template: t
}
