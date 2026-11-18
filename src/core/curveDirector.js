/**
 * 《西游破劫录》游戏曲线、五维随机司命与双模式快节奏运行时导演系统
 * (src/core/curveDirector.js)
 *
 * 采用「零侵入 AOP 原型增强架构」，无缝兼容并保留：
 * - 四槽位六品质装备与蓝条系统 (equipment.js)
 * - 九九八十一难完整怪物图鉴与像素精灵 (tribulations81.js / monsters81Sprites.js)
 * - 十二地域独立地形与机关系统 (terrainRegions81.js / terrainRenderer.js)
 * - 抖音激励视频复活、侧边栏与手机竖屏自动横版适配
 *
 * 实装特性：
 * 1. 【双快节奏模式 + 每日同种赛】：四劫破障(5分钟快刷) / 90秒大闹天宫(极速割草) / 每日一难同种挑战赛 + 0~5劫轮回进阶
 * 2. 【第0秒变招·15大本命法相】：开局弹窗三选一（或随机盲盒额外领+25灵蕴&法宝），真实改变五师徒普攻/跳跃/翻滚/神通机制
 * 3. 【300秒锯齿心流曲线】：1.145^s 微指数天书 + 3/6/9卷质变觉醒 + 连斩战意提速(+22%移速/+26%冷却加速) + ψ(t)锯齿Boss曲线
 * 4. 【局局不重样】：近3局0撞车抽样、每局天道异象全局规则、中段8秒西游因果奇遇、击败妖王后「双劫传送门二选一」
 * 5. 【长期维护保障】：局外双曲软上限防膨胀 + 观音杨柳骰(三选一重随) + 紧箍净池保护
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
})('curveDirector', function (require) {
  const Curve = require('../config/progressionCurve');
  const { BIOMES, ENEMY_TYPES, BOSS_TYPES } = require('../config/biomes');
  const { SUB_WEAPONS, MUTATIONS, getSubWeaponById } = require('../config/weapons');
  const SDK_CONFIG = require('../config/sdkConfig');
  const Env = require('../platform/env');
  const DouyinSDK = require('../sdk/douyinSDK');
  const SoundFX = require('../audio/soundFX');
  const { GameApp } = require('../core/gameApp');
  const { Player } = require('../entities/player');
  const { Enemy } = require('../entities/enemy');
  const { UIManager, drawPixelPanel } = require('../ui/hudAndModals');
  const UITheme = require('../ui/uiTheme');

  function getOptionalModule(modKey, relPath) {
    try {
      const root = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : {};
      if (root.XiyouRegistry && root.XiyouRegistry[modKey]) {
        return root.XiyouRegistry[modKey];
      }
      if (typeof module === 'object' && module.exports) {
        return require(relPath);
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  const RUN_MODES = [
    { id: 'STANDARD_4ACT', shortLabel: '⚡ 四劫破障(5分)', startBtn: '⚔ 开启四劫巡礼', desc: '八十一难随机抽4劫 · 双门选路 · 5分钟极速破劫' },
    { id: 'BLITZ_90', shortLabel: '🔥 90秒大闹天宫', startBtn: '🔥 90秒极速爽刷', desc: '90秒无限妖潮同屏割草 · 每12斩自动突破 · 碎片解压' },
    { id: 'DAILY_SEED', shortLabel: '📅 每日同种挑战', startBtn: '📅 挑战今日劫数', desc: '全服今日固定同一种子路线与异象 · 公平竞速冲榜' }
  ];

  const REWARD_BIAS_LABELS = {
    scroll: { badge: '📜 双倍天书倾向', color: '#ff5252', desc: '入口额外赐予1座【三才天书祭坛】' },
    weapon: { badge: '🔮 仙家法宝倾向', color: '#c77dff', desc: '入口额外赐予1座【锁妖法宝神匣】' },
    mutation: { badge: '✨ 灵蕴功德倾向', color: '#72efdd', desc: '入口赐予【+35灵蕴 & +80金铢 & 大肉包】' },
    forge: { badge: '⚒ 神兵披挂倾向', color: '#ffd166', desc: '入口额外爆出1件高阶【仙品/神品随机词条装备】' },
    event: { badge: '🍑 仙缘奇遇倾向', color: '#69f0ae', desc: '本劫必刷【西游因果奇遇祭坛】且甘露+1' },
    gold: { badge: '💰 招财悬赏倾向', color: '#ffd60a', desc: '入口赐予【+120金铢】且本劫掉落提升25%' },
    legendary: { badge: '👑 终劫妖尊决战', color: '#ff2a54', desc: '入口赐予【终劫神兵补给】迎战守关大妖尊' }
  };

  function resolveBiomeIndexByBaseId(baseBiomeId, fallbackIdx) {
    if (!BIOMES || !BIOMES.length) return 0;
    const found = BIOMES.findIndex((b) => b.id === baseBiomeId);
    if (found >= 0) return found;
    return Math.max(0, Math.min(BIOMES.length - 1, fallbackIdx || 0));
  }

  function wrapTextLines(text, maxCharsPerLine) {
    const s = String(text || '');
    const out = [];
    for (let i = 0; i < s.length; i += maxCharsPerLine) {
      out.push(s.slice(i, i + maxCharsPerLine));
    }
    return out;
  }

  function installCurveDirector() {
    if (GameApp.__curveDirectorInstalled) return;
    GameApp.__curveDirectorInstalled = true;

    // =========================================================================
    // 1. 存档扩展：统一通过跨端 Env.getStorage 读取（修复抖音真机 tt.* 下存档丢失问题）
    // =========================================================================
    const origLoadSaveData = GameApp.prototype.loadSaveData;
    GameApp.prototype.loadSaveData = function () {
      const data = origLoadSaveData.call(this);
      const raw = Env.getStorage(SDK_CONFIG.storageKey, {}) || {};

      data.recentRuns = Array.isArray(raw.recentRuns) ? raw.recentRuns.slice(-3) : [];
      data.ascensionLevel = typeof raw.ascensionLevel === 'number' ? raw.ascensionLevel : 0;
      data.runMode = raw.runMode || 'STANDARD_4ACT';
      data.banishedIds = Array.isArray(raw.banishedIds) ? raw.banishedIds.slice() : [];
      data.clearedTribulations =
        raw.clearedTribulations && typeof raw.clearedTribulations === 'object'
          ? Object.assign({}, raw.clearedTribulations)
          : data.clearedTribulations || {};
      data.metaLevels = Object.assign(
        {
          hp_lv: 0,
          atk_lv: 0,
          flask_lv: 0,
          crit_lv: 0,
          reroll_lv: 0,
          banish_lv: 0
        },
        data.metaLevels || {},
        raw.metaLevels || {}
      );
      return data;
    };

    // =========================================================================
    // 2. 玩家面板曲线重塑：双曲软上限 + 1.145^s 微指数 + 3/6/9质变 + 五行共鸣/双系融合
    // =========================================================================
    const origRecalcStats = Player.prototype.recalcStats;
    Player.prototype.recalcStats = function (fullHeal) {
      const prevHpRatio = this.maxHp > 0 ? this.hp / this.maxHp : 1;
      const prevMax = this.maxHp || this.charDef.stats.maxHp;

      // 将局外线性属性归零后调用原版（统一由下方双曲软上限曲线接管，保留装备词条/蓝条/护甲完整计算）
      const savedMetaHp = this.metaHpBonus;
      const savedMetaAtk = this.metaAtkMult;
      const savedMetaCrit = this.metaCritBonus;
      this.metaHpBonus = 0;
      this.metaAtkMult = 1;
      this.metaCritBonus = 0;

      origRecalcStats.call(this, fullHeal);

      this.metaHpBonus = savedMetaHp;
      this.metaAtkMult = savedMetaAtk;
      this.metaCritBonus = savedMetaCrit;

      const curveRes = Curve.calcPlayerCurveStats({
        scrolls: this.scrolls,
        mainAffinity: this.charDef.affinity,
        metaLevels: this._curveMetaLevels || {},
        momentumStacks: this.hitStreak || 0
      });
      this.activeScrollBreakpoint = curveRes.activeBreakpoint;
      this.metaFlaskBonus = curveRes.metaFlaskBonus || 0;
      this.critRate = Math.min(0.95, this.critRate + (curveRes.metaCritBonus || 0));

      // 用双曲软上限 + 微指数 + 阶跃倍率统一修正气血、普攻、魔强与技能威力
      const r = Math.max(0, (this.scrolls.red || 1) - 1);
      const p = Math.max(0, (this.scrolls.purple || 1) - 1);
      const g = Math.max(0, (this.scrolls.green || 1) - 1);
      const oldHpMult = 1 + r * 0.11 + p * 0.08 + g * 0.24;
      const oldLinearAtk = 1 + r * 0.18 + p * 0.07 + g * 0.09;
      const oldLinearMagic = 1 + r * 0.05 + p * 0.22 + g * 0.06;

      this.maxHp = Math.max(30, Math.round((this.maxHp / Math.max(0.5, oldHpMult)) * curveRes.hpMult));
      const ratioFix = curveRes.atkMult / Math.max(0.5, oldLinearAtk);
      this.atk = Math.max(1, Math.round(this.atk * Math.max(0.88, ratioFix)));
      const magicFix = curveRes.atkMult / Math.max(0.5, oldLinearMagic);
      this.magic = Math.max(1, Math.round(this.magic * Math.max(0.88, magicFix)));
      this.skillPower = Math.max(1, Math.round(this.magic * 0.78 + this.atk * 0.42));

      // 汇总本局【五行元素共鸣】与【双系仙术融合】（来源：本命法相 + 法宝副武 + 仙缘变异 + 穿戴装备）
      const elCounts = { fire: 0, thunder: 0, water: 0, wind: 0, holy: 0 };
      const elemCycle = ['fire', 'thunder', 'water', 'wind', 'holy'];
      if (this.equipped) {
        ['weapon', 'helm', 'armor', 'accessory'].forEach((sl) => {
          const it = this.equipped[sl];
          if (!it || (it.rarityIndex || 0) < 1) return;
          if (!it.element) {
            if (it.special && it.special.id === 'samadhi_burst') it.element = 'fire';
            else if (it.special && it.special.id === 'thunder_call') it.element = 'thunder';
            else if (it.special && it.special.id === 'vajra_ward') it.element = 'holy';
            else it.element = elemCycle[Math.abs(it.uid || 0) % 5];
          }
          if (elCounts[it.element] !== undefined) {
            elCounts[it.element] += 1;
          }
        });
      }
      const mainCount = this.scrolls[this.charDef.affinity] || 1;
      const asp = this.starterAspect;
      if (asp && asp.element && elCounts[asp.element] !== undefined) {
        elCounts[asp.element] += mainCount >= 6 ? 2 : 1;
      }
      if (this.subWeapon) {
        const swDef = getSubWeaponById(this.subWeapon);
        if (swDef && swDef.element && elCounts[swDef.element] !== undefined) {
          elCounts[swDef.element] += 1;
        }
      }
      if (Array.isArray(this.mutations)) {
        this.mutations.forEach((mId) => {
          const mDef = MUTATIONS.find((m) => m.id === mId);
          if (mDef && mDef.element && elCounts[mDef.element] !== undefined) {
            elCounts[mDef.element] += 1;
          }
        });
      }
      const prevDuos = (this.synergyState && this.synergyState.activeDuos.map((d) => d.id)) || [];
      this.synergyState = Curve.calcElementalSynergyState(elCounts);
      this.hasDuo = (duoId) =>
        !!(this.synergyState && this.synergyState.activeDuos.some((d) => d.id === duoId));
      this.getElemTier = (elKey) => {
        if (!this.synergyState) return 0;
        const found = this.synergyState.activeElements.find((e) => e.element === elKey);
        return found ? found.tier : 0;
      };

      // 首次激活双系仙术融合时弹出醒目提示
      if (this._appRef && this._appRef.ui && this.synergyState.activeDuos.length > 0) {
        this._notifiedDuos = this._notifiedDuos || {};
        this.synergyState.activeDuos.forEach((duo) => {
          if (!this._notifiedDuos[duo.id] && prevDuos.indexOf(duo.id) === -1) {
            this._notifiedDuos[duo.id] = true;
            this._appRef.ui.showToast(`☯ 激活双系融合【${duo.name}】！`, 3.4);
          }
        });
      }

      // 叠加本局【本命法相】与撞墙破甲倍率修正
      this.wallSplatMult = 1.0;
      if (asp && asp.mods) {
        if (asp.mods.atkMult) {
          this.atk = Math.round(this.atk * asp.mods.atkMult);
        }
        if (asp.mods.wallSplatMult) {
          this.wallSplatMult *= asp.mods.wallSplatMult;
        }
      }
      if (this.worldMutator && this.worldMutator.id === 'mut_giant_brawl') {
        this.wallSplatMult *= 2.0;
      }

      // 叠加五行【九天罡风】移速、撞墙推力与6阶爆伤转化
      const windTier = this.getElemTier('wind');
      if (windTier >= 2) {
        this.moveSpeed = Math.round(this.moveSpeed * 1.12);
        this.wallSplatMult *= 1.35;
      }
      if (windTier >= 6) {
        const extraSpdRatio = Math.max(0, this.moveSpeed / Math.max(1, this.charDef.stats.moveSpeed) - 1);
        this.critMult = Math.round((this.critMult + extraSpdRatio * 1.8) * 100) / 100;
      }

      // 叠加八戒【饕餮吞天相】永久吃包气血层数
      if (this.gluttonBonusHp) {
        this.maxHp += this.gluttonBonusHp;
      }

      // 叠加【天道异象·修罗破釜】正负双向修正
      if (this.worldMutator && this.worldMutator.id === 'mut_glass_cannon') {
        this.maxHp = Math.max(35, Math.round(this.maxHp * 0.72));
        this.atk = Math.round(this.atk * 1.55);
        this.skillPower = Math.round(this.skillPower * 1.55);
      }

      // 6卷觉醒移速加成
      if (mainCount >= 6) {
        this.moveSpeed = Math.round(this.moveSpeed * 1.1);
      }

      if (fullHeal) {
        this.hp = this.maxHp;
      } else {
        const gained = Math.max(0, this.maxHp - prevMax);
        this.hp = Math.max(1, Math.min(this.maxHp, Math.round(Math.max(this.hp + gained, this.maxHp * prevHpRatio * 0.95))));
      }
    };

    // 伤害掷骰钩子：融合本命法相（滞空增伤/护盾暴击/残血疯魔/冰冻碎冰）与天道异象（金铢爆伤）
    const origRollDamage = Player.prototype.rollDamage;
    Player.prototype.rollDamage = function (baseDmg, forceCrit) {
      let modifiedBase = baseDmg;
      let extraCritRate = 0;
      const asp = this.starterAspect;

      if (asp) {
        if (asp.id === 'bl_aspect_soar' && !this.onGround) {
          modifiedBase *= 1.32;
        } else if (asp.id === 'ts_aspect_vajra' && this.shieldHp > 0) {
          extraCritRate += 0.30;
        } else if (asp.id === 'bj_aspect_berserk') {
          const missingRatio = Math.max(0, 1 - this.hp / Math.max(1, this.maxHp));
          modifiedBase *= 1 + missingRatio * 0.45;
          extraCritRate += missingRatio * 0.28;
        }
      }

      const savedCrit = this.critRate;
      const savedCritMult = this.critMult;
      if (extraCritRate > 0) {
        this.critRate = Math.min(0.95, this.critRate + extraCritRate);
      }
      if (this.worldMutator && this.worldMutator.id === 'mut_golden_fortune') {
        this.critMult += Math.min(0.8, Math.floor((this.gold || 0) / 100) * 0.08);
      }

      const out = origRollDamage.call(this, modifiedBase, forceCrit);
      this.critRate = savedCrit;
      this.critMult = savedCritMult;
      return out;
    };

    // 普攻变招钩子：实现第0秒变招（悟空3段分身/千钧震波、唐僧三散射佛珠、悟净全段月牙波、3卷剑气觉醒）
    const origTryPrimaryAttack = Player.prototype.tryPrimaryAttack;
    Player.prototype.tryPrimaryAttack = function (moveDir) {
      const prevTimer = this.attackTimer;
      origTryPrimaryAttack.call(this, moveDir);
      // 仅在本次成功挥出新普攻时触发衍生弹幕/分身
      if (prevTimer > 0 || this.attackTimer <= 0) return;

      const app = this._appRef;
      if (!app || !app.effects) return;
      const effects = app.effects;
      const enemies = app.enemies || [];
      const ctxBag = app.buildWorldContext();
      const asp = this.starterAspect;
      const step = this.currentComboStep;

      // 【悟空·身外毫毛相】：第3段重击召唤金猴分身协同轰炸
      if (asp && asp.id === 'wk_aspect_clone' && step === 2) {
        effects.spawnZone({
          kind: 'wukong_clone_bomb',
          x: this.x + this.dir * 42,
          y: this.y,
          radius: 64,
          dmg: Math.round(this.atk * 1.25),
          duration: 0.32
        });
      }

      // 【悟空·定海千钧相】：每击释放地面震荡气环
      if (asp && asp.id === 'wk_aspect_pillar') {
        effects.spawnZone({
          kind: 'shockwave_ring',
          x: this.x + this.dir * 32,
          y: this.y - 8,
          radius: step === 2 ? 92 : 62,
          color: '#ffd166',
          duration: 0.22
        });
      }

      // 【唐僧·大乘万佛相】：额外散射上下两枚穿透金莲佛珠
      if (asp && asp.id === 'ts_aspect_dharma') {
        [-58, 58].forEach((vyVal) => {
          effects.spawnProjectile({
            owner: 'player',
            kind: 'dharma_orb',
            x: this.x + this.dir * 16,
            y: this.y - 18,
            vx: this.dir * 400,
            vy: vyVal,
            radius: 6,
            dmg: Math.round(this.atk * 0.68),
            isCrit: false,
            pierce: 2,
            color: '#ffd166',
            coreColor: '#ffffff',
            life: 0.85
          });
        });
      }

      // 【沙悟净·朔月追魂相】：第1段也发射折返穿透朔月气刃
      if (asp && asp.id === 'wj_aspect_crescent' && step === 0) {
        effects.spawnProjectile({
          owner: 'player',
          kind: 'boomerang',
          x: this.x + this.dir * 16,
          y: this.y - 18,
          vx: this.dir * 380,
          vy: 0,
          radius: 9,
          dmg: Math.round(this.atk * 0.82),
          isCrit: false,
          pierce: 99,
          passWall: true,
          ignoreShield: true,
          color: '#6cd4ff',
          life: 1.05
        });
      }

      // 【3卷小成质变】：主属性满3卷后，任何角色第3段重击额外斩出一道破甲真气波！
      const mainScrolls = this.scrolls[this.charDef.affinity] || 1;
      if (mainScrolls >= 3 && step === 2) {
        const waveCol = this.charDef.affinity === 'red' ? '#ff5252' : this.charDef.affinity === 'purple' ? '#c77dff' : '#69f0ae';
        effects.spawnProjectile({
          owner: 'player',
          kind: 'crescent_wave',
          x: this.x + this.dir * 18,
          y: this.y - 18,
          vx: this.dir * 440,
          vy: 0,
          radius: 10,
          dmg: Math.round(this.atk * 0.78),
          isCrit: mainScrolls >= 6,
          pierce: 4,
          ignoreShield: true,
          color: waveCol,
          coreColor: '#ffffff',
          life: 0.7
        });
      }

      // 【八戒·狂齿破军相】：攻速随失血加快
      if (asp && asp.id === 'bj_aspect_berserk') {
        const miss = Math.max(0, 1 - this.hp / Math.max(1, this.maxHp));
        this.attackTimer *= Math.max(0.68, 1 - miss * 0.32);
      }

      void enemies;
      void ctxBag;
    };

    // 二段跳/下砸钩子：白龙马【九霄雷龙相】空中投射雷枪 + 悟净【卷帘镇岳相】下砸宝幢护体
    const origTryJump = Player.prototype.tryJump;
    Player.prototype.tryJump = function (downHeld, effects) {
      const wasOnGround = this.onGround;
      const prevJumps = this.jumpsLeft;
      origTryJump.call(this, downHeld, effects);

      const app = this._appRef;
      const asp = this.starterAspect;
      if (!app || !asp) return;

      // 白龙马二/三段跳投射3枚龙鳞雷枪
      if (asp.id === 'bl_aspect_soar' && !wasOnGround && this.jumpsLeft < prevJumps && app.effects) {
        [-95, 0, 95].forEach((vxOff) => {
          app.effects.spawnProjectile({
            owner: 'player',
            kind: 'dragon_bolt',
            x: this.x,
            y: this.y - 8,
            vx: this.dir * 120 + vxOff,
            vy: 420,
            radius: 7,
            dmg: Math.round(this.atk * 0.92),
            isCrit: true,
            pierce: 2,
            ignoreShield: true,
            color: '#00f5d4',
            coreColor: '#ffffff',
            life: 0.9
          });
        });
      }

      // 悟净千钧下砸开启4秒宝幢减伤金光
      if (asp.id === 'wj_aspect_guardian' && this.isGroundSmashing) {
        this.lotusBuffTimer = Math.max(this.lotusBuffTimer, 4.2);
        this.shieldHp = Math.max(this.shieldHp, Math.round(this.maxHp * 0.14));
      }
    };

    // 翻滚钩子：白龙马【沧海幻龙相】穿怪缩减真龙闪冷却 + 修罗破釜延长无敌帧
    const origTryRoll = Player.prototype.tryRoll;
    Player.prototype.tryRoll = function (moveDir, worldCtx) {
      const prevRoll = this.rollTimer;
      origTryRoll.call(this, moveDir, worldCtx);
      if (prevRoll > 0 || this.rollTimer <= 0) return;

      if (this.worldMutator && this.worldMutator.id === 'mut_glass_cannon') {
        this.invulnTimer += 0.12;
      }

      if (this.starterAspect && this.starterAspect.id === 'bl_aspect_mirage' && worldCtx && worldCtx.enemies) {
        this.rollCdTimer *= 0.55;
        let nearEnemy = false;
        for (let i = 0; i < worldCtx.enemies.length; i++) {
          const e = worldCtx.enemies[i];
          if (!e.dead && Math.hypot(e.x - this.x, e.y - this.y) < 110) {
            nearEnemy = true;
            break;
          }
        }
        if (nearEnemy) {
          this.skillCdTimer = Math.max(0, this.skillCdTimer - 2.0);
          worldCtx.effects && worldCtx.effects.spawnFloatingText(this.x, this.y - 42, '幻龙缩冷却 -2s!', '#00f5d4', false);
        }
      }
    };

    // 本命神通与法宝钩子：悟空狂雷相、悟净双阵缩CD、雷系4阶麻痹落雷、双系融合【风助火势·业火龙卷】
    const triggerThunder4Pulse = (player, worldCtx) => {
      if (!player.getElemTier || player.getElemTier('thunder') < 4 || !worldCtx.enemies) return;
      worldCtx.effects && worldCtx.effects.spawnZone({
        kind: 'shockwave_ring',
        x: player.x,
        y: player.y - 16,
        radius: 118,
        color: '#00e5ff',
        duration: 0.25
      });
      for (let i = 0; i < worldCtx.enemies.length; i++) {
        const e = worldCtx.enemies[i];
        if (!e.dead && Math.hypot(e.x - player.x, e.y - player.y) <= 118) {
          worldCtx.onHitEnemy(e, {
            dmg: Math.max(5, Math.round(player.skillPower * 0.55)),
            isCrit: true,
            stunSec: 0.6,
            ignoreShield: true,
            _fromChain: true,
            sourceX: player.x
          });
        }
      }
    };

    const spawnFireWindTornado = (player, effects) => {
      if (!effects) return;
      effects.spawnProjectile({
        owner: 'player',
        kind: 'tornado',
        x: player.x + player.dir * 20,
        y: player.y - 18,
        vx: player.dir * 295,
        vy: 0,
        radius: 25,
        dmg: Math.max(10, Math.round(player.skillPower * 1.45)),
        isCrit: true,
        pierce: 99,
        passWall: true,
        destroyEnemyProj: true,
        ignoreShield: true,
        knock: 240,
        color: '#ff5400',
        coreColor: '#ffd166',
        life: 1.35
      });
      effects.spawnFloatingText(player.x, player.y - 44, '🌪🔥业火龙卷!', '#ff6e40', true);
    };

    const origTryCastSkill = Player.prototype.tryCastSkill;
    Player.prototype.tryCastSkill = function (worldCtx) {
      const prevCd = this.skillCdTimer;
      origTryCastSkill.call(this, worldCtx);
      if (prevCd <= 0 && this.skillCdTimer > 0) {
        const asp = this.starterAspect;
        if (asp && asp.id === 'wk_aspect_havoc') {
          this.skillCdTimer *= 0.75;
        } else if (asp && asp.id === 'wj_aspect_abyss') {
          this.skillCdTimer *= 0.58;
        }
        triggerThunder4Pulse(this, worldCtx);
        if (this.hasDuo && this.hasDuo('duo_fire_wind')) {
          spawnFireWindTornado(this, worldCtx.effects);
        }
      }
    };

    const origTryCastSubWeapon = Player.prototype.tryCastSubWeapon;
    Player.prototype.tryCastSubWeapon = function (worldCtx) {
      const prevCd = this.subWeaponCdTimer;
      origTryCastSubWeapon.call(this, worldCtx);
      if (prevCd <= 0 && this.subWeaponCdTimer > 0) {
        triggerThunder4Pulse(this, worldCtx);
        if (this.hasDuo && this.hasDuo('duo_fire_wind')) {
          spawnFireWindTornado(this, worldCtx.effects);
        }
      }
    };

    // 饮用甘露钩子：唐僧【怒目金刚相】开启护法金钟护盾
    const origUseFlask = Player.prototype.useFlask;
    Player.prototype.useFlask = function (effects) {
      const used = origUseFlask.call(this, effects);
      if (used && this.starterAspect && this.starterAspect.id === 'ts_aspect_vajra') {
        this.shieldHp = Math.max(this.shieldHp, Math.round(this.maxHp * 0.32));
        effects && effects.spawnZone({
          kind: 'shockwave_ring',
          x: this.x,
          y: this.y - 16,
          radius: 120,
          color: '#ffd166',
          duration: 0.35
        });
        effects && effects.spawnFloatingText(this.x, this.y - 46, '护法金钟护体！', '#ffd166', true);
      }
      return used;
    };

    // 玩家帧更新钩子：连斩破劫战意提速 + 血月冷却加速 + 八戒星河相旋风吸怪 + 唐僧紧箍业火
    const origPlayerUpdate = Player.prototype.update;
    Player.prototype.update = function (dt, input, worldCtx) {
      const baseSpeed = this.moveSpeed;
      // 1. 连斩破劫极速：最高 +22% 移速，消灭跑图拖沓感
      const mRatio = Math.min(1, (this.hitStreak || 0) / 25);
      if (mRatio > 0) {
        this.moveSpeed = Math.round(baseSpeed * (1 + mRatio * 0.22));
      }

      origPlayerUpdate.call(this, dt, input, worldCtx);
      this.moveSpeed = baseSpeed;

      // 2. 连斩冷却加速 (+26%) 与【血月狂劫】冷却加速 (+35%)
      let extraHaste = mRatio * 0.26;
      if (this.worldMutator && this.worldMutator.id === 'mut_blood_moon') {
        extraHaste += 0.50; // 等效约 -35% CD
      }
      if (extraHaste > 0) {
        this.skillCdTimer = Math.max(0, this.skillCdTimer - dt * extraHaste);
        this.subWeaponCdTimer = Math.max(0, this.subWeaponCdTimer - dt * extraHaste);
      }

      // 3. 八戒【天蓬星河相】：旋风期间强力牵引群妖
      if (this.starterAspect && this.starterAspect.id === 'bj_aspect_marshal' && this.activeSkillTimer > 0 && worldCtx.enemies) {
        for (let i = 0; i < worldCtx.enemies.length; i++) {
          const e = worldCtx.enemies[i];
          if (!e.dead && !e.isBoss && Math.hypot(e.x - this.x, e.y - this.y) < 175) {
            e.x += (this.x - e.x) * Math.min(1, dt * 4.2);
            e.slowTimer = Math.max(e.slowTimer, 0.5);
          }
        }
      }

      // 4. 唐僧【紧箍咒言相】：眩晕中的妖魔每秒承受紧箍业火灼烧
      if (this.starterAspect && this.starterAspect.id === 'ts_aspect_sutra' && worldCtx.enemies) {
        this._sutraBurnTick = (this._sutraBurnTick || 0) - dt;
        if (this._sutraBurnTick <= 0) {
          this._sutraBurnTick = 0.45;
          for (let i = 0; i < worldCtx.enemies.length; i++) {
            const e = worldCtx.enemies[i];
            if (!e.dead && e.stunTimer > 0) {
              worldCtx.onHitEnemy(e, {
                dmg: Math.max(4, Math.round(this.atk * 0.48)),
                isCrit: false,
                ignoreShield: true,
                _fromChain: true,
                sourceX: this.x
              });
            }
          }
        }
      }

      // 5. 双系融合【红莲业火 · 净世金身】：拥有护盾时持续炙烤周围妖魔（护盾越高灼烧越猛）
      if (this.hasDuo && this.hasDuo('duo_holy_fire') && this.shieldHp > 0 && worldCtx.enemies) {
        this._holyFireTick = (this._holyFireTick || 0) - dt;
        if (this._holyFireTick <= 0) {
          this._holyFireTick = 0.65;
          const shieldScale = 1 + Math.min(1.2, this.shieldHp / Math.max(1, this.maxHp * 0.4));
          const auraDmg = Math.max(5, Math.round(this.skillPower * 0.36 * shieldScale));
          worldCtx.effects && worldCtx.effects.spawnZone({
            kind: 'shockwave_ring',
            x: this.x,
            y: this.y - 16,
            radius: 86,
            color: '#ff6e40',
            duration: 0.22
          });
          for (let i = 0; i < worldCtx.enemies.length; i++) {
            const e = worldCtx.enemies[i];
            if (!e.dead && Math.hypot(e.x - this.x, e.y - this.y) <= 90) {
              e._burnTimer = Math.max(e._burnTimer || 0, 2.0);
              worldCtx.onHitEnemy(e, {
                dmg: auraDmg,
                isCrit: false,
                ignoreShield: true,
                _fromChain: true,
                sourceX: this.x
              });
            }
          }
        }
      }
    };

    // =========================================================================
    // 3. 游戏主循环与关卡路由接管：八十一难动态抽劫、90秒大闹天宫、奇遇与双传送门
    // =========================================================================
    const origStartNewRun = GameApp.prototype.startNewRun;
    GameApp.prototype.startNewRun = function (charId, startOpts) {
      const mode = this.saveData.runMode || 'STANDARD_4ACT';
      const ascLv = this.saveData.ascensionLevel || 0;
      const seed = mode === 'DAILY_SEED' ? Curve.getDailyChallengeSeed() : undefined;

      // 若项目已加载九九八十一难完整库 (tribulations81.js + terrainRegions81.js)，自动提取全部 81 难与 12 地域构建四洲奖池！
      const trib81Mod = getOptionalModule('tribulations81', '../config/tribulations81');
      const terrain81Mod = getOptionalModule('terrainRegions81', '../config/terrainRegions81');
      const buildExternalPool = () => {
        if (!trib81Mod || !Array.isArray(trib81Mod.TRIBULATIONS_81) || trib81Mod.TRIBULATIONS_81.length < 16) {
          return null;
        }
        return trib81Mod.TRIBULATIONS_81.map((t) => {
          let regionLabel = t.lore ? t.lore.slice(0, 16) : `${t.monsterName}镇守`;
          let regionId = null;
          let terrainLabel = '';
          let regionColor = '';
          if (terrain81Mod && terrain81Mod.getTribulationTerrain) {
            const tt = terrain81Mod.getTribulationTerrain(t.no);
            if (tt) {
              regionId = tt.regionId || null;
              terrainLabel = tt.terrainLabel || '';
              const regObj = terrain81Mod.getRegionById && terrain81Mod.getRegionById(regionId);
              regionColor = (regObj && regObj.tileTop) || '';
              const shortReg = (regObj && regObj.shortName) || tt.regionName || '';
              regionLabel = `${shortReg}·${tt.location || t.tribName}`;
            }
          }
          return {
            id: t.id,
            tribNo: t.no,
            regionId,
            terrainLabel,
            regionColor,
            name: `第${t.no}难·${t.tribName}`,
            subtitle: regionLabel,
            bossId: t.id,
            bossName: t.monsterName
          };
        });
      };
      const externalPool = buildExternalPool();
      this._cachedExternalPool = externalPool;

      this.runBlueprint = Curve.generateFreshRunBlueprint({
        charId: charId || this.selectedCharId,
        availableBiomes: externalPool || BIOMES,
        recentHistory: this.saveData.recentRuns || [],
        banishedIds: this.saveData.banishedIds || [],
        ascensionLevel: ascLv,
        seed
      });

      // 若玩家从「八十一难图鉴/地形图谱」指定跳入某一难，第一劫优先使用指定难号
      if (startOpts && startOpts.tribulationNo && externalPool) {
        const forced = externalPool.find((x) => x.tribNo === startOpts.tribulationNo);
        if (forced) {
          this.runBlueprint.acts[0].primaryPortal = {
            id: forced.id,
            tribNo: forced.tribNo,
            regionId: forced.regionId,
            terrainLabel: forced.terrainLabel,
            regionColor: forced.regionColor,
            tier: 0,
            title: forced.name,
            baseBiome: forced.id,
            theme: forced.subtitle,
            rewardBias: 'scroll',
            bossTitle: forced.bossName
          };
        }
      }

      // 记录近3局去重记忆，确保下一次开局绝不撞车！
      this.saveData.recentRuns = (this.saveData.recentRuns || []).concat([this.runBlueprint.historyRecord]).slice(-3);
      this.persistSave();

      this.currentActIndex = 0;
      this.activePortalBranch = this.runBlueprint.acts[0].primaryPortal;
      this.rerollsLeft = 1 + (this.saveData.metaLevels.reroll_lv || 0);
      this.pendingBombs = [];
      this.pendingThunders = [];
      this.skyThunderTimer = 5.0;
      this.blitzTimer = mode === 'BLITZ_90' ? 90.0 : 0;
      this.blitzWaveTimer = 1.6;
      this.blitzNextBreakKills = 10;
      this.blitzBossSpawned = false;

      const mergedStartOpts = Object.assign(
        {},
        startOpts || {},
        this.activePortalBranch && this.activePortalBranch.tribNo
          ? { tribulationNo: this.activePortalBranch.tribNo }
          : {}
      );
      origStartNewRun.call(this, charId, mergedStartOpts);

      if (this.player) {
        this.player._appRef = this;
        this.player._curveMetaLevels = this.saveData.metaLevels;
        this.player.worldMutator = this.runBlueprint.worldMutator;
        this.player.recalcStats(true);
      }

      // 若非指定预览参数直达场景，第 0 秒立即弹出【本命法相三选一】破冰爽点弹窗！
      const hasUrlPreview =
        typeof window !== 'undefined' &&
        window.location &&
        typeof window.location.search === 'string' &&
        window.location.search.indexOf('preview=') !== -1;
      if (!(startOpts && startOpts.skipAspectModal) && !hasUrlPreview) {
        this.prepareAspectChoices();
        this.modal = 'ASPECT_PICK';
      }
    };

    GameApp.prototype.prepareAspectChoices = function () {
      const charId = this.player ? this.player.id : this.selectedCharId;
      const pool = (Curve.HERO_ASPECTS[charId] || Curve.HERO_ASPECTS.wukong).slice();
      this.aspectChoices = pool;
    };

    GameApp.prototype.applyStarterAspect = function (aspectDef, isBlindBox) {
      if (!this.player || !aspectDef) return;
      this.player.starterAspect = aspectDef;
      this.player.recalcStats(true);
      this.modal = null;

      SoundFX.play('revive');
      this.triggerZoomPunch && this.triggerZoomPunch(0.045);

      if (isBlindBox) {
        this.player.runSouls += 25;
        const banished = new Set((this.saveData && this.saveData.banishedIds) || []);
        const validW = SUB_WEAPONS.filter((w) => !banished.has(w.id));
        const wPool = validW.length ? validW : SUB_WEAPONS;
        const randWep = wPool[Math.floor(Math.random() * wPool.length)];
        this.player.subWeapon = randWep.id;
        this.player.subWeaponCdTimer = 0;
        this.player.recalcStats(false);
        this.ui.showToast(`🎁 盲盒赐福：觉醒【${aspectDef.name}】+ 25灵蕴 + 法宝【${randWep.name}】！`, 3.4);
      } else {
        const modeTag = (this.saveData.runMode || 'STANDARD_4ACT') === 'BLITZ_90' ? '🔥 90秒大闹天宫开始！' : `异象:${this.runBlueprint.worldMutator.name}`;
        this.ui.showToast(`⚡ 觉醒【${aspectDef.name}】！${modeTag}`, 3.0);
      }
    };

    // 统一接管「百妖谱图鉴」与「十二地域地形图鉴」的选难试炼跳转，确保曲线与分支状态完全同步
    const origJumpToTribulation = GameApp.prototype.jumpToTribulation;
    GameApp.prototype.jumpToTribulation = function (tribNo) {
      if (!this.player || this.player.dead || this.state !== 'PLAYING') {
        this.startNewRun(this.selectedCharId, { tribulationNo: tribNo });
        return;
      }
      if (this._cachedExternalPool) {
        const matched = this._cachedExternalPool.find((x) => x.tribNo === tribNo);
        if (matched) {
          this.activePortalBranch = {
            id: matched.id,
            tribNo: matched.tribNo,
            regionId: matched.regionId,
            terrainLabel: matched.terrainLabel,
            regionColor: matched.regionColor,
            tier: this.currentActIndex || 0,
            title: matched.name,
            baseBiome: matched.id,
            theme: matched.subtitle,
            rewardBias: 'scroll',
            bossTitle: matched.bossName
          };
        }
      }
      origJumpToTribulation.call(this, tribNo);
    };

    // 接管关卡进入：动态映射八十一难独立地形、专属妖王、锯齿怪物曲线、分支奖励与西游奇遇台
    const origEnterStage = GameApp.prototype.enterStage;
    GameApp.prototype.enterStage = function (stageIndex, loopCount, stageOpts) {
      const actIdx = typeof this.currentActIndex === 'number' ? this.currentActIndex : stageIndex;
      const actNode = this.runBlueprint && this.runBlueprint.acts[Math.min(3, Math.max(0, actIdx))];
      const branch = this.activePortalBranch || (actNode && actNode.primaryPortal);

      const tribNo =
        (stageOpts && stageOpts.tribulationNo) ||
        (branch && branch.tribNo) ||
        undefined;

      const mappedBiomeIdx = tribNo
        ? Math.min(Math.max(0, BIOMES.length - 1), Math.floor((tribNo - 1) / 9))
        : branch
          ? resolveBiomeIndexByBaseId(branch.baseBiome || branch.bossId, actIdx)
          : stageIndex;

      const mergedStageOpts = Object.assign(
        {},
        stageOpts || {},
        tribNo ? { tribulationNo: tribNo } : {}
      );

      origEnterStage.call(this, mappedBiomeIdx, loopCount, mergedStageOpts);

      if (!this.level || !this.runBlueprint) return;
      this.level.stageIndex = actIdx; // 保持 0->1->2->3 四劫推进计数

      const mut = this.runBlueprint.worldMutator;
      const enemyCurve = Curve.calcEnemyCurveStats(
        actIdx,
        this.saveData.ascensionLevel || 0,
        mut ? mut.effects : {}
      );

      // 若未由 terrainRegions81 自动生成难名，则补充标题
      if (branch && !tribNo) {
        this.level.biome = Object.assign({}, this.level.biome, {
          name: `${branch.title}`,
          subtitle: branch.theme || this.level.biome.subtitle
        });
      }

      // 应用锯齿心流怪物数值曲线 ψ(t)
      const rawStageMult = 1 + mappedBiomeIdx * 0.36;
      const hpAdjust = enemyCurve.hpMult / Math.max(0.5, rawStageMult);
      const atkAdjust = enemyCurve.atkMult / Math.max(0.5, 1 + (rawStageMult - 1) * 0.6);

      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.isBoss) {
          // 锯齿调制 Boss 血量，彻底解决后期血牛刮痧问题！
          const targetBossBase = 660 * (1 + actIdx * 0.16);
          e.maxHp = Math.max(320, Math.round(targetBossBase * enemyCurve.hpMult));
          e.hp = e.maxHp;
          e.atk = Math.max(14, Math.round(22 * enemyCurve.atkMult));
          if (branch && branch.bossTitle && !tribNo) {
            e.name = branch.bossTitle;
          }
        } else {
          e.maxHp = Math.max(24, Math.round(e.maxHp * hpAdjust));
          e.hp = e.maxHp;
          e.atk = Math.max(8, Math.round(e.atk * atkAdjust));
          e.speed *= enemyCurve.speedMult || 1.0;
        }
      }

      // 【天道异象·缩地成寸】：额外刷出1尊高爆双天书精英妖将！
      if (mut && mut.id === 'mut_blitz_pocket' && this.enemies.length > 3) {
        const midMob = this.enemies[Math.floor(this.enemies.length * 0.35)];
        if (midMob && !midMob.isBoss && !midMob.isElite) {
          midMob.isElite = true;
          midMob.name = `【劫将】${midMob.name}`;
          midMob.maxHp = Math.round(midMob.maxHp * 1.9);
          midMob.hp = midMob.maxHp;
        }
      }

      // 兑现玩家上一关【双传送门二选一】所选的分支专属开局奖励！
      if (branch && actIdx > 0 && this.player) {
        const dropX = this.player.x + 56;
        const dropY = this.player.y;
        if (branch.rewardBias === 'scroll') {
          this.level.interactables.push({
            id: `branch_bonus_scroll_${actIdx}`,
            type: 'scroll',
            x: dropX,
            y: dropY,
            opened: false,
            label: '参悟道途赐福【额外三才天书】'
          });
        } else if (branch.rewardBias === 'weapon') {
          const banished = new Set((this.saveData && this.saveData.banishedIds) || []);
          const validW = SUB_WEAPONS.filter((w) => !banished.has(w.id));
          const wPool = validW.length ? validW : SUB_WEAPONS;
          const rw = wPool[Math.floor(Math.random() * wPool.length)];
          this.level.interactables.push({
            id: `branch_bonus_wep_${actIdx}`,
            type: 'chest',
            x: dropX,
            y: dropY,
            opened: false,
            weaponId: rw.id,
            label: '开启道途赐福【仙家法宝匣】'
          });
        } else if ((branch.rewardBias === 'forge' || branch.rewardBias === 'legendary') && this.spawnEquipmentDrop) {
          this.spawnEquipmentDrop(dropX, dropY, 'boss');
        } else if (branch.rewardBias === 'mutation') {
          this.player.runSouls += 35;
          this.player.gold += 80;
          this.effects.spawnLoot(dropX, dropY - 10, 10, 30, true);
        } else if (branch.rewardBias === 'gold') {
          this.player.gold += 120;
        }
      }

      // 五行共鸣【佛门金身】2阶：每进入一劫自动凝聚 18% 最大气血功德金身护盾
      if (this.player && this.player.getElemTier && this.player.getElemTier('holy') >= 2) {
        this.player.shieldHp = Math.max(this.player.shieldHp, Math.round(this.player.maxHp * 0.18));
      }

      // 在关卡中段布置【8秒西游因果奇遇祭坛】
      if (this.saveData.runMode !== 'BLITZ_90' && (actIdx >= 1 || Math.random() < 0.65)) {
        const midCol = Math.floor(this.level.cols * 0.52);
        const fRow = (this.level.floorRow && this.level.floorRow[midCol]) || 14;
        const evDef = Curve.KARMIC_EVENTS[(actIdx + Math.floor(this.runBlueprint.seed % 4)) % Curve.KARMIC_EVENTS.length];
        this.currentStageEvent = evDef;
        this.level.interactables.push({
          id: `karmic_event_${actIdx}`,
          type: 'karmic_event',
          x: (midCol + 0.5) * this.level.tileSize,
          y: fRow * this.level.tileSize,
          opened: false,
          eventDef: evDef,
          label: `✨ 西游奇遇：【${evDef.title}】`
        });
      }

      // 若为【90秒大闹天宫·极速爽刷模式】，直接传送至宽阔决战台开启无限刷怪割草！
      if (this.saveData.runMode === 'BLITZ_90' && this.player) {
        this.level.biome.name = '🔥 大闹天宫 · 90秒极速割草场';
        this.player.placeAt(this.level.bossArenaStartPx + 140, this.level.bossSpawn.y);
        if (this.bossEntity) {
          // 前60秒先爽刷妖潮，倒计时30秒时大妖尊再霸气降临！
          this.bossEntity.dead = true;
        }
        this.spawnBlitzWave(6, false);
      }
    };

    // 90秒大闹天宫动态刷怪器
    GameApp.prototype.spawnBlitzWave = function (count, includeElite) {
      if (!this.level || !this.player) return;
      const typeKeys = Object.keys(ENEMY_TYPES);
      const arenaLeft = this.level.bossArenaStartPx + 36;
      const arenaRight = this.level.widthPx - 64;
      const elapsedRatio = 1 - Math.max(0, this.blitzTimer) / 90;
      const mult = 0.85 + elapsedRatio * 1.15;

      for (let i = 0; i < count; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        let sx = this.player.x + side * (110 + Math.random() * 140);
        sx = Math.max(arenaLeft, Math.min(arenaRight, sx));
        const sy = this.level.bossSpawn.y;
        const tId = typeKeys[Math.floor(Math.random() * typeKeys.length)];
        const isEl = includeElite && i === 0;
        const mob = new Enemy({
          typeId: tId,
          x: sx,
          y: sy,
          isElite: isEl,
          difficultyMult: mult
        });
        mob.maxHp = Math.max(22, Math.round(mob.maxHp * 0.78)); // 割草爽感：脆皮高密度！
        mob.hp = mob.maxHp;
        this.enemies.push(mob);
        this.effects && this.effects.spawnParticles(sx, sy - 16, 8, isEl ? '#c77dff' : '#ff9f1c', 30, 110, 0.12, 0.25, 0);
      }
    };

    // 命中与击杀增强钩子：9卷斩杀、狂雷弹射、血月回血、丹炉尸爆、法天象地撞墙翻倍、大闹天宫突破
    const origHandleHitEnemy = GameApp.prototype.handleHitEnemy;
    GameApp.prototype.handleHitEnemy = function (enemy, hitOpts) {
      if (!enemy || enemy.dead || !this.player) {
        return origHandleHitEnemy.call(this, enemy, hitOpts);
      }

      const asp = this.player.starterAspect;
      const mut = this.runBlueprint && this.runBlueprint.worldMutator;
      const fireTier = (this.player.getElemTier && this.player.getElemTier('fire')) || 0;
      const waterTier = (this.player.getElemTier && this.player.getElemTier('water')) || 0;
      const thunderTier = (this.player.getElemTier && this.player.getElemTier('thunder')) || 0;
      const windTier = (this.player.getElemTier && this.player.getElemTier('wind')) || 0;
      const hasWaterThunder = !!(this.player.hasDuo && this.player.hasDuo('duo_water_thunder'));

      // 【白龙马·西海玄冰相】与【弱水玄冰】2/4阶：寒霜减速与破冰爆伤
      if ((asp && asp.id === 'bl_aspect_frost') || waterTier >= 2) {
        if (enemy.slowTimer > 0 || enemy.stunTimer > 0) {
          const mult = waterTier >= 4 ? 1.40 : 1.32;
          hitOpts.dmg = Math.round(hitOpts.dmg * mult);
          if ((asp && asp.id === 'bl_aspect_frost') || waterTier >= 4) hitOpts.isCrit = true;
        }
        enemy.slowTimer = Math.max(enemy.slowTimer, 1.8);
      }

      // 双系融合【雷泽感电 · 万雷穿心】：对减速/眩晕中的妖魔增伤 +45%
      if (hasWaterThunder && (enemy.slowTimer > 0 || enemy.stunTimer > 0)) {
        hitOpts.dmg = Math.round(hitOpts.dmg * 1.45);
      }

      // 【三昧真火】2阶：攻击附加灼烧标记与额外真火附伤
      if (fireTier >= 2 && !hitOpts._fromChain) {
        enemy._burnTimer = 2.4;
        hitOpts.dmg += Math.max(2, Math.round(this.player.magic * 0.16));
      }

      // 【悟空·定海千钧相】/【法天象地】/【九天罡风】2阶：大幅强化击飞推力促发撞墙粉碎！
      if ((asp && asp.id === 'wk_aspect_pillar') || (mut && mut.id === 'mut_giant_brawl') || windTier >= 2) {
        if (hitOpts.knockX) hitOpts.knockX *= 1.42;
      }

      // Boss 单次伤害软护栏（防数值溢出1刀秒Boss丧失动作感）
      if (enemy.isBoss && hitOpts.dmg > enemy.maxHp * 0.18) {
        hitOpts.dmg = Math.round(enemy.maxHp * 0.18);
      }

      origHandleHitEnemy.call(this, enemy, hitOpts);

      // 【9卷化境·齐天无双】：暴击命中低于 16% 气血的非 Boss 妖魔直接雷火处决！
      const mainScrolls = this.player.scrolls[this.player.charDef.affinity] || 1;
      if (!enemy.dead && !enemy.isBoss && mainScrolls >= 9 && hitOpts.isCrit && enemy.hp <= enemy.maxHp * 0.16) {
        this.effects && this.effects.spawnFloatingText(enemy.x, enemy.y - 44, '⚡化境斩杀!', '#ffd60a', true);
        origHandleHitEnemy.call(this, enemy, { dmg: enemy.hp + 99, isCrit: true, ignoreShield: true, sourceX: this.player.x });
      }

      // 【悟空·齐天狂雷相】/【九霄狂雷】2阶 /【雷泽感电】：闪电链弹射邻近妖魔（防递归标记 _fromChain）
      const procChain =
        !hitOpts._fromChain &&
        ((asp && asp.id === 'wk_aspect_havoc' && hitOpts.isCrit) ||
          (hasWaterThunder && (enemy.slowTimer > 0 || enemy.stunTimer > 0)) ||
          (thunderTier >= 2 && Math.random() < 0.28));
      if (procChain) {
        const maxChain = thunderTier >= 6 ? 5 : 2;
        const chainRatio = hasWaterThunder ? 0.85 : 0.52;
        let chained = 0;
        for (let i = 0; i < this.enemies.length && chained < maxChain; i++) {
          const other = this.enemies[i];
          if (other !== enemy && !other.dead && Math.hypot(other.x - enemy.x, other.y - enemy.y) < 165) {
            chained++;
            if (this.effects) {
              if (this.effects.spawnLightningBolt) {
                this.effects.spawnLightningBolt(enemy.x, enemy.y - 18, other.x, other.y - 18, '#00f5d4', 2.2, 0.16);
              }
              this.effects.spawnParticles(other.x, other.y - 18, 8, '#00f5d4', 35, 130, 0.12, 0.24, 0);
            }
            this.handleHitEnemy(other, {
              dmg: Math.max(5, Math.round(hitOpts.dmg * chainRatio)),
              isCrit: hasWaterThunder,
              ignoreShield: true,
              sourceX: enemy.x,
              _fromChain: true
            });
          }
        }
      }

      // 击杀衍生机制
      if (enemy.dead && !enemy._curveKillProcessed) {
        enemy._curveKillProcessed = true;

        // 【三昧真火】4阶：灼烧中的妖魔阵亡引发火焰殉爆！
        if (fireTier >= 4 && enemy._burnTimer > 0) {
          this.effects && this.effects.spawnZone({
            kind: 'shockwave_ring',
            x: enemy.x,
            y: enemy.y - 14,
            radius: 74,
            color: '#ff6e40',
            duration: 0.26
          });
          for (let i = 0; i < this.enemies.length; i++) {
            const nearE = this.enemies[i];
            if (nearE !== enemy && !nearE.dead && Math.hypot(nearE.x - enemy.x, nearE.y - enemy.y) <= 78) {
              this.handleHitEnemy(nearE, {
                dmg: Math.max(6, Math.round(this.player.magic * 0.75)),
                isCrit: true,
                ignoreShield: true,
                _fromChain: true,
                sourceX: enemy.x
              });
            }
          }
        }

        // 【血月狂劫】：击杀必回 3% 生命
        if (mut && mut.id === 'mut_blood_moon') {
          this.player.heal(Math.max(2, Math.round(this.player.maxHp * 0.03)), this.effects);
        }

        // 【缩地成寸】：精英怪额外再掉第2卷三才天书！
        if (mut && mut.id === 'mut_blitz_pocket' && enemy.isElite) {
          this.level.interactables.push({
            id: `blitz_double_scroll_${enemy.uid}`,
            type: 'scroll',
            x: enemy.x + 24,
            y: enemy.y,
            opened: false,
            label: '拾取缩地成寸【双倍天书】'
          });
        }

        // 【丹炉失控】：阵亡原地留下 0.75s 延时三昧火丹连环炸怪！
        if (mut && mut.id === 'mut_alchemy_boom' && !enemy.isBoss) {
          this.pendingBombs.push({
            x: enemy.x,
            y: enemy.y,
            timer: 0.72,
            dmg: Math.round(this.player.atk * 1.45)
          });
          this.effects && this.effects.spawnZone({
            kind: 'boss_spike_warn',
            x: enemy.x,
            y: enemy.y,
            radius: 56,
            dmg: 0,
            duration: 0.72
          });
        }

        // 【90秒大闹天宫模式】：每满 10 斩自动全属性天书突破 + 回血回蓝！
        if (this.saveData.runMode === 'BLITZ_90' && this.player.totalKills >= this.blitzNextBreakKills) {
          this.blitzNextBreakKills += 12;
          const mainKey = this.player.charDef.affinity;
          this.player.scrolls[mainKey] = (this.player.scrolls[mainKey] || 1) + 1;
          this.player.recalcStats(false);
          this.player.heal(Math.round(this.player.maxHp * 0.18), this.effects);
          if (this.player.restoreMp) this.player.restoreMp(35, this.effects, false);
          SoundFX.play('revive');
          this.triggerZoomPunch && this.triggerZoomPunch(0.035);
          this.ui.showToast(`🔥 连斩突破！主修天书升至 ${this.player.scrolls[mainKey]} 卷！`, 2.0);
        }
      }
    };

    // 拾取钩子：八戒【饕餮吞天相】吃包永久涨血上限 + 满血转护盾 + 功德金雨掉落加成
    const origHandlePickupDrop = GameApp.prototype.handlePickupDrop;
    GameApp.prototype.handlePickupDrop = function (drop) {
      if (drop && this.runBlueprint && this.runBlueprint.worldMutator && this.runBlueprint.worldMutator.id === 'mut_golden_fortune') {
        if (drop.kind === 'soul' || drop.kind === 'gold') {
          drop.val = Math.max(1, Math.round(drop.val * 1.6));
        }
      }
      if (drop && drop.kind === 'bun' && this.player && this.player.starterAspect && this.player.starterAspect.id === 'bj_aspect_glutton') {
        this.player.gluttonBonusHp = (this.player.gluttonBonusHp || 0) + 8;
        this.player.maxHp += 8;
        const missing = this.player.maxHp - this.player.hp;
        const healVal = Math.round(this.player.maxHp * drop.val);
        if (healVal > missing) {
          this.player.shieldHp = Math.min(this.player.maxHp, this.player.shieldHp + (healVal - missing));
        }
      }
      origHandlePickupDrop.call(this, drop);
    };

    // 撞墙粉碎钩子：双系融合【踏风惊雷 · 瞬狱闪】撞墙自动劈落暴击紫霄神雷！
    GameApp.prototype.handleWallSplat = function (enemy, splatDmg) {
      if (!enemy || !this.player || !this.player.hasDuo || !this.player.hasDuo('duo_wind_thunder')) return;
      const boltDmg = Math.max(12, Math.round(this.player.skillPower * 1.15 + splatDmg * 0.5));
      SoundFX.play('skill');
      this.effects && this.effects.spawnZone({
        kind: 'shockwave_ring',
        x: enemy.x,
        y: enemy.y - 16,
        radius: 62,
        color: '#00f5d4',
        duration: 0.26
      });
      this.effects && this.effects.spawnParticles(enemy.x, enemy.y - 24, 16, '#00f5d4', 45, 180, 0.14, 0.28, -80);
      this.effects && this.effects.spawnFloatingText(enemy.x, enemy.y - 50, '⚡瞬狱神雷!', '#00f5d4', true);
      if (!enemy.dead) {
        this.handleHitEnemy(enemy, {
          dmg: boltDmg,
          isCrit: true,
          stunSec: 0.9,
          ignoreShield: true,
          _fromChain: true,
          sourceX: enemy.x
        });
      }
    };

    // 天书选择后检测 3 / 6 / 9 卷质变觉醒里程碑提示！
    const origApplyScrollChoice = GameApp.prototype.applyScrollChoice;
    GameApp.prototype.applyScrollChoice = function (scrollId) {
      const prevLv = this.player ? this.player.scrolls[scrollId] : 1;
      origApplyScrollChoice.call(this, scrollId);
      if (!this.player) return;
      const newLv = this.player.scrolls[scrollId];
      if (scrollId === this.player.charDef.affinity && (newLv === 3 || newLv === 6 || newLv === 9) && newLv !== prevLv) {
        const bp = Curve.PACING_CURVE_CONFIG.scrollBreakpoints.find((b) => b.count === newLv);
        if (bp) {
          this.triggerZoomPunch && this.triggerZoomPunch(0.06);
          this.effects && this.effects.spawnZone({
            kind: 'shockwave_ring',
            x: this.player.x,
            y: this.player.y - 16,
            radius: 170,
            color: '#ffd60a',
            duration: 0.42
          });
          this.ui.showToast(`🌟 达成${newLv}卷【${bp.tierName}】！${bp.desc}`, 3.6);
        }
      }
    };

    // 交互物扩展：支持【西游因果奇遇祭坛】与四劫通关判定
    const origTriggerInteract = GameApp.prototype.triggerInteract;
    GameApp.prototype.triggerInteract = function (inter) {
      if (!inter || inter.opened) return;

      if (inter.type === 'karmic_event') {
        inter.opened = true;
        SoundFX.play('scroll');
        this.ui.resetTouchState();
        this.activeEventDef = inter.eventDef || Curve.KARMIC_EVENTS[0];
        this.modal = 'KARMIC_EVENT';
        return;
      }

      if (inter.type === 'portal') {
        // 四劫模式第4劫 (actIndex >= 3) 通关圆满！
        if (this.currentActIndex >= 3) {
          inter.opened = true;
          this.ui.resetTouchState();
          const ascBonus = Math.round(55 * (1 + (this.saveData.ascensionLevel || 0) * 0.45));
          this.player.runSouls += ascBonus;
          this.finishRun(true);
          return;
        }
      }

      origTriggerInteract.call(this, inter);
    };

    // 土地庙选完仙缘变异后，不直接死板进固定关，而是弹出【八十一难·双劫传送门二选一】！
    GameApp.prototype.selectMutationAndAdvance = function (mutId) {
      if (this.player && !this.player.hasMutation(mutId)) {
        this.player.mutations.push(mutId);
        this.player.recalcStats(true);
      }
      const nextIdx = (typeof this.currentActIndex === 'number' ? this.currentActIndex : this.level.stageIndex) + 1;
      if (this.runBlueprint && nextIdx < this.runBlueprint.acts.length) {
        this.pendingNextActIndex = nextIdx;
        this.modal = 'PORTAL_CHOICE';
        SoundFX.play('scroll');
      } else {
        this.modal = null;
        this.currentActIndex = nextIdx;
        this.enterStage(nextIdx, this.level.loopCount);
      }
    };

    GameApp.prototype.choosePortalBranch = function (branchNode) {
      const nextIdx = typeof this.pendingNextActIndex === 'number' ? this.pendingNextActIndex : this.currentActIndex + 1;
      this.currentActIndex = nextIdx;
      this.activePortalBranch = branchNode;
      this.modal = null;
      this.enterStage(nextIdx, this.level ? this.level.loopCount : 0);
      const biasInfo = REWARD_BIAS_LABELS[branchNode.rewardBias] || REWARD_BIAS_LABELS.scroll;
      this.ui.showToast(`踏入【${branchNode.title}】！${biasInfo.badge}`, 2.8);
    };

    // 结算西游因果奇遇抉择 A / B
    GameApp.prototype.resolveKarmicEvent = function (pickKey) {
      const ev = this.activeEventDef;
      if (!ev || !this.player) {
        this.modal = null;
        return;
      }
      this.modal = null;
      SoundFX.play('revive');
      const mainKey = this.player.charDef.affinity;

      if (ev.id === 'evt_ginseng_tree') {
        if (pickKey === 'A') {
          this.player.heal(Math.round(this.player.maxHp * 0.6), this.effects);
          this.player.flaskCharges = Math.min(this.player.maxFlaskCharges, this.player.flaskCharges + 1);
          this.ui.showToast('🍑 服下人参果！气血大复且甘露净瓶+1！', 2.8);
        } else {
          this.player.scrolls[mainKey] += 2;
          this.player.recalcStats(false);
          if (this.bossEntity && !this.bossEntity.dead) {
            this.bossEntity.maxHp = Math.round(this.bossEntity.maxHp * 1.18);
            this.bossEntity.hp = this.bossEntity.maxHp;
            this.bossEntity.atk = Math.round(this.bossEntity.atk * 1.15);
          }
          this.ui.showToast('🔥 偷打三颗人参果！主属性天书连升 +2 卷！（本劫妖王已惊怒）', 3.2);
        }
      } else if (ev.id === 'evt_six_ear_mirror') {
        if (pickKey === 'A') {
          // 召唤心魔精英决斗并立即掉落神品装备/双天书
          const mirrorMob = new Enemy({
            typeId: 'tiger_blade',
            x: Math.min(this.level.widthPx - 80, this.player.x + 88),
            y: this.player.y,
            isElite: true,
            difficultyMult: 1.25
          });
          mirrorMob.name = '【六耳心魔幻影】';
          this.enemies.push(mirrorMob);
          if (this.spawnEquipmentDrop) {
            this.spawnEquipmentDrop(this.player.x + 28, this.player.y, 'boss');
          }
          this.ui.showToast('⚔ 六耳心魔现身！神品宝匣已破封掉落！', 3.0);
        } else {
          this.player.runSouls += 45;
          this.player.shieldHp = Math.max(this.player.shieldHp, Math.round(this.player.maxHp * 0.2));
          this.ui.showToast('✨ 敲碎古镜！摄取 +45 灵蕴与 20% 护体金光！', 2.6);
        }
      } else if (ev.id === 'evt_laozi_furnace') {
        if (pickKey === 'A') {
          if (Math.random() < 0.75) {
            this.player.scrolls[mainKey] += 1;
            const eqMod = getOptionalModule('equipment', '../config/equipment');
            if (eqMod && eqMod.upgradeEquipmentRarity && this.player.equipped && this.player.equipped.weapon) {
              this.player.equipped.weapon = eqMod.upgradeEquipmentRarity(this.player.equipped.weapon);
            }
            this.player.recalcStats(false);
            this.ui.showToast('🔥 三昧重铸大成功！神兵品质跃升且主修天书 +1！', 3.0);
          } else {
            this.player.scrolls.red += 1;
            this.player.scrolls.purple += 1;
            this.player.scrolls.green += 1;
            this.player.recalcStats(false);
            this.ui.showToast('💥 丹炉炸裂化作漫天真经！三才天书全属性 +1！', 3.0);
          }
        } else {
          this.player.hp = Math.max(10, Math.round(this.player.hp * 0.8));
          const banished = new Set((this.saveData && this.saveData.banishedIds) || []);
          const unbanished = MUTATIONS.filter((m) => !this.player.hasMutation(m.id) && !banished.has(m.id));
          const avail = unbanished.length ? unbanished : MUTATIONS.filter((m) => !this.player.hasMutation(m.id));
          const pickM = avail.length ? avail[Math.floor(Math.random() * avail.length)] : MUTATIONS[0];
          if (!this.player.hasMutation(pickM.id)) this.player.mutations.push(pickM.id);
          this.player.recalcStats(false);
          this.ui.showToast(`💊 吞服金丹！习得仙缘【${pickM.name}】！`, 2.8);
        }
      } else {
        // 观音垂柳：洗点三才归宗（瞬间凑齐高阶觉醒！）
        if (pickKey === 'A') {
          const keys = ['red', 'purple', 'green'].filter((k) => k !== mainKey);
          let moved = 0;
          keys.forEach((k) => {
            if (this.player.scrolls[k] > 1) {
              moved += this.player.scrolls[k] - 1;
              this.player.scrolls[k] = 1;
            }
          });
          const bonus = Math.max(1, moved);
          this.player.scrolls[mainKey] += bonus;
          this.player.recalcStats(false);
          this.ui.showToast(`🌿 杨柳洗髓三才归宗！主修天书暴涨 +${bonus} 卷！`, 3.2);
        } else {
          this.player.reviveCount = Math.max(-1, this.player.reviveCount - 1);
          this.player.shieldHp = Math.max(this.player.shieldHp, Math.round(this.player.maxHp * 0.3));
          this.ui.showToast('✨ 获赐救命毫毛！本局额外增加 1 次逆天复活资格与护盾！', 3.0);
        }
      }
    };

    // 杨柳重随骰（Reroll）：刷新仙缘变异或开局法相
    GameApp.prototype.tryUseReroll = function (targetModal) {
      const doReroll = () => {
        SoundFX.play('scroll');
        if (targetModal === 'STAGE_CLEAR') {
          const banished = new Set((this.saveData && this.saveData.banishedIds) || []);
          const unbanished = MUTATIONS.filter((m) => !this.player.hasMutation(m.id) && !banished.has(m.id));
          const unowned = MUTATIONS.filter((m) => !this.player.hasMutation(m.id));
          const source = unbanished.length > 0 ? unbanished.slice() : unowned.length > 0 ? unowned.slice() : MUTATIONS.slice();
          source.sort(() => Math.random() - 0.5);
          this.stageMutationChoices = source.slice(0, 3);
        } else if (targetModal === 'PORTAL_CHOICE' && this.runBlueprint) {
          const nextIdx = this.pendingNextActIndex || 1;
          const trib81Mod = getOptionalModule('tribulations81', '../config/tribulations81');
          const terrain81Mod = getOptionalModule('terrainRegions81', '../config/terrainRegions81');
          if (trib81Mod && Array.isArray(trib81Mod.TRIBULATIONS_81) && trib81Mod.TRIBULATIONS_81.length >= 16) {
            const chunk = Math.ceil(trib81Mod.TRIBULATIONS_81.length / 4);
            const sub = trib81Mod.TRIBULATIONS_81.slice(nextIdx * chunk, (nextIdx + 1) * chunk).slice();
            sub.sort(() => Math.random() - 0.5);
            if (sub.length >= 2) {
              const biases = nextIdx >= 3 ? ['legendary', 'forge'] : ['scroll', 'weapon', 'mutation', 'forge', 'event', 'gold'];
              const toNode = (t, bi) => {
                let regionLabel = t.monsterName;
                let regionId = null;
                let terrainLabel = '';
                let regionColor = '';
                if (terrain81Mod && terrain81Mod.getTribulationTerrain) {
                  const tt = terrain81Mod.getTribulationTerrain(t.no);
                  if (tt) {
                    regionId = tt.regionId || null;
                    terrainLabel = tt.terrainLabel || '';
                    const regObj = terrain81Mod.getRegionById && terrain81Mod.getRegionById(regionId);
                    regionColor = (regObj && regObj.tileTop) || '';
                    const shortReg = (regObj && regObj.shortName) || tt.regionName || '';
                    regionLabel = `${shortReg}·${tt.location || t.tribName}`;
                  }
                }
                return {
                  id: t.id,
                  tribNo: t.no,
                  regionId,
                  terrainLabel,
                  regionColor,
                  tier: nextIdx,
                  title: `第${t.no}难·${t.tribName}`,
                  baseBiome: t.id,
                  theme: regionLabel,
                  rewardBias: biases[bi % biases.length],
                  bossTitle: t.monsterName
                };
              };
              const bIdx = Math.floor(Math.random() * biases.length);
              const firstNode = toNode(sub[0], bIdx);
              const diffReg = sub.slice(1).find((cand) => {
                if (!terrain81Mod || !terrain81Mod.getTribulationTerrain) return true;
                const tt = terrain81Mod.getTribulationTerrain(cand.no);
                return !tt || tt.regionId !== firstNode.regionId;
              }) || sub[1];
              this.runBlueprint.acts[nextIdx].primaryPortal = firstNode;
              this.runBlueprint.acts[nextIdx].altPortal = toNode(diffReg, bIdx + 1);
            }
          } else {
            const tierPool = Curve.EIGHTY_ONE_TRIBULATION_ARCHETYPES.filter((t) => t.tier === nextIdx);
            tierPool.sort(() => Math.random() - 0.5);
            if (tierPool.length >= 2) {
              this.runBlueprint.acts[nextIdx].primaryPortal = tierPool[0];
              this.runBlueprint.acts[nextIdx].altPortal = tierPool[1];
            }
          }
        }
        this.ui.showToast('🎲 杨柳仙骰发动！天机命数已重铸！', 2.0);
      };

      if (this.rerollsLeft > 0) {
        this.rerollsLeft--;
        doReroll();
      } else {
        DouyinSDK.showRewardedAd({
          placement: 'reroll_choices',
          adUnitId: SDK_CONFIG.adUnitIds.rewardedBonusResource,
          mockTitle: '【抖音激励视频预留接口】观音杨柳免费重随天机',
          onSuccess: () => {
            this.rerollsLeft += 1;
            this.rerollsLeft--;
            doReroll();
          },
          onCancel: (msg) => this.ui.showToast(msg)
        });
      }
    };

    // 主循环更新钩子：处理丹炉尸爆、紫霄天雷、90秒大闹天宫刷怪与倒计时结算
    const origTick = GameApp.prototype.tick;
    GameApp.prototype.tick = function (dt) {
      origTick.call(this, dt);
      if (DouyinSDK.mockAdState.active || this.state !== 'PLAYING' || this.modal || !this.player || this.player.dead) {
        return;
      }

      const ctxBag = this.buildWorldContext();
      const mut = this.runBlueprint && this.runBlueprint.worldMutator;

      // 1. 【丹炉失控】延时火丹爆炸结算
      if (this.pendingBombs && this.pendingBombs.length > 0) {
        for (let i = this.pendingBombs.length - 1; i >= 0; i--) {
          const b = this.pendingBombs[i];
          b.timer -= dt;
          if (b.timer <= 0) {
            this.pendingBombs.splice(i, 1);
            SoundFX.play('slam');
            this.effects.spawnZone({
              kind: 'shockwave_ring',
              x: b.x,
              y: b.y - 12,
              radius: 68,
              color: '#ff6e40',
              duration: 0.28
            });
            this.effects.spawnParticles(b.x, b.y - 12, 14, '#ff9f1c', 45, 165, 0.14, 0.3, 120);
            for (let j = 0; j < this.enemies.length; j++) {
              const e = this.enemies[j];
              if (!e.dead && Math.hypot(e.x - b.x, e.y - b.y) <= 72) {
                ctxBag.onHitEnemy(e, {
                  dmg: b.dmg,
                  isCrit: true,
                  knockX: (e.x >= b.x ? 1 : -1) * 165,
                  knockY: -80,
                  ignoreShield: true,
                  sourceX: b.x
                });
              }
            }
          }
        }
      }

      // 2. 【紫霄雷罚】周期性天雷预警与劈落（可引雷炸盾兵和Boss！）
      if (mut && mut.id === 'mut_heaven_thunder') {
        this.skyThunderTimer -= dt;
        if (this.skyThunderTimer <= 0) {
          this.skyThunderTimer = 6.5;
          for (let k = 0; k < 2; k++) {
            const tx = this.player.x + (k === 0 ? 1 : -1) * (55 + Math.random() * 95);
            const c = Math.max(3, Math.min(this.level.cols - 4, Math.floor(tx / this.level.tileSize)));
            const ty = ((this.level.floorRow && this.level.floorRow[c]) || 14) * this.level.tileSize;
            this.pendingThunders.push({ x: c * this.level.tileSize + 12, y: ty, timer: 0.78 });
            this.effects.spawnZone({
              kind: 'boss_spike_warn',
              x: c * this.level.tileSize + 12,
              y: ty,
              radius: 44,
              dmg: 0,
              duration: 0.78
            });
          }
        }
        for (let i = this.pendingThunders.length - 1; i >= 0; i--) {
          const th = this.pendingThunders[i];
          th.timer -= dt;
          if (th.timer <= 0) {
            this.pendingThunders.splice(i, 1);
            SoundFX.play('thunder');
            this.triggerShake && this.triggerShake(5, 0, 1);
            if (this.effects.spawnLightningBolt) {
              this.effects.spawnLightningBolt(th.x + (Math.random() - 0.5) * 18, th.y - 175, th.x, th.y - 6, '#00f5d4', 3.2, 0.24);
            }
            this.effects.spawnZone({
              kind: 'shockwave_ring',
              x: th.x,
              y: th.y - 10,
              radius: 54,
              color: '#00f5d4',
              duration: 0.26
            });
            this.effects.spawnZone({
              kind: 'thunder_scorch_ground',
              x: th.x,
              y: th.y,
              length: 76,
              dmg: Math.max(4, Math.round(this.player.atk * 0.32)),
              duration: 1.8
            });
            this.effects.spawnParticles(th.x, th.y - 24, 18, '#00f5d4', 50, 190, 0.14, 0.3, -90);
            for (let j = 0; j < this.enemies.length; j++) {
              const e = this.enemies[j];
              if (!e.dead && Math.hypot(e.x - th.x, e.y - th.y) <= 58) {
                ctxBag.onHitEnemy(e, {
                  dmg: Math.round(this.player.atk * 2.1),
                  isCrit: true,
                  stunSec: 1.1,
                  ignoreShield: true,
                  sourceX: th.x
                });
              }
            }
          }
        }
      }

      // 3. 【90秒大闹天宫·极速爽刷模式】波次导演
      if (this.saveData.runMode === 'BLITZ_90') {
        this.blitzTimer = Math.max(0, this.blitzTimer - dt);
        this.blitzWaveTimer -= dt;

        // 统计场上存活小怪数量，低于4只立即补刷，保证零冷场爽感！
        let aliveMobs = 0;
        for (let i = 0; i < this.enemies.length; i++) {
          if (!this.enemies[i].dead && !this.enemies[i].isBoss) aliveMobs++;
        }

        if (this.blitzWaveTimer <= 0 || aliveMobs < 3) {
          this.blitzWaveTimer = 5.2;
          this.spawnBlitzWave(aliveMobs < 3 ? 5 : 4, Math.random() < 0.45);
        }

        // 倒计时 32 秒时，终劫镇压妖尊空降决战台！
        if (!this.blitzBossSpawned && this.blitzTimer <= 32) {
          this.blitzBossSpawned = true;
          const bossKeys = Object.keys(BOSS_TYPES);
          const bId = bossKeys[Math.floor(Math.random() * bossKeys.length)];
          const bDef = BOSS_TYPES[bId];
          const bx = Math.max(this.level.bossArenaStartPx + 60, Math.min(this.level.widthPx - 80, this.player.x + 120));
          const boss = new Enemy({
            isBoss: true,
            bossId: bId,
            def: bDef,
            x: bx,
            y: this.level.bossSpawn.y,
            arenaLeftX: this.level.bossArenaStartPx,
            arenaRightX: this.level.widthPx - 48,
            difficultyMult: 1.15
          });
          boss.maxHp = Math.round(boss.maxHp * 0.85);
          boss.hp = boss.maxHp;
          boss.activated = true;
          this.bossEntity = boss;
          this.enemies.push(boss);
          SoundFX.play('bossAlert');
          this.triggerShake && this.triggerShake(9, 0, 1);
          this.ui.showToast(`👹 天庭镇压妖尊【${boss.name}】降临！坚持或斩杀妖尊即获大胜！`, 3.2);
        }

        if (this.blitzTimer <= 0) {
          this.player.runSouls += 65;
          this.finishRun(true);
        }
      }
    };

    // 支持键盘数字键 1/2/3/4 快速选择新增弹窗！
    const origBindInputs = GameApp.prototype.bindInputs;
    GameApp.prototype.bindInputs = function () {
      origBindInputs.call(this);
      if (typeof window !== 'undefined' && !this._curveKeyBound) {
        this._curveKeyBound = true;
        window.addEventListener('keydown', (ev) => {
          if (DouyinSDK.mockAdState.active || this.state !== 'PLAYING') return;
          const k = ev.key;
          if (this.modal === 'ASPECT_PICK' && this.aspectChoices) {
            if (k === '1' && this.aspectChoices[0]) this.applyStarterAspect(this.aspectChoices[0], false);
            else if (k === '2' && this.aspectChoices[1]) this.applyStarterAspect(this.aspectChoices[1], false);
            else if (k === '3' && this.aspectChoices[2]) this.applyStarterAspect(this.aspectChoices[2], false);
            else if (k === '4') {
              const rnd = this.aspectChoices[Math.floor(Math.random() * this.aspectChoices.length)];
              this.applyStarterAspect(rnd, true);
            }
          } else if (this.modal === 'KARMIC_EVENT') {
            if (k === '1') this.resolveKarmicEvent('A');
            else if (k === '2') this.resolveKarmicEvent('B');
          } else if (this.modal === 'STAGE_CLEAR' && this.stageMutationChoices) {
            if (k === '1' && this.stageMutationChoices[0]) this.selectMutationAndAdvance(this.stageMutationChoices[0].id);
            else if (k === '2' && this.stageMutationChoices[1]) this.selectMutationAndAdvance(this.stageMutationChoices[1].id);
            else if (k === '3' && this.stageMutationChoices[2]) this.selectMutationAndAdvance(this.stageMutationChoices[2].id);
          } else if (this.modal === 'PORTAL_CHOICE' && this.runBlueprint) {
            const node = this.runBlueprint.acts[this.pendingNextActIndex || 1];
            if (node) {
              if (k === '1') this.choosePortalBranch(node.primaryPortal);
              else if (k === '2') this.choosePortalBranch(node.altPortal);
            }
          }
        });
      }
    };

    // =========================================================================
    // 4. UI 渲染扩展：主界面模式/劫度切换器、顶部异象/倒计时胶囊、四大新肉鸽弹窗与杨柳重随骰
    // =========================================================================
    const origRenderTitleScreen = UIManager.prototype.renderTitleScreen;
    UIManager.prototype.renderTitleScreen = function (ctx, sw, sh, app) {
      origRenderTitleScreen.call(this, ctx, sw, sh, app);
      if (app.modal === 'BANISH_POOL') {
        this.renderBanishPoolModal(ctx, sw, sh, app);
        this.renderMockAdIfActive(ctx, sw, sh);
        this.renderRipples && this.renderRipples(ctx);
        this.renderToast(ctx, sw, sh, true);
        return;
      }
      if (app.modal || DouyinSDK.mockAdState.active) return;

      const safePad = Math.max(18, Math.round(sw * 0.025));
      const cardTop = 53;
      const cardH = Math.max(194, sh - 120);
      const footY = cardTop + cardH + 7;
      const startBtnW = Math.min(220, Math.round(sw * 0.28));
      const startBtnH = Math.max(40, Math.min(48, sh - footY - 7));
      const startX = sw - safePad - startBtnW - 4;

      const curModeId = app.saveData.runMode || 'STANDARD_4ACT';
      const modeIdx = Math.max(0, RUN_MODES.findIndex((m) => m.id === curModeId));
      const modeObj = RUN_MODES[modeIdx];
      const ascLv = app.saveData.ascensionLevel || 0;
      const ascObj = Curve.ASCENSION_TIERS[Math.min(Curve.ASCENSION_TIERS.length - 1, ascLv)];

      // 重绘右下角流光立体主出战按钮以匹配当前所选快节奏模式
      const startVariant = curModeId === 'DAILY_SEED' ? 'purple' : 'primary';
      UITheme.drawOrnateButton(
        ctx,
        startX,
        footY,
        startBtnW,
        startBtnH,
        modeObj.startBtn,
        this.getBtnVisualState(startX, footY, startBtnW, startBtnH, {
          variant: startVariant,
          bg: curModeId === 'BLITZ_90' ? '#ff2a54' : undefined,
          fontSize: 15,
          shimmerTime: app.globalTime
        })
      );

      // 在底部点将台船坞右侧整齐排布【模式切换令牌】与【劫度印记令牌】
      const pillH = Math.max(34, startBtnH - 6);
      const pillY = footY + Math.round((startBtnH - pillH) / 2);
      const ascW = 102;
      const modeW = 136;
      const ascX = startX - ascW - 8;
      const modeX = ascX - modeW - 8;

      if (modeX > safePad + 160) {
        UITheme.drawOrnateButton(
          ctx,
          modeX,
          pillY,
          modeW,
          pillH,
          modeObj.shortLabel,
          this.getBtnVisualState(modeX, pillY, modeW, pillH, {
            variant: 'cyan',
            studs: false,
            fontSize: 11
          })
        );
        this.addButton('btn_cycle_mode', modeX, pillY, modeW, pillH, () => {
          const nextM = RUN_MODES[(modeIdx + 1) % RUN_MODES.length];
          app.saveData.runMode = nextM.id;
          app.persistSave();
          this.showToast(`已切换模式：【${nextM.shortLabel}】${nextM.desc}`, 2.6);
        }, { rippleColor: '#00f5d4' });

        UITheme.drawOrnateButton(
          ctx,
          ascX,
          pillY,
          ascW,
          pillH,
          `☯ 劫度:${ascLv}劫`,
          this.getBtnVisualState(ascX, pillY, ascW, pillH, {
            variant: 'token',
            studs: false,
            fontSize: 11
          })
        );
        this.addButton('btn_cycle_asc', ascX, pillY, ascW, pillH, () => {
          app.saveData.ascensionLevel = (ascLv + 1) % Curve.ASCENSION_TIERS.length;
          app.persistSave();
          const nextA = Curve.ASCENSION_TIERS[app.saveData.ascensionLevel];
          this.showToast(`☯ 切换至【${nextA.name}】（灵蕴收益 ${nextA.soulBonus}x）：${nextA.rule}`, 3.0);
        });
      }

      this.renderRipples && this.renderRipples(ctx);
      void ascObj;
    };

    // 土地庙商店追加【观音杨柳重随骰】与【紧箍封印净池】立体令牌（自适应防遮挡排版）
    const origRenderMetaShop = UIManager.prototype.renderMetaShopModal;
    UIManager.prototype.renderMetaShopModal = function (ctx, sw, sh, app) {
      origRenderMetaShop.call(this, ctx, sw, sh, app);
      const mw = Math.min(650, sw - 28);
      const mh = Math.min(368, sh - 20);
      const mx = Math.round((sw - mw) / 2);
      const my = Math.round((sh - mh) / 2);

      this.beginModalPop && this.beginModalPop(ctx, sw, sh);

      const closeX = mx + mw - 50 - 12;
      const adBtnX = closeX - 142 - 8;
      const rightEdge = adBtnX - 6;

      const curRerollLv = app.saveData.metaLevels.reroll_lv || 0;
      const maxRerollLv = 4;
      const cost = 45 + curRerollLv * 35;
      const canBuy = curRerollLv < maxRerollLv && app.saveData.souls >= cost;

      const banishList = (app.saveData && app.saveData.banishedIds) || [];
      const maxSeals = 3 + ((app.saveData && app.saveData.metaLevels && app.saveData.metaLevels.banish_lv) || 0);

      const compact = mw < 610;
      const sealW = compact ? 92 : 104;
      const rerollW = compact ? 98 : 112;
      const sealX = rightEdge - sealW;
      const rx = sealX - rerollW - 5;
      const ry = my + 9;

      // 1. 🎲杨柳重随骰升级令牌
      if (rx >= mx + 188) {
        UITheme.drawOrnateButton(
          ctx,
          rx,
          ry,
          rerollW,
          28,
          curRerollLv >= maxRerollLv ? '🎲杨柳骰满' : `🎲杨柳Lv.${curRerollLv}(${cost})`,
          this.getBtnVisualState(rx, ry, rerollW, 28, {
            variant: canBuy ? 'cyan' : 'slate',
            disabled: !canBuy,
            studs: false,
            fontSize: 10
          })
        );
        if (canBuy) {
          this.addButton('buy_reroll_dice', rx, ry, rerollW, 28, () => {
            app.saveData.souls -= cost;
            app.saveData.metaLevels.reroll_lv = curRerollLv + 1;
            app.persistSave();
            SoundFX.play('scroll');
            this.showToast(`🎲【观音杨柳骰】升至 Lv.${curRerollLv + 1}！每局初始免费重随 +1！`);
          });
        }
      }

      // 2. 🔒紧箍封印净池入口令牌
      if (sealX >= mx + 188) {
        UITheme.drawOrnateButton(
          ctx,
          sealX,
          ry,
          sealW,
          28,
          `🔒紧箍池(${banishList.length}/${maxSeals})`,
          this.getBtnVisualState(sealX, ry, sealW, 28, {
            variant: 'token',
            studs: false,
            fontSize: 10
          })
        );
        this.addButton('open_banish_pool', sealX, ry, sealW, 28, () => {
          SoundFX.play('uiClick');
          app.modal = 'BANISH_POOL';
        });
      }

      this.endModalPop && this.endModalPop(ctx);
    };

    // 新增局外构筑自由度弹窗：【紧箍封印槽（Banish Seals）—— 屏蔽不想要的法宝/变异/天道异象】
    UIManager.prototype.renderBanishPoolModal = function (ctx, sw, sh, app) {
      this.clearButtons();
      UITheme.drawModalBackdrop(ctx, sw, sh, app.globalTime, '#ffd166');
      this.beginModalPop && this.beginModalPop(ctx, sw, sh);

      const mw = Math.min(726, sw - 22);
      const mh = Math.min(394, sh - 16);
      const mx = Math.round((sw - mw) / 2);
      const my = Math.round((sh - mh) / 2);

      drawPixelPanel(ctx, mx, my, mw, mh, '#141126', '#ffd166', 8, {
        headerBand: 38,
        topCrest: true,
        corners: true,
        glowColor: '#ffd166'
      });

      const banishSet = new Set((app.saveData && app.saveData.banishedIds) || []);
      const curBanishLv = (app.saveData.metaLevels && app.saveData.metaLevels.banish_lv) || 0;
      const maxBanishLv = 3;
      const maxSeals = 3 + curBanishLv;
      const upCost = 55 + curBanishLv * 45;
      const canUpSeal = curBanishLv < maxBanishLv && app.saveData.souls >= upCost;

      UITheme.drawSealStamp(ctx, mx + 12, my + 7, 24, '紧箍', '#590d22', '#ffd166');
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(`紧箍封印净池 · 已封印 ${banishSet.size} / ${maxSeals} 项（屏蔽后不再污染随机池）`, mx + 42, my + 25);

      const backW = 62;
      const backX = mx + mw - backW - 12;
      UITheme.drawOrnateButton(
        ctx,
        backX,
        my + 7,
        backW,
        25,
        '返回 ↩',
        this.getBtnVisualState(backX, my + 7, backW, 25, { variant: 'slate', studs: false, fontSize: 11 })
      );
      this.addButton('banish_back', backX, my + 7, backW, 25, () => {
        app.modal = 'META_SHOP';
      });

      const upW = 148;
      const upX = backX - upW - 8;
      UITheme.drawOrnateButton(
        ctx,
        upX,
        my + 7,
        upW,
        25,
        curBanishLv >= maxBanishLv ? '🔒封印槽已达6上限' : `➕扩充+1槽(${upCost}灵蕴)`,
        this.getBtnVisualState(upX, my + 7, upW, 25, {
          variant: canUpSeal ? 'jade' : 'slate',
          disabled: !canUpSeal,
          studs: false,
          fontSize: 11
        })
      );
      if (canUpSeal) {
        this.addButton('buy_banish_slot', upX, my + 7, upW, 25, () => {
          app.saveData.souls -= upCost;
          app.saveData.metaLevels.banish_lv = curBanishLv + 1;
          app.persistSave();
          SoundFX.play('scroll');
          this.showToast(`🔒 紧箍封印槽上限提升至 ${maxSeals + 1} 个！`);
        });
      }

      const allItems = []
        .concat(SUB_WEAPONS.map((w) => ({ id: w.id, name: w.name, cat: '法宝', color: w.color, element: w.element })))
        .concat(MUTATIONS.map((m) => ({ id: m.id, name: m.name, cat: '仙缘', color: m.color, element: m.element })))
        .concat(Curve.WORLD_MUTATORS.map((wm) => ({ id: wm.id, name: wm.name, cat: '异象', color: wm.badgeColor })));

      const cols = 4;
      const rows = Math.ceil(allItems.length / cols);
      const gridTop = my + 44;
      const gridH = mh - 56;
      const gapX = 8;
      const gapY = 6;
      const cellW = Math.floor((mw - 28 - gapX * (cols - 1)) / cols);
      const cellH = Math.min(54, Math.max(38, Math.floor((gridH - gapY * (rows - 1)) / rows)));

      allItems.forEach((it, idx) => {
        const r = Math.floor(idx / cols);
        const c = idx % cols;
        const cx = mx + 14 + c * (cellW + gapX);
        const cy = gridTop + r * (cellH + gapY);
        const sealed = banishSet.has(it.id);
        const hov = this.isRectHovered(cx, cy, cellW, cellH);

        drawPixelPanel(
          ctx,
          cx,
          cy,
          cellW,
          cellH,
          sealed ? '#2e1222' : hov ? '#241e3d' : '#19162d',
          sealed ? '#ff4d6d' : hov ? '#ffd166' : it.color || '#4a4e69',
          4,
          { shadow: false }
        );

        ctx.textAlign = 'left';
        ctx.fillStyle = sealed ? '#ff4d6d' : '#ffd166';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`${sealed ? '🔒 ' : '◇ '}${it.name}`, cx + 8, cy + 18);

        const em = it.element && Curve.ELEMENT_LABELS && Curve.ELEMENT_LABELS[it.element];
        ctx.fillStyle = sealed ? '#adb5bd' : '#90e0ef';
        ctx.font = '10px sans-serif';
        ctx.fillText(`${it.cat}${em ? ' · ' + em.short : ''}${sealed ? ' [已封印]' : ''}`, cx + 8, cy + 34);

        this.addButton(`toggle_banish_${it.id}`, cx, cy, cellW, cellH, () => {
          const list = Array.isArray(app.saveData.banishedIds) ? app.saveData.banishedIds.slice() : [];
          const pos = list.indexOf(it.id);
          if (pos >= 0) {
            list.splice(pos, 1);
            app.saveData.banishedIds = list;
            app.persistSave();
            SoundFX.play('uiClick');
            this.showToast(`已解除对【${it.name}】的紧箍封印`);
          } else {
            if (list.length >= maxSeals) {
              this.showToast(`紧箍封印槽已满 (${maxSeals}/${maxSeals})！可先取消其他项或扩充槽位`);
              return;
            }
            list.push(it.id);
            app.saveData.banishedIds = list;
            app.persistSave();
            SoundFX.play('scroll');
            this.showToast(`🔒 已封印【${it.name}】，后续开局不再刷出！`);
          }
        });
      });

      this.endModalPop && this.endModalPop(ctx);
    };

    // 战斗 HUD 与新增三大肉鸽弹窗渲染
    const origRenderCombatUI = UIManager.prototype.renderCombatUI;
    UIManager.prototype.renderCombatUI = function (ctx, sw, sh, app) {
      origRenderCombatUI.call(this, ctx, sw, sh, app);
      if (!app.player || !app.level || DouyinSDK.mockAdState.active) return;

      const safeSide = Math.max(14, Math.round(sw * 0.02));
      const leftHudEnd = safeSide + 304 + 8;
      const rightHudStart = sw - safeSide - 254 - 8;
      const topGapW = rightHudStart - leftHudEnd;

      const bossActive = app.bossEntity && app.bossEntity.activated && !app.bossEntity.dead;
      const hasStageBanner = app.stageBannerTimer > 0 && app.level.region && !bossActive;
      const hasWindWarn = !hasStageBanner && app.level.windCurrentForce && Math.abs(app.level.windCurrentForce) > 5 && !bossActive;
      const wideTopY = bossActive ? 60 : hasStageBanner ? 62 : hasWindWarn ? 44 : 10;

      // 1. 显示【本局天道异象 & 本命法相 & 五行融合 / 90秒大闹天宫倒计时】镶金铭牌（窄屏自动停靠左上状态栏下方零遮挡！）
      if (!app.modal) {
        if (app.saveData.runMode === 'BLITZ_90') {
          const pillW = 224;
          const fitCenter = topGapW >= pillW;
          const pillX = fitCenter ? Math.round((leftHudEnd + rightHudStart - pillW) / 2) : safeSide;
          const pillY = fitCenter ? wideTopY : 100;
          const urgent = app.blitzTimer <= 15;
          drawPixelPanel(ctx, pillX, pillY, pillW, 32, 'rgba(42, 8, 18, 0.92)', urgent ? '#ff2a54' : '#ffba08', 5, {
            glowColor: urgent ? '#ff2a54' : '#ffba08'
          });
          ctx.textAlign = 'center';
          ctx.fillStyle = urgent ? '#ff4d6d' : '#ffd166';
          ctx.font = 'bold 13px monospace, sans-serif';
          ctx.fillText(`🔥 大闹天宫: ${app.blitzTimer.toFixed(1)}s`, pillX + pillW / 2, pillY + 21);
        } else if (app.runBlueprint) {
          const mut = app.runBlueprint.worldMutator;
          const asp = app.player.starterAspect;
          const bp = app.player.activeScrollBreakpoint;
          const syn = app.player.synergyState;
          const duoTag = syn && syn.activeDuos.length ? ` · ★${syn.activeDuos[0].name.split(' · ')[0]}` : '';
          const tagText = `☯ ${mut.name}${asp ? ' · ' + asp.name.slice(0, 4) : ''}${duoTag || (bp ? ' · ' + bp.tierName.split('·')[0] : '')}`;
          ctx.font = 'bold 11px sans-serif';
          const pillW = Math.min(276, Math.max(162, Math.round(ctx.measureText(tagText).width + 26)));
          const fitCenter = topGapW >= pillW;
          const pillX = fitCenter ? Math.round((leftHudEnd + rightHudStart - pillW) / 2) : safeSide;
          const pillY = fitCenter ? wideTopY : 100;
          drawPixelPanel(ctx, pillX, pillY, pillW, 25, 'rgba(18, 14, 34, 0.90)', mut.badgeColor || '#ffd166', 4, {
            shadow: false
          });
          ctx.textAlign = 'center';
          ctx.fillStyle = mut.badgeColor || '#ffd166';
          ctx.fillText(tagText, pillX + pillW / 2, pillY + 17);
          this.addButton('hud_mutator_tip', pillX, pillY, pillW, 25, () => {
            const synTip =
              syn && syn.activeDuos.length
                ? ` | 双系融合:${syn.activeDuos.map((d) => d.name).join('、')}`
                : syn && syn.activeElements.length
                  ? ` | 五行共鸣:${syn.activeElements.map((e) => `${e.name}(${e.tier}阶)`).join('、')}`
                  : '';
            this.showToast(`【${mut.name}】${mut.desc}${synTip}`, 3.4);
          });
        }
      }

      // 2. 在 STAGE_CLEAR（仙缘变异三选一）底部追加【🎲 杨柳骰重随】立体按钮
      if (app.modal === 'STAGE_CLEAR') {
        const rw = 224;
        const rh = 34;
        const rx = Math.round((sw - rw) / 2);
        const ry = sh - 44;
        UITheme.drawOrnateButton(
          ctx,
          rx,
          ry,
          rw,
          rh,
          app.rerollsLeft > 0 ? `🎲 杨柳仙骰重随 (剩余:${app.rerollsLeft})` : '🎬 视频激活杨柳仙骰重随',
          this.getBtnVisualState(rx, ry, rw, rh, { variant: 'cyan', fontSize: 12 })
        );
        this.addButton('btn_reroll_mut', rx, ry, rw, rh, () => {
          app.tryUseReroll('STAGE_CLEAR');
        });
      }

      // 3. 新增弹窗 A：第0秒【开局本命法相 · 三选一 + 盲盒领灵蕴】
      if (app.modal === 'ASPECT_PICK') {
        this.renderAspectPickModal(ctx, sw, sh, app);
        this.renderRipples && this.renderRipples(ctx);
        this.renderToast(ctx, sw, sh, true);
      }
      // 4. 新增弹窗 B：中段【西游因果奇遇 · 风险收益二选一】
      else if (app.modal === 'KARMIC_EVENT') {
        this.renderKarmicEventModal(ctx, sw, sh, app);
        this.renderRipples && this.renderRipples(ctx);
        this.renderToast(ctx, sw, sh, true);
      }
      // 5. 新增弹窗 C：Boss后【八十一难 · 双劫传送门二选一】
      else if (app.modal === 'PORTAL_CHOICE') {
        this.renderPortalChoiceModal(ctx, sw, sh, app);
        this.renderRipples && this.renderRipples(ctx);
        this.renderToast(ctx, sw, sh, true);
      }
    };

    // 渲染弹窗 A：开局本命法相三选一（带法相灵印、五行共鸣标与天命盲盒金匣横幅）
    UIManager.prototype.renderAspectPickModal = function (ctx, sw, sh, app) {
      this.clearButtons();
      UITheme.drawModalBackdrop(ctx, sw, sh, app.globalTime, '#ffd166');
      this.beginModalPop && this.beginModalPop(ctx, sw, sh);

      const mut = app.runBlueprint ? app.runBlueprint.worldMutator : null;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('⚡ 凝练本命法相 · 开辟此局专属战斗流派', sw / 2, 31);

      if (mut) {
        const mwTag = Math.min(sw - 56, 500);
        drawPixelPanel(ctx, Math.round((sw - mwTag) / 2), 39, mwTag, 24, 'rgba(28, 20, 46, 0.90)', mut.badgeColor || '#ff9f1c', 4, {
          shadow: false,
          innerFrame: false
        });
        ctx.fillStyle = mut.badgeColor || '#ff9f1c';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`☯ 本局天道异象：【${mut.name}】${mut.desc}`, sw / 2, 55);
      }

      const choices = app.aspectChoices || [];
      const cardW = Math.min(216, Math.floor((sw - 64) / 3));
      const cardH = Math.min(214, sh - 124);
      const totalW = cardW * 3 + 24;
      const startX = Math.round((sw - totalW) / 2);
      const topY = 70;

      const tagColors = { red: '#ff5252', purple: '#c77dff', green: '#69f0ae' };
      const tagSeals = { red: '斗相', purple: '妙相', green: '金相' };

      choices.forEach((asp, idx) => {
        const cx = startX + idx * (cardW + 12);
        const col = tagColors[asp.tag] || '#ffd166';
        const isHov = this.isRectHovered(cx, topY, cardW, cardH);
        const cy = topY + (isHov ? -2 : 0);

        drawPixelPanel(ctx, cx, cy, cardW, cardH, '#18142d', col, 7, {
          corners: true,
          headerBand: 52,
          glowColor: isHov ? col : null
        });

        UITheme.drawSealStamp(ctx, cx + 12, cy + 11, 28, tagSeals[asp.tag] || '法相', '#110d1e', col);

        ctx.textAlign = 'left';
        ctx.fillStyle = col;
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(asp.name, cx + 46, cy + 27);

        const em = Curve.ELEMENT_LABELS && Curve.ELEMENT_LABELS[asp.element];
        ctx.fillStyle = (em && em.color) || '#90e0ef';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(
          em ? `☯ 五行：${em.short} · ${em.name}` : `✦ 流派：${asp.element.toUpperCase()}`,
          cx + 46,
          cy + 44
        );

        ctx.textAlign = 'center';
        ctx.fillStyle = '#e9ecef';
        ctx.font = '12px sans-serif';
        const maxChars = Math.max(11, Math.floor((cardW - 22) / 12.2));
        const lines = wrapTextLines(asp.desc, maxChars);
        lines.slice(0, 4).forEach((ln, li) => {
          ctx.fillText(ln, cx + cardW / 2, cy + 76 + li * 20);
        });

        const btnY = cy + cardH - 39;
        UITheme.drawOrnateButton(
          ctx,
          cx + 16,
          btnY,
          cardW - 32,
          29,
          `觉醒法相 [${idx + 1}]`,
          this.getBtnVisualState(cx + 16, btnY, cardW - 32, 29, {
            variant: 'gold',
            bg: col,
            bgBottom: col,
            border: '#ffffff',
            textColor: '#120d16',
            fontSize: 12
          })
        );

        this.addButton(`pick_aspect_${asp.id}`, cx, topY, cardW, cardH, () => {
          app.applyStarterAspect(asp, false);
        }, { rippleColor: col });
      });

      // 底部【🎁 听凭天命盲盒】紫金流光横幅
      const blindW = Math.min(448, sw - 48);
      const blindH = 36;
      const blindX = Math.round((sw - blindW) / 2);
      const blindY = topY + cardH + 10;
      UITheme.drawOrnateButton(
        ctx,
        blindX,
        blindY,
        blindW,
        blindH,
        '🎁 听凭天命·随机盲盒开局（额外获赠 +25灵蕴 & 随机法宝！）[4]',
        this.getBtnVisualState(blindX, blindY, blindW, blindH, {
          variant: 'purple',
          fontSize: 12,
          shimmerTime: app.globalTime
        })
      );
      this.addButton('pick_aspect_blind', blindX, blindY, blindW, blindH, () => {
        const rnd = choices[Math.floor(Math.random() * choices.length)];
        app.applyStarterAspect(rnd, true);
      });

      this.endModalPop && this.endModalPop(ctx);
    };

    // 渲染弹窗 B：西游因果奇遇二选一（黑金画卷与正奇双生抉择卡）
    UIManager.prototype.renderKarmicEventModal = function (ctx, sw, sh, app) {
      this.clearButtons();
      UITheme.drawModalBackdrop(ctx, sw, sh, app.globalTime, '#ffd166');
      this.beginModalPop && this.beginModalPop(ctx, sw, sh);

      const ev = app.activeEventDef || Curve.KARMIC_EVENTS[0];
      const mw = Math.min(576, sw - 32);
      const mh = Math.min(298, sh - 24);
      const mx = Math.round((sw - mw) / 2);
      const my = Math.round((sh - mh) / 2);

      drawPixelPanel(ctx, mx, my, mw, mh, '#17132a', '#ffd166', 8, {
        headerBand: 42,
        topCrest: true,
        corners: true,
        lattice: true,
        glowColor: '#ffd166'
      });

      UITheme.drawSealStamp(ctx, mx + 14, my + 8, 26, '奇遇', '#9d0208', '#ffd166');
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 19px sans-serif';
      ctx.fillText(`✨ 西游因果奇遇 · ${ev.title}`, sw / 2 + 8, my + 28);

      ctx.fillStyle = '#e0fbfc';
      ctx.font = '12px sans-serif';
      ctx.fillText(ev.prompt, sw / 2, my + 62);

      const cardW = Math.floor((mw - 48) / 2);
      const cardH = mh - 92;
      const topY = my + 76;

      [
        { key: 'A', data: ev.choiceA, col: '#69f0ae', variant: 'jade', seal: '正果', num: '1' },
        { key: 'B', data: ev.choiceB, col: '#ff9f1c', variant: 'crimson', seal: '险中', num: '2' }
      ].forEach((opt, idx) => {
        const cx = mx + 16 + idx * (cardW + 16);
        const isHov = this.isRectHovered(cx, topY, cardW, cardH);
        const cy = topY + (isHov ? -2 : 0);

        drawPixelPanel(ctx, cx, cy, cardW, cardH, '#211c38', opt.col, 6, {
          corners: true,
          headerBand: 40,
          glowColor: isHov ? opt.col : null
        });

        UITheme.drawSealStamp(ctx, cx + 10, cy + 8, 24, opt.seal, '#120f22', opt.col);
        ctx.textAlign = 'left';
        ctx.fillStyle = opt.col;
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(opt.data.label, cx + 42, cy + 26);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        const lines = wrapTextLines(opt.data.effectDesc, Math.max(12, Math.floor((cardW - 24) / 12.2)));
        lines.slice(0, 4).forEach((ln, li) => {
          ctx.fillText(ln, cx + cardW / 2, cy + 64 + li * 20);
        });

        const by = cy + cardH - 38;
        UITheme.drawOrnateButton(
          ctx,
          cx + 18,
          by,
          cardW - 36,
          28,
          `抉择此因果 [${opt.num}]`,
          this.getBtnVisualState(cx + 18, by, cardW - 36, 28, {
            variant: opt.variant,
            fontSize: 12
          })
        );

        this.addButton(`evt_pick_${opt.key}`, cx, topY, cardW, cardH, () => {
          app.resolveKarmicEvent(opt.key);
        }, { rippleColor: opt.col });
      });

      this.endModalPop && this.endModalPop(ctx);
    };

    // 渲染弹窗 C：击败Boss后【八十一难 · 双劫传送门二选一】（含动态漩涡秘境法门视窗）
    UIManager.prototype.renderPortalChoiceModal = function (ctx, sw, sh, app) {
      this.clearButtons();
      UITheme.drawModalBackdrop(ctx, sw, sh, app.globalTime, '#00f5d4');
      this.beginModalPop && this.beginModalPop(ctx, sw, sh);

      const nextIdx = app.pendingNextActIndex || 1;
      const actNode = app.runBlueprint && app.runBlueprint.acts[nextIdx];
      if (!actNode) {
        app.modal = null;
        this.endModalPop && this.endModalPop(ctx);
        return;
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = '#00f5d4';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(`🌀 司命分岔 · 选择第 ${nextIdx + 1} 劫西行秘境法门`, sw / 2, 32);

      const isPinchAct = nextIdx === 2;
      ctx.fillStyle = isPinchAct ? '#ff9f1c' : '#ced4da';
      ctx.font = '12px sans-serif';
      ctx.fillText(
        isPinchAct
          ? '⚠ 前方踏入【第三劫高压试炼区】，妖王凶威暴涨，但高品神兵爆率大幅提升！'
          : '从八十一难秘境中选择一道法门踏入，不同劫难拥有专属开局赐福：',
        sw / 2,
        52
      );

      const branches = [actNode.primaryPortal, actNode.altPortal];
      const cardW = Math.min(280, Math.floor((sw - 64) / 2));
      const cardH = Math.min(226, sh - 116);
      const totalW = cardW * 2 + 24;
      const startX = Math.round((sw - totalW) / 2);
      const topY = 64;

      branches.forEach((br, idx) => {
        const cx = startX + idx * (cardW + 24);
        const bias = REWARD_BIAS_LABELS[br.rewardBias] || REWARD_BIAS_LABELS.scroll;
        const isHov = this.isRectHovered(cx, topY, cardW, cardH);
        const cy = topY + (isHov ? -2 : 0);

        drawPixelPanel(ctx, cx, cy, cardW, cardH, '#15182e', bias.color, 8, {
          corners: true,
          headerBand: 36,
          glowColor: isHov ? bias.color : null
        });

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(br.title, cx + cardW / 2, cy + 24);

        // 左侧动态漩涡秘境法门视窗
        const gateX = cx + 32;
        const gateY = cy + 68;
        ctx.save();
        ctx.strokeStyle = br.regionColor || bias.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(gateX, gateY, 15, 22, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = UITheme.withAlpha(br.regionColor || bias.color, 0.20);
        ctx.fill();
        ctx.strokeStyle = '#00f5d4';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(gateX, gateY, 7 + Math.sin(app.globalTime * 6 + idx) * 2, 13, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 右侧妖王、地域与地形机关情报
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ff4d6d';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`👹 ${(br.bossTitle || '秘境妖王').slice(0, 12)}`, cx + 56, cy + 56);

        ctx.fillStyle = br.regionColor || '#90e0ef';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`📍 ${(br.theme || '独立随机秘境').slice(0, 14)}`, cx + 56, cy + 74);

        if (br.terrainLabel) {
          ctx.fillStyle = '#adb5bd';
          ctx.font = '10px sans-serif';
          ctx.fillText(`⚙ ${br.terrainLabel.slice(0, 15)}`, cx + 56, cy + 90);
        }

        const boxY = cy + 100;
        drawPixelPanel(ctx, cx + 14, boxY, cardW - 28, 48, 'rgba(255,255,255,0.05)', bias.color, 4, {
          shadow: false,
          innerFrame: false
        });
        ctx.textAlign = 'center';
        ctx.fillStyle = bias.color;
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(bias.badge, cx + cardW / 2, boxY + 18);
        ctx.fillStyle = '#e0fbfc';
        ctx.font = '11px sans-serif';
        ctx.fillText(bias.desc.slice(0, 21), cx + cardW / 2, boxY + 36);

        const by = cy + cardH - 39;
        UITheme.drawOrnateButton(
          ctx,
          cx + 22,
          by,
          cardW - 44,
          29,
          `踏入此劫 [${idx + 1}]`,
          this.getBtnVisualState(cx + 22, by, cardW - 44, 29, {
            variant: 'gold',
            bg: bias.color,
            bgBottom: bias.color,
            border: '#ffffff',
            textColor: '#120d16',
            fontSize: 13
          })
        );

        this.addButton(`pick_portal_${idx}`, cx, topY, cardW, cardH, () => {
          app.choosePortalBranch(br);
        }, { rippleColor: bias.color });
      });

      // 底部杨柳仙骰重新抽取两扇八十一难传送门！
      const rw = 240;
      const rh = 32;
      const rx = Math.round((sw - rw) / 2);
      const ry = topY + cardH + 9;
      UITheme.drawOrnateButton(
        ctx,
        rx,
        ry,
        rw,
        rh,
        app.rerollsLeft > 0 ? `🎲 杨柳骰换一批劫难 (剩:${app.rerollsLeft})` : '🎬 看视频换一批劫难门',
        this.getBtnVisualState(rx, ry, rw, rh, { variant: 'cyan', fontSize: 12 })
      );
      this.addButton('btn_reroll_portal', rx, ry, rw, rh, () => {
        app.tryUseReroll('PORTAL_CHOICE');
      });

      this.endModalPop && this.endModalPop(ctx);
    };
  }

  // 加载模块时自动挂载增强钩子
  installCurveDirector();

  return {
    RUN_MODES,
    installCurveDirector
  };
});
