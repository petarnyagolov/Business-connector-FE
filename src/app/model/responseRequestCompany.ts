export interface ResponseRequestCompany {
  id: string;
  responseText: string;
  responserCompanyId: string;
  fixedPrice?: number | null;
  priceFrom?: number | null;
  priceTo?: number | null;
  pictureUrls?: string[];
  requestCompany: RequestCompanyDto;
  availableTo?: number[] | null; // LocalDateTime as [yyyy, MM, dd, HH, mm]
  availableFrom?: number[] | null; // LocalDateTime as [yyyy, MM, dd, HH, mm]
}

export interface RequestCompanyDto {
  id: string;
  title: string;
  requesterCompanyId: string;
  requestType: string;
  region: string;
  description: string;
  status?: string;
  availableFrom?: number[] | null; // LocalDateTime as [yyyy, MM, dd, HH, mm]
  availableTo?: number[] | null;   // LocalDateTime as [yyyy, MM, dd, HH, mm]
  workMode: string;
  serviceType: string;
  capacity?: number | null;
  unit: string;
  priceFrom?: number | null;
  priceTo?: number | null;
  fixedPrice?: number | null;
  pictureUrls?: string[];
  choiceResponseId?: string;
  requiredFields?: string[];
}
