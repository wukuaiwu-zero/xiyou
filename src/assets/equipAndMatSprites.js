/**
 * 《西游破劫录》64款披挂神兵 + 16种妖魔素材 高密度 18×18 16-Bit 像素贴图库与光影烘焙器
 * (src/assets/equipAndMatSprites.js)
 *
 * 贴图优化特性：
 * 1. 分辨率全面升级：由原版半空 14×14 矩阵升级为满画幅 18×18 高密度手绘像素矩阵（有效像素提升约 2.8 倍）。
 * 2. 多色阶材质球：每件装备/素材配备 6~9 色阶调色板（墨黑外轮廓、金属/宝玉三阶明暗过渡、高光刃口、缨络宝石点缀）。
 * 3. 16-Bit 立体微斜角光影烘焙（Auto Bevel & Rim Shading）：烘焙时自动计算左上受光边缘增亮与右下背光内阴影，赋予像素浓郁金属与玉石质感。
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
})('equipAndMatSprites', function () {
  // ==================== 通用高质感色盘预设 ====================
  const PAL = {
    goldBlade: { O: '#100b16', W: '#ffffff', S: '#e9ecef', M: '#adb5bd', D: '#495057', G: '#ffd60a', A: '#e09f3e', R: '#ef233c', B: '#6f4518' },
    darkIron:  { O: '#100b16', W: '#f8f9fa', S: '#ced4da', M: '#6c757d', D: '#2b2d42', G: '#ffb703', A: '#bc6c25', R: '#d62828', C: '#4cc9f0' },
    jadeDharma:{ O: '#100b16', W: '#ffffff', C: '#80ffdb', T: '#06d6a0', J: '#0096c7', G: '#ffd166', A: '#e09f3e', P: '#c77dff', B: '#7f4f24' },
    violetElec:{ O: '#100b16', W: '#ffffff', C: '#4cc9f0', P: '#c77dff', V: '#7209b7', D: '#3c096c', G: '#ffd60a', A: '#e09f3e', R: '#ff0a54' },
    greatSage: { O: '#100b16', W: '#fff8e7', G: '#ffd60a', Y: '#ffb703', A: '#ca6702', R: '#ef233c', D: '#9b2226', C: '#00f5d4', B: '#22223b' },
    seaDragon: { O: '#100b16', W: '#ffffff', C: '#00f5d4', T: '#48cae4', B: '#0077b6', D: '#03045e', S: '#caf0f8', G: '#ffd166', A: '#e09f3e' },
    quicksand: { O: '#100b16', W: '#f8f9fa', P: '#9d4edd', V: '#5a189a', C: '#00b4d8', T: '#90e0ef', G: '#ffd166', R: '#e63946', S: '#adb5bd' },
    tianpeng:  { O: '#100b16', W: '#ffffff', G: '#ffd166', A: '#dda15e', M: '#6c757d', D: '#22223b', R: '#ef233c', C: '#4ea8de', P: '#ffb3c1' },
    buddha:    { O: '#100b16', W: '#fff8e7', G: '#ffd60a', A: '#e09f3e', R: '#d62828', D: '#9d0208', J: '#06d6a0', C: '#80ffdb', B: '#6f4518' },
    bullFlame: { O: '#100b16', W: '#fff3b0', Y: '#ffba08', F: '#ff5400', R: '#d00000', D: '#370617', M: '#6c757d', S: '#ced4da', G: '#ffd166' },
    sandEarth: { O: '#100b16', W: '#fff8e7', Y: '#e9c46a', A: '#d4a373', B: '#99582a', D: '#582f0e', C: '#48cae4', R: '#e76f51', G: '#ffd166' },
    cryptBone: { O: '#100b16', W: '#ffffff', S: '#e9ecef', M: '#adb5bd', D: '#495057', C: '#80ffdb', P: '#9d4edd', V: '#3c096c', R: '#ff0a54' }
  };

  // ==================== 一、64款西游披挂 18×18 高清像素矩阵 ====================
  const EQUIP_SPRITE_DEFS = {
    // -------------------- 1. 神兵 (Weapons: 13款) --------------------
    wpn_sabre: {
      palette: PAL.goldBlade,
      grid: [
        '...........OOOOOO.',
        '..........OGWWWWWO',
        '.........OGWWSSSWO',
        '........OGWWSSSMMO',
        '.......OGWWSSSMOO.',
        '......OGWWSSSMOO..',
        '.....OGWWSSSMOO...',
        '....OGGWSSSMOO....',
        '...OOGGGSSMOO.....',
        '..OGGGGGGMOO......',
        '..OGARRRGAO.......',
        '..OOGGGGGOO.......',
        '..OBBBOOOO........',
        '.OBBAO..ORO.......',
        'OBBAO...ORRO......',
        'OGGO.....RRO......',
        'OOO.......OO......',
        '..................'
      ]
    },
    wpn_mace: {
      palette: PAL.darkIron,
      grid: [
        '............OOOO..',
        '...........OSWWWO.',
        '..........OSWSMMO.',
        '.........OSWSMMDO.',
        '........OSWSMMDO..',
        '.......OSWSMMDO...',
        '......OSWSMMDO....',
        '.....OSWSMMDO.....',
        '....OGGGMMDO......',
        '...OGAAAGGOO......',
        '..OOGGGGOOO.......',
        '..ORRBBO..........',
        '.ORRBO............',
        'OGGBO.............',
        'OGAAO.............',
        '.OOO..............',
        '..................',
        '..................'
      ]
    },
    wpn_pine_staff: {
      palette: PAL.jadeDharma,
      grid: [
        '..........OOOOOO..',
        '.........OCWWWWWCO',
        '........OCWTTTTWCO',
        '........OCTJJJJTCO',
        '........OCWTTTTWCO',
        '.........OOCGGCOO.',
        '.........OOGGGGO..',
        '........OOBBBBO...',
        '.......OOBABBO....',
        '......OOBBBBO.....',
        '.....OOBABBO......',
        '....OOBBBBO.......',
        '...OOGGGGO........',
        '..OOBBBBO.........',
        '.OOBABBO..........',
        'OOGGGGO...........',
        'OOOOOO............',
        '..................'
      ]
    },
    wpn_ruyi: {
      palette: PAL.jadeDharma,
      grid: [
        '.........OOOOOOO..',
        '........OCWWWWWCO.',
        '.......OCWTTTTTWCO',
        '......OCWTGPPGTWCO',
        '......OCTTPWWPTTCO',
        '.......OCTTTTTTCO.',
        '........OOCGGCOO..',
        '.......OOGGAAGOO..',
        '......OOGGGGOO....',
        '.....OOTTTTOO.....',
        '....OOTJJTOO......',
        '...OOGGGGOO.......',
        '..OOCCCCOO........',
        '.OCWWWWCO.........',
        '.OCTTTTCO.........',
        '..OOOOOO..........',
        '..................',
        '..................'
      ]
    },
    wpn_sword: {
      palette: PAL.violetElec,
      grid: [
        '.............OOOOO',
        '............OWWWCO',
        '...........OWWCCPO',
        '..........OWWCPVO.',
        '.........OWWCCPO..',
        '........OWWCPVO...',
        '.......OWWCCPO....',
        '......OWWCPVO.....',
        '.....OWWCCPO......',
        '..OOOGGGCPVOOO....',
        '.OGGGGGGGGGGGO....',
        '..OOAARRRRAAOO....',
        '...OOOPPVOO.......',
        '..OOPPVOO.........',
        '.OGGGVO...........',
        'OGWGGO............',
        'OOOOO.............',
        '..................'
      ]
    },
    wpn_wolf_club: {
      palette: PAL.bullFlame,
      grid: [
        '..........OO..OOO.',
        '.........OWWOOMSWO',
        '........OOMMMMSMMO',
        '......OOOMSMMMSDMO',
        '.....OWWOMFFMMSOO.',
        '......OOMMYYMMMWWO',
        '.....OWOMSMMMSOOMO',
        '.....OOMSMMMDOOO..',
        '....OOMMMMDDO.....',
        '...OOGGGGGGO......',
        '...OGRRRRRGO......',
        '..OODDDDDDO.......',
        '.OODDDOOO.........',
        'OODDDO............',
        'OGGGO.............',
        'OOOO..............',
        '..................',
        '..................'
      ]
    },
    wpn_trident_spear: {
      palette: PAL.greatSage,
      grid: [
        '...........OO..OOO',
        '..........OWWOOWGO',
        '.........OWYYOWWGO',
        '........OWYAOOWYGO',
        '........OOYGGGGYOO',
        '.......OOGGWWWWGGO',
        '.......OGYYGGGGYYO',
        '.......OOOAARRAOOO',
        '......OORRROORRO..',
        '.....OOBBBO..OO...',
        '....OOBGBO........',
        '...OOBBBO.........',
        '..OOBGBO..........',
        '.OOBBBO...........',
        'OOGGGO............',
        'OGYGO.............',
        'OOOO..............',
        '..................'
      ]
    },
    wpn_crescent_spade: {
      palette: PAL.quicksand,
      grid: [
        '.........OOO..OOOO',
        '........OWCCOOCWWO',
        '.......OWCTTOOCTWO',
        '.......OCTOOOOCTOO',
        '.......OCCTTTTCCOO',
        '........OCCCCCCOO.',
        '.......OOGGGGGGO..',
        '......OOVVVPPVO...',
        '.....OOVVPPOOO....',
        '....OOVVVOO.......',
        '...OOGGGO.........',
        '..OOVVVO..........',
        '.OOTCCOO..........',
        'OOCWWCTOO.........',
        'OCTTTTTCO.........',
        '.OOOOOOO..........',
        '..................',
        '..................'
      ]
    },
    wpn_dragon_lance: {
      palette: PAL.seaDragon,
      grid: [
        '............OOOOOO',
        '...........OCWWWWO',
        '..........OCWWSSCO',
        '.........OCWWSSTBO',
        '........OCWWSSTBO.',
        '.......OOCWSSTBOO.',
        '.....OOGGCCTTBGOO.',
        '....OGWWGGGGGGWGO.',
        '.....OOGGCCCCGGO..',
        '.....OOBBTTTBOO...',
        '....OOBBBOOOO.....',
        '...OOBDBBO........',
        '..OOBBBO..........',
        '.OOGGGO...........',
        'OOCWWCO...........',
        'OCTTTCO...........',
        '.OOOOO............',
        '..................'
      ]
    },
    wpn_seven_sword: {
      palette: PAL.violetElec,
      grid: [
        '.............OOOOO',
        '............OWWWGO',
        '...........OWWGCCO',
        '..........OWWCCPO.',
        '.........OWWGCCO..',
        '........OWWCCPO...',
        '.......OWWGCCO....',
        '......OWWCCPO.....',
        '...OOOGGGCCPOOO...',
        '..OGWWGGGGGGWWGO..',
        '...OOGGRRRRGGOO...',
        '....OOOPPPVOO.....',
        '...OOPPVVOO.......',
        '..OOPPVOO.........',
        '.OGGGGO...........',
        'OGWWGO............',
        'OOOOO.............',
        '..................'
      ]
    },
    wpn_jingu_staff: {
      palette: PAL.greatSage,
      grid: [
        '.............OOOO.',
        '............OGWWGO',
        '...........OGWYYGO',
        '..........OOGYYGOO',
        '..........ORRYAOO.',
        '.........ORRDRO...',
        '........ORRYRO....',
        '.......ORRGWRO....',
        '......ORRYRRO.....',
        '.....ORRDRO.......',
        '....OOGYYRO.......',
        '...OGWWYYOO.......',
        '..OGWYYAAO........',
        '.OGWYYAOO.........',
        '.OGYAOO...........',
        '..OOO.............',
        '..................',
        '..................'
      ]
    },
    wpn_nine_rake: {
      palette: PAL.tianpeng,
      grid: [
        '........OO.OO.OO..',
        '.......OWWOWWOWWOO',
        '......OOGGGGGGGGWO',
        '......OGWWGGGGWWGO',
        '.......OOGAAAAGGOO',
        '........OORRRROOO.',
        '.......OOMMMMMO...',
        '......OOMWMMDO....',
        '.....OOMMMMDO.....',
        '....OOGGGGGO......',
        '...OOMMMMDO.......',
        '..OOMWMMDO........',
        '.OOMMMMDO.........',
        'OOGGGGGO..........',
        'OGWWAAO...........',
        'OOOOOO............',
        '..................',
        '..................'
      ]
    },
    wpn_tin_staff: {
      palette: PAL.buddha,
      grid: [
        '........OOOOOOOO..',
        '.......OGWWWWWWGO.',
        '......OGWGOOOOGWGO',
        '.....OGWGOJWWJOGWO',
        '.....OGWGORRRROGWO',
        '......OGWGGGGGGWO.',
        '......OOAAAGAAAOO.',
        '.......OOOGGGOO...',
        '......OORRRRRRO...',
        '.....OOGGGGGGGO...',
        '....OOBBBOO.......',
        '...OOBGBO.........',
        '..OOBBBO..........',
        '.OOGGGGO..........',
        'OOGWWWWGO.........',
        'OGGGGGAAO.........',
        '.OOOOOOO..........',
        '..................'
      ]
    },

    // -------------------- 2. 冠冕 (Helms: 13款) --------------------
    hlm_bronze_band: {
      palette: PAL.sandEarth,
      grid: [
        '..................',
        '......OOOOOO......',
        '....OOGWWWWGOO....',
        '...OGYYYYYYYYGO...',
        '..OGYYAAAAAYYYGO..',
        '.OOGYAAOOOOAAYGOO.',
        '.OGYYAOOOOOOAAYGO.',
        '.OGGGGGGGGGGGGGGO.',
        '.OAAYYYYGGYYYYAAO.',
        '..OOOOOOOOOOOOOO..',
        '...ORRO....ORRO...',
        '..ORRO......ORRO..',
        '..OOO........OOO..',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    hlm_bamboo_hat: {
      palette: PAL.sandEarth,
      grid: [
        '..................',
        '.......OOOO.......',
        '......OGWWGO......',
        '.....OYYYYYYO.....',
        '...OOYYAAAAYYOO...',
        '..OYYAAAAAAAABYO..',
        '.OYYAABBBBBAAABYO.',
        'OYYYYYYYYYYYYYYYYO',
        'OAAAAAAAAAAAAAAAABO',
        '.OOOOOOOOOOOOOOOO.',
        '....OCCO..OCCO....',
        '.....OO....OO.....',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    hlm_bone_helm: {
      palette: PAL.cryptBone,
      grid: [
        '..OO..........OO..',
        '.OWWO..OOOO..OWWO.',
        '.OWSSOOSSSSOOSSWO.',
        '..OSSSSSSSSSSSSO..',
        '..OSSWWWWWWWWSSO..',
        '.OOSSMMMMMMMMSSOO.',
        '.OSSMOCCOOCCOMSSO.',
        '.OSSMOOOOOOOOSSSO.',
        '..OSSMWOMMOMWSSO..',
        '..OOSSSMMMMSSSOO..',
        '...OOOOOOOOOOOO...',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    hlm_iron: {
      palette: PAL.darkIron,
      grid: [
        '......OORROO......',
        '.....ORRRRRRO.....',
        '......OOOOOO......',
        '....OOSWWWWSSO....',
        '...OSSMMMMMMSSO...',
        '..OSMMMMMMMMMMSO..',
        '.OOMDDDDDDDDDDMOO.',
        '.OMDGGGGGGGGGGDMO.',
        '.OMDGOOOOOOOOGDMO.',
        '.OMDDMOOOOOOMDDMO.',
        '.OMDDMO....OMDDMO.',
        '..OOOO......OOOO..',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    hlm_mask: {
      palette: PAL.bullFlame,
      grid: [
        '..OO..........OO..',
        '.OGGOO......OOGGO.',
        '.OGYYOOOOOOOOYYGO.',
        '..ORRRRRRRRRRRRO..',
        '.ORRRFFFFFFFRRRRO.',
        'ORRFDYWOOOOYWDFFRO',
        'ORRRRRRRRRRRRRRRRO',
        '.ORRDDGGGGGGDDRRO.',
        '.OORWWOOOOOOWWROO.',
        '..OORDDDDDDDDROO..',
        '....OOOOOOOOOO....',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    hlm_sand_hood: {
      palette: PAL.sandEarth,
      grid: [
        '..................',
        '.....OOOOOOOO.....',
        '...OOYYYYYYYYOO...',
        '..OYYWWWWAAAAYYO..',
        '.OYYAAAAAAAAABBYO.',
        '.OYAABOOOOOOAABYO.',
        '.OYAABOCCOCCAABYO.',
        '.OYYAABBBBBBBAAYO.',
        '.OOYYAAAAAAAABYOO.',
        '..OBBRRRRRRRRBBBO.',
        '..OBBBOOOOOOBBBBO.',
        '...OOO......OOOO..',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    hlm_hero_band: {
      palette: PAL.quicksand,
      grid: [
        '.......OOOO.......',
        '......OCWWCO......',
        '.....OCTTTTCO.....',
        '...OORRRRRRRROO...',
        '..ORRGGGGGGGGRRO..',
        '.OORRGGWWWWGGRROO.',
        '.ORRRGGGGGGGGRRRO.',
        '.OVVVPPPPPPPPVVO..',
        '..OOOOOOOOOOOOOO..',
        '..ORRO......ORRO..',
        '.ORRO........ORRO.',
        '.OOO..........OOO.',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    hlm_dragon_crown: {
      palette: PAL.seaDragon,
      grid: [
        '.OO............OO.',
        'OCCO...OOOO...OCCO',
        '.OCCO.OGWWGO.OCCO.',
        '..OTTOGWWWWGOTTO..',
        '..OOTTTTCCCTTTOO..',
        '.OOBBSSSSSSSSBBOO.',
        '.OBBSSTTTTTTSSBBO.',
        '.OOGGGGGGGGGGGGOO.',
        '..OAAACCCCCCAAAO..',
        '...OOOOOOOOOOOO...',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    hlm_lotus_cap: {
      palette: PAL.violetElec,
      grid: [
        '.......OOOO.......',
        '......OGWWGO......',
        '.....OGWCCWGO.....',
        '....OOGGGGGGOO....',
        '...OPPPPPPPPPPO...',
        '..OPPWWWWWWWWPPO..',
        '..OPPVVVCCVVVPPO..',
        '.OOPGGGGGGGGGGPOO.',
        '.OPVVVVVVVVVVVVPO.',
        '..OOOOOOOOOOOOOO..',
        '....OPPO..OPPO....',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    hlm_bull_helm: {
      palette: PAL.bullFlame,
      grid: [
        'OOO............OOO',
        'OWWO..........OWWO',
        'OWYYO..OOOO..OYYWO',
        '.OYYYODDDDDDOYYYO.',
        '..OOODRRRRRRDOOO..',
        '..ODDRRFFFFRRDDO..',
        '.ODDRFYYOOYYFRDDO.',
        '.ODDDDDGGGGDDDDDO.',
        '.ODDDMOOOOOOMDDDO.',
        '..ODDM......MDDO..',
        '...OOO......OOO...',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    hlm_phoenix: {
      palette: PAL.greatSage,
      grid: [
        'RO.....OOOO.....OR',
        'RGO...OGWWGO...OGR',
        'ORGO.OGYYYYGO.OGRO',
        '.ORGOOGYRRYYGOOGRO',
        '..OAAAGGGGGGGAAO..',
        '..OGWWGGGGGGWWGO..',
        '.OOGGYYRRRRYYGGOO.',
        '.OGGGGGGGGGGGGGGO.',
        '.OAAACCCCCCCCAAAO.',
        '..OOOOOOOOOOOOOO..',
        '...ORRO....ORRO...',
        '..ORRO......ORRO..',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    hlm_tianpeng_hat: {
      palette: PAL.tianpeng,
      grid: [
        '.......ORRO.......',
        '......ORRRRO......',
        '.....OOOGGOOO.....',
        '...OODDDDDDDDOO...',
        '..ODDDMMMMMMDDDO..',
        '.OODDGGGGGGGGDDOO.',
        '.ODDGGWWCCWWGGDDO.',
        '.ODDDDDDDDDDDDDDO.',
        '.OMMGGGGGGGGGGMMO.',
        '..OOOOOOOOOOOOOO..',
        '...ODDO....ODDO...',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    hlm_dharma: {
      palette: PAL.buddha,
      grid: [
        '......OOOOOO......',
        '....OOGWWWWGOO....',
        '...OGWGRRRRGWGO...',
        '..OGWWGRWWWRWWGO..',
        '.OOGGGGGGGGGGGGOO.',
        '.OGRGGJJGGJJGGRGO.',
        '.OGGGGGGGGGGGGGGO.',
        '.OAAAGGGGGGGGAAAO.',
        '..OOOOOOOOOOOOOO..',
        '...ORRO....ORRO...',
        '...ORDO....ODRO...',
        '....OO......OO....',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },

    // -------------------- 3. 宝甲 (Armors: 13款) --------------------
    arm_tiger_kilt: {
      palette: PAL.sandEarth,
      grid: [
        '..................',
        '..OOOO......OOOO..',
        '.OYYYYOOOOOOYYYYO.',
        '.OYYDDBBBBBBDDYYO.',
        '..OOBBGGGGGGGBOO..',
        '..OYYYYYYYYYYYYO..',
        '.OOYYDDYYYYDDYYOO.',
        '.OYYYYDDYYDDYYYYO.',
        '.OYYDDYYYYYYDDYYO.',
        '.OYYYYDDDDDDYYYYO.',
        '..OOYYYY..YYYYOO..',
        '...OOOO....OOOO...',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    arm_monk_robe: {
      palette: PAL.darkIron,
      grid: [
        '..OOOOO....OOOOO..',
        '.OSSSSSO..OSSSSSO.',
        'OSSMMMMOOOOOMMMSSO',
        'OSMMMSRRRRRSMMMMSO',
        '.OOOMMMRRRRMMMOOO.',
        '...OMMMMMMMMDO....',
        '...OMMMGGGGMDO....',
        '..OOMMMMMMMMDOO...',
        '..OMMMDDDDDDMMO...',
        '..OMMMM....MMMO...',
        '...OOOO....OOOO...',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    arm_bear_plate: {
      palette: PAL.darkIron,
      grid: [
        '.OOOOO......OOOOO.',
        'OMSSMMOOOOOOMMSSMO',
        'OMDDDDDDDDDDDDDDMO',
        'OMDDMMGGGGGGMMDDMO',
        '.OODDGGWWWWGGDDOO.',
        '..ODDGGGGGGGGDDO..',
        '..ODDDDMMMMDDDDO..',
        '..OODDDDDDDDDDOO..',
        '.OODDDMMMMMMDDDOO.',
        '.ODDDDO....ODDDDO.',
        '..OOOO......OOOO..',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    arm_heavy: {
      palette: PAL.darkIron,
      grid: [
        '.OOOOOO....OOOOOO.',
        'OSWWWSSOOOOSSWWWSO',
        'OMMMMMMMMMMMMMMMMO',
        'OMDDCCCCCCCCCCDDMO',
        '.OMDDDDDDDDDDDDMO.',
        '..OODDSSSSSSDDOO..',
        '..OMMMMMMMMMMMMO..',
        '..OMDDDDDDDDDDMO..',
        '.OOMMDDGGGGDDMMOO.',
        '.OMMDDO....ODDMMO.',
        '.OOOOO......OOOOO.',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    arm_spider_vest: {
      palette: PAL.violetElec,
      grid: [
        '..OOOOO....OOOOO..',
        '.OPWWWPO..OPWWWPO.',
        'OPPVVVVOOOOOVVVVPO',
        'OPVVCCWWWWWWCCVVPO',
        '.OOVVVWWWWWWVVVOO.',
        '..OPVVVRRRRVVVPO..',
        '..OPPVVVVVVVVPPO..',
        '..OOPPGGGGGGPPOO..',
        '.OOPVVVVVVVVVVPPO.',
        '.OPPVVO....OVVPPO.',
        '..OOOO......OOOO..',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    arm_flame_robe: {
      palette: PAL.bullFlame,
      grid: [
        '..OOOOO....OOOOO..',
        '.OFFYYFO..OFYYFFO.',
        'OFFRRRRROOORRRRRFO',
        'OFRRFFYYYYYYFFRRFO',
        '.OORRRYYWWYYRRROO.',
        '..ORRRRRRRRRRRRO..',
        '..OODDGGGGGGDDOO..',
        '..ORRRRRFFRRRRRO..',
        '.OORRFFYYYYFFRROO.',
        '.ORRROO....OORRRO.',
        '..OOOO......OOOO..',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    arm_quicksand: {
      palette: PAL.quicksand,
      grid: [
        '.OOOOOO....OOOOOO.',
        'OCTTTTCOOOOCTTTTCO',
        'OVVVVVVVVVVVVVVVVO',
        'OVPPCCCCCCCCCCPPVO',
        '.OOVVVGGGGGGVVVOO.',
        '..OVVVGGWWGGVVVO..',
        '..OCCCCCCCCCCCCO..',
        '..OVVVPPPPPPVVVO..',
        '.OOVVPPGGGGPPVVO..',
        '.OVVVOO....OOVVVO.',
        '..OOOO......OOOO..',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    arm_dragon: {
      palette: PAL.seaDragon,
      grid: [
        '.OOOOOO....OOOOOO.',
        'OCWWWWCOOOOCWWWWCO',
        'OSSSSSSTTTTSSSSSSO',
        'OBBTTTTCCCCCTTTTBO',
        '.OOBBTTWWWWTTBBOO.',
        '..OSSTTTTTTTTSSO..',
        '..OOGGGGGGGGGGOO..',
        '..OBBTTTTTTTTBBO..',
        '.OOBBDDTTTTDDBBOO.',
        '.OBBBOO....OOBBBO.',
        '..OOOO......OOOO..',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    arm_bagua_robe: {
      palette: PAL.violetElec,
      grid: [
        '..OOOOO....OOOOO..',
        '.OGWWWGO..OGWWWGO.',
        'OGGPPPPPOOOPPPPGG0'.replace('0', 'O'),
        'OPPVVVGGGGGGVVVPPO',
        '.OOPPVGWWWWGVPPPO.',
        '..OPPVGWOOOGVPPO..',
        '..OPPVGGGGGGVPPO..',
        '..OOGGGGGGGGGGOO..',
        '.OOPPVVVCCVVVVPPO.',
        '.OPPPVO....OVPPPO.',
        '..OOOO......OOOO..',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    arm_bull_plate: {
      palette: PAL.bullFlame,
      grid: [
        'OO.OOOO....OOOO.OO',
        'OWYFFFOOOOOOFFFYWO',
        'ODDDRRRRRRRRRRDDDO',
        'ODDRRYYYYYYYYRRDDO',
        '.OODRRYFFFFYRRDOO.',
        '..ODDDDDDDDDDDDO..',
        '..OOGGGGGGGGGGOO..',
        '..ODDRRRRRRRRDDO..',
        '.OODDDDYYYYDDDDOO.',
        '.ODDDDO....ODDDDO.',
        '..OOOO......OOOO..',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    arm_gold: {
      palette: PAL.greatSage,
      grid: [
        '.OOOOOO....OOOOOO.',
        'OGWWWWGOOOOGWWWWGO',
        'OGGGYYYYYYYYYYGGGO',
        'OGYYAAARRRRAAAYYGO',
        '.OOGGGRWWWWRGGGOO.',
        '..OYYYYRRRRYYYYO..',
        '..OOAAAAAAAAAOO...',
        '..OGGGGYYYYGGGGO..',
        '.OOGGYYAAAAYYGGOO.',
        '.OGGGYO....OYGGGO.',
        '..OOOO......OOOO..',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    arm_tianpeng: {
      palette: PAL.tianpeng,
      grid: [
        '.OOOOOO....OOOOOO.',
        'OGWWWWGOOOOGWWWWGO',
        'ODDDMMMMMMMMMMDDDO',
        'ODMMGGGGGGGGGGMMDO',
        '.OODDGGCCCCGGDDOO.',
        '..OMMDDCCCCDDMMO..',
        '..OOCCCCCCCCCCOO..',
        '..ODDDGGGGGGDDDO..',
        '.OODDMMAAGGAAMDDO.',
        '.ODDDMO....OMDDDO.',
        '..OOOO......OOOO..',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    arm_robe: {
      palette: PAL.buddha,
      grid: [
        '..OOOOO....OOOOO..',
        '.OWWWWWO..OWWWWWO.',
        'OWWWJJRRRRRRDDWWWO',
        'OWWRGRGRGRGRGDRWWO',
        '.OORRRRRRRRRRDRRO.',
        '..ORGRGRGRGRGDRRO.',
        '..ORRRRRRRRRRDRRO.',
        '.OOGGGGGGGGGGGGGOO',
        '.OWWWWWWWWWWWWWWWO',
        '.OWWWOO....OOWWWO.',
        '..OOOO......OOOO..',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },

    // -------------------- 4. 步履 (Boots: 12款) --------------------
    bts_straw: {
      palette: PAL.sandEarth,
      grid: [
        '..................',
        '..................',
        '....OOOOOO........',
        '...OYYYYYYO.......',
        '...OYAAAAYO.......',
        '...OYYRRYYO.......',
        '...OYAAAAYOOOO....',
        '..OOYYYYYYYYYYOO..',
        '.OYYAAAAAAAAAYYYO.',
        '.OBBBBBBBBBBBBBBO.',
        '..OOOOOOOOOOOOOO..',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    bts_wolf: {
      palette: PAL.darkIron,
      grid: [
        '..................',
        '....OOOOOOO.......',
        '...OSSSSSSSO......',
        '...OMMMMMMMO......',
        '...OMDDDDDMO......',
        '...OMMGGGMMO......',
        '...OMDDDDDMOOOO...',
        '..OOMDDDDDDDDMMOO.',
        '.OMDDDDDDDDDDSSSMO',
        '.ODDDDDDDDDDDDDDDO',
        '..OOOOOOOOOOOOOOO.',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    bts_iron: {
      palette: PAL.darkIron,
      grid: [
        '..................',
        '....OOOOOOO.......',
        '...OSWWWWWSO......',
        '...OMMMMMMMO......',
        '...OMDGGGDMO......',
        '...OMMMMMMMO......',
        '...OMDDDDDMOOOO...',
        '..OOMMMMMMMSSWWOO.',
        '.OMDDDDDDDDMMMMMMO',
        '.OGGGGGGGGGGGGGGGO',
        '..OOOOOOOOOOOOOOO.',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    bts_sand: {
      palette: PAL.sandEarth,
      grid: [
        '..................',
        '...OOOOOOOO.......',
        '..OYYYYYYYYO......',
        '..OYAACCCAYO......',
        '..OYAAAAAABO......',
        '..OYYGGGGYYO......',
        '..OYAAAAABBOOOO...',
        '.OOYYYYYYYYYYYYOO.',
        '.OYAAABBBBBBBAAYO.',
        '.ODDDDDDDDDDDDDDO.',
        '..OOOOOOOOOOOOOOO.',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    bts_shadow: {
      palette: PAL.cryptBone,
      grid: [
        '..................',
        '...OOOOOOOO.......',
        '..OVPPPPPPVO......',
        '..OVPCCCCPVO......',
        '..OVVVVVVVVO......',
        '..OVPPSSPPVO......',
        '..OVVVVVVVVOOOO...',
        '.OOVPPPPPPPPPCCOO.',
        '.OVVVVVVVVVPPPPPVO',
        '.OCCCCCCCCCCCCCCCO',
        '..OOOOOOOOOOOOOOO.',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    bts_frost: {
      palette: PAL.seaDragon,
      grid: [
        '..................',
        '...OOOOOOOO.......',
        '..OCWWWWWWCO......',
        '..OCTTSSSTCO......',
        '..OBBTTTTBBO......',
        '..OBGGGGGBBO......',
        '..OBBTTTTBBOOOO...',
        '.OOCWWTTTTTTTWWOO.',
        '.OBBTTTTTTTTTTTBBO',
        '.OCCCCCCCCCCCCCCCO',
        '..OOOOOOOOOOOOOOO.',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    bts_quicksand: {
      palette: PAL.quicksand,
      grid: [
        '..................',
        '..OOOOOOOOO.......',
        '.OCTTTTTTTCO......',
        '.OVPPPPPPPVO......',
        '.OVPGGGGPPVO......',
        '.OVVVVVVVVVO......',
        '.OVPPCCCPPVOOOO...',
        '.OOVVVVVVVVTTTTOO.',
        'OVVVCCCCCCCCCCCVVO',
        'OGGGGGGGGGGGGGGGGO',
        '.OOOOOOOOOOOOOOOO.',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    bts_dragon: {
      palette: PAL.seaDragon,
      grid: [
        '..OO..............',
        '.OCCOOOOOOO.......',
        '.OCWWWWWWWCO......',
        '..OSSTTTTSSO......',
        '..OBBTTTTBBO......',
        '..OOGGGGGGOO......',
        '..OBBTTTTBBOOOO...',
        '.OOSSSSSTTTTTWWOO.',
        'OBBTTTTCCCCCCCTTBO',
        'ODDDDDDDDDDDDDDDDO',
        '.OOOOOOOOOOOOOOOO.',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    bts_wind_fire: {
      palette: PAL.bullFlame,
      grid: [
        '.YY...............',
        'YFFOOOOOOOO.......',
        '.OFRRRRRRRFO......',
        '..ODDRRRRDDO......',
        '..ODDYYYYDDO......',
        '..ODDRRRRDDO......',
        '..ODDRRRRDDOOOO...',
        '.OORRFFFFRRRRYYOO.',
        'ODDRRYYYYYYYYRRDDO',
        'OGGGGGGGGGGGGGGGGO',
        '.OOOOOOOOOOOOOOOO.',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    bts_cloud_silk: {
      palette: PAL.greatSage,
      grid: [
        '..OO..............',
        '.OCCOOOOOOO.......',
        '.OCWWGGGGWGO......',
        '..OOBBBBBBOO......',
        '..OBBGGGGGBO......',
        '..OBBRRRRBOO......',
        '..OBBBBBBBBOOOO...',
        '.OOBBCCCCBBBBWWOO.',
        'OBBCCCCWWCCCCCCBBO',
        'OGGGGGGGGGGGGGGGGO',
        '.OOOOOOOOOOOOOOOO.',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    bts_tianpeng: {
      palette: PAL.tianpeng,
      grid: [
        '..................',
        '..OOOOOOOOO.......',
        '.OGWWWWWWWGO......',
        '.ODMMMMMMMDO......',
        '.ODMGGGGGMDO......',
        '.ODDDDDDDDDO......',
        '.ODMCCCCCMDOOOO...',
        '.OODDDDDDDDGGWWOO.',
        'ODDDMMMMMMMMGGGDDO',
        'OGGGGGGGGGGGGGGGGO',
        '.OOOOOOOOOOOOOOOO.',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    bts_lotus: {
      palette: PAL.buddha,
      grid: [
        '..................',
        '...OOOOOOOO.......',
        '..OWWWWWWWWO......',
        '..ORRRRRRRRO......',
        '..ORGGGGGGRO......',
        '..ORRRRRRRRO......',
        '..ORRJJJJRROOOO...',
        '.OORRRRRRRRGGGGGO.',
        'OGGWWGGGGGGGGWWGGO',
        'OAAAGGGGGGGGGGAAAO',
        '.OOOOOOOOOOOOOOOO.',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },

    // -------------------- 5. 灵饰 (Accessories: 13款) --------------------
    acc_wood_beads: {
      palette: PAL.buddha,
      grid: [
        '......OOOOOO......',
        '....OOBBGGBBOO....',
        '...OBBOO..OOBBO...',
        '..OBBO......OBBO..',
        '..OGGO......OGGO..',
        '..OBBO......OBBO..',
        '..OBBO......OBBO..',
        '...OBBO....OBBO...',
        '....OOBBJJBBOO....',
        '......OOJJOO......',
        '.......ORRO.......',
        '.......ORRO.......',
        '........OO........',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    acc_wolf_fang: {
      palette: PAL.cryptBone,
      grid: [
        '.......ORRO.......',
        '......OR..RO......',
        '......OOOOOO......',
        '.....OMGGGGMO.....',
        '....OWWWWWWWWO....',
        '....OWSSSSSSWO....',
        '.....OWSSSSWO.....',
        '.....OSSSSSSO.....',
        '......OSSMMO......',
        '.......OSSMO......',
        '........OSMO......',
        '.........OO.......',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    acc_copper_bell: {
      palette: PAL.sandEarth,
      grid: [
        '.......ORRO.......',
        '......OOOOOO......',
        '.....OGWWWWGO.....',
        '....OGYYYYYYGO....',
        '....OGYCCCCYGO....',
        '...OOGYYYYYYGOO...',
        '...OGAAAAAAAAGO...',
        '..OOGGGGGGGGGGOO..',
        '..OGAAOOOOOOAAGO..',
        '...OOOOOGGOOOOO...',
        '.......OOOO.......',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    acc_pearl: {
      palette: PAL.seaDragon,
      grid: [
        '.....OOOOOOOO.....',
        '...OOTCCCCCCCOO...',
        '..OTCWWWWWWWWCTO..',
        '.OTCWWCCCCCCWWCTO.',
        '.OTCWCCCCCCCCWCTO.',
        '.OOTCCCCCCCCCTTOO.',
        '..OOTTTTTTTTTTOO..',
        '...OOBBBBBBBBOO...',
        '...OOGGGGGGGGOO...',
        '..OGGAAAAAAAAGGO..',
        '..OOOOOOOOOOOOOO..',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    acc_jade: {
      palette: PAL.jadeDharma,
      grid: [
        '.......OOOO.......',
        '......OG..GO......',
        '......OOOOOO......',
        '....OOGGGGGGOO....',
        '..OOGGTTTTTTGGOO..',
        '.OGGTCCCCCCCCCTG0.'.replace('0', 'O'),
        '.OGTCWWOOOOOWCTGO.',
        '.OGTCWOOOOOOWCTGO.',
        '.OGGTCCCCCCCCCTGO.',
        '..OOGGTTTTTTGGOO..',
        '....OOGGGGGGOO....',
        '......OOOOOO......',
        '.......OPPo.......'.replace('o', 'O'),
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    acc_talisman: {
      palette: PAL.greatSage,
      grid: [
        '....OOOOOOOOOO....',
        '...OGGGGGGGGGGO...',
        '...OGWWWWWWWWGO...',
        '...OGWWRRRRWWGO...',
        '...OGWRCCCCRWGO...',
        '...OGWWRRRRWWGO...',
        '...OGWRRRRRRWGO...',
        '...OGWWCCCCWWGO...',
        '...OGYYYYYYYYGO...',
        '...OGGGGGGGGGGO...',
        '....OOOROOOROOO...',
        '.....ORO..ORO.....',
        '......O....O......',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    acc_skull_beads: {
      palette: PAL.quicksand,
      grid: [
        '.....OOOOOOOO.....',
        '...OOWWSSSSWWOO...',
        '..OWWOO....OOWWO..',
        '.OSSO........OSSO.',
        '.OWWO........OWWO.',
        '.OSSO........OSSO.',
        '..OWWO......OWWO..',
        '...OOCCCCCCCCOO...',
        '....OCTWWWWWCTO...',
        '.....OCCCCCCCO....',
        '......ORRRRRO.....',
        '.......OOOOO......',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    acc_ocean_pearl: {
      palette: PAL.seaDragon,
      grid: [
        '......OOOOOO......',
        '....OOCCCCCCOO....',
        '...OCWWWWWWWWCO...',
        '..OCWWSSSSSSWWCO..',
        '..OCWSSTTTTSSWCO..',
        '..OCWSTWWWWTSWCO..',
        '..OCWSSTTTTSSWCO..',
        '...OCCTTTTTTCCO...',
        '....OOGGGGGGOO....',
        '...OGGWWGGWWGGO...',
        '....OOOOOOOOOO....',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    acc_jingang_ring: {
      palette: PAL.violetElec,
      grid: [
        '.....OOOOOOOO.....',
        '...OOGWWWWWWGOO...',
        '..OGWWGGGGGGWWGO..',
        '.OGWGOOOOOOOOGWGO.',
        '.OGGO........OGGO.',
        '.OGGO........OGGO.',
        '.OGAPO......OPAGO.',
        '..OGAPOOOOOOPAGO..',
        '...OOGGGGGGGGOO...',
        '.....OOOOOOOO.....',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    acc_fan_pendant: {
      palette: PAL.jadeDharma,
      grid: [
        '........OOOOOO....',
        '......OOTTTTTTOO..',
        '....OOTTCCCCCCCTOO',
        '...OTTCCWWWWCCCTTO',
        '..OTTCCTTJJTTCCCTO',
        '..OTTCTTJJJJTTCTOO',
        '...OTTTTJJJJTTTOO.',
        '....OOGGGGGGOOO...',
        '....OGGGOOO.......',
        '...OGGO...........',
        '..OPPo............'.replace('o', 'O'),
        '..OOO.............',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    acc_golden_fillet: {
      palette: PAL.greatSage,
      grid: [
        '......OO..OO......',
        '.....OGGOOGGO.....',
        '....OGWWGGWWGO....',
        '..OOGGYYYYYYGGOO..',
        '.OGGYOOOOOOOOYGGO.',
        '.OGYO........OYGO.',
        '.OGYO........OYGO.',
        '.OAAOOOOOOOOOOAAO.',
        '..OAAYYYYYYYYAAO..',
        '...OOOOOOOOOOOO...',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    acc_jade_gourd: {
      palette: PAL.tianpeng,
      grid: [
        '.......OOOO.......',
        '......OGWWGO......',
        '.......OOOO.......',
        '.....OOWWWWOO.....',
        '....OWWCCCCWWO....',
        '....OWCCCCCCWO....',
        '.....OORRRROO.....',
        '...OOWWCCCCWWOO...',
        '..OWWCCCCCCCCWWO..',
        '..OWCCWWWWWWCCWO..',
        '...OWCCCCCCCCWO...',
        '....OOOOOOOOOO....',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    acc_ring: {
      palette: PAL.buddha,
      grid: [
        '.....OOOOOOOO.....',
        '....ORWWWWWWRO....',
        '...ORWRRRRRRWRO...',
        '....OOGGGGGGOO....',
        '..OOGGYYYYYYGGOO..',
        '.OGGYOOOOOOOOYGGO.',
        '.OGGO........OGGO.',
        '.OAAO........OAAO.',
        '.OAAOOOOOOOOOOAAO.',
        '..OOAAAAAAAAAAOO..',
        '....OOOOOOOOOO....',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    }
  };

  // ==================== 二、16种西游怪物掉落素材 18×18 高清像素矩阵 ====================
  const MATERIAL_SPRITE_DEFS = {
    // Tier 1: 凡材
    mat_bone: {
      palette: PAL.cryptBone,
      grid: [
        '...........OOOO...',
        '..........OWWWWO..',
        '.........OWSSSSWO.',
        '.........OOWSSWOO.',
        '........OOWSSOO...',
        '.......OOWSSOO....',
        '......OOWSSOO.....',
        '.....OOWSSOO......',
        '...OOOWSSOO.......',
        '..OWWWSSOO........',
        '.OWSSSSMMO........',
        '.OOWWSSMOO........',
        '...OOOOO..........',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    mat_pelt: {
      palette: PAL.sandEarth,
      grid: [
        '...OOO......OOO...',
        '..OYYYO....OYYYO..',
        '..OYYYYOOOOYYYYO..',
        '.OOYYDDYYYYDDYYOO.',
        '.OYYYYDDYYDDYYYYO.',
        '.OYYAAYYYYYYAAYYO.',
        '..OOYYDDDDDDYYOO..',
        '..OYYYYYYYYYYYYO..',
        '.OOYYDDYYYYDDYYOO.',
        '.OYYAAYYYYYYAAYYO.',
        '..OOYYOO..OOYYOO..',
        '...OOO......OOO...',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    mat_scale: {
      palette: PAL.seaDragon,
      grid: [
        '.......OOOO.......',
        '.....OOCWWCOO.....',
        '....OCWWTTTTCO....',
        '...OCWTTTTTTTCO...',
        '..OCTTTSSSSSTTCO..',
        '..OCTTSBBBBSTTCO..',
        '..OCTTBBBBBBTTCO..',
        '...OCTBBBBBBTCO...',
        '....OOBBBBBBOO....',
        '.....OODDDDOO.....',
        '.......OOOO.......',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    mat_iron: {
      palette: PAL.darkIron,
      grid: [
        '........OOOOO.....',
        '......OOSWWWSO....',
        '.....OSWWMMMMSO...',
        '....OSWMMMMDDMO...',
        '...OSWMMMDDDDMO...',
        '..OSWMMCCDDDDMO...',
        '..OMMMMDDDDDDOO...',
        '...OOMDDDDDOO.....',
        '....OODDDDO.......',
        '.....OOOOO........',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },

    // Tier 2: 灵材
    mat_fire_core: {
      palette: PAL.bullFlame,
      grid: [
        '........OO........',
        '.......OYYO.......',
        '......OYFFYO..OO..',
        '.....OYFFFFYOOFFO.',
        '....OOFFWWFFFRFFO.',
        '...OFFFWWWWFFFFRO.',
        '...OFRWWYYYYWFRRO.',
        '...OFRRYYYYYYRRRO.',
        '....OFRRRRRRRRRO..',
        '.....OODDDDDDOO...',
        '.......OOOOOO.....',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    mat_wind_sand: {
      palette: PAL.sandEarth,
      grid: [
        '....OOOOOOOOOO....',
        '...OGWWWWWWWWGO...',
        '....OYYYYYYYYO....',
        '.....OYCCCCYO.....',
        '......OYAAYO......',
        '.......OYYO.......',
        '......OOCYOO......',
        '.....OYCWYYYO.....',
        '....OYYYYYYAAO....',
        '...OGGGGGGGGGGO...',
        '....OOOOOOOOOO....',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    mat_ghost_orb: {
      palette: PAL.cryptBone,
      grid: [
        '.......OOOO.......',
        '.....OOCCCCOO.....',
        '...OOCWWWWWWCOO...',
        '..OCWWCCCCCCWWCO..',
        '..OCWCCPPPPCCWCO..',
        '..OCWCPVVVVPCWCO..',
        '..OCWCCPPPPCCWCO..',
        '...OCCPPPPPPCCO...',
        '....OOVVVVVVOO....',
        '......OOOOOO......',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    mat_silk: {
      palette: PAL.violetElec,
      grid: [
        '....OOOOOOOOOO....',
        '...OGWWWWWWWWGO...',
        '....OOGGGGGGOO....',
        '....OCWWWWWWCO....',
        '.....OCPPPPCO.....',
        '.....OCWCCWCO.....',
        '.....OCPPPPCO.....',
        '....OCWWWWWWCO....',
        '....OOGGGGGGOO....',
        '...OGGGGGGGGGGO...',
        '....OOOOOOOOOO....',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    mat_tendon: {
      palette: PAL.seaDragon,
      grid: [
        '..........OOOOO...',
        '........OOCWWWCO..',
        '.......OCWWTTTCO..',
        '......OCWTTBBOO...',
        '.....OCWTBBOO.....',
        '....OCWTBBOO......',
        '...OCWTBBOO.......',
        '..OCWTTBOO........',
        '.OCWWTTTCO........',
        '.OCTTTTTCO........',
        '..OOOOOOO.........',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },

    // Tier 3: 仙材
    mat_thunder_jade: {
      palette: PAL.violetElec,
      grid: [
        '.......OOOO.......',
        '......OCWWCO......',
        '.....OCWCCWCO.....',
        '....OCWCPPCWCO....',
        '...OCWCPWWPCWCO...',
        '...OCPWWGGWWPCO...',
        '...OCPVVPPVVPC0...'.replace('0', 'O'),
        '....OCPPPPPPCO....',
        '.....OCVVVVCO.....',
        '......OCVVCO......',
        '.......OOOO.......',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    mat_lotus: {
      palette: PAL.buddha,
      grid: [
        '.......OOOO.......',
        '......OGWWGO......',
        '...OOOGWRRWGOOO...',
        '..OGWWGRRRRGWWGO..',
        '.OGWRRRRRRRRRRWGO.',
        '.OGGRRGGGGGGGRGGO.',
        '..OOGGGGGGGGGGOO..',
        '...OOJJJJJJJJOO...',
        '....OJJWWWWJJO....',
        '.....OOOOOOOO.....',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    mat_horn: {
      palette: PAL.bullFlame,
      grid: [
        '...........OOOO...',
        '..........OWWWWO..',
        '.........OWYYYYWO.',
        '........OWYYFFYYO.',
        '.......OYYFFFFYYO.',
        '......OYYFFRRFFO..',
        '....OOYFFRRRRDO...',
        '..OOGGGGGDDDDO....',
        '.OGWWGGGGDDOO.....',
        '.OGGGGGGOOO.......',
        '..OOOOOO..........',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    mat_gold_ingot: {
      palette: PAL.greatSage,
      grid: [
        '..................',
        '......OOOOOO......',
        '....OOGWWWWGOO....',
        '..OOOOGYYYYGOOOO..',
        '.OGWWWGGGGGGWWWGO.',
        '.OGYYYYYYYYYYYYGO.',
        '..OGYYAAAAAAYYGO..',
        '..OOGGAAAAAAGGOO..',
        '...OOAAAAAAAOO....',
        '.....OOOOOOOO.....',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },

    // Tier 4: 神材
    mat_demon_core: {
      palette: PAL.greatSage,
      grid: [
        '......OOOOOO......',
        '....OOGWWWWGOO....',
        '...OGWWYYYYWWGO...',
        '..OGWYYRRRRYYWGO..',
        '..OGYRRWWWWRRYGO..',
        '..OGYRWWCCWWRYGO..',
        '..OGYRRWWWWRRYGO..',
        '..OGWYYRRRRYYWGO..',
        '...OGYYYYYYYYGO...',
        '....OOAAAAAOO.....',
        '......OOOOOO......',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    mat_samadhi_flame: {
      palette: PAL.bullFlame,
      grid: [
        '........OO........',
        '.......OWWO.......',
        '......OWYYWO..OO..',
        '....OOWYFFYWOOWWO.',
        '...OYYFFFFFFYYFFO.',
        '..OYFFWWWWWWFFRRO.',
        '..OFRWWYYYYWWFRRO.',
        '..OFRRYYYYYYRRRRO.',
        '...OFRRRRRRRRRDO..',
        '....OOGGGGGGGGO...',
        '......OOOOOOOO....',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    },
    mat_chaos_stone: {
      palette: {
        O: '#100b16',
        W: '#ffffff',
        C: '#00f5d4',
        P: '#c77dff',
        R: '#ff2a54',
        G: '#ffd60a',
        B: '#4cc9f0',
        V: '#5a189a'
      },
      grid: [
        '......OOOOOO......',
        '....OOCWWWWPOO....',
        '...OCWWCCCCWWPO...',
        '..OCWCCGGGGCCWPO..',
        '..OCBGGRRRRGGPVO..',
        '..OCBGRWWWWRGPVO..',
        '..OCBGGRRRRGGPVO..',
        '...OBBBPPPPRRVO...',
        '....OOBBPPVVO.....',
        '......OOOOOO......',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................',
        '..................'
      ]
    }
  };

  // ==================== 三、16-Bit 自动居中与立体微斜角光影烘焙器 ====================
  function shiftHexColor(hex, delta) {
    if (!hex || hex[0] !== '#' || hex.length < 7) return hex;
    const num = parseInt(hex.slice(1, 7), 16);
    const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
    const r = clamp(((num >> 16) & 255) + delta);
    const g = clamp(((num >> 8) & 255) + delta);
    const b = clamp((num & 255) + delta);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /**
   * 将任意稀疏行矩阵自动垂直/水平居中裁剪并填充为标准 18×18 方阵
   */
  function normalizeGrid18(rows, targetSize) {
    const size = targetSize || 18;
    let minX = 999;
    let maxX = -1;
    let minY = 999;
    let maxY = -1;

    for (let y = 0; y < rows.length; y++) {
      const r = rows[y];
      for (let x = 0; x < r.length; x++) {
        const ch = r[x];
        if (ch !== '.' && ch !== ' ') {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < minX || maxY < minY) {
      return Array.from({ length: size }, () => '.'.repeat(size));
    }

    const contentW = maxX - minX + 1;
    const contentH = maxY - minY + 1;
    const offsetX = Math.floor((size - contentW) / 2);
    const offsetY = Math.floor((size - contentH) / 2);

    const out = [];
    for (let y = 0; y < size; y++) {
      let line = '';
      const srcY = y - offsetY + minY;
      for (let x = 0; x < size; x++) {
        const srcX = x - offsetX + minX;
        let ch = '.';
        if (
          x >= offsetX &&
          x < offsetX + contentW &&
          y >= offsetY &&
          y < offsetY + contentH &&
          rows[srcY] &&
          rows[srcY][srcX]
        ) {
          ch = rows[srcY][srcX];
        }
        line += ch;
      }
      out.push(line);
    }
    return out;
  }

  /**
   * 烘焙高质感 16-Bit 像素贴图：
   * - 自动居中对齐 18×18 画幅
   * - 左上受光面自动微提亮 (+20)，右下背光面自动加深 (-22)，外轮廓保持锐利深色描边
   */
  function bakeEnhancedIcon(createCanvasFn, def, pixelScale) {
    const scale = pixelScale || 2;
    const grid = normalizeGrid18(def.grid, 18);
    const h = grid.length;
    const w = grid[0].length;
    const canvas = createCanvasFn(Math.ceil(w * scale), Math.ceil(h * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    ctx.imageSmoothingEnabled = false;

    const pal = def.palette || PAL.goldBlade;
    const cellAt = (x, y) => {
      if (y < 0 || y >= h || x < 0 || x >= w) return '.';
      return grid[y][x] || '.';
    };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ch = cellAt(x, y);
        if (ch === '.' || ch === ' ') continue;
        let col = pal[ch];
        if (!col) continue;

        // 对非描边、非纯白高光的材质内部像素施加 16-Bit 微斜角体积光影
        if (ch !== 'O' && ch !== 'W') {
          const up = cellAt(x, y - 1);
          const left = cellAt(x - 1, y);
          const down = cellAt(x, y + 1);
          const right = cellAt(x + 1, y);
          if ((up === 'O' || left === 'O') && down !== 'O' && right !== 'O') {
            col = shiftHexColor(col, 18);
          } else if ((down === 'O' || right === 'O') && up !== 'O' && left !== 'O') {
            col = shiftHexColor(col, -20);
          }
        }

        ctx.fillStyle = col;
        const px = Math.round(x * scale);
        const py = Math.round(y * scale);
        const pw = Math.round((x + 1) * scale) - px;
        const ph = Math.round((y + 1) * scale) - py;
        ctx.fillRect(px, py, pw, ph);
      }
    }
    return canvas;
  }

  return {
    EQUIP_SPRITE_DEFS,
    MATERIAL_SPRITE_DEFS,
    normalizeGrid18,
    shiftHexColor,
    bakeEnhancedIcon
  };
});
