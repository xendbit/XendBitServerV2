import { Injectable, Logger } from '@nestjs/common';
import { HttpClient } from 'typed-rest-client/HttpClient';
import { enc, HmacSHA256 } from 'crypto-js';
import { IHeaders } from 'typed-rest-client/Interfaces';
require('dotenv').config();

@Injectable()
export class PaxfulService {
    private readonly logger = new Logger(PaxfulService.name);
    apiKey: string;
    apiSecret: string;
    baseUrl: string;

    httpService: HttpClient;

    constructor() {
        this.httpService = new HttpClient('Providus API');
        this.apiKey = process.env.PAXFUL_KEY;
        this.apiSecret = process.env.PAXFUL_SECRET;
        this.logger.debug(this.apiKey);
        this.logger.debug(this.apiSecret);
        this.baseUrl = process.env.PAXFUL_URL;
        this.listOffers('buy');
    }

    async listOffers(offerType: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                let searchParams: Record<string, string> = {
                    "active": "true",
                    "nonce": Date.now() + "",
                    "offer_type": "buy",
                    "apikey": this.apiKey
                };

                searchParams = {
                    ...searchParams,
                    ...{ apiseal: HmacSHA256(new URLSearchParams(searchParams).toString(), this.apiSecret).toString(enc.Hex) }
                }

                const payload = new URLSearchParams(searchParams).toString();
                
                let url = this.baseUrl + "/offer/list";

                const headers: IHeaders = {
                    "content-type": "text/plain",
                    "Accept": "application/json; version=1"
                };

                this.logger.debug(url);
                this.logger.debug(payload);
                //const rb = "apikey=0npX1NDnPz0hblxKsmNhgWy8Lir60owv&nonce=1616420854486&active=true&offer_type=buy&apiseal=4067441dc8c84575b80c5fc6ceb0d63d546fc4c0d01da4c748b526c1093a8a58";
                const res = await this.httpService.post(url, payload, headers);
                this.logger.debug("Posted URL");
                this.logger.debug(res.message.statusCode);
                if (res.message.statusCode === 200) {
                    const body = await res.readBody();
                    const parsed = JSON.parse(body);
                    this.logger.debug(parsed);
                } else {
                    const body = await res.readBody();
                    this.logger.debug(body);
                    throw Error(JSON.parse(body).error);
                }
                resolve("OK");
            } catch (error) {
                reject(error);
            }
        });
    }

    private getRequestBody(keys: string[], values: string[]): any {
        let body = "apiKey=" + this.apiKey + "&nonce=" + Date.now();
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const value = values[i];
            body += `&${key}=${value}`;
        }

        const seal = HmacSHA256(body, this.apiSecret).toString(enc.Hex);
        return body + "&apiSeal=" + seal;
    }
}
