/**
 * 跨端底层运行环境与系统适配层 (src/platform/env.js)
 * 全面适配：
 * 1. 抖音小游戏/小程序 (`tt.*`) & 微信小游戏/小程序 (`wx.*`) 双端原生 API
 * 2. iOS (iPhone 刘海/灵动岛/底部 Home 条/Safari/WKWebView) & Android (挖孔屏/全面屏侧滑手势/高刷屏/WebView)
 * 3. 自动横屏矩阵适配（竖屏方向锁定时自动顺时针旋转 90° 满屏横版畅玩 + 触控与安全区逆向精确映射）
 * 4. 官方右上角胶囊按钮避让计算、物理返回键/侧滑手势拦截 (History Back Trap)、屏幕常亮与内存告警保护
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
})('env', function () {
  const isDouyin = typeof tt !== 'undefined' && typeof tt.createCanvas === 'function';
  const isWechat = !isDouyin && typeof wx !== 'undefined' && typeof wx.createCanvas === 'function';
  const isMiniGame = isDouyin || isWechat;
  const miniApi = isDouyin ? tt : isWechat ? wx : null;
  const isBrowser = !isMiniGame && typeof document !== 'undefined';

  const ua = typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : '';
  const isWechatWebView = isBrowser && /MicroMessenger/i.test(ua);
  const isDouyinWebView = isBrowser && /(BytedanceWebview|Douyin|TTWebView|NewsArticle)/i.test(ua);

  let _mainCanvas = null;
  let _deviceProfile = null;
  let _dprCapOverride = 0; // 0 = 自动根据设备档位决定
  let _safeProbeEl = null;
  let _cachedCssInsets = null;
  let _cachedMenuRect = null;
  let _menuRectTs = 0;

  // 返回键拦截与防穿透状态
  const _backHandlers = [];
  let _historyTrapInstalled = false;
  let _historyTrapArmedWithGesture = false;
  let _allowNextExit = false;
  let _wakeLockSentinel = null;
  const _memoryWarnHandlers = [];

  /**
   * 识别当前操作系统与硬件性能档位（兼容微信新版 getDeviceInfo 与旧版 getSystemInfoSync）
   */
  function getDeviceProfile() {
    if (_deviceProfile) return _deviceProfile;

    let os = 'desktop';
    let isIOS = false;
    let isAndroid = false;
    let isHarmony = false;
    let benchmarkLevel = -1;
    let memoryGB = 4;
    let brand = '';
    let model = '';

    if (isMiniGame && miniApi) {
      try {
        const dev =
          typeof miniApi.getDeviceInfo === 'function'
            ? miniApi.getDeviceInfo()
            : typeof miniApi.getSystemInfoSync === 'function'
              ? miniApi.getSystemInfoSync()
              : {};
        const sysStr = `${dev.platform || ''} ${dev.system || ''}`.toLowerCase();
        isIOS = sysStr.indexOf('ios') !== -1 || sysStr.indexOf('iphone') !== -1 || sysStr.indexOf('ipad') !== -1;
        isHarmony = sysStr.indexOf('ohos') !== -1 || sysStr.indexOf('harmony') !== -1;
        isAndroid = !isIOS && (sysStr.indexOf('android') !== -1 || isHarmony);
        os = isIOS ? 'ios' : isHarmony ? 'harmony' : isAndroid ? 'android' : dev.platform || 'minigame';
        if (typeof dev.benchmarkLevel === 'number') benchmarkLevel = dev.benchmarkLevel;
        if (typeof dev.memorySize === 'number' && dev.memorySize > 0) {
          memoryGB = dev.memorySize > 64 ? Math.round(dev.memorySize / 1024) : dev.memorySize;
        }
        brand = dev.brand || '';
        model = dev.model || '';
      } catch (e) {}
    } else if (isBrowser && typeof navigator !== 'undefined') {
      const navPlat = navigator.platform || '';
      isIOS =
        /iPad|iPhone|iPod/i.test(ua) ||
        (navPlat === 'MacIntel' && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1);
      isHarmony = /OpenHarmony|HarmonyOS|ArkWeb/i.test(ua);
      isAndroid = !isIOS && (/Android/i.test(ua) || isHarmony);
      os = isIOS ? 'ios' : isHarmony ? 'harmony' : isAndroid ? 'android' : 'desktop';
      if (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory > 0) {
        memoryGB = navigator.deviceMemory;
      }
    }

    const isMobile =
      isMiniGame ||
      isIOS ||
      isAndroid ||
      isHarmony ||
      (isBrowser &&
        typeof navigator !== 'undefined' &&
        navigator.maxTouchPoints > 0 &&
        typeof window !== 'undefined' &&
        Math.min(window.innerWidth || 9999, window.innerHeight || 9999) < 920);

    const cores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 6;
    const isLowEnd =
      (benchmarkLevel > 0 && benchmarkLevel < 16) ||
      (isMobile && (memoryGB <= 3 || (isAndroid && cores <= 4)));

    const runtimeTag = isDouyin
      ? 'douyin_minigame'
      : isWechat
        ? 'wechat_minigame'
        : isWechatWebView
          ? 'wechat_webview'
          : isDouyinWebView
            ? 'douyin_webview'
            : isBrowser
              ? 'web'
              : 'node';

    _deviceProfile = {
      os,
      runtimeTag,
      isIOS,
      isAndroid,
      isHarmony,
      isMobile,
      isLowEnd,
      benchmarkLevel,
      memoryGB,
      brand,
      model
    };
    return _deviceProfile;
  }

  /**
   * 探测浏览器 CSS env(safe-area-inset-*) 刘海/灵动岛/底部手势条安全边距
   */
  function getBrowserSafeInsetsRaw() {
    if (!isBrowser || !document.body) {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }
    if (_cachedCssInsets) return _cachedCssInsets;
    try {
      if (!_safeProbeEl) {
        _safeProbeEl = document.createElement('div');
        _safeProbeEl.style.cssText =
          'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;visibility:hidden;' +
          'padding-top:env(safe-area-inset-top,0px);' +
          'padding-right:env(safe-area-inset-right,0px);' +
          'padding-bottom:env(safe-area-inset-bottom,0px);' +
          'padding-left:env(safe-area-inset-left,0px);';
        document.body.appendChild(_safeProbeEl);
      }
      const cs = window.getComputedStyle(_safeProbeEl);
      _cachedCssInsets = {
        top: Math.max(0, parseFloat(cs.paddingTop) || 0),
        right: Math.max(0, parseFloat(cs.paddingRight) || 0),
        bottom: Math.max(0, parseFloat(cs.paddingBottom) || 0),
        left: Math.max(0, parseFloat(cs.paddingLeft) || 0)
      };
      return _cachedCssInsets;
    } catch (e) {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }
  }

  /**
   * 获取微信/抖音小游戏右上角官方胶囊按钮位置（带短时缓存避免每帧跨桥调用开销）
   */
  function getMiniMenuRect() {
    if (!isMiniGame || !miniApi || typeof miniApi.getMenuButtonBoundingClientRect !== 'function') {
      return null;
    }
    const now = Date.now();
    if (_cachedMenuRect && now - _menuRectTs < 2500) {
      return _cachedMenuRect;
    }
    try {
      const r = miniApi.getMenuButtonBoundingClientRect();
      if (r && r.width > 0 && r.height > 0) {
        _cachedMenuRect = r;
        _menuRectTs = now;
        return r;
      }
    } catch (e) {}
    return _cachedMenuRect;
  }

  function mapSafeInsetsToLandscape(rawInsets, rotatedPortrait) {
    if (rotatedPortrait) {
      // 顺时针旋转 90°：物理顶部(刘海/灵动岛) -> 横版左侧；物理底部(Home条) -> 横版右侧；物理右 -> 横版顶；物理左 -> 横版底
      return {
        left: Math.round(rawInsets.top || 0),
        right: Math.round(rawInsets.bottom || 0),
        top: Math.round(rawInsets.right || 0),
        bottom: Math.round(rawInsets.left || 0)
      };
    }
    return {
      left: Math.round(rawInsets.left || 0),
      right: Math.round(rawInsets.right || 0),
      top: Math.round(rawInsets.top || 0),
      bottom: Math.round(rawInsets.bottom || 0)
    };
  }

  function resolveEffectiveDpr(rawDpr) {
    const prof = getDeviceProfile();
    const baseCap =
      _dprCapOverride > 0
        ? _dprCapOverride
        : prof.isLowEnd
          ? 1.5
          : prof.isMobile
            ? 2.0
            : 2.25;
    return Math.max(1, Math.min(rawDpr || 1, baseCap));
  }

  function setDprCap(capVal) {
    _dprCapOverride = capVal > 0 ? capVal : 0;
  }

  function getScreenInfo() {
    const prof = getDeviceProfile();

    if (isMiniGame && miniApi) {
      try {
        const win =
          typeof miniApi.getWindowInfo === 'function'
            ? miniApi.getWindowInfo()
            : miniApi.getSystemInfoSync();
        const rawW = win.windowWidth || win.screenWidth || 800;
        const rawH = win.windowHeight || win.screenHeight || 450;
        const rotatedPortrait = rawH > rawW;
        const sa = win.safeArea || null;

        const rawInsets = sa
          ? {
              left: Math.max(0, sa.left || 0),
              top: Math.max(0, sa.top || 0),
              right: Math.max(0, rawW - (sa.right || rawW)),
              bottom: Math.max(0, rawH - (sa.bottom || rawH))
            }
          : { left: 0, top: 0, right: 0, bottom: 0 };

        const safeInsets = mapSafeInsetsToLandscape(rawInsets, rotatedPortrait);
        const menuRect = getMiniMenuRect();
        let capsuleAvoidRight = 0;
        let capsuleBottom = 0;

        if (menuRect && menuRect.width > 0) {
          if (!rotatedPortrait) {
            const fromRight = Math.max(0, Math.ceil(rawW - (menuRect.left || rawW - 96) + 8));
            capsuleAvoidRight = Math.min(136, fromRight);
            capsuleBottom = Math.ceil(menuRect.bottom || 40);
          } else {
            // 竖屏锁定时官方胶囊在物理右上角 -> 映射在横版左上角，自动并入 safeInsets.left 避让
            safeInsets.left = Math.max(safeInsets.left, Math.min(96, Math.ceil((menuRect.bottom || 44) + 6)));
          }
        }

        return {
          width: Math.max(rawW, rawH),
          height: Math.min(rawW, rawH),
          rawW,
          rawH,
          rotatedPortrait,
          dpr: resolveEffectiveDpr(win.pixelRatio || 2),
          rawDpr: win.pixelRatio || 2,
          platform: isDouyin ? 'douyin' : 'wechat',
          os: prof.os,
          safeInsets,
          capsuleAvoidRight,
          capsuleBottom
        };
      } catch (e) {
        return {
          width: 800,
          height: 450,
          rawW: 800,
          rawH: 450,
          rotatedPortrait: false,
          dpr: 2,
          rawDpr: 2,
          platform: isDouyin ? 'douyin' : 'wechat',
          os: prof.os,
          safeInsets: { left: 0, right: 0, top: 0, bottom: 0 },
          capsuleAvoidRight: 96,
          capsuleBottom: 40
        };
      }
    }

    if (isBrowser) {
      const vv = window.visualViewport;
      const docEl = document.documentElement;
      const rawW = Math.round((vv && vv.width) || (docEl && docEl.clientWidth) || window.innerWidth || 960);
      const rawH = Math.round((vv && vv.height) || (docEl && docEl.clientHeight) || window.innerHeight || 540);
      const rotatedPortrait = rawH > rawW;
      const rawInsets = getBrowserSafeInsetsRaw();
      const safeInsets = mapSafeInsetsToLandscape(rawInsets, rotatedPortrait);

      return {
        width: rotatedPortrait ? rawH : rawW,
        height: rotatedPortrait ? rawW : rawH,
        rawW,
        rawH,
        rotatedPortrait,
        dpr: resolveEffectiveDpr(window.devicePixelRatio || 1),
        rawDpr: window.devicePixelRatio || 1,
        platform: isWechatWebView ? 'wechat_h5' : isDouyinWebView ? 'douyin_h5' : 'web',
        os: prof.os,
        safeInsets,
        capsuleAvoidRight: 0,
        capsuleBottom: 0
      };
    }

    return {
      width: 800,
      height: 450,
      rawW: 800,
      rawH: 450,
      rotatedPortrait: false,
      dpr: 1,
      rawDpr: 1,
      platform: 'node',
      os: 'desktop',
      safeInsets: { left: 0, right: 0, top: 0, bottom: 0 },
      capsuleAvoidRight: 0,
      capsuleBottom: 0
    };
  }

  function getMainCanvas() {
    if (_mainCanvas) return _mainCanvas;
    if (isMiniGame && miniApi) {
      _mainCanvas = miniApi.createCanvas();
      return _mainCanvas;
    }
    if (isBrowser) {
      _mainCanvas = document.getElementById('gameCanvas');
      if (!_mainCanvas) {
        _mainCanvas = document.createElement('canvas');
        _mainCanvas.id = 'gameCanvas';
        document.body.appendChild(_mainCanvas);
      }
      return _mainCanvas;
    }
    return null;
  }

  function createOffscreenCanvas(width, height) {
    getMainCanvas();
    let c = null;
    if (isMiniGame && miniApi) {
      // 注意：微信/抖音真机部分基础库 createOffscreenCanvas 仅支持 WebGL 或在 drawImage 时存在兼容差异，
      // 统一优先使用 createCanvas 创建内存 2D 离屏画布，确保 iOS/Android 100% 稳定支持 getContext('2d') 与 drawImage
      c = miniApi.createCanvas();
    } else if (isBrowser) {
      c = document.createElement('canvas');
    } else {
      return {
        width,
        height,
        getContext: () => null
      };
    }
    c.width = width;
    c.height = height;
    return c;
  }

  function createImage() {
    if (isMiniGame && miniApi && typeof miniApi.createImage === 'function') {
      return miniApi.createImage();
    }
    if (typeof Image !== 'undefined') {
      return new Image();
    }
    return {};
  }

  function getStorage(key, defaultValue) {
    try {
      if (isMiniGame && miniApi && typeof miniApi.getStorageSync === 'function') {
        const val = miniApi.getStorageSync(key);
        if (val === '' || val === undefined || val === null) return defaultValue;
        return typeof val === 'string' ? JSON.parse(val) : val;
      }
      if (isBrowser && window.localStorage) {
        const raw = window.localStorage.getItem(key);
        if (!raw) return defaultValue;
        return JSON.parse(raw);
      }
    } catch (e) {}
    return defaultValue;
  }

  function setStorage(key, value) {
    try {
      const serialized = JSON.stringify(value);
      if (isMiniGame && miniApi && typeof miniApi.setStorageSync === 'function') {
        miniApi.setStorageSync(key, serialized);
        return true;
      }
      if (isBrowser && window.localStorage) {
        window.localStorage.setItem(key, serialized);
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }

  let _lastVibrateTs = 0;
  function vibrate(type) {
    // 高频连斩震动节流（防止低端 Android 马达阻塞主线程或过载）
    const now = Date.now();
    if (type !== 'heavy' && now - _lastVibrateTs < 55) return;
    _lastVibrateTs = now;

    if (isMiniGame && miniApi) {
      try {
        if (type === 'heavy' && typeof miniApi.vibrateLong === 'function') {
          miniApi.vibrateLong({});
        } else if (typeof miniApi.vibrateShort === 'function') {
          miniApi.vibrateShort({ type: type === 'medium' ? 'medium' : 'light' });
        }
      } catch (e) {}
    } else if (isBrowser && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(type === 'heavy' ? 38 : type === 'medium' ? 18 : 9);
      } catch (e) {}
    }
  }

  /**
   * 保持屏幕常亮（防止 Boss 战或阅读词条时手机自动息屏锁屏）
   */
  function setKeepScreenOn(keepOn) {
    const flag = keepOn !== false;
    if (isMiniGame && miniApi && typeof miniApi.setKeepScreenOn === 'function') {
      try {
        miniApi.setKeepScreenOn({ keepScreenOn: flag });
      } catch (e) {}
      return;
    }
    if (isBrowser && flag && typeof navigator !== 'undefined' && navigator.wakeLock && typeof navigator.wakeLock.request === 'function') {
      if (_wakeLockSentinel) return;
      try {
        navigator.wakeLock
          .request('screen')
          .then((sentinel) => {
            _wakeLockSentinel = sentinel;
            if (sentinel && typeof sentinel.addEventListener === 'function') {
              sentinel.addEventListener('release', () => {
                _wakeLockSentinel = null;
              });
            }
          })
          .catch(() => {});
      } catch (e) {}
    }
  }

  function onMemoryWarning(handler) {
    if (typeof handler !== 'function') return;
    _memoryWarnHandlers.push(handler);
    if (_memoryWarnHandlers.length === 1 && isMiniGame && miniApi && typeof miniApi.onMemoryWarning === 'function') {
      try {
        miniApi.onMemoryWarning((res) => {
          for (let i = 0; i < _memoryWarnHandlers.length; i++) {
            try {
              _memoryWarnHandlers[i](res);
            } catch (e) {}
          }
          if (typeof miniApi.triggerGC === 'function') {
            try {
              miniApi.triggerGC();
            } catch (e) {}
          }
        });
      } catch (e) {}
    }
  }

  function requestFullscreen() {
    if (!isBrowser || !document.documentElement) return;
    const doc = document;
    const isFs = doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement;
    if (isFs) {
      const exitFn = doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
      if (exitFn) {
        try {
          exitFn.call(doc).catch(() => {});
        } catch (e) {}
      }
      return;
    }
    const el = document.documentElement;
    const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (fn) {
      try {
        const ret = fn.call(el);
        if (ret && typeof ret.catch === 'function') ret.catch(() => {});
      } catch (e) {}
    }
  }

  /**
   * 挂载浏览器/WebView History 返回栈哨兵（需在首次真实用户触摸时加固，兼容 Android Chrome 手势干预策略）
   */
  function armHistoryBackGuard(fromUserGesture) {
    if (!isBrowser || !window.history || typeof window.history.pushState !== 'function') return;
    try {
      const curState = window.history.state;
      if (!curState || !curState.__xiyouBackGuard) {
        window.history.pushState({ __xiyouBackGuard: 1, ts: Date.now() }, '');
      } else if (fromUserGesture && !_historyTrapArmedWithGesture) {
        window.history.replaceState({ __xiyouBackGuard: 1, gestureArmed: true, ts: Date.now() }, '');
        window.history.pushState({ __xiyouBackGuard: 2, gestureArmed: true, ts: Date.now() }, '');
      }
      if (fromUserGesture) _historyTrapArmedWithGesture = true;
    } catch (e) {}
  }

  function emitBackEvent(source) {
    let handled = false;
    for (let i = _backHandlers.length - 1; i >= 0; i--) {
      try {
        if (_backHandlers[i](source) === true) {
          handled = true;
          break;
        }
      } catch (e) {}
    }
    return handled;
  }

  /**
   * 统一注册跨端返回键/侧滑返回拦截器（Android 物理返回键、全面屏侧滑、小程序返回、Web popstate、ハイブリッド容器 backbutton）
   */
  function onBackNavigation(handler) {
    if (typeof handler !== 'function') return;
    _backHandlers.push(handler);

    if (_historyTrapInstalled) return;
    _historyTrapInstalled = true;

    if (isMiniGame && miniApi) {
      // 1. 抖音小程序/小游戏：关闭敏感的全屏侧滑直接退出（支持该接口的宿主会自动生效）
      if (isDouyin && typeof miniApi.setSwipeBackMode === 'function') {
        try {
          miniApi.setSwipeBackMode(0);
        } catch (e) {}
      }
      // 2. 微信/抖音宿主返回前原生二次确认兜底（若基础库支持）
      if (typeof miniApi.enableAlertBeforeUnload === 'function') {
        try {
          miniApi.enableAlertBeforeUnload({
            message: '当前西行破劫尚未结束，确定要退出《西游破劫录》吗？'
          });
        } catch (e) {}
      }
      // 3. 宿主容器返回键回调（部分小程序 WebView/混编运行时提供）
      if (typeof miniApi.onBackPress === 'function') {
        try {
          miniApi.onBackPress(() => emitBackEvent('minigame_back'));
        } catch (e) {}
      }
      return;
    }

    if (isBrowser) {
      armHistoryBackGuard(false);

      window.addEventListener('popstate', () => {
        if (_allowNextExit) {
          _allowNextExit = false;
          return;
        }
        const intercepted = emitBackEvent('browser_popstate');
        if (intercepted) {
          armHistoryBackGuard(true);
        }
      });

      // 兼容 Android App 内嵌 WebView / Cordova / uni-app / 5+ Runtime 物理返回键事件
      document.addEventListener(
        'backbutton',
        (e) => {
          if (emitBackEvent('webview_backbutton')) {
            e && e.preventDefault && e.preventDefault();
          }
        },
        false
      );
    }
  }

  /**
   * 当玩家在主界面完成「二次确认退出」后，执行真正的宿主退出或历史回退
   */
  function exitHostApp() {
    if (isMiniGame && miniApi && typeof miniApi.exitMiniProgram === 'function') {
      try {
        miniApi.exitMiniProgram({});
        return true;
      } catch (e) {}
    }
    if (isBrowser && window.history && window.history.length > 1) {
      _allowNextExit = true;
      try {
        window.history.go(-2);
        return true;
      } catch (e) {}
    }
    return false;
  }

  function mapLandscapeCoord(rawX, rawY) {
    const info = getScreenInfo();
    if (info.rotatedPortrait) {
      // 物理竖屏被顺时针渲染为横屏后的逆坐标映射
      return {
        x: rawY,
        y: info.rawW - rawX
      };
    }
    return { x: rawX, y: rawY };
  }

  function bindInputEvents(canvas, callbacks) {
    setKeepScreenOn(true);

    if (isMiniGame && miniApi) {
      const mapTouches = (touches) =>
        Array.from(touches || []).map((t) => {
          const rx = t.clientX !== undefined ? t.clientX : t.pageX !== undefined ? t.pageX : t.x || 0;
          const ry = t.clientY !== undefined ? t.clientY : t.pageY !== undefined ? t.pageY : t.y || 0;
          const p = mapLandscapeCoord(rx, ry);
          return { id: t.identifier, x: p.x, y: p.y, rawX: rx, rawY: ry };
        });

      miniApi.onTouchStart((e) => {
        callbacks.onFirstGesture && callbacks.onFirstGesture();
        callbacks.onTouchStart && callbacks.onTouchStart(mapTouches(e.changedTouches), mapTouches(e.touches));
      });
      miniApi.onTouchMove((e) =>
        callbacks.onTouchMove && callbacks.onTouchMove(mapTouches(e.changedTouches), mapTouches(e.touches))
      );
      miniApi.onTouchEnd((e) =>
        callbacks.onTouchEnd && callbacks.onTouchEnd(mapTouches(e.changedTouches), mapTouches(e.touches))
      );
      miniApi.onTouchCancel((e) =>
        callbacks.onTouchEnd && callbacks.onTouchEnd(mapTouches(e.changedTouches), mapTouches(e.touches))
      );

      if (typeof miniApi.onWindowResize === 'function') {
        miniApi.onWindowResize(() => {
          _cachedMenuRect = null;
          callbacks.onResize && callbacks.onResize();
        });
      }
      return;
    }

    if (isBrowser && canvas) {
      let lastTouchTs = 0;

      const getPos = (clientX, clientY) => {
        const rect = canvas.getBoundingClientRect();
        const rx = clientX - rect.left;
        const ry = clientY - rect.top;
        if (rect.height > rect.width) {
          return { x: ry, y: rect.width - rx, rawX: rx, rawY: ry };
        }
        return { x: rx, y: ry, rawX: rx, rawY: ry };
      };

      const mapBrowserTouches = (touchList) =>
        Array.from(touchList || []).map((t) => {
          const p = getPos(t.clientX, t.clientY);
          return { id: t.identifier, x: p.x, y: p.y, rawX: p.rawX, rawY: p.rawY };
        });

      const handleFirstUserAction = () => {
        armHistoryBackGuard(true);
        setKeepScreenOn(true);
        callbacks.onFirstGesture && callbacks.onFirstGesture();
      };

      canvas.addEventListener(
        'touchstart',
        (e) => {
          lastTouchTs = Date.now();
          if (e.cancelable) e.preventDefault();
          handleFirstUserAction();
          callbacks.onTouchStart && callbacks.onTouchStart(mapBrowserTouches(e.changedTouches), mapBrowserTouches(e.touches));
        },
        { passive: false }
      );
      canvas.addEventListener(
        'touchmove',
        (e) => {
          lastTouchTs = Date.now();
          if (e.cancelable) e.preventDefault();
          callbacks.onTouchMove && callbacks.onTouchMove(mapBrowserTouches(e.changedTouches), mapBrowserTouches(e.touches));
        },
        { passive: false }
      );
      const endHandler = (e) => {
        lastTouchTs = Date.now();
        if (e.cancelable) e.preventDefault();
        callbacks.onTouchEnd && callbacks.onTouchEnd(mapBrowserTouches(e.changedTouches), mapBrowserTouches(e.touches));
      };
      canvas.addEventListener('touchend', endHandler, { passive: false });
      canvas.addEventListener('touchcancel', endHandler, { passive: false });

      // 过滤移动端触摸后部分 Android WebView 派发的合成幽灵鼠标事件（450ms 窗口）
      let mouseDown = false;
      canvas.addEventListener('mousedown', (e) => {
        if (Date.now() - lastTouchTs < 450) return;
        mouseDown = true;
        handleFirstUserAction();
        const p = getPos(e.clientX, e.clientY);
        const pt = [{ id: 'mouse', x: p.x, y: p.y, rawX: p.rawX, rawY: p.rawY }];
        callbacks.onTouchStart && callbacks.onTouchStart(pt, pt);
      });
      window.addEventListener('mousemove', (e) => {
        if (Date.now() - lastTouchTs < 450) return;
        const p = getPos(e.clientX, e.clientY);
        callbacks.onMouseMove && callbacks.onMouseMove(p);
        if (!mouseDown) return;
        const pt = [{ id: 'mouse', x: p.x, y: p.y, rawX: p.rawX, rawY: p.rawY }];
        callbacks.onTouchMove && callbacks.onTouchMove(pt, pt);
      });
      window.addEventListener('mouseup', (e) => {
        if (Date.now() - lastTouchTs < 450) {
          mouseDown = false;
          return;
        }
        if (!mouseDown) return;
        mouseDown = false;
        const p = getPos(e.clientX, e.clientY);
        const pt = [{ id: 'mouse', x: p.x, y: p.y, rawX: p.rawX, rawY: p.rawY }];
        callbacks.onTouchEnd && callbacks.onTouchEnd(pt, []);
      });

      window.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' ', 'BrowserBack', 'GoBack'].includes(e.key)) {
          e.preventDefault();
        }
        handleFirstUserAction();
        if (e.key === 'BrowserBack' || e.key === 'GoBack') {
          emitBackEvent('hardware_key_back');
          return;
        }
        callbacks.onKeyDown && callbacks.onKeyDown(e.code, e.key, e);
      });
      window.addEventListener('keyup', (e) => {
        callbacks.onKeyUp && callbacks.onKeyUp(e.code, e.key, e);
      });

      const triggerResize = () => {
        _cachedCssInsets = null;
        callbacks.onResize && callbacks.onResize();
      };
      window.addEventListener('resize', triggerResize);
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', triggerResize);
      }
      window.addEventListener('orientationchange', () => {
        setTimeout(triggerResize, 100);
        setTimeout(triggerResize, 320);
      });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          mouseDown = false;
          callbacks.onAppBlur && callbacks.onAppBlur();
        } else {
          setKeepScreenOn(true);
          triggerResize();
          callbacks.onAppFocus && callbacks.onAppFocus();
        }
      });
      window.addEventListener('blur', () => {
        mouseDown = false;
        callbacks.onAppBlur && callbacks.onAppBlur();
      });
      window.addEventListener('pageshow', () => {
        triggerResize();
        callbacks.onAppFocus && callbacks.onAppFocus();
      });
    }
  }

  function nextFrame(fn) {
    if (isMiniGame && typeof requestAnimationFrame === 'function') {
      return requestAnimationFrame(fn);
    }
    if (typeof requestAnimationFrame === 'function') {
      return requestAnimationFrame(fn);
    }
    return setTimeout(() => fn(Date.now()), 16);
  }

  return {
    isDouyin,
    isWechat,
    isMiniGame,
    miniApi,
    isBrowser,
    isWechatWebView,
    isDouyinWebView,
    getDeviceProfile,
    setDprCap,
    getScreenInfo,
    getMainCanvas,
    createOffscreenCanvas,
    createImage,
    getStorage,
    setStorage,
    vibrate,
    setKeepScreenOn,
    onMemoryWarning,
    requestFullscreen,
    armHistoryBackGuard,
    onBackNavigation,
    exitHostApp,
    bindInputEvents,
    nextFrame
  };
});
