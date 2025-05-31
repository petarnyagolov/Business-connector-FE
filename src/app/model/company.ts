export interface Company {
    id?: number; 
    vatNumber: string;
    name: string;
    country: string;
    city: string;
    address: string;
    creatorPosition?: string; // Added
    logoPath?: string; // Added
    logo?: string; // Added for backend compatibility
    industry: string;
    description: string;
    phone: string;
    email: string;
  }