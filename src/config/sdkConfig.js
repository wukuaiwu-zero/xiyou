/**
 * 抖音小游戏 SDK 与预留商业化接口集中配置文件
 * 上线前只需将 enableMockAd 设为 false，并填入抖音开放平台后台申请的真实 adUnitId 即可。
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
})('sdkConfig', function () {
  const SDK_CONFIG = {
    // 游戏基础信息
    gameTitle: '西游破劫录',
    version: '1.0.0',

    // 是否启用模拟广告播放器（开发调试阶段建议为 true；真机提审/上线且填好真实广告位ID后设为 false）
    // 当不在抖音 tt 环境（如浏览器预览）时，会自动降级使用模拟广告弹窗以便完整测试复活流程
    enableMockAd: true,

    // 模拟激励视频倒计时秒数（测试用）
    mockAdDurationSec: 3,

    // 抖音开放平台申请的广告单元 ID（预留接口配置位）
    adUnitIds: {
      // 1. 核心：死亡看激励视频广告满血复活
      rewardedRevive: 'adunit-xiyou-revive-placeholder',
      // 2. 拓展：土地庙免费领取额外灵蕴/刷新天书卷轴
      rewardedBonusResource: 'adunit-xiyou-bonus-placeholder',
      // 3. 拓展：开局随机神兵法宝盲盒激励广告
      rewardedStarterWeapon: 'adunit-xiyou-weapon-placeholder',
      // 4. 拓展：章节通关插屏广告
      interstitialStageClear: 'adunit-xiyou-interstitial-placeholder',
      // 5. 拓展：结算页/主界面 Banner 广告
      bannerHome: 'adunit-xiyou-banner-placeholder'
    },

    // 微信公众平台（微信小游戏/小程序）申请的流量主广告单元 ID（未单独配置时自动回退读取 adUnitIds）
    wechatAdUnitIds: {
      rewardedRevive: 'adunit-wx-xiyou-revive-placeholder',
      rewardedBonusResource: 'adunit-wx-xiyou-bonus-placeholder',
      rewardedStarterWeapon: 'adunit-wx-xiyou-weapon-placeholder',
      interstitialStageClear: 'adunit-wx-xiyou-interstitial-placeholder',
      bannerHome: 'adunit-wx-xiyou-banner-placeholder'
    },

    // 跨端防误触与返回键「二次提醒」策略配置（Android / iOS / 微信小程序 / 抖音小程序）
    backGuard: {
      enableDoubleConfirm: true,       // 全局开启返回键/退出操作二次提醒确认
      doublePressWindowSec: 2.8,       // 二次按键确认有效时间窗（秒）
      antiJitterDebounceMs: 400,       // 屏蔽 Android 全面屏侧滑/物理键连发抖动冷却（毫秒）
      modalOpenProtectSec: 0.34,       // 弹窗刚呼出时的防连点误触保护期（秒）
      edgeSwipeGuardPx: 28,            // 左右边缘手势防误触安全内缩像素
      pauseOnBackground: true          // 切后台/来电/回微信消息时自动安全暂停战局
    },

    // 跨端系统稳帧与内存保护参数
    performance: {
      defaultQualityMode: 'auto',      // 'auto'(自动稳帧) | 'high'(高清画质) | 'smooth'(省电流畅)
      maxMobileDpr: 2.0,               // 移动端高分屏像素渲染倍率上限（兼顾锐度与防发热掉帧）
      lowEndMobileDpr: 1.5             // 低端 Android/小内存真机自动降级 DPR
    },

    // 复活机制参数配置
    reviveRules: {
      maxRevivesPerRun: 2,         // 单局最多允许看广告复活次数
      invincibleSeconds: 3.5,      // 复活后观音金身无敌时长（秒）
      healPercent: 1.0,            // 复活恢复血量比例（1.0 = 100%满血）
      shockwaveRadius: 210,        // 复活瞬间佛光震退清场半径（像素）
      shockwaveDamageRatio: 2.2,   // 复活冲击波基于角色攻击力的伤害倍率
      refillFlaskCharges: 1        // 复活额外补充甘露净瓶次数
    },

    // 抖音侧边栏复访有礼奖励（抖音小游戏必接能力预留）
    sidebarReward: {
      souls: 80,                   // 每日侧边栏进入奖励灵蕴数
      storageKeyPrefix: 'xiyou_sidebar_claimed_'
    },

    // 抖音分享文案与录屏话题配置
    shareConfig: {
      defaultTitle: '师徒五人勇闯像素黑风山！这手感也太丝滑了吧！',
      topics: ['西游破劫录', '像素肉鸽', '抖音小游戏', '死亡细胞风'],
      imageUrl: ''                 // 可填入自定义分享图 URL 或本地包内路径
    },

    // 本地存档 Key
    storageKey: 'xiyou_rogue_save_v1',

    // 外部业务服务器接口预留钩子（如需接入自研后端排行榜、云存档、防沉迷或埋点，可在此挂接回调）
    externalHooks: {
      /**
       * 广告播放完成发奖前回调（可在此做服务端签名校验）
       * @param {string} placement 广告位标识，如 'revive' | 'bonus_souls' | 'starter_weapon'
       * @returns {Promise<boolean>|boolean}
       */
      onBeforeGrantAdReward: null,

      /**
       * 玩家复活成功埋点回调
       * @param {{ characterId: string, stageIndex: number, reviveCount: number }} payload
       */
      onPlayerRevived: null,

      /**
       * 单局结算回调（可用于上传高分排行榜 / tt.setImRankData）
       * @param {{ victory: boolean, characterId: string, kills: number, stageIndex: number, soulsEarned: number }} summary
       */
      onRunFinished: null,

      /**
       * 自定义埋点上报钩子
       * @param {string} eventName
       * @param {Object} data
       */
      onTrackEvent: null
    }
  };

  return SDK_CONFIG;
});
