/**
 * Copyright 2020 NEM Foundation (https://nem.io)
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import Vue from 'vue';
import {
  Address,
  NamespaceInfo,
  QueryParams,
  Listener,
  Transaction,
  SignedTransaction,
  Order,
  AccountInfo,
  PublicAccount,
  Account,
  NetworkType,
  MultisigAccountInfo,
  Mosaic,
  MosaicInfo,
  CosignatureSignedTransaction,
  TransactionType,
  UInt64,
} from 'symbol-sdk'
import {Subscription} from 'rxjs'

// internal dependencies
import {$eventBus} from '../events'
import {RESTService} from '@/services/RESTService'
import {AwaitLock} from './AwaitLock';
import {BroadcastResult} from '@/core/transactions/BroadcastResult';
import {WalletsModel} from '@/core/database/entities/WalletsModel'

/**
 * Helper to format transaction group in name of state variable.
 *
 * @internal
 * @param {string} group 
 * @return {string} One of 'confirmedTransactions', 'unconfirmedTransactions' or 'partialTransactions'
 */
const transactionGroupToStateVariable = (
  group: string
): string => {
  let transactionGroup = group.toLowerCase();
  if (transactionGroup === 'unconfirmed'
      || transactionGroup === 'confirmed'
      || transactionGroup === 'partial') {
    transactionGroup = transactionGroup + 'Transactions'
  }
  else {
    throw new Error('Unknown transaction group \'' + group + '\'.')
  }

  return transactionGroup
}

/**
 * Create an sdk address object by payload
 * @param payload
 */
const getAddressByPayload = (
  payload: WalletsModel | Account | PublicAccount | Address | {networkType: NetworkType, publicKey?: string, name?: string}
): Address => {
  if (payload instanceof WalletsModel) {
    return Address.createFromRawAddress(payload.values.get('address'))
  }
  else if (payload instanceof PublicAccount
        || payload instanceof Account) {
    return payload.address
  }
  else if (payload instanceof Address) {
    return payload
  }

  // - finally from payload
  const publicAccount = PublicAccount.createFromPublicKey(
    payload.publicKey,
    payload.networkType
  )
  return publicAccount.address
}

/**
 * Create a wallet entity by payload
 * @param payload
 */
const getWalletByPayload = (
  payload: WalletsModel | Account | PublicAccount | Address | {networkType: NetworkType, publicKey?: string, name?: string}
): WalletsModel => {
  if (payload instanceof WalletsModel) {
    return payload
  }
  else if (payload instanceof Address) {
    return new WalletsModel(new Map<string, any>([
      ['name', payload.pretty()],
      ['address', payload.plain()],
      ['publicKey', payload.plain()],
      ['isMultisig', true],
    ]))
  }
  else if (payload instanceof PublicAccount || payload instanceof Account) {
    return new WalletsModel(new Map<string, any>([
      ['name', payload.address.pretty()],
      ['address', payload.address.plain()],
      ['publicKey', payload.publicKey],
      ['isMultisig', true],
    ]))
  }
  else if (payload && payload.networkType && payload.publicKey) {
    const publicAccount = PublicAccount.createFromPublicKey(payload.publicKey, payload.networkType)
    const walletName = payload.name && payload.name.length ? payload.name : publicAccount.address.pretty()
    return new WalletsModel(new Map<string, any>([
      ['name', walletName],
      ['address', publicAccount.address.plain()],
      ['publicKey', publicAccount.publicKey],
      ['isMultisig', true],
    ]))
  }
  else return undefined
}

/// region globals
const Lock = AwaitLock.create();
/// end-region globals

/**
 * Type SubscriptionType for Wallet Store
 * @type {SubscriptionType}
 */
type SubscriptionType = {
  listener: Listener,
  subscriptions: Subscription[]
}

// wallet state typing
interface WalletState {
  initialized: boolean
  currentWallet: WalletsModel
  currentWalletAddress: Address
  currentWalletMosaics: Mosaic[]
  currentWalletOwnedMosaics: MosaicInfo[]
  currentWalletOwnedNamespaces: NamespaceInfo[]
  isCosignatoryMode: boolean
  currentSigner: {networkType: NetworkType, publicKey: string}
  currentSignerAddress: Address
  currentSignerMosaics: Mosaic[]
  currentSignerOwnedMosaics: MosaicInfo[]
  currentSignerOwnedNamespaces: NamespaceInfo[]
  // Known wallet database identifiers
  knownWallets: string[]
  knownWalletsInfo: Record<string, AccountInfo> 
  knownMultisigsInfo: Record<string, MultisigAccountInfo> 
  transactionHashes: string[]
  confirmedTransactions: Transaction[]
  unconfirmedTransactions: Transaction[]
  partialTransactions: Transaction[]
  stageOptions: { isAggregate: boolean, isMultisig: boolean },
  stagedTransactions: Transaction[]
  signedTransactions: SignedTransaction[]
  transactionCache: Record<string, Transaction[]>
  // Subscriptions to webSocket channels
  subscriptions: Record<string, SubscriptionType[][]>
}

