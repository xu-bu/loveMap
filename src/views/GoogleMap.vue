<script setup lang="ts">
import { GoogleMap, AdvancedMarker, InfoWindow } from "vue3-google-map";
import { onMounted, ref, type Ref } from "vue";
import { useMap } from "../composables/mapView";
import { useSearch } from "../composables/useSearch";
import "../assets/styles/mapView.css";

const location: Ref<{ lat: number; lng: number } | null> = ref(null);
const {
  VITE_GOOGLE_MAPS_API_KEY,
  VITE_MAP_ID,
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
  onMapReady,
} = useSearch(location);

onMounted(() => {
  getCurrentLocation();
  loadLoveSpots();
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
      <button @click="() => getCurrentLocation" class="retry-button">
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
          placeholder="Search Google Maps"
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
        <div
          v-if="showSuggestions && searchSuggestions.length > 0"
          class="search-suggestions"
        >
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
                {{
                  suggestion.placePrediction.structuredFormat?.mainText.text
                }}
              </div>
              <div class="suggestion-address">
                {{ suggestion.placePrediction.structuredFormat?.secondaryText.text }}
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

    <!-- Map -->
    <GoogleMap
      :apiKey="VITE_GOOGLE_MAPS_API_KEY"
      :mapId="VITE_MAP_ID"
      :center="location"
      :zoom="zoom"
      class="google-map"
      @click="handleMapClick"
      @ready="onMapReady"
    >
      <!-- Current location marker -->
      <AdvancedMarker
        :options="{
          position: { lat: location.lat, lng: location.lng },
        }"
      >
        <template #content>
          <div class="current-location-marker">
            <div class="pulse"></div>
            📍
          </div>
        </template>
      </AdvancedMarker>

      <!-- Search result marker -->
      <AdvancedMarker
        v-if="searchResult"
        :options="{
          position: searchResult.position,
        }"
      >
        <template #content>
          <div class="search-marker">🔍</div>
        </template>
        <InfoWindow>
          <div class="info-window-content">
            <h3>{{ searchResult.name }}</h3>
            <p>{{ searchResult.address }}</p>
            <button @click="createAtSearchLocation" class="create-button">
              ➕ Create Love Spot Here
            </button>
          </div>
        </InfoWindow>
      </AdvancedMarker>

      <!-- Love Spot Markers -->
      <AdvancedMarker
        v-for="loveSpot in loveSpots"
        :key="loveSpot.id"
        :options="{
          position: {
            lat: loveSpot.coordinates.lat,
            lng: loveSpot.coordinates.lng,
          },
        }"
        @click="() => handleLoveSpotClick(loveSpot)"
      >
        <template #content>
          <div class="love-spot-marker">💖</div>
        </template>
        <InfoWindow>
          <div class="info-window-content love-spot-info">
            <h3>{{ loveSpot.address }}</h3>
            <div class="love-spot-preview">
              <p>{{ truncateText(loveSpot.content, 100) }}</p>
              <div
                v-if="loveSpot.photos && loveSpot.photos.length > 0"
                class="photo-preview"
              >
                <img
                  :src="loveSpot.photos[0]"
                  alt="Love spot preview"
                  class="preview-image"
                />
              </div>
              <div class="love-spot-meta">
                <span class="date">{{ formatDate(loveSpot.created_at) }}</span>
              </div>
              <button
                @click="() => handleLoveSpotClick(loveSpot)"
                class="view-details-button"
              >
                👀 View Details
              </button>
            </div>
          </div>
        </InfoWindow>
      </AdvancedMarker>
    </GoogleMap>

    <!-- Floating Action Button -->
    <button @click="() => getCurrentLocation" class="fab">🎯</button>
  </div>
</template>
