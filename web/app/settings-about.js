var t = `
<div class="h-full w-full overflow-y-scroll pb-6">
  <div class="relative flex-1 px-6 mt-2 space-y-6">

    <div class="rounded-md border border-gray-200">
      <div class="flex flex-wrap">
        <dl class="flex w-full px-6 py-2 bg-gray-100 border-b border-gray-200 items-center justify-items-center justify-between">
          <dt class="text-xs leading-6 text-gray-900 font-semibold">Software update</dt>
          <dd v-if="versionCheck.inprogress" class="mt-1 text-blue-700"><Icon name="spinner-circle" size="h-4 w-4" /></dd>
          <dd v-else class="text-xs leading-6 text-blue-700 hover:text-blue-600 hover:cursor-pointer" @click="$emit('version-check')">Check for updates</dd>
        </dl>
        <dl class="px-6 py-2 flex w-full flex-none justify-between bg-gray-50">
          <dt class="text-xs font-medium leading-6 text-gray-900">Runtime version</dt>
          <dd class="text-xs font-mono leading-6 text-gray-900" v-text="runtime.version || 'unknown'"></dd>
        </dl>
        <dl class="px-6 py-2 flex w-full flex-none justify-between bg-gray-50">
          <dt class="text-xs font-medium leading-6 text-gray-900">Latest release</dt>
          <dd class="text-xs font-mono leading-6 text-gray-900" v-text="versionCheck.latestVersion || 'unknown'"></dd>
        </dl>
        <dl class="px-6 py-2 flex w-full flex-none justify-between bg-gray-50">
          <dt class="text-xs font-medium leading-6 text-gray-900">Last check</dt>
          <dd class="text-xs font-mono leading-6 text-gray-900" v-text="formatDate(versionCheck.date) || 'unknown'"></dd>
        </dl>
      </div>
      <div v-if="versionCheck.error" class="font-mono text-xs text-red-600 px-6 py-2" v-text="versionCheck.error"></div>
      <div v-else-if="versionCheck.comparison == '-1'" class="w-full py-2 mx-auto border-t border-gray-200 text-center text-blue-700 bg-blue-50">
        <a class="text-xs font-bold leading-6 hover:underline" target="_blank" href="https://github.com/alonswartz/notesium/releases">
          A new release is available <span aria-hidden="true"> &rarr;</span>
        </a>
      </div>
      <div v-else-if="versionCheck.comparison == '0'" class="w-full py-2 mx-auto border-t border-gray-200 text-center text-green-700 bg-green-50">
        <span class="text-xs font-medium leading-6">You are using the latest version</span>
      </div>
      <div v-else-if="versionCheck.comparison == '1'" class="w-full py-2 mx-auto border-t border-gray-200 text-center text-yellow-700 bg-yellow-50">
        <span class="text-xs font-medium leading-6">You are using a newer version than the latest release</span>
      </div>
    </div>

    <div class="rounded-md border border-gray-200">
      <dl class="flex flex-wrap">
        <div class="flex-auto pl-6 py-2 bg-gray-100 border-b border-gray-200">
          <dt class="text-xs font-semibold leading-6 text-gray-900">Resources</dt>
        </div>
        <div class="divide-y divide-gray-100 w-full">
          <a target="_blank" href="https://www.notesium.com"
            class="flex w-full px-6 py-2 flex-none items-center justify-items-center justify-between hover:bg-gray-50">
            <dt class="text-xs font-medium leading-6 text-gray-900">Website</dt>
            <dd><Icon name="outline-external-link" size="h-4 w-4" /></dd>
          </a>
          <a target="_blank" href="https://github.com/alonswartz/notesium"
            class="flex w-full px-6 py-2 flex-none items-center justify-items-center justify-between hover:bg-gray-50">
            <dt class="text-xs font-medium leading-6 text-gray-900">Github</dt>
            <dd><Icon name="outline-external-link" size="h-4 w-4" /></dd>
          </a>
          <a target="_blank" :href="issueUrl"
            class="flex w-full px-6 py-2 flex-none items-center justify-items-center justify-between hover:bg-gray-50">
            <dt class="text-xs font-medium leading-6 text-gray-900">Report an issue</dt>
            <dd><Icon name="outline-external-link" size="h-4 w-4" /></dd>
          </a>
        </div>
      </dl>
    </div>

    <div class="rounded-md border border-gray-200">
      <dl class="flex flex-wrap">
        <div class="flex-auto pl-6 py-2 bg-gray-100 border-b border-gray-200">
          <dt class="text-xs font-semibold leading-6 text-gray-900 hover:cursor-pointer" @click="getRuntime()" title="click to refresh">Runtime</dt>
        </div>
        <template v-for="(val, key) in runtime" :key="key">
          <template v-if="typeof val === 'object' && val !== null">
            <details class="text-xs flex w-full flex-none bg-gray-50">
              <summary class="flex w-full pl-6 pr-5 py-2 flex-none items-center justify-between hover:bg-gray-100 hover:cursor-pointer focus:outline-none">
                <dt class="text-xs font-medium leading-6 text-gray-900" v-text="key"></dt>
                <dd><Icon name="chevron-right" size="h-4 w-4" /></dd>
              </summary>
              <div class="ml-6 pr-6 border-l-2 border-dotted border-gray-200">
                <div v-for="(subVal, subKey) in val" :key="key + subKey" class="pl-3 py-2 flex w-full flex-none items-center justify-between">
                  <dt class="text-xs font-medium leading-6 text-gray-900 whitespace-nowrap" v-text="subKey"></dt>
                  <dd class="text-xs font-mono leading-6 text-gray-900 truncate ml-10" :title="subVal" v-text="subVal"></dd>
                </div>
              </div>
            </details>
          </template>
          <template v-else>
            <div class="px-6 py-2 flex w-full flex-none items-center justify-between bg-gray-50">
              <dt class="text-xs font-medium leading-6 text-gray-900 whitespace-nowrap" v-text="key"></dt>
              <dd class="text-xs font-mono leading-6 text-gray-900 truncate ml-10" :title="val" v-text="val"></dd>
            </div>
          </template>
        </template>
      </dl>
    </div>

  </div>
</div>
`

import Icon from './icon.js'
export default {
  components: { Icon },
  emits: ['version-check'],
  props: ['versionCheck'],
  data() {
    return {
      runtime: {},
    }
  },
  methods: {
    getRuntime() {
      fetch("/api/runtime")
        .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e)))
        .then(response => { this.runtime = response; })
        .catch(e => { console.error(e); });
    },
    formatDate(date) {
      if (date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }
    },
  },
  computed: {
    issueUrl() {
      const url = "https://github.com/alonswartz/notesium/issues/new";
      if (Object.keys(this.runtime).length === 0) return url
      let body
      body = "```\n";
      body += `version:${this.runtime.version}\n`;
      body += `gitversion:${this.runtime.build.gitversion}\n`;
      body += `buildtime:${this.runtime.build.buildtime}\n`;
      body += `platform:${this.runtime.platform}\n`;
      body += "```\n\n";
      const params = new URLSearchParams({ body: body });
      return `${url}?${params.toString()}`;
    },
  },
  created() {
    this.getRuntime();
  },
  template: t
}
