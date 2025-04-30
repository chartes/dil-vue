import { createApp } from 'vue'
import App from './App.vue'
import router from './router'



import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { fr } from 'vuetify/locale'
import * as components from 'vuetify/components'
import { VDateInput } from 'vuetify/labs/VDateInput'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  locale: {
    locale: 'fr',
    messages: { fr },
  },
  components: {
    ...components,
    VDateInput,
  },
  directives
})

createApp(App)
  .use(router)
  .use(vuetify)
  .mount('#app')
