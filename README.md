# Sensory Playhouse

A calm, safe digital sensory playhouse for toddlers (ages 1–4), built with
plain HTML, CSS, JavaScript, Vite, and Canvas. It grew out of the original
single-game **Sensory Swipe** project, which is preserved as the first game
in the hub.

## Games (MVP)

| Game | Senses |
| --- | --- |
| 🌈 Sensory Swipe | touch, vision, light sound |
| 🫧 Bubble Pop Garden | touch, vision, sound, hand–eye coordination |
| 🐮 Animal Sound Tap | hearing, vision, vocabulary |
| 🟣 Shape Feeder | shape recognition, drag control |
| 🎨 Color Rain | color recognition, visual tracking |
| 🐻 Peekaboo Friends | anticipation, object permanence |

## Safety & privacy

- No ads, no login, no accounts, no tracking, no analytics
- No camera / microphone / location access — no network calls at all
- All sounds are synthesized locally with the Web Audio API (no asset downloads)
- Only harmless settings (sound, volume, motion, calm mode, session timer)
  are stored in local browser storage
- No fail states, no scores, no streaks, no reward loops
- Parent settings are behind a hold-to-open gate
- Optional session timer ends gently with a real-world activity suggestion

## Run

```bash
npm install
npm run dev      # local development
npm run build    # production build
```

## Structure

```
src/
  main.js              entry point + child-safety guards
  core/                router, sound manager, settings, session timer, canvas utils
  screens/             home, game shell, parent settings, session end
  games/               one module per mini-game (mount/destroy interface)
  data/                games catalog
  styles/              base, home, games
```

Each game exports `mount(container) -> { destroy() }`, so adding a new game
is one module plus one catalog entry.
