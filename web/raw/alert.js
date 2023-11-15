var t = `
<div class="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
  <div class="p-4">
    <div class="flex items-start">
      <div class="flex-shrink-0">
        <div v-if="alert.type == 'error'" class="text-red-400"><Icon name="outline-exclamation-circle" size="6" /></div>
        <div v-if="alert.type == 'success'" class="text-green-400"><Icon name="outline-check-circle" size="6" /></div>
      </div>
      <div class="ml-3 w-0 flex-1 pt-0.5">
        <p class="text-sm font-medium text-gray-900" v-text="alert.title"></p>
        <p v-show="alert.body" class="mt-1 text-sm text-gray-500" v-text="alert.body"></p>
      </div>
      <div v-show="alert.sticky" class="ml-4 flex flex-shrink-0">
        <button @click="dismiss()" type="button" class="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500">
          <span class="sr-only">Close</span>
          <Icon name="mini-x-mark" size="5" />
        </button>
      </div>
    </div>
  </div>
</div>
`

import Icon from './icon.js'
export default {
  components: { Icon },
  props: ['alert', 'index'],
  emits: ['alert-dismiss'],
  methods: {
    dismiss() {
      this.$emit('alert-dismiss', this.index);
    },
  },
  mounted() {
    if (!this.alert.sticky) {
      setTimeout(() => { this.dismiss(); }, 2000);
    }
  },
  template: t
}
