/**
 * 《西游破劫录》五部位披挂装备、七大西游套装、十六种怪物掉落素材与兜率炼器数值系统
 * (src/config/equipment.js)
 *
 * 核心设计：
 * 1. 【64款西游神兵披挂 × 五大部位】：神兵(13) + 冠冕(13) + 宝甲(13) + 步履(12) + 灵饰(13) = 64款独立18x18高清像素图标。
 * 2. 【四阶装备难度曲线 (Tier 1~4) + 七大本命套装共鸣 (2件/4件套)】：按劫数、妖王难度与劫度渐进解锁，杜绝开局直接神装溢出或后期刮痧。
 * 3. 【16种西游怪物素材掉落 + 防脸黑保底机制】：按怪物种族/地域精准映射掉落 T1凡材 ~ T4妖王神材，内置小怪/精英/Boss三层独立保底。
 * 4. 【八卦锻造台 & 淬火升星(+1~+5) & 分解返材】：怪物素材可直接定向打造指定披挂、升星强化、洗炼词条，形成完整打宝养成闭环。
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
})('equipment', function () {
  let _equipUid = 1;
  const MAX_ENHANCE_LV = 5;

  // ==================== 一、五大西游披挂槽位 ====================
  const EQUIP_SLOTS = [
    { id: 'weapon', name: '神兵', short: '兵' },
    { id: 'helm', name: '冠冕', short: '冠' },
    { id: 'armor', name: '宝甲', short: '甲' },
    { id: 'boots', name: '步履', short: '履' },
    { id: 'accessory', name: '灵饰', short: '饰' }
  ];

  // 四阶装备底材难度层级（决定自然掉落劫数门槛、属性权重与锻造耗材）
  const EQUIP_TIERS = {
    1: { tier: 1, name: '一阶·凡铁', short: 'T1凡铁', color: '#ced4da', minStage: 0, forgeGold: 45, minRarity: 1 },
    2: { tier: 2, name: '二阶·灵器', short: 'T2灵器', color: '#4cc9f0', minStage: 1, forgeGold: 85, minRarity: 2 },
    3: { tier: 3, name: '三阶·仙宝', short: 'T3仙宝', color: '#c77dff', minStage: 2, forgeGold: 145, minRarity: 3 },
    4: { tier: 4, name: '四阶·圣器', short: 'T4圣器', color: '#ffd60a', minStage: 3, forgeGold: 230, minRarity: 4 }
  };

  // ==================== 二、六阶装备品质（针对5槽位+套装+升星精细重平衡） ====================
  const RARITIES = [
    {
      index: 0,
      id: 'common',
      name: '凡品',
      color: '#ced4da',
      bgTint: 'rgba(206, 212, 218, 0.14)',
      beamAlpha: 0.35,
      statMult: 1.0,
      affixCount: 1,
      recycleGold: 16,
      recycleMatTier: 1,
      recycleMatCount: 1
    },
    {
      index: 1,
      id: 'uncommon',
      name: '良品',
      color: '#69f0ae',
      bgTint: 'rgba(105, 240, 174, 0.16)',
      beamAlpha: 0.5,
      statMult: 1.15,
      affixCount: 2,
      recycleGold: 28,
      recycleMatTier: 1,
      recycleMatCount: 1
    },
    {
      index: 2,
      id: 'rare',
      name: '上品',
      color: '#4cc9f0',
      bgTint: 'rgba(76, 201, 240, 0.18)',
      beamAlpha: 0.65,
      statMult: 1.32,
      affixCount: 3,
      recycleGold: 46,
      recycleMatTier: 2,
      recycleMatCount: 1
    },
    {
      index: 3,
      id: 'epic',
      name: '仙品',
      color: '#c77dff',
      bgTint: 'rgba(199, 125, 255, 0.20)',
      beamAlpha: 0.8,
      statMult: 1.52,
      affixCount: 3,
      recycleGold: 74,
      recycleMatTier: 2,
      recycleMatCount: 1
    },
    {
      index: 4,
      id: 'legendary',
      name: '神品',
      color: '#ffd60a',
      bgTint: 'rgba(255, 214, 10, 0.22)',
      beamAlpha: 0.92,
      statMult: 1.76,
      affixCount: 4,
      hasSpecial: true,
      recycleGold: 118,
      recycleMatTier: 3,
      recycleMatCount: 1
    },
    {
      index: 5,
      id: 'mythic',
      name: '圣品',
      color: '#ff2a54',
      bgTint: 'rgba(255, 42, 84, 0.24)',
      beamAlpha: 1.0,
      statMult: 2.04,
      affixCount: 5,
      hasSpecial: true,
      recycleGold: 180,
      recycleMatTier: 3,
      recycleMatCount: 2
    }
  ];

  // ==================== 三、16种西游妖魔掉落素材定义 ====================
  const MONSTER_MATERIALS = [
    // Tier 1 · 凡材（巡山小妖高频掉落，基础锻造与+1/+2淬火主力耗材）
    {
      id: 'mat_yaogu',
      name: '百炼妖骨',
      tier: 1,
      tierLabel: '凡材',
      iconKey: 'mat_bone',
      color: '#ced4da',
      bgTint: 'rgba(206, 212, 218, 0.16)',
      dropRateHint: '小妖高频 (42%)',
      sourceDesc: '白骨洞/双叉岭/狼妖骷髅系小妖掉落',
      alchemySouls: 8
    },
    {
      id: 'mat_hupi',
      name: '斑斓兽皮',
      tier: 1,
      tierLabel: '凡材',
      iconKey: 'mat_pelt',
      color: '#e9c46a',
      bgTint: 'rgba(233, 196, 106, 0.16)',
      dropRateHint: '小妖高频 (42%)',
      sourceDesc: '两界山/黄风岭/虎豹熊狼野兽系掉落',
      alchemySouls: 8
    },
    {
      id: 'mat_hanlin',
      name: '寒渊青鳞',
      tier: 1,
      tierLabel: '凡材',
      iconKey: 'mat_scale',
      color: '#69f0ae',
      bgTint: 'rgba(105, 240, 174, 0.16)',
      dropRateHint: '小妖高频 (42%)',
      sourceDesc: '鹰愁涧/流沙河/通天河水妖鱼怪掉落',
      alchemySouls: 8
    },
    {
      id: 'mat_xuantie',
      name: '玄铁残片',
      tier: 1,
      tierLabel: '凡材',
      iconKey: 'mat_iron',
      color: '#90e0ef',
      bgTint: 'rgba(144, 224, 239, 0.16)',
      dropRateHint: '小妖高频 (42%)',
      sourceDesc: '黑风卫/持盾甲兵/山贼恶寇与装备分解产出',
      alchemySouls: 8
    },

    // Tier 2 · 灵材（中后段小妖、宝箱与精英妖将稳定产出）
    {
      id: 'mat_huojing',
      name: '赤炎火精',
      tier: 2,
      tierLabel: '灵材',
      iconKey: 'mat_fire_core',
      color: '#ff6e40',
      bgTint: 'rgba(255, 110, 64, 0.18)',
      dropRateHint: '精英必掉 / 火系妖兵 (24%)',
      sourceDesc: '火焰山/观音院火弓手与罗刹火灵掉落',
      alchemySouls: 16
    },
    {
      id: 'mat_fengsha',
      name: '三昧风砂',
      tier: 2,
      tierLabel: '灵材',
      iconKey: 'mat_wind_sand',
      color: '#4cc9f0',
      bgTint: 'rgba(76, 201, 240, 0.18)',
      dropRateHint: '精英必掉 / 大漠妖兵 (24%)',
      sourceDesc: '黄风岭/平顶峭壁狂风沙妖掉落',
      alchemySouls: 16
    },
    {
      id: 'mat_guizhu',
      name: '幽冥鬼珠',
      tier: 2,
      tierLabel: '灵材',
      iconKey: 'mat_ghost_orb',
      color: '#80ffdb',
      bgTint: 'rgba(128, 255, 219, 0.18)',
      dropRateHint: '精英必掉 / 幽冥妖兵 (24%)',
      sourceDesc: '白骨岭/波月洞鬼火法师与尸魔掉落',
      alchemySouls: 16
    },
    {
      id: 'mat_zhusi',
      name: '盘丝仙缕',
      tier: 2,
      tierLabel: '灵材',
      iconKey: 'mat_silk',
      color: '#f72585',
      bgTint: 'rgba(247, 37, 133, 0.18)',
      dropRateHint: '精英必掉 / 毒泽妖兵 (24%)',
      sourceDesc: '盘丝洞/西梁毒泽蛛精与毒蜂掉落',
      alchemySouls: 16
    },
    {
      id: 'mat_longjin',
      name: '西海龙筋',
      tier: 2,
      tierLabel: '灵材',
      iconKey: 'mat_tendon',
      color: '#00bbf9',
      bgTint: 'rgba(0, 187, 249, 0.18)',
      dropRateHint: '精英必掉 / 水族头目 (26%)',
      sourceDesc: '碧波潭/通天冰河/流沙河潜蛟头目掉落',
      alchemySouls: 18
    },

    // Tier 3 · 仙材（精英头目高概率、守关妖王100%必掉，打造T3套装与+4淬火核心）
    {
      id: 'mat_leiyu',
      name: '紫霄雷玉',
      tier: 3,
      tierLabel: '仙材',
      iconKey: 'mat_thunder_jade',
      color: '#c77dff',
      bgTint: 'rgba(199, 125, 255, 0.20)',
      dropRateHint: '妖王必掉 / 精英头目 (42%)',
      sourceDesc: '小雷音寺/金甲天将/雷电妖将掉落',
      alchemySouls: 32
    },
    {
      id: 'mat_jinlian',
      name: '功德金莲',
      tier: 3,
      tierLabel: '仙材',
      iconKey: 'mat_lotus',
      color: '#ffd166',
      bgTint: 'rgba(255, 209, 102, 0.20)',
      dropRateHint: '妖王必掉 / 禅林精英 (42%)',
      sourceDesc: '黑风禅院/天竺灵山护法头目与宝匣掉落',
      alchemySouls: 32
    },
    {
      id: 'mat_niujiao',
      name: '平天魔角',
      tier: 3,
      tierLabel: '仙材',
      iconKey: 'mat_horn',
      color: '#ff4d6d',
      bgTint: 'rgba(255, 77, 109, 0.20)',
      dropRateHint: '妖王必掉 / 重甲精英 (42%)',
      sourceDesc: '狮驼岭/翠云山/独角兕重装魔将掉落',
      alchemySouls: 32
    },
    {
      id: 'mat_taiyijin',
      name: '太乙精金',
      tier: 3,
      tierLabel: '仙材',
      iconKey: 'mat_gold_ingot',
      color: '#ffb703',
      bgTint: 'rgba(255, 183, 3, 0.20)',
      dropRateHint: '妖王必掉 / 法宝精英 (42%)',
      sourceDesc: '平顶山/金兜洞道门头目与神品分解产出',
      alchemySouls: 32
    },

    // Tier 4 · 神材（守关妖王专属本源，带2Boss必出保底，锻造T4齐天圣器核心）
    {
      id: 'mat_yaodan',
      name: '千年妖王丹',
      tier: 4,
      tierLabel: '神材',
      iconKey: 'mat_demon_core',
      color: '#ffd60a',
      bgTint: 'rgba(255, 214, 10, 0.24)',
      dropRateHint: '守关妖王 (55%~100% + 保底)',
      sourceDesc: '各劫守关大妖王伏诛掉落本命内丹',
      alchemySouls: 58
    },
    {
      id: 'mat_zhenhuo',
      name: '不灭真火种',
      tier: 4,
      tierLabel: '神材',
      iconKey: 'mat_samadhi_flame',
      color: '#ff5400',
      bgTint: 'rgba(255, 84, 0, 0.24)',
      dropRateHint: '中后劫妖王 (65%~100% + 保底)',
      sourceDesc: '红孩儿/牛魔王/黄风大圣等高阶妖王掉落',
      alchemySouls: 62
    },
    {
      id: 'mat_butianshi',
      name: '五彩补天石',
      tier: 4,
      tierLabel: '神材',
      iconKey: 'mat_chaos_stone',
      color: '#ff2a54',
      bgTint: 'rgba(255, 42, 84, 0.26)',
      dropRateHint: '终劫妖尊 / 高劫度额外掉落',
      sourceDesc: '第四劫终极妖尊或高劫度轮回妖王掉落，可铸至高圣器',
      alchemySouls: 75
    }
  ];

  const MATERIAL_MAP = {};
  MONSTER_MATERIALS.forEach((m) => {
    MATERIAL_MAP[m.id] = m;
  });

  // ==================== 四、七大西游本命套装共鸣 (2件套 / 4件套) ====================
  const EQUIP_SETS = {
    set_dasheng: {
      id: 'set_dasheng',
      name: '齐天大圣',
      color: '#ffd60a',
      bonus2Desc: '暴击率 +8%，物理攻击加成 +12%',
      bonus4Desc: '暴击伤害 +32%，第3段重击额外斩出 35% 攻击力的破甲金芒',
      stats2: { critRate: 0.08, atkPct: 0.12 },
      stats4: { critDmg: 0.32, specialKey: 'set_dasheng_4' }
    },
    set_fotuo: {
      id: 'set_fotuo',
      name: '锦襕佛陀',
      color: '#ff9f1c',
      bonus2Desc: '魔法强度加成 +14%，每秒回蓝 +2.4/s',
      bonus4Desc: '冷却缩减 +12%，施放本命神通获得 18% 最大气血金莲护盾',
      stats2: { magicPct: 0.14, mpRegen: 2.4 },
      stats4: { cdr: 0.12, specialKey: 'set_fotuo_4' }
    },
    set_tianpeng: {
      id: 'set_tianpeng',
      name: '天蓬星河',
      color: '#69f0ae',
      bonus2Desc: '最大气血 +42，防御护甲 +18',
      bonus4Desc: '全伤害减免 +7%，斩杀妖魔回复 3% 气血并震出天罡气波',
      stats2: { maxHp: 42, defFlat: 18 },
      stats4: { dmgReduct: 0.07, specialKey: 'set_tianpeng_4' }
    },
    set_juanlian: {
      id: 'set_juanlian',
      name: '流沙卷帘',
      color: '#4cc9f0',
      bonus2Desc: '攻击加成 +9%，魔法加成 +9%',
      bonus4Desc: '普攻回蓝 +3，对减速或眩晕妖魔伤害额外提升 +25%',
      stats2: { atkPct: 0.09, magicPct: 0.09 },
      stats4: { mpOnHit: 3, specialKey: 'set_juanlian_4' }
    },
    set_zhenlong: {
      id: 'set_zhenlong',
      name: '西海真龙',
      color: '#00f5d4',
      bonus2Desc: '移动速度 +14，暴击率 +7%',
      bonus4Desc: '魔法加成 +15%，闪避翻滚后 3 秒内下一次攻击必定暴击',
      stats2: { moveSpeed: 14, critRate: 0.07 },
      stats4: { magicPct: 0.15, specialKey: 'set_zhenlong_4' }
    },
    set_taiqing: {
      id: 'set_taiqing',
      name: '兜率太清',
      color: '#c77dff',
      bonus2Desc: '最大蓝量 +36，技能冷却缩减 +8%',
      bonus4Desc: '魔法加成 +14%，施放神通或法宝有 35% 概率返还一半蓝耗',
      stats2: { maxMp: 36, cdr: 0.08 },
      stats4: { magicPct: 0.14, specialKey: 'set_taiqing_4' }
    },
    set_pingtian: {
      id: 'set_pingtian',
      name: '平天魔尊',
      color: '#ff4d6d',
      bonus2Desc: '攻击加成 +11%，防御护甲 +14',
      bonus4Desc: '暴击伤害 +26%，受击或重砸地面时引爆魔焰震退周围敌群',
      stats2: { atkPct: 0.11, defFlat: 14 },
      stats4: { critDmg: 0.26, specialKey: 'set_pingtian_4' }
    }
  };

  // ==================== 五、64款西游特色装备底材模板 ====================
  // 含独立 18x18 像素贴图 iconKey、四阶难度 tier、套装归属 setId 与定向锻造配方 recipe
  const EQUIP_TEMPLATES = [
    // ==================== 1. 神兵 (weapon: 13款) ====================
    {
      id: 'demon_sabre', slot: 'weapon', tier: 1, name: '斩妖金背刀', iconKey: 'wpn_sabre',
      baseStats: { atk: 7, critRate: 0.03 },
      recipe: [{ id: 'mat_xuantie', count: 3 }, { id: 'mat_hupi', count: 2 }]
    },
    {
      id: 'black_iron_mace', slot: 'weapon', tier: 1, name: '乌金破甲锏', iconKey: 'wpn_mace',
      baseStats: { atk: 8, def: 5 },
      recipe: [{ id: 'mat_xuantie', count: 4 }, { id: 'mat_yaogu', count: 2 }]
    },
    {
      id: 'pine_staff', slot: 'weapon', tier: 1, name: '灵山青松杖', iconKey: 'wpn_pine_staff',
      baseStats: { magic: 8, maxMp: 16, mpRegen: 1.0 },
      recipe: [{ id: 'mat_yaogu', count: 3 }, { id: 'mat_hanlin', count: 2 }]
    },
    {
      id: 'bodhi_ruyi', slot: 'weapon', tier: 2, name: '菩提玉如意', iconKey: 'wpn_ruyi',
      baseStats: { magic: 11, maxMp: 22 },
      recipe: [{ id: 'mat_guizhu', count: 2 }, { id: 'mat_hanlin', count: 3 }]
    },
    {
      id: 'violet_sword', slot: 'weapon', tier: 2, name: '紫电青霜剑', iconKey: 'wpn_sword',
      baseStats: { atk: 7, magic: 7, critRate: 0.05 },
      recipe: [{ id: 'mat_fengsha', count: 2 }, { id: 'mat_xuantie', count: 4 }]
    },
    {
      id: 'wolf_fang_club', slot: 'weapon', tier: 2, name: '狮驼狼牙棒', iconKey: 'wpn_wolf_club',
      baseStats: { atk: 11, critDmg: 0.14 },
      recipe: [{ id: 'mat_huojing', count: 2 }, { id: 'mat_yaogu', count: 4 }]
    },
    {
      id: 'trident_halberd', slot: 'weapon', tier: 3, setId: 'set_pingtian', name: '三尖两刃神锋', iconKey: 'wpn_trident_spear',
      baseStats: { atk: 13, critRate: 0.05, critDmg: 0.14 },
      recipe: [{ id: 'mat_niujiao', count: 2 }, { id: 'mat_huojing', count: 3 }, { id: 'mat_xuantie', count: 4 }]
    },
    {
      id: 'crescent_spade', slot: 'weapon', tier: 3, setId: 'set_juanlian', name: '降妖月牙宝铲', iconKey: 'wpn_crescent_spade',
      baseStats: { atk: 10, magic: 9, def: 6 },
      recipe: [{ id: 'mat_taiyijin', count: 2 }, { id: 'mat_longjin', count: 2 }, { id: 'mat_hanlin', count: 4 }]
    },
    {
      id: 'dragon_frost_lance', slot: 'weapon', tier: 3, setId: 'set_zhenlong', name: '西海寒渊龙枪', iconKey: 'wpn_dragon_lance',
      baseStats: { atk: 11, magic: 8, critRate: 0.06 },
      recipe: [{ id: 'mat_leiyu', count: 2 }, { id: 'mat_longjin', count: 3 }, { id: 'mat_hanlin', count: 4 }]
    },
    {
      id: 'seven_star_sword', slot: 'weapon', tier: 3, setId: 'set_taiqing', name: '兜率七星宝剑', iconKey: 'wpn_seven_sword',
      baseStats: { magic: 14, maxMp: 26, critRate: 0.04 },
      recipe: [{ id: 'mat_leiyu', count: 2 }, { id: 'mat_guizhu', count: 3 }, { id: 'mat_xuantie', count: 3 }]
    },
    {
      id: 'ruyi_jingu_staff', slot: 'weapon', tier: 4, setId: 'set_dasheng', name: '如意金箍神珍', iconKey: 'wpn_jingu_staff',
      baseStats: { atk: 17, critRate: 0.07, critDmg: 0.2 },
      recipe: [{ id: 'mat_yaodan', count: 1 }, { id: 'mat_butianshi', count: 1 }, { id: 'mat_taiyijin', count: 2 }]
    },
    {
      id: 'nine_tooth_rake', slot: 'weapon', tier: 4, setId: 'set_tianpeng', name: '上宝沁金九齿耙', iconKey: 'wpn_nine_rake',
      baseStats: { atk: 15, def: 10, maxHp: 28 },
      recipe: [{ id: 'mat_yaodan', count: 1 }, { id: 'mat_niujiao', count: 2 }, { id: 'mat_taiyijin', count: 2 }]
    },
    {
      id: 'nine_ring_staff', slot: 'weapon', tier: 4, setId: 'set_fotuo', name: '九环旃檀锡杖', iconKey: 'wpn_tin_staff',
      baseStats: { magic: 18, maxMp: 34, mpRegen: 2.2 },
      recipe: [{ id: 'mat_yaodan', count: 1 }, { id: 'mat_jinlian', count: 3 }, { id: 'mat_zhusi', count: 3 }]
    },

    // ==================== 2. 冠冕 (helm: 13款) ====================
    {
      id: 'bronze_band', slot: 'helm', tier: 1, name: '行者百炼铜箍', iconKey: 'hlm_bronze_band',
      baseStats: { atk: 3, def: 6, maxHp: 14 },
      recipe: [{ id: 'mat_xuantie', count: 3 }, { id: 'mat_hupi', count: 2 }]
    },
    {
      id: 'monk_bamboo_hat', slot: 'helm', tier: 1, name: '云游竹编斗笠', iconKey: 'hlm_bamboo_hat',
      baseStats: { def: 5, maxMp: 16, mpRegen: 1.0 },
      recipe: [{ id: 'mat_hupi', count: 3 }, { id: 'mat_hanlin', count: 2 }]
    },
    {
      id: 'bone_skull_helm', slot: 'helm', tier: 1, name: '白骨狰狞战盔', iconKey: 'hlm_bone_helm',
      baseStats: { atk: 4, critRate: 0.03, def: 4 },
      recipe: [{ id: 'mat_yaogu', count: 4 }, { id: 'mat_xuantie', count: 1 }]
    },
    {
      id: 'kunlun_helm', slot: 'helm', tier: 2, name: '昆仑玄铁胄', iconKey: 'hlm_iron',
      baseStats: { def: 10, maxHp: 24 },
      recipe: [{ id: 'mat_fengsha', count: 2 }, { id: 'mat_xuantie', count: 3 }]
    },
    {
      id: 'asura_mask', slot: 'helm', tier: 2, name: '修罗怒目面', iconKey: 'hlm_mask',
      baseStats: { atk: 6, critRate: 0.04, def: 4 },
      recipe: [{ id: 'mat_huojing', count: 2 }, { id: 'mat_yaogu', count: 3 }]
    },
    {
      id: 'yellow_wind_hood', slot: 'helm', tier: 2, name: '黄风御沙兜', iconKey: 'hlm_sand_hood',
      baseStats: { def: 7, maxHp: 18, moveSpeed: 6 },
      recipe: [{ id: 'mat_fengsha', count: 2 }, { id: 'mat_hupi', count: 3 }]
    },
    {
      id: 'crimson_hero_band', slot: 'helm', tier: 3, setId: 'set_juanlian', name: '赤金卷帘英雄箍', iconKey: 'hlm_hero_band',
      baseStats: { atk: 6, magic: 6, maxHp: 22, def: 7 },
      recipe: [{ id: 'mat_jinlian', count: 2 }, { id: 'mat_longjin', count: 2 }, { id: 'mat_yaogu', count: 3 }]
    },
    {
      id: 'coral_dragon_crown', slot: 'helm', tier: 3, setId: 'set_zhenlong', name: '沧海青玉龙角冠', iconKey: 'hlm_dragon_crown',
      baseStats: { magic: 8, critRate: 0.05, maxMp: 22 },
      recipe: [{ id: 'mat_leiyu', count: 2 }, { id: 'mat_longjin', count: 2 }, { id: 'mat_hanlin', count: 3 }]
    },
    {
      id: 'taiqing_lotus_cap', slot: 'helm', tier: 3, setId: 'set_taiqing', name: '太清混元芙蓉冠', iconKey: 'hlm_lotus_cap',
      baseStats: { magic: 9, maxMp: 28, mpRegen: 1.8 },
      recipe: [{ id: 'mat_jinlian', count: 2 }, { id: 'mat_zhusi', count: 3 }, { id: 'mat_guizhu', count: 2 }]
    },
    {
      id: 'bull_horn_helm', slot: 'helm', tier: 3, setId: 'set_pingtian', name: '平天魔牛双角盔', iconKey: 'hlm_bull_helm',
      baseStats: { atk: 8, def: 11, maxHp: 24 },
      recipe: [{ id: 'mat_niujiao', count: 2 }, { id: 'mat_huojing', count: 2 }, { id: 'mat_xuantie', count: 3 }]
    },
    {
      id: 'phoenix_crown', slot: 'helm', tier: 4, setId: 'set_dasheng', name: '凤翅紫金冠', iconKey: 'hlm_phoenix',
      baseStats: { atk: 9, critRate: 0.05, critDmg: 0.16, maxHp: 22 },
      recipe: [{ id: 'mat_zhenhuo', count: 1 }, { id: 'mat_taiyijin', count: 2 }, { id: 'mat_fengsha', count: 3 }]
    },
    {
      id: 'tianpeng_gold_hat', slot: 'helm', tier: 4, setId: 'set_tianpeng', name: '天蓬九曜乌金胄', iconKey: 'hlm_tianpeng_hat',
      baseStats: { def: 15, maxHp: 38, atk: 5 },
      recipe: [{ id: 'mat_yaodan', count: 1 }, { id: 'mat_niujiao', count: 2 }, { id: 'mat_xuantie', count: 4 }]
    },
    {
      id: 'dharma_hat', slot: 'helm', tier: 4, setId: 'set_fotuo', name: '五佛毗卢宝冠', iconKey: 'hlm_dharma',
      baseStats: { magic: 11, maxMp: 32, mpRegen: 2.2, def: 7 },
      recipe: [{ id: 'mat_yaodan', count: 1 }, { id: 'mat_jinlian', count: 2 }, { id: 'mat_guizhu', count: 3 }]
    },

    // ==================== 3. 宝甲 (armor: 13款) ====================
    {
      id: 'tiger_skin_kilt', slot: 'armor', tier: 1, name: '双叉虎皮战裙', iconKey: 'arm_tiger_kilt',
      baseStats: { def: 8, atk: 3, maxHp: 18 },
      recipe: [{ id: 'mat_hupi', count: 4 }, { id: 'mat_yaogu', count: 1 }]
    },
    {
      id: 'grey_monk_robe', slot: 'armor', tier: 1, name: '禅院灰布僧衣', iconKey: 'arm_monk_robe',
      baseStats: { def: 7, magic: 4, maxMp: 18 },
      recipe: [{ id: 'mat_hupi', count: 3 }, { id: 'mat_hanlin', count: 2 }]
    },
    {
      id: 'black_bear_plate', slot: 'armor', tier: 1, name: '黑风玄铁护心铠', iconKey: 'arm_bear_plate',
      baseStats: { def: 11, maxHp: 24 },
      recipe: [{ id: 'mat_xuantie', count: 3 }, { id: 'mat_hupi', count: 2 }]
    },
    {
      id: 'mountain_plate', slot: 'armor', tier: 2, name: '山文重鳞铠', iconKey: 'arm_heavy',
      baseStats: { def: 16, maxHp: 34 },
      recipe: [{ id: 'mat_fengsha', count: 2 }, { id: 'mat_xuantie', count: 4 }]
    },
    {
      id: 'spider_silk_vest', slot: 'armor', tier: 2, name: '盘丝天罗软猬衣', iconKey: 'arm_spider_vest',
      baseStats: { def: 11, magic: 6, critRate: 0.04, maxHp: 22 },
      recipe: [{ id: 'mat_zhusi', count: 3 }, { id: 'mat_guizhu', count: 2 }]
    },
    {
      id: 'flame_robe', slot: 'armor', tier: 2, name: '赤炎罗刹火云袍', iconKey: 'arm_flame_robe',
      baseStats: { def: 10, atk: 5, magic: 6, maxHp: 24 },
      recipe: [{ id: 'mat_huojing', count: 3 }, { id: 'mat_zhusi', count: 2 }]
    },
    {
      id: 'quicksand_armor', slot: 'armor', tier: 3, setId: 'set_juanlian', name: '八百流沙玄武铠', iconKey: 'arm_quicksand',
      baseStats: { def: 16, magic: 7, maxHp: 34 },
      recipe: [{ id: 'mat_taiyijin', count: 2 }, { id: 'mat_longjin', count: 2 }, { id: 'mat_hanlin', count: 4 }]
    },
    {
      id: 'dragon_scale', slot: 'armor', tier: 3, setId: 'set_zhenlong', name: '西海银鳞龙王甲', iconKey: 'arm_dragon',
      baseStats: { def: 14, magic: 6, critRate: 0.04, maxHp: 28 },
      recipe: [{ id: 'mat_leiyu', count: 2 }, { id: 'mat_longjin', count: 3 }, { id: 'mat_hanlin', count: 4 }]
    },
    {
      id: 'bagua_dao_robe', slot: 'armor', tier: 3, setId: 'set_taiqing', name: '紫绶八卦仙衣', iconKey: 'arm_bagua_robe',
      baseStats: { def: 12, magic: 10, maxMp: 30, mpRegen: 1.5 },
      recipe: [{ id: 'mat_jinlian', count: 2 }, { id: 'mat_zhusi', count: 3 }, { id: 'mat_fengsha', count: 2 }]
    },
    {
      id: 'bull_demon_plate', slot: 'armor', tier: 3, setId: 'set_pingtian', name: '平天混元重魔铠', iconKey: 'arm_bull_plate',
      baseStats: { def: 19, atk: 6, maxHp: 38 },
      recipe: [{ id: 'mat_niujiao', count: 2 }, { id: 'mat_huojing', count: 3 }, { id: 'mat_xuantie', count: 4 }]
    },
    {
      id: 'golden_mail', slot: 'armor', tier: 4, setId: 'set_dasheng', name: '锁子黄金甲', iconKey: 'arm_gold',
      baseStats: { def: 17, atk: 8, critRate: 0.04, maxHp: 36 },
      recipe: [{ id: 'mat_butianshi', count: 1 }, { id: 'mat_taiyijin', count: 3 }, { id: 'mat_xuantie', count: 4 }]
    },
    {
      id: 'tianpeng_armor', slot: 'armor', tier: 4, setId: 'set_tianpeng', name: '天蓬吞天玄铁铠', iconKey: 'arm_tianpeng',
      baseStats: { def: 23, maxHp: 52 },
      recipe: [{ id: 'mat_yaodan', count: 1 }, { id: 'mat_niujiao', count: 2 }, { id: 'mat_taiyijin', count: 2 }]
    },
    {
      id: 'kasaya_robe', slot: 'armor', tier: 4, setId: 'set_fotuo', name: '锦襕九品仙法衣', iconKey: 'arm_robe',
      baseStats: { def: 14, magic: 12, maxMp: 38, maxHp: 30 },
      recipe: [{ id: 'mat_yaodan', count: 1 }, { id: 'mat_jinlian', count: 3 }, { id: 'mat_zhusi', count: 3 }]
    },

    // ==================== 4. 步履 (boots: 12款) ====================
    {
      id: 'straw_sandals', slot: 'boots', tier: 1, name: '踏山苦行草鞋', iconKey: 'bts_straw',
      baseStats: { moveSpeed: 8, def: 4, maxHp: 12 },
      recipe: [{ id: 'mat_hupi', count: 3 }, { id: 'mat_yaogu', count: 2 }]
    },
    {
      id: 'wolf_leather_boots', slot: 'boots', tier: 1, name: '疾风苍狼皮靴', iconKey: 'bts_wolf',
      baseStats: { moveSpeed: 10, atk: 3, critRate: 0.02 },
      recipe: [{ id: 'mat_hupi', count: 4 }, { id: 'mat_yaogu', count: 1 }]
    },
    {
      id: 'iron_greaves', slot: 'boots', tier: 1, name: '巡山乌铁战靴', iconKey: 'bts_iron',
      baseStats: { moveSpeed: 5, def: 8, maxHp: 18 },
      recipe: [{ id: 'mat_xuantie', count: 3 }, { id: 'mat_hupi', count: 2 }]
    },
    {
      id: 'sand_walker_boots', slot: 'boots', tier: 2, name: '御风踏沙轻靴', iconKey: 'bts_sand',
      baseStats: { moveSpeed: 13, def: 6, maxHp: 16 },
      recipe: [{ id: 'mat_fengsha', count: 2 }, { id: 'mat_hupi', count: 3 }]
    },
    {
      id: 'bone_shadow_boots', slot: 'boots', tier: 2, name: '幽冥鬼影步履', iconKey: 'bts_shadow',
      baseStats: { moveSpeed: 12, magic: 5, critRate: 0.03 },
      recipe: [{ id: 'mat_guizhu', count: 2 }, { id: 'mat_yaogu', count: 3 }]
    },
    {
      id: 'frost_tread_boots', slot: 'boots', tier: 3, setId: 'set_taiqing', name: '通天踏冰寒靴', iconKey: 'bts_frost',
      baseStats: { moveSpeed: 14, magic: 7, maxMp: 22, def: 7 },
      recipe: [{ id: 'mat_leiyu', count: 1 }, { id: 'mat_longjin', count: 2 }, { id: 'mat_hanlin', count: 3 }]
    },
    {
      id: 'abyss_water_boots', slot: 'boots', tier: 3, setId: 'set_juanlian', name: '分水踏浪玄靴', iconKey: 'bts_quicksand',
      baseStats: { moveSpeed: 13, def: 9, mpRegen: 1.4, maxHp: 20 },
      recipe: [{ id: 'mat_taiyijin', count: 1 }, { id: 'mat_longjin', count: 2 }, { id: 'mat_hanlin', count: 3 }]
    },
    {
      id: 'tide_dragon_boots', slot: 'boots', tier: 3, setId: 'set_zhenlong', name: '四海腾云龙鳞靴', iconKey: 'bts_dragon',
      baseStats: { moveSpeed: 17, atk: 5, critRate: 0.04 },
      recipe: [{ id: 'mat_leiyu', count: 2 }, { id: 'mat_longjin', count: 2 }, { id: 'mat_hanlin', count: 3 }]
    },
    {
      id: 'wind_fire_boots', slot: 'boots', tier: 3, setId: 'set_pingtian', name: '风火流云神行履', iconKey: 'bts_wind_fire',
      baseStats: { moveSpeed: 16, atk: 7, critDmg: 0.12 },
      recipe: [{ id: 'mat_niujiao', count: 1 }, { id: 'mat_huojing', count: 3 }, { id: 'mat_fengsha', count: 2 }]
    },
    {
      id: 'cloud_silk_boots', slot: 'boots', tier: 4, setId: 'set_dasheng', name: '藕丝步云履', iconKey: 'bts_cloud_silk',
      baseStats: { moveSpeed: 20, atk: 7, critRate: 0.05, def: 8 },
      recipe: [{ id: 'mat_zhenhuo', count: 1 }, { id: 'mat_zhusi', count: 3 }, { id: 'mat_fengsha', count: 3 }]
    },
    {
      id: 'tianpeng_war_boots', slot: 'boots', tier: 4, setId: 'set_tianpeng', name: '天罡镇岳重靴', iconKey: 'bts_tianpeng',
      baseStats: { moveSpeed: 12, def: 14, maxHp: 34 },
      recipe: [{ id: 'mat_yaodan', count: 1 }, { id: 'mat_taiyijin', count: 2 }, { id: 'mat_xuantie', count: 3 }]
    },
    {
      id: 'golden_lotus_shoes', slot: 'boots', tier: 4, setId: 'set_fotuo', name: '步步生莲金丝履', iconKey: 'bts_lotus',
      baseStats: { moveSpeed: 16, magic: 9, mpRegen: 2.0, maxHp: 22 },
      recipe: [{ id: 'mat_yaodan', count: 1 }, { id: 'mat_jinlian', count: 2 }, { id: 'mat_zhusi', count: 3 }]
    },

    // ==================== 5. 灵饰 (accessory: 13款) ====================
    {
      id: 'wood_prayer_beads', slot: 'accessory', tier: 1, name: '紫檀百八佛珠', iconKey: 'acc_wood_beads',
      baseStats: { magic: 4, maxMp: 18, mpRegen: 1.2 },
      recipe: [{ id: 'mat_yaogu', count: 3 }, { id: 'mat_hanlin', count: 2 }]
    },
    {
      id: 'wolf_tooth_charm', slot: 'accessory', tier: 1, name: '辟邪狼牙骨佩', iconKey: 'acc_wolf_fang',
      baseStats: { atk: 4, critRate: 0.03 },
      recipe: [{ id: 'mat_yaogu', count: 3 }, { id: 'mat_hupi', count: 2 }]
    },
    {
      id: 'copper_bell', slot: 'accessory', tier: 1, name: '聚魂青铜妖铃', iconKey: 'acc_copper_bell',
      baseStats: { def: 5, maxHp: 14, maxMp: 12 },
      recipe: [{ id: 'mat_xuantie', count: 3 }, { id: 'mat_yaogu', count: 2 }]
    },
    {
      id: 'wind_pearl', slot: 'accessory', tier: 2, name: '定风避尘珠', iconKey: 'acc_pearl',
      baseStats: { def: 7, maxMp: 18, critRate: 0.03 },
      recipe: [{ id: 'mat_fengsha', count: 3 }, { id: 'mat_hanlin', count: 2 }]
    },
    {
      id: 'fire_jade', slot: 'accessory', tier: 2, name: '离火金睛佩', iconKey: 'acc_jade',
      baseStats: { atk: 5, critRate: 0.04, critDmg: 0.12 },
      recipe: [{ id: 'mat_huojing', count: 3 }, { id: 'mat_xuantie', count: 2 }]
    },
    {
      id: 'taiyi_talisman', slot: 'accessory', tier: 2, name: '太乙聚灵符', iconKey: 'acc_talisman',
      baseStats: { magic: 8, maxMp: 28, mpRegen: 2.0 },
      recipe: [{ id: 'mat_guizhu', count: 2 }, { id: 'mat_zhusi', count: 2 }]
    },
    {
      id: 'nine_skull_necklace', slot: 'accessory', tier: 3, setId: 'set_juanlian', name: '九骷化龙念珠', iconKey: 'acc_skull_beads',
      baseStats: { atk: 6, magic: 7, maxHp: 22 },
      recipe: [{ id: 'mat_leiyu', count: 1 }, { id: 'mat_guizhu', count: 3 }, { id: 'mat_yaogu', count: 4 }]
    },
    {
      id: 'ocean_heart_pearl', slot: 'accessory', tier: 3, setId: 'set_zhenlong', name: '定海辟水夜明珠', iconKey: 'acc_ocean_pearl',
      baseStats: { magic: 8, maxMp: 26, critRate: 0.05 },
      recipe: [{ id: 'mat_leiyu', count: 2 }, { id: 'mat_longjin', count: 2 }, { id: 'mat_hanlin', count: 3 }]
    },
    {
      id: 'jingang_jade_bangle', slot: 'accessory', tier: 3, setId: 'set_taiqing', name: '兜率紫金金刚环', iconKey: 'acc_jingang_ring',
      baseStats: { def: 10, magic: 8, maxMp: 24 },
      recipe: [{ id: 'mat_taiyijin', count: 2 }, { id: 'mat_guizhu', count: 2 }, { id: 'mat_xuantie', count: 3 }]
    },
    {
      id: 'iron_fan_pendant', slot: 'accessory', tier: 3, setId: 'set_pingtian', name: '翠云芭蕉灵叶佩', iconKey: 'acc_fan_pendant',
      baseStats: { atk: 7, critDmg: 0.15, mpRegen: 1.5 },
      recipe: [{ id: 'mat_niujiao', count: 2 }, { id: 'mat_fengsha', count: 3 }, { id: 'mat_zhusi', count: 2 }]
    },
    {
      id: 'golden_fillet_ring', slot: 'accessory', tier: 4, setId: 'set_dasheng', name: '紧箍齐天金环', iconKey: 'acc_golden_fillet',
      baseStats: { atk: 9, critRate: 0.06, critDmg: 0.18 },
      recipe: [{ id: 'mat_zhenhuo', count: 1 }, { id: 'mat_butianshi', count: 1 }, { id: 'mat_taiyijin', count: 2 }]
    },
    {
      id: 'glutton_jade_gourd', slot: 'accessory', tier: 4, setId: 'set_tianpeng', name: '饕餮乾坤白玉葫', iconKey: 'acc_jade_gourd',
      baseStats: { def: 11, maxHp: 38, atk: 6 },
      recipe: [{ id: 'mat_yaodan', count: 1 }, { id: 'mat_jinlian', count: 2 }, { id: 'mat_longjin', count: 3 }]
    },
    {
      id: 'relic_ring', slot: 'accessory', tier: 4, setId: 'set_fotuo', name: '佛祖金身舍利戒', iconKey: 'acc_ring',
      baseStats: { atk: 5, magic: 10, def: 8, maxHp: 22, mpRegen: 1.8 },
      recipe: [{ id: 'mat_butianshi', count: 1 }, { id: 'mat_jinlian', count: 3 }, { id: 'mat_guizhu', count: 2 }]
    }
  ];

  // ==================== 六、14项随机词条池（针对基础面板24攻/115血精细校准） ====================
  const AFFIX_POOL = [
    { key: 'atk', label: '攻击力', unit: '', min: 1, max: 3, levelStep: 0.55, color: '#ff9f1c' },
    { key: 'atkPct', label: '攻击加成', unit: '%', min: 3, max: 6, levelStep: 0.55, isPct: true, color: '#ff9f1c' },
    { key: 'magic', label: '魔法强度', unit: '', min: 2, max: 4, levelStep: 0.75, color: '#c77dff' },
    { key: 'magicPct', label: '魔法增幅', unit: '%', min: 4, max: 8, levelStep: 0.65, isPct: true, color: '#c77dff' },
    { key: 'critRate', label: '暴击率', unit: '%', min: 2, max: 5, levelStep: 0.4, isPct: true, color: '#ffd60a' },
    { key: 'critDmg', label: '暴击伤害', unit: '%', min: 7, max: 14, levelStep: 1.1, isPct: true, color: '#ffd60a' },
    { key: 'maxMp', label: '最大蓝量', unit: '', min: 10, max: 20, levelStep: 2.8, color: '#4cc9f0' },
    { key: 'mpRegen', label: '每秒回蓝', unit: '/s', min: 0.8, max: 1.8, levelStep: 0.22, decimal: 1, color: '#4cc9f0' },
    { key: 'mpOnHit', label: '普攻回蓝', unit: '', min: 1, max: 2, levelStep: 0.25, color: '#00f5d4' },
    { key: 'def', label: '防御护甲', unit: '', min: 3, max: 7, levelStep: 1.4, color: '#69f0ae' },
    { key: 'maxHp', label: '最大气血', unit: '', min: 9, max: 20, levelStep: 3.2, color: '#ff5252' },
    { key: 'cdr', label: '技能冷却缩减', unit: '%', min: 2, max: 5, levelStep: 0.35, isPct: true, color: '#80ffdb' },
    { key: 'moveSpeed', label: '踏云移速', unit: '', min: 4, max: 9, levelStep: 0.6, color: '#90e0ef' },
    { key: 'lifeOnKill', label: '斩妖回血', unit: '', min: 2, max: 4, levelStep: 0.5, color: '#ff758f' }
  ];

  // ==================== 七、10大橙红神品/圣品专属特效词条 ====================
  const SPECIAL_PASSIVES = [
    {
      id: 'samadhi_burst',
      name: '三昧真火',
      desc: '暴击命中引爆真火，额外造成 45% 魔法强度的火焰伤害'
    },
    {
      id: 'thunder_call',
      name: '九天引雷',
      desc: '施放本命神通时降下天雷轰击妖魔，造成 110% 魔法伤害'
    },
    {
      id: 'mana_fountain',
      name: '混元回气',
      desc: '击败妖魔立即回复 10 点蓝量并缩短神通 0.6秒冷却'
    },
    {
      id: 'vajra_ward',
      name: '金刚护体',
      desc: '护甲减伤额外提升 6%，饮用甘露时额外回满 100% 蓝条'
    },
    {
      id: 'havoc_execute',
      name: '破军断魂',
      desc: '对气血低于 32% 的妖魔与妖王造成伤害额外提升 24%'
    },
    {
      id: 'frost_shatter',
      name: '玄冰寒髓',
      desc: '第3段重击附带 1.8秒寒霜减速，对减速目标暴击率 +15%'
    },
    {
      id: 'blood_gourd',
      name: '泣血魔葫',
      desc: '暴击命中妖魔时汲取 2% 最大气血（内置 0.6秒冷却）'
    },
    {
      id: 'wind_swift',
      name: '缩地神行',
      desc: '移动速度额外 +14，闪避翻滚冷却时间缩短 18%'
    },
    {
      id: 'golden_fortune_eq',
      name: '聚宝金蟾',
      desc: '妖魔掉落怪物素材概率 +16%，功德金铢获取 +25%'
    },
    {
      id: 'dharma_echo',
      name: '万法归宗',
      desc: '副手西游法宝伤害提升 28%，且法宝蓝耗降低 35%'
    }
  ];

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function weightedPick(entries) {
    let sum = 0;
    for (let i = 0; i < entries.length; i++) sum += Math.max(0, entries[i].w || 0);
    if (sum <= 0) return entries[0].item;
    let r = Math.random() * sum;
    for (let i = 0; i < entries.length; i++) {
      r -= Math.max(0, entries[i].w || 0);
      if (r <= 0) return entries[i].item;
    }
    return entries[entries.length - 1].item;
  }

  // ==================== 八、渐进式装备品质与底材难度曲线 ====================
  /**
   * 按掉落来源、当前劫数 (0~3+) 与轮回劫度 (0~5) 动态计算品质爆率
   * 保证：第1劫平滑过渡不崩盘，第3~4劫与高劫度爽爆神品/圣品！
   */
  function rollRarity(source, stageIndex, ascensionLevel) {
    const act = Math.max(0, Math.min(5, Number(stageIndex) || 0));
    const asc = Math.max(0, Math.min(5, Number(ascensionLevel) || 0));
    const luckShift = act * 0.045 + asc * 0.03;
    const r = Math.random();

    if (source === 'starter') {
      return r < 0.35 ? RARITIES[1] : RARITIES[0];
    }

    if (source === 'boss') {
      const mythicP = Math.min(0.34, (act === 0 ? 0.0 : act === 1 ? 0.04 : act === 2 ? 0.12 : 0.24) + asc * 0.035);
      const legP = Math.min(0.62, (act === 0 ? 0.14 : act === 1 ? 0.28 : act === 2 ? 0.46 : 0.52) + asc * 0.025);
      const epicP = act <= 1 ? 0.46 : 0.32;
      if (r < mythicP) return RARITIES[5];
      if (r < mythicP + legP) return RARITIES[4];
      if (r < mythicP + legP + epicP) return RARITIES[3];
      return RARITIES[2];
    }

    if (source === 'elite') {
      const mythicP = act >= 2 ? Math.min(0.12, (act - 1) * 0.025 + asc * 0.015) : 0;
      const legP = Math.min(0.36, 0.05 + act * 0.065 + asc * 0.025);
      const epicP = Math.min(0.45, 0.22 + act * 0.06);
      if (r < mythicP) return RARITIES[5];
      if (r < mythicP + legP) return RARITIES[4];
      if (r < mythicP + legP + epicP) return RARITIES[3];
      return r < 0.92 ? RARITIES[2] : RARITIES[1];
    }

    if (source === 'chest') {
      const legP = Math.min(0.24, 0.03 + act * 0.05 + asc * 0.02);
      const epicP = Math.min(0.42, 0.16 + act * 0.07);
      const rareP = 0.42;
      if (r < legP) return RARITIES[4];
      if (r < legP + epicP) return RARITIES[3];
      if (r < legP + epicP + rareP) return RARITIES[2];
      return RARITIES[1];
    }

    // 普通小怪掉落：随劫数从凡品/良品逐步过渡至上品/仙品
    const legP = act >= 1 ? Math.min(0.06, (act - 0.5) * 0.014 + asc * 0.008) : 0.005;
    const epicP = Math.min(0.22, 0.02 + luckShift * 1.1);
    const rareP = Math.min(0.36, 0.12 + luckShift * 1.4);
    const uncomP = 0.36;
    if (r < legP) return RARITIES[4];
    if (r < legP + epicP) return RARITIES[3];
    if (r < legP + epicP + rareP) return RARITIES[2];
    if (r < legP + epicP + rareP + uncomP) return RARITIES[1];
    return RARITIES[0];
  }

  /**
   * 按关卡难度阶梯抽取 64 款底材模板（T1~T4 权重随劫数递进）
   */
  function rollTemplateByDifficulty(slot, stageIndex, source, ascensionLevel) {
    const act = Math.max(0, Math.min(5, Number(stageIndex) || 0));
    const asc = Math.max(0, Math.min(5, Number(ascensionLevel) || 0));
    const effStage = act + (source === 'boss' ? 1 : source === 'elite' ? 0.5 : 0) + asc * 0.35;

    let tierWeights;
    if (source === 'starter') {
      tierWeights = { 1: 100, 2: 0, 3: 0, 4: 0 };
    } else if (effStage < 1.0) {
      tierWeights = { 1: 72, 2: 26, 3: 2, 4: 0 };
    } else if (effStage < 2.0) {
      tierWeights = { 1: 34, 2: 46, 3: 18, 4: 2 };
    } else if (effStage < 3.0) {
      tierWeights = { 1: 14, 2: 34, 3: 38, 4: 14 };
    } else {
      tierWeights = { 1: 6, 2: 20, 3: 42, 4: 32 + asc * 6 };
    }

    const candidates = EQUIP_TEMPLATES.filter((t) => !slot || t.slot === slot);
    return weightedPick(
      candidates.map((tpl) => ({
        item: tpl,
        w: tierWeights[tpl.tier || 1] || 10
      }))
    );
  }

  function rollSingleAffix(def, itemLevel, rarityMult) {
    const raw =
      (def.min + Math.random() * (def.max - def.min) + (itemLevel - 1) * def.levelStep) *
      (0.84 + rarityMult * 0.16);
    let val = def.decimal ? Math.round(raw * 10) / 10 : Math.max(1, Math.round(raw));
    if (def.key === 'critRate') val = Math.min(14, val);
    if (def.key === 'cdr') val = Math.min(12, val);
    if (def.key === 'moveSpeed') val = Math.min(18, val);
    return {
      key: def.key,
      label: def.label,
      val,
      unit: def.unit,
      isPct: !!def.isPct,
      color: def.color
    };
  }

  function computeScaledBaseStats(tpl, lv, rarity, enhanceLv) {
    const tierBoost = 1 + ((tpl.tier || 1) - 1) * 0.05;
    const lvScale = 1 + (lv - 1) * 0.085;
    const starScale = 1 + (enhanceLv || 0) * 0.06;
    const totalMult = lvScale * rarity.statMult * tierBoost * starScale;
    const baseStats = {};

    Object.keys(tpl.baseStats).forEach((k) => {
      const v = tpl.baseStats[k];
      if (k === 'critRate' || k === 'critDmg') {
        baseStats[k] = Math.round(v * (0.9 + rarity.statMult * 0.14 + (enhanceLv || 0) * 0.04) * 100) / 100;
      } else if (k === 'mpRegen') {
        baseStats[k] = Math.round(v * totalMult * 10) / 10;
      } else if (k === 'moveSpeed') {
        baseStats[k] = Math.min(26, Math.max(3, Math.round(v * (0.9 + rarity.statMult * 0.14 + (enhanceLv || 0) * 0.04))));
      } else if (k === 'atk' || k === 'magic') {
        // 锚定角色基础攻击(24)，五槽合计满神装提供约 +28~38 基础面板，保持11~14s黄金Boss击杀节奏
        baseStats[k] = Math.max(1, Math.round(v * 0.56 * totalMult));
      } else {
        baseStats[k] = Math.max(1, Math.round(v * 0.78 * totalMult));
      }
    });
    return baseStats;
  }

  /**
   * 生成一件完整随机词条装备
   * @param {number} itemLevel 装备等级 (Lv.1+)
   * @param {{ source?: string, slot?: string, templateId?: string, forceRarityIndex?: number, minRarityIndex?: number, stageIndex?: number, ascensionLevel?: number }} opts
   */
  function generateEquipment(itemLevel, opts) {
    const options = opts || {};
    const lv = Math.max(1, Math.round(itemLevel || 1));
    const stageIdx = options.stageIndex !== undefined ? options.stageIndex : Math.max(0, Math.floor((lv - 1) / 2));
    const ascLv = options.ascensionLevel || 0;

    let rarity =
      options.forceRarityIndex !== undefined
        ? RARITIES[Math.max(0, Math.min(RARITIES.length - 1, options.forceRarityIndex))]
        : rollRarity(options.source || 'mob', stageIdx, ascLv);

    if (options.minRarityIndex !== undefined && rarity.index < options.minRarityIndex) {
      rarity = RARITIES[Math.min(RARITIES.length - 1, options.minRarityIndex)];
    }

    let tpl = null;
    if (options.templateId) {
      tpl = EQUIP_TEMPLATES.find((t) => t.id === options.templateId) || null;
    }
    if (!tpl) {
      tpl = rollTemplateByDifficulty(options.slot, stageIdx, options.source || 'mob', ascLv);
    }

    // 高阶底材保底品质不低于合理下限（例如T4圣器至少仙品起跳，除非强制指定）
    if (options.forceRarityIndex === undefined && tpl.tier >= 3) {
      const floorIdx = tpl.tier === 4 ? 3 : 2;
      if (rarity.index < floorIdx) rarity = RARITIES[floorIdx];
    }

    const enhanceLv = options.enhanceLv || 0;
    const baseStats = computeScaledBaseStats(tpl, lv, rarity, enhanceLv);

    const poolCopy = AFFIX_POOL.slice().sort(() => Math.random() - 0.5);
    const affixes = [];
    for (let i = 0; i < rarity.affixCount && i < poolCopy.length; i++) {
      affixes.push(rollSingleAffix(poolCopy[i], lv, rarity.statMult));
    }

    const special = rarity.hasSpecial ? pick(SPECIAL_PASSIVES) : null;
    const slotDef = EQUIP_SLOTS.find((s) => s.id === tpl.slot) || EQUIP_SLOTS[0];
    const setDef = tpl.setId ? EQUIP_SETS[tpl.setId] : null;

    const item = {
      uid: _equipUid++,
      templateId: tpl.id,
      tier: tpl.tier || 1,
      setId: tpl.setId || null,
      setName: setDef ? setDef.name : null,
      slot: tpl.slot,
      slotName: slotDef.name,
      name: tpl.name,
      iconKey: tpl.iconKey,
      level: lv,
      enhanceLv,
      rarityIndex: rarity.index,
      rarityId: rarity.id,
      rarityName: rarity.name,
      rarityColor: rarity.color,
      bgTint: rarity.bgTint,
      recycleGold: Math.round(rarity.recycleGold * (1 + (lv - 1) * 0.16 + ((tpl.tier || 1) - 1) * 0.15)),
      baseStats,
      affixes,
      special,
      score: 0
    };

    item.score = calcGearScore(item);
    return item;
  }

  /**
   * 装备升品重铸（原地升级并保留原有神兵底材与淬火星级，兼容直接调用与赋值调用）
   */
  function upgradeEquipmentRarity(item) {
    if (!item) return null;
    const tpl = EQUIP_TEMPLATES.find((t) => t.id === item.templateId) || EQUIP_TEMPLATES[0];
    const nextIdx = Math.min(RARITIES.length - 1, (item.rarityIndex || 0) + 1);
    const rarity = RARITIES[nextIdx];
    item.level = (item.level || 1) + 1;
    item.rarityIndex = rarity.index;
    item.rarityId = rarity.id;
    item.rarityName = rarity.name;
    item.rarityColor = rarity.color;
    item.bgTint = rarity.bgTint;
    item.baseStats = computeScaledBaseStats(tpl, item.level, rarity, item.enhanceLv || 0);

    const poolCopy = AFFIX_POOL.slice().sort(() => Math.random() - 0.5);
    item.affixes = [];
    for (let i = 0; i < rarity.affixCount && i < poolCopy.length; i++) {
      item.affixes.push(rollSingleAffix(poolCopy[i], item.level, rarity.statMult));
    }
    if (rarity.hasSpecial && !item.special) {
      item.special = pick(SPECIAL_PASSIVES);
    }
    item.recycleGold = Math.round(rarity.recycleGold * (1 + (item.level - 1) * 0.16));
    item.score = calcGearScore(item);
    return item;
  }

  /**
   * 消耗妖魔素材重随附加词条（保留底材、等级、品质与星级）
   */
  function reforgeEquipmentAffixes(item) {
    if (!item) return null;
    const rarity = RARITIES[item.rarityIndex] || RARITIES[0];
    const poolCopy = AFFIX_POOL.slice().sort(() => Math.random() - 0.5);
    item.affixes = [];
    for (let i = 0; i < rarity.affixCount && i < poolCopy.length; i++) {
      item.affixes.push(rollSingleAffix(poolCopy[i], item.level || 1, rarity.statMult));
    }
    if (rarity.hasSpecial) {
      item.special = pick(SPECIAL_PASSIVES);
    }
    item.score = calcGearScore(item);
    return item;
  }

  /**
   * 计算淬火升星（+1 ~ +5）所需妖材与金铢消耗
   */
  function getEnhanceCost(item) {
    if (!item) return null;
    const cur = item.enhanceLv || 0;
    if (cur >= MAX_ENHANCE_LV) return { isMax: true, gold: 0, materials: [] };

    const nextStar = cur + 1;
    const gold = Math.round((35 + cur * 30) * (1 + ((item.tier || 1) - 1) * 0.25));
    const materials = [];
    if (nextStar <= 2) {
      materials.push({ id: 'mat_xuantie', count: 1 + nextStar });
      materials.push({ id: 'mat_yaogu', count: nextStar });
    } else if (nextStar <= 4) {
      materials.push({ id: 'mat_xuantie', count: 3 });
      materials.push({ id: 'mat_huojing', count: nextStar - 1 });
      if (nextStar === 4) materials.push({ id: 'mat_taiyijin', count: 1 });
    } else {
      materials.push({ id: 'mat_taiyijin', count: 2 });
      materials.push({ id: 'mat_yaodan', count: 1 });
    }
    return { isMax: false, nextStar, gold, materials };
  }

  function enhanceEquipment(item) {
    if (!item || (item.enhanceLv || 0) >= MAX_ENHANCE_LV) return item;
    const tpl = EQUIP_TEMPLATES.find((t) => t.id === item.templateId) || EQUIP_TEMPLATES[0];
    const rarity = RARITIES[item.rarityIndex] || RARITIES[0];
    item.enhanceLv = (item.enhanceLv || 0) + 1;
    item.baseStats = computeScaledBaseStats(tpl, item.level || 1, rarity, item.enhanceLv);
    item.score = calcGearScore(item);
    return item;
  }

  /**
   * 计算八卦锻造台打造指定模板所需的金铢、素材及灵蕴补齐差价
   */
  function evaluateForgeRecipe(tpl, materialBag, currentGold, currentSouls, targetLevel) {
    const tierInfo = EQUIP_TIERS[tpl.tier || 1] || EQUIP_TIERS[1];
    const lv = Math.max(1, targetLevel || 1);
    const goldCost = Math.round(tierInfo.forgeGold * (1 + (lv - 1) * 0.12));
    const bag = materialBag || {};
    let missingSoulsCost = 0;
    let allMatsReady = true;

    const reqList = (tpl.recipe || []).map((r) => {
      const mDef = MATERIAL_MAP[r.id] || MONSTER_MATERIALS[0];
      const owned = bag[r.id] || 0;
      const lack = Math.max(0, r.count - owned);
      if (lack > 0) {
        allMatsReady = false;
        missingSoulsCost += lack * (mDef.alchemySouls || 12);
      }
      return {
        id: r.id,
        name: mDef.name,
        iconKey: mDef.iconKey,
        color: mDef.color,
        required: r.count,
        owned,
        lack
      };
    });

    const hasGold = (currentGold || 0) >= goldCost;
    const canDirectForge = hasGold && allMatsReady;
    const canAlchemyForge = hasGold && !allMatsReady && (currentSouls || 0) >= missingSoulsCost;

    return {
      goldCost,
      minRarityIndex: tierInfo.minRarity,
      minRarityName: RARITIES[tierInfo.minRarity].name,
      minRarityColor: RARITIES[tierInfo.minRarity].color,
      reqList,
      allMatsReady,
      missingSoulsCost,
      hasGold,
      canDirectForge,
      canAlchemyForge
    };
  }

  function forgeEquipmentByTemplate(templateId, itemLevel, ascensionLevel) {
    const tpl = EQUIP_TEMPLATES.find((t) => t.id === templateId) || EQUIP_TEMPLATES[0];
    const tierInfo = EQUIP_TIERS[tpl.tier || 1] || EQUIP_TIERS[1];
    // 锻造有机会暴击出更高 1 阶品质（大成功！）
    const greatSuccess = Math.random() < 0.24 + (ascensionLevel || 0) * 0.04;
    const rarityIdx = Math.min(RARITIES.length - 1, tierInfo.minRarity + (greatSuccess ? 1 : 0));
    return {
      greatSuccess,
      item: generateEquipment(itemLevel, {
        templateId: tpl.id,
        forceRarityIndex: rarityIdx,
        ascensionLevel: ascensionLevel || 0
      })
    };
  }

  /**
   * 分解装备返还金铢、蓝量与对应阶位的怪物素材
   */
  function getRecycleYield(item) {
    const rarity = RARITIES[(item && item.rarityIndex) || 0] || RARITIES[0];
    const gold = (item && item.recycleGold) || rarity.recycleGold;
    const mats = [{ id: 'mat_xuantie', count: 1 }];
    if (rarity.index >= 3) {
      const t2Pool = ['mat_huojing', 'mat_fengsha', 'mat_guizhu', 'mat_zhusi', 'mat_longjin'];
      mats.push({ id: pick(t2Pool), count: 1 });
    }
    if (rarity.index >= 5) {
      mats.push({ id: 'mat_taiyijin', count: 1 });
    }
    return { gold, mp: 25, materials: mats };
  }

  // ==================== 九、怪物素材掉落率计算与防脸黑保底引擎 ====================
  /**
   * 根据怪物 ID / AI / 所属地域推断最契合西游设定的专属素材池
   */
  function inferMonsterMaterialPool(enemyInfo, regionId) {
    const reg = String(regionId || '').toLowerCase();
    const tid = String((enemyInfo && enemyInfo.typeId) || '').toLowerCase();
    const ai = String((enemyInfo && enemyInfo.ai) || '').toLowerCase();
    const nm = String((enemyInfo && enemyInfo.name) || '');

    let t1 = 'mat_yaogu';
    let t2 = 'mat_guizhu';
    let t3 = 'mat_taiyijin';
    let t4 = 'mat_yaodan';

    if (reg.indexOf('huoyan') !== -1 || tid.indexOf('flame') !== -1 || tid.indexOf('bull') !== -1 || nm.indexOf('火') !== -1 || nm.indexOf('牛') !== -1 || nm.indexOf('红孩') !== -1) {
      t1 = 'mat_xuantie';
      t2 = 'mat_huojing';
      t3 = 'mat_niujiao';
      t4 = 'mat_zhenhuo';
    } else if (reg.indexOf('huangfeng') !== -1 || ai.indexOf('leap') !== -1 || nm.indexOf('虎') !== -1 || nm.indexOf('风') !== -1 || nm.indexOf('狮') !== -1 || nm.indexOf('狼') !== -1) {
      t1 = 'mat_hupi';
      t2 = 'mat_fengsha';
      t3 = 'mat_niujiao';
      t4 = 'mat_yaodan';
    } else if (reg.indexOf('liusha') !== -1 || reg.indexOf('tongtian') !== -1 || reg.indexOf('bibo') !== -1 || tid.indexOf('scale') !== -1 || nm.indexOf('水') !== -1 || nm.indexOf('龙') !== -1 || nm.indexOf('鱼') !== -1 || nm.indexOf('冰') !== -1) {
      t1 = 'mat_hanlin';
      t2 = 'mat_longjin';
      t3 = 'mat_leiyu';
      t4 = 'mat_yaodan';
    } else if (reg.indexOf('pansi') !== -1 || ai.indexOf('web') !== -1 || ai.indexOf('poison') !== -1 || nm.indexOf('蛛') !== -1 || nm.indexOf('蝎') !== -1 || nm.indexOf('蜂') !== -1 || nm.indexOf('花') !== -1) {
      t1 = 'mat_yaogu';
      t2 = 'mat_zhusi';
      t3 = 'mat_jinlian';
      t4 = 'mat_yaodan';
    } else if (reg.indexOf('heifeng') !== -1 || reg.indexOf('tianzhu') !== -1 || nm.indexOf('佛') !== -1 || nm.indexOf('僧') !== -1 || nm.indexOf('熊') !== -1) {
      t1 = 'mat_hupi';
      t2 = 'mat_huojing';
      t3 = 'mat_jinlian';
      t4 = 'mat_zhenhuo';
    } else if (reg.indexOf('xiaoleiyin') !== -1 || reg.indexOf('shituo') !== -1 || ai.indexOf('shield') !== -1 || nm.indexOf('雷') !== -1 || nm.indexOf('天将') !== -1 || nm.indexOf('金') !== -1) {
      t1 = 'mat_xuantie';
      t2 = 'mat_fengsha';
      t3 = 'mat_leiyu';
      t4 = 'mat_yaodan';
    }

    return { t1, t2, t3, t4 };
  }

  /**
   * 判定地面整件装备掉落（控制地面整装泛滥，配合防脸黑保底，单局4劫约产出 10~13 件精选装备）
   */
  function shouldDropGroundEquipment(enemyRank, stageIndex, ascensionLevel, pityState, bonusRate) {
    const pity = pityState || { mobEquipDry: 0, eliteEquipDry: 0 };
    if (enemyRank === 'boss') {
      return true;
    }
    if (enemyRank === 'elite') {
      if (pity.eliteEquipDry >= 1 || Math.random() < 0.68 + (bonusRate || 0)) {
        pity.eliteEquipDry = 0;
        return true;
      }
      pity.eliteEquipDry = (pity.eliteEquipDry || 0) + 1;
      return false;
    }
    // 普通小怪：基础 6.5% + 劫数微增，连续 12 只未出则第 13 只 100% 保底出装
    const chance = Math.min(0.16, 0.065 + (stageIndex || 0) * 0.008 + (ascensionLevel || 0) * 0.008 + (bonusRate || 0));
    if ((pity.mobEquipDry || 0) >= 12 || Math.random() < chance) {
      pity.mobEquipDry = 0;
      return true;
    }
    pity.mobEquipDry = (pity.mobEquipDry || 0) + 1;
    return false;
  }

  /**
   * 判定怪物或宝箱的素材掉落列表（含小怪5连保底、精英仙材保底、妖王2连神材保底）
   * 单局 5 分钟期望产出：T1凡材 ~14份、T2灵材 ~9份、T3仙材 ~4.5份、T4神材 ~2.1份
   */
  function rollMonsterMaterialDrops(enemyInfo, opts) {
    const options = opts || {};
    const act = Math.max(0, Math.min(5, Number(options.stageIndex) || 0));
    const asc = Math.max(0, Math.min(5, Number(options.ascensionLevel) || 0));
    const bonus = options.bonusRate || 0;
    const pity = options.pityState || { mobMatDry: 0, eliteT3Dry: 0, bossT4Dry: 0 };
    const pool = inferMonsterMaterialPool(enemyInfo, options.regionId);
    const out = [];

    const addMat = (id, count) => {
      const m = MATERIAL_MAP[id];
      if (!m) return;
      const exist = out.find((x) => x.id === id);
      if (exist) exist.count += count;
      else out.push({ id: m.id, name: m.name, tier: m.tier, color: m.color, iconKey: m.iconKey, count });
    };

    const rank = (enemyInfo && enemyInfo.isBoss)
      ? 'boss'
      : (enemyInfo && enemyInfo.isElite)
      ? 'elite'
      : (options.sourceType || 'mob');

    if (rank === 'boss') {
      // 守关妖王：必掉 T3 仙材 1份，且 T4 神材随劫数 35% -> 55% -> 78% -> 95%（带 1 次未出下次 100% 保底！）
      addMat(pool.t3, 1);

      const t4Chance = Math.min(1.0, (act === 0 ? 0.35 : act === 1 ? 0.55 : act === 2 ? 0.78 : 0.95) + asc * 0.05 + bonus);
      if ((pity.bossT4Dry || 0) >= 1 || Math.random() < t4Chance) {
        pity.bossT4Dry = 0;
        addMat(pool.t4, 1);
      } else {
        pity.bossT4Dry = (pity.bossT4Dry || 0) + 1;
        addMat(pool.t2, 1);
      }

      // 终劫妖尊或高劫度额外概率产出至高【五彩补天石】
      if (act >= 3 || asc >= 2) {
        const chaosChance = act >= 3 ? Math.min(0.95, 0.42 + asc * 0.14) : 0.18 + asc * 0.08;
        if (Math.random() < chaosChance) {
          addMat('mat_butianshi', 1);
        }
      }
      return out;
    }

    if (rank === 'elite') {
      // 精英妖将：100% 必掉 1~2 份素材，且每 2 只精英必保底出 T3 仙材
      const t3Chance = Math.min(0.62, 0.26 + act * 0.08 + asc * 0.04 + bonus);
      if ((pity.eliteT3Dry || 0) >= 1 || Math.random() < t3Chance) {
        pity.eliteT3Dry = 0;
        addMat(pool.t3, 1);
      } else {
        pity.eliteT3Dry = (pity.eliteT3Dry || 0) + 1;
        addMat(pool.t2, 1);
      }
      if (Math.random() < 0.35 + bonus) {
        addMat(pool.t1, 1);
      }
      return out;
    }

    if (rank === 'chest') {
      addMat(Math.random() < 0.45 ? pool.t2 : pool.t1, 1);
      return out;
    }

    // 普通小怪：基础 26% 掉率（+劫数/劫度加成），连续 4 只未掉则第 5 只 100% 必掉！
    const mobDropChance = Math.min(0.58, 0.26 + act * 0.025 + asc * 0.025 + bonus);
    if ((pity.mobMatDry || 0) >= 4 || Math.random() < mobDropChance) {
      pity.mobMatDry = 0;
      const t2Share = Math.min(0.38, 0.16 + act * 0.06 + asc * 0.025);
      addMat(Math.random() < t2Share ? pool.t2 : pool.t1, 1);
    } else {
      pity.mobMatDry = (pity.mobMatDry || 0) + 1;
    }

    return out;
  }

  function calcGearScore(item) {
    let s =
      (item.level || 1) * 11 +
      (item.rarityIndex || 0) * 26 +
      ((item.tier || 1) - 1) * 18 +
      (item.enhanceLv || 0) * 16;
    const bs = item.baseStats || {};
    s +=
      (bs.atk || 0) * 3 +
      (bs.magic || 0) * 3 +
      (bs.def || 0) * 2.2 +
      (bs.maxHp || 0) * 0.6 +
      (bs.maxMp || 0) * 0.5 +
      (bs.moveSpeed || 0) * 1.4;
    (item.affixes || []).forEach((af) => {
      s += af.val * (af.isPct ? 2.8 : 1.5);
    });
    if (item.special) s += 42;
    if (item.setId) s += 14;
    return Math.round(s);
  }

  /**
   * 汇总玩家五件穿戴装备 + 七大西游套装共鸣提供的全部属性总和
   */
  function computeEquipmentTotals(equippedMap) {
    const totals = {
      atkFlat: 0,
      atkPct: 0,
      magicFlat: 0,
      magicPct: 0,
      critRate: 0,
      critDmg: 0,
      maxMp: 0,
      mpRegen: 0,
      mpOnHit: 0,
      defFlat: 0,
      dmgReduct: 0,
      maxHp: 0,
      cdr: 0,
      moveSpeed: 0,
      lifeOnKill: 0,
      specials: {},
      setCounts: {},
      activeSets: []
    };

    if (!equippedMap) return totals;

    EQUIP_SLOTS.forEach((slotDef) => {
      const it = equippedMap[slotDef.id];
      if (!it) return;
      const bs = it.baseStats || {};
      totals.atkFlat += bs.atk || 0;
      totals.magicFlat += bs.magic || 0;
      totals.defFlat += bs.def || 0;
      totals.maxHp += bs.maxHp || 0;
      totals.maxMp += bs.maxMp || 0;
      totals.mpRegen += bs.mpRegen || 0;
      totals.critRate += bs.critRate || 0;
      totals.critDmg += bs.critDmg || 0;
      totals.moveSpeed += bs.moveSpeed || 0;

      (it.affixes || []).forEach((af) => {
        if (af.key === 'atk') totals.atkFlat += af.val;
        else if (af.key === 'atkPct') totals.atkPct += af.val / 100;
        else if (af.key === 'magic') totals.magicFlat += af.val;
        else if (af.key === 'magicPct') totals.magicPct += af.val / 100;
        else if (af.key === 'critRate') totals.critRate += af.val / 100;
        else if (af.key === 'critDmg') totals.critDmg += af.val / 100;
        else if (af.key === 'maxMp') totals.maxMp += af.val;
        else if (af.key === 'mpRegen') totals.mpRegen += af.val;
        else if (af.key === 'mpOnHit') totals.mpOnHit += af.val;
        else if (af.key === 'def') totals.defFlat += af.val;
        else if (af.key === 'maxHp') totals.maxHp += af.val;
        else if (af.key === 'cdr') totals.cdr += af.val / 100;
        else if (af.key === 'moveSpeed') totals.moveSpeed += af.val;
        else if (af.key === 'lifeOnKill') totals.lifeOnKill += af.val;
      });

      if (it.special && it.special.id) {
        totals.specials[it.special.id] = true;
      }

      if (it.setId && EQUIP_SETS[it.setId]) {
        totals.setCounts[it.setId] = (totals.setCounts[it.setId] || 0) + 1;
      }
    });

    // 激活 2件套 / 4件套 共鸣加成
    const applySetStats = (st) => {
      if (!st) return;
      totals.atkFlat += st.atkFlat || 0;
      totals.atkPct += st.atkPct || 0;
      totals.magicFlat += st.magicFlat || 0;
      totals.magicPct += st.magicPct || 0;
      totals.critRate += st.critRate || 0;
      totals.critDmg += st.critDmg || 0;
      totals.maxMp += st.maxMp || 0;
      totals.mpRegen += st.mpRegen || 0;
      totals.mpOnHit += st.mpOnHit || 0;
      totals.defFlat += st.defFlat || 0;
      totals.dmgReduct += st.dmgReduct || 0;
      totals.maxHp += st.maxHp || 0;
      totals.cdr += st.cdr || 0;
      totals.moveSpeed += st.moveSpeed || 0;
      if (st.specialKey) totals.specials[st.specialKey] = true;
    };

    Object.keys(totals.setCounts).forEach((setId) => {
      const cnt = totals.setCounts[setId];
      const setDef = EQUIP_SETS[setId];
      if (!setDef) return;
      if (cnt >= 2) applySetStats(setDef.stats2);
      if (cnt >= 4) applySetStats(setDef.stats4);
      if (cnt >= 2) {
        totals.activeSets.push({
          id: setId,
          name: setDef.name,
          color: setDef.color,
          count: cnt,
          tier4Active: cnt >= 4,
          bonus2Desc: setDef.bonus2Desc,
          bonus4Desc: setDef.bonus4Desc
        });
      }
    });

    // 风行特效词条面板移速加成
    if (totals.specials.wind_swift) {
      totals.moveSpeed += 14;
    }

    return totals;
  }

  /**
   * 格式化基础白字属性用于 UI 展示
   */
  function formatBaseStatLines(baseStats) {
    const lines = [];
    if (!baseStats) return lines;
    if (baseStats.atk) lines.push({ text: `基础攻击 +${baseStats.atk}`, color: '#ffffff' });
    if (baseStats.magic) lines.push({ text: `基础魔法 +${baseStats.magic}`, color: '#e0aaff' });
    if (baseStats.def) lines.push({ text: `基础防御 +${baseStats.def}`, color: '#b7efc5' });
    if (baseStats.maxHp) lines.push({ text: `基础气血 +${baseStats.maxHp}`, color: '#ffccd5' });
    if (baseStats.maxMp) lines.push({ text: `基础蓝量 +${baseStats.maxMp}`, color: '#caf0f8' });
    if (baseStats.mpRegen) lines.push({ text: `基础回蓝 +${baseStats.mpRegen}/s`, color: '#90e0ef' });
    if (baseStats.moveSpeed) lines.push({ text: `基础移速 +${baseStats.moveSpeed}`, color: '#80ffdb' });
    if (baseStats.critRate) lines.push({ text: `基础暴击 +${Math.round(baseStats.critRate * 100)}%`, color: '#fff3b0' });
    if (baseStats.critDmg) lines.push({ text: `基础爆伤 +${Math.round(baseStats.critDmg * 100)}%`, color: '#fff3b0' });
    return lines;
  }

  function getMaterialById(matId) {
    return MATERIAL_MAP[matId] || MONSTER_MATERIALS[0];
  }

  return {
    MAX_ENHANCE_LV,
    EQUIP_SLOTS,
    EQUIP_TIERS,
    RARITIES,
    MONSTER_MATERIALS,
    MATERIAL_MAP,
    EQUIP_SETS,
    EQUIP_TEMPLATES,
    AFFIX_POOL,
    SPECIAL_PASSIVES,
    rollRarity,
    rollTemplateByDifficulty,
    generateEquipment,
    upgradeEquipmentRarity,
    reforgeEquipmentAffixes,
    getEnhanceCost,
    enhanceEquipment,
    evaluateForgeRecipe,
    forgeEquipmentByTemplate,
    getRecycleYield,
    shouldDropGroundEquipment,
    rollMonsterMaterialDrops,
    computeEquipmentTotals,
    formatBaseStatLines,
    getMaterialById
  };
});
