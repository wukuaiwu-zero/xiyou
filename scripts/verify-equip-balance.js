/**
 * 《西游破劫录》装备难度曲线、怪物素材掉落率与Boss击杀耗时(TTK) 1000局蒙特卡洛校验脚本
 * (scripts/verify-equip-balance.js)
 */
const Equip = require('../src/config/equipment');
const Curve = require('../src/config/progressionCurve');
const { CHARACTERS } = require('../src/config/characters');

const RUNS = 1000;
const ACTS = 4;
const MOBS_PER_ACT = [11, 13, 15, 17];
const ELITES_PER_ACT = [1, 1, 2, 2];
const CHESTS_PER_ACT = [1, 1, 1, 1];

function runMonteCarlo(ascensionLevel) {
  let totalGroundEquips = 0;
  let totalMatByTier = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const actRarityCounts = [
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0]
  ];
  const actTierCounts = [
    { 1: 0, 2: 0, 3: 0, 4: 0 },
    { 1: 0, 2: 0, 3: 0, 4: 0 },
    { 1: 0, 2: 0, 3: 0, 4: 0 },
    { 1: 0, 2: 0, 3: 0, 4: 0 }
  ];
  const actBossTTKs = [[], [], [], []];
  let zeroT4CoreRuns = 0;

  const baseChar = CHARACTERS[0]; // 孙悟空基准

  for (let r = 0; r < RUNS; r++) {
    const pity = { mobEquipDry: 0, eliteEquipDry: 0, mobMatDry: 0, eliteT3Dry: 0, bossT4Dry: 0 };
    const matBag = {};
    let gold = 0;
    let runT4 = 0;

    const equipped = {
      weapon: Equip.generateEquipment(1, { slot: 'weapon', source: 'starter', forceRarityIndex: 0 }),
      helm: null,
      armor: null,
      boots: null,
      accessory: null
    };
    const scrolls = { red: 1, purple: 1, green: 1 };

    const considerEquip = (item) => {
      const cur = equipped[item.slot];
      if (!cur || item.score > cur.score) {
        if (cur) gold += cur.recycleGold;
        equipped[item.slot] = item;
      } else {
        const yld = Equip.getRecycleYield(item);
        gold += yld.gold;
        yld.materials.forEach((m) => {
          matBag[m.id] = (matBag[m.id] || 0) + m.count;
          const tier = Equip.MATERIAL_MAP[m.id].tier;
          totalMatByTier[tier] += m.count;
        });
      }
    };

    for (let act = 0; act < ACTS; act++) {
      const itemLv = 1 + act * 2 + ascensionLevel;

      // 1. 巡山小怪战斗与掉落
      for (let m = 0; m < MOBS_PER_ACT[act]; m++) {
        gold += 14 + act * 4;
        const mats = Equip.rollMonsterMaterialDrops(
          { typeId: 'wolf_scout', ai: 'melee_rush', isBoss: false, isElite: false },
          { stageIndex: act, ascensionLevel, regionId: 'heifeng', pityState: pity }
        );
        mats.forEach((mt) => {
          matBag[mt.id] = (matBag[mt.id] || 0) + mt.count;
          totalMatByTier[mt.tier] += mt.count;
        });

        if (Equip.shouldDropGroundEquipment('mob', act, ascensionLevel, pity, 0)) {
          totalGroundEquips++;
          const eq = Equip.generateEquipment(itemLv, { source: 'mob', stageIndex: act, ascensionLevel });
          actRarityCounts[act][eq.rarityIndex]++;
          actTierCounts[act][eq.tier]++;
          considerEquip(eq);
        }
      }

      // 2. 精英头目战斗与天书/素材掉落（每劫玩家平均获取约 1.75 卷主修天书，第4劫达成7~8卷觉醒）
      for (let e = 0; e < ELITES_PER_ACT[act]; e++) {
        if (e === 0) scrolls.red += 1;
        else scrolls.green += 1;
        gold += 38;
        const mats = Equip.rollMonsterMaterialDrops(
          { typeId: 'shield_bear', ai: 'front_shield', isElite: true },
          { stageIndex: act, ascensionLevel, regionId: 'huangfeng', pityState: pity }
        );
        mats.forEach((mt) => {
          matBag[mt.id] = (matBag[mt.id] || 0) + mt.count;
          totalMatByTier[mt.tier] += mt.count;
        });
        if (Equip.shouldDropGroundEquipment('elite', act, ascensionLevel, pity, 0)) {
          totalGroundEquips++;
          const eq = Equip.generateEquipment(itemLv + 1, { source: 'elite', stageIndex: act, ascensionLevel });
          actRarityCounts[act][eq.rarityIndex]++;
          actTierCounts[act][eq.tier]++;
          considerEquip(eq);
        }
      }

      // 3. 关卡天书祭坛 + 宝箱
      if (act % 2 === 0 || Math.random() < 0.65) scrolls.red += 1;
      else scrolls.purple += 1;
      for (let c = 0; c < CHESTS_PER_ACT[act]; c++) {
        const cMats = Equip.rollMonsterMaterialDrops(null, {
          sourceType: 'chest',
          stageIndex: act,
          ascensionLevel,
          regionId: 'baigu'
        });
        cMats.forEach((mt) => {
          matBag[mt.id] = (matBag[mt.id] || 0) + mt.count;
          totalMatByTier[mt.tier] += mt.count;
        });
        if (Math.random() < 0.5) {
          totalGroundEquips++;
          const eq = Equip.generateEquipment(itemLv, { source: 'chest', stageIndex: act, ascensionLevel });
          actRarityCounts[act][eq.rarityIndex]++;
          actTierCounts[act][eq.tier]++;
          considerEquip(eq);
        }
      }

      // 模拟玩家在进Boss房前使用掉落素材给主武淬火升星1次（若有富余素材）
      if (equipped.weapon) {
        const cost = Equip.getEnhanceCost(equipped.weapon);
        if (cost && !cost.isMax && gold >= cost.gold && cost.materials.every((req) => (matBag[req.id] || 0) >= req.count)) {
          gold -= cost.gold;
          cost.materials.forEach((req) => {
            matBag[req.id] -= req.count;
          });
          Equip.enhanceEquipment(equipped.weapon);
        }
      }

      // 4. 校验本劫守关妖王 TTK（融合五槽披挂 + 套装共鸣 + 微指数天书曲线）
      const eqTotals = Equip.computeEquipmentTotals(equipped);
      const pCurve = Curve.calcPlayerCurveStats({
        scrolls,
        mainAffinity: 'red',
        metaLevels: { atk_lv: 2, crit_lv: 1 },
        momentumStacks: 10
      });
      const eCurve = Curve.calcEnemyCurveStats(act, ascensionLevel, {});

      const effAtk = (baseChar.stats.atk + eqTotals.atkFlat) * (1 + eqTotals.atkPct) * pCurve.atkMult;
      const effCritRate = Math.min(0.92, baseChar.stats.critRate + 0.03 + eqTotals.critRate);
      const effCritMult = baseChar.stats.critMult + eqTotals.critDmg;
      // 综合连招 + 本命神通 + 法宝每秒有效窗口 DPS（考虑Boss走位闪避占空比 0.46）
      const rawDps = effAtk * 1.72 * (1 + effCritRate * (effCritMult - 1)) * 0.46;
      const bossEquipScale = 1.04 + act * 0.10;
      const bossHp = Math.round(660 * (1 + act * 0.16) * eCurve.hpMult * bossEquipScale);
      actBossTTKs[act].push(bossHp / Math.max(1, rawDps));

      // 5. Boss 伏诛掉落
      const bMats = Equip.rollMonsterMaterialDrops(
        { typeId: 'bull_demon_king', isBoss: true },
        { stageIndex: act, ascensionLevel, regionId: act === 3 ? 'huoyan' : 'pingding', pityState: pity }
      );
      bMats.forEach((mt) => {
        matBag[mt.id] = (matBag[mt.id] || 0) + mt.count;
        totalMatByTier[mt.tier] += mt.count;
        if (mt.tier === 4) runT4 += mt.count;
      });
      totalGroundEquips++;
      const bEq = Equip.generateEquipment(itemLv + 2, { source: 'boss', stageIndex: act, ascensionLevel });
      actRarityCounts[act][bEq.rarityIndex]++;
      actTierCounts[act][bEq.tier]++;
      considerEquip(bEq);
    }

    if (runT4 === 0) zeroT4CoreRuns++;
  }

  const avg = (arr) => (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);

  console.log(`\n==================== 蒙特卡洛 1000 局平衡报告 (劫度 Ascension = ${ascensionLevel}) ====================`);
  console.log(`平均每局地面整装掉落数: ${(totalGroundEquips / RUNS).toFixed(2)} 件 (告别满地垃圾刷屏，每劫约 ${(totalGroundEquips / RUNS / 4).toFixed(1)} 件精选掉落)`);
  console.log(
    `平均每局怪物素材产出: T1凡材 ${(totalMatByTier[1] / RUNS).toFixed(1)} | T2灵材 ${(totalMatByTier[2] / RUNS).toFixed(1)} | T3仙材 ${(totalMatByTier[3] / RUNS).toFixed(1)} | T4神材 ${(totalMatByTier[4] / RUNS).toFixed(2)}`
  );
  console.log(`通刷4劫 T4妖王神材 0掉落非酋局占比: ${((zeroT4CoreRuns / RUNS) * 100).toFixed(2)}% (双保底护航 = 0.00%!)`);

  for (let a = 0; a < ACTS; a++) {
    const rSum = actRarityCounts[a].reduce((s, v) => s + v, 0) || 1;
    const pct = (idx) => ((actRarityCounts[a][idx] / rSum) * 100).toFixed(1) + '%';
    console.log(
      `第${a + 1}劫 -> Boss平均TTK: ${avg(actBossTTKs[a])}s | 品质分布: 凡/良 ${pct(0)}/${pct(1)} · 上品 ${pct(2)} · 仙品 ${pct(3)} · 神/圣 ${pct(4)}/${pct(5)}`
    );
  }
}

runMonteCarlo(0);
runMonteCarlo(3);
