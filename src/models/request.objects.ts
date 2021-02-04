import { SIDE } from "src/utils/enums";

export class GenericRequestObject {
    passphrase?: string;
}

export class LoginRequestObject {
    emailAddress: string;
    password: string;
    passphrase: string;
}

export class UserRequestObject {
    accountNumber: string;
    bvn: string;
    accountType: string;
    bankCode: string;
    bankName: string;
    country?: string;
    dateRegistered: number;
    emailAddress: string;
    enableWhatsapp: boolean
    firstName: string;
    idImage: string;
    idNumber: string;
    idType: string;
    middleName: string;
    passphrase: string;
    password: string;
    phoneNumber: string;
    referralCode: string;
    surName: string;
    walletType: string;
}

export class OrdersRequest {
    emailAddress: string;
    password: string;
    wallet: string;
    sellOrderTransactionId?: string;
    status?: string;
}

export class SendCoinsRequestObject {
    amountToSend: number;
    blockFees: number;
    buyerToAddress: string;
    emailAddress: string;
    password: string;
    xendFees: number;
    fromCoin: string;
}

export class SwapTokenRequestObject {
    emailAddress: string;
    password: string;
    fromAddress: string;
    toAddress: string;
    amountIn: number;
}

export class TradeRequestObject {
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
    emailAddress: string
    password: string;
    networkAddress: string
    orderType: string;
    side: SIDE;    
}

export class WithdrawRequestObject {
    btcValue: number;
    emailAddress: string;
    password: string;       
}