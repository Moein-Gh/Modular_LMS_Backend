/**
 * User Payment Summary DTO
 * Provides a high-level overview of user's payment obligations
 * for dashboard display
 */
export interface PaymentSummaryDto {
  upcomingAmount: string;
  upcomingDueDate: Date | null;
  overdueAmount: string;
  totalDueAmount: string;
}
