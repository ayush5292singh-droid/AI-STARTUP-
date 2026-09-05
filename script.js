/* =====================================================
   NEXORA
   LOCAL SERVICE FINDER
   ===================================================== */

const $ = id => document.getElementById(id);


const state = {

  map: null,

  userLocation: null,

  userMarker: null,

  accuracyCircle: null,

  placeMarkers: [],

  places: [],

  searchController: null,

  favourites: JSON.parse(
    localStorage.getItem("nexora_favourites") || "[]"
  ),

  helpers: JSON.parse(
    localStorage.getItem("nexora_helpers") || "[]"
  )

};


/* =====================================================
   ELEMENTS
   ===================================================== */

const elements = {

  pageTitle: $("pageTitle"),

  searchInput: $("searchInput"),

  distanceFilter: $("distanceFilter"),

  availabilityFilter: $("availabilityFilter"),

  resultsList: $("resultsList"),

  resultCount: $("resultCount"),

  mapPlaceCount: $("mapPlaceCount"),

  mapStatus: $("mapStatus"),

  searchStatus: $("searchStatus"),

  statusDot: $("statusDot"),

  sideLocation: $("sideLocation"),

  topLocationText: $("topLocationText"),

  loadingScreen: $("loadingScreen"),

  loadingText: $("loadingText"),

  placeModal: $("placeModal"),

  placeDetails: $("placeDetails"),

  helperModal: $("helperModal"),

  helperForm: $("helperForm"),

  helpersList: $("helpersList"),

  favouritesList: $("favouritesList")

};


/* =====================================================
   PAGE NAVIGATION
   ===================================================== */

function showPage(page) {

  document
    .querySelectorAll(".page")
    .forEach(item => {
      item.classList.remove("active");
    });


  const target = $(`${page}Page`);

  if (target) {
    target.classList.add("active");
  }


  document
    .querySelectorAll(".nav-btn")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page === page
      );

    });


  const titles = {

    home: "Find help near you.",

    explore: "Search real services around you.",

    helpers: "Your trusted helpers.",

    saved: "Your saved places."

  };


  elements.pageTitle.textContent =
    titles[page] || "NEXORA";


  if (page === "explore") {

    setTimeout(() => {

      if (state.map) {
        state.map.invalidateSize();
      }

    }, 250);

  }


  if (page === "helpers") {
    renderHelpers();
  }


  if (page === "saved") {
    renderFavourites();
  }

}


document
  .querySelectorAll(".nav-btn")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => showPage(button.dataset.page)
    );

  });


$("startExploreBtn").addEventListener(
  "click",
  () => {

    showPage("explore");

    if (!state.userLocation) {
      locateUser();
    }

  }
);


$("heroLocateBtn").addEventListener(
  "click",
  () => {

    showPage("explore");

    locateUser();

  }
);


/* =====================================================
   MAP
   ===================================================== */

function initMap() {

  state.map = L.map("map").setView(
    [20.5937, 78.9629],
    5
  );


  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {

      maxZoom: 19,

      attribution:
        "&copy; OpenStreetMap contributors"

    }
  ).addTo(state.map);

}


function createUserIcon() {

  return L.divIcon({

    className: "",

    html:
      `<div class="user-location-marker"></div>`,

    iconSize: [20, 20],

    iconAnchor: [10, 10]

  });

}


function createPlaceIcon() {

  return L.divIcon({

    className: "",

    html:
      `<div class="place-marker">●</div>`,

    iconSize: [28, 28],

    iconAnchor: [14, 14]

  });

}


/* =====================================================
   LOCATION
   ===================================================== */

