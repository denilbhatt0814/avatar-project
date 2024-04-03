require("dotenv").config();
require("./databases/mongo-connect.js").connectWithMongoDb();
const app = require("./app.js");

const { PORT } = require("./config/config.js");
app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
