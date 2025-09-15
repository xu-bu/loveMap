<script setup lang="ts">
import { watch, onMounted, ref, nextTick, type Ref } from "vue";
import { useMap } from "../composables/mapView";
import { useGaodeSearch } from "../composables/useGaodeSearch";
import { log } from "@/utils/logger";

// Gaode Map types
declare global {
    interface Window {
        AMap: any;
        AMapUI: any;
    }
}

const location: Ref<{ lat: number; lng: number } | null> = ref(null);
const mapContainer = ref<HTMLElement>();
let map: any = null;
let currentLocationMarker: any = null;
let searchMarker: any = null;
let loveSpotMarkers: any[] = [];

const {
    loveSpots,
    error,
    loading,
    loadingSpots,
    getCurrentLocation,
    handleMapClick,
    handleLoveSpotClick,
    loadLoveSpots,
    truncateText,
    formatDate,
} = useMap(location);

const {
    searchQuery,
    searchResult,
    searchSuggestions,
    showSuggestions,
    searchLoading,
    selectedSuggestionIndex,
    searchInput,
    zoom,
    onSearchInput,
    selectSuggestion,
    onSearchFocus,
    onSearchBlur,
    handleKeyDown,
    clearSearch,
    createAtSearchLocation,
} = useGaodeSearch(location);

const GAODE_API_KEY = import.meta.env.VITE_GAODE_API_KEY;

// Initialize Gaode Map
const initMap = () => {
    if (!location.value || !mapContainer.value) return;

    map = new window.AMap.Map(mapContainer.value, {
        zoom: zoom.value || 15,
        center: [location.value.lng, location.value.lat], // Gaode uses [lng, lat] format
        mapStyle: 'amap://styles/normal',
        viewMode: '3D',
    });

    // Add map click event
    map.on('click', (e: any) => {
        const lnglat = e.lnglat;
        handleMapClick({
            latLng: {
                lat: () => lnglat.lat,
                lng: () => lnglat.lng,
            },
        });
    });

    // Add current location marker
    addCurrentLocationMarker();

    // Add love spot markers
    addLoveSpotMarkers();
};

const addCurrentLocationMarker = () => {
    log(location)
    if (!map || !location.value) return;

    // Remove existing marker
    if (currentLocationMarker) {
        map.remove(currentLocationMarker);
    }

    // Create custom marker content
    const markerContent = document.createElement('div');
    markerContent.className = 'current-location-marker';
    markerContent.innerHTML = `
    <div class="pulse"></div>
    📍
  `;

    currentLocationMarker = new window.AMap.Marker({
        position: [location.value.lng, location.value.lat],
        content: markerContent,
        anchor: 'center',
    });

    map.add(currentLocationMarker);
};

const addSearchMarker = () => {
    if (!map || !searchResult.value) return;

    // Remove existing search marker
    if (searchMarker) {
        map.remove(searchMarker);
    }

    const markerContent = document.createElement('div');
    markerContent.className = 'search-marker';
    markerContent.innerHTML = '🔍';

    searchMarker = new window.AMap.Marker({
        position: [searchResult.value.position.lng, searchResult.value.position.lat],
        content: markerContent,
        anchor: 'center',
    });

    // Add info window
    const infoWindow = new window.AMap.InfoWindow({
        content: `
      <div class="info-window-content">
        <h3>${searchResult.value.name}</h3>
        <p>${searchResult.value.address}</p>
        <button onclick="createAtSearchLocation()" class="create-button">
          ➕ Create Love Spot Here
        </button>
      </div>
    `,
        anchor: 'bottom-center',
        offset: [0, -30],
    });

    searchMarker.on('click', () => {
        infoWindow.open(map, searchMarker.getPosition());
    });

    map.add(searchMarker);

    // Center map on search result
    map.setCenter([searchResult.value.position.lng, searchResult.value.position.lat]);
    map.setZoom(17);
};

