import {
  PlaceDetailsResponse,
  AutocompleteResponse,
} from "../types/interfaces";

// Internal Places API Service Class
export class PlacesApiService {
  private baseUrl = "https://places.googleapis.com/v1";
  private apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

  async autocomplete(
    input: string,
    location?: { lat: number; lng: number }
  ): Promise<AutocompleteResponse> {
    const url = new URL(`${this.baseUrl}/places:autocomplete`);

    const requestBody = {
      input,
      ...(location && {
        locationBias: {
          circle: {
            center: { latitude: location.lat, longitude: location.lng },
            radius: 50000, // 50km
          },
        },
      }),
    };

    try {
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Places API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Autocomplete error:", error);
      return { predictions: [], status: "ERROR" };
    }
  }

  async getPlaceDetails(placeId: string): Promise<PlaceDetailsResponse> {
    const url = `${this.baseUrl}/places/${placeId}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask": "id,displayName,formattedAddress,location,types",
        },
      });

      if (!response.ok) {
        throw new Error(`Places API error: ${response.status}`);
      }

      const data = await response.json();

      // Transform to match old API structure
      return {
        result: {
          place_id: data.id,
          name: data.displayName?.text || "",
          formatted_address: data.formattedAddress || "",
          geometry: {
            location: {
              lat: data.location?.latitude || 0,
              lng: data.location?.longitude || 0,
            },
          },
          types: data.types || [],
        },
        status: "OK",
      };
    } catch (error) {
      console.error("Place details error:", error);
      return {
        result: {} as PlaceDetailsResponse["result"],
        status: "ERROR",
      };
    }
  }
}
