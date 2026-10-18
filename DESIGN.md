# Chogsticks Design System

Your Chog gets paid when the internet uses it.

Every Chog Genesis NFT gets a sticker pack made from its own art. Anyone can send those stickers in Discord (and later Telegram). Every send is credited to the token, and a $CHOG pool pays the current holder by usage share.

## 1. Brand core

- Product: per-token sticker packs plus usage-weighted $CHOG payouts.
- Users: Chog holders (get paid), chat users (send reactions), the Chog team (IP spreads).
- Hook: watching your own Chog climb the leaderboard because strangers keep spamming it.
- Voice: Chog's mischievous kid energy. Short, cheeky, concrete numbers. Example: "Your Chog got spammed 412 times today."
- Never say: demo, mock, simulated. Never claim a payout without a tx hash.

## 2. Visual direction

Die-cut sticker brutalism lifted from the Chog art itself: thick ink outlines, cream paper, white die-cut sticker borders, hard offset shadows. The brand frames the art and gets out of its way.

Rules:
- No gradients, glows, blurs, glassmorphism, or 3D.
- Every card, button, and image has a 3px ink border and a hard 4px to 6px offset ink shadow.
- Corners are rounded (12px small, 20px cards, 28px stickers).
- Payout Green is reserved for $CHOG amounts and positive counters. Nothing else.

## 3. Color tokens

| Token | Hex | Use |
|---|---|---|
| ink | #141014 | Outlines, text, shadows |
| paper | #F3EDDC | Page background |
| white | #FFFFFF | Sticker borders, card fill |
| chog-purple | #A85CDF | Primary actions, brand mark |
| bubble-pink | #E46FAE | Rank badges, highlights |
| pool-aqua | #7FD3D6 | Secondary surfaces, info |
| payout-green | #2FBF71 | $CHOG amounts and increments only |
| muted | #6E6470 | Secondary text |

Colors were sampled from real Chog Genesis art (image files 1462.webp, 7.webp, 500.webp).

## 4. Typography

- Display: Bricolage Grotesque ExtraBold, uppercase for headings over 32px.
- Body: Inter 400 and 600.
- Numbers: JetBrains Mono 700 for counters, ranks, $CHOG amounts, token ids.
- Scale: 64 / 40 / 28 / 20 / 16 / 14.

## 5. Logo

- Mark: purple rounded sticker with a clipped top right corner and a green $CHOG coin badge sitting on that corner. Meaning: the sticker is the asset, and it earns.
- Files: `assets/brand/mark.svg`, `assets/brand/lockup.svg`, preview `assets/brand/logo-preview.png`.
- Minimum size 16px. Do not recolor the coin, do not add gradients, do not remove the ink outline.

## 6. Mascot

There is no product mascot. Each holder's own Chog is the mascot. UI never shows a generic character where a real token could appear.

## 7. Sticker pack spec

Stickers are generated from each token's on-chain art (IPFS `image` from `tokenURI`). The art cannot change expression, so packs combine the real art with caption and effect layers.

