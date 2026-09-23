#!/bin/zsh
# Render every blog plate as light/dark PNG and animated looping GIF:
#   public/assets/blog/<slug>-card.png       (light static poster)
#   public/assets/blog/<slug>-card-dark.png  (dark static poster)
#   public/assets/blog/<slug>-card.gif       (light animated simulation)
#   public/assets/blog/<slug>-card-dark.gif  (dark animated simulation)
#   lab.py writes animated <slug>-card{,-dark}.webp instead of GIFs (needs ffmpeg)
# Colours come from src/styles/palette.json via the generated palette.zsh (npm run tokens): ink, sheet
# (FILL, the glass plate's solid ground, so occlusion fills match) and the domain palette.
# Usage: scripts/sketch/manim/generate.sh   (needs the 'manim' conda env; ONLY=lab.py to render one)
set -e
source ~/miniforge3/etc/profile.d/conda.sh 2>/dev/null || source ~/mambaforge/etc/profile.d/conda.sh; conda activate manim 2>/dev/null || conda activate ~/.local/share/mamba/envs/manim
DIR=${0:A:h}
OUT="$DIR/../../../public/assets/blog"

# Tokens, light then dark (LIGHT / DARK arrays).
node "$DIR/../../tokens/build.mjs" >/dev/null
source "$DIR/palette.zsh"

# scene_file  Class  slug  per-scene colour vars (named after the tokens they take)
posts=(
  "cells.py Cells watching-cells-decide A1=OXIDE,A2=SAGE,A3=BLUE"
  "network.py Network small-worlds-at-dusk ACCENT=BLUE"
  "tea.py Tea tea-between-simulations ACCENT=GOLD"
  "lab.py Lab lab-standard -"
)

cd "$DIR"
mkdir -p "$OUT"

for row in "${posts[@]}"; do
  set -- ${(z)row}
  [[ -n "$ONLY" && "$1" != "$ONLY" ]] && continue
  file=$1; cls=$2; slug=$3; map=$4; base="${file%.py}"
  img="media/images/${base}/${cls}_ManimCE_v0.20.1.png"
  gif="media/videos/${base}/360p18/${cls}_ManimCE_v0.20.1.gif"
  echo "Rendering ${slug}..."

  for theme in LIGHT DARK; do
    sfx=""; [[ $theme == DARK ]] && sfx="-dark"
    vars=(${(P)theme})
    # Resolve the per-scene aliases (A1=OXIDE -> A1=<that theme's oxide>).
    if [[ "$map" != "-" ]]; then
      for pair in ${(s:,:)map}; do
        key=${pair%%=*}; tok=${pair#*=}
        for v in $vars; do [[ $v == ${tok}=* ]] && vars+=("${key}=${v#*=}"); done
      done
    fi
    env $vars manim -s -qh -t -r 1500,1000 --media_dir media "$file" "$cls" >/dev/null 2>&1
    cp "$img" "$OUT/${slug}-card${sfx}.png"
    if [[ "$file" == "lab.py" ]]; then
      # Animated WebP instead of GIF (~0.7 MB vs ~8 MB), via an MP4 render
      env $vars manim -r 1080,720 --fps 30 --media_dir media "$file" "$cls" >/dev/null 2>&1
      ffmpeg -y -loglevel error -i "media/videos/${base}/720p30/${cls}.mp4" -an -c:v libx264 -pix_fmt yuv420p \
        -crf 18 "media/${slug}${sfx}.mp4"
      ffmpeg -y -loglevel error -i "media/${slug}${sfx}.mp4" -vf "fps=24,scale=720:-1:flags=lanczos" -c:v libwebp_anim \
        -lossless 0 -q:v 80 -compression_level 6 -loop 0 -an "$OUT/${slug}-card${sfx}.webp"
    else
      env $vars manim --format gif -r 540,360 --fps 18 --media_dir media "$file" "$cls" >/dev/null 2>&1
      cp "$gif" "$OUT/${slug}-card${sfx}.gif"
    fi
  done
  echo "  ✓ ${slug}"
done

echo "Done! All blog card assets written to $OUT"
