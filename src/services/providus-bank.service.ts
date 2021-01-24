import { Injectable, Logger } from '@nestjs/common';
import { Config } from 'src/services/config.service';
import { HttpClient } from 'typed-rest-client/HttpClient';
import { IHeaders } from 'typed-rest-client/Interfaces';

@Injectable()
export class ProvidusBankService {
    private readonly logger = new Logger(ProvidusBankService.name);

    httpService: HttpClient;

    constructor(private config: Config) {
        this.httpService = new HttpClient('Providus API');
    }

    async createBankAccount(bvn: string, firstName: string, lastName: string, middleName: string, email: string): Promise<string> {
        try {
            const url = this.config.p["providus.api.url"] + "/providus/new-account";
            const authHeader = "Api-Key " + process.env.PROVIDUS_KEY;

            const headers: IHeaders = {
                "content-type": "application/json",
                "Accept": "application/json",
                "Authorization": authHeader
            };

            const fields = {
                "firstName": firstName,
                "lastName": lastName,
                "middleName": middleName,
                "bvn": bvn,
                "email": email,
                "fundingUrl": this.config.p['ngnc.funding.url'],
                "apiKey": process.env.ENCRYPTED,
            };

            const postData = JSON.stringify(fields);

            this.logger.debug("URL: " + url);

            const res = await this.httpService.post(url, postData, headers);
            if (res.message.statusCode === 201) {
                const body = await res.readBody();
                const parsed = JSON.parse(body);
                if (parsed.accountNumber !== undefined) {
                    return parsed.accountNumber;
                } else {
                    throw Error(JSON.stringify(parsed));
                }
            } else {
                const body = await res.readBody();
                throw Error(JSON.parse(body).error);
            }
        } catch (error) {
            throw error;
        }
    }
}
