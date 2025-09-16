<script setup lang="ts">
import { watch, onMounted, onUnmounted, ref, nextTick, type Ref } from "vue";
import AMapLoader from "@amap/amap-jsapi-loader";
import { useMap } from "../composables/mapView";
import { useGaodeSearch } from "../composables/useGaodeSearch";
import { log } from "@/utils/logger";
import "../assets/styles/gaodeMap.css";

const location: Ref<{ lat: number; lng: number } | null> = ref(null);
const mapContainer = ref<HTMLElement>();
let map: any = null;
let currentLocationMarker: any = null;
let searchMarker: any = null;
let loveSpotMarkers: any[] = [];
let AMap: any = null;

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

// Gaode API configuration
const VITE_GAODE_API_KEY = import.meta.env.VITE_GAODE_API_KEY;
const VITE_GAODE_SECURITY_KEY = import.meta.env.VITE_GAODE_SECURITY_KEY;

// Load Gaode Map API using official loader
const loadGaodeAPI = async (): Promise<any> => {
    if (AMap) {
        return AMap;
    }

    try {
        // Set security config
        (window as any)._AMapSecurityConfig = {
            securityJsCode: VITE_GAODE_SECURITY_KEY,
        };

        // Load AMap with required plugins
        AMap = await AMapLoader.load({
            key: VITE_GAODE_API_KEY,
            version: "2.0",
            plugins: ["AMap.Scale"],
        });

        console.log("✅ Gaode API loaded successfully");
        return AMap;
    } catch (error) {
        console.error("❌ Failed to load Gaode API:", error);
        throw error;
    }
};

// Initialize Gaode Map
const initMap = async (): Promise<void> => {
    if (!location.value || !mapContainer.value || !AMap) return;

    try {
        map = new AMap.Map(mapContainer.value, {
            zoom: zoom?.value || 15,
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

        console.log("✅ Gaode map initialized successfully");
    } catch (error) {
        console.error("❌ Failed to initialize map:", error);
    }
};

const addCurrentLocationMarker = (): void => {
    if (!map || !location.value || !AMap) return;

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

    currentLocationMarker = new AMap.Marker({
        position: [location.value.lng, location.value.lat],
        content: markerContent,
        anchor: 'center',
    });

    map.add(currentLocationMarker);
};

const addSearchMarker = (): void => {
    if (!map || !searchResult.value || !AMap) return;

    // Remove existing search marker
    if (searchMarker) {
        map.remove(searchMarker);
    }

    const markerContent = document.createElement('div');
    markerContent.className = 'search-marker';
    markerContent.innerHTML = '🔍';

    searchMarker = new AMap.Marker({
        position: [searchResult.value.position.lng, searchResult.value.position.lat],
        content: markerContent,
        anchor: 'center',
    });

    // Add info window
    const infoWindow = new AMap.InfoWindow({
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

const addLoveSpotMarkers = (): void => {
    if (!map || !AMap) return;

    // Remove existing markers
    loveSpotMarkers.forEach(marker => map.remove(marker));
    loveSpotMarkers = [];

    loveSpots.value.forEach(loveSpot => {
        const markerContent = document.createElement('div');
        markerContent.className = 'love-spot-marker';
        markerContent.innerHTML = '💖';

        const marker = new AMap.Marker({
            position: [loveSpot.coordinates.lng, loveSpot.coordinates.lat],
            content: markerContent,
            anchor: 'center',
        });

        const infoWindow = new AMap.InfoWindow({
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

        (marker as any).loveSpotData = loveSpot;
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

const centerToCurrentLocation = (): void => {
    if (map && location.value) {
        map.setCenter([location.value.lng, location.value.lat]);
        map.setZoom(15);
    }
};

// Watch for search result changes
const watchSearchResult = (): void => {
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
const watchLoveSpots = (): void => {
    nextTick(() => {
        addLoveSpotMarkers();
    });
};

onMounted(async () => {
    try {
        // Load Gaode API first
        await loadGaodeAPI();
        
        // Get current location
        await getCurrentLocation();
        
        // Load love spots
        await loadLoveSpots();

        if (location.value) {
            nextTick(() => {
                initMap();
            });
        }
    } catch (error) {
        console.error('Failed to initialize Gaode Map:', error);
    }
});

onUnmounted(() => {
    if (map) {
        map.destroy();
        map = null;
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
                <input 
                    ref="searchInput" 
                    v-model="searchQuery" 
                    type="text" 
                    placeholder="搜索地点" 
                    class="search-input"
                    @input="onSearchInput" 
                    @focus="onSearchFocus" 
                    @blur="onSearchBlur" 
                    @keydown="handleKeyDown" 
                />
                <button @click="clearSearch" v-if="searchQuery" class="clear-search">
                    ×
                </button>

                <!-- Search Results Dropdown -->
                <div v-if="showSuggestions && searchSuggestions.length > 0" class="search-suggestions">
                    <div 
                        v-for="(suggestion, index) in searchSuggestions" 
                        :key="index" 
                        :class="[
                            'suggestion-item',
                            { selected: selectedSuggestionIndex === index },
                        ]" 
                        @mousedown.prevent="selectSuggestion(suggestion)" 
                        @mouseenter="selectedSuggestionIndex = index"
                    >
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