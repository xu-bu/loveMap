<script setup>
import { GoogleMap, AdvancedMarker, InfoWindow } from "vue3-google-map";
import { ref, onMounted } from "vue";
import { Geolocation } from "@capacitor/geolocation";
import { log } from "./utils/logger.js";

const VITE_GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const VITE_MAP_ID = import.meta.env.VITE_MAP_ID;
let center = { lat: -25.363, lng: 131.044 };
const centerSydney = { lat: -33.87322, lng: 151.206176 };
const makerOptionsSydney = { position: centerSydney, title: "SYDNEY" };
const centerPerth = { lat: -31.954877, lng: 115.860462 };
const markerOptionsPerth = { position: centerPerth, title: "PERTH" };
const location = ref(null)
const error = ref(null)
const loading = ref(false)

const getCurrentLocation = () => {
  loading.value = true
  error.value = null
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      log(loading.value)
      location.value = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      }
      loading.value = false
      log(location.value)
      log(loading.value)
    },
    (err) => {
      error.value = err.message
      loading.value = false
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    }
  )
}

onMounted(() => {
  getCurrentLocation()
})
</script>

<template>
  <div v-if="loading" style="display: flex; align-items: center; justify-content: center; height: 100vh;">
    <div>Getting your location...</div>
  </div>
  
  <div v-else-if="error" style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column;">
    <div>Error: {{ error }}</div>
    <button @click="getCurrentLocation" style="margin-top: 10px;">Try Again</button>
  </div>
  
  <GoogleMap
    v-else-if="location"
    :apiKey="VITE_GOOGLE_MAPS_API_KEY"
    :mapId="VITE_MAP_ID"
    style="width: 100%; height: 100vh"
    :center="{ lat: location.latitude, lng: location.longitude }"
    :zoom="15"
  >
    <!-- Current location marker -->
    <AdvancedMarker :options="{ position: { lat: location.latitude, lng: location.longitude } }">
      <template #content>
        <div style="background: red; color: white; padding: 5px; border-radius: 50%; width: 20px; height: 20px; border: 2px solid white;">
          📍
        </div>
      </template>
      <InfoWindow>
        <h3>Your Location</h3>
        <div>Lat: {{ location.latitude.toFixed(6) }}</div>
        <div>Lng: {{ location.longitude.toFixed(6) }}</div>
        <div>Accuracy: {{ location.accuracy }}m</div>
        <button @click="getCurrentLocation" style="margin-top: 5px;">Refresh</button>
      </InfoWindow>
    </AdvancedMarker>

    <AdvancedMarker :options="makerOptionsSydney">
      <InfoWindow>
        <h1>Sydney</h1>
        <div>Default AdvancedMarker With Custom InfoWindow</div>
      </InfoWindow>
    </AdvancedMarker>

    <AdvancedMarker :options="markerOptionsPerth">
      <template #content>
        <div
          style="
            background: white;
            color: black;
            padding: 5px;
            border-radius: 5px;
          "
        >
          Perth
        </div>
      </template>
      <InfoWindow>
        <h1>Perth</h1>
        <div>Custom Content AdvancedMarker With Custom InfoWindow</div>
      </InfoWindow>
    </AdvancedMarker>
  </GoogleMap>
</template>