- Scene 600 x 600: art 480 x 480 rounded 64px inside a white die-cut border with 8px ink edge and a 12px hard shadow.
- Captions: Inter ExtraBold caps, bold color fill, 26px ink stroke, 10px hard ink shadow, tilted -6 degrees, allowed to break out of the frame.
- Every sticker exists as a static PNG and a 12 frame animated GIF (400px) that Discord plays inline.
- Base set: GM (yellow, spinning sunburst), WAGMI (green, bounce with sparkles), NGMI (red rubber stamp slams onto grayscale art), COPE (aqua, wobble with sweat drops), LFG (orange, zoom punch with shake and speed lines), CHOG ON (pink, deep fried strobe).
- Trait captions: derived from metadata, up to 3 per token, one per trait. Example: Eyes = BTC Glass adds NUMBER GO UP, Mouth = Rainbow Puke adds SICK, Tier = Legendary adds LEGENDARY.
- Output is a palette PNG, roughly 80 to 170 KB.
- Reference output: animated samples in `assets/stickers/`, static sheet `assets/sticker-sheet.png` (tokens #1 and #7).

## 8. Routes and screens

### / (landing)
```
+--------------------------------------------------------------+
| [mark] CHOGSTICKS                 Leaderboard  Pool  [Connect]|
+--------------------------------------------------------------+
| YOUR CHOG GETS PAID           | +-----------------------+    |
| WHEN THE INTERNET USES IT.    | | #general              |    |
|                               | | anon: /chog lfg 1462  |    |
| [Add to Discord] [Check my    | | [sticker #1462 LFG]   |    |
|                  Chogs]       | | (+1 send to #1462)    |    |
|                               | +-----------------------+    |
+--------------------------------------------------------------+
| 1 SEND IT        | 2 IT COUNTS        | 3 HOLDER CLAIMS      |
| /chog in any     | unique senders,    | weekly $CHOG by      |
| server or DM     | daily caps         | usage share          |
+--------------------------------------------------------------+
| MOST MEMED THIS WEEK  [#1462 412] [#7 388] [#500 301] ...     |
+--------------------------------------------------------------+
| Self-spam doesn't count. Unique senders do.                  |
+--------------------------------------------------------------+
```
Data: live leaderboard top 5, total sends this epoch.

### /me (connected wallet)
Grid of owned Chogs. Card: sticker preview, sends today, unique senders, weekly rank, estimated $CHOG share, [Open].
- Not connected: "Connect a wallet to see your Chogs."
- No Chogs: "No Chog in this wallet. Stickers still work, earnings don't."
- Wrong network: "Switch to Monad (chain 143)." [Switch]

### /chog/[id]
Full pack grid, 7 day usage bars, unique senders, rank, current earner (live `ownerOf`), claimable $CHOG, [Claim] if connected wallet is the owner.
- Footer line: "Income moves with the NFT. Sell it and the next epoch pays the buyer."
- Zero sends: "Nobody's spammed this Chog yet. Send it somewhere." [Add to Discord]

### /leaderboard
Ranked table: rank, sticker thumb, token id, weighted sends, unique senders, est. $CHOG. Tabs: This week, All time.

### /pool
Pool balance in $CHOG, current epoch, countdown, last posted root with tx link, claim history.
- Claim states: idle, signing, pending (tx hash shown), confirmed (explorer link), failed (reason + retry).

## 9. Discord experience

- User-installable app, works in servers and DMs.
- `/chog <sticker> [id]`: autocomplete stickers; id defaults to the sender's linked Chog, otherwise any id.
- Reply is the sticker image plus a small footer: "#1462 credited. chogsticks".
- `/chog link`: links a Discord user to a wallet via signed message, used to block self-sends.

## 10. Anti-farm rules (shown in UI copy)

- Sends from the token owner's linked account score zero.
- Each sender counts at most 5 times per token per day.
- Score = weighted sends where each additional send from the same sender decays.
- Unique senders and unique chats weigh more than raw volume.

## 11. Components

Button (primary purple, secondary paper, ink border, offset shadow, press moves 2px into shadow). Card. Sticker tile. Counter (mono, green on increment, tick animation). Rank badge (pink). Tx pill (hash truncated, explorer link). Wallet button. Empty state block. Toast.

## 12. Motion

- Sticker slap: scale 1.15 to 1 with 3 degree rotate, 180ms.
- Counter tick: number rolls up, green flash 400ms.
- No looping background animation.

## 13. Build order

1. Tokens and globals (colors, fonts, border and shadow utilities).
2. Sticker renderer API.
3. Discord command, send counter.
4. /chog/[id].
5. /leaderboard, /me.
6. Claim contract and /pool.
7. Landing.
Build one section at a time and verify it in the browser before starting the next.

## 14. Acceptance checklist

- Every number on screen comes from the counter store or the chain.
- Every claim shows a real tx hash.
- Works at 375px width with no horizontal scroll.
- No em dashes in UI copy.
