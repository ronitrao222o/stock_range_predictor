export function generatePineScript(levels, closePrice) {
  const {
    one_sdh, one_sdl,
    two_sdh, two_sdl,
    three_sdh, three_sdl,
  } = levels;

  const H50 = ((one_sdh + closePrice) / 2).toFixed(2);
  const L50 = ((closePrice + one_sdl) / 2).toFixed(2);

  const H150 = ((two_sdh + one_sdh) / 2).toFixed(2);
  const L150 = ((two_sdl + one_sdl) / 2).toFixed(2);

  const H250 = ((three_sdh + two_sdh) / 2).toFixed(2);
  const L250 = ((three_sdl + two_sdl) / 2).toFixed(2);

  const f = (v) => parseFloat(v).toFixed(2);

  return `//@version=5
indicator("Auto Trading Range Levels", overlay=true)

H100 = ${f(one_sdh)}
H50 = ${H50}
Center = ${f(closePrice)}
L50 = ${L50}
L100 = ${f(one_sdl)}

H200 = ${f(two_sdh)}
H150 = ${H150}
L150 = ${L150}
L200 = ${f(two_sdl)}

H300 = ${f(three_sdh)}
H250 = ${H250}
L250 = ${L250}
L300 = ${f(three_sdl)}

// Range 1 lines
hline(H100, "Range 1 H100", color=color.red, linestyle = hline.style_solid, linewidth = 2)
hline(H50, "Range 1 H50", color=color.red, linestyle=hline.style_dashed, linewidth = 1)
hline(Center, "Range 1 Center (Close)", color=color.blue, linestyle=hline.style_solid, linewidth = 2)
hline(L50, "Range 1 L50", color=color.green, linestyle=hline.style_dashed, linewidth = 1)
hline(L100, "Range 1 L100", color=color.green, linestyle = hline.style_solid, linewidth = 2)

// Range 2 lines
hline(H200, "Range 2 H200", color=color.red,linestyle = hline.style_solid, linewidth = 2)
hline(H150, "Range 2 H150", color=color.red, linestyle=hline.style_dashed, linewidth = 1)
hline(L150, "Range 2 L150", color=color.green, linestyle=hline.style_dashed, linewidth = 1)
hline(L200, "Range 2 L200", color=color.green, linestyle = hline.style_solid, linewidth = 2)

// Range 3 lines
hline(H300, "Range 3 H300", color=color.red, linestyle = hline.style_solid, linewidth = 2)
hline(H250, "Range 3 H250", color=color.red, linestyle=hline.style_dashed, linewidth = 1)
hline(L250, "Range 3 L250", color=color.green, linestyle=hline.style_dashed, linewidth = 1)
hline(L300, "Range 3 L300", color=color.green,linestyle = hline.style_solid, linewidth = 2)
`;
}
