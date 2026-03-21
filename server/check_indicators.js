
const mysql = require('mysql2/promise');

async function check() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'pass2004',
    database: 'ds_data_test1'
  });

  try {
    const [rows] = await connection.execute('SELECT con_stre_max, con_stre_avg, con_speed_max, con_speed_avg, con_power_max, con_power_avg, con_work_max, con_work_avg, ecc_stre_max, ecc_stre_avg, ecc_speed_max, ecc_speed_avg, ecc_power_max, ecc_power_avg, ecc_work_max, ecc_work_avg FROM test_record WHERE id = 684');
    console.log('--- TARGET INDICATORS FOR ID 684 ---');
    console.table(rows);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

check();
