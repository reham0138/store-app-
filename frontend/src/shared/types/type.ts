export interface Branch {
  id: string;
  name: string;
  code?: string;
  address?: string;
  isDefault?: boolean;
  latitude?: number;
  longitude?: number;
  operationalStatus?: "open" | "closed";
}
