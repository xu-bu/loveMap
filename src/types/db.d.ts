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

export interface PhotoData {
  url: string;
  uploadedAt: Date;
}

export interface Database {
  public: {
    Tables: {
      loveMap: {
        Row: LocationData & { id: string };
        Insert: LocationData;
        Update: Partial<LocationData>;
      };
    };
  };
}