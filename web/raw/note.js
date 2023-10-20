var t = `
<div class="flex h-full w-full overflow-x-auto gap-1 p-2">
  <div class="relative overflow-y-auto w-4/6">
    <pre class="p-2 font-mono text-gray-800 text-sm" v-text="note.Content"></pre>
  </div>
  <div class="relative overflow-y-auto w-2/6 rounded-lg border border-gray-200 bg-white">
    <pre class="p-2 font-mono text-gray-800 text-xs" v-text="note"></pre>
  </div>
</div>
`

export default {
  props: ['note'],
  template: t
}
