var t = `
<div class="flex h-full w-full overflow-x-auto gap-1 p-2">
  <div class="relative overflow-y-auto w-4/6">
    <div class="p-2" ref="codemirror"></div>
  </div>
  <div class="relative overflow-y-auto w-2/6 rounded-lg border border-gray-200 bg-white">
    <pre class="p-2 font-mono text-gray-800 text-xs" v-text="note"></pre>
  </div>
</div>
`

export default {
  props: ['note'],
  emits: ['note-open'],
  mounted() {
    this.cm = new CodeMirror(this.$refs.codemirror, {
      value: this.note.Content,
      lineNumbers: false,
      theme: 'notesium-light',
      mode: {
        name: "markdown",
      },
    });
    this.cm.setSize("100%", "100%");

    this.cm.on('mousedown', (cm, e) => {
      const el = e.path[0];
      if (el.classList.contains('cm-url')) {
        let link = el.textContent.slice(1, -1);
        if (this.note.OutgoingLinks.some(l => l.Filename === link)) {
          console.log('internal-link', link);
          this.$emit('note-open', link);
        } else {
          link = link.match(/^[a-zA-Z]+:\/\//) ? link : 'https://' + link;
          window.open(link, '_blank');
        }
        e.preventDefault();
      }
    })
  },
  template: t
}
