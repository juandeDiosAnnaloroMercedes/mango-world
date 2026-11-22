# MANGO WORLD — Ethereum project

MANGO WORLD is an independent project. The original Mango infrastructure and repository must not be modified, merged, or used as a source of assets without a separate written decision.

## Current technical scope
- React + Vite wallet gateway using ethers v6.
- MetaMask connection; read-only account, chain and native balance.
- Sepolia network switch request.
- ERC-20 contract using OpenZeppelin Contracts v5.
- Fixed supply: 100,000,000 MANGO, 18 decimals.
- Initial supply is minted once to an explicit constructor address.
- No owner, public mint, pause, blacklist or upgrade functions.
- Hardhat tests for metadata, supply, transfers, zero recipient and absent privileged functions.
- Sepolia-only deployment script requiring an explicit `INITIAL_HOLDER`.
- Supabase/Postgres schema draft with RLS for profiles, wallet links, listings, orders, ledger and admin audit log.
- React navigation for Home, MANGO Coin, Marketplace, Admin and Roadmap; incomplete modules are visibly marked inactive.

## Current status (22 November 2026)
- Static QA: 32 source-level checks passed in v1.8.3.
- JavaScript syntax checks passed for the Hardhat config, deployment script and static QA script.
- npm registry access: DNS lookup failed with `EAI_AGAIN` in this execution environment; dependencies could not be installed.
- Vite build: not verified.
- Solidity compilation: not verified.
- Hardhat tests: not executed.
- Sepolia deployment: not performed.
- Mainnet deployment: not performed.
- Real ETH spent or transferred: none.

Static QA does not prove runtime correctness, compilation, security, legal compliance, or deployment success.

## Install and verify
Node.js 20+ recommended.

```bash
npm install
npm run qa:static
npm run build
npm run contracts:compile
npm run contracts:test
```

## Sepolia deployment — not yet authorised or performed
The script is guarded to Sepolia only. It requires a locally configured deployer key and an explicitly selected `INITIAL_HOLDER`. No initial recipient has been approved yet; do not deploy until this is explicitly decided.

1. Copy `.env.example` to `.env` on your own computer.
2. Configure a Sepolia RPC endpoint.
3. Configure a dedicated test-only deployer account locally.
4. Set `INITIAL_HOLDER` only after deciding who receives the entire initial supply.
5. Obtain Sepolia test ETH only; it has no monetary value.
6. Run `npm run contracts:deploy:sepolia`.

Never send a seed phrase or private key in chat, email, screenshots, or source control. Never use a wallet containing real funds as a test deployer.

## Not yet implemented / not production-ready
- Applied database migration, real marketplace API, listings, orders, inventory and payment settlement.
- Secure administrator authentication, MFA, roles and audit logs.
- Persistent database and append-only ledger.
- Contract verification on Sepolia explorer and independent audit.
- Production hosting, monitoring, backups and incident response.
- Legal review, token allocation/vesting decision and trademark clearance.

Do not represent these components as operational.

## Launch gates
- Approve token distribution and initial recipient.
- Obtain specialist Italian/EU legal advice on MiCA and applicable Italian obligations.
- Obtain independent smart-contract and application security reviews.
- Verify compiler/dependency versions, bytecode, constructor arguments and source.
- Any Mainnet deployment or movement of real funds requires separate explicit approval.

### Verifica automatica con un solo avvio
Se l'ambiente ChatGPT non riesce a raggiungere npm, puoi eseguire la verifica su un computer con connessione Internet:
- Windows: doppio clic su `verify-local-windows.bat`.
- macOS/Linux: esegui `./verify-local-macos-linux.sh` da Terminale.

Gli script installano le dipendenze e lanciano QA statico, build Vite, compilazione Solidity e test Hardhat. Si fermano al primo errore. **Non eseguono deployment e non inviano transazioni.** Non inserire chiavi private: per queste verifiche non servono.

## Verifica cloud senza PC

Il workflow `.github/workflows/verify.yml` esegue automaticamente su GitHub Actions,
per ogni push e pull request, i controlli statici, la build frontend, la compilazione
Solidity e i test Hardhat. Non effettua deployment, non richiede segreti e non invia
transazioni. Per usarlo, questo progetto deve essere caricato in un repository GitHub
separato da `mango-infrastruttura`.
