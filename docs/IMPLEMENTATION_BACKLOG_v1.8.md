# MANGO WORLD implementation backlog after v1.8

## Blocked by dependency access
- [ ] Restore npm registry access or use a trusted machine with network access.
- [ ] Run `npm ci` after generating and reviewing a lockfile.
- [ ] Run Vite production build.
- [ ] Compile Solidity with the pinned compiler.
- [ ] Execute Hardhat tests; fix any failures and preserve full logs.

## Backend and product work
- [ ] Create a dedicated Supabase project for MANGO WORLD only.
- [ ] Review and apply the SQL migration in a non-production development project.
- [ ] Add Auth UI, email verification, account recovery and session handling.
- [ ] Add server-side moderation endpoints and administrator MFA/role assignment.
- [ ] Add listing image storage, content moderation and abuse reporting.
- [ ] Add order lifecycle and idempotent server-side settlement only after token utility/payment rules are approved.
- [ ] Implement a balanced, append-only ledger posting function and reconciliation tests.
- [ ] Add integration tests for RLS, authorization boundaries and order concurrency.

## Token and launch gates
- [ ] Approve initial recipient and token distribution/vesting table.
- [ ] Confirm utility, transfer policy, sale/airdrop/marketplace rules and any fee/burn policy.
- [ ] Obtain Italian/EU legal review, including MiCA applicability.
- [ ] Obtain independent smart-contract and web-application security audits.
- [ ] Run Sepolia deployment only after build/test success and explicit testnet approval.
- [ ] Verify deployed source/bytecode and constructor argument on a Sepolia explorer.
- [ ] Mainnet remains prohibited without separate explicit approval.
