// Gaode Web Service API response interfaces
export interface GaodeIPLocation {
  location: Array
}

export interface GaodeSearchResponse {
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
export interface GaodeSearchResult {
  id: string;
  name: string;
  district: string;
  address: string;
  location: string; // "lng,lat" format
  fullAddress: string;
}