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
import {
  MosaicId, 
  Mosaic,
  TransferTransaction,
  TransactionType,
  Address,
  Message,
  PublicAccount,
  NamespaceId,
  UInt64,
} from 'symbol-sdk'
import {Component, Vue, Prop} from 'vue-property-decorator'

// internal dependencies
import {Formatters} from '@/core/utils/Formatters'
import {ViewTransferTransaction, TransferFormFieldsType} from '@/core/transactions/ViewTransferTransaction'
import {FormTransactionBase} from '@/views/forms/FormTransactionBase/FormTransactionBase'
import {TransactionFactory} from '@/core/transactions/TransactionFactory'
import {AddressValidator} from '@/core/validation/validators'
import {MosaicInputsManager} from './MosaicInputsManager'

interface MosaicAttachment {
  mosaicHex: string
  /**
   * Relative amount
   */
  amount: number
}

// child components
import {ValidationObserver} from 'vee-validate'
// @ts-ignore
import AmountInput from '@/components/AmountInput/AmountInput.vue'
// @ts-ignore
import FormWrapper from '@/components/FormWrapper/FormWrapper.vue'
// @ts-ignore
import MessageInput from '@/components/MessageInput/MessageInput.vue'
// @ts-ignore
import ModalTransactionConfirmation from '@/views/modals/ModalTransactionConfirmation/ModalTransactionConfirmation.vue'
// @ts-ignore
import MosaicAttachmentInput from '@/components/MosaicAttachmentInput/MosaicAttachmentInput.vue'
// @ts-ignore
import MosaicSelector from '@/components/MosaicSelector/MosaicSelector.vue'
// @ts-ignore
import RecipientInput from '@/components/RecipientInput/RecipientInput.vue'
// @ts-ignore
import SignerSelector from '@/components/SignerSelector/SignerSelector.vue'
// @ts-ignore
import MaxFeeAndSubmit from '@/components/MaxFeeAndSubmit/MaxFeeAndSubmit.vue'
// @ts-ignore
import FormRow from '@/components/FormRow/FormRow.vue'

type MosaicAttachmentType = {
  id: MosaicId,
  mosaicHex: string,
  name: string,
  amount: number,
  uid: number,
}

@Component({
  components: {
    AmountInput,
    FormWrapper,
    MessageInput,
    ModalTransactionConfirmation,
    MosaicAttachmentInput,
    MosaicSelector,
    RecipientInput,
    SignerSelector,
    ValidationObserver,
    MaxFeeAndSubmit,
    FormRow,
  },
})
export class FormTransferTransactionTs extends FormTransactionBase {
/// region component properties
  @Prop({
    default: null
  }) signer: PublicAccount

  @Prop({
    default: null
  }) recipient: Address

  @Prop({
    default: null
  }) mosaics: Mosaic[]

  @Prop({
    default: null
  }) message: Message

  @Prop({
    default: false
  }) disableSubmit: boolean

  @Prop({
    default: false
  }) hideSigner: boolean
/// end-region component properties

  /**
   * Formatters helpers
   * @var {Formatters}
   */
  public formatters = Formatters

  /**
   * Form items
   * @var {any}
   */
  public formItems = {
    signerPublicKey: '',
    attachedMosaics: [],
    recipientRaw: '',
    recipient: null,
    selectedMosaicHex: '',
    relativeAmount: 0,
    messagePlain: '',
    maxFee: 0
  }

  protected mosaicInputsManager = MosaicInputsManager.initialize(this.currentWalletMosaics)

