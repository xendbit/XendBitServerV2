export class OrdersRequest {
    emailAddress: string;
    password: string;
    wallet: string;
    sellOrderTransactionId?: string;
    status?: string;
}