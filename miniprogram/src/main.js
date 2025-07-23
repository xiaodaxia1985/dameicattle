import Vue from 'vue'
import App from './App.vue'
import store from './stores'

Vue.config.productionTip = false

App.mpType = 'app'

const app = new Vue({
  store,
  ...App
})

app.$mount()