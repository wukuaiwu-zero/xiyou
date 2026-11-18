/**
 * 抖音小游戏 & 微信小游戏双端官方根入口文件 (game.js)
 * 使用【抖音开发者工具】或【微信开发者工具】导入本项目目录即可直接编译运行与真机预览。
 */
const { GameApp } = require('./src/core/gameApp');
require('./src/core/curveDirector');
require('./src/core/equipForgeDirector');
require('./src/core/actionMovesetDirector');
require('./src/ui/cutsceneDirector');
require('./src/platform/systemOptimizer');

const app = new GameApp();
app.boot();

// 暴露全局实例便于在抖音开发者工具 Console 中调试接口
if (typeof globalThis !== 'undefined') {
  globalThis.__xiyouGame = app;
}
