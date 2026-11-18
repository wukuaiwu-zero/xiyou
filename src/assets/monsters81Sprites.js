/**
 * 《西游记》九九八十一难全怪物像素精灵矩阵库 (src/assets/monsters81Sprites.js)
 * 收录 52 套高辨识度手绘 16-Bit 像素妖怪母版（含双帧动态 f0/f1 + 受击白闪帧 + 图鉴高清帧），
 * 并支持按八十一难独立配色覆写（paletteOverride），完整呈现第 1 难至第 81 难全部妖王、头目与小妖形象！
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
})('monsters81Sprites', function () {
  // ==================== 一、小妖与劫难头目像素矩阵 (18x12 ~ 22x16, 默认 scale=2) ====================
  const MOB_ARCHETYPES = {
    // 1. 天兵残影 / 贬谪金甲卫（金蝉遭贬、天庭试炼幻象）
    celestial_guard: {
      palette: { O: '#120d16', G: '#ffd166', A: '#e09f3e', C: '#00f5d4', W: '#ffffff', R: '#ef233c', B: '#1d3557' },
      f0: [
        '.....OOCCOO.....WW',
        '....OGGGGGGO...WCO',
        '...OGGWWWWGGO..OO.',
        '...OGCEGGCGEO..O..',
        '....OGGGGGGO...O..',
        '..OORGGGGGGROOOO..',
        '.OOGGAAGGAAGGOO...',
        '..OOAAAAAAAOO.....',
        '...OBBGGGGGBO.....',
        '....OGG..GGO......',
        '...OOBB..BBOO.....',
        '...OOOO..OOOO.....'
      ],
      f1: [
        '.....OOCCOO.....WW',
        '....OGGGGGGO...WCO',
        '...OGGWWWWGGO..OO.',
        '...OGCEGGCGEO..O..',
        '....OGGGGGGO...O..',
        '..OORGGGGGGROOOO..',
        '.OOGGAAGGAAGGOO...',
        '..OOAAAAAAAOO.....',
        '...OBBGGGGGBO.....',
        '...OGG....GGO.....',
        '..OOOO....OOOO....',
        '..................'
      ]
    },

    // 2. 江州水贼 / 剪径恶寇 / 灭法国刀客（头巾、独眼罩、鬼头环刀）
    bandit_raider: {
      palette: { O: '#120d16', R: '#d62828', S: '#e0ac69', B: '#2b2d42', M: '#ced4da', W: '#ffffff', G: '#99582a' },
      f0: [
        '....OOOOOO....MMM.',
        '...ORRRRRRO..OMWMO',
        '..OSSSSSSSSO.OMMO.',
        '..OSOOSSOWSO.OO...',
        '...OSSSSSSO..O....',
        '..OOBBBBBBOOOO....',
        '.OOBBGGGGBBBO.....',
        '..OOBBBBBBOO......',
        '...OGG..GGO.......',
        '..OOBB..BBOO......',
        '..OOOO..OOOO......'
      ],
      f1: [
        '....OOOOOO....MMM.',
        '...ORRRRRRO..OMWMO',
        '..OSSSSSSSSO.OMMO.',
        '..OSOOSSOWSO.OO...',
        '...OSSSSSSO..O....',
        '..OOBBBBBBOOOO....',
        '.OOBBGGGGBBBO.....',
        '...OBBBBBBO.......',
        '..OGG....GGO......',
        '.OOOO....OOOO.....',
        '..................'
      ]
    },

    // 3. 洪江凶鳞 / 鹰愁涧水妖 / 弱水水鬼（背鳍、青鳞、分水叉）
    river_scale_fiend: {
      palette: { O: '#120d16', T: '#00b4d8', D: '#0077b6', C: '#90e0ef', E: '#ffbe0b', W: '#ffffff' },
      f0: [
        '.....OOTTOO...W.W.',
        '...OOTTTTTTOO.WWW.',
        '..OTTTCCCCCTTO.O..',
        '..OTTEOTTOETTO.O..',
        '..OTTTWWWWTTTO.O..',
        '.OODTTTTTTTTDOOO..',
        '.ODDTCCCCCCTTDO...',
        '..OODDDDDDDDDO....',
        '...OTT....TTO.....',
        '..OODT....TDOO....',
        '..OOOO....OOOO....'
      ],
      f1: [
        '....OOTTOO....W.W.',
        '...OOTTTTTTOO.WWW.',
        '..OTTTCCCCCTTO.O..',
        '..OTTEOTTOETTO.O..',
        '..OTTTWWWWTTTO.O..',
        '.OODTTTTTTTTDOOO..',
        '.ODDTCCCCCCTTDO...',
        '...ODDDDDDDDO.....',
        '....OTT..TTO......',
        '...OODT..TDOO.....',
        '...OOOO..OOOO.....'
      ]
    },

    // 4. 观音禅院纵火恶僧（戒疤僧头、灰褐僧衣、熊熊火把）
    fire_monk: {
      palette: { O: '#120d16', S: '#f1c27d', R: '#dc2f02', F: '#ff9f1c', Y: '#ffd166', G: '#6c757d', D: '#495057' },
      f0: [
        '....OOOOOO....YY..',
        '...OSSSSSSO..YFFY.',
        '..OSSOOOOSSO.ORRO.',
        '..OSROSSROSO..OO..',
        '...OSSSSSSO...O...',
        '..OOGGGGGGOOOOO...',
        '.OOGGDDDDGGGGO....',
        '..OOGGGGGGGGO.....',
        '...ODD..DDO.......',
        '..OODD..DDOO......',
        '..OOOO..OOOO......'
      ],
      f1: [
        '....OOOOOO...Y..Y.',
        '...OSSSSSSO..YYYY.',
        '..OSSOOOOSSO.ORRO.',
        '..OSROSSROSO..OO..',
        '...OSSSSSSO...O...',
        '..OOGGGGGGOOOOO...',
        '.OOGGDDDDGGGGO....',
        '...OGGGGGGGO......',
        '..ODD....DDO......',
        '.OOOO....OOOO.....',
        '..................'
      ]
    },

    // 5. 白衣秀士·白花蛇精（书生儒巾、素白长衫、毒牙羽扇、盘蛇尾）
    white_snake_scholar: {
      palette: { O: '#120d16', B: '#2b2d42', W: '#f8f9fa', L: '#ced4da', G: '#69f0ae', E: '#ff0a54', S: '#ffe5d9' },
      f0: [
        '....OOOOOO........',
        '...OBBBBBBO...GGG.',
        '...OSSSSSSO..GWWGO',
        '...OSEOSESO..GWWGO',
        '....OSSSSO....OO..',
        '..OOWWWWWWOOOOO...',
        '.OOWWLLLLWWWWO....',
        '..OOWWWWWWWWO.....',
        '...OOLLLLLLOO.....',
        '....OOLLLLLLLOO...',
        '.....OOOOOOOOOO...'
      ],
      f1: [
        '....OOOOOO........',
        '...OBBBBBBO..GGG..',
        '...OSSSSSSO.GWWGO.',
        '...OSEOSESO.GWWGO.',
        '....OSSSSO...OO...',
        '..OOWWWWWWOOOO....',
        '.OOWWLLLLWWWWO....',
        '..OOWWWWWWWWO.....',
        '..OOLLLLLLOO......',
        '.OOLLLLLLOO.......',
        '.OOOOOOOOO........'
      ]
    },

    // 6. 苍狼先锋 / 凌虚子 / 铁背苍狼怪
    wolf_scout: {
      palette: { O: '#120d16', G: '#6c757d', L: '#adb5bd', R: '#ff0a54', B: '#343a40', W: '#f8f9fa', M: '#e63946' },
      f0: [
        '..OO........OO....',
        '.OGGO......OGGO...',
        '.OGGLOOOOOOLGGO...',
        'OGGGLRGGGGLRGGO.WW',
        'OGGGGGGGGGGGGGOOWO',
        '.OOGGWWWWWWGGOOWO.',
        '..OBBMMMMMMBBOOO..',
        '.OBBGGGGGGGGBBO...',
        '.OBB..OOOO..BBO...',
        '.....OGG..GGO.....',
        '....OOGG..GGOO....',
        '....OOOO..OOOO....'
      ],
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

    // 7. 黑风火弓手 / 波月巡山弓妖
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

    // 8. 玄甲黑熊卫 / 熊山君（正面巨盾）
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

    // 9. 云栈猪妖魔影 / 野猪狂战（长吻白牙、九齿铁耙）
    wild_boar_brute: {
      palette: { O: '#120d16', B: '#5c3a21', P: '#d4a373', W: '#ffffff', R: '#ef233c', M: '#adb5bd', D: '#22223b' },
      f0: [
        '..OOO......OOO..MWM',
        '.OBBBOOOOOOBBBO.OMO',
        '.OBBBBBBBBBBBBO..O.',
        'OBBBRBBBBBRBBBBO.O.',
        'OWBPPPPPPPPPPBWO.O.',
        '.OOBBPPPPPPBBOOOOO.',
        '..ODDDDDDDDDDDO....',
        '.OODDBBBBBBDDOO....',
        '..ODDDD..DDDDO.....',
        '...OBBO..OBBO......',
        '..OOBBO..OBBOO.....',
        '..OOOOO..OOOOO.....'
      ],
      f1: [
        '..OOO......OOO..MWM',
        '.OBBBOOOOOOBBBO.OMO',
        '.OBBBBBBBBBBBBO..O.',
        'OBBBRBBBBBRBBBBO.O.',
        'OWBPPPPPPPPPPBWO.O.',
        '.OOBBPPPPPPBBOOOOO.',
        '..ODDDDDDDDDDDO....',
        '..ODDBBBBBBDDO.....',
        '..OBBO....OBBO.....',
        '.OOBBO....OBBOO....',
        '.OOOOO....OOOOO....',
        '...................'
      ]
    },

    // 10. 虎先锋 / 黄风虎刀客 / 巴山虎
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

    // 11. 白骨鬼火师 / 铜台阴魂
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

    // 12. 幽冥白骨将 / 凌云尸魔
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

    // 13. 精细鬼 / 伶俐虫 / 小钻风 / 有来有去（尖角小妖 + 紫金红葫芦/巡山锣）
    lotus_imp: {
      palette: { O: '#120d16', G: '#52b788', D: '#2d6a4f', Y: '#ffd166', R: '#ef233c', W: '#ffffff', B: '#7f4f24' },
      f0: [
        '....YO....OY......',
        '...OOGGGGGGOO..YY.',
        '..OGGGGGGGGGGOORRO',
        '..OGWOOGGOOWGOORRO',
        '...OGGGGGGGGO..OO.',
        '..OOBBBBBBBBOOOO..',
        '..OBBYYYYYYBBO....',
        '...OOBBBBBBOO.....',
        '....ODD..DDO......',
        '...OODD..DDOO.....',
        '...OOOO..OOOO.....'
      ],
      f1: [
        '....YO....OY......',
        '...OOGGGGGGOO...YY',
        '..OGGGGGGGGGGO.RRO',
        '..OGWOOGGOOWGO.RRO',
        '...OGGGGGGGGO...OO',
        '..OOBBBBBBBBOOOO..',
        '..OBBYYYYYYBBO....',
        '...OOBBBBBBOO.....',
        '...ODD....DDO.....',
        '..OOOO....OOOO....',
        '..................'
      ]
    },

    // 14. 九尾妖狐（压龙大仙 / 玉面狐狸 / 白面狐狸）
    nine_tail_vixen: {
      palette: { O: '#120d16', W: '#fff0f3', P: '#ff4d6d', M: '#c9184a', G: '#ffd166', C: '#80ffdb' },
      f0: [
        '..OO......OO....CC',
        '.OWWO....OWWO..CWC',
        '.OWWWOOOOWWWO...CC',
        'OWWWWPWWPWWWWO....',
        '.OOWWWWWWWWOO.....',
        'WW.OOPPPPPOO......',
        'WPWOPPMMMPPO......',
        '.OWOPGGGGGPPO.....',
        '..OOOPPPPPPOO.....',
        '....OWW..WWO......',
        '...OOWW..WWOO.....',
        '...OOOO..OOOO.....'
      ],
      f1: [
        '..OO......OO...CC.',
        '.OWWO....OWWO.CWCO',
        '.OWWWOOOOWWWO..CC.',
        'OWWWWPWWPWWWWO....',
        '.OOWWWWWWWWOO.....',
        '.WWOOPPPPPOO......',
        'WPWOPPMMMPPO......',
        '.OOOPGGGGGPPO.....',
        '...OOPPPPPPOO.....',
        '...OWW....WWO.....',
        '..OOOO....OOOO....',
        '..................'
      ]
    },

    // 15. 火云洞六健将 / 赤炎罗刹灵
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
    },

    // 16. 黑水河虾兵 / 碧波潭水族戟兵（长触须、虾壳甲、三叉戟）
    shrimp_soldier: {
      palette: { O: '#120d16', R: '#e76f51', L: '#f4a261', C: '#48cae4', W: '#ffffff', M: '#adb5bd' },
      f0: [
        'LL..........LL.WMW',
        '.LL..OOOOOO..L.OMO',
        '..OOORRRRRROO...O.',
        '.ORRRLLRRRRRO...O.',
        '.ORRWOORRWOORO..O.',
        '..OORRRRRRRROOOOO.',
        '..OOCCCCCCCCOO....',
        '.OORCCCCCCCCRRO...',
        '..OORRRRRRRROO....',
        '...ORR....RRO.....',
        '..OORR....RROO....',
        '..OOOO....OOOO....'
      ],
      f1: [
        '.LL........LL..WMW',
        '..LL.OOOOOO.LL.OMO',
        '..OOORRRRRROO...O.',
        '.ORRRLLRRRRRO...O.',
        '.ORRWOORRWOORO..O.',
        '..OORRRRRRRROOOOO.',
        '..OOCCCCCCCCOO....',
        '..ORCCCCCCCCRO....',
        '...ORR....RRO.....',
        '..OOOO....OOOO....',
        '..................',
        '..................'
      ]
    },

    // 17. 通天河冰甲蟹将（横行铁甲、正面巨螯护盾！）
    crab_guardian: {
      palette: { O: '#120d16', C: '#00b4d8', L: '#90e0ef', R: '#ff5400', W: '#ffffff', D: '#1d3557' },
      f0: [
        '...OWO....OWO.....',
        '..OOCCCCCCCCOO.OOO',
        '.OCCCCLLLLCCCCOCCO',
        'OCCCCCCCCCCCCCCCLO',
        'OCCCRCCCCCCRCCCCLO',
        '.OOCCCCCCCCCCCOCCO',
        '..ODDDDDDDDDDDOOOO',
        '.OODCCCCCCCCDDO...',
        '.OO..OO..OO..OO...',
        'O....O....O....O..'
      ],
      f1: [
        '...OWO....OWO.....',
        '..OOCCCCCCCCOO.OOO',
        '.OCCCCLLLLCCCCOCCO',
        'OCCCCCCCCCCCCCCCLO',
        'OCCCRCCCCCCRCCCCLO',
        '.OOCCCCCCCCCCCOCCO',
        '..ODDDDDDDDDDDOOOO',
        '.OODCCCCCCCCDDO...',
        '..OO..OO..OO..OO..',
        '..O...O....O...O..'
      ]
    },

    // 18. 奔波儿灞（鲇鱼怪）/ 灞波儿奔（黑鱼精）/ 斑衣鳜婆
    fish_assassin: {
      palette: { O: '#120d16', B: '#3a5a40', G: '#588157', Y: '#ffd166', W: '#ffffff', M: '#ced4da' },
      f0: [
        '.....OOOOOO....MW.',
        '...OOBBBBBBOO..MMO',
        '..OBBGGGGGGGGBO.OO.',
        'YYOBGWOOBGWOOBO.O..',
        'Y.OBGGGGGGGGGBOOO..',
        '..OOBBYYYYBBBOO....',
        '..OBBGGGGGGGGBO....',
        '...OOBBBBBBBBOO....',
        '....OBB..BBO.......',
        '...OOBB..BBOO......',
        '...OOOO..OOOO......'
      ],
      f1: [
        '.....OOOOOO.....MW',
        '...OOBBBBBBOO..MMO',
        '..OBBGGGGGGGGBO.OO',
        'YYOBGWOOBGWOOBO.O.',
        '.YOBGGGGGGGGGBOOO.',
        '..OOBBYYYYBBBOO...',
        '..OBBGGGGGGGGBO...',
        '...OBBBBBBBBBO....',
        '...OBB....BBO.....',
        '..OOOO....OOOO....',
        '..................'
      ]
    },

    // 19. 车迟国三清道士 / 五庄道童幻象（道冠、八卦仙衣、符剑）
    taoist_acolyte: {
      palette: { O: '#120d16', Y: '#ffd166', B: '#1d3557', C: '#4ea8de', S: '#ffe5d9', W: '#ffffff', R: '#ef233c' },
      f0: [
        '......OYYO......WW',
        '....OOBBBBBOO..WRO',
        '...OSSSSSSSSO..OO.',
        '...OSOOSSOOSSO.O..',
        '....OSSSSSSO...O..',
        '..OOBBYYYYBBOOOO..',
        '.OOBBCCCCCCBBBO...',
        '..OOBBYYYYBBBO....',
        '...OBBBBBBBBO.....',
        '....OBB..BBO......',
        '...OOWW..WWOO.....',
        '...OOOO..OOOO.....'
      ],
      f1: [
        '......OYYO......WW',
        '....OOBBBBBOO..WRO',
        '...OSSSSSSSSO..OO.',
        '...OSOOSSOOSSO.O..',
        '....OSSSSSSO...O..',
        '..OOBBYYYYBBOOOO..',
        '.OOBBCCCCCCBBBO...',
        '...OBBYYYYBBO.....',
        '...OBB....BBO.....',
        '..OOWW....WWOO....',
        '..OOOO....OOOO....',
        '..................'
      ]
    },

    // 20. 荆棘岭树精（十八公/孤直公/凌空子/拂云叟/赤身鬼）
    thorn_treant: {
      palette: { O: '#120d16', G: '#2d6a4f', L: '#52b788', B: '#582f0e', D: '#3b1f08', E: '#ffba08' },
      f0: [
        '.G..G..GGGG..G..G.',
        '.GGGGGGGGGGGGGGGG.',
        '..OOGGLLLLGGGGOO..',
        '..OOBBBBBBBBBBOO..',
        '.OOBBBEBBBBBEBBOO.',
        '.OBBBBBOOOOBBBBBO.',
        '..OOBBDDDDDDBBOO..',
        '..OBBBDDDDDDBBBO..',
        '...OBBB....BBBO...',
        '..OOBBBO..OBBBOO..',
        '..OOOOOO..OOOOOO..'
      ],
      f1: [
        'G..G..GGGGGG..G..G',
        '.GGGGGGGGGGGGGGGG.',
        '..OOGGLLLLGGGGOO..',
        '..OOBBBBBBBBBBOO..',
        '.OOBBBEBBBBBEBBOO.',
        '.OBBBBBOOOOBBBBBO.',
        '..OOBBDDDDDDBBOO..',
        '...OBBDDDDDDBBO...',
        '...OBB......BBO...',
        '..OOOO......OOOO..',
        '..................'
      ]
    },

    // 21. 杏仙 / 西梁女国护卫（花冠、绯红披帛、飞花灵刃）
    apricot_fairy: {
      palette: { O: '#120d16', P: '#ff8fa3', R: '#ff4d6d', W: '#fff0f3', G: '#ffd166', S: '#ffe5d9' },
      f0: [
        '....OOPPGPPO......',
        '...OORRRRRROO..PP.',
        '...OSSSSSSSSO.PWPO',
        '...OSROSSROSO..PP.',
        '....OSSSSSSO......',
        '..OOPPWWWWPPOO....',
        '.OOPPRRRRRRPPOO...',
        '..OOPPPPPPPPPOO...',
        '...OPPPPPPPO......',
        '....ORR..RRO......',
        '...OORR..RROO.....',
        '...OOOO..OOOO.....'
      ],
      f1: [
        '....OOPPGPPO...PP.',
        '...OORRRRRROO.PWPO',
        '...OSSSSSSSSO..PP.',
        '...OSROSSROSO.....',
        '....OSSSSSSO......',
        '..OOPPWWWWPPOO....',
        '.OOPPRRRRRRPPOO...',
        '...OPPPPPPPPO.....',
        '...ORR....RRO.....',
        '..OOOO....OOOO....',
        '..................',
        '..................'
      ]
    },

    // 22. 盘丝洞七蜘蛛精侍女（蛛网发饰、六蛛刺足、吐丝毒囊）
    spider_sister: {
      palette: { O: '#120d16', P: '#7209b7', M: '#b5179e', W: '#f8f9fa', E: '#ff0a54', S: '#ffe5d9' },
      f0: [
        '....OOMMMMOO......',
        '...OOPPPPPPOO.....',
        '...OSSSSSSSSO.....',
        '...OSEEOSEESO.....',
        'OO..OOSSSSOO..OO..',
        '.OOPPWWWWWWPPOO...',
        'OO.OPPMMMMPPO..OO.',
        '...OOPPPPPPOO.....',
        '..OO.OP..PO.OO....',
        '.O...OO..OO...O...'
      ],
      f1: [
        '....OOMMMMOO......',
        '...OOPPPPPPOO.....',
        '...OSSSSSSSSO.....',
        '...OSEEOSEESO.....',
        '.OO.OOSSSSOO.OO...',
        '..OOPPWWWWPPOO....',
        '.OO.OPMMMMPPO.OO..',
        '...OOPPPPPPOO.....',
        '.OO..OO..OO..OO...',
        'O....O....O....O..'
      ]
    },

    // 23. 黄花观毒蜂虫妖 / 多目百足毒卫（薄翼、复眼、剧毒尾针）
    centipede_wasp: {
      palette: { O: '#120d16', Y: '#ffb703', B: '#22223b', W: '#caf0f8', R: '#ff0a54', G: '#80ffdb' },
      f0: [
        '..WWWW......WWWW..',
        '.OWWWWOOOOOOWWWWO.',
        '..OOOOYYYYYYOOOO..',
        '...OYROOYYOORYO...',
        '....OOYYYYYYOO....',
        '...OOBBYYYYBBOO...',
        '...OBBYYYYYYBBO...',
        '....OOBBBBBBOO....',
        '.....OOYYYYOO.....',
        '......OORROO......',
        '.......ORRO.......',
        '........OO........'
      ],
      f1: [
        '....WW......WW....',
        '...OWWOOOOOOWWO...',
        '..OOOOYYYYYYOOOO..',
        '...OYROOYYOORYO...',
        '....OOYYYYYYOO....',
        '...OOBBYYYYBBOO...',
        '...OBBYYYYYYBBO...',
        '....OOBBBBBBOO....',
        '.....OOYYYYOO.....',
        '......OORROO......',
        '.......OOOO.......',
        '..................'
      ]
    },

    // 24. 平天重甲魔卫 / 金兜铁牛卫 / 玄英犀牛卫
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

    // 25. 狮驼岭狂狮魔兵 / 黄狮精 / 竹节山六狮卫（狂鬃、巨型狼牙棒）
    lion_roar_warrior: {
      palette: { O: '#120d16', Y: '#f4a261', A: '#e76f51', R: '#ff0a54', M: '#adb5bd', W: '#ffffff', D: '#264653' },
      f0: [
        '...OOOOOOOOOO...MWM',
        '..OAAAAAAAAAAO.WMOM',
        '.OAAYYYYYYYYAAO.OMO',
        '.OAYROYYYYORYAO..O.',
        '.OAAYYWWWWYYAAO..O.',
        '..OOAAAAAAAAOOOOOO.',
        '..OODDDDDDDDDOO....',
        '.OODDYYYYYYYDDO....',
        '..OODDDDDDDDDO.....',
        '...OYY....YYO......',
        '..OODD....DDOO.....',
        '..OOOO....OOOO.....'
      ],
      f1: [
        '...OOOOOOOOOO...MWM',
        '..OAAAAAAAAAAO.WMOM',
        '.OAAYYYYYYYYAAO.OMO',
        '.OAYROYYYYORYAO..O.',
        '.OAAYYWWWWYYAAO..O.',
        '..OOAAAAAAAAOOOOOO.',
        '..OODDDDDDDDDOO....',
        '...ODDYYYYYDDO.....',
        '..OYY......YYO.....',
        '.OOOO......OOOO....',
        '...................',
        '...................'
      ]
    },

    // 26. 无底洞蚀骨鼠妖（圆鼠耳、利齿、双刺短剑）
    rat_assassin: {
      palette: { O: '#120d16', G: '#adb5bd', W: '#f8f9fa', P: '#ff8fa3', E: '#ff0a54', D: '#4a4e69' },
      f0: [
        '.OOO........OOO...',
        'OGPPO......OPPGO..',
        'OGGGGOOOOOOGGGGO.W',
        '.OGGGGEGGGEGGGGOOW',
        '..OOGGGWWGGGGOOO..',
        '..OODDDDDDDDDOO...',
        '.OODDPPPPPPDDOO...',
        '..OODDDDDDDDDO....',
        '....OGG..GGO......',
        '...OODD..DDOO.....',
        '...OOOO..OOOO.....'
      ],
      f1: [
        '.OOO........OOO...',
        'OGPPO......OPPGO..',
        'OGGGGOOOOOOGGGGO.W',
        '.OGGGGEGGGEGGGGOOW',
        '..OOGGGWWGGGGOOO..',
        '..OODDDDDDDDDOO...',
        '..ODDPPPPPPDDDO...',
        '...OGG....GGO.....',
        '..OODD....DDOO....',
        '..OOOO....OOOO....',
        '..................'
      ]
    }
  };

  // ==================== 二、九九八十一难大妖王 Boss 巨型像素矩阵 (26x20 ~ 32x24, 霸主体型 + 四态动作帧 + 二阶真身色板) ====================
  const BOSS_ARCHETYPES = {
    // 1. 寅将军·双叉虎王（王字额斑斓巨虎、吞肩玄甲、猩红狂风披风、百炼虎牙巨刀）
    yin_general: {
      palette: { O: '#0f0c14', T: '#f77f00', Y: '#fcbf49', W: '#ffffff', R: '#d62828', D: '#2b2d42', M: '#ced4da' },
      p2Palette: { T: '#ff4800', Y: '#ffd60a', R: '#ff0a54', D: '#370617', M: '#ffd166' },
      f0: [
        '...OOOO............OOOO..MMM',
        '..OTTTTOOOOOOOOOOOOTTTTOOMWM',
        '..OTOTTTTTTTYYTTTTTTTOTOOMWM',
        '.OTTTTOTTTTTYYTTTTTOTTTTOOMO',
        '.OTTTTTRWTTTTTTTTTRWTTTTOOMO',
        '.OTTTTTTTWWWWWWWWTTTTTTTO.O.',
        '..OOTTTTTWOOOWOOOWTTTTTO..O.',
        '.OORRODDDDDDYYYYDDDDDDDOOOO.',
        'OORRRDDTTTTTYYYYTTTTTDDDOO..',
        'ORRRRDDTTYYYYYYYYYYTTDDDOO..',
        'ORRR.OODDDDDYYYYDDDDDDOO....',
        '.OO..OOTTTTTYYYYTTTTTTO.....',
        '.....OODDDDDDDDDDDDDDDO.....',
        '.....OTTTTTT....TTTTTTO.....',
        '.....OTTTTT......TTTTTO.....',
        '.....ODDDDO......ODDDDO.....',
        '....OODDDDO......ODDDDOO....',
        '....OOTTTTO......OTTTTOO....',
        '....OOOOOOO......OOOOOOO....'
      ],
      f1: [
        '...OOOO............OOOO...MM',
        '..OTTTTOOOOOOOOOOOOTTTTO.MWM',
        '..OTOTTTTTTTYYTTTTTTTOTO.MWM',
        '.OTTTTOTTTTTYYTTTTTOTTTTOOMO',
        '.OTTTTTRWTTTTTTTTTRWTTTTO.O.',
        '.OTTTTTTTWWWWWWWWTTTTTTTO.O.',
        '..OOTTTTTWOOOWOOOWTTTTTOOOO.',
        'OORRODDDDDDDYYYYDDDDDDDOO...',
        'ORRRRDDTTTTTYYYYTTTTTDDDO...',
        'ORRR.OODDTTTYYYYTTTDDDOO....',
        '.OO..OOTTTTTYYYYTTTTTTO.....',
        '.....OODDDDDDDDDDDDDDDO.....',
        '....OOTTTTT......TTTTTOO....',
        '....OTTTTT........TTTTTO....',
        '....ODDDDO........ODDDDO....',
        '...OODDDDO........ODDDDOO...',
        '...OOOOOOO........OOOOOOO...',
        '............................',
        '............................'
      ]
    },

    // 2. 黑风大王·熊罴精（黑风山魁梧巨熊魔躯、偷袈裟佛金护心镜、烈焰黑缨点钢长枪）
    black_bear_king: {
      palette: { O: '#0f0c14', D: '#1c1d2e', B: '#343a40', R: '#ff4800', G: '#ffb703', M: '#adb5bd', W: '#ffffff' },
      p2Palette: { D: '#120814', B: '#370617', R: '#ff0a54', G: '#ffd60a', M: '#ff9f1c' },
      f0: [
        '....OOOO..........OOOO....RR.',
        '...ODDDDOOOOOOOOOODDDDO..RWRO',
        '..ODDBBBBBBBBBBBBBBBBDDO.RWRO',
        '..ODBBBBGGGGBBBBGGGGBBDO..OO.',
        '.ODBBBBRWBBBBBBBBRWBBBBDO.OMO',
        '.ODBBBBBBBBBBBBBBBBBBBBDO.OMO',
        '.ODBBBBBBWWGGGGGGWWBBBBDO.O..',
        '.OOGGGGGGGGGGGGGGGGGGGGOOOO..',
        'OODGGBBBBBGGGGGGGGBBBBGGBDO..',
        'ODBBBBBGGGRRGGGGRRGGBBBBBDO..',
        'ODBBBBBBBBGGGGGGGGBBBBBBBDO..',
        'OODDDDDDDDGGGGGGGGDDDDDDDOO..',
        '.OOGGGGGGGGGGGGGGGGGGGGGOO...',
        '..ODBBBBBBBBBBBBBBBBBBBBDO...',
        '..ODBBBBBB........BBBBBBDO...',
        '..ODBBBB............BBBBDO...',
        '..ODDDDO............ODDDDO...',
        '.OODDGDO............ODGDDOO..',
        '.OOOOOOO............OOOOOOO..'
      ],
      f1: [
        '....OOOO..........OOOO...RR..',
        '...ODDDDOOOOOOOOOODDDDO.RWRO.',
        '..ODDBBBBBBBBBBBBBBBBDDO.RRO.',
        '..ODBBBBGGGGBBBBGGGGBBDO..OO.',
        '.ODBBBBRWBBBBBBBBRWBBBBDO.OMO',
        '.ODBBBBBBBBBBBBBBBBBBBBDO.O..',
        '.ODBBBBBBWWGGGGGGWWBBBBDOOO..',
        'OODGGGGGGGGGGGGGGGGGGGGOO....',
        'ODBGGBBBBBGGGGGGGGBBBBGGBDO..',
        'ODBBBBBGGGRRGGGGRRGGBBBBBDO..',
        '.OODDDDDDDGGGGGGGGDDDDDDOO...',
        '..OOGGGGGGGGGGGGGGGGGGGGOO...',
        '..ODBBBBBB........BBBBBBDO...',
        '.OODBBBB............BBBBDDO..',
        '.OODDDDO............ODDDDOO..',
        '.OOOOOOO............OOOOOOO..',
        '.............................',
        '.............................',
        '.............................'
      ]
    },

    // 3. 黄风大圣·貂鼠精（金毛貂王宝冠、大漠三昧风神袍、三股巨钢叉、脚踏狂沙旋风）
    yellow_wind_sage: {
      palette: { O: '#0f0c14', Y: '#e9c46a', G: '#f4a261', R: '#e76f51', W: '#fff3b0', D: '#582f0e' },
      p2Palette: { Y: '#ffd60a', G: '#ff9f1c', R: '#ff0a54', W: '#ffffff', D: '#370617' },
      f0: [
        '......OOOOOOOOOOOO...W.W.W..',
        '....OOYYYYYYYYYYYYOO.OWWWO..',
        '...OYYGGGGYYYYGGGGYYO.OYO...',
        '..OYYGGGGGGGGGGGGGGYYOOYO...',
        '.OYYGGGRWOYYYYOGRWGGYYOO....',
        '.OYYYYYYGGGGGGGGYYYYYYO.O...',
        '..OOYYYYYWWWWWWYYYYYOO..O...',
        '.OORRDDDDDYYYYDDDDDDOOOOO...',
        'OORRDDYYYYGGGGYYYYYYDDOO....',
        'ORRRDDYYGGGGGGGGYYDDDDOO....',
        '.OORDDDDDDYYYYDDDDDDDDO.....',
        '..OOYYYYYYGGGGYYYYYYOO......',
        '...OODDDDDDDDDDDDDDDOO......',
        '...OOYYYYYY....YYYYYYOO.....',
        '..GGYYYYOO......OOYYYYGG....',
        '.GGGDDDDGGG....GGGDDDDGGG...',
        '..GGGGGGGG......GGGGGGGG....',
        '....GGGG..........GGGG......'
      ],
      f1: [
        '......OOOOOOOOOOOO....WWW...',
        '....OOYYYYYYYYYYYYOO..OWWO..',
        '...OYYGGGGYYYYGGGGYYO..OYO..',
        '..OYYGGGGGGGGGGGGGGYYO.OO...',
        '.OYYGGGRWOYYYYOGRWGGYYO.O...',
        '.OYYYYYYGGGGGGGGYYYYYYO.O...',
        '..OOYYYYYWWWWWWYYYYYOOOOO...',
        '.OORRDDDDDYYYYDDDDDDOO......',
        'OORRDDYYYYGGGGYYYYYYDDOO....',
        '.OORDDDDDDYYYYDDDDDDDDO.....',
        '..OOYYYYYYGGGGYYYYYYOO......',
        '...OODDDDDDDDDDDDDDDOO......',
        '..GGYYYYOO......OOYYYYGG....',
        '.GGGGDDDGGGG..GGGGDDDGGGG...',
        '..GGGGGGGGGG..GGGGGGGGGG....',
        '............................',
        '............................',
        '............................'
      ]
    },

    // 4. 流沙河卷帘魔影（怒张赤发、九颗巨型白骨骷髅念珠、降妖月牙宝杖、深渊黑水巨浪）
    liusha_demon: {
      palette: { O: '#0f0c14', R: '#d62828', B: '#0077b6', C: '#00f5d4', W: '#ffffff', P: '#5a189a', G: '#ffd166' },
      p2Palette: { R: '#ff0a54', B: '#03045e', C: '#80ffdb', P: '#7209b7', G: '#ffd60a' },
      f0: [
        '......OORRRRRRRROO....CCCC.',
        '....OORRRRRRRRRRRROO.CWWWWC',
        '...OORRGGGGGGGGGGRROOCW..WC',
        '..OOCCCCCCCCCCCCCCCCOO.CC..',
        '.OCCCCRWCCCCCCCCRWCCCCO.O..',
        '.OCCCCCRRRRRRRRRRCCCCCO.O..',
        '.OOWWWOOGGGGGGGGOOWWWOO.O..',
        'OOPPPWWOOCCCCCCOOOWWPPPOOO.',
        'OPPPWWCCCCCCCCCCCCWWPPPPO..',
        'OOPPPPPCCCCCCCCCCPPPPPPPO..',
        '.OOPPPPPPPPPPPPPPPPPPPPOO..',
        '..OOBBBBBBCCCCBBBBBBBOO....',
        '.OOBBCCCCWWWWWWCCCCBBBOO...',
        'OOBBCCCCWWWWWWWWCCCCBBBOO..',
        'CCCCCCCCCCCCCCCCCCCCCCCCCC.',
        '.CCCCWWWWCCCCCCCCWWWWCCCC..',
        '..CCCCCCCCCCCCCCCCCCCCCC...'
      ],
      f1: [
        '......OORRRRRRRROO...CCCC..',
        '....OORRRRRRRRRRRROOCWWWWC.',
        '...OORRGGGGGGGGGGRROOCW.WC.',
        '..OOCCCCCCCCCCCCCCCCOO.CC..',
        '.OCCCCRWCCCCCCCCRWCCCCO.O..',
        '.OCCCCCRRRRRRRRRRCCCCCO.O..',
        '.OOWWWOOGGGGGGGGOOWWWOOOO..',
        'OOPPPWWOOCCCCCCOOOWWPPPO...',
        'OPPPWWCCCCCCCCCCCCWWPPPPO..',
        '.OOPPPPPCCCCCCCCPPPPPPPOO..',
        '..OOBBBBBBCCCCBBBBBBBOO....',
        '.OOBBCCCCWWWWWWCCCCBBBOO...',
        'WWCCCCCCWWWWWWWWCCCCCCWWCC.',
        '.CCCCCCCCCCCCCCCCCCCCCCCC..',
        '...........................',
        '...........................',
        '...........................'
      ]
    },

    // 5. 乾坤袖镇观道尊傀（五庄观紫金太极冠、宽袍乾坤巨袖、七星紫金拂尘、先天灵根仙气）
    wuzhuang_immortal: {
      palette: { O: '#0f0c14', G: '#ffd166', C: '#06d6a0', B: '#1d3557', W: '#f8f9fa', S: '#ffe5d9', R: '#ef233c' },
      p2Palette: { G: '#ffd60a', C: '#00f5d4', B: '#240046', R: '#ff0a54' },
      f0: [
        '........OOGGGGOO......CCCC.',
        '......OOBBGGGGBBOO...CWWWWC',
        '.....OOBGGGGGGGGBOO..CWWWWC',
        '....OOSSSSSSSSSSSSOO..OOOO.',
        '....OSSWOOSSSSOOWSSO...OG..',
        '.....OOSSSSSSSSSSOO....OG..',
        '.....OOWWWWWWWWWWWOOOOOOG..',
        '..OOOBBBCCCCCCCCBBBBOOOOO..',
        '.OOBBBBCCCWRWWCCCBBBBBOO...',
        'OOBBBBBCCCWWWRCCCBBBBBBOO..',
        'OOBBBGGCCCCCCCCCCGGGBBBOO..',
        '.OOOOBBBBBGGGGGBBBBBBOOO...',
        '....OOBBBBBBBBBBBBBOO......',
        '....OOBBBB....BBBBBOO......',
        '....OOWWWO....OWWWOO.......',
        '...OOBBBO......OBBBOO......',
        '...OOOOOO......OOOOOO......',
        '..CCCCCCC......CCCCCCC.....'
      ],
      f1: [
        '........OOGGGGOO.....CCCC..',
        '......OOBBGGGGBBOO..CWWWWC.',
        '.....OOBGGGGGGGGBOO.CWWWWC.',
        '....OOSSSSSSSSSSSSOO..OOO..',
        '....OSSWOOSSSSOOWSSO...OG..',
        '.....OOSSSSSSSSSSOO....OG..',
        '.....OOWWWWWWWWWWWOOOOOOG..',
        '..OOOBBBCCCCCCCCBBBBOOOO...',
        '.OOBBBBCCCWRWWCCCBBBBBOO...',
        'OOBBBBBCCCWWWRCCCBBBBBBOO..',
        '.OOOOBBBBBGGGGGBBBBBBOOO...',
        '....OOBBBBBBBBBBBBBOO......',
        '....OOWWWO....OWWWOO.......',
        '...OOOOOO......OOOOOO......',
        '..CCCCCCCC....CCCCCCCC.....',
        '...........................',
        '...........................',
        '...........................'
      ]
    },

    // 6. 白骨夫人·尸魔（九幽森罗白骨高冠、六翼惨白肋骨披风、幽冥鬼火利爪、悬浮怨魂裙）
    white_bone_lady: {
      palette: { O: '#0f0c14', W: '#f8f9fa', C: '#80ffdb', P: '#7209b7', M: '#b5179e', H: '#240046' },
      p2Palette: { W: '#e0fbfc', C: '#00f5d4', P: '#ff0a54', M: '#f72585', H: '#10002b' },
      f0: [
        '......OCCCOOOOOOCCCO......',
        '.....OCWCOHHHHHHOCWCO.....',
        '....OOHHHHHHHHHHHHHHOO....',
        'WW..OHHWWWWWWWWWWWWHO..WW.',
        'OWWOHHWWWMOWWWOMWWWHHOOWWO',
        '.OWWOHWWWWWWWWWWWWWWHOWWO.',
        '..OOOHHPPPPPPPPPPPPPHOOO..',
        'WW.OOHPPPMMMMMMMMPPPPHOWW.',
        'OWWOHPPPMMWWWWWWMMMPPHOWWO',
        '.OOOOPPPMMMMMMMMMMPPPPOOO.',
        '...OOPPPPPPPPPPPPPPPPPOO..',
        '....OOPPPPMMMMMMPPPPPOO...',
        '.....OPPPP......PPPPO.....',
        '....OOHHH........HHHOO....',
        '...OCCCCC........CCCCCO...',
        '....CCCC..........CCCC....',
        '.....CC............CC.....'
      ],
      f1: [
        '.....OCCCOOOOOOOOCCCO.....',
        '....OCWCOHHHHHHHHOCWCO....',
        'WW..OOHHHHHHHHHHHHHHOO..WW',
        'OWW.OHHWWWWWWWWWWWWHO.OWWO',
        '.OWWOHWWWMOWWWOMWWWHHOWWO.',
        '..OOOHWWWWWWWWWWWWWWHHOO..',
        'WW..OOHHPPPPPPPPPPPHOO..WW',
        'OWWOOHPPPMMMMMMMMPPPPHOOWO',
        '.OOOOPPPMMWWWWWWMMMPPPPOO.',
        '...OOPPPPPPPPPPPPPPPPPOO..',
        '....OOPPPPMMMMMMPPPPPOO...',
        '.....OPPPP......PPPPO.....',
        '....OCCCCC......CCCCCO....',
        '.....CCCC........CCCC.....',
        '......CC..........CC......',
        '..........................',
        '..........................'
      ]
    },

    // 7. 黄袍怪·奎木狼星（二十八宿星官双角、青面獠牙、明黄星辰宝袍、舍利内丹+蘸钢大刀）
    yellow_robe_demon: {
      palette: { O: '#0f0c14', B: '#4ea8de', D: '#1d3557', Y: '#ffb703', G: '#ffd166', R: '#ff0a54', W: '#ffffff' },
      p2Palette: { B: '#00f5d4', D: '#240046', Y: '#ff5400', G: '#ffd60a', R: '#ff0a54' },
      f0: [
        '...OOO............OOO..WWWW',
        '..OBBBOOOOOOOOOOOOBBBOOWWWO',
        '..OBBBBGGGGGGGGGBBBBBO.OWWO',
        '.OBBBBBBBBBBBBBBBBBBBBO.OO.',
        '.OBBBBBRWBBBBBBBBRWBBBO.OG.',
        '.OBBBBBWWWWWWWWWWBBBBBO.OG.',
        '..OOBBWOOOOOOOOOOWBBOOOOOG.',
        '.OOYYYYYYGGGGGGYYYYYYOOOO..',
        'OOYYYYYYYGGGGGGYYYYYYYOO...',
        'OOYYYDDDDGGGGGGDDDDYYYOO...',
        'OOYYYYYYYGGGGGGYYYYYYYOO...',
        '.OOYYYYYYYYYYYYYYYYYYOO....',
        '..OOYYYYYY....YYYYYYOO.....',
        '..OOYYYYY......YYYYYOO.....',
        '...ODDDDO......ODDDDO......',
        '..OODDDDO......ODDDDOO.....',
        '..OOOOOOO......OOOOOOO.....'
      ],
      f1: [
        '...OOO............OOO...WWW',
        '..OBBBOOOOOOOOOOOOBBBO.OWWO',
        '..OBBBBGGGGGGGGGBBBBBO..OWO',
        '.OBBBBBBBBBBBBBBBBBBBBO.OO.',
        '.OBBBBBRWBBBBBBBBRWBBBO.OG.',
        '.OBBBBBWWWWWWWWWWBBBBBO.OG.',
        '..OOBBWOOOOOOOOOOWBBOOOOOG.',
        '.OOYYYYYYGGGGGGYYYYYYOOO...',
        'OOYYYYYYYGGGGGGYYYYYYYOO...',
        '.OOYYDDDDGGGGGGDDDDYYOO....',
        '..OOYYYYYYYYYYYYYYYYOO.....',
        '..OOYYYYYY....YYYYYYOO.....',
        '...ODDDDO......ODDDDO......',
        '..OOOOOOO......OOOOOOO.....',
        '...........................',
        '...........................',
        '...........................'
      ]
    },

    // 8. 金角大王 & 9. 银角大王（太上兜率独角金冠、紫金红葫芦/玉净瓶宝光、七星法剑）
    gold_silver_horn: {
      palette: { O: '#0f0c14', G: '#ffd166', R: '#ef233c', P: '#5a189a', S: '#90e0ef', W: '#ffffff', D: '#240046' },
      p2Palette: { G: '#ffd60a', R: '#ff0a54', P: '#7209b7', S: '#00f5d4', D: '#10002b' },
      f0: [
        '..........OGGGO...........',
        '.........OGWWWGO......RRR.',
        '........OGGGGGGO.....ORWRO',
        '......OOOGGGGGGGOOO..ORRRO',
        '.....OSSSSSSSSSSSSSO..OOO.',
        '....OSSRWOSSSSSORWSSO.OGG.',
        '....OSSSSSWWWWWWSSSSO..O..',
        '...OOPPPPPGGGGGGPPPPOOOO..',
        'WW.OPPPPRRRRRRRRRRPPPOO...',
        'WW.OPPPPGGGGGGGGGGPPPOO...',
        'OO..OPPPPRRRRRRRRPPPPOO...',
        '....OODDDDDGGGGDDDDDOO....',
        '....OODDDDDDDDDDDDDDOO....',
        '.....ODDDDD....DDDDDO.....',
        '.....OPPPPO....OPPPPO.....',
        '....OOPPPPO....OPPPPOO....',
        '....OOOOOOO....OOOOOOO....'
      ],
      f1: [
        '..........OGGGO........RRR',
        '.........OGWWWGO......ORWR',
        '........OGGGGGGO......ORRR',
        '......OOOGGGGGGGOOO....OOO',
        '.....OSSSSSSSSSSSSSO...OGG',
        '....OSSRWOSSSSSORWSSO...O.',
        '....OSSSSSWWWWWWSSSSOOOOO.',
        'WW.OOPPPPPGGGGGGPPPPOO....',
        'WW.OPPPPRRRRRRRRRRPPPOO...',
        'OO..OPPPGGGGGGGGGGPPPOO...',
        '....OODDDDDGGGGDDDDDOO....',
        '.....ODDDDD....DDDDDO.....',
        '.....OPPPPO....OPPPPO.....',
        '....OOOOOOO....OOOOOOO....',
        '..........................',
        '..........................',
        '..........................'
      ]
    },

    // 10. 圣婴大王·红孩儿（冲天烈焰双髻、金锁红绫战甲、丈八火尖枪、脚踏双三昧真火巨轮！）
    red_boy: {
      palette: { O: '#0f0c14', R: '#ef233c', F: '#ff5400', Y: '#ffd166', S: '#ffe5d9', W: '#ffffff', B: '#120d18' },
      p2Palette: { R: '#ff0a54', F: '#ff4800', Y: '#ffd60a', S: '#fff0f3', B: '#370617' },
      f0: [
        '...FF...........FF.....FF.',
        '..OOBBOO.......OOBBOO.FYYF',
        '.OBBRRBBOOOOOOOBBRRBBOFWWF',
        '..OOBSSSSSSSSSSSSBBOO..OO.',
        '...OSSRWOOSSSSOORWSSO..OY.',
        '...OSSSSSSSSSSSSSSSSO..OY.',
        '..FFOOSSRRRRRRRRSSOO...OY.',
        '.FFYOOSRRRRYYYYRRRRSOOOOO.',
        '..FFOOSRRRYYYYYYRRRSOO....',
        '....OOORRRRRRRRRRRROOO....',
        '.....OORRRRYYYYRRRROO.....',
        '.....OSSSO......OSSSO.....',
        '...FFYYYYOO....OOYYYYFF...',
        '..FFYYWWYYFF..FFYYWWYYFF..',
        '..FFYYYYYYFF..FFYYYYYYFF..',
        '...FFFFFFFF....FFFFFFFF...'
      ],
      f1: [
        '..FF.............FF....FF.',
        '..OOBBOO.......OOBBOO.FWWF',
        '.OBBRRBBOOOOOOOBBRRBBOFYYF',
        '..OOBSSSSSSSSSSSSBBOO..OO.',
        '...OSSRWOOSSSSOORWSSO..OY.',
        '...OSSSSSSSSSSSSSSSSO..OY.',
        '.FFYOOSSRRRRRRRRSSOOOOOOY.',
        '..FFOOSRRRRYYYYRRRRSOO....',
        '....OOSRRRYYYYYYRRRSOO....',
        '.....OORRRRRRRRRRRROO.....',
        '.....OSSSO......OSSSO.....',
        '..YYFFYYOO......OOYYFFYY..',
        '.FFYYWWYYFF....FFYYWWYYFF.',
        '..FFFFFFFF......FFFFFFFF..',
        '..........................',
        '..........................'
      ]
    },

    // 11. 黑水河鼍龙怪（猪婆鳄龙狰狞重首、玄铁水鳞重甲、九节竹节钢鞭、黑水怒涛）
    tuolong_dragon: {
      palette: { O: '#0f0c14', G: '#2d6a4f', L: '#52b788', Y: '#ffd166', R: '#ff0a54', W: '#ffffff', D: '#1b4332' },
      p2Palette: { G: '#0077b6', L: '#00f5d4', Y: '#ffd60a', R: '#ff0a54', D: '#03045e' },
      f0: [
        '..YYY............YYY...YYYY',
        '..OYYOOOOOOOOOOOOYYO...OYWO',
        '.OOGGGGGGGGGGGGGGGGOO..OYYO',
        'OGGGGLLLLGGGGLLLLGGGGO.OYWO',
        'OGGGLRWGGGGGGGGRWLGGGO.OYYO',
        'OGGGGGWWWWWWWWWWGGGGGO..OO.',
        '.OOGGGWOOOWWOOOWGGGGOOOOO..',
        '.OODDDDDDDYYYYDDDDDDDOO....',
        'OODDGGGGGGLLLLGGGGGGDDOO...',
        'OODDGGGGYYYYYYYYGGGGDDOO...',
        'OODDDDDDDDGGGGDDDDDDDDOO...',
        '.OOGGGGGGGYYYYGGGGGGGOO....',
        '..OOGGGGGG....GGGGGGOO.....',
        '...ODDDDDO....ODDDDDO......',
        '..OODDDDDO....ODDDDDOO.....',
        '..OOOOOOO......OOOOOOO.....'
      ],
      f1: [
        '..YYY............YYY....YYY',
        '..OYYOOOOOOOOOOOOYYO...OYWO',
        '.OOGGGGGGGGGGGGGGGGOO..OYYO',
        'OGGGGLLLLGGGGLLLLGGGGO.OYWO',
        'OGGGLRWGGGGGGGGRWLGGGO..OO.',
        'OGGGGGWWWWWWWWWWGGGGGOOOOO.',
        '.OODDDDDDDYYYYDDDDDDDOO....',
        'OODDGGGGGGLLLLGGGGGGDDOO...',
        'OODDGGGGYYYYYYYYGGGGDDOO...',
        '.OODDDDDDDGGGGDDDDDDDOO....',
        '..OOGGGGGG....GGGGGGOO.....',
        '...ODDDDDO....ODDDDDO......',
        '..OOOOOOO......OOOOOOO.....',
        '...........................',
        '...........................',
        '...........................'
      ]
    },

    // 12. 车迟国三仙（虎力/鹿力/羊力：九丈祈雨金冠、八卦杏黄道袍、五雷天心法剑）
    chechi_immortal: {
      palette: { O: '#0f0c14', Y: '#ffb703', G: '#ffd166', B: '#264653', R: '#e63946', W: '#ffffff', C: '#00f5d4' },
      p2Palette: { Y: '#ff5400', G: '#ffd60a', B: '#240046', R: '#ff0a54', C: '#80ffdb' },
      f0: [
        '...GGG............GGG...CC.',
        '..OGGGO..OOOOOO..OGGGO.CWWC',
        '...OOGGGGGGGGGGGGGGOO..CWCO',
        '...OOYYYYYYYYYYYYYYOO...OO.',
        '..OYYYRWOYYYYYYORWYYYO..OG.',
        '..OYYYYYYWWWWWWYYYYYYO..OG.',
        '.OOBBBBBBGGGGGGBBBBBBOOOOG.',
        'OOBBBBYYYRRRRRRYYYBBBBOO...',
        'OOBBBBYYRRWWWWWRRYYBBBOO...',
        'OOBBBBYYYYRRRRYYYYBBBBOO...',
        '.OOBBBBBBBBBBBBBBBBBBBOO...',
        '..OOYYYYYYGGGGYYYYYYOO.....',
        '...OOYYYYY....YYYYYOO......',
        '....OBBBBO....OBBBBO.......',
        '...OOBBBBO....OBBBBOO......',
        '...OOOOOOO....OOOOOOO......'
      ],
      f1: [
        '...GGG............GGG..CCC.',
        '..OGGGO..OOOOOO..OGGGOCWWCO',
        '...OOGGGGGGGGGGGGGGOO..CCO.',
        '...OOYYYYYYYYYYYYYYOO...OO.',
        '..OYYYRWOYYYYYYORWYYYO..OG.',
        '..OYYYYYYWWWWWWYYYYYYOOOOG.',
        '.OOBBBBBBGGGGGGBBBBBBOO....',
        'OOBBBBYYYRRRRRRYYYBBBBOO...',
        'OOBBBBYYRRWWWWWRRYYBBBOO...',
        '.OOBBBBBBBBBBBBBBBBBBBOO...',
        '..OOYYYYYY....YYYYYYOO.....',
        '....OBBBBO....OBBBBO.......',
        '...OOOOOOO....OOOOOOO......',
        '...........................',
        '...........................',
        '...........................'
      ]
    },

    // 13. 灵感大王·通天金鱼精（莲花池赤金龙鲤巨冠、寒冰护肩、九瓣赤铜双巨锤）
    inspiration_king: {
      palette: { O: '#0f0c14', R: '#f77f00', G: '#fcbf49', W: '#ffffff', C: '#48cae4', D: '#9d0208' },
      p2Palette: { R: '#ff0a54', G: '#ffd60a', C: '#00f5d4', D: '#370617' },
      f0: [
        '......OOGGGGGGGGOO....GGGG.',
        '....OORRRRRRRRRRRROO.OGWWGO',
        '..OOWWOORRRRRRRROOWWOOGGGGO',
        '.OWWWOORRRRRRRRRROOWWWOOOO.',
        '..OORRRRRWWWWWWWRRRRROO.OG.',
        '.OOCCCCCCGGGGGGCCCCCCOO.OG.',
        'OOCCCRRRRGGGGGGGRRRRCCOOOO.',
        'OOCCCRRRRGGGGGGGRRRRCCCOO..',
        'OOCCCRRRRRRRRRRRRRRRCCCOO..',
        '.OODDDDDDGGGGGGDDDDDDDOO...',
        '..OODDDDDDDDDDDDDDDDDOO....',
        '...OORRRRR....RRRRROO......',
        '....OCCCO......OCCCO.......',
        '...OOCCCO......OCCCOO......',
        '..CCCCCCC......CCCCCCC.....',
        '...........................'
      ],
      f1: [
        '......OOGGGGGGGGOO.....GGGG',
        '....OORRRRRRRRRRRROO..OGWWG',
        '..OOWWOORRRRRRRROOWWO.OGGGG',
        '.OWWWOORRRRRRRRRROOWWW.OOO.',
        '..OORRRRRWWWWWWWRRRRROO.OG.',
        '.OOCCCCCCGGGGGGCCCCCCOOOOO.',
        'OOCCCRRRRGGGGGGGRRRRCCCOO..',
        'OOCCCRRRRRRRRRRRRRRRCCCOO..',
        '.OODDDDDDGGGGGGDDDDDDDOO...',
        '...OORRRRR....RRRRROO......',
        '....OCCCO......OCCCO.......',
        '..CCCCCCC......CCCCCCC.....',
        '...........................',
        '...........................',
        '...........................',
        '...........................'
      ]
    },

    // 14. 独角兕大王·青牛精（擎天白玉犀牛巨角、金兜玄钢重铠、悬浮闪耀太上金刚琢！）
    single_horn_rhino: {
      palette: { O: '#0f0c14', B: '#3d5a80', L: '#98c1d9', W: '#ffffff', G: '#ffd60a', R: '#ff0a54', D: '#293241' },
      p2Palette: { B: '#1d3557', L: '#00f5d4', G: '#ffd60a', R: '#ff0a54', D: '#0f0c14' },
      f0: [
        '..........OWWWO......GGGGGG.',
        '.........OWWWWWO....GWWWWWWG',
        '........OWWLLWWWO...GWW..WWG',
        '......OOOBBBBBBBOOO.GWW..WWG',
        '....OOBBBBLLLLBBBBBO.GGGGGG.',
        '...OBBBBBRWBBBBBRWBBBO......',
        '...OBBBBBBBLLLLBBBBBBBO.....',
        '..OODDDDDDDGGGGDDDDDDDOO....',
        '.OODDBBBBBBGGGGGBBBBBBDDO...',
        'OODDBBBBGGGGGGGGGGGBBBBDDO..',
        'OODDDDDDDDDGGGGDDDDDDDDDDO..',
        '.OODDDDDDDDDDDDDDDDDDDDDO...',
        '..OOBBBBBBBGGGGGBBBBBBBOO...',
        '...ODDDDDD......DDDDDDO.....',
        '...ODDDDDO......ODDDDDO.....',
        '...OBBBBO........OBBBBO.....',
        '..OOBBBBO........OBBBBOO....',
        '..OOOOOOO........OOOOOOO....'
      ],
      f1: [
        '..........OWWWO.....GGGGGG..',
        '.........OWWWWWO...GWWWWWWG.',
        '........OWWLLWWWO..GWW..WWG.',
        '......OOOBBBBBBBOOO.GGGGGG..',
        '....OOBBBBLLLLBBBBBO........',
        '...OBBBBBRWBBBBBRWBBBO......',
        '...OBBBBBBBLLLLBBBBBBBO.....',
        '..OODDDDDDDGGGGDDDDDDDOO....',
        'OODDBBBBBBBGGGGGBBBBBBBDDO..',
        'OODDBBBBGGGGGGGGGGGBBBBDDO..',
        '.OODDDDDDDDGGGGDDDDDDDDDO...',
        '..OOBBBBBBBGGGGGBBBBBBBOO...',
        '...ODDDDDO......ODDDDDO.....',
        '..OOBBBBO........OBBBBOO....',
        '..OOOOOOO........OOOOOOO....',
        '............................',
        '............................',
        '............................'
      ]
    },

    // 15. 琵琶洞毒敌蝎子精（高悬丈二倒马毒桩巨蝎尾钩、紫晶蝎甲、玉琵琶）
    scorpion_queen: {
      palette: { O: '#0f0c14', P: '#9d4edd', M: '#e0aaff', R: '#ff0a54', G: '#ffd166', S: '#ffe5d9', D: '#3c096c' },
      p2Palette: { P: '#f72585', M: '#ff8fa3', R: '#ff0a54', G: '#ffd60a', D: '#240046' },
      f0: [
        '.RRR......OOGGGGOO..........',
        'ORRRO....ODDDDDDDDO.........',
        'ORRRO...OOSSSSSSSSOO...GGGG.',
        '.OO....OSSSSSSSSSSSSO.OGWWGO',
        '.ODDDO.OSSRWOOSSORWSOOGGGGGO',
        'ODDDDO..OOSSSSSSSSOO..OGGGO.',
        'ODDO...OOPPPPPPPPPPOO..OOO..',
        'ODDO..OOPPPMMMMMMPPPOO......',
        '.ODDDOOPPPPGGGGGGPPPPOO.....',
        '..OOOOPPPPPMMMMMMPPPPPOO....',
        '.....OOPPPPPPPPPPPPPPPOO....',
        '......OPPPPP....PPPPPO......',
        '.....OODDDO......ODDDOO.....',
        '....OODDDDO......ODDDDOO....',
        '....OOOOOOO......OOOOOOO....',
        '............................'
      ],
      f1: [
        '..RRR.....OOGGGGOO..........',
        '.ORRRO...ODDDDDDDDO.........',
        '.ORRRO..OOSSSSSSSSOO....GGGG',
        '..OO...OSSSSSSSSSSSSO..OGWWG',
        'ODDDO..OSSRWOOSSORWSO..OGGGG',
        '.ODDDDO.OOSSSSSSSSOO....OOO.',
        '..ODDO.OOPPPPPPPPPPOO.......',
        '...OO.OOPPPMMMMMMPPPOO......',
        '.....OOPPPPGGGGGGPPPPOO.....',
        '.....OOPPPPPPPPPPPPPPPOO....',
        '......OPPPPP....PPPPPO......',
        '.....OODDDO......ODDDOO.....',
        '....OOOOOOO......OOOOOOO....',
        '............................',
        '............................',
        '............................'
      ]
    },

    // 16. 六耳猕猴·假悟空（邪焰紫金魔冠、张扬赤芒六耳、暗紫战甲、随心铁杆神兵）
    six_eared_macaque: {
      palette: { O: '#0f0c14', P: '#7209b7', R: '#ff0a54', G: '#ffd60a', F: '#582f0e', S: '#d4a373', D: '#240046' },
      p2Palette: { P: '#b5179e', R: '#ff0a54', G: '#ffffff', F: '#370617', D: '#10002b' },
      f0: [
        '...RRO.....GGGG.....ORR..GGG',
        '..ORRPPOOOOPPPOOOOPPRRO..ORO',
        '.ROROOFFFFFFFFFFFFFFOOROR.O.',
        'RORROFFSSSFFFFFFSSSFFORRO.O.',
        '.ROROFFSRWFFFFFFRWSFFORO..O.',
        '..OOOFFSSSSSSSSSSSSFFOO..OG.',
        '...OOPPPDDDGGGGDDDPPPOOOOOG.',
        '..OOPPPDDPRRRRRRPDDPPPOO....',
        '.OOPPPPDDPRGGGGPRDDPPPPOO...',
        '..OOOPPPDDDDDDDDDDPPPOOO....',
        '.....OORRRRRRRRRRRROO.......',
        '....OOPPGGPPGGPPGGPPOO......',
        '....OOPPPP......PPPPOO......',
        '....ODDDDO......ODDDDO......',
        '...OODDDDO......ODDDDOO.....',
        '...OOOOOOO......OOOOOOO.....'
      ],
      f1: [
        '..RRO......GGGG......ORR..GG',
        '.ORRPPOOOOOPPPOOOOOPPRRO.ORO',
        '.ROROOFFFFFFFFFFFFFFOOROR.O.',
        'RORROFFSSSFFFFFFSSSFFORRO.O.',
        '.ROROFFSRWFFFFFFRWSFFORO..O.',
        '..OOOFFSSSSSSSSSSSSFFOOOOOG.',
        '...OOPPPDDDGGGGDDDPPPOOO....',
        '..OOPPPDDPRRRRRRPDDPPPOO....',
        '..OOOPPPDDDDDDDDDDPPPOOO....',
        '.....OORRRRRRRRRRRROO.......',
        '....OOPPGGPPGGPPGGPPOO......',
        '....ODDDDO......ODDDDO......',
        '...OOOOOOO......OOOOOOO.....',
        '............................',
        '............................',
        '............................'
      ]
    },

    // 17. 铁扇公主·罗刹女（翠云九凤金冠、罗刹绯红战袍、擎天翠绿太阴芭蕉巨扇！）
    iron_fan_princess: {
      palette: { O: '#0f0c14', R: '#d62828', G: '#06d6a0', L: '#80ffdb', Y: '#ffd166', S: '#ffe5d9', D: '#6a040f' },
      p2Palette: { R: '#ff0a54', G: '#00f5d4', L: '#ffffff', Y: '#ffd60a', D: '#370617' },
      f0: [
        '.....OOYYYYYYYYOO...GGGGGG..',
        '....OODDDDDDDDDDOO.GLLLLLLG.',
        '...OOSSSSSSSSSSSSOOGLLGGLLGO',
        '...OSSRWOOSSSSORWSOGLLGGLLGO',
        '....OOSSSSSSSSSSOO.GGGGGGGGO',
        '..OORRRRRYYYYRRRRROO.OOOOO..',
        '.OORRRRDDDDDDDDRRRRO..OYO...',
        'OORRRRDDDDYYYYDDDRRROOOYO...',
        '.OORRRRRYYYYYYYYRRRROO......',
        '..OORRRRRRRRRRRRRRROO.......',
        '...OORRRRDDDDDDRRRROO.......',
        '....ORRRR......RRRRO........',
        '....ODDDO......ODDDO........',
        '...OODDDO......ODDDOO.......',
        '...OOOOOO......OOOOOO.......'
      ],
      f1: [
        '.....OOYYYYYYYYOO....GGGGGG.',
        '....OODDDDDDDDDDOO..GLLLLLLG',
        '...OOSSSSSSSSSSSSOO.GLLGGLLG',
        '...OSSRWOOSSSSORWSO.GLLGGLLG',
        '....OOSSSSSSSSSSOO..GGGGGGGG',
        '..OORRRRRYYYYRRRRROO..OOOOO.',
        '.OORRRRDDDDDDDDRRRRO...OYO..',
        '.OORRRRRYYYYYYYYRRRROOOOYO..',
        '..OORRRRRRRRRRRRRRROO.......',
        '....ORRRR......RRRRO........',
        '....ODDDO......ODDDO........',
        '...OOOOOO......OOOOOO.......',
        '............................',
        '............................',
        '............................'
      ]
    },

    // 18. 平天大圣·大力牛魔王（30x21 巨岳魔尊：弯月擎天双白角、黄金兽吞重铠、混铁巨棍、熔火披风）
    bull_demon_king: {
      palette: { O: '#0f0c14', W: '#fff3b0', R: '#9d0208', D: '#2b0909', G: '#ffba08', F: '#ff4800' },
      p2Palette: { W: '#ffffff', R: '#ff0a54', D: '#1a0005', G: '#ffd60a', F: '#ff5400' },
      f0: [
        'WWW....................WWW....',
        'WWWWOO..............OOWWWW.GGG',
        '.OWWWWOOOOOOOOOOOOOOWWWWO.GFFG',
        '..OOWWWDDDDDDDDDDDDWWWO..GFFFG',
        '...OODDDGGGGGGGGGGDDDOO...GGGO',
        '..ODDDDRRRRRRRRRRRRDDDDO...OO.',
        '.ODDDDRFWWRDDDDRFWWRDDDO...OO.',
        '.ODDDDRRRRRRRRRRRRRRDDDO...OO.',
        '.OODDDDWWGGGGGGGGWWDDDDO...OO.',
        'OODGGGGGGGGGGGGGGGGGGGGDOOOOO.',
        'ODRGGGGGGFFFFFFFFGGGGGGGRDOO..',
        'ODRRRRGGGGGGGGGGGGGGGRRRRRDO..',
        'ODRRRRRRGGGGGGGGGGRRRRRRRRDO..',
        'OODDDDDDDDGGGGGGDDDDDDDDDDOO..',
        '.OODDDDDDDDDDDDDDDDDDDDDDOO...',
        '..ODDDDDDD........DDDDDDDO....',
        '..ODDDDDD..........DDDDDDO....',
        '..ORRRRRO..........ORRRRRO....',
        '.OORRRRRO..........ORRRRROO...',
        '.OOGGGGGO..........OGGGGGOO...',
        '.OOOOOOOO..........OOOOOOOO...'
      ],
      f1: [
        'WWW....................WWW....',
        'WWWWOO..............OOWWWW..GG',
        '.OWWWWOOOOOOOOOOOOOOWWWWO..GFG',
        '..OOWWWDDDDDDDDDDDDWWWO...GFFG',
        '...OODDDGGGGGGGGGGDDDOO....GGO',
        '..ODDDDRRRRRRRRRRRRDDDDO...OO.',
        '.ODDDDRFWWRDDDDRFWWRDDDO...OO.',
        '.ODDDDRRRRRRRRRRRRRRDDDO...OO.',
        'OODGGGGGGGGGGGGGGGGGGGGDOOOOO.',
        'ODRGGGGGGFFFFFFFFGGGGGGGRDOO..',
        'ODRRRRGGGGGGGGGGGGGGGRRRRRDO..',
        'OODDDDDDDDGGGGGGDDDDDDDDDDOO..',
        '.OODDDDDDDDDDDDDDDDDDDDDDOO...',
        '..ODDDDDD..........DDDDDDO....',
        '.OORRRRRO..........ORRRRROO...',
        '.OOGGGGGO..........OGGGGGOO...',
        '.OOOOOOOO..........OOOOOOOO...',
        '..............................',
        '..............................',
        '..............................',
        '..............................'
      ]
    },

    // 19. 九头虫·九头驸马（怒张九首妖冠、血色双鹏翼、碧波银鳞甲、月牙宝铲）
    nine_headed_bug: {
      palette: { O: '#0f0c14', R: '#e63946', C: '#00f5d4', W: '#f8f9fa', M: '#adb5bd', D: '#1d3557', Y: '#ffd166' },
      p2Palette: { R: '#ff0a54', C: '#80ffdb', W: '#ffffff', M: '#00bbf9', D: '#240046', Y: '#ffd60a' },
      f0: [
        '.RRO..RRO..RRRO..RRO..RRO.WWW',
        'ORRROORRROORRRROORRROORRROWWO',
        'ORWROORWROORWWROORWROORWRO.OO',
        '.OOOOOOOOOOOOOOOOOOOOOOOO..O.',
        'RR.OODDDDDDRRRDDDDDDOO.RR..O.',
        'ORRODDBBBRWDDDRWBBBDDORRO..O.',
        'ORROOODDDDDDDDDDDDDDOOORROOO.',
        '.OO.OOWWWWWYYYYWWWWWOO.OO....',
        '....OOWWWMMMYYYYMMMWWWOO.....',
        '....OOWWWWWYYYYWWWWWWWOO.....',
        '.....OODDDDDDDDDDDDDDOO......',
        '.....OODDDDD....DDDDDOO......',
        '......ODDDDO....ODDDDO.......',
        '.....OORRRO......ORRROO......',
        '.....OOOOOO......OOOOOO......'
      ],
      f1: [
        'RRO..RRO..RRRRO..RRO..RRO..WW',
        'ORRROORRROORRRROORRROORRROWWO',
        '.OOOOOOOOOOOOOOOOOOOOOOOO..OO',
        'RROOODDDDDDRRRDDDDDDOOORRO.O.',
        'ORRODDBBBRWDDDRWBBBDDORRO..O.',
        '.OOOOODDDDDDDDDDDDDDOOOOOOOO.',
        '....OOWWWWWYYYYWWWWWOO.......',
        '....OOWWWMMMYYYYMMMWWWOO.....',
        '.....OODDDDDDDDDDDDDDOO......',
        '......ODDDDO....ODDDDO.......',
        '.....OOOOOO......OOOOOO......',
        '.............................',
        '.............................',
        '.............................',
        '.............................'
      ]
    },

    // 20. 黄眉大王·小雷音老佛（垂肩长黄眉、伪佛金身肉髻、金铙+后天人种袋+短软狼牙棒）
    yellow_brow_king: {
      palette: { O: '#0f0c14', Y: '#ffd60a', G: '#f4a261', S: '#ffe5d9', R: '#d62828', W: '#ffffff', P: '#7209b7' },
      p2Palette: { Y: '#ffd60a', G: '#ff5400', S: '#ffd166', R: '#ff0a54', P: '#b5179e' },
      f0: [
        '.......OOOOOOOOOO.....YYYY.',
        '.....OOYYYYYYYYYYOO..OYWWYO',
        '....OOSSSSSSSSSSSSOO.OYYYYO',
        '..OOYYYYYSSOSSYYYYYYO.OYWO.',
        '.OYYYYYSROSSSSORSYYYYO.OO..',
        '.OYYYSSSSSSSSSSSSSSYYYO.O..',
        '.OYY..OOSSSSSSSSOO..YYO.O..',
        '..OO.OORRRRRYYYYRRRROOOOO..',
        '.PPPOORRRYYYYYYYYYYRRRRO...',
        'OPPPOORRRYYPPPPPPYYRRRRO...',
        '.OO.OORRRRRYYYYYYYYRRRRO...',
        '....OORRRRRRRRRRRRRRRROO...',
        '.....OOYYYYYY....YYYYYOO...',
        '......ORRRRO......ORRRRO...',
        '.....OORRRRO......ORRRROO..',
        '.....OOOOOOO......OOOOOOO..'
      ],
      f1: [
        '.......OOOOOOOOOO......YYYY',
        '.....OOYYYYYYYYYYOO...OYWWY',
        '....OOSSSSSSSSSSSSOO..OYYYY',
        '..OOYYYYYSSOSSYYYYYYO..OO..',
        '.OYYYYYSROSSSSORSYYYYO..O..',
        '.OYYYSSSSSSSSSSSSSSYYYO.O..',
        '..OO.OORRRRRYYYYRRRROOOOO..',
        'OPPPOORRRYYYYYYYYYYRRRRO...',
        '.PPPOORRRYYPPPPPPYYRRRRO...',
        '....OORRRRRRRRRRRRRRRROO...',
        '.....OOYYYYYY....YYYYYOO...',
        '......ORRRRO......ORRRRO...',
        '.....OOOOOOO......OOOOOOO..',
        '...........................',
        '...........................',
        '...........................'
      ]
    },

    // 21. 七绝山红鳞大蟒（盘山血鳞巨蟒王、灯笼双瞳、分叉毒枪信子、层叠盘山蟒躯）
    red_python_demon: {
      palette: { O: '#0f0c14', R: '#d90429', L: '#ef233c', Y: '#ffd166', W: '#ffffff', D: '#6a040f' },
      p2Palette: { R: '#ff0a54', L: '#ff4800', Y: '#00f5d4', D: '#2b0909' },
      f0: [
        '......OOOOOOOOOOOOOO........',
        '....OORRRRRRRRRRRRRROO......',
        '...ORRLLLLLLYYYYLLLLLRRO....',
        '..ORRLLYYWOOLLLLOOYWLLRRO...',
        '..ORRRRWWWWWWWWWWWWWWRRROYYY',
        '...OODDDDDDRRRRRRDDDDDOOY..Y',
        '....OORRRRRYYYYYYRRRRROO...Y',
        '...OORRRRRLLLLLLLLRRRRROO...',
        '..OODDRRRRRRYYYYRRRRRRDDOO..',
        '.OODDRRRRRLLLLLLLLRRRRRDDOO.',
        'OODDRRRRRRYYYYYYYYRRRRRRDDOO',
        'OODDDDDDDDDDDDDDDDDDDDDDDDOO',
        '.OOOOOOOOOOOOOOOOOOOOOOOOOO.'
      ],
      f1: [
        '......OOOOOOOOOOOOOO........',
        '....OORRRRRRRRRRRRRROO......',
        '...ORRLLLLLLYYYYLLLLLRRO....',
        '..ORRLLYYWOOLLLLOOYWLLRROYY.',
        '..ORRRRWWWWWWWWWWWWWWRRROY.Y',
        '...OODDDDDDRRRRRRDDDDDOO....',
        '...OORRRRRLLLLLLLLRRRRROO...',
        '.OODDRRRRRRYYYYRRRRRRDDOO...',
        'OODDRRRRRLLLLLLLLRRRRRDDOO..',
        'OODDDDDDDDDDDDDDDDDDDDDDDDOO',
        '.OOOOOOOOOOOOOOOOOOOOOOOOOO.',
        '............................',
        '............................'
      ]
    },

    // 22. 赛太岁·金毛犼（麒麟金鬃、项挂三枚喷火烟沙紫阳金铃、宣花巨斧）
    sai_taisui: {
      palette: { O: '#0f0c14', G: '#ffb703', Y: '#ffd60a', R: '#ff4800', P: '#7209b7', W: '#ffffff', D: '#3c096c' },
      p2Palette: { G: '#ff5400', Y: '#ffd60a', R: '#ff0a54', P: '#b5179e', D: '#240046' },
      f0: [
        '..OOO...OOOOOOOOOO...OOO.RRRR',
        '.OGGGOOGGGGGGGGGGGGOOGGGORWWR',
        '.OGGGGGGGGGYYYYGGGGGGGGGOORRO',
        'OGGGGGRWGGGGGGGGGGGRWGGGGO.O.',
        'OGGGGGGGWWWWWWWWWWGGGGGGGO.O.',
        '.OOGGGYYOOYYOOYYOOYYGGGGOOOO.',
        '.OOPPPPPPPYYYYYYPPPPPPPOO....',
        'OOPPPPYYYGGGGGGGGYYYPPPPOO...',
        'OOPPPPRRRYYYYYYYYRRRPPPPOO...',
        '.OOPPPPPPPPPPPPPPPPPPPPOO....',
        '..OOGGGGGGGYYYYGGGGGGGOO.....',
        '...ODDDDDD......DDDDDDO......',
        '...OGGGGGO......OGGGGGO......',
        '..OOGGGGGO......OGGGGGOO.....',
        '..OOOOOOOO......OOOOOOOO.....'
      ],
      f1: [
        '..OOO...OOOOOOOOOO...OOO..RRR',
        '.OGGGOOGGGGGGGGGGGGOOGGGO.RWR',
        '.OGGGGGGGGGYYYYGGGGGGGGGO.ORO',
        'OGGGGGRWGGGGGGGGGGGRWGGGGO.O.',
        'OGGGGGGGWWWWWWWWWWGGGGGGGOOO.',
        '.OOGGGYYOOYYOOYYOOYYGGGGOO...',
        'OOPPPPYYYGGGGGGGGYYYPPPPOO...',
        'OOPPPPRRRYYYYYYYYRRRPPPPOO...',
        '.OOPPPPPPPPPPPPPPPPPPPPOO....',
        '...ODDDDDD......DDDDDDO......',
        '..OOGGGGGO......OGGGGGOO.....',
        '..OOOOOOOO......OOOOOOOO.....',
        '.............................',
        '.............................',
        '.............................'
      ]
    },

    // 23. 盘丝洞七蜘蛛精·七情蛛母（蛛后银冠、八根巨型剃刀紫晶蛛矛腿、吐丝毒囊）
    spider_matriarch: {
      palette: { O: '#0f0c14', P: '#7209b7', M: '#f72585', W: '#f8f9fa', C: '#80ffdb', S: '#ffe5d9', D: '#240046' },
      p2Palette: { P: '#b5179e', M: '#ff0a54', W: '#ffffff', C: '#00f5d4', D: '#10002b' },
      f0: [
        '........OOWWWWWWOO..........',
        '......OOMMMMMMMMMMOO........',
        '.....OOSSSSSSSSSSSSOO.......',
        'OO...OSSRWOOSSSOORWSO...OO..',
        '.OO...OOSSSSSSSSSSOO...OO...',
        '..OO.OOPPPWWWWWWPPPOO.OO....',
        'OO.OOOPPPMMMMMMMMPPPOOO..OO.',
        '.OO..OPPPPDDDDDDPPPPOO..OO..',
        '...OOOPPPPMMMMMMPPPPOOO.....',
        '..OO..OOPPPPPPPPPPOO..OO....',
        '.OO.OO..OOPPPPPPOO..OO.OO...',
        'OO..O.....OO..OO.....O..OO..',
        'O.........OO..OO.........O..'
      ],
      f1: [
        '........OOWWWWWWOO..........',
        '......OOMMMMMMMMMMOO........',
        'OO...OOSSSSSSSSSSSSOO...OO..',
        '.OO..OSSRWOOSSSOORWSO..OO...',
        '..OO..OOSSSSSSSSSSOO..OO....',
        'OO..OOOPPPWWWWWWPPPOOO..OO..',
        '.OO..OPPPMMMMMMMMPPPOO..OO..',
        '...OOOPPPPDDDDDDPPPPOOO.....',
        '..OO..OOPPPPPPPPPPOO..OO....',
        '.OO..OO.OOPPPPPPOO.OO..OO...',
        'OO..O.....OO..OO.....O..OO..',
        '..........OO..OO............',
        '............................'
      ]
    },

    // 24. 百眼魔君·多目蜈蚣精（蜈蚣赤钳毒冠、两肋大张千眼金光阵、百节重剑）
    hundred_eyed_lord: {
      palette: { O: '#0f0c14', R: '#9d0208', G: '#ffd60a', Y: '#ffba08', D: '#2b0909', W: '#ffffff', P: '#5a189a' },
      p2Palette: { R: '#ff0a54', G: '#ffffff', Y: '#ffd60a', D: '#1a0005', P: '#b5179e' },
      f0: [
        '.RRR................RRR..WWW',
        '..RRRO..OOOOOOOO..ORRRO..OWO',
        '...OOOODDDDDDDDDDOOOO....OO.',
        '....ODDDDRWDDDDRWDDDO....OY.',
        '....ODDDDDDDDDDDDDDDO....OY.',
        '..OOGGGGGGGGGGGGGGGGGOOOOOY.',
        '.OOGWGYGWGYGWGYGWGYGWGOOO...',
        'OOGYGWGYGWGYGWGYGWGYGYGOO...',
        'OOGWGYGWGYGWGYGWGYGWGYGOO...',
        '.OOGGGGGGGGGGGGGGGGGGGOO....',
        '..OOPPPPPPRRRRRRPPPPPOO.....',
        '...ODDDDDDRRRRRRDDDDDO......',
        '...ODDDDD........DDDDO......',
        '..OODDDDO........ODDDDO.....',
        '..OOOOOOO........OOOOOO.....'
      ],
      f1: [
        '..RRR..............RRR...WWW',
        '...RRRO.OOOOOOOO.ORRRO...OWO',
        '...OOOODDDDDDDDDDOOOO....OO.',
        '....ODDDDRWDDDDRWDDDO....OY.',
        '..OOGGGGGGGGGGGGGGGGGOOOOOY.',
        'OOGYGWGYGWGYGWGYGWGYGYGOO...',
        'OOGWGYGWGYGWGYGWGYGWGYGOO...',
        '.OOGYGWGYGWGYGWGYGWGYGOO....',
        '..OOPPPPPPRRRRRRPPPPPOO.....',
        '...ODDDDDDRRRRRRDDDDDO......',
        '..OODDDDO........ODDDDO.....',
        '..OOOOOOO........OOOOOO.....',
        '............................',
        '............................',
        '............................'
      ]
    },

    // 25. 狮驼岭·青狮白象王（擎天雪白卷云巨象鼻、丈二双白象牙、狮驼重装战铠、卷云神枪）
    white_elephant_king: {
      palette: { O: '#0f0c14', W: '#f8f9fa', L: '#ced4da', G: '#ffd166', B: '#4ea8de', R: '#ff0a54', D: '#1d3557' },
      p2Palette: { W: '#ffffff', L: '#90e0ef', G: '#ffd60a', B: '#00f5d4', R: '#ff0a54', D: '#03045e' },
      f0: [
        '..OOOOOO........OOOOOO..GGGG',
        '.OWWWWWWO......OWWWWWWO.OGWO',
        'OWWWLLLLOOOOOOOOLLLLWWWO.GGO',
        'OWWWLWWWWRWWWWWRWWWWLWWO..O.',
        'OWWWLLLLWWWWWWWWLLLLWWWO..O.',
        '.OOWWWGGWWLLLLWWGGWWWOO...O.',
        '.OOGGGWWWWWLLLLWWWWGGGOOOOO.',
        '..OOBBBBBBBLLLLBBBBBBBOO....',
        '.OOBBBBGGGGLLLLGGGGBBBBOO...',
        'OOBBBBBGGGGLLLLGGGGBBBBBBOO.',
        '.OOBBBBBBBBBLLLBBBBBBBBBOO..',
        '..OODDDDDDDDLLLDDDDDDDDOO...',
        '...OODDDDDDDDDDDDDDDDDOO....',
        '....OWWWWW......WWWWWO......',
        '....ODDDDO......ODDDDO......',
        '...OODDDDO......ODDDDOO.....',
        '...OOOOOOO......OOOOOOO.....'
      ],
      f1: [
        '..OOOOOO........OOOOOO...GGG',
        '.OWWWWWWO......OWWWWWWO..OGW',
        'OWWWLLLLOOOOOOOOLLLLWWWO..OO',
        'OWWWLWWWWRWWWWWRWWWWLWWO..O.',
        '.OOWWWGGWWLLLLWWGGWWWOO...O.',
        '.OOGGGWWWWWLLLLWWWWGGGOOOOO.',
        '.OOBBBBGGGGLLLLGGGGBBBBOO...',
        'OOBBBBBGGGGLLLLGGGGBBBBBBOO.',
        '..OODDDDDDDDLLLDDDDDDDDOO...',
        '....OWWWWW......WWWWWO......',
        '...OODDDDO......ODDDDOO.....',
        '...OOOOOOO......OOOOOOO.....',
        '............................',
        '............................',
        '............................',
        '............................',
        '............................'
      ]
    },

    // 26. 云程万里·金翅大鹏雕（遮天黄金巨鹏双翼、金钩神喙、阴阳二气瓶、方天画戟）
    golden_wing_peng: {
      palette: { O: '#0f0c14', G: '#ffd60a', Y: '#f48c06', R: '#d90429', W: '#ffffff', D: '#22223b' },
      p2Palette: { G: '#ffffff', Y: '#ffd60a', R: '#ff0a54', D: '#10002b' },
      f0: [
        'GGG........OOOOOOOO........GGG',
        'GGGYO....OOGGGGGGGGOO....OYGGG',
        'OGGGYO..OGGGGGGGGGGGGO..OYGGGO',
        'OGGGGYOOGGGGRWGGWRGGGGOOYGGGGO',
        '.OGGGGYGGGGGGWWWWGGGGGGYGGGGO.',
        '..OGGGYYGGGRRRRRRRRGGGYYGGGO..',
        '...OOGGYYDDRRRRRRRRDDYYGGOO...',
        '....OOODDDDGGGGGGGGDDDDOOO....',
        '.....OODDDDGGGGGGGGDDDDOO.....',
        '.....OODDDDRRRRRRRRDDDDOO.....',
        '......OOYYYY......YYYYOO......',
        '.......OYYYO......OYYYO.......',
        '......OOGGGO......OGGGOO......',
        '......OOOOOO......OOOOOO......'
      ],
      f1: [
        '...........OOOOOOOO...........',
        'GGG......OOGGGGGGGGOO......GGG',
        'GGGYYO..OGGGGGGGGGGGGO..OYYGGG',
        'OGGGGYOOGGGGRWGGWRGGGGOOYGGGGO',
        '.OOYYYYGGGGGGWWWWGGGGGGYYYYOO.',
        '...OOGGYYDDRRRRRRRRDDYYGGOO...',
        '....OOODDDDGGGGGGGGDDDDOOO....',
        '.....OODDDDRRRRRRRRDDDDOO.....',
        '......OOYYYY......YYYYOO......',
        '......OOGGGO......OGGGOO......',
        '......OOOOOO......OOOOOO......',
        '..............................',
        '..............................',
        '..............................'
      ]
    },

    // 27. 九灵元圣·九头狮祖（环绕周天九颗金青太乙圣狮首、万妖祖翁帝袍）
    nine_spirit_saint: {
      palette: { O: '#0f0c14', G: '#ffd166', C: '#00f5d4', P: '#5a189a', B: '#3c096c', W: '#ffffff', Y: '#f4a261' },
      p2Palette: { G: '#ffd60a', C: '#80ffdb', P: '#7209b7', B: '#10002b', Y: '#ff9f1c' },
      f0: [
        '..GGG..GGG..GGGG..GGG..GGG..',
        '.OGGGOOGGGOOGGGGOOGGGOOGGGO.',
        'OGCWCGOGCWCGOGWWGOGCWCGOGCWC',
        'OGGGGGOGGGGGOGGGGOGGGGGOGGGG',
        '.OOOOOOOOOOOOOOOOOOOOOOOOOO.',
        '..OOYYYYYYGGGGGGGGYYYYYYOO..',
        '..OYYYCWYYYYYYYYYYYYWCYYYO..',
        '..OYYYYYYWWWWWWWWWWYYYYYYO..',
        '.OOPPPPPPPGGGGGGGGPPPPPPPOO.',
        'OOPPPPCCCCCCCCCCCCCCCCPPPPOO',
        'OOPPPPCCCCGGGGGGGGCCCCPPPPOO',
        '.OOPPPPPPPGGGGGGGGPPPPPPPOO.',
        '..OOBBBBBBBBBBBBBBBBBBBBOO..',
        '...OOYYYYY........YYYYYOO...',
        '....OYYYYO........OYYYYO....',
        '...OOGGGGO........OGGGGOO...',
        '...OOOOOOO........OOOOOOO...'
      ],
      f1: [
        '.GGG..GGG...GGGG...GGG..GGG.',
        'OGGGOOGGGO.OGGGGO.OGGGOOGGGO',
        'OGCWCGOGCWGOGWWGOGWCGOGCWCGO',
        '.OOOOOOOOOOOOOOOOOOOOOOOOOO.',
        '..OOYYYYYYGGGGGGGGYYYYYYOO..',
        '..OYYYCWYYYYYYYYYYYYWCYYYO..',
        '.OOPPPPPPPGGGGGGGGPPPPPPPOO.',
        'OOPPPPCCCCCCCCCCCCCCCCPPPPOO',
        '.OOPPPPPPPGGGGGGGGPPPPPPPOO.',
        '..OOBBBBBBBBBBBBBBBBBBBBOO..',
        '....OYYYYO........OYYYYO....',
        '...OOOOOOO........OOOOOOO...',
        '............................',
        '............................',
        '............................',
        '............................',
        '............................'
      ]
    },

    // 28. 广寒捣药·天竺玉兔精（修长雪白兔耳、天竺孔雀金冠、霓裳羽衣、捣药玄玉杵）
    jade_rabbit: {
      palette: { O: '#0f0c14', W: '#ffffff', P: '#ff8fa3', M: '#ff4d6d', G: '#ffd166', C: '#80ffdb', D: '#5a189a' },
      p2Palette: { W: '#fff0f3', P: '#ff4d6d', M: '#ff0a54', G: '#ffd60a', C: '#00f5d4', D: '#240046' },
      f0: [
        '.....OWWWO........OWWWO.....',
        '.....OWPWO........OWPWO.....',
        '.....OWPWOOOOOOOOOOPWPO..CCC',
        '.....OWWWWGGGGGGGGWWWWO.CWWC',
        '....OWWWWMWWWWWWWMWWWWO.CWCO',
        '....OWWWWWWWWWWWWWWWWWO..OO.',
        '.....OOWWWWWWWWWWWWWOO...OG.',
        '...OOPPPPPGGGGGGGGPPPPOOOOG.',
        '..OOPPPPMMMMMMMMMMMMPPPPOO..',
        '..OOPPPPWWWWGGGGWWWWPPPPOO..',
        '...OOODDDDDDDDDDDDDDDDOOO...',
        '.....OOPPPP......PPPPOO.....',
        '......OWWWO......OWWWO......',
        '.....OOWWWO......OWWWOO.....',
        '.....OOOOOO......OOOOOO.....'
      ],
      f1: [
        '....OWWWO..........OWWWO....',
        '....OWPWO..........OWPWO..CC',
        '.....OWPWOOOOOOOOOOPWPO..CWC',
        '.....OWWWWGGGGGGGGWWWWO..OO.',
        '....OWWWWMWWWWWWWMWWWWO..OG.',
        '.....OOWWWWWWWWWWWWWOOOOOOG.',
        '...OOPPPPPGGGGGGGGPPPPOO....',
        '..OOPPPPMMMMMMMMMMMMPPPPOO..',
        '...OOODDDDDDDDDDDDDDDDOOO...',
        '......OWWWO......OWWWO......',
        '.....OOOOOO......OOOOOO.....',
        '............................',
        '............................',
        '............................',
        '............................'
      ]
    },

    // 29. 通天河·千年翻江老鼋（第八十一难镇守巨兽：山岳级九宫八卦龟甲、苍龙老鼋首、翻江海啸）
    ancient_turtle: {
      palette: { O: '#0f0c14', G: '#2d6a4f', L: '#52b788', Y: '#ffd166', C: '#48cae4', W: '#ffffff', D: '#1b4332' },
      p2Palette: { G: '#0077b6', L: '#00f5d4', Y: '#ffd60a', C: '#90e0ef', D: '#03045e' },
      f0: [
        '........OOOOOOOOOOOOOO........',
        '......OOGGGGGGGGGGGGGGOO......',
        '....OOGGGGYYYYYYYYGGGGGOO.....',
        '..OOGGGLLLLGGGGGGLLLLGGGOOOOO.',
        '.OGGGGGYYYYGGGGGGYYYYGGGCWGGGO',
        'OGGLLLLGGGGYYYYYYGGGGLLGWWWWGO',
        'OGGGGGGYYYYGGGGGGYYYYGGGGGGGOO',
        'OODDDDDDDDDGGGGGGDDDDDDDDDDOO.',
        '.OODDDDDDDDDDDDDDDDDDDDDDOO...',
        '..OOGGGGGG........GGGGGGOO....',
        '.OOCCGGGG..........GGGGCCOO...',
        'CCCCWWWWCCCCCCCCCCCCWWWWCCCCCC',
        '.CCCCCCCCCCCCCCCCCCCCCCCCCCCC.',
        '..CCCCWWWWCCCCCCCCWWWWCCCCCC..'
      ],
      f1: [
        '........OOOOOOOOOOOOOO........',
        '......OOGGGGGGGGGGGGGGOO......',
        '....OOGGGGYYYYYYYYGGGGGOO.....',
        '..OOGGGLLLLGGGGGGLLLLGGGOOOOO.',
        '.OGGGGGYYYYGGGGGGYYYYGGGCWGGGO',
        'OGGLLLLGGGGYYYYYYGGGGLLGWWWWGO',
        'OODDDDDDDDDGGGGGGDDDDDDDDDDOO.',
        '..OOGGGGGG........GGGGGGOO....',
        'WWWWCCCCCCCCWWWWCCCCCCCCWWWWCC',
        '.CCCCCCCCCCCCCCCCCCCCCCCCCCCC.',
        '..CCCCCCCCCCCCCCCCCCCCCCCCCC..',
        '..............................',
        '..............................',
        '..............................'
      ]
    },

    // 30. 乌鸡国·青毛狮子王（新增独立母版：怒张青金狮鬃、篡位帝冕、冷艳锯两刃巨刀）
    azure_lion_king: {
      palette: { O: '#0f0c14', T: '#00b4d8', C: '#90e0ef', Y: '#ffd166', R: '#ff0a54', D: '#1d3557', W: '#ffffff' },
      p2Palette: { T: '#00f5d4', C: '#ffffff', Y: '#ffd60a', R: '#ff0a54', D: '#240046' },
      f0: [
        '....OOYYYYYYYYYYYYOO....WWWW',
        '..OOTTTTTTTTTTTTTTTTOO..OWWO',
        '.OOTTCCCCTTTTTTCCCCTTOO.OWWO',
        'OOTTTTRWTTTTTTTTTRWTTTTO.OO.',
        'OTTTTTTTWWWWWWWWTTTTTTTO.OY.',
        'OTTTTTTWOOOWWOOOWTTTTTTO.OY.',
        '.OOTTTTTTTTTTTTTTTTTTTOOOOY.',
        '.OODDDDDDYYYYYYDDDDDDDOOO...',
        'OODDTTTTTYYYYYYTTTTTTDDDO...',
        'OODDTTTYYYYRRYYYYTTTTDDDO...',
        '.OODDDDDDDDDDDDDDDDDDDDO....',
        '..OOTTTTTTYYYYTTTTTTTOO.....',
        '...OTTTTT......TTTTTO.......',
        '...ODDDDO......ODDDDO.......',
        '..OODDDDO......ODDDDOO......',
        '..OOOOOOO......OOOOOOO......'
      ],
      f1: [
        '....OOYYYYYYYYYYYYOO.....WWW',
        '..OOTTTTTTTTTTTTTTTTOO...OWW',
        '.OOTTCCCCTTTTTTCCCCTTOO..OWO',
        'OOTTTTRWTTTTTTTTTRWTTTTO..O.',
        'OTTTTTTTWWWWWWWWTTTTTTTO.OY.',
        '.OOTTTTTTTTTTTTTTTTTTTOOOOY.',
        '.OODDDDDDYYYYYYDDDDDDDOOO...',
        'OODDTTTTTYYYYYYTTTTTTDDDO...',
        '.OODDDDDDDDDDDDDDDDDDDDO....',
        '...OTTTTT......TTTTTO.......',
        '..OODDDDO......ODDDDOO......',
        '..OOOOOOO......OOOOOOO......',
        '............................',
        '............................',
        '............................',
        '............................'
      ]
    },

    // 31. 比丘国·白鹿国丈（新增独立母版：九叉珊瑚白玉巨鹿角、邪紫寿仙袍、蟠桃龙头寿杖）
    white_deer_sage: {
      palette: { O: '#0f0c14', W: '#ffffff', C: '#90e0ef', B: '#5a189a', G: '#ffd166', R: '#f72585', S: '#ffe5d9' },
      p2Palette: { W: '#e0fbfc', C: '#00f5d4', B: '#240046', G: '#ffd60a', R: '#ff0a54' },
      f0: [
        'WW..WW..............WW..WW..',
        '.WWWWOO...OOOOOO...OOWWWW.RR',
        '..OWWWWOOGGGGGGGGOOWWWWO.RWR',
        '....OOSSSSSSSSSSSSSSOO...ORO',
        '....OSSROOSSSSSSOORSSO....O.',
        '.....OOSSSSWWWWSSSSOO.....O.',
        '...OOBBBBBGGGGGGGBBBBBOOOOO.',
        '..OOBBBCCCCRRRRCCCCBBBBOO...',
        '.OOBBBBCCCCRRRRCCCCBBBBBOO..',
        '..OOBBBBBCCCCCCCCBBBBBBOO...',
        '...OOBBBBBBBBBBBBBBBBBOO....',
        '....OOWWWWW....WWWWWOO......',
        '....OOBBBO......OBBBOO......',
        '...OOOOOOO......OOOOOOO.....'
      ],
      f1: [
        'WW..WW..............WW..WW..',
        '.WWWWOO...OOOOOO...OOWWWW..R',
        '..OWWWWOOGGGGGGGGOOWWWWO.RWR',
        '....OOSSSSSSSSSSSSSSOO....O.',
        '....OSSROOSSSSSSOORSSO....O.',
        '...OOBBBBBGGGGGGGBBBBBOOOOO.',
        '..OOBBBCCCCRRRRCCCCBBBBOO...',
        '..OOBBBBBCCCCCCCCBBBBBBOO...',
        '...OOBBBBBBBBBBBBBBBBBOO....',
        '....OOBBBO......OBBBOO......',
        '...OOOOOOO......OOOOOOO.....',
        '............................',
        '............................',
        '............................'
      ]
    },

    // 32. 金鼻白毛老鼠精·地涌夫人（新增独立母版：白玉圆鼠耳凤冠、金鼻赤瞳、双股寒光宝剑）
    golden_mouse_queen: {
      palette: { O: '#0f0c14', W: '#f8f9fa', P: '#ffd60a', M: '#f72585', G: '#ffd166', C: '#00f5d4', D: '#3c096c' },
      p2Palette: { W: '#ffffff', P: '#ff9f1c', M: '#ff0a54', G: '#ffd60a', C: '#80ffdb', D: '#10002b' },
      f0: [
        '..OOOOO..........OOOOO..CC.',
        '.OWWWWWO..OGGGO.OWWWWWO.CWC',
        '.OWWMMWWOOOGGGOOOWWMMWWO.CO',
        '..OOWWWWWWWWWWWWWWWWWOO..O.',
        'CC.OWWWMWWPPPPWWMWWWWO...O.',
        'CWC.OOWWWWWPPWWWWWWOO..OOO.',
        '.OO..OOPPPPGGGGPPPPOO......',
        '....OOPPPMMMMMMMMPPPOO.....',
        '...OOPPPPMMWWWWMMPPPPOO....',
        '....OODDDDDDDDDDDDDDOO.....',
        '.....OOMMMM....MMMMOO......',
        '......ODDO......ODDO.......',
        '.....OODDO......ODDOO......',
        '.....OOOOO......OOOOO......'
      ],
      f1: [
        '..OOOOO..........OOOOO...CC',
        '.OWWWWWO..OGGGO.OWWWWWO.CWC',
        '.OWWMMWWOOOGGGOOOWWMMWWO.OO',
        'CC.OWWWWWWWWWWWWWWWWWOO..O.',
        'CWC.OWWMWWPPPPWWMWWWWO.OOO.',
        '.OO..OOPPPPGGGGPPPPOO......',
        '....OOPPPMMMMMMMMPPPOO.....',
        '....OODDDDDDDDDDDDDDOO.....',
        '.....OOMMMM....MMMMOO......',
        '.....OODDO......ODDOO......',
        '.....OOOOO......OOOOO......',
        '...........................',
        '...........................',
        '...........................'
      ]
    },

    // 33. 南山大王·艾叶花豹精（新增独立母版：艾叶金钱豹纹狂首、梅花幻影战披、点钢铁杵）
    leopard_king: {
      palette: { O: '#0f0c14', T: '#ffba08', D: '#22223b', C: '#00f5d4', R: '#ff0a54', W: '#ffffff', M: '#adb5bd' },
      p2Palette: { T: '#ffd60a', D: '#10002b', C: '#80ffdb', R: '#ff0a54', M: '#ffffff' },
      f0: [
        '...OOO............OOO..MMMM',
        '..OTTTTOOOOOOOOOOTTTTO.MWWM',
        '..OTDTTTDTTTTTTDTTTDTO..MMO',
        '.OTTTTTRWTTTTTTRWTTTTTO..O.',
        '.OTTTTTTWWWWWWWWTTTTTTO..O.',
        '..OOTTDTTTTTTTTTTDTTOOOOOO.',
        '.OOCCCCDDDDDDDDDDCCCCOO....',
        'OOCCCDDDTTTDDTTTDDDCCCOO...',
        '.OODDDDDTTTTTTTTDDDDDDO....',
        '..OOTTDTTTDDDDTTTDTTOO.....',
        '...OTTTTT......TTTTTO......',
        '...ODDDDO......ODDDDO......',
        '..OODDDDO......ODDDDOO.....',
        '..OOOOOOO......OOOOOOO.....'
      ],
      f1: [
        '...OOO............OOO...MMM',
        '..OTTTTOOOOOOOOOOTTTTO..MWM',
        '..OTDTTTDTTTTTTDTTTDTO...MO',
        '.OTTTTTRWTTTTTTRWTTTTTO..O.',
        '..OOTTDTTTTTTTTTTDTTOOOOOO.',
        '.OOCCCCDDDDDDDDDDCCCCOO....',
        'OOCCCDDDTTTDDTTTDDDCCCOO...',
        '..OOTTDTTTDDDDTTTDTTOO.....',
        '...OTTTTT......TTTTTO......',
        '..OODDDDO......ODDDDOO.....',
        '..OOOOOOO......OOOOOOO.....',
        '...........................',
        '...........................',
        '...........................'
      ]
    },

    // 34. 玄英洞·辟寒辟暑辟尘三犀王（新增独立母版：三棱玄冰擎天犀角、寒晶重甲、宣花冰巨斧）
    frost_rhino_lord: {
      palette: { O: '#0f0c14', B: '#0077b6', L: '#90e0ef', C: '#00f5d4', W: '#ffffff', D: '#03045e', R: '#ff0a54' },
      p2Palette: { B: '#03045e', L: '#caf0f8', C: '#80ffdb', W: '#ffffff', D: '#10002b', R: '#ffd60a' },
      f0: [
        '.....CC...OWWWO...CC..CCCC.',
        '....OCWO.OWWWWWO.OWCO.CWWWC',
        '.....OOOBBBBBBBBBOOO..CWWWC',
        '...OOBBBBLLLLLLBBBBBO..OOO.',
        '..OBBBBBRWBBBBBRWBBBBO..O..',
        '..OBBBBBBBLLLLBBBBBBBO..O..',
        '.OODDDDDDDCCCCDDDDDDDOOOO..',
        'OODDBBBBBBCCCCCBBBBBBBDDO..',
        'OODDBBBBCCCCCCCCBBBBBBBDDO.',
        '.OODDDDDDDDDDDDDDDDDDDDDO..',
        '..OOBBBBBBBCCCCBBBBBBBOO...',
        '...ODDDDDO......ODDDDDO....',
        '...OBBBBO........OBBBBO....',
        '..OOBBBBO........OBBBBOO...',
        '..OOOOOOO........OOOOOOO...'
      ],
      f1: [
        '.....CC...OWWWO...CC...CCCC',
        '....OCWO.OWWWWWO.OWCO..CWWW',
        '.....OOOBBBBBBBBBOOO...OOOO',
        '...OOBBBBLLLLLLBBBBBO...O..',
        '..OBBBBBRWBBBBBRWBBBBO..O..',
        '.OODDDDDDDCCCCDDDDDDDOOOO..',
        'OODDBBBBBBCCCCCBBBBBBBDDO..',
        '.OODDDDDDDDDDDDDDDDDDDDDO..',
        '..OOBBBBBBBCCCCBBBBBBBOO...',
        '...OBBBBO........OBBBBO....',
        '..OOOOOOO........OOOOOOO...',
        '...........................',
        '...........................',
        '...........................',
        '...........................'
      ]
    }
  };

  const ALL_ARCHETYPES = Object.assign({}, MOB_ARCHETYPES, BOSS_ARCHETYPES);

  function getArchetype(archetypeId) {
    return ALL_ARCHETYPES[archetypeId] || MOB_ARCHETYPES.wolf_scout;
  }

  /**
   * 为 Boss 自动派生【蓄力扬兵帧 (windup)】与【破军挥击帧 (attack)】，让动作模组具备真实像素姿态变化！
   */
  function makeWindupRows(rows) {
    const gw = rows.reduce((m, r) => Math.max(m, r.length), 0);
    const halfH = Math.floor(rows.length * 0.58);
    const out = [];
    for (let y = 0; y < rows.length; y++) {
      const padded = rows[y].padEnd(gw, '.');
      if (y < halfH) {
        out.push('.' + padded.slice(0, Math.max(1, gw - 1)));
      } else {
        out.push(padded);
      }
    }
    return out;
  }

  function makeAttackRows(rows) {
    const gw = rows.reduce((m, r) => Math.max(m, r.length), 0);
    const halfH = Math.floor(rows.length * 0.62);
    const out = [];
    for (let y = 0; y < rows.length; y++) {
      const padded = rows[y].padEnd(gw, '.');
      if (y < halfH) {
        out.push(padded.slice(1) + '.');
      } else {
        out.push('.' + padded.slice(0, Math.max(1, gw - 1)));
      }
    }
    return out;
  }

  function makeAwakenedPalette(basePal, customP2) {
    const p2 = Object.assign({}, basePal, customP2 || {});
    if (!customP2) {
      if (p2.R) p2.R = '#ff0a54';
      if (p2.G) p2.G = '#ffd60a';
      if (p2.Y) p2.Y = '#ffd60a';
    }
    return p2;
  }

  function bakeArchetypeEntry(bakeGridFn, archetypeId, paletteOverride, scale) {
    const base = getArchetype(archetypeId);
    const isBossArch = !!BOSS_ARCHETYPES[archetypeId];
    const pal = paletteOverride ? Object.assign({}, base.palette, paletteOverride) : base.palette;
    const sc = scale || (isBossArch ? 3.15 : 2.0);
    const f1Rows = base.f1 || base.f0;
    const windupRows = base.windup || makeWindupRows(base.f0);
    const attackRows = base.attack || makeAttackRows(f1Rows);
    const p2Pal = makeAwakenedPalette(pal, base.p2Palette);

    return {
      f0: bakeGridFn(base.f0, pal, sc, false),
      f1: bakeGridFn(f1Rows, pal, sc, false),
      windup: bakeGridFn(windupRows, pal, sc, false),
      attack: bakeGridFn(attackRows, pal, sc, false),
      p2_f0: bakeGridFn(base.f0, p2Pal, sc, false),
      p2_f1: bakeGridFn(f1Rows, p2Pal, sc, false),
      p2_windup: bakeGridFn(windupRows, p2Pal, sc, false),
      p2_attack: bakeGridFn(attackRows, p2Pal, sc, false),
      flash: bakeGridFn(base.f0, pal, sc, true),
      hiRes: bakeGridFn(base.f0, pal, 3.0, false)
    };
  }

  return {
    MOB_ARCHETYPES,
    BOSS_ARCHETYPES,
    ALL_ARCHETYPES,
    getArchetype,
    bakeArchetypeEntry
  };
});
