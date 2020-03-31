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
import {Component, Prop, Vue} from 'vue-property-decorator'
// internal dependencies
import {WalletModel} from '@/core/database/entities/WalletModel'
import {UIHelpers} from '@/core/utils/UIHelpers'

@Component
export class WalletAddressDisplayTs extends Vue {

  @Prop({
    default: null,
  }) wallet: WalletModel

  /**
   * UI Helpers
   * @var {UIHelpers}
   */
  public uiHelpers = UIHelpers

  public getWalletAddressPretty(): string {
    return this.wallet && WalletModel.getObjects(this.wallet).address.pretty() || ''
  }

/// region computed properties getter/setter
/// end-region computed properties getter/setter
}
