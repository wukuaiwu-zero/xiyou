/**
 * 《西游破劫录》16-Bit 像素电影级过场动画与零重复角色台词导演系统
 * (src/ui/cutsceneDirector.js)
 *
 * 负责模块：
 * 1. 【破劫序章 · 灵山碎卷】四幕全屏多镜头像素动画（首次开局自动播放，主界面可随时重温，支持一键跳过）
 * 2. 【西行出征 · 五圣专属入场运镜】筋斗云震棒 / 金莲法阵 / 旋风钉钯 / 流沙寒渊 / 真龙化雷 + 角色声纹打字机
 * 3. 【妖王降临 · 宿命叫阵过场】Boss殿宽银幕推镜、竖排朱砂难号榜文、妖王咆哮震波与行者亮兵回敬双幕对峙
 * 4. 【观音甘露 · 逆天重塑过场】九天佛光垂落、碎链重塑金身与燃向翻盘宣言
 * 5. 【九九归真终章 / 兵解归祠过场】通关金门莲桥升华演出、兵解灵蕴归祠演出与结算判词铭刻
 * 6. 【非阻塞行军传音 & 斩妖朱印】跑图与捡装备零卡顿的师徒隔空斗嘴小剧场与收兵判词
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
})('cutsceneDirector', function (require) {
  const DialogueBank = require('../config/dialogueBank');
  const SoundFX = require('../audio/soundFX');
  const DouyinSDK = require('../sdk/douyinSDK');
  const Env = require('../platform/env');
  const { GameApp } = require('../core/gameApp');
  const { Player } = require('../entities/player');
  const { UIManager, drawPixelPanel } = require('./hudAndModals');

  let UITheme = null;
  try {
    UITheme = require('./uiTheme');
  } catch (e) {
    UITheme = null;
  }

  // ============================================================================
  // 一、16-Bit 角色专属程序化声纹合成器（免音频包体，贴合五师徒与妖王嗓音质感）
  // ============================================================================
  let _voiceAudioCtx = null;

  function getVoiceAudioCtx() {
    if (SoundFX.isMuted && SoundFX.isMuted()) return null;
    if (_voiceAudioCtx) {
      if (_voiceAudioCtx.state === 'suspended' && typeof _voiceAudioCtx.resume === 'function') {
        _voiceAudioCtx.resume().catch(() => {});
      }
      return _voiceAudioCtx;
    }
    try {
      if (typeof tt !== 'undefined' && typeof tt.createWebAudioContext === 'function') {
        _voiceAudioCtx = tt.createWebAudioContext();
      } else if (typeof window !== 'undefined') {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) _voiceAudioCtx = new AC();
      }
    } catch (e) {
      _voiceAudioCtx = null;
    }
    return _voiceAudioCtx;
  }

  function playCharacterVoiceBlip(speakerId, isBoss) {
    const ctx = getVoiceAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (isBoss) {
        osc.type = 'sawtooth';
        const f = 92 + Math.random() * 36;
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(Math.max(48, f * 0.72), now + 0.048);
        gain.gain.setValueAtTime(0.065, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.048);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.052);
        return;
      }

      const pf = DialogueBank.HERO_PROFILES[speakerId] || DialogueBank.HERO_PROFILES.wukong;
      const v = pf.voice || { wave: 'square', baseFreq: 360, jitter: 60, dur: 0.036 };
      osc.type = v.wave || 'triangle';
      const freq = v.baseFreq + (Math.random() - 0.45) * v.jitter;
      osc.frequency.setValueAtTime(Math.max(65, freq), now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(55, freq * 1.08), now + v.dur);
      gain.gain.setValueAtTime(0.055, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + v.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + v.dur + 0.008);
    } catch (e) {}
  }

  function playSealStampSFX() {
    const ctx = getVoiceAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(175, now);
      osc.frequency.exponentialRampToValueAtTime(36, now + 0.19);
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.21);
    } catch (e) {}
  }

  // ============================================================================
  // 二、文本自动断行与朱砂方印绘制工具
  // ============================================================================
  function wrapCnLines(ctx, text, maxWidth) {
    const str = String(text || '');
    if (!str) return [];
    const lines = [];
    let cur = '';
    for (let i = 0; i < str.length; i++) {
      const test = cur + str[i];
      if (ctx.measureText(test).width > maxWidth && cur.length > 0) {
        lines.push(cur);
        cur = str[i];
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function drawCinnabarSeal(ctx, x, y, size, label, scaleAnim) {
    const sc = scaleAnim || 1;
    if (UITheme && UITheme.drawSealStamp && Math.abs(sc - 1) < 0.02) {
      UITheme.drawSealStamp(ctx, x, y, size, String(label || '破劫').slice(0, 4), '#b81d24', '#ffd166');
      return;
    }
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);
    ctx.scale(sc, sc);
    ctx.rotate(-0.06);
    const half = size / 2;
    ctx.fillStyle = '#b81d24';
    ctx.fillRect(-half, -half, size, size);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-half + 2, -half + 2, size - 4, size - 4);
    ctx.fillStyle = '#fff8e7';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const chars = String(label || '破劫').slice(0, 2);
    if (chars.length === 2 && size >= 30) {
      ctx.font = `bold ${Math.round(size * 0.36)}px serif, sans-serif`;
      ctx.fillText(chars[0], 0, -size * 0.18);
      ctx.fillText(chars[1], 0, size * 0.20);
    } else {
      ctx.font = `bold ${Math.round(size * 0.44)}px serif, sans-serif`;
      ctx.fillText(chars, 0, 1);
    }
    ctx.restore();
  }

  // 优先使用 32-Bit 实时纸娃娃英雄模型（展示玩家当前真实穿戴神装！），回退至高清烘焙精灵
  function drawHeroCutsceneActor(ctx, app, heroId, cx, footY, targetHeight, attacking, animTime) {
    const equipped =
      app.player && app.player.id === heroId
        ? app.player.equipped
        : app.saveData && app.saveData.heirloomLoadout
          ? app.saveData.heirloomLoadout
          : null;

    if (app.assetLoader && app.assetLoader.renderHeroPaperDoll) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      const dollScale = Math.max(0.65, Math.min(1.65, targetHeight / 74));
      ctx.translate(Math.round(cx), Math.round(footY));
      ctx.scale(dollScale, dollScale);
      const ok = app.assetLoader.renderHeroPaperDoll(ctx, {
        heroId,
        equipped,
        frameKey: attacking ? 'attack1' : Math.floor((animTime || 0) * 4) % 2 === 0 ? 'idle0' : 'idle1',
        animTime: animTime || 0,
        moving: false,
        airborne: false,
        attacking: !!attacking,
        hiRes: true
      });
      ctx.restore();
      if (ok) return;
    }

    const spr = app.assetLoader && app.assetLoader.getHeroHiResSprite(heroId, attacking ? 'attack' : 'idle');
    if (spr) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      const sc = targetHeight / Math.max(1, spr.height);
      const dw = Math.round(spr.width * sc);
      const dh = Math.round(spr.height * sc);
      ctx.drawImage(spr, Math.round(cx - dw / 2), Math.round(footY - dh), dw, dh);
      ctx.restore();
    }
  }

  // ============================================================================
  // 三、过场动画与非阻塞传音核心状态机 (CutsceneController)
  // ============================================================================
  const TYPEWRITER_CPS = 36; // 每秒推进字数（干脆利落不拖沓）

  class CutsceneController {
    constructor(app) {
      this.app = app;
      this.active = null;     // 当前全屏/宽银幕过场对象
      this.liveBanter = null; // 当前非阻塞行军传音/斩妖横幅对象
      this.shards = [];       // 序章碎卷粒子缓存
      for (let i = 0; i < 48; i++) {
        const ang = (i / 48) * Math.PI * 2 + (i % 3) * 0.2;
        this.shards.push({
          vx: Math.cos(ang) * (90 + (i * 19) % 190),
          vy: Math.sin(ang) * (70 + (i * 13) % 145) - 20,
          rot: (i * 0.7) % 6.28,
          sz: i % 4 === 0 ? 7 : 4,
          gold: i % 3 !== 0
        });
      }
    }

    isFastMode() {
      const ds = DialogueBank.ensureDialogueState(this.app.saveData);
      return !!ds.fastCutscenes;
    }

    toggleFastMode() {
      const ds = DialogueBank.ensureDialogueState(this.app.saveData);
      ds.fastCutscenes = !ds.fastCutscenes;
      this.app.persistSave();
      this.app.ui.showToast(
        ds.fastCutscenes
          ? '⚡ 已切换为【极速行军模式】：台词以非阻塞横幅呈现，0秒锁操作！'
          : '🎬 已切换为【标准电影过场】：开启完整宽银幕运镜演出！',
        2.6
      );
    }

    // -------------------- 1. 启动四幕史诗序章 --------------------
    startPrologue(onComplete) {
      const scenes = DialogueBank.PROLOGUE_SCENES;
      this.active = {
        type: 'PROLOGUE_EPIC',
        prevModal: this.app.modal,
        stepIdx: 0,
        stepTimer: 0,
        typedChars: 0,
        voiceTick: 0,
        lightningFired: false,
        sealStamped: false,
        scenes,
        onComplete: onComplete || null
      };
      this.app.modal = this.app.state === 'TITLE' ? 'PROLOGUE_CUTSCENE' : 'CUTSCENE_ACTIVE';
      playSealStampSFX();
    }

    // -------------------- 2. 启动单局西行出征入场运镜 --------------------
    startRunIntro(lineInfo) {
      if (!lineInfo) return;
      if (this.isFastMode() || (this.app.saveData && this.app.saveData.runMode === 'BLITZ_90')) {
        this.pushLiveBanter({
          kind: 'solo',
          badge: `第${lineInfo.runNumber}局·出征`,
          lines: [
            {
              speakerId: lineInfo.speakerId,
              speakerName: lineInfo.speakerName,
              speakerTitle: lineInfo.speakerTitle,
              themeColor: (DialogueBank.HERO_PROFILES[lineInfo.speakerId] || {}).themeColor || '#ffd166',
              text: lineInfo.text
            }
          ]
        });
        return;
      }

      const player = this.app.player;
      const pf = DialogueBank.HERO_PROFILES[lineInfo.speakerId] || DialogueBank.HERO_PROFILES.wukong;
      this.active = {
        type: 'RUN_INTRO',
        heroId: lineInfo.speakerId,
        entranceStyle: pf.entranceStyle,
        timer: 0,
        duration: 3.1,
        beats: [
          {
            side: 'left',
            isBoss: false,
            speakerId: lineInfo.speakerId,
            speakerName: lineInfo.speakerName,
            speakerTitle: `${lineInfo.speakerTitle} · 第${lineInfo.runNumber}局出征`,
            seal: lineInfo.seal,
            themeColor: pf.themeColor,
            text: lineInfo.text
          }
        ],
        beatIdx: 0,
        typedChars: 0,
        voiceTick: 0,
        landedFX: false,
        originX: player ? player.x : 144,
        originY: player ? player.y : 336,
        onComplete: null
      };
      this.app.modal = 'CUTSCENE_ACTIVE';
      SoundFX.play('scroll');
    }

    // -------------------- 3. 启动守关妖王交锋宽银幕过场 --------------------
    startBossIntro(clashData, bossEntity) {
      if (!clashData || !bossEntity) return;
      if (this.isFastMode() || (this.app.saveData && this.app.saveData.runMode === 'BLITZ_90')) {
        this.pushLiveBanter({
          kind: 'duo',
          badge: `第${clashData.bossLine.tribNo}难·交锋`,
          lines: [
            {
              speakerId: clashData.bossLine.speakerId,
              speakerName: clashData.bossLine.speakerName,
              speakerTitle: '守关妖王',
              isBoss: true,
              themeColor: '#ff4d6d',
              text: clashData.bossLine.text
            },
            {
              speakerId: clashData.heroLine.speakerId,
              speakerName: clashData.heroLine.speakerName,
              speakerTitle: clashData.heroLine.speakerTitle,
              themeColor: clashData.heroLine.themeColor,
              text: clashData.heroLine.text
            }
          ]
        });
        return;
      }

      this.active = {
        type: 'BOSS_INTRO',
        bossEntity,
        tribNo: clashData.bossLine.tribNo,
        tribTitle: (this.app.level && this.app.level.biome && this.app.level.biome.name) || `第${clashData.bossLine.tribNo}难`,
        timer: 0,
        beatTimer: 0,
        beats: [
          {
            side: 'right',
            isBoss: true,
            speakerId: clashData.bossLine.speakerId,
            speakerName: clashData.bossLine.speakerName,
            speakerTitle: `第${clashData.bossLine.tribNo}难 · 守关妖王`,
            seal: '凶煞',
            themeColor: bossEntity.accent || '#ff4d6d',
            text: clashData.bossLine.text
          },
          {
            side: 'left',
            isBoss: false,
            speakerId: clashData.heroLine.speakerId,
            speakerName: clashData.heroLine.speakerName,
            speakerTitle: clashData.heroLine.speakerTitle,
            seal: clashData.heroLine.seal,
            themeColor: clashData.heroLine.themeColor,
            text: clashData.heroLine.text
          }
        ],
        beatIdx: 0,
        typedChars: 0,
        voiceTick: 0,
        heroSlashDone: false,
        onComplete: () => {
          if (this.app.player) {
            this.app.player.invulnTimer = Math.max(this.app.player.invulnTimer, 0.75);
          }
          if (bossEntity && !bossEntity.dead) {
            bossEntity.windupTimer = 0;
            bossEntity.attackCd = 1.1;
          }
          this.app.triggerZoomPunch && this.app.triggerZoomPunch(0.045);
          this.app.triggerImpactFlash && this.app.triggerImpactFlash('#ffd166', 0.18);
          playSealStampSFX();
        }
      };
      this.app.modal = 'CUTSCENE_ACTIVE';
      playSealStampSFX();
    }

    // -------------------- 4. 启动观音甘露逆天复活神迹过场 --------------------
    startReviveMiracle(revLine) {
      if (!revLine) return;
      if (this.isFastMode()) {
        this.pushLiveBanter({
          kind: 'solo',
          badge: '✨ 观音甘露逆转',
          lines: [
            {
              speakerId: revLine.speakerId,
              speakerName: revLine.speakerName,
              speakerTitle: revLine.speakerTitle,
              themeColor: '#ffd166',
              text: revLine.text
            }
          ]
        });
        return;
      }

      this.active = {
        type: 'REVIVE_MIRACLE',
        heroId: revLine.speakerId,
        timer: 0,
        duration: 2.7,
        beats: [
          {
            side: 'left',
            isBoss: false,
            speakerId: revLine.speakerId,
            speakerName: revLine.speakerName,
            speakerTitle: '✨ 观音甘露 · 金身重塑',
            seal: revLine.seal || '涅槃',
            themeColor: '#ffd166',
            text: revLine.text
          }
        ],
        beatIdx: 0,
        typedChars: 0,
        voiceTick: 0,
        onComplete: () => {
          if (this.app.player) {
            // 确保过场结束后玩家仍享有完整 3.5 秒无敌金身！
            this.app.player.invulnTimer = Math.max(this.app.player.invulnTimer, 3.5);
            this.app.player.reviveAuraTimer = Math.max(this.app.player.reviveAuraTimer, 3.5);
          }
          this.app.triggerZoomPunch && this.app.triggerZoomPunch(0.05);
        }
      };
      this.app.modal = 'CUTSCENE_ACTIVE';
      SoundFX.play('revive');
    }

    // -------------------- 5. 启动单局通关圆满 / 兵解归祠终章过场 --------------------
    startRunEnding(endLine, onDoneToRunOver) {
      if (!endLine) {
        onDoneToRunOver && onDoneToRunOver();
        return;
      }
      if (this.isFastMode() && !endLine.victory) {
        onDoneToRunOver && onDoneToRunOver();
        return;
      }

      this.active = {
        type: endLine.victory ? 'VICTORY_ENDING' : 'DEFEAT_EPILOGUE',
        victory: !!endLine.victory,
        heroId: endLine.speakerId,
        timer: 0,
        duration: endLine.victory ? 4.0 : 2.6,
        beats: [
          {
            side: 'left',
            isBoss: false,
            speakerId: endLine.speakerId,
            speakerName: endLine.speakerName,
            speakerTitle: endLine.victory ? '🏆 九九归真 · 破劫圆满' : '⛩ 兵解轮回 · 灵蕴归祠',
            seal: endLine.victory ? '圆满' : endLine.seal,
            themeColor: endLine.victory ? '#ffd166' : '#90e0ef',
            text: endLine.text
          }
        ],
        beatIdx: 0,
        typedChars: 0,
        voiceTick: 0,
        onComplete: onDoneToRunOver || null
      };
      this.app.modal = 'CUTSCENE_ACTIVE';
      if (endLine.victory) {
        SoundFX.play('revive');
      } else {
        playSealStampSFX();
      }
    }

    // -------------------- 6. 推送非阻塞式行军传音 / 斩妖朱印横幅 --------------------
    pushLiveBanter(banterObj) {
      if (!banterObj || !banterObj.lines || !banterObj.lines.length) return;
      this.liveBanter = {
        badge: banterObj.badge || (banterObj.kind === 'duo' ? '📡 师徒传音' : '📜 行者独白'),
        isKillSeal: !!banterObj.isKillSeal,
        sealText: banterObj.sealText || '破劫',
        lines: banterObj.lines,
        idx: 0,
        timer: 0,
        typedChars: 0,
        voiceTick: 0,
        lineDuration: banterObj.isKillSeal ? 3.2 : 3.3
      };
    }

    // -------------------- 玩家点击/按键推进或瞬间跳过 --------------------
    advanceOrCompleteBeat() {
      const cs = this.active;
      if (!cs) return false;

      if (cs.type === 'PROLOGUE_EPIC') {
        const sc = cs.scenes[cs.stepIdx];
        const fullLen = (sc.caption || '').length + (sc.subCaption || '').length;
        if (cs.typedChars < fullLen && sc.shotType !== 'pilgrims_assemble') {
          cs.typedChars = fullLen + 10;
          return true;
        }
        cs.stepIdx++;
        cs.stepTimer = 0;
        cs.typedChars = 0;
        if (cs.stepIdx >= cs.scenes.length) {
          this.finishActiveCutscene();
        } else {
          SoundFX.play('uiClick');
        }
        return true;
      }

      const curBeat = cs.beats && cs.beats[cs.beatIdx];
      if (curBeat && cs.typedChars < curBeat.text.length) {
        cs.typedChars = curBeat.text.length;
        return true;
      }

      if (cs.beats && cs.beatIdx + 1 < cs.beats.length) {
        cs.beatIdx++;
        cs.beatTimer = 0;
        cs.typedChars = 0;
        if (cs.type === 'BOSS_INTRO' && cs.beatIdx === 1 && !cs.heroSlashDone) {
          this.triggerHeroFlourishFX();
        }
        SoundFX.play('uiClick');
        return true;
      }

      this.finishActiveCutscene();
      return true;
    }

    skipAll() {
      if (!this.active) return;
      SoundFX.play('uiClick');
      this.finishActiveCutscene();
    }

    finishActiveCutscene() {
      const cs = this.active;
      if (!cs) return;
      this.active = null;

      if (cs.type === 'PROLOGUE_EPIC') {
        const ds = DialogueBank.ensureDialogueState(this.app.saveData);
        ds.prologueSeen = true;
        this.app.persistSave();
        this.app.modal = null;
        if (cs.onComplete) cs.onComplete();
        return;
      }

      this.app.modal = null;
      if (cs.onComplete) cs.onComplete();
    }

    triggerHeroFlourishFX() {
      const cs = this.active;
      const app = this.app;
      if (!cs || !app.player || !app.effects) return;
      cs.heroSlashDone = true;
      const p = app.player;
      p.dir = cs.bossEntity && cs.bossEntity.x >= p.x ? 1 : -1;
      p.triggerSquash && p.triggerSquash(1.22, 0.84);
      SoundFX.play('slash2');
      app.effects.spawnSlashArc({
        x: p.x + p.dir * 26,
        y: p.y - 18,
        dir: p.dir,
        radiusX: 58,
        radiusY: 36,
        color: p.charDef.themeColor,
        heavy: true,
        duration: 0.28
      });
      app.effects.spawnParticles(p.x, p.y - 18, 16, p.charDef.themeColor, 40, 150, 0.16, 0.36, 80);
    }

    // -------------------- 每帧动画与镜头运镜更新 --------------------
    update(dt) {
      const app = this.app;

      // 1. 更新非阻塞式传音/斩妖横幅（即使在激战中也丝滑流转）
      if (this.liveBanter && !this.active && !app.modal && app.state === 'PLAYING') {
        const lb = this.liveBanter;
        const cur = lb.lines[lb.idx];
        if (cur) {
          lb.timer += dt;
          const prevChars = Math.floor(lb.typedChars);
          lb.typedChars = Math.min(cur.text.length, lb.typedChars + dt * TYPEWRITER_CPS * 1.15);
          if (Math.floor(lb.typedChars) > prevChars) {
            lb.voiceTick -= dt;
            if (lb.voiceTick <= 0) {
              lb.voiceTick = 0.068;
              playCharacterVoiceBlip(cur.speakerId, !!cur.isBoss);
            }
          }
          if (lb.timer >= lb.lineDuration) {
            lb.idx++;
            lb.timer = 0;
            lb.typedChars = 0;
            if (lb.idx >= lb.lines.length) {
              this.liveBanter = null;
            }
          }
        } else {
          this.liveBanter = null;
        }
      }

      // 2. 更新阻塞式电影级过场运镜与粒子
      const cs = this.active;
      if (!cs) return;

      // 让背景浮动粒子、刀光残影在过场中依然保持鲜活生命力！
      if (app.state === 'PLAYING' && app.effects && app.level) {
        const dummyCtx = app.buildWorldContext();
        app.effects.update(dt, dummyCtx);
        if (app.shakeMag > 0) app.shakeMag = Math.max(0, app.shakeMag - dt * 28);
        if (app.zoomPunch > 0) app.zoomPunch = Math.max(0, app.zoomPunch - dt * 0.22);
        if (app.impactFlashAlpha > 0) app.impactFlashAlpha = Math.max(0, app.impactFlashAlpha - dt * 1.6);
      }

      if (cs.type === 'PROLOGUE_EPIC') {
        cs.stepTimer += dt;
        const sc = cs.scenes[cs.stepIdx];
        if (!sc) {
          this.finishActiveCutscene();
          return;
        }
        if (sc.shotType === 'scroll_shatter' && cs.stepTimer >= 1.05 && !cs.lightningFired) {
          cs.lightningFired = true;
          SoundFX.play('killBlow');
          Env.vibrate && Env.vibrate('heavy');
        }
        if (sc.shotType === 'cinnabar_vow' && cs.stepTimer >= 0.55 && !cs.sealStamped) {
          cs.sealStamped = true;
          playSealStampSFX();
          Env.vibrate && Env.vibrate('medium');
        }
        cs.typedChars += dt * TYPEWRITER_CPS;
        cs.voiceTick -= dt;
        const capLen = (sc.caption || '').length + (sc.subCaption || '').length;
        if (cs.typedChars < capLen && cs.voiceTick <= 0) {
          cs.voiceTick = 0.065;
          playCharacterVoiceBlip('tangseng', false);
        }
        if (cs.stepTimer >= sc.duration) {
          cs.stepIdx++;
          cs.stepTimer = 0;
          cs.typedChars = 0;
          if (cs.stepIdx >= cs.scenes.length) {
            this.finishActiveCutscene();
          }
        }
        return;
      }

      cs.timer += dt;
      cs.beatTimer = (cs.beatTimer || 0) + dt;
      const beat = cs.beats && cs.beats[cs.beatIdx];
      if (beat) {
        const prevC = Math.floor(cs.typedChars);
        cs.typedChars = Math.min(beat.text.length, cs.typedChars + dt * TYPEWRITER_CPS);
        if (Math.floor(cs.typedChars) > prevC) {
          cs.voiceTick -= dt;
          if (cs.voiceTick <= 0) {
            cs.voiceTick = 0.056;
            playCharacterVoiceBlip(beat.speakerId, !!beat.isBoss);
          }
        }
      }

      // 分类型专属镜头推拉与动作事件
      if (cs.type === 'RUN_INTRO' && app.player && app.level) {
        const t = cs.timer;
        const introRatio = Math.min(1, t / 0.72);
        // 破风入场落地爆点
        if (introRatio >= 1 && !cs.landedFX) {
          cs.landedFX = true;
          app.triggerShake && app.triggerShake(5, 1, 1);
          app.triggerZoomPunch && app.triggerZoomPunch(0.038);
          SoundFX.play('slam');
          app.effects && app.effects.spawnZone({
            kind: 'shockwave_ring',
            x: cs.originX,
            y: cs.originY - 8,
            radius: 74,
            color: app.player.charDef.themeColor,
            duration: 0.34
          });
          app.effects && app.effects.spawnParticles(cs.originX, cs.originY - 10, 20, app.player.charDef.themeColor, 40, 170, 0.18, 0.42, 180);
        }
        const targetCamX = Math.max(0, Math.min(app.level.widthPx - app.worldW, cs.originX - app.worldW * 0.38));
        const startCamX = Math.max(0, targetCamX + 48);
        app.camX = startCamX + (targetCamX - startCamX) * Math.min(1, t * 1.8);

        if (cs.timer >= cs.duration) {
          this.finishActiveCutscene();
        }
      } else if (cs.type === 'BOSS_INTRO' && app.player && cs.bossEntity && app.level) {
        const boss = cs.bossEntity;
        const p = app.player;
        p.dir = boss.x >= p.x ? 1 : -1;
        boss.dir = p.x < boss.x ? -1 : 1;

        // 镜头平滑横移聚焦于主角与妖王对峙中轴线
        const focusX = cs.beatIdx === 0
          ? p.x * 0.32 + boss.x * 0.68
          : p.x * 0.58 + boss.x * 0.42;
        const desiredCamX = Math.max(0, Math.min(app.level.widthPx - app.worldW, focusX - app.worldW * 0.5));
        app.camX += (desiredCamX - app.camX) * Math.min(1, dt * 6.5);

        if (cs.beatIdx === 0 && cs.beatTimer < 0.5) {
          boss.scaleX = 1 + Math.sin(cs.beatTimer * 22) * 0.16;
          boss.scaleY = 1 - Math.sin(cs.beatTimer * 22) * 0.12;
        }

        const singleBeatDur = 2.35;
        if (cs.beatTimer >= singleBeatDur) {
          if (cs.beatIdx === 0) {
            cs.beatIdx = 1;
            cs.beatTimer = 0;
            cs.typedChars = 0;
            this.triggerHeroFlourishFX();
          } else {
            this.finishActiveCutscene();
          }
        }
      } else if (cs.type === 'REVIVE_MIRACLE') {
        if (cs.timer >= cs.duration) {
          this.finishActiveCutscene();
        }
      } else if (cs.type === 'VICTORY_ENDING' || cs.type === 'DEFEAT_EPILOGUE') {
        if (cs.timer >= cs.duration) {
          this.finishActiveCutscene();
        }
      }
    }

    // ========================================================================
    // 四、像素世界层特效叠加渲染（在 renderPixelWorld 末尾注入真像素演出！）
    // ========================================================================
    renderWorldOverlay(wctx) {
      const cs = this.active;
      const app = this.app;
      if (!cs || !wctx || !app.level || !app.player) return;

      const camX = Math.round(app.camX);
      const camY = Math.round(app.camY);
      const px = Math.round(app.player.x - camX);
      const py = Math.round(app.player.y - camY);

      const wScale = app.worldPixelScale || 1;
      wctx.save();
      if (wctx.setTransform && wScale !== 1) {
        wctx.setTransform(wScale, 0, 0, wScale, 0, 0);
      }
      if (cs.type === 'RUN_INTRO') {
        const t = cs.timer;
        const style = cs.entranceStyle;
        if (t < 0.85) {
          const p = Math.min(1, t / 0.72);
          if (style === 'somersault_cloud') {
            // 孙悟空：金色筋斗云残迹俯冲 + 定海金光柱
            const cy = py - Math.round((1 - p) * 95);
            wctx.fillStyle = '#ffd60a';
            for (let i = 0; i < 6; i++) {
              const ox = px - (1 - p) * 44 - i * 7 + Math.sin(t * 20 + i) * 3;
              const oy = cy + 4 - i * 6;
              wctx.fillRect(Math.round(ox) - 6, Math.round(oy) - 3, 12, 6);
            }
            wctx.strokeStyle = '#ff3b30';
            wctx.lineWidth = 2;
            wctx.beginPath();
            wctx.moveTo(px + 8, cy - 32);
            wctx.lineTo(px + 8, py);
            wctx.stroke();
          } else if (style === 'lotus_dharma') {
            // 唐僧：九品金莲法轮护体绽放
            const rad = 14 + p * 26;
            wctx.strokeStyle = 'rgba(255, 217, 102, 0.88)';
            wctx.lineWidth = 2;
            wctx.beginPath();
            wctx.ellipse(px, py - 4, rad, rad * 0.28, 0, 0, Math.PI * 2);
            wctx.stroke();
            wctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            wctx.beginPath();
            wctx.arc(px, py - 22, 16 + Math.sin(t * 12) * 2, 0, Math.PI * 2);
            wctx.stroke();
          } else if (style === 'rake_whirl') {
            // 猪八戒：天罡翠金旋风涡流
            wctx.strokeStyle = '#7be495';
            wctx.lineWidth = 2.5;
            for (let k = 0; k < 3; k++) {
              const r = 12 + k * 9 + Math.sin(t * 24 + k) * 3;
              wctx.beginPath();
              wctx.arc(px, py - 18, r, t * 14 + k, t * 14 + k + 2.1);
              wctx.stroke();
            }
          } else if (style === 'quicksand_vortex') {
            // 沙悟净：流沙弱水寒渊升腾水柱
            wctx.fillStyle = 'rgba(0, 245, 212, 0.36)';
            wctx.fillRect(px - 18, py - Math.round(38 * (1 - p * 0.4)), 36, Math.round(38 * (1 - p * 0.4)));
            wctx.strokeStyle = '#6cd4ff';
            wctx.lineWidth = 2;
            wctx.strokeRect(px - 22, py - 5, 44, 5);
          } else if (style === 'dragon_lightning') {
            // 白龙马：九霄银龙折线惊雷劈落化形
            wctx.strokeStyle = '#00f5d4';
            wctx.lineWidth = 3;
            wctx.beginPath();
            wctx.moveTo(px - 48, 0);
            wctx.lineTo(px - 16, py - 68);
            wctx.lineTo(px + 10, py - 38);
            wctx.lineTo(px, py - 6);
            wctx.stroke();
            wctx.strokeStyle = '#ffffff';
            wctx.lineWidth = 1.5;
            wctx.stroke();
          }
        }
      } else if (cs.type === 'BOSS_INTRO' && cs.bossEntity) {
        // 妖王脚下凶煞震波光环
        const bx = Math.round(cs.bossEntity.x - camX);
        const by = Math.round(cs.bossEntity.y - camY);
        const pulseR = 24 + ((cs.timer * 48) % 38);
        wctx.strokeStyle = cs.bossEntity.accent || '#ff4d6d';
        wctx.globalAlpha = Math.max(0.15, 1 - ((cs.timer * 48) % 38) / 38);
        wctx.lineWidth = 2;
        wctx.beginPath();
        wctx.ellipse(bx, by - 6, pulseR, pulseR * 0.3, 0, 0, Math.PI * 2);
        wctx.stroke();
      } else if (cs.type === 'REVIVE_MIRACLE') {
        // 观音甘露：通天金玉佛光柱 + 飘升金莲瓣
        const beamW = Math.max(10, Math.round(34 * (1 - cs.timer / (cs.duration * 1.15))));
        wctx.fillStyle = 'rgba(255, 209, 102, 0.34)';
        wctx.fillRect(px - beamW, 0, beamW * 2, py);
        wctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        wctx.fillRect(px - Math.round(beamW * 0.35), 0, Math.round(beamW * 0.7), py);
        for (let i = 0; i < 10; i++) {
          const lx = px + Math.sin(cs.timer * 5 + i * 1.3) * 26;
          const ly = py - ((cs.timer * 55 + i * 22) % 120);
          wctx.fillStyle = i % 2 === 0 ? '#ffd166' : '#80ffdb';
          wctx.fillRect(Math.round(lx), Math.round(ly), 4, 3);
        }
      }
      wctx.restore();
    }

    // ========================================================================
    // 五、高清 UI 层渲染（四幕史诗序章 / 宽银幕电影字幕框 / 终章画卷 / 非阻塞传音）
    // ========================================================================
    renderUIOverlay(ctx, sw, sh) {
      if (this.active) {
        if (this.active.type === 'PROLOGUE_EPIC') {
          this.renderPrologueScreen(ctx, sw, sh);
        } else if (this.active.type === 'VICTORY_ENDING' || this.active.type === 'DEFEAT_EPILOGUE') {
          this.renderEndingCinematic(ctx, sw, sh);
        } else {
          this.renderWidescreenCutscene(ctx, sw, sh);
        }
        return;
      }

      if (this.liveBanter && !this.app.modal && this.app.state === 'PLAYING') {
        this.renderLiveBanterStrip(ctx, sw, sh);
      }
    }

    // -------------------- 渲染 A：四幕史诗开场序章动画 --------------------
    renderPrologueScreen(ctx, sw, sh) {
      const cs = this.active;
      const app = this.app;
      const ui = app.ui;
      ui.clearButtons();

      const sc = cs.scenes[cs.stepIdx] || cs.scenes[0];
      const t = cs.stepTimer;

      // 1. 水墨暗金苍穹底色
      const bg = ctx.createLinearGradient(0, 0, 0, sh);
      bg.addColorStop(0, '#070510');
      bg.addColorStop(0.55, sc.shotType === 'demons_awaken' ? '#2b0912' : '#161129');
      bg.addColorStop(1, '#24151c');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, sw, sh);

      const cx = Math.round(sw / 2);
      const stageCy = Math.round(sh * 0.40);

      // 2. 分幕像素动画演出
      ctx.save();
      if (sc.shotType === 'scroll_shatter') {
        if (t < 1.05) {
          // 悬浮《九九归真难簿》金卷颤动
          const jitX = t > 0.65 ? (Math.random() - 0.5) * 6 : 0;
          const floatY = Math.sin(t * 5) * 5;
          drawPixelPanel(ctx, cx - 86 + jitX, stageCy - 32 + floatY, 172, 64, '#3a2612', '#ffd166', 6);
          ctx.fillStyle = '#ffd166';
          ctx.fillRect(cx - 94 + jitX, stageCy - 38 + floatY, 10, 76);
          ctx.fillRect(cx + 84 + jitX, stageCy - 38 + floatY, 10, 76);
          ctx.textAlign = 'center';
          ctx.font = 'bold 17px serif, sans-serif';
          ctx.fillText('《九九八十一难簿》', cx + jitX, stageCy + 6 + floatY);
        } else {
          // 劫雷劈落 + 八十一残页炸裂四散！
          const bt = t - 1.05;
          if (bt < 0.22) {
            ctx.fillStyle = `rgba(255, 220, 130, ${0.65 - bt * 2.5})`;
            ctx.fillRect(0, 0, sw, sh);
            ctx.strokeStyle = '#ff2a54';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(cx - 24, 0);
            ctx.lineTo(cx + 18, stageCy - 34);
            ctx.lineTo(cx - 12, stageCy + 8);
            ctx.stroke();
          }
          for (let i = 0; i < this.shards.length; i++) {
            const shd = this.shards[i];
            const sx = cx + shd.vx * bt * 0.85;
            const sy = stageCy + shd.vy * bt * 0.85 + 32 * bt * bt;
            ctx.fillStyle = shd.gold ? '#ffd166' : '#ff4d6d';
            ctx.fillRect(Math.round(sx), Math.round(sy), shd.sz + 3, shd.sz);
          }
        }
      } else if (sc.shotType === 'demons_awaken') {
        // 四大宿命妖王剪影与赤瞳威压横卷
        const showcaseBosses = ['trib_11', 'trib_20', 'trib_46', 'trib_49', 'trib_63'];
        const spanW = Math.min(sw - 80, 560);
        const startX = cx - Math.round(spanW / 2);
        showcaseBosses.forEach((bid, idx) => {
          const bx = startX + Math.round((idx / (showcaseBosses.length - 1)) * spanW);
          const appear = Math.max(0, Math.min(1, (t - idx * 0.14) * 2.4));
          const by = stageCy + 34 + Math.round((1 - appear) * 24);
          ctx.globalAlpha = appear;
          ctx.fillStyle = 'rgba(220, 47, 2, 0.22)';
          ctx.beginPath();
          ctx.ellipse(bx, by, 34, 9, 0, 0, Math.PI * 2);
          ctx.fill();
          const spr = app.assetLoader.getMonsterHiResSprite(bid, Math.floor(t * 4 + idx) % 2 === 0 ? 'f0' : 'f1');
          if (spr) {
            ctx.imageSmoothingEnabled = false;
            const dw = Math.round(spr.width * 0.92);
            const dh = Math.round(spr.height * 0.92);
            ctx.drawImage(spr, Math.round(bx - dw / 2), Math.round(by - dh), dw, dh);
          }
        });
        ctx.globalAlpha = 1;
      } else if (sc.shotType === 'pilgrims_assemble') {
        // 五圣临渊群像逐一踏落立誓！
        const vows = sc.heroVows || [];
        const activeHeroIdx = Math.min(vows.length - 1, Math.floor((t / sc.duration) * vows.length));
        const spanW = Math.min(sw - 90, 580);
        const startX = cx - Math.round(spanW / 2);

        vows.forEach((vItem, idx) => {
          const pf = DialogueBank.HERO_PROFILES[vItem.charId];
          const hx = startX + Math.round((idx / (vows.length - 1)) * spanW);
          const dropP = Math.min(1, t * 3.2 - idx * 0.22);
          if (dropP <= 0) return;
          const isSpeaking = idx === activeHeroIdx;
          const hy = stageCy + 24 - Math.round((1 - dropP) * 70) - (isSpeaking ? 6 : 0);

          ctx.fillStyle = isSpeaking ? pf.themeColor : 'rgba(255,255,255,0.14)';
          ctx.globalAlpha = isSpeaking ? 0.38 : 0.16;
          ctx.beginPath();
          ctx.ellipse(hx, stageCy + 26, isSpeaking ? 32 : 22, 7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = isSpeaking ? 1 : 0.62;

          const spr = app.assetLoader.getHeroHiResSprite(vItem.charId, isSpeaking ? 'attack' : 'idle');
          if (spr) {
            ctx.imageSmoothingEnabled = false;
            const scale = isSpeaking ? 0.95 : 0.80;
            const dw = Math.round(spr.width * scale);
            const dh = Math.round(spr.height * scale);
            ctx.drawImage(spr, Math.round(hx - dw / 2), Math.round(hy - dh), dw, dh);
          }
        });
        ctx.globalAlpha = 1;

        const curVow = vows[activeHeroIdx];
        if (curVow) {
          const pf = DialogueBank.HERO_PROFILES[curVow.charId];
          const vowW = Math.min(620, sw - 48);
          drawPixelPanel(ctx, cx - Math.round(vowW / 2), stageCy + 42, vowW, 44, 'rgba(18, 14, 30, 0.92)', pf.themeColor, 5);
          ctx.textAlign = 'center';
          ctx.fillStyle = pf.themeColor;
          ctx.font = 'bold 13px sans-serif';
          ctx.fillText(`【${pf.name}】${curVow.text}`, cx, stageCy + 69);
        }
      } else if (sc.shotType === 'cinnabar_vow') {
        // 主角亮兵 + 本命光环 + 巨型【破劫】朱砂印轰然盖落
        const selId = app.selectedCharId || 'wukong';
        const pf = DialogueBank.HERO_PROFILES[selId] || DialogueBank.HERO_PROFILES.wukong;
        ctx.strokeStyle = pf.themeColor;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx - 38, stageCy - 18, 42 + Math.sin(t * 8) * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        const spr = app.assetLoader.getHeroHiResSprite(selId, 'attack');
        if (spr) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(spr, Math.round(cx - spr.width * 0.55 - 38), Math.round(stageCy + 28 - spr.height * 1.1), Math.round(spr.width * 1.1), Math.round(spr.height * 1.1));
        }
        if (t >= 0.45) {
          const stampScale = Math.max(1, 2.2 - (t - 0.45) * 5.5);
          drawCinnabarSeal(ctx, cx + 22, stageCy - 42, 68, '破劫', stampScale);
        }
      }
      ctx.restore();

      // 3. 顶部章节卷标与控制栏
      const pad = Math.max(18, Math.round(sw * 0.03));
      drawPixelPanel(ctx, pad, 14, 152, 28, 'rgba(20, 15, 32, 0.9)', '#ffd166', 4);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`📜 序章 · ${sc.chapterTag}`, pad + 76, 33);

      // 分镜进度点
      for (let i = 0; i < cs.scenes.length; i++) {
        ctx.fillStyle = i === cs.stepIdx ? '#ffd166' : 'rgba(255,255,255,0.25)';
        ctx.fillRect(cx - 26 + i * 14, 24, i === cs.stepIdx ? 10 : 6, 6);
      }

      // 底部水墨字幕匣
      const boxH = 88;
      const boxY = sh - boxH - 12;
      const boxW = Math.min(720, sw - pad * 2);
      const boxX = Math.round((sw - boxW) / 2);
      drawPixelPanel(ctx, boxX, boxY, boxW, boxH, 'rgba(12, 10, 22, 0.94)', '#ffd166', 7);

      const capShown = (sc.caption || '').slice(0, Math.floor(cs.typedChars));
      const remChars = Math.max(0, Math.floor(cs.typedChars) - (sc.caption || '').length);
      const subShown = (sc.subCaption || '').slice(0, remChars);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(capShown, cx, boxY + 32);
      if (subShown) {
        ctx.fillStyle = '#90e0ef';
        ctx.font = '12px sans-serif';
        ctx.fillText(subShown, cx, boxY + 56);
      }
      ctx.fillStyle = '#ffd166';
      ctx.font = '11px sans-serif';
      ctx.fillText('▼ 点击屏幕切换下一幕', cx, boxY + 77);

      // 先注册全屏推进底层热区，再注册右上角【跳过/极速】按钮（handleTap 逆序优先响应上层按钮！）
      ui.addButton('cs_pro_next', 0, 0, sw, sh, () => {
        this.advanceOrCompleteBeat();
      });

      this.renderTopRightCutsceneButtons(ctx, sw, pad);
    }

    // -------------------- 渲染 B：局内宽银幕黑边电影过场 (出征 / Boss对峙 / 观音复活) --------------------
    renderWidescreenCutscene(ctx, sw, sh) {
      const cs = this.active;
      const app = this.app;
      const ui = app.ui;
      ui.clearButtons();

      const beat = (cs.beats && cs.beats[cs.beatIdx]) || cs.beats[0];
      if (!beat) return;

      const topBarH = 48;
      const botBarH = Math.min(118, Math.max(98, Math.round(sh * 0.26)));

      // 1. 上下电影宽银幕黑边 + 国风金线镶边
      ctx.fillStyle = 'rgba(8, 6, 16, 0.92)';
      ctx.fillRect(0, 0, sw, topBarH);
      ctx.fillRect(0, sh - botBarH, sw, botBarH);
      ctx.fillStyle = beat.themeColor || '#ffd166';
      ctx.fillRect(0, topBarH - 2, sw, 2);
      ctx.fillRect(0, sh - botBarH, sw, 2);

      const pad = Math.max(18, Math.round(sw * 0.03));

      // 2. Boss 登场首幕专属：右侧展开【竖排描金朱砂难号榜文】
      if (cs.type === 'BOSS_INTRO' && cs.beatIdx === 0 && cs.bossEntity) {
        const plaqueW = 196;
        const plaqueH = 54;
        const px = sw - pad - plaqueW;
        const py = topBarH + 12;
        drawPixelPanel(ctx, px, py, plaqueW, plaqueH, 'rgba(32, 10, 16, 0.92)', '#ffba08', 6);
        drawCinnabarSeal(ctx, px + 8, py + 9, 36, '妖王', 1);
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`第 ${cs.tribNo} 难 · 守关正主`, px + 52, py + 22);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(cs.bossEntity.name.slice(0, 10), px + 52, py + 42);
      }

      // 3. 左上角场景铭牌
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 13px sans-serif';
      const stageTitle =
        cs.type === 'BOSS_INTRO'
          ? `⚔ 宿命交锋 · ${cs.tribTitle}`
          : cs.type === 'REVIVE_MIRACLE'
            ? '✨ 南海紫竹 · 观音垂慈'
            : `📜 ${(app.level && app.level.biome && app.level.biome.name) || '西行破劫'}`;
      ctx.fillText(stageTitle, pad, 30);

      // 4. 底部立绘铭牌与打字机台词框
      const barTop = sh - botBarH;
      const portraitBoxSize = botBarH - 16;
      const isRight = beat.side === 'right';
      const portX = isRight ? sw - pad - portraitBoxSize : pad;
      const portY = barTop + 8;

      drawPixelPanel(ctx, portX, portY, portraitBoxSize, portraitBoxSize, '#19142b', beat.themeColor || '#ffd166', 6);

      // 说话时像素立绘微幅呼吸弹跳（主角支持实时纸娃娃披挂渲染！）
      const speaking = cs.typedChars < beat.text.length;
      const talkBounce = speaking ? Math.round(Math.abs(Math.sin(app.globalTime * 22)) * 3) : 0;

      if (beat.isBoss) {
        const spr = app.assetLoader.getMonsterHiResSprite(
          beat.speakerId,
          speaking && Math.floor(app.globalTime * 8) % 2 === 0 ? 'f1' : 'f0'
        );
        if (spr) {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          const maxDim = portraitBoxSize - 12;
          const scale = Math.min(maxDim / Math.max(1, spr.width), maxDim / Math.max(1, spr.height));
          const dw = Math.round(spr.width * scale);
          const dh = Math.round(spr.height * scale);
          ctx.drawImage(
            spr,
            Math.round(portX + (portraitBoxSize - dw) / 2),
            Math.round(portY + portraitBoxSize - dh - 4 - talkBounce),
            dw,
            dh
          );
          ctx.restore();
        }
      } else {
        drawHeroCutsceneActor(
          ctx,
          app,
          beat.speakerId,
          portX + portraitBoxSize / 2,
          portY + portraitBoxSize - 6 - talkBounce,
          portraitBoxSize - 14,
          speaking && Math.floor(app.globalTime * 7) % 2 === 0,
          app.globalTime
        );
      }

      // 角标朱砂印
      drawCinnabarSeal(
        ctx,
        isRight ? portX - 14 : portX + portraitBoxSize - 18,
        portY + 2,
        28,
        beat.seal || '破劫',
        1
      );

      // 姓名头衔与打字机正文
      const textLeft = isRight ? pad + 8 : portX + portraitBoxSize + 18;
      const textRight = isRight ? portX - 22 : sw - pad - 8;
      const textMaxW = Math.max(180, textRight - textLeft);

      ctx.textAlign = 'left';
      ctx.fillStyle = beat.themeColor || '#ffd166';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`【${beat.speakerName}】`, textLeft, barTop + 26);

      const nameW = ctx.measureText(`【${beat.speakerName}】`).width;
      ctx.fillStyle = '#adb5bd';
      ctx.font = '11px sans-serif';
      ctx.fillText(beat.speakerTitle || '', textLeft + nameW + 8, barTop + 25);

      const shownStr = beat.text.slice(0, Math.floor(cs.typedChars));
      ctx.fillStyle = '#f8f9fa';
      ctx.font = '14px sans-serif';
      const lines = wrapCnLines(ctx, shownStr, textMaxW);
      lines.slice(0, 3).forEach((ln, idx) => {
        ctx.fillText(ln, textLeft, barTop + 51 + idx * 21);
      });

      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffd166';
      ctx.font = '11px sans-serif';
      const promptLabel = speaking
        ? '点击瞬间显示 ▶'
        : cs.beats && cs.beatIdx + 1 < cs.beats.length
          ? '点击下一句 ▶'
          : '⚔ 点击开战 ▶';
      ctx.fillText(promptLabel, textRight, sh - 10);

      // 全屏点击推进 + 右上角【极速切换 / 跳过】按钮
      ui.addButton('cs_tap_advance', 0, 0, sw, sh, () => {
        this.advanceOrCompleteBeat();
      });
      this.renderTopRightCutsceneButtons(ctx, sw, pad);
    }

    // -------------------- 渲染 C：单局通关金门升华 / 兵解归祠终章画卷 --------------------
    renderEndingCinematic(ctx, sw, sh) {
      const cs = this.active;
      const app = this.app;
      const ui = app.ui;
      ui.clearButtons();

      const beat = cs.beats[0];
      const cx = Math.round(sw / 2);
      const stageCy = Math.round(sh * 0.42);

      // 渐变天幕
      const grad = ctx.createLinearGradient(0, 0, 0, sh);
      if (cs.victory) {
        grad.addColorStop(0, '#120d24');
        grad.addColorStop(0.55, '#3b1f2b');
        grad.addColorStop(1, '#593818');
      } else {
        grad.addColorStop(0, '#070712');
        grad.addColorStop(0.6, '#141829');
        grad.addColorStop(1, '#1d1528');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, sw, sh);

      ctx.save();
      if (cs.victory) {
        // 破劫金门 + 漫天祥云金莲粒子 + 五师徒共鸣背影
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 4;
        ctx.strokeRect(cx - 58, stageCy - 74, 116, 98);
        ctx.fillStyle = 'rgba(255, 214, 10, 0.24)';
        ctx.fillRect(cx - 54, stageCy - 70, 108, 92);

        for (let i = 0; i < 20; i++) {
          const rx = ((i * 73 + Math.floor(cs.timer * 32)) % (sw - 40)) + 20;
          const ry = ((i * 41 - Math.floor(cs.timer * 26)) % (sh - 120) + (sh - 120)) % (sh - 120);
          ctx.fillStyle = i % 2 === 0 ? '#ffd166' : '#ff9f1c';
          ctx.fillRect(rx, ry, 4, 3);
        }

        const spr = app.assetLoader.getHeroHiResSprite(cs.heroId, 'idle');
        if (spr) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(spr, Math.round(cx - spr.width * 0.5), Math.round(stageCy + 24 - spr.height));
        }
        drawCinnabarSeal(ctx, cx + 68, stageCy - 66, 46, '归真', 1);
      } else {
        // 兵解归祠：青色灵蕴光点自角色飘向远方土地仙祠灯火
        drawPixelPanel(ctx, cx + 88, stageCy - 36, 48, 48, '#1b263b', '#69f0ae', 4);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#69f0ae';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('⛩仙祠', cx + 112, stageCy - 8);

        const spr = app.assetLoader.getHeroHiResSprite(cs.heroId, 'idle');
        if (spr) {
          ctx.globalAlpha = Math.max(0.35, 1 - cs.timer * 0.22);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(spr, Math.round(cx - 70 - spr.width * 0.45), Math.round(stageCy + 22 - spr.height * 0.9), Math.round(spr.width * 0.9), Math.round(spr.height * 0.9));
          ctx.globalAlpha = 1;
        }
        for (let i = 0; i < 12; i++) {
          const p = ((cs.timer * 0.7 + i / 12) % 1);
          const wx = (cx - 56) + p * 164;
          const wy = stageCy - 10 - Math.sin(p * Math.PI) * 28;
          ctx.fillStyle = '#72efdd';
          ctx.fillRect(Math.round(wx), Math.round(wy), 4, 4);
        }
      }
      ctx.restore();

      const pad = Math.max(18, Math.round(sw * 0.03));
      const boxW = Math.min(680, sw - pad * 2);
      const boxH = 96;
      const boxX = Math.round((sw - boxW) / 2);
      const boxY = sh - boxH - 14;

      drawPixelPanel(ctx, boxX, boxY, boxW, boxH, 'rgba(14, 12, 26, 0.95)', beat.themeColor, 7);
      ctx.textAlign = 'left';
      ctx.fillStyle = beat.themeColor;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`【${beat.speakerName}】 ${beat.speakerTitle}`, boxX + 18, boxY + 26);

      const shown = beat.text.slice(0, Math.floor(cs.typedChars));
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px sans-serif';
      const lines = wrapCnLines(ctx, shown, boxW - 36);
      lines.slice(0, 2).forEach((ln, idx) => {
        ctx.fillText(ln, boxX + 18, boxY + 52 + idx * 22);
      });

      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffd166';
      ctx.font = '11px sans-serif';
      ctx.fillText('点击查看战绩结算 ▶', boxX + boxW - 16, boxY + boxH - 10);

      ui.addButton('cs_end_next', 0, 0, sw, sh, () => {
        this.advanceOrCompleteBeat();
      });
      this.renderTopRightCutsceneButtons(ctx, sw, pad);
    }

    renderTopRightCutsceneButtons(ctx, sw, pad) {
      const ui = this.app.ui;
      const skipW = 74;
      const skipX = sw - pad - skipW;
      const btnY = 10;

      drawPixelPanel(ctx, skipX, btnY, skipW, 28, '#2b2d42', '#ffd166', 4);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('⏭ 跳过', skipX + skipW / 2, btnY + 19);
      ui.addButton('cs_btn_skip', skipX, btnY, skipW, 28, () => {
        this.skipAll();
      });

      const fastW = 96;
      const fastX = skipX - fastW - 8;
      const isFast = this.isFastMode();
      drawPixelPanel(ctx, fastX, btnY, fastW, 28, '#1d2d44', isFast ? '#69f0ae' : '#90e0ef', 4);
      ctx.fillStyle = isFast ? '#69f0ae' : '#e0fbfc';
      ctx.font = '11px sans-serif';
      ctx.fillText(isFast ? '⚡极速:开' : '🎬过场:标准', fastX + fastW / 2, btnY + 18);
      ui.addButton('cs_btn_fast', fastX, btnY, fastW, 28, () => {
        this.toggleFastMode();
      });
    }

    // -------------------- 渲染 D：非阻塞式行军传音 & 斩妖朱印横幅 --------------------
    renderLiveBanterStrip(ctx, sw, sh) {
      const lb = this.liveBanter;
      if (!lb) return;
      const cur = lb.lines[lb.idx];
      if (!cur) return;

      const safeLeft = Math.max(14, Math.round(sw * 0.02));
      const stripW = Math.min(376, Math.max(256, Math.round(sw * 0.45)));
      const stripH = 54;
      // 紧贴左上角状态栏 (y=8, h=84) 下方展示，绝不遮挡左摇杆或中间视野！
      const sx = safeLeft;
      const sy = 96;

      const fadeIn = Math.min(1, lb.timer * 7);
      const fadeOut = Math.min(1, (lb.lineDuration - lb.timer) * 4.5);
      const alpha = Math.max(0, Math.min(fadeIn, fadeOut));

      ctx.save();
      ctx.globalAlpha = alpha * 0.94;
      const borderCol = cur.themeColor || '#ffd166';
      drawPixelPanel(ctx, sx, sy, stripW, stripH, 'rgba(15, 12, 28, 0.90)', borderCol, 5);

      // 迷你像素头像框
      const headSize = 42;
      drawPixelPanel(ctx, sx + 6, sy + 6, headSize, headSize, '#0f0c1d', borderCol, 3);
      const spr = cur.isBoss
        ? this.app.assetLoader.getMonsterHiResSprite(cur.speakerId, 'f0')
        : this.app.assetLoader.getHeroHiResSprite(cur.speakerId, 'idle');
      if (spr) {
        ctx.imageSmoothingEnabled = false;
        const sc = Math.min(36 / Math.max(1, spr.width), 36 / Math.max(1, spr.height));
        const dw = Math.round(spr.width * sc);
        const dh = Math.round(spr.height * sc);
        ctx.drawImage(spr, Math.round(sx + 27 - dw / 2), Math.round(sy + 45 - dh), dw, dh);
      }

      if (lb.isKillSeal) {
        drawCinnabarSeal(ctx, sx + stripW - 32, sy + 5, 24, lb.sealText || '诛邪', 1);
      }

      const tx = sx + headSize + 13;
      const maxTw = stripW - headSize - (lb.isKillSeal ? 44 : 20);
      ctx.textAlign = 'left';
      ctx.fillStyle = borderCol;
      ctx.font = 'bold 11px sans-serif';
      const stepTag = lb.lines.length > 1 ? ` (${lb.idx + 1}/${lb.lines.length})` : '';
      ctx.fillText(`${lb.badge} · ${cur.speakerName}${stepTag}`, tx, sy + 17);

      ctx.fillStyle = '#f8f9fa';
      ctx.font = '11.5px sans-serif';
      const shown = cur.text.slice(0, Math.floor(lb.typedChars));
      const wrapped = wrapCnLines(ctx, shown, maxTw);
      wrapped.slice(0, 2).forEach((ln, i) => {
        ctx.fillText(ln, tx, sy + 33 + i * 14);
      });

      ctx.restore();
      void sh;
    }
  }

  // ============================================================================
  // 六、零侵入挂载钩子（无缝衔接 GameApp / Player / UIManager / curveDirector）
  // ============================================================================
  function hasDebugPreviewParam() {
    if (typeof window === 'undefined' || !window.location || !window.location.search) return false;
    const s = window.location.search;
    return (
      s.indexOf('preview=revive') !== -1 ||
      s.indexOf('preview=boss') !== -1 && s.indexOf('preview=boss_cutscene') === -1 ||
      s.indexOf('preview=equip') !== -1 ||
      s.indexOf('preview=bestiary') !== -1 ||
      s.indexOf('preview=terrain') !== -1 ||
      s.indexOf('preview=bag') !== -1 ||
      s.indexOf('autostart=') !== -1
    );
  }

  function installCutsceneDirector() {
    if (GameApp.__cutsceneDirectorInstalled) return;
    GameApp.__cutsceneDirectorInstalled = true;

    function getCS(app) {
      if (!app.cutscene) {
        app.cutscene = new CutsceneController(app);
      }
      return app.cutscene;
    }

    // 1. 存档扩展：持久化 dialogueState（记录 seenLineIds、角色局数、上局记忆、极速开关与序章标记）
    const prevLoadSaveData = GameApp.prototype.loadSaveData;
    GameApp.prototype.loadSaveData = function () {
      const data = prevLoadSaveData.call(this);
      const stored = Env.getStorage(
        (typeof window !== 'undefined' && window.XiyouRegistry && window.XiyouRegistry.sdkConfig
          ? window.XiyouRegistry.sdkConfig.storageKey
          : 'xiyou_rogue_save_v1'),
        null
      );
      if (stored && stored.dialogueState) {
        data.dialogueState = stored.dialogueState;
      }
      DialogueBank.ensureDialogueState(data);
      return data;
    };

    // 2. 开局拦截：新玩家首次点击开始游戏时，先献上【破劫序章 · 灵山碎卷】四幕史诗动画！
    const prevStartNewRun = GameApp.prototype.startNewRun;
    GameApp.prototype.startNewRun = function (charId, startOpts) {
      const cs = getCS(this);
      const ds = DialogueBank.ensureDialogueState(this.saveData);
      this._revivedThisRun = false;
      this._runStartLinePlayed = false;

      if (
        !ds.prologueSeen &&
        !(startOpts && startOpts.skipPrologue) &&
        !hasDebugPreviewParam()
      ) {
        this.selectedCharId = charId || this.selectedCharId;
        cs.startPrologue(() => {
          this.startNewRun(this.selectedCharId, Object.assign({}, startOpts || {}, { skipPrologue: true }));
        });
        return;
      }

      cs.liveBanter = null;
      prevStartNewRun.call(this, charId, startOpts);

      // 若跳过了本命法相弹窗（如指定跳难且 skipAspectModal），直接触发出征过场
      if (this.modal !== 'ASPECT_PICK' && !hasDebugPreviewParam()) {
        this._triggerRunDepartureCutscene();
      }
    };

    GameApp.prototype._triggerRunDepartureCutscene = function () {
      if (this._runStartLinePlayed || !this.player) return;
      this._runStartLinePlayed = true;
      const cs = getCS(this);
      const lineInfo = DialogueBank.drawRunStartDialogue(this.saveData, {
        charId: this.player.id,
        aspectId: this.player.starterAspect ? this.player.starterAspect.id : undefined,
        regionId: this.level && this.level.region ? this.level.region.id : undefined,
        mutatorId: this.runBlueprint && this.runBlueprint.worldMutator ? this.runBlueprint.worldMutator.id : undefined
      });
      this.persistSave();
      cs.startRunIntro(lineInfo);
    };

    // 3. 选完开局本命法相后，衔接角色专属破风出征过场动画！
    if (GameApp.prototype.applyStarterAspect) {
      const prevApplyStarterAspect = GameApp.prototype.applyStarterAspect;
      GameApp.prototype.applyStarterAspect = function (aspectDef, isBlindBox) {
        prevApplyStarterAspect.call(this, aspectDef, isBlindBox);
        if (!hasDebugPreviewParam()) {
          this._triggerRunDepartureCutscene();
        }
      };
    }

    // 4. 踏入第 2~4 劫秘境时，触发零阻塞【地域感叹 / 师徒隔空传音双人小剧场】！
    const prevEnterStage = GameApp.prototype.enterStage;
    GameApp.prototype.enterStage = function (stageIndex, loopCount, stageOpts) {
      prevEnterStage.call(this, stageIndex, loopCount, stageOpts);
      const actIdx = typeof this.currentActIndex === 'number' ? this.currentActIndex : stageIndex;
      if (actIdx >= 1 && this.player && this.level && !hasDebugPreviewParam()) {
        const cs = getCS(this);
        const banter = DialogueBank.drawStageBanter(this.saveData, {
          charId: this.player.id,
          regionId: this.level.region ? this.level.region.id : undefined,
          mutatorId: this.runBlueprint && this.runBlueprint.worldMutator ? this.runBlueprint.worldMutator.id : undefined
        });
        this.persistSave();
        cs.pushLiveBanter(banter);
      }
    };

    // 5. 西游因果奇遇结算 & 3/6/9卷天书质变觉醒时，触发专属角色传音回响！
    if (GameApp.prototype.resolveKarmicEvent) {
      const prevResolveEvent = GameApp.prototype.resolveKarmicEvent;
      GameApp.prototype.resolveKarmicEvent = function (pickKey) {
        const ev = this.activeEventDef;
        prevResolveEvent.call(this, pickKey);
        if (ev && this.player) {
          const banter = DialogueBank.drawStageBanter(this.saveData, {
            charId: this.player.id,
            eventId: ev.id
          });
          this.persistSave();
          getCS(this).pushLiveBanter({
            kind: 'solo',
            badge: `✨ 奇遇回响`,
            lines: banter.lines
          });
        }
      };
    }

    const prevApplyScrollChoice = GameApp.prototype.applyScrollChoice;
    GameApp.prototype.applyScrollChoice = function (scrollId) {
      const prevLv = this.player ? this.player.scrolls[scrollId] : 1;
      prevApplyScrollChoice.call(this, scrollId);
      if (!this.player) return;
      const newLv = this.player.scrolls[scrollId];
      if (scrollId === this.player.charDef.affinity && (newLv === 3 || newLv === 6 || newLv === 9) && newLv !== prevLv) {
        const banter = DialogueBank.drawStageBanter(this.saveData, {
          charId: this.player.id,
          bpCount: newLv
        });
        this.persistSave();
        getCS(this).pushLiveBanter({
          kind: 'solo',
          badge: `🌟 ${newLv}卷觉醒`,
          lines: banter.lines
        });
      }
    };

    // 6. 观音甘露逆天复活神迹过场钩子
    const prevReviveFromAd = Player.prototype.reviveFromAd;
    Player.prototype.reviveFromAd = function (effects, enemies, onHitEnemy) {
      prevReviveFromAd.call(this, effects, enemies, onHitEnemy);
      const app = this._appRef || (typeof globalThis !== 'undefined' && globalThis.__xiyouGame);
      if (app && app.saveData) {
        app._revivedThisRun = true;
        const revLine = DialogueBank.drawReviveDialogue(app.saveData, { charId: this.id });
        app.persistSave();
        getCS(app).startReviveMiracle(revLine);
      }
    };

    // 7. 单局结算（通关圆满 / 兵解轮回）终章过场钩子
    const prevFinishRun = GameApp.prototype.finishRun;
    GameApp.prototype.finishRun = function (victory) {
      prevFinishRun.call(this, victory);
      if (!this.player || !this.runSummary) return;

      const endLine = DialogueBank.drawRunEndingDialogue(this.saveData, {
        charId: this.player.id,
        victory: !!victory,
        revived: !!this._revivedThisRun,
        stageName: this.level && this.level.biome ? this.level.biome.name : '',
        tribNo: this.level ? this.level.tribulationNo : null
      });
      this.runSummary.epilogueLine = endLine;
      this.persistSave();

      if (!hasDebugPreviewParam()) {
        getCS(this).startRunEnding(endLine, () => {
          this.modal = 'RUN_OVER';
        });
      }
    };

    // 8. 主循环钩子：对接返回键跳过、监测 Boss 激活交锋、Boss 伏诛收兵判词与推进过场时间轴
    const prevTick = GameApp.prototype.tick;
    GameApp.prototype.tick = function (dt) {
      const cs = getCS(this);

      // 延迟绑定 systemOptimizer 的返回键路由：过场播放中按返回/Esc直接跳过过场，不误开退出弹窗！
      if (this.handleBackNavigation && !this._cutsceneBackWrapped) {
        this._cutsceneBackWrapped = true;
        const origHandleBack = this.handleBackNavigation;
        this.handleBackNavigation = function (source) {
          const activeCs = getCS(this);
          if (activeCs.active && !DouyinSDK.mockAdState.active) {
            activeCs.skipAll();
            return true;
          }
          return origHandleBack.call(this, source);
        };
      }

      // 若外部系统强行切换了 modal（如切后台呼出 RETURN_CONFIRM），保持状态同步
      if (
        cs.active &&
        this.modal !== 'CUTSCENE_ACTIVE' &&
        this.modal !== 'PROLOGUE_CUTSCENE' &&
        this.modal !== 'RETURN_CONFIRM'
      ) {
        cs.active = null;
      }

      if (!DouyinSDK.mockAdState.active && this.modal !== 'RETURN_CONFIRM') {
        cs.update(dt);
      }

      prevTick.call(this, dt);

      if (this.state !== 'PLAYING' || !this.player || !this.level) return;

      // 监测守关妖王苏醒 -> 触发宽银幕交锋过场！
      const boss = this.bossEntity;
      if (boss && boss.activated && !boss.dead && !boss._cutsceneTriggered && !this.modal) {
        boss._cutsceneTriggered = true;
        if (!hasDebugPreviewParam()) {
          // 清除场中残留敌方飞行物，防止过场前后黑枪伤人
          if (this.effects && Array.isArray(this.effects.projectiles)) {
            this.effects.projectiles = this.effects.projectiles.filter((p) => p.owner === 'player');
          }
          const clashData = DialogueBank.drawBossClashDialogue(this.saveData, {
            charId: this.player.id,
            tribNo: this.level.tribulationNo,
            bossId: boss.typeId,
            bossName: boss.name
          });
          this.persistSave();
          cs.startBossIntro(clashData, boss);
        }
      }

      // 监测妖王伏诛 -> 弹出非阻塞【诛邪朱砂判词】！
      if (boss && boss.dead && boss.activated && !boss._killLineTriggered) {
        boss._killLineTriggered = true;
        const killLine = DialogueBank.drawBossKillDialogue(this.saveData, {
          charId: this.player.id
        });
        this.persistSave();
        cs.pushLiveBanter({
          kind: 'solo',
          badge: `🎉 妖王伏诛`,
          isKillSeal: true,
          sealText: killLine.seal || '破劫',
          lines: [killLine]
        });
      }
    };

    // 9. 键盘快捷键支持：过场期间按 Space / Enter / J 推进，按 Esc 跳过！
    const prevBindInputs = GameApp.prototype.bindInputs;
    GameApp.prototype.bindInputs = function () {
      prevBindInputs.call(this);
      if (typeof window !== 'undefined' && !this._cutsceneKeyBound) {
        this._cutsceneKeyBound = true;
        window.addEventListener('keydown', (ev) => {
          if (DouyinSDK.mockAdState.active) return;
          const cs = getCS(this);
          if (!cs.active) return;
          if (ev.code === 'Escape') {
            ev.preventDefault();
            cs.skipAll();
          } else if (ev.code === 'Space' || ev.code === 'Enter' || ev.code === 'KeyJ') {
            ev.preventDefault();
            cs.advanceOrCompleteBeat();
          }
        });
      }
    };

    // 10. 渲染层注入：像素世界层特效 + 主界面【🎬序章】入口 + 战斗过场层 + 结算卡铭文
    const prevRenderPixelWorld = GameApp.prototype.renderPixelWorld;
    GameApp.prototype.renderPixelWorld = function (wctx) {
      prevRenderPixelWorld.call(this, wctx);
      getCS(this).renderWorldOverlay(wctx);
    };

    const prevRenderTitleScreen = UIManager.prototype.renderTitleScreen;
    UIManager.prototype.renderTitleScreen = function (ctx, sw, sh, app) {
      prevRenderTitleScreen.call(this, ctx, sw, sh, app);
      const cs = getCS(app);

      if (app.modal === 'PROLOGUE_CUTSCENE' && cs.active) {
        cs.renderUIOverlay(ctx, sw, sh);
        this.renderToast(ctx, sw, sh, true);
        return;
      }

      if (app.modal || DouyinSDK.mockAdState.active) return;

      // 在主界面零冲突位置挂载【🎬 序章】重播入口：
      // 1) 左上角「破劫 · 西游破劫录」主牌匾热区全分辨率可点重温序章；
      // 2) 宽屏顶栏（试穿按钮右侧空白区）或底部船坞（炼器坊左侧空白区）展示立体国风【🎬 序章】令牌！
      const safePad = Math.max(18, Math.round(sw * 0.025));
      this.addButton('btn_logo_prologue', safePad, 8, 154, 32, () => {
        cs.startPrologue();
      });

      const topTryEnd = safePad + 324;
      const topRightBtnsStart = sw - safePad - 596;
      if (topRightBtnsStart - topTryEnd >= 82) {
        const bx = topTryEnd + 6;
        const bw = 76;
        if (UITheme && UITheme.drawOrnateButton) {
          UITheme.drawOrnateButton(
            ctx,
            bx,
            9,
            bw,
            29,
            '🎬 序章',
            this.getBtnVisualState
              ? this.getBtnVisualState(bx, 9, bw, 29, { variant: 'crimson', studs: false, fontSize: 11 })
              : { variant: 'crimson', studs: false, fontSize: 11 }
          );
        } else {
          drawPixelPanel(ctx, bx, 9, bw, 29, '#2a1836', '#ffd166', 4);
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ffd166';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('🎬 序章', bx + bw / 2, 28);
        }
        this.addButton('btn_replay_prologue', bx, 9, bw, 29, () => {
          cs.startPrologue();
        });
      } else {
        // 中窄横屏：放在底部点将台【⚒ 炼器坊(64)】左侧船坞空位
        const cardTop = 53;
        const cardH = Math.max(194, sh - 120);
        const footY = cardTop + cardH + 7;
        const startBtnW = Math.min(220, Math.round(sw * 0.28));
        const startBtnH = Math.max(40, Math.min(48, sh - footY - 7));
        const startX = sw - safePad - startBtnW - 4;
        const forgeX = startX - 102 - 8 - 136 - 8 - 112 - 8;
        const proW = 74;
        const proH = Math.max(34, startBtnH - 6);
        const proY = footY + Math.round((startBtnH - proH) / 2);
        const proX = forgeX - proW - 8;
        if (proX > safePad + 160) {
          if (UITheme && UITheme.drawOrnateButton) {
            UITheme.drawOrnateButton(
              ctx,
              proX,
              proY,
              proW,
              proH,
              '🎬 序章',
              this.getBtnVisualState
                ? this.getBtnVisualState(proX, proY, proW, proH, { variant: 'crimson', studs: false, fontSize: 11 })
                : { variant: 'crimson', studs: false, fontSize: 11 }
            );
          } else {
            drawPixelPanel(ctx, proX, proY, proW, proH, '#2a1836', '#ffd166', 4);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffd166';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText('🎬 序章', proX + proW / 2, proY + proH / 2 + 4);
          }
          this.addButton('btn_replay_prologue_dock', proX, proY, proW, proH, () => {
            cs.startPrologue();
          });
        }
      }
    };

    const prevRenderCombatUI = UIManager.prototype.renderCombatUI;
    UIManager.prototype.renderCombatUI = function (ctx, sw, sh, app) {
      prevRenderCombatUI.call(this, ctx, sw, sh, app);
      if (DouyinSDK.mockAdState.active || app.modal === 'RETURN_CONFIRM') return;
      const cs = getCS(app);
      cs.renderUIOverlay(ctx, sw, sh);
      if (cs.active) {
        this.renderToast(ctx, sw, sh, true);
      }
    };

    // 在单局结算面板 (RUN_OVER) 三才修为条 (my+182) 与底部按钮 (my+mh-56) 之间的留白处铭刻角色结语！
    const prevRenderRunOverModal = UIManager.prototype.renderRunOverModal;
    UIManager.prototype.renderRunOverModal = function (ctx, sw, sh, app) {
      prevRenderRunOverModal.call(this, ctx, sw, sh, app);
      const summary = app.runSummary;
      if (!summary || !summary.epilogueLine) return;

      const mw = Math.min(492, sw - 32);
      const mh = Math.min(302, sh - 24);
      const mx = Math.round((sw - mw) / 2);
      const my = Math.round((sh - mh) / 2);

      const qX = mx + 18;
      const qY = my + 188;
      const qW = mw - 36;
      const btnTop = my + mh - 56;
      const qH = Math.min(50, btnTop - qY - 6);
      if (qH < 34) return;
      drawPixelPanel(ctx, qX, qY, qW, qH, 'rgba(26, 20, 42, 0.94)', summary.epilogueLine.themeColor || '#ffd166', 4);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#f8f9fa';
      ctx.font = '11.5px sans-serif';
      const quoteStr = `💬 ${summary.epilogueLine.speakerName}：“${summary.epilogueLine.text}”`;
      const lines = wrapCnLines(ctx, quoteStr, qW - 20);
      const maxLn = qH >= 44 ? 2 : 1;
      lines.slice(0, maxLn).forEach((ln, idx) => {
        ctx.fillText(ln, qX + 10, qY + 18 + idx * 16);
      });
    };
  }

  installCutsceneDirector();

  return {
    CutsceneController,
    installCutsceneDirector
  };
});
