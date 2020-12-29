import { Injectable } from "@nestjs/common";

@Injectable()
export class Config {
    p = {
        "flutterwave.base.url": "https://live.moneywaveapi.co/v1",
        "bitcoin.testnet": false,
        "xendcredit.api.url": "https://xendcredit-prod.herokuapp.com",
        "xendchain.server.url": "https://lb.xendbit.net/geth",
        "ethereum.server.url": "https://mainnet.infura.io/v3/3fa594a20e104a479791fc67c5f4afef",
        "bitcoin.server.url": "http://45.77.90.120",
        "bitcoin.port": 8332,
        "bitcoin.timeout": 120000,
        "ngnc.contract.address": "0x61f67f8902650f4baf783bdf85264175326589e3",
        "contractor": "0xC04915f6b3ff85b50A863eB1FcBF368171539413",
        "email.confirmation.url": "https://xendfilb.xendbit.net/api/user/confirm-email",
        "BTC": {
            "min.xend.fees": 5.0,
            "min.block.fees": 0.00005,
            "external.deposit.fees": 300,
            "perc.external.trading.fees": 0.001,
            "max.xend.fees": 100.0,
            "perc.xend.fees": 0.005,
            "external.withdrawal.fees": 0.0005,
            "xend.fees.address": "16buz7mpfGz1mtfTrRFLkGSEUP6njC8hhX",
        },
        "ETH": {
            "min.xend.fees": 5.0,
            "min.block.fees": 0.00005,
            "external.deposit.fees": 300,
            "perc.external.trading.fees": 0.001,
            "max.xend.fees": 100.0,
            "perc.xend.fees": 0.005,
            "external.withdrawal.fees": 0.005,
            "xend.fees.address": "0xC04915f6b3ff85b50A863eB1FcBF368171539413",
        },
        "cloudinary": {
            cloud_name: 'xendbit',
            api_key: '289875491748246',
            api_secret: 'tZILi09rvlogXGuTMkP7x0MrhTA'
        }        
    };

    erc20Abi = [
        {
            "constant": true,
            "inputs": [],
            "name": "name",
            "outputs": [
                {
                    "name": "",
                    "type": "string"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_spender",
                    "type": "address"
                },
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "approve",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "totalSupply",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_from",
                    "type": "address"
                },
                {
                    "name": "_to",
                    "type": "address"
                },
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "transferFrom",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "decimals",
            "outputs": [
                {
                    "name": "",
                    "type": "uint8"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
                {
                    "name": "_owner",
                    "type": "address"
                }
            ],
            "name": "balanceOf",
            "outputs": [
                {
                    "name": "balance",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "symbol",
            "outputs": [
                {
                    "name": "",
                    "type": "string"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_to",
                    "type": "address"
                },
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "transfer",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [
                {
                    "name": "_owner",
                    "type": "address"
                },
                {
                    "name": "_spender",
                    "type": "address"
                }
            ],
            "name": "allowance",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "payable": true,
            "stateMutability": "payable",
            "type": "fallback"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "name": "owner",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "name": "spender",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "name": "value",
                    "type": "uint256"
                }
            ],
            "name": "Approval",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "name": "from",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "name": "to",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "name": "value",
                    "type": "uint256"
                }
            ],
            "name": "Transfer",
            "type": "event"
        }
    ];

    constructor() {
    }
}