/*
 * Copyright 2020 NEM Foundation (https://nem.io)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 *
 */
import { Store } from 'vuex'
import {
  Account,
  AccountAddressRestrictionTransaction,
  AccountLinkTransaction,
  AccountMetadataTransaction,
  AccountMosaicRestrictionTransaction,
  AccountOperationRestrictionTransaction,
  AddressAliasTransaction,
  AggregateTransaction,
  BlockInfo,
  CosignatureSignedTransaction,
  CosignatureTransaction,
  Deadline,
  HashLockTransaction,
  LockFundsTransaction,
  Mosaic,
  MosaicAddressRestrictionTransaction,
  MosaicAliasTransaction,
  MosaicDefinitionTransaction,
  MosaicGlobalRestrictionTransaction,
  MosaicId,
  MosaicMetadataTransaction,
  MosaicSupplyChangeTransaction,
  MultisigAccountModificationTransaction,
  NamespaceMetadataTransaction,
  NamespaceRegistrationTransaction,
  NetworkType,
  PublicAccount,
  SecretLockTransaction,
  SecretProofTransaction,
  SignedTransaction,
  Transaction,
  TransactionType,
  TransferTransaction,
  UInt64,
} from 'symbol-sdk'
// internal dependencies
import { AbstractService } from './AbstractService'
import { AccountModel } from '@/core/database/entities/AccountModel'
import { BroadcastResult } from '@/core/transactions/BroadcastResult'
import { ViewMosaicDefinitionTransaction } from '@/core/transactions/ViewMosaicDefinitionTransaction'
import { ViewMosaicSupplyChangeTransaction } from '@/core/transactions/ViewMosaicSupplyChangeTransaction'
import { ViewNamespaceRegistrationTransaction } from '@/core/transactions/ViewNamespaceRegistrationTransaction'
import { ViewTransferTransaction } from '@/core/transactions/ViewTransferTransaction'
import { ViewAliasTransaction } from '@/core/transactions/ViewAliasTransaction'
import { ViewMultisigAccountModificationTransaction } from '@/core/transactions/ViewMultisigAccountModificationTransaction'
import { ViewHashLockTransaction } from '@/core/transactions/ViewHashLockTransaction'
import { ViewUnknownTransaction } from '@/core/transactions/ViewUnknownTransaction'
import { NetworkConfigurationModel } from '@/core/database/entities/NetworkConfigurationModel'

/// region custom types
export type TransactionViewType =
  | ViewMosaicDefinitionTransaction
  | ViewMosaicSupplyChangeTransaction
  | ViewNamespaceRegistrationTransaction
  | ViewTransferTransaction
  | ViewUnknownTransaction
  | ViewAliasTransaction
  | ViewAliasTransaction
  | ViewMultisigAccountModificationTransaction
  | ViewHashLockTransaction

/// end-region custom types

export class TransactionService extends AbstractService {
  /**
   * Service name
   * @var {string}
   */
  public name: string = 'transaction'

  /**
   * Vuex Store
   * @var {Vuex.Store}
   */
  public $store: Store<any>

  /**
   * Construct a service instance around \a store
   * @param store
   */
  constructor(store?: Store<any>) {
    super()
    this.$store = store
  }

  /// region specialised signatures
  public getView(transaction: MosaicDefinitionTransaction): ViewMosaicDefinitionTransaction
  public getView(transaction: MosaicSupplyChangeTransaction): ViewMosaicSupplyChangeTransaction
  public getView(transaction: NamespaceRegistrationTransaction): ViewNamespaceRegistrationTransaction
  public getView(transaction: TransferTransaction): ViewTransferTransaction
  public getView(transaction: MosaicAliasTransaction): ViewAliasTransaction
  public getView(transaction: AddressAliasTransaction): ViewAliasTransaction
  public getView(transaction: MultisigAccountModificationTransaction): ViewMultisigAccountModificationTransaction
  public getView(transaction: HashLockTransaction): ViewHashLockTransaction
  // XXX not implemented yet
  public getView(transaction: AccountAddressRestrictionTransaction): ViewUnknownTransaction
  public getView(transaction: AccountLinkTransaction): ViewUnknownTransaction
  public getView(transaction: AccountMetadataTransaction): ViewUnknownTransaction
  public getView(transaction: AccountMosaicRestrictionTransaction): ViewUnknownTransaction
  public getView(transaction: AccountOperationRestrictionTransaction): ViewUnknownTransaction
  public getView(transaction: AggregateTransaction): ViewUnknownTransaction
  public getView(transaction: MosaicAddressRestrictionTransaction): ViewUnknownTransaction
  public getView(transaction: MosaicGlobalRestrictionTransaction): ViewUnknownTransaction
  public getView(transaction: MosaicMetadataTransaction): ViewUnknownTransaction
  public getView(transaction: NamespaceMetadataTransaction): ViewUnknownTransaction
  public getView(transaction: SecretLockTransaction): ViewUnknownTransaction
  public getView(transaction: SecretProofTransaction): ViewUnknownTransaction
  /// end-region specialised signatures

