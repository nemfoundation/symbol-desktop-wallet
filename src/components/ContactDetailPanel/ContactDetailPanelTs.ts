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
// external dependencies
import { Component, Vue } from 'vue-property-decorator';
import { mapGetters } from 'vuex';
// child components
// @ts-ignore
import AccountNameDisplay from '@/components/AccountNameDisplay/AccountNameDisplay.vue';
// @ts-ignore
import AccountContactQR from '@/components/AccountContactQR/AccountContactQR.vue';
// @ts-ignore
import AccountAddressDisplay from '@/components/AccountAddressDisplay/AccountAddressDisplay.vue';
// @ts-ignore
import AccountActions from '@/components/AccountActions/AccountActions.vue';
// @ts-ignore
import FormInputEditable from '@/components/FormInputEditable/FormInputEditable.vue';
// @ts-ignore
import ModalConfirmDelete from '@/views/modals/ModalConfirmDelete/ModalConfirmDelete.vue';

import { NetworkType, PublicAccount } from 'symbol-sdk';
import { AddressBook, IContact } from 'symbol-address-book';
import { ValidationRuleset } from '@/core/validation/ValidationRuleset';

@Component({
    components: {
        AccountNameDisplay,
        AccountContactQR,
        AccountActions,
        AccountAddressDisplay,
        FormInputEditable,
        ModalConfirmDelete,
    },
    computed: {
        ...mapGetters({
            addressBook: 'addressBook/getAddressBook',
            selectedContact: 'addressBook/getSelectedContact',
        }),
    },
})
export class ContactDetailPanelTs extends Vue {
    public addressBook: AddressBook;

    public selectedContact: IContact;

    public showDeleteConfirmModal: boolean = false;
    /**
     * Validation rules
     * @var {ValidationRuleset}
     */
    public validationRules = ValidationRuleset;

    public get selectedContactPublicAccount(): PublicAccount {
        return PublicAccount.createFromPublicKey('0'.repeat(64), NetworkType.MAIN_NET);
    }

    public saveProperty(propName: string) {
        return (newVal: string) => {
            this.selectedContact[propName] = newVal;
            this.addressBook.updateContact(this.selectedContact.id, this.selectedContact);
        };
    }

    public get showDeleteModal() {
        return this.showDeleteConfirmModal;
    }

    public set showDeleteModal(val: boolean) {
        this.showDeleteConfirmModal = val;
    }

    public removeContact() {
        this.$store.dispatch('addressBook/REMOVE_CONTACT', this.selectedContact.id);
    }
}
