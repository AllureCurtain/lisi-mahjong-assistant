# Taiyuan Lisi Mahjong Real-Time Assistant Design

## Purpose

Build a mobile-first assistant for three-player Taiyuan Lisi Mahjong as played by the family rule set discussed on 2026-06-07. The first version focuses on accurate manual tile input with automatic turn tracking, real-time discard recommendations, pong/kong recommendations, listening-state handling, and end-of-hand scoring.

The first version does not use camera recognition, AI glasses, online multiplayer, four-player rules, wind/dragon/flower tiles, seven pairs, thirteen orphans, or exact hidden-hand inference for opponents.

## Game Rules Captured

### Tiles And Players

- Players: 3.
- Tile set: only `wan`, `tiao`, and `bing`, values 1-9, four copies each, total 108 tiles.
- No wind tiles, dragon tiles, or flower tiles.
- Play direction: counterclockwise.
- Dealer acts first. The app starts from the actual first discard state and then tracks turn order automatically.
- Eating/chow calls are not allowed.
- Pong and kong are allowed before listening.

### Standing Tiles

- Each player has 4 standing tiles at the start.
- The user's standing tiles are known to the app. Opponents' standing tiles are hidden and are not counted as public seen tiles.
- Before listening, a standing tile cannot be discarded as a normal visible discard.
- Standing tiles can be consumed by pong or kong.
- At least 1 standing tile must remain available for the player to declare listening.
- If all 4 standing tiles are consumed before listening, that player cannot legally listen or win.

### Missing Suit Requirement

- A legal winning hand must contain exactly two suits.
- The winning hand cannot contain all three suits.
- The winning hand cannot contain only one suit.
- Melds count toward the final suit set.
- The face-down standing tile discarded while declaring listening does not count toward the final winning hand.
- The missing suit direction is not fixed at the start. The assistant reevaluates `missing wan`, `missing tiao`, and `missing bing` dynamically as the hand changes.

### Listening

- A player must declare listening before winning.
- To declare listening, the player discards one remaining standing tile face-down.
- Other players know the player has declared listening, but they do not know which standing tile was discarded.
- After the standing tile is removed, the remaining hand plus melds must be in a legal tenpai state.
- After listening, the hand is locked:
  - The player continues drawing in turn.
  - If the draw wins, the player can self-draw win.
  - If the draw does not win, the player must discard exactly the drawn tile.
  - The original locked hand cannot change.
  - The player cannot pong, kong, or otherwise adjust the hand after listening.
- A player can still win from another player's discard after listening.

### Winning Hands

- Standard win: 4 groups plus 1 pair.
- A group can be a sequence, triplet, or kong.
- The pair can be any two identical tiles.
- Special dragon route: one suit contains `123456789`, counted as three groups (`123`, `456`, `789`), plus one additional group and one pair.
- Dragon tiles must come from the concealed non-melded hand. A pong or kong meld cannot be split to supply a tile for the dragon.
- A concealed fourth copy can still support both dragon and a triplet if enough copies exist. Example: concealed `1-9 tiao` plus three extra `3 tiao` copies can use one `3 tiao` in the dragon and the other three `3 tiao` as a triplet.

### Kong And Tail Draw

- Kongs are recorded but not scored immediately.
- After any kong, the konging player draws one replacement tile from the tail of the wall and then discards.
- A kong does not change play direction.
- If the user kongs, the app prompts for the replacement tile and then recomputes recommendations.
- If an opponent kongs, the app records the event and waits for that same opponent's next discard.
- Concealed kong and added kong are allowed before listening.
- Added kong is scored as an exposed kong.
- After listening, kongs are not allowed.

## Scoring Rules

Scoring is performed only when a hand ends. First apply the base win score, then add the winner's own kong bonuses. Kongs made by players who did not win are ignored.

### Base Win Score

Self-draw:

- Each of the other two players pays 20.
- Winner gains 40.

Discard win when the discarder has not declared listening:

- If the winner is dealer: discarder pays 20, winner gains 20.
- If the winner is not dealer: discarder pays 15, winner gains 15.

Discard win when the discarder has declared listening:

- If the winner is dealer: both other players pay 10, dealer gains 20.
- If the winner is not dealer: dealer pays 10, the other non-winning player pays 5, winner gains 15.
- This formula applies whether the listening discarder is dealer or non-dealer.

### Kong Bonus

Only the winner's own kongs add bonus points.

Exposed kong:

