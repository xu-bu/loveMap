import { ref, onMounted, type Ref } from "vue";
import { useRouter } from "vue-router";
import { loveSpot } from "../types/db";
import { loveSpotState } from "../types/common";
import { log } from "@/utils/logger";

export function useLoveSpot() {
  const router = useRouter();
  const loveSpot: Ref<loveSpot | null> = ref(null);
  const loading = ref(false);
  const error = ref("");
  const currentPhotoIndex = ref(0);
  const stateData = history.state as loveSpotState;

  log("loveSpot State:", stateData.loveSpot);

  const goBack = () => {
    router.back();
  };

  const goToMap = () => {
    log("Go to Map");
  };
  const loadLoveSpotFromState = () => {
    loading.value = true;
    error.value = "";
    log("Loaded love spot:", loveSpot.value);

    if (stateData) {
      loading.value = false;
      loveSpot.value = stateData.loveSpot!;
    } else {
      error.value = "No love spot data found";
      loading.value = false;
      console.error("No love spot data found");
    }
  };

  const editLoveSpot = () => {
    log("Edit Love Spot:", loveSpot.value);
    if (loveSpot.value) {
      router.push({
        name: "CreateLoveSpot",
        state: { loveSpot: structuredClone(loveSpot.value) as any },
      });
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
    loadLoveSpotFromState,
    editLoveSpot,
  };
}
