const express = require("express");
const path = require("path");
const session = require("express-session");
const MongoDbStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");

const mongoose = require("mongoose");
const User = require("./models/user");

const MONGODBURI =
  "mongodb+srv://ahmad:miO3wJt4bw4Xmhjz@cluster0.l9btu.mongodb.net/shop?retryWrites=true&w=majority";

const bodyParser = require("body-parser");
const adminRoutes = require("./routes/admin");
const shop = require("./routes/shop");
const auth = require("./routes/auth");
const error = require("./controllers/error");
const app = express();

const store = new MongoDbStore({
  uri: MONGODBURI,
  collection: "sessions",
});

const csrfProtection = csrf();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
app.use(flash());
app.use(csrfProtection);

app.set("view engine", "ejs");
app.set("views", "views");

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => console.log(err));
});

app.use((req , res , next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
})
app.use("/admin", adminRoutes);
app.use(shop);
app.use(auth);

app.use(error.error404);

mongoose
  .connect(MONGODBURI)
  .then(() => {
    app.listen(3000);
  })
  .catch((err) => console.log(err));
