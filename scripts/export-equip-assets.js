/**
 * 《西游破劫录》64款披挂神兵 + 16种怪物掉落素材 高清 RGBA PNG 与图集导出工具
 * (scripts/export-equip-assets.js)
 *
 * 零第三方依赖（基于 Node 内置 zlib 直出带 16-Bit 微斜角体积光影的标准透明 PNG）：
 * 1. 导出 64 张装备高清透明贴图至 assets/images/equipment/<iconKey>.png (72x72)
 * 2. 导出 16 张怪物素材高清透明贴图至 assets/images/materials/<iconKey>.png (72x72)
 * 3. 导出 8x10 共 80 格合集总图集 assets/images/equip_materials_atlas.png (640x800)
 * 4. 生成完整装备与素材索引表 assets/images/equipment/manifest.json
 * 5. 生成可视化交互预览图鉴网页 equip_materials_gallery.html
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const {
  EQUIP_SPRITE_DEFS,
  MATERIAL_SPRITE_DEFS,
  normalizeGrid18,
  shiftHexColor
} = require('../src/assets/equipAndMatSprites');
const {
  EQUIP_SLOTS,
  EQUIP_TIERS,
  EQUIP_SETS,
  EQUIP_TEMPLATES,
  MONSTER_MATERIALS,
  MATERIAL_MAP,
  formatBaseStatLines
} = require('../src/config/equipment');

// ==================== 纯净 RGBA PNG 编码器 ====================
const CRC_TABLE = (function () {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(typeStr, dataBuf) {
  const typeBuf = Buffer.from(typeStr, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(dataBuf.length, 0);
  const crcInput = Buffer.concat([typeBuf, dataBuf]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBuf, dataBuf, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * stride, (y + 1) * stride);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

function hexToRgba(hex) {
  if (!hex) return [255, 255, 255, 255];
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255, 255];
}

/**
 * 带 16-Bit 左上高光 + 右下微阴影 + 底部微投影光晕的 RGBA 烘焙器
 */
function renderBevelIconToBuffer(def, pixelScale) {
  const scale = Math.max(1, Math.round(pixelScale || 4));
  const grid = normalizeGrid18(def.grid, 18);
  const gh = grid.length;
  const gw = grid[0].length;
  const width = gw * scale;
  const height = gh * scale;
  const rgba = Buffer.alloc(width * height * 4, 0);
  const pal = def.palette || {};

  const cellAt = (x, y) => {
    if (y < 0 || y >= gh || x < 0 || x >= gw) return '.';
    return grid[y][x] || '.';
  };

  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const ch = cellAt(x, y);
      if (ch === '.' || ch === ' ') continue;
      let colHex = pal[ch];
      if (!colHex) continue;

      if (ch !== 'O' && ch !== 'W') {
        const up = cellAt(x, y - 1);
        const left = cellAt(x - 1, y);
        const down = cellAt(x, y + 1);
        const right = cellAt(x + 1, y);
        if ((up === 'O' || left === 'O') && down !== 'O' && right !== 'O') {
          colHex = shiftHexColor(colHex, 18);
        } else if ((down === 'O' || right === 'O') && up !== 'O' && left !== 'O') {
          colHex = shiftHexColor(colHex, -20);
        }
      }

      const [r, g, b, a] = hexToRgba(colHex);
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          // 在单颗像素左上1px再叠加细微金属光泽，强化高清导出观感
          let pr = r;
          let pg = g;
          let pb = b;
          if (scale >= 4 && ch !== 'O' && ch !== 'W' && dx === 0 && dy === 0) {
            pr = Math.min(255, r + 10);
            pg = Math.min(255, g + 10);
            pb = Math.min(255, b + 10);
          }
          const px = x * scale + dx;
          const py = y * scale + dy;
          const idx = (py * width + px) * 4;
          rgba[idx] = pr;
          rgba[idx + 1] = pg;
          rgba[idx + 2] = pb;
          rgba[idx + 3] = a;
        }
      }
    }
  }

  return { width, height, rgba };
}

function blitRgba(dst, dstW, dstH, src, srcW, srcH, offsetX, offsetY) {
  for (let y = 0; y < srcH; y++) {
    const dy = offsetY + y;
    if (dy < 0 || dy >= dstH) continue;
    for (let x = 0; x < srcW; x++) {
      const dx = offsetX + x;
      if (dx < 0 || dx >= dstW) continue;
      const sIdx = (y * srcW + x) * 4;
      if (src[sIdx + 3] === 0) continue;
      const dIdx = (dy * dstW + dx) * 4;
      dst[dIdx] = src[sIdx];
      dst[dIdx + 1] = src[sIdx + 1];
      dst[dIdx + 2] = src[sIdx + 2];
      dst[dIdx + 3] = src[sIdx + 3];
    }
  }
}

