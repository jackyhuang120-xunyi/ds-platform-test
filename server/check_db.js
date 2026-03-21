
const mysql = require('mysql2/promise');

async function check() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'pass2004',
    database: 'ds_data_test1'
  });

  try {
    const [testStats] = await connection.execute('SELECT COUNT(*) as count FROM test_record');
    const [trainStats] = await connection.execute('SELECT COUNT(*) as count FROM train_record');
    
    console.log('--- Table Stats ---');
    console.log('test_record count:', testStats[0].count);
    console.log('train_record count:', trainStats[0].count);

    // 检查字段名
    const [testFields] = await connection.execute('DESCRIBE test_record');
    console.log('\n--- test_record Columns ---');
    console.log(testFields.map(f => f.Field).join(', '));

    const [testSamples] = await connection.execute('SELECT id, con_stre_max, con_stre_avg, con_speed_max, con_power_max, con_work_max FROM test_record WHERE end_time IS NOT NULL AND con_stre_max IS NOT NULL LIMIT 5');
    console.log('\n--- test_record Samples (Non-NULL Indicators) ---');
    console.table(testSamples);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

check();
