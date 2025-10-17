<template>
  <div ref="mapContainer" class="leaflet-map"></div>
</template>

<script>
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';

export default {
  name: 'LeafletMap',
  props: {
    apiBase: String,
    cityQuery: Array,
    date: String,
    exact: Boolean
  },
  emits: ['selectCity'],
  data() {
    return {
      map: null,
      clusterGroup: null,
      isReady: false
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.initMap();
      this.fetchCities(
          {
            patent_city_query: this.cityQuery,
            patent_date_start: this.date,
            exact_patent_date_start: this.exact
          }
      ).then(() => {
            this.isReady = true;
          }
      );
    });
    window.addEventListener("click", this.initMapLinks);
  },
  unmounted() {
    window.removeEventListener("click", this.initMapLinks);
  },
  methods: {
    updateMap() {
      if (!this.map) return;
      this.fetchCities({
        patent_city_query: this.cityQuery,
        patent_date_start: this.date,
        exact_patent_date_start: this.exact
      });
    },
    initMap() {
      this.map = L.map(this.$refs.mapContainer, {
        zoomSnap: 1,
        zoomDelta: 1,
        center: [46.5, 2.5],
        zoom: 4,
        minZoom: 5,
        maxZoom: 15,
        attributionControl: false
      });

      this.map.setMaxBounds([
        [41, -5],
        [51, 10]
      ]);
      this.map.createPane('OSM');
      this.map.getPane('OSM').style.zIndex = 250;

      const osm = L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
          {
            attribution: '&copy; OpenStreetMap & CartoDB',
            subdomains: 'abcd',
            maxZoom: 19,
            pane: 'OSM'
          }
      );

      osm.addTo(this.map);

      this.clusterGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        iconCreateFunction: (cluster) => {
          const children = cluster.getAllChildMarkers();
          const totalImprimeurs = children.reduce((acc, m) => {
            return acc + (m.options.nbPrinters || 1);
          }, 0);

          const sizeClass =
              totalImprimeurs < 10 ? 'marker-cluster-small' :
                  totalImprimeurs < 50 ? 'marker-cluster-medium' : 'marker-cluster-large';

          return L.divIcon({
            html: `<div><span>${totalImprimeurs}</span></div>`,
            className: `marker-cluster ${sizeClass}`,
            iconSize: L.point(40, 40)
          });
        }
      });
      this.map.addLayer(this.clusterGroup);
    },
    initMapLinks(evt) {
      // Scrolls down from map city popup link to list and emits selectCity event :
      const t = this;
      const target = evt.target;
      if (target.tagName.toLowerCase() === "a" && target.getAttribute("class") === "city-link") {
        evt.preventDefault();
        evt.stopImmediatePropagation();
        const cityDil = target.getAttribute("data-city");
        console.log("emit", cityDil, t);
        t.$emit("selectCity", cityDil);
        const table = document.getElementById("table-imprimeurs"); // Cf id of <v-data-table> in ListView
        if (table) {
          window.scroll({
            top: table.offsetTop - 72,
            left: 0,
            behavior: "smooth",
          });
        }
      }
    },
    centerOnCity(cityId) {
      if (!this.map) return;

      const marker = this.clusterGroup.getLayers().find(m => m.options.cityId === cityId);
      if (marker) {
        const latlng = marker.getLatLng();
        if (latlng) {
          this.map.setView(latlng, 8, {animate: true});
          marker.openPopup();
        }
      }
    },

    async fetchCities(filters = {}) {
      try {
        const url = new URL(`${this.apiBase}/map/places`);

        if (filters.patent_city_query && filters.patent_city_query.length > 0) {
          filters.patent_city_query.forEach(cityId => {
            url.searchParams.append("patent_city_query", cityId);
          });
        }

        if (filters.patent_date_start) {
          url.searchParams.append("patent_date_start", filters.patent_date_start);
        }

        if (filters.exact_patent_date_start) {
          url.searchParams.append("exact_patent_date_start", "true");
        }

        const res = await fetch(url.toString());
        const cities = await res.json();

        this.clusterGroup.clearLayers();

        cities.forEach(city => {
          const rawCoords = city.city_long_lat?.replace(/[()]/g, '').split(',').map(Number);
          if (!rawCoords || rawCoords.length !== 2 || rawCoords.some(isNaN)) return;

          let [lat, lon] = rawCoords;
          if (Math.abs(lat) < Math.abs(lon)) [lat, lon] = [lon, lat];

          const nbPrinters = city.persons?.length || 1;

          const popupHtml = `
    <a href="" class="city-link" data-city="${city.city_dil}">
      ${city.city_label} (${city.city_dept_label})
    </a><br/>
    ${nbPrinters} imprimeur(s) - lithographe(s)<br/>
  `;

          const marker = L.circleMarker([lat, lon], {
            radius: 5 + Math.log(nbPrinters) * 5,
            color: 'blue',
            fillColor: 'blue',
            fillOpacity: 0.5,
            cityId: city.city_dil,
            nbPrinters
          });

          marker.bindPopup(popupHtml);
          this.clusterGroup.addLayer(marker);
        });

      } catch (err) {
        console.error("Erreur lors du chargement des villes :", err);
      }
    }

  },
  watch: {
    cityQuery: {
      handler() {
        if (this.map) this.updateMap();
      },
      immediate: true
    },
    date: {
      handler() {
        if (this.map) this.updateMap();
      },
      immediate: true
    },
    exact: {
      handler() {
        if (this.map) this.updateMap();
      },
      immediate: true
    }
  },
};
</script>

<style scoped>
.leaflet-map {
  height: 100%;
  transition: opacity 0.5s ease;
  border: 1px solid #EEEEEE;
  border-top: 1px solid #ccc;
  border-radius: 0px 0px 20px 20px;
}

:deep(.leaflet-popup-content a.city-link) {
  font-weight: bold;
  text-decoration: none;
  color: black
}

:deep(.leaflet-popup-content a.city-link:hover) {
  text-decoration: underline !important;
  color: var(--brown);
}
</style>