function locateUser() {

  if (!navigator.geolocation) {

    setStatus(
      "Location is not supported on this device.",
      "error"
    );

    return;

  }


  setStatus(
    "Finding your location...",
    "loading"
  );


  elements.topLocationText.textContent =
    "Locating...";


  navigator.geolocation.getCurrentPosition(

    position => {

      const lat =
        position.coords.latitude;

      const lon =
        position.coords.longitude;

      const accuracy =
        position.coords.accuracy || 50;


      state.userLocation = {

        lat,

        lon,

        accuracy

      };


      updateUserLocationOnMap();


      elements.sideLocation.textContent =
        `${lat.toFixed(4)}, ${lon.toFixed(4)}`;


      elements.topLocationText.textContent =
        "Location ready";


      setStatus(
        "Location ready — choose a service.",
        "ready"
      );


      elements.searchStatus.textContent =
        "Ready to search";


    },


    error => {

      console.error(error);


      let message =
        "Location could not be found.";


      if (error.code === 1) {
        message =
          "Please allow location permission.";
      }

      if (error.code === 2) {
        message =
          "Location is currently unavailable.";
      }

      if (error.code === 3) {
        message =
          "Location request timed out.";
      }


      elements.topLocationText.textContent =
        "Locate me";


      setStatus(message, "error");

    },


    {

      enableHighAccuracy: true,

      timeout: 20000,

      maximumAge: 30000

    }

  );

}


function updateUserLocationOnMap() {

  if (!state.map || !state.userLocation) {
    return;
  }


  const {
    lat,
    lon,
    accuracy
  } = state.userLocation;


  if (state.userMarker) {

    state.map.removeLayer(
      state.userMarker
    );

  }


  if (state.accuracyCircle) {

    state.map.removeLayer(
      state.accuracyCircle
    );

  }


  state.userMarker = L.marker(

    [lat, lon],

    {

      icon: createUserIcon(),

      zIndexOffset: 1000

    }

  )
    .addTo(state.map)
    .bindPopup(
      "<div class='popup-title'>YOU ARE HERE</div>"
    );


  state.accuracyCircle = L.circle(

    [lat, lon],

    {

      radius: accuracy,

      color: "#54f39a",

      fillOpacity: .05,

      weight: 1

    }

  ).addTo(state.map);


  state.map.setView(
    [lat, lon],
    14
  );

}


/* =====================================================
   STATUS
   ===================================================== */

function setStatus(message, type = "") {

  elements.mapStatus.textContent =
    message;


  elements.statusDot.className =
    "status-dot";


  if (type === "ready") {

    elements.statusDot.classList.add(
      "ready"
    );

  }


  if (type === "error") {

    elements.statusDot.classList.add(
      "error"
    );

  }

}


/* =====================================================
   SERVICE DEFINITIONS

   IMPORTANT:
   These use actual OpenStreetMap categories.

   This is much more reliable than searching random
   words inside map tags.
   ===================================================== */

const SERVICES = {

  plumber: [
    ["craft", "plumber"]
  ],

  electrician: [
    ["craft", "electrician"]
  ],

  carpenter: [
    ["craft", "carpenter"]
  ],

  mechanic: [
    ["shop", "car_repair"],
    ["craft", "car_repair"]
  ],

  pharmacy: [
    ["amenity", "pharmacy"],
    ["healthcare", "pharmacy"]
  ],

  hospital: [
    ["amenity", "hospital"],
    ["amenity", "clinic"],
    ["healthcare", "hospital"],
    ["healthcare", "clinic"]
  ],

  hardware: [
    ["shop", "hardware"],
    ["shop", "doityourself"]
  ],

  restaurant: [
    ["amenity", "restaurant"],
    ["amenity", "fast_food"],
    ["amenity", "cafe"]
  ],

  grocery: [
    ["shop", "supermarket"],
    ["shop", "convenience"],
    ["shop", "grocery"]
  ],

  locksmith: [
    ["craft", "locksmith"],
    ["shop", "locksmith"]
  ],

  petrol: [
    ["amenity", "fuel"]
  ],

  police: [
    ["amenity", "police"]
  ],

  fire: [
    ["amenity", "fire_station"]
  ]

};


/* =====================================================
   NORMALIZE SEARCH
   ===================================================== */

