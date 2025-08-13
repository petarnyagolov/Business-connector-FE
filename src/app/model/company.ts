export interface Company {
    id?: string; // Changed from number to string to support UUID
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
    employeesSize?: string; // Added for employees size
    phone: string;
    email: string;
  }