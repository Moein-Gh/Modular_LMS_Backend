import {
  MessageTemplateService,
  MessagingService,
} from '@app/application/messaging';
import { appName, LoanApprovedEvent, MessageType } from '@app/domain';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LoansService } from '../services/loans.service';

@Injectable()
export class LoanApprovedHandler {
  private readonly logger = new Logger(LoanApprovedHandler.name);

  constructor(
    private readonly messagingService: MessagingService,
    private readonly loansService: LoansService,
    private readonly messageTemplateService: MessageTemplateService,
  ) {}

  @OnEvent('loan.approved')
  async handle(event: LoanApprovedEvent): Promise<void> {
    try {
      // Get loan details
      const loan = await this.loansService.findById(event.loanId);

      // Get message template (optional)
      const messageTemplate = await this.messageTemplateService.findByName(
        'loan_approval_SMS_fa',
      );

      // Prepare message input. Prefer template if available, otherwise send a simple content fallback.
      const messageInput =
        messageTemplate && messageTemplate.isActive
          ? {
              type: MessageType.PUSH_NOTIFICATION,
              templateId: messageTemplate.id,
              userIds: [loan.userId],
              metadata: {
                amount: loan.amount,
                appName,
              },
            }
          : {
              type: MessageType.PUSH_NOTIFICATION,
              content: `Your loan of ${loan.amount} has been approved.`,
              userIds: [loan.userId],
              metadata: { amount: loan.amount, appName },
            };

      await this.messagingService.sendMessage(messageInput);

      this.logger.log(
        `Loan approval notification sent to user ${loan.userId} for loan ${loan.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send loan approval notification for loan ${event.loanId}`,
        error,
      );
      // Don't throw - we don't want to fail the loan approval process if messaging fails
    }
  }
}
