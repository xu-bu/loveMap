<template>
  <div class="gaode-map-container">
    <!-- Map Container -->
    <div class="map-wrapper">
      <!-- Loading -->
      <div v-if="loading || loadingSpots" class="loading-overlay">
        <div class="loading-content">
          <div class="spinner"></div>
          <span>{{ getLoadingMessage() }}</span>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- Map -->
      <div id="gaode-map" class="map-container"></div>

      <!-- Floating Search Bar -->
      <div class="floating-search">
        <input ref="searchInput" v-model="searchQuery" type="text" placeholder="搜索地点 (Search for places...)"
          class="search-input" @input="onSearchInput" @focus="onSearchFocus" @blur="onSearchBlur"
          @keydown="handleKeyDown" />

        <!-- Search Suggestions Dropdown -->
        <div v-if="showSuggestions && suggestions.length > 0" class="suggestions-dropdown">
          <div v-for="(suggestion, index) in suggestions" :key="index"
            :class="['suggestion-item', { selected: selectedIndex === index }]"
            @mousedown.prevent="selectSuggestion(suggestion)" @mouseenter="selectedIndex = index">
            <span class="suggestion-icon">📍</span>
            <div class="suggestion-text">
              <div class="suggestion-name">{{ suggestion.name }}</div>
              <div class="suggestion-address">{{ suggestion.district }}</div>
            </div>
            <button @click.stop="createLoveSpotFromSuggestion(suggestion)" class="create-spot-btn"
              title="Create Love Spot">
              ❤️
            </button>
          </div>
        </div>
      </div>

      <!-- Floating Control Buttons -->
      <div class="floating-controls">
        <button @click="getCurrentLocation" class="control-btn primary">
          📍
        </button>
        <button @click="searchNearby" class="control-btn">
          🔍
        </button>
        <button @click="clearSearch" class="control-btn">
          🗑️
        </button>
      </div>

      <!-- Info Panel -->
      <div v-if="selectedPlace" class="info-panel">
        <div class="info-title">{{ selectedPlace.name }}</div>
        <div class="info-details">
          <div v-if="selectedPlace.address">📍 {{ selectedPlace.address }}</div>
          <div v-if="selectedPlace.tel">📞 {{ selectedPlace.tel }}</div>
          <div v-if="selectedPlace.type">🏷️ {{ selectedPlace.type }}</div>
          <div v-if="selectedPlace.distance">📏 {{ selectedPlace.distance }}m away</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, onActivated } from "vue";
import { GaodePOI, SelectedPlace } from "../types/gaode";
import type { LocationData } from "../types/db";
import "../assets/styles/gaodeMap.css";
import { useRouter } from "vue-router";
import { useMap } from "../composables/mapView";
import { GAODE_SEARCH_NEARBY_RADIUS, MAP_ZOOM_LEVEL, IS_APP } from '../consts'
import { log } from "@/utils/logger";
import { loadGaodeAPI, isGaodeAPIReady, createMapPlugins } from "../composables/gaodeMap";

const router = useRouter();

// Use the map composable
const location = ref<{ lat: number; lng: number } | null>(null);
const {
  loveSpots,
  loadingSpots,
  loadLoveSpots,
  handleLoveSpotClick,
  truncateText,
  formatDate
} = useMap(location);

// Reactive data
const loading = ref(true);
const error = ref("");
const searchQuery = ref("");
const suggestions = ref<GaodePOI[]>([]);
const showSuggestions = ref(false);
const selectedIndex = ref(-1);
const selectedPlace = ref<SelectedPlace | null>(null);
const searchInput = ref<HTMLInputElement>();

// Map and plugin instances
let map: any = null;
let plugins: any = {};
let currentLocationMarker: any = null;
let searchMarkers: any[] = [];
let loveSpotMarkers: any[] = [];

let searchTimeout: NodeJS.Timeout | null = null;
let pressTimer: number | null = null;

// Loading state management
const getLoadingMessage = () => {
  if (loading.value) {
    return isGaodeAPIReady() ? 'Initializing map...' : 'Loading Gaode Maps API...';
  }
  return 'Loading Love Spots...';
};

