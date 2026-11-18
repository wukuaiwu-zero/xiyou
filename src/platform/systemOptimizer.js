/**
 * 跨端系统优化与返回键「二次提醒防误触」总控模块 (src/platform/systemOptimizer.js)
 *
 * 核心职责：
 * 1. 【返回键防敏感 & 全局二次提醒确认】：
 *    - 拦截 Android 物理返回键、iOS/Android 全面屏边缘侧滑返回 (History Trap)、微信/抖音宿主返回与键盘 Esc
 *    - 内置 400ms 硬件/侧滑防抖去重（彻底解决一次侧滑触发两次返回事件导致瞬间退出的痛点）
 *    - 战斗中点击右上角「返回营地」或按返回键 -> 呼出【暂停 · 返回营地二次确认】国风弹窗，绝不单次误触丢档
 *    - 主界面按返回键、死亡界面点「放弃复活」、看广告点「中途退出」、装备对比按返回键 -> 均需二次提醒确认
 *    - 弹窗刚弹出 0.34s 防连点保护窗，杜绝激战连按普攻时误点刚弹出的结算/放弃按钮
 * 2. 【Android / iOS / 微信小程序 / 抖音小程序 UI 安全区与胶囊自适应】：
 *    - 自动避让 iPhone 刘海/灵动岛/Home条、Android 挖孔屏与全面屏手势边缘
 *    - 自动避让微信小游戏 (`wx`) 与抖音小游戏 (`tt`) 右上角官方胶囊按钮 (`··· | ⊗`)，且保持右手战斗按键贴合拇指弧线
 *    - 窄屏手机 (<760px) 自动等比缩放 UI 视口，彻底消除主界面顶栏按钮重叠
 * 3. 【移动端系统稳帧、后台安全暂停与内存保护】：
 *    - 支持「自动稳帧 / 高清画质 / 省电流畅」三档动态调节，掉帧或收到内存告警 (`onMemoryWarning`) 时自动裁剪瞬态粒子预算
 *    - 切后台回消息/接电话时自动清空卡死按键并安全呼出暂停面板，回到前台零暴毙
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
})('systemOptimizer', function (require) {
  const SDK_CONFIG = require('../config/sdkConfig');
  const Env = require('../platform/env');
  const DouyinSDK = require('../sdk/douyinSDK');
  const SoundFX = require('../audio/soundFX');
  const { GameApp } = require('../core/gameApp');
  const { UIManager, drawPixelPanel } = require('../ui/hudAndModals');
  const { EffectsManager } = require('../entities/effects');

  let UITheme = null;
  try {
    UITheme = require('../ui/uiTheme');
  } catch (e) {
    UITheme = null;
  }

  const QUALITY_STORAGE_KEY = 'xiyou_quality_mode_v1';
  const QUALITY_MODES = [
    { id: 'auto', label: '自动稳帧', dprCap: 0, particleCap: 130, debrisCap: 48, afterimageCap: 14 },
    { id: 'high', label: '高清画质', dprCap: 2.25, particleCap: 210, debrisCap: 72, afterimageCap: 22 },
    { id: 'smooth', label: '省电流畅', dprCap: 1.4, particleCap: 70, debrisCap: 24, afterimageCap: 7 }
  ];

  function getGuardCfg() {
    return Object.assign(
      {
        enableDoubleConfirm: true,
        doublePressWindowSec: 2.8,
        antiJitterDebounceMs: 400,
        modalOpenProtectSec: 0.34,
        edgeSwipeGuardPx: 28,
        pauseOnBackground: true
      },
      (SDK_CONFIG && SDK_CONFIG.backGuard) || {}
    );
  }

  function installSystemOptimizer() {
    if (GameApp.__systemOptimizerInstalled) return;
    GameApp.__systemOptimizerInstalled = true;

    let _activeApp = null;
    let _qualityModeId = Env.getStorage(
      QUALITY_STORAGE_KEY,
      (SDK_CONFIG.performance && SDK_CONFIG.performance.defaultQualityMode) || 'auto'
    );
    if (!QUALITY_MODES.some((q) => q.id === _qualityModeId)) {
      _qualityModeId = 'auto';
    }

    // 帧率监测与自动降载状态
    let _emaDt = 1 / 60;
    let _autoThrottleLevel = 0; // 0: 满血, 1: 轻度节流, 2: 强力稳帧
    let _lowFpsAccumSec = 0;
    let _highFpsAccumSec = 0;

    // 返回键与 UI 二次确认状态机
    let _lastBackSignalMs = 0;
    let _lastUiTapMs = 0;
    let _pendingBackKey = '';
    let _pendingBackExpireMs = 0;
    let _pendingUiBtnId = '';
    let _pendingUiBtnExpireMs = 0;

    // 弹窗切换防连点保护
    let _observedModal = null;
    let _modalProtectTimer = 0;
    let _returnConfirmReason = 'manual'; // 'hud_home' | 'back_key' | 'auto_pause' | 'choice_pause'
    let _underlyingChoiceModal = null;

    function getQualityDef() {
      return QUALITY_MODES.find((q) => q.id === _qualityModeId) || QUALITY_MODES[0];
    }

    function applyQualityDpr(app) {
      const q = getQualityDef();
      if (q.id === 'auto') {
        if (_autoThrottleLevel >= 2) {
          Env.setDprCap(1.35);
        } else if (_autoThrottleLevel === 1) {
          Env.setDprCap(1.65);
        } else {
          Env.setDprCap(0);
        }
      } else {
        Env.setDprCap(q.dprCap);
      }
      if (app && typeof app.resizeCanvas === 'function') {
        app.resizeCanvas();
      }
    }

    function cycleQualityMode(app) {
      const idx = QUALITY_MODES.findIndex((q) => q.id === _qualityModeId);
      const next = QUALITY_MODES[(idx + 1) % QUALITY_MODES.length];
      _qualityModeId = next.id;
      _autoThrottleLevel = 0;
      _lowFpsAccumSec = 0;
      Env.setStorage(QUALITY_STORAGE_KEY, _qualityModeId);
      applyQualityDpr(app);
      if (app && app.ui) {
        app.ui.showToast(`⚡ 已切换性能模式：【${next.label}】`, 2.2);
      }
    }

    function armSecondaryBack(key, promptMsg, app) {
      const cfg = getGuardCfg();
      const now = Date.now();
      if (_pendingBackKey === key && now <= _pendingBackExpireMs) {
        _pendingBackKey = '';
        _pendingBackExpireMs = 0;
        SoundFX.play('uiBack');
        return true; // 已完成二次确认！
      }
      _pendingBackKey = key;
      _pendingBackExpireMs = now + Math.round(cfg.doublePressWindowSec * 1000);
      SoundFX.play('uiWarn');
      Env.vibrate('light');
      if (app && app.ui) {
        app.ui.showToast(promptMsg, cfg.doublePressWindowSec);
      }
      return false;
    }

    function clearPendingConfirms() {
      _pendingBackKey = '';
      _pendingBackExpireMs = 0;
      _pendingUiBtnId = '';
      _pendingUiBtnExpireMs = 0;
    }

    // =========================================================================
    // 1. UI 视口安全区、微信/抖音右上角胶囊避让与窄屏自适应矩阵
    // =========================================================================
    UIManager.prototype.computeSafeViewport = function (sw, sh) {
      const info = Env.getScreenInfo();
      const insets = info.safeInsets || { left: 0, right: 0, top: 0, bottom: 0 };
      const prof = Env.getDeviceProfile ? Env.getDeviceProfile() : { isMobile: false };
      const edgeGuard = prof.isMobile ? 8 : 0;

      // 左侧避让刘海/灵动岛（扣除 UI 自带的 12px 基础内边距）
      const leftSafeInset = Math.max(edgeGuard, Math.max(0, (insets.left || 0) - 10));
      const rightSafeInset = Math.max(edgeGuard, Math.max(0, (insets.right || 0) - 10));
      const topSafeInset = Math.max(0, (insets.top || 0) - 4);
      const bottomSafeInset = Math.max(0, (insets.bottom || 0) - 6);

      // 微信/抖音小游戏右上角官方胶囊避让宽度
      const capsuleRight = Math.max(0, (info.capsuleAvoidRight || 0) - 8);
      const rightMargin = Math.max(rightSafeInset, capsuleRight);

      const availW = Math.max(320, sw - leftSafeInset - rightMargin);
      const availH = Math.max(220, sh - topSafeInset - bottomSafeInset);

      // 确保主界面 6 枚顶栏令牌与标题绝不在小屏手机上重叠
      const minLogicalW = Env.isBrowser ? 768 : 716;
      const minLogicalH = 360;
      const scale = Math.min(1, availW / minLogicalW, availH / minLogicalH);

      const uiW = Math.round(availW / scale);
      const uiH = Math.round(availH / scale);

      const vp = {
        rawSw: sw,
        rawSh: sh,
        offsetX: leftSafeInset,
        offsetY: topSafeInset,
        rightMargin,
        rightSafeInset,
        bottomMargin: bottomSafeInset,
        availW,
        availH,
        scale,
        uiW,
        uiH,
        hasMargins: leftSafeInset > 0 || rightMargin > 0 || topSafeInset > 0 || bottomSafeInset > 0
      };
      this._activeViewport = vp;
      return vp;
    };

    UIManager.prototype.toUICoord = function (px, py) {
      const vp = this._activeViewport;
      if (!vp) return { x: px, y: py };
      return {
        x: (px - vp.offsetX) / vp.scale,
        y: (py - vp.offsetY) / vp.scale
      };
    };

    function fillOuterMarginsDim(ctx, vp, fillStyle) {
      if (!vp || !vp.hasMargins) return;
      ctx.save();
      ctx.fillStyle = fillStyle || 'rgba(6, 5, 14, 0.86)';
      if (vp.offsetY > 0) {
        ctx.fillRect(0, 0, vp.rawSw, vp.offsetY);
      }
      const botY = vp.offsetY + vp.availH;
      if (botY < vp.rawSh) {
        ctx.fillRect(0, botY, vp.rawSw, vp.rawSh - botY);
      }
      if (vp.offsetX > 0) {
        ctx.fillRect(0, vp.offsetY, vp.offsetX, vp.availH);
      }
      const rightX = vp.offsetX + vp.availW;
      if (rightX < vp.rawSw) {
        ctx.fillRect(rightX, vp.offsetY, vp.rawSw - rightX, vp.availH);
      }
      ctx.restore();
    }

    // 保持右手战斗虚拟圆钮贴合真实物理右侧安全边（不随顶部小程序胶囊左移过远），同时左侧摇杆避开系统侧滑返回热区
    const origGetTouchLayout = UIManager.prototype.getTouchLayout;
    UIManager.prototype.getTouchLayout = function (sw, sh) {
      const vp = this._activeViewport;
      let effectiveW = sw;
      if (vp && vp.rightMargin > vp.rightSafeInset) {
        effectiveW = sw + Math.round((vp.rightMargin - vp.rightSafeInset) / vp.scale);
      }
      const layout = origGetTouchLayout.call(this, effectiveW, sh);
      const cfg = getGuardCfg();
      const minJoyX = Math.max(layout.joy.x, (cfg.edgeSwipeGuardPx || 28) + 64);
      layout.joy.x = minJoyX;
      return layout;
    };

    // 动态跟随摇杆生成点同样避开左侧系统侧滑返回边缘热区
    const origHandleCombatTouchStart = UIManager.prototype.handleCombatTouchStart;
    UIManager.prototype.handleCombatTouchStart = function (changedTouches, sw, sh, actionCallbacks) {
      const vp = this.computeSafeViewport(sw, sh);
      const cfg = getGuardCfg();
      const mapped = [];
      for (let i = 0; i < (changedTouches || []).length; i++) {
        const t = changedTouches[i];
        const p = this.toUICoord(t.x, t.y);
        mapped.push({ id: t.id, x: p.x, y: p.y });
      }
      origHandleCombatTouchStart.call(this, mapped, vp.uiW, vp.uiH, actionCallbacks);
      if (this.joyTouchId !== null && this.joyCenter) {
        const safeMinX = Math.max(76, (cfg.edgeSwipeGuardPx || 28) + 52);
        if (this.joyCenter.x < safeMinX) {
          this.joyCenter.x = safeMinX;
        }
      }
    };

    const origHandleCombatTouchMove = UIManager.prototype.handleCombatTouchMove;
    UIManager.prototype.handleCombatTouchMove = function (changedTouches) {
      const mapped = [];
      for (let i = 0; i < (changedTouches || []).length; i++) {
        const t = changedTouches[i];
        const p = this.toUICoord(t.x, t.y);
        mapped.push({ id: t.id, x: p.x, y: p.y });
      }
      return origHandleCombatTouchMove.call(this, mapped);
    };

    const origHandlePointerMove = UIManager.prototype.handlePointerMove;
    if (origHandlePointerMove) {
      UIManager.prototype.handlePointerMove = function (px, py) {
        const p = this.toUICoord(px, py);
        return origHandlePointerMove.call(this, p.x, p.y);
      };
    }

    const origHandlePointerDown = UIManager.prototype.handlePointerDown;
    if (origHandlePointerDown) {
      UIManager.prototype.handlePointerDown = function (px, py) {
        const p = this.toUICoord(px, py);
        return origHandlePointerDown.call(this, p.x, p.y);
      };
    }

    // =========================================================================
    // 2. 按钮级防误触拦截与二次提醒包装 (hud_home / btn_give_up / mock_ad_skip / 战斗中途切图)
    // =========================================================================
    const origAddButton = UIManager.prototype.addButton;
    UIManager.prototype.addButton = function (id, x, y, w, h, onClick, meta) {
      let wrappedClick = onClick;
      const cfg = getGuardCfg();

      if (cfg.enableDoubleConfirm && typeof onClick === 'function') {
        if (id === 'hud_home') {
          // 右上角【返回营地】按钮：绝不单次直接退回标题，必须打开暂停与二次确认面板！
          wrappedClick = () => {
            if (_activeApp) {
              _activeApp.openReturnConfirmModal('hud_home');
            }
          };
        } else if (id === 'btn_give_up') {
          // 死亡复活界面【放弃复活 · 兵解轮回】：二次提醒防连点误放弃
          wrappedClick = () => {
            const now = Date.now();
            if (_pendingUiBtnId === 'btn_give_up' && now <= _pendingUiBtnExpireMs) {
              clearPendingConfirms();
              onClick();
              return;
            }
            _pendingUiBtnId = 'btn_give_up';
            _pendingUiBtnExpireMs = now + 3200;
            SoundFX.play('uiWarn');
            Env.vibrate('light');
            this.showToast('⚠ 防误触提醒：再点一次【放弃复活】将结束本局并结算灵蕴', 3.0);
          };
        } else if (id === 'mock_ad_skip') {
          // 激励视频未播完点击中途关闭：二次提醒
          wrappedClick = () => {
            const now = Date.now();
            if (_pendingUiBtnId === 'mock_ad_skip' && now <= _pendingUiBtnExpireMs) {
              clearPendingConfirms();
              onClick();
              return;
            }
            _pendingUiBtnId = 'mock_ad_skip';
            _pendingUiBtnExpireMs = now + 3000;
            SoundFX.play('uiWarn');
            this.showToast('⚠ 视频尚未播完无奖励，再点一次确认中途退出', 2.8);
          };
        } else if (
          (id === 'bestiary_launch_trial' || id === 'atlas_roll_region' || String(id).indexOf('go_trib_') === 0) &&
          _activeApp &&
          _activeApp.state === 'PLAYING' &&
          _activeApp.player &&
          _activeApp.player.totalKills > 0
        ) {
          // 正在破劫战斗中途从图鉴跳往新劫难：二次提醒防误触重开
          wrappedClick = () => {
            const now = Date.now();
            if (_pendingUiBtnId === id && now <= _pendingUiBtnExpireMs) {
              clearPendingConfirms();
              onClick();
              return;
            }
            _pendingUiBtnId = id;
            _pendingUiBtnExpireMs = now + 3000;
            SoundFX.play('uiWarn');
            this.showToast('⚠ 当前战局进行中，再点一次确认切换至所选劫难地图', 2.8);
          };
        }
      }

      return origAddButton.call(this, id, x, y, w, h, wrappedClick, meta);
    };

    const origHandleTap = UIManager.prototype.handleTap;
    UIManager.prototype.handleTap = function (px, py) {
      const p = this.toUICoord(px, py);
      const ux = p.x;
      const uy = p.y;

      // 查找命中的按钮
      let hitBtn = null;
      for (let i = this.buttons.length - 1; i >= 0; i--) {
        const b = this.buttons[i];
        if (ux >= b.x && ux <= b.x + b.w && uy >= b.y && uy <= b.y + b.h) {
          hitBtn = b;
          break;
        }
      }

      // 若当前处于【返回二次确认弹窗】，点击面板外部空白区可视为安全「继续游戏」或忽略，绝不穿透
      if (!hitBtn) {
        return false;
      }

      const now = Date.now();
      // 1. 全局快速连点去抖（避免单次触摸抖动连触关闭后又点到底层按钮）
      const isTabOrSelect =
        String(hitBtn.id).indexOf('cs_') === 0 ||
        String(hitBtn.id).indexOf('sel_') === 0 ||
        String(hitBtn.id).indexOf('slot_tab_') === 0 ||
        String(hitBtn.id).indexOf('eq_subtab_') === 0 ||
        String(hitBtn.id).indexOf('forge_flt_') === 0 ||
        hitBtn.id === 'forge_prev' ||
        hitBtn.id === 'forge_next' ||
        String(hitBtn.id).indexOf('mat_cell_') === 0 ||
        String(hitBtn.id).indexOf('bestiary_tab_') === 0 ||
        String(hitBtn.id).indexOf('bestiary_item_') === 0 ||
        String(hitBtn.id).indexOf('atlas_reg_') === 0;

      if (!isTabOrSelect && now - _lastUiTapMs < 165) {
        return true;
      }

      // 2. 弹窗刚呼出 0.34s 防误触保护期（激战连点普攻/技能时突然弹出死亡或天书弹窗，拦截第1帧惯性误触！）
      if (_modalProtectTimer > 0 && _activeApp && (_activeApp.modal || DouyinSDK.mockAdState.active) && !isTabOrSelect) {
        return true;
      }

      _lastUiTapMs = now;
      // 直接在 UI 坐标系内执行原始点击逻辑（临时以恒等映射调用避免二次缩放偏移）
      const savedVp = this._activeViewport;
      this._activeViewport = null;
      try {
        return origHandleTap.call(this, ux, uy);
      } finally {
        this._activeViewport = savedVp;
      }
    };

    // =========================================================================
    // 3. 渲染【暂停 · 返回营地二次确认】国风雕花弹窗 & 视口安全包装
    // =========================================================================
    UIManager.prototype.renderReturnConfirmModal = function (ctx, sw, sh, app) {
      this.clearButtons();
      if (this.syncModalTransition) this.syncModalTransition('RETURN_CONFIRM');

      if (UITheme && UITheme.drawModalBackdrop) {
        UITheme.drawModalBackdrop(ctx, sw, sh, app.globalTime, '#ffd166');
      } else {
        ctx.fillStyle = 'rgba(6, 5, 14, 0.88)';
        ctx.fillRect(0, 0, sw, sh);
      }

      if (this.beginModalPop) this.beginModalPop(ctx, sw, sh);

      const mw = Math.min(510, sw - 28);
      const mh = Math.min(298, sh - 20);
      const mx = Math.round((sw - mw) / 2);
      const my = Math.round((sh - mh) / 2);

      drawPixelPanel(ctx, mx, my, mw, mh, '#151126', '#ffd166', 8, {
        topCrest: true,
        headerBand: 42,
        corners: true,
        lattice: true,
        glowColor: '#ffd166'
      });

      if (UITheme && UITheme.drawSealStamp) {
        UITheme.drawSealStamp(ctx, mx + 16, my + 9, 24, '驻足', '#b5171e', '#ffd166');
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 17px sans-serif';
      const titleText =
        _returnConfirmReason === 'auto_pause'
          ? '⏸ 切回前台安全驻足 · 战局已保护暂停'
          : '⏸ 战局已暂停 · 返回营地二次确认';
      ctx.fillText(titleText, mx + 48, my + 27);

      // 右上角快捷【继续 ×】按钮
      const closeW = 64;
      const closeX = mx + mw - closeW - 12;
      if (UITheme && UITheme.drawOrnateButton) {
        UITheme.drawOrnateButton(
          ctx,
          closeX,
          my + 8,
          closeW,
          26,
          '继续 ×',
          this.getBtnVisualState
            ? this.getBtnVisualState(closeX, my + 8, closeW, 26, { variant: 'jade', studs: false, fontSize: 11 })
            : { variant: 'jade', studs: false, fontSize: 11 }
        );
      } else {
        drawPixelPanel(ctx, closeX, my + 8, closeW, 26, '#2d6a4f', '#69f0ae', 4);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('继续 ×', closeX + closeW / 2, my + 25);
      }
      this.addButton('ret_confirm_close', closeX, my + 8, closeW, 26, () => {
        app.resumeFromReturnConfirm();
      });

      // 二次确认防误触醒目提示语
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffba08';
      ctx.font = 'bold 12px sans-serif';
      const warnLine =
        _returnConfirmReason === 'auto_pause'
          ? '已为您自动冻结妖魔攻势，点击【继续破劫战斗】即可无缝再战！'
          : '⚠ 二次提醒：确认返回将结束本局西行（再按一次返回键或点左侧按钮确认返回）';
      ctx.fillText(warnLine, mx + mw / 2, my + 62);

      // 当前战局进度与灵蕴入库预览卡
      const infoX = mx + 18;
      const infoY = my + 74;
      const infoW = mw - 36;
      const infoH = 82;
      drawPixelPanel(ctx, infoX, infoY, infoW, infoH, 'rgba(26, 21, 46, 0.95)', '#4a4e69', 5);

      const player = app.player;
      const level = app.level;
      const charName = player && player.charDef ? player.charDef.name : '行者';
      const stageLabel = level && level.biome ? level.biome.name : '西行秘境';
      const kills = player ? player.totalKills : 0;
      const runSouls = player ? player.runSouls : 0;

      ctx.textAlign = 'left';
      ctx.fillStyle = '#e0fbfc';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`出战行者：${charName}    |    当前劫数：${stageLabel.slice(0, 16)}`, infoX + 14, infoY + 26);

      ctx.fillStyle = '#90e0ef';
      ctx.font = '12px sans-serif';
      ctx.fillText(`本局已斩妖魔：${kills} 只`, infoX + 14, infoY + 50);

      ctx.fillStyle = '#69f0ae';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`若现在返回营地，可安全入库灵蕴：+${runSouls}`, infoX + 178, infoY + 50);

      const prof = Env.getDeviceProfile ? Env.getDeviceProfile() : { os: 'web', runtimeTag: 'web' };
      const fpsApprox = Math.min(60, Math.max(15, Math.round(1 / Math.max(0.016, _emaDt))));
      const platName = Env.isWechat
        ? '微信小游戏'
        : Env.isDouyin
          ? '抖音小游戏'
          : Env.isWechatWebView
            ? '微信H5'
            : Env.isDouyinWebView
              ? '抖音H5'
              : prof.isIOS
                ? 'iOS触屏端'
                : prof.isAndroid
                  ? 'Android触屏端'
                  : '桌面端';
      ctx.fillStyle = '#adb5bd';
      ctx.font = '11px sans-serif';
      ctx.fillText(`运行环境：${platName} · 实时帧率 ~${fpsApprox} FPS · 返回防误触保护已开启`, infoX + 14, infoY + 71);

      // 中排：系统快捷设置栏（音效 / 触屏摇杆 / 稳帧画质档位）
      const setY = infoY + infoH + 12;
      const setH = 30;
      const setGap = 10;
      const setW = Math.floor((infoW - setGap * 2) / 3);
      const qDef = getQualityDef();

      const quickBtns = [
        {
          id: 'pause_toggle_mute',
          label: SoundFX.isMuted() ? '🔇 音效: 已静音' : '🔊 音效: 开启',
          variant: 'cyan',
          fn: () => {
            SoundFX.toggleMute();
          }
        },
        {
          id: 'pause_toggle_joy',
          label: this.showTouchControls ? '🕹 虚拟摇杆: 显' : '🕹 虚拟摇杆: 隐',
          variant: 'token',
          fn: () => {
            this.showTouchControls = !this.showTouchControls;
            this.resetTouchState();
          }
        },
        {
          id: 'pause_cycle_quality',
          label: `⚡ 画质: ${qDef.label}`,
          variant: 'purple',
          fn: () => {
            cycleQualityMode(app);
          }
        }
      ];

      quickBtns.forEach((qb, idx) => {
        const qx = infoX + idx * (setW + setGap);
        if (UITheme && UITheme.drawOrnateButton) {
          UITheme.drawOrnateButton(
            ctx,
            qx,
            setY,
            setW,
            setH,
            qb.label,
            this.getBtnVisualState
              ? this.getBtnVisualState(qx, setY, setW, setH, { variant: qb.variant, studs: false, fontSize: 11 })
              : { variant: qb.variant, studs: false, fontSize: 11 }
          );
        } else {
          drawPixelPanel(ctx, qx, setY, setW, setH, '#22223b', '#90e0ef', 4);
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(qb.label, qx + setW / 2, setY + 19);
        }
        this.addButton(qb.id, qx, setY, setW, setH, qb.fn);
      });

      // 底排双主操作键：左侧【确认返回营地（二次确认）】，右侧高亮大尺寸【▶ 继续破劫战斗】
      const actY = my + mh - 56;
      const actH = 44;
      const leftBtnW = Math.floor((infoW - 14) * 0.44);
      const rightBtnW = infoW - 14 - leftBtnW;
      const leftBtnX = infoX;
      const rightBtnX = infoX + leftBtnW + 14;

      if (UITheme && UITheme.drawOrnateButton) {
        UITheme.drawOrnateButton(
          ctx,
          leftBtnX,
          actY,
          leftBtnW,
          actH,
          '🏕 确认返回营地',
          this.getBtnVisualState
            ? this.getBtnVisualState(leftBtnX, actY, leftBtnW, actH, {
                variant: 'crimson',
                fontSize: 13,
                subText: runSouls > 0 ? `结算 +${runSouls} 灵蕴并退出本局` : '结束本局返回选人界面'
              })
            : { variant: 'crimson', fontSize: 13 }
        );
        UITheme.drawOrnateButton(
          ctx,
          rightBtnX,
          actY,
          rightBtnW,
          actH,
          '▶ 继续破劫战斗',
          this.getBtnVisualState
            ? this.getBtnVisualState(rightBtnX, actY, rightBtnW, actH, {
                variant: 'jade',
                fontSize: 15,
                shimmerTime: app.globalTime,
                subText: '不返回 · 恢复当前战局 [Space]'
              })
            : { variant: 'jade', fontSize: 15 }
        );
      } else {
        drawPixelPanel(ctx, leftBtnX, actY, leftBtnW, actH, '#780000', '#ffba08', 6);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('🏕 确认返回营地', leftBtnX + leftBtnW / 2, actY + 27);

        drawPixelPanel(ctx, rightBtnX, actY, rightBtnW, actH, '#2d6a4f', '#69f0ae', 6);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText('▶ 继续破劫战斗', rightBtnX + rightBtnW / 2, actY + 27);
      }

      this.addButton('btn_confirm_return_camp', leftBtnX, actY, leftBtnW, actH, () => {
        app.confirmReturnToTitle();
      });
      this.addButton('btn_resume_combat', rightBtnX, actY, rightBtnW, actH, () => {
        app.resumeFromReturnConfirm();
      });

      if (this.endModalPop) this.endModalPop(ctx);
    };

    // 包装主界面与战斗 HUD 渲染：自动套用刘海/胶囊安全视口与二次提醒微提示
    const origRenderTitleScreen = UIManager.prototype.renderTitleScreen;
    UIManager.prototype.renderTitleScreen = function (ctx, sw, sh, app) {
      _activeApp = app;
      const vp = this.computeSafeViewport(sw, sh);

      if (vp.hasMargins) {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, sh);
        bgGrad.addColorStop(0, '#0b0914');
        bgGrad.addColorStop(0.6, '#1b1429');
        bgGrad.addColorStop(1, '#2b191e');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, sw, sh);
        if (app.modal || DouyinSDK.mockAdState.active) {
          fillOuterMarginsDim(ctx, vp, 'rgba(6, 5, 14, 0.84)');
        }
      }

      ctx.save();
      ctx.translate(vp.offsetX, vp.offsetY);
      if (vp.scale !== 1) {
        ctx.scale(vp.scale, vp.scale);
      }
      origRenderTitleScreen.call(this, ctx, vp.uiW, vp.uiH, app);
      ctx.restore();
    };

    const origRenderCombatUI = UIManager.prototype.renderCombatUI;
    UIManager.prototype.renderCombatUI = function (ctx, sw, sh, app) {
      _activeApp = app;
      const vp = this.computeSafeViewport(sw, sh);

      if (vp.hasMargins && (app.modal || DouyinSDK.mockAdState.active)) {
        fillOuterMarginsDim(ctx, vp, 'rgba(6, 5, 14, 0.86)');
      }

      ctx.save();
      ctx.translate(vp.offsetX, vp.offsetY);
      if (vp.scale !== 1) {
        ctx.scale(vp.scale, vp.scale);
      }

      origRenderCombatUI.call(this, ctx, vp.uiW, vp.uiH, app);

      // 若处于死亡复活界面且已触发【放弃复活】首次提醒，在放弃按钮上叠加醒目红框角标
      if (
        app.modal === 'DEATH_REVIVE' &&
        _pendingUiBtnId === 'btn_give_up' &&
        Date.now() <= _pendingUiBtnExpireMs
      ) {
        const giveBtn = this.buttons.find((b) => b.id === 'btn_give_up');
        if (giveBtn) {
          ctx.save();
          ctx.strokeStyle = '#ff2a54';
          ctx.lineWidth = 2.4;
          ctx.strokeRect(giveBtn.x - 2, giveBtn.y - 2, giveBtn.w + 4, giveBtn.h + 4);
          ctx.restore();
        }
      }

      if (app.modal === 'RETURN_CONFIRM' && !DouyinSDK.mockAdState.active) {
        this.renderReturnConfirmModal(ctx, vp.uiW, vp.uiH, app);
        this.renderToast(ctx, vp.uiW, vp.uiH, true);
        if (this.renderRipples) this.renderRipples(ctx);
      }

      ctx.restore();
    };

    // =========================================================================
    // 4. GameApp 核心返回状态机、切后台安全暂停与自适应粒子限流
    // =========================================================================
    const origReturnToTitle = GameApp.prototype.returnToTitle;

    GameApp.prototype.openReturnConfirmModal = function (reason) {
      if (this.state !== 'PLAYING') return;
      if (this.modal === 'RETURN_CONFIRM') return;

      const choiceModals = ['ASPECT_PICK', 'SCROLL_PICK', 'STAGE_CLEAR', 'PORTAL_CHOICE', 'KARMIC_EVENT'];
      if (this.modal && choiceModals.indexOf(this.modal) !== -1) {
        _underlyingChoiceModal = this.modal;
      } else {
        _underlyingChoiceModal = null;
      }

      _returnConfirmReason = reason || 'hud_home';
      clearPendingConfirms();
      this.keys = {};
      this.ui && this.ui.resetTouchState();
      this.modal = 'RETURN_CONFIRM';
      _observedModal = 'RETURN_CONFIRM';
      _modalProtectTimer = getGuardCfg().modalOpenProtectSec;

      if (reason !== 'auto_pause') {
        SoundFX.play('uiWarn');
        Env.vibrate('light');
      }
    };

    GameApp.prototype.resumeFromReturnConfirm = function () {
      clearPendingConfirms();
      if (this.modal === 'RETURN_CONFIRM') {
        this.modal = _underlyingChoiceModal || null;
        _underlyingChoiceModal = null;
        _observedModal = this.modal;
        SoundFX.play('uiClick');
      }
    };

    GameApp.prototype.confirmReturnToTitle = function () {
      clearPendingConfirms();
      _underlyingChoiceModal = null;
      _observedModal = null;
      SoundFX.play('uiBack');
      origReturnToTitle.call(this);
    };

    /**
     * 统一处理来自 Android 返回键 / 全面屏侧滑 / 小程序返回 / Esc 键的返回请求
     * @returns {boolean} true 表示已拦截并妥善处理
     */
    GameApp.prototype.handleBackNavigation = function (source) {
      const cfg = getGuardCfg();
      const now = Date.now();

      // 硬件按键抖动与全面屏单次侧滑双发事件过滤（400ms 防抖）
      if (now - _lastBackSignalMs < cfg.antiJitterDebounceMs) {
        return true;
      }
      _lastBackSignalMs = now;

      // 1. 激励视频播放中
      if (DouyinSDK.mockAdState.active) {
        if (DouyinSDK.mockAdState.canReward) {
          DouyinSDK.closeMockAd(false);
          return true;
        }
        if (armSecondaryBack('ad_back', '⚠ 视频尚未播完，再按一次返回键将放弃本次仙缘奖励', this)) {
          DouyinSDK.closeMockAd(true);
        }
        return true;
      }

      // 2. 当前已处于【返回营地二次确认弹窗】
      if (this.modal === 'RETURN_CONFIRM') {
        if (_returnConfirmReason === 'auto_pause') {
          // 切后台自动暂停回到前台后第一次按返回键，先转为提醒态，防止误退
          _returnConfirmReason = 'back_key';
          SoundFX.play('uiWarn');
          this.ui && this.ui.showToast('⚠ 再按一次返回键将结算并退回营地；点【继续战斗】恢复游戏', 2.8);
          return true;
        }
        // 已是手动按返回或点返回营地呼出的二次提醒窗 -> 第二次按返回完成确认退出！
        this.confirmReturnToTitle();
        return true;
      }

      // 3. 战斗进行中（无弹窗） -> 第一次按返回键暂停并弹出二次确认窗！
      if (this.state === 'PLAYING' && !this.modal) {
        this.openReturnConfirmModal('back_key');
        this.ui && this.ui.showToast('⚠ 已暂停战局：再按一次返回键或点击【确认返回】才退回营地', 2.8);
        return true;
      }

      // 4. 各类模态弹窗与剧情演绎开启中
      if ((this.cutscene && this.cutscene.active) || this.modal === 'PROLOGUE_CUTSCENE' || this.modal === 'CUTSCENE_ACTIVE') {
        if (armSecondaryBack('back_cutscene', '⚠ 剧情演绎中：再按一次返回键跳过当前过场剧情', this)) {
          if (this.cutscene && typeof this.cutscene.skipAll === 'function') {
            this.cutscene.skipAll();
          } else {
            this.modal = null;
          }
        }
        return true;
      }

      if (this.modal) {
        if (this.modal === 'DEATH_REVIVE') {
          if (armSecondaryBack('back_death_revive', '⚠ 尚有逆天复活机会！再按一次返回键确认放弃复活并结算', this)) {
            this.finishRun(false);
          }
          return true;
        }

        if (this.modal === 'RUN_OVER') {
          if (armSecondaryBack('back_run_over', '⚠ 再按一次返回键退回选人营地', this)) {
            this.confirmReturnToTitle();
          }
          return true;
        }

        if (this.modal === 'EQUIP_COMPARE') {
          if (armSecondaryBack('back_equip_cmp', '⚠ 再按一次返回键暂存关闭装备对比（装备仍保留在地面）', this)) {
            this.modal = null;
          }
          return true;
        }

        const choiceModals = ['ASPECT_PICK', 'SCROLL_PICK', 'STAGE_CLEAR', 'PORTAL_CHOICE', 'KARMIC_EVENT'];
        if (choiceModals.indexOf(this.modal) !== -1) {
          if (armSecondaryBack('back_in_choice', '⚠ 正在选择仙缘奖励，再按一次返回键可呼出暂停/返回营地确认', this)) {
            this.openReturnConfirmModal('choice_pause');
          }
          return true;
        }

        // 图鉴 / 地形谱 / 土地庙 / 披挂背包及其他检视面板：侧滑返回同样二次提醒，防止翻页误关
        if (armSecondaryBack(`back_panel_${this.modal}`, '⚠ 防误触提醒：再按一次返回键关闭当前面板', this)) {
          this.modal = null;
        }
        return true;
      }

      // 5. 主界面营地（无弹窗） -> 二次提醒后才真正退出小游戏/网页
      if (this.state === 'TITLE' && !this.modal) {
        if (armSecondaryBack('exit_app_title', '⚠ 防误触提醒：再按一次返回键退出《西游破劫录》', this)) {
          Env.exitHostApp();
        }
        return true;
      }

      void source;
      return true;
    };

    // 拦截 Env.bindInputEvents，挂载多指触控分流、Esc 统一路由、前后台安全暂停与系统返回监听
    const origBindInputEvents = Env.bindInputEvents;
    Env.bindInputEvents = function (canvas, callbacks) {
      const origKeyDown = callbacks.onKeyDown;
      const origTouchStart = callbacks.onTouchStart;

      callbacks.onKeyDown = function (code, key, rawEv) {
        if (_activeApp) {
          if (code === 'Escape') {
            rawEv && rawEv.preventDefault && rawEv.preventDefault();
            _activeApp.handleBackNavigation('escape_key');
            return;
          }
          // 在返回确认暂停窗内按 Space 或 Enter 直接安全恢复战斗
          if (_activeApp.modal === 'RETURN_CONFIRM' && (code === 'Space' || code === 'Enter')) {
            rawEv && rawEv.preventDefault && rawEv.preventDefault();
            _activeApp.resumeFromReturnConfirm();
            return;
          }
        }
        origKeyDown && origKeyDown(code, key, rawEv);
      };

      // 多指同时按下时分流 UI 按钮与战斗虚拟键（解决左手按住摇杆时右手偶发点不中甘露瓶/或同时双指按下丢指问题）
      callbacks.onTouchStart = function (changed, allTouches) {
        if (!_activeApp || !changed || !changed.length) return;
        if (
          _activeApp.state === 'PLAYING' &&
          !_activeApp.modal &&
          !DouyinSDK.mockAdState.active &&
          changed.length > 1
        ) {
          const combatTouches = [];
          for (let i = 0; i < changed.length; i++) {
            const pt = changed[i];
            if (!_activeApp.ui.handleTap(pt.x, pt.y)) {
              combatTouches.push(pt);
            }
          }
          if (combatTouches.length > 0) {
            _activeApp.ui.handleCombatTouchStart(combatTouches, _activeApp.screenW, _activeApp.screenH, (act) => {
              _activeApp.triggerCombatAction(act);
            });
          }
          return;
        }
        origTouchStart && origTouchStart(changed, allTouches);
      };

      callbacks.onAppBlur = function () {
        if (!_activeApp) return;
        _activeApp.keys = {};
        _activeApp.ui && _activeApp.ui.resetTouchState();
        if (
          getGuardCfg().pauseOnBackground &&
          _activeApp.state === 'PLAYING' &&
          !_activeApp.modal &&
          !DouyinSDK.mockAdState.active &&
          _activeApp.globalTime > 0.5
        ) {
          _activeApp.openReturnConfirmModal('auto_pause');
        }
      };

      callbacks.onAppFocus = function () {
        if (_activeApp) {
          _activeApp.resizeCanvas();
        }
      };

      return origBindInputEvents.call(Env, canvas, callbacks);
    };

    // 包装 boot：注册跨端返回键监听、内存告警与抖音/微信切后台自动保护暂停
    const origBoot = GameApp.prototype.boot;
    GameApp.prototype.boot = function () {
      _activeApp = this;
      applyQualityDpr(this);

      Env.onBackNavigation((src) => this.handleBackNavigation(src));

      Env.onMemoryWarning(() => {
        _autoThrottleLevel = Math.max(_autoThrottleLevel, 2);
        if (this.effects) {
          this.effects.particles.length = Math.min(this.effects.particles.length, 24);
          this.effects.debris.length = Math.min(this.effects.debris.length, 10);
          this.effects.afterimages.length = 0;
        }
        applyQualityDpr(this);
      });

      const origSdkInit = DouyinSDK.init;
      let wrappedOnce = false;
      DouyinSDK.init = (cb) => {
        if (wrappedOnce) return origSdkInit(cb);
        wrappedOnce = true;
        const userCb = cb || {};
        return origSdkInit({
          onPause: () => {
            this.keys = {};
            this.ui && this.ui.resetTouchState();
            if (
              getGuardCfg().pauseOnBackground &&
              this.state === 'PLAYING' &&
              !this.modal &&
              !DouyinSDK.mockAdState.active &&
              this.globalTime > 0.5
            ) {
              this.openReturnConfirmModal('auto_pause');
            }
            userCb.onPause && userCb.onPause();
          },
          onResume: (res) => {
            this.resizeCanvas();
            userCb.onResume && userCb.onResume(res);
          }
        });
      };

      return origBoot.call(this);
    };

    // 包装 tick：更新弹窗保护倒计时、帧率自适应调节器与特效粒子上限裁剪
    const origTick = GameApp.prototype.tick;
    GameApp.prototype.tick = function (dt) {
      _activeApp = this;

      // 检测是否有新弹窗刚刚打开，自动赋予 0.34s 防惯性误点保护期
      const curModalKey = DouyinSDK.mockAdState.active ? '__MOCK_AD__' : this.modal;
      if (curModalKey !== _observedModal) {
        if ((_observedModal === 'CUTSCENE_ACTIVE' || _observedModal === 'PROLOGUE_CUTSCENE') && !curModalKey) {
          _lastBackSignalMs = Date.now();
        }
        if (curModalKey) {
          _modalProtectTimer = getGuardCfg().modalOpenProtectSec;
          this.ui && this.ui.resetTouchState();
        }
        _observedModal = curModalKey;
      } else if (_modalProtectTimer > 0) {
        _modalProtectTimer = Math.max(0, _modalProtectTimer - dt);
      }

      // 仅在活跃战斗帧评估真实设备渲染帧率
      if (this.state === 'PLAYING' && !this.modal && !DouyinSDK.mockAdState.active) {
        _emaDt = _emaDt * 0.92 + dt * 0.08;
        if (_qualityModeId === 'auto') {
          if (_emaDt > 0.026) {
            // 低于 ~38 FPS 持续 1.6s 自动介入稳帧降载
            _lowFpsAccumSec += dt;
            _highFpsAccumSec = 0;
            if (_lowFpsAccumSec > 1.6 && _autoThrottleLevel < 2) {
              _autoThrottleLevel++;
              _lowFpsAccumSec = 0;
              applyQualityDpr(this);
            }
          } else if (_emaDt < 0.0185 && _autoThrottleLevel > 0) {
            _highFpsAccumSec += dt;
            _lowFpsAccumSec = 0;
            if (_highFpsAccumSec > 8.0) {
              _autoThrottleLevel = Math.max(0, _autoThrottleLevel - 1);
              _highFpsAccumSec = 0;
              applyQualityDpr(this);
            }
          }
        }
      }

      origTick.call(this, dt);

      // 动态裁剪瞬态粒子数组长度，杜绝群怪/90秒割草模式在 Android/小程序 WebView 内存暴涨掉帧
      if (this.effects) {
        const q = getQualityDef();
        const factor = _qualityModeId === 'auto' ? (_autoThrottleLevel === 2 ? 0.55 : _autoThrottleLevel === 1 ? 0.78 : 1) : 1;
        const pCap = Math.round(q.particleCap * factor);
        const dCap = Math.round(q.debrisCap * factor);
        const aCap = Math.round(q.afterimageCap * factor);

        if (this.effects.particles && this.effects.particles.length > pCap) {
          this.effects.particles.splice(0, this.effects.particles.length - pCap);
        }
        if (this.effects.debris && this.effects.debris.length > dCap) {
          this.effects.debris.splice(0, this.effects.debris.length - dCap);
        }
        if (this.effects.afterimages && this.effects.afterimages.length > aCap) {
          this.effects.afterimages.splice(0, this.effects.afterimages.length - aCap);
        }
        if (this.effects.floatingTexts && this.effects.floatingTexts.length > 28) {
          this.effects.floatingTexts.splice(0, this.effects.floatingTexts.length - 28);
        }
      }
    };

    // 低帧率或省电模式下对高频粒子生成数量自动按比例瘦身（减少循环开销）
    const origSpawnParticles = EffectsManager.prototype.spawnParticles;
    EffectsManager.prototype.spawnParticles = function (x, y, count, color, speedMin, speedMax, lifeMin, lifeMax, gravity) {
      let adjCount = count;
      if (_qualityModeId === 'smooth' || _autoThrottleLevel >= 2) {
        adjCount = Math.max(2, Math.ceil(count * 0.5));
      } else if (_autoThrottleLevel === 1 || (Env.getDeviceProfile && Env.getDeviceProfile().isLowEnd)) {
        adjCount = Math.max(3, Math.ceil(count * 0.72));
      }
      return origSpawnParticles.call(this, x, y, adjCount, color, speedMin, speedMax, lifeMin, lifeMax, gravity);
    };
  }

  installSystemOptimizer();

  return {
    QUALITY_MODES,
    installSystemOptimizer
  };
});
