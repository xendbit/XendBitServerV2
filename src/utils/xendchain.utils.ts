import { Injectable } from "@nestjs/common";
import Web3 from 'web3';
import { Config } from "./config";

@Injectable()
export class XendChainUtils {
    ngncContract;
    ngncContractAddress;
    web3;
    erc20Abi;
    contractor;
    contractorPassword;

    constructor(private config: Config) {
        this.web3 = new Web3(this.config.p["xendchain.url"]);
        this.erc20Abi = this.config.erc20Abi;
        this.ngncContractAddress = this.config.p["ngnc.contract.address"];
        this.ngncContract = new this.web3.eth.Contract(this.erc20Abi, this.ngncContractAddress);
        this.contractor = this.config.p["contractor"];
        this.contractorPassword = process.env.CONTRACTOR_PASSWORD;
    }

    getNgncBalance(address: string): Promise<number> {
        return new Promise(async (resolve, reject) => {
            try {
                const balance = await this.ngncContract.methods.balanceOf(address).call({ from: address });
                // value is in kobo....divide by 100 to get naira
                resolve(Math.round(balance / 100));
            } catch (error) {
                reject(error);
            }
        })
    }

    async importPrivateKey(pk: string) {
        try {
            await this.web3.eth.personal.importRawKey(pk.replace('0x', ''), process.env.KEY_IMPORT_PASSWORD);
        } catch (error) {
            console.log(error);
        }
    }
}