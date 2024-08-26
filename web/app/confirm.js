var t = `
<div v-if="visible" @keyup.esc="close(false)" class="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20" role="dialog" aria-modal="true" >
  <div @click="close(false)" class="fixed inset-0 bg-gray-500 bg-opacity-25 transition-opacity" aria-hidden="true"></div>
  <div class="max-w-xl overflow-y-auto mx-auto transform overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-black ring-opacity-5">
    <input ref="modalAutoFocus" autofocus type="text" class="sr-only" aria-hidden="true" />
    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <div class="relative w-full transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all">
        <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
              <h3 class="text-base font-semibold leading-6 text-gray-900" v-text="config.title"></h3>
              <pre class="mt-3 text-sm text-gray-500 font-sans whitespace-pre-wrap break-words" v-text="config.body"></pre>
            </div>
          </div>
        </div>
        <div class="bg-gray-100 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
          <button @click="close(true)" type="button" class="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto" v-text="config.button"></button>
          <button @click="close(false)" type="button" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</div>
`

export default {
  data() {
    return {
      config: {},
      visible: false,
      resolve: null,
    };
  },
  methods: {
    open(config) {
      this.config = config;
      this.visible = true;
      this.$nextTick(() => { this.$refs.modalAutoFocus.focus(); });
      return new Promise((resolve) => {
        this.resolve = resolve;
      });
    },
    close(resolve) {
      this.visible = false;
      this.resolve(resolve);
    },
  },
  template: t
}
