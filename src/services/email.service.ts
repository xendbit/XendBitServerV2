import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { AES } from 'crypto-js';
import { readFileSync } from 'fs';
import { AddressMapping } from 'src/models/address.mapping.entity';
import { BinanceOrder } from 'src/models/binance.order.entity';
import { User } from 'src/models/user.entity';
import { Withdraw } from 'src/models/withdraw.entity';
import { Config } from 'src/services/config.service';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    constructor(private readonly mailerService: MailerService, private config: Config) {}

    async sendConfirmationEmail(dbUser: User) {
        let content = readFileSync('/etc/xendbit/confirmation_email.html', 'utf8');
        const link =  this.config.p["email.confirmation.url"] + "/" + Buffer.from(AES.encrypt(dbUser.email, process.env.KEY).toString()).toString('base64');
        const name = dbUser.fullName;
        content = content.replace("#link", link).replace("#name", name).replace('#link', link);
        this.logger.debug(content);

        const subjectLine = "Congratulations: Welcome to XendBit";
        await this.sendEmail(dbUser.email, subjectLine, content, [])
    }

    async sendWithdrawalEmail(w: Withdraw) {
        let content = readFileSync('/etc/xendbit/withdrawal.html', 'utf8');
        const link= this.config.p['withdrawal.processed.url'] + "/" + w.id;
        content = content.replace("#userId", w.userId + "");
        content = content.replace("#withdrawalId", w.withdrawalId);
        content = content.replace("#amount", w.amount + "");
        content = content.replace("#accountName", w.bankAccountName);
        content = content.replace("#accountNumber", w.bankAccountNumber);
        content = content.replace("#bankName", w.bankName);
        content = content.replace("#bankCode", w.bankCode);
        content = content.replace("#withdrawal_processed_link", link);

        this.logger.debug(content);
        const subjectLine = "New Withdrawal Request";
        const cc: string[] = [
            "seguna@xendbit.com", "akintayo.segun@gmail.com", "aonibudo@gmail.com"
        ];
        await this.sendEmail("bolaji@xendbit.com", subjectLine, content, cc)                
    }

    async sendBinanceEmail(bo: BinanceOrder) {
        const am: AddressMapping = bo.user.addressMappings.find((x: AddressMapping) => {
            return x.chain === 'ETH';
        });

        let content = readFileSync('/etc/xendbit/binance_order.html', 'utf8');
        content = content.replace("#side", bo.side);
        content = content.replace("#quantity", bo.quantity + "");
        content = content.replace("#quoteOrderQtty", bo.quoteOrderQty + "");
        content = content.replace("#price", bo.price + "");
        content = content.replace("#coin", bo.coin + "");
        content = content.replace("#wallet", am.chainAddress);
        content = content.replace("#status", bo.status);
        content = content.replace("#user", bo.user.email);

        this.logger.debug(content);
        const subjectLine = "New Binance Buy-Order";
        const cc: string[] = [
            "seguna@xendbit.com", "akintayo.segun@gmail.com", "aonibudo@gmail.com"
        ];
        await this.sendEmail("bolaji@xendbit.com", subjectLine, content, cc)        
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
