const fetcher = async () => {
  let url = new URL(
    "https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:kunta4500k&outputFormat=json&srsName=EPSG:4326"
  );
  const promise = await fetch(url);
  const data = await promise.json();
  toMap(data);
};

const toMap = async (data) => {
  let url2 = new URL(
    "https://statfin.stat.fi/PxWeb/sq/4bb2c735-1dc3-4c5e-bde7-2165df85e65f"
  );
  let url3 = new URL(
    "https://statfin.stat.fi/PxWeb/sq/944493ca-ea4d-4fd9-a75c-4975192f7b6e"
  );
  let remain = await immigration(url2, "remain", data);
  let leave = await immigration(url3, "leave", data);
  for (let i = 0; i < data.features.length; i++) {
    data.features[i]["positive"] = remain[i];
    data.features[i]["negative"] = leave[i];
  }
  let map = L.map("map");
  let geoJson = L.geoJSON(data, {
    weight: 2,
    onEachFeature: getFeature,
    style: getStyle
  }).addTo(map);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    minZoom: -3,
    attribution: "© OpenStreetMap"
  }).addTo(map);
  map.fitBounds(geoJson.getBounds());
};
const getFeature = (feature, layer) => {
  if (!feature.properties.nimi) return;
  const name = feature.properties.nimi;
  const positive = feature.positive;
  const negative = feature.negative;
  layer.bindTooltip(
    `<ul>  
    <li>${name}</li>
    </ul>`
  );
  layer.bindPopup(
    `<ul>
  <li>${name}</li>  

  <li>${positive}</li>  
  <li>${negative}</li>
  </ul>`
  );
};
const immigration = async (url, x, data2) => {
  const ryhma2 = [];
  const promise = await fetch(url);
  const data = await promise.json();
  if (x === "remain") {
    let keys = Object.keys(data.dataset.dimension.Tuloalue.category.index);
    let keys2 = keys.sort();
    for (let i = 0; i < data2.features.length; i++) {
      ryhma2[i] =
        data.dataset.value[
          data.dataset.dimension.Tuloalue.category.index[keys2[i]]
        ];
    }
  } else {
    let keys = Object.keys(data.dataset.dimension.Lähtöalue.category.index);
    let keys2 = keys.sort();
    for (let i = 0; i < data2.features.length; i++) {
      ryhma2[i] =
        data.dataset.value[
          data.dataset.dimension.Lähtöalue.category.index[keys2[i]]
        ];
    }
  }

  return ryhma2;
};
const getStyle = (feature) => {
  return {
    color: `hsl(${hue_cac(feature.positive, feature.negative)}, 75%, 50%)`
  };
};
const hue_cac = (plus, minus) => {
  let hue = (plus / minus) ** 3 * 60;
  if (hue >= 120) {
    hue = 120;
  }
  return hue;
};
fetcher();
