import pool from './src/config/db.js';

async function verifyOrder() {
  try {
    const [rows] = await pool.query(`
      SELECT uv.id, uv.name, g.name as gender 
      FROM user_view uv
      LEFT JOIN \`group\` g ON uv.\`group\` = g.id
      ORDER BY uv.id ASC
      LIMIT 20
    `);
    
    console.log('排序后的前20条数据:');
    rows.forEach(r => {
      console.log(`ID: ${r.id}, 姓名: ${r.name}, 性别: ${r.gender}`);
    });

    let isOrdered = true;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].id < rows[i-1].id) {
        isOrdered = false;
        break;
      }
    }

    if (isOrdered) {
      console.log('\n✅ 验证成功：数据已按 ID 升序排列。');
    } else {
      console.log('\n❌ 验证失败：数据未按 ID 升序排列。');
    }

    process.exit(0);
  } catch (err) {
    console.error('验证过程出错:', err.message);
    process.exit(1);
  }
}

verifyOrder();
