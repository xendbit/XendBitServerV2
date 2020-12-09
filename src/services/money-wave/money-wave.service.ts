import { Injectable, Logger } from '@nestjs/common';
import { parse } from 'path';
import { Config } from 'src/utils/config';
import { HttpClient } from 'typed-rest-client/HttpClient';
import { IHeaders } from 'typed-rest-client/Interfaces';

@Injectable()
export class MoneyWaveService {
    private readonly logger = new Logger(MoneyWaveService.name);

    httpService: HttpClient;

    authToken: string = null;

    constructor(private config: Config) {
        this.httpService = new HttpClient('MoneyWave API');
    }

    async authenticate(): Promise<string> {
        try {
            if (this.authToken !== null && this.authToken != undefined) {
                return this.authToken;
            }

            const url = this.config.p["flutterwave.base.url"] + "/merchant/verify";

            const fields = {
                'apiKey': process.env.FLUTTERWAVE_API_KEY,
                'secret': process.env.FLUTTERWAVE_API_SECRET
            }

            const postData = JSON.stringify(fields);

            const headers: IHeaders = {
                "content-type": "application/json",
                "Accept": "application/json"
            }

            const res = await this.httpService.post(url, postData, headers);
            if (res.message.statusCode === 200) {
                const body = await res.readBody();
                const parsed = JSON.parse(body);
                if (parsed.status === "success") {
                    this.authToken = parsed.token;
                    return this.authToken;
                } else {
                    throw Error("Can not validate user bank account number - " + parsed.status + " - " + body);
                }
            } else {
                const body = await res.readBody();
                throw Error("Can not validate user bank account number -- " + res.message.statusMessage + " -- " + body);
            }
        } catch (error) {
            throw error;
        }
    }

    async verifyBankAccount(accountNumber: string, bankCode: string): Promise<string> {
        try {
            const url = this.config.p["flutterwave.base.url"] + "/resolve/account";

            const fields = {
                'account_number': accountNumber,
                'bank_code': bankCode
            }
            const postData = JSON.stringify(fields);

            this.authToken = await this.authenticate();
            const headers: IHeaders = {
                "content-type": "application/json",
                "Accept": "application/json",
                "Authorization": this.authToken
            }

            const res = await this.httpService.post(url, postData, headers);
            if (res.message.statusCode === 200) {
                const body = await res.readBody();
                const parsed = JSON.parse(body);

                if (parsed.status === 'success') {
                    return parsed.data.account_name;
                } else {
                    throw Error("Can not validate user bank account number - " + parsed.status + " - " + body);
                }
            } else {
                const body = await res.readBody();
                const parsed = JSON.parse(body);
                if(parsed.status === "error" && parsed.code === "RESOLVE_ERROR") {
                    throw Error("Can not get account name for provided account number and bank");
                }
                throw Error("Can not validate user bank account number -- " + res.message.statusMessage + " -- " + body);
            }
        } catch (error) {
            throw error;
        }
    }
}
