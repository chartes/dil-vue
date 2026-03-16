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
  name: 'ListLeafletMap',
  props: {
    apiBase: {
      type: String,
      required: true
    },
    visible: {
      type: Boolean,
      default: false
    },
    cityQuery: {
      type: Array,
      default: () => []
    },
    date: {
      type: String,
      default: ''
    },
    exact: {
      type: Boolean,
      default: false
    }
  },
  emits: ['selectCity'],
  data() {
    return {
      map: null,
      clusterGroup: null,
      selectedLayer: null,
      franceBounds: L.latLngBounds([41, -5], [51, 10]),
      mapBounds: L.latLngBounds([40.5, -6], [52.3, 11]),
      fetchToken: 0,
      pendingLatLngs: [],
      markerLatLngs: []
    };
  },
  mounted() {
    this.$nextTick(async () => {
      this.initMap();
      await this.fetchCitiesFromProps();
      this.refreshMapLayout();
    });

    window.addEventListener('click', this.initMapLinks);
  },
  unmounted() {
    window.removeEventListener('click', this.initMapLinks);

    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  },
  methods: {
    buildFiltersFromProps() {
      return {
        patent_city_query: this.cityQuery,
        patent_date_start: this.date,
        exact_patent_date_start: this.exact
      };
    },

    async fetchCitiesFromProps() {
      return this.fetchCities(this.buildFiltersFromProps());
    },

    initMap() {
      this.map = L.map(this.$refs.mapContainer, {
        zoomSnap: 1,
        zoomDelta: 1,
        minZoom: 5.5,
        maxZoom: 15,
        maxBounds: this.mapBounds,
        maxBoundsViscosity: 1.0,
        attributionControl: false
      });

      this.map.createPane('OSM');
      this.map.getPane('OSM').style.zIndex = 250;

      const osm = L.tileLayer(
          'https://data.geopf.fr/wmts?' +
          '&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&TILEMATRIXSET=PM' +
          '&LAYER={ignLayer}&STYLE={style}&FORMAT={format}' +
          '&TILECOL={x}&TILEROW={y}&TILEMATRIX={z}',
          {
            ignLayer: 'GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40',
            style: 'normal',
            format: 'image/jpeg',
            opacity: 1,
            minZoom: 5.5,
            maxZoom: 15,
            pane: 'OSM'
          }
      );

      osm.addTo(this.map);

      this.clusterGroup = L.markerClusterGroup({
  showCoverageOnHover: false,
  spiderfyOnMaxZoom: true,
  maxClusterRadius: 60,
  zoomToBoundsOnClick: true,
  iconCreateFunction: (cluster) => {
    const children = cluster.getAllChildMarkers();
    const totalImprimeurs = children.reduce((acc, marker) => {
      return acc + (marker.options.nbPrinters || 1);
    }, 0);

    const sizeClass =
      totalImprimeurs < 10
        ? 'marker-cluster-small'
        : totalImprimeurs < 50
          ? 'marker-cluster-medium'
          : 'marker-cluster-large';

    return L.divIcon({
      html: `<div><span>${totalImprimeurs}</span></div>`,
      className: `marker-cluster ${sizeClass}`,
      iconSize: L.point(40, 40)
    });
  }
});

this.selectedLayer = L.featureGroup();

this.map.addLayer(this.clusterGroup);
this.map.addLayer(this.selectedLayer);
    },

    applyPendingViewport(latLngs = null) {
      if (!this.map) return;

      const el = this.$refs.mapContainer;
      if (!el || el.offsetWidth < 50 || el.offsetHeight < 50 || !this.visible) {
        if (latLngs) {
          this.pendingLatLngs = latLngs;
        }
        return;
      }

      const finalLatLngs = latLngs ?? this.pendingLatLngs ?? [];

      this.map.invalidateSize(true);
      this.fitMapToMarkers(finalLatLngs);

      this.pendingLatLngs = [];
    },

    refreshMapLayout() {
      if (!this.map) return;

      this.$nextTick(() => {
        requestAnimationFrame(() => {
          this.applyPendingViewport(this.markerLatLngs);
        });
      });
    },

    initMapLinks(evt) {
      const link = evt.target.closest('a.city-link');
      if (!link) return;

      evt.preventDefault();
      evt.stopImmediatePropagation();

      const cityDil = link.getAttribute('data-city');
      this.$emit('selectCity', cityDil);

      const table = document.getElementById('table-imprimeurs');
      if (table) {
        window.scroll({
          top: table.offsetTop - 72,
          left: 0,
          behavior: 'smooth'
        });
      }
    },

    centerOnCity(cityId) {
      if (!this.map || !this.clusterGroup) return;

      const marker = this.clusterGroup.getLayers().find(
          (m) => m.options.cityId === cityId
      );

      if (!marker) return;

      const latlng = marker.getLatLng();
      if (!latlng) return;

      this.map.setView(latlng, 8, {animate: true});
      marker.openPopup();
    },

    fitMapToMarkers(latLngs) {
      if (!this.map) return;

      if (!latLngs.length) {
        this.map.fitBounds(this.franceBounds, {padding: [20, 20]});
        if (this.map.getZoom() > 10) this.map.setZoom(10);
        return;
      }

      if (latLngs.length === 1) {
        this.map.setView(latLngs[0], 8, {animate: true});
        return;
      }

      this.map.fitBounds(L.latLngBounds(latLngs), {
        padding: [20, 20]
      });

      if (this.map.getZoom() > 12) {
        this.map.setZoom(12);
      }
    },

    async fetchCities(filters = {}) {
      if (!this.clusterGroup) return;

      const currentToken = ++this.fetchToken;

      try {
        const url = new URL(`${this.apiBase}/map/places`);

        if (filters.patent_city_query?.length) {
          filters.patent_city_query.forEach((cityId) => {
            url.searchParams.append('patent_city_query', cityId);
          });
        }

        if (filters.patent_date_start) {
          url.searchParams.append('patent_date_start', filters.patent_date_start);
        }

        if (filters.exact_patent_date_start) {
          url.searchParams.append('exact_patent_date_start', 'true');
        }

        const res = await fetch(url.toString());
        if (!res.ok) {
          throw new Error(`Erreur API map: ${res.status}`);
        }

        const cities = await res.json();

        if (currentToken !== this.fetchToken) return;

        this.clusterGroup.clearLayers();

        const markerLatLngs = [];

        cities.forEach((city) => {
          const rawCoords = city.city_long_lat
              ?.replace(/[()]/g, '')
              .split(',')
              .map(Number);

          if (!rawCoords || rawCoords.length !== 2 || rawCoords.some(isNaN)) return;

          let [lat, lon] = rawCoords;
          if (Math.abs(lat) < Math.abs(lon)) [lat, lon] = [lon, lat];

          markerLatLngs.push([lat, lon]);

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

        this.markerLatLngs = markerLatLngs;
        this.pendingLatLngs = markerLatLngs;
        this.refreshMapLayout();
      } catch (err) {
        console.error('Erreur lors du chargement des villes :', err);
      }
    }
  },
  watch: {
    cityQuery: {
      handler() {
        if (this.map) this.fetchCitiesFromProps();
      },
      deep: true
    },
    visible(newVal) {
      if (newVal && this.map) {
        this.applyPendingViewport();
      }
    },
    date() {
      if (this.map) this.fetchCitiesFromProps();
    },
    exact() {
      if (this.map) this.fetchCitiesFromProps();
    }
  }
};
</script>

<style scoped>
.leaflet-map {
  width: 100%;
  height: 100%;
  background-color: white;
  transition: opacity 0.3s ease;
  border: 1px solid #eeeeee;
  border-top: 1px solid #ccc;
  border-radius: 0 0 20px 20px;
}

.leaflet-map :deep(.leaflet-container) {
  background: white;
}

:deep(.leaflet-popup-content a.city-link) {
  font-weight: bold;
  text-decoration: none;
  color: black;
}

:deep(.leaflet-popup-content a.city-link:hover) {
  text-decoration: underline !important;
  color: var(--brown);
}
</style>