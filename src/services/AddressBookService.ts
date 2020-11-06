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

import { AddressBookModelStorage } from '@/core/database/storage/AddressBookModelStorage';
import { AddressBook } from 'symbol-address-book/AddressBook';

export class AddressBookService {
    /**
     * The namespace information local cache.
     */
    private readonly addressBookModelStorage = AddressBookModelStorage.INSTANCE;

    public getAddressBook(): AddressBook {
        try {
            return AddressBook.fromJSON(this.addressBookModelStorage.get());
        } catch (e) {
            return new AddressBook();
        }
    }

    public saveAddressBook(addressBook: AddressBook) {
        return this.addressBookModelStorage.set(addressBook.toJSON(false));
    }
}
