// types/google.d.ts - Type definitions for Google Places API

declare global {
  interface Window {
    google: {
      maps: {
        places: {
          AutocompleteService: new () => GoogleAutocompletService;
          PlacesService: new (map: any) => GooglePlacesService;
          PlacesServiceStatus: {
            OK: string;
            ZERO_RESULTS: string;
            OVER_QUERY_LIMIT: string;
            REQUEST_DENIED: string;
            INVALID_REQUEST: string;
            NOT_FOUND: string;
            UNKNOWN_ERROR: string;
          };
        };
      };
    };
  }

  interface GoogleAutocompletService {
    getPlacePredictions(
      request: {
        input: string;
        location?: { lat: number; lng: number };
        radius?: number;
        types?: string[];
      },
      callback: (predictions: PlacePrediction[] | null, status: string) => void
    ): void;
  }

  interface GooglePlacesService {
    getDetails(
      request: { placeId: string; fields?: string[] },
      callback: (place: PlaceDetails | null, status: string) => void
    ): void;
  }
}

// Type definitions for Google Places API
export interface SuggestionsList {
  suggestions: { placePrediction: PlacePrediction }[];
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
}

export interface PlaceDetailsResponse {
  result: PlaceDetails;
  status: string;
}

export interface PlacePrediction {
  place: string;
  placeId: string;
  text: {
    text: string;
    matches: { endOffset: number }[];
  };
  structuredFormat: {
    mainText: {
      text: string;
      matches: { endOffset: number }[];
    };
    secondaryText: {
      text: string;
    };
  };
  types: string[];
}

export interface SearchResult {
  position: {
    lat: number;
    lng: number;
  };
  name?: string;
  address?: string;
  placeId: string;
}

export interface LocationData {
  id?: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  photos: string[];
  content: string;
  created_at?: Date;
}