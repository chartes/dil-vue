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

                  <div v-if="patent.professional_addresses?.length" class="mb-6">
                    <h2 class="section-title">Adresses</h2>
                    <v-list dense>
                      <template
                          v-for="group in groupAddresses(patent.professional_addresses)"
                          :key="group.city"
                      >
                        <!--<v-subheader class="list-subheader">{{ group.city }}</v-subheader>-->

                        <v-list-item
                            v-for="(addr, idx) in group.items"
                            :key="addr._id_dil || `${group.city}-${idx}`"
                        >
                          <v-list-item-content>
                            <v-list-item-title>
                              <template v-if="parseYear(addr.date_occupation) !== null">
                                {{ formatYear(addr.date_occupation) }} — {{ addr.label }}
                              </template>
                              <template v-else>
                                (s.d.) — {{ addr.label }}
                              </template>
                            </v-list-item-title>
                          </v-list-item-content>
                        </v-list-item>
                      </template>
                    </v-list>
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
                    <h2 class="section-title section-title-center">Galerie</h2>
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
      expandedPatents: [0], /* first patent open by defaut */
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
        this.expandedPatents.splice(index, 1);
      } else {
        this.expandedPatents.push(i);
      }
    },
    goToPerson(id) {
      this.$router.push({path: '/detail/' + id}).then(() => window.scrollTo({top: 0}));
    },
    parseYear(dateStr) {
      if (!dateStr) return null;
      const m = String(dateStr).match(/(1[5-9]\d{2}|20\d{2})/); // 1500–2099
      const y = m ? Number(m[1]) : null;
      return Number.isFinite(y) ? y : null;
    },

    groupAddresses(addresses = []) {
      const groups = {};
      for (const a of addresses) {
        const city = a.city_label || 'Ville inconnue';
        if (!groups[city]) groups[city] = [];
        groups[city].push(a);
      }


      const sortByYear = (a, b) => {
        const ya = this.parseYear(a.date_occupation);
        const yb = this.parseYear(b.date_occupation);
        if (ya === null && yb === null) return (a.label || '').localeCompare(b.label || '');
        if (ya === null) return 1;
        if (yb === null) return -1;
        if (ya !== yb) return ya - yb;
        return (a.label || '').localeCompare(b.label || '');
      };

      return Object.entries(groups)
          .sort(([ca], [cb]) => ca.localeCompare(cb))
          .map(([city, items]) => ({city, items: items.sort(sortByYear)}));
    },

    formatYear(dateStr) {
      const y = this.parseYear(dateStr);
      return y ?? 's.d.';
    },
    async fetchPersonData(id) {
      const personRes = await axios.get(`${this.apiUrl}/persons/person/${id}?html=true`);
      this.person = personRes.data;

      const imagesRes = await axios.get(`${this.apiUrl}/persons/person/${id}/images`);
      this.imagesByPatent = Object.fromEntries(
          imagesRes.data.patent_images.map(pi => [pi.patent_id, pi.images])
      );

      this.expandedPatents = this.person.patents.map((_, idx) => idx);
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

.card-subtitle,
.card-title {
  text-overflow: inherit;
  white-space: normal;
}

.card-title {
  font-size: 2rem;
  font-weight: bold;
  line-height: 1.35 !important;
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

.section-text ol {
  list-style-position: inside;
}

.patent-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  cursor: pointer;
}

.patent-meta {
  font-size: 1.1rem;
  color: #888;
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



/* add an index emoji before each link person on hover */

/* add a progressive underline effect on link person */
.link-person {
  position: relative;
  display: inline-block; /* indispensable */
  color: var(--primary);
  text-decoration: none;
  transition: color 0.3s ease;
  padding-bottom: 2px; /* espace pour la ligne progressive */
}

/* ligne progressive */
.link-person::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  width: 0;
  height: 2px;
  background-color: var(--brown);
  transition: width 0.3s ease;
}


/* effets au survol */
.link-person:hover {
  color: var(--brown);
}

.link-person:hover::after {
  width: 100%;
}

.link-person:hover::before {
  opacity: 1;
  transform: translateX(0);
}

:deep(.section-text a) {
  position: relative;
  color: var(--brown);
  text-decoration: none;
  transition: color 0.3s ease;
}

:deep(.section-text a::after) {
  content: "";
  position: absolute;
  left: 0;
  bottom: -2px;
  width: 0%;
  height: 2px;
  background-color: var(--link-over-color);
  transition: width 0.3s ease;
}

:deep(.section-text a:hover) {
  color: var(--brown);
}

:deep(.section-text a:hover::after) {
  width: 100%;
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

@media (max-width: 960px) {
  .v-row .v-col .pa-6 {
    padding: 0 !important;
  }

  .v-row .v-col .card-title,
  .v-row .v-col .card-subtitle,
  .v-row .v-col .pa-6 > .card-text {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  .v-card .v-card-title.patent-title {
    margin-top: 10px;
    flex-direction: column;
    gap: 5px;
    align-items: flex-start !important;
  }

  .patent-title .mdi-chevron-down,
  .patent-title .mdi-chevron-up {
    position: absolute;
    top: 10px;
    right: 10px;
  }

  .patent-meta {
    white-space: normal;
  }

  .card-title[data-v-167ce9ae] {
    font-size: 1.3rem;
  }

  .section-title {
    font-size: 1.1rem;
    margin: 1.5rem 0 0.2rem;
  }

  .v-card .v-card-subtitle,
  .section-text,
  .card-text {
    font-size: 1rem;
    line-height: 1.6;
  }

  .list-subheader {
    font-size: 0.95rem;
  }
}

.v-list-item + .v-list-item {
  margin-top: -7px;
}

.section-title-center {
  text-align: center;
  padding-bottom: -12px;
}
</style>
