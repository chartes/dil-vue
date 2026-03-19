<template>
  <v-container fluid class="imprimeurs-container">
    <div class="results-toolbar-top">
      <div
          class="facet-toggle-btn facet-toggle-btn-inline"
          @click="showFacets = !showFacets"
      >
        <v-icon class="facet-reopen-icon">mdi-tune-variant</v-icon>
        <span class="facet-reopen-label">
          {{ showFacets ? 'FERMER LES FILTRES' : 'OUVRIR LES FILTRES' }}
        </span>
      </div>
    </div>
    <v-row class="list-layout-row">
      <v-col
          cols="12"
          md="3"
          class="facet-sidebar"
          :class="{ 'facet-visible': showFacets }"
      >
        <transition name="slide-x">
          <div v-if="showFacets" class="facet-sidebar-inner">
            <FacetFilter
                ref="facetFilter"
                title="Ville d'activité"
                filterType="places"
                :activateResetBtn="facetResetBtn"
                :initialSelectedIds="selectedFacets.places"
                :initialExtraSearch="searchExtraInfo"
                :initialDateFilter="selectedFacets.date"
                @update:selectedTerms="onUpdatePlaces"
                @update:dateFilter="onUpdateDate"
                @update:extraSearch="onExtraSearchChange"
                @update:exactMatch="onUpdateExactMatch"
                @resetAllFacets="onResetAll"
            />
          </div>
        </transition>
      </v-col>

      <v-col cols="12" :md="showFacets ? 9 : 12" class="results-col" ref="resultsColumn">
        <div class="results-toolbar-top">
          <div
              class="facet-toggle-btn facet-toggle-btn-inline"
              @click="showFacets = !showFacets"
          >
            <v-icon class="facet-reopen-icon">mdi-tune-variant</v-icon>
            <span class="facet-reopen-label">
              {{ showFacets ? 'FERMER LES FILTRES' : 'OUVRIR LES FILTRES' }}
            </span>
          </div>
        </div>
        <v-data-table
            ref="resultsTable"
            id="table-imprimeurs"
            :headers="headers"
            :items="imprimeurs"
            :items-per-page="itemsPerPage"
            :page="page"
            :loading="loading"
            item-value="_id_dil"
            class="elevation-1 imprimeurs-table"
            :class="{ 'table-shifted': !showFacets }"
            fixed-header
            hover
            @click:row="goToDetail"
        >
          <template #top>
            <div ref="resultsAnchor" class="results-anchor"></div>

            <v-toolbar ref="resultsHeader" flat class="toolbar-header table-topbar">
              <v-toolbar-title class="panel-header-title">
                {{ totalItems }} {{ pluralize('imprimeur', totalItems) }} - {{ pluralize('lithographe', totalItems) }}
              </v-toolbar-title>
              <v-spacer/>
            </v-toolbar>

            <v-expand-transition appear>
              <v-toolbar flat class="toolbar-header map-toolbar">
                <v-toolbar-title class="panel-header-title-with-toggle">
                  <v-icon class="mr-2 map-icon">mdi-map</v-icon>
                  Carte des imprimeries
                </v-toolbar-title>
                <v-spacer/>
                <v-btn icon @click="toggleMap" class="map-btn">
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
                    :cityQuery="mapCityQuery"
                    :date="mapDate"
                    :exact="mapExact"
                    :searchHeadInfo="searchHeadInfo"
                    :searchExtraInfo="searchExtraInfo"
                    @selectCity="onCitySelected"
                />
              </div>
            </v-expand-transition>

            <div class="footer-controls top-controls">
              <v-text-field
                  v-model="searchHeadInfo"
                  label="Rechercher par nom"
                  class="search-head-info-input search-head-info-input-large search-head-info-hint"
                  color="var(--red-pompein)"
                  density="comfortable"
                  variant="outlined"
                  clearable
                  hide-details
                  @input="scheduleFetch"
                  @click:clear="onClearFirstnamesLastname"
              />

              <div class="pagination-controls">
                <v-btn icon :disabled="page <= 1" @click="goToPage(1)" title="Première page">
                  <v-icon>mdi-page-first</v-icon>
                </v-btn>

                <v-btn icon :disabled="page <= 1" @click="goToPage(page - 1)" title="Page précédente">
                  <v-icon>mdi-chevron-left</v-icon>
                </v-btn>

                <v-text-field
                    v-model.number="pageInput"
                    type="number"
                    min="1"
                    :max="pageCount"
                    density="compact"
                    hide-details
                    variant="outlined"
                    class="search-page-input"
                    @keydown.enter="applyPageInput"
                    @blur="applyPageInput"
                    title="Aller à la page"
                />

                <span class="page-count-label">/ {{ pageCount }}</span>

                <v-btn icon :disabled="page >= pageCount" @click="goToPage(page + 1)" title="Page suivante">
                  <v-icon>mdi-chevron-right</v-icon>
                </v-btn>

                <v-btn icon :disabled="page >= pageCount" @click="goToPage(pageCount)" title="Dernière page">
                  <v-icon>mdi-page-last</v-icon>
                </v-btn>
              </div>
            </div>
          </template>

          <template #item.identity="{ item }">
            <div class="identity-table-link">
              {{ formatIdentity(item) }}
            </div>
          </template>

          <template #item.exercise_places="{ item }">
            <div class="exercise-places-cell">
              <div class="exercise-places-main">
                {{ formatExercisePlaces(item) }}
              </div>

              <template v-if="shouldShowHighlight(item)">
                <hr class="sep-quote row-sep-quote"/>
                <div
                    class="highlighted-quote table-highlighted-quote"
                    v-html="item.highlight"
                />
              </template>
            </div>
          </template>

          <template #item.actions="{ item }">
            <router-link
                :to="`/detail/${item._id_dil}`"
                :title="`Voir la notice de ${item.lastname || ''}`"
                class="notice-link-icon"
                @click.stop
            >
              <v-icon size="22">mdi-open-in-new</v-icon>
            </router-link>
          </template>

          <template #no-data>
            <div class="text-center-no-data">
              <v-icon size="32">mdi-alert-circle</v-icon>
              <p>Aucune donnée disponible.</p>
            </div>
          </template>

          <template #bottom>
            <div class="footer-controls bottom-controls">
              <v-select
                  v-model="itemsPerPage"
                  :items="[10, 50, 100]"
                  label="Éléments par page"
                  density="comfortable"
                  variant="outlined"
                  hide-details
                  class="items-per-page-select"
                  @update:modelValue="onItemsPerPageChange"
              />

              <div class="pagination-controls">
                <v-btn icon :disabled="page <= 1" @click="goToPage(1)" title="Première page">
                  <v-icon>mdi-page-first</v-icon>
                </v-btn>

                <v-btn icon :disabled="page <= 1" @click="goToPage(page - 1)" title="Page précédente">
                  <v-icon>mdi-chevron-left</v-icon>
                </v-btn>

                <v-text-field
                    v-model.number="pageInput"
                    type="number"
                    min="1"
                    :max="pageCount"
                    density="compact"
                    hide-details
                    variant="outlined"
                    class="search-page-input"
                    @keydown.enter="applyPageInput"
                    @blur="applyPageInput"
                    title="Aller à la page"
                />

                <span class="page-count-label">/ {{ pageCount }}</span>

                <v-btn icon :disabled="page >= pageCount" @click="goToPage(page + 1)" title="Page suivante">
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
import {mapState} from 'vuex'
import FacetFilter from '@/components/list/ListFacetFilter.vue'
import LeafletMap from '@/components/list/ListLeafletMap.vue'

