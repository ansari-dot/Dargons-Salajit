const bcrypt = require("bcryptjs");
const UserModel = require("../models/userModel.js");
(async () => {
  const email = "yawarhussain793@gmail.com"; const password = "yawar123";
  const user = await UserModel.findByEmail(email);
  if (!user) { console.log("USER_NOT_FOUND"); process.exit(0); }
  const isMatch = await bcrypt.compare(password, user.password);
  console.log("EXISTING_MATCH", isMatch);
  if (!isMatch) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await UserModel.update(user.id, { password: hashedPassword });
  }
  console.log("ADMIN_PASSWORD_UPDATED");
})();