// Fast initialization for returning users
const initMap = async () => {
  try {
    loading.value = true;

    // Get AMap instance (either cached or freshly loaded)
    const AMap = await loadGaodeAPI();

    // Create map instance (always needed per component)
    map = new AMap.Map("gaode-map", {
      zoom: MAP_ZOOM_LEVEL,
      center: [116.397428, 39.90923], // Beijing, if no center set, will auto locate
      mapStyle: "amap://styles/normal",
      viewMode: "3D",
      clickableIcons: true,
      keyboardShortcuts: true,
    });

    // Initialize plugins (reusable function)
    plugins = createMapPlugins(map, AMap);

    // Set up event listeners
    setupEventListeners();

    console.log("✅ Map initialized quickly");
    loading.value = false;
  } catch (err) {
    console.error("❌ Failed to initialize map:", err);
    error.value = "Failed to load Gaode Maps. Please check your API key.";
    loading.value = false;
  }
};

// Load and display love spots (should happen every time)
const refreshLoveSpots = async () => {
  try {
    await loadLoveSpots();
    displayLoveSpots();
    console.log("✅ Love spots refreshed");
  } catch (err) {
    console.error("❌ Failed to load love spots:", err);
    error.value = "Failed to load love spots";
  }
};

// Display love spots on the map
const displayLoveSpots = () => {
  if (!map) return;

  // Clear existing love spot markers
  loveSpotMarkers.forEach((marker) => map.remove(marker));
  loveSpotMarkers = [];

  loveSpots.value.forEach((loveSpot: LocationData) => {
    const marker = new window.AMap.Marker({
      position: [loveSpot.coordinates.lng, loveSpot.coordinates.lat],
      content: `<div style="background: #ff69b4; color: white; padding: 8px; border-radius: 50%; font-size: 20px; border: 2px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">❤️</div>`,
      anchor: "center",
    });

    const infoWindow = new window.AMap.InfoWindow({
      content: `
        <div style="padding: 12px; max-width: 250px;">
          <h3 style="margin: 0 0 8px 0; color: #ff69b4;">${loveSpot.address}</h3>
          <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${truncateText(loveSpot.content || '', 100)}</p>
          <div style="color: #999; font-size: 12px; margin-bottom: 8px;">
            📍 ${loveSpot.address || 'Unknown location'}<br>
            📅 ${formatDate(loveSpot.created_at)}
          </div>
        </div>
      `,
      anchor: "bottom-center",
      offset: [0, -35],
    });

    marker.on("click", () => {
      infoWindow.open(map, [loveSpot.coordinates.lng, loveSpot.coordinates.lat]);
      handleLoveSpotClick(loveSpot);
    });

    map.add(marker);
    loveSpotMarkers.push(marker);
  });
};

// Setup event listeners
const setupEventListeners = () => {
  const { autoComplete, placeSearch, geocoder } = plugins;

  // AutoComplete events
  autoComplete.on("select", (e: any) => {
    const poi = e.poi;
    if (poi && poi.location) {
      selectSuggestionFromAutocomplete(poi);
    }
  });

  // PlaceSearch events
  placeSearch.on("selectChanged", (e: any) => {
    const poi = e.selected.data;
    if (poi) {
      showPlaceDetails(poi);
    }
  });

  // Long press handlers for creating love spots
  if (IS_APP) {
    // Touch events for mobile
    map.on("touchstart", (e: any) => {
      pressTimer = window.setTimeout(() => {
        const { lng, lat } = e.lnglat;
        router.push({ path: "/createLoveSpot", query: { lat, lng } });
      }, 800);
    });

    map.on("touchend", () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    });

    map.on("touchmove", () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    });
  } else {
    map.on("mousedown", (e: any) => {
      pressTimer = window.setTimeout(() => {
        const { lng, lat } = e.lnglat;
        geocoder.getAddress([lng, lat], (status, result) => {
          const address = status === "complete" && result.info === "OK"
            ? result.regeocode.formattedAddress
            : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          log(address)
        })
        router.push({ path: "/createLoveSpot", query: { lat, lng, origin: "gaode" }, state: { geocoder } });
      }, 800);
    });

    map.on("mouseup", () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    });

    map.on("mouseout", () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    });
  }
};

// Handle search input with debouncing
const onSearchInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  selectedIndex.value = -1;

  if (!searchQuery.value.trim()) {
    suggestions.value = [];
    showSuggestions.value = false;
    return;
  }

  searchTimeout = setTimeout(() => {
    performAutoComplete();
  }, 300);
};

// Perform autocomplete search
const performAutoComplete = () => {
  const { autoComplete } = plugins;
  if (!autoComplete || !searchQuery.value.trim()) return;

  autoComplete.search(searchQuery.value, (status: string, result: any) => {
    if (status === "complete" && result.tips) {
      const tips = result.tips
        .filter((tip: any) => tip.location)
        .slice(0, 8)
        .map((tip: any) => ({
          id: tip.id,
          name: tip.name,
          district: tip.district || tip.address,
          address: tip.address,
          location: tip.location,
          type: tip.typecode,
          tel: tip.tel,
        }));

      suggestions.value = tips;
      showSuggestions.value = tips.length > 0;
    } else {
      suggestions.value = [];
      showSuggestions.value = false;
    }
  });
};

