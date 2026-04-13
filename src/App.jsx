import { useState, useCallback, useEffect, useRef } from "react";
import JSZip from "jszip";

/* ═══ PANTONE DB ═══ */
var PDB = [
  {n:"109 C",h:"#FFD100",c:0,m:16,y:100,k:0},{n:"116 C",h:"#FFCD00",c:0,m:16,y:100,k:0},{n:"123 C",h:"#FFC72C",c:0,m:19,y:89,k:0},
  {n:"130 C",h:"#F2A900",c:0,m:30,y:100,k:0},{n:"137 C",h:"#FFA300",c:0,m:34,y:100,k:0},{n:"144 C",h:"#ED8B00",c:0,m:43,y:100,k:0},
  {n:"151 C",h:"#FF8200",c:0,m:48,y:100,k:0},{n:"165 C",h:"#FF6900",c:0,m:58,y:100,k:0},{n:"172 C",h:"#FA4616",c:0,m:70,y:100,k:0},
  {n:"179 C",h:"#E03C31",c:0,m:78,y:78,k:4},{n:"185 C",h:"#E4002B",c:0,m:100,y:75,k:0},{n:"186 C",h:"#C8102E",c:0,m:100,y:81,k:4},
  {n:"187 C",h:"#A6192E",c:0,m:90,y:65,k:23},{n:"199 C",h:"#D50032",c:0,m:100,y:70,k:0},{n:"212 C",h:"#F04E98",c:0,m:76,y:16,k:0},
  {n:"254 C",h:"#9B26B6",c:36,m:88,y:0,k:0},{n:"265 C",h:"#7C50A3",c:40,m:70,y:0,k:0},{n:"270 C",h:"#8B84D7",c:42,m:40,y:0,k:0},
  {n:"279 C",h:"#418FDE",c:68,m:34,y:0,k:0},{n:"285 C",h:"#0077C8",c:90,m:48,y:0,k:0},{n:"286 C",h:"#0033A0",c:100,m:66,y:0,k:2},
  {n:"292 C",h:"#69B3E7",c:52,m:14,y:0,k:0},{n:"299 C",h:"#00A3E0",c:82,m:17,y:0,k:0},{n:"300 C",h:"#005EB8",c:100,m:44,y:0,k:0},
  {n:"312 C",h:"#0097A9",c:100,m:0,y:22,k:0},{n:"320 C",h:"#009CA6",c:100,m:0,y:30,k:2},{n:"326 C",h:"#00B2A9",c:78,m:0,y:28,k:0},
  {n:"339 C",h:"#00AF66",c:82,m:0,y:56,k:0},{n:"347 C",h:"#009639",c:100,m:0,y:82,k:0},{n:"361 C",h:"#43B02A",c:62,m:0,y:90,k:0},
  {n:"368 C",h:"#69BE28",c:52,m:0,y:95,k:0},{n:"375 C",h:"#97D700",c:32,m:0,y:100,k:0},{n:"485 C",h:"#DA291C",c:0,m:83,y:87,k:0},
  {n:"CG7 C",h:"#9B9DA0",c:17,m:11,y:11,k:28},{n:"CG9 C",h:"#76787B",c:22,m:16,y:15,k:44},{n:"431 C",h:"#5B6770",c:30,m:18,y:14,k:45},
  {n:"7467 C",h:"#00A3AD",c:80,m:0,y:20,k:0},{n:"2174 C",h:"#1A6AFF",c:75,m:50,y:0,k:0},
];

/* ═══ COLOR MATH ═══ */
function h2r(hex) { var x = hex.replace("#",""); return {r:parseInt(x.slice(0,2),16),g:parseInt(x.slice(2,4),16),b:parseInt(x.slice(4,6),16)}; }
function r2h(r,g,b) { return "#"+[r,g,b].map(function(v){return Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0");}).join(""); }
function getLum(r,g,b) { function f(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);} return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); }
function CR(a,b) { var c1=h2r(a),c2=h2r(b); var l1=getLum(c1.r,c1.g,c1.b),l2=getLum(c2.r,c2.g,c2.b); return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05); }
function r2hsl(r,g,b) { r/=255;g/=255;b/=255; var mx=Math.max(r,g,b),mn=Math.min(r,g,b),hh=0,ss=0,ll=(mx+mn)/2; if(mx!==mn){var d=mx-mn;ss=ll>0.5?d/(2-mx-mn):d/(mx+mn);if(mx===r)hh=((g-b)/d+(g<b?6:0))/6;else if(mx===g)hh=((b-r)/d+2)/6;else hh=((r-g)/d+4)/6;} return {h:hh*360,s:ss*100,l:ll*100}; }
function hsl2r(h,s,l) { h/=360;s/=100;l/=100; if(s===0){var v=Math.round(l*255);return {r:v,g:v,b:v};} var q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q; function f(pp,qq,t){if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return pp+(qq-pp)*6*t;if(t<1/2)return qq;if(t<2/3)return pp+(qq-pp)*(2/3-t)*6;return pp;} return {r:Math.round(f(p,q,h+1/3)*255),g:Math.round(f(p,q,h)*255),b:Math.round(f(p,q,h-1/3)*255)}; }
function hex2hsl(hex) { var c=h2r(hex); return r2hsl(c.r,c.g,c.b); }
function hsl2hex(h,s,l) { var c=hsl2r(h,s,l); return r2h(c.r,c.g,c.b); }
function r2cmyk(r,g,b) { if(r===0&&g===0&&b===0) return {c:0,m:0,y:0,k:100}; var cc=1-r/255,mm=1-g/255,yy=1-b/255,k=Math.min(cc,mm,yy); return {c:Math.round((cc-k)/(1-k)*100),m:Math.round((mm-k)/(1-k)*100),y:Math.round((yy-k)/(1-k)*100),k:Math.round(k*100)}; }
function findPMS(hex) { var best=null,bd=Infinity; for(var i=0;i<PDB.length;i++){var c1=h2r(hex),c2=h2r(PDB[i].h);var d=Math.sqrt(Math.pow(c1.r-c2.r,2)+Math.pow(c1.g-c2.g,2)+Math.pow(c1.b-c2.b,2));if(d<bd){bd=d;best=PDB[i];}} return best; }
function hueDist(a,b) { var d=Math.abs(a-b); return d>180?360-d:d; }
function adjustForContrast(hex,bgHex,target) {
  var hsl=hex2hsl(hex); var bgC=h2r(bgHex); var isDk=getLum(bgC.r,bgC.g,bgC.b)<0.15;
  for(var i=0;i<70;i++){var test=hsl2hex(hsl.h,hsl.s,hsl.l);if(CR(test,bgHex)>=target) return test;hsl.l+=isDk?1.2:-1.2;hsl.l=Math.max(5,Math.min(95,hsl.l));}
  return hsl2hex(hsl.h,hsl.s,hsl.l);
}
function makePair(hue,sat,darkBg) {
  var s=Math.min(90,Math.max(35,sat));
  return {lightHex:adjustForContrast(hsl2hex(hue,s,50),"#ffffff",4.5),darkHex:adjustForContrast(hsl2hex(hue,s,50),darkBg||"#121212",4.5),hue:hue,sat:s};
}

