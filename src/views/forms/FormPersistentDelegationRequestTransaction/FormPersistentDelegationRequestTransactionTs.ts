/*
 * Copyright 2020 NEM (https://nem.io)
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
import {
    UInt64,
    AccountKeyLinkTransaction,
    LinkAction,
    Transaction,
    VrfKeyLinkTransaction,
    Account,
    NodeKeyLinkTransaction,
    PersistentDelegationRequestTransaction,
    AccountInfo,
    AggregateTransaction,
    PublicAccount,
    Deadline,
    LockFundsTransaction,
    Mosaic,
    SignedTransaction,
    Password,
    Crypto,
} from 'symbol-sdk';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { mapGetters } from 'vuex';
import Vue from 'vue';

// internal dependencies
import { Formatters } from '@/core/utils/Formatters';
import { FormTransactionBase } from '@/views/forms/FormTransactionBase/FormTransactionBase';

// child components
import { ValidationObserver } from 'vee-validate';
// @ts-ignore
import FormWrapper from '@/components/FormWrapper/FormWrapper.vue';
// @ts-ignore
import ModalTransactionConfirmation from '@/views/modals/ModalTransactionConfirmation/ModalTransactionConfirmation.vue';
// @ts-ignore
import SignerSelector from '@/components/SignerSelector/SignerSelector.vue';
// @ts-ignore
import MaxFeeAndSubmit from '@/components/MaxFeeAndSubmit/MaxFeeAndSubmit.vue';
// @ts-ignore
import NetworkNodeSelector from '@/components/NetworkNodeSelector/NetworkNodeSelector.vue';
// @ts-ignore
import FormRow from '@/components/FormRow/FormRow.vue';
// @ts-ignore
import ErrorTooltip from '@/components/ErrorTooltip/ErrorTooltip.vue';
import { ValidationProvider } from 'vee-validate';

import { feesConfig } from '@/config';
import { HarvestingStatus } from '@/store/Harvesting';
import { AccountTransactionSigner, TransactionAnnouncerService, TransactionSigner } from '@/services/TransactionAnnouncerService';
import { Observable, of } from 'rxjs';
import { flatMap, map, tap } from 'rxjs/operators';
import { BroadcastResult } from '@/core/transactions/BroadcastResult';
import { NodeModel } from '@/core/database/entities/NodeModel';
import { MosaicModel } from '@/core/database/entities/MosaicModel';
import { HarvestingModel } from '@/core/database/entities/HarvestingModel';
import { AccountModel } from '@/core/database/entities/AccountModel';
//@ts-ignore
import ButtonCopyToClipboard from '@/components/ButtonCopyToClipboard/ButtonCopyToClipboard.vue';
// @ts-ignore
import AccountPublicKeyDisplay from '@/components/AccountPublicKeyDisplay/AccountPublicKeyDisplay.vue';
// @ts-ignore
import ProtectedPrivateKeyDisplay from '@/components/ProtectedPrivateKeyDisplay/ProtectedPrivateKeyDisplay.vue';
// @ts-ignore
import ModalFormProfileUnlock from '@/views/modals/ModalFormProfileUnlock/ModalFormProfileUnlock.vue';
// @ts-ignore
import ModalConfirm from '@/views/modals/ModalConfirm/ModalConfirm.vue';

export enum HarvestingAction {
    START = 1,
    STOP = 2,
    SWAP = 3,
    ACTIVATE = 4,
}

@Component({
    components: {
        FormWrapper,
        ModalTransactionConfirmation,
        SignerSelector,
        ValidationObserver,
        MaxFeeAndSubmit,
        FormRow,
        NetworkNodeSelector,
        ErrorTooltip,
        ValidationProvider,
        ButtonCopyToClipboard,
        AccountPublicKeyDisplay,
        ProtectedPrivateKeyDisplay,
        ModalFormProfileUnlock,
        ModalConfirm,
    },
    computed: {
        ...mapGetters({
            currentHeight: 'network/currentHeight',
            currentSignerAccountInfo: 'account/currentSignerAccountInfo',
            harvestingStatus: 'harvesting/status',
            currentSignerHarvestingModel: 'harvesting/currentSignerHarvestingModel',
            networkBalanceMosaics: 'mosaic/networkBalanceMosaics',
            currentAccount: 'account/currentAccount',
        }),
    },
})
export class FormPersistentDelegationRequestTransactionTs extends FormTransactionBase {
    @Prop({ default: null }) signerAddress: string;
    //@Prop({ default: true }) withLink: boolean;

    /**
     * Formatters helpers
     */
    public formatters = Formatters;

    /**
     * Form items
     */
    public formItems = {
        nodeModel: { nodePublicKey: '' } as NodeModel,
        signerAddress: '',
    };

    private newVrfKeyAccount: Account;
    private newRemoteAccount: Account;

    public currentAccount: AccountModel;
    /**
     * Current signer account info
     */
    private currentSignerAccountInfo: AccountInfo;

    private currentSignerHarvestingModel: HarvestingModel;

    private action = HarvestingAction.START;

    private harvestingStatus: HarvestingStatus;

    private tempTransactionSigner: TransactionSigner;
    private tempAccount: Account;
    private vrfPrivateKeyTemp: string;
    private remotePrivateKeyTemp: string;

    private activating = false;
    /**
     * Current account owned mosaics
     * @protected
     * @type {MosaicModel[]}
     */
    private networkBalanceMosaics: MosaicModel;

    /**
     * Whether account is currently being unlocked
     * @var {boolean}
     */
    public isUnlockingAccount: boolean = false;

    public showConfirmationModal = false;

    private remoteAccountPrivateKey: string;
    private vrfPrivateKey: string;

    // password to decrypt linked encrypted private keys
    private password: string;
    /**
     * Reset the form with properties
     * @return {void}
     */
    protected resetForm() {
        // - set default form values
        this.action = HarvestingAction.START;
        // - maxFee must be absolute
        this.newVrfKeyAccount = Account.generateNewAccount(this.networkType);
        this.newRemoteAccount = Account.generateNewAccount(this.networkType);
        this.tempAccount = Account.generateNewAccount(this.networkType);
        this.tempTransactionSigner = new AccountTransactionSigner(this.tempAccount);
    }

    @Watch('currentSignerAccountInfo', { immediate: true })
    private currentSignerWatch() {
        this.formItems.signerAddress = this.signerAddress || this.currentSignerAccountInfo?.address.plain();

        if (this.isNodeKeyLinked) {
            this.formItems.nodeModel.nodePublicKey = this.currentSignerAccountInfo?.supplementalPublicKeys.node.publicKey;
            if (this.currentSignerHarvestingModel?.selectedHarvestingNode) {
                this.formItems.nodeModel = this.currentSignerHarvestingModel.selectedHarvestingNode;
            } else {
                this.formItems.nodeModel = { nodePublicKey: '' } as NodeModel;
            }
        } else {
            this.formItems.nodeModel = { nodePublicKey: '' } as NodeModel;
        }
    }

    /**
     * To get all the key link transactions
     */
    protected getKeyLinkTransactions(transactionSigner = this.tempTransactionSigner): Observable<Transaction[]> {
        const maxFee = UInt64.fromUint(feesConfig.highest); // fixed to the Highest, txs must get confirmed
        const txs: Transaction[] = [];

        /*
         LINK
         START => link all (new keys)
         STOP =>  unlink all (linked keys)
         SWAP =>  unlink(linked) + link all (new keys)
         */

        if (this.isAccountKeyLinked) {
            const accountKeyUnLinkTx = this.createAccountKeyLinkTx(
                this.currentSignerAccountInfo.supplementalPublicKeys.linked.publicKey,
                LinkAction.Unlink,
                maxFee,
            );
            txs.push(accountKeyUnLinkTx);
        }

        if (this.isVrfKeyLinked) {
            const vrfKeyUnLinkTx = this.createVrfKeyLinkTx(
                this.currentSignerAccountInfo.supplementalPublicKeys.vrf.publicKey,
                LinkAction.Unlink,
                maxFee,
            );
            txs.push(vrfKeyUnLinkTx);
        }

        if (this.isNodeKeyLinked) {
            const nodeUnLinkTx = this.createNodeKeyLinkTx(
                this.currentSignerAccountInfo.supplementalPublicKeys.node.publicKey,
                LinkAction.Unlink,
                maxFee,
            );

            txs.push(nodeUnLinkTx);
        }

        if (this.action !== HarvestingAction.STOP) {
            const accountKeyLinkTx = this.createAccountKeyLinkTx(this.newRemoteAccount.publicKey, LinkAction.Link, maxFee);
            const vrfKeyLinkTx = this.createVrfKeyLinkTx(this.newVrfKeyAccount.publicKey, LinkAction.Link, maxFee);
            const nodeLinkTx = this.createNodeKeyLinkTx(this.formItems.nodeModel.nodePublicKey, LinkAction.Link, maxFee);
            txs.push(accountKeyLinkTx, vrfKeyLinkTx, nodeLinkTx);
        }

        if (txs.length > 0) {
            if (this.action == HarvestingAction.START) {
                this.remotePrivateKeyTemp = this.newRemoteAccount?.privateKey;
                this.vrfPrivateKeyTemp = this.newVrfKeyAccount?.privateKey;
            }
            if (this.isMultisigMode()) {
                return this.toMultiSigAggregate(txs, maxFee, transactionSigner);
            } else {
                const aggregate = this.calculateSuggestedMaxFee(
                    AggregateTransaction.createComplete(
                        Deadline.create(this.epochAdjustment),
                        txs.map((t) => t.toAggregate(this.currentSignerAccount)),
                        this.networkType,
                        [],
                        maxFee,
                    ),
                );
                return of([aggregate]);
            }
        }
        return of([]);
    }

    public toMultiSigAggregate(txs: Transaction[], maxFee, transactionSigner: TransactionSigner) {
        const aggregate = this.calculateSuggestedMaxFee(
            AggregateTransaction.createBonded(
                Deadline.create(this.epochAdjustment),
                txs.map((t) => t.toAggregate(this.currentSignerAccount)),
                this.networkType,
                [],
                maxFee,
            ),
        );
        return transactionSigner.signTransaction(aggregate, this.generationHash).pipe(
            map((signedAggregateTransaction) => {
                const hashLock = this.calculateSuggestedMaxFee(
                    LockFundsTransaction.create(
                        Deadline.create(this.epochAdjustment),
                        new Mosaic(this.networkMosaic, UInt64.fromNumericString(this.networkConfiguration.lockedFundsPerAggregate)),
                        UInt64.fromUint(1000),
                        signedAggregateTransaction,
                        this.networkType,
                        maxFee,
                    ),
                );
                return [hashLock, aggregate];
            }),
        );
    }

    public decryptKeys(password?: Password) {
        if (
            this.currentSignerHarvestingModel?.encRemotePrivateKey &&
            this.currentSignerHarvestingModel?.encVrfPrivateKey &&
            this.action == HarvestingAction.ACTIVATE
        ) {
            this.remoteAccountPrivateKey = Crypto.decrypt(this.currentSignerHarvestingModel?.encRemotePrivateKey, password.value);
            this.vrfPrivateKey = Crypto.decrypt(this.currentSignerHarvestingModel?.encVrfPrivateKey, password.value);
        }
        return (this.password = password.value);
    }

    public getPersistentDelegationRequestTransaction(
        transactionSigner: TransactionSigner = this.tempTransactionSigner,
    ): Observable<Transaction[]> {
        const maxFee = UInt64.fromUint(feesConfig.highest);
        if (this.action !== HarvestingAction.STOP) {
            const persistentDelegationReqTx = PersistentDelegationRequestTransaction.createPersistentDelegationRequestTransaction(
                Deadline.create(this.epochAdjustment, this.isMultisigMode() ? 24 : 2),
                this.remoteAccountPrivateKey || this.newRemoteAccount.privateKey,
                this.vrfPrivateKey || this.newVrfKeyAccount.privateKey,
                this.formItems.nodeModel.nodePublicKey,
                this.networkType,
                maxFee,
            );

            return this.isMultisigMode()
                ? this.toMultiSigAggregate([persistentDelegationReqTx], maxFee, transactionSigner)
                : of([this.calculateSuggestedMaxFee(persistentDelegationReqTx)]);
        }
        return of([]);
    }

    public resolveTransactions(): Observable<Transaction[]> {
        if (this.action == HarvestingAction.ACTIVATE) {
            return this.getPersistentDelegationRequestTransaction();
        }
        return this.getKeyLinkTransactions();
    }
    public announce(service: TransactionAnnouncerService, transactionSigner: TransactionSigner): Observable<Observable<BroadcastResult>[]> {
        // announce the keyLink txs and save the vrf and remote private keys encrypted to the storage
        const accountAddress = this.currentSignerHarvestingModel.accountAddress;
        if (this.action !== HarvestingAction.ACTIVATE) {
            return this.getKeyLinkTransactions(transactionSigner).pipe(
                flatMap((transactions) => {
                    const signedTransactions = transactions.map((t) => transactionSigner.signTransaction(t, this.generationHash));
                    if (!signedTransactions.length) {
                        return of([]) as Observable<Observable<BroadcastResult>[]>;
                    }
                    if (this.isMultisigMode()) {
                        return of([this.announceHashAndAggregateBonded(service, signedTransactions)]);
                    } else {
                        return of(this.announceSimple(service, signedTransactions));
                    }
                }),
                tap((resArr) =>
                    resArr[0].subscribe((res) => {
                        if (res.success) {
                            if (this.vrfPrivateKeyTemp && this.remotePrivateKeyTemp) {
                                this.saveVrfKey(accountAddress, Crypto.encrypt(this.vrfPrivateKeyTemp, this.password));
                                this.saveRemoteKey(accountAddress, Crypto.encrypt(this.remotePrivateKeyTemp, this.password));
                            }
                            this.$store.dispatch('harvesting/UPDATE_ACCOUNT_IS_PERSISTENT_DEL_REQ_SENT', {
                                accountAddress,
                                isPersistentDelReqSent: false,
                            });

                            this.$store.dispatch('harvesting/UPDATE_ACCOUNT_SELECTED_HARVESTING_NODE', {
                                accountAddress,
                                selectedHarvestingNode: this.formItems.nodeModel,
                            });
                        }
                    }),
                ),
            );
        }
        // announce the persistent Delegation Request
        return this.getPersistentDelegationRequestTransaction(transactionSigner).pipe(
            flatMap((transactions) => {
                Vue.set(this, 'activating', true);
                const signedTransactions = transactions.map((t) => transactionSigner.signTransaction(t, this.generationHash));
                if (!signedTransactions.length) {
                    return of([]) as Observable<Observable<BroadcastResult>[]>;
                }
                if (this.isMultisigMode()) {
                    return of([this.announceHashAndAggregateBonded(service, signedTransactions)]);
                } else {
                    return of(this.announceSimple(service, signedTransactions));
                }
            }),
            tap((resArr) =>
                resArr[0].subscribe((res) => {
                    if (res.success) {
                        this.$store.dispatch('harvesting/UPDATE_ACCOUNT_IS_PERSISTENT_DEL_REQ_SENT', {
                            accountAddress,
                            isPersistentDelReqSent: true,
                        });
                    }
                    Vue.set(this, 'activating', false);
                }),
            ),
        );
    }

    private announceHashAndAggregateBonded(
        service: TransactionAnnouncerService,
        signedTransactions: Observable<SignedTransaction>[],
    ): Observable<BroadcastResult> {
        return signedTransactions[0].pipe(
            flatMap((signedHashLockTransaction) => {
                return signedTransactions[1].pipe(
                    flatMap((signedAggregateTransaction) => {
                        return service.announceHashAndAggregateBonded(signedHashLockTransaction, signedAggregateTransaction);
                    }),
                );
            }),
        );
    }

    private announceSimple(
        service: TransactionAnnouncerService,
        signedTransactions: Observable<SignedTransaction>[],
    ): Observable<BroadcastResult>[] {
        return signedTransactions.map((o) => o.pipe(flatMap((s) => service.announce(s))));
    }

    private calculateSuggestedMaxFee(transaction: Transaction): Transaction {
        const feeMultiplier = this.resolveFeeMultipler(transaction);
        if (!feeMultiplier) {
            return transaction;
        }
        if (transaction instanceof AggregateTransaction) {
            // @ts-ignore
            return transaction.setMaxFeeForAggregate(feeMultiplier, this.requiredCosignatures);
        } else {
            return transaction.setMaxFee(feeMultiplier);
        }
    }

    private resolveFeeMultipler(transaction: Transaction): number | undefined {
        if (transaction.maxFee.compact() == 1) {
            const fees =
                this.transactionFees.averageFeeMultiplier * 1.2 < this.transactionFees.minFeeMultiplier
                    ? this.transactionFees.minFeeMultiplier
                    : this.transactionFees.averageFeeMultiplier * 1.2;
            return fees || this.networkConfiguration.defaultDynamicFeeMultiplier;
        }
        if (transaction.maxFee.compact() == 2) {
            const fees =
                this.transactionFees.highestFeeMultiplier < this.transactionFees.minFeeMultiplier
                    ? this.transactionFees.minFeeMultiplier
                    : this.transactionFees.highestFeeMultiplier;
            return fees || this.networkConfiguration.defaultDynamicFeeMultiplier;
        }
        return undefined;
    }

    private saveVrfKey(accountAddress: string, encVrfPrivateKey: string) {
        this.$store.dispatch('harvesting/UPDATE_VRF_ACCOUNT_PRIVATE_KEY', { accountAddress, encVrfPrivateKey });
    }
    private saveRemoteKey(accountAddress: string, encRemotePrivateKey: string) {
        this.$store.dispatch('harvesting/UPDATE_REMOTE_ACCOUNT_PRIVATE_KEY', { accountAddress, encRemotePrivateKey });
    }

    private createAccountKeyLinkTx(publicKey: string, linkAction: LinkAction, maxFee: UInt64): AccountKeyLinkTransaction {
        return AccountKeyLinkTransaction.create(this.createDeadline(), publicKey, linkAction, this.networkType, maxFee);
    }
    private createVrfKeyLinkTx(publicKey: string, linkAction: LinkAction, maxFee: UInt64): VrfKeyLinkTransaction {
        return VrfKeyLinkTransaction.create(this.createDeadline(), publicKey, linkAction, this.networkType, maxFee);
    }
    private createNodeKeyLinkTx(publicKey: string, linkAction: LinkAction, maxFee: UInt64): NodeKeyLinkTransaction {
        return NodeKeyLinkTransaction.create(this.createDeadline(), publicKey, linkAction, this.networkType, maxFee);
    }

    /**
     * Whether all keys are linked
     */
    private get allKeysLinked(): boolean {
        return this.isAccountKeyLinked && this.isVrfKeyLinked && this.isNodeKeyLinked;
    }

    /**
     * Whether account key is linked
     */
    private get isAccountKeyLinked(): boolean {
        return !!this.currentSignerAccountInfo?.supplementalPublicKeys.linked;
    }

    /**
     * Whether vrf key is linked
     */
    private get isVrfKeyLinked(): boolean {
        return !!this.currentSignerAccountInfo?.supplementalPublicKeys.vrf;
    }

    /**
     * Whether node key is linked
     */
    private get isNodeKeyLinked(): boolean {
        return !!this.currentSignerAccountInfo?.supplementalPublicKeys.node;
    }

    /**
     * Setter for TRANSFER transactions that will be staged
     * @see {FormTransactionBase}
     * @throws {Error} If not overloaded in derivate component
     */
    protected setTransactions() {
        throw new Error('This transaction can not be staged');
    }

    public onStart() {
        this.action = HarvestingAction.START;
        if (this.networkBalanceMosaics.balance / Math.pow(10, this.networkBalanceMosaics.divisibility) < 10000) {
            this.$store.dispatch('notification/ADD_ERROR', this.$t('harvesting_account_insufficient_balance'));
            return;
        }
        this.onSubmit();
    }

    public onStop() {
        this.action = HarvestingAction.STOP;
        this.onSubmit();
    }

    public onSwap() {
        this.action = HarvestingAction.SWAP;
        this.onSubmit();
    }

    public get swapDisabled(): boolean {
        return (
            this.formItems.nodeModel.nodePublicKey?.toLowerCase() ===
            this.currentSignerAccountInfo.supplementalPublicKeys?.node?.publicKey?.toLowerCase()
        );
    }

    public onSubmit() {
        if (!this.allKeysLinked && !this.formItems.nodeModel.nodePublicKey.length) {
            this.$store.dispatch('notification/ADD_ERROR', this.$t('invalid_node'));
            return;
        }

        // - open signature modal
        this.onShowConfirmationModal();
    }

    public get currentSignerAccount() {
        return PublicAccount.createFromPublicKey(this.currentSignerPublicKey, this.networkType);
    }

    private get isPersistentDelReqSent() {
        return this.currentSignerHarvestingModel?.isPersistentDelReqSent;
    }
    public async activateAccount() {
        this.showConfirmationModal = true;
        this.hasAccountUnlockModal = true;
    }

    public get hasAccountUnlockModal(): boolean {
        return this.isUnlockingAccount;
    }
    public set hasAccountUnlockModal(f: boolean) {
        this.isUnlockingAccount = f;
    }
    /**
     * When account is unlocked, the sub account can be created
     */
    public async onAccountUnlocked(account: Account, password: Password) {
        try {
            this.action = HarvestingAction.ACTIVATE;
            this.remoteAccountPrivateKey = Crypto.decrypt(this.currentSignerHarvestingModel?.encRemotePrivateKey, password.value);
            this.vrfPrivateKey = Crypto.decrypt(this.currentSignerHarvestingModel?.encVrfPrivateKey, password.value);
            this.onSubmit();
        } catch (e) {
            this.$store.dispatch('notification/ADD_ERROR', 'An error happened, please try again.');
            console.error(e);
        }
    }
}
