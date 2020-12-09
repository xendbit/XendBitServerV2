import { Injectable, Logger } from '@nestjs/common';
import { parse } from 'path';
import { Config } from 'src/utils/config';
import { HttpClient } from 'typed-rest-client/HttpClient';
import { IHeaders } from 'typed-rest-client/Interfaces';

@Injectable()
export class ProvidusBankService {
    private readonly logger = new Logger(ProvidusBankService.name);

    httpService: HttpClient;

    constructor(private config: Config) {
        this.httpService = new HttpClient('MoneyWave API');
    }

    async createBankAccount(bvn: string, firstName: string, lastName: string, middleName: string, email: string): Promise<string> {
        try {
            const url = this.config.p["xendcredit.api.url"] + "/providus/new-account";
            const username = process.env.XEND_CREDIT_API_USERNAME;
            const password = process.env.XEND_CREDIT_API_PASSWORD;

            const auth = username + ":" + password;
            const encodedAuth = Buffer.from(auth).toString('base64');
            const authHeader = "Basic " + encodedAuth;

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
                "isAgent": false,
                "email": email
            };

            const postData = JSON.stringify(fields);

            this.logger.debug("URL: " + url);

            const res = await this.httpService.post(url, postData, headers);
            if (res.message.statusCode === 200) {
                const body = await res.readBody();
                const parsed = JSON.parse(body);
                if (parsed.detail !== undefined) {
                    throw Error("Can not get NGNC Account Number: " + parsed.detail);
                } else {
                    if (parsed.isSuccessful === true) {
                        return parsed.message.AccountNumber;
                    } else {
                        throw Error("Can not get NGNC Account Number: " + body);
                    }
                }
            } else {
                const body = await res.readBody();
                throw Error("Can not get NGNC Account Number: " + body);
            }
        } catch (error) {
            throw error;
        }
    }
}