export default {
  name: 'ListView',
  components: {
    FacetFilter,
    LeafletMap
  },
  data() {
    return {
      page: 1,
      pageInput: 1,
      itemsPerPage: 50,
      imprimeurs: [],
      searchHeadInfo: '',
      searchExtraInfo: '',
      searchDebounce: null,
      facetResetBtn: false,
      totalItems: 0,
      sortDesc: false,
      showFacets: false,
      showMap: false,
      showMapContent: false,
      selectedFacets: {
        places: [],
        date: ''
      },
      headers: [
        {title: 'Nom – Prénoms', key: 'identity', sortable: false, width: '30%'},
        {title: 'Villes d’exercice', key: 'exercise_places', sortable: false, width: '62%'},
        {title: '', key: 'actions', sortable: false, align: 'end', width: '8%'}
      ],
      loading: false,
      fetchController: null,
      requestSeq: 0,
      shouldScrollToResults: false,
      isRestoringState: false,

    }
  },
  computed: {
    ...mapState(['apiUrl', 'listViewState', 'forceOpenMap']),
    pageCount() {
      return Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage))
    },
    mapCityQuery() {
      return this.selectedFacets.places.map(p => p.id || p.id_dil)
    },
    mapDate() {
      return this.selectedFacets.date?.date || ''
    },
    mapExact() {
      return this.selectedFacets.date?.exact || false
    }
  },
  watch: {
    showFacets() {
      this.persistListViewState();

      this.$nextTick(() => {
        if (this.$refs.leaflet?.map) {
          this.$refs.leaflet.map.invalidateSize()
        }
      })
    },

    showMap(val) {
      this.persistListViewState();

      if (!val) return
      this.$nextTick(() => {
        setTimeout(() => {
          if (this.$refs.leaflet?.map) {
            this.$refs.leaflet.map.invalidateSize()
          }
          //this.refreshMapCities()
        }, 200)
      })
    },

    page() {
      this.persistListViewState();
    },

    pageInput() {
      this.persistListViewState();
    },

    itemsPerPage() {
      this.persistListViewState();
    },

    searchHeadInfo(val) {
      this.facetResetBtn = val !== ''
      this.persistListViewState()
    },

    searchExtraInfo() {
      this.persistListViewState()
    },

    'selectedFacets.places': {
      deep: true,
      handler() {
        this.persistListViewState();

        if (this.isRestoringState) return;
        this.onFiltersChanged({refreshMap: true});
      }
    },

    'selectedFacets.date': {
      deep: true,
      handler() {
        this.persistListViewState();

        if (this.isRestoringState) return;
        this.onFiltersChanged({refreshMap: true});
      }
    }
  },
  async mounted() {
    const restored = await this.restoreListViewState();

    if (!restored) {
      this.showFacets = false;
    }

    this.applyStoreStateOverrides();
    this.persistListViewState();

    await this.fetchImprimeurs();
  },
  beforeUnmount() {
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce)
    }
  },

  methods: {
    pluralize(word, count, pluralForm = null) {
      return `${word}${count > 1 ? (pluralForm ?? 's') : ''}`
    },

    applyStoreStateOverrides() {
      if (this.forceOpenMap) {
        this.showMap = true;
        this.showMapContent = true;
        this.$store.commit('SET_FORCE_OPEN_MAP', false);
      }
    },
    formatIdentity(item) {
      const lastname = item?.lastname || ''
      const firstnames = item?.firstnames || ''
      return firstnames ? `${lastname} – ${firstnames}` : lastname
    },
    shouldShowHighlight(item) {
      return !!this.searchExtraInfo?.trim() && !!item?.highlight
    },

    formatDateShort(dateStr) {
      if (!dateStr) return null
      const date = new Date(dateStr)
      if (Number.isNaN(date.getTime())) return null
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    },

    formatExercisePlaces(item) {
      const places = item?.exercise_places_summary || []

      if (!places.length) {
        return 'Aucune ville d’exercice renseignée'
      }

      return places
          .map((place) => {
            const rawCity = place.city_label || 'Ville inconnue'
            const city = rawCity.replace(/\s*\([^()]*\)\s*$/u, '').trim()

            const start = this.formatDateShort(place.date_start)
            const end = this.formatDateShort(place.date_end)

            if (start && end) {
              return `${city} (${start} - ${end})`
            }

            if (start) {
              return `${city} (${start})`
            }

            return city
          })
          .join(', ')
    },

    goToDetail(event, row) {
      const item = row?.item
      if (!item?._id_dil) return
      this.$router.push(`/detail/${item._id_dil}`)
    },

    onClearFirstnamesLastname() {
      this.searchHeadInfo = ''
      this.page = 1
      this.pageInput = 1
      this.scheduleFetch()
    },

    onFiltersChanged() {
      if (this.page !== 1) {
        this.page = 1
        this.pageInput = 1
      }

      this.scheduleFetch()
    },

    goToPage(pageNumber) {
      const safePage = Math.min(Math.max(1, pageNumber), this.pageCount)
      if (safePage === this.page) return
      this.page = safePage
      this.pageInput = safePage
      this.fetchImprimeurs()
    },

    applyPageInput() {
      const parsed = Number(this.pageInput)
      if (!Number.isFinite(parsed)) {
        this.pageInput = this.page
        return
      }
      this.goToPage(parsed)
    },

    scrollTop() {
      window.scrollTo({top: 0, behavior: 'smooth'})
    },

    scrollToResults() {
      this.$nextTick(() => {
        const tableRoot = this.$refs.resultsTable?.$el || this.$refs.resultsTable;
        if (!tableRoot) return;

        const tbody =
            tableRoot.querySelector('tbody') ||
            tableRoot.querySelector('.v-table__wrapper');

        if (!tbody) return;

        const rect = tbody.getBoundingClientRect();
        const absoluteTop = rect.top + window.scrollY;

        const fixedToolbar = document.querySelector('.results-toolbar-top');
        const fixedToolbarHeight = fixedToolbar
            ? fixedToolbar.getBoundingClientRect().height
            : 0;

        const isMobile = window.innerWidth <= 960;
        const extraOffset = isMobile ? 20 : 19;

        window.scrollTo({
          top: Math.max(0, absoluteTop - fixedToolbarHeight - extraOffset),
          behavior: 'smooth'
        });
      });
    },

    onResetAll() {
      this.searchExtraInfo = '';
      this.searchHeadInfo = '';
      this.page = 1;
      this.pageInput = 1;
      this.itemsPerPage = 50;
      this.showMap = false;
      this.showMapContent = false;
      this.selectedFacets = {
        places: [],
        date: ''
      };

      this.persistListViewState();
    },

    async onItemsPerPageChange() {
      this.page = 1
      this.pageInput = 1
      await this.fetchImprimeurs()
    },

    onExtraSearchChange(value) {
      this.searchExtraInfo = value
      this.page = 1
      this.scheduleFetch()
    },

    async onUpdateDate(dateRange) {
      this.selectedFacets.date = dateRange
    },

    async onUpdatePlaces(value) {
      const nextTerms = value.terms || [];

      const currentIds = this.selectedFacets.places.map(t => t.id_dil || t.id || t.label);
      const nextIds = nextTerms.map(t => t.id_dil || t.id || t.label);

      if (JSON.stringify(currentIds) === JSON.stringify(nextIds)) return;

      this.selectedFacets.places = nextTerms;
    },

    onUpdateExactMatch(payload) {
      if (!this.selectedFacets.date || typeof this.selectedFacets.date === 'string') {
        this.selectedFacets.date = {
          date: this.selectedFacets.date || '',
          exact: !!payload.exact
        }
      } else {
        this.selectedFacets.date.exact = !!payload.exact
      }
    },

    async onCitySelected(cityId) {
      if (this.selectedFacets.places.some(p => (p.id || p.id_dil) === cityId)) {
        this.shouldScrollToResults = true
        this.scrollToResults()
        return
      }

      try {
        const res = await fetch(`${this.apiUrl}/referential/cities/city/${cityId}`)
        if (!res.ok) throw new Error('Erreur API')
        const data = await res.json()

        const term = {
          id_dil: data._id_dil,
          label: data.label,
          department_label_fr: data.insee_fr_department_label
        }

        this.shouldScrollToResults = true
        this.selectedFacets.places = [...this.selectedFacets.places, term]

      } catch (err) {
        console.error('Erreur lors de la récupération de la ville :', err)
      }
    },

    toggleMap() {
      this.showMap = !this.showMap

      if (this.showMap) {
        this.showMapContent = true

        this.$nextTick(() => {
          setTimeout(() => {
            if (this.$refs.leaflet?.map) {
              this.$refs.leaflet.map.invalidateSize()
            }
          }, 300)
        })
      } else {
        this.showMapContent = false
      }
    },

    refreshMapCities() {
      /*
      if (this.showMap && this.$refs.leaflet?.fetchCities) {
        this.$refs.leaflet.fetchCities({
          patent_city_query: this.selectedFacets.places.map(p => p.id || p.id_dil),
          patent_date_start: this.selectedFacets.date?.date,
          exact_patent_date_start: this.selectedFacets.date?.exact || false
        })
      }
      */

    },

    async fetchImprimeurs() {
      this.loading = true
      const currentSeq = ++this.requestSeq

      if (this.fetchController) {
        this.fetchController.abort()
      }
      this.fetchController = new AbortController()

      try {
        const params = new URLSearchParams()
        params.append('page', this.page)
        params.append('size', this.itemsPerPage)
        params.append('sort', this.sortDesc ? 'desc' : 'asc')

        if (this.searchHeadInfo) {
          params.append('search_head_info', this.searchHeadInfo)
        }
        if (this.searchExtraInfo) {
          params.append('search_extra_info', this.searchExtraInfo)
        }
        if (this.selectedFacets.date?.date) {
          params.append('patent_date_start', this.selectedFacets.date.date)
          params.append('exact_patent_date_start', this.selectedFacets.date.exact ? 'true' : 'false')
        }
        if (this.selectedFacets.places.length > 0) {
          this.selectedFacets.places.forEach(term => {
            params.append('patent_city_query', term.id_dil)
          })
        }

        const res = await fetch(`${this.apiUrl}/persons?${params.toString()}`, {
          signal: this.fetchController.signal
        })
        const data = await res.json()

        if (currentSeq !== this.requestSeq) return

        this.imprimeurs = data.items || []
        this.totalItems = data.total || 0
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Erreur lors du chargement :', err)
        }
      } finally {
        if (currentSeq === this.requestSeq) {
          this.loading = false

          if (this.shouldScrollToResults) {
            this.shouldScrollToResults = false
            this.scrollToResults()
          }
        }
      }
    },
    scheduleFetch() {
      this.page = 1
      if (this.searchDebounce) {
        clearTimeout(this.searchDebounce)
      }
      this.searchDebounce = setTimeout(() => {
        this.fetchImprimeurs()
      }, 300)
    },
    buildListViewState() {
      return {
        page: this.page,
        pageInput: this.pageInput,
        itemsPerPage: this.itemsPerPage,
        searchHeadInfo: this.searchHeadInfo,
        searchExtraInfo: this.searchExtraInfo,
        showFacets: this.showFacets,
        selectedFacets: {
          places: this.selectedFacets.places || [],
          date: this.selectedFacets.date || ''
        }
      };
    },

    persistListViewState() {
      if (this.isRestoringState) return;
      this.$store.commit('SET_LIST_VIEW_STATE', this.buildListViewState());
    },

    async restoreListViewState() {
      const saved = this.listViewState;
      if (!saved) return false;

      this.isRestoringState = true;

      this.page = saved.page || 1;
      this.pageInput = saved.pageInput || saved.page || 1;
      this.itemsPerPage = saved.itemsPerPage || 50;
      this.searchHeadInfo = saved.searchHeadInfo || '';
      this.searchExtraInfo = saved.searchExtraInfo || '';
      this.showFacets = !!saved.showFacets;

      this.selectedFacets = {
        places: saved.selectedFacets?.places || [],
        date: saved.selectedFacets?.date || ''
      };

      // toujours fermée par défaut au retour
      this.showMap = false;
      this.showMapContent = false;

      await this.$nextTick();
      this.isRestoringState = false;
      return true;
    },

    clearPersistedListViewState() {
      this.$store.commit('CLEAR_LIST_VIEW_STATE');
    },
  }
}
</script>

