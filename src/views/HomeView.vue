<template>
  <v-container fluid class="home-container">
    <v-row align="center" class="row-container" no-gutters wrap>
      <v-col cols="12" md="6" class="left-section">
        <h1 class="title-home text-center">
          Dictionnaire des <span class="nowrap">imprimeurs-lithographes</span> <span class="nowrap">du XIX<sup>e</sup> siècle</span>
        </h1>

        <div class="btn-group-home">
  <v-btn
      class="btn-home"
      color="transparent"
      elevation="0"
      to="list"
      title="Consulter"
  >
    Consulter
  </v-btn>

  <v-btn
      class="btn-home"
      color="transparent"
      elevation="0"
      title="En savoir plus"
      @click="scrollToIntro"
  >
    En savoir plus
  </v-btn>
</div>

        <!--<v-text-field
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
          <template #append-inner>
            <v-btn
                class="btn-quick-search"
                variant="text"
                size="small"
                icon
                @click="goToList"
                title="Rechercher"
            >
              <v-icon size="25">mdi-arrow-right</v-icon>
            </v-btn>
          </template>
        </v-text-field>-->

        <MetricsBar/>


      </v-col>
      <v-col cols="12" md="6" class="d-flex justify-end pr-0">
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
import IntroText from '@/components/home/HomeIntroText.vue'
import PanelGallery from '@/components/home/HomePanelGallery.vue'
import MetricsBar from '@/components/home/HomeMetricsBar.vue'

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
      isMobile: window.innerWidth <= 960
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
        name: 'list',
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
.row-container {
  flex-wrap: wrap;
}

.home-container {
  padding-top: 10px;
  padding-bottom: 60px;
  min-height: calc(100vh - 65px);
  display: flex;
  align-items: center;
}


.left-section {
  background: linear-gradient(#f7f7f7cc, #f7f7f7 11.94%, #f7f7f7 100%, #fcfcfc 0);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.08);
  border-radius: 10px 0 0 10px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  position: relative;
  z-index: 1;
  flex: 0 1 48%;
  margin-top: 30px;
  margin-left: 20px;
}

.title-home {
  margin-bottom: 50px;
  margin-top: 50px;
  font-size: 36px;
  font-weight: 700;
  line-height: 55px;
  text-align: center;
  white-space: normal;
}

.search-bar {
  width: 100%;
  margin: 0 auto 20px;
}

.btn-group-home {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  width: 100%;
  max-width: 400px;
  margin: 0 auto 40px;
}

.btn-home {
  flex: 1;
  padding: 8px 16px;
  font-size: 0.9rem;
  border-radius: 5px;
  border: 2px solid black;
  text-transform: uppercase;
  text-align: center;
}

.btn-about-home-page {
  width: fit-content;
  margin: 40px auto;
  padding: 8px 16px;
  font-size: 0.9rem;
  border-radius: 5px;
  border: 2px solid black;
  text-transform: uppercase;
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


@media screen and (max-width: 1300px) {
  .left-section {
    padding: 60px 20px;
    margin-left: 0;
    margin-right: 0;
    border-radius: 10px;
    margin-top: 50px;
  }

  .title-home {
    font-size: clamp(1.2rem, 4vw + 0.5rem, 1.35rem);
    text-align: center;
    margin-bottom: 20px;
  }

  .search-bar {
    width: 90%;
    margin-bottom: 10px;
  }
}

.nowrap {
  white-space: nowrap;
}

.btn-quick-search {
  min-width: 32px;
  height: 32px;
  padding: 0;
  margin: 0;
  background-color: var(--light-brown);
  color: white;
  transition: background-color 0.2s ease;
}

.btn-quick-search:hover {
  background-color: var(--brown);
}

@media screen and (max-width: 960px) {
  .left-section {
    width: 100%;
    flex: 0 0 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}

@media screen and (max-width: 600px) {
  .btn-group-home {
    flex-direction: column;
  }

  .btn-home {
    width: 100%;
  }
}

.btn-to-list {
  width: fit-content;
  margin: 20px auto;
  padding: 8px 16px;
  font-size: 0.9rem;
  border-radius: 5px;
  border: 2px solid black;
  text-transform: uppercase;
}
</style>
