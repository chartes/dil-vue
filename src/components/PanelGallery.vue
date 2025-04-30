<template>
  <div class="panel-gallery-container d-flex justify-center align-center">
    <v-hover
        v-for="(panel, i) in panels"
        :key="i"
        v-slot="{ isHovering, props }"
    >
      <v-card
  v-bind="props"
  class="panel-card"
  elevation="8"
>
        <router-link :to="panel.router" class="panel-card-link">
  <div
    class="image-wrapper"
    :style="getImageStyle(panel, isHovering)"
  ></div>
  <div class="overlay" :class="{ active: isHovering }">
    <p class="panel-card-label">{{ panel.label }}</p>
  </div>
          </router-link>
</v-card>

    </v-hover>
  </div>
</template>

<script>
export default {
  name: 'PanelGallery',
  data() {
    return {
      panels: [
        {
          image: new URL('@/assets/images/lautrec.jpg', import.meta.url).href,
          label: "Consulter",
          router: { path: '/list' },
          position: '77%',
          zoom: '1'
        },
        {
          image: new URL('@/assets/images/bnf_simple.jpg', import.meta.url).href,
          label: "Mode d'emploi",
          router: { path: '/info', query: { section: "usage" } },
          position: 'center',
          zoom: '1'
        },
        {
          image: new URL('@/assets/images/imprimeur-lito.jpg', import.meta.url).href,
          label: 'Carte interactive',
          router: { path: '/list', query: { map: "open" } },
          position: '16%',
          zoom: '1.13'
        }
      ]
    }
  },
  methods: {
  getImageStyle(panel, isHovering) {
    const baseZoom = parseFloat(panel.zoom || '1')
    const zoom = isHovering ? baseZoom * 1.05 : baseZoom
    return {
      backgroundImage: `url(${panel.image})`,
      backgroundPosition: panel.position,
      transform: `scale(${zoom})`,
    }
  }
}

}

</script>

<style scoped>

.panel-gallery-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 40px 80px;
  width: 100%;
}

.panel-card {
  width: 100%;
  height: 80vh;
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  transition: transform 0.4s ease;
  background: none !important;
  z-index: 10 ;
  margin: 0 30px 10px 0 !important;
}

.panel-card:hover {
  cursor: pointer;
}

.image-wrapper {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  transition: transform 0.4s ease;
}

.image-wrapper.zoomed {
  transform: scale(1.05); /* zoom léger */
}

.overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.6);
  transform: translateY(100%);
  transition: transform 0.3s ease;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 30px;
  z-index: 1;
}

.overlay.active {
  transform: translateY(0%);
}

.overlay a {
  color: white;
  font-weight: bold;
  font-size: 1.2em;
  text-transform: uppercase;
  text-decoration: none;
}

.panel-card-label {
  color: #ffffff !important;
  font-weight: bold;
  font-size: 1em;
  text-transform: uppercase;
  text-decoration: none;
  position: absolute;
  bottom: 5px;
  left: 10px;
  z-index: 2;
  transition: color 0.3s ease;
  padding: 10px;
  width: calc(100% - 20px);
  text-align: right;
}

@media (max-width: 960px) {
  .panel-gallery-container {
    flex-direction: column;
    gap: 15px;
  }

  .panel-card {
    width: 100% !important;
    height: 60vh;
  }
}

</style>