// Wallet state initial definition
const walletState: WalletState = {
  initialized: false,
  currentWallet: null,
  currentWalletAddress: null,
  currentWalletMosaics: [],
  currentWalletOwnedMosaics: [],
  currentWalletOwnedNamespaces: [],
  isCosignatoryMode: false,
  currentSigner: null,
  currentSignerAddress: null,
  currentSignerMosaics: [],
  currentSignerOwnedMosaics: [],
  currentSignerOwnedNamespaces: [],
  knownWallets: [],
  knownWalletsInfo: {},
  knownMultisigsInfo: {},
  transactionHashes: [],
  confirmedTransactions: [],
  unconfirmedTransactions: [],
  partialTransactions: [],
  stageOptions: {
    isAggregate: false,
    isMultisig: false,
  },
  stagedTransactions: [],
  signedTransactions: [],
  transactionCache: {},
  // Subscriptions to websocket channels.
  subscriptions: {},
}

/**
 * Wallet Store
 */
export default {
  namespaced: true,
  state: walletState,
  getters: {
    getInitialized: (state: WalletState) => state.initialized,
    currentWallet: (state: WalletState) => {
      // - in case of a WalletsModel, the currentWallet instance is simply returned
      // - in case of Address/Account or other, a fake model will be created
      return getWalletByPayload(state.currentWallet)
    },
    currentSigner: (state: WalletState) => {
      // - in case of a WalletsModel, the currentWallet instance is simply returned
      // - in case of Address/Account or other, a fake model will be created
      return getWalletByPayload(state.currentSigner)
    },
    currentWalletAddress: (state: WalletState) => state.currentWalletAddress,
    currentWalletInfo: (state: WalletState): AccountInfo | null => {
      const plainAddress = state.currentWalletAddress ? state.currentWalletAddress.plain() : null
      if(!plainAddress) return null
      return state.knownWalletsInfo[plainAddress] || null
    },
    currentWalletMosaics: (state: WalletState) => state.currentWalletMosaics,
    currentWalletOwnedMosaics: (state: WalletState) => state.currentWalletOwnedMosaics,
    currentWalletOwnedNamespaces: (state: WalletState) => state.currentWalletOwnedNamespaces,
    currentWalletMultisigInfo: (state: WalletState) => {
      if (!state.currentWalletAddress) return null
      return state.knownMultisigsInfo[state.currentWalletAddress.plain()]
    },
    isCosignatoryMode: (state: WalletState) => state.isCosignatoryMode,
    currentSignerAddress: (state: WalletState) => state.currentSignerAddress,
    currentSignerInfo: (state: WalletState): AccountInfo | null => {
      const plainAddress = state.currentSignerAddress ? state.currentSignerAddress.plain() : null
      if(!plainAddress) return null
      return state.knownWalletsInfo[plainAddress] || null
    },
    currentSignerMultisigInfo: (state: WalletState) => {
      const plainAddress = state.currentSignerAddress ? state.currentSignerAddress.plain() : null
      if(!plainAddress) return null
      return state.knownMultisigsInfo[plainAddress] || null
    } ,
    currentSignerMosaics: (state: WalletState) => state.currentSignerMosaics,
    currentSignerOwnedMosaics: (state: WalletState) => state.currentSignerOwnedMosaics,
    currentSignerOwnedNamespaces: (state: WalletState) => state.currentSignerOwnedNamespaces,
    knownWallets: (state: WalletState) => state.knownWallets,
    knownWalletsInfo: (state: WalletState) => state.knownWalletsInfo,
    knownMultisigsInfo: (state: WalletState) => state.knownMultisigsInfo,
    getSubscriptions: (state: WalletState) => state.subscriptions,
    transactionHashes: (state: WalletState) => state.transactionHashes,
    confirmedTransactions: (state: WalletState) => {
      return state.confirmedTransactions.sort((t1, t2) => {
        const info1 = t1.transactionInfo
        const info2 = t2.transactionInfo

        // - confirmed sorted by height then index
        const diffHeight = info1.height.compact() - info2.height.compact()
        const diffIndex = info1.index - info2.index
        return diffHeight !== 0 ? diffHeight : diffIndex
      })
    },
    unconfirmedTransactions: (state: WalletState) => {
      return state.unconfirmedTransactions.sort((t1, t2) => {
        // - unconfirmed/partial sorted by index
        return t1.transactionInfo.index - t2.transactionInfo.index
      })
    },
    partialTransactions: (state: WalletState) => {
      return state.partialTransactions.sort((t1, t2) => {
        // - unconfirmed/partial sorted by index
        return t1.transactionInfo.index - t2.transactionInfo.index
      })
    },
    stageOptions: (state: WalletState) => state.stageOptions,
    stagedTransactions: (state: WalletState) => state.stagedTransactions,
    signedTransactions: (state: WalletState) => state.signedTransactions,
    transactionCache: (state: WalletState) => state.transactionCache,
    allTransactions: (state, getters) => {
      return [].concat(
        getters.partialTransactions,
        getters.unconfirmedTransactions,
        getters.confirmedTransactions,
      )
    },
  },
  mutations: {
    setInitialized: (state, initialized) => { state.initialized = initialized },
    currentWallet: (state, walletModel) => Vue.set(state, 'currentWallet', walletModel),
    isCosignatoryMode: (state, mode) => Vue.set(state, 'isCosignatoryMode', mode),
    currentWalletAddress: (state, walletAddress) => Vue.set(state, 'currentWalletAddress', walletAddress),
    currentWalletMosaics: (state, currentWalletMosaics) => Vue.set(state, 'currentWalletMosaics', currentWalletMosaics),
    currentWalletOwnedMosaics: (state, currentWalletOwnedMosaics) => Vue.set(state, 'currentWalletOwnedMosaics', currentWalletOwnedMosaics),
    currentWalletOwnedNamespaces: (state, currentWalletOwnedNamespaces) => Vue.set(state, 'currentWalletOwnedNamespaces', currentWalletOwnedNamespaces),
    currentSigner: (state, signerPayload) => Vue.set(state, 'currentSigner', signerPayload),
    currentSignerAddress: (state, signerAddress) => Vue.set(state, 'currentSignerAddress', signerAddress),
    currentSignerMosaics: (state, currentSignerMosaics) => Vue.set(state, 'currentSignerMosaics', currentSignerMosaics),
    currentSignerOwnedMosaics: (state, currentSignerOwnedMosaics) => Vue.set(state, 'currentSignerOwnedMosaics', currentSignerOwnedMosaics),
    currentSignerOwnedNamespaces: (state, currentSignerOwnedNamespaces) => Vue.set(state, 'currentSignerOwnedNamespaces', currentSignerOwnedNamespaces),
    setKnownWallets: (state, wallets) => Vue.set(state, 'knownWallets', wallets),
    addKnownWalletsInfo: (state, walletInfo) => {
      Vue.set(state.knownWalletsInfo, walletInfo.address.plain(), walletInfo)
    },
    addKnownMultisigInfo: (state, multisigInfo: MultisigAccountInfo) => {
      Vue.set(state.knownMultisigsInfo, multisigInfo.account.address.plain(), multisigInfo)
    },
    transactionHashes: (state, hashes) => Vue.set(state, 'transactionHashes', hashes),
    confirmedTransactions: (state, transactions) => Vue.set(state, 'confirmedTransactions', transactions),
    unconfirmedTransactions: (state, transactions) => Vue.set(state, 'unconfirmedTransactions', transactions),
    partialTransactions: (state, transactions) => Vue.set(state, 'partialTransactions', transactions),
    setSubscriptions: (state, data) => Vue.set(state, 'subscriptions', data),
    addSubscriptions: (state, payload) => {
      const {address, subscriptions} = payload
      // skip when subscriptions is an empty array
      if (!subscriptions.length) return
      // get current subscriptions from state
      const oldSubscriptions = state.subscriptions[address] || []
      // update subscriptions
      const newSubscriptions = oldSubscriptions.push(subscriptions)
      // update state
      Vue.set(state.subscriptions, address, newSubscriptions)
    },
    addTransactionToCache: (state, payload): Record<string, Transaction[]> => {
      if (payload === undefined) return
      const {transaction, hash, cacheKey} = payload
      // Get existing cached transactions with the same cache key
      const cachedTransactions = state.transactionCache[cacheKey] || []
      // update state
      Vue.set(state.cachedTransactions, cacheKey, [ ...cachedTransactions, {hash, transaction}])
      // update state
      return state.transactionCache
    },
    stageOptions: (state, options) => Vue.set(state, 'stageOptions', options),
    setStagedTransactions: (state, transactions: Transaction[]) => Vue.set(state, 'stagedTransactions', transactions),
    addStagedTransaction: (state, transaction: Transaction) => {
      // - get previously staged transactions
      const staged = state.stagedTransactions

      // - push transaction on stage (order matters)
      staged.push(transaction)

      // - update state
      return Vue.set(state, 'stagedTransactions', staged)
    },
    addSignedTransaction: (state, transaction: SignedTransaction) => {
      // - get previously signed transactions
      const signed = state.signedTransactions

      // - update state
      signed.push(transaction)
      return Vue.set(state, 'signedTransactions', signed)
    },
    removeSignedTransaction: (state, transaction: SignedTransaction) => {
      // - get previously signed transactions
      const signed = state.signedTransactions

      // - find transaction by hash and delete
      const idx = signed.findIndex(tx => tx.hash === transaction.hash)
      if (undefined === idx) {
        return ;
      }

      // skip `idx`
      const remaining = signed.splice(0, idx).concat(
        signed.splice(idx+1, signed.length - idx - 1)
      )

      // - use Array.from to reset indexes
      return Vue.set(state, 'signedTransactions', Array.from(remaining))
    },
  },
  actions: {
    /**
     * Possible `options` values include: 
     * @type {
     *    skipTransactions: boolean,
     *    skipOwnedAssets: boolean,
     *    skipMultisig: boolean,
     * }
     */
    async initialize({ commit, dispatch, getters }, {address, options}) {
      const callback = async () => {
        if (!address || !address.length) {
            return ;
        }

        // fetch account info
        await dispatch('REST_FETCH_WALLET_DETAILS', {address, options})

        // open websocket connections
        dispatch('SUBSCRIBE', address)
        commit('setInitialized', true)
      }
      await Lock.initialize(callback, {commit, dispatch, getters})
    },
    async uninitialize({ commit, dispatch, getters }, {address, which}) {
      const callback = async () => {
        // close websocket connections
        await dispatch('UNSUBSCRIBE', address)
        await dispatch('RESET_BALANCES', which)
        await dispatch('RESET_TRANSACTIONS')
        commit('setInitialized', false)
      }
      await Lock.uninitialize(callback, {commit, dispatch, getters})
    },
/// region scoped actions
    async REST_FETCH_WALLET_DETAILS({dispatch}, {address, options}) {
      try { await dispatch('REST_FETCH_INFO', address) } catch (e) {}

      if (!options || !options.skipMultisig) {
        try { dispatch('REST_FETCH_MULTISIG', address) } catch (e) {}
      }

      if (!options || !options.skipTransactions) {
        try { await dispatch('REST_FETCH_TRANSACTIONS', {
          group: 'confirmed',
          pageSize: 100,
          address: address,
        }) } catch(e) {}
      }

      // must be non-blocking
      if (!options || !options.skipOwnedAssets) {
        try { dispatch('REST_FETCH_OWNED_MOSAICS', address) } catch (e) {}
        try { dispatch('REST_FETCH_OWNED_NAMESPACES', address) } catch (e) {}
      }
    },
    /**
     * Possible `options` values include: 
     * @type {
      *    isCosignatoryMode: boolean,
      * }
      */
    async SET_CURRENT_WALLET({commit, dispatch, getters}, {model, options}) {

      const previous = getters.currentWallet

      let address: Address = getAddressByPayload(model)
      dispatch('diagnostic/ADD_DEBUG', 'Store action wallet/SET_CURRENT_WALLET dispatched with ' + address.plain(), {root: true})

      // set current wallet
      commit('currentWallet', model)
      commit('currentWalletAddress', address)

      // reset current signer
      dispatch('SET_CURRENT_SIGNER', {model, options: {skipDetails: true}})

      if (!!previous) {
        // in normal initialize routine, old active wallet
        // connections must be closed
        await dispatch('uninitialize', {address: previous.values.get('address'), which: 'currentWalletMosaics'})
      }

      await dispatch('initialize', {address: address.plain(), options: {}})
      $eventBus.$emit('onWalletChange', address.plain())
    },
    async SET_CURRENT_SIGNER({commit, dispatch, getters}, {model, options}) {
      let address: Address = getAddressByPayload(model)
      dispatch('diagnostic/ADD_DEBUG', 'Store action wallet/SET_CURRENT_SIGNER dispatched with ' + address.plain(), {root: true})

      let payload = model
      if (model instanceof WalletsModel) {
        payload = {
          networkType: address.networkType,
          publicKey: model.values.get('publicKey'),
        }
      }

      // set current signer
      commit('currentSigner', payload)
      commit('currentSignerAddress', address)

      // whether entering in cosignatory mode
      const currentWallet = getters['currentWallet']
      let isCosignatory = false
      if (address.plain() !== currentWallet.values.get('address')) {
        isCosignatory = true
      }

      commit('isCosignatoryMode', isCosignatory)

      // setting current signer should not fetch ALL data
      let detailOpts = {
        skipTransactions: true,
        skipMultisig: true,
        skipOwnedAssets: false,
      }

      if (!options || !options.skipDetails) {
        await dispatch('REST_FETCH_WALLET_DETAILS', {address: address.plain(), options: detailOpts})
      }
    },
    SET_KNOWN_WALLETS({commit}, wallets: string[]) {
      commit('setKnownWallets', wallets)
    },
    RESET_BALANCES({dispatch}, which) {
      if (!which) which = 'currentWalletMosaics'
      dispatch('SET_BALANCES', {which, mosaics: []})
    },
    SET_BALANCES({commit, rootGetters}, {mosaics, which}) {
      // if no mosaics, set the mosaics to 0 networkCurrency for reactivity purposes
      if (!mosaics.length) {
        const networkMosaic = rootGetters['mosaic/networkMosaic']
        const defaultMosaic = new Mosaic(networkMosaic, UInt64.fromUint(0))
        commit(which, [defaultMosaic])
        return
      }

      commit(which, mosaics)
    },
    RESET_SUBSCRIPTIONS({commit}) {
      commit('setSubscriptions', [])
    },
    RESET_TRANSACTIONS({commit}) {
      commit('confirmedTransactions', [])
      commit('unconfirmedTransactions', [])
      commit('partialTransactions', [])
    },
    ADD_COSIGNATURE({commit, dispatch, getters}, cosignatureMessage) {
      if (!cosignatureMessage || !cosignatureMessage.parentHash) {
        throw Error('Missing mandatory field \'parentHash\' for action wallet/ADD_COSIGNATURE.')
      }

      const hashes = getters['transactionHashes']
      const transactions = getters['partialTransactions']
      const index = transactions.findIndex(t => t.transactionInfo.hash === cosignatureMessage.parentHash)

      if (index === undefined) {
        // partial tx unknown, fetch partials...
        return ;
      }

      transactions[index] = transactions[index].addCosignatures(cosignatureMessage)
      commit('partialTransactions', transactions)
    },
    ADD_TRANSACTION({commit, dispatch, getters}, transactionMessage) {
      if (!transactionMessage || !transactionMessage.group) {
        throw Error('Missing mandatory field \'group\' for action wallet/ADD_TRANSACTION.')
      }

      //const message = 'Adding transaction to ' + transactionMessage.group + ' Type: ' + transactionMessage.transaction.type
      //dispatch('diagnostic/ADD_DEBUG', message, {root: true})

      // format transactionGroup to store variable name
      let transactionGroup = transactionGroupToStateVariable(transactionMessage.group);

      // if transaction hash is known, do nothing
      const hashes = getters['transactionHashes']
      const transaction = transactionMessage.transaction
      const findIterator = hashes.find(hash => hash === transaction.transactionInfo.hash)

      // register transaction
      const transactions = getters[transactionGroup]
      const findTx = transactions.find(t => t.transactionInfo.hash === transaction.transactionInfo.hash)
      if (findTx === undefined) {
        transactions.push(transaction)
      }

      if (findIterator === undefined) {
        hashes.push(transaction.transactionInfo.hash)
      }

      // update state
      //commit('addTransactionToCache', {hash: transaction.transactionInfo.hash, transaction})
      commit(transactionGroup, transactions)
      return commit('transactionHashes', hashes)
    },
    REMOVE_TRANSACTION({commit, getters}, transactionMessage) {
      if (!transactionMessage || !transactionMessage.group) {
        throw Error('Missing mandatory field \'group\' for action wallet/removeTransaction.')
      }

      // format transactionGroup to store variable name
      let transactionGroup = transactionGroupToStateVariable(transactionMessage.group);

      // read from store
      const hashes = getters['transactionHashes']
      const transactions = getters[transactionGroup]

      // prepare search
      const transactionHash = transactionMessage.transaction

      // find transaction in storage
      const findHashIt = hashes.find(hash => hash === transactionHash)
      const findIterator = transactions.find(tx => tx.transactionInfo.hash === transactionHash)
      if (findIterator === undefined) {
        return ; // not found, do nothing
      }

      // remove transaction
      delete transactions[findIterator]
      delete hashes[findHashIt]
      commit(transactionGroup, transactions)
      return commit('transactionHashes', hashes)
    },
    ADD_STAGED_TRANSACTION({commit}, stagedTransaction: Transaction) {
      commit('addStagedTransaction', stagedTransaction)
    },
    RESET_TRANSACTION_STAGE({commit}) {
      commit('setStagedTransactions', [])
    },
/**
 * Websocket API
 */
    // Subscribe to latest account transactions.
    async SUBSCRIBE({ commit, dispatch, rootGetters }, address) {
      if (!address || !address.length) {
        return ;
      }

      // use RESTService to open websocket channel subscriptions
      const websocketUrl = rootGetters['network/wsEndpoint']
      const subscriptions: SubscriptionType  = await RESTService.subscribeTransactionChannels(
        {commit, dispatch},
        websocketUrl,
        address,
      )

      // update state of listeners & subscriptions
      commit('addSubscriptions', {address, subscriptions})
    },

    // Unsubscribe from all open websocket connections
    async UNSUBSCRIBE({ dispatch, getters }, address) {
      const subscriptions = getters.getSubscriptions
      const currentWallet = getters.currentWallet

      if (!address) {
        address = currentWallet.values.get('address')
      }

      const subsByAddress = subscriptions.hasOwnProperty(address) ? subscriptions[address] : []
      for (let i = 0, m = subsByAddress.length; i < m; i++) {
        const subscription = subsByAddress[i]

        // subscribers
        for (let j = 0, n = subscription.subscriptions; j < n; j++) {
          await subscription.subscriptions[j].unsubscribe()
        }

        await subscription.listener.close()
      }

      // update state
      dispatch('RESET_SUBSCRIPTIONS', address)
    },
/**
 * REST API
 */
    async REST_FETCH_TRANSACTIONS({dispatch, getters, rootGetters}, {group, address, pageSize, id}) {
      if (!group || ! ['partial', 'unconfirmed', 'confirmed'].includes(group)) {
        group = 'confirmed'
      }

      if (!address || address.length !== 40) {
        return ;
      }

      dispatch('diagnostic/ADD_DEBUG', 'Store action wallet/REST_FETCH_TRANSACTIONS dispatched with : ' + JSON.stringify({address: address, group}), {root: true})

      try {
        // prepare REST parameters
        const currentPeer = rootGetters['network/currentPeer'].url
        const queryParams = new QueryParams({ pageSize: 100, id })
        const addressObject = Address.createFromRawAddress(address)

        // fetch transactions from REST gateway
        const accountHttp = RESTService.create('AccountHttp', currentPeer)
        let transactions: Transaction[] = []
        let blockHeights: number[] = []

        if ('confirmed' === group) {
          transactions = await accountHttp.getAccountTransactions(addressObject, queryParams).toPromise()
          // - record block height to be fetched
          transactions.map(transaction => blockHeights.push(transaction.transactionInfo.height.compact()))
        }
        else if ('unconfirmed' === group)
          transactions = await accountHttp.getAccountUnconfirmedTransactions(addressObject, queryParams).toPromise()
        else if ('partial' === group)
          transactions = await accountHttp.getAccountPartialTransactions(addressObject, queryParams).toPromise()

        dispatch('diagnostic/ADD_DEBUG', 'Store action wallet/REST_FETCH_TRANSACTIONS numTransactions: ' + transactions.length, {root: true})

        // update store
        for (let i = 0, m = transactions.length; i < m; i++) {
          const transaction = transactions[i]
          await dispatch('ADD_TRANSACTION', { address, group, transaction })
        }

        // fetch block informations if necessary
        if (blockHeights.length) {
          // - non-blocking
          dispatch('network/REST_FETCH_BLOCKS', blockHeights, {root: true})
        }

        return transactions
      }
      catch (e) {
        dispatch('diagnostic/ADD_ERROR', 'An error happened while trying to fetch transactions: ' + e, {root: true})
        return false
      }
    },
    async REST_FETCH_BALANCES({dispatch}, address) {
      if (!address || address.length !== 40) {
        return ;
      }

      dispatch('diagnostic/ADD_DEBUG', 'Store action wallet/REST_FETCH_BALANCES dispatched with : ' + address, {root: true})
      try {
        const accountInfo = await dispatch('REST_FETCH_INFO', address)
        return accountInfo.mosaics
      }
      catch(e) {}
      return []
    },
    async REST_FETCH_INFO({commit, dispatch, getters, rootGetters}, address) {
      if (!address || address.length !== 40) {
        return ;
      }

      dispatch('diagnostic/ADD_DEBUG', 'Store action wallet/REST_FETCH_INFO dispatched with : ' + JSON.stringify({address: address}), {root: true})

      const currentWallet = getters.currentWallet
      const currentSigner = getters.currentSigner
      const currentPeer = rootGetters['network/currentPeer'].url

      try {
        // prepare REST parameters
        const addressObject = Address.createFromRawAddress(address)

        // fetch account info from REST gateway
        const accountHttp = RESTService.create('AccountHttp', currentPeer)
        const accountInfo = await accountHttp.getAccountInfo(addressObject).toPromise()
        commit('addKnownWalletsInfo', accountInfo)

        // update current wallet state if necessary
        if (currentWallet && address === getters.currentWalletAddress.plain()) {
          dispatch('SET_BALANCES', {mosaics: accountInfo.mosaics, which: 'currentWalletMosaics'})
        }
        // update current signer state if not current wallet
        else if (currentSigner && address === getters.currentSignerAddress.plain()) {
          dispatch('SET_BALANCES', {mosaics: accountInfo.mosaics, which: 'currentSignerMosaics'})
        }

        return accountInfo
      }
      catch (e) {
        if (!!currentWallet && address === getters.currentWalletAddress.plain()) {
          dispatch('SET_BALANCES', {mosaics: [], which: 'currentWalletMosaics'})
        }
        else if (!!getters.currentSigner && address === getters.currentSignerAddress.plain()) {
          dispatch('SET_BALANCES', {mosaics: [], which: 'currentSignerMosaics'})
        }

        dispatch('diagnostic/ADD_ERROR', 'An error happened while trying to fetch account information: ' + e, {root: true})
        return false
      }
    },
    async REST_FETCH_INFOS({commit, dispatch, getters, rootGetters}, addresses: Address[]): Promise<AccountInfo[]> {
      dispatch(
        'diagnostic/ADD_DEBUG',
        `Store action wallet/REST_FETCH_INFOS dispatched with : ${JSON.stringify(addresses.map(a => a.plain()))}`,
        {root: true},
      )

      // read store
      const currentPeer = rootGetters['network/currentPeer'].url

      try {
        // fetch account info from REST gateway
        const accountHttp = RESTService.create('AccountHttp', currentPeer)
        const accountsInfo = await accountHttp.getAccountsInfo(addresses).toPromise()
        
        // add accounts to the store
        accountsInfo.forEach(info => commit('addKnownWalletsInfo', info))

        // set current wallet info
        const currentWalletInfo = accountsInfo.find(
          info => info.address.equals(getters.currentWalletAddress),
        )

        if (currentWalletInfo !== undefined) {
          dispatch('SET_BALANCES', {mosaics: currentWalletInfo.mosaics, which: 'currentWalletMosaics'})
        }

        // .. or set current signer info
        const currentSignerInfo = accountsInfo.find(
          info => info.address.equals(getters.currentSignerAddress),
        )

        if (currentSignerInfo !== undefined) {
          dispatch('SET_BALANCES', {mosaics: currentWalletInfo.mosaics, which: 'currentSignerMosaics'})
        }

        // return accounts info
        return accountsInfo
      }
      catch (e) {
        dispatch('diagnostic/ADD_ERROR', `An error happened while trying to fetch accounts information: ${e}`, {root: true})
        throw new Error(e)
      }
    },
    async REST_FETCH_MULTISIG({commit, dispatch, getters, rootGetters}, address) {
      if (!address || address.length !== 40) {
        return ;
      }

      dispatch('diagnostic/ADD_DEBUG', 'Store action wallet/REST_FETCH_MULTISIG dispatched with : ' + address, {root: true})

      // read store
      const currentPeer = rootGetters['network/currentPeer'].url
      const networkType = rootGetters['network/networkType']

      try {
        // prepare REST parameters
        const addressObject = Address.createFromRawAddress(address)

        // fetch account info from REST gateway
        const multisigHttp = RESTService.create('MultisigHttp', currentPeer, networkType)
        const multisigInfo = await multisigHttp.getMultisigAccountInfo(addressObject).toPromise()

        // store multisig info
        commit('addKnownMultisigInfo', multisigInfo)

        return multisigInfo
      }
      catch (e) {
        dispatch('diagnostic/ADD_ERROR', 'An error happened while trying to fetch multisig information: ' + e, {root: true})
        return false
      }
    },
    async REST_FETCH_OWNED_MOSAICS({commit, dispatch, getters, rootGetters}, address) {
      if (!address || address.length !== 40) {
        return ;
      }

      dispatch('diagnostic/ADD_DEBUG', 'Store action wallet/REST_FETCH_OWNED_MOSAICS dispatched with : ' + address, {root: true})

      // read store
      const currentPeer = rootGetters['network/currentPeer'].url
      const currentWallet = getters['currentWallet']
      const currentSigner = getters['currentSigner']
      const networkType = rootGetters['network/networkType']

      try {
        // prepare REST parameters
        const addressObject = Address.createFromRawAddress(address)

        // fetch account info from REST gateway
        const mosaicHttp = RESTService.create('MosaicHttp', currentPeer, networkType)
        const ownedMosaics = await mosaicHttp.getMosaicsFromAccount(addressObject).toPromise()

        // store multisig info
        if (currentWallet && address === currentWallet.values.get('address')) {
          commit('currentWalletOwnedMosaics', ownedMosaics)
        }
        else if (currentSigner && address === getters.currentSignerAddress.plain()) {
          commit('currentSignerOwnedMosaics', ownedMosaics)
        }

        return ownedMosaics
      }
      catch (e) {
        if (currentWallet && currentWallet.values.get('address') === address) {
          commit('currentWalletOwnedMosaics', [])
        }
        else if (currentSigner && address === getters.currentSignerAddress.plain()) {
          commit('currentSignerOwnedMosaics', [])
        }

        dispatch('diagnostic/ADD_ERROR', 'An error happened while trying to fetch owned mosaics: ' + e, {root: true})
        return false
      }
    },
    async REST_FETCH_OWNED_NAMESPACES({commit, dispatch, getters, rootGetters}, address): Promise<NamespaceInfo[]> {
      if (!address || address.length !== 40) {
        return ;
      }

      dispatch('diagnostic/ADD_DEBUG', 'Store action wallet/REST_FETCH_OWNED_NAMESPACES dispatched with : ' + address, {root: true})

      // read store
      const currentPeer = rootGetters['network/currentPeer'].url
      const currentWallet = getters['currentWallet']
      const currentSigner = getters['currentSigner']
      const networkType = rootGetters['network/networkType']

      try {
        // prepare REST parameters
        const addressObject = Address.createFromRawAddress(address)

        // fetch account info from REST gateway
        const namespaceHttp = RESTService.create('NamespaceHttp', currentPeer, networkType)

        // @TODO: Handle more than 100 namespaces
        const ownedNamespaces = await namespaceHttp.getNamespacesFromAccount(
          addressObject, new QueryParams({pageSize: 100, order: Order.ASC}), 
        ).toPromise()

        // store multisig info
        if (currentWallet && currentWallet.values.get('address') === address) {
          commit('currentWalletOwnedNamespaces', ownedNamespaces)
        }
        else if (currentSigner && address === getters.currentSignerAddress.plain()) {
          commit('currentSignerOwnedNamespaces', ownedNamespaces)
        }

        return ownedNamespaces
      }
      catch (e) {
        if (currentWallet && currentWallet.values.get('address') === address) {
          commit('currentWalletOwnedNamespaces', [])
        }
        else if (currentSigner && address === getters.currentSignerAddress.plain()) {
          commit('currentSignerOwnedNamespaces', [])
        }

        dispatch('diagnostic/ADD_ERROR', 'An error happened while trying to fetch owned namespaces: ' + e, {root: true})
        return null
      }
    },
    async REST_ANNOUNCE_PARTIAL(
      {commit, dispatch, rootGetters},
      {issuer, signedLock, signedPartial}
    ): Promise<BroadcastResult> {
      console.log("issuer REST_ANNOUNCE_PARTIAL", issuer)
      console.log("signedLock REST_ANNOUNCE_PARTIAL", signedLock)
      console.log("signedPartial REST_ANNOUNCE_PARTIAL", signedPartial)
      
      if (!issuer || issuer.length !== 40) {
        return ;
      }

      dispatch('diagnostic/ADD_DEBUG', 'Store action wallet/REST_ANNOUNCE_PARTIAL dispatched with: ' + JSON.stringify({
        issuer: issuer,
        signedLockHash: signedLock.hash,
        signedPartialHash: signedPartial.hash,
      }), {root: true})

      try {
        // - prepare REST parameters
        const currentPeer = rootGetters['network/currentPeer'].url
        const wsEndpoint = rootGetters['network/wsEndpoint']
        const transactionHttp = RESTService.create('TransactionHttp', currentPeer)

        // - prepare scoped *confirmation listener*
        const listener = new Listener(wsEndpoint, WebSocket)
        await listener.open()

        
        // - announce hash lock transaction and await confirmation
        transactionHttp.announce(signedLock)

        console.log("SIGNED LOCK HASH", signedLock.hash)
        
        // - listen for hash lock confirmation
        return new Promise((resolve, reject) => {
          const address = Address.createFromRawAddress(issuer)
          return listener.confirmed(address).subscribe(
            async (success) => {
              console.log("SUCCESS", success)
              // - hash lock confirmed, now announce partial
              const response = await transactionHttp.announceAggregateBonded(signedPartial)
              console.log("response", response)
              commit('removeSignedTransaction', signedLock)
              commit('removeSignedTransaction', signedPartial)
              return resolve(new BroadcastResult(signedPartial, true))
            },
            (error) => {
              commit('removeSignedTransaction', signedLock)
              commit('removeSignedTransaction', signedPartial)
              reject(new BroadcastResult(signedPartial, false))
            }
          )
        })
      }
      catch(e) {
        return new BroadcastResult(signedPartial, false, e.toString())
      }
    },
    async REST_ANNOUNCE_TRANSACTION(
      {commit, dispatch, rootGetters},
      signedTransaction: SignedTransaction
    ): Promise<BroadcastResult> {
      dispatch('diagnostic/ADD_DEBUG', 'Store action wallet/REST_ANNOUNCE_TRANSACTION dispatched with: ' + JSON.stringify({
        hash: signedTransaction.hash,
        payload: signedTransaction.payload
      }), {root: true})

      try {
        // prepare REST parameters
        const currentPeer = rootGetters['network/currentPeer'].url
        const transactionHttp = RESTService.create('TransactionHttp', currentPeer)

        // prepare symbol-sdk TransactionService
        const response = await transactionHttp.announce(signedTransaction)
        commit('removeSignedTransaction', signedTransaction)
        return new BroadcastResult(signedTransaction, true)
      }
      catch(e) {
        commit('removeSignedTransaction', signedTransaction)
        return new BroadcastResult(signedTransaction, false, e.toString())
      }
    },
    async REST_ANNOUNCE_COSIGNATURE(
      {commit, dispatch, rootGetters},
      cosignature: CosignatureSignedTransaction
    ): Promise<BroadcastResult> {

      dispatch('diagnostic/ADD_DEBUG', 'Store action wallet/REST_ANNOUNCE_COSIGNATURE dispatched with: ' + JSON.stringify({
        hash: cosignature.parentHash,
        signature: cosignature.signature,
        signerPublicKey: cosignature.signerPublicKey,
      }), {root: true})

      try {
        // prepare REST parameters
        const currentPeer = rootGetters['network/currentPeer'].url
        const transactionHttp = RESTService.create('TransactionHttp', currentPeer)

        // prepare symbol-sdk TransactionService
        const response = await transactionHttp.announceAggregateBondedCosignature(cosignature)
        return new BroadcastResult(cosignature, true)
      }
      catch(e) {
        return new BroadcastResult(cosignature, false, e.toString())
      }
    },
/// end-region scoped actions
  },
};
