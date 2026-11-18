/**
 * 《西游破劫录》九九八十一难全怪物 PNG 像素贴图与 Sprite Atlas 导出工具
 * (scripts/export-monsters81.js)
 *
 * 零第三方依赖（基于 Node 内置 zlib 直出标准透明通道 RGBA PNG）：
 * 1. 导出第 1 难 ~ 第 81 难全部怪物的双帧透明 PNG 贴图至 assets/images/monsters/
 * 2. 导出 9x9 九九八十一难合集大图集 assets/images/monsters_81_atlas.png
 * 3. 生成完整素材索引清单 assets/images/monsters/manifest.json
 * 4. 生成可直接在浏览器双击打开预览动画的《九九八十一难全怪物素材图鉴》monsters_81_gallery.html
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const { MOB_ARCHETYPES, BOSS_ARCHETYPES, getArchetype } = require('../src/assets/monsters81Sprites');
const { TRIBULATIONS_81, NINE_CHAPTERS } = require('../src/config/tribulations81');

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
  ihdr[8] = 8; // 8-bit
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // Filter type 0 (None)
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

function renderGridToBuffer(rows, palette, pixelScale) {
  const scale = Math.max(1, Math.round(pixelScale || 3));
  const gh = rows.length;
  const gw = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const width = gw * scale;
  const height = gh * scale;
  const rgba = Buffer.alloc(width * height * 4, 0);

  for (let y = 0; y < gh; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      const colHex = palette[ch];
      if (!colHex) continue;
      const [r, g, b, a] = hexToRgba(colHex);
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const px = x * scale + dx;
          const py = y * scale + dy;
          const idx = (py * width + px) * 4;
          rgba[idx] = r;
          rgba[idx + 1] = g;
          rgba[idx + 2] = b;
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

// ==================== 执行批量导出 ====================
const outDir = path.join(ROOT, 'assets', 'images', 'monsters');
fs.mkdirSync(outDir, { recursive: true });

// 9x9 合集大图集（每格 96x84，总图 864x756）
const CELL_W = 96;
const CELL_H = 84;
const ATLAS_COLS = 9;
const ATLAS_ROWS = 9;
const atlasW = CELL_W * ATLAS_COLS;
const atlasH = CELL_H * ATLAS_ROWS;
const atlasRgba = Buffer.alloc(atlasW * atlasH * 4, 0);

const manifest = {
  title: '《西游破劫录》九九八十一难全怪物像素素材清单',
  totalTribulations: TRIBULATIONS_81.length,
  totalArchetypes: Object.keys(MOB_ARCHETYPES).length + Object.keys(BOSS_ARCHETYPES).length,
  atlasPath: 'assets/images/monsters_81_atlas.png',
  atlasCellSize: { width: CELL_W, height: CELL_H, cols: ATLAS_COLS, rows: ATLAS_ROWS },
  monsters: []
};

const galleryCardsData = [];

TRIBULATIONS_81.forEach((trib, idx) => {
  const arch = getArchetype(trib.archetype);
  const pal = Object.assign({}, arch.palette, trib.palette || {});
  const exportScale = trib.rank === 'boss' ? 3 : 3;

  const f0Buf = renderGridToBuffer(arch.f0, pal, exportScale);
  const f1Buf = renderGridToBuffer(arch.f1 || arch.f0, pal, exportScale);

  const fileF0 = `${trib.id}_f0.png`;
  const fileF1 = `${trib.id}_f1.png`;
  const pngF0 = encodePNG(f0Buf.width, f0Buf.height, f0Buf.rgba);
  const pngF1 = encodePNG(f1Buf.width, f1Buf.height, f1Buf.rgba);

  fs.writeFileSync(path.join(outDir, fileF0), pngF0);
  fs.writeFileSync(path.join(outDir, fileF1), pngF1);

  // 写入 9x9 大图集居中格位
  const col = idx % ATLAS_COLS;
  const row = Math.floor(idx / ATLAS_COLS);
  const ox = col * CELL_W + Math.floor((CELL_W - f0Buf.width) / 2);
  const oy = row * CELL_H + Math.floor((CELL_H - f0Buf.height) / 2);
  blitRgba(atlasRgba, atlasW, atlasH, f0Buf.rgba, f0Buf.width, f0Buf.height, ox, oy);

  manifest.monsters.push({
    no: trib.no,
    id: trib.id,
    chapter: trib.chapter + 1,
    tribName: trib.tribName,
    monsterName: trib.monsterName,
    rank: trib.rank,
    archetype: trib.archetype,
    weapon: trib.weapon,
    lore: trib.lore,
    size: { width: f0Buf.width, height: f0Buf.height },
    frames: {
      f0: `assets/images/monsters/${fileF0}`,
      f1: `assets/images/monsters/${fileF1}`
    },
    atlasCell: { col, row, x: col * CELL_W, y: row * CELL_H, w: CELL_W, h: CELL_H }
  });

  galleryCardsData.push({
    no: trib.no,
    id: trib.id,
    chapter: trib.chapter,
    tribName: trib.tribName,
    monsterName: trib.monsterName,
    rank: trib.rank,
    weapon: trib.weapon,
    lore: trib.lore,
    color: trib.color,
    f0Base64: 'data:image/png;base64,' + pngF0.toString('base64'),
    f1Base64: 'data:image/png;base64,' + pngF1.toString('base64')
  });
});

const atlasPath = path.join(ROOT, 'assets', 'images', 'monsters_81_atlas.png');
fs.writeFileSync(atlasPath, encodePNG(atlasW, atlasH, atlasRgba));
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

// ==================== 生成可视化动态图鉴网页 monsters_81_gallery.html ====================
const galleryHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>《西游破劫录》九九八十一难全怪物像素素材图鉴</title>
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
      background: linear-gradient(135deg, #1b1429 0%, #2b191e 100%);
      border: 2px solid #ffd166;
      border-radius: 10px;
    }
    h1 { color: #ffd166; font-size: 26px; margin-bottom: 8px; }
    .sub { color: #adb5bd; font-size: 13px; line-height: 1.6; }
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
      padding: 6px 12px;
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
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
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
    .card.boss { border-color: #ff9f1c; background: linear-gradient(180deg, #24131c 0%, #151224 100%); }
    .card.elite { border-color: #9d4edd; }
    .top-row { display: flex; justify-content: space-between; align-items: center; font-size: 11px; }
    .trib-no { color: #ffd166; font-weight: bold; }
    .badge { padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
    .badge.boss { background: #d62828; color: #ffd166; }
    .badge.elite { background: #5a189a; color: #e0aaff; }
    .badge.mob { background: #2b2d42; color: #90e0ef; }
    .stage {
      height: 92px;
      background: radial-gradient(circle, rgba(255,209,102,0.1) 0%, rgba(10,8,18,0.6) 75%);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stage img {
      image-rendering: pixelated;
      image-rendering: crisp-edges;
      transform: scale(1.2);
    }
    .m-name { font-size: 15px; font-weight: bold; color: #ffffff; }
    .wep { font-size: 11px; color: #80ffdb; }
    .lore { font-size: 11px; color: #adb5bd; line-height: 1.45; flex: 1; }
    .dl-row { display: flex; gap: 8px; margin-top: 4px; }
    .dl-row a {
      font-size: 11px;
      color: #ffd166;
      text-decoration: none;
      border: 1px solid rgba(255,209,102,0.35);
      padding: 2px 7px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <header>
    <h1>📖 《西游破劫录》九九八十一难 · 全怪物像素素材图鉴（共 81 难 / 162 帧透明 PNG）</h1>
    <div class="sub">
      已全量生成第 1 难「金蝉遭贬」至第 81 难「通天河遇鼋湿经书」全部守关大妖王、劫难头目与巡山小妖双帧动态像素精灵。<br/>
      独立 PNG 目录：<code>assets/images/monsters/</code> ｜ 9×9 合集图集：<code>assets/images/monsters_81_atlas.png</code> ｜ 局内引擎烘焙：<code>src/assets/monsters81Sprites.js</code>
    </div>
  </header>

  <div class="filters" id="filterBar"></div>
  <div class="grid" id="cardGrid"></div>

  <script>
    const DATA = ${JSON.stringify(galleryCardsData)};
    const CHAPTERS = ${JSON.stringify(NINE_CHAPTERS.map((c) => c.shortName))};
    let curFilter = 'ALL';
    let frameTick = 0;

    const filters = [
      { key: 'ALL', label: '全部八十一难 (81)' },
      { key: 'boss', label: '👹 守关大妖王 (' + DATA.filter(d => d.rank === 'boss').length + ')' },
      { key: 'elite', label: '🟣 劫难头目 (' + DATA.filter(d => d.rank === 'elite').length + ')' },
      { key: 'mob', label: '⚔ 巡山妖兵 (' + DATA.filter(d => d.rank === 'mob').length + ')' }
    ].concat(CHAPTERS.map((nm, i) => ({ key: 'ch_' + i, label: nm })));

    const bar = document.getElementById('filterBar');
    function renderFilters() {
      bar.innerHTML = '';
      filters.forEach(f => {
        const b = document.createElement('button');
        b.textContent = f.label;
        if (curFilter === f.key) b.className = 'active';
        b.onclick = () => { curFilter = f.key; renderFilters(); renderCards(); };
        bar.appendChild(b);
      });
    }

    function renderCards() {
      const grid = document.getElementById('cardGrid');
      const list = DATA.filter(d => {
        if (curFilter === 'ALL') return true;
        if (curFilter.startsWith('ch_')) return d.chapter === Number(curFilter.slice(3));
        return d.rank === curFilter;
      });
      const rankLabel = { boss: '守关妖王', elite: '劫难头目', mob: '妖兵小怪' };
      grid.innerHTML = list.map(d => \`
        <div class="card \${d.rank}">
          <div class="top-row">
            <span class="trib-no">第\${d.no}难 · \${d.tribName}</span>
            <span class="badge \${d.rank}">\${rankLabel[d.rank]}</span>
          </div>
          <div class="stage">
            <img class="spr-img" data-f0="\${d.f0Base64}" data-f1="\${d.f1Base64}" src="\${d.f0Base64}" alt="\${d.monsterName}" />
          </div>
          <div class="m-name">\${d.monsterName}</div>
          <div class="wep">兵刃/法宝：\${d.weapon}</div>
          <div class="lore">\${d.lore}</div>
          <div class="dl-row">
            <a href="assets/images/monsters/\${d.id}_f0.png" download="\${d.id}_\${d.monsterName}_f0.png">⬇ 帧1 PNG</a>
            <a href="assets/images/monsters/\${d.id}_f1.png" download="\${d.id}_\${d.monsterName}_f1.png">⬇ 帧2 PNG</a>
          </div>
        </div>
      \`).join('');
    }

    setInterval(() => {
      frameTick = 1 - frameTick;
      document.querySelectorAll('.spr-img').forEach(img => {
        img.src = frameTick ? img.dataset.f1 : img.dataset.f0;
      });
    }, 320);

    renderFilters();
    renderCards();
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, 'monsters_81_gallery.html'), galleryHtml, 'utf8');

console.log('Exported 81-Tribulation Monster PNG Assets:', {
  tribulations: TRIBULATIONS_81.length,
  pngFilesGenerated: TRIBULATIONS_81.length * 2 + 1,
  atlasSize: `${atlasW}x${atlasH}`,
  galleryPath: path.join(ROOT, 'monsters_81_gallery.html')
});
