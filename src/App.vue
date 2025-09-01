<template>
  <ion-app>
    <ion-header>
      <ion-toolbar>
        <ion-title>My Map App</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div id="map" style="width: 100%; height: 100%"></div>
    </ion-content>
  </ion-app>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import {
  IonicVue,
  IonApp,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from "@ionic/vue";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

onMounted(async () => {
  if (Capacitor.isNativePlatform()) {
    // Request permissions only on native (iOS/Android)
    await Geolocation.requestPermissions();
  }

  let center = { lat: 25.033, lng: 121.5654 }; // default

  try {
    const position = await Geolocation.getCurrentPosition();
    center = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  } catch (err) {
    console.warn("Could not get location, using default", err);
  }

  // Wait a tick to ensure ion-content layout is ready
  setTimeout(() => initMap(center), 100);
});

const initMap = (center: { lat: number; lng: number }) => {
  console.log(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
  console.log(import.meta.env.VITE_MAP_ID);
  // Create the map
  const map = new google.maps.Map(
    document.getElementById("map") as HTMLElement,
    {
      center,
      zoom: 14,
      mapId: import.meta.env.VITE_MAP_ID, // Use your custom map ID from .env
    }
  );

  // Add a marker using the modern API
  const marker = new google.maps.marker.AdvancedMarkerElement({
    position: center,
    map,
    title: "You are here",
  });
};
</script>

<style>
/* Make sure map takes full screen inside ion-content */
#map {
  width: 100%;
  height: 100%;
}
</style>
