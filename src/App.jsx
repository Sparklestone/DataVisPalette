import { useState, useCallback, useEffect, useRef } from "react";

/* ── Pantone DB ── */
const PDB = [
  { name: "109 C", hex: "#FFD100", c: 0, m: 16, y: 100, k: 0 },
  { name: "116 C", hex: "#FFCD00", c: 0, m: 16, y: 100, k: 0 },
  { name: "123 C", hex: "#FFC72C", c: 0, m: 19, y: 89, k: 0 },
  { name: "130 C", hex: "#F2A900", c: 0, m: 30, y: 100, k: 0 },
  { name: "137 C", hex: "#FFA300", c: 0, m: 34, y: 100, k: 0 },
  { name: "144 C", hex: "#ED8B00", c: 0, m: 43, y: 100, k: 0 },
  { name: "151 C", hex: "#FF8200", c: 0, m: 48, y: 100, k: 0 },
  { name: "165 C", hex: "#FF6900", c: 0, m: 58, y: 100, k: 0 },
  { name: "172 C", hex: "#FA4616", c: 0, m: 70, y: 100, k: 0 },
  { name: "179 C", hex: "#E03C31", c: 0, m: 78, y: 78, k: 4 },
  { name: "185 C", hex: "#E4002B", c: 0, m: 100, y: 75, k: 0 },
  { name: "186 C", hex: "#C8102E", c: 0, m: 100, y: 81, k: 4 },
  { name: "187 C", hex: "#A6192E", c: 0, m: 90, y: 65, k: 23 },
  { name: "199 C", hex: "#D50032", c: 0, m: 100, y: 70, k: 0 },
  { name: "212 C", hex: "#F04E98", c: 0, m: 76, y: 16, k: 0 },
  { name: "254 C", hex: "#9B26B6", c: 36, m: 88, y: 0, k: 0 },
  { name: "265 C", hex: "#7C50A3", c: 40, m: 70, y: 0, k: 0 },
  { name: "270 C", hex: "#8B84D7", c: 42, m: 40, y: 0, k: 0 },
  { name: "279 C", hex: "#418FDE", c: 68, m: 34, y: 0, k: 0 },
  { name: "285 C", hex: "#0077C8", c: 90, m: 48, y: 0, k: 0 },
  { name: "286 C", hex: "#0033A0", c: 100, m: 66, y: 0, k: 2 },
  { name: "292 C", hex: "#69B3E7", c: 52, m: 14, y: 0, k: 0 },
  { name: "299 C", hex: "#00A3E0", c: 82, m: 17, y: 0, k: 0 },
  { name: "300 C", hex: "#005EB8", c: 100, m: 44, y: 0, k: 0 },
  { name: "312 C", hex: "#0097A9", c: 100, m: 0, y: 22, k: 0 },
  { name: "320 C", hex: "#009CA6", c: 100, m: 0, y: 30, k: 2 },
  { name: "326 C", hex: "#00B2A9", c: 78, m: 0, y: 28, k: 0 },
  { name: "339 C", hex: "#00AF66", c: 82, m: 0, y: 56, k: 0 },
  { name: "347 C", hex: "#009639", c: 100, m: 0, y: 82, k: 0 },
  { name: "361 C", hex: "#43B02A", c: 62, m: 0, y: 90, k: 0 },
  { name: "368 C", hex: "#69BE28", c: 52, m: 0, y: 95, k: 0 },
  { name: "375 C", hex: "#97D700", c: 32, m: 0, y: 100, k: 0 },
  { name: "485 C", hex: "#DA291C", c: 0, m: 83, y: 87, k: 0 },
  { name: "Process Blue C", hex: "#0085CA", c: 100, m: 10, y: 0, k: 10 },
  { name: "Green C", hex: "#00AB84", c: 80, m: 0, y: 45, k: 0 },
  { name: "CG7 C", hex: "#9B9DA0", c: 17, m: 11, y: 11, k: 28 },
  { name: "CG9 C", hex: "#76787B", c: 22, m: 16, y: 15, k: 44 },
  { name: "431 C", hex: "#5B6770", c: 30, m: 18, y: 14, k: 45 },
  { name: "7545 C", hex: "#425563", c: 38, m: 20, y: 14, k: 50 },
  { name: "2174 C", hex: "#1A6AFF", c: 75, m: 50, y: 0, k: 0 },
];