- Bonus unit per paying player: 5.
- If self-draw, both other players each pay 5.
- If discard win and the discarder has declared listening, both non-winners each pay 5.
- If discard win and the discarder has not declared listening, the discarder pays 10.

Concealed kong:

- Bonus unit per paying player: 10.
- A concealed kong equals two exposed kongs.
- If self-draw, both other players each pay 10.
- If discard win and the discarder has declared listening, both non-winners each pay 10.
- If discard win and the discarder has not declared listening, the discarder pays 20.

Example: winner self-draws with 1 exposed kong and 1 concealed kong.

- Base self-draw: each opponent pays 20, winner gains 40.
- Exposed kong: each opponent pays 5, winner gains 10.
- Concealed kong: each opponent pays 10, winner gains 20.
- Total: each opponent pays 35, winner gains 70.

## Input Model

The assistant should minimize manual input. The app tracks current actor and phase; the user only enters tile faces and interrupting events.

### Setup

- Choose seats `A`, `B`, `C`.
- Mark which seat is the user.
- Mark dealer.
- Confirm counterclockwise order.
- Enter the user's starting hand and mark 4 standing tiles.
- If the user is dealer, enter the actual hand currently held before the first app-assisted discard. The app should not rely on a hard-coded opening hand count because the practical starting point is the first visible discard state.

### Normal Flow

- When it is an opponent's turn, the app waits for the opponent's visible discard. The user taps only the tile face. The app records the discard under the current actor.
- After a visible discard, the app shows a reaction strip:
  - `no call`
  - `A pong`
  - `B pong`
  - `C pong`
  - `A kong`
  - `B kong`
  - `C kong`
  - `win`
- If no one calls, the app advances to the next counterclockwise player.
- If someone pongs, the app jumps the turn to the caller and waits for that caller's discard.
- If someone kongs, the app records the kong, keeps the turn with the caller, and waits for that caller's discard after tail draw.
- When it is the user's turn to draw, the app prompts for the drawn tile face and then recomputes recommendations.
- When the user declares listening, the app requires selecting one remaining standing tile to discard face-down, then locks the hand.

### Correction Flow

- A visible `undo one step` action is required.
- Every state-changing action is appended to history so it can be reversed.
- The app warns when a tile count would exceed four known copies.
- The app warns when an action is illegal under the current state, such as attempting to discard a standing tile normally, kong after listening, listen with no standing tile, or win before listening.
- The app may provide a force-record option for real-world recovery, but forced actions must be marked in history.

## State Model

### Tile

- `suit`: `wan`, `tiao`, or `bing`.
- `rank`: 1-9.

### Player State

- `seat`: `A`, `B`, or `C`.
- `isUser`.
- `isDealer`.
- `hasDeclaredListening`.
- `lockedAfterListening`.
- `concealedTiles`: exact for user, unknown for opponents.
- `standingTiles`: exact for user before listening, unknown for opponents.
- `faceDownListeningDiscard`: exact for user, unknown for opponents.
- `melds`: public pong/kong groups.
- `discards`: public visible discards.
- `exposedKongCount`.
- `concealedKongCount`.

### Game State

- `players`.
- `currentActor`.
- `direction`: counterclockwise.
- `phase`: setup, waiting visible discard, waiting user draw, reaction, waiting tail-draw discard, user discard choice, settlement.
- `lastDiscard`: tile plus discarding player.
- `knownSeenCounts`: user's hand, user's standing tiles, public discards, and public melds/kongs. Opponents' hidden standing tiles and concealed hands are not included.
- `actionHistory`: reversible event list.

## Recommendation Design

The recommendation engine runs when the user is not locked after listening and must choose an action or discard.

### Discard Recommendation

For every candidate visible discard:

- Exclude standing tiles from normal discard candidates.
- Include only tiles the user can legally discard under the current state.
- Enumerate three missing-suit routes: missing `wan`, missing `tiao`, missing `bing`.
- Reject routes where the eventual hand cannot contain exactly two suits.
- Reject routes that leave no standing tile available before listening.
- Evaluate standard-hand and dragon-route possibilities.
- Estimate current distance to listening/winning.
- Count effective tiles using known remaining copies.
- Penalize routes whose effective tiles are already heavily visible or exhausted.
- Add risk warning when one or more opponents have declared listening.

Output should show the top recommendations, not only one tile:

