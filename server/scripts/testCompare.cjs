const bcrypt = require("bcryptjs");
(async () => {
  const hash = "$2b$10$XqdstIQfBAGWyx4ACp9t1OggJyipSi1tKu1EMuHQ.7OFUid7JwS";
  const result = await bcrypt.compare("yawar123", hash);
