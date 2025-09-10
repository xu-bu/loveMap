import { ref } from "vue";
import { log } from "../utils/logger.js";
import router from "@/router/index.js";
import { getSupabaseClient } from "../services/db.js";

const supabaseClient = getSupabaseClient();
export interface LocationData {
  id?: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  photos: string[];
  content: string;
  created_at?: Date;
}

export function useMap() {
  const VITE_GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const VITE_MAP_ID = import.meta.env.VITE_MAP_ID;

  const location = ref<{ latitude: number; longitude: number } | null>(null);
  const loveSpots = ref<LocationData[]>([]);
  const error = ref("");
  const loading = ref(false);
  const loadingSpots = ref(false);

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

  const loadLoveSpots = async () => {
    loadingSpots.value = true;
    try {
      const { data, error: fetchError } = await supabaseClient
        .from("loveMap")
        .select("*");

      if (fetchError) {
        console.error("Error fetching love spots:", fetchError);
        error.value = fetchError.message;
      } else {
        loveSpots.value = data || [];
        log("Loaded love spots:");
        log(loveSpots.value);
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
    router.push({ name: "CreateLoveSpot", query: { lat, lng } });
  }

  function handleLoveSpotClick(loveSpot: LocationData) {
    // Redirect to love spot page with the spot ID
    router.push({
      name: "LoveSpot",
      state: { loveSpot: JSON.parse(JSON.stringify(loveSpot)) },
    });
  }
  
  function createAtCurrentLocation() {
    if (location.value) {
      // Create a mock event object similar to what handleMapClick expects
      const mockEvent = {
        latLng: {
          lat: () => location.value?.latitude,
          lng: () => location.value?.longitude,
        },
      };
      handleMapClick(mockEvent);
    }
  }

  const initialize = () => {
    getCurrentLocation();
    loadLoveSpots();
  };

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
    createAtCurrentLocation,
    initialize,
  };
}