<style scoped>
.imprimeurs-container {
  padding-top: 0 !important;
  margin-top: 0 !important;
}

.list-layout-row {
  position: relative;
  margin-bottom: 0 !important;
}

.results-col {
  position: relative;
  z-index: 1;
  padding-top: 86px;
}

.facet-sidebar.facet-visible + .results-col {
  padding-top: 20px;
}

/* =========================
   Bouton filtres
========================= */

.results-toolbar-top {
  position: fixed;
  top: 90px;
  left: 24px;
  z-index: 6000;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 44px;
  margin: 0;
  pointer-events: none;
}

.results-toolbar-top .facet-toggle-btn {
  pointer-events: auto;
}

.facet-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 220px;
  padding: 10px 14px;
  background: #fff;
  border: 1px solid #d8d8d8;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.facet-toggle-btn:hover {
  background: #fafafa;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.facet-toggle-btn-inline {
  position: relative;
}

.facet-reopen-icon {
  color: #000;
  font-size: 22px;
}

.facet-reopen-label {
  margin-top: 1px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #000;
}

/* =========================
   Sidebar filtres
========================= */

.facet-sidebar {
  position: sticky;
  top: 72px;
  align-self: flex-start;
  z-index: 3000;
  max-height: calc(100vh - 90px);
  padding-right: 16px;
  overflow: visible !important;
}

