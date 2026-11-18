/**
 * 32-Bit 高精微像素人物模型与 64 件全披挂五部位实时纸娃娃换装引擎 (src/assets/heroModelEngine.js)
 *
 * 精雕升级版 v2：
 * 1. 【88x94 超高密度微像素画布】（单像素 = 0.5 世界逻辑单位，逻辑尺寸 44x47）：
 *    采用经典街机/横版动作英雄比例（宽肩劲腰 V 字武侠体态、独立脖颈立领、屈肘抱拳/立掌佛印武术架势、
 *    分片式左右甲裙+前悬战摆结构），告别呆板柱状直筒轮廓！
 * 2. 【全像素化动态披风/双雉鸡翎/金猴尾/混天仙绸/龙鬃】：
 *    将披风褶皱、齐天双长翎、卷尾猴尾、白龙银鬃刘海、飞仙披帛直接以纯正微像素逐帧烘焙进 11 个动作帧，
 *    拒绝廉价矢量线条割裂感，连冲刺残影与毫毛分身也完整保留全套披挂羽翎细节！
 * 3. 【全 5 大部位 × 64 款西游装备独立纸娃娃贴图 (Paper-Doll)】：
 *    神兵(13+5本命) + 冠冕(13) + 宝甲(13) + 步履(12) + 灵饰(13) 全部拥有独立像素造型与材质着色器。
 */