  /**
   * Returns true when \a transaction is an incoming transaction
   * @param {Transaction} transaction
   * @return {TransactionViewType}
   * @throws {Error} On unrecognized transaction type (view not implemented)
   */
  public getView(transaction: Transaction): TransactionViewType {
    // - store shortcuts
    const currentAccount: AccountModel = this.$store.getters['account/currentAccount']
    const knownBlocks: BlockInfo[] = this.$store.getters['transaction/blocks']

    // - interpret transaction type and initialize view
    let view: TransactionViewType

    switch (transaction.type) {
      /// region XXX views for transaction types not yet implemented
      case TransactionType.ACCOUNT_ADDRESS_RESTRICTION:
      case TransactionType.ACCOUNT_LINK:
      case TransactionType.ACCOUNT_METADATA:
      case TransactionType.ACCOUNT_MOSAIC_RESTRICTION:
      case TransactionType.ACCOUNT_OPERATION_RESTRICTION:
      case TransactionType.AGGREGATE_BONDED:
      case TransactionType.AGGREGATE_COMPLETE:
      case TransactionType.MOSAIC_ADDRESS_RESTRICTION:
      case TransactionType.MOSAIC_GLOBAL_RESTRICTION:
      case TransactionType.MOSAIC_METADATA:
      case TransactionType.NAMESPACE_METADATA:
      case TransactionType.SECRET_LOCK:
      case TransactionType.SECRET_PROOF:
        view = new ViewUnknownTransaction(this.$store)
        view = view.use(transaction)
        break

      /// end-region XXX views for transaction types not yet implemented
      case TransactionType.HASH_LOCK:
        view = new ViewHashLockTransaction(this.$store)
        view = view.use(transaction as HashLockTransaction)
        break
      case TransactionType.MULTISIG_ACCOUNT_MODIFICATION:
        view = new ViewMultisigAccountModificationTransaction(this.$store)
        view = view.use(transaction as MultisigAccountModificationTransaction)
        break
      case TransactionType.MOSAIC_DEFINITION:
        view = new ViewMosaicDefinitionTransaction(this.$store)
        view = view.use(transaction as MosaicDefinitionTransaction)
        break
      case TransactionType.MOSAIC_SUPPLY_CHANGE:
        view = new ViewMosaicSupplyChangeTransaction(this.$store)
        view = view.use(transaction as MosaicSupplyChangeTransaction)
        break
      case TransactionType.NAMESPACE_REGISTRATION:
        view = new ViewNamespaceRegistrationTransaction(this.$store)
        view = view.use(transaction as NamespaceRegistrationTransaction)
        break
      case TransactionType.TRANSFER:
        view = new ViewTransferTransaction(this.$store)
        view = view.use(transaction as TransferTransaction)
        break
      case TransactionType.MOSAIC_ALIAS:
        view = new ViewAliasTransaction(this.$store)
        view = view.use(transaction as MosaicAliasTransaction)
        break
      case TransactionType.ADDRESS_ALIAS:
        view = new ViewAliasTransaction(this.$store)
        view = view.use(transaction as AddressAliasTransaction)
        break
      default:
        // - throw on transaction view not implemented
        this.$store.dispatch('diagnostic/ADD_ERROR', `View not implemented for transaction type '${transaction.type}'`)
        throw new Error(`View not implemented for transaction type '${transaction.type}'`)
    }

    // - try to find block for fee information
    const height = transaction.transactionInfo ? transaction.transactionInfo.height : undefined
    const block: BlockInfo = !height ? undefined : knownBlocks.find((k) => k.height.equals(height))

    // - set helper fields
    view.values.set('isIncoming', false)
    view.values.set('hasBlockInfo', undefined !== block)

    // - initialize fee fields
    view.values.set('maxFee', transaction.maxFee.compact())
    if (block) {
      view.values.set('effectiveFee', transaction.size * block.feeMultiplier)
    }

    // - update helper fields by transaction type
    if (TransactionType.TRANSFER === transaction.type) {
      const transfer = transaction as TransferTransaction
      view.values.set('isIncoming', transfer.recipientAddress.equals(AccountModel.getObjects(currentAccount).address))
    }

    return view
  }

