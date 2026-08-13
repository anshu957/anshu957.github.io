#!/bin/zsh
# Render every blog plate as two theme variants and write them into the site:
#   public/assets/blog/<slug>-card.png       (light: dark ink)
#   public/assets/blog/<slug>-card-dark.png  (dark:  cream ink)
# Usage: scripts/sketch/manim/generate.sh   (needs the 'manim' conda env)
set -e
source ~/mambaforge/etc/profile.d/conda.sh; conda activate manim
DIR=${0:A:h}
OUT="$DIR/../../../public/assets/blog"
INK_LIGHT="#211512"; INK_DARK="#f0dcc8"

# scene_file  Class  slug  accentLight  accentDark
posts=(
  "cells.py Cells watching-cells-decide #5e7257 #8faa84"
  "network.py Network small-worlds-at-dusk #6b7fb0 #8fa0cb"
  "tea.py Tea tea-between-simulations #c89a52 #d4b06a"
)

cd "$DIR"
for row in "${posts[@]}"; do
  set -- ${(z)row}
  file=$1; cls=$2; slug=$3; aL=$4; aD=$5
  img="media/images/${file%.py}/${cls}_ManimCE_v0.20.1.png"
  INK="$INK_LIGHT" ACCENT="$aL" FILL="#f6f2ea" manim -s -qh -t -r 1500,1000 --media_dir media "$file" "$cls" >/dev/null 2>&1
  cp "$img" "$OUT/${slug}-card.png"
  INK="$INK_DARK" ACCENT="$aD" FILL="#1a1210" manim -s -qh -t -r 1500,1000 --media_dir media "$file" "$cls" >/dev/null 2>&1
  cp "$img" "$OUT/${slug}-card-dark.png"
  echo "  ${slug}  (light+dark)"
done
echo "done -> $OUT"
