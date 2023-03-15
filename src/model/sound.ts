export interface Sound {
  id: number;
  created_at: string;
  latitude: number;
  longitude: number;
  enabled: boolean;
  filename: string;
  url: string;
  description?: string;
}
