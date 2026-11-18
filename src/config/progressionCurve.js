/**
 * 《西游破劫录》游戏曲线、天道司命随机发牌器与长线留存数值引擎
 * (src/config/progressionCurve.js)
 *
 * 设计目标：
 * 1. 【快节奏单局曲线】：锚定单局 4.5~5.5 分钟（四劫巡礼 + 终劫妖尊），小怪 TTK 0.8~1.3s，Boss TTK 14~24s，
 *    采用「微指数成长 + 3/6/9卷质变阶跃 + 第三劫锯齿压迫波峰（激励复活黄金锚点）」心流模型。
 * 2. 【局局有新鲜感】：五维正交随机矩阵（八十一难四洲动态抽劫 × 15大开局本命法相 × 天道异象规则 × 五行双系融合 × 西游奇遇），
 *    内置「近3局记忆去重（Anti-Repeat Entropy Director）」，确保连续开局绝不撞图、不撞词条。
 * 3. 【可长期维护】：垂直数值双曲软上限（防膨胀）+ 水平法宝图鉴扩池 + 紧箍封印屏蔽槽（防卡池稀释）+ 每日同种挑战赛（零服务端成本长线运营）。
 *
 * 兼容规范：同项目 UMD / XiyouRegistry 无构建双端规范（浏览器 & 抖音小游戏 & Node 测试直跑）。
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
})('progressionCurve', function () {
  // ============================================================================
  // 一、确定性随机种子引擎（支持「每日一难/每周同种词条赛」与复现调试）
  // ============================================================================
  function hashSeedString(str) {
    let h = 2166136261 >>> 0;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function createSeededRng(seedInput) {
    let state =
      typeof seedInput === 'number'
        ? seedInput >>> 0
        : seedInput
          ? hashSeedString(seedInput)
          : (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
    if (state === 0) state = 0x6d2b79f5;

    const next = function () {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    return {
      seed: state,
      next,
      range(min, max) {
        return min + next() * (max - min);
      },
      int(min, max) {
        return Math.floor(next() * (max - min + 1)) + min;
      },
      pick(arr) {
        if (!arr || !arr.length) return null;
        return arr[Math.floor(next() * arr.length)];
      },
      weightedPick(items, weightFn) {
        if (!items || !items.length) return null;
        let total = 0;
        const weights = new Array(items.length);
        for (let i = 0; i < items.length; i++) {
          const w = Math.max(0.0001, weightFn(items[i], i));
          weights[i] = w;
          total += w;
        }
        let roll = next() * total;
        for (let i = 0; i < items.length; i++) {
          roll -= weights[i];
          if (roll <= 0) return items[i];
        }
        return items[items.length - 1];
      }
    };
  }

  function getDailyChallengeSeed(dateObj) {
    const d = dateObj || new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `XIYOU_DAILY_${yyyy}_${mm}_${dd}`;
  }

  // ============================================================================
  // 二、单局 5 分钟快节奏数值曲线配置（锯齿状心流张力模型）
  // ============================================================================
  const PACING_CURVE_CONFIG = {
    // 单局标准结构：4 劫巡礼（每劫 55~75 秒）= 总时长约 4.5 ~ 5.5 分钟
    actsPerRun: 4,
    targetActSeconds: [60, 72, 78, 80], // 各劫目标心流时长（秒）

    // 玩家三才天书微指数成长率：P(s) = Base * (1.145^s) * BreakpointMult
    scrollCompoundBase: 1.145, // 主属性每多1卷，独立乘算 +14.5%（解决原版线性 1+0.18r 后期衰减乏力问题）
    offScrollCompoundBase: 1.045, // 副属性微幅乘算增益
    hpScrollRates: { red: 0.09, purple: 0.07, green: 0.20 },

    // 3 / 6 / 9 卷同系天书「神通质变阶跃断点」（制造局内阶段性爽点爆发！）
    scrollBreakpoints: [
      {
        count: 3,
        tierName: '小成·灵窍初开',
        dpsBonusMult: 1.16,
        cdHasteBonus: 0.08,
        desc: '主属性满3卷：普攻第3段附带破甲真气波，冷却流逝加速 +8%'
      },
      {
        count: 6,
        tierName: '大成·法相觉醒',
        dpsBonusMult: 1.32,
        cdHasteBonus: 0.16,
        desc: '主属性满6卷：本命神通形态进化（范围+35% / 额外残影追击），移速 +10%'
      },
      {
        count: 9,
        tierName: '化境·齐天无双',
        dpsBonusMult: 1.52,
        cdHasteBonus: 0.25,
        desc: '主属性满9卷：暴击附带斩杀雷火（低于15%气血小怪直接处决），全屏割草态'
      }
    ],

    // 怪物基础成长斜率与「锯齿张力调制因子 ψ(t)」
    enemyStageCompound: 1.38, // 每进一劫基础生命乘算 1.38x
    enemyAtkStageCompound: 1.22, // 怪物伤害温和增长，维持 3~4 刀容错窗口
    // ψ(t) 锯齿调制：
    // Act 0 (1.00): 破冰上手，3秒进战斗，小怪3刀秒
    // Act 1 (0.95): 让刚拿到3卷质变的玩家体验一波「爽快超车」
    // Act 2 (1.14): 【核心商业化与心流波峰】故意收紧剪刀差，形成高压试炼与「观音甘露复活」最佳转化点
    // Act 3 (0.97): 6卷法相觉醒后释放爽感，先清屏割草 40 秒，再迎战双阶段终劫妖尊
    sawtoothTensionPsi: [1.0, 0.95, 1.14, 0.97],

    // 连斩破劫极速机制（消灭跑图垃圾时间，越杀越快）
    momentumCurve: {
      maxStacks: 25,
      decaySeconds: 4.0,
      moveSpeedBonusMax: 0.22, // 满战意移速 +22%
      cdRateBonusMax: 0.26, // 满战意技能冷却恢复速度 +26%
      atkSpeedBonusMax: 0.15 // 满战意出招速度 +15%
    },

    // Boss 动态护栏（防秒杀失去博弈 & 防脸黑刮痧）
    bossGuardrail: {
      maxSingleHitRatio: 0.14, // 单次伤害不超过 Boss 最大生命 14%（防数值溢出瞬秒）
      staggerThresholdRatio: 0.28, // 累计打掉 28% 血量或背刺重击满槽触发 2.2s 破防处决易伤 (+35% 伤害)
      enrageHpRatio: 0.5
    },

    // 天道隐性动态难度保护（DDA：防新手连续受挫退游，玩家无感知）
    ddaRules: {
      lowHpEntryThreshold: 0.38, // 残血进新劫时，首个精英必掉回血大肉包
      consecutiveFailPity: 2, // 连续 2 局未过第2劫，下局开局法宝匣升级为双词条紫品法宝
      highSkillBonusElite: 0.85 // 若上一劫无伤通关，下一劫额外刷1只高爆率黄金巡山妖将
    }
  };

  // ============================================================================
  // 三、局局新鲜感：五维正交随机内容池（法相 × 八十一难池 × 异象 × 融合 × 奇遇）
  // ============================================================================

  // 维度 1：五大角色 × 3 种开局「本命法相」（共 15 种第0秒手感变招）
  const HERO_ASPECTS = {
    wukong: [
      {
        id: 'wk_aspect_clone',
        name: '身外毫毛相',
        tag: 'red',
        element: 'thunder',
        desc: '第3段重棍与翻滚额外唤出1尊金猴分身协同挥砸，普攻距离+15%',
        mods: { cloneOnCombo3: true, rangeMult: 1.15, atkMult: 1.05 }
      },
      {
        id: 'wk_aspect_pillar',
        name: '定海千钧相',
        tag: 'green',
        element: 'wind',
        desc: '金箍棒巨化！挥速略降10%，但每击附带震地罡风冲击波且撞墙破甲伤害翻倍',
        mods: { heavyShockwave: true, wallSplatMult: 2.0, atkMult: 1.24 }
      },
      {
        id: 'wk_aspect_havoc',
        name: '齐天狂雷相',
        tag: 'purple',
        element: 'thunder',
        desc: '暴击必定落下一道紫霄奔雷连锁2名妖魔，本命神通冷却缩短25%',
        mods: { chainLightningOnCrit: 2, skillCdMult: 0.75 }
      }
    ],
    tangseng: [
      {
        id: 'ts_aspect_dharma',
        name: '大乘万佛相',
        tag: 'purple',
        element: 'holy',
        desc: '锡杖法球分裂为三道散射佛珠，命中叠满5层「度化」直接引爆金莲',
        mods: { splitProjectiles: 3, purifyStackBoom: 5 }
      },
      {
        id: 'ts_aspect_vajra',
        name: '怒目金刚相',
        tag: 'green',
        element: 'holy',
        desc: '护盾存在时法术暴击率+30%，甘露净瓶额外召唤持续6秒的护法金钟',
        mods: { shieldCritBonus: 0.3, flaskSummonBell: true }
      },
      {
        id: 'ts_aspect_sutra',
        name: '紧箍咒言相',
        tag: 'red',
        element: 'fire',
        desc: '被眩晕的妖魔头顶浮现赤金紧箍，每秒受到高频业火灼烧并传染周围',
        mods: { stunBurnContagion: true, stunDmgMult: 1.35 }
      }
    ],
    bajie: [
      {
        id: 'bj_aspect_glutton',
        name: '饕餮吞天相',
        tag: 'green',
        element: 'holy',
        desc: '每吃1个大肉包永久增加本局 +8 最大气血，满血也能吃包溢出转化为功德金身护盾',
        mods: { bunPermStackHp: 8, overhealToShield: true }
      },
      {
        id: 'bj_aspect_marshal',
        name: '天蓬星河相',
        tag: 'purple',
        element: 'water',
        desc: '旋风钉耙期间掀起银河弱水漩涡聚拢全屏敌人，结束时炸出寒冰水柱',
        mods: { spinPullVortex: true, spinEndNova: 'water' }
      },
      {
        id: 'bj_aspect_berserk',
        name: '狂齿破军相',
        tag: 'red',
        element: 'fire',
        desc: '气血越低攻速与暴击越高（最高+45%），钉耙第2段回勾必定撕裂流血',
        mods: { lowHpFrenzy: 0.45, pullBleed: true }
      }
    ],
    wujing: [
      {
        id: 'wj_aspect_abyss',
        name: '弱水三千相',
        tag: 'purple',
        element: 'water',
        desc: '流沙玄水阵上限变为2座且面积扩大35%，阵内妖魔弹幕速度降低60%',
        mods: { maxVortexCharges: 2, vortexRadiusMult: 1.35 }
      },
      {
        id: 'wj_aspect_crescent',
        name: '朔月追魂相',
        tag: 'red',
        element: 'wind',
        desc: '每段普攻皆发射穿透月牙气刃，气刃飞至尽头会折返二次切割',
        mods: { allComboWave: true, waveBoomerang: true }
      },
      {
        id: 'wj_aspect_guardian',
        name: '卷帘镇岳相',
        tag: 'green',
        element: 'holy',
        desc: '空中千钧下砸会在地面立起琉璃宝幢，为你持续抵挡远程飞行道具并提供减伤',
        mods: { slamSpawnBanner: true, bannerDefBonus: 0.25 }
      }
    ],
    bailongma: [
      {
        id: 'bl_aspect_soar',
        name: '九霄雷龙相',
        tag: 'red',
        element: 'thunder',
        desc: '滞空状态下伤害提升32%，每次二/三段跳向下方投射3枚龙鳞雷枪',
        mods: { airborneDmgMult: 1.32, jumpSpearRain: 3 }
      },
      {
        id: 'bl_aspect_mirage',
        name: '沧海幻龙相',
        tag: 'purple',
        element: 'wind',
        desc: '翻滚无冷却但消耗龙息（2层充能），穿过敌人必定重置本命真龙闪2秒冷却',
        mods: { rollCharges: 2, dashResetSkillSec: 2.0 }
      },
      {
        id: 'bl_aspect_frost',
        name: '西海玄冰相',
        tag: 'green',
        element: 'water',
        desc: '突刺叠满寒霜冻结敌人1.2秒，对冻结目标触发碎冰必暴重击',
        mods: { freezeOnHitStacks: 4, shatterCritMult: 2.2 }
      }
    ]
  };

  // 维度 2：九九八十一难 · 四大部洲代表性劫难模板池（当 biomes 尚未扩充至 81 难时自动提供变体映射，若已扩充则无缝接管！）
  const EIGHTY_ONE_TRIBULATION_ARCHETYPES = [
    // 第一境：初出长安 · 山林古刹劫（Act 1 抽样池）
    { id: 'trib_01_shuangcha', tier: 0, title: '双叉岭寅虎劫', baseBiome: 'heifeng', theme: '密林陷阱·猛虎扑杀', rewardBias: 'scroll', bossTitle: '寅将军 · 啸山君' },
    { id: 'trib_05_yingchou', tier: 0, title: '鹰愁涧寒潭劫', baseBiome: 'baigu', theme: '断涧飞栈·急流暗箭', rewardBias: 'weapon', bossTitle: '寒潭孽蛟 · 裂浪王' },
    { id: 'trib_06_guanyin', tier: 0, title: '黑风山袈裟劫', baseBiome: 'heifeng', theme: '夜火禅院·黑风枪阵', rewardBias: 'scroll', bossTitle: '黑风大王 · 熊罴精' },
    { id: 'trib_08_gaolao', tier: 0, title: '云栈洞高老庄', baseBiome: 'huangfeng', theme: '狂风庄院·九齿横扫', rewardBias: 'gold', bossTitle: '猪刚鬣 · 魔化巨彘' },

    // 第二境：黄沙西域 · 古国狂风劫（Act 2 抽样池）
    { id: 'trib_10_huangfeng', tier: 1, title: '黄风岭三昧劫', baseBiome: 'huangfeng', theme: '迷眼狂沙·旋风吹飞', rewardBias: 'weapon', bossTitle: '黄风大圣 · 貂鼠精' },
    { id: 'trib_12_liusha', tier: 1, title: '八百里流沙河', baseBiome: 'baigu', theme: '浮木沉沙·水刃暗涌', rewardBias: 'mutation', bossTitle: '流沙水魔 · 九骷妖' },
    { id: 'trib_15_wuzhuang', tier: 1, title: '万寿山五庄观', baseBiome: 'heifeng', theme: '仙观高台·乾坤袖风', rewardBias: 'event', bossTitle: '清风明月 · 护观仙傀' },
    { id: 'trib_19_pingding', tier: 1, title: '平顶山莲花洞', baseBiome: 'huoyan', theme: '金银法宝·葫芦吸魂', rewardBias: 'weapon', bossTitle: '金角银角 · 双魔将' },

    // 第三境：幽冥洞天 · 奇诡妖魔劫（Act 3 高压试炼池）
    { id: 'trib_20_baigu', tier: 2, title: '白虎岭三打劫', baseBiome: 'baigu', theme: '凄迷鬼火·幻影瞬移', rewardBias: 'scroll', bossTitle: '白骨夫人 · 千幻尸魔' },
    { id: 'trib_28_huoyun', tier: 2, title: '号山枯松火云洞', baseBiome: 'huoyan', theme: '火箭连珠·三昧火海', rewardBias: 'weapon', bossTitle: '圣婴大王 · 红孩儿' },
    { id: 'trib_38_jindou', tier: 2, title: '金兜山独角洞', baseBiome: 'huangfeng', theme: '金刚神环·缴械震地', rewardBias: 'forge', bossTitle: '独角兕大王 · 青牛精' },
    { id: 'trib_55_pansi', tier: 2, title: '盘丝岭千蛛窟', baseBiome: 'baigu', theme: '蛛网减速·毒针暗袭', rewardBias: 'mutation', bossTitle: '百眼魔君 · 多目金蜈' },

    // 第四境：魔域伪佛 · 终劫大妖尊（Act 4 决战池）
    { id: 'trib_47_huoyan', tier: 3, title: '八百里火焰山', baseBiome: 'huoyan', theme: '熔岩崩裂·平天魔威', rewardBias: 'legendary', bossTitle: '平天大圣 · 牛魔王' },
    { id: 'trib_52_xiaoleiyin', tier: 3, title: '小雷音寺伪佛劫', baseBiome: 'huangfeng', theme: '金铙封困·人种袋吸', rewardBias: 'legendary', bossTitle: '黄眉老佛 · 弥勒童' },
    { id: 'trib_61_shituo', tier: 3, title: '八百里狮驼岭', baseBiome: 'huoyan', theme: '万妖齐冲·阴阳二气瓶', rewardBias: 'legendary', bossTitle: '金翅大鹏雕 · 迦楼罗' },
    { id: 'trib_72_wudidong', tier: 3, title: '陷空山无底洞', baseBiome: 'baigu', theme: '深渊暗影·双剑魅影', rewardBias: 'legendary', bossTitle: '地涌夫人 · 半截观音' }
  ];

  // 维度 3：每局「天道异象」（Kiss-Curse 正负双向全局规则词条，彻底改变单局打法节奏）
  const WORLD_MUTATORS = [
    {
      id: 'mut_blood_moon',
      name: '血月狂劫',
      badgeColor: '#ff4d6d',
      desc: '群妖移速与攻击 +20%，但你的技能与法宝冷却缩短 35%，击杀必爆回血血珠！',
      effects: { enemySpeedMult: 1.2, enemyAtkMult: 1.2, playerCdMult: 0.65, bloodOrbOnKill: 0.03 }
    },
    {
      id: 'mut_blitz_pocket',
      name: '缩地成寸',
      badgeColor: '#ffd166',
      desc: '关卡长度缩短 30%（极速直捣黄龙），精英妖将数量翻倍且必掉双倍三才天书！',
      effects: { mapWidthMult: 0.7, eliteCountMult: 2, doubleEliteScroll: true }
    },
    {
      id: 'mut_heaven_thunder',
      name: '紫霄雷罚',
      badgeColor: '#00f5d4',
      desc: '每 7 秒天降3道神雷轰击地面（有预警圈），可走位引雷秒杀护盾怪与重创妖王！',
      effects: { periodicSkyThunderSec: 7.0, thunderFriendlyFire: true }
    },
    {
      id: 'mut_alchemy_boom',
      name: '丹炉失控',
      badgeColor: '#ff9f1c',
      desc: '所有妖魔阵亡后留下一颗1.2秒后引爆的三昧火丹，连环引爆清屏爽感翻倍！',
      effects: { enemyDeathBomb: true, bombRadius: 68 }
    },
    {
      id: 'mut_glass_cannon',
      name: '修罗破釜',
      badgeColor: '#b5179e',
      desc: '角色最大气血锁定 -30%，但最终伤害提升 +55% 且翻滚无敌帧延长 0.12 秒！',
      effects: { playerMaxHpMult: 0.7, playerDmgMult: 1.55, bonusRollInvuln: 0.12 }
    },
    {
      id: 'mut_golden_fortune',
      name: '功德金雨',
      badgeColor: '#ffe57f',
      desc: '灵蕴与金铢掉落 +60%，每持100金铢额外提供 +8% 暴击伤害，但受击会掉落少量金铢！',
      effects: { lootMult: 1.6, goldScalingCritDmg: 0.08, dropGoldOnHurt: true }
    },
    {
      id: 'mut_giant_brawl',
      name: '法天象地',
      badgeColor: '#69f0ae',
      desc: '你与妖王的攻击体积同时扩大 28%，击飞撞墙粉碎（Wall-Splat）伤害提升 100%！',
      effects: { hitboxScaleMult: 1.28, wallSplatMult: 2.0 }
    }
  ];

  // 维度 4：五行元素共鸣（2/4/6 阶机制质变）与双系仙术融合（Duo Synergies）
  const ELEMENT_LABELS = {
    fire: { short: '火', name: '三昧真火', color: '#ff6e40' },
    thunder: { short: '雷', name: '九霄狂雷', color: '#00e5ff' },
    water: { short: '水', name: '弱水玄冰', color: '#6cd4ff' },
    wind: { short: '风', name: '九天罡风', color: '#69f0ae' },
    holy: { short: '圣', name: '佛门金身', color: '#ffd166' }
  };

  const ELEMENTAL_SYNERGIES = {
    fire: {
      name: '三昧真火',
      color: '#ff6e40',
      tiers: {
        2: '攻击附加【灼烧】持续掉血',
        4: '被灼烧妖魔阵亡时引发火焰殉爆波及邻近敌人',
        6: '【焚天化境】暴击瞬间引爆目标全部剩余灼烧层数，翻滚留下火径'
      }
    },
    thunder: {
      name: '九霄狂雷',
      color: '#00e5ff',
      tiers: {
        2: '命中 25% 概率触发闪电链弹射2名敌人',
        4: '释放神通或法宝时降下落雷麻痹周围群妖0.6秒',
        6: '【雷池化境】闪电链弹射次数+4且每次弹射伤害递增15%'
      }
    },
    water: {
      name: '弱水玄冰',
      color: '#6cd4ff',
      tiers: {
        2: '攻击附带【寒霜】减速30%',
        4: '叠满寒霜冻结敌人1.2秒，期间受击破冰爆伤+40%',
        6: '【冥海化境】场上有敌人被冻结时，你的所有技能冷却流逝速度翻倍'
      }
    },
    wind: {
      name: '九天罡风',
      color: '#69f0ae',
      tiers: {
        2: '移速+12%，击退距离提升35%（更易撞墙破甲）',
        4: '翻滚与跳跃卷起风刃切割路径妖魔并偏转飞行弹幕',
        6: '【扶摇化境】每10%额外移速转化为18%最终暴击伤害加成'
      }
    },
    holy: {
      name: '佛门金身',
      color: '#ffd166',
      tiers: {
        2: '进入每劫自动获得18%最大生命功德护盾',
        4: '拥有护盾或满血时，普攻与法宝发射穿透佛光剑气',
        6: '【丈六金身】护盾破碎瞬间触发全屏2秒金莲时停震晕并反伤300%'
      }
    }
  };

  const DUO_FUSIONS = [
    {
      id: 'duo_fire_wind',
      req: ['fire', 'wind'],
      name: '风助火势 · 业火龙卷',
      desc: '罡风类技能触碰灼烧目标时，立即卷起横扫全屏的巨型三昧火龙卷！'
    },
    {
      id: 'duo_water_thunder',
      req: ['water', 'thunder'],
      name: '雷泽感电 · 万雷穿心',
      desc: '处于减速/水阵中的妖魔受到雷电伤害提升50%，且闪电链必定全额传导！'
    },
    {
      id: 'duo_holy_fire',
      req: ['holy', 'fire'],
      name: '红莲业火 · 净世金身',
      desc: '功德护盾每秒自动炙烤周围敌人，护盾值越高灼烧倍率越高！'
    },
    {
      id: 'duo_wind_thunder',
      req: ['wind', 'thunder'],
      name: '踏风惊雷 · 瞬狱闪',
      desc: '每次击飞撞墙（Wall-Splat）自动在墙面劈落一道暴击紫霄神雷！'
    }
  ];

  // 维度 5：关卡中段 8 秒快决策「西游因果奇遇」（风险收益博弈，制造每局故事记忆点）
  const KARMIC_EVENTS = [
    {
      id: 'evt_ginseng_tree',
      title: '五庄观 · 人参果树',
      prompt: '偶遇千年人参果树仙光萦绕，镇元道童似在打盹……',
      choiceA: { label: '恭敬求取一果', effectDesc: '稳健恢复 60% 气血并补满1次甘露净瓶', risk: 'low' },
      choiceB: { label: '挥棒偷打三颗！', effectDesc: '连获 2 卷主属性天书！但本劫妖王开局进入狂暴态', risk: 'high' }
    },
    {
      id: 'evt_six_ear_mirror',
      title: '真假美猴王 · 心魔古镜',
      prompt: '照妖古镜映出六耳幻影，挑衅你赌斗十招！',
      choiceA: { label: '迎战心魔（限时15s）', effectDesc: '击败精英幻影后，当前副武器直接升阶为【神话双词条】', risk: 'high' },
      choiceB: { label: '敲碎古镜摄取灵蕴', effectDesc: '直接获得 +45 灵蕴与 +15% 护盾', risk: 'low' }
    },
    {
      id: 'evt_laozi_furnace',
      title: '兜率宫 · 遗落八卦炉',
      prompt: '太上老君炼丹炉余火未熄，可投入随身法宝重炼真火词条。',
      choiceA: { label: '投入法宝三昧重铸', effectDesc: '75% 概率法宝倍率+45%并附魔真火；25% 炼化为3卷天书', risk: 'medium' },
      choiceB: { label: '吞服炉边金丹', effectDesc: '随机获得1项稀有仙缘变异，但扣除当前 20% 生命值', risk: 'medium' }
    },
    {
      id: 'evt_guanyin_willow',
      title: '南海紫竹 · 观音垂柳',
      prompt: '菩萨净瓶垂下一枝杨柳，可洗练本局命数。',
      choiceA: { label: '柳枝重铸三才归宗', effectDesc: '将你最低的一系天书点数全部转移至最高主属性！（瞬间凑满6卷觉醒）', risk: 'reward' },
      choiceB: { label: '祈求救命毫毛', effectDesc: '获得1次免费原地涅槃印记（不消耗广告复活次数）', risk: 'low' }
    }
  ];

  // ============================================================================
  // 四、长期维护架构：软上限局外曲线 + 紧箍封印池过滤 + 九转轮回劫度
  // ============================================================================

  /**
   * 双曲软上限函数：Bonus(lv) = maxCap * (lv / (lv + halfLv))
   * 优势：前5级收益陡峭（新手前3天爽快成长），后期无限逼近 maxCap 但绝不超模崩坏！
   * 哪怕未来维护2年玩家攒了十万灵蕴，也不会出现进图一刀秒Boss导致动作机制作废的问题。
   */
  function calcSoftCapBonus(level, maxCap, halfLevel) {
    const lv = Math.max(0, level || 0);
    if (lv === 0) return 0;
    return maxCap * (lv / (lv + halfLevel));
  }

  const LONG_TERM_META_CONFIG = {
    verticalCaps: {
      maxHpRatioBonus: { maxCap: 0.65, halfLv: 6 }, // 局外气血最高软上限 +65%
      atkRatioBonus: { maxCap: 0.55, halfLv: 6 }, // 局外攻击最高软上限 +55%
      critRateBonus: { maxCap: 0.18, halfLv: 5 }, // 局外暴击最高软上限 +18%
      flaskHealBonus: { maxCap: 0.30, halfLv: 4 } // 甘露单口回复最高软上限 +30%
    },
    // 水平成长（不加纯面板，而加「构筑自由度」——肉鸽长线留存真正的灵魂！）
    horizontalUnlocks: [
      { id: 'reroll_dice', name: '观音杨柳骰（重随次数）', maxLv: 4, desc: '可在天书/变异/法宝三选一时免费刷新选项，提升胡牌率' },
      { id: 'banish_seal', name: '紧箍封印槽（卡池屏蔽）', maxLv: 6, desc: '开局前可封印不喜欢的法宝/变异，完美解决长期更新后卡池稀释痛点！' },
      { id: 'starter_aspect_unlock', name: '法相真灵谱', maxLv: 15, desc: '逐步解锁五师徒共15种截然不同的开局本命法相' },
      { id: 'codex_81_tribulations', name: '八十一难降魔图鉴', maxLv: 81, desc: '每首通1难解锁对应妖王图鉴与像素武器幻化，提供90天以上收集长尾目标' }
    ]
  };

  // 九转轮回劫度（0~9 劫，类死亡细胞 Boss Cells / 哈迪斯热度契约）
  const ASCENSION_TIERS = [
    { level: 0, name: '凡胎初渡（0劫）', enemyMult: 1.0, soulBonus: 1.0, rule: '标准快节奏心流，适合解锁角色与收集法宝图谱' },
    { level: 1, name: '小乘试炼（一劫）', enemyMult: 1.22, soulBonus: 1.35, rule: '精英妖将获得随机护体元素词条，妖王二阶段攻速+12%' },
    { level: 2, name: '心猿意马（二劫）', enemyMult: 1.48, soulBonus: 1.75, rule: '过关休整仅补1口甘露净瓶，出现跨部洲伏兵妖魔' },
    { level: 3, name: '三灾利害（三劫）', enemyMult: 1.80, soulBonus: 2.25, rule: '每劫叠加双倍天道异象，精英怪必带1名护法妖僧' },
    { level: 4, name: '五蕴皆空（四劫）', enemyMult: 2.15, soulBonus: 2.85, rule: '受击叠加「魔障」印记，需积极进攻连斩消解魔障' },
    { level: 5, name: '九转金丹（五~九劫）', enemyMult: 2.60, soulBonus: 3.60, rule: '开启【紧箍自选戒律榜】自由勾选词条冲刺全服破劫榜！' }
  ];

  // ============================================================================
  // 五、核心曲线计算与「天道司命」每局不重样发牌 API
  // ============================================================================

  /**
   * 计算玩家在当前天书卷数与连斩战意下的实时快节奏战斗面板倍率
   */
  function calcPlayerCurveStats(params) {
    const scrolls = params.scrolls || { red: 1, purple: 1, green: 1 };
    const mainAffinity = params.mainAffinity || 'red';
    const metaLevels = params.metaLevels || {};
    const momentumStacks = Math.min(
      PACING_CURVE_CONFIG.momentumCurve.maxStacks,
      Math.max(0, params.momentumStacks || 0)
    );

    const r = Math.max(0, (scrolls.red || 1) - 1);
    const p = Math.max(0, (scrolls.purple || 1) - 1);
    const g = Math.max(0, (scrolls.green || 1) - 1);

    const mainCount = mainAffinity === 'red' ? r : mainAffinity === 'purple' ? p : g;
    const offCount = r + p + g - mainCount;

    // 1. 局外双曲软上限乘区（长期维护不崩坏）
    const metaAtkBonus = calcSoftCapBonus(
      metaLevels.atk_lv || 0,
      LONG_TERM_META_CONFIG.verticalCaps.atkRatioBonus.maxCap,
      LONG_TERM_META_CONFIG.verticalCaps.atkRatioBonus.halfLv
    );
    const metaHpBonus = calcSoftCapBonus(
      metaLevels.hp_lv || 0,
      LONG_TERM_META_CONFIG.verticalCaps.maxHpRatioBonus.maxCap,
      LONG_TERM_META_CONFIG.verticalCaps.maxHpRatioBonus.halfLv
    );
    const metaCritBonus = calcSoftCapBonus(
      metaLevels.crit_lv || 0,
      LONG_TERM_META_CONFIG.verticalCaps.critRateBonus.maxCap,
      LONG_TERM_META_CONFIG.verticalCaps.critRateBonus.halfLv
    );
    const metaFlaskBonus = calcSoftCapBonus(
      metaLevels.flask_lv || 0,
      LONG_TERM_META_CONFIG.verticalCaps.flaskHealBonus.maxCap,
      LONG_TERM_META_CONFIG.verticalCaps.flaskHealBonus.halfLv
    );

    // 2. 局内微指数天书乘区 + 3/6/9 质变阶跃乘区
    const scrollMult =
      Math.pow(PACING_CURVE_CONFIG.scrollCompoundBase, mainCount) *
      Math.pow(PACING_CURVE_CONFIG.offScrollCompoundBase, offCount);

    let breakpointMult = 1.0;
    let cdHasteBonus = 0;
    let activeBreakpoint = null;
    for (let i = 0; i < PACING_CURVE_CONFIG.scrollBreakpoints.length; i++) {
      const bp = PACING_CURVE_CONFIG.scrollBreakpoints[i];
      if (mainCount + 1 >= bp.count) {
        breakpointMult = bp.dpsBonusMult;
        cdHasteBonus = bp.cdHasteBonus;
        activeBreakpoint = bp;
      }
    }

    // 3. 连斩战意极速加成
    const mRatio = momentumStacks / PACING_CURVE_CONFIG.momentumCurve.maxStacks;
    const moveSpeedMult = 1 + mRatio * PACING_CURVE_CONFIG.momentumCurve.moveSpeedBonusMax;
    const cdRecoveryMult = 1 + cdHasteBonus + mRatio * PACING_CURVE_CONFIG.momentumCurve.cdRateBonusMax;
    const atkSpeedMult = 1 + mRatio * PACING_CURVE_CONFIG.momentumCurve.atkSpeedBonusMax;

    const hpMult =
      (1 + metaHpBonus) *
      (1 +
        r * PACING_CURVE_CONFIG.hpScrollRates.red +
        p * PACING_CURVE_CONFIG.hpScrollRates.purple +
        g * PACING_CURVE_CONFIG.hpScrollRates.green);

    const effectiveDpsMult = (1 + metaAtkBonus) * scrollMult * breakpointMult * atkSpeedMult;

    return {
      atkMult: (1 + metaAtkBonus) * scrollMult * breakpointMult,
      effectiveDpsMult,
      hpMult,
      metaAtkBonus,
      metaHpBonus,
      metaCritBonus,
      metaFlaskBonus,
      moveSpeedMult,
      cdRecoveryMult,
      atkSpeedMult,
      activeBreakpoint
    };
  }

  /**
   * 汇总玩家当前收集的元素层数，激活五行共鸣（2/4/6阶）与双系仙术融合（Duo Synergies）
   */
  function calcElementalSynergyState(elementCounts) {
    const counts = Object.assign({ fire: 0, thunder: 0, water: 0, wind: 0, holy: 0 }, elementCounts || {});
    const activeElements = [];
    Object.keys(ELEMENTAL_SYNERGIES).forEach((el) => {
      const c = counts[el] || 0;
      const tier = c >= 6 ? 6 : c >= 4 ? 4 : c >= 2 ? 2 : 0;
      if (tier > 0) {
        const syn = ELEMENTAL_SYNERGIES[el];
        activeElements.push({
          element: el,
          count: c,
          tier,
          name: syn.name,
          color: syn.color,
          desc: syn.tiers[tier]
        });
      }
    });

    const activeDuos = [];
    DUO_FUSIONS.forEach((duo) => {
      const [e1, e2] = duo.req;
      if ((counts[e1] || 0) >= 2 && (counts[e2] || 0) >= 2) {
        activeDuos.push(duo);
      }
    });

    return {
      counts,
      activeElements,
      activeDuos
    };
  }

  /**
   * 计算第 actIndex (0~3) 劫在指定劫度与天道异象下的怪物曲线倍率（含锯齿心流调制 ψ(t)）
   */
  function calcEnemyCurveStats(actIndex, ascensionLevel, mutatorEffects) {
    const idx = Math.max(0, Math.min(PACING_CURVE_CONFIG.actsPerRun - 1, actIndex || 0));
    const psi = PACING_CURVE_CONFIG.sawtoothTensionPsi[idx] || 1.0;
    const asc =
      ASCENSION_TIERS[Math.min(ASCENSION_TIERS.length - 1, Math.max(0, ascensionLevel || 0))];
    const mut = mutatorEffects || {};

    const hpMult =
      Math.pow(PACING_CURVE_CONFIG.enemyStageCompound, idx) *
      psi *
      asc.enemyMult *
      (mut.enemyHpMult || 1.0);

    const atkMult =
      Math.pow(PACING_CURVE_CONFIG.enemyAtkStageCompound, idx) *
      asc.enemyMult *
      (mut.enemyAtkMult || 1.0);

    return {
      hpMult: Number(hpMult.toFixed(3)),
      atkMult: Number(atkMult.toFixed(3)),
      speedMult: mut.enemySpeedMult || 1.0,
      soulMult: asc.soulBonus * (mut.lootMult || 1.0),
      tensionPsi: psi
    };
  }

  /**
   * 【核心发牌器】生成一局全新不重样的 5 分钟西游破劫体验蓝图
   * 自动结合玩家最近 3 局历史记录（recentHistory）进行「反重复熵增降权」，确保每开一局体验截然不同！
   *
   * @param {Object} options
   *   - charId: 'wukong' | 'tangseng' | 'bajie' | 'wujing' | 'bailongma'
   *   - availableBiomes: 可传入 biomes.js 的 BIOMES 数组（自动兼容4关基础版或81难扩充版！）
   *   - recentHistory: 最近3局记录 [{ stageIds: [...], mutatorId, aspectId, eventId }]
   *   - banishedIds: 玩家紧箍封印屏蔽的词条/法宝 ID 列表
   *   - seed: 可选种子（传入 getDailyChallengeSeed() 即为全服同种每日挑战！）
   *   - ascensionLevel: 0 ~ 5
   */
  function generateFreshRunBlueprint(options) {
    const opts = options || {};
    const rng = createSeededRng(opts.seed);
    const charId = opts.charId || 'wukong';
    const history = Array.isArray(opts.recentHistory) ? opts.recentHistory.slice(-3) : [];
    const banished = new Set(opts.banishedIds || []);

    // 收集最近两局出现过的元素，施加 0.08x ~ 0.15x 强力去重惩罚权重
    const recentStageIds = new Set();
    const recentMutatorIds = new Set();
    const recentAspectIds = new Set();
    const recentEventIds = new Set();
    history.forEach((h) => {
      (h.stageIds || []).forEach((id) => recentStageIds.add(id));
      if (h.mutatorId) recentMutatorIds.add(h.mutatorId);
      if (h.aspectId) recentAspectIds.add(h.aspectId);
      if (h.eventId) recentEventIds.add(h.eventId);
    });

    // 1. 抽取本局开局【本命法相】（绝不与上一局相同）
    const aspectPool = HERO_ASPECTS[charId] || HERO_ASPECTS.wukong;
    const chosenAspect = rng.weightedPick(aspectPool, (a) =>
      recentAspectIds.has(a.id) ? 0.08 : 1.0
    );

    // 2. 抽取本局全局【天道异象】（过滤玩家封印项 + 近3局去重）
    const validMutators = WORLD_MUTATORS.filter((m) => !banished.has(m.id));
    const chosenMutator = rng.weightedPick(
      validMutators.length ? validMutators : WORLD_MUTATORS,
      (m) => (recentMutatorIds.has(m.id) ? 0.1 : 1.0)
    );

    // 3. 构建「四洲抽劫星图」（每劫提供主线 + 分岔双传送门二选一，兼容任意规模 BIOMES 库）
    const externalBiomes = Array.isArray(opts.availableBiomes) ? opts.availableBiomes : [];
    const actNodes = [];
    const chosenStageIds = [];

    for (let act = 0; act < PACING_CURVE_CONFIG.actsPerRun; act++) {
      // 若外部 biomes.js 已扩充超过 8 关（例如 81 难完整地形库），按四等分段动态分池；否则使用内置 16 大西游劫难原型池
      let tierPool;
      if (externalBiomes.length >= 8) {
        const chunkSize = Math.ceil(externalBiomes.length / PACING_CURVE_CONFIG.actsPerRun);
        const start = act * chunkSize;
        tierPool = externalBiomes.slice(start, start + chunkSize).map((b) => ({
          id: b.id,
          tribNo: b.tribNo || null,
          regionId: b.regionId || null,
          terrainLabel: b.terrainLabel || '',
          regionColor: b.regionColor || '',
          tier: act,
          title: b.name,
          baseBiome: b.id,
          theme: b.subtitle || '独立随机秘境',
          rewardBias: act === 3 ? 'legendary' : rng.pick(['scroll', 'weapon', 'mutation', 'forge', 'event', 'gold']),
          bossTitle: b.bossName || b.bossId
        }));
      } else {
        tierPool = EIGHTY_ONE_TRIBULATION_ARCHETYPES.filter((t) => t.tier === act);
      }

      const primaryBranch = rng.weightedPick(tierPool, (node) =>
        recentStageIds.has(node.id) ? 0.12 : 1.0
      );
      const diffRegionCandidates = tierPool.filter(
        (n) => n.id !== primaryBranch.id && (!primaryBranch.regionId || n.regionId !== primaryBranch.regionId)
      );
      const altCandidates = diffRegionCandidates.length
        ? diffRegionCandidates
        : tierPool.filter((n) => n.id !== primaryBranch.id);
      const secondaryBranch =
        rng.weightedPick(altCandidates, (node) => (recentStageIds.has(node.id) ? 0.18 : 1.0)) ||
        primaryBranch;
      // 确保左右两扇传送门的开局奖励倾向不同，制造真正的路线抉择
      if (secondaryBranch && secondaryBranch !== primaryBranch && secondaryBranch.rewardBias === primaryBranch.rewardBias && act < 3) {
        const altBiases = ['scroll', 'weapon', 'mutation', 'forge'].filter((x) => x !== primaryBranch.rewardBias);
        secondaryBranch.rewardBias = rng.pick(altBiases);
      }

      chosenStageIds.push(primaryBranch.id);
      const curveStats = calcEnemyCurveStats(
        act,
        opts.ascensionLevel || 0,
        chosenMutator.effects
      );

      actNodes.push({
        actIndex: act,
        targetSeconds: PACING_CURVE_CONFIG.targetActSeconds[act],
        primaryPortal: primaryBranch,
        altPortal: secondaryBranch, // 击败前劫Boss后双传送门二选一！
        enemyCurve: curveStats,
        hasMidStageEvent: act === 1 || act === 2
      });
    }

    // 4. 抽取本局奇遇事件与推荐双系融合导向
    const chosenEvent = rng.weightedPick(KARMIC_EVENTS, (ev) =>
      recentEventIds.has(ev.id) ? 0.12 : 1.0
    );
    const recommendedDuo =
      DUO_FUSIONS.find((d) => d.req.indexOf(chosenAspect.element) !== -1) || rng.pick(DUO_FUSIONS);

    return {
      seed: rng.seed,
      charId,
      starterAspect: chosenAspect,
      worldMutator: chosenMutator,
      karmicEvent: chosenEvent,
      recommendedDuo,
      acts: actNodes,
      historyRecord: {
        stageIds: chosenStageIds,
        mutatorId: chosenMutator.id,
        aspectId: chosenAspect.id,
        eventId: chosenEvent.id
      }
    };
  }

  return {
    PACING_CURVE_CONFIG,
    HERO_ASPECTS,
    EIGHTY_ONE_TRIBULATION_ARCHETYPES,
    WORLD_MUTATORS,
    ELEMENT_LABELS,
    ELEMENTAL_SYNERGIES,
    DUO_FUSIONS,
    KARMIC_EVENTS,
    LONG_TERM_META_CONFIG,
    ASCENSION_TIERS,
    createSeededRng,
    getDailyChallengeSeed,
    calcSoftCapBonus,
    calcPlayerCurveStats,
    calcElementalSynergyState,
    calcEnemyCurveStats,
    generateFreshRunBlueprint
  };
});
