/**
 * 强打击感多声道 16-Bit 合成音效引擎 (src/audio/soundFX.js)
 * 跨端系统优化版：
 * 1. 全面兼容抖音 (`tt`)、微信 (`wx`)、iOS (含静音键/来电中断恢复 `interrupted`)、Android 与 Web
 * 2. 预烘焙噪波缓冲池 (Noise Buffer Pool)，彻底消除高频连斩时的逐帧 AudioBuffer 内存分配与 GC 卡顿
 * 3. 多声道并发限流 (Polyphony Limiter) 与同帧去重节流，杜绝手机扬声器群怪暴击破音
 * 4. 切入后台自动挂起音频、回到前台自动恢复（满足微信/抖音小游戏提审规范）
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
})('soundFX', function (require) {
  let Env = null;
  try {
    Env = require('../platform/env');
  } catch (e) {
    Env = null;
  }

  const MUTE_STORAGE_KEY = 'xiyou_audio_muted_v1';
  const MAX_CONCURRENT_VOICES = 14;

  let _ctx = null;
  let _muted = Env && Env.getStorage ? !!Env.getStorage(MUTE_STORAGE_KEY, false) : false;
  let _suspendedByBg = false;
  let _interruptionBound = false;
  let _noisePool = null;
  let _activeVoices = 0;
  const _lastPlayTs = {};

  function bindPlatformAudioLifecycle() {
    if (_interruptionBound) return;
    _interruptionBound = true;

    const api =
      (typeof tt !== 'undefined' && tt) ||
      (typeof wx !== 'undefined' && wx) ||
      null;

    if (api) {
      // iOS 微信小游戏允许突破侧边静音拨片正常播放游戏音效（游戏内静音按钮仍可随时关闭）
      if (typeof api.setInnerAudioOption === 'function') {
        try {
          api.setInnerAudioOption({ obeyMuteSwitch: false, mixWithOther: true });
        } catch (e) {}
      }
      if (typeof api.onAudioInterruptionBegin === 'function') {
        try {
          api.onAudioInterruptionBegin(() => {
            _suspendedByBg = true;
          });
        } catch (e) {}
      }
      if (typeof api.onAudioInterruptionEnd === 'function') {
        try {
          api.onAudioInterruptionEnd(() => {
            _suspendedByBg = false;
            unlockAudio();
          });
        } catch (e) {}
      }
      if (typeof api.onHide === 'function') {
        try {
          api.onHide(() => suspendAudio());
        } catch (e) {}
      }
      if (typeof api.onShow === 'function') {
        try {
          api.onShow(() => resumeAudio());
        } catch (e) {}
      }
    }

    // 微信内置 H5 浏览器 WeixinJSBridge 自动解锁音频
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener(
        'WeixinJSBridgeReady',
        () => {
          unlockAudio();
        },
        false
      );
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          suspendAudio();
        } else {
          resumeAudio();
        }
      });
    }
  }

  function buildNoisePool(ctx) {
    if (!ctx || typeof ctx.createBuffer !== 'function') return null;
    try {
      const sr = ctx.sampleRate || 22050;
      const bake = (durSec) => {
        const len = Math.max(64, Math.floor(sr * durSec));
        const buf = ctx.createBuffer(1, len, sr);
        const ch = buf.getChannelData(0);
        for (let i = 0; i < len; i++) {
          ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.35);
        }
        return buf;
      };
      return {
        short: bake(0.065),
        mid: bake(0.125),
        long: bake(0.24)
      };
    } catch (e) {
      return null;
    }
  }

  function ensureCtx() {
    bindPlatformAudioLifecycle();
    if (_muted || _suspendedByBg) return null;

    if (_ctx) {
      if ((_ctx.state === 'suspended' || _ctx.state === 'interrupted') && typeof _ctx.resume === 'function') {
        try {
          const p = _ctx.resume();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        } catch (e) {}
      }
      return _ctx;
    }

    try {
      if (typeof tt !== 'undefined' && typeof tt.createWebAudioContext === 'function') {
        _ctx = tt.createWebAudioContext();
      } else if (typeof wx !== 'undefined' && typeof wx.createWebAudioContext === 'function') {
        _ctx = wx.createWebAudioContext();
      } else if (typeof window !== 'undefined') {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) _ctx = new AC();
      }
      if (_ctx) {
        _noisePool = buildNoisePool(_ctx);
      }
    } catch (e) {
      _ctx = null;
    }
    return _ctx;
  }

  function unlockAudio() {
    _suspendedByBg = false;
    const ctx = ensureCtx();
    if (!ctx) return;
    if ((ctx.state === 'suspended' || ctx.state === 'interrupted') && typeof ctx.resume === 'function') {
      try {
        const p = ctx.resume();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (e) {}
    }
    // iOS Safari / WKWebView 首次触摸播放 1 帧极静音脉冲以彻底唤醒硬件音频通道
    try {
      if (ctx.createBuffer && ctx.createBufferSource) {
        const silentBuf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = silentBuf;
        src.connect(ctx.destination);
        src.start(0);
      }
    } catch (e) {}
  }

  function suspendAudio() {
    _suspendedByBg = true;
    if (_ctx && _ctx.state === 'running' && typeof _ctx.suspend === 'function') {
      try {
        const p = _ctx.suspend();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (e) {}
    }
  }

  function resumeAudio() {
    _suspendedByBg = false;
    if (_muted || !_ctx) return;
    if ((_ctx.state === 'suspended' || _ctx.state === 'interrupted') && typeof _ctx.resume === 'function') {
      try {
        const p = _ctx.resume();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (e) {}
    }
  }

  function acquireVoiceSlot(durationSec) {
    if (_activeVoices >= MAX_CONCURRENT_VOICES) return false;
    _activeVoices++;
    const releaseMs = Math.max(30, Math.min(800, Math.round((durationSec || 0.1) * 1000 + 25)));
    setTimeout(() => {
      _activeVoices = Math.max(0, _activeVoices - 1);
    }, releaseMs);
    return true;
  }

  function playTone(type, freqStart, freqEnd, duration, gainVal, delaySec) {
    const ctx = ensureCtx();
    if (!ctx) return;
    if (!acquireVoiceSlot((delaySec || 0) + duration)) return;
    try {
      const now = ctx.currentTime + (delaySec || 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(Math.max(24, freqStart), now);
      if (freqEnd && freqEnd !== freqStart) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(24, freqEnd), now + duration);
      }
      gain.gain.setValueAtTime(gainVal || 0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.01);
    } catch (e) {}
  }

  function playNoise(duration, gainVal, filterFreq) {
    const ctx = ensureCtx();
    if (!ctx) return;
    if (!acquireVoiceSlot(duration)) return;
    try {
      if (!_noisePool) {
        _noisePool = buildNoisePool(ctx);
      }
      let buffer = null;
      if (_noisePool) {
        buffer = duration <= 0.075 ? _noisePool.short : duration <= 0.145 ? _noisePool.mid : _noisePool.long;
      }
      if (!buffer) {
        const sampleRate = ctx.sampleRate || 22050;
        const bufferSize = Math.max(64, Math.floor(sampleRate * duration));
        buffer = ctx.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.4);
        }
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(gainVal || 0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      if (filterFreq && typeof ctx.createBiquadFilter === 'function') {
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = filterFreq;
        noise.connect(filter);
        filter.connect(gain);
      } else {
        noise.connect(gain);
      }
      gain.connect(ctx.destination);
      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + duration + 0.01);
    } catch (e) {}
  }

  function play(sfxName) {
    if (_muted || _suspendedByBg) return;

    // 同帧高频同类音效微节流（防止 AOE 同时命中 8 只怪导致手机扬声器削波爆音）
    const nowMs = Date.now();
    const minGap = sfxName === 'uiClick' || sfxName === 'uiWarn' || sfxName === 'uiBack' ? 12 : 24;
    if (_lastPlayTs[sfxName] && nowMs - _lastPlayTs[sfxName] < minGap) {
      return;
    }
    _lastPlayTs[sfxName] = nowMs;

    switch (sfxName) {
      case 'jump':
        playTone('triangle', 190, 460, 0.09, 0.09);
        break;
      case 'doubleJump':
        playTone('triangle', 320, 720, 0.11, 0.1);
        playNoise(0.05, 0.05, 1800);
        break;
      case 'roll':
        playNoise(0.11, 0.09, 950);
        playTone('sine', 290, 95, 0.11, 0.09);
        break;
      case 'slash1':
        playNoise(0.07, 0.11, 1600);
        playTone('sawtooth', 420, 130, 0.08, 0.09);
        break;
      case 'slash2':
        playNoise(0.08, 0.13, 1950);
        playTone('sawtooth', 540, 155, 0.085, 0.1);
        break;
      case 'slash3':
        playNoise(0.09, 0.14, 1500);
        playTone('sawtooth', 460, 120, 0.1, 0.11);
        playTone('triangle', 260, 95, 0.1, 0.1);
        break;
      case 'slash4':
        playNoise(0.11, 0.15, 2100);
        playTone('sawtooth', 610, 170, 0.11, 0.12);
        playTone('sine', 210, 68, 0.11, 0.13);
        break;
      case 'slash5':
        playNoise(0.16, 0.19, 1050);
        playTone('sawtooth', 330, 56, 0.19, 0.16);
        playTone('sine', 165, 38, 0.21, 0.22);
        playTone('triangle', 740, 290, 0.12, 0.09, 0.02);
        break;
      case 'flurry':
        playNoise(0.055, 0.11, 2400);
        playTone('triangle', 640, 240, 0.06, 0.09);
        break;
      case 'deriveCast':
        playTone('sine', 185, 46, 0.16, 0.22);
        playTone('triangle', 780, 1420, 0.1, 0.14);
        playTone('square', 520, 980, 0.12, 0.09, 0.03);
        playNoise(0.09, 0.14, 2100);
        break;
      case 'thunderStrike':
        playTone('sine', 140, 34, 0.22, 0.26);
        playTone('sawtooth', 920, 110, 0.18, 0.16);
        playNoise(0.19, 0.22, 1350);
        break;
      case 'hit':
        playTone('sine', 165, 44, 0.1, 0.2);
        playTone('square', 220, 75, 0.07, 0.11);
        playNoise(0.055, 0.14, 1400);
        break;
      case 'crit':
        playTone('sine', 195, 38, 0.15, 0.25);
        playTone('square', 680, 1180, 0.08, 0.12);
        playTone('sawtooth', 340, 82, 0.14, 0.14, 0.02);
        playNoise(0.09, 0.18, 2200);
        break;
      case 'killBlow':
        playTone('sine', 180, 32, 0.22, 0.28);
        playTone('sawtooth', 480, 90, 0.18, 0.15);
        playTone('triangle', 880, 1320, 0.12, 0.11, 0.03);
        playNoise(0.15, 0.2, 1200);
        break;
      case 'wallSplat':
        playTone('sine', 140, 35, 0.19, 0.26);
        playNoise(0.14, 0.2, 750);
        break;
      case 'shieldBlock':
        playTone('triangle', 920, 520, 0.09, 0.14);
        playTone('square', 1380, 860, 0.07, 0.09, 0.02);
        break;
      case 'parry':
        playTone('triangle', 1080, 1760, 0.12, 0.16);
        playTone('square', 780, 1380, 0.09, 0.11, 0.015);
        playNoise(0.05, 0.12, 2800);
        break;
      case 'thunder':
        playNoise(0.13, 0.18, 2500);
        playTone('sawtooth', 320, 52, 0.16, 0.15);
        playTone('square', 920, 410, 0.07, 0.1);
        break;
      case 'flame':
        playNoise(0.18, 0.18, 560);
        playTone('sine', 155, 62, 0.18, 0.16);
        break;
      case 'frost':
        playTone('sine', 1180, 1720, 0.09, 0.1);
        playTone('triangle', 1560, 960, 0.11, 0.09, 0.03);
        break;
      case 'armorBreak':
        playTone('sawtooth', 220, 48, 0.16, 0.19);
        playTone('square', 640, 260, 0.09, 0.12, 0.02);
        playNoise(0.11, 0.17, 1450);
        break;
      case 'slam':
        playTone('sine', 150, 28, 0.28, 0.3);
        playTone('sawtooth', 180, 40, 0.24, 0.18);
        playNoise(0.22, 0.24, 650);
        break;
      case 'skill':
        playTone('sine', 160, 48, 0.18, 0.2);
        playTone('triangle', 340, 820, 0.16, 0.13);
        playTone('square', 520, 1040, 0.18, 0.1, 0.05);
        break;
      case 'hurt':
        playNoise(0.12, 0.16, 900);
        playTone('sawtooth', 220, 68, 0.17, 0.16);
        break;
      case 'pickup':
        playTone('square', 680, 1020, 0.07, 0.07);
        break;
      case 'scroll':
        playTone('triangle', 440, 660, 0.12, 0.1);
        playTone('triangle', 660, 880, 0.16, 0.1, 0.1);
        playTone('triangle', 880, 1180, 0.22, 0.12, 0.2);
        break;
      case 'heal':
        playTone('sine', 420, 640, 0.15, 0.11);
        playTone('sine', 640, 860, 0.2, 0.11, 0.12);
        break;
      case 'revive':
        playTone('triangle', 392, 523, 0.16, 0.13);
        playTone('triangle', 523, 659, 0.16, 0.13, 0.12);
        playTone('triangle', 659, 1046, 0.35, 0.15, 0.24);
        break;
      case 'bossAlert':
        playTone('sawtooth', 150, 98, 0.26, 0.16);
        playTone('sawtooth', 135, 76, 0.34, 0.18, 0.26);
        break;
      case 'uiClick':
        playTone('square', 540, 720, 0.045, 0.06);
        break;
      case 'uiWarn':
        // 二次确认防误触提示音（双短磬音）
        playTone('triangle', 620, 520, 0.07, 0.09);
        playTone('triangle', 740, 640, 0.08, 0.09, 0.08);
        break;
      case 'uiBack':
        playTone('sine', 520, 340, 0.08, 0.08);
        break;
      default:
        break;
    }
  }

  return {
    play,
    unlockAudio,
    suspendAudio,
    resumeAudio,
    isMuted: () => _muted,
    toggleMute: () => {
      _muted = !_muted;
      if (Env && Env.setStorage) {
        Env.setStorage(MUTE_STORAGE_KEY, _muted);
      }
      if (!_muted) unlockAudio();
      return _muted;
    }
  };
});
