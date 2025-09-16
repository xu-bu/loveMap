import { ref, type Ref } from "vue";
import { log } from "../utils/logger.js";
import router from "@/router/index.js";
import { getSupabaseClient } from "../services/db.js";
import { LocationData } from "../types/google.js";

const supabaseClient = getSupabaseClient();

export function useMap(location: Ref <{ lat: number; lng: number }|null> ) {
  const VITE_GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const VITE_MAP_ID = import.meta.env.VITE_MAP_ID;

  const loveSpots = ref<LocationData[]>([]);
  const error = ref("");
  const loading = ref(false);
  const loadingSpots = ref(false);

  const getCurrentLocation = async () => {
    loading.value = true;
    error.value = "";

    // const ip= await getUserIP()

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

  const truncateText = (text: string, maxLength: number): string => {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  const formatDate = (date: string | Date | undefined): string => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
    truncateText,
    formatDate,
  };
}
