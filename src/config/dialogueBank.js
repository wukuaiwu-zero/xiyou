/**
 * 《西游破劫录》角色台词库、八十一难妖王叫阵词与「20局零重复」叙事抽牌引擎
 * (src/config/dialogueBank.js)
 *
 * 设计准则：
 * 1. 【克制精炼 · 拒绝注水】：不堆砌臃肿废话，每句台词控制在 18~38 字黄金阅读长度，适配快节奏横版肉鸽。
 * 2. 【深度贴合角色与原著】：五师徒严守《西游记》原著灵魂与本作神通/法相/兵刃机制，绝不脸谱化与串味。
 * 3. 【20局100%零重复保证】：无论是五角色轮换游玩20局，还是单推同一角色连打20局（含80场Boss交锋），
 *    依托「三级因果优先级匹配 + 全局持久化不放回牌库 (seenLineIds)」，确保20局内台词绝不重复！
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
})('dialogueBank', function () {
  // ============================================================================
  // 一、五位西游主角演出声纹、入场分镜与印章配置
  // ============================================================================
  const HERO_PROFILES = {
    wukong: {
      id: 'wukong',
      name: '孙悟空',
      title: '齐天大圣',
      seal: '齐天',
      entranceStyle: 'somersault_cloud', // 筋斗云俯冲震棒 + 双雉鸡翎扬起
      themeColor: '#ffaa22',
      accentColor: '#ff3b30',
      inkBg: '#261419',
      voice: { wave: 'square', baseFreq: 420, jitter: 90, dur: 0.034, interval: 0.052 }
    },
    tangseng: {
      id: 'tangseng',
      name: '唐僧',
      title: '玄奘圣僧',
      seal: '玄奘',
      entranceStyle: 'lotus_dharma', // 九品金莲法阵凝现 + 九环锡杖梵音
      themeColor: '#ffd966',
      accentColor: '#ff5e57',
      inkBg: '#241b14',
      voice: { wave: 'sine', baseFreq: 292, jitter: 34, dur: 0.044, interval: 0.058 }
    },
    bajie: {
      id: 'bajie',
      name: '猪八戒',
      title: '天蓬元帅',
      seal: '天蓬',
      entranceStyle: 'rake_whirl', // 旋风钉钯跃落震石 + 豪迈扛耙
      themeColor: '#7be495',
      accentColor: '#ff9f7f',
      inkBg: '#16241c',
      voice: { wave: 'sawtooth', baseFreq: 168, jitter: 42, dur: 0.042, interval: 0.056 }
    },
    wujing: {
      id: 'wujing',
      name: '沙悟净',
      title: '卷帘大将',
      seal: '卷帘',
      entranceStyle: 'quicksand_vortex', // 流沙弱水寒渊升起 + 宝杖横扫迷雾
      themeColor: '#6cd4ff',
      accentColor: '#b388ff',
      inkBg: '#121d2b',
      voice: { wave: 'triangle', baseFreq: 146, jitter: 24, dur: 0.046, interval: 0.060 }
    },
    bailongma: {
      id: 'bailongma',
      name: '白龙马',
      title: '西海龙太子·敖烈',
      seal: '敖烈',
      entranceStyle: 'dragon_lightning', // 银白真龙雷霆贯空化形 + 枪尖电弧
      themeColor: '#e0f7ff',
      accentColor: '#00e5ff',
      inkBg: '#10212b',
      voice: { wave: 'triangle', baseFreq: 515, jitter: 88, dur: 0.032, interval: 0.050 }
    }
  };

  // ============================================================================
  // 二、【破劫序章 · 灵山碎卷】四幕电影级开场过场动画剧本
  // ============================================================================
  const PROLOGUE_SCENES = [
    {
      id: 'pro_shot_1',
      shotType: 'scroll_shatter',
      chapterTag: '壹 · 难簿崩摧',
      duration: 4.2,
      caption: '九九归真之夜，灵山《八十一难因果簿》突遭劫雷劈碎，化作残页散落四洲。',
      subCaption: '昔日伏诛的诸天妖魔借残卷执念重塑凶身，十万八千里西行路沦为无尽杀劫。'
    },
    {
      id: 'pro_shot_2',
      shotType: 'demons_awaken',
      chapterTag: '贰 · 百魔重踞',
      duration: 4.0,
      caption: '黑风夜火再燃，黄风狂沙蔽日，白骨森森筑冢，狮驼万妖齐啸。',
      subCaption: '天机混沌，漫天神佛闭门不言——这一遭，再无救兵可请，唯有凭手中兵刃破局！'
    },
    {
      id: 'pro_shot_3',
      shotType: 'pilgrims_assemble',
      chapterTag: '叁 · 五圣临渊',
      duration: 5.2,
      caption: '断崖残卷之前，五道身影自祥云风雷中踏出，各执本命神兵共赴劫海——',
      heroVows: [
        { charId: 'wukong', text: '“难簿碎了倒痛快！这一回不求谁人勾笔，俺老孙一棒敲穿这八十一重天！”' },
        { charId: 'tangseng', text: '“若慈悲渡不得碎卷恶障，贫僧便执九环锡杖，亲入劫火替众生蹚路。”' },
        { charId: 'bajie', text: '“散伙的话先咽回肚里——敢动咱们取经的功果，先问过老猪这九齿沁金钯！”' },
        { charId: 'wujing', text: '“流沙寒渊尚且不惧，何况旧魔残影？沙僧愿执宝杖，镇守师门寸步不退。”' },
        { charId: 'bailongma', text: '“卸下凡鞍重披龙鳞，十万八千里风雷，且看我西海银枪破开迷障！”' }
      ]
    },
    {
      id: 'pro_shot_4',
      shotType: 'cinnabar_vow',
      chapterTag: '肆 · 执兵破劫',
      duration: 3.2,
      caption: '踏遍十二秘境，斩尽宿命妖王——重走西行，此刻破劫！',
      subCaption: '【提示】点击任意处可推进分镜，右上角可随时切换「标准电影过场 / 极速行军模式」'
    }
  ];

  // ============================================================================
  // 三、师徒隔空传音双人小剧场（共 45 组，覆盖全部 10 对师徒关系组合）
  // 触发机制：仅当玩家操控其中一位角色踏入新劫/奇遇后非阻塞浮现，绝不锁操作！
  // ============================================================================
  const PILGRIM_DUO_BANTERS = [
    // 1. 悟空 & 唐僧 (5组)
    { id: 'duo_wk_ts_1', chars: ['wukong', 'tangseng'], lines: [
      { speaker: 'tangseng', text: '悟空，前路妖氛颇重，切莫只顾贪打忘了护持己身。' },
      { speaker: 'wukong', text: '师父放心！只要您老人家别乱念那紧箍咒，百十个妖王也不够俺老孙热身！' }
    ]},
    { id: 'duo_wk_ts_2', chars: ['wukong', 'tangseng'], lines: [
      { speaker: 'wukong', text: '嘿，师父，这回进残卷您也拎上锡杖了，打起妖怪来倒比俺还狠三分！' },
      { speaker: 'tangseng', text: '阿弥陀佛……昔年肉眼凡胎累你受屈，如今贫僧自当与徒儿并肩破障。' }
    ]},
    { id: 'duo_wk_ts_3', chars: ['wukong', 'tangseng'], lines: [
      { speaker: 'tangseng', text: '这残卷天地似曾相识，恰似当年两界山初揭金字压帖之时。' },
      { speaker: 'wukong', text: '五百年铜汁铁丸俺都没皱眉，今日重走一遭，定叫诸佛看看咱师徒的真本事！' }
    ]},
    { id: 'duo_wk_ts_4', chars: ['wukong', 'tangseng'], lines: [
      { speaker: 'wukong', text: '前头倘若又有荒山村姑提篮送斋，师父可莫再轻易动那善心了！' },
      { speaker: 'tangseng', text: '白虎岭之失，贫僧铭记五内。真幻邪正，今番定不再教心猿蒙冤。' }
    ]},
    { id: 'duo_wk_ts_5', chars: ['wukong', 'tangseng'], lines: [
      { speaker: 'tangseng', text: '金箍本为束心，如今你心猿早定，何不求菩萨早日褪去？' },
      { speaker: 'wukong', text: '急甚么！等把这碎卷里的妖魔全敲趴下，这金箍给俺当个束发金环也威风！' }
    ]},

    // 2. 悟空 & 八戒 (5组)
    { id: 'duo_wk_bj_1', chars: ['wukong', 'bajie'], lines: [
      { speaker: 'bajie', text: '猴哥，前头妖气冲天，要不咱绕道找个土地庙先讨顿斋饭垫垫？' },
      { speaker: 'wukong', text: '呆子少耍滑头！等敲翻了前头守关的老妖，洞里蒸笼肉包管够你塞牙缝！' }
    ]},
    { id: 'duo_wk_bj_2', chars: ['wukong', 'bajie'], lines: [
      { speaker: 'wukong', text: '呆子，你那九齿钉钯莫光留着筑地种菜，亮出你天蓬元帅的劲道来！' },
      { speaker: 'bajie', text: '哼哼，瞧好吧弼马温！老猪这旋风钯转起来，连南天门柱子都给你刨出火星！' }
    ]},
    { id: 'duo_wk_bj_3', chars: ['wukong', 'bajie'], lines: [
      { speaker: 'bajie', text: '我说猴哥，这残卷爆出来的金铢，打完能不能分老猪三成攒私房？' },
      { speaker: 'wukong', text: '上回你在平顶山藏耳朵眼里的四两银子还没充公呢，少打歪主意！' }
    ]},
    { id: 'duo_wk_bj_4', chars: ['wukong', 'bajie'], lines: [
      { speaker: 'wukong', text: '好你个呆子，方才隔着水幕瞧见女妖精，眼珠子又快黏上去了？' },
      { speaker: 'bajie', text: '胡扯！老猪那是在用天罡法眼瞧她破绽——不信你看我这一钯拍不拍她！' }
    ]},
    { id: 'duo_wk_bj_5', chars: ['wukong', 'bajie'], lines: [
      { speaker: 'bajie', text: '说真的猴哥，真要哪天碎卷修好了，你还回你的花果山快活不？' },
      { speaker: 'wukong', text: '自然要回！到时候请你这呆子来水帘洞喝猴儿酒，管饱不收银子！' }
    ]},

    // 3. 悟空 & 悟净 (5组)
    { id: 'duo_wk_wj_1', chars: ['wukong', 'wujing'], lines: [
      { speaker: 'wujing', text: '大师兄尽管往前冲杀，侧翼暗箭与漏网小妖，交由沙僧流沙阵拦下。' },
      { speaker: 'wukong', text: '痛快！有沙师弟替俺老孙压阵，这金箍棒使得更没顾忌了！' }
    ]},
    { id: 'duo_wk_wj_2', chars: ['wukong', 'wujing'], lines: [
      { speaker: 'wukong', text: '沙师弟，当年在流沙河底咱俩没打透，还是岸上这群妖王经揍些！' },
      { speaker: 'wujing', text: '水底你嫌水深，岸上某却正好施展这五千零四十八斤的梭罗宝杖。' }
    ]},
    { id: 'duo_wk_wj_3', chars: ['wukong', 'wujing'], lines: [
      { speaker: 'wujing', text: '这些下界妖邪多携天庭旧宝，大师兄交手时还须提防套兵法器。' },
      { speaker: 'wukong', text: '怕他怎的！套得走兵刃，套不走俺老孙翻身绕后的拳脚金睛！' }
    ]},
    { id: 'duo_wk_wj_4', chars: ['wukong', 'wujing'], lines: [
      { speaker: 'wukong', text: '你在灵霄殿当过差，瞧瞧这难簿崩碎，像不像那帮老神仙暗地搞鬼？' },
      { speaker: 'wujing', text: '天威难测。但无论谁人执棋，先将眼前拦路之棋子尽数扫平便是。' }
    ]},
    { id: 'duo_wk_wj_5', chars: ['wukong', 'wujing'], lines: [
      { speaker: 'wujing', text: '前路持盾重甲妖卫甚多，正面硬撼极耗气力。' },
      { speaker: 'wukong', text: '正合俺意！一个筋斗翻到他脊梁骨后头，留下毫毛金身炸他个人仰马翻！' }
    ]},

    // 4. 悟空 & 白龙马 (5组)
    { id: 'duo_wk_bl_1', chars: ['wukong', 'bailongma'], lines: [
      { speaker: 'wukong', text: '好小子！化回龙太子拎起银枪，这身雷火蹿得快赶上俺的筋斗云了！' },
      { speaker: 'bailongma', text: '大圣谬赞。驮经万里蓄势已久，今日总算能痛快出枪了。' }
    ]},
    { id: 'duo_wk_bl_2', chars: ['wukong', 'bailongma'], lines: [
      { speaker: 'bailongma', text: '当年鹰愁涧底莽撞吞马，多谢大圣未下死手，留我一条西行正路。' },
      { speaker: 'wukong', text: '嗨，提那陈年老皇历作甚！四海龙家数你小子最有血性，并肩杀出去！' }
    ]},
    { id: 'duo_wk_bl_3', chars: ['wukong', 'bailongma'], lines: [
      { speaker: 'wukong', text: '小白龙，前头风高涧阔，正好显显你踏云三段跳的独门身法！' },
      { speaker: 'bailongma', text: '断崖绝壑于真龙如履平地，定不教一只飞妖越过雷池！' }
    ]},
    { id: 'duo_wk_bl_4', chars: ['wukong', 'bailongma'], lines: [
      { speaker: 'bailongma', text: '大圣昔年去东海龙宫讨棒，我父王与伯父至今提起仍心有余悸。' },
      { speaker: 'wukong', text: '哈哈哈！老龙王小气，哪像你这小老弟敞亮！回头给你寻颗好宝珠镶枪缨！' }
    ]},
    { id: 'duo_wk_bl_5', chars: ['wukong', 'bailongma'], lines: [
      { speaker: 'wukong', text: '瞧见天边那道紫电没？跟你的白龙吟雷枪倒是一个路数！' },
      { speaker: 'bailongma', text: '凡劫雷罚也敢班门弄斧？待我引雷入枪，还敬这漫天群魔！' }
    ]},

    // 5. 唐僧 & 八戒 (5组)
    { id: 'duo_ts_bj_1', chars: ['tangseng', 'bajie'], lines: [
      { speaker: 'bajie', text: '师父啊，这残卷一劫接一劫的，啥时候是个头？老猪肚皮都贴后背啦！' },
      { speaker: 'tangseng', text: '八戒莫急，方才见你战中连吞三个大肉包，气血比为师还要旺盛几分。' }
    ]},
    { id: 'duo_ts_bj_2', chars: ['tangseng', 'bajie'], lines: [
      { speaker: 'tangseng', text: '八戒，你虽常嘴上念叨高老庄，每逢凶险却总以厚背替为师挡下暗算。' },
      { speaker: 'bajie', text: '嘿嘿，老猪皮糙肉厚耐捶嘛！师父您站稳金莲阵，脏活累活看我的钉钯！' }
    ]},
    { id: 'duo_ts_bj_3', chars: ['tangseng', 'bajie'], lines: [
      { speaker: 'bajie', text: '师父，这回倘若再遇上四圣试禅心那种招赘庄院，老猪绝不抢着留下来！' },
      { speaker: 'tangseng', text: '吃过松树绷吊一宿的苦头，总算长了几分定力，善哉善哉。' }
    ]},
    { id: 'duo_ts_bj_4', chars: ['tangseng', 'bajie'], lines: [
      { speaker: 'tangseng', text: '三才天书讲究戒定慧相济，你切莫只顾堆积蛮力忘了闪避妖锋。' },
      { speaker: 'bajie', text: '师父放心，老猪炼的是金刚厚皮道，顶着风沙旋一圈把血全吸回来！' }
    ]},
    { id: 'duo_ts_bj_5', chars: ['tangseng', 'bajie'], lines: [
      { speaker: 'bajie', text: '哎哟，师父您那九环锡杖甩出来的佛珠，咋比老猪的钯齿还利索？' },
      { speaker: 'tangseng', text: '金刚怒目，亦是菩萨低眉。乱世碎卷之中，不可徒诵空言。' }
    ]},

    // 6. 唐僧 & 悟净 (4组)
    { id: 'duo_ts_wj_1', chars: ['tangseng', 'wujing'], lines: [
      { speaker: 'wujing', text: '师父但请宽心前行，风沙暗刺皆由沙僧在前开道探明。' },
      { speaker: 'tangseng', text: '一路行来，挑担牵马从无怨言，悟净之定力，实乃门中砥柱。' }
    ]},
    { id: 'duo_ts_wj_2', chars: ['tangseng', 'wujing'], lines: [
      { speaker: 'tangseng', text: '悟净，流沙河中那九颗前世取经人颅骨，可还在你心头萦绕？' },
      { speaker: 'wujing', text: '九骨早已化船渡师父过河。前尘血债，沙僧愿以此身百战赎清。' }
    ]},
    { id: 'duo_ts_wj_3', chars: ['tangseng', 'wujing'], lines: [
      { speaker: 'wujing', text: '前方便是凶煞试炼地，师父记得留足甘露净瓶以备不测。' },
      { speaker: 'tangseng', text: '净瓶甘露尚盈，每度五魔亦可返本归元，悟净不必挂怀。' }
    ]},
    { id: 'duo_ts_wj_4', chars: ['tangseng', 'wujing'], lines: [
      { speaker: 'tangseng', text: '昔日灵霄卷帘，今日残卷降魔，悟净可曾悔过失手碎盏之劫？' },
      { speaker: 'wujing', text: '殿前玉盏虽贵，不敌西行路上师徒相扶之真情。某无悔。' }
    ]},

    // 7. 唐僧 & 白龙马 (4组)
    { id: 'duo_ts_bl_1', chars: ['tangseng', 'bailongma'], lines: [
      { speaker: 'tangseng', text: '敖烈，十万八千里委屈你负重含默，今日方见西海龙子真风采。' },
      { speaker: 'bailongma', text: '能载圣僧求取大法，本是敖烈造化；今日执枪护法，亦是本分！' }
    ]},
    { id: 'duo_ts_bl_2', chars: ['tangseng', 'bailongma'], lines: [
      { speaker: 'bailongma', text: '师父，宝象国银安殿那一夜，弟子恨未能一剑替您斩尽妖氛。' },
      { speaker: 'tangseng', text: '你忍伤化龙请回悟空，已救为师性命于水火，何须自责？' }
    ]},
    { id: 'duo_ts_bl_3', chars: ['tangseng', 'bailongma'], lines: [
      { speaker: 'tangseng', text: '龙性刚烈如雷，切记刚极易折，冲阵之后善用腾挪退避。' },
      { speaker: 'bailongma', text: '谨遵师父教诲！真龙闪过即可重聚云力，进退自如。' }
    ]},
    { id: 'duo_ts_bl_4', chars: ['tangseng', 'bailongma'], lines: [
      { speaker: 'bailongma', text: '此间水脉浑浊皆染妖气，待破此劫，弟子引西海清泉为师父烹茶。' },
      { speaker: 'tangseng', text: '有此澄澈道心，纵处浊浪火窟，亦如清凉莲境。' }
    ]},

    // 8. 八戒 & 悟净 (4组)
    { id: 'duo_bj_wj_1', chars: ['bajie', 'wujing'], lines: [
      { speaker: 'bajie', text: '沙师弟，往常都是你挑担子，这回进秘境咱哥俩比比谁拍翻的小妖多！' },
      { speaker: 'wujing', text: '二师兄只管抡耙冲锋，某布下流沙水阵替你把群妖聚在一处。' }
    ]},
    { id: 'duo_bj_wj_2', chars: ['bajie', 'wujing'], lines: [
      { speaker: 'wujing', text: '二师兄，你当真还惦记着散伙回高老庄不成？' },
      { speaker: 'bajie', text: '嗨，嘴上过过瘾罢了！真丢下师父和你们几个，老猪睡觉都不踏实！' }
    ]},
    { id: 'duo_bj_wj_3', chars: ['bajie', 'wujing'], lines: [
      { speaker: 'bajie', text: '当年咱俩在天庭一个管天河水兵，一个守灵霄御帘，谁想得到如今一块钻山洞！' },
      { speaker: 'wujing', text: '天上神仙拘束，倒不如眼下仗剑抡钯、快意斩妖来得痛快。' }
    ]},
    { id: 'duo_bj_wj_4', chars: ['bajie', 'wujing'], lines: [
      { speaker: 'wujing', text: '小心脚下机关毒刺，二师兄莫光盯着地上金光闪闪的披挂宝匣。' },
      { speaker: 'bajie', text: '放心放心，老猪这身饕餮厚皮抗造得很，宝贝可不能便宜了妖怪！' }
    ]},

    // 9. 八戒 & 白龙马 (4组)
    { id: 'duo_bj_bl_1', chars: ['bajie', 'bailongma'], lines: [
      { speaker: 'bajie', text: '哟，小师弟！往常老猪牵着你走，如今你插翅飞三段跳，老猪拍马也追不上啦！' },
      { speaker: 'bailongma', text: '二师兄少拿我打趣，当年你偷懒把半副行李全压我鞍上，账还没算呢！' }
    ]},
    { id: 'duo_bj_bl_2', chars: ['bajie', 'bailongma'], lines: [
      { speaker: 'bailongma', text: '天河水军大元帅的钉钯功夫，果真不是寻常山精野怪能挡得住的。' },
      { speaker: 'bajie', text: '那可不！想当年四海龙王见了老猪也得客客气气敬杯水酒呢！' }
    ]},
    { id: 'duo_bj_bl_3', chars: ['bajie', 'bailongma'], lines: [
      { speaker: 'bajie', text: '小白龙，你要是瞧见哪儿掉了大肉包，千万手下留情别拿雷劈焦了！' },
      { speaker: 'bailongma', text: '……二师兄莫非觉得雷火烤熟的包子更香？' }
    ]},
    { id: 'duo_bj_bl_4', chars: ['bajie', 'bailongma'], lines: [
      { speaker: 'bailongma', text: '宝象国我去求援你回高老庄那回，幸亏你最后还算讲义气赶回来了。' },
      { speaker: 'bajie', text: '咳咳！那不是你小师弟开口劝得重嘛，老猪哪能真不管师父死活！' }
    ]},

    // 10. 悟净 & 白龙马 (4组)
    { id: 'duo_wj_bl_1', chars: ['wujing', 'bailongma'], lines: [
      { speaker: 'wujing', text: '小师弟枪势如电，某以寒渊流沙迟滞敌军，你尽管贯空穿刺。' },
      { speaker: 'bailongma', text: '三师兄控场稳若泰山，水雷相激，这群妖邪插翅难逃！' }
    ]},
    { id: 'duo_wj_bl_2', chars: ['wujing', 'bailongma'], lines: [
      { speaker: 'bailongma', text: '一路西行，唯有三师兄牵缰伴我同行万里，默然相知。' },
      { speaker: 'wujing', text: '你我皆曾负罪戴枷之人，不尚虚言，唯以手中兵刃证道。' }
    ]},
    { id: 'duo_wj_bl_3', chars: ['wujing', 'bailongma'], lines: [
      { speaker: 'wujing', text: '鹰愁涧与流沙河皆为苦寒绝地，如今重履险境，龙心可还安稳？' },
      { speaker: 'bailongma', text: '深涧困不住真龙，弱水亦沉不下孤忠。三师兄请看枪！' }
    ]},
    { id: 'duo_wj_bl_4', chars: ['wujing', 'bailongma'], lines: [
      { speaker: 'bailongma', text: '三师兄这降妖宝杖外轻内重，挥出朔月水刃竟隐带风雷之声。' },
      { speaker: 'wujing', text: '月宫梭罗仙木所琢，专克骄狂妖骨，正配小师弟九霄银枪。' }
    ]}
  ];

  // ============================================================================
  // 四、五位主角专属零重复台词大库（第 1 位：孙悟空 wukong）
  // ============================================================================
  const HERO_LINES = {};

  HERO_LINES.wukong = {
    // 1. 开局出征过场 (25条：含局数里程碑 + 上局记忆 + 法相响应 + 核心性格)
    runStart: [
      { id: 'wk_rs_m1', cond: { charRun: 1 }, text: '灵山那本破难簿碎便碎了！省得菩萨拿笔瞎勾，看俺老孙一棒重趟这西行路！' },
      { id: 'wk_rs_m5', cond: { charRun: 5 }, text: '第五遭踏入碎卷，这些妖魔的气数倒越发凶悍——正好拿来磨亮俺的金箍棒！' },
      { id: 'wk_rs_m10', cond: { charRun: 10 }, text: '十入劫海！俺老孙算是瞧明白了，这难簿碎片里藏着三界不敢明说的旧账！' },
      { id: 'wk_rs_m15', cond: { charRun: 15 }, text: '第十五回出征！管他天庭棋局还是灵山劫数，棒子抡圆了全是纸糊的窗户！' },
      { id: 'wk_rs_m20', cond: { charRun: 20 }, text: '二十番破劫归来，心猿无拘、金睛无尘——今日俺老孙便是这天地间最大的变数！' },
      { id: 'wk_rs_win', cond: { lastOutcome: 'victory' }, text: '上回刚砸碎了终劫魔窟，残卷又生新妖？来得好，老孙手掌心正痒痒呢！' },
      { id: 'wk_rs_loss', cond: { lastOutcome: 'defeat' }, text: '呸，上回一时大意叫小妖钻了空子！拍拍虎皮裙上的灰，孙外公找回场子去！' },
      { id: 'wk_rs_rev', cond: { lastRevived: true }, text: '上遭承了南海一滴杨柳甘露的情，这局俺老孙定要凭真本事横扫四洲！' },
      { id: 'wk_rs_asp1', cond: { aspectId: 'wk_aspect_clone' }, text: '拔一把毫毛嚼碎了吹口仙气——孩儿们，随大圣爷一道把这妖窟掀个底朝天！' },
      { id: 'wk_rs_asp2', cond: { aspectId: 'wk_aspect_pillar' }, text: '一万三千五百斤定海神针，再长粗三圈！挨着擦着，叫他连人带墙摔成肉饼！' },
      { id: 'wk_rs_asp3', cond: { aspectId: 'wk_aspect_havoc' }, text: '棒尖缠绕紫霄狂雷！当年雷公电母劈不死老孙，如今全成了俺棒下的响炮！' },
      { id: 'wk_rs_01', text: '呔！耳朵眼里摸出绣花针，迎风一幌碗口粗——前头的妖怪，排好队领死！' },
      { id: 'wk_rs_02', text: '八卦炉里文武火都炼不化俺这双金睛，区区残卷迷雾，能瞒得过谁？' },
      { id: 'wk_rs_03', text: '五百年前大闹天宫嫌地方窄，如今这十二秘境倒宽敞，够翻几个痛快筋斗！' },
      { id: 'wk_rs_04', text: '老龙王当年还心疼这根铁柱子，殊不知跟着俺老孙敲碎万妖，才算不辱神兵！' },
      { id: 'wk_rs_05', text: '莫提甚么弼马温的旧臊！齐天大圣四个字，是俺一棒一棒打出来的！' },
      { id: 'wk_rs_06', text: '师父常劝莫造杀孽，可这残卷里的恶鬼不敲散了，留着过年蒸馒头不成？' },
      { id: 'wk_rs_07', text: '凤翅紫金冠束紧，锁子黄金甲披牢——走！去会会那帮下界打秋风的毛神！' },
      { id: 'wk_rs_08', text: '菩提祖师交代不许提他老人家名讳，也罢，单凭三星洞学来的筋斗棒法足矣！' },
      { id: 'wk_rs_09', text: '压在五行山下吃铁丸那阵子，俺做梦都在抡棒子——今朝可得打个尽兴！' },
      { id: 'wk_rs_10', text: '前路既有盾兵拦道，翻个身留具毫毛金身炸他后心，省事又利索！' },
      { id: 'wk_rs_11', text: '神佛坐骑也好，洞府山精也罢，敢挡西行道途，管叫你认得铁棒厉害！' },
      { id: 'wk_rs_12', text: '这三才天书倒是稀罕物，且看老孙主修斗战之道，三棒定乾坤！' },
      { id: 'wk_rs_13', text: '花果山的猴子猴孙都在水帘洞瞧着呢，大圣爷岂能在残卷里折了威风？' },
      { id: 'wk_rs_14', text: '紧箍儿虽紧，锁不住俺胸中一团烈火！开路开路，踏平这重劫障！' }
    ],

    // 2. 关卡入场/地域/异象/奇遇随行独白 (38条)
    stageSolo: [
      { id: 'wk_st_reg1', cond: { regionId: 'liangjie_canyon' }, text: '两界山的风还是这般冷硬……嘿，那座压了俺五百年的破山帖，早该撕碎了！' },
      { id: 'wk_st_reg2', cond: { regionId: 'heifeng_temple' }, text: '又是观音禅院这股焦木味！当年借辟火罩护住师父，金池老和尚却贪心自焚。' },
      { id: 'wk_st_reg3', cond: { regionId: 'huangfeng_ridge' }, text: '好毒的三昧黄风！没有灵吉菩萨的定风丹，俺老孙贴着沙岩照样闯过去！' },
      { id: 'wk_st_reg4', cond: { regionId: 'liusha_river' }, text: '八百里弱水鹅毛不浮，亏得有浮筏木排借力，不然老孙的水性还真嫌费事！' },
      { id: 'wk_st_reg5', cond: { regionId: 'baigu_crypt' }, text: '阴森森全是粉骷髅味！火眼金睛底下，任你变村姑老妪也是一棒子敲烂！' },
      { id: 'wk_st_reg6', cond: { regionId: 'pingding_grotto' }, text: '平顶山危岩颤巍巍的，莫非银角那厮又念动移山咒想拿三座大山压俺？' },
      { id: 'wk_st_reg7', cond: { regionId: 'tongtian_glacier' }, text: '通天河结了这般厚的玄冰，脚底溜滑——正好借势滑铲冲杀过去！' },
      { id: 'wk_st_reg8', cond: { regionId: 'xiliang_spiders' }, text: '满林子黏糊糊的蛛网毒沼，呆子见了准走不动道，俺老孙一把火全给燎干净！' },
      { id: 'wk_st_reg9', cond: { regionId: 'huoyan_volcano' }, text: '八百里火焰山！当年俺老孙一脚踢翻老君八卦炉落下的砖头，今儿倒烧得旺！' },
      { id: 'wk_st_reg10', cond: { regionId: 'bibo_dragonpalace' }, text: '水底水晶宫浮力轻飘飘的，捻着避水诀抡棒，照样搅他个翻江倒海！' },
      { id: 'wk_st_reg11', cond: { regionId: 'shituo_empire' }, text: '好一座吃人狮驼魔城！四万七千小妖巡山，且看老孙单枪匹马杀个对穿！' },
      { id: 'wk_st_reg12', cond: { regionId: 'lingshan_thunder' }, text: '脚踏七彩祥云，前望凌云仙渡——越是靠近灵山，这残卷里的杀机越深呐！' },
      { id: 'wk_st_mut1', cond: { mutatorId: 'mut_blood_moon' }, text: '血月当空，群妖发狂？妙极！俺的身外身神通也转得飞快，以快打快！' },
      { id: 'wk_st_mut2', cond: { mutatorId: 'mut_blitz_pocket' }, text: '缩地成寸，十步一妖将！省了跑路工夫，双倍天书俺老孙笑纳了！' },
      { id: 'wk_st_mut3', cond: { mutatorId: 'mut_heaven_thunder' }, text: '天上乱劈紫霄雷？来来来，把持盾的蠢熊引到雷印底下，借天雷破他的乌龟壳！' },
      { id: 'wk_st_mut4', cond: { mutatorId: 'mut_alchemy_boom' }, text: '老君丹炉漏了火丹，妖怪死了原地炸膛——这连环响听着比放鞭炮还解气！' },
      { id: 'wk_st_mut5', cond: { mutatorId: 'mut_glass_cannon' }, text: '修罗破釜，脆便脆些！只要棒子够狠、翻滚够滑，妖精连俺一根猴毛也摸不着！' },
      { id: 'wk_st_mut6', cond: { mutatorId: 'mut_golden_fortune' }, text: '漫天功德金铢乱蹦，连暴击力道都跟着水涨船高，这趟买卖不亏！' },
      { id: 'wk_st_mut7', cond: { mutatorId: 'mut_giant_brawl' }, text: '法天象地！这击飞力道，一棒子把妖怪拍进石壁里抠都抠不出来！' },
      { id: 'wk_st_evt1', cond: { eventId: 'evt_ginseng_tree' }, text: '五庄观的人参果闻一闻三百六十岁，镇元大仙不在，这因果老孙担了！' },
      { id: 'wk_st_evt2', cond: { eventId: 'evt_six_ear_mirror' }, text: '古镜照出二心魔影？天地间只能有一个齐天大圣，假的终归是假的！' },
      { id: 'wk_st_evt3', cond: { eventId: 'evt_laozi_furnace' }, text: '老君遗落的八卦炉还在冒三昧火，正好替俺淬炼一身趁手披挂！' },
      { id: 'wk_st_evt4', cond: { eventId: 'evt_guanyin_willow' }, text: '紫竹林杨柳枝一点，杂学归宗——这股通透劲儿，浑身筋骨都轻了三斤！' },
      { id: 'wk_st_bp3', cond: { bpCount: 3 }, text: '斗战天书满三卷！金箍棒第三击破甲气浪已成，谁敢硬接？' },
      { id: 'wk_st_bp6', cond: { bpCount: 6 }, text: '六卷大成，法相金光透甲而出！如今这一棒下去，鬼神皆惊！' },
      { id: 'wk_st_bp9', cond: { bpCount: 9 }, text: '九卷化境·齐天无双！棒风所至雷火诛邪，这残卷天地谁堪一合！' },
      { id: 'wk_st_01', text: '越往西走妖风越腥，手里的铁棒都在嗡嗡作响，催俺老孙开荤呢！' },
      { id: 'wk_st_02', text: '连斩不断，脚底生风！这般行云流水的冲杀，才配得上齐天二字！' },
      { id: 'wk_st_03', text: '前面那些巡山小妖鬼鬼祟祟，看俺空中千钧下砸，震晕他们一窝端！' },
      { id: 'wk_st_04', text: '这残卷地貌每回进来都变个模样，倒比天宫御花园的假山有趣得多！' },
      { id: 'wk_st_05', text: '身上披挂越凑越齐整，比当年找四海龙王硬讨的那身行头也不遑多让！' },
      { id: 'wk_st_06', text: '妖怪举盾挡前头？嘿，翻身滚过他裤裆，毫毛金身爆他个屁股开花！' },
      { id: 'wk_st_07', text: '想当年十万天兵布下十八架天罗地网，也没拦住俺老孙半步！' },
      { id: 'wk_st_08', text: '且慢喘气，前头妖气凝成实质，准有一尊硬茬子妖王在殿里候着呢！' },
      { id: 'wk_st_09', text: '棒上金箍刻着字，一棒下去鬼神泣——莫怪老孙不留情面！' },
      { id: 'wk_st_10', text: '法力充沛，甘露满瓶，这状态便是如来翻掌，俺也敢再赌一局！' },
      { id: 'wk_st_11', text: '听风辨位，暗箭火球趁早翻滚避开，留着气血去跟守关大妖痛快过招！' },
      { id: 'wk_st_12', text: '修心亦修棒，心猿不乱，任他千般毒阵也是枉然！' }
    ],

    // 3. Boss战前交锋应战台词 (88条：38条原著宿命对决专属 + 50条本色应战，80场Boss零重复！)
    bossClash: [
      { id: 'wk_bc_t01', cond: { tribNo: 1 }, text: '斩仙台的金甲神将？五百年前刀砍斧剁尚不伤俺分毫，今日也配拦路！' },
      { id: 'wk_bc_t05', cond: { tribNo: 5 }, text: '双叉岭的斑斓猫儿！当年趁俺还没出山吓唬师父，今儿剥你的虎皮做战裙！' },
      { id: 'wk_bc_t06', cond: { tribNo: 6 }, text: '熊山君、特处士？两块蠢笨盾牌也想挡定海神针，看俺翻身敲碎你脊梁！' },
      { id: 'wk_bc_t09', cond: { tribNo: 9 }, text: '鹰愁涧的水泥鳅，小白龙早归了正果，你倒占着深涧兴风作浪！' },
      { id: 'wk_bc_t11', cond: { tribNo: 11 }, text: '黑风洞的黑汉！不请菩萨箍你，单凭武艺，今日咱哥俩枪棒底下分高下！' },
      { id: 'wk_bc_t12', cond: { tribNo: 12 }, text: '云栈洞的猪刚鬣魔影？嘿，比现在的呆子还凶三分，来吃老孙一棒！' },
      { id: 'wk_bc_t13', cond: { tribNo: 13 }, text: '灵山偷油吃的金毛耗子！上回吹伤俺老孙的眼睛，这笔旧账今朝连本带利讨还！' },
      { id: 'wk_bc_t14', cond: { tribNo: 14 }, text: '虎先锋！金蝉脱壳的虎皮计耍一回就够了，这回叫你连皮带骨一块儿碎！' },
      { id: 'wk_bc_t15', cond: { tribNo: 15 }, text: '流沙弱水凝成的旧日水煞？沙师弟早脱了苦海，留你这恶影何用！' },
      { id: 'wk_bc_t19', cond: { tribNo: 19 }, text: '镇元大仙的乾坤袖道傀！人参果树俺早医活了，还敢伸袖子罩俺老孙？' },
      { id: 'wk_bc_t20', cond: { tribNo: 20 }, text: '千年粉骷髅！当年害俺受了三遍紧箍咒、一纸贬书——今日一棒敲得你魂飞魄散！' },
      { id: 'wk_bc_t23', cond: { tribNo: 23 }, text: '奎木狼！殿上星宿不做，下界变老虎害人，看老孙敲碎你的舍利内丹！' },
      { id: 'wk_bc_t24', cond: { tribNo: 24 }, text: '金角小儿！莫举那紫金红葫芦，你便是喊破喉咙，孙行者与者行孙也不应你！' },
      { id: 'wk_bc_t25', cond: { tribNo: 25 }, text: '银角童子！幌金绳捆不住身外毫毛，老君的看炉娃娃乖乖挨打罢！' },
      { id: 'wk_bc_t26', cond: { tribNo: 26 }, text: '文殊座下的青毛狮子！推国王下井鸠占鹊巢，吃俺一记开山重棍！' },
      { id: 'wk_bc_t28', cond: { tribNo: 28 }, text: '红孩儿贤侄！上回烟熏火燎险些要了六叔老命，今日残卷相逢可不让着你了！' },
      { id: 'wk_bc_t32', cond: { tribNo: 32 }, text: '泾河老龙的九儿子鼍洁！摩昂表弟不在，老孙亲自替西海管教你这不肖子！' },
      { id: 'wk_bc_t34', cond: { tribNo: 34 }, text: '虎力老道！求雨坐禅猜柜子赢了你还不够，非要动刀兵试老孙的砍头术？' },
      { id: 'wk_bc_t36', cond: { tribNo: 36 }, text: '莲花池溜出来的金鱼精！未扎衣裳的菩萨不在，老孙直接拿铁棒敲鱼头汤！' },
      { id: 'wk_bc_t39', cond: { tribNo: 39 }, text: '板角青牛！收好你那偷来的金刚琢，贴身肉搏，看你有几根牛肋骨经得起砸！' },
      { id: 'wk_bc_t42', cond: { tribNo: 42 }, text: '如意真仙！霸着落胎泉记恨侄儿的账，你的如意钩怎敌得过如意金箍棒！' },
      { id: 'wk_bc_t44', cond: { tribNo: 44 }, text: '琵琶蝎子精！当年倒马毒桩蜇得老孙脑门生疼，今番定不教你近身半寸！' },
      { id: 'wk_bc_t46', cond: { tribNo: 46 }, text: '六耳猕猴！不必上天入地找人辨认——真金不怕火炼，棒下活着的才是真大圣！' },
      { id: 'wk_bc_t48', cond: { tribNo: 48 }, text: '铁扇嫂嫂！今日不钻你肚皮也不借假扇，且看谁的风火压过谁的铁棒！' },
      { id: 'wk_bc_t49', cond: { tribNo: 49 }, text: '牛大哥！花果山结义酒早凉透了，显出你的大白牛真身，咱兄弟痛快战三百合！' },
      { id: 'wk_bc_t51', cond: { tribNo: 51 }, text: '九头虫！少了一颗脑袋还在滴血吧？这回没有细犬，老孙照样拔光你的血翼！' },
      { id: 'wk_bc_t53', cond: { tribNo: 53 }, text: '黄眉小童！敢假扮如来设小雷音寺？金铙罩不住老孙，人种袋也休想收俺！' },
      { id: 'wk_bc_t55', cond: { tribNo: 55 }, text: '七绝山红鳞长虫！不钻你肚皮撑破蛇脊，正面一棒把你敲成七截！' },
      { id: 'wk_bc_t57', cond: { tribNo: 57 }, text: '赛太岁金毛犼！脖子底下挂三个破铃铛就敢放火飞沙，看老孙摘了你的狗铃！' },
      { id: 'wk_bc_t59', cond: { tribNo: 59 }, text: '盘丝洞七只花蜘蛛！漫天银丝在金箍棒旋风跟前，不过是一搅就碎的乱麻！' },
      { id: 'wk_bc_t60', cond: { tribNo: 60 }, text: '百眼蜈蚣精！肋下千只金眼晃得人眼花，老孙闭着眼听风也能敲扁你的毒壳！' },
      { id: 'wk_bc_t62', cond: { tribNo: 62 }, text: '青狮白象！一个吹牛吞十万天兵，一个甩长鼻子，一块儿上省得老孙分两趟打！' },
      { id: 'wk_bc_t63', cond: { tribNo: 63 }, text: '金翅大鹏雕！扇一翅九万里又如何？此间方寸擂台，飞不出老孙这根定海神针！' },
      { id: 'wk_bc_t65', cond: { tribNo: 65 }, text: '南极仙翁的白鹿！拿一千小儿心肝做药引，便是寿星亲至也保不住你这畜生！' },
      { id: 'wk_bc_t69', cond: { tribNo: 69 }, text: '陷空山半截观音白毛鼠！别搬李天王牌位吓人，老孙连哪吒他爹一块儿揍！' },
      { id: 'wk_bc_t74', cond: { tribNo: 74 }, text: '九灵元圣！九颗狮子头吼震三界确实威风，且试老孙这破劫重棍接不接得住！' },
      { id: 'wk_bc_t78', cond: { tribNo: 78 }, text: '广寒宫溜下界的捣药兔子！拿根短杵学人抛绣球，不怕敲折你的长耳朵？' },
      { id: 'wk_bc_t81', cond: { tribNo: 81 }, text: '通天河老鼋！忘了替你问寿年是俺们理亏，可你想掀翻经书，先过老孙这关！' },
      // 通用本色应战池 (50条)
      { id: 'wk_bc_g01', text: '报上名来！俺老孙棒下不死无名小卒，省得阎王生死簿上不好销账！' },
      { id: 'wk_bc_g02', text: '瞧这妖气架势倒有几分斤两——接得住老孙三连重棒，算你这洞主没白修千年！' },
      { id: 'wk_bc_g03', text: '莫耍花腔虚张声势！火眼金睛早瞧见你气门破绽了，看棒！' },
      { id: 'wk_bc_g04', text: '天上哪尊神仙放下来的私宠？打残了自有人来领，老孙只管痛快下手！' },
      { id: 'wk_bc_g05', text: '一万三千五百斤铁棒正愁没处落脚，你这脑瓜骨瞧着倒硬实！' },
      { id: 'wk_bc_g06', text: '霸山占水称大王？五百年前七十二洞妖王拜俺做齐天大圣时，你还在穿开裆裤呢！' },
      { id: 'wk_bc_g07', text: '少拿吃唐僧肉长生不老说事！十个嚷着吃师父的，九个成了俺棒底下的肉泥！' },
      { id: 'wk_bc_g08', text: '好妖怪，气血倒是浑厚！且看是你的妖甲硬，还是俺的大闹天宫旋风棒利！' },
      { id: 'wk_bc_g09', text: '不用搬救兵，不用查跟脚——在这碎卷擂台上，拳头硬的便是天理！' },
      { id: 'wk_bc_g10', text: '啧啧，洞府修得挺气派，可惜今儿遇上孙外公拆迁，一块好砖也别想留！' },
      { id: 'wk_bc_g11', text: '你那点前摇破绽，隔着二里地都闪红光了，老孙闭着眼翻滚也能躲开！' },
      { id: 'wk_bc_g12', text: '当年二郎显圣真君斗俺三百回合才算棋逢对手，你有他几分本事？' },
      { id: 'wk_bc_g13', text: '残卷把你再捏出来一回，不是叫你享福的，是给俺老孙刷灵蕴功德的！' },
      { id: 'wk_bc_g14', text: '亮兵刃罢！藏头露尾算甚么好汉，痛痛快快拼上几十合！' },
      { id: 'wk_bc_g15', text: '金箍棒，长！长！长！今日不敲出你原形本相，老孙倒着走出这山门！' },
      { id: 'wk_bc_g16', text: '妖风熏得人脑仁疼，速战速决，打完了老孙还得赶赴下一重劫！' },
      { id: 'wk_bc_g17', text: '你这把刷子唬唬凡夫俗子尚可，在齐天大圣跟前，不过是耍猴戏——呸，耍妖戏！' },
      { id: 'wk_bc_g18', text: '老孙平生最烦挡路石，偏生你们一个个赶着往铁棒底下凑！' },
      { id: 'wk_bc_g19', text: '瞧你满身宝贝灵光，打趴下准能爆件神品披挂，多谢送宝啦！' },
      { id: 'wk_bc_g20', text: '莫眨眼！俺这身外毫毛与真身齐上，看你往哪边招架！' },
      { id: 'wk_bc_g21', text: '任你喷火吐沙、移山幻影，俺自一力降十会！' },
      { id: 'wk_bc_g22', text: '嘿嘿，终于有个块头大点的沙包了，方才一路小妖实在不经敲！' },
      { id: 'wk_bc_g23', text: '十殿阎罗见了老孙都得拱手赔笑，你这泼魔倒敢横眉竖眼？' },
      { id: 'wk_bc_g24', text: '天书修为已聚顶门，今日便拿你祭这一式千钧裂地棍！' },
      { id: 'wk_bc_g25', text: '纵是铜头铁额、钢筋铁骨，挨上老孙暴击三连也得酥了半边身子！' },
      { id: 'wk_bc_g26', text: '你守你的关，俺破俺的劫，大道朝天，各凭本事生死勿论！' },
      { id: 'wk_bc_g27', text: '狂风吹得动旗幡，吹不动心猿定力——妖孽，纳命来！' },
      { id: 'wk_bc_g28', text: '别急着放狠话，等血条掉到一半发狂时，再哭爹喊娘也不迟！' },
      { id: 'wk_bc_g29', text: '花果山崩裂石猴出世那日，天地尚且震三震，何况你这小小妖坛！' },
      { id: 'wk_bc_g30', text: '来得好！筋骨正活动开了，吃你孙外公当头一记迎风棒！' },
      { id: 'wk_bc_g31', text: '满殿妖气冲霄，倒省了老孙四处寻摸守关正主的脚力！' },
      { id: 'wk_bc_g32', text: '你手里的家伙什看着挺沉，就是不知碰上定海神针会不会断作两截！' },
      { id: 'wk_bc_g33', text: '莫管前世恩怨、灵山定数，今朝只分棒上雌雄！' },
      { id: 'wk_bc_g34', text: '这双火眼金睛专破虚妄幻象，真身在哪儿，老孙一清二楚！' },
      { id: 'wk_bc_g35', text: '既占了这一难的因果名号，便拿出配得上八十一难的真章来！' },
      { id: 'wk_bc_g36', text: '翻江搅海、摘星换月的事老孙都干过，斩尊把妖王只当饮盏凉茶！' },
      { id: 'wk_bc_g37', text: '虎皮裙猎猎生风，雉鸡翎迎煞昂扬——泼魔，接招！' },
      { id: 'wk_bc_g38', text: '休走！传送法阵就在你身后，借你项上妖丹一用开路！' },
      { id: 'wk_bc_g39', text: '神通广大又如何？近不得俺身，摸不着俺影，徒费气力尔！' },
      { id: 'wk_bc_g40', text: '老孙今天不叫天兵、不借法宝，单凭掌中一棍与你见个真章！' },
      { id: 'wk_bc_g41', text: '听这战鼓擂得紧，不打出漫天金光火花，倒辜负了这场好排面！' },
      { id: 'wk_bc_g42', text: '你若识相让开法阵便罢；既举了兵刃，便休怪铁棒无眼！' },
      { id: 'wk_bc_g43', text: '三界六道多少豪杰，能接老孙全力十棍者屈指可数——试试看？' },
      { id: 'wk_bc_g44', text: '好重的一股凶煞念头！残卷倒把你最巅峰的妖力全拓印下来了！' },
      { id: 'wk_bc_g45', text: '纵有千般神通变化，在绝对的快棒与暴击面前皆是虚招！' },
      { id: 'wk_bc_g46', text: '看你横枪立马倒像个人物，来，与齐天大圣痛快厮杀一场！' },
      { id: 'wk_bc_g47', text: '金睛微眯寒芒起，铁棒横肩天地宽——泼妖受死！' },
      { id: 'wk_bc_g48', text: '休提如来观音，此时此地，俺老孙便是收你的活阎罗！' },
      { id: 'wk_bc_g49', text: '待敲碎你这尊护法魔像，这重残卷的迷雾也该散了！' },
      { id: 'wk_bc_g50', text: '呔！少废唇舌，棒下见真章！' }
    ],

    // 4. 斩杀妖王收兵判词 (84条：非阻塞横幅，零重复！)
    bossKill: [
      { id: 'wk_bk_01', text: '收棒回耳！不过如此，还当有多硬的脑壳！' },
      { id: 'wk_bk_02', text: '化作灵蕴散去罢，下辈子投胎莫再拦西行路！' },
      { id: 'wk_bk_03', text: '呸，吹得震天响，挨了三轮重棒还不是现了原形！' },
      { id: 'wk_bk_04', text: '好披挂！归俺老孙了，传送门开，走着！' },
      { id: 'wk_bk_05', text: '没有菩萨下界收你，在老孙棒下唯有形神俱灭一条路！' },
      { id: 'wk_bk_06', text: '痛快！浑身筋骨总算舒展了七八分！' },
      { id: 'wk_bk_07', text: '这一难的残页已平，且看前头还有甚么狠角色！' },
      { id: 'wk_bk_08', text: '定海神针铁上不沾妖血，抖一抖金光依旧！' },
      { id: 'wk_bk_09', text: '叫你狂！连俺的毫毛分身都拆不明白，也敢称王称圣！' },
      { id: 'wk_bk_10', text: '灵蕴入袋，金铢归仓——土地老儿，备好仙缘赐福！' },
      { id: 'wk_bk_11', text: '五百年没打得这么顺手了，下一劫，快开法阵！' },
      { id: 'wk_bk_12', text: '原形毕露了吧？神仙家养的畜生也禁不住真打！' },
      { id: 'wk_bk_13', text: '任你毒火狂沙，破不开俺老孙的无敌翻身与快棍！' },
      { id: 'wk_bk_14', text: '一棒断因果，再棒碎虚空——这劫过了！' },
      { id: 'wk_bk_15', text: '呆子若是瞧见这一地宝贝，哈喇子准流三尺长！' },
      { id: 'wk_bk_16', text: '哼，花架子挺足，可惜后摇太大，全喂了俺的暴击！' },
      { id: 'wk_bk_17', text: '残卷执念已除，尘归尘，土归土罢！' },
      { id: 'wk_bk_18', text: '齐天大圣到此一游——这关妖王，已销号！' },
      { id: 'wk_bk_19', text: '还差得远！连当年混世魔王都比你多撑两合！' },
      { id: 'wk_bk_20', text: '金光爆满地，这趟苦仗没白打！' },
      { id: 'wk_bk_21', text: '火眼金睛一瞪，早算出你撑不过这一击！' },
      { id: 'wk_bk_22', text: '歇口气喝口甘露，前头的硬仗还在后头呢！' },
      { id: 'wk_bk_23', text: '妖氛散尽天光清，这一棒替这方百姓出了恶气！' },
      { id: 'wk_bk_24', text: '铁棒横扫千军如卷席，痛快，当真痛快！' },
      { id: 'wk_bk_25', text: '莫怨老孙手黑，要怨就怨把你困进碎卷的天道！' },
      { id: 'wk_bk_26', text: '纵横四海八荒，还没几块骨头能磕弯这根铁棒！' },
      { id: 'wk_bk_27', text: '破防、震晕、一棍收尾——行家一出手便知有没有！' },
      { id: 'wk_bk_28', text: '把爆出来的神兵披挂捡齐整，再去会下一尊魔头！' },
      { id: 'wk_bk_29', text: '师父常说善恶到头终有报，俺这根铁棒便是现世报！' },
      { id: 'wk_bk_30', text: '霸气散尽化青烟，空留一地功德钱！' },
      { id: 'wk_bk_31', text: '半点汗也没出，权当饭前耍了一套棍花！' },
      { id: 'wk_bk_32', text: '狂飙突进破魔阵，谁人敢拦孙行者！' },
      { id: 'wk_bk_33', text: '你那看家本领使完了，该轮到老孙送你上路了！' },
      { id: 'wk_bk_34', text: '碎石飞溅妖魂灭，好一记千钧澄玉宇！' },
      { id: 'wk_bk_35', text: '这洞府妖气总算清静了，踏入传送阵择路前行！' },
      { id: 'wk_bk_36', text: '再去阎王殿告老孙一状？可惜生死簿早被俺勾烂了！' },
      { id: 'wk_bk_37', text: '三才修为再进一竿头，越战越勇！' },
      { id: 'wk_bk_38', text: '饶你奸似鬼，也喝了孙外公的洗脚水！' },
      { id: 'wk_bk_39', text: '兵刃折断妖丹碎，这一难算彻底翻篇了！' },
      { id: 'wk_bk_40', text: '威风耍够了，乖乖化作灵蕴助俺淬炼仙根罢！' },
      { id: 'wk_bk_41', text: '不愧是镇守一难的妖王，总算接了老孙十几棒！' },
      { id: 'wk_bk_42', text: '双翎抖落烟尘灰，且向西天更深处去！' },
      { id: 'wk_bk_43', text: '莫说残卷幻身，便是真身复生也照打不误！' },
      { id: 'wk_bk_44', text: '棒影收拢金风静，满堂妖火尽成灰！' },
      { id: 'wk_bk_45', text: '法宝再凶也看谁使，失了先机唯有挨揍！' },
      { id: 'wk_bk_46', text: '这一式大闹天宫，滋味可还受用？' },
      { id: 'wk_bk_47', text: '闯关夺隘如探囊，且看土地庙今番给甚么好仙缘！' },
      { id: 'wk_bk_48', text: '邪魔伏首，正道重开！' },
      { id: 'wk_bk_49', text: '哼，敢跟斗战胜佛候选人拼近战，算盘打歪喽！' },
      { id: 'wk_bk_50', text: '敲碎这重关隘，离拼齐八十一难又近一步！' },
      { id: 'wk_bk_51', text: '满地霞光瑞气，果真是高风险高爆率！' },
      { id: 'wk_bk_52', text: '老孙连大气都没喘匀，你就躺平了？' },
      { id: 'wk_bk_53', text: '金睛扫处无余孽，铁棒指处即坦途！' },
      { id: 'wk_bk_54', text: '昔日求仙访道方寸山，为的便是今日无拘无束！' },
      { id: 'wk_bk_55', text: '妖王授首，群魔胆寒——痛快！' },
      { id: 'wk_bk_56', text: '把金箍扶正些，方才抡得太猛险些晃歪了！' },
      { id: 'wk_bk_57', text: '邪魔歪道千般巧，不及老孙一棒真！' },
      { id: 'wk_bk_58', text: '收工！捡完披挂进法阵，莫耽误了时辰！' },
      { id: 'wk_bk_59', text: '雷霆万钧破重围，谁说孤猴难撑天！' },
      { id: 'wk_bk_60', text: '洞主既伏诛，余下瘴气自会消散！' },
      { id: 'wk_bk_61', text: '再来十个八个，也不过多翻两个筋斗的事！' },
      { id: 'wk_bk_62', text: '好一场恶斗，打得老孙热血沸腾！' },
      { id: 'wk_bk_63', text: '残页金光归位，且赴下一道司命分岔门！' },
      { id: 'wk_bk_64', text: '邪魔已靖，前路大开！' },
      { id: 'wk_bk_65', text: '凭你铜浇铁铸，也架不住连环暴击破甲！' },
      { id: 'wk_bk_66', text: '当年七十二洞妖王都没你这么抗揍，算条好汉！' },
      { id: 'wk_bk_67', text: '风停沙歇妖声绝，唯余金棒耀寒星！' },
      { id: 'wk_bk_68', text: '这局势如破竹，天王老子来了也拦不住！' },
      { id: 'wk_bk_69', text: '将这缕妖王精魄炼作灵蕴，回土地庙大补仙根！' },
      { id: 'wk_bk_70', text: '胜负已分，踏阵西行！' },
      { id: 'wk_bk_71', text: '嘿，看门本事倒不赖，可惜遇上了拆门行家！' },
      { id: 'wk_bk_72', text: '金猿啸傲山河动，又破西游一重关！' },
      { id: 'wk_bk_73', text: '收起毫毛金身，半根也没折损！' },
      { id: 'wk_bk_74', text: '邪魔伏法，天地一清！' },
      { id: 'wk_bk_75', text: '好法阵！不知门后是冰河火窟还是龙渊狮城？' },
      { id: 'wk_bk_76', text: '一棍扫平崎岖路，万里西风任我行！' },
      { id: 'wk_bk_77', text: '打铁还需自身硬，老孙这身修为扎实得很！' },
      { id: 'wk_bk_78', text: '叫你知道甚么叫一棒定音！' },
      { id: 'wk_bk_79', text: '妖魂溃散金门启，走也！' },
      { id: 'wk_bk_80', text: '爽利！没拖泥带水，正合老孙急性子！' },
      { id: 'wk_bk_81', text: '斩草除根不留患，这页难簿清干净了！' },
      { id: 'wk_bk_82', text: '纵使千难万险，一棒开天便是！' },
      { id: 'wk_bk_83', text: '宝光冲霄汉，捡了这件披挂再进土地庙！' },
      { id: 'wk_bk_84', text: '哈哈，守关大妖已除，前途无阻！' }
    ],

    // 5. 观音甘露逆天复活过场 (22条)
    reviveMiracle: [
      { id: 'wk_rv_01', text: '呸，吐口血沫子算甚么兵解！菩萨这滴杨柳甘露先记账上——妖孽，再战！' },
      { id: 'wk_rv_02', text: '俺老孙有七十二般变化、万劫不磨金身，岂能栽在这阴沟里！起！' },
      { id: 'wk_rv_03', text: '南海净瓶水入喉，浑身铜筋铁骨重燃真火！方才偷袭俺的，站住别跑！' },
      { id: 'wk_rv_04', text: '生死簿早被老孙一笔勾销，阎王爷不敢收，还得把俺送回来敲碎你们！' },
      { id: 'wk_rv_05', text: '金莲护体，毫毛重生！大圣爷刚打了个盹儿，好戏才刚开始！' },
      { id: 'wk_rv_06', text: '八卦炉烧了七七四十九天都没死透，这点皮外伤挠痒痒呢！看棒！' },
      { id: 'wk_rv_07', text: '多谢菩萨甘露救急！欠下的人情，俺拿前头妖王的脑袋抵账！' },
      { id: 'wk_rv_08', text: '斩妖台雷劈火烧尚且毫发无伤，今朝金身重塑，谁敢再试锋芒！' },
      { id: 'wk_rv_09', text: '嘿，差点叫呆子看了笑话！抖擞精神，把场子连本带利砸回来！' },
      { id: 'wk_rv_10', text: '一息尚存，斗志不灭！这便是齐天大圣的不屈战魂！' },
      { id: 'wk_rv_11', text: '佛光荡尽群魔障，金箍棒在手，天塌下来老孙接着顶！' },
      { id: 'wk_rv_12', text: '方才摸清了你的套路，这一回睁大狗眼瞧瞧谁才是猎手！' },
      { id: 'wk_rv_13', text: '三根救命毫毛尚在，观音甘露又至——天命要你亡，泼魔受死！' },
      { id: 'wk_rv_14', text: '石猴本自天地生，百折千摧志愈坚！再来过！' },
      { id: 'wk_rv_15', text: '金光灌顶气血满盈！让开让开，老孙要动真火了！' },
      { id: 'wk_rv_16', text: '想叫俺老孙认栽？再等五百年也没那门儿！' },
      { id: 'wk_rv_17', text: '杨柳青青洒甘霖，大圣归来破万军！' },
      { id: 'wk_rv_18', text: '痛快！洗去一身暗伤晦气，这根棒子比方才更沉三分！' },
      { id: 'wk_rv_19', text: '师父还在卷外候着佳音，俺老孙怎能半途倒下！' },
      { id: 'wk_rv_20', text: '逆天改命本就是俺的拿手好戏——吃老孙翻盘一棒！' },
      { id: 'wk_rv_21', text: '金身无敌三息半，足够把你们这群喽啰全扫飞上天了！' },
      { id: 'wk_rv_22', text: '大难不死必有后威，看俺一鼓作气踏平此劫！' }
    ],

    // 6. 通关圆满终章过场 (22条)
    runVictory: [
      { id: 'wk_vc_01', cond: { firstWin: true }, text: '破劫金门终开！谁说西行必须求神拜佛？单凭这根如意棒，照样打通九九归真路！' },
      { id: 'wk_vc_02', text: '四劫妖尊尽伏诛！残卷收拢几页金光，且回营地温酒庆功！' },
      { id: 'wk_vc_03', text: '斗战之道，不在灵山莲台，便在每一次挥棒破障的痛快淋漓之中！' },
      { id: 'wk_vc_04', text: '满载灵蕴归土地庙！下回再进残卷，叫那帮更高劫度的老妖也尝尝厉害！' },
      { id: 'wk_vc_05', text: '踏碎凌霄容易，勘破心魔最难——今番连闯重劫，俺的心猿越发澄明了。' },
      { id: 'wk_vc_06', text: '金门霞光万道，倒像当年花果山日出东海的盛景！痛快！' },
      { id: 'wk_vc_07', text: '八十一难还剩多少页未曾亲手抚平？无妨，来一页俺敲平一页！' },
      { id: 'wk_vc_08', text: '不负师父托付，不辱齐天威名——这趟西行巡礼，圆满收官！' },
      { id: 'wk_vc_09', text: '神兵披挂熠熠生辉，三才天书融会贯通，这便是无双大圣相！' },
      { id: 'wk_vc_10', text: '漫天金莲落肩头，老孙偏不盘腿坐禅，扛着铁棒潇洒出关！' },
      { id: 'wk_vc_11', text: '昔年封俺斗战胜佛，俺还嫌拘束；如今在残卷里自由破劫，反倒自在！' },
      { id: 'wk_vc_12', text: '群魔俯首，劫云消散，且携这一身浩荡灵蕴凯旋而归！' },
      { id: 'wk_vc_13', text: '你看那碎卷裂痕正在弥合——原来真经不在纸上，而在行者脚下！' },
      { id: 'wk_vc_14', text: '这一路电光石火连斩破关，连天上星宿瞧了也得暗挑大指！' },
      { id: 'wk_vc_15', text: '金箍棒缩回绣花针藏入耳中，掸衣一笑，深藏功与名！' },
      { id: 'wk_vc_16', text: '任他天道异象百变，终究抵不过千锤百炼的一腔孤勇！' },
      { id: 'wk_vc_17', text: '回去叫八戒温壶好酒，给大伙儿讲讲今儿这趟漂亮硬仗！' },
      { id: 'wk_vc_18', text: '破尽万般虚妄相，归来仍是花果山美猴王！' },
      { id: 'wk_vc_19', text: '终劫妖尊倒下的那一刻，天地都轻快了三分！' },
      { id: 'wk_vc_20', text: '功德圆满非终点，只要还有妖氛未净，金箍棒便永不蒙尘！' },
      { id: 'wk_vc_21', text: '万里风烟一棒扫，笑看金门瑞气飘！' },
      { id: 'wk_vc_22', text: '真金百炼终成圣，且待下局更高劫度再试锋芒！' }
    ],

    // 7. 兵解轮回遗言过场 (22条)
    runDefeat: [
      { id: 'wk_df_01', text: '啧，一时贪刀露出空门……待回土地庙淬炼仙根，下局定砸烂他的妖坛！' },
      { id: 'wk_df_02', text: '胜败乃兵家常事！把攒下的灵蕴带回营地，孙外公片刻便回！' },
      { id: 'wk_df_03', text: '这具残卷化身分崩便分崩罢，俺老孙不死不灭，换个法相再来过！' },
      { id: 'wk_df_04', text: '好刁钻的毒招！记下他的前摇路数了，下一遭绝不吃同样的亏！' },
      { id: 'wk_df_05', text: '甘露饮尽气力微乏……罢了，先退回营地歇息半盏茶！' },
      { id: 'wk_df_06', text: '莫得意！五行山压俺五百年尚且翻身，区区一败算得了甚么！' },
      { id: 'wk_df_07', text: '金光散归土地祠，留得灵蕴在，不怕没柴烧！' },
      { id: 'wk_df_08', text: '差半寸就能翻滚躲开……手底下还得再练利索些！' },
      { id: 'wk_df_09', text: '这重劫数的妖魔果真凶顽，激起俺老孙真正的凶性了！' },
      { id: 'wk_df_10', text: '虎皮裙染血不坠青云志，且归仙祠磨快神兵！' },
      { id: 'wk_df_11', text: '天书还没凑到化境便撞上硬点子，下回择路须更精明些！' },
      { id: 'wk_df_12', text: '嘿，就当拔了根毫毛替身受过，真身回营重整旗鼓！' },
      { id: 'wk_df_13', text: '西行十万八千里尚有九九难，跌一跤拍拍土再起便是！' },
      { id: 'wk_df_14', text: '记住这张妖脸了！下回撞见，头三棒全招呼他面门！' },
      { id: 'wk_df_15', text: '灵蕴不失，道基日厚——越挫越强方是斗战本色！' },
      { id: 'wk_df_16', text: '只恨蓝量差了一线没开出身外身，下局定备好回蓝宝甲！' },
      { id: 'wk_df_17', text: '云散风流暂归去，重凝战意再登坛！' },
      { id: 'wk_df_18', text: '莫叫师父替俺担心，这便回营调息，转眼再战！' },
      { id: 'wk_df_19', text: '残卷凶险远胜往昔，正合俺老孙迎难而上的脾胃！' },
      { id: 'wk_df_20', text: '兵解非终局，不过是下一棒蓄力前的深呼吸！' },
      { id: 'wk_df_21', text: '且把本局功果存入仙祠，仙根既壮，何惧重来！' },
      { id: 'wk_df_22', text: '等着罢泼魔，大圣爷去去就回！' }
    ]
  };

  // ============================================================================
  // 五、第 2 位主角：唐僧 (tangseng · 玄奘圣僧 · 九环锡杖 / 金莲净世)
  // 人设基调：外相慈悲守礼，内蕴十世金蝉孤勇铁骨；不作迂腐懦弱态，以“金刚怒目亦菩萨慈悲”执杖渡魔。
  // ============================================================================
  HERO_LINES.tangseng = {
    runStart: [
      { id: 'ts_rs_m1', cond: { charRun: 1 }, text: '昔日西行皆赖顽徒挡灾，今番难簿崩碎，贫僧当亲执九环锡杖，入劫替众生担火。' },
      { id: 'ts_rs_m5', cond: { charRun: 5 }, text: '五入残卷，锡杖铜环越震越清。原来所谓真经，不在灵山纸墨，而在破妄途中。' },
      { id: 'ts_rs_m10', cond: { charRun: 10 }, text: '十世修道曾因轻慢遭贬，今于碎卷十番苦战，方知一花一劫皆是众生血泪。' },
      { id: 'ts_rs_m15', cond: { charRun: 15 }, text: '第十五回踏足劫土。袈裟虽染风霜，贫僧这颗向西之心，比出长安时更坚百倍。' },
      { id: 'ts_rs_m20', cond: { charRun: 20 }, text: '二十轮回不退菩提！纵使漫天诸佛闭目，贫僧一杖一莲，亦要为苍生重开净土！' },
      { id: 'ts_rs_win', cond: { lastOutcome: 'victory' }, text: '前番虽渡金门，残卷怨气犹在沸腾。地狱未空，贫僧岂敢独享清闲莲台？' },
      { id: 'ts_rs_loss', cond: { lastOutcome: 'defeat' }, text: '前局一时不察，肉身兵解。然金蝉脱壳本无怖畏，拂去尘埃，再入魔障。' },
      { id: 'ts_rs_rev', cond: { lastRevived: true }, text: '感念大士杨柳垂慈救拔危难。今朝净瓶满贮，定当步步谨慎，不负佛恩。' },
      { id: 'ts_rs_asp1', cond: { aspectId: 'ts_aspect_dharma' }, text: '大乘万佛相凝于杖端！三枚金莲宝珠齐发，愿以此光涤尽前路妖氛。' },
      { id: 'ts_rs_asp2', cond: { aspectId: 'ts_aspect_vajra' }, text: '慈眉难劝凶顽鬼，便显怒目金刚身！饮甘露而铸金钟，杖落处邪魔辟易！' },
      { id: 'ts_rs_asp3', cond: { aspectId: 'ts_aspect_sutra' }, text: '紧箍本为收束狂心，今化业火真言——凡被金莲震慑之妖，皆受因果焚身！' },
      { id: 'ts_rs_01', text: '宁向西天一步死，不向东土一步生。纵前路万魔环伺，贫僧亦往矣。' },
      { id: 'ts_rs_02', text: '锦襕袈裟穿在身上不避刀兵，九环锡杖握在掌中却可点化冥顽。' },
      { id: 'ts_rs_03', text: '长安城外与太宗御兄击掌立誓犹在耳畔，此去碎卷，断不教大唐失望。' },
      { id: 'ts_rs_04', text: '阿弥陀佛。杀生若为止杀、破魔若为护生，这桩恶业因果，贫僧一力承当。' },
      { id: 'ts_rs_05', text: '净瓶甘露比常人多携一瓠，每度五魔更添生机，稳扎稳打自可渡厄。' },
      { id: 'ts_rs_06', text: '昔年凡胎肉眼屡受幻象蒙蔽，今修妙法慧眼，妖雾休想再乱禅心。' },
      { id: 'ts_rs_07', text: '心生，种种魔生；心灭，种种魔灭。且随锡杖清音，步入这第一重劫。' },
      { id: 'ts_rs_08', text: '悟空常笑为师手无缚鸡之力，今日若叫他瞧见这金莲爆破，定要惊讶合不拢嘴。' },
      { id: 'ts_rs_09', text: '洪福寺青灯古佛虽静，不及这碎卷风雷更能锤炼真如本性。' },
      { id: 'ts_rs_10', text: '手捻菩提百八珠，一步一莲入险途。但求荡平崎岖路，不问归期有与无。' },
      { id: 'ts_rs_11', text: '妙法紫书与九环锡杖最是契合，且看佛法无边如何化作破阵锋芒。' },
      { id: 'ts_rs_12', text: '世人只贪唐僧肉可延寿长生，却不知十世金蝉骨，最是硌碎妖牙！' },
      { id: 'ts_rs_13', text: '杖挑残云开暗夜，金身护体踏荆榛。诸邪退避，东土取经僧来也。' },
      { id: 'ts_rs_14', text: '不依外道，不惧群魔，唯凭方寸灵台一点明光，直趋大雷音！' }
    ],

    stageSolo: [
      { id: 'ts_st_reg1', cond: { regionId: 'liangjie_canyon' }, text: '两界山危崖森然。犹记当年揭去六字真言金帖，方与悟空结下半生师徒缘。' },
      { id: 'ts_st_reg2', cond: { regionId: 'heifeng_temple' }, text: '观音禅院烈火焚梁……一念贪嗔起，百年古刹与二百七十岁老僧尽化焦土，惜哉。' },
      { id: 'ts_st_reg3', cond: { regionId: 'huangfeng_ridge' }, text: '三昧黄风吹迷天地，须借断垣沙岩暂避风锋，稳住禅定再图前行。' },
      { id: 'ts_st_reg4', cond: { regionId: 'liusha_river' }, text: '八百流沙弱水凄寒，当年若无悟净以九骨化船，贫僧凡胎断难横渡此渊。' },
      { id: 'ts_st_reg5', cond: { regionId: 'baigu_crypt' }, text: '白骨森森怨气凝窟……昔日在此错写贬书赶走悟空，至今思之犹觉愧痛。' },
      { id: 'ts_st_reg6', cond: { regionId: 'pingding_grotto' }, text: '平顶山危石欲坠，车迟高台邪幡招展，步履轻提莫陷断崖。' },
      { id: 'ts_st_reg7', cond: { regionId: 'tongtian_glacier' }, text: '通天冰河一夜冻合，看似坦途实藏裂渊，修行人切忌贪快失足。' },
      { id: 'ts_st_reg8', cond: { regionId: 'xiliang_spiders' }, text: '红粉骷髅、情丝毒网，比刀兵更易蚀人道基。紧守灵台，片叶不沾身。' },
      { id: 'ts_st_reg9', cond: { regionId: 'huoyan_volcano' }, text: '八百里火焰熏天炙地，纵汗湿僧衣，这双芒鞋亦绝不向后半寸。' },
      { id: 'ts_st_reg10', cond: { regionId: 'bibo_dragonpalace' }, text: '祭赛金塔蒙尘，碧波深渊藏垢，且以佛光涤清这方污浊水脉。' },
      { id: 'ts_st_reg11', cond: { regionId: 'shituo_empire' }, text: '尸山血海筑成狮驼魔国……阿弥陀佛，今日不为清规，只为替万千冤魂讨还公道！' },
      { id: 'ts_st_reg12', cond: { regionId: 'lingshan_thunder' }, text: '凌云仙渡近在咫尺，脱胎换骨正在今朝。愈近佛土，愈要勘破伪佛幻相！' },
      { id: 'ts_st_mut1', cond: { mutatorId: 'mut_blood_moon' }, text: '血月乱心，群妖躁狂，然贫僧金莲净世真言亦随气机流转不息。' },
      { id: 'ts_st_mut2', cond: { mutatorId: 'mut_blitz_pocket' }, text: '山河缩地，强敌环伺，倒免了跋涉之苦，且接贫僧连珠法印！' },
      { id: 'ts_st_mut3', cond: { mutatorId: 'mut_heaven_thunder' }, text: '紫霄雷罚无分善恶劈落，引持盾凶妖入雷池，亦算借天威降魔。' },
      { id: 'ts_st_mut4', cond: { mutatorId: 'mut_alchemy_boom' }, text: '妖邪伏诛后仍有丹火余爆，超度之后须速退三步避其锋芒。' },
      { id: 'ts_st_mut5', cond: { mutatorId: 'mut_glass_cannon' }, text: '修罗破釜，色身虽脆如琉璃，杖下佛光却璀璨十倍，善用金身护盾便是。' },
      { id: 'ts_st_mut6', cond: { mutatorId: 'mut_golden_fortune' }, text: '遍地金铢原是世人供奉香火所化，暂借此财护法降魔。' },
      { id: 'ts_st_mut7', cond: { mutatorId: 'mut_giant_brawl' }, text: '法天象地之力灌注锡杖，一击震退群魔撞碎石垣，威势惊人！' },
      { id: 'ts_st_evt1', cond: { eventId: 'evt_ginseng_tree' }, text: '五庄观先天灵根形如婴孩，昔年贫僧未敢入口，今日因果两择但凭本心。' },
      { id: 'ts_st_evt2', cond: { eventId: 'evt_six_ear_mirror' }, text: '心魔古镜映照真妄。人有二心方生灾厉，一念纯真则魔影自消。' },
      { id: 'ts_st_evt3', cond: { eventId: 'evt_laozi_furnace' }, text: '道祖丹炉三昧真火，佛道本通一理，借炉火淬炼护法衣钵亦无不可。' },
      { id: 'ts_st_evt4', cond: { eventId: 'evt_guanyin_willow' }, text: '紫竹林垂柳拂尘，散碎修为尽归妙法本源，多谢菩萨指点迷津。' },
      { id: 'ts_st_bp3', cond: { bpCount: 3 }, text: '妙法天书三卷小成，九环锡杖第三击破障真气已然贯通！' },
      { id: 'ts_st_bp6', cond: { bpCount: 6 }, text: '六卷大成·法相庄严！金莲盛开之处，诸邪莫敢仰视！' },
      { id: 'ts_st_bp9', cond: { bpCount: 9 }, text: '九卷化境·万佛朝宗！梵音化雷霆，弹指间灰飞烟灭！' },
      { id: 'ts_st_01', text: '每净化五只妖邪便有一缕功德反哺气血，步步为营，自成生生不息之局。' },
      { id: 'ts_st_02', text: '远距离以穿透佛珠消磨敌势，近身则开金莲震晕护体，切莫乱了章法。' },
      { id: 'ts_st_03', text: '听这九环铜音铮然作响，恰似晨钟暮鼓警醒痴愚。' },
      { id: 'ts_st_04', text: '前路虽险，较之独自出雁门关孤身涉大漠之时，已多了几分从容。' },
      { id: 'ts_st_05', text: '妖魔执着长生皮囊，殊不知不生不灭全在心性，皮囊何足贪恋？' },
      { id: 'ts_st_06', text: '遇到持盾重卫不必硬击正面，翻身越过其背或以金莲大阵破之。' },
      { id: 'ts_st_07', text: '衣沾露水行荒径，杖引金光破夜魔。前方便是守关大殿了。' },
      { id: 'ts_st_08', text: '《心经》有云：照见五蕴皆空，度一切苦厄——且诵真言迎敌。' },
      { id: 'ts_st_09', text: '法力盈满如秋水，一珠一莲皆含雷音，妖氛虽盛不足为惧。' },
      { id: 'ts_st_10', text: '这件护身披挂灵气盎然，穿戴妥当也好少教徒儿们挂心。' },
      { id: 'ts_st_11', text: '残卷幻境随劫重塑，唯心中一点真常之道万古不移。' },
      { id: 'ts_st_12', text: '前方煞气凝聚成罡，镇守此难之妖王定非易与之辈，凝神以待。' }
    ],

    bossClash: [
      { id: 'ts_bc_t01', cond: { tribNo: 1 }, text: '金甲神将！昔日灵山一贬贫僧认罚，今番碎卷救世，天将亦拦不得金蝉归途！' },
      { id: 'ts_bc_t02', cond: { tribNo: 2 }, text: '水贼刘洪！洪江渡口弑父夺母十八载血仇，贫僧虽入空门，这一杖替江州冤魂讨还！' },
      { id: 'ts_bc_t04', cond: { tribNo: 4 }, text: '恶吏李彪！当年抛江不死，今日残卷重逢，休怪九环锡杖不讲慈悲！' },
      { id: 'ts_bc_t05', cond: { tribNo: 5 }, text: '双叉岭寅将军！当年凡躯落坑害折两名随从，今日贫僧亲自替旧仆超度你！' },
      { id: 'ts_bc_t09', cond: { tribNo: 9 }, text: '鹰愁涧水怪，惊走凡马尚可恕，阻断西行正法却难容！' },
      { id: 'ts_bc_t11', cond: { tribNo: 11 }, text: '黑风大王！锦襕袈裟乃佛门信物，岂容你趁火打劫办甚么佛衣邪会！' },
      { id: 'ts_bc_t12', cond: { tribNo: 12 }, text: '云栈洞的狂暴旧影？八戒早已归正受戒，你这贪嗔痴残念也该散了！' },
      { id: 'ts_bc_t13', cond: { tribNo: 13 }, text: '黄风怪！你在灵山脚下偷食琉璃清油尚不知悔，反敢兴妖风害命！' },
      { id: 'ts_bc_t14', cond: { tribNo: 14 }, text: '虎先锋！前番一张假虎皮将贫僧摄进洞府，今朝看清你真身，接金莲法印！' },
      { id: 'ts_bc_t15', cond: { tribNo: 15 }, text: '流沙恶煞！九世取经人的遗恨早化渡世宝船，你休想再沉贫僧半步！' },
      { id: 'ts_bc_t19', cond: { tribNo: 19 }, text: '五庄道傀！与镇元大仙八拜为交之谊贫僧未忘，但此道魔障不得不破！' },
      { id: 'ts_bc_t20', cond: { tribNo: 20 }, text: '白骨夫人！昔日贫僧愚昧受你三变挑拨赶走悟空，今朝新仇旧恨，一杖荡平！' },
      { id: 'ts_bc_t23', cond: { tribNo: 23 }, text: '奎木狼！金銮殿一碗咒水将贫僧化作笼中猛虎，奇耻大辱，今以佛光洗刷！' },
      { id: 'ts_bc_t24', cond: { tribNo: 24 }, text: '金角大王！莲花洞高悬之苦贫僧历历在目，紫金红葫芦收不得澄澈禅心！' },
      { id: 'ts_bc_t25', cond: { tribNo: 25 }, text: '银角大王！莫仗太上秘宝逞凶，邪心御正器，终遭天道反噬！' },
      { id: 'ts_bc_t26', cond: { tribNo: 26 }, text: '乌鸡国假王！夜半鬼王托梦泣血，推真主落井三年，还不束手伏法！' },
      { id: 'ts_bc_t28', cond: { tribNo: 28 }, text: '红孩儿！枯松涧假扮蒙难顽童欺贫僧善心，三昧邪火岂敌清净金莲！' },
      { id: 'ts_bc_t32', cond: { tribNo: 32 }, text: '黑水河鼍龙！假充渡船掀浪擒师，不思龙族正道，吃贫僧一记锡杖！' },
      { id: 'ts_bc_t34', cond: { tribNo: 34 }, text: '虎力大仙！车迟国五百僧人受尽苦役，高台坐禅贫僧赢你一回，杖下再赢一回！' },
      { id: 'ts_bc_t36', cond: { tribNo: 36 }, text: '灵感金鱼！冒充神明岁食陈家庄童男童女，菩萨慈悲留你，贫僧今日偏要重惩！' },
      { id: 'ts_bc_t39', cond: { tribNo: 39 }, text: '独角兕大王！金刚琢虽能套万般兵刃，且看能否套住贫僧满腔宏愿佛光！' },
      { id: 'ts_bc_t44', cond: { tribNo: 44 }, text: '毒敌女施主！锦绣琵琶洞留不住向道僧人，收起倒马毒桩，莫自误性命！' },
      { id: 'ts_bc_t46', cond: { tribNo: 46 }, text: '六耳猕猴！打伤贫僧抢走包袱欲自立取经门户——为师今日亲手辨出真假！' },
      { id: 'ts_bc_t48', cond: { tribNo: 48 }, text: '罗刹女施主！火焰山百姓酷热难熬，若不肯借芭蕉扇，贫僧只好得罪了！' },
      { id: 'ts_bc_t49', cond: { tribNo: 49 }, text: '牛魔王！枉具一身盖世神通却助纣阻道，且接贫僧金莲净世大阵！' },
      { id: 'ts_bc_t51', cond: { tribNo: 51 }, text: '九头妖禽！盗取金光寺舍利佛宝令众僧含冤披枷，天理昭昭岂容你猖獗！' },
      { id: 'ts_bc_t53', cond: { tribNo: 53 }, text: '黄眉妖童！妄设小雷音寺欺世盗名，贫僧前番误拜伪佛，今番一杖砸碎你的假莲台！' },
      { id: 'ts_bc_t57', cond: { tribNo: 57 }, text: '赛太岁！拆散朱紫帝后三年令国王卧病，紫金铃烟火难掩你恶行！' },
      { id: 'ts_bc_t59', cond: { tribNo: 59 }, text: '盘丝洞众女妖！贫僧化斋误入虎穴，今日锡杖在手，万道情丝一击尽断！' },
      { id: 'ts_bc_t60', cond: { tribNo: 60 }, text: '黄花观恶道！红枣毒茶害人阴损至极，千眼金光休想困住金蝉真身！' },
      { id: 'ts_bc_t62', cond: { tribNo: 62 }, text: '狮驼青狮白象！满城骸骨堆积如山，贫僧今日不开杀戒，天理何存！' },
      { id: 'ts_bc_t63', cond: { tribNo: 63 }, text: '金翅大鹏！纵你是如来母舅，屠戮一城生灵之罪，贫僧亦要杖击你顶门！' },
      { id: 'ts_bc_t65', cond: { tribNo: 65 }, text: '比丘白鹿国丈！竟用一千一百一十一个孩童心肝作药引——畜生，纳命来！' },
      { id: 'ts_bc_t69', cond: { tribNo: 69 }, text: '地涌夫人！黑松林三次诈善赚贫僧慈悲，吃一堑长一智，无底洞今日踏平！' },
      { id: 'ts_bc_t74', cond: { tribNo: 74 }, text: '九灵元圣！虽为天尊坐骑素有威名，既挡九九归真路，且受贫僧三道法印！' },
      { id: 'ts_bc_t78', cond: { tribNo: 78 }, text: '天竺玉兔！摄藏真公主抛球逼婚，贫僧身许佛门，岂受你广寒妖孽纠缠！' },
      { id: 'ts_bc_t80', cond: { tribNo: 80 }, text: '凌云渡凡胎心魔！十世皮囊今日脱却，斩断你这最后一缕执念方见真我！' },
      { id: 'ts_bc_t81', cond: { tribNo: 81 }, text: '通天老鼋！昔年失信忘问寿年，贫僧向你赔礼；然经卷关乎苍生，断不容浸毁！' },
      // 通用本色应战池 (48条)
      { id: 'ts_bc_g01', text: '阿弥陀佛。施主满身血煞孽债深重，既不肯放下屠刀，贫僧便替天收之！' },
      { id: 'ts_bc_g02', text: '休道僧人只会合十诵经，九环锡杖摇动之处，亦是降魔金刚杵！' },
      { id: 'ts_bc_g03', text: '妄图啖贫僧血肉求长生者不知凡几，至今未有一妖得偿所愿！' },
      { id: 'ts_bc_g04', text: '苦海无边，施主既执意沉沦阻道，且接这一记金莲净世！' },
      { id: 'ts_bc_g05', text: '佛门广大度有缘善信，不度怙恶不悛之凶魔——请亮兵刃！' },
      { id: 'ts_bc_g06', text: '十世修行攒下的定力，岂会被你区区几声妖吼动摇分毫？' },
      { id: 'ts_bc_g07', text: '贫僧自东土大唐而来，不求长生富贵，唯求扫清这满途妖氛！' },
      { id: 'ts_bc_g08', text: '看你灵智已开却不修正果，困在残卷助纣为虐，实在可悲可叹！' },
      { id: 'ts_bc_g09', text: '金身护盾已起，佛珠贯空待发——妖王请赐教！' },
      { id: 'ts_bc_g10', text: '慈悲若无雷霆护持，不过是纵恶行凶。今日贫僧不念赦生咒！' },
      { id: 'ts_bc_g11', text: '前番皆是悟空挺身在前，今朝玄奘独自登坛，亦不弱师门威风！' },
      { id: 'ts_bc_g12', text: '三才妙法已臻佳境，九环齐鸣，震碎你这虚妄魔躯！' },
      { id: 'ts_bc_g13', text: '邪风吹不灭心灯，毒火烧不毁愿力——放马过来罢！' },
      { id: 'ts_bc_g14', text: '残卷将你困于此殿日夜嘶吼，贫僧这一杖，亦是解你轮回之苦！' },
      { id: 'ts_bc_g15', text: '莫欺出家人衣衫单薄，胸中浩然正气可敌百万妖兵！' },
      { id: 'ts_bc_g16', text: '一步一叩首是修行，一杖一除魔亦是修行！' },
      { id: 'ts_bc_g17', text: '你既镇守此难关隘，贫僧便以真才实学堂堂正正渡过此劫！' },
      { id: 'ts_bc_g18', text: '金光灿烂照幽冥，魑魅魍魉安敢近身！' },
      { id: 'ts_bc_g19', text: '皮毛骨肉皆是假合，你贪图贫僧凡胎，岂非水中捞月？' },
      { id: 'ts_bc_g20', text: '善恶因果毫厘不爽，你在此残害生灵之债，今朝一并清算！' },
      { id: 'ts_bc_g21', text: '锡杖顿地金莲开，任你千钧重劈亦难伤护法金身！' },
      { id: 'ts_bc_g22', text: '这殿宇怨气冲霄，非用大乘雷音涤荡不可！' },
      { id: 'ts_bc_g23', text: '休逞口舌之利，且看是你的妖术诡谲，还是贫僧的法印堂皇！' },
      { id: 'ts_bc_g24', text: '心如止水鉴秋毫，你招式起落早映在贫僧清净禅心之中！' },
      { id: 'ts_bc_g25', text: '纵有铜头铁臂，难挡因果业火灼心！' },
      { id: 'ts_bc_g26', text: '贫僧立誓不取真经誓不东归，谁挡西路，便以锡杖开道！' },
      { id: 'ts_bc_g27', text: '袈裟猎猎迎狂沙，宝珠煌煌破夜叉——接招！' },
      { id: 'ts_bc_g28', text: '莫谓书生僧侣可欺，十万八千里风霜早已铸就金刚铁骨！' },
      { id: 'ts_bc_g29', text: '妖王请止步！再往前踏半寸，便是金莲净世雷池！' },
      { id: 'ts_bc_g30', text: '听一声佛号，接一记重杖，愿你来世莫堕妖途！' },
      { id: 'ts_bc_g31', text: '法相既成，群邪辟易，今日便在此殿了结这一难因果！' },
      { id: 'ts_bc_g32', text: '不借天兵神将，单凭一杖一钵，亦要闯出朗朗乾坤！' },
      { id: 'ts_bc_g33', text: '你眼中只有血食贪欲，怎知天地间尚有舍身求法之志！' },
      { id: 'ts_bc_g34', text: '杖端佛光已凝如满月，施主，得罪了！' },
      { id: 'ts_bc_g35', text: '狂魔乱舞终有尽，正法长明永不熄！' },
      { id: 'ts_bc_g36', text: '既入此门，生死早置度外，唯求破障前行！' },
      { id: 'ts_bc_g37', text: '净瓶甘露护持周身，纵持久鏖战亦不惧你凶焰！' },
      { id: 'ts_bc_g38', text: '看破红尘幻相，亦看破你这杀招虚实！' },
      { id: 'ts_bc_g39', text: '一念嗔心起百万障门开，施主既不肯退，唯有一战！' },
      { id: 'ts_bc_g40', text: '金蝉本非池中物，今化雷音震九霄！' },
      { id: 'ts_bc_g41', text: '休用幻影迷魂计，慧眼澄明，纤毫毕现！' },
      { id: 'ts_bc_g42', text: '宝杖横胸定风波，且度眼前拦路魔！' },
      { id: 'ts_bc_g43', text: '此关不过，西行难圆——贫僧全力以赴便是！' },
      { id: 'ts_bc_g44', text: '妖气虽盛如墨云，难遮灵台一轮金日！' },
      { id: 'ts_bc_g45', text: '莫再执迷残卷旧恨，接我普度法球！' },
      { id: 'ts_bc_g46', text: '金刚怒目降龙虎，锡杖生花破鬼关！' },
      { id: 'ts_bc_g47', text: '传送法阵就在殿后，还请妖王借道！' },
      { id: 'ts_bc_g48', text: '善哉，既言辞无益，便在杖下见分晓罢！' }
    ],

    bossKill: [
      { id: 'ts_bk_01', text: '阿弥陀佛，尘缘已了，愿你散入轮回莫再为恶。' },
      { id: 'ts_bk_02', text: '九环收音，金莲归寂——此难已渡。' },
      { id: 'ts_bk_03', text: '尘归尘，土归土，残卷一页重归清明。' },
      { id: 'ts_bk_04', text: '执念既消，这缕灵蕴便借来护持西行正法。' },
      { id: 'ts_bk_05', text: '善恶终有报，强梁难久长。且赴前路法阵。' },
      { id: 'ts_bk_06', text: '拂去袈裟微尘，前头尚有重劫待破。' },
      { id: 'ts_bk_07', text: '以雷霆手段显菩萨心肠，愿此方生灵自此安宁。' },
      { id: 'ts_bk_08', text: '妖氛尽散天宇澈，好一件护法宝衣，收下了。' },
      { id: 'ts_bk_09', text: '昔日需劳烦徒儿苦战，今日为师亦算独当一面了。' },
      { id: 'ts_bk_10', text: '金光化雨洗凶坛，合十礼毕向西行。' },
      { id: 'ts_bk_11', text: '皮囊凶焰皆如梦幻泡影，此刻方得大自在。' },
      { id: 'ts_bk_12', text: '净瓶微温，气血俱足，可入传送门择道而行。' },
      { id: 'ts_bk_13', text: '不枉一番苦斗，这页难簿的戾气总算抚平。' },
      { id: 'ts_bk_14', text: '妙法通玄破坚甲，纵是千年老妖亦难逆正道。' },
      { id: 'ts_bk_15', text: '诵一卷往生短咒，送施主脱离这碎卷苦海。' },
      { id: 'ts_bk_16', text: '锡杖无血，唯留清辉——善哉。' },
      { id: 'ts_bk_17', text: '狂风歇处见真如，继续赶路罢。' },
      { id: 'ts_bk_18', text: '此关妖王虽悍，终敌不过定慧双修。' },
      { id: 'ts_bk_19', text: '收拢散落金铢与披挂，土地祠中再作休整。' },
      { id: 'ts_bk_20', text: '一莲净世，万籁俱寂。' },
      { id: 'ts_bk_21', text: '不生嗔恨，不恋战功，只管向下一重劫迈步。' },
      { id: 'ts_bk_22', text: '魔高一尺，道高一丈，古人诚不我欺。' },
      { id: 'ts_bk_23', text: '但愿来世化作山间清风，莫再贪恋红尘血食。' },
      { id: 'ts_bk_24', text: '铜环轻响定乾坤，又过西行一险滩。' },
      { id: 'ts_bk_25', text: '护体金光未破，禅心愈发坚凝。' },
      { id: 'ts_bk_26', text: '多谢施主成全这一番磨砺，贫僧告辞。' },
      { id: 'ts_bk_27', text: '劫火焚尽见金莲，法阵已开！' },
      { id: 'ts_bk_28', text: '心无挂碍，故无恐怖——此战甚稳。' },
      { id: 'ts_bk_29', text: '邪术千般终归幻，不及堂堂正法一击。' },
      { id: 'ts_bk_30', text: '将妖丹戾气炼化为纯白灵蕴，善莫大焉。' },
      { id: 'ts_bk_31', text: '前路分岔，且观天机择一善地而入。' },
      { id: 'ts_bk_32', text: '若悟空见为师这般利落收招，定要拍手称奇。' },
      { id: 'ts_bk_33', text: '黑雾消融日色新，芒鞋踏破岭头云。' },
      { id: 'ts_bk_34', text: '强横一时终化土，唯余正气满乾坤。' },
      { id: 'ts_bk_35', text: '调匀呼吸，拾取遗宝，莫误了西行吉时。' },
      { id: 'ts_bk_36', text: '怒目相收归低眉，前途漫漫尚需精进。' },
      { id: 'ts_bk_37', text: '三才妙法更上一层，破障之力愈显从容。' },
      { id: 'ts_bk_38', text: '凶威已敛，此殿终复清净。' },
      { id: 'ts_bk_39', text: '佛珠归腕，锡杖拄地，且入仙祠小憩。' },
      { id: 'ts_bk_40', text: '纵是神仙失管之兽，犯下恶业亦难逃惩戒。' },
      { id: 'ts_bk_41', text: '一念清净破群邪，这关过了。' },
      { id: 'ts_bk_42', text: '苦修十世非虚度，杖底风雷证道心。' },
      { id: 'ts_bk_43', text: '妖王既伏，周遭小孽亦当闻风自散。' },
      { id: 'ts_bk_44', text: '检视这件神品法衣，倒与锦襕袈裟相得益彰。' },
      { id: 'ts_bk_45', text: '不骄不躁，离九九归真又近了一程。' },
      { id: 'ts_bk_46', text: '金莲谢处传送门生，善哉，前行！' },
      { id: 'ts_bk_47', text: '破除一分外魔，便澄明一分本心。' },
      { id: 'ts_bk_48', text: '任尔狂沙毒火，难侵清凉佛国。' },
      { id: 'ts_bk_49', text: '收杖合掌，谢过此劫砥砺。' },
      { id: 'ts_bk_50', text: '这缕残卷金芒已然修复，甚好。' },
      { id: 'ts_bk_51', text: '步步生莲非虚语，全凭血汗踏出来。' },
      { id: 'ts_bk_52', text: '凶顽已化清风去，且向灵山更上层。' },
      { id: 'ts_bk_53', text: '梵音余袅荡尘埃，宝匣霞光映玉台。' },
      { id: 'ts_bk_54', text: '但行好事，莫问前程凶吉，入阵便是。' },
      { id: 'ts_bk_55', text: '金钟未碎妖先陨，守正出奇果是良策。' },
      { id: 'ts_bk_56', text: '替这方受苦百姓松一口长气，阿弥陀佛。' },
      { id: 'ts_bk_57', text: '法印煌煌诛恶首，清风朗月照禅衣。' },
      { id: 'ts_bk_58', text: '休整片刻，下一重秘境定更凶险。' },
      { id: 'ts_bk_59', text: '因果账清，贫僧这便过关了。' },
      { id: 'ts_bk_60', text: '莫叹佛门手段烈，只缘乱世虎狼多。' },
      { id: 'ts_bk_61', text: '灵台明彻如镜，再无阴霾可蔽。' },
      { id: 'ts_bk_62', text: '好一场法力交锋，幸未辱玄奘之名。' },
      { id: 'ts_bk_63', text: '拾起灵蕴功德，赴土地庙择路西进！' },
      { id: 'ts_bk_64', text: '诸恶莫作，众善奉行——施主安息罢。' },
      { id: 'ts_bk_65', text: '九环清脆鸣凯歌，踏阵再启新程。' },
      { id: 'ts_bk_66', text: '佛光普照之处，魑魅自当消融。' },
      { id: 'ts_bk_67', text: '且收神通入袖，从容步入法门。' },
      { id: 'ts_bk_68', text: '一劫既平一劫生，唯持恒心破万难。' },
      { id: 'ts_bk_69', text: '金蝉振翼出樊笼，此关不足留我步。' },
      { id: 'ts_bk_70', text: '魔障已除，道途清朗。' },
      { id: 'ts_bk_71', text: '饮一口清泉甘露，洗去满身硝烟。' },
      { id: 'ts_bk_72', text: '邪氛退散瑞云升，善哉善哉！' },
      { id: 'ts_bk_73', text: '不负太宗皇帝重托，再下一城。' },
      { id: 'ts_bk_74', text: '杖指西天无退路，勇猛精进正当时！' },
      { id: 'ts_bk_75', text: '满地遗珍皆归护法之用，起行！' },
      { id: 'ts_bk_76', text: '幻灭真存，这一难总算功行完满。' },
      { id: 'ts_bk_77', text: '纵历百劫千磨，此心皎然如初。' },
      { id: 'ts_bk_78', text: '化戾气为祥和，此乃真渡化也。' },
      { id: 'ts_bk_79', text: '金门微启露霞光，继续西行！' },
      { id: 'ts_bk_80', text: '降伏外魔易，调伏自心亦未敢懈怠。' },
      { id: 'ts_bk_81', text: '锡杖轻提跨玉阶，再探前山险峰。' },
      { id: 'ts_bk_82', text: '妖魂已靖，且入仙祠参悟仙缘。' },
      { id: 'ts_bk_83', text: '万里长风吹僧袂，一笑渡关山。' },
      { id: 'ts_bk_84', text: '此劫圆满，向前莫停！' }
    ],

    reviveMiracle: [
      { id: 'ts_rv_01', text: '多谢观音大士杨柳甘露垂慈！真经未复，玄奘怎敢在此半途合眼！' },
      { id: 'ts_rv_02', text: '金莲重绽护残躯，百劫千生志不移！众妖退后，贫僧再立禅坛！' },
      { id: 'ts_rv_03', text: '十世金蝉历经九死犹能脱壳重鸣，区区一挫，岂能断我西行宏愿！' },
      { id: 'ts_rv_04', text: '南海净水涤尽创痛，护体佛光震退群邪——这一杖，更添三分金刚怒火！' },
      { id: 'ts_rv_05', text: '色身虽伤，法身不坏！承蒙菩萨点化，贫僧当以更稳步法破此迷局！' },
      { id: 'ts_rv_06', text: '江流儿满月漂江尚有天佑，今日身负苍生重望，定当化险为夷！' },
      { id: 'ts_rv_07', text: '佛光贯顶气血全复！方才贫僧大意失守，今番定不教妖孽再逞凶威！' },
      { id: 'ts_rv_08', text: '一滴甘露生万朵金莲，苦海翻波处，正是证道涅槃时！' },
      { id: 'ts_rv_09', text: '不入死地，焉知生机之贵？重执九环锡杖，荡涤满堂妖氛！' },
      { id: 'ts_rv_10', text: '大士慈悲赐金身三息无敌，贫僧定借此良机扭转乾坤！' },
      { id: 'ts_rv_11', text: '袈裟浴火重焕瑞彩，心灯不灭，万魔难侵！' },
      { id: 'ts_rv_12', text: '阿弥陀佛，死生一线间方悟无畏真谛——妖孽，看杖！' },
      { id: 'ts_rv_13', text: '徒儿们尚在卷外凝望，为师岂可轻言放弃！重起金莲阵！' },
      { id: 'ts_rv_14', text: '甘露洗髓，金钟罩体，纵是刀山火海亦再闯一遭！' },
      { id: 'ts_rv_15', text: '枯木逢春花更艳，残躯浴佛力弥坚！' },
      { id: 'ts_rv_16', text: '借南海慈航之力重返战局，此番定要一鼓作气度化凶顽！' },
      { id: 'ts_rv_17', text: '九环重鸣惊鬼魄，玄奘归来志愈刚！' },
      { id: 'ts_rv_18', text: '凡胎虽痛不改行愿，金光荡处，诸邪退散！' },
      { id: 'ts_rv_19', text: '感念佛恩浩荡，且以手中锡杖扫平余孽以为报效！' },
      { id: 'ts_rv_20', text: '劫波渡尽莲台现，一息尚存战不休！' },
      { id: 'ts_rv_21', text: '破而后立，澄心凝神，看清妖招再出雷霆一击！' },
      { id: 'ts_rv_22', text: '金身重铸无瑕秽，再向西天踏险峰！' }
    ],

    runVictory: [
      { id: 'ts_vc_01', cond: { firstWin: true }, text: '破劫金门大开！昔日赖三徒护送方抵灵山，今番亲手执杖破尽四劫，方知真经原在自心！' },
      { id: 'ts_vc_02', text: '万朵金莲铺就归真路，残卷戾气消弭大半，善哉，功德圆满！' },
      { id: 'ts_vc_03', text: '十万八千里风霜重走一程，不负东土苍生，亦不负门下四位高徒。' },
      { id: 'ts_vc_04', text: '收起九环锡杖，满身灵蕴归入仙祠。唯愿三界早复清平，再无杀劫。' },
      { id: 'ts_vc_05', text: '怒目金刚相收，复归慈悲僧衣。能止戈者，方为真武、真佛法。' },
      { id: 'ts_vc_06', text: '终劫魔尊伏首听经，漫天劫云化作五色祥瑞，此行不虚！' },
      { id: 'ts_vc_07', text: '轻慢佛法之旧愆，今以百战破障之汗水洗净，灵台一片澄明。' },
      { id: 'ts_vc_08', text: '真经无字亦无声，全在劈波斩浪、护佑良善的一举一动之间。' },
      { id: 'ts_vc_09', text: '妙法修至极处，一珠一叶皆可定鼎乾坤。且携功果归营小憩。' },
      { id: 'ts_vc_10', text: '回望来路尸山火海皆成净土，贫僧这双芒鞋总算没白踏破。' },
      { id: 'ts_vc_11', text: '霞光映照紫金钵，八十一难碎卷又拼合数页，善莫大焉。' },
      { id: 'ts_vc_12', text: '若太宗御兄得见今日之景，当知玄奘未曾辜负通关文牒上一印一字。' },
      { id: 'ts_vc_13', text: '以身入局方知悟空当年斩妖之艰辛，师徒同心，其利断金。' },
      { id: 'ts_vc_14', text: '钟声悠远传霄汉，魔窟翻作宝莲池。阿弥陀佛！' },
      { id: 'ts_vc_15', text: '不恋莲台果位，只要残卷尚存一缕妖氛，贫僧随时愿再执杖出征。' },
      { id: 'ts_vc_16', text: '三才圆融，衣钵璀璨，这一局定慧兼备，堪称完满。' },
      { id: 'ts_vc_17', text: '风定云开见月明，千难万险总成空。凯旋归去！' },
      { id: 'ts_vc_18', text: '渡人渡己亦渡魔，金门背后，便是澄澈天地。' },
      { id: 'ts_vc_19', text: '将本局灵蕴悉数供入土地仙祠，厚培根基以迎更高劫度。' },
      { id: 'ts_vc_20', text: '九环余音绕梁久，一袭袈裟映日红。圆满归真！' },
      { id: 'ts_vc_21', text: '心猿意马皆调伏，万水千山等闲渡。' },
      { id: 'ts_vc_22', text: '善始善终，且回营中与诸徒共话此番禅机！' }
    ],

    runDefeat: [
      { id: 'ts_df_01', text: '阿弥陀佛……贫僧修为尚浅，暂且兵解归祠，淬炼仙根后再来渡化。' },
      { id: 'ts_df_02', text: '十世修行尚历经九番生死，今日一挫不过再添一桩磨砺耳。' },
      { id: 'ts_df_03', text: '步法微滞未能避开杀招，记下此妖路数，下局定以金莲先发制之。' },
      { id: 'ts_df_04', text: '皮囊虽碎，向西本愿不灭。携此灵蕴归营，重整袈裟再发！' },
      { id: 'ts_df_05', text: '只恨甘露早竭，护盾未续……修行之路果真容不得半点侥幸。' },
      { id: 'ts_df_06', text: '莫教悟空八戒见了心焦，调息片刻，贫僧即刻重入残卷。' },
      { id: 'ts_df_07', text: '此劫妖风果真凶戾，须回土地庙再精研三才妙法方可克敌。' },
      { id: 'ts_df_08', text: '一叶障目失了先机，拂去心尘，来局必更从容。' },
      { id: 'ts_df_09', text: '宁向西天一步死，纵兵解百回，亦绝无退回东土之理！' },
      { id: 'ts_df_10', text: '锡杖暂敛金光，将沿途所得功果封存仙祠，来日方长。' },
      { id: 'ts_df_11', text: '不怨天道艰险，只省己身不足——再修再战便是。' },
      { id: 'ts_df_12', text: '残卷幻身化作点点佛尘归去，真灵不昧，静待重开。' },
      { id: 'ts_df_13', text: '方才若早半息开启金莲护盾便可化险，下次切记果决。' },
      { id: 'ts_df_14', text: '百折不回方称玄奘，这点风浪焉能阻我求法之心！' },
      { id: 'ts_df_15', text: '妖氛未靖而身先陨，愧对山中生灵，片刻后定回来铲除祸根。' },
      { id: 'ts_df_16', text: '凡圣同途皆需苦练，且归营地淬炼气血仙根。' },
      { id: 'ts_df_17', text: '胜败一如潮起潮落，唯菩提道心恒久不动。' },
      { id: 'ts_df_18', text: '暂别凶坛归古庙，重燃心灯照夜途。' },
      { id: 'ts_df_19', text: '法力运转稍欠圆融，下局当择回蓝护体之披挂。' },
      { id: 'ts_df_20', text: '纵历千般挫折，九环锡杖终有敲开大雷音之日！' },
      { id: 'ts_df_21', text: '灵蕴归宗不虚此行，养精蓄锐，转瞬重来。' },
      { id: 'ts_df_22', text: '善哉，暂合双目定禅机，再睁眼时破重围！' }
    ]
  };

  // ============================================================================
  // 六、第 3 位主角：猪八戒 (bajie · 天蓬元帅 · 上宝沁金九齿耙 / 天罡旋风耙)
  // 人设基调：市井烟火气与诙谐嘟囔兼具，惦记肉包金铢，但亮出老君九齿钉钯时尽显北极天蓬宿将霸气！
  // ============================================================================
  HERO_LINES.bajie = {
    runStart: [
      { id: 'bj_rs_m1', cond: { charRun: 1 }, text: '散伙的话老猪嚷嚷了八百遍，真到了难簿崩碎这节骨眼，还得俺天蓬元帅扛钯顶上去！' },
      { id: 'bj_rs_m5', cond: { charRun: 5 }, text: '第五回进这碎卷了！别说，小妖爆出来的大肉包热乎劲儿地道，吃得老猪浑身是劲！' },
      { id: 'bj_rs_m10', cond: { charRun: 10 }, text: '十进十出！那帮妖怪见了老猪这旋风钉钯都绕着走——谁还敢叫俺呆子？' },
      { id: 'bj_rs_m15', cond: { charRun: 15 }, text: '第十五趟差事！当年统领天河八万水兵都没这么勤快过，打完可得好好睡一觉！' },
      { id: 'bj_rs_m20', cond: { charRun: 20 }, text: '二十局满当当！高老庄的女婿当得，三界破劫的天蓬大元帅更当得——走着！' },
      { id: 'bj_rs_win', cond: { lastOutcome: 'victory' }, text: '上回刚把终劫妖尊筑成筛子，肚里肉包还没消食呢，走，再进图搜刮一圈宝贝！' },
      { id: 'bj_rs_loss', cond: { lastOutcome: 'defeat' }, text: '呸呸！上回饿着肚子脚底打滑叫妖怪偷了便宜，揉揉肚皮，老猪连本带利讨回来！' },
      { id: 'bj_rs_rev', cond: { lastRevived: true }, text: '多亏菩萨上回赏口甘露水救命，老猪也是有面子的人，这局铁定争口气！' },
      { id: 'bj_rs_asp1', cond: { aspectId: 'bj_aspect_glutton' }, text: '饕餮吞天相！吃一个肉包长一截真血，满血还能化护盾——这才是老猪的本命神功！' },
      { id: 'bj_rs_asp2', cond: { aspectId: 'bj_aspect_marshal' }, text: '重现昔日北极天蓬星河威仪！旋风钯一起，十丈内的妖怪全给老猪乖乖吸过来挨宰！' },
      { id: 'bj_rs_asp3', cond: { aspectId: 'bj_aspect_berserk' }, text: '狂齿破军相！别看老猪平时和气，真把俺打出火气来，血越少钉钯抡得越疯！' },
      { id: 'bj_rs_01', text: '此钯乃太上老君神冰铁亲自锤炼、五方五帝攒修——哪个不长眼的敢拿脑壳试齿？' },
      { id: 'bj_rs_02', text: '猴哥总嫌俺走得慢，慢有慢的稳当！一百六十八点厚血底子，站着让小妖挠都不疼！' },
      { id: 'bj_rs_03', text: '一挥砍，二回勾拉怪，三裂地重砸！老猪这三板钯使出来，神仙也得退避三舍！' },
      { id: 'bj_rs_04', text: '翠兰呐，不是老猪不回高老庄耕田，实在是这三界难簿没老猪修补不拢啊！' },
      { id: 'bj_rs_05', text: '先说好，路上爆出来的金铢归老猪管账，神品披挂先紧着俺这身板挑！' },
      { id: 'bj_rs_06', text: '天罡三十六变正宗传人在此！莫拿猴哥那七十二般花哨小术跟老猪比厚实！' },
      { id: 'bj_rs_07', text: '勒紧青布直裰，扛稳五千斤沁金钯——前头的妖怪，备好热腾腾肉包迎客喽！' },
      { id: 'bj_rs_08', text: '当年蟠桃会多喝了两盅摔下云头错投猪胎，相貌虽丑，元帅的骨气可没丢半分！' },
      { id: 'bj_rs_09', text: '金刚绿书跟老猪最配，血厚防高还能旋风吸血，硬桥硬马碾过去便是！' },
      { id: 'bj_rs_10', text: '挑担子老猪嫌沉，可抡钉钯砸妖精洞门，老猪浑身上下使不完的牛劲！' },
      { id: 'bj_rs_11', text: '师父放心，有老猪这身饕餮厚皮挡在前头，冷箭毒刺全当挠痒痒！' },
      { id: 'bj_rs_12', text: '听说这残卷里藏着不少仙家法宝匣？嘿嘿，老猪鼻子灵，闻着宝味儿就找过去了！' },
      { id: 'bj_rs_13', text: '莫笑老猪大耳朵扇风，听声辨位躲暗算，比那急躁猴子稳当多啦！' },
      { id: 'bj_rs_14', text: '开荤开荤！天罡战车转起来，把前路妖魔全卷成肉馅儿！' }
    ],

    stageSolo: [
      { id: 'bj_st_reg1', cond: { regionId: 'liangjie_canyon' }, text: '两界山这破索桥晃晃悠悠的，可得承住老猪这身腱子肉与五千斤钉钯！' },
      { id: 'bj_st_reg2', cond: { regionId: 'heifeng_temple' }, text: '黑风山禅院烧得乌漆嘛黑，可惜了斋堂里那几大锅白米饭和素什锦！' },
      { id: 'bj_st_reg3', cond: { regionId: 'huangfeng_ridge' }, text: '黄风岭连着高老庄地界！迎面刮来一嘴沙子，呸呸，等打完顺道瞧瞧老丈人去？' },
      { id: 'bj_st_reg4', cond: { regionId: 'liusha_river' }, text: '八百里流沙河？论水战，当年天河八万水兵全归老猪调遣，踩着木排照样横行！' },
      { id: 'bj_st_reg5', cond: { regionId: 'baigu_crypt' }, text: '白骨洞阴飕飕的连口热乎吃的都没有，当年白骨精拿青蛙癞蛤蟆充米饭骗老猪，忒损！' },
      { id: 'bj_st_reg6', cond: { regionId: 'pingding_grotto' }, text: '平顶山！上回老猪巡山想偷个懒睡一觉，结果被银角捉去吊在梁上，这回定找补回来！' },
      { id: 'bj_st_reg7', cond: { regionId: 'tongtian_glacier' }, text: '通天河冻得跟镜子似的！当年老猪背着师父踩碎冰掉进水里冻麻了爪子，记忆犹新呐！' },
      { id: 'bj_st_reg8', cond: { regionId: 'xiliang_spiders' }, text: '盘丝岭毒泽？咳咳，上回变鲇鱼钻腿弯被蛛丝绊了百十个跟头，这回老猪绝不轻敌！' },
      { id: 'bj_st_reg9', cond: { regionId: 'huoyan_volcano' }, text: '娘哎，八百里火焰山烤得老猪猪油都快滋出来了，赶紧杀过去找芭蕉扇凉快凉快！' },
      { id: 'bj_st_reg10', cond: { regionId: 'bibo_dragonpalace' }, text: '水底水晶宫？这可回老猪老本行了！水下浮力轻巧，抡起九齿钯就跟玩儿似的！' },
      { id: 'bj_st_reg11', cond: { regionId: 'shituo_empire' }, text: '狮驼城妖怪是真多！当年老猪被白象鼻子卷去捆在槽头，今日非拿钉钯豁开他的长鼻！' },
      { id: 'bj_st_reg12', cond: { regionId: 'lingshan_thunder' }, text: '灵山祥云软绵绵的！嘿，等破了终劫封个净坛使者，四大部洲贡品全归老猪包圆！' },
      { id: 'bj_st_mut1', cond: { mutatorId: 'mut_blood_moon' }, text: '血月照顶，旋风钉钯冷却转得飞快，一路转一路吸血，神仙也打不死老猪！' },
      { id: 'bj_st_mut2', cond: { mutatorId: 'mut_blitz_pocket' }, text: '缩地成寸好哇！老猪最烦跑远路，出门两步就是精英怪掉天书，省力气！' },
      { id: 'bj_st_mut3', cond: { mutatorId: 'mut_heaven_thunder' }, text: '轰隆隆乱劈紫霄雷，吓老猪一跳！正好用钉钯二段回勾把盾兵拽进雷坑里劈熟！' },
      { id: 'bj_st_mut4', cond: { mutatorId: 'mut_alchemy_boom' }, text: '丹炉火丹把小妖炸得外焦里嫩，就是小心别站在尸首边上贪捡铜板！' },
      { id: 'bj_st_mut5', cond: { mutatorId: 'mut_glass_cannon' }, text: '修罗破釜扣血加攻？难得老猪也体验一回一钯秒人的脆皮刺客威风！' },
      { id: 'bj_st_mut6', cond: { mutatorId: 'mut_golden_fortune' }, text: '哗啦啦满地金铢！老猪耳朵眼小藏不下，全揣怀里加暴击伤害喽！' },
      { id: 'bj_st_mut7', cond: { mutatorId: 'mut_giant_brawl' }, text: '法天象地！这一钯子拍飞出去撞在石墙上，妖怪连骨头渣子都得碎！' },
      { id: 'bj_st_evt1', cond: { eventId: 'evt_ginseng_tree' }, text: '人参果！上回囫囵吞枣连核都没尝出味儿，这回可得细细嚼一嚼！' },
      { id: 'bj_st_evt2', cond: { eventId: 'evt_six_ear_mirror' }, text: '心魔古镜？照出个假老猪莫非还要跟我抢肉包吃？一钯敲碎了干净！' },
      { id: 'bj_st_evt3', cond: { eventId: 'evt_laozi_furnace' }, text: '老君的八卦炉！俺这把九齿钉钯就是这炉子出品的娘家人，重铸准给面子！' },
      { id: 'bj_st_evt4', cond: { eventId: 'evt_guanyin_willow' }, text: '菩萨杨柳枝一拂，杂七杂八的修为全归金刚大道，浑身肥膘都变铁甲啦！' },
      { id: 'bj_st_bp3', cond: { bpCount: 3 }, text: '金刚天书满三卷！第三钯裂地重砸还带破甲气浪，带劲！' },
      { id: 'bj_st_bp6', cond: { bpCount: 6 }, text: '六卷大成！天蓬真身气血如海，跑起来风驰电掣！' },
      { id: 'bj_st_bp9', cond: { bpCount: 9 }, text: '九卷化境！钉钯落处雷火诛绝，老猪今天便是横推三界的无敌元帅！' },
      { id: 'bj_st_01', text: '香！刚打翻的小妖又爆了个热腾腾大白肉包，一口闷下去气血蹭蹭涨！' },
      { id: 'bj_st_02', text: '谁说胖子翻滚不利索？老猪这叫肉弹滚地龙，绕到盾兵背后就是一顿好筑！' },
      { id: 'bj_st_03', text: '猴哥只晓得往前猛冲，哪像老猪稳扎稳打，边打边吸血，半滴甘露都省得喝！' },
      { id: 'bj_st_04', text: '第二钯回勾最是趁手，想跑的弓箭手全给老猪勾回怀里吃裂地重击！' },
      { id: 'bj_st_05', text: '这残卷里的宝箱倒大方，开出件好护甲比发十两饷银还叫人舒坦！' },
      { id: 'bj_st_06', text: '肚里有食，心里不慌，管他前头是龙潭还是虎穴，平推过去！' },
      { id: 'bj_st_07', text: '遥想当年掌管天河水军，旌旗十万，如今单人独钯亦有一夫当关之勇！' },
      { id: 'bj_st_08', text: '腾空千钧下砸！借老猪这二百斤分量坠地，震得群妖七荤八素！' },
      { id: 'bj_st_09', text: '金铢越攒越多，等回了营地，看谁还笑话老猪穷酸！' },
      { id: 'bj_st_10', text: '前头大殿黑风阵阵，守关妖王八成是个硬骨头，先把肚皮垫饱再进去揍他！' },
      { id: 'bj_st_11', text: '钉钯九齿寒光闪，专治各种花里胡哨的跳梁小丑！' },
      { id: 'bj_st_12', text: '一步一个脚印，把这破难簿子一页页给它熨平喽！' }
    ],

    bossClash: [
      { id: 'bj_bc_t01', cond: { tribNo: 1 }, text: '金甲天将？昔日在北极紫微宫当差时你还给老猪牵过马呢，闪开闪开！' },
      { id: 'bj_bc_t05', cond: { tribNo: 5 }, text: '双叉岭的大花猫！拿虎肉下酒虽然柴了点，剥张虎皮给师父垫马鞍正好！' },
      { id: 'bj_bc_t06', cond: { tribNo: 6 }, text: '熊山君、特处士！跟老猪比皮厚？看我九齿钉钯把你的玄铁盾刨出九个窟窿！' },
      { id: 'bj_bc_t11', cond: { tribNo: 11 }, text: '黑风洞的黑熊怪！当年老猪还没入伙没赶上揍你，今儿补上一顿天罡旋风钯！' },
      { id: 'bj_bc_t12', cond: { tribNo: 12 }, text: '嚯！云栈洞猪刚鬣魔影？好家伙，自己打从前的自己——看天蓬正法收了你这股野性！' },
      { id: 'bj_bc_t13', cond: { tribNo: 13 }, text: '黄风耗子精！在你高老庄隔壁吹沙子迷人眼，吃老猪一记重钯！' },
      { id: 'bj_bc_t14', cond: { tribNo: 14 }, text: '虎先锋！当年便是老猪一钯筑破你的假虎皮要了你的命，今儿再送你一程！' },
      { id: 'bj_bc_t15', cond: { tribNo: 15 }, text: '流沙河水煞！当年老猪跟沙师弟在水底大战三次不分胜负，揍你这假影绰绰有余！' },
      { id: 'bj_bc_t17', cond: { tribNo: 17 }, text: '锦绣庄绣球幻灵！呸呸，撞天婚穿珍珠汗衫的当老猪不上了，看钯！' },
      { id: 'bj_bc_t19', cond: { tribNo: 19 }, text: '五庄观道尊傀！人参果是老猪撺掇猴哥去打的，有账冲老猪这身厚皮算！' },
      { id: 'bj_bc_t20', cond: { tribNo: 20 }, text: '白骨粉骷髅！当年老猪嘴馋信了你的假斋饭还撺掇师父念咒，这回一钯砸烂你替猴哥出气！' },
      { id: 'bj_bc_t23', cond: { tribNo: 23 }, text: '黄袍怪奎木狼！前番二十回合老猪诈败钻草丛，今朝天书大成，正面把你筑下台去！' },
      { id: 'bj_bc_t24', cond: { tribNo: 24 }, text: '金角大王！把老猪吊在莲花洞梁上准备蒸着吃是吧？今儿老猪先把你拍扁！' },
      { id: 'bj_bc_t25', cond: { tribNo: 25 }, text: '银角小童！你们太上老君铸的九齿钉钯在此，见了师门重器还不跪迎！' },
      { id: 'bj_bc_t26', cond: { tribNo: 26 }, text: '乌鸡国青毛狮！哄我去井底背死国王害猴哥捉弄我，这笔闷亏全算你头上！' },
      { id: 'bj_bc_t28', cond: { tribNo: 28 }, text: '红孩儿小侄子！把老猪装在皮袋里挂廊下差点熏成腊肉，吃你猪叔一记旋风钯！' },
      { id: 'bj_bc_t32', cond: { tribNo: 32 }, text: '黑水河鼍龙！翻船把老猪和师父一块儿捉下水，天蓬水帅岂能在水沟里栽两次！' },
      { id: 'bj_bc_t34', cond: { tribNo: 34 }, text: '车迟国虎力老道！三清观里的贡果全进老猪肚皮了，再送你一钉钯消消食！' },
      { id: 'bj_bc_t36', cond: { tribNo: 36 }, text: '通天河金鱼精！当年老猪跟沙师弟在水底堵门揍你，今儿做道红烧大鲤鱼——管你是金鱼！' },
      { id: 'bj_bc_t39', cond: { tribNo: 39 }, text: '青牛精！你那金刚琢也是老君炉里出来的，咱俩都是兜率宫兵刃，硬碰硬试试！' },
      { id: 'bj_bc_t42', cond: { tribNo: 42 }, text: '如意真仙！当年子母河害得老猪挺着大肚子疼死个人，新仇旧恨一块儿筑！' },
      { id: 'bj_bc_t44', cond: { tribNo: 44 }, text: '琵琶洞毒蝎子！上回蜇得老猪嘴唇肿得像猪尿泡，这回天罡护体看你还怎么蜇！' },
      { id: 'bj_bc_t46', cond: { tribNo: 46 }, text: '六耳假猴子！平时真猴哥欺负老猪就算了，你个冒牌货也敢在猪祖宗面前龇牙？' },
      { id: 'bj_bc_t48', cond: { tribNo: 48 }, text: '铁扇公主！火焰山当年老猪帮你家老牛解围，没成想他在玉面狐狸那儿——得，动手罢！' },
      { id: 'bj_bc_t49', cond: { tribNo: 49 }, text: '大力牛魔王！摩云洞前老猪与猴哥夹击打得你现白牛身，今日单挑也不怵你混铁棍！' },
      { id: 'bj_bc_t51', cond: { tribNo: 51 }, text: '九头虫！碧波潭水战敢跟天蓬元帅叫板？九颗脑袋正好一齿筑一颗！' },
      { id: 'bj_bc_t52', cond: { tribNo: 52 }, text: '荆棘岭老树精与杏仙！吟诗老猪不在行，一钉钯连根刨树倒是拿手绝活！' },
      { id: 'bj_bc_t53', cond: { tribNo: 53 }, text: '黄眉怪！人种袋收了老猪几回，这回旋风钉钯搅烂你的破布口袋！' },
      { id: 'bj_bc_t55', cond: { tribNo: 55 }, text: '七绝山红鳞大蟒！八百里稀柿同都是老猪变大白猪拱开的，斩你更是手到擒来！' },
      { id: 'bj_bc_t57', cond: { tribNo: 57 }, text: '赛太岁！摇你那破铃铛熏人？老猪厚皮减伤六成，顶着浓烟照样掀翻你！' },
      { id: 'bj_bc_t59', cond: { tribNo: 59 }, text: '盘丝洞七蜘蛛！濯垢泉绊得老猪好苦，休想再用银丝缠我，天罡战车碾过去！' },
      { id: 'bj_bc_t60', cond: { tribNo: 60 }, text: '百眼蜈蚣！黄花观一杯毒茶放倒老猪，今日定把你百节毒壳砸成扁片！' },
      { id: 'bj_bc_t62', cond: { tribNo: 62 }, text: '青狮白象！上回用长鼻子卷老猪耳朵眼藏私房钱那出，今儿连本带利揍回来！' },
      { id: 'bj_bc_t63', cond: { tribNo: 63 }, text: '金翅大鹏雕！飞得快有甚用？进了这方大殿，吃老猪回勾钉钯乖乖落地！' },
      { id: 'bj_bc_t69', cond: { tribNo: 69 }, text: '无底洞白毛耗子！做半截观音偷吃灯油，老猪一钯把你三百里鼠窝全刨塌！' },
      { id: 'bj_bc_t73', cond: { tribNo: 73 }, text: '豹头山黄狮精！偷谁的不好，敢偷老猪心尖上的九齿钉钯开钉钯嘉会？找打！' },
      { id: 'bj_bc_t74', cond: { tribNo: 74 }, text: '九灵元圣老狮祖！上回一口叼走老猪，今番老猪炼成金刚不坏，看你咬不咬得动！' },
      { id: 'bj_bc_t78', cond: { tribNo: 78 }, text: '广寒宫捣药玉兔！当年在天宫你还只是嫦娥怀里的小白兔，也敢下界跟天蓬动粗？' },
      { id: 'bj_bc_t81', cond: { tribNo: 81 }, text: '通天河老王八——呸，老鼋兄！有话好好商量，敢泡湿经书老猪可拿钯撬龟壳了！' },
      // 通用本色应战池 (47条)
      { id: 'bj_bc_g01', text: '呔！别看老猪肚子圆，上宝沁金钯重五千零四十八斤，擦着一点就是九个透明窟窿！' },
      { id: 'bj_bc_g02', text: '嚷嚷甚么吃唐僧肉！师父皮包骨头有啥嚼头，先尝尝你猪祖宗这顿铁齿大餐！' },
      { id: 'bj_bc_g03', text: '嘿嘿，守关大妖王！打赢你必爆高品神装和大把金铢，老猪就不客气啦！' },
      { id: 'bj_bc_g04', text: '当年北极紫微大帝座下第一战将在此，区区山野毛神也敢班门弄斧！' },
      { id: 'bj_bc_g05', text: '来来来，老猪气血厚得跟城墙似的，咱俩站桩硬换血看谁先趴下！' },
      { id: 'bj_bc_g06', text: '猴哥打架爱耍帅，老猪打架讲实惠——一钯震晕、旋风吸血，稳稳送你归西！' },
      { id: 'bj_bc_g07', text: '瞧这洞府油水挺足，把你收拾利索了，老猪正好搜搜后厨有没有蒸熟的馒头！' },
      { id: 'bj_bc_g08', text: '少拿眼珠子瞪老猪！论凶相，云栈洞当妖王那会儿十里八乡小儿止啼呢！' },
      { id: 'bj_bc_g09', text: '天罡战车一旦转起来，刀砍不进火烧不疼，你有几管血够老猪吸的？' },
      { id: 'bj_bc_g10', text: '别看俺平时挑担喊累，遇上硬茬子妖王，老猪从来不往师弟后头缩！' },
      { id: 'bj_bc_g11', text: '你那兵刃轻飘飘的像根烧火棍，来碰碰太上老君六丁神火炼出的沁金钯！' },
      { id: 'bj_bc_g12', text: '打完这架老猪还要去土地庙泡脚休整呢，麻溜儿把脖子伸过来！' },
      { id: 'bj_bc_g13', text: '想跑？钉钯第二式回勾专治滑不留手的泥鳅精，过来罢你！' },
      { id: 'bj_bc_g14', text: '满殿妖风吹得老猪衣裳鼓鼓囊囊，正好借风势给你来记泰山压顶！' },
      { id: 'bj_bc_g15', text: '这残卷把你们全放出来凑业绩，老猪今儿就当替灵山清理门户了！' },
      { id: 'bj_bc_g16', text: '啧啧，个头倒不小，打趴下够爆三五个回血大肉包了吧？' },
      { id: 'bj_bc_g17', text: '莫耍阴招暗箭！老猪翻个滚躲开前摇，反手一记裂地重击拍扁你！' },
      { id: 'bj_bc_g18', text: '八万天河水兵的军阵老猪都摆弄过，你这三板斧套路早看穿喽！' },
      { id: 'bj_bc_g19', text: '有道是行家伸伸手，便知有没有——看老猪这身金刚修为压不压得死你！' },
      { id: 'bj_bc_g20', text: '妖怪听真！今日不叫天庭救兵，单凭你猪爷爷一双肉掌一柄钯！' },
      { id: 'bj_bc_g21', text: '哼哼，气势挺唬人，就是不知挨上一记震地重钯会不会跪下唱山歌！' },
      { id: 'bj_bc_g22', text: '传送法阵就在你屁股后头，识相的让条道，不识相的筑成肉酱！' },
      { id: 'bj_bc_g23', text: '老猪今天不藏拙、不诈败，拿十成十的天蓬真本事会会你！' },
      { id: 'bj_bc_g24', text: '金光护甲穿在身，九齿寒芒耀日星——泼怪拿命来！' },
      { id: 'bj_bc_g25', text: '别看猴哥名头响，当年降妖除魔脏活重活哪回少得了老猪搭把手！' },
      { id: 'bj_bc_g26', text: '吃饱喝足力气旺，正好拿你这守关大将练练筋骨！' },
      { id: 'bj_bc_g27', text: '你那点护体妖气还不够老猪三钯子刨的，接招罢！' },
      { id: 'bj_bc_g28', text: '举耙向天笑，群魔尽折腰——来战来战！' },
      { id: 'bj_bc_g29', text: '莫怪老猪下手没轻重，实在是这沁金钯见了妖血自己往外蹿！' },
      { id: 'bj_bc_g30', text: '修得千年道行不易，偏要在残卷里当拦路虎，合该倒霉！' },
      { id: 'bj_bc_g31', text: '威风凛凛天蓬相，今日重现此殿中！看钯！' },
      { id: 'bj_bc_g32', text: '任你上蹿下跳，老猪一记大旋风全给你罩在里头绞碎！' },
      { id: 'bj_bc_g33', text: '痛快！好久没见着这么抗揍的大块头了，过瘾！' },
      { id: 'bj_bc_g34', text: '少扯灵山旧交情，进了老猪的攻击圈，天王老子也先吃三钯！' },
      { id: 'bj_bc_g35', text: '大耳招风听八方，钉钯裂地动四海——受死！' },
      { id: 'bj_bc_g36', text: '把你身上的极品披挂乖乖交出来，老猪给你留个全尸！' },
      { id: 'bj_bc_g37', text: '嘿，前摇红光闪这么亮，生怕老猪瞧不见你要出招啊？' },
      { id: 'bj_bc_g38', text: '三界之中论筑地开山、破甲碎骨，老猪认第二没人敢认第一！' },
      { id: 'bj_bc_g39', text: '既占了这一难的名头，就别怪老猪拿你刷功德换灵蕴啦！' },
      { id: 'bj_bc_g40', text: '浑身肥膘皆铁甲，一腔豪气冲九霄！来呀！' },
      { id: 'bj_bc_g41', text: '先吃一记迎面挥砍，再尝一招回勾拉扯，包你舒坦！' },
      { id: 'bj_bc_g42', text: '莫眨眼，老猪这旋风战车一旦发动，连人带盾一块儿碾！' },
      { id: 'bj_bc_g43', text: '西行路上无怂汉，天蓬今日立头功！' },
      { id: 'bj_bc_g44', text: '你吼你的，我筑我的，看谁嗓门硬还是钉钯硬！' },
      { id: 'bj_bc_g45', text: '甘露满壶血满槽，耗也耗死你这泼魔！' },
      { id: 'bj_bc_g46', text: '休走！把守关妖丹留下再咽气！' },
      { id: 'bj_bc_g47', text: '哈哈，开席开席！吃你猪爷爷当头一钯！' }
    ],

    bossKill: [
      { id: 'bj_bk_01', text: '嘿嘿，还当多硬的骨头，九齿钯一筑就散架喽！' },
      { id: 'bj_bk_02', text: '哇呀！爆出好闪亮的极品披挂，老猪发财啦！' },
      { id: 'bj_bk_03', text: '拍拍肚皮收工！这趟没白忙活，金铢灵蕴大丰收！' },
      { id: 'bj_bk_04', text: '就这点斤两也敢拦天蓬元帅？下辈子长点眼力见！' },
      { id: 'bj_bk_05', text: '旋风钯还没转过瘾呢，你咋就躺地上吐白沫了？' },
      { id: 'bj_bk_06', text: '舒坦！边打边吸，打完一架血条比进门时还满！' },
      { id: 'bj_bk_07', text: '这回要是猴哥在场，头功也得归俺老猪领！' },
      { id: 'bj_bk_08', text: '扛起钉钯擦擦汗，赶紧进传送门去土地庙歇脚吃包！' },
      { id: 'bj_bk_09', text: '老君铸的沁金钯果真神威，一筑一个准！' },
      { id: 'bj_bk_10', text: '把地上掉的金子全搂干净，半个铜板也不能落给小妖！' },
      { id: 'bj_bk_11', text: '哼哼，敢跟金刚厚皮流硬刚，牙都给你崩掉！' },
      { id: 'bj_bk_12', text: '妖王伏诛，这页破难簿总算叫老猪给拍平了！' },
      { id: 'bj_bk_13', text: '有来无回！天河水帅的威风，今日总算抖足了！' },
      { id: 'bj_bk_14', text: '大肉包塞进嘴，神兵披挂穿在身——美滋滋！' },
      { id: 'bj_bk_15', text: '叫你小瞧胖子！胖子发起飙来地动山摇！' },
      { id: 'bj_bk_16', text: '省下两口甘露水留到下关喝，老猪精打细算着呢！' },
      { id: 'bj_bk_17', text: '妖风散尽露晴天，挑条肥美富贵的分岔门继续走！' },
      { id: 'bj_bk_18', text: '裂地重击收尾，震得老猪手掌心都麻酥酥的，痛快！' },
      { id: 'bj_bk_19', text: '莫怪老猪不客气，谁叫你怀里揣着好装备不交出来！' },
      { id: 'bj_bk_20', text: '师父要是瞧见老猪这般神勇，准得多赏两碗斋饭！' },
      { id: 'bj_bk_21', text: '一力降十会，花架子再多也顶不住实心铁钯！' },
      { id: 'bj_bk_22', text: '收钯入肩！这洞府清静了，走人！' },
      { id: 'bj_bk_23', text: '啧啧，灵蕴攒了一大兜，回营够升两级仙根啦！' },
      { id: 'bj_bk_24', text: '打铁还得看天蓬，三下五除二解决战斗！' },
      { id: 'bj_bk_25', text: '还想放风沙暗算？老猪霸体一开直接糊你脸上！' },
      { id: 'bj_bk_26', text: '又过一难！照这势头，净坛使者的金饭碗稳了！' },
      { id: 'bj_bk_27', text: '满地紫光金光晃得老猪眼花，快捡快捡！' },
      { id: 'bj_bk_28', text: '哼，神仙坐骑也好山大王也罢，挨上九齿钯众生平等！' },
      { id: 'bj_bk_29', text: '气不喘心不跳，再来一尊妖王老猪也照单全收！' },
      { id: 'bj_bk_30', text: '把这缕残魂炼成灵蕴，也算替你积了点阴德！' },
      { id: 'bj_bk_31', text: '好家伙，方才那一钯暴击数字跳得真喜庆！' },
      { id: 'bj_bk_32', text: '不散伙了不散伙了，打妖怪爆装备比耕田来钱快多了！' },
      { id: 'bj_bk_33', text: '传送法阵嗡嗡转，前头不知又有甚么新花样！' },
      { id: 'bj_bk_34', text: '稳稳当当拿捏！老猪出马，一个顶俩！' },
      { id: 'bj_bk_35', text: '抖抖直裰上的灰尘，天蓬元帅风采依旧！' },
      { id: 'bj_bk_36', text: '叫你狂，连老猪一层护甲都没蹭破就歇菜了！' },
      { id: 'bj_bk_37', text: '这身金刚修为越叠越厚，简直是移动铁桶阵！' },
      { id: 'bj_bk_38', text: '除暴安良兼顾打牙祭，一举两得！' },
      { id: 'bj_bk_39', text: '痛快痛快！好久没抡得这么酣畅淋漓了！' },
      { id: 'bj_bk_40', text: '妖丹碎裂金门开，老猪大摇大摆过关喽！' },
      { id: 'bj_bk_41', text: '回勾拉住接重砸，这套祖传连招百试百灵！' },
      { id: 'bj_bk_42', text: '前头土地公公快烧好热茶，老猪来挑仙缘啦！' },
      { id: 'bj_bk_43', text: '邪魔授首，四海清宁——咱老猪也是大功臣！' },
      { id: 'bj_bk_44', text: '瞧见没？不是光猴哥能单挑妖王，老猪一样干净利索！' },
      { id: 'bj_bk_45', text: '这件新爆出来的披挂评分更高，换上换上！' },
      { id: 'bj_bk_46', text: '风停火灭妖声绝，唯余老猪笑哈哈！' },
      { id: 'bj_bk_47', text: '扛稳钉钯迈四方步，下一劫走起！' },
      { id: 'bj_bk_48', text: '任你奸猾似鬼，也逃不出五帝攒修的九齿锋芒！' },
      { id: 'bj_bk_49', text: '打完收工，肚子刚好饿了三分，正合适！' },
      { id: 'bj_bk_50', text: '一钯定乾坤，残卷添新功！' },
      { id: 'bj_bk_51', text: '这波血赚不亏，气血蓝量全满进下关！' },
      { id: 'bj_bk_52', text: '小样儿，下回投胎记得躲着长耳朵拎钉钯的走！' },
      { id: 'bj_bk_53', text: '天罡气劲未消，一鼓作气闯向终劫！' },
      { id: 'bj_bk_54', text: '满堂妖气一扫空，还得看咱天蓬真功夫！' },
      { id: 'bj_bk_55', text: '捡完战利品莫磨蹭，好宝贝还在下一关等着呢！' },
      { id: 'bj_bk_56', text: '震天一钯破重关，潇潇洒洒入仙坛！' },
      { id: 'bj_bk_57', text: '翠兰要是见着老猪这么威风，准保不再嫌我能吃！' },
      { id: 'bj_bk_58', text: '邪魔歪道一锅烩，痛快至极！' },
      { id: 'bj_bk_59', text: '收起旋风神通，大步流星跨法阵！' },
      { id: 'bj_bk_60', text: '骨头虽硬，终究硬不过神冰铁！' },
      { id: 'bj_bk_61', text: '这一难彻底销账，老猪给你画个大勾！' },
      { id: 'bj_bk_62', text: '金光闪闪满地宝，笑得老猪合不拢嘴！' },
      { id: 'bj_bk_63', text: '稳字当头，步步为赢，走着！' },
      { id: 'bj_bk_64', text: '妖王已躺平，前路亮堂堂！' },
      { id: 'bj_bk_65', text: '九齿生风扫落叶，再来十个也不惧！' },
      { id: 'bj_bk_66', text: '把旧装备炼化成金铢回口蓝，日子就得精打细算！' },
      { id: 'bj_bk_67', text: '北极战神余威在，岂容宵小逞凶狂！' },
      { id: 'bj_bk_68', text: '利利索索，没耽误半点工夫！' },
      { id: 'bj_bk_69', text: '残页金光入怀，离大功告成不远啦！' },
      { id: 'bj_bk_70', text: '喝口甘露润润嗓，哼着小曲进法门！' },
      { id: 'bj_bk_71', text: '这波撞墙破甲加暴击，神仙也扛不住哇！' },
      { id: 'bj_bk_72', text: '洞主既灭，余孽皆散，大获全胜！' },
      { id: 'bj_bk_73', text: '老猪今天状态火热，挡我者披靡！' },
      { id: 'bj_bk_74', text: '好一柄沁金宝钯，越使越顺手！' },
      { id: 'bj_bk_75', text: '休整妥当，挑扇油水最厚的传送门进发！' },
      { id: 'bj_bk_76', text: '妖氛涤尽清风来，老猪抖擞再登台！' },
      { id: 'bj_bk_77', text: '没花半点冤枉力气，轻松拿下！' },
      { id: 'bj_bk_78', text: '功德入账，灵蕴满仓，走也！' },
      { id: 'bj_bk_79', text: '天蓬一怒山河震，此劫已平！' },
      { id: 'bj_bk_80', text: '捡齐宝贝进土地庙，瞧瞧今番有啥好仙缘！' },
      { id: 'bj_bk_81', text: '哈哈，守关妖王不过尔尔！' },
      { id: 'bj_bk_82', text: '一钯扫清拦路石，昂首阔步向西行！' },
      { id: 'bj_bk_83', text: '爽快！这顿架打得比吃席还痛快！' },
      { id: 'bj_bk_84', text: '过关过关，下一处秘境走起！' }
    ],

    reviveMiracle: [
      { id: 'bj_rv_01', text: '哎哟喂，多谢观音菩萨赏口甘露水！老猪皮糙命硬，阎王爷也休想收我！' },
      { id: 'bj_rv_02', text: '满血复活再加金钟护盾！方才哪个不开眼的暗算老猪？吃我翻盘大旋风钯！' },
      { id: 'bj_rv_03', text: '行李还没分、斋饭还没吃够，老猪哪舍得就这么兵解！起！' },
      { id: 'bj_rv_04', text: '南海杨柳甘露比高老庄陈酿还提神！浑身骨头嘎嘣响，妖怪们受死罢！' },
      { id: 'bj_rv_05', text: '当年从天庭摔下凡间都没摔死，这点伤算个球！天蓬元帅重新披挂上阵！' },
      { id: 'bj_rv_06', text: '金光护体三息半无敌！老猪今天就顶着佛光把你们全筑翻在地！' },
      { id: 'bj_rv_07', text: '呸呸，差点叫那弼马温看了笑话！抖起威风，老猪要把场子找回来！' },
      { id: 'bj_rv_08', text: '菩萨垂怜救命之恩，老猪拿前头妖王的脑袋当供品还愿！' },
      { id: 'bj_rv_09', text: '大难不死必有大肉包吃！气血撑得满满当当，再来大战三百回合！' },
      { id: 'bj_rv_10', text: '天罡真气重聚丹田！方才只是老猪打了个盹儿，真本事现在才亮出来！' },
      { id: 'bj_rv_11', text: '佛光震开群小妖，九齿沁金钯寒芒暴涨——谁敢再上前一步！' },
      { id: 'bj_rv_12', text: '老猪命硬堪比金刚钻，想砸碎我？崩断你的妖牙！' },
      { id: 'bj_rv_13', text: '一口仙露下肚，连陈年暗伤都好利索了，痛快开抡！' },
      { id: 'bj_rv_14', text: '师父和沙师弟还等着老猪凯旋呢，岂能倒在半道上！' },
      { id: 'bj_rv_15', text: '金莲托足起风雷，看俺天蓬战车碾碎这帮杂碎！' },
      { id: 'bj_rv_16', text: '嘿，摸清你的阴招套路了，这一回老猪稳扎稳打拍扁你！' },
      { id: 'bj_rv_17', text: '死里逃生胆更壮，抡圆钉钯破重围！' },
      { id: 'bj_rv_18', text: '多亏菩萨搭救，省得回土地庙重跑一趟冤枉路！干他！' },
      { id: 'bj_rv_19', text: '金身熠熠照肥躯，谁道老猪不丈夫！接钯！' },
      { id: 'bj_rv_20', text: '气血充盈护盾厚，这波逆转稳如泰山！' },
      { id: 'bj_rv_21', text: '惹毛了猪祖宗，今天不把这妖殿拆成平地绝不收兵！' },
      { id: 'bj_rv_22', text: '甘露灌顶神威振，天蓬归来扫千军！' }
    ],

    runVictory: [
      { id: 'bj_vc_01', cond: { firstWin: true }, text: '哈哈！破劫金门开喽！谁再说老猪只会牵马挑担？这四劫妖尊可是老猪一钯一钯筑平的！' },
      { id: 'bj_vc_02', text: '功德圆满！怀里揣满灵蕴金铢，回营地蒸上十笼大白肉包好好犒劳自己！' },
      { id: 'bj_vc_03', text: '昔日天河元帅印虽丢，今日凭这柄九齿钯重证金刚威名，值了！' },
      { id: 'bj_vc_04', text: '漫天金莲瑞气飘香，闻着比五庄观人参果还馋人——凯旋归去喽！' },
      { id: 'bj_vc_05', text: '这趟既没散伙也没丢人，把残卷修补得服服帖帖，猴哥见了也得服气！' },
      { id: 'bj_vc_06', text: '全身神装闪金光，血厚防高输出猛，这才是天蓬大元帅的完全体！' },
      { id: 'bj_vc_07', text: '终劫大妖倒地那一刻，老猪差点乐出声来——稳稳通关！' },
      { id: 'bj_vc_08', text: '十万八千里风里来雨里去，老猪虽爱发牢骚，关键硬仗可从没掉过链子！' },
      { id: 'bj_vc_09', text: '把赚来的灵蕴全存进土地庙，把仙根喂得白白胖胖，下回挑战更高劫度！' },
      { id: 'bj_vc_10', text: '净坛使者也好，天蓬元帅也罢，能护住师门平定乱局便是真本事！' },
      { id: 'bj_vc_11', text: '扛着钉钯哼着小曲跨过金门，神仙日子不过如此！' },
      { id: 'bj_vc_12', text: '群妖扫尽山河净，从此过路百姓再不用担惊受怕啦！' },
      { id: 'bj_vc_13', text: '饕餮厚皮配三才天书，硬生生在万妖丛中趟出一条康庄大道！' },
      { id: 'bj_vc_14', text: '回去跟沙师弟喝两盅素酒，吹吹今儿单挑终劫妖尊的威风事迹！' },
      { id: 'bj_vc_15', text: '金门霞光暖洋洋的，晒得老猪想在祥云上美美睡个午觉！' },
      { id: 'bj_vc_16', text: '八十一难残页又合拢几张，老猪这双手不仅会种地，更会补天机！' },
      { id: 'bj_vc_17', text: '不贪虚名只求痛快，这一局杀得解气、赚得盆满钵满！' },
      { id: 'bj_vc_18', text: '沁金钯上瑞彩流转，老君见了也得夸老猪没埋没这件神兵！' },
      { id: 'bj_vc_19', text: '任他三昧火、黄风沙，终究败在老猪这一腔憨勇之下！' },
      { id: 'bj_vc_20', text: '大功告成！收兵回营，下回再来痛快搜刮一番！' },
      { id: 'bj_vc_21', text: '福星高照功果满，笑拍肚皮踏金莲！' },
      { id: 'bj_vc_22', text: '痛快收官！天蓬出马，万劫皆平！' }
    ],

    runDefeat: [
      { id: 'bj_df_01', text: '哎哟，双拳难敌四手，老猪先撤回土地庙垫垫肚子，养足力气再来收拾他！' },
      { id: 'bj_df_02', text: '不亏不亏！攒下的灵蕴一分不少全带回营地了，升完仙根下局准赢！' },
      { id: 'bj_df_03', text: '啧，方才贪捡地上那件装备慢了半拍……下回先清完场再摸宝！' },
      { id: 'bj_df_04', text: '好汉不吃眼前亏！这关妖怪火力太猛，回营换个本命法相再来会他！' },
      { id: 'bj_df_05', text: '大肉包差一口没吃上，不然准能把血吸回来……可惜可惜！' },
      { id: 'bj_df_06', text: '别嚷嚷散伙！老猪只是回营地歇口气，九齿钉钯还没抡够呢！' },
      { id: 'bj_df_07', text: '这残卷第三劫果然凶险，下回留足甘露净瓶再进殿硬刚！' },
      { id: 'bj_df_08', text: '胜败兵家常事，当年天河水战也有退潮时候，涨潮时再淹死这帮妖精！' },
      { id: 'bj_df_09', text: '揉揉屁股站起来！老猪这身厚皮抗造，睡一觉又是条好汉！' },
      { id: 'bj_df_10', text: '记下这妖怪的阴招了，下回撞见，老猪提前开旋风霸体顶过去！' },
      { id: 'bj_df_11', text: '幸亏灵蕴入库不丢，多攒两趟把气血上限堆高，看谁打得动我！' },
      { id: 'bj_df_12', text: '咳咳，一时失手不算输，千万别告诉猴哥省得他编排我！' },
      { id: 'bj_df_13', text: '肚皮饿得咕咕叫，影响元帅发挥了——回营先整两屉包子！' },
      { id: 'bj_df_14', text: '差一点就能凑齐六卷金刚觉醒，下局择路专挑双倍天书门走！' },
      { id: 'bj_df_15', text: '兵解归祠光溜溜，留得青山在，哪怕没柴烧！' },
      { id: 'bj_df_16', text: '法力见底没转出旋风钯，下回挑件回蓝披挂就稳当了！' },
      { id: 'bj_df_17', text: '妖怪你先狂着，等你猪爷爷去土地庙淬炼完仙根再来拆你骨头！' },
      { id: 'bj_df_18', text: '西行路长着呢，绊一跤打个滚，拍拍土继续往前拱！' },
      { id: 'bj_df_19', text: '老猪从不记隔夜仇，因为下局当场就回来报了！' },
      { id: 'bj_df_20', text: '暂退一步海阔天空，整顿衣甲再战魔窟！' },
      { id: 'bj_df_21', text: '灵蕴到手便是赚，回祠堂升级去喽！' },
      { id: 'bj_df_22', text: '等着！老猪喝碗热汤去去便回！' }
    ]
  };

  // ============================================================================
  // 七、第 4 位主角：沙悟净 (wujing · 卷帘大将 · 降妖月牙宝杖 / 流沙玄水阵)
  // 人设基调：冷峻沉毅、重诺如山；曾历灵霄碎盏与流沙穿胸三百剑，执月宫梭罗仙木宝杖，控场断后寸步不让。
  // ============================================================================
  HERO_LINES.wujing = {
    runStart: [
      { id: 'wj_rs_m1', cond: { charRun: 1 }, text: '昔日挑担默行十万八千里，世人只当某是随行苦力；今残卷重开，且亮卷帘大将真章。' },
      { id: 'wj_rs_m5', cond: { charRun: 5 }, text: '五入碎卷。流沙河底七日穿胸之剑尚且熬过，此间妖氛岂能动摇某分毫。' },
      { id: 'wj_rs_m10', cond: { charRun: 10 }, text: '十番征伐，月牙杖下水刃愈凝。天庭旧规早已看淡，唯护师门周全之诺重逾千钧。' },
      { id: 'wj_rs_m15', cond: { charRun: 15 }, text: '第十五次踏入险途。话不必多，凡阻西行正道者，尽入流沙玄水阵中伏诛。' },
      { id: 'wj_rs_m20', cond: { charRun: 20 }, text: '二十轮回砥砺，昔年碎盏之罪早化浩荡正气——今朝沙悟净，只为苍生镇此天地关！' },
      { id: 'wj_rs_win', cond: { lastOutcome: 'victory' }, text: '前番虽已荡平终劫，残页余孽复生。守卫之责一日未竟，宝杖一日不入鞘。' },
      { id: 'wj_rs_loss', cond: { lastOutcome: 'defeat' }, text: '前局断后失守，某深以为耻。重束护腕，此番必将防线推进至妖尊殿前。' },
      { id: 'wj_rs_rev', cond: { lastRevived: true }, text: '昔蒙大士指点出流沙，前局又承甘露续命。此身百死不辞，定报佛恩。' },
      { id: 'wj_rs_asp1', cond: { aspectId: 'wj_aspect_abyss' }, text: '弱水三千相！流沙漩涡冷却骤减，重现八百里鹅毛不浮之绝命寒渊！' },
      { id: 'wj_rs_asp2', cond: { aspectId: 'wj_aspect_crescent' }, text: '朔月追魂相！起手便斩出折返穿墙月牙气刃，盾甲虽厚亦难挡背刺寒芒！' },
      { id: 'wj_rs_asp3', cond: { aspectId: 'wj_aspect_guardian' }, text: '卷帘镇岳相！腾空千钧下砸即开护法宝幢，稳立阵中如泰山压顶！' },
      { id: 'wj_rs_01', text: '此杖乃月宫梭罗仙木所琢，吴刚伐枝、鲁班亲制，外轻内重五千零四十八斤！' },
      { id: 'wj_rs_02', text: '先以流沙水阵聚拢迟滞群妖，再借卷帘神卫破控增伤三成——稳中求胜。' },
      { id: 'wj_rs_03', text: '灵霄宝殿侍立千年，见过无数仙佛真容；下界作乱者几斤几两，某一目了然。' },
      { id: 'wj_rs_04', text: '大师兄锐不可当，二师兄力大无穷，而查漏补缺、步步封杀，正是沙僧本分。' },
      { id: 'wj_rs_05', text: '颈上九颗骷髅早已化船消业，如今唯余胸中一团澄澈玄水真气。' },
      { id: 'wj_rs_06', text: '不争头功，不逞口舌，月牙宝杖所指之处，邪祟莫越雷池半步。' },
      { id: 'wj_rs_07', text: '妙法与金刚兼修，攻有穿透水刃，守有十二成天生铁骨，可堪持久苦战。' },
      { id: 'wj_rs_08', text: '失手打碎玻璃盏遭贬凡尘，塞翁失马，反教某炼出这一身不屈战骨。' },
      { id: 'wj_rs_09', text: '紧扣僧衣，横提月铲。前路纵有万箭齐发，某亦一力迎之。' },
      { id: 'wj_rs_10', text: '深水无声流最急，寡言之士刃最寒。启程破劫！' },
      { id: 'wj_rs_11', text: '师父常赞沙僧老成持重，今入残卷独战群魔，更须滴水不漏。' },
      { id: 'wj_rs_12', text: '听风声肃杀，前头必有恶战。调匀内息，稳步推进。' },
      { id: 'wj_rs_13', text: '南天门外曾执戟，流沙河底亦称尊。区区秘境，何足道哉！' },
      { id: 'wj_rs_14', text: '杖端朔月寒光满，踏破重云第一关。' }
    ],

    stageSolo: [
      { id: 'wj_st_reg1', cond: { regionId: 'liangjie_canyon' }, text: '两界山断崖深涧山风凛冽，借上升气流腾跃索桥，切忌踏空。' },
      { id: 'wj_st_reg2', cond: { regionId: 'heifeng_temple' }, text: '古刹火海余烬未熄，飞檐高台错落，正好居高临下释放朔月水刃。' },
      { id: 'wj_st_reg3', cond: { regionId: 'huangfeng_ridge' }, text: '大漠黄风横推人步，贴靠风蚀岩柱立定脚跟，再布阵聚歼沙匪。' },
      { id: 'wj_st_reg4', cond: { regionId: 'liusha_river' }, text: '重返八百里流沙旧地……弱水寒气依旧刺骨，然某心境早已今非昔比。' },
      { id: 'wj_st_reg5', cond: { regionId: 'baigu_crypt' }, text: '幽冥洞窟上下双层暗道纵横，狭路布下玄水漩涡，可一举封死尸魔去路。' },
      { id: 'wj_st_reg6', cond: { regionId: 'pingding_grotto' }, text: '危岩栈桥踏之欲崩，须速过莫恋战，引追兵坠入万仞深渊。' },
      { id: 'wj_st_reg7', cond: { regionId: 'tongtian_glacier' }, text: '通天玄冰滑不留足，当年水底与金鱼精恶斗百合，水冰之性某最熟稔。' },
      { id: 'wj_st_reg8', cond: { regionId: 'xiliang_spiders' }, text: '毒泽蛛网暗藏杀机，以穿透月牙波远程割裂网阵最为稳妥。' },
      { id: 'wj_st_reg9', cond: { regionId: 'huoyan_volcano' }, text: '八百里熔岩酷烈，恰以流沙玄水寒气相克，水火交击必生奇效。' },
      { id: 'wj_st_reg10', cond: { regionId: 'bibo_dragonpalace' }, text: '水底龙渊浮力轻灵，如鱼得水，当年花果山水帘洞取回包袱亦不过如此。' },
      { id: 'wj_st_reg11', cond: { regionId: 'shituo_empire' }, text: '狮驼重城铁甲如林，正面持盾者众，当以漩涡减速绕背破之。' },
      { id: 'wj_st_reg12', cond: { regionId: 'lingshan_thunder' }, text: '云海玉岛浮沉不定，愈近雷音终局，愈须沉着镇定。' },
      { id: 'wj_st_mut1', cond: { mutatorId: 'mut_blood_moon' }, text: '血月催动气机，流沙玄水阵几乎首尾相接，群妖寸步难行！' },
      { id: 'wj_st_mut2', cond: { mutatorId: 'mut_blitz_pocket' }, text: '秘境浓缩，强敌密集，正好一记水阵尽数网罗切割！' },
      { id: 'wj_st_mut3', cond: { mutatorId: 'mut_heaven_thunder' }, text: '天雷落点已有红圈示警，用流沙阵将群魔死死拽在雷心里受罚！' },
      { id: 'wj_st_mut4', cond: { mutatorId: 'mut_alchemy_boom' }, text: '流沙聚怪配丹火连环尸爆，一妖伏诛则满阵俱焚，痛快！' },
      { id: 'wj_st_mut5', cond: { mutatorId: 'mut_glass_cannon' }, text: '修罗破釜虽削气血，然水刃锋芒暴涨五成，先手控住便无后患。' },
      { id: 'wj_st_mut6', cond: { mutatorId: 'mut_golden_fortune' }, text: '金铢满囊助长暴击锋锐，每一记重杖皆有裂石之威。' },
      { id: 'wj_st_mut7', cond: { mutatorId: 'mut_giant_brawl' }, text: '法天象地推力倍增，三段重击将顽敌尽数拍碎于石壁之上！' },
      { id: 'wj_st_evt1', cond: { eventId: 'evt_ginseng_tree' }, text: '五庄仙果曾惹天大风波，今日当权衡利弊审慎取舍。' },
      { id: 'wj_st_evt2', cond: { eventId: 'evt_six_ear_mirror' }, text: '当年花果山某亲眼见假猴王自立门户打死小妖，心魔不除必留大患！' },
      { id: 'wj_st_evt3', cond: { eventId: 'evt_laozi_furnace' }, text: '兜率炉火正旺，将梭罗宝杖再淬一分真火，威力更增。' },
      { id: 'wj_st_evt4', cond: { eventId: 'evt_guanyin_willow' }, text: '杨柳清露洗练三才，修为尽归主脉，杖下水波愈显雄浑。' },
      { id: 'wj_st_bp3', cond: { bpCount: 3 }, text: '天书满三卷！宝杖尾击双波齐发，贯甲破盾势不可挡！' },
      { id: 'wj_st_bp6', cond: { bpCount: 6 }, text: '六卷大成！玄水法相护周身，步履生风，水刃纵横！' },
      { id: 'wj_st_bp9', cond: { bpCount: 9 }, text: '九卷化境！弱水寒雷诛绝残寇，此间再无一合之敌！' },
      { id: 'wj_st_01', text: '凡陷入减速或眩晕之敌，受某宝杖痛击皆增伤三成，控杀一体方为上策。' },
      { id: 'wj_st_02', text: '不急不躁，看清妖兵红闪前摇翻身掠过，反手两道月牙气刃收割。' },
      { id: 'wj_st_03', text: '昔日守御车驾寸步不离，练就的便是这眼观六路之定力。' },
      { id: 'wj_st_04', text: '梭罗仙木内蕴月华，挥动时无声无息，中者却筋断骨裂。' },
      { id: 'wj_st_05', text: '检点身上四件披挂词条，攻防兼备方能笑到终劫。' },
      { id: 'wj_st_06', text: '流沙漩涡四秒半不息，任是跳斩猛虎亦难逃脱泥潭。' },
      { id: 'wj_st_07', text: '连斩战意渐盈，出杖与回气皆快逾闪电。' },
      { id: 'wj_st_08', text: '千淘万漉虽辛苦，吹尽狂沙始到金。前方便是妖王殿。' },
      { id: 'wj_st_09', text: '甘露尚存，蓝条充盈，足以正面迎战守关大魔。' },
      { id: 'wj_st_10', text: '不逞匹夫之勇，步步蚕食妖阵，自成不败之地。' },
      { id: 'wj_st_11', text: '冷月照寒甲，玄水涤腥风。快到关底了。' },
      { id: 'wj_st_12', text: '握紧宝杖，前方煞气沉凝，当是一尊宿命劲敌。' }
    ],

    bossClash: [
      { id: 'wj_bc_t01', cond: { tribNo: 1 }, text: '斩仙台旧同僚！当年某在卷帘任上受刑下界，今日不叙旧情，只凭宝杖开道！' },
      { id: 'wj_bc_t05', cond: { tribNo: 5 }, text: '双叉岭寅虎！山野猛兽也敢妄称将军，接某卷帘大将一杖！' },
      { id: 'wj_bc_t09', cond: { tribNo: 9 }, text: '鹰愁涧水妖！同为水府潜修之辈，岂容你在此兴浪阻道！' },
      { id: 'wj_bc_t11', cond: { tribNo: 11 }, text: '黑风熊王！枪法虽密，且看破不破得开某这流沙玄水大阵！' },
      { id: 'wj_bc_t12', cond: { tribNo: 12 }, text: '云栈魔影！当年流沙河底某与二师兄恶斗六十合，你的钉钯路数某熟得很！' },
      { id: 'wj_bc_t13', cond: { tribNo: 13 }, text: '黄风貂鼠！三昧狂风虽烈，遇上八百里沉渊玄水亦要败下阵来！' },
      { id: 'wj_bc_t15', cond: { tribNo: 15 }, text: '流沙河卷帘魔影！穿胸飞剑之痛、啖人饮血之孽，今日某亲手将旧我斩断！' },
      { id: 'wj_bc_t18', cond: { tribNo: 18 }, text: '五庄观护丹道傀！镇元仙家清规森严，某以礼相待，既拔剑相向便莫怪无情！' },
      { id: 'wj_bc_t19', cond: { tribNo: 19 }, text: '乾坤袖道尊化身！当年袖里乾坤将师徒一并笼去，今番宝杖破空断不入瓮！' },
      { id: 'wj_bc_t20', cond: { tribNo: 20 }, text: '白虎岭尸魔！挑拨师徒离散害大师兄含泪拜别，沙僧今日定将你挫骨扬灰！' },
      { id: 'wj_bc_t23', cond: { tribNo: 23 }, text: '奎木狼！同列天庭二十八宿与灵霄旧臣，波月洞囚某之仇，今日百倍奉还！' },
      { id: 'wj_bc_t24', cond: { tribNo: 24 }, text: '金角大王！兜率宫烧火童儿偷宝作乱，月牙宝杖下看你还敢唤谁姓名！' },
      { id: 'wj_bc_t25', cond: { tribNo: 25 }, text: '银角大王！羊脂玉净瓶盛的是仙露，某杖下涌的却是索命弱水！' },
      { id: 'wj_bc_t26', cond: { tribNo: 26 }, text: '青毛狮子王！假扮君王欺瞒朝野三年，灵霄天眼岂容你瞒天过海！' },
      { id: 'wj_bc_t28', cond: { tribNo: 28 }, text: '火云洞红孩儿！三昧真火虽凶，待某布下玄水寒渊浇灭你的气焰！' },
      { id: 'wj_bc_t32', cond: { tribNo: 32 }, text: '黑水河鼍龙！当年某潜入水府索要师父与你大战三十合，今日定取你钢鞭！' },
      { id: 'wj_bc_t34', cond: { tribNo: 34 }, text: '车迟国虎力妖道！欺压僧侣妄求长生，五雷正法岂容旁门染指！' },
      { id: 'wj_bc_t36', cond: { tribNo: 36 }, text: '通天河灵感金鱼！水底交锋你便不是某与二师兄对手，上了岸更无生路！' },
      { id: 'wj_bc_t39', cond: { tribNo: 39 }, text: '独角兕青牛！昔在天庭常见老君骑你过南天门，私逃下界，吃某一杖！' },
      { id: 'wj_bc_t42', cond: { tribNo: 42 }, text: '聚仙庵如意真仙！当年正是沙僧提杖去解阳山取水被你阻拦，新旧账同算！' },
      { id: 'wj_bc_t44', cond: { tribNo: 44 }, text: '琵琶洞毒敌蝎女！倒马毒桩阴狠毒辣，且用远距朔月水刃断你毒尾！' },
      { id: 'wj_bc_t46', cond: { tribNo: 46 }, text: '六耳猕猴！花果山抢包袱假充师门打杀猴妖，沙僧一杖曾劈碎你假沙僧，今日斩你真身！' },
      { id: 'wj_bc_t48', cond: { tribNo: 48 }, text: '翠云山罗刹女！太阴宝扇狂风虽急，难撼卷帘镇岳之躯！' },
      { id: 'wj_bc_t49', cond: { tribNo: 49 }, text: '平天大圣牛魔王！混铁棍力沉万钧，且试某这五千斤梭罗仙杖接不接得下！' },
      { id: 'wj_bc_t51', cond: { tribNo: 51 }, text: '乱石山九头虫！碧波潭底浑水摸鱼盗走佛宝，入我流沙漩涡插翅难飞！' },
      { id: 'wj_bc_t53', cond: { tribNo: 53 }, text: '黄眉妖童！假佛殿里将某捆缚，今日看清你司磬童子原形，绝不轻饶！' },
      { id: 'wj_bc_t57', cond: { tribNo: 57 }, text: '麒麟山赛太岁！紫金铃毒烟蔽日，某自闭息凝神，杖劈中宫！' },
      { id: 'wj_bc_t59', cond: { tribNo: 59 }, text: '盘丝七妖！银丝结网困人，殊不知旋转水刃专断天下乱丝！' },
      { id: 'wj_bc_t60', cond: { tribNo: 60 }, text: '百眼魔君！毒茶暗算非好汉所为，今日堂堂正正接某三道朔月斩！' },
      { id: 'wj_bc_t62', cond: { tribNo: 62 }, text: '狮驼青狮白象！两尊巨魔并肩又如何？卷帘神卫临敌从无退字！' },
      { id: 'wj_bc_t63', cond: { tribNo: 63 }, text: '金翅大鹏！极速双翼最忌泥沼迟滞，流沙玄水阵便是为你所设！' },
      { id: 'wj_bc_t65', cond: { tribNo: 65 }, text: '南极寿星的白鹿！天宫仙兽堕作食心恶魔，某替寿星清理门户！' },
      { id: 'wj_bc_t69', cond: { tribNo: 69 }, text: '无底洞白毛鼠！假借托塔天王威名行凶，当年某在灵霄殿与李靖同朝，岂容你招摇！' },
      { id: 'wj_bc_t73', cond: { tribNo: 73 }, text: '豹头山黄狮精！连某的降妖宝杖也敢盗去献宝，找死！' },
      { id: 'wj_bc_t74', cond: { tribNo: 74 }, text: '九灵元圣！东极妙严宫太乙天尊座下狮祖，晚辈沙悟净斗胆领教高招！' },
      { id: 'wj_bc_t76', cond: { tribNo: 76 }, text: '玄英洞三犀王！金平府元夜假佛偷油擒师，今日宝杖破尽尔等寒犀甲！' },
      { id: 'wj_bc_t78', cond: { tribNo: 78 }, text: '广寒捣药玉兔！梭罗仙木正出你广寒月宫，见此神杖还不伏首！' },
      { id: 'wj_bc_t81', cond: { tribNo: 81 }, text: '通天老鼋！八百里冰河旧识，纵有怨言亦当止步，莫逼沙僧动手！' },
      // 通用本色应战池 (48条)
      { id: 'wj_bc_g01', text: '卷帘大将沙悟净在此。欲伤我师门者，先踏过某这杆降妖宝杖！' },
      { id: 'wj_bc_g02', text: '话不多言。流沙阵起之刻，便是你凶威终结之时！' },
      { id: 'wj_bc_g03', text: '外轻内重五千斤，一杖挥出朔月寒——妖王请接招！' },
      { id: 'wj_bc_g04', text: '某在流沙河底熬过万剑穿心，你这点杀气还吓不倒人！' },
      { id: 'wj_bc_g05', text: '看你步履狂躁破绽百出，一旦踏入玄水漩涡，插翅难逃！' },
      { id: 'wj_bc_g06', text: '灵霄宝殿外曾斩过多少闯宫凶神，今日不过再添一笔！' },
      { id: 'wj_bc_g07', text: '大师兄嫌你啰嗦，二师兄贪你宝贝，某只求将你稳稳铲除开路！' },
      { id: 'wj_bc_g08', text: '妖气虽盛，根基虚浮。接某三连月牙水刃试试深浅！' },
      { id: 'wj_bc_g09', text: '守如磐石不动，攻如暗潮拍岸——请亮兵刃！' },
      { id: 'wj_bc_g10', text: '莫道沙僧平日沉默寡言，动起雷霆杀伐来绝不拖泥带水！' },
      { id: 'wj_bc_g11', text: '被减速困锁之时，宝杖锋芒更盛三成——这便是某的破魔之道！' },
      { id: 'wj_bc_g12', text: '残卷将你重塑守关，某便替天行道再斩一回！' },
      { id: 'wj_bc_g13', text: '月宫仙木专克妖邪骨血，挨上一记便知外轻内重之妙！' },
      { id: 'wj_bc_g14', text: '狂风吹不动孤松，恶浪掀不翻铁舟。来战！' },
      { id: 'wj_bc_g15', text: '传送法阵近在咫尺，借你守关妖丹一用！' },
      { id: 'wj_bc_g16', text: '既占一难名号，便拿出真本事，莫辱没了八十一难威名！' },
      { id: 'wj_bc_g17', text: '前摇凶猛却收势迟缓，翻身避其锋锐即可反制！' },
      { id: 'wj_bc_g18', text: '某平生最重然诺，既应了西行破劫，便绝无半途退缩之理！' },
      { id: 'wj_bc_g19', text: '水无常形，杖有定法，任你千变万化皆困阵中！' },
      { id: 'wj_bc_g20', text: '披挂齐整，内息渊渟岳峙，今日正好与你痛快周旋！' },
      { id: 'wj_bc_g21', text: '休耍虚招惑人，灵霄神将的眼力岂会被幻影瞒过！' },
      { id: 'wj_bc_g22', text: '一寸长一寸强，降妖宝杖横扫之处皆为禁区！' },
      { id: 'wj_bc_g23', text: '你身上怨煞太重，非以弱水寒波洗净不可！' },
      { id: 'wj_bc_g24', text: '不求一击秒杀，但求步步紧逼教你无处喘息！' },
      { id: 'wj_bc_g25', text: '三才修为已聚杖身，接这一记破障朔月波！' },
      { id: 'wj_bc_g26', text: '天上地下多少豪强，轻视沙僧者皆已饮恨杖下！' },
      { id: 'wj_bc_g27', text: '沉心静气，听风辨刃——妖王，出招罢！' },
      { id: 'wj_bc_g28', text: '纵你半血狂暴凶性大发，某自以玄水漩涡锁你手足！' },
      { id: 'wj_bc_g29', text: '挑担行路练的是耐力，临阵斩将靠的是狠准！' },
      { id: 'wj_bc_g30', text: '寒芒一点如新月，横扫千军似卷潮！' },
      { id: 'wj_bc_g31', text: '莫再咆哮虚张声势，生死只在一瞬交锋！' },
      { id: 'wj_bc_g32', text: '护甲在身减伤镇守，换血硬拼你亦讨不到半分便宜！' },
      { id: 'wj_bc_g33', text: '此殿阴霾郁结已久，今日一杖劈开天光！' },
      { id: 'wj_bc_g34', text: '不借外力，单凭掌中梭罗杖与你堂堂正正决一死战！' },
      { id: 'wj_bc_g35', text: '八百里流沙磨出的杀气，今日尽数倾泻于此！' },
      { id: 'wj_bc_g36', text: '进退有度，攻守兼备，看你能撑过几轮水阵切割！' },
      { id: 'wj_bc_g37', text: '既为劫障，便化作某修行路上的磨刀石罢！' },
      { id: 'wj_bc_g38', text: '月牙铲起寒星落，妖魔授首莫徘徊！' },
      { id: 'wj_bc_g39', text: '十万八千里护法之责在肩，岂容尔等猖狂！' },
      { id: 'wj_bc_g40', text: '气息已锁，退路已封——接杖！' },
      { id: 'wj_bc_g41', text: '任尔铜头铁骨，难逃寒渊水刃千剐！' },
      { id: 'wj_bc_g42', text: '凝神屏息，这一战，速决！' },
      { id: 'wj_bc_g43', text: '邪不胜正，狂澜终归平静——纳命来！' },
      { id: 'wj_bc_g44', text: '某既立于此地，你便休想越过雷池一步！' },
      { id: 'wj_bc_g45', text: '宝杖低吟渴饮妖血，成全它罢！' },
      { id: 'wj_bc_g46', text: '看招！流沙玄水，起阵！' },
      { id: 'wj_bc_g47', text: '破军斩将本旧业，今日重拾又何妨！' },
      { id: 'wj_bc_g48', text: '止步！此难到此为止了！' }
    ],

    bossKill: [
      { id: 'wj_bk_01', text: '收杖卓立。妖氛已靖，前路可通。' },
      { id: 'wj_bk_02', text: '流沙归寂，顽敌授首——这关稳稳拿下了。' },
      { id: 'wj_bk_03', text: '外轻内重五千斤，挨实了断无幸理。' },
      { id: 'wj_bk_04', text: '拾拢地上遗落披挂与灵蕴，入法阵休整。' },
      { id: 'wj_bk_05', text: '不骄不躁，抹去杖上寒霜，继续西行。' },
      { id: 'wj_bk_06', text: '陷于玄水阵中犹作困兽斗，终究徒劳。' },
      { id: 'wj_bk_07', text: '此页残卷戾气已消，未辱卷帘之名。' },
      { id: 'wj_bk_08', text: '好一件高阶护甲，正合某镇守冲阵之用。' },
      { id: 'wj_bk_09', text: '控场聚杀一气呵成，甘露尚余大半。' },
      { id: 'wj_bk_10', text: '昔日断后守行李，今日独斩守关王。' },
      { id: 'wj_bk_11', text: '风波已定，踏入传送门择取下程道途。' },
      { id: 'wj_bk_12', text: '水刃无痕，妖魂尽散。' },
      { id: 'wj_bk_13', text: '稳扎稳打，纵是千年大魔亦不过十合之敌。' },
      { id: 'wj_bk_14', text: '将灵蕴仔细收好，回土地庙厚植根基。' },
      { id: 'wj_bk_15', text: '梭罗仙木清光不减，果真神兵。' },
      { id: 'wj_bk_16', text: '强敌已除，师父与师兄们可安心矣。' },
      { id: 'wj_bk_17', text: '一杖定音，无需赘言。' },
      { id: 'wj_bk_18', text: '狂飙落幕归沉静，法阵开启向西天。' },
      { id: 'wj_bk_19', text: '破防增伤刀刀见肉，痛快而利落。' },
      { id: 'wj_bk_20', text: '尘埃落定，检点衣甲再赴新劫。' },
      { id: 'wj_bk_21', text: '莫逞凶蛮，终归玄水一涤。' },
      { id: 'wj_bk_22', text: '气息平稳未乱，可连战下一重秘境。' },
      { id: 'wj_bk_23', text: '月牙寒光收袖底，满地金铢入行囊。' },
      { id: 'wj_bk_24', text: '此难销账。前路分岔，审慎择门。' },
      { id: 'wj_bk_25', text: '守正笃行，步步皆是坦途。' },
      { id: 'wj_bk_26', text: '任尔凶焰滔天，终化一缕清烟。' },
      { id: 'wj_bk_27', text: '大殿重归肃穆，起行罢。' },
      { id: 'wj_bk_28', text: '三才修为愈发深厚，杖法更添从容。' },
      { id: 'wj_bk_29', text: '灵霄旧将之锋芒，未因岁月稍减。' },
      { id: 'wj_bk_30', text: '斩尽芜杂，只留澄澈道心。' },
      { id: 'wj_bk_31', text: '妖丹破碎化灵蕴，善始善终。' },
      { id: 'wj_bk_32', text: '不贪冒进，故能全身而胜。' },
      { id: 'wj_bk_33', text: '朔月余波渐息，踏阵前趋！' },
      { id: 'wj_bk_34', text: '替这方山水除一祸害，某心甚慰。' },
      { id: 'wj_bk_35', text: '好披挂！旧物炼化回蓝，新甲披身再战。' },
      { id: 'wj_bk_36', text: '水静月明，此关已破。' },
      { id: 'wj_bk_37', text: '十万八千里皆如此一步步踏平。' },
      { id: 'wj_bk_38', text: '顽石虽硬，难敌滴水穿石、重杖裂山。' },
      { id: 'wj_bk_39', text: '收势凝神，赴土地仙祠领受赐福。' },
      { id: 'wj_bk_40', text: '凶煞消散，瑞气初生。' },
      { id: 'wj_bk_41', text: '某虽寡言，手底功夫从不欺人。' },
      { id: 'wj_bk_42', text: '法门已启，莫误前程。' },
      { id: 'wj_bk_43', text: '寒渊洗尽妖魔血，宝杖生辉映紫霞。' },
      { id: 'wj_bk_44', text: '又渡一厄，离终局更近一步。' },
      { id: 'wj_bk_45', text: '稳如钟鼎，动若奔雷——收兵！' },
      { id: 'wj_bk_46', text: '败军之妖，安息轮回罢。' },
      { id: 'wj_bk_47', text: '护甲完好，法力充沛，甚好。' },
      { id: 'wj_bk_48', text: '横铲立马望西极，再闯下关！' },
      { id: 'wj_bk_49', text: '不负重托，此殿彻底肃清。' },
      { id: 'wj_bk_50', text: '乱麻已斩，心无旁骛。' },
      { id: 'wj_bk_51', text: '重器无锋自破甲，痛快。' },
      { id: 'wj_bk_52', text: '敛去杀意，步入传送光门。' },
      { id: 'wj_bk_53', text: '残页金纹愈合，功不唐捐。' },
      { id: 'wj_bk_54', text: '流沙漩涡收拢，战利品尽归囊中。' },
      { id: 'wj_bk_55', text: '纵遇强梁，定力胜之。' },
      { id: 'wj_bk_56', text: '山河清朗，迈步向前。' },
      { id: 'wj_bk_57', text: '这一仗干净利落，未留后患。' },
      { id: 'wj_bk_58', text: '饮一口甘露润泽经脉，迎战更深处。' },
      { id: 'wj_bk_59', text: '宝杖拄地铮然响，过关！' },
      { id: 'wj_bk_60', text: '邪魔伏诛，天道昭彰。' },
      { id: 'wj_bk_61', text: '昔为卷帘臣，今作破劫人。' },
      { id: 'wj_bk_62', text: '拾齐宝物，入祠择路。' },
      { id: 'wj_bk_63', text: '暗流平息，唯余清辉满殿。' },
      { id: 'wj_bk_64', text: '再坚之盾，亦碎于朔月背刺之下。' },
      { id: 'wj_bk_65', text: '沉着应战之果，分毫不差。' },
      { id: 'wj_bk_66', text: '前途尚远，不可稍有懈怠。' },
      { id: 'wj_bk_67', text: '将功德金铢收妥，备不时之需。' },
      { id: 'wj_bk_68', text: '一杖扫清门前雪，直趋雷音。' },
      { id: 'wj_bk_69', text: '妖魂散尽，天地肃然。' },
      { id: 'wj_bk_70', text: '战罢回身无一事，唯有清风入怀来。' },
      { id: 'wj_bk_71', text: '此劫已了，速赴下一关隘。' },
      { id: 'wj_bk_72', text: '千锤百炼之躯，岂惧恶战。' },
      { id: 'wj_bk_73', text: '金光落地成神装，正合心意。' },
      { id: 'wj_bk_74', text: '破妄除魔，沙僧职责所在。' },
      { id: 'wj_bk_75', text: '云开雾散见法阵，前行！' },
      { id: 'wj_bk_76', text: '气定神闲，再下一城。' },
      { id: 'wj_bk_77', text: '任他万般狡诈，难逃水阵封杀。' },
      { id: 'wj_bk_78', text: '功果入怀，步履愈坚。' },
      { id: 'wj_bk_79', text: '月冷霜寒妖骨碎，收工。' },
      { id: 'wj_bk_80', text: '整理行装，踏阵西进！' },
      { id: 'wj_bk_81', text: '孤忠一片映寒水，此关已平。' },
      { id: 'wj_bk_82', text: '不疾不徐，胜券早握。' },
      { id: 'wj_bk_83', text: '满堂霞瑞凝仙缘，入祠一观。' },
      { id: 'wj_bk_84', text: '障除路开，走！' }
    ],

    reviveMiracle: [
      { id: 'wj_rv_01', text: '流沙河三百回飞剑穿胸都未取某性命，区区重创岂能令沙僧倒下！多谢大士甘露！' },
      { id: 'wj_rv_02', text: '金莲护体，玄水重凝！某答应过护师门周全，死战不退！' },
      { id: 'wj_rv_03', text: '南海净水涤去血污，五千斤降妖宝杖重握掌中——妖孽，再决生死！' },
      { id: 'wj_rv_04', text: '卷帘神卫纵粉身碎骨亦当横杖阵前！金身既起，反击之时到了！' },
      { id: 'wj_rv_05', text: '感念菩萨昔日点化与今朝续命之恩，沙僧定扫清此殿群魔！' },
      { id: 'wj_rv_06', text: '一息尚存，孤忠不改！佛光震退宵小，看某流沙玄水阵翻盘！' },
      { id: 'wj_rv_07', text: '伤痛早习以为常，重凝金钟护盾，此番定教你无隙可乘！' },
      { id: 'wj_rv_08', text: '寒渊不涸，战魂不熄！重整架势，一杖劈开生路！' },
      { id: 'wj_rv_09', text: '方才替己身试清了妖王杀招深浅，接下来该轮到某出杖了！' },
      { id: 'wj_rv_10', text: '甘露灌顶百脉俱通，三息无敌金光加身，破阵就在此时！' },
      { id: 'wj_rv_11', text: '灵霄殿贬落尘埃尚能重起，何况眼前一战！接招！' },
      { id: 'wj_rv_12', text: '大师兄二师兄皆未言败，沙僧岂可先一步退却！' },
      { id: 'wj_rv_13', text: '金光荡秽，朔月重明，再试某家梭罗仙杖锋芒！' },
      { id: 'wj_rv_14', text: '百折不挠方为镇岳之卫，拍落尘土，再战！' },
      { id: 'wj_rv_15', text: '菩萨垂慈赐生机，某必以雷霆除恶报答天恩！' },
      { id: 'wj_rv_16', text: '气血充盈胜初时，玄水狂澜再卷凶坛！' },
      { id: 'wj_rv_17', text: '苦难愈深，杖势愈沉——谁敢再挡！' },
      { id: 'wj_rv_18', text: '死生关头走一遭，心境反倒澄明如铁！看杖！' },
      { id: 'wj_rv_19', text: '护法金身璀璨夺目，群妖授首就在呼吸之间！' },
      { id: 'wj_rv_20', text: '未竟之诺重于泰山，沙悟净重返战阵！' },
      { id: 'wj_rv_21', text: '洗尽暗伤重抖擞，月牙寒刃定乾坤！' },
      { id: 'wj_rv_22', text: '孤臣不死，正道不孤——破劫！' }
    ],

    runVictory: [
      { id: 'wj_vc_01', cond: { firstWin: true }, text: '破劫金门终启！昔为金身罗汉静守莲台，今仗降妖宝杖独平四劫，此心无愧天地师门！' },
      { id: 'wj_vc_02', text: '狂沙吹尽见真金，四劫群魔悉数荡平，某幸不辱命。' },
      { id: 'wj_vc_03', text: '收宝杖于背，携满怀灵蕴归返营地。沉默行路之人，自有雷霆战果。' },
      { id: 'wj_vc_04', text: '灵霄碎盏之憾、流沙沉沦之苦，今随这漫天祥瑞一并释然。' },
      { id: 'wj_vc_05', text: '金门之后霞光万里，恰似当年初渡凌云独木桥之景。' },
      { id: 'wj_vc_06', text: '一步一杖皆求踏实，终将这凶险碎卷走出一条安稳通途。' },
      { id: 'wj_vc_07', text: '不慕虚荣，唯喜师门无恙、山河清宁。凯旋归营！' },
      { id: 'wj_vc_08', text: '梭罗仙杖沐浴功德金光，五千斤重器今日大放异彩。' },
      { id: 'wj_vc_09', text: '玄水归海，寒月归天，这一趟巡礼功行圆满。' },
      { id: 'wj_vc_10', text: '将所获灵蕴存入土地仙祠，淬炼筋骨以备更高劫度之试炼。' },
      { id: 'wj_vc_11', text: '大师兄若见此战绩，想必也要邀某痛饮三碗花果山水酒。' },
      { id: 'wj_vc_12', text: '外魔既除，内境愈澈，卷帘大将威名重振三界。' },
      { id: 'wj_vc_13', text: '残页金丝重续，八十一难因果又得抚平一角。' },
      { id: 'wj_vc_14', text: '守得云开见月明，稳健之道果真无往不利。' },
      { id: 'wj_vc_15', text: '卸下满身征尘，回营替师父烹一壶清茶静叙此行。' },
      { id: 'wj_vc_16', text: '三才圆融，甲胄生辉，终劫妖尊亦难撼某分毫。' },
      { id: 'wj_vc_17', text: '千钧重担挑得起，万里魔窟亦踏得平！' },
      { id: 'wj_vc_18', text: '风止浪静金莲开，从容跨门归去来。' },
      { id: 'wj_vc_19', text: '只要西行正道尚需护卫，沙僧这杆宝杖随时待命。' },
      { id: 'wj_vc_20', text: '孤勇化祥瑞，百战证菩提。圆满收官！' },
      { id: 'wj_vc_21', text: '清风满袖无尘滓，笑看金门瑞气浮。' },
      { id: 'wj_vc_22', text: '功成不居，整束衣冠安然回营。' }
    ],

    runDefeat: [
      { id: 'wj_df_01', text: '防线微漏致此败局，沙僧惭愧……携灵蕴归祠淬炼，片刻后再来镇场。' },
      { id: 'wj_df_02', text: '胜败寻常事。昔在流沙河受苦千日尚不气馁，整顿衣甲重来便是。' },
      { id: 'wj_df_03', text: '流沙漩涡落点稍偏半寸，下回布阵必先封死其冲锋路径。' },
      { id: 'wj_df_04', text: '残躯暂化玄水归返土地庙，真灵不灭，誓平此劫。' },
      { id: 'wj_df_05', text: '甘露耗尽而强敌未陨，当回营提升仙根气血上限再图后举。' },
      { id: 'wj_df_06', text: '记下此妖连招节拍，再来交手断不教他讨得便宜。' },
      { id: 'wj_df_07', text: '灵蕴悉数保住入库，此番苦战未算白费心血。' },
      { id: 'wj_df_08', text: '沉舟侧畔千帆过，暂退一步只为下一次更稳的进击。' },
      { id: 'wj_df_09', text: '方才贪打第三段收招略慢，下次善用翻滚取消后摇。' },
      { id: 'wj_df_10', text: '莫教师父忧心，某回仙祠调息数息即刻复出。' },
      { id: 'wj_df_11', text: '此关高压果非虚名，换套控场法相定能破局。' },
      { id: 'wj_df_12', text: '铁骨偶折志不摧，磨亮月牙铲再来讨债！' },
      { id: 'wj_df_13', text: '法力稍竭难续水阵，下局择宝当兼顾回蓝词条。' },
      { id: 'wj_df_14', text: '西行本是千磨万击之路，沙僧最不缺的便是耐性。' },
      { id: 'wj_df_15', text: '寒雾敛去归古祠，重铸金汤待来时。' },
      { id: 'wj_df_16', text: '一挫更知敌深浅，再入残卷必克之。' },
      { id: 'wj_df_17', text: '宝杖不折，誓言不改，少待片刻！' },
      { id: 'wj_df_18', text: '将沿途功果尽数化入仙根，一步比一步更坚。' },
      { id: 'wj_df_19', text: '胜不妄喜，败不惶馁——重整旗鼓！' },
      { id: 'wj_df_20', text: '暂敛锋芒回营去，蓄满寒潮再拍岸。' },
      { id: 'wj_df_21', text: '差之毫厘，来局必补足这分寸之功。' },
      { id: 'wj_df_22', text: '山高水长，沙僧去而复返！' }
    ]
  };

  // ============================================================================
  // 八、第 5 位主角：白龙马 (bailongma · 西海龙太子敖烈 · 白龙吟雷枪 / 真龙雷霆闪)
  // 人设基调：清冷孤傲、少年龙裔锐气；十万八千里卸鞍化龙，踏云三段跳与惊雷银枪快绝三界，弥补宝象国未竟一剑！
  // ============================================================================
  HERO_LINES.bailongma = {
    runStart: [
      { id: 'bl_rs_m1', cond: { charRun: 1 }, text: '十万八千里蹄铁无声，世人皆忘我是西海真龙——今日残卷碎裂，敖烈执枪请战！' },
      { id: 'bl_rs_m5', cond: { charRun: 5 }, text: '五踏劫云！锯角退鳞之痛早已化作枪尖青雷，越战越觉龙血沸腾！' },
      { id: 'bl_rs_m10', cond: { charRun: 10 }, text: '十番破阵！昔年烧毁殿上明珠险丧斩龙台，如今这满天雷火反倒听我号令！' },
      { id: 'bl_rs_m15', cond: { charRun: 15 }, text: '第十五回凌空出征！三段踏云无视绝壑，这残卷四洲已无能阻我银枪之地！' },
      { id: 'bl_rs_m20', cond: { charRun: 20 }, text: '二十轮回淬龙魂！不作池中潜鳞，不作槽头凡马——八部天龙广力真身，今日破天！' },
      { id: 'bl_rs_win', cond: { lastOutcome: 'victory' }, text: '前番一枪贯破终劫魔窟，龙吟余音未绝，且再乘风雷扫荡新生的残页！' },
      { id: 'bl_rs_loss', cond: { lastOutcome: 'defeat' }, text: '前局急进折了枪锋……真龙岂困浅滩？拭净银鳞血迹，此番必一雪前耻！' },
      { id: 'bl_rs_rev', cond: { lastRevived: true }, text: '昔日鹰愁涧承菩萨救命锯角度化，前局又蒙甘露护持，敖烈唯有以快枪报恩！' },
      { id: 'bl_rs_asp1', cond: { aspectId: 'bl_aspect_soar' }, text: '九霄雷龙相！凭虚御风三段腾跃，自高天投下三道龙鳞奔雷，俯瞰群魔！' },
      { id: 'bl_rs_asp2', cond: { aspectId: 'bl_aspect_mirage' }, text: '沧海幻龙相！翻身掠影直穿敌阵，落雷诛邪更缩真龙闪冷却，来去如电！' },
      { id: 'bl_rs_asp3', cond: { aspectId: 'bl_aspect_frost' }, text: '西海玄冰相！枪出带寒潮冰封迟滞，再以碎冰暴击一枪洞穿铁甲！' },
      { id: 'bl_rs_01', text: '卸去金鞍玉辔，重握白龙吟雷枪——让这群妖魔见识四海龙族真正的傲骨！' },
      { id: 'bl_rs_02', text: '天下武功唯快不破！最高移速配独门三段踏云跳，连风沙也追不上我的残影！' },
      { id: 'bl_rs_03', text: '翻滚穿敌即落青雷，真龙雷霆闪更可瞬刷翻滚——进出万军丛中片鳞不伤！' },
      { id: 'bl_rs_04', text: '宝象国银安殿拔剑刺奎狼那一夜，我便发誓：若重获龙身，定不教师父受半分惊扰！' },
      { id: 'bl_rs_05', text: '西海父王常叹我性烈闯祸，殊不知这乱世碎卷，正需一柄宁折不弯的快枪！' },
      { id: 'bl_rs_06', text: '平日听二师兄絮叨、看大师兄降魔，敖烈胸中枪意早已蓄满十万八千里！' },
      { id: 'bl_rs_07', text: '银甲映寒月，枪缨卷惊雷。前路诸魔，且听龙吟！' },
      { id: 'bl_rs_08', text: '斗战之锐合妙法之雷，一刺一闪皆如电光石火，绝不给顽敌喘息之机！' },
      { id: 'bl_rs_09', text: '鹰愁涧底潜伏的日子早过去了，九霄长空才是真龙驰骋的猎场！' },
      { id: 'bl_rs_10', text: '不仗龙宫宝库，单凭这一杆白龙吟雷枪，刺穿这重重虚妄劫障！' },
      { id: 'bl_rs_11', text: '持盾妖卫只防得住身前，岂防得住我化龙瞬闪贯背而过！' },
      { id: 'bl_rs_12', text: '风从虎，云从龙！今日风雷俱备，且看谁敢拦道！' },
      { id: 'bl_rs_13', text: '化马是修行，执枪亦是修行。银龙出渊，万邪辟易！' },
      { id: 'bl_rs_14', text: '枪尖电芒已炽，一跃冲霄，直取首劫妖王！' }
    ],

    stageSolo: [
      { id: 'bl_st_reg1', cond: { regionId: 'liangjie_canyon' }, text: '两界山连着鹰愁陡涧！昔日在此褪鳞化马，今朝踏云三跃飞渡绝壑，恍若隔世！' },
      { id: 'bl_st_reg2', cond: { regionId: 'heifeng_temple' }, text: '观音禅院火光冲天，当年我拴在廊下险遭池鱼之殃，今日一枪挑散漫天火星！' },
      { id: 'bl_st_reg3', cond: { regionId: 'huangfeng_ridge' }, text: '黄风狂沙虽急，我有踏云龙裔极速加真龙突刺，逆风穿沙亦如利箭破空！' },
      { id: 'bl_st_reg4', cond: { regionId: 'liusha_river' }, text: '八百里弱水虽沉，龙族天生御水乘风，借三段跳掠过孤岛木排轻而易举！' },
      { id: 'bl_st_reg5', cond: { regionId: 'baigu_crypt' }, text: '波月洞与白骨窟相连……犹记当年在此为救师父忍痛咬住二师兄衣襟求援！' },
      { id: 'bl_st_reg6', cond: { regionId: 'pingding_grotto' }, text: '万仞石柱与崩塌危岩？纵脚下石碎，我凭空连踏两朵青云亦可稳落彼岸！' },
      { id: 'bl_st_reg7', cond: { regionId: 'tongtian_glacier' }, text: '通天冰河寒气凛冽，恰与西海冰渊同源，冰面滑行出枪更添三分迅猛！' },
      { id: 'bl_st_reg8', cond: { regionId: 'xiliang_spiders' }, text: '毒泽蛛网休想沾我龙鳞半片，化作银白雷龙一闪即过！' },
      { id: 'bl_st_reg9', cond: { regionId: 'huoyan_volcano' }, text: '八百里熔岩火海翻腾，三段踏云凌空掠渡，滴火不沾银甲！' },
      { id: 'bl_st_reg10', cond: { regionId: 'bibo_dragonpalace' }, text: '碧波龙渊水下故境！万圣老龙纵容赘婿败坏龙门清誉，今日定涤荡此渊！' },
      { id: 'bl_st_reg11', cond: { regionId: 'shituo_empire' }, text: '狮驼魔城壁垒森严，且以极速游龙身法撕碎这群重甲妖兵！' },
      { id: 'bl_st_reg12', cond: { regionId: 'lingshan_thunder' }, text: '大雷音云海就在前方！昔日化龙盘绕擎天华表柱，今朝执枪直入九重云！' },
      { id: 'bl_st_mut1', cond: { mutatorId: 'mut_blood_moon' }, text: '血月之下真龙雷霆闪冷却瞬息即满，满屏银龙穿梭，痛快之极！' },
      { id: 'bl_st_mut2', cond: { mutatorId: 'mut_blitz_pocket' }, text: '缩地成寸短兵相接，正合快枪极速突杀之势！' },
      { id: 'bl_st_mut3', cond: { mutatorId: 'mut_heaven_thunder' }, text: '九天紫霄雷罚降世，与我枪上青雷遥相呼应，万雷轰顶诛群邪！' },
      { id: 'bl_st_mut4', cond: { mutatorId: 'mut_alchemy_boom' }, text: '一枪刺死抽身瞬闪，留下原地丹火炸碎追兵，丝毫不拖泥带水！' },
      { id: 'bl_st_mut5', cond: { mutatorId: 'mut_glass_cannon' }, text: '修罗破釜！真龙本就不靠挨打取胜，极速闪避配毁天一枪足矣！' },
      { id: 'bl_st_mut6', cond: { mutatorId: 'mut_golden_fortune' }, text: '龙族素识奇珍异宝，这满地功德金铢尽化枪尖暴击寒芒！' },
      { id: 'bl_st_mut7', cond: { mutatorId: 'mut_giant_brawl' }, text: '法天象地加持枪劲，第三刺雷霆枪芒将顽敌尽数轰入崖壁！' },
      { id: 'bl_st_evt1', cond: { eventId: 'evt_ginseng_tree' }, text: '五庄观先天灵果瑞气逼人，较之西海龙宫千年珊瑚珠更胜一筹。' },
      { id: 'bl_st_evt2', cond: { eventId: 'evt_six_ear_mirror' }, text: '古镜映照龙影，纵有心魔幻象，能快得过我本体惊雷一刺么？' },
      { id: 'bl_st_evt3', cond: { eventId: 'evt_laozi_furnace' }, text: '借太上八卦炉三昧真火重淬银枪，锋芒必更凌厉！' },
      { id: 'bl_st_evt4', cond: { eventId: 'evt_guanyin_willow' }, text: '菩萨杨柳点化之恩敖烈永志不忘，三才归宗，雷威暴涨！' },
      { id: 'bl_st_bp3', cond: { bpCount: 3 }, text: '天书三卷小成！枪尾雷球连携破甲真气波，远近皆杀！' },
      { id: 'bl_st_bp6', cond: { bpCount: 6 }, text: '六卷大成·真龙觉醒！身轻如电，一闪千里无迹可寻！' },
      { id: 'bl_st_bp9', cond: { bpCount: 9 }, text: '九卷化境·苍穹雷帝！枪芒擦过即引神雷处决，群魔授首！' },
      { id: 'bl_st_01', text: '翻滚穿敌降青雷，接真龙闪贯空再刷翻滚——这套连环游龙步无人可近我身！' },
      { id: 'bl_st_02', text: '连斩越盛，身法越快！银枪所过之处只留一串电弧残影！' },
      { id: 'bl_st_03', text: '往常驮着经担听风看云，早已把各路妖魔的破绽默记于心。' },
      { id: 'bl_st_04', text: '三段跳凌空俯冲千钧下砸，如苍龙坠海震慑八方！' },
      { id: 'bl_st_05', text: '西海龙宫的枪谱融汇佛门护法雷音，每一刺皆快逾流星。' },
      { id: 'bl_st_06', text: '这件新得的披挂轻灵顺手，正衬我银鳞战甲！' },
      { id: 'bl_st_07', text: '莫教小妖合围，借机动优势拉成一线逐个贯穿！' },
      { id: 'bl_st_08', text: '十万八千里不曾喊过一声苦，今日掌中有枪，更觉天地辽阔！' },
      { id: 'bl_st_09', text: '枪尖微颤似有所感，前方大殿定有一尊大妖盘踞。' },
      { id: 'bl_st_10', text: '甘露未动，法力如潮，且以巅峰之姿迎战守关者！' },
      { id: 'bl_st_11', text: '寒星一点先至，随后龙吟方闻！' },
      { id: 'bl_st_12', text: '收拢杂念，化雷破关！' }
    ],

    bossClash: [
      { id: 'bl_bc_t01', cond: { tribNo: 1 }, text: '斩仙台金甲将！当年我烧毁明珠险死你台下，今日敖烈以护法真龙之身堂堂闯关！' },
      { id: 'bl_bc_t03', cond: { tribNo: 3 }, text: '洪江凶鳞水妖！区区江中恶鱼也敢在西海龙太子面前兴风作浪，滚回水底！' },
      { id: 'bl_bc_t05', cond: { tribNo: 5 }, text: '双叉岭寅虎！云从龙风从虎，今日便教你知道虎威难敌真龙天雷！' },
      { id: 'bl_bc_t09', cond: { tribNo: 9 }, text: '鹰愁涧潜蛟！此涧曾是我潜修之地，几时轮到你这杂鳞水怪称霸？看枪！' },
      { id: 'bl_bc_t11', cond: { tribNo: 11 }, text: '黑风熊王！点钢枪虽沉，快得过我西海白龙吟雷枪么？' },
      { id: 'bl_bc_t13', cond: { tribNo: 13 }, text: '黄风大圣！任你狂沙迷眼，真龙乘雷破风，直取你咽喉要害！' },
      { id: 'bl_bc_t15', cond: { tribNo: 15 }, text: '流沙弱水魔影！三师兄的旧日心魔，便由小师弟这一枪替他荡清！' },
      { id: 'bl_bc_t19', cond: { tribNo: 19 }, text: '五庄乾坤道傀！袖里乾坤虽妙，休想网住瞬息千里的雷霆游龙！' },
      { id: 'bl_bc_t20', cond: { tribNo: 20 }, text: '白骨尸魔！当年在白虎岭害我师门生隙、大师兄遭贬，今日一枪挑碎你千年骷髅！' },
      { id: 'bl_bc_t23', cond: { tribNo: 23 }, text: '黄袍怪奎木狼！宝象国银安殿我化宫娥拔剑刺你未中，腿伤之恨今日以雷枪讨还！' },
      { id: 'bl_bc_t24', cond: { tribNo: 24 }, text: '金角大王！紫金红葫芦收得住应名之人，收不住无言破空的惊雷一刺！' },
      { id: 'bl_bc_t25', cond: { tribNo: 25 }, text: '银角大王！移三山压顶？我有三段踏云龙身，崇山峻岭亦一跃而过！' },
      { id: 'bl_bc_t28', cond: { tribNo: 28 }, text: '圣婴红孩儿！当年火云洞你的火尖枪狂妄至极，今日与我的吟雷枪比个高低！' },
      { id: 'bl_bc_t32', cond: { tribNo: 32 }, text: '黑水河鼍洁！姑父泾河龙王一门忠烈，你这九表弟却霸河擒我师父——敖烈代摩昂兄清理门户！' },
      { id: 'bl_bc_t34', cond: { tribNo: 34 }, text: '车迟国虎力大仙！你也配写符召四海龙王行雨？西海三太子当面，看剑——看枪！' },
      { id: 'bl_bc_t36', cond: { tribNo: 36 }, text: '通天河金鱼精！一尾池鱼妄封灵感大王，在真龙面前还不现出原形！' },
      { id: 'bl_bc_t38', cond: { tribNo: 38 }, text: '寒铁巨蟹将！昔日在西海水晶宫不过看门虾蟹，也敢举螯拦你三太子？' },
      { id: 'bl_bc_t39', cond: { tribNo: 39 }, text: '独角兕青牛！莫亮那套兵器的圈子，我化真龙雷光穿身而过，看你怎么套！' },
      { id: 'bl_bc_t44', cond: { tribNo: 44 }, text: '琵琶洞毒蝎！倒马毒桩再快，快不过瞬移贯空的真龙雷霆闪！' },
      { id: 'bl_bc_t46', cond: { tribNo: 46 }, text: '六耳猕猴！连槽头白马也想瞒天过海牵走？大圣真伪，我的龙瞳早已看穿！' },
      { id: 'bl_bc_t48', cond: { tribNo: 48 }, text: '铁扇公主！太阴宝扇一扇八万四千里，且看吹不吹得散九霄奔雷！' },
      { id: 'bl_bc_t49', cond: { tribNo: 49 }, text: '平天大圣牛魔王！昔日我伯父东海龙宫设宴曾见你威风，今日晚辈以雷枪讨教！' },
      { id: 'bl_bc_t50', cond: { tribNo: 50 }, text: '奔波儿灞、灞波儿奔！两条乱石山小杂鱼，还不速速让开碧波潭通道！' },
      { id: 'bl_bc_t51', cond: { tribNo: 51 }, text: '九头虫！蛊惑万圣龙王盗取佛宝，令四海龙族蒙羞！今日定斩你九首洗刷龙门耻辱！' },
      { id: 'bl_bc_t53', cond: { tribNo: 53 }, text: '小雷音黄眉！当年华表柱尚盘真龙，你这假雷音寺连片真鳞都没有，破！' },
      { id: 'bl_bc_t55', cond: { tribNo: 55 }, text: '七绝山红鳞蟒！蛇修千年欲化蛟尚隔天堑，在真龙面前安敢张牙！' },
      { id: 'bl_bc_t57', cond: { tribNo: 57 }, text: '赛太岁金毛犼！古语云望天犼喜搏龙——好极，今日西海敖烈便与你决一生死！' },
      { id: 'bl_bc_t59', cond: { tribNo: 59 }, text: '盘丝洞七蛛精！千丝万缕困不住腾云驾雾之躯，看枪！' },
      { id: 'bl_bc_t60', cond: { tribNo: 60 }, text: '百眼蜈蚣！千道黄雾金光虽毒，我自凌空三跃直刺你眉心死穴！' },
      { id: 'bl_bc_t62', cond: { tribNo: 62 }, text: '狮驼青狮白象！体型笨重如山，正好做我来回电闪穿刺的活靶子！' },
      { id: 'bl_bc_t63', cond: { tribNo: 63 }, text: '金翅大鹏雕！世传大鹏以龙为食？哼，今日我这条西海逆鳞，定扎穿你的咽喉！' },
      { id: 'bl_bc_t65', cond: { tribNo: 65 }, text: '比丘白鹿国丈！当年你在寿星座下何等温顺，下界竟害千童性命，该杀！' },
      { id: 'bl_bc_t69', cond: { tribNo: 69 }, text: '陷空山白毛鼠！地洞深三百里又如何，银枪引天雷直劈地底！' },
      { id: 'bl_bc_t74', cond: { tribNo: 74 }, text: '九灵元圣！九首狮吼震动九泉，且看震不震得碎我这一腔真龙傲骨！' },
      { id: 'bl_bc_t76', cond: { tribNo: 76 }, text: '玄英洞三犀王！当年败逃西海被我父王龙兵围剿，今日在岸上便结果了你们！' },
      { id: 'bl_bc_t78', cond: { tribNo: 78 }, text: '天竺玉兔！抛绣球招惹我师父，也不问问座下白龙答不答应！' },
      { id: 'bl_bc_t81', cond: { tribNo: 81 }, text: '通天老鼋！同属四海鳞甲一脉，经卷乃师门心血，得罪了！' },
      // 通用本色应战池 (49条)
      { id: 'bl_bc_g01', text: '西海龙王三太子敖烈在此！收起你轻视脚力的眼光，接我白龙吟雷枪！' },
      { id: 'bl_bc_g02', text: '枪出如电，龙行无踪——你连看清我枪尖的资格都没有！' },
      { id: 'bl_bc_g03', text: '十万八千里隐忍不发，只为今日一枪惊破九重天！' },
      { id: 'bl_bc_g04', text: '四海龙族的威严，岂容尔等山精野魅践踏！看枪！' },
      { id: 'bl_bc_g05', text: '你招式虽猛却笨重不堪，三段踏云掠顶而过，取你首级如探囊！' },
      { id: 'bl_bc_g06', text: '莫眨眼！真龙雷霆闪贯空之时，胜负便已分晓！' },
      { id: 'bl_bc_g07', text: '昔日殿上明珠我都敢一把火烧了，还怕你这区区守关妖王？' },
      { id: 'bl_bc_g08', text: '银鳞冷甲映霜雪，一点寒芒破万军——出招罢！' },
      { id: 'bl_bc_g09', text: '往常大师兄在前斩将，今日换我敖烈独挑大梁，断不弱师门名头！' },
      { id: 'bl_bc_g10', text: '听见枪尖嗡鸣的雷声了么？那是为你敲响的丧钟！' },
      { id: 'bl_bc_g11', text: '翻身化电落青雷，贴身游斗正是我龙家绝学！' },
      { id: 'bl_bc_g12', text: '你既镇守此难残页，便拿项上妖丹来祭我枪缨！' },
      { id: 'bl_bc_g13', text: '好重的妖煞！正好激出我血脉深处的苍溟狂雷！' },
      { id: 'bl_bc_g14', text: '潜渊十载无人问，一跃冲天四海惊——受死！' },
      { id: 'bl_bc_g15', text: '少说废话！快枪手从不在死人身上浪费口舌！' },
      { id: 'bl_bc_g16', text: '任你铜墙铁壁，难挡雷霆一刺贯透前胸后背！' },
      { id: 'bl_bc_g17', text: '传送法阵就在殿后，挡路者，唯有一死！' },
      { id: 'bl_bc_g18', text: '龙有逆鳞，触之必怒；阻我师门西行者，杀无赦！' },
      { id: 'bl_bc_g19', text: '看清你起手红芒破绽了，幻影掠过便是十连疾刺！' },
      { id: 'bl_bc_g20', text: '三才天书引动九霄雷脉，此枪之威堪比天劫！' },
      { id: 'bl_bc_g21', text: '休想用弹幕封我走位，踏云三跃自有广阔天空！' },
      { id: 'bl_bc_g22', text: '虽褪凡马之形，不改千里奔袭之志——接招！' },
      { id: 'bl_bc_g23', text: '西海清流不染尘垢，一枪挑散你这满殿腥风！' },
      { id: 'bl_bc_g24', text: '当年二郎真君与哪吒三太子俱是少年英杰，敖烈岂甘人后！' },
      { id: 'bl_bc_g25', text: '你吼声震天，不过是虚张声势掩饰转身笨拙罢了！' },
      { id: 'bl_bc_g26', text: '银龙破雾寒光彻，不斩妖王誓不还！' },
      { id: 'bl_bc_g27', text: '好一尊凶悍魔躯，倒配得上我全力施展真龙闪！' },
      { id: 'bl_bc_g28', text: '疾风知劲草，乱局显真龙——来战！' },
      { id: 'bl_bc_g29', text: '莫拿凡间刀枪丈量龙宫神兵，一触即溃！' },
      { id: 'bl_bc_g30', text: '枪锋已指你眉心，还有何遗言？' },
      { id: 'bl_bc_g31', text: '雷光一闪三百步，取完妖丹不沾衣！' },
      { id: 'bl_bc_g32', text: '纵你在残卷中重活百次，遇上我亦是百次穿心！' },
      { id: 'bl_bc_g33', text: '锯角犹存冲霄志，执枪敢破万重山！' },
      { id: 'bl_bc_g34', text: '这方擂台宽敞得很，足够我化龙来回贯穿七八趟！' },
      { id: 'bl_bc_g35', text: '不靠蛮力硬拼，唯凭毫厘之间的极速绝杀！' },
      { id: 'bl_bc_g36', text: '苍龙出水风雷动，魑魅魍魉尽低头！' },
      { id: 'bl_bc_g37', text: '今日不为自己争功，只为替师门扫清这页残障！' },
      { id: 'bl_bc_g38', text: '气机已锁，九天青雷随枪而落——破！' },
      { id: 'bl_bc_g39', text: '看招！这一刺含十万八千里风霜之威！' },
      { id: 'bl_bc_g40', text: '妖王请看清，刺穿你护甲的乃是西海正宗龙雷！' },
      { id: 'bl_bc_g41', text: '心静如深海，动若九天雷！纳命来！' },
      { id: 'bl_bc_g42', text: '纵你发狂加速，在我眼里依旧慢如蜗行！' },
      { id: 'bl_bc_g43', text: '银鞍白马今安在，唯有雷枪照胆寒！' },
      { id: 'bl_bc_g44', text: '休走！胜负就在这三息电光之间！' },
      { id: 'bl_bc_g45', text: '以雷淬枪，以战养魂——请赐教！' },
      { id: 'bl_bc_g46', text: '四海潮音助我枪势，看你往何处逃！' },
      { id: 'bl_bc_g47', text: '今日方展凌云爪，一枪定鼎此重关！' },
      { id: 'bl_bc_g48', text: '破风穿云，杀！' },
      { id: 'bl_bc_g49', text: '白龙吟彻九霄寒，接枪！' }
    ],

    bossKill: [
      { id: 'bl_bk_01', text: '收枪振落电芒！片鳞未染，此劫已破！' },
      { id: 'bl_bk_02', text: '天下武功唯快不破，直到倒下你也没摸到我的衣角。' },
      { id: 'bl_bk_03', text: '银龙归鞘，雷声渐歇——不堪一击。' },
      { id: 'bl_bk_04', text: '宝象国那一剑的遗憾，今日总算在枪尖补全了。' },
      { id: 'bl_bk_05', text: '拾起神品披挂与灵蕴，化电踏入传送门！' },
      { id: 'bl_bk_06', text: '四海真龙之威，岂是残卷妖孽所能揣度！' },
      { id: 'bl_bk_07', text: '一闪贯胸，青雷收尾——干净利落！' },
      { id: 'bl_bk_08', text: '不负西海龙族威名，再下一城！' },
      { id: 'bl_bk_09', text: '妖风散尽天光澈，这页难簿已平。' },
      { id: 'bl_bk_10', text: '三段踏云戏群魔，呼吸未乱便已收工。' },
      { id: 'bl_bk_11', text: '好一件流光溢彩的护身宝甲，正配银鳞！' },
      { id: 'bl_bk_12', text: '昔为无言白马，今作破阵雷龙！' },
      { id: 'bl_bk_13', text: '动作太慢，前摇太长，败得不冤。' },
      { id: 'bl_bk_14', text: '将精纯灵蕴收入囊中，赴土地仙祠择路西进。' },
      { id: 'bl_bk_15', text: '白龙吟雷枪清鸣不止，似嫌此战尚未尽兴。' },
      { id: 'bl_bk_16', text: '若大师兄见我这般枪速，定也要夸一句好身手！' },
      { id: 'bl_bk_17', text: '雷火涤净凶坛，正道重开！' },
      { id: 'bl_bk_18', text: '纵有万钧蛮力，刺不中残影亦是枉然。' },
      { id: 'bl_bk_19', text: '轻抖枪缨寒星落，大步跨入法阵中。' },
      { id: 'bl_bk_20', text: '此关妖王已除，前途风清月朗。' },
      { id: 'bl_bk_21', text: '游龙穿花片叶不沾，连甘露都未曾动用。' },
      { id: 'bl_bk_22', text: '残页金纹归位，离九九归真更进一步！' },
      { id: 'bl_bk_23', text: '妖丹碎处青雷隐，唯余满地功德金。' },
      { id: 'bl_bk_24', text: '十万八千里蓄下的锐气，岂容小觑！' },
      { id: 'bl_bk_25', text: '收拢雷霆神通，静观前路司命双门。' },
      { id: 'bl_bk_26', text: '快刀斩乱麻，快枪破重劫！' },
      { id: 'bl_bk_27', text: '父王若见孩儿今日护法之功，当可宽怀一笑。' },
      { id: 'bl_bk_28', text: '电光石火决生死，痛快！' },
      { id: 'bl_bk_29', text: '顽甲虽坚，终碎于暴击雷芒之下。' },
      { id: 'bl_bk_30', text: '不恋战功，提枪直趋下一重险境！' },
      { id: 'bl_bk_31', text: '风雷俱静，唯见传送法门熠熠生辉。' },
      { id: 'bl_bk_32', text: '真龙过处无余孽，起行！' },
      { id: 'bl_bk_33', text: '三才修为贯通枪身，越打越觉轻灵顺畅。' },
      { id: 'bl_bk_34', text: '这波穿身落雷接三连突刺，天衣无缝！' },
      { id: 'bl_bk_35', text: '替师父扫平一处险隘，敖烈心安。' },
      { id: 'bl_bk_36', text: '莫怨我枪下无情，只怪你执迷阻道。' },
      { id: 'bl_bk_37', text: '寒芒敛入枪尖，拾宝过关！' },
      { id: 'bl_bk_38', text: '苍穹之下，再高断崖与再凶妖王皆可一跃而越！' },
      { id: 'bl_bk_39', text: '灵蕴满载，入土地庙再添一分仙缘。' },
      { id: 'bl_bk_40', text: '银枪斜指西天月，一笑破千军。' },
      { id: 'bl_bk_41', text: '守关大妖既灭，瘴气自散。' },
      { id: 'bl_bk_42', text: '好一场极速对决，浑身龙血舒畅！' },
      { id: 'bl_bk_43', text: '将旧兵刃炼作金铢回蓝，轻装简从再出发！' },
      { id: 'bl_bk_44', text: '雷音余韵绕梁，此难彻底了结。' },
      { id: 'bl_bk_45', text: '八部天龙护法之姿，初露峥嵘！' },
      { id: 'bl_bk_46', text: '瞬息千里斩妖首，潇洒入仙门。' },
      { id: 'bl_bk_47', text: '任尔诡计多端，难逃雷霆正法。' },
      { id: 'bl_bk_48', text: '拭枪不沾尘，昂首向下一劫！' },
      { id: 'bl_bk_49', text: '胜局已定，莫在原地久留。' },
      { id: 'bl_bk_50', text: '龙吟九霄惊万壑，又平一难！' },
      { id: 'bl_bk_51', text: '满地紫金宝光，挑件最趁手的披挂穿上！' },
      { id: 'bl_bk_52', text: '气贯长虹破魔障，走也！' },
      { id: 'bl_bk_53', text: '一刺定乾坤，无需第二枪补刀！' },
      { id: 'bl_bk_54', text: '西海惊涛拍碎岸，宵小尽成灰。' },
      { id: 'bl_bk_55', text: '身轻似燕，枪重如雷——过关！' },
      { id: 'bl_bk_56', text: '阴霾一扫而空，法阵大开。' },
      { id: 'bl_bk_57', text: '二师兄若见我这清场速度，怕是连肉包都赶不上捡！' },
      { id: 'bl_bk_58', text: '凝气归元，准备迎战更强妖尊。' },
      { id: 'bl_bk_59', text: '银甲生辉无半点划痕，完胜！' },
      { id: 'bl_bk_60', text: '邪魔伏诛，山川复明。' },
      { id: 'bl_bk_61', text: '踏云入阵，再探前路风云！' },
      { id: 'bl_bk_62', text: '狂雷洗地，寸妖不留！' },
      { id: 'bl_bk_63', text: '少年意气锋芒毕露，此行不虚。' },
      { id: 'bl_bk_64', text: '收枪负手望残卷，又合拢一页。' },
      { id: 'bl_bk_65', text: '疾如风，烈如雷，稳稳拿下！' },
      { id: 'bl_bk_66', text: '战利品悉数归仓，入祠休整！' },
      { id: 'bl_bk_67', text: '莫道潜龙久困渊，一朝腾跃破重天！' },
      { id: 'bl_bk_68', text: '妖魂溃散化清气，善哉。' },
      { id: 'bl_bk_69', text: '步法未停，战意正炽，继续向前！' },
      { id: 'bl_bk_70', text: '这一记真龙雷霆闪收尾，恰到好处！' },
      { id: 'bl_bk_71', text: '清泉漱口甘露盈，无惧前头恶仗。' },
      { id: 'bl_bk_72', text: '破关夺隘如履平地，走！' },
      { id: 'bl_bk_73', text: '枪尖冷月依旧，敌首已落尘埃。' },
      { id: 'bl_bk_74', text: '护法有功，龙心大快！' },
      { id: 'bl_bk_75', text: '择一扇良门踏入，直指终劫！' },
      { id: 'bl_bk_76', text: '风止云收见瑞彩，入阵！' },
      { id: 'bl_bk_77', text: '千招百式，不及惊雷一闪。' },
      { id: 'bl_bk_78', text: '这殿宇总算干净了，向前进发！' },
      { id: 'bl_bk_79', text: '金铢灵蕴俱全，不枉一番冲杀。' },
      { id: 'bl_bk_80', text: '银龙破壁去，再赴下一关！' },
      { id: 'bl_bk_81', text: '干脆利落，未费周章！' },
      { id: 'bl_bk_82', text: '逆鳞不可触，犯者必诛绝！' },
      { id: 'bl_bk_83', text: '霞光引路开新境，提枪直入！' },
      { id: 'bl_bk_84', text: '此难已靖，乘风西行！' }
    ],

    reviveMiracle: [
      { id: 'bl_rv_01', text: '昔日斩龙台下蒙观音大士救下性命，今朝又承杨柳甘露重塑龙躯——敖烈誓死破此劫！' },
      { id: 'bl_rv_02', text: '银鳞浴火重生，青雷贯注枪尖！方才折翼之辱，此刻百倍奉还！' },
      { id: 'bl_rv_03', text: '真龙岂能陨于阴暗妖窟！佛光震退群邪，看我真龙雷霆闪逆转战局！' },
      { id: 'bl_rv_04', text: '一滴南海甘露唤醒四海龙魂！三息无敌金身加护，谁敢挡我锋芒！' },
      { id: 'bl_rv_05', text: '锯角之痛尚能忍受，这点伤势何足挂齿！提枪再起，杀个片甲不留！' },
      { id: 'bl_rv_06', text: '金莲托起腾云足，狂雷重聚吟龙枪——好戏才刚刚开始！' },
      { id: 'bl_rv_07', text: '宝象国身负重伤我亦未曾退缩半步，今日满血重临，定斩妖首！' },
      { id: 'bl_rv_08', text: '多谢菩萨垂怜！洗尽淤血暗伤，我的枪速比方才更快三分！' },
      { id: 'bl_rv_09', text: '潜龙出死入生，方显九天雷威！群妖听令，俯首领死！' },
      { id: 'bl_rv_10', text: '护体金盾凝如龙甲，看清你的杀招套路了，这一回绝不失手！' },
      { id: 'bl_rv_11', text: '师父与三位师兄尚待佳音，西海三太子怎能在此折戟！起！' },
      { id: 'bl_rv_12', text: '佛光涤荡妖氛，银龙长吟破晓——接我翻盘绝杀一刺！' },
      { id: 'bl_rv_13', text: '不经雷劈火炼，焉成八部天龙真身！再来过！' },
      { id: 'bl_rv_14', text: '气血充盈如沧海涨潮，三段踏云重掌制空！' },
      { id: 'bl_rv_15', text: '死里逃生锋更锐，一枪贯日破重围！' },
      { id: 'bl_rv_16', text: '南海慈光映银甲，魑魅魍魉安敢欺！' },
      { id: 'bl_rv_17', text: '把方才大意吃下的亏，连本带利扎回你心口！' },
      { id: 'bl_rv_18', text: '龙魂不灭，雷枪不折！重返战团！' },
      { id: 'bl_rv_19', text: '甘露化作奔雷力，顷刻荡平此魔坛！' },
      { id: 'bl_rv_20', text: '傲骨铮铮凌霜雪，浴佛归来再登峰！' },
      { id: 'bl_rv_21', text: '金光护体无挂碍，游龙瞬闪取敌首！' },
      { id: 'bl_rv_22', text: '苍龙昂首重啸天，破劫就在今朝！' }
    ],

    runVictory: [
      { id: 'bl_vc_01', cond: { firstWin: true }, text: '破劫金门洞开！昔年盘绕灵山擎天华表柱，今日凭掌中银枪独平四劫——谁还道白龙只是脚力！' },
      { id: 'bl_vc_02', text: '万里风雷收枪尖，四劫妖尊尽伏诛！携满身璀璨灵蕴凯旋归营！' },
      { id: 'bl_vc_03', text: '化马十万八千里修的是隐忍，执枪破尽残卷证的是锋芒，两不相负！' },
      { id: 'bl_vc_04', text: '漫天金莲映照银白龙鳞，西海三太子今日终算扬眉吐气！' },
      { id: 'bl_vc_05', text: '八部天龙广力菩萨之果位，非关封赏，全在这一枪一闪的护法实绩之中。' },
      { id: 'bl_vc_06', text: '回望来路绝壑熔岩皆踏于足下，三段踏云果真纵横无碍！' },
      { id: 'bl_vc_07', text: '终劫魔窟既破，残卷金光弥合，不负观音大士昔年鹰愁涧点化之恩。' },
      { id: 'bl_vc_08', text: '收起白龙吟雷枪，回营与大师兄切磋武艺、听师父讲经，岂不快哉！' },
      { id: 'bl_vc_09', text: '神装加身，三才贯通，这一局如电光行空，一气呵成！' },
      { id: 'bl_vc_10', text: '若西海父王与摩昂表兄得见此景，当知敖烈早非昔日莽撞少年。' },
      { id: 'bl_vc_11', text: '将丰厚灵蕴供入土地仙祠，淬炼龙魂仙根，下次再闯更高劫度！' },
      { id: 'bl_vc_12', text: '惊雷歇处祥云起，一骑银龙入紫微。功德圆满！' },
      { id: 'bl_vc_13', text: '群妖辟易山河净，再无魑魅敢阻西行坦途！' },
      { id: 'bl_vc_14', text: '不假外求，单凭极速与锐枪杀出重围，痛快淋漓！' },
      { id: 'bl_vc_15', text: '金门瑞气洗涤征尘，浑身龙鳞澄澈如玉。' },
      { id: 'bl_vc_16', text: '残卷未尽之处，只要师门有召，敖烈随时化龙再战！' },
      { id: 'bl_vc_17', text: '十万八千里铁蹄与九霄雷枪合而为一，方是真圆满。' },
      { id: 'bl_vc_18', text: '踏碎魔城千重浪，笑迎佛国万年春！' },
      { id: 'bl_vc_19', text: '快意恩仇破四劫，枪缨犹带紫霞香。' },
      { id: 'bl_vc_20', text: '潜渊跃海终成圣，潇洒收枪跨金门！' },
      { id: 'bl_vc_21', text: '云销雨霁天宇阔，真龙归去自逍遥。' },
      { id: 'bl_vc_22', text: '圆满破关！且归营地整备，静候新程！' }
    ],

    runDefeat: [
      { id: 'bl_df_01', text: '啧，突进太深被妖招擦中……携灵蕴暂归土地仙祠，淬炼龙躯后再来取他性命！' },
      { id: 'bl_df_02', text: '潜龙勿用，暂敛锋芒。回营升满仙根气血，下局必以快枪一击必杀！' },
      { id: 'bl_df_03', text: '方才三段跳早用了一段未避开地面震波，记下节奏，下次绝不再犯！' },
      { id: 'bl_df_04', text: '银鳞虽染血，傲骨未曾弯！灵蕴分毫不失，少顷重返战局！' },
      { id: 'bl_df_05', text: '真龙雷霆闪差半秒冷却……下回择装当备缩减冷却与回蓝词条！' },
      { id: 'bl_df_06', text: '鹰愁涧潜修数载尚且耐得住，一时胜败岂能挫我锐气！' },
      { id: 'bl_df_07', text: '此劫妖王防高血厚，回营换【西海玄冰相】碎冰破甲再来克他！' },
      { id: 'bl_df_08', text: '化作一缕银电退归仙祠，留得真灵在，来局惊天雷！' },
      { id: 'bl_df_09', text: '莫教二师兄见了又要唠叨，调匀龙息即刻再发！' },
      { id: 'bl_df_10', text: '刚极易折，师父所言极是……下局进退当更留三分余地。' },
      { id: 'bl_df_11', text: '看清这妖王发狂后的连招路数了，再来交锋定叫他刺刺见血！' },
      { id: 'bl_df_12', text: '十万八千里风霜都踏过来了，跌这一跤只当磨砺枪尖！' },
      { id: 'bl_df_13', text: '甘露早尽难以为继，回祠堂强化净瓶与气血再战不迟。' },
      { id: 'bl_df_14', text: '胜不骄败不馁，方配得上四海龙裔之名！' },
      { id: 'bl_df_15', text: '暂收银枪归云海，蓄满狂雷再破关！' },
      { id: 'bl_df_16', text: '本局所获灵蕴已入仙库，每战一局，枪锋便利一分！' },
      { id: 'bl_df_17', text: '差一线便可踏入下一传送门，可惜！下局定不贪刀！' },
      { id: 'bl_df_18', text: '风云变幻本无常，重披银甲又何妨！' },
      { id: 'bl_df_19', text: '妖孽休得猖狂，西海敖烈片刻便回！' },
      { id: 'bl_df_20', text: '将败因铭记于心，化作下一次出枪的准头！' },
      { id: 'bl_df_21', text: '龙潜深渊蓄风雷，转身再闯八十一难！' },
      { id: 'bl_df_22', text: '调息片刻，白龙吟雷枪绝不蒙尘！' }
    ]
  };

  // ============================================================================
  // 九、九九八十一难逐难专属妖王叫阵词（1~81难全覆盖 + 四大经典Boss兼容）
  // ============================================================================
  const TRIB_STAGE_BOSS_TAUNTS = {
    1: '金蝉子轻慢大法既遭贬谪，这第一道斩仙试炼，且看你如何渡过！',
    2: '洪江渡口风高夜黑，顺我刘洪者昌，逆我者抛入江心喂鱼！',
    3: '木板孤儿也敢横渡洪江？万丈狂澜之下，尽是我水族血食！',
    4: '江州衙门铁锁森严，敢来翻十八年前的旧案，拿命来填！',
    5: '双叉岭前寅将军在此！细皮嫩肉的东土僧人，正好与我下酒！',
    6: '熊山君、特处士玄铁重盾当关！任你神兵利器，休想伤我分毫！',
    7: '踏入双叉密林，漫山火羽毒箭便是尔等葬身之地！',
    8: '两界山麓斑斓虎卫巡山！五行山帖虽揭，此路依旧不通！',
    9: '鹰愁陡涧深不见底，凡马龙驹入水皆成白骨，谁敢探渊！',
    10: '观音禅院这把夜火烧得痛快！锦襕袈裟既亮了相，便休想带走！',
    11: '黑风洞中正办佛衣盛会！本王黑缨枪下，管叫你有来无回！',
    12: '福陵山云栈洞凶威犹在！未受戒律的狂暴魔影，碾碎一切来敌！',
    13: '三昧神风吹天地，灵山佛祖亦皱眉！吃我黄风大圣一叉！',
    14: '金蝉脱壳留虎皮，调虎离山摄唐僧——我乃黄风岭下虎先锋！',
    15: '八百流沙鹅毛沉底！九世取经人皆葬我腹，今朝凑个十全！',
    16: '弱水漩涡卷白骨，敢渡流沙河者，先问过水底凶煞！',
    17: '真真爱爱怜怜绣球高抛，富贵温柔乡里，看你禅心守得几时！',
    18: '万寿山五庄观清修重地！擅闯人参果园者，剑阵无情！',
    19: '乾坤一袖笼日月！伤我先天灵根，便是大罗金仙亦难逃镇压！',
    20: '白虎岭上三变幻形！师徒猜忌生隙之时，便是本夫人享寿之刻！',
    21: '碗子山黑松林藤蔓缠魂，迷途行者休想走出这片鬼林！',
    22: '波月洞前巡山令急，宝象国的家书，你一封也休想送到！',
    23: '天上二十八宿奎木狼在此！金銮殿咒水一泼，管教你化作笼中恶虎！',
    24: '平顶山金角大王在此！紫金红葫芦口朝天，叫你一声敢答应么！',
    25: '莲花洞银角大王驾到！幌金绳配须弥三山压顶，神仙也压出三昧血！',
    26: '乌鸡国江山早归我手，文殊菩萨尚且纵我三分，尔等安敢多事！',
    27: '压龙洞九尾狐火迷人魂，夺我干儿幌金绳，老身岂能善罢甘休！',
    28: '枯松涧火云洞圣婴大王在此！三百年三昧真火，连齐天大圣也烧退三舍！',
    29: '急如火、快如风！火云六健将风火轮下，寸草不生！',
    30: '紫赤毒烟迷火眼，冷水浇身火更狂——尝尝焚心真火的滋味！',
    31: '三十六把天罡刀化作千叶莲台，一步踏错万刃穿身！',
    32: '黑水河底波涛黑，我乃泾河第九子鼍龙！九节钢鞭下莫讲亲情！',
    33: '车迟国敬道灭僧！凡和尚入境，一概锁去三清观拉车苦役！',
    34: '车迟国师虎力大仙在此！五雷祈雨、滚油洗澡，敢与贫道赌命么！',
    35: '鹿力羊力双仙联手！冷龙护体奇术通玄，砸烂你的佛门招牌！',
    36: '通天河一夜冰封八百里！不献童男童女，便拿取经人祭我铜锤！',
    37: '斑衣鳜婆妙计封河，履冰踏雪之客，尽落我水鼋之第瓮中！',
    38: '寒铁巨螯坚不可摧，水底宫阙岂容外人擅闯！',
    39: '金兜山独角兕大王在此！太上金刚琢一晃，漫天神兵水火尽入我彀！',
    40: '普天星宿、水火雷公皆败金兜洞前，尔等还有何伎俩？',
    41: '十八粒金丹砂化漫天金光幻阵，定力稍差便陷流沙寸步难移！',
    42: '解阳山聚仙庵如意真仙把关！不讨红孩儿血债，半滴落胎泉也休想取！',
    43: '西梁女国迎亲仪仗已备，留恋红尘抑或强闯王城，由不得你！',
    44: '琵琶洞毒敌夫人在此！如来左指尚受我倒马毒桩一蜇，谁敢近身！',
    45: '杨家庄剪径好汉拦路！惹得师徒反目再贬心猿，正称群魔心意！',
    46: '善聆音察理、知前后万物——你既是我，我既是你，灵山果位当归六耳！',
    47: '八卦炉落砖燃尽八百里赤地，铜头铁脑入此山亦要化作汁水！',
    48: '翠云山芭蕉宝扇在此！一扇阴风起，管把你吹去八万四千里外！',
    49: '混铁棍横扫乾坤，法天象地顶立苍穹！我乃七大圣之首平天牛魔王！',
    50: '金光宝塔佛宝已入碧波潭，奔波儿灞在此巡守，闲杂人等退散！',
    51: '九首齐张血翼蔽空！碧波潭驸马九头虫在此，谁敢讨要佛宝舍利！',
    52: '木仙庵松竹梅桧月下清吟，杏仙捧茶相邀，何苦执着苦行西去？',
    53: '小雷音寺黄眉老佛升座！金铙合拢不见天日，人种袋开尽收群仙！',
    54: '二十八宿与五方揭谛俱困袋中，此间小雷音便是尔等绝路！',
    55: '七绝山稀柿同恶臭八百里！红鳞大蟒双目如灯，一口吞尽过路客！',
    56: '麒麟山有来有去奉命下战书，识相的早献城池免遭涂炭！',
    57: '麒麟山赛太岁在此！项下三枚紫金铃一晃，红火浓烟黄沙三百丈！',
    58: '獬豸洞毒沙遮天蔽日，一步踏入便教你皮开肉绽！',
    59: '盘丝洞七姐妹脐吐万道银丝！天罗情网罩顶，插翅亦难腾飞！',
    60: '黄花观百眼魔君在此！两肋下千只金眼齐放黄雾，困死你这破劫人！',
    61: '大王叫我来巡山！八百里狮驼岭小妖四万七，吓也吓破你的苦胆！',
    62: '狮驼洞青狮一口曾吞十万天兵，白象长鼻卷裂山岳——纳命来！',
    63: '云程万里金翅大鹏雕在此！扇一翅九万里追碎筋斗云，阴阳瓶里化脓血！',
    64: '狮驼魔城铁桶江山，四万七千狼牙重卫踏平西行路！',
    65: '比丘国丈仙方已就，只差你这取经人的心肝作长生药引！',
    66: '清华洞迷魂香风阵阵，金殿之上孰真孰邪岂由外人置喙！',
    67: '黑松林弱女啼哭求救——慈悲心肠动一分，索命暗刺进一寸！',
    68: '镇海禅林夜深人静，三日之内吸干满寺僧侣元阳！',
    69: '陷空山无底洞深三百里！地涌夫人双股剑下，天王老子也得留情！',
    70: '灭法国君立誓杀满一万和尚，只差你们几颗光头凑齐功德！',
    71: '隐雾山折岳连环洞南山大王在此！分瓣梅花计下，真假唐僧看你如何救！',
    72: '凤仙郡米山面山未倒、金锁未断，三年赤地焦土，谁敢私降雨泽！',
    73: '玉华州兵刃尽归我豹头山虎口洞！明日便开钉钯嘉会庆功！',
    74: '九首摇动吼彻三圣九泉！我乃竹节山九灵元圣，赤手生擒尔等何须兵刃！',
    75: '九曲盘桓洞六狮齐出，铁钺开山，看谁敢犯狮祖威严！',
    76: '玄英洞辟寒辟暑辟尘三犀王在此！寒冰宣花斧下，休提金平灯油旧事！',
    77: '追至西海龙宫亦不服软，青龙山重甲犀卫死战到底！',
    78: '天竺高台彩楼招婚！广寒捣药玉杵敲碎凡骨，看你往哪儿躲！',
    79: '铜台府夜雨冤狱森森，索命阴魂缠足，叫你有口难辩！',
    80: '凌云仙渡独木桥下激湍千丈！不斩断这具凡胎执念，休想登彼岸！',
    81: '通天河老鼋在此久候！既忘替我问佛祖寿年，今日连人带经一并沉水！'
  };

  const LEGACY_BOSS_TAUNTS = {
    black_bear_king: TRIB_STAGE_BOSS_TAUNTS[11],
    yellow_wind_sage: TRIB_STAGE_BOSS_TAUNTS[13],
    white_bone_lady: TRIB_STAGE_BOSS_TAUNTS[20],
    bull_demon_king: TRIB_STAGE_BOSS_TAUNTS[49]
  };

  // 当玩家在20局内再次随机到同一劫难/同一妖王时，自动启用【宿敌重逢/狂暴叫阵池】（52条），确保Boss台词亦100%零重复！
  const BOSS_REMATCH_POOL = [
    { id: 'br_01', text: '又是你这破劫行者！前番碎我法身之恨，今日残卷重凝定讨血债！' },
    { id: 'br_02', text: '冤家路窄！这一回本王汲取残卷煞气更胜往昔，休想再侥幸过关！' },
    { id: 'br_03', text: '哼，熟面孔！上回看清了你的招式路数，今番便是你的死期！' },
    { id: 'br_04', text: '八十一难轮回不息，本王不灭，此关便永远是你的鬼门关！' },
    { id: 'br_05', text: '胆敢二度踏入本王领地！今天把你连魂带魄钉死在殿柱上！' },
    { id: 'br_06', text: '前番一时大意着了你的道，今日妖丹沸腾，十合之内取你首级！' },
    { id: 'br_07', text: '残卷天机偏将你我再聚一堂——好极，新仇旧账一并清算！' },
    { id: 'br_08', text: '莫以为赢过一回便天下无敌，此番劫力加持，教你寸步难进！' },
    { id: 'br_09', text: '闻着味儿就知道是你来了！守关妖阵早已重布，请君入瓮！' },
    { id: 'br_10', text: '任你闯过多少秘境，踏进这座大殿，规矩便由本王说了算！' },
    { id: 'br_11', text: '灵山碎卷赐我不死魔躯，你杀我一次，我便凶悍十倍！' },
    { id: 'br_12', text: '来得好！正愁满腔戾气无处宣泄，拿你的护体金光开刀！' },
    { id: 'br_13', text: '这趟西行路本就是无底深潭，看你有几条命够在本王殿前消耗！' },
    { id: 'br_14', text: '兵刃已用黑煞重淬，专破你那翻滚闪避的滑溜身法！' },
    { id: 'br_15', text: '休想踏进我身后传送法门半步，除非从本王尸骸上跨过去！' },
    { id: 'br_16', text: '诸天神佛皆已袖手，今日无人下界救你，痛痛快快决一生死！' },
    { id: 'br_17', text: '瞧你满身灵蕴宝光，吞了你这身修为，本王便可冲出残卷樊笼！' },
    { id: 'br_18', text: '天地不仁以万物为刍狗，你我皆是困局棋子，看谁吃掉谁！' },
    { id: 'br_19', text: '狂风怒号助我妖威，此战不死不休！' },
    { id: 'br_20', text: '又见面了！你的神通固然精进，本王的杀招亦早非吴下阿蒙！' },
    { id: 'br_21', text: '哼，换了一身披挂法相就认不出你了？照样砸成齑粉！' },
    { id: 'br_22', text: '山外青山魔外魔，想补齐难簿？做你的春秋大梦！' },
    { id: 'br_23', text: '每一道伤疤都刻着前番耻辱，今日非拿你项上人头洗刷不可！' },
    { id: 'br_24', text: '踏破铁鞋无觅处，你自己送上门来领死，省了本王巡山！' },
    { id: 'br_25', text: '看这漫天血煞，今夜便是取经人折戟沉沙之期！' },
    { id: 'br_26', text: '任你三才天书叠得再高，挨上本王全力重击一样筋骨尽碎！' },
    { id: 'br_27', text: '老相识，少叙闲话，亮出你压箱底的本命神通罢！' },
    { id: 'br_28', text: '这重关隘固若金汤，纵插双翅亦难飞渡！' },
    { id: 'br_29', text: '妖鼓三通震九霄，孩儿们退后，待本王亲自料理这厮！' },
    { id: 'br_30', text: '上回留你全尸已是仁慈，今番定教你神魂俱灭！' },
    { id: 'br_31', text: '西行道上白骨如山，多你一具不多，少你一具不少！' },
    { id: 'br_32', text: '残页之力灌注吾身，感受这毁天灭地的妖王真威罢！' },
    { id: 'br_33', text: '敢在太岁头上再动土，真是不知死字怎么写！' },
    { id: 'br_34', text: '你越战越快，本王便以千钧重势压断你的脊梁！' },
    { id: 'br_35', text: '休拿往昔胜绩夸口，此时此地，鹿死谁手犹未可知！' },
    { id: 'br_36', text: '洞门已锁，退路已断，唯有一方能站着走出此殿！' },
    { id: 'br_37', text: '本王苦候多时，就等与你再痛快厮杀三百回合！' },
    { id: 'br_38', text: '满堂鬼火皆为你燃，受死罢破劫人！' },
    { id: 'br_39', text: '纵是铜浇铁铸的金身，今日也要给你撕下一层皮来！' },
    { id: 'br_40', text: '哼，天道轮回又把你送到我刀口上，合该本王立功！' },
    { id: 'br_41', text: '莫看身后法阵了，你今生再无机会踏入那道光门！' },
    { id: 'br_42', text: '千山鸟飞绝，万径妖踪灭——唯留你葬身此窟！' },
    { id: 'br_43', text: '前番之败乃非战之罪，今日堂堂正正碾碎你！' },
    { id: 'br_44', text: '煞气冲顶，魔威无量！接本王绝命杀招！' },
    { id: 'br_45', text: '再闯十回八回，本王亦奉陪到底！拿命来！' },
    { id: 'br_46', text: '看你气息微促，一路闯关消耗不小吧？正好捡你便宜！' },
    { id: 'br_47', text: '十万妖魂凝聚一击，神佛难挡！' },
    { id: 'br_48', text: '既入凶门莫回头，吃我一记开山重击！' },
    { id: 'br_49', text: '好胆色！明知山有魔，偏向魔山行！' },
    { id: 'br_50', text: '今日便让你明白，为何此难能列九九天簿之中！' },
    { id: 'br_51', text: '废话休提，纳命祭旗！' },
    { id: 'br_52', text: '吼——！碎卷之下，万妖称尊！' }
  ];

  // 为单角色死忠玩家（连续20局满通80场Boss + 50次行军/奇遇传音）补足深水区核心台词池，确保极端单推亦100%零重复！
  const EXTRA_SINGLE_HERO_RESERVE = {
    wukong: {
      stageSolo: [
        '棒扫千山雪，云腾万里风——这等险地，还难不倒花果山老祖宗！',
        '耳朵眼里金针暖洋洋的，越是硬仗，它越欢喜！',
        '当年方寸山砍柴挑水七年才求得长生诀，跑这点山路算甚么！',
        '小妖们前赴后继送灵蕴，倒比蟠桃园摘桃子还爽利！',
        '翻身无敌帧卡在刀尖上，毫毛金身反炸一脸，这手艺没丢！',
        '金睛扫过石缝暗处，宝箱与天书祭坛一个也休想漏掉！',
        '莫管天上有几重宫阙，脚下踏实的唯有这一寸寸破劫路！',
        '锁子黄金甲铿锵作响，听着便叫人浑身舒坦！',
        '一跃二段登飞檐，千钧坠地震群邪——猴儿们学着点！',
        '这局手气不赖，法宝副武与主修红书正对脾胃！',
        '妖风再狂也吹不乱俺两根雉鸡翎，只管向前杀去！',
        '任凭山高涧深，筋斗一翻便是通途！',
        '且留三分法力防备前头冷箭，老江湖从不吃暗亏！',
        '连斩势头正旺，脚下步子轻快得像踩了风火轮！',
        '前番天宫十万神将摆阵尚且漏洞百出，何况这群山野妖兵！',
        '打碎一处劫障，心头便敞亮一分，走！',
        '棒尖挑落残灯火，且向深殿觅妖踪！',
        '有甘露兜底，大可放开手脚痛快抢攻！',
        '这残卷迷宫九曲十八弯，却绕不出老孙一双金睛！',
        '气血滚烫，战意冲霄，正宜一鼓作气拿住洞主！',
        '莫学呆子见宝就走不动道，挑最合流派的词条穿便是！',
        '风雷隐隐聚殿前，好戏就在百步外！'
      ],
      bossClash: [
        '三星洞学艺、八卦炉淬身，俺老孙这一身本事专治不服！',
        '莫摆你那洞主谱儿！金箍棒抬起来，高的砸扁、矮的砸陷！',
        '看你妖气凝而不散，倒是个练棒的好桩子！',
        '今日不斗法宝变化，只凭快准狠三板铁棍敲开你的乌龟壳！',
        '天庭册封俺齐天大圣尚嫌官小，你这山大王算老几！',
        '火眼金睛一眨，你往左闪还是往右扑早写在脸上了！',
        '来来来，让孙外公称称你这颗妖丹够不够三斤重！',
        '少吹大气！接得下老孙腾空千钧砸再狂不迟！',
        '你这洞府阴森发霉，待俺一棒砸穿穹顶放点日头进来！',
        '七十二般变化藏于一棍之中，虚实莫测看你如何防！',
        '便是四海龙王齐至也休想按住这根定海铁，接招！',
        '呔！吃俺一记迎面当头棒，先削你三成锐气！',
        '看你凶神恶煞的模样，吓唬过路樵夫还行，吓老孙差远喽！',
        '金光毫毛布满场，真假猴王齐挥棒——受死！',
        '老孙赶着过传送门挑仙缘呢，十合之内解决你！',
        '兵刃相交火星四溅，这才叫真刀真枪的硬仗！',
        '纵有漫天弹幕火球，俺一个翻滚贴脸照样敲你闷棍！',
        '当年凌霄殿外九曜星官轮番上阵皆败俺手，再添你一个！',
        '别护着你那宝贝披挂了，打赢了自然归俺穿戴！',
        '心猿咆哮山岳震，今日此关必破无疑！',
        '你既不肯让路，老孙便从你头顶踏过去！',
        '好一口锋利妖兵，可惜握在蠢材手里白瞎了！',
        '棒起风雷动，棒落鬼神惊——看打！',
        '哪怕残卷给你加了十倍血皮，老孙暴击连环一样削成白骨！',
        '莫退莫闪，与齐天大圣正面硬撼一记！',
        '十万八千里路上的绊脚石，老孙见一块踢碎一块！',
        '叫声泼魔你敢应么？不应也吃俺三棍！',
        '黄金甲映赤焰瞳，今日送你入轮回！',
        '看招！这记重砸专碎天下硬壳！',
        '大圣驾临，百妖俯首——动手罢！',
        '多说无益，让你尝尝骨断筋折的痛快！',
        '横棒当胸笑群魔，且看谁人站到最后！',
        '风急天高猿啸烈，一棍开天破此关！',
        '休拿性命开玩笑，老孙这棒子可收不住力！'
      ]
    },
    tangseng: {
      stageSolo: [
        '芒鞋踏碎岭头霜，只要心向灵山，荒原亦生金莲。',
        '九环轻振破阴霾，一步一印皆是修持。',
        '古刹钟声虽远，贫僧胸中自有长明佛灯。',
        '观妖兵进退有序，当借地形高低从容度之。',
        '不贪冒进之功，护持金身圆满方能行稳致远。',
        '露湿僧袍浑不觉，唯见杖端瑞彩一分分凝实。',
        '昔在长安译经论道，何曾想有一日亲手荡魔除凶。',
        '三才妙法随息流转，举手投足皆合禅门法度。',
        '恶境正是道场，群魔亦为逆增上缘。',
        '每度化五名迷途妖卒，便觉灵台更添一分生机。',
        '飞矢毒火袭来之时，轻翻僧袂避其锋芒即可。',
        '此间山水本具灵秀，只因残卷戾气盘踞方显狰狞。',
        '宝珠贯透重围，金莲涤清余孽，章法井然。',
        '检视随身法器衣钵，纤尘不染，甚好。',
        '莫以善小而不为，莫以妖微而轻敌。',
        '前路石径蜿蜒，隐闻守关大殿妖鼓沉沉。',
        '心定则气和，气和则杖准，无惧前头风浪。',
        '甘露净瓶温润如玉，留待决战之时护体救急。',
        '十万八千里非一日之功，耐住性子一寸寸走完。',
        '破山中贼易，破心中贼难——内外兼修方得自在。',
        '梵音随风散入山谷，愿消此地百年怨气。',
        '殿门已在望，整肃袈裟，准备迎战此难正主。'
      ],
      bossClash: [
        '施主盘踞要津残害生灵，贫僧今日唯有以杖代经，点醒痴顽！',
        '九环震响惊天地，莫谓沙门无利刃！请赐教！',
        '皮囊强横终归朽坏，唯有正法金光万劫常存！',
        '贫僧不求杀生，奈何施主自绝生路，得罪了！',
        '金莲法阵既开，任你凶威滔天亦难越雷池！',
        '十世苦修铸就这一身不退风骨，岂惧你妖氛压境！',
        '你看贫僧似凡夫，贫僧看你如梦幻泡影——接杖！',
        '妄念如毒火自焚其身，且接贫僧一记清凉佛珠！',
        '西行大愿重逾须弥山，挡路之魔皆当辟易！',
        '不借天威，不唤神将，玄奘一人一杖足平此殿！',
        '看你招式戾气太盛，收势必有空门，善哉！',
        '袈裟虽软可御寒风，锡杖虽古能碎妖甲！',
        '前尘因果今日结，休怪佛门金刚手！',
        '心无恐怖，远离颠倒梦想——妖王请出招！',
        '三界迷途者众，若言语劝你不醒，便以痛棒喝之！',
        '护体金钟已成，纵你全力猛扑亦难撼根本！',
        '此殿暗无天日久矣，且放万道佛光普照幽冥！',
        '莫贪贫僧一点元阳血肉，怕你消受不起金蝉真火！',
        '步步生莲迎恶浪，声声佛号破狂澜！',
        '你守残卷执念不放，贫僧便替你斩断这重枷锁！',
        '法力如海绵绵不绝，久战之下必见分晓！',
        '宁折不弯唐御弟，今日在此证菩提！',
        '邪光虽盛终难久，且看金莲破夜来！',
        '一杖挑开生死路，慈悲怒目两相宜！',
        '休用鬼魅伎俩惑人，灵台明镜纤毫不爽！',
        '既列八十一难之中，贫僧自当堂堂正正踏过此关！',
        '铜环鸣处群邪惧，宝珠飞时铁石摧！',
        '还请让开身后法阵，否则杖落无悔！',
        '纵历百死千难，此去西天矢志不渝！',
        '敛眉合十礼先尽，挥杖降魔威后行！',
        '苦海茫茫无岸处，贫僧一杖作慈航！',
        '莫再咆哮逞凶，佛光之下原形毕露！',
        '浩然禅意充塞天地，妖王接招罢！',
        '阿弥陀佛，这一战，为你除业，为世开平！'
      ]
    },
    bajie: {
      stageSolo: [
        '摸摸肚皮还算圆实，再打十来只小妖凑顿夜宵正好！',
        '这双草鞋踏遍四大部洲，跑快点连火星子都能踩出来！',
        '老猪耳朵大有福气，路边藏着的宝箱隔老远就听见动静啦！',
        '九齿钉钯扛在肩头沉甸甸的，给人十足的安全感！',
        '小妖怪们别躲躲藏藏，乖乖爆出肉包金铢孝敬猪爷爷！',
        '旋风钯转完一圈神清气爽，连腰酸背痛都治好了！',
        '猴哥爱走高台险路，老猪偏爱平地横推，省心又稳当！',
        '瞧这满身宝甲金光，回高老庄准能把乡亲们看呆喽！',
        '遇事不决转旋风，减伤六成带吸血，谁用谁知道！',
        '天河水帅的底子还在，走位腾挪半点不含糊！',
        '这残卷风景倒是五花八门，就是少了家卖热汤面的馆子！',
        '二段回勾一拉一个准，远程射冷箭的妖兵最怕老猪这招！',
        '攒够灵蕴回土地庙把气血再往上堆，肉成一座铁山！',
        '喘匀一口粗气，握牢钯柄，前头硬仗快到了！',
        '别看老猪嘴碎，眼珠子可一直盯着怪物的红光前摇呢！',
        '一跃下砸震翻一片，趁他们晕头转向挨个拍扁！',
        '金铢叮当响，听得老猪干劲十足！',
        '金刚绿书叠起来，血条长得快装不下屏幕啦！',
        '哪怕前路刀山火海，为了功成圆满也得往前拱！',
        '把不顺手的旧兵刃炼化成蓝量，一点也不浪费！',
        '前方妖风腥臭扑鼻，八成是个吃人不吐骨头的狠货！',
        '勒紧裤腰带，天蓬大元帅准备砸门喽！'
      ],
      bossClash: [
        '呔！猪祖宗驾到！识相的把宝匣肉包全交出来饶你不死！',
        '别拿豆包不当干粮，别拿天蓬元帅不当正神——看钯！',
        '你这身板看着挺壮实，来跟老猪比比谁的力气更沉！',
        '老君神冰铁铸就九齿锋芒，专刨各路铜皮铁骨！',
        '少在老猪跟前龇牙咧嘴，惹急了一旋风把你连窝端了！',
        '想吃我师父？先问问老猪这五千零四十八斤铁钯答不答应！',
        '嘿嘿，满身宝贝灵光闪闪，打翻你这趟差事就赚翻啦！',
        '当年掌管天河八万水兵时，比你横十倍的魔神老猪也捆过！',
        '莫耍花枪虚招，老猪皮厚耐揍，换血你可换不起！',
        '二段钉钯倒勾专破护身妖气，过来挨拍罢！',
        '瞧你洞府冷冷清清连锅热饭都没有，活该挨老猪一顿好打！',
        '今天猴哥不在旁抢人头，这桩大功全归俺老猪独吞！',
        '天罡三十六变正法护身，毒火阴风奈何不得猪爷爷！',
        '举起你的破铜烂铁接好了，这一记叫泰山压顶裂地钯！',
        '别以为老猪只会喊散伙，真拼起命来十头牛也拉不回！',
        '你前摇蓄力慢吞吞的，够老猪滚到背后筑你三下了！',
        '打完你正好进土地庙歇脚分赃，麻溜儿受死！',
        '威风八面九齿寒，筑碎妖坛当耕田！',
        '哼哼，块头越大摔得越响，看我把你拍进墙缝里！',
        '残卷把你捏出来挨揍，老猪便发发善心送你早登极乐！',
        '金甲厚膘双保险，站着让你挠三爪子也不掉层油皮！',
        '休想拦着传送法门，老猪赶着去下一关发财呢！',
        '北极紫微麾下猛将在此，山野草寇还不跪伏！',
        '一钯挥风，二钯勾魂，三钯震碎你天灵盖！',
        '嗓门大不顶饭吃，手底下硬实才是真本事！',
        '看老猪化身天罡旋风战车，把你这大殿搅个天翻地覆！',
        '甘露满瓶底气足，今天陪你磕到底！',
        '莫跑莫躲，堂堂正正吃你猪爷爷三板重钯！',
        '妖气冲天又如何？一钯拍散化清风！',
        '好妖怪，筋骨挺硬，正好给老猪松松肩膀！',
        '不玩虚头巴脑的套路，莽过去就是一顿暴筑！',
        '睁大眼瞧清楚，这是五方五帝攒修的上宝沁金钯！',
        '挡我西行财路与正道者，统统筑成肉泥！',
        '哈哈，来战来战，看谁先趴窝！'
      ]
    },
    wujing: {
      stageSolo: [
        '步履沉稳如钉，任凭狂风吹袭亦不乱分寸。',
        '流沙水阵蓄而不发，专待群妖聚拢之时一网成擒。',
        '月宫梭罗木清凉入掌，纵战百场亦不染燥火。',
        '默察地形高低起伏，借单向木台迂回拉扯最为省力。',
        '昔年侍立天阶学会的耐性，如今全用在这破劫途中。',
        '水刃破空连穿数敌，远近呼应，滴水不漏。',
        '不争一时之快，每清一处营盘皆求稳妥无伤。',
        '护身披挂词条渐趋完备，减伤与输出恰成均衡。',
        '流沙河底孤寂千年，反倒练就某处变不惊之心。',
        '见敌红闪即翻身绕背，绝不以肉身硬接无谓重击。',
        '三才真气贯注四肢百骸，五千斤宝杖挥若鸿毛。',
        '挑担万里未曾落下一步，今日独行更当勇猛精进。',
        '空中千钧坠地震慑宵小，再补朔月重斩收割残局。',
        '残卷迷雾虽浓，难掩正道方向。',
        '将零散灵蕴一点点积攒起来，厚积薄发。',
        '听前方水火激荡之声，守关大殿已近在眼前。',
        '调整呼吸节律，确保神通冷却与蓝量完美衔接。',
        '寡言非无志，只待杖落见真章。',
        '寒光映铁衣，一路斩荆棘而行。',
        '师门重托在心，纵前路万险亦如履平川。',
        '邪祟虽众，失了阵脚便只是乌合之众。',
        '大殿门户已现，横杖凝神，准备破关！'
      ],
      bossClash: [
        '灵霄殿前卷帘将，流沙河畔降魔僧——妖王请亮兵刃！',
        '某不善言辞，唯以手中五千零四十八斤宝杖与你论道！',
        '踏入流沙玄水阵者，十成凶威先去五成！看招！',
        '你虽悍勇，步法却浮躁失根，破绽已露！',
        '吴刚伐枝、鲁班亲琢之神杖，今日饮你妖血！',
        '昔受飞剑穿胸三百回尚不皱眉，岂惧你区区凶焰！',
        '控你身形，破你坚甲——三成神卫增伤之下断无生理！',
        '莫逞匹夫狂啸，真正杀招向来无声无息！',
        '守如深渊不可测，攻似寒潮裂石崖！',
        '大师兄开路，某司镇守；今日独战，亦叫你寸步难行！',
        '残卷赋予你再生魔躯，某便以正法再超度你一回！',
        '月牙两刃寒芒满，一击近身一击远——接得住么！',
        '看清你蓄力轨迹了，翻身掠背，杖击中枢！',
        '十万八千里风沙磨砺出的铁骨，任你重锤亦难撼动！',
        '传送法门关乎西行大计，绝不容你在此久阻！',
        '水能载舟亦能覆魔，玄水漩涡起！',
        '不急不徐，十合之内必锁死你的气机！',
        '天庭旧臣虽遭贬谪，斩妖除魔之本领半分未忘！',
        '你这般横冲直撞，正中某流沙困兽之策！',
        '宝杖横胸如铁闸，魑魅魍魉莫妄前！',
        '既镇此难，当有觉悟，休怪沙僧手底不容情！',
        '内重外轻藏暗劲，挨上一杖便知五脏俱裂之苦！',
        '阴风毒雾吹不散胸中澄明，来战！',
        '稳立阵眼不动摇，看你能挣扎几时！',
        '三才修为凝作朔月剑气，贯穿你前胸后背！',
        '莫作无谓咆哮，胜负只在进退分寸之间！',
        '护师重诺在肩，今日此殿必平！',
        '寒渊起浪卷千钧，妖王受死！',
        '任你半血狂暴凶威大盛，玄水寒气自教你寸步难移！',
        '沉腕发力，这一记重杖裂石开山！',
        '洗净你满身血孽，还此方山河清宁！',
        '孤松傲雪立危崖，一杖横秋破万邪！',
        '气息已定，杀招已成——接杖罢！',
        '此关由沙悟净接管，退下或伏诛！'
      ]
    },
    bailongma: {
      stageSolo: [
        '踏云三跃凌绝顶，脚下深渊毒刺皆成过眼云烟！',
        '枪尖青雷跳跃不止，与这秘境风声激荡成曲。',
        '曾作白马默行万里，方知今日御风驰骋何等快意！',
        '极速掠过敌阵降下惊雷，未等妖兵转身已刺穿其喉！',
        '西海龙鳞映着披挂寒光，纤尘不染。',
        '真龙雷霆闪瞬息百步，刷新翻滚再接突刺，行云流水！',
        '不与笨重盾卫正面纠缠，化电穿背一击即溃！',
        '少年意气当如利枪破竹，绝不在中途滞留半分！',
        '听风辨位，暗箭袭来之前早已腾空三丈！',
        '四海潮声在血脉中奔涌，越战越觉灵台清明！',
        '三才天书加持雷枪，每一记枪芒皆带贯空之威。',
        '昔日鹰愁涧底孤影自怜，今朝方知天地广阔任龙翔！',
        '连斩战意推至巅峰，身法快得连残影都追不上真身！',
        '将沿途灵蕴收入行囊，龙魂仙根日渐强横。',
        '俯冲下砸激起电火千重，群小妖尽数震翻！',
        '不贪一刀之利，打完一套连刺即借翻滚潇洒脱离。',
        '纵使山穷水尽疑无路，三段踏云自有青天！',
        '白龙枪缨迎风猎猎，前方妖殿已在视线之内！',
        '法力盈满如海潮初涨，正宜一战定乾坤！',
        '洗刷当年烧珠获罪之名，全凭这一路护法真功！',
        '寒芒敛于枪尖一点，静待破门惊雷一击！',
        '守关妖王气机已现，提枪直入，绝不迟疑！'
      ],
      bossClash: [
        '西海敖烈执枪在此！莫再拿看凡马的眼神看我，接雷！',
        '一点寒芒先到，随后真龙贯空——看你能挡我几枪！',
        '十万八千里蓄积的风雷，今日尽数倾泻于你顶门！',
        '你招大力沉却迟缓如牛，如何摸得到九霄游龙一片鳞！',
        '翻身落青雷，瞬闪破重甲——快枪之下无完卵！',
        '四海龙裔宁折不弯，纵是绝世凶魔亦要刺出个窟窿！',
        '宝象国未竟之剑意，今化白龙吟雷枪百倍凌厉！',
        '休想封锁地面，我自踏云三跃从天而降取你性命！',
        '听这风雷激荡之声，你的护身妖罡撑不过十息！',
        '银枪如龙出海渊，一刺破风，二刺碎甲，三刺穿心！',
        '残卷困得住旧日怨魂，困不住腾云跨海的少年真龙！',
        '少逞凶狂！待我化作银白雷光贯穿长空，胜负立判！',
        '你那点笨重前摇，在我龙瞳之中慢如止水！',
        '昔年天庭斩龙台都未斩断我的脊梁，你也配称尊！',
        '今日单枪独骑闯你宝殿，只求速战速决开法门！',
        '枪缨抖落万点雷星，魑魅魍魉安敢直视！',
        '不仗法宝奇巧，唯凭极致的速度与锋芒破你万法！',
        '龙怒则惊涛裂岸，雷动则万木俱摧——接招！',
        '纵你有千钧铁壁，亦挡不住连环暴击雷芒穿透！',
        '既占八十一难一席之地，便用性命检验我这杆快枪！',
        '身随枪走，人龙合一，来去纵横无拘无束！',
        '莫眨眼，下一瞬枪尖便在你咽喉三寸之内！',
        '替师门荡清前尘魔障，正是敖烈分内之责！',
        '九天青电绕银鳞，一战功成万骨枯——看枪！',
        '任你狂吼震塌梁柱，乱石之中我自翩然穿行！',
        '傲气凌云霄汉阔，岂容妖孽挡西途！',
        '将你这身狂暴妖力化作灵蕴，助我重铸真龙果位！',
        '疾刺如骤雨打萍，教你连抬手喘息之隙皆无！',
        '西海清威不可辱，狂魔俯首领死罢！',
        '寒铁枪尖已饮雷火，此击必见分晓！',
        '踏碎虚空留电影，斩尽邪魔不留名！',
        '风雷助阵，银龙出击——破！',
        '休恋栈不去，一枪送你归入轮回！',
        '亮出真本事罢，莫教我这杆白龙枪失望！'
      ]
    }
  };

  Object.keys(EXTRA_SINGLE_HERO_RESERVE).forEach((cid) => {
    const ext = EXTRA_SINGLE_HERO_RESERVE[cid];
    const hb = HERO_LINES[cid];
    if (!hb) return;
    (ext.stageSolo || []).forEach((txt, idx) => {
      hb.stageSolo.push({ id: `${cid}_st_ex_${idx + 1}`, text: txt });
    });
    (ext.bossClash || []).forEach((txt, idx) => {
      hb.bossClash.push({ id: `${cid}_bc_ex_${idx + 1}`, text: txt });
    });
  });

  // ============================================================================
  // 十、20局零重复叙事抽牌引擎 (Stateful Non-Repeating Dialogue Deck)
  // ============================================================================
  function ensureDialogueState(saveData) {
    if (!saveData || typeof saveData !== 'object') {
      return {
        prologueSeen: false,
        fastCutscenes: false,
        totalRuns: 0,
        totalWins: 0,
        charRuns: { wukong: 0, tangseng: 0, bajie: 0, wujing: 0, bailongma: 0 },
        seenLineIds: {},
        recentFallbackIds: [],
        lastRun: null
      };
    }
    if (!saveData.dialogueState || typeof saveData.dialogueState !== 'object') {
      saveData.dialogueState = {};
    }
    const ds = saveData.dialogueState;
    ds.prologueSeen = !!ds.prologueSeen;
    ds.fastCutscenes = !!ds.fastCutscenes;
    ds.totalRuns = typeof ds.totalRuns === 'number' ? ds.totalRuns : 0;
    ds.totalWins = typeof ds.totalWins === 'number' ? ds.totalWins : 0;
    ds.charRuns = Object.assign(
      { wukong: 0, tangseng: 0, bajie: 0, wujing: 0, bailongma: 0 },
      ds.charRuns || {}
    );
    ds.seenLineIds = ds.seenLineIds && typeof ds.seenLineIds === 'object' ? ds.seenLineIds : {};
    ds.recentFallbackIds = Array.isArray(ds.recentFallbackIds) ? ds.recentFallbackIds.slice(-16) : [];
    ds.lastRun = ds.lastRun || null;
    return ds;
  }

  function markLineSeen(ds, id) {
    if (!ds || !id) return;
    ds.seenLineIds[id] = 1;
    ds.recentFallbackIds.push(id);
    if (ds.recentFallbackIds.length > 20) {
      ds.recentFallbackIds.shift();
    }
  }

  function matchCondition(cond, ctx) {
    if (!cond) return true;
    if (!ctx) return false;
    if (cond.charRun !== undefined && ctx.charRun !== cond.charRun) return false;
    if (cond.firstWin !== undefined && !!ctx.firstWin !== !!cond.firstWin) return false;
    if (cond.lastOutcome !== undefined && ctx.lastOutcome !== cond.lastOutcome) return false;
    if (cond.lastRevived !== undefined && !!ctx.lastRevived !== !!cond.lastRevived) return false;
    if (cond.aspectId !== undefined && ctx.aspectId !== cond.aspectId) return false;
    if (cond.regionId !== undefined && ctx.regionId !== cond.regionId) return false;
    if (cond.mutatorId !== undefined && ctx.mutatorId !== cond.mutatorId) return false;
    if (cond.eventId !== undefined && ctx.eventId !== cond.eventId) return false;
    if (cond.bpCount !== undefined && ctx.bpCount !== cond.bpCount) return false;
    if (cond.tribNo !== undefined && ctx.tribNo !== cond.tribNo) return false;
    if (cond.bossId !== undefined && ctx.bossId !== cond.bossId) return false;
    return true;
  }

  /**
   * 核心不放回优先级抽牌器：
   * 1. 严格排除 seenLineIds 中已出现过的任何台词（确保20局内100%零重复）
   * 2. 优先抽取满足当前局内上下文条件（里程碑/法相/地域/异象/宿命妖王/上局记忆）的专属台词
   * 3. 次选角色无条件核心性格池（确定性打乱或随机抽取）
   * 4. 仅当玩家游玩超过 25~85 局将该角色某分类全部耗尽时，才重置该子池（仍屏蔽最近8条防连撞）
   */
  function pickFromDeck(ds, pool, ctx, rngFn) {
    if (!Array.isArray(pool) || pool.length === 0) return null;
    const rand = typeof rngFn === 'function' ? rngFn : Math.random;

    const unseenExact = [];
    const unseenCore = [];

    for (let i = 0; i < pool.length; i++) {
      const item = pool[i];
      if (!item || !item.id) continue;
      if (ds.seenLineIds[item.id]) continue;
      if (item.cond) {
        if (matchCondition(item.cond, ctx)) {
          unseenExact.push(item);
        }
      } else {
        unseenCore.push(item);
      }
    }

    let chosen = null;
    if (unseenExact.length > 0) {
      // 若有里程碑局数/首通等强精确条件，优先按定义顺序命中第1条；其余同级条件随机抽选
      const milestoneHit = unseenExact.find((x) => x.cond && (x.cond.charRun !== undefined || x.cond.firstWin !== undefined || x.cond.tribNo !== undefined));
      chosen = milestoneHit || unseenExact[Math.floor(rand() * unseenExact.length)];
    } else if (unseenCore.length > 0) {
      chosen = unseenCore[Math.floor(rand() * unseenCore.length)];
    } else {
      // 超长线（>25~85局）牌库耗尽保底：仅清理本池历史并避开最近触发项
      const recentSet = {};
      (ds.recentFallbackIds || []).slice(-8).forEach((rid) => {
        recentSet[rid] = true;
      });
      const resetCandidates = [];
      for (let i = 0; i < pool.length; i++) {
        const it = pool[i];
        if (!it.cond || matchCondition(it.cond, ctx)) {
          delete ds.seenLineIds[it.id];
          if (!recentSet[it.id]) resetCandidates.push(it);
        }
      }
      const fbPool = resetCandidates.length > 0 ? resetCandidates : pool;
      chosen = fbPool[Math.floor(rand() * fbPool.length)];
    }

    if (chosen) {
      markLineSeen(ds, chosen.id);
    }
    return chosen;
  }

  /**
   * 1. 开局出征过场抽词（并递增局数计数）
   */
  function drawRunStartDialogue(saveData, opts, rngFn) {
    const ds = ensureDialogueState(saveData);
    const charId = (opts && opts.charId) || 'wukong';
    const heroBank = HERO_LINES[charId] || HERO_LINES.wukong;
    const profile = HERO_PROFILES[charId] || HERO_PROFILES.wukong;

    ds.totalRuns = (ds.totalRuns || 0) + 1;
    ds.charRuns[charId] = (ds.charRuns[charId] || 0) + 1;

    const ctx = {
      charRun: ds.charRuns[charId],
      totalRuns: ds.totalRuns,
      aspectId: opts && opts.aspectId,
      regionId: opts && opts.regionId,
      mutatorId: opts && opts.mutatorId,
      lastOutcome: ds.lastRun ? ds.lastRun.outcome : undefined,
      lastRevived: ds.lastRun ? !!ds.lastRun.revived : false
    };

    const picked = pickFromDeck(ds, heroBank.runStart, ctx, rngFn);
    return {
      id: picked ? picked.id : `rs_fallback_${ds.totalRuns}`,
      speakerId: charId,
      speakerName: profile.name,
      speakerTitle: profile.title,
      seal: profile.seal,
      entranceStyle: profile.entranceStyle,
      text: picked ? picked.text : '执兵踏碎重重劫，且看今朝破阵时！',
      runNumber: ds.totalRuns,
      charRunNumber: ds.charRuns[charId]
    };
  }

  /**
   * 2. 关卡入场 / 奇遇 / 觉醒 非阻塞随行台词与师徒双人传音抽词
   */
  function drawStageBanter(saveData, opts, rngFn) {
    const ds = ensureDialogueState(saveData);
    const rand = typeof rngFn === 'function' ? rngFn : Math.random;
    const charId = (opts && opts.charId) || 'wukong';
    const heroBank = HERO_LINES[charId] || HERO_LINES.wukong;

    const ctx = {
      regionId: opts && opts.regionId,
      mutatorId: opts && opts.mutatorId,
      eventId: opts && opts.eventId,
      bpCount: opts && opts.bpCount
    };

    // 若指定了强事件上下文（奇遇结算/天书质变断点）且尚有未播放的专属词，优先触发对应的角色专属感叹
    const hasUnseenSpecialSolo =
      !!(ctx.eventId || ctx.bpCount) &&
      heroBank.stageSolo.some((it) => !ds.seenLineIds[it.id] && it.cond && matchCondition(it.cond, ctx));
    const forceSoloContext = hasUnseenSpecialSolo;

    // 筛选包含当前出战角色、且尚未播放过的师徒双人小剧场
    const unseenDuos = PILGRIM_DUO_BANTERS.filter(
      (d) => !ds.seenLineIds[d.id] && d.chars.indexOf(charId) !== -1
    );

    if (!forceSoloContext && unseenDuos.length > 0 && rand() < 0.42) {
      const duo = unseenDuos[Math.floor(rand() * unseenDuos.length)];
      markLineSeen(ds, duo.id);
      return {
        id: duo.id,
        kind: 'duo',
        lines: duo.lines.map((ln) => {
          const pf = HERO_PROFILES[ln.speaker] || HERO_PROFILES.wukong;
          return {
            speakerId: ln.speaker,
            speakerName: pf.name,
            speakerTitle: pf.title,
            themeColor: pf.themeColor,
            text: ln.text
          };
        })
      };
    }

    // 否则抽取角色独白；若角色独白刚好全用过但还有未看的双人传音，则无缝切到双人传音（零重复优先！）
    const hasUnseenSolo = heroBank.stageSolo.some(
      (it) => !ds.seenLineIds[it.id] && (!it.cond || matchCondition(it.cond, ctx))
    );
    if (!hasUnseenSolo && unseenDuos.length > 0) {
      const duo = unseenDuos[Math.floor(rand() * unseenDuos.length)];
      markLineSeen(ds, duo.id);
      return {
        id: duo.id,
        kind: 'duo',
        lines: duo.lines.map((ln) => {
          const pf = HERO_PROFILES[ln.speaker] || HERO_PROFILES.wukong;
          return {
            speakerId: ln.speaker,
            speakerName: pf.name,
            speakerTitle: pf.title,
            themeColor: pf.themeColor,
            text: ln.text
          };
        })
      };
    }

    const picked = pickFromDeck(ds, heroBank.stageSolo, ctx, rand);
    const pf = HERO_PROFILES[charId] || HERO_PROFILES.wukong;
    return {
      id: picked ? picked.id : `st_fb_${Date.now()}`,
      kind: 'solo',
      lines: [
        {
          speakerId: charId,
          speakerName: pf.name,
          speakerTitle: pf.title,
          themeColor: pf.themeColor,
          text: picked ? picked.text : '前路妖氛渐浓，握紧神兵步步推进！'
        }
      ]
    };
  }

  /**
   * 3. 守关妖王战前宽银幕交锋对白抽取（妖王叫阵 + 主角回敬，双方均100%零重复！）
   */
  function drawBossClashDialogue(saveData, opts, rngFn) {
    const ds = ensureDialogueState(saveData);
    const rand = typeof rngFn === 'function' ? rngFn : Math.random;
    const charId = (opts && opts.charId) || 'wukong';
    const tribNo = opts && opts.tribNo ? Number(opts.tribNo) : null;
    const bossId = (opts && opts.bossId) || 'black_bear_king';
    const bossName = (opts && opts.bossName) || '守关妖王';

    // A. 抽取妖王叫阵词：首选该难专属原著考据词；若之前某局已见过此难，则自动切换至【宿敌重逢叫阵池】！
    let bossLineId = null;
    let bossText = null;
    const primaryBossId = tribNo ? `boss_trib_${tribNo}` : `boss_legacy_${bossId}`;
    const primaryBossText = (tribNo && TRIB_STAGE_BOSS_TAUNTS[tribNo]) || LEGACY_BOSS_TAUNTS[bossId];

    if (primaryBossText && !ds.seenLineIds[primaryBossId]) {
      bossLineId = primaryBossId;
      bossText = primaryBossText;
      markLineSeen(ds, bossLineId);
    } else {
      const rematchPicked = pickFromDeck(ds, BOSS_REMATCH_POOL, {}, rand);
      bossLineId = rematchPicked ? rematchPicked.id : primaryBossId;
      bossText = rematchPicked ? rematchPicked.text : primaryBossText || '擅闯本王宝殿，纳命来！';
    }

    // B. 抽取主角亮兵应战词：首选针对该劫妖王的宿命因缘专属词，次选角色50条本色应战词！
    const heroBank = HERO_LINES[charId] || HERO_LINES.wukong;
    const pf = HERO_PROFILES[charId] || HERO_PROFILES.wukong;
    const heroPicked = pickFromDeck(
      ds,
      heroBank.bossClash,
      { tribNo: tribNo || undefined, bossId },
      rand
    );

    return {
      bossLine: {
        id: bossLineId,
        speakerId: bossId,
        speakerName: bossName,
        tribNo: tribNo || 1,
        text: bossText
      },
      heroLine: {
        id: heroPicked ? heroPicked.id : `hc_fb_${Date.now()}`,
        speakerId: charId,
        speakerName: pf.name,
        speakerTitle: pf.title,
        seal: pf.seal,
        themeColor: pf.themeColor,
        text: heroPicked ? heroPicked.text : '少逞凶威，兵刃底下见真章！'
      }
    };
  }

  /**
   * 4. 斩杀妖王破劫收兵判词
   */
  function drawBossKillDialogue(saveData, opts, rngFn) {
    const ds = ensureDialogueState(saveData);
    const charId = (opts && opts.charId) || 'wukong';
    const heroBank = HERO_LINES[charId] || HERO_LINES.wukong;
    const pf = HERO_PROFILES[charId] || HERO_PROFILES.wukong;
    const picked = pickFromDeck(ds, heroBank.bossKill, {}, rngFn);
    return {
      id: picked ? picked.id : `bk_fb_${Date.now()}`,
      speakerId: charId,
      speakerName: pf.name,
      speakerTitle: pf.title,
      seal: pf.seal,
      themeColor: pf.themeColor,
      text: picked ? picked.text : '妖氛已靖，踏阵西行！'
    };
  }

  /**
   * 5. 观音甘露逆天复活神迹台词
   */
  function drawReviveDialogue(saveData, opts, rngFn) {
    const ds = ensureDialogueState(saveData);
    const charId = (opts && opts.charId) || 'wukong';
    const heroBank = HERO_LINES[charId] || HERO_LINES.wukong;
    const pf = HERO_PROFILES[charId] || HERO_PROFILES.wukong;
    const picked = pickFromDeck(ds, heroBank.reviveMiracle, {}, rngFn);
    return {
      id: picked ? picked.id : `rv_fb_${Date.now()}`,
      speakerId: charId,
      speakerName: pf.name,
      speakerTitle: pf.title,
      seal: pf.seal,
      themeColor: pf.themeColor,
      text: picked ? picked.text : '观音甘露护体，金身重塑再破群魔！'
    };
  }

  /**
   * 6. 单局终章结算（通关圆满 / 兵解轮回）过场台词，并写入跨局因果记忆
   */
  function drawRunEndingDialogue(saveData, opts, rngFn) {
    const ds = ensureDialogueState(saveData);
    const charId = (opts && opts.charId) || 'wukong';
    const victory = !!(opts && opts.victory);
    const heroBank = HERO_LINES[charId] || HERO_LINES.wukong;
    const pf = HERO_PROFILES[charId] || HERO_PROFILES.wukong;

    const isFirstWin = victory && (ds.totalWins || 0) === 0;
    const targetPool = victory ? heroBank.runVictory : heroBank.runDefeat;
    const picked = pickFromDeck(ds, targetPool, { firstWin: isFirstWin }, rngFn);

    if (victory) {
      ds.totalWins = (ds.totalWins || 0) + 1;
    }
    ds.lastRun = {
      charId,
      outcome: victory ? 'victory' : 'defeat',
      revived: !!(opts && opts.revived),
      stageName: (opts && opts.stageName) || '',
      tribNo: (opts && opts.tribNo) || null
    };

    return {
      id: picked ? picked.id : `end_fb_${Date.now()}`,
      victory,
      speakerId: charId,
      speakerName: pf.name,
      speakerTitle: pf.title,
      seal: pf.seal,
      themeColor: pf.themeColor,
      text: picked ? picked.text : victory ? '踏碎魔窟，九九归真！' : '暂归仙祠淬炼，片刻再来破劫！'
    };
  }

  /**
   * 统计台词库总容量与当前解锁进度（供图鉴/主界面展示与测试校验）
   */
  function getDialogueCollectionStats(saveData) {
    const ds = ensureDialogueState(saveData);
    let totalLines = PILGRIM_DUO_BANTERS.length + Object.keys(TRIB_STAGE_BOSS_TAUNTS).length + BOSS_REMATCH_POOL.length;
    Object.keys(HERO_LINES).forEach((cid) => {
      const hb = HERO_LINES[cid];
      Object.keys(hb).forEach((cat) => {
        totalLines += hb[cat].length;
      });
    });
    const seenCount = Object.keys(ds.seenLineIds || {}).length;
    return {
      seenCount,
      totalLines,
      totalRuns: ds.totalRuns || 0,
      totalWins: ds.totalWins || 0
    };
  }

  return {
    HERO_PROFILES,
    PROLOGUE_SCENES,
    PILGRIM_DUO_BANTERS,
    HERO_LINES,
    TRIB_STAGE_BOSS_TAUNTS,
    BOSS_REMATCH_POOL,
    ensureDialogueState,
    drawRunStartDialogue,
    drawStageBanter,
    drawBossClashDialogue,
    drawBossKillDialogue,
    drawReviveDialogue,
    drawRunEndingDialogue,
    getDialogueCollectionStats
  };
});
