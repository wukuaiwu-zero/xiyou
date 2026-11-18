/**
 * 高细节 16-Bit 像素矩阵精灵烘焙引擎 (src/assets/pixelSprites.js)
 * 升级版：22x26 高密度多色阶西游人物立绘（含冠冕、甲胄、袈裟、獠牙、佛珠、龙角等丰富细节）
 * 涵盖 idle / run0 / run1 / attack 四套动作帧 + 受击纯白闪光剪影帧
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
})('pixelSprites', function (require) {
  const Env = require('../platform/env');
  let Monsters81Sprites = null;
  let Tribulations81 = null;
  let EquipAndMatSprites = null;
  let HeroModelEngine = null;
  try {
    Monsters81Sprites = require('./monsters81Sprites');
    Tribulations81 = require('../config/tribulations81');
  } catch (e) {
    Monsters81Sprites = null;
  }
  try {
    EquipAndMatSprites = require('./equipAndMatSprites');
  } catch (e) {
    EquipAndMatSprites = null;
  }
  try {
    HeroModelEngine = require('./heroModelEngine');
  } catch (e) {
    HeroModelEngine = null;
  }

  const _shadeCache = {};
  function shadeHexColor(hex, delta) {
    if (!hex || hex[0] !== '#' || hex.length < 7) return hex;
    const key = hex + '|' + delta;
    if (_shadeCache[key]) return _shadeCache[key];
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;
    if (delta > 0) {
      r = Math.min(255, Math.round(r + (255 - r) * delta));
      g = Math.min(255, Math.round(g + (255 - g) * delta));
      b = Math.min(255, Math.round(b + (255 - b) * delta));
    } else {
      const m = Math.max(0, 1 + delta);
      r = Math.max(0, Math.round(r * m));
      g = Math.max(0, Math.round(g * m));
      b = Math.max(0, Math.round(b * m));
    }
    const out =
      '#' +
      r.toString(16).padStart(2, '0') +
      g.toString(16).padStart(2, '0') +
      b.toString(16).padStart(2, '0');
    _shadeCache[key] = out;
    return out;
  }

  /**
   * 修正角色帧底部空白行悬空问题，确保站立/挥砍双足紧贴地面基线，奔跑帧保留1像素腾空弹性
   */
  function alignGroundRows(rows, liftRows) {
    if (!Array.isArray(rows) || !rows.length) return rows;
    const w = rows[0].length;
    const emptyLine = '.'.repeat(w);
    let end = rows.length - 1;
    while (end > 0 && /^[.\s]+$/.test(rows[end])) {
      end--;
    }
    const trimmed = rows.slice(0, end + 1);
    const pad = liftRows || 0;
    for (let i = 0; i < pad; i++) {
      trimmed.push(emptyLine);
    }
    return trimmed;
  }

  /**
   * 生成角色待机呼吸微动第2帧（上半身胸甲/冠冕轻微起伏1格，双足稳踏地面）
   */
  function makeHeroIdleBreath(rows) {
    const aligned = alignGroundRows(rows, 0);
    if (aligned.length < 10) return aligned;
    const w = aligned[0].length;
    const emptyLine = '.'.repeat(w);
    const footSplit = aligned.length - 4;
    // 上半身下沉 1 像素模拟沉稳呼吸蓄势，靴底保持锚定地面
    return [emptyLine].concat(aligned.slice(0, footSplit - 1)).concat(aligned.slice(footSplit));
  }

  function bakeGrid(rows, palette, pixelSize, whiteFlash) {
    if (HeroModelEngine && HeroModelEngine.bakeRefinedGrid && (pixelSize || 2) >= 1.5) {
      return HeroModelEngine.bakeRefinedGrid(rows, palette, pixelSize, whiteFlash);
    }
    const scale = pixelSize || 2;
    const h = rows.length;
    const w = rows.reduce((m, r) => Math.max(m, r.length), 0);
    const canvas = Env.createOffscreenCanvas(Math.ceil(w * scale), Math.ceil(h * scale));
    canvas._logicalW = canvas.width;
    canvas._logicalH = canvas.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    ctx.imageSmoothingEnabled = false;

    const enableBevel = !whiteFlash && scale >= 1.75;

    for (let y = 0; y < h; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ') continue;
        const col = whiteFlash ? '#ffffff' : palette[ch];
        if (!col) continue;
        ctx.fillStyle = col;
        const px = Math.round(x * scale);
        const py = Math.round(y * scale);
        const pw = Math.max(1, Math.round((x + 1) * scale) - px);
        const ph = Math.max(1, Math.round((y + 1) * scale) - py);
        ctx.fillRect(px, py, pw, ph);

        // 16-Bit 微立体受光棱边与暗部厚涂质感增强（保留硬边缘像素锐度）
        if (enableBevel && ch !== 'O' && ph >= 2 && col.toLowerCase() !== '#ffffff') {
          const upCh = y > 0 && x < rows[y - 1].length ? rows[y - 1][x] : '.';
          const dnCh = y < h - 1 && x < rows[y + 1].length ? rows[y + 1][x] : '.';
          if ((upCh === 'O' || upCh === '.' || upCh === ' ') && dnCh === ch) {
            ctx.fillStyle = shadeHexColor(col, 0.2);
            ctx.fillRect(px, py, pw, 1);
          } else if ((dnCh === 'O' || dnCh === '.' || dnCh === ' ') && upCh === ch) {
            ctx.fillStyle = shadeHexColor(col, -0.18);
            ctx.fillRect(px, py + ph - 1, pw, 1);
          }
        }
      }
    }
    return canvas;
  }

  /**
   * 烘焙像素染色剪影或元素附着状态贴图（用于彩色残影、大圣金身、寒霜/灼烧/感电/破甲受击状态）
   */
  function bakeTintedSprite(srcCanvas, tintColor, mode) {
    if (!srcCanvas || !srcCanvas.width || !srcCanvas.height) return srcCanvas;
    const canvas = Env.createOffscreenCanvas(srcCanvas.width, srcCanvas.height);
    canvas._logicalW = srcCanvas._logicalW || srcCanvas.width;
    canvas._logicalH = srcCanvas._logicalH || srcCanvas.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return srcCanvas;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(srcCanvas, 0, 0);
    if (mode === 'silhouette') {
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = tintColor || '#ffd60a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = tintColor || '#48cae4';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    return canvas;
  }

  // ==================== 五大西游主角高细节像素矩阵 (22x24 基底, scale=1.6 -> ~35x38) ====================
  const HERO_GRIDS = {
    // 1. 孙悟空：凤翅紫金冠、金箍圈、火眼金睛、锁子黄金甲、护肩兽首、虎皮战裙、云靴
    wukong: {
      palette: {
        O: '#120d18', // 描边墨黑
        G: '#ffd60a', // 亮金（紫金冠/金箍/甲片高光）
        A: '#e09f3e', // 暗金（甲胄阴影）
        R: '#ef233c', // 大圣绛红（冠缨/披风/战袍）
        D: '#9d0208', // 暗红阴影
        F: '#b5651d', // 金猴毛色深
        M: '#dda15e', // 猴面浅绒
        S: '#ffcb77', // 猴面高光
        E: '#ff0a54', // 火眼金睛赤芒
        W: '#ffffff', // 高光点
        T: '#fb8500', // 虎皮裙橘金
        B: '#22223b', // 战靴玄黑
        C: '#48cae4'  // 云靴青纹
      },
      idle0: [
        '......RO..GG..OR......',
        '.....ORGOOGGOOGRO.....',
        '.....OAAAGWGWAAAO.....',
        '....OOFFFFFFFFFFOO....',
        '...OOFFMMFFFFMMFFOO...',
        '...OFMMEWFMFFMEWMFO...',
        '....OFMMSSSSSSMMFO....',
        '....OOFSSSSSSSSFOO....',
        '..OOGGAAOOOOOOAAGGOO..',
        '.OOGGAAGGRRRRGAAGGOO..',
        '.OOGAAGGRGWWGRGAAGOO..',
        '..OOAAOAGGGGAOAAOO....',
        '...ORR.OAAAAAOO.RRO...',
        '.......ORRRRRRO.......',
        '......OOTOTOTTOO......',
        '.....OOTTOTOTTTOO.....',
        '.....OTTTTTTTTTTO.....',
        '.....OOOO....OOOO.....',
        '.....OBBO....OBBO.....',
        '.....OBCO....OCBO.....',
        '....OOBBO....OBBOO....',
        '....OOOOO....OOOOO....'
      ],
      run0: [
        '.....RO...GG...OR.....',
        '....ORGOOOGGOOOGRO....',
        '.....OAAAGWGWAAAO.....',
        '....OOFFFFFFFFFFOO....',
        '...OOFFMMFFFFMMFFOO...',
        '...OFMMEWFMFFMEWMFO...',
        '....OFMMSSSSSSMMFO....',
        '....OOFSSSSSSSSFOO....',
        '..OOGGAAOOOOOOAAGGOO..',
        '.ODRGGAAGGRRRGAAGGO...',
        'ODDRGAAGRGWWGRGAAGO...',
        '....OOAOAGGGGAOAAO....',
        '......ORRRRRRRRO......',
        '.....OOTOTOTOTTOO.....',
        '....OOTTTTTTTTTTOO....',
        '...OOBBO......OOBBO...',
        '..OOBCOO.......OCBOO..',
        '..OOOOO........OOOOO..',
        '......................',
        '......................',
        '......................',
        '......................'
      ],
      run1: [
        '......RO..GG..OR......',
        '.....ORGOOGGOOGRO.....',
        '.....OAAAGWGWAAAO.....',
        '....OOFFFFFFFFFFOO....',
        '...OOFFMMFFFFMMFFOO...',
        '...OFMMEWFMFFMEWMFO...',
        '....OFMMSSSSSSMMFO....',
        '....OOFSSSSSSSSFOO....',
        '..OOGGAAOOOOOOAAGGOO..',
        '.OOGGAAGGRRRRGAAGGOO..',
        '..OGAAGGRGWWGRGAAGOO..',
        '...OAAOAGGGGAOAAOO....',
        '......ORRRRRRRO.......',
        '......OOTOTOTTOO......',
        '......OTTTTTTTTO......',
        '.......OBBO.OBBO......',
        '......OOBCO.OCBOO.....',
        '......OOOOO.OOOOO.....',
        '......................',
        '......................',
        '......................',
        '......................'
      ],
      attack: [
        '.......RO.GG.OR.......',
        '......ORGOGGOGRO......',
        '......OAAAGWGWAAO.....',
        '.....OOFFFFFFFFFOO....',
        '....OOFFMMFFMMFFOO....',
        '....OFMMEWFMEWMFO.....',
        '.....OFMMSSSSMMFO.....',
        '..OOGGAAOOOOOOAAGGOO..',
        '.ODRGGAAGGRRRRGAAGGOO.',
        'ODDRGAAGRGWWGRGAAGOO..',
        '....OOAOAGGGGAOAAOO...',
        '.....OOTOTOTOTTOO.....',
        '....OOTTTTTTTTTTOO....',
        '...OOBBO......OOBBO...',
        '..OOBCOO.......OCBOO..',
        '..OOOOO........OOOOO..',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................'
      ]
    },

    // 2. 唐僧：五佛毗卢宝冠、红莲冠心、玉扣锦襕袈裟、108颗佛珠、素白僧袍、金丝法衣边
    tangseng: {
      palette: {
        O: '#120d18',
        G: '#ffd166', // 毗卢金冠/金襕纹
        A: '#e09f3e', // 金冠暗部
        C: '#ff4d6d', // 宝冠红莲宝珠
        R: '#d62828', // 锦襕大红袈裟
        D: '#9d0208', // 袈裟褶皱暗红
        S: '#ffe5d9', // 圣僧面容
        P: '#f4acb7', // 面容柔和阴影
        W: '#f8f9fa', // 素白内衬僧衣
        L: '#dee2e6', // 僧衣灰白阴影
        J: '#06d6a0', // 左肩羊脂翠玉环扣
        B: '#6f4518', // 胸前檀木佛珠
        K: '#2b2d42'  // 僧履
      },
      idle0: [
        '........OOOOOO........',
        '......OOGGCGGOO.......',
        '.....OOGGAGGAGGOO.....',
        '.....OAGGRGGRGGAO.....',
        '.....OOOOOOOOOOOO.....',
        '.....OSSSSSSSSSSO.....',
        '.....OSOPSSSSPOSO.....',
        '.....OSSPSSSSPSSO.....',
        '......OOSSSSSSOO......',
        '....OOWWBBBBBBWWOO....',
        '...OOWWWJRRRRRDRWOO...',
        '..OOWWWRGRGRGRGDRWOO..',
        '..OOWLLRRRRRRRRDDRWO..',
        '...OOLLRGRGRGRGDDRRO..',
        '....OOLRRRRRRRRDRRO...',
        '....OOWWWLLLLRRRRRO...',
        '....OOWWWLLLLGGGGGGO..',
        '.....OWWWLLLLWWWWWO...',
        '.....OOOO....OOOOO....',
        '.....OKKO....OKKO.....',
        '....OOKKO....OKKOO....',
        '....OOOOO....OOOOO....'
      ],
      run0: [
        '........OOOOOO........',
        '......OOGGCGGOO.......',
        '.....OOGGAGGAGGOO.....',
        '.....OAGGRGGRGGAO.....',
        '.....OOOOOOOOOOOO.....',
        '.....OSSSSSSSSSSO.....',
        '.....OSOPSSSSPOSO.....',
        '......OOSSSSSSOO......',
        '....OOWWBBBBBBWWOO....',
        '..OOOWWWJRRRRRDRWOO...',
        '.OOWWWWRGRGRGRGDRWO...',
        '..OOLLLRRRRRRRRDDRWO..',
        '...OOLLRGRGRGRGDDRRO..',
        '....OOWWWLLLLGGGGRRO..',
        '...OOWWWW....LLLLWWO..',
        '..OOKKOO......OOKKOO..',
        '..OOOOO........OOOOO..',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................'
      ],
      run1: [
        '........OOOOOO........',
        '......OOGGCGGOO.......',
        '.....OOGGAGGAGGOO.....',
        '.....OAGGRGGRGGAO.....',
        '.....OOOOOOOOOOOO.....',
        '.....OSSSSSSSSSSO.....',
        '.....OSOPSSSSPOSO.....',
        '......OOSSSSSSOO......',
        '....OOWWBBBBBBWWOO....',
        '...OOWWWJRRRRRDRWOO...',
        '...OWWWRGRGRGRGDRWOO..',
        '....OLLRRRRRRRRDDRWO..',
        '....OLLRGRGRGRGDDRRO..',
        '.....OWWWLLLLGGGGRRO..',
        '.....OWWWLLLLWWWWWO...',
        '......OKKO..OKKO......',
        '.....OOKKO..OOKKO.....',
        '.....OOOOO..OOOOO.....',
        '......................',
        '......................',
        '......................',
        '......................'
      ],
      attack: [
        '........OOOOOO........',
        '......OOGGCGGOO.......',
        '.....OOGGAGGAGGOO.....',
        '.....OAGGRGGRGGAO.....',
        '.....OOOOOOOOOOOO.....',
        '.....OSSSSSSSSSSO.....',
        '.....OSOPSSSSPOSO.....',
        '....OOWWBBBBBBWWOO....',
        '..OOOWWWJRRRRRDRWWOO..',
        '.OOWWWWRGRGRGRGDRWWOO.',
        '..OOLLLRRRRRRRRDDRWO..',
        '...OOLLRGRGRGRGDDRRO..',
        '....OOWWWLLLLGGGGRRO..',
        '...OOWWWW....LLLLWWO..',
        '..OOKKOO......OOKKOO..',
        '..OOOOO........OOOOO..',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................'
      ]
    },

    // 3. 猪八戒：天蓬乌金帽、红缨帽徽、蒲扇大耳、立体猪鼻+双白獠牙、玄铁肩甲、圆肚皮、腰挂红葫芦
    bajie: {
      palette: {
        O: '#120d18',
        H: '#22223b', // 乌金僧帽/敞怀黑坎肩
        M: '#4a4e69', // 玄铁护肩高光
        G: '#ffd166', // 天蓬金徽
        R: '#ef233c', // 红帽缨/腰间酒葫芦
        P: '#ffb3c1', // 猪皮亮粉
        S: '#ff8fa3', // 猪皮阴影/大耳内侧
        N: '#ff4d6d', // 猪鼻深粉鼻孔
        W: '#ffffff', // 上翘白獠牙/眼神高光
        B: '#4ea8de', // 沧浪蓝绸束腰
        D: '#1d3557'  // 皂靴
      },
      idle0: [
        '.........ORRO.........',
        '......OOOHHHHOOO......',
        '.....OHHHGGGGHHHO.....',
        '.OOOOPPPPPPPPPPPPOOOO.',
        'OPPSSPPPPPPPPPPPPSSPPO',
        'OPSSPPPOPPWWPPOPPPSSPO',
        '.OOOPPPPPPNNPPPPPPPOO.',
        '..OOWPPPPNNNNPPPPWOO..',
        '...OOHHSSSSSSSSHHHOO..',
        '.OOMMHHHPPPSSPPPHHMMO.',
        'OOMMHHHPPPPPPPPPPHHMMO',
        '.OOOOOHHPPPPPPPPHHOOO.',
        '.....OHHPPPOPPPPHHO...',
        '....OOBBBBBGBBBBBROO..',
        '....OHHHHHHHHHHHHRRO..',
        '....OHHHH....HHHHOOO..',
        '.....ODDO....ODDO.....',
        '....OODDO....ODDOO....',
        '....OOOOO....OOOOO....',
        '......................',
        '......................',
        '......................'
      ],
      run0: [
        '.........ORRO.........',
        '......OOOHHHHOOO......',
        '.....OHHHGGGGHHHO.....',
        '.OOOOPPPPPPPPPPPPOOOO.',
        'OPPSSPPPPPPPPPPPPSSPPO',
        'OPSSPPPOPPWWPPOPPPSSPO',
        '.OOOPPPPPPNNPPPPPPPOO.',
        '..OOWPPPPNNNNPPPPWOO..',
        '.OOMMHHHPPPSSPPPHHMMO.',
        'OOMMHHHPPPPPPPPPPHHMMO',
        '.OOOOOHHPPPOPPPPHHOOO.',
        '....OOBBBBBGBBBBBROO..',
        '...OOHHHHH....HHHHRRO.',
        '..OODDOO.......OODDOO.',
        '..OOOOO.........OOOOO.',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................'
      ],
      run1: [
        '.........ORRO.........',
        '......OOOHHHHOOO......',
        '.....OHHHGGGGHHHO.....',
        '.OOOOPPPPPPPPPPPPOOOO.',
        'OPPSSPPPPPPPPPPPPSSPPO',
        'OPSSPPPOPPWWPPOPPPSSPO',
        '.OOOPPPPPPNNPPPPPPPOO.',
        '..OOWPPPPNNNNPPPPWOO..',
        '.OOMMHHHPPPSSPPPHHMMO.',
        '.OMMHHHPPPPPPPPPPHHMO.',
        '..OOOOHHPPPOPPPPHHOO..',
        '.....OBBBBBGBBBBBROO..',
        '.....OHHHHHHHHHHHRRO..',
        '......ODDO..ODDO.OO...',
        '.....OODDO..OODDO.....',
        '.....OOOOO..OOOOO.....',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................'
      ],
      attack: [
        '.........ORRO.........',
        '......OOOHHHHOOO......',
        '.....OHHHGGGGHHHO.....',
        '.OOOOPPPPPPPPPPPPOOOO.',
        'OPPSSPPPPPPPPPPPPSSPPO',
        'OPSSPPPOPPWWPPOPPPSSPO',
        '..OOWPPPPNNNNPPPPWOO..',
        '.OOMMHHHPPPSSPPPHHMMO.',
        'OOMMHHHPPPPPPPPPPHHMMO',
        '....OOBBBBBGBBBBBROO..',
        '...OOHHHHH....HHHHRRO.',
        '..OODDOO.......OODDOO.',
        '..OOOOO.........OOOOO.',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................'
      ]
    },

    // 4. 沙悟净：赤金英雄箍、狂发赤髯、九颗骷髅白骨念珠、卷帘玄紫肩铠、流沙沧浪战裙
    wujing: {
      palette: {
        O: '#120d18',
        H: '#1b263b', // 冲天墨发
        R: '#e63946', // 赤红头箍
        G: '#ffd166', // 金箍扣/护腕金边
        S: '#d4a373', // 卷帘古铜肤色
        K: '#9d0208', // 浓密赤红连鬓大胡须
        F: '#dc2f02', // 赤须亮部
        W: '#f8f9fa', // 骷髅大念珠亮白
        L: '#adb5bd', // 念珠阴影
        P: '#5a189a', // 卷帘紫玄甲/战袍
        V: '#7b2cbf', // 战袍高光紫
        C: '#00b4d8', // 流沙水纹青护腰
        B: '#1d3557'
      },
      idle0: [
        '......OOHHHHHHOO......',
        '.....OHHHHHHHHHHO.....',
        '.....ORRGGGGGGROO.....',
        '.....OSSSSSSSSSSO.....',
        '.....OSOWSSSSWOSO.....',
        '....OOKKKFFFFKKKOO....',
        '...OOKKKFFFFFFKKKOO...',
        '...OOKKKKKKKKKKKKOO...',
        '..OOWLOWVVVVVVWOLWOO..',
        '.OOPPVOWLPWWPLWOVPPOO.',
        '.OOPPPPVWWLLWWVPPPPOO.',
        '..OOOOPVVVVVVVVPOOOO..',
        '.....OCCCCCCCCCCO.....',
        '....OOPPVVVVVVPPOO....',
        '....OPPPVVVVVVPPPO....',
        '....OPPP......PPPO....',
        '.....OBO......OBO.....',
        '....OOGBO....OBGOO....',
        '....OOOOO....OOOOO....',
        '......................',
        '......................',
        '......................'
      ],
      run0: [
        '......OOHHHHHHOO......',
        '.....OHHHHHHHHHHO.....',
        '.....ORRGGGGGGROO.....',
        '.....OSSSSSSSSSSO.....',
        '.....OSOWSSSSWOSO.....',
        '....OOKKKFFFFKKKOO....',
        '...OOKKKKKKKKKKKKOO...',
        '..OOWLOWVVVVVVWOLWOO..',
        '.OOPPVOWLPWWPLWOVPPOO.',
        '..OOPPPVVWLLWVVPPPOO..',
        '....OOCCCCCCCCCCOO....',
        '...OOPPPVVVVVVPPPOO...',
        '..OOPPP........PPPOO..',
        '.OOGBOO........OOBGOO.',
        '.OOOOO..........OOOOO.',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................'
      ],
      run1: [
        '......OOHHHHHHOO......',
        '.....OHHHHHHHHHHO.....',
        '.....ORRGGGGGGROO.....',
        '.....OSSSSSSSSSSO.....',
        '.....OSOWSSSSWOSO.....',
        '....OOKKKFFFFKKKOO....',
        '...OOKKKKKKKKKKKKOO...',
        '..OOWLOWVVVVVVWOLWOO..',
        '.OOPPVOWLPWWPLWOVPPOO.',
        '...OPPPVVWLLWVVPPPO...',
        '.....OCCCCCCCCCCO.....',
        '.....OPPPVVVVPPPO.....',
        '......OPP....PPO......',
        '.....OOGBO..OOBGO.....',
        '.....OOOOO..OOOOO.....',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................'
      ],
      attack: [
        '......OOHHHHHHOO......',
        '.....OHHHHHHHHHHO.....',
        '.....ORRGGGGGGROO.....',
        '.....OSSSSSSSSSSO.....',
        '....OOKKKFFFFKKKOO....',
        '...OOKKKKKKKKKKKKOO...',
        '..OOWLOWVVVVVVWOLWOO..',
        '.OOPPVOWLPWWPLWOVPPOO.',
        '..OOPPPVVWLLWVVPPPOO..',
        '....OOCCCCCCCCCCOO....',
        '...OOPPP......PPPOO...',
        '..OOGBOO......OOBGOO..',
        '..OOOOO........OOOOO..',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................'
      ]
    },

    // 5. 白龙马（敖烈）：分叉青玉珊瑚龙角、银白飘逸龙鬃、额间金龙印、西海银鳞重铠、沧海蓝战袍
    bailongma: {
      palette: {
        O: '#120d18',
        C: '#00f5d4', // 青电珊瑚龙角亮色
        T: '#00bbf9', // 龙角/龙瞳青蓝
        W: '#ffffff', // 银白龙鬃/白银甲高光
        L: '#caf0f8', // 银白长发阴影
        A: '#90e0ef', // 西海龙鳞甲底色
        M: '#48cae4', // 龙鳞甲中调
        G: '#ffd166', // 额间龙印/金饰扣
        S: '#ffe5d9', // 龙太子面容
        B: '#0077b6', // 沧海蓝战裙/披风
        D: '#03045e'  // 深海战靴
      },
      idle0: [
        '...CC............CC...',
        '..CCTO..OOOOOO..OTCC..',
        '...OTOOOWWWWWWWOOOTO..',
        '....OOWWWLLLLWWWWOO...',
        '...OOWWLSSGGSSLWWWOO..',
        '...OWWLSSWTSSWTSSWWO..',
        '..OOWWLSSSSSSSSSLWWO..',
        '..OWWLLOOSSSSSSOOLLWO.',
        '.OOBBWWAAOOOOOOAAWWOO.',
        '.OBB.OWAAMMWWMMAWOO...',
        'OBB..OWAAWWWWWWAAWO...',
        '.....OOMMGGGGGMMOO....',
        '.....OOBBAAAAABBOO....',
        '....OOBBBAAAAABBBOO...',
        '....OBBB..OOOO..BBBO..',
        '..........OMMO........',
        '.....OAAO......OAAO...',
        '.....ODDO......ODDO...',
        '....OODDO......ODDOO..',
        '....OOOOO......OOOOO..'
      ],
      run0: [
        '..CC.............CC...',
        '.CCTO...OOOOOO..OTCC..',
        '..OTOOOWWWWWWWWOOOTO..',
        '...OOOWWWLLLLWWWWOO...',
        '..OOWWWLSSGGSSLWWWOO..',
        '..OWWWLSSWTSSWTSSWWO..',
        '.OOBBWWAAOOOOOOAAWWO..',
        'OBBB.OWAAMMWWMMAWOO...',
        'OB...OWAAWWWWWWAAWO...',
        '.....OOMMGGGGGMMOO....',
        '....OOBBBAAAAABBBOO...',
        '...OOBBB.......BBBOO..',
        '..OODDOO........OODDO.',
        '..OOOOO..........OOOOO',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................'
      ],
      run1: [
        '...CC............CC...',
        '..CCTO..OOOOOO..OTCC..',
        '...OTOOOWWWWWWWOOOTO..',
        '....OOWWWLLLLWWWWOO...',
        '...OOWWLSSGGSSLWWWOO..',
        '...OWWLSSWTSSWTSSWWO..',
        '..OBBWWAAOOOOOOAAWWO..',
        '.OBB.OWAAMMWWMMAWOO...',
        '.....OWAAWWWWWWAAWO...',
        '.....OOMMGGGGGMMOO....',
        '.....OOBBAAAAABBOO....',
        '......OBB....BBO......',
        '.....OODDO..OODDO.....',
        '.....OOOOO..OOOOO.....',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................'
      ],
      attack: [
        '..CC.............CC...',
        '.CCTO...OOOOOO..OTCC..',
        '..OTOOOWWWWWWWWOOOTO..',
        '...OOOWWWLLLLWWWWOO...',
        '..OOWWWLSSWTSSWTSSWO..',
        '.OOBBWWAAOOOOOOAAWWO..',
        'OBBB.OWAAMMWWMMAWWOO..',
        'OB...OWAAWWWWWWAAWO...',
        '.....OOMMGGGGGMMOO....',
        '...OOBBBBAAAAABBBBOO..',
        '..OODDOO........OODDO.',
        '..OOOOO..........OOOOO',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................',
        '......................'
      ]
    }
  };

  // ==================== 妖魔小怪像素矩阵（增加兵器、铠甲与凶光细节） ====================
  const ENEMY_GRIDS = {
    wolf_scout: {
      palette: { O: '#120d16', G: '#6c757d', L: '#adb5bd', R: '#ff0a54', B: '#343a40', W: '#f8f9fa', M: '#e63946' },
      f0: [
        '..OO........OO....',
        '.OGGO......OGGO...',
        '.OGGLOooooOLGGO...',
        'OGGGLRGGGGLRGGO.WW',
        'OGGGGGGGGGGGGGOOWO',
        '.OOGGWWWWWWGGOOWO.',
        '..OBBMMMMMMBBOOO..',
        '.OBBGGGGGGGGBBO...',
        '.OBB..OOOO..BBO...',
        '.....OGG..GGO.....',
        '....OOGG..GGOO....',
        '....OOOO..OOOO....'
      ].map((r) => r.replace(/o/g, 'O')),
      f1: [
        '..OO........OO....',
        '.OGGO......OGGO...',
        '.OGGLOOOOOOLGGO...',
        'OGGGLRGGGGLRGGO.WW',
        'OGGGGGGGGGGGGGOOWO',
        '.OOGGWWWWWWGGOOWO.',
        '..OBBMMMMMMBBOOO..',
        '.OBBGGGGGGGGBBO...',
        '..OOO.OOOO.OOO....',
        '...OGG....GGO.....',
        '..OOOO....OOOO....',
        '..................'
      ]
    },
    goblin_archer: {
      palette: { O: '#120d16', H: '#e76f51', G: '#588157', E: '#ffbe0b', B: '#6f4518', R: '#d62828', Y: '#ffd166' },
      f0: [
        '....OOOOOO....OO..',
        '...ORRRRRRO..OYYO.',
        '..OGGGGGGGGO..OYO.',
        '..OGEOOGEOGO..OYO.',
        '...OGGGGGGO..OYYO.',
        '..OOBBBBBBOO..OO..',
        '.OOBBHHHBBBOO.....',
        '..OOBBBBBBOO......',
        '....OGG.GGO.......',
        '...OOGG.GGOO......',
        '...OOOO.OOOO......'
      ],
      f1: [
        '....OOOOOO....OO..',
        '...ORRRRRRO..OYYO.',
        '..OGGGGGGGGO..OYO.',
        '..OGEOOGEOGO..OYO.',
        '...OGGGGGGO..OYYO.',
        '..OOBBBBBBOO..OO..',
        '.OOBBHHHBBBOO.....',
        '...OBBBBBBO.......',
        '...OGG...GGO......',
        '..OOOO...OOOO.....',
        '..................'
      ]
    },
    shield_bear: {
      palette: { O: '#120d16', D: '#2b2d42', M: '#ced4da', S: '#4ea8de', R: '#ff0a54', G: '#ffd166' },
      f0: [
        '..OOO....OOO.....',
        '.ODDDO..ODDDO....',
        '.ODDDDDDDDDDOOOOO',
        'ODDDRDDDDRDDOMMMO',
        'ODDDDDDDDDDDOMSSO',
        '.ODDDDDDDDDDOMGGO',
        '.OODDDDDDDDOOMSSO',
        '..ODDDDDDDDOOMMMO',
        '..ODDD..DDDOOOOOO',
        '..ODDO..ODDO.....',
        '.OODDO..ODDOO....',
        '.OOOOO..OOOOO....'
      ],
      f1: [
        '..OOO....OOO.....',
        '.ODDDO..ODDDO....',
        '.ODDDDDDDDDDOOOOO',
        'ODDDRDDDDRDDOMMMO',
        'ODDDDDDDDDDDOMSSO',
        '.ODDDDDDDDDDOMGGO',
        '.OODDDDDDDDOOMSSO',
        '..ODDDDDDDDOOMMMO',
        '...ODD..DDO.OOOOO',
        '..OODDO.OODDO....',
        '..OOOOO.OOOOO....',
        '.................'
      ]
    },
    tiger_blade: {
      palette: { O: '#120d16', T: '#f4a261', W: '#ffffff', E: '#e63946', A: '#264653', S: '#e9c46a' },
      f0: [
        '..OO......OO....WW',
        '.OTTOOOOOOTTO..WWO',
        '.OTOTTTTTTOTO.WWO.',
        'OTTTETTTTETTTOWO..',
        'OTTTTWWWWTTTTOO...',
        '.OOAAAAAAAASOO....',
        '.OAATTTTTTAAO.....',
        '..OAAAAAAAAO......',
        '...OTT..TTO.......',
        '..OOTT..TTOO......',
        '..OOOO..OOOO......'
      ],
      f1: [
        '..OO......OO....WW',
        '.OTTOOOOOOTTO..WWO',
        '.OTOTTTTTTOTO.WWO.',
        'OTTTETTTTETTTOWO..',
        'OTTTTWWWWTTTTOO...',
        '.OOAAAAAAAASOO....',
        '.OAATTTTTTAAO.....',
        '..OAAAAAAAAO......',
        '..OTT....TTO......',
        '.OOOO....OOOO.....',
        '..................'
      ]
    },
    ghost_caster: {
      palette: { O: '#120d16', P: '#3c096c', C: '#80ffdb', W: '#e0fbfc', M: '#7209b7' },
      f0: [
        '....OOOOOO...CC.',
        '...OPPPPPPO.CWCO',
        '..OPPPPPPPPO.CC.',
        '..OPOCOOCOPO....',
        '..OPOOOOOOPO....',
        '.OOPMMMMMMMOO...',
        '.OPPMWWWWWMPPO..',
        '..OPMMMMMMMPO...',
        '...OPPMMMPPO....',
        '....OP..PO......',
        '...OC....CO.....'
      ],
      f1: [
        '....OOOOOO....CC',
        '...OPPPPPPO..CWC',
        '..OPPPPPPPPO..CC',
        '..OPOCOOCOPO....',
        '..OPOOOOOOPO....',
        '.OOPMMMMMMMOO...',
        '.OPPMWWWWWMPPO..',
        '..OPMMMMMMMPO...',
        '..OPPMMMMPPO....',
        '...OC....CO.....',
        '....C....C......'
      ]
    },
    bone_reaper: {
      palette: { O: '#120d16', W: '#f1faee', G: '#adb5bd', E: '#00f5d4', P: '#5e60ce' },
      f0: [
        '....OOOOOO..WWWW',
        '...OWWWWWWOOWGGO',
        '..OWWEOWEWWO..OO',
        '..OWWGGGGWWO..O.',
        '...OOWOWWOO...O.',
        '..OOPPPPPPOO..O.',
        '.OOPWWWWWWPOO.O.',
        '..OPPPPPPPPO..O.',
        '...OWW..WWO.....',
        '..OOWW..WWOO....',
        '..OOOO..OOOO....'
      ],
      f1: [
        '....OOOOOO..WWWW',
        '...OWWWWWWOOWGGO',
        '..OWWEOWEWWO..OO',
        '..OWWGGGGWWO..O.',
        '...OOWOWWOO...O.',
        '..OOPPPPPPOO..O.',
        '.OOPWWWWWWPOO.O.',
        '..OPPPPPPPPO..O.',
        '..OWW....WWO....',
        '.OOOO....OOOO...',
        '................'
      ]
    },
    bull_guard: {
      palette: { O: '#120d16', W: '#ffd166', R: '#9d0208', D: '#370617', M: '#ffba08', S: '#e85d04' },
      f0: [
        '.WO........OW...',
        'WWOO.OOOO.OOWW..',
        '.OORRRRRRRROO...',
        '..ORMWOOWMRO....',
        '..ORRRRRRRROOOOO',
        '.OODDDDDDDDOMMMO',
        '.ODDRRRRRRDOSSSO',
        '.ODDDDDDDDDOMMMO',
        '..ODDD..DDDOOOOO',
        '..ORRO..ORRO....',
        '.OORRO..ORROO...',
        '.OOOOO..OOOOO...'
      ],
      f1: [
        '.WO........OW...',
        'WWOO.OOOO.OOWW..',
        '.OORRRRRRRROO...',
        '..ORMWOOWMRO....',
        '..ORRRRRRRROOOOO',
        '.OODDDDDDDDOMMMO',
        '.ODDRRRRRRDOSSSO',
        '.ODDDDDDDDDOMMMO',
        '...ODD..DDO.OOOO',
        '..OORRO.OORRO...',
        '..OOOOO.OOOOO...',
        '................'
      ]
    },
    flame_imp: {
      palette: { O: '#120d16', Y: '#ffba08', F: '#f48c06', R: '#dc2f02', W: '#ffffff' },
      f0: [
        '....Y..Y......',
        '...YYFFYY.....',
        '..OORRRROO....',
        '.OORWFFWROO...',
        '.ORRRRRRRRO...',
        '..OORFFROO....',
        '...ORRRRO.....',
        '..ORF..FRO....',
        '..OO....OO....'
      ],
      f1: [
        '...Y....Y.....',
        '..YYFFFFYY....',
        '..OORRRROO....',
        '.OORWFFWROO...',
        '.ORRRRRRRRO...',
        '..OORFFROO....',
        '...ORRRRO.....',
        '...OF..FO.....',
        '..............'
      ]
    }
  };

  // ==================== 四大守关妖王 Boss 像素矩阵 ====================
  const BOSS_GRIDS = {
    black_bear_king: {
      palette: { O: '#0f0c14', D: '#22223b', B: '#343a40', R: '#ff4800', G: '#ffb703', M: '#adb5bd', W: '#ffffff' },
      f0: [
        '...OOO........OOO...RR',
        '..ODDDDOOOOOODDDDO.RWR',
        '..ODBBBBBBBBBBBBDO..OO',
        '.ODBBBRWBBBBBRWBBDO.O.',
        '.ODBBBBBBBBBBBBBBDO.O.',
        '.ODBBBBGGGGGGGGGBDO.O.',
        'OODGGGGGGGGGGGGGGDOOO.',
        'ODBBBBGGGGGGGGGBBBDO..',
        'ODBBBBBBBBBBBBBBBBDO..',
        '.OOGGGGGGGGGGGGGGOO...',
        '..ODBBBBBBBBBBBBDO....',
        '..ODBBB......BBBDO....',
        '..ODDDO......ODDDO....',
        '.OODDDO......ODDDOO...',
        '.OOOOOO......OOOOOO...'
      ]
    },
    yellow_wind_sage: {
      palette: { O: '#0f0c14', Y: '#e9c46a', G: '#f4a261', R: '#e76f51', W: '#fff3b0', D: '#582f0e' },
      f0: [
        '.....OOOOOOOOOO...WWW.',
        '...OOYYYYYYYYYYOO.OYO.',
        '..OYYGGGGGGGGGGYYOOYO.',
        '.OYYGGRWOGGORWGYYO.OO.',
        '.OYYYYGGGGGGGGYYYO.O..',
        '..OOYYYYWWWWYYYYOO.O..',
        '.OODDDDDYYYYDDDDDOOO..',
        'OODDYYYYYYYYYYYYDDOO..',
        'OODDYYYYGGGGYYYYDDOO..',
        '.OODDDDDDDDDDDDDDOO...',
        '..OOYYYY....YYYYOO....',
        '...ODDD......DDDO.....',
        '..OODDD......DDDOO....',
        '..OOOOO......OOOOO....'
      ]
    },
    white_bone_lady: {
      palette: { O: '#0f0c14', W: '#f8f9fa', C: '#80ffdb', P: '#7209b7', M: '#b5179e', H: '#240046' },
      f0: [
        '.....OCCOOOOCCO.....',
        '....OOHHHHHHHHOO....',
        '...OHHWWWWWWWWHO....',
        '...OHWWMOWWOMWHO....',
        '...OHWWWWWWWWWWO....',
        '..OOHHPPPPPPPPPHOO..',
        '.OOHPPPMMMMMMPPPPHO.',
        '.OHPPPMMWWWWMMMPPHO.',
        '..OOPPPMMMMMMPPPPOO.',
        '...OOPPPPPPPPPPPOO..',
        '....OPPP....PPPO....',
        '...OCC........CCO...',
        '....C..........C....'
      ]
    },
    bull_demon_king: {
      palette: { O: '#0f0c14', W: '#ffd166', R: '#9d0208', D: '#2b0909', G: '#ffba08', F: '#ff4800' },
      f0: [
        'WW................WW...',
        'WWWOO..........OOWWW...',
        '.OWWWOOOOOOOOOOWWWO.GGG',
        '..OODDDDDDDDDDDDOO..GFG',
        '..ODDDRRRRRRRRDDDO..GGG',
        '.ODDDRFWRDDDRFWRDDO..O.',
        '.ODDDRRRRRRRRRRRDDO..O.',
        'OODGGGGGGGGGGGGGGDOO.O.',
        'ODRGGGGGGGGGGGGGGRDOOO.',
        'ODRRRRGGGGGGGGRRRRDO...',
        'OODDDDDGGGGGGDDDDDOO...',
        '.OODDDDDDDDDDDDDDOO....',
        '..ODDDD......DDDDO.....',
        '..ORRRO......ORRRO.....',
        '.OORRRO......ORRROO....',
        '.OOOOOO......OOOOOO....'
      ]
    }
  };

  let _cache = null;

  // ==================== 16款西游披挂装备独立 16-Bit 像素素材矩阵 (14x14) ====================
  const EQUIP_GRIDS = {
    // 1. 神兵 (Weapons)
    wpn_sabre: {
      palette: { O: '#120d18', W: '#ffffff', S: '#ced4da', G: '#ffd60a', R: '#ef233c', B: '#6f4518' },
      grid: [
        '.........OOOO.',
        '........OGWWWO',
        '.......OGWSSWO',
        '......OGWSSOO.',
        '.....OGWSSOO..',
        '....OGWSSOO...',
        '...OOGSSOO....',
        '..OGGGGOO.....',
        '..OGRGO.......',
        '.OBBOOO.......',
        'OBBO..RO......',
        'OOO...RR......',
        '..............',
        '..............'
      ]
    },
    wpn_mace: {
      palette: { O: '#120d18', M: '#adb5bd', D: '#495057', G: '#ffd166', R: '#d62828' },
      grid: [
        '..........OOO.',
        '.........OMDMO',
        '........OMDMO.',
        '.......OMDMO..',
        '......OMDMO...',
        '.....OMDMO....',
        '....OGGGGO....',
        '...OOGGGOO....',
        '..ORROO.......',
        '.ORRO.........',
        'OGGO..........',
        'OOO...........',
        '..............',
        '..............'
      ]
    },
    wpn_ruyi: {
      palette: { O: '#120d18', C: '#80ffdb', T: '#06d6a0', W: '#ffffff', G: '#ffd166', P: '#c77dff' },
      grid: [
        '.......OOOOO..',
        '......OCWWWCO.',
        '.....OCWTTTWCO',
        '.....OCTPPPTCO',
        '......OCTTTOO.',
        '......OOGGOO..',
        '.....OOGGO....',
        '....OOGGO.....',
        '...OOGGO......',
        '..OOCCO.......',
        '.OCWCO........',
        '.OOOO.........',
        '..............',
        '..............'
      ]
    },
    wpn_sword: {
      palette: { O: '#120d18', W: '#ffffff', C: '#4cc9f0', P: '#c77dff', G: '#ffd60a' },
      grid: [
        '...........OOO',
        '..........OWCO',
        '.........OWPO.',
        '........OWCO..',
        '.......OWPO...',
        '......OWCO....',
        '.....OWPO.....',
        '..OOOGGOOO....',
        '..OGGGGGGO....',
        '...OOPPO......',
        '..OPPO........',
        '.OGGO.........',
        '.OOO..........',
        '..............'
      ]
    },

    // 2. 冠冕 (Helms)
    hlm_phoenix: {
      palette: { O: '#120d18', R: '#ef233c', G: '#ffd60a', A: '#e09f3e', W: '#ffffff', C: '#4cc9f0' },
      grid: [
        '.RO...OO...OR.',
        'ORGO.OGGO.OGRO',
        '.ORGOOGGOOGRO.',
        '..OAGGGGGGGAO.',
        '..OGGWRRWGGGO.',
        '.OOGGGGGGGGGOO',
        '.OAAACCCCCAAAO',
        '..OOOOOOOOOOO.',
        '..............',
        '..............',
        '..............',
        '..............',
        '..............',
        '..............'
      ]
    },
    hlm_iron: {
      palette: { O: '#120d18', W: '#f8f9fa', M: '#adb5bd', D: '#495057', G: '#ffd166', R: '#d62828' },
      grid: [
        '.....ORRO.....',
        '....OOOOOO....',
        '...OMWWWWMO...',
        '..OMMMMMMMMO..',
        '.OMDDDDDDDDMO.',
        '.OMDGGGGGGDMO.',
        '.OMDOOOOOODMO.',
        '.OMDMO..OMDMO.',
        '..OOO....OOO..',
        '..............',
        '..............',
        '..............',
        '..............',
        '..............'
      ]
    },
    hlm_dharma: {
      palette: { O: '#120d18', G: '#ffd166', W: '#fff3b0', R: '#e63946', C: '#06d6a0' },
      grid: [
        '.....OOOO.....',
        '...OOGWWGOO...',
        '..OGWGRRGWGO..',
        '.OGGGGGGGGGGO.',
        '.OGRGGCGGCRGO.',
        '.OGGGGGGGGGGO.',
        '..OOOOOOOOOO..',
        '..ORRO..ORRO..',
        '..ORO....ORO..',
        '..............',
        '..............',
        '..............',
        '..............',
        '..............'
      ]
    },
    hlm_mask: {
      palette: { O: '#120d18', R: '#d90429', D: '#6a040f', G: '#ffd60a', W: '#ffffff' },
      grid: [
        '..GO......OG..',
        '.OGOOooooOOGO.',
        '.ORRRRRRRRRRO.',
        'ORRDGWOOWGDRRO',
        'ORRRRRRRRRRRRO',
        '.ORDWGGGGWDRO.',
        '..OOWOOOOOWOO.',
        '...OOOOOOOO...',
        '..............',
        '..............',
        '..............',
        '..............',
        '..............',
        '..............'
      ].map((r) => r.replace(/o/g, 'O'))
    },

    // 3. 宝甲 (Armors)
    arm_gold: {
      palette: { O: '#120d18', G: '#ffd60a', A: '#e09f3e', R: '#d62828', W: '#fff3b0' },
      grid: [
        '.OOOO....OOOO.',
        'OGWWGOOOOGWWGO',
        'OGGGGGGGGGGGGO',
        '.OOAARRRRAOO..',
        '..OGGRWWRGGO..',
        '..OAAAAAAAOO..',
        '..OGGGGGGGGO..',
        '.OOGGAAAAGGOO.',
        '.OGGGOOOOGGGO.',
        '.OOOO....OOOO.',
        '..............',
        '..............',
        '..............',
        '..............'
      ]
    },
    arm_heavy: {
      palette: { O: '#120d18', M: '#ced4da', D: '#495057', B: '#2b2d42', C: '#4cc9f0' },
      grid: [
        '.OOOO....OOOO.',
        'OMMMOOOOOOMMMO',
        'ODDDDDDDDDDDDO',
        'ODBBCCCCCCBBDO',
        '.ODDDDDDDDDDO.',
        '..OBBMMMMBBO..',
        '..ODDDDDDDDO..',
        '.OODDBBBBDDOO.',
        '.ODDDO..ODDDO.',
        '.OOOO....OOOO.',
        '..............',
        '..............',
        '..............',
        '..............'
      ]
    },
    arm_robe: {
      palette: { O: '#120d18', R: '#d62828', G: '#ffd166', W: '#f8f9fa', J: '#06d6a0' },
      grid: [
        '..OOOO..OOOO..',
        '.OWWWO..OWWWO.',
        'OWWWJRRRRRWWWO',
        'OWWRGRGRGRGWWO',
        '.OORRRRRRRRRO.',
        '..ORGRGRGRGRO.',
        '..ORRRRRRRRRO.',
        '.OOGGGGGGGGGOO',
        '.OWWWWWWWWWWWO',
        '..OOOOOOOOOOO.',
        '..............',
        '..............',
        '..............',
        '..............'
      ]
    },
    arm_dragon: {
      palette: { O: '#120d18', W: '#ffffff', C: '#00f5d4', A: '#90e0ef', B: '#0077b6' },
      grid: [
        '.OOOO....OOOO.',
        'OCWWCOOOOCWWCO',
        'OAAAAAAAAAAAAO',
        '.OOBBCCCCBBOO.',
        '..OAAWWWWAAO..',
        '..OBBAAAABBO..',
        '..OAAAAAAAAO..',
        '.OOBBAAAABBOO.',
        '.OBBBO..OBBBO.',
        '.OOOO....OOOO.',
        '..............',
        '..............',
        '..............',
        '..............'
      ]
    },

    // 4. 灵饰 (Accessories)
    acc_pearl: {
      palette: { O: '#120d18', W: '#ffffff', C: '#00f5d4', T: '#48cae4', G: '#ffd166' },
      grid: [
        '....OOOOOO....',
        '..OOTCCCCCOO..',
        '.OTCWWWWWCTOO.',
        '.OTCWCCCWCTTO.',
        '.OOTCCCCCCTOO.',
        '..OOTTTTTTOO..',
        '...OGGGGGGO...',
        '..OOGGGGGGOO..',
        '..OOOOOOOOOO..',
        '..............',
        '..............',
        '..............',
        '..............',
        '..............'
      ]
    },
    acc_jade: {
      palette: { O: '#120d18', R: '#ef233c', G: '#ffd60a', J: '#69f0ae', W: '#ffffff' },
      grid: [
        '.....ORRO.....',
        '....OR..RO....',
        '....OOOOOO....',
        '..OOGGGGGGOO..',
        '.OGGJJWWJJGGO.',
        '.OGJWWWWWWJGO.',
        '.OGGJJJJJJGGO.',
        '..OOGGGGGGOO..',
        '....OOOOOO....',
        '.....ORRO.....',
        '..............',
        '..............',
        '..............',
        '..............'
      ]
    },
    acc_ring: {
      palette: { O: '#120d18', P: '#c77dff', W: '#ffffff', G: '#ffd60a', A: '#e09f3e' },
      grid: [
        '....OOOOOO....',
        '...OPWWWWPO...',
        '...OPPPPPPO...',
        '..OOGGGGGGOO..',
        '.OGGGOOOOGGGO.',
        '.OGGO....OGGO.',
        '.OAAO....OAAO.',
        '..OAAAAAAAOO..',
        '...OOOOOOOO...',
        '..............',
        '..............',
        '..............',
        '..............',
        '..............'
      ]
    },
    acc_talisman: {
      palette: { O: '#120d18', Y: '#ffd166', W: '#fff3b0', R: '#e63946', C: '#4cc9f0' },
      grid: [
        '...OOOOOOOO...',
        '..OYYYYYYYYO..',
        '..OYWWRRWWYO..',
        '..OYWRCCRWOY..',
        '..OYWWRRWWYO..',
        '..OYWRRRRWOY..',
        '..OYWWCCWWYO..',
        '..OYYYYYYYYO..',
        '...OOROOOROO..',
        '....OO..OO....',
        '..............',
        '..............',
        '..............',
        '..............'
      ]
    }
  };

  // ==================== 法宝虚影、神通投射物与战利品专属 16-Bit 像素贴图矩阵 ====================
  const VFX_GRIDS = {
    proj_qiankun: {
      palette: { O: '#120d18', G: '#ffd60a', A: '#ff9f1c', W: '#ffffff', R: '#ff3b30' },
      scale: 1.8,
      grid: [
        '....OOOO....',
        '..OOGWWGOO..',
        '.OGWARRAWGO.',
        '.OGAO..OAGO.',
        'OGWO....OWGO',
        'OGRO....ORGO',
        'OGRO....ORGO',
        'OGWO....OWGO',
        '.OGAO..OAGO.',
        '.OGWARRAWGO.',
        '..OOGWWGOO..',
        '....OOOO....'
      ]
    },
    proj_dharma: {
      palette: { O: '#120d18', G: '#ffd166', W: '#ffffff', R: '#ff5e57', Y: '#fff3b0' },
      scale: 1.8,
      grid: [
        '...OOOO...',
        '.OOGWWGOO.',
        '.OGYGGYGO.',
        'OGWGRRGWGO',
        'OGYGRWGYGO',
        'OGWGRRGWGO',
        '.OGYGGYGO.',
        '.OOGWWGOO.',
        '...OOOO...'
      ]
    },
    proj_lotus: {
      palette: { O: '#120d18', G: '#ffd166', W: '#ffffff', P: '#ff4d6d', R: '#d62828', Y: '#fff3b0' },
      scale: 1.9,
      grid: [
        '.....OOOO.....',
        '...OOPWWPOO...',
        '..OPPWYYWPPO..',
        '.OPPRWWWWPRPO.',
        'OPGGRWYYWRGGPO',
        'OGYYGGGGGGYYGO',
        '.OOGGGGGGGGOO.',
        '..OORGGGGROO..',
        '....OOOOOO....'
      ]
    },
    proj_samadhi: {
      palette: { O: '#120d18', W: '#ffffff', Y: '#ffd60a', F: '#ff6e40', R: '#d90429' },
      scale: 1.8,
      grid: [
        '....OOOOO...',
        '..OORFFFROO.',
        '.ORFYYYYYFRO',
        'ORRFYWWWYFRO',
        'R..RFYYYYFRO',
        '..OORFFFROO.',
        '....OOOOO...'
      ]
    },
    proj_dragon_bolt: {
      palette: { O: '#0b132b', W: '#ffffff', C: '#00f5d4', B: '#00bbf9', L: '#caf0f8' },
      scale: 1.75,
      grid: [
        '........OOOO....',
        '....OOOOBCCCO...',
        '.OOOBBBCCWWWCO..',
        'OBCCCWWWWWWWWCO.',
        'OBCCCWWWWWWWWCOO',
        '.OOOBBBCCWWWCO..',
        '....OOOOBCCCO...',
        '........OOOO....'
      ]
    },
    proj_fire_arrow: {
      palette: { O: '#120d18', W: '#ffffff', Y: '#ffd166', F: '#ff5400', B: '#6f4518', R: '#ef233c' },
      scale: 1.7,
      grid: [
        '.OO.....OOO...',
        'ORRO...OFYYO..',
        '.OBBBBBFWWYFO.',
        'ORRO...OFYYO..',
        '.OO.....OOO...'
      ]
    },
    proj_wisp: {
      palette: { O: '#10002b', C: '#80ffdb', T: '#00f5d4', P: '#7209b7', W: '#ffffff' },
      scale: 1.8,
      grid: [
        '...OOOO...',
        '..OTTTTO..',
        '.OTCCCCCTO',
        'OTCWPTPWCO',
        'OTCCCCCCCO',
        '.OTPWWPTO.',
        '..OT..TO..',
        '...C..C...'
      ]
    },
    proj_web: {
      palette: { O: '#120d18', W: '#f8f9fa', L: '#ced4da', P: '#f72585', V: '#b5179e' },
      scale: 1.75,
      grid: [
        '..OO..OO..',
        '.OWLOOLWO.',
        'OWLPPPPWLO',
        '.OLPVVPLO.',
        'OWLPVVPWLO',
        '.OLPPPPLO.',
        'OWLO..OLWO',
        '..OO..OO..'
      ]
    },
    proj_venom: {
      palette: { O: '#081c15', G: '#80ed99', T: '#38b000', R: '#ff0a54', W: '#ffffff' },
      scale: 1.7,
      grid: [
        '..OO....OOO.',
        'ORRTTTTGWWGO',
        '..OO....OOO.'
      ]
    },
    proj_meteor: {
      palette: { O: '#120d18', D: '#370617', R: '#dc2f02', F: '#ff6e40', Y: '#ffd60a', W: '#ffffff' },
      scale: 1.9,
      grid: [
        '...OOOOOO...',
        '..ODDRFFDO..',
        '.ODRFYYFFDO.',
        'ODDFYWWYFDDO',
        'ODRFFYYFFRDO',
        '.ODDRFFRDDO.',
        '..OODDDDOO..',
        '....OOOO....'
      ]
    },
    proj_ground_wave: {
      palette: { O: '#120d18', F: '#ff5400', Y: '#ffba08', W: '#ffffff' },
      scale: 1.8,
      grid: [
        '.....OOOO...',
        '...OOFYYFO..',
        '..OFYWWWYFO.',
        '.OFYWWFFYFO.',
        '.OFYWFOOYFO.',
        'OOFYFO..OFO.',
        'OOOOO...OOO.'
      ]
    },
    relic_gourd: {
      palette: { O: '#120d18', G: '#ffd60a', R: '#d90429', P: '#9d0208', W: '#ffffff', C: '#ff9f1c' },
      scale: 2.0,
      grid: [
        '....OOOO....',
        '...OGWWGO...',
        '....OOOO....',
        '..OORRRRRO..',
        '.ORRWCCRPRO.',
        '..OORRRRRO..',
        '...OGGGGGO..',
        '.OORRRRRRRO.',
        'ORRWCCCCRPRO',
        'ORRRRRRPPPRO',
        '.OORRRRRROO.',
        '...OOOOOO...'
      ]
    },
    relic_fan: {
      palette: { O: '#120d18', G: '#69f0ae', T: '#06d6a0', D: '#1b4332', Y: '#ffd166', W: '#ffffff' },
      scale: 2.0,
      grid: [
        '....OOOOOO..',
        '..OOGGGGGGO.',
        '.OGGWTGGTGGO',
        'OGGTGGGGTGGO',
        'OGGGGGTDTGGO',
        '.OGGTDGGDGO.',
        '..OODGGGDO..',
        '...OOYYOO...',
        '..OYYOO.....',
        '.OYOO.......'
      ]
    },
    relic_mirror: {
      palette: { O: '#120d18', G: '#ffd60a', P: '#ea80fc', V: '#9d4edd', W: '#ffffff' },
      scale: 2.0,
      grid: [
        '...OOOOOO...',
        '.OOGGGGGGOO.',
        'OGGPPWWPPGGO',
        'OGPWWWWWWPGO',
        'OGPWVVVVWPGO',
        'OGGPPVVPPGGO',
        '.OOGGGGGGOO.',
        '...OOGGOO...',
        '....OGGO....',
        '....OOOO....'
      ]
    },
    relic_snare: {
      palette: { O: '#120d18', C: '#b2ebf2', W: '#ffffff', T: '#48cae4', G: '#ffd60a' },
      scale: 2.0,
      grid: [
        '...OOOOOO...',
        '.OOGCWWCGOO.',
        'OGCWTTTTWCGO',
        'OCWTOOootWCO',
        'OWTO....OTWO',
        'OWTO....OTWO',
        'OCWTooooTWCO',
        'OGCWTTTTWCGO',
        '.OOGCWWCGOO.',
        '...OOOOOO...'
      ].map((r) => r.replace(/o/g, 'O'))
    },
    drop_coin: {
      palette: { O: '#120d18', G: '#ffd60a', A: '#e09f3e', W: '#ffffff' },
      scale: 1.6,
      grid: [
        '..OOOO..',
        '.OGWWGO.',
        'OGGOOGGO',
        'OGO..OGO',
        'OGGOOGGO',
        '.OGAAGO.',
        '..OOOO..'
      ]
    },
    drop_soul: {
      palette: { O: '#0b132b', C: '#72efdd', T: '#00bbf9', W: '#ffffff' },
      scale: 1.6,
      grid: [
        '...OO...',
        '..OCCO..',
        '.OCWWCO.',
        'OCTWWWTO',
        'OCTWWCTO',
        '.OTTTTO.',
        '..OOOO..'
      ]
    },
    drop_mp: {
      palette: { O: '#0b132b', B: '#00bbf9', L: '#90e0ef', W: '#ffffff' },
      scale: 1.6,
      grid: [
        '...OO...',
        '..OLWO..',
        '.OLWWBO.',
        'OBLWWBBO',
        '.OBBBBO.',
        '..OOOO..'
      ]
    }
  };

  function buildAllSprites() {
    if (_cache) return _cache;
    _cache = {
      heroes: {},
      heroesHiRes: {}, // 选人界面高倍清晰展示用
      enemies: {},
      bosses: {},
      props: {},
      equips: {},
      equipsHiRes: {},
      materials: {},
      materialsHiRes: {},
      vfx: {}
    };

    Object.keys(VFX_GRIDS).forEach((key) => {
      const def = VFX_GRIDS[key];
      _cache.vfx[key] = bakeGrid(def.grid, def.palette, def.scale || 1.8, false);
    });

    if (EquipAndMatSprites && EquipAndMatSprites.EQUIP_SPRITE_DEFS) {
      Object.keys(EquipAndMatSprites.EQUIP_SPRITE_DEFS).forEach((key) => {
        const def = EquipAndMatSprites.EQUIP_SPRITE_DEFS[key];
        _cache.equips[key] = EquipAndMatSprites.bakeEnhancedIcon(Env.createOffscreenCanvas, def, 1.35);
        _cache.equipsHiRes[key] = EquipAndMatSprites.bakeEnhancedIcon(Env.createOffscreenCanvas, def, 2.35);
      });
      Object.keys(EquipAndMatSprites.MATERIAL_SPRITE_DEFS || {}).forEach((key) => {
        const def = EquipAndMatSprites.MATERIAL_SPRITE_DEFS[key];
        _cache.materials[key] = EquipAndMatSprites.bakeEnhancedIcon(Env.createOffscreenCanvas, def, 1.15);
        _cache.materialsHiRes[key] = EquipAndMatSprites.bakeEnhancedIcon(Env.createOffscreenCanvas, def, 2.25);
      });
    } else {
      Object.keys(EQUIP_GRIDS).forEach((key) => {
        const def = EQUIP_GRIDS[key];
        _cache.equips[key] = bakeGrid(def.grid, def.palette, 1.5, false);
        _cache.equipsHiRes[key] = bakeGrid(def.grid, def.palette, 3, false);
      });
    }

    // 烘焙五大主角帧（升级为 76x88 微像素 32-Bit 纸娃娃高精模型引擎！）
    Object.keys(HERO_GRIDS).forEach((id) => {
      if (HeroModelEngine && HeroModelEngine.getCompositeHeroSet) {
        _cache.heroes[id] = HeroModelEngine.getCompositeHeroSet(id, null, false);
        _cache.heroesHiRes[id] = HeroModelEngine.getCompositeHeroSet(id, null, true);
        return;
      }
      const def = HERO_GRIDS[id];
      const idle0Rows = alignGroundRows(def.idle0, 0);
      const idle1Rows = makeHeroIdleBreath(def.idle0);
      const run0Rows = alignGroundRows(def.run0, 1);
      const run1Rows = alignGroundRows(def.run1, 0);
      const atkRows = alignGroundRows(def.attack || def.run0, 0);

      _cache.heroes[id] = {
        idle: bakeGrid(idle0Rows, def.palette, 1.75, false),
        idle1: bakeGrid(idle1Rows, def.palette, 1.75, false),
        run0: bakeGrid(run0Rows, def.palette, 1.75, false),
        run1: bakeGrid(run1Rows, def.palette, 1.75, false),
        attack: bakeGrid(atkRows, def.palette, 1.75, false),
        flash: bakeGrid(idle0Rows, def.palette, 1.75, true)
      };
      _cache.heroesHiRes[id] = {
        idle: bakeGrid(idle0Rows, def.palette, 3, false),
        idle1: bakeGrid(idle1Rows, def.palette, 3, false),
        run0: bakeGrid(run0Rows, def.palette, 3, false)
      };
    });

    Object.keys(ENEMY_GRIDS).forEach((id) => {
      const def = ENEMY_GRIDS[id];
      _cache.enemies[id] = {
        f0: bakeGrid(def.f0, def.palette, 2, false),
        f1: bakeGrid(def.f1, def.palette, 2, false),
        flash: bakeGrid(def.f0, def.palette, 2, true)
      };
    });

    Object.keys(BOSS_GRIDS).forEach((id) => {
      const def = BOSS_GRIDS[id];
      const arch = Monsters81Sprites && Monsters81Sprites.BOSS_ARCHETYPES && Monsters81Sprites.BOSS_ARCHETYPES[id];
      const f1Grid = (arch && arch.f1) || def.f1 || def.f0;
      _cache.bosses[id] = {
        f0: bakeGrid(def.f0, def.palette, 3, false),
        f1: bakeGrid(f1Grid, def.palette, 3, false),
        flash: bakeGrid(def.f0, def.palette, 3, true)
      };
    });

    // 烘焙九九八十一难全部 55 套妖魔母版与 81 难专属配色精灵（小妖 + 劫难头目 + 守关妖王 + 高清图鉴帧）
    _cache.monstersHiRes = {};
    if (Monsters81Sprites) {
      Object.keys(Monsters81Sprites.MOB_ARCHETYPES).forEach((archId) => {
        if (!_cache.enemies[archId]) {
          const baked = Monsters81Sprites.bakeArchetypeEntry(bakeGrid, archId, null, 2.0);
          _cache.enemies[archId] = baked;
        }
      });
      Object.keys(Monsters81Sprites.BOSS_ARCHETYPES).forEach((archId) => {
        const baked = Monsters81Sprites.bakeArchetypeEntry(bakeGrid, archId, null, 2.8);
        if (!_cache.bosses[archId]) {
          _cache.bosses[archId] = baked;
        }
        if (!_cache.enemies[archId]) {
          _cache.enemies[archId] = Monsters81Sprites.bakeArchetypeEntry(bakeGrid, archId, null, 2.2);
        }
      });
      if (Tribulations81 && Array.isArray(Tribulations81.TRIBULATIONS_81)) {
        Tribulations81.TRIBULATIONS_81.forEach((trib) => {
          const worldScale = trib.rank === 'boss' ? 2.85 : trib.rank === 'elite' ? 2.25 : 2.0;
          const bakedWorld = Monsters81Sprites.bakeArchetypeEntry(bakeGrid, trib.archetype, trib.palette, worldScale);
          _cache.enemies[trib.id] = bakedWorld;
          _cache.bosses[trib.id] =
            trib.rank === 'boss'
              ? bakedWorld
              : Monsters81Sprites.bakeArchetypeEntry(bakeGrid, trib.archetype, trib.palette, 2.75);
          _cache.monstersHiRes[trib.id] = {
            f0: bakedWorld.hiRes,
            f1: bakeGrid(
              Monsters81Sprites.getArchetype(trib.archetype).f1 || Monsters81Sprites.getArchetype(trib.archetype).f0,
              Object.assign({}, Monsters81Sprites.getArchetype(trib.archetype).palette, trib.palette || {}),
              3.0,
              false
            )
          };
        });
      }
    }

    _cache.props.chestClosed = bakeGrid(
      [
        '.OOOOOOOOOO.',
        'OGGGGGGGGGGO',
        'OYYYYYYYYYYO',
        'OOOOOOOOOOOO',
        'OBBBBGGGBBBO',
        'OBBBBGGGBBBO',
        'OBBBBBBBBBBO',
        'OOOOOOOOOOOO'
      ],
      { O: '#141019', G: '#ffd166', Y: '#99582a', B: '#6f4518' },
      2,
      false
    );

    _cache.props.chestOpen = bakeGrid(
      [
        'OOOOOOOOOOOO',
        'OYYYYYYYYYYO',
        'OOOOOOOOOOOO',
        '..CCCCCCCC..',
        'OBBBBBBBBBBO',
        'OBBBBGGGBBBO',
        'OBBBBBBBBBBO',
        'OOOOOOOOOOOO'
      ],
      { O: '#141019', G: '#ffd166', Y: '#99582a', B: '#6f4518', C: '#80ffdb' },
      2,
      false
    );

    _cache.props.scroll = bakeGrid(
      [
        '..OOOOOOOO..',
        '.OGGGGGGGGO.',
        '.OWWRPGGWWO.',
        '.OWWRPGGWWO.',
        '.OWWRPGGWWO.',
        '.OGGGGGGGGO.',
        '..OOOOOOOO..'
      ],
      { O: '#141019', G: '#ffd166', W: '#fff3b0', R: '#ff5252', P: '#b388ff' },
      2,
      false
    );

    _cache.props.bun = bakeGrid(
      [
        '...OOOOOO...',
        '..OWWWWWWO..',
        '.OWWGGGGWWO.',
        '.OWWWWWWWWO.',
        '.OOOOOOOOOO.'
      ],
      { O: '#141019', W: '#fff8e7', G: '#e9c46a' },
      2,
      false
    );

    _cache.props.gourd = bakeGrid(
      [
        '....OOOO....',
        '...OGGGGO...',
        '....OOOO....',
        '..OOCCCCOO..',
        '.OCCCCCCCCO.',
        '.OCCCCCCCCO.',
        '..OOOOOOOO..'
      ],
      { O: '#141019', G: '#ffd166', C: '#69f0ae' },
      2,
      false
    );

    return _cache;
  }

  return {
    bakeGrid,
    bakeTintedSprite,
    buildAllSprites
  };
});
