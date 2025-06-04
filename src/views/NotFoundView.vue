<template>
  <v-container class="not-found">
    <v-row justify="center" align="center">
      <v-col cols="12" md="6" class="text-center">
        <h1 class="display-1">404</h1>
        <h2 class="display-2">Page Not Found</h2>
        <p class="display-3">Sorry, the page you are looking for does not exist.</p>
        <v-btn color="primary" @click="$router.push('/')">Go to Home</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>


<script>
export default {
  name: 'NotFoundView',
  data() {
    return {
      logoSrc: new URL('@/assets/images/head_logo.svg', import.meta.url).href
    }
  },
}
</script>

<style scoped>

</style>