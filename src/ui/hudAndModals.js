/**
 * 像素国风 UI、八卦虚拟摇杆、连斩战意榜与商业化弹窗系统 (src/ui/hudAndModals.js)
 * 美术升级版：「玄金漆器 · 朱砂篆印 · 祥云回纹 · 动态法阵立绘台」
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
})('hudAndModals', function (require) {
  const { CHARACTERS } = require('../config/characters');
  const { SCROLL_TYPES, META_UPGRADES, getSubWeaponById } = require('../config/weapons');
  const { EQUIP_SLOTS, formatBaseStatLines } = require('../config/equipment');
  const TerrainRegions = require('../config/terrainRegions81');
  const SDK_CONFIG = require('../config/sdkConfig');
  const DouyinSDK = require('../sdk/douyinSDK');
  const SoundFX = require('../audio/soundFX');
  const Env = require('../platform/env');
  const UITheme = require('./uiTheme');

  let BestiaryModal = null;
  try {
    BestiaryModal = require('./bestiaryModal');
  } catch (e) {
    BestiaryModal = null;
  }

  /**
   * 兼容全局调用的国风雕花面板绘制函数（自动赋予双层镶边、高光与四角回纹）
   */
  function drawPixelPanel(ctx, x, y, w, h, bgColor, borderColor, cut, opts) {
    UITheme.drawOrnatePanel(ctx, x, y, w, h, bgColor, borderColor, cut, opts);
  }

  class UIManager {
    constructor() {
      this.buttons = [];
      this.toastText = '';
      this.toastTimer = 0;
      this.toastMaxTimer = 2.2;
      this.showTouchControls = true;

      // 指针悬停、按压状态与点击水波纹反馈
      this.pointerX = -999;
      this.pointerY = -999;
      this.pointerDown = false;
      this.ripples = [];

      // 血条受击残影缓冲 & 弹窗丝滑弹出过渡动画
      this.hpLagRatio = 1;
      this.bossLagRatio = 1;
      this.lastModalKey = null;
      this.modalOpenElapsed = 1;

      // 移动端动态跟随虚拟摇杆与多点动作键状态
      this.joyTouchId = null;
      this.joyCenter = { x: 118, y: 0 };
      this.joyKnob = { x: 118, y: 0 };
      this.joyRadius = 54;
      this.touchMoveX = 0;
      this.touchDown = false;
      this.activeTouchActions = {};
    }

    showToast(msg, sec) {
      this.toastText = msg;
      this.toastMaxTimer = sec || 2.2;
      this.toastTimer = this.toastMaxTimer;
    }

    handlePointerMove(px, py) {
      this.pointerX = px;
      this.pointerY = py;
    }

    handlePointerDown(px, py) {
      this.pointerX = px;
      this.pointerY = py;
      this.pointerDown = true;
    }

    handlePointerUp() {
      this.pointerDown = false;
    }

    isRectHovered(x, y, w, h) {
      return this.pointerX >= x && this.pointerX <= x + w && this.pointerY >= y && this.pointerY <= y + h;
    }

    getBtnVisualState(x, y, w, h, extra) {
      const hovered = this.isRectHovered(x, y, w, h);
      return Object.assign(
        {
          hovered,
          pressed: hovered && this.pointerDown
        },
        extra || {}
      );
    }

    spawnRipple(x, y, color) {
      if (this.ripples.length > 8) this.ripples.shift();
      this.ripples.push({
        x,
        y,
        t: 0,
        maxT: 0.32,
        color: color || '#ffd166'
      });
    }

    update(dt, app) {
      if (this.toastTimer > 0) {
        this.toastTimer = Math.max(0, this.toastTimer - dt);
      }
      this.modalOpenElapsed = Math.min(1, this.modalOpenElapsed + dt);

      // 更新点击金波涟漪
      for (let i = this.ripples.length - 1; i >= 0; i--) {
        const rp = this.ripples[i];
        rp.t += dt;
        if (rp.t >= rp.maxT) this.ripples.splice(i, 1);
      }

      // 平滑追赶玩家与妖王血条受击白条
      if (app && app.player) {
        const curHpR = Math.max(0, Math.min(1, app.player.hp / Math.max(1, app.player.maxHp)));
        if (curHpR < this.hpLagRatio) {
          this.hpLagRatio = Math.max(curHpR, this.hpLagRatio - dt * 0.55);
        } else {
          this.hpLagRatio = curHpR;
        }
      }
      if (app && app.bossEntity && !app.bossEntity.dead) {
        const curBossR = Math.max(0, Math.min(1, app.bossEntity.hp / Math.max(1, app.bossEntity.maxHp)));
        if (curBossR < this.bossLagRatio) {
          this.bossLagRatio = Math.max(curBossR, this.bossLagRatio - dt * 0.45);
        } else {
          this.bossLagRatio = curBossR;
        }
      } else {
        this.bossLagRatio = 1;
      }
    }

    syncModalTransition(modalKey) {
      if (modalKey !== this.lastModalKey) {
        this.lastModalKey = modalKey;
        this.modalOpenElapsed = 0;
      }
    }

    beginModalPop(ctx, sw, sh) {
      ctx.save();
      const p = Math.min(1, this.modalOpenElapsed / 0.13);
      const ease = 1 - Math.pow(1 - p, 3);
      const sc = 0.94 + 0.06 * ease;
      ctx.globalAlpha = 0.35 + 0.65 * ease;
      ctx.translate(sw / 2, sh / 2);
      ctx.scale(sc, sc);
      ctx.translate(-sw / 2, -sh / 2);
    }

    endModalPop(ctx) {
      ctx.restore();
    }

    clearButtons() {
      this.buttons.length = 0;
    }

    addButton(id, x, y, w, h, onClick, meta) {
      this.buttons.push({ id, x, y, w, h, onClick, meta: meta || {} });
    }

    handleTap(px, py) {
      this.pointerX = px;
      this.pointerY = py;
      for (let i = this.buttons.length - 1; i >= 0; i--) {
        const b = this.buttons[i];
        if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) {
          SoundFX.play('uiClick');
          this.spawnRipple(px, py, (b.meta && b.meta.rippleColor) || '#ffd166');
          b.onClick && b.onClick();
          return true;
        }
      }
      return false;
    }

    renderRipples(ctx) {
      if (!this.ripples.length) return;
      ctx.save();
      for (let i = 0; i < this.ripples.length; i++) {
        const rp = this.ripples[i];
        const prog = rp.t / rp.maxT;
        const r = 6 + prog * 28;
        ctx.globalAlpha = Math.max(0, (1 - prog) * 0.75);
        ctx.strokeStyle = rp.color;
        ctx.lineWidth = 2 * (1 - prog) + 0.6;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    isActionPressed(actName) {
      const ids = Object.keys(this.activeTouchActions);
      for (let i = 0; i < ids.length; i++) {
        if (this.activeTouchActions[ids[i]] === actName) return true;
      }
      return false;
    }

    /**
     * 针对手机横屏大拇指弧线人体工学优化的按键布局（预留刘海/灵动岛安全边距）
     */
    getTouchLayout(sw, sh) {
      const safeX = Math.max(24, sw * 0.035);
      const joyX = safeX + 76;
      const joyY = sh - Math.max(82, sh * 0.22);

      const baseRightX = sw - safeX - 66;
      const baseBottomY = sh - Math.max(74, sh * 0.19);

      return {
        joy: { x: joyX, y: joyY, r: 54 },
        attack: { x: baseRightX - 6, y: baseBottomY + 4, r: 42, label: '普攻', sub: 'J/连斩', color: '#ff9f1c' },
        jump: { x: baseRightX + 34, y: baseBottomY - 74, r: 32, label: '腾云', sub: 'K', color: '#4cc9f0' },
        roll: { x: baseRightX - 92, y: baseBottomY + 14, r: 30, label: '翻滚', sub: 'L', color: '#80ffdb' },
        skill: { x: baseRightX - 68, y: baseBottomY - 66, r: 32, label: '神通', sub: 'U', color: '#ffd166' },
        subWep: { x: baseRightX - 138, y: baseBottomY - 40, r: 26, label: '法宝', sub: 'I', color: '#c77dff' },
        slam: { x: baseRightX + 34, y: baseBottomY - 144, r: 24, label: '千钧', sub: '震地', color: '#ff5400' }
      };
    }

    handleCombatTouchStart(changedTouches, sw, sh, actionCallbacks) {
      if (!this.showTouchControls) return;
      const layout = this.getTouchLayout(sw, sh);

      for (let i = 0; i < changedTouches.length; i++) {
        const t = changedTouches[i];
        const checkCircle = (btn, actName) => {
          if (Math.hypot(t.x - btn.x, t.y - btn.y) <= btn.r + 12) {
            this.activeTouchActions[t.id] = actName;
            this.spawnRipple(btn.x, btn.y, btn.color);
            Env.vibrate('light');
            actionCallbacks && actionCallbacks(actName);
            return true;
          }
          return false;
        };

        if (checkCircle(layout.attack, 'attack')) continue;
        if (checkCircle(layout.jump, 'jump')) continue;
        if (checkCircle(layout.roll, 'roll')) continue;
        if (checkCircle(layout.skill, 'skill')) continue;
        if (checkCircle(layout.subWep, 'subWeapon')) continue;
        if (checkCircle(layout.slam, 'slam')) continue;

        // 左半屏任意位置按下即在手指处生成动态跟随八卦摇杆
        if (t.x < sw * 0.46 && t.y > 76 && this.joyTouchId === null) {
          this.joyTouchId = t.id;
          const cx = Math.max(68, Math.min(sw * 0.38, t.x));
          const cy = Math.max(120, Math.min(sh - 64, t.y));
          this.joyCenter = { x: cx, y: cy };
          this.updateJoyByPoint(t.x, t.y);
        }
      }
    }

    handleCombatTouchMove(changedTouches) {
      for (let i = 0; i < changedTouches.length; i++) {
        const t = changedTouches[i];
        if (t.id === this.joyTouchId) {
          this.updateJoyByPoint(t.x, t.y);
        }
      }
    }

    handleCombatTouchEnd(changedTouches) {
      for (let i = 0; i < changedTouches.length; i++) {
        const t = changedTouches[i];
        if (t.id === this.joyTouchId) {
          this.joyTouchId = null;
          this.touchMoveX = 0;
          this.touchDown = false;
        }
        delete this.activeTouchActions[t.id];
      }
    }

    updateJoyByPoint(px, py) {
      const dx = px - this.joyCenter.x;
      const dy = py - this.joyCenter.y;
      const dist = Math.hypot(dx, dy);
      const maxR = this.joyRadius;
      const clamped = Math.min(dist, maxR);
      const ang = Math.atan2(dy, dx);

      this.joyKnob = {
        x: this.joyCenter.x + Math.cos(ang) * clamped,
        y: this.joyCenter.y + Math.sin(ang) * clamped
      };

      if (Math.abs(dx) > 9) {
        this.touchMoveX = dx > 0 ? 1 : -1;
      } else {
        this.touchMoveX = 0;
      }
      this.touchDown = dy > 24;
    }

    resetTouchState() {
      this.joyTouchId = null;
      this.touchMoveX = 0;
      this.touchDown = false;
      this.activeTouchActions = {};
    }

    // ==================== 主界面远景山河法轮与角色专属法阵绘制辅助 ====================
    renderTitleBackdrop(ctx, sw, sh, globalTime) {
      // 1. 暮紫玄金霞光天幕渐变
      const grad = ctx.createLinearGradient(0, 0, 0, sh);
      grad.addColorStop(0, '#080612');
      grad.addColorStop(0.45, '#161029');
      grad.addColorStop(0.82, '#291528');
      grad.addColorStop(1, '#3b181c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, sw, sh);

      // 中心暖金天光晕染
      const sunGlow = ctx.createRadialGradient(sw * 0.5, sh * 0.36, 16, sw * 0.5, sh * 0.36, sw * 0.52);
      sunGlow.addColorStop(0, 'rgba(255, 195, 77, 0.14)');
      sunGlow.addColorStop(0.55, 'rgba(157, 78, 221, 0.06)');
      sunGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sunGlow;
      ctx.fillRect(0, 0, sw, sh);

      // 2. 缓缓自转的【天道八阵暗金法轮】（居于角色卡背后，营造恢弘神话殿堂感）
      ctx.save();
      ctx.translate(sw * 0.5, sh * 0.44);
      ctx.rotate(globalTime * 0.08);
      const wheelR = Math.min(sw, sh) * 0.42;
      ctx.strokeStyle = 'rgba(255, 209, 102, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, wheelR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, wheelR * 0.78, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * wheelR * 0.42, Math.sin(a) * wheelR * 0.42);
        ctx.lineTo(Math.cos(a) * wheelR, Math.sin(a) * wheelR);
        ctx.stroke();
      }
      ctx.restore();

      // 3. 远景五行山群峰与天宫重檐宝塔剪影
      ctx.save();
      ctx.fillStyle = 'rgba(14, 10, 24, 0.75)';
      ctx.beginPath();
      ctx.moveTo(0, sh);
      for (let x = 0; x <= sw + 80; x += 68) {
        const peakH = 48 + ((x * 29) % 58) + Math.sin(x * 0.02) * 14;
        ctx.lineTo(x, sh - peakH);
      }
      ctx.lineTo(sw, sh);
      ctx.closePath();
      ctx.fill();

      // 两侧古刹飞檐宝塔剪影与微光灯窗
      [Math.round(sw * 0.08), Math.round(sw * 0.90)].forEach((px, idx) => {
        const baseH = sh - 46;
        ctx.fillStyle = 'rgba(11, 8, 20, 0.88)';
        for (let tier = 0; tier < 3; tier++) {
          const tw = 38 - tier * 8;
          const ty = baseH - tier * 20;
          ctx.fillRect(px - tw / 2, ty - 16, tw, 16);
          ctx.beginPath();
          ctx.moveTo(px - tw / 2 - 8, ty - 15);
          ctx.quadraticCurveTo(px, ty - 24, px + tw / 2 + 8, ty - 15);
          ctx.lineTo(px + tw / 2, ty - 12);
          ctx.lineTo(px - tw / 2, ty - 12);
          ctx.closePath();
          ctx.fill();
        }
        // 塔心暖灯
        ctx.fillStyle = idx === 0 ? 'rgba(255, 183, 3, 0.45)' : 'rgba(255, 84, 0, 0.45)';
        ctx.fillRect(px - 2, baseH - 32, 4, 6);
      });

      // 4. 飘渺祥云横带与升腾燎原金烬
      ctx.fillStyle = 'rgba(255, 209, 102, 0.045)';
      for (let c = 0; c < 6; c++) {
        const cx = (((c * 190 + globalTime * (10 + c * 2)) % (sw + 180)) + sw + 180) % (sw + 180) - 90;
        const cy = 44 + (c % 3) * 34;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 52, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 22, cy - 5, 32, 9, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < 28; i++) {
        const x = (((i * 97 + globalTime * (14 + (i % 4) * 5)) % (sw + 40)) + sw + 40) % (sw + 40) - 20;
        const y = sh - (((i * 61 + globalTime * (18 + (i % 5) * 6)) % sh + sh) % sh);
        ctx.fillStyle = i % 3 === 0 ? 'rgba(255, 107, 53, 0.48)' : 'rgba(255, 214, 10, 0.36)';
        const sz = i % 4 === 0 ? 3 : 2;
        ctx.fillRect(Math.round(x), Math.round(y), sz, sz);
      }
      ctx.restore();
    }

    renderHeroCardAura(ctx, ch, cx, cardW, pedY, isSelected, globalTime) {
      const midX = cx + cardW / 2;
      ctx.save();

      // 地面法阵双层光环底座
      ctx.fillStyle = UITheme.withAlpha(ch.themeColor, isSelected ? 0.26 : 0.10);
      ctx.beginPath();
      ctx.ellipse(midX, pedY, 32, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = UITheme.withAlpha(ch.themeColor, isSelected ? 0.78 : 0.30);
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.ellipse(midX, pedY, 24 + Math.sin(globalTime * 4) * 2, 5.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // 五师徒专属神话背光细节（与 76x88 实时纸娃娃冠冕无缝衬托）
      if (ch.id === 'tangseng') {
        const hy = pedY - 40;
        ctx.strokeStyle = isSelected ? 'rgba(255, 214, 10, 0.45)' : 'rgba(255, 209, 102, 0.2)';
        ctx.lineWidth = 1;
        for (let r = 0; r < 8; r++) {
          const a = globalTime * 0.8 + (r * Math.PI) / 4;
          ctx.beginPath();
          ctx.moveTo(midX + Math.cos(a) * 21, hy + Math.sin(a) * 21);
          ctx.lineTo(midX + Math.cos(a) * 29, hy + Math.sin(a) * 29);
          ctx.stroke();
        }
      } else if (ch.id === 'wukong') {
        // 悟空：脚踏筋斗祥云金涡 + 齐天金芒
        ctx.fillStyle = isSelected ? 'rgba(255, 183, 3, 0.36)' : 'rgba(255, 183, 3, 0.16)';
        ctx.beginPath();
        ctx.arc(midX - 15, pedY + 1, 7, 0, Math.PI * 2);
        ctx.arc(midX + 15, pedY + 1, 7, 0, Math.PI * 2);
        ctx.arc(midX, pedY + 3, 9, 0, Math.PI * 2);
        ctx.fill();
      } else if (ch.id === 'bajie') {
        // 八戒：天蓬罡气护体六角星芒
        const hy = pedY - 34;
        ctx.strokeStyle = isSelected ? 'rgba(105, 240, 174, 0.55)' : 'rgba(105, 240, 174, 0.22)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(midX, hy, 24, -Math.PI * 0.8, -Math.PI * 0.2);
        ctx.stroke();
      } else if (ch.id === 'wujing') {
        // 悟净：流沙朔月弯弧背光
        const hy = pedY - 40;
        ctx.strokeStyle = isSelected ? 'rgba(114, 239, 221, 0.72)' : 'rgba(114, 239, 221, 0.28)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(midX + 5, hy, 20, Math.PI * 0.65, Math.PI * 1.45);
        ctx.stroke();
      } else if (ch.id === 'bailongma') {
        // 白龙马：真龙青雷电弧闪烁
        const zig = Math.sin(globalTime * 14) * 4;
        ctx.strokeStyle = isSelected ? 'rgba(0, 245, 212, 0.82)' : 'rgba(76, 201, 240, 0.32)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(midX - 24, pedY - 52);
        ctx.lineTo(midX - 16 + zig, pedY - 36);
        ctx.lineTo(midX - 22, pedY - 22);
        ctx.moveTo(midX + 24, pedY - 48);
        ctx.lineTo(midX + 16 - zig, pedY - 32);
        ctx.lineTo(midX + 22, pedY - 18);
        ctx.stroke();
      }

      ctx.restore();
    }

    // ==================== 1. 标题与五师徒高细节神龛立绘选择界面 ====================
    renderTitleScreen(ctx, sw, sh, app) {
      this.clearButtons();
      this.syncModalTransition(app.modal);

      // 1. 恢弘东方神话山河法轮动态远景
      this.renderTitleBackdrop(ctx, sw, sh, app.globalTime);

      const safePad = Math.max(18, Math.round(sw * 0.025));

      // 顶部暗金横幅底衬条
      ctx.fillStyle = 'rgba(10, 8, 20, 0.62)';
      ctx.fillRect(0, 0, sw, 46);
      ctx.fillStyle = 'rgba(255, 209, 102, 0.25)';
      ctx.fillRect(0, 46, sw, 1);

      // 2. 左上角朱砂篆印 + 鎏金渐变牌匾游戏主标题
      UITheme.drawSealStamp(ctx, safePad, 9, 28, '破劫', '#c1121f', '#ffd166');

      const logoX = safePad + 36;
      const logoGrad = ctx.createLinearGradient(logoX, 11, logoX, 38);
      logoGrad.addColorStop(0, '#fff3b0');
      logoGrad.addColorStop(0.55, '#ffd166');
      logoGrad.addColorStop(1, '#f48c06');
      ctx.save();
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'left';
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#140c1c';
      ctx.strokeText('西游破劫录', logoX, 33);
      ctx.fillStyle = logoGrad;
      ctx.fillText('西游破劫录', logoX, 33);
      ctx.restore();

      // 角色标题旁【👗 实时纸娃娃套装试穿预览】快捷切换器
      const outfitSets = app.assetLoader.getPreviewOutfitSets
        ? app.assetLoader.getPreviewOutfitSets()
        : [{ id: 'default', label: '本命原装', equipped: null }];
      const curOutfitIdx = (app.previewOutfitIdx || 0) % outfitSets.length;
      const curOutfit = outfitSets[curOutfitIdx];

      if (sw >= 780) {
        const skinBtnX = logoX + 126;
        const skinBtnW = 158;
        UITheme.drawOrnateButton(
          ctx,
          skinBtnX,
          9,
          skinBtnW,
          29,
          `👗 试穿: ${curOutfit.label} ▸`,
          this.getBtnVisualState(skinBtnX, 9, skinBtnW, 29, {
            variant: curOutfitIdx === 0 ? 'token' : 'purple',
            studs: false,
            fontSize: 11,
            shimmerTime: curOutfitIdx > 0 ? app.globalTime : undefined
          })
        );
        this.addButton('btn_cycle_preview_outfit', skinBtnX, 9, skinBtnW, 29, () => {
          app.previewOutfitIdx = ((app.previewOutfitIdx || 0) + 1) % outfitSets.length;
          const nextSet = outfitSets[app.previewOutfitIdx];
          this.showToast(`✨ 角色模型实时试穿预览：【${nextSet.label}】（进入游戏按实际穿戴生效）`, 2.0);
        });
      }

      // 3. 右上角立体国风令牌工具栏（带可领奖/可升级呼吸红点提示！）
      let btnRight = sw - safePad;
      const topBtnY = 9;
      const topBtnH = 29;

      if (Env.isBrowser) {
        const fsW = 62;
        btnRight -= fsW;
        UITheme.drawOrnateButton(
          ctx,
          btnRight,
          topBtnY,
          fsW,
          topBtnH,
          '⛶ 全屏',
          this.getBtnVisualState(btnRight, topBtnY, fsW, topBtnH, { variant: 'token', studs: false, fontSize: 11 })
        );
        this.addButton('btn_fullscreen', btnRight, topBtnY, fsW, topBtnH, () => {
          Env.requestFullscreen();
        });
        btnRight -= 6;
      }

      const muteW = 68;
      btnRight -= muteW;
      UITheme.drawOrnateButton(
        ctx,
        btnRight,
        topBtnY,
        muteW,
        topBtnH,
        SoundFX.isMuted() ? '🔇静音' : '🔊音效',
        this.getBtnVisualState(btnRight, topBtnY, muteW, topBtnH, { variant: 'cyan', studs: false, fontSize: 11 })
      );
      this.addButton('btn_mute', btnRight, topBtnY, muteW, topBtnH, () => {
        SoundFX.toggleMute();
      });
      btnRight -= 6;

      const sideW = 104;
      btnRight -= sideW;
      const canClaim = DouyinSDK.canClaimSidebarToday();
      UITheme.drawOrnateButton(
        ctx,
        btnRight,
        topBtnY,
        sideW,
        topBtnH,
        canClaim ? '🎁侧边栏+80' : '🎁今日已领',
        this.getBtnVisualState(btnRight, topBtnY, sideW, topBtnH, {
          variant: canClaim ? 'crimson' : 'slate',
          studs: false,
          fontSize: 11,
          badgeDot: canClaim ? '#00f5d4' : null
        })
      );
      this.addButton('btn_sidebar', btnRight, topBtnY, sideW, topBtnH, () => {
        DouyinSDK.navigateOrClaimSidebar(
          (souls) => {
            app.addPermanentSouls(souls);
            this.showToast(`仙缘到账！获得侧边栏奖励 +${souls} 灵蕴！`);
          },
          (tip) => this.showToast(tip)
        );
      });
      btnRight -= 6;

      // 检测是否有足够灵蕴升级任意一项土地庙仙根
      const hasAffordableMeta = META_UPGRADES.some((up) => {
        const lv = (app.saveData.metaLevels && app.saveData.metaLevels[up.id]) || 0;
        return lv < up.maxLv && app.saveData.souls >= up.baseCost + lv * up.costStep;
      });
      const metaW = 112;
      btnRight -= metaW;
      UITheme.drawOrnateButton(
        ctx,
        btnRight,
        topBtnY,
        metaW,
        topBtnH,
        `⛩土地庙(${app.saveData.souls})`,
        this.getBtnVisualState(btnRight, topBtnY, metaW, topBtnH, {
          variant: 'jade',
          studs: false,
          fontSize: 11,
          badgeDot: hasAffordableMeta ? '#ffd166' : null
        })
      );
      this.addButton('btn_meta', btnRight, topBtnY, metaW, topBtnH, () => {
        app.modal = 'META_SHOP';
      });
      btnRight -= 6;

      if (BestiaryModal) {
        const bestW = 104;
        btnRight -= bestW;
        UITheme.drawOrnateButton(
          ctx,
          btnRight,
          topBtnY,
          bestW,
          topBtnH,
          '📖百妖图谱',
          this.getBtnVisualState(btnRight, topBtnY, bestW, topBtnH, { variant: 'purple', studs: false, fontSize: 11 })
        );
        this.addButton('btn_bestiary_81', btnRight, topBtnY, bestW, topBtnH, () => {
          app.modal = 'BESTIARY_81';
        });
        btnRight -= 6;
      }

      const terrW = 108;
      btnRight -= terrW;
      UITheme.drawOrnateButton(
        ctx,
        btnRight,
        topBtnY,
        terrW,
        topBtnH,
        '🗺八十一难图',
        this.getBtnVisualState(btnRight, topBtnY, terrW, topBtnH, { variant: 'token', studs: false, fontSize: 11 })
      );
      this.addButton('btn_terrain_atlas', btnRight, topBtnY, terrW, topBtnH, () => {
        app.modal = 'TERRAIN_ATLAS';
      });

      // 4. 中部：5 大西游角色高细节神龛立绘卡
      const gap = 9;
      const cardW = Math.floor((sw - safePad * 2 - gap * 4) / 5);
      const cardTop = 53;
      const cardH = Math.max(194, sh - 120);

      const affinityMeta = {
        red: { short: '斗战', col: '#ff5252' },
        purple: { short: '妙法', col: '#c77dff' },
        green: { short: '金刚', col: '#69f0ae' }
      };

      CHARACTERS.forEach((ch, idx) => {
        const cx = safePad + idx * (cardW + gap);
        const isSelected = app.selectedCharId === ch.id;
        const isHovered = !app.modal && this.isRectHovered(cx, cardTop, cardW, cardH);
        const liftY = isSelected ? -2 : isHovered ? -1 : 0;
        const cy = cardTop + liftY;

        const borderCol = isSelected ? ch.themeColor : isHovered ? '#90e0ef' : '#4a4e69';
        const bgCol = isSelected ? '#271e46' : isHovered ? '#1c1833' : '#141124';

        drawPixelPanel(ctx, cx, cy, cardW, cardH, bgCol, borderCol, 7, {
          glowColor: isSelected ? ch.themeColor : null,
          corners: true,
          headerBand: 22
        });

        // 顶部神龛修为系别铭牌
        const aff = affinityMeta[ch.affinity] || affinityMeta.red;
        ctx.textAlign = 'center';
        if (isSelected) {
          ctx.fillStyle = ch.themeColor;
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(`✦ 当前出战 · ${aff.short} ✦`, cx + cardW / 2, cy + 15);
        } else {
          ctx.fillStyle = aff.col;
          ctx.font = '10px sans-serif';
          ctx.fillText(`◇ ${ch.title} · ${aff.short}系 ◇`, cx + cardW / 2, cy + 15);
        }

        // 角色专属神话法阵光轮底座
        const pedY = cy + Math.min(92, Math.round(cardH * 0.36));
        this.renderHeroCardAura(ctx, ch, cx, cardW, pedY, isSelected, app.globalTime);

        // 绘制 76x88 微像素 32-Bit 实时纸娃娃角色模型（含背饰、神兵与套装贴图预览！）
        const heirloomEq = app.saveData && app.saveData.heirloomLoadout;
        const hasHeirloom = heirloomEq && Object.keys(heirloomEq).some((k) => !!heirloomEq[k]);
        const previewEq = curOutfitIdx > 0 ? curOutfit.equipped : hasHeirloom ? heirloomEq : null;
        const pdFrame = isSelected
          ? `run${Math.floor(app.globalTime * 8) % 4}`
          : Math.floor((app.globalTime + idx * 0.4) * 3.2) % 2 === 0
          ? 'idle0'
          : 'idle1';

        ctx.save();
        ctx.imageSmoothingEnabled = false;
        const dollScale = Math.min(1.52, Math.max(1.12, cardH / 196));
        ctx.translate(Math.round(cx + cardW / 2), pedY + 2);
        ctx.scale(dollScale, dollScale);
        const drewPaperDoll =
          app.assetLoader.renderHeroPaperDoll &&
          app.assetLoader.renderHeroPaperDoll(ctx, {
            heroId: ch.id,
            equipped: previewEq,
            frameKey: pdFrame,
            animTime: app.globalTime + idx * 0.7,
            moving: isSelected,
            airborne: false,
            attacking: false,
            hiRes: true
          });
        ctx.restore();

        if (!drewPaperDoll) {
          const spr = app.assetLoader.getHeroHiResSprite(
            ch.id,
            isSelected && Math.floor(app.globalTime * 5) % 2 === 0 ? 'run0' : 'idle'
          );
          if (spr) {
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            const fitScale = Math.min(1.05, Math.max(0.75, cardH / 286));
            const dw = Math.round(spr.width * fitScale);
            const dh = Math.round(spr.height * fitScale);
            ctx.drawImage(spr, Math.round(cx + cardW / 2 - dw / 2), pedY - dh + 3, dw, dh);
            ctx.restore();
          }
        }

        // 角色姓名与如意分割线
        const textBaseY = pedY + 18;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(ch.name, cx + cardW / 2, textBaseY);

        UITheme.drawDivider(ctx, cx + cardW / 2, textBaseY + 7, cardW - 22, ch.themeColor);

        // 兵刃与本命神通胶囊条
        const pillX = cx + 7;
        const pillW = cardW - 14;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(pillX, textBaseY + 12, pillW, 31);
        ctx.fillStyle = '#e0fbfc';
        ctx.font = '10px sans-serif';
        ctx.fillText(`⚔ ${ch.weaponName}`, cx + cardW / 2, textBaseY + 24);
        ctx.fillStyle = '#ffd166';
        ctx.fillText(`✦ ${ch.skillName.split('·')[0]}`, cx + cardW / 2, textBaseY + 39);

        // 三维属性可视化微缩进度条（气血 / 攻击 / 灵巧跳段）
        const statBarY = textBaseY + 49;
        const showBars = cardH >= 224;
        if (showBars) {
          const gaugeW = Math.max(36, cardW - 56);
          const gx = cx + 44;
          const drawMiniStat = (ry, tag, valR, col, valTxt) => {
            ctx.textAlign = 'left';
            ctx.fillStyle = '#adb5bd';
            ctx.font = '9px sans-serif';
            ctx.fillText(tag, cx + 9, ry + 6);
            ctx.fillStyle = '#0d0b18';
            ctx.fillRect(gx, ry, gaugeW, 6);
            ctx.fillStyle = col;
            ctx.fillRect(gx, ry, Math.round(gaugeW * Math.min(1, valR)), 6);
            if (valTxt && cardW >= 132) {
              ctx.textAlign = 'right';
              ctx.fillStyle = '#ced4da';
              ctx.fillText(valTxt, cx + cardW - 8, ry + 6);
            }
          };
          drawMiniStat(statBarY, '气血', ch.stats.maxHp / 175, '#ff5252', `${ch.stats.maxHp}`);
          drawMiniStat(statBarY + 10, '武力', ch.stats.atk / 28, '#ff9f1c', `${ch.stats.atk}`);
          const jumpTag = ch.stats.maxJumps >= 3 ? '三段跳' : '二段跳';
          drawMiniStat(statBarY + 20, '身法', ch.stats.maxJumps >= 3 ? 1.0 : ch.stats.moveSpeed / 220, '#4cc9f0', jumpTag);
        } else {
          ctx.fillStyle = '#adb5bd';
          ctx.font = '10px sans-serif';
          const jumpTag = ch.stats.maxJumps >= 3 ? '三段跳' : '二段跳';
          ctx.fillText(`血:${ch.stats.maxHp} 攻:${ch.stats.atk} ${jumpTag}`, cx + cardW / 2, statBarY + 10);
        }

        // 底部凹陷天赋竹简说明框
        const passiveTop = showBars ? statBarY + 32 : statBarY + 18;
        const passiveRestH = cy + cardH - passiveTop - 6;
        if (passiveRestH >= 18) {
          ctx.fillStyle = 'rgba(8, 6, 16, 0.52)';
          ctx.fillRect(cx + 6, passiveTop, cardW - 12, passiveRestH);
          ctx.fillStyle = '#98c1d9';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          const desc = ch.passiveDesc;
          const lineLen = Math.max(8, Math.floor((cardW - 14) / 10.6));
          for (let ln = 0; ln < 3; ln++) {
            const slice = desc.slice(ln * lineLen, (ln + 1) * lineLen);
            if (!slice) break;
            const ty = passiveTop + 12 + ln * 12;
            if (ty <= cy + cardH - 7) {
              ctx.fillText(slice, cx + cardW / 2, ty);
            }
          }
        }

        this.addButton(`sel_${ch.id}`, cx, cardTop, cardW, cardH, () => {
          app.selectedCharId = ch.id;
        }, { rippleColor: ch.themeColor });
      });

      // 5. 底部统一【黑金点将台指令船坞】（完美预留右侧模式/劫度与出征大按钮槽位）
      const selChar = CHARACTERS.find((c) => c.id === app.selectedCharId) || CHARACTERS[0];
      const footY = cardTop + cardH + 7;
      const startBtnW = Math.min(220, Math.round(sw * 0.28));
      const startBtnH = Math.max(40, Math.min(48, sh - footY - 7));
      const dockW = sw - safePad * 2;

      drawPixelPanel(ctx, safePad, footY - 2, dockW, startBtnH + 4, 'rgba(18, 14, 30, 0.92)', '#4a4e69', 6, {
        innerFrame: false
      });

      // 右侧预留宽度（兼顾炼器坊按钮 + 模式胶囊 + 劫度胶囊 + 主出战键，零文字重叠）
      const hasForgePill = sw > safePad * 2 + startBtnW + 390;
      const hasDirectorPills = sw > safePad * 2 + startBtnW + 265;
      const reservedRightW = hasForgePill ? startBtnW + 386 : hasDirectorPills ? startBtnW + 258 : startBtnW + 16;
      const infoMaxW = Math.max(110, dockW - reservedRightW - 16);

      // 左侧本命神通玉牌简介
      UITheme.drawSealStamp(ctx, safePad + 8, footY + Math.round((startBtnH - 28) / 2), 28, '神通', '#3c096c', '#ffd166');
      ctx.textAlign = 'left';
      ctx.fillStyle = selChar.themeColor;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`【${selChar.name} · ${selChar.skillName}】`, safePad + 42, footY + 16);
      ctx.fillStyle = '#ced4da';
      ctx.font = '11px sans-serif';
      const maxDescChars = Math.max(12, Math.floor((infoMaxW - 38) / 11.5));
      ctx.fillText(selChar.skillDesc.slice(0, maxDescChars), safePad + 42, footY + 34);

      const startX = sw - safePad - startBtnW - 4;
      UITheme.drawOrnateButton(
        ctx,
        startX,
        footY,
        startBtnW,
        startBtnH,
        '⚔ 随机西行 · 破劫',
        this.getBtnVisualState(startX, footY, startBtnW, startBtnH, {
          variant: 'primary',
          fontSize: 16,
          shimmerTime: app.globalTime
        })
      );
      this.addButton('btn_start_run', startX, footY, startBtnW, startBtnH, () => {
        app.startNewRun(app.selectedCharId);
      });

      // 6. 顶层图鉴与强化弹窗
      if (app.modal === 'META_SHOP') {
        this.renderMetaShopModal(ctx, sw, sh, app);
      } else if (app.modal === 'BESTIARY_81' && BestiaryModal) {
        BestiaryModal.renderBestiaryModal(ctx, sw, sh, app, this);
      } else if (app.modal === 'TERRAIN_ATLAS') {
        this.renderTerrainAtlasModal(ctx, sw, sh, app);
      }

      this.renderMockAdIfActive(ctx, sw, sh);
      this.renderRipples(ctx);
      this.renderToast(ctx, sw, sh, !!app.modal);
    }

    // ==================== 2. 土地庙局外永久强化弹窗（带进度格与香火纹） ====================
    renderMetaShopModal(ctx, sw, sh, app) {
      this.clearButtons();
      UITheme.drawModalBackdrop(ctx, sw, sh, app.globalTime, '#69f0ae');

      const mw = Math.min(650, sw - 28);
      const mh = Math.min(368, sh - 20);
      const mx = Math.round((sw - mw) / 2);
      const my = Math.round((sh - mh) / 2);

      this.beginModalPop(ctx, sw, sh);
      drawPixelPanel(ctx, mx, my, mw, mh, '#151226', '#69f0ae', 8, {
        headerBand: 44,
        topCrest: true,
        lattice: true,
        glowColor: '#69f0ae'
      });

      UITheme.drawSealStamp(ctx, mx + 14, my + 9, 26, '仙根', '#1b4332', '#69f0ae');
      ctx.textAlign = 'left';
      ctx.fillStyle = '#69f0ae';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`土地庙淬炼 · 灵蕴库：${app.saveData.souls}`, mx + 46, my + 28);

      const closeW = 50;
      const closeX = mx + mw - closeW - 12;
      UITheme.drawOrnateButton(
        ctx,
        closeX,
        my + 9,
        closeW,
        28,
        '关闭 ×',
        this.getBtnVisualState(closeX, my + 9, closeW, 28, { variant: 'slate', studs: false, fontSize: 11 })
      );
      this.addButton('meta_close', closeX, my + 9, closeW, 28, () => {
        app.modal = null;
      });

      const adBtnW = 142;
      const adBtnX = closeX - adBtnW - 8;
      UITheme.drawOrnateButton(
        ctx,
        adBtnX,
        my + 9,
        adBtnW,
        28,
        '🎬 赐福+60灵蕴',
        this.getBtnVisualState(adBtnX, my + 9, adBtnW, 28, {
          variant: 'purple',
          studs: false,
          fontSize: 11,
          shimmerTime: app.globalTime
        })
      );
      this.addButton('meta_ad_souls', adBtnX, my + 9, adBtnW, 28, () => {
        DouyinSDK.showRewardedAd({
          placement: 'bonus_souls',
          adUnitId: SDK_CONFIG.adUnitIds.rewardedBonusResource,
          mockTitle: '【抖音激励视频预留接口】土地公赐福 +60 灵蕴',
          onSuccess: () => {
            app.addPermanentSouls(60);
            this.showToast('成功获得 +60 灵蕴！');
          },
          onCancel: (msg) => this.showToast(msg)
        });
      });

      const upIcons = { hp_lv: '命', atk_lv: '武', flask_lv: '露', crit_lv: '睛' };
      const upColors = { hp_lv: '#ff5252', atk_lv: '#ff9f1c', flask_lv: '#69f0ae', crit_lv: '#ffd60a' };

      const itemH = Math.floor((mh - 64) / META_UPGRADES.length) - 6;
      META_UPGRADES.forEach((up, idx) => {
        const iy = my + 52 + idx * (itemH + 6);
        const curLv = app.saveData.metaLevels[up.id] || 0;
        const isMax = curLv >= up.maxLv;
        const cost = up.baseCost + curLv * up.costStep;
        const canBuy = !isMax && app.saveData.souls >= cost;
        const col = upColors[up.id] || '#ffd166';

        drawPixelPanel(ctx, mx + 14, iy, mw - 28, itemH, '#1e1a32', canBuy ? col : '#3d405b', 5);

        // 左侧仙根徽章印记
        UITheme.drawSealStamp(
          ctx,
          mx + 24,
          iy + Math.round((itemH - 34) / 2),
          34,
          upIcons[up.id] || '仙',
          '#120f20',
          col
        );

        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`${up.name}`, mx + 68, iy + 22);

        // 分段等级淬炼宝石格
        const pipStartX = mx + 178;
        for (let p = 0; p < up.maxLv; p++) {
          ctx.fillStyle = p < curLv ? col : '#2b2d42';
          ctx.fillRect(pipStartX + p * 11, iy + 13, 8, 8);
          ctx.strokeStyle = p < curLv ? '#ffffff' : '#4a4e69';
          ctx.lineWidth = 0.8;
          ctx.strokeRect(pipStartX + p * 11, iy + 13, 8, 8);
        }

        ctx.fillStyle = '#ced4da';
        ctx.font = '11px sans-serif';
        ctx.fillText(up.desc, mx + 68, iy + 41);

        const bw = 122;
        const bx = mx + mw - 24 - bw;
        const by = iy + Math.round((itemH - 32) / 2);
        UITheme.drawOrnateButton(
          ctx,
          bx,
          by,
          bw,
          32,
          isMax ? '✦ 已臻圆满' : `淬炼 (${cost}灵蕴)`,
          this.getBtnVisualState(bx, by, bw, 32, {
            variant: canBuy ? 'jade' : 'slate',
            disabled: !canBuy,
            studs: false,
            fontSize: 12
          })
        );

        if (canBuy) {
          this.addButton(`buy_${up.id}`, bx, by, bw, 32, () => {
            app.buyMetaUpgrade(up);
          });
        }
      });

      this.endModalPop(ctx);
    }

    // ==================== 3. 战斗 HUD、西行路引、八卦摇杆与全套弹窗 ====================
    renderCombatUI(ctx, sw, sh, app) {
      this.clearButtons();
      this.syncModalTransition(app.modal);

      const player = app.player;
      const level = app.level;
      if (!player || !level) return;

      const safeLeft = Math.max(14, Math.round(sw * 0.02));
      const safeRight = Math.max(14, Math.round(sw * 0.02));
      const hpRatio = Math.max(0, Math.min(1, player.hp / Math.max(1, player.maxHp)));
      const lowHpPulse = hpRatio < 0.3 ? 0.5 + 0.5 * Math.sin(app.globalTime * 10) : 0;

      // 濒死危急暗红呼吸暗角预警（增强生死一线沉浸氛围！）
      if (!app.modal && hpRatio > 0 && hpRatio < 0.3) {
        ctx.save();
        const warnGrad = ctx.createRadialGradient(sw / 2, sh / 2, sh * 0.32, sw / 2, sh / 2, sw * 0.65);
        warnGrad.addColorStop(0, 'rgba(255, 0, 50, 0)');
        warnGrad.addColorStop(1, `rgba(214, 18, 46, ${(0.14 + lowHpPulse * 0.16).toFixed(2)})`);
        ctx.fillStyle = warnGrad;
        ctx.fillRect(0, 0, sw, sh);
        ctx.restore();
      }

      // 1. 左上角行者战况仪（角色头像框 + 三才玉珠 + 残影红蓝双槽 + 玉净瓶 + 披挂甲徽）
      const hudW = 304;
      const hudH = 88;
      drawPixelPanel(
        ctx,
        safeLeft,
        8,
        hudW,
        hudH,
        'rgba(14, 11, 26, 0.90)',
        hpRatio < 0.3 ? '#ff2a54' : player.charDef.themeColor,
        6,
        { corners: true }
      );

      // 1A. 角色像素头像神龛框
      const avX = safeLeft + 8;
      const avY = 15;
      const avS = 44;
      drawPixelPanel(ctx, avX, avY, avS, avS, '#0d0a1a', player.shieldHp > 0 ? '#80ffdb' : player.charDef.themeColor, 4, {
        shadow: false,
        innerFrame: false
      });
      const heroSpr = app.assetLoader.getCompositeHeroSprite
        ? app.assetLoader.getCompositeHeroSprite(player.id, player.equipped, 'idle0', false)
        : app.assetLoader.getHeroSprite(player.id, 'idle');
      if (heroSpr) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(avX + 2, avY + 2, avS - 4, avS - 4);
        ctx.clip();
        ctx.imageSmoothingEnabled = false;
        const baseW = heroSpr._logicalW || heroSpr.width;
        const baseH = heroSpr._logicalH || heroSpr.height;
        const sc = 1.48;
        const dw = Math.round(baseW * sc);
        const dh = Math.round(baseH * sc);
        const anchorX = heroSpr._logicalW ? 23 * sc : dw / 2;
        ctx.drawImage(heroSpr, Math.round(avX + avS / 2 - anchorX), Math.round(avY - 4), dw, dh);
        ctx.restore();
      }

      // 角色名压底小标
      ctx.fillStyle = 'rgba(12, 10, 22, 0.85)';
      ctx.fillRect(avX + 2, avY + avS - 12, avS - 4, 10);
      ctx.textAlign = 'center';
      ctx.fillStyle = player.charDef.themeColor;
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(player.charDef.name, avX + avS / 2, avY + avS - 4);

      // 1B. 顶排：三才天书徽记（红/紫/绿镶边小牌）+ 灵蕴魂火 + 铜钱金铢
      const statLeftX = avX + avS + 7;
      const scrollBadges = [
        { label: `斗${player.scrolls.red}`, bg: '#4a101d', col: '#ff5252' },
        { label: `妙${player.scrolls.purple}`, bg: '#2c124a', col: '#c77dff' },
        { label: `金${player.scrolls.green}`, bg: '#113829', col: '#69f0ae' }
      ];
      scrollBadges.forEach((sb, idx) => {
        const bx = statLeftX + idx * 30;
        ctx.fillStyle = sb.bg;
        ctx.fillRect(bx, 13, 27, 13);
        ctx.strokeStyle = sb.col;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, 13, 27, 13);
        ctx.textAlign = 'center';
        ctx.fillStyle = sb.col;
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(sb.label, bx + 13.5, 23);
      });

      // 灵蕴与铜钱图标计数
      const resX = statLeftX + 94;
      ctx.textAlign = 'left';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#72efdd';
      ctx.fillText(`✦${player.runSouls}`, resX, 23);
      ctx.fillStyle = '#ffd60a';
      ctx.fillText(`◈${player.gold}`, resX + 44, 23);

      // 1C. 双色高光气血条 (含残影白条 & 护盾晶层) + 法力蓝条
      const barW = 132;
      const hpY = 30;
      UITheme.drawGlossyBar(ctx, statLeftX, hpY, barW, 14, hpRatio, {
        lagRatio: this.hpLagRatio,
        shieldRatio: player.shieldHp > 0 ? player.shieldHp / Math.max(1, player.maxHp) : 0,
        colorTop: '#ff5c77',
        colorMid: '#e63946',
        colorBottom: '#9d0208',
        border: hpRatio < 0.3 ? '#ffba08' : 'rgba(255, 255, 255, 0.3)',
        label: player.shieldHp > 0 ? `${player.hp}/${player.maxHp}+${player.shieldHp}` : `HP ${player.hp}/${player.maxHp}`
      });

      const mpY = 47;
      const mpRatio = Math.max(0, Math.min(1, (player.mp || 0) / Math.max(1, player.maxMp || 100)));
      UITheme.drawGlossyBar(ctx, statLeftX, mpY, barW, 11, mpRatio, {
        colorTop: '#48cae4',
        colorMid: '#0096c7',
        colorBottom: '#023e8a',
        border: 'rgba(144, 224, 239, 0.35)',
        segments: false,
        label: `MP ${Math.floor(player.mp || 0)}/${player.maxMp}`
      });

      // 1D. 右侧【甘露玉净瓶】与【披挂甲徽】立体插槽按钮
      const flaskX = statLeftX + barW + 6;
      const flaskY = 28;
      const slotW = 50;
      const slotH = 44;
      const hasFlask = player.flaskCharges > 0;
      drawPixelPanel(ctx, flaskX, flaskY, slotW, slotH, '#122b22', hasFlask ? '#69f0ae' : '#495057', 4, {
        shadow: false,
        innerFrame: false
      });
      // 手绘翡翠玉净瓶图标 + 瓶内液位高度
      const vx = flaskX + 14;
      const vy = flaskY + 23;
      ctx.fillStyle = '#091913';
      ctx.beginPath();
      ctx.arc(vx, vy + 4, 8, 0, Math.PI * 2);
      ctx.fill();
      if (hasFlask) {
        const fillRatio = player.flaskCharges / Math.max(1, player.maxFlaskCharges);
        ctx.save();
        ctx.beginPath();
        ctx.arc(vx, vy + 4, 7, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = '#00f5d4';
        ctx.fillRect(vx - 8, vy + 11 - Math.round(14 * fillRatio), 16, 15);
        ctx.restore();
      }
      ctx.strokeStyle = hasFlask ? '#69f0ae' : '#6c757d';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(vx, vy + 4, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = hasFlask ? '#69f0ae' : '#6c757d';
      ctx.fillRect(vx - 2, vy - 8, 4, 5);
      ctx.fillRect(vx - 4, vy - 9, 8, 2);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#69f0ae';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('甘露[H]', flaskX + slotW / 2 + 4, flaskY + 12);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace, sans-serif';
      ctx.fillText(`${player.flaskCharges}/${player.maxFlaskCharges}`, flaskX + 34, flaskY + 32);
      if (!app.modal) {
        this.addButton('hud_flask', flaskX, flaskY, slotW, slotH, () => {
          player.useFlask(app.effects);
        }, { rippleColor: '#69f0ae' });
      }

      // 披挂装备栏按钮（含四颗菱形品质宝石灯！）
      const bagX = flaskX + slotW + 5;
      const bagY = 28;
      drawPixelPanel(ctx, bagX, bagY, slotW, slotH, '#211838', '#ffd166', 4, {
        shadow: false,
        innerFrame: false
      });
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('披挂[B]', bagX + slotW / 2, bagY + 12);

      EQUIP_SLOTS.forEach((sl, sIdx) => {
        const eqItem = player.equipped && player.equipped[sl.id];
        const stepG = EQUIP_SLOTS.length > 4 ? 8.6 : 10.5;
        const gx = bagX + (EQUIP_SLOTS.length > 4 ? 7.8 : 9) + sIdx * stepG;
        const gy = bagY + 29;
        ctx.fillStyle = eqItem ? eqItem.rarityColor : '#2b2d42';
        ctx.beginPath();
        ctx.moveTo(gx, gy - 4.5);
        ctx.lineTo(gx + 4.2, gy);
        ctx.lineTo(gx, gy + 4.5);
        ctx.lineTo(gx - 4.2, gy);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = eqItem ? '#ffffff' : '#4a4e69';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });
      if (!app.modal) {
        this.addButton('hud_equip_panel', bagX, bagY, slotW, slotH, () => {
          app.modal = 'EQUIP_PANEL';
        });
      }

      // 1E. 底部紧凑四维属性刻线栏
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(safeLeft + 8, 74, hudW - 16, 1);
      ctx.textAlign = 'left';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#ff9f1c';
      ctx.fillText(`⚔攻 ${player.atk}`, safeLeft + 10, 88);
      ctx.fillStyle = '#c77dff';
      ctx.fillText(`✦魔 ${player.magic}`, safeLeft + 76, 88);
      ctx.fillStyle = '#69f0ae';
      ctx.fillText(`🛡防 ${player.armor}`, safeLeft + 142, 88);
      ctx.fillStyle = '#ffd60a';
      ctx.fillText(`⚡暴 ${Math.round(player.critRate * 100)}%`, safeLeft + 208, 88);

      // 1F. 主角实时 Buff 与负面 Debuff 动态状态胶囊栏（含持续时间进度槽）
      if (player.getActiveStatusList) {
        const statuses = player.getActiveStatusList();
        if (statuses.length > 0) {
          let sxChip = safeLeft;
          const syChip = 100;
          ctx.save();
          ctx.font = 'bold 9.5px sans-serif';
          for (let i = 0; i < statuses.length && i < 5; i++) {
            const st = statuses[i];
            const chipW = Math.max(52, Math.round(ctx.measureText(st.label).width + 14));
            const pulseAlpha = st.isDebuff ? 0.85 + Math.sin(app.globalTime * 14) * 0.15 : 0.92;
            ctx.globalAlpha = pulseAlpha;
            drawPixelPanel(
              ctx,
              sxChip,
              syChip,
              chipW,
              18,
              st.isDebuff ? 'rgba(42, 10, 24, 0.9)' : 'rgba(16, 20, 36, 0.88)',
              st.color,
              3,
              { shadow: false, innerFrame: false }
            );
            ctx.fillStyle = st.color;
            ctx.fillRect(sxChip + 2, syChip + 15, Math.max(2, Math.round((chipW - 4) * (st.ratio || 0))), 2);
            ctx.textAlign = 'center';
            ctx.fillText(st.label, sxChip + chipW * 0.5, syChip + 12);
            sxChip += chipW + 5;
          }
          ctx.restore();
        }
      }

      // 2. 右上角【西行路引进度条】与快捷操作舱
      const stageBoxW = 254;
      const stageBoxX = sw - stageBoxW - safeRight;
      drawPixelPanel(ctx, stageBoxX, 8, stageBoxW, 68, 'rgba(14, 11, 26, 0.88)', '#5c6282', 6, {
        corners: true
      });
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 11px sans-serif';
      const loopLabel = level.loopCount > 0 ? ` [轮回+${level.loopCount}]` : '';
      ctx.fillText(`${level.biome.name}${loopLabel}`, sw - safeRight - 10, 23);

      // 实时西行关卡进度路引条（起点土地庙 ⛩ -> 奇遇祭坛 ✦ -> 守关妖王殿 👹）
      const trackX = stageBoxX + 18;
      const trackW = stageBoxW - 36;
      const trackY = 33;
      const progRatio = Math.max(0, Math.min(1, player.x / Math.max(1, level.widthPx || 2400)));
      ctx.fillStyle = '#242038';
      ctx.fillRect(trackX, trackY - 1.5, trackW, 3);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(trackX, trackY - 1.5, Math.round(trackW * progRatio), 3);
      // 起点 / 中段 / Boss 节点刻标
      ctx.fillStyle = '#69f0ae';
      ctx.fillRect(trackX - 2, trackY - 3, 4, 6);
      ctx.fillStyle = '#c77dff';
      ctx.fillRect(trackX + Math.round(trackW * 0.52) - 2, trackY - 3, 4, 6);
      ctx.fillStyle = '#ff4d6d';
      ctx.fillRect(trackX + trackW - 2, trackY - 4, 5, 8);
      // 行者当前光标金点
      const dotX = trackX + Math.round(trackW * progRatio);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(dotX, trackY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = player.charDef.themeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 3个精致功能小按钮
      const recX = stageBoxX + 8;
      const btnRowY = 43;
      const isRec = DouyinSDK.isRecording();
      UITheme.drawOrnateButton(
        ctx,
        recX,
        btnRowY,
        82,
        26,
        isRec ? '⏹分享录屏' : '📹抖音录屏',
        this.getBtnVisualState(recX, btnRowY, 82, 26, {
          variant: isRec ? 'primary' : 'crimson',
          studs: false,
          fontSize: 10,
          badgeDot: isRec && Math.floor(app.globalTime * 4) % 2 === 0 ? '#ffffff' : null
        })
      );
      if (!app.modal) {
        this.addButton('hud_record', recX, btnRowY, 82, 26, () => {
          if (DouyinSDK.isRecording()) {
            DouyinSDK.stopRecord();
            DouyinSDK.shareGameOrVideo((ok, msg) => this.showToast(msg));
          } else {
            DouyinSDK.startRecord(120);
            this.showToast('已开启高光录屏！再次点击可分享');
          }
        });
      }

      const touchToggleX = recX + 86;
      UITheme.drawOrnateButton(
        ctx,
        touchToggleX,
        btnRowY,
        72,
        26,
        this.showTouchControls ? '🕹摇杆:显' : '🕹摇杆:隐',
        this.getBtnVisualState(touchToggleX, btnRowY, 72, 26, { variant: 'cyan', studs: false, fontSize: 10 })
      );
      if (!app.modal) {
        this.addButton('hud_toggle_touch', touchToggleX, btnRowY, 72, 26, () => {
          this.showTouchControls = !this.showTouchControls;
          this.resetTouchState();
        });
      }

      const homeX = touchToggleX + 76;
      UITheme.drawOrnateButton(
        ctx,
        homeX,
        btnRowY,
        76,
        26,
        '🏕返回营地',
        this.getBtnVisualState(homeX, btnRowY, 76, 26, { variant: 'slate', studs: false, fontSize: 10 })
      );
      if (!app.modal) {
        this.addButton('hud_home', homeX, btnRowY, 76, 26, () => {
          app.returnToTitle();
        });
      }

      // 3. 疾风连斩战意计量榜（阶梯焰色 + 战意移速提速显示）
      if (player.hitStreak >= 2 && player.hitStreakTimer > 0) {
        const cx = sw - safeRight - 96;
        const cy = 96;
        const tier =
          player.hitStreak >= 25
            ? { rank: '齐天灭神!', col: '#ff2a54', bg: '#3b0918' }
            : player.hitStreak >= 15
            ? { rank: '斗战无双!', col: '#ff9f1c', bg: '#381808' }
            : player.hitStreak >= 8
            ? { rank: '势如破竹!', col: '#ffd60a', bg: '#2d220c' }
            : { rank: '疾风连斩', col: '#4cc9f0', bg: '#13243b' };

        const spdBonus = Math.round(Math.min(1, player.hitStreak / 25) * 22);
        ctx.save();
        const pulse = 1 + Math.sin(app.globalTime * 18) * 0.045;
        ctx.translate(cx, cy);
        ctx.scale(pulse, pulse);
        drawPixelPanel(ctx, -78, -18, 156, 46, tier.bg, tier.col, 5, { glowColor: tier.col });

        ctx.textAlign = 'center';
        ctx.fillStyle = tier.col;
        ctx.font = 'bold 14px monospace, sans-serif';
        ctx.fillText(`🔥 ${player.hitStreak} 连斩 · ${tier.rank}`, 0, -1);

        ctx.fillStyle = '#e0fbfc';
        ctx.font = '9px sans-serif';
        ctx.fillText(`战意提速 +${spdBonus}%  |  冷却加速`, 0, 12);

        UITheme.drawGlossyBar(ctx, -64, 17, 128, 6, player.hitStreakTimer / 3.2, {
          colorTop: '#ffd60a',
          colorBottom: tier.col,
          segments: false
        });
        ctx.restore();
      }

      // 4. 守关妖王镇魔巨型血槽（双侧瑞兽魔角饰 + 朱砂妖王印 + 受击白条）
      const boss = app.bossEntity;
      if (boss && boss.activated && !boss.dead) {
        const bw = Math.min(346, Math.round(sw * 0.40));
        const bx = Math.round((sw - bw) / 2);
        const by = 10;
        drawPixelPanel(ctx, bx - 12, by - 2, bw + 24, 46, 'rgba(26, 8, 16, 0.94)', '#ffba08', 6, {
          glowColor: '#dc2f02',
          corners: true
        });

        // 左右对称鎏金镇魔角饰
        ctx.fillStyle = '#ffba08';
        ctx.beginPath();
        ctx.moveTo(bx - 12, by + 16);
        ctx.lineTo(bx - 22, by + 8);
        ctx.lineTo(bx - 15, by + 26);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(bx + bw + 12, by + 16);
        ctx.lineTo(bx + bw + 22, by + 8);
        ctx.lineTo(bx + bw + 15, by + 26);
        ctx.closePath();
        ctx.fill();

        UITheme.drawSealStamp(ctx, bx - 4, by + 3, 18, '妖', '#9d0208', '#ffd166');
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffba08';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(`${boss.name}`, sw / 2 + 6, by + 16);

        const bossR = Math.max(0, Math.min(1, boss.hp / Math.max(1, boss.maxHp)));
        UITheme.drawGlossyBar(ctx, bx, by + 22, bw, 15, bossR, {
          lagRatio: this.bossLagRatio,
          colorTop: '#ff4d6d',
          colorMid: '#dc2f02',
          colorBottom: '#6a040f',
          border: '#ffba08',
          segments: 4,
          label: `${boss.hp} / ${boss.maxHp}`
        });

        // 妖王当前承受的负面 Debuff 徽章栏（灼烧/撕裂/寒霜/感电/破甲/眩晕）
        if (boss.getActiveDebuffList) {
          const bDebuffs = boss.getActiveDebuffList();
          if (bDebuffs.length > 0) {
            const chipW = 54;
            const gap = 5;
            const totalW = bDebuffs.length * (chipW + gap) - gap;
            let startX = Math.round((sw - totalW) / 2);
            const dbY = 85;
            ctx.save();
            ctx.font = 'bold 9.5px sans-serif';
            for (let i = 0; i < bDebuffs.length; i++) {
              const db = bDebuffs[i];
              drawPixelPanel(ctx, startX, dbY, chipW, 17, 'rgba(22, 10, 20, 0.9)', db.color, 3, {
                shadow: false,
                innerFrame: false
              });
              ctx.fillStyle = db.color;
              ctx.fillRect(startX + 2, dbY + 14, Math.max(2, Math.round((chipW - 4) * db.ratio)), 2);
              ctx.textAlign = 'center';
              const stk = db.stacks > 1 ? `×${db.stacks}` : '';
              ctx.fillText(`${db.fullName}${stk}`, startX + chipW * 0.5, dbY + 11.5);
              startX += chipW + gap;
            }
            ctx.restore();
          }
        }
      }

      // 4B. 关卡入场【展开式锦缎画轴横幅】 + 黄风三昧狂沙预警
      if (!app.modal && !(boss && boss.activated && !boss.dead)) {
        if (app.stageBannerTimer > 0 && level.region) {
          const totalDur = 3.4;
          const elapsed = Math.max(0, totalDur - app.stageBannerTimer);
          const openRatio = Math.min(1, elapsed / 0.36);
          const fadeOut = Math.min(1, app.stageBannerTimer * 1.6);
          const maxScrollW = Math.min(436, sw - 280);
          if (maxScrollW >= 210) {
            ctx.save();
            ctx.globalAlpha = fadeOut;
            UITheme.drawUnrollingScroll(
              ctx,
              sw / 2,
              10,
              maxScrollW,
              46,
              openRatio,
              `${level.biome.name}`,
              `独立地貌：${level.region.terrainLabel}`,
              level.region.tileTop || '#ffd166'
            );
            ctx.restore();
          }
        } else if (level.windCurrentForce && Math.abs(level.windCurrentForce) > 5) {
          const bw = 258;
          const bx = Math.round((sw - bw) / 2);
          drawPixelPanel(ctx, bx, 12, bw, 26, 'rgba(74, 44, 17, 0.92)', '#f4a261', 4);
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ffd166';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('🌪 三昧黄风吹袭！贴靠沙岩掩体可挡风', sw / 2, 29);
        }
      }

      // 5. 场景交互物触屏流光大按钮
      if (!app.modal && app.nearbyInteractable) {
        const inter = app.nearbyInteractable;
        const iw = Math.min(276, Math.max(236, inter.label.length * 14 + 44));
        const ih = 40;
        const ix = Math.round((sw - iw) / 2);
        const iy = sh - 66;
        UITheme.drawOrnateButton(
          ctx,
          ix,
          iy,
          iw,
          ih,
          `🖐 ${inter.label} [F]`,
          this.getBtnVisualState(ix, iy, iw, ih, {
            variant: 'token',
            bg: '#2d224c',
            bgBottom: '#161129',
            border: '#ffd166',
            textColor: '#ffd166',
            fontSize: 13,
            shimmerTime: app.globalTime
          })
        );
        this.addButton('hud_interact', ix, iy, iw, ih, () => {
          app.triggerInteract(inter);
        });
      }

      // 6. 手机八卦罗盘摇杆与雕花神通圆键
      if (!app.modal && this.showTouchControls) {
        this.renderVirtualControls(ctx, sw, sh, player, app.globalTime);
      }

      // 7. 叠加模态弹窗
      if (app.modal === 'SCROLL_PICK') {
        this.renderScrollPickModal(ctx, sw, sh, app);
      } else if (app.modal === 'EQUIP_COMPARE') {
        this.renderEquipCompareModal(ctx, sw, sh, app);
      } else if (app.modal === 'EQUIP_PANEL') {
        this.renderEquipPanelModal(ctx, sw, sh, app);
      } else if (app.modal === 'TERRAIN_ATLAS') {
        this.renderTerrainAtlasModal(ctx, sw, sh, app);
      } else if (app.modal === 'STAGE_CLEAR') {
        this.renderStageClearModal(ctx, sw, sh, app);
      } else if (app.modal === 'DEATH_REVIVE') {
        this.renderDeathReviveModal(ctx, sw, sh, app);
      } else if (app.modal === 'RUN_OVER') {
        this.renderRunOverModal(ctx, sw, sh, app);
      }

      this.renderMockAdIfActive(ctx, sw, sh);
      this.renderRipples(ctx);
      this.renderToast(ctx, sw, sh, !!app.modal);
    }

    // ==================== 八卦罗盘虚拟摇杆 + 扇形冷却武道技能圆键 ====================
    renderVirtualControls(ctx, sw, sh, player, globalTime) {
      const layout = this.getTouchLayout(sw, sh);
      ctx.save();

      // 1. 左侧动态八卦罗盘虚拟摇杆
      const activeJoy = this.joyTouchId !== null;
      const jc = activeJoy ? this.joyCenter : layout.joy;
      const jk = activeJoy ? this.joyKnob : layout.joy;
      const jr = layout.joy.r;

      ctx.save();
      ctx.globalAlpha = activeJoy ? 0.84 : 0.48;
      // 罗盘暗金底盘
      const joyGrad = ctx.createRadialGradient(jc.x, jc.y, 8, jc.x, jc.y, jr);
      joyGrad.addColorStop(0, 'rgba(34, 28, 56, 0.92)');
      joyGrad.addColorStop(1, 'rgba(12, 10, 22, 0.95)');
      ctx.fillStyle = joyGrad;
      ctx.beginPath();
      ctx.arc(jc.x, jc.y, jr, 0, Math.PI * 2);
      ctx.fill();

      // 双层八卦刻度环
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = activeJoy ? '#00f5d4' : '#90e0ef';
      ctx.stroke();

      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 209, 102, 0.35)';
      ctx.beginPath();
      ctx.arc(jc.x, jc.y, jr - 7, 0, Math.PI * 2);
      ctx.stroke();

      // 八卦方位短爻刻度与东西南三角箭头
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(jc.x + Math.cos(a) * (jr - 11), jc.y + Math.sin(a) * (jr - 11));
        ctx.lineTo(jc.x + Math.cos(a) * (jr - 4), jc.y + Math.sin(a) * (jr - 4));
        ctx.stroke();
      }

      // 激活方向扇形高亮弧与牵引金线
      if (activeJoy && Math.hypot(jk.x - jc.x, jk.y - jc.y) > 8) {
        const ang = Math.atan2(jk.y - jc.y, jk.x - jc.x);
        ctx.strokeStyle = this.touchDown ? '#ff9f1c' : '#00f5d4';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(jc.x, jc.y, jr + 1, ang - 0.45, ang + 0.45);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(144, 224, 239, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(jc.x, jc.y);
        ctx.lineTo(jk.x, jk.y);
        ctx.stroke();
      }

      // 灵玉摇杆拇指球
      ctx.globalAlpha = activeJoy ? 0.96 : 0.76;
      const knobCol = this.touchDown ? '#ff9f1c' : activeJoy ? '#00f5d4' : '#90e0ef';
      const knobGrad = ctx.createRadialGradient(jk.x - 5, jk.y - 5, 2, jk.x, jk.y, 22);
      knobGrad.addColorStop(0, '#ffffff');
      knobGrad.addColorStop(0.35, knobCol);
      knobGrad.addColorStop(1, '#1d3557');
      ctx.fillStyle = knobGrad;
      ctx.beginPath();
      ctx.arc(jk.x, jk.y, 21, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();

      // 2. 右侧武道雕花动作圆键（带矢量武道图腾、顺时针扇形CD遮罩与键帽标）
      const drawCircleBtn = (btn, actKey, cdLeft, cdMax, enabled, extraSub) => {
        if (enabled === false) return;
        const pressed = this.isActionPressed(actKey);
        const onCd = cdLeft > 0.02;

        ctx.save();
        ctx.translate(btn.x, btn.y);
        if (pressed) ctx.scale(0.91, 0.91);

        // 底座外阴影与按压光晕
        ctx.globalAlpha = onCd ? 0.62 : pressed ? 0.98 : 0.84;
        if (pressed) {
          ctx.fillStyle = UITheme.withAlpha(btn.color, 0.32);
          ctx.beginPath();
          ctx.arc(0, 0, btn.r + 5, 0, Math.PI * 2);
          ctx.fill();
        }

        // 圆钮双层漆面底
        const bgGrad = ctx.createRadialGradient(0, -btn.r * 0.3, 4, 0, 0, btn.r);
        bgGrad.addColorStop(0, pressed ? '#3b2c54' : '#251f3d');
        bgGrad.addColorStop(1, '#110e1f');
        ctx.fillStyle = bgGrad;
        ctx.beginPath();
        ctx.arc(0, 0, btn.r, 0, Math.PI * 2);
        ctx.fill();

        // 背景武道矢量图腾暗纹
        UITheme.drawCombatActionGlyph(ctx, actKey, onCd ? '#6c757d' : btn.color, btn.r);

        // 顺时针扇形冷却遮罩
        if (onCd && cdMax > 0) {
          const cdRatio = Math.min(1, cdLeft / cdMax);
          ctx.fillStyle = 'rgba(6, 5, 14, 0.72)';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, btn.r - 2, -Math.PI / 2, -Math.PI / 2 + cdRatio * Math.PI * 2);
          ctx.closePath();
          ctx.fill();
        }

        // 内环金丝与外环主题描边
        ctx.lineWidth = 1;
        ctx.strokeStyle = UITheme.withAlpha(btn.color, 0.28);
        ctx.beginPath();
        ctx.arc(0, 0, btn.r - 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.lineWidth = pressed ? 3.2 : 2.2;
        ctx.strokeStyle = onCd ? '#6c757d' : pressed ? '#ffffff' : btn.color;
        ctx.beginPath();
        ctx.arc(0, 0, btn.r, 0, Math.PI * 2);
        ctx.stroke();

        // 上下左右四个微缩铆钉点
        if (!onCd && btn.r >= 30) {
          ctx.fillStyle = btn.color;
          ctx.fillRect(-1.5, -btn.r - 1, 3, 3);
          ctx.fillRect(-1.5, btn.r - 2, 3, 3);
        }

        // 主技能名 / CD 倒计时读秒
        ctx.globalAlpha = 0.98;
        ctx.textAlign = 'center';
        const fSize = btn.r >= 38 ? 15 : 12;
        ctx.font = `bold ${fSize}px sans-serif`;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillText(onCd ? `${cdLeft.toFixed(1)}s` : btn.label, 0, 3);
        ctx.fillStyle = onCd ? '#ced4da' : '#ffffff';
        ctx.fillText(onCd ? `${cdLeft.toFixed(1)}s` : btn.label, 0, 2);

        // 底部迷你键位胶囊标
        const subLabel = extraSub || btn.sub;
        ctx.fillStyle = 'rgba(10, 8, 20, 0.86)';
        ctx.fillRect(-16, btn.r - 13, 32, 11);
        ctx.fillStyle = onCd ? '#adb5bd' : btn.color;
        ctx.font = 'bold 9px monospace, sans-serif';
        ctx.fillText(subLabel, 0, btn.r - 5);

        ctx.restore();
      };

      const rollMax = (player.charDef && player.charDef.stats && player.charDef.stats.rollCd) || 1.1;
      const skillMax = (player.charDef && player.charDef.skillCd) || 8.0;

      drawCircleBtn(layout.attack, 'attack', 0, 1, true);
      drawCircleBtn(layout.jump, 'jump', 0, 1, true);
      drawCircleBtn(layout.roll, 'roll', player.rollCdTimer, rollMax, true);
      drawCircleBtn(layout.skill, 'skill', player.skillCdTimer, skillMax, true);
      drawCircleBtn(layout.slam, 'slam', 0, 1, !player.onGround);

      if (player.subWeapon) {
        const subDef = getSubWeaponById(player.subWeapon);
        drawCircleBtn(
          layout.subWep,
          'subWeapon',
          player.subWeaponCdTimer,
          (subDef && subDef.cd) || 5.0,
          true,
          subDef.name.slice(0, 3)
        );
      }

      void globalTime;
      ctx.restore();
    }

    /**
     * 绘制单张装备详情卡片（增加高品神兵背光星芒、印章品阶与清晰词条排版）
     */
    drawEquipItemCard(ctx, x, y, w, h, item, tagTitle, compareBaseScore, assetLoader) {
      if (!item) {
        drawPixelPanel(ctx, x, y, w, h, '#171428', '#3d405b', 6, { corners: true });
        UITheme.drawDivider(ctx, x + w / 2, y + h / 2 - 16, w * 0.55, '#4a4e69');
        ctx.textAlign = 'center';
        ctx.fillStyle = '#8d99ae';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(tagTitle || '当前槽位未穿戴披挂', x + w / 2, y + h / 2 + 6);
        ctx.fillStyle = '#6c757d';
        ctx.font = '11px sans-serif';
        ctx.fillText('斩杀劫难妖魔与开启宝匣即可掉落', x + w / 2, y + h / 2 + 26);
        return;
      }

      drawPixelPanel(ctx, x, y, w, h, '#161328', item.rarityColor, 6, {
        corners: true,
        glowColor: item.rarityIndex >= 3 ? item.rarityColor : null
      });

      // 顶部稀有度氛围横带
      ctx.fillStyle = item.bgTint;
      ctx.fillRect(x + 3, y + 3, w - 6, 56);

      // 像素装备高清图标框 + 仙/神/圣品放射金芒背光
      const iconBoxX = x + 10;
      const iconBoxY = y + 9;
      drawPixelPanel(ctx, iconBoxX, iconBoxY, 44, 44, '#0d0a18', item.rarityColor, 4, {
        shadow: false,
        innerFrame: false
      });
      if (item.rarityIndex >= 2) {
        ctx.save();
        ctx.translate(iconBoxX + 22, iconBoxY + 22);
        ctx.strokeStyle = UITheme.withAlpha(item.rarityColor, 0.34);
        ctx.lineWidth = 1.2;
        for (let r = 0; r < 6; r++) {
          const a = (r * Math.PI) / 3 + 0.2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6);
          ctx.lineTo(Math.cos(a) * 19, Math.sin(a) * 19);
          ctx.stroke();
        }
        ctx.restore();
      }
      const spr = assetLoader.getEquipSprite(item.iconKey, true);
      if (spr) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(spr, Math.round(iconBoxX + 22 - spr.width / 2), Math.round(iconBoxY + 22 - spr.height / 2));
        ctx.restore();
      }

      // 名称、品质、部位与战力评分
      ctx.textAlign = 'left';
      ctx.fillStyle = item.rarityColor;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`【${item.rarityName}】${item.name}`, x + 60, y + 26);

      ctx.fillStyle = '#e0fbfc';
      ctx.font = '11px sans-serif';
      ctx.fillText(`${item.slotName} · Lv.${item.level} · 战力 ${item.score}`, x + 62, y + 45);

      if (compareBaseScore !== undefined && compareBaseScore !== null) {
        const diff = item.score - compareBaseScore;
        const badgeCol = diff >= 0 ? '#69f0ae' : '#ff4d6d';
        ctx.textAlign = 'right';
        ctx.fillStyle = badgeCol;
        ctx.font = 'bold 12px monospace, sans-serif';
        ctx.fillText(diff >= 0 ? `▲+${diff}` : `▼${diff}`, x + w - 10, y + 26);
      } else if (tagTitle) {
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffd166';
        ctx.font = '10px sans-serif';
        ctx.fillText(tagTitle, x + w - 10, y + 25);
      }

      // 基础白字属性双栏
      let curY = y + 75;
      const baseLines = formatBaseStatLines(item.baseStats);
      ctx.textAlign = 'left';
      ctx.font = 'bold 12px sans-serif';
      baseLines.forEach((bl, idx) => {
        const colX = idx % 2 === 0 ? x + 12 : x + Math.round(w * 0.52);
        const rowY = curY + Math.floor(idx / 2) * 18;
        ctx.fillStyle = bl.color;
        ctx.fillText(`◆ ${bl.text}`, colX, rowY);
      });
      curY += Math.ceil(baseLines.length / 2) * 18 + 6;

      UITheme.drawDivider(ctx, x + w / 2, curY - 9, w - 24, item.rarityColor);

      // 随机附加词条列表
      ctx.textAlign = 'left';
      ctx.font = '12px sans-serif';
      (item.affixes || []).forEach((af) => {
        if (curY > y + h - (item.special ? 46 : 10)) return;
        ctx.fillStyle = af.color || '#90e0ef';
        ctx.fillText(`✦ ${af.label} +${af.val}${af.unit}`, x + 14, curY);
        curY += 16;
      });

      // 神品/圣品专属金色铭文框
      if (item.special) {
        const spY = y + h - 39;
        drawPixelPanel(ctx, x + 7, spY - 12, w - 14, 35, 'rgba(255, 209, 102, 0.12)', '#ffd60a', 3, {
          shadow: false,
          innerFrame: false
        });
        ctx.fillStyle = '#ffd60a';
        ctx.textAlign = 'left';
        ctx.font = 'bold 11px sans-serif';
        const fullTxt = `★【${item.special.name}】${item.special.desc}`;
        const maxChars = Math.max(16, Math.floor((w - 24) / 11.2));
        ctx.fillText(fullTxt.slice(0, maxChars), x + 12, spY + 1);
        if (fullTxt.length > maxChars) {
          ctx.fillText(fullTxt.slice(maxChars, maxChars * 2), x + 12, spY + 16);
        }
      }
    }

    // ==================== 4A. 地面掉落装备词条对比、穿戴、分解与仙炉升品弹窗 ====================
    renderEquipCompareModal(ctx, sw, sh, app) {
      this.clearButtons();
      const drop = app.pendingEquipDrop;
      if (!drop || !drop.equipItem || !app.player) {
        app.modal = null;
        return;
      }
      const newItem = drop.equipItem;
      const curItem = app.player.equipped[newItem.slot] || null;

      UITheme.drawModalBackdrop(ctx, sw, sh, app.globalTime, newItem.rarityColor);

      const mw = Math.min(686, sw - 26);
      const mh = Math.min(358, sh - 18);
      const mx = Math.round((sw - mw) / 2);
      const my = Math.round((sh - mh) / 2);

      this.beginModalPop(ctx, sw, sh);
      drawPixelPanel(ctx, mx, my, mw, mh, '#131024', newItem.rarityColor, 8, {
        headerBand: 38,
        topCrest: true,
        glowColor: newItem.rarityColor
      });

      UITheme.drawSealStamp(ctx, mx + 14, my + 7, 24, '鉴宝', '#3c096c', '#ffd166');
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`发现西游披挂 · 词条对比（部位：${newItem.slotName}）`, mx + 46, my + 26);

      UITheme.drawOrnateButton(
        ctx,
        mx + mw - 66,
        my + 7,
        52,
        25,
        '暂存 ×',
        this.getBtnVisualState(mx + mw - 66, my + 7, 52, 25, { variant: 'slate', studs: false, fontSize: 11 })
      );
      this.addButton('eq_cmp_close', mx + mw - 66, my + 7, 52, 25, () => {
        app.modal = null;
      });

      const cardGap = 14;
      const cardW = Math.floor((mw - 36 - cardGap) / 2);
      const cardH = mh - 98;
      const cardY = my + 43;

      this.drawEquipItemCard(
        ctx,
        mx + 18,
        cardY,
        cardW,
        cardH,
        curItem,
        curItem ? '当前穿戴' : `当前【${newItem.slotName}】为空`,
        null,
        app.assetLoader
      );
      this.drawEquipItemCard(
        ctx,
        mx + 18 + cardW + cardGap,
        cardY,
        cardW,
        cardH,
        newItem,
        '新获宝物',
        curItem ? curItem.score : 0,
        app.assetLoader
      );

      // 底部三大立体雕花按钮
      const btnY = my + mh - 46;
      const btnH = 36;
      const bW = Math.floor((mw - 36 - 20) / 3);

      const b1X = mx + 18;
      UITheme.drawOrnateButton(
        ctx,
        b1X,
        btnY,
        bW,
        btnH,
        curItem ? `⚔ 穿戴替换 (旧+${curItem.recycleGold}金)` : '⚔ 立即穿戴披挂',
        this.getBtnVisualState(b1X, btnY, bW, btnH, { variant: 'jade', fontSize: 13, shimmerTime: app.globalTime })
      );
      this.addButton('eq_do_equip', b1X, btnY, bW, btnH, () => {
        app.equipPendingItem();
      });

      const b2X = b1X + bW + 10;
      UITheme.drawOrnateButton(
        ctx,
        b2X,
        btnY,
        bW,
        btnH,
        `♻ 炼化分解 (+${newItem.recycleGold}金/+25蓝)`,
        this.getBtnVisualState(b2X, btnY, bW, btnH, {
          variant: 'token',
          bg: '#4a3518',
          bgBottom: '#291d0c',
          border: '#ffd60a',
          textColor: '#ffd60a',
          fontSize: 12
        })
      );
      this.addButton('eq_do_recycle', b2X, btnY, bW, btnH, () => {
        app.recyclePendingItem();
      });

      const b3X = b2X + bW + 10;
      const canUpgrade = newItem.rarityIndex < 5;
      UITheme.drawOrnateButton(
        ctx,
        b3X,
        btnY,
        bW,
        btnH,
        canUpgrade ? '🎬 仙炉升品 (+1阶&重铸)' : '✦ 已臻至高圣品',
        this.getBtnVisualState(b3X, btnY, bW, btnH, {
          variant: canUpgrade ? 'purple' : 'slate',
          disabled: !canUpgrade,
          fontSize: 12
        })
      );
      if (canUpgrade) {
        this.addButton('eq_do_reforge', b3X, btnY, bW, btnH, () => {
          app.reforgePendingItemByAd();
        });
      }

      this.endModalPop(ctx);
    }

    // ==================== 4B. 角色四格披挂装备栏与全属性总览面板 ====================
    renderEquipPanelModal(ctx, sw, sh, app) {
      this.clearButtons();
      const player = app.player;
      if (!player) {
        app.modal = null;
        return;
      }

      UITheme.drawModalBackdrop(ctx, sw, sh, app.globalTime, player.charDef.themeColor);

      const mw = Math.min(726, sw - 22);
      const mh = Math.min(360, sh - 18);
      const mx = Math.round((sw - mw) / 2);
      const my = Math.round((sh - mh) / 2);

      this.beginModalPop(ctx, sw, sh);
      drawPixelPanel(ctx, mx, my, mw, mh, '#141126', player.charDef.themeColor, 8, {
        headerBand: 38,
        topCrest: true,
        lattice: true,
        glowColor: player.charDef.themeColor
      });

      UITheme.drawSealStamp(ctx, mx + 14, my + 7, 24, '披挂', '#241b3d', player.charDef.themeColor);
      ctx.textAlign = 'left';
      ctx.fillStyle = player.charDef.themeColor;
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`${player.charDef.name} · 西游披挂与战力总览`, mx + 46, my + 26);

      UITheme.drawOrnateButton(
        ctx,
        mx + mw - 72,
        my + 7,
        58,
        25,
        '关闭 [B]',
        this.getBtnVisualState(mx + mw - 72, my + 7, 58, 25, { variant: 'slate', studs: false, fontSize: 11 })
      );
      this.addButton('eq_panel_close', mx + mw - 72, my + 7, 58, 25, () => {
        app.modal = null;
      });

      const bodyY = my + 44;
      const bodyH = mh - 56;

      // 左栏：4 个披挂部位槽按钮
      const leftW = 152;
      const slotH = Math.floor((bodyH - 18) / 4);
      EQUIP_SLOTS.forEach((sl, idx) => {
        const sy = bodyY + idx * (slotH + 6);
        const eq = player.equipped[sl.id];
        const isSel = app.inspectSlot === sl.id;
        const isHov = this.isRectHovered(mx + 14, sy, leftW, slotH);
        const border = isSel ? '#ffd166' : eq ? eq.rarityColor : isHov ? '#90e0ef' : '#3d405b';
        drawPixelPanel(ctx, mx + 14, sy, leftW, slotH, isSel ? '#2d234e' : '#1b1732', border, 5, {
          glowColor: isSel ? border : null
        });

        drawPixelPanel(ctx, mx + 20, sy + Math.round((slotH - 38) / 2), 38, 38, '#0f0c1a', eq ? eq.rarityColor : '#343a40', 3, {
          shadow: false,
          innerFrame: false
        });
        if (eq) {
          const spr = app.assetLoader.getEquipSprite(eq.iconKey, false);
          if (spr) {
            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
              spr,
              Math.round(mx + 39 - spr.width * 0.75),
              Math.round(sy + slotH / 2 - spr.height * 0.75),
              Math.round(spr.width * 1.5),
              Math.round(spr.height * 1.5)
            );
            ctx.restore();
          }
        } else {
          ctx.textAlign = 'center';
          ctx.fillStyle = '#4a4e69';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(sl.name.slice(0, 1), mx + 39, sy + slotH / 2 + 4);
        }

        ctx.textAlign = 'left';
        ctx.fillStyle = eq ? eq.rarityColor : '#8d99ae';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(eq ? `${eq.rarityName} Lv.${eq.level}` : `${sl.name} (未穿戴)`, mx + 64, sy + Math.round(slotH * 0.42));
        ctx.fillStyle = '#e0fbfc';
        ctx.font = '11px sans-serif';
        ctx.fillText(eq ? eq.name.slice(0, 6) : '点击检视槽位', mx + 64, sy + Math.round(slotH * 0.75));

        this.addButton(`slot_tab_${sl.id}`, mx + 14, sy, leftW, slotH, () => {
          app.inspectSlot = sl.id;
        });
      });

      // 中栏：当前选中槽位完整词条卡
      const midX = mx + 14 + leftW + 10;
      const midW = Math.floor((mw - leftW - 46) * 0.54);
      const selItem = player.equipped[app.inspectSlot] || null;
      const selSlotName = (EQUIP_SLOTS.find((s) => s.id === app.inspectSlot) || EQUIP_SLOTS[0]).name;
      this.drawEquipItemCard(
        ctx,
        midX,
        bodyY,
        midW,
        bodyH,
        selItem,
        selItem ? '✦ 已穿戴' : `【${selSlotName}】尚未穿戴披挂`,
        null,
        app.assetLoader
      );

      // 右栏：斑马纹综合战斗属性表
      const rightX = midX + midW + 10;
      const rightW = mx + mw - 14 - rightX;
      drawPixelPanel(ctx, rightX, bodyY, rightW, bodyH, '#18152d', '#4cc9f0', 6, { corners: true });

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('📊 行者综合战斗属性', rightX + rightW / 2, bodyY + 21);
      UITheme.drawDivider(ctx, rightX + rightW / 2, bodyY + 29, rightW - 24, '#4cc9f0');

      const statRows = [
        { k: '最大气血', v: `${player.hp}/${player.maxHp}`, c: '#ff5252' },
        { k: '法力灵力', v: `${Math.floor(player.mp)}/${player.maxMp}`, c: '#4cc9f0' },
        { k: '回蓝效率', v: `${player.mpRegen}/s (+${player.mpOnHit})`, c: '#90e0ef' },
        { k: '物理攻击', v: `${player.atk}`, c: '#ff9f1c' },
        { k: '妙法强度', v: `${player.magic}`, c: '#c77dff' },
        { k: '护甲减伤', v: `${player.armor} (${Math.round(player.defense * 100)}%)`, c: '#69f0ae' },
        { k: '暴击几率', v: `${Math.round(player.critRate * 100)}%`, c: '#ffd60a' },
        { k: '暴击伤害', v: `${Math.round(player.critMult * 100)}%`, c: '#ffd60a' },
        { k: '冷却缩减', v: `${Math.round(player.cdReduction * 100)}%`, c: '#80ffdb' }
      ];

      const rowStep = Math.min(25, Math.floor((bodyH - 42) / statRows.length));
      statRows.forEach((sr, i) => {
        const ry = bodyY + 48 + i * rowStep;
        if (i % 2 === 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
          ctx.fillRect(rightX + 6, ry - 12, rightW - 12, rowStep - 1);
        }
        ctx.textAlign = 'left';
        ctx.fillStyle = '#adb5bd';
        ctx.font = '11px sans-serif';
        ctx.fillText(sr.k, rightX + 11, ry);

        ctx.textAlign = 'right';
        ctx.fillStyle = sr.c;
        ctx.font = 'bold 11px monospace, sans-serif';
        ctx.fillText(sr.v, rightX + rightW - 10, ry);
      });

      this.endModalPop(ctx);
    }

    // ==================== 4. 三才天书卷轴三选一（带竹简法印与3/6/9质变里程碑星轨） ====================
    renderScrollPickModal(ctx, sw, sh, app) {
      this.clearButtons();
      UITheme.drawModalBackdrop(ctx, sw, sh, app.globalTime, '#ffd166');

      this.beginModalPop(ctx, sw, sh);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('📜 参悟三才天书 · 凝练无上道果', sw / 2, 36);
      ctx.fillStyle = '#90e0ef';
      ctx.font = '11px sans-serif';
      ctx.fillText('主修天书达 3 / 6 / 9 卷时将触发【破甲真气 · 移速暴击 · 化境雷火斩杀】质变觉醒！', sw / 2, 54);

      const cardW = Math.min(212, Math.floor((sw - 64) / 3));
      const cardH = Math.min(242, sh - 86);
      const totalW = cardW * 3 + 28;
      const startX = Math.round((sw - totalW) / 2);
      const topY = 66;

      const sealChars = { red: '斗战', purple: '妙法', green: '金刚' };

      SCROLL_TYPES.forEach((sc, idx) => {
        const cx = startX + idx * (cardW + 14);
        const isMain = app.player && app.player.charDef.affinity === sc.id;
        const isHov = this.isRectHovered(cx, topY, cardW, cardH);

        drawPixelPanel(ctx, cx, topY + (isHov ? -2 : 0), cardW, cardH, '#18142b', sc.color, 7, {
          corners: true,
          headerBand: 54,
          glowColor: isMain || isHov ? sc.color : null
        });

        const cy = topY + (isHov ? -2 : 0);
        if (isMain) {
          ctx.fillStyle = sc.color;
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText('★ 本命主修推荐 ★', cx + cardW / 2, cy - 5);
        }

        UITheme.drawSealStamp(ctx, cx + 14, cy + 12, 30, sealChars[sc.id] || '天书', '#120d1d', sc.color);

        ctx.textAlign = 'left';
        ctx.fillStyle = sc.color;
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(sc.name, cx + 52, cy + 28);
        ctx.fillStyle = '#e0fbfc';
        ctx.font = '11px sans-serif';
        ctx.fillText(sc.subtitle, cx + 52, cy + 44);

        const curLv = app.player.scrolls[sc.id];
        const nextLv = curLv + 1;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(`修为层数：${curLv} 卷  ➔  ${nextLv} 卷`, cx + cardW / 2, cy + 74);

        // 9卷觉醒进度星轨（第 3 / 6 / 9 颗为大号菱星！）
        const trackStartX = cx + Math.round((cardW - 9 * 14) / 2) + 6;
        for (let m = 1; m <= 9; m++) {
          const px = trackStartX + (m - 1) * 14;
          const py = cy + 89;
          const isMilestone = m === 3 || m === 6 || m === 9;
          const reached = m <= nextLv;
          const isNextGain = m === nextLv;
          ctx.fillStyle = isNextGain ? '#ffffff' : reached ? sc.color : '#2b2d42';
          if (isMilestone) {
            ctx.beginPath();
            ctx.moveTo(px, py - 5);
            ctx.lineTo(px + 5, py);
            ctx.lineTo(px, py + 5);
            ctx.lineTo(px - 5, py);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillRect(px - 3, py - 3, 6, 6);
          }
        }

        const lines = sc.desc.split('\n');
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        lines.forEach((ln, li) => {
          ctx.fillText(ln, cx + cardW / 2, cy + 116 + li * 20);
        });

        const btnY = cy + cardH - 42;
        UITheme.drawOrnateButton(
          ctx,
          cx + 18,
          btnY,
          cardW - 36,
          31,
          `参悟此卷 [${idx + 1}]`,
          this.getBtnVisualState(cx + 18, btnY, cardW - 36, 31, {
            variant: 'gold',
            bg: sc.color,
            bgBottom: sc.color,
            border: '#ffffff',
            textColor: '#120d16',
            fontSize: 13
          })
        );

        this.addButton(`pick_scroll_${sc.id}`, cx, topY, cardW, cardH, () => {
          app.applyScrollChoice(sc.id);
        }, { rippleColor: sc.color });
      });

      this.endModalPop(ctx);
    }

    // ==================== 5. 章节破劫土地庙休整与仙缘赐福 ====================
    renderStageClearModal(ctx, sw, sh, app) {
      this.clearButtons();
      UITheme.drawModalBackdrop(ctx, sw, sh, app.globalTime, '#69f0ae');

      this.beginModalPop(ctx, sw, sh);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#69f0ae';
      ctx.font = 'bold 19px sans-serif';
      ctx.fillText('⛩ 妖王伏诛 · 土地庙休整与仙缘赐福', sw / 2, 28);

      const doors = app.nextRouteDoors || [];
      if (doors.length > 0) {
        const doorW = Math.min(298, Math.floor((sw - 56) / 2));
        const doorTotalW = doorW * doors.length + (doors.length - 1) * 14;
        const doorStartX = Math.round((sw - doorTotalW) / 2);
        doors.forEach((dr, dIdx) => {
          const dx = doorStartX + dIdx * (doorW + 14);
          const sel = app.selectedNextTribNo === dr.no;
          const reg = TerrainRegions.getRegionById(dr.regionId);
          drawPixelPanel(ctx, dx, 38, doorW, 48, sel ? '#281d46' : '#151326', sel ? '#ffd166' : '#4a4e69', 5, {
            glowColor: sel ? '#ffd166' : null
          });
          ctx.textAlign = 'left';
          ctx.fillStyle = sel ? '#ffd166' : '#e0fbfc';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(`${sel ? '✦ ' : '◇ '}路线${dIdx + 1}：${dr.numLabel}·${dr.tribName}（${reg.shortName}）`, dx + 10, 56);
          ctx.fillStyle = '#90e0ef';
          ctx.font = '11px sans-serif';
          ctx.fillText(`地貌：${reg.terrainLabel.slice(0, 20)}`, dx + 10, 75);
          this.addButton(`pick_door_${dr.no}`, dx, 38, doorW, 48, () => {
            app.selectedNextTribNo = dr.no;
          });
        });
      }

      const choices = app.stageMutationChoices || [];
      const cardW = Math.min(212, Math.floor((sw - 68) / 3));
      const topY = doors.length > 0 ? 96 : 66;
      const cardH = Math.min(196, sh - topY - 52);
      const count = Math.max(1, choices.length);
      const totalW = cardW * count + (count - 1) * 14;
      const startX = Math.round((sw - totalW) / 2);

      choices.forEach((mut, idx) => {
        const cx = startX + idx * (cardW + 14);
        const isHov = this.isRectHovered(cx, topY, cardW, cardH);
        drawPixelPanel(ctx, cx, topY + (isHov ? -2 : 0), cardW, cardH, '#1a162e', mut.color, 6, {
          corners: true,
          headerBand: 36,
          glowColor: isHov ? mut.color : null
        });

        const cy = topY + (isHov ? -2 : 0);
        ctx.textAlign = 'center';
        ctx.fillStyle = mut.color;
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText(`✦ ${mut.name}`, cx + cardW / 2, cy + 25);

        ctx.fillStyle = '#e9ecef';
        ctx.font = '12px sans-serif';
        const d = mut.desc;
        const maxCh = Math.max(12, Math.floor((cardW - 22) / 12.2));
        for (let ln = 0; ln < 3; ln++) {
          const seg = d.slice(ln * maxCh, (ln + 1) * maxCh);
          if (seg) ctx.fillText(seg, cx + cardW / 2, cy + 60 + ln * 19);
        }

        const btnY = cy + cardH - 38;
        UITheme.drawOrnateButton(
          ctx,
          cx + 16,
          btnY,
          cardW - 32,
          28,
          '择此仙缘 · 破劫前行',
          this.getBtnVisualState(cx + 16, btnY, cardW - 32, 28, { variant: 'jade', studs: false, fontSize: 12 })
        );

        this.addButton(`mut_${mut.id}`, cx, topY, cardW, cardH, () => {
          app.selectMutationAndAdvance(mut.id);
        });
      });

      this.endModalPop(ctx);
    }

    // ==================== 5B. 九九八十一难 · 十二大独立地域微缩景观图鉴 ====================
    renderTerrainAtlasModal(ctx, sw, sh, app) {
      this.clearButtons();
      const regions = TerrainRegions.REGIONAL_TERRAINS;
      const selIdx = Math.max(0, Math.min(regions.length - 1, app.atlasRegionIdx || 0));
      const reg = regions[selIdx];
      const tribs = TerrainRegions.getTribulationsInRegion(reg.id);
      const clearedMap = (app.saveData && app.saveData.clearedTribulations) || {};

      UITheme.drawModalBackdrop(ctx, sw, sh, app.globalTime, reg.tileTop || '#ffd166');

      const mw = Math.min(766, sw - 20);
      const mh = Math.min(406, sh - 16);
      const mx = Math.round((sw - mw) / 2);
      const my = Math.round((sh - mh) / 2);

      this.beginModalPop(ctx, sw, sh);
      drawPixelPanel(ctx, mx, my, mw, mh, '#121022', reg.tileTop || '#ffd166', 8, {
        headerBand: 36,
        topCrest: true,
        glowColor: reg.tileTop
      });

      UITheme.drawSealStamp(ctx, mx + 12, my + 6, 24, '山河', '#1d3557', '#ffd166');
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText('九九八十一难 · 十二大独立地域随机地形图谱', mx + 42, my + 24);

      const randBtnW = 142;
      UITheme.drawOrnateButton(
        ctx,
        mx + mw - randBtnW - 68,
        my + 6,
        randBtnW,
        25,
        '🎲 随机抽本区一难',
        this.getBtnVisualState(mx + mw - randBtnW - 68, my + 6, randBtnW, 25, {
          variant: 'jade',
          studs: false,
          fontSize: 11
        })
      );
      this.addButton('atlas_roll_region', mx + mw - randBtnW - 68, my + 6, randBtnW, 25, () => {
        const pickT = tribs[Math.floor(Math.random() * tribs.length)];
        if (pickT) app.jumpToTribulation(pickT.no);
      });

      UITheme.drawOrnateButton(
        ctx,
        mx + mw - 58,
        my + 6,
        46,
        25,
        '关闭',
        this.getBtnVisualState(mx + mw - 58, my + 6, 46, 25, { variant: 'slate', studs: false, fontSize: 11 })
      );
      this.addButton('atlas_close', mx + mw - 58, my + 6, 46, 25, () => {
        app.modal = null;
      });

      // 上排：12 大独立地域切换令牌（2 行 x 6 列）
      const tabCols = 6;
      const tabGap = 5;
      const tabW = Math.floor((mw - 24 - tabGap * (tabCols - 1)) / tabCols);
      const tabH = 25;
      regions.forEach((rItem, idx) => {
        const rRow = Math.floor(idx / tabCols);
        const rCol = idx % tabCols;
        const tx = mx + 12 + rCol * (tabW + tabGap);
        const ty = my + 39 + rRow * (tabH + 4);
        const active = idx === selIdx;
        const hov = this.isRectHovered(tx, ty, tabW, tabH);
        drawPixelPanel(ctx, tx, ty, tabW, tabH, active ? '#2d1e48' : hov ? '#221c38' : '#181529', active ? rItem.tileTop : '#3d405b', 3, {
          shadow: false,
          innerFrame: false
        });
        ctx.fillStyle = rItem.tileTop;
        ctx.fillRect(tx + 5, ty + 5, 4, 15);
        ctx.textAlign = 'center';
        ctx.fillStyle = active ? '#ffd166' : '#ced4da';
        ctx.font = active ? 'bold 11px sans-serif' : '10px sans-serif';
        ctx.fillText(`${idx + 1}.${rItem.shortName}`, tx + tabW / 2 + 2, ty + 16);
        this.addButton(`atlas_reg_${rItem.id}`, tx, ty, tabW, tabH, () => {
          app.atlasRegionIdx = idx;
        });
      });

      // 中部：当前独立地形说明 + 右侧实时微缩地貌横截面视窗！
      const infoY = my + 99;
      const infoH = 58;
      drawPixelPanel(ctx, mx + 12, infoY, mw - 24, infoH, '#171429', reg.tileTop, 5);

      // 微缩像素山水横截面视窗 (122 x 46)
      const dioW = 124;
      const dioH = 46;
      const dioX = mx + mw - dioW - 18;
      const dioY = infoY + 6;
      ctx.save();
      ctx.beginPath();
      ctx.rect(dioX, dioY, dioW, dioH);
      ctx.clip();
      const skyG = ctx.createLinearGradient(0, dioY, 0, dioY + dioH);
      skyG.addColorStop(0, reg.skyTop || '#0d1321');
      skyG.addColorStop(1, reg.skyBottom || '#1d2d44');
      ctx.fillStyle = skyG;
      ctx.fillRect(dioX, dioY, dioW, dioH);
      // 远山剪影
      ctx.fillStyle = reg.mountainFar || '#1b263b';
      ctx.beginPath();
      ctx.moveTo(dioX, dioY + dioH);
      ctx.lineTo(dioX + 28, dioY + 14);
      ctx.lineTo(dioX + 58, dioY + 30);
      ctx.lineTo(dioX + 94, dioY + 11);
      ctx.lineTo(dioX + dioW, dioY + dioH);
      ctx.fill();
      // 两侧平台与中央机关池微缩示意
      ctx.fillStyle = reg.tileBody;
      ctx.fillRect(dioX, dioY + 32, 42, 14);
      ctx.fillRect(dioX + 80, dioY + 30, 44, 16);
      ctx.fillStyle = reg.tileTop;
      ctx.fillRect(dioX, dioY + 30, 42, 3);
      ctx.fillRect(dioX + 80, dioY + 28, 44, 3);
      ctx.fillStyle = reg.platformColor;
      ctx.fillRect(dioX + 46, dioY + 22, 30, 4);
      ctx.fillStyle = reg.hazardColor;
      ctx.fillRect(dioX + 42, dioY + 39, 38, 7);
      ctx.strokeStyle = reg.tileTop;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(dioX, dioY, dioW, dioH);
      ctx.restore();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`【${reg.name}】（${reg.tribSpanLabel}）— ${reg.terrainLabel}`, mx + 22, infoY + 22);
      ctx.fillStyle = '#e0fbfc';
      ctx.font = '11px sans-serif';
      const maxInfoChars = Math.max(22, Math.floor((mw - dioW - 56) / 11.5));
      ctx.fillText(`动态机制：${reg.mechanicDesc}`.slice(0, maxInfoChars), mx + 22, infoY + 43);

      // 下部：归属本独立地形的原著劫难卡片网格
      const gridTop = infoY + infoH + 7;
      const gridH = mh - (gridTop - my) - 9;
      const cols = tribs.length > 8 ? 4 : 3;
      const rows = Math.max(1, Math.ceil(tribs.length / cols));
      const cGap = 6;
      const cellW = Math.floor((mw - 24 - cGap * (cols - 1)) / cols);
      const cellH = Math.min(48, Math.max(30, Math.floor((gridH - (rows - 1) * 5) / rows)));

      tribs.forEach((tr, i) => {
        const gr = Math.floor(i / cols);
        const gc = i % cols;
        const cx = mx + 12 + gc * (cellW + cGap);
        const cy = gridTop + gr * (cellH + 5);
        const isCleared = !!clearedMap[tr.no];
        const isCur = app.level && app.level.tribulationNo === tr.no && app.state === 'PLAYING';
        const isHov = this.isRectHovered(cx, cy, cellW, cellH);

        drawPixelPanel(
          ctx,
          cx,
          cy,
          cellW,
          cellH,
          isCur ? '#2e2250' : isHov ? '#231d3d' : '#18152b',
          isCur ? '#ffd166' : isCleared ? '#69f0ae' : isHov ? '#90e0ef' : '#4a4e69',
          4,
          { shadow: false }
        );
        ctx.textAlign = 'left';
        ctx.fillStyle = isCleared ? '#69f0ae' : '#ffd166';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`${tr.numLabel} · ${tr.tribName}${isCleared ? ' ✓' : ''}`, cx + 8, cy + 15);

        if (cellH >= 36) {
          ctx.fillStyle = '#adb5bd';
          ctx.font = '10px sans-serif';
          ctx.fillText(`📍${tr.location}`, cx + 8, cy + 31);
        }

        ctx.textAlign = 'right';
        ctx.fillStyle = isHov ? '#ffd166' : '#90e0ef';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('破劫▶', cx + cellW - 7, cy + 16);

        this.addButton(`go_trib_${tr.no}`, cx, cy, cellW, cellH, () => {
          app.jumpToTribulation(tr.no);
        });
      });

      this.endModalPop(ctx);
    }

    // ==================== 6. 死亡看激励视频满血复活弹窗（观音金莲佛光背饰） ====================
    renderDeathReviveModal(ctx, sw, sh, app) {
      this.clearButtons();
      UITheme.drawModalBackdrop(ctx, sw, sh, app.globalTime, '#ff4d6d');

      const mw = Math.min(488, sw - 32);
      const mh = Math.min(296, sh - 28);
      const mx = Math.round((sw - mw) / 2);
      const my = Math.round((sh - mh) / 2);

      this.beginModalPop(ctx, sw, sh);

      // 背后观音金莲慈悲光轮
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 209, 102, 0.22)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sw / 2, my + mh / 2, Math.min(sw, sh) * 0.36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      drawPixelPanel(ctx, mx, my, mw, mh, '#1c101b', '#ff4d6d', 8, {
        headerBand: 44,
        topCrest: true,
        corners: true,
        glowColor: '#ff4d6d'
      });

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff4d6d';
      ctx.font = 'bold 21px sans-serif';
      ctx.fillText('💀 身死道消 · 命悬一线', sw / 2, my + 31);

      const maxRev = SDK_CONFIG.reviveRules.maxRevivesPerRun || 2;
      const leftRev = Math.max(0, maxRev - app.player.reviveCount);

      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`🌿 南海观音垂怜！本局剩余逆天复活次数：${leftRev} / ${maxRev}`, sw / 2, my + 68);

      drawPixelPanel(ctx, mx + 24, my + 80, mw - 48, 30, 'rgba(255, 209, 102, 0.08)', 'rgba(255, 209, 102, 0.35)', 4, {
        shadow: false,
        innerFrame: false
      });
      ctx.fillStyle = '#e0fbfc';
      ctx.font = '11px sans-serif';
      ctx.fillText('甘露神效：100%满血 + 25%金身护盾 + 3.5秒无敌 + 佛光震退群妖', sw / 2, my + 99);

      const revBtnW = mw - 56;
      const revBtnH = 56;
      const revBtnX = mx + 28;
      const revBtnY = my + 124;

      UITheme.drawOrnateButton(
        ctx,
        revBtnX,
        revBtnY,
        revBtnW,
        revBtnH,
        '🎬 看视频 · 观音甘露满血复活',
        this.getBtnVisualState(revBtnX, revBtnY, revBtnW, revBtnH, {
          variant: 'primary',
          fontSize: 17,
          subText: '完整观看立享无敌金身清场（抖音激励广告接口）',
          shimmerTime: app.globalTime
        })
      );
      this.addButton('btn_ad_revive', revBtnX, revBtnY, revBtnW, revBtnH, () => {
        app.requestAdRevive();
      });

      const giveUpW = 196;
      const giveUpX = Math.round((sw - giveUpW) / 2);
      const giveUpY = revBtnY + 72;
      UITheme.drawOrnateButton(
        ctx,
        giveUpX,
        giveUpY,
        giveUpW,
        34,
        '放弃复活 · 兵解轮回',
        this.getBtnVisualState(giveUpX, giveUpY, giveUpW, 34, { variant: 'slate', fontSize: 12 })
      );
      this.addButton('btn_give_up', giveUpX, giveUpY, giveUpW, 34, () => {
        app.finishRun(false);
      });

      this.endModalPop(ctx);
    }

    // ==================== 7. 单局战报结算弹窗（朱砂功德大印 + 四格战报卡） ====================
    renderRunOverModal(ctx, sw, sh, app) {
      this.clearButtons();
      const summary = app.runSummary || { scrolls: { red: 1, purple: 1, green: 1 } };
      const border = summary.victory ? '#ffd166' : '#90e0ef';

      UITheme.drawModalBackdrop(ctx, sw, sh, app.globalTime, border);

      const mw = Math.min(492, sw - 32);
      const mh = Math.min(302, sh - 24);
      const mx = Math.round((sw - mw) / 2);
      const my = Math.round((sh - mh) / 2);

      this.beginModalPop(ctx, sw, sh);
      drawPixelPanel(ctx, mx, my, mw, mh, '#151328', border, 8, {
        headerBand: 46,
        topCrest: true,
        corners: true,
        lattice: true,
        glowColor: border
      });

      // 右上角朱砂四字大印章（「功德圆满」或「灵蕴归宗」）
      UITheme.drawSealStamp(
        ctx,
        mx + mw - 58,
        my + 52,
        42,
        summary.victory ? '功德圆满' : '灵蕴归宗',
        summary.victory ? '#c1121f' : '#1d3557',
        border
      );

      ctx.textAlign = 'center';
      ctx.fillStyle = border;
      ctx.font = 'bold 21px sans-serif';
      ctx.fillText(summary.victory ? '🏆 踏碎魔窟 · 九九功成！' : '⚔ 兵解轮回 · 灵蕴入库', sw / 2, my + 32);

      // 2x2 结构化战绩网格
      const statGridW = mw - 84;
      const cellW = Math.floor((statGridW - 10) / 2);
      const cellH = 38;
      const items = [
        { k: '出战行者', v: summary.charName || '-', c: '#ffffff' },
        { k: '抵达劫数', v: (summary.stageName || '-').slice(0, 10), c: '#90e0ef' },
        { k: '斩妖总数', v: `${summary.kills || 0} 尊`, c: '#ff9f1c' },
        { k: '入库灵蕴', v: `+${summary.soulsEarned || 0} 灵蕴`, c: '#69f0ae' }
      ];
      items.forEach((it, i) => {
        const r = Math.floor(i / 2);
        const c = i % 2;
        const ix = mx + 18 + c * (cellW + 10);
        const iy = my + 56 + r * (cellH + 8);
        drawPixelPanel(ctx, ix, iy, cellW, cellH, '#1e1a36', '#3d405b', 4, { shadow: false, innerFrame: false });
        ctx.textAlign = 'left';
        ctx.fillStyle = '#adb5bd';
        ctx.font = '10px sans-serif';
        ctx.fillText(it.k, ix + 10, iy + 14);
        ctx.fillStyle = it.c;
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(it.v, ix + 10, iy + 31);
      });

      // 三才修为汇总铭牌
      const sc = summary.scrolls || { red: 1, purple: 1, green: 1 };
      drawPixelPanel(ctx, mx + 18, my + 152, mw - 36, 30, 'rgba(255, 209, 102, 0.08)', 'rgba(255, 209, 102, 0.35)', 4, {
        shadow: false,
        innerFrame: false
      });
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`📜 本局三才修为：斗战 ${sc.red} 卷  ·  妙法 ${sc.purple} 卷  ·  金刚 ${sc.green} 卷`, sw / 2, my + 171);

      const btnY = my + mh - 56;
      const bGap = 10;
      const bW = Math.floor((mw - 36 - bGap * 2) / 3);

      const b1X = mx + 18;
      UITheme.drawOrnateButton(
        ctx,
        b1X,
        btnY,
        bW,
        40,
        '📹 炫耀战绩',
        this.getBtnVisualState(b1X, btnY, bW, 40, { variant: 'purple', fontSize: 13 })
      );
      this.addButton('over_share', b1X, btnY, bW, 40, () => {
        DouyinSDK.shareGameOrVideo((ok, msg) => this.showToast(msg));
      });

      const b2X = b1X + bW + bGap;
      UITheme.drawOrnateButton(
        ctx,
        b2X,
        btnY,
        bW,
        40,
        '🔥 再战一局',
        this.getBtnVisualState(b2X, btnY, bW, 40, { variant: 'primary', fontSize: 14, shimmerTime: app.globalTime })
      );
      this.addButton('over_retry', b2X, btnY, bW, 40, () => {
        app.startNewRun(app.selectedCharId);
      });

      const b3X = b2X + bW + bGap;
      UITheme.drawOrnateButton(
        ctx,
        b3X,
        btnY,
        bW,
        40,
        '🏕 换人/强化',
        this.getBtnVisualState(b3X, btnY, bW, 40, { variant: 'cyan', fontSize: 13 })
      );
      this.addButton('over_title', b3X, btnY, bW, 40, () => {
        app.returnToTitle();
      });

      this.endModalPop(ctx);
    }

    // ==================== 8. 抖音激励视频模拟播放器 ====================
    renderMockAdIfActive(ctx, sw, sh) {
      const ad = DouyinSDK.mockAdState;
      if (!ad.active) return;

      this.clearButtons();

      ctx.fillStyle = 'rgba(5, 5, 12, 0.96)';
      ctx.fillRect(0, 0, sw, sh);

      drawPixelPanel(ctx, 18, 16, 258, 34, '#1f1b33', '#ffd166', 6);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 13px sans-serif';
      const secCeil = Math.ceil(ad.remainingSec);
      ctx.fillText(
        ad.canReward ? '✅ 已获得仙缘激励奖励资格！' : `🎬 激励视频模拟 | ${secCeil}秒后可领奖`,
        30,
        38
      );

      if (ad.canReward) {
        const cw = 160;
        UITheme.drawOrnateButton(
          ctx,
          sw - cw - 18,
          16,
          cw,
          36,
          '🎁 领取奖励并关闭 ×',
          this.getBtnVisualState(sw - cw - 18, 16, cw, 36, { variant: 'jade', fontSize: 13 })
        );
        this.addButton('mock_ad_finish', sw - cw - 18, 16, cw, 36, () => {
          DouyinSDK.closeMockAd(false);
        });
      } else {
        const swBtn = 136;
        UITheme.drawOrnateButton(
          ctx,
          sw - swBtn - 18,
          16,
          swBtn,
          34,
          '中途退出测试 ×',
          this.getBtnVisualState(sw - swBtn - 18, 16, swBtn, 34, { variant: 'slate', fontSize: 12 })
        );
        this.addButton('mock_ad_skip', sw - swBtn - 18, 16, swBtn, 34, () => {
          DouyinSDK.closeMockAd(true);
        });
      }

      const boxW = Math.min(468, sw - 48);
      const boxH = 190;
      const bx = Math.round((sw - boxW) / 2);
      const by = Math.round((sh - boxH) / 2);
      drawPixelPanel(ctx, bx, by, boxW, boxH, '#161328', '#ffd166', 8, {
        topCrest: true,
        corners: true,
        headerBand: 48
      });

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(ad.title, sw / 2, by + 31);

      ctx.fillStyle = '#ced4da';
      ctx.font = '12px sans-serif';
      ctx.fillText('当前处于开发模拟模式 (sdkConfig.enableMockAd = true)', sw / 2, by + 80);
      ctx.fillStyle = '#90e0ef';
      ctx.fillText('上线抖音时填入真实 adUnitId 并关闭开关即可无缝切换官方广告！', sw / 2, by + 104);

      const pw = boxW - 76;
      const px = bx + 38;
      const py = by + 138;
      const progress = 1 - ad.remainingSec / ad.totalSec;
      UITheme.drawGlossyBar(ctx, px, py, pw, 16, progress, {
        colorTop: ad.canReward ? '#69f0ae' : '#ffd166',
        colorBottom: ad.canReward ? '#2d6a4f' : '#f48c06',
        border: '#ffd166',
        label: `${Math.round(progress * 100)}%`
      });
    }

    // ==================== 9. 顶部国风鎏金横幅飘窗提示 ====================
    renderToast(ctx, sw, sh, hasModal) {
      if (this.toastTimer <= 0 || !this.toastText) return;
      ctx.save();
      const fadeIn = Math.min(1, (this.toastMaxTimer - this.toastTimer) / 0.12 + 0.2);
      const fadeOut = Math.min(1, this.toastTimer / 0.25);
      ctx.globalAlpha = Math.min(1, fadeIn, fadeOut);

      ctx.font = 'bold 13px sans-serif';
      const tw = Math.min(sw - 34, Math.max(236, Math.round(ctx.measureText(this.toastText).width + 48)));
      const tx = Math.round((sw - tw) / 2);
      const ty = (hasModal ? 14 : 78) - Math.round((1 - Math.min(1, fadeIn)) * 6);

      drawPixelPanel(ctx, tx, ty, tw, 32, 'rgba(20, 16, 36, 0.96)', '#ffd166', 5, {
        glowColor: '#ffd166'
      });
      // 左右鎏金菱珠点缀
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(tx + 9, ty + 14, 4, 4);
      ctx.fillRect(tx + tw - 13, ty + 14, 4, 4);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff3b0';
      ctx.fillText(this.toastText, sw / 2, ty + 21);
      ctx.restore();
    }
  }

  return {
    UIManager,
    drawPixelPanel
  };
});