// ==================== 执行导出 ====================
const equipOutDir = path.join(ROOT, 'assets', 'images', 'equipment');
const matOutDir = path.join(ROOT, 'assets', 'images', 'materials');
fs.mkdirSync(equipOutDir, { recursive: true });
fs.mkdirSync(matOutDir, { recursive: true });

const CELL_W = 80;
const CELL_H = 80;
const ATLAS_COLS = 8;
const ATLAS_ROWS = 10; // 前8行(64格)为披挂装备，后2行(16格)为怪物素材 = 80格满排！
const atlasW = CELL_W * ATLAS_COLS;
const atlasH = CELL_H * ATLAS_ROWS;
const atlasRgba = Buffer.alloc(atlasW * atlasH * 4, 0);

const manifest = {
  title: '《西游破劫录》64款披挂神兵与16种怪物掉落素材高清像素清单',
  totalEquipments: EQUIP_TEMPLATES.length,
  totalMaterials: MONSTER_MATERIALS.length,
  totalSets: Object.keys(EQUIP_SETS).length,
  atlasPath: 'assets/images/equip_materials_atlas.png',
  atlasCellSize: { width: CELL_W, height: CELL_H, cols: ATLAS_COLS, rows: ATLAS_ROWS },
  equipments: [],
  materials: []
};

const galleryEquipCards = [];
const galleryMatCards = [];

// 1. 导出 64 款西游装备贴图
EQUIP_TEMPLATES.forEach((tpl, idx) => {
  const sprDef = EQUIP_SPRITE_DEFS[tpl.iconKey];
  const buf = renderBevelIconToBuffer(sprDef, 4); // 18 * 4 = 72x72
  const png = encodePNG(buf.width, buf.height, buf.rgba);
  const fileName = `${tpl.iconKey}.png`;
  fs.writeFileSync(path.join(equipOutDir, fileName), png);

  const col = idx % ATLAS_COLS;
  const row = Math.floor(idx / ATLAS_COLS);
  const ox = col * CELL_W + Math.floor((CELL_W - buf.width) / 2);
  const oy = row * CELL_H + Math.floor((CELL_H - buf.height) / 2);
  blitRgba(atlasRgba, atlasW, atlasH, buf.rgba, buf.width, buf.height, ox, oy);

  const slotInfo = EQUIP_SLOTS.find((s) => s.id === tpl.slot) || EQUIP_SLOTS[0];
  const tierInfo = EQUIP_TIERS[tpl.tier || 1];
  const setInfo = tpl.setId ? EQUIP_SETS[tpl.setId] : null;

  manifest.equipments.push({
    id: tpl.id,
    name: tpl.name,
    slot: tpl.slot,
    slotName: slotInfo.name,
    tier: tpl.tier,
    tierName: tierInfo.name,
    setId: tpl.setId || null,
    setName: setInfo ? setInfo.name : null,
    iconKey: tpl.iconKey,
    pngPath: `assets/images/equipment/${fileName}`,
    baseStats: tpl.baseStats,
    recipe: tpl.recipe,
    atlasCell: { col, row, x: col * CELL_W, y: row * CELL_H, w: CELL_W, h: CELL_H }
  });

  galleryEquipCards.push({
    id: tpl.id,
    name: tpl.name,
    slot: tpl.slot,
    slotName: slotInfo.name,
    tier: tpl.tier,
    tierName: tierInfo.name,
    tierColor: tierInfo.color,
    setName: setInfo ? setInfo.name : null,
    setColor: setInfo ? setInfo.color : null,
    setBonus2: setInfo ? setInfo.bonus2Desc : null,
    setBonus4: setInfo ? setInfo.bonus4Desc : null,
    iconKey: tpl.iconKey,
    pngPath: `assets/images/equipment/${fileName}`,
    base64: 'data:image/png;base64,' + png.toString('base64'),
    statLines: formatBaseStatLines(tpl.baseStats).map((s) => s.text),
    recipeText: (tpl.recipe || []).map((r) => `${(MATERIAL_MAP[r.id] || {}).name}×${r.count}`).join(' + ')
  });
});

