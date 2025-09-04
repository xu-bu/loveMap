<template>
  <ion-app>
    <ion-content :fullscreen="true">
      <capacitor-google-map ref="mapRef"
        style="display: inline-block; width: 100%; height: 100vh;"></capacitor-google-map>
    </ion-content>
  </ion-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  IonApp,
  IonContent,
} from "@ionic/vue";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { GoogleMap } from "@capacitor/google-maps";

const mapRef = ref<HTMLElement | null>(null);

onMounted(async () => {
  if (Capacitor.isNativePlatform()) {
    await Geolocation.requestPermissions();
  }

  let center = { lat: 25.033, lng: 121.5654 }; // default (Taipei 101)
  const position = await Geolocation.getCurrentPosition();
  center = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
  };

  // Ensure map container exists
  if (mapRef.value) {
    await initMap(center, mapRef.value);
  }
});

async function initMap(center: { lat: number; lng: number }, element: HTMLElement) {
  const map = await GoogleMap.create({
    id: "my-map",
    element,
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    config: {
      center,
      zoom: 14,
    },
    mapId: import.meta.env.VITE_MAP_ID,
  } as any);

  // Example: Add a marker (plugin API supports this directly)
  await map.addMarker({
    coordinate: center,
  });
}
</script>

<style>
/* Make sure map takes full screen inside ion-content */
#map {
  width: 100%;
  height: 100%;
}
</style>
