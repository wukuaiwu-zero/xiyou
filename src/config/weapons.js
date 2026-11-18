/**
 * 法宝副武器（类死亡细胞副手装备/技能槽）与三才卷轴、仙缘天赋配置
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
})('weapons', function () {
  // 掉落/宝箱可获取的西游法宝副武（携带五行共鸣元素标签）
  const SUB_WEAPONS = [
    {
      id: 'qiankun_ring',
      name: '乾坤圈',
      affinity: 'red',
      element: 'holy',
      cooldown: 4.2,
      dmgMult: 1.9,
      color: '#ffd54f',
      desc: '掷出回旋金圈穿透前方群妖并折返，造成两段暴击伤害',
      behavior: 'boomerang'
    },
    {
      id: 'bajiao_fan',
      name: '太阴芭蕉扇',
      affinity: 'purple',
      element: 'wind',
      cooldown: 5.0,
      dmgMult: 1.65,
      color: '#69f0ae',
      desc: '扇出巨型罡风龙卷横推全屏，强力击退妖魔并摧毁敌方弹幕',
      behavior: 'tornado'
    },
    {
      id: 'zijin_gourd',
      name: '紫金红葫芦',
      affinity: 'purple',
      element: 'fire',
      cooldown: 6.0,
      dmgMult: 2.5,
      color: '#ff6e40',
      desc: '喷涌三昧真火灼烧前方扇形区域，引爆高额火焰持续伤害',
      behavior: 'flame_cone'
    },
    {
      id: 'jingang_snare',
      name: '金刚琢',
      affinity: 'green',
      element: 'thunder',
      cooldown: 6.5,
      dmgMult: 2.1,
      color: '#b2ebf2',
      desc: '砸落太上老君金刚神环震晕范围内妖魔1.8秒，并赋予自身短暂护盾',
      behavior: 'stun_nova'
    },
    {
      id: 'huntian_sash',
      name: '混天绫',
      affinity: 'red',
      element: 'fire',
      cooldown: 4.6,
      dmgMult: 2.25,
      color: '#ff5252',
      desc: '赤红仙绫破空鞭挞周围大范围敌人，命中后附带流血撕裂',
      behavior: 'whip_aoe'
    },
    {
      id: 'demon_mirror',
      name: '昊天照妖镜',
      affinity: 'purple',
      element: 'holy',
      cooldown: 5.5,
      dmgMult: 2.45,
      color: '#ea80fc',
      desc: '发射一道贯穿屏幕的破魔神光，对精英怪与妖王额外造成30%伤害',
      behavior: 'laser_beam'
    }
  ];

  // 类死亡细胞三色属性卷轴（三才天书）
  const SCROLL_TYPES = [
    {
      id: 'red',
      name: '斗战天书',
      subtitle: '主修普攻 · 暴虐破军',
      color: '#ff5252',
      bgTint: 'rgba(255, 68, 68, 0.18)',
      desc: '近战与普攻伤害 +18%\n最大生命值 +11%',
      atkBonus: 0.18,
      skillBonus: 0.06,
      hpBonus: 0.11,
      defBonus: 0
    },
    {
      id: 'purple',
      name: '妙法天书',
      subtitle: '主修神通 · 法宝灵巧',
      color: '#b388ff',
      bgTint: 'rgba(179, 136, 255, 0.18)',
      desc: '神通与法宝伤害 +20%\n技能冷却缩减 +6% · 生命 +8%',
      atkBonus: 0.07,
      skillBonus: 0.20,
      cdBonus: 0.06,
      hpBonus: 0.08,
      defBonus: 0
    },
    {
      id: 'green',
      name: '金刚天书',
      subtitle: '主修体魄 · 不坏金身',
      color: '#69f0ae',
      bgTint: 'rgba(105, 240, 174, 0.18)',
      desc: '最大生命值 +24%\n全伤害减免 +3.5% · 普攻 +9%',
      atkBonus: 0.09,
      skillBonus: 0.08,
      hpBonus: 0.24,
      defBonus: 0.035
    }
  ];

  // 关卡过渡土地庙可选仙缘变异（携带五行元素标签，凑满2/4层触发五行共鸣与双系融合）
  const MUTATIONS = [
    { id: 'vamp_kill', name: '饮血除魔', element: 'fire', desc: '每次击杀妖魔立即回复 4% 最大生命值', color: '#ff5252' },
    { id: 'thunder_roll', name: '踏电惊雷', element: 'thunder', desc: '每次翻滚闪避在起点降下天雷轰击追兵', color: '#40c4ff' },
    { id: 'crit_frenzy', name: '斗战狂热', element: 'wind', desc: '暴击率提升 12%，暴击命中减少本命神通 0.5秒冷却', color: '#ffd740' },
    { id: 'slam_quake', name: '千钧震地', element: 'fire', desc: '空中下砸（下+跳）冲击波范围与伤害提升 65%', color: '#ff9100' },
    { id: 'golden_greed', name: '招财功德', element: 'holy', desc: '妖魔掉落灵蕴与功德金铢数量提升 40%', color: '#ffe57f' },
    { id: 'iron_lotus', name: '护体金莲', element: 'water', desc: '饮用甘露净瓶后获得 4秒 35%伤害减免与攻击力加成', color: '#69f0ae' }
  ];

  // 土地庙局外永久强化项（消耗灵蕴永久升级，采用双曲软上限防后期数值崩坏）
  const META_UPGRADES = [
    { id: 'hp_lv', name: '仙根体魄', capKey: 'maxHpRatioBonus', desc: '双曲软上限永久提升初始最大生命（最高收敛+65%）', baseCost: 30, costStep: 25, maxLv: 15 },
    { id: 'atk_lv', name: '神兵淬炼', capKey: 'atkRatioBonus', desc: '双曲软上限永久提升基础攻击与魔强（最高收敛+55%）', baseCost: 35, costStep: 30, maxLv: 15 },
    { id: 'flask_lv', name: '观音甘露', capKey: 'flaskHealBonus', desc: '双曲软上限永久提升甘露单口回复量（最高收敛+30%）', baseCost: 45, costStep: 40, maxLv: 10 },
    { id: 'crit_lv', name: '慧眼识破', capKey: 'critRateBonus', desc: '双曲软上限永久提升全角色初始暴击率（最高收敛+18%）', baseCost: 40, costStep: 35, maxLv: 10 }
  ];

  function getSubWeaponById(id) {
    return SUB_WEAPONS.find((w) => w.id === id) || SUB_WEAPONS[0];
  }

  return {
    SUB_WEAPONS,
    SCROLL_TYPES,
    MUTATIONS,
    META_UPGRADES,
    getSubWeaponById
  };
});
