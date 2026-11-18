/**
 * 可操控角色动作模组配置：唐僧师徒四人 + 白龙马（共 5 位）
 * 动作模组全面升级版：
 * 1. 差异化 4~5 段普攻来回循环模组（正反挥砍、多段舞棍/百裂刺、360回旋扫、腾跃劈、裂地终结无缝回环）
 * 2. 段数衔接神通派生系统（C1~C5 切手技）：在不同普攻段数后接技能键[U]，立即取消后摇派生截然不同类型的攻击！
 *    （未处于普攻连段窗口直接按[U]，仍可释放角色招牌本命大招）
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
})('characters', function () {
  const CHARACTERS = [
    // =========================================================================
    // 1. 孙悟空：五段「行者疯魔棍」来回循环 + 五式「七十二变切手派生」
    // =========================================================================
    {
      id: 'wukong',
      name: '孙悟空',
      title: '齐天大圣',
      affinity: 'red',
      affinityLabel: '斗战 · 五段棍法派生',
      comboTitle: '五段·行者疯魔棍',
      themeColor: '#ffaa22',
      accentColor: '#ff3b30',
      weaponName: '如意金箍棒',
      skillName: '大闹天宫·七十二变切手',
      passiveName: '火眼金睛',
      passiveDesc: '暴击+15%，翻滚留毫毛金身引爆；5段普攻循环，各段接[U]派生破军/升龙/毫毛/火轮/擎天柱',
      skillDesc: '裸放[U]化旋风无敌突进；普攻1~5段后接[U]分别派生：破盾伸长刺 / 挑飞升龙棍 / 三毫毛聚爆 / 脱战火眼轮 / 法天擎天柱',
      stats: {
        maxHp: 115,
        maxMp: 105,
        mpRegen: 7.0,
        atk: 24,
        magic: 18,
        armor: 14,
        moveSpeed: 244,
        jumpForce: 455,
        maxJumps: 2,
        critRate: 0.23,
        critMult: 1.85,
        defense: 0.04,
        rollCooldown: 0.56,
        flaskCharges: 3
      },
      combo: [
        {
          name: '迎风扫',
          duration: 0.21,
          hitTime: 0.07,
          cancelTime: 0.14,
          rangeX: 54,
          rangeY: 36,
          dmgMult: 0.96,
          lunge: 95,
          knockX: 90,
          knockY: -25,
          style: 'slash'
        },
        {
          name: '挑云式',
          duration: 0.22,
          hitTime: 0.08,
          cancelTime: 0.15,
          rangeX: 56,
          rangeY: 44,
          dmgMult: 1.14,
          lunge: 105,
          knockX: 95,
          knockY: -78,
          style: 'upSlash'
        },
        {
          name: '舞棍花',
          duration: 0.29,
          hitTime: 0.07,
          hitTimes: [0.07, 0.17],
          cancelTime: 0.21,
          rangeX: 58,
          rangeY: 42,
          hitAround: true,
          dmgMult: 0.78, // 双判合计 1.56x
          lunge: 82,
          knockX: 75,
          knockY: -35,
          style: 'flurrySpin'
        },
        {
          name: '翻身劈',
          duration: 0.27,
          hitTime: 0.11,
          cancelTime: 0.19,
          rangeX: 64,
          rangeY: 48,
          dmgMult: 1.45,
          lunge: 132,
          hopY: -165,
          knockX: 130,
          knockY: -55,
          shake: 3,
          style: 'leapSlash'
        },
        {
          name: '定海立棍',
          duration: 0.35,
          hitTime: 0.14,
          cancelTime: 0.25,
          rangeX: 78,
          rangeY: 54,
          dmgMult: 2.05,
          lunge: 150,
          knockX: 225,
          knockY: -125,
          forceCrit: true,
          stunSec: 0.35,
          shake: 7,
          style: 'heavySlam'
        }
      ],
      derivations: [
        {
          step: 1,
          id: 'wk_d1_pierce',
          name: '缩地破军刺',
          shortName: '破军刺',
          archetype: '突进破盾',
          mpCost: 10,
          cd: 1.5,
          duration: 0.24,
          dmgMult: 1.95,
          desc: '金箍棒暴长215px横贯直线，无视正面盾牌一棍捅穿群妖'
        },
        {
          step: 2,
          id: 'wk_d2_rising',
          name: '腾云升龙棍',
          shortName: '升龙棍',
          archetype: '挑飞浮空',
          mpCost: 11,
          cd: 1.8,
          duration: 0.30,
          dmgMult: 2.1,
          desc: '拔地冲霄挑飞面前妖魔并眩晕1.2s，自身腾空可衔接空中下砸'
        },
        {
          step: 3,
          id: 'wk_d3_clones',
          name: '毫毛千钧阵',
          shortName: '毫毛阵',
          archetype: '聚怪群爆',
          mpCost: 13,
          cd: 2.1,
          duration: 0.26,
          dmgMult: 1.35,
          desc: '震散棍花聚拢周围群妖、清弹幕并化出3尊毫毛金猴连环引爆'
        },
        {
          step: 4,
          id: 'wk_d4_wheel',
          name: '火眼金轮破',
          shortName: '火眼轮',
          archetype: '后撤折返',
          mpCost: 12,
          cd: 1.9,
          duration: 0.25,
          dmgMult: 1.75,
          desc: '后空翻灵巧拉开身位，射出火眼金芒并掷出回旋金箍火轮两段切割'
        },
        {
          step: 5,
          id: 'wk_d5_pillar',
          name: '法天·擎天巨棒',
          shortName: '擎天柱',
          archetype: '终结处决',
          mpCost: 16,
          cd: 2.6,
          duration: 0.36,
          dmgMult: 3.15,
          desc: '天降通天彻地的巨型如意金箍棒法相轰裂大地，大范围必暴震晕'
        }
      ],
      skill: {
        cooldown: 6.5,
        duration: 0.65,
        type: 'wukong_cyclone',
        dmgMult: 0.85,
        ticks: 5
      }
    },

    // =========================================================================
    // 2. 唐僧：四段「大乘禅杖印」来回循环 + 四式「真言法印派生」
    // =========================================================================
    {
      id: 'tangseng',
      name: '唐僧',
      title: '玄奘圣僧',
      affinity: 'purple',
      affinityLabel: '妙法 · 四段禅印派生',
      comboTitle: '四段·大乘禅杖印',
      themeColor: '#ffd966',
      accentColor: '#ff5e57',
      weaponName: '九环锡杖',
      skillName: '紧箍真言·金莲净世',
      passiveName: '功德金身',
      passiveDesc: '甘露瓶+1，每净化5妖回6%气血；4段禅武法印循环，各段接[U]派生降魔光/紧箍阵/护法钟/如来掌',
      skillDesc: '裸放[U]展开金莲大阵震晕护盾；普攻1~4段后接[U]分别派生：贯通降魔激光 / 紧箍聚怪禁锢 / 九环消弹回血钟 / 如来佛国圣柱',
      stats: {
        maxHp: 98,
        maxMp: 150,
        mpRegen: 10.0,
        atk: 20,
        magic: 28,
        armor: 12,
        moveSpeed: 210,
        jumpForce: 440,
        maxJumps: 2,
        critRate: 0.14,
        critMult: 1.65,
        defense: 0.04,
        rollCooldown: 0.64,
        flaskCharges: 4
      },
      combo: [
        {
          name: '慈航指路',
          duration: 0.24,
          hitTime: 0.08,
          cancelTime: 0.16,
          rangeX: 34,
          rangeY: 34,
          dmgMult: 0.95,
          lunge: 22,
          knockX: 85,
          knockY: -25,
          projectile: 'dharma_orb',
          projSpeed: 445,
          pierce: 2,
          style: 'cast'
        },
        {
          name: '双莲渡厄',
          duration: 0.26,
          hitTime: 0.07,
          hitTimes: [0.07, 0.15],
          cancelTime: 0.19,
          rangeX: 36,
          rangeY: 36,
          dmgMult: 0.72, // 双连发佛珠合计 1.44x
          lunge: 24,
          knockX: 90,
          knockY: -30,
          projectile: 'dharma_orb',
          projSpeed: 470,
          pierce: 2,
          style: 'twinCast'
        },
        {
          name: '九环震禅',
          duration: 0.29,
          hitTime: 0.10,
          cancelTime: 0.20,
          rangeX: 64,
          rangeY: 46,
          hitAround: true,
          dmgMult: 1.38,
          lunge: 32,
          knockX: 165,
          knockY: -55,
          stunSec: 0.25,
          projectile: 'dharma_orb',
          projSpeed: 420,
          pierce: 3,
          style: 'staffPulse'
        },
        {
          name: '万佛朝宗',
          duration: 0.36,
          hitTime: 0.13,
          cancelTime: 0.25,
          rangeX: 48,
          rangeY: 46,
          dmgMult: 1.85,
          lunge: 35,
          hopY: -95,
          knockX: 185,
          knockY: -85,
          projectile: 'lotus_blast',
          projSpeed: 405,
          pierce: 4,
          forceCrit: true,
          shake: 5,
          style: 'castHeavy'
        }
      ],
      derivations: [
        {
          step: 1,
          id: 'ts_d1_laser',
          name: '韦陀降魔杵',
          shortName: '降魔杵',
          archetype: '贯通激光',
          mpCost: 11,
          cd: 1.6,
          duration: 0.25,
          dmgMult: 2.05,
          desc: '瞬发320px璀璨韦陀降魔神光贯穿全线，无视护盾并附加减速'
        },
        {
          step: 2,
          id: 'ts_d2_bind',
          name: '紧箍咒锁阵',
          shortName: '紧箍阵',
          archetype: '聚怪禁锢',
          mpCost: 13,
          cd: 2.1,
          duration: 0.26,
          dmgMult: 1.65,
          desc: '在前方妖群布下紧箍真言环，强力拉扯聚拢群妖并定身持续梵烧'
        },
        {
          step: 3,
          id: 'ts_d3_bell',
          name: '九环甘露钟',
          shortName: '甘露钟',
          archetype: '消弹回血',
          mpCost: 14,
          cd: 2.4,
          duration: 0.28,
          dmgMult: 1.55,
          desc: '撑开功德金钟清空敌方弹幕、震飞近身妖魔，并回复7%生命与护盾'
        },
        {
          step: 4,
          id: 'ts_d4_palm',
          name: '如来·佛国圣柱',
          shortName: '如来掌',
          archetype: '终结处决',
          mpCost: 17,
          cd: 2.8,
          duration: 0.36,
          dmgMult: 3.1,
          desc: '苍穹压下巨型金色佛国圣柱裁决前方妖群，造成高额必暴眩晕爆炸'
        }
      ],
      skill: {
        cooldown: 8.0,
        duration: 0.45,
        type: 'tangseng_lotus',
        dmgMult: 2.6,
        stunSec: 2.1,
        shieldRatio: 0.28
      }
    },

    // =========================================================================
    // 3. 猪八戒：四段「天蓬开山耙」来回循环 + 四式「天罡煞气派生」
    // =========================================================================
    {
      id: 'bajie',
      name: '猪八戒',
      title: '天蓬元帅',
      affinity: 'green',
      affinityLabel: '金刚 · 四段重耙派生',
      comboTitle: '四段·天蓬开山耙',
      themeColor: '#7be495',
      accentColor: '#ff9f7f',
      weaponName: '上宝沁金九齿耙',
      skillName: '天罡战车·旋风耙',
      passiveName: '饕餮厚皮',
      passiveDesc: '最高气血与减伤，杀怪22%掉大肉包；4段重耙循环，各段接[U]派生蛮冲/噬血钩/掀地耙/三连崩山',
      skillDesc: '裸放[U]化身霸体旋风战车吸血；普攻1~4段后接[U]分别派生：霸体蛮王冲撞 / 大聚怪噬血钩 / 护盾挑飞掀地 / 三连崩山地裂',
      stats: {
        maxHp: 168,
        maxMp: 95,
        mpRegen: 6.5,
        atk: 28,
        magic: 15,
        armor: 28,
        moveSpeed: 198,
        jumpForce: 435,
        maxJumps: 2,
        critRate: 0.12,
        critMult: 1.75,
        defense: 0.08,
        rollCooldown: 0.70,
        flaskCharges: 3
      },
      combo: [
        {
          name: '开山横拍',
          duration: 0.28,
          hitTime: 0.11,
          cancelTime: 0.20,
          rangeX: 62,
          rangeY: 42,
          dmgMult: 1.2,
          lunge: 78,
          knockX: 135,
          knockY: -40,
          style: 'heavySwing'
        },
        {
          name: '九齿倒钩',
          duration: 0.28,
          hitTime: 0.11,
          cancelTime: 0.20,
          rangeX: 68,
          rangeY: 44,
          dmgMult: 1.35,
          lunge: 58,
          knockX: -115, // 倒钩将敌人硬拽回身前！
          knockY: -55,
          style: 'rakePull'
        },
        {
          name: '横扫千军',
          duration: 0.31,
          hitTime: 0.12,
          cancelTime: 0.22,
          rangeX: 66,
          rangeY: 46,
          hitAround: true,
          dmgMult: 1.55,
          lunge: 85,
          knockX: 145,
          knockY: -50,
          shake: 4,
          style: 'spin360'
        },
        {
          name: '天蓬裂地',
          duration: 0.40,
          hitTime: 0.16,
          cancelTime: 0.29,
          rangeX: 82,
          rangeY: 56,
          dmgMult: 2.25,
          lunge: 118,
          knockX: 255,
          knockY: -145,
          forceCrit: true,
          shake: 8,
          stunSec: 0.6,
          style: 'earthSmash'
        }
      ],
      derivations: [
        {
          step: 1,
          id: 'bj_d1_ram',
          name: '野猪蛮王冲',
          shortName: '蛮王冲',
          archetype: '霸体冲撞',
          mpCost: 10,
          cd: 1.6,
          duration: 0.34,
          dmgMult: 1.9,
          desc: '扛耙霸体狂暴冲撞，将沿途妖魔高推力撞飞上墙触发粉碎秒杀'
        },
        {
          step: 2,
          id: 'bj_d2_hook',
          name: '饕餮噬血钩',
          shortName: '噬血钩',
          archetype: '聚怪吸血',
          mpCost: 12,
          cd: 2.0,
          duration: 0.28,
          dmgMult: 1.85,
          desc: '巨耙横探将前方195px群妖强行拽至身前撕裂，每命中1敌回复5%气血'
        },
        {
          step: 3,
          id: 'bj_d3_upheave',
          name: '黑风掀地耙',
          shortName: '掀地耙',
          archetype: '挑飞护盾',
          mpCost: 12,
          cd: 2.0,
          duration: 0.28,
          dmgMult: 1.95,
          desc: '旋身猛掀大地抛飞周围妖魔眩晕1.3s，并凝聚18%最大生命厚土护盾'
        },
        {
          step: 4,
          id: 'bj_d4_quake',
          name: '天蓬·三连崩山',
          shortName: '三崩山',
          archetype: '终结处决',
          mpCost: 16,
          cd: 2.7,
          duration: 0.36,
          dmgMult: 2.85,
          desc: '拔耙怒砸引爆前方3道递进喷发的熔金岩柱，横扫整条战线必暴击飞'
        }
      ],
      skill: {
        cooldown: 7.8,
        duration: 1.35,
        type: 'bajie_spin',
        dmgMult: 0.68,
        ticks: 7,
        lifesteal: 3
      }
    },

    // =========================================================================
    // 4. 沙悟净：四段「卷帘流沙杖」来回循环 + 四式「玄水剑气派生」
    // =========================================================================
    {
      id: 'wujing',
      name: '沙悟净',
      title: '卷帘大将',
      affinity: 'purple',
      affinityLabel: '妙法/金刚 · 四段水刃派生',
      comboTitle: '四段·卷帘流沙杖',
      themeColor: '#6cd4ff',
      accentColor: '#b388ff',
      weaponName: '降妖月牙宝杖',
      skillName: '流沙玄水阵',
      passiveName: '卷帘神卫',
      passiveDesc: '对减速/眩晕妖魔增伤+30%，自带减伤；4段月牙杖循环，各段接[U]派生贯月刺/回天壁/弱水刃/深渊龙卷',
      skillDesc: '裸放[U]布下流沙漩涡聚怪水阵；普攻1~4段后接[U]分别派生：突进挂冰刺 / 消弹回天水盾 / 五连扇形水刃 / 深渊巨型水龙卷',
      stats: {
        maxHp: 138,
        maxMp: 120,
        mpRegen: 8.0,
        atk: 25,
        magic: 23,
        armor: 22,
        moveSpeed: 218,
        jumpForce: 445,
        maxJumps: 2,
        critRate: 0.15,
        critMult: 1.75,
        defense: 0.06,
        rollCooldown: 0.60,
        flaskCharges: 3
      },
      combo: [
        {
          name: '推窗望月',
          duration: 0.23,
          hitTime: 0.09,
          cancelTime: 0.16,
          rangeX: 56,
          rangeY: 38,
          dmgMult: 1.05,
          lunge: 85,
          knockX: 110,
          knockY: -30,
          style: 'crescentSlash'
        },
        {
          name: '宝杵回旋',
          duration: 0.24,
          hitTime: 0.09,
          cancelTime: 0.17,
          rangeX: 58,
          rangeY: 40,
          dmgMult: 1.2,
          lunge: 90,
          knockX: 115,
          knockY: -40,
          applySlow: 1.5,
          style: 'backSweep'
        },
        {
          name: '朔月双斩',
          duration: 0.27,
          hitTime: 0.07,
          hitTimes: [0.07, 0.15],
          cancelTime: 0.19,
          rangeX: 62,
          rangeY: 44,
          dmgMult: 0.74, // 十字双斩 + 朔月波
          lunge: 96,
          knockX: 125,
          knockY: -45,
          projectile: 'crescent_wave',
          projSpeed: 390,
          pierce: 2,
          style: 'crossSlash'
        },
        {
          name: '满月分海',
          duration: 0.34,
          hitTime: 0.13,
          cancelTime: 0.24,
          rangeX: 70,
          rangeY: 50,
          hitAround: true,
          dmgMult: 1.82,
          lunge: 118,
          knockX: 205,
          knockY: -100,
          projectile: 'crescent_wave_big',
          projSpeed: 425,
          pierce: 4,
          forceCrit: true,
          shake: 5,
          style: 'spin360'
        }
      ],
      derivations: [
        {
          step: 1,
          id: 'wj_d1_surge',
          name: '破浪贯月刺',
          shortName: '贯月刺',
          archetype: '突进挂冰',
          mpCost: 10,
          cd: 1.5,
          duration: 0.30,
          dmgMult: 1.85,
          desc: '卷起激流破盾突刺155px，对沿途妖魔挂满3.5秒寒流减速触发增伤被动'
        },
        {
          step: 2,
          id: 'wj_d2_ward',
          name: '卷帘回天壁',
          shortName: '回天壁',
          archetype: '消弹水盾',
          mpCost: 12,
          cd: 2.0,
          duration: 0.26,
          dmgMult: 1.75,
          desc: '旋杖筑起碧海回天壁，抹除敌方弹幕、震晕周围妖魔并获得16%水盾'
        },
        {
          step: 3,
          id: 'wj_d3_blades',
          name: '三千弱水刃',
          shortName: '弱水刃',
          archetype: '扇形剑气',
          mpCost: 13,
          cd: 1.9,
          duration: 0.26,
          dmgMult: 0.92,
          desc: '挥杖呈扇形齐射5道高速穿透朔月水刃，命中减速目标必定暴击'
        },
        {
          step: 4,
          id: 'wj_d4_maelstrom',
          name: '深渊·流沙龙卷',
          shortName: '深渊卷',
          archetype: '终结处决',
          mpCost: 16,
          cd: 2.7,
          duration: 0.34,
          dmgMult: 2.65,
          desc: '推出横扫全屏的深渊巨型水龙卷，并在原地同步布下狂暴流沙水阵'
        }
      ],
      skill: {
        cooldown: 8.5,
        duration: 4.5,
        type: 'wujing_vortex',
        dmgMult: 0.52,
        slowRatio: 0.45
      }
    },

    // =========================================================================
    // 5. 白龙马：五段「西海游龙枪」来回循环 + 五式「真龙雷霆派生」
    // =========================================================================
    {
      id: 'bailongma',
      name: '白龙马',
      title: '西海龙太子·敖烈',
      affinity: 'red',
      affinityLabel: '斗战/妙法 · 五段雷枪派生',
      comboTitle: '五段·西海游龙枪',
      themeColor: '#e0f7ff',
      accentColor: '#00e5ff',
      weaponName: '白龙吟雷枪',
      skillName: '真龙雷霆闪',
      passiveName: '踏云龙裔',
      passiveDesc: '独有三段跳与最高移速，翻滚降青雷；5段极速雷枪循环，各段接[U]派生背刺闪/升天破/暴雨枪/雷环/万雷劫',
      skillDesc: '裸放[U]化真龙长距瞬移斩；普攻1~5段后接[U]分别派生：瞬移绕后刺 / 腾空重置三段跳 / 六连暴雨雷枪 / 护体盘龙电网 / 九霄万雷天牢',
      stats: {
        maxHp: 106,
        maxMp: 115,
        mpRegen: 8.5,
        atk: 23,
        magic: 22,
        armor: 15,
        moveSpeed: 266,
        jumpForce: 452,
        maxJumps: 3,
        critRate: 0.20,
        critMult: 1.80,
        defense: 0.04,
        rollCooldown: 0.48,
        flaskCharges: 3
      },
      combo: [
        {
          name: '银枪破风',
          duration: 0.17,
          hitTime: 0.055,
          cancelTime: 0.12,
          rangeX: 58,
          rangeY: 30,
          dmgMult: 0.88,
          lunge: 112,
          knockX: 75,
          knockY: -18,
          style: 'lanceThrust'
        },
        {
          name: '游龙回扫',
          duration: 0.19,
          hitTime: 0.065,
          cancelTime: 0.13,
          rangeX: 60,
          rangeY: 38,
          dmgMult: 1.04,
          lunge: 115,
          knockX: 85,
          knockY: -32,
          style: 'backSweep'
        },
        {
          name: '疾电百裂',
          duration: 0.25,
          hitTime: 0.05,
          hitTimes: [0.05, 0.11, 0.17],
          cancelTime: 0.19,
          rangeX: 66,
          rangeY: 34,
          dmgMult: 0.54, // 极速三连刺合计 1.62x！
          lunge: 105,
          knockX: 65,
          knockY: -22,
          style: 'lanceFlurry'
        },
        {
          name: '升龙挑云',
          duration: 0.20,
          hitTime: 0.07,
          cancelTime: 0.14,
          rangeX: 62,
          rangeY: 44,
          dmgMult: 1.32,
          lunge: 122,
          hopY: -130,
          knockX: 105,
          knockY: -82,
          style: 'upSlash'
        },
        {
          name: '沧海贯雷',
          duration: 0.28,
          hitTime: 0.10,
          cancelTime: 0.20,
          rangeX: 78,
          rangeY: 38,
          dmgMult: 1.82,
          lunge: 175,
          knockX: 200,
          knockY: -88,
          projectile: 'dragon_bolt',
          projSpeed: 540,
          pierce: 3,
          forceCrit: true,
          shake: 5,
          style: 'dragonPierce'
        }
      ],
      derivations: [
        {
          step: 1,
          id: 'bl_d1_blink',
          name: '惊雷一闪刺',
          shortName: '一闪刺',
          archetype: '瞬移背刺',
          mpCost: 10,
          cd: 1.4,
          duration: 0.22,
          dmgMult: 1.95,
          desc: '化青电瞬移闪至前方妖魔背后回身雷刺，完美克制持盾妖卫并麻痹'
        },
        {
          step: 2,
          id: 'bl_d2_ascend',
          name: '翔龙升天破',
          shortName: '升天破',
          archetype: '腾空重置跳',
          mpCost: 11,
          cd: 1.7,
          duration: 0.28,
          dmgMult: 1.9,
          desc: '螺旋冲霄挑飞群妖并立即重置全部三段跳次数，无缝转入制空连击'
        },
        {
          step: 3,
          id: 'bl_d3_barrage',
          name: '狂雷暴雨枪',
          shortName: '暴雨枪',
          archetype: '六连枪芒',
          mpCost: 13,
          cd: 1.9,
          duration: 0.26,
          dmgMult: 0.62,
          desc: '枪尖爆射6道超高速穿透青电枪芒覆盖通道，极速叠满高阶连斩'
        },
        {
          step: 4,
          id: 'bl_d4_coil',
          name: '沧海盘龙网',
          shortName: '盘龙网',
          archetype: '护体电网',
          mpCost: 12,
          cd: 1.9,
          duration: 0.25,
          dmgMult: 1.85,
          desc: '银枪绕身激荡青雷电网，电麻眩晕周身群妖1.2s并清扫近身弹幕'
        },
        {
          step: 5,
          id: 'bl_d5_storm',
          name: '九霄·万雷天牢',
          shortName: '万雷劫',
          archetype: '终结处决',
          mpCost: 16,
          cd: 2.6,
          duration: 0.34,
          dmgMult: 2.95,
          desc: '西海真龙咆哮升空，在前方战线连续降下4道粗大九霄天雷柱毁灭清场'
        }
      ],
      skill: {
        cooldown: 5.8,
        duration: 0.32,
        type: 'dragon_dash',
        dmgMult: 2.95,
        dashDist: 250
      }
    }
  ];

  function getCharacterById(id) {
    return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
  }

  return {
    CHARACTERS,
    getCharacterById
  };
});
