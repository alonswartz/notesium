var t = `
<Pane name="graphPanel" :defaultWidth="540" :minWidth="100">
  <div class="h-full w-full border-r border-gray-300 bg-gray-50">
  </div>
</Pane>
`

import Pane from './pane.js'
export default {
  components: { Pane },
  data() {
    return {
    }
  },
  template: t
}
