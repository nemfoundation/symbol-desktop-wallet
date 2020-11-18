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
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ContactQR } from 'symbol-qr-library';
import { PublicAccount } from 'symbol-sdk';
import { Observable, of } from 'rxjs';
import { concatMap, pluck } from 'rxjs/operators';
// internal dependencies
import { AccountModel } from '@/core/database/entities/AccountModel';
// resources
// @ts-ignore
import failureIcon from '@/views/resources/img/monitor/failure.png';
import { mapGetters } from 'vuex';

@Component({
    computed: {
        ...mapGetters({
            generationHash: 'network/generationHash',
        }),
    },
    subscriptions() {
        const qrCode$ = this.$watchAsObservable('qrCodeArgs', {
            immediate: true,
        }).pipe(
            pluck('newValue'),
            concatMap((args) => {
                if (args instanceof ContactQR) {
                    return args.toBase64();
                }
                return of(failureIcon);
            }),
        );
        return { qrCode$ };
    },
})
export class AccountContactQRTs extends Vue {
    @Prop({
        default: null,
    })
    account: AccountModel;

    /**
     * Current network's generation hash
     * @var {string}
     */
    public generationHash: string;

    /**
     * QR Code
     * @type {Observable<string>}
     */
    public qrCode$: Observable<string>;

    /// region computed properties getter/setter
    get qrCodeArgs(): ContactQR {
        if (!this.account) {
            return null;
        }

        try {
            const publicAccount: PublicAccount = AccountModel.getObjects(this.account).publicAccount;
            return new ContactQR(
                this.account.name,
                // @ts-ignore // @TODO: SDK upgrade
                publicAccount,
                publicAccount.address.networkType,
                this.generationHash,
            );
        } catch (error) {
            return null;
        }
    }

    get downloadName(): string {
        return this.account ? `address-qr-${this.account.name}.png` : '';
    }
    /// end-region computed properties getter/setter
}
