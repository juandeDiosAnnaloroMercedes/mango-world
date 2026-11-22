import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserProvider, formatEther } from 'ethers';
import './style.css';

const SEPOLIA_CHAIN_ID = '0xaa36a7';
const MAX_SUPPLY = '100,000,000';
const pages = [
  ['home', 'Home'], ['coin', 'MANGO Coin'], ['market', 'Marketplace'],
  ['admin', 'Admin'], ['roadmap', 'Roadmap']
];

function App() {
  const [page, setPage] = useState('home');
  const [account, setAccount] = useState('');
  const [network, setNetwork] = useState('Non collegato');
  const [balance, setBalance] = useState('—');
  const [message, setMessage] = useState('Collega MetaMask per leggere lo stato del wallet.');
  const [busy, setBusy] = useState(false);

  async function refresh(provider, address) {
    const net = await provider.getNetwork();
    const isSepolia = net.chainId === 11155111n;
    setNetwork(isSepolia ? 'Ethereum Sepolia · testnet' : `${net.name} · chain ID ${net.chainId}`);
    const raw = await provider.getBalance(address);
    setBalance(`${formatEther(raw)} ETH`);
    setMessage(isSepolia
      ? 'Wallet collegato alla rete di prova. Questa app non invia transazioni.'
      : 'Wallet collegato. Per le verifiche MANGO WORLD seleziona Ethereum Sepolia.');
  }

  async function connect() {
    if (!window.ethereum) {
      setMessage('MetaMask non rilevato. Apri questa app nel browser integrato di MetaMask oppure installa un wallet compatibile.');
      return;
    }
    setBusy(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      if (!accounts.length) throw new Error('Nessun account autorizzato.');
      setAccount(accounts[0]);
      await refresh(provider, accounts[0]);
    } catch (e) {
      setMessage(e?.message || 'Collegamento non riuscito.');
    } finally { setBusy(false); }
  }

  async function switchToSepolia() {
    if (!window.ethereum) {
      setMessage('Apri l’app nel browser di MetaMask.');
      return;
    }
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: SEPOLIA_CHAIN_ID }] });
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_accounts', []);
      if (accounts[0]) { setAccount(accounts[0]); await refresh(provider, accounts[0]); }
    } catch (e) {
      if (e?.code === 4902) setMessage('Sepolia non è configurata nel wallet. Aggiungila dalle impostazioni di MetaMask e riprova.');
      else if (e?.code === 4001) setMessage('Richiesta rifiutata nel wallet. Nessuna transazione è stata inviata.');
      else setMessage(e?.shortMessage || e?.message || 'Impossibile cambiare rete.');
    }
  }

  useEffect(() => {
    if (!window.ethereum) return undefined;
    const onAccounts = async (accounts) => {
      if (!accounts.length) { setAccount(''); setNetwork('Non collegato'); setBalance('—'); return; }
      setAccount(accounts[0]);
      try { await refresh(new BrowserProvider(window.ethereum), accounts[0]); } catch { /* wallet may be switching */ }
    };
    const onChain = async () => {
      if (!account) return;
      try { await refresh(new BrowserProvider(window.ethereum), account); } catch { /* wallet may be switching */ }
    };
    window.ethereum.on?.('accountsChanged', onAccounts);
    window.ethereum.on?.('chainChanged', onChain);
    return () => {
      window.ethereum.removeListener?.('accountsChanged', onAccounts);
      window.ethereum.removeListener?.('chainChanged', onChain);
    };
  }, [account]);

  const shortAccount = account ? `${account.slice(0, 8)}…${account.slice(-6)}` : '—';

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setPage('home')} aria-label="MANGO WORLD home">
        <span className="brand-fruit">🥭</span><span>MANGO WORLD</span>
      </button>
      <nav className="nav" aria-label="Navigazione principale">
        {pages.map(([id, label]) => <button key={id} className={page === id ? 'nav-link active' : 'nav-link'} onClick={() => setPage(id)}>{label}</button>)}
      </nav>
      <button className="wallet-button" onClick={connect} disabled={busy}>{busy ? 'Connessione…' : account ? 'Wallet collegato' : 'Collega MetaMask'}</button>
    </header>

    {page === 'home' && <>
      <section className="hero">
        <p className="eyebrow">ECOSISTEMA DIGITALE INDIPENDENTE</p>
        <h1>WELCOME TO<br/><span>MANGO WORLD</span></h1>
        <p className="intro">Un progetto separato dal Mango originario, progettato per Ethereum e per una valuta digitale a supply fissa. La priorità è costruire, verificare e proteggere ogni componente prima della pubblicazione.</p>
        <div className="hero-actions"><button onClick={() => setPage('coin')}>Scopri MANGO Coin</button><button className="secondary" onClick={switchToSepolia}>Passa a Sepolia</button></div>
      </section>
      <div className="warning"><strong>Anteprima tecnica.</strong> Nessun token MANGO è stato emesso e nessun contratto è stato distribuito. Marketplace e pannello amministrativo non sono ancora operativi.</div>
      <section className="feature-grid">
        <article className="feature"><span>⛓️</span><h2>Ethereum</h2><p>Ethereum è la blockchain scelta. I collaudi saranno effettuati prima su Sepolia testnet.</p></article>
        <article className="feature"><span>🔐</span><h2>Self-custody</h2><p>MetaMask resta sotto il controllo dell’utente. L’app non richiede seed phrase o chiavi private.</p></article>
        <article className="feature"><span>🛍️</span><h2>Marketplace</h2><p>La struttura è in progettazione. Inserzioni, ordini e pagamenti richiedono backend e regole approvate.</p></article>
      </section>
    </>}

    {page === 'coin' && <section className="content-page">
      <p className="eyebrow">TOKEN OVERVIEW</p><h1>MANGO Coin</h1>
      <div className="two-col"><div className="panel token-panel"><p className="eyebrow">SUPPLY MASSIMA PROPOSTA</p><div className="supply">{MAX_SUPPLY}</div><p className="muted">MANGO · ERC-20 · 18 decimali</p><div className="stat-grid"><div><small>Blockchain</small><b>Ethereum</b></div><div><small>Standard</small><b>ERC-20</b></div><div><small>Mint successivo</small><b>Non previsto</b></div><div><small>Stato</small><b>Non distribuito</b></div></div></div>
      <div className="panel"><h2>Regole del contratto</h2><ul><li>Emissione iniziale una sola volta.</li><li>Nessuna funzione pubblica per creare altri token.</li><li>Nessun proprietario privilegiato previsto.</li><li>Destinatario della supply iniziale ancora da approvare.</li></ul><p className="muted">Il codice è in fase di verifica. Non esiste ancora un indirizzo di contratto da mostrare.</p></div></div>
    </section>}

    {page === 'market' && <section className="content-page"><p className="eyebrow">MANGO WORLD MARKET</p><h1>Marketplace</h1><div className="empty-state"><span className="large-icon">🛍️</span><h2>Marketplace in sviluppo</h2><p>Non ci sono ancora inserzioni, ordini o pagamenti attivi. Prima di aprirlo servono database, autenticazione, moderazione, regole commerciali e un sistema di contabilizzazione verificabile.</p><span className="status-pill">Non operativo</span></div></section>}

    {page === 'admin' && <section className="content-page"><p className="eyebrow">CONTROL CENTER</p><h1>Pannello amministrativo</h1><div className="warning"><strong>Area non attiva.</strong> Non è ancora presente un'autenticazione amministrativa. Questa schermata non concede privilegi e non permette modifiche ai dati.</div><div className="admin-grid"><div className="panel"><small>Smart contract</small><b>Non distribuito</b></div><div className="panel"><small>Marketplace</small><b>Non operativo</b></div><div className="panel"><small>Database</small><b>Schema in preparazione</b></div><div className="panel"><small>Audit log</small><b>Da implementare</b></div></div></section>}

    {page === 'roadmap' && <section className="content-page"><p className="eyebrow">BUILD · VERIFY · RELEASE</p><h1>Roadmap</h1><div className="roadmap"><div><b>01 · Smart contract</b><p>Completare compilazione, test e revisione indipendente.</p></div><div><b>02 · Wallet gateway</b><p>Collegamento MetaMask e verifica su Sepolia.</p></div><div><b>03 · Marketplace</b><p>Backend, database, moderazione, ordini e ledger.</p></div><div><b>04 · Amministrazione</b><p>Autenticazione forte, ruoli, MFA e audit log.</p></div><div><b>05 · Pubblicazione</b><p>Verifiche legali, sicurezza, hosting e approvazione esplicita.</p></div></div></section>}

    <section className="wallet-panel">
      <div><p className="eyebrow">WALLET STATUS · READ ONLY</p><h2>Il tuo wallet</h2><p className="muted">La connessione legge indirizzo, rete e saldo nativo. Non invia fondi e non firma transazioni.</p></div>
      <div className="wallet-stats"><div><small>Indirizzo</small><b>{shortAccount}</b></div><div><small>Rete</small><b>{network}</b></div><div><small>Saldo nativo</small><b>{balance}</b></div></div>
      <p className="status-message" role="status">{message}</p>
    </section>
    <footer>MANGO WORLD · Progetto indipendente · Non affiliato al Mango originario</footer>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
