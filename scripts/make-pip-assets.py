"""Generate RemindU's Pip icon and splash assets (SVG sources + PNGs) for Expo.

Usage: python3 make_pip_assets.py <repo root>
"""
import os
import sys

import cairosvg

CORAL = "#FF5A5F"
CORAL_SHADE = "#E8474D"
PAPER = "#F7F7F5"
PAPER_LINE = "#EDEDEA"
PINK = "#FDECEC"
INK = "#18181B"
BEAK = "#F3CF58"

WING_REST = '<ellipse cx="420" cy="618" rx="112" ry="70" transform="rotate(-20 420 618)" fill="{c}"/>'
WING_WAVE = '<ellipse cx="296" cy="446" rx="110" ry="54" transform="rotate(58 296 446)" fill="{c}"/>'


def pip(body, shade, blush, blush_op, wave=False, ground=None):
    """Pip in a 1024 box. Body centre is (490, 560)."""
    wing = (WING_WAVE if wave else WING_REST).format(c=shade)
    g = f'<ellipse cx="490" cy="814" rx="220" ry="26" fill="{ground}"/>' if ground else ""
    return f"""{g}
<path d="M276 560 L196 500 Q192 590 262 634 Z" fill="{shade}"/>
<ellipse cx="500" cy="296" rx="22" ry="56" transform="rotate(-22 500 296)" fill="{body}"/>
<ellipse cx="550" cy="292" rx="20" ry="48" transform="rotate(18 550 292)" fill="{body}"/>
<circle cx="490" cy="560" r="250" fill="{body}"/>
{wing}
<path d="M716 520 Q822 554 716 594 Z" fill="{BEAK}"/>
<circle cx="556" cy="500" r="38" fill="{INK}"/>
<circle cx="652" cy="496" r="34" fill="{INK}"/>
<circle cx="568" cy="486" r="12" fill="#FFFFFF"/>
<circle cx="662" cy="484" r="11" fill="#FFFFFF"/>
<ellipse cx="560" cy="576" rx="26" ry="13" fill="{blush}" opacity="{blush_op}"/>
<ellipse cx="672" cy="572" rx="22" ry="12" fill="{blush}" opacity="{blush_op}"/>"""


def mono():
    """One flat colour with the eyes cut out (even-odd holes), for Android 13+ themed icons."""
    return """<g fill="#FFFFFF">
<path d="M276 560 L196 500 Q192 590 262 634 Z"/>
<ellipse cx="500" cy="296" rx="22" ry="56" transform="rotate(-22 500 296)"/>
<ellipse cx="550" cy="292" rx="20" ry="48" transform="rotate(18 550 292)"/>
<path fill-rule="evenodd" d="M240 560 a250 250 0 1 0 500 0 a250 250 0 1 0 -500 0 Z M518 500 a38 38 0 1 0 76 0 a38 38 0 1 0 -76 0 Z M618 496 a34 34 0 1 0 68 0 a34 34 0 1 0 -68 0 Z"/>
<path d="M716 520 Q822 554 716 594 Z"/>
</g>"""


# Pip's artwork spans roughly x 196–822, y 236–840; centre it on (512, 512) and scale.
def place(inner, scale, dx=12, dy=-23):
    s = scale
    tx = 512 - s * (512 - dx)
    ty = 512 - s * (512 - dy)
    return f'<g transform="translate({tx:.1f} {ty:.1f}) scale({s})">{inner}</g>'


def svg(inner, bg=None):
    b = f'<rect width="1024" height="1024" fill="{bg}"/>' if bg else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">{b}{inner}</svg>'


ASSETS = {
    # Full-bleed square for iOS and pre-adaptive Android; the OS masks the corners.
    "icon": svg(place(pip(CORAL, CORAL_SHADE, PINK, 0.55, ground=PAPER_LINE), 0.9), bg=PAPER),
    # Adaptive foreground: transparent, inside the centre safe zone (~61% circle).
    "adaptive-icon": svg(place(pip(CORAL, CORAL_SHADE, PINK, 0.55), 0.66)),
    "adaptive-icon-mono": svg(place(mono(), 0.66)),
    # Native splash: white waving Pip on coral, coral on zinc in dark mode. Scaled 0.9 about the
    # centre with no offset, so it lines up exactly with <Pip size={imageWidth * 0.9}> centred in
    # src/components/brand/animated-splash.tsx, which takes over from it.
    "splash-icon": svg(place(pip("#FFFFFF", PINK, CORAL, 0.3, wave=True), 0.9, dx=0, dy=0)),
    "splash-icon-dark": svg(place(pip(CORAL, CORAL_SHADE, PINK, 0.55, wave=True), 0.9, dx=0, dy=0)),
}


def main(root):
    brand = os.path.join(root, "assets", "brand")
    images = os.path.join(root, "assets", "images")
    os.makedirs(brand, exist_ok=True)
    for name, doc in ASSETS.items():
        with open(os.path.join(brand, f"pip-{name}.svg"), "w") as f:
            f.write(doc + "\n")
        cairosvg.svg2png(bytestring=doc.encode(), write_to=os.path.join(images, f"{name}.png"),
                         output_width=1024, output_height=1024)
    cairosvg.svg2png(bytestring=ASSETS["icon"].encode(), write_to=os.path.join(images, "favicon.png"),
                     output_width=48, output_height=48)


if __name__ == "__main__":
    main(sys.argv[1])
