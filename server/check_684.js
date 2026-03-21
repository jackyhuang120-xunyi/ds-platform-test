
const mysql = require('mysql2/promise');

async function check() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'pass2004',
    database: 'ds_data_test1'
  });

  try {
    const [rows] = await connection.execute('SELECT * FROM test_record WHERE id = 684');
    console.log('--- RAW DATA FOR ID 684 ---');
    console.log(JSON.stringify(rows[0], null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

check();
