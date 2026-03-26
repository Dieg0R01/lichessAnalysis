# Lichess Cloud Analysis for Chess.com
A simple browser extension for one-click analysis of Chess.com games on Lichess.

## Why?
I love free, powerful open-source software! Chess.com does not offer free cloud analysis, only local line evaluations. The first is a lot easier to understand for beginners and much more accesible to users with lower end devices. Lichess cloud analysis is a wonderful tool, and users who might not want to leave chess.com (because of their friends or arguably better puzzles and lessons) can get a glimpse of its advantages.

## Installation
This is a Chromiun-based extension, so you can use it on Chrome, Edge, Opera, Firefox, or other (non-tested) web explorers. Find it either on the Firefox Addons website or the Chrome Webstore.

**Chrome Webstore**  
[Link!](https://chrome.google.com/webstore/detail/lichess-cloud-analysis-fo/ngepiabohcfcoggpfghnfoefpnmnfocd)

**Firefox Addons**  
Pending review.

**Manual installation**  
Depending on your browser and your OS, you have two options.
1. (Any OS): Download and unzip source code, go to [chrome://extensions/](chrome://extensions/) or your browser's equivalent, turn on developer mode, click on "load unpacked", and go to the directory of the source code.
2. (Easier, but only MacOS/Linux) Drag the latest .crx file from [release](https://github.com/califernication/lichessAnalysis/releases) from this repo and drop it in [chrome://extensions/](chrome://extensions/) or your web explorer's equivalent (make sure developer mode is enabled!).

## How to use?
After you have finished a game on chess.com or when you go to review a game, the script injects an HTML button under the nominal Analysis button. When clicked, it takes you to a Lichess analysis board of the same game.

In the updated version, you will also see a small round button with the Lichess knight icon next to the share button on the chess.com sidebar. This mini button can be used at any moment (during the game or in review) to send the current PGN shown in the share menu to Lichess and open an analysis board of the current position.

![You'll see a nice new button like below](https://github.com/califernication/lichessAnalysis/blob/main/screenshots/newButtonGif.gif)

## FAQ

**Is there a game import limit?**  
Yes, Lichess limits import to 100 games per hour when not authenticated (OAuth2). The extension currently does not ask the user to authenticate in order to lessen set up time.

**How does the extension work?**  
The script scraps your game's PGN from chess.com through the DOM by opening the share menu and reading the PGN textarea. It then opens `https://lichess.org/paste#pgn=<PGN>` in a new tab. On lichess.org, the extension auto-fills the PGN form and submits it so that a cloud analysis board is opened for that game or position.

Due to CORS restrictions in modern browsers, calling the Lichess `api/import` endpoint directly from a content script is not reliable. Using `lichess.org/paste` as a redirect target keeps all requests within Lichess and avoids these issues while still providing a smooth one-click import experience.

The extension uses [Arrive.js](https://github.com/uzairfarooq/arrive), which abstracts the interface of [mutation observers](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver), to interact with the DOM efficiently.

