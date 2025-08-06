<template>
  <v-container fluid class="info-page-container">
    <v-row no-gutters>
      <v-col cols="12" md="3" class="menu-col">
        <v-list nav dense class="menu-list mb-0">
          <v-list-item
              v-for="(item, index) in menuItems"
              :key="index"
              :active="activeSection === item.key"
              @click="$router.push({ query: { section: item.key } })"
              class="menu-item"
              :class="{ 'menu-active': activeSection === item.key }"
          >
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-col>

      <v-col cols="12" md="9" class="content-col">
        <div class="section-content">
          <h2>{{ currentTitle }}</h2>
          <component :is="currentComponent"/>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import ContactPage from '@/components/info/InfoContactPage.vue'
import LegalPage from '@/components/info/InfoLegalPage.vue'
import UsagePage from '@/components/info/InfoUsagePage.vue'

export default {
  name: 'InfoView',
  components: {
    ContactPage,
    LegalPage,
    UsagePage
  },
  data() {
    return {
      activeSection: 'usage',
      menuItems: [
        {title: "À propos", key: "usage"},
        {title: "Contact", key: "contact"},
        {title: "Mentions légales", key: "legal"}
      ],
      sections: {
        usage: {title: "À propos", component: 'UsagePage'},
        contact: {title: "Contact", component: 'ContactPage'},
        legal: {title: "Mentions légales", component: 'LegalPage'},
      }
    }
  },
  computed: {
    currentTitle() {
      return this.sections[this.activeSection].title
    },
    currentComponent() {
      return this.sections[this.activeSection].component
    }
  },
  watch: {
    '$route.query.section': {
      immediate: true,
      handler(section) {
        if (this.sections[section]) {
          this.activeSection = section
          window.scrollTo(0, 0)
        }
      }
    }
  },
  mounted() {
    window.scrollTo(0, 0)
  }
}
</script>

<style src="@/assets/css/dil_main_info_pages.css"></style>
<style scoped>

.info-page-container {
  min-height: 80vh;
  padding-top: 30px;
}

.menu-col {
  background-color: #f7f7f7;
  padding: 20px;

  border-right: 2px solid var(--light-brown-alt);
  min-height: 100%;
}

.menu-list {
  background: transparent;
}

.menu-item {
  cursor: pointer;
  border-left: 4px solid transparent;
  padding-left: 10px;
  transition: all 0.2s ease;
}

:deep(.menu-item .v-list-item-title) {
  text-transform: uppercase;
}

.menu-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.menu-active {
  border-left: 4px solid var(--brown);
  font-weight: bold;
  background-color: rgba(123, 12, 18, 0.05);
}

.content-col {
  padding: 40px;
}

.section-content h2 {
  font-size: 1.6rem;
  color: var(--brown);
  margin-bottom: 20px;
  font-weight: 600;
  line-height: 1.4;
  border-bottom: 2px solid var(--light-brown-alt);
  padding-bottom: 10px;
  margin-top: 0;
  text-transform: uppercase;
  margin-left: 10px;
  padding-left: calc(5% - 10px);
}

.section-content .main-section {
  padding: 0;
}

.section-content p {
  font-size: 1rem;
  margin-bottom: 16px;
  line-height: 1.6;
  color: #333;
}

.section-content a {
  color: var(--brown) !important;
}


@media (max-width: 960px) {

  .menu-col {
    border-right: none;
  }

  .info-page-container > div {
    gap: 30px;
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
