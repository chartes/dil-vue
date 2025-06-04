<template>
  <v-container fluid class="detail-view" width="125rem">
    <v-row class="mb-4">
      <v-col cols="12" class="text-left">
        <v-btn @click="$router.push('/list')" class="btn-back-list">
          <v-icon left>mdi-chevron-left</v-icon>
          Retour à la liste
        </v-btn>
      </v-col>
    </v-row>
    <template v-if="person">
      <v-row>
        <v-col cols="12">
          <v-card class="pa-6" outlined elevation="0">
            <v-card-title class="card-title">
              {{ person.firstnames }} {{ person.lastname }}
            </v-card-title>

            <v-card-subtitle v-if="person.birth_date || person.birth_city_label" class="card-subtitle">
              Né <span v-if="person.birth_date">le {{ formatDate(person.birth_date) }}</span>
              <span v-if="person.birth_city_label"> à {{ person.birth_city_label }}</span>
            </v-card-subtitle>

            <v-card-text class="card-text">
              <div v-if="person.personal_information">
                <h2 class="section-title">Informations personnelles</h2>
                <div v-html="person.personal_information" class="section-text mb-6"/>
              </div>

              <div v-if="person.professional_information">
                <h2 class="section-title">Informations professionnelles</h2>
                <div v-html="person.professional_information" class="section-text"/>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <v-row v-for="(patent, i) in person.patents" :key="patent._id_dil" class="mt-8">
        <v-col cols="12">
          <v-card outlined elevation="4" class="pa-6">
            <v-card-title class="patent-title d-flex justify-space-between align-center" @click="togglePatent(i)">
              <div>Brevet n°{{ i + 1 }}</div>
              <div class="d-flex align-center card-sub-container">
                <div class="patent-meta">
                  {{ formatDate(patent.date_start) }}
                  <v-icon small class="mx-1">mdi-chevron-right</v-icon>
                  {{ formatDate(patent.date_end) }} — {{ patent.city_label }}
                </div>
                <v-icon>
                  {{ expandedPatents.includes(i) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                </v-icon>
              </div>
            </v-card-title>

            <v-expand-transition>
              <div v-show="expandedPatents.includes(i)">
                <v-card-text class="card-text">
                  <div v-if="patent.references" class="mb-6">
                    <h2 class="section-title">Bibliographie et sources</h2>
                    <div v-html="patent.references" class="section-text"/>
                  </div>

                  <div v-if="patent.patent_relations?.length" class="mb-6">
                    <h2 class="section-title">Relations</h2>
                    <v-list dense>
                      <template v-for="(group, label) in groupRelations(patent.patent_relations)" :key="label">
                        <v-subheader class="list-subheader">{{ label }}</v-subheader>
                        <v-list-item v-for="relation in group" :key="relation._id_dil">
                          <v-list-item-content>
                            <v-list-item-title>
                        <span @click="goToPerson(relation._id_dil)" class="link-person">
                          {{ relation.firstnames }} {{ relation.lastname }}
                        </span>
                            </v-list-item-title>
                          </v-list-item-content>
                        </v-list-item>
                      </template>
                    </v-list>
                  </div>

                  <div v-if="imagesByPatent[patent._id_dil]?.length">
                    <h2 class="section-title">Galerie</h2>
                    <ImageCarousel :images="imagesByPatent[patent._id_dil]"/>
                  </div>
                </v-card-text>
              </div>
            </v-expand-transition>
          </v-card>
        </v-col>
      </v-row>

    </template>
    <template v-else>
      <v-row justify="center" class="my-12">
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate color="primary"/>
          <p class="loading-text">Chargement des données...</p>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script>
import axios from 'axios'
import ImageCarousel from '@/components/detail/DetailImageCarousel.vue'
import {mapState} from "vuex";

export default {
  name: "DetailView",
  components: {
    ImageCarousel
  },
  data() {
    return {
      person: null,
      imagesByPatent: {},
      expandedPatents: [],
    }
  },
  computed: {
    ...mapState(['apiUrl']),
  },
  watch: {
    '$route.params.id': {
      immediate: true,
      handler(newId) {
        this.fetchPersonData(newId);
      }
    }
  },
  methods: {
    togglePatent(i) {
      const index = this.expandedPatents.indexOf(i);
      if (index > -1) {
        this.expandedPatents.splice(index, 1); // ferme
      } else {
        this.expandedPatents.push(i); // ouvre
      }
    },
    goToPerson(id) {
      this.$router.push({path: '/detail/' + id}).then(() => window.scrollTo({top: 0}));
    },
    async fetchPersonData(id) {
      const personRes = await axios.get(`${this.apiUrl}/persons/person/${id}?html=true`);
      this.person = personRes.data;

      const imagesRes = await axios.get(`${this.apiUrl}/persons/person/${id}/images`);
      this.imagesByPatent = Object.fromEntries(
          imagesRes.data.patent_images.map(pi => [pi.patent_id, pi.images])
      );

      this.expandedPatents = [];
    },
    groupRelations(relations) {
      const grouped = {
        Parrains: [],
        Prédécesseurs: [],
        Successeurs: [],
        Associés: [],
      };
      for (const rel of relations) {
        const type = rel.type?.toLowerCase();
        if (type.includes('parrain')) grouped.Parrains.push(rel);
        else if (type.includes('prédécesseur')) grouped.Prédécesseurs.push(rel);
        else if (type.includes('successeur')) grouped.Successeurs.push(rel);
        else if (type.includes('associé')) grouped.Associés.push(rel);
        else {
          if (!grouped.Autres) grouped.Autres = [];
          grouped.Autres.push(rel);
        }
      }
      return Object.fromEntries(Object.entries(grouped).filter(([_, v]) => v.length));
    },
    formatDate(dateStr) {
      if (!dateStr) return 'date inconnue';
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'});
    },
  }
}
</script>

<style scoped>
.card-title {
  font-size: 2rem;
  font-weight: bold;
  color: #222;
}

.card-subtitle {
  font-size: 1.2rem;
  color: #666;
}

.section-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 2rem 0 1rem;
  color: #333;
}

.section-text, .card-text {
  font-size: 1.2rem;
  color: #444;
  line-height: 1.6;
}

.patent-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  cursor: pointer;
}

.patent-meta {
  font-size: 1.1rem;
  color: #666;
}

.list-subheader {
  font-size: 1.3rem;
  font-weight: bold;
  color: #555;
}

.link-person {
  color: var(--primary);
  cursor: pointer;
}

.link-person:hover {
  text-decoration: underline;
}

.btn-back-list {
  background-color: var(--brown);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  padding: 10px 20px;
  border-radius: 0.5rem;
  display: inline-flex;
  align-items: center;
  text-transform: none;
}

.loading-text {
  font-size: 1.4rem;
  color: #666;
}

.card-sub-container {
  gap: 1rem;
}
</style>
