export interface LoveSpot {
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

export interface Database {
  public: {
    Tables: {
      loveMap: {
        Row: LoveSpot & { id: string };
        Insert: LoveSpot;
        Update: Partial<LoveSpot>;
      };
    };
  };
}