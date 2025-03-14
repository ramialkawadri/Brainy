# Running unit tests

Install `nextest` and to run the test `cargo nextest run`.

# Build environment variables
- AZURE_CLIENT_ID
- AZURE_TENANT_ID
- AZURE_CLIENT_SECRET
- TAURI_SIGNING_PRIVATE_KEY
- TAURI_SIGNING_PRIVATE_KEY_PASSWORD

# On release
- Update updater.json on storage account
- Update brainy.msi on storage account
- Purge cdn endpoint
