<template>
  <v-container fluid class="info-page-container">
    <v-row no-gutters>
      <!-- Menu de gauche -->
      <v-col cols="12" md="3" class="menu-col">
        <v-list nav dense class="menu-list">
          <v-list-item
              v-for="(item, index) in menuItems"
              :key="index"
              :active="activeSection === item.key"
              @click="activeSection = item.key"
              class="menu-item"
              :class="{ 'menu-active': activeSection === item.key }"
          >
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-col>

      <!-- Contenu de droite -->
      <v-col cols="12" md="9" class="content-col">
        <div class="section-content">
          <h2>{{ currentContent.title }}</h2>
          <span v-html="currentContent.content"> </span>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import UsagePage from '@/pages/usage.html?raw';
import ContactPage from '@/pages/contact.html?raw';
import LegalPage from '@/pages/legal.html?raw';

export default {
  name: 'InfoView',
  data() {
    return {
      activeSection: 'about',
      menuItems: [
        {title: "Mode d'emploi", key: "usage"},
        {title: "Contact", key: "contact"},
        {title: "Mentions légales", key: "legal"},
      ],
      sections: {
        usage: {
          title: "Mode d'emploi",
          content: UsagePage
        },
        contact: {
          title: "Contact",
          content: ContactPage
        },
        legal: {
          title: "Mentions légales",
          content: LegalPage
        }
      }
    }
  },
  computed: {
    currentContent() {
      return this.sections[this.activeSection]
    },

  },
  watch: {
    '$route.query.section': {
      immediate: true,
      handler(section) {
        if (this.sections[section]) {
          this.activeSection = section;
          window.scrollTo(0, 0);
        }
      }
    }
  },
  mounted() {
    window.scrollTo(0, 0);
  }
}
</script>

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
}

.section-content p {
  font-size: 1rem;
  margin-bottom: 16px;
  line-height: 1.6;
  color: #333;
}
</style>