/* ═══ CIE Lab perceptual color distance ═══ */
function rgb2lab(r, g, b) {
  /* sRGB → linear RGB → XYZ → Lab */
  function lin(v) { v /= 255; return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92; }
  var rl = lin(r), gl = lin(g), bl = lin(b);
  /* XYZ (D65 white point) */
  var x = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / 0.95047;
  var y = (rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750) / 1.00000;
  var z = (rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041) / 1.08883;
  function f(t) { return t > 0.008856 ? Math.pow(t, 1/3) : (903.3 * t + 16) / 116; }
  var fx = f(x), fy = f(y), fz = f(z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

/* Delta E (CIE76) — perceptual color difference. <10 similar, 10-20 noticeable, >25 clearly different */
function deltaE(hexA, hexB) {
  var ca = h2r(hexA), cb = h2r(hexB);
  var la = rgb2lab(ca.r, ca.g, ca.b), lb = rgb2lab(cb.r, cb.g, cb.b);
  return Math.sqrt(Math.pow(la.L - lb.L, 2) + Math.pow(la.a - lb.a, 2) + Math.pow(la.b - lb.b, 2));
}

/* Check minimum hue distance from all other hues in list */
function minHueDist(hue, otherHues) {
  var minD = 360;
  for (var i = 0; i < otherHues.length; i++) {
    var d = hueDist(hue, otherHues[i]);
    if (d < minD) minD = d;
  }
  return minD;
}

/* Minimum Delta E from a hex to any hex in a list */
function minDeltaE(hex, others) {
  var minD = Infinity;
  for (var i = 0; i < others.length; i++) {
    var d = deltaE(hex, others[i]);
    if (d < minD) minD = d;
  }
  return minD;
}

var MIN_DE = 28; /* minimum Delta E for perceptual distinction */
var MIN_HUE_GLOBAL = 35; /* minimum hue distance between any two palette colors */

/* Check if a candidate color is distinct enough from all existing colors */
function isDistinctEnough(candidateL, candidateD, existingPairs) {
  for (var i = 0; i < existingPairs.length; i++) {
    if (deltaE(candidateL, existingPairs[i].lightHex) < MIN_DE) return false;
    if (deltaE(candidateD, existingPairs[i].darkHex) < MIN_DE) return false;
  }
  return true;
}

/* Find a hue+sat combo that produces visually distinct L and D colors */
function findDistinctColor(startHue, startSat, existingPairs, existingHues, darkBg) {
  var MIN_HUE = 35;
  /* Try the start hue first */
  if (minHueDist(startHue, existingHues) >= MIN_HUE) {
    var pair = makePair(startHue, startSat, darkBg);
    if (isDistinctEnough(pair.lightHex, pair.darkHex, existingPairs)) {
      return { hue: startHue, sat: startSat, pair: pair };
    }
  }
  /* Systematic search: PHASE 1 — stay very close to start hue (±8°), vary sat/lightness aggressively */
  var satOffsets = [0, 12, -12, 25, -25, 38, -38, 50, -50];
  var lightOffsets = [0, 6, -6, 12, -12, 18, -18, 24, -24];
  var bestCandidate = null, bestScore = 0;
  for (var offset = 0; offset < 9; offset += 3) {
    for (var si = 0; si < satOffsets.length; si++) {
      var sat = Math.min(90, Math.max(25, startSat + satOffsets[si]));
      for (var li = 0; li < lightOffsets.length; li++) {
        var startL = Math.min(70, Math.max(25, 50 + lightOffsets[li]));
        var candidates = offset === 0 ? [startHue] : [(startHue + offset) % 360, (startHue - offset + 360) % 360];
        for (var ci = 0; ci < candidates.length; ci++) {
          var h = candidates[ci];
          if (minHueDist(h, existingHues) < MIN_HUE) continue;
          var lHex = adjustForContrast(hsl2hex(h, sat, startL), "#ffffff", 4.5);
          var dHex = adjustForContrast(hsl2hex(h, sat, startL), darkBg || "#121212", 4.5);
          var p = { lightHex: lHex, darkHex: dHex, hue: h, sat: sat };
          if (isDistinctEnough(p.lightHex, p.darkHex, existingPairs)) {
            return { hue: h, sat: sat, pair: p };
          }
          var worstDE = Infinity;
          for (var k = 0; k < existingPairs.length; k++) {
            var dL = deltaE(p.lightHex, existingPairs[k].lightHex);
            var dD = deltaE(p.darkHex, existingPairs[k].darkHex);
            var worst = Math.min(dL, dD);
            if (worst < worstDE) worstDE = worst;
          }
          if (worstDE > bestScore) { bestScore = worstDE; bestCandidate = { hue: h, sat: sat, pair: p }; }
        }
      }
    }
  }
  /* PHASE 2 — wider hue search if Phase 1 didn't find a perfect match */
  for (var offset2 = 9; offset2 < 360; offset2 += 3) {
    for (var si2 = 0; si2 < satOffsets.length; si2++) {
      var sat2 = Math.min(90, Math.max(25, startSat + satOffsets[si2]));
      for (var li2 = 0; li2 < lightOffsets.length; li2++) {
        var startL2 = Math.min(70, Math.max(25, 50 + lightOffsets[li2]));
        var cands2 = [(startHue + offset2) % 360, (startHue - offset2 + 360) % 360];
        for (var ci2 = 0; ci2 < cands2.length; ci2++) {
          var h2 = cands2[ci2];
          if (minHueDist(h2, existingHues) < MIN_HUE) continue;
          var lHex2 = adjustForContrast(hsl2hex(h2, sat2, startL2), "#ffffff", 4.5);
          var dHex2 = adjustForContrast(hsl2hex(h2, sat2, startL2), darkBg || "#121212", 4.5);
          var p2 = { lightHex: lHex2, darkHex: dHex2, hue: h2, sat: sat2 };
          if (isDistinctEnough(p2.lightHex, p2.darkHex, existingPairs)) {
            return { hue: h2, sat: sat2, pair: p2 };
          }
          var worstDE2 = Infinity;
          for (var k2 = 0; k2 < existingPairs.length; k2++) {
            var dL2 = deltaE(p2.lightHex, existingPairs[k2].lightHex);
            var dD2 = deltaE(p2.darkHex, existingPairs[k2].darkHex);
            var worst2 = Math.min(dL2, dD2);
            if (worst2 < worstDE2) worstDE2 = worst2;
          }
          if (worstDE2 > bestScore) { bestScore = worstDE2; bestCandidate = { hue: h2, sat: sat2, pair: p2 }; }
        }
      }
    }
  }
  if (bestCandidate) return bestCandidate;
  var fp = makePair(startHue, startSat, darkBg);
  return { hue: startHue, sat: startSat, pair: fp };
}

/* ═══ BASE HUE SETS — 3 distinct options ═══ */
var OPT_HUES = [
  /* Exactly 40° spacing — each option offset by ~13° for distinct sets */
  [{hue:5,sat:70,label:"Red"},{hue:45,sat:80,label:"Orange"},{hue:85,sat:72,label:"Gold"},{hue:125,sat:65,label:"Green"},{hue:165,sat:68,label:"Teal"},{hue:205,sat:75,label:"Blue"},{hue:245,sat:58,label:"Indigo"},{hue:285,sat:58,label:"Purple"},{hue:325,sat:55,label:"Magenta"}],
  [{hue:13,sat:72,label:"Coral"},{hue:53,sat:78,label:"Amber"},{hue:93,sat:58,label:"Lime"},{hue:133,sat:60,label:"Emerald"},{hue:173,sat:65,label:"Seafoam"},{hue:213,sat:68,label:"Cyan"},{hue:253,sat:55,label:"Violet"},{hue:293,sat:50,label:"Orchid"},{hue:333,sat:62,label:"Rose"}],
  [{hue:27,sat:70,label:"Terracotta"},{hue:67,sat:65,label:"Mustard"},{hue:107,sat:55,label:"Moss"},{hue:147,sat:52,label:"Sage"},{hue:187,sat:62,label:"Steel"},{hue:227,sat:65,label:"Navy"},{hue:267,sat:48,label:"Lavender"},{hue:307,sat:52,label:"Plum"},{hue:347,sat:60,label:"Crimson"}],
];
var SEM_BASES = [{hue:140,sat:65,label:"Success"},{hue:38,sat:85,label:"Warning"},{hue:0,sat:72,label:"Error"}];
var DEEM_OPT = [
  [{hue:215,sat:10,lL:72,dL:55},{hue:215,sat:8,lL:55,dL:65},{hue:215,sat:6,lL:36,dL:75}],
  [{hue:25,sat:8,lL:74,dL:56},{hue:25,sat:6,lL:56,dL:66},{hue:25,sat:5,lL:38,dL:74}],
  [{hue:200,sat:7,lL:70,dL:58},{hue:200,sat:5,lL:52,dL:68},{hue:200,sat:4,lL:34,dL:76}],
];

function generatePalettes(brandColors, optIdx, darkBg, reworkSeed) {
  var baseHues = OPT_HUES[optIdx] || OPT_HUES[0];
  var seed = reworkSeed || 0;

  /* STEP 1: Pre-select the most perceptually distinct brand colors (max 4) */
  var usableBrand = [];
  if (brandColors.length > 0) {
    /* Filter to saturated colors only */
    var saturated = [];
    for (var bi = 0; bi < brandColors.length; bi++) {
      var bHsl = hex2hsl(brandColors[bi].hex);
      if (bHsl.s > 20 && bHsl.l > 10 && bHsl.l < 85) saturated.push({ idx: bi, hex: brandColors[bi].hex, hue: bHsl.h, sat: bHsl.s, name: brandColors[bi].name });
    }
    /* Greedily pick the most distinct ones */
    if (saturated.length > 0) {
      usableBrand.push(saturated[0]);
      for (var si = 1; si < saturated.length && usableBrand.length < 3; si++) {
        var distinct = true;
        for (var ui = 0; ui < usableBrand.length; ui++) {
          /* Check both hue distance AND perceptual distance of the raw brand colors */
          if (hueDist(saturated[si].hue, usableBrand[ui].hue) < 55) { distinct = false; break; }
          if (deltaE(saturated[si].hex, usableBrand[ui].hex) < 40) { distinct = false; break; }
        }
        if (distinct) usableBrand.push(saturated[si]);
      }
    }
  }

  /* STEP 2: Generate categorical colors */
  var assignedHues = [];
  var assignedPairs = [];
  var usedBrandIdxs = {};

  var cat = baseHues.map(function(base, i) {
    var hue = (base.hue + seed * 17) % 360;
    var sat = base.sat;
    var swapped = null;

    /* Try to match a pre-selected brand color */
    for (var j = 0; j < usableBrand.length; j++) {
      if (usedBrandIdxs[j]) continue;
      if (hueDist(hue, usableBrand[j].hue) < 35) {
        /* Check if this brand color would be distinct from already assigned */
        var testPair = makePair(usableBrand[j].hue, usableBrand[j].sat, darkBg);
        if (isDistinctEnough(testPair.lightHex, testPair.darkHex, assignedPairs)) {
          hue = usableBrand[j].hue; sat = usableBrand[j].sat; swapped = usableBrand[j].name;
          usedBrandIdxs[j] = true;
          break;
        }
      }
    }

    /* Find a hue+sat that's visually distinct in both L and D */
    var result = findDistinctColor(hue, sat, assignedPairs, assignedHues, darkBg);
    hue = result.hue;
    sat = result.sat;
    var pair = result.pair;

    assignedHues.push(hue);
    assignedPairs.push(pair);

    return {id:i, hue:hue, sat:pair.sat, lightHex:pair.lightHex, darkHex:pair.darkHex, label:swapped?"~"+swapped:base.label, swapped:swapped};
  });

  /* STEP 3: POST-GENERATION VERIFICATION — re-roll any color too close in hue OR Delta E */
  for (var pass = 0; pass < 12; pass++) {
    var worstA = -1, worstB = -1, worstScore = Infinity;
    for (var ai = 0; ai < cat.length; ai++) {
      for (var bi2 = ai + 1; bi2 < cat.length; bi2++) {
        var dL = deltaE(cat[ai].lightHex, cat[bi2].lightHex);
        var dD = deltaE(cat[ai].darkHex, cat[bi2].darkHex);
        var hd = hueDist(cat[ai].hue, cat[bi2].hue);
        var deWorst = Math.min(dL, dD);
        var failed = (hd < MIN_HUE_GLOBAL) || (deWorst < MIN_DE);
        if (failed) {
          var score = hd / MIN_HUE_GLOBAL + deWorst / MIN_DE;
          if (score < worstScore) { worstScore = score; worstA = ai; worstB = bi2; }
        }
      }
    }
    if (worstA < 0) break;

    /* Try re-rolling BOTH colors, keep the better result */
    function tryReroll(idx) {
      var others = []; var otherH = [];
      for (var ri = 0; ri < cat.length; ri++) {
        if (ri !== idx) { others.push({ lightHex: cat[ri].lightHex, darkHex: cat[ri].darkHex }); otherH.push(cat[ri].hue); }
      }
      var fix = findDistinctColor(cat[idx].hue, cat[idx].sat, others, otherH, darkBg);
      /* Score the result: min ΔE and min hue against all others */
      var minDE = Infinity, minHD2 = Infinity;
      for (var ri2 = 0; ri2 < cat.length; ri2++) {
        if (ri2 === idx) continue;
        minDE = Math.min(minDE, deltaE(fix.pair.lightHex, cat[ri2].lightHex), deltaE(fix.pair.darkHex, cat[ri2].darkHex));
        minHD2 = Math.min(minHD2, hueDist(fix.hue, cat[ri2].hue));
      }
      return { fix: fix, minDE: minDE, minHD: minHD2, combined: minDE / MIN_DE + minHD2 / MIN_HUE_GLOBAL };
    }
    var resultA = tryReroll(worstA);
    var resultB = tryReroll(worstB);
    var best = resultA.combined >= resultB.combined ? { idx: worstA, fix: resultA.fix } : { idx: worstB, fix: resultB.fix };
    cat[best.idx] = { id: cat[best.idx].id, hue: best.fix.hue, sat: best.fix.sat, lightHex: best.fix.pair.lightHex, darkHex: best.fix.pair.darkHex, label: "H" + Math.round(best.fix.hue) + "\u00B0", swapped: null };
  }

  var sem = SEM_BASES.map(function(base,i) { var pair=makePair(base.hue,base.sat,darkBg); return {id:i,hue:base.hue,sat:pair.sat,lightHex:pair.lightHex,darkHex:pair.darkHex,label:base.label}; });
  var deemBases = DEEM_OPT[optIdx] || DEEM_OPT[0];
  var deem = deemBases.map(function(base,i) { var rawL=hsl2hex(base.hue,base.sat,base.lL); var rawD=hsl2hex(base.hue,base.sat,base.dL); return {id:i,hue:base.hue,sat:base.sat,lightHex:adjustForContrast(rawL,"#ffffff",4.5),darkHex:adjustForContrast(rawD,darkBg||"#121212",4.5),label:["Light","Mid","Dark"][i]}; });
  var spectrum = cat.slice().sort(function(a,b) { return a.hue - b.hue; });
  return {categorical:cat, semantic:sem, deemphasis:deem, spectrum:spectrum};
}

/* ═══ SUPABASE STORAGE ═══ */
var SB_URL="https://xcgdnzypisbzxhaooswb.supabase.co";
var SB_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjZ2RuenlwaXNienhoYW9vc3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0OTg3MjYsImV4cCI6MjA5MDA3NDcyNn0._-3ZW05XMM50hvX4Vk2ltt6VWKITUcD0c3fWtuNiJ4Y";
var SB_HDR={"Content-Type":"application/json","apikey":SB_KEY,"Authorization":"Bearer "+SB_KEY,"Prefer":"return=representation"};

async function sbFetchBrands() {
  try {
    var res=await fetch(SB_URL+"/rest/v1/dvp_brands?select=id,name,colors,dark_stroke,palettes&order=name",{headers:SB_HDR});
    if(!res.ok) return {};
    var rows=await res.json();
    var out={};
    rows.forEach(function(r){out[r.id]={name:r.name,colors:r.colors,darkStroke:r.dark_stroke,palettes:r.palettes};});
    return out;
  } catch(e){return {};}
}

async function sbUpsertBrand(key, data) {
  try {
    await fetch(SB_URL+"/rest/v1/dvp_brands",{method:"POST",headers:Object.assign({},SB_HDR,{"Prefer":"resolution=merge-duplicates,return=representation"}),body:JSON.stringify({id:key,name:data.name,colors:data.colors,dark_stroke:data.darkStroke||"#032054",palettes:data.palettes||null,updated_at:new Date().toISOString()})});
  } catch(e){}
}

async function sbDeleteBrand(key) {
  try {
    await fetch(SB_URL+"/rest/v1/dvp_brands?id=eq."+encodeURIComponent(key),{method:"DELETE",headers:SB_HDR});
  } catch(e){}
}

async function sbSavePalettes(key, palettes) {
  try {
    await fetch(SB_URL+"/rest/v1/dvp_brands?id=eq."+encodeURIComponent(key),{method:"PATCH",headers:SB_HDR,body:JSON.stringify({palettes:palettes,updated_at:new Date().toISOString()})});
  } catch(e){}
}

async function sbSaveDarkStroke(key, ds) {
  try {
    await fetch(SB_URL+"/rest/v1/dvp_brands?id=eq."+encodeURIComponent(key),{method:"PATCH",headers:SB_HDR,body:JSON.stringify({dark_stroke:ds,updated_at:new Date().toISOString()})});
  } catch(e){}
}

/* ═══ CHARTS ═══ */
function BarChart(p) {
  var slots=p.slots,dark=p.dark,stroke=p.stroke,darkBg=p.darkBg,useL=p.useLight;
  var bg=dark?darkBg:"#ffffff"; var data=[82,54,71,38,63,47,29,55,45]; var mx=82;
  return (<div style={{borderRadius:8,padding:10,backgroundColor:bg,border:"1px solid "+(dark?"rgba(255,255,255,0.08)":"#eee")}}>
    <span style={{fontSize:11,fontFamily:"'Space Mono',monospace",color:dark?"rgba(255,255,255,0.3)":"#bbb",display:"block",marginBottom:4}}>Bar</span>
    <div style={{display:"flex",alignItems:"flex-end",gap:2,height:50}}>{data.slice(0,slots.length).map(function(v,i){var hex=useL?slots[i].lightHex:slots[i].darkHex;return (<div key={i} style={{flex:1,height:(v/mx*100)+"%",backgroundColor:hex,borderRadius:"2px 2px 0 0",border:"1px solid "+stroke,boxSizing:"border-box"}} />);})}</div>
  </div>);
}
function DonutChart(p) {
  var slots=p.slots,dark=p.dark,stroke=p.stroke,darkBg=p.darkBg,useL=p.useLight;
  var bg=dark?darkBg:"#ffffff"; var data=[30,22,18,12,10,8,5,4,3]; var total=112,cum=0,R=38,cx=48,cy=48,ir=20;
  var paths=data.slice(0,slots.length).map(function(val,i){
    var angle=(val/total)*2*Math.PI; var start=cum; cum+=angle;
    var x1=cx+R*Math.cos(start),y1=cy+R*Math.sin(start),x2=cx+R*Math.cos(cum),y2=cy+R*Math.sin(cum);
    var la=angle>Math.PI?1:0; var x3=cx+ir*Math.cos(cum),y3=cy+ir*Math.sin(cum),x4=cx+ir*Math.cos(start),y4=cy+ir*Math.sin(start);
    var hex=useL?slots[i].lightHex:slots[i].darkHex;
    return (<path key={i} d={"M"+x1+" "+y1+"A"+R+" "+R+" 0 "+la+" 1 "+x2+" "+y2+"L"+x3+" "+y3+"A"+ir+" "+ir+" 0 "+la+" 0 "+x4+" "+y4+"Z"} fill={hex} stroke={stroke} strokeWidth="1" />);
  });
  return (<div style={{borderRadius:8,padding:10,backgroundColor:bg,border:"1px solid "+(dark?"rgba(255,255,255,0.08)":"#eee"),display:"flex",flexDirection:"column",alignItems:"center"}}>
    <span style={{fontSize:11,fontFamily:"'Space Mono',monospace",color:dark?"rgba(255,255,255,0.3)":"#bbb",display:"block",marginBottom:4,alignSelf:"flex-start"}}>Donut</span>
    <svg viewBox="0 0 96 96" width="80" height="80">{paths}</svg>
  </div>);
}
function LineChart(p) {
  var slots=p.slots,dark=p.dark,darkBg=p.darkBg,useL=p.useLight;
  var bg=dark?darkBg:"#ffffff"; var W=200,H=60,pad=4;
  var lines=slots.slice(0,6).map(function(s,si){
    var pts=[]; for(var i=0;i<8;i++){pts.push((pad+(i/7)*(W-pad*2))+","+(pad+10+Math.sin(i*0.8+si*1.2)*18+si*4));}
    return (<polyline key={si} points={pts.join(" ")} fill="none" stroke={useL?s.lightHex:s.darkHex} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />);
  });
  return (<div style={{borderRadius:8,padding:10,backgroundColor:bg,border:"1px solid "+(dark?"rgba(255,255,255,0.08)":"#eee")}}>
    <span style={{fontSize:11,fontFamily:"'Space Mono',monospace",color:dark?"rgba(255,255,255,0.3)":"#bbb",display:"block",marginBottom:4}}>Line</span>
    <svg viewBox={"0 0 "+W+" "+H} width="100%" height={H}>{lines}</svg>
  </div>);
}

/* ═══ SWATCH ═══ */
function Swatch(props) {
  var hex=props.hex,stroke=props.stroke,isDark=props.isDark,darkBg=props.darkBg;
  var onHue=props.onHue,onLight=props.onLight,onSelect=props.onSelect,label=props.label;
  var slotId=props.slotId,slotType=props.slotType;
  var bg=isDark?darkBg:"#ffffff"; var ratio=CR(hex,bg); var pass=ratio>=4.5;
  var btnStyle={position:"absolute",width:22,height:22,borderRadius:11,backgroundColor:"transparent",color:"rgba(255,255,255,0.5)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0,zIndex:2};
  return (
    <div style={{position:"relative",width:96,borderRadius:8,overflow:"hidden",backgroundColor:"#fff",border:"1px solid #eee",flexShrink:0}}>
      <div style={{height:52,backgroundColor:hex,position:"relative",cursor:"pointer",border:"2px solid "+stroke,borderRadius:"6px 6px 0 0",boxSizing:"border-box"}} onClick={function(){if(onSelect)onSelect({hex:hex,label:label,slotId:slotId,slotType:slotType,onHue:onHue,onLight:onLight});}}>
        {onHue&&(<button onClick={function(e){e.stopPropagation();e.preventDefault();onHue();}} style={Object.assign({},btnStyle,{top:3,left:3})} title="Shift hue"><svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="8" cy="8" r="5"/><path d="M8 3v-2M13 8h2M8 13v2M3 8h-2" strokeWidth="1.5"/></svg></button>)}
        {onLight&&(<button onClick={function(e){e.stopPropagation();e.preventDefault();onLight();}} style={Object.assign({},btnStyle,{top:3,right:3})} title="Cycle tone"><svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1v5h5"/><path d="M15 15v-5h-5"/><path d="M2.3 10a6 6 0 0 0 10.3 1.5L15 10M1 6l2.4-1.5A6 6 0 0 1 13.7 6"/></svg></button>)}
      </div>
      <div style={{padding:"4px 6px 5px",display:"flex",alignItems:"center",gap:4}}>
        <div style={{width:8,height:8,borderRadius:4,backgroundColor:pass?"#1a7a3d":"#c42b2b",flexShrink:0}} />
        <div style={{fontSize:13,fontWeight:700,color:"#111",fontFamily:"'Space Mono',monospace"}}>{hex.toUpperCase()}</div>
      </div>
    </div>
  );
}

/* ═══ OPTION PANEL ═══ */
function OptionPanel(props) {
  var pal=props.pal,isDark=props.isDark,stroke=props.stroke,darkBg=props.darkBg;
  var activeTab=props.activeTab,onHue=props.onHue,onLight=props.onLight,onSelect=props.onSelect;
  var mode=isDark?"D":"L"; var catSlots=pal.categorical||[]; var specSlots=pal.spectrum||[]; var semSlots=pal.semantic||[]; var deemSlots=pal.deemphasis||[];
  function SL(lp){return (<div style={{marginBottom:4,marginTop:14,display:"flex",alignItems:"center",gap:6}}><span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,letterSpacing:"0.08em",color:"#555"}}>{lp.text}</span>{lp.sub&&<span style={{fontSize:12,color:"#777",fontFamily:"'Space Mono',monospace"}}>{lp.sub}</span>}</div>);}
  function renderSwatches(slots,type){return (<div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>{slots.map(function(s){var hex=isDark?s.darkHex:s.lightHex;return (<Swatch key={type+"-"+s.id+"-"+s.hue+"-"+mode} hex={hex} stroke={stroke} isDark={isDark} darkBg={darkBg} onHue={onHue?function(){onHue(type,s.id);}:null} onLight={onLight?function(){onLight(type,s.id);}:null} onSelect={onSelect} label={s.label} slotId={s.id} slotType={type} />);})}</div>);}
  return (
    <div style={{flex:1,minWidth:0}}>
      <div style={{marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
        <div style={{width:14,height:14,borderRadius:3,backgroundColor:stroke,border:"1px solid #ddd"}} />
        <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:21,letterSpacing:"0.08em",color:"#222"}}>{mode} · {stroke==="#ffffff"?"White":"Dark"} Stroke</span>
        <span style={{fontSize:12,color:"#777",fontFamily:"'Space Mono',monospace"}}>AA 4.5:1 vs {isDark?darkBg:"#FFF"}</span>
      </div>
      <SL text="Categorical" sub="max neighbor contrast" />
      {renderSwatches(catSlots,"categorical")}
      {activeTab==="spectrum"&&(<div>
        <SL text="Spectrum" sub="sorted by hue" />
        <div style={{borderRadius:6,padding:8,backgroundColor:"#f8f8f8",border:"1px solid #eee",marginBottom:8}}>
          <div style={{display:"flex",height:24,borderRadius:4,overflow:"hidden",marginBottom:6}}>{specSlots.map(function(s,i){return <div key={i} style={{flex:1,backgroundColor:isDark?s.darkHex:s.lightHex}} />;})}</div>
          <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{specSlots.map(function(s,i){var hex=isDark?s.darkHex:s.lightHex;return (<div key={i} style={{width:26,height:26,borderRadius:4,backgroundColor:hex,border:"1.5px solid "+stroke,boxSizing:"border-box",cursor:"pointer"}} onClick={function(){if(onSelect)onSelect({hex:hex,label:s.label,slotId:s.id,slotType:"categorical",onHue:onHue?function(){onHue("categorical",s.id);}:null,onLight:onLight?function(){onLight("categorical",s.id);}:null});}} title={hex} />);})}</div>
        </div>
      </div>)}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:5}}>
        <BarChart slots={catSlots} dark={false} stroke={stroke} darkBg={darkBg} useLight={!isDark} /><DonutChart slots={catSlots} dark={false} stroke={stroke} darkBg={darkBg} useLight={!isDark} /><LineChart slots={catSlots} dark={false} darkBg={darkBg} useLight={!isDark} />
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:6}}>
        <BarChart slots={catSlots} dark={true} stroke={stroke} darkBg={darkBg} useLight={!isDark} /><DonutChart slots={catSlots} dark={true} stroke={stroke} darkBg={darkBg} useLight={!isDark} /><LineChart slots={catSlots} dark={true} darkBg={darkBg} useLight={!isDark} />
      </div>
      <SL text="Semantic" sub="success / warning / error" />
      {renderSwatches(semSlots,"semantic")}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:6}}>
        {[false,true].map(function(dk){var bg=dk?darkBg:"#ffffff";var stk=isDark?darkBg:"#ffffff";return (<div key={dk?"sd":"sl"} style={{borderRadius:6,padding:8,backgroundColor:bg,border:"1px solid "+(dk?"rgba(255,255,255,0.08)":"#eee")}}>{semSlots.map(function(s,i){var hex=isDark?s.darkHex:s.lightHex;var ratio=CR(hex,bg).toFixed(1);var nn=parseFloat(ratio);return (<div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}><div style={{width:80,height:24,borderRadius:4,backgroundColor:hex,border:"2px solid "+stk,boxSizing:"border-box",flexShrink:0}} /><span style={{color:hex,fontWeight:700,fontSize:12}}>{s.label}</span><span style={{fontSize:10,fontWeight:700,color:"#fff",backgroundColor:nn>=4.5?"#1a7a3d":"#c42b2b",padding:"1px 3px",borderRadius:2}}>{ratio}:1</span></div>);})}</div>);})}
      </div>
      <SL text="Deemphasis" sub="cool-toned grays" />
      {renderSwatches(deemSlots,"deemphasis")}
    </div>
  );
}

