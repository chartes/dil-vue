<template>
  <div class="panel-gallery-container">
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
        :style="getImageStyle(panel, isMobile ? false : isHovering)"
      ></div>
      <div class="overlay" :class="{ active: isMobile || isHovering }">
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
  },
    computed: {
      isMobile() {
        return window.innerWidth <= 960
      }
    }
}

}

</script>

<style scoped>

.panel-gallery-container {
  position: relative;
  display: flex;
  justify-content: flex-start;
  gap: 24px;
  margin-top: 40px;
  margin-left: 40px;
  padding-right: 20px;
  margin-right: 0;
width: 100%;
  z-index: 2;
}
.panel-card {
  flex: 1 1 calc(34% - 16px);
  height: 80vh;
  max-width: 100%;
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.4s ease;
  margin: 0;
}

.panel-card:hover {
  cursor: pointer;
}
.panel-card {
  background-color: #ddd; /* ← ajoute un fond visible même sans image */
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
  border-radius: 10px;
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

@media screen and (max-width: 1300px) {
  .panel-gallery-container {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    z-index:1000;
    margin-left: 30px;

  }

  .panel-card {
    flex: 1 1 calc(100% - 16px);
    height: 40vh;
    z-index:1000;
    width: 100%;
    max-width: 95%;
      pointer-events: auto;
   filter: none;
  }

  .overlay {
    transform: translateY(0%) !important;
    background: rgba(0, 0, 0, 0.4);
  }

  .overlay.active {
    transform: translateY(0%) !important;
  }

  .panel-card-label {
    text-align: center;
    bottom: 15px;
  }
}


@media screen and (max-width: 950px) {
  .panel-gallery-container {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    z-index:1000;
    margin-left: 0;

  }

  .panel-card {
    flex: 1 1 calc(100% - 16px);
    height: 40vh;
    z-index:1000;
    width: 100%;
    max-width: 95%;
      pointer-events: auto;
   filter: none;
  }

  .overlay {
    transform: translateY(0%) !important;
    background: rgba(0, 0, 0, 0.4);
  }

  .overlay.active {
    transform: translateY(0%) !important;
  }

  .panel-card-label {
    text-align: center;
    bottom: 15px;
  }
}



</style>