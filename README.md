<p align="center">
  <img src="assets/stickers/token-21-wagmi.gif" width="220" alt="Chog #21 WAGMI sticker" />
  <img src="assets/stickers/token-21-lfg.gif" width="220" alt="Chog #21 LFG sticker" />
  <img src="assets/stickers/token-21-ngmi.gif" width="220" alt="Chog #21 NGMI sticker" />
</p>

# Chogsticks

**Your Chog gets paid when the internet uses it.**

Every Chog Genesis NFT is an animated sticker pack made from its own on-chain art. Anyone can send it in Discord with `/chog`. Each send is credited to that token, and every week the wallet holding the Chog claims its share of a $CHOG pool on Monad.

[chogsticks.vercel.app](https://chogsticks.vercel.app) · [Try a sticker pack](https://chogsticks.vercel.app/try) · [Add to Discord](https://discord.com/oauth2/authorize?client_id=1561422294574694420)

## Why

PFP art gets passed around chats all day as memes and reaction images. Pudgy Penguins GIFs have [tens of billions of GIPHY views](https://research.4pillars.io/en/research/pudgy-penguins-will-inherit-disneys-crown), and the people holding those NFTs earn nothing from any of it. An NFT only pays its holder when it sells.

Chogsticks turns use into income. The more people reach for your Chog in chat, the more it earns, and the earnings stay attached to the token.

## How it works

| Step | What happens |
|---|---|
| **Send** | `/chog sticker:lfg id:21` in any server, DM, or group chat. Chog #21's animated sticker posts. |
| **Count** | The send is credited to token #21. Different people count fully, repeats fade, and fresh alt accounts earn nothing. |
| **Settle** | Each week, the scores become a Merkle root posted to the pool contract on Monad. |
| **Claim** | Whoever holds #21 at claim time collects its $CHOG. Sell the Chog and its unclaimed and future earnings go to the buyer. |

Each of the 1,969 Chogs gets 6 base stickers (GM, WAGMI, NGMI, COPE, LFG, CHOG ON) plus up to 3 more picked from its traits. Laser eyes get LASER EYES, a crown gets KING, rainbow puke gets SICK. Every sticker is the token's untouched art with motion and a caption on top.

## Try it in 2 minutes

**In the browser, nothing to install:** open [/try](https://chogsticks.vercel.app/try), pick any id from 1 to 1969, and flip through its pack. Copy the command or download the GIF.

**In Discord:**
1. [Add Chogsticks to your account](https://discord.com/oauth2/authorize?client_id=1561422294574694420) and choose **Add to My Apps**.
2. In any chat, type `/chog`, pick a sticker, and give an id (or leave it empty for a random Chog).
3. Click **Whose Chog is #…?** under the sticker. The token page shows the new send, its rank, and the wallet earning from it.

Then check the [leaderboard](https://chogsticks.vercel.app/leaderboard) and the [pool](https://chogsticks.vercel.app/pool).

## Why the token has to be there

- **The pack is the token.** Stickers are rendered from that token's own image and traits, read from its on-chain `tokenURI`. 1,969 tokens, 1,969 different packs.
- **The payee is the token.** Sends are credited to a token id. The contract pays `ownerOf(tokenId)` at claim time and checks it on-chain.
- **The income moves with the token.** Transfer the Chog and the next claim goes to the new holder.

## Keeping it fair

| Attempt | Result | Proof |
|---|---|---|
| One account spams a Chog 10 times | Scores 1 + 0.5 + 0.25 + 0.125 + 0.0625, then 0 for the rest of the day | [`tests/scoring.test.ts`](tests/scoring.test.ts) |
| Fresh alt accounts | Discord accounts younger than 30 days are counted but not credited (age read from the user id) | [`tests/scoring.test.ts`](tests/scoring.test.ts) |
| Replaying a Discord interaction | Ignored, counted once | [`tests/scoring.test.ts`](tests/scoring.test.ts) |
| Forged request to the bot endpoint | Rejected, Ed25519 signature check runs before anything is read | [`app/api/discord/route.ts`](app/api/discord/route.ts) |
| Claiming twice, claiming a token you don't hold, inflating the amount, using another token's proof | Reverts | [`contracts/test/ChogsticksPool.t.sol`](contracts/test/ChogsticksPool.t.sol) |
| Posting more than the pool holds, or one week draining another | Reverts | [`contracts/test/ChogsticksPool.t.sol`](contracts/test/ChogsticksPool.t.sol) |
| The operator withdrawing the pool | There is no withdraw function | [`contracts/src/ChogsticksPool.sol`](contracts/src/ChogsticksPool.sol) |

## On-chain

Monad mainnet, chain id 143.

| | Address |
|---|---|
| ChogsticksPool | [`0x430dAd64ADF435D9aD6AbCc42340483ec4ad3d04`](https://monadscan.com/address/0x430dAd64ADF435D9aD6AbCc42340483ec4ad3d04), source [verified on Sourcify](https://repo.sourcify.dev/143/0x430dAd64ADF435D9aD6AbCc42340483ec4ad3d04) (exact match) |
| Chog Genesis | [`0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763`](https://monadscan.com/address/0xc96d31F8626c6D03Fae5dCD3d61e3FB9F4a73763) |
| $CHOG | [`0x350035555E10d9AfAF1566AaebfCeD5BA6C27777`](https://monadscan.com/address/0x350035555E10d9AfAF1566AaebfCeD5BA6C27777) |

| Event | Transaction |
|---|---|
| Pool deployed | [`0x5fffe1cd…b85d`](https://monadscan.com/tx/0x5fffe1cd8d22f7979b8e33ce23fadb108b86426657b56099d96e36e83215b85d) |
| Bought $CHOG on nad.fun | [`0x9a16a8c5…3438`](https://monadscan.com/tx/0x9a16a8c54576be462c06b6e36a5934b1dea4b93cd7abe2b0b3f83b13c9c63438) |
| Funded the pool with 51.58 $CHOG | [`0x38f76345…fa56`](https://monadscan.com/tx/0x38f7634596195918a9cbd70c896a8633962bee53ed57b9abc1936b69e1b1fa56) |

Each week's full allocation (every token, score, amount, and proof) is published in [`data/epochs/`](data/epochs) so anyone can recompute the root. The first one, week 1, posts on Oct 23.

## Compared to

| | What it does | Difference |
|---|---|---|
| Server stickers and emojis | A handful of mascot images, locked to one server unless you pay for Nitro | 1,969 per-token packs that work in any server or DM, and every send pays a holder |
| GIPHY / Tenor brand channels | Spreads the brand's art | Spreads each holder's own Chog and routes the value back to them |
| NFT licensing programs | Holders apply for brand deals | Income from everyday use, no application, settled weekly on-chain |
| Telegram collectible stickers | You own a sticker | You own the character, and others using it is what pays you |

## Limitations

- **The contract is unaudited.** It is small and covered by 16 Foundry tests, but no third party has reviewed it.
- **Counting happens off-chain.** Sends are scored on the Chogsticks server and settled weekly. The poster wallet (`0x460a…5c6F`) decides each week's root. It cannot withdraw funds or post more than the pool holds, and each allocation is published for anyone to check.
- **Unclaimed $CHOG stays in the pool.** There is no withdraw path, by design, so nothing can be pulled back out.
- **Holders can still send their own Chog.** It is capped at 5 decaying sends a day like anyone else. Blocking it fully needs Discord-to-wallet linking, which is not built yet.
- **Discord only for now.** The Telegram and X paths are not built.
- **The pool is small.** It was seeded with 51.58 $CHOG. Anyone can top it up with `fund()`.
- **Week 1 was shortened.** It closed on Oct 23 at 08:00 UTC for the launch payout. Weeks run 7 days from there.

## Stack

Next.js 16 on Vercel, Upstash Redis for counts, `sharp` for sticker rendering, viem for Monad reads, Solidity 0.8.24 with Foundry and OpenZeppelin for the pool, and OpenZeppelin's Merkle tree library for payouts.

## Run locally

```bash
git clone https://github.com/mystiquemide/chogsticks && cd chogsticks
npm install
cp .env.example .env.local   # Discord app id and public key; Redis is optional, counts fall back to memory
npm test && (cd contracts && forge test)
npm run dev
```

The contract tests need `forge-std` in `contracts/lib` (`git clone https://github.com/foundry-rs/forge-std contracts/lib/forge-std`).

## License

MIT