/* ═══ COLOR DETAIL MODAL ═══ */
function ColorDetail(props) {
  var info=props.info,onClose=props.onClose,onSetHSL=props.onSetHSL,brandColors=props.brandColors||[];
  var _pending=useState(null); var pending=_pending[0],setPending=_pending[1];
  if(!info) return null;
  var displayHex=pending||info.hex;
  var rgb=h2r(displayHex); var hsl=r2hsl(rgb.r,rgb.g,rgb.b); var cmyk=r2cmyk(rgb.r,rgb.g,rgb.b);
  var p=findPMS(displayHex); var cw=CR(displayHex,"#ffffff").toFixed(2); var cd=CR(displayHex,"#121212").toFixed(2);
  var ll=getLum(rgb.r,rgb.g,rgb.b); var fg=ll>0.35?"#111":"#fff";
  function Badge(bp){var nn=parseFloat(bp.v);var lv=nn>=7?"AAA":nn>=4.5?"AA":"Fail";var bg=nn>=4.5?"#1a7a3d":"#c42b2b";return (<span style={{fontSize:12,fontWeight:700,color:"#fff",backgroundColor:bg,padding:"1px 5px",borderRadius:3,marginLeft:4}}>{lv} {bp.v}</span>);}
  function handleColorInput(e){setPending(e.target.value);}
  function selectBrandColor(hex){setPending(hex);}
  function applyColor(){
    if(pending&&onSetHSL&&info.slotType!=null&&info.slotId!=null){
      var newHsl=hex2hsl(pending);
      onSetHSL(info.slotType,info.slotId,Math.round(newHsl.h),Math.round(newHsl.s),Math.round(newHsl.l));
    }
    onClose();
  }
  function cancelEdit(){setPending(null);onClose();}
  var canEdit=onSetHSL&&info.slotType!=null&&info.slotId!=null;
  var isEditing=pending!==null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backgroundColor:"rgba(0,0,0,0.5)",backdropFilter:"blur(5px)"}} onClick={cancelEdit}>
      <div style={{backgroundColor:"#fff",borderRadius:14,maxWidth:340,width:"100%",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}} onClick={function(e){e.stopPropagation();}}>
        <div style={{height:110,backgroundColor:displayHex,color:fg,position:"relative",display:"flex",alignItems:"flex-end",padding:14}}>
          {info.onHue&&!isEditing&&(<button onClick={function(){info.onHue();onClose();}} style={{position:"absolute",top:10,left:10,width:28,height:28,borderRadius:14,backgroundColor:"transparent",color:"rgba(255,255,255,0.5)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0,zIndex:2}} title="Shift hue"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="8" cy="8" r="5"/><path d="M8 3v-2M13 8h2M8 13v2M3 8h-2" strokeWidth="1.5"/></svg></button>)}
          {info.onLight&&!isEditing&&(<button onClick={function(){info.onLight();onClose();}} style={{position:"absolute",top:10,right:10,width:28,height:28,borderRadius:14,backgroundColor:"transparent",color:"rgba(255,255,255,0.5)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0,zIndex:2}} title="Cycle tone"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 1v5h5"/><path d="M15 15v-5h-5"/><path d="M2.3 10a6 6 0 0 0 10.3 1.5L15 10M1 6l2.4-1.5A6 6 0 0 1 13.7 6"/></svg></button>)}
          {canEdit&&(<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:36,height:36,borderRadius:18,backgroundColor:"transparent",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",cursor:"pointer",border:"none"}}>
            <input type="color" value={displayHex} onChange={handleColorInput} style={{position:"absolute",inset:-6,width:"150%",height:"150%",cursor:"pointer",opacity:0}} />
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={fg} strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round"><path d="M12 1l3 3-9 9H3v-3z"/><path d="M10 3l3 3"/></svg>
          </div>)}
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:30,letterSpacing:"0.06em"}}>{info.label||"Color"}</div>
        </div>
        <div style={{padding:14}}>
          {/* Color values */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontFamily:"'Space Mono',monospace",fontSize:14,marginBottom:10}}>
            <div><span style={{color:"#777"}}>HEX</span><br /><b>{displayHex.toUpperCase()}</b></div>
            <div><span style={{color:"#777"}}>RGB</span><br /><b>{rgb.r},{rgb.g},{rgb.b}</b></div>
            <div><span style={{color:"#777"}}>HSL</span><br /><b>{Math.round(hsl.h)}&deg; {Math.round(hsl.s)}% {Math.round(hsl.l)}%</b></div>
            <div><span style={{color:"#777"}}>CMYK</span><br /><b>{cmyk.c}/{cmyk.m}/{cmyk.y}/{cmyk.k}</b></div>
          </div>
          {p&&(<div style={{borderTop:"1px solid #eee",paddingTop:6,marginBottom:6,display:"flex",alignItems:"center",gap:5}}><div style={{width:16,height:16,borderRadius:3,backgroundColor:p.h,border:"1px solid #ddd"}} /><span style={{fontFamily:"'Space Mono',monospace",fontSize:13,fontWeight:700}}>PMS {p.n}</span></div>)}
          <div style={{borderTop:"1px solid #eee",paddingTop:6,display:"flex",flexDirection:"column",gap:3}}>
            <div style={{display:"flex",alignItems:"center"}}><span style={{fontSize:13,color:"#666",width:50,fontFamily:"'Space Mono',monospace"}}>White</span><span style={{fontSize:16,fontWeight:700,fontFamily:"'Space Mono',monospace"}}>{cw}</span><Badge v={cw} /></div>
            <div style={{display:"flex",alignItems:"center"}}><span style={{fontSize:13,color:"#666",width:50,fontFamily:"'Space Mono',monospace"}}>Dark</span><span style={{fontSize:16,fontWeight:700,fontFamily:"'Space Mono',monospace"}}>{cd}</span><Badge v={cd} /></div>
          </div>
          {/* Brand color swatches for quick pick */}
          {canEdit&&brandColors.length>0&&(<div style={{borderTop:"1px solid #eee",paddingTop:8,marginTop:8}}>
            <span style={{fontSize:10,fontFamily:"'Space Mono',monospace",color:"#777",letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:5}}>Brand Colors</span>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{brandColors.map(function(c,i){
              var isActive=displayHex.toLowerCase()===c.hex.toLowerCase();
              return (<div key={i} onClick={function(){selectBrandColor(c.hex);}} style={{width:28,height:28,borderRadius:5,backgroundColor:c.hex,border:isActive?"2px solid #ff8800":"1.5px solid #ddd",cursor:"pointer",boxSizing:"border-box"}} title={c.name+" "+c.hex} />);
            })}</div>
          </div>)}
          {/* OK / Cancel when editing, or just Close */}
          {isEditing ? (
            <div style={{display:"flex",gap:6,marginTop:10}}>
              <button onClick={applyColor} style={{flex:1,padding:7,borderRadius:6,border:"none",backgroundColor:"#1a7a3d",color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer"}}>OK</button>
              <button onClick={cancelEdit} style={{flex:1,padding:7,borderRadius:6,border:"1px solid #ddd",backgroundColor:"#fff",color:"#555",fontWeight:700,fontSize:15,cursor:"pointer"}}>Cancel</button>
            </div>
          ) : (
            <button onClick={onClose} style={{width:"100%",padding:7,borderRadius:6,border:"none",backgroundColor:"#222",color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",marginTop:10}}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══ BRAND STRIP ═══ */
function BrandStrip(props) {
  var bc=props.brandColors; if(!bc||!bc.length) return null;
  return (<div style={{backgroundColor:"#fff",borderRadius:10,padding:"10px 14px",border:"1px solid #eee",marginBottom:10}}>
    <span style={{fontSize:11,fontFamily:"'Space Mono',monospace",color:"#777",letterSpacing:"0.1em",textTransform:"uppercase",display:"block",marginBottom:6}}>Brand Colors ({bc.length})</span>
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{bc.map(function(c,i){var rgb=h2r(c.hex);var l=getLum(rgb.r,rgb.g,rgb.b);var fg=l>0.35?"#111":"#fff";return (<div key={i} style={{width:90,borderRadius:8,overflow:"hidden",border:"1px solid #e0e0e0"}}><div style={{height:44,backgroundColor:c.hex,display:"flex",alignItems:"flex-start",padding:"4px 6px 0",boxSizing:"border-box"}}><span style={{fontSize:11,fontWeight:700,color:fg,fontFamily:"'Space Mono',monospace",lineHeight:1.2}}>{c.name}</span></div><div style={{padding:"4px 6px 5px",backgroundColor:"#fafafa"}}><div style={{fontSize:12,fontWeight:700,color:"#222",fontFamily:"'Space Mono',monospace"}}>{c.hex.toUpperCase()}</div></div></div>);})}</div>
  </div>);
}

/* ═══ COMPARE (compact) ═══ */
function CompareView(props) {
  var opts=props.opts,darkStroke=props.darkStroke,activeTab=props.activeTab,brandColors=props.brandColors,brands=props.brands,activeBrand=props.activeBrand,setSelInfo=props.setSelInfo,setCompare=props.setCompare,setSlotHSL=props.setSlotHSL,selInfo=props.selInfo,hueShift=props.hueShift,lightShift=props.lightShift;
  function CS(cp){var oi=cp.oi,type=cp.type||"categorical";return (<div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:6}}>{cp.slots.map(function(s,i){var hex=cp.useL?s.lightHex:s.darkHex;var hCb=hueShift?function(){hueShift(oi,type,s.id);}:null;var lCb=lightShift?function(){lightShift(oi,type,s.id);}:null;return (<div key={i} style={{width:26,height:26,borderRadius:4,backgroundColor:hex,border:"1.5px solid "+cp.stk,boxSizing:"border-box",cursor:"pointer"}} onClick={function(){setSelInfo({hex:hex,label:s.label,slotId:s.id,slotType:type,onHue:hCb,onLight:lCb});}} title={hex} />);})}</div>);}
  function CSL(cp){var stk=cp.stk||"#ffffff";return (<div style={{marginTop:6}}>{cp.slots.map(function(s,i){var hex=cp.useL?s.lightHex:s.darkHex;var ratio=CR(hex,cp.bg).toFixed(1);var nn=parseFloat(ratio);return (<div key={i} style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}><div style={{width:60,height:18,borderRadius:3,backgroundColor:hex,border:"2px solid "+stk,boxSizing:"border-box",flexShrink:0}} /><span style={{color:hex,fontWeight:700,fontSize:11}}>{s.label}</span><span style={{fontSize:9,fontWeight:700,color:"#fff",backgroundColor:nn>=4.5?"#1a7a3d":"#c42b2b",padding:"1px 3px",borderRadius:2}}>{ratio}:1</span></div>);})}</div>);}
  function CC(cp){var bg=cp.dk?darkStroke:"#ffffff";return (<div style={{borderRadius:8,backgroundColor:bg,border:"1px solid "+(cp.dk?"rgba(255,255,255,0.08)":"#e8e8e8"),padding:10,marginBottom:6}}>{cp.children}</div>);}
  var sub={fontSize:11,fontWeight:700,fontFamily:"'Space Mono',monospace",marginBottom:4};
  return (
    <div style={{minHeight:"100vh",background:"#edeef0",fontFamily:"'Outfit',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <div style={{position:"sticky",top:0,zIndex:30}}>
      <div style={{background:"linear-gradient(135deg,#111,#333)",padding:"18px 24px 14px"}}><div style={{maxWidth:1500,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}><h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:33,color:"#fff",letterSpacing:"0.06em"}}>Compare All{activeBrand?" \u00B7 "+brands[activeBrand].name:""}</h1><button onClick={function(){setCompare(false);}} style={{padding:"8px 18px",borderRadius:6,border:"1px solid #555",backgroundColor:"transparent",color:"#666",fontSize:15,cursor:"pointer",fontWeight:600}}>Back to Editor</button></div></div>
      <div style={{maxWidth:1500,margin:"0 auto",padding:"6px 16px 0",background:"#edeef0"}}><BrandStrip brandColors={brandColors} /></div>
      </div>
      <div style={{maxWidth:1500,margin:"0 auto",padding:"0 16px 50px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
          {opts.map(function(opt,oi){
            var catSlots=opt.categorical,specSlots=opt.spectrum,semSlots=opt.semantic,deemSlots=opt.deemphasis,lStk="#ffffff",dStk=darkStroke;
            return (<div key={oi}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:"0.08em",color:"#333",marginBottom:8}}>Option {oi+1}</div>
              <div style={{fontSize:13,fontWeight:700,fontFamily:"'Space Mono',monospace",color:"#666",marginBottom:4}}>{oi+1}L · White Stroke</div>
              <CC dk={false}><CS slots={catSlots} useL={true} stk={lStk} oi={oi} type="categorical" /><div style={{fontSize:9,fontWeight:700,fontFamily:"'Space Mono',monospace",color:"#666",marginBottom:3}}>Spectrum</div><CS slots={specSlots} useL={true} stk={lStk} oi={oi} type="categorical" /><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4}}><BarChart slots={catSlots} dark={false} stroke={lStk} darkBg={dStk} useLight={true} /><DonutChart slots={catSlots} dark={false} stroke={lStk} darkBg={dStk} useLight={true} /><LineChart slots={catSlots} dark={false} darkBg={dStk} useLight={true} /></div></CC>
              <CC dk={true}><CS slots={catSlots} useL={true} stk={lStk} oi={oi} type="categorical" /><div style={{fontSize:9,fontWeight:700,fontFamily:"'Space Mono',monospace",color:"rgba(255,255,255,0.3)",marginBottom:3}}>Spectrum</div><CS slots={specSlots} useL={true} stk={lStk} oi={oi} type="categorical" /><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4}}><BarChart slots={catSlots} dark={true} stroke={lStk} darkBg={dStk} useLight={true} /><DonutChart slots={catSlots} dark={true} stroke={lStk} darkBg={dStk} useLight={true} /><LineChart slots={catSlots} dark={true} darkBg={dStk} useLight={true} /></div></CC>
              <CC dk={false}><div style={Object.assign({},sub,{color:"#666"})}>Semantic</div><CS slots={semSlots} useL={true} stk={lStk} oi={oi} type="semantic" /><div style={Object.assign({},sub,{color:"#666",marginTop:6})}>Deemphasis</div><CS slots={deemSlots} useL={true} stk={lStk} oi={oi} type="deemphasis" /><CSL slots={semSlots} useL={true} bg="#ffffff" stk="#ffffff" /></CC>
              <CC dk={true}><div style={Object.assign({},sub,{color:"rgba(255,255,255,0.4)"})}>Semantic</div><CS slots={semSlots} useL={true} stk={lStk} oi={oi} type="semantic" /><div style={Object.assign({},sub,{color:"rgba(255,255,255,0.4)",marginTop:6})}>Deemphasis</div><CS slots={deemSlots} useL={true} stk={lStk} oi={oi} type="deemphasis" /><CSL slots={semSlots} useL={true} bg={dStk} stk="#ffffff" /></CC>
              <div style={{height:3,backgroundColor:"#000",borderRadius:2,margin:"14px 0"}} />
              <div style={{fontSize:13,fontWeight:700,fontFamily:"'Space Mono',monospace",color:"#666",marginBottom:4}}>{oi+1}D · Dark Stroke</div>
              <CC dk={false}><CS slots={catSlots} useL={false} stk={dStk} oi={oi} type="categorical" /><div style={{fontSize:9,fontWeight:700,fontFamily:"'Space Mono',monospace",color:"#666",marginBottom:3}}>Spectrum</div><CS slots={specSlots} useL={false} stk={dStk} oi={oi} type="categorical" /><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4}}><BarChart slots={catSlots} dark={false} stroke={dStk} darkBg={dStk} useLight={false} /><DonutChart slots={catSlots} dark={false} stroke={dStk} darkBg={dStk} useLight={false} /><LineChart slots={catSlots} dark={false} darkBg={dStk} useLight={false} /></div></CC>
              <CC dk={true}><CS slots={catSlots} useL={false} stk={dStk} oi={oi} type="categorical" /><div style={{fontSize:9,fontWeight:700,fontFamily:"'Space Mono',monospace",color:"rgba(255,255,255,0.3)",marginBottom:3}}>Spectrum</div><CS slots={specSlots} useL={false} stk={dStk} oi={oi} type="categorical" /><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4}}><BarChart slots={catSlots} dark={true} stroke={dStk} darkBg={dStk} useLight={false} /><DonutChart slots={catSlots} dark={true} stroke={dStk} darkBg={dStk} useLight={false} /><LineChart slots={catSlots} dark={true} darkBg={dStk} useLight={false} /></div></CC>
              <CC dk={false}><div style={Object.assign({},sub,{color:"#666"})}>Semantic</div><CS slots={semSlots} useL={false} stk={dStk} oi={oi} type="semantic" /><div style={Object.assign({},sub,{color:"#666",marginTop:6})}>Deemphasis</div><CS slots={deemSlots} useL={false} stk={dStk} oi={oi} type="deemphasis" /><CSL slots={semSlots} useL={false} bg="#ffffff" stk={dStk} /></CC>
              <CC dk={true}><div style={Object.assign({},sub,{color:"rgba(255,255,255,0.4)"})}>Semantic</div><CS slots={semSlots} useL={false} stk={dStk} oi={oi} type="semantic" /><div style={Object.assign({},sub,{color:"rgba(255,255,255,0.4)",marginTop:6})}>Deemphasis</div><CS slots={deemSlots} useL={false} stk={dStk} oi={oi} type="deemphasis" /><CSL slots={semSlots} useL={false} bg={dStk} stk={dStk} /></CC>
            </div>);
          })}
        </div>
      </div>
      {selInfo&&<ColorDetail info={selInfo} onClose={function(){setSelInfo(null);}} onSetHSL={setSlotHSL} brandColors={brandColors} />}
    </div>
  );
}

