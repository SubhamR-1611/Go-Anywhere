let userLat, userLon;

document.getElementById("getLocationBtn").addEventListener("click", getLocation);

function getLocation() {
  const output = document.getElementById("locationOutput");

  if (!navigator.geolocation) {
    output.innerHTML = "❌ Geolocation is not supported by your browser.";
    return;
  }

  output.innerHTML = "📍 Detecting your location...";
  navigator.geolocation.getCurrentPosition(showPosition, showError);
}

function showPosition(position) {
  userLat = position.coords.latitude;
  userLon = position.coords.longitude;

  const output = document.getElementById("locationOutput");
  output.innerHTML = `
    ✅ Location Access Granted!<br>
    <strong>Latitude:</strong> ${userLat.toFixed(5)}<br>
    <strong>Longitude:</strong> ${userLon.toFixed(5)}<br><br>
    🌍 Loading map...
  `;

  const mapDiv = document.getElementById("map");
  mapDiv.style.display = "block";

  // Initialize map
  const map = L.map("map").setView([userLat, userLon], 14);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  L.marker([userLat, userLon]).addTo(map)
    .bindPopup("📍 You are here!")
    .openPopup();

  document.getElementById("searchSection").style.display = "block";

  document.getElementById("searchBtn").addEventListener("click", () => {
    searchNearbyPlaces(map);
  });
}

function searchNearbyPlaces(map) {
  const type = document.getElementById("placeType").value;
  const listDiv = document.getElementById("placesList");

  if (!type) {
    alert("Please select a place type!");
    return;
  }

  listDiv.innerHTML = "🔍 Searching nearby " + type + "s...";

  // Nominatim API call (OpenStreetMap)
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${type}&addressdetails=1&limit=50&bounded=1&viewbox=${userLon-0.2},${userLat+0.2},${userLon+0.2},${userLat-0.2}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.length === 0) {
        listDiv.innerHTML = "❌ No nearby places found.";
        return;
      }

      // Calculate distance & sort
      data.forEach(p => {
        p.distance = haversine(userLat, userLon, parseFloat(p.lat), parseFloat(p.lon));
      });

      data.sort((a, b) => a.distance - b.distance);

      listDiv.innerHTML = "<h3>📍 Nearby " + type + "s:</h3>";
      data.slice(0, 20).forEach(place => {
        const gmapLink = `https://www.google.com/maps?q=${place.lat},${place.lon}`;
        listDiv.innerHTML += `
          <div class="place-item">
            <strong>${place.display_name.split(",")[0]}</strong><br>
            Distance: ${place.distance.toFixed(2)} km<br>
            <a href="${gmapLink}" target="_blank">View on Google Maps</a>
          </div>
        `;

        L.marker([place.lat, place.lon]).addTo(map)
          .bindPopup(place.display_name.split(",")[0]);
      });
    })
    .catch(() => {
      listDiv.innerHTML = "⚠️ Error fetching places. Try again later.";
    });
}

function showError(error) {
  const output = document.getElementById("locationOutput");
  switch (error.code) {
    case error.PERMISSION_DENIED:
      output.innerHTML = "❌ User denied location access.";
      break;
    case error.POSITION_UNAVAILABLE:
      output.innerHTML = "⚠️ Location unavailable.";
      break;
    case error.TIMEOUT:
      output.innerHTML = "⏳ Request timed out.";
      break;
    default:
      output.innerHTML = "❌ Unknown error.";
  }
}

// Haversine distance formula
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
