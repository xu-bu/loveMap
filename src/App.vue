<template>
  <ion-app>
    <ion-header>
      <ion-toolbar>
        <ion-title>My Map App</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div id="map" style="width: 100%; height: 100%;"></div>
    </ion-content>
  </ion-app>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { IonicVue, IonApp, IonHeader, IonToolbar, IonTitle, IonContent } from "@ionic/vue";
import { Geolocation } from '@capacitor/geolocation';

const loadGoogleMaps = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).google) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    }`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject("Failed to load Google Maps");
    document.head.appendChild(script);
  });
};

onMounted(async () => {
  await loadGoogleMaps();

  let center = { lat: 25.0330, lng: 121.5654 }; // default location

  try {
    const position = await Geolocation.getCurrentPosition();
    center = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  } catch (err) {
    console.warn('Could not get location, using default', err);
  }

  initMap(center);
});

// Initialize Google Map
const initMap = (center: { lat: number; lng: number }) => {
  const map = new google.maps.Map(document.getElementById("map") as HTMLElement, {
    center,
    zoom: 14,
  });

  new google.maps.Marker({
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
