#!/bin/zsh
# Render every TikZ diagram here twice (light + dark) to SVG:
#   public/assets/blog/lab-standard/<name>.svg, <name>-dark.svg
# Usage: scripts/diagrams/lab-standard/render.sh   (needs lualatex + pdftocairo)
set -e
export TEXMFHOME=~/.local/share/texmf-tl2023   # TL2023-matched add-ons (fontawesome5, simpleicons, forest, pgf-umlsd, dirtree); ~/Library/texmf has a newer l3kernel than the 2023 format
DIR=${0:A:h}
OUT="$DIR/../../../public/assets/blog/lab-standard"
BUILD=$(mktemp -d)
cd "$DIR"
for f in [^_]*.tex; do
  name=${f:r}
  for theme in light dark; do
    suffix=""; [[ $theme == dark ]] && suffix="-dark"
    lualatex -interaction=nonstopmode -halt-on-error -output-directory="$BUILD" -jobname="$name$suffix" \
      "\\def\\fontdir{${DIR:h}/fonts/}\\def\\theme{$theme}\\input{$f}" >"$BUILD/$name$suffix.log.txt" 2>&1 || { tail -30 "$BUILD/$name$suffix.log"; exit 1; }
    pdftocairo -svg "$BUILD/$name$suffix.pdf" "$OUT/$name$suffix.svg"
  done
done
rm -rf "$BUILD"
echo "Rendered to $OUT"
