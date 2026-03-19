<template>
  <div ref="mapContainer" class="leaflet-map"></div>
</template>

<script>
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import logoDicotopo from '@/assets/images/logos/logo-dicotopo.png'

export default {
  name: 'LeafletMap',
  props: {
    apiBase: String,
    cityQuery: Array,
    date: String,
    exact: Boolean,
    searchHeadInfo: String,
    searchExtraInfo: String
  },
  emits: ['selectCity'],
  data() {
    return {
      map: null,
      clusterGroup: null,
      isReady: false,
      lastFetchKey: null,
      fetchController: null,
      requestSeq: 0
    };
  },
  mounted() {
  window.addEventListener("click", this.initMapLinks);

  this.$nextTick(async () => {
    this.initMap();

    const initialFilters = {
      patent_city_query: this.cityQuery,
      patent_date_start: this.date,
      exact_patent_date_start: this.exact,
      search_head_info: this.searchHeadInfo,
      search_extra_info: this.searchExtraInfo
    };

    this.lastFetchKey = JSON.stringify({
      cityQuery: this.cityQuery || [],
      date: this.date || '',
      exact: !!this.exact,
      searchHeadInfo: this.searchHeadInfo || '',
      searchExtraInfo: this.searchExtraInfo || ''
    });

    await this.fetchCities(initialFilters);
    this.isReady = true;
  });
},
  unmounted() {
    window.removeEventListener("click", this.initMapLinks);
  },
  methods: {
    updateMap() {
      if (!this.map || !this.clusterGroup) return;

      const nextKey = JSON.stringify({
        cityQuery: this.cityQuery || [],
        date: this.date || '',
        exact: !!this.exact,
        searchHeadInfo: this.searchHeadInfo || '',
        searchExtraInfo: this.searchExtraInfo || ''
      });

      if (nextKey === this.lastFetchKey) return;
      this.lastFetchKey = nextKey;

      this.fetchCities({
        patent_city_query: this.cityQuery,
        patent_date_start: this.date,
        exact_patent_date_start: this.exact,
        search_head_info: this.searchHeadInfo,
        search_extra_info: this.searchExtraInfo
      });
    },
    initMap() {
      this.map = L.map(this.$refs.mapContainer, {
        center: [46.5, 2.5],
        zoom: 6,
        minZoom: 6,
        maxZoom: 15,
        zoomSnap: 1,
        zoomDelta: 1,
        attributionControl: false,
        maxBoundsViscosity: 0.8
      });

      this.map.setMaxBounds([
        [55, -10],
        [20, 15]
      ]);

      this.map.createPane('IGN');
      this.map.getPane('IGN').style.zIndex = 250;

      const etatMajor = L.tileLayer(
          'https://data.geopf.fr/wmts?' +
          'SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0' +
          '&LAYER={ignLayer}' +
          '&STYLE={style}' +
          '&FORMAT={format}' +
          '&TILEMATRIXSET=PM' +
          '&TILEMATRIX={z}' +
          '&TILEROW={y}' +
          '&TILECOL={x}',
          {
            ignLayer: 'GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40',
            style: 'normal',
            format: 'image/jpeg',
            pane: 'IGN',
            opacity: 1
          }
      );

      etatMajor.addTo(this.map);


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
            html: `<div>
<span>${totalImprimeurs}</span>
</div>`,
            className: `marker-cluster ${sizeClass}`,
            iconSize: L.point(40, 40)
          });
        }
      });
      this.map.addLayer(this.clusterGroup);
    },
    initMapLinks(evt) {
      const link = evt.target.closest?.("a.city-link");
      if (!link) return;

      evt.preventDefault();
      evt.stopImmediatePropagation();

      const cityDil = link.getAttribute("data-city");
      this.$emit("selectCity", cityDil);
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
      const currentSeq = ++this.requestSeq;

      if (this.fetchController) {
        this.fetchController.abort();
      }
      this.fetchController = new AbortController();

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

        url.searchParams.append(
            "exact_patent_date_start",
            filters.exact_patent_date_start ? "true" : "false"
        );

        if (filters.search_head_info) {
          url.searchParams.append("search_head_info", filters.search_head_info);
        }

        if (filters.search_extra_info) {
          url.searchParams.append("search_extra_info", filters.search_extra_info);
        }

        const res = await fetch(url.toString(), {
          signal: this.fetchController.signal
        });

        if (!res.ok) {
          throw new Error(`Erreur API carte: ${res.status}`);
        }

        const cities = await res.json();

        if (currentSeq !== this.requestSeq) return;
        if (!this.clusterGroup) return;

        this.clusterGroup.clearLayers();

        cities.forEach(city => {
          const rawCoords = city.city_long_lat?.replace(/[()]/g, '').split(',').map(Number);
          if (!rawCoords || rawCoords.length !== 2 || rawCoords.some(isNaN)) return;

          let [lat, lon] = rawCoords;
          if (Math.abs(lat) < Math.abs(lon)) [lat, lon] = [lon, lat];

          const nbPrinters = city.persons?.length || 1;
          const hasDicotopo = !!city.city_dicotopo_item_id;

          const popupHtml = `
        <a href="" class="city-link" data-city="${city.city_dil}">
          <span class="city-link-icon">📍</span>
          ${city.city_label}${city.city_dept_label ? ` (${city.city_dept_label})` : ''}
        </a>
        <br/>
        ${nbPrinters} imprimeur(s) - lithographe(s)
        ${
              hasDicotopo
                  ? `
              <br/>
              <span class="dicotopo-link-wrapper">
                <img src="${logoDicotopo}" alt="Logo Dicotopo" width="18" class="dicotopo-logo">
                <a
                  href="https://dicotopo.cths.fr/places/${city.city_dicotopo_item_id}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="dicotopo-link"
                >
                  Accéder à Dicotopo
                </a>
              </span>
            `
                  : ''
          }
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
        if (err.name !== 'AbortError') {
          console.error("Erreur lors du chargement des villes :", err);
        }
      }
    },

  },
  watch: {
    cityQuery() {
      if (this.map) this.updateMap()
    },
    date() {
      if (this.map) this.updateMap()
    },
    exact() {
      if (this.map) this.updateMap()
    },
    searchHeadInfo() {
      if (this.map) this.updateMap()
    },
    searchExtraInfo() {
      if (this.map) this.updateMap()
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
  background-color: #FFFFFFFF;
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