function normalizeService(text) {

  const value =
    String(text || "")
      .trim()
      .toLowerCase();


  const aliases = {

    "plumbing": "plumber",

    "electric": "electrician",

    "electrical": "electrician",

    "car repair": "mechanic",

    "auto repair": "mechanic",

    "garage": "mechanic",

    "chemist": "pharmacy",

    "medical": "pharmacy",

    "medicine": "pharmacy",

    "doctor": "hospital",

    "clinic": "hospital",

    "food": "restaurant",

    "grocery store": "grocery",

    "supermarket": "grocery",

    "gas station": "petrol",

    "fuel": "petrol"

  };


  if (aliases[value]) {
    return aliases[value];
  }


  if (SERVICES[value]) {
    return value;
  }


  return value;

}


/* =====================================================
   BUILD OVERPASS QUERY
   ===================================================== */

function buildOverpassQuery(
  searchText,
  radius
) {

  const {
    lat,
    lon
  } = state.userLocation;


  const service =
    normalizeService(searchText);


  let filters = [];


  if (SERVICES[service]) {

    filters = SERVICES[service]
      .map(([key, value]) =>

        `nwr["${key}"="${value}"](around:${radius},${lat},${lon});`

      );

  } else if (service) {

    /*
      Custom search:
      Search place names and common categories.
    */

    const safe =
      escapeOverpassRegex(service);


    filters = [

      `nwr["name"~"${safe}",i](around:${radius},${lat},${lon});`,

      `nwr["amenity"~"${safe}",i](around:${radius},${lat},${lon});`,

      `nwr["shop"~"${safe}",i](around:${radius},${lat},${lon});`,

      `nwr["craft"~"${safe}",i](around:${radius},${lat},${lon});`

    ];

  } else {

    /*
      Empty search = useful nearby places
    */

    filters = [

      `nwr["amenity"](around:${radius},${lat},${lon});`,

      `nwr["shop"](around:${radius},${lat},${lon});`,

      `nwr["craft"](around:${radius},${lat},${lon});`

    ];

  }


  return `
[out:json][timeout:25];

(
${filters.join("\n")}
);

out center tags;
`;

}


function escapeOverpassRegex(value) {

  return String(value)
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

}


/* =====================================================
   SEARCH
   ===================================================== */

async function searchPlaces() {

  if (!state.userLocation) {

    setStatus(
      "Please allow location first.",
      "error"
    );


    locateUser();

    return;

  }


  const searchText =
    elements.searchInput.value.trim();


  const radius =
    Number(elements.distanceFilter.value);


  const availability =
    elements.availabilityFilter.value;


  showLoading(
    "Searching nearby services..."
  );


  elements.searchStatus.textContent =
    "Searching real map data...";


  try {

    if (state.searchController) {

      state.searchController.abort();

    }


    state.searchController =
      new AbortController();


    const query =
      buildOverpassQuery(
        searchText,
        radius
      );


    /*
      Public Overpass servers.
      Try one after another if busy.
    */

    const endpoints = [

      "https://overpass-api.de/api/interpreter",

      "https://overpass.kumi.systems/api/interpreter"

    ];


    let data = null;

    let lastError = null;


    for (const endpoint of endpoints) {

      try {

        const response =
          await fetch(endpoint, {

            method: "POST",

            body: query,

            headers: {
              "Content-Type":
                "text/plain;charset=UTF-8"
            },

            signal:
              state.searchController.signal

          });


        if (!response.ok) {

          throw new Error(
            `Server error ${response.status}`
          );

        }


        const result =
          await response.json();


        if (result.elements) {

          data = result;

          break;

        }

      } catch (error) {

        lastError = error;

      }

    }


    if (!data) {

      throw (
        lastError ||
        new Error("No map server available")
      );

    }


    let places =
      parsePlaces(data.elements);


    places =
      applyAvailabilityFilter(
        places,
        availability
      );


    places.sort(
      (a, b) =>
        a.distance - b.distance
    );


    /*
      Limit results so map stays fast.
    */

    state.places =
      places.slice(0, 60);


    renderMapMarkers();

    renderResults();


    elements.searchStatus.textContent =
      state.places.length
        ? `${state.places.length} services found`
        : "No services found";


  } catch (error) {

    console.error(error);


    if (error.name === "AbortError") {
      return;
    }


    state.places = [];


    clearPlaceMarkers();

    renderResults();


    elements.searchStatus.textContent =
      "Search temporarily unavailable.";


    setStatus(
      "Map server is busy. Try again shortly.",
      "error"
    );

  } finally {

    hideLoading();

  }

}


