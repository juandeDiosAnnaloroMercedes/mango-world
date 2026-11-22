# MANGO WORLD — marketplace/backend foundation

Status: schema draft only. This migration has **not** been applied to Supabase or another database.

## Included data model
- `mw_profiles`: player/admin role; newly registered users default to player.
- `mw_wallet_links`: Sepolia wallet association starts as pending; client cannot mark it verified.
- `mw_listings`: seller-created drafts; public reads only published listings.
- `mw_orders`: order lifecycle and unique idempotency key.
- `mw_ledger_accounts`, `mw_ledger_transactions`, `mw_ledger_entries`: append-oriented ledger structure using integer base units.
- `mw_admin_audit_log`: administrative action history.

## Security decisions
- Row Level Security is enabled on every table.
- No browser/client policies grant write access to orders, ledger entries, ledger transactions or admin audit log.
- A seller can only create/edit their own draft listing. Publishing requires a trusted server-side moderation action.
- A wallet link is pending until a server verifies a signature; address entry alone is not proof of ownership.
- Admin role assignment must be performed out-of-band by a trusted operator. The profile update policy does not permit self-promotion.
- Never put a Supabase service-role key in frontend code.

## Not implemented yet
- Supabase project configuration, Auth UI, server functions and service-role secret storage.
- Listing media storage, moderation workflow and admin MFA.
- Order/payment settlement, escrow, refunds and dispute handling.
- Contract-to-ledger reconciliation. The MANGO token is not deployed and token utility/payment rules remain unapproved.

This SQL is a starting migration for code review, not a deployed or audited production backend.
