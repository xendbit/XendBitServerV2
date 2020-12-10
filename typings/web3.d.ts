declare module 'web3' {
    import BigNumber = require('bn.js');
    import us = require('underscore');
  interface Account {
    address: string;
    privateKey: string;
    publicKey: string;
  }

  interface Signature {
    message: string;
    hash: string;
    r: string;
    s: string;
    v: string;
  }

  interface PrivateKey {
    address: string;
    Crypto: {
      cipher: string;
      ciphertext: string;
      cipherparams: {
        iv: string;
      };
      kdf: string;
      kdfparams: {
        dklen: number;
        n: number;
        p: number;
        r: number;
        salt: string;
      };
      mac: string;
    };
    id: string;
    version: number;
  }

  interface CustomOptions {
    address?: string;
    jsonInterface?: ABIDefinition[];
    data?: string;
    from?: string;
    gasPrice?: string;
    gas?: number;
  }

  interface contractOptions {
    address: string;
    jsonInterface: ABIDefinition[];
    data: string;
    from: string;
    gasPrice: string;
    gas: number;
  }

  class Contract {
    constructor(
      jsonInterface: any[],
      address?: string,
      options?: CustomOptions
    );
    options: contractOptions;
    methods: {
      [fnName: string]: (...args: any[]) => TransactionObject<any>;
    };
    deploy(options: {
      data: string;
      arguments: any[];
    }): TransactionObject<Contract>;
    events: {
      [eventName: string]: (
        options?: {
          filter?: object;
          fromBlock?: BlockType;
          topics?: string[];
        },
        cb?: Callback<EventLog>
      ) => EventEmitter;
      allEvents: (
        options?: {
          filter?: object;
          fromBlock?: BlockType;
          topics?: string[];
        },
        cb?: Callback<EventLog>
      ) => EventEmitter;
    };
    getPastEvents(
      event: string,
      options?: {
        filter?: object;
        fromBlock?: BlockType;
        toBlock?: BlockType;
        topics?: string[];
      },
      cb?: Callback<EventLog[]>
    ): Promise<EventLog[]>;
    setProvider(provider: Provider): void;
  }

  interface Eth {
    defaultAccount: string;
    defaultBlock: BlockType;
    BatchRequest: new () => BatchRequest;
    Iban: Iban;
    Contract: new (
      jsonInterface: any[],
      address?: string,
      options?: CustomOptions
    ) => Contract;
    abi: ABI;
    setProvider: (provider: Provider) => void;
    accounts: Accounts;
    call(
      callObject: Tx,
      defaultBloc?: BlockType,
      callBack?: Callback<string>
    ): Promise<string>;
    clearSubscriptions(): boolean;
    subscribe(
      type: 'logs',
      options?: Logs,
      callback?: Callback<Subscribe<Log>>
    ): Promise<Subscribe<Log>>;
    subscribe(
      type: 'syncing',
      callback?: Callback<Subscribe<any>>
    ): Promise<Subscribe<any>>;
    subscribe(
      type: 'newBlockHeaders',
      callback?: Callback<Subscribe<BlockHeader>>
    ): Promise<Subscribe<BlockHeader>>;
    subscribe(
      type: 'pendingTransactions',
      callback?: Callback<Subscribe<Transaction>>
    ): Promise<Subscribe<Transaction>>;
    subscribe(
      type: 'pendingTransactions' | 'newBlockHeaders' | 'syncing' | 'logs',
      options?: Logs,
      callback?: Callback<Subscribe<any>>
    ): Promise<Subscribe<any>>;

    unsubscribe(callBack: Callback<boolean>): void | boolean;
    compile: {
      solidity(
        source: string,
        callback?: Callback<CompileResult>
      ): Promise<CompileResult>;
      lll(
        source: string,
        callback?: Callback<CompileResult>
      ): Promise<CompileResult>;
      serpent(
        source: string,
        callback?: Callback<CompileResult>
      ): Promise<CompileResult>;
    };
    currentProvider: Provider;
    estimateGas(tx: Tx, callback?: Callback<number>): Promise<number>;
    getAccounts(cb?: Callback<string[]>): Promise<string[]>;
    getBalance(
      address: string,
      defaultBlock?: BlockType,
      cb?: Callback<number>
    ): Promise<number>;
    getBlock(
      number: BlockType,
      returnTransactionObjects?: boolean,
      cb?: Callback<Block>
    ): Promise<Block>;
    getBlockNumber(callback?: Callback<number>): Promise<number>;
    getBlockTransactionCount(
      number: BlockType | string,
      cb?: Callback<number>
    ): Promise<number>;
    getBlockUncleCount(
      number: BlockType | string,
      cb?: Callback<number>
    ): Promise<number>;
    getCode(
      address: string,
      defaultBlock?: BlockType,
      cb?: Callback<string>
    ): Promise<string>;
    getCoinbase(cb?: Callback<string>): Promise<string>;
    getCompilers(cb?: Callback<string[]>): Promise<string[]>;
    getGasPrice(cb?: Callback<number>): Promise<number>;
    getHashrate(cb?: Callback<number>): Promise<number>;
    getPastLogs(
      options: {
        fromBlock?: BlockType;
        toBlock?: BlockType;
        address: string;
        topics?: Array<string | string[]>;
      },
      cb?: Callback<Log[]>
    ): Promise<Log[]>;
    getProtocolVersion(cb?: Callback<string>): Promise<string>;
    getStorageAt(
      address: string,
      defaultBlock?: BlockType,
      cb?: Callback<string>
    ): Promise<string>;
    getTransactionReceipt(
      hash: string,
      cb?: Callback<TransactionReceipt>
    ): Promise<TransactionReceipt>;
    getTransaction(
      hash: string,
      cb?: Callback<Transaction>
    ): Promise<Transaction>;
    getTransactionCount(
      address: string,
      defaultBlock?: BlockType,
      cb?: Callback<number>
    ): Promise<number>;
    getTransactionFromBlock(
      block: BlockType,
      index: number,
      cb?: Callback<Transaction>
    ): Promise<Transaction>;
    getUncle(
      blockHashOrBlockNumber: BlockType | string,
      uncleIndex: number,
      returnTransactionObjects?: boolean,
      cb?: Callback<Block>
    ): Promise<Block>;
    getWork(cb?: Callback<string[]>): Promise<string[]>;
    givenProvider: Provider;
    isMining(cb?: Callback<boolean>): Promise<boolean>;
    isSyncing(cb?: Callback<boolean>): Promise<boolean>;
    net: Net;
    personal: Personal;
    signTransaction(
      tx: Tx,
      address?: string,
      cb?: Callback<string>
    ): Promise<EncodedTransaction>;
    sendSignedTransaction(
      data: string,
      cb?: Callback<string>
    ): PromiEvent<TransactionReceipt>;
    sendTransaction(
      tx: Tx,
      cb?: Callback<string>
    ): PromiEvent<TransactionReceipt>;
    submitWork(
      nonce: string,
      powHash: string,
      digest: string,
      cb?: Callback<boolean>
    ): Promise<boolean>;
    sign(
      address: string,
      dataToSign: string,
      cb?: Callback<string>
    ): Promise<string>;
  }
  interface Tx {
    nonce?: string | number;
    chainId?: string | number;
    from?: string;
    to?: string;
    data?: string;
    value?: string | number;
    gas?: string | number;
    gasPrice?: string | number;
  }

  class BatchRequest {
    constructor();
    add(request: object): void; //
    execute(): void;
  }
  class Iban {
    constructor(address: string);
    static toAddress(iban: Iban): string;
    isValid(): boolean;
  }
  type BlockType = 'latest' | 'pending' | 'genesis' | number;

  interface BlockHeader {
    number: number;
    hash: string;
    parentHash: string;
    nonce: string;
    sha3Uncles: string;
    logsBloom: string;
    transactionRoot: string;
    stateRoot: string;
    receiptRoot: string;
    miner: string;
    extraData: string;
    gasLimit: number;
    gasUsed: number;
    timestamp: number;
  }
  interface Block extends BlockHeader {
    transactions: Transaction[];
    size: number;
    difficulty: number;
    totalDifficulty: number;
    uncles: string[];
  }

  class Net {
    getId(cb?: Callback<number>): Promise<number>;
    isListening(cb?: Callback<boolean>): Promise<boolean>;
    getPeerCount(cb?: Callback<number>): Promise<number>;
  }
  class Personal {
    newAccount(password: string, cb?: Callback<boolean>): Promise<string>;
    lockAccount(): Promise<boolean>;
    unlockAccount(): void;
    sign(): Promise<string>;
    ecRecover(message: string, sig: string): void;
    sendTransaction(tx: Tx, passphrase: string): Promise<string>;
  }

  interface Transaction {
    hash: string;
    nonce: number;
    blockHash: string;
    blockNumber: number;
    transactionIndex: number;
    from: string;
    to: string;
    value: string;
    gasPrice: string;
    gas: number;
    input: string;
    v?: string;
    r?: string;
    s?: string;
  }
  interface TransactionObject<T> {
    arguments: any[];
    call(tx?: Tx): Promise<T>;
    send(tx?: Tx): PromiEvent<T>;
    estimateGas(tx?: Tx): Promise<number>;
    encodeABI(): string;
  }
  interface CompileResult {
    code: string;
    info: {
      source: string;
      language: string;
      languageVersion: string;
      compilerVersion: string;
      abiDefinition: ABIDefinition[];
    };
    userDoc: { methods: object };
    developerDoc: { methods: object };
  }

  type PromiEventType = 'transactionHash' | 'receipt' | 'confirmation' | 'error';

  interface PromiEvent<T> extends Promise<T> {
    once(
      type: 'transactionHash',
      handler: (receipt: string) => void
    ): PromiEvent<T>;
    once(
      type: 'receipt',
      handler: (receipt: TransactionReceipt) => void
    ): PromiEvent<T>;
    once(
      type: 'confirmation',
      handler: (confNumber: number, receipt: TransactionReceipt) => void
    ): PromiEvent<T>;
    once(type: 'error', handler: (error: Error) => void): PromiEvent<T>;
    once(
      type: PromiEventType,
      handler: (error: Error | TransactionReceipt | string) => void
    ): PromiEvent<T>;
    on(
      type: 'transactionHash',
      handler: (receipt: string) => void
    ): PromiEvent<T>;
    on(
      type: 'receipt',
      handler: (receipt: TransactionReceipt) => void
    ): PromiEvent<T>;
    on(
      type: 'confirmation',
      handler: (confNumber: number, receipt: TransactionReceipt) => void
    ): PromiEvent<T>;
    on(type: 'error', handler: (error: Error) => void): PromiEvent<T>;
    on(
      type: 'error' | 'confirmation' | 'receipt' | 'transactionHash',
      handler: (error: Error | TransactionReceipt | string) => void
    ): PromiEvent<T>;
  }
  interface JsonRPCRequest {
    jsonrpc: string;
    method: string;
    params: any[];
    id: number;
  }

  interface JsonRPCResponse {
    jsonrpc: string;
    id: number;
    result?: any;
    error?: string;
  }

  class Provider {
    send(
      payload: JsonRPCRequest,
      callback: (e: Error, val: JsonRPCResponse) => void
    ): any;
  }

  class WebsocketProvider extends Provider {
    responseCallbacks: object;
    notificationCallbacks: [() => any];
    connection: {
      onclose(e: any): void;
      onmessage(e: any): void;
      onerror(e?: any): void;
    };
    addDefaultEvents: () => void;
    on(type: string, callback: () => any): void;
    removeListener(type: string, callback: () => any): void;
    removeAllListeners(type: string): void;
    reset(): void;
  }
  class HttpProvider extends Provider {
    responseCallbacks: undefined;
    notificationCallbacks: undefined;
    connection: undefined;
    addDefaultEvents: undefined;
    on(type: string, callback: () => any): undefined;
    removeListener(type: string, callback: () => any): undefined;
    removeAllListeners(type: string): undefined;
    reset(): undefined;
  }
  class IpcProvider extends Provider {
    responseCallbacks: undefined;
    notificationCallbacks: undefined;
    connection: undefined;
    addDefaultEvents: undefined;
    on(type: string, callback: () => any): undefined;
    removeListener(type: string, callback: () => any): undefined;
    removeAllListeners(type: string): undefined;
    reset(): undefined;
  }

  interface Providers {
    WebsocketProvider: new (
      host: string,
      timeout?: number
    ) => WebsocketProvider;
    HttpProvider: new (host: string, timeout?: number) => HttpProvider;
    IpcProvider: new (path: string, net: any) => IpcProvider;
  }
  type Callback<T> = (error: Error, result: T) => void;

  interface EventEmitter {
    on(type: 'data', handler: (event: EventLog) => void): EventEmitter;
    on(type: 'changed', handler: (receipt: EventLog) => void): EventEmitter;
    on(type: 'error', handler: (error: Error) => void): EventEmitter;
    on(
      type: 'error' | 'data' | 'changed',
      handler: (error: Error | TransactionReceipt | string) => void
    ): EventEmitter;
  }

  interface EventLog {
    event: string;
    address: string;
    returnValues: any;
    logIndex: number;
    transactionIndex: number;
    transactionHash: string;
    blockHash: string;
    blockNumber: number;
    raw?: { data: string; topics: string[] };
  }

  interface TransactionReceipt {
    transactionHash: string;
    transactionIndex: number;
    blockHash: string;
    blockNumber: number;
    from: string;
    to: string;
    contractAddress: string;
    cumulativeGasUsed: number;
    gasUsed: number;
    logs?: Log[];
    events?: {
      [eventName: string]: EventLog;
    };
    status: string;
  }

  interface EncodedTransaction {
    raw: string;
    tx: {
      nonce: string;
      gasPrice: string;
      gas: string;
      to: string;
      value: string;
      input: string;
      v: string;
      r: string;
      s: string;
      hash: string;
    };
  }

  interface Logs {
    fromBlock?: number;
    address?: string;
    topics?: Array<string | string[]>;
  }
  interface Log {
    address: string;
    data: string;
    topics: string[];
    logIndex: number;
    transactionHash: string;
    transactionIndex: number;
    blockHash: string;
    blockNumber: number;
  }
  interface Subscribe<T> {
    subscription: {
      id: string;
      subscribe(callback?: Callback<Subscribe<T>>): Subscribe<T>;
      unsubscribe(callback?: Callback<boolean>): void | boolean;
      arguments: object;
    };
    on(type: 'data' | 'changed', handler: (data: T) => void): void;
    on(type: 'error', handler: (data: Error) => void): void;
  }

  class Shh {} // TODO: Type
  class Bzz {} // TODO: Type

  type Unit =
    | 'kwei'
    | 'femtoether'
    | 'babbage'
    | 'mwei'
    | 'picoether'
    | 'lovelace'
    | 'qwei'
    | 'nanoether'
    | 'shannon'
    | 'microether'
    | 'szabo'
    | 'nano'
    | 'micro'
    | 'milliether'
    | 'finney'
    | 'milli'
    | 'ether'
    | 'kether'
    | 'grand'
    | 'mether'
    | 'gether'
    | 'tether';
  interface Utils {
    BN: BigNumber; // TODO only static-definition
    isBN(theArgument: any): boolean;
    isBigNumber(theArgument: any): boolean;
    isAddress(theArgument: any): boolean;
    isHex(theArgument: any): boolean;
    _: us.UnderscoreStatic;
    asciiToHex(val: string): string;
    hexToAscii(val: string): string;
    bytesToHex(val: number[]): string;
    numberToHex(val: number | BigNumber): string;
    checkAddressChecksum(address: string): boolean;
    fromAscii(val: string): string;
    fromDecimal(val: string | number | BigNumber): string;
    fromUtf8(val: string): string;
    fromWei(val: string | number | BigNumber, unit: Unit): string | BigNumber;
    hexToBytes(val: string): number[];
    hexToNumber(val: string | number | BigNumber): number;
    hexToNumberString(val: string | number | BigNumber): string;
    hexToString(val: string): string;
    hexToUtf8(val: string): string;
    keccak256(val: string): string;
    leftPad(theArgument: string, chars: number, sign: string): string;
    padLeft(theArgument: string, chars: number, sign: string): string;
    rightPad(theArgument: string, chars: number, sign: string): string;
    padRight(theArgument: string, chars: number, sign: string): string;
    sha3(
      val: string,
      val2?: string,
      val3?: string,
      val4?: string,
      val5?: string
    ): string;
    soliditySha3(val: string): string;
    randomHex(bytes: number): string;
    stringToHex(val: string): string;
    toAscii(hex: string): string;
    toBN(theArgument: any): BigNumber;
    toChecksumAddress(val: string): string;
    toDecimal(val: any): number;
    toHex(val: any): string;
    toUtf8(val: any): string;
    toWei(val: string | number | BigNumber, unit: Unit): string | BigNumber;
    unitMap: any;
  }

  interface Accounts {
    create(entropy?: string): Account;
    privateKeyToAccount(privKey: string): Account;
    publicToAddress(key: string): string;
    signTransaction(
      tx: Tx,
      privateKey: string,
      returnSignature?: boolean,
      cb?: (err: Error, result: string | Signature) => void
    ): Promise<string> | Signature;
    recoverTransaction(signature: string | Signature): string;
    sign(
      data: string,
      privateKey: string,
      returnSignature?: boolean
    ): string | Signature;
    recover(
      sigOrHash: string | Signature,
      sigOrV?: string,
      r?: string,
      s?: string
    ): string;
    encrypt(privateKey: string, password: string): PrivateKey;
    decrypt(privateKey: PrivateKey, password: string): Account;
    wallet: {
      create(numberOfAccounts: number, entropy: string): Account[];
      add(account: string | Account): any;
      remove(account: string | number): any;
      save(password: string, keyname?: string): string;
      load(password: string, keyname: string): any;
      clear(): any;
    };
  }

  interface ABIDefinition {
    constant?: boolean;
    payable?: boolean;
    anonymous?: boolean;
    inputs?: Array<{ name: string; type: ABIDataTypes; indexed?: boolean }>;
    name?: string;
    outputs?: Array<{ name: string; type: ABIDataTypes }>;
    type: 'function' | 'constructor' | 'event' | 'fallback';
  }

  type ABIDataTypes = 'uint256' | 'boolean' | 'string' | 'bytes' | string; // TODO complete list

  interface ABI {
    decodeLog(inputs: object, hexString: string, topics: string[]): object;
    encodeParameter(type: string, parameter: any): string;
    encodeParameters(types: string[], paramaters: any[]): string;
    encodeEventSignature(name: string | object): string;
    encodeFunctionCall(jsonInterface: object, parameters: any[]): string;
    encodeFunctionSignature(name: string | object): string;
    decodeParameter(type: string, hex: string): any;
    decodeParameters(
      types: string[],
      hex: string
    ): EthAbiDecodeParametersResultArray;
    decodeParameters(
      types: EthAbiDecodeParametersType[],
      hex: string
    ): EthAbiDecodeParametersResultObject;
  }

  interface EthAbiDecodeParametersType {
    name: string;
    type: string;
  }
  interface EthAbiDecodeParametersResultArray {
    [index: number]: any;
  }
  type EthAbiDecodeParametersResultObject = EthAbiDecodeParametersResultArray & {
    [key: string]: any;
  };

  class Web3 {
    static providers: Providers;
    static givenProvider: Provider;
    static modules: {
      Eth: new (provider: Provider) => Eth;
      Net: new (provider: Provider) => Net;
      Personal: new (provider: Provider) => Personal;
      Shh: new (provider: Provider) => Shh;
      Bzz: new (provider: Provider) => Bzz;
    };

    constructor(provider?: Provider | string);

    version: string;
    BatchRequest: new () => BatchRequest;

    extend(methods: any): any; // TODO
    bzz: Bzz;
    currentProvider: Provider;
    eth: Eth;
    ssh: Shh;
    givenProvider: Provider;
    providers: Providers;

    setProvider(provider: Provider): void;

    utils: Utils;
  }

  export = Web3;
}