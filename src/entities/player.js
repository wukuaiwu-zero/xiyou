/**
 * 玩家动作角色控制器 (src/entities/player.js)
 * 全面升级版：
 * 1. 五大本命神通与六大法宝粒子特效、法器虚影及战场状态残留（火海/雷痕/金莲净土/玄水池/裂地坑）
 * 2. 主角实时 Buff 与负面 Debuff 状态机及环身动效（护体金莲/金刚护盾/斗战气焰/佛国净土/蛛网缠足/奇毒侵蚀）
 * 3. 120ms 预输入缓冲 + 多帧连续扫掠打击判定 + 近身智能转向 + 兵刃锋芒甜区 + 挥砍弹反敌方弹幕
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
})('player', function (require) {
  const { getCharacterById } = require('../config/characters');
  const { getSubWeaponById } = require('../config/weapons');
  const { computeEquipmentTotals, generateEquipment } = require('../config/equipment');
  const SDK_CONFIG = require('../config/sdkConfig');
  const { moveAndCollide, TILE_SOLID, getTileAtPx } = require('../world/levelGen');
  const { snapToGroundY } = require('./effects');
  const SoundFX = require('../audio/soundFX');
  const Env = require('../platform/env');
  let HeroModelEngine = null;
  try {
    HeroModelEngine = require('../assets/heroModelEngine');
  } catch (e) {
    HeroModelEngine = null;
  }

  const GRAVITY = 1220;

  class Player {
    constructor(charId, metaLevels, existingBuild) {
      this.charDef = getCharacterById(charId);
      this.id = this.charDef.id;
      this.width = 20;
      this.height = 34;

      this.x = 140;
      this.y = 300;
      this.vx = 0;
      this.vy = 0;
      this.dir = 1;
      this.onGround = false;
      this.standingOnOneWay = false;
      this.onIce = false;
      this.inQuicksand = false;
      this.coyoteTimer = 0;
      this.dropThroughTimer = 0;
      this.inHazard = false;
      this.hazardTick = 0;

      // 挤压拉伸弹性形变
      this.scaleX = 1;
      this.scaleY = 1;
      this.runDustTick = 0;

      const meta = metaLevels || {};
      this.metaHpBonus = (meta.hp_lv || 0) * 12;
      this.metaAtkMult = 1 + (meta.atk_lv || 0) * 0.08;
      this.metaFlaskBonus = (meta.flask_lv || 0) * 0.06;
      this.metaCritBonus = (meta.crit_lv || 0) * 0.03;

      if (existingBuild) {
        this.scrolls = Object.assign({ red: 1, purple: 1, green: 1 }, existingBuild.scrolls);
        this.mutations = (existingBuild.mutations || []).slice();
        this.subWeapon = existingBuild.subWeapon || null;
        this.equipped = Object.assign({ weapon: null, helm: null, armor: null, boots: null, accessory: null }, existingBuild.equipped);
        this.reviveCount = existingBuild.reviveCount || 0;
        this.gold = existingBuild.gold || 0;
        this.runSouls = existingBuild.runSouls || 0;
        this.totalKills = existingBuild.totalKills || 0;
      } else {
        this.scrolls = { red: 1, purple: 1, green: 1 };
        this.mutations = [];
        this.subWeapon = null;
        this.equipped = {
          weapon: generateEquipment(1, { slot: 'weapon', forceRarityIndex: 0 }),
          helm: null,
          armor: null,
          boots: null,
          accessory: null
        };
        this.reviveCount = 0;
        this.gold = 0;
        this.runSouls = 0;
        this.totalKills = 0;
      }

      this.recalcStats(true);

      this.jumpsLeft = this.maxJumps;
      this.rollTimer = 0;
      this.rollCdTimer = 0;
      this.isGroundSmashing = false;

      // 多帧连续挥砍判定与 120ms 动作预输入缓冲
      this.comboIndex = 0;
      this.comboResetTimer = 0;
      this.attackTimer = 0;
      this.attackDuration = 0;
      this.attackHitDone = false;
      this.attackSlashSpawned = false;
      this.attackLandedAny = false;
      this.attackHitIds = {};
      this.attackStartX = this.x;
      this.currentAttackSpec = null;
      this.currentComboStep = 0;
      this.inputBuffer = null; // { act, moveDir, downHeld, timer }

      this.skillCdTimer = 0;
      this.activeSkillTimer = 0;
      this.activeSkillTick = 0;
      this.subWeaponCdTimer = 0;

      // 连斩计数与战意气焰
      this.hitStreak = 0;
      this.hitStreakTimer = 0;

      // 主角增益 Buff 与负面 Debuff 状态计时器
      this.shieldHp = 0;
      this.invulnTimer = 0;
      this.reviveAuraTimer = 0;
      this.hurtFlashTimer = 0;
      this.lotusBuffTimer = 0;
      this.sanctuaryBuffTimer = 0; // 金莲佛国净土驻留增益
      this.webSlowTimer = 0;       // 盘丝蛛网缠足减速（翻滚可立即挣脱）
      this.poisonTimer = 0;        // 奇毒侵蚀持续微伤（饮甘露立即净化）
      this.poisonTick = 0.6;
      this.singeTimer = 0;         // 余烬灼身视觉残留
      this.statusAuraTick = 0;

      this.purifyCounter = 0;
      this.animTimer = 0;
      this.afterimageTick = 0;
      this.dead = false;
    }

    hasMutation(mutId) {
      return this.mutations.indexOf(mutId) !== -1;
    }

    triggerSquash(sx, sy) {
      this.scaleX = sx;
      this.scaleY = sy;
    }

    queueBufferedInput(act, moveDir, downHeld) {
      this.inputBuffer = {
        act,
        moveDir: moveDir || 0,
        downHeld: !!downHeld,
        timer: 0.13
      };
    }

    /**
     * 对主角施加可反制的环境/弹幕负面状态（蛛网缠足 / 奇毒侵蚀 / 余烬灼身）
     */
    applyPlayerDebuff(type, duration, effects, silent) {
      if (this.dead) return;
      if (type === 'web') {
        const wasActive = this.webSlowTimer > 0.1;
        this.webSlowTimer = Math.max(this.webSlowTimer, duration || 1.6);
        if (!wasActive && !silent && effects) {
          effects.spawnFloatingText(this.x, this.y - 42, '🕸蛛网缠足! (翻滚挣脱)', '#f72585', false);
        }
      } else if (type === 'poison') {
        const wasActive = this.poisonTimer > 0.1;
        this.poisonTimer = Math.max(this.poisonTimer, duration || 2.4);
        if (!wasActive && !silent && effects) {
          effects.spawnFloatingText(this.x, this.y - 42, '☠奇毒侵蚀!', '#80ed99', false);
        }
      } else if (type === 'singe') {
        this.singeTimer = Math.max(this.singeTimer, duration || 1.1);
      }
    }

    /**
     * 汇总主角当前激活的 Buff 与 Debuff 列表供左上角 HUD 实时渲染
     */
    getActiveStatusList() {
      const list = [];
      if (this.reviveAuraTimer > 0) {
        list.push({
          id: 'revive_gold',
          label: `✨金身 ${this.reviveAuraTimer.toFixed(1)}s`,
          color: '#ffd166',
          isDebuff: false,
          ratio: Math.min(1, this.reviveAuraTimer / 3.5)
        });
      }
      if (this.shieldHp > 0) {
        list.push({
          id: 'shield',
          label: `🛡护盾 +${this.shieldHp}`,
          color: '#80ffdb',
          isDebuff: false,
          ratio: Math.min(1, this.shieldHp / Math.max(1, this.maxHp * 0.3))
        });
      }
      if (this.lotusBuffTimer > 0) {
        list.push({
          id: 'lotus_buff',
          label: `🪷金莲 ${this.lotusBuffTimer.toFixed(1)}s`,
          color: '#69f0ae',
          isDebuff: false,
          ratio: Math.min(1, this.lotusBuffTimer / 4.0)
        });
      }
      if (this.sanctuaryBuffTimer > 0) {
        list.push({
          id: 'sanctuary',
          label: '☸佛国回灵',
          color: '#ffd166',
          isDebuff: false,
          ratio: 1
        });
      }
      if (this.activeSkillTimer > 0) {
        list.push({
          id: 'skill_active',
          label: this.id === 'bajie' ? '🌪霸体旋风' : '⚡神通真身',
          color: this.charDef.themeColor,
          isDebuff: false,
          ratio: Math.min(1, this.activeSkillTimer / Math.max(0.3, this.charDef.skill.duration || 1))
        });
      }
      if (this.hitStreak >= 8 && this.hitStreakTimer > 0) {
        const bonusPct = Math.min(15, Math.round(this.hitStreak * 0.8));
        list.push({
          id: 'frenzy',
          label: `🔥战意 +${bonusPct}%`,
          color: '#ff9f1c',
          isDebuff: false,
          ratio: Math.min(1, this.hitStreakTimer / 3.2)
        });
      }
      if (this.webSlowTimer > 0) {
        list.push({
          id: 'web',
          label: `🕸缠足 ${this.webSlowTimer.toFixed(1)}s`,
          color: '#f72585',
          isDebuff: true,
          ratio: Math.min(1, this.webSlowTimer / 1.8)
        });
      }
      if (this.poisonTimer > 0) {
        list.push({
          id: 'poison',
          label: `☠中毒 ${this.poisonTimer.toFixed(1)}s`,
          color: '#80ed99',
          isDebuff: true,
          ratio: Math.min(1, this.poisonTimer / 2.4)
        });
      }
      if (this.inQuicksand) {
        list.push({
          id: 'quicksand',
          label: '⏳流沙陷足',
          color: '#e9c46a',
          isDebuff: true,
          ratio: 1
        });
      }
      return list;
    }

    recalcStats(fullHeal) {
      const base = this.charDef.stats;
      const eq = computeEquipmentTotals(this.equipped);
      this.equipStats = eq;

      const r = this.scrolls.red - 1;
      const p = this.scrolls.purple - 1;
      const g = this.scrolls.green - 1;

      const hpMult = 1 + r * 0.11 + p * 0.08 + g * 0.24;
      const prevMaxHp = this.maxHp || base.maxHp;
      this.maxHp = Math.round((base.maxHp + this.metaHpBonus + eq.maxHp) * hpMult);

      const prevMaxMp = this.maxMp || base.maxMp || 100;
      this.maxMp = Math.round((base.maxMp || 100) + eq.maxMp + p * 14);
      this.mpRegen = Math.round(((base.mpRegen || 7) + eq.mpRegen + p * 0.8) * 10) / 10;
      this.mpOnHit = 4 + eq.mpOnHit;

      this.atk = Math.round((base.atk * this.metaAtkMult + eq.atkFlat) * (1 + eq.atkPct) * (1 + r * 0.18 + p * 0.07 + g * 0.09));
      this.magic = Math.round(((base.magic || 20) + eq.magicFlat) * (1 + eq.magicPct) * (1 + r * 0.05 + p * 0.22 + g * 0.06));
      this.skillPower = this.magic * 0.78 + this.atk * 0.42;

      this.armor = Math.round((base.armor || 15) + eq.defFlat + g * 9);
      const armorMit = this.armor / (this.armor + 120);
      const vajraBonus = eq.specials.vajra_ward ? 0.06 : 0;
      this.defense = Math.min(0.75, base.defense + g * 0.025 + armorMit + vajraBonus);

      this.cdReduction = Math.min(0.55, p * 0.06 + eq.cdr);
      this.critRate = Math.min(
        0.92,
        base.critRate + this.metaCritBonus + eq.critRate + (this.hasMutation('crit_frenzy') ? 0.12 : 0)
      );
      this.critMult = Math.round((base.critMult + eq.critDmg) * 100) / 100;
      this.moveSpeed = base.moveSpeed;
      this.jumpForce = base.jumpForce;
      this.maxJumps = base.maxJumps;
      this.maxFlaskCharges = base.flaskCharges;

      if (fullHeal) {
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        this.flaskCharges = this.maxFlaskCharges;
      } else {
        const diffHp = Math.max(0, this.maxHp - prevMaxHp);
        this.hp = Math.min(this.maxHp, (this.hp || this.maxHp) + diffHp);
        const diffMp = Math.max(0, this.maxMp - prevMaxMp);
        this.mp = Math.min(this.maxMp, (this.mp !== undefined ? this.mp : this.maxMp) + diffMp);
      }
    }

    equipItem(newItem) {
      if (!newItem || !newItem.slot) return null;
      const prev = this.equipped[newItem.slot] || null;
      this.equipped[newItem.slot] = newItem;
      this.recalcStats(false);
      return prev;
    }

    restoreMp(amount, effects, showText) {
      if (this.dead || amount <= 0) return;
      const before = this.mp;
      this.mp = Math.min(this.maxMp, Math.round((this.mp + amount) * 10) / 10);
      const gained = Math.round(this.mp - before);
      if (showText && gained > 0 && effects) {
        effects.spawnFloatingText(this.x, this.y - 34, `+${gained} 蓝`, '#4cc9f0', false);
      }
    }

    spendMp(cost, effects) {
      if (this.mp >= cost) {
        this.mp = Math.max(0, Math.round((this.mp - cost) * 10) / 10);
        return true;
      }
      effects && effects.spawnFloatingText(this.x, this.y - 38, `蓝量不足 (${Math.floor(this.mp)}/${cost})`, '#4cc9f0', false);
      SoundFX.play('uiClick');
      return false;
    }

    exportBuildState() {
      return {
        scrolls: Object.assign({}, this.scrolls),
        mutations: this.mutations.slice(),
        subWeapon: this.subWeapon,
        equipped: Object.assign({}, this.equipped),
        reviveCount: this.reviveCount,
        gold: this.gold,
        runSouls: this.runSouls,
        totalKills: this.totalKills
      };
    }

    placeAt(x, y) {
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.isGroundSmashing = false;
      this.inputBuffer = null;
    }

    rollDamage(baseDmg, forceCrit) {
      const isCrit = forceCrit || Math.random() < this.critRate;
      const streakBonus = 1 + Math.min(0.15, this.hitStreak * 0.008);
      let val = baseDmg * streakBonus * (0.94 + Math.random() * 0.12);
      if (this.lotusBuffTimer > 0) val *= 1.25;
      if (isCrit) val *= this.critMult;
      return { dmg: Math.max(1, Math.round(val)), isCrit };
    }

    registerHitCombo() {
      this.hitStreak++;
      this.hitStreakTimer = 3.2;
    }

    heal(amount, effects) {
      if (this.dead || amount <= 0) return;
      const actual = Math.min(this.maxHp - this.hp, Math.max(1, Math.round(amount)));
      if (actual > 0) {
        this.hp += actual;
        effects && effects.spawnFloatingText(this.x, this.y - 38, `+${actual}`, '#69f0ae', false);
        effects && effects.spawnElementalParticles(this.x, this.y - 16, 7, 'holy', { color: '#69f0ae', spreadX: 16, spreadY: 14 });
      }
    }

    useFlask(effects) {
      if (this.dead) return false;
      const hasDebuff = this.poisonTimer > 0 || this.webSlowTimer > 0;
      if (this.flaskCharges <= 0 || (this.hp >= this.maxHp && this.mp >= this.maxMp && !hasDebuff)) return false;
      this.flaskCharges--;
      const ratio = 0.48 + this.metaFlaskBonus;
      this.heal(this.maxHp * ratio, effects);
      const mpRatio = this.equipStats && this.equipStats.specials.vajra_ward ? 1.0 : 0.55;
      this.restoreMp(this.maxMp * mpRatio, effects, true);
      this.triggerSquash(1.18, 0.86);

      // 观音甘露自动净化奇毒与蛛网负面状态！
      if (hasDebuff) {
        this.poisonTimer = 0;
        this.webSlowTimer = 0;
        effects && effects.spawnFloatingText(this.x, this.y - 50, '✨甘露净厄!', '#80ffdb', false);
      }

      if (this.hasMutation('iron_lotus')) {
        this.lotusBuffTimer = 4.0;
        effects && effects.spawnElementalParticles(this.x, this.y - 18, 10, 'petal', { color: '#69f0ae', accent: '#ffd166' });
      }
      SoundFX.play('heal');
      return true;
    }

    reviveFromAd(effects, enemies, onHitEnemy) {
      const rules = SDK_CONFIG.reviveRules;
      this.dead = false;
      this.reviveCount++;
      this.hp = Math.max(1, Math.round(this.maxHp * (rules.healPercent || 1.0)));
      this.mp = this.maxMp;
      this.flaskCharges = Math.min(this.maxFlaskCharges, this.flaskCharges + (rules.refillFlaskCharges || 1));
      this.invulnTimer = rules.invincibleSeconds || 3.5;
      this.reviveAuraTimer = rules.invincibleSeconds || 3.5;
      this.shieldHp = Math.round(this.maxHp * 0.25);
      this.poisonTimer = 0;
      this.webSlowTimer = 0;
      this.singeTimer = 0;
      this.vx = 0;
      this.vy = -190;
      this.isGroundSmashing = false;
      this.attackTimer = 0;
      this.rollTimer = 0;
      this.triggerSquash(0.82, 1.25);

      SoundFX.play('revive');
      Env.vibrate('heavy');

      if (effects) {
        effects.spawnZone({
          kind: 'shockwave_ring',
          x: this.x,
          y: this.y - 16,
          radius: rules.shockwaveRadius || 210,
          color: '#ffd166',
          duration: 0.45
        });
        effects.spawnElementalParticles(this.x, this.y - 18, 22, 'petal', { color: '#ffd166', accent: '#ffffff', spreadX: 28, spreadY: 28 });
        effects.spawnParticles(this.x, this.y - 18, 24, '#ffd166', 65, 280, 0.25, 0.55, 120);
        effects.spawnFloatingText(this.x, this.y - 48, '观音甘露 · 金身复活！', '#ffd166', true);
      }

      if (enemies && onHitEnemy) {
        const radius = rules.shockwaveRadius || 210;
        const burstDmg = Math.round(this.atk * (rules.shockwaveDamageRatio || 2.2));
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (e.dead) continue;
          const dist = Math.hypot(e.x - this.x, e.y - this.y);
          if (dist <= radius) {
            onHitEnemy(e, {
              dmg: burstDmg,
              isCrit: true,
              knockX: (e.x >= this.x ? 1 : -1) * 300,
              knockY: -160,
              stunSec: 1.8,
              ignoreShield: true,
              debuff: { type: 'expose', duration: 3.5 },
              sourceX: this.x
            });
          }
        }
      }
    }

    canReviveByAd() {
      return this.reviveCount < (SDK_CONFIG.reviveRules.maxRevivesPerRun || 2);
    }

    takeDamage(rawDmg, knockDir, effects, playerDebuff) {
      if (this.dead) return 'ignored';
      if (this.invulnTimer > 0 || this.rollTimer > 0 || this.reviveAuraTimer > 0) {
        return 'ignored';
      }

      let dmg = rawDmg * (1 - this.defense);
      if (this.id === 'bajie' && this.activeSkillTimer > 0) {
        dmg *= 0.4;
      }
      if (this.lotusBuffTimer > 0) {
        dmg *= 0.65;
      }
      if (this.sanctuaryBuffTimer > 0) {
        dmg *= 0.85;
      }
      dmg = Math.max(1, Math.round(dmg));

      if (playerDebuff) {
        this.applyPlayerDebuff(playerDebuff, undefined, effects, false);
      }

      if (this.shieldHp > 0) {
        if (this.shieldHp >= dmg) {
          this.shieldHp -= dmg;
          this.invulnTimer = 0.35;
          SoundFX.play('shieldBlock');
          effects && effects.spawnHitFlash(this.x, this.y - 18, '#80ffdb', false, 0);
          effects && effects.spawnDirectionalSparks(this.x, this.y - 18, knockDir || 1, 7, '#80ffdb');
          effects && effects.spawnFloatingText(this.x, this.y - 36, `金身抵御 -${dmg}`, '#80ffdb', false);
          return 'shielded';
        } else {
          dmg -= this.shieldHp;
          this.shieldHp = 0;
          // 护盾破碎晶屑飞溅动效
          SoundFX.play('armorBreak');
          effects && effects.spawnDebris(this.x, this.y - 18, 7, ['#80ffdb', '#ffffff', '#ffd166'], knockDir || 1);
        }
      }

      this.hp = Math.max(0, this.hp - dmg);
      this.invulnTimer = 0.58;
      this.hurtFlashTimer = 0.16;
      this.hitStreak = Math.floor(this.hitStreak * 0.5);
      this.triggerSquash(1.26, 0.78);

      if (!(this.id === 'bajie' && this.activeSkillTimer > 0)) {
        this.vx = (knockDir || -this.dir) * 165;
        this.vy = -130;
      }

      SoundFX.play('hurt');
      Env.vibrate('medium');
      effects && effects.spawnHitFlash(this.x, this.y - 18, '#ff4d6d', true, 0);
      effects && effects.spawnFloatingText(this.x, this.y - 34, `-${dmg}`, '#ff4d6d', true);
      effects && effects.spawnParticles(this.x, this.y - 16, 12, '#ff4d6d', 50, 175, 0.15, 0.32, 290);

      if (this.hp <= 0) {
        this.dead = true;
      }
      return 'damaged';
    }

    onKillEnemy(effects, killedEnemy) {
      this.totalKills++;
      if (this.hasMutation('vamp_kill')) {
        if (effects && killedEnemy) {
          effects.spawnSiphonOrb(killedEnemy.x, killedEnemy.y - 16, '#ff4d6d');
        }
        this.heal(this.maxHp * 0.04, effects);
      }
      if (this.equipStats && this.equipStats.specials.mana_fountain) {
        if (effects && killedEnemy) {
          effects.spawnSiphonOrb(killedEnemy.x, killedEnemy.y - 16, '#00bbf9');
        }
        this.restoreMp(10, effects, true);
        this.skillCdTimer = Math.max(0, this.skillCdTimer - 0.6);
      }
      if (this.id === 'tangseng') {
        this.purifyCounter++;
        if (this.purifyCounter >= 5) {
          this.purifyCounter = 0;
          this.heal(this.maxHp * 0.06, effects);
          effects && effects.spawnElementalParticles(this.x, this.y - 18, 6, 'petal', { color: '#ffd166', accent: '#ffffff' });
        }
      }
    }

    tryJump(downHeld, effects) {
      if (this.dead) return;
      if (this.rollTimer > 0) {
        this.queueBufferedInput(downHeld ? 'slam' : 'jump', 0, downHeld);
        return;
      }

      // 允许跳跃取消普攻后半段收招硬直，操作手感更丝滑！
      if (this.attackTimer > 0 && this.attackHitDone) {
        this.attackTimer = 0;
      }

      if (downHeld && this.onGround && this.standingOnOneWay) {
        this.dropThroughTimer = 0.22;
        this.onGround = false;
        this.y += 4;
        return;
      }

      if (downHeld && !this.onGround && !this.isGroundSmashing) {
        this.isGroundSmashing = true;
        this.attackTimer = 0;
        this.vx = 0;
        this.vy = 820;
        this.triggerSquash(0.75, 1.32);
        SoundFX.play('roll');
        effects && effects.spawnElementalParticles(this.x, this.y - 18, 8, 'flame', { color: '#ff9100' });
        return;
      }

      if (this.onGround || this.coyoteTimer > 0) {
        this.vy = -this.jumpForce;
        this.onGround = false;
        this.coyoteTimer = 0;
        this.jumpsLeft = this.maxJumps - 1;
        this.triggerSquash(0.82, 1.22);
        SoundFX.play('jump');
        effects && effects.spawnElementalParticles(this.x, this.y, 5, 'smoke', { color: 'rgba(224,251,252,0.55)', spreadX: 12, spreadY: 4 });
      } else if (this.jumpsLeft > 0) {
        this.vy = -this.jumpForce * 0.93;
        this.jumpsLeft--;
        this.isGroundSmashing = false;
        this.triggerSquash(0.8, 1.24);
        SoundFX.play('doubleJump');
        effects &&
          effects.spawnZone({
            kind: 'shockwave_ring',
            x: this.x,
            y: this.y - 2,
            radius: 26,
            color: this.charDef.themeColor,
            duration: 0.18
          });
        effects && effects.spawnParticles(this.x, this.y, 10, this.charDef.themeColor, 40, 125, 0.14, 0.28, 90);
      } else {
        // 即将落地前提前按跳：记入预输入缓冲，触地瞬间0帧起跳！
        this.queueBufferedInput('jump', 0, downHeld);
      }
    }

    tryRoll(moveDir, worldCtx) {
      if (this.dead) return;
      if (this.rollTimer > 0 || this.rollCdTimer > 0) {
        if (this.rollCdTimer < 0.12) {
          this.queueBufferedInput('roll', moveDir, false);
        }
        return;
      }
      const { effects, enemies, onHitEnemy } = worldCtx;

      if (moveDir !== 0) this.dir = moveDir > 0 ? 1 : -1;

      this.attackTimer = 0;
      this.isGroundSmashing = false;
      this.rollTimer = 0.23;
      this.rollCdTimer = this.charDef.stats.rollCooldown;
      this.invulnTimer = Math.max(this.invulnTimer, 0.26);
      this.vx = this.dir * 415;
      if (this.vy > 80) this.vy = 40;
      this.triggerSquash(1.28, 0.76);

      // 翻滚立即挣脱盘丝蛛网缠足状态！
      if (this.webSlowTimer > 0) {
        this.webSlowTimer = 0;
        effects && effects.spawnParticles(this.x, this.y - 12, 8, '#ffffff', 40, 120, 0.12, 0.24, 150);
        effects && effects.spawnFloatingText(this.x, this.y - 40, '挣脱蛛网!', '#e0fbfc', false);
      }

      SoundFX.play('roll');
      effects && effects.spawnElementalParticles(this.x, this.y - 4, 5, 'smoke', { dir: -this.dir, spreadX: 10, spreadY: 4 });

      if (this.id === 'wukong' && effects) {
        effects.spawnZone({
          kind: 'wukong_clone_bomb',
          x: this.x,
          y: this.y,
          radius: 62,
          dmg: Math.round(this.atk * 1.22),
          duration: 0.48
        });
      }

      if ((this.id === 'bailongma' || this.hasMutation('thunder_roll')) && enemies && onHitEnemy) {
        const boltDmg = Math.round(this.skillPower * 0.9);
        SoundFX.play('thunder');
        if (effects) {
          effects.spawnLightningBolt(this.x + (Math.random() - 0.5) * 16, this.y - 125, this.x, this.y - 4, '#00f5d4', 2.4, 0.2);
          effects.spawnElementalParticles(this.x, this.y - 14, 10, 'lightning', { color: '#00f5d4' });
        }
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (!e.dead && Math.hypot(e.x - this.x, e.y - this.y) < 78) {
            onHitEnemy(e, {
              dmg: boltDmg,
              isCrit: false,
              knockX: this.dir * 95,
              knockY: -45,
              stunSec: 0.35,
              ignoreShield: true,
              debuff: { type: 'shock', duration: 2.6 },
              sourceX: this.x
            });
          }
        }
      }
    }

    tryPrimaryAttack(moveDir) {
      if (this.dead || this.isGroundSmashing) return;
      if (this.id === 'bajie' && this.activeSkillTimer > 0) return;

      // 若仍在翻滚尾帧或上一刀尾帧中，写入 120ms 动作预输入缓冲以无缝衔接连段！
      if (this.rollTimer > 0 || this.attackTimer > 0) {
        if ((this.rollTimer > 0 && this.rollTimer < 0.11) || (this.attackTimer > 0 && this.attackTimer < 0.11)) {
          this.queueBufferedInput('attack', moveDir, false);
        }
        return;
      }

      const combos = this.charDef.combo;
      if (this.comboResetTimer <= 0) {
        this.comboIndex = 0;
      }
      const stepIdx = this.comboIndex % combos.length;
      const spec = combos[stepIdx];

      if (moveDir !== 0) {
        this.dir = moveDir > 0 ? 1 : -1;
      } else if (this._appRef && this._appRef.enemies) {
        // 近身无方向键普攻智能转向辅助：若正前方无怪而贴背 36px 内有贴脸妖魔，自动转身迎击！
        const foes = this._appRef.enemies;
        let hasFront = false;
        let hasCloseBack = false;
        for (let i = 0; i < foes.length; i++) {
          const e = foes[i];
          if (e.dead || Math.abs(e.y - this.y) > 42) continue;
          const dx = (e.x - this.x) * this.dir;
          if (dx >= -6 && dx <= spec.rangeX + 32) {
            hasFront = true;
            break;
          }
          if (dx < -6 && dx >= -38) {
            hasCloseBack = true;
          }
        }
        if (!hasFront && hasCloseBack) {
          this.dir = -this.dir;
        }
      }

      this.currentComboStep = stepIdx;
      this.currentAttackSpec = spec;
      this.attackDuration = spec.duration;
      this.attackTimer = spec.duration;
      this.attackHitDone = false;
      this.attackSlashSpawned = false;
      this.attackLandedAny = false;
      this.attackHitIds = {};
      this.attackStartX = this.x;
      this.comboIndex = (this.comboIndex + 1) % combos.length;
      this.comboResetTimer = 0.8;

      if (stepIdx === 2) {
        this.triggerSquash(1.26, 0.82);
      } else {
        this.triggerSquash(1.16, 0.89);
      }

      if (this.onGround) {
        const webMult = this.webSlowTimer > 0 ? 0.72 : 1.0;
        this.vx = this.dir * spec.lunge * 1.12 * webMult;
      }
      SoundFX.play(stepIdx === 2 ? 'slash3' : stepIdx === 1 ? 'slash2' : 'slash1');
    }

    tryCastSkill(worldCtx) {
      if (this.dead || this.isGroundSmashing) return;
      if (this.skillCdTimer > 0) {
        if (this.skillCdTimer < 0.12) this.queueBufferedInput('skill', 0, false);
        return;
      }
      const { level, effects, enemies, onHitEnemy, triggerShake, triggerZoomPunch } = worldCtx;
      const sk = this.charDef.skill;

      const mpCost = 24;
      if (!this.spendMp(mpCost, effects)) return;

      this.skillCdTimer = sk.cooldown * (1 - this.cdReduction);
      this.attackTimer = 0;
      this.rollTimer = 0;
      this.webSlowTimer = 0; // 施展本命神通震碎蛛网缠足
      this.triggerSquash(1.25, 0.8);
      SoundFX.play('skill');
      Env.vibrate('medium');
      triggerZoomPunch && triggerZoomPunch(0.045);

      // 神品词条【九天引雷】：施放神通时自动降下真雷劈击周围妖魔并附加感电！
      if (this.equipStats && this.equipStats.specials.thunder_call) {
        const boltDmg = Math.round(this.magic * 1.18);
        let struck = 0;
        for (let i = 0; i < enemies.length && struck < 2; i++) {
          const e = enemies[i];
          if (!e.dead && Math.hypot(e.x - this.x, e.y - this.y) <= 190) {
            struck++;
            SoundFX.play('thunder');
            effects && effects.spawnLightningBolt(e.x + (Math.random() - 0.5) * 20, e.y - 140, e.x, e.y - 18, '#00f5d4', 2.8, 0.22);
            effects && effects.spawnHitFlash(e.x, e.y - 20, '#00f5d4', true, 0.2);
            effects && effects.spawnElementalParticles(e.x, e.y - 22, 10, 'lightning', { color: '#00f5d4' });
            onHitEnemy(e, {
              dmg: boltDmg,
              isCrit: true,
              knockX: (e.x >= this.x ? 1 : -1) * 120,
              knockY: -55,
              stunSec: 0.4,
              ignoreShield: true,
              debuff: { type: 'shock', duration: 3.0 },
              sourceX: this.x
            });
          }
        }
      }

      if (sk.type === 'wukong_cyclone') {
        this.activeSkillTimer = sk.duration;
        this.activeSkillTick = 0;
        this.invulnTimer = Math.max(this.invulnTimer, sk.duration + 0.12);
        this.vx = this.dir * 305;
        effects && effects.spawnElementalParticles(this.x, this.y - 18, 14, 'flame', { color: '#ffd60a', dir: this.dir });
        effects && effects.spawnFloatingText(this.x, this.y - 40, '大闹天宫·身外身！', '#ffd60a', true);
      } else if (sk.type === 'tangseng_lotus') {
        this.shieldHp = Math.max(this.shieldHp, Math.round(this.maxHp * sk.shieldRatio));
        const gy = level ? snapToGroundY(level, this.x, this.y, 48) : this.y;
        if (effects) {
          effects.spawnZone({
            kind: 'shockwave_ring',
            x: this.x,
            y: this.y - 16,
            radius: 165,
            color: '#ffd166',
            duration: 0.42
          });
          // 展开持续 3.6 秒的【金莲佛国净土残留大阵】（回蓝+减伤+灼净妖邪）！
          effects.spawnZone({
            kind: 'lotus_sanctuary',
            x: this.x,
            y: gy,
            radius: 142,
            dmg: Math.max(5, Math.round(this.skillPower * 0.36)),
            duration: 3.6
          });
          effects.spawnElementalParticles(this.x, this.y - 18, 22, 'petal', { color: '#ffd166', accent: '#ff5e57', spreadX: 36, spreadY: 24 });
          effects.spawnElementalParticles(this.x, this.y - 18, 12, 'holy', { color: '#fff3b0', spreadX: 48, spreadY: 20 });
          effects.spawnFloatingText(this.x, this.y - 40, '紧箍真言·金莲净世！', '#ffd166', true);
        }
        triggerShake && triggerShake(7, 0, 1);

        const roll = this.rollDamage(this.skillPower * sk.dmgMult, false);
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (!e.dead && Math.hypot(e.x - this.x, e.y - this.y) <= 165) {
            onHitEnemy(e, {
              dmg: roll.dmg,
              isCrit: roll.isCrit,
              knockX: (e.x >= this.x ? 1 : -1) * 210,
              knockY: -100,
              stunSec: sk.stunSec,
              ignoreShield: true,
              debuff: { type: 'burn', duration: 2.5, dps: Math.max(5, Math.round(this.skillPower * 0.3)) },
              sourceX: this.x
            });
          }
        }
      } else if (sk.type === 'bajie_spin') {
        this.activeSkillTimer = sk.duration;
        this.activeSkillTick = 0;
        effects && effects.spawnDebris(this.x, this.y - 8, 6, ['#7be495', '#ffd166'], 0);
        effects && effects.spawnFloatingText(this.x, this.y - 40, '天罡旋风耙！', '#7be495', true);
      } else if (sk.type === 'wujing_vortex') {
        const vx = Math.max(48, Math.min(level.widthPx - 48, this.x + this.dir * 74));
        const gy = snapToGroundY(level, vx, this.y, 64);
        SoundFX.play('frost');
        if (effects) {
          effects.spawnZone({
            kind: 'wujing_vortex',
            x: vx,
            y: gy,
            radius: 86,
            dmg: Math.round(this.skillPower * sk.dmgMult),
            duration: sk.duration
          });
          effects.spawnElementalParticles(vx, gy - 12, 16, 'frost', { color: '#6cd4ff', spreadX: 46, spreadY: 16 });
          effects.spawnFloatingText(this.x, this.y - 40, '流沙玄水阵！', '#6cd4ff', true);
        }
      } else if (sk.type === 'dragon_dash') {
        const startX = this.x;
        const startY = this.y;
        let targetX = this.x;
        const step = 8 * this.dir;
        const steps = Math.floor(sk.dashDist / 8);
        for (let s = 0; s < steps; s++) {
          const nextX = targetX + step;
          if (
            getTileAtPx(level, nextX + this.dir * 10, this.y - 8) === TILE_SOLID ||
            getTileAtPx(level, nextX + this.dir * 10, this.y - 24) === TILE_SOLID
          ) {
            break;
          }
          targetX = nextX;
          if (s % 2 === 0 && effects && worldCtx.heroSprite) {
            effects.spawnAfterimage(worldCtx.heroSprite, targetX, startY, this.dir, '#00f5d4', 0.8);
          }
        }
        this.x = targetX;
        this.invulnTimer = Math.max(this.invulnTimer, 0.36);
        this.rollCdTimer = 0;

        const minX = Math.min(startX, targetX) - 20;
        const maxX = Math.max(startX, targetX) + 20;
        const dashLen = Math.max(36, Math.abs(targetX - startX));
        const midX = (startX + targetX) * 0.5;
        const gy = snapToGroundY(level, midX, startY, 54);
        const roll = this.rollDamage(this.skillPower * sk.dmgMult, true);

        SoundFX.play('thunder');
        if (effects) {
          // 1. 银白游龙贯空真身幻影！
          effects.spawnZone({
            kind: 'dragon_phantom_trail',
            x: startX,
            y: startY - 18,
            dir: this.dir,
            length: dashLen + 20,
            duration: 0.38
          });
          // 2. 路径地面留下持续 2.2s 的【九天雷痕电网残留】！
          effects.spawnZone({
            kind: 'thunder_scorch_ground',
            x: midX,
            y: gy,
            length: dashLen,
            dmg: Math.max(4, Math.round(this.skillPower * 0.35)),
            duration: 2.2
          });
          effects.spawnLightningBolt(startX, startY - 18, targetX, startY - 18, '#00f5d4', 3.0, 0.24);
          effects.spawnElementalParticles(this.x, this.y - 16, 20, 'lightning', { color: '#00f5d4', dir: this.dir });
          effects.spawnFloatingText(this.x, this.y - 40, '真龙雷霆闪！', '#00f5d4', true);
        }
        triggerShake && triggerShake(8, this.dir, 0);

        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (!e.dead && e.x >= minX && e.x <= maxX && Math.abs(e.y - startY) < 56) {
            effects && effects.spawnLightningBolt(e.x, e.y - 115, e.x, e.y - 16, '#ffffff', 2.4, 0.2);
            onHitEnemy(e, {
              dmg: roll.dmg,
              isCrit: true,
              knockX: this.dir * 215,
              knockY: -110,
              stunSec: 0.75,
              ignoreShield: true,
              debuff: { type: 'shock', duration: 3.6 },
              sourceX: startX
            });
          }
        }
      }
    }

    tryCastSubWeapon(worldCtx) {
      if (this.dead || !this.subWeapon) return;
      if (this.subWeaponCdTimer > 0) {
        if (this.subWeaponCdTimer < 0.12) this.queueBufferedInput('subWeapon', 0, false);
        return;
      }
      const { level, effects, enemies, onHitEnemy, triggerShake } = worldCtx;
      if (!this.spendMp(15, effects)) return;
      const w = getSubWeaponById(this.subWeapon);
      this.subWeaponCdTimer = w.cooldown * (1 - this.cdReduction);
      this.triggerSquash(1.18, 0.86);
      SoundFX.play('skill');

      const roll = this.rollDamage(this.skillPower * w.dmgMult, false);

      if (w.behavior === 'boomerang') {
        effects.spawnElementalParticles(this.x + this.dir * 14, this.y - 18, 8, 'flame', { color: '#ffd54f', dir: this.dir });
        effects.spawnProjectile({
          owner: 'player',
          kind: 'boomerang',
          x: this.x + this.dir * 14,
          y: this.y - 18,
          vx: this.dir * 435,
          vy: 0,
          radius: 12,
          dmg: roll.dmg,
          isCrit: roll.isCrit,
          pierce: 99,
          passWall: true,
          ignoreShield: true,
          color: w.color,
          life: 1.55
        });
      } else if (w.behavior === 'tornado') {
        effects.spawnRelicFlash(this.x + this.dir * 16, this.y - 24, 'relic_fan', '#69f0ae', this.dir, 0.36);
        effects.spawnElementalParticles(this.x + this.dir * 18, this.y - 16, 12, 'petal', { color: '#69f0ae', accent: '#ffffff', dir: this.dir });
        effects.spawnProjectile({
          owner: 'player',
          kind: 'tornado',
          x: this.x + this.dir * 18,
          y: this.y - 18,
          vx: this.dir * 265,
          vy: 0,
          radius: 24,
          dmg: roll.dmg,
          isCrit: roll.isCrit,
          pierce: 99,
          passWall: true,
          destroyEnemyProj: true,
          ignoreShield: true,
          debuff: { type: 'chill', duration: 1.6 },
          knock: 240,
          color: w.color,
          life: 1.4
        });
      } else if (w.behavior === 'flame_cone') {
        // 紫金红葫芦：祭出宝葫芦法相 + 扇形三昧真火弹 + 前方残留三昧火海 + 持续灼烧 Debuff！
        SoundFX.play('flame');
        effects.spawnRelicFlash(this.x + this.dir * 16, this.y - 26, 'relic_gourd', '#ff6e40', this.dir, 0.42);
        effects.spawnElementalParticles(this.x + this.dir * 24, this.y - 18, 18, 'flame', { dir: this.dir, spreadX: 16, spreadY: 16 });
        if (level) {
          const patchX = Math.max(36, Math.min(level.widthPx - 36, this.x + this.dir * 66));
          const patchY = snapToGroundY(level, patchX, this.y, 56);
          effects.spawnZone({
            kind: 'samadhi_fire_ground',
            x: patchX,
            y: patchY,
            radius: 48,
            dmg: Math.max(5, Math.round(roll.dmg * 0.22)),
            duration: 2.8
          });
        }
        const burnDps = Math.max(5, Math.round(this.skillPower * 0.34));
        for (let k = -2; k <= 2; k++) {
          effects.spawnProjectile({
            owner: 'player',
            kind: 'fireball',
            x: this.x + this.dir * 16,
            y: this.y - 18,
            vx: this.dir * (325 + Math.abs(k) * 20),
            vy: k * 42,
            radius: 8,
            dmg: Math.round(roll.dmg * 0.52),
            isCrit: roll.isCrit,
            pierce: 2,
            ignoreShield: true,
            leaveFirePatch: k === 0,
            debuff: { type: 'burn', duration: 3.2, dps: burnDps },
            color: '#ff6e40',
            coreColor: '#ffd166',
            life: 0.58
          });
        }
      } else if (w.behavior === 'stun_nova') {
        // 金刚琢：祭出金刚神环砸地震晕 + 全体附加【破甲易伤】+ 自身金刚护盾！
        SoundFX.play('armorBreak');
        this.shieldHp = Math.max(this.shieldHp, Math.round(this.maxHp * 0.18));
        effects.spawnRelicFlash(this.x, this.y - 34, 'relic_snare', '#b2ebf2', this.dir, 0.42);
        effects.spawnZone({
          kind: 'shockwave_ring',
          x: this.x,
          y: this.y - 16,
          radius: 140,
          color: '#b2ebf2',
          duration: 0.36
        });
        effects.spawnElementalParticles(this.x, this.y - 16, 14, 'lightning', { color: '#b2ebf2', spreadX: 30, spreadY: 20 });
        triggerShake && triggerShake(6, 0, 1);
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (!e.dead && Math.hypot(e.x - this.x, e.y - this.y) <= 140) {
            onHitEnemy(e, {
              dmg: roll.dmg,
              isCrit: roll.isCrit,
              knockX: (e.x >= this.x ? 1 : -1) * 165,
              knockY: -75,
              stunSec: 1.8,
              ignoreShield: true,
              debuff: { type: 'expose', duration: 3.5 },
              sourceX: this.x
            });
          }
        }
      } else if (w.behavior === 'whip_aoe') {
        // 混天绫：赤霞仙绫破空流光 + 斩碎敌方弹幕 + 真实附加双层【撕裂流血】Debuff！
        effects.spawnZone({
          kind: 'sash_ribbon_wave',
          x: this.x,
          y: this.y - 18,
          radiusX: 102,
          duration: 0.32
        });
        effects.spawnSlashArc({
          x: this.x,
          y: this.y - 18,
          dir: this.dir,
          radiusX: 98,
          radiusY: 38,
          color: '#ff2a54',
          accent: '#ffd166',
          style: 'spin360',
          heavy: true,
          duration: 0.25
        });
        effects.spawnElementalParticles(this.x, this.y - 18, 14, 'petal', { color: '#ff2a54', accent: '#ffd166', spreadX: 70, spreadY: 20 });
        this.sweepClearOrDeflectProjectiles(effects, this.x - 102, this.x + 102, this.y - 18, 44, false);

        const bleedDps = Math.max(5, Math.round(this.skillPower * 0.36));
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (!e.dead && Math.abs(e.x - this.x) <= 102 && Math.abs(e.y - this.y) <= 48) {
            onHitEnemy(e, {
              dmg: roll.dmg,
              isCrit: roll.isCrit,
              knockX: (e.x >= this.x ? 1 : -1) * 175,
              knockY: -65,
              ignoreShield: true,
              debuff: { type: 'bleed', duration: 3.6, stacks: 2, dps: bleedDps },
              sourceX: this.x
            });
          }
        }
      } else if (w.behavior === 'laser_beam') {
        // 昊天照妖镜：宝镜聚光贯穿全屏 + 附加【破甲易伤】与【净世灼烧】！
        const len = 360;
        effects.spawnRelicFlash(this.x + this.dir * 16, this.y - 22, 'relic_mirror', '#ea80fc', this.dir, 0.38);
        effects.spawnZone({
          kind: 'laser_beam',
          x: this.x + this.dir * 12,
          y: this.y - 18,
          dir: this.dir,
          length: len,
          color: '#ea80fc',
          duration: 0.28
        });
        effects.spawnElementalParticles(this.x + this.dir * 26, this.y - 18, 12, 'holy', { color: '#ea80fc', spreadX: 20, spreadY: 12 });
        triggerShake && triggerShake(5, this.dir, 0);
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (e.dead) continue;
          const dx = (e.x - this.x) * this.dir;
          if (dx >= -10 && dx <= len && Math.abs(e.y - this.y) <= 44) {
            const bonus = e.isBoss || e.isElite ? 1.3 : 1.0;
            onHitEnemy(e, {
              dmg: Math.round(roll.dmg * bonus),
              isCrit: true,
              knockX: this.dir * 155,
              knockY: -45,
              ignoreShield: true,
              debuff: [
                { type: 'expose', duration: 4.0 },
                { type: 'burn', duration: 2.2, dps: Math.max(4, Math.round(this.skillPower * 0.28)) }
              ],
              sourceX: this.x
            });
          }
        }
      }
    }

    /**
     * 挥砍剑气与敌方投射物的斩碎 / 刀锋弹反判定！
     */
    sweepClearOrDeflectProjectiles(effects, minX, maxX, centerY, halfY, canDeflect) {
      if (!effects || !effects.projectiles) return;
      for (let i = effects.projectiles.length - 1; i >= 0; i--) {
        const pr = effects.projectiles[i];
        if (pr.owner !== 'enemy' || pr.kind === 'meteor' || pr.kind === 'tornado') continue;
        if (pr.x + pr.radius >= minX && pr.x - pr.radius <= maxX && Math.abs(pr.y - centerY) <= halfY + pr.radius) {
          if (canDeflect) {
            // 触发帅气【刀锋弹反】：敌方箭矢/毒针/法球化作金光暴击反噬群妖！
            pr.owner = 'player';
            pr.deflected = true;
            const spd = Math.max(360, Math.hypot(pr.vx, pr.vy) * 1.45);
            pr.vx = this.dir * spd;
            pr.vy = pr.vy * -0.35;
            pr.dmg = Math.max(8, Math.round(this.atk * 1.45));
            pr.isCrit = true;
            pr.pierce = 2;
            pr.hitIds = {};
            pr.color = '#ffd60a';
            pr.life = Math.max(pr.life, 1.1);
            SoundFX.play('parry');
            effects.spawnHitFlash(pr.x, pr.y, '#ffd60a', true, 0.35);
            effects.spawnFloatingText(pr.x, pr.y - 14, '⚡弹反!', '#ffd60a', false);
          } else {
            effects.spawnDirectionalSparks(pr.x, pr.y, this.dir, 6, '#ffd166');
            effects.projectiles.splice(i, 1);
          }
        }
      }
    }

    update(dt, input, worldCtx) {
      if (this.dead) return;
      const { level, effects, enemies, onHitEnemy, triggerShake, triggerZoomPunch, heroSprite } = worldCtx;

      this.animTimer += dt;
      if (this.mp < this.maxMp) {
        this.mp = Math.min(this.maxMp, this.mp + this.mpRegen * dt);
      }
      this.rollCdTimer = Math.max(0, this.rollCdTimer - dt);
      this.skillCdTimer = Math.max(0, this.skillCdTimer - dt);
      this.subWeaponCdTimer = Math.max(0, this.subWeaponCdTimer - dt);
      this.invulnTimer = Math.max(0, this.invulnTimer - dt);
      this.reviveAuraTimer = Math.max(0, this.reviveAuraTimer - dt);
      this.hurtFlashTimer = Math.max(0, this.hurtFlashTimer - dt);
      this.lotusBuffTimer = Math.max(0, this.lotusBuffTimer - dt);
      this.sanctuaryBuffTimer = Math.max(0, this.sanctuaryBuffTimer - dt);
      this.webSlowTimer = Math.max(0, this.webSlowTimer - dt);
      this.singeTimer = Math.max(0, this.singeTimer - dt);
      this.dropThroughTimer = Math.max(0, this.dropThroughTimer - dt);
      this.comboResetTimer = Math.max(0, this.comboResetTimer - dt);

      // 主角中毒持续微伤结算（保留 1 点底血绝不直接毒死，鼓励操作反制）
      if (this.poisonTimer > 0) {
        this.poisonTimer = Math.max(0, this.poisonTimer - dt);
        this.poisonTick -= dt;
        if (this.poisonTick <= 0) {
          this.poisonTick = 0.65;
          if (this.hp > 1 && this.reviveAuraTimer <= 0) {
            const pDmg = Math.min(this.hp - 1, Math.max(1, Math.round(this.maxHp * 0.022)));
            if (pDmg > 0) {
              this.hp -= pDmg;
              effects && effects.spawnElementalParticles(this.x, this.y - 18, 3, 'venom');
              effects && effects.spawnFloatingText(this.x, this.y - 36, `☠-${pDmg}`, '#80ed99', false);
            }
          }
        }
      }

      // 主角环身增益/减益状态持续微粒子喷发
      this.statusAuraTick -= dt;
      if (this.statusAuraTick <= 0 && effects) {
        this.statusAuraTick = 0.14;
        if (this.reviveAuraTimer > 0) {
          effects.spawnElementalParticles(this.x, this.y - 18, 1, 'holy', { color: '#ffd166', spreadX: 20, spreadY: 20 });
        }
        if (this.lotusBuffTimer > 0) {
          effects.spawnElementalParticles(this.x, this.y - 16, 1, 'petal', { color: '#69f0ae', accent: '#ffd166', spreadX: 18, spreadY: 14 });
        }
        if (this.hitStreak >= 15 && this.hitStreakTimer > 0) {
          effects.spawnElementalParticles(
            this.x,
            this.y - 12,
            1,
            this.hitStreak >= 25 ? 'lightning' : 'flame',
            { color: this.hitStreak >= 25 ? '#ffd60a' : '#ff9f1c', spreadX: 14, spreadY: 16 }
          );
        }
        if (this.poisonTimer > 0) {
          effects.spawnElementalParticles(this.x, this.y - 18, 1, 'venom', { spreadX: 12, spreadY: 12 });
        }
        if (this.singeTimer > 0) {
          effects.spawnElementalParticles(this.x, this.y - 18, 1, 'flame', { spreadX: 10, spreadY: 10 });
        }
        if (this.inQuicksand && Math.abs(this.vx) > 10) {
          effects.spawnElementalParticles(this.x, this.y - 2, 2, 'sand', { spreadX: 12, spreadY: 3 });
        }
        if (this.onIce && Math.abs(this.vx) > 35) {
          effects.spawnElementalParticles(this.x - this.dir * 6, this.y - 2, 1, 'frost', { spreadX: 6, spreadY: 2 });
        }
      }

      if (this.hitStreakTimer > 0) {
        this.hitStreakTimer -= dt;
        if (this.hitStreakTimer <= 0) {
          this.hitStreak = 0;
        }
      }

      // 挤压拉伸弹簧恢复至 (1, 1)
      this.scaleX += (1 - this.scaleX) * Math.min(1, dt * 15);
      this.scaleY += (1 - this.scaleY) * Math.min(1, dt * 15);

      const webMoveMult = this.webSlowTimer > 0 ? 0.68 : 1.0;

      // 1. 持续性主动神通更新
      if (this.activeSkillTimer > 0) {
        this.activeSkillTimer = Math.max(0, this.activeSkillTimer - dt);
        this.activeSkillTick -= dt;
        const sk = this.charDef.skill;

        if (sk.type === 'wukong_cyclone') {
          this.vx = this.dir * 290;
          this.vy = Math.min(this.vy, 30);
          this.sweepClearOrDeflectProjectiles(effects, this.x - 68, this.x + 68, this.y - 18, 36, false);
          if (this.activeSkillTick <= 0) {
            this.activeSkillTick = sk.duration / sk.ticks;
            if (heroSprite) {
              effects.spawnAfterimage(heroSprite, this.x - this.dir * 14, this.y, this.dir, '#ffd60a', 0.68);
            }
            effects.spawnElementalParticles(this.x, this.y - 18, 5, 'flame', { color: '#ffd60a', dir: -this.dir });
            effects.spawnSlashArc({
              x: this.x,
              y: this.y - 18,
              dir: this.dir,
              radiusX: 68,
              radiusY: 30,
              color: '#ffd60a',
              accent: '#ff3b30',
              style: 'spin360',
              heavy: true,
              duration: 0.15
            });
            const isLastTick = this.activeSkillTimer <= sk.duration / sk.ticks;
            const roll = this.rollDamage(this.skillPower * sk.dmgMult, isLastTick);
            for (let i = 0; i < enemies.length; i++) {
              const e = enemies[i];
              if (!e.dead && Math.abs(e.x - this.x) < 72 && Math.abs(e.y - this.y) < 46) {
                onHitEnemy(e, {
                  dmg: roll.dmg,
                  isCrit: roll.isCrit,
                  knockX: this.dir * 145,
                  knockY: -60,
                  ignoreShield: true,
                  debuff: isLastTick ? { type: 'burn', duration: 2.2, dps: Math.max(4, Math.round(this.skillPower * 0.28)) } : null,
                  sourceX: this.x
                });
              }
            }
          }
        } else if (sk.type === 'bajie_spin') {
          if (input.moveX !== 0) this.dir = input.moveX > 0 ? 1 : -1;
          this.vx = (input.moveX !== 0 ? input.moveX : this.dir * 0.75) * (this.moveSpeed * 1.24);
          this.sweepClearOrDeflectProjectiles(effects, this.x - 64, this.x + 64, this.y - 18, 34, false);
          if (this.activeSkillTick <= 0) {
            this.activeSkillTick = sk.duration / sk.ticks;
            SoundFX.play('slash1');
            effects.spawnSlashArc({
              x: this.x,
              y: this.y - 18,
              dir: this.dir,
              radiusX: 64,
              radiusY: 28,
              color: '#7be495',
              accent: '#ffd166',
              style: 'spin360',
              heavy: true,
              duration: 0.15
            });
            if (this.onGround) {
              effects.spawnElementalParticles(this.x, this.y - 3, 2, 'sand', { spreadX: 28, spreadY: 4 });
            }
            const roll = this.rollDamage(this.skillPower * sk.dmgMult, false);
            let hitCount = 0;
            for (let i = 0; i < enemies.length; i++) {
              const e = enemies[i];
              if (!e.dead && Math.abs(e.x - this.x) < 66 && Math.abs(e.y - this.y) < 44) {
                hitCount++;
                effects && effects.spawnSiphonOrb(e.x, e.y - 18, '#7be495');
                onHitEnemy(e, {
                  dmg: roll.dmg,
                  isCrit: roll.isCrit,
                  knockX: (e.x >= this.x ? 1 : -1) * 115,
                  knockY: -40,
                  ignoreShield: true,
                  debuff: { type: 'bleed', duration: 2.2, dps: Math.max(4, Math.round(this.atk * 0.25)) },
                  sourceX: this.x
                });
              }
            }
            if (hitCount > 0) {
              this.heal(sk.lifesteal * hitCount, effects);
            }
          }
        }
      }

      // 2. 翻滚与空中下砸
      if (this.rollTimer > 0) {
        this.rollTimer = Math.max(0, this.rollTimer - dt);
        this.vx = this.dir * 415;
        this.afterimageTick -= dt;
        if (this.afterimageTick <= 0 && heroSprite) {
          this.afterimageTick = 0.045;
          effects.spawnAfterimage(heroSprite, this.x, this.y, this.dir, this.charDef.themeColor, 0.62);
        }
      } else if (this.isGroundSmashing) {
        this.vx = 0;
        this.vy = 830;
        this.afterimageTick -= dt;
        if (this.afterimageTick <= 0 && heroSprite) {
          this.afterimageTick = 0.035;
          effects.spawnAfterimage(heroSprite, this.x, this.y, this.dir, '#ff9100', 0.68);
        }
      } else if (this.activeSkillTimer <= 0) {
        if (this.attackTimer > 0) {
          this.vx *= Math.pow(0.05, dt);
          if (input.moveX !== 0) {
            this.vx += input.moveX * this.moveSpeed * webMoveMult * 0.48 * dt * 8;
          }
        } else {
          if (input.moveX !== 0) {
            this.dir = input.moveX > 0 ? 1 : -1;
            this.vx = input.moveX * this.moveSpeed * webMoveMult;
            if (this.onGround) {
              this.runDustTick -= dt;
              if (this.runDustTick <= 0) {
                this.runDustTick = 0.14;
                effects.spawnElementalParticles(this.x - this.dir * 6, this.y - 2, 2, 'smoke', {
                  color: 'rgba(224,251,252,0.45)',
                  dir: -this.dir,
                  spreadX: 4,
                  spreadY: 2
                });
              }
            }
          } else {
            this.vx *= Math.pow(0.0006, dt);
            if (Math.abs(this.vx) < 8) this.vx = 0;
          }
        }
      }

      // 3. 多帧普攻连续有效窗口结算（Active Hitbox Window + 提早响应刀锋弹反！）
      if (this.attackTimer > 0 && this.currentAttackSpec) {
        this.attackTimer = Math.max(0, this.attackTimer - dt);
        const elapsed = this.attackDuration - this.attackTimer;
        const spec = this.currentAttackSpec;
        const activeEnd = Math.min(this.attackDuration - 0.015, spec.hitTime + 0.085);

        // 出刀抬手即开启近身弹幕招架窗口，贴脸箭矢也能爽快弹反！
        if (elapsed >= Math.max(0.015, spec.hitTime - 0.055) && elapsed < spec.hitTime) {
          const pMinX = this.dir > 0 ? this.x - 10 : this.x - spec.rangeX;
          const pMaxX = this.dir > 0 ? this.x + spec.rangeX : this.x + 10;
          this.sweepClearOrDeflectProjectiles(effects, pMinX, pMaxX, this.y - 18, spec.rangeY * 0.72, true);
        }

        if (elapsed >= spec.hitTime) {
          if (!this.attackSlashSpawned) {
            this.attackSlashSpawned = true;
            this.attackHitDone = true;
            this.executeAttackHit(spec, worldCtx);
          }
          if (elapsed <= activeEnd) {
            this.sweepActiveAttackWindow(spec, elapsed, worldCtx);
          }
        }
      }

      // 4. 重力与地图碰撞
      const prevVy = this.vy;
      this.vy = Math.min(840, this.vy + GRAVITY * dt);
      const wasOnGround = this.onGround;
      moveAndCollide(level, this, dt);

      if (this.onGround) {
        if (!wasOnGround && prevVy > 220) {
          this.triggerSquash(1.2, 0.83);
          effects.spawnElementalParticles(this.x, this.y - 1, 5, 'smoke', { spreadX: 12, spreadY: 3 });
        }
        this.coyoteTimer = 0.11;
        this.jumpsLeft = this.maxJumps;

        if (this.isGroundSmashing) {
          this.isGroundSmashing = false;
          this.triggerSquash(1.38, 0.68);
          const quakeBoost = this.hasMutation('slam_quake') ? 1.65 : 1.0;
          const radius = Math.round(102 * quakeBoost);
          const slamDmg = Math.round(this.atk * 1.98 * quakeBoost);

          SoundFX.play('slam');
          Env.vibrate('heavy');
          triggerShake && triggerShake(11, 0, 1);
          triggerZoomPunch && triggerZoomPunch(0.055);

          effects.spawnZone({
            kind: 'shockwave_ring',
            x: this.x,
            y: this.y - 6,
            radius,
            color: '#ff9100',
            duration: 0.32
          });
          // 地面残留裂地碎岩坑痕与升腾烟尘！
          effects.spawnZone({
            kind: 'earth_crater',
            x: this.x,
            y: this.y,
            radius: Math.min(68, Math.round(radius * 0.58)),
            color: '#ff9100',
            duration: 2.6
          });
          effects.spawnDebris(this.x, this.y - 4, 14, ['#ffba08', '#ff5400', '#adb5bd'], 0);
          effects.spawnElementalParticles(this.x, this.y - 4, 14, 'flame', { color: '#ff9100', spreadX: 36, spreadY: 8 });
          effects.spawnElementalParticles(this.x, this.y - 4, 8, 'smoke', { spreadX: 44, spreadY: 6 });

          for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (!e.dead && Math.abs(e.x - this.x) <= radius && Math.abs(e.y - this.y) <= 48) {
              onHitEnemy(e, {
                dmg: slamDmg,
                isCrit: true,
                isHeavy: true,
                knockX: (e.x >= this.x ? 1 : -1) * 235,
                knockY: -175,
                stunSec: 1.25,
                ignoreShield: true,
                debuff: { type: 'expose', duration: 3.0 },
                sourceX: this.x
              });
            }
          }
        }
      } else {
        if (wasOnGround) {
          this.coyoteTimer = 0.11;
        } else {
          this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
        }
      }

      // 5. 消费 120ms 预输入缓冲队列（落地瞬跳、连段无缝衔接、翻滚取消）
      if (this.inputBuffer) {
        this.inputBuffer.timer -= dt;
        const buf = this.inputBuffer;
        if (buf.timer <= 0) {
          this.inputBuffer = null;
        } else {
          if (buf.act === 'jump' && (this.onGround || this.jumpsLeft > 0) && this.rollTimer <= 0) {
            this.inputBuffer = null;
            this.tryJump(buf.downHeld, effects);
          } else if (buf.act === 'slam' && !this.onGround && this.rollTimer <= 0) {
            this.inputBuffer = null;
            this.tryJump(true, effects);
          } else if (buf.act === 'roll' && this.rollTimer <= 0 && this.rollCdTimer <= 0) {
            this.inputBuffer = null;
            this.tryRoll(buf.moveDir || input.moveX, worldCtx);
          } else if (buf.act === 'attack' && this.attackTimer <= 0 && this.rollTimer <= 0) {
            this.inputBuffer = null;
            this.tryPrimaryAttack(input.moveX !== 0 ? input.moveX : buf.moveDir);
          } else if (buf.act === 'skill' && this.skillCdTimer <= 0) {
            this.inputBuffer = null;
            this.tryCastSkill(worldCtx);
          } else if (buf.act === 'subWeapon' && this.subWeaponCdTimer <= 0) {
            this.inputBuffer = null;
            this.tryCastSubWeapon(worldCtx);
          }
        }
      }

      if (this.inHazard) {
        this.hazardTick -= dt;
        if (this.hazardTick <= 0) {
          this.hazardTick = 0.5;
          this.takeDamage(Math.max(8, Math.round(this.maxHp * 0.1)), -this.dir, effects);
          this.vy = -260;
        }
      } else {
        this.hazardTick = 0;
      }
    }

    /**
     * 挥砍出刀首帧：生成分层刀光、专属投射物与重击地面残留特效（保持 executeAttackHit 命名以兼容套装钩子）
     */
    executeAttackHit(spec, worldCtx) {
      const { level, effects, triggerShake, triggerZoomPunch } = worldCtx;
      const isFinisher = this.currentComboStep === 2 || !!spec.forceCrit;

      effects.spawnSlashArc({
        x: this.x + this.dir * (spec.rangeX * 0.48),
        y: this.y - 19,
        dir: this.dir,
        radiusX: spec.rangeX * (isFinisher ? 1.16 : 1.05),
        radiusY: spec.rangeY * 0.74,
        color: this.charDef.themeColor,
        accent: this.charDef.accentColor,
        style: spec.style,
        heavy: isFinisher,
        duration: isFinisher ? 0.21 : 0.15
      });

      // 终结重击专属战场粒子与地面残留坑痕/火痕！
      if (isFinisher && level) {
        const impactX = Math.max(32, Math.min(level.widthPx - 32, this.x + this.dir * (spec.rangeX * 0.7)));
        if (spec.style === 'heavySlam' || spec.style === 'earthSmash') {
          const gy = snapToGroundY(level, impactX, this.y, 40);
          effects.spawnZone({
            kind: 'earth_crater',
            x: impactX,
            y: gy,
            radius: 30,
            color: this.charDef.themeColor,
            duration: 2.0
          });
          effects.spawnDebris(impactX, gy - 4, 6, [this.charDef.themeColor, '#adb5bd'], this.dir);
          if (this.id === 'wukong') {
            effects.spawnElementalParticles(impactX, gy - 6, 8, 'flame', { color: '#ffd60a', dir: this.dir });
          }
        } else if (spec.style === 'dragonPierce') {
          effects.spawnElementalParticles(impactX, this.y - 18, 9, 'lightning', { color: '#00f5d4', dir: this.dir });
        }
      }

      if (spec.shake && triggerShake) {
        triggerShake(spec.shake + 2, this.dir, 0.3);
      }
      if (isFinisher && triggerZoomPunch) {
        triggerZoomPunch(0.035);
      }

      if (spec.projectile) {
        const hybridBase =
          (this.id === 'tangseng' ? this.magic * 0.85 + this.atk * 0.45 : this.atk * 0.75 + this.magic * 0.45) * spec.dmgMult;
        const projRoll = this.rollDamage(hybridBase, spec.forceCrit);
        const isWave = spec.projectile.indexOf('crescent') !== -1;

        let projDebuff = null;
        if (spec.projectile === 'lotus_blast') {
          projDebuff = { type: 'burn', duration: 2.0, dps: Math.max(4, Math.round(this.magic * 0.25)) };
        } else if (spec.projectile === 'crescent_wave_big') {
          projDebuff = { type: 'chill', duration: 2.2 };
        } else if (spec.projectile === 'crescent_wave') {
          projDebuff = { type: 'chill', duration: 1.2, silent: true };
        } else if (spec.projectile === 'dragon_bolt') {
          projDebuff = { type: 'shock', duration: 2.8 };
        }

        effects.spawnProjectile({
          owner: 'player',
          kind: spec.projectile,
          x: this.x + this.dir * 18,
          y: this.y - 19,
          vx: this.dir * (spec.projSpeed || 410),
          vy: 0,
          radius: spec.projectile === 'lotus_blast' || spec.projectile === 'crescent_wave_big' ? 14 : 9,
          dmg: projRoll.dmg,
          isCrit: projRoll.isCrit,
          pierce: spec.pierce || 1,
          debuff: projDebuff,
          color: this.charDef.themeColor,
          coreColor: this.charDef.accentColor,
          knock: Math.abs(spec.knockX || 120),
          life: isWave ? 0.6 : 1.0
        });
      }
    }

    /**
     * 多帧连续有效打击窗口：包含突进位移扫掠框、招式专属纵向补偿、刀锋甜区增伤与弹反判定
     */
    sweepActiveAttackWindow(spec, elapsed, worldCtx) {
      const { effects, enemies, onHitEnemy } = worldCtx;
      const isFinisher = this.currentComboStep === 2 || !!spec.forceCrit;
      const meleeMult = this.id === 'tangseng' ? spec.dmgMult * 0.6 : spec.dmgMult;

      // 融合挥刀起始位置与当前突进位置的连续扫掠盒，彻底消除突刺穿怪漏判！
      const backPad = isFinisher || spec.style === 'heavySwing' || spec.style === 'rakePull' ? 20 : 14;
      const anchorMinX = Math.min(this.attackStartX, this.x);
      const anchorMaxX = Math.max(this.attackStartX, this.x);
      const minX = this.dir > 0 ? anchorMinX - backPad : anchorMinX - spec.rangeX - 8;
      const maxX = this.dir > 0 ? anchorMaxX + spec.rangeX + 8 : anchorMaxX + backPad;

      const isUpperSlash = spec.style === 'upSlash' || spec.style === 'crescentSlash';
      const centerY = this.y - (isUpperSlash ? 23 : 18);
      const halfRangeY = spec.rangeY * (isUpperSlash ? 0.78 : 0.68);

      // 挥刀前 0.065 秒精准时机（或第 3 段重击）支持【刀锋弹反】敌方箭矢与法球！
      const inParryFrames = isFinisher || elapsed <= spec.hitTime + 0.065;
      this.sweepClearOrDeflectProjectiles(effects, minX, maxX, centerY, halfRangeY, inParryFrames);

      const hasPolearmSweetSpot =
        spec.style === 'thrust' ||
        spec.style === 'lanceThrust' ||
        spec.style === 'dragonPierce' ||
        spec.style === 'heavySlam' ||
        spec.style === 'earthSmash';

      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.dead || this.attackHitIds[e.uid]) continue;

        const exLeft = e.x - e.width * 0.5;
        const exRight = e.x + e.width * 0.5;
        const overlapX = exRight >= minX && exLeft <= maxX;
        const overlapY = Math.abs(e.y - e.height * 0.5 - centerY) <= halfRangeY + e.height * 0.46;

        if (overlapX && overlapY) {
          this.attackHitIds[e.uid] = true;

          let dmgBase = this.atk * meleeMult;
          if (this.id === 'wujing' && (e.stunTimer > 0 || e.slowTimer > 0)) {
            dmgBase *= 1.3;
          }

          // 兵刃外圈 38% 锋芒甜区判定（控距精准刺击奖励 +12% 伤害与青芒星闪！）
          const forwardDist = (e.x - this.x) * this.dir;
          const isSweetSpot = hasPolearmSweetSpot && forwardDist >= spec.rangeX * 0.62;
          if (isSweetSpot) {
            dmgBase *= 1.12;
          }

          const roll = this.rollDamage(dmgBase, spec.forceCrit);
          if (roll.isCrit && this.hasMutation('crit_frenzy')) {
            this.skillCdTimer = Math.max(0, this.skillCdTimer - 0.5);
          }

          // 角色连段特色状态附着（八戒回勾撕裂流血、大圣重砸真火破甲、悟净寒霜、白龙感电）
          let comboDebuff = null;
          if (this.id === 'bajie' && spec.style === 'rakePull') {
            comboDebuff = { type: 'bleed', duration: 2.8, dps: Math.max(4, Math.round(this.atk * 0.28)) };
          } else if (this.id === 'bajie' && spec.style === 'earthSmash') {
            comboDebuff = { type: 'expose', duration: 3.0 };
          } else if (this.id === 'wukong' && spec.style === 'heavySlam') {
            comboDebuff = [
              { type: 'expose', duration: 2.4 },
              { type: 'burn', duration: 2.0, dps: Math.max(4, Math.round(this.atk * 0.25)) }
            ];
          } else if (this.id === 'wujing' && isFinisher) {
            comboDebuff = { type: 'chill', duration: 2.2 };
          } else if (this.id === 'bailongma' && isFinisher) {
            comboDebuff = { type: 'shock', duration: 2.6 };
          }

          const kbBoost = isFinisher ? 1.28 : 1.08;
          onHitEnemy(e, {
            dmg: roll.dmg,
            isCrit: roll.isCrit,
            isHeavy: isFinisher,
            isSweetSpot,
            knockX: this.dir * spec.knockX * kbBoost,
            knockY: spec.knockY,
            stunSec: spec.stunSec || (isFinisher ? 0.25 : 0),
            ignoreShield: spec.forceCrit || false,
            debuff: comboDebuff,
            sourceX: this.x
          });

          if (!this.attackLandedAny) {
            this.attackLandedAny = true;
            this.restoreMp(this.mpOnHit, effects, false);
            Env.vibrate(isFinisher ? 'medium' : 'light');
          }
        }
      }
    }

    render(ctx, camX, camY, assetLoader) {
      const sx = Math.round((this.x - camX) * 2) / 2;
      const sy = Math.round((this.y - camY) * 2) / 2;

      ctx.save();

      // 0. 脚底立体贴地阴影椭圆与状态法环
      ctx.fillStyle = 'rgba(8, 6, 14, 0.48)';
      ctx.beginPath();
      ctx.ellipse(sx, sy - 1, 12, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (this.sanctuaryBuffTimer > 0) {
        ctx.strokeStyle = 'rgba(255, 209, 102, 0.85)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(sx, sy - 2, 16 + Math.sin(this.animTimer * 10) * 2, 5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (this.hitStreak >= 8 && this.hitStreakTimer > 0) {
        ctx.strokeStyle = this.hitStreak >= 25 ? '#ffd60a' : '#ff6e40';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(sx, sy - 2, 14 + Math.sin(this.animTimer * 16) * 2, 4.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (this.invulnTimer > 0 && this.reviveAuraTimer <= 0 && Math.floor(this.invulnTimer * 24) % 2 === 0) {
        ctx.globalAlpha = 0.55;
      }

      // 护体金莲后层花瓣（3D 环绕透视后半圈）
      if (this.lotusBuffTimer > 0) {
        this.renderLotusOrbitPetals(ctx, sx, sy - 16, false);
      }

      // 动作帧切换（兼容 11帧 76x88 高精纸娃娃模型与 16-bit 基础精灵）
      let frameKey = Math.floor(this.animTimer * 3.6) % 2 === 0 ? 'idle' : 'idle1';
      if (this.hurtFlashTimer > 0) {
        frameKey = 'flash';
      } else if (this.attackTimer > 0) {
        frameKey = 'attack';
      } else if (!this.onGround || Math.abs(this.vx) > 20) {
        frameKey = Math.floor(this.animTimer * 11) % 2 === 0 ? 'run0' : 'run1';
      }

      let spr = assetLoader.getHeroSprite(this.id, frameKey);
      if (spr && this.hurtFlashTimer <= 0 && this.poisonTimer > 0 && assetLoader.getTintedSprite) {
        spr = assetLoader.getTintedSprite(spr, '#80ed99', 'overlay');
      }

      // 孙悟空【大闹天宫·身外身】两侧金色毫毛幻身齐舞特效！
      if (this.id === 'wukong' && this.activeSkillTimer > 0 && spr && assetLoader.getTintedSprite) {
        const baseClone = assetLoader.getCompositeHeroSprite
          ? assetLoader.getCompositeHeroSprite(this.id, this.equipped, 'attack0', false)
          : spr;
        const cloneSpr = assetLoader.getTintedSprite(baseClone, '#ffd60a', 'silhouette');
        const clw = cloneSpr._logicalW || cloneSpr.width;
        const clh = cloneSpr._logicalH || cloneSpr.height;
        [-18, 18].forEach((ox) => {
          ctx.save();
          ctx.globalAlpha = 0.58;
          ctx.translate(sx + ox, sy - 2);
          if (this.dir < 0) ctx.scale(-1, 1);
          ctx.drawImage(cloneSpr, -clw / 2, -clh, clw, clh);
          ctx.restore();
        });
      }

      ctx.save();
      ctx.translate(sx, sy);
      if (this.dir < 0) ctx.scale(-1, 1);
      ctx.scale(this.scaleX, this.scaleY);

      if (this.rollTimer > 0) {
        ctx.translate(0, -16);
        ctx.rotate((1 - this.rollTimer / 0.23) * Math.PI * 2);
        ctx.translate(0, 16);
      }

      if (HeroModelEngine && HeroModelEngine.renderHeroPaperDoll) {
        // 使用 76x88 高精微像素 5部位实时纸娃娃换装引擎渲染！
        let pdFrame = Math.floor(this.animTimer * 3.6) % 2 === 0 ? 'idle0' : 'idle1';
        if (this.hurtFlashTimer > 0) {
          pdFrame = 'flash';
        } else if (this.attackTimer > 0) {
          pdFrame = `attack${this.currentComboStep % 3}`;
        } else if (!this.onGround) {
          pdFrame = this.vy < 0 ? 'jump' : 'fall';
        } else if (Math.abs(this.vx) > 20) {
          pdFrame = `run${Math.floor(this.animTimer * 12) % 4}`;
        }
        const atkProg = this.attackTimer > 0 ? 1 - this.attackTimer / Math.max(0.01, this.attackDuration) : 0;
        HeroModelEngine.renderHeroPaperDoll(ctx, {
          heroId: this.id,
          equipped: this.equipped,
          frameKey: pdFrame,
          animTime: this.animTimer,
          moving: Math.abs(this.vx) > 20,
          airborne: !this.onGround,
          attacking: this.attackTimer > 0,
          comboStep: this.currentComboStep,
          attackProgress: atkProg,
          forceSignatureWeapon: !!this.forceSignatureWeapon,
          hiRes: false
        });
      } else {
        // 降级基础像素精灵渲染
        this.renderBackAccessories(ctx);
        if (spr) {
          const lw = spr._logicalW || spr.width;
          const lh = spr._logicalH || spr.height;
          ctx.drawImage(spr, -lw / 2, -lh, lw, lh);
        }
        this.renderWeaponPixel(ctx);
      }
      ctx.restore();

      // ==================== 前景 Buff / Debuff 状态动效叠加 ====================
      // A. 护体金莲前层花瓣（3D 环绕前半圈）
      if (this.lotusBuffTimer > 0) {
        this.renderLotusOrbitPetals(ctx, sx, sy - 16, true);
      }

      // B. 金刚护盾八角流光结界罩
      if (this.shieldHp > 0) {
        ctx.save();
        const r = 21 + Math.sin(this.animTimer * 8) * 1;
        ctx.strokeStyle = 'rgba(128, 255, 219, 0.85)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (let k = 0; k < 8; k++) {
          const ang = this.animTimer * 1.4 + (k * Math.PI) / 4;
          const px = sx + Math.cos(ang) * r;
          const py = sy - 18 + Math.sin(ang) * r;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = 'rgba(128, 255, 219, 0.1)';
        ctx.fill();
        ctx.restore();
      }

      // C. 观音甘露复活无敌金身大日佛环
      if (this.reviveAuraTimer > 0) {
        ctx.save();
        const r = 25 + Math.sin(this.animTimer * 14) * 2.5;
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(sx, sy - 18, r, 0, Math.PI * 2);
        ctx.stroke();
        for (let k = 0; k < 4; k++) {
          const ang = -this.animTimer * 5 + (k * Math.PI) / 2;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.round(sx + Math.cos(ang) * r) - 2, Math.round(sy - 18 + Math.sin(ang) * r) - 2, 4, 4);
        }
        ctx.restore();
      }

      // D. 盘丝蛛网缠足白色丝线束缚动效
      if (this.webSlowTimer > 0) {
        ctx.save();
        ctx.strokeStyle = '#f8f9fa';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(sx - 10, sy - 14);
        ctx.lineTo(sx + 10, sy - 4);
        ctx.moveTo(sx + 10, sy - 14);
        ctx.lineTo(sx - 10, sy - 4);
        ctx.moveTo(sx - 9, sy - 9);
        ctx.lineTo(sx + 9, sy - 9);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    }

    renderLotusOrbitPetals(ctx, cx, cy, frontPass) {
      for (let i = 0; i < 4; i++) {
        const ang = this.animTimer * 5.2 + (i * Math.PI) / 2;
        const sinV = Math.sin(ang);
        if ((frontPass && sinV < 0) || (!frontPass && sinV >= 0)) continue;
        const px = cx + Math.cos(ang) * 19;
        const py = cy + sinV * 6;
        ctx.save();
        ctx.fillStyle = i % 2 === 0 ? '#69f0ae' : '#ffd166';
        ctx.beginPath();
        ctx.moveTo(px, py - 4);
        ctx.lineTo(px + 3, py);
        ctx.lineTo(px, py + 4);
        ctx.lineTo(px - 3, py);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    renderBackAccessories(ctx) {
      const t = this.animTimer;
      const moving = Math.abs(this.vx) > 25 || !this.onGround;
      const wind = moving ? 1.0 : 0.35;

      if (this.id === 'wukong') {
        for (let f = 0; f < 2; f++) {
          const offsetY = f === 0 ? -36 : -33;
          ctx.strokeStyle = f === 0 ? '#ef233c' : '#ffd60a';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-2, offsetY);
          const ctrlX = -14 - wind * 8;
          const ctrlY = offsetY - 8 + Math.sin(t * 9 + f) * 4;
          const tipX = -24 - wind * 10;
          const tipY = offsetY - 3 + Math.cos(t * 8 + f) * 5;
          ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
          ctx.stroke();
          ctx.fillStyle = '#ffd60a';
          ctx.fillRect(Math.round(tipX) - 1, Math.round(tipY) - 1, 3, 3);
        }

        const capeWave = Math.sin(t * 11) * 4 * wind;
        ctx.fillStyle = '#9d0208';
        ctx.beginPath();
        ctx.moveTo(-5, -23);
        ctx.lineTo(-19 - wind * 6, -12 + capeWave);
        ctx.lineTo(-14 - wind * 4, -5 + capeWave * 0.6);
        ctx.lineTo(-4, -13);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#dda15e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-6, -10);
        ctx.quadraticCurveTo(-16, -12, -15, -20 + Math.sin(t * 7) * 3);
        ctx.stroke();
      } else if (this.id === 'tangseng') {
        ctx.save();
        ctx.translate(0, -28);
        ctx.strokeStyle = 'rgba(255, 209, 102, 0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 13 + Math.sin(t * 4) * 1, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < 4; i++) {
          const ang = t * 2.2 + (i * Math.PI) / 2;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.round(Math.cos(ang) * 13) - 1, Math.round(Math.sin(ang) * 13) - 1, 2, 2);
        }
        ctx.restore();

        ctx.fillStyle = '#ef233c';
        const ribY = Math.sin(t * 8) * 3;
        ctx.fillRect(-14 - Math.round(wind * 4), -24 + Math.round(ribY), 9, 3);
      } else if (this.id === 'bajie') {
        const sway = Math.sin(t * 9) * 3;
        ctx.fillStyle = '#22223b';
        ctx.fillRect(-15 - Math.round(wind * 4), -20 + Math.round(sway * 0.5), 9, 10);
        ctx.fillStyle = '#ef233c';
        ctx.fillRect(-12, -13 + Math.round(sway * 0.4), 5, 6);
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(-11, -15 + Math.round(sway * 0.4), 3, 2);
      } else if (this.id === 'wujing') {
        ctx.fillStyle = '#e63946';
        ctx.fillRect(-17 - Math.round(wind * 5), -31 + Math.round(Math.sin(t * 10) * 3), 11, 3);
        for (let i = 0; i < 2; i++) {
          const ox = Math.cos(t * 4 + i * Math.PI) * 14;
          const oy = -18 + Math.sin(t * 6 + i) * 5;
          ctx.fillStyle = '#48cae4';
          ctx.fillRect(Math.round(ox) - 1, Math.round(oy) - 1, 3, 3);
        }
      } else if (this.id === 'bailongma') {
        const wave = Math.sin(t * 12) * 4;
        ctx.fillStyle = '#0077b6';
        ctx.beginPath();
        ctx.moveTo(-5, -23);
        ctx.lineTo(-21 - wind * 7, -9 + wave);
        ctx.lineTo(-13 - wind * 5, -3 + wave * 0.5);
        ctx.lineTo(-4, -12);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-16 - Math.round(wind * 4), -29 + Math.round(wave * 0.5), 10, 4);

        if (!this.onGround || this.attackTimer > 0) {
          ctx.strokeStyle = '#00f5d4';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-6, -11);
          ctx.quadraticCurveTo(-18, -6, -25, -16 + wave);
          ctx.stroke();
        }
      }
    }

    renderWeaponPixel(ctx) {
      const swinging = this.attackTimer > 0;
      let swingAngle = -0.32;
      if (swinging && this.currentAttackSpec) {
        const p = 1 - this.attackTimer / Math.max(0.01, this.attackDuration);
        if (this.currentComboStep === 1) {
          swingAngle = 0.95 - p * 1.9;
        } else if (this.currentComboStep === 2) {
          swingAngle = -1.35 + p * 2.35;
        } else {
          swingAngle = -0.85 + p * 1.65;
        }
      }

      const eqWpn = this.equipped && this.equipped.weapon;
      const highRarityGlow = eqWpn && eqWpn.rarityIndex >= 3 ? eqWpn.rarityColor : null;

      ctx.save();
      ctx.translate(7, -16);
      ctx.rotate(swingAngle);

      if (this.id === 'wukong') {
        const grow = swinging && this.currentComboStep === 2 ? 1.38 : 1.0;
        ctx.scale(grow, grow);
        if (highRarityGlow) {
          ctx.fillStyle = highRarityGlow;
          ctx.globalAlpha = 0.45;
          ctx.fillRect(-10, -4, 40, 8);
          ctx.globalAlpha = 1;
        }
        ctx.fillStyle = '#120d18';
        ctx.fillRect(-9, -3, 38, 6);
        ctx.fillStyle = '#ffd60a';
        ctx.fillRect(-8, -2, 7, 4);
        ctx.fillStyle = '#ef233c';
        ctx.fillRect(-1, -2, 21, 4);
        ctx.fillStyle = '#ffd60a';
        ctx.fillRect(20, -2, 8, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(21, -2, 5, 1);
      } else if (this.id === 'tangseng') {
        ctx.rotate(0.45);
        ctx.fillStyle = '#6f4518';
        ctx.fillRect(1, -18, 3, 29);
        ctx.strokeStyle = highRarityGlow || '#ffd166';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(2.5, -22, 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ff4d6d';
        ctx.fillRect(1, -24, 3, 3);
      } else if (this.id === 'bajie') {
        ctx.fillStyle = '#582f0e';
        ctx.fillRect(-6, -2, 26, 4);
        ctx.fillStyle = '#ef233c';
        ctx.fillRect(16, -5, 4, 9);
        ctx.fillStyle = highRarityGlow || '#ffd166';
        ctx.fillRect(20, -9, 4, 18);
        for (let py = -8; py <= 7; py += 3) {
          ctx.fillRect(24, py, 4, 2);
        }
      } else if (this.id === 'wujing') {
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(-9, -3, 5, 6);
        ctx.fillStyle = '#3c096c';
        ctx.fillRect(-4, -2, 24, 4);
        ctx.strokeStyle = highRarityGlow || '#90e0ef';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(22, 0, 7, -Math.PI * 0.65, Math.PI * 0.65);
        ctx.stroke();
      } else if (this.id === 'bailongma') {
        ctx.fillStyle = '#caf0f8';
        ctx.fillRect(-7, -1.5, 24, 3);
        ctx.fillStyle = '#00bbf9';
        ctx.fillRect(14, -4, 4, 8);
        ctx.fillStyle = highRarityGlow || '#00f5d4';
        ctx.beginPath();
        ctx.moveTo(18, -4.5);
        ctx.lineTo(33, 0);
        ctx.lineTo(18, 4.5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(19, -1, 10, 2);
      }

      ctx.restore();
    }
  }

  return {
    Player
  };
});
