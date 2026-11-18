/**
 * 《西游破劫录》64神装五部位披挂、16怪物素材掉落保底与兜率炼器坊运行时导演模块
 * (src/core/equipForgeDirector.js)
 *
 * 采用零冲突 AOP 原型增强架构，无缝挂载并升级：
 * 1. 五大披挂部位（神兵/冠冕/宝甲/步履/灵饰）+ 七大西游本命套装（2件/4件套战斗特效）+ 十大神圣词条。
 * 2. 16种怪物素材物理磁吸掉落（高清18x18像素贴图渲染、品质光环、小怪/精英/妖王三层防脸黑保底）。
 * 3. 三合一【披挂淬火 · 八卦锻造台(64图谱) · 妖材百宝囊(16素材)】UI面板（支持局内[B]键与主界面【⚒炼器】随时打造）。
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
})('equipForgeDirector', function (require) {
  const EquipCfg = require('../config/equipment');
  const {
    MAX_ENHANCE_LV,
    EQUIP_SLOTS,
    EQUIP_TIERS,
    MONSTER_MATERIALS,
    MATERIAL_MAP,
    EQUIP_SETS,
    EQUIP_TEMPLATES,
    generateEquipment,
    reforgeEquipmentAffixes,
    getEnhanceCost,
    enhanceEquipment,
    evaluateForgeRecipe,
    forgeEquipmentByTemplate,
    getRecycleYield,
    shouldDropGroundEquipment,
    rollMonsterMaterialDrops,
    formatBaseStatLines
  } = EquipCfg;

  const SDK_CONFIG = require('../config/sdkConfig');
  const DouyinSDK = require('../sdk/douyinSDK');
  const SoundFX = require('../audio/soundFX');
  const AssetLoader = require('../assets/assetLoader');
  const { GameApp } = require('./gameApp');
  const { Player } = require('../entities/player');
  const { EffectsManager } = require('../entities/effects');
  const { UIManager, drawPixelPanel } = require('../ui/hudAndModals');

  let UITheme = null;
  try {
    UITheme = require('../ui/uiTheme');
  } catch (e) {
    UITheme = null;
  }

  function safeWithAlpha(hex, alpha) {
    if (UITheme && UITheme.withAlpha) return UITheme.withAlpha(hex, alpha);
    return hex || '#ffffff';
  }

  function installEquipForgeDirector() {
    if (GameApp.__equipForgeDirectorInstalled) return;
    GameApp.__equipForgeDirectorInstalled = true;

    // =========================================================================
    // 1. 存档扩展：持久化 16 种怪物素材百宝囊、三层防脸黑保底计数与传家预锻造栏
    // =========================================================================
    const origLoadSaveData = GameApp.prototype.loadSaveData;
    GameApp.prototype.loadSaveData = function () {
      const data = origLoadSaveData.call(this);
      let raw = {};
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          raw = JSON.parse(window.localStorage.getItem(SDK_CONFIG.storageKey) || '{}') || {};
        }
      } catch (e) {
        raw = {};
      }

      const defaultMats = {
        mat_yaogu: 3,
        mat_xuantie: 3,
        mat_hupi: 2,
        mat_hanlin: 2
      };
      data.materials = Object.assign({}, defaultMats, data.materials || {}, raw.materials || {});
      data.dropPity = Object.assign(
        { mobEquipDry: 0, eliteEquipDry: 0, mobMatDry: 0, eliteT3Dry: 0, bossT4Dry: 0 },
        data.dropPity || {},
        raw.dropPity || {}
      );
      data.forgedCount = typeof raw.forgedCount === 'number' ? raw.forgedCount : data.forgedCount || 0;
      data.heirloomLoadout = Object.assign({}, data.heirloomLoadout || {}, raw.heirloomLoadout || {});
      return data;
    };

    GameApp.prototype.addMaterial = function (matId, count) {
      if (!matId || !count || count <= 0) return;
      this.saveData.materials = this.saveData.materials || {};
      this.saveData.materials[matId] = Math.max(0, (this.saveData.materials[matId] || 0) + count);
      this.persistSave();
    };

    GameApp.prototype.getTotalMaterialCount = function () {
      const bag = (this.saveData && this.saveData.materials) || {};
      let sum = 0;
      Object.keys(bag).forEach((k) => {
        sum += Math.max(0, bag[k] || 0);
      });
      return sum;
    };

    // =========================================================================
    // 2. 玩家五部位披挂、10大特效词条与7大西游套装（2件/4件）战斗机制挂载
    // =========================================================================
    const origRecalcStats = Player.prototype.recalcStats;
    Player.prototype.recalcStats = function (fullHeal) {
      if (this.equipped && this.equipped.boots === undefined) {
        this.equipped.boots = null;
      }
      origRecalcStats.call(this, fullHeal);

      const eq = this.equipStats;
      if (!eq) return;

      // 步履槽与词条移速加成
      if (eq.moveSpeed) {
        this.moveSpeed = Math.round(this.moveSpeed + eq.moveSpeed);
      }
      // 天蓬星河 4件套额外全伤减免
      if (eq.dmgReduct) {
        this.defense = Math.min(0.78, this.defense + eq.dmgReduct);
      }
    };

    // 伤害掷骰钩子：破军断魂斩杀增伤、流沙卷帘控场增伤、玄冰寒髓减速暴击、西海真龙翻滚必暴、泣血魔葫吸血
    const origRollDamage = Player.prototype.rollDamage;
    Player.prototype.rollDamage = function (baseDmg, forceCrit) {
      let guaranteeCrit = !!forceCrit;
      if (this._dragonRollCritTimer && this._dragonRollCritTimer > 0) {
        guaranteeCrit = true;
        this._dragonRollCritTimer = 0;
      }
      return origRollDamage.call(this, baseDmg, guaranteeCrit);
    };

    // 翻滚钩子：缩地神行缩减CD + 西海真龙4件套翻滚后下击必暴
    const origTryRoll = Player.prototype.tryRoll;
    Player.prototype.tryRoll = function (moveDir, worldCtx) {
      const prevRoll = this.rollTimer;
      origTryRoll.call(this, moveDir, worldCtx);
      if (prevRoll <= 0 && this.rollTimer > 0 && this.equipStats && this.equipStats.specials) {
        if (this.equipStats.specials.wind_swift) {
          this.rollCdTimer *= 0.82;
        }
        if (this.equipStats.specials.set_zhenlong_4) {
          this._dragonRollCritTimer = 3.0;
          worldCtx && worldCtx.effects && worldCtx.effects.spawnParticles(this.x, this.y - 16, 8, '#00f5d4', 30, 100, 0.12, 0.25, 0);
        }
      }
    };

    // 本命神通钩子：锦襕佛陀4件套金莲护盾 + 兜率太清4件套概率返还一半蓝耗
    const origTryCastSkill = Player.prototype.tryCastSkill;
    Player.prototype.tryCastSkill = function (worldCtx) {
      const prevMp = this.mp;
      const prevCd = this.skillCdTimer;
      origTryCastSkill.call(this, worldCtx);
      if (prevCd <= 0 && this.skillCdTimer > 0 && this.equipStats && this.equipStats.specials) {
        if (this.equipStats.specials.set_fotuo_4) {
          this.shieldHp = Math.max(this.shieldHp, Math.round(this.maxHp * 0.18));
          worldCtx && worldCtx.effects && worldCtx.effects.spawnFloatingText(this.x, this.y - 44, '佛陀金莲护体!', '#ffd166', false);
        }
        if (this.equipStats.specials.set_taiqing_4 && Math.random() < 0.35) {
          const refund = Math.max(6, Math.round((prevMp - this.mp) * 0.5));
          this.restoreMp(refund, worldCtx && worldCtx.effects, true);
        }
      }
    };

    // 法宝副武钩子：支持新增西游法宝行为 (vase_wave / vortex_pull) + 万法归宗省蓝增伤 + 太清返蓝
    const origTryCastSubWeapon = Player.prototype.tryCastSubWeapon;
    Player.prototype.tryCastSubWeapon = function (worldCtx) {
      if (this.dead || !this.subWeapon || this.subWeaponCdTimer > 0) return;
      const { getSubWeaponById } = require('../config/weapons');
      const w = getSubWeaponById(this.subWeapon);
      const hasEcho = !!(this.equipStats && this.equipStats.specials && this.equipStats.specials.dharma_echo);
      const mpCost = hasEcho ? 10 : 15;

      // 处理新增专属法宝行为：羊脂玉净瓶 & 弥勒人种袋
      if (w && (w.behavior === 'vase_wave' || w.behavior === 'vortex_pull')) {
        const { effects, enemies, onHitEnemy, triggerShake } = worldCtx;
        if (!this.spendMp(mpCost, effects)) return;
        this.subWeaponCdTimer = w.cooldown * (1 - this.cdReduction);
        this.triggerSquash(1.18, 0.86);
        SoundFX.play('skill');

        const mult = w.dmgMult * (hasEcho ? 1.28 : 1.0);
        const roll = this.rollDamage(this.skillPower * mult, false);

        if (w.behavior === 'vase_wave') {
          this.heal(this.maxHp * 0.08, effects);
          effects.spawnProjectile({
            owner: 'player',
            kind: 'tornado',
            x: this.x + this.dir * 18,
            y: this.y - 18,
            vx: this.dir * 290,
            vy: 0,
            radius: 24,
            dmg: roll.dmg,
            isCrit: roll.isCrit,
            pierce: 99,
            passWall: true,
            destroyEnemyProj: true,
            ignoreShield: true,
            knock: 220,
            color: '#80ffdb',
            life: 1.4
          });
        } else {
          triggerShake && triggerShake(6, 0, 1);
          effects.spawnZone({
            kind: 'shockwave_ring',
            x: this.x + this.dir * 42,
            y: this.y - 16,
            radius: 145,
            color: '#ffd166',
            duration: 0.36
          });
          const cx = this.x + this.dir * 42;
          for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (!e.dead && Math.hypot(e.x - cx, e.y - this.y) <= 148) {
              if (!e.isBoss) e.x += (cx - e.x) * 0.55;
              onHitEnemy(e, {
                dmg: roll.dmg,
                isCrit: roll.isCrit,
                knockX: (cx >= e.x ? 1 : -1) * 80,
                knockY: -85,
                stunSec: 1.25,
                ignoreShield: true,
                sourceX: cx
              });
            }
          }
        }

        if (this.equipStats && this.equipStats.specials && this.equipStats.specials.set_taiqing_4 && Math.random() < 0.35) {
          this.restoreMp(Math.round(mpCost * 0.5), effects, true);
        }
        return;
      }

      // 原版法宝增强：万法归宗省蓝5点 & 增伤28%
      if (hasEcho) {
        this.mp = Math.min(this.maxMp, this.mp + 5);
      }
      const savedSkillPower = this.skillPower;
      if (hasEcho) this.skillPower = Math.round(this.skillPower * 1.28);
      const prevSubCd = this.subWeaponCdTimer;
      origTryCastSubWeapon.call(this, worldCtx);
      this.skillPower = savedSkillPower;

      if (prevSubCd <= 0 && this.subWeaponCdTimer > 0 && this.equipStats && this.equipStats.specials && this.equipStats.specials.set_taiqing_4) {
        if (Math.random() < 0.35) this.restoreMp(8, worldCtx && worldCtx.effects, true);
      }
    };

    // 普攻第3击钩子：齐天大圣4件套破甲金芒
    const origExecuteAttackHit = Player.prototype.executeAttackHit;
    Player.prototype.executeAttackHit = function (spec, worldCtx) {
      origExecuteAttackHit.call(this, spec, worldCtx);
      if (this.currentComboStep === 2 && this.equipStats && this.equipStats.specials) {
        if (this.equipStats.specials.set_dasheng_4 && worldCtx && worldCtx.effects) {
          worldCtx.effects.spawnProjectile({
            owner: 'player',
            kind: 'crescent_wave_big',
            x: this.x + this.dir * 20,
            y: this.y - 19,
            vx: this.dir * 450,
            vy: 0,
            radius: 13,
            dmg: Math.max(5, Math.round(this.atk * 0.42)),
            isCrit: true,
            pierce: 6,
            ignoreShield: true,
            color: '#ffd60a',
            coreColor: '#ffffff',
            life: 0.62
          });
        }
      }
    };

    // 受击钩子：平天魔尊4件套受击魔焰反震
    const origTakeDamage = Player.prototype.takeDamage;
    Player.prototype.takeDamage = function (rawDmg, knockDir, effects) {
      const res = origTakeDamage.call(this, rawDmg, knockDir, effects);
      if (res === 'damaged' && !this.dead && this.equipStats && this.equipStats.specials && this.equipStats.specials.set_pingtian_4) {
        const app = this._appRef;
        if (app && app.enemies) {
          effects && effects.spawnZone({
            kind: 'shockwave_ring',
            x: this.x,
            y: this.y - 16,
            radius: 115,
            color: '#ff4d6d',
            duration: 0.3
          });
          const ctxBag = app.buildWorldContext();
          for (let i = 0; i < app.enemies.length; i++) {
            const e = app.enemies[i];
            if (!e.dead && Math.hypot(e.x - this.x, e.y - this.y) <= 115) {
              ctxBag.onHitEnemy(e, {
                dmg: Math.max(6, Math.round(this.atk * 0.85)),
                isCrit: true,
                knockX: (e.x >= this.x ? 1 : -1) * 190,
                knockY: -80,
                ignoreShield: true,
                sourceX: this.x
              });
            }
          }
        }
      }
      return res;
    };

    // 击杀钩子：斩妖回血词条 + 天蓬星河4件套回血罡气波
    const origOnKillEnemy = Player.prototype.onKillEnemy;
    Player.prototype.onKillEnemy = function (effects) {
      origOnKillEnemy.call(this, effects);
      if (!this.equipStats) return;
      if (this.equipStats.lifeOnKill > 0) {
        this.heal(this.equipStats.lifeOnKill, effects);
      }
      if (this.equipStats.specials && this.equipStats.specials.set_tianpeng_4) {
        this.heal(Math.max(2, Math.round(this.maxHp * 0.03)), effects);
        effects && effects.spawnZone({
          kind: 'shockwave_ring',
          x: this.x,
          y: this.y - 14,
          radius: 78,
          color: '#69f0ae',
          duration: 0.24
        });
      }
    };

    // 冷却计时递减
    const origPlayerUpdate = Player.prototype.update;
    Player.prototype.update = function (dt, input, worldCtx) {
      if (this._dragonRollCritTimer > 0) {
        this._dragonRollCritTimer = Math.max(0, this._dragonRollCritTimer - dt);
      }
      if (this._bloodGourdCd > 0) {
        this._bloodGourdCd = Math.max(0, this._bloodGourdCd - dt);
      }
      origPlayerUpdate.call(this, dt, input, worldCtx);
    };

    // =========================================================================
    // 3. 战场怪物素材物理磁吸掉落 & 高清地面装备光柱贴图升级
    // =========================================================================
    EffectsManager.prototype.spawnMaterialDrops = function (x, y, matList) {
      if (!Array.isArray(matList) || !matList.length) return;
      let idx = 0;
      matList.forEach((m) => {
        const copies = Math.min(4, Math.max(1, m.count || 1));
        for (let c = 0; c < copies; c++) {
          const spread = (idx - (matList.length - 1) * 0.5) * 36 + (Math.random() - 0.5) * 48;
          this.drops.push({
            kind: 'material',
            matId: m.id,
            matName: m.name,
            tier: m.tier || 1,
            iconKey: m.iconKey,
            color: m.color || '#69f0ae',
            val: 1,
            x,
            y: y - 14,
            vx: spread * 2.1,
            vy: -135 - Math.random() * 75,
            age: 0,
            delay: 0.28
          });
          idx++;
        }
      });
    };

    const origEffectsUpdate = EffectsManager.prototype.update;
    EffectsManager.prototype.update = function (dt, worldCtx) {
      for (let i = 0; i < this.drops.length; i++) {
        if (this.drops[i].kind === 'material') {
          this.drops[i].age = (this.drops[i].age || 0) + dt;
        }
      }
      origEffectsUpdate.call(this, dt, worldCtx);
    };

    const origEffectsRenderWorld = EffectsManager.prototype.renderWorld;
    EffectsManager.prototype.renderWorld = function (ctx, camX, camY, assetLoader) {
      origEffectsRenderWorld.call(this, ctx, camX, camY, assetLoader);

      // 叠加绘制高清 18x18 怪物素材掉落物（带品质光晕与悬浮微动）
      for (let i = 0; i < this.drops.length; i++) {
        const d = this.drops[i];
        if (d.kind !== 'material') continue;
        const sx = Math.round(d.x - camX);
        const sy = Math.round(d.y - camY + Math.sin((d.age || 0) * 8) * 2);

        ctx.save();
        // 高阶仙材/神材绘制脉冲光环与微缩光柱
        if (d.tier >= 3) {
          ctx.globalAlpha = 0.28 + Math.sin((d.age || 0) * 9) * 0.1;
          ctx.fillStyle = d.color;
          ctx.fillRect(sx - 3, sy - 22, 6, 22);
        }
        ctx.globalAlpha = 0.42;
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(sx, sy - 6, d.tier >= 3 ? 9 : 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
        const spr = assetLoader && assetLoader.getMaterialSprite && assetLoader.getMaterialSprite(d.iconKey, false);
        if (spr) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(spr, Math.round(sx - spr.width / 2), Math.round(sy - spr.height * 0.72));
        } else {
          ctx.fillStyle = d.color;
          ctx.fillRect(sx - 4, sy - 10, 8, 8);
        }
        ctx.restore();
      }
    };

    // 地面整件装备掉落视觉增强：仙/神/圣品地面旋转法阵纹与上升星火
    const origRenderPixelWorld = GameApp.prototype.renderPixelWorld;
    GameApp.prototype.renderPixelWorld = function (wctx) {
      origRenderPixelWorld.call(this, wctx);
      if (!wctx || !this.level || !this.level.interactables) return;
      const camX = Math.round(this.camX);
      const camY = Math.round(this.camY);

      for (let i = 0; i < this.level.interactables.length; i++) {
        const it = this.level.interactables[i];
        if (it.type !== 'equip_drop' || it.opened || !it.equipItem) continue;
        const eq = it.equipItem;
        if (eq.rarityIndex < 2) continue;
        const ix = Math.round(it.x - camX);
        const iy = Math.round(it.y - camY);
        if (ix < -40 || ix > this.worldW + 40) continue;

        wctx.save();
        wctx.strokeStyle = eq.rarityColor;
        wctx.globalAlpha = 0.65 + Math.sin(this.globalTime * 8) * 0.2;
        wctx.lineWidth = 1;
        wctx.beginPath();
        wctx.ellipse(ix, iy - 2, 11 + eq.rarityIndex * 1.5, 3.5, 0, 0, Math.PI * 2);
        wctx.stroke();

        // 神品/圣品星芒粒子上浮
        if (eq.rarityIndex >= 4) {
          for (let m = 0; m < 3; m++) {
            const p = ((this.globalTime * 1.4 + m * 0.33) % 1);
            const mx = ix + Math.round(Math.sin(this.globalTime * 5 + m * 2.1) * 7);
            const my = iy - 6 - Math.round(p * 36);
            wctx.globalAlpha = 1 - p;
            wctx.fillStyle = m % 2 === 0 ? '#ffffff' : eq.rarityColor;
            wctx.fillRect(mx, my, 2, 2);
          }
        }
        wctx.restore();
      }
    };

    // =========================================================================
    // 4. 接管装备难度缩放、怪物素材爆率结算、宝箱爆材与分解返材
    // =========================================================================
    // 关卡难度与五部位装备成长曲线联动校准：保证第1~4劫 Boss 击杀时长稳定在 10s~15s 黄金爽感区间
    const origEnterStage = GameApp.prototype.enterStage;
    GameApp.prototype.enterStage = function (stageIndex, loopCount, stageOpts) {
      origEnterStage.call(this, stageIndex, loopCount, stageOpts);
      if (!this.level || !this.enemies) return;
      const actIdx = typeof this.currentActIndex === 'number' ? this.currentActIndex : this.level.stageIndex || 0;
      const bossScale = 1.04 + Math.min(4, actIdx) * 0.10;
      const mobScale = 1.02 + Math.min(4, actIdx) * 0.05;
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (!e || e.dead) continue;
        const mult = e.isBoss ? bossScale : mobScale;
        e.maxHp = Math.round(e.maxHp * mult);
        e.hp = e.maxHp;
      }
    };

    const origStartNewRun = GameApp.prototype.startNewRun;
    GameApp.prototype.startNewRun = function (charId, startOpts) {
      origStartNewRun.call(this, charId, startOpts);
      if (this.player) {
        this.player._appRef = this;
        this.player.runMaterialsCount = 0;
        this.player.runMaterialsMap = {};

        // 若玩家在主界面【炼器坊】预先锻造了传家披挂，开局自动披挂上阵！
        const heirlooms = this.saveData && this.saveData.heirloomLoadout;
        if (heirlooms && Object.keys(heirlooms).length > 0) {
          let equippedNames = [];
          EQUIP_SLOTS.forEach((sl) => {
            if (heirlooms[sl.id]) {
              this.player.equipItem(heirlooms[sl.id]);
              equippedNames.push(heirlooms[sl.id].name);
              delete heirlooms[sl.id];
            }
          });
          if (equippedNames.length > 0) {
            this.persistSave();
            this.ui.showToast(`⚒ 炼器坊预铸披挂【${equippedNames.join('、')}】已随身披挂上阵！`, 3.0);
          }
        }
      }
    };

    // 命中额外特效钩子：破军断魂、流沙卷帘控场增伤、玄冰寒髓减速、泣血魔葫回血
    const origHandleHitEnemy = GameApp.prototype.handleHitEnemy;
    GameApp.prototype.handleHitEnemy = function (enemy, hitOpts) {
      if (enemy && !enemy.dead && this.player && this.player.equipStats) {
        const sp = this.player.equipStats.specials || {};
        if (sp.havoc_execute && enemy.hp <= enemy.maxHp * 0.32) {
          hitOpts.dmg = Math.round(hitOpts.dmg * 1.24);
        }
        if (sp.set_juanlian_4 && (enemy.slowTimer > 0 || enemy.stunTimer > 0)) {
          hitOpts.dmg = Math.round(hitOpts.dmg * 1.25);
        }
        if (sp.frost_shatter) {
          if (enemy.slowTimer > 0 && !hitOpts.isCrit && Math.random() < 0.15) {
            hitOpts.isCrit = true;
            hitOpts.dmg = Math.round(hitOpts.dmg * this.player.critMult);
          }
          if (hitOpts.isHeavy) {
            enemy.slowTimer = Math.max(enemy.slowTimer, 1.8);
          }
        }
        if (sp.blood_gourd && hitOpts.isCrit && (!this.player._bloodGourdCd || this.player._bloodGourdCd <= 0)) {
          this.player._bloodGourdCd = 0.6;
          this.player.heal(Math.max(2, Math.round(this.player.maxHp * 0.02)), this.effects);
        }
      }
      return origHandleHitEnemy.call(this, enemy, hitOpts);
    };

    // 升级版按劫数难度与轮回劫度生成装备掉落
    GameApp.prototype.spawnEquipmentDrop = function (x, y, sourceType, extraOpts) {
      if (!this.level) return null;
      const stageIdx = typeof this.currentActIndex === 'number' ? this.currentActIndex : this.level.stageIndex || 0;
      const ascLv = (this.saveData && this.saveData.ascensionLevel) || 0;
      const baseLv =
        1 +
        stageIdx * 2 +
        (this.level.loopCount || 0) * 4 +
        ascLv +
        (sourceType === 'boss' ? 2 : sourceType === 'elite' ? 1 : 0);

      const item = generateEquipment(
        baseLv,
        Object.assign(
          {
            source: sourceType || 'mob',
            stageIndex: stageIdx,
            ascensionLevel: ascLv
          },
          extraOpts || {}
        )
      );
      const starStr = item.enhanceLv ? ` +${item.enhanceLv}` : '';
      const dropObj = {
        id: `equip_drop_${item.uid}`,
        type: 'equip_drop',
        x,
        y,
        opened: false,
        equipItem: item,
        label: `检视【${item.rarityName}·${item.name}${starStr} Lv.${item.level}】`
      };
      this.level.interactables.push(dropObj);
      this.effects.spawnParticles(x, y - 14, 14, item.rarityColor, 35, 135, 0.18, 0.4, 180);
      return item;
    };

    // 平衡化击杀掉落结算：控制整装泛滥 + 精准掉落16种怪物素材（含三层保底）
    GameApp.prototype.rewardKilledEnemy = function (enemy) {
      if (!this.player || !this.level) return;
      this.player.onKillEnemy(this.effects);

      const hasGoldToad = !!(this.player.equipStats && this.player.equipStats.specials && this.player.equipStats.specials.golden_fortune_eq);
      const greedMult = (this.player.hasMutation('golden_greed') ? 1.4 : 1.0) * (hasGoldToad ? 1.25 : 1.0);
      const souls = Math.max(1, Math.round(enemy.souls * greedMult));
      const gold = Math.max(1, Math.round(enemy.gold * greedMult));

      const bunChance = this.player.id === 'bajie' ? 0.22 : 0.06;
      const dropBun = enemy.isElite || Math.random() < bunChance;
      this.effects.spawnLoot(enemy.x, enemy.y, souls, gold, dropBun);

      const stageIdx = typeof this.currentActIndex === 'number' ? this.currentActIndex : this.level.stageIndex || 0;
      const ascLv = (this.saveData && this.saveData.ascensionLevel) || 0;
      const bonusRate = (this.player.hasMutation('golden_greed') ? 0.08 : 0) + (hasGoldToad ? 0.16 : 0);
      this.saveData.dropPity = this.saveData.dropPity || { mobEquipDry: 0, eliteEquipDry: 0, mobMatDry: 0, eliteT3Dry: 0, bossT4Dry: 0 };

      // 1. 结算怪物锻造素材掉落（小怪42%+3连保底 / 精英100% / 妖王100%双核）
      const regionId = (this.level.region && this.level.region.id) || (this.level.biome && this.level.biome.id) || '';
      const matDrops = rollMonsterMaterialDrops(enemy, {
        stageIndex: stageIdx,
        ascensionLevel: ascLv,
        regionId,
        pityState: this.saveData.dropPity,
        bonusRate
      });
      if (matDrops.length > 0 && this.effects.spawnMaterialDrops) {
        this.effects.spawnMaterialDrops(enemy.x, enemy.y, matDrops);
        const highMat = matDrops.find((m) => m.tier >= 4) || matDrops.find((m) => m.tier >= 3);
        if (highMat && enemy.isBoss) {
          this.effects.spawnFloatingText(enemy.x, enemy.y - 52, `★ 爆出神材【${highMat.name}】!`, highMat.color, true);
        }
      }

      // 2. 结算地面整件披挂装备掉落（平衡频率 + 保底防非）
      const rankKey = enemy.isBoss ? 'boss' : enemy.isElite ? 'elite' : 'mob';
      if (shouldDropGroundEquipment(rankKey, stageIdx, ascLv, this.saveData.dropPity, bonusRate * 0.5)) {
        const dropX = enemy.isBoss ? enemy.x - 28 : enemy.isElite ? enemy.x + 18 : enemy.x;
        const dropY = enemy.isBoss ? this.level.bossSpawn.y : enemy.y;
        const eq = this.spawnEquipmentDrop(dropX, dropY, rankKey);
        if (eq && enemy.isBoss) {
          this.ui.showToast(`🌟 妖王爆出极品披挂：【${eq.rarityName}·${eq.name} Lv.${eq.level}】！`, 3.2);
        }
      }

      // 3. 精英必掉三才天书
      if (enemy.isElite) {
        this.level.interactables.push({
          id: `elite_scroll_${enemy.uid}`,
          type: 'scroll',
          x: enemy.x,
          y: enemy.y,
          opened: false,
          label: '拾取精英掉落【三才天书】'
        });
        this.ui.showToast('斩杀精英妖将！掉落【三才天书】与妖魔灵材！');
      }

      // 4. 守关妖王开启破劫传送门
      if (enemy.isBoss && !this.portalSpawned) {
        this.portalSpawned = true;
        SoundFX.play('revive');
        if (this.level.tribulationNo) {
          this.saveData.clearedTribulations = this.saveData.clearedTribulations || {};
          this.saveData.clearedTribulations[this.level.tribulationNo] = true;
        }
        this.persistSave();
        const maxRunStages = Math.max(6, (this.runRoute && this.runRoute.length) || 6);
        this.level.interactables.push({
          id: 'boss_portal',
          type: 'portal',
          x: enemy.x,
          y: this.level.bossSpawn.y,
          opened: false,
          label:
            this.level.tribulationNo >= 81 || this.level.stageIndex >= maxRunStages - 1
              ? '踏入破劫金门（九九归真 · 通关圆满）'
              : '踏入传送法阵 · 择路前往下一地域劫难'
        });
        this.ui.showToast(`🎉 妖王【${enemy.name}】伏诛！神材与披挂已掉落！`, 3.5);
      } else {
        this.persistSave();
      }
    };

    // 拾取钩子：收集怪物素材入库并飘字提示
    const origHandlePickupDrop = GameApp.prototype.handlePickupDrop;
    GameApp.prototype.handlePickupDrop = function (drop) {
      if (drop && drop.kind === 'material') {
        SoundFX.play('pickup');
        this.addMaterial(drop.matId, drop.val || 1);
        if (this.player) {
          this.player.runMaterialsCount = (this.player.runMaterialsCount || 0) + (drop.val || 1);
          this.player.runMaterialsMap = this.player.runMaterialsMap || {};
          this.player.runMaterialsMap[drop.matId] = (this.player.runMaterialsMap[drop.matId] || 0) + (drop.val || 1);
          this.effects &&
            this.effects.spawnFloatingText(
              this.player.x,
              this.player.y - 36,
              `+${drop.val || 1} ${drop.matName}`,
              drop.color || '#69f0ae',
              (drop.tier || 1) >= 3
            );
        }
        return;
      }
      origHandlePickupDrop.call(this, drop);
    };

    // 宝箱交互额外爆出地域素材
    const origTriggerInteract = GameApp.prototype.triggerInteract;
    GameApp.prototype.triggerInteract = function (inter) {
      const wasOpened = inter && inter.opened;
      origTriggerInteract.call(this, inter);
      if (inter && !wasOpened && inter.opened && (inter.type === 'chest' || inter.type === 'equip_chest') && this.level) {
        const stageIdx = typeof this.currentActIndex === 'number' ? this.currentActIndex : this.level.stageIndex || 0;
        const regionId = (this.level.region && this.level.region.id) || '';
        const chestMats = rollMonsterMaterialDrops(null, {
          sourceType: 'chest',
          stageIndex: stageIdx,
          ascensionLevel: (this.saveData && this.saveData.ascensionLevel) || 0,
          regionId
        });
        if (chestMats.length && this.effects && this.effects.spawnMaterialDrops) {
          this.effects.spawnMaterialDrops(inter.x, inter.y, chestMats);
        }
      }
    };

    // 分解地面装备同时返还怪物锻造素材！
    GameApp.prototype.recyclePendingItem = function () {
      const drop = this.pendingEquipDrop;
      if (!drop || drop.opened || !this.player) {
        this.modal = null;
        return;
      }
      const item = drop.equipItem;
      drop.opened = true;
      this.pendingEquipDrop = null;
      this.modal = null;

      const yieldRes = getRecycleYield(item);
      this.player.gold += yieldRes.gold;
      this.player.restoreMp(yieldRes.mp, this.effects, true);

      const matLabels = [];
      yieldRes.materials.forEach((m) => {
        this.addMaterial(m.id, m.count);
        const mDef = MATERIAL_MAP[m.id];
        if (mDef) matLabels.push(`${mDef.name}×${m.count}`);
      });

      SoundFX.play('pickup');
      this.effects.spawnParticles(drop.x, drop.y - 14, 16, '#ffd60a', 35, 140, 0.16, 0.36, 180);
      this.ui.showToast(`♻ 炼化成功！+${yieldRes.gold}金 & 获得素材【${matLabels.join('、')}】`, 2.8);
    };

    // =========================================================================
    // 5. 炼器坊核心交互动作：淬火升星(+1~+5)、词条洗炼、64图谱定向锻造
    // =========================================================================
    GameApp.prototype.tryEnhanceSelectedSlot = function () {
      if (!this.player) return;
      const slotId = this.inspectSlot || 'weapon';
      const item = this.player.equipped[slotId];
      if (!item) {
        this.ui.showToast('该槽位尚未穿戴披挂，可切至【八卦锻造】直接打造！');
        return;
      }
      const costInfo = getEnhanceCost(item);
      if (!costInfo || costInfo.isMax) {
        this.ui.showToast('✨ 该件披挂已达 +5 至臻满星！');
        return;
      }
      if (this.player.gold < costInfo.gold) {
        this.ui.showToast(`功德金铢不足（需 ${costInfo.gold} 金，当前 ${this.player.gold} 金）`);
        return;
      }
      const bag = this.saveData.materials || {};
      for (let i = 0; i < costInfo.materials.length; i++) {
        const req = costInfo.materials[i];
        if ((bag[req.id] || 0) < req.count) {
          const mDef = MATERIAL_MAP[req.id];
          this.ui.showToast(`妖材不足：缺少【${mDef ? mDef.name : req.id}】×${req.count - (bag[req.id] || 0)}`);
          return;
        }
      }

      this.player.gold -= costInfo.gold;
      costInfo.materials.forEach((req) => {
        bag[req.id] = Math.max(0, (bag[req.id] || 0) - req.count);
      });
      enhanceEquipment(item);
      this.player.recalcStats(false);
      this.persistSave();
      SoundFX.play('revive');
      this.triggerZoomPunch && this.triggerZoomPunch(0.03);
      this.ui.showToast(`🔥 淬火成功！【${item.name}】升至 ★+${item.enhanceLv}，基础属性全面跃升！`, 2.6);
    };

    GameApp.prototype.tryReforgeSelectedSlotAffixes = function () {
      if (!this.player) return;
      const slotId = this.inspectSlot || 'weapon';
      const item = this.player.equipped[slotId];
      if (!item) return;

      const goldCost = 30;
      const bag = this.saveData.materials || {};
      const matKey = (bag.mat_xuantie || 0) >= 2 ? 'mat_xuantie' : (bag.mat_yaogu || 0) >= 2 ? 'mat_yaogu' : null;

      if (this.player.gold < goldCost || !matKey) {
        this.ui.showToast('洗炼需消耗 30金铢 及 2份【玄铁残片】或【百炼妖骨】！');
        return;
      }
      this.player.gold -= goldCost;
      bag[matKey] -= 2;
      reforgeEquipmentAffixes(item);
      this.player.recalcStats(false);
      this.persistSave();
      SoundFX.play('scroll');
      this.ui.showToast(`🎲 八卦重铸完成！【${item.name}】已刷新全套随机词条！`, 2.4);
    };

    GameApp.prototype.tryForgeBlueprint = function (tplId, allowSoulAlchemy) {
      const tpl = EQUIP_TEMPLATES.find((t) => t.id === tplId);
      if (!tpl) return;

      const inRun = this.state === 'PLAYING' && !!this.player && !!this.level;
      const stageIdx = inRun ? (typeof this.currentActIndex === 'number' ? this.currentActIndex : this.level.stageIndex || 0) : 0;
      const ascLv = (this.saveData && this.saveData.ascensionLevel) || 0;
      const targetLv = inRun ? 1 + stageIdx * 2 + (this.level.loopCount || 0) * 4 + ascLv + 1 : 1 + ascLv;

      // 主界面锻造时可用灵蕴折抵金铢（1灵蕴 = 3金铢），局内使用局内金铢
      const curGold = inRun ? this.player.gold : 999999;
      const extraSoulForTitle = inRun ? 0 : Math.ceil(EQUIP_TIERS[tpl.tier || 1].forgeGold * 0.28);
      const availSouls = (this.saveData.souls || 0) + (inRun && this.player ? this.player.runSouls : 0) - extraSoulForTitle;

      const evalRes = evaluateForgeRecipe(tpl, this.saveData.materials, curGold, Math.max(0, availSouls), targetLv);
      if (!evalRes.hasGold) {
        this.ui.showToast(`局内金铢不足（需 ${evalRes.goldCost} 金铢）！`);
        return;
      }
      if (!evalRes.allMatsReady && (!allowSoulAlchemy || !evalRes.canAlchemyForge)) {
        this.ui.showToast('所需妖魔素材不足！可击败对应劫难妖魔收集，或积攒灵蕴补齐。');
        return;
      }

      const bag = this.saveData.materials || {};
      evalRes.reqList.forEach((r) => {
        bag[r.id] = Math.max(0, (bag[r.id] || 0) - Math.min(r.owned, r.required));
      });

      let totalSoulSpend = extraSoulForTitle + (evalRes.allMatsReady ? 0 : evalRes.missingSoulsCost);
      if (!inRun && (this.saveData.souls || 0) < totalSoulSpend) {
        this.ui.showToast(`土地庙灵蕴不足（需 ${totalSoulSpend} 灵蕴）！`);
        return;
      }

      if (inRun) {
        this.player.gold -= evalRes.goldCost;
        if (totalSoulSpend > 0) {
          const fromRun = Math.min(this.player.runSouls, totalSoulSpend);
          this.player.runSouls -= fromRun;
          totalSoulSpend -= fromRun;
        }
      }
      if (totalSoulSpend > 0) {
        this.saveData.souls = Math.max(0, (this.saveData.souls || 0) - totalSoulSpend);
      }

      const forged = forgeEquipmentByTemplate(tpl.id, targetLv, ascLv);
      const newItem = forged.item;
      this.saveData.forgedCount = (this.saveData.forgedCount || 0) + 1;

      if (inRun && this.player) {
        const old = this.player.equipItem(newItem);
        if (old) {
          this.player.gold += old.recycleGold || 18;
        }
        this.inspectSlot = newItem.slot;
        this.effects && this.effects.spawnParticles(this.player.x, this.player.y - 18, 24, newItem.rarityColor, 45, 180, 0.2, 0.45, 140);
        this.ui.showToast(
          `${forged.greatSuccess ? '🌟 炉火大成功！' : '⚒ 锻造成功！'}穿戴【${newItem.rarityName}·${newItem.name} Lv.${newItem.level}】！`,
          3.0
        );
      } else {
        this.saveData.heirloomLoadout = this.saveData.heirloomLoadout || {};
        this.saveData.heirloomLoadout[newItem.slot] = newItem;
        this.ui.showToast(
          `⚒ 已预铸【${newItem.rarityName}·${newItem.name}】！下一局出战将自动披挂上阵！`,
          3.2
        );
      }

      this.persistSave();
      SoundFX.play('revive');
    };

    // =========================================================================
    // 6. UI 全面升级：卡片星级/套装铭文 + 三合一披挂&八卦锻造台&百宝囊面板
    // =========================================================================
    // 主界面顶部追加【⚒ 炼器(64)】入口胶囊（若宽度充裕）
    const origRenderTitleScreen = UIManager.prototype.renderTitleScreen;
    UIManager.prototype.renderTitleScreen = function (ctx, sw, sh, app) {
      origRenderTitleScreen.call(this, ctx, sw, sh, app);
      if (app.modal === 'EQUIP_PANEL') {
        this.renderEquipPanelModal(ctx, sw, sh, app);
        this.renderRipples && this.renderRipples(ctx);
        this.renderToast(ctx, sw, sh, true);
        return;
      }
      if (app.modal || DouyinSDK.mockAdState.active) return;

      // 在底部点将台船坞内（模式胶囊左侧）整齐嵌入立体雕花【⚒ 炼器坊(64)】令牌按钮
      const safePad = Math.max(18, Math.round(sw * 0.025));
      const cardTop = 53;
      const cardH = Math.max(194, sh - 120);
      const footY = cardTop + cardH + 7;
      const startBtnW = Math.min(220, Math.round(sw * 0.28));
      const startBtnH = Math.max(40, Math.min(48, sh - footY - 7));
      const startX = sw - safePad - startBtnW - 4;
      const modeX = startX - 102 - 8 - 136 - 8;
      const forgeW = 112;
      const forgeH = Math.max(34, startBtnH - 6);
      const forgeY = footY + Math.round((startBtnH - forgeH) / 2);
      const forgeX = modeX - forgeW - 8;

      if (forgeX > safePad + 165) {
        if (UITheme && UITheme.drawOrnateButton) {
          UITheme.drawOrnateButton(
            ctx,
            forgeX,
            forgeY,
            forgeW,
            forgeH,
            '⚒ 炼器坊(64)',
            this.getBtnVisualState
              ? this.getBtnVisualState(forgeX, forgeY, forgeW, forgeH, { variant: 'purple', studs: false, fontSize: 11 })
              : { variant: 'purple', studs: false, fontSize: 11 }
          );
        } else {
          drawPixelPanel(ctx, forgeX, forgeY, forgeW, forgeH, '#2b193d', '#ffd166', 5);
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ffd166';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText('⚒ 炼器坊(64)', forgeX + forgeW / 2, forgeY + forgeH / 2 + 4);
        }
        this.addButton('btn_title_forge', forgeX, forgeY, forgeW, forgeH, () => {
          app.equipPanelTab = 'FORGE';
          app.modal = 'EQUIP_PANEL';
        }, { rippleColor: '#c77dff' });
        this.renderRipples && this.renderRipples(ctx);
      }
    };

    // 增强单张装备详情卡片：显示 T1~T4 阶位、★+N 淬火星级与【西游套装共鸣】进度
    UIManager.prototype.drawEquipItemCard = function (ctx, x, y, w, h, item, tagTitle, compareBaseScore, assetLoader, equippedMap) {
      if (!item) {
        drawPixelPanel(ctx, x, y, w, h, '#171428', '#3d405b', 6, { corners: true });
        if (UITheme && UITheme.drawDivider) UITheme.drawDivider(ctx, x + w / 2, y + h / 2 - 16, w * 0.55, '#4a4e69');
        ctx.textAlign = 'center';
        ctx.fillStyle = '#8d99ae';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(tagTitle || '当前槽位未穿戴披挂', x + w / 2, y + h / 2 + 6);
        ctx.fillStyle = '#6c757d';
        ctx.font = '11px sans-serif';
        ctx.fillText('可击败妖魔掉落，或切换上方【八卦锻造】定向打造', x + w / 2, y + h / 2 + 26);
        return;
      }

      drawPixelPanel(ctx, x, y, w, h, '#161328', item.rarityColor, 6, {
        corners: true,
        glowColor: item.rarityIndex >= 3 ? item.rarityColor : null
      });

      ctx.fillStyle = item.bgTint;
      ctx.fillRect(x + 3, y + 3, w - 6, 56);

      const iconBoxX = x + 10;
      const iconBoxY = y + 9;
      drawPixelPanel(ctx, iconBoxX, iconBoxY, 46, 46, '#0d0a18', item.rarityColor, 4, {
        shadow: false,
        innerFrame: false
      });
      if (item.rarityIndex >= 2) {
        ctx.save();
        ctx.translate(iconBoxX + 23, iconBoxY + 23);
        ctx.strokeStyle = safeWithAlpha(item.rarityColor, 0.34);
        ctx.lineWidth = 1.2;
        for (let r = 0; r < 6; r++) {
          const a = (r * Math.PI) / 3 + 0.2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6);
          ctx.lineTo(Math.cos(a) * 20, Math.sin(a) * 20);
          ctx.stroke();
        }
        ctx.restore();
      }
      const spr = assetLoader.getEquipSprite(item.iconKey, true);
      if (spr) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(spr, Math.round(iconBoxX + 23 - spr.width / 2), Math.round(iconBoxY + 23 - spr.height / 2));
        ctx.restore();
      }

      const starTag = item.enhanceLv > 0 ? ` ★+${item.enhanceLv}` : '';
      const tierInfo = EQUIP_TIERS[item.tier || 1] || EQUIP_TIERS[1];

      ctx.textAlign = 'left';
      ctx.fillStyle = item.rarityColor;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`【${item.rarityName}】${item.name}${starTag}`, x + 62, y + 25);

      ctx.fillStyle = '#e0fbfc';
      ctx.font = '11px sans-serif';
      ctx.fillText(`${item.slotName} · ${tierInfo.short} · Lv.${item.level} · 评分 ${item.score}`, x + 63, y + 43);

      // 套装徽章展示
      if (item.setId && EQUIP_SETS[item.setId]) {
        const sDef = EQUIP_SETS[item.setId];
        let wornCnt = 0;
        if (equippedMap) {
          EQUIP_SLOTS.forEach((sl) => {
            if (equippedMap[sl.id] && equippedMap[sl.id].setId === item.setId) wornCnt++;
          });
        }
        ctx.fillStyle = sDef.color;
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(`❖ 套装【${sDef.name}】${wornCnt > 0 ? `(${wornCnt}/4)` : '(2/4件共鸣)'}`, x + 63, y + 56);
      }

      if (compareBaseScore !== undefined && compareBaseScore !== null) {
        const diff = item.score - compareBaseScore;
        ctx.textAlign = 'right';
        ctx.fillStyle = diff >= 0 ? '#69f0ae' : '#ff4d6d';
        ctx.font = 'bold 12px monospace, sans-serif';
        ctx.fillText(diff >= 0 ? `▲+${diff}` : `▼${diff}`, x + w - 10, y + 25);
      } else if (tagTitle) {
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffd166';
        ctx.font = '10px sans-serif';
        ctx.fillText(tagTitle, x + w - 10, y + 24);
      }

      let curY = y + 75;
      const baseLines = formatBaseStatLines(item.baseStats);
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px sans-serif';
      baseLines.slice(0, 4).forEach((bl, idx) => {
        const colX = idx % 2 === 0 ? x + 12 : x + Math.round(w * 0.52);
        const rowY = curY + Math.floor(idx / 2) * 16;
        ctx.fillStyle = bl.color;
        ctx.fillText(`◆ ${bl.text}`, colX, rowY);
      });
      curY += Math.ceil(Math.min(4, baseLines.length) / 2) * 16 + 7;

      if (UITheme && UITheme.drawDivider) UITheme.drawDivider(ctx, x + w / 2, curY - 9, w - 24, item.rarityColor);

      const bottomReserve = item.special ? 40 : item.setId ? 24 : 10;
      ctx.font = '11px sans-serif';
      (item.affixes || []).forEach((af) => {
        if (curY > y + h - bottomReserve) return;
        ctx.fillStyle = af.color || '#90e0ef';
        ctx.fillText(`✦ ${af.label} +${af.val}${af.unit}`, x + 14, curY);
        curY += 15;
      });

      if (item.special) {
        const spY = y + h - 36;
        drawPixelPanel(ctx, x + 7, spY - 11, w - 14, 33, 'rgba(255, 209, 102, 0.12)', '#ffd60a', 3, {
          shadow: false,
          innerFrame: false
        });
        ctx.fillStyle = '#ffd60a';
        ctx.textAlign = 'left';
        ctx.font = 'bold 10px sans-serif';
        const fullTxt = `★【${item.special.name}】${item.special.desc}`;
        const maxChars = Math.max(16, Math.floor((w - 22) / 10.4));
        ctx.fillText(fullTxt.slice(0, maxChars), x + 11, spY + 1);
        if (fullTxt.length > maxChars) {
          ctx.fillText(fullTxt.slice(maxChars, maxChars * 2), x + 11, spY + 14);
        }
      } else if (item.setId && EQUIP_SETS[item.setId]) {
        const sDef = EQUIP_SETS[item.setId];
        ctx.fillStyle = sDef.color;
        ctx.font = '10px sans-serif';
        const maxChars = Math.max(16, Math.floor((w - 22) / 10.4));
        ctx.fillText(`(2) ${sDef.bonus2Desc}`.slice(0, maxChars), x + 12, y + h - 10);
      }
    };

    // 升级地面拾取对比弹窗：实时展示换装前后纸娃娃试穿立绘对比 + 分解返材明细
    const origRenderEquipCompare = UIManager.prototype.renderEquipCompareModal;
    UIManager.prototype.renderEquipCompareModal = function (ctx, sw, sh, app) {
      origRenderEquipCompare.call(this, ctx, sw, sh, app);
      const drop = app.pendingEquipDrop;
      if (!drop || !drop.equipItem || !app.player) return;
      const yld = getRecycleYield(drop.equipItem);
      const mNames = yld.materials.map((m) => `${(MATERIAL_MAP[m.id] || {}).name || '妖材'}×${m.count}`).join('+');
      const mw = Math.min(686, sw - 26);
      const mh = Math.min(358, sh - 18);
      const mx = Math.round((sw - mw) / 2);
      const my = Math.round((sh - mh) / 2);

      // 右上角内嵌【穿戴后新外观实时纸娃娃试穿小展台】！
      if (app.assetLoader && app.assetLoader.renderHeroPaperDoll) {
        const pvW = 84;
        const pvH = 76;
        const pvX = mx + mw - pvW - 22;
        const pvY = my + 44;
        drawPixelPanel(ctx, pvX, pvY, pvW, pvH, 'rgba(13, 10, 26, 0.94)', drop.equipItem.rarityColor, 4, {
          shadow: false,
          innerFrame: false
        });
        ctx.save();
        ctx.fillStyle = safeWithAlpha(drop.equipItem.rarityColor, 0.22);
        ctx.beginPath();
        ctx.ellipse(pvX + pvW / 2, pvY + pvH - 12, 22, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.imageSmoothingEnabled = false;
        ctx.translate(pvX + pvW / 2 - 2, pvY + pvH - 11);
        ctx.scale(1.18, 1.18);
        const previewEq = Object.assign({}, app.player.equipped);
        previewEq[drop.equipItem.slot] = drop.equipItem;
        app.assetLoader.renderHeroPaperDoll(ctx, {
          heroId: app.player.id,
          equipped: previewEq,
          frameKey: Math.floor(app.globalTime * 4) % 2 === 0 ? 'idle0' : 'idle1',
          animTime: app.globalTime,
          moving: false,
          hiRes: true
        });
        ctx.restore();
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('穿戴预览', pvX + pvW / 2, pvY + pvH - 2);
        ctx.restore();
      }

      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#90e0ef';
      ctx.font = '10px sans-serif';
      ctx.fillText(`分解额外返还锻造妖材：${mNames}`, sw / 2, my + mh - 50);
      ctx.restore();
    };

    // ==================== 三合一：披挂淬火 · 八卦锻造台(64件) · 妖材百宝囊(16种) ====================
    UIManager.prototype.renderEquipPanelModal = function (ctx, sw, sh, app) {
      this.clearButtons();
      const player = app.player;
      const inRun = app.state === 'PLAYING' && !!player;
      const themeCol = player ? player.charDef.themeColor : '#ffd166';

      if (UITheme && UITheme.drawModalBackdrop) {
        UITheme.drawModalBackdrop(ctx, sw, sh, app.globalTime, themeCol);
      } else {
        ctx.fillStyle = 'rgba(7, 6, 15, 0.90)';
        ctx.fillRect(0, 0, sw, sh);
      }

      const mw = Math.min(756, sw - 18);
      const mh = Math.min(392, sh - 14);
      const mx = Math.round((sw - mw) / 2);
      const my = Math.round((sh - mh) / 2);

      if (this.beginModalPop) this.beginModalPop(ctx, sw, sh);
      drawPixelPanel(ctx, mx, my, mw, mh, '#131024', themeCol, 8, {
        headerBand: 38,
        topCrest: true,
        glowColor: themeCol
      });

      const curTab = app.equipPanelTab || (inRun ? 'EQUIP' : 'FORGE');

      // 标题与三大子页签切换
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(inRun ? `⚒ ${player.charDef.name}·披挂与炼器` : '⚒ 兜率宫·八卦炼器坊', mx + 14, my + 25);

      const tabs = [
        { id: 'EQUIP', label: '⚔ 穿戴&淬火(5槽)', show: inRun },
        { id: 'FORGE', label: `⚒ 八卦锻造(64装)`, show: true },
        { id: 'MATS', label: `💎 妖材囊(${app.getTotalMaterialCount()})`, show: true }
      ].filter((t) => t.show);

      let tx = mx + 186;
      tabs.forEach((tb) => {
        const tw = 128;
        const active = curTab === tb.id;
        if (UITheme && UITheme.drawOrnateButton) {
          UITheme.drawOrnateButton(
            ctx,
            tx,
            my + 7,
            tw,
            25,
            tb.label,
            this.getBtnVisualState
              ? this.getBtnVisualState(tx, my + 7, tw, 25, {
                  variant: active ? 'purple' : 'slate',
                  border: active ? '#ffd166' : '#4a4e69',
                  studs: false,
                  fontSize: 11
                })
              : { variant: active ? 'purple' : 'slate', studs: false, fontSize: 11 }
          );
        } else {
          drawPixelPanel(ctx, tx, my + 7, tw, 25, active ? '#3c096c' : '#1f1b33', active ? '#ffd166' : '#4a4e69', 4);
          ctx.textAlign = 'center';
          ctx.fillStyle = active ? '#ffd166' : '#ced4da';
          ctx.font = active ? 'bold 11px sans-serif' : '11px sans-serif';
          ctx.fillText(tb.label, tx + tw / 2, my + 23);
        }
        this.addButton(`eq_subtab_${tb.id}`, tx, my + 7, tw, 25, () => {
          app.equipPanelTab = tb.id;
        });
        tx += tw + 6;
      });

      // 右上角资源速览与关闭按钮
      ctx.textAlign = 'right';
      ctx.fillStyle = '#72efdd';
      ctx.font = 'bold 11px sans-serif';
      const goldTxt = inRun ? `金:${player.gold}  ` : '';
      const soulVal = (app.saveData.souls || 0) + (inRun ? player.runSouls : 0);
      ctx.fillText(`${goldTxt}灵蕴:${soulVal}`, mx + mw - 78, my + 24);

      if (UITheme && UITheme.drawOrnateButton) {
        UITheme.drawOrnateButton(
          ctx,
          mx + mw - 68,
          my + 7,
          54,
          25,
          '关闭 ×',
          this.getBtnVisualState
            ? this.getBtnVisualState(mx + mw - 68, my + 7, 54, 25, { variant: 'slate', studs: false, fontSize: 11 })
            : { variant: 'slate', studs: false, fontSize: 11 }
        );
      } else {
        drawPixelPanel(ctx, mx + mw - 68, my + 7, 54, 25, '#2b2d42', '#adb5bd', 4);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('关闭 ×', mx + mw - 41, my + 23);
      }
      this.addButton('eq_panel_close', mx + mw - 68, my + 7, 54, 25, () => {
        app.modal = null;
      });

      const bodyY = my + 43;
      const bodyH = mh - 52;

      if (curTab === 'EQUIP' && inRun) {
        this._renderEquipSubTab(ctx, mx, bodyY, mw, bodyH, app);
      } else if (curTab === 'MATS') {
        this._renderMaterialsSubTab(ctx, mx, bodyY, mw, bodyH, app);
      } else {
        this._renderForgeSubTab(ctx, mx, bodyY, mw, bodyH, app, inRun);
      }

      if (this.endModalPop) this.endModalPop(ctx);
    };

    // -------------------- 子页签 1：五槽位穿戴、淬火升星与套装总览 --------------------
    UIManager.prototype._renderEquipSubTab = function (ctx, mx, bodyY, mw, bodyH, app) {
      const player = app.player;
      const leftW = 148;
      const gap = 5;
      const slotH = Math.floor((bodyH - gap * (EQUIP_SLOTS.length - 1)) / EQUIP_SLOTS.length);

      if (!EQUIP_SLOTS.some((s) => s.id === app.inspectSlot)) {
        app.inspectSlot = 'weapon';
      }

      EQUIP_SLOTS.forEach((sl, idx) => {
        const sy = bodyY + idx * (slotH + gap);
        const eq = player.equipped[sl.id];
        const isSel = app.inspectSlot === sl.id;
        const border = isSel ? '#ffd166' : eq ? eq.rarityColor : '#3d405b';
        drawPixelPanel(ctx, mx + 12, sy, leftW, slotH, isSel ? '#2d234e' : '#1b1732', border, 4);

        const iconSz = Math.min(36, slotH - 8);
        const ibY = sy + Math.round((slotH - iconSz) / 2);
        drawPixelPanel(ctx, mx + 17, ibY, iconSz, iconSz, '#0f0c1a', eq ? eq.rarityColor : '#343a40', 3, {
          shadow: false,
          innerFrame: false
        });
        if (eq) {
          const spr = app.assetLoader.getEquipSprite(eq.iconKey, false);
          if (spr) {
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            const dSz = Math.min(iconSz - 4, Math.round(spr.width * 1.15));
            ctx.drawImage(spr, Math.round(mx + 17 + (iconSz - dSz) / 2), Math.round(ibY + (iconSz - dSz) / 2), dSz, dSz);
            ctx.restore();
          }
        } else {
          ctx.textAlign = 'center';
          ctx.fillStyle = '#4a4e69';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(sl.short, mx + 17 + iconSz / 2, sy + slotH / 2 + 4);
        }

        const tx = mx + 22 + iconSz;
        ctx.textAlign = 'left';
        ctx.fillStyle = eq ? eq.rarityColor : '#8d99ae';
        ctx.font = 'bold 11px sans-serif';
        const starStr = eq && eq.enhanceLv ? ` ★+${eq.enhanceLv}` : '';
        ctx.fillText(eq ? `${eq.rarityName} Lv.${eq.level}${starStr}` : `${sl.name} (未穿戴)`, tx, sy + Math.round(slotH * 0.42));
        ctx.fillStyle = '#e0fbfc';
        ctx.font = '10px sans-serif';
        ctx.fillText(eq ? eq.name.slice(0, 7) : '点击去锻造▶', tx, sy + Math.round(slotH * 0.76));

        this.addButton(`slot_tab_${sl.id}`, mx + 12, sy, leftW, slotH, () => {
          app.inspectSlot = sl.id;
        });
      });

      // 中栏：装备详情卡 + 底部【淬火升星】&【词条洗炼】操作条
      const midX = mx + 12 + leftW + 8;
      const midW = Math.floor((mw - leftW - 40) * 0.54);
      const selItem = player.equipped[app.inspectSlot] || null;
      const selSlotName = (EQUIP_SLOTS.find((s) => s.id === app.inspectSlot) || EQUIP_SLOTS[0]).name;
      const cardH = bodyH - 44;

      this.drawEquipItemCard(
        ctx,
        midX,
        bodyY,
        midW,
        cardH,
        selItem,
        selItem ? '✦ 已穿戴' : `【${selSlotName}】未穿戴`,
        null,
        app.assetLoader,
        player.equipped
      );

      const actY = bodyY + cardH + 6;
      const actH = 36;
      if (selItem) {
        const enhCost = getEnhanceCost(selItem);
        const halfW = Math.floor((midW - 6) / 2);

        // 按钮1：淬火升星
        const isMax = enhCost.isMax;
        drawPixelPanel(ctx, midX, actY, halfW, actH, isMax ? '#2b2d42' : '#4a1c1c', isMax ? '#6c757d' : '#ff9f1c', 4);
        ctx.textAlign = 'center';
        ctx.fillStyle = isMax ? '#adb5bd' : '#ffd166';
        ctx.font = 'bold 11px sans-serif';
        if (isMax) {
          ctx.fillText('★ 已满 +5 至臻星级', midX + halfW / 2, actY + 22);
        } else {
          const mTxt = enhCost.materials.map((m) => `${(MATERIAL_MAP[m.id] || {}).name.slice(0, 2)}×${m.count}`).join(' ');
          ctx.fillText(`🔥淬火★+${enhCost.nextStar} (${enhCost.gold}金)`, midX + halfW / 2, actY + 15);
          ctx.fillStyle = '#90e0ef';
          ctx.font = '9px sans-serif';
          ctx.fillText(`耗材: ${mTxt}`, midX + halfW / 2, actY + 29);
          this.addButton('btn_enhance_slot', midX, actY, halfW, actH, () => {
            app.tryEnhanceSelectedSlot();
          });
        }

        // 按钮2：洗炼词条
        const rx = midX + halfW + 6;
        drawPixelPanel(ctx, rx, actY, halfW, actH, '#1d2d44', '#4cc9f0', 4);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#4cc9f0';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('🎲 洗炼词条 (30金)', rx + halfW / 2, actY + 15);
        ctx.fillStyle = '#ced4da';
        ctx.font = '9px sans-serif';
        ctx.fillText('耗材: 玄铁/妖骨×2', rx + halfW / 2, actY + 29);
        this.addButton('btn_reforge_slot', rx, actY, halfW, actH, () => {
          app.tryReforgeSelectedSlotAffixes();
        });
      } else {
        drawPixelPanel(ctx, midX, actY, midW, actH, '#2d6a4f', '#69f0ae', 4);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`⚒ 前往【八卦锻造台】打造专属${selSlotName}`, midX + midW / 2, actY + 22);
        this.addButton('btn_jump_to_forge', midX, actY, midW, actH, () => {
          app.forgeFilterSlot = app.inspectSlot;
          app.forgePage = 0;
          app.equipPanelTab = 'FORGE';
        });
      }

      // 右栏：实时纸娃娃换装立绘展台 + 综合面板 + 套装共鸣展示
      const rightX = midX + midW + 8;
      const rightW = mx + mw - 12 - rightX;
      drawPixelPanel(ctx, rightX, bodyY, rightW, bodyH, '#18152d', '#4cc9f0', 6);

      // 顶部：高精纸娃娃实时换装立绘台（直观呈现全身5部位装备贴图！）
      const stageH = 98;
      drawPixelPanel(ctx, rightX + 6, bodyY + 6, rightW - 12, stageH, '#0f0c1d', player.charDef.themeColor, 4, {
        shadow: false,
        innerFrame: false
      });
      ctx.fillStyle = safeWithAlpha(player.charDef.themeColor, 0.22);
      ctx.beginPath();
      ctx.ellipse(rightX + rightW / 2, bodyY + stageH - 12, 28, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (app.assetLoader && app.assetLoader.renderHeroPaperDoll) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.translate(rightX + rightW / 2 - 2, bodyY + stageH - 11);
        ctx.scale(1.48, 1.48);
        app.assetLoader.renderHeroPaperDoll(ctx, {
          heroId: player.id,
          equipped: player.equipped,
          frameKey: Math.floor(app.globalTime * 4) % 2 === 0 ? 'idle0' : 'idle1',
          animTime: app.globalTime,
          moving: false,
          forceSignatureWeapon: !!player.forceSignatureWeapon,
          hiRes: true
        });
        ctx.restore();
      }

      // 右上角兵刃外观切换胶囊（显穿戴神兵 vs 显本命兵刃）
      const wpnBtnW = 68;
      const wpnBtnX = rightX + rightW - wpnBtnW - 10;
      const wpnBtnY = bodyY + 10;
      drawPixelPanel(ctx, wpnBtnX, wpnBtnY, wpnBtnW, 18, '#261e45', '#ffd166', 3, { shadow: false, innerFrame: false });
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd166';
      ctx.font = '9px sans-serif';
      ctx.fillText(player.forceSignatureWeapon ? '兵刃:本命' : '兵刃:装备', wpnBtnX + wpnBtnW / 2, wpnBtnY + 12);
      this.addButton('btn_toggle_wpn_skin', wpnBtnX, wpnBtnY, wpnBtnW, 18, () => {
        player.forceSignatureWeapon = !player.forceSignatureWeapon;
        this.showToast(player.forceSignatureWeapon ? '已幻化显示角色【本命神兵】外观' : '已切换显示当前穿戴【神兵】外观', 1.8);
      });

      ctx.textAlign = 'left';
      ctx.fillStyle = '#90e0ef';
      ctx.font = 'bold 9.5px sans-serif';
      ctx.fillText('✦ 实时披挂立绘', rightX + 12, bodyY + 21);

      const statStartY = bodyY + stageH + 20;
      const statRows = [
        { k: '气血/灵力', v: `HP ${player.hp}/${player.maxHp} · MP ${Math.floor(player.mp)}`, c: '#ff5252' },
        { k: '物理/妙法', v: `攻${player.atk} · 魔${player.magic}`, c: '#ff9f1c' },
        { k: '护甲减伤', v: `${player.armor} (${Math.round(player.defense * 100)}%)`, c: '#69f0ae' },
        { k: '双暴/移速', v: `暴${Math.round(player.critRate * 100)}% · 速${player.moveSpeed}`, c: '#ffd60a' }
      ];

      statRows.forEach((sr, i) => {
        const ry = statStartY + i * 17;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#adb5bd';
        ctx.font = '9.5px sans-serif';
        ctx.fillText(sr.k, rightX + 9, ry);
        ctx.textAlign = 'right';
        ctx.fillStyle = sr.c;
        ctx.font = 'bold 9.5px monospace, sans-serif';
        ctx.fillText(sr.v, rightX + rightW - 9, ry);
      });

      // 套装激活区
      const setTop = statStartY + 60;
      const setBoxH = Math.max(58, bodyH - (setTop - bodyY) - 6);
      drawPixelPanel(ctx, rightX + 6, setTop, rightW - 12, setBoxH, '#120f22', '#3d405b', 4, {
        shadow: false,
        innerFrame: false
      });
      const activeSets = (player.equipStats && player.equipStats.activeSets) || [];
      ctx.textAlign = 'left';
      if (activeSets.length === 0) {
        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 10.5px sans-serif';
        ctx.fillText('❖ 西游套装共鸣 (未激活)', rightX + 12, setTop + 16);
        ctx.fillStyle = '#8d99ae';
        ctx.font = '9.5px sans-serif';
        ctx.fillText('集齐同名套装 2件 / 4件 觉醒神威！', rightX + 12, setTop + 34);
      } else {
        let sy = setTop + 15;
        activeSets.slice(0, 2).forEach((as) => {
          if (sy > setTop + setBoxH - 8) return;
          ctx.fillStyle = as.color;
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText(`❖【${as.name}】(${as.count}/4)`, rightX + 10, sy);
          sy += 13;
          ctx.fillStyle = as.tier4Active ? '#ffd60a' : '#69f0ae';
          ctx.font = '9px sans-serif';
          ctx.fillText(as.tier4Active ? `(4)${as.bonus4Desc.slice(0, 16)}` : `(2)${as.bonus2Desc.slice(0, 16)}`, rightX + 10, sy);
          sy += 15;
        });
      }
    };

    // -------------------- 子页签 2：八卦锻造台（64款西游披挂图谱定向打造） --------------------
    UIManager.prototype._renderForgeSubTab = function (ctx, mx, bodyY, mw, bodyH, app, inRun) {
      const filters = [
        { id: 'ALL', label: '全部(64)' },
        { id: 'weapon', label: '神兵(13)' },
        { id: 'helm', label: '冠冕(13)' },
        { id: 'armor', label: '宝甲(13)' },
        { id: 'boots', label: '步履(12)' },
        { id: 'accessory', label: '灵饰(13)' },
        { id: 'SETS', label: '套装(35)' }
      ];
      const curFilter = app.forgeFilterSlot || 'ALL';
      let fx = mx + 12;
      filters.forEach((f) => {
        const fw = 64;
        const active = curFilter === f.id;
        drawPixelPanel(ctx, fx, bodyY, fw, 22, active ? '#d62828' : '#1b1730', active ? '#ffd166' : '#3d405b', 3);
        ctx.textAlign = 'center';
        ctx.fillStyle = active ? '#ffd166' : '#ced4da';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(f.label, fx + fw / 2, bodyY + 15);
        this.addButton(`forge_flt_${f.id}`, fx, bodyY, fw, 22, () => {
          app.forgeFilterSlot = f.id;
          app.forgePage = 0;
        });
        fx += fw + 4;
      });

      const list = EQUIP_TEMPLATES.filter((t) => {
        if (curFilter === 'ALL') return true;
        if (curFilter === 'SETS') return !!t.setId;
        return t.slot === curFilter;
      });

      const pageSize = 6;
      const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
      const page = Math.max(0, Math.min(totalPages - 1, app.forgePage || 0));
      const pageItems = list.slice(page * pageSize, (page + 1) * pageSize);

      if (!app.selectedForgeTplId || !list.some((t) => t.id === app.selectedForgeTplId)) {
        app.selectedForgeTplId = pageItems[0] ? pageItems[0].id : EQUIP_TEMPLATES[0].id;
      }

      // 分页器置于左上筛选条右侧
      const pgX = fx + 4;
      drawPixelPanel(ctx, pgX, bodyY, 34, 22, '#22223b', '#90e0ef', 3);
      ctx.fillStyle = '#e0fbfc';
      ctx.fillText('◀', pgX + 17, bodyY + 15);
      this.addButton('forge_prev', pgX, bodyY, 34, 22, () => {
        app.forgePage = (page - 1 + totalPages) % totalPages;
      });

      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`${page + 1}/${totalPages}`, pgX + 54, bodyY + 15);

      drawPixelPanel(ctx, pgX + 74, bodyY, 34, 22, '#22223b', '#90e0ef', 3);
      ctx.fillStyle = '#e0fbfc';
      ctx.fillText('▶', pgX + 91, bodyY + 15);
      this.addButton('forge_next', pgX + 74, bodyY, 34, 22, () => {
        app.forgePage = (page + 1) % totalPages;
      });

      const gridTop = bodyY + 28;
      const gridH = bodyH - 28;
      const leftAreaW = Math.floor((mw - 32) * 0.61);
      const cols = 2;
      const rows = 3;
      const cGap = 6;
      const cellW = Math.floor((leftAreaW - cGap) / cols);
      const cellH = Math.floor((gridH - cGap * (rows - 1)) / rows);

      const stageIdx = inRun ? (typeof app.currentActIndex === 'number' ? app.currentActIndex : app.level.stageIndex || 0) : 0;
      const ascLv = (app.saveData && app.saveData.ascensionLevel) || 0;
      const targetLv = inRun ? 1 + stageIdx * 2 + ascLv + 1 : 1 + ascLv;
      const curGold = inRun && app.player ? app.player.gold : 999999;
      const curSouls = (app.saveData.souls || 0) + (inRun && app.player ? app.player.runSouls : 0);

      pageItems.forEach((tpl, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const cx = mx + 12 + c * (cellW + cGap);
        const cy = gridTop + r * (cellH + cGap);
        const sel = app.selectedForgeTplId === tpl.id;
        const tInfo = EQUIP_TIERS[tpl.tier || 1];
        const ev = evaluateForgeRecipe(tpl, app.saveData.materials, curGold, curSouls, targetLv);

        drawPixelPanel(ctx, cx, cy, cellW, cellH, sel ? '#2b214a' : '#18152b', sel ? '#ffd166' : tInfo.color, 5);

        // 18x18 高清装备图标
        const ibSz = Math.min(42, cellH - 12);
        const ibY = cy + Math.round((cellH - ibSz) / 2);
        drawPixelPanel(ctx, cx + 8, ibY, ibSz, ibSz, '#0d0a18', tInfo.color, 3, { shadow: false, innerFrame: false });
        const spr = app.assetLoader.getEquipSprite(tpl.iconKey, false);
        if (spr) {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          const dSz = Math.min(ibSz - 4, Math.round(spr.width * 1.25));
          ctx.drawImage(spr, Math.round(cx + 8 + (ibSz - dSz) / 2), Math.round(ibY + (ibSz - dSz) / 2), dSz, dSz);
          ctx.restore();
        }

        const tx = cx + 14 + ibSz;
        ctx.textAlign = 'left';
        ctx.fillStyle = tInfo.color;
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(tpl.name, tx, cy + 20);

        const setDef = tpl.setId ? EQUIP_SETS[tpl.setId] : null;
        ctx.fillStyle = setDef ? setDef.color : '#adb5bd';
        ctx.font = '10px sans-serif';
        ctx.fillText(
          setDef ? `❖${setDef.name}套 · ${tInfo.short}` : `${tInfo.name}`,
          tx,
          cy + 37
        );

        ctx.fillStyle = ev.canDirectForge ? '#69f0ae' : ev.canAlchemyForge ? '#ffd166' : '#8d99ae';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(
          ev.canDirectForge ? '✓ 妖材齐备·可铸' : ev.canAlchemyForge ? '✦ 可灵蕴补齐锻造' : '○ 收集妖材中',
          tx,
          cy + 55
        );

        this.addButton(`sel_forge_${tpl.id}`, cx, cy, cellW, cellH, () => {
          app.selectedForgeTplId = tpl.id;
        });
      });

      // 右侧：八卦丹炉选中图谱详情与一键开炉按钮
      const rightX = mx + 12 + leftAreaW + 8;
      const rightW = mx + mw - 12 - rightX;
      const selTpl = EQUIP_TEMPLATES.find((t) => t.id === app.selectedForgeTplId) || EQUIP_TEMPLATES[0];
      const tInfo = EQUIP_TIERS[selTpl.tier || 1];
      const extraTitleSouls = inRun ? 0 : Math.ceil(tInfo.forgeGold * 0.28);
      const ev = evaluateForgeRecipe(selTpl, app.saveData.materials, curGold, Math.max(0, curSouls - extraTitleSouls), targetLv);

      drawPixelPanel(ctx, rightX, gridTop, rightW, gridH, '#161229', tInfo.color, 6);

      // 顶部高清大图展示 + 右侧【图谱上身实时纸娃娃试穿预览】！
      const bigSpr = app.assetLoader.getEquipSprite(selTpl.iconKey, true);
      drawPixelPanel(ctx, rightX + 10, gridTop + 10, 48, 48, '#0b0914', ev.minRarityColor, 4, { shadow: false, innerFrame: false });
      if (bigSpr) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bigSpr, Math.round(rightX + 34 - bigSpr.width / 2), Math.round(gridTop + 34 - bigSpr.height / 2));
        ctx.restore();
      }

      if (app.assetLoader && app.assetLoader.renderHeroPaperDoll && rightW >= 230) {
        const tryW = 58;
        const tryH = 56;
        const tryX = rightX + rightW - tryW - 8;
        const tryY = gridTop + 8;
        drawPixelPanel(ctx, tryX, tryY, tryW, tryH, '#0b0914', tInfo.color, 3, { shadow: false, innerFrame: false });
        const heroId = (inRun && app.player && app.player.id) || app.selectedCharId || 'wukong';
        const baseEq = (inRun && app.player && app.player.equipped) || (app.saveData && app.saveData.heirloomLoadout) || {};
        const mockEq = Object.assign({}, baseEq);
        mockEq[selTpl.slot] = {
          templateId: selTpl.id,
          setId: selTpl.setId || null,
          rarityIndex: Math.max(2, (selTpl.tier || 1)),
          rarityColor: ev.minRarityColor
        };
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.translate(tryX + tryW / 2 - 2, tryY + tryH - 6);
        ctx.scale(1.02, 1.02);
        app.assetLoader.renderHeroPaperDoll(ctx, {
          heroId,
          equipped: mockEq,
          frameKey: Math.floor(app.globalTime * 4) % 2 === 0 ? 'idle0' : 'idle1',
          animTime: app.globalTime,
          moving: false,
          hiRes: true
        });
        ctx.restore();
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = ev.minRarityColor;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(selTpl.name, rightX + 64, gridTop + 26);
      ctx.fillStyle = '#e0fbfc';
      ctx.font = '10px sans-serif';
      ctx.fillText(`保底【${ev.minRarityName}+】 · 铸造 Lv.${targetLv}`, rightX + 64, gridTop + 43);
      if (selTpl.setId && EQUIP_SETS[selTpl.setId]) {
        const sd = EQUIP_SETS[selTpl.setId];
        ctx.fillStyle = sd.color;
        ctx.fillText(`❖ 套装：${sd.name} (${sd.bonus2Desc.slice(0, 12)})`, rightX + 64, gridTop + 57);
      }

      // 基础白字预览
      let ry = gridTop + 74;
      const bLines = formatBaseStatLines(selTpl.baseStats);
      ctx.font = '10.5px sans-serif';
      bLines.slice(0, 4).forEach((bl, idx) => {
        const bx = idx % 2 === 0 ? rightX + 12 : rightX + Math.round(rightW * 0.52);
        const by = ry + Math.floor(idx / 2) * 15;
        ctx.fillStyle = bl.color;
        ctx.fillText(`◆ ${bl.text}`, bx, by);
      });
      ry += Math.ceil(Math.min(4, bLines.length) / 2) * 15 + 8;

      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('🔥 锻造所需怪物素材清单：', rightX + 12, ry);
      ry += 8;

      ev.reqList.forEach((req) => {
        const itemY = ry;
        drawPixelPanel(ctx, rightX + 10, itemY, rightW - 20, 26, '#1f1a36', req.lack === 0 ? '#69f0ae' : '#4a4e69', 3, {
          shadow: false,
          innerFrame: false
        });
        const mSpr = app.assetLoader.getMaterialSprite && app.assetLoader.getMaterialSprite(req.iconKey, false);
        if (mSpr) {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(mSpr, rightX + 15, Math.round(itemY + 13 - mSpr.height / 2));
          ctx.restore();
        }
        ctx.textAlign = 'left';
        ctx.fillStyle = req.color;
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(req.name, rightX + 40, itemY + 17);

        ctx.textAlign = 'right';
        ctx.fillStyle = req.lack === 0 ? '#69f0ae' : '#ff4d6d';
        ctx.font = 'bold 11px monospace, sans-serif';
        ctx.fillText(`${req.owned} / ${req.required}`, rightX + rightW - 16, itemY + 17);
        ry += 30;
      });

      // 底部锻造按钮
      const btnY = gridTop + gridH - 42;
      const btnH = 34;
      const costTag = inRun ? `${ev.goldCost}金铢` : `${extraTitleSouls}灵蕴`;

      if (ev.canDirectForge) {
        if (UITheme && UITheme.drawOrnateButton) {
          UITheme.drawOrnateButton(
            ctx,
            rightX + 10,
            btnY,
            rightW - 20,
            btnH,
            `⚒ 立即开炉锻造 (${costTag})`,
            this.getBtnVisualState
              ? this.getBtnVisualState(rightX + 10, btnY, rightW - 20, btnH, {
                  variant: 'jade',
                  fontSize: 12,
                  shimmerTime: app.globalTime
                })
              : { variant: 'jade', fontSize: 12 }
          );
        } else {
          drawPixelPanel(ctx, rightX + 10, btnY, rightW - 20, btnH, '#2d6a4f', '#69f0ae', 5);
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(`⚒ 立即开炉锻造 (${costTag})`, rightX + rightW / 2, btnY + 21);
        }
        this.addButton('btn_do_forge_direct', rightX + 10, btnY, rightW - 20, btnH, () => {
          app.tryForgeBlueprint(selTpl.id, false);
        });
      } else {
        const totalNeedSouls = extraTitleSouls + ev.missingSoulsCost;
        const canSub = ev.canAlchemyForge && curSouls >= totalNeedSouls;
        const subLbl = canSub
          ? `✨ 灵蕴化材并锻造 (${inRun ? ev.goldCost + '金+' : ''}${totalNeedSouls}灵蕴)`
          : `缺少妖材 (需补 ${ev.missingSoulsCost} 灵蕴)`;
        if (UITheme && UITheme.drawOrnateButton) {
          UITheme.drawOrnateButton(
            ctx,
            rightX + 10,
            btnY,
            rightW - 20,
            btnH,
            subLbl,
            this.getBtnVisualState
              ? this.getBtnVisualState(rightX + 10, btnY, rightW - 20, btnH, {
                  variant: canSub ? 'purple' : 'slate',
                  disabled: !canSub,
                  fontSize: 11,
                  shimmerTime: canSub ? app.globalTime : undefined
                })
              : { variant: canSub ? 'purple' : 'slate', disabled: !canSub, fontSize: 11 }
          );
        } else {
          drawPixelPanel(ctx, rightX + 10, btnY, rightW - 20, btnH, canSub ? '#4a154b' : '#2b2d42', canSub ? '#ffd166' : '#6c757d', 5);
          ctx.textAlign = 'center';
          ctx.fillStyle = canSub ? '#ffd166' : '#adb5bd';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(subLbl, rightX + rightW / 2, btnY + 21);
        }
        if (canSub) {
          this.addButton('btn_do_forge_alchemy', rightX + 10, btnY, rightW - 20, btnH, () => {
            app.tryForgeBlueprint(selTpl.id, true);
          });
        }
      }
    };

    // -------------------- 子页签 3：16种怪物掉落素材百宝囊与爆率图鉴 --------------------
    UIManager.prototype._renderMaterialsSubTab = function (ctx, mx, bodyY, mw, bodyH, app) {
      const cols = 4;
      const rows = 4;
      const gap = 6;
      const infoBarH = 44;
      const gridH = bodyH - infoBarH - 8;
      const cellW = Math.floor((mw - 24 - gap * (cols - 1)) / cols);
      const cellH = Math.floor((gridH - gap * (rows - 1)) / rows);

      const bag = (app.saveData && app.saveData.materials) || {};
      const selMatId = app.selectedMatInspectId || MONSTER_MATERIALS[0].id;

      MONSTER_MATERIALS.forEach((m, idx) => {
        const r = Math.floor(idx / cols);
        const c = idx % cols;
        const cx = mx + 12 + c * (cellW + gap);
        const cy = bodyY + r * (cellH + gap);
        const cnt = bag[m.id] || 0;
        const isSel = selMatId === m.id;

        drawPixelPanel(ctx, cx, cy, cellW, cellH, isSel ? '#2b224a' : '#18152b', isSel ? '#ffd166' : m.color, 4);

        // 18x18 高清素材贴图展示框
        const ibSz = Math.min(40, cellH - 10);
        const ibY = cy + Math.round((cellH - ibSz) / 2);
        drawPixelPanel(ctx, cx + 7, ibY, ibSz, ibSz, '#0c0a16', m.color, 3, { shadow: false, innerFrame: false });
        const spr = app.assetLoader.getMaterialSprite && app.assetLoader.getMaterialSprite(m.iconKey, true);
        if (spr) {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          const dSz = Math.min(ibSz - 4, spr.width);
          ctx.drawImage(spr, Math.round(cx + 7 + (ibSz - dSz) / 2), Math.round(ibY + (ibSz - dSz) / 2), dSz, dSz);
          ctx.restore();
        }

        const tx = cx + 13 + ibSz;
        ctx.textAlign = 'left';
        ctx.fillStyle = m.color;
        ctx.font = 'bold 11.5px sans-serif';
        ctx.fillText(m.name, tx, cy + Math.round(cellH * 0.42));

        ctx.fillStyle = '#adb5bd';
        ctx.font = '10px sans-serif';
        ctx.fillText(`T${m.tier}·${m.tierLabel}`, tx, cy + Math.round(cellH * 0.76));

        ctx.textAlign = 'right';
        ctx.fillStyle = cnt > 0 ? '#69f0ae' : '#6c757d';
        ctx.font = 'bold 13px monospace, sans-serif';
        ctx.fillText(`×${cnt}`, cx + cellW - 8, cy + Math.round(cellH * 0.58));

        this.addButton(`mat_cell_${m.id}`, cx, cy, cellW, cellH, () => {
          app.selectedMatInspectId = m.id;
        });
      });

      // 底部：选中素材的掉落率、保底机制与西游地域出处说明条
      const selMat = MATERIAL_MAP[selMatId] || MONSTER_MATERIALS[0];
      const barY = bodyY + bodyH - infoBarH;
      drawPixelPanel(ctx, mx + 12, barY, mw - 24, infoBarH, '#141126', selMat.color, 5);
      ctx.textAlign = 'left';
      ctx.fillStyle = selMat.color;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`【${selMat.name}】（T${selMat.tier} ${selMat.tierLabel} · 当前库存 ×${bag[selMat.id] || 0}） — 掉率：${selMat.dropRateHint}`, mx + 22, barY + 18);
      ctx.fillStyle = '#e0fbfc';
      ctx.font = '11px sans-serif';
      ctx.fillText(`📍 怪物出处：${selMat.sourceDesc}（小怪4连必出凡/灵材，精英2连必出仙材，妖王2连必出神材！）`, mx + 22, barY + 35);
    };
  }

  installEquipForgeDirector();

  return {
    installEquipForgeDirector
  };
});
