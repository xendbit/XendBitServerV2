import { Injectable, Logger } from '@nestjs/common';
import { Config } from 'src/services/config.service';
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
            const url = this.config.p["providus.api.url"] + "/providus/new-account";
            const authHeader = "Api-Key " + process.env.PROVIDUS_KEY;

            const headers: IHeaders = {
                "content-type": "application/json",
                "Accept": "application/json",
                "Authorization": authHeader
            };

            const fields = {
                "first_name": firstName,
                "last_name": lastName,
                "middle_name": middleName,
                "bvn": bvn,
                "email": email
            };

            const postData = JSON.stringify(fields);

            this.logger.debug("URL: " + url);

            const res = await this.httpService.post(url, postData, headers);
            if (res.message.statusCode === 200) {
                const body = await res.readBody();
                const parsed = JSON.parse(body)[0];
                this.logger.debug(parsed);
                if (parsed.detail !== undefined) {
                    throw Error(parsed.detail);
                } else {
                    if (parsed.IsSuccessful !== undefined || parsed.IsSuccessful === true || parsed.IsSuccessful === "true") {
                        return parsed.Message.AccountNumber;
                    } else {
                        throw Error(JSON.stringify(parsed.responseMessage));
                    }
                }
            } else {
                const body = await res.readBody();
                throw Error(body);
            }
        } catch (error) {
            throw error;
        }
    }
}
