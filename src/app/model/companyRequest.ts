export interface CompanyRequest {
  id: string
  title: string
  requesterCompanyId: string
  requesterName: string
  requestType: string
  description: string
  status: string
  activeFrom: Date
  activeTo : Date
  pictures: File[];

}