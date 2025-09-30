import { ref } from "vue";
import { useRouter } from "vue-router";
import { LoveSpot } from "../types/db";
import { log } from "@/utils/logger";

export function useLoveSpot() {
  const router = useRouter();
  const loading = ref(false);
  const error = ref("");
  const currentPhotoIndex = ref(0);
  log(history.state)
  const loveSpot = history.state.loveSpot as LoveSpot;

  const goBack = () => {
    router.back();
  };

  const goToMap = () => {
    log("Go to Map");
  };

  const editLoveSpot = () => {
    router.push({
      name: "CreateLoveSpot",
      state: { loveSpot: JSON.parse(JSON.stringify(loveSpot)) },
    });
  };

  return {
    // Data
    loveSpot,
    loading,
    error,
    currentPhotoIndex,

    // Methods
    goBack,
    goToMap,
    editLoveSpot,
  };
}
