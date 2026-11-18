/**
 * 手机独立单文件版打包脚本 (scripts/build-mobile.js)
 * 零第三方依赖，将 src/ 下全部模块内联打包为单文件 HTML（mobile.html 与 西游破劫录_手机单文件版.html），
 * 支持：
 * 1. 局域网手机扫码直接打开即玩
 * 2. AirDrop / 微信文件传输助手发送到 iPhone / Android 离线单文件即点即玩
 * 3. 手机开启竖屏方向锁定时自动 90° 满屏横版渲染 + 触控无缝映射 + iOS WebApp 全屏沉浸体验
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const MODULE_ORDER = [
  'src/config/sdkConfig.js',
  'src/config/characters.js',
  'src/config/weapons.js',
  'src/config/equipment.js',
  'src/config/progressionCurve.js',
  'src/config/tribulations81.js',
  'src/config/terrainRegions81.js',
  'src/config/biomes.js',
  'src/config/dialogueBank.js',
  'src/platform/env.js',
  'src/sdk/douyinSDK.js',
  'src/audio/soundFX.js',
  'src/assets/monsters81Sprites.js',
  'src/assets/equipAndMatSprites.js',
  'src/assets/heroModelEngine.js',
  'src/assets/pixelSprites.js',
  'src/assets/assetLoader.js',
  'src/world/terrainRenderer.js',
  'src/world/levelGen.js',
  'src/entities/effects.js',
  'src/entities/player.js',
  'src/entities/enemy.js',
  'src/ui/uiTheme.js',
  'src/ui/bestiaryModal.js',
  'src/ui/hudAndModals.js',
  'src/core/gameApp.js',
  'src/core/curveDirector.js',
  'src/core/equipForgeDirector.js',
  'src/core/actionMovesetDirector.js',
  'src/ui/cutsceneDirector.js',
  'src/platform/systemOptimizer.js'
];

const bundledCode = MODULE_ORDER.map((rel) => {
  const full = path.join(ROOT, rel);
  return `// ====== MODULE: ${rel} ======\n` + fs.readFileSync(full, 'utf8');
}).join('\n\n');

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="西游破劫录" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="format-detection" content="telephone=no, email=no" />
  <title>西游破劫录 · 手机触屏版</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
      -webkit-tap-highlight-color: transparent;
    }
    html, body {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      overscroll-behavior: none;
      background: #0b0914;
      touch-action: none;
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    }
    #gameCanvas {
      display: block;
      width: 100%;
      height: 100%;
      touch-action: none;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }
    /* 顶部极简折叠联调球（可随时展开测试死亡看广告复活，不影响正常游玩） */
    #mobileDebugFab {
      position: fixed;
      top: env(safe-area-inset-top, 6px);
      left: 50%;
      transform: translateX(-50%);
      z-index: 30;
      display: none;
      gap: 6px;
      align-items: center;
      background: linear-gradient(180deg, rgba(28, 22, 48, 0.88), rgba(14, 11, 26, 0.94));
      border: 1px solid rgba(255, 209, 102, 0.6);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
      border-radius: 999px;
      padding: 4px 11px;
      font-size: 11px;
      color: #ffd166;
    }
    #mobileDebugFab button {
      background: linear-gradient(180deg, #ef233c, #9d0208);
      color: #fff;
      border: 1px solid #ffd166;
      border-radius: 999px;
      padding: 2px 9px;
      font-size: 11px;
      font-weight: 600;
    }
    #mobileDebugFab .close {
      background: linear-gradient(180deg, #343a49, #212534);
      border-color: #8d99ae;
      color: #e9ecef;
    }
  </style>
</head>
<body>
  <canvas id="gameCanvas"></canvas>

  <div id="mobileDebugFab">
    <button id="mBtnEquip">✨ 爆神装</button>
    <button id="mBtnDeath">🎬 测复活</button>
    <button id="mBtnBoss">👹 Boss</button>
    <button id="mBtnClose" class="close">隐藏</button>
  </div>

  <script>
${bundledCode}

    (function () {
      // 阻止 iOS 橡皮筋下拉弹性滚动、双指缩放与 Android 长按弹出系统菜单
      document.addEventListener('touchmove', function (e) {
        if (e.scale !== 1) e.preventDefault();
      }, { passive: false });
      document.addEventListener('gesturestart', function (e) {
        e.preventDefault();
      });
      document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
      });

      const { GameApp } = window.XiyouRegistry.gameApp;
      const app = new GameApp();
      // 手机版默认强制开启触屏虚拟摇杆与按键
      app.ui.showTouchControls = true;
      app.boot();
      window.__xiyouGame = app;

      let hideFab = false;
      const fab = document.getElementById('mobileDebugFab');
      setInterval(function () {
        if (!fab || hideFab) return;
        // 仅在战斗且非竖屏旋转且无遮挡时展示迷你测试胶囊（避免遮挡竖屏自动旋转矩阵）
        fab.style.display = (app.state === 'PLAYING' && !app.rotatedPortrait && !app.modal && !(app.bossEntity && app.bossEntity.activated)) ? 'flex' : 'none';
      }, 250);

      document.getElementById('mBtnEquip').addEventListener('click', function (e) {
        e.stopPropagation();
        if (app.player && app.level) {
          app.spawnEquipmentDrop(app.player.x + app.player.dir * 22, app.player.y, 'boss');
        }
      });
      document.getElementById('mBtnDeath').addEventListener('click', function (e) {
        e.stopPropagation();
        if (app.player && !app.player.dead) {
          app.player.invulnTimer = 0;
          app.player.reviveAuraTimer = 0;
          app.player.shieldHp = 0;
          app.handleHitPlayer(99999, -1);
        }
      });
      document.getElementById('mBtnBoss').addEventListener('click', function (e) {
        e.stopPropagation();
        if (app.player && app.level) {
          app.player.placeAt(app.level.bossArenaStartPx + 36, app.level.bossSpawn.y);
        }
      });
      document.getElementById('mBtnClose').addEventListener('click', function (e) {
        e.stopPropagation();
        hideFab = true;
        fab.style.display = 'none';
      });
    })();
  </script>
</body>
</html>
`;

const outMobile = path.join(ROOT, 'mobile.html');
const outStandaloneCn = path.join(ROOT, '西游破劫录_手机单文件版.html');
fs.writeFileSync(outMobile, html, 'utf8');
fs.writeFileSync(outStandaloneCn, html, 'utf8');
console.log('Built mobile single-file packages successfully:', {
  mobileHtmlKB: Math.round(Buffer.byteLength(html, 'utf8') / 1024),
  files: [outMobile, outStandaloneCn]
});
