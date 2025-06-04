<template>
  <v-container fluid class="imprimeurs-container ">
    <v-row class="align-center justify-space-between mb-2">
      <v-col cols="auto">
        <div class="btn-facets" @click="showFacets = !showFacets">
          <v-icon v-if="showFacets" class="icon-close-facet facet-control">mdi-close</v-icon>
          <span v-else class="display-facet-label facet-control">Afficher les facettes</span>
        </div>
      </v-col>
      <v-col cols="auto">
        <v-btn icon @click="toggleMap" class="map-btn">
          <v-icon>{{ showMap ? 'mdi-chevron-up' : 'mdi-map' }}</v-icon>
        </v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" md="3" v-show="showFacets">
        <FacetFilter
          ref="facetFilter"
          title="Ville du brevet"
          filterType="places"
          :activateResetBtn="facetResetBtn"
          @update:selectedTerms="onUpdateFacets"
          @update:dateFilter="onUpdateDate"
          @update:extraSearch="onExtraSearchChange"
          @resetAllFacets="onResetAll"
        />
      </v-col>
      <v-col :cols="showFacets ? 9 : 12" class="table-wrapper">
        <v-expand-transition appear v-if="showMap">
          <v-toolbar flat>
            <v-toolbar-title>Carte des imprimeurs-lithographes</v-toolbar-title>
            <v-spacer></v-spacer>
          </v-toolbar>
        </v-expand-transition>
        <v-expand-transition>
          <div v-if="showMap" class="mb-4 show-map-container">
            <LeafletMap
              v-if="showMapContent"
              ref="leaflet"
              :apiBase="apiUrl"
              :cityQuery="selectedFacets.places.map(p => p.id || p.id_dil)"
              :date="selectedFacets.date"
              :exact="selectedFacets.date_exact || false"
              @selectCity="onCitySelected"
            />
          </div>
        </v-expand-transition>
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
            class="elevation-1 table-data"
            :expanded.sync="expandedRows"
            @update:expanded="onExpandChange"
        >
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
                {{ pluralize('imprimeur', totalItems) }}-{{ pluralize('lithographe', totalItems) }}
              </v-toolbar-title>
              <v-spacer></v-spacer>
            </v-toolbar>
            <div class="footer-controls d-flex align-center justify-space-between pa-4">
              <v-text-field
                  v-model="searchHeadInfo"
                  label="Rechercher par nom et/ou prénom(s)"
                  dense
                  hide-details
                  class="search-head-info-input"
                  @input="onHeadSearchChange"
                  @click:clear="onClearHeadSearch"
                  clearable
                  color="var(--light-brown)"
              />
              <div class="pagination-controls d-flex align-center">
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
                    class="search-page-input"
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
          <template #no-data>
            <div class="text-center-no-data">
              <v-icon large>mdi-alert-circle</v-icon>
              <p>Aucune donnée disponible.</p>
            </div>
          </template>
          <template #item.lastname="{ item }">
            <div class="table-cell-item table-cell-name">
              <router-link icon :to="`/detail/${item._id_dil}`" :title="`Voir la fiche de ${item.lastname}`"
                           class="mb-3 name-table-label">
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

                      <hr v-if="item.highlight && displayContext" class="my-4 sep-quote"/>
                      <div v-if="item.highlight && displayContext" class="highlighted-quote mb-4"
                           v-html="item.highlight"></div>


                    </div>

                    <div v-else>
                      Aucun brevet disponible.
                      <hr v-if="item.highlight && displayContext" class="my-4 sep-quote"/>
                      <div v-if="item.highlight && displayContext" class="highlighted-quote mb-4"
                           v-html="item.highlight"></div>
                    </div>

                  </div>
                </v-expand-transition>
              </td>
            </tr>
          </template>
          <template #bottom>
            <div class="footer-controls d-flex align-center justify-space-between pa-4">
              <v-select
                  v-model="itemsPerPage"
                  :items="[10, 50, 100]"
                  label="Éléments par page"
                  dense
                  hide-details
                  class="items-per-page-select"
                  @update:modelValue="onItemsPerPageChange"
              ></v-select>
              <div class="pagination-controls d-flex align-center">
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
                    class="search-page-input"
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
import {mapState} from 'vuex';
import FacetFilter from '@/components/list/ListFacetFilter.vue';
import LeafletMap from '@/components/list/ListLeafletMap.vue';

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
      showMapContent: false,
      searchHeadInfo: '',
      facetResetBtn: false,
      searchExtraInfo: '',
      displayContext: true,
      filteredIds: {
        head: [],    // Résultats sur head info uniquement (nom/prénom)
        extra: [],   // Résultats sur extra info uniquement (content / highlight)
        joint: [],   // Résultats communs (intersection de head et extra)
      },
      details: {},
      searchQuery: '',
      typeSearch: 'only_head_info',
      loading: false,
      sortDesc: false,
      showFacets: true,
      selectedFacets: {
        places: [],
        date: ""
      },
      placesCacheFacets: 0,
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
    ...mapState(["apiUrl"]),
    pageCount() {
      return Math.ceil(this.totalItems / this.itemsPerPage);
    }
  },
  methods: {
    onSearchChange() {
      this.page = 1;
      this.fetchImprimeurs();
    },
    triggerChildReset() {
      this.$refs.facetFilter.onResetAll();
    },
    onHeadSearchChange() {
      const query = this.searchHeadInfo.toLowerCase();

      if (this.searchExtraInfo) {
        const matchingHead = this.imprimeursBase
            .filter(person =>
                (person.lastname && person.lastname.toLowerCase().includes(query)) ||
                (person.firstnames && person.firstnames.toLowerCase().includes(query))
            )
            .map(person => person._id_dil);

        this.filteredIds.head = matchingHead;

        this.computeJointResults();
      } else {
        this.page = 1;
        this.fetchImprimeurs();
      }
    },
    onResetAll() {
      this.facetResetBtn = false;
      this.selectedTerms = [];
      this.personSearchQuery = '';
      this.searchQuery = '';
      this.selectedDate = '';
      this.tempPickedDate = null;
      this.exactMatch = false;
      this.showDropdown = false;

      this.selectedFacets = {
        places: [],
        date: "",
        date_exact: false
      };
      this.filteredIds = {head: [], extra: [], joint: []};
      this.page = 1;

      this.pickerDate = '';
      this.displayedDate = '';

      this.$emit('update:dateFilter', {
        type: this.filterType,
        date: ""
      });

      this.$emit('update:exactMatch', {
        type: this.filterType,
        exact: false
      });

      this.$emit('resetAllFacets');
      this.fetchImprimeurs();
    },
    computeJointResults() {
      if (this.searchExtraInfo && this.searchHeadInfo) {
        this.filteredIds.joint = this.filteredIds.head.filter(id =>
            this.filteredIds.extra.includes(id)
        );
        this.imprimeurs = this.imprimeursBase.filter(person =>
            this.filteredIds.joint.includes(person._id_dil)
        );
      } else if (this.searchExtraInfo) {
        this.imprimeurs = this.imprimeursBase;
      } else {
        this.imprimeurs = [];
      }

      console.log(this.filteredIds.extra.length)
      if (this.filteredIds.extra.length > 0) {
        this.displayContext = true;
      }

      this.totalItems = this.imprimeurs.length;
    },
    async onExtraSearchChange(value) {
      this.searchExtraInfo = value;
      this.displayContext = true;
      this.page = 1;

      if (!value) {
        this.filteredIds.extra = [];
        this.searchExtraInfo = '';
        this.computeJointResults();
        this.fetchImprimeurs();
        return;
      }

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
      console.log("places", this.selectedFacets.places)
      if (this.selectedFacets.places && this.selectedFacets.places.length > 0) {
        this.selectedFacets.places.forEach(term => {
          console.log("term", term)
          params.append('patent_city_query', term.id_dil);
        });
      }

      try {
        const res = await fetch(`${this.apiUrl}/persons?${params.toString()}`);
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
      this.searchHeadInfo = '';
      this.filteredIds.head = [];

      this.computeJointResults();
    },
    highlightText(text) {
      if (!this.searchQuery) return text;
      const escapedQuery = this.searchQuery.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuery})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    },
    async onCitySelected(cityId) {
      console.log(cityId)
      const facetFilter = this.$refs.facetFilter;

      if (this.selectedFacets.places.some(p => p.id === cityId)) return;

      try {
        const res = await fetch(`${this.apiUrl}/referential/cities/city/${cityId}`);
        if (!res.ok) throw new Error("Erreur API");
        const data = await res.json();

        const term = {
          id: data._id_dil,
          label: data.label,
          department_label_fr: data.insee_fr_department_label,
        };

        this.selectedFacets.places.push(term);

        if (typeof facetFilter.addExternalTerm === 'function') {
          facetFilter.addExternalTerm(term);
        }

        this.page = 1;
        this.fetchImprimeurs();

      } catch (err) {
        console.error("Erreur lors de la récupération de la ville :", err);
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
            console.log(term)
            const value = typeof term === 'object' ? term.id : term;
            params.append('patent_city_query', value);
          });
        }
        const res = await fetch(`${this.apiUrl}/persons?${params.toString()}`);
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
        const res = await fetch(`${this.apiUrl}/persons/person/${id}?html=false`);

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
    toggleMap() {
      this.showMap = !this.showMap;

      if (this.showMap) {
        setTimeout(() => {
          this.showMapContent = true;

          this.$nextTick(() => {
            if (this.$refs.leaflet && this.$refs.leaflet.fetchCities) {
              this.$refs.leaflet.fetchCities({
                patent_city_query: this.selectedFacets.places.map(p => p.id || p.id_dil),
                patent_date_start: this.selectedFacets.date,
                exact_patent_date_start: this.selectedFacets.date_exact || false
              });
            }
          });

        }, 300);
      } else {
        this.showMapContent = false;
      }
    },
    onExpandChange(newExpanded) {
      const newlyExpanded = newExpanded.filter(
          id => !this.expandedRows.includes(id)
      );
      this.expandedRows = newExpanded;
      newlyExpanded.forEach(id => this.loadDetails(id));
    },
    onUpdateFacets({type, terms}) {
      if (this.showMap && this.$refs.leaflet && terms.length > 0) {
        if (terms.length > this.placesCacheFacets) {
          const cityId = terms[terms.length - 1].id || terms[terms.length - 1].id_dil;
          this.$refs.leaflet.centerOnCity(cityId);
        }
      }
      if (terms.length === 0 && this.showMap) {
        this.$refs.leaflet.centerOnCity(0);
      }
      this.selectedFacets[type] = terms;
      this.page = 1;
      this.placesCacheFacets = terms.length;
      this.fetchImprimeurs();

    },
    onUpdateDate({date, exact}) {
      console.log("OUD:: ", date, exact)
      this.selectedFacets["date"] = date;
      this.selectedFacets["date_exact"] = exact;
      this.page = 1;
      this.fetchImprimeurs();
      if (this.showMap && this.$refs.leaflet && this.$refs.leaflet.fetchCities) {
        this.$refs.leaflet.fetchCities({
          patent_city_query: this.selectedFacets.places.map(p => p.id || p.id_dil),
          patent_date_start: this.selectedFacets.date,
          exact_patent_date_start: this.selectedFacets.date_exact || false
        });
      }

    }
  },
  watch: {
    'selectedFacets.places': {
      handler(newTerms, oldTerms) {
        console.log('il y a un changement dans les facettes', newTerms, oldTerms);
        const oldIds = oldTerms.map(t => t.id || t.id_dil);
        const newIds = newTerms.map(t => t.id || t.id_dil);

        const added = newIds.find(id => !oldIds.includes(id));

        if (added && this.showMap && this.$refs.leaflet && this.$refs.leaflet.centerOnCity) {
          this.$refs.leaflet.centerOnCity(added);
        }
      },
      deep: true
    },
    showFacets(val) {
      console.log("showFacets changed:", val);
      this.$nextTick(() => {
        if (this.$refs.leaflet && this.$refs.leaflet.map) {
          this.$refs.leaflet.map.invalidateSize();
          this.$refs.leaflet.map.setView([48.8566, 2.3522], 5);
        }
      });
    },
    showMap(val) {
      this.$nextTick(() => {
        if (val && this.$refs.leaflet && this.$refs.leaflet.fetchCities) {
          setTimeout(() => {
            if (this.$refs.leaflet && this.$refs.leaflet.map) {
              this.$refs.leaflet.map.invalidateSize();
            }
          }, 200); // ou 300 ms
          this.$refs.leaflet.fetchCities({
            patent_city_query: this.selectedFacets.places.map(p => p.id || p.id_dil),
            patent_date_start: this.selectedFacets.date,
            exact_patent_date_start: this.selectedFacets.date_exact || false
          });
        }
      });
    },
    page() {
      this.fetchImprimeurs();
    }
  },
  mounted() {
    const openMap = this.$route.query.map;
    if (openMap === 'open') {
      this.showMap = true;
      setTimeout(() => {
        this.showMapContent = true;
      }, 300);
    }
    const searchFromRoute = this.$route.query.search;
    const mode = this.$route.query.mode;


    if (searchFromRoute) {
      this.searchHeadInfo = searchFromRoute;
      this.searchExtraInfo = mode === 'all' ? searchFromRoute : '';
      this.typeSearch = mode || 'only_head_info';
      this.facetResetBtn = true;
      if (searchFromRoute !== '') {
        this.displayContext = false;
      }
    }

    this.fetchImprimeurs();
    this.searchHeadInfo = '';

  }
};
</script>

