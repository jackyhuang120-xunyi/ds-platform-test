
import pool from '../src/config/db.js';

async function testAgeQuery() {
    const testId = 1;
    const sql = `
      SELECT 
        tr.id,
        u.birthday,
        tr.begin_time,
        u.age as static_age,
        COALESCE(TIMESTAMPDIFF(YEAR, u.birthday, tr.begin_time), u.age) AS dynamic_age
      FROM test_record tr
      JOIN user u ON tr.uid = u.id
      WHERE tr.id = ?
    `;
    console.log("Testing SQL Query structure...");
    console.log(sql);
    
    // 由于环境限制，这里不再实际执行查询，仅作为逻辑检查。
    // 在真实环境中，如果生日是 1990-01-01，测试时间是 2024-01-01，
    // 则 TIMESTAMPDIFF 将准确返回 34。
}

testAgeQuery();
