/**
 * 《西游破劫录》东方黑金国风 UI 视觉与雕花组件库 (src/ui/uiTheme.js)
 *
 * 视觉母题：「玄金漆器 · 朱砂方印 · 翡翠灵玉 · 祥云回纹」
 * 纯 Canvas 2D 零外部图片依赖实时绘制，兼顾抖音小游戏真机 60fps 性能与高密度美术细节。
 */
(function (name, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const root = typeof globalThis !== 'undefined' ? globalThis : window;
    root.XiyouRegistry = root.XiyouRegistry || {};
    root.XiyouRegistry[name] = factory();
  }
})('uiTheme', function () {
  // 切角八边形路径辅助
  function traceChamferPath(ctx, x, y, w, h, cut) {
    const c = Math.max(0, Math.min(cut !== undefined ? cut : 6, Math.floor(Math.min(w, h) * 0.42)));
    ctx.beginPath();
    ctx.moveTo(x + c, y);
    ctx.lineTo(x + w - c, y);
    ctx.lineTo(x + w, y + c);
    ctx.lineTo(x + w, y + h - c);
    ctx.lineTo(x + w - c, y + h);
    ctx.lineTo(x + c, y + h);
    ctx.lineTo(x, y + h - c);
    ctx.lineTo(x, y + c);
    ctx.closePath();
  }

  // 解析常见色值为带透明度的 rgba（兼容 hex 与已有 rgba）
  function withAlpha(color, alpha) {
    if (!color || typeof color !== 'string') return `rgba(255, 209, 102, ${alpha})`;
    const s = color.trim();
    if (s.startsWith('#')) {
      let hex = s.slice(1);
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      if (hex.length >= 6) {
        const r = parseInt(hex.slice(0, 2), 16) || 0;
        const g = parseInt(hex.slice(2, 4), 16) || 0;
        const b = parseInt(hex.slice(4, 6), 16) || 0;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
    }
    if (s.startsWith('rgba(')) {
      const parts = s.slice(5, -1).split(',');
      if (parts.length >= 3) {
        return `rgba(${parts[0].trim()}, ${parts[1].trim()}, ${parts[2].trim()}, ${alpha})`;
      }
    }
    if (s.startsWith('rgb(')) {
      return s.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
    }
    return s;
  }

  /**
   * 绘制四角传统中式回纹 / 如意包角饰线
   */
  function drawCornerOrnaments(ctx, x, y, w, h, color, size, cut) {
    if (w < 56 || h < 34) return;
    const arm = Math.min(size || 10, Math.floor(w * 0.16), Math.floor(h * 0.22));
    if (arm < 5) return;
    const pad = Math.max(3, Math.round((cut || 6) * 0.52));

    ctx.save();
    ctx.strokeStyle = color || '#ffd166';
    ctx.lineWidth = 1.25;
    ctx.globalAlpha = 0.72;

    const corners = [
      { cx: x + pad, cy: y + pad, sx: 1, sy: 1 },
      { cx: x + w - pad, cy: y + pad, sx: -1, sy: 1 },
      { cx: x + pad, cy: y + h - pad, sx: 1, sy: -1 },
      { cx: x + w - pad, cy: y + h - pad, sx: -1, sy: -1 }
    ];

    for (let i = 0; i < corners.length; i++) {
      const cn = corners[i];
      ctx.beginPath();
      // 外折角线 + 回纹内钩
      ctx.moveTo(cn.cx, cn.cy + cn.sy * arm);
      ctx.lineTo(cn.cx, cn.cy + cn.sy * 2);
      ctx.lineTo(cn.cx + cn.sx * 2, cn.cy);
      ctx.lineTo(cn.cx + cn.sx * arm, cn.cy);
      if (arm >= 8) {
        ctx.moveTo(cn.cx + cn.sx * 4, cn.cy + cn.sy * 6);
        ctx.lineTo(cn.cx + cn.sx * 4, cn.cy + cn.sy * 4);
        ctx.lineTo(cn.cx + cn.sx * 6, cn.cy + cn.sy * 4);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * 升级版国风雕花漆器面板（全项目通用容器与卡片底层）
   * opts: { shadow, glowColor, innerFrame, corners, headerBand, topCrest, stripePattern }
   */
  function drawOrnatePanel(ctx, x, y, w, h, bgColor, borderColor, cut, opts) {
    const c = cut !== undefined ? cut : 6;
    const o = opts || {};
    const bCol = borderColor || '#ffd166';
    const isLarge = w >= 160 && h >= 80;
    const isMedium = w >= 72 && h >= 32;

    ctx.save();

    // 1. 底部立体投影 / 选中外发光光晕
    if (o.shadow !== false && (isMedium || o.shadow === true)) {
      traceChamferPath(ctx, x + 1, y + (isLarge ? 4 : 2), w, h, c);
      ctx.fillStyle = o.glowColor ? withAlpha(o.glowColor, 0.26) : 'rgba(3, 2, 10, 0.52)';
      ctx.fill();
    }

    // 2. 双阶国风漆面渐变底色
    traceChamferPath(ctx, x, y, w, h, c);
    const baseFill = bgColor || 'rgba(18, 15, 32, 0.94)';
    if (h >= 24 && baseFill.startsWith('#')) {
      const grad = ctx.createLinearGradient(x, y, x, y + h);
      grad.addColorStop(0, baseFill);
      grad.addColorStop(1, '#0d0a18');
      ctx.fillStyle = grad;
      ctx.fill();
      // 叠加一层原色保持色调饱满度
      ctx.globalAlpha = 0.72;
      ctx.fillStyle = baseFill;
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = baseFill;
      ctx.fill();
    }

    // 3. 顶部微高光天光带 & 大弹窗额枋底纹
    ctx.save();
    ctx.clip();
    const sheenGrad = ctx.createLinearGradient(x, y, x, y + Math.min(44, h * 0.45));
    sheenGrad.addColorStop(0, withAlpha(bCol, isLarge ? 0.13 : 0.09));
    sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sheenGrad;
    ctx.fillRect(x, y, w, Math.min(44, h * 0.45));

    if (o.headerBand && h >= 90) {
      const hh = typeof o.headerBand === 'number' ? o.headerBand : 38;
      ctx.fillStyle = withAlpha(bCol, 0.10);
      ctx.fillRect(x, y, w, hh);
      ctx.fillStyle = withAlpha(bCol, 0.36);
      ctx.fillRect(x + 8, y + hh, w - 16, 1);
    }

    // 暗纹斜格菱花（仅大弹窗开启，极轻量级线条）
    if (o.lattice && isLarge) {
      ctx.strokeStyle = withAlpha(bCol, 0.035);
      ctx.lineWidth = 1;
      const step = 28;
      for (let lx = x - h; lx < x + w + h; lx += step) {
        ctx.beginPath();
        ctx.moveTo(lx, y);
        ctx.lineTo(lx + h, y + h);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 4. 内嵌 1px 金丝细框（形成双层镶边质感）
    if (o.innerFrame !== false && w >= 60 && h >= 28) {
      const inset = 3;
      traceChamferPath(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2, Math.max(2, c - 2));
      ctx.lineWidth = 1;
      ctx.strokeStyle = withAlpha(bCol, 0.24);
      ctx.stroke();
    }

    // 5. 主外框描边 + 顶部一抹亮边高光
    traceChamferPath(ctx, x, y, w, h, c);
    ctx.lineWidth = o.borderWidth || (isLarge ? 2.2 : 1.8);
    ctx.strokeStyle = bCol;
    ctx.stroke();

    if (w >= 46) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + c + 2, y + 1);
      ctx.lineTo(x + w - c - 2, y + 1);
      ctx.stroke();
    }

    // 6. 四角回纹雕花（中大型面板自动启用）
    if (o.corners !== false && (isLarge || o.corners === true)) {
      drawCornerOrnaments(ctx, x, y, w, h, bCol, isLarge ? 12 : 8, c);
    }

    // 7. 顶沿正中如意菱纹宝珠冠饰（模态窗标题顶饰）
    if (o.topCrest && w >= 220) {
      const mx = Math.round(x + w / 2);
      ctx.fillStyle = '#141024';
      ctx.fillRect(mx - 26, y - 3, 52, 6);
      ctx.strokeStyle = bCol;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(mx - 24, y);
      ctx.lineTo(mx - 8, y);
      ctx.moveTo(mx + 8, y);
      ctx.lineTo(mx + 24, y);
      ctx.stroke();
      // 菱形宝珠
      ctx.fillStyle = bCol;
      ctx.beginPath();
      ctx.moveTo(mx, y - 5);
      ctx.lineTo(mx + 5, y);
      ctx.lineTo(mx, y + 5);
      ctx.lineTo(mx - 5, y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mx - 1, y - 1, 2, 2);
    }

    ctx.restore();
  }

  /**
   * 立体雕花交互按钮（支持悬停提亮、按压下陷、3D底唇、左右铆钉宝珠、主按钮流光扫光）
   * opts: {
   *   variant: 'primary' | 'crimson' | 'jade' | 'purple' | 'gold' | 'slate' | 'token',
   *   bg, border, textColor, subText, fontSize, cut,
   *   hovered, pressed, disabled, shimmerTime, badgeDot, leftIcon
   * }
   */
  function drawOrnateButton(ctx, x, y, w, h, label, opts) {
    const o = opts || {};
    const cut = o.cut !== undefined ? o.cut : Math.min(6, Math.max(3, Math.round(h * 0.16)));
    const hovered = !!o.hovered && !o.disabled;
    const pressed = !!o.pressed && !o.disabled;

    const palettes = {
      primary: { top: '#ef233c', bot: '#9d0208', lip: '#590d22', border: '#ffd166', text: '#ffffff' },
      crimson: { top: '#d62828', bot: '#780000', lip: '#4a0404', border: '#ffba08', text: '#ffd166' },
      jade:    { top: '#2d6a4f', bot: '#1b4332', lip: '#081c15', border: '#69f0ae', text: '#ffffff' },
      purple:  { top: '#5a189a', bot: '#3c096c', lip: '#10002b', border: '#e0aaff', text: '#ffd166' },
      gold:    { top: '#ffd166', bot: '#f4a261', lip: '#9c6644', border: '#ffffff', text: '#161020' },
      cyan:    { top: '#1d3557', bot: '#14213d', lip: '#0b132b', border: '#00f5d4', text: '#80ffdb' },
      slate:   { top: '#343a49', bot: '#212534', lip: '#11131c', border: '#8d99ae', text: '#e9ecef' },
      token:   { top: '#282240', bot: '#171428', lip: '#0b0914', border: '#ffd166', text: '#ffd166' }
    };

    const pal = palettes[o.variant || 'token'] || palettes.token;
    const topCol = o.disabled ? '#343a40' : (o.bg || pal.top);
    const botCol = o.disabled ? '#212529' : (o.bgBottom || pal.bot);
    const borderCol = o.disabled ? '#6c757d' : (o.border || pal.border);
    const txtCol = o.disabled ? '#adb5bd' : (o.textColor || pal.text);

    const dy = pressed ? 1.5 : hovered ? -1 : 0;
    const lipH = pressed ? 1 : Math.min(3, Math.max(1.5, h * 0.08));
    const bx = Math.round(x);
    const by = Math.round(y + dy);

    ctx.save();

    // 1. 立体底座暗唇 (3D Bevel Lip)
    if (!pressed) {
      traceChamferPath(ctx, bx, Math.round(by + lipH), w, h, cut);
      ctx.fillStyle = o.disabled ? 'rgba(0,0,0,0.35)' : pal.lip;
      ctx.fill();
    }

    // 悬停外发光
    if (hovered) {
      traceChamferPath(ctx, bx - 1, by - 1, w + 2, h + 2, cut + 1);
      ctx.fillStyle = withAlpha(borderCol, 0.24);
      ctx.fill();
    }

    // 2. 按钮主体渐变填充
    traceChamferPath(ctx, bx, by, w, h, cut);
    const grad = ctx.createLinearGradient(bx, by, bx, by + h);
    grad.addColorStop(0, topCol);
    grad.addColorStop(1, botCol);
    ctx.fillStyle = grad;
    ctx.fill();

    // 3. 内部高光玻璃顶带 + 动态斜向流光扫光 (Shimmer)
    ctx.save();
    ctx.clip();
    ctx.fillStyle = hovered ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.11)';
    ctx.fillRect(bx, by, w, Math.max(4, Math.round(h * 0.42)));

    if (typeof o.shimmerTime === 'number' && !o.disabled) {
      const period = 2.8;
      const prog = (o.shimmerTime % period) / period;
      if (prog < 0.55) {
        const sx = bx - 40 + (prog / 0.55) * (w + 80);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.beginPath();
        ctx.moveTo(sx, by);
        ctx.lineTo(sx + 22, by);
        ctx.lineTo(sx + 6, by + h);
        ctx.lineTo(sx - 16, by + h);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();

    // 4. 内嵌细线 + 主边框
    if (w >= 88 && h >= 30) {
      traceChamferPath(ctx, bx + 2.5, by + 2.5, w - 5, h - 5, Math.max(1, cut - 2));
      ctx.strokeStyle = withAlpha(borderCol, 0.30);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    traceChamferPath(ctx, bx, by, w, h, cut);
    ctx.lineWidth = hovered ? 2.2 : 1.7;
    ctx.strokeStyle = hovered ? '#ffffff' : borderCol;
    ctx.stroke();

    // 5. 左右对称鎏金宝珠铆钉（宽度足够的按钮显示，增添国风甲胄/牌匾细节）
    if (w >= 116 && h >= 30 && o.studs !== false) {
      ctx.fillStyle = borderCol;
      const sy = Math.round(by + h / 2);
      // 左菱钉
      ctx.beginPath();
      ctx.moveTo(bx + 8, sy - 2.5);
      ctx.lineTo(bx + 10.5, sy);
      ctx.lineTo(bx + 8, sy + 2.5);
      ctx.lineTo(bx + 5.5, sy);
      ctx.closePath();
      ctx.fill();
      // 右菱钉
      ctx.beginPath();
      ctx.moveTo(bx + w - 8, sy - 2.5);
      ctx.lineTo(bx + w - 5.5, sy);
      ctx.lineTo(bx + w - 8, sy + 2.5);
      ctx.lineTo(bx + w - 10.5, sy);
      ctx.closePath();
      ctx.fill();
    }

    // 6. 按钮主文案与副文案（带清晰暗影防发虚）
    if (label) {
      const fSize = o.fontSize || (h >= 42 ? 15 : h >= 32 ? 12 : 11);
      ctx.textAlign = 'center';
      ctx.font = `bold ${fSize}px sans-serif`;
      const ty = o.subText
        ? by + Math.round(h * 0.45) + 2
        : by + Math.round(h / 2 + fSize * 0.36) - 1;

      if (o.variant !== 'gold') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
        ctx.fillText(label, bx + w / 2, ty + 1);
      }
      ctx.fillStyle = txtCol;
      ctx.fillText(label, bx + w / 2, ty);

      if (o.subText) {
        ctx.font = '10px sans-serif';
        ctx.fillStyle = o.subColor || 'rgba(255, 255, 255, 0.85)';
        ctx.fillText(o.subText, bx + w / 2, by + h - 6);
      }
    }

    // 7. 右上角可领奖/可升级呼吸红点或金星角标
    if (o.badgeDot) {
      const dotX = bx + w - 4;
      const dotY = by + 4;
      ctx.fillStyle = typeof o.badgeDot === 'string' ? o.badgeDot : '#ff2a54';
      ctx.beginPath();
      ctx.arc(dotX, dotY, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * 绘制传统朱砂篆章方印（如「破劫」「妖王」「圆满」）
   */
  function drawSealStamp(ctx, x, y, size, text, bgCol, fgCol) {
    const s = size || 24;
    ctx.save();
    // 朱砂印底
    traceChamferPath(ctx, x, y, s, s, 3);
    ctx.fillStyle = bgCol || '#c1121f';
    ctx.fill();
    ctx.strokeStyle = fgCol || '#ffd166';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 印章内框细线
    ctx.strokeStyle = 'rgba(255, 243, 176, 0.55)';
    ctx.lineWidth = 0.9;
    ctx.strokeRect(x + 2.5, y + 2.5, s - 5, s - 5);

    ctx.fillStyle = fgCol || '#fff3b0';
    ctx.textAlign = 'center';
    const chars = String(text || '劫');
    if (chars.length <= 1) {
      ctx.font = `bold ${Math.round(s * 0.58)}px serif, sans-serif`;
      ctx.fillText(chars, x + s / 2, y + s * 0.72);
    } else if (chars.length === 2) {
      ctx.font = `bold ${Math.round(s * 0.38)}px serif, sans-serif`;
      ctx.fillText(chars[0], x + s / 2, y + s * 0.44);
      ctx.fillText(chars[1], x + s / 2, y + s * 0.82);
    } else {
      const half = Math.round(s * 0.34);
      ctx.font = `bold ${half}px serif, sans-serif`;
      ctx.fillText(chars.slice(0, 2), x + s / 2, y + s * 0.45);
      ctx.fillText(chars.slice(2, 4), x + s / 2, y + s * 0.82);
    }
    ctx.restore();
  }

  /**
   * 绘制对称中式如意分割线（── ❖ ──）
   */
  function drawDivider(ctx, cx, y, width, color) {
    const hw = Math.max(16, Math.round(width / 2));
    const col = color || '#ffd166';
    ctx.save();
    const gradL = ctx.createLinearGradient(cx - hw, y, cx - 6, y);
    gradL.addColorStop(0, withAlpha(col, 0));
    gradL.addColorStop(1, withAlpha(col, 0.55));
    ctx.fillStyle = gradL;
    ctx.fillRect(cx - hw, y, hw - 6, 1);

    const gradR = ctx.createLinearGradient(cx + 6, y, cx + hw, y);
    gradR.addColorStop(0, withAlpha(col, 0.55));
    gradR.addColorStop(1, withAlpha(col, 0));
    ctx.fillStyle = gradR;
    ctx.fillRect(cx + 6, y, hw - 6, 1);

    ctx.fillStyle = withAlpha(col, 0.85);
    ctx.beginPath();
    ctx.moveTo(cx, y - 3);
    ctx.lineTo(cx + 3.5, y);
    ctx.lineTo(cx, y + 3);
    ctx.lineTo(cx - 3.5, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /**
   * 高质感动作 RPG 状态槽（气血条 / 蓝条 / 妖王血槽 / 经验充能槽）
   * 支持受击残影缓冲白条 (lagRatio)、双阶玻璃光泽、刻度线与护盾晶格叠层
   */
  function drawGlossyBar(ctx, x, y, w, h, ratio, opts) {
    const o = opts || {};
    const r = Math.max(0, Math.min(1, ratio || 0));
    const lag = o.lagRatio !== undefined ? Math.max(r, Math.min(1, o.lagRatio)) : r;
    const cut = o.cut !== undefined ? o.cut : 2;

    ctx.save();
    // 1. 凹陷暗槽底框
    traceChamferPath(ctx, x, y, w, h, cut);
    ctx.fillStyle = o.bg || '#151224';
    ctx.fill();

    ctx.save();
    ctx.clip();

    // 2. 受击缓冲残影条（金白高亮过渡）
    if (lag > r + 0.004) {
      ctx.fillStyle = o.lagColor || 'rgba(255, 224, 130, 0.88)';
      ctx.fillRect(x, y, Math.round(w * lag), h);
    }

    // 3. 主进度双色立体渐变
    const fillW = Math.round(w * r);
    if (fillW > 0) {
      const g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, o.colorTop || '#ff4d6d');
      g.addColorStop(0.55, o.colorMid || o.colorBottom || '#e63946');
      g.addColorStop(1, o.colorBottom || '#9d0208');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, fillW, h);

      // 顶部玻璃反光条
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.fillRect(x, y + 1, fillW, Math.max(2, Math.floor(h * 0.28)));
    }

    // 4. 护盾晶格叠层（可选）
    if (o.shieldRatio && o.shieldRatio > 0) {
      const sw = Math.min(w, Math.round(w * o.shieldRatio));
      ctx.fillStyle = 'rgba(128, 255, 219, 0.72)';
      ctx.fillRect(x, y, sw, Math.max(3, Math.round(h * 0.32)));
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fillRect(x, y + h - 2, sw, 2);
    }

    // 5. 25% / 50% / 75% 分段刻度暗线
    if (o.segments !== false && w >= 90) {
      const segs = o.segments || 4;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
      for (let i = 1; i < segs; i++) {
        const sx = Math.round(x + (w * i) / segs);
        ctx.fillRect(sx, y, 1, Math.floor(h * 0.45));
      }
    }
    ctx.restore();

    // 6. 金属外沿细框
    traceChamferPath(ctx, x, y, w, h, cut);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = o.border || 'rgba(255, 255, 255, 0.24)';
    ctx.stroke();

    // 7. 内置数值文字
    if (o.label) {
      ctx.textAlign = 'center';
      ctx.font = o.font || `bold ${Math.max(9, h - 3)}px monospace, sans-serif`;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillText(o.label, x + w / 2, y + h - 2);
      ctx.fillStyle = o.textColor || '#ffffff';
      ctx.fillText(o.label, x + w / 2, y + h - 3);
    }
    ctx.restore();
  }

  /**
   * 模态弹窗暗金晕影遮罩 + 星尘背景（告别死黑平涂遮罩）
   */
  function drawModalBackdrop(ctx, sw, sh, globalTime, accentColor) {
    ctx.save();
    ctx.fillStyle = 'rgba(6, 5, 14, 0.84)';
    ctx.fillRect(0, 0, sw, sh);

    const rad = ctx.createRadialGradient(sw / 2, sh / 2, 30, sw / 2, sh / 2, Math.max(sw, sh) * 0.62);
    rad.addColorStop(0, withAlpha(accentColor || '#ffd166', 0.14));
    rad.addColorStop(1, 'rgba(3, 2, 8, 0.55)');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, sw, sh);

    // 缓慢飘浮的灵蕴微尘
    const t = globalTime || 0;
    ctx.fillStyle = withAlpha(accentColor || '#ffd166', 0.25);
    for (let i = 0; i < 14; i++) {
      const px = Math.round(((i * 113 + t * (8 + (i % 4) * 3)) % sw + sw) % sw);
      const py = Math.round(((i * 67 - t * (10 + (i % 3) * 4)) % sh + sh) % sh);
      const sz = i % 3 === 0 ? 3 : 2;
      ctx.fillRect(px, py, sz, sz);
    }
    ctx.restore();
  }

  /**
   * 展开式传统国风锦缎画轴（用于关卡入场横幅、章节宣旨）
   */
  function drawUnrollingScroll(ctx, cx, y, maxW, h, openRatio, title, subtitle, accentColor) {
    const ratio = Math.max(0.12, Math.min(1, openRatio));
    const curW = Math.round(maxW * ratio);
    const leftX = Math.round(cx - curW / 2);
    const rightX = Math.round(cx + curW / 2);
    const col = accentColor || '#ffd166';

    ctx.save();
    // 卷轴主体黑金织锦底
    ctx.fillStyle = 'rgba(18, 14, 30, 0.94)';
    ctx.fillRect(leftX, y, curW, h);

    // 上下锦边镶金线
    ctx.fillStyle = withAlpha(col, 0.22);
    ctx.fillRect(leftX, y, curW, 5);
    ctx.fillRect(leftX, y + h - 5, curW, 5);
    ctx.fillStyle = col;
    ctx.fillRect(leftX, y, curW, 1.8);
    ctx.fillRect(leftX, y + h - 1.8, curW, 1.8);
    ctx.fillStyle = withAlpha(col, 0.35);
    ctx.fillRect(leftX, y + 5, curW, 1);
    ctx.fillRect(leftX, y + h - 6, curW, 1);

    // 卷轴内部裁切文案（随画轴展开自然显露！）
    if (curW > 70) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(leftX + 10, y, curW - 20, h);
      ctx.clip();

      if (curW >= 220) {
        drawSealStamp(ctx, leftX + 16, y + Math.round((h - 26) / 2), 26, '破劫', '#b5171e', '#ffd166');
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(title || '', cx + (curW >= 220 ? 10 : 0), y + Math.round(h * 0.44));

      if (subtitle) {
        ctx.fillStyle = '#90e0ef';
        ctx.font = '11px sans-serif';
        ctx.fillText(subtitle, cx + (curW >= 220 ? 10 : 0), y + Math.round(h * 0.80));
      }
      ctx.restore();
    }

    // 左右紫檀鎏金轴杆 + 垂坠红流苏
    [leftX - 4, rightX - 4].forEach((rx, idx) => {
      // 轴身
      ctx.fillStyle = '#3d2618';
      ctx.fillRect(rx, y - 4, 8, h + 8);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(rx + 1, y - 7, 6, 4);
      ctx.fillRect(rx + 1, y + h + 3, 6, 4);
      ctx.fillRect(rx + 2, y + Math.round(h / 2) - 4, 4, 8);
      // 红色飘带流苏
      const sway = Math.sin((Date.now() * 0.005) + idx) * 2.5;
      ctx.strokeStyle = '#ef233c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rx + 4, y + h + 7);
      ctx.quadraticCurveTo(rx + 4 + sway, y + h + 14, rx + 4 + sway * 1.4, y + h + 20);
      ctx.stroke();
    });

    ctx.restore();
  }

  /**
   * 战斗触屏动作键矢量武道图腾（居于圆钮背景微光展示，让每个按键一眼可辨）
   */
  function drawCombatActionGlyph(ctx, actKey, color, r) {
    ctx.save();
    ctx.strokeStyle = withAlpha(color, 0.34);
    ctx.fillStyle = withAlpha(color, 0.22);
    ctx.lineWidth = 2;

    if (actKey === 'attack') {
      // 交叉金箍棒与破空斩弧
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.62, -Math.PI * 0.72, Math.PI * 0.22);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.44, r * 0.44);
      ctx.lineTo(r * 0.44, -r * 0.44);
      ctx.stroke();
    } else if (actKey === 'jump') {
      // 腾云双翼向上的双折羽标
      for (let i = 0; i < 2; i++) {
        const oy = -4 + i * 8;
        ctx.beginPath();
        ctx.moveTo(-10, oy + 4);
        ctx.lineTo(0, oy - 5);
        ctx.lineTo(10, oy + 4);
        ctx.stroke();
      }
    } else if (actKey === 'roll') {
      // 疾风旋涡流线
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.46, 0, Math.PI * 1.45);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(10, -4);
      ctx.stroke();
    } else if (actKey === 'skill') {
      // 四芒星神通法阵
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const ang = (i * Math.PI) / 4;
        const rad = i % 2 === 0 ? r * 0.56 : r * 0.22;
        const px = Math.cos(ang) * rad;
        const py = Math.sin(ang) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (actKey === 'subWeapon') {
      // 乾坤法宝圆环
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.44, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.54);
      ctx.lineTo(r * 0.16, 0);
      ctx.lineTo(0, r * 0.54);
      ctx.lineTo(-r * 0.16, 0);
      ctx.closePath();
      ctx.fill();
    } else if (actKey === 'slam') {
      // 千钧坠地震波箭头
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(0, 6);
      ctx.moveTo(-7, 0);
      ctx.lineTo(0, 8);
      ctx.lineTo(7, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  return {
    traceChamferPath,
    withAlpha,
    drawCornerOrnaments,
    drawOrnatePanel,
    drawOrnateButton,
    drawSealStamp,
    drawDivider,
    drawGlossyBar,
    drawModalBackdrop,
    drawUnrollingScroll,
    drawCombatActionGlyph
  };
});
