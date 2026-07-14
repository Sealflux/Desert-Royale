# Desert Royale

[![Deployed on Vercel](https://img.shields.io/badge/Play_Live-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://desert-royale-kappa.vercel.app/)

A turn-based survival board game set in the wild west. Players fight to be the last one standing in a grid-based arena with walls. Players can use special action cards that do various special things.

## Built for Macondo Hack Club — A Digital Adaptation of an original board game by Yacob England (Inspired By Guncho)

## Play Now

**Live Demo** [https://desert-royale-kappa.vercel.app/](https://desert-royale-kappa.vercel.app/)

## How to Play

- 2-6 Players place walls, and then take turns doing game actions.
- Each Turn: 2 Action Points which can be alloted to move, turn, shoot, reload, or play cards.
- Currently 26 Action Cards implemented across four different types (Movement, Combat, Utility, Bullet).
- Last Player Alive Wins

## Tech Stack

- React + TypeScript
- Boardgame.io(Game Engine)
- Tailwind CSS
- Vite

## Future Plans

- **UI/UX Overhaul** - Currently I don't really like the UI/UX but it's good enough for a first ship. The UI/UX Overhaul will improve the visual design and overall user experience as well as making it more immersive and intuitive.

- **Card UI Redesign** - Rework the current card interface to be inspired by Slay the Spire - cleaner layouts, better visual hierarchy, and more satisfying game actions.

- **Mobile Support** - Optimize/Make the game for mobile devices so you can play with your friends on your phone.

- **Code Despaghettifying** - Make the codebase more efficient with better maintainability and performance.

- **Multiple Device Support** - Instead of one device with pass & play, there will be individual players for each phone for a true multiplayer experience.

## Getting Started

```bash
git clone https://github.com/Sealflux/Desert-Royale.git
npm install
npm run dev