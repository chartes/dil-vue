<template>
  <v-container fluid class="imprimeurs-container">
    <v-row class="align-start justify-start mb-2">
      <v-col
          cols="3"
          class="facet-sidebar"
          :class="{ 'facet-visible': showFacets }"
      >
        <transition name="slide-x" mode="out-in">
          <v-row class="align-center mb-3 facet-control">

            <v-col cols="auto">

              <div

                  v-if="showFacets"
                  class="facet-toggle-btn"
                  @click="showFacets = false"
              >
                <v-icon class="facet-reopen-icon">mdi-tune-variant</v-icon>
                <span class="facet-reopen-label">FERMER LES FILTRES</span>

              </div>
            </v-col>
          </v-row>
        </transition>
        <br>
        <br>
        <br>
        <br>
        <br>

        <FacetFilter
            ref="facetFilter"
            title="Ville du brevet"
            filterType="places"
            :activateResetBtn="facetResetBtn"
            @update:selectedTerms="onUpdatePlaces"
            @update:dateFilter="onUpdateDate"
            @update:extraSearch="onExtraSearchChange"
            @update:exactMatch="onUpdateExactMatch"
            @resetAllFacets="onResetAll"
        />

      </v-col>

      <v-col :cols="showFacets ? 9 : 12">
        <br>
        <br>
        <br>
        <v-expand-transition appear>
          <v-toolbar flat class="toolbar-header d-flex">

            <v-toolbar-title class="panel-header-title-with-toggle">
              <v-icon class="mr-2 map-icon">
                mdi-map
              </v-icon>
              Carte des imprimeurs-lithographes
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn icon @click="toggleMap" class="map-btn ml-2 d-flex align-center">
              <v-icon :class="{ 'chevron-rotated': showMap }">mdi-chevron-right</v-icon>
            </v-btn>
          </v-toolbar>
        </v-expand-transition>

        <v-expand-transition>
          <div v-if="showMap" class="show-map-container">
            <LeafletMap
                v-if="showMapContent"
                ref="leaflet"
                :apiBase="apiUrl"
                :cityQuery="selectedFacets.places.map(p => p.id || p.id_dil)"
                :date="selectedFacets.date.date"
                :exact="selectedFacets.date_exact || false"
                @selectCity="onCitySelected"
            />
          </div>
        </v-expand-transition>

        <br/>
        <v-data-table
            id="table-imprimeurs"
            :headers="headers"
            :items="imprimeurs"
            :items-per-page="itemsPerPage"
            :page.sync="page"
            :loading="loading"
            item-value="_id_dil"
            class="elevation-1"
            show-expand
            fixed-header
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
            <v-toolbar flat class="toolbar-header d-flex">
              <v-toolbar-title class="panel-header-title">
                {{ totalItems }} {{ pluralize('imprimeur', totalItems) }} - {{ pluralize('lithographe', totalItems) }}
              </v-toolbar-title>
              <v-spacer></v-spacer>
            </v-toolbar>

            <div class="footer-controls d-flex align-center justify-space-between pa-4">
              <v-text-field
                  v-model="searchHeadInfo"
                  label="Filtrer par nom et/ou prénoms"
                  class="search-head-info-input"
                  color="var(--light-brown)"
                  dense
                  clearable
                  @input="fetchImprimeurs"
                  @click:clear="onClearFirstnamesLastname"
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
                    title="Aller à la page"
                />
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
              <router-link
                  :to="`/detail/${item._id_dil}`"
                  :title="`Voir la fiche de ${item.lastname}`"
                  class="mb-3 name-table-label"
              >
                <span>{{ item.lastname }}</span>
              </router-link>
            </div>
          </template>

          <template #item.firstnames="{ item }">
            <router-link
                :to="`/detail/${item._id_dil}`"
                :title="`Voir la fiche de ${item.lastname}`"
                class="mb-3 first-name-table-label"
            >
              <span>{{ item.firstnames }}</span>
            </router-link>
          </template>

          <template #item.total_patents="{ item }">
            <div class="table-cell-item table-cell-patents">
              {{ item.total_patents }}
            </div>
          </template>

          <template #item.data-table-expand="{ item }">
            <v-icon
                class="expand-icon transition-icon"
                :class="{ expanded: expandedRows.includes(item._id_dil) }"
                @click.stop="toggleExpandedRow(item._id_dil)"
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
                      <router-link
                          :to="`/detail/${item._id_dil}`"
                          :title="`Voir la fiche de ${item.lastname}`"
                      >
                        <span class="title-expanded-patent-list">
                          {{ details[item._id_dil].patents.length }}
                          {{ pluralize('brevet', details[item._id_dil].patents.length) }}
                          {{ pluralize('disponible', details[item._id_dil].patents.length) }}
                        </span>
                      </router-link>

                      <ul class="expanded-patent-list list-unstyled mb-0 mt-2 d-flex flex-column gap-2">
                        <li
                            v-for="(patent, index) in details[item._id_dil].patents"
                            :key="index"
                            class="table-cell-item-expanded"
                        >
                          • {{ formatDate(patent.date_start) }} /
                          {{ formatDate(patent.date_end) || 'inconnue' }} –
                          {{ patent.city_label }}
                        </li>
                      </ul>
                    </div>
                    <div v-else>
                      Aucun brevet disponible.
                    </div>

                    <hr v-if="item.highlight" class="my-4 sep-quote"/>
                    <div v-if="item.highlight" class="highlighted-quote mb-4" v-html="item.highlight"/>
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
                    title="Aller à la page"
                />
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

    <div

        v-if="!showFacets"
        class="facet-toggle-btn"
        @click="showFacets = true"
    >
      <v-icon class="facet-reopen-icon">mdi-tune-variant</v-icon>
      <span class="facet-reopen-label">OUVRIR LES FILTRES</span>
    </div>
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
      imprimeurs: [],
      searchHeadInfo: '',
      searchExtraInfo: '',
      facetResetBtn: false,
      totalItems: 0,
      sortDesc: false,
      showFacets:  window.innerWidth > 960, /* filter panel closed by default on small devices */
      expandedRows: [],
      details: {},
      showMap: false,
      showMapContent: false,
      selectedFacets: {
        places: [],
        date: ""
      },
      headers: [
        {title: '', key: 'data-table-expand', width: '50px'},
        {title: 'Nom', key: 'lastname', class: 'col-lastname'},
        {title: 'Prénom(s)', key: 'firstnames', class: 'col-firstnames'}
      ],
      loading: false
    }
  },
  computed: {
    ...mapState(["apiUrl"]),
    pageCount() {
      return Math.ceil(this.totalItems / this.itemsPerPage);
    },
  },
  methods: {
    pluralize(word, count, pluralForm = null) {
      return `${word}${count > 1 ? (pluralForm ?? 's') : ''}`;
    },
    onClearFirstnamesLastname() {
      this.searchHeadInfo = '';
      this.fetchImprimeurs();
    },
    goToPage(pageNumber) {
      if (pageNumber >= 1 && pageNumber <= this.pageCount) {
        this.page = pageNumber;
      }
    },
    async onCitySelected(cityId) {
      console.log("onCitySelected1", cityId);
      const facetFilter = this.$refs.facetFilter;

      if (this.selectedFacets.places.some(p => p.id === cityId)) return;

      console.log("onCitySelected2", cityId);

      try {
        const res = await fetch(`${this.apiUrl}/referential/cities/city/${cityId}`);
        if (!res.ok) throw new Error("Erreur API");
        const data = await res.json();

        const term = {
          id: data._id_dil,
          label: data.label,
          department_label_fr: data.insee_fr_department_label,
        };


        this.selectedFacets.places = [...this.selectedFacets.places, term];

        if (typeof facetFilter.addExternalTerm === 'function') {
          facetFilter.addExternalTerm(term);
        }

        this.page = 1;
        await this.fetchImprimeurs();

      } catch (err) {
        console.error("Erreur lors de la récupération de la ville :", err);
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
    scrollTop() {
      window.scrollTo({top: 0});
    },
    toggleMap() {
      this.showMap = !this.showMap;

      if (this.showMap) {
        setTimeout(() => {
          this.showMapContent = true;
          this.$nextTick(() => {
            const mapRef = this.$refs.leaflet?.map;
            if (mapRef) {
              mapRef.invalidateSize();
            }

            this.$refs.leaflet?.fetchCities({
              patent_city_query: this.selectedFacets.places.map(p => p.id || p.id_dil),
              patent_date_start: this.selectedFacets.date?.date,
              exact_patent_date_start: this.selectedFacets.date?.exact || false
            });
          });
        }, 300);
      } else {
        this.showMapContent = false;
      }
    },
    toggleExpandedRow(id) {
      const index = this.expandedRows.indexOf(id);
      if (index > -1) {
        this.expandedRows.splice(index, 1);
      } else {
        this.expandedRows.push(id);
        this.loadDetails(id);
      }
    },
    async onResetAll() {
      this.selectedFacets.places = [];
      this.selectedFacets.date = "";
      this.searchExtraInfo = '';
      this.searchHeadInfo = '';
      this.expandedRows = [];
      this.details = {};
      await this.refreshResults();
    },
    async refreshResults(fetch = true, scrollTop = true) {
      this.page = 1;
      if (scrollTop) {
        this.scrollTop();
      }
      if (fetch) {
        await this.fetchImprimeurs();
      }
    },
    async onItemsPerPageChange() {
      this.page = 1;
      await this.fetchImprimeurs();
    },
    async toggleSort() {
      this.sortDesc = !this.sortDesc;
      await this.refreshResults();
    },
    onExpandChange(newExpanded) {
      const newlyExpanded = newExpanded.filter(
          id => !this.expandedRows.includes(id)
      );
      this.expandedRows = newExpanded;
      newlyExpanded.forEach(id => this.loadDetails(id));
    },
    async onExtraSearchChange(value) {
      this.searchExtraInfo = value;
      await this.refreshResults();
    },
    async onUpdateDate(dateRange) {
      this.selectedFacets.date = dateRange;
      //await this.refreshResults();
      if (this.showMap && this.$refs.leaflet && this.$refs.leaflet.fetchCities) {
        this.$refs.leaflet.fetchCities({
          patent_city_query: this.selectedFacets.places.map(p => p.id || p.id_dil),
          patent_date_start: this.selectedFacets.date.date,
          exact_patent_date_start: this.selectedFacets.date.exact || false
        });
      }

    },
    async onUpdatePlaces(value) {

      this.selectedFacets.places = value.terms;

      if (this.showMap && this.$refs.leaflet && this.$refs.leaflet.fetchCities) {
        this.$refs.leaflet.fetchCities({
          patent_city_query: this.selectedFacets.places.map(p => p.id || p.id_dil),
          patent_date_start: this.selectedFacets.date.date,
          exact_patent_date_start: this.selectedFacets.date.exact || false
        });
      }
    },
    async fetchImprimeurs() {
      this.loading = true;
      try {
        const params = new URLSearchParams();
        params.append('page', this.page);
        params.append('size', this.itemsPerPage);
        params.append('sort', this.sortDesc ? 'desc' : 'asc');
        if (this.searchHeadInfo) {
          params.append('search_head_info', this.searchHeadInfo);
        }
        if (this.searchExtraInfo) {
          params.append('search_extra_info', this.searchExtraInfo);
        }
        if (this.selectedFacets.date.date) {
          params.append('patent_date_start', this.selectedFacets.date.date);
          params.append('exact_patent_date_start', this.selectedFacets.date.exact);
        }

        if (this.selectedFacets.places.length > 0) {
          this.selectedFacets.places.forEach(term => {
            params.append('patent_city_query', term.id_dil || term.id);
          });
        }


        const res = await fetch(`${this.apiUrl}/persons?${params.toString()}`);
        const data = await res.json();
        this.imprimeurs = data.items;
        this.totalItems = data.total;

      } catch (err) {
        console.error('Erreur lors du chargement :', err);
      } finally {
        this.loading = false;
      }
    },
    onUpdateExactMatch(payload) {
      this.selectedFacets.date_exact = payload.exact;

      if (this.showMap && this.$refs.leaflet?.fetchCities) {
        this.$refs.leaflet.fetchCities({
          patent_city_query: this.selectedFacets.places.map(p => p.id || p.id_dil),
          patent_date_start: this.selectedFacets.date.date,
          exact_patent_date_start: this.selectedFacets.date_exact || false
        });
      }
    },
    loadDetails: async function (id) {
      if (this.details[id]) return;
      try {
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
  },
  watch: {
    'selectedFacets.places': {
      handler(newTerms) {
        this.page = 1;
        this.fetchImprimeurs();
        if (this.$refs.leaflet?.fetchCities) {
          this.$refs.leaflet.fetchCities({
            patent_city_query: newTerms.map(p => p.id || p.id_dil),
            patent_date_start: this.selectedFacets.date.date,
            exact_patent_date_start: this.selectedFacets.date.exact || false
          });
        }
      },
      deep: true
    },
    'selectedFacets.date': {
      handler() {
        this.page = 1;
        this.fetchImprimeurs();
        if (this.$refs.leaflet?.fetchCities) {
          this.$refs.leaflet.fetchCities({
            patent_city_query: this.selectedFacets.places.map(p => p.id || p.id_dil),
            patent_date_start: this.selectedFacets.date.date,
            exact_patent_date_start: this.selectedFacets.date.exact || false
          });
        }
      },
      deep: true
    },
    showFacets(val) {
      // refresh map if open
      this.$nextTick(() => {
        if (this.$refs.leaflet && this.$refs.leaflet.map) {
          this.$refs.leaflet.map.invalidateSize();
          this.$refs.leaflet.map.setView([48.8566, 2.3522], 5);
        }
      });
    },
    page() {
      this.fetchImprimeurs();
    },
    itemsPerPage() {
      this.page = 1;
      this.fetchImprimeurs();
    },
    searchHeadInfo() {
      this.page = 1;
    },
    showMap(val) {
      this.$nextTick(() => {
        if (val && this.$refs.leaflet && this.$refs.leaflet.fetchCities) {
          setTimeout(() => {
            if (this.$refs.leaflet && this.$refs.leaflet.map) {
              this.$refs.leaflet.map.invalidateSize();
            }
          }, 200);
          this.$refs.leaflet.fetchCities({
            patent_city_query: this.selectedFacets.places.map(p => p.id || p.id_dil),
            patent_date_start: this.selectedFacets.date.date,
            exact_patent_date_start: this.selectedFacets.date.exact || false
          });
        }
      });
    },
  },
  mounted() {
    const openMap = this.$route.query.map;
    if (openMap === 'open') {
      this.showMap = true;
      setTimeout(() => {
        this.showMapContent = true;
      }, 300);
    }
    const mode = this.$route.query.mode;
    this.fetchImprimeurs();
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

.panel-header-title-with-toggle {
  flex: calc(100% - 100px) 0 0;
  width: calc(100% - 100px);
}

.panel-header-title {
  flex: calc(100% - 40px) 0 0;
  width: calc(100% - 40px);
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

.table-expanded-container a {
  display: inline-block;
  margin-left: 10px;
  padding-left: 20px;
  background: url("@/assets/images/icons/lien_ext.svg") top 4px left / 22px auto no-repeat;
  text-decoration: none;
}

.table-expanded-container a:hover {
  background-image: url("@/assets/images/icons/lien_ext_hover.svg");
}

.table-expanded-container a:hover span.title-expanded-patent-list {
  color: var(--brown);
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
  z-index: 1000
}

.name-table-label {
  display: inline-block;
  width: 100%;
  color: #333333;
  transition: color 0.2s ease;
  text-decoration: none;
  font-weight: 600;
}

.first-name-table-label {
  color: #333333;
  font-weight: 400;
  text-decoration: none;
}

.first-name-table-label:hover,
.name-table-label:hover {
  color: var(--brown);
  text-decoration: none;
}

.items-per-page-select {
  max-width: 200px
}

.search-page-input {
  width: 70px;
}

.facet-sidebar {
  position: sticky;
  top: 0;
  align-self: flex-start;
  z-index: 10;

  max-height: 100vh;
  overflow-y: auto;
  padding-right: 16px;
  padding-top: 50px;
}

.facet-sidebar.facet-visible + .v-col {
  margin-top: 86px;
}

.facet-sidebar br,
.facet-sidebar .facet-filter-container {
  display: none;
}

.facet-sidebar.facet-visible br,
.facet-sidebar.facet-visible .facet-filter-container {
  display: block;
}



:deep(.v-data-table) {
  max-height: 150vh;
  overflow-y: auto;
}

:deep(.v-data-table .v-table__wrapper > table tbody > tr:hover) {
  background: rgb(var(--v-theme-surface-light));
}

:deep(.v-data-table .expand-icon) {
  margin-top: 0;
}

.show-map-container {
  border: 1px solid #EEEEEE;
  border-radius: 0px 0px 20px 20px;
  height: 60vh;
  margin-bottom: 20px;
  overflow: hidden;
}

.map-btn .v-icon {
  transition: transform 0.3s ease;
  background-color: white;
  border-radius: 50%;
  padding: 15px;
  /* augmentez la taille du bouton */
  width: 45px;
  height: 45px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  color: #000000;
  font-size: 24px;
}

.map-btn .chevron-rotated {
  transform: rotate(90deg);
}

.imprimeurs-container {
  padding-top: 0 !important;
  margin-top: 0 !important;
}

.imprimeurs-container > .v-row {
  position: relative;
}

.imprimeurs-container > .v-row > .v-col br {
  display: none;
}

#table-imprimeurs {
  margin-top: 20px;
}

.facet-toggle-btn {
  position: fixed;
  top: 80px;
  left: 20px;
  z-index: 2000;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: opacity 0.3s ease;
}

.facet-reopen-icon {
  color: #000000;
  font-size: 22px;
}

.facet-reopen-label {
  font-size: 0.95rem;
  color: #000000;
  font-weight: bold;
  margin-top: 2px;
}

.facet-toggle-btn:hover {
  background: #f9f9f9;
}

.slide-x-enter-active,
.slide-x-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-x-enter-from,
.slide-x-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-x-enter-to,
.slide-x-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.map-icon {
  font-size: 1.5rem;
  color: #000000;
  margin-right: 8px;
}

@media (max-width: 960px) {

  :deep(.facet-reopen-label) {
    font-size: 0.75rem;
  }

  :deep(.text-center-no-data) {
    font-size: 1.0rem;
    line-height: 1.8;
  }

  :deep(.v-toolbar__content > .v-toolbar-title) {
    margin-inline-start: 12px;
  }

  .panel-header-title-with-toggle {
    flex: calc(100% - 80px) 0 0;
    width: calc(100% - 80px);
  }

  .panel-header-title-with-toggle,
  .panel-header-title {
    font-size: 1.0rem;
  }

  .imprimeurs-container .v-data-table {
    max-height: unset;
    overflow-y: unset;
  }

  .imprimeurs-container > .v-row {
    flex-direction: column;
    width: 100%;
    margin: 0;
  }

  /* Filters panel */
  .imprimeurs-container > .v-row > .v-col:first-child {
    flex: 75% 0 0 !important;
    width: 75% !important;
    max-width: 75% !important;
  }

  /* Results */

  .facet-sidebar + .v-col {
    margin-top: 86px;
  }

  .imprimeurs-container > .v-row > .v-col:last-child {
    flex: 100% 0 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    padding: 0;
  }

  .imprimeurs-container > .v-row > .facet-sidebar {
    position: absolute;
    z-index: 2000; /* above map controls */
    overflow-y: inherit;
    padding: 0;
  }

  .facet-toggle-btn {
    left: 16px;
  }

  .name-table-label {
    margin-bottom: 0 !important;
  }

  .table-expanded-container a {
    background-size: 17px auto;
    padding-left: 25px;
    margin-left: 0;
  }

  .imprimeurs-container > .v-row > .facet-sidebar .facet-filter-container {
    position: fixed;
    top: 130px;
    left: 16px;
    width: 85%;
    margin-top: 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .footer-controls {
    flex-wrap: wrap;
    gap: 15px;
    margin-bottom: 10px;
    padding: 10px !important;
  }

  .footer-controls > * {
    flex: 100% 0 0;
    width: 100%;
    max-width: 100%;
    max-height: 56px;
  }

  .pagination-controls .v-btn--icon.v-btn--density-default {
    width: var(--v-btn-height);
    height: var(--v-btn-height);
  }

  :deep(.pagination-controls .v-field__input) {
    padding-left: 10px;
    padding-right: 10px;
  }

  :deep(.v-data-table .v-table__wrapper > table tbody > tr > td.v-data-table-column--no-padding) {
    width: 40px !important;
    padding: 0;
  }

  :deep(.v-table .v-table__wrapper > table > tbody > tr > td) {
    padding-left: 0;
    word-wrap: anywhere;
  }

  :deep(.expanded-patent-list),
  :deep(.title-expanded-patent-list) {
    margin: 0 !important;
    padding-left: 0;
  }

  :deep(.expanded-patent-list) {
   padding-bottom: 5px;
  }

  :deep(.table-cell-item-expanded),
  :deep(.title-expanded-patent-list) {
    font-size: 0.95rem;
  }

  :deep(.v-data-table thead th),
  :deep(.v-data-table tbody td),
  :deep(.table-cell-item) {
    font-size: 1rem;
    margin: 0;
  }
}

</style>