// 2. 导出 16 种怪物素材贴图
MONSTER_MATERIALS.forEach((mat, mIdx) => {
  const sprDef = MATERIAL_SPRITE_DEFS[mat.iconKey];
  const buf = renderBevelIconToBuffer(sprDef, 4);
  const png = encodePNG(buf.width, buf.height, buf.rgba);
  const fileName = `${mat.iconKey}.png`;
  fs.writeFileSync(path.join(matOutDir, fileName), png);

  const atlasIdx = 64 + mIdx;
  const col = atlasIdx % ATLAS_COLS;
  const row = Math.floor(atlasIdx / ATLAS_COLS);
  const ox = col * CELL_W + Math.floor((CELL_W - buf.width) / 2);
  const oy = row * CELL_H + Math.floor((CELL_H - buf.height) / 2);
  blitRgba(atlasRgba, atlasW, atlasH, buf.rgba, buf.width, buf.height, ox, oy);

  manifest.materials.push({
    id: mat.id,
    name: mat.name,
    tier: mat.tier,
    tierLabel: mat.tierLabel,
    color: mat.color,
    iconKey: mat.iconKey,
    pngPath: `assets/images/materials/${fileName}`,
    dropRateHint: mat.dropRateHint,
    sourceDesc: mat.sourceDesc,
    atlasCell: { col, row, x: col * CELL_W, y: row * CELL_H, w: CELL_W, h: CELL_H }
  });

  galleryMatCards.push({
    id: mat.id,
    name: mat.name,
    tier: mat.tier,
    tierLabel: mat.tierLabel,
    color: mat.color,
    iconKey: mat.iconKey,
    pngPath: `assets/images/materials/${fileName}`,
    base64: 'data:image/png;base64,' + png.toString('base64'),
    dropRateHint: mat.dropRateHint,
    sourceDesc: mat.sourceDesc
  });
});

