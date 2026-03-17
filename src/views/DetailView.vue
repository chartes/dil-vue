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
          <v-card class="pa-6 person-card" outlined elevation="3">
            <v-card-title
                class="card-title person-card-header d-flex justify-space-between align-start"
                @click="togglePersonCard"
            >
              <span>{{ person.firstnames }} {{ person.lastname }}</span>

              <div class="person-toggle-hint">
                <v-icon class="person-toggle-icon">
                  {{ personExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                </v-icon>
                <span class="person-toggle-text">
    {{ personExpanded ? 'Réduire les informations' : 'Voir les informations' }}
  </span>
              </div>
            </v-card-title>

            <v-card-subtitle
                v-if="person.birth_date || person.birth_city_label"
                class="card-subtitle person-card-subtitle-clickable"
                @click="togglePersonCard"
            >
              Né <span v-if="person.birth_date">le {{ formatDate(person.birth_date) }}</span>
              <span v-if="person.birth_city_label"> à {{ person.birth_city_label }}</span>
            </v-card-subtitle>

            <v-expand-transition>
              <div v-show="personExpanded">
                <v-card-text class="card-text" @click.stop>
                  <div v-if="person.personal_information" class="mb-6">
                    <h2 class="section-title">Informations personnelles</h2>
                    <div v-html="person.personal_information" class="section-text"/>
                  </div>

                  <div v-if="person.professional_information">
                    <h2 class="section-title">Informations professionnelles</h2>
                    <div v-html="person.professional_information" class="section-text"/>
                  </div>

                  <div
                      v-if="!person.personal_information && !person.professional_information"
                      class="section-text"
                  >
                    Aucune information disponible.
                  </div>
                </v-card-text>
              </div>
            </v-expand-transition>
          </v-card>
        </v-col>
      </v-row>

      <v-row v-for="(patent, i) in person.patents" :key="patent._id_dil" class="mt-8">
        <v-col cols="12">
          <v-card outlined elevation="4" class="pa-6 patent-card">
            <v-card-title
                class="patent-title patent-card-header d-flex justify-space-between align-center"
                @click="togglePatent(i)"
            >
              <div class="patent-title-header">
  {{ getPatentLabel(patent) }} — {{ patent.city_label }}
</div>
              <div class="d-flex align-center card-sub-container">
                <div class="patent-meta">
                  {{ formatDate(patent.date_start) }}
                  <v-icon small class="mx-1">mdi-chevron-right</v-icon>
                  {{ formatDate(patent.date_end) }}
                </div>
                <v-icon>
                  {{ expandedPatents.includes(i) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                </v-icon>
              </div>
            </v-card-title>

            <v-expand-transition>
              <div v-show="expandedPatents.includes(i)">
                <v-card-text class="card-text" @click.stop>
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
                       <span @click.stop="goToPerson(relation._id_dil)" class="link-person">
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
      expandedPatents: [0],
      personExpanded: false,
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
    getPatentLabel(patent) {
  const year = this.parseYear(patent?.date_start);
  return year !== null && year >= 1870 ? 'Activité' : 'Brevet';
},
    togglePersonCard() {
      this.personExpanded = !this.personExpanded;
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
      this.personExpanded = false;
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
  font-size: 1.35rem;
  color: #666;
  line-height: 1.45;
}

.patent-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.25rem;
  width: 100%;
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  cursor: pointer;
}

.patent-title-header {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.25;
  color: #333;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.detail-view .v-row {
  margin-top: -1rem;
  margin-bottom: -0.90rem;
}


.card-sub-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.9rem;
  flex: 0 0 auto;
  margin-left: auto;
}

.patent-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: #666;
  line-height: 1.2;
  text-align: right;
  white-space: nowrap;
}

.section-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 2rem 0 1rem;
  color: #333;
}

.section-text,
.card-text {
  font-size: 1.2rem;
  color: #444;
  line-height: 1.6;
}

:deep(.section-text ol) {
  list-style-position: inside;
}

.list-subheader {
  font-size: 1.40rem;
  font-weight: bold;
}

.link-person {
  position: relative;
  display: inline-block;
  color: var(--primary);
  cursor: pointer;
  text-decoration: none;
  transition: color 0.3s ease;
  padding-bottom: 2px;
}

.link-person::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  width: 0;
  height: 2px;
  background-color: var(--red-pompein);
  transition: width 0.3s ease;
}

.link-person:hover {
  color: var(--red-pompein);
}

.link-person:hover::after {
  width: 100%;
}

.link-person:hover::before {
  opacity: 1;
  transform: translateX(0);
}

.patent-card {
  transition: background-color 0.25s ease, box-shadow 0.25s ease;
  cursor: pointer;
}

.patent-card:hover {
  background-color: #f5f5f5;
}

.patent-card:hover .patent-title,
.patent-card:hover .patent-title-header,
.patent-card:hover .patent-meta,
.patent-card:hover .mdi-chevron-down,
.patent-card:hover .mdi-chevron-up,
.patent-card:hover .mdi-chevron-right {
  color: var(--red-pompein);
}