  /**
   * Create a hash lock transaction for aggregate bonded
   * transactions \a aggregateTx
   *
   * @param {SignedTransaction} aggregateTx
   * @param {UInt64} the lock max fee.
   * @return {LockFundsTransaction}
   */
  public createHashLockTransaction(aggregateTx: SignedTransaction, maxFee: UInt64): LockFundsTransaction {
    // - shortcuts
    const networkMosaic: MosaicId = this.$store.getters['mosaic/networkMosaic']
    const networkType: NetworkType = this.$store.getters['network/networkType']
    const networkConfiguration: NetworkConfigurationModel = this.$store.getters['network/networkConfiguration']

    // - create hash lock
    return LockFundsTransaction.create(
      Deadline.create(),
      new Mosaic(networkMosaic, UInt64.fromNumericString(networkConfiguration.lockedFundsPerAggregate)),
      UInt64.fromUint(1000), // duration=1000
      aggregateTx,
      networkType,
      maxFee,
    )
  }

  /**
   * Co-sign transaction \a partial with \a account
   *
   * @param {Account} account
   * @param {AggregateTransaction} partial
   * @return {CosignatureSignedTransaction[]}
   */
  public cosignPartialTransaction(account: Account, partial: AggregateTransaction): CosignatureSignedTransaction {
    // - create cosignature and sign
    const cosignature = CosignatureTransaction.create(partial)
    const signedCosig = account.signCosignatureTransaction(cosignature)

    // - notify diagnostics
    this.$store.dispatch(
      'diagnostic/ADD_DEBUG',
      `Co-signed transaction with account ${account.address.plain()} and result: ${JSON.stringify({
        parentHash: signedCosig.parentHash,
        signature: signedCosig.signature,
      })}`,
    )

    return signedCosig
  }

  /**
   * Sign transactions that are on stage with \a account
   *
   * @param {Account} account
   * @return {SignedTransaction[]}
   */
  public signStagedTransactions(account: Account): SignedTransaction[] {
    // - shortcuts
    const transactions: Transaction[] = this.$store.getters['account/stagedTransactions']
    const generationHash: string = this.$store.getters['network/generationHash']
    const signedTransactions = []
    // - iterate transaction that are "on stage"
    for (let i = 0, m = transactions.length; i < m; i++) {
      // - read transaction from stage
      const staged = transactions[i]

      // - sign transaction with \a account
      const signedTx = account.sign(staged, generationHash)
      this.$store.commit('account/addSignedTransaction', signedTx)
      signedTransactions.push(signedTx)

      // - notify diagnostics
      this.$store.dispatch(
        'diagnostic/ADD_DEBUG',
        `Signed transaction with account ${account.address.plain()} and result: ${JSON.stringify({
          hash: signedTx.hash,
          payload: signedTx.payload,
        })}`,
      )
    }

    return signedTransactions
  }

  /**
   * Aggregate transactions that are on stage, then sign
   * with \a account. This will sign an AGGREGATE COMPLETE
   * transaction and should not be used for multi-signature.
   *
   * @param {Account} account
   * @return {SignedTransaction[]}
   */
  public signAggregateStagedTransactions(account: Account): SignedTransaction[] {
    // - shortcuts
    const networkType: NetworkType = this.$store.getters['network/networkType']
    const transactions: Transaction[] = this.$store.getters['account/stagedTransactions']
    const generationHash: string = this.$store.getters['network/generationHash']
    const signedTransactions = []

    if (!transactions.length) {
      return signedTransactions
    }

    // - aggregate staged transactions
    const maxFee = transactions.sort((a, b) => a.maxFee.compare(b.maxFee))[0].maxFee

    // - aggregate staged transactions
    const aggregateTx = AggregateTransaction.createComplete(
      Deadline.create(),
      // - format as `InnerTransaction`
      transactions.map((t) => t.toAggregate(account.publicAccount)),
      networkType,
      [],
      maxFee,
    )

    // - sign aggregate transaction
    const signedTx = account.sign(aggregateTx, generationHash)
    this.$store.commit('account/addSignedTransaction', signedTx)
    signedTransactions.push(signedTx)

    // - notify diagnostics
    this.$store.dispatch(
      'diagnostic/ADD_DEBUG',
      `Signed aggregate transaction with account ${account.address.plain()} and result: ${JSON.stringify({
        hash: signedTx.hash,
        payload: signedTx.payload,
      })}`,
    )

    return signedTransactions
  }

