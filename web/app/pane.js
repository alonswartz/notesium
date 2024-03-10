var t = `
<div class="relative flex-none border-r border-gray-200" :style="{ width: paneWidth + 'px' }">
  <div class="flex flex-col h-full w-full">
    <slot></slot>
  </div>
  <div v-show="resizing" v-text="paneWidth + 'px'" class="absolute bottom-0 right-0 p-4 text-gray-400 text-xs"></div>
  <div @dblclick="paneWidth=initialWidth" @mousedown="startResize"
    :class="direction == 'right' ? 'left-full pl-1.5 mr-1.5' : 'right-full pr-1.5 ml-1.5'"
    class="z-50 absolute group inset-y-0 cursor-ew-resize flex items-center">
    <div class="h-8 w-1 rounded-full group-hover:bg-gray-300"></div>
  </div>
</div>
`

export default {
  props: {
    initialWidth: { type: Number, default: 200 },
    minWidth: { type: Number, default: 100 },
    direction: { type: String, default: "right" },
  },
  data() {
    return {
      paneWidth: null,
      maxWidth: null,
      startResizeClientX: null,
      startResizePaneWidth: null,
      resizing: false,
    }
  },
  methods: {
    startResize(event) {
      this.startResizeClientX = event.clientX;
      this.startResizePaneWidth = this.paneWidth;
      this.maxWidth = this.$el.parentElement.offsetWidth - 50;
      this.resizing = true;
      event.preventDefault();
      document.addEventListener('mousemove', this.doResize);
      document.addEventListener('mouseup', this.stopResize);
    },
    doResize(event) {
      let draggedDistance = event.clientX - this.startResizeClientX;
      if (this.direction === 'left') draggedDistance = -draggedDistance;
      const newWidth = this.startResizePaneWidth + draggedDistance;
      if (newWidth <= this.maxWidth && newWidth >= this.minWidth ) this.paneWidth = newWidth;
    },
    stopResize() {
      this.resizing = false;
      document.removeEventListener('mousemove', this.doResize);
      document.removeEventListener('mouseup', this.stopResize);
    },
  },
  mounted() {
    this.paneWidth = this.initialWidth;
  },
  template: t
}

