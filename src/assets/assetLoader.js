/**
 * 素材资源加载与自定义 PNG 覆盖管理器 (src/assets/assetLoader.js)
 * 默认使用内置像素烘焙引擎直接生成全套高清像素精灵（开箱即玩，包体极小）；
 * 若开发者需要替换为外部美术 PNG 贴图，只需在 CUSTOM_SPRITE_PATHS 填入包内路径即可自动覆盖。
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
})('assetLoader', function (require) {
  const Env = require('../platform/env');
  const PixelSprites = require('./pixelSprites');
  let HeroModelEngine = null;
  try {
    HeroModelEngine = require('./heroModelEngine');
  } catch (e) {
    HeroModelEngine = null;
  }

  // 如需使用外部美术 PNG 替换内置像素图，在此填写相对路径（如 'assets/images/wukong_idle.png'）
  const CUSTOM_SPRITE_PATHS = {
    // 示例：
    // 'hero:wukong:idle': 'assets/images/wukong_idle.png',
    // 'hero:tangseng:idle': 'assets/images/tangseng_idle.png',
  };

  const _loadedCustomImages = {};
  const _tintCache = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  let _baked = null;

  function initAssets(onReady) {
    _baked = PixelSprites.buildAllSprites();
    const keys = Object.keys(CUSTOM_SPRITE_PATHS);
    if (keys.length === 0) {
      onReady && onReady();
      return;
    }

    let pending = keys.length;
    const doneOne = () => {
      pending--;
      if (pending <= 0 && onReady) onReady();
    };

    keys.forEach((key) => {
      const src = CUSTOM_SPRITE_PATHS[key];
      if (!src) {
        doneOne();
        return;
      }
      const img = Env.createImage();
      img.onload = () => {
        _loadedCustomImages[key] = img;
        doneOne();
      };
      img.onerror = () => {
        doneOne();
      };
      img.src = src;
    });
  }

  function getHeroSprite(heroId, frameName) {
    const custom = _loadedCustomImages[`hero:${heroId}:${frameName}`];
    if (custom) return custom;
    if (!_baked) _baked = PixelSprites.buildAllSprites();
    const h = _baked.heroes[heroId] || _baked.heroes.wukong;
    return h[frameName] || h.idle;
  }

  function getHeroHiResSprite(heroId, frameName) {
    const custom = _loadedCustomImages[`hero:${heroId}:${frameName}`];
    if (custom) return custom;
    if (!_baked) _baked = PixelSprites.buildAllSprites();
    const h = (_baked.heroesHiRes && _baked.heroesHiRes[heroId]) || _baked.heroes[heroId] || _baked.heroes.wukong;
    return h[frameName] || h.idle;
  }

  function getCompositeHeroSprite(heroId, equipped, frameName, hiRes) {
    const custom = _loadedCustomImages[`hero:${heroId}:${frameName}`];
    if (custom) return custom;
    if (HeroModelEngine && HeroModelEngine.getCompositeHeroSet) {
      const set = HeroModelEngine.getCompositeHeroSet(heroId, equipped || null, !!hiRes);
      return set[frameName] || set.idle0;
    }
    return hiRes ? getHeroHiResSprite(heroId, frameName) : getHeroSprite(heroId, frameName);
  }

  function renderHeroPaperDoll(ctx, opts) {
    if (HeroModelEngine && HeroModelEngine.renderHeroPaperDoll) {
      HeroModelEngine.renderHeroPaperDoll(ctx, opts);
      return true;
    }
    return false;
  }

  function getPreviewOutfitSets() {
    if (HeroModelEngine && HeroModelEngine.PREVIEW_OUTFIT_SETS) {
      return HeroModelEngine.PREVIEW_OUTFIT_SETS;
    }
    return [{ id: 'default', label: '本命原装', equipped: null }];
  }

  function getEnemySprite(enemyId, frameName) {
    const custom = _loadedCustomImages[`enemy:${enemyId}:${frameName}`];
    if (custom) return custom;
    if (!_baked) _baked = PixelSprites.buildAllSprites();
    const e = _baked.enemies[enemyId] || _baked.enemies.wolf_scout;
    return e[frameName] || e.f0;
  }

  function getBossSprite(bossId, frameName) {
    const custom = _loadedCustomImages[`boss:${bossId}:${frameName}`];
    if (custom) return custom;
    if (!_baked) _baked = PixelSprites.buildAllSprites();
    const b = _baked.bosses[bossId] || _baked.enemies[bossId] || _baked.bosses.black_bear_king;
    return b[frameName] || b.f0;
  }

  function getMonsterHiResSprite(monsterId, frameName) {
    const custom = _loadedCustomImages[`monster:${monsterId}:${frameName}`];
    if (custom) return custom;
    if (!_baked) _baked = PixelSprites.buildAllSprites();
    const m =
      (_baked.monstersHiRes && _baked.monstersHiRes[monsterId]) ||
      _baked.bosses[monsterId] ||
      _baked.enemies[monsterId] ||
      _baked.enemies.wolf_scout;
    return m[frameName] || m.f0;
  }

  function getPropSprite(propName) {
    const custom = _loadedCustomImages[`prop:${propName}`];
    if (custom) return custom;
    if (!_baked) _baked = PixelSprites.buildAllSprites();
    return _baked.props[propName];
  }

  function getEquipSprite(iconKey, hiRes) {
    const custom = _loadedCustomImages[`equip:${iconKey}`];
    if (custom) return custom;
    if (!_baked) _baked = PixelSprites.buildAllSprites();
    const map = hiRes ? _baked.equipsHiRes : _baked.equips;
    return (map && map[iconKey]) || (_baked.equips && _baked.equips.wpn_sabre);
  }

  function getMaterialSprite(iconKey, hiRes) {
    const custom = _loadedCustomImages[`mat:${iconKey}`];
    if (custom) return custom;
    if (!_baked) _baked = PixelSprites.buildAllSprites();
    const map = hiRes ? _baked.materialsHiRes : _baked.materials;
    return (map && map[iconKey]) || (_baked.materials && _baked.materials.mat_bone) || null;
  }

  function getVfxSprite(vfxKey) {
    const custom = _loadedCustomImages[`vfx:${vfxKey}`];
    if (custom) return custom;
    if (!_baked) _baked = PixelSprites.buildAllSprites();
    return _baked.vfx ? _baked.vfx[vfxKey] || null : null;
  }

  function getTintedSprite(baseCanvas, tintColor, mode) {
    if (!baseCanvas || !PixelSprites.bakeTintedSprite) return baseCanvas;
    const key = `${mode || 'overlay'}:${tintColor || '#ffffff'}`;
    if (_tintCache) {
      let sub = _tintCache.get(baseCanvas);
      if (!sub) {
        sub = {};
        _tintCache.set(baseCanvas, sub);
      }
      if (!sub[key]) {
        sub[key] = PixelSprites.bakeTintedSprite(baseCanvas, tintColor, mode || 'overlay');
      }
      return sub[key];
    }
    return PixelSprites.bakeTintedSprite(baseCanvas, tintColor, mode || 'overlay');
  }

  return {
    CUSTOM_SPRITE_PATHS,
    initAssets,
    getHeroSprite,
    getHeroHiResSprite,
    getCompositeHeroSprite,
    renderHeroPaperDoll,
    getPreviewOutfitSets,
    getEnemySprite,
    getBossSprite,
    getMonsterHiResSprite,
    getPropSprite,
    getEquipSprite,
    getMaterialSprite,
    getVfxSprite,
    getTintedSprite
  };
});