const atlasPath = path.join(ROOT, 'assets', 'images', 'equip_materials_atlas.png');
fs.writeFileSync(atlasPath, encodePNG(atlasW, atlasH, atlasRgba));
fs.writeFileSync(path.join(equipOutDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

// ==================== 3. 生成交互式高清图鉴网页 equip_materials_gallery.html ====================
const galleryHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>《西游破劫录》64款神兵披挂 & 16种怪物掉落素材高清像素图鉴</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0b0914;
      color: #e9ecef;
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
      padding: 24px 20px 60px;
    }
    header {
      max-width: 1280px;
      margin: 0 auto 20px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #1b1429 0%, #2b192e 100%);
      border: 2px solid #ffd166;
      border-radius: 10px;
    }
    h1 { color: #ffd166; font-size: 25px; margin-bottom: 8px; }
    .sub { color: #adb5bd; font-size: 13px; line-height: 1.65; }
    .filters {
      max-width: 1280px;
      margin: 0 auto 18px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    button {
      background: #191528;
      color: #ced4da;
      border: 1px solid #4a4e69;
      border-radius: 6px;
      padding: 6px 13px;
      font-size: 12px;
      cursor: pointer;
    }
    button.active {
      background: #d62828;
      color: #ffd166;
      border-color: #ffd166;
      font-weight: bold;
    }
    .grid {
      max-width: 1280px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(235px, 1fr));
      gap: 14px;
    }
    .card {
      background: #151224;
      border: 1.5px solid #3d405b;
      border-radius: 8px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: transform 0.15s;
    }
    .card:hover { transform: translateY(-3px); border-color: #ffd166; }
    .top-row { display: flex; justify-content: space-between; align-items: center; font-size: 11px; }
    .stage {
      height: 90px;
      background: radial-gradient(circle, rgba(255,209,102,0.14) 0%, rgba(10,8,18,0.68) 75%);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stage img {
      width: 64px;
      height: 64px;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }
    .title { font-size: 15px; font-weight: bold; }
    .stats { font-size: 11.5px; color: #e0fbfc; line-height: 1.5; }
    .set-tag { font-size: 11px; padding: 3px 6px; border-radius: 4px; background: rgba(255, 214, 10, 0.1); }
    .recipe { font-size: 11px; color: #90e0ef; margin-top: auto; padding-top: 4px; border-top: 1px dashed rgba(255,255,255,0.1); }
  </style>
</head>
<body>
  <header>
    <h1>⚒ 《西游破劫录》64款神兵披挂 & 16种怪物素材 18×18 高清像素贴图图鉴</h1>
    <div class="sub">
      全套采用 18×18 高密度 16-Bit 像素矩阵 + 自动微斜角体积光影烘焙（共 80 张独立透明 PNG + 8×10 总图集）。<br/>
      装备贴图目录：<code>assets/images/equipment/</code> ｜ 怪物素材目录：<code>assets/images/materials/</code> ｜ 合集总图集：<code>assets/images/equip_materials_atlas.png</code>
    </div>
  </header>

  <div class="filters" id="filterBar"></div>
  <div class="grid" id="cardGrid"></div>

  <script>
    const EQUIPS = ${JSON.stringify(galleryEquipCards)};
    const MATS = ${JSON.stringify(galleryMatCards)};
    let curTab = 'ALL_EQUIP';

    const tabs = [
      { id: 'ALL_EQUIP', label: '全部披挂装备 (64)' },
      { id: 'MATS', label: '💎 怪物掉落素材 (16)' },
      { id: 'slot_weapon', label: '🗡 神兵 (13)' },
      { id: 'slot_helm', label: '👑 冠冕 (13)' },
      { id: 'slot_armor', label: '🛡 宝甲 (13)' },
      { id: 'slot_boots', label: '👢 步履 (12)' },
      { id: 'slot_accessory', label: '📿 灵饰 (13)' },
      { id: 'SETS', label: '❖ 七大西游套装 (35)' },
      { id: 'tier_4', label: '🔥 T4 齐天圣器 (14)' },
      { id: 'tier_3', label: '🟣 T3 仙府秘宝 (20)' }
    ];

    function renderTabs() {
      const bar = document.getElementById('filterBar');
      bar.innerHTML = '';
      tabs.forEach(t => {
        const b = document.createElement('button');
        b.textContent = t.label;
        if (curTab === t.id) b.className = 'active';
        b.onclick = () => { curTab = t.id; renderTabs(); renderGrid(); };
        bar.appendChild(b);
      });
    }

    function renderGrid() {
      const grid = document.getElementById('cardGrid');
      if (curTab === 'MATS') {
        grid.innerHTML = MATS.map(m => \`
          <div class="card" style="border-color:\${m.color}">
            <div class="top-row">
              <span style="color:\${m.color};font-weight:bold">T\${m.tier} · \${m.tierLabel}</span>
              <span style="color:#69f0ae">\${m.dropRateHint}</span>
            </div>
            <div class="stage"><img src="\${m.base64}" alt="\${m.name}" /></div>
            <div class="title" style="color:\${m.color}">\${m.name}</div>
            <div class="stats">📍 \${m.sourceDesc}</div>
            <div class="recipe">贴图路径：<code>\${m.pngPath}</code></div>
          </div>
        \`).join('');
        return;
      }

      const list = EQUIPS.filter(e => {
        if (curTab === 'ALL_EQUIP') return true;
        if (curTab === 'SETS') return !!e.setName;
        if (curTab.startsWith('slot_')) return e.slot === curTab.slice(5);
        if (curTab.startsWith('tier_')) return e.tier === Number(curTab.slice(5));
        return true;
      });

      grid.innerHTML = list.map(e => \`
        <div class="card" style="border-color:\${e.tierColor}">
          <div class="top-row">
            <span style="color:\${e.tierColor};font-weight:bold">\${e.tierName}</span>
            <span style="color:#ced4da">部位：\${e.slotName}</span>
          </div>
          <div class="stage"><img src="\${e.base64}" alt="\${e.name}" /></div>
          <div class="title" style="color:\${e.tierColor}">\${e.name}</div>
          <div class="stats">\${e.statLines.map(s => '◆ ' + s).join('<br/>')}</div>
          \${e.setName ? \`<div class="set-tag" style="color:\${e.setColor}">❖【\${e.setName}套】<br/>(2) \${e.setBonus2}<br/>(4) \${e.setBonus4}</div>\` : ''}
          <div class="recipe">⚒ 锻造妖材：\${e.recipeText}</div>
        </div>
      \`).join('');
    }

    renderTabs();
    renderGrid();
  </script>
</body>
</html>
`;

const galleryPath = path.join(ROOT, 'equip_materials_gallery.html');
fs.writeFileSync(galleryPath, galleryHtml, 'utf8');

console.log('Exported Equipment & Monster Material PNG Assets:', {
  equipments: EQUIP_TEMPLATES.length,
  materials: MONSTER_MATERIALS.length,
  totalIndividualPngs: EQUIP_TEMPLATES.length + MONSTER_MATERIALS.length,
  atlasPath: 'assets/images/equip_materials_atlas.png',
  atlasSize: `${atlasW}x${atlasH}`,
  galleryPath
});
