export interface CompanyRequest {
  id: string;
  title: string;
  requesterCompanyId: string;
  requesterName: string;
  requestType: string;
  description: string;
  status: string;
  availableFrom: Date;
  availableTo: Date;
  pictures: string[]; 
  region?: string;
  capacity?: number;
  unit?: string;
  serviceType?: string;
  priceFrom?: number;
  priceTo?: number;
  workMode?: string;
  urgent?: boolean;
  responsesCount?: number;
  requiredFields: string[];
  files?: {
    url: string;
    isImage: boolean;
    name: string;
  }[];
  
  fileUrls?: string[];
  pictureUrls?: string[];
}