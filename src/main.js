import Vue from 'vue'

import {BootstrapVue, IconsPlugin} from 'bootstrap-vue'

import app from './app.vue'
import store from './store'

import './assets/scss/app.scss'

// Make BootstrapVue available throughout your project
Vue.use(BootstrapVue)
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin)

Vue.component('ignore-search', require('./components/search').default)
Vue.component('ignore-select', require('./components/select').default)
Vue.component('ignore-result', require('./components/result').default)

new Vue({
    el: '#app',
    store,
    render: h => h(app)
})
