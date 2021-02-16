const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDbStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");

const error = require("./controllers/error");
const User = require("./models/user");

const MONGODBURI =
  `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.l9btu.mongodb.net/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`;

const app = express();
const store = new MongoDbStore({
  uri: MONGODBURI,
  collection: "sessions",
});
const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString().replace(/:/g, '-') + "_" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shop = require("./routes/shop");
const auth = require("./routes/auth");

app.use(bodyParser.urlencoded({ extended: false }));
app.use('/images' , express.static(path.join(__dirname, 'images')));
// app.use('*/images',express.static('images'));
app.use("*/css", express.static("public/css"));
app.use("*/js", express.static("public/js"));
app.use(multer({ storage: fileStorage , fileFilter: fileFilter}).single("image"));

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

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
    });
});

app.use(shop);
app.use("/admin", adminRoutes);
app.use(auth);
  
app.use(helmet());
app.use(compression());
app.get("/500", error.error500);
app.use(error.error404);

app.use((error , req , res , next) => {
  res
    .status(500)
    .render('500', {
      pageTitle: "Error",
      path: "error",
      isAuthenticated: req.session.isLoggedIn,
    });
});
console.log(process.env.NODE_ENV);
mongoose
  .connect(MONGODBURI)
  .then(() => {
    app.listen(process.env.PORT || 3000);
  })
  .catch((err) => console.log(err));