(function (name, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require);
  } else {
    const root = typeof globalThis !== 'undefined' ? globalThis : window;
    root.XiyouRegistry = root.XiyouRegistry || {};
    root.XiyouRegistry[name] = factory(function (relPath) {
      const modName = relPath.split('/').pop().replace(/\.js$/, '');
      return root.XiyouRegistry[modName];
    });
  }
})('heroModelEngine', function (require) {
  const Env = require('../platform/env');

  const HERO_W = 88;
  const HERO_H = 94;
  const HERO_LOGICAL_W = 44;
  const HERO_LOGICAL_H = 47;

  // ==================== 颜色解析与高速缓存 ====================
  const _rgbaCache = {};
  const _rgbObjCache = {};
  const _shadeCache = {};

  function parseRGB(hex) {
    if (!hex) return { r: 0, g: 0, b: 0 };
    if (_rgbObjCache[hex]) return _rgbObjCache[hex];
    let s = hex.charAt(0) === '#' ? hex.slice(1) : hex;
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    const n = parseInt(s, 16) || 0;
    const obj = { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    _rgbObjCache[hex] = obj;
    return obj;
  }

  function toHex(r, g, b) {
    const cr = Math.max(0, Math.min(255, Math.round(r)));
    const cg = Math.max(0, Math.min(255, Math.round(g)));
    const cb = Math.max(0, Math.min(255, Math.round(b)));
    return '#' + ((1 << 24) | (cr << 16) | (cg << 8) | cb).toString(16).slice(1);
  }

  function packRGBA(hex, alpha) {
    const a = alpha === undefined ? 255 : alpha;
    const key = a === 255 ? hex : `${hex}_${a}`;
    if (_rgbaCache[key] !== undefined) return _rgbaCache[key];
    const { r, g, b } = parseRGB(hex);
    const packed = ((a & 255) << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255);
    _rgbaCache[key] = packed >>> 0;
    return _rgbaCache[key];
  }

  function shade(hex, delta) {
    const key = `${hex}|${delta}`;
    if (_shadeCache[key]) return _shadeCache[key];
    const { r, g, b } = parseRGB(hex);
    let nr, ng, nb;
    if (delta >= 0) {
      nr = r + (255 - r) * delta;
      ng = g + (255 - g) * delta;
      nb = b + (255 - b) * delta;
    } else {
      const f = Math.max(0, 1 + delta);
      nr = r * f;
      ng = g * f;
      nb = b * f;
    }
    const res = toHex(nr, ng, nb);
    _shadeCache[key] = res;
    return res;
  }

  // ==================== 微像素分层软件光栅画布 (MicroCanvas) ====================
  class MicroCanvas {
    constructor(w, h) {
      this.w = w;
      this.h = h;
      this.u32 = new Uint32Array(w * h);
      this.hexGrid = new Array(w * h).fill(null);
      this.layer = new Uint16Array(w * h);
      this.curLayer = 1;
    }

    beginLayer() {
      this.curLayer++;
      return this.curLayer;
    }

    clearCircle(cx, cy, r) {
      const rSq = r * r;
      for (let py = Math.floor(cy - r); py <= Math.ceil(cy + r); py++) {
        for (let px = Math.floor(cx - r); px <= Math.ceil(cx + r); px++) {
          if (px >= 0 && px < this.w && py >= 0 && py < this.h) {
            if ((px - cx) * (px - cx) + (py - cy) * (py - cy) <= rSq) {
              const idx = py * this.w + px;
              this.u32[idx] = 0;
              this.hexGrid[idx] = null;
              this.layer[idx] = 0;
            }
          }
        }
      }
    }

    pset(x, y, hex) {
      const ix = Math.round(x);
      const iy = Math.round(y);
      if (ix < 0 || ix >= this.w || iy < 0 || iy >= this.h || !hex) return;
      const idx = iy * this.w + ix;
      this.u32[idx] = packRGBA(hex, 255);
      this.hexGrid[idx] = hex;
      this.layer[idx] = this.curLayer;
    }

    hline(x0, x1, y, hex) {
      const iy = Math.round(y);
      if (iy < 0 || iy >= this.h) return;
      const a = Math.max(0, Math.round(Math.min(x0, x1)));
      const b = Math.min(this.w - 1, Math.round(Math.max(x0, x1)));
      for (let x = a; x <= b; x++) this.pset(x, iy, hex);
    }

    vline(x, y0, y1, hex) {
      const ix = Math.round(x);
      if (ix < 0 || ix >= this.w) return;
      const a = Math.max(0, Math.round(Math.min(y0, y1)));
      const b = Math.min(this.h - 1, Math.round(Math.max(y0, y1)));
      for (let y = a; y <= b; y++) this.pset(ix, y, hex);
    }

    rect(x, y, w, h, hexOrFn) {
      const x0 = Math.round(x);
      const y0 = Math.round(y);
      const x1 = Math.round(x + w - 1);
      const y1 = Math.round(y + h - 1);
      const isFn = typeof hexOrFn === 'function';
      for (let py = y0; py <= y1; py++) {
        for (let px = x0; px <= x1; px++) {
          const nx = w > 1 ? ((px - x0) / (w - 1)) * 2 - 1 : 0;
          const ny = h > 1 ? ((py - y0) / (h - 1)) * 2 - 1 : 0;
          const col = isFn ? hexOrFn(px, py, nx, ny) : hexOrFn;
          if (col) this.pset(px, py, col);
        }
      }
    }

    line(x0, y0, x1, y1, hex, radius) {
      let ix0 = Math.round(x0);
      let iy0 = Math.round(y0);
      const ix1 = Math.round(x1);
      const iy1 = Math.round(y1);
      const dx = Math.abs(ix1 - ix0);
      const sx = ix0 < ix1 ? 1 : -1;
      const dy = -Math.abs(iy1 - iy0);
      const sy = iy0 < iy1 ? 1 : -1;
      let err = dx + dy;
      const r = radius || 0;
      while (true) {
        if (r <= 0) {
          this.pset(ix0, iy0, hex);
        } else {
          for (let oy = -r; oy <= r; oy++) {
            for (let ox = -r; ox <= r; ox++) {
              if (ox * ox + oy * oy <= r * r + 0.4) {
                this.pset(ix0 + ox, iy0 + oy, hex);
              }
            }
          }
        }
        if (ix0 === ix1 && iy0 === iy1) break;
        const e2 = 2 * err;
        if (e2 >= dy) {
          err += dy;
          ix0 += sx;
        }
        if (e2 <= dx) {
          err += dx;
          iy0 += sy;
        }
      }
    }

    curve(x0, y0, cx, cy, x1, y1, hex, radius) {
      const steps = Math.max(14, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.9));
      let px = x0;
      let py = y0;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const mt = 1 - t;
        const nx = mt * mt * x0 + 2 * mt * t * cx + t * t * x1;
        const ny = mt * mt * y0 + 2 * mt * t * cy + t * t * y1;
        this.line(px, py, nx, ny, hex, radius || 0);
        px = nx;
        py = ny;
      }
    }

    ellipse(cx, cy, rx, ry, hexOrFn) {
      const x0 = Math.floor(cx - rx);
      const x1 = Math.ceil(cx + rx);
      const y0 = Math.floor(cy - ry);
      const y1 = Math.ceil(cy + ry);
      const isFn = typeof hexOrFn === 'function';
      const invRx = 1 / Math.max(0.5, rx);
      const invRy = 1 / Math.max(0.5, ry);
      for (let py = y0; py <= y1; py++) {
        for (let px = x0; px <= x1; px++) {
          const nx = (px - cx) * invRx;
          const ny = (py - cy) * invRy;
          if (nx * nx + ny * ny <= 1.02) {
            const col = isFn ? hexOrFn(px, py, nx, ny) : hexOrFn;
            if (col) this.pset(px, py, col);
          }
        }
      }
    }

    trapezoid(y0, y1, topL, topR, botL, botR, hexOrFn) {
      const sy0 = Math.round(Math.min(y0, y1));
      const sy1 = Math.round(Math.max(y0, y1));
      const span = Math.max(1, sy1 - sy0);
      const isFn = typeof hexOrFn === 'function';
      for (let py = sy0; py <= sy1; py++) {
        const t = (py - sy0) / span;
        const xl = Math.round(topL + (botL - topL) * t);
        const xr = Math.round(topR + (botR - topR) * t);
        const rowW = Math.max(1, xr - xl);
        for (let px = xl; px <= xr; px++) {
          const nx = rowW > 0 ? ((px - xl) / rowW) * 2 - 1 : 0;
          const ny = t * 2 - 1;
          const col = isFn ? hexOrFn(px, py, nx, ny, t) : hexOrFn;
          if (col) this.pset(px, py, col);
        }
      }
    }

    limb(x0, y0, x1, y1, r0, r1, hexOrFn) {
      const minX = Math.floor(Math.min(x0, x1) - Math.max(r0, r1) - 1);
      const maxX = Math.ceil(Math.max(x0, x1) + Math.max(r0, r1) + 1);
      const minY = Math.floor(Math.min(y0, y1) - Math.max(r0, r1) - 1);
      const maxY = Math.ceil(Math.max(y0, y1) + Math.max(r0, r1) + 1);
      const vx = x1 - x0;
      const vy = y1 - y0;
      const lenSq = Math.max(0.01, vx * vx + vy * vy);
      const isFn = typeof hexOrFn === 'function';

      for (let py = minY; py <= maxY; py++) {
        for (let px = minX; px <= maxX; px++) {
          const t = Math.max(0, Math.min(1, ((px - x0) * vx + (py - y0) * vy) / lenSq));
          const cx = x0 + vx * t;
          const cy = y0 + vy * t;
          const rad = Math.max(0.8, r0 + (r1 - r0) * t);
          const dx = px - cx;
          const dy = py - cy;
          if (dx * dx + dy * dy <= rad * rad) {
            const col = isFn ? hexOrFn(px, py, dx / rad, dy / rad, t) : hexOrFn;
            if (col) this.pset(px, py, col);
          }
        }
      }
    }

    outlineLayer(outerDark, outerLight, innerCrease) {
      const target = this.curLayer;
      const w = this.w;
      const h = this.h;
      const outDark = outerDark || '#120b18';
      const outTop = outerLight || '#22162d';
      const writes = [];

      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          if (this.layer[idx] !== target) continue;
          const dirs = [
            [x - 1, y, true],
            [x + 1, y, false],
            [x, y - 1, true],
            [x, y + 1, false]
          ];
          for (let d = 0; d < 4; d++) {
            const nx = dirs[d][0];
            const ny = dirs[d][1];
            const isTopLeft = dirs[d][2];
            const nIdx = ny * w + nx;
            const nLayer = this.layer[nIdx];
            if (nLayer === 0) {
              writes.push([nx, ny, isTopLeft ? outTop : outDark]);
            } else if (innerCrease && nLayer < target && !isTopLeft) {
              const underHex = this.hexGrid[nIdx];
              if (underHex && underHex !== outDark && underHex !== outTop) {
                writes.push([nx, ny, shade(underHex, -0.44)]);
              }
            }
          }
        }
      }

      for (let i = 0; i < writes.length; i++) {
        const [wx, wy, wc] = writes[i];
        const idx = wy * w + wx;
        this.u32[idx] = packRGBA(wc, 255);
        this.hexGrid[idx] = wc;
        this.layer[idx] = target;
      }
    }

    toCanvas(pixelScale, logicalW, logicalH, whiteFlash) {
      const sc = Math.max(1, Math.round(pixelScale || 1));
      const cw = this.w * sc;
      const ch = this.h * sc;
      const canvas = Env.createOffscreenCanvas(cw, ch);
      canvas._logicalW = logicalW !== undefined ? logicalW : this.w * 0.5;
      canvas._logicalH = logicalH !== undefined ? logicalH : this.h * 0.5;
      const ctx = canvas.getContext && canvas.getContext('2d');
      if (!ctx) return canvas;
      ctx.imageSmoothingEnabled = false;

      if (sc === 1 && !whiteFlash && typeof ctx.createImageData === 'function') {
        const imgData = ctx.createImageData(this.w, this.h);
        new Uint32Array(imgData.data.buffer).set(this.u32);
        ctx.putImageData(imgData, 0, 0);
        return canvas;
      }

      if (!whiteFlash && sc > 1 && typeof ctx.createImageData === 'function') {
        const tmp = Env.createOffscreenCanvas(this.w, this.h);
        const tctx = tmp.getContext && tmp.getContext('2d');
        if (tctx && typeof tctx.createImageData === 'function') {
          const imgData = tctx.createImageData(this.w, this.h);
          new Uint32Array(imgData.data.buffer).set(this.u32);
          tctx.putImageData(imgData, 0, 0);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(tmp, 0, 0, cw, ch);
          return canvas;
        }
      }

      for (let y = 0; y < this.h; y++) {
        let x = 0;
        while (x < this.w) {
          const col = this.hexGrid[y * this.w + x];
          if (!col) {
            x++;
            continue;
          }
          const drawCol = whiteFlash ? '#ffffff' : col;
          let endX = x + 1;
          while (endX < this.w && this.hexGrid[y * this.w + endX] === col) endX++;
          ctx.fillStyle = drawCol;
          ctx.fillRect(x * sc, y * sc, (endX - x) * sc, sc);
          x = endX;
        }
      }
      return canvas;
    }
  }

  // ==================== 像素材质微纹理着色器库 ====================
  function makeToneShader(baseHex, hiBoost, darkDrop) {
    const hi = shade(baseHex, hiBoost !== undefined ? hiBoost : 0.28);
    const mid = baseHex;
    const sh = shade(baseHex, -(darkDrop !== undefined ? darkDrop : 0.24));
    const deep = shade(baseHex, -(darkDrop !== undefined ? darkDrop * 1.65 : 0.42));
    return function (px, py, nx, ny) {
      const lit = -nx * 0.62 - ny * 0.52;
      const dither = ((px + py) & 1) * 0.08;
      const v = lit + dither;
      if (v > 0.34) return hi;
      if (v > -0.14) return mid;
      if (v > -0.48) return sh;
      return deep;
    };
  }

  function makeScaleShader(hiHex, brightHex, midHex, darkHex, deepHex) {
    return function (px, py, nx, ny) {
      const lit = -nx * 0.55 - ny * 0.45;
      const isScale = (px + (Math.floor(py / 2) & 1) * 2) % 4 === 1 && py % 2 === 0;
      if (isScale) return lit > 0.05 ? hiHex : brightHex;
      if (lit > 0.26) return brightHex;
      if (lit > -0.12) return midHex;
      if (lit > -0.42) return darkHex;
      return deepHex;
    };
  }

  const goldenMailShader = makeScaleShader('#ffffff', '#fff3b0', '#ffd60a', '#d9822b', '#7f4807');
  const mountainPlateShader = makeScaleShader('#ffffff', '#ced4da', '#6c757d', '#495057', '#22252f');
  const dragonScaleShader = makeScaleShader('#ffffff', '#80ffdb', '#48cae4', '#0077b6', '#03045e');
  const quicksandScaleShader = makeScaleShader('#90e0ef', '#48cae4', '#1d4e68', '#143147', '#0b1929');
  const bullDemonPlateShader = makeScaleShader('#ffd166', '#e63946', '#6a040f', '#370617', '#1a050b');
  const tianpengPlateShader = makeScaleShader('#80ffdb', '#ffd166', '#3d405b', '#22223b', '#121224');

  function kasayaBrocadeShader(px, py, nx, ny) {
    const isGoldGrid = px % 5 === 0 || py % 5 === 0;
    const lit = -nx * 0.52 - ny * 0.4;
    if (isGoldGrid) return lit > 0.1 ? '#fff3b0' : lit > -0.25 ? '#ffd166' : '#c98a18';
    const fold = Math.sin(px * 0.85 + py * 0.25) * 0.14;
    const v = lit + fold;
    if (v > 0.25) return '#ff4d6d';
    if (v > -0.15) return '#e01e37';
    if (v > -0.42) return '#a4133c';
    return '#6a040f';
  }

  function spiderWebShader(px, py, nx, ny) {
    const web = (px + py) % 4 === 0 || (px - py + 32) % 5 === 0;
    const lit = -nx * 0.5 - ny * 0.4;
    if (web && lit > -0.2) return '#ff9ebb';
    if (lit > 0.2) return '#f72585';
    if (lit > -0.2) return '#b5179e';
    return '#480ca8';
  }

  function flameCloudShader(px, py, nx, ny) {
    const wave = Math.sin(px * 0.7 + py * 0.5) > 0.45;
    const lit = -nx * 0.5 - ny * 0.45;
    if (wave && lit > -0.1) return '#ffd166';
    if (lit > 0.22) return '#ff6e40';
    if (lit > -0.2) return '#dc2f02';
    return '#6a040f';
  }

  function tigerKiltShader(px, py, nx, ny, tY) {
    if (tY !== undefined && tY > 0.8) {
      return ((px + py) & 1) === 0 ? '#fff8e7' : '#ffe5b4';
    }
    const stripe = (px * 2 + py) % 8 === 0 || (px * 2 - py + 40) % 10 === 0;
    if (stripe && Math.abs(nx) < 0.85) return '#24140e';
    const lit = -nx * 0.5 - ny * 0.3;
    if (lit > 0.2) return '#ffb703';
    if (lit > -0.2) return '#fb8500';
    return '#c85a00';
  }

  // ==================== 11 帧武术骨骼关键帧（含披风波浪相位 capePhase） ====================
  const POSES = {
    idle0: { leanX: 0, torsoDy: 0, headDy: 0, backFoot: { dx: -8, y: 91 }, frontFoot: { dx: 8, y: 91 }, nearHand: { dx: -9, dy: 11 }, farHand: { dx: 12, dy: 6 }, skirtFlare: 1, capeWave: 0, fierce: false },
    idle1: { leanX: 0, torsoDy: -1, headDy: -1, backFoot: { dx: -8, y: 91 }, frontFoot: { dx: 8, y: 91 }, nearHand: { dx: -10, dy: 10 }, farHand: { dx: 12, dy: 5 }, skirtFlare: 2, capeWave: 2, fierce: false },
    run0: { leanX: 3, torsoDy: 1, headDy: 1, backFoot: { dx: -15, y: 85 }, frontFoot: { dx: 13, y: 90 }, nearHand: { dx: 9, dy: 8 }, farHand: { dx: -10, dy: 9 }, skirtFlare: 5, capeWave: 5, fierce: false },
    run1: { leanX: 2, torsoDy: 2, headDy: 2, backFoot: { dx: -4, y: 91 }, frontFoot: { dx: 6, y: 89 }, nearHand: { dx: 1, dy: 11 }, farHand: { dx: 7, dy: 7 }, skirtFlare: 2, capeWave: 3, fierce: false },
    run2: { leanX: 3, torsoDy: 0, headDy: 0, backFoot: { dx: 12, y: 90 }, frontFoot: { dx: -14, y: 85 }, nearHand: { dx: -14, dy: 7 }, farHand: { dx: 14, dy: 5 }, skirtFlare: 5, capeWave: -3, fierce: false },
    run3: { leanX: 2, torsoDy: -2, headDy: -2, backFoot: { dx: 5, y: 88 }, frontFoot: { dx: -6, y: 90 }, nearHand: { dx: -8, dy: 9 }, farHand: { dx: 10, dy: 6 }, skirtFlare: 3, capeWave: 4, fierce: false },
    jump: { leanX: 2, torsoDy: -3, headDy: -3, backFoot: { dx: -9, y: 88 }, frontFoot: { dx: 10, y: 80 }, nearHand: { dx: -13, dy: 4 }, farHand: { dx: 13, dy: 2 }, skirtFlare: 4, capeWave: 6, fierce: false },
    fall: { leanX: 1, torsoDy: -1, headDy: -1, backFoot: { dx: -11, y: 84 }, frontFoot: { dx: 11, y: 86 }, nearHand: { dx: -15, dy: -2 }, farHand: { dx: 14, dy: 1 }, skirtFlare: 6, capeWave: -5, fierce: true },
    attack0: { leanX: 4, torsoDy: 1, headDy: 1, backFoot: { dx: -13, y: 91 }, frontFoot: { dx: 13, y: 91 }, nearHand: { dx: -12, dy: 7 }, farHand: { dx: 17, dy: 3 }, skirtFlare: 5, capeWave: 6, fierce: true },
    attack1: { leanX: 3, torsoDy: -1, headDy: -1, backFoot: { dx: -9, y: 91 }, frontFoot: { dx: 11, y: 89 }, nearHand: { dx: -11, dy: 9 }, farHand: { dx: 15, dy: -4 }, skirtFlare: 4, capeWave: 4, fierce: true },
    attack2: { leanX: 6, torsoDy: 2, headDy: 2, backFoot: { dx: -15, y: 91 }, frontFoot: { dx: 15, y: 91 }, nearHand: { dx: -13, dy: 5 }, farHand: { dx: 19, dy: 5 }, skirtFlare: 6, capeWave: 7, fierce: true }
  };

  // ==================== 五大主角英雄比例解剖参数（宽肩劲腰 V 字武侠体态） ====================
  const HERO_BUILDS = {
    wukong: {
      cx: 46, shoulderW: 11.2, waistW: 7.4, torsoTop: 42, torsoBot: 61, headCy: 30, headRx: 9.6, headRy: 9.5,
      skin: '#ffcb77', bootMain: '#1d1e2c', bootTrim: '#48cae4', sole: '#ffd166', pants: '#7f1d1d'
    },
    tangseng: {
      cx: 46, shoulderW: 10.8, waistW: 7.8, torsoTop: 40, torsoBot: 61, headCy: 28, headRx: 9.2, headRy: 9.8,
      skin: '#ffe5d9', bootMain: '#2b2d42', bootTrim: '#f8f9fa', sole: '#e9c46a', pants: '#f8f9fa'
    },
    bajie: {
      cx: 45, shoulderW: 14.2, waistW: 13.2, torsoTop: 41, torsoBot: 63, headCy: 29, headRx: 11.2, headRy: 10.2,
      skin: '#ffb3c1', bootMain: '#1d3557', bootTrim: '#4ea8de', sole: '#adb5bd', pants: '#22223b'
    },
    wujing: {
      cx: 46, shoulderW: 13.2, waistW: 9.4, torsoTop: 40, torsoBot: 61, headCy: 28, headRx: 10.0, headRy: 9.8,
      skin: '#d49a6a', bootMain: '#1b263b', bootTrim: '#ffd166', sole: '#adb5bd', pants: '#3c096c'
    },
    bailongma: {
      cx: 46, shoulderW: 11.5, waistW: 7.6, torsoTop: 40, torsoBot: 61, headCy: 28, headRx: 9.4, headRy: 9.6,
      skin: '#fff0e6', bootMain: '#023e8a', bootTrim: '#90e0ef', sole: '#caf0f8', pants: '#03045e'
    }
  };

  const BOOTS_VISUALS = {
    straw_sandals: { pants: '#f8f9fa', boot: '#d4a373', trim: '#e9c46a', sole: '#99582a', wing: null },
    wolf_leather_boots: { pants: '#495057', boot: '#6f4518', trim: '#ced4da', sole: '#343a40', wing: null },
    iron_greaves: { pants: '#2b2d42', boot: '#495057', trim: '#dee2e6', sole: '#adb5bd', wing: null },
    sand_walker_boots: { pants: '#7f5539', boot: '#e09f3e', trim: '#4cc9f0', sole: '#ffd166', wing: null },
    bone_shadow_boots: { pants: '#240046', boot: '#3c096c', trim: '#f8f9fa', sole: '#80ffdb', wing: '#80ffdb' },
    frost_tread_boots: { pants: '#1d3557', boot: '#48cae4', trim: '#ffffff', sole: '#caf0f8', wing: '#caf0f8' },
    abyss_water_boots: { pants: '#0b2545', boot: '#0077b6', trim: '#80ffdb', sole: '#ffd166', wing: null },
    tide_dragon_boots: { pants: '#03045e', boot: '#00b4d8', trim: '#ffffff', sole: '#80ffdb', wing: '#00f5d4' },
    wind_fire_boots: { pants: '#6a040f', boot: '#dc2f02', trim: '#ffd60a', sole: '#ff9f1c', wing: '#ffd60a' },
    cloud_silk_boots: { pants: '#1b1b2f', boot: '#22223b', trim: '#48cae4', sole: '#ffd60a', wing: '#ffd60a' },
    tianpeng_war_boots: { pants: '#1d1e2c', boot: '#3d405b', trim: '#69f0ae', sole: '#ffd166', wing: null },
    golden_lotus_shoes: { pants: '#ffffff', boot: '#ffd166', trim: '#ff4d6d', sole: '#fff3b0', wing: '#ff758f' }
  };

  const PREVIEW_OUTFIT_SETS = [
    { id: 'default', label: '本命原装', equipped: { helm: null, armor: null, boots: null, weapon: null, accessory: null } },
    {
      id: 'set_dasheng', label: '齐天大圣套',
      equipped: {
        helm: { templateId: 'phoenix_crown', setId: 'set_dasheng', rarityIndex: 4, rarityColor: '#ffd60a' },
        armor: { templateId: 'golden_mail', setId: 'set_dasheng', rarityIndex: 4, rarityColor: '#ffd60a' },
        boots: { templateId: 'cloud_silk_boots', setId: 'set_dasheng', rarityIndex: 4, rarityColor: '#ffd60a' },
        weapon: { templateId: 'ruyi_jingu_staff', setId: 'set_dasheng', rarityIndex: 4, rarityColor: '#ffd60a' },
        accessory: { templateId: 'golden_fillet_ring', setId: 'set_dasheng', rarityIndex: 4, rarityColor: '#ffd60a' }
      }
    },
    {
      id: 'set_fotuo', label: '锦襕佛陀套',
      equipped: {
        helm: { templateId: 'dharma_hat', setId: 'set_fotuo', rarityIndex: 4, rarityColor: '#ffd60a' },
        armor: { templateId: 'kasaya_robe', setId: 'set_fotuo', rarityIndex: 4, rarityColor: '#ffd60a' },
        boots: { templateId: 'golden_lotus_shoes', setId: 'set_fotuo', rarityIndex: 4, rarityColor: '#ffd60a' },
        weapon: { templateId: 'nine_ring_staff', setId: 'set_fotuo', rarityIndex: 4, rarityColor: '#ffd60a' },
        accessory: { templateId: 'relic_ring', setId: 'set_fotuo', rarityIndex: 4, rarityColor: '#ffd60a' }
      }
    },
    {
      id: 'set_pingtian', label: '平天魔尊套',
      equipped: {
        helm: { templateId: 'bull_horn_helm', setId: 'set_pingtian', rarityIndex: 5, rarityColor: '#ff2a54' },
        armor: { templateId: 'bull_demon_plate', setId: 'set_pingtian', rarityIndex: 5, rarityColor: '#ff2a54' },
        boots: { templateId: 'wind_fire_boots', setId: 'set_pingtian', rarityIndex: 5, rarityColor: '#ff2a54' },
        weapon: { templateId: 'trident_halberd', setId: 'set_pingtian', rarityIndex: 5, rarityColor: '#ff2a54' },
        accessory: { templateId: 'iron_fan_pendant', setId: 'set_pingtian', rarityIndex: 5, rarityColor: '#ff2a54' }
      }
    },
    {
      id: 'set_taiqing', label: '兜率太清套',
      equipped: {
        helm: { templateId: 'taiqing_lotus_cap', setId: 'set_taiqing', rarityIndex: 3, rarityColor: '#c77dff' },
        armor: { templateId: 'bagua_dao_robe', setId: 'set_taiqing', rarityIndex: 3, rarityColor: '#c77dff' },
        boots: { templateId: 'frost_tread_boots', setId: 'set_taiqing', rarityIndex: 3, rarityColor: '#c77dff' },
        weapon: { templateId: 'seven_star_sword', setId: 'set_taiqing', rarityIndex: 3, rarityColor: '#c77dff' },
        accessory: { templateId: 'jingang_jade_bangle', setId: 'set_taiqing', rarityIndex: 3, rarityColor: '#c77dff' }
      }
    },
    {
      id: 'set_zhenlong', label: '西海真龙套',
      equipped: {
        helm: { templateId: 'coral_dragon_crown', setId: 'set_zhenlong', rarityIndex: 4, rarityColor: '#00f5d4' },
        armor: { templateId: 'dragon_scale', setId: 'set_zhenlong', rarityIndex: 4, rarityColor: '#00f5d4' },
        boots: { templateId: 'tide_dragon_boots', setId: 'set_zhenlong', rarityIndex: 4, rarityColor: '#00f5d4' },
        weapon: { templateId: 'dragon_frost_lance', setId: 'set_zhenlong', rarityIndex: 4, rarityColor: '#00f5d4' },
        accessory: { templateId: 'ocean_heart_pearl', setId: 'set_zhenlong', rarityIndex: 4, rarityColor: '#00f5d4' }
      }
    },
    {
      id: 'wanderer_kasa', label: '竹笠行者套',
      equipped: {
        helm: { templateId: 'monk_bamboo_hat', rarityIndex: 2, rarityColor: '#4cc9f0' },
        armor: { templateId: 'tiger_skin_kilt', rarityIndex: 2, rarityColor: '#4cc9f0' },
        boots: { templateId: 'straw_sandals', rarityIndex: 2, rarityColor: '#4cc9f0' },
        weapon: { templateId: 'demon_sabre', rarityIndex: 2, rarityColor: '#4cc9f0' },
        accessory: { templateId: 'wood_prayer_beads', rarityIndex: 2, rarityColor: '#4cc9f0' }
      }
    }
  ];

  // ==================== 0. 全像素烘焙背饰层（披风褶皱 / 金猴尾 / 飞仙披帛 / 双长雉鸡翎） ====================
  function drawPixelBackCapeAndPlumes(mc, heroId, build, pose, helmId, armorId) {
    const cx = Math.round(build.cx + pose.leanX * 0.55);
    const topY = build.torsoTop + pose.torsoDy;
    const hcx = Math.round(build.cx + pose.leanX * 0.8);
    const hcy = Math.round(build.headCy + pose.headDy);
    const wave = pose.capeWave || 0;

    // A. 宝甲专属像素级飘动披风 / 飞仙混天披帛
    const CAPE_DEFS = {
      golden_mail: ['#b5172c', '#ffd60a'],
      bull_demon_plate: ['#590209', '#ff4d6d'],
      flame_robe: ['#dc2f02', '#ffd166'],
      tianpeng_armor: ['#1d1e2c', '#69f0ae'],
      mountain_plate: ['#343a40', '#adb5bd'],
      dragon_scale: ['#0077b6', '#80ffdb']
    };
    const defaultCape = heroId === 'bailongma' && !armorId ? ['#0077b6', '#80ffdb'] : heroId === 'wukong' && !armorId ? ['#9d0208', '#ffd166'] : null;
    const capePair = CAPE_DEFS[armorId] || defaultCape;

    if (armorId === 'kasaya_robe' || armorId === 'bagua_dao_robe') {
      mc.beginLayer();
      const ribCol = armorId === 'bagua_dao_robe' ? '#9d4edd' : '#ef233c';
      mc.curve(cx - 8, topY + 3, cx - 22, topY - 9 - wave * 0.4, cx - 26 - wave * 0.6, topY + 12, ribCol, 1);
      mc.curve(cx - 9, topY + 4, cx - 21, topY - 8 - wave * 0.4, cx - 25 - wave * 0.6, topY + 12, '#ffd60a', 0);
      mc.outlineLayer('#120b18', '#22172e', false);
    } else if (capePair) {
      mc.beginLayer();
      const [cMain, cTrim] = capePair;
      const capeSh = makeToneShader(cMain, 0.22, 0.32);
      mc.trapezoid(
        topY + 2,
        topY + 27,
        cx - build.shoulderW + 1,
        cx - 2,
        cx - build.shoulderW - 9 - wave,
        cx - 4 - Math.round(wave * 0.4),
        capeSh
      );
      mc.line(cx - build.shoulderW - 8 - wave, topY + 27, cx - 4 - Math.round(wave * 0.4), topY + 27, cTrim, 0);
      mc.outlineLayer('#110b18', '#22172e', false);
    }

    // B. 孙悟空灵动翘起金丝猴尾
    if (heroId === 'wukong') {
      mc.beginLayer();
      mc.curve(cx - 6, topY + 16, cx - 19, topY + 15, cx - 18 - Math.round(wave * 0.4), topY + 4 - Math.round(wave * 0.3), '#d9822b', 1);
      mc.pset(cx - 18 - Math.round(wave * 0.4), topY + 4 - Math.round(wave * 0.3), '#ffd27d');
      mc.outlineLayer('#120b18', '#241528', false);
    }

    // C. 凤翅紫金冠标志性【双长像素雉鸡翎】（逐帧波浪起伏！）
    if (helmId === 'phoenix_crown') {
      mc.beginLayer();
      mc.curve(hcx - 2, hcy - 15, hcx - 16, hcy - 23 - Math.round(wave * 0.3), hcx - 31 - Math.round(wave * 0.6), hcy - 14 + Math.round(wave * 0.4), '#ef233c', 1);
      mc.curve(hcx + 2, hcy - 15, hcx - 12, hcy - 25 - Math.round(wave * 0.3), hcx - 26 - Math.round(wave * 0.6), hcy - 18 + Math.round(wave * 0.4), '#ffd60a', 1);
      mc.pset(hcx - 31 - Math.round(wave * 0.6), hcy - 14 + Math.round(wave * 0.4), '#fff3b0');
      mc.pset(hcx - 26 - Math.round(wave * 0.6), hcy - 18 + Math.round(wave * 0.4), '#ffffff');
      mc.outlineLayer('#120b18', '#241528', false);
    }
  }

  // ==================== 1. 步履与双腿绘制（12款步履独立贴图） ====================
  function drawLegAndBoot(mc, hipX, hipY, footX, footY, build, armorId, bootsId, isBack) {
    mc.beginLayer();
    const darkBias = isBack ? -0.2 : 0;
    const kneeX = Math.round((hipX + footX) * 0.5 + 2.4);
    const kneeY = Math.round((hipY + footY) * 0.5 - 1);

    let pantsCol = build.pants;
    let bootCol = build.bootMain;
    let trimCol = build.bootTrim;
    let soleCol = build.sole;
    let wingCol = null;

    if (armorId === 'golden_mail') {
      bootCol = '#22223b'; trimCol = '#ffd60a'; soleCol = '#e09f3e';
    } else if (armorId === 'mountain_plate' || armorId === 'black_bear_plate') {
      pantsCol = '#2b2d42'; bootCol = '#495057'; trimCol = '#ced4da'; soleCol = '#adb5bd';
    } else if (armorId === 'kasaya_robe' || armorId === 'bagua_dao_robe') {
      pantsCol = '#f8f9fa'; bootCol = '#3d2b24'; trimCol = '#ffd166';
    } else if (armorId === 'dragon_scale') {
      pantsCol = '#023e8a'; bootCol = '#0077b6'; trimCol = '#80ffdb'; soleCol = '#caf0f8';
    }

    if (bootsId && BOOTS_VISUALS[bootsId]) {
      const bv = BOOTS_VISUALS[bootsId];
      pantsCol = bv.pants; bootCol = bv.boot; trimCol = bv.trim; soleCol = bv.sole; wingCol = bv.wing;
    }

    pantsCol = shade(pantsCol, darkBias);
    bootCol = shade(bootCol, darkBias);
    trimCol = shade(trimCol, darkBias);
    soleCol = shade(soleCol, darkBias);

    const pantsShader = makeToneShader(pantsCol, 0.22, 0.26);
    const bootShader = makeToneShader(bootCol, 0.28, 0.28);

    mc.limb(hipX, hipY, kneeX, kneeY, 3.6, 3.0, pantsShader);
    mc.limb(kneeX, kneeY, footX, footY - 4, 3.0, 2.6, bootShader);

    if (bootsId === 'straw_sandals') {
      for (let sy = kneeY + 1; sy <= footY - 4; sy += 2) {
        mc.hline(footX - 2, footX + 2, sy, trimCol);
      }
    } else {
      // 立体护膝甲片
      mc.ellipse(kneeX + 1, kneeY, 2.4, 2.0, trimCol);
      mc.vline(Math.round((kneeX + footX) * 0.5) + 1, kneeY + 2, footY - 5, trimCol);
    }

    const fx = Math.round(footX);
    const fy = Math.round(footY);
    mc.trapezoid(fy - 5, fy - 1, fx - 4, fx + 3, fx - 4, fx + 6, bootShader);
    mc.pset(fx + 6, fy - 3, trimCol);
    mc.pset(fx + 7, fy - 4, trimCol);
    mc.hline(fx - 3, fx + 3, fy - 4, trimCol);
    mc.hline(fx - 4, fx + 6, fy, soleCol);

    if (wingCol && !isBack) {
      mc.line(fx - 3, fy - 4, fx - 7, fy - 7, wingCol, 0);
      mc.pset(fx - 7, fy - 8, '#ffffff');
    }

    mc.outlineLayer('#110b18', '#1f152b', false);
  }

  // ==================== 2. 强壮屈肘武术手臂与护腕拳甲（含唐僧单手立掌佛印！） ====================
  function drawArmAndGauntlet(mc, shX, shY, handX, handY, heroId, build, armorId, isBack, isIdlePose) {
    mc.beginLayer();
    const darkBias = isBack ? -0.18 : 0;

    // 唐僧在待机时远端手竖立胸前结【单手立掌佛印】！
    let tx = handX;
    let ty = handY;
    const monkMudra = heroId === 'tangseng' && !isBack && isIdlePose;
    if (monkMudra) {
      tx = build.cx + 5;
      ty = shY + 5;
    }

    const elbowX = Math.round((shX + tx) * 0.5 + (isBack ? 1 : -4));
    const elbowY = Math.round((shY + ty) * 0.5 + 3.5);

    let sleeveCol = '#ffbe0b';
    let bracerCol = '#2b2d42';
    let bracerTrim = '#ffd60a';
    const handCol = shade(build.skin, darkBias);

    if (heroId === 'tangseng') {
      sleeveCol = '#f8f9fa'; bracerCol = '#d62828'; bracerTrim = '#ffd166';
    } else if (heroId === 'bajie') {
      sleeveCol = '#22223b'; bracerCol = '#4a4e69'; bracerTrim = '#ffd166';
    } else if (heroId === 'wujing') {
      sleeveCol = build.skin; bracerCol = '#3c096c'; bracerTrim = '#ffd166';
    } else if (heroId === 'bailongma') {
      sleeveCol = '#e0fbfc'; bracerCol = '#0096c7'; bracerTrim = '#80ffdb';
    }

    const ARMOR_SLEEVES = {
      tiger_skin_kilt: ['#d4a373', '#6f4518', '#ffd166'],
      grey_monk_robe: ['#adb5bd', '#495057', '#dee2e6'],
      black_bear_plate: ['#22223b', '#343a40', '#ffb703'],
      mountain_plate: ['#343a40', '#6c757d', '#f8f9fa'],
      spider_silk_vest: ['#7209b7', '#f72585', '#ff9ebb'],
      flame_robe: ['#dc2f02', '#6a040f', '#ffd166'],
      quicksand_armor: ['#1d3557', '#0077b6', '#80ffdb'],
      dragon_scale: ['#0077b6', '#48cae4', '#ffffff'],
      bagua_dao_robe: ['#f8f9fa', '#7209b7', '#ffd166'],
      bull_demon_plate: ['#370617', '#9d0208', '#ffd60a'],
      golden_mail: ['#d62828', '#e09f3e', '#fff3b0'],
      tianpeng_armor: ['#22223b', '#4a4e69', '#69f0ae'],
      kasaya_robe: ['#ffffff', '#e01e37', '#ffd166']
    };
    if (armorId && ARMOR_SLEEVES[armorId]) {
      [sleeveCol, bracerCol, bracerTrim] = ARMOR_SLEEVES[armorId];
    }

    const wideSleeve =
      heroId === 'tangseng' ||
      armorId === 'kasaya_robe' ||
      armorId === 'bagua_dao_robe' ||
      armorId === 'grey_monk_robe';

    mc.limb(shX, shY, elbowX, elbowY, 3.6, wideSleeve ? 4.4 : 3.1, makeToneShader(shade(sleeveCol, darkBias), 0.24, 0.26));
    mc.limb(elbowX, elbowY, tx, ty, wideSleeve ? 3.8 : 3.0, 2.6, makeToneShader(shade(bracerCol, darkBias), 0.28, 0.28));
    mc.line(elbowX - 1, elbowY, tx - 1, ty - 1, shade(bracerTrim, darkBias), 0);

    if (monkMudra) {
      // 单手立掌金色佛印手姿
      mc.vline(tx + 1, ty - 4, ty + 1, handCol);
      mc.vline(tx + 2, ty - 3, ty + 1, shade(handCol, 0.2));
      mc.pset(tx + 1, ty - 5, '#ffd60a');
    } else {
      mc.ellipse(tx, ty, 2.7, 2.5, makeToneShader(handCol, 0.22, 0.25));
      mc.pset(tx + 1, ty - 1, shade(handCol, 0.28));
    }

    mc.outlineLayer('#110b18', '#22172e', !isBack);
  }

  // ==================== 3. 躯干宝甲 + 分片式左右甲裙与前悬战摆 ====================
  function drawSplitBattleSkirt(mc, cx, ww, botY, skirtBotY, flare, mainShader, apronCol, trimCol) {
    // 左胁甲裙片 + 右胁甲裙片（中间留出动态阴影缝隙，迈步时极具层次感！）
    mc.trapezoid(botY - 2, skirtBotY, cx - ww - 1, cx - 2, cx - ww - 5 - flare * 0.5, cx - 3, mainShader);
    mc.trapezoid(botY - 2, skirtBotY, cx + 2, cx + ww + 1, cx + 3, cx + ww + 5 + flare, mainShader);
    // 中央前悬战摆（锦缎护胯长条 + 金边底纹）
    mc.trapezoid(botY - 1, skirtBotY + 1, cx - 3, cx + 3, cx - 4, cx + 4 + flare * 0.3, makeToneShader(apronCol, 0.22, 0.28));
    mc.hline(cx - 4, cx + 4 + Math.round(flare * 0.3), skirtBotY, trimCol);
  }

  function drawTorsoAndSkirt(mc, heroId, build, pose, armorId, accId, rarityIdx) {
    const cx = build.cx + pose.leanX * 0.55;
    const topY = build.torsoTop + pose.torsoDy;
    const botY = build.torsoBot + pose.torsoDy;
    const sw = build.shoulderW;
    const ww = build.waistW;
    const flare = pose.skirtFlare || 0;

    // 3A. 战裙 / 仙袍下摆层
    mc.beginLayer();
    const isLongRobe =
      (!armorId && heroId === 'tangseng') ||
      armorId === 'kasaya_robe' ||
      armorId === 'bagua_dao_robe' ||
      armorId === 'grey_monk_robe' ||
      armorId === 'flame_robe';
    const skirtBotY = isLongRobe ? botY + 15 : botY + 11;

    if (!armorId) {
      if (heroId === 'wukong') {
        drawSplitBattleSkirt(mc, cx, ww, botY, skirtBotY, flare, tigerKiltShader, '#d62828', '#ffd60a');
      } else if (heroId === 'tangseng') {
        mc.trapezoid(botY - 2, skirtBotY, cx - ww - 1, cx + ww + 1, cx - ww - 5 - flare * 0.5, cx + ww + 5 + flare, makeToneShader('#f1f3f5', 0.18, 0.18));
        mc.trapezoid(botY - 2, skirtBotY - 2, cx - 2, cx + ww + 1, cx - 4, cx + ww + 4 + flare, kasayaBrocadeShader);
        mc.hline(cx - ww - 4, cx + ww + 4 + flare, skirtBotY - 1, '#ffd166');
      } else if (heroId === 'bajie') {
        drawSplitBattleSkirt(mc, cx, ww, botY, skirtBotY - 1, flare, makeToneShader('#22223b', 0.22, 0.28), '#4ea8de', '#ffd166');
      } else if (heroId === 'wujing') {
        drawSplitBattleSkirt(mc, cx, ww, botY, skirtBotY, flare, makeToneShader('#5a189a', 0.25, 0.28), '#00b4d8', '#ffd166');
      } else if (heroId === 'bailongma') {
        drawSplitBattleSkirt(mc, cx, ww, botY, skirtBotY + 1, flare, makeToneShader('#0077b6', 0.26, 0.28), '#caf0f8', '#ffd166');
      }
    } else if (armorId === 'tiger_skin_kilt') {
      drawSplitBattleSkirt(mc, cx, ww, botY, skirtBotY + 1, flare, tigerKiltShader, '#99582a', '#fff3b0');
    } else if (armorId === 'grey_monk_robe') {
      mc.trapezoid(botY - 2, skirtBotY, cx - ww, cx + ww, cx - ww - 5 - flare * 0.5, cx + ww + 5 + flare, makeToneShader('#8d99ae', 0.2, 0.28));
      mc.hline(cx - ww - 4, cx + ww + 4 + flare, skirtBotY - 1, '#dee2e6');
    } else if (armorId === 'black_bear_plate') {
      drawSplitBattleSkirt(mc, cx, ww, botY, skirtBotY, flare, makeToneShader('#2b2d42', 0.24, 0.3), '#9d0208', '#ffb703');
    } else if (armorId === 'mountain_plate') {
      drawSplitBattleSkirt(mc, cx, ww, botY, skirtBotY, flare, mountainPlateShader, '#1d3557', '#4cc9f0');
    } else if (armorId === 'spider_silk_vest') {
      drawSplitBattleSkirt(mc, cx, ww, botY, skirtBotY, flare, spiderWebShader, '#3c096c', '#80ffdb');
    } else if (armorId === 'flame_robe') {
      mc.trapezoid(botY - 2, skirtBotY, cx - ww, cx + ww + 1, cx - ww - 5 - flare * 0.5, cx + ww + 5 + flare, flameCloudShader);
      mc.hline(cx - ww - 4, cx + ww + 4 + flare, skirtBotY - 1, '#ffd60a');
    } else if (armorId === 'quicksand_armor') {
      drawSplitBattleSkirt(mc, cx, ww, botY, skirtBotY, flare, quicksandScaleShader, '#5a189a', '#4cc9f0');
    } else if (armorId === 'dragon_scale') {
      drawSplitBattleSkirt(mc, cx, ww, botY, skirtBotY + 1, flare, dragonScaleShader, '#03045e', '#80ffdb');
    } else if (armorId === 'bagua_dao_robe') {
      mc.trapezoid(botY - 2, skirtBotY + 1, cx - ww - 1, cx + ww + 1, cx - ww - 6 - flare * 0.5, cx + ww + 6 + flare, makeToneShader('#5a189a', 0.28, 0.26));
      mc.trapezoid(botY, skirtBotY, cx - 3, cx + 4, cx - 5, cx + 6 + flare * 0.4, makeToneShader('#f8f9fa', 0.15, 0.18));
      mc.hline(cx - ww - 5, cx + ww + 5 + flare, skirtBotY, '#ffd166');
    } else if (armorId === 'bull_demon_plate') {
      drawSplitBattleSkirt(mc, cx, ww, botY, skirtBotY + 1, flare, bullDemonPlateShader, '#9d0208', '#ffd60a');
    } else if (armorId === 'golden_mail') {
      drawSplitBattleSkirt(mc, cx, ww, botY, skirtBotY, flare, goldenMailShader, '#d62828', '#ffd60a');
    } else if (armorId === 'tianpeng_armor') {
      drawSplitBattleSkirt(mc, cx, ww, botY, skirtBotY + 1, flare, tianpengPlateShader, '#1d3557', '#69f0ae');
    } else if (armorId === 'kasaya_robe') {
      mc.trapezoid(botY - 2, skirtBotY + 2, cx - ww - 1, cx + ww + 1, cx - ww - 6 - flare * 0.6, cx + ww + 6 + flare, kasayaBrocadeShader);
      mc.hline(cx - ww - 5, cx + ww + 5 + flare, skirtBotY + 1, '#fff3b0');
      mc.hline(cx - ww - 5, cx + ww + 5 + flare, skirtBotY, '#ffd166');
    }
    mc.outlineLayer('#110b18', '#22172e', false);

    // 3B. 胸甲主体与立领颈部过渡层
    mc.beginLayer();
    // 颈部与高立领过渡（消除头身分离感！）
    mc.rect(cx - 4, topY - 4, 8, 5, shade(build.skin, -0.18));
    mc.hline(cx - 6, cx + 6, topY - 1, armorId ? '#ffd166' : '#f8f9fa');

    if (!armorId) {
      if (heroId === 'wukong') {
        mc.trapezoid(topY, botY, cx - sw, cx + sw, cx - ww, cx + ww, makeToneShader('#ffbe0b', 0.26, 0.26));
        mc.line(cx - 4, topY, cx + 2, topY + 10, '#d62828', 1);
        mc.line(cx + 5, topY, cx, topY + 9, '#fff3b0', 0);
        mc.rect(cx - ww - 1, botY - 4, ww * 2 + 3, 4, makeToneShader('#d62828', 0.22, 0.28));
        mc.rect(cx, botY - 4, 5, 4, '#ffd60a');
      } else if (heroId === 'tangseng') {
        mc.trapezoid(topY, botY, cx - sw, cx + sw, cx - ww, cx + ww, makeToneShader('#ffffff', 0.12, 0.18));
        mc.trapezoid(topY + 1, botY, cx - sw + 3, cx + sw, cx - ww + 2, cx + ww, kasayaBrocadeShader);
        mc.ellipse(cx - 3, topY + 5, 2.8, 2.8, '#06d6a0');
        mc.pset(cx - 3, topY + 5, '#ffffff');
      } else if (heroId === 'bajie') {
        mc.trapezoid(topY, botY, cx - sw, cx + sw, cx - ww - 1, cx + ww + 1, makeToneShader('#22223b', 0.24, 0.28));
        mc.ellipse(cx + 2, (topY + botY) * 0.5 + 1, 8.0, 8.6, makeToneShader('#ffb3c1', 0.22, 0.22));
        mc.pset(cx + 4, botY - 6, '#c95b72');
        mc.rect(cx - ww - 1, botY - 4, ww * 2 + 3, 5, makeToneShader('#4ea8de', 0.25, 0.28));
        mc.ellipse(cx + 3, botY - 2, 2.8, 2.4, '#ffd166');
      } else if (heroId === 'wujing') {
        mc.trapezoid(topY, botY, cx - sw, cx + sw, cx - ww, cx + ww, makeToneShader('#6a1b9a', 0.26, 0.28));
        mc.line(cx - 4, topY + 1, cx + 2, topY + 10, '#d49a6a', 1);
        mc.rect(cx - ww - 1, botY - 4, ww * 2 + 3, 4, makeToneShader('#00b4d8', 0.26, 0.26));
        mc.rect(cx + 1, botY - 4, 5, 4, '#ffd166');
      } else if (heroId === 'bailongma') {
        mc.trapezoid(topY, botY, cx - sw, cx + sw, cx - ww, cx + ww, makeToneShader('#e0fbfc', 0.2, 0.22));
        mc.vline(cx + 1, topY + 1, botY - 4, '#48cae4');
        mc.rect(cx - ww - 1, botY - 4, ww * 2 + 3, 4, makeToneShader('#0077b6', 0.25, 0.25));
        mc.rect(cx + 1, botY - 4, 5, 4, '#ffd166');
        mc.pset(cx + 3, botY - 3, '#00f5d4');
      }
    } else if (armorId === 'tiger_skin_kilt') {
      mc.trapezoid(topY, botY, cx - sw, cx + sw, cx - ww, cx + ww, makeToneShader(build.skin, 0.18, 0.22));
      mc.trapezoid(topY, botY, cx - sw, cx, cx - ww, cx + 3, makeToneShader('#99582a', 0.25, 0.28));
      mc.line(cx - sw + 1, topY + 1, cx + ww - 1, botY - 4, '#ffd166', 1);
      mc.rect(cx - ww - 1, botY - 4, ww * 2 + 3, 4, tigerKiltShader);
    } else if (armorId === 'grey_monk_robe') {
      mc.trapezoid(topY, botY, cx - sw, cx + sw, cx - ww, cx + ww, makeToneShader('#adb5bd', 0.2, 0.28));
      mc.line(cx - 3, topY + 1, cx + 2, topY + 9, '#f8f9fa', 1);
      mc.rect(cx - ww - 1, botY - 4, ww * 2 + 3, 4, '#495057');
    } else if (armorId === 'black_bear_plate') {
      mc.trapezoid(topY, botY, cx - sw, cx + sw, cx - ww, cx + ww, makeToneShader('#2b2d42', 0.28, 0.32));
      mc.ellipse(cx + 1, topY + 8, 3.8, 3.5, '#ffb703');
      mc.pset(cx + 1, topY + 8, '#ff4800');
      mc.rect(cx - ww - 1, botY - 4, ww * 2 + 3, 4, '#ffb703');
    } else if (armorId === 'mountain_plate') {
      mc.trapezoid(topY, botY, cx - sw, cx + sw, cx - ww, cx + ww, mountainPlateShader);
      mc.ellipse(cx + 1, topY + 8, 4.0, 3.6, '#adb5bd');
      mc.ellipse(cx + 1, topY + 8, 2.3, 2.3, '#4cc9f0');
      mc.pset(cx, topY + 7, '#ffffff');
      mc.rect(cx - ww - 1, botY - 4, ww * 2 + 3, 4, '#343a40');
      mc.rect(cx, botY - 4, 5, 4, '#4cc9f0');
    } else if (armorId === 'spider_silk_vest') {
      mc.trapezoid(topY, botY, cx - sw, cx + sw, cx - ww, cx + ww, spiderWebShader);
      mc.ellipse(cx + 1, topY + 7, 3.0, 3.0, '#80ffdb');
      mc.rect(cx - ww - 1, botY - 4, ww * 2 + 3, 4, '#3c096c');
    } else if (armorId === 'flame_robe') {
      mc.trapezoid(topY, botY, cx - sw, cx + sw, cx - ww, cx + ww, flameCloudShader);
      mc.line(cx - 3, topY + 1, cx + 2, topY + 9, '#ffd60a', 1);
      mc.rect(cx - ww - 1, botY - 4, ww * 2 + 3, 4, '#ffd60a');
    } else if (armorId === 'quicksand_armor') {
      mc.trapezoid(topY, botY, cx - sw, cx + sw, cx - ww, cx + ww, quicksandScaleShader);
      mc.ellipse(cx + 1, topY + 8, 3.6, 3.6, '#ffd166');
      mc.ellipse(cx + 1, topY + 8, 2.0, 2.0, '#00f5d4');
      mc.rect(cx - ww - 1, botY - 4, ww * 2 + 3, 4, '#00b4d8');
    } else if (armorId === 'dragon_scale') {
      mc.trapezoid(topY, botY, cx - sw, cx + sw, cx - ww, cx + ww, dragonScaleShader);
      mc.ellipse(cx + 1, topY + 8, 3.6, 3.6, '#00b4d8');
      mc.ellipse(cx + 1, topY + 8, 2.1, 2.1, '#80ffdb');
      mc.pset(cx, topY + 7, '#ffffff');
      mc.rect(cx - ww - 1, botY - 4, ww * 2 + 3, 4, '#0077b6');
      mc.ellipse(cx + 2, botY - 2, 2.8, 2.2, '#ffd166');
    } else if (armorId === 'bagua_dao_robe') {
      mc.trapezoid(topY, botY, cx - sw, cx + sw, cx - ww, cx + ww, makeToneShader('#7209b7', 0.28, 0.28));
      mc.line(cx - 4, topY + 1, cx + 1, topY + 9, '#ffffff', 1);
      mc.line(cx + 5, topY + 1, cx + 1, topY + 9, '#ffd166', 1);
      mc.ellipse(cx + 1, topY + 9, 3.8, 3.8, '#ffd166');
      mc.ellipse(cx, topY + 9, 2.3, 2.3, '#ffffff');
      mc.ellipse(cx + 2, topY + 9, 1.7, 2.3, '#120b18');
      mc.pset(cx, topY + 8, '#120b18');
      mc.pset(cx + 2, topY + 10, '#ffffff');
      mc.rect(cx - ww - 1, botY - 4, ww * 2 + 3, 4, '#ffd166');
    } else if (armorId === 'bull_demon_plate') {
      mc.trapezoid(topY, botY, cx - sw, cx + sw, cx - ww, cx + ww, bullDemonPlateShader);
      mc.ellipse(cx + 1, topY + 8, 4.2, 3.6, '#ffd60a');
      mc.pset(cx, topY + 8, '#ff0a54');
      mc.pset(cx + 3, topY + 8, '#ff0a54');
      mc.rect(cx - ww - 1, botY - 4, ww * 2 + 3, 4, '#9d0208');
      mc.rect(cx, botY - 4, 5, 4, '#ffd60a');
    } else if (armorId === 'golden_mail') {
      mc.trapezoid(topY, botY, cx - sw, cx + sw, cx - ww, cx + ww, goldenMailShader);
      mc.line(cx - sw + 3, topY + 2, cx + ww - 1, botY - 5, '#ef233c', 0);
      mc.line(cx + sw - 3, topY + 2, cx - ww + 2, botY - 5, '#ef233c', 0);
      mc.ellipse(cx + 1, topY + 8, 3.8, 3.8, makeToneShader('#ffd60a', 0.35, 0.25));
      mc.ellipse(cx + 1, topY + 8, 1.9, 1.9, rarityIdx >= 4 ? '#ff0a54' : '#ffffff');
      mc.rect(cx - ww - 1, botY - 4, ww * 2 + 3, 4, makeToneShader('#e09f3e', 0.3, 0.28));
      mc.ellipse(cx + 2, botY - 2, 3.2, 2.4, '#fff3b0');
      mc.pset(cx + 2, botY - 2, '#ef233c');
    } else if (armorId === 'tianpeng_armor') {
      mc.trapezoid(topY, botY, cx - sw, cx + sw, cx - ww, cx + ww, tianpengPlateShader);
      mc.ellipse(cx + 1, topY + 8, 4.0, 3.6, '#ffd166');
      mc.ellipse(cx + 1, topY + 8, 2.1, 2.1, '#69f0ae');
      mc.rect(cx - ww - 1, botY - 4, ww * 2 + 3, 4, '#ffd166');
    } else if (armorId === 'kasaya_robe') {
      mc.trapezoid(topY, botY, cx - sw, cx + sw, cx - ww, cx + ww, makeToneShader('#ffffff', 0.1, 0.16));
      mc.trapezoid(topY, botY, cx - sw + 2, cx + sw, cx - ww, cx + ww, kasayaBrocadeShader);
      mc.ellipse(cx - 2, topY + 6, 3.2, 3.2, '#06d6a0');
      mc.ellipse(cx - 2, topY + 6, 1.4, 1.4, '#ffffff');
      mc.rect(cx - ww - 1, botY - 4, ww * 2 + 3, 4, makeToneShader('#ffd166', 0.28, 0.25));
    }
    mc.outlineLayer('#110b18', '#22172e', true);

    // 3C. 颈部念珠层
    if (accId === 'nine_skull_necklace' || (heroId === 'wujing' && accId !== 'wood_prayer_beads')) {
      const glowSkull = accId === 'nine_skull_necklace';
      mc.beginLayer();
      for (let i = 0; i < 7; i++) {
        const ang = 0.15 * Math.PI + (i / 6) * 0.72 * Math.PI;
        const bx = Math.round(cx + 1 + Math.cos(ang) * (sw * 0.72));
        const by = Math.round(topY + 2 + Math.sin(ang) * 7.5);
        mc.ellipse(bx, by, 2.1, 2.1, i % 2 === 0 ? '#f8f9fa' : '#dee2e6');
        mc.pset(bx - 1, by, glowSkull ? '#00f5d4' : '#2b2d42');
        mc.pset(bx + 1, by, glowSkull ? '#00f5d4' : '#2b2d42');
      }
      mc.outlineLayer('#110b18', '#22172e', false);
    } else if (accId === 'wood_prayer_beads' || heroId === 'tangseng') {
      mc.beginLayer();
      for (let i = 0; i < 9; i++) {
        const ang = 0.12 * Math.PI + (i / 8) * 0.76 * Math.PI;
        const bx = Math.round(cx + 1 + Math.cos(ang) * (sw * 0.64));
        const by = Math.round(topY + 2 + Math.sin(ang) * 6.5);
        mc.ellipse(bx, by, 1.4, 1.4, i === 4 ? '#ffd166' : '#6f4518');
      }
      mc.outlineLayer('#120b18', '#22172e', false);
    }
  }

  // ==================== 4. 霸气双肩吞兽 / 重铠护肩层 ====================
  function drawPauldrons(mc, heroId, build, pose, armorId) {
    if (armorId === 'grey_monk_robe' || armorId === 'tiger_skin_kilt') return;
    if (!armorId && heroId === 'tangseng') return;

    const cx = build.cx + pose.leanX * 0.55;
    const shY = build.torsoTop + pose.torsoDy + 2;
    const sw = build.shoulderW;

    mc.beginLayer();
    if (!armorId) {
      // 原装轻护肩（悟空金边云肩 / 八戒乌金护肩 / 悟净紫金护肩 / 白龙银鳞云肩）
      const baseCol = heroId === 'wukong' ? '#e09f3e' : heroId === 'bajie' ? '#4a4e69' : heroId === 'wujing' ? '#7b2cbf' : '#90e0ef';
      mc.ellipse(cx - sw + 1, shY, 4.2, 3.2, makeToneShader(baseCol, 0.3, 0.28));
      mc.ellipse(cx + sw - 1, shY, 3.6, 2.8, makeToneShader(baseCol, 0.25, 0.28));
      mc.hline(cx - sw - 2, cx - sw + 3, shY + 2, '#ffd166');
    } else if (armorId === 'golden_mail') {
      mc.ellipse(cx - sw, shY, 5.5, 4.2, makeToneShader('#ffd60a', 0.35, 0.3));
      mc.ellipse(cx + sw - 1, shY, 4.5, 3.6, makeToneShader('#e09f3e', 0.3, 0.3));
      mc.pset(cx - sw - 1, shY - 1, '#ff0a54');
      mc.pset(cx - sw - 3, shY + 2, '#ffffff');
      mc.pset(cx - sw, shY + 3, '#ffffff');
    } else if (armorId === 'mountain_plate' || armorId === 'black_bear_plate') {
      mc.trapezoid(shY - 4, shY + 4, cx - sw - 3, cx - sw + 4, cx - sw - 5, cx - sw + 3, mountainPlateShader);
      mc.trapezoid(shY - 3, shY + 3, cx + sw - 3, cx + sw + 3, cx + sw - 2, cx + sw + 4, mountainPlateShader);
      mc.line(cx - sw - 3, shY - 4, cx - sw - 6, shY - 6, '#ced4da', 0);
    } else if (armorId === 'bull_demon_plate') {
      mc.ellipse(cx - sw, shY, 5.5, 4.2, bullDemonPlateShader);
      mc.curve(cx - sw - 2, shY - 1, cx - sw - 6, shY - 4, cx - sw - 8, shY - 8, '#ffd60a', 1);
      mc.ellipse(cx + sw - 1, shY, 4.5, 3.5, bullDemonPlateShader);
    } else if (armorId === 'tianpeng_armor' || armorId === 'quicksand_armor') {
      const shd = armorId === 'tianpeng_armor' ? tianpengPlateShader : quicksandScaleShader;
      mc.ellipse(cx - sw, shY, 5.4, 4.0, shd);
      mc.ellipse(cx + sw - 1, shY, 4.4, 3.4, shd);
      mc.pset(cx - sw - 1, shY, '#69f0ae');
    } else if (armorId === 'kasaya_robe' || armorId === 'bagua_dao_robe' || armorId === 'flame_robe') {
      const col = armorId === 'bagua_dao_robe' ? '#7209b7' : '#e01e37';
      mc.ellipse(cx - sw + 1, shY, 5.0, 3.4, makeToneShader(col, 0.25, 0.25));
      mc.ellipse(cx + sw - 1, shY, 4.2, 3.0, makeToneShader(col, 0.25, 0.25));
      mc.hline(cx - sw - 2, cx - sw + 4, shY + 2, '#ffd166');
    } else if (armorId === 'dragon_scale' || armorId === 'spider_silk_vest') {
      const finCol = armorId === 'spider_silk_vest' ? '#f72585' : '#48cae4';
      const tipCol = armorId === 'spider_silk_vest' ? '#ff9ebb' : '#80ffdb';
      mc.curve(cx - sw + 3, shY + 2, cx - sw - 2, shY - 2, cx - sw - 6, shY - 6, finCol, 2);
      mc.line(cx - sw - 1, shY - 2, cx - sw - 6, shY - 6, tipCol, 0);
      mc.pset(cx - sw - 6, shY - 6, '#ffffff');
      mc.ellipse(cx + sw - 1, shY, 4.2, 3.2, makeToneShader(finCol, 0.25, 0.25));
    }
    mc.outlineLayer('#110b18', '#22172e', true);
  }

  // ==================== 5. 五大主角高辨识度头面五官与鬓发胡须精雕 ====================
  function drawHeroHeadAndFace(mc, heroId, build, pose, helmId) {
    const hcx = Math.round(build.cx + pose.leanX * 0.8);
    const hcy = Math.round(build.headCy + pose.headDy);
    const rx = build.headRx;
    const ry = build.headRy;
    const isHeadbandOnly =
      !helmId ||
      helmId === 'bronze_band' ||
      helmId === 'crimson_hero_band' ||
      helmId === 'asura_mask';

    if (heroId === 'bailongma') {
      mc.beginLayer();
      mc.curve(hcx - 4, hcy - 5, hcx - 15, hcy + 1, hcx - 20, hcy + 12, '#caf0f8', 3);
      mc.curve(hcx - 5, hcy - 2, hcx - 16, hcy + 5, hcx - 22, hcy + 16, '#ffffff', 2);
      mc.line(hcx - 10, hcy + 3, hcx - 20, hcy + 14, '#90e0ef', 0);
      mc.outlineLayer('#110b18', '#22172e', false);
    } else if (heroId === 'wujing') {
      mc.beginLayer();
      mc.trapezoid(isHeadbandOnly ? hcy - 15 : hcy - 10, hcy - 4, hcx - 10, hcx + 7, hcx - 9, hcx + 8, makeToneShader('#1b263b', 0.28, 0.35));
      if (isHeadbandOnly) {
        mc.line(hcx - 9, hcy - 14, hcx - 12, hcy - 19, '#1b263b', 1);
        mc.line(hcx - 3, hcy - 15, hcx - 4, hcy - 20, '#2b3a55', 1);
        mc.line(hcx + 3, hcy - 14, hcx + 5, hcy - 19, '#1b263b', 1);
      }
      mc.outlineLayer('#0d0914', '#1d1528', false);
    }

    mc.beginLayer();
    if (heroId === 'wukong') {
      // 蓬松金栗猴毛外廓 + 双颊张扬绒毛刺簇！
      mc.ellipse(hcx, hcy, rx + 1.2, ry + 0.6, makeToneShader('#b85d14', 0.28, 0.3));
      mc.line(hcx - 10, hcy, hcx - 13, hcy + 2, '#d9822b', 1);
      mc.line(hcx - 9, hcy + 3, hcx - 12, hcy + 6, '#9c4a0d', 1);
      mc.line(hcx + 9, hcy + 1, hcx + 12, hcy + 3, '#c86d1f', 1);
      mc.ellipse(hcx - 9, hcy + 1, 2.5, 3.2, '#dda15e');
      mc.pset(hcx - 9, hcy + 1, '#ffcb77');

      // 经典桃心猴面脸谱
      mc.ellipse(hcx - 1, hcy - 1, 4.4, 4.0, '#f4a261');
      mc.ellipse(hcx + 5, hcy - 1, 4.0, 3.8, '#f4a261');
      mc.ellipse(hcx + 3, hcy + 4, 6.4, 4.4, makeToneShader('#ffcb77', 0.22, 0.18));

      // 齐天大圣上挑金丝剑眉
      mc.line(hcx - 5, hcy - 4, hcx, hcy - 2, '#ffd60a', 0);
      mc.line(hcx + 4, hcy - 2, hcx + 9, hcy - 4, '#ffd60a', 0);

      const eyeGlow = pose.fierce ? '#ffd60a' : '#ff0a54';
      mc.rect(hcx - 2, hcy - 1, 3, 3, '#ff0a54');
      mc.pset(hcx - 1, hcy, eyeGlow);
      mc.pset(hcx - 2, hcy - 1, '#ffffff');
      mc.rect(hcx + 5, hcy - 1, 3, 3, '#ff0a54');
      mc.pset(hcx + 6, hcy, eyeGlow);
      mc.pset(hcx + 5, hcy - 1, '#ffffff');

      mc.pset(hcx + 3, hcy + 2, '#6f320d');
      mc.pset(hcx + 4, hcy + 2, '#6f320d');
      mc.line(hcx, hcy + 5, hcx + 5, hcy + 5, '#5c260e', 0);
      mc.pset(hcx - 1, hcy + 4, '#5c260e');
      mc.pset(hcx + 1, hcy + 4, '#ffffff');
    } else if (heroId === 'tangseng') {
      mc.ellipse(hcx, hcy, rx, ry, makeToneShader('#ffe5d9', 0.16, 0.18));
      mc.ellipse(hcx - 9, hcy + 2, 2.2, 4.4, '#f4bfb0');
      mc.pset(hcx - 9, hcy + 5, '#ffe5d9');
      mc.hline(hcx - 3, hcx + 1, hcy - 3, '#4a352f');
      mc.hline(hcx + 4, hcx + 8, hcy - 3, '#4a352f');
      mc.pset(hcx + 2, hcy - 4, '#ef233c');

      mc.rect(hcx - 2, hcy - 1, 3, 3, '#2b1b17');
      mc.pset(hcx - 1, hcy + 1, '#7f4f24');
      mc.pset(hcx - 2, hcy - 1, '#ffffff');
      mc.rect(hcx + 5, hcy - 1, 3, 3, '#2b1b17');
      mc.pset(hcx + 6, hcy + 1, '#7f4f24');
      mc.pset(hcx + 5, hcy - 1, '#ffffff');

      mc.vline(hcx + 3, hcy + 1, hcy + 2, '#dfa38f');
      mc.hline(hcx + 1, hcx + 4, hcy + 5, '#c97b70');
    } else if (heroId === 'bajie') {
      mc.ellipse(hcx + 10, hcy + 1, 4.5, 6.5, makeToneShader('#ff8fa3', 0.2, 0.25));
      mc.ellipse(hcx, hcy + 1, rx, ry, makeToneShader('#ffb3c1', 0.2, 0.22));
      mc.ellipse(hcx - 11, hcy + 2, 5.5, 7.5, makeToneShader('#ffb3c1', 0.22, 0.25));
      mc.ellipse(hcx - 11, hcy + 2, 3.2, 4.8, '#e05780');

      mc.hline(hcx - 3, hcx + 1, hcy - 3, '#2b1924');
      mc.hline(hcx + 5, hcx + 8, hcy - 3, '#2b1924');
      mc.rect(hcx - 2, hcy - 1, 3, 3, '#1d111a');
      mc.pset(hcx - 2, hcy - 1, '#ffffff');
      mc.rect(hcx + 5, hcy - 1, 3, 3, '#1d111a');
      mc.pset(hcx + 5, hcy - 1, '#ffffff');

      mc.ellipse(hcx + 7, hcy + 3, 4.8, 3.6, makeToneShader('#ff758f', 0.28, 0.22));
      mc.vline(hcx + 6, hcy + 2, hcy + 4, '#590d22');
      mc.vline(hcx + 9, hcy + 2, hcy + 4, '#590d22');

      mc.curve(hcx + 1, hcy + 6, hcx, hcy + 3, hcx - 1, hcy + 1, '#ffffff', 0);
      mc.pset(hcx, hcy + 5, '#e2eafc');
      mc.curve(hcx + 9, hcy + 6, hcx + 11, hcy + 4, hcx + 12, hcy + 1, '#ffffff', 0);
    } else if (heroId === 'wujing') {
      mc.ellipse(hcx, hcy, rx, ry, makeToneShader('#d49a6a', 0.22, 0.26));
      mc.ellipse(hcx - 9, hcy + 1, 2.2, 3.0, '#b57b4c');

      mc.line(hcx - 4, hcy - 4, hcx + 1, hcy - 2, '#1b110c', 0);
      mc.line(hcx + 4, hcy - 2, hcx + 8, hcy - 4, '#1b110c', 0);
      mc.rect(hcx - 2, hcy - 1, 3, 3, '#1b110c');
      mc.pset(hcx - 1, hcy, '#ffd166');
      mc.pset(hcx - 2, hcy - 1, '#ffffff');
      mc.rect(hcx + 5, hcy - 1, 3, 3, '#1b110c');
      mc.pset(hcx + 6, hcy, '#ffd166');
      mc.pset(hcx + 5, hcy - 1, '#ffffff');

      mc.trapezoid(hcy + 3, hcy + 12, hcx - 9, hcx + 10, hcx - 7, hcx + 9, (px, py, nx, ny) => {
        const flame = (px + py) % 3 === 0;
        if (ny < -0.2 && flame) return '#ff7b00';
        if (nx > 0.1 || ny < 0.2) return '#dc2f02';
        if (ny < 0.65) return '#9d0208';
        return '#590209';
      });
      for (let fx = hcx - 6; fx <= hcx + 8; fx += 3) {
        mc.vline(fx, hcy + 12, hcy + 14, '#9d0208');
      }
      mc.hline(hcx + 1, hcx + 5, hcy + 5, '#3d0c02');
    } else if (heroId === 'bailongma') {
      mc.ellipse(hcx, hcy, rx, ry, makeToneShader('#fff0e6', 0.15, 0.18));
      mc.line(hcx - 9, hcy + 1, hcx - 13, hcy - 1, '#ffe5d9', 1);

      // 少年龙将飘逸银白斜刘海与双侧垂鬓（俊朗国风少年感拉满！）
      mc.trapezoid(hcy - 9, hcy - 4, hcx - 8, hcx + 8, hcx - 9, hcx + 9, '#ffffff');
      mc.line(hcx - 7, hcy - 5, hcx - 8, hcy + 6, '#ffffff', 1);
      mc.line(hcx - 6, hcy - 4, hcx - 6, hcy + 4, '#caf0f8', 0);
      mc.line(hcx + 8, hcy - 5, hcx + 9, hcy + 4, '#caf0f8', 1);
      mc.line(hcx - 2, hcy - 6, hcx + 1, hcy - 3, '#ffffff', 0);

      mc.vline(hcx + 3, hcy - 5, hcy - 3, '#ffd60a');
      mc.pset(hcx + 3, hcy - 4, '#00f5d4');

      mc.line(hcx - 4, hcy - 3, hcx, hcy - 2, '#0096c7', 0);
      mc.line(hcx + 5, hcy - 2, hcx + 8, hcy - 3, '#0096c7', 0);
      mc.rect(hcx - 2, hcy - 1, 3, 3, '#03045e');
      mc.pset(hcx - 1, hcy, '#00f5d4');
      mc.pset(hcx - 2, hcy - 1, '#ffffff');
      mc.rect(hcx + 5, hcy - 1, 3, 3, '#03045e');
      mc.pset(hcx + 6, hcy, '#00f5d4');
      mc.pset(hcx + 5, hcy - 1, '#ffffff');

      mc.hline(hcx + 1, hcx + 4, hcy + 5, '#d99b88');
    }
    mc.outlineLayer('#110b18', '#22172e', true);

    if (heroId === 'bailongma') {
      mc.beginLayer();
      mc.curve(hcx + 4, hcy - 8, hcx + 6, hcy - 15, hcx + 3, hcy - 21, '#00bbf9', 1);
      mc.line(hcx + 5, hcy - 14, hcx + 9, hcy - 17, '#00f5d4', 0);
      mc.pset(hcx + 3, hcy - 21, '#ffffff');
      mc.curve(hcx - 4, hcy - 8, hcx - 6, hcy - 15, hcx - 9, hcy - 22, '#00f5d4', 1);
      mc.line(hcx - 6, hcy - 14, hcx - 2, hcy - 18, '#80ffdb', 0);
      mc.pset(hcx - 9, hcy - 22, '#ffffff');
      mc.outlineLayer('#081c24', '#133b4d', false);
    }
  }

  // ==================== 6. 纸娃娃冠冕层（全 13 款头盔/斗笠/宝冠/鬼面） ====================
  function drawHeadgear(mc, heroId, build, pose, helmId) {
    const hcx = Math.round(build.cx + pose.leanX * 0.8);
    const hcy = Math.round(build.headCy + pose.headDy);
    const rx = Math.round(build.headRx);

    mc.beginLayer();
    if (!helmId) {
      if (heroId === 'wukong') {
        mc.rect(hcx - rx, hcy - 7, rx * 2 + 1, 3, makeToneShader('#d62828', 0.2, 0.25));
        mc.hline(hcx - rx, hcx + rx, hcy - 5, '#ffd60a');
        mc.hline(hcx - rx + 1, hcx + rx - 1, hcy - 6, '#fff3b0');
        mc.pset(hcx + 1, hcy - 7, '#ffd60a');
        mc.pset(hcx + 3, hcy - 7, '#ffd60a');
        mc.pset(hcx + 2, hcy - 6, '#ffffff');
        mc.line(hcx - 3, hcy - 9, hcx - 6, hcy - 13, '#e38b29', 1);
        mc.line(hcx + 1, hcy - 9, hcx + 2, hcy - 13, '#ffd27d', 0);
      } else if (heroId === 'tangseng') {
        mc.trapezoid(hcy - 14, hcy - 6, hcx - 6, hcx + 7, hcx - rx, hcx + rx, makeToneShader('#ffd166', 0.28, 0.26));
        mc.trapezoid(hcy - 12, hcy - 7, hcx - 2, hcx + 4, hcx - 4, hcx + 5, '#d62828');
        mc.ellipse(hcx + 1, hcy - 9, 1.8, 1.8, '#fff3b0');
        mc.pset(hcx + 1, hcy - 9, '#ff0a54');
        mc.hline(hcx - rx, hcx + rx, hcy - 6, '#e09f3e');
      } else if (heroId === 'bajie') {
        mc.trapezoid(hcy - 13, hcy - 6, hcx - 8, hcx + 8, hcx - rx, hcx + rx, makeToneShader('#22223b', 0.28, 0.3));
        mc.ellipse(hcx + 2, hcy - 8, 2.8, 2.4, '#ffd60a');
        mc.pset(hcx + 2, hcy - 8, '#06d6a0');
        mc.ellipse(hcx, hcy - 14, 2.2, 1.8, '#ef233c');
      } else if (heroId === 'wujing') {
        mc.rect(hcx - rx, hcy - 7, rx * 2 + 1, 3, makeToneShader('#e63946', 0.25, 0.28));
        mc.rect(hcx - 1, hcy - 8, 6, 4, '#ffd166');
        mc.pset(hcx + 2, hcy - 7, '#ffffff');
      } else if (heroId === 'bailongma') {
        mc.trapezoid(hcy - 10, hcy - 6, hcx - 5, hcx + 6, hcx - 8, hcx + 8, makeToneShader('#90e0ef', 0.28, 0.25));
        mc.ellipse(hcx + 2, hcy - 8, 2.0, 2.0, '#ffd60a');
        mc.pset(hcx + 2, hcy - 8, '#00f5d4');
      }
    } else if (helmId === 'bronze_band' || helmId === 'crimson_hero_band') {
      const isHero = helmId === 'crimson_hero_band';
      mc.rect(hcx - rx, hcy - 7, rx * 2 + 1, 3, makeToneShader(isHero ? '#e63946' : '#b07d4f', 0.25, 0.28));
      mc.rect(hcx - 1, hcy - 8, 6, 4, isHero ? '#ffd60a' : '#e9c46a');
      mc.pset(hcx + 2, hcy - 7, isHero ? '#00f5d4' : '#ffffff');
      if (isHero) {
        mc.curve(hcx - rx, hcy - 6, hcx - rx - 6, hcy - 4, hcx - rx - 9, hcy + 1, '#e63946', 1);
      }
    } else if (helmId === 'monk_bamboo_hat') {
      mc.trapezoid(hcy - 16, hcy - 6, hcx - 2, hcx + 2, hcx - rx - 8, hcx + rx + 8, (px, py, nx, ny) => {
        if ((px + py) % 3 === 0) return '#fff3b0';
        return -nx * 0.5 - ny * 0.4 > 0 ? '#e9c46a' : '#b08968';
      });
      mc.hline(hcx - rx - 8, hcx + rx + 8, hcy - 6, '#7f5539');
    } else if (helmId === 'bone_skull_helm') {
      mc.ellipse(hcx, hcy - 9, rx + 1.5, 6.2, makeToneShader('#f1faee', 0.15, 0.25));
      mc.curve(hcx - 6, hcy - 10, hcx - 10, hcy - 14, hcx - 8, hcy - 18, '#dee2e6', 1);
      mc.curve(hcx + 6, hcy - 10, hcx + 10, hcy - 14, hcx + 8, hcy - 18, '#dee2e6', 1);
      mc.rect(hcx - 4, hcy - 8, 3, 2, '#120b18');
      mc.rect(hcx + 4, hcy - 8, 3, 2, '#120b18');
      for (let tx = hcx - 7; tx <= hcx + 7; tx += 3) mc.vline(tx, hcy - 5, hcy - 4, '#ffffff');
    } else if (helmId === 'yellow_wind_hood') {
      mc.ellipse(hcx - 1, hcy - 8, rx + 2, 7.0, makeToneShader('#e09f3e', 0.25, 0.28));
      mc.trapezoid(hcy - 7, hcy + 6, hcx - rx - 2, hcx - rx + 3, hcx - rx - 5, hcx - rx + 2, makeToneShader('#d4a373', 0.2, 0.28));
      mc.hline(hcx - rx, hcx + rx, hcy - 5, '#4cc9f0');
      mc.pset(hcx + 2, hcy - 6, '#ffffff');
    } else if (helmId === 'coral_dragon_crown') {
      mc.trapezoid(hcy - 12, hcy - 5, hcx - 6, hcx + 7, hcx - rx, hcx + rx, dragonScaleShader);
      mc.curve(hcx - 5, hcy - 10, hcx - 10, hcy - 16, hcx - 12, hcy - 22, '#00f5d4', 1);
      mc.line(hcx - 8, hcy - 15, hcx - 4, hcy - 19, '#80ffdb', 0);
      mc.curve(hcx + 6, hcy - 10, hcx + 10, hcy - 16, hcx + 11, hcy - 21, '#00bbf9', 1);
      mc.ellipse(hcx + 2, hcy - 8, 2.2, 2.2, '#ffffff');
    } else if (helmId === 'taiqing_lotus_cap') {
      mc.trapezoid(hcy - 17, hcy - 6, hcx - 4, hcx + 5, hcx - 8, hcx + 8, makeToneShader('#7209b7', 0.3, 0.28));
      mc.hline(hcx - 9, hcx + 9, hcy - 12, '#06d6a0');
      mc.hline(hcx - rx, hcx + rx, hcy - 6, '#ffd60a');
      mc.ellipse(hcx + 1, hcy - 9, 2.4, 2.4, '#ffd166');
      mc.pset(hcx + 1, hcy - 9, '#ffffff');
    } else if (helmId === 'bull_horn_helm') {
      mc.ellipse(hcx, hcy - 9, rx + 1.5, 6.2, bullDemonPlateShader);
      mc.curve(hcx - 7, hcy - 9, hcx - 16, hcy - 12, hcx - 15, hcy - 21, '#ffd166', 2);
      mc.pset(hcx - 15, hcy - 21, '#ffffff');
      mc.curve(hcx + 7, hcy - 9, hcx + 15, hcy - 12, hcx + 14, hcy - 21, '#e09f3e', 2);
      mc.hline(hcx - rx, hcx + rx, hcy - 5, '#ffd60a');
      mc.ellipse(hcx + 2, hcy - 8, 2.2, 2.2, '#ff0a54');
    } else if (helmId === 'tianpeng_gold_hat') {
      mc.trapezoid(hcy - 15, hcy - 5, hcx - 7, hcx + 7, hcx - rx - 1, hcx + rx + 1, tianpengPlateShader);
      mc.line(hcx - rx, hcy - 9, hcx - rx - 5, hcy - 13, '#ffd166', 1);
      mc.line(hcx + rx, hcy - 9, hcx + rx + 5, hcy - 13, '#ffd166', 1);
      mc.ellipse(hcx + 2, hcy - 9, 2.8, 2.8, '#69f0ae');
      mc.pset(hcx + 2, hcy - 9, '#ffffff');
    } else if (helmId === 'phoenix_crown') {
      mc.trapezoid(hcy - 16, hcy - 6, hcx - 5, hcx + 6, hcx - rx, hcx + rx, goldenMailShader);
      mc.ellipse(hcx + 1, hcy - 16, 3.5, 2.5, '#ef233c');
      mc.pset(hcx + 1, hcy - 18, '#ffd60a');
      mc.curve(hcx - 6, hcy - 9, hcx - 13, hcy - 12, hcx - 16, hcy - 17, '#ffd60a', 1);
      mc.line(hcx - 9, hcy - 11, hcx - 14, hcy - 14, '#fff3b0', 0);
      mc.curve(hcx + 7, hcy - 9, hcx + 13, hcy - 12, hcx + 15, hcy - 17, '#ffd60a', 1);
      mc.hline(hcx - rx, hcx + rx, hcy - 6, '#48cae4');
      mc.ellipse(hcx + 2, hcy - 9, 2.4, 2.4, '#ff0a54');
      mc.pset(hcx + 1, hcy - 10, '#ffffff');
    } else if (helmId === 'kunlun_helm') {
      mc.ellipse(hcx, hcy - 9, rx + 1.5, 6.5, mountainPlateShader);
      mc.hline(hcx - rx - 1, hcx + rx + 1, hcy - 6, '#f8f9fa');
      mc.hline(hcx - rx - 1, hcx + rx + 1, hcy - 5, '#adb5bd');
      mc.vline(hcx + 3, hcy - 6, hcy - 1, '#ced4da');
      mc.trapezoid(hcy - 5, hcy + 3, hcx - rx - 1, hcx - rx + 3, hcx - rx, hcx - rx + 2, mountainPlateShader);
      mc.pset(hcx - rx + 1, hcy - 2, '#ffd166');
      mc.vline(hcx, hcy - 17, hcy - 14, '#ffd166');
      mc.curve(hcx, hcy - 17, hcx - 6, hcy - 20, hcx - 12, hcy - 15, '#ef233c', 2);
    } else if (helmId === 'dharma_hat') {
      const petalX = [-8, -4, 1, 6, 10];
      for (let i = 0; i < petalX.length; i++) {
        const px = hcx + petalX[i];
        const tall = i === 2 ? 12 : i === 1 || i === 3 ? 10 : 8;
        mc.trapezoid(hcy - 6 - tall, hcy - 6, px - 1, px + 1, px - 3, px + 3, makeToneShader('#ffd166', 0.35, 0.25));
        mc.pset(px, hcy - 6 - Math.floor(tall * 0.5), i === 2 ? '#ff0a54' : '#06d6a0');
      }
      mc.rect(hcx - rx - 1, hcy - 7, rx * 2 + 2, 2, '#fff3b0');
      mc.vline(hcx - rx, hcy - 5, hcy + 4, '#ef233c');
      mc.pset(hcx - rx, hcy + 4, '#ffd60a');
    } else if (helmId === 'asura_mask') {
      mc.trapezoid(hcy - 12, hcy - 4, hcx - rx, hcx + rx + 1, hcx - rx - 1, hcx + rx + 1, makeToneShader('#d90429', 0.28, 0.35));
      mc.curve(hcx - 6, hcy - 10, hcx - 11, hcy - 15, hcx - 9, hcy - 20, '#ffd60a', 1);
      mc.pset(hcx - 9, hcy - 20, '#ffffff');
      mc.curve(hcx + 6, hcy - 10, hcx + 11, hcy - 15, hcx + 9, hcy - 20, '#ffd60a', 1);
      mc.vline(hcx + 2, hcy - 10, hcy - 6, '#ffd60a');
      mc.pset(hcx + 2, hcy - 8, '#ffffff');
      mc.line(hcx - 7, hcy + 2, hcx - 3, hcy + 6, '#9d0208', 1);
      mc.line(hcx + 5, hcy + 6, hcx + 9, hcy + 3, '#9d0208', 1);
      mc.line(hcx - 4, hcy + 5, hcx - 3, hcy + 2, '#ffffff', 0);
      mc.line(hcx + 7, hcy + 5, hcx + 8, hcy + 2, '#ffffff', 0);
    }
    mc.outlineLayer('#110b18', '#22172e', true);
  }

  // ==================== 7. 腰部灵饰细节 ====================
  function drawWaistAccessory(mc, heroId, cx, waistW, hipY, accId) {
    const jx = Math.round(cx - waistW + 1);
    const jy = Math.round(hipY - 2);
    const waistSet = ['fire_jade', 'wolf_tooth_charm', 'copper_bell', 'iron_fan_pendant', 'glutton_jade_gourd'];
    if (waistSet.indexOf(accId) === -1 && heroId !== 'bajie') return;

    mc.beginLayer();
    if (accId === 'fire_jade') {
      mc.ellipse(jx, jy + 2, 2.6, 2.8, '#ffd60a');
      mc.ellipse(jx, jy + 2, 1.5, 1.6, '#69f0ae');
      mc.vline(jx, jy + 5, jy + 8, '#ef233c');
    } else if (accId === 'wolf_tooth_charm') {
      mc.curve(jx, jy, jx - 1, jy + 4, jx + 2, jy + 7, '#f8f9fa', 1);
      mc.pset(jx, jy, '#ef233c');
    } else if (accId === 'copper_bell') {
      mc.trapezoid(jy, jy + 5, jx - 1, jx + 1, jx - 3, jx + 3, '#e09f3e');
      mc.pset(jx, jy + 5, '#00f5d4');
    } else if (accId === 'iron_fan_pendant') {
      mc.ellipse(jx, jy + 3, 2.6, 3.6, '#06d6a0');
      mc.vline(jx, jy, jy + 6, '#80ffdb');
    } else if (accId === 'glutton_jade_gourd') {
      mc.ellipse(jx, jy, 1.8, 1.6, '#80ffdb');
      mc.ellipse(jx, jy + 3, 2.8, 2.8, '#e0fbfc');
      mc.pset(jx, jy - 2, '#ffd60a');
    } else {
      mc.ellipse(jx - 1, jy, 1.8, 1.6, '#ef233c');
      mc.ellipse(jx - 1, jy + 3, 2.6, 2.6, '#d62828');
      mc.pset(jx - 1, jy - 2, '#ffd166');
    }
    mc.outlineLayer('#110b18', '#22172e', false);
  }

  function bakeSingleHeroFrame(heroId, poseKey, equipDesc, pixelScale, whiteFlash) {
    const build = HERO_BUILDS[heroId] || HERO_BUILDS.wukong;
    const pose = POSES[poseKey] || POSES.idle0;
    const helmId = equipDesc && equipDesc.helmId;
    const armorId = equipDesc && equipDesc.armorId;
    const bootsId = equipDesc && equipDesc.bootsId;
    const accId = equipDesc && equipDesc.accId;
    const rarityIdx = (equipDesc && equipDesc.maxRarity) || 0;
    const isIdlePose = poseKey === 'idle0' || poseKey === 'idle1';

    const mc = new MicroCanvas(HERO_W, HERO_H);
    const cx = build.cx + pose.leanX * 0.55;
    const shY = build.torsoTop + pose.torsoDy + 3;
    const hipY = build.torsoBot + pose.torsoDy + 2;

    // 0. 像素级动态披风、猴尾与凤翅双长雉鸡翎
    drawPixelBackCapeAndPlumes(mc, heroId, build, pose, helmId, armorId);

    // 1. 远端手臂
    drawArmAndGauntlet(mc, cx + build.shoulderW - 2, shY, cx + pose.farHand.dx, shY + pose.farHand.dy, heroId, build, armorId, true, isIdlePose);

    // 2. 双腿与 12 款步履
    drawLegAndBoot(mc, cx - 4, hipY, build.cx + pose.backFoot.dx, pose.backFoot.y, build, armorId, bootsId, true);
    drawLegAndBoot(mc, cx + 4, hipY, build.cx + pose.frontFoot.dx, pose.frontFoot.y, build, armorId, bootsId, false);

    // 3. 躯干宝甲与分片式甲裙
    drawTorsoAndSkirt(mc, heroId, build, pose, armorId, accId, rarityIdx);
    drawWaistAccessory(mc, heroId, cx, build.waistW, hipY, accId);

    // 4. 头面五官与冠冕
    drawHeroHeadAndFace(mc, heroId, build, pose, helmId);
    drawHeadgear(mc, heroId, build, pose, helmId);

    // 5. 护肩与近端屈肘手臂
    drawPauldrons(mc, heroId, build, pose, armorId);
    const fHandX = cx + pose.nearHand.dx;
    const fHandY = shY + pose.nearHand.dy;
    drawArmAndGauntlet(mc, cx - build.shoulderW + 2, shY, fHandX, fHandY, heroId, build, armorId, false, isIdlePose);

    if (accId === 'relic_ring' || accId === 'jingang_jade_bangle') {
      mc.beginLayer();
      mc.ellipse(fHandX, fHandY, 2.2, 2.0, accId === 'jingang_jade_bangle' ? '#ffd60a' : '#c77dff');
      mc.pset(fHandX, fHandY, '#ffffff');
      mc.outlineLayer('#240046', '#3c096c', false);
    }

    return mc.toCanvas(pixelScale, HERO_LOGICAL_W, HERO_LOGICAL_H, whiteFlash);
  }

  // ==================== 8. 全部 13 款装备神兵 + 5 款本命神兵微像素模型 ====================
  let _weaponSprites = null;

  function buildWeaponSprites() {
    if (_weaponSprites) return _weaponSprites;
    _weaponSprites = {};

    const specs = [
      {
        id: 'sig_wukong',
        draw(mc, mythic) {
          mc.rect(6, 13, 44, 4, makeToneShader(mythic ? '#ff2a54' : '#ef233c', 0.28, 0.3));
          mc.rect(4, 12, 11, 6, goldenMailShader);
          mc.rect(41, 12, 12, 6, goldenMailShader);
          mc.hline(42, 51, 13, '#ffffff');
          for (let x = 18; x <= 36; x += 4) mc.pset(x, 14, '#ffd60a');
          if (mythic) mc.ellipse(53, 15, 2.2, 3.2, '#fff3b0');
        }
      },
      { id: 'ruyi_jingu_staff', aliasOf: 'sig_wukong', mythic: true },
      {
        id: 'sig_tangseng',
        draw(mc, mythic) {
          mc.rect(4, 14, 38, 3, makeToneShader(mythic ? '#9d0208' : '#7f4f24', 0.25, 0.3));
          mc.rect(16, 13, 3, 5, '#ffd166');
          mc.rect(34, 13, 4, 5, '#ffd166');
          mc.ellipse(45, 15, 6.8, 7.8, '#ffd60a');
          mc.clearCircle(45, 15, 3.6);
          mc.ellipse(45, 15, 2.3, 2.3, mythic ? '#06d6a0' : '#ff0a54');
          mc.pset(45, 14, '#ffffff');
          mc.line(51, 15, 56, 15, '#fff3b0', 1);
          for (let rx = 42; rx <= 48; rx += 3) mc.vline(rx, 22, 25, '#ffd60a');
        }
      },
      { id: 'nine_ring_staff', aliasOf: 'sig_tangseng', mythic: true },
      {
        id: 'sig_bajie',
        draw(mc, mythic) {
          mc.rect(4, 14, 36, 4, makeToneShader(mythic ? '#22223b' : '#582f0e', 0.25, 0.3));
          mc.rect(20, 13, 4, 6, '#ffd166');
          mc.trapezoid(10, 21, 36, 41, 36, 41, makeToneShader(mythic ? '#06d6a0' : '#ef233c', 0.25, 0.28));
          mc.rect(41, 5, 4, 21, goldenMailShader);
          for (let ty = 6; ty <= 24; ty += 3) {
            mc.hline(45, 52, ty, '#ffd60a');
            mc.hline(50, 54, ty, '#ffffff');
          }
        }
      },
      { id: 'nine_tooth_rake', aliasOf: 'sig_bajie', mythic: true },
      {
        id: 'sig_wujing',
        draw(mc, mythic) {
          mc.ellipse(6, 15, 3.5, 3.2, '#ffd166');
          mc.rect(9, 14, 33, 3, makeToneShader(mythic ? '#0077b6' : '#5a189a', 0.3, 0.3));
          mc.rect(39, 12, 4, 7, '#ffd166');
          mc.curve(43, 15, 46, 6, 54, 5, mythic ? '#80ffdb' : '#caf0f8', 2);
          mc.curve(43, 15, 46, 24, 54, 25, mythic ? '#48cae4' : '#90e0ef', 2);
          mc.curve(50, 7, 46, 15, 50, 23, '#ffffff', 0);
        }
      },
      { id: 'crescent_spade', aliasOf: 'sig_wujing', mythic: true },
      {
        id: 'sig_bailongma',
        draw(mc, mythic) {
          mc.rect(3, 14, 33, 3, makeToneShader(mythic ? '#90e0ef' : '#caf0f8', 0.25, 0.25));
          for (let x = 10; x <= 30; x += 5) mc.line(x, 14, x + 2, 16, '#ffd166', 0);
          mc.trapezoid(11, 19, 34, 39, 34, 39, makeToneShader(mythic ? '#00bbf9' : '#ef233c', 0.25, 0.25));
          mc.ellipse(39, 15, 2.5, 3.5, '#ffd60a');
          mc.trapezoid(11, 15, 40, 44, 40, 56, makeToneShader('#00f5d4', 0.35, 0.15));
          mc.trapezoid(15, 19, 40, 56, 40, 44, makeToneShader('#00bbf9', 0.15, 0.25));
          mc.hline(41, 54, 15, '#ffffff');
          if (mythic) {
            mc.line(42, 11, 46, 7, '#80ffdb', 1);
            mc.line(42, 19, 46, 23, '#80ffdb', 1);
          }
        }
      },
      { id: 'dragon_frost_lance', aliasOf: 'sig_bailongma', mythic: true },
      {
        id: 'demon_sabre',
        draw(mc) {
          mc.curve(6, 16, 3, 21, 1, 25, '#ef233c', 1);
          mc.rect(6, 14, 10, 3, makeToneShader('#6f4518', 0.25, 0.25));
          mc.rect(16, 10, 4, 11, goldenMailShader);
          mc.trapezoid(9, 13, 20, 47, 20, 52, makeToneShader('#ffd60a', 0.3, 0.2));
          mc.trapezoid(13, 20, 20, 52, 22, 46, makeToneShader('#e9ecef', 0.3, 0.22));
          mc.curve(22, 19, 38, 21, 53, 11, '#ffffff', 1);
          mc.hline(23, 44, 14, '#d62828');
        }
      },
      {
        id: 'black_iron_mace',
        draw(mc) {
          mc.ellipse(5, 15, 2.5, 2.5, '#ffd166');
          mc.rect(7, 14, 9, 3, '#d62828');
          mc.trapezoid(10, 20, 16, 19, 16, 19, '#ffd60a');
          mc.trapezoid(12, 18, 19, 51, 19, 49, mountainPlateShader);
          mc.hline(20, 50, 14, '#ffffff');
          for (let x = 24; x <= 46; x += 6) {
            mc.vline(x, 11, 19, '#adb5bd');
            mc.pset(x, 11, '#ffffff');
          }
          mc.line(50, 15, 54, 15, '#f8f9fa', 1);
        }
      },
      {
        id: 'pine_staff',
        draw(mc) {
          mc.curve(4, 16, 22, 13, 42, 16, '#7f4f24', 2);
          mc.curve(40, 16, 48, 8, 52, 15, '#99582a', 2);
          mc.ellipse(47, 9, 6.5, 4.0, makeToneShader('#2d6a4f', 0.35, 0.25));
          mc.ellipse(47, 16, 2.4, 2.4, '#80ffdb');
          mc.pset(47, 15, '#ffffff');
        }
      },
      {
        id: 'bodhi_ruyi',
        draw(mc) {
          mc.curve(5, 16, 3, 21, 5, 25, '#06d6a0', 1);
          mc.curve(6, 16, 22, 12, 38, 15, '#ffd166', 2);
          mc.ellipse(44, 14, 7.5, 6.5, makeToneShader('#06d6a0', 0.35, 0.25));
          mc.ellipse(45, 14, 4.5, 3.8, '#c77dff');
          mc.ellipse(46, 13, 2.2, 2.2, '#ffffff');
          mc.ellipse(53, 9, 2.2, 2.2, '#80ffdb');
        }
      },
      {
        id: 'violet_sword',
        draw(mc) {
          mc.curve(5, 15, 2, 19, 1, 23, '#c77dff', 1);
          mc.ellipse(6, 15, 2.2, 2.2, '#ffd60a');
          mc.rect(8, 14, 8, 3, '#3c096c');
          mc.curve(16, 15, 15, 9, 19, 7, '#ffd60a', 1);
          mc.curve(16, 15, 15, 21, 19, 23, '#ffd60a', 1);
          mc.trapezoid(12, 15, 18, 50, 18, 55, '#4cc9f0');
          mc.trapezoid(15, 18, 18, 55, 18, 50, '#c77dff');
          mc.hline(19, 55, 15, '#ffffff');
        }
      },
      {
        id: 'wolf_fang_club',
        draw(mc) {
          mc.rect(5, 14, 16, 3, '#582f0e');
          mc.rect(19, 12, 3, 7, '#ffd166');
          mc.trapezoid(10, 20, 22, 50, 22, 52, bullDemonPlateShader);
          for (let x = 25; x <= 49; x += 5) {
            mc.line(x, 10, x + 1, 6, '#ffffff', 0);
            mc.line(x, 20, x + 1, 24, '#e9ecef', 0);
            mc.pset(x + 2, 15, '#ffd60a');
          }
        }
      },
      {
        id: 'trident_halberd',
        draw(mc) {
          mc.rect(4, 14, 32, 3, makeToneShader('#9d0208', 0.25, 0.3));
          mc.trapezoid(10, 20, 34, 39, 34, 39, goldenMailShader);
          mc.trapezoid(12, 18, 39, 56, 39, 56, makeToneShader('#e9ecef', 0.35, 0.2));
          mc.hline(40, 56, 15, '#ffffff');
          mc.curve(39, 12, 44, 6, 51, 8, '#f8f9fa', 1);
          mc.curve(39, 18, 44, 24, 51, 22, '#ced4da', 1);
          mc.pset(38, 15, '#ff0a54');
        }
      },
      {
        id: 'seven_star_sword',
        draw(mc) {
          mc.curve(5, 15, 2, 20, 2, 24, '#ffd60a', 1);
          mc.rect(7, 14, 9, 3, '#5a189a');
          mc.ellipse(17, 15, 3.0, 5.5, '#ffd60a');
          mc.pset(17, 15, '#00f5d4');
          mc.trapezoid(12, 18, 19, 54, 19, 54, makeToneShader('#fff3b0', 0.35, 0.25));
          mc.hline(20, 55, 15, '#ffffff');
          const stars = [[23, 14], [27, 15], [31, 14], [35, 15], [40, 14], [44, 16], [49, 15]];
          stars.forEach(([sx, sy]) => mc.pset(sx, sy, '#00bbf9'));
        }
      }
    ];

    const specMap = {};
    specs.forEach((s) => {
      specMap[s.id] = s;
    });
    specs.forEach((sp) => {
      const base = sp.aliasOf ? specMap[sp.aliasOf] : sp;
      const mc = new MicroCanvas(58, 30);
      mc.beginLayer();
      base.draw(mc, !!sp.mythic);
      mc.outlineLayer('#110b18', '#22172e', false);
      _weaponSprites[sp.id] = {
        world: mc.toCanvas(1, 29, 15, false),
        hiRes: mc.toCanvas(2, 58, 30, false)
      };
    });
    return _weaponSprites;
  }

  // ==================== 9. EPX 2x 像素斜向平滑与明暗倒角增强器 ====================
  function bakeRefinedGrid(rows, palette, pixelSize, whiteFlash) {
    const origScale = pixelSize || 2;
    const h = rows.length;
    const w = rows.reduce((m, r) => Math.max(m, r.length), 0);
    const logicalW = Math.ceil(w * origScale);
    const logicalH = Math.ceil(h * origScale);

    const src = new Array(w * h).fill(null);
    for (let y = 0; y < h; y++) {
      const r = rows[y];
      for (let x = 0; x < r.length; x++) {
        const ch = r[x];
        if (ch === '.' || ch === ' ') continue;
        src[y * w + x] = palette[ch] || null;
      }
    }

    const mc = new MicroCanvas(w * 2, h * 2);
    const getS = (x, y) => (x >= 0 && x < w && y >= 0 && y < h ? src[y * w + x] : null);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const P = getS(x, y);
        const A = getS(x, y - 1);
        const B = getS(x + 1, y);
        const C = getS(x - 1, y);
        const D = getS(x, y + 1);

        let p1 = C === A && C !== D && A !== B ? A : P;
        let p2 = A === B && A !== C && B !== D ? B : P;
        let p3 = D === C && D !== B && C !== A ? C : P;
        let p4 = B === D && B !== A && D !== C ? D : P;

        const isOutline = (col) => col && (col === palette.O || col === '#120d16' || col === '#120d18' || col === '#0f0c14');
        if (P && !isOutline(P)) {
          if (p1 === P && A !== P && C !== P) p1 = shade(P, 0.16);
          if (p4 === P && B !== P && D !== P) p4 = shade(P, -0.16);
        }

        if (p1) mc.pset(x * 2, y * 2, p1);
        if (p2) mc.pset(x * 2 + 1, y * 2, p2);
        if (p3) mc.pset(x * 2, y * 2 + 1, p3);
        if (p4) mc.pset(x * 2 + 1, y * 2 + 1, p4);
      }
    }

    const physScale = origScale >= 2.6 ? 2 : 1;
    return mc.toCanvas(physScale, logicalW, logicalH, whiteFlash);
  }

  // ==================== 10. 纸娃娃组合帧集缓存管理 ====================
  const _heroSetCache = {};
  let _cacheCount = 0;

  function extractEquipDesc(equipped) {
    if (!equipped) {
      return { key: 'base', helmId: null, armorId: null, bootsId: null, weaponId: null, accId: null, maxRarity: 0 };
    }
    const h = (equipped.helm && equipped.helm.templateId) || '';
    const a = (equipped.armor && equipped.armor.templateId) || '';
    const b = (equipped.boots && equipped.boots.templateId) || '';
    const c = (equipped.accessory && equipped.accessory.templateId) || '';
    let maxR = 0;
    ['helm', 'armor', 'boots', 'weapon', 'accessory'].forEach((s) => {
      if (equipped[s] && equipped[s].rarityIndex > maxR) maxR = equipped[s].rarityIndex;
    });
    const rTag = maxR >= 4 ? 'hi' : 'lo';
    return {
      key: `${h}|${a}|${b}|${c}|${rTag}`,
      helmId: h || null,
      armorId: a || null,
      bootsId: b || null,
      accId: c || null,
      maxRarity: maxR
    };
  }

  function getCompositeHeroSet(heroId, equipped, hiRes) {
    const desc = extractEquipDesc(equipped);
    const cacheKey = `${heroId}::${desc.key}::${hiRes ? 'hi' : 'w'}`;
    if (_heroSetCache[cacheKey]) return _heroSetCache[cacheKey];

    if (_cacheCount > 75) {
      Object.keys(_heroSetCache).forEach((k) => {
        if (k.indexOf('::base::') === -1) delete _heroSetCache[k];
      });
      _cacheCount = 10;
    }

    const sc = hiRes ? 2 : 1;
    const poseNames = Object.keys(POSES);
    const set = {};
    for (let i = 0; i < poseNames.length; i++) {
      const pk = poseNames[i];
      set[pk] = bakeSingleHeroFrame(heroId, pk, desc, sc, false);
    }
    set.idle = set.idle0;
    set.attack = set.attack0;
    set.flash = bakeSingleHeroFrame(heroId, 'idle0', desc, sc, true);

    _heroSetCache[cacheKey] = set;
    _cacheCount++;
    return set;
  }

  function getWeaponSprite(heroId, equippedWeapon, forceSignature, hiRes) {
    const wpns = buildWeaponSprites();
    const useEquipped = !forceSignature && equippedWeapon && equippedWeapon.templateId && wpns[equippedWeapon.templateId];
    const id = useEquipped ? equippedWeapon.templateId : `sig_${heroId}`;
    const entry = wpns[id] || wpns.sig_wukong;
    return hiRes ? entry.hiRes : entry.world;
  }

  // ==================== 11. 统一实时纸娃娃完整角色渲染器 ====================
  function renderHeroPaperDoll(ctx, opts) {
    const heroId = opts.heroId || 'wukong';
    const equipped = opts.equipped || null;
    const frameKey = opts.frameKey || 'idle0';
    const animTime = opts.animTime || 0;
    const moving = !!opts.moving;
    const airborne = !!opts.airborne;
    const attacking = !!opts.attacking;
    const comboStep = opts.comboStep || 0;
    const attackProgress = opts.attackProgress || 0;
    const hiRes = !!opts.hiRes;
    const showSignatureWeapon = !!opts.forceSignatureWeapon;

    const helmId = equipped && equipped.helm && equipped.helm.templateId;
    const weaponItem = equipped && equipped.weapon;
    const accItem = equipped && equipped.accessory;
    const accId = accItem && accItem.templateId;

    let maxRarity = 0;
    let topRarityColor = null;
    const setCounts = {};
    let activeSet4Color = null;
    const SET_COLORS = {
      set_dasheng: '#ffd60a',
      set_fotuo: '#ff9f1c',
      set_tianpeng: '#69f0ae',
      set_juanlian: '#4cc9f0',
      set_zhenlong: '#00f5d4',
      set_taiqing: '#c77dff',
      set_pingtian: '#ff4d6d'
    };

    if (equipped) {
      ['weapon', 'armor', 'helm', 'boots', 'accessory'].forEach((sl) => {
        const it = equipped[sl];
        if (!it) return;
        if (it.rarityIndex >= maxRarity) {
          maxRarity = it.rarityIndex;
          topRarityColor = it.rarityColor;
        }
        if (it.setId) {
          setCounts[it.setId] = (setCounts[it.setId] || 0) + 1;
          if (setCounts[it.setId] >= 4) activeSet4Color = SET_COLORS[it.setId] || '#ffd60a';
        }
      });
    }

    const wind = moving || airborne ? 1.0 : 0.32;
    const bob = frameKey === 'idle0' || frameKey === 'idle1' ? Math.sin(animTime * 4.5) * 0.5 : 0;

    ctx.save();

    // 0. 仙品/神品/圣品 & 四件套共鸣法阵光环
    if (activeSet4Color || (maxRarity >= 3 && topRarityColor)) {
      const auraCol = activeSet4Color || topRarityColor;
      ctx.save();
      ctx.globalAlpha = (activeSet4Color ? 0.36 : 0.24) + Math.sin(animTime * 6) * 0.08;
      ctx.fillStyle = auraCol;
      ctx.beginPath();
      ctx.ellipse(0, -1, activeSet4Color ? 16 : 13, 3.6, 0, 0, Math.PI * 2);
      ctx.fill();
      if (activeSet4Color) {
        ctx.strokeStyle = auraCol;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.ellipse(0, -1, 18 + Math.sin(animTime * 5) * 1.5, 4.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let m = 0; m < 3; m++) {
        const my = -4 - ((animTime * 22 + m * 11) % 28);
        const mx = Math.sin(animTime * 5 + m * 2.1) * 11;
        ctx.globalAlpha = Math.max(0, 0.75 + my / 34);
        ctx.fillRect(mx - 0.8, my, 1.5, 1.5);
      }
      ctx.restore();
    }

    // 1A. 佛光金轮 / 紧箍齐天金环
    if (heroId === 'tangseng' || helmId === 'dharma_hat' || accId === 'golden_fillet_ring') {
      ctx.save();
      ctx.translate(1, -31 + bob);
      ctx.strokeStyle = 'rgba(255, 209, 102, 0.85)';
      ctx.lineWidth = helmId === 'dharma_hat' ? 1.8 : 1.3;
      const haloR = (helmId === 'dharma_hat' ? 14 : 11.5) + Math.sin(animTime * 4) * 0.6;
      ctx.beginPath();
      ctx.arc(0, 0, haloR, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const ang = animTime * 2.2 + (i * Math.PI) / 3;
        ctx.fillStyle = '#fff3b0';
        ctx.fillRect(Math.cos(ang) * haloR - 0.75, Math.sin(ang) * haloR - 0.75, 1.5, 1.5);
      }
      ctx.restore();
    }

    // 1B. 当手持非本命神兵时，背后斜挎角色本命法器剪影
    const SELF_SIG_TPL = {
      wukong: 'ruyi_jingu_staff',
      tangseng: 'nine_ring_staff',
      bajie: 'nine_tooth_rake',
      wujing: 'crescent_spade',
      bailongma: 'dragon_frost_lance'
    };
    if (
      !showSignatureWeapon &&
      weaponItem &&
      weaponItem.templateId &&
      weaponItem.templateId !== SELF_SIG_TPL[heroId]
    ) {
      const sigSpr = getWeaponSprite(heroId, null, true, hiRes);
      if (sigSpr) {
        ctx.save();
        ctx.translate(-3, -20 + bob);
        ctx.rotate(-2.25);
        ctx.globalAlpha = 0.86;
        ctx.drawImage(sigSpr, -14, -7.5, 25, 13);
        ctx.restore();
      }
    }

    // 1C. 灵饰【太乙聚灵符】悬浮
    if (accId === 'taiyi_talisman') {
      const fx = -14 - wind * 2;
      const fy = -29 + Math.sin(animTime * 5.5) * 2.5;
      ctx.fillStyle = '#120b18';
      ctx.fillRect(fx - 3, fy - 4.5, 6, 9);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(fx - 2.5, fy - 4, 5, 8);
      ctx.fillStyle = '#e63946';
      ctx.fillRect(fx - 0.5, fy - 3, 1, 6);
      ctx.fillStyle = '#00f5d4';
      ctx.fillRect(fx - 1, fy - 1, 2, 1.5);
    }

    // 2. 绘制 88x94 高精纸娃娃人物主体（cx=46 微偏右以容纳左侧飘逸像素披风/双翎，故绘制时锚定脚心 x=-23）
    const set = getCompositeHeroSet(heroId, equipped, hiRes);
    const spr = frameKey === 'flash' ? set.flash : set[frameKey] || set.idle0;
    if (spr) {
      ctx.drawImage(spr, -23, -HERO_LOGICAL_H + bob, HERO_LOGICAL_W, HERO_LOGICAL_H);
    }

    // 3. 绘制高细节手持神兵
    const wpnSpr = getWeaponSprite(heroId, weaponItem, showSignatureWeapon, hiRes);
    if (wpnSpr) {
      const isVerticalStaff =
        (heroId === 'tangseng' && (!weaponItem || showSignatureWeapon)) ||
        (!showSignatureWeapon && weaponItem && (weaponItem.templateId === 'nine_ring_staff' || weaponItem.templateId === 'pine_staff'));
      let swingAngle = isVerticalStaff ? -1.12 : -0.34;
      if (attacking) {
        const modStep = comboStep % 3;
        if (modStep === 1) {
          swingAngle = 0.95 - attackProgress * 1.95;
        } else if (modStep === 2) {
          swingAngle = -1.42 + attackProgress * 2.45;
        } else {
          swingAngle = -0.88 + attackProgress * 1.72;
        }
      } else if (moving) {
        swingAngle += Math.sin(animTime * 11) * 0.14;
      } else {
        swingAngle += Math.sin(animTime * 4.5) * 0.04;
      }

      ctx.save();
      ctx.translate(6, -16 + bob);
      ctx.rotate(swingAngle);

      const grow = attacking && comboStep >= 2 ? 1.24 : 1.0;
      ctx.scale(grow, grow);

      if (weaponItem && !showSignatureWeapon && weaponItem.rarityIndex >= 2) {
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.sin(animTime * 10) * 0.1;
        ctx.fillStyle = weaponItem.rarityColor;
        ctx.fillRect(-2, -3.5, 25, 7);
        ctx.restore();
      }

      ctx.drawImage(wpnSpr, -5, -7.5, 29, 15);
      ctx.restore();
    }

    // 4. 前景环绕宝珠（【定风避尘珠】或【定海辟水夜明珠】）
    if (accId === 'wind_pearl' || accId === 'ocean_heart_pearl') {
      const isOcean = accId === 'ocean_heart_pearl';
      const ang = animTime * 3.6;
      const px = Math.cos(ang) * 14;
      const py = -19 + Math.sin(ang * 2) * 4.5;
      ctx.fillStyle = isOcean ? 'rgba(0, 187, 249, 0.42)' : 'rgba(0, 245, 212, 0.35)';
      ctx.beginPath();
      ctx.arc(px, py, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isOcean ? '#4cc9f0' : '#80ffdb';
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px - 1, py - 1, 1.2, 1.2);
    }

    ctx.restore();
  }

  return {
    HERO_LOGICAL_W,
    HERO_LOGICAL_H,
    PREVIEW_OUTFIT_SETS,
    bakeRefinedGrid,
    buildWeaponSprites,
    getCompositeHeroSet,
    getWeaponSprite,
    renderHeroPaperDoll
  };
});
