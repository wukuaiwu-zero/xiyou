/**
 * 抖音小游戏 (`tt`) & 微信小游戏 (`wx`) 双端商业化与平台能力 SDK 封装层 (src/sdk/douyinSDK.js)
 *
 * 已完整实现并双端兼容以下核心接口：
 * 1. showRewardedAd / watchAdToRevive : 激励视频广告（自动兼容抖音 tt 与微信 wx 流量主单例规范 + 开发态模拟播放器）
 * 2. showInterstitialAd               : 章节过渡插屏广告（tt / wx 双端）
 * 3. showBannerAd / hideBannerAd      : 底部安全区自适应 Banner 广告
 * 4. 侧边栏/我的小程序复访有礼        : 抖音 checkScene/navigateToScene('sidebar') + 微信复访场景值识别 (1089/1023/1104)
 * 5. 游戏录屏与好友/朋友圈/短视频分享 : 抖音录屏发视频 + 微信转发好友/朋友圈
 * 6. 埋点上报与外部服务端钩子          : tt.reportAnalytics / wx.reportEvent + externalHooks
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
})('douyinSDK', function (require) {
  const SDK_CONFIG = require('../config/sdkConfig');
  const Env = require('../platform/env');

  // 缓存激励视频单例，防止微信/抖音重复创建与重复绑定回调导致多次发奖
  const _rewardedAdCache = {};
  let _bannerAd = null;
  let _lifecycleBound = false;

  // 侧边栏 / 微信快捷复访状态
  let _sidebarSupported = !Env.isMiniGame;
  let _launchedFromRevisitScene = false;

  // 录屏状态
  let _recorder = null;
  let _isRecording = false;
  let _lastVideoPath = '';
  let _recordStartTime = 0;

  // 模拟广告状态机（由 UI 层渲染并驱动交互）
  const mockAdState = {
    active: false,
    placement: '',
    title: '激励视频广告模拟',
    remainingSec: 0,
    totalSec: 3,
    canReward: false,
    _onSuccess: null,
    _onCancel: null
  };

  function getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function detectRevisitLaunchScene(res) {
    if (!res) return false;
    // 抖音侧边栏场景识别
    if (
      res.launchFrom === 'homepage' ||
      res.location === 'sidebar_card' ||
      String(res.scene) === '021036'
    ) {
      return true;
    }
    // 微信小程序/小游戏「我的小程序 / 桌面图标 / 浮窗复访」场景值识别
    const wxRevisitScenes = ['1089', '1023', '1103', '1104', '1131'];
    if (res.scene !== undefined && wxRevisitScenes.indexOf(String(res.scene)) !== -1) {
      return true;
    }
    return false;
  }

  function resolvePlatformAdUnitId(slotKey, fallbackId) {
    if (Env.isWechat && SDK_CONFIG.wechatAdUnitIds && SDK_CONFIG.wechatAdUnitIds[slotKey]) {
      return SDK_CONFIG.wechatAdUnitIds[slotKey];
    }
    return fallbackId || (SDK_CONFIG.adUnitIds && SDK_CONFIG.adUnitIds[slotKey]) || '';
  }

  /**
   * 初始化抖音/微信双端生命周期、侧边栏/复访检测、右上角转发菜单与录屏管理器
   * @param {{ onPause?: Function, onResume?: Function }} lifecycleCallbacks
   */
  function init(lifecycleCallbacks) {
    const cb = lifecycleCallbacks || {};
    const api = Env.miniApi;

    if (Env.isMiniGame && api && !_lifecycleBound) {
      _lifecycleBound = true;

      // 0. 冷启动参数检测（修复冷启动从侧边栏/我的小程序进入时漏检场景值的问题）
      if (typeof api.getLaunchOptionsSync === 'function') {
        try {
          const launchOpts = api.getLaunchOptionsSync();
          if (detectRevisitLaunchScene(launchOpts)) {
            _launchedFromRevisitScene = true;
          }
        } catch (e) {}
      }

      // 1. 监听前后台切换与侧边栏/微信复访启动场景识别
      if (typeof api.onShow === 'function') {
        api.onShow((res) => {
          if (detectRevisitLaunchScene(res)) {
            _launchedFromRevisitScene = true;
          }
          Env.setKeepScreenOn && Env.setKeepScreenOn(true);
          cb.onResume && cb.onResume(res);
        });
      }
      if (typeof api.onHide === 'function') {
        api.onHide(() => {
          cb.onPause && cb.onPause();
        });
      }

      // 2. 检测宿主是否支持抖音侧边栏（微信端默认开启「我的小程序」复访福利）
      if (Env.isDouyin && typeof api.checkScene === 'function') {
        try {
          api.checkScene({
            scene: 'sidebar',
            success: (res) => {
              _sidebarSupported = !!(res && res.isExist);
            },
            fail: () => {
              _sidebarSupported = false;
            }
          });
        } catch (e) {}
      } else if (Env.isWechat) {
        _sidebarSupported = true;
      }

      // 3. 开启右上角分享转发与朋友圈菜单（兼容微信 & 抖音）
      if (typeof api.showShareMenu === 'function') {
        try {
          api.showShareMenu(
            Env.isWechat
              ? { withShareTicket: true, menus: ['shareAppMessage', 'shareTimeline'] }
              : { withShareTicket: true }
          );
        } catch (e) {}
      }
      if (typeof api.onShareAppMessage === 'function') {
        api.onShareAppMessage(() => ({
          title: SDK_CONFIG.shareConfig.defaultTitle,
          imageUrl: SDK_CONFIG.shareConfig.imageUrl || undefined
        }));
      }
      if (Env.isWechat && typeof api.onShareTimeline === 'function') {
        try {
          api.onShareTimeline(() => ({
            title: SDK_CONFIG.shareConfig.defaultTitle,
            imageUrl: SDK_CONFIG.shareConfig.imageUrl || undefined
          }));
        } catch (e) {}
      }

      // 4. 初始化游戏录屏管理器（抖音原生支持，微信兼容探测）
      if (typeof api.getGameRecorderManager === 'function') {
        try {
          _recorder = api.getGameRecorderManager();
          _recorder.onStart(() => {
            _isRecording = true;
            _recordStartTime = Date.now();
          });
          _recorder.onStop((res) => {
            _isRecording = false;
            if (res && res.videoPath) {
              _lastVideoPath = res.videoPath;
            }
          });
          _recorder.onError(() => {
            _isRecording = false;
          });
        } catch (e) {}
      }
    }
  }

  /**
   * 判断是否应该走真实微信/抖音原生激励视频广告
   */
  function shouldUseRealAd(adUnitId) {
    if (!Env.isMiniGame || !Env.miniApi) return false;
    if (SDK_CONFIG.enableMockAd) return false;
    if (!adUnitId || adUnitId.indexOf('placeholder') !== -1) return false;
    return typeof Env.miniApi.createRewardedVideoAd === 'function';
  }

  /**
   * 通用激励视频播放接口（自动兼容微信 wx / 抖音 tt 真机激励广告与开发态模拟广告）
   */
  function showRewardedAd(options) {
    const {
      placement = 'revive',
      adUnitId: rawAdUnitId,
      mockTitle = '观看完整视频 · 观音甘露逆天改命',
      onSuccess,
      onCancel,
      onError
    } = options || {};

    const slotMap = {
      revive: 'rewardedRevive',
      starter_weapon: 'rewardedStarterWeapon',
      bonus_souls: 'rewardedBonusResource',
      reforge_equip: 'rewardedBonusResource',
      reroll_choices: 'rewardedBonusResource'
    };
    const slotKey = slotMap[placement] || 'rewardedBonusResource';
    const adUnitId = resolvePlatformAdUnitId(slotKey, rawAdUnitId || SDK_CONFIG.adUnitIds[slotKey]);

    trackEvent('ad_request', {
      placement,
      platform: Env.isWechat ? 'wechat' : Env.isDouyin ? 'douyin' : 'web',
      isReal: shouldUseRealAd(adUnitId)
    });

    const grantReward = async () => {
      try {
        if (typeof SDK_CONFIG.externalHooks.onBeforeGrantAdReward === 'function') {
          const allowed = await SDK_CONFIG.externalHooks.onBeforeGrantAdReward(placement);
          if (allowed === false) {
            onCancel && onCancel('服务端奖励校验未通过');
            return;
          }
        }
        trackEvent('ad_complete_reward', { placement });
        onSuccess && onSuccess();
      } catch (err) {
        onError && onError(err);
      }
    };

    // 分支 A：微信/抖音真机激励视频广告流
    if (shouldUseRealAd(adUnitId)) {
      try {
        const api = Env.miniApi;
        let videoAd = _rewardedAdCache[adUnitId];
        if (!videoAd) {
          videoAd = api.createRewardedVideoAd({ adUnitId });
          _rewardedAdCache[adUnitId] = videoAd;
        }

        const cleanup = () => {
          if (typeof videoAd.offClose === 'function') videoAd.offClose(handleClose);
          if (typeof videoAd.offError === 'function') videoAd.offError(handleError);
        };

        const handleClose = (res) => {
          cleanup();
          // 兼容微信与抖音基础库：res 为空或 res.isEnded === true 视为完整播放完成
          if ((res && res.isEnded) || res === undefined) {
            grantReward();
          } else {
            trackEvent('ad_skip_cancel', { placement });
            onCancel && onCancel('需完整观看广告才可获得仙缘奖励哦');
          }
        };

        const handleError = (err) => {
          cleanup();
          trackEvent('ad_error', { placement, errMsg: (err && err.errMsg) || 'unknown' });
          onError ? onError(err) : onCancel && onCancel('广告拉取繁忙，请稍后再试');
        };

        videoAd.onClose(handleClose);
        videoAd.onError(handleError);

        videoAd
          .show()
          .catch(() => videoAd.load().then(() => videoAd.show()))
          .catch((err) => {
            handleError(err);
          });
      } catch (e) {
        onError ? onError(e) : onCancel && onCancel('广告组件初始化异常');
      }
      return;
    }

    // 分支 B：开发调试 / 浏览器预览模式 —— 唤起可视化模拟激励视频弹窗
    const dur = Math.max(1, SDK_CONFIG.mockAdDurationSec || 3);
    mockAdState.active = true;
    mockAdState.placement = placement;
    mockAdState.title = mockTitle;
    mockAdState.totalSec = dur;
    mockAdState.remainingSec = dur;
    mockAdState.canReward = false;
    mockAdState._onSuccess = grantReward;
    mockAdState._onCancel = (msg) => {
      trackEvent('ad_skip_cancel', { placement, mock: true });
      onCancel && onCancel(msg || '未看完广告，未能激活复活甘露');
    };
  }

  /**
   * 专用快捷接口：死亡看广告满血复活
   */
  function watchAdToRevive(callbacks) {
    const { characterId, stageIndex, reviveCount, onSuccess, onCancel, onError } = callbacks || {};
    const platLabel = Env.isWechat ? '微信激励视频' : '抖音激励视频';
    showRewardedAd({
      placement: 'revive',
      adUnitId: resolvePlatformAdUnitId('rewardedRevive', SDK_CONFIG.adUnitIds.rewardedRevive),
      mockTitle: `【${platLabel}预留接口】观音甘露 · 满血金身复活`,
      onSuccess: () => {
        if (typeof SDK_CONFIG.externalHooks.onPlayerRevived === 'function') {
          SDK_CONFIG.externalHooks.onPlayerRevived({ characterId, stageIndex, reviveCount });
        }
        onSuccess && onSuccess();
      },
      onCancel,
      onError
    });
  }

  /**
   * 更新模拟广告计时（在主循环中每帧调用）
   */
  function updateMockAd(dt) {
    if (!mockAdState.active) return;
    if (mockAdState.remainingSec > 0) {
      mockAdState.remainingSec = Math.max(0, mockAdState.remainingSec - dt);
      if (mockAdState.remainingSec <= 0) {
        mockAdState.canReward = true;
      }
    }
  }

  /**
   * 玩家点击模拟广告关闭按钮
   * @param {boolean} forceSkip 是否强制中途跳过
   */
  function closeMockAd(forceSkip) {
    if (!mockAdState.active) return;
    const ok = !forceSkip && mockAdState.canReward;
    const onSuccess = mockAdState._onSuccess;
    const onCancel = mockAdState._onCancel;
    mockAdState.active = false;
    mockAdState._onSuccess = null;
    mockAdState._onCancel = null;

    if (ok) {
      onSuccess && onSuccess();
    } else {
      onCancel && onCancel('视频尚未播放完毕，完整观看即可满血复活！');
    }
  }

  /**
   * 插屏广告预留接口（兼容微信 wx.createInterstitialAd 与抖音 tt.createInterstitialAd）
   */
  function showInterstitialAd() {
    const adUnitId = resolvePlatformAdUnitId('interstitialStageClear', SDK_CONFIG.adUnitIds.interstitialStageClear);
    if (!Env.isMiniGame || !Env.miniApi || SDK_CONFIG.enableMockAd || !adUnitId || adUnitId.indexOf('placeholder') !== -1) {
      trackEvent('interstitial_mock_skip', {});
      return;
    }
    if (typeof Env.miniApi.createInterstitialAd === 'function') {
      try {
        const interstitialAd = Env.miniApi.createInterstitialAd({ adUnitId });
        const p = typeof interstitialAd.load === 'function' ? interstitialAd.load().then(() => interstitialAd.show()) : interstitialAd.show();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (e) {}
    }
  }

  /**
   * Banner 广告预留接口（自动避让 iOS 底部 Home 手势条安全区）
   */
  function showBannerAd() {
    const adUnitId = resolvePlatformAdUnitId('bannerHome', SDK_CONFIG.adUnitIds.bannerHome);
    if (!Env.isMiniGame || !Env.miniApi || SDK_CONFIG.enableMockAd || !adUnitId || adUnitId.indexOf('placeholder') !== -1) {
      return;
    }
    if (typeof Env.miniApi.createBannerAd === 'function') {
      try {
        const sys = Env.getScreenInfo();
        const bottomInset = (sys.safeInsets && sys.safeInsets.bottom) || 0;
        const bw = Math.min(320, Math.max(300, Math.round(sys.width * 0.38)));
        if (!_bannerAd) {
          _bannerAd = Env.miniApi.createBannerAd({
            adUnitId,
            style: {
              width: bw,
              top: Math.max(0, sys.height - 90 - bottomInset),
              left: Math.round((sys.width - bw) / 2)
            }
          });
          if (_bannerAd && typeof _bannerAd.onResize === 'function') {
            _bannerAd.onResize((size) => {
              if (!_bannerAd || !size) return;
              _bannerAd.style.left = Math.round((sys.width - size.width) / 2);
              _bannerAd.style.top = Math.max(0, sys.height - size.height - bottomInset - 4);
            });
          }
        }
        const p = _bannerAd.show();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch (e) {}
    }
  }

  function hideBannerAd() {
    if (_bannerAd) {
      try {
        _bannerAd.hide();
      } catch (e) {}
    }
  }

  /**
   * 抖音侧边栏 / 微信我的小程序每日复访灵蕴福利
   */
  function canClaimSidebarToday() {
    const key = SDK_CONFIG.sidebarReward.storageKeyPrefix + getTodayStr();
    return !Env.getStorage(key, false);
  }

  function navigateOrClaimSidebar(onRewarded, onTip) {
    if (!canClaimSidebarToday()) {
      onTip && onTip('今日复访仙缘灵蕴已领取，明日再来！');
      return;
    }

    // 抖音端：引导跳转侧边栏复访场景
    if (Env.isDouyin && !_launchedFromRevisitScene && typeof tt.navigateToScene === 'function') {
      tt.navigateToScene({
        scene: 'sidebar',
        success: () => {
          _launchedFromRevisitScene = true;
          onTip && onTip('已进入侧边栏场景，再次点击即可领取灵蕴！');
        },
        fail: () => {
          const key = SDK_CONFIG.sidebarReward.storageKeyPrefix + getTodayStr();
          Env.setStorage(key, true);
          onRewarded && onRewarded(SDK_CONFIG.sidebarReward.souls);
        }
      });
      return;
    }

    // 微信端：提示添加「我的小程序」并发放今日仙缘（若从我的小程序进入则直接双喜提示）
    if (Env.isWechat && !_launchedFromRevisitScene) {
      _launchedFromRevisitScene = true;
      const key = SDK_CONFIG.sidebarReward.storageKeyPrefix + getTodayStr();
      Env.setStorage(key, true);
      onRewarded && onRewarded(SDK_CONFIG.sidebarReward.souls);
      onTip && onTip(`已领 +${SDK_CONFIG.sidebarReward.souls} 灵蕴！点击右上角「···」添加我的小程序明日复访更便捷`);
      return;
    }

    const key = SDK_CONFIG.sidebarReward.storageKeyPrefix + getTodayStr();
    Env.setStorage(key, true);
    onRewarded && onRewarded(SDK_CONFIG.sidebarReward.souls);
  }

  /**
   * 游戏录屏与一键分享精彩高光（兼容抖音发视频 & 微信好友转发）
   */
  function startRecord(durationSec) {
    if (_recorder && !_isRecording) {
      try {
        _recorder.start({ duration: durationSec || 120 });
      } catch (e) {}
    } else {
      _isRecording = true;
      _recordStartTime = Date.now();
    }
  }

  function stopRecord() {
    if (_recorder && _isRecording) {
      try {
        _recorder.stop();
      } catch (e) {}
    } else {
      _isRecording = false;
    }
  }

  function shareGameOrVideo(onDone) {
    if (Env.isDouyin && typeof tt.shareAppMessage === 'function') {
      const hasValidVideo = _lastVideoPath && Date.now() - _recordStartTime >= 3000;
      const payload = hasValidVideo
        ? {
            channel: 'video',
            title: SDK_CONFIG.shareConfig.defaultTitle,
            extra: {
              videoPath: _lastVideoPath,
              videoTopics: SDK_CONFIG.shareConfig.topics
            },
            success: () => onDone && onDone(true, '录屏分享成功！'),
            fail: () => onDone && onDone(false, '已取消分享')
          }
        : {
            title: SDK_CONFIG.shareConfig.defaultTitle,
            imageUrl: SDK_CONFIG.shareConfig.imageUrl || undefined,
            success: () => onDone && onDone(true, '分享成功！'),
            fail: () => onDone && onDone(false, '已取消分享')
          };
      tt.shareAppMessage(payload);
      return;
    }

    if (Env.isWechat && typeof wx.shareAppMessage === 'function') {
      try {
        wx.shareAppMessage({
          title: SDK_CONFIG.shareConfig.defaultTitle,
          imageUrl: SDK_CONFIG.shareConfig.imageUrl || undefined
        });
        onDone && onDone(true, '已唤起微信好友转发面板！');
      } catch (e) {
        onDone && onDone(false, '分享唤起失败');
      }
      return;
    }

    onDone && onDone(true, '【模拟分享成功】已调用小程序跨端分享预留接口！');
  }

  /**
   * 埋点上报接口（自动适配抖音 reportAnalytics 与微信 reportEvent / reportAnalytics）
   */
  function trackEvent(eventName, data) {
    const payload = data || {};
    if (Env.isDouyin && typeof tt.reportAnalytics === 'function') {
      try {
        tt.reportAnalytics(eventName, payload);
      } catch (e) {}
    } else if (Env.isWechat) {
      try {
        if (typeof wx.reportEvent === 'function') {
          wx.reportEvent(eventName, payload);
        } else if (typeof wx.reportAnalytics === 'function') {
          wx.reportAnalytics(eventName, payload);
        }
      } catch (e) {}
    }
    if (typeof SDK_CONFIG.externalHooks.onTrackEvent === 'function') {
      try {
        SDK_CONFIG.externalHooks.onTrackEvent(eventName, payload);
      } catch (e) {}
    }
  }

  function notifyRunFinished(summary) {
    trackEvent('run_finished', summary);
    if (typeof SDK_CONFIG.externalHooks.onRunFinished === 'function') {
      try {
        SDK_CONFIG.externalHooks.onRunFinished(summary);
      } catch (e) {}
    }
  }

  return {
    mockAdState,
    init,
    showRewardedAd,
    watchAdToRevive,
    updateMockAd,
    closeMockAd,
    showInterstitialAd,
    showBannerAd,
    hideBannerAd,
    isSidebarSupported: () => _sidebarSupported,
    canClaimSidebarToday,
    navigateOrClaimSidebar,
    startRecord,
    stopRecord,
    isRecording: () => _isRecording,
    shareGameOrVideo,
    trackEvent,
    notifyRunFinished
  };
});
