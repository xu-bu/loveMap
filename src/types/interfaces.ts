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
