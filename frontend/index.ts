import Vue from "vue"
import "vuetify/dist/vuetify.min.css"
import Vuetify from "vuetify"
import App from "./components/App.vue"

Vue.use(Vuetify)

new Vue({
    el: "#root",
    render: h => h(App)
})
