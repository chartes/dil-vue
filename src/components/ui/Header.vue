<template>
  <v-app-bar
      height="80"
      class="app-navbar"
      absolute
  >
    <v-container fluid class="d-flex justify-space-between align-center">
      <!-- Logos à gauche -->
      <div class="d-flex align-center">
        <v-img
          :src="logoENC"
          alt="Logo ENC"
          class="logo-enc"
          @click="goToWebsite('https://www.chartes.psl.eu/')"
          contain
        />
        <v-img
          :src="logoSrc"
          alt="Logo application"
          class="logo-app"
          contain
          @click="$router.push('/home')"
        />
      </div>

      <!-- API + Connexion à droite -->
      <div class="d-flex align-center">
        <v-btn class="api-btn mr-4"
               @click="goToWebsite(apiDocsUrl)">
          API <span class="api-btn-logo">{}</span>
        </v-btn>

        <v-btn
          class="api-btn"
          @click="goToWebsite(adminUrl)">

        <v-icon color="white" size="30" class="cursor-pointer">
          mdi-account-circle
        </v-icon>
          </v-btn>
      </div>
    </v-container>
  </v-app-bar>
</template>

<script>
import {mapState} from "vuex";

export default {
  name: 'Header',
  data() {
    return {
      logoENC: new URL('@/assets/images/head_logo.svg', import.meta.url).href,
      logoSrc: new URL('@/assets/images/dil-icons/logo-dil-v5.svg', import.meta.url).href
    }
  },
  methods: {
    goToWebsite(url) {
      window.open(url, '_blank')
    }
  },
    computed : {
    ...mapState(["apiDocsUrl", "adminUrl"]),
  },
}
</script>

<style scoped>

.app-navbar {
  background-color: var(--brown) !important;
  padding: 0 !important;
  position: fixed !important;
}

.logo-enc,
.logo-app {
  height: 4rem;
  width: 30rem;
  cursor: pointer;
  z-index: 1;
}

.logo-app {
  margin-left: -350px;
}

/* reduce the gap between the two logos */



.logo-enc,
.logo-app {
  cursor: pointer;
  transition: filter 0.2s;
}

.logo-enc:hover,
.logo-app:hover {
  filter: brightness(0.8);
}

.api-btn {
  background-color: var(--brown) !important;
  color: white !important;
  font-family: 'Roboto', sans-serif;
  font-size: 1rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  border-radius: 0.5rem;
}

.api-btn-logo {
  padding-left: 6px;
  font-size: 1.2rem;
  letter-spacing: 0.25rem;
}

.cursor-pointer {
  cursor: pointer;
}

</style>