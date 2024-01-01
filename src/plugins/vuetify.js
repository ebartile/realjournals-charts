import Vue from 'vue'
import Vuetify from 'vuetify/lib/framework'
import store from '../store'

Vue.use(Vuetify)

export default new Vuetify({
  theme: {
    dark: store.state.night,
    themes: {
      light: {
        primary: '#F0B90B',
      },
      dark: {
        primary: '#F0B90B',
        secondary: '#b0bec5',
        accent: '#8c9eff',
        error: '#b71c1c',
      },
    },
  },
})
