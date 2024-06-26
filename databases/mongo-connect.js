const mongoose = require("mongoose");
const { MONGO_URI } = require("../config/config");

const connectWithMongoDb = () => {
  mongoose
    .connect(MONGO_URI, {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    })
    .then(console.log(`DB GOT CONNECTED`))
    .catch((error) => {
      console.log(`DB CONNECTION ISSUES`);
      console.log(error);
      process.exit(1);
    });
};

module.exports = { connectWithMongoDb };
