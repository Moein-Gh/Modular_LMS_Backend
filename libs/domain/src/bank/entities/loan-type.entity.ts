export interface LoanType {
  id: string;
  name: string;
  commissionPercentage: string;
  defaultInstallments: number;
  maxInstallments: number;
  minInstallments: number;
  creditRequirementPct: string;
  description?: string | null;

  createdAt: Date;
  updatedAt: Date;
}
