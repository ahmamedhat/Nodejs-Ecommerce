const User = require("../models/user");
const bcrypt = require("bcryptjs");

exports.getLogin = (req, res, next) => {
  let errMessage = req.flash('error');
  if (errMessage.length > 0){
    errMessage = errMessage[0];
  }
  else {
    errMessage = null;
  }
  res.render("auth/login", {
    pageTitle: "Login",
    path: "login",
    errorMessage: errMessage
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({email: email})
    .then((user) => {
      if(!user) {
        req.flash('error' , 'Invalid Email or Password');
        return res.redirect('/login');
      }
      bcrypt.compare(password , user.password).then((match) => {
        if(match){
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save((err) => {
            res.redirect("/");
          });
        }
        req.flash('error' , 'Invalid Email or Password');
        res.redirect('/login');
      }).catch(err => {
        console.log(err);
        return res.redirect('/login');
      })
    })
    .catch((err) => console.log(err));
};

exports.getSignup = (req, res, next) => {
  let errMessage = req.flash('error');
  if (errMessage.length > 0){
    errMessage = errMessage[0];
  }
  else {
    errMessage = null;
  }
  res.render("auth/signup", {
    pageTitle: "Signup",
    path: "signup",
    errorMessage: errMessage
  });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  User.findOne({ email: email })
    .then((userData) => {
      if (userData) {
        req.flash('error' , 'Email Already Exists');
        return res.redirect("/signup");
      }
      return bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
          const user = new User({
            email: email,
            password: hashedPassword,
            cart: { items: [] },
          });
          return user.save();
        })
        .then(() => {
          res.redirect("/login");
        });
    })

    .catch((err) => console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    res.redirect("/login");
  });
};
