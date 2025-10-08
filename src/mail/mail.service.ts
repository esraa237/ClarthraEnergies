import { MailerService } from '@nestjs-modules/mailer';
import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { MailMessages } from './constants/mail-messages';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(params: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }) {
    try {
      const from = process.env.SMTP_USER;
      if (!from) {
        throw new InternalServerErrorException(MailMessages.NO_SENDER);
      }
      if (!params.to) {
        throw new BadRequestException(MailMessages.NO_RECIPIENT);
      }

      const sendMailParams = {
        to: params.to,
        from: process.env.SMTP_USER,
        subject: params.subject,
        text: params.text,
        html: params.html,
      };
      await this.mailerService.sendMail(sendMailParams);
    } catch (error: unknown) {
      console.error(
        `Error while sending mail with the following parameters : ${JSON.stringify(
          params,
        )}`,
        error,
      );
      throw new InternalServerErrorException(MailMessages.FAILED_TO_SEND);
    }
  }
}