/* ── Color math ── */
function h2r(hex) {
  var x = hex.replace("#", "");
  return { r: parseInt(x.slice(0, 2), 16), g: parseInt(x.slice(2, 4), 16), b: parseInt(x.slice(4, 6), 16) };
}
function r2h(r, g, b) {
  function cl(v) { return Math.max(0, Math.min(255, Math.round(v))); }
  return "#" + [r, g, b].map(function (v) { return cl(v).toString(16).padStart(2, "0"); }).join("");
}
function getLum(r, g, b) {
  function f(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function CR(a, b) {
  var c1 = h2r(a), c2 = h2r(b);
  var l1 = getLum(c1.r, c1.g, c1.b), l2 = getLum(c2.r, c2.g, c2.b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
function r2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  var mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  var h = 0, s = 0, l = (mx + mn) / 2;
  if (mx !== mn) {
    var d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (mx === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}
function hsl2r(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) { var v = Math.round(l * 255); return { r: v, g: v, b: v }; }
  var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  function f(pp, qq, t) {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return pp + (qq - pp) * 6 * t;
    if (t < 1 / 2) return qq;
    if (t < 2 / 3) return pp + (qq - pp) * (2 / 3 - t) * 6;
    return pp;
  }
  return { r: Math.round(f(p, q, h + 1 / 3) * 255), g: Math.round(f(p, q, h) * 255), b: Math.round(f(p, q, h - 1 / 3) * 255) };
}
function hex2hsl(hex) { var c = h2r(hex); return r2hsl(c.r, c.g, c.b); }
function hsl2hex(h, s, l) { var c = hsl2r(h, s, l); return r2h(c.r, c.g, c.b); }
function r2cmyk(r, g, b) {
  if (r === 0 && g === 0 && b === 0) return { c: 0, m: 0, y: 0, k: 100 };
  var cc = 1 - r / 255, mm = 1 - g / 255, yy = 1 - b / 255, k = Math.min(cc, mm, yy);
  return { c: Math.round((cc - k) / (1 - k) * 100), m: Math.round((mm - k) / (1 - k) * 100), y: Math.round((yy - k) / (1 - k) * 100), k: Math.round(k * 100) };
}
function findPMS(hex) {
  var best = null, bd = Infinity;
  for (var i = 0; i < PDB.length; i++) {
    var c1 = h2r(hex), c2 = h2r(PDB[i].hex);
    var d = Math.sqrt(Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2));
    if (d < bd) { bd = d; best = PDB[i]; }
  }
  return best;
}
function hueDist(a, b) { var d = Math.abs(a - b); return d > 180 ? 360 - d : d; }

function adjustForContrast(hex, bgHex, target) {
  var hsl = hex2hsl(hex);
  var bgC = h2r(bgHex);
  var isDk = getLum(bgC.r, bgC.g, bgC.b) < 0.15;
  for (var i = 0; i < 60; i++) {
    var test = hsl2hex(hsl.h, hsl.s, hsl.l);
    if (CR(test, bgHex) >= target) return test;
    hsl.l += isDk ? 1.5 : -1.5;
    hsl.l = Math.max(5, Math.min(95, hsl.l));
  }
  return hsl2hex(hsl.h, hsl.s, hsl.l);
}

function makePair(hue, sat, seed, darkBg) {
  var s = Math.min(90, Math.max(35, sat + (seed * 5 - 5)));
  var lightHex = adjustForContrast(hsl2hex(hue, s, 50), "#ffffff", 4.5);
  var darkHex = adjustForContrast(hsl2hex(hue, s, 50), darkBg || "#121212", 4.5);
  return { lightHex: lightHex, darkHex: darkHex, hue: hue, sat: s };
}

/* ── 3 distinct base hue sets per option ── */
var OPT_HUES = [
  /* Opt 1: Classic – blue/teal/orange anchored */
  [
    { hue: 215, sat: 75, label: "Blue" }, { hue: 180, sat: 70, label: "Teal" },
    { hue: 30, sat: 80, label: "Orange" }, { hue: 0, sat: 70, label: "Red" },
    { hue: 280, sat: 60, label: "Purple" }, { hue: 145, sat: 65, label: "Green" },
    { hue: 50, sat: 75, label: "Gold" }, { hue: 320, sat: 55, label: "Magenta" },
    { hue: 245, sat: 55, label: "Indigo" },
  ],
  /* Opt 2: Warm shift – coral/amber/emerald anchored */
  [
    { hue: 10, sat: 72, label: "Coral" }, { hue: 160, sat: 60, label: "Seafoam" },
    { hue: 42, sat: 82, label: "Amber" }, { hue: 340, sat: 65, label: "Rose" },
    { hue: 260, sat: 55, label: "Violet" }, { hue: 120, sat: 55, label: "Emerald" },
    { hue: 70, sat: 70, label: "Lime" }, { hue: 195, sat: 65, label: "Cyan" },
    { hue: 300, sat: 50, label: "Orchid" },
  ],
  /* Opt 3: Cool shift – navy/sage/terracotta anchored */
  [
    { hue: 230, sat: 65, label: "Navy" }, { hue: 165, sat: 50, label: "Sage" },
    { hue: 20, sat: 70, label: "Terracotta" }, { hue: 350, sat: 60, label: "Crimson" },
    { hue: 290, sat: 50, label: "Plum" }, { hue: 100, sat: 55, label: "Moss" },
    { hue: 55, sat: 65, label: "Mustard" }, { hue: 200, sat: 60, label: "Steel" },
    { hue: 270, sat: 45, label: "Lavender" },
  ],
];
var SEM_BASES = [
  { hue: 140, sat: 65, label: "Success" }, { hue: 38, sat: 85, label: "Warning" }, { hue: 0, sat: 72, label: "Error" },
];
var DEEM_OPT = [
  [{ hue: 215, sat: 10, lL: 72, dL: 55, label: "Light" }, { hue: 215, sat: 8, lL: 55, dL: 65, label: "Mid" }, { hue: 215, sat: 6, lL: 36, dL: 75, label: "Dark" }],
  [{ hue: 25, sat: 8, lL: 74, dL: 56, label: "Light" }, { hue: 25, sat: 6, lL: 56, dL: 66, label: "Mid" }, { hue: 25, sat: 5, lL: 38, dL: 74, label: "Dark" }],
  [{ hue: 200, sat: 7, lL: 70, dL: 58, label: "Light" }, { hue: 200, sat: 5, lL: 52, dL: 68, label: "Mid" }, { hue: 200, sat: 4, lL: 34, dL: 76, label: "Dark" }],
];

function generatePalettes(brandColors, optIdx, darkBg) {
  var baseHues = OPT_HUES[optIdx] || OPT_HUES[0];
  var cat = baseHues.map(function (base, i) {
    var hue = base.hue;
    var sat = base.sat;
    var swapped = null;
    for (var j = 0; j < brandColors.length; j++) {
      var bh = hex2hsl(brandColors[j].hex);
      if (bh.s > 15 && hueDist(hue, bh.h) < 35) {
        hue = bh.h; sat = bh.s; swapped = brandColors[j].name; break;
      }
    }
    var pair = makePair(hue, sat, optIdx, darkBg);
    return { id: i, hue: hue, sat: pair.sat, lightHex: pair.lightHex, darkHex: pair.darkHex, label: swapped ? "~" + swapped : base.label, swapped: swapped };
  });
  var sem = SEM_BASES.map(function (base, i) {
    var pair = makePair(base.hue, base.sat, optIdx, darkBg);
    return { id: i, hue: base.hue, sat: pair.sat, lightHex: pair.lightHex, darkHex: pair.darkHex, label: base.label };
  });
  var deemBases = DEEM_OPT[optIdx] || DEEM_OPT[0];
  var deem = deemBases.map(function (base, i) {
    var rawLight = hsl2hex(base.hue, base.sat, base.lL);
    var rawDark = hsl2hex(base.hue, base.sat, base.dL);
    var lightHex = adjustForContrast(rawLight, "#ffffff", 4.5);
    var darkHex = adjustForContrast(rawDark, darkBg || "#121212", 4.5);
    return { id: i, hue: base.hue, sat: base.sat, lightHex: lightHex, darkHex: darkHex, label: base.label };
  });
  var spectrum = cat.slice().sort(function (a, b) { return a.hue - b.hue; });
  return { categorical: cat, semantic: sem, deemphasis: deem, spectrum: spectrum };
}

/* ── Storage (localStorage for deployed app) ── */
async function sGet(k) {
  try {
    var raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
async function sSet(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* */ }
}

/* ── Download ── */
function dlPalette(pal, name, dark, brandColors, darkBg) {
  var bg = dark ? darkBg : "#ffffff";
  var mode = dark ? "Dark" : "Light";
  var rows = [["Name", "PMS", "Hex", "R", "G", "B", "C", "M", "Y", "K", "Contrast", "Type"].join("\t")];
  if (brandColors.length) {
    rows.push("", "=== BRAND ===");
    brandColors.forEach(function (c) { var rgb = h2r(c.hex); var cmyk = r2cmyk(rgb.r, rgb.g, rgb.b); rows.push([c.name, c.pms || "", c.hex.toUpperCase(), rgb.r, rgb.g, rgb.b, cmyk.c, cmyk.m, cmyk.y, cmyk.k, CR(c.hex, bg).toFixed(2), "Brand"].join("\t")); });
  }
  ["categorical", "spectrum", "semantic", "deemphasis"].forEach(function (t) {
    rows.push("", "=== " + t.toUpperCase() + " (" + mode + ") ===");
    (pal[t] || []).forEach(function (s) {
      var hex = dark ? s.darkHex : s.lightHex;
      var rgb = h2r(hex); var p = findPMS(hex); var cmyk = p || r2cmyk(rgb.r, rgb.g, rgb.b);
      rows.push([s.label, p ? p.name : "", hex.toUpperCase(), rgb.r, rgb.g, rgb.b, cmyk.c, cmyk.m, cmyk.y, cmyk.k, CR(hex, bg).toFixed(2), t].join("\t"));
    });
  });
  var blob = new Blob(["\ufeff" + rows.join("\n")], { type: "application/vnd.ms-excel" });
  var url = URL.createObjectURL(blob); var a = document.createElement("a");
  a.href = url; a.download = (name || "generic") + "_" + mode + ".xls"; a.click(); URL.revokeObjectURL(url);
}

/* ── CHARTS ── */
function BarChart(props) {
  var slots = props.slots; var dark = props.dark; var stroke = props.stroke; var darkBg = props.darkBg;
  var useLight = props.useLight;
  var bg = dark ? darkBg : "#ffffff";
  var data = [82, 54, 71, 38, 63, 47, 29, 55, 45];
  var mx = 82;
  return (
    <div style={{ borderRadius: 8, padding: 10, backgroundColor: bg, border: "1px solid " + (dark ? "rgba(255,255,255,0.08)" : "#eee") }}>
      <span style={{ fontSize: 11, fontFamily: "'Space Mono',monospace", color: dark ? "rgba(255,255,255,0.3)" : "#bbb", display: "block", marginBottom: 4 }}>
        Bar · {dark ? "dark bg" : "light bg"}
      </span>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 50 }}>
        {data.slice(0, slots.length).map(function (v, i) {
          var hex = useLight ? slots[i].lightHex : slots[i].darkHex;
          return (
            <div key={i} style={{ flex: 1, height: (v / mx * 100) + "%", backgroundColor: hex, borderRadius: "2px 2px 0 0", border: "1px solid " + stroke, boxSizing: "border-box" }} />
          );
        })}
      </div>
    </div>
  );
}

function DonutChart(props) {
  var slots = props.slots; var dark = props.dark; var stroke = props.stroke; var darkBg = props.darkBg;
  var useLight = props.useLight;
  var bg = dark ? darkBg : "#ffffff";
  var data = [30, 22, 18, 12, 10, 8, 5, 4, 3];
  var total = 112; var cum = 0;
  var R = 38, cx = 48, cy = 48, ir = 20;
  var paths = data.slice(0, slots.length).map(function (val, i) {
    var angle = (val / total) * 2 * Math.PI;
    var start = cum; cum += angle;
    var x1 = cx + R * Math.cos(start), y1 = cy + R * Math.sin(start);
    var x2 = cx + R * Math.cos(cum), y2 = cy + R * Math.sin(cum);
    var la = angle > Math.PI ? 1 : 0;
    var x3 = cx + ir * Math.cos(cum), y3 = cy + ir * Math.sin(cum);
    var x4 = cx + ir * Math.cos(start), y4 = cy + ir * Math.sin(start);
    var hex = useLight ? slots[i].lightHex : slots[i].darkHex;
    var d = "M" + x1 + " " + y1 + "A" + R + " " + R + " 0 " + la + " 1 " + x2 + " " + y2 + "L" + x3 + " " + y3 + "A" + ir + " " + ir + " 0 " + la + " 0 " + x4 + " " + y4 + "Z";
    return (
      <path key={i} d={d} fill={hex} stroke={stroke} strokeWidth="1" />
    );
  });
  return (
    <div style={{ borderRadius: 8, padding: 10, backgroundColor: bg, border: "1px solid " + (dark ? "rgba(255,255,255,0.08)" : "#eee"), display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span style={{ fontSize: 11, fontFamily: "'Space Mono',monospace", color: dark ? "rgba(255,255,255,0.3)" : "#bbb", display: "block", marginBottom: 4, alignSelf: "flex-start" }}>
        Donut · {dark ? "dark bg" : "light bg"}
      </span>
      <svg viewBox="0 0 96 96" width="80" height="80">{paths}</svg>
    </div>
  );
}

function LineChart(props) {
  var slots = props.slots; var dark = props.dark; var darkBg = props.darkBg;
  var useLight = props.useLight;
  var bg = dark ? darkBg : "#ffffff";
  var W = 200, H = 60, pad = 4;
  var lines = slots.slice(0, 6).map(function (s, si) {
    var pts = [];
    for (var i = 0; i < 8; i++) {
      var x = pad + (i / 7) * (W - pad * 2);
      var y = pad + 10 + Math.sin(i * 0.8 + si * 1.2) * 18 + si * 4;
      pts.push(x + "," + y);
    }
    var hex = useLight ? s.lightHex : s.darkHex;
    return (
      <polyline key={si} points={pts.join(" ")} fill="none" stroke={hex} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    );
  });
  return (
    <div style={{ borderRadius: 8, padding: 10, backgroundColor: bg, border: "1px solid " + (dark ? "rgba(255,255,255,0.08)" : "#eee") }}>
      <span style={{ fontSize: 11, fontFamily: "'Space Mono',monospace", color: dark ? "rgba(255,255,255,0.3)" : "#bbb", display: "block", marginBottom: 4 }}>
        Line · {dark ? "dark bg" : "light bg"}
      </span>
      <svg viewBox={"0 0 " + W + " " + H} width="100%" height={H}>{lines}</svg>
    </div>
  );
}

/* ── Swatch ── */
function Swatch(props) {
  var hex = props.hex; var stroke = props.stroke; var isDark = props.isDark; var darkBg = props.darkBg;
  var onHue = props.onHue; var onLight = props.onLight; var onSelect = props.onSelect; var label = props.label;
  var rgb = h2r(hex); var l = getLum(rgb.r, rgb.g, rgb.b);
  var p = findPMS(hex); var cmyk = r2cmyk(rgb.r, rgb.g, rgb.b);
  var bg = isDark ? darkBg : "#ffffff";
  var ratio = CR(hex, bg).toFixed(1);
  var n = parseFloat(ratio);
  var rCol = n >= 4.5 ? "#1a7a3d" : "#c42b2b";
  var cardBg = isDark ? "rgba(255,255,255,0.05)" : "#fff";
  var txtCol = isDark ? "#ccc" : "#111";
  var subCol = isDark ? "#666" : "#999";
  var hov = useState(false);

  return (
    <div
      style={{ position: "relative", width: 96, borderRadius: 8, overflow: "hidden", backgroundColor: cardBg, border: "1px solid " + (isDark ? "rgba(255,255,255,0.08)" : "#eee"), flexShrink: 0, transform: hov[0] ? "scale(1.04)" : "scale(1)", transition: "transform 0.15s" }}
      onMouseEnter={function () { hov[1](true); }}
      onMouseLeave={function () { hov[1](false); }}
    >
      <div style={{ height: 52, backgroundColor: hex, position: "relative", cursor: "pointer", border: "2px solid " + stroke, borderRadius: "6px 6px 0 0", boxSizing: "border-box" }}
        onClick={function () { if (onSelect) onSelect({ hex: hex, label: label }); }}>
        {onHue && (
          <button onClick={function (e) { e.stopPropagation(); onHue(); }}
            style={{ position: "absolute", top: 3, left: 3, width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.5)", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: hov[0] ? 1 : 0, transition: "opacity 0.15s", padding: 0 }}
            title="Shift hue">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="8" cy="8" r="5" /><path d="M8 3v-2M13 8h2M8 13v2M3 8h-2" strokeWidth="1.5" /></svg>
          </button>
        )}
        {onLight && (
          <button onClick={function (e) { e.stopPropagation(); onLight(); }}
            style={{ position: "absolute", top: 3, right: 3, width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.5)", color: "#fff", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: hov[0] ? 1 : 0, transition: "opacity 0.15s", padding: 0 }}
            title="Cycle tone">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1v5h5" /><path d="M15 15v-5h-5" /><path d="M2.3 10a6 6 0 0 0 10.3 1.5L15 10M1 6l2.4-1.5A6 6 0 0 1 13.7 6" /></svg>
          </button>
        )}
      </div>
      <div style={{ padding: "4px 6px 5px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: txtCol, fontFamily: "'Space Mono',monospace" }}>{hex.toUpperCase()}</div>
        <div style={{ fontSize: 11, color: subCol, fontFamily: "'Space Mono',monospace" }}>PMS {p ? p.name : "-"}</div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: subCol, fontFamily: "'Space Mono',monospace" }}>{p ? p.c + "/" + p.m + "/" + p.y + "/" + p.k : cmyk.c + "/" + cmyk.m + "/" + cmyk.y + "/" + cmyk.k}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: rCol, fontFamily: "'Space Mono',monospace" }}>{ratio}:1</span>
        </div>
      </div>
    </div>
  );
}

/* ── Option Panel (L or D) — shows ALL palettes on one page ── */
function OptionPanel(props) {
  var pal = props.pal; var isDark = props.isDark; var stroke = props.stroke; var darkBg = props.darkBg;
  var activeTab = props.activeTab; var onHue = props.onHue; var onLight = props.onLight; var onSelect = props.onSelect;
  var mode = isDark ? "D" : "L";
  var mainSlots = pal[activeTab] || [];
  var semSlots = pal.semantic || [];
  var deemSlots = pal.deemphasis || [];

  function SectionLabel(lp) {
    return (
      <div style={{ marginBottom: 4, marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: "0.08em", color: isDark ? "#999" : "#555" }}>
          {lp.text}
        </span>
        {lp.sub && <span style={{ fontSize: 12, color: isDark ? "#555" : "#bbb", fontFamily: "'Space Mono',monospace" }}>{lp.sub}</span>}
      </div>
    );
  }

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: stroke, border: "1px solid " + (isDark ? "rgba(255,255,255,0.15)" : "#ddd") }} />
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 21, letterSpacing: "0.08em", color: isDark ? "#ccc" : "#222" }}>
          {mode} · {stroke === "#ffffff" ? "White" : "Dark"} Stroke
        </span>
        <span style={{ fontSize: 12, color: isDark ? "#555" : "#bbb", fontFamily: "'Space Mono',monospace" }}>
          WCAG AA 4.5:1 vs {isDark ? darkBg : "#FFF"}
        </span>
      </div>

      {/* Main palette (categorical or spectrum) */}
      <SectionLabel text={activeTab === "spectrum" ? "Spectrum" : "Categorical"} sub={activeTab === "spectrum" ? "sorted by hue" : "max neighbor contrast"} />
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
        {mainSlots.map(function (s, i) {
          var hex = isDark ? s.darkHex : s.lightHex;
          return (
            <Swatch key={s.id + "-" + s.hue + "-" + mode} hex={hex} stroke={stroke} isDark={isDark} darkBg={darkBg}
              onHue={onHue ? function () { onHue("categorical", s.id); } : null}
              onLight={onLight ? function () { onLight("categorical", s.id); } : null}
              onSelect={onSelect} label={s.label} />
          );
        })}
      </div>

      {/* Spectrum ramp (if on spectrum tab) */}
      {activeTab === "spectrum" && (
        <div style={{ borderRadius: 6, padding: 8, backgroundColor: isDark ? darkBg : "#fff", border: "1px solid " + (isDark ? "rgba(255,255,255,0.08)" : "#eee"), marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontFamily: "'Space Mono',monospace", color: isDark ? "rgba(255,255,255,0.25)" : "#ccc", display: "block", marginBottom: 3 }}>Rainbow ramp</span>
          <div style={{ display: "flex", height: 24, borderRadius: 4, overflow: "hidden" }}>
            {mainSlots.map(function (s, i) {
              return <div key={i} style={{ flex: 1, backgroundColor: isDark ? s.darkHex : s.lightHex }} />;
            })}
          </div>
        </div>
      )}

      {/* Charts: light bg row then dark bg row — always use this panel's color mode */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, marginBottom: 5 }}>
        <BarChart slots={mainSlots} dark={false} stroke={stroke} darkBg={darkBg} useLight={!isDark} />
        <DonutChart slots={mainSlots} dark={false} stroke={stroke} darkBg={darkBg} useLight={!isDark} />
        <LineChart slots={mainSlots} dark={false} darkBg={darkBg} useLight={!isDark} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5, marginBottom: 6 }}>
        <BarChart slots={mainSlots} dark={true} stroke={stroke} darkBg={darkBg} useLight={!isDark} />
        <DonutChart slots={mainSlots} dark={true} stroke={stroke} darkBg={darkBg} useLight={!isDark} />
        <LineChart slots={mainSlots} dark={true} darkBg={darkBg} useLight={!isDark} />
      </div>

      {/* Semantic */}
      <SectionLabel text="Semantic" sub="success / warning / error" />
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 6 }}>
        {semSlots.map(function (s, i) {
          var hex = isDark ? s.darkHex : s.lightHex;
          return (
            <Swatch key={"sem-" + s.id + "-" + s.hue + "-" + mode} hex={hex} stroke={stroke} isDark={isDark} darkBg={darkBg}
              onHue={onHue ? function () { onHue("semantic", s.id); } : null}
              onLight={onLight ? function () { onLight("semantic", s.id); } : null}
              onSelect={onSelect} label={s.label} />
          );
        })}
      </div>
      {/* Semantic preview on both backgrounds */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 6 }}>
        {[false, true].map(function (dk) {
          var bg = dk ? darkBg : "#ffffff";
          return (
            <div key={dk ? "sd" : "sl"} style={{ borderRadius: 6, padding: 8, backgroundColor: bg, border: "1px solid " + (dk ? "rgba(255,255,255,0.08)" : "#eee") }}>
              {semSlots.map(function (s, i) {
                var hex = isDark ? s.darkHex : s.lightHex;
                var ratio = CR(hex, bg).toFixed(1);
                var nn = parseFloat(ratio);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: hex, border: "1px solid " + stroke, flexShrink: 0 }} />
                    <span style={{ color: hex, fontWeight: 700, fontSize: 14 }}>{s.label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", backgroundColor: nn >= 4.5 ? "#1a7a3d" : "#c42b2b", padding: "1px 3px", borderRadius: 2 }}>{ratio}:1</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Deemphasis */}
      <SectionLabel text="Deemphasis" sub="cool-toned grays" />
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {deemSlots.map(function (s, i) {
          var hex = isDark ? s.darkHex : s.lightHex;
          return (
            <Swatch key={"deem-" + s.id + "-" + s.hue + "-" + mode} hex={hex} stroke={stroke} isDark={isDark} darkBg={darkBg}
              onHue={onHue ? function () { onHue("deemphasis", s.id); } : null}
              onLight={onLight ? function () { onLight("deemphasis", s.id); } : null}
              onSelect={onSelect} label={s.label} />
          );
        })}
      </div>
    </div>
  );
}

/* ── Color Detail ── */
function ColorDetail(props) {
  var info = props.info; var onClose = props.onClose;
  if (!info) return null;
  var rgb = h2r(info.hex); var hsl = r2hsl(rgb.r, rgb.g, rgb.b); var cmyk = r2cmyk(rgb.r, rgb.g, rgb.b);
  var p = findPMS(info.hex);
  var cw = CR(info.hex, "#ffffff").toFixed(2); var cd = CR(info.hex, "#121212").toFixed(2);
  var l = getLum(rgb.r, rgb.g, rgb.b); var fg = l > 0.35 ? "#111" : "#fff";

  function Badge(bp) {
    var nn = parseFloat(bp.v);
    var lv = nn >= 7 ? "AAA" : nn >= 4.5 ? "AA" : nn >= 3 ? "AA Lg" : "Fail";
    var bg = nn >= 4.5 ? "#1a7a3d" : nn >= 3 ? "#9e6c00" : "#c42b2b";
    return (
      <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", backgroundColor: bg, padding: "1px 5px", borderRadius: 3, marginLeft: 4 }}>{lv} {bp.v}</span>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(5px)" }} onClick={onClose}>
      <div style={{ backgroundColor: "#fff", borderRadius: 14, maxWidth: 320, width: "100%", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={function (e) { e.stopPropagation(); }}>
        <div style={{ height: 100, backgroundColor: info.hex, color: fg, display: "flex", alignItems: "flex-end", padding: 12 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 30, letterSpacing: "0.06em" }}>{info.label || "Color"}</div>
        </div>
        <div style={{ padding: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontFamily: "'Space Mono',monospace", fontSize: 15, marginBottom: 8 }}>
            <div><span style={{ color: "#aaa" }}>HEX</span><br /><b>{info.hex.toUpperCase()}</b></div>
            <div><span style={{ color: "#aaa" }}>RGB</span><br /><b>{rgb.r},{rgb.g},{rgb.b}</b></div>
            <div><span style={{ color: "#aaa" }}>HSL</span><br /><b>{Math.round(hsl.h)}° {Math.round(hsl.s)}% {Math.round(hsl.l)}%</b></div>
            <div><span style={{ color: "#aaa" }}>CMYK</span><br /><b>{cmyk.c}/{cmyk.m}/{cmyk.y}/{cmyk.k}</b></div>
          </div>
          {p && (
            <div style={{ borderTop: "1px solid #eee", paddingTop: 6, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: p.hex, border: "1px solid #ddd" }} />
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 14, fontWeight: 700 }}>PMS {p.name}</span>
            </div>
          )}
          <div style={{ borderTop: "1px solid #eee", paddingTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ display: "flex", alignItems: "center" }}><span style={{ fontSize: 14, color: "#888", width: 50, fontFamily: "'Space Mono',monospace" }}>White</span><span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Space Mono',monospace" }}>{cw}</span><Badge v={cw} /></div>
            <div style={{ display: "flex", alignItems: "center" }}><span style={{ fontSize: 14, color: "#888", width: 50, fontFamily: "'Space Mono',monospace" }}>Dark</span><span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Space Mono',monospace" }}>{cd}</span><Badge v={cd} /></div>
          </div>
          <button onClick={onClose} style={{ width: "100%", padding: 7, borderRadius: 6, border: "none", backgroundColor: "#222", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", marginTop: 10 }}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ═══ MAIN ═══ */
export default function App() {
  var _brands = useState({});
  var _actBrand = useState(null);
  var _brandColors = useState([]);
  var _opts = useState([null, null, null]);
  var _actOpt = useState(0);
  var _darkStroke = useState("#032054");
  var _selInfo = useState(null);
  var _showUpload = useState(false);
  var _uploadName = useState("");
  var _toast = useState("");
  var _loaded = useState(false);
  var _activeTab = useState("categorical");
  var _compare = useState(false);
  var _brandDD = useState(false);
  var fileRef = useRef(null);

  var brands = _brands[0], setBrands = _brands[1];
  var activeBrand = _actBrand[0], setActiveBrand = _actBrand[1];
  var brandColors = _brandColors[0], setBrandColors = _brandColors[1];
  var opts = _opts[0], setOpts = _opts[1];
  var activeOpt = _actOpt[0], setActiveOpt = _actOpt[1];
  var darkStroke = _darkStroke[0], setDarkStroke = _darkStroke[1];
  var selInfo = _selInfo[0], setSelInfo = _selInfo[1];
  var showUpload = _showUpload[0], setShowUpload = _showUpload[1];
  var uploadName = _uploadName[0], setUploadName = _uploadName[1];
  var toast = _toast[0], setToast = _toast[1];
  var loaded = _loaded[0], setLoaded = _loaded[1];
  var activeTab = _activeTab[0], setActiveTab = _activeTab[1];
  var compare = _compare[0], setCompare = _compare[1];
  var brandDD = _brandDD[0], setBrandDD = _brandDD[1];

  function show(msg) { setToast(msg); setTimeout(function () { setToast(""); }, 2500); }

  function deleteBrand(key) {
    var nb = Object.assign({}, brands);
    delete nb[key];
    setBrands(nb);
    sSet("dvcs-brands", nb);
    if (activeBrand === key) {
      setActiveBrand(null);
      setBrandColors([]);
      regen([], darkStroke);
    }
    show("Deleted");
  }

  useEffect(function () {
    sGet("dvcs-brands").then(function (b) { if (b) setBrands(b); setLoaded(true); });
  }, []);

  function regen(bc, ds) {
    setOpts([generatePalettes(bc, 0, ds), generatePalettes(bc, 1, ds), generatePalettes(bc, 2, ds)]);
  }

  useEffect(function () {
    if (!loaded) return;
    if (!activeBrand) { regen([], darkStroke); setBrandColors([]); }
  }, [loaded, activeBrand, darkStroke]);

  var loadBrand = useCallback(function (key) {
    setActiveBrand(key);
    var b = brands[key];
    if (!b) return;
    setBrandColors(b.colors);
    regen(b.colors, darkStroke);
  }, [brands, darkStroke]);

  var handleUpload = useCallback(function (file) {
    if (!file || !uploadName.trim()) return;
    file.text().then(function (text) {
      var lines = text.split("\n").map(function (ln) { return ln.split(/[,\t]/); });
      var hdr = (lines[0] || []).map(function (h) { return h.trim().toLowerCase(); });
      var hI = hdr.findIndex(function (h) { return h === "hex" || h.includes("hex"); });
      var nI = hdr.findIndex(function (h) { return h === "name" || h.includes("name"); });
      var pI = hdr.findIndex(function (h) { return h.includes("pms") || h.includes("pantone"); });
      if (hI < 0) { show("No Hex column found"); return; }
      var colors = [];
      for (var i = 1; i < lines.length; i++) {
        var row = lines[i];
        var hex = (row[hI] || "").trim();
        if (!hex) continue;
        if (!hex.startsWith("#")) hex = "#" + hex;
        if (!/^#[0-9a-fA-F]{6}$/.test(hex)) continue;
        colors.push({ name: nI >= 0 ? (row[nI] || "").trim() : "Color " + i, hex: hex.toLowerCase(), pms: pI >= 0 ? (row[pI] || "").trim() : "" });
      }
      if (!colors.length) { show("No valid colors"); return; }
      var key = uploadName.trim().replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
      var nb = Object.assign({}, brands);
      nb[key] = { name: uploadName.trim(), colors: colors };
      setBrands(nb); sSet("dvcs-brands", nb);
      setShowUpload(false); setUploadName("");
      // auto-select darkest brand color as stroke
      var darkest = colors[0]; var darkestL = 999;
      colors.forEach(function (c) { var rgb = h2r(c.hex); var ll = getLum(rgb.r, rgb.g, rgb.b); if (ll < darkestL) { darkestL = ll; darkest = c; } });
      setDarkStroke(darkest.hex);
      setActiveBrand(key); setBrandColors(colors);
      regen(colors, darkest.hex);
      show(uploadName.trim() + " loaded");
    });
  }, [brands, uploadName]);

  var hueShift = useCallback(function (oi, type, sid) {
    setOpts(function (prev) {
      var next = JSON.parse(JSON.stringify(prev));
      var slots = next[oi][type];
      var idx = slots.findIndex(function (s) { return s.id === sid; });
      if (idx < 0) return prev;
      var s = slots[idx];
      s.hue = (s.hue + 25 + Math.floor(Math.random() * 45)) % 360;
      var pair = makePair(s.hue, s.sat, oi, darkStroke);
      s.lightHex = pair.lightHex; s.darkHex = pair.darkHex;
      s.label = "H" + Math.round(s.hue) + "\u00B0"; s.swapped = null;
      next[oi].spectrum = next[oi].categorical.slice().sort(function (a, b) { return a.hue - b.hue; });
      return next;
    });
  }, [darkStroke]);

  var lightShift = useCallback(function (oi, type, sid) {
    setOpts(function (prev) {
      var next = JSON.parse(JSON.stringify(prev));
      var slots = next[oi][type];
      var idx = slots.findIndex(function (s) { return s.id === sid; });
      if (idx < 0) return prev;
      var s = slots[idx];
      s.sat = ((s.sat + 12 - 30) % 60) + 30;
      var pair = makePair(s.hue, s.sat, oi, darkStroke);
      s.lightHex = pair.lightHex; s.darkHex = pair.darkHex;
      next[oi].spectrum = next[oi].categorical.slice().sort(function (a, b) { return a.hue - b.hue; });
      return next;
    });
  }, [darkStroke]);

  var cur = opts[activeOpt];
  if (!loaded || !cur) return <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Loading...</div>;

  var tabs = [
    { k: "categorical", l: "Categorical" }, { k: "spectrum", l: "Spectrum" },
  ];

  /* ── COMPARE VIEW ── */
  if (compare) {
    var allTypes = ["categorical", "spectrum", "semantic", "deemphasis"];
    return (
      <div style={{ minHeight: "100vh", background: "#f2f3f6", fontFamily: "'Outfit',sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
        <div style={{ background: "linear-gradient(135deg,#111,#333)", padding: "18px 24px 14px" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 33, color: "#fff", letterSpacing: "0.06em" }}>
              Compare All Options {activeBrand ? " \u00B7 " + brands[activeBrand].name : ""}
            </h1>
            <button onClick={function () { setCompare(false); }}
              style={{ padding: "8px 18px", borderRadius: 6, border: "1px solid #555", backgroundColor: "transparent", color: "#ccc", fontSize: 22, cursor: "pointer", fontWeight: 600 }}>
              Back to Editor
            </button>
          </div>
        </div>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "16px 16px 50px" }}>
          {allTypes.map(function (type) {
            return (
              <div key={type} style={{ marginBottom: 28 }}>
                <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 23, letterSpacing: "0.08em", color: "#333", marginBottom: 8, textTransform: "uppercase" }}>{type}</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {opts.map(function (opt, oi) {
                    var slots = opt[type] || [];
                    return (
                      <div key={oi}>
                        {/* L row */}
                        <div style={{ borderRadius: 8, backgroundColor: "#fff", border: "1px solid #e8e8e8", marginBottom: 6, padding: 8 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Space Mono',monospace", color: "#999", display: "block", marginBottom: 5 }}>
                            Opt {oi + 1}L
                          </span>
                          <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 8 }}>
                            {slots.map(function (s, si) {
                              return (
                                <div key={si}
                                  style={{ width: 28, height: 28, borderRadius: 4, backgroundColor: s.lightHex, border: "1.5px solid #ffffff", boxSizing: "border-box", cursor: "pointer" }}
                                  onClick={function () { setSelInfo({ hex: s.lightHex, label: s.label }); }}
                                  title={s.lightHex}
                                />
                              );
                            })}
                          </div>
                          {(type === "categorical" || type === "spectrum") && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                              <BarChart slots={slots} dark={false} stroke="#ffffff" darkBg={darkStroke} useLight={true} />
                              <DonutChart slots={slots} dark={false} stroke="#ffffff" darkBg={darkStroke} useLight={true} />
                              <LineChart slots={slots} dark={false} darkBg={darkStroke} useLight={true} />
                            </div>
                          )}
                        </div>
                        {/* D row */}
                        <div style={{ borderRadius: 8, backgroundColor: "#1a1a1a", border: "1px solid #333", padding: 8 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Space Mono',monospace", color: "#666", display: "block", marginBottom: 5 }}>
                            Opt {oi + 1}D
                          </span>
                          <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 8 }}>
                            {slots.map(function (s, si) {
                              return (
                                <div key={si}
                                  style={{ width: 28, height: 28, borderRadius: 4, backgroundColor: s.darkHex, border: "1.5px solid " + darkStroke, boxSizing: "border-box", cursor: "pointer" }}
                                  onClick={function () { setSelInfo({ hex: s.darkHex, label: s.label }); }}
                                  title={s.darkHex}
                                />
                              );
                            })}
                          </div>
                          {(type === "categorical" || type === "spectrum") && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                              <BarChart slots={slots} dark={true} stroke={darkStroke} darkBg={darkStroke} useLight={false} />
                              <DonutChart slots={slots} dark={true} stroke={darkStroke} darkBg={darkStroke} useLight={false} />
                              <LineChart slots={slots} dark={true} darkBg={darkStroke} useLight={false} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        {selInfo && <ColorDetail info={selInfo} onClose={function () { setSelInfo(null); }} />}
      </div>
    );
  }

  /* ── MAIN VIEW ── */
  return (
    <div style={{ minHeight: "100vh", background: "#f2f3f6", fontFamily: "'Outfit',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#111,#333)", padding: "16px 20px 12px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 8 }}>
            <div>
              <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Data Viz Color System</span>
              <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 39, color: "#fff", lineHeight: 1, marginTop: 2, letterSpacing: "0.05em" }}>
                {activeBrand ? brands[activeBrand].name : "No Brand"}
              </h1>
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              <button onClick={function () { setShowUpload(true); }} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.06)", color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>+ Upload Brand</button>
              <button onClick={function () { setCompare(true); }} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.2)", backgroundColor: "rgba(255,255,255,0.06)", color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Compare All</button>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Color Swatches */}
      {brandColors.length > 0 && (
        <div style={{ maxWidth: 1200, margin: "10px auto 0", padding: "0 16px" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 10, padding: "10px 14px", border: "1px solid #eee" }}>
            <span style={{ fontSize: 11, fontFamily: "'Space Mono',monospace", color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Brand Colors ({brandColors.length})
            </span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {brandColors.map(function (c, i) {
                var rgb = h2r(c.hex);
                var l = getLum(rgb.r, rgb.g, rgb.b);
                var fg = l > 0.35 ? "#111" : "#fff";
                var fgSub = l > 0.35 ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.55)";
                var cmyk = r2cmyk(rgb.r, rgb.g, rgb.b);
                var p = findPMS(c.hex);
                return (
                  <div key={i} style={{ width: 90, borderRadius: 8, overflow: "hidden", border: "1px solid #e0e0e0" }}>
                    <div style={{ height: 44, backgroundColor: c.hex, display: "flex", alignItems: "flex-end", padding: "0 6px 3px", boxSizing: "border-box" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: fg, fontFamily: "'Space Mono',monospace", lineHeight: 1 }}>
                        {c.name}
                      </span>
                    </div>
                    <div style={{ padding: "4px 6px 5px", backgroundColor: "#fafafa" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#222", fontFamily: "'Space Mono',monospace" }}>
                        {c.hex.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 10, color: "#999", fontFamily: "'Space Mono',monospace", marginTop: 1 }}>
                        R{rgb.r} G{rgb.g} B{rgb.b}
                      </div>
                      <div style={{ fontSize: 10, color: "#bbb", fontFamily: "'Space Mono',monospace" }}>
                        {c.pms ? c.pms : (p ? "~" + p.name : "")}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Dark Stroke Selector + Brand pills */}
      <div style={{ maxWidth: 1200, margin: "8px auto 0", padding: "0 16px" }}>
        <div style={{ backgroundColor: "#fff", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", border: "1px solid #eee" }}>
          {/* Dark stroke picker */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontFamily: "'Space Mono',monospace", color: "#888", letterSpacing: "0.1em", textTransform: "uppercase" }}>Dark Stroke</span>
            <div style={{ position: "relative", width: 28, height: 28, borderRadius: 6, backgroundColor: darkStroke, border: "2px solid #ddd", cursor: "pointer", overflow: "hidden" }}>
              <input type="color" value={darkStroke} onChange={function (e) { setDarkStroke(e.target.value); regen(brandColors, e.target.value); }}
                style={{ position: "absolute", inset: -4, width: "140%", height: "140%", cursor: "pointer", opacity: 0 }} />
            </div>
            <span style={{ fontSize: 12, fontFamily: "'Space Mono',monospace", color: "#aaa" }}>{darkStroke.toUpperCase()}</span>
          </div>

          {/* Brand colors as quick-select for stroke */}
          {brandColors.length > 0 && (
            <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#bbb", fontFamily: "'Space Mono',monospace" }}>Brand:</span>
              {brandColors.map(function (c, i) {
                var isActive = darkStroke === c.hex;
                return (
                  <div key={i} onClick={function () { setDarkStroke(c.hex); regen(brandColors, c.hex); }}
                    style={{ width: 22, height: 22, borderRadius: 4, backgroundColor: c.hex, border: isActive ? "2px solid #ff8800" : "1px solid #ddd", cursor: "pointer" }}
                    title={c.name + " " + c.hex} />
                );
              })}
            </div>
          )}

          {/* Saved brands dropdown */}
          {Object.keys(brands).length > 0 && (
            <div style={{ position: "relative", marginLeft: "auto" }}>
              <button onClick={function () { setBrandDD(!brandDD); }}
                style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #ddd", backgroundColor: activeBrand ? "#fff5e6" : "#fff", color: "#333", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <span>{activeBrand ? brands[activeBrand].name : "Select Brand"}</span>
                <svg width="8" height="5" viewBox="0 0 8 5" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round"><path d="M1 1l3 3 3-3" /></svg>
              </button>
              {brandDD && (
                <div>
                  <div onClick={function () { setBrandDD(false); }} style={{ position: "fixed", inset: 0, zIndex: 39 }} />
                  <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 4, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #ddd", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 40, minWidth: 200, overflow: "hidden" }}>
                  {/* Generic / no brand option */}
                  <div onClick={function () { setActiveBrand(null); setBrandDD(false); }}
                    style={{ padding: "8px 12px", fontSize: 15, color: "#888", cursor: "pointer", borderBottom: "1px solid #f0f0f0", backgroundColor: !activeBrand ? "#f7f7f7" : "#fff" }}>
                    No Brand (Generic)
                  </div>
                  {Object.entries(brands).map(function (entry) {
                    var k = entry[0], v = entry[1];
                    var isActive = activeBrand === k;
                    return (
                      <div key={k} style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #f5f5f5" }}>
                        <div onClick={function () { loadBrand(k); setBrandDD(false); }}
                          style={{ flex: 1, padding: "8px 12px", fontSize: 15, fontWeight: isActive ? 700 : 400, color: isActive ? "#333" : "#555", cursor: "pointer", backgroundColor: isActive ? "#fff5e6" : "#fff" }}>
                          {v.name}
                          <span style={{ fontSize: 12, color: "#bbb", marginLeft: 6 }}>{v.colors.length} colors</span>
                        </div>
                        <button onClick={function (e) { e.stopPropagation(); deleteBrand(k); }}
                          style={{ padding: "4px 10px", border: "none", backgroundColor: "transparent", color: "#ccc", fontSize: 21, cursor: "pointer", lineHeight: 1 }}
                          title="Delete brand">
                          ×
                        </button>
                      </div>
                    );
                  })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Option tabs + Palette tabs */}
      <div style={{ maxWidth: 1200, margin: "8px auto 0", padding: "0 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 2, backgroundColor: "#fff", borderRadius: 6, padding: 2, border: "1px solid #eee" }}>
          {["Opt 1", "Opt 2", "Opt 3"].map(function (lbl, i) {
            return (
              <button key={i} onClick={function () { setActiveOpt(i); }}
                style={{ padding: "5px 12px", borderRadius: 4, border: "none", backgroundColor: activeOpt === i ? "#333" : "transparent", color: activeOpt === i ? "#fff" : "#888", fontWeight: activeOpt === i ? 700 : 400, fontSize: 15, cursor: "pointer" }}>
                {lbl}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 2, backgroundColor: "#fff", borderRadius: 6, padding: 2, border: "1px solid #eee" }}>
          {tabs.map(function (t) {
            return (
              <button key={t.k} onClick={function () { setActiveTab(t.k); }}
                style={{ padding: "5px 12px", borderRadius: 4, border: "none", backgroundColor: activeTab === t.k ? "#333" : "transparent", color: activeTab === t.k ? "#fff" : "#888", fontWeight: activeTab === t.k ? 700 : 400, fontSize: 15, cursor: "pointer" }}>
                {t.l}
              </button>
            );
          })}
        </div>
      </div>

      {/* L and D side by side */}
      <div style={{ maxWidth: 1200, margin: "12px auto 0", padding: "0 16px 40px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* L Panel - white stroke */}
          <OptionPanel
            pal={cur} isDark={false} stroke="#ffffff" darkBg={darkStroke}
            activeTab={activeTab}
            onHue={function (type, id) { hueShift(activeOpt, type, id); }}
            onLight={function (type, id) { lightShift(activeOpt, type, id); }}
            onSelect={setSelInfo}
          />
          {/* D Panel - dark stroke */}
          <OptionPanel
            pal={cur} isDark={true} stroke={darkStroke} darkBg={darkStroke}
            activeTab={activeTab}
            onHue={function (type, id) { hueShift(activeOpt, type, id); }}
            onLight={function (type, id) { lightShift(activeOpt, type, id); }}
            onSelect={setSelInfo}
          />
        </div>

        {/* Downloads */}
        <div style={{ marginTop: 16, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={function () { dlPalette(cur, activeBrand ? brands[activeBrand].name : "generic", false, brandColors, darkStroke); show("Light downloaded!"); }}
            style={{ padding: "8px 18px", borderRadius: 7, border: "2px solid #333", backgroundColor: "#fff", color: "#333", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            Download Light Excel
          </button>
          <button onClick={function () { dlPalette(cur, activeBrand ? brands[activeBrand].name : "generic", true, brandColors, darkStroke); show("Dark downloaded!"); }}
            style={{ padding: "8px 18px", borderRadius: 7, border: "none", backgroundColor: "#333", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            Download Dark Excel
          </button>
          {toast && <span style={{ fontSize: 14, fontFamily: "'Space Mono',monospace", color: "#1a7a3d", backgroundColor: "#e8f5e9", padding: "4px 8px", borderRadius: 4, fontWeight: 600 }}>{toast}</span>}
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: "#bbb", fontFamily: "'Space Mono',monospace", textAlign: "center" }}>
          PMS Bridge Coated values are approximations. All colors meet WCAG AA (4.5:1) — L vs white, D vs dark stroke.
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(5px)" }} onClick={function () { setShowUpload(false); }}>
          <div style={{ backgroundColor: "#fff", borderRadius: 12, maxWidth: 380, width: "100%", padding: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={function (e) { e.stopPropagation(); }}>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 30, marginBottom: 12 }}>Upload Brand</h2>
            <p style={{ fontSize: 16, color: "#888", marginBottom: 12 }}>CSV/TSV with Name + Hex columns. Darkest color auto-selected as stroke.</p>
            <input type="text" placeholder="Brand name" value={uploadName} onChange={function (e) { setUploadName(e.target.value); }}
              style={{ width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 18, marginBottom: 8, boxSizing: "border-box" }} />
            <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" style={{ display: "none" }}
              onChange={function (e) { if (e.target.files && e.target.files[0]) handleUpload(e.target.files[0]); }} />
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={function () { if (uploadName.trim()) fileRef.current.click(); else show("Enter a name"); }}
                style={{ flex: 1, padding: 9, borderRadius: 7, border: "none", backgroundColor: uploadName.trim() ? "#222" : "#ccc", color: "#fff", fontWeight: 700, fontSize: 16, cursor: uploadName.trim() ? "pointer" : "not-allowed" }}>
                Choose File
              </button>
              <button onClick={function () { setShowUpload(false); }}
                style={{ padding: "9px 14px", borderRadius: 7, border: "1px solid #ddd", backgroundColor: "#fff", color: "#888", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {selInfo && <ColorDetail info={selInfo} onClose={function () { setSelInfo(null); }} />}
    </div>
  );
}
