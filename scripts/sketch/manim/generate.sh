#!/bin/zsh
# Render every blog plate as light/dark PNG and animated looping GIF:
#   public/assets/blog/<slug>-card.png       (light static poster)
#   public/assets/blog/<slug>-card-dark.png  (dark static poster)
#   public/assets/blog/<slug>-card.gif       (light animated simulation)
#   public/assets/blog/<slug>-card-dark.gif  (dark animated simulation)
# Usage: scripts/sketch/manim/generate.sh   (needs the 'manim' conda env)
set -e
source ~/mambaforge/etc/profile.d/conda.sh; conda activate manim
DIR=${0:A:h}
OUT="$DIR/../../../public/assets/blog"
INK_LIGHT="#211512"; INK_DARK="#f0dcc8"

# scene_file  Class  slug  a1L a2L a3L  a1D a2D a3D
posts=(
  "cells.py Cells watching-cells-decide #8f5c4a #5e7257 #6b7fb0 #c4856e #8faa84 #8fa0cb"
  "network.py Network small-worlds-at-dusk - - #6b7fb0 - - #8fa0cb"
  "tea.py Tea tea-between-simulations - - #c89a52 - - #d4b06a"
)

cd "$DIR"
mkdir -p "$OUT"

for row in "${posts[@]}"; do
  set -- ${(z)row}
  file=$1; cls=$2; slug=$3; a1L=$4; a2L=$5; a3L=$6; a1D=$7; a2D=$8; a3D=$9
  base="${file%.py}"
  img="media/images/${base}/${cls}_ManimCE_v0.20.1.png"
  gif="media/videos/${base}/360p18/${cls}_ManimCE_v0.20.1.gif"

  echo "Rendering ${slug}..."

  if [[ "$file" == "cells.py" ]]; then
    # Light PNG
    INK="$INK_LIGHT" A1="$a1L" A2="$a2L" A3="$a3L" FILL="#f4f0e8" \
      manim -s -qh -t -r 1500,1000 --media_dir media "$file" "$cls" >/dev/null 2>&1
    cp "$img" "$OUT/${slug}-card.png"

    # Dark PNG
    INK="$INK_DARK" A1="$a1D" A2="$a2D" A3="$a3D" FILL="#191212" \
      manim -s -qh -t -r 1500,1000 --media_dir media "$file" "$cls" >/dev/null 2>&1
    cp "$img" "$OUT/${slug}-card-dark.png"

    # Light GIF
    INK="$INK_LIGHT" A1="$a1L" A2="$a2L" A3="$a3L" FILL="#f4f0e8" \
      manim --format gif -r 540,360 --fps 18 --media_dir media "$file" "$cls" >/dev/null 2>&1
    cp "$gif" "$OUT/${slug}-card.gif"

    # Dark GIF
    INK="$INK_DARK" A1="$a1D" A2="$a2D" A3="$a3D" FILL="#191212" \
      manim --format gif -r 540,360 --fps 18 --media_dir media "$file" "$cls" >/dev/null 2>&1
    cp "$gif" "$OUT/${slug}-card-dark.gif"

  elif [[ "$file" == "network.py" ]]; then
    # Light PNG
    INK="$INK_LIGHT" ACCENT="$a3L" FILL="#f4f0e8" \
      manim -s -qh -t -r 1500,1000 --media_dir media "$file" "$cls" >/dev/null 2>&1
    cp "$img" "$OUT/${slug}-card.png"

    # Dark PNG
    INK="$INK_DARK" ACCENT="$a3D" FILL="#191212" \
      manim -s -qh -t -r 1500,1000 --media_dir media "$file" "$cls" >/dev/null 2>&1
    cp "$img" "$OUT/${slug}-card-dark.png"

    # Light GIF
    INK="$INK_LIGHT" ACCENT="$a3L" FILL="#f4f0e8" \
      manim --format gif -r 540,360 --fps 18 --media_dir media "$file" "$cls" >/dev/null 2>&1
    cp "$gif" "$OUT/${slug}-card.gif"

    # Dark GIF
    INK="$INK_DARK" ACCENT="$a3D" FILL="#191212" \
      manim --format gif -r 540,360 --fps 18 --media_dir media "$file" "$cls" >/dev/null 2>&1
    cp "$gif" "$OUT/${slug}-card-dark.gif"

  elif [[ "$file" == "tea.py" ]]; then
    # Light PNG
    INK="$INK_LIGHT" ACCENT="$a3L" FILL="#f4f0e8" \
      manim -s -qh -t -r 1500,1000 --media_dir media "$file" "$cls" >/dev/null 2>&1
    cp "$img" "$OUT/${slug}-card.png"

    # Dark PNG
    INK="$INK_DARK" ACCENT="$a3D" FILL="#191212" \
      manim -s -qh -t -r 1500,1000 --media_dir media "$file" "$cls" >/dev/null 2>&1
    cp "$img" "$OUT/${slug}-card-dark.png"

    # Light GIF
    INK="$INK_LIGHT" ACCENT="$a3L" OXIDE="#b85a43" FILL="#f4f0e8" \
      manim --format gif -r 540,360 --fps 18 --media_dir media "$file" "$cls" >/dev/null 2>&1
    cp "$gif" "$OUT/${slug}-card.gif"

    # Dark GIF
    INK="$INK_DARK" ACCENT="$a3D" OXIDE="#d97359" FILL="#191212" \
      manim --format gif -r 540,360 --fps 18 --media_dir media "$file" "$cls" >/dev/null 2>&1
    cp "$gif" "$OUT/${slug}-card-dark.gif"
  fi

  echo "  ✓ ${slug} (light+dark PNG + GIF)"
done

echo "Done! All blog card assets written to $OUT"
