/**
 * 《西游记》九九八十一难 · 十二大独立地域随机关卡生成器 (src/world/levelGen.js)
 *
 * 核心升级：
 * 1. 【一地一独立地形】：12 大西游地域各自拥有完全独立的地形生成拓扑母版（ARCHETYPE_BUILDERS）：
 *    - canyon_bridges    (两界奇峰·鹰愁涧)  : 高低悬崖 + 悬空古木索桥 + 谷底上升山风口
 *    - temple_courtyards (黑风禅林·观音院)  : 院落天井 + 可登顶双层飞檐古殿 + 业火余烬坑
 *    - desert_mesas      (黄风狂沙·高老庄)  : 阶梯风蚀沙岩台 + 流沙陷盆 + 挡风掩体 + 周期性三昧黄风
 *    - river_islets      (八百流沙·万寿山)  : 八百里弱水凶渊 + 随机礁石孤岛 + 水面移动木排 + 五庄仙苑高台
 *    - cavern_crypt      (白骨幽冥·波月洞)  : 封闭钟乳石洞顶 + 上下双层分岔尸魔暗道 + 鬼火骨刺坑
 *    - cliff_pillars     (平顶峭壁·车迟高台): 万仞云海石柱 + 踩踏崩落重组危岩栈桥 + 九丈祈雨法台
 *    - frozen_glacier    (通天冰河·金兜雪山): 千里低摩擦玄冰滑道 + 踏冰寒渊裂口 + 漂移浮冰 + 冰峰台
 *    - spider_thicket    (西梁毒泽·盘丝百花): 荆棘林莽拱顶 + 多层盘丝弹性蛛网床 + 子母河毒沼池
 *    - volcano_caldera   (八百火焰·翠云魔窟): 大跨度沸腾熔岩海 + 黑曜石孤柱 + 火山热浪喷口 + 熔岩浮石
 *    - underwater_palace (祭赛金塔·碧波龙渊): 水下低重力浮力场 + 十三层宝塔阁 + 海眼上升气泡柱 + 珊瑚台
 *    - demon_citadel     (小雷音·狮驼无底洞): 万妖重甲城垛 + 陷空山无底深井竖洞 + 崩塌机关断桥
 *    - celestial_clouds  (天竺仙境·大雷音寺): 万丈云海浮空玉岛 + 七彩祥云弹跳台 + 凌云渡独木桥与无底船
 *
 * 2. 【同地形内地图全随机】：每个独立地域内部由 3~4 种专属房间模块（Room Chunks）经随机种子洗牌、
 *    随机宽度/高度/跨度/高台层数/陷阱偏移动态拼接而成，且连守关妖王殿也具备随机战术跳台变体！
 *
 * 3. 【100% 通行性保底校验】：内置横版平台跳跃可达性扫描器，自动检测超高断崖或超宽深渊并补足踏脚跳板/上升气流。
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
})('levelGen', function (require) {
  const BiomesMod = require('../config/biomes');
  const { BIOMES, ENEMY_TYPES, BOSS_TYPES } = BiomesMod;
  const { SUB_WEAPONS } = require('../config/weapons');
  const TerrainRegions = require('../config/terrainRegions81');

  let Trib81Mod = null;
  try {
    Trib81Mod = require('../config/tribulations81');
  } catch (e) {
    Trib81Mod = null;
  }

  const TILE_SIZE = 24;
  const MAP_ROWS = 18; // 18 * 24 = 432 像素世界高度

  // 十大瓦片类型常量
  const TILE_EMPTY = 0;
  const TILE_SOLID = 1;     // 实心地域砖岩
  const TILE_ONEWAY = 2;    // 单向穿透栈桥跳台
  const TILE_HAZARD = 3;    // 地刺 / 熔岩 / 弱水 / 毒沼陷阱
  const TILE_ICE = 4;       // 通天玄冰滑面（实心承托 + 溜冰低摩擦惯性）
  const TILE_QUICKSAND = 5; // 黄风流沙陷坑（微陷承托 + 移速减缓，跳跃可随时脱出）
  const TILE_WEB = 6;       // 盘丝弹性蛛网（单向承托 + 落地向上弹跃 + 减缓敌人）
  const TILE_CRUMBLE = 7;   // 崩落危岩板（踩踏震动 0.58s 后崩塌 2.6s 再重组）
  const TILE_BOUNCE = 8;    // 七彩祥云弹跳台（踩中立即高高弹飞并重置二段跳！）
  const TILE_UPDRAFT = 9;   // 上升山风 / 火山热浪 / 海眼气泡暗流（非阻挡持续托举升空）

  // 可复现确定性随机数生成器（每次进图若未指定 seed 则混合时间戳与随机熵，确保每次地图随机不同）
  function createRng(seedInput) {
    let s =
      typeof seedInput === 'number' && seedInput > 0
        ? seedInput >>> 0
        : ((Date.now() & 0xffffffff) ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
    if (s === 0) s = 0x9e3779b9;
    const next = () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
      seed: s,
      next,
      int(min, max) {
        return Math.floor(next() * (max - min + 1)) + min;
      },
      pick(arr) {
        return arr[Math.floor(next() * arr.length)];
      },
      chance(p) {
        return next() < p;
      }
    };
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  // 安全填充矩形辅助
  function fillGrid(grid, r1, r2, c1, c2, tile) {
    const rows = grid.length;
    const cols = grid[0].length;
    const rs = clamp(Math.min(r1, r2), 0, rows - 1);
    const re = clamp(Math.max(r1, r2), 0, rows - 1);
    const cs = clamp(Math.min(c1, c2), 2, cols - 3);
    const ce = clamp(Math.max(c1, c2), 2, cols - 3);
    for (let r = rs; r <= re; r++) {
      for (let c = cs; c <= ce; c++) {
        grid[r][c] = tile;
      }
    }
  }

  /**
   * 十二大独立地域的随机房间模块（Chunk）构建器
   * ctx: { rng, grid, floorRow, platforms, movingPlatforms, decors, cols, rows, bossArenaStart, twist, region }
   */
  const ARCHETYPE_BUILDERS = {
    // 1. 两界奇峰·鹰愁涧：断崖索桥 + 山风绝壁 + 五行压石
    canyon_bridges(ctx) {
      const { rng, grid, floorRow, platforms, decors, bossArenaStart, twist } = ctx;
      let c = 15;
      let curFloor = 14;
      const gapExtra = twist.gapBias || 0;

      while (c < bossArenaStart - 6) {
        const mod = rng.pick(['rope_chasm', 'wind_cliff', 'overhang_pass', 'stepped_ridge']);
        if (mod === 'rope_chasm' && c + 10 < bossArenaStart) {
          const w = clamp(rng.int(8, 11) + gapExtra, 8, 13);
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          const bridgeRow = clamp(curFloor - rng.int(0, 1), 10, 13);
          for (let x = c; x <= endC; x++) {
            floorRow[x] = 16;
            grid[15][x] = TILE_HAZARD;
            grid[bridgeRow][x] = TILE_ONEWAY;
          }
          platforms.push({ cStart: c + 1, cEnd: endC - 1, row: bridgeRow });
          if (rng.chance(0.6)) {
            const highR = Math.max(6, bridgeRow - 3);
            fillGrid(grid, highR, highR, c + 2, endC - 2, TILE_ONEWAY);
            platforms.push({ cStart: c + 2, cEnd: endC - 2, row: highR });
          }
          curFloor = clamp(bridgeRow + rng.int(0, 2), 11, 14);
          c = endC + 1;
        } else if (mod === 'wind_cliff' && c + 9 < bossArenaStart) {
          // 陡涧上升山风口：低谷喷涌上升气流直冲高崖！
          const lowFloor = 15;
          const highFloor = rng.int(9, 11);
          const ventCols = 3;
          const topCols = rng.int(6, 8);
          const endC = Math.min(bossArenaStart - 2, c + ventCols + topCols - 1);
          for (let x = c; x < c + ventCols && x <= endC; x++) {
            floorRow[x] = lowFloor;
            for (let r = highFloor - 2; r < lowFloor; r++) {
              grid[r][x] = TILE_UPDRAFT;
            }
          }
          for (let x = c + ventCols; x <= endC; x++) {
            floorRow[x] = highFloor;
          }
          platforms.push({ cStart: c + ventCols + 1, cEnd: endC - 1, row: highFloor });
          curFloor = highFloor;
          c = endC + 1;
        } else if (mod === 'overhang_pass') {
          const seg = rng.int(8, 11);
          const endC = Math.min(bossArenaStart - 2, c + seg - 1);
          curFloor = clamp(curFloor + rng.pick([-1, 0, 1]), 12, 15);
          for (let x = c; x <= endC; x++) floorRow[x] = curFloor;
          // 五行山悬空巨石顶盖 + 中层跳板
          fillGrid(grid, 4, 5, c + 2, endC - 2, TILE_SOLID);
          fillGrid(grid, curFloor - 3, curFloor - 3, c + 1, endC - 1, TILE_ONEWAY);
          platforms.push({ cStart: c + 1, cEnd: endC - 1, row: curFloor - 3 });
          decors.push({ type: 'five_elements_seal', x: Math.floor((c + endC) / 2) * TILE_SIZE, y: curFloor * TILE_SIZE });
          c = endC + 1;
        } else {
          const seg = rng.int(6, 9);
          const endC = Math.min(bossArenaStart - 1, c + seg - 1);
          curFloor = clamp(curFloor + rng.pick([-2, -1, 1, 2]), 10, 15);
          for (let x = c; x <= endC; x++) floorRow[x] = curFloor;
          if (endC - c >= 5) {
            const pr = Math.max(6, curFloor - 3);
            fillGrid(grid, pr, pr, c + 1, endC - 1, TILE_ONEWAY);
            platforms.push({ cStart: c + 1, cEnd: endC - 1, row: pr });
          }
          c = endC + 1;
        }
      }
    },

    // 2. 黑风禅林·观音院：双层可登顶飞檐殿宇 + 火烧袈裟天井 + 钟楼高阁
    temple_courtyards(ctx) {
      const { rng, grid, floorRow, platforms, bossArenaStart, twist } = ctx;
      let c = 15;
      const hazardProb = 0.45 + (twist.hazardBias || 0);

      while (c < bossArenaStart - 6) {
        const mod = rng.pick(['zen_pavilion', 'fire_courtyard', 'bell_tower', 'cloister']);
        if (mod === 'zen_pavilion' && c + 11 < bossArenaStart) {
          // 双层飞檐古殿：底层室内大殿(14) + 二楼木梁(10) + 实心琉璃瓦屋顶(6)可跳上屋脊作战！
          const w = rng.int(10, 13);
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          for (let x = c; x <= endC; x++) floorRow[x] = 14;
          fillGrid(grid, 10, 10, c + 1, endC - 1, TILE_ONEWAY);
          fillGrid(grid, 6, 6, c + 2, endC - 2, TILE_SOLID);
          // 两侧飞檐翘角单向踏板方便跃上屋顶
          grid[8][c] = TILE_ONEWAY;
          grid[8][c + 1] = TILE_ONEWAY;
          grid[8][endC - 1] = TILE_ONEWAY;
          grid[8][endC] = TILE_ONEWAY;
          platforms.push({ cStart: c + 2, cEnd: endC - 2, row: 6 });
          platforms.push({ cStart: c + 2, cEnd: endC - 2, row: 10 });
          c = endC + 1;
        } else if (mod === 'fire_courtyard' && c + 8 < bossArenaStart) {
          const w = rng.int(8, 11);
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          for (let x = c; x <= endC; x++) floorRow[x] = 14;
          if (rng.chance(hazardProb)) {
            for (let x = c + 2; x <= endC - 2; x++) {
              floorRow[x] = 15;
              grid[14][x] = TILE_HAZARD;
            }
          }
          fillGrid(grid, 11, 11, c + 1, endC - 1, TILE_ONEWAY);
          platforms.push({ cStart: c + 1, cEnd: endC - 1, row: 11 });
          c = endC + 1;
        } else if (mod === 'bell_tower' && c + 7 < bossArenaStart) {
          const w = rng.int(7, 9);
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          for (let x = c; x <= endC; x++) floorRow[x] = 13;
          fillGrid(grid, 10, 10, c + 1, endC - 1, TILE_ONEWAY);
          fillGrid(grid, 7, 7, c + 2, endC - 2, TILE_ONEWAY);
          platforms.push({ cStart: c + 2, cEnd: endC - 2, row: 7 });
          c = endC + 1;
        } else {
          const w = rng.int(7, 10);
          const endC = Math.min(bossArenaStart - 1, c + w - 1);
          const fl = rng.pick([13, 14]);
          for (let x = c; x <= endC; x++) floorRow[x] = fl;
          // 院墙矮柱（绝佳撞墙粉碎掩体！）
          const mid = Math.floor((c + endC) / 2);
          grid[fl - 1][mid] = TILE_SOLID;
          grid[fl - 2][mid] = TILE_SOLID;
          c = endC + 1;
        }
      }
    },

    // 3. 黄风狂沙·高老庄：风蚀岩台挡风掩体 + 流沙陷盆 + 断佛石窟
    desert_mesas(ctx) {
      const { rng, grid, floorRow, platforms, decors, bossArenaStart } = ctx;
      let c = 15;
      let curFloor = 14;

      while (c < bossArenaStart - 6) {
        const mod = rng.pick(['quicksand_basin', 'windbreak_mesa', 'sand_grotto', 'dune_steps']);
        if (mod === 'quicksand_basin' && c + 9 < bossArenaStart) {
          const w = rng.int(8, 12);
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          for (let x = c; x <= endC; x++) {
            if (x >= c + 1 && x <= endC - 1) {
              floorRow[x] = 15;
              grid[14][x] = TILE_QUICKSAND;
            } else {
              floorRow[x] = 14;
            }
          }
          // 流沙上方随机浮石跳板
          const pRow = rng.int(10, 11);
          fillGrid(grid, pRow, pRow, c + 2, endC - 2, TILE_ONEWAY);
          platforms.push({ cStart: c + 2, cEnd: endC - 2, row: pRow });
          decors.push({ type: 'broken_buddha', x: (c + 1) * TILE_SIZE, y: 14 * TILE_SIZE });
          curFloor = 14;
          c = endC + 1;
        } else if (mod === 'windbreak_mesa' && c + 8 < bossArenaStart) {
          // 高耸实心风蚀岩台（侧面可阻挡三昧黄风！）
          const w = rng.int(7, 10);
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          const mesaTop = rng.int(10, 11);
          for (let x = c; x <= endC; x++) floorRow[x] = x === c || x === endC ? 13 : mesaTop;
          platforms.push({ cStart: c + 1, cEnd: endC - 1, row: mesaTop });
          curFloor = 13;
          c = endC + 1;
        } else if (mod === 'sand_grotto' && c + 9 < bossArenaStart) {
          const w = rng.int(9, 11);
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          for (let x = c; x <= endC; x++) floorRow[x] = 14;
          fillGrid(grid, 8, 9, c + 2, endC - 2, TILE_SOLID);
          grid[11][c + 1] = TILE_ONEWAY;
          grid[11][endC - 1] = TILE_ONEWAY;
          platforms.push({ cStart: c + 2, cEnd: endC - 2, row: 8 });
          c = endC + 1;
        } else {
          const w = rng.int(6, 9);
          const endC = Math.min(bossArenaStart - 1, c + w - 1);
          curFloor = clamp(curFloor + rng.pick([-2, -1, 1, 2]), 11, 15);
          for (let x = c; x <= endC; x++) floorRow[x] = curFloor;
          c = endC + 1;
        }
      }
    },

    // 4. 八百流沙·万寿山：弱水沉渊 + 移动骷髅浮筏 + 礁石孤岛 + 五庄仙苑玉台
    river_islets(ctx) {
      const { rng, grid, floorRow, platforms, movingPlatforms, decors, bossArenaStart } = ctx;
      let c = 15;

      while (c < bossArenaStart - 6) {
        const mod = rng.pick(['raft_crossing', 'skull_reefs', 'wuzhuang_terrace']);
        if (mod === 'raft_crossing' && c + 11 < bossArenaStart) {
          // 八百里弱水大跨度河面 + 水平往返浮水木排！
          const w = rng.int(10, 13);
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          floorRow[c] = 13;
          floorRow[endC] = 13;
          for (let x = c + 1; x <= endC - 1; x++) {
            floorRow[x] = 16;
            grid[15][x] = TILE_HAZARD;
          }
          // 添加移动浮筏 + 上方备用藤桥跳台（兼顾爽快感与容错）
          const minPx = (c + 2.5) * TILE_SIZE;
          const maxPx = (endC - 1.5) * TILE_SIZE;
          movingPlatforms.push({
            x: (minPx + maxPx) * 0.5,
            y: 13 * TILE_SIZE,
            w: 64,
            minX: minPx,
            maxX: maxPx,
            speed: rng.int(52, 74),
            dir: rng.chance(0.5) ? 1 : -1,
            dx: 0
          });
          // 中段小礁石或高空仙索方便快节奏连跳飞渡
          const mid = Math.floor((c + endC) / 2);
          grid[10][mid - 1] = TILE_ONEWAY;
          grid[10][mid] = TILE_ONEWAY;
          grid[10][mid + 1] = TILE_ONEWAY;
          platforms.push({ cStart: mid - 1, cEnd: mid + 1, row: 10 });
          c = endC + 1;
        } else if (mod === 'skull_reefs' && c + 9 < bossArenaStart) {
          const w = rng.int(9, 12);
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          for (let x = c; x <= endC; x++) {
            const isIsland = (x - c) % 4 !== 2;
            if (isIsland) {
              floorRow[x] = 13 + ((x - c) % 2);
            } else {
              floorRow[x] = 16;
              grid[15][x] = TILE_HAZARD;
            }
          }
          decors.push({ type: 'skull_post', x: (c + 1) * TILE_SIZE, y: floorRow[c + 1] * TILE_SIZE });
          c = endC + 1;
        } else {
          // 万寿山五庄观多层白玉仙苑
          const w = rng.int(8, 11);
          const endC = Math.min(bossArenaStart - 1, c + w - 1);
          for (let x = c; x <= endC; x++) floorRow[x] = 14;
          fillGrid(grid, 11, 11, c + 1, endC - 1, TILE_ONEWAY);
          fillGrid(grid, 8, 8, c + 2, endC - 2, TILE_ONEWAY);
          platforms.push({ cStart: c + 2, cEnd: endC - 2, row: 8 });
          c = endC + 1;
        }
      }
    },

    // 5. 白骨幽冥·波月洞：封闭钟乳石洞顶 + 上下双层分岔尸魔暗道 + 鬼火骨刺坑
    cavern_crypt(ctx) {
      const { rng, grid, floorRow, platforms, decors, bossArenaStart } = ctx;
      // 铺设封闭幽冥洞顶与随机倒悬钟乳石齿
      for (let x = 8; x < bossArenaStart + 4; x++) {
        const roofDepth = 1 + ((x * 7 + rng.int(0, 2)) % 3);
        for (let r = 0; r <= roofDepth; r++) {
          grid[r][x] = TILE_SOLID;
        }
      }

      let c = 15;
      while (c < bossArenaStart - 6) {
        const mod = rng.pick(['split_tunnel', 'bone_pit', 'crypt_dome']);
        if (mod === 'split_tunnel' && c + 11 < bossArenaStart) {
          // 上下双层分岔墓道：中间实心岩层(9~10)分隔为上层暗道(8)与下层墓道(14)！
          const w = rng.int(10, 13);
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          for (let x = c; x <= endC; x++) floorRow[x] = 14;
          fillGrid(grid, 9, 10, c + 2, endC - 2, TILE_SOLID);
          // 两侧入口跳板供玩家自由择路走上层或下层
          grid[11][c] = TILE_ONEWAY;
          grid[11][c + 1] = TILE_ONEWAY;
          grid[11][endC - 1] = TILE_ONEWAY;
          grid[11][endC] = TILE_ONEWAY;
          platforms.push({ cStart: c + 2, cEnd: endC - 2, row: 9 });
          c = endC + 1;
        } else if (mod === 'bone_pit' && c + 8 < bossArenaStart) {
          const w = rng.int(8, 11);
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          for (let x = c; x <= endC; x++) {
            if (x >= c + 2 && x <= endC - 2) {
              floorRow[x] = 16;
              grid[15][x] = TILE_HAZARD;
              grid[12][x] = TILE_ONEWAY;
            } else {
              floorRow[x] = 14;
            }
          }
          platforms.push({ cStart: c + 2, cEnd: endC - 2, row: 12 });
          decors.push({ type: 'skull_post', x: (c + 1) * TILE_SIZE, y: 14 * TILE_SIZE });
          c = endC + 1;
        } else {
          const w = rng.int(7, 10);
          const endC = Math.min(bossArenaStart - 1, c + w - 1);
          const fl = rng.pick([13, 14, 15]);
          for (let x = c; x <= endC; x++) floorRow[x] = fl;
          fillGrid(grid, fl - 4, fl - 4, c + 1, endC - 1, TILE_ONEWAY);
          platforms.push({ cStart: c + 1, cEnd: endC - 1, row: fl - 4 });
          c = endC + 1;
        }
      }
    },

    // 6. 平顶峭壁·车迟高台：万仞石柱 + 踩踏崩落危岩栈桥 + 九丈祈雨高坛
    cliff_pillars(ctx) {
      const { rng, grid, floorRow, platforms, bossArenaStart } = ctx;
      let c = 15;

      while (c < bossArenaStart - 6) {
        const mod = rng.pick(['crumble_bridge', 'ritual_altar', 'pillar_hops']);
        if (mod === 'crumble_bridge' && c + 10 < bossArenaStart) {
          const w = rng.int(9, 12);
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          const bridgeR = rng.int(11, 12);
          floorRow[c] = bridgeR;
          floorRow[c + 1] = bridgeR;
          floorRow[endC - 1] = bridgeR;
          floorRow[endC] = bridgeR;
          for (let x = c + 2; x <= endC - 2; x++) {
            floorRow[x] = 16;
            grid[15][x] = TILE_HAZARD;
            grid[bridgeR][x] = TILE_CRUMBLE; // 踩踏后震动崩落的危岩板！
          }
          // 高空额外放一条安全索桥供高手二段跳抢速
          fillGrid(grid, bridgeR - 4, bridgeR - 4, c + 3, endC - 3, TILE_ONEWAY);
          platforms.push({ cStart: c + 3, cEnd: endC - 3, row: bridgeR - 4 });
          c = endC + 1;
        } else if (mod === 'ritual_altar' && c + 10 < bossArenaStart) {
          // 车迟国九丈祈雨金字塔高台
          const w = 10;
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          for (let x = c; x <= endC; x++) {
            const distMid = Math.abs(x - (c + 4.5));
            floorRow[x] = distMid < 2 ? 10 : distMid < 3.5 ? 12 : 14;
          }
          fillGrid(grid, 7, 7, c + 3, endC - 3, TILE_ONEWAY);
          platforms.push({ cStart: c + 3, cEnd: endC - 3, row: 7 });
          c = endC + 1;
        } else {
          const w = rng.int(8, 11);
          const endC = Math.min(bossArenaStart - 1, c + w - 1);
          for (let x = c; x <= endC; x++) {
            floorRow[x] = ((x - c) % 5 < 3) ? rng.pick([11, 12]) : 14;
          }
          c = endC + 1;
        }
      }
    },

    // 7. 通天冰河·金兜雪山：千里玄冰滑道 + 踏冰裂隙浮冰 + 金兜冰晶峰
    frozen_glacier(ctx) {
      const { rng, grid, floorRow, platforms, movingPlatforms, decors, bossArenaStart } = ctx;
      let c = 15;

      while (c < bossArenaStart - 6) {
        const mod = rng.pick(['ice_rink', 'ice_crevasse', 'glacier_spire']);
        if (mod === 'ice_rink' && c + 10 < bossArenaStart) {
          // 千里冰封通天河：表层直接铺设 TILE_ICE 玄冰滑面！
          const w = rng.int(9, 13);
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          const rRow = rng.pick([13, 14]);
          for (let x = c; x <= endC; x++) {
            floorRow[x] = rRow + 1;
            grid[rRow][x] = TILE_ICE;
          }
          fillGrid(grid, rRow - 3, rRow - 3, c + 2, endC - 2, TILE_ONEWAY);
          platforms.push({ cStart: c + 2, cEnd: endC - 2, row: rRow - 3 });
          decors.push({ type: 'ice_crystal', x: (c + 2) * TILE_SIZE, y: rRow * TILE_SIZE });
          c = endC + 1;
        } else if (mod === 'ice_crevasse' && c + 10 < bossArenaStart) {
          // 身落天河冰层裂口 + 漂移浮冰
          const w = rng.int(9, 12);
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          floorRow[c] = 14;
          grid[13][c] = TILE_ICE;
          floorRow[endC] = 14;
          grid[13][endC] = TILE_ICE;
          for (let x = c + 1; x <= endC - 1; x++) {
            floorRow[x] = 16;
            grid[15][x] = TILE_HAZARD;
          }
          const minPx = (c + 2) * TILE_SIZE;
          const maxPx = (endC - 1) * TILE_SIZE;
          movingPlatforms.push({
            x: (minPx + maxPx) * 0.5,
            y: 13 * TILE_SIZE,
            w: 60,
            minX: minPx,
            maxX: maxPx,
            speed: 62,
            dir: 1,
            dx: 0
          });
          fillGrid(grid, 10, 10, c + 3, endC - 3, TILE_ONEWAY);
          platforms.push({ cStart: c + 3, cEnd: endC - 3, row: 10 });
          c = endC + 1;
        } else {
          const w = rng.int(7, 10);
          const endC = Math.min(bossArenaStart - 1, c + w - 1);
          const fl = rng.int(11, 13);
          for (let x = c; x <= endC; x++) {
            floorRow[x] = fl + 1;
            grid[fl][x] = TILE_ICE;
          }
          decors.push({ type: 'ice_crystal', x: Math.floor((c + endC) / 2) * TILE_SIZE, y: fl * TILE_SIZE });
          c = endC + 1;
        }
      }
    },

    // 8. 西梁毒泽·盘丝百花：多层盘丝弹性蛛网床 + 荆棘密林拱顶 + 子母河毒沼
    spider_thicket(ctx) {
      const { rng, grid, floorRow, platforms, decors, bossArenaStart } = ctx;
      let c = 15;

      while (c < bossArenaStart - 6) {
        const mod = rng.pick(['cobweb_nest', 'thorn_canopy', 'poison_bridge']);
        if (mod === 'cobweb_nest' && c + 10 < bossArenaStart) {
          // 底层毒沼 + 空中交错双层弹性盘丝网床（TILE_WEB）！
          const w = rng.int(9, 12);
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          floorRow[c] = 13;
          floorRow[endC] = 13;
          for (let x = c + 1; x <= endC - 1; x++) {
            floorRow[x] = 16;
            grid[15][x] = TILE_HAZARD;
            if ((x - c) % 2 === 1) grid[12][x] = TILE_WEB;
            grid[12][x] = TILE_WEB;
          }
          fillGrid(grid, 8, 8, c + 2, endC - 2, TILE_WEB);
          platforms.push({ cStart: c + 2, cEnd: endC - 2, row: 8 });
          decors.push({ type: 'spider_cocoon', x: Math.floor((c + endC) / 2) * TILE_SIZE, y: 2 * TILE_SIZE, phase: c });
          c = endC + 1;
        } else if (mod === 'thorn_canopy' && c + 9 < bossArenaStart) {
          const w = rng.int(8, 11);
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          for (let x = c; x <= endC; x++) floorRow[x] = 14;
          fillGrid(grid, 3, 4, c + 1, endC - 1, TILE_SOLID);
          fillGrid(grid, 10, 10, c + 1, endC - 1, TILE_WEB);
          platforms.push({ cStart: c + 1, cEnd: endC - 1, row: 10 });
          decors.push({ type: 'spider_cocoon', x: (c + 3) * TILE_SIZE, y: 5 * TILE_SIZE, phase: endC });
          c = endC + 1;
        } else {
          const w = rng.int(7, 10);
          const endC = Math.min(bossArenaStart - 1, c + w - 1);
          const fl = rng.pick([12, 13, 14]);
          for (let x = c; x <= endC; x++) floorRow[x] = fl;
          fillGrid(grid, fl - 3, fl - 3, c + 1, endC - 1, TILE_ONEWAY);
          platforms.push({ cStart: c + 1, cEnd: endC - 1, row: fl - 3 });
          c = endC + 1;
        }
      }
    },

    // 9. 八百火焰·翠云魔窟：沸腾熔岩海 + 火山热浪上升喷口 + 黑曜石孤柱 + 熔岩浮石
    volcano_caldera(ctx) {
      const { rng, grid, floorRow, platforms, movingPlatforms, bossArenaStart } = ctx;
      let c = 15;

      while (c < bossArenaStart - 6) {
        const mod = rng.pick(['thermal_caldera', 'obsidian_pillars', 'magma_ferry']);
        if (mod === 'thermal_caldera' && c + 10 < bossArenaStart) {
          // 熔岩海中央耸立火山喷口，喷涌 TILE_UPDRAFT 炽热上升气流助玩家凌空飞渡！
          const w = rng.int(9, 12);
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          floorRow[c] = 13;
          floorRow[endC] = 13;
          const mid = Math.floor((c + endC) / 2);
          for (let x = c + 1; x <= endC - 1; x++) {
            if (Math.abs(x - mid) <= 1) {
              floorRow[x] = 13;
              for (let r = 6; r < 13; r++) grid[r][x] = TILE_UPDRAFT;
            } else {
              floorRow[x] = 16;
              grid[15][x] = TILE_HAZARD;
            }
          }
          fillGrid(grid, 8, 8, c + 2, endC - 2, TILE_ONEWAY);
          platforms.push({ cStart: c + 2, cEnd: endC - 2, row: 8 });
          c = endC + 1;
        } else if (mod === 'magma_ferry' && c + 11 < bossArenaStart) {
          const w = rng.int(10, 12);
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          floorRow[c] = 13;
          floorRow[endC] = 13;
          for (let x = c + 1; x <= endC - 1; x++) {
            floorRow[x] = 16;
            grid[15][x] = TILE_HAZARD;
          }
          const minPx = (c + 2) * TILE_SIZE;
          const maxPx = (endC - 1) * TILE_SIZE;
          movingPlatforms.push({
            x: (minPx + maxPx) * 0.5,
            y: 12.5 * TILE_SIZE,
            w: 62,
            minX: minPx,
            maxX: maxPx,
            speed: 68,
            dir: -1,
            dx: 0
          });
          fillGrid(grid, 9, 9, c + 3, endC - 3, TILE_ONEWAY);
          platforms.push({ cStart: c + 3, cEnd: endC - 3, row: 9 });
          c = endC + 1;
        } else {
          const w = rng.int(8, 11);
          const endC = Math.min(bossArenaStart - 1, c + w - 1);
          for (let x = c; x <= endC; x++) {
            floorRow[x] = (x - c) % 4 === 2 ? 15 : rng.pick([12, 13]);
            if (floorRow[x] === 15) grid[14][x] = TILE_HAZARD;
          }
          c = endC + 1;
        }
      }
    },

    // 10. 祭赛金塔·碧波龙渊：水底低重力 + 十三层宝塔阁 + 海眼上升气泡柱 + 珊瑚台
    underwater_palace(ctx) {
      const { rng, grid, floorRow, platforms, decors, bossArenaStart } = ctx;
      let c = 15;

      while (c < bossArenaStart - 6) {
        const mod = rng.pick(['pagoda_tiers', 'bubble_trench', 'coral_reef']);
        if (mod === 'pagoda_tiers' && c + 9 < bossArenaStart) {
          // 祭赛国金光宝塔三层立体阁楼
          const w = rng.int(8, 11);
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          for (let x = c; x <= endC; x++) floorRow[x] = 14;
          fillGrid(grid, 10, 10, c + 1, endC - 1, TILE_ONEWAY);
          fillGrid(grid, 6, 6, c + 2, endC - 2, TILE_ONEWAY);
          platforms.push({ cStart: c + 2, cEnd: endC - 2, row: 6 });
          platforms.push({ cStart: c + 1, cEnd: endC - 1, row: 10 });
          decors.push({ type: 'pearl_clam', x: Math.floor((c + endC) / 2) * TILE_SIZE, y: 14 * TILE_SIZE });
          c = endC + 1;
        } else if (mod === 'bubble_trench' && c + 9 < bossArenaStart) {
          const w = rng.int(9, 11);
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          for (let x = c; x <= endC; x++) {
            if (x >= c + 2 && x <= endC - 2) {
              floorRow[x] = 16;
              grid[15][x] = TILE_HAZARD;
              for (let r = 7; r <= 14; r++) grid[r][x] = TILE_UPDRAFT; // 海眼上升气泡群！
            } else {
              floorRow[x] = 12;
            }
          }
          c = endC + 1;
        } else {
          const w = rng.int(7, 10);
          const endC = Math.min(bossArenaStart - 1, c + w - 1);
          const fl = rng.int(11, 14);
          for (let x = c; x <= endC; x++) floorRow[x] = fl;
          decors.push({ type: 'pearl_clam', x: (c + 2) * TILE_SIZE, y: fl * TILE_SIZE });
          c = endC + 1;
        }
      }
    },

    // 11. 小雷音幻境·狮驼魔城：万妖重甲城垛 + 陷空山无底深井竖洞 + 崩塌机关吊桥
    demon_citadel(ctx) {
      const { rng, grid, floorRow, platforms, decors, bossArenaStart } = ctx;
      let c = 15;

      while (c < bossArenaStart - 6) {
        const mod = rng.pick(['bottomless_shaft', 'skull_rampart', 'trap_drawbridge']);
        if (mod === 'bottomless_shaft' && c + 10 < bossArenaStart) {
          // 陷空山无底洞竖井：从 10 层高城墙骤降至 16 层地底深井，再借交错跳板杀出重围！
          const w = rng.int(9, 12);
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          floorRow[c] = 10;
          floorRow[c + 1] = 10;
          floorRow[endC - 1] = 11;
          floorRow[endC] = 11;
          for (let x = c + 2; x <= endC - 2; x++) {
            floorRow[x] = 16;
          }
          fillGrid(grid, 13, 13, c + 2, c + 4, TILE_ONEWAY);
          fillGrid(grid, 11, 11, endC - 4, endC - 2, TILE_ONEWAY);
          fillGrid(grid, 8, 8, c + 3, endC - 3, TILE_CRUMBLE);
          platforms.push({ cStart: c + 2, cEnd: c + 4, row: 13 });
          c = endC + 1;
        } else if (mod === 'trap_drawbridge' && c + 9 < bossArenaStart) {
          const w = rng.int(8, 11);
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          floorRow[c] = 13;
          floorRow[endC] = 13;
          for (let x = c + 1; x <= endC - 1; x++) {
            floorRow[x] = 16;
            grid[15][x] = TILE_HAZARD;
            grid[13][x] = TILE_CRUMBLE;
          }
          fillGrid(grid, 9, 9, c + 2, endC - 2, TILE_ONEWAY);
          platforms.push({ cStart: c + 2, cEnd: endC - 2, row: 9 });
          c = endC + 1;
        } else {
          const w = rng.int(8, 11);
          const endC = Math.min(bossArenaStart - 1, c + w - 1);
          for (let x = c; x <= endC; x++) floorRow[x] = 13;
          fillGrid(grid, 9, 9, c + 1, endC - 1, TILE_ONEWAY);
          platforms.push({ cStart: c + 1, cEnd: endC - 1, row: 9 });
          decors.push({ type: 'skull_post', x: (c + 2) * TILE_SIZE, y: 13 * TILE_SIZE });
          c = endC + 1;
        }
      }
    },

    // 12. 天竺仙境·凌云大雷音：浮空仙岛 + 七彩祥云弹跳台 + 凌云渡独木虹桥与无底船
    celestial_clouds(ctx) {
      const { rng, grid, floorRow, platforms, movingPlatforms, decors, bossArenaStart } = ctx;
      let c = 15;

      while (c < bossArenaStart - 6) {
        const mod = rng.pick(['bounce_islands', 'lingyun_bridge', 'lotus_stairs']);
        if (mod === 'bounce_islands' && c + 11 < bossArenaStart) {
          // 浮空仙岛群 + 七彩祥云弹跳台（TILE_BOUNCE）飞跃万丈雷云渊！
          const w = rng.int(10, 13);
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          const mid = Math.floor((c + endC) / 2);
          for (let x = c; x <= endC; x++) {
            if (x <= c + 1 || x >= endC - 1) {
              floorRow[x] = 12;
            } else if (Math.abs(x - mid) <= 1) {
              floorRow[x] = 13;
              grid[12][x] = TILE_BOUNCE; // 七彩祥云高弹台！
            } else {
              floorRow[x] = 16;
              grid[15][x] = TILE_HAZARD;
            }
          }
          fillGrid(grid, 7, 7, c + 3, endC - 3, TILE_ONEWAY);
          platforms.push({ cStart: c + 3, cEnd: endC - 3, row: 7 });
          c = endC + 1;
        } else if (mod === 'lingyun_bridge' && c + 11 < bossArenaStart) {
          // 第80难经典名场面：凌云渡独木长桥 + 桥下接引佛祖无底船往返渡人！
          const w = rng.int(10, 13);
          const endC = Math.min(bossArenaStart - 2, c + w - 1);
          floorRow[c] = 12;
          floorRow[endC] = 12;
          for (let x = c + 1; x <= endC - 1; x++) {
            floorRow[x] = 16;
            grid[15][x] = TILE_HAZARD;
            grid[11][x] = TILE_ONEWAY; // 独木虹桥
          }
          const minPx = (c + 2) * TILE_SIZE;
          const maxPx = (endC - 1) * TILE_SIZE;
          movingPlatforms.push({
            x: (minPx + maxPx) * 0.5,
            y: 13.5 * TILE_SIZE,
            w: 68,
            minX: minPx,
            maxX: maxPx,
            speed: 58,
            dir: 1,
            dx: 0
          });
          platforms.push({ cStart: c + 2, cEnd: endC - 2, row: 11 });
          c = endC + 1;
        } else {
          const w = rng.int(8, 10);
          const endC = Math.min(bossArenaStart - 1, c + w - 1);
          const fl = rng.int(11, 13);
          for (let x = c; x <= endC; x++) floorRow[x] = fl;
          grid[fl - 1][c + 1] = TILE_BOUNCE;
          fillGrid(grid, fl - 4, fl - 4, c + 2, endC - 1, TILE_ONEWAY);
          platforms.push({ cStart: c + 2, cEnd: endC - 1, row: fl - 4 });
          decors.push({ type: 'lotus_lamp', x: Math.floor((c + endC) / 2) * TILE_SIZE, y: fl * TILE_SIZE });
          c = endC + 1;
        }
      }
    }
  };

  /**
   * 100% 通行性保底扫描器：防止任何极端随机数导致过高的垂直墙（>3格无踏板）或过宽的深坑（>5格无落脚点）
   */
  function ensureTraversability(grid, floorRow, startCol, endCol) {
    let safeSpan = 0;
    for (let x = startCol; x < endCol; x++) {
      const cur = floorRow[x];
      const nxt = floorRow[x + 1];
      // 若相邻两列向上陡升超过 3 格（72px），在左侧自动嵌入一级踏脚单向木板
      if (cur - nxt > 3) {
        const stepRow = nxt + 2;
        if (grid[stepRow][x] === TILE_EMPTY) grid[stepRow][x] = TILE_ONEWAY;
        if (x - 1 >= startCol && grid[stepRow][x - 1] === TILE_EMPTY) grid[stepRow][x - 1] = TILE_ONEWAY;
      }

      // 检测连续深渊陷阱宽度，若连续 > 5 列上方全空，自动架设中继跳板
      const hasFoothold =
        floorRow[x] <= 14 ||
        grid[13][x] !== TILE_EMPTY ||
        grid[12][x] !== TILE_EMPTY ||
        grid[11][x] !== TILE_EMPTY ||
        grid[10][x] !== TILE_EMPTY;
      if (!hasFoothold) {
        safeSpan++;
        if (safeSpan >= 4) {
          grid[12][x] = TILE_ONEWAY;
          grid[12][x - 1] = TILE_ONEWAY;
          safeSpan = 0;
        }
      } else {
        safeSpan = 0;
      }
    }
  }

  /**
   * 生成带地域特色的随机守关妖王决战殿
   */
  function buildRegionalBossArena(rng, grid, floorRow, bossArenaStart, cols, region) {
    const bossFloor = 14;
    for (let x = bossArenaStart; x <= cols - 3; x++) {
      floorRow[x] = bossFloor;
      // 通天冰河 Boss 殿两侧附带玄冰加速带
      if (region.id === 'tongtian_glacier' && x >= bossArenaStart + 3 && x <= cols - 6 && (x % 3 !== 0)) {
        floorRow[x] = bossFloor + 1;
        grid[bossFloor][x] = TILE_ICE;
      }
    }

    // 3 种随机 Boss 殿战术平台布局变体！
    const layoutVariant = rng.pick(['twin_wings', 'crown_pyramid', 'sky_arch']);
    if (layoutVariant === 'crown_pyramid') {
      fillGrid(grid, bossFloor - 3, bossFloor - 3, bossArenaStart + 3, bossArenaStart + 7, TILE_ONEWAY);
      fillGrid(grid, bossFloor - 3, bossFloor - 3, cols - 10, cols - 6, TILE_ONEWAY);
      const mid = Math.floor((bossArenaStart + cols - 3) / 2);
      fillGrid(grid, bossFloor - 6, bossFloor - 6, mid - 3, mid + 3, TILE_ONEWAY);
    } else if (layoutVariant === 'sky_arch') {
      const mid = Math.floor((bossArenaStart + cols - 3) / 2);
      fillGrid(grid, bossFloor - 4, bossFloor - 4, mid - 5, mid + 5, TILE_ONEWAY);
      if (region.id === 'lingshan_thunder') {
        grid[bossFloor - 1][bossArenaStart + 4] = TILE_BOUNCE;
        grid[bossFloor - 1][cols - 7] = TILE_BOUNCE;
      } else if (region.id === 'xiliang_spiders') {
        fillGrid(grid, bossFloor - 3, bossFloor - 3, bossArenaStart + 3, bossArenaStart + 6, TILE_WEB);
        fillGrid(grid, bossFloor - 3, bossFloor - 3, cols - 9, cols - 6, TILE_WEB);
      }
    } else {
      fillGrid(grid, bossFloor - 4, bossFloor - 4, bossArenaStart + 4, bossArenaStart + 8, TILE_ONEWAY);
      fillGrid(grid, bossFloor - 4, bossFloor - 4, cols - 11, cols - 7, TILE_ONEWAY);
    }

    return bossFloor;
  }

  /**
   * 智能匹配当前劫难与地域的妖魔群和守关妖王（兼容原版 4 关与拓展 81 难全怪物库！）
   */
  function pickStageCombatants(rng, region, tribNo) {
    const enemyKeys = Object.keys(ENEMY_TYPES || {});
    const bossKeys = Object.keys(BOSS_TYPES || {});

    let mobPool = [];
    let bossId = region.defaultBossId;

    // 若已加载 81 难完整怪物配置（trib_01 ~ trib_81），优先匹配同卷/同难原著妖魔！
    if (Trib81Mod && Array.isArray(Trib81Mod.TRIBULATIONS_81)) {
      const exact = Trib81Mod.TRIBULATIONS_81.find((t) => t.no === tribNo);
      const ch = exact ? exact.chapter : Math.floor((tribNo - 1) / 9);
      const chapterEntries = Trib81Mod.TRIBULATIONS_81.filter((t) => t.chapter === ch);

      const chMobs = chapterEntries
        .filter((t) => t.rank !== 'boss' && ENEMY_TYPES[t.id])
        .map((t) => t.id);
      if (chMobs.length > 0) {
        mobPool = exact && exact.rank === 'mob' ? [exact.id, exact.id].concat(chMobs) : chMobs;
      }
      const chBosses = chapterEntries
        .filter((t) => t.rank === 'boss' && BOSS_TYPES[t.id])
        .map((t) => t.id);
      if (exact && (exact.rank === 'boss' || exact.rank === 'elite') && BOSS_TYPES[exact.id]) {
        bossId = exact.id;
      } else if (chBosses.length > 0) {
        bossId = chBosses.find((id) => BOSS_TYPES[id].tribNo >= tribNo) || rng.pick(chBosses);
      }
    }

    if (mobPool.length === 0) {
      mobPool = (region.defaultEnemies || []).filter((id) => !!ENEMY_TYPES[id]);
    }
    if (mobPool.length === 0) {
      mobPool = enemyKeys.slice(0, 4);
    }
    if (!BOSS_TYPES[bossId]) {
      bossId = bossKeys[0];
    }

    return { mobPool, bossId };
  }

  /**
   * 主入口：生成指定关卡或指定八十一难编号的独立地形随机地图
   * @param {number} stageIndex 当前局第几劫 (0-based)
   * @param {number} loopCount 轮回周目数
   * @param {Object} [options] 可选 { tribulationNo: 1..81, regionId: string, seed: number }
   */
  function generateStage(stageIndex, loopCount, options) {
    const opts = options || {};
    const rng = createRng(opts.seed);

    // 1. 解析本关对应的【原著劫难 (1~81)】与【独立地形地域 (1~12)】
    let tribInfo = null;
    let region = null;

    if (opts.tribulationNo) {
      tribInfo = TerrainRegions.getTribulationTerrain(opts.tribulationNo);
      region = TerrainRegions.getRegionById(opts.regionId || tribInfo.regionId);
    } else if (opts.regionId) {
      region = TerrainRegions.getRegionById(opts.regionId);
      const list = TerrainRegions.getTribulationsInRegion(region.id);
      tribInfo = rng.pick(list) || TerrainRegions.getTribulationTerrain(1);
    } else {
      // 默认按西行地域顺序或分卷跨度映射独立地形，并在该地区随机抽取一难！
      const regIdx = stageIndex % TerrainRegions.REGIONAL_TERRAINS.length;
      region = TerrainRegions.REGIONAL_TERRAINS[regIdx];
      const list = TerrainRegions.getTribulationsInRegion(region.id);
      tribInfo = rng.pick(list) || TerrainRegions.getTribulationTerrain(stageIndex + 1);
    }

    const twist = tribInfo.twist || {};
    const difficultyMult = (1 + stageIndex * 0.34) * Math.pow(1.62, loopCount || 0);
    const cols = clamp((region.baseRoomWidth || 130) + rng.int(-6, 8), 116, 158);
    const rows = MAP_ROWS;

    // 合成兼容旧版 biome 字段的增强版 biome 描述对象（UI 与渲染器零感升级！）
    const legacyFallback = BIOMES[stageIndex % BIOMES.length] || BIOMES[0];
    const combatPool = pickStageCombatants(rng, region, tribInfo.no);
    const biome = Object.assign({}, legacyFallback, region, {
      id: region.id,
      regionId: region.id,
      tribulationNo: tribInfo.no,
      tribulationLabel: `${tribInfo.numLabel}·${tribInfo.tribName}`,
      locationName: tribInfo.location,
      name: `${tribInfo.numLabel} · ${tribInfo.tribName}（${region.shortName}）`,
      subtitle: `${tribInfo.location} · ${region.terrainLabel}`,
      enemies: combatPool.mobPool,
      bossId: combatPool.bossId,
      roomWidthTiles: cols,
      enemyCount: clamp(11 + Math.floor(stageIndex * 1.5) + rng.int(0, 2), 11, 22)
    });

    // 2. 初始化二维瓦片网格 [row][col]
    const grid = [];
    for (let r = 0; r < rows; r++) {
      grid.push(new Array(cols).fill(TILE_EMPTY));
    }
    for (let r = 0; r < rows; r++) {
      grid[r][0] = TILE_SOLID;
      grid[r][1] = TILE_SOLID;
      grid[r][cols - 1] = TILE_SOLID;
      grid[r][cols - 2] = TILE_SOLID;
    }

    const floorRow = new Array(cols).fill(14);
    const platforms = [];
    const movingPlatforms = [];
    const decors = [];

    // 3. 起点土地庙安全区 (col 2 ~ 14)
    for (let c = 2; c <= 14; c++) {
      floorRow[c] = 14;
      if (region.id === 'tongtian_glacier' && c >= 10) {
        floorRow[c] = 15;
        grid[14][c] = TILE_ICE;
      }
    }

    // 4. 调用当前地区专属的【独立地形随机房间模块生成器】！
    const bossArenaStart = cols - 27;
    const builder = ARCHETYPE_BUILDERS[region.archetype] || ARCHETYPE_BUILDERS.temple_courtyards;
    builder({
      rng,
      grid,
      floorRow,
      platforms,
      movingPlatforms,
      decors,
      cols,
      rows,
      bossArenaStart,
      twist,
      region
    });

    // 5. Boss 决战殿随机战术地形
    const bossFloor = buildRegionalBossArena(rng, grid, floorRow, bossArenaStart, cols, region);

    // 6. 100% 跳跃通行性保底修正 + 填充底层实心岩体
    ensureTraversability(grid, floorRow, 14, bossArenaStart + 2);

    for (let x = 2; x < cols - 2; x++) {
      const fr = clamp(floorRow[x], 6, rows - 1);
      floorRow[x] = fr;
      for (let r = fr; r < rows; r++) {
        if (grid[r][x] === TILE_EMPTY) {
          grid[r][x] = TILE_SOLID;
        }
      }
    }

    // 7. 布置地域地标装饰物
    decors.push({ type: 'shrine_start', x: 5 * TILE_SIZE, y: 14 * TILE_SIZE });
    const landmarkType = region.landmarkDecor || 'lantern';
    for (let x = 8; x < cols - 8; x += rng.int(9, 14)) {
      const fy = floorRow[x];
      if (fy <= 14 && grid[fy - 1][x] === TILE_EMPTY) {
        decors.push({
          type: rng.chance(0.45) ? landmarkType : 'lantern',
          x: x * TILE_SIZE + 12,
          y: landmarkType === 'lantern' ? (fy - 3) * TILE_SIZE : fy * TILE_SIZE,
          phase: rng.next() * Math.PI * 2
        });
      }
    }
    decors.push({
      type: 'boss_gate',
      x: bossArenaStart * TILE_SIZE,
      y: bossFloor * TILE_SIZE
    });

    // 8. 随机布置宝箱、三才天书祭坛与仙缘法宝匣（严格校验安全落脚点！）
    const interactables = [];
    interactables.push({
      id: 'starter_relic_altar',
      type: 'ad_relic_chest',
      x: 10.5 * TILE_SIZE,
      y: 14 * TILE_SIZE,
      opened: false,
      label: '仙缘法宝匣（视频免费领神兵）'
    });

    const usablePlats = platforms.filter((p) => p.cEnd - p.cStart >= 2 && p.row >= 5 && p.row <= 13);
    const findSafeGroundSpot = (ratio) => {
      if (usablePlats.length > 0) {
        const idx = clamp(Math.floor(ratio * usablePlats.length), 0, usablePlats.length - 1);
        const p = usablePlats.splice(idx, 1)[0];
        const midC = Math.floor((p.cStart + p.cEnd) / 2);
        return { x: (midC + 0.5) * TILE_SIZE, y: p.row * TILE_SIZE };
      }
      let gx = clamp(Math.floor(18 + ratio * (bossArenaStart - 24)), 17, bossArenaStart - 5);
      for (let off = 0; off < 8; off++) {
        const testX = clamp(gx + (off % 2 === 0 ? off : -off), 16, bossArenaStart - 4);
        const fy = floorRow[testX];
        if (fy <= 14 && grid[fy - 1][testX] !== TILE_HAZARD) {
          gx = testX;
          break;
        }
      }
      const surfRow = grid[floorRow[gx] - 1][gx] === TILE_ICE ? floorRow[gx] - 1 : floorRow[gx];
      return { x: (gx + 0.5) * TILE_SIZE, y: surfRow * TILE_SIZE };
    };

    const s1 = findSafeGroundSpot(0.26);
    interactables.push({ id: 'scroll_1', type: 'scroll', x: s1.x, y: s1.y, opened: false, label: '拾取【三才天书】' });

    const s2 = findSafeGroundSpot(0.71);
    interactables.push({ id: 'scroll_2', type: 'scroll', x: s2.x, y: s2.y, opened: false, label: '拾取【三才天书】' });

    const c1 = findSafeGroundSpot(0.48);
    const wDrop1 = rng.pick(SUB_WEAPONS);
    interactables.push({
      id: 'chest_1',
      type: 'chest',
      x: c1.x,
      y: c1.y,
      opened: false,
      weaponId: wDrop1.id,
      label: '开启锁妖宝箱'
    });

    const c2 = findSafeGroundSpot(0.86);
    const wDrop2 = rng.pick(SUB_WEAPONS);
    interactables.push({
      id: 'chest_2',
      type: 'chest',
      x: c2.x,
      y: c2.y,
      opened: false,
      weaponId: wDrop2.id,
      label: '开启锁妖宝箱'
    });

    // 9. 随机分布地域妖魔群 + 劫难精英妖将 + 守关大妖王
    const enemySpawns = [];
    const totalCount = biome.enemyCount;
    const spanCols = bossArenaStart - 20;
    const eliteQuota = 1 + (twist.extraElites || 0);
    let elitesPlaced = 0;

    for (let i = 0; i < totalCount; i++) {
      const ratio = (i + 0.5) / totalCount;
      let spawnCol = clamp(Math.floor(17 + ratio * spanCols + rng.int(-2, 2)), 16, bossArenaStart - 4);

      // 确保怪刷在安全的实心砖、玄冰或跳台上，绝不刷进弱水/熔岩坑！
      for (let off = 0; off < 7; off++) {
        const tc = clamp(spawnCol + (off % 2 === 0 ? off : -off), 16, bossArenaStart - 4);
        if (floorRow[tc] <= 14 && grid[floorRow[tc] - 1][tc] !== TILE_HAZARD) {
          spawnCol = tc;
          break;
        }
      }

      let spawnRow = grid[floorRow[spawnCol] - 1][spawnCol] === TILE_ICE ? floorRow[spawnCol] - 1 : floorRow[spawnCol];
      for (let r = 6; r < spawnRow - 1; r++) {
        const gt = grid[r][spawnCol];
        if ((gt === TILE_ONEWAY || gt === TILE_WEB) && rng.chance(0.36)) {
          spawnRow = r;
          break;
        }
      }

      const typeId = rng.pick(biome.enemies);
      const isElite =
        elitesPlaced < eliteQuota &&
        i >= Math.floor(totalCount * 0.45) &&
        (i === Math.floor(totalCount * 0.6) || rng.chance(0.28));
      if (isElite) elitesPlaced++;

      enemySpawns.push({
        typeId,
        x: (spawnCol + 0.5) * TILE_SIZE,
        y: spawnRow * TILE_SIZE,
        isElite,
        difficultyMult
      });
    }

    const bossDef = BOSS_TYPES[biome.bossId] || BOSS_TYPES.black_bear_king;
    const bossSurfY =
      grid[bossFloor][cols - 10] === TILE_ICE ? bossFloor * TILE_SIZE : bossFloor * TILE_SIZE;
    const bossSpawn = {
      bossId: biome.bossId,
      def: bossDef,
      x: (cols - 10) * TILE_SIZE,
      y: bossSurfY,
      arenaLeftX: bossArenaStart * TILE_SIZE,
      arenaRightX: (cols - 2) * TILE_SIZE,
      difficultyMult
    };

    return {
      seed: rng.seed,
      stageIndex,
      loopCount: loopCount || 0,
      tribulationNo: tribInfo.no,
      tribulationInfo: tribInfo,
      region,
      biome,
      cols,
      rows,
      tileSize: TILE_SIZE,
      widthPx: cols * TILE_SIZE,
      heightPx: rows * TILE_SIZE,
      grid,
      floorRow,
      decors,
      movingPlatforms,
      crumbleStates: {}, // key: "r,c" -> { triggered, timer, broken }
      windTimer: 0,
      windCurrentForce: 0,
      interactables,
      enemySpawns,
      bossSpawn,
      bossArenaStartPx: bossArenaStart * TILE_SIZE,
      playerStart: {
        x: 6 * TILE_SIZE,
        y: 14 * TILE_SIZE
      }
    };
  }

  /**
   * 每帧更新独立地形动态机关：移动浮筏/祥云、踩踏危岩崩落重组、黄风岭周期性三昧狂风
   */
  function updateLevelMechanics(level, dt) {
    if (!level) return;

    // 1. 移动浮筏 / 祥云 / 浮冰往返运动
    if (level.movingPlatforms) {
      for (let i = 0; i < level.movingPlatforms.length; i++) {
        const mp = level.movingPlatforms[i];
        const prevX = mp.x;
        mp.x += mp.dir * mp.speed * dt;
        if (mp.x >= mp.maxX) {
          mp.x = mp.maxX;
          mp.dir = -1;
        } else if (mp.x <= mp.minX) {
          mp.x = mp.minX;
          mp.dir = 1;
        }
        mp.dx = mp.x - prevX;
      }
    }

    // 2. 踩踏危岩板震动 -> 崩落 -> 重组状态机
    if (level.crumbleStates) {
      const keys = Object.keys(level.crumbleStates);
      for (let i = 0; i < keys.length; i++) {
        const st = level.crumbleStates[keys[i]];
        if (!st) continue;
        st.timer -= dt;
        if (st.triggered && !st.broken && st.timer <= 0) {
          st.broken = true;
          st.timer = 2.6; // 崩落后 2.6 秒重新凝聚
        } else if (st.broken && st.timer <= 0) {
          delete level.crumbleStates[keys[i]];
        }
      }
    }

    // 3. 黄风岭三昧神风间歇吹拂机制（吹 2.6 秒，停 3.4 秒）
    const baseWind = level.region ? level.region.windStrength || 0 : 0;
    const windMult = (level.tribulationInfo && level.tribulationInfo.twist && level.tribulationInfo.twist.windMult) || 1;
    if (baseWind > 0) {
      level.windTimer = (level.windTimer || 0) + dt;
      const cycle = level.windTimer % 6.0;
      level.windCurrentForce = cycle > 3.4 ? -baseWind * windMult : 0;
    } else {
      level.windCurrentForce = 0;
    }
  }

  function getTileAtPx(level, px, py) {
    const c = Math.floor(px / TILE_SIZE);
    const r = Math.floor(py / TILE_SIZE);
    if (r < 0) return TILE_EMPTY;
    if (r >= level.rows || c < 0 || c >= level.cols) return TILE_SOLID;
    return level.grid[r][c];
  }

  function isSolidWallTile(t) {
    return t === TILE_SOLID || t === TILE_ICE;
  }

  /**
   * 实体 AABB 与十大地形机关碰撞物理引擎（对主角与全体妖魔自动生效！）
   */
  function moveAndCollide(level, entity, dt) {
    const halfW = entity.width * 0.5;
    const region = level.region || {};

    // A. 水底水晶宫 / 灵山仙境低重力浮力补偿
    if (!entity.onGround && region.gravityScale && region.gravityScale !== 1.0) {
      entity.vy -= (1 - region.gravityScale) * 1180 * dt;
    }

    // B. 黄风岭三昧神风横推（若角色迎风侧紧贴实心沙岩掩体则可免疫挡风！）
    if (level.windCurrentForce && !entity.isBoss) {
      const checkX = level.windCurrentForce < 0 ? entity.x + halfW + 8 : entity.x - halfW - 8;
      const sheltered = isSolidWallTile(getTileAtPx(level, checkX, entity.y - entity.height * 0.5));
      if (!sheltered) {
        entity.x += level.windCurrentForce * dt;
      }
    }

    // C. 通天河玄冰滑面动量滑行体验
    if (entity.onIce && entity.onGround) {
      if (Math.abs(entity.vx) > 5) {
        entity._iceCarryVx = entity.vx;
      } else if (entity._iceCarryVx && Math.abs(entity._iceCarryVx) > 8) {
        entity._iceCarryVx *= Math.pow(0.08, dt);
        entity.x += entity._iceCarryVx * 0.72 * dt;
      }
    } else {
      entity._iceCarryVx = 0;
    }

    // D. 黄风流沙陷足减速
    const effVx = entity.inQuicksand ? entity.vx * 0.62 : entity.vx;

    // 1. 水平移动碰撞
    entity.x += effVx * dt;
    if (effVx > 0) {
      const rightEdge = entity.x + halfW;
      const topY = entity.y - entity.height + 3;
      const botY = entity.y - 3;
      for (let py = topY; py <= botY; py += 10) {
        if (isSolidWallTile(getTileAtPx(level, rightEdge, py))) {
          const tileCol = Math.floor(rightEdge / TILE_SIZE);
          entity.x = tileCol * TILE_SIZE - halfW - 0.01;
          entity.vx = 0;
          entity._iceCarryVx = 0;
          entity.hitWall = 1;
          break;
        }
      }
      if (isSolidWallTile(getTileAtPx(level, entity.x + halfW, botY))) {
        const tileCol = Math.floor((entity.x + halfW) / TILE_SIZE);
        entity.x = tileCol * TILE_SIZE - halfW - 0.01;
        entity.vx = 0;
        entity.hitWall = 1;
      }
    } else if (effVx < 0) {
      const leftEdge = entity.x - halfW;
      const topY = entity.y - entity.height + 3;
      const botY = entity.y - 3;
      for (let py = topY; py <= botY; py += 10) {
        if (isSolidWallTile(getTileAtPx(level, leftEdge, py))) {
          const tileCol = Math.floor(leftEdge / TILE_SIZE);
          entity.x = (tileCol + 1) * TILE_SIZE + halfW + 0.01;
          entity.vx = 0;
          entity._iceCarryVx = 0;
          entity.hitWall = -1;
          break;
        }
      }
      if (isSolidWallTile(getTileAtPx(level, entity.x - halfW, botY))) {
        const tileCol = Math.floor((entity.x - halfW) / TILE_SIZE);
        entity.x = (tileCol + 1) * TILE_SIZE + halfW + 0.01;
        entity.vx = 0;
        entity.hitWall = -1;
      }
    }

    // 2. 垂直移动碰撞
    const prevY = entity.y;
    const prevVy = entity.vy;
    entity.y += entity.vy * dt;
    entity.onGround = false;
    entity.standingOnOneWay = false;
    entity.onIce = false;
    entity.inQuicksand = false;

    const sampleXs = [entity.x - halfW + 2, entity.x, entity.x + halfW - 2];

    if (entity.vy >= 0) {
      // 优先检测移动浮筏 / 七彩祥云平台承托与随动
      if (level.movingPlatforms && (!entity.dropThroughTimer || entity.dropThroughTimer <= 0)) {
        for (let m = 0; m < level.movingPlatforms.length; m++) {
          const mp = level.movingPlatforms[m];
          if (
            entity.x + halfW * 0.6 >= mp.x - mp.w * 0.5 &&
            entity.x - halfW * 0.6 <= mp.x + mp.w * 0.5 &&
            prevY <= mp.y + 8 &&
            entity.y >= mp.y
          ) {
            entity.y = mp.y;
            entity.vy = 0;
            entity.onGround = true;
            entity.standingOnOneWay = true;
            entity.x += mp.dx || 0;
            break;
          }
        }
      }

      // 瓦片落地检测
      if (!entity.onGround) {
        for (let i = 0; i < sampleXs.length; i++) {
          const sx = sampleXs[i];
          const t = getTileAtPx(level, sx, entity.y);
          const tileRow = Math.floor(entity.y / TILE_SIZE);
          const tileCol = Math.floor(sx / TILE_SIZE);
          const platTop = tileRow * TILE_SIZE;

          if (t === TILE_SOLID || t === TILE_ICE) {
            entity.y = platTop;
            entity.vy = 0;
            entity.onGround = true;
            if (t === TILE_ICE) entity.onIce = true;
            break;
          }
          if (t === TILE_QUICKSAND) {
            entity.y = Math.min(entity.y, platTop + 5); // 微陷黄沙视觉感
            entity.vy = 0;
            entity.onGround = true;
            entity.inQuicksand = true;
            break;
          }
          if (t === TILE_BOUNCE && prevY <= platTop + 10) {
            entity.y = platTop;
            entity.vy = -535; // 七彩祥云强力弹射升空！
            if (typeof entity.maxJumps === 'number') entity.jumpsLeft = entity.maxJumps;
            if (typeof entity.triggerSquash === 'function') entity.triggerSquash(0.76, 1.32);
            break;
          }
          if (t === TILE_WEB && (!entity.dropThroughTimer || entity.dropThroughTimer <= 0)) {
            if (prevY <= platTop + 8) {
              entity.y = platTop;
              // 高速落下触碰盘丝蛛网自动弹起，平走则稳稳承托！
              if (prevVy > 210 && !entity.isBoss && typeof entity.maxJumps === 'number') {
                entity.vy = -Math.min(460, prevVy * 0.8);
                entity.jumpsLeft = entity.maxJumps;
              } else {
                entity.vy = 0;
                entity.onGround = true;
                entity.standingOnOneWay = true;
              }
              break;
            }
          }
          if (t === TILE_CRUMBLE && (!entity.dropThroughTimer || entity.dropThroughTimer <= 0)) {
            const key = `${tileRow},${tileCol}`;
            const st = level.crumbleStates && level.crumbleStates[key];
            if (!st || !st.broken) {
              if (prevY <= platTop + 6) {
                entity.y = platTop;
                entity.vy = 0;
                entity.onGround = true;
                entity.standingOnOneWay = true;
                // 主角踩上危岩触发倒计时崩落！
                if (!st && level.crumbleStates && typeof entity.maxJumps === 'number') {
                  level.crumbleStates[key] = { triggered: true, timer: 0.58, broken: false };
                }
                break;
              }
            }
          }
          if (t === TILE_ONEWAY && (!entity.dropThroughTimer || entity.dropThroughTimer <= 0)) {
            if (prevY <= platTop + 6) {
              entity.y = platTop;
              entity.vy = 0;
              entity.onGround = true;
              entity.standingOnOneWay = true;
              break;
            }
          }
        }
      }
    } else {
      // 上跳顶头检测
      const headY = entity.y - entity.height;
      for (let i = 0; i < sampleXs.length; i++) {
        if (isSolidWallTile(getTileAtPx(level, sampleXs[i], headY))) {
          const tileRow = Math.floor(headY / TILE_SIZE);
          entity.y = (tileRow + 1) * TILE_SIZE + entity.height;
          entity.vy = 0;
          break;
        }
      }
    }

    // 3. 检测上升气流/热浪/气泡柱托举与脚底危险陷阱
    const bodyTile = getTileAtPx(level, entity.x, entity.y - entity.height * 0.5);
    const footTile = getTileAtPx(level, entity.x, entity.y - 4);
    if (bodyTile === TILE_UPDRAFT || footTile === TILE_UPDRAFT) {
      entity.vy = Math.max(-330, entity.vy - 1750 * dt);
      if (typeof entity.maxJumps === 'number' && entity.jumpsLeft < 1) {
        entity.jumpsLeft = 1;
      }
    }
    entity.inHazard = footTile === TILE_HAZARD;
  }

  return {
    TILE_SIZE,
    TILE_EMPTY,
    TILE_SOLID,
    TILE_ONEWAY,
    TILE_HAZARD,
    TILE_ICE,
    TILE_QUICKSAND,
    TILE_WEB,
    TILE_CRUMBLE,
    TILE_BOUNCE,
    TILE_UPDRAFT,
    generateStage,
    updateLevelMechanics,
    getTileAtPx,
    moveAndCollide
  };
});