- Best discard.
- Route type: missing suit plus standard or dragon route.
- Why: distance, effective tiles, standing-tile preservation, and visible remaining copies.
- Warnings: likely dead route, impossible legal listening path, high risk because opponents are listening.

### Listening Recommendation

When the user can legally declare listening:

- Enumerate each remaining standing tile that could be discarded face-down.
- Remove that tile and test whether the remaining concealed hand plus melds is in legal tenpai.
- Validate exactly-two-suit requirement.
- Validate standard and dragon tenpai states.
- Show legal listening choices and expected winning tiles.
- Once the user chooses listening, lock the hand.

### Pong And Kong Recommendation

When an opponent discards a tile and the user can pong or kong:

- Evaluate the resulting hand and meld state.
- Track whether the call consumes standing tiles.
- Reject calls that consume the last standing tile before listening.
- Recompute missing-suit routes dynamically.
- Compare the call against passing:
  - distance to listening
  - effective tiles
  - remaining standing tiles
  - route flexibility
  - potential kong bonus if the user later wins
- Explain `recommend`, `optional`, or `not recommended`.

When the user can concealed kong or added kong before listening:

- Evaluate the same tradeoffs.
- Include that a kong gives a tail draw but only scores if the user later wins.
- Do not recommend a kong that breaks a better listening route unless the route score improves after tail-draw potential.

### After Listening

The recommendation engine switches modes:

- If the user draws a winning tile, show self-draw win.
- If the user draws a non-winning tile, require discarding exactly that drawn tile.
- If another player discards a winning tile, show discard win.
- No hand-optimization recommendation is shown after listening.

## UI Structure

The first version should be a responsive web app that works on phones, tablets, and desktop browsers from the same codebase. It should run locally through Vite with LAN access during development, and can later become a PWA.

Primary regions:

- Header: current actor, dealer marker, each player's listening state.
- User hand: grouped by suit, with standing tiles visually distinct and locked.
- Meld area: user's melds and public opponent melds.
- Discard rivers: compact per-player visible discards.
- Tile keypad: `wan 1-9`, `tiao 1-9`, `bing 1-9`.
- Reaction strip after each discard.
- Recommendation panel with best discard, route, effective tiles, and warnings.
- Undo control.
- End-hand settlement modal.

The UI should make automatic state clear, but avoid forcing the user to enter information the turn state already determines.

Responsive behavior:

- Phone: prioritize large touch targets; each suit keypad uses a 3 by 3 grid so tile labels do not overflow.
- Tablet: use a wider two-column layout where status/recommendations can sit beside the hand and input areas.
- Desktop: use a constrained dashboard layout with hand, rivers, action strip, and recommendation panel visible at once.
- All interactive buttons should be at least 44 px tall and must not require horizontal scrolling for normal play.

## Test Cases For First Version

- Tile count cannot exceed four copies for known visible plus user-held tiles.
- Normal counterclockwise turn progression.
- Pong jumps the turn to the caller.
- Kong keeps the turn with the caller and requires tail-draw discard.
- Standing tile cannot be normally discarded before listening.
- Standing tile can be consumed by pong or kong.
- Listening is illegal if no standing tile remains.
- Listening removes one standing tile face-down and locks the hand.
- A player cannot kong after listening.
- A player cannot win before declaring listening.
- Winning hand must contain exactly two suits including melds.
- One-suit final hand is illegal.
- Three-suit final hand is illegal.
- Standard 4 groups plus 1 pair is legal when all other constraints are satisfied.
- Dragon route requires concealed `123456789` and cannot use melded tiles for the dragon.
- Self-draw scoring without kongs: two opponents each pay 20.
- Self-draw scoring with exposed and concealed kongs matches the 70-point example.
- Discard win when discarder is not listening charges only the discarder, including kong bonus.
- Discard win when discarder is listening splits base and kong bonus across both non-winners according to the dealer rule.

## First Version Scope

Build these pieces first:

- Manual tile keypad.
- Three-player turn state machine.
- User hand, standing tile, meld, discard, and listening-state tracking.
- Undo history.
- Legal action validation.
- Standard and dragon hand evaluators.
- Listening validator.
- Discard, pong, and kong recommendation engine.
- End-hand scoring engine.

Defer these pieces:

- Camera or photo recognition.
- Opponent hidden-hand inference beyond public discards, melds, and listening state.
- Four-player rules.
- Wind, dragon, and flower tiles.
- Seven pairs and other special hands.
- Networked multiplayer.
- Full wall simulation beyond turn and tail-draw state handling.