.facet-sidebar-inner {
  margin-top: 8px;
  padding-top: 18px;
  z-index: 3001;
  overflow: visible !important;
  box-sizing: border-box;
  transform: translateZ(0);
  backface-visibility: hidden;
  will-change: transform, opacity;
}

.facet-sidebar:not(.facet-visible) .facet-sidebar-inner {
  display: none;
}

.slide-x-enter-active,
.slide-x-leave-active {
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.25s ease;
}

.slide-x-enter-from,
.slide-x-leave-to {
  opacity: 0;
  transform: translateX(-20%);
}

.slide-x-enter-to,
.slide-x-leave-from {
  opacity: 1;
  transform: translateX(0);
}

/* =========================
   Headers / toolbars
========================= */

.toolbar-header {
  position: relative;
  z-index: 1;
  min-height: auto !important;
  padding-inline: 0 !important;
}

.table-topbar {
  margin-bottom: 0.25rem;
}

.map-toolbar {
  margin-top: -0.25rem;
  margin-bottom: 1rem;
  border-top: 1px solid #000;
}

.panel-header-title,
.panel-header-title-with-toggle {
  flex: 1 1 auto;
  width: auto;
  font-weight: 700;
  color: #222;
}

.map-icon {
  margin-right: 0.5rem;
  font-size: 1.45rem;
  color: #000;
}

