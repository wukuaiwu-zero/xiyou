# 九九八十一难像素贴图素材与自定义替换说明 (`assets/images/`)

本项目默认通过 [pixelSprites.js](../../src/assets/pixelSprites.js) 与 [monsters81Sprites.js](../../src/assets/monsters81Sprites.js) 在离屏 Canvas 上实时烘焙高清 2D 像素动画精灵（零网络依赖、包体极轻量，符合抖音小游戏首包秒开规范），同时已通过 [export-monsters81.js](../../scripts/export-monsters81.js) 预导出一整套标准透明 `.png` 贴图文件供查阅或二次编辑。

## 一、已生成的九九八十一难怪物素材目录

- **9×9 全八十一难总图集 (Sprite Atlas)**：[monsters_81_atlas.png](./monsters_81_atlas.png)（按第 1 难 ~ 第 81 难顺序排列，每格 `96×84`）
- **162 张逐难双帧透明 PNG**：`assets/images/monsters/trib_01_f0.png` ~ `trib_81_f1.png`（涵盖第 1 难「金蝉遭贬」至第 81 难「通天河遇鼋湿经书」全部守关妖王、劫难头目与巡山小妖的 `f0` / `f1` 动作帧）
- **完整坐标与属性索引表**：[manifest.json](./monsters/manifest.json)
- **浏览器动态预览图鉴页**：根目录双击打开 [monsters_81_gallery.html](../../monsters_81_gallery.html)（或游戏主界面点击右上角 **【📖八十一难谱】**）

重新导出 PNG 图集命令：
```bash
node scripts/export-monsters81.js
node scripts/export-equip-assets.js
```

## 二、已生成的 64 款神兵披挂与 16 种怪物素材目录

- **8×10 全装备与素材总图集 (Sprite Atlas)**：[equip_materials_atlas.png](./equip_materials_atlas.png)（共 80 格，每格 `80×80`，18×18 矩阵 + 16-Bit 微斜角体积光影烘焙）
- **64 张五大部位披挂透明 PNG**：`assets/images/equipment/*.png`（涵盖神兵 13 款、冠冕 13 款、宝甲 13 款、步履 12 款、灵饰 13 款及七大西游本命套装）
- **16 张四阶怪物掉落素材透明 PNG**：`assets/images/materials/*.png`（涵盖 T1 凡材、T2 灵材、T3 仙材、T4 妖王神材）
- **完整属性与锻造配方索引表**：[manifest.json](./equipment/manifest.json)
- **浏览器装备与素材交互图鉴页**：根目录双击打开 [equip_materials_gallery.html](../../equip_materials_gallery.html)

## 三、替换为外部美术自定义 `.png` 贴图

打开 [assetLoader.js](../../src/assets/assetLoader.js)，在 `CUSTOM_SPRITE_PATHS` 中填入映射路径即可自动覆盖任意角色或八十一难妖怪精灵：

```js
const CUSTOM_SPRITE_PATHS = {
  // 五大主角：wukong | tangseng | bajie | wujing | bailongma（帧名：idle | run0 | run1 | attack | flash）
  'hero:wukong:idle': 'assets/images/wukong_idle.png',

  // 九九八十一难任意妖怪/妖王：trib_01 ~ trib_81（帧名：f0 | f1 | flash）
  'boss:trib_28:f0': 'assets/images/monsters/trib_28_f0.png', // 第28难：圣婴大王·红孩儿
  'boss:trib_49:f0': 'assets/images/monsters/trib_49_f0.png', // 第49难：平天大圣·牛魔王
  'enemy:trib_61:f0': 'assets/images/monsters/trib_61_f0.png', // 第61难：狮驼岭小钻风

  // 64款披挂装备与16种怪物掉落素材自定义覆盖
  'equip:wpn_jingu_staff': 'assets/images/equipment/wpn_jingu_staff.png',
  'mat:mat_demon_core': 'assets/images/materials/mat_demon_core.png',

  // 场景道具：chestClosed | chestOpen | scroll | bun | gourd
  'prop:chestClosed': 'assets/images/chest_closed.png'
};
```