/* =====================================================
   PARSE RESULTS
   ===================================================== */

function parsePlaces(items) {

  const places = [];

  const seen = new Set();


  for (const item of items) {

    const tags =
      item.tags || {};


    const lat =
      item.lat ??
      item.center?.lat;


    const lon =
      item.lon ??
      item.center?.lon;


    if (
      typeof lat !== "number" ||
      typeof lon !== "number"
    ) {
      continue;
    }


    const id =
      `${item.type}-${item.id}`;


    if (seen.has(id)) {
      continue;
    }


    seen.add(id);


    const name =
      tags.name ||
      tags["name:en"] ||
      prettify(
        tags.craft ||
        tags.shop ||
        tags.amenity ||
        tags.healthcare ||
        "Local Service"
      );


    const distance =
      calculateDistance(

        state.userLocation.lat,

        state.userLocation.lon,

        lat,

        lon

      );


    places.push({

      id,

      name,

      lat,

      lon,

      distance,

      category:
        getCategory(tags),

      opening:
        getOpening(tags),

      address:
        buildAddress(tags),

      phone:
        tags.phone ||
        tags["contact:phone"] ||
        "",

      website:
        tags.website ||
        tags["contact:website"] ||
        ""

    });

  }


  return places;

}


/* =====================================================
   CATEGORY
   ===================================================== */

function getCategory(tags) {

  return prettify(

    tags.craft ||

    tags.shop ||

    tags.amenity ||

    tags.healthcare ||

    "Local Service"

  );

}


function prettify(value) {

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, char =>
      char.toUpperCase()
    );

}


/* =====================================================
   OPENING HOURS
   ===================================================== */

function getOpening(tags) {

  const hours =
    tags.opening_hours;


  if (!hours) {

    return {

      known: false,

      text: "Hours not listed"

    };

  }


  return {

    known: true,

    text: hours

  };

}


function applyAvailabilityFilter(
  places,
  filter
) {

  if (filter === "any") {
    return places;
  }


  if (filter === "known") {

    return places.filter(
      place =>
        place.opening.known
    );

  }


  if (filter === "open") {

    return places.filter(
      place =>
        isPossiblyOpen(
          place.opening
        )
    );

  }


  return places;

}


/*
  Conservative opening-hours check.
*/

function isPossiblyOpen(opening) {

  if (!opening.known) {
    return false;
  }


  const text =
    opening.text.toLowerCase();


  if (text.includes("24/7")) {
    return true;
  }


  if (text.includes("closed")) {
    return false;
  }


  const match =
    text.match(
      /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/
    );


  if (!match) {
    return false;
  }


  const now =
    new Date();


  const current =
    now.getHours() * 60 +
    now.getMinutes();


  const start =
    Number(match[1]) * 60 +
    Number(match[2]);


  const end =
    Number(match[3]) * 60 +
    Number(match[4]);


  if (end < start) {

    return (
      current >= start ||
      current <= end
    );

  }


  return (
    current >= start &&
    current <= end
  );

}


/* =====================================================
   ADDRESS
   ===================================================== */

function buildAddress(tags) {

  const parts = [

    tags["addr:housenumber"],

    tags["addr:street"],

    tags["addr:suburb"],

    tags["addr:city"],

    tags["addr:postcode"]

  ].filter(Boolean);


  if (parts.length) {
    return parts.join(", ");
  }


  return "Exact address not listed.";

}


/* =====================================================
   DISTANCE
   ===================================================== */

function calculateDistance(
  lat1,
  lon1,
  lat2,
  lon2
) {

  const R = 6371;


  const dLat =
    toRadians(lat2 - lat1);


  const dLon =
    toRadians(lon2 - lon1);


  const a =

    Math.sin(dLat / 2) ** 2 +

    Math.cos(toRadians(lat1)) *

    Math.cos(toRadians(lat2)) *

    Math.sin(dLon / 2) ** 2;


  const c =
    2 * Math.atan2(

      Math.sqrt(a),

      Math.sqrt(1 - a)

    );


  return R * c;

}


