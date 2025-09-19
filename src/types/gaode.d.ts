// Global type declarations for Gaode Maps
export declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: {
      securityJsCode: string;
    };
    __GLOBAL_MAP_INSTANCE__: any;
    __GLOBAL_MAP_PLUGINS__: any;
  }
}

// Gaode Maps API types
interface AMapInstance {
  Map: new (container: string | HTMLElement, options: any) => any;
  Marker: new (options: any) => any;
  InfoWindow: new (options: any) => any;
  AutoComplete: new (options: any) => any;
  PlaceSearch: new (options: any) => any;
  ToolBar: new (options: any) => any;
  Scale: new (options: any) => any;
  Geolocation: new (options: any) => any;
  Geocoder: new (options: any) => any;
  plugin: (plugins: string | string[], callback: () => void) => void;
}

// Component types
interface GaodePOI {
  id: string;
  name: string;
  district?: string;
  address?: string;
  location: {
    lng: number;
    lat: number;
  };
  tel?: string;
  type?: string;
  distance?: number;
}

interface SelectedPlace {
  name: string;
  address?: string;
  tel?: string;
  type?: string;
  distance?: number;
}
