const http = require("http");
const opts = { hostname: "127.0.0.1", port: 5000, path: "/api/auth/login", method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "yawarhussain793@gmail.com", password: "yawar123" }), timeout: 8000 };
const req = http.request(opts, r => { let d = ""; r.on("data", c => d += c); r.on("end", () => { try { console.log("STATUS", r.statusCode); console.log("BODY", JSON.stringify(JSON.parse(d), null, 2)); } catch (e) { console.log("RAW", d); } }); });
req.on("error", e => console.log("ERR", e.message)); req.setTimeout(8000, () => req.destroy(new Error("timeout"))); req.end();
