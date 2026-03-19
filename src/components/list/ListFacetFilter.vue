<template>
  <div class="facet-filter-container">
    <v-text-field
        v-model="personSearchQuery"
        @input="onPersonSearchInput"
        @click:clear="onClearPersonSearch"
        class="search-bar"
        label="Rechercher dans les notices"
        hide-details
        clearable
        dense
        color="var(--red-pompein)"
    />
    <div class="date-picker-container">
      <span class="advanced_search_header">
        <v-icon start class="v-icon--start">mdi-map-marker</v-icon>
        <span class="title">{{ title }}</span>
      </span>
      <v-text-field
          v-model="searchQuery"
          ref="autocompleteInput"
          @input="onSearchQueryInput"
          :placeholder="placeholder"
          class="search-bar"
          :label="placeholder"
          outlined
          hide-details
          single-line
          clearable
          color="var(--red-pompein)"
          @click:clear="searchQuery = ''"
      />
      <teleport to="body">
        <div
            v-if="showDropdown && searchQuery !== ''"
            class="autocomplete-list"
            :style="autocompleteStyle"
            @mousedown.stop
        >
          <ul>
            <li class="topic-header">Suggestions</li>
            <li
                v-for="term in terms"
                :key="term.id"
                @mousedown.prevent="handleTermSelection(term)"
                class="autocomplete-item"
            >
              <div class="term-label">
                {{ term.label }}
                <span v-if="term.department_label_fr" class="term-department">({{ term.department_label_fr }})</span>
              </div>
              <div class="term-patents" v-if="term.total_patents_if_selected">
                {{ term.total_persons_if_selected }} imprimeur{{ term.total_persons_if_selected > 1 ? 's' : '' }}
              </div>
            </li>
          </ul>
        </div>
      </teleport>
    </div>
    <div class="selected-terms" v-if="selectedTerms.length > 0">
      <span class="active-tags">
        <button @click="selectedTerms = []" class="active-tags-delete-btn">
          <v-icon>
            mdi-close
          </v-icon>
        </button>
        <span class="active-tags-labels">Filtres actifs</span>
      </span>
      <div class="tags">
        <span v-for="term in selectedTerms" :key="term.id" class="tag">
          <span>{{ term.label }}</span>
           <span class="term-department">({{ term.department_label_fr }})</span>
          <button @click="removeTerm(term)">
            <v-icon color="#9B1A24" size="15">
              mdi-close
            </v-icon>

          </button>
        </span>
      </div>
    </div>
    <p v-if="isLoading">Chargement des données...</p>
    <VDatePicker
        ref="datePicker"
        :model-value="selectedDate"
        @update:dateMeta="onUpdateDate"
    />
    <div v-if="hasActiveFilters || activateResetBtn" class="reset-global-container">
      <v-btn
          color="error"
          class="reset-results-btn"
          outlined
          small
          @click="onResetAll"
          title="Rafraîchir les résultats"
      >
        <v-icon class="reset-icon">mdi-replay</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script>
import {mapState} from "vuex";
import VDatePicker from "@/components/VDatePicker.vue";

