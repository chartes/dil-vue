<template>
  <div class="metrics-bar d-flex align-center justify-center">
    <div class="text-center mx-4">
      <div class="metric-label">PERSONNES</div>
      <div class="metric-value">{{totalPersons}}</div>
    </div>

    <div class="separator"></div>

    <div class="text-center mx-4">
      <div class="metric-label">BREVETS</div>
      <div class="metric-value">{{totalPatents}}</div>
    </div>
  </div>
</template>


<script>
export default {
  name: 'MetricsBar',
  data () {
    return {
      totalPersons: 0,
      totalPatents: 0,
      apiBase: 'http://127.0.0.1:9090/dil/api'
    }
  },
  methods: {
  async fetchMetrics() {
    try {
      const response = await fetch(`${this.apiBase}/infos`);
      if (!response.ok) throw new Error('Network error');
      const data = await response.json();

      this.animateCount('totalPersons', data.total_persons);
      this.animateCount('totalPatents', data.total_patents);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  },

  animateCount(key, target) {
    const duration = 0; // 1 seconde
    const start = 0;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      this[key] = Math.floor(progress * target);
      /* augment size of metric with css */

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this[key] = target; // Assure que la valeur finale est exacte
      }
    };

    requestAnimationFrame(animate);
  }
},
  mounted () {
    this.fetchMetrics()
  },
}
</script>

<style scoped>
.metrics-bar {
  margin-top: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}


.metric-label {
  font-size: 0.9rem;
  color: #6c6c6c;
  font-weight: 500;
  letter-spacing: 1px;
  height: 1.5rem; /* 👈 fixe la hauteur */
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--light-brown-alt);
  margin-top: 4px;
  line-height: 1;
  min-width: 180px; /* évite les sauts de largeur */
  height: 3rem; /* fixe la hauteur du bloc numérique */
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
</style>
