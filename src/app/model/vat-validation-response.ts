/**
 * Response from VAT validation endpoint
 */
export interface VatValidationResponse {
  countryCode: string;
  vatNumber: string;
  requestDate: string;
  valid: boolean;
  requestIdentifier: string;
  name: string;
  address: string;
  traderName?: string;
  traderStreet?: string;
  traderPostalCode?: string;
  traderCity?: string;
  traderCompanyType?: string;
  traderNameMatch?: string;
  traderStreetMatch?: string;
  traderPostalCodeMatch?: string;
  traderCityMatch?: string;
  traderCompanyTypeMatch?: string;
}
