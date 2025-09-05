<script setup>
import { GoogleMap, Marker } from 'vue3-google-map'

const VITE_GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const center = { lat: 40.689247, lng: -74.044502 }
</script>

<template>
  <GoogleMap
  :api-key="VITE_GOOGLE_MAPS_API_KEY"
  style="width: 100%; height: 100vh"
  :center="center"
  :zoom="15"
  >
    <Marker :options="{ position: center }" />
  </GoogleMap>
</template>