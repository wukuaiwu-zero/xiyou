/**
 * 游戏核心引擎、像素世界渲染器与全局状态机 (src/core/gameApp.js)
 * 升级版：
 * 1. 支持手机竖屏锁定时自动 90° 满屏横版渲染与触控映射
 * 2. 镜头推拉冲击 (Camera Zoom Punch) + 方向性顿挫震屏 + 暴击微闪屏 + 长按丝滑连招
 * 3. 完整支持撞墙粉碎击杀结算与连斩爽感反馈
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
})('gameApp', function (require) {
  const SDK_CONFIG = require('../config/sdkConfig');
  const { BIOMES } = require('../config/biomes');
  const { SUB_WEAPONS, MUTATIONS, getSubWeaponById } = require('../config/weapons');
  const { generateEquipment, upgradeEquipmentRarity } = require('../config/equipment');
  const Env = require('../platform/env');
  const DouyinSDK = require('../sdk/douyinSDK');
  const SoundFX = require('../audio/soundFX');
  const AssetLoader = require('../assets/assetLoader');
  const {
    TILE_SIZE,
    TILE_SOLID,
    TILE_ONEWAY,
    TILE_HAZARD,
    generateStage,
    updateLevelMechanics
  } = require('../world/levelGen');
  const TerrainRegions = require('../config/terrainRegions81');
  const TerrainRenderer = require('../world/terrainRenderer');
  const { EffectsManager } = require('../entities/effects');
  const { Player } = require('../entities/player');
  const { Enemy } = require('../entities/enemy');
  const { UIManager } = require('../ui/hudAndModals');

  const VIRTUAL_H = 360;

  class GameApp {
    constructor() {
      this.canvas = Env.getMainCanvas();
      this.ctx = this.canvas.getContext('2d');

      this.screenW = 800;
      this.screenH = 450;
      this.rawW = 800;
      this.rawH = 450;
      this.rotatedPortrait = false;
      this.dpr = 1;

      this.worldPixelScale = 2;
      this.worldW = 640;
      this.worldH = VIRTUAL_H;
      this.worldCanvas = Env.createOffscreenCanvas(this.worldW * this.worldPixelScale, this.worldH * this.worldPixelScale);
      this.worldCtx = this.worldCanvas.getContext('2d');
      this.previewOutfitIdx = 0;

      this.resizeCanvas();

      this.saveData = this.loadSaveData();
      this.selectedCharId = this.saveData.lastCharId || 'wukong';

      this.assetLoader = AssetLoader;
      this.effects = new EffectsManager();
      this.ui = new UIManager();

      this.state = 'TITLE';
      this.modal = null;
      this.pausedByLifecycle = false;

      this.level = null;
      this.player = null;
      this.enemies = [];
      this.bossEntity = null;
      this.portalSpawned = false;
      this.nearbyInteractable = null;
      this.pendingEquipDrop = null;      // 当前正在对比检视的地面装备掉落物
      this.inspectSlot = 'weapon';       // 披挂角色面板当前选中的部位槽
      this.stageMutationChoices = [];
      this.nextRouteDoors = [];          // 破劫后可选的下一处独立地域劫难分岔门
      this.selectedNextTribNo = null;    // 玩家在土地庙选定的下一劫编号
      this.atlasRegionIdx = 0;           // 八十一难地形图鉴当前选中的地域索引
      this.stageBannerTimer = 0;         // 入场劫难与独立地形卷轴横幅计时
      this.runRoute = [];                // 本局随机西行地域劫难序列
      this.runSummary = null;

      // 升级版镜头冲击与打击感状态
      this.camX = 0;
      this.camY = 0;
      this.shakeMag = 0;
      this.shakeBiasX = 0;
      this.shakeBiasY = 0;
      this.zoomPunch = 0;        // 暴击/重砸镜头瞬推比例
      this.impactFlashAlpha = 0; // 斩杀/重暴微闪屏透明度
      this.impactFlashColor = '#ffffff';
      this.hitstopTimer = 0;
      this.globalTime = 0;

      this.ambientDots = [];
      for (let i = 0; i < 28; i++) {
        this.ambientDots.push({
          rx: Math.random(),
          ry: Math.random(),
          spd: 14 + Math.random() * 28,
          sz: Math.random() < 0.4 ? 2 : 1
        });
      }

      this.keys = {};
    }

    loadSaveData() {
      const def = {
        souls: 50,
        lastCharId: 'wukong',
        bestStage: 0,
        clearedTribulations: {},
        banishedIds: [],
        metaLevels: {
          hp_lv: 0,
          atk_lv: 0,
          flask_lv: 0,
          crit_lv: 0,
          reroll_lv: 0,
          banish_lv: 0
        }
      };
      const saved = Env.getStorage(SDK_CONFIG.storageKey, null);
      if (!saved || typeof saved !== 'object') return def;
      return Object.assign({}, def, saved, {
        souls: typeof saved.souls === 'number' ? saved.souls : 50,
        lastCharId: saved.lastCharId || 'wukong',
        bestStage: saved.bestStage || 0,
        clearedTribulations:
          saved.clearedTribulations && typeof saved.clearedTribulations === 'object'
            ? Object.assign({}, saved.clearedTribulations)
            : {},
        banishedIds: Array.isArray(saved.banishedIds) ? saved.banishedIds.slice() : [],
        metaLevels: Object.assign({}, def.metaLevels, saved.metaLevels || {})
      });
    }

    persistSave() {
      this.saveData.lastCharId = this.selectedCharId;
      Env.setStorage(SDK_CONFIG.storageKey, this.saveData);
    }

    addPermanentSouls(amount) {
      this.saveData.souls = Math.max(0, (this.saveData.souls || 0) + amount);
      this.persistSave();
    }

    buyMetaUpgrade(upDef) {
      const curLv = this.saveData.metaLevels[upDef.id] || 0;
      if (curLv >= upDef.maxLv) return;
      const cost = upDef.baseCost + curLv * upDef.costStep;
      if (this.saveData.souls < cost) return;
      this.saveData.souls -= cost;
      this.saveData.metaLevels[upDef.id] = curLv + 1;
      this.persistSave();
      SoundFX.play('scroll');
      this.ui.showToast(`【${upDef.name}】提升至 Lv.${curLv + 1}！`);
    }

    resizeCanvas() {
      const info = Env.getScreenInfo();
      this.rawW = info.rawW || info.width;
      this.rawH = info.rawH || info.height;
      this.rotatedPortrait = !!info.rotatedPortrait;
      this.screenW = Math.max(480, info.width);
      this.screenH = Math.max(270, info.height);
      this.dpr = info.dpr || 1;

      if (this.canvas) {
        this.canvas.width = Math.round(this.rawW * this.dpr);
        this.canvas.height = Math.round(this.rawH * this.dpr);
        if (Env.isBrowser && this.canvas.style) {
          this.canvas.style.width = `${this.rawW}px`;
          this.canvas.style.height = `${this.rawH}px`;
        }
      }

      const aspect = Math.max(1.33, Math.min(2.35, this.screenW / this.screenH));
      this.worldH = VIRTUAL_H;
      this.worldW = Math.round(VIRTUAL_H * aspect);
      const wScale = this.worldPixelScale || 2;
      if (this.worldCanvas) {
        this.worldCanvas.width = this.worldW * wScale;
        this.worldCanvas.height = this.worldH * wScale;
      }
    }

    boot() {
      DouyinSDK.init({
        onPause: () => {
          this.pausedByLifecycle = true;
        },
        onResume: () => {
          this.pausedByLifecycle = false;
        }
      });

      this.assetLoader.initAssets(() => {
        this.bindInputs();
        let lastTs = Date.now();
        const loop = () => {
          const now = Date.now();
          const rawDt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
          lastTs = now;

          if (!this.pausedByLifecycle) {
            this.tick(rawDt);
            this.render();
          }
          Env.nextFrame(loop);
        };
        Env.nextFrame(loop);
      });
    }

    bindInputs() {
      Env.bindInputEvents(this.canvas, {
        onFirstGesture: () => {
          SoundFX.unlockAudio && SoundFX.unlockAudio();
        },
        onResize: () => this.resizeCanvas(),
        onMouseMove: (p) => {
          this.ui.handlePointerMove && this.ui.handlePointerMove(p.x, p.y);
        },
        onTouchStart: (changed) => {
          if (!changed || !changed.length) return;
          const first = changed[0];
          this.ui.handlePointerDown && this.ui.handlePointerDown(first.x, first.y);
          if (this.ui.handleTap(first.x, first.y)) {
            return;
          }
          if (this.state === 'PLAYING' && !this.modal && !DouyinSDK.mockAdState.active) {
            this.ui.handleCombatTouchStart(changed, this.screenW, this.screenH, (act) => {
              this.triggerCombatAction(act);
            });
          }
        },
        onTouchMove: (changed) => {
          if (changed && changed.length && this.ui.handlePointerMove) {
            this.ui.handlePointerMove(changed[0].x, changed[0].y);
          }
          if (this.state === 'PLAYING' && !this.modal && !DouyinSDK.mockAdState.active) {
            this.ui.handleCombatTouchMove(changed);
          }
        },
        onTouchEnd: (changed) => {
          this.ui.handlePointerUp && this.ui.handlePointerUp();
          this.ui.handleCombatTouchEnd(changed);
        },
        onKeyDown: (code, key) => {
          const prev = !!this.keys[code];
          this.keys[code] = true;
          if (prev) return;

          if (DouyinSDK.mockAdState.active) return;

          if (this.modal === 'SCROLL_PICK') {
            if (key === '1') this.applyScrollChoice('red');
            else if (key === '2') this.applyScrollChoice('purple');
            else if (key === '3') this.applyScrollChoice('green');
            return;
          }

          if (this.modal === 'EQUIP_PANEL' && (code === 'KeyB' || code === 'KeyC' || code === 'Escape')) {
            this.modal = null;
            return;
          }
          if (this.modal === 'EQUIP_COMPARE' && code === 'Escape') {
            this.modal = null;
            return;
          }

          if (this.state === 'PLAYING' && !this.modal) {
            if (code === 'KeyK' || code === 'Space' || code === 'KeyW' || code === 'ArrowUp') {
              this.triggerCombatAction('jump');
            } else if (code === 'KeyJ') {
              this.triggerCombatAction('attack');
            } else if (code === 'KeyL' || code === 'ShiftLeft' || code === 'ShiftRight') {
              this.triggerCombatAction('roll');
            } else if (code === 'KeyU' || code === 'KeyE') {
              this.triggerCombatAction('skill');
            } else if (code === 'KeyI' || code === 'KeyQ') {
              this.triggerCombatAction('subWeapon');
            } else if (code === 'KeyH' || code === 'KeyR') {
              this.player && this.player.useFlask(this.effects);
            } else if (code === 'KeyB' || code === 'KeyC') {
              this.modal = 'EQUIP_PANEL';
            } else if (code === 'KeyF') {
              if (this.nearbyInteractable) this.triggerInteract(this.nearbyInteractable);
            }
          }
        },
        onKeyUp: (code) => {
          this.keys[code] = false;
        }
      });
    }

    getMoveInput() {
      let moveX = this.ui.touchMoveX;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX = -1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX = 1;
      const downHeld = !!(this.ui.touchDown || this.keys['KeyS'] || this.keys['ArrowDown']);
      return { moveX, downHeld };
    }

    triggerCombatAction(act) {
      if (!this.player || this.player.dead) return;
      const inp = this.getMoveInput();
      const ctxBag = this.buildWorldContext();

      if (act === 'attack') {
        this.player.tryPrimaryAttack(inp.moveX);
      } else if (act === 'jump') {
        this.player.tryJump(inp.downHeld, this.effects);
      } else if (act === 'slam') {
        this.player.tryJump(true, this.effects);
      } else if (act === 'roll') {
        this.player.tryRoll(inp.moveX, ctxBag);
      } else if (act === 'skill') {
        this.player.tryCastSkill(ctxBag);
      } else if (act === 'subWeapon') {
        this.player.tryCastSubWeapon(ctxBag);
      }
    }

    startNewRun(charId, startOpts) {
      this.selectedCharId = charId || this.selectedCharId;
      this.persistSave();
      DouyinSDK.hideBannerAd();
      DouyinSDK.trackEvent('run_start', { characterId: this.selectedCharId });

      this.player = new Player(this.selectedCharId, this.saveData.metaLevels, null);
      // 每一局自动从十二大独立地形地域中随机抽取西行破劫路线，保证每局地形与劫难组合不同！
      this.runRoute = TerrainRegions.rollWestwardRoute(6);
      const opts = startOpts || { tribulationNo: this.runRoute[0] };
      this.enterStage(0, 0, opts);
      this.state = 'PLAYING';
      this.modal = null;
      this.ui.resetTouchState();
      this.ui.showToast(
        `化身【${this.player.charDef.name}】踏入${this.level.biome.tribulationLabel}（${this.level.region.name}）！`,
        2.8
      );
    }

    jumpToTribulation(tribNo) {
      if (!this.player || this.player.dead || this.state !== 'PLAYING') {
        this.startNewRun(this.selectedCharId, { tribulationNo: tribNo });
        return;
      }
      this.modal = null;
      this.enterStage(this.level ? this.level.stageIndex : 0, this.level ? this.level.loopCount : 0, {
        tribulationNo: tribNo
      });
      this.ui.showToast(`🗺 已随机生成【${this.level.biome.name}】独立地形地图！`, 2.6);
    }

    enterStage(stageIndex, loopCount, stageOpts) {
      this.effects.reset();
      const opts = stageOpts || (this.runRoute && this.runRoute[stageIndex] ? { tribulationNo: this.runRoute[stageIndex] } : {});
      this.level = generateStage(stageIndex, loopCount, opts);
      this.portalSpawned = false;
      this.nearbyInteractable = null;
      this.stageBannerTimer = 3.4;

      this.player.placeAt(this.level.playerStart.x, this.level.playerStart.y);

      this.enemies = this.level.enemySpawns.map((sp) => new Enemy(sp));
      this.bossEntity = new Enemy(Object.assign({ isBoss: true }, this.level.bossSpawn));
      this.enemies.push(this.bossEntity);

      this.camX = Math.max(0, this.player.x - this.worldW * 0.35);
      this.camY = Math.max(0, this.player.y - this.worldH * 0.68);
    }

    returnToTitle() {
      if (this.player && this.player.runSouls > 0) {
        this.addPermanentSouls(this.player.runSouls);
        this.player.runSouls = 0;
      }
      this.state = 'TITLE';
      this.modal = null;
      this.ui.resetTouchState();
      DouyinSDK.showBannerAd();
    }

    triggerShake(mag, dirX, dirY) {
      this.shakeMag = Math.min(16, Math.max(this.shakeMag, mag || 4));
      this.shakeBiasX = dirX || 0;
      this.shakeBiasY = dirY || 0;
    }

    triggerZoomPunch(amount) {
      this.zoomPunch = Math.min(0.08, Math.max(this.zoomPunch, amount || 0.035));
    }

    triggerImpactFlash(color, alpha) {
      this.impactFlashColor = color || '#ffffff';
      this.impactFlashAlpha = Math.max(this.impactFlashAlpha, alpha || 0.16);
    }

    buildWorldContext() {
      const heroSpr =
        this.player &&
        (this.assetLoader.getCompositeHeroSprite
          ? this.assetLoader.getCompositeHeroSprite(this.player.id, this.player.equipped, 'attack0', false)
          : this.assetLoader.getHeroSprite(this.player.id, 'attack'));
      return {
        level: this.level,
        player: this.player,
        enemies: this.enemies,
        effects: this.effects,
        heroSprite: heroSpr,
        triggerShake: (m, dx, dy) => this.triggerShake(m, dx, dy),
        triggerZoomPunch: (z) => this.triggerZoomPunch(z),
        onHitEnemy: (enemy, hitOpts) => this.handleHitEnemy(enemy, hitOpts),
        onWallSplat: (enemy, splatDmg) => this.handleWallSplat && this.handleWallSplat(enemy, splatDmg),
        onWallSplatKill: (enemy) => this.rewardKilledEnemy(enemy),
        onHitPlayer: (dmg, dir, playerDebuff) => this.handleHitPlayer(dmg, dir, playerDebuff),
        onPickupDrop: (drop) => this.handlePickupDrop(drop)
      };
    }

    handleHitEnemy(enemy, hitOpts) {
      const res = enemy.receiveHit(hitOpts, this.effects);
      if (res === 'hit' || res === 'killed') {
        this.player.registerHitCombo();

        // 神品词条【三昧真火】：暴击时额外引爆魔法范围火伤并点燃目标
        if (
          hitOpts.isCrit &&
          !hitOpts.isProc &&
          this.player.equipStats &&
          this.player.equipStats.specials.samadhi_burst &&
          !enemy.dead
        ) {
          const burnDmg = Math.max(4, Math.round(this.player.magic * 0.45));
          this.effects.spawnElementalParticles(enemy.x, enemy.y - 18, 8, 'flame', { spreadX: 16, spreadY: 14 });
          enemy.receiveHit(
            {
              dmg: burnDmg,
              isCrit: false,
              isProc: true,
              knockX: 0,
              knockY: 0,
              ignoreShield: true,
              debuff: { type: 'burn', duration: 2.4, dps: Math.max(4, Math.round(burnDmg * 0.45)) },
              sourceX: this.player.x
            },
            this.effects
          );
        }

        // 【九天感电】状态联动：直接命中处于感电状态的妖魔时，向邻近另一妖魔弧光传导放电！
        if (
          !hitOpts.isProc &&
          !hitOpts._fromShock &&
          enemy.debuffs &&
          enemy.debuffs.shock &&
          enemy.debuffs.shock.timer > 0
        ) {
          for (let i = 0; i < this.enemies.length; i++) {
            const other = this.enemies[i];
            if (other !== enemy && !other.dead && Math.hypot(other.x - enemy.x, other.y - enemy.y) <= 135) {
              const arcDmg = Math.max(4, Math.round((this.player.skillPower || this.player.atk) * 0.34));
              this.effects.spawnLightningBolt(enemy.x, enemy.y - 18, other.x, other.y - 18, '#00f5d4', 2.0, 0.14);
              this.handleHitEnemy(other, {
                dmg: arcDmg,
                isCrit: false,
                isProc: true,
                _fromShock: true,
                ignoreShield: true,
                sourceX: enemy.x
              });
              break;
            }
          }
        }

        // 分级顿帧 (Hitstop) + 震屏 + 暴击镜头冲击！
        if (res === 'killed') {
          this.hitstopTimer = Math.max(this.hitstopTimer, enemy.isBoss ? 0.11 : 0.055);
          this.triggerShake(enemy.isBoss ? 14 : 6, hitOpts.knockX >= 0 ? 1 : -1, 0);
          this.triggerZoomPunch(enemy.isBoss ? 0.075 : 0.032);
          this.triggerImpactFlash(enemy.isBoss ? '#ffd166' : '#ffffff', enemy.isBoss ? 0.35 : 0.12);
          Env.vibrate(enemy.isBoss ? 'heavy' : 'medium');
          this.rewardKilledEnemy(enemy);
        } else if (hitOpts.isCrit || hitOpts.isHeavy) {
          this.hitstopTimer = Math.max(this.hitstopTimer, 0.042);
          this.triggerShake(5.5, hitOpts.knockX >= 0 ? 1 : -1, 0);
          this.triggerZoomPunch(0.025);
          this.triggerImpactFlash('#ffd60a', 0.09);
        } else {
          this.hitstopTimer = Math.max(this.hitstopTimer, 0.022);
          this.triggerShake(2.5, hitOpts.knockX >= 0 ? 1 : -1, 0);
        }
      }
    }

    spawnEquipmentDrop(x, y, sourceType) {
      if (!this.level) return null;
      const baseLv =
        1 +
        this.level.stageIndex * 2 +
        (this.level.loopCount || 0) * 4 +
        (sourceType === 'boss' ? 2 : sourceType === 'elite' ? 1 : 0);
      const item = generateEquipment(baseLv, { source: sourceType || 'mob' });
      const dropObj = {
        id: `equip_drop_${item.uid}`,
        type: 'equip_drop',
        x,
        y,
        opened: false,
        equipItem: item,
        label: `检视【${item.rarityName}·${item.name} Lv.${item.level}】`
      };
      this.level.interactables.push(dropObj);
      this.effects.spawnParticles(x, y - 14, 14, item.rarityColor, 35, 135, 0.18, 0.4, 180);
      return item;
    }

    rewardKilledEnemy(enemy) {
      this.player.onKillEnemy(this.effects, enemy);
      const greedMult = this.player.hasMutation('golden_greed') ? 1.4 : 1.0;
      const souls = Math.max(1, Math.round(enemy.souls * greedMult));
      const gold = Math.max(1, Math.round(enemy.gold * greedMult));

      const bunChance = this.player.id === 'bajie' ? 0.22 : 0.06;
      const dropBun = enemy.isElite || Math.random() < bunChance;

      this.effects.spawnLoot(enemy.x, enemy.y, souls, gold, dropBun);

      // 装备掉落判定：Boss 与精英怪 100% 爆高品装备，普通小怪 24% 爆随机词条装备！
      if (enemy.isBoss) {
        const eq = this.spawnEquipmentDrop(enemy.x - 28, this.level.bossSpawn.y, 'boss');
        if (eq) this.ui.showToast(`🌟 妖王爆出极品披挂：【${eq.rarityName}·${eq.name} Lv.${eq.level}】！`, 3.2);
      } else if (enemy.isElite) {
        this.spawnEquipmentDrop(enemy.x + 18, enemy.y, 'elite');
      } else if (Math.random() < 0.24) {
        this.spawnEquipmentDrop(enemy.x, enemy.y, 'mob');
      }

      if (enemy.isElite) {
        this.level.interactables.push({
          id: `elite_scroll_${enemy.uid}`,
          type: 'scroll',
          x: enemy.x,
          y: enemy.y,
          opened: false,
          label: '拾取精英掉落【三才天书】'
        });
        this.ui.showToast('斩杀精英妖将！掉落【三才天书】！');
      }

      if (enemy.isBoss && !this.portalSpawned) {
        this.portalSpawned = true;
        SoundFX.play('revive');
        if (this.level.tribulationNo) {
          this.saveData.clearedTribulations = this.saveData.clearedTribulations || {};
          this.saveData.clearedTribulations[this.level.tribulationNo] = true;
          this.persistSave();
        }
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
        this.ui.showToast(`🎉 妖王【${enemy.name}】伏诛！前往传送法阵破劫！`, 3.5);
      }
    }

    handleHitPlayer(dmg, dir, playerDebuff) {
      if (!this.player || this.player.dead) return 'ignored';
      const status = this.player.takeDamage(dmg, dir, this.effects, playerDebuff);
      if (playerDebuff && status !== 'ignored' && this.player.applyPlayerDebuff) {
        this.player.applyPlayerDebuff(playerDebuff, undefined, this.effects, false);
      }
      if (status === 'damaged') {
        this.hitstopTimer = Math.max(this.hitstopTimer, 0.045);
        this.triggerShake(7, dir, 0.4);
        this.triggerImpactFlash('#ff0a54', 0.22);
        if (this.player.dead) {
          this.onPlayerDied();
        }
      }
      return status;
    }

    handlePickupDrop(drop) {
      if (!this.player) return;
      SoundFX.play('pickup');
      if (drop.kind === 'soul') {
        this.player.runSouls += drop.val;
      } else if (drop.kind === 'mp') {
        this.player.restoreMp(drop.val, this.effects, false);
      } else if (drop.kind === 'gold') {
        this.player.gold += drop.val;
      } else if (drop.kind === 'bun') {
        this.player.heal(this.player.maxHp * drop.val, this.effects);
        this.ui.showToast('吃下热腾腾大包子，气血大振！', 1.5);
      }
    }

    onPlayerDied() {
      this.ui.resetTouchState();
      if (this.player.canReviveByAd()) {
        this.modal = 'DEATH_REVIVE';
      } else {
        this.finishRun(false);
      }
    }

    requestAdRevive() {
      if (!this.player) return;
      DouyinSDK.watchAdToRevive({
        characterId: this.player.id,
        stageIndex: this.level ? this.level.stageIndex : 0,
        reviveCount: this.player.reviveCount,
        onSuccess: () => {
          this.modal = null;
          const ctxBag = this.buildWorldContext();
          this.player.reviveFromAd(this.effects, this.enemies, ctxBag.onHitEnemy);
          this.triggerZoomPunch(0.06);
          this.triggerImpactFlash('#ffd166', 0.28);
          this.ui.showToast('✨ 观音甘露护体！满血复活 + 3.5秒无敌金身！', 2.8);
        },
        onCancel: (reason) => {
          this.ui.showToast(reason || '需完整观看视频才可激活观音甘露复活哦', 2.5);
        },
        onError: () => {
          this.ui.showToast('广告服务暂不可用，请稍后重试', 2.2);
        }
      });
    }

    finishRun(victory) {
      const soulsBanked = this.player ? this.player.runSouls : 0;
      if (soulsBanked > 0) {
        this.addPermanentSouls(soulsBanked);
        this.player.runSouls = 0;
      }
      if (this.level && this.level.stageIndex > (this.saveData.bestStage || 0)) {
        this.saveData.bestStage = this.level.stageIndex;
        this.persistSave();
      }

      this.runSummary = {
        victory: !!victory,
        charId: this.player.id,
        charName: this.player.charDef.name,
        stageIndex: this.level.stageIndex,
        stageName: this.level.biome.name,
        kills: this.player.totalKills,
        soulsEarned: soulsBanked,
        scrolls: Object.assign({}, this.player.scrolls)
      };

      DouyinSDK.notifyRunFinished(this.runSummary);
      this.modal = 'RUN_OVER';
    }

    triggerInteract(inter) {
      if (!inter || inter.opened) return;

      if (inter.type === 'scroll') {
        inter.opened = true;
        SoundFX.play('scroll');
        this.ui.resetTouchState();
        this.modal = 'SCROLL_PICK';
      } else if (inter.type === 'chest') {
        inter.opened = true;
        SoundFX.play('scroll');
        const banished = new Set((this.saveData && this.saveData.banishedIds) || []);
        let wDef = getSubWeaponById(inter.weaponId);
        if (banished.has(wDef.id)) {
          const validW = SUB_WEAPONS.filter((w) => !banished.has(w.id));
          if (validW.length) wDef = validW[Math.floor(Math.random() * validW.length)];
        }
        this.player.subWeapon = wDef.id;
        this.player.subWeaponCdTimer = 0;
        this.player.recalcStats(false);
        this.effects.spawnParticles(inter.x, inter.y - 12, 18, wDef.color, 40, 160, 0.2, 0.4, 200);
        if (Math.random() < 0.7) {
          this.spawnEquipmentDrop(inter.x + 22, inter.y, 'chest');
        }
        this.ui.showToast(`获得西游法宝副武：【${wDef.name}】（右侧法宝键释放）！`, 3.0);
      } else if (inter.type === 'equip_chest') {
        inter.opened = true;
        SoundFX.play('scroll');
        const eq = this.spawnEquipmentDrop(inter.x + 14, inter.y, inter.sourceType || 'chest');
        if (eq) {
          this.ui.showToast(`宝匣开启！掉落【${eq.rarityName}·${eq.name} Lv.${eq.level}】！`, 2.6);
        }
      } else if (inter.type === 'equip_drop') {
        SoundFX.play('uiClick');
        this.ui.resetTouchState();
        this.pendingEquipDrop = inter;
        this.modal = 'EQUIP_COMPARE';
      } else if (inter.type === 'ad_relic_chest') {
        DouyinSDK.showRewardedAd({
          placement: 'starter_weapon',
          adUnitId: SDK_CONFIG.adUnitIds.rewardedStarterWeapon,
          mockTitle: '【抖音激励视频预留接口】开启仙缘法宝盲盒',
          onSuccess: () => {
            inter.opened = true;
            const banished = new Set((this.saveData && this.saveData.banishedIds) || []);
            const validW = SUB_WEAPONS.filter((w) => !banished.has(w.id));
            const wPool = validW.length ? validW : SUB_WEAPONS;
            const pickW = wPool[Math.floor(Math.random() * wPool.length)];
            this.player.subWeapon = pickW.id;
            this.player.subWeaponCdTimer = 0;
            this.player.recalcStats(false);
            SoundFX.play('revive');
            this.effects.spawnParticles(inter.x, inter.y - 14, 22, '#ffd166', 45, 190, 0.2, 0.45, 180);
            this.ui.showToast(`🎁 仙缘开启！获得法宝【${pickW.name}】！`, 3.0);
          },
          onCancel: (msg) => this.ui.showToast(msg)
        });
      } else if (inter.type === 'portal') {
        inter.opened = true;
        this.ui.resetTouchState();

        const maxRunStages = Math.max(6, (this.runRoute && this.runRoute.length) || 6);
        if (this.level.tribulationNo >= 81 || this.level.stageIndex >= maxRunStages - 1) {
          this.player.runSouls += 60;
          this.finishRun(true);
          return;
        }

        if (this.player.runSouls > 0) {
          this.addPermanentSouls(this.player.runSouls);
          this.player.runSouls = 0;
        }
        this.player.hp = this.player.maxHp;
        this.player.flaskCharges = this.player.maxFlaskCharges;

        DouyinSDK.showInterstitialAd();

        // 仅在未挂载司命曲线导演时生成旧版备用路由门；挂载司命系统后统一由 PORTAL_CHOICE 选门
        if (!this.runBlueprint) {
          this.nextRouteDoors = TerrainRegions.rollNextTribulationDoors(this.level.tribulationNo || 1);
          this.selectedNextTribNo = this.nextRouteDoors[0] ? this.nextRouteDoors[0].no : null;
        } else {
          this.nextRouteDoors = [];
          this.selectedNextTribNo = null;
        }

        const banished = new Set((this.saveData && this.saveData.banishedIds) || []);
        const unbanished = MUTATIONS.filter((m) => !this.player.hasMutation(m.id) && !banished.has(m.id));
        const unowned = MUTATIONS.filter((m) => !this.player.hasMutation(m.id));
        const source = unbanished.length > 0 ? unbanished.slice() : unowned.length > 0 ? unowned.slice() : MUTATIONS.slice();
        source.sort(() => Math.random() - 0.5);
        this.stageMutationChoices = source.slice(0, 3);
        this.modal = 'STAGE_CLEAR';
      }
    }

    equipPendingItem() {
      const drop = this.pendingEquipDrop;
      if (!drop || drop.opened || !this.player) {
        this.modal = null;
        return;
      }
      const newItem = drop.equipItem;
      drop.opened = true;
      const oldItem = this.player.equipItem(newItem);
      this.pendingEquipDrop = null;
      this.modal = null;

      SoundFX.play('revive');
      this.triggerZoomPunch(0.035);
      this.effects.spawnParticles(this.player.x, this.player.y - 18, 20, newItem.rarityColor, 40, 165, 0.18, 0.4, 150);

      if (oldItem) {
        const goldGain = oldItem.recycleGold || 20;
        this.player.gold += goldGain;
        this.ui.showToast(`已装备【${newItem.rarityName}·${newItem.name}】！旧装备自动炼化 +${goldGain} 金铢`, 2.8);
      } else {
        this.ui.showToast(`已穿戴【${newItem.rarityName}·${newItem.name} Lv.${newItem.level}】，战力暴涨！`, 2.6);
      }
    }

    recyclePendingItem() {
      const drop = this.pendingEquipDrop;
      if (!drop || drop.opened || !this.player) {
        this.modal = null;
        return;
      }
      const item = drop.equipItem;
      drop.opened = true;
      this.pendingEquipDrop = null;
      this.modal = null;

      const goldGain = item.recycleGold || 20;
      this.player.gold += goldGain;
      this.player.restoreMp(25, this.effects, true);
      SoundFX.play('pickup');
      this.effects.spawnParticles(drop.x, drop.y - 14, 14, '#ffd60a', 30, 130, 0.15, 0.35, 180);
      this.ui.showToast(`♻ 炼化分解成功！获得 +${goldGain} 功德金铢 & +25 蓝量`, 2.4);
    }

    reforgePendingItemByAd() {
      const drop = this.pendingEquipDrop;
      if (!drop || drop.opened || !drop.equipItem) return;
      DouyinSDK.showRewardedAd({
        placement: 'reforge_equip',
        adUnitId: SDK_CONFIG.adUnitIds.rewardedBonusResource,
        mockTitle: '【抖音激励视频预留接口】兜率宫八卦炉 · 装备升品重铸',
        onSuccess: () => {
          drop.equipItem = upgradeEquipmentRarity(drop.equipItem);
          drop.label = `检视【${drop.equipItem.rarityName}·${drop.equipItem.name} Lv.${drop.equipItem.level}】`;
          SoundFX.play('revive');
          this.ui.showToast(`🔥 仙炉淬炼成功！品质跃升为【${drop.equipItem.rarityName} Lv.${drop.equipItem.level}】！`, 2.8);
        },
        onCancel: (msg) => this.ui.showToast(msg)
      });
    }

    applyScrollChoice(scrollId) {
      if (!this.player) return;
      this.player.scrolls[scrollId] = (this.player.scrolls[scrollId] || 1) + 1;
      this.player.recalcStats(false);
      this.modal = null;
      SoundFX.play('revive');
      this.triggerZoomPunch(0.04);
      this.effects.spawnParticles(this.player.x, this.player.y - 18, 22, '#ffd166', 45, 175, 0.2, 0.42, 150);
      this.ui.showToast(`修为大涨！当前三才：斗${this.player.scrolls.red} · 妙${this.player.scrolls.purple} · 金${this.player.scrolls.green}`);
    }

    selectMutationAndAdvance(mutId) {
      if (this.player && !this.player.hasMutation(mutId)) {
        this.player.mutations.push(mutId);
        this.player.recalcStats(true);
      }
      this.modal = null;
      const nextIdx = this.level.stageIndex + 1;
      const nextOpts = this.selectedNextTribNo ? { tribulationNo: this.selectedNextTribNo } : undefined;
      this.enterStage(nextIdx, this.level.loopCount, nextOpts);
      this.ui.showToast(`踏入 ${this.level.biome.name}！`, 2.6);
    }

    // ==================== 主循环更新 ====================
    tick(dt) {
      this.globalTime += dt;
      this.ui.update(dt, this);
      DouyinSDK.updateMockAd(dt);

      if (DouyinSDK.mockAdState.active) {
        return;
      }

      if (this.state !== 'PLAYING' || this.modal) {
        return;
      }

      // 镜头推拉与闪屏平滑衰减
      if (this.shakeMag > 0) {
        this.shakeMag = Math.max(0, this.shakeMag - dt * 34);
      }
      if (this.zoomPunch > 0) {
        this.zoomPunch = Math.max(0, this.zoomPunch - dt * 0.26);
      }
      if (this.impactFlashAlpha > 0) {
        this.impactFlashAlpha = Math.max(0, this.impactFlashAlpha - dt * 1.8);
      }

      // 手机端按住【普攻】圆钮或键盘按住 J 键支持自动流畅衔接三连招！
      if ((this.ui.isActionPressed('attack') || this.keys['KeyJ']) && this.player && !this.player.dead) {
        const inp = this.getMoveInput();
        this.player.tryPrimaryAttack(inp.moveX);
      }

      if (this.stageBannerTimer > 0) {
        this.stageBannerTimer = Math.max(0, this.stageBannerTimer - dt);
      }

      if (this.hitstopTimer > 0) {
        this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
        return;
      }

      // 更新本地区独立地形动态机关（流沙河浮筏/通天浮冰/危岩崩落重组/黄风三昧狂沙）
      updateLevelMechanics(this.level, dt);

      const inp = this.getMoveInput();
      const ctxBag = this.buildWorldContext();

      this.player.update(dt, inp, ctxBag);

      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (!e.dead) {
          e.update(dt, ctxBag);
        }
      }

      this.effects.update(dt, ctxBag);

      this.nearbyInteractable = null;
      let bestDist = 42;
      for (let i = 0; i < this.level.interactables.length; i++) {
        const it = this.level.interactables[i];
        if (it.opened) continue;
        const d = Math.hypot(this.player.x - it.x, this.player.y - it.y);
        if (d < bestDist) {
          bestDist = d;
          this.nearbyInteractable = it;
        }
      }

      const lookAhead = this.player.dir * 40;
      const targetCamX = this.player.x + lookAhead - this.worldW * 0.46;
      const targetCamY = this.player.y - this.worldH * 0.66;
      this.camX += (targetCamX - this.camX) * Math.min(1, dt * 8.5);
      this.camY += (targetCamY - this.camY) * Math.min(1, dt * 7.0);

      this.camX = Math.max(0, Math.min(this.level.widthPx - this.worldW, this.camX));
      this.camY = Math.max(0, Math.min(this.level.heightPx - this.worldH, this.camY));
    }

    // ==================== 双层像素+UI渲染管线（支持自动横屏旋转与镜头推拉冲击） ====================
    render() {
      const ctx = this.ctx;
      if (!ctx) return;

      ctx.save();
      ctx.scale(this.dpr, this.dpr);

      // 若手机处于竖屏锁定状态，顺时针旋转 90° 满屏横版渲染！
      if (this.rotatedPortrait) {
        ctx.translate(this.rawW, 0);
        ctx.rotate(Math.PI / 2);
      }

      if (this.state === 'TITLE') {
        this.ui.renderTitleScreen(ctx, this.screenW, this.screenH, this);
        ctx.restore();
        return;
      }

      // 1. 渲染 360p 硬边缘像素世界
      this.renderPixelWorld(this.worldCtx);

      // 2. 应用暴击/下砸镜头瞬推冲击 (Zoom Punch) 绘制到主画布
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (this.zoomPunch > 0.001) {
        const z = 1 + this.zoomPunch;
        ctx.translate(this.screenW / 2, this.screenH / 2);
        ctx.scale(z, z);
        ctx.translate(-this.screenW / 2, -this.screenH / 2);
      }
      ctx.drawImage(this.worldCanvas, 0, 0, this.screenW, this.screenH);
      ctx.restore();

      // 2B. 柔和电影级四周暗角衬托层（让前景 HUD 与角色光效在亮色地形上更通透醒目）
      ctx.save();
      const vig = ctx.createRadialGradient(
        this.screenW / 2,
        this.screenH / 2,
        this.screenH * 0.38,
        this.screenW / 2,
        this.screenH / 2,
        Math.max(this.screenW, this.screenH) * 0.72
      );
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(1, 'rgba(6, 4, 14, 0.34)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, this.screenW, this.screenH);
      ctx.restore();

      // 3. 受击/暴击/斩杀瞬时微闪屏滤镜
      if (this.impactFlashAlpha > 0.005) {
        ctx.save();
        ctx.globalAlpha = this.impactFlashAlpha;
        ctx.fillStyle = this.impactFlashColor;
        ctx.fillRect(0, 0, this.screenW, this.screenH);
        ctx.restore();
      }

      // 4. 高分屏飘字与触控 HUD
      const scaleX = this.screenW / this.worldW;
      const scaleY = this.screenH / this.worldH;
      this.effects.renderScreenTexts(ctx, this.camX, this.camY, scaleX, scaleY);
      this.ui.renderCombatUI(ctx, this.screenW, this.screenH, this);

      ctx.restore();
    }

    renderPixelWorld(wctx) {
      if (!wctx || !this.level) return;
      const ww = this.worldW;
      const wh = this.worldH;
      const biome = this.level.biome;

      let shakeX = 0;
      let shakeY = 0;
      if (this.shakeMag > 0) {
        const osc = Math.cos(this.globalTime * 58);
        shakeX = Math.round((this.shakeBiasX * 0.65 * osc + (Math.random() - 0.5) * 1.2) * this.shakeMag);
        shakeY = Math.round((this.shakeBiasY * 0.65 * osc + (Math.random() - 0.5) * 1.2) * this.shakeMag);
      }
      const camX = Math.round(this.camX + shakeX);
      const camY = Math.round(this.camY + shakeY);

      const wScale = this.worldPixelScale || 2;
      wctx.save();
      wctx.setTransform(wScale, 0, 0, wScale, 0, 0);
      wctx.imageSmoothingEnabled = false;
      const region = this.level.region || biome;

      // 1~4. 十二大独立地域专属视差天幕、地标装饰、十大机关瓦片与移动浮筏/祥云渲染！
      TerrainRenderer.renderBackdrop(wctx, ww, wh, camX, this.globalTime, region, this.level);
      TerrainRenderer.renderDecors(wctx, this.level, camX, camY, ww, this.globalTime, region);
      TerrainRenderer.renderTiles(wctx, this.level, camX, camY, ww, wh, this.globalTime, region);
      TerrainRenderer.renderMovingPlatforms(wctx, this.level, camX, camY, ww, region);

      // 5. 可交互物件
      const floatY = Math.round(Math.sin(this.globalTime * 4.5) * 3);
      for (let i = 0; i < this.level.interactables.length; i++) {
        const it = this.level.interactables[i];
        const ix = Math.round(it.x - camX);
        const iy = Math.round(it.y - camY);
        if (ix < -50 || ix > ww + 50) continue;

        if (it.type === 'chest' || it.type === 'ad_relic_chest' || it.type === 'equip_chest') {
          if (!it.opened) {
            wctx.save();
            const chestGlow = it.type === 'equip_chest' ? '#69f0ae' : it.type === 'ad_relic_chest' ? '#ffd166' : '#c77dff';
            wctx.globalAlpha = 0.18 + Math.sin(this.globalTime * 5) * 0.05;
            wctx.fillStyle = chestGlow;
            wctx.beginPath();
            wctx.arc(ix, iy - 10, 18, 0, Math.PI * 2);
            wctx.fill();
            wctx.restore();
          }
          const spr = this.assetLoader.getPropSprite(it.opened ? 'chestOpen' : 'chestClosed');
          if (spr) {
            const lw = spr._logicalW || spr.width;
            const lh = spr._logicalH || spr.height;
            wctx.drawImage(spr, ix - lw / 2, iy - lh, lw, lh);
          }
          if ((it.type === 'ad_relic_chest' || it.type === 'equip_chest') && !it.opened) {
            const cCol = it.type === 'equip_chest' ? '#69f0ae' : '#ffd166';
            wctx.fillStyle = cCol;
            wctx.fillRect(ix - 2, iy - 25 + floatY, 4, 4);
            wctx.fillRect(ix - 5, iy - 23 + floatY, 10, 2);
          }
        } else if (it.type === 'equip_drop' && !it.opened && it.equipItem) {
          // 地面掉落装备：绘制冲天品质光柱 + 发光底座 + 悬浮 16-bit 装备像素图标！
          const eq = it.equipItem;
          wctx.save();
          // 品质光柱（品质越高光柱越高越璀璨）
          const beamH = 26 + eq.rarityIndex * 11;
          wctx.globalAlpha = 0.22 + eq.rarityIndex * 0.08 + Math.sin(this.globalTime * 7) * 0.06;
          wctx.fillStyle = eq.rarityColor;
          wctx.fillRect(ix - 6, iy - beamH, 12, beamH);
          wctx.globalAlpha = 0.55;
          wctx.fillRect(ix - 2, iy - beamH - 6, 4, beamH + 6);

          // 地面光圈
          wctx.globalAlpha = 0.85;
          wctx.fillStyle = eq.rarityColor;
          wctx.fillRect(ix - 9, iy - 3, 18, 3);

          // 装备像素图标悬浮展示
          wctx.globalAlpha = 1;
          const eqSpr = this.assetLoader.getEquipSprite(eq.iconKey, false);
          if (eqSpr) {
            wctx.drawImage(eqSpr, ix - Math.round(eqSpr.width / 2), iy - eqSpr.height - 6 + floatY);
          }
          wctx.restore();
        } else if (it.type === 'scroll' && !it.opened) {
          // 三才天书祭台：双层雕花石座 + 冲天金霞光柱 + 悬浮卷轴
          wctx.save();
          wctx.globalAlpha = 0.18 + Math.sin(this.globalTime * 6) * 0.05;
          wctx.fillStyle = '#ffd166';
          wctx.fillRect(ix - 7, iy - 38, 14, 34);
          wctx.restore();

          wctx.fillStyle = '#3d405b';
          wctx.fillRect(ix - 13, iy - 4, 26, 4);
          wctx.fillStyle = '#5c677d';
          wctx.fillRect(ix - 10, iy - 8, 20, 4);
          wctx.fillStyle = '#ffd166';
          wctx.fillRect(ix - 8, iy - 9, 16, 2);

          const spr = this.assetLoader.getPropSprite('scroll');
          if (spr) {
            const lw = spr._logicalW || spr.width;
            const lh = spr._logicalH || spr.height;
            wctx.drawImage(spr, ix - lw / 2, iy - 25 + floatY, lw, lh);
          }
        } else if (it.type === 'karmic_event') {
          // 西游因果奇遇祭坛：青石莲花道台 + 仙光法环 + 悬浮仙缘信物
          wctx.save();
          // 莲花青石基座
          wctx.fillStyle = '#3d405b';
          wctx.fillRect(ix - 15, iy - 5, 30, 5);
          wctx.fillStyle = '#5c677d';
          wctx.fillRect(ix - 12, iy - 9, 24, 4);
          wctx.fillStyle = it.opened ? '#495057' : '#ffd166';
          wctx.fillRect(ix - 10, iy - 10, 20, 2);

          if (!it.opened) {
            const evId = (it.eventDef && it.eventDef.id) || '';
            const auraCol =
              evId === 'evt_ginseng_tree'
                ? '#69f0ae'
                : evId === 'evt_laozi_furnace'
                  ? '#ff6e40'
                  : evId === 'evt_six_ear_mirror'
                    ? '#c77dff'
                    : '#00f5d4';

            // 冲天仙缘柔和光柱
            wctx.globalAlpha = 0.2 + Math.sin(this.globalTime * 5) * 0.06;
            wctx.fillStyle = auraCol;
            wctx.fillRect(ix - 9, iy - 48, 18, 38);

            // 背后旋转感法环
            wctx.globalAlpha = 0.85;
            wctx.strokeStyle = auraCol;
            wctx.lineWidth = 1.5;
            wctx.beginPath();
            wctx.arc(ix, iy - 25 + floatY, 11 + Math.sin(this.globalTime * 6) * 1.5, 0, Math.PI * 2);
            wctx.stroke();

            // 中央像素仙缘宝物（人参仙果 / 八卦丹炉 / 宝镜 / 净瓶）
            const cy = iy - 25 + floatY;
            wctx.fillStyle = '#ffd166';
            wctx.fillRect(ix - 5, cy - 6, 10, 12);
            wctx.fillStyle = auraCol;
            wctx.fillRect(ix - 4, cy - 4, 8, 8);
            wctx.fillStyle = '#ffffff';
            wctx.fillRect(ix - 2, cy - 3, 3, 3);

            // 环绕上升灵尘
            for (let m = 0; m < 3; m++) {
              const phase = this.globalTime * 2.8 + m * 2.1;
              const mxOff = Math.round(Math.sin(phase) * 11);
              const myOff = Math.round(((phase * 9) % 26));
              wctx.fillStyle = m % 2 === 0 ? '#ffd166' : auraCol;
              wctx.fillRect(ix + mxOff, iy - 12 - myOff, 2, 2);
            }
          }
          wctx.restore();
        } else if (it.type === 'portal' && !it.opened) {
          wctx.save();
          // 传送门青石底座与灵光星点
          wctx.fillStyle = '#3d405b';
          wctx.fillRect(ix - 18, iy - 4, 36, 4);
          wctx.fillStyle = '#00f5d4';
          wctx.fillRect(ix - 14, iy - 5, 28, 2);

          wctx.strokeStyle = '#00f5d4';
          wctx.lineWidth = 3;
          wctx.beginPath();
          wctx.ellipse(ix, iy - 26, 16, 24, 0, 0, Math.PI * 2);
          wctx.stroke();
          wctx.fillStyle = 'rgba(114, 9, 183, 0.62)';
          wctx.fill();
          wctx.strokeStyle = '#ffd166';
          wctx.lineWidth = 1.5;
          wctx.beginPath();
          wctx.ellipse(ix, iy - 26, 8 + Math.sin(this.globalTime * 8) * 2, 16, 0, 0, Math.PI * 2);
          wctx.stroke();
          wctx.fillStyle = '#ffffff';
          wctx.fillRect(ix - 2, iy - 30, 4, 8);
          wctx.restore();
        }

        // 靠近可交互物时，在世界空间头顶渲染跳动金色指引箭标，视觉指向极清晰！
        if (this.nearbyInteractable === it && !it.opened) {
          const arrowY = iy - 40 + floatY;
          wctx.fillStyle = '#ffd166';
          wctx.beginPath();
          wctx.moveTo(ix - 4, arrowY - 5);
          wctx.lineTo(ix + 4, arrowY - 5);
          wctx.lineTo(ix, arrowY);
          wctx.closePath();
          wctx.fill();
        }
      }

      // 5B. 贴地底层状态残留（坑痕、残留火海、雷网、金莲净土阵、玄水漩涡位于实体脚下！）
      this.effects.renderUnderlay(wctx, camX, camY);

      // 6. 妖魔与 Boss
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (!e.dead && e.x - camX > -80 && e.x - camX < ww + 80) {
          e.render(wctx, camX, camY, this.assetLoader);
        }
      }

      // 7. 主角
      if (this.player && !this.player.dead) {
        this.player.render(wctx, camX, camY, this.assetLoader);
      }

      // 8. 刀光、投射物、弹跳碎块、元素粒子、闪电链与受击十字星闪
      this.effects.renderWorld(wctx, camX, camY, this.assetLoader, true);

      // 9. 地域环境风雪/沙暴/海眼气泡/金莲微粒
      TerrainRenderer.renderAmbientParticles(wctx, ww, wh, this.globalTime, region, this.ambientDots);
      wctx.restore();
    }
  }

  return {
    GameApp
  };
});
