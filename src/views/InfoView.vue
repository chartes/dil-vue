<template>
  <v-container fluid class="info-page-container">
    <!-- Barre de progression de lecture -->
    <div class="reading-progress" :style="{ width: scrollProgress + '%' }" aria-hidden="true"></div>

    <v-row no-gutters>
      <v-col cols="12" md="3" class="menu-col">
        <v-list nav dense class="menu-list mb-0">
          <v-list-item
            v-for="(item, index) in menuItems"
            :key="index"
            :active="activeSection === item.key"
            :aria-current="activeSection === item.key ? 'page' : undefined"
            @click="$router.push({ query: { section: item.key } })"
            class="menu-item"
            :class="{ 'menu-active': activeSection === item.key }"
          >
            <v-list-item-title>{{ item.title }}</v-list-item-title>

            <!-- mini barre de progression sur l'item actif -->
            <div v-if="activeSection === item.key" class="menu-progress">
              <span class="menu-progress-bar" :style="{ width: scrollProgress + '%' }"></span>
            </div>
          </v-list-item>
        </v-list>
      </v-col>

      <v-col cols="12" md="9" class="content-col">
        <div class="section-content">
          <h2>{{ currentTitle }}</h2>
          <component :is="currentComponent" class="main-section"/>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import ContactPage from '@/components/info/InfoContactPage.vue'
import LegalPage from '@/components/info/InfoLegalPage.vue'
import DictionaryPage from '@/components/info/InfoDictionaryPage.vue'
import EntriesPage from '@/components/info/InfoEntriesPage.vue'
import ResearchPage from '@/components/info/InfoResearchPage.vue'
import GratitudePage from '@/components/info/InfoGratitudePage.vue'

export default {
  name: 'InfoView',
  components: {
    ContactPage,
    LegalPage,
    DictionaryPage,
    EntriesPage,
    ResearchPage,
    GratitudePage
  },
  data() {
    return {
      activeSection: 'dictionary', // défaut cohérent
      scrollProgress: 0,
      menuItems: [
        { title: "Le dictionnaire", key: "dictionary" },
        { title: "Les notices", key: "entries" },
        { title: "La recherche", key: "research" },
        { title: "Remerciements", key: "gratitude" },
        { title: "Contact", key: "contact" },
        { title: "Mentions légales", key: "legal" }
      ],
      sections: {
        dictionary: { title: "Le dictionnaire", component: 'DictionaryPage' },
        entries:    { title: "Les notices",     component: 'EntriesPage' },
        research:   { title: "La recherche",    component: 'ResearchPage' },
        gratitude:  { title: "Remerciements",   component: 'GratitudePage' },
        contact:    { title: "Contact",         component: 'ContactPage' },
        legal:      { title: "Mentions légales",component: 'LegalPage' },
      }
    }
  },
  computed: {
    currentTitle() {
      return (this.sections[this.activeSection] || this.sections.dictionary).title
    },
    currentComponent() {
      return (this.sections[this.activeSection] || this.sections.dictionary).component
    }
  },
  watch: {
    '$route.query.section': {
      immediate: true,
      handler(section) {
        if (this.sections[section]) {
          this.activeSection = section
        } else {
          // si paramètre inconnu, on normalise l'URL vers la section par défaut
          this.$router.replace({ query: { section: 'dictionary' } })
          this.activeSection = 'dictionary'
        }
        this.$nextTick(() => {
          window.scrollTo(0, 0)
          this.updateScrollProgress()
        })
      }
    }
  },
  mounted() {
    window.scrollTo(0, 0)
    this.updateScrollProgress()
    window.addEventListener('scroll', this.updateScrollProgress, { passive: true })
    window.addEventListener('resize', this.updateScrollProgress)
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.updateScrollProgress)
    window.removeEventListener('resize', this.updateScrollProgress)
  },
  methods: {
    updateScrollProgress() {
      const el = document.documentElement
      const body = document.body
      const scrollTop = window.pageYOffset || el.scrollTop || body.scrollTop || 0
      const height = (el.scrollHeight || body.scrollHeight) - el.clientHeight
      const ratio = height > 0 ? Math.min(100, Math.max(0, (scrollTop / height) * 100)) : 0
      this.scrollProgress = Math.round(ratio)
    }
  }
}
</script>

<style src="@/assets/css/dil_main_info_pages.css"></style>
<style scoped>
.info-page-container {
  min-height: 80vh;
  padding-top: 30px;
  position: relative;
}


.reading-progress {
  position: sticky;
  top: 0;
  height: 4px;
  background: var(--red-pompein, #7b0c12);
  width: 0%;
  z-index: 10;
}

.menu-col {
  background-color: #f7f7f7;
  padding: 20px;
  border-right: 2px solid var(--red-pompein, #e6ddd6);
  min-height: 100%;
  position: sticky;
  top: 70px;
  align-self: flex-start;
}

.menu-list {
  background: transparent;
}

.menu-item {
  cursor: pointer;
  border-left: 4px solid transparent;
  padding-left: 10px;
  transition: background-color 0.2s ease, border-color 0.2s ease;
  position: relative;
}

:deep(.menu-item .v-list-item-title) {
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: .02em;
}

.menu-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.menu-active {
  border-left: 4px solid var(--red-pompein, #7b0c12);
  background-color: rgba(123, 12, 18, 0.05);
}

.menu-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  background: transparent;
}
.menu-progress-bar {
  display: block;
  height: 100%;
  width: 0%;
  background: var(--red-pompein, #7b0c12);
  transition: width .1s linear;
}

.content-col {
  padding: 40px;
}

.section-content h2 {
  font-size: 1.6rem;
  color: var(--red-pompein, #7b0c12);
  margin-bottom: 20px;
  font-weight: 700;
  line-height: 1.4;
  border-bottom: 2px solid var(--red-pompein, #e6ddd6);
  padding-bottom: 10px;
  margin-top: 0;
  text-transform: uppercase;
  margin-left: 10px;
  padding-left: calc(5% - 10px);
}


.section-content p {
  font-size: 1rem;
  margin-bottom: 16px;
  line-height: 1.7;
  color: #333;
}

.section-content a {
  color: var(--red-pompein, #7b0c12) !important;
  text-decoration: underline;
}



@media (max-width: 960px) {
  .menu-col {
    position: static;
    border-right: none;
  }
  .info-page-container > div {
    gap: 30px;
  }
  .content-col {
    padding: 16px;
  }
  .section-content {
    padding: 10px;
  }
  .section-content h2 {
    padding-left: 0;
    margin-left: 0;
    margin-right: 0;
  }
  .section-content .main-section {
    margin: 0;
    max-width: 100%;
    padding: 5px;
  }
}
</style>