  /**
   * Reset the form with properties
   * @return {void}
   */
  protected resetForm() {
    // - initialize mosaic inputs manager
    this.mosaicInputsManager = MosaicInputsManager.initialize(this.currentWalletMosaics)

    // - re-populate form if transaction staged
    if (this.stagedTransactions.length) {
      const transfer = this.stagedTransactions.find(staged => staged.type === TransactionType.TRANSFER)
      if (transfer === undefined) return
      this.setTransactions([transfer as TransferTransaction])
      this.isAwaitingSignature = true
      return ;
    }

    // - set default form values
    this.formItems.signerPublicKey = !!this.signer ? this.signer.publicKey : this.currentWallet.values.get('publicKey')
    this.formItems.selectedMosaicHex = this.networkMosaic.toHex()
    this.formItems.recipientRaw = !!this.recipient ? this.recipient.plain() : ''
    this.formItems.recipient = !!this.recipient ? this.recipient : null
    this.formItems.attachedMosaics = !!this.mosaics && this.mosaics.length
      ? this.mosaicsToAttachments(this.mosaics)
      : [{mosaicHex: this.networkMosaic.id.toHex(), amount: 0, uid: 1}]

    this.formItems.messagePlain = !!this.message ? Formatters.hexToUtf8(this.message.payload) : ''

    // - maxFee must be absolute
    this.formItems.maxFee = this.defaultFee

    // - affect attached mosaics slots
    this.formItems.attachedMosaics.forEach(
      ({mosaicHex, uid}) => this.mosaicInputsManager.setSlot(mosaicHex, uid),
    )
  }

  /**
   * Getter for whether forms should aggregate transactions
   * @see {FormTransactionBase}
   * @return {boolean} True if creating transfer for multisig
   */
  protected isAggregateMode(): boolean {
    return this.isCosignatoryMode
  }

  /**
   * Getter for TRANSFER transactions that will be staged
   * @see {FormTransactionBase}
   * @return {TransferTransaction[]}
   */
  protected getTransactions(): TransferTransaction[] {
    this.factory = new TransactionFactory(this.$store)
    try {
      // - read form
        const data: TransferFormFieldsType = {
        recipient: this.instantiatedRecipient,
        mosaics: this.attachedMosaics
          .filter(({uid}) => uid) // filter out null values
          .map((spec: {
            mosaicHex: string, amount: number,
          }): {mosaicHex: string, amount: number} => ({
              mosaicHex: spec.mosaicHex,
              amount: spec.amount // amount is relative
          })),
        message: this.formItems.messagePlain,
        maxFee: UInt64.fromUint(this.formItems.maxFee),
      }
      
      // - prepare transaction parameters
      let view = new ViewTransferTransaction(this.$store)
      view = view.parse(data)
      
      // - prepare transfer transaction
      return [this.factory.build(view)]
    } catch (error) {
      console.error('Error happened in FormTransferTransaction.transactions(): ', error)
    }
  }
  
  /**
   * Setter for TRANSFER transactions that will be staged
   * @see {FormTransactionBase}
   * @param {TransferTransaction[]} transactions
   * @throws {Error} If not overloaded in derivate component
   */
  protected setTransactions(transactions: TransferTransaction[]) {
    // - this form creates only 1 transaction
    const transaction = transactions.shift()

    // - populate recipient
    this.formItems.recipientRaw = transaction.recipientAddress instanceof Address
      ? transaction.recipientAddress.plain()
      : (transaction.recipientAddress as NamespaceId).fullName
    
    // - populate attached mosaics
    this.attachedMosaics = this.mosaicsToAttachments(transaction.mosaics)
    
    // - convert and populate message
    this.formItems.messagePlain = Formatters.hexToUtf8(transaction.message.payload)
    
    // - populate maxFee
    this.formItems.maxFee = transaction.maxFee.compact()
  }

/// region computed properties getter/setter
  /**
   * Getter for attached mosaics
   * @return {MosaicAttachmentType[]}
   */
  public get attachedMosaics(): MosaicAttachmentType[] {
    if (this.mosaics && this.mosaics.length) {
      return this.mosaicsToAttachments(this.mosaics)
    }

    return this.formItems.attachedMosaics || []
  }

  /**
   * Setter for attached mosaics
   * @param {MosaicAttachmentType[]} attachments
   */
  public set attachedMosaics(attachments: MosaicAttachmentType[]) {
    this.formItems.attachedMosaics = attachments
  }

