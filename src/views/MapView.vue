<script setup lang="ts">
import { GoogleMap, AdvancedMarker, InfoWindow } from "vue3-google-map";
import { onMounted } from "vue";
import { useMap } from "../composables/mapView";

const {
  VITE_GOOGLE_MAPS_API_KEY,
  VITE_MAP_ID,
  location,
  loveSpots,
  error,
  loading,
  loadingSpots,
  getCurrentLocation,
  handleMapClick,
  handleLoveSpotClick,
  createAtCurrentLocation,
  initialize
} = useMap();

onMounted(() => {
  initialize();
});
</script>

<template>
  <div v-if="loading || loadingSpots" style="
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    ">
    <div>{{ loading ? 'Getting your location...' : 'Loading love spots...' }}</div>
  </div>

  <div v-else-if="error" style="
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      flex-direction: column;
    ">
    <div>Error: {{ error }}</div>
    <button @click="getCurrentLocation" style="margin-top: 10px">
      Try Again
    </button>
  </div>

  <GoogleMap v-else-if="location" :apiKey="VITE_GOOGLE_MAPS_API_KEY" :mapId="VITE_MAP_ID"
    style="width: 100%; height: 100vh" :center="{ lat: location.latitude, lng: location.longitude }" :zoom="15"
    @click="handleMapClick">
    
    <!-- Current location marker -->
    <AdvancedMarker :options="{
      position: { lat: location.latitude, lng: location.longitude },
    }">
      <template #content>
        <div style="
            background: red;
            color: white;
            padding: 5px;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            border: 2px solid white;
          ">
          📍
        </div>
      </template>
      <InfoWindow>
        <h3>Your Location</h3>
        <div>Lat: {{ location.latitude.toFixed(6) }}</div>
        <div>Lng: {{ location.longitude.toFixed(6) }}</div>
        <button @click="createAtCurrentLocation" style="margin-top: 5px">
          Create
        </button>
      </InfoWindow>
    </AdvancedMarker>

    <!-- Love Spot Markers -->
    <AdvancedMarker 
      v-for="loveSpot in loveSpots" 
      :key="loveSpot.id"
      :options="{
        position: { 
          lat: loveSpot.coordinates.lat, 
          lng: loveSpot.coordinates.lng 
        },
      }"
      @click="() => handleLoveSpotClick(loveSpot)"
    >
      <template #content>
        <div style="
            background: pink;
            color: white;
            padding: 8px;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            border: 3px solid #ff69b4;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 16px;
          ">
          💖
        </div>
      </template>
      <InfoWindow>
        <h3>{{ loveSpot.address }}</h3>
        <div style="max-width: 200px;">
          <p>{{ loveSpot.content.substring(0, 100) }}{{ loveSpot.content.length > 100 ? '...' : '' }}</p>
          <div v-if="loveSpot.photos && loveSpot.photos.length > 0" style="margin: 10px 0;">
            <img 
              :src="loveSpot.photos[0]" 
              alt="Love spot preview"
              style="width: 100%; max-width: 150px; height: auto; border-radius: 8px;"
            />
          </div>
          <button 
            @click="() => handleLoveSpotClick(loveSpot)" 
            style="margin-top: 10px; background: #ff69b4; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;"
          >
            View Details
          </button>
        </div>
      </InfoWindow>
    </AdvancedMarker>
  </GoogleMap>
</template>