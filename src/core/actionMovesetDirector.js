/**
 * 《西游破劫录》动作角色多段循环普攻 & 段数衔接神通派生（切手技 / C技）运行时引擎
 * (src/core/actionMovesetDirector.js)
 *
 * 采用零冲突 AOP 原型增强架构，无缝挂载并升级：
 * 1. 【差异化 4~5 段来回循环普攻】：
 *    - 孙悟空(5段疯魔棍) / 白龙马(5段游龙枪) / 唐僧(4段大乘禅印) / 猪八戒(4段天蓬重耙) / 沙悟净(4段卷帘流沙杖)
 *    - 后摇取消窗口 (Recovery Cancel) + 终段回环加速追击 (Loop Continuation) + 单招多段连判 (舞棍花/疾电百裂/双莲/双月) + 360°旋身判定 + 翻滚闪身不断连 (Dodge Offset)
 * 2. 【不同段数后接技能键[U] -> 派生截然不同类型的攻击（共 22 式专属切手派生技）】：
 *    - 涵盖：突进破盾 / 瞬移绕后背刺 / 挑飞升龙浮空 / 聚怪分身群爆 / 脱战折返火轮 / 消弹回血护盾 / 霸体蛮王冲撞 / 强拉噬血钩 / 扇形剑气 / 通天处决奥义
 *    - 未处于普攻连段窗口时直接按[U]，完整保留角色招牌本命大招！
 * 3. 【武术身法姿态 & 刀光法相 & 实时连段派生 HUD + 武道招式谱([V])】：
 *    - 深度联动 76x88 纸娃娃模型引擎 (heroModelEngine) 与进阶粒子系统 (effects)，呈现正反挥砍、前空翻劈、360旋身、百裂枪影与擎天巨棒等丰富视觉表现。
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
})('actionMovesetDirector', function (require) {
  const { TILE_SOLID, getTileAtPx } = require('../world/levelGen');
  const SoundFX = require('../audio/soundFX');
  const Env = require('../platform/env');
  const DouyinSDK = require('../sdk/douyinSDK');
  const { GameApp } = require('./gameApp');
  const { Player } = require('../entities/player');
  const { EffectsManager, snapToGroundY } = require('../entities/effects');
  const { UIManager, drawPixelPanel } = require('../ui/hudAndModals');

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

  function ensureMovesetState(player) {
    if (!player || player._movesetInited) return;
    player._movesetInited = true;
    player.comboLoopCount = player.comboLoopCount || 0;
    player.attackSubHitIdx = 0;
    player.deriveWindowTimer = 0;
    player.deriveStageIndex = -1;
    player.derivedActionTimer = 0;
    player.derivedActionDuration = 0.28;
    player.activeDerivation = null;
  }

  function clearEnemyProjectilesInRadius(effects, x, y, radius, burstColor) {
    if (!effects || !effects.projectiles) return 0;
    let cleared = 0;
    for (let i = effects.projectiles.length - 1; i >= 0; i--) {
      const pr = effects.projectiles[i];
      if (pr.owner === 'enemy' && Math.hypot(pr.x - x, pr.y - y) <= radius + (pr.radius || 6)) {
        effects.spawnParticles(pr.x, pr.y, 6, burstColor || '#ffd166', 35, 115, 0.1, 0.22, 0);
        effects.projectiles.splice(i, 1);
        cleared++;
      }
    }
    return cleared;
  }

  // ==================== 执行 5 大角色 × 各段数衔接的 22 式专属派生攻击 ====================
  function executeDerivedSkill(player, deriv, worldCtx) {
    const { level, effects, enemies, onHitEnemy, triggerShake, heroSprite } = worldCtx;
    const col = player.charDef.themeColor;
    const basePower = player.skillPower * 0.72 + player.atk * 0.48;
    const isFinisherArt = deriv.step >= player.charDef.combo.length;
    const roll = player.rollDamage(basePower * (deriv.dmgMult || 1.8), isFinisherArt);

    if (effects) {
      effects.spawnFloatingText(
        player.x,
        player.y - 44,
        `⚡${deriv.step}式派生·${deriv.name}！`,
        isFinisherArt ? '#ffd60a' : col,
        isFinisherArt
      );
      if (heroSprite) {
        effects.spawnAfterimage(heroSprite, player.x, player.y, player.dir, col, 0.74);
      }
    }

    switch (deriv.id) {
      // ===================== 1. 孙悟空（5段疯魔棍 -> 5式切手派生） =====================
      case 'wk_d1_pierce': {
        // 1段+U【缩地破军刺】：金箍棒横贯暴长 218px，无视正面盾牌捅穿整排妖魔
        const len = 218;
        player.vx = player.dir * 140;
        if (effects) {
          effects.spawnZone({
            kind: 'ms_staff_extend',
            x: player.x + player.dir * 10,
            y: player.y - 18,
            dir: player.dir,
            length: len,
            duration: 0.25
          });
          effects.spawnDirectionalSparks(player.x + player.dir * 42, player.y - 18, player.dir, 14, '#ffd60a');
        }
        triggerShake && triggerShake(6, player.dir, 0);
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (e.dead) continue;
          const dx = (e.x - player.x) * player.dir;
          if (dx >= -12 && dx <= len && Math.abs(e.y - player.y) <= 46) {
            onHitEnemy(e, {
              dmg: roll.dmg,
              isCrit: true,
              isHeavy: true,
              knockX: player.dir * 235,
              knockY: -55,
              stunSec: 0.45,
              ignoreShield: true,
              debuff: { type: 'expose', duration: 2.8 },
              sourceX: player.x
            });
          }
        }
        break;
      }
      case 'wk_d2_rising': {
        // 2段+U【腾云升龙棍】：挑飞面前群妖浮空眩晕 1.25s，大圣冲霄跃起可无缝接下砸
        player.vy = -415;
        player.vx = player.dir * 130;
        player.onGround = false;
        player.jumpsLeft = Math.max(1, player.jumpsLeft);
        player.invulnTimer = Math.max(player.invulnTimer, 0.34);
        player.activeDerivation = { kind: 'rising_dragon', spec: deriv, stepIdx: 1 };
        if (effects) {
          effects.spawnSlashArc({
            x: player.x + player.dir * 28,
            y: player.y - 24,
            dir: player.dir,
            radiusX: 74,
            radiusY: 72,
            color: '#ffaa22',
            accent: '#ff3b30',
            style: 'ms_risingDragon',
            heavy: true,
            duration: 0.26
          });
          effects.spawnElementalParticles && effects.spawnElementalParticles(player.x + player.dir * 24, player.y - 20, 10, 'flame', { color: '#ffd60a' });
        }
        triggerShake && triggerShake(6, 0, -1);
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (e.dead) continue;
          const dx = (e.x - player.x) * player.dir;
          if (dx >= -22 && dx <= 94 && Math.abs(e.y - player.y) <= 66) {
            onHitEnemy(e, {
              dmg: roll.dmg,
              isCrit: roll.isCrit,
              isHeavy: true,
              knockX: player.dir * 85,
              knockY: -260,
              stunSec: 1.25,
              ignoreShield: true,
              sourceX: player.x
            });
          }
        }
        break;
      }
      case 'wk_d3_clones': {
        // 3段+U【毫毛千钧阵】：清弹幕 + 强聚怪 + 左中右 3 尊毫毛金猴连环引爆
        clearEnemyProjectilesInRadius(effects, player.x, player.y - 18, 145, '#ffd60a');
        effects &&
          effects.spawnSlashArc({
            x: player.x,
            y: player.y - 18,
            dir: player.dir,
            radiusX: 88,
            radiusY: 34,
            color: '#ffd60a',
            accent: '#ff3b30',
            style: 'ms_flurrySpin',
            heavy: true,
            duration: 0.22
          });
        const pullX = player.x + player.dir * 42;
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (!e.dead && Math.hypot(e.x - player.x, e.y - player.y) <= 155) {
            if (!e.isBoss) e.x += (pullX - e.x) * 0.55;
            onHitEnemy(e, {
              dmg: Math.round(roll.dmg * 0.55),
              isCrit: false,
              knockX: (pullX - e.x) * 1.4,
              knockY: -35,
              ignoreShield: true,
              sourceX: player.x
            });
          }
        }
        [-26, 26, 68].forEach((offX, idx) => {
          const cx = Math.max(36, Math.min(level.widthPx - 36, player.x + player.dir * offX));
          const gy = snapToGroundY ? snapToGroundY(level, cx, player.y, 48) : player.y;
          effects &&
            effects.spawnZone({
              kind: 'wukong_clone_bomb',
              x: cx,
              y: gy,
              radius: 64,
              dmg: roll.dmg,
              duration: 0.24 + idx * 0.1
            });
        });
        break;
      }
      case 'wk_d4_wheel': {
        // 4段+U【火眼金轮破】：后空翻脱战拉开距离 + 火眼射线 + 巨型折返金箍火轮
        player.vx = -player.dir * 175;
        player.vy = -170;
        player.onGround = false;
        player.invulnTimer = Math.max(player.invulnTimer, 0.28);
        player.activeDerivation = { kind: 'backflip_shot', spec: deriv, stepIdx: 3 };
        if (effects) {
          effects.spawnZone({
            kind: 'laser_beam',
            x: player.x,
            y: player.y - 22,
            dir: player.dir,
            length: 148,
            color: '#ff3b30',
            duration: 0.2
          });
          effects.spawnProjectile({
            owner: 'player',
            kind: 'boomerang',
            x: player.x + player.dir * 16,
            y: player.y - 18,
            vx: player.dir * 465,
            vy: 0,
            radius: 15,
            dmg: roll.dmg,
            isCrit: true,
            pierce: 99,
            passWall: true,
            ignoreShield: true,
            debuff: { type: 'burn', duration: 2.4, dps: Math.max(4, Math.round(player.atk * 0.3)) },
            color: '#ffd60a',
            life: 1.45
          });
        }
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (!e.dead && (e.x - player.x) * player.dir >= -10 && (e.x - player.x) * player.dir <= 148 && Math.abs(e.y - player.y) <= 44) {
            onHitEnemy(e, {
              dmg: Math.round(roll.dmg * 0.65),
              isCrit: true,
              knockX: player.dir * 145,
              knockY: -50,
              stunSec: 0.65,
              ignoreShield: true,
              sourceX: player.x
            });
          }
        }
        break;
      }
      case 'wk_d5_pillar': {
        // 5段+U【法天·擎天巨棒】：天降通天巨型如意金箍棒法相轰裂大地！
        player.invulnTimer = Math.max(player.invulnTimer, 0.42);
        const px = Math.max(48, Math.min(level.widthPx - 48, player.x + player.dir * 86));
        const gy = snapToGroundY ? snapToGroundY(level, px, player.y, 56) : player.y;
        SoundFX.play('slam');
        triggerShake && triggerShake(13, 0, 1);
        if (effects) {
          effects.spawnZone({
            kind: 'ms_heaven_pillar',
            x: px,
            y: gy,
            pillarW: 40,
            color: '#ffd60a',
            coreColor: '#ef233c',
            duration: 0.46
          });
          effects.spawnZone({
            kind: 'shockwave_ring',
            x: px,
            y: gy - 8,
            radius: 152,
            color: '#ffd60a',
            duration: 0.36
          });
          effects.spawnZone({
            kind: 'earth_crater',
            x: px,
            y: gy,
            radius: 56,
            color: '#ffd60a',
            duration: 2.5
          });
          effects.spawnDebris(px, gy - 6, 16, ['#ffd60a', '#ef233c', '#adb5bd'], player.dir);
        }
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (!e.dead && Math.abs(e.x - px) <= 144 && Math.abs(e.y - gy) <= 74) {
            onHitEnemy(e, {
              dmg: roll.dmg,
              isCrit: true,
              isHeavy: true,
              knockX: (e.x >= px ? 1 : -1) * 265,
              knockY: -175,
              stunSec: 1.5,
              ignoreShield: true,
              debuff: [
                { type: 'expose', duration: 3.5 },
                { type: 'burn', duration: 2.6, dps: Math.max(5, Math.round(player.atk * 0.34)) }
              ],
              sourceX: px
            });
          }
        }
        break;
      }

      // ===================== 2. 唐僧（4段大乘禅印 -> 4式真言派生） =====================
      case 'ts_d1_laser': {
        // 1段+U【韦陀降魔杵】：320px 璀璨降魔神光贯穿全线
        const len = 320;
        if (effects) {
          effects.spawnZone({
            kind: 'laser_beam',
            x: player.x + player.dir * 12,
            y: player.y - 19,
            dir: player.dir,
            length: len,
            color: '#ffd166',
            duration: 0.26
          });
          effects.spawnElementalParticles && effects.spawnElementalParticles(player.x + player.dir * 26, player.y - 18, 12, 'holy', { color: '#ffd166' });
        }
        triggerShake && triggerShake(5, player.dir, 0);
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (e.dead) continue;
          const dx = (e.x - player.x) * player.dir;
          if (dx >= -8 && dx <= len && Math.abs(e.y - player.y) <= 44) {
            e.slowTimer = Math.max(e.slowTimer, 2.5);
            onHitEnemy(e, {
              dmg: roll.dmg,
              isCrit: true,
              knockX: player.dir * 155,
              knockY: -45,
              ignoreShield: true,
              debuff: { type: 'expose', duration: 3.0 },
              sourceX: player.x
            });
          }
        }
        break;
      }
      case 'ts_d2_bind': {
        // 2段+U【紧箍咒锁阵】：前方布下紧箍真言环强力聚怪禁锢持续梵烧
        const bx = Math.max(48, Math.min(level.widthPx - 48, player.x + player.dir * 105));
        const gy = snapToGroundY ? snapToGroundY(level, bx, player.y, 56) : player.y;
        if (effects) {
          effects.spawnZone({
            kind: 'ms_tangseng_bind',
            x: bx,
            y: gy,
            radius: 108,
            dmg: Math.max(5, Math.round(roll.dmg * 0.36)),
            duration: 2.0
          });
          effects.spawnElementalParticles && effects.spawnElementalParticles(bx, gy - 16, 16, 'petal', { color: '#ffd166', accent: '#ff5e57', spreadX: 32, spreadY: 16 });
        }
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (!e.dead && Math.hypot(e.x - bx, e.y - gy) <= 125) {
            if (!e.isBoss) e.x += (bx - e.x) * 0.6;
            onHitEnemy(e, {
              dmg: Math.round(roll.dmg * 0.8),
              isCrit: roll.isCrit,
              knockX: (bx - e.x) * 1.4,
              knockY: -45,
              stunSec: 1.25,
              ignoreShield: true,
              debuff: { type: 'burn', duration: 2.4, dps: Math.max(5, Math.round(player.skillPower * 0.3)) },
              sourceX: bx
            });
          }
        }
        break;
      }
      case 'ts_d3_bell': {
        // 3段+U【九环甘露钟】：清弹幕 + 震退近身妖魔 + 回复 7% 气血与 20% 护盾
        clearEnemyProjectilesInRadius(effects, player.x, player.y - 18, 165, '#ffd166');
        player.heal(player.maxHp * 0.07, effects);
        player.shieldHp = Math.max(player.shieldHp, Math.round(player.maxHp * 0.2));
        effects &&
          effects.spawnZone({
            kind: 'shockwave_ring',
            x: player.x,
            y: player.y - 18,
            radius: 145,
            color: '#ffd166',
            duration: 0.35
          });
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (!e.dead && Math.hypot(e.x - player.x, e.y - player.y) <= 145) {
            onHitEnemy(e, {
              dmg: roll.dmg,
              isCrit: roll.isCrit,
              knockX: (e.x >= player.x ? 1 : -1) * 215,
              knockY: -85,
              stunSec: 1.15,
              ignoreShield: true,
              sourceX: player.x
            });
          }
        }
        break;
      }
      case 'ts_d4_palm': {
        // 4段+U【如来·佛国圣柱】：巨型金色佛国圣柱从天而降裁决妖群
        const px = Math.max(48, Math.min(level.widthPx - 48, player.x + player.dir * 96));
        const gy = snapToGroundY ? snapToGroundY(level, px, player.y, 56) : player.y;
        SoundFX.play('slam');
        triggerShake && triggerShake(12, 0, 1);
        if (effects) {
          effects.spawnZone({
            kind: 'ms_heaven_pillar',
            x: px,
            y: gy,
            pillarW: 48,
            color: '#ffd166',
            coreColor: '#fff8e7',
            duration: 0.46
          });
          effects.spawnZone({
            kind: 'shockwave_ring',
            x: px,
            y: gy - 10,
            radius: 155,
            color: '#ffd166',
            duration: 0.38
          });
          effects.spawnElementalParticles && effects.spawnElementalParticles(px, gy - 20, 20, 'petal', { color: '#ffd166', accent: '#ffffff', spreadX: 44, spreadY: 28 });
        }
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (!e.dead && Math.abs(e.x - px) <= 148 && Math.abs(e.y - gy) <= 74) {
            onHitEnemy(e, {
              dmg: roll.dmg,
              isCrit: true,
              isHeavy: true,
              knockX: (e.x >= px ? 1 : -1) * 240,
              knockY: -155,
              stunSec: 1.65,
              ignoreShield: true,
              debuff: { type: 'expose', duration: 3.6 },
              sourceX: px
            });
          }
        }
        break;
      }

      // ===================== 3. 猪八戒（4段天蓬重耙 -> 4式煞气派生） =====================
      case 'bj_d1_ram': {
        // 1段+U【野猪蛮王冲】：霸体扛耙高速冲撞，超高撞墙粉碎推力
        player.activeDerivation = {
          kind: 'charge_ram',
          spec: deriv,
          stepIdx: 0,
          speed: 445,
          dmg: roll.dmg,
          hitMap: {}
        };
        player.vx = player.dir * 445;
        effects && effects.spawnParticles(player.x, player.y - 8, 12, '#7be495', 35, 130, 0.14, 0.28, 80);
        break;
      }
      case 'bj_d2_hook': {
        // 2段+U【饕餮噬血钩】：198px 巨耙强拉群妖至身前撕裂并大口吸血
        effects &&
          effects.spawnSlashArc({
            x: player.x + player.dir * 72,
            y: player.y - 18,
            dir: player.dir,
            radiusX: 145,
            radiusY: 48,
            color: '#7be495',
            accent: '#ffd166',
            style: 'ms_rakePull',
            heavy: true,
            duration: 0.26
          });
        triggerShake && triggerShake(7, -player.dir, 0);
        let hooked = 0;
        const targetFrontX = player.x + player.dir * 32;
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (e.dead) continue;
          const dx = (e.x - player.x) * player.dir;
          if (dx >= -15 && dx <= 198 && Math.abs(e.y - player.y) <= 56) {
            hooked++;
            if (!e.isBoss) e.x = targetFrontX + (Math.random() - 0.5) * 14;
            effects && effects.spawnSiphonOrb && effects.spawnSiphonOrb(e.x, e.y - 18, '#7be495');
            onHitEnemy(e, {
              dmg: roll.dmg,
              isCrit: roll.isCrit,
              isHeavy: true,
              knockX: -player.dir * 145,
              knockY: -85,
              stunSec: 0.65,
              ignoreShield: true,
              debuff: { type: 'bleed', duration: 3.2, stacks: 2, dps: Math.max(5, Math.round(player.atk * 0.32)) },
              sourceX: player.x
            });
          }
        }
        if (hooked > 0) {
          player.heal(player.maxHp * 0.05 * Math.min(4, hooked), effects);
          if (Math.random() < 0.35 && effects) {
            effects.spawnLoot(targetFrontX, player.y, 0, 0, true);
          }
        }
        break;
      }
      case 'bj_d3_upheave': {
        // 3段+U【黑风掀地耙】：掀翻大地抛飞周身妖魔 + 18% 厚土护盾
        player.shieldHp = Math.max(player.shieldHp, Math.round(player.maxHp * 0.18));
        SoundFX.play('slam');
        triggerShake && triggerShake(8, 0, -1);
        if (effects) {
          effects.spawnSlashArc({
            x: player.x + player.dir * 26,
            y: player.y - 20,
            dir: player.dir,
            radiusX: 84,
            radiusY: 66,
            color: '#7be495',
            style: 'ms_risingDragon',
            heavy: true,
            duration: 0.26
          });
          effects.spawnDebris(player.x + player.dir * 28, player.y - 4, 12, ['#7be495', '#ffd166', '#adb5bd'], player.dir);
        }
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (!e.dead && Math.abs(e.x - player.x) <= 116 && Math.abs(e.y - player.y) <= 58) {
            onHitEnemy(e, {
              dmg: roll.dmg,
              isCrit: roll.isCrit,
              isHeavy: true,
              knockX: (e.x >= player.x ? 1 : -1) * 115,
              knockY: -245,
              stunSec: 1.3,
              ignoreShield: true,
              debuff: { type: 'expose', duration: 3.0 },
              sourceX: player.x
            });
          }
        }
        break;
      }
      case 'bj_d4_quake': {
        // 4段+U【天蓬·三连崩山】：前方依次引爆 3 道递进喷发的熔金岩柱
        SoundFX.play('slam');
        triggerShake && triggerShake(12, player.dir, 1);
        [56, 120, 184].forEach((dist, idx) => {
          const ex = Math.max(36, Math.min(level.widthPx - 36, player.x + player.dir * dist));
          const gy = snapToGroundY ? snapToGroundY(level, ex, player.y, 56) : player.y;
          effects &&
            effects.spawnZone({
              kind: 'ms_earth_erupt',
              x: ex,
              y: gy,
              radius: 54,
              rangeY: 68,
              dmg: roll.dmg,
              isCrit: true,
              knockDir: player.dir,
              knockX: 225,
              knockY: -165,
              stunSec: 1.15,
              color: '#7be495',
              debrisColors: ['#7be495', '#ffd166', '#adb5bd'],
              msDelay: idx * 0.09,
              msBurstOnStart: true,
              duration: 0.36
            });
        });
        break;
      }

      // ===================== 4. 沙悟净（4段卷帘流沙杖 -> 4式玄水派生） =====================
      case 'wj_d1_surge': {
        // 1段+U【破浪贯月刺】：激流突进穿刺并挂满 3.5 秒寒流减速（瞬间激活悟净 +30% 增伤被动！）
        player.activeDerivation = {
          kind: 'wave_lunge',
          spec: deriv,
          stepIdx: 0,
          speed: 435,
          dmg: roll.dmg,
          hitMap: {}
        };
        player.vx = player.dir * 435;
        player.invulnTimer = Math.max(player.invulnTimer, 0.26);
        break;
      }
      case 'wj_d2_ward': {
        // 2段+U【卷帘回天壁】：清弹幕 + 16% 水盾 + 周身震晕寒霜
        clearEnemyProjectilesInRadius(effects, player.x, player.y - 18, 158, '#6cd4ff');
        player.shieldHp = Math.max(player.shieldHp, Math.round(player.maxHp * 0.16));
        if (effects) {
          effects.spawnSlashArc({
            x: player.x,
            y: player.y - 18,
            dir: player.dir,
            radiusX: 96,
            radiusY: 42,
            color: '#6cd4ff',
            style: 'spin360',
            heavy: true,
            duration: 0.25
          });
          effects.spawnZone({
            kind: 'shockwave_ring',
            x: player.x,
            y: player.y - 18,
            radius: 132,
            color: '#6cd4ff',
            duration: 0.32
          });
        }
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (!e.dead && Math.hypot(e.x - player.x, e.y - player.y) <= 132) {
            e.slowTimer = Math.max(e.slowTimer, 3.0);
            onHitEnemy(e, {
              dmg: roll.dmg,
              isCrit: roll.isCrit,
              knockX: (e.x >= player.x ? 1 : -1) * 185,
              knockY: -70,
              stunSec: 1.2,
              ignoreShield: true,
              debuff: { type: 'chill', duration: 3.0 },
              sourceX: player.x
            });
          }
        }
        break;
      }
      case 'wj_d3_blades': {
        // 3段+U【三千弱水刃】：扇形齐射 5 道高速穿透朔月水刃
        effects &&
          effects.spawnSlashArc({
            x: player.x + player.dir * 30,
            y: player.y - 18,
            dir: player.dir,
            radiusX: 68,
            radiusY: 46,
            color: '#6cd4ff',
            accent: '#b388ff',
            style: 'ms_crossSlash',
            heavy: true,
            duration: 0.22
          });
        [-108, -54, 0, 54, 108].forEach((vyVal) => {
          effects &&
            effects.spawnProjectile({
              owner: 'player',
              kind: 'crescent_wave',
              x: player.x + player.dir * 18,
              y: player.y - 19,
              vx: player.dir * 445,
              vy: vyVal,
              radius: 11,
              dmg: roll.dmg,
              isCrit: true,
              pierce: 3,
              ignoreShield: true,
              debuff: { type: 'chill', duration: 2.0 },
              knock: 135,
              color: '#6cd4ff',
              coreColor: '#ffffff',
              life: 0.75
            });
        });
        break;
      }
      case 'wj_d4_maelstrom': {
        // 4段+U【深渊·流沙龙卷】：横推全屏深渊巨型水龙卷 + 原地流沙漩涡水阵
        triggerShake && triggerShake(9, player.dir, 0);
        if (effects) {
          effects.spawnProjectile({
            owner: 'player',
            kind: 'tornado',
            x: player.x + player.dir * 22,
            y: player.y - 18,
            vx: player.dir * 275,
            vy: 0,
            radius: 26,
            dmg: roll.dmg,
            isCrit: true,
            pierce: 99,
            passWall: true,
            destroyEnemyProj: true,
            ignoreShield: true,
            debuff: { type: 'chill', duration: 2.6 },
            knock: 245,
            color: '#6cd4ff',
            life: 1.45
          });
          const vx = Math.max(48, Math.min(level.widthPx - 48, player.x + player.dir * 66));
          const gy = snapToGroundY ? snapToGroundY(level, vx, player.y, 56) : player.y;
          effects.spawnZone({
            kind: 'wujing_vortex',
            x: vx,
            y: gy,
            radius: 86,
            dmg: Math.max(6, Math.round(player.skillPower * 0.6)),
            duration: 2.8
          });
        }
        break;
      }

      // ===================== 5. 白龙马（5段西海游龙枪 -> 5式雷霆派生） =====================
      case 'bl_d1_blink': {
        // 1段+U【惊雷一闪刺】：化青电瞬移穿过前方妖魔至其背后回身破盾暴击！
        const startX = player.x;
        const startY = player.y;
        let targetX = player.x;
        const step = 8 * player.dir;
        for (let s = 0; s < 19; s++) {
          const nextX = targetX + step;
          if (
            getTileAtPx(level, nextX + player.dir * 10, player.y - 8) === TILE_SOLID ||
            getTileAtPx(level, nextX + player.dir * 10, player.y - 24) === TILE_SOLID
          ) {
            break;
          }
          targetX = nextX;
          if (s % 3 === 0 && effects && heroSprite) {
            effects.spawnAfterimage(heroSprite, targetX, startY, player.dir, '#00f5d4', 0.75);
          }
        }
        const origDir = player.dir;
        player.x = targetX;
        player.invulnTimer = Math.max(player.invulnTimer, 0.3);

        const minX = Math.min(startX, targetX) - 16;
        const maxX = Math.max(startX, targetX) + 16;
        let crossedAny = false;
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (!e.dead && e.x >= minX && e.x <= maxX && Math.abs(e.y - startY) <= 52) {
            crossedAny = true;
            onHitEnemy(e, {
              dmg: roll.dmg,
              isCrit: true,
              isHeavy: true,
              knockX: -origDir * 150,
              knockY: -65,
              stunSec: 0.85,
              ignoreShield: true,
              debuff: { type: 'shock', duration: 3.0 },
              sourceX: targetX
            });
          }
        }
        if (crossedAny) {
          player.dir = -origDir; // 瞬移过背自动回身面向敌背，方便立刻继续背刺连段！
        }
        if (effects) {
          effects.spawnLightningBolt && effects.spawnLightningBolt(startX, startY - 18, targetX, startY - 18, '#00f5d4', 2.8, 0.22);
          effects.spawnZone({
            kind: 'laser_beam',
            x: startX,
            y: startY - 18,
            dir: origDir,
            length: Math.abs(targetX - startX) + 20,
            color: '#00f5d4',
            duration: 0.2
          });
        }
        break;
      }
      case 'bl_d2_ascend': {
        // 2段+U【翔龙升天破】：螺旋冲霄挑飞群妖 + 立即重置全部三段跳次数！
        player.vy = -435;
        player.vx = player.dir * 135;
        player.onGround = false;
        player.jumpsLeft = player.maxJumps;
        player.invulnTimer = Math.max(player.invulnTimer, 0.32);
        player.activeDerivation = { kind: 'rising_dragon', spec: deriv, stepIdx: 1 };
        if (effects) {
          effects.spawnSlashArc({
            x: player.x + player.dir * 24,
            y: player.y - 24,
            dir: player.dir,
            radiusX: 70,
            radiusY: 74,
            color: '#00f5d4',
            accent: '#e0f7ff',
            style: 'ms_risingDragon',
            heavy: true,
            duration: 0.25
          });
          effects.spawnElementalParticles && effects.spawnElementalParticles(player.x, player.y - 18, 12, 'lightning', { color: '#00f5d4' });
        }
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (!e.dead && Math.abs(e.x - player.x) <= 88 && Math.abs(e.y - player.y) <= 64) {
            e.slowTimer = Math.max(e.slowTimer, 2.2);
            onHitEnemy(e, {
              dmg: roll.dmg,
              isCrit: roll.isCrit,
              knockX: player.dir * 95,
              knockY: -245,
              stunSec: 1.0,
              ignoreShield: true,
              debuff: { type: 'shock', duration: 2.8 },
              sourceX: player.x
            });
          }
        }
        break;
      }
      case 'bl_d3_barrage': {
        // 3段+U【狂雷暴雨枪】：枪尖密集爆射 6 道超高速穿透青电枪芒
        effects &&
          effects.spawnSlashArc({
            x: player.x + player.dir * 34,
            y: player.y - 18,
            dir: player.dir,
            radiusX: 74,
            radiusY: 36,
            color: '#00f5d4',
            style: 'ms_lanceFlurry',
            heavy: true,
            duration: 0.22
          });
        for (let b = 0; b < 6; b++) {
          effects &&
            effects.spawnProjectile({
              owner: 'player',
              kind: 'dragon_bolt',
              x: player.x + player.dir * (16 + (b % 2) * 10),
              y: player.y - 24 + (b - 2.5) * 4,
              vx: player.dir * (510 + b * 24),
              vy: (b - 2.5) * 24,
              radius: 8,
              dmg: roll.dmg,
              isCrit: b % 2 === 0 || roll.isCrit,
              pierce: 3,
              ignoreShield: true,
              debuff: { type: 'shock', duration: 2.5 },
              knock: 95,
              color: '#00f5d4',
              coreColor: '#ffffff',
              life: 0.72
            });
        }
        break;
      }
      case 'bl_d4_coil': {
        // 4段+U【沧海盘龙网】：绕身青电电网清弹幕 + 眩晕感电
        clearEnemyProjectilesInRadius(effects, player.x, player.y - 18, 148, '#00f5d4');
        if (effects) {
          effects.spawnSlashArc({
            x: player.x,
            y: player.y - 18,
            dir: player.dir,
            radiusX: 98,
            radiusY: 40,
            color: '#00f5d4',
            style: 'spin360',
            heavy: true,
            duration: 0.24
          });
          effects.spawnZone({
            kind: 'shockwave_ring',
            x: player.x,
            y: player.y - 18,
            radius: 128,
            color: '#00f5d4',
            duration: 0.3
          });
        }
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (!e.dead && Math.hypot(e.x - player.x, e.y - player.y) <= 128) {
            onHitEnemy(e, {
              dmg: roll.dmg,
              isCrit: roll.isCrit,
              knockX: (e.x >= player.x ? 1 : -1) * 165,
              knockY: -70,
              stunSec: 1.2,
              ignoreShield: true,
              debuff: { type: 'shock', duration: 3.2 },
              sourceX: player.x
            });
          }
        }
        break;
      }
      case 'bl_d5_storm': {
        // 5段+U【九霄·万雷天牢】：在前方战线连续降下 4 道粗大九霄天雷柱毁灭清场！
        player.invulnTimer = Math.max(player.invulnTimer, 0.36);
        SoundFX.play('thunderStrike');
        triggerShake && triggerShake(12, player.dir, 1);
        [52, 108, 164, 220].forEach((dist, idx) => {
          const tx = Math.max(36, Math.min(level.widthPx - 36, player.x + player.dir * dist));
          const gy = snapToGroundY ? snapToGroundY(level, tx, player.y, 64) : player.y;
          effects &&
            effects.spawnZone({
              kind: 'ms_thunder_pillar',
              x: tx,
              y: gy,
              radius: 52,
              rangeY: 92,
              dmg: roll.dmg,
              isCrit: true,
              knockDir: player.dir,
              knockX: 195,
              knockY: -145,
              stunSec: 1.15,
              color: '#00f5d4',
              msDelay: idx * 0.08,
              msBurstOnStart: true,
              duration: 0.34
            });
        });
        break;
      }
      default:
        break;
    }
  }

  function installActionMovesetDirector() {
    if (GameApp.__actionMovesetDirectorInstalled) return;
    GameApp.__actionMovesetDirectorInstalled = true;

    const HeroModelEngine = getOptionalModule('heroModelEngine', '../assets/heroModelEngine');
    const UITheme = getOptionalModule('uiTheme', '../ui/uiTheme');

    // =========================================================================
    // 1. Player 动作模组核心增强：4~5段来回循环 + 切手派生 + 多段连判 + 翻滚不断连
    // =========================================================================
    Player.prototype.getAvailableDerivation = function () {
      ensureMovesetState(this);
      const list = this.charDef && this.charDef.derivations;
      if (!list || !list.length) return null;
      if (this.deriveWindowTimer <= 0 || this.deriveStageIndex < 0) return null;
      return list[this.deriveStageIndex % list.length] || null;
    };

    const origTakeDamage = Player.prototype.takeDamage;
    Player.prototype.takeDamage = function (rawDmg, knockDir, effects, playerDebuff) {
      ensureMovesetState(this);
      const inDerivedArmor =
        (this.activeDerivation && this.activeDerivation.kind === 'charge_ram') ||
        (this.id === 'bajie' && this.attackTimer > 0 && this.currentAttackSpec && this.currentAttackSpec.style === 'spin360');
      if (inDerivedArmor) {
        const prevVx = this.vx;
        const prevVy = this.vy;
        const res = origTakeDamage.call(this, Math.max(1, Math.round(rawDmg * 0.38)), knockDir, effects, playerDebuff);
        if (!this.dead) {
          this.vx = prevVx;
          this.vy = prevVy;
        }
        return res;
      }
      return origTakeDamage.call(this, rawDmg, knockDir, effects, playerDebuff);
    };

    // 翻滚闪身不断连段（Dodge Offset）：翻滚绕后仍保留当前普攻段数与切手派生窗口！
    const origTryRoll = Player.prototype.tryRoll;
    Player.prototype.tryRoll = function (moveDir, worldCtx) {
      ensureMovesetState(this);
      const savedComboIdx = this.comboIndex;
      const savedLoopCnt = this.comboLoopCount;
      const savedReset = this.comboResetTimer;
      const savedDeriveT = this.deriveWindowTimer;
      const savedDeriveStage = this.deriveStageIndex;

      this.derivedActionTimer = 0;
      this.activeDerivation = null;

      const prevRoll = this.rollTimer;
      origTryRoll.call(this, moveDir, worldCtx);
      if (prevRoll <= 0 && this.rollTimer > 0 && savedReset > 0) {
        this.comboIndex = savedComboIdx;
        this.comboLoopCount = savedLoopCnt;
        this.comboResetTimer = Math.max(savedReset, 0.82);
        if (savedDeriveT > 0) {
          this.deriveStageIndex = savedDeriveStage;
          this.deriveWindowTimer = Math.max(savedDeriveT, 0.62);
        }
      }
    };

    // 4~5 段普攻无缝来回循环 + 后摇取消 + 腾跃劈物理 + 开启段数派生窗口
    const origTryPrimaryAttack = Player.prototype.tryPrimaryAttack;
    Player.prototype.tryPrimaryAttack = function (moveDir) {
      ensureMovesetState(this);
      if (this.dead || this.isGroundSmashing || this.derivedActionTimer > 0) return;

      // 后摇取消点判定：一旦当前招式所有子段命中完毕且到达 cancelTime，立即清零 attackTimer 无缝切入下一段/下一轮循环！
      if (this.attackTimer > 0 && this.currentAttackSpec) {
        const curSpec = this.currentAttackSpec;
        const elapsed = this.attackDuration - this.attackTimer;
        const hitList = curSpec.hitTimes || [curSpec.hitTime];
        const cancelAt = curSpec.cancelTime || this.attackDuration * 0.68;
        if (this.attackSubHitIdx >= hitList.length && elapsed >= cancelAt) {
          this.attackTimer = 0;
        }
      }

      if (this.comboResetTimer <= 0) {
        this.comboLoopCount = 0;
      }

      const prevTimer = this.attackTimer;
      origTryPrimaryAttack.call(this, moveDir);

      // 检测是否刚刚挥出全新的一段普攻
      if (prevTimer <= 0 && this.attackTimer > 0 && this.currentAttackSpec) {
        const combos = this.charDef.combo;
        const stepIdx = this.currentComboStep;
        const spec = this.currentAttackSpec;
        const isFinisher = stepIdx === combos.length - 1;
        const isLoopEntry = stepIdx === 0 && this.comboLoopCount > 0;

        this.attackSubHitIdx = 0;

        // 终段收招后无缝回环至第 1 段：提速 12% 并强化追击突进，形成真正的「来回循环连舞」！
        if (isLoopEntry) {
          this.attackDuration = spec.duration * 0.88;
          this.attackTimer = this.attackDuration;
          this.vx *= 1.26;
          if (this._appRef && this._appRef.effects) {
            this._appRef.effects.spawnParticles(this.x - this.dir * 8, this.y - 4, 5, this.charDef.themeColor, 25, 85, 0.1, 0.2, 20);
          }
        }

        if (isFinisher) {
          this.comboLoopCount++;
          this.triggerSquash(1.28, 0.8);
          SoundFX.play('slash5');
        } else if (spec.hitTimes && spec.hitTimes.length > 1) {
          SoundFX.play('flurry');
        } else if (stepIdx >= 3) {
          SoundFX.play('slash4');
        }

        // 腾跃劈 / 升龙挑 / 悬浮印小幅跃起物理
        if (spec.hopY && (this.onGround || this.vy > -35)) {
          this.vy = spec.hopY;
          this.onGround = false;
          const webMult = this.webSlowTimer > 0 ? 0.72 : 1.0;
          this.vx = this.dir * spec.lunge * 1.08 * webMult;
        } else if (!this.onGround) {
          this.vx = this.dir * spec.lunge * 0.62;
        }

        this.comboResetTimer = this.attackDuration + 0.75;
        // 激活当前段数的【神通切手派生窗口】
        this.deriveStageIndex = stepIdx;
        this.deriveWindowTimer = this.attackDuration + 0.70;
      }
    };

    // 技能键 [U] 智能分流：连段派生窗口内 -> 触发对应段数的切手派生攻击；否则 -> 释放本命大招！
    const origTryCastSkill = Player.prototype.tryCastSkill;
    Player.prototype.tryCastSkill = function (worldCtx) {
      ensureMovesetState(this);
      if (this.dead || this.isGroundSmashing) return;
      if (this.skillCdTimer > 0) {
        return origTryCastSkill.call(this, worldCtx);
      }

      const deriv = this.getAvailableDerivation();
      if (!deriv) {
        return origTryCastSkill.call(this, worldCtx);
      }

      const { effects, enemies, onHitEnemy, triggerZoomPunch } = worldCtx;
      const dCost = deriv.mpCost || 12;
      if (!this.spendMp(dCost, effects)) return;

      this.skillCdTimer = (deriv.cd || 1.8) * (1 - this.cdReduction);
      this.attackTimer = 0;
      this.rollTimer = 0;
      this.webSlowTimer = 0;
      this.deriveWindowTimer = 0;
      this.derivedActionDuration = deriv.duration || 0.28;
      this.derivedActionTimer = this.derivedActionDuration;
      this.activeDerivation = { kind: 'pose', spec: deriv, stepIdx: this.deriveStageIndex };

      // 终段派生后重置回第 1 段起手；前中段派生后仍保留连段续航，支持「普攻1~2 -> 切手派生 -> 续接普攻3~5」！
      if (deriv.step >= this.charDef.combo.length) {
        this.comboIndex = 0;
        this.comboLoopCount++;
        this.comboResetTimer = this.derivedActionDuration + 0.68;
      } else {
        this.comboResetTimer = Math.max(this.comboResetTimer, this.derivedActionDuration + 0.72);
      }

      this.triggerSquash(1.26, 0.78);
      SoundFX.play('deriveCast');
      Env.vibrate('medium');
      triggerZoomPunch && triggerZoomPunch(deriv.step >= this.charDef.combo.length ? 0.058 : 0.038);

      // 兼容神品装备词条【九天引雷】与法相减CD
      if (this.equipStats && this.equipStats.specials && this.equipStats.specials.thunder_call) {
        const boltDmg = Math.round(this.magic * 1.15);
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (!e.dead && Math.hypot(e.x - this.x, e.y - this.y) <= 185) {
            effects && effects.spawnLightningBolt && effects.spawnLightningBolt(e.x, e.y - 130, e.x, e.y - 18, '#00f5d4', 2.5, 0.2);
            onHitEnemy(e, {
              dmg: boltDmg,
              isCrit: true,
              knockX: (e.x >= this.x ? 1 : -1) * 120,
              knockY: -55,
              stunSec: 0.4,
              ignoreShield: true,
              debuff: { type: 'shock', duration: 2.8 },
              sourceX: this.x
            });
            break;
          }
        }
      }
      if (this.starterAspect) {
        if (this.starterAspect.id === 'wk_aspect_havoc') this.skillCdTimer *= 0.8;
        else if (this.starterAspect.id === 'wj_aspect_abyss') this.skillCdTimer *= 0.7;
      }

      executeDerivedSkill(this, deriv, worldCtx);
    };

    // 增强出刀视觉：兼容多子段刀光样式、唐僧双莲上下错位连珠与九环震禅波
    const origSpawnAttackVisuals = Player.prototype.spawnAttackVisualsAndProjectiles;
    if (origSpawnAttackVisuals) {
      Player.prototype.spawnAttackVisualsAndProjectiles = function (spec, worldCtx) {
        const mappedStyleMap = {
          flurrySpin: 'ms_flurrySpin',
          crossSlash: 'ms_crossSlash',
          lanceFlurry: 'ms_lanceFlurry',
          backSweep: 'ms_backSweep',
          leapSlash: 'ms_leapSlash',
          rakePull: 'ms_rakePull'
        };
        const savedStyle = spec.style;
        if (mappedStyleMap[savedStyle]) {
          spec.style = mappedStyleMap[savedStyle];
        }
        origSpawnAttackVisuals.call(this, spec, worldCtx);
        spec.style = savedStyle;

        if (savedStyle === 'staffPulse' && worldCtx && worldCtx.effects) {
          worldCtx.effects.spawnZone({
            kind: 'shockwave_ring',
            x: this.x,
            y: this.y - 18,
            radius: spec.rangeX,
            color: '#ffd166',
            duration: 0.22
          });
        }
      };
    }

    // 帧更新增强：处理多段子击（舞棍花/疾电百裂/双莲/双月）、360°背后判定、终段减CD与持续型切手冲撞
    const origPlayerUpdate = Player.prototype.update;
    Player.prototype.update = function (dt, input, worldCtx) {
      ensureMovesetState(this);
      const { effects, enemies, onHitEnemy, heroSprite } = worldCtx;

      this.deriveWindowTimer = Math.max(0, this.deriveWindowTimer - dt);
      if (this.comboResetTimer <= 0) {
        this.comboLoopCount = 0;
      }

      // 处理单招内多连击子段触发（如白龙马 3段百裂刺 [0.05, 0.11, 0.17]、悟空 3段舞棍花 [0.07, 0.17]）
      if (this.attackTimer > 0 && this.currentAttackSpec) {
        const spec = this.currentAttackSpec;
        const hitList = spec.hitTimes || [spec.hitTime];
        const elapsed = this.attackDuration - Math.max(0, this.attackTimer - dt);

        if (this.attackSubHitIdx === 0 && elapsed >= hitList[0]) {
          this.attackSubHitIdx = 1;
        } else if (this.attackSubHitIdx < hitList.length && elapsed >= hitList[this.attackSubHitIdx]) {
          this.attackSubHitIdx++;
          this.attackHitIds = {};
          this.attackSlashSpawned = false;
          SoundFX.play('flurry');
        }
      }

      const prevLanded = this.attackLandedAny;
      origPlayerUpdate.call(this, dt, input, worldCtx);

      // 360° 回旋招式（hitAround: true）补充身侧与背后妖魔命中判定 + 附加减速
      if (this.attackTimer > 0 && this.currentAttackSpec && this.currentAttackSpec.hitAround && this.attackSlashSpawned) {
        const spec = this.currentAttackSpec;
        const isFinisher = this.currentComboStep === this.charDef.combo.length - 1 || !!spec.forceCrit;
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (e.dead || this.attackHitIds[e.uid]) continue;
          if (Math.abs(e.x - this.x) <= spec.rangeX + e.width * 0.45 && Math.abs(e.y - e.height * 0.5 - (this.y - 18)) <= spec.rangeY * 0.72 + e.height * 0.45) {
            this.attackHitIds[e.uid] = true;
            let dmgBase = this.atk * spec.dmgMult;
            if (this.id === 'wujing' && (e.stunTimer > 0 || e.slowTimer > 0)) dmgBase *= 1.3;
            const roll = this.rollDamage(dmgBase, spec.forceCrit);
            onHitEnemy(e, {
              dmg: roll.dmg,
              isCrit: roll.isCrit,
              isHeavy: isFinisher,
              knockX: (e.x >= this.x ? 1 : -1) * spec.knockX,
              knockY: spec.knockY,
              stunSec: spec.stunSec || 0,
              ignoreShield: !!spec.forceCrit,
              sourceX: this.x
            });
            if (!this.attackLandedAny) {
              this.attackLandedAny = true;
              this.restoreMp(this.mpOnHit, effects, false);
            }
          }
        }
      }

      // 普攻终段命中奖励：缩减 0.65s 神通冷却，形成「普攻循环回蓝减CD -> 段数派生爆发」完美闭环！
      if (!prevLanded && this.attackLandedAny && this.currentAttackSpec) {
        if (this.currentAttackSpec.applySlow) {
          for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (!e.dead && this.attackHitIds && this.attackHitIds[e.uid]) {
              e.slowTimer = Math.max(e.slowTimer, this.currentAttackSpec.applySlow);
            }
          }
        }
        if (this.currentComboStep === this.charDef.combo.length - 1) {
          this.skillCdTimer = Math.max(0, this.skillCdTimer - 0.65);
        }
      }

      // 切手派生持续位移状态结算（野猪蛮王冲 / 破浪贯月刺 / 升龙残影）
      if (this.derivedActionTimer > 0) {
        this.derivedActionTimer = Math.max(0, this.derivedActionTimer - dt);
        const ad = this.activeDerivation;
        if (ad && ad.kind === 'charge_ram') {
          this.vx = this.dir * ad.speed;
          this.afterimageTick -= dt;
          if (this.afterimageTick <= 0 && heroSprite && effects) {
            this.afterimageTick = 0.05;
            effects.spawnAfterimage(heroSprite, this.x, this.y, this.dir, '#7be495', 0.68);
            effects.spawnParticles(this.x - this.dir * 8, this.y - 3, 2, '#ffd166', 20, 65, 0.1, 0.2, 40);
          }
          for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (!e.dead && !ad.hitMap[e.uid] && Math.abs(e.x - this.x) <= 28 + e.width * 0.45 && Math.abs(e.y - this.y) <= 44) {
              ad.hitMap[e.uid] = true;
              onHitEnemy(e, {
                dmg: ad.dmg,
                isCrit: true,
                isHeavy: true,
                knockX: this.dir * 320,
                knockY: -105,
                stunSec: 0.75,
                ignoreShield: true,
                debuff: { type: 'expose', duration: 2.8 },
                sourceX: this.x
              });
            }
          }
        } else if (ad && ad.kind === 'wave_lunge') {
          this.vx = this.dir * ad.speed;
          this.afterimageTick -= dt;
          if (this.afterimageTick <= 0 && heroSprite && effects) {
            this.afterimageTick = 0.045;
            effects.spawnAfterimage(heroSprite, this.x, this.y, this.dir, '#6cd4ff', 0.7);
            effects.spawnElementalParticles && effects.spawnElementalParticles(this.x, this.y - 14, 2, 'frost', { color: '#6cd4ff' });
          }
          for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (!e.dead && !ad.hitMap[e.uid] && Math.abs(e.x - this.x) <= 30 + e.width * 0.45 && Math.abs(e.y - this.y) <= 44) {
              ad.hitMap[e.uid] = true;
              e.slowTimer = Math.max(e.slowTimer, 3.6);
              onHitEnemy(e, {
                dmg: ad.dmg,
                isCrit: true,
                knockX: this.dir * 165,
                knockY: -50,
                stunSec: 0.35,
                ignoreShield: true,
                debuff: { type: 'chill', duration: 3.6 },
                sourceX: this.x
              });
            }
          }
        } else if (ad && (ad.kind === 'rising_dragon' || ad.kind === 'backflip_shot')) {
          this.afterimageTick -= dt;
          if (this.afterimageTick <= 0 && heroSprite && effects) {
            this.afterimageTick = 0.055;
            effects.spawnAfterimage(heroSprite, this.x, this.y, this.dir, this.charDef.themeColor, 0.62);
          }
        }
        if (this.derivedActionTimer <= 0) {
          this.activeDerivation = null;
        }
      }
    };

    // =========================================================================
    // 2. 纸娃娃武术身法与角色脚底连段星芒点阵增强
    // =========================================================================
    if (HeroModelEngine && HeroModelEngine.renderHeroPaperDoll) {
      const origRenderPaperDoll = HeroModelEngine.renderHeroPaperDoll;
      HeroModelEngine.renderHeroPaperDoll = function (ctx, opts) {
        const p = HeroModelEngine._activeMovesetPlayer;
        if (!p || opts.hiRes) {
          return origRenderPaperDoll.call(this, ctx, opts);
        }

        ctx.save();
        const patchedOpts = Object.assign({}, opts);

        if (p.derivedActionTimer > 0) {
          const prog = 1 - p.derivedActionTimer / Math.max(0.01, p.derivedActionDuration || 0.28);
          patchedOpts.attacking = true;
          patchedOpts.attackProgress = prog;
          patchedOpts.comboStep = 2;
          patchedOpts.frameKey = p.onGround ? 'attack2' : 'jump';
          const kd = p.activeDerivation && p.activeDerivation.kind;
          if (kd === 'charge_ram' || kd === 'wave_lunge') {
            ctx.translate(4, 0);
            ctx.rotate(0.18);
          } else if (kd === 'rising_dragon') {
            ctx.translate(0, -4);
            ctx.rotate(-0.15);
          } else if (kd === 'backflip_shot') {
            ctx.translate(0, -17);
            ctx.rotate(-prog * Math.PI * 2);
            ctx.translate(0, 17);
          }
        } else if (p.attackTimer > 0 && p.currentAttackSpec) {
          const prog = 1 - p.attackTimer / Math.max(0.01, p.attackDuration);
          const st = p.currentAttackSpec.style;
          const totalSteps = p.charDef.combo.length;
          const isFinisher = p.currentComboStep === totalSteps - 1;

          // 将 4~5 段招式智能映射至纸娃娃正手斩(0) / 挑云反扫(1) / 劈山重砸(2)
          if (isFinisher || st === 'heavySlam' || st === 'earthSmash') {
            patchedOpts.comboStep = 2;
            patchedOpts.frameKey = 'attack2';
            const tilt = prog < 0.35 ? -0.14 * (prog / 0.35) : 0.18 * Math.min(1, (prog - 0.35) / 0.35);
            ctx.translate(prog < 0.35 ? -2 : 3, 0);
            ctx.rotate(tilt);
          } else if (st === 'upSlash' || st === 'backSweep' || st === 'rakePull') {
            patchedOpts.comboStep = 1;
            patchedOpts.frameKey = 'attack1';
            ctx.rotate(-0.08 * Math.sin(prog * Math.PI));
          } else {
            patchedOpts.comboStep = 0;
            patchedOpts.frameKey = p.currentComboStep % 2 === 0 ? 'attack0' : 'run2';
          }

          if (st === 'leapSlash') {
            // 悟空第 4 段：腾跃前空翻劈砍！
            patchedOpts.frameKey = 'jump';
            patchedOpts.comboStep = 2;
            ctx.translate(0, -18);
            ctx.rotate(prog * Math.PI * 2);
            ctx.translate(0, 18);
          } else if (st === 'spin360' || st === 'flurrySpin') {
            // 360° 旋身斩 / 舞棍花：立体水平余弦转体！
            const spinCos = Math.cos(prog * Math.PI * 2);
            ctx.scale(Math.abs(spinCos) < 0.38 ? (spinCos >= 0 ? 0.38 : -0.38) : spinCos, 1);
          } else if (st === 'castHeavy') {
            // 唐僧第 4 段：凌空微浮结万佛印
            ctx.translate(0, -Math.round(Math.sin(prog * Math.PI) * 6));
          } else if (st === 'lanceFlurry') {
            ctx.translate(Math.sin(prog * Math.PI * 6) * 2.5, 0);
          }
        }

        origRenderPaperDoll.call(this, ctx, patchedOpts);

        // 白龙马疾电百裂刺：叠加上下双道青白枪芒残影
        if (p.attackTimer > 0 && p.currentAttackSpec && p.currentAttackSpec.style === 'lanceFlurry') {
          ctx.save();
          ctx.globalAlpha = 0.55;
          ctx.strokeStyle = '#00f5d4';
          ctx.lineWidth = 2;
          [-6, 6].forEach((oy, idx) => {
            const ext = 24 + Math.sin(p.animTimer * 48 + idx * 2) * 7;
            ctx.beginPath();
            ctx.moveTo(4, -16 + oy);
            ctx.lineTo(ext, -16 + oy * 0.5);
            ctx.stroke();
          });
          ctx.restore();
        }

        ctx.restore();
      };
    }

    const origPlayerRender = Player.prototype.render;
    Player.prototype.render = function (ctx, camX, camY, assetLoader) {
      ensureMovesetState(this);
      const sx = Math.round(this.x - camX);
      const sy = Math.round(this.y - camY);

      if (HeroModelEngine) HeroModelEngine._activeMovesetPlayer = this;
      origPlayerRender.call(this, ctx, camX, camY, assetLoader);
      if (HeroModelEngine) HeroModelEngine._activeMovesetPlayer = null;

      // 切手派生施展瞬间的破势神环
      if (this.derivedActionTimer > 0) {
        ctx.save();
        ctx.strokeStyle = this.charDef.themeColor || '#ffd60a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy - 18, 22 + Math.sin(this.animTimer * 28) * 2.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 角色脚底轻量连段与派生星芒点阵（不随朝向翻转）
      if (this.comboResetTimer > 0 || this.deriveWindowTimer > 0) {
        const total = this.charDef.combo ? this.charDef.combo.length : 4;
        const activeStep = this.deriveWindowTimer > 0 ? this.deriveStageIndex : this.currentComboStep;
        const gap = 7;
        const startX = sx - Math.round(((total - 1) * gap) / 2);
        const py = sy + 6;

        ctx.save();
        for (let i = 0; i < total; i++) {
          const px = startX + i * gap;
          const isLast = i === total - 1;
          const lit = i <= activeStep;
          const isReadyDerive = i === activeStep && this.deriveWindowTimer > 0 && this.skillCdTimer <= 0;

          ctx.fillStyle = isReadyDerive
            ? '#00f5d4'
            : lit
              ? this.charDef.themeColor
              : 'rgba(224, 247, 255, 0.24)';
          const sz = isLast ? 5 : 4;
          ctx.fillRect(px - Math.floor(sz / 2), py - Math.floor(sz / 2), sz, sz);
          if (isReadyDerive) {
            ctx.strokeStyle = '#ffd60a';
            ctx.lineWidth = 1;
            ctx.strokeRect(px - 3.5, py - 3.5, 7, 7);
          }
        }
        ctx.restore();
      }
    };

    // =========================================================================
    // 3. EffectsManager 扩展：新刀光残影样式 + 擎天柱/天雷柱/紧箍阵/三崩山法相渲染
    // =========================================================================
    const origEffectsUpdate = EffectsManager.prototype.update;
    EffectsManager.prototype.update = function (dt, worldCtx) {
      const { enemies, onHitEnemy } = worldCtx;

      // 预处理带级联延时 (msDelay) 或紧箍聚怪的专属场地法阵
      for (let i = this.zones.length - 1; i >= 0; i--) {
        const z = this.zones[i];
        if (z.msDelay && z.msDelay > 0) {
          z.msDelay -= dt;
          if (z.msDelay > 0) {
            z.age -= dt; // 冻结 age 直至延时结束爆发
            continue;
          }
        }
        if (z.msBurstOnStart && !z._msTriggered) {
          z._msTriggered = true;
          this.spawnParticles(z.x, z.y - 16, 16, z.color || '#ffd166', 55, 210, 0.16, 0.34, 160);
          this.spawnHitFlash(z.x, z.y - 22, z.color || '#ffd166', true, 0);
          if (z.debrisColors) {
            this.spawnDebris(z.x, z.y - 4, 7, z.debrisColors, 0);
          }
          if (z.kind === 'ms_thunder_pillar' && this.spawnLightningBolt) {
            this.spawnLightningBolt(z.x + (Math.random() - 0.5) * 18, z.y - 195, z.x, z.y - 4, '#00f5d4', 3.2, 0.24);
          }
          for (let k = 0; k < enemies.length; k++) {
            const e = enemies[k];
            if (!e.dead && Math.abs(e.x - z.x) <= (z.radius || 54) && Math.abs(e.y - z.y) <= (z.rangeY || 72)) {
              onHitEnemy &&
                onHitEnemy(e, {
                  dmg: z.dmg || 25,
                  isCrit: z.isCrit !== false,
                  isHeavy: true,
                  knockX: (z.knockDir || (e.x >= z.x ? 1 : -1)) * (z.knockX || 185),
                  knockY: z.knockY || -125,
                  stunSec: z.stunSec || 0.9,
                  ignoreShield: true,
                  debuff: z.kind === 'ms_thunder_pillar' ? { type: 'shock', duration: 3.0 } : { type: 'expose', duration: 2.8 },
                  sourceX: z.x
                });
            }
          }
        }

        if (z.kind === 'ms_tangseng_bind' && (!z.msDelay || z.msDelay <= 0)) {
          z.tickTimer = (z.tickTimer || 0) + dt;
          for (let k = 0; k < enemies.length; k++) {
            const e = enemies[k];
            if (e.dead) continue;
            const dx = z.x - e.x;
            const dist = Math.hypot(dx, z.y - e.y);
            if (dist < z.radius) {
              e.slowTimer = Math.max(e.slowTimer, 0.5);
              if (!e.isBoss && dist > 8) e.x += Math.sign(dx) * 115 * dt;
            }
          }
          if (z.tickTimer >= 0.36) {
            z.tickTimer = 0;
            for (let k = 0; k < enemies.length; k++) {
              const e = enemies[k];
              if (!e.dead && Math.hypot(e.x - z.x, e.y - z.y) < z.radius) {
                onHitEnemy &&
                  onHitEnemy(e, {
                    dmg: z.dmg,
                    isCrit: false,
                    knockX: 0,
                    knockY: -18,
                    stunSec: 0.2,
                    ignoreShield: true,
                    sourceX: z.x
                  });
              }
            }
          }
        }
      }

      origEffectsUpdate.call(this, dt, worldCtx);
    };

    const origEffectsRenderWorld = EffectsManager.prototype.renderWorld;
    EffectsManager.prototype.renderWorld = function (ctx, camX, camY, assetLoader) {
      origEffectsRenderWorld.call(this, ctx, camX, camY, assetLoader);

      // 1. 叠加渲染派生专属神通法相场地（金箍棒暴长 / 擎天柱 / 九霄雷柱 / 熔金岩柱 / 紧箍咒阵）
      for (let i = 0; i < this.zones.length; i++) {
        const z = this.zones[i];
        if (!z.kind || z.kind.indexOf('ms_') !== 0) continue;
        const sx = Math.round(z.x - camX);
        const sy = Math.round(z.y - camY);

        if (z.msDelay && z.msDelay > 0) {
          ctx.save();
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = z.color || '#ffd166';
          ctx.fillRect(sx - 18, sy - 3, 36, 3);
          ctx.restore();
          continue;
        }

        const p = Math.max(0, Math.min(1, z.age / Math.max(0.01, z.duration)));
        ctx.save();
        if (z.kind === 'ms_staff_extend') {
          const barH = Math.max(4, Math.round(12 * (1 - p)));
          const len = z.length || 218;
          const x0 = z.dir > 0 ? sx : sx - len;
          ctx.globalAlpha = Math.min(1, (1 - p) * 1.3);
          ctx.fillStyle = '#ef233c';
          ctx.fillRect(x0, sy - barH / 2, len, barH);
          ctx.fillStyle = '#ffd60a';
          ctx.fillRect(x0, sy - barH / 2 - 1, 24, barH + 2);
          ctx.fillRect(x0 + len - 28, sy - barH / 2 - 1, 28, barH + 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x0 + 4, sy - 1, len - 8, 2);
        } else if (z.kind === 'ms_heaven_pillar') {
          const alpha = Math.max(0, 1 - Math.pow(p, 1.4));
          const pw = Math.max(10, Math.round((z.pillarW || 40) * (1.15 - p * 0.45)));
          const dropY = p < 0.18 ? Math.round(-150 * (1 - p / 0.18)) : 0;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = z.color || '#ffd60a';
          ctx.fillRect(sx - pw / 2 - 6, sy - 220 + dropY, pw + 12, 220);
          ctx.fillStyle = z.coreColor || '#ef233c';
          ctx.fillRect(sx - pw / 2, sy - 220 + dropY, pw, 220);
          ctx.fillStyle = '#ffd60a';
          ctx.fillRect(sx - pw / 2 - 3, sy - 38 + dropY, pw + 6, 26);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(sx - 3, sy - 220 + dropY, 6, 218);
        } else if (z.kind === 'ms_thunder_pillar') {
          ctx.globalAlpha = Math.max(0, 1 - p);
          ctx.strokeStyle = z.color || '#00f5d4';
          ctx.lineWidth = Math.max(3, (1 - p) * 12);
          ctx.beginPath();
          ctx.moveTo(sx + Math.sin(z.age * 60) * 8, sy - 210);
          ctx.lineTo(sx - 9, sy - 140);
          ctx.lineTo(sx + 10, sy - 75);
          ctx.lineTo(sx, sy);
          ctx.stroke();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        } else if (z.kind === 'ms_earth_erupt') {
          const hScale = p < 0.25 ? p / 0.25 : Math.max(0, 1 - (p - 0.25) / 0.75);
          const peakH = Math.round(62 * hScale);
          ctx.fillStyle = z.color || '#7be495';
          ctx.beginPath();
          ctx.moveTo(sx - 24, sy);
          ctx.lineTo(sx - 8, sy - peakH);
          ctx.lineTo(sx + 4, sy - Math.round(peakH * 0.72));
          ctx.lineTo(sx + 14, sy - Math.round(peakH * 0.92));
          ctx.lineTo(sx + 26, sy);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#ffd166';
          ctx.beginPath();
          ctx.moveTo(sx - 12, sy);
          ctx.lineTo(sx - 4, sy - Math.round(peakH * 0.8));
          ctx.lineTo(sx + 10, sy);
          ctx.closePath();
          ctx.fill();
        } else if (z.kind === 'ms_tangseng_bind') {
          const pulse = Math.sin(z.age * 18) * 3;
          ctx.strokeStyle = '#ffd166';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(sx, sy - 8, z.radius * 0.78 + pulse, 14, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = '#ff4d6d';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(sx, sy - 20, 8, Math.PI * 0.15, Math.PI * 0.85, true);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2. 叠加渲染增强刀光（舞棍花双轮 / 十字双月 / 升龙冲霄柱 / 百裂三连刺）
      for (let i = 0; i < this.slashArcs.length; i++) {
        const s = this.slashArcs[i];
        if (!s.style || s.style.indexOf('ms_') !== 0) continue;
        const p = Math.max(0, Math.min(1, s.timer / Math.max(0.01, s.duration)));
        const sx = Math.round(s.x - camX);
        const sy = Math.round(s.y - camY);
        ctx.save();
        ctx.translate(sx, sy);
        if (s.dir < 0) ctx.scale(-1, 1);
        ctx.globalAlpha = Math.max(0, 1 - Math.pow(p, 1.4));

        if (s.style === 'ms_flurrySpin') {
          ctx.strokeStyle = s.accent || '#ff3b30';
          ctx.lineWidth = Math.max(2, (1 - p) * 6);
          ctx.beginPath();
          ctx.ellipse(0, 0, s.rx * 0.92, s.ry * 0.82, -p * Math.PI * 2, 0, Math.PI * 2);
          ctx.stroke();
        } else if (s.style === 'ms_crossSlash') {
          [-0.44, 0.44].forEach((tilt, idx) => {
            ctx.save();
            ctx.rotate(tilt);
            ctx.strokeStyle = idx === 0 ? s.color : (s.accent || '#ffffff');
            ctx.lineWidth = Math.max(3, (1 - p) * 8);
            ctx.beginPath();
            ctx.arc(0, 0, s.rx * 0.85, -0.45 * Math.PI, 0.45 * Math.PI);
            ctx.stroke();
            ctx.restore();
          });
        } else if (s.style === 'ms_risingDragon') {
          const h = s.ry * (1.3 + p * 0.45);
          const w = s.rx * (0.6 - p * 0.18);
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.moveTo(-w * 0.3, h * 0.45);
          ctx.quadraticCurveTo(w * 0.85, 0, w * 0.15, -h);
          ctx.quadraticCurveTo(w * 0.35, 0, -w * 0.1, h * 0.45);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (s.style === 'ms_lanceFlurry') {
          const baseLen = s.rx * (0.8 + p * 0.3);
          [-9, 0, 9].forEach((oy, idx) => {
            ctx.fillStyle = idx === 1 ? '#ffffff' : s.color;
            ctx.beginPath();
            ctx.moveTo(-10, oy - 2.5);
            ctx.lineTo(baseLen * (idx === 1 ? 1.12 : 0.9), oy * 0.4);
            ctx.lineTo(-10, oy + 2.5);
            ctx.closePath();
            ctx.fill();
          });
        }
        ctx.restore();
      }
    };

    // =========================================================================
    // 4. 键盘快捷键 [V] 打开【武道招式谱】 + 触屏神通键动态切换为「派生k式」 + 实时招式栏
    // =========================================================================
    const origBindInputs = GameApp.prototype.bindInputs;
    GameApp.prototype.bindInputs = function () {
      origBindInputs.call(this);
      if (typeof window !== 'undefined' && !this._movesetKeyBound) {
        this._movesetKeyBound = true;
        window.addEventListener('keydown', (ev) => {
          if (DouyinSDK.mockAdState.active || this.state !== 'PLAYING') return;
          if (ev.code === 'KeyV') {
            if (this.modal === 'MOVESET_GUIDE') this.modal = null;
            else if (!this.modal) this.modal = 'MOVESET_GUIDE';
          } else if (ev.code === 'Escape' && this.modal === 'MOVESET_GUIDE') {
            this.modal = null;
          }
        });
      }
    };

    // 让移动端/触控右侧【神通(U)】圆键在普攻连段中动态化身为对应段数的【切手派生技】！
    const origGetTouchLayout = UIManager.prototype.getTouchLayout;
    UIManager.prototype.getTouchLayout = function (sw, sh) {
      const layout = origGetTouchLayout.call(this, sw, sh);
      const p = this._movesetPlayerRef;
      if (p) {
        layout.attack.sub = `${p.charDef.combo.length}段循环`;
        const deriv = p.getAvailableDerivation && p.getAvailableDerivation();
        if (deriv && p.skillCdTimer <= 0.02) {
          layout.skill.label = deriv.shortName || `${deriv.step}式派生`;
          layout.skill.sub = `${deriv.step}段+U`;
          layout.skill.color = '#00f5d4';
        }
      }
      return layout;
    };

    const origRenderVirtualControls = UIManager.prototype.renderVirtualControls;
    UIManager.prototype.renderVirtualControls = function (ctx, sw, sh, player, globalTime) {
      this._movesetPlayerRef = player;
      origRenderVirtualControls.call(this, ctx, sw, sh, player, globalTime);

      // 当处于普攻切手派生窗口且神通未冷却时，在[U]键外围绘制呼吸闪烁的青金破势引导环！
      const deriv = player && player.getAvailableDerivation && player.getAvailableDerivation();
      if (deriv && player.skillCdTimer <= 0.02) {
        const layout = this.getTouchLayout(sw, sh);
        const skBtn = layout.skill;
        const pulse = 3 + Math.sin((globalTime || 0) * 18) * 2.5;
        ctx.save();
        ctx.strokeStyle = '#00f5d4';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(skBtn.x, skBtn.y, skBtn.r + pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    };

    const origRenderCombatUI = UIManager.prototype.renderCombatUI;
    UIManager.prototype.renderCombatUI = function (ctx, sw, sh, app) {
      this._movesetPlayerRef = app && app.player ? app.player : null;
      origRenderCombatUI.call(this, ctx, sw, sh, app);
      if (!app || !app.player || !app.level || DouyinSDK.mockAdState.active) return;

      const player = app.player;
      ensureMovesetState(player);

      if (!app.modal) {
        const safeLeft = Math.max(14, Math.round(sw * 0.02));
        const barX = safeLeft;
        const barY = 100;
        const barW = 304;
        const barH = 26;
        const combos = player.charDef.combo || [];
        const deriv = player.getAvailableDerivation();
        const inCombo = player.comboResetTimer > 0 || player.deriveWindowTimer > 0;

        drawPixelPanel(
          ctx,
          barX,
          barY,
          barW,
          barH,
          'rgba(14, 11, 26, 0.88)',
          deriv && player.skillCdTimer <= 0 ? '#00f5d4' : '#4a4e69',
          4
        );

        // 左侧：1~N 段循环节点指示器
        let curX = barX + 8;
        const midY = barY + 13;
        const activeStep = inCombo ? (player.deriveWindowTimer > 0 ? player.deriveStageIndex : player.currentComboStep) : -1;
        for (let i = 0; i < combos.length; i++) {
          const isCur = i === activeStep;
          const passed = inCombo && i < activeStep;
          ctx.fillStyle = isCur ? '#ffd60a' : passed ? player.charDef.themeColor : '#242038';
          ctx.fillRect(curX, midY - 6, 13, 12);
          ctx.strokeStyle = isCur ? '#ffffff' : '#5c6282';
          ctx.lineWidth = 1;
          ctx.strokeRect(curX, midY - 6, 13, 12);

          ctx.textAlign = 'center';
          ctx.fillStyle = isCur || passed ? '#120d18' : '#adb5bd';
          ctx.font = 'bold 9px monospace, sans-serif';
          ctx.fillText(String(i + 1), curX + 6.5, midY + 3);
          curX += 15;
        }

        // 循环回环标记
        ctx.textAlign = 'left';
        ctx.fillStyle = player.comboLoopCount > 0 && inCombo ? '#ffd60a' : '#90e0ef';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(player.comboLoopCount > 0 && inCombo ? `↻${player.comboLoopCount + 1}` : '↻', curX + 1, midY + 3);
        curX += 18;

        // 中部：实时显示当前可触发的【段数接技能派生】招式名与类型
        ctx.textAlign = 'left';
        if (deriv) {
          ctx.fillStyle = player.skillCdTimer <= 0 ? '#00f5d4' : '#adb5bd';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText(
            player.skillCdTimer <= 0
              ? `⚡按[U]：${deriv.name}(${deriv.archetype})`
              : `调息${player.skillCdTimer.toFixed(1)}s · ${combos[activeStep] ? combos[activeStep].name : ''}`,
            curX,
            midY + 3
          );
        } else {
          ctx.fillStyle = '#ced4da';
          ctx.font = '10px sans-serif';
          ctx.fillText(`普攻${combos.length}段循环 · 各段接[U]派生神通`, curX, midY + 3);
        }

        // 右端：【武道招式谱[V]】快捷查看胶囊按钮
        const guideW = 48;
        const guideX = barX + barW - guideW - 4;
        drawPixelPanel(ctx, guideX, barY + 3, guideW, 20, '#271e46', '#ffd166', 3);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('招式[V]', guideX + guideW / 2, barY + 16);
        this.addButton('hud_moveset_guide', guideX, barY + 3, guideW, 20, () => {
          app.modal = 'MOVESET_GUIDE';
        });
      }

      if (app.modal === 'MOVESET_GUIDE') {
        this.renderMovesetGuideModal(ctx, sw, sh, app);
        this.renderToast(ctx, sw, sh, true);
      }
    };

    // 渲染【行者武道招式谱】弹窗：清晰列出 4~5 段循环普攻 + 每段后接[U]派生的专属技能！
    UIManager.prototype.renderMovesetGuideModal = function (ctx, sw, sh, app) {
      this.clearButtons();
      ctx.fillStyle = 'rgba(6, 5, 14, 0.90)';
      ctx.fillRect(0, 0, sw, sh);

      const ch = app.player ? app.player.charDef : null;
      if (!ch) return;
      const combos = ch.combo || [];
      const derivs = ch.derivations || [];

      const mw = Math.min(720, sw - 24);
      const mh = Math.min(390, sh - 18);
      const mx = Math.round((sw - mw) / 2);
      const my = Math.round((sh - mh) / 2);

      drawPixelPanel(ctx, mx, my, mw, mh, '#141124', ch.themeColor, 8);

      ctx.textAlign = 'left';
      ctx.fillStyle = ch.themeColor;
      ctx.font = 'bold 17px sans-serif';
      ctx.fillText(
        `⚔ 【${ch.name} · ${ch.comboTitle || combos.length + '段武道模组'}】循环连段与切手派生谱`,
        mx + 16,
        my + 28
      );

      if (UITheme && UITheme.drawOrnateButton) {
        UITheme.drawOrnateButton(ctx, mx + mw - 66, my + 8, 52, 26, '关闭', {
          variant: 'slate',
          studs: false,
          fontSize: 11
        });
      } else {
        drawPixelPanel(ctx, mx + mw - 66, my + 8, 52, 26, '#2b2d42', '#adb5bd', 4);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('关闭', mx + mw - 40, my + 25);
      }
      this.addButton('close_moveset_guide', mx + mw - 66, my + 8, 52, 26, () => {
        app.modal = null;
      });

      // 顶部操作心法提示条
      drawPixelPanel(ctx, mx + 14, my + 38, mw - 28, 28, '#1e1936', '#4a4e69', 4);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffd166';
      ctx.font = '11px sans-serif';
      ctx.fillText(
        `💡 心法：连按[J]打出 1~${combos.length} 段来回无限循环；任意第 k 段后按[U]取消后摇派生第 k 式绝技！未普攻直接按[U]释放本命大招【${ch.skillName.split('·')[0]}】。`,
        mx + 22,
        my + 56
      );

      const listTop = my + 74;
      const availH = mh - 84;
      const rowH = Math.max(46, Math.floor((availH - (combos.length - 1) * 5) / combos.length));

      for (let i = 0; i < combos.length; i++) {
        const cb = combos[i];
        const dv = derivs[i];
        const ry = listTop + i * (rowH + 5);
        const isLast = i === combos.length - 1;

        drawPixelPanel(ctx, mx + 14, ry, mw - 28, rowH, '#1a1630', isLast ? '#ffd60a' : '#3d405b', 5);

        // 左栏：第 i+1 段普攻信息
        const leftW = Math.floor((mw - 48) * 0.34);
        ctx.textAlign = 'left';
        ctx.fillStyle = isLast ? '#ffd60a' : ch.themeColor;
        ctx.font = 'bold 13px sans-serif';
        const hitTag = cb.hitTimes && cb.hitTimes.length > 1 ? `(${cb.hitTimes.length}连击)` : isLast ? '(终段↻回环)' : '';
        ctx.fillText(`第${i + 1}段[J] · ${cb.name} ${hitTag}`, mx + 24, ry + 19);

        ctx.fillStyle = '#adb5bd';
        ctx.font = '11px sans-serif';
        const totalMult = Math.round(cb.dmgMult * (cb.hitTimes ? cb.hitTimes.length : 1) * 100);
        ctx.fillText(
          `倍率 ${totalMult}%${cb.hitAround ? ' · 360°周身' : ''}${cb.hopY ? ' · 腾跃' : ''}${cb.forceCrit ? ' · 必暴' : ''}`,
          mx + 24,
          ry + 37
        );

        // 中间派生连接箭头
        const arrowX = mx + 24 + leftW;
        ctx.fillStyle = '#00f5d4';
        ctx.font = 'bold 12px monospace, sans-serif';
        ctx.fillText('+[U] ➔', arrowX, ry + Math.round(rowH * 0.55));

        // 右栏：该段衔接派生的神通技能详情
        if (dv) {
          const rx = arrowX + 56;
          ctx.fillStyle = '#00f5d4';
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText(`【${dv.name}】`, rx, ry + 19);

          const nameW = ctx.measureText(`【${dv.name}】`).width;
          ctx.fillStyle = '#ffd166';
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText(`[${dv.archetype} | 蓝${dv.mpCost} | CD ${dv.cd}s]`, rx + nameW + 6, ry + 18);

          ctx.fillStyle = '#e0fbfc';
          ctx.font = '11px sans-serif';
          const maxChars = Math.max(20, Math.floor((mx + mw - 24 - rx) / 11.5));
          ctx.fillText(dv.desc.slice(0, maxChars), rx, ry + 37);
        }
      }
    };
  }

  installActionMovesetDirector();

  return {
    installActionMovesetDirector
  };
});
