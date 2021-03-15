import Web3 from 'web3';
require('dotenv').config();

export class NonceManager {
    private static NONCE = {};

    static async init() {
    }

    static async getNonce(web3: Web3, address: string): Promise<number> {
        if (NonceManager.NONCE[address] === undefined) {
            const nonce = await web3.eth.getTransactionCount(address);
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
