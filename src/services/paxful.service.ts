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
        this.baseUrl = process.env.PAXFUL_URL;
        //this.listOffers('buy');
    }

    async listOffers(offerType: string): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {

                let url = this.baseUrl + "/offer/list";
                const keys = ['active', 'offer_type'];
                const values = ['true', offerType];
                const seal = this.getRequestBody(keys, values);

                const headers: IHeaders = {
                    "content-type": "text/plain",
                    "Accept": "application/json; version=1"
                };

                const fields = {
                    "active": true,
                    "offer_type": offerType,
                    "apiKey": this.apiKey,
                    "nonce": Date.now(),
                    "apiseal": seal
                }

                const postData = JSON.stringify(fields);

                this.logger.debug(url);
                this.logger.debug(postData);
                const res = await this.httpService.post(url, postData, headers);
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
        return seal;//body + "&apiSeal=" + seal;
    }
}