function toRadians(value) {

  return value *
    Math.PI /
    180;

}


function formatDistance(km) {

  if (km < 1) {

    return `${Math.round(km * 1000)} m`;

  }


  return `${km.toFixed(1)} km`;

}


/* =====================================================
   MAP MARKERS
   ===================================================== */

function clearPlaceMarkers() {

  state.placeMarkers.forEach(
    marker => {

      if (state.map) {
        state.map.removeLayer(marker);
      }

    }
  );


  state.placeMarkers = [];

}


function renderMapMarkers() {

  clearPlaceMarkers();


  state.places.forEach(place => {

    const marker = L.marker(

      [place.lat, place.lon],

      {
        icon: createPlaceIcon()
      }

    ).addTo(state.map);


    marker.bindPopup(
      createPopup(place)
    );


    marker.on(
      "click",
      () => {

        highlightResult(place.id);

      }
    );


    state.placeMarkers.push(marker);

  });


  if (state.places.length) {

    const points = [

      [
        state.userLocation.lat,
        state.userLocation.lon
      ],

      ...state.places.map(place =>

        [place.lat, place.lon]

      )

    ];


    state.map.fitBounds(

      L.latLngBounds(points),

      {

        padding: [35, 35],

        maxZoom: 15

      }

    );

  }


  elements.mapPlaceCount.textContent =
    `${state.places.length} places`;

}


function createPopup(place) {

  return `

    <div class="popup-title">
      ${escapeHTML(place.name)}
    </div>

    <div>
      ${escapeHTML(place.category)}
      <br>
      📍 ${formatDistance(place.distance)}
    </div>

  `;

}


/* =====================================================
   RESULTS
   ===================================================== */