const addLoveSpotMarkers = () => {
    if (!map) return;

    // Remove existing markers
    loveSpotMarkers.forEach(marker => map.remove(marker));
    loveSpotMarkers = [];

    loveSpots.value.forEach(loveSpot => {
        const markerContent = document.createElement('div');
        markerContent.className = 'love-spot-marker';
        markerContent.innerHTML = '💖';

        const marker = new window.AMap.Marker({
            position: [loveSpot.coordinates.lng, loveSpot.coordinates.lat],
            content: markerContent,
            anchor: 'center',
        });

        const infoWindow = new window.AMap.InfoWindow({
            content: `
        <div class="info-window-content love-spot-info">
          <h3>${loveSpot.address}</h3>
          <div class="love-spot-preview">
            <p>${truncateText(loveSpot.content, 100)}</p>
            ${loveSpot.photos && loveSpot.photos.length > 0 ?
                    `<div class="photo-preview">
                <img src="${loveSpot.photos[0]}" alt="Love spot preview" class="preview-image" />
              </div>` : ''
                }
            <div class="love-spot-meta">
              <span class="date">${formatDate(loveSpot.created_at)}</span>
            </div>
            <button onclick="viewLoveSpotDetails('${loveSpot.id}')" class="view-details-button">
              👀 View Details
            </button>
          </div>
        </div>
      `,
            anchor: 'bottom-center',
            offset: [0, -30],
        });

        marker.on('click', () => {
            infoWindow.open(map, marker.getPosition());
        });

        marker.loveSpotData = loveSpot;
        map.add(marker);
        loveSpotMarkers.push(marker);
    });
};

// Global functions for info window buttons
(window as any).createAtSearchLocation = createAtSearchLocation;
(window as any).viewLoveSpotDetails = (id: number) => {
    const loveSpot = loveSpots.value.find(spot => spot.id === id);
    if (loveSpot) {
        handleLoveSpotClick(loveSpot);
    }
};

const centerToCurrentLocation = () => {
    if (map && location.value) {
        map.setCenter([location.value.lng, location.value.lat]);
        map.setZoom(15);
    }
};

// Watch for search result changes
const watchSearchResult = () => {
    if (searchResult.value) {
        nextTick(() => {
            addSearchMarker();
        });
    } else if (searchMarker) {
        map.remove(searchMarker);
        searchMarker = null;
    }
};

// Watch for love spots changes
const watchLoveSpots = () => {
    nextTick(() => {
        addLoveSpotMarkers();
    });
};

