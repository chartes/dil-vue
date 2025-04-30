const API_BASE = "https://dev.chartes.psl.eu/dil/api";

const map = L.map('map').setView([46.5, 2.5], 6);
L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap',
  maxZoom: 19
}).addTo(map);

async function fetchJSON(url) {
  const response = await fetch(url);
  return await response.json();
}

async function main() {
  const data = await fetchJSON(`${API_BASE}/patents?page=1&size=50`);
  const patents = data.items;

  const cityMap = {};

  for (const patent of patents) {
    const cityId = patent.city_id;
    if (!cityId || cityMap[cityId]) continue;

    const cityData = await fetchJSON(`${API_BASE}/referential/cities/city/${cityId}`);
    cityMap[cityId] = cityData;
    console.log(cityData)

    const coords = cityData.long_lat.replace(/[()]/g, "").split(',').map(Number);
    const lat = coords[1];
    const lng = coords[0];

    const marker = L.marker([lat, lng]).addTo(map);

    marker.bindPopup(`
      <b>${cityData.label}</b><br/>
      Brevet : ${patent._id_dil}<br/>
      Début : ${patent.date_start}<br/>
      <a href="https://dev.chartes.psl.eu/dil/api/patents/patent/${patent._id_dil}?html=true" target="_blank">Voir plus</a>
    `);
  }
}

main();