.map-btn {
  z-index: 10;
  color: var(--red-pompein);
}

.map-btn .v-icon {
  width: 45px;
  height: 45px;
  padding: 15px;
  font-size: 24px;
  color: #000;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  transition: transform 0.3s ease;
}

.map-btn .chevron-rotated {
  transform: rotate(90deg);
}

.show-map-container {
  position: relative;
  z-index: 1;
  height: 70vh;
  margin-bottom: 20px;
  margin-top: -20px;
  overflow: hidden;
  border: 1px solid #eee;
  border-radius: 0 0 20px 20px;
}

/* =========================
   Table
========================= */

.imprimeurs-table {
  position: relative;
  z-index: 1;
  margin-top: 1rem;
  overflow: hidden;
  border-radius: 12px;
}

.table-shifted {
  margin-top: -0.1rem;
}

:deep(#table-imprimeurs .v-table__wrapper table) {
  width: 100%;
  table-layout: fixed;
}

:deep(#table-imprimeurs thead th) {
  padding-top: 14px;
  padding-bottom: 14px;
  font-size: 1.05rem;
  font-weight: 700;
  text-align: left;
  vertical-align: top;
  color: #2d2d2d;
  background: #fafafa;
  border-bottom: 1px solid #ececec;
}

:deep(#table-imprimeurs tbody td) {
  padding-top: 14px;
  padding-bottom: 14px;
  font-size: 1rem;
  text-align: left;
  vertical-align: top;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
}