// Load Gaode Map API
const loadGaodeAPI = () => {
    return new Promise((resolve, reject) => {
        if (window.AMap) {
            resolve(window.AMap);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${GAODE_API_KEY}&plugin=AMap.PlaceSearch,AMap.Autocomplete`;
        script.async = true;
        script.onload = () => resolve(window.AMap);
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

onMounted(async () => {
    try {
        await loadGaodeAPI();
        await getCurrentLocation();
        await loadLoveSpots();

        if (location.value) {
            nextTick(() => {
                initMap();
            });
        }
    } catch (error) {
        console.error('Failed to load Gaode Map:', error);
    }
});

// Watch for changes
watch(searchResult, (newResult) => {
    if (newResult) {
        watchSearchResult();
    }
});

watch(loveSpots, (newSpots) => {
    if (newSpots.length > 0) {
        watchLoveSpots();
    }
});
</script>

<template>
    <!-- Loading States -->
    <div v-if="loading || loadingSpots" class="loading-container">
        <div class="loading-content">
            <div class="spinner"></div>
            <div>
                {{ loading ? "Getting your location..." : "Loading love spots..." }}
            </div>
        </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
        <div class="error-content">
            <div class="error-icon">⚠️</div>
            <div class="error-message">{{ error }}</div>
            <button @click="getCurrentLocation" class="retry-button">
                🔄 Try Again
            </button>
        </div>
    </div>

    <!-- Map with Search -->
    <div v-else-if="location" class="map-wrapper">
        <!-- Search Bar with Autocomplete -->
        <div class="search-container">
            <div class="search-wrapper">
                <input ref="searchInput" v-model="searchQuery" type="text" placeholder="搜索地点" class="search-input"
                    @input="onSearchInput" @focus="onSearchFocus" @blur="onSearchBlur" @keydown="handleKeyDown" />
                <button @click="clearSearch" v-if="searchQuery" class="clear-search">
                    ×
                </button>

                <!-- Search Results Dropdown -->
                <div v-if="showSuggestions && searchSuggestions.length > 0" class="search-suggestions">
                    <div v-for="(suggestion, index) in searchSuggestions" :key="index" :class="[
                        'suggestion-item',
                        { selected: selectedSuggestionIndex === index },
                    ]" @mousedown.prevent="selectSuggestion(suggestion)" @mouseenter="selectedSuggestionIndex = index">
                        <div class="suggestion-icon">📍</div>
                        <div class="suggestion-text">
                            <div class="suggestion-name">
                                {{ suggestion.name }}
                            </div>
                            <div class="suggestion-address">
                                {{ suggestion.district + suggestion.address }}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Loading indicator for search -->
                <div v-if="searchLoading" class="search-loading">
                    <div class="search-spinner"></div>
                </div>
            </div>
        </div>

        <!-- Map Container -->
        <div ref="mapContainer" class="google-map" style="width: 100%; height: 100%;"></div>

        <!-- Floating Action Button -->
        <button @click="centerToCurrentLocation" class="fab">🎯</button>
    </div>
</template>

<style scoped>
.map-wrapper {
    position: relative;
    width: 100%;
    height: 100vh;
}

.google-map {
    width: 100%;
    height: 100%;
}

.loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background: #f5f5f5;
}

.loading-content {
    text-align: center;
    color: #666;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #4285f4;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
}

.error-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background: #f5f5f5;
}

.error-content {
    text-align: center;
    color: #666;
}

.error-icon {
    font-size: 2rem;
    margin-bottom: 1rem;
}

.error-message {
    margin-bottom: 1rem;
    color: #d32f2f;
}

.retry-button {
    background: #4285f4;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    cursor: pointer;
}

.fab {
    position: absolute;
    bottom: 2rem;
    right: 2rem;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #4285f4;
    color: white;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
}

.fab:hover {
    background: #3367d6;
}

/* Custom marker styles */
:global(.current-location-marker) {
    position: relative;
    width: 20px;
    height: 20px;
    background: #4285f4;
    border: 3px solid white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    font-size: 12px;
}

:global(.current-location-marker .pulse) {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: #4285f4;
    opacity: 0.3;
    animation: pulse 2s infinite;
}

:global(.search-marker) {
    background: #4285f4;
    color: white;
    padding: 8px;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    border: 3px solid white;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
}

:global(.love-spot-marker) {
    background: white;
    border: 2px solid #ff4757;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

:global(.info-window-content) {
    padding: 1rem;
    max-width: 250px;
}

:global(.info-window-content h3) {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: #333;
}

:global(.love-spot-preview p) {
    margin: 0.5rem 0;
    color: #666;
    font-size: 0.9rem;
}

:global(.photo-preview) {
    margin: 0.5rem 0;
}

:global(.preview-image) {
    width: 100%;
    max-width: 200px;
    height: auto;
    border-radius: 8px;
}

:global(.love-spot-meta) {
    font-size: 0.8rem;
    color: #999;
    margin: 0.5rem 0;
}

:global(.create-button),
:global(.view-details-button) {
    background: #4285f4;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.9rem;
    margin-top: 0.5rem;
}

:global(.create-button:hover),
:global(.view-details-button:hover) {
    background: #3367d6;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 0.3;
    }

    70% {
        transform: scale(3);
        opacity: 0;
    }

    100% {
        transform: scale(3);
        opacity: 0;
    }
}
</style>