function renderResults() {

  elements.resultCount.textContent =
    `${state.places.length} ${
      state.places.length === 1
        ? "place"
        : "places"
    }`;


  if (!state.places.length) {

    elements.resultsList.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          🔎
        </div>

        <h3>
          No services found
        </h3>

        <p>
          Try increasing the distance or searching
          another service.
        </p>

      </div>

    `;

    return;

  }


  elements.resultsList.innerHTML =
    state.places
      .map(createResultCard)
      .join("");


  document
    .querySelectorAll("[data-place-id]")
    .forEach(card => {

      card.addEventListener(
        "click",
        event => {

          if (
            event.target.closest("button")
          ) {
            return;
          }


          const place =
            state.places.find(

              item =>
                item.id ===
                card.dataset.placeId

            );


          if (place) {
            focusPlace(place);
          }

        }
      );

    });


  document
    .querySelectorAll("[data-action]")
    .forEach(button => {

      button.addEventListener(
        "click",
        event => {

          event.stopPropagation();


          const place =
            state.places.find(

              item =>
                item.id ===
                button.dataset.placeId

            );


          if (!place) {
            return;
          }


          const action =
            button.dataset.action;


          if (action === "details") {
            openPlace(place);
          }


          if (action === "directions") {
            openDirections(place);
          }


          if (action === "save") {
            toggleFavourite(place);
          }

        }
      );

    });

}


function createResultCard(place) {

  const saved =
    isFavourite(place.id);


  const availability =
    place.opening.known
      ? `🕐 ${escapeHTML(place.opening.text)}`
      : "🕐 Hours unavailable";


  return `

    <article
      class="result-card"
      data-place-id="${escapeHTML(place.id)}"
    >

      <div class="result-top">

        <div>

          <div class="result-name">
            ${escapeHTML(place.name)}
          </div>

          <div class="result-type">
            ${escapeHTML(place.category)}
          </div>

        </div>

        <div class="result-distance">
          ${formatDistance(place.distance)}
        </div>

      </div>


      <div class="result-meta">

        ${availability}

        <br>

        📍 ${escapeHTML(place.address)}

      </div>


      <div class="result-actions">

        <button
          data-action="details"
          data-place-id="${escapeHTML(place.id)}"
        >
          DETAILS
        </button>


        <button
          data-action="directions"
          data-place-id="${escapeHTML(place.id)}"
        >
          DIRECTIONS
        </button>


        <button
          data-action="save"
          data-place-id="${escapeHTML(place.id)}"
        >
          ${saved ? "★ SAVED" : "☆ SAVE"}
        </button>

      </div>

    </article>

  `;

}


/* =====================================================
   FOCUS PLACE
   ===================================================== */

function focusPlace(place) {

  showPage("explore");


  state.map.setView(
    [place.lat, place.lon],
    17
  );


  const marker =
    state.placeMarkers.find(item => {

      const position =
        item.getLatLng();


      return (

        Math.abs(
          position.lat - place.lat
        ) < 0.000001

        &&

        Math.abs(
          position.lng - place.lon
        ) < 0.000001

      );

    });


  if (marker) {
    marker.openPopup();
  }


  highlightResult(place.id);

}


function highlightResult(id) {

  document
    .querySelectorAll(".result-card")
    .forEach(card => {

      card.classList.toggle(
        "selected",
        card.dataset.placeId === id
      );

    });

}


/* =====================================================
   PLACE DETAILS
   ===================================================== */

function openPlace(place) {

  const websiteHTML =
    place.website
      ? `<a href="${safeURL(place.website)}"
           target="_blank"
           rel="noopener">
           Open Website
         </a>`
      : "Not listed";


  elements.placeDetails.innerHTML = `

    <div class="eyebrow">
      ${escapeHTML(place.category)}
    </div>

    <h2>
      ${escapeHTML(place.name)}
    </h2>


    <p>
      📍 ${escapeHTML(place.address)}
    </p>


    <div class="detail-grid">

      <div class="detail-box">

        <small>DISTANCE</small>

        <strong>
          ${formatDistance(place.distance)}
        </strong>

      </div>


      <div class="detail-box">

        <small>AVAILABILITY</small>

        <strong>
          ${
            place.opening.known
              ? escapeHTML(place.opening.text)
              : "Not listed"
          }
        </strong>

      </div>


      <div class="detail-box">

        <small>PHONE</small>

        <strong>
          ${
            place.phone
              ? escapeHTML(place.phone)
              : "Not listed"
          }
        </strong>

      </div>


      <div class="detail-box">

        <small>WEBSITE</small>

        <strong>
          ${websiteHTML}
        </strong>

      </div>


      <div class="detail-box">

        <small>EXACT MAP LOCATION</small>

        <strong>
          ${place.lat.toFixed(5)},
          ${place.lon.toFixed(5)}
        </strong>

      </div>

    </div>


    <div class="detail-buttons">

      ${
        place.phone
          ? `
            <button
              class="primary-btn"
              id="detailCall"
            >
              📞 CALL
            </button>
          `
          : ""
      }


      <button
        class="primary-btn"
        id="detailDirections"
      >
        🗺️ DIRECTIONS
      </button>


      <button
        class="secondary-btn"
        id="detailSave"
      >
        ${
          isFavourite(place.id)
            ? "★ SAVED"
            : "☆ SAVE"
        }
      </button>

    </div>

  `;


  elements.placeModal.classList.add("show");


  $("detailDirections").onclick =
    () => openDirections(place);


  $("detailSave").onclick =
    () => {

      toggleFavourite(place);

      openPlace(place);

    };


  const callButton =
    $("detailCall");


  if (callButton) {

    callButton.onclick =
      () => {

        window.location.href =
          `tel:${place.phone}`;

      };

  }

}


/* =====================================================
   DIRECTIONS
   ===================================================== */

function openDirections(place) {

  /*
    Opens exact coordinates in Google Maps.
  */

  const url =
    `https://www.google.com/maps/dir/?api=1` +
    `&destination=${place.lat},${place.lon}`;


  window.open(
    url,
    "_blank"
  );

}


/* =====================================================
   FAVOURITES
   ===================================================== */

function isFavourite(id) {

  return state.favourites.some(
    item => item.id === id
  );

}


function toggleFavourite(place) {

  const index =
    state.favourites.findIndex(
      item => item.id === place.id
    );


  if (index >= 0) {

    state.favourites.splice(
      index,
      1
    );

  } else {

    state.favourites.push(place);

  }


  localStorage.setItem(
    "nexora_favourites",
    JSON.stringify(state.favourites)
  );


  renderResults();

  renderFavourites();

}


function renderFavourites() {

  if (!state.favourites.length) {

    elements.favouritesList.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">★</div>

        <h3>
          No saved places
        </h3>

        <p>
          Save useful services for later.
        </p>

      </div>

    `;

    return;

  }


  elements.favouritesList.innerHTML =
    state.favourites.map(place => `

      <div class="helper-card">

        <h3>
          ${escapeHTML(place.name)}
        </h3>

        <div class="helper-service">
          ${escapeHTML(place.category)}
        </div>

        <p>
          📍 ${escapeHTML(place.address)}
        </p>

        <div class="card-buttons">

          <button
            data-fav-open="${escapeHTML(place.id)}"
          >
            VIEW
          </button>

          <button
            data-fav-remove="${escapeHTML(place.id)}"
          >
            REMOVE
          </button>

        </div>

      </div>

    `).join("");


  document
    .querySelectorAll("[data-fav-open]")
    .forEach(button => {

      button.onclick = () => {

        const place =
          state.favourites.find(

            item =>
              item.id ===
              button.dataset.favOpen

          );


        if (place) {

          showPage("explore");

          focusPlace(place);

          openPlace(place);

        }

      };

    });


  document
    .querySelectorAll("[data-fav-remove]")
    .forEach(button => {

      button.onclick = () => {

        state.favourites =
          state.favourites.filter(

            item =>
              item.id !==
              button.dataset.favRemove

          );


        localStorage.setItem(
          "nexora_favourites",
          JSON.stringify(state.favourites)
        );


        renderFavourites();

      };

    });

}


/* =====================================================
   HELPERS
   ===================================================== */

$("addHelperBtn").onclick =
  () => {

    elements.helperForm.reset();

    elements.helperModal.classList.add(
      "show"
    );

  };


elements.helperForm.addEventListener(
  "submit",
  event => {

    event.preventDefault();


    const helper = {

      id:
        Date.now().toString(),

      name:
        $("helperName").value.trim(),

      service:
        $("helperService").value.trim(),

      phone:
        $("helperPhone").value.trim(),

      area:
        $("helperArea").value.trim(),

      notes:
        $("helperNotes").value.trim()

    };


    state.helpers.push(helper);


    localStorage.setItem(
      "nexora_helpers",
      JSON.stringify(state.helpers)
    );


    closeModal("helperModal");

    renderHelpers();

  }
);


function renderHelpers() {

  const query =
    $("helperSearch")
      .value
      .trim()
      .toLowerCase();


  const helpers =
    state.helpers.filter(helper => {

      const text =
        `${helper.name}
         ${helper.service}
         ${helper.area}`
          .toLowerCase();


      return !query ||
        text.includes(query);

    });


  if (!helpers.length) {

    elements.helpersList.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          👷
        </div>

        <h3>
          ${
            state.helpers.length
              ? "No matching helpers"
              : "No helpers yet"
          }
        </h3>

        <p>
          Add trusted plumbers, electricians
          and other local contacts.
        </p>

      </div>

    `;

    return;

  }


  elements.helpersList.innerHTML =
    helpers.map(helper => `

      <div class="helper-card">

        <h3>
          ${escapeHTML(helper.name)}
        </h3>

        <div class="helper-service">
          ${escapeHTML(helper.service)}
        </div>

        <p>
          📍 ${escapeHTML(
            helper.area || "Area not added"
          )}
        </p>

        ${
          helper.phone
            ? `<p>📞 ${escapeHTML(helper.phone)}</p>`
            : ""
        }

        ${
          helper.notes
            ? `<p>📝 ${escapeHTML(helper.notes)}</p>`
            : ""
        }

        <div class="card-buttons">

          ${
            helper.phone
              ? `
                <button
                  data-helper-call="${escapeHTML(helper.id)}"
                >
                  CALL
                </button>
              `
              : ""
          }

          <button
            data-helper-delete="${escapeHTML(helper.id)}"
          >
            DELETE
          </button>

        </div>

      </div>

    `).join("");


  document
    .querySelectorAll("[data-helper-call]")
    .forEach(button => {

      button.onclick = () => {

        const helper =
          state.helpers.find(

            item =>
              item.id ===
              button.dataset.helperCall

          );


        if (helper?.phone) {

          window.location.href =
            `tel:${helper.phone}`;

        }

      };

    });


  document
    .querySelectorAll("[data-helper-delete]")
    .forEach(button => {

      button.onclick = () => {

        state.helpers =
          state.helpers.filter(

            item =>
              item.id !==
              button.dataset.helperDelete

          );


        localStorage.setItem(
          "nexora_helpers",
          JSON.stringify(state.helpers)
        );


        renderHelpers();

      };

    });

}


$("helperSearch").addEventListener(
  "input",
  renderHelpers
);


/* =====================================================
   CONTROLS
   ===================================================== */

$("searchBtn").onclick =
  searchPlaces;


$("locateBtn").onclick =
  locateUser;


$("topLocateBtn").onclick =
  () => {

    showPage("explore");

    locateUser();

  };


$("mapLocateBtn").onclick =
  () => {

    if (!state.userLocation) {

      locateUser();

      return;

    }


    state.map.setView(

      [
        state.userLocation.lat,
        state.userLocation.lon
      ],

      16

    );

  };


$("clearSearch").onclick =
  () => {

    elements.searchInput.value = "";

    state.places = [];

    clearPlaceMarkers();

    renderResults();

    elements.searchStatus.textContent =
      "Ready";

  };


elements.searchInput.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {
      searchPlaces();
    }

  }
);


