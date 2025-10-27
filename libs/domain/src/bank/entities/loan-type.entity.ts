export interface LoanType {
  id: string;
  code: number;
  name: string;
  commissionPercentage: number;
  defaultInstallments: number;
  maxInstallments: number;
  minInstallments: number;
  creditRequirementPct: number;
  description?: string | null;

  createdAt: Date;
  updatedAt: Date;
}
