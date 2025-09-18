import { ref, computed, onMounted, type Ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getSupabaseClient } from "../services/db";
import { GoogleSearchService } from "../services/googleSearch";
import { LocationData, PhotoData, Database } from "../types/db";
import { getRegeoCode } from "../composables/gaodeMap";
import { log } from "@/utils/logger";

const supabaseClient = getSupabaseClient();
// Global table reference
const table = supabaseClient.from("loveMap");

export const useCreateLoveSpot = () => {
  const route = useRoute();
  const router = useRouter();
  const googleSearchService = new GoogleSearchService();

  // Get coordinates from query parameters
  const lat = computed(() => route.query.lat as string);
  const lng = computed(() => route.query.lng as string);
  const origin = computed(() => route.query.origin as string);
  const address = computed(() => route.query.address as string);

  // Reactive data
  const addressRef: Ref<string> = ref(address.value);
  const loading: Ref<boolean> = ref(true);
  const content: Ref<string> = ref("");
  const uploadedPhotos: Ref<PhotoData[]> = ref([]);
  const uploading: Ref<boolean> = ref(false);
  const uploadProgress: Ref<number> = ref(0);

  // Location document ID
  const locationDocId: string | null = null;

  // Reverse geocode to get address
  const getAddress = async (): Promise<void> => {
    log(addressRef.value);
    if (!lat.value || !lng.value || addressRef.value) {
      loading.value = false;
      return;
    }

    try {
      loading.value = true;
      if (origin.value === "google") {
        addressRef.value = await googleSearchService.getAddress(
          lat.value,
          lng.value
        );
      } else if (origin.value === "gaode") {
        addressRef.value = await getRegeoCode(lat.value, lng.value);
      }
    } catch (error) {
      console.error("Error getting address:", error);
      addressRef.value = "Unable to load address";
    } finally {
      loading.value = false;
    }
  };

  // Copy coordinates to clipboard
  const copyCoordinates = async (): Promise<void> => {
    const coordString = `${lat.value}, ${lng.value}`;
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
        uploadedPhotos.value.push({
          url: photoUrl,
          uploadedAt: new Date(),
        });

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
    const photo = uploadedPhotos.value[index];

    // Remove from local array immediately (photo disappears from UI)
    uploadedPhotos.value.splice(index, 1);

    // Delete from Supabase Storage in the background
    try {
      await deleteFromSupabase(photo.url);
      console.log("Photo deleted from Supabase Storage");
    } catch (error) {
      console.error("Error deleting photo from Supabase:", error);
    }
  };

  // Save location data to Supabase
  const saveToDatabase = async (): Promise<void> => {
    try {
      const locationData: LocationData = {
        coordinates: {
          lat: Number(lat.value),
          lng: Number(lng.value),
        },
        address: addressRef.value,
        photos: uploadedPhotos.value.map((photo) => photo.url), // Array of Supabase URLs
        content: content.value,
        created_at: new Date(),
      };

      if (locationDocId) {
        // Update existing record - exclude created_at from updates
        const updateData = {
          coordinates: locationData.coordinates,
          address: locationData.address,
          photos: locationData.photos,
          content: locationData.content,
        };

        const { error } = await table
          .update(updateData)
          .eq("id", locationDocId);

        if (error) {
          throw error;
        }

        alert("Location updated successfully!");
      } else {
        // Create new record
        const insertData = {
          coordinates: locationData.coordinates,
          address: locationData.address,
          photos: locationData.photos,
          content: locationData.content,
        } as Database["public"]["Tables"]["loveMap"]["Insert"];

        const { error } = await table.insert(insertData).select();

        if (error) {
          throw error;
        }

        alert("Location saved successfully!");
      }
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
    const url = `https://www.google.com/maps?q=${lat.value},${lng.value}`;
    window.open(url, "_blank");
  };

  onMounted(() => {
    // Get address if coordinates are available
    if (lat.value && lng.value) {
      getAddress();
    }
  });

  // Return all reactive values and functions that the component needs
  return {
    // Router
    router,

    // Computed values
    lat,
    lng,

    // Reactive data
    address: addressRef,
    loading,
    content,
    uploadedPhotos,
    uploading,
    uploadProgress,

    // Functions
    copyCoordinates,
    handleFileSelect,
    removePhoto,
    saveToDatabase,
    openInMaps,
  };
};
