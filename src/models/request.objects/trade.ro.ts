import { SIDE, WALLET_TYPE } from "src/utils/enums";

export class TradeRequestObject {
    amountToSpend: number;
    xendFees: number;
    blockFees: number;
    fees: number;
    amountToGet: number;
    sellerFromAddress: string;
    sellerToAddress: string;
    fromCoin: WALLET_TYPE;
    toCoin: WALLET_TYPE;
    rate: number;
    emailAddress: string
    password: string;
    networkAddress: string
    orderType: string;
    side: SIDE;    
}