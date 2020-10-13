const networkConfig = {
  explorerUrl: 'http://explorer-0.10.0.x-01.symboldev.network/',
  faucetUrl: 'http://faucet-0.10.0.x-01.symboldev.network/',
  defaultNetworkType: 152,
  defaultNodeUrl: 'http://api-01.us-east-1.0.10.0.x.symboldev.network:3000',
  networkConfigurationDefaults: {
    maxMosaicDivisibility: 6,
    namespaceGracePeriodDuration: 2592000,
    lockedFundsPerAggregate: '10000000',
    maxCosignatoriesPerAccount: 25,
    blockGenerationTargetTime: 15,
    maxNamespaceDepth: 3,
    maxMosaicDuration: 21024000,
    minNamespaceDuration: 172800,
    maxNamespaceDuration: 2102400,
    maxTransactionsPerAggregate: 1000,
    maxCosignedAccountsPerAccount: 25,
    maxMessageSize: 1024,
    maxMosaicAtomicUnits: 9000000000000000,
    currencyMosaicId: '5F160D7851F3CB30',
    harvestingMosaicId: '5F160D7851F3CB30',
    defaultDynamicFeeMultiplier: 1000,
  },
  nodes: [
    { friendlyName: 'API EU Central 1', roles: 2, url: 'http://api-01.eu-central-1.0.10.0.x.symboldev.network:3000' },
    { friendlyName: 'API EU West 1', roles: 2, url: 'http://api-01.eu-west-1.0.10.0.x.symboldev.network:3000' },
    { friendlyName: 'API US East 1', roles: 2, url: 'http://api-01.us-east-1.0.10.0x.symboldev.network:3000' },
    { friendlyName: 'API US West 1', roles: 2, url: 'http://api-01.us-west-1.0.10.0.x.symboldev.network:3000' },
    { friendlyName: 'API US West 2', roles: 2, url: 'http://api-01.us-west-2.0.10.0.x.symboldev.network:3000' },
    {
      friendlyName: 'API AP South East 1',
      roles: 2,
      url: 'http://api-01.ap-southeast-1.0.10.0.x.symboldev.network:3000',
    },
    {
      friendlyName: 'API AP North East 1',
      roles: 2,
      url: 'http://api-01.ap-northeast-1.0.10.0.x.symboldev.network:3000',
    },
  ],
}
window.networkConfig = networkConfig
console.log('networkConfig loaded!', networkConfig)