/* ═══ MAIN APP ═══ */
export default function App() {
  var _brands=useState({}),_actBrand=useState(null),_brandColors=useState([]),_opts=useState([null,null,null]);
  var _actOpt=useState(0),_darkStroke=useState("#032054"),_selInfo=useState(null),_showUpload=useState(false);
  var _uploadName=useState(""),_toast=useState(""),_loaded=useState(false),_activeTab=useState("categorical");
  var _compare=useState(false),_brandDD=useState(false),_reworkSeed=useState(0),_pptModal=useState(null);
  var fileRef=useRef(null);
  var brands=_brands[0],setBrands=_brands[1],activeBrand=_actBrand[0],setActiveBrand=_actBrand[1];
  var brandColors=_brandColors[0],setBrandColors=_brandColors[1],opts=_opts[0],setOpts=_opts[1];
  var activeOpt=_actOpt[0],setActiveOpt=_actOpt[1],darkStroke=_darkStroke[0],setDarkStroke=_darkStroke[1];
  var selInfo=_selInfo[0],setSelInfo=_selInfo[1],showUpload=_showUpload[0],setShowUpload=_showUpload[1];
  var uploadName=_uploadName[0],setUploadName=_uploadName[1],toast=_toast[0],setToast=_toast[1];
  var loaded=_loaded[0],setLoaded=_loaded[1],activeTab=_activeTab[0],setActiveTab=_activeTab[1];
  var compare=_compare[0],setCompare=_compare[1],brandDD=_brandDD[0],setBrandDD=_brandDD[1];
  var reworkSeed=_reworkSeed[0],setReworkSeed=_reworkSeed[1];
  var pptModal=_pptModal[0],setPptModal=_pptModal[1];
  function show(msg){setToast(msg);setTimeout(function(){setToast("");},2500);}
  function regen(bc,ds,seed){setOpts([generatePalettes(bc,0,ds,seed),generatePalettes(bc,1,ds,seed),generatePalettes(bc,2,ds,seed)]);}

  useEffect(function(){sbFetchBrands().then(function(b){setBrands(b);setLoaded(true);});},[]);
  useEffect(function(){if(!loaded)return;if(!activeBrand){regen([],darkStroke,reworkSeed);setBrandColors([]);}},[loaded,activeBrand]);

  var loadBrand=useCallback(function(key){
    setActiveBrand(key); var b=brands[key]; if(!b)return;
    setBrandColors(b.colors); var ds=b.darkStroke||"#032054"; setDarkStroke(ds);
    if(b.palettes){setOpts(b.palettes);}else{regen(b.colors,ds,0);}
  },[brands]);

  function deleteBrand(key){var nb=Object.assign({},brands);delete nb[key];setBrands(nb);sbDeleteBrand(key);if(activeBrand===key){setActiveBrand(null);setBrandColors([]);regen([],darkStroke,0);}show("Deleted");}

  function saveDarkStroke(ds){setDarkStroke(ds);regen(brandColors,ds,reworkSeed);if(activeBrand){var nb=Object.assign({},brands);if(nb[activeBrand])nb[activeBrand].darkStroke=ds;setBrands(nb);sbSaveDarkStroke(activeBrand,ds);}}

  function savePalettes(){if(activeBrand){sbSavePalettes(activeBrand,opts);var nb=Object.assign({},brands);if(nb[activeBrand])nb[activeBrand].palettes=opts;setBrands(nb);show("Saved!");}else{show("Upload a brand first");}}

  function reworkAll(){var newSeed=reworkSeed+1+Math.floor(Math.random()*5);setReworkSeed(newSeed);regen(brandColors,darkStroke,newSeed);show("Reworked!");}

  function copyPptXml(isDk, includeSpectrum) {
    if (!cur) return;
    function hx(hex) { return hex.replace("#","").toUpperCase(); }
    function row(name, hex) { return '    <a:custClr name="'+name+'">\n        <a:srgbClr val="'+hx(hex)+'" />\n    </a:custClr>'; }
    function blank() { return '    <a:custClr name="">\n        <a:srgbClr val="FFFFFF" />\n    </a:custClr>'; }
    var lines = ['<a:custClrLst>'];
    cur.categorical.forEach(function(s,i) { lines.push(row("Categorical "+(i+1), isDk?s.darkHex:s.lightHex)); });
    lines.push(blank());
    if (includeSpectrum) {
      cur.spectrum.forEach(function(s,i) { lines.push(row("Spectrum "+(i+1), isDk?s.darkHex:s.lightHex)); });
      lines.push(blank());
    }
    cur.semantic.forEach(function(s,i) { lines.push(row("Semantic "+(i+1), isDk?s.darkHex:s.lightHex)); });
    for(var p=0;p<7;p++) lines.push(blank());
    cur.deemphasis.forEach(function(s,i) { lines.push(row("Deemphasis "+(i+1), isDk?s.darkHex:s.lightHex)); });
    for(var q=0;q<7;q++) lines.push(blank());
    lines.push('</a:custClrLst>');
    navigator.clipboard.writeText(lines.join("\n"));
    show("PPT XML copied!");
    setPptModal(null);
  }

  function downloadPptx() {
    if (!cur) return;
    show("Generating PPTX...");
    var brandName = activeBrand ? brands[activeBrand].name : "Generic";
    var hx = function(hex) { return hex.replace("#","").toUpperCase(); };

    /* Template color map — HAP colors in Opt1-3 template, ALL 9 positions including duplicate */
    var T_L_CAT = ["772ED1","C426D9","0D54F2","198617","CF480B","0D0DF2","167D99","772ED1","917107"];
    var T_D_CAT = ["9E6ADE","CC45DE","477DF5","29D926","F2540D","7070F7","20B6DF","9E6ADE","F4C325"];
    var T_L_SPEC = ["0D54F2","167D99","0D0DF2","C426D9","917107","772ED1","CF480B","772ED1","198617"];
    var T_D_SPEC = ["477DF5","20B6DF","7070F7","CC45DE","F4C325","9E6ADE","F2540D","9E6ADE","29D926"];
    var T_L_SEM = ["1D8640","A26B0D","DB2424"];
    var T_D_SEM = ["2DD264","EC9C13","E24E4E"];
    var T_L_DEEM = ["6B7584","6D7680","565B61"];
    var T_D_DEEM = ["818A98","9FA5AD","BBBFC3"];

    /* New palette values */
    var N_L_CAT = cur.categorical.map(function(s){return hx(s.lightHex);});
    var N_D_CAT = cur.categorical.map(function(s){return hx(s.darkHex);});
    var N_L_SPEC = cur.spectrum.map(function(s){return hx(s.lightHex);});
    var N_D_SPEC = cur.spectrum.map(function(s){return hx(s.darkHex);});
    var N_L_SEM = cur.semantic.map(function(s){return hx(s.lightHex);});
    var N_D_SEM = cur.semantic.map(function(s){return hx(s.darkHex);});
    var N_L_DEEM = cur.deemphasis.map(function(s){return hx(s.lightHex);});
    var N_D_DEEM = cur.deemphasis.map(function(s){return hx(s.darkHex);});
    var N_DARK = hx(darkStroke);

    /* ── Process slide XML: ordinal counting by color type ── */
    function processSlide(xml) {
      var L_CS = {}; T_L_CAT.forEach(function(c){L_CS[c]=true;});
      var D_CS = {}; T_D_CAT.forEach(function(c){D_CS[c]=true;});
      var replacements = [];

      /* Process srgbClr val fills — L catspec and D catspec counted independently */
      var fillRe = /srgbClr val="([A-F0-9]{6})"/g;
      var m, lIdx = 0, dIdx = 0;
      while ((m = fillRe.exec(xml)) !== null) {
        if (L_CS[m[1]]) {
          var nv = lIdx < 9 ? N_L_CAT[lIdx] : (lIdx < 18 ? N_L_SPEC[lIdx-9] : (lIdx < 27 ? N_L_CAT[lIdx-18] : N_L_SPEC[Math.min(lIdx-27,8)]));
          replacements.push({pos: m.index + 14, len: 6, val: nv});
          lIdx++;
        } else if (D_CS[m[1]]) {
          var nv2 = dIdx < 9 ? N_D_CAT[dIdx] : (dIdx < 18 ? N_D_SPEC[dIdx-9] : (dIdx < 27 ? N_D_CAT[dIdx-18] : N_D_SPEC[Math.min(dIdx-27,8)]));
          replacements.push({pos: m.index + 14, len: 6, val: nv2});
          dIdx++;
        }
      }

      /* Process #HEXHEX text labels — same ordinal approach */
      var txtRe = /#([A-F0-9]{6})/g;
      var t; lIdx = 0; dIdx = 0;
      while ((t = txtRe.exec(xml)) !== null) {
        if (L_CS[t[1]]) {
          var nt = lIdx < 9 ? N_L_CAT[lIdx] : (lIdx < 18 ? N_L_SPEC[lIdx-9] : (lIdx < 27 ? N_L_CAT[lIdx-18] : N_L_SPEC[Math.min(lIdx-27,8)]));
          replacements.push({pos: t.index + 1, len: 6, val: nt});
          lIdx++;
        } else if (D_CS[t[1]]) {
          var nt2 = dIdx < 9 ? N_D_CAT[dIdx] : (dIdx < 18 ? N_D_SPEC[dIdx-9] : (dIdx < 27 ? N_D_CAT[dIdx-18] : N_D_SPEC[Math.min(dIdx-27,8)]));
          replacements.push({pos: t.index + 1, len: 6, val: nt2});
          dIdx++;
        }
      }

      /* Apply positional replacements from end to start */
      replacements.sort(function(a,b){return b.pos-a.pos;});
      var chars = xml.split("");
      for (var ri = 0; ri < replacements.length; ri++) {
        var rp = replacements[ri];
        chars.splice(rp.pos, rp.len, rp.val);
      }
      xml = chars.join("");

      /* Global replace for semantic, deemphasis, dark bg (all unique) */
      var uniqueMap = {};
      for (var ui = 0; ui < 3; ui++) {
        uniqueMap[T_L_SEM[ui]] = N_L_SEM[ui]; uniqueMap[T_D_SEM[ui]] = N_D_SEM[ui];
        uniqueMap[T_L_DEEM[ui]] = N_L_DEEM[ui]; uniqueMap[T_D_DEEM[ui]] = N_D_DEEM[ui];
      }
      uniqueMap["000064"] = N_DARK; uniqueMap["000063"] = N_DARK;
      for (var uk in uniqueMap) {
        xml = xml.split('val="' + uk + '"').join('val="' + uniqueMap[uk] + '"');
        xml = xml.split('val="' + uk.toLowerCase() + '"').join('val="' + uniqueMap[uk] + '"');
        xml = xml.split("#" + uk).join("#" + uniqueMap[uk]);
        xml = xml.split("#" + uk.toLowerCase()).join("#" + uniqueMap[uk]);
      }

      /* Text label replacements */
      xml = xml.split("HAP").join(brandName);
      xml = xml.split("Option 1").join("Option " + (activeOpt + 1));
      xml = xml.split("Option 2").join("Option " + (activeOpt + 1));
      xml = xml.split("White outlines").join("L \u00B7 White Stroke");
      xml = xml.split("Dark outlines").join("D \u00B7 Dark Stroke");
      xml = xml.split("Option comparison").join(brandName + " Option " + (activeOpt + 1) + " Overview");
      return xml;
    }

    /* ── Process chart XML: positional color replacement ── */
    function processChart(xml) {
      var hasL = false, hasD = false;
      T_L_CAT.forEach(function(c){if(xml.indexOf('val="'+c+'"')>=0)hasL=true;});
      T_D_CAT.forEach(function(c){if(xml.indexOf('val="'+c+'"')>=0)hasD=true;});

      var tmplOrder = hasD ? T_D_CAT : T_L_CAT;
      var newOrder = hasD ? N_D_CAT : N_L_CAT;
      var palSet = {};
      tmplOrder.forEach(function(c){palSet[c]=true;});

      /* Count palette fills to determine if bar (8) or donut (9) */
      var countRe = /srgbClr val="([A-F0-9]{6})"/g;
      var cm, palCount = 0;
      while ((cm = countRe.exec(xml)) !== null) { if (palSet[cm[1]]) palCount++; }

      /* Bar charts (8 fills) skip position 7 (the duplicate), donut charts (9) have all */
      var posMap = palCount >= 9 ? [0,1,2,3,4,5,6,7,8] : [0,1,2,3,4,5,6,8];

      var fillRe = /srgbClr val="([A-F0-9]{6})"/g;
      var fm2, catIdx = 0;
      var chartReplacements = [];
      while ((fm2 = fillRe.exec(xml)) !== null) {
        if (fm2[1] === "000064" || fm2[1] === "000063") {
          chartReplacements.push({pos: fm2.index + 14, len: 6, val: N_DARK});
        } else if (palSet[fm2[1]] && catIdx < posMap.length) {
          chartReplacements.push({pos: fm2.index + 14, len: 6, val: newOrder[posMap[catIdx]]});
          catIdx++;
        }
      }
      chartReplacements.sort(function(a,b){return b.pos-a.pos;});
      var ch = xml.split("");
      for (var ci2 = 0; ci2 < chartReplacements.length; ci2++) {
        var cr = chartReplacements[ci2];
        ch.splice(cr.pos, cr.len, cr.val);
      }
      return ch.join("");
    }

    /* ── Process other XML (themes, etc.): global replace unique colors only ── */
    function processOther(xml) {
      var uniqueMap2 = {};
      for (var i = 0; i < 3; i++) {
        uniqueMap2[T_L_SEM[i]] = N_L_SEM[i]; uniqueMap2[T_D_SEM[i]] = N_D_SEM[i];
        uniqueMap2[T_L_DEEM[i]] = N_L_DEEM[i]; uniqueMap2[T_D_DEEM[i]] = N_D_DEEM[i];
      }
      uniqueMap2["000064"] = N_DARK; uniqueMap2["000063"] = N_DARK;
      for (var k in uniqueMap2) {
        xml = xml.split('val="'+k+'"').join('val="'+uniqueMap2[k]+'"');
        xml = xml.split('val="'+k.toLowerCase()+'"').join('val="'+uniqueMap2[k]+'"');
      }
      xml = xml.split("HAP").join(brandName);
      return xml;
    }

    fetch("/template.pptx").then(function(res) {
      return res.arrayBuffer();
    }).then(function(buf) {
      return JSZip.loadAsync(buf);
    }).then(function(zip) {
      var xmlFiles = [];
      zip.forEach(function(path, entry) {
        if (!entry.dir && (path.endsWith(".xml") || path.endsWith(".rels"))) xmlFiles.push(path);
      });
      var promises = xmlFiles.map(function(path) {
        return zip.file(path).async("string").then(function(content) {
          var updated;
          if (path.indexOf("ppt/slides/slide") >= 0) { updated = processSlide(content); }
          else if (path.indexOf("ppt/charts/chart") >= 0) { updated = processChart(content); }
          else { updated = processOther(content); }
          zip.file(path, updated);
        });
      });
      return Promise.all(promises).then(function() { return zip; });
    }).then(function(zip) {
      return zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
    }).then(function(blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = brandName + "_DataVisPalette_Opt" + (activeOpt + 1) + ".pptx";
      a.click();
      URL.revokeObjectURL(url);
      show("PPTX downloaded!");
    }).catch(function(err) {
      console.error("PPTX generation error:", err);
      show("Error generating PPTX");
    });
  }

  var handleUpload=useCallback(function(file){
    if(!file||!uploadName.trim())return;
    file.text().then(function(text){
      var lines=text.split("\n").map(function(ln){return ln.split(/[,\t]/);});
      var hdr=(lines[0]||[]).map(function(h){return h.trim().toLowerCase();}),hI=hdr.findIndex(function(h){return h==="hex"||h.includes("hex");}),nI=hdr.findIndex(function(h){return h==="name"||h.includes("name");}),pI=hdr.findIndex(function(h){return h.includes("pms")||h.includes("pantone");});
      if(hI<0){show("No Hex column found");return;}
      var colors=[];for(var i=1;i<lines.length;i++){var row=lines[i];var hex=(row[hI]||"").trim();if(!hex)continue;if(!hex.startsWith("#"))hex="#"+hex;if(!/^#[0-9a-fA-F]{6}$/.test(hex))continue;colors.push({name:nI>=0?(row[nI]||"").trim():"Color "+i,hex:hex.toLowerCase(),pms:pI>=0?(row[pI]||"").trim():""});}
      if(!colors.length){show("No valid colors");return;}
      var darkest=colors[0],darkestL=999;colors.forEach(function(c){var rgb=h2r(c.hex);var ll=getLum(rgb.r,rgb.g,rgb.b);if(ll<darkestL){darkestL=ll;darkest=c;}});
      var key=uploadName.trim().replace(/[^a-zA-Z0-9_-]/g,"_").toLowerCase();
      var nb=Object.assign({},brands);nb[key]={name:uploadName.trim(),colors:colors,darkStroke:darkest.hex};
      setBrands(nb);sbUpsertBrand(key,nb[key]);setShowUpload(false);setUploadName("");
      setDarkStroke(darkest.hex);setActiveBrand(key);setBrandColors(colors);regen(colors,darkest.hex,0);show(uploadName.trim()+" loaded");
    });
  },[brands,uploadName]);

  /* Hue shift: only changes ONE slot, ensures distinct from siblings */
  var hueShift=useCallback(function(oi,type,sid){
    setOpts(function(prev){
      var next=JSON.parse(JSON.stringify(prev));
      var slots=next[oi][type];
      if(!slots) return prev;
      var idx=-1;
      for(var fi=0;fi<slots.length;fi++){if(slots[fi].id===sid){idx=fi;break;}}
      if(idx<0) return prev;
      /* Snapshot all OTHER slots' hex values to verify we don't touch them */
      var otherHues=[]; var otherPairs=[];
      for(var j=0;j<slots.length;j++){if(j!==idx){otherHues.push(slots[j].hue);otherPairs.push({lightHex:slots[j].lightHex,darkHex:slots[j].darkHex});}}
      /* Find a new distinct color */
      var s=slots[idx];
      var best=null, bestDist=0;
      for(var attempt=0;attempt<60;attempt++){
        var candidate=(s.hue+25+Math.floor(Math.random()*130))%360;
        if(minHueDist(candidate,otherHues)<35) continue;
        var satOpt=Math.min(90,Math.max(25,s.sat+Math.floor(Math.random()*30)-15));
        var startL=Math.min(65,Math.max(30,50+Math.floor(Math.random()*20)-10));
        var lHex=adjustForContrast(hsl2hex(candidate,satOpt,startL),"#ffffff",4.5);
        var dHex=adjustForContrast(hsl2hex(candidate,satOpt,startL),darkStroke,4.5);
        var p={lightHex:lHex,darkHex:dHex,hue:candidate,sat:satOpt};
        if(isDistinctEnough(p.lightHex,p.darkHex,otherPairs)){best={hue:candidate,sat:satOpt,pair:p};break;}
        /* Track best by worst-case Delta E */
        var worstDE=Infinity;
        for(var k=0;k<otherPairs.length;k++){var dL=deltaE(p.lightHex,otherPairs[k].lightHex);var dD=deltaE(p.darkHex,otherPairs[k].darkHex);var w=Math.min(dL,dD);if(w<worstDE)worstDE=w;}
        if(worstDE>bestDist){bestDist=worstDE;best={hue:candidate,sat:satOpt,pair:p};}
      }
      if(!best){best={hue:(s.hue+60)%360,sat:s.sat,pair:makePair((s.hue+60)%360,s.sat,darkStroke)};}
      /* ONLY modify this one slot */
      slots[idx]={id:s.id, hue:best.hue, sat:best.sat, lightHex:best.pair.lightHex, darkHex:best.pair.darkHex, label:"H"+Math.round(best.hue)+"\u00B0", swapped:null};
      /* Only rebuild spectrum if we changed a categorical slot */
      if(type==="categorical"){
        next[oi].spectrum=next[oi].categorical.slice().sort(function(a,b){return a.hue-b.hue;});
      }
      return next;
    });
  },[darkStroke]);

  /* Light shift: only changes ONE slot's saturation */
  /* Tone variations: cycle through sat + lightness combos for more variety */
  var TONE_STEPS = [
    {ds:0,dl:0},    /* original */
    {ds:12,dl:5},   /* slightly more saturated, lighter */
    {ds:-15,dl:-5},  /* desaturated, darker */
    {ds:25,dl:0},   /* vivid */
    {ds:-8,dl:10},   /* muted, lighter */
    {ds:15,dl:-10},  /* saturated, darker */
    {ds:-25,dl:8},   /* very muted, lighter */
    {ds:30,dl:-8},   /* very vivid, darker */
    {ds:-12,dl:-12}, /* muted, much darker */
    {ds:8,dl:15},    /* slightly vivid, much lighter */
  ];
  var lightShift=useCallback(function(oi,type,sid){
    setOpts(function(prev){
      var next=JSON.parse(JSON.stringify(prev));
      var slots=next[oi][type];
      if(!slots) return prev;
      var idx=-1;
      for(var fi=0;fi<slots.length;fi++){if(slots[fi].id===sid){idx=fi;break;}}
      if(idx<0) return prev;
      var s=slots[idx];
      /* Track which step we're on via a hidden counter */
      var step=((s._toneStep||0)+1)%TONE_STEPS.length;
      var t=TONE_STEPS[step];
      var baseSat=s._baseSat!=null?s._baseSat:s.sat;
      var newSat=Math.min(90,Math.max(25,baseSat+t.ds));
      var startL=Math.min(70,Math.max(25,50+t.dl));
      var lightHex=adjustForContrast(hsl2hex(s.hue,newSat,startL),"#ffffff",4.5);
      var darkHex=adjustForContrast(hsl2hex(s.hue,newSat,startL),darkStroke,4.5);
      slots[idx]={id:s.id, hue:s.hue, sat:newSat, lightHex:lightHex, darkHex:darkHex, label:s.label, swapped:s.swapped, _toneStep:step, _baseSat:baseSat};
      if(type==="categorical"){
        next[oi].spectrum=next[oi].categorical.slice().sort(function(a,b){return a.hue-b.hue;});
      }
      return next;
    });
  },[darkStroke]);

  var setSlotHSL=useCallback(function(type,sid,newH,newS,newL){
    var oi=activeOpt;
    setOpts(function(prev){
      var next=JSON.parse(JSON.stringify(prev));
      var slots=next[oi][type];
      if(!slots) return prev;
      var idx=-1;
      for(var fi=0;fi<slots.length;fi++){if(slots[fi].id===sid){idx=fi;break;}}
      if(idx<0) return prev;
      var s=slots[idx];
      var startHex=hsl2hex(newH,newS,newL);
      slots[idx]={id:s.id, hue:newH, sat:newS, lightHex:adjustForContrast(startHex,"#ffffff",4.5), darkHex:adjustForContrast(startHex,darkStroke,4.5), label:"H"+Math.round(newH)+"\u00B0", swapped:null};
      if(type==="categorical"){
        next[oi].spectrum=next[oi].categorical.slice().sort(function(a,b){return a.hue-b.hue;});
      }
      return next;
    });
  },[darkStroke,activeOpt]);

  var cur=opts[activeOpt];
  if(!loaded||!cur) return <div style={{padding:40,textAlign:"center",color:"#666"}}>Loading...</div>;
  var tabs=[{k:"categorical",l:"Categorical"},{k:"spectrum",l:"Spectrum"}];

  if(compare) return <CompareView opts={opts} darkStroke={darkStroke} activeTab={activeTab} brandColors={brandColors} brands={brands} activeBrand={activeBrand} setSelInfo={setSelInfo} setCompare={setCompare} setSlotHSL={setSlotHSL} selInfo={selInfo} hueShift={hueShift} lightShift={lightShift} />;

  return (
    <div style={{minHeight:"100vh",background:"#edeef0",fontFamily:"'Outfit',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <div style={{position:"sticky",top:0,zIndex:30}}>
      <div style={{background:"linear-gradient(135deg,#111,#333)",padding:"18px 20px 14px"}}><div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:8}}>
          <div><span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:"rgba(255,255,255,0.3)",letterSpacing:"0.15em",textTransform:"uppercase"}}>Data Vis Palette</span><h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:33,color:"#fff",lineHeight:1,marginTop:2,letterSpacing:"0.05em"}}>{activeBrand?brands[activeBrand].name:"No Brand"}</h1></div>
          <div style={{display:"flex",gap:5}}><button onClick={function(){setShowUpload(true);}} style={{padding:"6px 14px",borderRadius:6,border:"1px solid rgba(255,255,255,0.2)",backgroundColor:"rgba(255,255,255,0.06)",color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer"}}>+ Upload Brand</button><button onClick={function(){setCompare(true);}} style={{padding:"6px 14px",borderRadius:6,border:"1px solid rgba(255,255,255,0.2)",backgroundColor:"rgba(255,255,255,0.06)",color:"#fff",fontWeight:600,fontSize:13,cursor:"pointer"}}>Compare All</button></div>
        </div>
      </div></div>
      <div style={{maxWidth:1200,margin:"0 auto",padding:"6px 16px 0",background:"#edeef0"}}><BrandStrip brandColors={brandColors} /></div>
      </div>
      {/* Dark Stroke */}
      <div style={{maxWidth:1200,margin:"0 auto",padding:"0 16px"}}><div style={{backgroundColor:"#fff",borderRadius:10,padding:"10px 14px",display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",border:"1px solid #eee"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:11,fontFamily:"'Space Mono',monospace",color:"#666",letterSpacing:"0.1em",textTransform:"uppercase"}}>Dark Stroke</span><div style={{position:"relative",width:28,height:28,borderRadius:6,backgroundColor:darkStroke,border:"2px solid #ddd",cursor:"pointer",overflow:"hidden"}}><input type="color" value={darkStroke} onChange={function(e){saveDarkStroke(e.target.value);}} style={{position:"absolute",inset:-4,width:"140%",height:"140%",cursor:"pointer",opacity:0}} /></div><span style={{fontSize:11,fontFamily:"'Space Mono',monospace",color:"#777"}}>{darkStroke.toUpperCase()}</span></div>
        {brandColors.length>0&&(<div style={{display:"flex",gap:3,alignItems:"center"}}><span style={{fontSize:10,color:"#777",fontFamily:"'Space Mono',monospace"}}>Brand:</span>{brandColors.map(function(c,i){return (<div key={i} onClick={function(){saveDarkStroke(c.hex);}} style={{width:22,height:22,borderRadius:4,backgroundColor:c.hex,border:darkStroke===c.hex?"2px solid #ff8800":"1px solid #ddd",cursor:"pointer"}} title={c.name} />);})}</div>)}
        {/* Brand dropdown + Save */}
        {Object.keys(brands).length>0&&(<div style={{display:"flex",gap:6,marginLeft:"auto",alignItems:"center"}}>
          <button onClick={savePalettes} style={{padding:"5px 12px",borderRadius:6,border:"1px solid #1a7a3d",backgroundColor:"#e8f5e9",color:"#1a7a3d",fontSize:12,fontWeight:700,cursor:"pointer"}}>Save</button>
          <div style={{position:"relative"}}>
            <button onClick={function(){setBrandDD(!brandDD);}} style={{padding:"5px 12px",borderRadius:6,border:"1px solid #ddd",backgroundColor:activeBrand?"#fff5e6":"#fff",color:"#333",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}><span>{activeBrand?brands[activeBrand].name:"Select Brand"}</span><svg width="8" height="5" viewBox="0 0 8 5" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round"><path d="M1 1l3 3 3-3" /></svg></button>
            {brandDD&&(<div><div onClick={function(){setBrandDD(false);}} style={{position:"fixed",inset:0,zIndex:39}} /><div style={{position:"absolute",top:"100%",right:0,marginTop:4,backgroundColor:"#fff",borderRadius:8,border:"1px solid #ddd",boxShadow:"0 8px 24px rgba(0,0,0,0.12)",zIndex:40,minWidth:200,overflow:"hidden"}}>
              <div onClick={function(){setActiveBrand(null);setBrandDD(false);}} style={{padding:"8px 12px",fontSize:13,color:"#666",cursor:"pointer",borderBottom:"1px solid #f0f0f0",backgroundColor:!activeBrand?"#f7f7f7":"#fff"}}>No Brand (Generic)</div>
              {Object.entries(brands).map(function(entry){var k=entry[0],v=entry[1];var isAct=activeBrand===k;return (<div key={k} style={{display:"flex",alignItems:"center",borderBottom:"1px solid #f5f5f5"}}><div onClick={function(){loadBrand(k);setBrandDD(false);}} style={{flex:1,padding:"8px 12px",fontSize:13,fontWeight:isAct?700:400,color:isAct?"#333":"#555",cursor:"pointer",backgroundColor:isAct?"#fff5e6":"#fff"}}>{v.name}<span style={{fontSize:11,color:"#777",marginLeft:6}}>{v.colors.length} colors</span></div><button onClick={function(e){e.stopPropagation();deleteBrand(k);}} style={{padding:"4px 10px",border:"none",backgroundColor:"transparent",color:"#666",fontSize:18,cursor:"pointer",lineHeight:1}}>&times;</button></div>);})}
            </div></div>)}
          </div>
        </div>)}
        {toast&&<span style={{fontSize:12,fontFamily:"'Space Mono',monospace",color:"#1a7a3d",backgroundColor:"#e8f5e9",padding:"4px 8px",borderRadius:4,fontWeight:600}}>{toast}</span>}
      </div></div>
      {/* Tabs + Rework */}
      <div style={{maxWidth:1200,margin:"8px auto 0",padding:"0 16px",display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",gap:2,backgroundColor:"#fff",borderRadius:6,padding:2,border:"1px solid #eee"}}>{["Opt 1","Opt 2","Opt 3"].map(function(lbl,i){return (<button key={i} onClick={function(){setActiveOpt(i);}} style={{padding:"5px 12px",borderRadius:4,border:"none",backgroundColor:activeOpt===i?"#333":"transparent",color:activeOpt===i?"#fff":"#888",fontWeight:activeOpt===i?700:400,fontSize:13,cursor:"pointer"}}>{lbl}</button>);})}</div>
        <div style={{display:"flex",gap:2,backgroundColor:"#fff",borderRadius:6,padding:2,border:"1px solid #eee"}}>{tabs.map(function(t){return (<button key={t.k} onClick={function(){setActiveTab(t.k);}} style={{padding:"5px 12px",borderRadius:4,border:"none",backgroundColor:activeTab===t.k?"#333":"transparent",color:activeTab===t.k?"#fff":"#888",fontWeight:activeTab===t.k?700:400,fontSize:13,cursor:"pointer"}}>{t.l}</button>);})}</div>
        <button onClick={reworkAll} style={{marginLeft:"auto",padding:"5px 14px",borderRadius:6,border:"1px solid #ddd",backgroundColor:"#fff",color:"#555",fontSize:12,fontWeight:600,cursor:"pointer"}}>Rework All Colors</button>
        <button onClick={downloadPptx} style={{padding:"5px 14px",borderRadius:6,border:"1px solid #ddd",backgroundColor:"#fff",color:"#555",fontSize:12,fontWeight:600,cursor:"pointer"}}>Download PPTX</button>
      </div>
      {/* L and D side by side */}
      <div style={{maxWidth:1200,margin:"12px auto 0",padding:"0 16px 40px"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <OptionPanel pal={cur} isDark={false} stroke="#ffffff" darkBg={darkStroke} activeTab={activeTab} onHue={function(type,id){hueShift(activeOpt,type,id);}} onLight={function(type,id){lightShift(activeOpt,type,id);}} onSelect={setSelInfo} />
          <OptionPanel pal={cur} isDark={true} stroke={darkStroke} darkBg={darkStroke} activeTab={activeTab} onHue={function(type,id){hueShift(activeOpt,type,id);}} onLight={function(type,id){lightShift(activeOpt,type,id);}} onSelect={setSelInfo} />
        </div>
        {/* Color Tables */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginTop:16}}>
          {[false,true].map(function(isDk){var label=isDk?"D Colors":"L Colors";var allSlots=[].concat(cur.categorical.map(function(s){return {hex:isDk?s.darkHex:s.lightHex};}),cur.semantic.map(function(s){return {hex:isDk?s.darkHex:s.lightHex};}),cur.deemphasis.map(function(s){return {hex:isDk?s.darkHex:s.lightHex};}));
            var cmykData=allSlots.map(function(s){var rgb=h2r(s.hex);var pms=findPMS(s.hex);return pms||r2cmyk(rgb.r,rgb.g,rgb.b);});
            function copyHexes(){var txt=allSlots.map(function(s){return s.hex.toUpperCase();}).join("\n");navigator.clipboard.writeText(txt);show("Hex values copied!");}
            function copyCMYK(){var txt=cmykData.map(function(ck){return ck.c+"\t"+ck.m+"\t"+ck.y+"\t"+ck.k;}).join("\n");navigator.clipboard.writeText(txt);show("CMYK values copied!");}
            var copyIcon=<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="1" width="10" height="10" rx="2" /><path d="M5 5h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5" /></svg>;
            var copyBtnStyle={border:"none",backgroundColor:"transparent",color:"#777",cursor:"pointer",padding:2,display:"inline-flex",alignItems:"center",verticalAlign:"middle",marginLeft:3};
            return (<div key={isDk?"dt":"lt"}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <div style={{fontSize:14,fontWeight:700,fontFamily:"'Space Mono',monospace",color:"#555"}}>{label}</div>
                <button onClick={function(){setPptModal(isDk);}} style={{padding:"3px 10px",borderRadius:4,border:"1px solid #ddd",backgroundColor:"#fff",color:"#666",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Space Mono',monospace"}}>Copy PPT XML</button>
              </div><table style={{width:"100%",borderCollapse:"collapse",fontFamily:"'Space Mono',monospace",fontSize:11}}><thead><tr style={{borderBottom:"2px solid #333"}}><th style={{textAlign:"left",padding:"4px 6px",color:"#666",fontSize:10}}></th><th style={{textAlign:"left",padding:"4px 6px",color:"#666",fontSize:10}}>Hex<button onClick={copyHexes} style={copyBtnStyle} title="Copy all hex values">{copyIcon}</button></th><th style={{textAlign:"center",padding:"4px 4px",color:"#666",fontSize:10}}>C</th><th style={{textAlign:"center",padding:"4px 4px",color:"#666",fontSize:10}}>M</th><th style={{textAlign:"center",padding:"4px 4px",color:"#666",fontSize:10}}>Y</th><th style={{textAlign:"center",padding:"4px 4px",color:"#666",fontSize:10}}>K<button onClick={copyCMYK} style={copyBtnStyle} title="Copy all CMYK values">{copyIcon}</button></th></tr></thead><tbody>{allSlots.map(function(s,i){var ck=cmykData[i];return (<tr key={i} style={{borderBottom:"1px solid #eee"}}><td style={{padding:"4px 6px"}}><div style={{width:20,height:20,borderRadius:4,backgroundColor:s.hex,border:"1px solid #ddd"}} /></td><td style={{padding:"4px 6px",fontWeight:700,color:"#222"}}>{s.hex.toUpperCase()}</td><td style={{padding:"4px 4px",textAlign:"center",color:"#555"}}>{ck.c}</td><td style={{padding:"4px 4px",textAlign:"center",color:"#555"}}>{ck.m}</td><td style={{padding:"4px 4px",textAlign:"center",color:"#555"}}>{ck.y}</td><td style={{padding:"4px 4px",textAlign:"center",color:"#555"}}>{ck.k}</td></tr>);})}</tbody></table></div>);
          })}
        </div>
        <div style={{marginTop:10,fontSize:11,color:"#777",fontFamily:"'Space Mono',monospace",textAlign:"center"}}>PMS Bridge Coated CMYK used where available. All colors WCAG AA 4.5:1.</div>
      </div>
      {/* Upload Modal */}
      {showUpload&&(<div style={{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backgroundColor:"rgba(0,0,0,0.5)",backdropFilter:"blur(5px)"}} onClick={function(){setShowUpload(false);}}>
        <div style={{backgroundColor:"#fff",borderRadius:12,maxWidth:380,width:"100%",padding:20,boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}} onClick={function(e){e.stopPropagation();}}>
          <h2 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,marginBottom:12}}>Upload Brand</h2>
          <p style={{fontSize:14,color:"#666",marginBottom:12}}>CSV/TSV with Name + Hex columns.</p>
          <input type="text" placeholder="Brand name" value={uploadName} onChange={function(e){setUploadName(e.target.value);}} style={{width:"100%",padding:"7px 10px",borderRadius:6,border:"1px solid #ddd",fontSize:15,marginBottom:8,boxSizing:"border-box"}} />
          <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" style={{display:"none"}} onChange={function(e){if(e.target.files&&e.target.files[0])handleUpload(e.target.files[0]);}} />
          <div style={{display:"flex",gap:6}}><button onClick={function(){if(uploadName.trim())fileRef.current.click();else show("Enter a name");}} style={{flex:1,padding:9,borderRadius:7,border:"none",backgroundColor:uploadName.trim()?"#222":"#ccc",color:"#fff",fontWeight:700,fontSize:14,cursor:uploadName.trim()?"pointer":"not-allowed"}}>Choose File</button><button onClick={function(){setShowUpload(false);}} style={{padding:"9px 14px",borderRadius:7,border:"1px solid #ddd",backgroundColor:"#fff",color:"#666",fontWeight:600,fontSize:14,cursor:"pointer"}}>Cancel</button></div>
        </div>
      </div>)}

      {/* PPT XML Modal */}
      {pptModal!==null&&(<div style={{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backgroundColor:"rgba(0,0,0,0.5)",backdropFilter:"blur(5px)"}} onClick={function(){setPptModal(null);}}>
        <div style={{backgroundColor:"#fff",borderRadius:12,maxWidth:320,width:"100%",padding:24,boxShadow:"0 20px 60px rgba(0,0,0,0.3)",textAlign:"center"}} onClick={function(e){e.stopPropagation();}}>
          <h3 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,marginBottom:6}}>PPT Custom Colors</h3>
          <p style={{fontSize:13,color:"#666",marginBottom:16,fontFamily:"'Space Mono',monospace"}}>Do you want Spectrum colors?</p>
          <div style={{display:"flex",gap:8,justifyContent:"center"}}>
            <button onClick={function(){copyPptXml(pptModal,true);}} style={{flex:1,padding:"10px 16px",borderRadius:7,border:"none",backgroundColor:"#333",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>Yes</button>
            <button onClick={function(){copyPptXml(pptModal,false);}} style={{flex:1,padding:"10px 16px",borderRadius:7,border:"1px solid #ddd",backgroundColor:"#fff",color:"#333",fontWeight:700,fontSize:14,cursor:"pointer"}}>No</button>
          </div>
          <button onClick={function(){setPptModal(null);}} style={{marginTop:10,border:"none",backgroundColor:"transparent",color:"#777",fontSize:12,cursor:"pointer"}}>Cancel</button>
        </div>
      </div>)}

      {selInfo&&<ColorDetail info={selInfo} onClose={function(){setSelInfo(null);}} onSetHSL={setSlotHSL} brandColors={brandColors} />}
    </div>
  );
}