<style scoped>
.table-data {
  margin-top: -10px;
}
.v-row.mb-2 {
  margin-bottom: 0 !important;
}

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
:deep(.v-data-table thead th) {
  color: #333333;
  font-size: 1.25rem;
  font-weight: 400;
  text-decoration: none;
  text-align: left;
  padding-top: 10px;
}


:deep(.v-data-table tbody td ) {
  font-size: 1.3rem;
  color: #333333;
  padding-top: 10px;
  text-align: left;
  padding-bottom: 10px;
  padding-left: 10px;
  margin-top: 10px;
}

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
  display: flex;
  align-items: center;
  gap: 5px;
}

.facet-control {
  z-index: 3000 !important;
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

.pagination-controls {
  gap: 10px;
}

.transition-icon.expanded {
  transform: rotate(180deg);
}

.search-head-info-input {
  max-width: 500px
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

.btn-facets {
  font-size: 1.4rem;
  color: var(--brown);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1000;
}

.icon-close-facet {
  font-size: 1.9rem;
}

.display-facet-label {
  position: relative;
  font-size: 1rem;
  cursor: pointer;
  color: var(--brown);
}

.display-facet-label::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 0%;
  background-color: var(--brown);
  transition: width 0.2s ease-out;
}

.display-facet-label:hover::after {
  width: 100%;
}

.search-page-input {
  width: 70px;
}

.map-btn {
  color: var(--brown);
  z-index:1000
}

.name-table-label {
  color: #333333;
  transition: color 0.2s ease;
  text-decoration: none;
  font-weight: 600;
}

.name-table-label:hover {
  color: #555;
  text-decoration: none;
}

.show-map-container {
  height: 500px;
}
.items-per-page-select {
  max-width: 200px
}

.search-page-input {
  width: 70px;
}
</style>
