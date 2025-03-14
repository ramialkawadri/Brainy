# Running unit tests

Install `nextest` and to run the test `cargo nextest run`.

# Release steps

1. Update `./src-tauri/tauri.conf.json` version
1. Update `./package.json` version
1. Set environment variables
    - `AZURE_CLIENT_ID`
    - `AZURE_TENANT_ID`
    - `AZURE_CLIENT_SECRET`
    - `TAURI_SIGNING_PRIVATE_KEY`
    - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
1. Run `npm run tauri build`
1. Update `updater.json` on storage account, update the following properties:
    - `signature`
    - `pub_date`: [RFC 3339 format](https://www.utctime.net/)
    - `version`
    - `notes`
1. Update `brainy.msi` on storage account
1. Purge the following CDN endpoints:
    - `/updater/updater.json`
    - `/updater/brainy.msi`
