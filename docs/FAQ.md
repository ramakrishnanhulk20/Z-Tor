# FAQ

Plain-language answers before you try Z-Tor. For a full walkthrough, see the [User guide](USER_GUIDE.md) or [How it works](HOW_IT_WORKS.md).

---

### What is Z-Tor, in one sentence?

Z-Tor is a privacy tool on Ethereum Sepolia that lets you deposit confidential cUSDC or cWETH into a shared pool and withdraw them later to a different address, with no public link between the two.

### What tokens does Z-Tor use?

Z-Tor pools only accept Zama confidential tokens: cUSDC and cWETH (ERC-7984). Plain USDC or WETH cannot be deposited directly. Use the **Shield** step in the app to mint official Zama test tokens, wrap them into confidential form, and decrypt your balance when you want to see it.

### Where do test tokens come from?

We use the official Zama Sepolia contract addresses from their documentation — not custom tokens. The Shield page lists the exact mint and wrapper addresses. They are free test assets with no real-world value.

### What are cUSDC and cWETH?

They are ERC-7984 confidential tokens built on Zama's fhEVM. Your balance is stored encrypted on-chain. Observers see a ciphertext handle, not a number. Only you can decrypt your own balance in your browser, with a wallet signature.

### How do I get cUSDC or cWETH?

Open the app → **Shield**: mint test WETH or USDC, then shield (wrap) them into cWETH or cUSDC. The deposit flow can also top up automatically if you are short — but Shield gives you full control and clearer steps.

### Why does Deposit say "checking balance" instead of minting?

Deposit first verifies whether you already hold enough confidential tokens. Minting and shielding only run if you are short. If you shielded first, you should see a balance check and then go straight to the deposit transaction.

### Why does Deposit need two confirmations?

Your deposit amount is encrypted, so the pool verifies it with fully homomorphic encryption instead of reading it directly. The first transaction moves your confidential tokens in; then Zama's network decrypts a single yes/no check (“is the amount exactly the pool size?”) and a quick second transaction finalizes your note. Wrong amounts are refunded automatically and never create a note. Those few extra seconds are what guarantee every pool stays exactly solvent.

### What exactly is a note?

A note is a single line of text, starting with `ztor-`, that you receive when you deposit. It is the only proof that one of the deposits in the pool is yours, and the only key that can withdraw the funds. Treat it like cash.

### What happens if I lose my note?

Your funds are gone permanently. There is no recovery, no support ticket, and no admin who can help. Save your note offline before confirming a deposit.

### Why can I only deposit fixed amounts?

Fixed pools (0.1 cWETH, 1 cWETH, 100 cUSDC, 1,000 cUSDC) give the strongest privacy because every deposit looks identical. Custom amounts are on the [roadmap](ROADMAP.md) but not in the app yet.

### Why does MetaMask show cWETH or cUSDC instead of a Z-Tor address?

Z-Tor pools hold Zama confidential tokens, not plain ETH or USDC. When you deposit, you sign a transaction on Zama's official cWETH or cUSDC wrapper. That wrapper forwards your encrypted tokens into the Z-Tor pool contract. The pool address is looked up from the Z-Tor registry before you confirm — MetaMask labels the contract you sign against, which is the token wrapper.

### Why do I have to wait 10 minutes to withdraw?

A withdrawal that follows a deposit within seconds is easy to match to it. The short delay blends your withdrawal in with other activity.

### Which wallet do I need?

Any browser wallet that supports Sepolia, such as MetaMask. Connect in the app header. If you are on the wrong network, Z-Tor will offer to switch you.

### Can anyone see my confidential balance?

On-chain, your cUSDC or cWETH balance appears as an encrypted handle, not a readable number. Only you can decrypt it locally. Pool stats like active-note counts are also encrypted at the contract level.

### Can anyone see what I am doing?

The blockchain shows that some address interacted with Z-Tor, when, and which address received a withdrawal. What stays hidden is the link between a specific deposit and a specific withdrawal. For best results, withdraw to a fresh address.

### What is the relayer?

An optional service that submits your withdrawal transaction so the recipient address does not need Sepolia ETH for gas. It charges a small fee (1% by default). Your proof binds the recipient and fee — the relayer cannot redirect funds.

### Is this legal? What about compliance?

Z-Tor is designed around privacy by default with voluntary disclosure: only you can prove your own activity to a third party when you choose to. See [Privacy & compliance](PRIVACY_AND_COMPLIANCE.md) for the full picture.

### I have an old note. Will it still work?

Only if it was created on the current pool deployment listed in [Deployments](DEPLOYMENTS.md). Notes from superseded Sepolia pools cannot withdraw — make a fresh deposit and save the new note.

---

**Live app:** [z-tor-web.vercel.app](https://z-tor-web.vercel.app/app)
