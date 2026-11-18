/**
 * 进阶像素粒子引擎、状态残留场、闪电链、染色残影与连续射线投射物系统 (src/entities/effects.js)
 * 核心特性：
 * 1. 多形态元素粒子（三昧火苗/金莲花瓣/玄冰霜星/雷霆电弧/撕裂血珠/奇毒气泡/烟尘气环/功德符文）
 * 2. 战场状态残留（三昧火海、九天雷痕、金莲净土、玄水寒霜池、裂地碎岩坑、蛛网/毒液残留）
 * 3. 程序化分叉闪电链、嗜血元气虹吸珠、法宝祭出幻象、真龙贯空龙影、混天绫丝带流光
 * 4. 像素级染色残影与连续线段扫掠碰撞（Swept AABB），彻底杜绝高速弹幕穿模漏判
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
})('effects', function (require) {
  const { TILE_SOLID, getTileAtPx } = require('../world/levelGen');
  const SoundFX = require('../audio/soundFX');

  const MAX_PARTICLES = 320;
  const MAX_BLOOD_SPECKS = 48;

  /**
   * 线段 (x1,y1)->(x2,y2) 与中心 (cx,cy)、半宽高 (hw,hh) 矩形的连续扫掠相交检测
   * 解决高移速投射物在低帧率或薄体型妖魔上穿模漏判问题
   */
  function segmentIntersectsBox(x1, y1, x2, y2, cx, cy, hw, hh) {
    const minX = cx - hw;
    const maxX = cx + hw;
    const minY = cy - hh;
    const maxY = cy + hh;

    if (x2 >= minX && x2 <= maxX && y2 >= minY && y2 <= maxY) return true;

    let t0 = 0;
    let t1 = 1;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const checks = [
      [-dx, x1 - minX],
      [dx, maxX - x1],
      [-dy, y1 - minY],
      [dy, maxY - y1]
    ];
    for (let i = 0; i < 4; i++) {
      const p = checks[i][0];
      const q = checks[i][1];
      if (Math.abs(p) < 1e-6) {
        if (q < 0) return false;
      } else {
        const r = q / p;
        if (p < 0) {
          if (r > t1) return false;
          if (r > t0) t0 = r;
        } else {
          if (r < t0) return false;
          if (r < t1) t1 = r;
        }
      }
    }
    return t0 <= t1;
  }

  /**
   * 向下探测最近实心地面像素高度（用于火海/雷痕/陨石预警贴合地面）
   */
  function snapToGroundY(level, x, startY, maxDropPx) {
    if (!level) return startY;
    const ts = level.tileSize || 24;
    const limit = startY + (maxDropPx || 140);
    for (let py = Math.max(ts, startY - 6); py <= limit; py += 8) {
      if (getTileAtPx(level, x, py) === TILE_SOLID) {
        return Math.floor(py / ts) * ts;
      }
    }
    return startY;
  }

  class EffectsManager {
    constructor() {
      this.reset();
    }

    reset() {
      this.particles = [];
      this.debris = [];        // 触地反弹的像素碎块/火星残片
      this.bloodSpecks = [];   // 地面短暂残留血迹微点
      this.hitFlashes = [];    // 命中瞬间的十字刀芒星闪与破甲环
      this.slashArcs = [];
      this.afterimages = [];
      this.lightningBolts = []; // 程序化分叉闪电链/天雷
      this.siphonOrbs = [];     // 吸血/回蓝元气虹吸轨迹珠
      this.relicFlashes = [];   // 法宝祭出本相虚影
      this.floatingTexts = [];
      this.projectiles = [];
      this.zones = [];
      this.drops = [];
    }

    _pushParticle(p) {
      if (this.particles.length >= MAX_PARTICLES) {
        this.particles.shift();
      }
      this.particles.push(p);
    }

    /**
     * 生成十字受击爆点（暴击、重击、弹反、破甲时呈现多层次刀芒）
     */
    spawnHitFlash(x, y, color, isHeavy, angle) {
      this.hitFlashes.push({
        x,
        y,
        color: color || '#ffd60a',
        size: isHeavy ? 28 : 16,
        angle: angle !== undefined ? angle : (Math.random() - 0.5) * 0.9,
        isHeavy: !!isHeavy,
        life: isHeavy ? 0.15 : 0.095,
        maxLife: isHeavy ? 0.15 : 0.095
      });
    }

    /**
     * 生成会与地面发生物理弹跳的像素碎块（斩杀爆裂 / 撞墙粉碎 / 震地碎石 / 破盾晶屑）
     */
    spawnDebris(x, y, count, colors, dirBias) {
      const palette = Array.isArray(colors) ? colors : [colors || '#ff4d6d', '#ffd166'];
      for (let i = 0; i < count; i++) {
        const vx = (Math.random() - 0.5) * 240 + (dirBias || 0) * (70 + Math.random() * 110);
        const vy = -90 - Math.random() * 190;
        this.debris.push({
          x,
          y,
          vx,
          vy,
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 14,
          size: Math.random() < 0.45 ? 4 : 3,
          color: palette[i % palette.length],
          bounces: 2,
          life: 0.55 + Math.random() * 0.45,
          maxLife: 1.0
        });
      }
    }

    spawnParticles(x, y, count, color, speedMin, speedMax, lifeMin, lifeMax, gravity) {
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = speedMin + Math.random() * (speedMax - speedMin);
        const maxL = lifeMax || 0.35;
        this._pushParticle({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 25,
          size: Math.random() < 0.45 ? 4 : 2.5,
          color: color || '#ffd166',
          shape: 'square',
          life: lifeMin + Math.random() * (maxL - lifeMin),
          maxLife: maxL,
          gravity: gravity !== undefined ? gravity : 280
        });
      }
    }

    /**
     * 多形态元素粒子生成器
     * preset: 'flame' | 'petal' | 'frost' | 'lightning' | 'blood' | 'venom' | 'holy' | 'smoke' | 'sand'
     */
    spawnElementalParticles(x, y, count, preset, opts) {
      const o = opts || {};
      const dir = o.dir || 0;
      const spreadX = o.spreadX || 10;
      const spreadY = o.spreadY || 10;

      for (let i = 0; i < count; i++) {
        const px = x + (Math.random() - 0.5) * spreadX;
        const py = y + (Math.random() - 0.5) * spreadY;
        const ang = Math.random() * Math.PI * 2;

        if (preset === 'flame') {
          const life = 0.24 + Math.random() * 0.26;
          this._pushParticle({
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 75 + dir * (45 + Math.random() * 65),
            vy: -45 - Math.random() * 95,
            size: 3.5 + Math.random() * 3,
            color: o.color || '#ff6e40',
            coreColor: '#fff3b0',
            shape: 'flame',
            wobble: Math.random() * 6.28,
            life,
            maxLife: life,
            gravity: -95
          });
        } else if (preset === 'petal') {
          const life = 0.45 + Math.random() * 0.4;
          this._pushParticle({
            x: px,
            y: py,
            vx: Math.cos(ang) * (35 + Math.random() * 95) + dir * 40,
            vy: -35 - Math.random() * 80,
            size: 3.5 + Math.random() * 2,
            color: o.color || '#ffd166',
            coreColor: o.accent || '#ff4d6d',
            shape: 'petal',
            rot: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 11,
            life,
            maxLife: life,
            gravity: 95
          });
        } else if (preset === 'frost') {
          const life = 0.32 + Math.random() * 0.28;
          this._pushParticle({
            x: px,
            y: py,
            vx: Math.cos(ang) * (25 + Math.random() * 75),
            vy: Math.sin(ang) * (25 + Math.random() * 65) - 18,
            size: 3 + Math.random() * 2,
            color: o.color || '#90e0ef',
            coreColor: '#ffffff',
            shape: 'frost',
            rot: Math.random() * Math.PI,
            vRot: (Math.random() - 0.5) * 6,
            life,
            maxLife: life,
            gravity: 25
          });
        } else if (preset === 'lightning') {
          const life = 0.14 + Math.random() * 0.14;
          const spd = 95 + Math.random() * 190;
          this._pushParticle({
            x: px,
            y: py,
            vx: Math.cos(ang) * spd + dir * 55,
            vy: Math.sin(ang) * spd - 20,
            size: 2.5 + Math.random() * 1.5,
            color: o.color || '#00f5d4',
            coreColor: '#ffffff',
            shape: 'spark',
            trail: true,
            life,
            maxLife: life,
            gravity: 60
          });
        } else if (preset === 'blood') {
          const life = 0.28 + Math.random() * 0.24;
          this._pushParticle({
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 110 + dir * (40 + Math.random() * 85),
            vy: -45 - Math.random() * 95,
            size: 2.5 + Math.random() * 2,
            color: i % 2 === 0 ? '#ef233c' : '#9d0208',
            shape: 'blood',
            life,
            maxLife: life,
            gravity: 440
          });
        } else if (preset === 'venom') {
          const life = 0.32 + Math.random() * 0.26;
          this._pushParticle({
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 45,
            vy: -30 - Math.random() * 55,
            size: 2.5 + Math.random() * 2.2,
            color: o.color || '#80ed99',
            coreColor: '#c77dff',
            shape: 'bubble',
            life,
            maxLife: life,
            gravity: -35
          });
        } else if (preset === 'holy') {
          const life = 0.38 + Math.random() * 0.32;
          this._pushParticle({
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 42,
            vy: -38 - Math.random() * 55,
            size: 3 + Math.random() * 1.8,
            color: o.color || '#ffd166',
            coreColor: '#ffffff',
            shape: 'rune',
            life,
            maxLife: life,
            gravity: -25
          });
        } else if (preset === 'smoke') {
          const life = 0.3 + Math.random() * 0.28;
          this._pushParticle({
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 58 + dir * 25,
            vy: -18 - Math.random() * 42,
            size: 4 + Math.random() * 4,
            color: o.color || 'rgba(206, 212, 218, 0.45)',
            shape: 'smoke',
            life,
            maxLife: life,
            gravity: -30
          });
        } else {
          // 'sand' / default
          const life = 0.22 + Math.random() * 0.2;
          this._pushParticle({
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 90 + dir * 35,
            vy: -35 - Math.random() * 65,
            size: 2.5,
            color: o.color || '#e9c46a',
            shape: 'square',
            life,
            maxLife: life,
            gravity: 240
          });
        }
      }
    }

    spawnDirectionalSparks(x, y, dir, count, color) {
      for (let i = 0; i < count; i++) {
        const spread = (Math.random() - 0.5) * 1.15;
        const spd = 125 + Math.random() * 255;
        this._pushParticle({
          x,
          y,
          vx: Math.cos(spread) * spd * dir,
          vy: Math.sin(spread) * spd - 45,
          size: Math.random() < 0.5 ? 3.2 : 2.2,
          color: color || '#ffd166',
          coreColor: '#ffffff',
          shape: 'spark',
          trail: true,
          life: 0.15 + Math.random() * 0.18,
          maxLife: 0.33,
          gravity: 340
        });
      }
    }

    /**
     * 生成分叉折线雷电（用于九天落雷、真龙闪、感电链弹射）
     */
    spawnLightningBolt(x1, y1, x2, y2, color, thickness, duration) {
      const dist = Math.hypot(x2 - x1, y2 - y1) || 1;
      const segs = Math.max(4, Math.min(10, Math.round(dist / 22)));
      const pts = [{ x: x1, y: y1 }];
      const nx = -(y2 - y1) / dist;
      const ny = (x2 - x1) / dist;
      const branches = [];

      for (let i = 1; i < segs; i++) {
        const t = i / segs;
        const jitter = (Math.random() - 0.5) * Math.min(22, dist * 0.22);
        const px = x1 + (x2 - x1) * t + nx * jitter;
        const py = y1 + (y2 - y1) * t + ny * jitter;
        pts.push({ x: px, y: py });

        if (i > 1 && i < segs - 1 && Math.random() < 0.42) {
          const bAng = Math.atan2(y2 - y1, x2 - x1) + (Math.random() < 0.5 ? 0.65 : -0.65);
          const bLen = 12 + Math.random() * 18;
          branches.push({
            x1: px,
            y1: py,
            x2: px + Math.cos(bAng) * bLen,
            y2: py + Math.sin(bAng) * bLen
          });
        }
      }
      pts.push({ x: x2, y: y2 });

      const dur = duration || 0.18;
      this.lightningBolts.push({
        pts,
        branches,
        color: color || '#00f5d4',
        thickness: thickness || 2.5,
        life: dur,
        maxLife: dur
      });
    }

    /**
     * 生成吸血/回蓝元气虹吸灵珠（弧线飞向主角胸口）
     */
    spawnSiphonOrb(fromX, fromY, color) {
      const ang = Math.random() * Math.PI * 2;
      this.siphonOrbs.push({
        x: fromX,
        y: fromY,
        vx: Math.cos(ang) * 115,
        vy: Math.sin(ang) * 95 - 55,
        color: color || '#ff4d6d',
        age: 0,
        life: 0.55
      });
    }

    /**
     * 祭出西游法宝本相虚影（紫金红葫芦 / 太阴芭蕉扇 / 金刚琢 / 昊天照妖镜）
     */
    spawnRelicFlash(x, y, vfxKey, color, dir, duration) {
      const dur = duration || 0.38;
      this.relicFlashes.push({
        x,
        y,
        vfxKey,
        color: color || '#ffd166',
        dir: dir || 1,
        life: dur,
        maxLife: dur
      });
    }

    spawnSlashArc(opts) {
      this.slashArcs.push({
        x: opts.x,
        y: opts.y,
        dir: opts.dir || 1,
        rx: opts.radiusX || 52,
        ry: opts.radiusY || 36,
        color: opts.color || '#ffd166',
        accent: opts.accent || '#ffffff',
        style: opts.style || 'slash',
        heavy: !!opts.heavy,
        timer: 0,
        duration: opts.duration || 0.16
      });
    }

    spawnAfterimage(sprite, x, y, dir, tintColor, alpha) {
      this.afterimages.push({
        sprite,
        x,
        y,
        dir,
        tintColor: tintColor || '#00f5d4',
        life: 0.22,
        maxLife: 0.22,
        alpha: alpha || 0.58
      });
    }

    spawnFloatingText(x, y, text, color, isBig) {
      this.floatingTexts.push({
        x: x + (Math.random() - 0.5) * 16,
        y,
        vx: (Math.random() - 0.5) * 34,
        vy: isBig ? -115 : -82,
        text: String(text),
        color: color || '#ffffff',
        isBig: !!isBig,
        life: isBig ? 0.82 : 0.6,
        maxLife: isBig ? 0.82 : 0.6
      });
    }

    spawnProjectile(proj) {
      this.projectiles.push(
        Object.assign(
          {
            prevX: proj.x,
            prevY: proj.y,
            radius: 8,
            pierce: 1,
            hitIds: {},
            life: 2.2,
            age: 0,
            trailTick: 0
          },
          proj
        )
      );
    }

    spawnZone(zone) {
      this.zones.push(
        Object.assign(
          {
            age: 0,
            tickTimer: 0,
            particleTick: 0
          },
          zone
        )
      );
    }

    spawnLoot(x, y, souls, gold, dropBun) {
      const soulOrbs = Math.min(6, Math.max(1, Math.ceil(souls / 2)));
      const perOrb = Math.max(1, Math.round(souls / soulOrbs));
      for (let i = 0; i < soulOrbs; i++) {
        this.drops.push({
          kind: 'soul',
          val: i === soulOrbs - 1 ? Math.max(1, souls - perOrb * (soulOrbs - 1)) : perOrb,
          x,
          y: y - 12,
          vx: (Math.random() - 0.5) * 175,
          vy: -120 - Math.random() * 95,
          delay: 0.22,
          age: 0
        });
      }

      const goldCoins = Math.min(5, Math.max(1, Math.ceil(gold / 8)));
      const perGold = Math.max(1, Math.round(gold / goldCoins));
      for (let i = 0; i < goldCoins; i++) {
        this.drops.push({
          kind: 'gold',
          val: perGold,
          x,
          y: y - 10,
          vx: (Math.random() - 0.5) * 150,
          vy: -100 - Math.random() * 85,
          delay: 0.18,
          age: 0
        });
      }

      this.drops.push({
        kind: 'mp',
        val: 8,
        x,
        y: y - 14,
        vx: (Math.random() - 0.5) * 155,
        vy: -115 - Math.random() * 70,
        delay: 0.2,
        age: 0
      });

      if (dropBun) {
        this.drops.push({
          kind: 'bun',
          val: 0.14,
          x,
          y: y - 14,
          vx: (Math.random() - 0.5) * 70,
          vy: -135,
          delay: 0.35,
          age: 0
        });
      }
    }

    update(dt, worldCtx) {
      const { level, player, enemies, onHitEnemy, onHitPlayer, onPickupDrop } = worldCtx;

      // 1. 受击爆点星闪、闪电链、法宝虚影
      for (let i = this.hitFlashes.length - 1; i >= 0; i--) {
        const hf = this.hitFlashes[i];
        hf.life -= dt;
        if (hf.life <= 0) this.hitFlashes.splice(i, 1);
      }

      for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
        const lb = this.lightningBolts[i];
        lb.life -= dt;
        if (lb.life <= 0) this.lightningBolts.splice(i, 1);
      }

      for (let i = this.relicFlashes.length - 1; i >= 0; i--) {
        const rf = this.relicFlashes[i];
        rf.life -= dt;
        rf.y -= 14 * dt;
        if (rf.life <= 0) this.relicFlashes.splice(i, 1);
      }

      for (let i = this.bloodSpecks.length - 1; i >= 0; i--) {
        this.bloodSpecks[i].life -= dt;
        if (this.bloodSpecks[i].life <= 0) this.bloodSpecks.splice(i, 1);
      }

      // 1B. 元气虹吸灵珠飞向主角
      for (let i = this.siphonOrbs.length - 1; i >= 0; i--) {
        const sb = this.siphonOrbs[i];
        sb.age += dt;
        sb.life -= dt;
        if (sb.life <= 0 || !player || player.dead) {
          this.siphonOrbs.splice(i, 1);
          continue;
        }
        const tx = player.x;
        const ty = player.y - 18;
        const dx = tx - sb.x;
        const dy = ty - sb.y;
        const dist = Math.hypot(dx, dy) || 1;
        const pull = 780 + sb.age * 950;
        sb.vx = sb.vx * Math.pow(0.06, dt) + (dx / dist) * pull * dt;
        sb.vy = sb.vy * Math.pow(0.06, dt) + (dy / dist) * pull * dt;
        sb.x += sb.vx * dt;
        sb.y += sb.vy * dt;
        if (dist < 14) {
          this.spawnParticles(tx, ty, 3, sb.color, 20, 65, 0.08, 0.16, -40);
          this.siphonOrbs.splice(i, 1);
        }
      }

      // 2. 物理弹跳碎块
      for (let i = this.debris.length - 1; i >= 0; i--) {
        const db = this.debris[i];
        db.life -= dt;
        if (db.life <= 0) {
          this.debris.splice(i, 1);
          continue;
        }
        db.rot = (db.rot || 0) + (db.vRot || 0) * dt;
        db.vy += 580 * dt;
        db.x += db.vx * dt;
        if (level && getTileAtPx(level, db.x, db.y) === TILE_SOLID) {
          db.vx = -db.vx * 0.5;
          db.x += db.vx * dt * 2;
        }
        db.y += db.vy * dt;
        if (level && db.vy > 0 && getTileAtPx(level, db.x, db.y) === TILE_SOLID) {
          const row = Math.floor(db.y / level.tileSize);
          db.y = row * level.tileSize;
          if (db.bounces > 0) {
            db.bounces--;
            db.vy = -db.vy * 0.45;
            db.vx *= 0.72;
          } else {
            db.vy = 0;
            db.vx *= 0.8;
          }
        }
      }

      // 3. 多形态元素粒子
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        p.vy += p.gravity * dt;
        if (p.shape === 'flame' && p.wobble !== undefined) {
          p.wobble += dt * 16;
          p.x += Math.sin(p.wobble) * 28 * dt;
        }
        if (p.vRot) {
          p.rot = (p.rot || 0) + p.vRot * dt;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // 血珠落地溅射微小残留血点
        if (p.shape === 'blood' && level && p.vy > 0 && getTileAtPx(level, p.x, p.y) === TILE_SOLID) {
          const gy = Math.floor(p.y / level.tileSize) * level.tileSize;
          if (this.bloodSpecks.length >= MAX_BLOOD_SPECKS) this.bloodSpecks.shift();
          this.bloodSpecks.push({ x: p.x, y: gy, w: 3 + Math.floor(Math.random() * 3), color: p.color, life: 1.5 });
          this.particles.splice(i, 1);
        }
      }

      // 4. 刀光弧线
      for (let i = this.slashArcs.length - 1; i >= 0; i--) {
        const s = this.slashArcs[i];
        s.timer += dt;
        if (s.timer >= s.duration) {
          this.slashArcs.splice(i, 1);
        }
      }

      // 5. 残影
      for (let i = this.afterimages.length - 1; i >= 0; i--) {
        const a = this.afterimages[i];
        a.life -= dt;
        if (a.life <= 0) {
          this.afterimages.splice(i, 1);
        }
      }

      // 6. 弹性伤害飘字
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.life -= dt;
        if (ft.life <= 0) {
          this.floatingTexts.splice(i, 1);
          continue;
        }
        ft.x += (ft.vx || 0) * dt;
        ft.y += ft.vy * dt;
        ft.vy += 180 * dt;
        if (ft.vy > -12) ft.vy = -12;
      }

      // 7. 投射物（连续射线碰撞 + 元素拖尾 + 落地状态残留）
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const pr = this.projectiles[i];
        pr.age += dt;
        pr.life -= dt;
        if (pr.life <= 0) {
          this.projectiles.splice(i, 1);
          continue;
        }

        pr.prevX = pr.x;
        pr.prevY = pr.y;

        if (pr.kind === 'boomerang' && pr.age > 0.36 && player) {
          const dx = player.x - pr.x;
          const dy = player.y - player.height * 0.5 - pr.y;
          const dist = Math.hypot(dx, dy) || 1;
          pr.vx += (dx / dist) * 1180 * dt;
          pr.vy += (dy / dist) * 1180 * dt;
          if (pr.age > 0.5 && dist < 22) {
            this.projectiles.splice(i, 1);
            continue;
          }
        }

        if (pr.kind === 'homing_wisp' && pr.owner === 'enemy' && player && !player.dead) {
          const tx = player.x;
          const ty = player.y - player.height * 0.55;
          const dx = tx - pr.x;
          const dy = ty - pr.y;
          const dist = Math.hypot(dx, dy) || 1;
          pr.vx += (dx / dist) * 190 * dt;
          pr.vy += (dy / dist) * 190 * dt;
        }

        pr.x += pr.vx * dt;
        pr.y += pr.vy * dt;

        // 投射物飞行元素尾迹粒子
        pr.trailTick = (pr.trailTick || 0) - dt;
        if (pr.trailTick <= 0) {
          pr.trailTick = pr.deflected ? 0.025 : 0.045;
          if (pr.deflected) {
            this.spawnElementalParticles(pr.x, pr.y, 1, 'lightning', { color: '#ffd60a', spreadX: 4, spreadY: 4 });
          } else if (pr.kind === 'fireball' || pr.kind === 'meteor' || pr.kind === 'flame_orb' || pr.kind === 'fire_arrow') {
            this.spawnElementalParticles(pr.x, pr.y, 1, 'flame', { color: pr.color || '#ff6e40', spreadX: 5, spreadY: 5 });
          } else if (pr.kind === 'lotus_blast' || pr.kind === 'dharma_orb') {
            this.spawnElementalParticles(pr.x, pr.y, 1, pr.kind === 'lotus_blast' ? 'petal' : 'holy', { color: '#ffd166', spreadX: 6, spreadY: 6 });
          } else if (pr.kind === 'dragon_bolt') {
            this.spawnElementalParticles(pr.x, pr.y, 2, 'lightning', { color: '#00f5d4', spreadX: 4, spreadY: 4 });
          } else if (pr.kind === 'crescent_wave' || pr.kind === 'crescent_wave_big') {
            this.spawnElementalParticles(pr.x, pr.y, 1, 'frost', { color: '#6cd4ff', spreadX: 6, spreadY: 12 });
          } else if (pr.kind === 'tornado') {
            this.spawnElementalParticles(pr.x, pr.y + 8, 2, 'petal', { color: pr.owner === 'player' ? '#69f0ae' : '#e9c46a', spreadX: 18, spreadY: 22 });
          } else if (pr.kind === 'boomerang') {
            this.spawnParticles(pr.x, pr.y, 1, '#ffd54f', 15, 45, 0.08, 0.15, 0);
          } else if (pr.kind === 'venom_needle') {
            this.spawnElementalParticles(pr.x, pr.y, 1, 'venom', { spreadX: 3, spreadY: 3 });
          }
        }

        // 触碰实心墙/地面结算（含残留场地生成！）
        if (level && !pr.passWall && getTileAtPx(level, pr.x, pr.y) === TILE_SOLID) {
          const gy = snapToGroundY(level, pr.x, pr.y - 6, 36);
          if (pr.kind === 'meteor') {
            SoundFX.play('flame');
            this.spawnElementalParticles(pr.x, gy - 4, 14, 'flame', { spreadX: 20, spreadY: 8 });
            this.spawnDebris(pr.x, gy - 4, 6, ['#ff4800', '#ffba08', '#370617'], 0);
            this.spawnZone({ kind: 'shockwave_ring', x: pr.x, y: gy - 4, radius: 42, color: '#ff5400', duration: 0.24 });
          } else if (pr.kind === 'fireball' && pr.owner === 'player' && pr.leaveFirePatch) {
            this.spawnZone({
              kind: 'samadhi_fire_ground',
              x: pr.x,
              y: gy,
              radius: 32,
              dmg: Math.max(4, Math.round(pr.dmg * 0.35)),
              duration: 2.4
            });
          } else if (pr.kind === 'web_orb' && pr.owner === 'enemy') {
            this.spawnZone({ kind: 'enemy_web_patch', x: pr.x, y: gy, radius: 26, duration: 2.2 });
          } else if (pr.kind === 'venom_needle' && pr.owner === 'enemy') {
            this.spawnZone({ kind: 'enemy_venom_pool', x: pr.x, y: gy, radius: 20, duration: 1.8 });
          } else {
            this.spawnParticles(pr.x, pr.y, 5, pr.color, 35, 100, 0.1, 0.22, 220);
          }
          this.projectiles.splice(i, 1);
          continue;
        }

        if (pr.owner === 'player') {
          if (pr.destroyEnemyProj) {
            for (let j = this.projectiles.length - 1; j >= 0; j--) {
              const other = this.projectiles[j];
              if (other.owner === 'enemy' && Math.hypot(other.x - pr.x, other.y - pr.y) < pr.radius + other.radius + 12) {
                this.spawnElementalParticles(other.x, other.y, 5, 'lightning', { color: '#69f0ae' });
                this.projectiles.splice(j, 1);
                if (j < i) i--;
              }
            }
          }

          let removed = false;
          for (let k = 0; k < enemies.length; k++) {
            const e = enemies[k];
            if (e.dead) continue;
            const hitKey = pr.kind === 'boomerang' && pr.age > 0.42 ? `${e.uid}_back` : `${e.uid}`;
            if (pr.hitIds[hitKey]) continue;

            const ex = e.x;
            const ey = e.y - e.height * 0.5;
            const hw = e.width * 0.5 + pr.radius + 2;
            const hh = e.height * 0.5 + pr.radius + 2;

            if (segmentIntersectsBox(pr.prevX, pr.prevY, pr.x, pr.y, ex, ey, hw, hh)) {
              pr.hitIds[hitKey] = true;
              const isReturnBoomerang = pr.kind === 'boomerang' && pr.age > 0.42;

              // 金莲爆破弹命中迸发漫天金莲花瓣
              if (pr.kind === 'lotus_blast') {
                this.spawnElementalParticles(pr.x, pr.y, 9, 'petal', { color: '#ffd166', accent: '#ff4d6d' });
                this.spawnZone({ kind: 'shockwave_ring', x: pr.x, y: pr.y, radius: 46, color: '#ffd166', duration: 0.2 });
              } else if (pr.kind === 'fireball') {
                this.spawnElementalParticles(pr.x, pr.y, 7, 'flame', { dir: pr.vx >= 0 ? 1 : -1 });
              } else if (pr.kind === 'dragon_bolt') {
                this.spawnElementalParticles(pr.x, pr.y, 8, 'lightning', { color: '#00f5d4' });
              }

              onHitEnemy &&
                onHitEnemy(e, {
                  dmg: isReturnBoomerang ? Math.round(pr.dmg * 1.15) : pr.dmg,
                  isCrit: pr.isCrit || isReturnBoomerang,
                  knockX: (pr.vx >= 0 ? 1 : -1) * (pr.knock || 115),
                  knockY: -50,
                  stunSec: pr.stunSec || 0,
                  ignoreShield: !!pr.ignoreShield || !!pr.deflected,
                  debuff: pr.debuff || (isReturnBoomerang ? { type: 'expose', duration: 2.8 } : null),
                  sourceX: pr.x
                });
              pr.pierce--;
              if (pr.pierce <= 0) {
                if (pr.kind === 'fireball' && pr.leaveFirePatch && level) {
                  const gy = snapToGroundY(level, e.x, e.y, 48);
                  this.spawnZone({
                    kind: 'samadhi_fire_ground',
                    x: e.x,
                    y: gy,
                    radius: 36,
                    dmg: Math.max(4, Math.round(pr.dmg * 0.38)),
                    duration: 2.6
                  });
                }
                this.projectiles.splice(i, 1);
                removed = true;
                break;
              }
            }
          }
          if (removed) continue;
        } else if (pr.owner === 'enemy' && player && !player.dead) {
          const px = player.x;
          const py = player.y - player.height * 0.5;
          const hw = player.width * 0.44 + pr.radius;
          const hh = player.height * 0.44 + pr.radius;
          if (segmentIntersectsBox(pr.prevX, pr.prevY, pr.x, pr.y, px, py, hw, hh)) {
            const hitTaken = onHitPlayer && onHitPlayer(pr.dmg, pr.vx >= 0 ? 1 : -1, pr.playerDebuff || null);
            if (hitTaken !== 'ignored') {
              if (pr.kind === 'web_orb') {
                this.spawnParticles(px, py, 8, '#f8f9fa', 25, 85, 0.15, 0.3, 120);
              } else if (pr.kind === 'venom_needle') {
                this.spawnElementalParticles(px, py, 6, 'venom', { spreadX: 8, spreadY: 8 });
              }
              this.projectiles.splice(i, 1);
              continue;
            }
          }
        }
      }

      // 8. 场地法阵与战场状态残留结算
      for (let i = this.zones.length - 1; i >= 0; i--) {
        const z = this.zones[i];
        z.age += dt;
        if (z.age >= z.duration) {
          if (z.kind === 'wukong_clone_bomb') {
            SoundFX.play('flame');
            this.spawnElementalParticles(z.x, z.y - 16, 18, 'flame', { color: '#ffd60a', spreadX: 20, spreadY: 20 });
            this.spawnDirectionalSparks(z.x, z.y - 18, 1, 8, '#ffd60a');
            this.spawnDirectionalSparks(z.x, z.y - 18, -1, 8, '#ff5400');
            this.spawnHitFlash(z.x, z.y - 18, '#ffd60a', true, 0);
            this.spawnZone({ kind: 'shockwave_ring', x: z.x, y: z.y - 16, radius: z.radius + 10, color: '#ffd60a', duration: 0.28 });
            this.spawnZone({
              kind: 'samadhi_fire_ground',
              x: z.x,
              y: level ? snapToGroundY(level, z.x, z.y, 48) : z.y,
              radius: 42,
              dmg: Math.max(4, Math.round(z.dmg * 0.24)),
              duration: 2.0
            });
            for (let k = 0; k < enemies.length; k++) {
              const e = enemies[k];
              if (!e.dead && Math.hypot(e.x - z.x, e.y - 16 - (z.y - 16)) <= z.radius + 6) {
                onHitEnemy &&
                  onHitEnemy(e, {
                    dmg: z.dmg,
                    isCrit: true,
                    knockX: (e.x >= z.x ? 1 : -1) * 185,
                    knockY: -95,
                    ignoreShield: true,
                    debuff: { type: 'burn', duration: 2.4, dps: Math.max(5, Math.round(z.dmg * 0.28)) },
                    sourceX: z.x
                  });
              }
            }
          } else if (z.kind === 'wujing_vortex') {
            // 流沙玄水阵散去后残留短暂玄水寒霜池
            this.spawnZone({
              kind: 'frost_pool_ground',
              x: z.x,
              y: z.y,
              radius: Math.round(z.radius * 0.85),
              duration: 1.9
            });
          } else if (z.kind === 'boss_spike_warn' && player && !player.dead) {
            this.spawnParticles(z.x, z.y, 12, '#80ffdb', 40, 160, 0.15, 0.32, 260);
            this.spawnZone({
              kind: 'boss_spike_erupt',
              x: z.x,
              y: z.y,
              radius: z.radius,
              duration: 0.3
            });
            // 若 dmg > 0 才判定骨刺伤害（丹炉预警/落雷预警借用该类型时 dmg=0）
            if (z.dmg > 0 && Math.abs(player.x - z.x) < z.radius * 0.86 && player.y <= z.y + 8 && player.y >= z.y - 36) {
              onHitPlayer && onHitPlayer(z.dmg, player.x >= z.x ? 1 : -1);
            }
          }
          this.zones.splice(i, 1);
          continue;
        }

        // A. 沙悟净【流沙玄水阵】：强聚怪 + 寒霜减速 + 水刃切割
        if (z.kind === 'wujing_vortex') {
          z.tickTimer += dt;
          z.particleTick -= dt;
          if (z.particleTick <= 0) {
            z.particleTick = 0.09;
            const ang = Math.random() * Math.PI * 2;
            const r = (0.35 + Math.random() * 0.65) * z.radius;
            this.spawnElementalParticles(z.x + Math.cos(ang) * r, z.y - 4, 1, Math.random() < 0.5 ? 'frost' : 'venom', {
              color: '#48cae4',
              spreadX: 4,
              spreadY: 4
            });
          }
          for (let k = 0; k < enemies.length; k++) {
            const e = enemies[k];
            if (e.dead) continue;
            const dx = z.x - e.x;
            const dy = z.y - e.y;
            const dist = Math.hypot(dx, dy);
            if (dist < z.radius) {
              e.slowTimer = Math.max(e.slowTimer, 0.45);
              if (e.applyDebuff) e.applyDebuff('chill', 0.8, { silent: true });
              if (!e.isBoss && dist > 10) {
                e.x += Math.sign(dx) * 58 * dt;
              }
            }
          }
          if (z.tickTimer >= 0.38) {
            z.tickTimer = 0;
            for (let k = 0; k < enemies.length; k++) {
              const e = enemies[k];
              if (!e.dead && Math.hypot(e.x - z.x, e.y - z.y) < z.radius) {
                onHitEnemy &&
                  onHitEnemy(e, {
                    dmg: z.dmg,
                    isCrit: false,
                    knockX: 0,
                    knockY: -15,
                    ignoreShield: true,
                    debuff: { type: 'chill', duration: 1.6 },
                    sourceX: z.x
                  });
              }
            }
          }
        }
        // B. 【三昧真火残留火海】：持续燃烧地面并附加灼烧 Debuff
        else if (z.kind === 'samadhi_fire_ground') {
          z.tickTimer += dt;
          z.particleTick -= dt;
          if (z.particleTick <= 0) {
            z.particleTick = 0.08;
            this.spawnElementalParticles(z.x + (Math.random() - 0.5) * z.radius * 1.6, z.y - 3, 1, 'flame', {
              spreadX: 6,
              spreadY: 3
            });
          }
          if (z.tickTimer >= 0.48) {
            z.tickTimer = 0;
            const burnDmg = Math.max(3, z.dmg || 6);
            for (let k = 0; k < enemies.length; k++) {
              const e = enemies[k];
              if (!e.dead && Math.abs(e.x - z.x) <= z.radius + e.width * 0.35 && Math.abs(e.y - z.y) <= 28) {
                onHitEnemy &&
                  onHitEnemy(e, {
                    dmg: burnDmg,
                    isCrit: false,
                    isProc: true,
                    knockX: 0,
                    knockY: 0,
                    ignoreShield: true,
                    debuff: { type: 'burn', duration: 2.2, dps: burnDmg },
                    sourceX: z.x
                  });
              }
            }
          }
        }
        // C. 【九天雷痕残留电网】：残余电弧跳动并附加感电 Debuff
        else if (z.kind === 'thunder_scorch_ground') {
          z.tickTimer += dt;
          z.particleTick -= dt;
          if (z.particleTick <= 0) {
            z.particleTick = 0.14;
            const rx = z.x + (Math.random() - 0.5) * z.length;
            this.spawnElementalParticles(rx, z.y - 4, 1, 'lightning', { color: '#00f5d4', spreadX: 6, spreadY: 4 });
          }
          if (z.tickTimer >= 0.52) {
            z.tickTimer = 0;
            const halfLen = (z.length || 90) * 0.5;
            for (let k = 0; k < enemies.length; k++) {
              const e = enemies[k];
              if (!e.dead && Math.abs(e.x - z.x) <= halfLen + 10 && Math.abs(e.y - z.y) <= 32) {
                this.spawnLightningBolt(e.x + (Math.random() - 0.5) * 14, z.y - 2, e.x, e.y - 20, '#00f5d4', 1.8, 0.12);
                onHitEnemy &&
                  onHitEnemy(e, {
                    dmg: Math.max(3, z.dmg || 6),
                    isCrit: false,
                    isProc: true,
                    ignoreShield: true,
                    debuff: { type: 'shock', duration: 2.4 },
                    sourceX: z.x
                  });
              }
            }
          }
        }
        // D. 【金莲佛国净土残留阵】：赐予主角回蓝减伤 Buff，并灼净阵内群妖
        else if (z.kind === 'lotus_sanctuary') {
          z.tickTimer += dt;
          z.particleTick -= dt;
          if (z.particleTick <= 0) {
            z.particleTick = 0.11;
            const ang = Math.random() * Math.PI * 2;
            const r = Math.random() * z.radius * 0.9;
            this.spawnElementalParticles(
              z.x + Math.cos(ang) * r,
              z.y - 4,
              1,
              Math.random() < 0.45 ? 'petal' : 'holy',
              { color: '#ffd166', accent: '#ff5e57', spreadX: 4, spreadY: 4 }
            );
          }
          if (player && !player.dead && Math.abs(player.x - z.x) <= z.radius && Math.abs(player.y - z.y) <= 46) {
            player.sanctuaryBuffTimer = 0.25;
            if (player.mp < player.maxMp) {
              player.mp = Math.min(player.maxMp, player.mp + 7.5 * dt);
            }
          }
          if (z.tickTimer >= 0.62) {
            z.tickTimer = 0;
            for (let k = 0; k < enemies.length; k++) {
              const e = enemies[k];
              if (!e.dead && Math.abs(e.x - z.x) <= z.radius && Math.abs(e.y - z.y) <= 44) {
                onHitEnemy &&
                  onHitEnemy(e, {
                    dmg: Math.max(4, z.dmg || 8),
                    isCrit: false,
                    isProc: true,
                    ignoreShield: true,
                    debuff: { type: 'burn', duration: 1.8, dps: Math.max(4, z.dmg || 6) },
                    sourceX: z.x
                  });
              }
            }
          }
        }
        // E. 【玄水寒霜残迹】：踏入减速结霜
        else if (z.kind === 'frost_pool_ground') {
          z.particleTick -= dt;
          if (z.particleTick <= 0) {
            z.particleTick = 0.16;
            this.spawnElementalParticles(z.x + (Math.random() - 0.5) * z.radius * 1.5, z.y - 3, 1, 'frost', {
              spreadX: 4,
              spreadY: 2
            });
          }
          for (let k = 0; k < enemies.length; k++) {
            const e = enemies[k];
            if (!e.dead && Math.abs(e.x - z.x) <= z.radius && Math.abs(e.y - z.y) <= 24) {
              e.slowTimer = Math.max(e.slowTimer, 0.5);
              if (e.applyDebuff) e.applyDebuff('chill', 0.9, { silent: true });
            }
          }
        }
        // F. 【妖魔蛛网/毒沼残留】：赋予玩家可见可翻滚规避的地面状态互动
        else if (z.kind === 'enemy_web_patch' && player && !player.dead) {
          if (
            player.rollTimer <= 0 &&
            player.invulnTimer <= 0 &&
            Math.abs(player.x - z.x) <= z.radius &&
            Math.abs(player.y - z.y) <= 16
          ) {
            player.applyPlayerDebuff && player.applyPlayerDebuff('web', 0.55, this, true);
          }
        } else if (z.kind === 'enemy_venom_pool') {
          z.particleTick -= dt;
          if (z.particleTick <= 0) {
            z.particleTick = 0.18;
            this.spawnElementalParticles(z.x + (Math.random() - 0.5) * z.radius * 1.4, z.y - 2, 1, 'venom', {
              spreadX: 3,
              spreadY: 2
            });
          }
          if (
            player &&
            !player.dead &&
            player.rollTimer <= 0 &&
            player.invulnTimer <= 0 &&
            Math.abs(player.x - z.x) <= z.radius &&
            Math.abs(player.y - z.y) <= 16
          ) {
            player.applyPlayerDebuff && player.applyPlayerDebuff('poison', 1.4, this, true);
          }
        }
      }

      // 9. 战利品掉落磁吸
      for (let i = this.drops.length - 1; i >= 0; i--) {
        const d = this.drops[i];
        d.age = (d.age || 0) + dt;
        d.delay = Math.max(0, d.delay - dt);

        if (d.kind === 'bun') {
          d.vy += 450 * dt;
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          if (level && getTileAtPx(level, d.x, d.y) === TILE_SOLID) {
            const row = Math.floor(d.y / level.tileSize);
            d.y = row * level.tileSize;
            d.vy = 0;
            d.vx *= 0.8;
          }
          if (player && !player.dead && d.delay <= 0) {
            if (Math.hypot(player.x - d.x, player.y - 16 - (d.y - 8)) < 28) {
              onPickupDrop && onPickupDrop(d);
              this.drops.splice(i, 1);
            }
          }
          continue;
        }

        if (d.delay > 0 || !player || player.dead) {
          d.vy += 360 * dt;
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          if (level && getTileAtPx(level, d.x, d.y) === TILE_SOLID) {
            d.vy = -Math.abs(d.vy) * 0.45;
            d.vx *= 0.7;
          }
        } else {
          const tx = player.x;
          const ty = player.y - 18;
          const dx = tx - d.x;
          const dy = ty - d.y;
          const dist = Math.hypot(dx, dy) || 1;
          const magSpeed = 460;
          d.x += (dx / dist) * magSpeed * dt;
          d.y += (dy / dist) * magSpeed * dt;
          if (dist < 18) {
            onPickupDrop && onPickupDrop(d);
            this.drops.splice(i, 1);
          }
        }
      }
    }

    /**
     * 渲染贴地底层特效（坑痕、残留火海/雷网/金莲佛国阵/玄水寒霜池/蛛网/毒液/血迹），位于角色与妖魔脚下
     */
    renderUnderlay(ctx, camX, camY) {
      this._underlayRenderedThisFrame = true;
      // 0. 地面血迹微点
      for (let i = 0; i < this.bloodSpecks.length; i++) {
        const bs = this.bloodSpecks[i];
        const sx = Math.round(bs.x - camX);
        const sy = Math.round(bs.y - camY);
        ctx.save();
        ctx.globalAlpha = Math.min(0.8, bs.life * 0.7);
        ctx.fillStyle = bs.color;
        ctx.fillRect(sx - Math.floor(bs.w / 2), sy - 2, bs.w, 2);
        ctx.restore();
      }

      // 1. 地面法阵与战场残留层
      for (let i = 0; i < this.zones.length; i++) {
        const z = this.zones[i];
        const sx = Math.round(z.x - camX);
        const sy = Math.round(z.y - camY);
        const rem = Math.max(0, 1 - z.age / Math.max(0.01, z.duration));

        if (z.kind === 'earth_crater') {
          ctx.save();
          ctx.globalAlpha = Math.min(1, rem * 1.6);
          const r = z.radius || 36;
          ctx.fillStyle = '#141019';
          ctx.fillRect(sx - r, sy - 2, r * 2, 3);
          ctx.strokeStyle = z.color || '#ff9100';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let k = -r + 6; k <= r - 6; k += 12) {
            ctx.moveTo(sx + k, sy - 1);
            ctx.lineTo(sx + k + (k < 0 ? -4 : 4), sy + 5);
          }
          ctx.stroke();
          // 两侧翘起碎石齿
          ctx.fillStyle = '#6c757d';
          ctx.fillRect(sx - r - 2, sy - 5, 5, 5);
          ctx.fillRect(sx + r - 3, sy - 5, 5, 5);
          ctx.restore();
        } else if (z.kind === 'samadhi_fire_ground') {
          ctx.save();
          const fade = Math.min(1, rem * 2.2);
          ctx.globalAlpha = fade * 0.85;
          const r = z.radius || 36;
          // 焦红余烬地脉底床
          ctx.fillStyle = 'rgba(217, 4, 41, 0.45)';
          ctx.fillRect(sx - r, sy - 3, r * 2, 4);
          ctx.fillStyle = '#ffd60a';
          ctx.fillRect(sx - Math.round(r * 0.7), sy - 2, Math.round(r * 1.4), 2);
          // 跳动像素三昧火舌
          const tongues = Math.max(4, Math.floor((r * 2) / 9));
          for (let t = 0; t <= tongues; t++) {
            const tx = sx - r + (t / tongues) * (r * 2);
            const fh = 6 + Math.abs(Math.sin(z.age * 16 + t * 1.7)) * 10 * fade;
            ctx.fillStyle = t % 2 === 0 ? '#ff5400' : '#ff9f1c';
            ctx.beginPath();
            ctx.moveTo(tx - 4, sy);
            ctx.lineTo(tx + Math.sin(z.age * 12 + t) * 2, sy - fh);
            ctx.lineTo(tx + 4, sy);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#fff3b0';
            ctx.fillRect(Math.round(tx) - 1, Math.round(sy - fh * 0.45), 2, Math.max(2, Math.round(fh * 0.4)));
          }
          ctx.restore();
        } else if (z.kind === 'thunder_scorch_ground') {
          ctx.save();
          const fade = Math.min(1, rem * 2.0);
          const halfL = Math.round((z.length || 96) * 0.5);
          ctx.globalAlpha = fade * 0.85;
          ctx.fillStyle = 'rgba(0, 187, 249, 0.32)';
          ctx.fillRect(sx - halfL, sy - 3, halfL * 2, 4);
          ctx.strokeStyle = '#00f5d4';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(sx - halfL, sy - 1);
          for (let px = -halfL + 12; px <= halfL; px += 12) {
            ctx.lineTo(sx + px, sy - 2 - ((Math.floor(z.age * 18 + px) % 3) * 2));
          }
          ctx.stroke();
          ctx.restore();
        } else if (z.kind === 'lotus_sanctuary') {
          ctx.save();
          const fade = Math.min(1, rem * 2.2);
          ctx.globalAlpha = fade * 0.88;
          const r = z.radius || 142;
          // 佛国地面双层法轮椭圆阵
          ctx.fillStyle = 'rgba(255, 209, 102, 0.15)';
          ctx.beginPath();
          ctx.ellipse(sx, sy - 3, r, 15, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffd166';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(sx, sy - 3, r, 15, 0, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = '#ff5e57';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(sx, sy - 3, r * 0.66, 9, 0, 0, Math.PI * 2);
          ctx.stroke();

          // 8 瓣旋转盛放金莲花瓣刻度
          for (let p = 0; p < 8; p++) {
            const ang = z.age * 2.1 + (p * Math.PI) / 4;
            const lx = sx + Math.cos(ang) * (r * 0.88);
            const ly = sy - 3 + Math.sin(ang) * 13;
            ctx.fillStyle = p % 2 === 0 ? '#ffd166' : '#fff3b0';
            ctx.fillRect(Math.round(lx) - 3, Math.round(ly) - 2, 6, 4);
          }
          ctx.restore();
        } else if (z.kind === 'frost_pool_ground') {
          ctx.save();
          ctx.globalAlpha = Math.min(0.82, rem * 1.8);
          const r = z.radius || 54;
          ctx.fillStyle = 'rgba(72, 202, 228, 0.34)';
          ctx.beginPath();
          ctx.ellipse(sx, sy - 2, r, 7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#caf0f8';
          ctx.lineWidth = 1.3;
          ctx.stroke();
          ctx.restore();
        } else if (z.kind === 'enemy_web_patch') {
          ctx.save();
          ctx.globalAlpha = Math.min(0.85, rem * 1.8);
          ctx.strokeStyle = '#f8f9fa';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(sx, sy - 2, z.radius, 6, 0, 0, Math.PI * 2);
          ctx.moveTo(sx - z.radius, sy - 2);
          ctx.lineTo(sx + z.radius, sy - 2);
          ctx.moveTo(sx - z.radius * 0.6, sy - 6);
          ctx.lineTo(sx + z.radius * 0.6, sy + 2);
          ctx.stroke();
          ctx.restore();
        } else if (z.kind === 'enemy_venom_pool') {
          ctx.save();
          ctx.globalAlpha = Math.min(0.85, rem * 1.8);
          ctx.fillStyle = 'rgba(56, 176, 0, 0.55)';
          ctx.fillRect(sx - z.radius, sy - 3, z.radius * 2, 3);
          ctx.fillStyle = '#80ed99';
          ctx.fillRect(sx - Math.round(z.radius * 0.6), sy - 4, Math.round(z.radius * 1.2), 2);
          ctx.restore();
        } else if (z.kind === 'wujing_vortex') {
          ctx.save();
          const fade = Math.min(1, rem * 2.5);
          ctx.globalAlpha = fade;
          const pulse = Math.sin(z.age * 12) * 4;
          // 深渊流沙暗水底座
          ctx.fillStyle = 'rgba(3, 4, 94, 0.46)';
          ctx.beginPath();
          ctx.ellipse(sx, sy - 5, z.radius + pulse, 15, 0, 0, Math.PI * 2);
          ctx.fill();

          // 外圈逆旋玄水涡流
          ctx.strokeStyle = '#48cae4';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.ellipse(sx, sy - 5, z.radius + pulse, 15, 0, 0, Math.PI * 2);
          ctx.stroke();

          // 内圈高速旋转朔月水刃弧
          for (let b = 0; b < 4; b++) {
            const ang = -z.age * 9.5 + (b * Math.PI) / 2;
            const bx = sx + Math.cos(ang) * (z.radius * 0.58);
            const by = sy - 7 + Math.sin(ang) * 8;
            ctx.strokeStyle = b % 2 === 0 ? '#90e0ef' : '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(bx, by, 10, ang, ang + Math.PI * 0.85);
            ctx.stroke();
          }

          // 漩涡水柱中心寒芒
          ctx.fillStyle = 'rgba(0, 245, 212, 0.32)';
          ctx.fillRect(sx - 6, sy - 30, 12, 26);
          ctx.restore();
        }
      }
    }

    /**
     * 渲染前景战斗特效（毫毛金身、真龙幻影、刀光残影、法宝投射物、元素粒子、雷霆闪电与受击爆点）
     */
    renderWorld(ctx, camX, camY, assetLoader) {
      if (!this._underlayRenderedThisFrame) {
        this.renderUnderlay(ctx, camX, camY);
      }
      this._underlayRenderedThisFrame = false;

      for (let i = 0; i < this.zones.length; i++) {
        const z = this.zones[i];
        const sx = Math.round(z.x - camX);
        const sy = Math.round(z.y - camY);
        const rem = Math.max(0, 1 - z.age / Math.max(0.01, z.duration));

        if (z.kind === 'wukong_clone_bomb') {
          // 大圣毫毛金身：使用真实孙悟空像素立绘金光剪影 + 紧箍咒环闪烁预警！
          ctx.save();
          const flash = Math.floor(z.age * 20) % 2 === 0;
          const heroSpr = assetLoader && assetLoader.getHeroSprite('wukong', 'attack');
          const goldSpr =
            heroSpr && assetLoader.getTintedSprite
              ? assetLoader.getTintedSprite(heroSpr, flash ? '#ffffff' : '#ffd60a', 'silhouette')
              : heroSpr;

          // 倒计时引爆警戒圈
          ctx.strokeStyle = flash ? '#ff5400' : '#ffd60a';
          ctx.lineWidth = 1.6;
          ctx.globalAlpha = 0.65;
          ctx.beginPath();
          ctx.ellipse(sx, sy - 3, z.radius * (z.age / z.duration), 9, 0, 0, Math.PI * 2);
          ctx.stroke();

          ctx.globalAlpha = 0.9;
          if (goldSpr) {
            const lw = goldSpr._logicalW || goldSpr.width;
            const lh = goldSpr._logicalH || goldSpr.height;
            ctx.drawImage(goldSpr, sx - lw / 2, sy - lh, lw, lh);
          } else {
            ctx.fillStyle = '#ffd60a';
            ctx.fillRect(sx - 9, sy - 30, 18, 30);
          }
          // 环绕三根发光金毫毛
          for (let h = 0; h < 3; h++) {
            const ha = z.age * 11 + (h * Math.PI * 2) / 3;
            ctx.fillStyle = '#fff3b0';
            ctx.fillRect(Math.round(sx + Math.cos(ha) * 15) - 1, Math.round(sy - 18 + Math.sin(ha) * 9) - 2, 3, 5);
          }
          ctx.restore();
        } else if (z.kind === 'dragon_phantom_trail') {
          // 白龙马【真龙雷霆闪】：贯空银白游龙幻身轨迹！
          ctx.save();
          ctx.globalAlpha = rem;
          const d = z.dir || 1;
          const len = z.length || 180;
          const segs = 14;
          ctx.strokeStyle = '#00bbf9';
          ctx.lineWidth = 9 * rem;
          ctx.beginPath();
          for (let s = 0; s <= segs; s++) {
            const t = s / segs;
            const px = sx + d * len * t;
            const py = sy + Math.sin(t * Math.PI * 3.5 - z.age * 28) * 9 * (1 - t * 0.3);
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3.5 * rem;
          ctx.stroke();

          // 龙首峥嵘剪影与青玉龙角
          const hx = sx + d * len;
          ctx.fillStyle = '#e0fbfc';
          ctx.beginPath();
          ctx.moveTo(hx - d * 14, sy - 8);
          ctx.lineTo(hx + d * 12, sy);
          ctx.lineTo(hx - d * 14, sy + 8);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#00f5d4';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(hx - d * 6, sy - 5);
          ctx.lineTo(hx - d * 18, sy - 14);
          ctx.stroke();
          ctx.restore();
        } else if (z.kind === 'sash_ribbon_wave') {
          // 混天绫赤霞仙绫环身舞动波带
          ctx.save();
          ctx.globalAlpha = rem;
          const rx = z.radiusX || 96;
          for (let band = 0; band < 2; band++) {
            ctx.strokeStyle = band === 0 ? '#ff2a54' : '#ffd166';
            ctx.lineWidth = band === 0 ? 5 * rem : 2 * rem;
            ctx.beginPath();
            for (let s = -rx; s <= rx; s += 8) {
              const wy = sy + Math.sin((s / 22) + z.age * 26 + band * 2.1) * 14;
              if (s === -rx) ctx.moveTo(sx + s, wy);
              else ctx.lineTo(sx + s, wy);
            }
            ctx.stroke();
          }
          ctx.restore();
        } else if (z.kind === 'shockwave_ring') {
          const p = z.age / z.duration;
          const r = z.radius * Math.pow(p, 0.68);
          ctx.save();
          ctx.strokeStyle = z.color || '#ffd166';
          ctx.globalAlpha = 1 - p;
          ctx.lineWidth = Math.max(2, (1 - p) * 6);
          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = Math.max(1, (1 - p) * 2);
          ctx.beginPath();
          ctx.arc(sx, sy, r * 0.88, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (z.kind === 'laser_beam') {
          const p = 1 - z.age / z.duration;
          ctx.save();
          ctx.globalAlpha = p;
          const beamH = Math.max(2, Math.round(20 * p));
          const startX = z.dir > 0 ? sx : sx - z.length;
          ctx.fillStyle = z.color || '#ea80fc';
          ctx.fillRect(startX, sy - beamH / 2, z.length, beamH);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(startX, sy - Math.max(1, beamH / 4), z.length, Math.max(2, beamH / 2));
          // 破魔神光聚焦棱环
          ctx.strokeStyle = '#ffd60a';
          ctx.lineWidth = 2;
          for (let ringX = 36; ringX < z.length - 20; ringX += 76) {
            ctx.beginPath();
            ctx.ellipse(sx + z.dir * ringX, sy, 5, beamH * 0.85, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
        } else if (z.kind === 'boss_spike_warn') {
          ctx.save();
          const blink = Math.floor(z.age * 16) % 2 === 0;
          ctx.fillStyle = blink ? 'rgba(255, 42, 42, 0.72)' : 'rgba(255, 186, 8, 0.62)';
          ctx.fillRect(sx - z.radius, sy - 4, z.radius * 2, 4);
          // 地面骨牙破土前兆尖齿（让走位预判一目了然）
          if (z.dmg > 0) {
            ctx.fillStyle = '#e0fbfc';
            for (let k = -z.radius + 6; k <= z.radius - 6; k += 10) {
              ctx.beginPath();
              ctx.moveTo(sx + k - 3, sy);
              ctx.lineTo(sx + k, sy - 8);
              ctx.lineTo(sx + k + 3, sy);
              ctx.fill();
            }
          }
          ctx.restore();
        } else if (z.kind === 'boss_spike_erupt') {
          ctx.save();
          ctx.fillStyle = '#e0fbfc';
          for (let k = -z.radius + 4; k < z.radius; k += 10) {
            ctx.beginPath();
            ctx.moveTo(sx + k - 4, sy);
            ctx.lineTo(sx + k, sy - 36);
            ctx.lineTo(sx + k + 4, sy);
            ctx.fill();
          }
          ctx.restore();
        }
      }

      // 2. 像素染色残影（真正应用 tintColor 光谱剪影！）
      for (let i = 0; i < this.afterimages.length; i++) {
        const a = this.afterimages[i];
        if (!a.sprite) continue;
        ctx.save();
        ctx.globalAlpha = (a.life / a.maxLife) * a.alpha;
        const sx = Math.round(a.x - camX);
        const sy = Math.round(a.y - camY);
        ctx.translate(sx, sy);
        if (a.dir < 0) ctx.scale(-1, 1);
        const tinted =
          assetLoader && assetLoader.getTintedSprite
            ? assetLoader.getTintedSprite(a.sprite, a.tintColor, 'silhouette')
            : a.sprite;
        const lw = tinted._logicalW || tinted.width;
        const lh = tinted._logicalH || tinted.height;
        ctx.drawImage(tinted, -lw / 2, -lh, lw, lh);
        ctx.restore();
      }

      // 2B. 法宝祭出本相虚影（葫芦/芭蕉扇/金刚琢/照妖镜）
      for (let i = 0; i < this.relicFlashes.length; i++) {
        const rf = this.relicFlashes[i];
        const spr = assetLoader && assetLoader.getVfxSprite && assetLoader.getVfxSprite(rf.vfxKey);
        const sx = Math.round(rf.x - camX);
        const sy = Math.round(rf.y - camY);
        const p = 1 - rf.life / rf.maxLife;
        ctx.save();
        ctx.globalAlpha = Math.min(1, rf.life / rf.maxLife * 1.6);
        ctx.translate(sx, sy);
        if (rf.dir < 0) ctx.scale(-1, 1);
        const sc = 1 + p * 0.28;
        ctx.scale(sc, sc);
        ctx.strokeStyle = rf.color;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, 14 + p * 8, 0, Math.PI * 2);
        ctx.stroke();
        if (spr) {
          const lw = spr._logicalW || spr.width;
          const lh = spr._logicalH || spr.height;
          ctx.drawImage(spr, -lw / 2, -lh / 2, lw, lh);
        }
        ctx.restore();
      }

      // 3. 战利品掉落（升级为 16-Bit 精致像素灵晶/铜钱/大包子 + 地面阴影）
      for (let i = 0; i < this.drops.length; i++) {
        const d = this.drops[i];
        const sx = Math.round(d.x - camX);
        const sy = Math.round(d.y - camY + Math.sin((d.age || 0) * 8) * 1.5);

        if (d.kind === 'soul') {
          const sp = assetLoader && assetLoader.getVfxSprite && assetLoader.getVfxSprite('drop_soul');
          if (sp) {
            const lw = sp._logicalW || sp.width;
            const lh = sp._logicalH || sp.height;
            ctx.drawImage(sp, sx - lw / 2, sy - lh / 2, lw, lh);
          }
          else {
            ctx.fillStyle = '#72efdd';
            ctx.fillRect(sx - 3, sy - 3, 6, 6);
          }
        } else if (d.kind === 'mp') {
          const sp = assetLoader && assetLoader.getVfxSprite && assetLoader.getVfxSprite('drop_mp');
          if (sp) {
            const lw = sp._logicalW || sp.width;
            const lh = sp._logicalH || sp.height;
            ctx.drawImage(sp, sx - lw / 2, sy - lh / 2, lw, lh);
          }
          else {
            ctx.fillStyle = '#00bbf9';
            ctx.fillRect(sx - 3, sy - 3, 5, 5);
          }
        } else if (d.kind === 'gold') {
          const sp = assetLoader && assetLoader.getVfxSprite && assetLoader.getVfxSprite('drop_coin');
          if (sp) {
            const lw = sp._logicalW || sp.width;
            const lh = sp._logicalH || sp.height;
            ctx.drawImage(sp, sx - lw / 2, sy - lh / 2, lw, lh);
          }
          else {
            ctx.fillStyle = '#ffd60a';
            ctx.fillRect(sx - 3, sy - 3, 5, 5);
          }
        } else if (d.kind === 'bun') {
          const bunSpr = assetLoader && assetLoader.getPropSprite('bun');
          if (bunSpr) {
            const lw = bunSpr._logicalW || bunSpr.width;
            const lh = bunSpr._logicalH || bunSpr.height;
            ctx.drawImage(bunSpr, sx - lw / 2, sy - lh, lw, lh);
          } else {
            ctx.fillStyle = '#fff8e7';
            ctx.fillRect(sx - 6, sy - 8, 12, 8);
          }
        }
      }

      // 4. 升级版双色分层厚重半月刀光与专属招式轨（Filled Layered Blade Smear）
      for (let i = 0; i < this.slashArcs.length; i++) {
        const s = this.slashArcs[i];
        const p = s.timer / s.duration;
        const sx = Math.round(s.x - camX);
        const sy = Math.round(s.y - camY);
        ctx.save();
        ctx.translate(sx, sy);
        if (s.dir < 0) ctx.scale(-1, 1);
        ctx.globalAlpha = Math.max(0, 1 - Math.pow(p, 1.45));

        if (s.style === 'spin360') {
          ctx.strokeStyle = s.color;
          ctx.lineWidth = Math.max(3, (1 - p) * 12);
          ctx.beginPath();
          ctx.ellipse(0, 0, s.rx, s.ry, p * Math.PI, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = s.accent || '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.ellipse(0, 0, s.rx * 0.9, s.ry * 0.85, -p * Math.PI, 0, Math.PI * 1.45);
          ctx.stroke();
        } else if (s.style === 'thrust' || s.style === 'lanceThrust' || s.style === 'dragonPierce' || s.style === 'lanceFlurry') {
          const len = s.rx * (0.78 + p * 0.35);
          const halfH = (s.heavy ? 12 : 7.5) * (1 - p * 0.68);
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.moveTo(-18, -halfH * 0.55);
          ctx.lineTo(len, 0);
          ctx.lineTo(-18, halfH * 0.55);
          ctx.closePath();
          ctx.fill();

          if (s.style === 'lanceFlurry') {
            // 疾风百裂多段枪影！
            for (let offY = -9; offY <= 9; offY += 18) {
              ctx.globalAlpha = Math.max(0, (1 - p) * 0.72);
              ctx.beginPath();
              ctx.moveTo(-10, offY - 2.5);
              ctx.lineTo(len * 0.86, offY);
              ctx.lineTo(-10, offY + 2.5);
              ctx.fill();
            }
          }

          ctx.globalAlpha = Math.max(0, 1 - p);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(-10, -halfH * 0.24);
          ctx.lineTo(len + 5, 0);
          ctx.lineTo(-10, halfH * 0.24);
          ctx.closePath();
          ctx.fill();
        } else if (s.style === 'rakePull') {
          // 九齿钉耙回勾三道撕裂金爪痕
          for (let claw = -1; claw <= 1; claw++) {
            ctx.strokeStyle = claw === 0 ? '#ffd166' : s.color;
            ctx.lineWidth = Math.max(2, (1 - p) * 4.5);
            ctx.beginPath();
            ctx.arc(-6, claw * 7, s.rx * 0.82, -0.42 * Math.PI, 0.42 * Math.PI);
            ctx.stroke();
          }
        } else if (s.style === 'cast' || s.style === 'castHeavy') {
          // 唐僧禅杖法印金轮绽放
          const r = (s.heavy ? 24 : 16) * (0.65 + p * 0.6);
          ctx.strokeStyle = s.color;
          ctx.lineWidth = s.heavy ? 3.5 : 2.2;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-2, -r, 4, r * 2);
          ctx.fillRect(-r, -2, r * 2, 4);
        } else {
          // 双色厚重新月挥砍残影
          const outerR = s.rx * (0.85 + p * 0.22);
          const thickness = (s.heavy ? 20 : 13) * (1 - p * 0.62);
          const startAng = s.style === 'upSlash' ? 0.56 * Math.PI : -0.6 * Math.PI;
          const endAng = s.style === 'upSlash' ? -0.56 * Math.PI : 0.54 * Math.PI;
          const anticlock = s.style === 'upSlash';

          if (s.accent) {
            ctx.fillStyle = s.accent;
            ctx.beginPath();
            ctx.arc(-3, 0, outerR * 0.96, startAng, endAng, anticlock);
            ctx.arc(-thickness * 0.6, 0, Math.max(4, outerR - thickness * 1.2), endAng, startAng, !anticlock);
            ctx.closePath();
            ctx.fill();
          }

          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(0, 0, outerR, startAng, endAng, anticlock);
          ctx.arc(-thickness * 0.45, 0, Math.max(4, outerR - thickness), endAng, startAng, !anticlock);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = s.heavy ? 3 : 2;
          ctx.beginPath();
          ctx.arc(0, 0, outerR, startAng, endAng, anticlock);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 5. 投射物（全面采用 16-Bit 专属像素法宝与弹幕贴图 + 动态旋转）
      for (let i = 0; i < this.projectiles.length; i++) {
        const pr = this.projectiles[i];
        const sx = Math.round(pr.x - camX);
        const sy = Math.round(pr.y - camY);
        ctx.save();

        if (pr.kind === 'crescent_wave' || pr.kind === 'crescent_wave_big') {
          ctx.translate(sx, sy);
          if (pr.vx < 0) ctx.scale(-1, 1);
          const isBig = pr.kind === 'crescent_wave_big';
          ctx.fillStyle = pr.color || '#6cd4ff';
          ctx.beginPath();
          ctx.arc(-6, 0, pr.radius + (isBig ? 8 : 5), -Math.PI * 0.46, Math.PI * 0.46, false);
          ctx.arc(-12, 0, Math.max(4, pr.radius - (isBig ? 2 : 1)), Math.PI * 0.46, -Math.PI * 0.46, true);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = isBig ? 2.4 : 1.6;
          ctx.beginPath();
          ctx.arc(-6, 0, pr.radius + (isBig ? 8 : 5), -Math.PI * 0.46, Math.PI * 0.46);
          ctx.stroke();
        } else if (pr.kind === 'tornado') {
          const isPlayer = pr.owner === 'player';
          const baseCol = isPlayer ? 'rgba(105, 240, 174, 0.65)' : 'rgba(233, 196, 106, 0.68)';
          const rimCol = isPlayer ? '#e0fbfc' : '#fff3b0';
          for (let h = 0; h < 6; h++) {
            const w = 9 + h * 6;
            const ox = Math.sin(pr.age * 24 + h * 1.1) * 5;
            const layerY = sy + 18 - h * 8;
            ctx.fillStyle = baseCol;
            ctx.fillRect(sx - w / 2 + ox, layerY, w, 6);
            ctx.fillStyle = rimCol;
            ctx.fillRect(sx - w / 2 + ox + 2, layerY + 1, Math.max(3, w * 0.35), 2);
          }
        } else if (pr.kind === 'boomerang') {
          ctx.translate(sx, sy);
          ctx.rotate(pr.age * 22);
          const ringSpr = assetLoader && assetLoader.getVfxSprite && assetLoader.getVfxSprite('proj_qiankun');
          if (ringSpr) {
            ctx.drawImage(ringSpr, -Math.round(ringSpr.width / 2), -Math.round(ringSpr.height / 2));
          } else {
            ctx.strokeStyle = '#ffd54f';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.arc(0, 0, pr.radius, 0, Math.PI * 2);
            ctx.stroke();
          }
        } else {
          // 映射专属 16-Bit 投射物像素精灵
          let vfxKey = null;
          let spin = false;
          if (pr.kind === 'dharma_orb') {
            vfxKey = 'proj_dharma';
            spin = true;
          } else if (pr.kind === 'lotus_blast') {
            vfxKey = 'proj_lotus';
          } else if (pr.kind === 'fireball' || pr.kind === 'flame_orb') {
            vfxKey = 'proj_samadhi';
          } else if (pr.kind === 'dragon_bolt') {
            vfxKey = 'proj_dragon_bolt';
          } else if (pr.kind === 'fire_arrow') {
            vfxKey = 'proj_fire_arrow';
          } else if (pr.kind === 'homing_wisp') {
            vfxKey = 'proj_wisp';
          } else if (pr.kind === 'web_orb') {
            vfxKey = 'proj_web';
            spin = true;
          } else if (pr.kind === 'venom_needle') {
            vfxKey = 'proj_venom';
          } else if (pr.kind === 'meteor') {
            vfxKey = 'proj_meteor';
            spin = true;
          } else if (pr.kind === 'ground_wave') {
            vfxKey = 'proj_ground_wave';
          }

          // 火焰山天外陨石提前在地面绘制落点预警红圈，提升公平预判体验！
          if (pr.kind === 'meteor') {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 72, 0, 0.65)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(sx, Math.min(350, sy + 110), 16, 4, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          const spr = vfxKey && assetLoader && assetLoader.getVfxSprite ? assetLoader.getVfxSprite(vfxKey) : null;
          if (spr) {
            ctx.translate(sx, sy);
            if (spin) {
              ctx.rotate(pr.age * 14);
            } else if (pr.kind === 'ground_wave') {
              if (pr.vx < 0) ctx.scale(-1, 1);
            } else {
              ctx.rotate(Math.atan2(pr.vy, pr.vx));
            }
            ctx.drawImage(spr, -Math.round(spr.width / 2), -Math.round(spr.height / 2));
          } else {
            ctx.fillStyle = pr.color || '#ffd166';
            ctx.beginPath();
            ctx.arc(sx, sy, pr.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = pr.coreColor || '#ffffff';
            ctx.fillRect(sx - 2, sy - 2, 4, 4);
          }
        }
        ctx.restore();
      }

      // 5B. 元气虹吸灵珠
      for (let i = 0; i < this.siphonOrbs.length; i++) {
        const sb = this.siphonOrbs[i];
        const sx = Math.round(sb.x - camX);
        const sy = Math.round(sb.y - camY);
        ctx.save();
        ctx.fillStyle = sb.color;
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx - 1, sy - 1, 2, 2);
        ctx.restore();
      }

      // 6. 弹跳物理碎块
      for (let i = 0; i < this.debris.length; i++) {
        const db = this.debris[i];
        const sx = Math.round(db.x - camX);
        const sy = Math.round(db.y - camY);
        ctx.save();
        ctx.globalAlpha = Math.min(1, db.life * 2);
        ctx.translate(sx, sy - db.size * 0.5);
        if (db.rot) ctx.rotate(db.rot);
        ctx.fillStyle = db.color;
        ctx.fillRect(-db.size * 0.5, -db.size * 0.5, db.size, db.size);
        ctx.restore();
      }

      // 7. 多形态元素粒子渲染
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        const sx = Math.round(p.x - camX);
        const sy = Math.round(p.y - camY);
        const lifeRatio = Math.max(0, p.life / (p.maxLife || 0.3));

        if (p.shape === 'flame') {
          const r = Math.max(1.2, p.size * lifeRatio);
          ctx.fillStyle = lifeRatio > 0.65 ? '#fff3b0' : lifeRatio > 0.32 ? p.color : '#d90429';
          ctx.beginPath();
          ctx.moveTo(sx, sy - r * 1.4);
          ctx.lineTo(sx + r * 0.85, sy);
          ctx.lineTo(sx, sy + r * 0.85);
          ctx.lineTo(sx - r * 0.85, sy);
          ctx.closePath();
          ctx.fill();
        } else if (p.shape === 'petal') {
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(p.rot || 0);
          ctx.globalAlpha = Math.min(1, lifeRatio * 1.5);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.52, 0, 0, Math.PI * 2);
          ctx.fill();
          if (p.coreColor) {
            ctx.fillStyle = p.coreColor;
            ctx.fillRect(-1, -1, 2, 2);
          }
          ctx.restore();
        } else if (p.shape === 'frost') {
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(p.rot || 0);
          ctx.globalAlpha = Math.min(1, lifeRatio * 1.6);
          ctx.fillStyle = p.color;
          const s = p.size;
          ctx.fillRect(-s, -0.8, s * 2, 1.6);
          ctx.fillRect(-0.8, -s, 1.6, s * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-1, -1, 2, 2);
          ctx.restore();
        } else if (p.shape === 'bubble') {
          ctx.save();
          ctx.globalAlpha = Math.min(0.9, lifeRatio * 1.5);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(sx - 1, sy - p.size * 0.5, 1.5, 1.5);
          ctx.restore();
        } else if (p.shape === 'rune') {
          ctx.save();
          ctx.globalAlpha = Math.min(1, lifeRatio * 1.6);
          ctx.fillStyle = p.color;
          const s = Math.max(2, Math.round(p.size));
          ctx.fillRect(sx - s, sy - 1, s * 2 + 1, 2);
          ctx.fillRect(sx - 1, sy - s, 2, s * 2 + 1);
          ctx.restore();
        } else if (p.shape === 'smoke') {
          ctx.save();
          ctx.globalAlpha = lifeRatio * 0.45;
          ctx.fillStyle = p.color;
          const r = p.size * (1.3 - lifeRatio * 0.4);
          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (p.trail) {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(1.2, p.size * 0.8);
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx - p.vx * 0.03, sy - p.vy * 0.03);
          ctx.stroke();
          if (p.coreColor) {
            ctx.fillStyle = p.coreColor;
            ctx.fillRect(sx - 1, sy - 1, 2, 2);
          }
        } else {
          ctx.fillStyle = p.color;
          ctx.fillRect(sx, sy, p.size, p.size);
        }
      }

      // 7B. 程序化分叉雷电渲染（双层外发光+高亮白芯）
      for (let i = 0; i < this.lightningBolts.length; i++) {
        const lb = this.lightningBolts[i];
        const alpha = Math.max(0, lb.life / lb.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha * 0.65;
        ctx.strokeStyle = lb.color;
        ctx.lineWidth = lb.thickness * 2.4;
        ctx.beginPath();
        for (let k = 0; k < lb.pts.length; k++) {
          const pt = lb.pts[k];
          if (k === 0) ctx.moveTo(pt.x - camX, pt.y - camY);
          else ctx.lineTo(pt.x - camX, pt.y - camY);
        }
        ctx.stroke();

        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1.2, lb.thickness * 0.9);
        ctx.stroke();

        if (lb.branches && lb.branches.length) {
          ctx.strokeStyle = lb.color;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          for (let b = 0; b < lb.branches.length; b++) {
            const br = lb.branches[b];
            ctx.moveTo(br.x1 - camX, br.y1 - camY);
            ctx.lineTo(br.x2 - camX, br.y2 - camY);
          }
          ctx.stroke();
        }
        ctx.restore();
      }

      // 8. 命中瞬间十字刀芒爆点
      for (let i = 0; i < this.hitFlashes.length; i++) {
        const hf = this.hitFlashes[i];
        const p = 1 - hf.life / hf.maxLife;
        const sx = Math.round(hf.x - camX);
        const sy = Math.round(hf.y - camY);
        const len = hf.size * (0.7 + p * 0.6);
        const thick = Math.max(1.5, (1 - p) * (hf.isHeavy ? 6 : 4));

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(hf.angle);

        if (hf.isHeavy) {
          ctx.strokeStyle = hf.color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 1 - p;
          ctx.beginPath();
          ctx.arc(0, 0, len * 0.72, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.globalAlpha = 1;
        ctx.fillStyle = hf.color;
        ctx.beginPath();
        ctx.moveTo(-len, 0);
        ctx.lineTo(0, -thick);
        ctx.lineTo(len, 0);
        ctx.lineTo(0, thick);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        const shortL = len * 0.65;
        ctx.beginPath();
        ctx.moveTo(0, -shortL);
        ctx.lineTo(thick * 0.7, 0);
        ctx.lineTo(0, shortL);
        ctx.lineTo(-thick * 0.7, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    renderScreenTexts(ctx, camX, camY, scaleX, scaleY) {
      for (let i = 0; i < this.floatingTexts.length; i++) {
        const ft = this.floatingTexts[i];
        const sx = (ft.x - camX) * scaleX;
        const sy = (ft.y - camY) * scaleY;
        const progress = 1 - ft.life / ft.maxLife;
        const alpha = Math.min(1, (ft.life / ft.maxLife) * 1.6);
        const popScale = progress < 0.18 ? 1 + (1 - progress / 0.18) * (ft.isBig ? 0.45 : 0.25) : 1;

        ctx.save();
        ctx.translate(sx, sy);
        ctx.scale(popScale, popScale);
        ctx.globalAlpha = alpha;
        ctx.font = ft.isBig ? 'bold 19px monospace, sans-serif' : 'bold 13px monospace, sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = ft.isBig ? 4 : 3;
        ctx.strokeStyle = '#120d16';
        ctx.strokeText(ft.text, 0, 0);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, 0, 0);
        ctx.restore();
      }
    }
  }

  return {
    EffectsManager,
    segmentIntersectsBox,
    snapToGroundY
  };
});
