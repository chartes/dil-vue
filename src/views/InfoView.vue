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
          <p v-for="(paragraph, i) in currentContent.content" :key="i">
            {{ paragraph }}
          </p>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
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
          content: [
            "Utilisez la barre de recherche pour retrouver un imprimeur, une ville ou une date.",
            "Vous pouvez également consulter les notices ou utiliser la carte interactive pour naviguer par géographie."
          ]
        },
        contact: {
          title: "Contact",
          content: [
            "Pour toute question ou suggestion, vous pouvez contacter l’équipe du projet à l’adresse : contact@imprimeurs19.fr",
          ]
        },
        legal: {
          title: "Mentions légales",
          content: [
            "Ce site est hébergé par l’École nationale des chartes.",
            "Les données sont mises à disposition sous licence ouverte. Consultez la page des mentions légales pour en savoir plus."
          ]
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
        }
      }
    }
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
}

.section-content p {
  font-size: 1rem;
  margin-bottom: 16px;
  line-height: 1.6;
  color: #333;
}
</style>
