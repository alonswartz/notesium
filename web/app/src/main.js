// esm-bundler required for using js-file template syntax
import { createApp } from 'vue/dist/vue.esm-bundler'
import './tailwind.input.css'
import App from './app.js'

createApp(App).mount('#app')
