<template>
  <div id="map" style="height: 100%; width: 100%"></div>
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
    apiBase: {
      type: String,
      required: true
    }
  },
  emits: ['selectCity'],
  data() {
    return {
      map: null,
      clusterGroup: null,
    };
  },
  mounted() {
    this.initMap();
    this.fetchCities();
  },
  methods: {
    initMap() {
  this.map = L.map('map', {
    attributionControl: false, // Enlève le petit "Leaflet"
    zoomSnap: 0,
    zoomDelta: 1
  }).setView([46.5, 2.5], 6);

  // Créer deux pane pour les couches IGN et OSM
  this.map.createPane('IGN');
  this.map.createPane('OSM');
  this.map.getPane('OSM').style.zIndex = 250;
  this.map.getPane('IGN').style.zIndex = 200;

  // Couches IGN - Cassini et État-Major
  const cassiniLayer = L.tileLayer(
    'https://data.geopf.fr/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&TILEMATRIXSET=PM' +
    '&LAYER=BNF-IGNF_GEOGRAPHICALGRIDSYSTEMS.CASSINI&STYLE=normal&FORMAT=image/png' +
    '&TILECOL={x}&TILEROW={y}&TILEMATRIX={z}', {
      pane: 'IGN',
      minZoom: 6,
      maxZoom: 14
  });

  const etatMajorLayer = L.tileLayer(
    'https://data.geopf.fr/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&TILEMATRIXSET=PM' +
    '&LAYER=GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40&STYLE=normal&FORMAT=image/jpeg' +
    '&TILECOL={x}&TILEROW={y}&TILEMATRIX={z}', {
      pane: 'IGN',
      minZoom: 6,
      maxZoom: 15
  });

  // Couche OSM
  const osmLayer =  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap & CartoDB',
  subdomains: 'abcd',
  maxZoom: 19
});

  osmLayer.addTo(this.map);

  const baseMaps = {
    "Plan actuel (OSM)": osmLayer,
    "Carte de Cassini (XVIIIe)": cassiniLayer,
    "Carte de l'État-Major (XIXe)": etatMajorLayer
  };

  L.control.layers(baseMaps, {}, { position: 'topright' }).addTo(this.map);

  this.clusterGroup = L.markerClusterGroup({
    showCoverageOnHover: false
  });

  this.map.addLayer(this.clusterGroup);
}
,
    async fetchCities() {
      try {
        const res = await fetch(`${this.apiBase}/map/places`);
        const cities = await res.json();

        cities.forEach(city => {
          if (city.city_long_lat) {
            //cityData.long_lat?.replace(/[()]/g, "").split(',').map(Number)
            let coords = city.city_long_lat?.replace(/[()]/g, "").split(',').map(Number);

            // Validation des coordonnées
            if (
                !Array.isArray(coords) ||
                coords.length !== 2 ||
                coords.some(c => isNaN(c)) ||
                Math.abs(coords[0]) > 90 ||
                Math.abs(coords[1]) > 180
            ) {
              console.warn(`Coordonnées invalides pour ${city.city_label}: ${city.city_long_lat}`);
              return;
            }

            let lat = coords[0];
            let lon = coords[1];

            // Correction automatique
            if (Math.abs(lat) < Math.abs(lon)) {
              [lat, lon] = [lon, lat];
            }

            // Vérifie que c'est bien en France
            if (
                lat >= 41 && lat <= 51 &&
                lon >= -5 && lon <= 10
            ) {
              const nbPrinters = city.printer_ids.length;
              const radius = 5 + Math.log(nbPrinters) * 5;

              const marker = L.circleMarker([lat, lon], {
                radius,
                color: 'blue',
                fillColor: 'blue',
                fillOpacity: 0.5
              });

              marker.bindPopup(`
            <b>${city.city_label}</b><br/>
            ${nbPrinters} imprimeur(s) lié(s)
          `);

              marker.on('click', () => {
                this.$emit('selectCity', city.city_label);
              });

              this.clusterGroup.addLayer(marker);
            } else {
              console.warn(`Ville hors France ignorée : ${city.city_label} (${lat}, ${lon})`);
            }
          }
        });

      } catch (error) {
        console.error("Erreur lors du chargement des villes :", error);
      }
    }
  }
};
</script>

<style scoped>
#map {
  height: 100%;
}
</style>