:deep(.section-text a) {
  position: relative;
  color: var(--red-pompein);
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
  color: var(--red-pompein);
}

:deep(.section-text a:hover::after) {
  width: 100%;
}

.btn-back-list {
  background-color: var(--red-pompein);
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

.clickable-heading {
  cursor: pointer;
  transition: color 0.25s ease, opacity 0.25s ease;
}

.clickable-heading:hover {
  color: var(--red-pompein);
  opacity: 0.9;
}

.person-toggle-hint {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin-left: 1rem;
  flex-shrink: 0;
}

.mdi-chevron-up {
  color: var(--red-pompein);
  font-size: 1.97rem !important;
}

.mdi-chevron-down {
  color: var(--red-pompein);
  font-size: 1.97rem !important;
}

.person-toggle-icon {
  color: var(--red-pompein);
  font-size: 1.97rem;
}

.person-toggle-text {
  font-size: 0.95rem;
  line-height: 1.1;
  color: #777;
  font-style: italic;
  white-space: nowrap;
  text-align: left;
  opacity: 0.95;
}

.person-card,
.patent-card {
  transition: background-color 0.25s ease, box-shadow 0.25s ease;
  cursor: pointer;
}

.person-card,
.patent-card {
  padding: 14px !important;
}

.person-card:hover,
.patent-card:hover {
  background-color: #f5f5f5;
}

.person-card:hover .card-title,
.person-card:hover .card-subtitle,
.person-card:hover .person-toggle-text,
.person-card:hover .person-toggle-icon,
.patent-card:hover .patent-title,
.patent-card:hover .patent-title-header,
.patent-card:hover .patent-meta,
.patent-card:hover .mdi-chevron-down,
.patent-card:hover .mdi-chevron-up,
.patent-card:hover .mdi-chevron-right {
  color: var(--red-pompein);
}


.v-list-item + .v-list-item {
  margin-top: -7px;
}

.section-title-center {
  text-align: center;
}

.patent-card,
.person-card {
  overflow: hidden;
}

.patent-card:hover .v-card-text,
.patent-card:hover .v-list,
.patent-card:hover .v-list-item,
.patent-card:hover .v-list-item__content {
  background-color: transparent !important;
}

.v-list {
  background: transparent !important;
}

.v-list-item {
  background: transparent !important;
}

@media (max-width: 1260px) {
  .card-title,
  .patent-title,
  .patent-title-header {
    font-size: 1.75rem;
  }

  .card-subtitle {
    font-size: 1.2rem;
  }

  .patent-meta {
    font-size: 1.3rem;
  }

  .section-title {
    font-size: 1.35rem;
  }

  .section-text,
  .card-text {
    font-size: 1.1rem;
  }

  .list-subheader {
    font-size: 1.25rem;
  }

  .person-toggle-text {
    font-size: 0.95rem;
  }
}


@media (max-width: 960px) {

  .person-card,
  .patent-card {
    padding: 18px !important;
  }

  .card-title {
    font-size: 1.45rem;
  }

  .card-subtitle {
    font-size: 1.1rem;
  }

  .patent-title {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 0.55rem;
    margin-top: 0;
    font-size: 1.35rem;
  }

  .patent-title-header {
    font-size: 1.35rem;
    width: 100%;
  }

  .card-sub-container {
    width: 100%;
    justify-content: space-between;
    gap: 0.75rem;
    margin-left: 0;
  }

  .patent-meta {
    font-size: 1.1rem;
    white-space: normal;
    text-align: left;
    line-height: 1.35;
  }

  .patent-title .mdi-chevron-down,
  .patent-title .mdi-chevron-up {
    position: static;
  }

  .section-title {
    font-size: 1.2rem;
    margin: 1.5rem 0 0.35rem;
  }

  .section-text,
  .card-text,
  .v-card .v-card-subtitle {
    font-size: 1rem;
    line-height: 1.6;
  }

  .list-subheader {
    font-size: 1.05rem;
  }

  .person-toggle-hint {
    margin-left: 0.5rem;
    gap: 0.3rem;
    align-items: center;
  }

  .person-toggle-text {
    font-size: 0.82rem;
    white-space: normal;
    text-align: right;
  }
}

@media (max-width: 800px) {
  .card-title {
    font-size: 1.25rem;
    line-height: 1.25 !important;
  }

  .card-subtitle {
    font-size: 1rem;
  }

  .person-card,
  .patent-card {
    padding: 2px !important;
  }

  .patent-title,
  .patent-title-header {
    font-size: 1.15rem;
  }

  .patent-meta {
    font-size: 0.98rem;
  }

  .section-title {
    font-size: 1.05rem;
  }

  .section-text,
  .card-text {
    font-size: 0.96rem;
  }

  .list-subheader {
    font-size: 0.98rem;
  }

  .person-toggle-text {
    font-size: 0.76rem;
  }

  .person-toggle-icon,
  .mdi-chevron-up,
  .mdi-chevron-down {
    font-size: 1.5rem !important;
  }
}
</style>
