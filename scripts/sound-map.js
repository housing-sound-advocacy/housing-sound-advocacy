// Code to stick in leaflet map to add sounds

fetch('https://housing-sound-advocacy.azurewebsites.net/sound-list').then((response) => {
  return response.json();
}).then((json) => {
  json.forEach((sound) => {
    const url = sound.url;
    const lat = sound.latitude;
    const lng = sound.longitude;
    const description = sound.description;
    const popup = L.popup().setContent(`<audio controls><source src="${url}" type="audio/mpeg" /></audio><p>${description}</p>`);
    const marker = L.marker(
      [lat, lng],
    ).bindPopup(popup).addTo(mymap);
    marker.on('click', function (_ev) { marker.openPopup([lat, lng]); });
  });
});