document
  .querySelectorAll("[data-search]")
  .forEach(button => {

    button.onclick = () => {

      elements.searchInput.value =
        button.dataset.search;

      showPage("explore");

      if (state.userLocation) {
        searchPlaces();
      } else {
        locateUser();
      }

    };

  });


document
  .querySelectorAll("[data-category]")
  .forEach(button => {

    button.onclick = () => {

      showPage("explore");


      elements.searchInput.value =
        button.dataset.category;


      if (state.userLocation) {

        searchPlaces();

      } else {

        locateUser();

      }

    };

  });


/* =====================================================
   MODALS
   ===================================================== */

function closeModal(id) {

  $(id)?.classList.remove("show");

}


document
  .querySelectorAll("[data-close]")
  .forEach(button => {

    button.onclick = () =>
      closeModal(button.dataset.close);

  });


document
  .querySelectorAll(".modal")
  .forEach(modal => {

    modal.addEventListener(
      "click",
      event => {

        if (event.target === modal) {

          modal.classList.remove("show");

        }

      }
    );

  });


/* =====================================================
   LOADING
   ===================================================== */

function showLoading(text) {

  elements.loadingText.textContent =
    text;

  elements.loadingScreen.classList.add(
    "show"
  );

}


function hideLoading() {

  elements.loadingScreen.classList.remove(
    "show"
  );

}


/* =====================================================
   SAFETY HELPERS
   ===================================================== */

function escapeHTML(value) {

  return String(value ?? "")

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");

}


function safeURL(url) {

  try {

    if (
      !url.startsWith("http")
    ) {
      url = "https://" + url;
    }


    const parsed =
      new URL(url);


    if (

      parsed.protocol === "http:" ||

      parsed.protocol === "https:"

    ) {

      return parsed.href;

    }

  } catch (error) {

    return "#";

  }


  return "#";

}


/* =====================================================
   START APP
   ===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    initMap();

    renderHelpers();

    renderFavourites();


    setTimeout(() => {

      state.map.invalidateSize();

    }, 500);

  }
);
