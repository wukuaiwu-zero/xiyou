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

  // ==================== 二、九九八十一难大妖王 Boss 像素矩阵 (22x15 ~ 26x18, 默认 scale=2.8~3) ====================
  const BOSS_ARCHETYPES = {
    // 1. 寅将军（双叉岭斑斓猛虎妖王）
    yin_general: {
      palette: { O: '#0f0c14', T: '#f77f00', Y: '#fcbf49', W: '#ffffff', R: '#d62828', D: '#2b2d42', M: '#ced4da' },
      f0: [
        '..OOO..........OOO..MMM',
        '.OTTTTOOOOOOOOTTTTOOMWM',
        '.OTOTTTTTTTTTTTTOTO.OMO',
        'OTTTTRWTTTTTTRWTTTTO.O.',
        'OTTTTTTWWWWWWTTTTTTO.O.',
        '.OOTTTTWOOWOWTTTTOOOOO.',
        '.OODDDDDYYYYDDDDDDOO...',
        'OODDTTTTYYYYTTTTDDDO...',
        'OODDDDDDDDDDDDDDDDDO...',
        '.OOTTTTTYYYYTTTTTTO....',
        '..OTTTT......TTTTO.....',
        '..ODDDO......ODDDO.....',
        '.OODDDO......ODDDOO....',
        '.OOOOOO......OOOOOO....'
      ],
      f1: [
        '..OOO..........OOO...MM',
        '.OTTTTOOOOOOOOTTTTO.MWM',
        '.OTOTTTTTTTTTTTTOTO.OMO',
        'OTTTTRWTTTTTTRWTTTTO.O.',
        'OTTTTTTWWWWWWTTTTTTO.O.',
        '.OOTTTTWOOWOWTTTTOOOOO.',
        '.OODDDDDYYYYDDDDDDOO...',
        'OODDTTTTYYYYTTTTDDDO...',
        '.OODDDDDDDDDDDDDDDO....',
        '..OTTTT......TTTTO.....',
        '..ODDDO......ODDDO.....',
        '..OOOOO......OOOOO.....',
        '.......................',
        '.......................'
      ]
    },

    // 2. 黑风大王·熊罴精（黑缨长枪、乌金重铠）
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
      ],
      f1: [
        '...OOO........OOO..RR.',
        '..ODDDDOOOOOODDDDORWR.',
        '..ODBBBBBBBBBBBBDO.OO.',
        '.ODBBBRWBBBBBRWBBDO.O.',
        '.ODBBBBBBBBBBBBBBDO.O.',
        '.ODBBBBGGGGGGGGGBDO.O.',
        'OODGGGGGGGGGGGGGGDOOO.',
        'ODBBBBGGGGGGGGGBBBDO..',
        '.ODBBBBBBBBBBBBBBDO...',
        '.OOGGGGGGGGGGGGGGOO...',
        '..ODBBB......BBBDO....',
        '..ODDDO......ODDDO....',
        '.OOOOOO......OOOOOO...',
        '......................',
        '......................'
      ]
    },

    // 3. 黄风大圣·貂鼠精（三股钢叉、三昧神风金袍）
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
      ],
      f1: [
        '.....OOOOOOOOOO..W.W.W',
        '...OOYYYYYYYYYYOO.OYO.',
        '..OYYGGGGGGGGGGYYOOYO.',
        '.OYYGGRWOGGORWGYYO.OO.',
        '.OYYYYGGGGGGGGYYYO.O..',
        '..OOYYYYWWWWYYYYOO.O..',
        '.OODDDDDYYYYDDDDDOOO..',
        'OODDYYYYGGGGYYYYDDOO..',
        '.OODDDDDDDDDDDDDDOO...',
        '..OOYYYY....YYYYOO....',
        '...ODDD......DDDO.....',
        '..OOOOO......OOOOO....',
        '......................',
        '......................'
      ]
    },

    // 4. 流沙水妖王 / 泾河水神残影
    liusha_demon: {
      palette: { O: '#0f0c14', R: '#d62828', B: '#0077b6', C: '#00f5d4', W: '#ffffff', P: '#5a189a', G: '#ffd166' },
      f0: [
        '.....OORRRRRROO...CCC',
        '....ORRRRRRRRRRO.CWCO',
        '...OOCCCCCCCCCCOO.OO.',
        '..OCCCRWOCCORWCCCO.O.',
        '..OCCCCRRRRRRCCCCO.O.',
        '..OOWOWOGGGGOWOWOOOO.',
        '.OOPPPPPCCCCPPPPPOO..',
        'OOPPPCCCCCCCCCCPPPOO.',
        '.OOPPPPPPPPPPPPPPOO..',
        '..OOBBBBCCCCBBBBOO...',
        '.OOBBCCWWWWWWCCBBOO..',
        'OOBBCCCCCCCCCCCCBBOO.',
        '.OOOOOOOOOOOOOOOOOO..'
      ],
      f1: [
        '.....OORRRRRROO..CCC.',
        '....ORRRRRRRRRROCWCO.',
        '...OOCCCCCCCCCCOO.OO.',
        '..OCCCRWOCCORWCCCO.O.',
        '..OCCCCRRRRRRCCCCO.O.',
        '..OOWOWOGGGGOWOWOOOO.',
        '.OOPPPPPCCCCPPPPPOO..',
        'OOPPPCCCCCCCCCCPPPOO.',
        '.OOPPPPPPPPPPPPPPOO..',
        '.OOBBCCCCWWWWCCBBBOO.',
        'OOBBCCWWWWWWWWCCBBOO.',
        '.OOOOOOOOOOOOOOOOOO..',
        '.....................'
      ]
    },

    // 5. 五庄乾坤道尊傀 / 人参果树古灵
    wuzhuang_immortal: {
      palette: { O: '#0f0c14', G: '#ffd166', C: '#06d6a0', B: '#1d3557', W: '#f8f9fa', S: '#ffe5d9', R: '#ef233c' },
      f0: [
        '.......OOGGOO.....CCC',
        '.....OOBBGGGBBOO.CWCO',
        '....OSSSSSSSSSSOO.OO.',
        '....OSWOSSSSOWSO..O..',
        '.....OOSSSSSSOO...O..',
        '.....OOWWWWWWWOOOOO..',
        '...OOBBCCCCCCBBBOO...',
        '..OOBBCCWRWWCCBBBOO..',
        '..OOBBCCWWWRCCBBBOO..',
        '...OOBBCCCCCCBBBOO...',
        '....OOBBBBBBBBBOO....',
        '....OOWW....WWOO.....',
        '...OOBBO....OBBOO....',
        '...OOOOO....OOOOO....'
      ],
      f1: [
        '.......OOGGOO....CCC.',
        '.....OOBBGGGBBOOCWCO.',
        '....OSSSSSSSSSSOO.OO.',
        '....OSWOSSSSOWSO..O..',
        '.....OOSSSSSSOO...O..',
        '.....OOWWWWWWWOOOOO..',
        '...OOBBCCCCCCBBBOO...',
        '..OOBBCCWRWWCCBBBOO..',
        '...OOBBCCCCCCBBBOO...',
        '....OOBBBBBBBBBOO....',
        '....OOWW....WWOO.....',
        '...OOOOO....OOOOO....',
        '.....................',
        '.....................'
      ]
    },

    // 6. 白骨夫人·尸魔
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
      ],
      f1: [
        '....OCCOOOOOOCCO....',
        '....OOHHHHHHHHOO....',
        '...OHHWWWWWWWWHO....',
        '...OHWWMOWWOMWHO....',
        '...OHWWWWWWWWWWO....',
        '..OOHHPPPPPPPPPHOO..',
        '.OOHPPPMMMMMMPPPPHO.',
        '..OOPPPMMWWWMMMPPOO.',
        '...OOPPPPPPPPPPPOO..',
        '....OPPP....PPPO....',
        '....OCC......CCO....',
        '.....C........C.....',
        '....................'
      ]
    },

    // 7. 黄袍怪·奎木狼星（青面獠牙、二十八宿明黄袍、蘸钢大刀）
    yellow_robe_demon: {
      palette: { O: '#0f0c14', B: '#4ea8de', D: '#1d3557', Y: '#ffb703', G: '#ffd166', R: '#ff0a54', W: '#ffffff' },
      f0: [
        '...OO..........OO..WWW',
        '..OBBOOOOOOOOOBBO.OWWO',
        '..OBBBBBBBBBBBBBO..OO.',
        '.OBBBRWBBBBBBRWBBO.O..',
        '.OBBBWWWWWWWWBBBBO.O..',
        '..OOBWOOOOOOOWBOOOOO..',
        '.OOYYYYGGGGGGYYYYOO...',
        'OOYYYYGGGGGGGGYYYYOO..',
        'OOYYDDDDGGGGDDDDYYOO..',
        '.OOYYYYYYYYYYYYYYOO...',
        '..OOYYYY....YYYYOO....',
        '...ODDDO....ODDDO.....',
        '..OODDDO....ODDDOO....',
        '..OOOOOO....OOOOOO....'
      ],
      f1: [
        '...OO..........OO...WW',
        '..OBBOOOOOOOOOBBO..WWO',
        '..OBBBBBBBBBBBBBO..OO.',
        '.OBBBRWBBBBBBRWBBO.O..',
        '.OBBBWWWWWWWWBBBBO.O..',
        '..OOBWOOOOOOOWBOOOOO..',
        '.OOYYYYGGGGGGYYYYOO...',
        'OOYYYYGGGGGGGGYYYYOO..',
        '.OOYYDDDDGGDDDDYYOO...',
        '..OOYYYY....YYYYOO....',
        '...ODDDO....ODDDO.....',
        '..OOOOOO....OOOOOO....',
        '......................',
        '......................'
      ]
    },

    // 8. 金角大王 & 9. 银角大王（额顶独角、紫金红葫芦/羊脂玉净瓶、七星剑）
    gold_silver_horn: {
      palette: { O: '#0f0c14', G: '#ffd166', R: '#ef233c', P: '#5a189a', S: '#90e0ef', W: '#ffffff', D: '#240046' },
      f0: [
        '........OGGO..........',
        '.......OGWGGO.....RR..',
        '.....OOOGGGGOOO..ORRO.',
        '....OSSSSSSSSSSO.ORRO.',
        '...OSSRWOSSORWSSO.OO..',
        '...OSSSSWWWWSSSSO.O...',
        '..OOPPPPGGGGPPPPOOOO..',
        '.OOPPPRRRRRRRRPPPOO...',
        '.OOPPPGGGGGGGGPPPOO...',
        '..OODDDDDDDDDDDDOO....',
        '...ODDDD....DDDDO.....',
        '...OPPPO....OPPPO.....',
        '..OOPPPO....OPPPOO....',
        '..OOOOOO....OOOOOO....'
      ],
      f1: [
        '........OGGO.......RR.',
        '.......OGWGGO.....ORRO',
        '.....OOOGGGGOOO...ORRO',
        '....OSSSSSSSSSSO...OO.',
        '...OSSRWOSSORWSSO..O..',
        '...OSSSSWWWWSSSSO..O..',
        '..OOPPPPGGGGPPPPOOOO..',
        '.OOPPPRRRRRRRRPPPOO...',
        '..OOPPGGGGGGGGPPPOO...',
        '...ODDDD....DDDDO.....',
        '...OPPPO....OPPPO.....',
        '..OOOOOO....OOOOOO....',
        '......................',
        '......................'
      ]
    },

    // 10. 圣婴大王·红孩儿（冲天双髻、红肚兜、丈八火尖枪、三昧真火轮）
    red_boy: {
      palette: { O: '#0f0c14', R: '#ef233c', F: '#ff5400', Y: '#ffd166', S: '#ffe5d9', W: '#ffffff', B: '#120d18' },
      f0: [
        '..OOBBOO......OOBBOO.F',
        '.OBBRRBBOOOOOBBRRBBOFY',
        '..OOBSSSSSSSSSSBBOO.OO',
        '...OSSRWOSSORWSSO...O.',
        '...OSSSSSSSSSSSSO...O.',
        '....OOSSRRRRSSOO..OOO.',
        '...OOSRRRRRRRRSOOO....',
        '..OOSRRRYYYYRRRSOO....',
        '...OOORRRRRRRROOO.....',
        '....OSSO....OSSO......',
        '..FFYYOO....OOYYFF....',
        '.FFYYYYFF..FFYYYYFF...',
        '..FFFFFF....FFFFFF....'
      ],
      f1: [
        '..OOBBOO......OOBBOOFY',
        '.OBBRRBBOOOOOBBRRBBOYF',
        '..OOBSSSSSSSSSSBBOO.OO',
        '...OSSRWOSSORWSSO...O.',
        '...OSSSSSSSSSSSSO...O.',
        '....OOSSRRRRSSOO..OOO.',
        '...OOSRRRRRRRRSOOO....',
        '...OOSRRYYYYRRSOO.....',
        '....OORRRRRRRROO......',
        '....OSSO....OSSO......',
        '.YYFFOO......OOFFYY...',
        '..FFFFFF....FFFFFF....',
        '......................'
      ]
    },

    // 11. 鼍龙怪（黑水河猪婆鳄龙、竹节钢鞭）
    tuolong_dragon: {
      palette: { O: '#0f0c14', G: '#2d6a4f', L: '#52b788', Y: '#ffd166', R: '#ff0a54', W: '#ffffff', D: '#1b4332' },
      f0: [
        '..YY..........YY...YYY',
        '..OYOOOOOOOOOOYO...OYO',
        '.OOGGGGGGGGGGGGOO..OYO',
        'OGGGLRWGGGGGRWLGGGOOYO',
        'OGGGGWWWWWWWWGGGGGOOO.',
        '.OODDDDDYYYYDDDDDOO...',
        'OODDGGGGLLLLGGGGDDO...',
        'OODDGGGGYYYYGGGGDDO...',
        '.OODDDDDDDDDDDDDDOO...',
        '..OOGGGG....GGGGOO....',
        '...ODDD......DDDO.....',
        '..OODDD......DDDOO....',
        '..OOOOO......OOOOO....'
      ],
      f1: [
        '..YY..........YY....YY',
        '..OYOOOOOOOOOOYO...OYO',
        '.OOGGGGGGGGGGGGOO..OYO',
        'OGGGLRWGGGGGRWLGGGOOYO',
        'OGGGGWWWWWWWWGGGGGOOO.',
        '.OODDDDDYYYYDDDDDOO...',
        'OODDGGGGLLLLGGGGDDO...',
        '.OODDDDDDDDDDDDDDOO...',
        '..OOGGGG....GGGGOO....',
        '...ODDD......DDDO.....',
        '..OOOOO......OOOOO....',
        '......................',
        '......................'
      ]
    },

    // 12. 车迟国三仙（虎力/鹿力/羊力大仙：高耸法坛宝冠、杏黄八卦鹤氅、五雷宝剑）
    chechi_immortal: {
      palette: { O: '#0f0c14', Y: '#ffb703', G: '#ffd166', B: '#264653', R: '#e63946', W: '#ffffff', C: '#00f5d4' },
      f0: [
        '...GG..........GG...CC',
        '..OGGO..OOOO..OGGO.CWC',
        '...OOGGGGGGGGGGOO..OO.',
        '...OOYYYYYYYYYYOO..O..',
        '..OYYRWOYYYYORWYYO.O..',
        '..OYYYYWWWWWWYYYYOOOO.',
        '.OOBBBBBGGGGGBBBBBOO..',
        'OOBBBYYYRRRRYYYBBBOO..',
        'OOBBBYYYYYYYYYYBBBOO..',
        '.OOBBBBBBBBBBBBBBBOO..',
        '..OOYYYY....YYYYOO....',
        '...OBBBO....OBBBO.....',
        '..OOBBBO....OBBBOO....',
        '..OOOOOO....OOOOOO....'
      ],
      f1: [
        '...GG..........GG..CC.',
        '..OGGO..OOOO..OGGOCWCO',
        '...OOGGGGGGGGGGOO..OO.',
        '...OOYYYYYYYYYYOO..O..',
        '..OYYRWOYYYYORWYYO.O..',
        '..OYYYYWWWWWWYYYYOOOO.',
        '.OOBBBBBGGGGGBBBBBOO..',
        'OOBBBYYYRRRRYYYBBBOO..',
        '.OOBBBBBBBBBBBBBBBOO..',
        '..OOYYYY....YYYYOO....',
        '...OBBBO....OBBBO.....',
        '..OOOOOO....OOOOOO....',
        '......................',
        '......................'
      ]
    },

    // 13. 灵感大王·通天河金鱼精（鼓眼金鲤龙冠、赤铜九瓣锤）
    inspiration_king: {
      palette: { O: '#0f0c14', R: '#f77f00', G: '#fcbf49', W: '#ffffff', C: '#48cae4', D: '#9d0208' },
      f0: [
        '.....OOGGGGGGOO...GGG.',
        '...OORRRRRRRRRROOOGWGO',
        '.OOWWORRRRRRRROWWOGGGO',
        'OWWOORRRRRRRRRROOWWOO.',
        '.OORRRRRWWWWWRRRRROO..',
        '.OOCCCCGGGGGGCCCCOO...',
        'OOCCRRRRGGGGGRRRRCCOO.',
        'OOCCRRRRRRRRRRRRRCCOO.',
        '.OODDDDDDDDDDDDDDDOO..',
        '..OORRRR....RRRROO....',
        '...OCCO......OCCO.....',
        '..OOCCO......OCCOO....',
        '..OOOOO......OOOOO....'
      ],
      f1: [
        '.....OOGGGGGGOO....GGG',
        '...OORRRRRRRRRROO.GWGO',
        '.OOWWORRRRRRRROWWOGGGO',
        'OWWOORRRRRRRRRROOWWOO.',
        '.OORRRRRWWWWWRRRRROO..',
        '.OOCCCCGGGGGGCCCCOO...',
        'OOCCRRRRGGGGGRRRRCCOO.',
        '.OODDDDDDDDDDDDDDDOO..',
        '..OORRRR....RRRROO....',
        '...OCCO......OCCO.....',
        '..OOOOO......OOOOO....',
        '......................',
        '......................'
      ]
    },

    // 14. 独角兕大王·青牛精（冲天白玉巨独角 + 悬浮发光太上金刚琢！）
    single_horn_rhino: {
      palette: { O: '#0f0c14', B: '#3d5a80', L: '#98c1d9', W: '#ffffff', G: '#ffd60a', R: '#ff0a54', D: '#293241' },
      f0: [
        '........OWWO.....GGGG.',
        '.......OWWWWO...GWWWWG',
        '.....OOOBBBBOOO.GW..WG',
        '...OOBBBLLLLBBBO.GGGG.',
        '..OBBBRWBBBBBRWBBO....',
        '..OBBBBBLLLLBBBBBO....',
        '.OODDDDDGGGGDDDDDOO...',
        'OODDBBBBGGGGGBBBBDDO..',
        'OODDDDDDDDDDDDDDDDDO..',
        '.OOBBBBBGGGGGBBBBBOO..',
        '..ODDDD......DDDDO....',
        '..OBBBO......OBBBO....',
        '.OOBBBO......OBBBOO...',
        '.OOOOOO......OOOOOO...'
      ],
      f1: [
        '........OWWO....GGGG..',
        '.......OWWWWO..GWWWWG.',
        '.....OOOBBBBOOO.GW.WG.',
        '...OOBBBLLLLBBBO.GGG..',
        '..OBBBRWBBBBBRWBBO....',
        '..OBBBBBLLLLBBBBBO....',
        '.OODDDDDGGGGDDDDDOO...',
        'OODDBBBBGGGGGBBBBDDO..',
        '.OODDDDDDDDDDDDDDDO...',
        '..ODDDD......DDDDO....',
        '..OBBBO......OBBBO....',
        '.OOOOOO......OOOOOO...',
        '......................',
        '......................'
      ]
    },

    // 15. 琵琶蝎子精（高髻美人、怀抱玉琵琶、身后高高翘起倒马毒桩蝎尾钩！）
    scorpion_queen: {
      palette: { O: '#0f0c14', P: '#9d4edd', M: '#e0aaff', R: '#ff0a54', G: '#ffd166', S: '#ffe5d9', D: '#3c096c' },
      f0: [
        'RR.....OOGGOO.........',
        'ORRO..ODDDDDDO........',
        '.OO..OSSSSSSSSO..GGG..',
        '.ODDOSSRWOSSRWSOOGWGO.',
        'ODDO..OSSSSSSO..OGGGO.',
        'ODO..OOPPPPPPOO..OOO..',
        'OO..OOPPMMMMPPOO......',
        'ODDOOPPPGGGGPPPOO.....',
        '.OOOOPPPPPPPPPPOO.....',
        '....OPPP....PPPO......',
        '...ODDO......ODDO.....',
        '..OODDO......ODDOO....',
        '..OOOOO......OOOOO....'
      ],
      f1: [
        '.RR....OOGGOO.........',
        'ORRO..ODDDDDDO........',
        'OO...OSSSSSSSSO...GGG.',
        'ODDO.SSRWOSSRWSO.GWGO.',
        '.ODDO.OSSSSSSO...GGGO.',
        '..OO.OOPPPPPPOO...OO..',
        '....OOPPMMMMPPOO......',
        '...OOPPPGGGGPPPOO.....',
        '....OPPPPPPPPPPO......',
        '...ODDO......ODDO.....',
        '..OOOOO......OOOOO....',
        '......................',
        '......................'
      ]
    },

    // 16. 六耳猕猴（魔化紫金冠、双侧六耳赤芒、暗金邪甲、随心铁杆兵）
    six_eared_macaque: {
      palette: { O: '#0f0c14', P: '#7209b7', R: '#ff0a54', G: '#ffd60a', F: '#582f0e', S: '#d4a373', D: '#240046' },
      f0: [
        '....RO...GG...OR...GGG',
        '...ORPOOOPPOOOPRO..ORO',
        '..ROROFFFFFFFFOROR..O.',
        '.ROROFFSSFFFFSSFFOR.O.',
        '..OOFFSRWFFFRWSFFOO.O.',
        '....OFFSSSSSSFFO..OOO.',
        '..OOPPDDGGGGDDPPOO....',
        '.OOPPDDPRRRRRDDPPOO...',
        '..OOPPDDDDDDDDPPOO....',
        '....OORRRRRRRROO......',
        '...OOPPGPGGPGPPOO.....',
        '...ODDO......ODDO.....',
        '..OODDO......ODDOO....',
        '..OOOOO......OOOOO....'
      ],
      f1: [
        '....RO...GG...OR....GG',
        '...ORPOOOPPOOOPRO..ORO',
        '..ROROFFFFFFFFOROR..O.',
        '.ROROFFSSFFFFSSFFOR.O.',
        '..OOFFSRWFFFRWSFFOO.O.',
        '....OFFSSSSSSFFO..OOO.',
        '..OOPPDDGGGGDDPPOO....',
        '.OOPPDDPRRRRRDDPPOO...',
        '...OOPPDDDDDDPPOO.....',
        '....OOPPGPGGPPOO......',
        '...ODDO......ODDO.....',
        '..OOOOO......OOOOO....',
        '......................',
        '......................'
      ]
    },

    // 17. 铁扇公主·罗刹女（凤冠霞帔、手持翠绿太阴芭蕉巨扇！）
    iron_fan_princess: {
      palette: { O: '#0f0c14', R: '#d62828', G: '#06d6a0', L: '#80ffdb', Y: '#ffd166', S: '#ffe5d9', D: '#6a040f' },
      f0: [
        '.....OOYYYYOO...GGGG..',
        '....OODDDDDDOO.GLLLLG.',
        '...OOSSSSSSSSOOGLLLLGO',
        '...OSSRWOSSRWSOGGGGGGO',
        '....OOSSSSSSOO..OOOO..',
        '..OORRRRYYYYRRRROO....',
        '.OORRRDDDDDDDRRRRO....',
        '..OORRRRYYYYRRRROO....',
        '...OORRRRRRRRRROO.....',
        '....ORRR....RRRO......',
        '...ODDDO....ODDDO.....',
        '..OODDDO....ODDDOO....',
        '..OOOOOO....OOOOOO....'
      ],
      f1: [
        '.....OOYYYYOO....GGGG.',
        '....OODDDDDDOO..GLLLLG',
        '...OOSSSSSSSSOO.GLLLLG',
        '...OSSRWOSSRWSO.GGGGGO',
        '....OOSSSSSSOO...OOOO.',
        '..OORRRRYYYYRRRROO....',
        '.OORRRDDDDDDDRRRRO....',
        '...OORRRRRRRRRROO.....',
        '....ORRR....RRRO......',
        '...ODDDO....ODDDO.....',
        '..OOOOOO....OOOOOO....',
        '......................',
        '......................'
      ]
    },

    // 18. 平天大圣·牛魔王
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
      ],
      f1: [
        'WW................WW...',
        'WWWOO..........OOWWW...',
        '.OWWWOOOOOOOOOOWWWO..GG',
        '..OODDDDDDDDDDDDOO..GFG',
        '..ODDDRRRRRRRRDDDO..GGG',
        '.ODDDRFWRDDDRFWRDDO..O.',
        '.ODDDRRRRRRRRRRRDDO..O.',
        'OODGGGGGGGGGGGGGGDOO.O.',
        'ODRGGGGGGGGGGGGGGRDOOO.',
        '.ODDDDDGGGGGGDDDDDO....',
        '..ODDDD......DDDDO.....',
        '..ORRRO......ORRRO.....',
        '.OOOOOO......OOOOOO....',
        '.......................',
        '.......................',
        '.......................'
      ]
    },

    // 19. 九头虫·九头驸马（扇形多首妖禽颈冠、白银战甲、月牙铲）
    nine_headed_bug: {
      palette: { O: '#0f0c14', R: '#e63946', C: '#00f5d4', W: '#f8f9fa', M: '#adb5bd', D: '#1d3557', Y: '#ffd166' },
      f0: [
        '.RO..RO..RO..RO..RO.WW',
        'ORROORROORROORROORROWO',
        '.OOOOOOOOOOOOOOOOOO.OO',
        '..OODDDDRRRDDDDDOO..O.',
        '..ODDDRWDDDDRWDDO...O.',
        '..OODDDDDDDDDDDOO.OOO.',
        '.OOWWWWWYYYYWWWWOO....',
        'OOWWWMMMYYYYMMMWWOO...',
        '.OOWWWWWWWWWWWWWOO....',
        '..OODDDDDDDDDDDOO.....',
        '...ODDD......DDDO.....',
        '..OORRO......ORROO....',
        '..OOOOO......OOOOO....'
      ],
      f1: [
        'RO..RO..RO..RO..RO..WW',
        'ORROORROORROORROORROWO',
        '.OOOOOOOOOOOOOOOOOO.OO',
        '..OODDDDRRRDDDDDOO..O.',
        '..ODDDRWDDDDRWDDO...O.',
        '..OODDDDDDDDDDDOO.OOO.',
        '.OOWWWWWYYYYWWWWOO....',
        'OOWWWMMMYYYYMMMWWOO...',
        '..OODDDDDDDDDDDOO.....',
        '...ODDD......DDDO.....',
        '..OOOOO......OOOOO....',
        '......................',
        '......................'
      ]
    },

    // 20. 黄眉大王·小雷音老佛（垂肩长黄眉、伪佛金身、金铙+人种袋+狼牙棒）
    yellow_brow_king: {
      palette: { O: '#0f0c14', Y: '#ffd60a', G: '#f4a261', S: '#ffe5d9', R: '#d62828', W: '#ffffff', P: '#7209b7' },
      f0: [
        '.....OOOOOOOOOO....YYY',
        '...OOSSSSSSSSSSOO.OYWO',
        '..OYYYYSSOSSYYYYO.OYYO',
        '.OYYYSROSSSSORSYYYO.OO',
        '.OYYSSSSSSSSSSSSYYO.O.',
        '..OOSSSSSSSSSSSSOO..O.',
        '.OORRRRRYYYYRRRRROOOO.',
        'OORRRYYYYYYYYYYRRRRO..',
        'OORRRYYPPPPPPYYRRRRO..',
        '.OORRRRRRRRRRRRRRROO..',
        '..OYYYY......YYYYOO...',
        '...ORRO......ORRO.....',
        '..OORRO......ORROO....',
        '..OOOOO......OOOOO....'
      ],
      f1: [
        '.....OOOOOOOOOO...YYY.',
        '...OOSSSSSSSSSSOOOYWO.',
        '..OYYYYSSOSSYYYYOOYYO.',
        '.OYYYSROSSSSORSYYYO.O.',
        '.OYYSSSSSSSSSSSSYYO.O.',
        '..OOSSSSSSSSSSSSOOOOO.',
        '.OORRRRRYYYYRRRRROO...',
        'OORRRYYPPPPPPYYRRRRO..',
        '.OORRRRRRRRRRRRRRROO..',
        '..OYYYY......YYYYOO...',
        '...ORRO......ORRO.....',
        '..OOOOO......OOOOO....',
        '......................',
        '......................'
      ]
    },

    // 21. 七绝山红鳞大蟒精（盘山巨蟒、血盆毒牙、双枪舌信）
    red_python_demon: {
      palette: { O: '#0f0c14', R: '#d90429', L: '#ef233c', Y: '#ffd166', W: '#ffffff', D: '#6a040f' },
      f0: [
        '.....OOOOOOOOOO.......',
        '...OORRRRRRRRRROO.....',
        '..ORRLLLLLLLLLLRRO....',
        '.ORRLYWOLLLLORYWLRO...',
        '.ORRRWWWWWWWWWWWRROYY.',
        '..OODDDDRRRRDDDDOOY..Y',
        '...OORRRYYYYRRRROO....',
        '..OORRRRLLLLRRRRROO...',
        '.OODDRRRRRRRRRRRDDOO..',
        'OODDRRRRYYYYRRRRRDDOO.',
        'OODDDDDDDDDDDDDDDDDOO.',
        '.OOOOOOOOOOOOOOOOOOO..'
      ],
      f1: [
        '.....OOOOOOOOOO.......',
        '...OORRRRRRRRRROO.....',
        '..ORRLLLLLLLLLLRRO....',
        '.ORRLYWOLLLLORYWLROYY.',
        '.ORRRWWWWWWWWWWWRROY.Y',
        '..OODDDDRRRRDDDDOO....',
        '...OORRRYYYYRRRROO....',
        '.OODDRRRRRRRRRRRDDOO..',
        'OODDRRRRYYYYRRRRRDDOO.',
        '.OOOOOOOOOOOOOOOOOOO..',
        '......................',
        '......................'
      ]
    },

    // 22. 赛太岁·金毛犼（麒麟金鬃、项挂三枚紫阳金铃喷火烟沙！）
    sai_taisui: {
      palette: { O: '#0f0c14', G: '#ffb703', Y: '#ffd60a', R: '#ff4800', P: '#7209b7', W: '#ffffff', D: '#3c096c' },
      f0: [
        '..OO..OOOOOOOO..OO.RRR',
        '.OGGOGGGGGGGGGGOGGORFR',
        '.OGGGGGGGGGGGGGGGGO.O.',
        'OGGGRWGGGGGGGGRWGGO.O.',
        'OGGGGGWWWWWWWWGGGGO.O.',
        '.OOGGGYOOGGOOYGGGOOOO.',
        '.OOPPPPPYYYYPPPPPOO...',
        'OOPPPYYYGGGGYYYPPPOO..',
        'OOPPPPPPPPPPPPPPPPOO..',
        '.OOGGGGGYYYYGGGGGOO...',
        '..ODDDD......DDDDO....',
        '..OGGGO......OGGGO....',
        '.OOGGGO......OGGGOO...',
        '.OOOOOO......OOOOOO...'
      ],
      f1: [
        '..OO..OOOOOOOO..OO..RR',
        '.OGGOGGGGGGGGGGOGGO.RF',
        '.OGGGGGGGGGGGGGGGGO.O.',
        'OGGGRWGGGGGGGGRWGGO.O.',
        'OGGGGGWWWWWWWWGGGGO.O.',
        '.OOGGGYOOGGOOYGGGOOOO.',
        '.OOPPPPPYYYYPPPPPOO...',
        'OOPPPYYYGGGGYYYPPPOO..',
        '.OOPPPPPPPPPPPPPPOO...',
        '..ODDDD......DDDDO....',
        '..OGGGO......OGGGO....',
        '.OOOOOO......OOOOOO...',
        '......................',
        '......................'
      ]
    },

    // 23. 盘丝大仙·七情蛛母（八根巨型紫晶蛛矛腿、蛛后银冠）
    spider_matriarch: {
      palette: { O: '#0f0c14', P: '#7209b7', M: '#f72585', W: '#f8f9fa', C: '#80ffdb', S: '#ffe5d9', D: '#240046' },
      f0: [
        '......OOWWWWOO........',
        '....OOMMMMMMMMOO......',
        '...OOSSSSSSSSSSOO.....',
        '...OSSRWOSSORWSSO.....',
        'OO..OOSSSSSSSSOO..OO..',
        '.OO.OOPPWWWWPPOO.OO...',
        'OO.OOPPMMMMMMPPOO..OO.',
        '..OOPPPDDDDDDPPPOO....',
        '.OO.OOPPPPPPPPOO.OO...',
        'OO..OO.OPPPPO.OO..OO..',
        'O..O...OO..OO...O..O..'
      ],
      f1: [
        '......OOWWWWOO........',
        '....OOMMMMMMMMOO......',
        '...OOSSSSSSSSSSOO.....',
        '...OSSRWOSSORWSSO.....',
        '.OO.OOSSSSSSSSOO.OO...',
        'OO..OOPPWWWWPPOO..OO..',
        '.OOOOPPMMMMMMPPOOOO...',
        '..OOPPPDDDDDDPPPOO....',
        'OO..OOPPPPPPPPOO..OO..',
        'O..OO..OPPPPO..OO..O..',
        '..O....OO..OO....O....'
      ]
    },

    // 24. 百眼魔君·多目蜈蚣精（蜈蚣双触须、肋下千眼金光阵！）
    hundred_eyed_lord: {
      palette: { O: '#0f0c14', R: '#9d0208', G: '#ffd60a', Y: '#ffba08', D: '#2b0909', W: '#ffffff', P: '#5a189a' },
      f0: [
        '.RR..............RR.WW',
        '..RRO..OOOOOO..ORR.OWO',
        '...OOODDDDDDDDOOO..OO.',
        '...ODDDRWDDDRWDDO..O..',
        '...ODDDDDDDDDDDDO..O..',
        '..OOGGGGGGGGGGGGOOOOO.',
        '.OOGYGYGYGYGYGYGYGOO..',
        '.OOGWGYGWGYGWGYGWGOO..',
        '.OOGYGYGYGYGYGYGYGOO..',
        '..OOPPPPRRRRPPPPOO....',
        '...ODDDRRRRRRDDDO.....',
        '..OODDD......DDDOO....',
        '..OOOOO......OOOOO....'
      ],
      f1: [
        '..RR............RR..WW',
        '...RRO.OOOOOO.ORR..OWO',
        '...OOODDDDDDDDOOO..OO.',
        '...ODDDRWDDDRWDDO..O..',
        '...ODDDDDDDDDDDDO..O..',
        '..OOGGGGGGGGGGGGOOOOO.',
        '.OOGWGYGWGYGWGYGWGOO..',
        '.OOGYGYGYGYGYGYGYGOO..',
        '..OOPPPPRRRRPPPPOO....',
        '...ODDDRRRRRRDDDO.....',
        '..OOOOO......OOOOO....',
        '......................',
        '......................'
      ]
    },

    // 25. 狮驼岭·白象魔王（卷曲雪白长象鼻、双长象牙、银甲长枪）
    white_elephant_king: {
      palette: { O: '#0f0c14', W: '#f8f9fa', L: '#ced4da', G: '#ffd166', B: '#4ea8de', R: '#ff0a54', D: '#1d3557' },
      f0: [
        '..OOOOO......OOOOO.GGG',
        '.OWWWWWO....OWWWWWOOGO',
        'OWWLLLLOOOOOOLLLLWWO.O',
        'OWWLWWWRWWWWWRWWLWWO.O',
        '.OOWWWWWLLLLWWWWWO..O.',
        '..OOYYWWLLLLWWYYOOOOO.',
        '..OOBBBBLLLLBBBBOO....',
        '.OOBBBGGLLLLGGBBBOO...',
        '..OOBBBBBLLLBBBBOO....',
        '...OODDDDLLLDDDOO.....',
        '....OWWW....WWWO......',
        '...OODDO....ODDOO.....',
        '...OOOOO....OOOOO.....'
      ],
      f1: [
        '..OOOOO......OOOOO..GG',
        '.OWWWWWO....OWWWWWOOGO',
        'OWWLLLLOOOOOOLLLLWWO.O',
        'OWWLWWWRWWWWWRWWLWWO.O',
        '.OOWWWWWLLLLWWWWWO..O.',
        '..OOYYWWLLLLWWYYOOOOO.',
        '..OOBBBBLLLLBBBBOO....',
        '.OOBBBGGLLLLGGBBBOO...',
        '...OODDDDLLDDDOO......',
        '....OWWW....WWWO......',
        '...OOOOO....OOOOO.....',
        '......................',
        '......................'
      ]
    },

    // 26. 狮驼国·金翅大鹏雕（璀璨双展黄金鹏翼、鹰钩金喙、方天画戟）
    golden_wing_peng: {
      palette: { O: '#0f0c14', G: '#ffd60a', Y: '#f48c06', R: '#d90429', W: '#ffffff', D: '#22223b' },
      f0: [
        'GG......OOOOOO......GG',
        'GGYO..OOGGGGGGOO..OYGG',
        'OGGYOOGGGGGGGGGGOOYGGO',
        'OGGGYOGGRWGGWRGGOYGGGO',
        '.OGGGYGGGGWWGGGGYGGGO.',
        '..OOGGYRRRRRRRRYGGOO..',
        '...OODDDGGGGGGDDDOO...',
        '....OODDGGGGGGDDOO....',
        '....OODDRRRRRRDDOO....',
        '.....OYY......YYO.....',
        '....OOGG......GGOO....',
        '....OOOO......OOOO....'
      ],
      f1: [
        '........OOOOOO........',
        'GG....OOGGGGGGOO....GG',
        'GGYYOOGGGGGGGGGGOOYYGG',
        'OGGGYOGGRWGGWRGGOYGGGO',
        '.OOYYGGGGWWWWGGGGYYOO.',
        '...OOGYRRRRRRRRYGOO...',
        '....OODDGGGGGGDDOO....',
        '....OODDRRRRRRDDOO....',
        '.....OYY......YYO.....',
        '....OOOO......OOOO....',
        '......................',
        '......................'
      ]
    },

    // 27. 九灵元圣·九头狮子祖翁（环绕九颗金青圣狮首、太乙紫金袍）
    nine_spirit_saint: {
      palette: { O: '#0f0c14', G: '#ffd166', C: '#00f5d4', P: '#5a189a', B: '#3c096c', W: '#ffffff', Y: '#f4a261' },
      f0: [
        '..GG..GG..GG..GG..GG..',
        '.OGGOOGGOOGGOOGGOOGGO.',
        'OGCGOGCGOGGGGOGCGOGCGO',
        '.OOOOOOOOOOOOOOOOOOOO.',
        '..OOYYYYGGGGGGYYYYOO..',
        '..OYYCWYYYYYYYYWCYYO..',
        '...OOYYYYWWWWYYYYOO...',
        '..OOPPPPPGGGGPPPPPOO..',
        '.OOPPPCCCCCCCCCCPPPOO.',
        '..OOPPPPPGGGGPPPPPOO..',
        '...OOBBBBBBBBBBBBOO...',
        '....OYYO......OYYO....',
        '...OOGGO......OGGOO...',
        '...OOOOO......OOOOO...'
      ],
      f1: [
        '.GG..GG..GGGG..GG..GG.',
        'OGGOOGGOOGGGGOOGGOOGGO',
        '.OGCGOGCGOGGOGCGOGCGO.',
        '..OOOOOOOOOOOOOOOOOO..',
        '..OOYYYYGGGGGGYYYYOO..',
        '..OYYCWYYYYYYYYWCYYO..',
        '...OOYYYYWWWWYYYYOO...',
        '..OOPPPPPGGGGPPPPPOO..',
        '.OOPPPCCCCCCCCCCPPPOO.',
        '...OOBBBBBBBBBBBBOO...',
        '....OYYO......OYYO....',
        '...OOOOO......OOOOO...',
        '......................',
        '......................'
      ]
    },

    // 28. 天竺玉兔精（修长雪白兔耳、广寒宝冠、捣药玉杵）
    jade_rabbit: {
      palette: { O: '#0f0c14', W: '#ffffff', P: '#ff8fa3', M: '#ff4d6d', G: '#ffd166', C: '#80ffdb', D: '#5a189a' },
      f0: [
        '....OWWO......OWWO....',
        '....OWPO......OPWO....',
        '....OWPOOOOOOOOPWO.CCC',
        '....OWWWGGGGGGWWWO.CWC',
        '...OWWWMWWWWWMWWWWO.O.',
        '....OOWWWWWWWWWWOO..O.',
        '...OOPPPPGGGGPPPPOOOO.',
        '..OOPPPMMMMMMMMPPPOO..',
        '...OOPPPPWWWWPPPPOO...',
        '....OODDDDDDDDDDOO....',
        '.....OWWO....OWWO.....',
        '....OOWWO....OWWOO....',
        '....OOOOO....OOOOO....'
      ],
      f1: [
        '....OWWO......OWWO....',
        '....OWPO......OPWO..CC',
        '....OWPOOOOOOOOPWO.CWC',
        '....OWWWGGGGGGWWWO..O.',
        '...OWWWMWWWWWMWWWWO.O.',
        '....OOWWWWWWWWWWOOOOO.',
        '...OOPPPPGGGGPPPPOO...',
        '..OOPPPMMMMMMMMPPPOO..',
        '....OODDDDDDDDDDOO....',
        '.....OWWO....OWWO.....',
        '....OOOOO....OOOOO....',
        '......................',
        '......................'
      ]
    },

    // 29. 通天河千年老鼋（第八十一难镇守巨兽：苍青八卦巨龟甲、白须龙首、翻江波涛）
    ancient_turtle: {
      palette: { O: '#0f0c14', G: '#2d6a4f', L: '#52b788', Y: '#ffd166', C: '#48cae4', W: '#ffffff', D: '#1b4332' },
      f0: [
        '.........OOOOOOOO.....',
        '.......OOGGGGGGGGOO...',
        '..OOOOOOGGLLLLLLGGOOO.',
        '.OGGGGGYYYYGGGGGCWGGGO',
        'OGGLLLLGGGGLLLLGWWWWGO',
        'OGGGGGYYYYGGGGGGGGGGOO',
        'OODDDDDGGGGDDDDDDDOO..',
        '.OOGGGG....GGGGGOO....',
        'CCCCWWCCCCCCWWCCCCCCCC',
        '.CCCCCCCCCCCCCCCCCCCC.'
      ],
      f1: [
        '.........OOOOOOOO.....',
        '.......OOGGGGGGGGOO...',
        '..OOOOOOGGLLLLLLGGOOO.',
        '.OGGGGGYYYYGGGGGCWGGGO',
        'OGGLLLLGGGGLLLLGWWWWGO',
        'OGGGGGYYYYGGGGGGGGGGOO',
        'OODDDDDGGGGDDDDDDDOO..',
        '..OGGGG....GGGGOO.....',
        'WWCCCCCCWWCCCCCCWWCCCC',
        '.CCCCCCCCCCCCCCCCCCCC.'
      ]
    }
  };

  const ALL_ARCHETYPES = Object.assign({}, MOB_ARCHETYPES, BOSS_ARCHETYPES);

  function getArchetype(archetypeId) {
    return ALL_ARCHETYPES[archetypeId] || MOB_ARCHETYPES.wolf_scout;
  }

  function bakeArchetypeEntry(bakeGridFn, archetypeId, paletteOverride, scale) {
    const base = getArchetype(archetypeId);
    const pal = paletteOverride ? Object.assign({}, base.palette, paletteOverride) : base.palette;
    const sc = scale || (BOSS_ARCHETYPES[archetypeId] ? 2.8 : 2.0);
    return {
      f0: bakeGridFn(base.f0, pal, sc, false),
      f1: bakeGridFn(base.f1 || base.f0, pal, sc, false),
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
