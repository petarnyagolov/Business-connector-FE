/**
 * Company Invoice Data model
 * Stores invoice-specific information that can be changed without affecting the main Company entity
 */
export interface CompanyInvoiceData {
  id?: string;
  companyId: string;
  invoiceName: string;
  vatNumber: string; 
  invoiceAddress: string;
  mol?: string; 
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  lastModifiedBy?: string;
}

/**
 * DTO for creating/updating company invoice data
 */
export interface CompanyInvoiceDataDto {
  id?: string;
  companyId: string;
  invoiceName: string;
  vatNumber: string;
  invoiceAddress: string;
  mol?: string;
}
