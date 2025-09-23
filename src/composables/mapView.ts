import { ref, type Ref } from "vue";
import { log } from "../utils/logger";
import router from "@/router/index";
import { getSupabaseClient } from "../services/db";
import type { LocationData } from "../types/db";
import { locateUserByIP } from "../utils/locateUserByIP";

const supabaseClient = getSupabaseClient();
const needsRefresh = ref(true); // Start as true for initial load

export function useMap(location: Ref<{ lat: number; lng: number } | null>) {
  const VITE_GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const VITE_MAP_ID = import.meta.env.VITE_MAP_ID;

  const loveSpots = ref<LocationData[]>([]);
  const error = ref("");
  const loading = ref(false);
  const loadingSpots = ref(false);

  const getCurrentLocation = async () => {
    loading.value = true;
    error.value = "";

    const location = await locateUserByIP();

    log(location);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        location.value = { lat: latitude, lng: longitude };
        loading.value = false;
        log(location);
      },
      (err) => {
        console.error(err);
        // error.value = err.message;
        location.value = {
          lat: 39.95047718713052,
          lng: 116.4671802520752,
        };
        loading.value = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 3000,
        maximumAge: 1000,
      }
    );
  };
  const loadLoveSpots = async () => {
    if (!needsRefresh.value) return;
    loadingSpots.value = true;
    try {
      const { data, error: fetchError } = (await supabaseClient
        .from("loveMap")
        .select("*")) as { data: LocationData[] | null; error: any };

      if (fetchError) {
        console.error("Error fetching love spots:", fetchError);
        error.value = fetchError.message;
      } else {
        localStorage.setItem("loveSpots", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Error loading love spots:", err);
      error.value = "Failed to load love spots";
    } finally {
      loadingSpots.value = false;
    }
  };

  function handleMapClick(event: any) {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    router.push({
      name: "CreateLoveSpot",
      query: { lat, lng, origin: "google" },
    });
  }

  function handleLoveSpotClick(loveSpot: LocationData) {
    // Redirect to love spot page with the spot ID
    router.push({
      name: "LoveSpot",
      state: { loveSpot: JSON.parse(JSON.stringify(loveSpot)) },
    });
  }


  return {
    // Environment variables
    VITE_GOOGLE_MAPS_API_KEY,
    VITE_MAP_ID,

    // Reactive state
    location,
    loveSpots,
    error,
    loading,
    loadingSpots,

    // Methods
    getCurrentLocation,
    loadLoveSpots,
    handleMapClick,
    handleLoveSpotClick,
  };
}
