<template>
  <div id="map" style="height: 500px;"></div>
</template>

<script>
import L from 'leaflet'
export default {
  name: 'SearchMap',
  mounted() {
    const map = L.map('map').setView([48.85, 2.35], 5)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)
    map.on('click', e => {
      this.$emit('select-location', e.latlng)
    })
  }
}
</script>
