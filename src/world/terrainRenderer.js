/**
 * 西游十二大独立地域像素渲染引擎 (src/world/terrainRenderer.js)
 *
 * 高细节场景美术升级版：
 * - 12 套多层视差远景（繁星流云、山间雾带、古刹飞檐、索桥飞瀑、断佛残塔、龙宫摇曳海草、灵山万道霞光）
 * - 高细节 16-Bit 地标装饰物（袅袅香火土地庙、双火盆镇魔牌楼、暖光摇曳宫灯、夜明珠仙蚌、金莲宝灯）
 * - 确定性哈希地表微生态（崖壁阴阳立体倒角、草簇/青苔/鬼火蘑菇/珊瑚芽/金莲瓣、跳台包角挂穗）
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
})('terrainRenderer', function () {
  const TILE_SIZE = 24;
  const TILE_EMPTY = 0;
  const TILE_SOLID = 1;
  const TILE_ONEWAY = 2;
  const TILE_HAZARD = 3;
  const TILE_ICE = 4;
  const TILE_QUICKSAND = 5;
  const TILE_WEB = 6;
  const TILE_CRUMBLE = 7;
  const TILE_BOUNCE = 8;
  const TILE_UPDRAFT = 9;

  // 绘制像素流云团辅助
  function drawPixelCloud(wctx, x, y, w, color) {
    wctx.fillStyle = color;
    wctx.fillRect(x, y, w, 5);
    wctx.fillRect(x + 6, y - 4, Math.max(8, w - 14), 4);
    wctx.fillRect(x + 12, y - 7, Math.max(4, Math.floor(w * 0.42)), 3);
  }

  // ==================== 1. 十二大地域专属视差远景天幕 ====================
  function renderBackdrop(wctx, ww, wh, camX, globalTime, region, level) {
    // 基础三段柔化天幕渐变
    const skyGrad = wctx.createLinearGradient(0, 0, 0, wh);
    skyGrad.addColorStop(0, region.skyTop || '#0d1321');
    skyGrad.addColorStop(1, region.skyBottom || '#1d2d44');
    wctx.fillStyle = skyGrad;
    wctx.fillRect(0, 0, ww, wh);

    const rid = region.id || 'heifeng_temple';

    // 夜幕/幽冥/雪域闪烁星辰层（极轻量确定性坐标）
    const starryRegions =
      rid === 'heifeng_temple' ||
      rid === 'liangjie_canyon' ||
      rid === 'liusha_river' ||
      rid === 'baigu_crypt' ||
      rid === 'tongtian_glacier' ||
      rid === 'pingding_grotto' ||
      rid === 'shituo_empire';
    if (starryRegions) {
      for (let s = 0; s < 18; s++) {
        const sx = Math.round((((s * 79 - camX * 0.02) % ww) + ww) % ww);
        const sy = 10 + ((s * 37) % Math.floor(wh * 0.46));
        const blink = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(globalTime * 2.8 + s * 1.9));
        wctx.fillStyle = `rgba(255, 243, 196, ${blink.toFixed(2)})`;
        wctx.fillRect(sx, sy, s % 5 === 0 ? 2 : 1, s % 5 === 0 ? 2 : 1);
      }
    }

    // 天象主体（明月 / 万丈佛轮 / 血月 / 极光 / 水底折射光束）
    if (rid === 'lingshan_thunder') {
      const sunX = Math.round(ww * 0.72 - camX * 0.03);
      const sunY = 64;
      // 旋转万道佛光霞线
      wctx.save();
      wctx.translate(sunX, sunY);
      wctx.rotate(globalTime * 0.12);
      wctx.strokeStyle = 'rgba(255, 214, 10, 0.12)';
      wctx.lineWidth = 3;
      for (let r = 0; r < 12; r++) {
        const a = (r * Math.PI) / 6;
        wctx.beginPath();
        wctx.moveTo(Math.cos(a) * 24, Math.sin(a) * 24);
        wctx.lineTo(Math.cos(a) * 96, Math.sin(a) * 96);
        wctx.stroke();
      }
      wctx.restore();

      wctx.fillStyle = 'rgba(255, 209, 102, 0.16)';
      wctx.beginPath();
      wctx.arc(sunX, sunY, 58 + Math.sin(globalTime * 2) * 4, 0, Math.PI * 2);
      wctx.fill();
      wctx.fillStyle = 'rgba(255, 214, 10, 0.30)';
      wctx.beginPath();
      wctx.arc(sunX, sunY, 36, 0, Math.PI * 2);
      wctx.fill();
      wctx.fillStyle = '#fff3b0';
      wctx.beginPath();
      wctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
      wctx.fill();
    } else if (rid === 'bibo_dragonpalace') {
      // 碧波潭水底丁达尔折射光柱
      wctx.fillStyle = 'rgba(0, 245, 212, 0.08)';
      for (let i = 0; i < 6; i++) {
        const bx = Math.round(((i * 130 - camX * 0.08 + Math.sin(globalTime + i) * 6) % (ww + 120) + ww + 120) % (ww + 120) - 60);
        wctx.beginPath();
        wctx.moveTo(bx, 0);
        wctx.lineTo(bx + 26, 0);
        wctx.lineTo(bx + 78, wh);
        wctx.lineTo(bx + 32, wh);
        wctx.closePath();
        wctx.fill();
      }
    } else if (rid === 'shituo_empire' || rid === 'huoyan_volcano') {
      // 狮驼血月 / 火焰赤日
      const mx = Math.round(ww * 0.76 - camX * 0.04);
      wctx.fillStyle = rid === 'shituo_empire' ? 'rgba(217, 4, 41, 0.22)' : 'rgba(255, 186, 8, 0.20)';
      wctx.beginPath();
      wctx.arc(mx, 62, 46 + Math.sin(globalTime * 2.5) * 3, 0, Math.PI * 2);
      wctx.fill();
      wctx.fillStyle = rid === 'shituo_empire' ? 'rgba(239, 35, 60, 0.38)' : 'rgba(255, 159, 28, 0.35)';
      wctx.beginPath();
      wctx.arc(mx, 62, 31, 0, Math.PI * 2);
      wctx.fill();
      wctx.fillStyle = rid === 'shituo_empire' ? '#ef233c' : '#ffba08';
      wctx.beginPath();
      wctx.arc(mx, 62, 20, 0, Math.PI * 2);
      wctx.fill();
    } else if (rid === 'tongtian_glacier') {
      // 通天冰河寒夜波动极光带
      for (let i = 0; i < 3; i++) {
        wctx.fillStyle = i === 1 ? 'rgba(128, 255, 219, 0.13)' : 'rgba(144, 224, 239, 0.10)';
        for (let x = 0; x < ww; x += 24) {
          const ay = 24 + i * 18 + Math.round(Math.sin(globalTime * 1.4 + x * 0.02 + i) * 6);
          wctx.fillRect(x, ay, 25, 8);
        }
      }
      wctx.fillStyle = '#e0fbfc';
      wctx.beginPath();
      wctx.arc(Math.round(ww * 0.78 - camX * 0.03), 50, 16, 0, Math.PI * 2);
      wctx.fill();
    } else if (rid === 'baigu_crypt') {
      // 白骨幽冥妖翠弦月
      const mx = Math.round(ww * 0.75 - camX * 0.04);
      wctx.fillStyle = 'rgba(128, 255, 219, 0.15)';
      wctx.beginPath();
      wctx.arc(mx, 56, 28, 0, Math.PI * 2);
      wctx.fill();
      wctx.fillStyle = '#80ffdb';
      wctx.beginPath();
      wctx.arc(mx, 56, 18, 0, Math.PI * 2);
      wctx.fill();
      wctx.fillStyle = region.skyTop;
      wctx.beginPath();
      wctx.arc(mx + 7, 52, 16, 0, Math.PI * 2);
      wctx.fill();
    } else if (rid === 'heifeng_temple' || rid === 'liangjie_canyon' || rid === 'liusha_river' || rid === 'pingding_grotto') {
      // 清辉古月轮
      const mx = Math.round(ww * 0.78 - camX * 0.03);
      wctx.fillStyle = 'rgba(255, 243, 176, 0.12)';
      wctx.beginPath();
      wctx.arc(mx, 54, 30, 0, Math.PI * 2);
      wctx.fill();
      wctx.fillStyle = '#fff3b0';
      wctx.beginPath();
      wctx.arc(mx, 54, 15, 0, Math.PI * 2);
      wctx.fill();
    }

    // 高空缓慢流动的像素流云层（洞窟与海底除外）
    if (rid !== 'baigu_crypt' && rid !== 'bibo_dragonpalace' && rid !== 'xiliang_spiders') {
      const cloudCol =
        rid === 'huoyan_volcano' || rid === 'shituo_empire'
          ? 'rgba(255, 107, 53, 0.11)'
          : rid === 'lingshan_thunder'
          ? 'rgba(255, 214, 10, 0.18)'
          : 'rgba(224, 251, 252, 0.09)';
      for (let c = 0; c < 5; c++) {
        const cw = 36 + (c % 3) * 14;
        const cx = Math.round((((c * 148 - camX * 0.07 + globalTime * (5 + c)) % (ww + 90)) + ww + 90) % (ww + 90) - 45);
        const cy = 34 + (c % 3) * 24;
        drawPixelCloud(wctx, cx, cy, cw, cloudCol);
      }
    }

    // 远景第一层 + 第二层：按 12 大地域定制地貌剪影！
    switch (rid) {
      case 'liangjie_canyon': {
        // 五行山五指峰剪影 + 峰间悬索桥 + 鹰愁涧银白飞瀑水雾
        wctx.fillStyle = region.mountainFar;
        for (let i = -1; i < 8; i++) {
          const mx = Math.round(i * 140 - ((camX * 0.15) % 140));
          for (let f = 0; f < 5; f++) {
            const fh = 74 + (f === 2 ? 40 : f === 1 || f === 3 ? 25 : 12);
            wctx.fillRect(mx + 24 + f * 15, wh - fh, 13, fh);
            wctx.fillRect(mx + 26 + f * 15, wh - fh - 3, 9, 3);
          }
          // 远山峰间古索桥细影
          wctx.strokeStyle = 'rgba(149, 213, 178, 0.22)';
          wctx.lineWidth = 1;
          wctx.beginPath();
          wctx.moveTo(mx + 95, wh - 76);
          wctx.quadraticCurveTo(mx + 130, wh - 66, mx + 164, wh - 78);
          wctx.stroke();

          // 山顶如来六字真言金帖微光
          wctx.fillStyle = 'rgba(255, 209, 102, 0.65)';
          wctx.fillRect(mx + 56, wh - 110, 5, 16);
          wctx.fillStyle = '#d62828';
          wctx.fillRect(mx + 57, wh - 107, 3, 10);
          wctx.fillStyle = region.mountainFar;
        }
        wctx.fillStyle = region.mountainNear;
        for (let i = -1; i < 9; i++) {
          const mx = Math.round(i * 108 - ((camX * 0.32) % 108));
          const mh = 68 + ((i * 31) % 36);
          wctx.fillRect(mx, wh - mh, 74, mh);
          // 崖顶古松剪影
          wctx.fillRect(mx + 12, wh - mh - 10, 4, 10);
          wctx.fillRect(mx + 6, wh - mh - 14, 16, 5);
          if (i % 2 === 0) {
            wctx.fillStyle = 'rgba(144, 224, 239, 0.45)';
            wctx.fillRect(mx + 30, wh - mh + 4, 10, mh);
            const dropOff = Math.floor(globalTime * 28) % 12;
            wctx.fillStyle = '#caf0f8';
            for (let wy = wh - mh + 6 + dropOff; wy < wh; wy += 12) {
              wctx.fillRect(mx + 33, wy, 4, 6);
            }
            // 瀑底水雾团
            wctx.fillStyle = 'rgba(202, 240, 248, 0.25)';
            wctx.fillRect(mx + 22, wh - 12, 26, 12);
            wctx.fillStyle = region.mountainNear;
          }
        }
        break;
      }

      case 'huangfeng_ridge': {
        // 风蚀大漠沙丘 + 巨型断头西域石佛残躯 + 佛背残破石光轮
        wctx.fillStyle = region.mountainFar;
        for (let i = -1; i < 8; i++) {
          const mx = Math.round(i * 136 - ((camX * 0.16) % 136));
          wctx.beginPath();
          wctx.moveTo(mx, wh);
          wctx.quadraticCurveTo(mx + 68, wh - 116, mx + 142, wh);
          wctx.fill();
          // 远景西域残塔尖
          if (i % 2 === 0) {
            wctx.fillRect(mx + 62, wh - 86, 12, 34);
            wctx.fillRect(mx + 58, wh - 88, 20, 4);
            wctx.fillRect(mx + 66, wh - 98, 4, 10);
          }
        }
        wctx.fillStyle = region.mountainNear;
        for (let i = -1; i < 9; i++) {
          const mx = Math.round(i * 116 - ((camX * 0.32) % 116));
          wctx.beginPath();
          wctx.moveTo(mx, wh);
          wctx.quadraticCurveTo(mx + 58, wh - 72, mx + 120, wh);
          wctx.fill();
          if (i % 2 === 1) {
            wctx.strokeStyle = 'rgba(233, 196, 106, 0.25)';
            wctx.lineWidth = 2;
            wctx.beginPath();
            wctx.arc(mx + 55, wh - 92, 26, Math.PI * 0.85, Math.PI * 2.15);
            wctx.stroke();
            wctx.fillRect(mx + 36, wh - 92, 38, 48);
            wctx.fillRect(mx + 45, wh - 108, 20, 16);
          }
        }
        break;
      }

      case 'liusha_river': {
        // 万寿山五庄仙峰 + 人参果巨树仙冠 + 八百里流沙双层波涛
        wctx.fillStyle = region.mountainFar;
        for (let i = -1; i < 8; i++) {
          const mx = Math.round(i * 140 - ((camX * 0.15) % 140));
          wctx.fillRect(mx + 30, wh - 118, 60, 118);
          if (i % 2 === 0) {
            wctx.fillStyle = '#1b4332';
            wctx.fillRect(mx + 10, wh - 144, 100, 30);
            wctx.fillRect(mx + 22, wh - 154, 76, 12);
            // 发光人参仙果
            wctx.fillStyle = '#ffd166';
            wctx.fillRect(mx + 30, wh - 134, 4, 5);
            wctx.fillRect(mx + 62, wh - 140, 4, 5);
            wctx.fillRect(mx + 86, wh - 131, 4, 5);
            wctx.fillStyle = '#ff70a6';
            wctx.fillRect(mx + 46, wh - 126, 4, 4);
            wctx.fillStyle = region.mountainFar;
          }
        }
        const waveShift = Math.round(globalTime * 22);
        wctx.fillStyle = 'rgba(0, 180, 216, 0.22)';
        for (let x = -20; x < ww + 20; x += 22) {
          const wy = wh - 44 + Math.round(Math.sin((x + waveShift) * 0.06) * 4);
          wctx.fillRect(x, wy, 18, 48);
          wctx.fillStyle = 'rgba(190, 233, 232, 0.28)';
          wctx.fillRect(x + 2, wy, 12, 2);
          wctx.fillStyle = 'rgba(0, 180, 216, 0.22)';
        }
        break;
      }

      case 'baigu_crypt': {
        // 顶部洞窟倒悬钟乳 + 悬挂鬼火铁链笼 + 远景巨型枯骨肋架
        wctx.fillStyle = region.mountainFar;
        for (let i = -1; i < 10; i++) {
          const mx = Math.round(i * 92 - ((camX * 0.2) % 92));
          const sh = 32 + ((i * 23) % 38);
          wctx.beginPath();
          wctx.moveTo(mx, 0);
          wctx.lineTo(mx + 22, sh);
          wctx.lineTo(mx + 46, 0);
          wctx.fill();
          // 洞顶垂挂锁魂铁链与幽冥青磷鬼火
          if (i % 2 === 0) {
            const chainH = 44 + ((i * 13) % 24);
            wctx.fillStyle = '#3d3456';
            wctx.fillRect(mx + 64, 0, 2, chainH);
            wctx.fillStyle = 'rgba(0, 245, 212, 0.55)';
            wctx.fillRect(mx + 62, chainH, 6, 7);
            wctx.fillStyle = region.mountainFar;
          }
        }
        wctx.fillStyle = region.mountainNear;
        for (let i = -1; i < 8; i++) {
          const mx = Math.round(i * 112 - ((camX * 0.34) % 112));
          wctx.fillRect(mx + 18, wh - 86, 8, 86);
          wctx.fillRect(mx + 68, wh - 86, 8, 86);
          wctx.fillRect(mx + 22, wh - 94, 50, 10);
          wctx.fillRect(mx + 38, wh - 104, 18, 10);
        }
        break;
      }

      case 'pingding_grotto': {
        // 万仞剑峰石柱 + 峭壁迎客松 + 翻腾霞光云海
        wctx.fillStyle = region.mountainFar;
        for (let i = -1; i < 10; i++) {
          const mx = Math.round(i * 96 - ((camX * 0.18) % 96));
          const mh = 105 + ((i * 41) % 55);
          wctx.fillRect(mx + 24, wh - mh, 28, mh);
          wctx.fillRect(mx + 18, wh - mh, 40, 8);
          if (i % 2 === 0) {
            // 峰顶祈雨道坛飞檐
            wctx.fillRect(mx + 28, wh - mh - 14, 20, 14);
            wctx.fillRect(mx + 22, wh - mh - 17, 32, 4);
          }
        }
        wctx.fillStyle = 'rgba(224, 159, 62, 0.16)';
        for (let i = 0; i < 12; i++) {
          const cx = Math.round(((i * 76 - camX * 0.26) % (ww + 80) + ww + 80) % (ww + 80) - 40);
          wctx.beginPath();
          wctx.arc(cx, wh - 16, 34, 0, Math.PI * 2);
          wctx.fill();
        }
        break;
      }

      case 'tongtian_glacier': {
        // 冰封雪山锯齿峰 + 寒冰尖塔棱柱
        wctx.fillStyle = region.mountainFar;
        for (let i = -1; i < 9; i++) {
          const mx = Math.round(i * 118 - ((camX * 0.17) % 118));
          const mh = 96 + ((i * 37) % 44);
          wctx.beginPath();
          wctx.moveTo(mx, wh);
          wctx.lineTo(mx + 58, wh - mh);
          wctx.lineTo(mx + 118, wh);
          wctx.fill();
          wctx.fillStyle = 'rgba(202, 240, 248, 0.45)';
          wctx.beginPath();
          wctx.moveTo(mx + 38, wh - mh + 34);
          wctx.lineTo(mx + 58, wh - mh);
          wctx.lineTo(mx + 78, wh - mh + 34);
          wctx.fill();
          wctx.fillStyle = region.mountainFar;
        }
        wctx.fillStyle = 'rgba(72, 202, 228, 0.18)';
        for (let i = -1; i < 10; i++) {
          const mx = Math.round(i * 94 - ((camX * 0.30) % 94));
          wctx.beginPath();
          wctx.moveTo(mx + 20, wh);
          wctx.lineTo(mx + 34, wh - 54);
          wctx.lineTo(mx + 48, wh);
          wctx.fill();
        }
        break;
      }

      case 'xiliang_spiders': {
        // 盘根古荆棘树林 + 远景巨型几何盘丝蛛网与紫晶毒露
        wctx.strokeStyle = 'rgba(224, 170, 255, 0.18)';
        wctx.lineWidth = 1;
        for (let i = -1; i < 6; i++) {
          const wx = Math.round(i * 150 - ((camX * 0.2) % 150)) + 60;
          const wy = 92 + (i % 2) * 34;
          for (let r = 14; r <= 44; r += 10) {
            wctx.beginPath();
            wctx.arc(wx, wy, r, 0, Math.PI * 2);
            wctx.stroke();
          }
          for (let a = 0; a < 4; a++) {
            const ang = (a * Math.PI) / 4;
            wctx.beginPath();
            wctx.moveTo(wx - Math.cos(ang) * 48, wy - Math.sin(ang) * 48);
            wctx.lineTo(wx + Math.cos(ang) * 48, wy + Math.sin(ang) * 48);
            wctx.stroke();
          }
          wctx.fillStyle = 'rgba(199, 125, 255, 0.45)';
          wctx.fillRect(wx + 12, wy - 10, 3, 3);
        }
        wctx.fillStyle = region.mountainNear;
        for (let i = -1; i < 9; i++) {
          const mx = Math.round(i * 104 - ((camX * 0.34) % 104));
          wctx.fillRect(mx + 38, 0, 14, wh);
          wctx.fillRect(mx + 12, 32, 66, 12);
          wctx.fillRect(mx + 24, 44, 6, 18);
        }
        break;
      }

      case 'huoyan_volcano': {
        // 八百里喷发火山锥 + 蜿蜒赤金岩浆裂脉 + 火山浓烟云
        wctx.fillStyle = region.mountainFar;
        for (let i = -1; i < 8; i++) {
          const mx = Math.round(i * 136 - ((camX * 0.18) % 136));
          const mh = 106 + ((i * 29) % 32);
          wctx.beginPath();
          wctx.moveTo(mx, wh);
          wctx.lineTo(mx + 48, wh - mh);
          wctx.lineTo(mx + 82, wh - mh);
          wctx.lineTo(mx + 132, wh);
          wctx.fill();
          // 火山口赤金熔岩分流脉络
          wctx.fillStyle = 'rgba(255, 186, 8, 0.55)';
          wctx.fillRect(mx + 54, wh - mh, 20, 8);
          wctx.fillStyle = 'rgba(255, 84, 0, 0.48)';
          wctx.fillRect(mx + 61, wh - mh + 8, 6, 42);
          wctx.fillRect(mx + 52, wh - mh + 26, 9, 28);
          wctx.fillRect(mx + 67, wh - mh + 32, 7, 24);
          wctx.fillStyle = region.mountainFar;
        }
        break;
      }

      case 'bibo_dragonpalace': {
        // 碧波潭水晶龙宫琉璃阙剪影 + 随波摇曳的海底翠玉水草丛
        wctx.fillStyle = region.mountainFar;
        for (let i = -1; i < 8; i++) {
          const mx = Math.round(i * 132 - ((camX * 0.18) % 132));
          wctx.fillRect(mx + 30, wh - 98, 56, 98);
          wctx.fillRect(mx + 18, wh - 106, 80, 8);
          wctx.fillRect(mx + 38, wh - 124, 40, 18);
          wctx.fillRect(mx + 28, wh - 130, 60, 6);
          wctx.fillStyle = 'rgba(0, 245, 212, 0.35)';
          wctx.fillRect(mx + 54, wh - 138, 8, 8);
          wctx.fillStyle = region.mountainFar;
        }
        for (let i = -1; i < 11; i++) {
          const mx = Math.round(i * 88 - ((camX * 0.34) % 88));
          const sway = Math.round(Math.sin(globalTime * 2.5 + i) * 4);
          wctx.fillStyle = 'rgba(255, 112, 166, 0.26)';
          wctx.fillRect(mx + 20, wh - 56, 8, 56);
          wctx.fillRect(mx + 8, wh - 44, 14, 7);
          wctx.fillRect(mx + 26, wh - 50, 14, 7);
          // 摇曳水草
          wctx.fillStyle = 'rgba(6, 214, 160, 0.25)';
          wctx.fillRect(mx + 56, wh - 34, 5, 34);
          wctx.fillRect(mx + 56 + sway, wh - 52, 4, 20);
        }
        break;
      }

      case 'shituo_empire': {
        // 狮驼国万妖骷髅城垛 + 巨型牛角魔塔 + 迎风猎猎赤血战旗
        wctx.fillStyle = region.mountainFar;
        for (let i = -1; i < 8; i++) {
          const mx = Math.round(i * 128 - ((camX * 0.18) % 128));
          const mh = 92 + ((i % 2) * 28);
          wctx.fillRect(mx + 12, wh - mh, 86, mh);
          for (let b = 0; b < 4; b++) {
            wctx.fillRect(mx + 12 + b * 24, wh - mh - 10, 14, 10);
          }
          // 牛角尖刺与迎风战旗
          wctx.fillRect(mx + 8, wh - mh - 20, 6, 12);
          wctx.fillRect(mx + 96, wh - mh - 20, 6, 12);
          const flap = Math.round(Math.sin(globalTime * 7 + i) * 3);
          wctx.fillStyle = 'rgba(239, 35, 60, 0.55)';
          wctx.fillRect(mx + 52, wh - mh - 28, 2, 18);
          wctx.fillRect(mx + 54, wh - mh - 27, 14 + flap, 8);
          wctx.fillStyle = region.mountainFar;
        }
        break;
      }

      case 'lingshan_thunder': {
        // 灵山大雷音寺重檐金顶仙阙 + 漫天七彩祥云海
        wctx.fillStyle = region.mountainFar;
        for (let i = -1; i < 8; i++) {
          const mx = Math.round(i * 144 - ((camX * 0.16) % 144));
          wctx.fillRect(mx + 36, wh - 112, 64, 80);
          wctx.fillStyle = 'rgba(255, 209, 102, 0.42)';
          wctx.beginPath();
          wctx.moveTo(mx + 20, wh - 112);
          wctx.lineTo(mx + 68, wh - 140);
          wctx.lineTo(mx + 116, wh - 112);
          wctx.fill();
          // 塔刹宝珠顶
          wctx.fillStyle = '#fff3b0';
          wctx.fillRect(mx + 66, wh - 148, 4, 8);
          wctx.fillStyle = region.mountainFar;
        }
        wctx.fillStyle = 'rgba(255, 214, 10, 0.24)';
        for (let i = 0; i < 12; i++) {
          const cx = Math.round(((i * 72 - camX * 0.28) % (ww + 90) + ww + 90) % (ww + 90) - 45);
          wctx.beginPath();
          wctx.arc(cx, wh - 12, 32 + (i % 3) * 8, 0, Math.PI * 2);
          wctx.fill();
        }
        break;
      }

      default: {
        // 黑风禅林·观音院：火光映夜山林与双层飞檐古刹塔影
        wctx.fillStyle = region.mountainFar;
        for (let i = -1; i < 9; i++) {
          const mx = Math.round(i * 120 - ((camX * 0.18) % 120));
          const mh = 90 + ((i * 37) % 45);
          wctx.beginPath();
          wctx.moveTo(mx, wh);
          wctx.lineTo(mx + 60, wh - mh);
          wctx.lineTo(mx + 125, wh);
          wctx.fill();
        }
        wctx.fillStyle = region.mountainNear;
        for (let i = -1; i < 10; i++) {
          const mx = Math.round(i * 96 - ((camX * 0.36) % 96));
          const mh = 56 + ((i * 29) % 34);
          // 双重飞檐宝塔楼阁
          wctx.fillRect(mx + 28, wh - mh - 28, 22, 28);
          wctx.fillRect(mx + 20, wh - mh - 30, 38, 4);
          wctx.fillRect(mx + 32, wh - mh - 40, 14, 10);
          wctx.fillRect(mx + 25, wh - mh - 42, 28, 3);
          wctx.fillRect(mx + 38, wh - mh - 48, 2, 6);
          // 摇曳禅院灯火窗
          wctx.fillStyle = 'rgba(255, 123, 0, 0.65)';
          wctx.fillRect(mx + 36, wh - mh - 18, 6, 8);
          wctx.fillStyle = region.mountainNear;
          wctx.beginPath();
          wctx.moveTo(mx, wh);
          wctx.lineTo(mx + 48, wh - mh);
          wctx.lineTo(mx + 98, wh);
          wctx.fill();
        }
        break;
      }
    }

    // 远景与前景之间的地平线薄雾纵深过渡带（强化前后景层次分离度！）
    const fogGrad = wctx.createLinearGradient(0, wh - 56, 0, wh);
    fogGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    fogGrad.addColorStop(1, 'rgba(10, 8, 18, 0.28)');
    wctx.fillStyle = fogGrad;
    wctx.fillRect(0, wh - 56, ww, 56);

    // 黄风岭三昧神风吹袭时的全屏斜向狂沙风线特效！
    if (level && level.windCurrentForce && Math.abs(level.windCurrentForce) > 5) {
      wctx.strokeStyle = 'rgba(244, 162, 97, 0.42)';
      wctx.lineWidth = 1.5;
      const dir = level.windCurrentForce > 0 ? 1 : -1;
      for (let i = 0; i < 18; i++) {
        const sx = Math.round((((i * 67 + globalTime * 360 * dir) % ww) + ww) % ww);
        const sy = (i * 21) % wh;
        wctx.beginPath();
        wctx.moveTo(sx, sy);
        wctx.lineTo(sx + dir * 36, sy + 4);
        wctx.stroke();
      }
    }
  }

  // ==================== 2. 高细节地域特色装饰地标与暖光晕渲染 ====================
  function renderDecors(wctx, level, camX, camY, ww, globalTime, region) {
    for (let i = 0; i < level.decors.length; i++) {
      const dec = level.decors[i];
      const dx = Math.round(dec.x - camX);
      const dy = Math.round(dec.y - camY);
      if (dx < -110 || dx > ww + 110) continue;

      switch (dec.type) {
        case 'lantern': {
          const sway = Math.round(Math.sin(globalTime * 2.6 + (dec.phase || 0)) * 2);
          const lanternCol =
            region.id === 'baigu_crypt'
              ? '#00f5d4'
              : region.id === 'lingshan_thunder'
              ? '#ffd60a'
              : region.id === 'xiliang_spiders'
              ? '#c77dff'
              : '#ff3b3b';
          // 柔和灯火氛围光晕
          wctx.save();
          wctx.globalAlpha = 0.16 + Math.sin(globalTime * 5 + (dec.phase || 0)) * 0.04;
          wctx.fillStyle = lanternCol;
          wctx.beginPath();
          wctx.arc(dx + 1 + sway, dy - 1, 18, 0, Math.PI * 2);
          wctx.fill();
          wctx.restore();

          // 雕花悬木横挑与丝穗宫灯
          wctx.fillStyle = '#4a3228';
          wctx.fillRect(dx, dy - 18, 2, 14);
          wctx.fillStyle = lanternCol;
          wctx.fillRect(dx - 5 + sway, dy - 6, 12, 11);
          wctx.fillStyle = '#fff3b0';
          wctx.fillRect(dx - 1 + sway, dy - 4, 4, 7);
          wctx.fillStyle = '#ffd166';
          wctx.fillRect(dx - 4 + sway, dy - 8, 10, 2);
          wctx.fillRect(dx - 4 + sway, dy + 5, 10, 2);
          // 垂坠红金流苏
          wctx.fillStyle = '#ef233c';
          wctx.fillRect(dx + sway, dy + 7, 2, 5);
          break;
        }
        case 'shrine_start': {
          // 起点高细节土地庙：石阶底座 + 朱漆双柱 + 翘角瓦顶 + 金牌神位 + 袅袅香火烟丝！
          wctx.fillStyle = '#343a40';
          wctx.fillRect(dx - 22, dy - 5, 44, 5);
          wctx.fillStyle = '#495057';
          wctx.fillRect(dx - 16, dy - 34, 32, 29);
          // 两侧朱漆立柱
          wctx.fillStyle = '#9d0208';
          wctx.fillRect(dx - 15, dy - 33, 4, 28);
          wctx.fillRect(dx + 11, dy - 33, 4, 28);
          // 飞檐翘角顶盖
          wctx.fillStyle = region.tileTop || '#2b2d42';
          wctx.fillRect(dx - 24, dy - 40, 48, 6);
          wctx.fillRect(dx - 27, dy - 43, 5, 4);
          wctx.fillRect(dx + 22, dy - 43, 5, 4);
          wctx.fillRect(dx - 14, dy - 45, 28, 5);
          // 龛内土地神牌与暖金灵光
          wctx.fillStyle = '#140f1d';
          wctx.fillRect(dx - 8, dy - 26, 16, 21);
          wctx.fillStyle = '#ffd166';
          wctx.fillRect(dx - 4, dy - 23, 8, 13);
          wctx.fillStyle = '#d62828';
          wctx.fillRect(dx - 2, dy - 20, 4, 7);
          // 香炉与升腾青烟像素点
          wctx.fillStyle = '#ffb703';
          wctx.fillRect(dx - 3, dy - 8, 6, 3);
          const smokeY = Math.floor(globalTime * 14) % 14;
          wctx.fillStyle = 'rgba(224, 251, 252, 0.55)';
          wctx.fillRect(dx - 1 + Math.round(Math.sin(globalTime * 4) * 2), dy - 12 - smokeY, 2, 3);
          break;
        }
        case 'boss_gate': {
          // 守关妖王殿【双层镇魔牌坊 + 左右烈焰火盆 + 猎猎战幡】
          wctx.fillStyle = '#2b2d42';
          wctx.fillRect(dx - 10, dy - 6, 16, 6);
          wctx.fillRect(dx + 18, dy - 6, 16, 6);
          wctx.fillStyle = region.platformColor || '#6a040f';
          wctx.fillRect(dx - 6, dy - 86, 8, 80);
          wctx.fillRect(dx + 22, dy - 86, 8, 80);
          // 双重飞檐额枋
          wctx.fillStyle = region.tileTop || '#dc2f02';
          wctx.fillRect(dx - 16, dy - 94, 56, 9);
          wctx.fillRect(dx - 20, dy - 97, 6, 4);
          wctx.fillRect(dx + 38, dy - 97, 6, 4);
          wctx.fillRect(dx - 10, dy - 72, 44, 6);
          // 鎏金镇魔匾额
          wctx.fillStyle = '#161020';
          wctx.fillRect(dx + 2, dy - 92, 20, 8);
          wctx.fillStyle = '#ffba08';
          wctx.fillRect(dx + 4, dy - 90, 16, 4);
          // 两侧镇门烈火铜盆
          const flk = Math.round(Math.sin(globalTime * 15) * 2);
          [dx - 16, dx + 38].forEach((bx) => {
            wctx.fillStyle = '#495057';
            wctx.fillRect(bx - 4, dy - 12, 8, 12);
            wctx.fillStyle = '#ff5400';
            wctx.fillRect(bx - 4, dy - 20 - Math.abs(flk), 8, 8 + Math.abs(flk));
            wctx.fillStyle = '#ffd60a';
            wctx.fillRect(bx - 2, dy - 17, 4, 5);
          });
          break;
        }
        case 'five_elements_seal': {
          // 两界山六字真言压帖石碑
          wctx.fillStyle = '#343a40';
          wctx.fillRect(dx - 15, dy - 5, 30, 5);
          wctx.fillStyle = '#495057';
          wctx.fillRect(dx - 12, dy - 44, 24, 39);
          wctx.fillStyle = '#52b788';
          wctx.fillRect(dx - 12, dy - 44, 10, 4);
          const flutter = Math.round(Math.sin(globalTime * 5) * 1.5);
          wctx.fillStyle = '#ffd60a';
          wctx.fillRect(dx - 4, dy - 39, 8, 25);
          wctx.fillRect(dx - 3 + flutter, dy - 14, 6, 4);
          wctx.fillStyle = '#d62828';
          wctx.fillRect(dx - 2, dy - 35, 4, 16);
          break;
        }
        case 'broken_buddha': {
          // 黄风岭莲座风化残佛石像
          wctx.fillStyle = '#d4a373';
          wctx.fillRect(dx - 18, dy - 7, 36, 7);
          wctx.fillStyle = '#e9c46a';
          wctx.fillRect(dx - 15, dy - 10, 30, 4);
          wctx.fillStyle = '#8d6346';
          wctx.fillRect(dx - 13, dy - 32, 26, 22);
          wctx.fillStyle = '#b08968';
          wctx.fillRect(dx - 9, dy - 42, 18, 11);
          break;
        }
        case 'skull_post': {
          // 流沙河九骷髅桩 / 狮驼骨幡
          wctx.fillStyle = '#4a3b32';
          wctx.fillRect(dx - 2, dy - 42, 4, 42);
          wctx.fillStyle = '#9d0208';
          wctx.fillRect(dx + 2, dy - 32, 8 + Math.round(Math.sin(globalTime * 5) * 2), 6);
          wctx.fillStyle = '#f1faee';
          wctx.fillRect(dx - 6, dy - 48, 12, 10);
          wctx.fillStyle = '#00f5d4';
          wctx.fillRect(dx - 4, dy - 45, 3, 3);
          wctx.fillRect(dx + 1, dy - 45, 3, 3);
          break;
        }
        case 'ice_crystal': {
          wctx.fillStyle = 'rgba(144, 224, 239, 0.76)';
          wctx.beginPath();
          wctx.moveTo(dx - 9, dy);
          wctx.lineTo(dx - 2, dy - 34);
          wctx.lineTo(dx + 5, dy);
          wctx.fill();
          wctx.fillStyle = 'rgba(202, 240, 248, 0.92)';
          wctx.beginPath();
          wctx.moveTo(dx + 1, dy);
          wctx.lineTo(dx + 8, dy - 24);
          wctx.lineTo(dx + 13, dy);
          wctx.fill();
          wctx.fillStyle = '#ffffff';
          wctx.fillRect(dx - 3, dy - 22, 2, 8);
          break;
        }
        case 'spider_cocoon': {
          const swing = Math.round(Math.sin(globalTime * 3 + (dec.phase || 0)) * 2);
          wctx.fillStyle = '#e0aaff';
          wctx.fillRect(dx, dy, 2, 18);
          wctx.fillStyle = '#f8f9fa';
          wctx.fillRect(dx - 6 + swing, dy + 16, 14, 18);
          wctx.fillStyle = '#c77dff';
          wctx.fillRect(dx - 6 + swing, dy + 21, 14, 3);
          wctx.fillRect(dx - 5 + swing, dy + 28, 12, 2);
          break;
        }
        case 'pearl_clam': {
          const glow = Math.round(Math.sin(globalTime * 5) * 2);
          wctx.save();
          wctx.globalAlpha = 0.22;
          wctx.fillStyle = '#00f5d4';
          wctx.beginPath();
          wctx.arc(dx, dy - 12 + glow, 15, 0, Math.PI * 2);
          wctx.fill();
          wctx.restore();

          wctx.fillStyle = '#ff70a6';
          wctx.fillRect(dx - 12, dy - 9, 24, 9);
          wctx.fillStyle = '#ff99c8';
          wctx.fillRect(dx - 10, dy - 12, 20, 4);
          wctx.fillStyle = '#fff3b0';
          wctx.fillRect(dx - 4, dy - 17 + glow, 8, 8);
          wctx.fillStyle = '#ffffff';
          wctx.fillRect(dx - 2, dy - 15 + glow, 3, 3);
          break;
        }
        case 'lotus_lamp': {
          // 灵山金莲宝灯 + 暖金佛光晕
          wctx.save();
          wctx.globalAlpha = 0.20 + Math.sin(globalTime * 4) * 0.05;
          wctx.fillStyle = '#ffd60a';
          wctx.beginPath();
          wctx.arc(dx, dy - 36, 16, 0, Math.PI * 2);
          wctx.fill();
          wctx.restore();

          wctx.fillStyle = '#ffd166';
          wctx.fillRect(dx - 6, dy - 4, 12, 4);
          wctx.fillRect(dx - 3, dy - 28, 6, 24);
          wctx.fillStyle = '#ff70a6';
          wctx.fillRect(dx - 10, dy - 34, 20, 6);
          wctx.fillStyle = '#fff3b0';
          wctx.fillRect(dx - 3, dy - 40, 6, 6);
          break;
        }
      }
    }
  }

  // ==================== 3. 十大瓦片地形、崖壁立体倒角与地表微生态渲染 ====================
  function renderTiles(wctx, level, camX, camY, ww, wh, globalTime, region) {
    const cStart = Math.max(0, Math.floor(camX / TILE_SIZE) - 1);
    const cEnd = Math.min(level.cols - 1, Math.ceil((camX + ww) / TILE_SIZE) + 1);
    const rStart = Math.max(0, Math.floor(camY / TILE_SIZE) - 1);
    const rEnd = Math.min(level.rows - 1, Math.ceil((camY + wh) / TILE_SIZE) + 1);

    const pat = region.tilePattern || 'temple_brick';
    const crumbleMap = level.crumbleStates || {};

    for (let r = rStart; r <= rEnd; r++) {
      const rowArr = level.grid[r];
      for (let c = cStart; c <= cEnd; c++) {
        const t = rowArr[c];
        if (t === TILE_EMPTY) continue;
        const tx = c * TILE_SIZE - camX;
        const ty = r * TILE_SIZE - camY;
        const hash = ((c * 73856093) ^ (r * 19349663)) >>> 0;

        if (t === TILE_SOLID) {
          wctx.fillStyle = region.tileBody;
          wctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);

          // 按地域独立材质绘制砖石纹理细节
          if (pat === 'sandstone') {
            wctx.fillStyle = 'rgba(233, 196, 106, 0.16)';
            wctx.fillRect(tx, ty + 6, TILE_SIZE, 3);
            wctx.fillRect(tx, ty + 16, TILE_SIZE, 2);
            if (hash % 3 === 0) wctx.fillRect(tx + 6, ty + 10, 5, 2);
          } else if (pat === 'glacier_ice') {
            wctx.fillStyle = 'rgba(144, 224, 239, 0.26)';
            wctx.fillRect(tx + 3, ty + 4, 8, 7);
            wctx.fillRect(tx + 13, ty + 13, 7, 7);
          } else if (pat === 'obsidian_lava') {
            wctx.fillStyle = 'rgba(255, 84, 0, 0.30)';
            wctx.fillRect(tx + ((c * 7) % 14), ty + 8, 6, 2);
            wctx.fillRect(tx + 4, ty + 17, 8, 2);
          } else if (pat === 'celestial_gold') {
            wctx.strokeStyle = 'rgba(255, 195, 77, 0.32)';
            wctx.lineWidth = 1;
            wctx.strokeRect(tx + 2.5, ty + 2.5, TILE_SIZE - 5, TILE_SIZE - 5);
          } else if (pat === 'coral_crystal') {
            wctx.fillStyle = 'rgba(0, 245, 212, 0.18)';
            wctx.fillRect(tx + 4, ty + 5, 6, 14);
            wctx.fillRect(tx + 14, ty + 9, 5, 10);
          } else {
            wctx.fillStyle = 'rgba(0,0,0,0.26)';
            wctx.fillRect(tx, ty + 11, TILE_SIZE, 2);
            wctx.fillRect(tx + ((r % 2) * 10 + 4), ty, 2, 11);
            if (hash % 4 === 0) {
              wctx.fillStyle = 'rgba(255,255,255,0.05)';
              wctx.fillRect(tx + 2, ty + 14, 9, 7);
            }
          }

          // 左右裸露悬崖侧壁立体阴阳倒角（瞬间提升地形像素厚重感！）
          if (c > 0 && rowArr[c - 1] === TILE_EMPTY) {
            wctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
            wctx.fillRect(tx, ty, 2, TILE_SIZE);
          }
          if (c < level.cols - 1 && rowArr[c + 1] === TILE_EMPTY) {
            wctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
            wctx.fillRect(tx + TILE_SIZE - 2, ty, 2, TILE_SIZE);
          }

          // 顶层地表植被/积雪/金边/苔藓帽 + 随机微生态小草簇/蘑菇/珊瑚芽
          const above = r > 0 ? level.grid[r - 1][c] : TILE_SOLID;
          if (above !== TILE_SOLID && above !== TILE_ICE) {
            wctx.fillStyle = region.tileTop;
            wctx.fillRect(tx, ty, TILE_SIZE, 5);
            wctx.fillStyle = region.tileBorder;
            wctx.fillRect(tx, ty, TILE_SIZE, 2);
            // 草皮垂边锯齿细节
            if (hash % 2 === 0) {
              wctx.fillStyle = region.tileTop;
              wctx.fillRect(tx + 4, ty + 5, 4, 2);
              wctx.fillRect(tx + 15, ty + 5, 5, 2);
            }

            // 地表上方微生态像素点缀（仅当上方完全为空气 TILE_EMPTY 时绘制）
            if (above === TILE_EMPTY && hash % 4 === 0) {
              const ox = tx + 5 + (hash % 11);
              if (pat === 'crag_moss' || pat === 'temple_brick') {
                // 青翠野草簇
                wctx.fillStyle = region.tileBorder;
                wctx.fillRect(ox, ty - 4, 2, 4);
                wctx.fillRect(ox + 3, ty - 6, 2, 6);
                wctx.fillRect(ox + 6, ty - 3, 2, 3);
              } else if (pat === 'crypt_bone') {
                // 幽冥发光小鬼菇
                wctx.fillStyle = '#adb5bd';
                wctx.fillRect(ox + 2, ty - 3, 2, 3);
                wctx.fillStyle = '#80ffdb';
                wctx.fillRect(ox, ty - 6, 6, 3);
              } else if (pat === 'coral_crystal') {
                // 龙宫粉紫珊瑚芽
                wctx.fillStyle = '#ff70a6';
                wctx.fillRect(ox + 1, ty - 5, 2, 5);
                wctx.fillRect(ox - 1, ty - 4, 6, 2);
              } else if (pat === 'glacier_ice') {
                // 晶莹冰晶芽
                wctx.fillStyle = '#caf0f8';
                wctx.fillRect(ox + 1, ty - 5, 3, 5);
              } else if (pat === 'sandstone') {
                // 戈壁碎砾
                wctx.fillStyle = '#e9c46a';
                wctx.fillRect(ox, ty - 2, 4, 2);
                wctx.fillRect(ox + 5, ty - 1, 2, 1);
              } else if (pat === 'celestial_gold') {
                // 灵山金莲小瓣
                wctx.fillStyle = '#ff70a6';
                wctx.fillRect(ox, ty - 3, 5, 3);
                wctx.fillStyle = '#ffd60a';
                wctx.fillRect(ox + 1, ty - 4, 3, 2);
              }
            }
          }

          // 底层悬空下沿（洞顶钟乳石/冰凌/藤蔓垂须）
          if (r < level.rows - 1 && level.grid[r + 1][c] === TILE_EMPTY && (c + r) % 2 === 0) {
            if (pat === 'crypt_bone' || pat === 'glacier_ice' || pat === 'crag_moss') {
              const hangH = 4 + (hash % 5);
              wctx.fillStyle = pat === 'glacier_ice' ? '#90e0ef' : region.tileTop;
              wctx.fillRect(tx + 8 + (hash % 6), ty + TILE_SIZE, 3, hangH);
            }
          }
        } else if (t === TILE_ONEWAY) {
          // 地域特色单向穿透跳台 + 左右两端雕花包角与垂穗！
          const isLeftEnd = c === 0 || rowArr[c - 1] !== TILE_ONEWAY;
          const isRightEnd = c === level.cols - 1 || rowArr[c + 1] !== TILE_ONEWAY;

          wctx.fillStyle = region.platformColor;
          wctx.fillRect(tx, ty, TILE_SIZE, 6);
          wctx.fillStyle = '#141019';
          wctx.fillRect(tx, ty + 6, TILE_SIZE, 2);
          wctx.fillStyle = 'rgba(255,255,255,0.26)';
          wctx.fillRect(tx + 2, ty + 1, TILE_SIZE - 4, 2);

          if (isLeftEnd) {
            wctx.fillStyle = '#ffd166';
            wctx.fillRect(tx, ty - 1, 4, 8);
            wctx.fillStyle = '#ef233c';
            wctx.fillRect(tx + 1, ty + 7, 2, 4);
          }
          if (isRightEnd) {
            wctx.fillStyle = '#ffd166';
            wctx.fillRect(tx + TILE_SIZE - 4, ty - 1, 4, 8);
            wctx.fillStyle = '#ef233c';
            wctx.fillRect(tx + TILE_SIZE - 3, ty + 7, 2, 4);
          }

          if (region.id === 'liangjie_canyon') {
            wctx.fillStyle = '#ffd166';
            wctx.fillRect(tx + 5, ty, 2, 7);
            wctx.fillRect(tx + 17, ty, 2, 7);
          } else if (region.id === 'lingshan_thunder') {
            wctx.fillStyle = '#fff3b0';
            wctx.fillRect(tx + 6, ty + 2, 12, 3);
          }
        } else if (t === TILE_ICE) {
          wctx.fillStyle = '#48cae4';
          wctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
          wctx.fillStyle = '#caf0f8';
          wctx.fillRect(tx, ty, TILE_SIZE, 5);
          wctx.fillStyle = '#ffffff';
          const glint = Math.floor(globalTime * 8 + c) % 4 === 0 ? 4 : 0;
          wctx.fillRect(tx + 4 + glint, ty + 8, 8, 2);
          wctx.fillRect(tx + 10, ty + 14, 8, 2);
        } else if (t === TILE_QUICKSAND) {
          wctx.fillStyle = '#b07d3b';
          wctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
          wctx.fillStyle = '#e9c46a';
          const shift = Math.floor(globalTime * 16) % 8;
          wctx.fillRect(tx, ty + 2, TILE_SIZE, 4);
          wctx.fillStyle = '#7f4f24';
          wctx.fillRect(tx + shift, ty + 4, 6, 3);
          wctx.fillRect(tx + ((shift + 12) % 18), ty + 11, 5, 3);
        } else if (t === TILE_WEB) {
          const sag = Math.round(Math.sin(globalTime * 6 + c) * 1.5);
          wctx.fillStyle = '#f8f9fa';
          wctx.fillRect(tx, ty + 2 + sag, TILE_SIZE, 3);
          wctx.fillStyle = '#e0aaff';
          wctx.fillRect(tx + 3, ty + 5 + sag, 4, 3);
          wctx.fillRect(tx + 11, ty + 6 + sag, 4, 3);
          wctx.fillRect(tx + 18, ty + 5 + sag, 4, 3);
        } else if (t === TILE_CRUMBLE) {
          const st = crumbleMap[`${r},${c}`];
          if (st && st.broken) {
            wctx.strokeStyle = 'rgba(255, 209, 102, 0.28)';
            wctx.lineWidth = 1;
            wctx.strokeRect(tx + 3, ty + 2, TILE_SIZE - 6, 6);
          } else {
            const jx = st && st.triggered ? Math.round((Math.random() - 0.5) * 4) : 0;
            wctx.fillStyle = st && st.triggered ? '#ff9f1c' : '#8d99ae';
            wctx.fillRect(tx + jx, ty, TILE_SIZE, 9);
            wctx.fillStyle = '#2b2d42';
            wctx.fillRect(tx + jx + 6, ty + 2, 3, 6);
            wctx.fillRect(tx + jx + 15, ty + 1, 2, 7);
          }
        } else if (t === TILE_BOUNCE) {
          const pulse = Math.round(Math.sin(globalTime * 7 + c) * 2);
          wctx.fillStyle = '#ff9f1c';
          wctx.fillRect(tx + 2, ty + 6 + pulse, TILE_SIZE - 4, 8);
          wctx.fillStyle = '#ffd60a';
          wctx.fillRect(tx, ty + 2 + pulse, TILE_SIZE, 7);
          wctx.fillStyle = '#ffffff';
          wctx.fillRect(tx + 4, ty + 3 + pulse, TILE_SIZE - 8, 3);
        } else if (t === TILE_UPDRAFT) {
          const col =
            region.id === 'huoyan_volcano'
              ? 'rgba(255, 159, 28, 0.48)'
              : region.id === 'bibo_dragonpalace'
              ? 'rgba(0, 245, 212, 0.44)'
              : 'rgba(144, 224, 239, 0.38)';
          wctx.fillStyle = col;
          const offY = TILE_SIZE - (Math.floor(globalTime * 42 + c * 7) % TILE_SIZE);
          wctx.fillRect(tx + 5, ty + offY, 3, 8);
          wctx.fillRect(tx + 15, ty + ((offY + 12) % TILE_SIZE), 3, 8);
        } else if (t === TILE_HAZARD) {
          const hType = region.hazardType || 'spikes';
          if (hType === 'lava_pool') {
            wctx.fillStyle = '#d00000';
            wctx.fillRect(tx, ty + 8, TILE_SIZE, TILE_SIZE - 8);
            wctx.fillStyle = '#ffba08';
            const wave = Math.round(Math.sin(globalTime * 8 + c) * 2);
            wctx.fillRect(tx, ty + 6 + wave, TILE_SIZE, 5);
            // 升腾熔岩火星泡
            if ((Math.floor(globalTime * 5) + c) % 4 === 0) {
              wctx.fillStyle = '#fff3b0';
              wctx.fillRect(tx + 10, ty + 2 + wave, 3, 3);
            }
          } else if (hType === 'weak_water' || hType === 'poison_marsh') {
            wctx.fillStyle = hType === 'weak_water' ? '#0077b6' : '#5a189a';
            wctx.fillRect(tx, ty + 8, TILE_SIZE, TILE_SIZE - 8);
            wctx.fillStyle = region.hazardColor;
            const wave = Math.round(Math.sin(globalTime * 7 + c * 1.3) * 2);
            wctx.fillRect(tx, ty + 6 + wave, TILE_SIZE, 4);
            if ((Math.floor(globalTime * 4) + c) % 5 === 0) {
              wctx.fillRect(tx + 8, ty + 2 + wave, 3, 2);
            }
          } else {
            wctx.fillStyle = region.hazardColor;
            for (let s = 0; s < 3; s++) {
              const sx = tx + s * 8;
              wctx.beginPath();
              wctx.moveTo(sx, ty + TILE_SIZE);
              wctx.lineTo(sx + 4, ty + 5 + Math.sin(globalTime * 10 + s) * 2);
              wctx.lineTo(sx + 8, ty + TILE_SIZE);
              wctx.fill();
            }
          }
        }
      }
    }
  }

  // ==================== 4. 移动浮筏 / 漂浮祥云渲染 ====================
  function renderMovingPlatforms(wctx, level, camX, camY, ww, region) {
    const plats = level.movingPlatforms;
    if (!plats || !plats.length) return;

    for (let i = 0; i < plats.length; i++) {
      const mp = plats[i];
      const px = Math.round(mp.x - mp.w * 0.5 - camX);
      const py = Math.round(mp.y - camY);
      if (px + mp.w < -40 || px > ww + 40) continue;

      if (region.id === 'lingshan_thunder') {
        // 七彩祥云浮台
        wctx.fillStyle = '#ff9f1c';
        wctx.fillRect(px + 4, py + 5, mp.w - 8, 5);
        wctx.fillStyle = '#ffd166';
        wctx.fillRect(px, py, mp.w, 7);
        wctx.fillStyle = '#fff3b0';
        wctx.fillRect(px + 4, py + 1, mp.w - 8, 3);
      } else if (region.id === 'tongtian_glacier') {
        // 通天河带冰锥漂移浮冰
        wctx.fillStyle = '#48cae4';
        wctx.fillRect(px, py, mp.w, 9);
        wctx.fillStyle = '#ffffff';
        wctx.fillRect(px, py, mp.w, 3);
        wctx.fillStyle = '#90e0ef';
        wctx.fillRect(px + 10, py + 9, 4, 5);
        wctx.fillRect(px + mp.w - 14, py + 9, 4, 4);
      } else {
        // 流沙河捆绑木排 / 火焰山黑曜浮石
        wctx.fillStyle = region.platformColor || '#7f5539';
        wctx.fillRect(px, py, mp.w, 8);
        wctx.fillStyle = 'rgba(0,0,0,0.3)';
        wctx.fillRect(px, py + 6, mp.w, 2);
        wctx.fillStyle = '#ffd166';
        wctx.fillRect(px + 6, py + 1, 4, 6);
        wctx.fillRect(px + mp.w - 10, py + 1, 4, 6);
      }
    }
  }

  // ==================== 5. 地域环境粒子（风雪 / 沙暴 / 水泡 / 金莲 / 业火余烬） ====================
  function renderAmbientParticles(wctx, ww, wh, globalTime, region, ambientDots) {
    const mode = region.ambientParticle || 'ember';
    for (let i = 0; i < ambientDots.length; i++) {
      const d = ambientDots[i];
      if (mode === 'snow') {
        wctx.fillStyle = '#ffffff';
        const px = Math.round(((d.rx * ww + Math.sin(globalTime * 2 + i) * 14 - globalTime * 12) % ww + ww) % ww);
        const py = Math.round(((d.ry * wh + globalTime * d.spd * 1.1) % wh + wh) % wh);
        wctx.fillRect(px, py, d.sz + 1, d.sz + 1);
      } else if (mode === 'sand') {
        wctx.fillStyle = '#f4a261';
        const px = Math.round(((d.rx * ww + globalTime * d.spd * 4.2) % ww + ww) % ww);
        const py = Math.round(((d.ry * wh + globalTime * 8) % wh + wh) % wh);
        wctx.fillRect(px, py, d.sz + 2, 1);
      } else if (mode === 'bubble' || mode === 'mist_bubble') {
        wctx.strokeStyle = '#90e0ef';
        wctx.lineWidth = 1;
        const px = Math.round(((d.rx * ww + Math.sin(globalTime * 3 + i) * 8) % ww + ww) % ww);
        const py = Math.round(((d.ry * wh - globalTime * d.spd * 0.9) % wh + wh) % wh);
        wctx.strokeRect(px, py, d.sz + 1, d.sz + 1);
      } else if (mode === 'gold_lotus') {
        wctx.fillStyle = i % 2 === 0 ? '#ffd60a' : '#ff70a6';
        const px = Math.round(((d.rx * ww - globalTime * d.spd * 0.5) % ww + ww) % ww);
        const py = Math.round(((d.ry * wh + Math.sin(globalTime * 2 + i) * 10) % wh + wh) % wh);
        wctx.fillRect(px, py, d.sz + 1, d.sz);
      } else if (mode === 'leaf_mist') {
        wctx.fillStyle = i % 2 === 0 ? '#95d5b2' : '#caf0f8';
        const px = Math.round(((d.rx * ww - globalTime * d.spd * 0.7 + Math.sin(globalTime * 2 + i) * 10) % ww + ww) % ww);
        const py = Math.round(((d.ry * wh + globalTime * d.spd * 0.55) % wh + wh) % wh);
        wctx.fillRect(px, py, d.sz + 1, d.sz);
      } else {
        wctx.fillStyle = region.hazardColor || '#ff5400';
        const px = Math.round(((d.rx * ww - globalTime * d.spd * 0.6) % ww + ww) % ww);
        const py = Math.round(((d.ry * wh - globalTime * d.spd) % wh + wh) % wh);
        wctx.fillRect(px, py, d.sz, d.sz);
      }
    }
  }

  return {
    TILE_EMPTY,
    TILE_SOLID,
    TILE_ONEWAY,
    TILE_HAZARD,
    TILE_ICE,
    TILE_QUICKSAND,
    TILE_WEB,
    TILE_CRUMBLE,
    TILE_BOUNCE,
    TILE_UPDRAFT,
    renderBackdrop,
    renderDecors,
    renderTiles,
    renderMovingPlatforms,
    renderAmbientParticles
  };
});
