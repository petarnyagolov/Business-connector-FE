export interface CreditPackage {
  id?: number;
  code: string;
  nameBg: string;
  nameEn: string;
  credits: number;
  priceWithVat: number;
  priceWithoutVat: number;
  vatRate: number;
  sortOrder: number;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreditTransaction {
  type: string;
  creditsDelta: number;
  description: string;
  paymentId?: string;
  requestCompanyId?: string;
  createdAt: Date;
}

export interface UserCreditsSummary {
  userId: number;
  email: string;
  freeCredits: number;
  transactions: UserCreditTransaction[];
}

export interface BonusCreditsRequest {
  credits: number;
  reason?: string;
}

export interface UserDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  freeCredits: number;
  referralCode: string;
}

export interface FindUserRequest {
  emailPart?: string;
  phoneNumber?: string;
  enabled?: boolean;
  lang?: string;
}