  /**
   * Aggregate transactions that are on stage, then create a spam
   * protection hash lock, then sign with \a account.
   *
   * This will sign an AGGREGATE BONDED (partial transaction) and
   * must be used for multi-signature accounts.
   *
   * The resulting signed transaction must be announced as a partial,
   * following the _confirmation in a block_ of the hash lock transaction.
   *
   * @param {Account} account
   * @return {SignedTransaction[]}
   */
  public signMultisigStagedTransactions(
    multisigAccount: PublicAccount,
    cosignatoryAccount: Account,
  ): SignedTransaction[] {
    // - shortcuts
    const networkType: NetworkType = this.$store.getters['network/networkType']
    const transactions: Transaction[] = this.$store.getters['account/stagedTransactions']
    const generationHash: string = this.$store.getters['network/generationHash']
    const signedTransactions = []

    if (!transactions.length) {
      return signedTransactions
    }

    // - aggregate staged transactions
    const maxFee = transactions.sort((a, b) => a.maxFee.compare(b.maxFee))[0].maxFee

    const aggregateTx = AggregateTransaction.createBonded(
      Deadline.create(),
      // - format as `InnerTransaction`
      transactions.map((t) => t.toAggregate(multisigAccount)),
      networkType,
      [],
      maxFee,
    )

    // - sign aggregate transaction and create lock
    const signedTx = cosignatoryAccount.sign(aggregateTx, generationHash)
    const hashLock = this.createHashLockTransaction(signedTx, maxFee)

    // - sign hash lock and push
    const signedLock = cosignatoryAccount.sign(hashLock, generationHash)

    // - push signed transactions (order matters)
    this.$store.commit('account/addSignedTransaction', signedLock)
    this.$store.commit('account/addSignedTransaction', signedTx)
    signedTransactions.push(signedLock)
    signedTransactions.push(signedTx)

    // - notify diagnostics
    this.$store.dispatch(
      'diagnostic/ADD_DEBUG',
      `Signed hash lock and aggregate bonded for account ${multisigAccount.address.plain()} with cosignatory ${cosignatoryAccount.address.plain()} and result: ${JSON.stringify(
        {
          hashLockTransactionHash: signedTransactions[0].hash,
          aggregateTransactionHash: signedTransactions[1].hash,
        },
      )}`,
    )

    return signedTransactions
  }

  /**
   * Announce _signed_ transactions.
   *
   * This method will pick any *signed transaction* excluding
   * aggregate BONDED and hash lock transactions.
   *
   * @return {Observable<BroadcastResult[]>}
   */
  public async announceSignedTransactions(): Promise<BroadcastResult[]> {
    // - shortcuts
    const signedTransactions = this.$store.getters['account/signedTransactions']

    // - simple transactions only
    const transactions = signedTransactions.filter(
      (tx) => ![TransactionType.AGGREGATE_BONDED, TransactionType.HASH_LOCK].includes(tx.type),
    )

    const results: BroadcastResult[] = []
    for (let i = 0, m = transactions.length; i < m; i++) {
      const transaction = transactions[i]
      const result = await this.$store.dispatch('account/REST_ANNOUNCE_TRANSACTION', transaction)
      results.push(result)
    }

    // - reset signature flow
    this.$store.commit('account/stageOptions', {
      isAggregate: false,
      isMultisig: false,
    })

    return results
  }

  /**
   * Announce _partial_ transactions.
   *
   * This method will pick only aggregate BONDED and hash
   * lock transactions.
   *
   * @param {PublicAccount} issuer
   * @return {Observable<BroadcastResult[]>}
   * @throws {Error}  On missing signed hash lock transaction.
   */
  public async announcePartialTransactions(issuer: PublicAccount): Promise<BroadcastResult[]> {
    // - shortcuts
    const signedTransactions = this.$store.getters['account/signedTransactions']

    // - read transactions
    const hashLockTransaction = signedTransactions.find((tx) => TransactionType.HASH_LOCK === tx.type)
    const aggregateTransaction = signedTransactions.find((tx) => TransactionType.AGGREGATE_BONDED === tx.type)

    // - validate hash lock availability
    if (undefined === hashLockTransaction) {
      throw new Error('Partial transactions (aggregate bonded) must be preceeded by a hash lock transaction.')
    }

    // - announce lock, await confirmation and announce partial
    const result = await this.$store.dispatch('account/REST_ANNOUNCE_PARTIAL', {
      issuer: issuer.address.plain(),
      signedLock: hashLockTransaction,
      signedPartial: aggregateTransaction,
    })

    // - reset signature flow
    this.$store.commit('account/stageOptions', {
      isAggregate: false,
      isMultisig: false,
    })

    return [result]
  }

  /**
   * Announce _cosignature_ transactions.
   *
   * @param {PublicAccount} issuer
   * @return {Observable<BroadcastResult[]>}
   * @throws {Error}  On missing signed hash lock transaction.
   */
  public async announceCosignatureTransactions(
    cosignatures: CosignatureSignedTransaction[],
  ): Promise<BroadcastResult[]> {
    const results: BroadcastResult[] = []
    for (let i = 0, m = cosignatures.length; i < m; i++) {
      const cosignature = cosignatures[i]
      const result = await this.$store.dispatch('account/REST_ANNOUNCE_COSIGNATURE', cosignature)
      results.push(result)
    }

    return results
  }
}
