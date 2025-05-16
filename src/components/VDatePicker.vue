<template>
  <div class="date-picker-container">
    <span class="advanced_search_header">
      <v-icon start class="icon">mdi-calendar</v-icon>
      <span class="title">Début du brevet</span>
    </span>
    <v-menu
        v-model="menu"
        offset-y
        :close-on-content-click="false"
        :return-value.sync="menu"
        :nudge-top="40"
        :nudge-width="200"
    >

      <template #activator="{ props }">
        <v-checkbox
            v-model="exactDate"
            label="Date exacte"
            density="compact"
            hide-details
            class="exact-date-checkbox"
            v-if="this.day"
        />
        <v-text-field
            class="date-picker-facet"
            v-bind="props"
            :model-value="displayedDate"
            readonly
            @click="openMenu"
            @click:prepend-inner="openMenu"
            color="var(--light-brown)"
            placeholder="Sélectionner une date"
        >
          <template #prepend-inner>
            <v-icon
                v-if="displayedDate && !menu"
                @click.stop="resetDate"
            >
              mdi-close-circle
            </v-icon>
          </template>
        </v-text-field>
      </template>
      <v-card>
        <!-- YEAR PICKER -->
        <v-date-picker-years
            v-if="step === 'year'"
            :min="minDate"
            :max="maxDate"
            :model-value="year"
            @update:model-value="onYearSelect"
        />

        <!-- MONTH PICKER -->
        <v-date-picker-months
            v-if="step === 'month'"
            v-model="monthIndex"
            :year="year"
            :min="minDate"
            :max="maxDate"
            @update:model-value="onMonthSelect"
        />

        <!-- DATE PICKER -->
        <v-date-picker-month
            v-if="step === 'date'"
            :v-model="day"
            :min="minDate"
            :max="maxDate"
            :month="month"
            :year="year"
            @update:model-value="onDaySelect"
        />

        <v-card-actions>
          <v-btn text @click="goBack" v-if="step !== 'year'">
            <v-icon icon="mdi-chevron-left"></v-icon>
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn text @click="closeMenu">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<script>
export default {
  name: 'DatePicker',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      menu: false,
      step: null,
      year: null,
      month: null,
      day: null,
      exactDate: false,
      minDate: '1800-01-01',
      maxDate: '1900-12-31',
    }
  },
  computed: {
    displayedDate() {
      if (this.year && this.month && this.day) {
        return new Date(`${this.year}-${String(this.month).padStart(2, '0')}-${String(this.day).padStart(2, '0')}`)
            .toLocaleDateString('fr-FR', {day: 'numeric', month: 'long', year: 'numeric'}) // 1 mars 1804
      } else if (this.year && this.month) {
        return new Date(`${this.year}-${String(this.month).padStart(2, '0')}-01`)
            .toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'}) // mars 1804
      } else if (this.year) {
        return `${this.year}` // 1804
      }
      return ''
    },
    monthIndex() {
      return this.month != null ? this.month - 1 : null
    }

  },
  watch: {
    modelValue(val) {
      if (val) {
        const dateParts = val.split('-')
        this.year = dateParts[0] ? parseInt(dateParts[0], 10) : null
        this.month = dateParts[1] ? parseInt(dateParts[1], 10) : null
        this.day = dateParts[2] ? parseInt(dateParts[2], 10) : null
        this.step = this.day ? 'date' : this.month ? 'month' : 'year'
      } else {
        this.year = null
        this.month = null
        this.day = null
        this.step = 'year'
      }
    },
    exactDate(val) {
      const iso =
          this.year +
          (this.month ? `-${String(this.month).padStart(2, '0')}` : '') +
          (this.day ? `-${String(this.day).padStart(2, '0')}` : '');

      this.$emit('update:dateMeta', {
        date: this.year ? iso : '',
        exact: val
      })
    },
    displayedDate(val) {
      if (this.year) {
        const iso =
            this.year +
            (this.month ? `-${String(this.month).padStart(2, '0')}` : '') +
            (this.day ? `-${String(this.day).padStart(2, '0')}` : '')
        //this.$emit('update:modelValue', iso)
        this.$emit('update:dateMeta', {
          date: iso,
          exact: this.exactDate
        })
      } else {
        this.$emit('update:dateMeta', {
          date: '',
          exact: false
        })
        //this.$emit('update:modelValue', '')
      }
    },
  },
  methods: {
    openMenu() {
      this.menu = true
      if (!this.year) {
        this.year = ''
        this.month = ''
        this.day = ''
      }
      this.step = 'year'
    },
    closeMenu() {
      this.menu = false
    },
    onYearSelect(val) {
      console.log("onYearSelect", val)
      this.step = 'month'
      this.$nextTick(() => {
        this.step = 'month'
        this.month = ''
      })
      this.year = Number(val)
    },
    onMonthSelect(val) {
      this.step = 'date'
      this.$nextTick(() => {
        this.step = 'date'
      })
      this.month = Number(val) + 1
    },
    onDaySelect(val) {
      const date = new Date(val)
      this.day = date.getDate()
    },
    goBack() {
      if (this.step === 'date') {
        this.step = 'month'
        //this.month = this.month - 1
        this.day = ''
      } else if (this.step === 'month') {
        this.step = 'year'
        this.month = ''
      }
    },
    resetDate() {
  this.year = null;
  this.month = null;
  this.day = null;
  this.exactDate = false;
  this.step = 'year';
  this.menu = false;

  this.$emit('update:dateMeta', {
    date: '',
    exact: false
  });
}

  },
}
</script>

<style scoped>
.date-picker-container {
  margin-top: 12px;
}

.advanced_search_header {
  font-family: var(--font-secondary);
  font-weight: 400;
  font-size: 18px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.v-text-field.date-picker-facet {
  font-family: var(--font-secondary);
  font-size: 16px;
  background-color: var(--panel-bg-color);
  padding: 0 !important;
  margin: 0 !important;
  line-height: 1.2;
  border: none !important;
}

.v-text-field.date-picker-facet .v-input__control {
  min-height: 10px;
  padding: 0 8px;
}

.v-text-field.date-picker-facet .v-field__input {
  padding: 0;
}

.cursor-pointer {
  cursor: pointer;
}
.title {
  font-family: var(--font-secondary);
  font-weight: 400;
  font-size: 18px;
  margin-left: -9px;
}

.v-icon--start {
  color: #6D7277;
  font-size: 30px;
}

.exact-date-checkbox {
  margin-top: 0;
  margin-bottom: 0;
  font-family: var(--font-secondary);
  font-size: 0.95rem;
}
</style>
