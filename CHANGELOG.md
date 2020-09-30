# CHANGELOG
All notable changes to this project will be documented in this file.

The changelog format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.13.0][v0.13.0] - 25-Sep-2020

### Milestone: [catapult-server@v0.10.x](https://github.com/nemtech/catapult-server/releases/tag/v0.10.0)

#### Changes

- Upgraded symbol-hd-wallets and symbol-qr-library to use `next` tag
- Upgraded symbol-sdk to latest v0.20.8 alpha (0.10.x compat)
- Added new testnet nodes in config/network.conf.json

#### Fixed

- Multiple fixes on breaking changes of upcoming 0.21 SDK
- Updated block height reader to use /chain/info
- Fixed a WebSocket CLOSED state due to invalid UNSUBSCRIBE order

## [0.12.0][v0.12.0] - 16-Jul-2020

### Milestone: [catapult-server@v0.9.6.3](https://github.com/nemtech/catapult-server/releases/tag/v0.9.6.3)

#### Added

- Added compatibility for 0.9.6.3 server transactions and blocks(fixes #415)
- Added compatibility for 0.9.6.3 server entities changes from public key to addresses(fixes #414)
- Added database migrations for 0.9.6.3 testnet network reset including profiles and accounts table (**BREAKING CHANGE**)
- Added new **signerAddress** storage instead of signerPublicKey where necessary
- Added more japanese translations (Thanks @44uk)

#### Fixed

- Fixed settings screen not appeaering on MacOS (fixes #448)
- Fixed Add mosaic button on FormTransferTransaction (fixes #437)
- Aligned all language files to prepare adding further translated languages

## [0.11.0][v0.11.0] - 24-Jun-2020

### Milestone: [catapult-server@v0.9.5.1](https://github.com/nemtech/catapult-server/releases/tag/v0.9.5.1)

#### Added

- Added first implementation of Harvesting setup wizard for HD Profiles (fixes #326)
- Added AccountKeyLink transaction wrapping with PersistentDelegationRequestTransaction
- Added possibility to create unlimited duration mosaics (fixes #413)
- Added settings modal box with new custom node selector (fixes #348)
- Separated mosaic configuration for different accounts (fixes #379, #380)
- Improved news module and added several bugfixes related to news
- Removed duplicate menu actions on menu clicks

#### Fixed

- Fixed namespace name validator to use same as SDK (fixes #412)
- Fixed login page visual bug (fixes #431)
- Fixed selector fields consistency to use iView's Select component (fixes #388, #347)
- Fixed private key display replication bug (fixes #403)
- Several wording and UI fixes on languages files (fixes #390, #391, #404, #252)

## [0.10.0][v0.10.0] - 27-May-2020

### Milestone: [catapult-server@v0.9.5.1](https://github.com/nemtech/catapult-server/releases/tag/v0.9.5.1)

#### Added

- Upgrade to testnet 0.9.5.1 with SDK v0.19.2 (fixes #385)
- Added **recommended fees** feature using transaction size and network median fees
- Added transaction command to replace staged transactions
- Added TransactionAnnouncerService to cope with transaction timeouts and errors
- Improved components styling with scoped less (fixes #307, #273)
- Removed duplicate cancel actions on modals (fixes #367)

#### Fixed

- Fixed reactivity of locale for custom validation messages (fixes #374)
- Fixed invalid profile listing in login (fixes #341, #353)
- Fixed multisig edition form deleting accounts (fixes #384)
- Fixed wording on multisig form (fixes #366)

## [v0.9.9][v0.9.9]

### Milestone: [catapult-server@v0.9.4.1](https://github.com/nemtech/catapult-server/releases/tag/v0.9.4.1)

#### Added

- Added release process compliant with NIP14
- Added Apache v2 license (fixes #209)
- upgrade SDK to v0.18.0, (fixes #276)
- remove AESEncryptionService, (fixes #277)
- Testnet upgrade, (fixes #292)
- Move user data storage folder to /home/.symbol-desktop-wallet
- Rename accounts to profiles, wallets to accounts (fixes #304)

#### Fixed

- Fixed mosaic namespace resolution inside transfers (fixes #275)
- Fixed hardcoded network configuration properties (fixes #140) (fixes #139)
- Fixed private key import of duplicates (fixes #214) 
- Fixed vue-router error logs (fixes #252)

## [v0.9.8][v0.9.8] -

### Milestone: [catapult-server@v0.9.3.2](https://github.com/nemtech/catapult-server/releases/tag/v0.9.3.2)

### [v0.9.8-beta1][v0.9.8-beta1] - 17-Apr-2020

#### Added

- Added transaction status filters and multisig account selector (fixes #183)

#### Fixed

- Fixed wallet import in subwallet creation (fixes #214)


## [v0.9.7][v0.9.7] - 06-Apr-2020 

### Milestone: [catapult-server@v0.9.3.2](https://github.com/nemtech/catapult-server/releases/tag/v0.9.3.2)

### [v0.9.7-beta1][v0.9.7-beta1] - 06-Apr-2020

#### Added

- Added refresh button for namespace list (fixes #186)
- Added refresh button for mosaics list (fixes #146)
- Added automatic generation of QR Code for Invoices (fixes #168)
- Added eslint and linter configuration (fixes #166)

#### Fixed

- SignerSelector address format bug starting with A (fixes #205)
- Password change related bug fixes (fixes #195)
- Fix incorrect max fee display (fixes #188)
- Fixed mosaic balance panel list Close button (fixes #151)


## [v0.9.6][v0.9.6] - 21-Mar-2020

### Milestone: [catapult-server@v0.9.3.1](https://github.com/nemtech/catapult-server/releases/tag/v0.9.3.1)

### [v0.9.6-beta2][v0.9.6-beta2] - 21-Mar-2020

#### Added

- Added aliases to wallet details (fixes #26)
- Added multisig accounts transaction list link (fixes #84)

#### Changed

- Added usage of repository factory for REST (fixes #131)

#### Fixed

- Fixed account import cancellation (fixes #135)
- Fixed transaction pagination (fixes #112)
- Fixed dashboard CSS (fixes #111)
- Fixed SignerSelector mutation (fixes #115)
- Fixed form submit behaviour (fixes #98)

### [v0.9.6-beta1][v0.9.6-beta1] - 17-Mar-2020

#### Added

- Permit to query partial transactions of multisig accounts (fixes #68)
- Skip expired mosaics in transfer form (fixes #61)

#### Changed

- Changed navigation bar logos to use Symbol branding (fixes #72)
- Add reactivity to confirmed transaction events (fixes #69)

#### Fixed

- Fixed sub wallet creation form (fixes #103)
- Added unsubscription from websocket channels (fixes #99)
- Fixed duplicate words in mnemonic passphrases (fixes #87)
- Reset cosignatories from multisig form (fixes #85)
- Fix reactivity of account balance panel (fixes #79)


## [v0.9.5][v0.9.5] - 11-Mar-2020

### Milestone: [catapult-server@v0.9.3.1](https://github.com/nemtech/catapult-server/releases/tag/v0.9.3.1)

### [v0.9.5-beta6][v0.9.5-beta6] - 11-Mar-2020

#### Fixed

- Fixed password field input validation (fixes #57)
- Added new Symbol icons (fixes #72)
- Fixed child account creation (fixes #64)
- Fixed namespace state updates (fixes #67)
- Fixed MosaicBalanceList reactivity

### [v0.9.5-beta5][v0.9.5-beta5] - 10-Mar-2020

#### Fixed

- Fixed namespaces and mosaics database schema to hold hex instead of UInt64 (fixes #59)
- Hide expired mosaics in transfer inputs, (fixes #61)
- Fix mosaic balance list, (fixes #65)
- Type store / mosaic state
- Persist mosaic hidden state to database

### [v0.9.5-beta4][v0.9.5-beta4] - 09-Mar-2020

#### Fixed

- Patched windows build postcss properties
- Fixed PeerSelector component with loading state (fixes #23)
- Fixed transaction list layout for better readability
- Added beautified empty messages for table displays
- Fixed FormAliasTransaction for mosaic aliases
- Fixed pagination component layout
- Fixed mnemonic import wallet selection screen

### [v0.9.5-beta2][v0.9.5-beta2] - 06-Mar-2020

#### Fixed

- Fixed WalletSelectorPanel balances listing (fixes #27)
- Fixed account import pages (fixes #54)
- Fixed newly added transfer mosaic attachments

### [v0.9.5-beta1][v0.9.5-beta1] - 06-Mar-2020

#### Added

- Added TransactionService methods handling transaction signature
- Added TransactionService methods handling transaction broadcast
- Added store actions for better reactivity across components
- Added endpoints database table
- Improved `FormTransactionBase` to make use of `isCosignatoryMode` state change
- Added automatic **funds lock** creation for multi-signature transactions (aggregate bonded)
- Added possibility to _aggregate transactions_ that are _signed_ and _on-stage_ (used in `FormMosaicDefinitionTransaction`)
- Added rebranded account creation pages
- Added and fixed account import pages
- Fixed unconfirmed and partial transaction removal from lists
- Added `FormMultisigAccountModificationTransaction` with common form for conversion and modifications

#### Known Issues

- Missing harvesting setup (account link & persistent delegation requests)
- Some missing UI fixes for Symbol rebrand

## [v0.9.4-beta][v0.9.4-beta] - 25-Feb-2020

### Milestone: [catapult-server@v0.9.2.1](https://github.com/nemtech/catapult-server/releases/tag/v0.9.2.1)

#### Added

- `FormAccountUnlock`: standardize practice of unlocking account across app
- `FormTransactionBase`: base abstraction layer for transaction forms
- `SignerSelector`: generic transaction signer selector, works with multisig to change owned assets states
- General change of views files (*.vue) paths with result :
    * Components in src/components/
    * Modal Dialogs in src/views/modals/
    * Pages in src/views/pages/
    * Layouts in src/components/
    * Forms in src/views/forms/
- Added namespaced vuex Store managing application state changes
- Added namespaces vuex Store managing REST requests changing state (action REST_*)
- Added src/core/database/ with LocalStorageBackend, models and tables schemas
- Added repository abstraction layer to work with persistent storage
- Added business layer implementations in src/services/*
- Rewrote all route names and use route names instead of paths for redirects

#### Known Issues

- Missing harvesting setup (account link & persistent delegation requests)
- Some missing UI fixes for Symbol rebrand


[v0.13.0]: https://github.com/nemfoundation/symbol-desktop-wallet/releases/tag/v0.11.0...v0.13.0
[v0.12.0]: https://github.com/nemfoundation/symbol-desktop-wallet/releases/tag/v0.11.0...v0.12.0
[v0.11.0]: https://github.com/nemfoundation/symbol-desktop-wallet/releases/tag/v0.10.0...v0.11.0
[v0.10.0]: https://github.com/nemfoundation/symbol-desktop-wallet/releases/tag/v0.9.9...v0.10.0
[v0.9.9]: https://github.com/nemfoundation/symbol-desktop-wallet/releases/tag/v0.9.8-beta1...v0.9.9
[v0.9.8]: https://github.com/nemfoundation/symbol-desktop-wallet/releases/tag/v0.9.8-beta1
[v0.9.8-beta1]: https://github.com/nemfoundation/symbol-desktop-wallet/compare/v0.9.7-beta1...v0.9.8-beta1
[v0.9.7]: https://github.com/nemfoundation/symbol-desktop-wallet/releases/tag/v0.9.7-beta1
[v0.9.7-beta1]: https://github.com/nemfoundation/symbol-desktop-wallet/compare/v0.9.6...v0.9.7-beta1
[v0.9.6]: https://github.com/nemfoundation/symbol-desktop-wallet/releases/tag/v0.9.6-beta2
[v0.9.6-beta2]: https://github.com/nemfoundation/symbol-desktop-wallet/compare/v0.9.6-beta1...v0.9.6-beta2
[v0.9.6-beta1]: https://github.com/nemfoundation/symbol-desktop-wallet/compare/v0.9.5-beta6...v0.9.6-beta1
[v0.9.5]: https://github.com/nemfoundation/symbol-desktop-wallet/releases/tag/v0.9.5-beta6
[v0.9.5-beta6]: https://github.com/nemfoundation/symbol-desktop-wallet/compare/v0.9.5-beta5...v0.9.5-beta6
[v0.9.5-beta5]: https://github.com/nemfoundation/symbol-desktop-wallet/compare/v0.9.5-beta4...v0.9.5-beta5
[v0.9.5-beta4]: https://github.com/nemfoundation/symbol-desktop-wallet/compare/v0.9.5-beta2...v0.9.5-beta4
[v0.9.5-beta2]: https://github.com/nemfoundation/symbol-desktop-wallet/compare/v0.9.5-beta1...v0.9.5-beta2
[v0.9.5-beta1]: https://github.com/nemfoundation/symbol-desktop-wallet/compare/v0.9.4-beta...v0.9.5-beta1
[v0.9.4-beta]: https://github.com/nemfoundation/symbol-desktop-wallet/releases/tag/v0.9.4-beta
