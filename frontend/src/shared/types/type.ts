export interface Branch {
  id: string;
  name: string;
  code?: string;          
  address?: string;
  isDefault?: boolean;    
  parentId?: string | null;
  latitude?: number;
  longitude?: number;
}