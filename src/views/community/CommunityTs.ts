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
import {Component, Vue} from 'vue-property-decorator'

/// region custom types
type TabEntryType = { name: string, route: string, active: boolean }
/// end-region custom types

@Component
export class CommunityTs extends Vue {
  /**
   * List of in-page navigator items
   * @var {Array<TabEntryType>}
   */
  public communityPanelNavConfig: Array<TabEntryType> = [
    { name: 'news', route: 'community.index', active: true },
    // { name: 'vote', to: '/vote', active: false, },
  ]
}
