/**
 * 《西游记》九九八十一难 · 十二大独立地域地貌与随机地图拓扑配置 (src/config/terrainRegions81.js)
 *
 * 核心能力：
 * 1. 定义 12 大独立西游地域（REGIONAL_TERRAINS），每个地区拥有完全独立的物理机关、视差地标与随机地图结构母版（archetype）。
 * 2. 将原著第一难至第八十一难（1 ~ 81）逐难精准绑定到对应的地理风貌区、原著地标名与专属随机地图变异参数（twist）。
 * 3. 无缝兼容九重劫卷（NINE_CHAPTERS / tribulations81.js）与自由选劫挑战模式。
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
})('terrainRegions81', function () {
  const REGIONAL_TERRAINS = [
    {
      id: 'liangjie_canyon',
      order: 1,
      name: '两界奇峰·鹰愁涧',
      shortName: '两界鹰愁',
      tribSpanLabel: '第1~9难',
      archetype: 'canyon_bridges',
      terrainLabel: '断崖飞索 · 深涧寒泉与山风上升流',
      mechanicDesc: '高低断崖剧烈起伏，涧底横架悬空古木索桥，山谷裂隙喷涌上升山风助跃绝壁。',
      skyTop: '#0d1b2a',
      skyBottom: '#2b4c59',
      mountainFar: '#1b263b',
      mountainNear: '#2d4a43',
      tileTop: '#52b788',
      tileBody: '#343a40',
      tileBorder: '#95d5b2',
      tilePattern: 'crag_moss',
      platformColor: '#8d5524',
      hazardType: 'ravine_spikes',
      hazardColor: '#48cae4',
      ambientParticle: 'leaf_mist',
      gravityScale: 1.0,
      windStrength: 0,
      landmarkDecor: 'five_elements_seal',
      defaultEnemies: ['wolf_scout', 'tiger_blade', 'goblin_archer'],
      defaultBossId: 'black_bear_king',
      baseRoomWidth: 124
    },
    {
      id: 'heifeng_temple',
      order: 2,
      name: '黑风禅林·观音院',
      shortName: '黑风禅院',
      tribSpanLabel: '第10~11难',
      archetype: 'temple_courtyards',
      terrainLabel: '多层飞檐古刹 · 业火回廊与钟楼天井',
      mechanicDesc: '随机组合院落、双层/三层可登顶飞檐殿宇与火海天井，梁柱间遍布燃烧余烬。',
      skyTop: '#0d1321',
      skyBottom: '#2b191d',
      mountainFar: '#182232',
      mountainNear: '#2b2d42',
      tileTop: '#3a5a40',
      tileBody: '#252438',
      tileBorder: '#ffb703',
      tilePattern: 'temple_brick',
      platformColor: '#7f4f24',
      hazardType: 'ember_spikes',
      hazardColor: '#ff5400',
      ambientParticle: 'ember',
      gravityScale: 1.0,
      windStrength: 0,
      landmarkDecor: 'lantern',
      defaultEnemies: ['wolf_scout', 'goblin_archer', 'shield_bear'],
      defaultBossId: 'black_bear_king',
      baseRoomWidth: 126
    },
    {
      id: 'huangfeng_ridge',
      order: 3,
      name: '黄风狂沙·高老庄',
      shortName: '黄风大漠',
      tribSpanLabel: '第12~14难',
      archetype: 'desert_mesas',
      terrainLabel: '风蚀阶梯沙丘 · 陷足流沙与三昧黄风',
      mechanicDesc: '随机生成高低风蚀岩台与流沙盆地（踏入减速微陷，连跳脱困），伴随周期性三昧狂沙横风！',
      skyTop: '#3b2010',
      skyBottom: '#7f4f24',
      mountainFar: '#4a2c11',
      mountainNear: '#6f4518',
      tileTop: '#e9c46a',
      tileBody: '#582f0e',
      tileBorder: '#f4a261',
      tilePattern: 'sandstone',
      platformColor: '#9c6644',
      hazardType: 'sand_spikes',
      hazardColor: '#f4a261',
      ambientParticle: 'sand',
      gravityScale: 1.0,
      windStrength: 58,
      landmarkDecor: 'broken_buddha',
      defaultEnemies: ['tiger_blade', 'goblin_archer', 'wolf_scout', 'shield_bear'],
      defaultBossId: 'yellow_wind_sage',
      baseRoomWidth: 130
    },
    {
      id: 'liusha_river',
      order: 4,
      name: '八百流沙·万寿山',
      shortName: '流沙五庄',
      tribSpanLabel: '第15~19难',
      archetype: 'river_islets',
      terrainLabel: '弱水沉渊浮筏 · 移动木排与五庄仙苑',
      mechanicDesc: '底层为鹅毛不浮的八百里弱水凶渊，需借随机散落的礁石孤岛、水面移动浮筏与五庄观玉台横渡！',
      skyTop: '#071925',
      skyBottom: '#134054',
      mountainFar: '#0d2b3e',
      mountainNear: '#1b4965',
      tileTop: '#62b6cb',
      tileBody: '#1d3557',
      tileBorder: '#bee9e8',
      tilePattern: 'river_jade',
      platformColor: '#7f5539',
      hazardType: 'weak_water',
      hazardColor: '#00f5d4',
      ambientParticle: 'mist_bubble',
      gravityScale: 1.0,
      windStrength: 0,
      landmarkDecor: 'skull_post',
      defaultEnemies: ['ghost_caster', 'tiger_blade', 'shield_bear', 'goblin_archer'],
      defaultBossId: 'yellow_wind_sage',
      baseRoomWidth: 132
    },
    {
      id: 'baigu_crypt',
      order: 5,
      name: '白骨幽冥·波月洞',
      shortName: '白骨洞窟',
      tribSpanLabel: '第20~23难',
      archetype: 'cavern_crypt',
      terrainLabel: '倒悬钟乳墓穴 · 上下双层分岔尸魔道',
      mechanicDesc: '头顶封闭倒悬钟乳石窟！随机生成上下双层分岔暗道、白骨肋骨走廊与幽冥鬼火毒刺坑。',
      skyTop: '#090612',
      skyBottom: '#1d1233',
      mountainFar: '#160f29',
      mountainNear: '#24193d',
      tileTop: '#7b2cbf',
      tileBody: '#191528',
      tileBorder: '#80ffdb',
      tilePattern: 'crypt_bone',
      platformColor: '#4a4e69',
      hazardType: 'bone_thorns',
      hazardColor: '#80ffdb',
      ambientParticle: 'wisp',
      gravityScale: 1.0,
      windStrength: 0,
      landmarkDecor: 'skull_post',
      defaultEnemies: ['ghost_caster', 'bone_reaper', 'wolf_scout'],
      defaultBossId: 'white_bone_lady',
      baseRoomWidth: 134
    },
    {
      id: 'pingding_grotto',
      order: 6,
      name: '平顶峭壁·车迟高台',
      shortName: '平顶车迟',
      tribSpanLabel: '第24~35难',
      archetype: 'cliff_pillars',
      terrainLabel: '万仞孤峰石柱 · 崩落危岩与九丈祈雨坛',
      mechanicDesc: '万丈云渊耸立随机高矮石柱与九丈道坛，连接处设有踩踏后短暂崩落重组的危岩机关板！',
      skyTop: '#161a2c',
      skyBottom: '#3d2c44',
      mountainFar: '#26233b',
      mountainNear: '#3d3452',
      tileTop: '#e09f3e',
      tileBody: '#2b2d42',
      tileBorder: '#fff3b0',
      tilePattern: 'cliff_slate',
      platformColor: '#9e2a2b',
      hazardType: 'abyss_fire',
      hazardColor: '#ff9f1c',
      ambientParticle: 'ember',
      gravityScale: 1.0,
      windStrength: 0,
      landmarkDecor: 'lantern',
      defaultEnemies: ['flame_imp', 'tiger_blade', 'shield_bear', 'goblin_archer'],
      defaultBossId: 'yellow_wind_sage',
      baseRoomWidth: 136
    },
    {
      id: 'tongtian_glacier',
      order: 7,
      name: '通天冰河·金兜雪山',
      shortName: '通天冰河',
      tribSpanLabel: '第36~41难',
      archetype: 'frozen_glacier',
      terrainLabel: '千里冰封滑面 · 冰窟裂隙与雪峰浮冰',
      mechanicDesc: '通天河冻结为低摩擦玄冰滑面（真实溜冰惯性滑行！），随机分布冰窟寒刺裂口、冰晶柱与漂移浮冰。',
      skyTop: '#071324',
      skyBottom: '#1d4e6e',
      mountainFar: '#163853',
      mountainNear: '#2a5f7e',
      tileTop: '#caf0f8',
      tileBody: '#1b3b5a',
      tileBorder: '#ffffff',
      tilePattern: 'glacier_ice',
      platformColor: '#48cae4',
      hazardType: 'ice_spikes',
      hazardColor: '#90e0ef',
      ambientParticle: 'snow',
      gravityScale: 1.0,
      windStrength: 0,
      landmarkDecor: 'ice_crystal',
      defaultEnemies: ['bull_guard', 'ghost_caster', 'bone_reaper', 'shield_bear'],
      defaultBossId: 'white_bone_lady',
      baseRoomWidth: 136
    },
    {
      id: 'xiliang_spiders',
      order: 8,
      name: '西梁毒泽·盘丝百花',
      shortName: '盘丝毒泽',
      tribSpanLabel: '第42~44 / 52,59,60难',
      archetype: 'spider_thicket',
      terrainLabel: '盘根荆棘密林 · 悬空弹性蛛网与子母毒沼',
      mechanicDesc: '古木荆棘拱顶下随机交织多层盘丝弹性蛛网床（落地弹跃！），低洼处遍布紫雾子母毒沼池。',
      skyTop: '#14081c',
      skyBottom: '#311438',
      mountainFar: '#230e2b',
      mountainNear: '#3b1840',
      tileTop: '#70e000',
      tileBody: '#24162b',
      tileBorder: '#b5179e',
      tilePattern: 'thorn_moss',
      platformColor: '#c77dff',
      hazardType: 'poison_marsh',
      hazardColor: '#b5179e',
      ambientParticle: 'spore',
      gravityScale: 1.0,
      windStrength: 0,
      landmarkDecor: 'spider_cocoon',
      defaultEnemies: ['ghost_caster', 'tiger_blade', 'bone_reaper', 'goblin_archer'],
      defaultBossId: 'white_bone_lady',
      baseRoomWidth: 138
    },
    {
      id: 'huoyan_volcano',
      order: 9,
      name: '八百火焰·翠云魔窟',
      shortName: '火焰魔窟',
      tribSpanLabel: '第45~49难',
      archetype: 'volcano_caldera',
      terrainLabel: '八百里熔岩火海 · 黑曜石孤台与火山热浪喷口',
      mechanicDesc: '大跨度沸腾熔岩火海割裂地表，需借随机黑曜石柱、移动浮石与火山喷口热浪上升气流飞越岩浆！',
      skyTop: '#1a0404',
      skyBottom: '#590d0d',
      mountainFar: '#370617',
      mountainNear: '#6a040f',
      tileTop: '#dc2f02',
      tileBody: '#240b0b',
      tileBorder: '#ffba08',
      tilePattern: 'obsidian_lava',
      platformColor: '#7f1d1d',
      hazardType: 'lava_pool',
      hazardColor: '#ffba08',
      ambientParticle: 'ember_heavy',
      gravityScale: 1.0,
      windStrength: 0,
      landmarkDecor: 'lantern',
      defaultEnemies: ['bull_guard', 'flame_imp', 'bone_reaper'],
      defaultBossId: 'bull_demon_king',
      baseRoomWidth: 142
    },
    {
      id: 'bibo_dragonpalace',
      order: 10,
      name: '祭赛金塔·碧波龙渊',
      shortName: '碧波龙宫',
      tribSpanLabel: '第50~51难',
      archetype: 'underwater_palace',
      terrainLabel: '水底低重力龙宫 · 珊瑚高阙与海眼气泡暗流',
      mechanicDesc: '潜入碧波潭水底水晶宫！享有水下轻盈浮力（滞空更高更远），海眼气泡柱托举角色穿梭多层珊瑚玉台。',
      skyTop: '#031224',
      skyBottom: '#0a3d62',
      mountainFar: '#072540',
      mountainNear: '#0e4166',
      tileTop: '#00f5d4',
      tileBody: '#102a43',
      tileBorder: '#ff70a6',
      tilePattern: 'coral_crystal',
      platformColor: '#ff9ebb',
      hazardType: 'urchin_spikes',
      hazardColor: '#00bbf9',
      ambientParticle: 'bubble',
      gravityScale: 0.78,
      windStrength: 0,
      landmarkDecor: 'pearl_clam',
      defaultEnemies: ['ghost_caster', 'flame_imp', 'bull_guard', 'bone_reaper'],
      defaultBossId: 'white_bone_lady',
      baseRoomWidth: 138
    },
    {
      id: 'shituo_empire',
      order: 11,
      name: '小雷音幻境·狮驼魔城',
      shortName: '狮驼无底',
      tribSpanLabel: '第53~58 / 61~69难',
      archetype: 'demon_citadel',
      terrainLabel: '万妖骷髅城垣 · 陷空山无底深井与机关吊桥',
      mechanicDesc: '重甲妖城壁垒与深陷地底的「无底洞」多层竖井交替随机生成，遍布崩塌机关板与重装妖兵。',
      skyTop: '#16070d',
      skyBottom: '#3b0d1e',
      mountainFar: '#290916',
      mountainNear: '#471224',
      tileTop: '#9d0208',
      tileBody: '#1b141c',
      tileBorder: '#adb5bd',
      tilePattern: 'demon_iron',
      platformColor: '#590d22',
      hazardType: 'iron_spikes',
      hazardColor: '#ff4d6d',
      ambientParticle: 'ash',
      gravityScale: 1.0,
      windStrength: 0,
      landmarkDecor: 'skull_post',
      defaultEnemies: ['bull_guard', 'bone_reaper', 'flame_imp', 'tiger_blade'],
      defaultBossId: 'bull_demon_king',
      baseRoomWidth: 146
    },
    {
      id: 'lingshan_thunder',
      order: 12,
      name: '天竺仙境·凌云大雷音',
      shortName: '灵山雷音',
      tribSpanLabel: '第70~81难',
      archetype: 'celestial_clouds',
      terrainLabel: '万丈云海浮空仙岛 · 七彩祥云弹跳台与凌云独木桥',
      mechanicDesc: '脚下即是万丈金色云渊！随机悬浮高低白玉仙岛、凌云渡独木长桥与七彩祥云弹跳台，直抵大雷音寺！',
      skyTop: '#191233',
      skyBottom: '#4a2c59',
      mountainFar: '#2d1e4a',
      mountainNear: '#5e3a73',
      tileTop: '#ffd166',
      tileBody: '#e9ecef',
      tileBorder: '#ff9f1c',
      tilePattern: 'celestial_gold',
      platformColor: '#ffd60a',
      hazardType: 'thunder_void',
      hazardColor: '#ffd166',
      ambientParticle: 'gold_lotus',
      gravityScale: 0.92,
      windStrength: 0,
      landmarkDecor: 'lotus_lamp',
      defaultEnemies: ['bull_guard', 'flame_imp', 'bone_reaper', 'ghost_caster'],
      defaultBossId: 'bull_demon_king',
      baseRoomWidth: 148
    }
  ];

  function toChineseNum(n) {
    const digits = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    if (n <= 10) return n === 10 ? '十' : digits[n];
    if (n < 20) return '十' + digits[n % 10];
    const tens = Math.floor(n / 10);
    const rem = n % 10;
    return digits[tens] + '十' + digits[rem];
  }

  // 原著全 81 难 -> 独立地形区域 & 地标名 & 随机地图微调词缀
  const RAW_81_TERRAIN = [
    [1, '金蝉遭贬', '灵山贬谪东土', 'liangjie_canyon', { verticality: 1.2 }],
    [2, '出胎几杀', '江州洪江渡口', 'liangjie_canyon', { hazardBias: 0.1 }],
    [3, '满月抛江', '金山寺大江长流', 'liangjie_canyon', { gapBias: 1 }],
    [4, '寻亲报冤', '洪州江畔古栈', 'liangjie_canyon', { verticality: 1.05 }],
    [5, '出城逢虎', '巩州双叉岭虎穴', 'liangjie_canyon', { hazardBias: 0.2, extraElites: 1 }],
    [6, '落坑折从', '双叉岭万丈陷坑', 'liangjie_canyon', { gapBias: 2, hazardBias: 0.25 }],
    [7, '双叉岭上', '双叉岭崇山险道', 'liangjie_canyon', { verticality: 1.3 }],
    [8, '两界山头', '两界山五行山下', 'liangjie_canyon', { verticality: 1.35 }],
    [9, '陡涧换马', '蛇盘山鹰愁陡涧', 'liangjie_canyon', { gapBias: 2, verticality: 1.4 }],

    [10, '夜被火烧', '观音禅院烈火院', 'heifeng_temple', { hazardBias: 0.3 }],
    [11, '失却袈裟', '黑风山芳草坡黑风洞', 'heifeng_temple', { verticality: 1.25, extraElites: 1 }],

    [12, '计收八戒', '高老庄福陵山云栈洞', 'huangfeng_ridge', { windMult: 0.5, verticality: 1.15 }],
    [13, '黄风怪阻', '八百里黄风岭狂沙坡', 'huangfeng_ridge', { windMult: 1.3, hazardBias: 0.2 }],
    [14, '请求灵吉', '黄风洞三昧神风口', 'huangfeng_ridge', { windMult: 1.5, extraElites: 1 }],

    [15, '流沙难渡', '八百里流沙弱水滩', 'liusha_river', { gapBias: 2, hazardBias: 0.2 }],
    [16, '收得沙僧', '流沙河九骷髅漩涡', 'liusha_river', { gapBias: 1, extraElites: 1 }],
    [17, '四圣显化', '莫贾仙庄雕梁庭院', 'liusha_river', { verticality: 1.1 }],
    [18, '五庄观中', '万寿山五庄仙观', 'liusha_river', { verticality: 1.3 }],
    [19, '难活人参', '五庄观人参仙果园', 'liusha_river', { verticality: 1.35, extraElites: 1 }],

    [20, '贬退心猿', '白虎岭荒冢尸魔涧', 'baigu_crypt', { hazardBias: 0.22, extraElites: 1 }],
    [21, '黑松林失散', '碗子山黑松迷林', 'baigu_crypt', { verticality: 1.2 }],
    [22, '宝象国捎书', '碗子山波月妖洞', 'baigu_crypt', { hazardBias: 0.2, extraElites: 1 }],
    [23, '金銮殿变虎', '宝象国妖雾金銮殿', 'baigu_crypt', { verticality: 1.25 }],

    [24, '平顶山逢魔', '平顶山莲花洞峭壁', 'pingding_grotto', { verticality: 1.3 }],
    [25, '莲花洞高悬', '须弥峨眉泰山压顶崖', 'pingding_grotto', { verticality: 1.45, extraElites: 1 }],
    [26, '乌鸡国救主', '乌鸡国八角琉璃深井', 'pingding_grotto', { gapBias: 1 }],
    [27, '被魔化身', '乌鸡国宝林残寺', 'pingding_grotto', { extraElites: 1 }],
    [28, '号山逢怪', '六百里钻头号山赤林', 'pingding_grotto', { hazardBias: 0.2 }],
    [29, '风摄圣僧', '枯松涧火云洞绝壁', 'pingding_grotto', { hazardBias: 0.25, verticality: 1.25 }],
    [30, '心猿遭害', '火云洞五辆火车火阵', 'pingding_grotto', { hazardBias: 0.35, extraElites: 1 }],
    [31, '请圣降妖', '三十六天罡刀莲台崖', 'pingding_grotto', { hazardBias: 0.3 }],
    [32, '黑水河遇怪', '黑水河衡阳峪怒涛涧', 'pingding_grotto', { gapBias: 2 }],
    [33, '搬运车迟', '车迟国三清高阁', 'pingding_grotto', { verticality: 1.2 }],
    [34, '大赌输赢', '车迟国九丈祈雨法台', 'pingding_grotto', { verticality: 1.45 }],
    [35, '祛道兴僧', '车迟国云梯滚油校场', 'pingding_grotto', { hazardBias: 0.28, extraElites: 1 }],

    [36, '路逢大水', '八百里通天寒水岸', 'tongtian_glacier', { gapBias: 1 }],
    [37, '身落天河', '通天河千里冰封裂隙', 'tongtian_glacier', { gapBias: 2, hazardBias: 0.25 }],
    [38, '鱼篮现身', '通天河水鼋冰晶府', 'tongtian_glacier', { extraElites: 1 }],
    [39, '金兜山遇怪', '金兜山独角兕雪洞', 'tongtian_glacier', { verticality: 1.3 }],
    [40, '普天神难伏', '金兜岭金刚琢寒阵', 'tongtian_glacier', { hazardBias: 0.25, extraElites: 1 }],
    [41, '问佛根源', '金兜山绝顶冰峰', 'tongtian_glacier', { verticality: 1.35 }],

    [42, '吃水遭毒', '西梁女国子母河畔', 'xiliang_spiders', { hazardBias: 0.25 }],
    [43, '西梁国留婚', '西梁女儿国百花苑', 'xiliang_spiders', { verticality: 1.15 }],
    [44, '琵琶洞受苦', '毒敌山琵琶蝎毒洞', 'xiliang_spiders', { hazardBias: 0.3, extraElites: 1 }],

    [45, '再贬心猿', '野马岭赤炎裂谷', 'huoyan_volcano', { verticality: 1.2 }],
    [46, '难辨猕猴', '真假美猴王崩山战场', 'huoyan_volcano', { extraElites: 2, verticality: 1.35 }],
    [47, '路阻火焰山', '八百里赤地熔岩海', 'huoyan_volcano', { hazardBias: 0.32, gapBias: 1 }],
    [48, '求取芭蕉扇', '翠云山芭蕉仙洞', 'huoyan_volcano', { verticality: 1.3 }],
    [49, '收缚魔王', '积雷山摩云熔岩魔殿', 'huoyan_volcano', { hazardBias: 0.3, extraElites: 2 }],

    [50, '赛城扫塔', '祭赛国十三层金光塔', 'bibo_dragonpalace', { verticality: 1.45 }],
    [51, '取宝救僧', '乱石山碧波潭水底龙宫', 'bibo_dragonpalace', { verticality: 1.35, extraElites: 1 }],

    [52, '棘林吟咏', '八百里古藤荆棘岭', 'xiliang_spiders', { hazardBias: 0.28, verticality: 1.25 }],

    [53, '小雷音遇难', '小西天小雷音妖寺', 'shituo_empire', { extraElites: 1, verticality: 1.3 }],
    [54, '诸天神遭困', '小雷音金铙困神阵', 'shituo_empire', { hazardBias: 0.25, extraElites: 1 }],
    [55, '稀柿同秽阻', '八百里七绝山稀柿同', 'shituo_empire', { hazardBias: 0.3 }],
    [56, '朱紫国行医', '朱紫国妖氛深宫', 'shituo_empire', { verticality: 1.15 }],
    [57, '拯救疲癃', '麒麟山獬豸金铃洞', 'shituo_empire', { hazardBias: 0.25, extraElites: 1 }],
    [58, '降妖取后', '麒麟山毒火烟沙谷', 'shituo_empire', { hazardBias: 0.3 }],

    [59, '七情迷本', '盘丝岭盘丝洞濯垢泉', 'xiliang_spiders', { verticality: 1.35, hazardBias: 0.22 }],
    [60, '多目遭伤', '黄花观千眼金光毒阵', 'xiliang_spiders', { hazardBias: 0.35, extraElites: 2 }],

    [61, '路阻狮驼', '八百里狮驼白骨岭', 'shituo_empire', { extraElites: 1, verticality: 1.3 }],
    [62, '怪分三色', '狮驼洞青狮白象大鹏坛', 'shituo_empire', { extraElites: 2, verticality: 1.35 }],
    [63, '城里遇灾', '狮驼国万妖骷髅城', 'shituo_empire', { hazardBias: 0.28, extraElites: 2 }],
    [64, '请佛收魔', '狮驼摩云金翅深渊', 'shituo_empire', { gapBias: 2, verticality: 1.4 }],
    [65, '比丘救子', '比丘国迷雾鹅笼街', 'shituo_empire', { verticality: 1.2 }],
    [66, '辨认真邪', '柳林坡清华白鹿洞', 'shituo_empire', { extraElites: 1 }],
    [67, '松林救怪', '镇海禅林寺黑松林', 'shituo_empire', { hazardBias: 0.2 }],
    [68, '僧房卧病', '镇海寺幽暗塔院', 'shituo_empire', { verticality: 1.3 }],
    [69, '无底洞遭困', '陷空山三百里无底深渊', 'shituo_empire', { gapBias: 2, verticality: 1.5, extraElites: 1 }],

    [70, '灭法国难行', '灭法国森严关城', 'lingshan_thunder', { verticality: 1.2 }],
    [71, '隐雾山遇魔', '隐雾山折岳连环洞', 'lingshan_thunder', { hazardBias: 0.2, extraElites: 1 }],
    [72, '凤仙郡求雨', '凤仙郡九天劫云坛', 'lingshan_thunder', { verticality: 1.35 }],
    [73, '失落兵器', '玉华州豹头山藏兵谷', 'lingshan_thunder', { extraElites: 1 }],
    [74, '会庆钉钯', '豹头山虎口妖洞', 'lingshan_thunder', { extraElites: 1, hazardBias: 0.2 }],
    [75, '竹节山遭难', '竹节山九曲盘桓洞', 'lingshan_thunder', { verticality: 1.4, extraElites: 2 }],
    [76, '玄英洞受苦', '青龙山玄英寒犀洞', 'lingshan_thunder', { hazardBias: 0.25, extraElites: 1 }],
    [77, '赶捉犀牛', '西洋沧海四木星宿阵', 'lingshan_thunder', { gapBias: 2 }],
    [78, '天竺招婚', '毛颖山广寒玉兔仙阙', 'lingshan_thunder', { verticality: 1.35, extraElites: 1 }],
    [79, '铜台府监禁', '铜台府地灵幽冥院', 'lingshan_thunder', { hazardBias: 0.22 }],
    [80, '凌云渡脱胎', '灵山凌云渡独木虹桥', 'lingshan_thunder', { gapBias: 2, verticality: 1.5 }],
    [81, '通天河湿经书', '通天晒经石·九九归真', 'lingshan_thunder', { gapBias: 2, verticality: 1.45, extraElites: 2 }]
  ];

  const REGION_BY_ID = {};
  REGIONAL_TERRAINS.forEach((r) => {
    REGION_BY_ID[r.id] = r;
  });

  const TRIBULATION_TERRAINS = RAW_81_TERRAIN.map((row) => {
    const no = row[0];
    const reg = REGION_BY_ID[row[3]] || REGIONAL_TERRAINS[0];
    return {
      no,
      numLabel: `第${toChineseNum(no)}难`,
      tribName: row[1],
      location: row[2],
      regionId: reg.id,
      regionName: reg.name,
      terrainLabel: reg.terrainLabel,
      twist: row[4] || {}
    };
  });

  function getRegionById(regionId) {
    return REGION_BY_ID[regionId] || REGIONAL_TERRAINS[0];
  }

  function getTribulationTerrain(no) {
    const idx = Math.max(1, Math.min(81, Math.round(no || 1))) - 1;
    return TRIBULATION_TERRAINS[idx] || TRIBULATION_TERRAINS[0];
  }

  function getTribulationsInRegion(regionId) {
    return TRIBULATION_TERRAINS.filter((t) => t.regionId === regionId);
  }

  /**
   * 为一局随机肉鸽生成「不撞地形」的西行路线：
   * 从 12 大独立地域中分段抽取不同地域，并在每个地域内随机抽取一难！
   */
  function rollWestwardRoute(stageCount) {
    const count = Math.min(REGIONAL_TERRAINS.length, Math.max(4, stageCount || 6));
    const total = REGIONAL_TERRAINS.length;
    const route = [];
    for (let i = 0; i < count; i++) {
      const s = Math.floor((i * total) / count);
      const e = Math.max(s, Math.floor(((i + 1) * total) / count) - 1);
      const reg = REGIONAL_TERRAINS[s + Math.floor(Math.random() * (e - s + 1))];
      const list = getTribulationsInRegion(reg.id);
      const picked = list[Math.floor(Math.random() * list.length)] || TRIBULATION_TERRAINS[0];
      route.push(picked.no);
    }
    return route;
  }

  /**
   * 破劫后提供 2 条【不同独立地域】的下一劫分岔门供玩家选择（类死亡细胞路线分岔！）
   */
  function rollNextTribulationDoors(currentTribNo) {
    const cur = getTribulationTerrain(currentTribNo);
    const curReg = getRegionById(cur.regionId);
    if (cur.no >= 81) {
      const r1 = REGIONAL_TERRAINS[Math.floor(Math.random() * 6)];
      const r2 = REGIONAL_TERRAINS[6 + Math.floor(Math.random() * 6)];
      const l1 = getTribulationsInRegion(r1.id);
      const l2 = getTribulationsInRegion(r2.id);
      return [
        l1[Math.floor(Math.random() * l1.length)],
        l2[Math.floor(Math.random() * l2.length)]
      ];
    }

    const nextReg1 =
      REGIONAL_TERRAINS.find((r) => r.order > curReg.order) ||
      REGIONAL_TERRAINS[REGIONAL_TERRAINS.length - 1];
    const pool1 = getTribulationsInRegion(nextReg1.id).filter((t) => t.no > cur.no);
    const door1 =
      pool1.length > 0
        ? pool1[Math.floor(Math.random() * pool1.length)]
        : getTribulationTerrain(Math.min(81, cur.no + 1));

    const altOrder = Math.min(REGIONAL_TERRAINS.length, nextReg1.order + 1);
    const nextReg2 =
      REGIONAL_TERRAINS.find((r) => r.order === altOrder && r.id !== door1.regionId) ||
      REGIONAL_TERRAINS[nextReg1.order % REGIONAL_TERRAINS.length];
    const pool2 = getTribulationsInRegion(nextReg2.id);
    const door2 =
      pool2.length > 0
        ? pool2[Math.floor(Math.random() * pool2.length)]
        : getTribulationTerrain(Math.min(81, door1.no + 1));

    return [door1, door2];
  }

  return {
    REGIONAL_TERRAINS,
    TRIBULATION_TERRAINS,
    getRegionById,
    getTribulationTerrain,
    getTribulationsInRegion,
    rollWestwardRoute,
    rollNextTribulationDoors
  };
});
