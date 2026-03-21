
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
    const data = rows[0];
    console.log('--- ALL FIELDS ALIGNMENT ---');
    for (let key in data) {
      console.log(`${key}: ${data[key]}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

check();
