import { Injectable } from "@nestjs/common";

@Injectable()
export class Config {   
    p;

    constructor() {
        this.p = {
            "flutterwave.base.url": "https://live.moneywaveapi.co/v1",
            "bitcoin.testnet": false,
            "xendcredit.api.url": "https://xendcredit-prod.herokuapp.com",
            "BTC": {
                "min.xend.fees": 5.0,
                "min.block.fees": 0.00005,
                "external.deposit.fees": 300,
                "perc.external.trading.fees": 0.001,
                "max.xend.fees": 100.0,
                "perc.xend.fees": 0.005,
                "external.withdrawal.fees": 0.0005
            },
            "ETH": {
                "min.xend.fees": 5.0,
                "min.block.fees": 0.00005,
                "external.deposit.fees": 300,
                "perc.external.trading.fees": 0.001,
                "max.xend.fees": 100.0,
                "perc.xend.fees": 0.005,
                "external.withdrawal.fees": 0.005
            }
        }         
    }
}