// Create love spot from suggestion
const createLoveSpotFromSuggestion = (suggestion: GaodePOI) => {
  log(suggestion)
  const { lng, lat } = suggestion.location;
  router.push({
    path: "/createLoveSpot",
    query: {
      lat,
      lng,
      address: suggestion.address || suggestion.name,
      name: suggestion.name
    }
  });
};

// Select suggestion from dropdown
const selectSuggestion = (suggestion: GaodePOI) => {
  searchQuery.value = suggestion.name;
  showSuggestions.value = false;
  selectedPlace.value = {
    name: suggestion.name,
    address: suggestion.address,
    tel: suggestion.tel,
    type: suggestion.type,
  };

  if (suggestion.location) {
    const { lng, lat } = suggestion.location;
    map.setCenter([lng, lat]);
    map.setZoom(16);
    addMarker([lng, lat], "🔍", suggestion.name, suggestion.address);
  }
};

// Select suggestion from autocomplete event
const selectSuggestionFromAutocomplete = (poi: any) => {
  searchQuery.value = poi.name;
  showSuggestions.value = false;

  selectedPlace.value = {
    name: poi.name,
    address: poi.address,
    tel: poi.tel,
    type: poi.type,
  };

  const { lng, lat } = poi.location;
  map.setCenter([lng, lat]);
  map.setZoom(16);
  addMarker([lng, lat], "🔍", poi.name, poi.address);
};

// Show place details
const showPlaceDetails = (poi: any) => {
  selectedPlace.value = {
    name: poi.name,
    address: poi.address,
    tel: poi.tel,
    type: poi.type,
    distance: poi.distance,
  };
};

// Add marker to map with create love spot button
const addMarker = (
  position: [number, number],
  content: string,
  title: string,
  address?: string
) => {
  // Clear existing search markers
  searchMarkers.forEach((marker) => map.remove(marker));
  searchMarkers = [];

  const marker = new window.AMap!.Marker({
    position: position,
    content: `<div style="background: white; padding: 8px; border-radius: 50%; font-size: 20px; border: 2px solid #667eea; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">${content}</div>`,
    anchor: "center",
  });

  // Add info window with create love spot button
  const infoWindow = new window.AMap!.InfoWindow({
    content: `
      <div style="padding: 12px; max-width: 250px;">
        <strong>${title}</strong>
        ${address ? `<br><small style="color: #666;">${address}</small>` : ''}
        <div style="margin-top: 10px;">
          <button 
            onclick="window.createLoveSpotFromMarker(${position[1]}, ${position[0]}, '${encodeURIComponent(address || title)}', '${encodeURIComponent(title)}')"
            style="background: #ff69b4; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 14px;">
            ❤️ Create Love Spot
          </button>
        </div>
      </div>
    `,
    anchor: "bottom-center",
    offset: [0, -35],
  });

  marker.on("click", () => {
    infoWindow.open(map, position);
  });

  map.add(marker);
  searchMarkers.push(marker);
};

// Global function for info window button
(window as any).createLoveSpotFromMarker = (lat: number, lng: number, address: string, name: string) => {
  router.push({
    path: "/createLoveSpot",
    query: {
      lat,
      lng,
      address: decodeURIComponent(address),
      name: decodeURIComponent(name)
    }
  });
};

