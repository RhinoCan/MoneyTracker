import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },

  defaults: {
    global: {
      font: 'Roboto',
    },
  },

  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#00897B',     // soft teal
          secondary: '#455A64',   // blue-grey - was #455A64
          surface: '#F5F5F5',     // light grey panels/cards
          background: '#FAFAFA',
          info: '#26A69A',        // lighter teal
          success: '#4DB6AC',     // desaturated teal
          warning: '#BDBDBD',     // neutral grey
          error: '#E57373',       // muted red
          text: '#263238',        // dark blue-grey
        },
      },
    },
  },
})
