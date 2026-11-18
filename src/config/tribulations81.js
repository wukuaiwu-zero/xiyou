/**
 * 《西游记》九九八十一难完整考据怪物库与九重劫域配置 (src/config/tribulations81.js)
 * 严格对应原著第九十九回观音菩萨难簿：第 1 难「金蝉遭贬」至第 81 难「通天河遇鼋湿经书」，
 * 共分九重西游大劫卷（九九八十一难，每卷九难），涵盖全部小妖、精英头目与守关大妖王！
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
})('tribulations81', function () {
  /**
   * 81 难逐难配置表
   * rank: 'mob' (巡山妖兵) | 'elite' (劫难头目) | 'boss' (守关大妖王)
   * chapter: 0 ~ 8 (对应九重西游大劫卷，每卷 9 难)
   */
  const TRIBULATIONS_81 = [
    // ==================== 第一卷：双叉黑风劫（第 1 ~ 9 难） ====================
    {
      no: 1, id: 'trib_01', chapter: 0, rank: 'elite',
      tribName: '金蝉遭贬', monsterName: '贬谪金甲天将', weapon: '斩仙台金戈',
      archetype: 'celestial_guard',
      palette: { G: '#ffd166', A: '#e09f3e', C: '#00f5d4', R: '#ef233c' },
      ai: 'heavy_cleave', color: '#ffd166',
      lore: '金蝉子轻慢佛法遭贬东土，灵山金甲神将镇守初劫试炼。'
    },
    {
      no: 2, id: 'trib_02', chapter: 0, rank: 'mob',
      tribName: '出胎几杀', monsterName: '水贼刘洪', weapon: '雁翎分水刀',
      archetype: 'bandit_raider',
      palette: { R: '#9d0208', B: '#1d3557', M: '#ced4da' },
      ai: 'melee_rush', color: '#d62828',
      lore: '洪江渡口劫船害命之凶徒，冒任江州州主。'
    },
    {
      no: 3, id: 'trib_03', chapter: 0, rank: 'mob',
      tribName: '满月抛江', monsterName: '洪江狂澜凶鳞', weapon: '分水骨叉',
      archetype: 'river_scale_fiend',
      palette: { T: '#0096c7', D: '#023e8a', C: '#90e0ef' },
      ai: 'leap_slash', color: '#0096c7',
      lore: '江流儿木板漂江时潜伏大江深处的狂暴水妖。'
    },
    {
      no: 4, id: 'trib_04', chapter: 0, rank: 'mob',
      tribName: '寻亲报冤', monsterName: '李彪恶衙卫', weapon: '鬼头环首刀',
      archetype: 'bandit_raider',
      palette: { R: '#ff5400', B: '#343a40', G: '#6f4518' },
      ai: 'melee_rush', color: '#ff5400',
      lore: '与刘洪同流合污的悍匪恶吏，刀法狠辣。'
    },
    {
      no: 5, id: 'trib_05', chapter: 0, rank: 'boss',
      tribName: '出城逢虎', monsterName: '寅将军 · 双叉虎王', weapon: '百炼虎牙大刀',
      archetype: 'yin_general',
      palette: { T: '#f77f00', Y: '#fcbf49', R: '#d62828' },
      patterns: ['spear_charge', 'black_wind_slam', 'fire_orbs'],
      color: '#f77f00', accent: '#fcbf49',
      lore: '双叉岭成精斑斓猛虎，唐王御弟西行出长安所遇第一尊妖王。'
    },
    {
      no: 6, id: 'trib_06', chapter: 0, rank: 'elite',
      tribName: '落坑折从', monsterName: '熊山君 · 特处士', weapon: '玄铁开山盾',
      archetype: 'shield_bear',
      palette: { D: '#3d405b', M: '#adb5bd', S: '#f4a261', G: '#ffd166' },
      ai: 'front_shield', color: '#3d405b',
      lore: '双叉岭黑熊精熊山君与野牛精特处士，铜皮铁骨正面格挡。'
    },
    {
      no: 7, id: 'trib_07', chapter: 0, rank: 'mob',
      tribName: '双叉岭上', monsterName: '双叉山魈猎手', weapon: '火羽猎弓',
      archetype: 'goblin_archer',
      palette: { G: '#4f772d', R: '#bc4749', Y: '#ffd166' },
      ai: 'ranged_arrow', color: '#4f772d',
      lore: '盘踞双叉岭丛林间的狼虫山魈弓手。'
    },
    {
      no: 8, id: 'trib_08', chapter: 0, rank: 'mob',
      tribName: '两界山头', monsterName: '两界山狂虎卫', weapon: '裂风双刃',
      archetype: 'tiger_blade',
      palette: { T: '#e76f51', A: '#2b2d42', S: '#ffd166' },
      ai: 'leap_slash', color: '#e76f51',
      lore: '五行山（两界山）山麓横行的凶猛虎妖。'
    },
    {
      no: 9, id: 'trib_09', chapter: 0, rank: 'elite',
      tribName: '陡涧换马', monsterName: '鹰愁涧金鳞水怪', weapon: '寒渊三叉戟',
      archetype: 'river_scale_fiend',
      palette: { T: '#00f5d4', D: '#0077b6', C: '#caf0f8', E: '#ffd60a' },
      ai: 'whirl_charge', color: '#00f5d4',
      lore: '蛇盘山鹰愁涧潜蛟水灵，惊扰白马之涧底霸主。'
    },

    // ==================== 第二卷：禅院黄风劫（第 10 ~ 18 难） ====================
    {
      no: 10, id: 'trib_10', chapter: 1, rank: 'mob',
      tribName: '夜被火烧', monsterName: '观音院广谋火僧', weapon: '引火松明炬',
      archetype: 'fire_monk',
      palette: { R: '#dc2f02', F: '#ff9f1c', G: '#495057' },
      ai: 'ranged_burst', color: '#ff9f1c',
      lore: '贪图锦襕袈裟献计纵火焚烧禅院之恶僧妖灵。'
    },
    {
      no: 11, id: 'trib_11', chapter: 1, rank: 'boss',
      tribName: '失却袈裟', monsterName: '黑风大王 · 熊罴精', weapon: '黑缨点钢枪',
      archetype: 'black_bear_king',
      palette: { D: '#22223b', B: '#343a40', R: '#ff4800', G: '#ffb703' },
      patterns: ['spear_charge', 'black_wind_slam', 'fire_orbs'],
      color: '#2b2d42', accent: '#ff5400',
      lore: '黑风山黑风洞主，趁火盗走锦襕袈裟欲办佛衣会，武艺堪敌大圣。'
    },
    {
      no: 12, id: 'trib_12', chapter: 1, rank: 'elite',
      tribName: '收降八戒', monsterName: '云栈猪刚鬣魔影', weapon: '九齿沁金耙影',
      archetype: 'wild_boar_brute',
      palette: { B: '#4a3525', P: '#e09f3e', R: '#ff0a54', D: '#1d3557' },
      ai: 'heavy_cleave', color: '#e09f3e',
      lore: '福陵山云栈洞未皈依前的狂暴猪妖残存魔念。'
    },
    {
      no: 13, id: 'trib_13', chapter: 1, rank: 'boss',
      tribName: '黄风怪阻', monsterName: '黄风大圣 · 貂鼠精', weapon: '三股钢叉·三昧神风',
      archetype: 'yellow_wind_sage',
      palette: { Y: '#e9c46a', G: '#f4a261', R: '#e76f51', D: '#582f0e' },
      patterns: ['samadhi_tornado', 'trident_dash', 'sand_barrage'],
      color: '#e9c46a', accent: '#f4a261',
      lore: '灵山脚下得道金毛貂鼠，一口三昧神风吹得天地无光。'
    },
    {
      no: 14, id: 'trib_14', chapter: 1, rank: 'elite',
      tribName: '请求灵吉', monsterName: '黄风岭虎先锋', weapon: '双口赤铜刀',
      archetype: 'tiger_blade',
      palette: { T: '#ff9f1c', A: '#582f0e', S: '#ffd60a', E: '#ff0a54' },
      ai: 'leap_slash', color: '#ff9f1c',
      lore: '黄风大王麾下头号猛将，曾用金蝉脱壳虎皮计摄走唐僧。'
    },
    {
      no: 15, id: 'trib_15', chapter: 1, rank: 'boss',
      tribName: '流沙难渡', monsterName: '流沙河卷帘魔影', weapon: '降妖玄水杖',
      archetype: 'liusha_demon',
      palette: { R: '#d62828', C: '#00b4d8', P: '#5a189a', G: '#ffd166' },
      patterns: ['trident_dash', 'soul_spiral', 'black_wind_slam'],
      color: '#0077b6', accent: '#00f5d4',
      lore: '八百里流沙河鹅毛不浮，深渊水煞凝结之狂澜妖尊。'
    },
    {
      no: 16, id: 'trib_16', chapter: 1, rank: 'mob',
      tribName: '收得沙僧', monsterName: '弱水漩涡水鬼', weapon: '骨刺水叉',
      archetype: 'shrimp_soldier',
      palette: { R: '#0077b6', L: '#48cae4', C: '#90e0ef' },
      ai: 'melee_rush', color: '#48cae4',
      lore: '游弋在流沙河底兴风作浪的凶恶水卒。'
    },
    {
      no: 17, id: 'trib_17', chapter: 1, rank: 'mob',
      tribName: '四圣显化', monsterName: '锦绣庄绣球幻灵', weapon: '珍珠彩绸刃',
      archetype: 'apricot_fairy',
      palette: { P: '#ffd166', R: '#f72585', W: '#ffffff', G: '#4cc9f0' },
      ai: 'teleport_mage', color: '#f72585',
      lore: '四圣试禅心化作富贵庄院中考验道心的幻象仙傀。'
    },
    {
      no: 18, id: 'trib_18', chapter: 1, rank: 'elite',
      tribName: '五庄观中', monsterName: '万寿山护丹道童', weapon: '阴阳拂尘剑',
      archetype: 'taoist_acolyte',
      palette: { Y: '#06d6a0', B: '#1b4332', C: '#80ffdb' },
      ai: 'ranged_burst', color: '#06d6a0',
      lore: '五庄观人参果园中守护先天灵根的道门剑傀。'
    },

    // ==================== 第三卷：白骨莲花劫（第 19 ~ 27 难） ====================
    {
      no: 19, id: 'trib_19', chapter: 2, rank: 'boss',
      tribName: '难活人参', monsterName: '乾坤袖镇观道尊傀', weapon: '七星紫金拂尘',
      archetype: 'wuzhuang_immortal',
      palette: { G: '#ffd166', C: '#06d6a0', B: '#1d3557', R: '#ef233c' },
      patterns: ['treasure_vortex', 'soul_spiral', 'phantom_blink'],
      color: '#06d6a0', accent: '#ffd166',
      lore: '人参果树震怒所化乾坤道法化身，袖里乾坤吸摄万物。'
    },
    {
      no: 20, id: 'trib_20', chapter: 2, rank: 'boss',
      tribName: '贬退心猿', monsterName: '白骨夫人 · 尸魔', weapon: '幽冥白骨爪',
      archetype: 'white_bone_lady',
      palette: { W: '#f8f9fa', C: '#80ffdb', P: '#7209b7', M: '#b5179e' },
      patterns: ['phantom_blink', 'bone_spikes', 'soul_spiral'],
      color: '#caf0f8', accent: '#b5179e',
      lore: '白虎岭千年粉骷髅，三变幻形离间师徒，诡谲莫测。'
    },
    {
      no: 21, id: 'trib_21', chapter: 2, rank: 'mob',
      tribName: '黑松林失散', monsterName: '黑松林枯木妖卒', weapon: '黑松毒刺',
      archetype: 'thorn_treant',
      palette: { G: '#1b4332', L: '#40916c', B: '#2b2d42', E: '#80ffdb' },
      ai: 'web_trap', color: '#40916c',
      lore: '碗子山黑松林中缠绕迷途行者的树魔。'
    },
    {
      no: 22, id: 'trib_22', chapter: 2, rank: 'mob',
      tribName: '宝象国捎书', monsterName: '波月洞巡山狼卒', weapon: '弯月猎刀',
      archetype: 'wolf_scout',
      palette: { G: '#4a4e69', L: '#9a8c98', R: '#ffb703', M: '#f77f00' },
      ai: 'melee_rush', color: '#9a8c98',
      lore: '碗子山波月洞黄袍怪麾下把守要道的妖兵。'
    },
    {
      no: 23, id: 'trib_23', chapter: 2, rank: 'boss',
      tribName: '金銮殿变虎', monsterName: '黄袍怪 · 奎木狼', weapon: '蘸钢大刀·舍利内丹',
      archetype: 'yellow_robe_demon',
      palette: { B: '#4ea8de', D: '#1d3557', Y: '#ffb703', G: '#ffd166' },
      patterns: ['spear_charge', 'fire_orbs', 'phantom_blink'],
      color: '#ffb703', accent: '#4ea8de',
      lore: '二十八宿奎木狼私下凡尘，金銮殿施咒将圣僧化作斑斓猛虎。'
    },
    {
      no: 24, id: 'trib_24', chapter: 2, rank: 'boss',
      tribName: '平顶山逢魔', monsterName: '金角大王', weapon: '紫金红葫芦·七星剑',
      archetype: 'gold_silver_horn',
      palette: { G: '#ffd60a', R: '#ef233c', P: '#5a189a', S: '#ffe5d9' },
      patterns: ['treasure_vortex', 'spear_charge', 'meteor_rain'],
      color: '#ffd60a', accent: '#ef233c',
      lore: '太上老君看金炉童子下界，手执紫金红葫芦唤名即吸，更可移三山压顶！'
    },
    {
      no: 25, id: 'trib_25', chapter: 2, rank: 'boss',
      tribName: '莲花洞高悬', monsterName: '银角大王', weapon: '羊脂玉净瓶·幌金绳',
      archetype: 'gold_silver_horn',
      palette: { G: '#e0fbfc', R: '#00bbf9', P: '#1d3557', S: '#caf0f8', D: '#03045e' },
      patterns: ['treasure_vortex', 'trident_dash', 'soul_spiral'],
      color: '#90e0ef', accent: '#00f5d4',
      lore: '莲花洞二大王，手持羊脂玉净瓶、芭蕉扇与幌金绳五大秘宝。'
    },
    {
      no: 26, id: 'trib_26', chapter: 2, rank: 'boss',
      tribName: '乌鸡国救主', monsterName: '乌鸡国青毛狮子王', weapon: '冷艳锯两刃刀',
      archetype: 'yin_general',
      palette: { T: '#00b4d8', Y: '#ffd166', R: '#ff0a54', D: '#3c096c' },
      patterns: ['bull_stampede', 'quake_cudgel', 'soul_spiral'],
      color: '#00b4d8', accent: '#ffd166',
      lore: '文殊菩萨座下青毛狮子，推真王落井、篡位三年反调风调雨顺。'
    },
    {
      no: 27, id: 'trib_27', chapter: 2, rank: 'elite',
      tribName: '被魔化身', monsterName: '压龙洞九尾狐姥', weapon: '幌金狐火珠',
      archetype: 'nine_tail_vixen',
      palette: { W: '#f8f9fa', P: '#9d4edd', M: '#5a189a', C: '#ff9f1c' },
      ai: 'teleport_mage', color: '#9d4edd',
      lore: '压龙山压龙洞九尾狐老奶奶，金角银角之干娘。'
    },

    // ==================== 第四卷：火云车迟劫（第 28 ~ 36 难） ====================
    {
      no: 28, id: 'trib_28', chapter: 3, rank: 'boss',
      tribName: '号山逢怪', monsterName: '圣婴大王 · 红孩儿', weapon: '丈八火尖枪·三昧真火',
      archetype: 'red_boy',
      palette: { R: '#ef233c', F: '#ff5400', Y: '#ffd60a', S: '#ffe5d9' },
      patterns: ['fire_orbs', 'meteor_rain', 'spear_charge'],
      color: '#ef233c', accent: '#ff5400',
      lore: '牛魔王与铁扇公主之子，火焰山苦修三百年三昧真火，连大圣亦遭火败。'
    },
    {
      no: 29, id: 'trib_29', chapter: 3, rank: 'mob',
      tribName: '风摄圣僧', monsterName: '火云洞急如火健将', weapon: '赤焰风火轮',
      archetype: 'flame_imp',
      palette: { Y: '#ffd60a', F: '#ff5400', R: '#d90429' },
      ai: 'whirl_charge', color: '#ff5400',
      lore: '红孩儿麾下云里雾、雾里云、急如火、快如风等六健将精锐。'
    },
    {
      no: 30, id: 'trib_30', chapter: 3, rank: 'elite',
      tribName: '心猿遭害', monsterName: '三昧炎烟火魔', weapon: '焚心真火球',
      archetype: 'flame_imp',
      palette: { Y: '#ffffff', F: '#ff0a54', R: '#7209b7' },
      ai: 'ranged_burst', color: '#ff0a54',
      lore: '枯松涧火云洞喷涌而出的紫赤毒烟真火魔灵。'
    },
    {
      no: 31, id: 'trib_31', chapter: 3, rank: 'mob',
      tribName: '请圣降妖', monsterName: '莲台三十六天罡刀灵', weapon: '天罡化刃',
      archetype: 'celestial_guard',
      palette: { G: '#80ffdb', A: '#06d6a0', C: '#ffd60a', R: '#00bbf9' },
      ai: 'leap_slash', color: '#06d6a0',
      lore: '观音菩萨借李靖天罡刀化作千叶莲台收伏圣婴之护法灵兵。'
    },
    {
      no: 32, id: 'trib_32', chapter: 3, rank: 'boss',
      tribName: '黑水河遇怪', monsterName: '黑水河鼍龙怪', weapon: '九节竹节钢鞭',
      archetype: 'tuolong_dragon',
      palette: { G: '#2d6a4f', L: '#52b788', Y: '#ffd166', R: '#ff0a54' },
      patterns: ['quake_cudgel', 'trident_dash', 'sand_barrage'],
      color: '#2d6a4f', accent: '#52b788',
      lore: '泾河龙王第九子鼍洁，霸占黑水河神府兴起黑浪摄走唐僧八戒。'
    },
    {
      no: 33, id: 'trib_33', chapter: 3, rank: 'mob',
      tribName: '搬运车迟', monsterName: '三清观监工恶道', weapon: '五雷引魂幡',
      archetype: 'taoist_acolyte',
      palette: { Y: '#ffba08', B: '#370617', C: '#e85d04' },
      ai: 'ranged_arrow', color: '#e85d04',
      lore: '车迟国驱役五百僧人拉车修观的霸道道众。'
    },
    {
      no: 34, id: 'trib_34', chapter: 3, rank: 'boss',
      tribName: '大赌输赢', monsterName: '车迟国 · 虎力大仙', weapon: '五雷杏黄法剑',
      archetype: 'chechi_immortal',
      palette: { Y: '#ffb703', G: '#ffd166', B: '#264653', R: '#e63946' },
      patterns: ['meteor_rain', 'fire_orbs', 'phantom_blink'],
      color: '#ffb703', accent: '#00f5d4',
      lore: '车迟国第一大国师，精通五雷祈雨、云梯显圣与砍头复生奇术。'
    },
    {
      no: 35, id: 'trib_35', chapter: 3, rank: 'elite',
      tribName: '祛道兴僧', monsterName: '鹿力大仙 · 羊力大仙', weapon: '冷龙冰火骨杖',
      archetype: 'chechi_immortal',
      palette: { Y: '#90e0ef', G: '#ffffff', B: '#3c096c', R: '#00f5d4', C: '#ff4d6d' },
      ai: 'teleport_mage', color: '#90e0ef',
      lore: '白鹿精与羚羊精所化二、三国师，善剖腹剜心与滚油锅冷龙秘法。'
    },
    {
      no: 36, id: 'trib_36', chapter: 3, rank: 'boss',
      tribName: '路逢大水', monsterName: '灵感大王 · 通天金鱼精', weapon: '九瓣赤铜锤',
      archetype: 'inspiration_king',
      palette: { R: '#f77f00', G: '#fcbf49', C: '#48cae4', D: '#9d0208' },
      patterns: ['quake_cudgel', 'bone_spikes', 'soul_spiral'],
      color: '#f77f00', accent: '#48cae4',
      lore: '观音莲花池金鱼走脱通天河，岁祭童男童女，一夜冰封八百里大河。'
    },

    // ==================== 第五卷：金兜火焰劫（第 37 ~ 45 难） ====================
    {
      no: 37, id: 'trib_37', chapter: 4, rank: 'elite',
      tribName: '身落天河', monsterName: '通天河斑衣鳜婆', weapon: '寒冰分水刺',
      archetype: 'fish_assassin',
      palette: { B: '#0077b6', G: '#48cae4', Y: '#ffd166' },
      ai: 'leap_slash', color: '#48cae4',
      lore: '灵感大王座下首席女军师，献计冰冻通天河诱陷唐僧。'
    },
    {
      no: 38, id: 'trib_38', chapter: 4, rank: 'mob',
      tribName: '鱼篮现身', monsterName: '通天河玄冰蟹将', weapon: '寒铁巨螯盾',
      archetype: 'crab_guardian',
      palette: { C: '#00b4d8', L: '#caf0f8', R: '#ff5400', D: '#03045e' },
      ai: 'front_shield', color: '#00b4d8',
      lore: '把守通天河水鼋之第的披甲巨蟹卫士。'
    },
    {
      no: 39, id: 'trib_39', chapter: 4, rank: 'boss',
      tribName: '金兜山遇怪', monsterName: '独角兕大王 · 青牛精', weapon: '太上金刚琢·点钢枪',
      archetype: 'single_horn_rhino',
      palette: { B: '#3d5a80', L: '#98c1d9', G: '#ffd60a', D: '#293241' },
      patterns: ['treasure_vortex', 'bull_stampede', 'quake_cudgel'],
      color: '#3d5a80', accent: '#ffd60a',
      lore: '太上老君坐骑板角青牛，手执金刚琢套尽漫天神佛兵刃水火！'
    },
    {
      no: 40, id: 'trib_40', chapter: 4, rank: 'mob',
      tribName: '普天神难伏', monsterName: '金兜洞持戟铁牛卫', weapon: '开山重铁盾',
      archetype: 'bull_guard',
      palette: { W: '#e0fbfc', R: '#3d5a80', D: '#1d3557', M: '#ffd60a', S: '#4ea8de' },
      ai: 'front_shield', color: '#3d5a80',
      lore: '金兜山金兜洞披挂重甲的独角牛妖精兵。'
    },
    {
      no: 41, id: 'trib_41', chapter: 4, rank: 'mob',
      tribName: '问佛根源', monsterName: '金沙幻灵罗汉影', weapon: '十八粒金丹砂',
      archetype: 'celestial_guard',
      palette: { G: '#ffb703', A: '#fb8500', C: '#ffffff', R: '#d62828' },
      ai: 'ranged_burst', color: '#ffb703',
      lore: '降龙伏虎罗汉撒金丹砂助战时激荡的金光战灵。'
    },
    {
      no: 42, id: 'trib_42', chapter: 4, rank: 'elite',
      tribName: '吃水遭毒', monsterName: '聚仙庵如意真仙', weapon: '如意金钩刃',
      archetype: 'chechi_immortal',
      palette: { Y: '#d62828', G: '#ffd166', B: '#370617', R: '#ff9f1c', C: '#ff4800' },
      ai: 'heavy_cleave', color: '#d62828',
      lore: '牛魔王之弟、红孩儿叔父，霸占解阳山落胎泉索要花红表礼。'
    },
    {
      no: 43, id: 'trib_43', chapter: 4, rank: 'mob',
      tribName: '西梁国留婚', monsterName: '西梁女国金钗卫', weapon: '飞凤连环刺',
      archetype: 'apricot_fairy',
      palette: { P: '#ff4d6d', R: '#c9184a', W: '#fff0f3', G: '#ffd60a' },
      ai: 'ranged_arrow', color: '#ff4d6d',
      lore: '西梁女国王城守护御苑之飒爽女武官。'
    },
    {
      no: 44, id: 'trib_44', chapter: 4, rank: 'boss',
      tribName: '琵琶洞受苦', monsterName: '琵琶洞毒敌蝎子精', weapon: '倒马毒桩·三股钢叉',
      archetype: 'scorpion_queen',
      palette: { P: '#9d4edd', M: '#e0aaff', R: '#ff0a54', G: '#ffd166' },
      patterns: ['scorpion_sting', 'phantom_blink', 'soul_spiral'],
      color: '#9d4edd', accent: '#ff0a54',
      lore: '雷音寺听经蜇伤如来左指之琵琶蝎女，尾上倒马毒桩连金刚不坏亦剧痛难当！'
    },
    {
      no: 45, id: 'trib_45', chapter: 4, rank: 'mob',
      tribName: '再贬心猿', monsterName: '杨家庄剪径草寇', weapon: '雁翅朴刀',
      archetype: 'bandit_raider',
      palette: { R: '#6a040f', B: '#22223b', G: '#99582a' },
      ai: 'melee_rush', color: '#e63946',
      lore: '拦路劫掠招致师徒生隙、再度贬走心猿之凶悍强盗。'
    },

    // ==================== 第六卷：真假雷音劫（第 46 ~ 54 难） ====================
    {
      no: 46, id: 'trib_46', chapter: 5, rank: 'boss',
      tribName: '难辨猕猴', monsterName: '六耳猕猴 · 假悟空', weapon: '随心铁杆兵',
      archetype: 'six_eared_macaque',
      palette: { P: '#7209b7', R: '#ff0a54', G: '#ffd60a', F: '#582f0e' },
      patterns: ['phantom_blink', 'spear_charge', 'quake_cudgel'],
      color: '#7209b7', accent: '#ff0a54',
      lore: '混世四猴之一，善聆音察理、知前后万物，与齐天大圣神通一般无二！'
    },
    {
      no: 47, id: 'trib_47', chapter: 5, rank: 'mob',
      tribName: '路阻火焰山', monsterName: '八百里火焰山炎灵', weapon: '熔岩爆炎珠',
      archetype: 'flame_imp',
      palette: { Y: '#ffba08', F: '#f48c06', R: '#dc2f02' },
      ai: 'ranged_burst', color: '#ffba08',
      lore: '八卦炉落砖化作八百里火焰山中肆虐不息的火精。'
    },
    {
      no: 48, id: 'trib_48', chapter: 5, rank: 'boss',
      tribName: '求取芭蕉扇', monsterName: '铁扇公主 · 罗刹女', weapon: '太阴芭蕉宝扇·青锋双剑',
      archetype: 'iron_fan_princess',
      palette: { R: '#d62828', G: '#06d6a0', L: '#80ffdb', Y: '#ffd166' },
      patterns: ['samadhi_tornado', 'spear_charge', 'sand_barrage'],
      color: '#06d6a0', accent: '#d62828',
      lore: '翠云山芭蕉洞主，手执混沌开辟灵宝芭蕉扇，一扇风生八万四千里！'
    },
    {
      no: 49, id: 'trib_49', chapter: 5, rank: 'boss',
      tribName: '收缚魔王', monsterName: '平天大圣 · 牛魔王', weapon: '混铁棍·法天象地',
      archetype: 'bull_demon_king',
      palette: { W: '#ffd166', R: '#9d0208', D: '#2b0909', G: '#ffba08', F: '#ff4800' },
      patterns: ['bull_stampede', 'quake_cudgel', 'meteor_rain'],
      color: '#9d0208', accent: '#ffba08',
      lore: '七大圣之首大力牛魔王，白牛法相顶天立地，力抗漫天佛兵天将！'
    },
    {
      no: 50, id: 'trib_50', chapter: 5, rank: 'elite',
      tribName: '赛城扫塔', monsterName: '奔波儿灞 · 灞波儿奔', weapon: '分水鲇须双刺',
      archetype: 'fish_assassin',
      palette: { B: '#2d6a4f', G: '#52b788', Y: '#ffba08' },
      ai: 'leap_slash', color: '#52b788',
      lore: '碧波潭鲇鱼怪与黑鱼精，巡守金光寺宝塔时被悟空捉住盘问出佛宝下落。'
    },
    {
      no: 51, id: 'trib_51', chapter: 5, rank: 'boss',
      tribName: '取宝救僧', monsterName: '九头虫 · 九头驸马', weapon: '月牙铲·九首血翼',
      archetype: 'nine_headed_bug',
      palette: { R: '#e63946', W: '#f8f9fa', M: '#adb5bd', D: '#1d3557', Y: '#ffd166' },
      patterns: ['fire_orbs', 'scorpion_sting', 'trident_dash'],
      color: '#e63946', accent: '#00f5d4',
      lore: '乱石山碧波潭万圣龙王赘婿，现本相九头血翼奇禽，盗取佛宝舍利。'
    },
    {
      no: 52, id: 'trib_52', chapter: 5, rank: 'elite',
      tribName: '棘林吟咏', monsterName: '荆棘岭十八公 · 杏仙', weapon: '盘根古松杖',
      archetype: 'thorn_treant',
      palette: { G: '#2d6a4f', L: '#ff8fa3', B: '#6f4518', E: '#ffd166' },
      ai: 'web_trap', color: '#52b788',
      lore: '木仙庵松柏桧竹四老树精与杏花仙子，月夜吟诗留客。'
    },
    {
      no: 53, id: 'trib_53', chapter: 5, rank: 'boss',
      tribName: '小雷音遇难', monsterName: '黄眉大王 · 小雷音老佛', weapon: '金铙·后天人种袋·短软狼牙棒',
      archetype: 'yellow_brow_king',
      palette: { Y: '#ffd60a', G: '#f4a261', R: '#d62828', P: '#7209b7' },
      patterns: ['treasure_vortex', 'quake_cudgel', 'meteor_rain'],
      color: '#ffd60a', accent: '#7209b7',
      lore: '东来佛祖司磬黄眉童儿，假设小雷音寺，金铙困大圣、人种袋收尽诸天星宿！'
    },
    {
      no: 54, id: 'trib_54', chapter: 5, rank: 'mob',
      tribName: '诸天神遭困', monsterName: '小雷音执袋魔卫', weapon: '铜钹重锤',
      archetype: 'bull_guard',
      palette: { W: '#ffd60a', R: '#7209b7', D: '#240046', M: '#ffba08', S: '#b5179e' },
      ai: 'front_shield', color: '#7209b7',
      lore: '小雷音寺伪装罗汉金刚的凶悍魔兵。'
    },

    // ==================== 第七卷：盘丝狮驼劫（第 55 ~ 63 难） ====================
    {
      no: 55, id: 'trib_55', chapter: 6, rank: 'boss',
      tribName: '稀柿同秽阻', monsterName: '七绝山红鳞大蟒', weapon: '双枪毒舌·血海缠卷',
      archetype: 'red_python_demon',
      palette: { R: '#d90429', L: '#ef233c', Y: '#ffd166', D: '#6a040f' },
      patterns: ['spear_charge', 'bone_spikes', 'fire_orbs'],
      color: '#d90429', accent: '#ffd166',
      lore: '七绝山驼罗庄成精红鳞巨蟒，双目如灯笼，吞食人畜无算。'
    },
    {
      no: 56, id: 'trib_56', chapter: 6, rank: 'mob',
      tribName: '朱紫国行医', monsterName: '麒麟山有来有去', weapon: '传令铜牌刀',
      archetype: 'lotus_imp',
      palette: { G: '#f4a261', D: '#99582a', Y: '#ffd166', R: '#7209b7' },
      ai: 'melee_rush', color: '#f4a261',
      lore: '赛太岁麾下赴朱紫国下战书的伶俐传令小妖。'
    },
    {
      no: 57, id: 'trib_57', chapter: 6, rank: 'boss',
      tribName: '拯救疲癃', monsterName: '赛太岁 · 金毛犼', weapon: '紫阳金铃·宣花大斧',
      archetype: 'sai_taisui',
      palette: { G: '#ffb703', Y: '#ffd60a', R: '#ff4800', P: '#7209b7' },
      patterns: ['nine_roar_stun', 'fire_orbs', 'bull_stampede'],
      color: '#ffb703', accent: '#ff4800',
      lore: '观音菩萨坐骑金毛犼，项下三枚紫金铃晃出三百丈红火、浓烟与毒沙！'
    },
    {
      no: 58, id: 'trib_58', chapter: 6, rank: 'mob',
      tribName: '降妖取后', monsterName: '獬豸洞毒沙炎妖', weapon: '飞沙火铳',
      archetype: 'goblin_archer',
      palette: { H: '#ff4800', G: '#9d0208', E: '#ffd60a', R: '#ffba08' },
      ai: 'ranged_burst', color: '#ff4800',
      lore: '麒麟山獬豸洞操控飞沙毒火的妖射手。'
    },
    {
      no: 59, id: 'trib_59', chapter: 6, rank: 'boss',
      tribName: '七情迷没', monsterName: '盘丝洞七蜘蛛精', weapon: '脐吐天罗情丝·双股剑',
      archetype: 'spider_matriarch',
      palette: { P: '#7209b7', M: '#f72585', W: '#f8f9fa', C: '#80ffdb' },
      patterns: ['bone_spikes', 'phantom_blink', 'soul_spiral'],
      color: '#f72585', accent: '#80ffdb',
      lore: '盘丝岭濯垢泉七位蜘蛛女妖，脐中喷出万道银丝结成漫天丝蓬！'
    },
    {
      no: 60, id: 'trib_60', chapter: 6, rank: 'boss',
      tribName: '多目遭伤', monsterName: '百眼魔君 · 多目蜈蚣精', weapon: '肋下千眼金光阵·百节剑',
      archetype: 'hundred_eyed_lord',
      palette: { R: '#9d0208', G: '#ffd60a', Y: '#ffba08', D: '#2b0909' },
      patterns: ['scorpion_sting', 'treasure_vortex', 'fire_orbs'],
      color: '#ffd60a', accent: '#ff0a54',
      lore: '黄花观道士真身七尺大蜈蚣，两肋下千只金眼齐放黄雾金光困锁大圣！'
    },
    {
      no: 61, id: 'trib_61', chapter: 6, rank: 'elite',
      tribName: '路阻狮驼', monsterName: '狮驼岭巡山小钻风', weapon: '巡山梆锣·腰刀',
      archetype: 'lotus_imp',
      palette: { G: '#4ea8de', D: '#1d3557', Y: '#ffd60a', R: '#ef233c' },
      ai: 'whirl_charge', color: '#4ea8de',
      lore: '八百里狮驼岭总钻风麾下巡山小妖，一句“大王叫我来巡山”传唱千古。'
    },
    {
      no: 62, id: 'trib_62', chapter: 6, rank: 'boss',
      tribName: '怪分三色', monsterName: '狮驼岭 · 青狮白象王', weapon: '吞天钢刀·卷云象鼻枪',
      archetype: 'white_elephant_king',
      palette: { W: '#f8f9fa', L: '#ced4da', G: '#ffd166', B: '#00b4d8', R: '#ff0a54' },
      patterns: ['bull_stampede', 'quake_cudgel', 'nine_roar_stun'],
      color: '#e0fbfc', accent: '#00b4d8',
      lore: '狮驼洞大大王一口曾吞十万天兵，二大王白象长鼻一卷万钧之力！'
    },
    {
      no: 63, id: 'trib_63', chapter: 6, rank: 'boss',
      tribName: '城里遇灾', monsterName: '云程万里 · 金翅大鹏雕', weapon: '方天画戟·阴阳二气瓶',
      archetype: 'golden_wing_peng',
      palette: { G: '#ffd60a', Y: '#f48c06', R: '#d90429', D: '#22223b' },
      patterns: ['scorpion_sting', 'treasure_vortex', 'samadhi_tornado'],
      color: '#ffd60a', accent: '#d90429',
      lore: '如来佛祖娘舅金翅大鹏，扇一翅九万里追上筋斗云，独占狮驼魔国！'
    },

    // ==================== 第八卷：比丘无底劫（第 64 ~ 72 难） ====================
    {
      no: 64, id: 'trib_64', chapter: 7, rank: 'mob',
      tribName: '请佛收魔', monsterName: '狮驼城狼牙魔将', weapon: '熟铁狼牙重棒',
      archetype: 'lion_roar_warrior',
      palette: { Y: '#e76f51', A: '#9d0208', M: '#ced4da', D: '#22223b' },
      ai: 'heavy_cleave', color: '#e76f51',
      lore: '狮驼城四万七千群魔中纪律严明的重装妖将。'
    },
    {
      no: 65, id: 'trib_65', chapter: 7, rank: 'boss',
      tribName: '比丘救子', monsterName: '比丘国 · 白鹿国丈', weapon: '蟠桃龙头寿杖',
      archetype: 'wuzhuang_immortal',
      palette: { G: '#ffffff', C: '#90e0ef', B: '#5a189a', S: '#ffe5d9', R: '#f72585' },
      patterns: ['soul_spiral', 'bone_spikes', 'phantom_blink'],
      color: '#90e0ef', accent: '#f72585',
      lore: '南极寿星座下白鹿私逃比丘国，蛊惑国王用一千一百一十一个小儿心肝做药引。'
    },
    {
      no: 66, id: 'trib_66', chapter: 7, rank: 'elite',
      tribName: '辨认真邪', monsterName: '清华洞白面狐美后', weapon: '迷魂胭脂珠',
      archetype: 'nine_tail_vixen',
      palette: { W: '#ffffff', P: '#ff4d6d', M: '#ff0a54', C: '#80ffdb' },
      ai: 'teleport_mage', color: '#ff4d6d',
      lore: '比丘国倾城妖后，与白鹿国丈狼狈为奸祸乱朝纲。'
    },
    {
      no: 67, id: 'trib_67', chapter: 7, rank: 'mob',
      tribName: '松林救怪', monsterName: '黑松林幻化缚树妖', weapon: '蚀骨暗影刺',
      archetype: 'rat_assassin',
      palette: { G: '#ced4da', P: '#ff4d6d', D: '#5a189a' },
      ai: 'leap_slash', color: '#c77dff',
      lore: '金鼻白毛鼠精于黑松林假扮落难女子诱骗唐僧慈悲之心。'
    },
    {
      no: 68, id: 'trib_68', chapter: 7, rank: 'mob',
      tribName: '僧房卧病', monsterName: '镇海寺吸元夜鼠妖', weapon: '幽夜分水刺',
      archetype: 'rat_assassin',
      palette: { G: '#6c757d', P: '#f72585', D: '#240046' },
      ai: 'poison_dart', color: '#f72585',
      lore: '潜伏镇海禅林夜半残害僧侣的无底洞鼠精侍女。'
    },
    {
      no: 69, id: 'trib_69', chapter: 7, rank: 'boss',
      tribName: '无底洞遭困', monsterName: '金鼻白毛老鼠精 · 地涌夫人', weapon: '绣鞋替身·双股寒光剑',
      archetype: 'jade_rabbit',
      palette: { W: '#f8f9fa', P: '#ffd60a', M: '#f72585', G: '#ffd166', C: '#ff4d6d', D: '#3c096c' },
      patterns: ['phantom_blink', 'scorpion_sting', 'soul_spiral'],
      color: '#f72585', accent: '#ffd60a',
      lore: '灵山偷食香花宝烛之半截观音，认托塔李天王做父，陷空山无底洞深达三百里！'
    },
    {
      no: 70, id: 'trib_70', chapter: 7, rank: 'mob',
      tribName: '灭法国难行', monsterName: '灭法国禁佛剃刀卫', weapon: '斩僧鬼头大刀',
      archetype: 'bandit_raider',
      palette: { R: '#ffba08', B: '#3c096c', M: '#ffffff' },
      ai: 'melee_rush', color: '#ffba08',
      lore: '灭法国许愿杀满一万僧人之巡城禁卫武士。'
    },
    {
      no: 71, id: 'trib_71', chapter: 7, rank: 'boss',
      tribName: '隐雾山遇魔', monsterName: '南山大王 · 艾叶花豹精', weapon: '点钢铁杵·分瓣梅花阵',
      archetype: 'yin_general',
      palette: { T: '#ffba08', Y: '#22223b', R: '#00f5d4', D: '#4a4e69' },
      patterns: ['phantom_blink', 'spear_charge', 'sand_barrage'],
      color: '#ffba08', accent: '#00f5d4',
      lore: '隐雾山折岳连环洞艾叶花皮豹子精，巧使分瓣梅花计调虎离山摄走唐僧。'
    },
    {
      no: 72, id: 'trib_72', chapter: 7, rank: 'mob',
      tribName: '凤仙郡求雨', monsterName: '凤仙郡赤地旱魃灵', weapon: '焦土赤炎弹',
      archetype: 'flame_imp',
      palette: { Y: '#ffe5d9', F: '#e85d04', R: '#9d0208' },
      ai: 'ranged_burst', color: '#e85d04',
      lore: '凤仙郡三年大旱米山面山未倒时游荡荒原的酷暑旱灵。'
    },

    // ==================== 第九卷：九灵凌云终劫（第 73 ~ 81 难） ====================
    {
      no: 73, id: 'trib_73', chapter: 8, rank: 'elite',
      tribName: '失落兵器', monsterName: '豹头山黄狮精', weapon: '四明铲',
      archetype: 'lion_roar_warrior',
      palette: { Y: '#ffd60a', A: '#f48c06', M: '#ffffff', D: '#3d405b' },
      ai: 'heavy_cleave', color: '#ffd60a',
      lore: '玉华州虎口洞黄狮精，偷走金箍棒、九齿钉钯与降妖宝杖欲办钉钯嘉会。'
    },
    {
      no: 74, id: 'trib_74', chapter: 8, rank: 'boss',
      tribName: '会庆钉钯', monsterName: '九灵元圣 · 九头狮祖', weapon: '九首衔拿神通·震彻三界吼',
      archetype: 'nine_spirit_saint',
      palette: { G: '#ffd166', C: '#00f5d4', P: '#5a189a', B: '#3c096c', Y: '#f4a261' },
      patterns: ['nine_roar_stun', 'bull_stampede', 'treasure_vortex'],
      color: '#00f5d4', accent: '#ffd166',
      lore: '太乙救苦天尊座下九头狮子，赤手空拳摇首一吼上通三圣下彻九泉，一口生擒众圣！'
    },
    {
      no: 75, id: 'trib_75', chapter: 8, rank: 'mob',
      tribName: '竹节山遭难', monsterName: '九曲盘桓洞狻猊狮卫', weapon: '赤铜开山钺',
      archetype: 'lion_roar_warrior',
      palette: { Y: '#48cae4', A: '#0077b6', M: '#ffd166', D: '#1d3557' },
      ai: 'leap_slash', color: '#48cae4',
      lore: '竹节山九灵元圣膝下猱狮、雪狮、狻猊、白泽、伏狸、抟象六狮群妖。'
    },
    {
      no: 76, id: 'trib_76', chapter: 8, rank: 'boss',
      tribName: '玄英洞受苦', monsterName: '玄英洞 · 辟寒辟暑辟尘三犀王', weapon: '寒冰宣花斧·玄天犀角',
      archetype: 'single_horn_rhino',
      palette: { B: '#00b4d8', L: '#caf0f8', G: '#80ffdb', D: '#03045e', R: '#ff0a54' },
      patterns: ['bull_stampede', 'bone_spikes', 'quake_cudgel'],
      color: '#00b4d8', accent: '#80ffdb',
      lore: '金平府青龙山玄英洞三尊千年犀牛精，假扮佛像偷食酥合香油，唯有四木禽星可降。'
    },
    {
      no: 77, id: 'trib_77', chapter: 8, rank: 'mob',
      tribName: '赶捉犀牛', monsterName: '青龙山铁甲犀牛卫', weapon: '寒铁棱盾',
      archetype: 'bull_guard',
      palette: { W: '#80ffdb', R: '#0077b6', D: '#03045e', M: '#90e0ef', S: '#00f5d4' },
      ai: 'front_shield', color: '#0077b6',
      lore: '追逃至西海龙宫仍负隅顽抗的玄英洞重甲牛卫。'
    },
    {
      no: 78, id: 'trib_78', chapter: 8, rank: 'boss',
      tribName: '天竺招婚', monsterName: '广寒捣药 · 天竺玉兔精', weapon: '短软捣药玉杵',
      archetype: 'jade_rabbit',
      palette: { W: '#ffffff', P: '#ff8fa3', M: '#ff4d6d', G: '#ffd166', C: '#80ffdb' },
      patterns: ['phantom_blink', 'meteor_rain', 'soul_spiral'],
      color: '#ff8fa3', accent: '#80ffdb',
      lore: '广寒宫嫦娥仙子捣药玉兔，摄藏天竺真公主抛绣球欲配唐僧元阳。'
    },
    {
      no: 79, id: 'trib_79', chapter: 8, rank: 'mob',
      tribName: '铜台府监禁', monsterName: '铜台府夜巡恶盗阴魂', weapon: '索命勾魂锁',
      archetype: 'ghost_caster',
      palette: { P: '#240046', C: '#ff4d6d', W: '#ffd166', M: '#9d0208' },
      ai: 'teleport_mage', color: '#ff4d6d',
      lore: '铜台府地灵县打劫寇洪招致唐僧师徒蒙冤入狱之凶寇怨灵。'
    },
    {
      no: 80, id: 'trib_80', chapter: 8, rank: 'elite',
      tribName: '凌云渡脱胎', monsterName: '凌云渡凡胎执念尸魔', weapon: '无底船断念镰',
      archetype: 'bone_reaper',
      palette: { W: '#caf0f8', G: '#48cae4', E: '#ffd60a', P: '#0077b6' },
      ai: 'heavy_cleave', color: '#48cae4',
      lore: '灵山脚下凌云仙渡独木桥下激湍中，褪去凡胎肉身所化最后一道心魔试炼！'
    },
    {
      no: 81, id: 'trib_81', chapter: 8, rank: 'boss',
      tribName: '通天河遇鼋湿经书', monsterName: '通天河 · 千年翻江老鼋', weapon: '九宫八卦巨甲·翻江海啸',
      archetype: 'ancient_turtle',
      palette: { G: '#2d6a4f', L: '#52b788', Y: '#ffd166', C: '#48cae4', W: '#ffffff' },
      patterns: ['quake_cudgel', 'bone_spikes', 'treasure_vortex'],
      color: '#2d6a4f', accent: '#48cae4',
      lore: '取经归途忘了替老鼋问佛祖寿年，老鼋淬水一沉凑满九九八十一难功德圆满！'
    }
  ];

  // 九重西游大劫卷元数据（用于关卡推进与八十一难图鉴分卷导航）
  const NINE_CHAPTERS = [
    {
      index: 0, id: 'ch1_shuangcha', shortName: '一卷·双叉涧',
      name: '第一卷 · 双叉鹰愁劫（第1~9难）',
      subtitle: '金蝉东渡 · 寅虎拦路 · 鹰愁涧收龙',
      skyTop: '#0d1b2a', skyBottom: '#1b263b', mountainFar: '#162438', mountainNear: '#2d4a43',
      tileTop: '#52b788', tileBody: '#2b2d42', tileBorder: '#74c69d', platformColor: '#7f4f24',
      hazardType: 'thorns', hazardColor: '#f77f00', ambientParticle: 'ember',
      roomWidthTiles: 116, enemyCount: 11, defaultBossId: 'trib_05'
    },
    {
      index: 1, id: 'ch2_heihuang', shortName: '二卷·黑黄风',
      name: '第二卷 · 黑风黄风劫（第10~18难）',
      subtitle: '禅院夜火 · 三昧狂沙 · 流沙五庄',
      skyTop: '#2b1912', skyBottom: '#5c3a21', mountainFar: '#432818', mountainNear: '#6f4518',
      tileTop: '#d4a373', tileBody: '#4a2c11', tileBorder: '#e9c46a', platformColor: '#99582a',
      hazardType: 'sand_spikes', hazardColor: '#f4a261', ambientParticle: 'sand',
      roomWidthTiles: 122, enemyCount: 12, defaultBossId: 'trib_13'
    },
    {
      index: 2, id: 'ch3_baigulianhua', shortName: '三卷·白骨莲',
      name: '第三卷 · 白骨莲花劫（第19~27难）',
      subtitle: '三打尸魔 · 奎狼变虎 · 金角银角',
      skyTop: '#0b0914', skyBottom: '#24153d', mountainFar: '#19122b', mountainNear: '#311e54',
      tileTop: '#7209b7', tileBody: '#1e1b2e', tileBorder: '#b5179e', platformColor: '#4a4e69',
      hazardType: 'bone_thorns', hazardColor: '#80ffdb', ambientParticle: 'wisp',
      roomWidthTiles: 126, enemyCount: 13, defaultBossId: 'trib_24'
    },
    {
      index: 3, id: 'ch4_huoyunchechi', shortName: '四卷·火云河',
      name: '第四卷 · 火云通天劫（第28~36难）',
      subtitle: '红孩真火 · 黑水鼍龙 · 车迟斗法',
      skyTop: '#240707', skyBottom: '#591616', mountainFar: '#3b0d11', mountainNear: '#6a1218',
      tileTop: '#f48c06', tileBody: '#2b1216', tileBorder: '#ffd60a', platformColor: '#7f4f24',
      hazardType: 'fire_spikes', hazardColor: '#ff5400', ambientParticle: 'ember',
      roomWidthTiles: 130, enemyCount: 14, defaultBossId: 'trib_28'
    },
    {
      index: 4, id: 'ch5_jindoupipa', shortName: '五卷·金兜蝎',
      name: '第五卷 · 金兜琵琶劫（第37~45难）',
      subtitle: '金刚琢套万兵 · 西梁女国 · 倒马毒桩',
      skyTop: '#101828', skyBottom: '#1d3557', mountainFar: '#162847', mountainNear: '#293241',
      tileTop: '#4ea8de', tileBody: '#1b263b', tileBorder: '#90e0ef', platformColor: '#5c4d7d',
      hazardType: 'ice_spikes', hazardColor: '#9d4edd', ambientParticle: 'wisp',
      roomWidthTiles: 132, enemyCount: 15, defaultBossId: 'trib_39'
    },
    {
      index: 5, id: 'ch6_huoyanleiyin', shortName: '六卷·火焰寺',
      name: '第六卷 · 真假雷音劫（第46~54难）',
      subtitle: '六耳争锋 · 芭蕉平天 · 黄眉伪佛',
      skyTop: '#1a0505', skyBottom: '#4a0e0e', mountainFar: '#370617', mountainNear: '#6a040f',
      tileTop: '#dc2f02', tileBody: '#240b0b', tileBorder: '#ffba08', platformColor: '#6a040f',
      hazardType: 'lava_pool', hazardColor: '#ffba08', ambientParticle: 'ember_heavy',
      roomWidthTiles: 136, enemyCount: 16, defaultBossId: 'trib_49'
    },
    {
      index: 6, id: 'ch7_pansishituo', shortName: '七卷·狮驼岭',
      name: '第七卷 · 盘丝狮驼劫（第55~63难）',
      subtitle: '金毛紫铃 · 盘丝百眼 · 狮驼三魔',
      skyTop: '#180a1c', skyBottom: '#3c1642', mountainFar: '#281030', mountainNear: '#4a1942',
      tileTop: '#f72585', tileBody: '#24142c', tileBorder: '#ffd60a', platformColor: '#5a189a',
      hazardType: 'venom_thorns', hazardColor: '#ffd60a', ambientParticle: 'wisp',
      roomWidthTiles: 140, enemyCount: 17, defaultBossId: 'trib_63'
    },
    {
      index: 7, id: 'ch8_wudiyinwu', shortName: '八卷·无底洞',
      name: '第八卷 · 比丘无底劫（第64~72难）',
      subtitle: '白鹿惑主 · 陷空无底 · 隐雾花豹',
      skyTop: '#090d16', skyBottom: '#1c2541', mountainFar: '#141b2d', mountainNear: '#2b2d42',
      tileTop: '#9d4edd', tileBody: '#161a2b', tileBorder: '#e0aaff', platformColor: '#4a4e69',
      hazardType: 'bone_thorns', hazardColor: '#f72585', ambientParticle: 'wisp',
      roomWidthTiles: 142, enemyCount: 17, defaultBossId: 'trib_69'
    },
    {
      index: 8, id: 'ch9_jiulinglingyun', shortName: '九卷·凌云渡',
      name: '第九卷 · 九灵凌云终劫（第73~81难）',
      subtitle: '九头狮圣 · 玄英玉兔 · 老鼋满八十一难',
      skyTop: '#081c24', skyBottom: '#133c55', mountainFar: '#0d2b3e', mountainNear: '#1b4965',
      tileTop: '#00f5d4', tileBody: '#132a38', tileBorder: '#ffd166', platformColor: '#2d6a4f',
      hazardType: 'wave_spikes', hazardColor: '#00f5d4', ambientParticle: 'wisp',
      roomWidthTiles: 146, enemyCount: 18, defaultBossId: 'trib_74'
    }
  ];

  // 为每条劫难自动推导标准数值曲线（兼顾平滑成长与流派差异）
  const AI_STATS_PRESET = {
    melee_rush:    { hp: 64,  atk: 15, speed: 120, width: 24, height: 30, range: 34,  cd: 1.25 },
    ranged_arrow:  { hp: 52,  atk: 16, speed: 80,  width: 22, height: 28, range: 235, cd: 1.8  },
    ranged_burst:  { hp: 68,  atk: 17, speed: 95,  width: 24, height: 28, range: 245, cd: 1.75 },
    front_shield:  { hp: 112, atk: 19, speed: 70,  width: 30, height: 34, range: 42,  cd: 1.55 },
    leap_slash:    { hp: 86,  atk: 19, speed: 136, width: 26, height: 32, range: 92,  cd: 1.45 },
    teleport_mage: { hp: 74,  atk: 18, speed: 88,  width: 24, height: 30, range: 240, cd: 1.95 },
    heavy_cleave:  { hp: 118, atk: 22, speed: 92,  width: 28, height: 35, range: 48,  cd: 1.55 },
    web_trap:      { hp: 78,  atk: 15, speed: 82,  width: 26, height: 30, range: 220, cd: 1.85 },
    poison_dart:   { hp: 66,  atk: 17, speed: 115, width: 24, height: 28, range: 230, cd: 1.6  },
    whirl_charge:  { hp: 92,  atk: 20, speed: 132, width: 26, height: 30, range: 115, cd: 1.5  }
  };

  const TRIBULATION_MAP = {};
  TRIBULATIONS_81.forEach((t) => {
    TRIBULATION_MAP[t.id] = t;
  });

  return {
    TRIBULATIONS_81,
    TRIBULATION_MAP,
    NINE_CHAPTERS,
    AI_STATS_PRESET
  };
});
