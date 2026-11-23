# Third-party notices

What in this package comes from someone else and carries a notice that must be kept.
`PROVENANCE.md` has the full list of inputs and the reasoning. This is a build agent's
reading of the licence texts, not legal advice.

## 1. three.js, inside `viewer.html` and `customizer.html`

`viewer.html` contains three.js 0.186.1 (core, GLTFLoader, OrbitControls,
BufferGeometryUtils, SkeletonUtils). `customizer.html` contains the same three.js files, and
so do the children's `kidiewer.html` and `girliewer.html`, the same page. Nothing else in
the package contains it: not the character files, not the girl's `hairspring.js` and
`examples	hree\hair_live.js` (the project's own code, which uses the three.js a game
loads), and not a game that uses them.

If you pass any of these pages on, leave this notice inside it. Each page carries it in its
head. This is the licence file of three.js 0.186.1, exactly as shipped:

```
The MIT License

Copyright © 2010-2026 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

## 2. The font behind the numbers and names

The digits and letters on the kit are drawn from the font Graduate Regular. The font
file itself is not in the package. Its shapes are, in two forms.

**Painted into the kit textures** (`textures/default/kit_basecolor.png`,
`kit_basecolor_away.png`, `kit_mask.png`, the grown-up's and each child's): the name and the
numbers. By the font
licence's own FAQ this artwork is not subject to the font's licence. Nothing is required.

**As glyph atlases** (`textures/glyphs/digits_atlas.png`,
`textures/glyphs/letters_atlas.png`, with `glyphs.json`): for a game that draws numbers
and names at run time. Whether an atlas counts as a modified copy of the font is not
settled by the licence or its FAQ. The package treats it as one. So:

- The atlas files are under the SIL Open Font License, Version 1.1. They are not under
  the game's own licence and must not be sold by themselves.
- `OFL.txt` is the font's licence and copyright notice, unchanged. It is at the top of
  the package and again beside the atlases in `textures/glyphs/`, the grown-up's and each
  child's (`kid	extures\glyphs\`, `girl	extures\glyphs\`). It must stay with them.
- If the atlases go into a game, show the text of `OFL.txt` in the game's licences or
  credits. An engine's import strips notices out of image files.
- Do not name an atlas file, its material, a data key or a menu entry after the font.
  The licence reserves the font's name. Documentation, like this file, may say where the
  shapes came from.

The font's copyright line, as `OFL.txt` gives it:

```
Copyright 2012 The Graduate Project Authors (https://github.com/etunni/graduate) with Reserved Font Name "Graduate"
```

The font's trademark sentence, which is not in `OFL.txt` and must be kept in the notice
beside it:

```
Graduate is a trademark of Eduardo Tunni.
```

**As copies inside `customizer_data.js`**: the customizer page carries the two atlases as
base64 text, to draw numbers and names in the browser. They are the same atlases under the same
licence. Keep `OFL.txt` beside the page (it is at the top of the package) and do not pass
`customizer_data.js` on without it. The page's About box names the licence and the file.

A game that does not ship the atlases needs none of this for the painted numbers.

## 3. Quotations in `PROVENANCE.md`

`PROVENANCE.md` quotes the font licence's FAQ. Its credit line must stay with those
quotations:

```
OFL FAQ quotations are from the OFL FAQ (OFL-FAQ.txt), copyright (c) 2005-2023 SIL
International. Used by permission. https://openfontlicense.org/OFL-FAQ
```

## 4. Inputs that need no notice

Listed so that nobody has to wonder.

- **The body, face, skeleton, skin weights, skin, eyes, teeth, tongue, brows and
  lashes** descend from MPFB2's bundled data and the MakeHuman system asset pack, both
  declared CC0. By their publishers' own statements no fee, credit, notice or source is
  required, and closed-source commercial use is allowed. CC0 gives no warranty of title.
- **The children's bodies** (`kid\`, `girl\`: body, face, skeleton, skin weights, skin,
  eyes, teeth, tongue, brows and lashes) descend from the same two CC0 sources, and **the
  girl's ponytail** is MakeHuman's `ponytail01` from the system pack (its mesh, reshaped and
  weighted, as `geo_hair`; its picture, scaled and toned, as
  `girl	extures\default\hairstyle_basecolor.png`), CC0 in its own file headers. No notice is
  required. The children's brows are the pack's `eyebrow010`, whose picture names an author
  other than the pack's copyright holders: `PROVENANCE.md`, section 3, item 5.
- **Blender, MPFB's program code, Godot and the Python tools** were used to build the
  package. None of them is in it. Their licences place nothing on the game.
- **The Godot example project** in `examples/godot/` holds project and import files.
  The Godot engine is not in the package.
- **The videos in `previews/`** are the project's own renders. Their captions are drawn
  with the default font of the Pillow library (Aileron; its publisher states CC0, but no
  copy of that statement was saved: see `PROVENANCE.md`). No font file is in the package.

## 5. Checked on the finished package, 14 October 2026

- `viewer.html` carries the complete three.js licence text in its head, and the bundle is
  three 0.186.1. So does `customizer.html` (checked when it was added, the same day).
- `textures/glyphs/OFL.txt` is the same file as `OFL.txt`
  (SHA-256 `2643f19f015fe49e170727d070b7ee501d3f38e0810208a0567aff7b656a1875`, 4,513 bytes).
- Outside `OFL.txt`, `PROVENANCE.md` and this file, no file name and no text in any model,
  data or example file of the package contains the font's name. Checked again in
  `customizer.html` and `customizer_data.js` when they were added.

## 6. Checked on the finished package, 30 October 2026

- `kidiewer.html` and `girliewer.html` carry the complete three.js licence text in their
  head, as `viewer.html` and `customizer.html` do.
- `kid	extures\glyphs\OFL.txt` and `girl	extures\glyphs\OFL.txt` are the same file as
  `OFL.txt` (the SHA-256 above).
- Outside the four copies of `OFL.txt`, `PROVENANCE.md` and this file, no file of the package,
  the children's folders included, contains the font's name.
- `girl\hairspring.js` and `girl\examples	hree\hair_live.js` contain no three.js code:
  `hair_live.js` imports `hairspring.js` alone.
