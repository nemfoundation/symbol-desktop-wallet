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
import { Vue, Component, Prop } from 'vue-property-decorator';
import { CosignatureSignedTransactionQR } from 'symbol-qr-library';
import {
    NetworkType,
    TransferTransaction,
    Address,
    SignedTransaction,
    CosignatureSignedTransaction,
    PublicAccount
} from 'symbol-sdk';

import { QRCodeDetailItem } from '@/components/QRCode/QRCodeActions/TemplateQRAction/TemplateQRActionTs';
// @ts-ignore
import TemplateQRAction from '@/components/QRCode/QRCodeActions/TemplateQRAction/TemplateQRAction.vue';
// @ts-ignore
import MosaicAmountDisplay from '@/components/MosaicAmountDisplay/MosaicAmountDisplay.vue';
// @ts-ignore
import MaxFeeSelector from '@/components/MaxFeeSelector/MaxFeeSelector.vue';
import {TransactionCommand} from "@/services/TransactionCommand";
import {TransactionAnnouncerService} from "@/services/TransactionAnnouncerService";
@Component({
    components: { TemplateQRAction, MosaicAmountDisplay, MaxFeeSelector },
})
export default class CosignatureSignedTransactionQRActionTs extends Vue {
    @Prop({ default: null }) readonly qrCode!: CosignatureSignedTransactionQR;

    @Prop({ default: null }) readonly onSuccess: () => void;

    /**
     * SignedTransaction read from QR
     */
    tran: CosignatureSignedTransaction;

    /**
     * Get QR Code detail items
     *
     * @returns QRCodeDetailItem[]
     */
    public get detailItems(): QRCodeDetailItem[] {
        const items: QRCodeDetailItem[] = [];
        items.push(
            new QRCodeDetailItem(
                this.$t('qrcode_detail_item_type').toString(),
                this.$t('qrcode_detail_item_type_signedqr').toString(),
                true,
            ),
        );
        items.push(new QRCodeDetailItem(this.$t('qrcode_detail_item_network_type').toString(), NetworkType[this.qrCode.networkType], true));
        this.tran = (this.qrCode.singedTransaction as unknown) as CosignatureSignedTransaction;
        items.push(new QRCodeDetailItem(this.$t('from').toString(), PublicAccount.createFromPublicKey(this.tran.signerPublicKey, this.qrCode.networkType).address.plain(), true));
        items.push(new QRCodeDetailItem(this.$t('hash').toString(), this.tran.parentHash, true));
        return items;
    }

    public async onSubmit() {
        const transactionAnnouncerService = new TransactionAnnouncerService(this.$store);
        transactionAnnouncerService.announceAggregateBondedCosignature(this.tran);
        this.onSuccess();
    }
}
