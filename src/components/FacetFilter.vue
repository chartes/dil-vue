<template>
  <div class="facet-filter-container">
    <!-- add a v-text field to search a person -->
    <v-text-field
        v-model="personSearchQuery"
        @input="onPersonSearchInput"
        @click:clear="onClearPersonSearch"
        class="search-bar"
        label="Rechercher dans les notices"
        hide-details
        clearable
        dense
        color="var(--light-brown)"
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
          color="var(--light-brown)"
          @click:clear="searchQuery = ''"
      />

      <div
          v-if="showDropdown && searchQuery !== ''"
          class="autocomplete-list"
          :style="autocompleteStyle"
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
              {{ term.total_patents_if_selected }} brevet{{ term.total_patents_if_selected > 1 ? 's' : '' }}
              –
              {{ term.total_persons_if_selected }} imprimeur{{ term.total_persons_if_selected > 1 ? 's' : '' }}
            </div>
          </li>
        </ul>
      </div>
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
          {{ term.label }} <span class="term-department">({{ term.department_label_fr }})</span>
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
        @update:dateMeta="onUpdateDate"
    />

    <!-- Bouton RESET GLOBAL -->
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
import {mapState} from 'vuex';
import VDatePicker from "./VDatePicker.vue";

export default {
  name: 'FacetFilter',
  components: {
    VDatePicker: VDatePicker,
  },
  props: {
    title: {type: String, default: 'Facette'},
    /*apiUrl: {type: String, required: true},*/
    filterType: {type: String, required: true},
    reset: {type: Boolean, default: false},
    initialSelectedIds: {type: Array, default: () => []},
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
      tempPickedDate: null, // pour sélectionner sans valider tout de suite
      isLoading: false,
      showDropdown: false,
      pickedDate: null,       // ex: "1846-03-06"
      displayedDate: '',      // affiché dans le champ
      minDate: '1780-01-01',
      maxDate: '1910-12-31',
      menu: false,
      pickerDate: '',
      activePicker: 'year',
      currentYear: '',
      currentMonth: '',
      selectedDate: '',
      currentDay: '',
      exactMatch: false,
      autocompleteStyle: {
        top: '0px',
        left: '0px',
        width: '90%',
        position: 'absolute',
        zIndex: 1000
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
    selectedTerms: {
      handler(newValue) {
        this.$emit('update:selectedTerms', {
          type: this.filterType,
          terms: newValue,
        })
      },
      deep: true,
    },
    reset(newVal) {
      if (newVal) this.selectedTerms = []
    },
    selectedDate: {
      handler(newVal) {
        this.$emit('update:selectedDate', {
          type: this.filterType,
          date: newVal,
        })
      },
    },
    exactMatch: {
      handler(newVal) {
        this.$emit('update:exactMatch', {
          type: this.filterType,
          exact: newVal,
        })
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

      // 🧹 Reset visuel date picker
      this.pickerDate = '';
      this.displayedDate = '';

      this.$refs.datePicker.resetDate();

      this.personSearchQuery = '';
      this.$emit('update:extraSearch', ''); // ➔ reset complet dans le parent (ListView)

      // ✅ Forcer l’émission des mises à jour pour le parent
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
    onSearchQueryInput() {
      this.showDropdown = true;
      this.fetchTerms();
      this.updateAutocompletePosition();
    },
    updateAutocompletePosition() {
      this.$nextTick(() => {
        const inputEl = this.$refs.autocompleteInput?.$el?.querySelector('input');
        const listEl = this.$el.querySelector('.autocomplete-list');

        if (inputEl && listEl) {
          const rect = inputEl.getBoundingClientRect();
          const containerRect = this.$el.getBoundingClientRect();

          this.autocompleteStyle = {
            position: 'absolute',
            top: `${rect.bottom - containerRect.top}px`,
            left: `${rect.left - containerRect.left}px`,
            zIndex: 1000,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            maxHeight: '300px',
            overflowY: 'auto'
          };
        }
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
        type: this.filterType,
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

        // ⚡ Correction ici : apiBase n'existe pas => utilise apiUrl
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
      console.log(this.terms)
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
    }

  },
  mounted() {
    //this.fetchTerms()
  },
}
</script>

<style scoped>

.facet-filter-container {
  position: relative;
  margin-top: 50px;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

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
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-top: none;
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
  list-style: none;
  padding: 0;
  margin: 0;
}

.topic-header {
  font-weight: bold;
  padding: 10px;
  background-color: #f4f4f4;
}

.autocomplete-item {
  padding: 10px;
  cursor: pointer;
}

.autocomplete-item:hover {
  background: #f0f0f0;
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
  background-color: #f4f4f4;
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
  justify-content: center; /* Centrage horizontal */
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

/* rotate icon */
.reset-icon {
  transform: rotate(-50deg);
}

.reset-results-btn:hover {
  background-color: #7B0C12 !important;
}






@media (max-width: 768px) {
  .facet-filter-container {
    padding-left: 10px;
    padding-right: 10px;
  }

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
    font-size: 0.5em;
  }
}


.term-label {
  font-weight: 500;
}

.term-department {
  font-size: 0.9em;
  color: #777;
  margin-left: 5px;
}

.term-patents {
  font-size: 0.85em;
  color: #777;
  margin-left: 5px;
  margin-top: 2px;
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
