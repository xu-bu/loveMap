<script setup>
import { GoogleMap, AdvancedMarker } from 'vue3-google-map'

const VITE_GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const VITE_MAP_ID = import.meta.env.VITE_MAP_ID
const center = { lat: 40.689247, lng: -74.044502 }
const markerOptions = { position: center, title: 'START OF LOVE MAP' }
const pinOptions = { background: '#FBBC04' }
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