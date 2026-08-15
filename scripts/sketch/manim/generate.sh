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

# scene_file  Class  slug  a1L a2L a3L  a1D a2D a3D
# cells uses three separate accent envs (A1/A2/A3); other scenes use ACCENT.
posts=(
  "cells.py Cells watching-cells-decide #8f5c4a #5e7257 #6b7fb0 #c4856e #8faa84 #8fa0cb"
  "network.py Network small-worlds-at-dusk - - #6b7fb0 - - #8fa0cb"
  "tea.py Tea tea-between-simulations - - #c89a52 - - #d4b06a"
)

cd "$DIR"
for row in "${posts[@]}"; do
  set -- ${(z)row}
  file=$1; cls=$2; slug=$3; a1L=$4; a2L=$5; a3L=$6; a1D=$7; a2D=$8; a3D=$9
  img="media/images/${file%.py}/${cls}_ManimCE_v0.20.1.png"
  if [[ "$file" == "cells.py" ]]; then
    INK="$INK_LIGHT" A1="$a1L" A2="$a2L" A3="$a3L" FILL="#f4f0e8" \
      manim -s -qh -t -r 1500,1000 --media_dir media "$file" "$cls" >/dev/null 2>&1
    cp "$img" "$OUT/${slug}-card.png"
    INK="$INK_DARK" A1="$a1D" A2="$a2D" A3="$a3D" FILL="#191212" \
      manim -s -qh -t -r 1500,1000 --media_dir media "$file" "$cls" >/dev/null 2>&1
    cp "$img" "$OUT/${slug}-card-dark.png"
  else
    # single ACCENT for other scenes — use the a3 slot as the accent
    INK="$INK_LIGHT" ACCENT="$a3L" FILL="#f4f0e8" manim -s -qh -t -r 1500,1000 --media_dir media "$file" "$cls" >/dev/null 2>&1
    cp "$img" "$OUT/${slug}-card.png"
    INK="$INK_DARK" ACCENT="$a3D" FILL="#191212" manim -s -qh -t -r 1500,1000 --media_dir media "$file" "$cls" >/dev/null 2>&1
    cp "$img" "$OUT/${slug}-card-dark.png"
  fi
  echo "  ${slug}  (light+dark)"
done
echo "done -> $OUT"
