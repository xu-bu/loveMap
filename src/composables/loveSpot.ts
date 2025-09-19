import { ref, onMounted, type Ref } from "vue";
import { useRouter } from "vue-router";
import { LocationData } from "../types/db";
import { HistoryState } from "../types/common";


export function useLoveSpot() {
  const router = useRouter();
  const loveSpot: Ref<LocationData | null> = ref(null);
  const loading = ref(false);
  const error = ref("");
  const currentPhotoIndex = ref(0);
  const goBack = () => {
    router.back();
  };

  const goToMap = () => {
    if (loveSpot.value) {
      router.push({
        name: "Map", // Adjust to your map route name
        query: {
          lat: loveSpot.value.coordinates.lat.toString(),
          lng: loveSpot.value.coordinates.lng.toString(),
          zoom: "15",
        },
      });
    }
  };

  const nextPhoto = () => {
    if (loveSpot.value && loveSpot.value.photos.length > 0) {
      currentPhotoIndex.value =
        (currentPhotoIndex.value + 1) % loveSpot.value.photos.length;
    }
  };

  const previousPhoto = () => {
    if (loveSpot.value && loveSpot.value.photos.length > 0) {
      currentPhotoIndex.value =
        currentPhotoIndex.value === 0
          ? loveSpot.value.photos.length - 1
          : currentPhotoIndex.value - 1;
    }
  };

  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const loadLoveSpotFromState = () => {
    loading.value = true;
    error.value = "";

    const stateData = (history.state as HistoryState)?.loveSpot;

    if (stateData) {
      loveSpot.value = stateData;
      loading.value = false;
    } else {
      error.value = "No love spot data found";
      loading.value = false;
      console.error("No love spot data found");
      // Optionally redirect back
      // router.push('/')
    }
  };

  // Auto-load on mount
  onMounted(() => {
    loadLoveSpotFromState();
  });

  return {
    // Data
    loveSpot,
    loading,
    error,
    currentPhotoIndex,

    // Methods
    goBack,
    goToMap,
    nextPhoto,
    previousPhoto,
    formatDate,
    loadLoveSpotFromState,
  };
}
