import { ref, onMounted, type Ref, toRaw } from "vue";
import { useRouter } from "vue-router";
import { LoveSpot } from "../types/db";
import { loveSpotState } from "../types/common";
import { log } from "@/utils/logger";

export function useLoveSpot() {
  const router = useRouter();
  const loveSpot: Ref<LoveSpot | null> = ref(null);
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
    router.push({
      name: "CreateLoveSpot",
      state: { loveSpot: toRaw(loveSpot.value) as unknown as loveSpotState },
    });
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
