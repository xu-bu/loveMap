<template>
  <div class="gaode-map-container">
    <!-- Header -->
    <div class="header">
      <h1>🗺️ Gaode Maps Plugin Demo</h1>
    </div>

    <!-- Control Panel -->
    <div class="control-panel">
      <div class="search-container">
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          placeholder="搜索地点 (Search for places...)"
          class="search-input"
          @input="onSearchInput"
          @focus="onSearchFocus"
          @blur="onSearchBlur"
          @keydown="handleKeyDown"
        />

        <!-- Search Suggestions Dropdown -->
        <div
          v-if="showSuggestions && suggestions.length > 0"
          class="suggestions-dropdown"
        >
          <div
            v-for="(suggestion, index) in suggestions"
            :key="index"
            :class="['suggestion-item', { selected: selectedIndex === index }]"
            @mousedown.prevent="selectSuggestion(suggestion)"
            @mouseenter="selectedIndex = index"
          >
            <span class="suggestion-icon">📍</span>
            <div class="suggestion-text">
              <div class="suggestion-name">{{ suggestion.name }}</div>
              <div class="suggestion-address">{{ suggestion.district }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="button-group">
        <button @click="getCurrentLocation" class="btn btn-primary">
          📍 Current Location
        </button>
        <button @click="searchNearby" class="btn btn-secondary">
          🔍 Nearby POIs
        </button>
        <button @click="clearSearch" class="btn btn-secondary">🗑️ Clear</button>
        <button @click="toggleToolbar" class="btn btn-secondary">
          🔧 Toggle Toolbar
        </button>
        <button @click="toggleScale" class="btn btn-secondary">
          📏 Toggle Scale
        </button>
      </div>
    </div>

    <!-- Map Container -->
    <div class="map-wrapper">
      <div v-if="loading" class="loading-overlay">
        <div class="loading-content">
          <div class="spinner"></div>
          <span>Loading Gaode Maps...</span>
        </div>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <div id="gaode-map" class="map-container"></div>

      <!-- Info Panel -->
      <div v-if="selectedPlace" class="info-panel">
        <div class="info-title">{{ selectedPlace.name }}</div>
        <div class="info-details">
          <div v-if="selectedPlace.address">📍 {{ selectedPlace.address }}</div>
          <div v-if="selectedPlace.tel">📞 {{ selectedPlace.tel }}</div>
          <div v-if="selectedPlace.type">🏷️ {{ selectedPlace.type }}</div>
          <div v-if="selectedPlace.distance">
            📏 {{ selectedPlace.distance }}m away
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { GaodePOI, SelectedPlace, AMapInstance } from "../types/gaode";
import "../assets/styles/gaodeMap.css";

// declare global {
//   interface Window {
//     AMap: any
//     _AMapSecurityConfig: {
//       securityJsCode: string
//     }
//   }
// }

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
let autoComplete: any = null;
let placeSearch: any = null;
let toolbar: any = null;
let scale: any = null;
let geolocation: any = null;
let currentLocationMarker: any = null;
let searchMarkers: any[] = [];

// Configuration - Replace with your actual API keys
const GAODE_API_KEY =
  import.meta.env.VITE_GAODE_API_KEY || "YOUR_GAODE_API_KEY";
const GAODE_SECURITY_CODE =
  import.meta.env.VITE_GAODE_SECURITY_CODE || "YOUR_SECURITY_CODE";

let searchTimeout: NodeJS.Timeout | null = null;

// Load Gaode Maps API with plugins
const loadGaodeAPI = (): Promise<AMapInstance> => {
  return new Promise((resolve, reject) => {
    if (window.AMap) {
      resolve(window.AMap as AMapInstance);
      return;
    }

    // Set security config
    window._AMapSecurityConfig = {
      securityJsCode: GAODE_SECURITY_CODE,
    };

    const script = document.createElement("script");
    // Load with multiple plugins synchronously
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${GAODE_API_KEY}&plugin=AMap.AutoComplete,AMap.PlaceSearch,AMap.ToolBar,AMap.Scale,AMap.Geolocation`;
    script.async = true;
    script.onload = () => resolve(window.AMap as AMapInstance);
    script.onerror = () => reject(new Error("Failed to load Gaode Maps API"));
    document.head.appendChild(script);
  });
};

// Initialize map and plugins
const initMap = async () => {
  try {
    const AMap = await loadGaodeAPI();

    // Create map instance
    map = new AMap.Map("gaode-map", {
      zoom: 11,
      center: [116.397428, 39.90923], // Beijing
      mapStyle: "amap://styles/normal",
      viewMode: "3D",
    });

    // Initialize plugins after map is created
    await initPlugins(AMap);

    // Set up event listeners
    setupEventListeners();

    console.log("✅ Gaode Map and plugins initialized successfully");
    loading.value = false;
  } catch (err) {
    console.error("❌ Failed to initialize map:", err);
    error.value = "Failed to load Gaode Maps. Please check your API key.";
    loading.value = false;
  }
};

// Initialize all plugins
const initPlugins = async (AMap: AMapInstance) => {
  // Method 1: Direct instantiation (since plugins are loaded synchronously)

  // Initialize ToolBar
  toolbar = new AMap.ToolBar({
    position: "RT", // Right Top
  });
  map.addControl(toolbar);

  // Initialize Scale
  scale = new AMap.Scale({
    position: "LB", // Left Bottom
  });
  map.addControl(scale);

  // Initialize AutoComplete
  autoComplete = new AMap.AutoComplete({
    city: "全国",
    citylimit: false,
  });

  // Initialize PlaceSearch
  placeSearch = new AMap.PlaceSearch({
    city: "全国",
    citylimit: false,
    map: map,
    panel: false,
  });

  // Initialize Geolocation
  geolocation = new AMap.Geolocation({
    enableHighAccuracy: true,
    timeout: 10000,
  });

  // Alternative Method 2: Using AMap.plugin for async loading
  /*
  await new Promise<void>((resolve) => {
    AMap.plugin(['AMap.AutoComplete', 'AMap.PlaceSearch', 'AMap.ToolBar', 'AMap.Scale', 'AMap.Geolocation'], () => {
      // Initialize plugins in callback
      toolbar = new AMap.ToolBar({ position: 'RT' })
      map.addControl(toolbar)
      
      scale = new AMap.Scale({ position: 'LB' })
      map.addControl(scale)
      
      autoComplete = new AMap.AutoComplete({
        city: '全国',
        citylimit: false
      })
      
      placeSearch = new AMap.PlaceSearch({
        city: '全国',
        citylimit: false,
        map: map,
        panel: false
      })
      
      geolocation = new AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 10000,
      })
      
      resolve()
    })
  })
  */
};

// Setup event listeners
const setupEventListeners = () => {
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

  // Map click event
  map.on("click", (e: any) => {
    const { lng, lat } = e.lnglat;
    addMarker(
      [lng, lat],
      "📍",
      `Clicked Location\nLat: ${lat.toFixed(6)}\nLng: ${lng.toFixed(6)}`
    );
  });
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
    addMarker([lng, lat], "🔍", suggestion.name);
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
  addMarker([lng, lat], "🔍", poi.name);
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

// Add marker to map
const addMarker = (
  position: [number, number],
  content: string,
  title: string
) => {
  // Clear existing search markers
  searchMarkers.forEach((marker) => map.remove(marker));
  searchMarkers = [];

  const marker = new window.AMap!.Marker({
    position: position,
    content: `<div style="background: white; padding: 8px; border-radius: 50%; font-size: 20px; border: 2px solid #667eea; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">${content}</div>`,
    anchor: "center",
  });

  // Add info window
  const infoWindow = new window.AMap!.InfoWindow({
    content: `<div style="padding: 12px;"><strong>${title}</strong></div>`,
    anchor: "bottom-center",
    offset: [0, -35],
  });

  marker.on("click", () => {
    infoWindow.open(map, position);
  });

  map.add(marker);
  searchMarkers.push(marker);
};

// Get current location using Geolocation plugin
const getCurrentLocation = () => {
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
  if (!placeSearch || !map) return;

  const center = map.getCenter();

  placeSearch.searchNearBy(
    "",
    [center.lng, center.lat],
    1000,
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
            content: `<div style="background: #ff6b6b; color: white; padding: 6px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${
              index + 1
            }</div>`,
            anchor: "center",
          });

          const infoWindow = new window.AMap.InfoWindow({
            content: `
            <div style="padding: 12px; max-width: 200px;">
              <strong>${poi.name}</strong><br>
              <small style="color: #666;">${poi.address}</small><br>
              ${
                poi.tel
                  ? `<small style="color: #666;">📞 ${poi.tel}</small><br>`
                  : ""
              }
              <small style="color: #999;">Distance: ${poi.distance}m</small>
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

// Toggle toolbar visibility
const toggleToolbar = () => {
  if (toolbar) {
    if (toolbar.getVisible && toolbar.getVisible()) {
      toolbar.hide();
    } else {
      toolbar.show();
    }
  }
};

// Toggle scale visibility
const toggleScale = () => {
  if (scale) {
    if (scale.getVisible && scale.getVisible()) {
      scale.hide();
    } else {
      scale.show();
    }
  }
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
  nextTick(() => {
    initMap();
  });
});

onUnmounted(() => {
  // Cleanup
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  // Destroy map instance
  if (map) {
    map.destroy();
  }
});

// Expose methods for parent components
defineExpose({
  map,
  getCurrentLocation,
  searchNearby,
  clearSearch,
});
</script>
