<template>
  <v-container fluid class="home-container">
    <v-row align="center" class="row-container">
      <!-- Colonne gauche -->
      <v-col cols="12" md="6" class="left-section">
        <h1 class="title-home text-center">
          Dictionnaire des imprimeurs-lithographes du XIX<sup>e</sup> siècle
        </h1>

        <v-text-field
            v-model="quickSearch"
            class="search-bar"
            label="Recherche rapide"
            prepend-inner-icon="mdi-magnify"
            outlined
            hide-details
            single-line
            clearable
            @keyup.enter="goToList"
            color="var(--light-brown)"
        >
          <!-- SLOT pour le bouton -->
          <template #append-inner>
            <v-btn
                icon
                @click="goToList"
                class="btn-quick-search d-flex align-center justify-center"
                title="Rechercher"
            >
              <v-icon>mdi-arrow-right</v-icon>
            </v-btn>
          </template>
        </v-text-field>

        <MetricsBar/>

        <v-btn
            class="btn-about-home-page"
            color="transparent"
            elevation="0"
            @click="scrollToIntro"
        >
          En savoir plus
        </v-btn>
      </v-col>

      <!-- Colonne droite -->
      <v-col cols="12" md="6">
        <PanelGallery/>
      </v-col>
    </v-row>
  </v-container>
  <v-container
      fluid
      class="home-container d-flex justify-center align-center"
      ref="introSection"
  >
    <IntroText/>
  </v-container>
</template>


<script>
import IntroText from '@/components/IntroText.vue'
import PanelGallery from '@/components/PanelGallery.vue'
import MetricsBar from '@/components/MetricsBar.vue'
import {mapState} from "vuex";

export default {
  name: 'HomeView',
  components: {
    IntroText,
    PanelGallery,
    MetricsBar
  },
  data() {
    return {
      quickSearch: '',
    }
  },
  methods: {
    scrollToIntro() {
      const section = this.$refs.introSection?.$el || this.$refs.introSection
      if (section) {
        section.scrollIntoView({behavior: 'smooth'})
      }
    },
    goToList() {
      if (!this.quickSearch) return;

      this.$router.push({
        name: 'list', //  le nom de ta route si différent
        query: {
          search: this.quickSearch,
          mode: 'all'
        }
      });
    }
  },
}
</script>

<style src="@/assets/css/dil-utils.css"></style>
<style scoped>
.home-container {
  padding-top: 5px;
  padding-bottom: 60px;
  min-height: calc(100vh - 65px); /* si la navbar fait 65px */
  display: flex;
  align-items: center;
}


.left-section {
  background: linear-gradient(#f7f7f7cc, #f7f7f7 11.94%, #f7f7f7 100%, #fcfcfc 0);
  border-radius: 10px 0 0 10px;
  padding: 120px 40px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  position: relative;
  z-index: 1;
  margin-left: 20px; /* étend vers la gauche */
  margin-right: -90px; /* étend vers la droite */
}

.title-home {
  font-weight: bold;
  margin-bottom: 30px;
  font-size: clamp(1.2rem, 2vw + 0.5rem, 1.35rem); /* ↔️ Ajuste entre 1.2rem et 2rem */
  line-height: 1.2;
  text-align: center;
  white-space: normal; /* autorise le retour à la ligne si nécessaire sur mobile */
}

.search-bar {
  width: 100%;
  margin: 0 auto 20px;
}

.btn-about-home-page {
  width: fit-content;
  margin: 30px auto;
  padding: 8px 16px;
  font-size: 0.9rem;
  border-radius: 5px;
  border: 2px solid black;
  text-transform: uppercase;
}


.left-section::after {
  content: "";
  position: absolute;
  top: 0;
  right: -600px;
  width: 410px; /* ajuste selon l'effet voulu */
  height: 100%;
  background: inherit; /* reprend le même fond que .left-section */
  z-index: 0; /* reste derrière le texte */
}



.v-text-field.search-bar {
  width: 70%;
  max-height: 50px;
  margin: 10px auto;
  border-radius: 5px;
  background-color: var(--panel-bg-color);
  padding: 0 !important;
  line-height: 1.2;
  border: none !important;
}

.v-text-field.search-bar .v-input__control {
  min-height: 10px;
  padding: 0 8px;
}

.v-text-field.search-bar .v-field__input {
  padding: 0;
}


@media (max-width: 960px) {
  .left-section {
    border-radius: 10px;
  }

  .btn-about-home-page {
    width: 90%;
  }
}
</style>
