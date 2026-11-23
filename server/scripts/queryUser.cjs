const mysql = require("mysql2/promise");
(async () => {
  const c = await mysql.createConnection({ host: "127.0.0.1", user: "root", password: "admin", database: "sl", port: 3306 });
  const [rows] = await c.query("SELECT id, email, role, first_name, last_name, password, email_verified FROM users WHERE email = ?", ["yawarhussain793@gmail.com"]);
  console.log(JSON.stringify(rows.map(r => ({ id: r.id, email: r.email, role: r.role, first_name: r.first_name, last_name: r.last_name, password: r.password, email_verified: r.email_verified })), null, 2));
  await c.end();
})();
