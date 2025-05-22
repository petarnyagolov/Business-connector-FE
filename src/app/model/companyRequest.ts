export interface CompanyRequest {
  id: string
  title: string
  requesterVatNumber: string
  requesterName: string
  requestType: string
  description: string
  status: string
  activeFrom: Date
  activeTo : Date
  pictures: File[];

}