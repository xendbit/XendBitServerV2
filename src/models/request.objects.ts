import { SIDE } from "src/utils/enums";

abstract class BaseRequestObject {
    emailAddress: string;
    password: string;       
}

export class GenericRequestObject {
    passphrase?: string;
}

export class LoginRequestObject extends BaseRequestObject {
    passphrase: string;
}

export class UserRequestObject extends BaseRequestObject {
    passphrase: string;
    accountNumber?: string;
    bvn?: string;
    accountType?: string;
    bankCode?: string;
    bankName?: string;
    country?: string;
    dateRegistered: number;
    enableWhatsapp: boolean
    firstName?: string;
    idImage?: string;
    idNumber?: string;
    idType?: string;
    middleName?: string;
    phoneNumber?: string;
    referralCode: string;
    surName?: string;
    walletType: string;
}

export class OrdersRequest extends BaseRequestObject {
    wallet: string;
    sellOrderTransactionId?: string;
    status?: string;
}

export class SendCoinsRequestObject extends BaseRequestObject {
    amountToSend: number;
    blockFees: number;
    buyerToAddress: string;
    xendFees: number;
    fromCoin: string;
}

export class SwapTokenRequestObject extends BaseRequestObject {
    fromAddress: string;
    toAddress: string;
    amountIn: number;
}

export class TradeRequestObject extends BaseRequestObject {
    amountToSpend: number;
    xendFees: number;
    blockFees: number;
    fees: number;
    amountToGet: number;
    sellerFromAddress: string;
    sellerToAddress: string;
    fromCoin: string;
    toCoin: string;
    rate: number;
    networkAddress: string
    orderType: string;
    side: SIDE;    
}

export class WithdrawRequestObject extends BaseRequestObject {
    btcValue: number;
}

export class StakeRequestObject extends BaseRequestObject {
    amount?: number;
}