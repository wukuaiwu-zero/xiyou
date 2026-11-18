/**
 * 西游妖魔小怪、精英妖将、守关妖王 AI 与多维负面状态系统 (src/entities/enemy.js)
 * 核心升级：
 * 1. 六大负面状态与动效：灼烧(Burn)、流血(Bleed)、寒霜(Chill)、感电(Shock)、破甲(Expose)、眩晕(Stun)
 * 2. 元素像素附着染色 + 脚底结霜/身上火舌/滴落血珠/环身电弧/头顶状态徽章条
 * 3. 打击判定与公平性升级：重击碎盾、受控中断冲锋伤害、撞墙粉碎自动附加破甲易伤、前摇寒芒预警
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
})('enemy', function (require) {
  const { ENEMY_TYPES } = require('../config/biomes');
  const { moveAndCollide, getTileAtPx, TILE_EMPTY, TILE_HAZARD } = require('../world/levelGen');
  const SoundFX = require('../audio/soundFX');

  let _uidSeq = 1;
  const GRAVITY = 1150;

  const DEBUFF_META = {
    burn: { label: '灼', fullName: '灼烧', color: '#ff6e40', maxStacks: 3 },
    bleed: { label: '血', fullName: '撕裂', color: '#ff2a54', maxStacks: 4 },
    chill: { label: '霜', fullName: '寒霜', color: '#48cae4', maxStacks: 1 },
    shock: { label: '电', fullName: '感电', color: '#00f5d4', maxStacks: 1 },
    expose: { label: '破', fullName: '破甲', color: '#ffd60a', maxStacks: 1 }
  };

  class Enemy {
    constructor(spawnInfo) {
      this.uid = _uidSeq++;
      this.isBoss = !!spawnInfo.isBoss;
      this.isElite = !!spawnInfo.isElite;

      const mult = spawnInfo.difficultyMult || 1;
      if (this.isBoss) {
        const def = spawnInfo.def;
        this.typeId = spawnInfo.bossId;
        this.name = def.name;
        this.subtitle = def.subtitle;
        this.maxHp = Math.round(def.hp * mult);
        this.atk = Math.round(def.atk * (1 + (mult - 1) * 0.65));
        this.speed = def.speed;
        this.width = def.width;
        this.height = def.height;
        this.souls = Math.round(def.souls * mult);
        this.gold = Math.round(def.gold * mult);
        this.color = def.color;
        this.accent = def.accent;
        this.patterns = def.patterns || ['spear_charge'];
        this.arenaLeftX = spawnInfo.arenaLeftX;
        this.arenaRightX = spawnInfo.arenaRightX;
        this.activated = false;
        this.patternIdx = 0;
      } else {
        const def = ENEMY_TYPES[spawnInfo.typeId] || ENEMY_TYPES.wolf_scout;
        this.typeId = def.id;
        this.name = this.isElite ? `【精英】${def.name}` : def.name;
        const eliteHpMult = this.isElite ? 2.2 : 1.0;
        const eliteAtkMult = this.isElite ? 1.3 : 1.0;
        this.maxHp = Math.round(def.hp * mult * eliteHpMult);
        this.atk = Math.round(def.atk * (1 + (mult - 1) * 0.6) * eliteAtkMult);
        this.speed = def.speed * (this.isElite ? 1.12 : 1.0);
        this.width = def.width;
        this.height = def.height;
        this.ai = def.ai;
        this.attackRange = def.attackRange;
        this.attackCdBase = def.attackCd;
        this.souls = Math.round(def.souls * (this.isElite ? 3 : 1));
        this.gold = Math.round(def.gold * (this.isElite ? 3 : 1));
        this.color = def.color;
      }

      this.hp = this.maxHp;
      this.x = spawnInfo.x;
      this.y = spawnInfo.y;
      this.vx = 0;
      this.vy = 0;
      this.dir = -1;
      this.onGround = false;
      this.dead = false;

      // 打击感形变与击飞撞墙状态
      this.scaleX = 1;
      this.scaleY = 1;
      this.knockbackTimer = 0;
      this.lastHitDmg = 10;

      // 多维负面状态（Debuff）持续与叠层容器
      this.debuffs = {
        burn: { timer: 0, maxTimer: 2.5, stacks: 0, tickTimer: 0.42, dps: 5 },
        bleed: { timer: 0, maxTimer: 3.0, stacks: 0, tickTimer: 0.38, dps: 5 },
        chill: { timer: 0, maxTimer: 2.0, stacks: 0 },
        shock: { timer: 0, maxTimer: 2.8, stacks: 0 },
        expose: { timer: 0, maxTimer: 3.5, stacks: 0 }
      };
      this.statusVfxTick = Math.random() * 0.12;
      this.statusTextCd = 0;
      this.bleedScarFlash = 0;

      this.patrolDir = Math.random() < 0.5 ? -1 : 1;
      this.patrolTimer = 1.5 + Math.random() * 2;
      this.attackCd = 0.6 + Math.random() * 0.5;
      this.windupTimer = 0;
      this.windupMax = 0.4;
      this.windupAction = null;
      this.dashTimer = 0;
      this.dashVx = 0;
      this.stunTimer = 0;
      this.slowTimer = 0;
      this.flashTimer = 0;
      this.animTimer = Math.random() * 5;
    }

    /**
     * 施加负面状态 Debuff（支持叠层、刷新持续时间、状态飘字与音效）
     */
    applyDebuff(type, duration, opts, effects) {
      if (this.dead || !this.debuffs[type]) return;
      const o = opts || {};
      const meta = DEBUFF_META[type];
      const d = this.debuffs[type];
      const durScale = this.isBoss && type === 'chill' ? 0.72 : 1.0;
      const effDur = Math.max(0.3, (duration || 2.0) * durScale);

      const wasActive = d.timer > 0;
      d.timer = Math.max(d.timer, effDur);
      d.maxTimer = Math.max(effDur, d.timer);
      const addStacks = o.stacks || 1;
      d.stacks = Math.min(meta.maxStacks, (wasActive ? d.stacks : 0) + addStacks);

      if (o.dps !== undefined && o.dps > 0) {
        d.dps = Math.max(wasActive ? d.dps : 0, o.dps);
      }

      if (type === 'chill') {
        this.slowTimer = Math.max(this.slowTimer, d.timer);
      }

      if (!o.silent && effects && (!wasActive || this.statusTextCd <= 0)) {
        this.statusTextCd = 0.65;
        const stackStr = d.stacks > 1 ? `x${d.stacks}` : '';
        effects.spawnFloatingText(
          this.x,
          this.y - this.height - 16,
          `${meta.fullName}${stackStr}!`,
          meta.color,
          false
        );
        if (!wasActive) {
          if (type === 'chill') SoundFX.play('frost');
          else if (type === 'expose') SoundFX.play('armorBreak');
        }
      }
    }

    getActiveDebuffList() {
      const list = [];
      if (this.stunTimer > 0) {
        list.push({ id: 'stun', label: '晕', fullName: '眩晕', color: '#ffd60a', stacks: 1, ratio: Math.min(1, this.stunTimer / 1.8) });
      }
      const keys = ['expose', 'burn', 'bleed', 'shock', 'chill'];
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const d = this.debuffs[k];
        if (d && d.timer > 0.05) {
          const m = DEBUFF_META[k];
          list.push({
            id: k,
            label: m.label,
            fullName: m.fullName,
            color: m.color,
            stacks: d.stacks || 1,
            timer: d.timer,
            ratio: Math.max(0, Math.min(1, d.timer / Math.max(0.2, d.maxTimer || 2.0)))
          });
        }
      }
      return list;
    }

    receiveHit(hitOpts, effects) {
      if (this.dead) return false;
      const { isCrit, isHeavy, knockX, knockY, stunSec, ignoreShield, debuff, isSweetSpot, sourceX } = hitOpts;
      let dmg = hitOpts.dmg;

      // 正面持盾格挡判定（重击终结技或破甲状态可直接震裂护盾！）
      if (!this.isBoss && this.ai === 'front_shield' && !ignoreShield && this.stunTimer <= 0 && this.debuffs.expose.timer <= 0) {
        const fromFront = (sourceX - this.x) * this.dir > 0;
        if (fromFront) {
          if (isHeavy) {
            // 重击正面强行震裂盾防！
            this.stunTimer = Math.max(this.stunTimer, 0.65);
            this.dashTimer = 0;
            this.windupTimer = 0;
            this.applyDebuff('expose', 3.0, { silent: true }, effects);
            SoundFX.play('armorBreak');
            effects && effects.spawnDebris(this.x + this.dir * 12, this.y - 18, 6, ['#90e0ef', '#ffd60a'], -this.dir);
            effects && effects.spawnFloatingText(this.x, this.y - this.height - 18, '重击破盾!', '#ffd60a', true);
          } else {
            const chip = Math.max(1, Math.round(dmg * 0.14));
            this.hp = Math.max(1, this.hp - chip);
            this.scaleX = 0.88;
            this.scaleY = 1.12;
            SoundFX.play('shieldBlock');
            effects && effects.spawnHitFlash(this.x + this.dir * 14, this.y - 18, '#90e0ef', false, 0);
            effects && effects.spawnDirectionalSparks(this.x + this.dir * 14, this.y - 18, this.dir, 9, '#90e0ef');
            effects && effects.spawnFloatingText(this.x, this.y - 36, '格挡! 绕后/重击破防', '#90e0ef', false);
            return 'blocked';
          }
        }
      }

      // 破甲易伤 (+25%) 与 九天感电 (+15%) 增伤结算
      if (this.debuffs.expose.timer > 0) {
        dmg = Math.round(dmg * 1.25);
      }
      if (this.debuffs.shock.timer > 0) {
        dmg = Math.round(dmg * 1.15);
      }

      // 挂载技能/法宝附带的 Debuff
      if (debuff) {
        if (Array.isArray(debuff)) {
          for (let i = 0; i < debuff.length; i++) {
            const db = debuff[i];
            if (db && db.type) this.applyDebuff(db.type, db.duration, db, effects);
          }
        } else if (debuff.type) {
          this.applyDebuff(debuff.type, debuff.duration, debuff, effects);
        }
      }

      this.hp = Math.max(0, this.hp - dmg);
      this.flashTimer = 0.11;
      this.lastHitDmg = dmg;

      // 受击强烈挤压形变
      this.scaleX = isCrit || isHeavy ? 1.34 : 1.22;
      this.scaleY = isCrit || isHeavy ? 0.72 : 0.82;

      if (stunSec && stunSec > 0) {
        const actualStun = this.isBoss ? stunSec * 0.45 : stunSec;
        this.stunTimer = Math.max(this.stunTimer, actualStun);
        this.windupTimer = 0;
        this.dashTimer = 0; // 硬直立即打断冲锋伤害判定！
      }

      const kbScale = this.isBoss ? 0.18 : this.isElite ? 0.62 : 1.05;
      if (knockX) {
        this.vx = knockX * kbScale;
        if (Math.abs(this.vx) >= 115 && !this.isBoss) {
          this.knockbackTimer = 0.28;
          this.dashTimer = 0;
        }
      }
      if (knockY && !this.isBoss) {
        this.vy = Math.min(this.vy, knockY * kbScale);
      }

      const hitY = this.y - this.height * 0.55;
      const knockDir = knockX >= 0 ? 1 : -1;

      if (effects) {
        const flashCol = isSweetSpot ? '#00f5d4' : isCrit ? '#ffd60a' : '#ffffff';
        effects.spawnHitFlash(
          this.x + (Math.random() - 0.5) * 8,
          hitY + (Math.random() - 0.5) * 8,
          flashCol,
          isCrit || isHeavy || isSweetSpot
        );
        effects.spawnDirectionalSparks(
          this.x,
          hitY,
          knockDir,
          isCrit || isSweetSpot ? 14 : 8,
          isSweetSpot ? '#00f5d4' : isCrit ? '#ffd60a' : '#ff9f1c'
        );
        if (isCrit || isHeavy) {
          effects.spawnDebris(this.x, hitY, 4, [this.color || '#ff4d6d', '#ffd60a'], knockDir);
        }
        const prefix = isSweetSpot ? '锋芒 ' : isCrit ? '暴击 ' : '';
        const suffix = isCrit || isSweetSpot ? '!' : '';
        effects.spawnFloatingText(
          this.x,
          this.y - this.height - 8,
          `${prefix}${dmg}${suffix}`,
          isSweetSpot ? '#00f5d4' : isCrit ? '#ffd60a' : '#ffffff',
          isCrit || isSweetSpot
        );
      }

      if (this.hp <= 0) {
        this.triggerDeathBurst(effects, knockDir);
        return 'killed';
      }

      SoundFX.play(isCrit ? 'crit' : 'hit');
      return 'hit';
    }

    triggerDeathBurst(effects, knockDir) {
      this.dead = true;
      SoundFX.play('killBlow');
      const hitY = this.y - this.height * 0.55;
      if (effects) {
        effects.spawnHitFlash(this.x, hitY, '#ff0a54', true, 0.4);
        effects.spawnDebris(
          this.x,
          hitY,
          this.isBoss ? 24 : 10,
          [this.color || '#e63946', '#ffd166', '#ffffff'],
          knockDir || 1
        );
        effects.spawnParticles(this.x, hitY, this.isBoss ? 40 : 18, this.color || '#ff4d6d', 55, 240, 0.2, 0.5, 270);
      }
    }

    hasGroundAhead(level, dir) {
      const checkX = this.x + dir * (this.width * 0.5 + 8);
      const belowTile = getTileAtPx(level, checkX, this.y + 6);
      const frontHazard = getTileAtPx(level, checkX, this.y - 4);
      if (frontHazard === TILE_HAZARD) return false;
      return belowTile !== TILE_EMPTY && belowTile !== TILE_HAZARD;
    }

    update(dt, worldCtx) {
      if (this.dead) return;
      const { level, player, effects, onHitPlayer, triggerShake, onWallSplatKill } = worldCtx;

      this.animTimer += dt;
      this.flashTimer = Math.max(0, this.flashTimer - dt);
      this.attackCd = Math.max(0, this.attackCd - dt);
      this.statusTextCd = Math.max(0, this.statusTextCd - dt);
      this.bleedScarFlash = Math.max(0, this.bleedScarFlash - dt);

      // 双向同步原版 slowTimer / _burnTimer 与新版 chill / burn 状态（无缝兼容所有神通、法相与元素羁绊！）
      if (this.slowTimer > this.debuffs.chill.timer) {
        this.debuffs.chill.timer = this.slowTimer;
        this.debuffs.chill.maxTimer = Math.max(this.debuffs.chill.maxTimer, this.slowTimer);
        this.debuffs.chill.stacks = Math.max(1, this.debuffs.chill.stacks);
      }
      if (this._burnTimer && this._burnTimer > this.debuffs.burn.timer) {
        this.debuffs.burn.timer = this._burnTimer;
        this.debuffs.burn.maxTimer = Math.max(this.debuffs.burn.maxTimer, this._burnTimer);
        this.debuffs.burn.stacks = Math.max(1, this.debuffs.burn.stacks);
      }

      // 更新五大 Debuff 计时与持续 DoT 伤害（灼烧 & 流血）
      const dbKeys = ['burn', 'bleed', 'chill', 'shock', 'expose'];
      for (let i = 0; i < dbKeys.length; i++) {
        const k = dbKeys[i];
        const d = this.debuffs[k];
        if (d.timer > 0) {
          d.timer = Math.max(0, d.timer - dt);
          if (d.timer <= 0) {
            d.stacks = 0;
          }
        }
      }
      this.slowTimer = Math.max(0, this.debuffs.chill.timer);
      this._burnTimer = Math.max(0, this.debuffs.burn.timer);

      // 1. 三昧真火【灼烧】持续伤害结算
      if (this.debuffs.burn.timer > 0) {
        const b = this.debuffs.burn;
        b.tickTimer -= dt;
        if (b.tickTimer <= 0) {
          b.tickTimer = 0.46;
          const burnDmg = Math.max(2, Math.round(b.dps * (0.68 + b.stacks * 0.34)));
          this.hp = Math.max(0, this.hp - burnDmg);
          if (effects) {
            effects.spawnElementalParticles(this.x, this.y - this.height * 0.6, 3, 'flame', { spreadX: this.width * 0.6, spreadY: 10 });
            effects.spawnFloatingText(this.x, this.y - this.height - 6, `🔥${burnDmg}`, '#ff6e40', false);
          }
          if (this.hp <= 0) {
            this.triggerDeathBurst(effects, -this.dir);
            onWallSplatKill && onWallSplatKill(this);
            return;
          }
        }
      }

      // 2. 撕裂伤口【流血】持续伤害结算（移动挣扎中的妖魔流血伤害提升 35%！）
      if (this.debuffs.bleed.timer > 0) {
        const bl = this.debuffs.bleed;
        bl.tickTimer -= dt;
        if (bl.tickTimer <= 0) {
          bl.tickTimer = 0.42;
          const movingBonus = Math.abs(this.vx) > 22 ? 1.35 : 1.0;
          const bleedDmg = Math.max(2, Math.round(bl.dps * (0.65 + bl.stacks * 0.35) * movingBonus));
          this.hp = Math.max(0, this.hp - bleedDmg);
          this.bleedScarFlash = 0.16;
          if (effects) {
            effects.spawnElementalParticles(this.x, this.y - this.height * 0.55, 4, 'blood', {
              dir: -this.dir,
              spreadX: this.width * 0.5,
              spreadY: 8
            });
            effects.spawnFloatingText(this.x, this.y - this.height - 6, `🩸${bleedDmg}`, '#ff2a54', false);
          }
          if (this.hp <= 0) {
            this.triggerDeathBurst(effects, -this.dir);
            onWallSplatKill && onWallSplatKill(this);
            return;
          }
        }
      }

      // 3. 持续负面状态环身粒子喷发（火苗/霜晶/电弧/血滴）
      this.statusVfxTick -= dt;
      if (this.statusVfxTick <= 0 && effects) {
        this.statusVfxTick = 0.13;
        const cy = this.y - this.height * 0.55;
        if (this.debuffs.burn.timer > 0) {
          effects.spawnElementalParticles(this.x, cy, 1, 'flame', { spreadX: this.width * 0.7, spreadY: this.height * 0.4 });
        }
        if (this.debuffs.chill.timer > 0) {
          effects.spawnElementalParticles(this.x, cy, 1, 'frost', { spreadX: this.width * 0.7, spreadY: this.height * 0.5 });
        }
        if (this.debuffs.bleed.timer > 0 && Math.random() < 0.65) {
          effects.spawnElementalParticles(this.x, cy, 1, 'blood', { spreadX: this.width * 0.4, spreadY: 6 });
        }
        if (this.debuffs.shock.timer > 0 && Math.random() < 0.6) {
          effects.spawnLightningBolt(
            this.x - this.width * 0.4,
            cy + (Math.random() - 0.5) * 14,
            this.x + this.width * 0.4,
            cy + (Math.random() - 0.5) * 14,
            '#00f5d4',
            1.6,
            0.09
          );
        }
      }

      // 形变弹簧恢复
      this.scaleX += (1 - this.scaleX) * Math.min(1, dt * 14);
      this.scaleY += (1 - this.scaleY) * Math.min(1, dt * 14);

      const speedMult = this.slowTimer > 0 ? 0.55 : 1.0;

      if (this.knockbackTimer > 0) {
        this.knockbackTimer = Math.max(0, this.knockbackTimer - dt);
      }

      if (this.stunTimer > 0 || this.knockbackTimer > 0) {
        this.stunTimer = Math.max(0, this.stunTimer - dt);
        this.dashTimer = 0;
        if (this.knockbackTimer <= 0) {
          this.vx *= Math.pow(0.02, dt);
        }
        const preVx = this.vx;
        this.vy = Math.min(720, this.vy + GRAVITY * dt);
        this.hitWall = 0;
        moveAndCollide(level, this, dt);

        // 触发《死亡细胞》招牌【击飞撞墙粉碎 Wall-Splat】+ 真实附加 3.5 秒【破甲易伤】！
        if (this.knockbackTimer > 0 && this.hitWall !== 0 && Math.abs(preVx) > 95) {
          this.knockbackTimer = 0;
          const splatMult = (player && player.wallSplatMult) || 1.0;
          const splatDmg = Math.max(6, Math.round(this.lastHitDmg * 0.45 * splatMult));
          this.hp = Math.max(0, this.hp - splatDmg);
          this.stunTimer = Math.max(this.stunTimer, 0.88);
          this.windupTimer = 0;
          this.flashTimer = 0.14;
          this.scaleX = 0.68;
          this.scaleY = 1.36;
          this.vx = -this.hitWall * 65;
          this.applyDebuff('expose', 3.5, { silent: true }, effects);

          SoundFX.play('wallSplat');
          triggerShake && triggerShake(7, this.hitWall, 0);
          worldCtx.onWallSplat && worldCtx.onWallSplat(this, splatDmg);
          if (effects) {
            effects.spawnHitFlash(this.x + this.hitWall * 10, this.y - 18, '#ff9f1c', true, 0);
            effects.spawnDebris(this.x + this.hitWall * 8, this.y - 16, 8, ['#adb5bd', '#ff9f1c', '#ffd60a'], -this.hitWall);
            effects.spawnFloatingText(this.x, this.y - this.height - 14, `撞墙破甲 -${splatDmg}!`, '#ff9f1c', true);
          }
          if (worldCtx.onWallSplat) {
            worldCtx.onWallSplat(this, splatDmg);
          }
          if (this.hp <= 0 && !this.dead) {
            this.dead = true;
            onWallSplatKill && onWallSplatKill(this);
          }
        }
        return;
      }

      if (this.isBoss) {
        this.updateBossAI(dt, speedMult, worldCtx);
      } else {
        this.updateMobAI(dt, speedMult, worldCtx);
      }

      this.vy = Math.min(720, this.vy + GRAVITY * dt);
      this.hitWall = 0;
      moveAndCollide(level, this, dt);

      if (this.hitWall !== 0) {
        this.patrolDir = -this.hitWall;
      }

      if (this.dashTimer > 0 && this.stunTimer <= 0 && player && !player.dead) {
        if (
          Math.abs(player.x - this.x) < (this.width + player.width) * 0.42 &&
          Math.abs(player.y - player.height * 0.5 - (this.y - this.height * 0.5)) < (this.height + player.height) * 0.42
        ) {
          onHitPlayer && onHitPlayer(this.atk, player.x >= this.x ? 1 : -1);
        }
      }
    }

    updateMobAI(dt, speedMult, worldCtx) {
      const { level, player } = worldCtx;
      if (!player || player.dead) {
        this.vx = 0;
        return;
      }

      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.hypot(dx, dy);

      if (this.windupTimer > 0) {
        const chillScale = this.slowTimer > 0 ? 0.72 : 1.0;
        this.windupTimer -= dt * chillScale;
        this.vx *= Math.pow(0.01, dt);
        if (this.windupTimer <= 0) {
          this.performMobAttack(worldCtx);
        }
        return;
      }

      if (this.dashTimer > 0) {
        this.dashTimer -= dt;
        this.vx = this.dashVx * speedMult;
        return;
      }

      if (dist < 280 && Math.abs(dy) < 96) {
        this.dir = dx >= 0 ? 1 : -1;

        const isRangedAI =
          this.ai === 'ranged_arrow' ||
          this.ai === 'ranged_burst' ||
          this.ai === 'teleport_mage' ||
          this.ai === 'web_trap' ||
          this.ai === 'poison_dart';

        if (dist <= this.attackRange && this.attackCd <= 0) {
          this.windupMax = isRangedAI ? 0.42 : 0.36;
          this.windupTimer = this.windupMax;
          this.attackCd = this.attackCdBase;
          this.scaleX = 0.9;
          this.scaleY = 1.1;
          return;
        }

        if (isRangedAI) {
          if (dist < 105 && this.hasGroundAhead(level, -this.dir)) {
            this.vx = -this.dir * this.speed * 0.8 * speedMult;
          } else if (dist > this.attackRange * 0.88 && this.hasGroundAhead(level, this.dir)) {
            this.vx = this.dir * this.speed * speedMult;
          } else {
            this.vx *= 0.8;
          }
        } else {
          if (Math.abs(dx) > 22 && this.hasGroundAhead(level, this.dir)) {
            this.vx = this.dir * this.speed * speedMult;
          } else {
            this.vx *= 0.8;
          }
        }
      } else {
        this.patrolTimer -= dt;
        if (this.patrolTimer <= 0 || !this.hasGroundAhead(level, this.patrolDir)) {
          this.patrolDir = -this.patrolDir;
          this.patrolTimer = 1.6 + Math.random() * 1.8;
        }
        this.dir = this.patrolDir;
        this.vx = this.patrolDir * this.speed * 0.55 * speedMult;
      }
    }

    performMobAttack(worldCtx) {
      const { player, effects, onHitPlayer, level } = worldCtx;
      if (!player || player.dead) return;
      this.scaleX = 1.18;
      this.scaleY = 0.86;

      if (this.ai === 'ranged_arrow') {
        effects.spawnProjectile({
          owner: 'enemy',
          kind: 'fire_arrow',
          x: this.x + this.dir * 12,
          y: this.y - 18,
          vx: this.dir * 275,
          vy: -10,
          radius: 5,
          dmg: this.atk,
          playerDebuff: 'singe',
          color: '#ff5400',
          coreColor: '#ffd166',
          life: 1.8
        });
      } else if (this.ai === 'ranged_burst') {
        for (let k = -1; k <= 1; k++) {
          effects.spawnProjectile({
            owner: 'enemy',
            kind: 'flame_orb',
            x: this.x + this.dir * 12,
            y: this.y - 18,
            vx: this.dir * 235,
            vy: k * 55,
            radius: 6,
            dmg: this.atk,
            playerDebuff: 'singe',
            color: '#ff9f1c',
            coreColor: '#ffffff',
            life: 1.7
          });
        }
      } else if (this.ai === 'teleport_mage') {
        effects.spawnProjectile({
          owner: 'enemy',
          kind: 'homing_wisp',
          x: this.x + this.dir * 10,
          y: this.y - 20,
          vx: this.dir * 155,
          vy: -35,
          radius: 7,
          dmg: this.atk,
          color: '#80ffdb',
          coreColor: '#7209b7',
          life: 2.3
        });
        if (Math.random() < 0.45 && this.hasGroundAhead(level, -this.dir)) {
          effects.spawnParticles(this.x, this.y - 16, 8, '#80ffdb', 25, 80, 0.12, 0.25, 0);
          this.x -= this.dir * 38;
        }
      } else if (this.ai === 'web_trap') {
        // 盘丝蛛精 / 荆棘十八公：喷吐天罗蛛网球（命中施加蛛网缠足减速，翻滚可挣脱！）
        effects.spawnProjectile({
          owner: 'enemy',
          kind: 'web_orb',
          x: this.x + this.dir * 12,
          y: this.y - 18,
          vx: this.dir * 225,
          vy: -12,
          radius: 7,
          dmg: this.atk,
          playerDebuff: 'web',
          color: '#f72585',
          coreColor: '#ffffff',
          life: 1.9
        });
      } else if (this.ai === 'poison_dart') {
        // 黄花观毒蜂 / 无底洞夜鼠：二连高速碧毒针（命中附加轻微奇毒状态，饮甘露可净毒！）
        [-18, 12].forEach((vyOff) => {
          effects.spawnProjectile({
            owner: 'enemy',
            kind: 'venom_needle',
            x: this.x + this.dir * 12,
            y: this.y - 18,
            vx: this.dir * 305,
            vy: vyOff,
            radius: 4,
            dmg: Math.max(1, Math.round(this.atk * 0.72)),
            playerDebuff: 'poison',
            color: '#80ffdb',
            coreColor: '#ff0a54',
            life: 1.5
          });
        });
      } else if (this.ai === 'whirl_charge') {
        this.dashTimer = 0.32;
        this.dashVx = this.dir * 295;
        effects.spawnSlashArc({
          x: this.x + this.dir * 14,
          y: this.y - 16,
          dir: this.dir,
          radiusX: 38,
          radiusY: 22,
          style: 'spin360',
          color: this.color || '#00f5d4',
          duration: 0.24
        });
      } else if (this.ai === 'heavy_cleave') {
        effects.spawnSlashArc({
          x: this.x + this.dir * 22,
          y: this.y - 20,
          dir: this.dir,
          radiusX: this.attackRange + 14,
          radiusY: 34,
          heavy: true,
          color: this.color || '#ffd166',
          duration: 0.2
        });
        effects.spawnZone({
          kind: 'shockwave_ring',
          x: this.x + this.dir * 20,
          y: this.y - 6,
          radius: 56,
          color: this.color || '#ffd166',
          duration: 0.22
        });
        effects.spawnZone({
          kind: 'earth_crater',
          x: this.x + this.dir * 24,
          y: this.y,
          radius: 26,
          color: this.color || '#ffd166',
          duration: 1.8
        });
        if (
          Math.abs(player.x - this.x) <= this.attackRange + 18 &&
          Math.abs(player.y - this.y) <= 40 &&
          (player.x - this.x) * this.dir >= -10
        ) {
          onHitPlayer && onHitPlayer(this.atk, this.dir);
        }
      } else if (this.ai === 'leap_slash') {
        this.dashTimer = 0.24;
        this.dashVx = this.dir * 285;
        this.vy = -180;
        effects.spawnSlashArc({
          x: this.x + this.dir * 22,
          y: this.y - 18,
          dir: this.dir,
          radiusX: 46,
          radiusY: 28,
          color: '#f4a261',
          duration: 0.16
        });
      } else {
        effects.spawnSlashArc({
          x: this.x + this.dir * 18,
          y: this.y - 18,
          dir: this.dir,
          radiusX: this.attackRange + 8,
          radiusY: 28,
          color: '#ff4d6d',
          duration: 0.15
        });
        if (
          Math.abs(player.x - this.x) <= this.attackRange + 12 &&
          Math.abs(player.y - this.y) <= 36 &&
          (player.x - this.x) * this.dir >= -8
        ) {
          onHitPlayer && onHitPlayer(this.atk, this.dir);
        }
      }
    }

    updateBossAI(dt, speedMult, worldCtx) {
      const { player, effects, triggerShake } = worldCtx;
      if (!player || player.dead) {
        this.vx = 0;
        return;
      }

      if (!this.activated) {
        if (player.x >= this.arenaLeftX - 40) {
          this.activated = true;
          SoundFX.play('bossAlert');
          triggerShake && triggerShake(8, 0, 1);
          effects.spawnFloatingText(this.x, this.y - 60, `${this.name} 降临！`, '#ffba08', true);
        } else {
          this.vx = 0;
          return;
        }
      }

      const enraged = this.hp < this.maxHp * 0.5;

      if (this.windupTimer > 0) {
        const chillScale = this.slowTimer > 0 ? 0.78 : 1.0;
        this.windupTimer -= dt * chillScale;
        this.vx *= Math.pow(0.01, dt);
        if (this.windupTimer <= 0) {
          this.executeBossPattern(this.windupAction, enraged, worldCtx);
        }
        return;
      }

      if (this.dashTimer > 0) {
        this.dashTimer -= dt;
        this.vx = this.dashVx * speedMult;
        return;
      }

      const dx = player.x - this.x;
      this.dir = dx >= 0 ? 1 : -1;

      if (this.attackCd <= 0) {
        const pat = this.patterns[this.patternIdx % this.patterns.length];
        this.patternIdx++;
        this.windupAction = pat;
        this.windupMax = enraged ? 0.44 : 0.56;
        this.windupTimer = this.windupMax;
        this.attackCd = enraged ? 1.35 : 1.85;
        this.scaleX = 0.88;
        this.scaleY = 1.14;
        return;
      }

      if (Math.abs(dx) > 54) {
        this.vx = this.dir * this.speed * speedMult * (enraged ? 1.2 : 1.0);
      } else {
        this.vx *= 0.8;
      }
    }

    executeBossPattern(pat, enraged, worldCtx) {
      const { player, effects, onHitPlayer, triggerShake } = worldCtx;
      if (!player || player.dead) return;
      this.scaleX = 1.24;
      this.scaleY = 0.82;

      if (pat === 'spear_charge' || pat === 'trident_dash' || pat === 'bull_stampede') {
        this.dashTimer = pat === 'bull_stampede' ? 0.52 : 0.36;
        this.dashVx = this.dir * (pat === 'bull_stampede' ? 375 : 330);
        SoundFX.play('slash3');
        effects.spawnSlashArc({
          x: this.x + this.dir * 26,
          y: this.y - 24,
          dir: this.dir,
          radiusX: 66,
          radiusY: 38,
          color: this.accent || '#ff5400',
          heavy: true,
          duration: 0.22
        });
      } else if (pat === 'black_wind_slam' || pat === 'quake_cudgel') {
        triggerShake && triggerShake(10, 0, 1);
        SoundFX.play('slam');
        effects.spawnZone({
          kind: 'shockwave_ring',
          x: this.x,
          y: this.y - 10,
          radius: 135,
          color: this.accent || '#ffba08',
          duration: 0.35
        });
        effects.spawnZone({
          kind: 'earth_crater',
          x: this.x,
          y: this.y,
          radius: 52,
          color: this.accent || '#ffba08',
          duration: 2.4
        });
        if (Math.hypot(player.x - this.x, player.y - this.y) <= 126) {
          onHitPlayer && onHitPlayer(Math.round(this.atk * 1.15), player.x >= this.x ? 1 : -1);
        }
        [-1, 1].forEach((d) => {
          effects.spawnProjectile({
            owner: 'enemy',
            kind: 'ground_wave',
            x: this.x + d * 20,
            y: this.y - 10,
            vx: d * (enraged ? 280 : 230),
            vy: 0,
            radius: 9,
            dmg: this.atk,
            color: this.accent || '#ff5400',
            life: 1.6
          });
        });
      } else if (pat === 'fire_orbs' || pat === 'sand_barrage' || pat === 'soul_spiral') {
        const count = enraged ? 5 : 3;
        const baseAng = Math.atan2(player.y - 18 - (this.y - 24), player.x - this.x);
        for (let i = 0; i < count; i++) {
          const offset = (i - (count - 1) / 2) * 0.24;
          const ang = baseAng + offset;
          effects.spawnProjectile({
            owner: 'enemy',
            kind: pat === 'fire_orbs' ? 'flame_orb' : 'boss_orb',
            x: this.x + this.dir * 16,
            y: this.y - 24,
            vx: Math.cos(ang) * 255,
            vy: Math.sin(ang) * 255,
            radius: 7,
            dmg: this.atk,
            playerDebuff: pat === 'fire_orbs' ? 'singe' : null,
            color: this.accent || '#ff4800',
            coreColor: '#ffffff',
            life: 2.2
          });
        }
      } else if (pat === 'samadhi_tornado') {
        effects.spawnProjectile({
          owner: 'enemy',
          kind: 'tornado',
          x: this.x + this.dir * 22,
          y: this.y - 20,
          vx: this.dir * 195,
          vy: 0,
          radius: 18,
          dmg: this.atk,
          passWall: true,
          color: '#e9c46a',
          life: 2.0
        });
      } else if (pat === 'phantom_blink') {
        effects.spawnParticles(this.x, this.y - 22, 16, '#80ffdb', 35, 130, 0.15, 0.3, 0);
        const targetX = Math.max(this.arenaLeftX + 36, Math.min(this.arenaRightX - 36, player.x - player.dir * 58));
        this.x = targetX;
        this.dir = player.x >= this.x ? 1 : -1;
        effects.spawnParticles(this.x, this.y - 22, 16, '#b5179e', 35, 130, 0.15, 0.3, 0);
        this.dashTimer = 0.2;
        this.dashVx = this.dir * 260;
      } else if (pat === 'bone_spikes') {
        const spikeCount = enraged ? 4 : 3;
        for (let i = 0; i < spikeCount; i++) {
          const sx = Math.max(this.arenaLeftX + 30, Math.min(this.arenaRightX - 30, player.x + (i - 1) * 68));
          effects.spawnZone({
            kind: 'boss_spike_warn',
            x: sx,
            y: this.y,
            radius: 24,
            dmg: this.atk,
            duration: 0.68
          });
        }
      } else if (pat === 'meteor_rain') {
        triggerShake && triggerShake(7, 0, 1);
        const meteors = enraged ? 6 : 4;
        for (let i = 0; i < meteors; i++) {
          const mx = this.arenaLeftX + 40 + Math.random() * (this.arenaRightX - this.arenaLeftX - 80);
          effects.spawnProjectile({
            owner: 'enemy',
            kind: 'meteor',
            x: mx,
            y: this.y - 210 - i * 35,
            vx: (Math.random() - 0.5) * 40,
            vy: 235,
            radius: 10,
            dmg: this.atk,
            playerDebuff: 'singe',
            color: '#ff4800',
            coreColor: '#ffba08',
            life: 2.0
          });
        }
      } else if (pat === 'treasure_vortex') {
        SoundFX.play('bossAlert');
        triggerShake && triggerShake(7, 0, 1);
        effects.spawnZone({
          kind: 'shockwave_ring',
          x: this.x,
          y: this.y - 24,
          radius: 165,
          color: this.accent || '#ffd60a',
          duration: 0.42
        });
        const pullDx = this.x - player.x;
        if (Math.abs(pullDx) < 230) {
          player.vx += Math.sign(pullDx) * 260;
        }
        const ringCount = enraged ? 8 : 6;
        for (let i = 0; i < ringCount; i++) {
          const ang = (Math.PI * 2 * i) / ringCount;
          effects.spawnProjectile({
            owner: 'enemy',
            kind: 'boss_orb',
            x: this.x,
            y: this.y - 24,
            vx: Math.cos(ang) * 225,
            vy: Math.sin(ang) * 225,
            radius: 7,
            dmg: this.atk,
            color: this.accent || '#ffd60a',
            coreColor: '#ffffff',
            life: 2.0
          });
        }
      } else if (pat === 'scorpion_sting') {
        this.vy = -255;
        this.dashTimer = 0.28;
        this.dashVx = this.dir * 320;
        SoundFX.play('slash3');
        const rays = enraged ? 5 : 4;
        const baseAng = Math.atan2(player.y - 18 - (this.y - 26), player.x - this.x);
        for (let i = 0; i < rays; i++) {
          const ang = baseAng + (i - (rays - 1) / 2) * 0.18;
          effects.spawnProjectile({
            owner: 'enemy',
            kind: 'venom_needle',
            x: this.x + this.dir * 14,
            y: this.y - 26,
            vx: Math.cos(ang) * 310,
            vy: Math.sin(ang) * 310,
            radius: 6,
            dmg: this.atk,
            playerDebuff: 'poison',
            color: this.accent || '#ff0a54',
            coreColor: '#ffd60a',
            life: 1.9
          });
        }
      } else if (pat === 'nine_roar_stun') {
        triggerShake && triggerShake(11, 0, 1);
        SoundFX.play('slam');
        effects.spawnZone({
          kind: 'shockwave_ring',
          x: this.x,
          y: this.y - 20,
          radius: 155,
          color: this.color || '#00f5d4',
          duration: 0.38
        });
        if (Math.hypot(player.x - this.x, player.y - this.y) <= 145) {
          onHitPlayer && onHitPlayer(Math.round(this.atk * 1.1), player.x >= this.x ? 1 : -1);
        }
        const wisps = enraged ? 3 : 2;
        for (let i = 0; i < wisps; i++) {
          effects.spawnProjectile({
            owner: 'enemy',
            kind: 'homing_wisp',
            x: this.x + (i - 0.5) * 24,
            y: this.y - 34,
            vx: this.dir * 165,
            vy: -55 - i * 25,
            radius: 7,
            dmg: this.atk,
            color: this.accent || '#ffd166',
            coreColor: '#ffffff',
            life: 2.4
          });
        }
      }
    }

    render(ctx, camX, camY, assetLoader) {
      if (this.dead) return;
      const sx = Math.round(this.x - camX);
      const sy = Math.round(this.y - camY);

      ctx.save();

      // 0. 脚底立体贴地阴影椭圆（大幅提升怪物体积感与空间着地感）
      ctx.fillStyle = 'rgba(8, 6, 14, 0.45)';
      ctx.beginPath();
      ctx.ellipse(sx, sy - 1, Math.max(8, this.width * 0.48), 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // 精英紫金法环与 Boss 狂暴红气圈
      if (this.isElite) {
        ctx.strokeStyle = '#c77dff';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(sx, sy - 3, this.width * 0.72, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (this.isBoss && this.activated && this.hp < this.maxHp * 0.5) {
        ctx.strokeStyle = 'rgba(255, 42, 84, 0.75)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(sx, sy - 3, this.width * 0.75 + Math.sin(this.animTimer * 14) * 3, 7, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      let spr = null;
      if (this.isBoss) {
        const bFrame = this.flashTimer > 0 ? 'flash' : Math.floor(this.animTimer * 4.5) % 2 === 0 ? 'f0' : 'f1';
        spr = assetLoader.getBossSprite(this.typeId, bFrame);
      } else {
        const animSpd = this.slowTimer > 0 ? 3.2 : 6;
        const fName = this.flashTimer > 0 ? 'flash' : Math.floor(this.animTimer * animSpd) % 2 === 0 ? 'f0' : 'f1';
        spr = assetLoader.getEnemySprite(this.typeId, fName);
      }

      // 根据当前主导 Debuff 对像素精灵进行元素附着染色！
      if (spr && this.flashTimer <= 0 && assetLoader && assetLoader.getTintedSprite) {
        if (this.debuffs.chill.timer > 0) {
          spr = assetLoader.getTintedSprite(spr, '#48cae4', 'overlay');
        } else if (this.debuffs.burn.timer > 0) {
          spr = assetLoader.getTintedSprite(spr, '#ff6e40', 'overlay');
        } else if (this.debuffs.shock.timer > 0 && Math.floor(this.animTimer * 18) % 2 === 0) {
          spr = assetLoader.getTintedSprite(spr, '#00f5d4', 'overlay');
        } else if (this.debuffs.expose.timer > 0) {
          spr = assetLoader.getTintedSprite(spr, '#ff2a54', 'overlay');
        }
      }

      ctx.save();
      ctx.translate(sx, sy);
      if (this.dir < 0) ctx.scale(-1, 1);
      ctx.scale(this.scaleX, this.scaleY);

      if (spr) {
        const bob = this.isBoss ? Math.round(Math.sin(this.animTimer * 4) * 1.5) : 0;
        const lw = spr._logicalW || spr.width;
        const lh = spr._logicalH || spr.height;
        ctx.drawImage(spr, -lw / 2, -lh + bob, lw, lh);
      } else {
        ctx.fillStyle = this.color || '#e63946';
        ctx.fillRect(-this.width / 2, -this.height, this.width, this.height);
      }
      ctx.restore();

      // ==================== 妖魔全身实时 Debuff 状态动效叠加 ====================
      // A. 【寒霜减速】：双足冰晶棱刺封冻动效
      if (this.debuffs.chill.timer > 0) {
        ctx.fillStyle = 'rgba(144, 224, 239, 0.78)';
        const hw = Math.round(this.width * 0.42);
        ctx.beginPath();
        ctx.moveTo(sx - hw - 3, sy);
        ctx.lineTo(sx - hw + 2, sy - 10);
        ctx.lineTo(sx - 2, sy - 4);
        ctx.lineTo(sx + 3, sy - 12);
        ctx.lineTo(sx + hw + 3, sy);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx - hw + 1, sy - 6, 2, 4);
        ctx.fillRect(sx + 2, sy - 8, 2, 5);
      }

      // B. 【三昧灼烧】：躯干表面跳动火舌动效
      if (this.debuffs.burn.timer > 0) {
        const stacks = Math.max(1, this.debuffs.burn.stacks);
        for (let f = 0; f < stacks + 1; f++) {
          const fx = sx + Math.sin(this.animTimer * 9 + f * 2.1) * (this.width * 0.32);
          const fy = sy - this.height * (0.35 + (f % 2) * 0.25);
          const fh = 5 + Math.abs(Math.sin(this.animTimer * 18 + f)) * 6;
          ctx.fillStyle = f % 2 === 0 ? '#ff6e40' : '#ffd60a';
          ctx.beginPath();
          ctx.moveTo(fx - 3, fy);
          ctx.lineTo(fx, fy - fh);
          ctx.lineTo(fx + 3, fy);
          ctx.closePath();
          ctx.fill();
        }
      }

      // C. 【撕裂流血】：猩红裂痕脉冲动效
      if (this.debuffs.bleed.timer > 0) {
        ctx.strokeStyle = this.bleedScarFlash > 0 ? '#ffffff' : '#ff0a54';
        ctx.lineWidth = this.bleedScarFlash > 0 ? 2.4 : 1.5;
        const cy = sy - this.height * 0.55;
        ctx.beginPath();
        ctx.moveTo(sx - 7, cy - 6);
        ctx.lineTo(sx + 7, cy + 6);
        if (this.debuffs.bleed.stacks >= 2) {
          ctx.moveTo(sx + 6, cy - 6);
          ctx.lineTo(sx - 6, cy + 6);
        }
        ctx.stroke();
      }

      // D. 【九天感电】：躯干折线游走雷弧
      if (this.debuffs.shock.timer > 0) {
        ctx.strokeStyle = Math.floor(this.animTimer * 22) % 2 === 0 ? '#00f5d4' : '#ffffff';
        ctx.lineWidth = 1.4;
        const cy = sy - this.height * 0.55;
        ctx.beginPath();
        ctx.moveTo(sx - this.width * 0.45, cy - 5);
        ctx.lineTo(sx - 2, cy + (Math.sin(this.animTimer * 35) * 5));
        ctx.lineTo(sx + 3, cy - (Math.cos(this.animTimer * 30) * 5));
        ctx.lineTo(sx + this.width * 0.45, cy + 4);
        ctx.stroke();
      }

      // E. 【破甲易伤】：头顶/胸前碎裂金红护盾裂纹印记
      if (this.debuffs.expose.timer > 0) {
        const pulse = Math.sin(this.animTimer * 14) * 1.5;
        const ey = sy - this.height * 0.65;
        ctx.strokeStyle = '#ffd60a';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(sx - 6 - pulse * 0.4, ey - 5);
        ctx.lineTo(sx - 1, ey - 5);
        ctx.lineTo(sx - 3, ey + 4);
        ctx.moveTo(sx + 6 + pulse * 0.4, ey - 5);
        ctx.lineTo(sx + 1, ey - 5);
        ctx.lineTo(sx + 3, ey + 4);
        ctx.stroke();
      }

      ctx.restore();

      // ==================== 血条、头顶眩晕星环、前摇寒芒与 Debuff 徽章栏 ====================
      const activeDebuffs = this.getActiveDebuffList();

      if (!this.isBoss && (this.hp < this.maxHp || this.isElite || activeDebuffs.length > 0)) {
        const bw = this.isElite ? 34 : 26;
        const bx = sx - Math.floor(bw / 2);
        const by = sy - this.height - 8;
        ctx.fillStyle = '#141019';
        ctx.fillRect(bx - 1, by - 1, bw + 2, 5);
        ctx.fillStyle = this.isElite ? '#c77dff' : '#ff4d6d';
        ctx.fillRect(bx, by, Math.max(1, Math.round((this.hp / this.maxHp) * bw)), 3);

        // 头顶微型状态徽章序列（直观展示灼/血/霜/电/破/晕及层数）
        if (activeDebuffs.length > 0) {
          const badgeW = 9;
          const totalW = activeDebuffs.length * (badgeW + 2) - 2;
          let startX = sx - Math.floor(totalW / 2);
          const badgeY = by - 11;
          for (let i = 0; i < activeDebuffs.length; i++) {
            const db = activeDebuffs[i];
            ctx.fillStyle = 'rgba(14, 10, 22, 0.9)';
            ctx.fillRect(startX, badgeY, badgeW, 9);
            ctx.fillStyle = db.color;
            ctx.fillRect(startX, badgeY + 7, Math.max(1, Math.round(badgeW * db.ratio)), 2);
            ctx.font = 'bold 7px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(db.stacks > 1 ? `${db.label}${db.stacks}` : db.label, startX + badgeW * 0.5, badgeY + 6.5);
            startX += badgeW + 2;
          }
        }
      }

      // 升级版 3D 环绕金星眩晕动效
      if (this.stunTimer > 0) {
        const starY = sy - this.height - (activeDebuffs.length > 0 ? 22 : 14);
        for (let s = 0; s < 3; s++) {
          const ang = this.animTimer * 10 + (s * Math.PI * 2) / 3;
          const ox = Math.cos(ang) * 10;
          const oy = Math.sin(ang) * 3;
          ctx.fillStyle = s === 0 ? '#ffffff' : '#ffd60a';
          ctx.fillRect(Math.round(sx + ox) - 2, Math.round(starY + oy) - 1, 4, 2);
          ctx.fillRect(Math.round(sx + ox) - 1, Math.round(starY + oy) - 2, 2, 4);
        }
      }

      // 怪物出招前摇感叹号 `!` + 兵刃红芒十字寒星（极高辨识度防偷袭）
      if (this.windupTimer > 0) {
        const blink = Math.floor(this.windupTimer * 24) % 2 === 0;
        const wy = sy - this.height - (activeDebuffs.length > 0 ? 26 : 20);
        ctx.fillStyle = blink ? '#ff2a2a' : '#ffd60a';
        ctx.fillRect(sx - 2, wy - 8, 4, 9);
        ctx.fillRect(sx - 2, wy + 3, 4, 3);

        // 出手瞬间前 0.16 秒兵刃寒芒十字闪光
        if (this.windupTimer < 0.18) {
          const gx = sx + this.dir * Math.round(this.width * 0.55);
          const gy = sy - Math.round(this.height * 0.55);
          ctx.strokeStyle = '#ff2a54';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(gx - 7, gy);
          ctx.lineTo(gx + 7, gy);
          ctx.moveTo(gx, gy - 7);
          ctx.lineTo(gx, gy + 7);
          ctx.stroke();
        }
      }
    }
  }

  return {
    Enemy
  };
});
