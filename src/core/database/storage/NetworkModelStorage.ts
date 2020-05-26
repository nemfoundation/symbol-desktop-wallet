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

import { VersionedNetworkBasedObjectStorage } from '@/core/database/backends/VersionedNetworkBasedObjectStorage'
import { NetworkModel } from '@/core/database/entities/NetworkModel'
import { NetworkService } from '@/services/NetworkService'

const resetNetwork = (genHash: string) => {
  const networkService = new NetworkService()
  networkService.reset(genHash)
}

export class NetworkModelStorage extends VersionedNetworkBasedObjectStorage<NetworkModel> {
  /**
   * Singleton instance as we want to run the migration just once
   */
  public static INSTANCE = new NetworkModelStorage()

  private constructor() {
    super('networkCache', [
      {
        description: 'Update networkCache to 0.9.5.1 network',
        migrate: (from: any) => {
          // remove all pre-0.9.5.1 networks
          const networks = Object.keys(from)
          networks.map((networkGenHash) => resetNetwork(networkGenHash))
        },
      },
    ])
  }
}