:deep(#table-imprimeurs tbody tr) {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

:deep(#table-imprimeurs tbody tr:hover) {
  background: rgb(var(--v-theme-surface-light));
}

:deep(#table-imprimeurs thead th:nth-child(1)),
:deep(#table-imprimeurs tbody td:nth-child(1)) {
  width: 30%;
  padding-left: 12px;
  padding-right: 14px;
}

:deep(#table-imprimeurs thead th:nth-child(2)),
:deep(#table-imprimeurs tbody td:nth-child(2)) {
  width: 62%;
  padding-left: 10px;
  padding-right: 10px;
}

:deep(#table-imprimeurs thead th:nth-child(3)),
:deep(#table-imprimeurs tbody td:nth-child(3)) {
  width: 8%;
  padding-left: 4px;
  padding-right: 12px;
  text-align: right;
}

.identity-table-link {
  display: block;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.45;
  color: #2f2f2f;
  text-decoration: none;
  transition: color 0.2s ease;
}

:deep(#table-imprimeurs tbody tr:hover .identity-table-link) {
  color: var(--red-pompein);
}

.results-anchor {
  position: relative;
}

.exercise-places-cell {
  font-size: 0.98rem;
  line-height: 1.55;
  color: #444;
  white-space: normal;
  word-break: break-word;

}


:deep(#table-imprimeurs .v-table__wrapper table) {
  table-layout: auto;
  width: 100%;
}

:deep(#table-imprimeurs thead th:nth-child(1)),
:deep(#table-imprimeurs tbody td:nth-child(1)) {
  width: 34%;
  min-width: 260px;
  padding-left: 12px;
  padding-right: 20px;
  white-space: normal;
}

:deep(#table-imprimeurs thead th:nth-child(2)),
:deep(#table-imprimeurs tbody td:nth-child(2)) {
  width: auto;
  min-width: 320px;
  padding-left: 0;
  padding-right: 10px;
  white-space: normal;
}

:deep(#table-imprimeurs thead th:nth-child(3)),
:deep(#table-imprimeurs tbody td:nth-child(3)) {
  width: 56px;
  min-width: 56px;
  text-align: right;
  padding-left: 4px;
  padding-right: 12px;
}

.identity-table-link,
.exercise-places-cell {
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: normal;
}

.notice-link-icon,
.notice-link-icon .v-icon {
  opacity: 0.75;
}

:deep(#table-imprimeurs tbody tr:hover .notice-link-icon),
:deep(#table-imprimeurs tbody tr:hover .notice-link-icon .v-icon),
.notice-link-icon:hover,
.notice-link-icon:hover .v-icon {
  opacity: 1;
  color: var(--red-pompein);
  transform: translateX(2px);
}

.notice-link-icon {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  color: #333;
  text-decoration: none;
  transition: color 0.2s ease, transform 0.2s ease;
}

.notice-link-icon:hover {
  color: var(--red-pompein);
  transform: translateX(2px);
}

.text-center-no-data {
  padding: 24px;
  font-size: 1.15rem;
  text-align: center;
  color: #999;
}

/* =========================
   Contrôles haut / bas
========================= */

.footer-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px !important;
}

.top-controls {
  padding-top: 0 !important;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
}

.page-count-label {
  font-weight: 500;
  white-space: nowrap;
  color: #444;
}

.search-page-input {
  width: 76px;
}

.items-per-page-select {
  max-width: 220px;
}

/* =========================
   Input recherche nom
========================= */

.search-head-info-input-large {
  min-width: 420px;
  max-width: 760px !important;
}

:deep(.search-head-info-input-large .v-field) {
  background: #fff;
  border: none !important;
  border-radius: 12px;
  box-shadow: none;
  transition: box-shadow 0.2s ease;
}


:deep(.search-head-info-input-large .v-field__outline) {
  --v-field-border-opacity: 1;
  color: #d8d2cb !important;
}

:deep(.search-head-info-input-large:hover .v-field__outline) {
  color: var(--link-over-color) !important;
}

:deep(.search-head-info-input-large .v-field--focused .v-field__outline) {
  color: var(--red-pompein) !important;
}


:deep(.search-head-info-input-large .v-label) {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--red-pompein);
}

:deep(.search-head-info-input-large .v-label.v-field-label--floating) {
  background: #fff;
  padding: 0 6px;
}

:deep(.search-head-info-input-large input) {
  font-size: 1.05rem;
  font-weight: 500;
  color: #333;
}

/* =========================
   Highlight notices
========================= */

.exercise-places-main {
  display: block;
}

.row-sep-quote {
  margin: 12px 0 10px;
  border: 0;
  height: 1px;
  background-color: var(--brown);
}

.table-highlighted-quote {
  position: relative;
  padding-left: 1.8rem;
  margin-top: 0.35rem;
  font-size: 0.95rem;
  line-height: 1.55;
  font-style: italic;
  color: #444;
}

.table-highlighted-quote::before {
  content: "“";
  position: absolute;
  left: 0;
  top: -2px;
  font-size: 2.1rem;
  line-height: 1;
  color: var(--brown);
  font-family: Georgia, serif;
  font-weight: bold;
}

.table-highlighted-quote :deep(mark),
.table-highlighted-quote mark {
  background: #fff34d;
  color: #000;
  padding: 0 4px;
  border-radius: 3px;
  font-weight: 700;
}

/* =========================
   Animation visuelle input
========================= */

.search-head-info-hint {
  animation: searchFieldGlowHint 1.2s ease 0.4s 1;
}

:deep(.search-head-info-hint .v-field) {
  animation: searchFieldShadowHint 1.2s ease 0.4s 1;
}

@keyframes searchFieldGlowHint {
  0% {
    transform: scale(1);
  }
  35% {
    transform: scale(1.01);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes searchFieldShadowHint {
  0% {
    box-shadow: 0 0 0 rgba(155, 26, 36, 0);
  }
  40% {
    box-shadow: 0 0 0 4px rgba(155, 26, 36, 0.16);
  }
  100% {
    box-shadow: 0 0 0 rgba(155, 26, 36, 0);
  }
}

/* =========================
   Responsive large tablette
========================= */

@media (max-width: 1260px) {
  .search-head-info-input-large {
    min-width: 320px;
    max-width: 520px !important;
  }

  :deep(#table-imprimeurs thead th:nth-child(1)),
  :deep(#table-imprimeurs tbody td:nth-child(1)) {
    width: 32%;
  }

  :deep(#table-imprimeurs thead th:nth-child(2)),
  :deep(#table-imprimeurs tbody td:nth-child(2)) {
    width: 58%;
  }

  :deep(#table-imprimeurs thead th:nth-child(3)),
  :deep(#table-imprimeurs tbody td:nth-child(3)) {
    width: 10%;
  }
}

/* =========================
   Responsive tablette / mobile
========================= */

@media (max-width: 960px) {
  .list-layout-row {
    flex-direction: column;
    width: 100%;
    margin: 0;
  }

  .results-col {
    width: 100% !important;
    max-width: 100% !important;
    padding: 72px 0 0;
    margin-top: 0;
  }

  .results-toolbar-top {
    top: 76px;
    left: 16px;
    z-index: 10000;
  }

  .facet-sidebar {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 3000;
    width: 82% !important;
    max-width: 82% !important;
    max-height: none;
    overflow-y: visible;
    padding-right: 0;
  }

  .facet-sidebar-inner {
    position: fixed;
    top: 136px;
    left: 16px;
    z-index: 3000;
    width: 85%;
    margin-top: 0;
    padding: 14px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.18);
  }

  .facet-toggle-btn {
    min-width: 190px;
    padding: 9px 12px;
  }

  .facet-reopen-label {
    font-size: 0.75rem;
  }

  .panel-header-title,
  .panel-header-title-with-toggle {
    font-size: 1rem;
  }

  .show-map-container {
    height: 48vh;
  }

  .footer-controls {
    flex-wrap: wrap;
    gap: 14px;
    padding: 10px !important;
  }

  .footer-controls > * {
    flex: 1 1 100%;
    width: 100%;
    max-width: 100%;
  }

  .pagination-controls {
    width: 100%;
    justify-content: space-between;
    gap: 8px;
  }

  .search-head-info-input-large,
  .items-per-page-select {
    min-width: 100%;
    max-width: 100% !important;
  }

  :deep(#table-imprimeurs thead th) {
    padding-top: 10px;
    padding-bottom: 10px;
    font-size: 0.95rem;
  }

  :deep(#table-imprimeurs tbody td) {
    padding-top: 10px;
    padding-bottom: 10px;
    font-size: 0.95rem;
  }

  :deep(#table-imprimeurs thead th:nth-child(1)),
  :deep(#table-imprimeurs tbody td:nth-child(1)) {
    width: 34%;
    padding-left: 8px;
    padding-right: 10px;
  }

  :deep(#table-imprimeurs thead th:nth-child(2)),
  :deep(#table-imprimeurs tbody td:nth-child(2)) {
    width: 54%;
    padding-left: 6px;
    padding-right: 6px;
  }

  :deep(#table-imprimeurs thead th:nth-child(3)),
  :deep(#table-imprimeurs tbody td:nth-child(3)) {
    width: 12%;
    padding-left: 2px;
    padding-right: 8px;
  }

  .identity-table-link {
    font-size: 0.96rem;
    line-height: 1.4;
  }

  .exercise-places-cell {
    font-size: 0.9rem;
    line-height: 1.45;
  }

  .text-center-no-data {
    font-size: 1rem;
    line-height: 1.6;
  }

  .map-btn .v-icon {
    width: 42px;
    height: 42px;
    font-size: 22px;
  }
}

/* =========================
   Responsive petit mobile
========================= */

@media (max-width: 700px) {
  .facet-sidebar-inner {
    top: 140px;
    width: calc(100% - 32px);
  }

  :deep(#table-imprimeurs thead th) {
    padding-top: 8px;
    padding-bottom: 8px;
    font-size: 0.88rem;
  }

  :deep(#table-imprimeurs tbody td) {
    padding-top: 8px;
    padding-bottom: 8px;
    font-size: 0.88rem;
  }

  .identity-table-link {
    font-size: 0.9rem;
  }

  .exercise-places-cell {
    font-size: 0.84rem;
  }

  .page-count-label {
    font-size: 0.9rem;
  }

  .search-page-input {
    width: 66px;
  }
}
</style>
