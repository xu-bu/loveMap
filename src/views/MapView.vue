<script setup lang="ts">
import { GoogleMap, AdvancedMarker, InfoWindow } from "vue3-google-map";
import { ref, onMounted } from "vue";
import { log } from "../utils/logger.js";
import router from "@/router/index.js";

const VITE_GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const VITE_MAP_ID = import.meta.env.VITE_MAP_ID;
const location = ref<{ latitude: number; longitude: number } | null>(null);
const error = ref("");
const loading = ref(false);

const getCurrentLocation = () => {
  loading.value = true;
  error.value = "";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      location.value = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      loading.value = false;
      log(location.value);
    },
    (err) => {
      error.value = err.message;
      loading.value = false;
    },
    {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 0,
    }
  );
};

function handleMapClick(event) {
  const lat = event.latLng.lat();
  const lng = event.latLng.lng();
  router.push({ name: "CreateLoveSpot", query: { lat, lng } });
}

function createAtCurrentLocation() {
  if (location.value) {
    // Create a mock event object similar to what handleMapClick expects
    const mockEvent = {
      latLng: {
        lat: () => location.value?.latitude,
        lng: () => location.value?.longitude
      }
    };
    handleMapClick(mockEvent);
  }
}

onMounted(() => {
  getCurrentLocation();
});
</script>

<template>
  <div v-if="loading" style="
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    ">
    <div>Getting your location...</div>
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
    style="width: 100%; height: 100vh" :center="{ lat: location.latitude, lng: location.longitude }" :zoom="5"
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
  </GoogleMap>
</template>