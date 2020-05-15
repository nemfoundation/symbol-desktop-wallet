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
// external dependencies
import { HashLockTransaction, Mosaic, MosaicId, RawUInt64, SignedTransaction, UInt64 } from 'symbol-sdk'
// internal dependencies
import { TransactionView } from './TransactionView'
import { MosaicModel } from '@/core/database/entities/MosaicModel'
import { AttachedMosaic } from '@/services/MosaicService'
import { TransactionDetailItem } from '@/core/transactions/TransactionDetailItem'

export type HashLockTransactionFormFieldsType = {
  mosaic: { mosaicHex: string; amount: number }
  duration: number
  signedTransaction: SignedTransaction
  maxFee: number
}

// eslint-disable-next-line max-len
export class ViewHashLockTransaction extends TransactionView<HashLockTransactionFormFieldsType> {
  /**
   * Fields that are specific to transfer transactions
   * @var {string[]}
   */
  protected readonly fields: string[] = ['mosaic', 'duration', 'signedTransaction', 'maxFee']

  /**
   * Parse form items and return a ViewHashLockTransaction
   * @param {HashLockTransactionFormFieldsType} formItems
   * @return {ViewHashLockTransaction}
   */
  public parse(formItems: HashLockTransactionFormFieldsType): ViewHashLockTransaction {
    // - prepare mosaic entry
    const mosaicsInfo = this.$store.getters['mosaic/mosaics'] as MosaicModel[]
    if (undefined !== mosaicsInfo) {
      const mosaicInfo = mosaicsInfo.find((i) => i.mosaicIdHex === formItems.mosaic.mosaicHex)
      const mosaicDivisibility = mosaicInfo ? mosaicInfo.divisibility : 0
      // - create mosaic object
      const mosaic = new Mosaic(
        new MosaicId(RawUInt64.fromHex(formItems.mosaic.mosaicHex)),
        UInt64.fromUint(formItems.mosaic.amount * Math.pow(10, mosaicDivisibility)),
      )

      // - set values
      this.values.set('mosaic', mosaic)
    }
    // unknown mosaic info
    else {
      this.values.set(
        'mosaic',
        new Mosaic(new MosaicId(formItems.mosaic.mosaicHex), UInt64.fromUint(formItems.mosaic.amount)),
      )
    }

    this.values.set('duration', formItems.duration)
    this.values.set('signedTransaction', formItems.signedTransaction)

    // - set fee and return
    this.values.set('maxFee', formItems.maxFee)
    return this
  }

  /**
   * Use a transaction object and return a ViewHashLockTransaction
   * @param {ViewHashLockTransaction} transaction
   * @returns {ViewHashLockTransaction}
   */
  public use(transaction: HashLockTransaction): ViewHashLockTransaction {
    // - set transaction
    this.transaction = transaction

    // - populate common values
    this.initialize(transaction)

    const mosaic: AttachedMosaic = {
      id: transaction.mosaic.id,
      mosaicHex: transaction.mosaic.id.toHex(),
      amount: transaction.mosaic.amount.compact(),
    }

    // - prepare
    this.values.set('mosaic', mosaic)
    this.values.set('duration', transaction.duration.compact())
    this.values.set('signedTransaction', transaction.signedTransaction)

    return this
  }

  /**
   * Displayed items
   */
  public resolveDetailItems(): TransactionDetailItem[] {
    // get attached mosaic
    const attachedMosaic: AttachedMosaic = this.values.get('mosaic')
    return [
      {
        key: `locked_mosaic`,
        value: attachedMosaic,
        isMosaic: true,
      },
      { key: 'duration', value: this.values.get('duration') },
      {
        key: 'inner_transaction_hash',
        value: this.values.get('signedTransaction').hash,
      },
    ]
  }
}
