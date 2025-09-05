<script setup>
import { GoogleMap, AdvancedMarker,InfoWindow } from "vue3-google-map";
import { ref, onMounted } from "vue";
import { Geolocation } from "@capacitor/geolocation";
import { log } from "./utils/logger.js";

const VITE_GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const VITE_MAP_ID = import.meta.env.VITE_MAP_ID;
let center = { lat: -25.363, lng: 131.044 };
const centerSydney = { lat: -33.873220, lng: 151.206176 };
const makerOptionsSydney = { position: centerSydney, title: 'SYDNEY' };
const centerPerth = { lat: -31.954877, lng: 115.860462 };
const markerOptionsPerth = { position: centerPerth, title: 'PERTH' };

// onMounted(async () => {
//   if (Capacitor.isNativePlatform()) {
//     await Geolocation.requestPermissions();
//   }

//   const CurrentPosition = await Geolocation.getCurrentPosition();

//   log("Current position:", CurrentPosition);
//   center = {
//     lat: CurrentPosition.latitude,
//     lng: CurrentPosition.coordinates.longitude,
//   };
//   log("Current position:", center);
// });
</script>

<template>
  <GoogleMap
    :apiKey="VITE_GOOGLE_MAPS_API_KEY"
    :mapId="VITE_MAP_ID"
    style="width: 100%; height: 100vh"
    :center="center"
    :zoom="3"
  >
    <AdvancedMarker :options="makerOptionsSydney">
      <InfoWindow>
        <h1>Sydney</h1>
        <div>
          Default AdvancedMarker With Custom InfoWindow
        </div>
      </InfoWindow>
    </AdvancedMarker>

    <AdvancedMarker :options="markerOptionsPerth">
      <template #content>
        <div style="background: white; color: black; padding: 5px; border-radius: 5px">
          Perth
        </div>
      </template>
      <InfoWindow>
        <h1>Perth</h1>
        <div>
          Custom Content AdvancedMarker With Custom InfoWindow
        </div>
      </InfoWindow>
    </AdvancedMarker>
  </GoogleMap>
</template>
