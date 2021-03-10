import Web3 from 'web3';
require('dotenv').config();

export class NonceManager {
    private static NONCE = {};
    private static web3: Web3;

    static async init () {
        NonceManager.web3 = new Web3(process.env.WEB3_URL);
        NonceManager.NONCE[process.env.XEND_ADDRESS] = (await this.web3.eth.getTransactionCount(process.env.XEND_ADDRESS)) - 1;
        console.log("--Nonces--");
        console.log(NonceManager.NONCE);
    }

    static async getNonce(address: string): Promise<number> {
        if(NonceManager.NONCE[address] === undefined) {
            const nonce = await this.web3.eth.getTransactionCount(address);
            console.log(`Nonce: ${nonce}`);
            NonceManager.NONCE[address] = nonce;
            return nonce;
        } else {
            NonceManager.NONCE[address] = NonceManager.NONCE[address] + 1;
            console.log(`NonceManager,NONCE: ${NonceManager.NONCE[address]}`);
            return NonceManager.NONCE[address];
        }        
    }
}

NonceManager.init();
