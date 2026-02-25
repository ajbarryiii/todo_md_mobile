# todo_mobile

iOS-only React Native app scaffold for a personal todo workflow backed by markdown files from `../todo_md`.

## Stack

- React Native (`0.84.x`) + React (`19.x`)
- Uniwind (`1.x`) with Tailwind CSS (`4.x`)
- HeroUI theme package (`@heroui/theme`) for design tokens and theming primitives
- Markdown parsing with `unified`, `remark-parse`, and `remark-gfm`

## Why `@heroui/theme` (and not `@heroui/react`)

`@heroui/react` is a React DOM component library and depends on `react-dom` and `framer-motion`, which does not fit native iOS React Native rendering.

This project uses `@heroui/theme` with Uniwind so you can keep HeroUI-style tokens while building native components.

## Bootstrap

1. Enter shell: `nix develop`
2. Install JS deps: `pnpm install`
3. If `ios/` does not exist yet, generate native project files in a temp folder:
   - `npx @react-native-community/cli@latest init TodoMobileNative --skip-install --version 0.84.0`
   - copy `TodoMobileNative/ios` into this repo as `ios`
   - copy `TodoMobileNative/Gemfile` into this repo root
4. Install Ruby gems: `bundle install`
5. Install pods: `bundle exec pod install --project-directory=ios`
6. Run app: `pnpm ios`

## Uniwind notes

- CSS entrypoint is `src/global.css`
- Metro is wrapped with `withUniwindConfig` in `metro.config.js`
- Keep `import './src/global.css'` in `App.tsx` (not `index.js`) for better reload behavior

## todo_md integration note

On-device iOS cannot directly read `../todo_md` from your Mac filesystem. For personal use, typical approaches are:

- local sync/export step from `../todo_md` into app sandbox
- iCloud Drive shared file location
- local network endpoint from Neovim/plugin side
