<template>
  <v-app >
    <Header />
    <v-main >
      <router-view />
    </v-main>
    <Footer />
  </v-app>
</template>

<script>
import Header from './components/ui/Header.vue'
import Footer from './components/ui/Footer.vue'

export default {
  name: 'App',
  components: {
    Header,
    Footer
  },
}
</script>
