// composables/useGaodeSearch.ts
import { ref, computed, type Ref } from "vue";
import { SearchResult } from "../types/google";
import { log } from "@/utils/logger";

// Gaode Web Service API response interfaces
interface GaodePOI {
  id: string;
  name: string;
  type: string;
  typecode: string;
  address: string;
  location: string; // "lng,lat" format
  tel: string;
  distance: string;
  biz_type: string;
  pname: string; // Province name
  cityname: string;
  adname: string; // District name
  importance: string;
  shopid: string;
  shopinfo: string;
  poiweight: string;
}

interface GaodeSearchResponse {
  status: string;
  count: string;
  info: string;
  infocode: string;
  suggestion?: {
    keywords: string[];
    cities: Array<{
      name: string;
      num: string;
      citycode: string;
      adcode: string;
    }>;
  };
  pois: GaodePOI[];
}

// Simplified search result for suggestions
interface GaodeSearchResult {
  id: string;
  name: string;
  district: string;
  address: string;
  location: string; // "lng,lat" format
  fullAddress: string;
}

// Main Gaode Search Composable
export function useGaodeSearch(
  location: Ref<{ lat: number; lng: number } | null>,
  sharedZoom?: Ref<number>
) {
  // Reactive data
  const searchQuery = ref("");
  const searchResult = ref<SearchResult | null>(null);
  const searchSuggestions = ref<GaodeSearchResult[]>([]);
  const showSuggestions = ref(false);
  const searchLoading = ref(false);
  const selectedSuggestionIndex = ref(-1);
  const searchInput = ref<HTMLElement>();

  // Use shared zoom if provided, otherwise create local one
  const zoom = sharedZoom || ref(15);
  const mapCenter = computed(() => searchResult.value?.position);

  // Gaode Web Service API configuration
  const VITE_GAODE_WEB_SERVICE_API_KEY = import.meta.env.VITE_GAODE_WEB_SERVICE_API_KEY;
  const GAODE_API_BASE_URL = "https://restapi.amap.com/v3";

  let searchTimeout: NodeJS.Timeout | null = null;

  // Build search URL with parameters
  const buildSearchUrl = (keywords: string, cityName?: string): string => {
    const params = new URLSearchParams({
      key: VITE_GAODE_WEB_SERVICE_API_KEY,
      keywords: keywords.trim(),
      offset: "10", // Limit to 10 results for suggestions
      page: "1",
      extensions: "base", // Use base for faster response
      citylimit: "false", // Allow results from other cities
    });

    // Add city parameter if current location is available or city is specified
    if (cityName) {
      params.append("city", cityName);
    } else if (location.value) {
      // Use coordinates as city context (Gaode will find the nearest city)
      params.append("city", `${location.value.lng},${location.value.lat}`);
    }

    return `${GAODE_API_BASE_URL}/place/text?${params.toString()}`;
  };

  // Search places using Gaode Web Service API
  const searchPlaces = async (keywords: string, cityName?: string): Promise<GaodeSearchResult[]> => {
    if (!keywords.trim()) return [];

    try {
      const url = buildSearchUrl(keywords, cityName);
      console.log("🔍 Gaode API request URL:", url);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GaodeSearchResponse = await response.json();
      
      console.log("📍 Gaode API response:", data);

      // Check if the request was successful
      if (data.status !== "1") {
        console.error("❌ Gaode API error:", data.info, "Code:", data.infocode);
        return [];
      }

      // Process POI results
      if (data.pois && data.pois.length > 0) {
        const results = data.pois.map((poi): GaodeSearchResult => {
          // Build full address from available components
          const addressParts = [
            poi.pname, // Province
            poi.cityname, // City
            poi.adname, // District
            poi.address // Detailed address
          ].filter(part => part && part.trim()); // Remove empty parts

          const fullAddress = addressParts.join("");
          
          return {
            id: poi.id,
            name: poi.name,
            district: `${poi.pname}${poi.cityname}${poi.adname}`,
            address: poi.address || "",
            location: poi.location,
            fullAddress: fullAddress
          };
        });

        console.log("✅ Processed search results:", results.length);
        return results;
      }

      // Handle suggestion results when no exact matches found
      if (data.suggestion && data.suggestion.keywords.length > 0) {
        console.log("💡 Gaode returned suggestions:", data.suggestion.keywords);
        // You could implement a second search with suggested keywords here
        return [];
      }

      return [];

    } catch (error) {
      console.error("❌ Gaode search error:", error);
      return [];
    }
  };

  // Handle search input with debouncing
  const onSearchInput = (): void => {
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

    // Wait 300ms before searching to avoid too many requests
    searchTimeout = setTimeout(async () => {
      await performSearch();
    }, 300);
  };

  // Perform the actual search
  const performSearch = async (): Promise<void> => {
    if (!searchQuery.value.trim()) return;

    console.log("🔍 Starting Gaode search for:", searchQuery.value);
    searchLoading.value = true;

    try {
      const suggestions = await searchPlaces(searchQuery.value);
      
      if (suggestions.length > 0) {
        searchSuggestions.value = suggestions;
        showSuggestions.value = true;
        console.log("✅ Found suggestions:", suggestions.length);
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

  // Select a suggestion from the dropdown
  const selectSuggestion = async (suggestion: GaodeSearchResult): Promise<void> => {
    console.log("📍 Selecting Gaode suggestion:", suggestion);

    searchQuery.value = suggestion.name;
    showSuggestions.value = false;
    searchLoading.value = true;

    try {
      // Parse location string "lng,lat"
      const [lng, lat] = suggestion.location.split(',').map(Number);

      if (isNaN(lat) || isNaN(lng)) {
        throw new Error("Invalid location format");
      }

      searchResult.value = {
        position: {
          lat: lat,
          lng: lng,
        },
        name: suggestion.name,
        address: suggestion.fullAddress,
        placeId: suggestion.id,
      };

      // Set zoom level for selected place
      if (!sharedZoom) {
        zoom.value = 17;
      }

      console.log("✅ Gaode place selected:", searchResult.value);
    } catch (error) {
      console.error("❌ Error processing Gaode place:", error);
    } finally {
      searchLoading.value = false;
    }
  };

  // Handle search input focus
  const onSearchFocus = (): void => {
    if (searchQuery.value && searchSuggestions.value.length > 0) {
      showSuggestions.value = true;
    }
  };

  // Handle search input blur
  const onSearchBlur = (): void => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      showSuggestions.value = false;
    }, 150);
  };

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (event: KeyboardEvent): void => {
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
        if (searchInput.value) {
          (searchInput.value as HTMLInputElement).blur();
        }
        break;
    }
  };

  // Clear search results and input
  const clearSearch = (): void => {
    searchQuery.value = "";
    searchResult.value = null;
    searchSuggestions.value = [];
    showSuggestions.value = false;
    selectedSuggestionIndex.value = -1;
    
    if (!sharedZoom) {
      zoom.value = 15;
    }

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
  };

  // Create love spot at search location
  const createAtSearchLocation = (): void => {
    if (searchResult.value) {
      console.log("Create at search location:", searchResult.value);
      // This function should be implemented to navigate to create page
      // You might want to emit an event or call a router.push here
    }
  };

  // Map ready handler (not needed for Web Service API)
  const onMapReady = (): void => {
    console.log("✅ Map ready - Web Service API doesn't need initialization");
  };

  return {
    // Reactive refs
    searchQuery,
    searchResult,
    searchSuggestions,
    showSuggestions,
    searchLoading,
    selectedSuggestionIndex,
    searchInput,
    mapCenter,
    zoom: sharedZoom ? undefined : zoom,

    // Methods
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