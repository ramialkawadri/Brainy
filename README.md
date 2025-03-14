# Running unit tests

Install `nextest` and to run the test `cargo nextest run`.

# Build environment variables

- AZURE_CLIENT_ID
- AZURE_TENANT_ID
- AZURE_CLIENT_SECRET
- TAURI_SIGNING_PRIVATE_KEY
- TAURI_SIGNING_PRIVATE_KEY_PASSWORD

# Release steps

- Update `./src-tauri/tauri.conf.json` version.
- Update `./package.json` version.
- Set environment variables
- Run `npm run tauri build`
- Update `updater.json` on storage account (signtaure, pubdate, version and notes)
- Update brainy.msi on storage account
- Purge CDN endpoint (do it for each one individually) `/updater/updater.json` and `/updater/brainy.msi`.