  /**
   * Recipient used in the transaction
   * @readonly
   * @protected
   * @type {(Address | NamespaceId)}
   */
  protected get instantiatedRecipient(): Address | NamespaceId {
    const {recipientRaw} = this.formItems

    if (!recipientRaw) return null

    if (AddressValidator.validate(recipientRaw)) {
      return Address.createFromRawAddress(recipientRaw)
    }

    return new NamespaceId(recipientRaw)
  }
/// end-region computed properties getter/setter

  /**
   * Hook called when the child component MosaicAttachmentDisplay triggers
   * the event 'delete'
   * @return {void}
   */
  public onDeleteMosaic(id: MosaicId) {
    const updatedAttachedMosaics = [...this.formItems.attachedMosaics]
      .filter(({mosaicHex}) => mosaicHex !== id.toHex())

    // fixes reactivity on attachedMosaics (observer resolution)
    Vue.set(this.formItems, 'attachedMosaics', updatedAttachedMosaics)
  }

  /**
   * Hook called when the child component ButtonAdd triggers
   * the event 'click'
   * @return {void}
   */
  protected onMosaicInputChange(payload: {
    mosaicAttachment: MosaicAttachment
    inputIndex: number
  }): void {
    const {mosaicAttachment, inputIndex} = payload

    // set slot
    this.mosaicInputsManager.setSlot(mosaicAttachment.mosaicHex, inputIndex)

    // update formItems
    const newAttachedMosaics = [...this.formItems.attachedMosaics]
    const indexToUpdate = newAttachedMosaics.findIndex(({uid}) => uid == inputIndex)
    newAttachedMosaics[indexToUpdate] = mosaicAttachment
    Vue.set(this.formItems, 'attachedMosaics', newAttachedMosaics)
  }

  /**
   * Handle deletion of a mosaic input
   * @protected
   * @param {number} inputIndex
   */
  protected onDeleteMosaicInput(index: number): void {
    console.table(this.formItems.attachedMosaics.map(x => x))
    // unset mosaic input slot
    this.mosaicInputsManager.unsetSlot(index)

    // update formItems, set input uid to null
    const indexToUpdate = this.formItems.attachedMosaics.findIndex(({uid}) => uid == index)
    Vue.set(this.formItems.attachedMosaics, indexToUpdate, {uid: null})
  }

  /**
   * Internal helper to format a {Mosaic} entry into
   * an array of MosaicAttachmentType used in this form.
   * @internal
   * @param {Mosaic[]} mosaics 
   * @return {MosaicAttachmentType[]}
   */
  protected mosaicsToAttachments(mosaics: Mosaic[]): MosaicAttachmentType[] {
    return mosaics.map(
      mosaic => {
        const info = this.mosaicsInfo.find(i => i.id.equals(mosaic.id))
        const div = info ? info.divisibility : 0
        // amount will be converted to RELATIVE
        return {
          id: mosaic.id as MosaicId, //XXX resolve mosaicId from namespaceId
          mosaicHex: mosaic.id.toHex(), // XXX resolve mosaicId from namespaceId
          name: this.getMosaicName(mosaic.id),
          amount: mosaic.amount.compact() / Math.pow(10, div),
          uid: Math.floor(Math.random() * 10e6), // used to index dynamic inputs
        }
      })
  }

  protected addMosaicAttachmentInput() {
    if (!this.mosaicInputsManager.hasFreeSlots()) return
    const uid = Math.floor(Math.random() * 10e6)
    const [mosaicToAffectToNewInput] = this.mosaicInputsManager.getMosaicsBySlot(uid)
    this.mosaicInputsManager.setSlot(mosaicToAffectToNewInput, uid)
    this.formItems.attachedMosaics.push({
      mosaicHex: mosaicToAffectToNewInput,
      amount: 0,
      uid,
    })
  }
}
