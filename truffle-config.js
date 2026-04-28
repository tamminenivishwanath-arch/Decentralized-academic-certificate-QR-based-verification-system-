module.exports = {
  networks: {
    // Local development network (Ganache)
    development: {
      host: "127.0.0.1",     // Localhost
      port: 7545,            // Ganache default port
      network_id: "*",       // Match any network id
    },
  },

  // Mocha test framework settings
  mocha: {
    // timeout: 100000
  },

  // Solidity compiler settings
  compilers: {
    solc: {
      version: "0.8.19",      // Downgraded to 0.8.19 to avoid PUSH0 opcode issue
      // settings: {
      //   optimizer: {
      //     enabled: false,
      //     runs: 200
      //   },
      //   evmVersion: "london" // optional, ensures compatibility
      // }
    }
  }
}