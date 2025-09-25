export interface loveSpot {
  id?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  photos: string[];
  content: string;
  color: string;
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
        Row: loveSpot & { id: string };
        Insert: loveSpot;
        Update: Partial<loveSpot>;
      };
    };
  };
}