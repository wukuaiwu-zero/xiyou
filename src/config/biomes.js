/**
 * 西游四大劫难关卡、妖魔池与守关妖王配置
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
})('biomes', function (require) {
  let Trib81 = null;
  try {
    Trib81 = require('./tribulations81');
  } catch (e) {
    Trib81 = null;
  }
  const ENEMY_TYPES = {
    wolf_scout: {
      id: 'wolf_scout',
      name: '苍狼先锋',
      hp: 62,
      atk: 14,
      speed: 118,
      width: 24,
      height: 30,
      ai: 'melee_rush',
      attackRange: 34,
      attackCd: 1.25,
      souls: 4,
      gold: 10,
      color: '#8d99ae'
    },
    goblin_archer: {
      id: 'goblin_archer',
      name: '黑风火弓手',
      hp: 48,
      atk: 15,
      speed: 78,
      width: 22,
      height: 28,
      ai: 'ranged_arrow',
      attackRange: 230,
      attackCd: 1.85,
      souls: 5,
      gold: 12,
      color: '#e76f51'
    },
    shield_bear: {
      id: 'shield_bear',
      name: '玄甲黑熊卫',
      hp: 105,
      atk: 19,
      speed: 68,
      width: 30,
      height: 34,
      ai: 'front_shield', // 正面持盾格挡，需翻滚绕后或神通破防！致敬死亡细胞盾兵
      attackRange: 40,
      attackCd: 1.6,
      souls: 7,
      gold: 18,
      color: '#4a4e69'
    },
    tiger_blade: {
      id: 'tiger_blade',
      name: '黄风虎刀客',
      hp: 92,
      atk: 20,
      speed: 138,
      width: 26,
      height: 32,
      ai: 'leap_slash',
      attackRange: 85,
      attackCd: 1.45,
      souls: 7,
      gold: 16,
      color: '#f4a261'
    },
    ghost_caster: {
      id: 'ghost_caster',
      name: '白骨鬼火师',
      hp: 76,
      atk: 18,
      speed: 85,
      width: 24,
      height: 30,
      ai: 'teleport_mage',
      attackRange: 240,
      attackCd: 2.0,
      souls: 8,
      gold: 20,
      color: '#80ffdb'
    },
    bone_reaper: {
      id: 'bone_reaper',
      name: '幽冥白骨将',
      hp: 128,
      atk: 24,
      speed: 96,
      width: 28,
      height: 36,
      ai: 'heavy_cleave',
      attackRange: 48,
      attackCd: 1.55,
      souls: 10,
      gold: 24,
      color: '#e0fbfc'
    },
    bull_guard: {
      id: 'bull_guard',
      name: '平天重甲魔卫',
      hp: 158,
      atk: 27,
      speed: 92,
      width: 32,
      height: 38,
      ai: 'front_shield',
      attackRange: 46,
      attackCd: 1.45,
      souls: 12,
      gold: 28,
      color: '#d90429'
    },
    flame_imp: {
      id: 'flame_imp',
      name: '赤炎罗刹灵',
      hp: 95,
      atk: 24,
      speed: 125,
      width: 24,
      height: 28,
      ai: 'ranged_burst',
      attackRange: 250,
      attackCd: 1.7,
      souls: 10,
      gold: 25,
      color: '#ff9f1c'
    }
  };

  const BOSS_TYPES = {
    black_bear_king: {
      id: 'black_bear_king',
      name: '黑风大王 · 熊罴精',
      subtitle: '第一劫守关妖王',
      hp: 620,
      atk: 24,
      speed: 125,
      width: 42,
      height: 48,
      souls: 35,
      gold: 90,
      color: '#2b2d42',
      accent: '#ff5400',
      patterns: ['spear_charge', 'black_wind_slam', 'fire_orbs']
    },
    yellow_wind_sage: {
      id: 'yellow_wind_sage',
      name: '黄风大圣 · 貂鼠精',
      subtitle: '第二劫守关妖王',
      hp: 920,
      atk: 29,
      speed: 140,
      width: 40,
      height: 46,
      souls: 50,
      gold: 130,
      color: '#e9c46a',
      accent: '#f4a261',
      patterns: ['samadhi_tornado', 'trident_dash', 'sand_barrage']
    },
    white_bone_lady: {
      id: 'white_bone_lady',
      name: '白骨夫人 · 尸魔',
      subtitle: '第三劫守关妖王',
      hp: 1250,
      atk: 34,
      speed: 155,
      width: 36,
      height: 46,
      souls: 68,
      gold: 170,
      color: '#caf0f8',
      accent: '#b5179e',
      patterns: ['phantom_blink', 'bone_spikes', 'soul_spiral']
    },
    bull_demon_king: {
      id: 'bull_demon_king',
      name: '平天大圣 · 牛魔王',
      subtitle: '终劫妖尊',
      hp: 1780,
      atk: 40,
      speed: 135,
      width: 50,
      height: 54,
      souls: 120,
      gold: 260,
      color: '#9d0208',
      accent: '#ffba08',
      patterns: ['bull_stampede', 'quake_cudgel', 'meteor_rain']
    }
  };

  const BIOMES = [
    {
      index: 0,
      id: 'heifeng',
      name: '第一劫 · 黑风山禅院',
      subtitle: '夜火焚林 · 袈裟迷踪',
      skyTop: '#0d1321',
      skyBottom: '#1d2d44',
      mountainFar: '#162438',
      mountainNear: '#22333b',
      tileTop: '#3a5a40',
      tileBody: '#2b2d42',
      tileBorder: '#588157',
      platformColor: '#7f4f24',
      hazardType: 'ember_spikes',
      hazardColor: '#ff5400',
      ambientParticle: 'ember',
      enemies: ['wolf_scout', 'goblin_archer', 'shield_bear'],
      bossId: 'black_bear_king',
      roomWidthTiles: 118,
      enemyCount: 11
    },
    {
      index: 1,
      id: 'huangfeng',
      name: '第二劫 · 黄风岭古漠',
      subtitle: '三昧狂沙 · 断壁残佛',
      skyTop: '#2b1912',
      skyBottom: '#5c3a21',
      mountainFar: '#432818',
      mountainNear: '#6f4518',
      tileTop: '#d4a373',
      tileBody: '#582f0e',
      tileBorder: '#e9c46a',
      platformColor: '#99582a',
      hazardType: 'sand_spikes',
      hazardColor: '#f4a261',
      ambientParticle: 'sand',
      enemies: ['wolf_scout', 'tiger_blade', 'goblin_archer', 'shield_bear'],
      bossId: 'yellow_wind_sage',
      roomWidthTiles: 128,
      enemyCount: 14
    },
    {
      index: 2,
      id: 'baigu',
      name: '第三劫 · 白骨岭幽冥',
      subtitle: '凄迷鬼火 · 三打幻影',
      skyTop: '#0b0914',
      skyBottom: '#1f1638',
      mountainFar: '#19122b',
      mountainNear: '#241b3d',
      tileTop: '#5e60ce',
      tileBody: '#1e1b2e',
      tileBorder: '#7400b8',
      platformColor: '#4a4e69',
      hazardType: 'bone_thorns',
      hazardColor: '#80ffdb',
      ambientParticle: 'wisp',
      enemies: ['ghost_caster', 'bone_reaper', 'tiger_blade'],
      bossId: 'white_bone_lady',
      roomWidthTiles: 136,
      enemyCount: 16
    },
    {
      index: 3,
      id: 'huoyan',
      name: '第四劫 · 火焰山魔窟',
      subtitle: '八百里熔岩 · 平天魔威',
      skyTop: '#1a0505',
      skyBottom: '#4a0e0e',
      mountainFar: '#370617',
      mountainNear: '#6a040f',
      tileTop: '#dc2f02',
      tileBody: '#240b0b',
      tileBorder: '#ffba08',
      platformColor: '#6a040f',
      hazardType: 'lava_pool',
      hazardColor: '#ffba08',
      ambientParticle: 'ember_heavy',
      enemies: ['bull_guard', 'flame_imp', 'bone_reaper', 'ghost_caster'],
      bossId: 'bull_demon_king',
      roomWidthTiles: 142,
      enemyCount: 18
    }
  ];

  const LEGACY_BIOMES = BIOMES.slice();

  // ==================== 注入九九八十一难全部小妖、劫难头目与守关大妖王 ====================
  if (Trib81 && Array.isArray(Trib81.TRIBULATIONS_81)) {
    const presets = Trib81.AI_STATS_PRESET || {};
    Trib81.TRIBULATIONS_81.forEach((t) => {
      const chFactor = 1 + t.chapter * 0.08;
      const aiKey = t.ai || 'melee_rush';
      const p = presets[aiKey] || presets.melee_rush || {
        hp: 68, atk: 16, speed: 110, width: 24, height: 30, range: 42, cd: 1.4
      };

      // 注册为局内可刷出的妖兵/头目定义
      ENEMY_TYPES[t.id] = {
        id: t.id,
        tribNo: t.no,
        tribName: t.tribName,
        rank: t.rank,
        name: t.monsterName,
        weapon: t.weapon,
        lore: t.lore,
        hp: Math.round(p.hp * chFactor * (t.rank === 'elite' ? 1.22 : t.rank === 'boss' ? 1.45 : 1.0)),
        atk: Math.round(p.atk * (1 + t.chapter * 0.06) * (t.rank === 'elite' ? 1.12 : 1.0)),
        speed: p.speed,
        width: t.rank === 'boss' ? 36 : p.width,
        height: t.rank === 'boss' ? 42 : p.height,
        ai: aiKey,
        attackRange: p.range,
        attackCd: p.cd,
        souls: (t.rank === 'elite' ? 8 : 5) + t.chapter,
        gold: (t.rank === 'elite' ? 20 : 12) + t.chapter * 2,
        color: t.color || '#ff9f1c'
      };

      // 注册为守关大妖王或试炼妖王定义（支持任意一难单独作为守关试炼！）
      const baseBossHp = 650 + t.chapter * 165;
      const baseBossAtk = 24 + t.chapter * 2.5;
      BOSS_TYPES[t.id] = {
        id: t.id,
        tribNo: t.no,
        tribName: t.tribName,
        name: t.monsterName,
        subtitle: `第${t.no}难 · ${t.tribName}`,
        weapon: t.weapon,
        lore: t.lore,
        hp: Math.round(t.rank === 'boss' ? baseBossHp : baseBossHp * 0.82),
        atk: Math.round(baseBossAtk),
        speed: t.rank === 'boss' ? 136 : 128,
        width: t.rank === 'boss' ? 44 : 38,
        height: t.rank === 'boss' ? 48 : 42,
        souls: 38 + t.chapter * 12,
        gold: 95 + t.chapter * 24,
        color: t.color || '#d62828',
        accent: t.accent || t.color || '#ffd166',
        patterns: t.patterns || ['spear_charge', 'fire_orbs', 'black_wind_slam']
      };
    });

    // 将关卡扩充为涵盖第 1 ~ 81 难的【九重西游大劫卷】
    if (Array.isArray(Trib81.NINE_CHAPTERS) && Trib81.NINE_CHAPTERS.length === 9) {
      BIOMES.length = 0;
      Trib81.NINE_CHAPTERS.forEach((ch) => {
        const chTribs = Trib81.TRIBULATIONS_81.filter((t) => t.chapter === ch.index);
        const mobIds = chTribs.filter((t) => t.rank === 'mob').map((t) => t.id);
        const eliteIds = chTribs.filter((t) => t.rank === 'elite').map((t) => t.id);
        const bossIds = chTribs.filter((t) => t.rank === 'boss').map((t) => t.id);

        BIOMES.push(
          Object.assign({}, ch, {
            enemies: mobIds.length ? mobIds.concat(eliteIds) : chTribs.map((t) => t.id),
            mobPool: mobIds,
            elitePool: eliteIds.length ? eliteIds : mobIds,
            bossPool: bossIds.length ? bossIds : [ch.defaultBossId],
            bossId: ch.defaultBossId,
            tribulations: chTribs
          })
        );
      });
    }
  }

  /**
   * 根据指定难号（1 ~ 81）返回该难专属的守关妖王、精英头目池与巡山小妖池
   */
  function getTribulationMonsterPack(tribNo) {
    if (!Trib81 || !Array.isArray(Trib81.TRIBULATIONS_81)) {
      const b = BIOMES[0];
      return {
        trib: null,
        bossId: b.bossId,
        bossDef: BOSS_TYPES[b.bossId],
        mobPool: b.enemies,
        elitePool: b.enemies
      };
    }
    const clampedNo = Math.max(1, Math.min(81, Math.round(tribNo || 1)));
    const target = Trib81.TRIBULATIONS_81[clampedNo - 1];
    const chTribs = Trib81.TRIBULATIONS_81.filter((t) => t.chapter === target.chapter);
    const mobs = chTribs.filter((t) => t.rank === 'mob').map((t) => t.id);
    const elites = chTribs.filter((t) => t.rank === 'elite').map((t) => t.id);
    const bosses = chTribs.filter((t) => t.rank === 'boss').map((t) => t.id);

    // 若该难本身就是大妖王或头目，直接由其坐镇决战殿；若为小妖难，则其在关卡高密度现身并由同卷妖王镇守！
    let bossId = target.id;
    if (target.rank === 'mob' && bosses.length > 0) {
      bossId = bosses.find((id) => BOSS_TYPES[id].tribNo >= clampedNo) || bosses[bosses.length - 1];
    }

    const mobPool = target.rank === 'mob' ? [target.id, target.id].concat(mobs) : mobs.length ? mobs : [target.id];
    const elitePool = target.rank === 'elite' ? [target.id].concat(elites) : elites.length ? elites : mobPool;

    return {
      trib: target,
      bossId,
      bossDef: BOSS_TYPES[bossId] || BOSS_TYPES.black_bear_king,
      mobPool,
      elitePool
    };
  }

  return {
    ENEMY_TYPES,
    BOSS_TYPES,
    BIOMES,
    LEGACY_BIOMES,
    TRIBULATIONS_81: (Trib81 && Trib81.TRIBULATIONS_81) || [],
    NINE_CHAPTERS: (Trib81 && Trib81.NINE_CHAPTERS) || [],
    getTribulationMonsterPack
  };
});
