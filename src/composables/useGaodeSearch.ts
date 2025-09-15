// composables/useGaodeSearch.ts
import { ref, computed, type Ref } from "vue";
import { SearchResult } from "../types/interfaces";
import { log } from "@/utils/logger";

// Gaode search result interface
interface GaodeSearchResult {
  id: string;
  name: string;
  district: string;
  address: string;
  location: string; // "lng,lat" format
  adcode: string;
  citycode: string;
  typecode: string;
}

// Main Gaode Search Composable
export function useGaodeSearch(
  location: Ref<{ lat: number; lng: number } | null>,
  sharedZoom?: any
) {
  // Reactive data
  const searchQuery = ref("");
  const searchResult = ref<SearchResult | null>(null);
  const searchSuggestions = ref<GaodeSearchResult[]>([]);
  const showSuggestions = ref(false);
  const searchLoading = ref(false);
  const selectedSuggestionIndex = ref(-1);
  const mapRef = ref(null);
  const searchInput = ref<HTMLElement>();

  // Use shared zoom if provided, otherwise create local one
  const zoom = sharedZoom || ref(15);
  const mapCenter = computed(() => searchResult.value?.position);

  // Gaode API key - used in loadGaodeAPI function
  const GAODE_API_KEY = import.meta.env.VITE_GAODE_API_KEY;

  let searchTimeout: NodeJS.Timeout | null = null;
  let placeSearch: any = null;
  let autoComplete: any = null; // Will be used for input suggestions

  // Load Gaode Map API - HERE'S WHERE THE API KEY IS USED
  const loadGaodeAPI = () => {
    return new Promise((resolve, reject) => {
      if (window.AMap) {
        resolve(window.AMap);
        return;
      }

      const script = document.createElement('script');
      // API KEY IS USED HERE
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${GAODE_API_KEY}&plugin=AMap.PlaceSearch,AMap.Autocomplete`;
      script.async = true;
      script.onload = () => resolve(window.AMap);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const initGaodeServices = () => {
    if (window.AMap && !placeSearch) {
      placeSearch = new window.AMap.PlaceSearch({
        city: '全国',
        pageSize: 5,
      });

      // NOW WE USE autoComplete FOR INPUT SUGGESTIONS
      autoComplete = new window.AMap.Autocomplete({
        city: '全国',
      });
    }
  };

  const onMapReady = () => {
    console.log("✅ Gaode Map ready - initializing search services");
    initGaodeServices();
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
      searchPlacesWithAutocomplete(); // Use autocomplete for faster suggestions
    }, 500);
  };

  // USE AUTOCOMPLETE FOR FASTER SUGGESTIONS
  const searchPlacesWithAutocomplete = async () => {
    if (!searchQuery.value.trim()) return;

    console.log("🔍 Starting Gaode autocomplete for:", searchQuery.value);
    searchLoading.value = true;

    try {
      await loadGaodeAPI(); // Ensure API is loaded
      initGaodeServices();

      if (!autoComplete) {
        console.error("AutoComplete not initialized");
        return;
      }

      // Set city based on current location if available
      if (location.value) {
        autoComplete.setCity([location.value.lng, location.value.lat]);
      }

      const autocompletePromise = new Promise<GaodeSearchResult[]>((resolve) => {
        autoComplete.search(searchQuery.value, (status: string, result: any) => {
          if (status === 'complete' && result.tips) {
            const suggestions = result.tips.slice(0, 5)
              .filter((tip: any) => tip.location) // Only include results with location
              .map((tip: any) => ({
                id: tip.id || tip.adcode,
                name: tip.name,
                district: tip.district || '',
                address: tip.address || '',
                location: tip.location.toString(), // "lng,lat"
                adcode: tip.adcode || '',
                citycode: tip.citycode || '',
                typecode: tip.typecode || '',
              }));
            resolve(suggestions);
          } else {
            resolve([]);
          }
        });
      });

      const suggestions = await autocompletePromise;
      
      console.log("📍 Gaode autocomplete response:", suggestions);

      if (suggestions.length > 0) {
        searchSuggestions.value = suggestions;
        showSuggestions.value = true;
        console.log("✅ Found autocomplete suggestions:", searchSuggestions.value.length);
      } else {
        // Fallback to PlaceSearch if autocomplete fails
        await searchPlacesWithPlaceSearch();
      }
    } catch (error) {
      console.error("❌ Gaode autocomplete error:", error);
      // Fallback to PlaceSearch
      await searchPlacesWithPlaceSearch();
    } finally {
      searchLoading.value = false;
    }
  };

  // FALLBACK PLACE SEARCH METHOD
  const searchPlacesWithPlaceSearch = async () => {
    if (!searchQuery.value.trim()) return;

    console.log("🔍 Fallback to Gaode PlaceSearch for:", searchQuery.value);

    try {
      if (!placeSearch) {
        console.error("PlaceSearch not initialized");
        return;
      }

      // Set city based on current location if available
      if (location.value) {
        placeSearch.setCity([location.value.lng, location.value.lat]);
      }

      const searchPromise = new Promise<GaodeSearchResult[]>((resolve) => {
        placeSearch.search(searchQuery.value, (status: string, result: any) => {
          if (status === 'complete' && result.poiList?.pois) {
            const suggestions = result.poiList.pois.slice(0, 5).map((poi: any) => ({
              id: poi.id,
              name: poi.name,
              district: poi.pname + poi.cityname + poi.adname,
              address: poi.address,
              location: poi.location.toString(), // "lng,lat"
              adcode: poi.adcode,
              citycode: poi.citycode,
              typecode: poi.typecode,
            }));
            resolve(suggestions);
          } else {
            resolve([]);
          }
        });
      });

      const suggestions = await searchPromise;
      
      if (suggestions.length > 0) {
        searchSuggestions.value = suggestions;
        showSuggestions.value = true;
        console.log("✅ Found PlaceSearch suggestions:", searchSuggestions.value.length);
      } else {
        searchSuggestions.value = [];
        showSuggestions.value = false;
        console.log("❌ No suggestions found");
      }
    } catch (error) {
      console.error("❌ Gaode PlaceSearch error:", error);
      searchSuggestions.value = [];
      showSuggestions.value = false;
    }
  };

  const selectSuggestion = async (suggestion: GaodeSearchResult) => {
    console.log("📍 Selecting Gaode suggestion:", suggestion);

    searchQuery.value = suggestion.name;
    showSuggestions.value = false;
    searchLoading.value = true;

    try {
      // Parse location string "lng,lat"
      const [lng, lat] = suggestion.location.split(',').map(Number);

      searchResult.value = {
        position: {
          lat: lat,
          lng: lng,
        },
        name: suggestion.name,
        address: suggestion.district + suggestion.address,
        placeId: suggestion.id,
      };

      zoom.value = 17;
      console.log("✅ Gaode place selected:", searchResult.value);
    } catch (error) {
      console.error("❌ Error processing Gaode place:", error);
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
    log(event.key);
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
      // This function should be implemented similar to your Google Maps version
      // You might want to call a router.push or emit an event
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
    loadGaodeAPI, // Export this so it can be used in the component
  };
}