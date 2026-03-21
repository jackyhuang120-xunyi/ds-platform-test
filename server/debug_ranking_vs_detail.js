import pool from './src/config/db.js';

async function debugData() {
  const testUid = 1; // 选取一个已知的受试者 ID
  const metric = 'con_stre_max';
  const typeId = 1;

  console.log(`--- 开始诊断受试者 ID: ${testUid} 的数据 ---`);

  // 1. 模拟排行榜 SQL (一人一席逻辑)
  const rankingSql = `
    SELECT 
      MAX(tr.id) as recordId,
      tr.uid,
      u.name,
      MAX(tr.${metric}) as score,
      ANY_VALUE(tr.cfg_con_speed) as cfg_con_speed,
      MAX(tr.begin_time) as time
    FROM test_record tr
    JOIN user u ON tr.uid = u.id
    WHERE tr.uid = ? AND tr.type = ? AND tr.end_time IS NOT NULL
    GROUP BY tr.uid, u.name
  `;
  
  const [rankingRows] = await pool.query(rankingSql, [testUid, typeId]);
  console.log('\n[排行榜聚合结果]:');
  console.table(rankingRows);

  // 2. 查询该用户在该模式下的所有原始记录，手动查找最大值
  const rawSql = `
    SELECT tr.id, tr.uid, tr.${metric}, tr.cfg_con_speed, tr.begin_time
    FROM test_record tr
    WHERE tr.uid = ? AND tr.type = ? AND tr.end_time IS NOT NULL
    ORDER BY tr.${metric} DESC
  `;
  const [rawRows] = await pool.query(rawSql, [testUid, typeId]);
  console.log('\n[数据库原始记录 (按分数降序)]:');
  console.table(rawRows);

  if (rankingRows.length > 0 && rawRows.length > 0) {
    const rIdx = rankingRows[0].recordId;
    const bId = rawRows[0].id;
    
    console.log(`\n分析结果:`);
    console.log(`- 排行榜返回的记录 ID: ${rIdx}`);
    console.log(`- 真实最高分对应的记录 ID: ${bId}`);
    
    if (rIdx !== bId) {
      console.log('⚠️ 错误确认: 排行榜返回的记录 ID 并不是最高分所在的那一行！这是因为 MAX(id) 与 MAX(score) 互不相干。');
    } else {
      console.log('✅ ID 匹配正确。');
    }
  }

  process.exit();
}

debugData().catch(err => {
  console.error(err);
  process.exit(1);
});
