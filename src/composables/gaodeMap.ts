// services/gaodeMapService.ts
import { AMapInstance } from "../types/gaode";
import axios from "axios";

// Global state for Gaode Maps
let isAPILoaded = false;
let isAPILoading = false;
let apiLoadPromise: Promise<AMapInstance> | null = null;

// Configuration
const GAODE_API_KEY = import.meta.env.VITE_GAODE_API_KEY;
const GAODE_SECURITY_CODE = import.meta.env.VITE_GAODE_SECURITY_KEY;
const VITE_GAODE_WEB_SERVICE_API_KEY = import.meta.env.VITE_GAODE_WEB_SERVICE_API_KEY;

export let geocoder;

/**
 * Load Gaode Maps API only once globally
 */
export const loadGaodeAPI = (): Promise<AMapInstance> => {
  // If already loaded, return immediately
  if (isAPILoaded && window.AMap) {
    return Promise.resolve(window.AMap as AMapInstance);
  }

  // If currently loading, return the existing promise
  if (isAPILoading && apiLoadPromise) {
    return apiLoadPromise;
  }

  // Start loading
  isAPILoading = true;
  apiLoadPromise = new Promise((resolve, reject) => {
    // Set security config
    window._AMapSecurityConfig = {
      securityJsCode: GAODE_SECURITY_CODE,
    };

    const script = document.createElement("script");
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${GAODE_API_KEY}&plugin=AMap.AutoComplete,AMap.PlaceSearch,AMap.ToolBar,AMap.Scale,AMap.Geolocation,AMap.Geocoder`;
    script.async = true;

    script.onload = () => {
      isAPILoaded = true;
      isAPILoading = false;
      console.log("✅ Gaode Maps API loaded globally");
      resolve(window.AMap as AMapInstance);
    };

    script.onerror = () => {
      isAPILoading = false;
      apiLoadPromise = null;
      reject(new Error("Failed to load Gaode Maps API"));
    };

    document.head.appendChild(script);
  });

  return apiLoadPromise;
};

/**
 * Check if API is ready
 */
export const isGaodeAPIReady = (): boolean => {
  return isAPILoaded && !!window.AMap;
};

/**
 * Create plugin instances (reusable)
 */
export const createMapPlugins = (map: any, AMap: AMapInstance) => {
  // Initialize ToolBar
  const toolbar = new AMap.ToolBar({
    position: "RT", // Right Top
  });
  map.addControl(toolbar);

  // Initialize Scale
  const scale = new AMap.Scale({
    position: "LB", // Left Bottom
  });
  map.addControl(scale);

  // Initialize AutoComplete
  const autoComplete = new AMap.AutoComplete({
    city: "全国",
    citylimit: false,
  });

  // Initialize PlaceSearch
  const placeSearch = new AMap.PlaceSearch({
    city: "全国",
    citylimit: false,
    map: map,
    panel: false,
    renderStyle: {
      marker: {
        clickable: true,
      },
    },
  });

  // Initialize Geolocation
  const geolocation = new AMap.Geolocation({
    enableHighAccuracy: true,
    timeout: 10000,
  });

  geocoder = new AMap.Geocoder({
    city: "全国", // or specific city code like "010"
  });

  return {
    toolbar,
    scale,
    autoComplete,
    placeSearch,
    geolocation,
    geocoder,
  };
};

export async function getRegeoCode(lat, lng) {
  const url = `https://restapi.amap.com/v3/geocode/regeo?location=${lng},${lat}&key=${VITE_GAODE_WEB_SERVICE_API_KEY}`;
  const config = {
    method: "get",
    url,
  };
  const {data}= await axios.request(config);
  return data.regeocode.formatted_address as string
}
