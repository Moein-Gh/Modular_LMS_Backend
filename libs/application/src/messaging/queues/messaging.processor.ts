import { MessageStatus, RecipientStatus } from '@app/domain';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MessagingService } from '../services/messaging.service';
import {
  MessageJobData,
  MessageJobResult,
  ScheduledMessageJobData,
} from './messaging.queue';

@Injectable()
@Processor('messaging')
export class MessagingProcessor extends WorkerHost {
  private readonly logger = new Logger(MessagingProcessor.name);

  constructor(private readonly messagingService: MessagingService) {
    super();
  }

  /**
   * Main process method - routes jobs to specific handlers based on job.name
   */
  async process(job: Job): Promise<any> {
    switch (job.name) {
      case 'send-sms':
        return this.handleSendSms(job as Job<MessageJobData>);
      case 'send-email':
        return this.handleSendEmail(job as Job<MessageJobData>);
      case 'send-push':
        return this.handleSendPush(job as Job<MessageJobData>);
      case 'process-scheduled':
        return this.handleScheduledMessages(
          job as Job<ScheduledMessageJobData>,
        );
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  /**
   * Process SMS sending job
   */
  private async handleSendSms(
    job: Job<MessageJobData>,
  ): Promise<MessageJobResult> {
    this.logger.log(`Processing SMS job for recipient ${job.data.recipientId}`);

    try {
      // TODO: Integrate with SMS provider (e.g., Twilio, AWS SNS, etc.)
      // For now, we'll simulate sending
      await this.simulateSend(job.data);

      // Update recipient status
      await this.messagingService.updateRecipientStatus(job.data.recipientId, {
        status: RecipientStatus.SENT,
      });

      // If all recipients are SENT, mark parent message as SENT
      try {
        const msg = await this.messagingService.findById(job.data.messageId);
        if (
          msg.recipients &&
          msg.recipients.every((r) => r.status === RecipientStatus.SENT)
        ) {
          await this.messagingService.update(job.data.messageId, {
            status: MessageStatus.SENT,
            sentAt: new Date(),
          });
        }
      } catch (err) {
        this.logger.error(
          `Failed to update message status after sending recipient ${job.data.recipientId}: ${err}`,
        );
      }

      return {
        recipientId: job.data.recipientId,
        status: RecipientStatus.SENT,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send SMS to recipient ${job.data.recipientId}: ${error}`,
      );

      await this.messagingService.updateRecipientStatus(job.data.recipientId, {
        status: RecipientStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        recipientId: job.data.recipientId,
        status: RecipientStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process email sending job
   */
  private async handleSendEmail(
    job: Job<MessageJobData>,
  ): Promise<MessageJobResult> {
    this.logger.log(
      `Processing email job for recipient ${job.data.recipientId}`,
    );

    try {
      // TODO: Integrate with email provider (e.g., SendGrid, AWS SES, etc.)
      // For now, we'll simulate sending
      await this.simulateSend(job.data);

      await this.messagingService.updateRecipientStatus(job.data.recipientId, {
        status: RecipientStatus.SENT,
      });

      // If all recipients are SENT, mark parent message as SENT
      try {
        const msg = await this.messagingService.findById(job.data.messageId);
        if (
          msg.recipients &&
          msg.recipients.every((r) => r.status === RecipientStatus.SENT)
        ) {
          await this.messagingService.update(job.data.messageId, {
            status: MessageStatus.SENT,
            sentAt: new Date(),
          });
        }
      } catch (err) {
        this.logger.error(
          `Failed to update message status after sending recipient ${job.data.recipientId}: ${err}`,
        );
      }

      return {
        recipientId: job.data.recipientId,
        status: RecipientStatus.SENT,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send email to recipient ${job.data.recipientId}: ${error}`,
      );

      await this.messagingService.updateRecipientStatus(job.data.recipientId, {
        status: RecipientStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        recipientId: job.data.recipientId,
        status: RecipientStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process push notification sending job
   */
  private async handleSendPush(
    job: Job<MessageJobData>,
  ): Promise<MessageJobResult> {
    this.logger.log(
      `Processing push notification job for recipient ${job.data.recipientId}`,
    );

    try {
      // TODO: Integrate with push notification provider (e.g., Firebase, OneSignal, etc.)
      // For now, we'll simulate sending
      await this.simulateSend(job.data);

      await this.messagingService.updateRecipientStatus(job.data.recipientId, {
        status: RecipientStatus.SENT,
      });

      // If all recipients are SENT, mark parent message as SENT
      try {
        const msg = await this.messagingService.findById(job.data.messageId);
        if (
          msg.recipients &&
          msg.recipients.every((r) => r.status === RecipientStatus.SENT)
        ) {
          await this.messagingService.update(job.data.messageId, {
            status: MessageStatus.SENT,
            sentAt: new Date(),
          });
        }
      } catch (err) {
        this.logger.error(
          `Failed to update message status after sending recipient ${job.data.recipientId}: ${err}`,
        );
      }

      return {
        recipientId: job.data.recipientId,
        status: RecipientStatus.SENT,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send push notification to recipient ${job.data.recipientId}: ${error}`,
      );

      await this.messagingService.updateRecipientStatus(job.data.recipientId, {
        status: RecipientStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        recipientId: job.data.recipientId,
        status: RecipientStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process scheduled messages
   * This should run periodically to check for messages that need to be sent
   */
  private async handleScheduledMessages(
    job: Job<ScheduledMessageJobData>,
  ): Promise<void> {
    this.logger.log(`Processing scheduled message ${job.data.messageId}`);

    try {
      const message = await this.messagingService.findById(job.data.messageId);

      if (!message.recipients) {
        this.logger.warn(`Message ${job.data.messageId} has no recipients`);
        return;
      }

      // Process each recipient synchronously for now (BullMQ not configured).
      for (const recipient of message.recipients) {
        const jobData: MessageJobData = {
          messageId: message.id,
          // keep type for logging
          type: message.type,
          recipientId: recipient.id,
          userId: recipient.userId ?? undefined,
          phone: recipient.phone ?? undefined,
          email: recipient.email ?? undefined,
          content: message.content,
          subject: message.subject ?? undefined,
        };

        try {
          // simulate sending immediately
          await this.simulateSend(jobData);
          await this.messagingService.updateRecipientStatus(recipient.id, {
            status: RecipientStatus.SENT,
          });
          this.logger.log(
            `Processed ${message.type} for recipient ${recipient.id}`,
          );
        } catch (err) {
          await this.messagingService.updateRecipientStatus(recipient.id, {
            status: RecipientStatus.FAILED,
            errorMessage: err instanceof Error ? err.message : 'Unknown error',
          });
          this.logger.error(
            `Failed processing ${message.type} for recipient ${recipient.id}: ${err}`,
          );
        }
      }

      // Update message status if all recipients are SENT
      try {
        const refreshed = await this.messagingService.findById(message.id);
        if (
          refreshed.recipients &&
          refreshed.recipients.every((r) => r.status === RecipientStatus.SENT)
        ) {
          await this.messagingService.update(message.id, {
            status: MessageStatus.SENT,
            sentAt: new Date(),
          });
        }
      } catch (err) {
        this.logger.error(
          `Failed to update message status after scheduled processing for ${message.id}: ${err}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to process scheduled message ${job.data.messageId}: ${error}`,
      );
      throw error;
    }
  }

  /**
   * Simulate sending a message (for testing without external providers)
   */
  private async simulateSend(data: MessageJobData): Promise<void> {
    this.logger.debug(
      `Simulating send for ${data.type}: ${JSON.stringify(data)}`,
    );
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    // Randomly fail 5% of the time to test error handling
    if (Math.random() < 0.05) {
      throw new Error('Simulated send failure');
    }
  }
}
