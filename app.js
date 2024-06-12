// app.js

// Harita oluşturma
var mymap = L.map('mapid').setView([20, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mymap);

// JSON dosyalarını yükleme
let countryCoords = [];
let migrationData = [];
let chart; // Global chart instance

fetch('kordinat.json')
  .then(response => response.json())
  .then(data => {
    countryCoords = data;
    fetch('goc.json')
      .then(response => response.json())
      .then(data => {
        migrationData = data;
        addCountryMarkers(countryCoords, migrationData);
      });
  });

function addCountryMarkers(countryCoords, migrationData) {
  countryCoords.forEach(country => {
    const marker = L.marker([country.latitude, country.longitude])
      .addTo(mymap)
      .bindPopup(createPopupContent(country, migrationData));

    marker.on('click', function () {
      console.log(`${country.Country} marker'ına tıklandı!`);
      drawConnections(country.Country, countryCoords, migrationData);
      drawChart(country.Country, migrationData); // Chart'ı güncelle
    });
  });
}

function createPopupContent(country, migrationData) {
  const countryName = country.Country;
  // Ülkenin göç verdiği ülkeleri ve değerleri al
  const migrationInfo = migrationData.filter(data => data["Country of birth/nationality"] === countryName);

  console.log(`Migration info for ${countryName}:`, migrationInfo);

  let content = `<h1>${countryName}</h1>`;
  if (migrationInfo.length > 0) {
    content += `<h3>Migration Data</h3><ul>`;
    // En yüksek `Value` değerine sahip 5 ülkeyi seç
    migrationInfo.sort((a, b) => b.Value - a.Value).slice(0, 5).forEach(info => {
      content += `<li>${info.Country}: ${info.Year} - ${info.Value}</li>`;
    });
    content += `</ul>`;
  } else {
    content += `<p>No migration data available.</p>`;
  }

  return content;
}

function drawConnections(countryName, countryCoords, migrationData) {
  // Bu fonksiyon, haritada polylineleri ve markerları çizer.
  const year = document.getElementById("yearInput").value;
  const connections = migrationData
    .filter(data => data["Country of birth/nationality"] === countryName && data.Year === year)
    .sort((a, b) => b.Value - a.Value) // En yüksek göç verisinden en düşüğüne doğru sıralama
    .slice(0, 10); // En yüksek 10 ülkeyi seçme

  console.log(`Connections for ${countryName} in ${year}:`, connections);

  connections.forEach(connection => {
    const destCountry = countryCoords.find(country => country.Country === connection.Country);
    if (destCountry) {
      const latlngs = [
        [countryCoords.find(country => country.Country === countryName).latitude, countryCoords.find(country => country.Country === countryName).longitude],
        [destCountry.latitude, destCountry.longitude]
      ];
      const polyline = L.polyline(latlngs, { color: 'red' }).addTo(mymap);

      // Hedef ülkeye bir marker ekleyin
      const marker = L.marker([destCountry.latitude, destCountry.longitude])
        .addTo(mymap)
        .bindPopup(createPopupContentForConnection(connection));

      marker.on('click', function () {
        console.log(`${destCountry.Country} marker'ına tıklandı!`);
        drawConnections(destCountry.Country, countryCoords, migrationData);
        drawChart(destCountry.Country, migrationData); // Chart'ı güncelle
      });
    }
  });
}

function createPopupContentForConnection(connection) {
  const countryName = connection.Country;
  const countryOfBirth = connection["Country of birth/nationality"];
  const year = connection.Year;
  const value = connection.Value;

  let content = `<h1>${countryName}</h1>`;
  content += `<h3>Migration Data</h3><ul>`;
  content += `<li>${countryOfBirth} - ${year}: ${value}</li>`;
  content += `</ul>`;

  return content;
}

function drawChart(countryName, migrationData) {
  const ctx = document.getElementById('myChart').getContext('2d');
  const year = document.getElementById("yearInput").value;
  const data = migrationData.filter(data => data["Country of birth/nationality"] === countryName && data.Year === year).slice(0, 10);

  if (chart) {
    chart.destroy(); // Mevcut grafiği yok et
  }

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.Year),
      datasets: [{
        label: `Migration from ${countryName}`,
        data: data.map(d => d.Value),
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        backgroundColor: 'red', // Çizginin altındaki alanın arka plan rengi
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function findCountry() {
  const countryName = document.getElementById("countryInput").value;
  const country = countryCoords.find(c => c.Country.toLowerCase() === countryName.toLowerCase());
  if (country) {
    const marker = L.marker([country.latitude, country.longitude]).addTo(mymap);
    marker.bindPopup(createPopupContent(country, migrationData)).openPopup();
    marker.on('click', function () {
      console.log(`${country.Country} marker'ına tıklandı!`);
      drawConnections(country.Country, countryCoords, migrationData);
      drawChart(country.Country, migrationData); // Chart'ı güncelle
    });
  } else {
    alert("Ülke bulunamadı!");
  }
}

function filterByYear() {
  const year = document.getElementById("yearInput").value;
  if (year) {
    const filteredData = migrationData.filter(data => data.Year === year);
    mymap.eachLayer(function (layer) {
      if (!!layer.toGeoJSON) {
        mymap.removeLayer(layer);
      }
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mymap);
    addCountryMarkers(countryCoords, filteredData);
  } else {
    alert("Lütfen bir yıl girin!");
  }
}
