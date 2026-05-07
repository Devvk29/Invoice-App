const { pool } = require('./db');

async function checkUsers() {
  try {
    const [users] = await pool.query('SELECT id, employee_id, name, email, last_login FROM users');
    console.log('Users in database:');
    console.log(users);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

checkUsers();