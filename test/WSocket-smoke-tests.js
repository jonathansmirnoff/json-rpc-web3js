const assert = require('chai').assert;
const Web3 = require('web3');
const BN = require('bignumber.js');
const fs = require('fs');
const path = require('path');

describe('RskJ WebSocket Smoke Tests', function () {
  this.timeout(10000);
  let web3;

  before(async () => {
    let provider = await new Web3.providers.WebsocketProvider('ws://127.0.0.1:4445/websocket');
    web3 = await new Web3(provider);
  });

  it('First websocket test', async () => {
   /* let subscription = await web3.eth.subscribe('newBlockHeaders');
    await subscription.unsubscribe(function(error, success){
      if (success) {
          console.log('Successfully unsubscribed!');
      }
  });*/
  })
});