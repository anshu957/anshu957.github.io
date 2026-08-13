# Blog card figures — how they work and how to add one

Every blog post has a **card image**: a small technical figure that captures the
*idea* of the post as a real simulation. They're drawn with
[Manim](https://www.manim.community/) and share one house style so the blog looks
like one thing.

If you're an agent adding a figure for a **new post**, read this whole file first,
then follow "Add a figure for a new post" at the bottom.

---

## The house style (non-negotiable rules)

1. **One idea, captured as a real computation.** Not decoration. Pick the concept
   at the heart of the post and simulate it (a flow, a landscape, a graph, a
   field). Examples below.
2. **Ink + one accent colour.** Almost everything is drawn in the post's "ink"
   colour. Exactly **one** domain accent highlights the key thing (the fate, the
   shortcut, the swirl). Tea is the one exception — it uses a warm pair
   (amber + oxide) because it's about colour.
3. **Two versions per card, for light & dark mode.** The same scene is rendered
   twice with different ink colours (dark ink for light mode, cream ink for dark).
   The website shows the right one automatically. You don't do anything special —
   the colours come in through environment variables (see below).
4. **3:2 shape, transparent background, no text/labels/axes.** One clear motif,
   centred, with a little margin. It must still read at thumbnail size.
5. **Always check it visually at card size, in BOTH themes, before finishing.**
   (This is the step that's easy to skip and always bites. Don't.)

## The accent colour comes from the post's topic

The site maps each post to a domain colour (`src/lib/domainColor.js`). Match it:

| Topic keywords | Domain | Light hex | Dark hex |
|---|---|---|---|
| tea / notes / personal / pause | **gold** | `#c89a52` | `#d4b06a` |
| network / physics / complex / graph | **blue** | `#6b7fb0` | `#8fa0cb` |
| genomics / single-cell / rna / method / pipeline | **sage** | `#5e7257` | `#8faa84` |
| (anything else) | **oxide** | `#b85a43` | `#e08872` |

Ink is always `#211512` (light mode) / `#f0dcc8` (dark mode).

---

## How a scene is written

Each scene is a small Python file in `manim/` with one Manim `Scene` (or
`ThreeDScene`) class. It reads its colours from the environment so one file makes
both light and dark versions:

```python
import os
from manim import Scene, ManimColor, config
INK    = ManimColor(os.environ.get("INK", "#211512"))     # linework
ACCENT = ManimColor(os.environ.get("ACCENT", "#5e7257"))  # the one highlight
FILL   = ManimColor(os.environ.get("FILL", "#f6f2ea"))    # = plate paper; only
                                                          # needed for occlusion

config.frame_height = 2.6                    # 3:2 frame
config.frame_width  = config.frame_height * 1.5
config.pixel_height = 1000
config.pixel_width  = 1500
```

Then `construct()` builds the figure with `INK` for lines and `ACCENT` for the one
highlight. That's the whole trick.

## The toolbox (techniques already proven here)

Reuse these ideas; each is one of the existing scenes you can copy from:

- **Arrow vector field** — `manim.ArrowVectorField(func, x_range, y_range, color=INK,
  length_func=lambda n: 0.3*sigmoid(n))`. Good for anything with a "flow".
- **Hand-integrated trajectories** — write your own RK4 loop, then
  `VMobject().set_points_smoothly([...])` for a smooth curve. Good for streamlines,
  paths, spirals, stir-lines.
- **Force-directed graph** (`network.py`) — spring layout so a graph looks organic,
  not like dots on a ring. Straight `Line`s for edges, `Dot`s for nodes.
- **Ridgeline landscape** (`cells.py`) — draw many stacked height-profile curves
  from back to front; under each, a `Polygon` filled with `FILL` hides the curves
  behind it, giving a solid engraved terrain. This is how the Waddington landscape
  is made. Use `FILL` = the plate paper colour so it blends.
- **Top-down / tilted views** (`tea.py`) — build the motif flat, then
  `VGroup(*self.mobjects).stretch(0.6, dim=1)` to foreshorten it into a 3/4 view.
- **Two colours that work on both themes** (tea) — pick mid-tone hues (amber,
  oxide) that show on cream *and* dark, and keep them constant across both variants;
  only the ink swaps.

## The three existing scenes (copy the closest one)

- `cells.py` (`Cells`) — **Watching Cells Decide**: a Waddington landscape. Stacked
  contours, one valley at the back splitting into several at the front; three cells
  roll in and commit to different fate-valleys (sage).
- `network.py` (`Network`) — **Small Worlds at Dusk**: a Watts–Strogatz small-world
  graph in a force-directed layout; long-range shortcuts + hubs in blue.
- `tea.py` (`Tea`) — **Tea Between Simulations**: a stirred teacup in 3/4 view; the
  tea surface carries a swirling vortex field (amber + oxide).

---

## Add a figure for a new post

1. **Pick the concept.** What's the one idea? Turn it into a simulation (see the
   toolbox). Keep it simple and legible at small size.
2. **Copy the closest scene** in `manim/` to `manim/<name>.py`. Keep the env-var
   colour setup and the 3:2 `config` block. Draw with `INK`; highlight one thing
   with `ACCENT` (use `FILL` only if you need occlusion like the landscape).
3. **Find the accent** for the post's topic from the table above.
4. **Register it** in `manim/generate.sh` — add a row to `posts`:
   `"<file>.py <Class> <slug> <accentLight> <accentDark>"`. The `<slug>` must match
   the post's `.mdx` filename and its `image:` frontmatter
   (`/assets/blog/<slug>-card.png`).
5. **Render + look:** `scripts/sketch/manim/generate.sh` writes
   `public/assets/blog/<slug>-card.png` (light) and `-card-dark.png` (dark).
   Open the blog and check the card in **both** light and dark mode. Iterate on the
   scene until it reads well at thumbnail size. Commit the two PNGs.

## Running it

```bash
# one-time environment (keeps your other envs untouched)
mamba create -y -n manim -c conda-forge python=3.11 manim
conda activate manim

scripts/sketch/manim/generate.sh            # all posts, both variants
```

Render artifacts under `manim/media/` are git-ignored. The website only uses the
committed PNGs, so nothing runs Manim at build/deploy time.
