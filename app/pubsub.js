const PubNub = require('pubnub');

const credentials = {
  publishKey: 'pub-c-ba16c877-9a44-4fe9-aa5b-b5d24c9eb502',
  subscribeKey: 'sub-c-4670ad9e-bbe5-11eb-99ea-662615fc053c',
  secretKey: 'sec-c-ODNmYjk3ZGEtNThkNS00OTAyLWFmNzctOTFhMmI1ZmIyODEw'
};

const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION'
};

class PubSub {
  constructor({ blockchain, transactionPool, wallet }) {
    this.blockchain = blockchain;
    this.pubnub = new PubNub(credentials);
    this.transactionPool = transactionPool;
    this.wallet = wallet;

    this.pubnub.subscribe({ channels: Object.values(CHANNELS)});

    this.pubnub.addListener(this.listener());
  }

  listener() {
    return {
      message: messageObject => {
        const { channel, message } = messageObject;
        console.log(`Message received. Channel: ${channel}. Message: ${message}`);
        const parsedMessage = JSON.parse(message);
        switch(channel) {
          case CHANNELS.BLOCKCHAIN:
            this.blockchain.replaceChain(parsedMessage, true, () => {
              this.transactionPool.clearBlockchainTransactions({
                chain: parsedMessage
              })
            });
            break;
          case CHANNELS.TRANSACTION:
            if (parsedMessage.input.address !== this.wallet.publicKey) {
              this.transactionPool.setTransaction(parsedMessage);
            }
            break;
          default:
            return;
        };
      }
    };
  }
  publish({ channel, message }) {
    console.log(`Publishing on ${channel}: ${message}`);
    this.pubnub.publish({ channel, message });
  }

  broadcastChain() {
    this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain)
    });
  }

  broadcastTransaction(transaction) {
    this.publish({
      channel: CHANNELS.TRANSACTION,
      message: JSON.stringify(transaction)
    });
  }
};

module.exports = PubSub;
