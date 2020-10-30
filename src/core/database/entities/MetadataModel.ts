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

import { Metadata, MetadataType, Address, UInt64, MosaicId, NamespaceId } from 'symbol-sdk';

/**
 * Stored POJO that holds mosaic information.
 *
 * The stored data is cached from rest.
 *
 * The object is serialized and deserialized to/from JSON. no method or complex attributes can be fined.
 *
 */
export class MetadataModel {
    public readonly metadataId: string;
    public readonly sourceAddress: Address;
    public readonly targetAddress: Address;
    public readonly scopedMetadataKey: UInt64;
    public readonly metadataType: MetadataType;
    public readonly value: string;
    public readonly targetId?: MosaicId | NamespaceId | undefined;

    constructor(metadata: Metadata) {
        this.metadataId = metadata.id;
        this.sourceAddress = metadata.metadataEntry.sourceAddress;
        this.metadataType = metadata.metadataEntry.metadataType;
        this.scopedMetadataKey = metadata.metadataEntry.scopedMetadataKey;
        this.targetAddress = metadata.metadataEntry.targetAddress;
        this.targetId = metadata.metadataEntry.targetId;
        this.value = metadata.metadataEntry.value;
    }
}
