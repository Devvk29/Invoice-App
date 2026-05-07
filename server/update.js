const { pool } = require("./db");
pool.query("UPDATE users SET employee_id = REPLACE(employee_id, 'SIKKO-', 'SIKKO_') WHERE employee_id LIKE 'SIKKO-%'")
  .then(() => {
    console.log("Updated");
    process.exit(0);
  })
  .catch(console.error);
