import { ref, onMounted, type Ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getSupabaseClient } from "../services/db";
import { GoogleSearchService } from "../services/googleSearch";
import { LoveSpot, Database } from "../types/db";
import { getRegeoCode } from "../composables/gaodeMap";
import { log } from "@/utils/logger";
import { loveSpotState } from "@/types/common";
import { COLORS } from "../consts";

const supabaseClient = getSupabaseClient();
// Global table reference
const table = supabaseClient.from("loveMap");

export const useCreateLoveSpot = () => {
  const route = useRoute();
  const router = useRouter();
  const googleSearchService = new GoogleSearchService();

  // Get coordinates from query parameters
  let lat = route.query.lat as string;
  let lng = route.query.lng as string;
  const origin = route.query.origin;
  const selectedColor = ref('');
  const selectedColorName = ref('');
  const addressRef: Ref<string> = ref('');
  const contentRef: Ref<string> = ref('');
  const stateData = history.state! as loveSpotState;
  let uploadedPhotos: string[] = [];
  // Location document ID
  let loveSpotDocId: string;
  // for edit
  // when edit an existing loveSpot, state is set
  if (stateData.loveSpot) {
    lat = stateData.loveSpot.coordinates.lat.toString();
    lng = stateData.loveSpot.coordinates.lng.toString();
    addressRef.value = stateData.loveSpot.address;
    selectedColor.value = stateData.loveSpot.color;
    selectedColorName.value = COLORS.filter((colorObj) => colorObj.gradient === selectedColor.value)[0].name;
    contentRef.value = stateData.loveSpot.content;
    loveSpotDocId = stateData.loveSpot.id || "";
    uploadedPhotos = stateData.loveSpot.photos;
  }

  // Reactive data
  const loading: Ref<boolean> = ref(true);
  const uploadedPhotosRef: Ref<string[]> = ref(uploadedPhotos);
  const uploading: Ref<boolean> = ref(false);
  const uploadProgress: Ref<number> = ref(0);
  const showAllColors = ref(false);

  // Reverse geocode to get address
  const getAddress = async (): Promise<void> => {
    log("current coordinates:", lat, lng);
    log("adderss:", addressRef.value);
    console.log("bool value: ", Boolean(addressRef.value));
    if (!lat || !lng || addressRef.value) {
      console.log("skip geocoding");
      loading.value = false;
      return;
    }

    try {
      loading.value = true;
      log("origin:", origin);
      if (origin === "google") {
        addressRef.value = await googleSearchService.getAddress(lat, lng);
      } else if (origin === "gaode") {
        addressRef.value = await getRegeoCode(lat, lng);
      }
    } catch (error) {
      console.error("Error getting address:", error);
      addressRef.value = "Unable to load address";
    } finally {
      console.log("address:", addressRef.value);
      loading.value = false;
    }
  };

  // Copy coordinates to clipboard
  const copyCoordinates = async (): Promise<void> => {
    const coordString = `${lat}, ${lng}`;
    try {
      await navigator.clipboard.writeText(coordString);
      alert("Coordinates copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy coordinates:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = coordString;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("Coordinates copied to clipboard!");
    }
  };

  // Handle file selection
  const handleFileSelect = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      uploadPhotos(Array.from(files));
    }
  };

  // Upload multiple photos
  const uploadPhotos = async (files: File[]): Promise<void> => {
    uploading.value = true;
    uploadProgress.value = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const photoUrl = await uploadSinglePhoto(file);

        // Add photo to the array immediately after each upload
        uploadedPhotosRef.value.push(photoUrl);

        // Update progress for multiple files
        uploadProgress.value = Math.round(((i + 1) / files.length) * 100);
      }

      console.log("All photos uploaded successfully");
    } catch (error) {
      console.error("Error uploading photos:", error);
      alert("Failed to upload photos. Please try again.");
    } finally {
      uploading.value = false;
      // Reset file input
      const input = document.getElementById("photoInput") as HTMLInputElement;
      if (input) input.value = "";

      // Reset progress after a delay
      setTimeout(() => {
        uploadProgress.value = 0;
      }, 2000);
    }
  };

  // Upload single photo to Supabase Storage
  const uploadSinglePhoto = async (file: File): Promise<string> => {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop();
    const fileName = `location-photos/${timestamp}-${randomString}.${fileExtension}`;

    // Upload file to Supabase Storage
    const { error } = await supabaseClient.storage
      .from("photos") // Make sure you have a 'photos' bucket in Supabase Storage
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseClient.storage.from("photos").getPublicUrl(fileName);

    return publicUrl;
  };

  // Remove photo from list and Supabase Storage
  const removePhoto = async (index: number): Promise<void> => {
    const photo = uploadedPhotosRef.value[index];

    // Remove from local array immediately (photo disappears from UI)
    uploadedPhotosRef.value.splice(index, 1);

    // Delete from Supabase Storage in the background
    try {
      await deleteFromSupabase(photo);
      console.log("Photo deleted from Supabase Storage");
    } catch (error) {
      console.error("Error deleting photo from Supabase:", error);
    }
  };

  // Save location data to Supabase
  const saveToDatabase = async (): Promise<void> => {
    try {
      const locationData: LoveSpot = {
        coordinates: {
          lat: Number(lat),
          lng: Number(lng),
        },
        address: addressRef.value,
        photos: uploadedPhotosRef.value,
        content: contentRef.value,
        created_at: new Date(),
        color: selectedColor.value,
      };
      const loveSpots = JSON.parse(localStorage.getItem("loveSpots") || "[]");

      if (loveSpotDocId) {
        // Update existing record - exclude created_at from updates
        const updateData = {
          coordinates: locationData.coordinates,
          address: locationData.address,
          photos: locationData.photos,
          content: locationData.content,
          color: locationData.color,
        };
        const { error } = await table
          .update(updateData)
          .eq("id", loveSpotDocId);

        if (error) {
          throw error;
        }
        // update localStorage
        const toUpdateIndex = loveSpots.findIndex(
          (loveSpot) => loveSpot.id === loveSpotDocId
        );

        loveSpots[toUpdateIndex] = updateData;
      } else {
        // Create new record
        const insertData = {
          coordinates: locationData.coordinates,
          address: locationData.address,
          photos: locationData.photos,
          content: locationData.content,
          color: locationData.color,
        } as Database["public"]["Tables"]["loveMap"]["Insert"];
        const { error } = await table.insert(insertData);

        if (error) {
          throw error;
        }
        // update localStorage
        loveSpots.push(locationData);
      }
      localStorage.setItem("loveSpots", JSON.stringify(loveSpots));
      router.back();
    } catch (error) {
      console.error("Error saving to database:", error);
      alert("Failed to save location. Please try again.");
    }
  };

  // Delete photo from Supabase Storage
  const deleteFromSupabase = async (photoUrl: string): Promise<void> => {
    try {
      // Extract filename from URL
      const url = new URL(photoUrl);
      const pathParts = url.pathname.split("/");
      const fileName = pathParts[pathParts.length - 1];
      const filePath = `location-photos/${fileName}`;
      const { error } = await supabaseClient.storage
        .from("photos")
        .remove([filePath]);

      if (error) {
        throw error;
      }

      console.log("Photo deleted from Supabase Storage:", filePath);
    } catch (error) {
      console.error("Error deleting photo from Supabase Storage:", error);
    }
  };

  // Open in device's maps app
  const openInMaps = (): void => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, "_blank");
  };

  const goBack = () => {
    router.back();
  };
  const selectColor = (colorObj) => {
    log(colorObj)
    selectedColor.value = colorObj.gradient;
    selectedColorName.value = colorObj.name;
  };

  const updateAddress=(event)=>{
    addressRef.value=event.target.innerText
    log("address after edit",addressRef.value)
  }

  onMounted(() => {
    getAddress();
  });

  // Return all reactive values and functions that the component needs
  return {
    // Router
    router,

    // Reactive data
    selectedColor,
    showAllColors,
    selectedColorName,
    lat,
    lng,
    address: addressRef,
    loading,
    content: contentRef,
    uploadedPhotos: uploadedPhotosRef,
    uploading,
    uploadProgress,

    // Functions
    copyCoordinates,
    handleFileSelect,
    removePhoto,
    saveToDatabase,
    openInMaps,
    goBack,
    selectColor,
    updateAddress
  };
};
