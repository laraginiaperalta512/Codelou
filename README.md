# マンダラチャート · Mandal-Art Goal Chart

A small, dependency-free web app for the **Mandal-Art** (Mandala Chart) goal-setting
method — a Japanese 9×9 grid that turns one big goal into 8 sub-goals and 64
concrete actions.

> Created by designer **Hiroaki Imaizumi** and popularized by consultant
> **Yasuo Matsumura**, the method became widely known after baseball star
> **Shohei Ohtani** used it in high school to plan his path to the pros.

## How it works

The chart is a 3×3 arrangement of nine 3×3 blocks (81 cells total):

```
 ┌───────┬───────┬───────┐
 │ block │ block │ block │   Outer blocks hold a sub-goal in
 │   0   │   1   │   2   │   their center, ringed by 8 actions.
 ├───────┼───────┼───────┤
 │ block │CENTER │ block │   The CENTER block holds your main
 │   3   │   4   │   5   │   goal in the middle, ringed by the
 ├───────┼───────┼───────┤   8 sub-goals.
 │ block │ block │ block │
 │   6   │   7   │   8   │
 └───────┴───────┴───────┘
```

1. Write your **main goal** in the dead-center cell.
2. Fill the 8 cells around it with **sub-goals**.
3. Each sub-goal automatically appears as the center of its matching outer
   block — fill that block's 8 cells with **small, doable actions**.

Editing a sub-goal keeps both of its copies in sync.

## Features

- **1 + 8 + 64 = 81** editable cells with the classic mirrored layout
- **Auto-save** to your browser (localStorage) — nothing leaves your machine
- **Load example** — a ready-made "healthier life" chart to see the idea
- **Export / Import** your chart as JSON
- **Print / PDF** with a clean print stylesheet
- Fully **static** — no build step, no dependencies, no server needed

## Run it

Just open `index.html` in a browser. Or serve the folder locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

### Host on GitHub Pages

Push to your repo, then enable **Settings → Pages → Deploy from branch** and
pick the branch / root folder. The app is plain static files, so it works as-is.

## Files

| File         | Purpose                                  |
| ------------ | ---------------------------------------- |
| `index.html` | Markup, toolbar, and the chart container |
| `styles.css` | Layout, block tints, and print styles    |
| `app.js`     | State, rendering, sync, save/import      |

## License

MIT — do whatever you like.
