import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { AES } from 'crypto-js';
import { readFileSync } from 'fs';
import { User } from 'src/models/user.entity';
import { Config } from 'src/utils/config';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    constructor(private readonly mailerService: MailerService, private config: Config) {}

    async sendConfirmationEmail(dbUser: User) {
        let content = readFileSync('/etc/xendbit/confirmation_email.html', 'utf8');
        const link =  this.config.p["email.confirmation.url"] + "/" + AES.encrypt(dbUser.email, process.env.KEY).toString();
        const name = dbUser.fullName;
        content = content.replace("#link", link).replace("#name", name).replace('#link', link);
        this.logger.debug(content);

        const subjectLine = "Congratulations: Welcome to XendBit";
        await this.sendEmail(dbUser.email, subjectLine, content, [])
    }

    async sendEmail(to: string, subject: string, content: string, cc: string[]) {
        await this.mailerService.sendMail({
          to: to,
          cc: cc,
          from: process.env.MAIL_USER,
          subject: subject,
          text: content,
          html: content
        });  
    }
}
