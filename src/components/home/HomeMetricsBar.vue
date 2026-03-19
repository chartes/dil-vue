<template>
  <div class="metrics-bar d-flex align-center justify-center">
    <div class="text-center mx-4">
      <div class="metric-label">IMPRIMEURS</div>
      <div class="metric-value">{{totalPersons}}</div>
    </div>

    <div class="separator"></div>

    <!--<div class="text-center mx-4">
      <div class="metric-label">IMPRIMERIES</div>
      <div class="metric-value">{{totalPatents}}</div>
    </div>

    <div class="separator"></div>-->

    <div class="text-center mx-4">
      <div class="metric-label">BREVETS</div>
      <div class="metric-value">{{totalEffectivePatents}}</div>
    </div>
  </div>
</template>


<script>
import { mapState } from "vuex";

export default {
  name: 'MetricsBar',
  props: {
    animate: {
      type: Boolean,
      default: true
    },
    animationDuration: {
      type: Number,
      default: 1200
    }
  },
  data() {
    return {
      totalPersons: 0,
      totalPatents: 0,
      totalEffectivePatents: 0,
    }
  },
  computed: {
    ...mapState(['apiUrl']),
  },
  methods: {
    async fetchMetrics() {
      try {
        const response = await fetch(`${this.apiUrl}/infos`);
        if (!response.ok) throw new Error('Network error');

        const data = await response.json();

        this.setMetric('totalPersons', data.total_persons);
        this.setMetric('totalPatents', data.total_patents);
        this.setMetric('totalEffectivePatents', data.total_effective_patents);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    },

    setMetric(key, target) {
      if (this.animate) {
        this.animateCount(key, target);
      } else {
        this[key] = target;
      }
    },

    animateCount(key, target) {
      const duration = this.animationDuration;
      const start = 0;
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        this[key] = Math.floor(start + (target - start) * progress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this[key] = target;
        }
      };

      requestAnimationFrame(animate);
    }
  },
  mounted() {
    this.fetchMetrics();
  },
}
</script>

<style scoped>
.metrics-bar {
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}


.metric-label {
  font-size: 0.9rem;
  color: #6c6c6c;
  font-weight: 500;
  letter-spacing: 1px;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--red-pompein) !important;
  margin-top: 4px;
  line-height: 1;
  min-width: 180px;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.separator {
  height: 60px;
  width: 5px;
  background-color: black;
  margin: 0 20px;
}


@media screen and (max-width: 960px) {
  .metric-value {
    font-size: 2rem;
  }
}

@media screen and (max-width: 600px) {
  .text-center.mx-4,
  .separator {
    margin: 0 !important;
  }
}

@media screen and (max-width: 480px) {

  .metrics-bar {
    flex-direction: column;
    gap: 30px;
    margin: 10px 0 40px;
  }

  .separator {
    display: none;
  }
}


</style>
