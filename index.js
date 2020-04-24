const assert = require('chai').assert;
const Web3 = require('web3');
const BN = require('bignumber.js');
const fs = require('fs');
const path = require('path');
const Rsk3 = require('@rsksmart/rsk3').default;

let PRIVATE_KEY = '0xc85ef7d79691fe79573b1a7064c19c1a9819ebdbd1faaab1a8ec92344438aaf4'; //cow
let rsk3 = new Rsk3('http://127.0.0.1:4444', null, { transactionConfirmationBlocks: 1 });

async function doTests() {
    let rsk = new Rsk3('http://127.0.0.1:4444', null, { transactionConfirmationBlocks: 1 });
    let clientVersion = await rsk.getNodeInfo();
    console.log(clientVersion);
}

async function eth_sendRawTransaction(){
    let compiledHelloWorldPath = path.resolve(__dirname, 'Contracts', 'HelloWorld.json');
    let compiledContract = fs.readFileSync(compiledHelloWorldPath, 'UTF-8');
    let contractOutput = JSON.parse(compiledContract);
    let abi = contractOutput.abi;    
    let contract = new rsk3.Contract(abi);
    let signedAccount = rsk3.accounts.privateKeyToAccount(PRIVATE_KEY);
    let deployment = contract.deploy({ data: '0x6080604052600560005534801561001557600080fd5b5060ff806100246000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c806360fe47b11460375780636d4ce63c146062575b600080fd5b606060048036036020811015604b57600080fd5b8101908080359060200190929190505050607e565b005b606860c1565b6040518082815260200191505060405180910390f35b806000819055507f93fe6d397c74fdf1402a8b72e47b68512f0510d7b98a4bc4cbdf6ac7108b3c596000546040518082815260200191505060405180910390a150565b6000805490509056fea265627a7a72305820c73a787ed29a46f8a85631abd07c906d900ca03c03b631cc85fe396408072ee164736f6c634300050a0032', arguments: [] });

    let contractData = deployment.encodeABI();

    let transaction = {
      value: 0,
      gasPrice: rsk3.utils.toHex(10000000),
      gas: rsk3.utils.toHex(1000000),
      data: contractData,
      chainId: 33
    };

    let signedTx = await signedAccount.signTransaction(transaction);
    let txReceipt = await rsk3.sendSignedTransaction(signedTx.rawTransaction);
    assert(txReceipt.contractAddress);
    contractAddress = txReceipt.contractAddress;

    let deployedContract = new rsk3.Contract(abi, txReceipt.contractAddress);

    let getCall = deployedContract.methods.get();
    let callParams = {
      to: txReceipt.contractAddress,
      data: getCall.encodeABI(),
    };

    let currentVal = await rsk3.call(callParams);
    assert.equal(currentVal, '0x0000000000000000000000000000000000000000000000000000000000000005');

    let currentValLatest = await rsk3.call(callParams, "latest");
    assert.equal(currentValLatest, '0x0000000000000000000000000000000000000000000000000000000000000005');

    let currentValPending = await rsk3.call(callParams, "pending");
    assert.equal(currentValPending, '0x0000000000000000000000000000000000000000000000000000000000000005');

    let setCall = deployedContract.methods.set(34);
    let setGasEstimate = await setCall.estimateGas({ from: signedAccount.address });
    let transactionParameters = {
      to: txReceipt.contractAddress,
      from: signedAccount.address,
      gasPrice: '0x4A817C800', // 20000000000
      gas: setGasEstimate,
      data: setCall.encodeABI(),
      chainId: 33
    };

    let setSignedTx = await signedAccount.signTransaction(transactionParameters);

    // Send the transaction.
    let receipt = await rsk3.sendSignedTransaction(setSignedTx.rawTransaction)
      .once('transactionHash', (hash) => {
        assert.isString(hash);
        trxHash = hash;
      })
      .on('error', (error) => {
        assert(false, `Unexpected error sending set transaction: $`);
      });
    assert.isObject(receipt);
    let receiptString = JSON.stringify(receipt);
    assert(receiptString.indexOf('transactionHash') > 0, "transactionHash is not being returned and it's expected!");
    assert(receiptString.indexOf('transactionIndex') > 0, "transactionIndex is not being returned and it's expected!");
    assert(receiptString.indexOf('blockHash') > 0, "blockHash is not being returned and it's expected!");
    assert(receiptString.indexOf('blockNumber') > 0, "blockNumber is not being returned and it's expected!");
    assert(receiptString.indexOf('cumulativeGasUsed') > 0, "cumulativeGasUsed is not being returned and it's expected!");
    assert(receiptString.indexOf('gasUsed') > 0, "gasUsed is not being returned and it's expected!");
    assert(receiptString.indexOf('contractAddress') > 0, "contractAddress is not being returned and it's expected!");
    assert(receiptString.indexOf('logs') > 0, "logs is not being returned and it's expected!");
    assert(receiptString.indexOf('from') > 0, "from is not being returned and it's expected!");
    assert(receiptString.indexOf('to') > 0, "to is not being returned and it's expected!");
    assert(receiptString.indexOf('root') > 0, "root is not being returned and it's expected!");
    assert(receiptString.indexOf('status') >0, "status is not being returned and it's expected!");
    assert(receiptString.indexOf('logsBloom') > 0, "logsBloom is not being returned and it's expected!");

    await new Promise((res) => setTimeout(res, 5000));

    await deployedContract.getPastEvents('ValueChanged', { fromBlock: 0, toBlock: 'latest' }, (error, eventLogs) => {
      assert(!error, `Unexpected error reading logs ${error}`);
      assert.equal(eventLogs[0].returnValues.newValue, "34");
    });
}

eth_sendRawTransaction();
