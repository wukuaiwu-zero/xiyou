/**
 * 《西游破劫录》九九八十一难·百妖谱图鉴与选难试炼弹窗 (src/ui/bestiaryModal.js)
 * 美术升级版：黑金漆器雕花框、镇妖法阵聚光展台、朱砂品阶印章与流光试炼按钮
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
})('bestiaryModal', function (require) {
  const { TRIBULATIONS_81, NINE_CHAPTERS } = require('../config/tribulations81');
  const UITheme = require('./uiTheme');

  const state = {
    chapterIdx: 0,
    selectedNo: 1
  };

  function launchTribulationTrial(app, ui, trib) {
    if (!app || !trib) return;
    if (typeof app.jumpToTribulation === 'function') {
      app.jumpToTribulation(trib.no);
      return;
    }
    app.modal = null;
    app.startNewRun(app.selectedCharId, { tribulationNo: trib.no });
    ui && ui.showToast(`⚔ 踏入【第${trib.no}难 · ${trib.tribName}】迎战 ${trib.monsterName}！`, 3.0);
  }

  function renderBestiaryModal(ctx, sw, sh, app, ui) {
    ui.clearButtons();
    UITheme.drawModalBackdrop(ctx, sw, sh, app.globalTime, '#ffd166');

    const mw = Math.min(784, sw - 22);
    const mh = Math.min(434, sh - 18);
    const mx = Math.round((sw - mw) / 2);
    const my = Math.round((sh - mh) / 2);

    ui.beginModalPop && ui.beginModalPop(ctx, sw, sh);

    UITheme.drawOrnatePanel(ctx, mx, my, mw, mh, '#141124', '#ffd166', 8, {
      headerBand: 36,
      topCrest: true,
      corners: true,
      glowColor: '#ffd166'
    });

    // 1. 顶部朱砂印章标题与立体关闭按钮
    UITheme.drawSealStamp(ctx, mx + 12, my + 6, 24, '妖谱', '#9d0208', '#ffd166');
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('九九八十一难 · 百妖像素全图鉴（全 81 难动态立绘 · 点击可直达试炼）', mx + 42, my + 24);

    const closeW = 58;
    const closeX = mx + mw - closeW - 12;
    UITheme.drawOrnateButton(
      ctx,
      closeX,
      my + 6,
      closeW,
      25,
      '关闭 ×',
      ui.getBtnVisualState ? ui.getBtnVisualState(closeX, my + 6, closeW, 25, { variant: 'slate', studs: false, fontSize: 11 }) : { variant: 'slate', studs: false, fontSize: 11 }
    );
    ui.addButton('bestiary_close', closeX, my + 6, closeW, 25, () => {
      app.modal = null;
    });

    // 2. 九重劫卷分页令牌栏
    const tabTop = my + 40;
    const tabGap = 4;
    const tabAreaW = mw - 24;
    const tabW = Math.floor((tabAreaW - tabGap * 8) / 9);
    const tabH = 25;

    NINE_CHAPTERS.forEach((ch, idx) => {
      const tx = mx + 12 + idx * (tabW + tabGap);
      const active = state.chapterIdx === idx;
      const hov = ui.isRectHovered && ui.isRectHovered(tx, tabTop, tabW, tabH);
      UITheme.drawOrnatePanel(
        ctx,
        tx,
        tabTop,
        tabW,
        tabH,
        active ? '#9d0208' : hov ? '#292246' : '#1b1730',
        active ? '#ffd166' : '#4a4e69',
        3,
        { shadow: false, innerFrame: false }
      );
      ctx.textAlign = 'center';
      ctx.fillStyle = active ? '#fff3b0' : '#ced4da';
      ctx.font = active ? 'bold 11px sans-serif' : '10px sans-serif';
      const label = tabW < 72 ? `${idx + 1}卷(${idx * 9 + 1}-${idx * 9 + 9})` : ch.shortName;
      ctx.fillText(label, tx + tabW / 2, tabTop + 16);
      ui.addButton(`bestiary_tab_${idx}`, tx, tabTop, tabW, tabH, () => {
        state.chapterIdx = idx;
        state.selectedNo = idx * 9 + 1;
      });
    });

    // 3. 左侧 3x3 劫难怪物网格 + 右侧镇妖鉴宝详情台
    const contentTop = tabTop + tabH + 8;
    const contentH = mh - (contentTop - my) - 10;
    const detailW = Math.min(244, Math.floor(mw * 0.33));
    const gridAreaW = mw - 24 - detailW - 10;

    const list = TRIBULATIONS_81.filter((t) => t.chapter === state.chapterIdx);
    const cols = 3;
    const rows = 3;
    const cellGap = 6;
    const cellW = Math.floor((gridAreaW - cellGap * (cols - 1)) / cols);
    const cellH = Math.floor((contentH - cellGap * (rows - 1)) / rows);

    const animFrame = Math.floor((app.globalTime || 0) * 4.5) % 2 === 0 ? 'f0' : 'f1';

    list.forEach((trib, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const cx = mx + 12 + c * (cellW + cellGap);
      const cy = contentTop + r * (cellH + cellGap);
      const isSel = state.selectedNo === trib.no;
      const isHov = ui.isRectHovered && ui.isRectHovered(cx, cy, cellW, cellH);

      const rankBorder =
        trib.rank === 'boss' ? '#ff9f1c' : trib.rank === 'elite' ? '#c77dff' : '#4a4e69';
      UITheme.drawOrnatePanel(
        ctx,
        cx,
        cy,
        cellW,
        cellH,
        isSel ? '#2d1c48' : isHov ? '#211b3a' : '#171429',
        isSel ? '#ffd166' : rankBorder,
        4,
        { shadow: false, glowColor: isSel ? '#ffd166' : null }
      );

      // 精灵底座微光环 + 像素小立绘
      const sprZoneW = Math.floor(cellW * 0.37);
      ctx.fillStyle = UITheme.withAlpha(rankBorder, 0.16);
      ctx.beginPath();
      ctx.ellipse(cx + 6 + sprZoneW / 2, cy + cellH - 12, Math.max(10, sprZoneW * 0.36), 4, 0, 0, Math.PI * 2);
      ctx.fill();

      const spr =
        (app.assetLoader.getMonsterHiResSprite && app.assetLoader.getMonsterHiResSprite(trib.id, animFrame)) ||
        app.assetLoader.getEnemySprite(trib.id, animFrame);
      if (spr) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        const maxSprH = cellH - 14;
        const sc = Math.min(1.0, sprZoneW / spr.width, maxSprH / spr.height);
        const dw = Math.max(16, Math.round(spr.width * sc));
        const dh = Math.max(16, Math.round(spr.height * sc));
        ctx.drawImage(spr, Math.round(cx + 6 + (sprZoneW - dw) / 2), Math.round(cy + (cellH - dh) / 2), dw, dh);
        ctx.restore();
      }

      const textX = cx + Math.floor(cellW * 0.41);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`第${trib.no}难 · ${trib.tribName}`, textX, cy + 17);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      const shortMonster = trib.monsterName.split(' · ')[0].slice(0, 7);
      ctx.fillText(shortMonster, textX, cy + 34);

      const rankTag = trib.rank === 'boss' ? '👹 守关妖王' : trib.rank === 'elite' ? '🟣 劫难头目' : '⚔ 巡山妖兵';
      ctx.fillStyle = trib.rank === 'boss' ? '#ff9f1c' : trib.rank === 'elite' ? '#e0aaff' : '#90e0ef';
      ctx.font = '10px sans-serif';
      ctx.fillText(rankTag, textX, cy + 50);

      ui.addButton(`bestiary_item_${trib.no}`, cx, cy, cellW, cellH, () => {
        state.selectedNo = trib.no;
      });
    });

    // 4. 右侧【镇妖鉴宝展台】
    const selTrib =
      TRIBULATIONS_81.find((t) => t.no === state.selectedNo) || list[0] || TRIBULATIONS_81[0];
    const dx = mx + 12 + gridAreaW + 10;
    const dy = contentTop;
    const themeCol = selTrib.color || '#ffd166';

    UITheme.drawOrnatePanel(ctx, dx, dy, detailW, contentH, '#19152e', themeCol, 6, {
      corners: true,
      headerBand: 28,
      glowColor: themeCol
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`第${selTrib.no}难 · ${selTrib.tribName}`, dx + detailW / 2, dy + 19);

    // 立绘高台 + 天顶聚光灯束 + 地面旋转镇妖阵
    const stageH = Math.min(114, Math.floor(contentH * 0.37));
    const stX = dx + 12;
    const stY = dy + 33;
    const stW = detailW - 24;
    UITheme.drawOrnatePanel(ctx, stX, stY, stW, stageH, '#0c0a18', '#3d405b', 4, {
      shadow: false,
      innerFrame: false
    });

    ctx.save();
    ctx.beginPath();
    ctx.rect(stX + 2, stY + 2, stW - 4, stageH - 4);
    ctx.clip();
    // 聚光天柱
    const spotG = ctx.createLinearGradient(0, stY, 0, stY + stageH);
    spotG.addColorStop(0, UITheme.withAlpha(themeCol, 0.22));
    spotG.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = spotG;
    ctx.beginPath();
    ctx.moveTo(dx + detailW / 2 - 18, stY);
    ctx.lineTo(dx + detailW / 2 + 18, stY);
    ctx.lineTo(dx + detailW / 2 + 48, stY + stageH);
    ctx.lineTo(dx + detailW / 2 - 48, stY + stageH);
    ctx.closePath();
    ctx.fill();

    // 镇妖底座椭圆光阵
    ctx.strokeStyle = UITheme.withAlpha(themeCol, 0.65);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(dx + detailW / 2, stY + stageH - 13, 38, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 品阶朱砂小方印
    const sealText = selTrib.rank === 'boss' ? '妖王' : selTrib.rank === 'elite' ? '头目' : '妖兵';
    UITheme.drawSealStamp(ctx, stX + 6, stY + 6, 24, sealText, '#590d22', themeCol);

    const bigSpr =
      (app.assetLoader.getMonsterHiResSprite && app.assetLoader.getMonsterHiResSprite(selTrib.id, animFrame)) ||
      app.assetLoader.getBossSprite(selTrib.id, animFrame);
    if (bigSpr) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      const sc = Math.min(1.62, (stW - 36) / bigSpr.width, (stageH - 16) / bigSpr.height);
      const dw = Math.round(bigSpr.width * sc);
      const dh = Math.round(bigSpr.height * sc);
      ctx.drawImage(
        bigSpr,
        Math.round(dx + detailW / 2 - dw / 2),
        Math.round(stY + (stageH - dh) / 2 - 2),
        dw,
        dh
      );
      ctx.restore();
    }

    let infoY = stY + stageH + 17;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(selTrib.monsterName, dx + detailW / 2, infoY);

    infoY += 16;
    ctx.fillStyle = '#80ffdb';
    ctx.font = '11px sans-serif';
    ctx.fillText(`⚔ 兵刃法宝：${selTrib.weapon}`, dx + detailW / 2, infoY);

    UITheme.drawDivider(ctx, dx + detailW / 2, infoY + 8, detailW - 32, themeCol);

    // 原著考据自动多行折行
    infoY += 23;
    ctx.fillStyle = '#ced4da';
    ctx.font = '11px sans-serif';
    const lore = selTrib.lore || '';
    const lineChars = Math.max(12, Math.floor((detailW - 24) / 11.5));
    for (let ln = 0; ln < 3; ln++) {
      const seg = lore.slice(ln * lineChars, (ln + 1) * lineChars);
      if (!seg) break;
      ctx.fillText(seg, dx + detailW / 2, infoY + ln * 15);
    }

    // 底部【⚔ 试炼此难】流光雕花主按钮
    const btnH = 34;
    const btnY = dy + contentH - btnH - 10;
    const btnX = dx + 14;
    const btnW = detailW - 28;
    UITheme.drawOrnateButton(
      ctx,
      btnX,
      btnY,
      btnW,
      btnH,
      `⚔ 立即试炼第 ${selTrib.no} 难`,
      ui.getBtnVisualState
        ? ui.getBtnVisualState(btnX, btnY, btnW, btnH, { variant: 'primary', fontSize: 13, shimmerTime: app.globalTime })
        : { variant: 'primary', fontSize: 13 }
    );
    ui.addButton('bestiary_launch_trial', btnX, btnY, btnW, btnH, () => {
      launchTribulationTrial(app, ui, selTrib);
    });

    ui.endModalPop && ui.endModalPop(ctx);
  }

  return {
    state,
    renderBestiaryModal,
    launchTribulationTrial
  };
});