// Get current location using Geolocation plugin
const getCurrentLocation = () => {
  const { geolocation } = plugins;
  if (!geolocation) return;

  geolocation.getCurrentPosition((status: string, result: any) => {
    if (status === "complete") {
      const { lng, lat } = result.position;

      // Remove existing current location marker
      if (currentLocationMarker) {
        map.remove(currentLocationMarker);
      }

      // Add current location marker
      currentLocationMarker = new window.AMap!.Marker({
        position: [lng, lat],
        content: `<div style="background: #4285f4; color: white; padding: 10px; border-radius: 50%; font-size: 16px; border: 3px solid white; box-shadow: 0 2px 15px rgba(0,0,0,0.3);">📍</div>`,
        anchor: "center",
      });

      map.add(currentLocationMarker);
      map.setCenter([lng, lat]);
      map.setZoom(15);

      selectedPlace.value = {
        name: "Current Location",
        address:
          result.formattedAddress ||
          `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
      };
    } else {
      error.value = "Unable to get current location";
      setTimeout(() => (error.value = ""), 3000);
    }
  });
};

// Search nearby POIs using PlaceSearch
const searchNearby = () => {
  const { placeSearch } = plugins;
  if (!placeSearch || !map) return;

  const center = map.getCenter();

  placeSearch.searchNearBy(
    "",
    [center.lng, center.lat],
    GAODE_SEARCH_NEARBY_RADIUS,
    (status: string, result: any) => {
      if (status === "complete" && result.poiList && result.poiList.pois) {
        // Clear existing markers
        searchMarkers.forEach((marker) => map.remove(marker));
        searchMarkers = [];

        // Add markers for nearby POIs
        result.poiList.pois.slice(0, 10).forEach((poi: any, index: number) => {
          const { lng, lat } = poi.location;
          const marker = new window.AMap.Marker({
            position: [lng, lat],
            content: `<div style="background: #ff6b6b; color: white; padding: 6px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${index + 1}</div>`,
            anchor: "center",
          });

          const infoWindow = new window.AMap.InfoWindow({
            content: `
              <div style="padding: 12px; max-width: 200px;">
                <strong>${poi.name}</strong><br>
                <small style="color: #666;">${poi.address}</small><br>
                ${poi.tel ? `<small style="color: #666;">📞 ${poi.tel}</small><br>` : ""}
                <small style="color: #999;">Distance: ${poi.distance}m</small>
                <div style="margin-top: 10px;">
                  <button 
                    onclick="window.createLoveSpotFromMarker(${lat}, ${lng}, '${encodeURIComponent(poi.address || poi.name)}', '${encodeURIComponent(poi.name)}')"
                    style="background: #ff69b4; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    ❤️ Create Love Spot
                  </button>
                </div>
              </div>
            `,
            anchor: "bottom-center",
            offset: [0, -35],
          });

          marker.on("click", () => {
            infoWindow.open(map, [lng, lat]);
            selectedPlace.value = {
              name: poi.name,
              address: poi.address,
              tel: poi.tel,
              type: poi.type,
              distance: poi.distance,
            };
          });

          map.add(marker);
          searchMarkers.push(marker);
        });
      }
    }
  );
};

// Clear search and markers
const clearSearch = () => {
  searchQuery.value = "";
  suggestions.value = [];
  showSuggestions.value = false;
  selectedPlace.value = null;
  selectedIndex.value = -1;

  // Clear search markers
  searchMarkers.forEach((marker) => map.remove(marker));
  searchMarkers = [];

  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
};

// Handle search focus
const onSearchFocus = () => {
  if (searchQuery.value && suggestions.value.length > 0) {
    showSuggestions.value = true;
  }
};

// Handle search blur
const onSearchBlur = () => {
  setTimeout(() => {
    showSuggestions.value = false;
  }, 150);
};

// Handle keyboard navigation
const handleKeyDown = (event: KeyboardEvent) => {
  if (!showSuggestions.value || suggestions.value.length === 0) return;

  switch (event.key) {
    case "ArrowDown":
      event.preventDefault();
      selectedIndex.value = Math.min(
        selectedIndex.value + 1,
        suggestions.value.length - 1
      );
      break;
    case "ArrowUp":
      event.preventDefault();
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1);
      break;
    case "Enter":
      event.preventDefault();
      if (selectedIndex.value >= 0) {
        selectSuggestion(suggestions.value[selectedIndex.value]);
      }
      break;
    case "Escape":
      showSuggestions.value = false;
      selectedIndex.value = -1;
      searchInput.value?.blur();
      break;
  }
};

// Lifecycle hooks
onMounted(() => {
  nextTick(async () => {
    if (!map) await initMap();
    // Always refresh love spots
    await refreshLoveSpots();
  });
});

// For keep-alive components - refresh love spots when activated
onActivated(async () => {
  if (map) {
    console.log("onActivated")
    console.log("📱 Component activated - refreshing love spots");
    await refreshLoveSpots();
  }
});

onUnmounted(() => {
  // Cleanup
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  if (pressTimer) {
    clearTimeout(pressTimer);
    pressTimer = null;
  }

  // Destroy map instance
  if (map) {
    map.destroy();
    map = null;
  }

  // Clean up global function
  delete (window as any).createLoveSpotFromMarker;
});

// Expose methods for parent components
defineExpose({
  map,
  getCurrentLocation,
  searchNearby,
  loveSpots,
  displayLoveSpots,
  clearSearch,
  refreshLoveSpots,
});
</script>