export default {
  name: 'FacetFilter',
  components: {
    VDatePicker: VDatePicker,
  },
  props: {
    title: {type: String, default: 'Facette'},
    filterType: {type: String, required: true},
    reset: {type: Boolean, default: false},
    initialSelectedIds: {type: Array, default: () => []},
    initialExtraSearch: {type: String, default: ''},
    initialDateFilter: {type: [String, Object], default: ''},
    showIndexLink: {type: Boolean, default: false},
    indexUrl: {type: String, default: ''},
    activateResetBtn: {type: Boolean, default: false},
  },
  data() {
    return {
      terms: [],
      searchQuery: '',
      personSearchQuery: '',
      personSearchResults: [],
      filteredTermsGrouped: {},
      selectedTerms: [],
      tempPickedDate: null,
      isLoading: false,
      showDropdown: false,
      pickedDate: null,
      displayedDate: '',
      minDate: '1816-01-01',
      maxDate: '1910-12-31',
      menu: false,
      pickerDate: '',
      activePicker: 'year',
      currentYear: '',
      currentMonth: '',
      selectedDate: '',
      currentDay: '',
      exactMatch: false,
      isSyncingFromParent: false,
      autocompleteStyle: {
        top: '0px',
        left: '0px',
        width: '0px',
        position: 'fixed',
        zIndex: 3000,
      }
    }
  },
  computed: {
    ...mapState(['apiUrl']),
    hasActiveFilters() {
      return this.selectedTerms.length > 0 || this.personSearchQuery.length > 0 || this.selectedDate !== '';
    },
    headerClass() {
      return this.title.toLowerCase().includes('terme')
          ? 'search-header-terms'
          : 'search-header-places'
    },
    placeholder() {
      return this.title.toLowerCase().includes('terme')
          ? 'Gardien'
          : 'Paris, Lyon…'
    }
  },
  watch: {
    initialSelectedIds: {
      immediate: true,
      deep: true,
      handler(newVal) {
        const nextTerms = Array.isArray(newVal) ? [...newVal] : [];

        const same =
            JSON.stringify(this.selectedTerms.map(t => t.id_dil || t.id || t.label)) ===
            JSON.stringify(nextTerms.map(t => t.id_dil || t.id || t.label));

        if (same) return;

        this.isSyncingFromParent = true;
        this.selectedTerms = nextTerms;

        this.$nextTick(() => {
          this.isSyncingFromParent = false;
        });
      }
    },

    initialExtraSearch: {
      immediate: true,
      handler(newVal) {
        this.personSearchQuery = newVal || '';
      }
    },

    initialDateFilter: {
      immediate: true,
      deep: true,
      handler(newVal) {
        if (!newVal) {
          this.selectedDate = '';
          this.exactMatch = false;
          return;
        }

        if (typeof newVal === 'string') {
          this.selectedDate = newVal;
          this.exactMatch = false;
          return;
        }

        this.selectedDate = newVal.date || '';
        this.exactMatch = !!newVal.exact;
      }
    },

    selectedTerms: {
      deep: true,
      handler(newValue) {
        if (this.isSyncingFromParent) return;

        this.$emit('update:selectedTerms', {
          type: this.filterType,
          terms: newValue,
        });
      },
    },

    reset(newVal) {
      if (newVal) this.selectedTerms = [];
    },

    selectedDate: {
      handler(newVal) {
        this.$emit('update:selectedDate', {
          type: this.filterType,
          date: newVal,
        });
      },
    },

    exactMatch: {
      handler(newVal) {
        this.$emit('update:exactMatch', {
          type: this.filterType,
          exact: newVal,
        });
      },
    },
  },
  methods: {
    onResetAll() {
      this.selectedTerms = [];
      this.searchQuery = '';
      this.selectedDate = '';
      this.tempPickedDate = null;
      this.exactMatch = false;
      this.showDropdown = false;
      this.pickerDate = '';
      this.displayedDate = '';

      this.$refs.datePicker.resetDate();

      this.personSearchQuery = '';
      this.$emit('update:extraSearch', '');
      this.$emit('update:dateFilter', {
        type: this.filterType,
        date: ""
      });
      this.$emit('update:exactMatch', {
        type: this.filterType,
        exact: false
      });
      this.$refs.datePicker.resetDate();
      this.$emit('resetAllFacets');

      this.$emit('update:selectedTerms', {
        type: this.filterType,
        terms: [],
      });
    },

    async fetchTerms() {
      try {
        this.isLoading = true;

        const selectedIds = this.selectedTerms.map(term => term.id || term.id_dil);
        const selectedParams = selectedIds.map(id => `selected=${id}`).join('&');
        const url = `${this.apiUrl}/places/autocomplete?q=${this.searchQuery}&${selectedParams}`;

        const response = await fetch(url);
        const data = await response.json();

        this.terms = data;
        this.groupTerms();
        this.isLoading = false;
      } catch (error) {
        console.error('Erreur lors de la récupération des termes :', error);
        this.isLoading = false;
      }
    },
    addExternalTerm(term) {
      if (!this.selectedTerms.find(t => t.label === term.label)) {
        this.selectedTerms.push(term);
      }
    },
    onUpdateDate({date, exact}) {
      this.selectedDate = date
      this.exactMatch = exact
      this.$emit('update:dateFilter', {
        date,
        exact
      })
    },

    async searchPersons() {
      if (!this.personSearchQuery || this.personSearchQuery.length < 2) {
        this.personSearchResults = [];
        return;
      }

      try {
        this.isLoading = true;

        const url = new URL(this.apiUrl.replace('/places/autocomplete', '/persons'));
        url.searchParams.append('search_extra', this.personSearchQuery);

        const response = await fetch(url);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erreur serveur: ${errorText}`);
        }

        const data = await response.json();

        this.personSearchResults = data.items.map(item => ({
          id: item._id_dil,
          label: `${item.lastname} ${item.firstnames}`,
          highlight: item.highlight || '',
        }));

        this.$emit('update:personSearch', this.personSearchQuery);

      } catch (error) {
        console.error('Erreur lors de la recherche d’informations :', error.message);
      } finally {
        this.isLoading = false;
      }
    },
    handleDateClick() {
      this.resetCalendar();
      this.menu = true;
    },
    groupTerms() {
      this.filteredTermsGrouped = this.terms.reduce((acc, term) => {
        const topic = term.topic || 'Résultats'
        if (!acc[topic]) acc[topic] = []
        acc[topic].push(term)
        return acc
      }, {})
    },
    filterTerms() {
      const query = this.searchQuery.toLowerCase()
      const filtered = this.terms.filter(term =>
          (term.label.toLowerCase().includes(query)) ||
          (term.label.toLowerCase().includes(query))
      )
      this.filteredTermsGrouped = filtered.reduce((acc, term) => {
        const topic = term.topic || 'Autre'
        if (!acc[topic]) acc[topic] = []
        acc[topic].push(term)
        return acc
      }, {})
    },
    handleTermSelection(term) {
      this.addTerm(term)
      this.searchQuery = ''
      this.showDropdown = true
    },
    addTerm(term) {
      if (!this.selectedTerms.find(t => t.label === term.label)) {
        this.selectedTerms.push(term);
      }
    },
    removeTerm(term) {
      this.selectedTerms = this.selectedTerms.filter(t => t.label !== term.label)
    },
    onPersonSearchInput() {
      this.$emit('update:extraSearch', this.personSearchQuery);
    },

    onClearPersonSearch() {
      this.personSearchQuery = '';
      this.$emit('update:extraSearch', ''); // ➔ reset complet dans le parent (ListView)
    },
    onGlobalClick(e) {
      // fermer si clic à l’extérieur de l’input ou de la liste
      const inputEl = this.$refs.autocompleteInput?.$el;
      if (!inputEl) {
        this.showDropdown = false;
        return;
      }
      if (!inputEl.contains(e.target)) this.showDropdown = false;
    },

    onSearchQueryInput() {
      this.showDropdown = true;
      this.fetchTerms();
      this.updateAutocompletePosition();
    },

    updateAutocompletePosition() {
      this.$nextTick(() => {
        // 1) cibler le wrapper visuel du v-text-field
        const root = this.$refs.autocompleteInput?.$el;
        if (!root) return;

        const fieldEl =
            root.querySelector('.v-field') ||            // Vuetify 3
            root.querySelector('.v-input') ||            // fallback
            root;                                        // dernier recours

        const rect = fieldEl.getBoundingClientRect();

        // Option: éviter les subpixels qui créent 1px d’écart
        const width = Math.round(rect.width);

        // (facultatif) clamp dans le viewport
        const padding = 8;
        const left = Math.max(padding, Math.min(rect.left, window.innerWidth - width - padding));

        this.autocompleteStyle = {
          position: 'fixed',
          top: `${rect.bottom}px`,
          left: `${left}px`,
          width: `${width}px`,
          // styles "conteneur"
          maxHeight: '300px',
          overflowY: 'auto',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderTop: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,.08)',
          zIndex: 3000,
          boxSizing: 'border-box',  // <— pour que width inclue la bordure
        };
      });
    },

  },
  mounted() {
    window.addEventListener('scroll', this.updateAutocompletePosition, {passive: true});
    window.addEventListener('resize', this.updateAutocompletePosition, {passive: true});
    document.addEventListener('click', this.onGlobalClick, true);
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.updateAutocompletePosition);
    window.removeEventListener('resize', this.updateAutocompletePosition);
    document.removeEventListener('click', this.onGlobalClick, true);
  },
}
</script>

<style scoped>

.facet-filter-container {
  position: relative;
  margin-top: 32px;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (max-width: 1200px) {
  .facet-filter-container {
    padding: 10px 8px;
  }
}


input[type="text"] {
  height: 60%;
  border: none;
  border-bottom: solid 1px var(--light-brown);
  border-radius: 0;
  padding: 10px;
  line-height: 1.2;
}

input[type="text"]::placeholder {
  font-size: 22px;
  font-weight: 400;
  color: #B4B4B4;
  opacity: 0.75;
}

.autocomplete-list {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  border-radius: 0 0 8px 8px;
  overflow: hidden;
}

.topic-header {
  font-weight: 600;
  padding: 10px 12px;
  background-color: #f4f4f4;
  list-style: none;
  margin: 0;
}

.autocomplete-item {
  padding: 10px 12px;
  cursor: pointer;
  list-style: none;
  margin: 0;
  display: block;
  white-space: normal;
  overflow: visible;
}


.autocomplete-item:hover {
  background: #f7f7f7;
}

.selected-terms .tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag {
  display: inline-flex;
  align-items: center;
  background: #e0e0e0;
  padding: 1px 8px;
  border-radius: 5px;
  font-size: 0.75em;
  width: auto;
  margin-bottom: 5px;
}

.tag button {
  border: none;
  border-radius: 9999px;
  color: red;
  font-size: 0.75em;
  margin-left: 10px;
  cursor: pointer;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  height: 15px;
}

.tag button:hover {
  color: darkred;
}


.search-header-terms {
  z-index: 2;
  background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iIzZENzI3OCIgZmlsbC1ydWxlPSJldmVub2RkIj48cGF0aCBkPSJNMTEuOTY2IDEzLjY0YzMuNzcgMCA2LjgyLTMuMDUgNi44Mi02LjgyIDAtMy43Ny0zLjA1LTYuODItNi44Mi02LjgyLTMuNzcgMC02LjgyIDMuMDUtNi44MiA2LjgyIDAgMy43NyAzLjA1IDYuODIgNi44MiA2LjgyTTIzLjkzIDI0LjgyYy0yLjAxLTMuNzItNS4xNDQtOC41OTYtMTEuOTY0LTguNTk2UzIuMDEzIDIxLjA5OSAwIDI0LjgxOWMzLjIwNSAzLjc5OSA2Ljc5NCA1LjEyNyAxMS45NjYgNS4xMjcgNS4xNyAwIDguNzYtMS4zMzggMTEuOTY1LTUuMTI3Ii8+PC9nPjwvc3ZnPg==) 0 no-repeat;
}

.search-header-places {
  background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTExLjc4IDBjNi41MDQgMCAxMS43OCA1LjIyIDExLjc4IDExLjY1NSAwIDUuMzA2LTcuMTc4IDE0Ljc1MS0xMC4zMjYgMTguNjQ4YTEuODY2IDEuODY2IDAgMDEtMi45MDggMEM3LjE3OCAyNi40MDYgMCAxNi45NjEgMCAxMS42NTUgMCA1LjIyMSA1LjI3NiAwIDExLjc4IDB6bTAgNy43N2MtMi4xNjYgMC0zLjkyNyAxLjc0Mi0zLjkyNyAzLjg4NXMxLjc2MSAzLjg4NSAzLjkyNyAzLjg4NWMyLjE2NiAwIDMuOTI3LTEuNzQyIDMuOTI3LTMuODg1UzEzLjk0NiA3Ljc3IDExLjc4IDcuNzd6IiBmaWxsPSIjNkQ3Mjc4IiBmaWxsLXJ1bGU9Im5vbnplcm8iLz48L3N2Zz4=) 0 no-repeat;
}

.active-tags {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  margin-top: 10px;
  gap: 10px;
  font-size: 0.9em;
  font-weight: 500;
  border-radius: 5px;
  padding: 5px 10px;
  color: #333;

}

.active-tags-delete-btn {
  background-color: #7B0C12;
  width: 20px;
  height: 20px;
  font-size: 0.8em;
  line-height: 20px;
  text-align: center;
  color: #ffffff;
  border-radius: 90px;
}

.active-tags-delete-btn:hover {
  background-color: #9B1A24;
}

.reset-global-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.reset-results-btn {
  background-color: #BEBEBE !important;
  color: #ffffff !important;
  box-shadow: none !important;
  font-size: 1.8em !important;
  border-radius: 50% !important;
  width: 1px !important;
  height: 60px !important;
  padding: 0 !important;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease-in-out;
}


.reset-icon {
  transform: rotate(-50deg);
}

.reset-results-btn:hover {
  background-color: var(--red-pompein) !important;
}

@media (max-width: 768px) {
  .search-header-terms {
    padding-left: 20px;
  }

  .search-header-places {
    padding-left: 20px;
  }

  .active-tags-delete-btn {
    font-size: 0.5em;
  }

  .active-tags-labels {
    font-size: 0.75em;
  }
}


.term-label {
  font-weight: 500;
  line-height: 1.4;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.term-department,
.term-patents {
  display: inline-block;
  margin-top: 2px;
  color: #777;
  font-size: 0.9em;
  margin-left: 5px;
}


.cursor-pointer {
  cursor: pointer;
}

.title {
  font-weight: 400;
  font-size: 15px;
}


.date-picker-container {
  margin-top: 20px;
}


.v-icon--start {
  color: #6D7277;
  font-size: 30px;
}


.reset-global-container {
  margin-top: 20px;
  text-align: center;
}

.reset-global-container v-btn {
  font-size: 0.8em;
  padding: 5px 10px;
}

</style>
