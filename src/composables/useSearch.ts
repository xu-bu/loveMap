// composables/useSearch.ts
import { ref, computed, type Ref } from "vue";
import { SearchResult } from "../types/interfaces";
type AutocompletePrediction = google.maps.places.AutocompletePrediction;
import { PlacesApiService } from "../services/search";

// Main Search Composable
export function useSearch(
  location: Ref <{ lat: number; lng: number }|null> ,
  sharedZoom?: any
) {
  // Reactive data
  const searchQuery = ref("");
  const searchResult = ref<SearchResult | null>(null);
  const searchSuggestions = ref<AutocompletePrediction[]>([]);
  const showSuggestions = ref(false);
  const searchLoading = ref(false);
  const selectedSuggestionIndex = ref(-1);
  const mapRef = ref(null);
  const searchInput = ref<HTMLElement>();

  // Use shared zoom if provided, otherwise create local one
  const zoom = sharedZoom || ref(15);
  const mapCenter = computed(() => searchResult.value?.position);

  // Initialize Places API service
  const placesService = new PlacesApiService();
  let searchTimeout: NodeJS.Timeout | null = null;

  const onMapReady = () => {
    console.log("✅ Map ready - no additional setup needed for New Places API");
  };

  const onSearchInput = () => {
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    selectedSuggestionIndex.value = -1;

    if (!searchQuery.value.trim()) {
      searchSuggestions.value = [];
      showSuggestions.value = false;
      return;
    }

    // Wait 500ms before searching
    searchTimeout = setTimeout(() => {
      searchPlaces();
    }, 500);
  };

  const searchPlaces = async () => {
    if (!searchQuery.value.trim()) return;

    console.log("🔍 Starting search for:", searchQuery.value);
    searchLoading.value = true;

    try {
      const locationBias = location.value
        ? {
            lat: location.value.lat,
            lng: location.value.lng,
          }
        : undefined;

      const response = await placesService.autocomplete(
        searchQuery.value,
        locationBias
      );

      console.log("📍 Autocomplete response:", response);

      if (response.status === "OK" || response.predictions.length > 0) {
        searchSuggestions.value = response.predictions.slice(
          0,
          5
        ) as AutocompletePrediction[];
        showSuggestions.value = true;
        console.log("✅ Found suggestions:", searchSuggestions.value.length);
      } else {
        searchSuggestions.value = [];
        showSuggestions.value = false;
        console.log("❌ No suggestions found");
      }
    } catch (error) {
      console.error("❌ Search error:", error);
      searchSuggestions.value = [];
      showSuggestions.value = false;
    } finally {
      searchLoading.value = false;
    }
  };

  const selectSuggestion = async (suggestion: AutocompletePrediction) => {
    console.log("📍 Selecting suggestion:", suggestion);

    searchQuery.value = suggestion.description;
    showSuggestions.value = false;
    searchLoading.value = true;

    try {
      const placeDetails = await placesService.getPlaceDetails(
        suggestion.place_id
      );

      console.log("🏢 Place details:", placeDetails);

      if (placeDetails.status === "OK") {
        searchResult.value = {
          position: {
            lat: placeDetails.result.geometry.location.lat,
            lng: placeDetails.result.geometry.location.lng,
          },
          name: placeDetails.result.name,
          address: placeDetails.result.formatted_address,
          placeId: suggestion.place_id,
        };

        zoom.value = 17;
        console.log("✅ Place selected:", searchResult.value);
      }
    } catch (error) {
      console.error("❌ Error getting place details:", error);
    } finally {
      searchLoading.value = false;
    }
  };

  const onSearchFocus = () => {
    if (searchQuery.value && searchSuggestions.value.length > 0) {
      showSuggestions.value = true;
    }
  };

  const onSearchBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      showSuggestions.value = false;
    }, 150);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!showSuggestions.value || searchSuggestions.value.length === 0) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        selectedSuggestionIndex.value = Math.min(
          selectedSuggestionIndex.value + 1,
          searchSuggestions.value.length - 1
        );
        break;

      case "ArrowUp":
        event.preventDefault();
        selectedSuggestionIndex.value = Math.max(
          selectedSuggestionIndex.value - 1,
          -1
        );
        break;

      case "Enter":
        event.preventDefault();
        if (selectedSuggestionIndex.value >= 0) {
          selectSuggestion(
            searchSuggestions.value[selectedSuggestionIndex.value]
          );
        }
        break;

      case "Escape":
        showSuggestions.value = false;
        selectedSuggestionIndex.value = -1;
        searchInput.value?.blur();
        break;
    }
  };

  const clearSearch = () => {
    searchQuery.value = "";
    searchResult.value = null;
    searchSuggestions.value = [];
    showSuggestions.value = false;
    selectedSuggestionIndex.value = -1;
    zoom.value = 15;

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
  };

  const createAtSearchLocation = () => {
    if (searchResult.value) {
      console.log("Create at search location:", searchResult.value);
    }
  };

  return {
    searchQuery,
    searchResult,
    searchSuggestions,
    showSuggestions,
    searchLoading,
    selectedSuggestionIndex,
    mapRef,
    searchInput,
    mapCenter,
    zoom: sharedZoom ? undefined : zoom,
    onSearchInput,
    selectSuggestion,
    onSearchFocus,
    onSearchBlur,
    handleKeyDown,
    clearSearch,
    createAtSearchLocation,
    onMapReady,
  };
}
