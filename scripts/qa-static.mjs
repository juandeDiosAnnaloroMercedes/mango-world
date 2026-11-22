import fs from 'node:fs';
import assert from 'node:assert/strict';
const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const html = read('index.html'), app = read('app/src/main.jsx'), contract = read('contracts/MangoCoin.sol');
const tests = read('test/MangoCoin.test.js'), deploy = read('scripts/deploy-sepolia.js');
const sql = read('supabase/migrations/20261122_000001_marketplace_foundation.sql');
const pkg = JSON.parse(read('package.json')), config = read('hardhat.config.cjs');
const verifyWin = read('verify-local-windows.bat'), verifyUnix = read('verify-local-macos-linux.sh');
const workflow = read('.github/workflows/verify.yml');
const checks = [];
function check(name, fn) { fn(); checks.push(name); }
check('HTML document declares Italian language', () => assert.match(html, /<html lang="it">/));
check('HTML root mount exists', () => assert.match(html, /id="root"/));
check('HTML loads React entry point', () => assert.match(html, /\/app\/src\/main\.jsx/));
check('Wallet gateway uses ethers v6 BrowserProvider', () => assert.match(app, /new BrowserProvider\(window\.ethereum\)/));
check('Wallet connection requests accounts explicitly', () => assert.match(app, /eth_requestAccounts/));
check('App targets Sepolia chain id 11155111', () => assert.match(app, /0xaa36a7/));
check('App reads native balance without sending transactions', () => assert.match(app, /provider\.getBalance\(address\)/));
check('App does not request transaction signing or transfer', () => assert.doesNotMatch(app, /eth_sendTransaction|personal_sign|eth_sign|sendTransaction\s*\(/));
check('App warns that token is not issued', () => assert.match(app, /Nessun token MANGO è stato emesso/));
check('Contract declares fixed 100m supply with 18 decimals', () => assert.match(contract, /100_000_000\s*\*\s*10\s*\*\*\s*18/));
check('Contract requires explicit nonzero initial holder', () => assert.match(contract, /require\(initialHolder != address\(0\)/));
check('Contract has no owner or public mint function', () => assert.doesNotMatch(contract, /Ownable|function\s+mint\s*\(/));
check('Contract mints only once in constructor', () => assert.match(contract, /constructor\(address initialHolder\)[\s\S]*?_mint\(initialHolder, MAX_SUPPLY\)/));
check('Tests cover zero holder and fixed supply', () => { assert.match(tests, /zero address as initial holder/); assert.match(tests, /totalSupply\(\)/); });
check('Sepolia deploy script hard-blocks other networks', () => assert.match(deploy, /network\.name !== "sepolia"/));
check('Sepolia deploy script requires explicit initial holder', () => assert.match(deploy, /INITIAL_HOLDER/));
check('No Mainnet network is configured', () => assert.doesNotMatch(config, /mainnet/i));
check('Build, compile, test and static QA scripts exist', () => { for (const s of ['build','contracts:compile','contracts:test','qa:static','contracts:deploy:sepolia']) assert.ok(pkg.scripts[s]); });
check('Chai, Hardhat chai matchers and dotenv are explicitly declared', () => { assert.ok(pkg.devDependencies.chai); assert.ok(pkg.devDependencies['@nomicfoundation/hardhat-chai-matchers']); assert.ok(pkg.devDependencies.dotenv); });
check('Hardhat config loads chai matchers plugin', () => assert.match(config, /hardhat-chai-matchers/));
check('Hardhat ESM project uses explicit CommonJS config and scripts point to it', () => { assert.match(config, /module\.exports/); assert.match(pkg.scripts['contracts:compile'], /hardhat\.config\.cjs/); assert.match(pkg.scripts['contracts:test'], /hardhat\.config\.cjs/); });
check('Marketplace database migration enables RLS on core tables', () => { assert.match(sql, /alter table public\.mw_listings enable row level security/); assert.match(sql, /alter table public\.mw_ledger_entries enable row level security/); });
check('Marketplace clients can only create draft listings', () => assert.match(sql, /seller_id = auth\.uid\(\) and status = 'draft'/));
check('Ledger and order tables have no client write policies', () => assert.doesNotMatch(sql, /create policy[^;]+on public\.mw_(orders|ledger_entries|ledger_transactions)/i));
check('Wallet links remain pending until server verification', () => assert.match(sql, /verification_status = 'pending' and verified_at is null/));
check('Frontend exposes marketplace and admin status without claiming activation', () => { assert.match(app, /Marketplace in sviluppo/); assert.match(app, /Area non attiva/); });
check('All eight marketplace tables explicitly enable row-level security', () => {
  for (const table of ['mw_profiles','mw_wallet_links','mw_listings','mw_orders','mw_ledger_accounts','mw_ledger_transactions','mw_ledger_entries','mw_admin_audit_log']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'));
  }
});
check('Profile self-update policy prevents client-side admin role assignment', () => assert.match(sql, /with check \(auth\.uid\(\) = user_id and role = 'player'\)/i));
check('Wallet verification cannot be promoted by a client update policy', () => assert.doesNotMatch(sql, /create policy[^;]+on public\.mw_wallet_links[^;]+for update/i));
check('Orders, ledger tables and admin audit log have no client policies', () => {
  for (const table of ['mw_orders','mw_ledger_accounts','mw_ledger_transactions','mw_ledger_entries','mw_admin_audit_log']) {
    assert.doesNotMatch(sql, new RegExp(`create policy[^;]+on public\\.${table}`, 'i'));
  }
});
check('Database migration is explicitly documented as unapplied', () => assert.match(sql, /not applied to any hosted database/i));
check('SECURITY DEFINER profile trigger uses an empty search_path', () => assert.match(sql, /security definer set search_path = ''/i));
check('Windows local verification script runs build, compile and tests without deployment', () => { for (const cmd of ['npm install','npm run build','npm run contracts:compile','npm run contracts:test']) assert.ok(verifyWin.includes(cmd)); assert.doesNotMatch(verifyWin, /contracts:deploy|DEPLOYER_PRIVATE_KEY|INITIAL_HOLDER/); });
check('macOS/Linux local verification script runs build, compile and tests without deployment', () => { for (const cmd of ['npm install','npm run build','npm run contracts:compile','npm run contracts:test']) assert.ok(verifyUnix.includes(cmd)); assert.doesNotMatch(verifyUnix, /contracts:deploy|DEPLOYER_PRIVATE_KEY|INITIAL_HOLDER/); });
check('GitHub Actions verifies build, Solidity compile and tests without deployment', () => {
  for (const step of ['npm install --no-audit --no-fund','npm run qa:static','npm run build','npm run contracts:compile','npm run contracts:test']) assert.ok(workflow.includes(step));
  assert.doesNotMatch(workflow, /contracts:deploy|DEPLOYER_PRIVATE_KEY|INITIAL_HOLDER|mainnet/i);
  assert.match(workflow, /pull_request/);
});
console.log(`MANGO WORLD static QA: ${checks.length}/${checks.length} passed`);
for (const name of checks) console.log(`PASS ${name}`);
console.log('NOTE: Static source checks only; not a build, runtime test, security audit, or deployment.');
