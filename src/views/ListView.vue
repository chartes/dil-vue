<template>
  <v-container fluid class="imprimeurs-container">
    <v-row>
      <!-- BOUTON AFFICHAGE FACETTES -->
      <v-col cols="12">
        <div class="mb-2 btn-facets" @click="showFacets = !showFacets">
          <v-icon v-if="showFacets" class="icon-close-facet facet-control">mdi-close</v-icon>
          <span v-else class="display-facet-label facet-control">Afficher les facettes</span>
        </div>
      </v-col>

      <!-- COLONNE FACETTES -->
      <v-col cols="12" md="3" v-show="showFacets">
        <FacetFilter
            title="Ville du brevet"
            :apiUrl="`${apiBase}/places/autocomplete`"
            filterType="places"
            @update:selectedTerms="onUpdateFacets"
            @update:dateFilter="onUpdateDate"
            @update:extraSearch="onExtraSearchChange"
            @resetAllFacets="onResetAll"
        />
      </v-col>

      <!-- TABLEAU ET CARTE -->
      <v-col :cols="showFacets ? 9 : 12">
        <!-- BOUTON POUR LA CARTE -->
        <v-btn icon @click="showMap = !showMap" class="mb-1 map-btn">
          <v-icon>{{ showMap ? 'mdi-chevron-up' : 'mdi-map' }}</v-icon>
        </v-btn>

        <!-- PLACEHOLDER CARTE -->
        <v-expand-transition>
          <div v-show="showMap" class="mb-4"
               style="height: 500px; background: #f3f3f3; display: flex; align-items: center; justify-content: center;">
            <LeafletMap
                v-show="showMap"
                :apiBase="apiBase"
                @selectCity="onCitySelected"
            />
          </div>
        </v-expand-transition>

        <!-- TABLEAU -->
        <v-data-table
            :headers="headers"
            :items="imprimeurs"
            :items-per-page="itemsPerPage"
            :page.sync="page"
            :loading="loading"
            :expand-on-click="true"
            item-value="_id_dil"
            show-expand
            fixed-header
            class="elevation-1"
            :expanded.sync="expandedRows"
            @update:expanded="onExpandChange"
        >

          <!-- En-tête du tableau -->


          <template v-for="header in headers" :key="header.key" v-slot:[`header.${header.key}`]="{ column }">
            <thead class="header">
            <tr v-if="header.key === 'lastname'">
              <th class="sortable-header" @click="toggleSort">
                <span class="table-data-span table-data-header-label">{{ column.title }}</span>
                <v-icon class="ml-1">
                  {{ sortDesc ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                </v-icon>
              </th>
            </tr>
            <tr v-else-if="header.key !== 'data-table-expand' && header.key !== 'actions'">
              <th class="table-data-span table-data-header-label">
                {{ column.title }}
              </th>
            </tr>


            </thead>

          </template>
          <template #top>
            <v-toolbar flat>
              <v-toolbar-title> {{ totalItems }}
                {{ pluralize('personne', totalItems) }}
              </v-toolbar-title>
              <v-spacer></v-spacer>
            </v-toolbar>
            <div class="footer-controls d-flex align-center justify-space-between pa-4">
              <v-text-field
                  v-model="searchHeadInfo"
                  label="Recherche nom et/ou prénom"
                  dense
                  hide-details
                  style="max-width: 300px"
                  @input="onHeadSearchChange"
                  @click:clear="onClearHeadSearch"
                  clearable
                  prepend-inner-icon="mdi-magnify"
              />

              <!-- Pagination complète -->
              <div class="pagination-controls d-flex align-center" style="gap: 10px;">
                <v-btn icon :disabled="page <= 1" @click="goToPage(1)" title="Première page">
                  <v-icon>mdi-page-first</v-icon>
                </v-btn>

                <v-btn icon :disabled="page <= 1" @click="page--" title="Page précédente">
                  <v-icon>mdi-chevron-left</v-icon>
                </v-btn>

                <v-text-field
                    v-model.number="page"
                    type="number"
                    min="1"
                    :max="pageCount"
                    dense
                    hide-details
                    style="width: 70px;"
                    @keydown.enter="fetchImprimeurs"
                    @click:clear="onClearSearch"
                    title="Aller à la page"
                ></v-text-field>
                <span>/ {{ pageCount }}</span>

                <v-btn icon :disabled="page >= pageCount" @click="page++" title="Page suivante">
                  <v-icon>mdi-chevron-right</v-icon>
                </v-btn>

                <v-btn icon :disabled="page >= pageCount" @click="goToPage(pageCount)" title="Dernière page">
                  <v-icon>mdi-page-last</v-icon>
                </v-btn>
              </div>
            </div>
          </template>

          <!-- si aucune données disponible -->
          <template #no-data>
            <div class="text-center-no-data">
              <v-icon large>mdi-alert-circle</v-icon>
              <p>Aucune donnée disponible.</p>
            </div>
          </template>


          <!-- Slot pour la colonne des actions -->

          <template #item.lastname="{ item }">
            <div class="table-cell-item table-cell-name">
              <router-link icon :to="`/detail/${item._id_dil}`" :title="`Voir la fiche de ${item.lastname}`"
                           class="mb-3">
                <span>{{ item.lastname }}</span>
              </router-link>
            </div>
          </template>

          <template #item.firstnames="{ item }">
            <div class="table-cell-item table-cell-firstname">
              {{ item.firstnames }}
            </div>
          </template>

          <template #item.total_patents="{ item }">
            <div class="table-cell-item table-cell-patents">
              {{ item.total_patents }}
            </div>
          </template>

          <template #item.data-table-expand="{ item }">
            <v-icon
                class="expand-icon transition-icon"
                :class="{ 'expanded': expandedRows.includes(item._id_dil) }"
            >
              mdi-chevron-down
            </v-icon>
          </template>

          <!-- Slot pour les détails extensibles -->
          <template #expanded-row="{ item, columns }">
            <tr>
              <td :colspan="columns.length" class="pa-4 table-expanded-container">
                <v-expand-transition>
                  <div v-if="expandedRows.includes(item._id_dil)">
                    <div v-if="details[item._id_dil]?.patents?.length">
          <span class="title-expanded-patent-list">
            {{ details[item._id_dil].patents.length }} {{ pluralize('brevet', details[item._id_dil].patents.length) }}
            {{ pluralize('disponible', details[item._id_dil].patents.length) }}
          </span>

                      <ul class="expanded-patent-list list-unstyled mb-0 mt-2 d-flex flex-column gap-2">
                        <li
                            v-for="(patent, index) in details[item._id_dil].patents"
                            :key="index"
                            class="table-cell-item-expanded"
                        >
                          •
                          {{ formatDate(patent.date_start) }} /
                          {{ formatDate(patent.date_end) || 'inconnue' }} –
                          {{ patent.city_label }}
                        </li>
                      </ul>

                      <hr class="my-4 sep-quote" v-if="item.highlight"/>
                      <div v-if="item.highlight" class="highlighted-quote mb-4" v-html="item.highlight"></div>


                    </div>

                    <div v-else>
                      Aucun brevet disponible.
                    </div>

                  </div>
                </v-expand-transition>
              </td>
            </tr>
          </template>


          <!-- Slot pour le footer avec la pagination -->
          <template #bottom>
            <div class="footer-controls d-flex align-center justify-space-between pa-4">
              <!-- Sélecteur du nombre d'éléments par page -->
              <v-select
                  v-model="itemsPerPage"
                  :items="[10, 50, 100]"
                  label="Éléments par page"
                  dense
                  hide-details
                  style="max-width: 200px"
                  @update:modelValue="onItemsPerPageChange"
              ></v-select>

              <!-- Pagination complète -->
              <div class="pagination-controls d-flex align-center" style="gap: 10px;">
                <v-btn icon :disabled="page <= 1" @click="goToPage(1)" title="Première page">
                  <v-icon>mdi-page-first</v-icon>
                </v-btn>

                <v-btn icon :disabled="page <= 1" @click="page--" title="Page précédente">
                  <v-icon>mdi-chevron-left</v-icon>
                </v-btn>

                <!-- Numéros de page -->
                <v-text-field
                    v-model.number="page"
                    type="number"
                    min="1"
                    :max="pageCount"
                    dense
                    hide-details
                    style="width: 70px;"
                    @keydown.enter="fetchImprimeurs"
                    title="Aller à la page"
                ></v-text-field>
                <span>/ {{ pageCount }}</span>

                <v-btn icon :disabled="page >= pageCount" @click="page++" title="Page suivante">
                  <v-icon>mdi-chevron-right</v-icon>
                </v-btn>

                <v-btn icon :disabled="page >= pageCount" @click="goToPage(pageCount)" title="Dernière page">
                  <v-icon>mdi-page-last</v-icon>
                </v-btn>
              </div>
            </div>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import FacetFilter from '@/components/FacetFilter.vue';
import LeafletMap from '@/components/VLeafletMap.vue';

export default {
  name: 'ListView',
  components: {
    FacetFilter,
    LeafletMap
  },
  data() {
    return {
      page: 1,
      itemsPerPage: 10,
      totalItems: 0,
      imprimeurs: [],
      infoSearchQuery: '',

      searchHeadInfo: '',
      searchExtraInfo: '',
      filteredIds: {
        head: [],    // Résultats sur head info uniquement (nom/prénom)
        extra: [],   // Résultats sur extra info uniquement (content / highlight)
        joint: [],   // Résultats communs (intersection de head et extra)
      },
      details: {},
      searchQuery: '',
      typeSearch: 'only_head_info',
      loading: false,
      apiBase: 'http://127.0.0.1:9090/dil/api',
      sortDesc: false, // pour le tri
      showFacets: true,
      selectedFacets: {
        places: [],
        date: ""
      },
      showMap: false,
      expandedRows: [],
      headers: [
        {title: '', key: 'data-table-expand', width: '50px'},
        {title: 'NOM', key: 'lastname', sortable: true, width: '300px'},
        {title: 'PRÉNOM(S)', key: 'firstnames', sortable: false, width: '300px'},
      ]
    }
  },
  computed: {
    pageCount() {
      return Math.ceil(this.totalItems / this.itemsPerPage);
    }
  },
  methods: {
    onSearchChange() {
      this.page = 1;
      this.fetchImprimeurs();
    },
    onHeadSearchChange() {
      const query = this.searchHeadInfo.toLowerCase();

      if (this.searchExtraInfo) {
        // Cas : extra_search est actif -> filtrage dans la base
        const matchingHead = this.imprimeursBase
            .filter(person =>
                (person.lastname && person.lastname.toLowerCase().includes(query)) ||
                (person.firstnames && person.firstnames.toLowerCase().includes(query))
            )
            .map(person => person._id_dil);

        this.filteredIds.head = matchingHead;

        this.computeJointResults();
      } else {
        // Cas classique : reset tout
        this.selectedFacets = {places: [], date: "", date_exact: false};
        this.page = 1;
        this.fetchImprimeurs();
      }
    },
    onResetAll() {
      console.log("Reset global déclenché");

      // 🧹 Vider tous les champs de recherche
      this.searchHeadInfo = '';
      this.searchExtraInfo = '';
      this.infoSearchQuery = '';

      // 🧹 Réinitialiser les filtres de facettes
      this.selectedFacets = {places: [], date: "", date_exact: false};

      // 🧹 Réinitialiser les résultats filtrés
      this.filteredIds = {head: [], extra: [], joint: []};

      // 🧹 Page 1
      this.page = 1;

      // 🧹 Vider base temporaire si tu veux (optionnel)
      if (this.imprimeursBase) {
        this.imprimeursBase = [];
      }

      // 🚀 Recharge tout à zéro
      this.fetchImprimeurs();
    },
    computeJointResults() {
      if (this.searchExtraInfo && this.searchHeadInfo) {
        // ➔ Si les deux recherches sont actives ➔ intersection
        this.filteredIds.joint = this.filteredIds.head.filter(id =>
            this.filteredIds.extra.includes(id)
        );
        this.imprimeurs = this.imprimeursBase.filter(person =>
            this.filteredIds.joint.includes(person._id_dil)
        );
      } else if (this.searchExtraInfo) {
        // ➔ Seulement facettes extra actives
        this.imprimeurs = this.imprimeursBase;
      } else {
        // ➔ Plus rien : cas rare
        this.imprimeurs = [];
      }

      this.totalItems = this.imprimeurs.length;
    },
    async onExtraSearchChange(value) {
      this.searchExtraInfo = value;
      this.page = 1;

      if (!value) {
        // 🧹 Si l'utilisateur a vidé la recherche ➔ reset complet
        this.filteredIds.extra = [];
        this.searchExtraInfo = '';
        this.computeJointResults();
        this.fetchImprimeurs(); // 🔥 recharge la liste normale
        return;
      }

      // 🔎 Sinon, recherche normalement
      const params = new URLSearchParams();
      params.append('page', this.page);
      params.append('size', this.itemsPerPage);
      params.append('sort', this.sortDesc ? 'desc' : 'asc');
      params.append('search', value);
      params.append('mode', 'extra_info');
      if (this.selectedFacets.date) {
          params.append('patent_date_start', this.selectedFacets.date);
        }
        if (this.selectedFacets.date_exact) {
          params.append('exact_patent_date_start', this.selectedFacets.date_exact);
        }
        if (this.selectedFacets.places && this.selectedFacets.places.length > 0) {
          this.selectedFacets.places.forEach(term => {
            params.append('patent_city_query', term);
          });
        }

      try {
        const res = await fetch(`${this.apiBase}/persons?${params.toString()}`);
        const data = await res.json();

        if (Array.isArray(data.items)) {
          this.imprimeursBase = data.items;
          this.filteredIds.extra = data.items.map(person => person._id_dil);
          this.computeJointResults();
        } else {
          console.error('Erreur : items n’est pas un tableau', data);
          this.imprimeursBase = [];
          this.filteredIds.extra = [];
          this.imprimeurs = [];
          this.totalItems = 0;
        }
      } catch (error) {
        console.error('Erreur réseau sur recherche extra info:', error);
      }
    },
    onClearSearch() {
      this.searchHeadInfo = '';  // 🖊️ C'est searchHeadInfo qu'on doit vider, pas searchTerm
      this.filteredIds.head = [];  // 🧹 Vide la partie head (plus de filtrage sur nom/prénom)

      // On recalcule les résultats :
      this.computeJointResults();
    },
    highlightText(text) {
      if (!this.searchQuery) return text;
      const escapedQuery = this.searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuery})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    },
    onCitySelected(cityLabel) {
      if (!this.selectedFacets.places.includes(cityLabel)) {
        this.selectedFacets.places.push(cityLabel);
        this.page = 1;
        this.fetchImprimeurs();
      }
    },
    onClearHeadSearch() {
      this.searchHeadInfo = '';
      this.filteredIds.head = [];
      this.computeJointResults();
      this.fetchImprimeurs();
    },
    onPersonSearch(value) {
      this.infoSearchQuery = value;
      this.page = 1;
      this.fetchImprimeurs();
    },
    async fetchImprimeurs() {
      this.loading = true;
      try {
        const params = new URLSearchParams();
        params.append('page', this.page);
        params.append('size', this.itemsPerPage);
        params.append('sort', this.sortDesc ? 'desc' : 'asc');

        if (this.typeSearch === 'all' && this.searchHeadInfo) {
  params.append('search', this.searchHeadInfo);
  params.append('mode', 'all');
} else if (this.searchExtraInfo) {
  params.append('search', this.searchExtraInfo);
  params.append('mode', 'extra_info');
} else if (this.searchHeadInfo) {
  params.append('search', this.searchHeadInfo);
  params.append('mode', 'head_info');
}

        if (this.selectedFacets.date) {
          params.append('patent_date_start', this.selectedFacets.date);
        }
        if (this.selectedFacets.date_exact) {
          params.append('exact_patent_date_start', this.selectedFacets.date_exact);
        }
        if (this.selectedFacets.places && this.selectedFacets.places.length > 0) {
          this.selectedFacets.places.forEach(term => {
            params.append('patent_city_query', term);
          });
        }

        const res = await fetch(`${this.apiBase}/persons?${params.toString()}`);
        const data = await res.json();
        console.log(data)
        this.imprimeurs = data.items;
        this.totalItems = data.total;
      } catch (err) {
        console.error("Erreur lors du chargement :", err);
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateStr) {
      if (!dateStr) return null;
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    },
    pluralize(word, count, pluralForm = null) {
      return `${word}${count > 1 ? (pluralForm ?? 's') : ''}`;
    },
    onRowClick(item) {
      this.loadDetails(item._id_dil);
    },
    loadDetails: async function (id) {
      if (this.details[id]) return;
      try {
        console.log("Chargement des détails pour l'ID :", id);
        const res = await fetch(`${this.apiBase}/persons/person/${id}?html=false`);

        if (!res.ok) {
          throw new Error('Erreur de réseau');
        } else {
          this.details[id] = await res.json();
        }
      } catch (err) {
        console.error("Erreur de chargement des détails :", err);
      }
    },
    toggleSort() {
      this.sortDesc = !this.sortDesc;
      this.page = 1;
      this.fetchImprimeurs();
    },
    goToPage(pageNumber) {
      if (pageNumber >= 1 && pageNumber <= this.pageCount) {
        this.page = pageNumber;
      }
    },
    onItemsPerPageChange() {
      this.page = 1;
      this.fetchImprimeurs();
    },
    onExpandChange(newExpanded) {
      const newlyExpanded = newExpanded.filter(
          id => !this.expandedRows.includes(id)
      );
      this.expandedRows = newExpanded;
      newlyExpanded.forEach(id => this.loadDetails(id));
    },
    onUpdateFacets({type, terms}) {
      this.selectedFacets[type] = terms;
      this.page = 1;
      this.fetchImprimeurs(); // mise à jour des résultats
    },
    onUpdateDate({date, exact}) {
      console.log("OUD:: ", date, exact)
      this.selectedFacets["date"] = date;
      this.selectedFacets["date_exact"] = exact;
      this.page = 1;
      this.fetchImprimeurs(); // mise à jour des résultats

    }
  },
  watch: {
    page() {
      this.fetchImprimeurs();
    }
  },
  mounted() {
    const openMap = this.$route.query.map;
    if (openMap === 'open') {
      this.showMap = true;
    }
  const searchFromRoute = this.$route.query.search;
  const mode = this.$route.query.mode;

  if (searchFromRoute) {
    this.searchHeadInfo = searchFromRoute;
    this.searchExtraInfo = mode === 'all' ? searchFromRoute : '';
    this.typeSearch = mode || 'only_head_info';
  }

  this.fetchImprimeurs();
}
};
</script>

<style scoped>
.btn-facets {
  font-size: 1.4rem;
  color: var(--brown);
  margin-bottom: 10px;
  cursor: pointer;
}

.icon-close-facet {
  font-size: 1.9rem;
}

.display-facet-label {
  font-size: 1rem;
}

.display-facet-label:hover {
  border-bottom: 2px dotted var(--brown);
  padding-bottom: 10px;
  transition: 0.3s;
  cursor: pointer;
}


/* Style général du header */
:deep(.v-data-table thead th) {
  color: #333333;
  font-size: 1.25rem;
  font-weight: 400;
  text-decoration: none;
  text-align: left;
  padding-top: 10px;
}


/* Style pour les cellules du tableau */
:deep(.v-data-table tbody td ) {
  font-size: 1.3rem;
  color: #333333;
  padding-top: 10px;
  text-align: left;
  padding-bottom: 10px;
  padding-left: 10px;
  margin-top: 10px;
}


/* Style des cellules */
.table-cell-item {
  font-size: 1.15rem;
  margin-top: 10px;
}


.table-cell-name {
  font-weight: 600;
  color: #2c3e50;
}

.table-cell-firstname {
  color: #555;
  font-style: italic;
}

.table-cell-patents {
  font-weight: bold;
  text-align: center;
}


.expand-icon {
  cursor: pointer;
  color: var(--brown);
  font-size: 35px;
  font-weight: bold;
  margin-left: 10px;
  margin-right: 10px;
  margin-top: 10px;
  transition: transform 0.2s ease;
}

.expanded-patent-list {
  margin-top: 10px;
  padding-left: 1rem;
  font-size: 1.1rem;
  line-height: 1.5;
  color: #333;
  list-style-type: none;
}

.table-cell-item-expanded {
  font-size: 1.1rem;
  margin-top: 10px;
  color: #555;
  /* all in one line */
  display: flex;
  align-items: center;
  gap: 5px;
}

.table-expanded-container {
  background-color: #f9f9f9;
  border-top: 1px solid #ddd;
  padding: 1rem;
}

.expanded-patent-list {
  margin: 0;
  padding-left: 1rem;
  font-size: 1.1rem;
  line-height: 1.5;
  color: #333;
  list-style-type: none;
}

.table-cell-item-expanded {
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #555;
  padding-left: 1rem;
}

.title-expanded-patent-list {
  font-size: 1.3rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
  display: block;
  padding-left: 1rem;
}

.transition-icon {
  transition: transform 0.3s ease;
}

.transition-icon.expanded {
  transform: rotate(180deg);
}

.text-center-no-data {
  text-align: center;
  padding: 20px;
  font-size: 1.5rem;
  color: #999;
}

.highlighted-quote {
  position: relative;
  padding-left: 2.5rem;
  font-size: 1.3rem;
  line-height: 1.6;
  font-style: italic;
  color: #444;
  margin-bottom: 1rem;
}

.highlighted-quote::before {
  content: "“";
  position: absolute;
  left: 0;
  top: 0;
  font-size: 3rem;
  line-height: 1;
  color: var(--brown);
  font-family: Georgia, serif;
  font-weight: bold;
}

.highlighted-quote mark {
  background: #fff34d;
  color: #000;
  padding: 0 4px;
  border-radius: 3px;
  font-weight: bold;
}

.sep-quote {
  border: 0;
  height: 1px;
  background-color: var(--brown);
  margin: 20px 0;
}


</style>
