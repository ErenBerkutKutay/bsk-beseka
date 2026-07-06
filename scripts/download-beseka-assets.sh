#!/usr/bin/env bash
# beseka.com medya indirme scripti
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/public/beseka"

mkdir -p "$DEST"/{logo,hero,cms,products,blog}

curl -sL -o "$DEST/logo/logo.jpg" "https://www.beseka.com/img/logo-1732632694.jpg"
curl -sL -o "$DEST/logo/logo-dark.webp" "https://www.beseka.com/img/cms/beseka-yatay-dark-saydam.webp"
curl -sL -o "$DEST/logo/favicon.ico" "https://www.beseka.com/img/favicon.ico"
curl -sL -o "$DEST/hero/slide-1.webp" "https://www.beseka.com/img/1_tr.webp"
curl -sL -o "$DEST/hero/slide-2.webp" "https://www.beseka.com/img/2_tr.webp"
curl -sL -o "$DEST/hero/slide-3.webp" "https://www.beseka.com/img/milli-takim-kutlama-fix.webp"
curl -sL -o "$DEST/cms/journey-1.webp" "https://www.beseka.com/img/cms/aut4_1_2.webp"
curl -sL -o "$DEST/cms/journey-2.webp" "https://www.beseka.com/img/cms/aut4_2.webp"
curl -sL -o "$DEST/cms/journey-3.webp" "https://www.beseka.com/img/cms/aut4_3-1.webp"
curl -sL -o "$DEST/blog/automechanika.png" "https://www.beseka.com/img/ybc_blog/post/thumb/mail_imza_fuar_beseka_tr.png"

declare -A PRODUCTS=(
  [b2306]="https://www.beseka.com/10453-home_default/b2306-suspansiyon-ara-yatak-takozu-arka-q14-peugeot-boxer-citroen-jumper-fiat-ducato-1311826080-46751547.jpg"
  [b2307]="https://www.beseka.com/10461-home_default/b2307-suspansiyon-ara-yatak-takozu-arka-q18-16-jant-peugeot-boxer-citroen-jumper-fiat-ducato-1311858080.jpg"
  [b6850]="https://www.beseka.com/10471-home_default/b6850-amortisor-toz-korugu-fiat-egea-13-d-multijet-fiat-egea-14-fiat-egea-16.jpg"
  [b6657]="https://www.beseka.com/10479-home_default/b6657-amortisor-toz-korugu-fiat-dogan-fiat-kartal-fiat-sahin-4420024.jpg"
  [b6190]="https://www.beseka.com/10483-home_default/b6190-amortisor-toz-korugu-on-fiat-uno-fiat-regata-fiat-ritmo-5978771.jpg"
  [b8359]="https://www.beseka.com/10485-home_default/b8359-amortisor-toz-korugu-renault-clio-iii-modus-8200127285-y4452-4452.jpg"
  [b8550]="https://www.beseka.com/10487-home_default/b8550-amortisor-toz-korugu-sag-sol-renault-megane-ii-scenic-ii-8200040073-y4284-2557000542824.jpg"
  [b8650]="https://www.beseka.com/10489-home_default/b8650-amortisor-toz-korugu-renault-fluence-megane-iii-540500006r-540505143r-540500016r-2557000495701.jpg"
  [b8306t]="https://www.beseka.com/10495-home_default/b8306t-amortisor-takozu-ve-rulmani-kit-renault-captur-i-renault-clio-iv-renault-clio-iii.jpg"
  [b8376]="https://www.beseka.com/10507-home_default/b8376-motor-takozu-sag-10-tce-h4d-orijinal-renault-clio-v-112323904r.jpg"
)

for name in "${!PRODUCTS[@]}"; do
  curl -sL -o "$DEST/products/${name}.jpg" "${PRODUCTS[$name]}"
done

echo "Beseka medya indirildi: $DEST"
