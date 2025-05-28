<template>
  <v-footer class="footer d-flex align-center justify-center ga-2 flex-wrap flex-grow-1 py-3" padless>
    <v-container class="py-6 container-footer">
      <!-- Logos partenaires -->
      <v-row class="justify-space-between align-center mb-4">
        <v-col cols="12" md="5" class="text-center text-md-left mb-4 mb-md-0">
          <a :href="partners[0].url" target="_blank" rel="noopener">
            <v-img
              :src="partners[0].src"
              alt="Logo ENC"
              height="80"
              contain
              class="mx-auto mx-md-0 img-partner"
            />
          </a>
        </v-col>

        <v-col cols="12" md="5" class="text-center text-md-right">
          <a :href="partners[1].url" target="_blank" rel="noopener">
            <v-img
              :src="partners[1].src"
              alt="Logo Centre Jean Mabillon"
              height="140"
              contain
              class="mx-auto mx-md-0 img-partner"
              style="filter: grayscale(100%);"
            />
          </a>
        </v-col>
      </v-row>

      <!-- Liens centraux -->
      <v-row justify="center">
        <v-col cols="auto" class="footer-link">
          <router-link :to="{ path: '/info', query: { section: 'contact' } }" class="footer-link-ref">
           Contact
          </router-link>
        </v-col>
        <v-col cols="auto" class="footer-divider">|</v-col>
        <v-col cols="auto" class="footer-link">
          <router-link :to="{ path: '/info', query: { section: 'legal' } }" class="footer-link-ref">
           Mentions légales
          </router-link>
        </v-col>
        <v-col cols="auto" class="footer-divider">|</v-col>
        <v-col cols="auto" class="footer-link">
          <a href="https://www.huma-num.fr" target="_blank" rel="noopener">Huma-Num</a>
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>

<script>
export default {
  name: 'AppFooter',
  data() {
    return {
      partners: [
        {
          src: new URL('@/assets/images/Logo_ENC_PSL.svg', import.meta.url).href,
          url: 'https://www.enc.sorbonne.fr/',
        },
        {
          src: new URL('@/assets/images/Logo-CJM.png', import.meta.url).href,
          url: 'https://www.labexcap.fr/',
        },
      ],
    };
  },
};
</script>

<style scoped>
.footer {
  border-top: 15px solid var(--brown);
  background-color: #4C4949;
  color: white;
}

.container-footer {
  position: relative;
  z-index: 2;
}

.footer-link {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.footer-link a {
  color: white;
  text-decoration: none;
}

.footer-link a:hover {
  border-bottom: 5px solid var(--brown);
  padding-bottom: 10px;
}

.footer-divider {
  color: white;
  font-size: 0.9rem;
  padding: 10px 6px;
}

/* on hover images zoom */
.img-partner{
  transition: transform 0.3s ease-in-out;
}
.img-partner:hover {
  transform: scale(1.05);
}
</style>
