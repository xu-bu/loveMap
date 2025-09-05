<script setup>
import { GoogleMap, AdvancedMarker } from 'vue3-google-map'
import { ref, onMounted } from 'vue'
import { Geolocation } from "@capacitor/geolocation";

const VITE_GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const VITE_MAP_ID = import.meta.env.VITE_MAP_ID
const pinOptions = { background: '#FBBC04' }
let center = { lat: 39.9501, lng: 116.4672 };
const markerOptions = { position: center }

onMounted(async () => {
  if (Capacitor.isNativePlatform()) {
    await Geolocation.requestPermissions();
  }

  center = await Geolocation.getCurrentPosition();
})
</script>

<template>
    <GoogleMap
    :api-key="VITE_GOOGLE_MAPS_API_KEY"
    :mapId="VITE_MAP_ID"
    style="width: 100%; height: 100vh"
    :center="center"
    :zoom="15"
  >
    <AdvancedMarker :options="markerOptions" :pin-options="pinOptions"/>
    <AdvancedMarker :options="markerOptions">
      <template #content>
        <div style="background: white; color: black; padding: 5px; border-radius: 5px">
          START OF LOVE MAP
        </div>
      </template>
    </AdvancedMarker>
  </GoogleMap>
</template>