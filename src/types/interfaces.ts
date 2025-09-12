// Type definitions for Google Places API
export interface AutocompletePrediction {
  place_id: string
  description: string
  structured_formatting?: {
    main_text: string
    secondary_text: string
  }
  types: string[]
}

export interface AutocompleteResponse {
  predictions: AutocompletePrediction[]
  status: string
}

export interface PlaceDetails {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  types: string[]
}

export interface PlaceDetailsResponse {
  result: PlaceDetails
  status: string
}

export interface PlacePrediction {
  place_id: string
  description: string
  structured_formatting?: {
    main_text: string
    secondary_text: string
  }
}

export interface SearchResult {
  position: {
    lat: number
    lng: number
  }
  name?: string
  address?: string
  placeId: string
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