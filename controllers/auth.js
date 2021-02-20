const crypto = require("crypto");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator/check");
const nodemailer = require("nodemailer");
const nodeSendgridTransport = require("nodemailer-sendgrid-transport");

const transporter = nodemailer.createTransport(
  nodeSendgridTransport({
    auth: {
      api_key:
        "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",
    },
  })
);

exports.getLogin = (req, res, next) => {
  let errMessage = req.flash("error");
  if (errMessage.length > 0) {
    errMessage = errMessage[0];
  } else {
    errMessage = null;
  }
  res.render("auth/login", {
    pageTitle: "Login",
    path: "login",
    errorMessage: errMessage,
    oldInput: {
      email: '',
      password: '',
    },
    errorMessages: []
  });
};

exports.postLogin = (req, res, next) => {
  let email = req.body.email;
  if (email.split('@')[0] === '') {
    email = '';
  }
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: 'login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email
        ,
        password: password
      },
      errorMessages: errors.array()
    });
  }

  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        return res.status(422).render('auth/login', {
          path: 'login',
          pageTitle: 'Login',
          errorMessage: 'Invalid Email or Password.',
          oldInput: {
            email: email,
            password: password
          },
          errorMessages: []
        });
      }
      bcrypt
        .compare(password, user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/');
            });
          }
          return res.status(422).render('auth/login', {
            path: 'login',
            pageTitle: 'Login',
            errorMessage: 'Invalid Email or Password.',
            oldInput: {
              email: email,
              password: password
            },
            errorMessages: []
          });
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login');
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getSignup = (req, res, next) => {
  let errMessage = req.flash("error");
  if (errMessage.length > 0) {
    errMessage = errMessage[0];
  } else {
    errMessage = null;
  }
  res.render("auth/signup", {
    pageTitle: "Signup",
    path: "signup",
    errorMessage: errMessage,
    oldInput: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    errorMessages: []
  });
};

exports.postSignup = (req, res, next) => {
  let email = req.body.email;
  if (email.split('@')[0] === '') {
    email = '';
  }
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      pageTitle: "Signup",
      path: "signup",
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword,
      },
      errorMessages: errors.array()
    });
  }
  bcrypt
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
      return transporter.sendMail({
        to: email,
        from: "ahmadmed7at77@gmail.com",
        subject: "Signup Completed",
        html: "Congratulations! Signing Up has successfully completed.",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    res.redirect("/login");
  });
};

exports.getReset = (req, res, next) => {
  let errMessage = req.flash("error");
  let validMessage = req.flash("valid");
  validMessage = validMessage[0];
  if (errMessage.length > 0) {
    errMessage = errMessage[0];
  } else {
    errMessage = null;
  }
  res.render("auth/reset", {
    pageTitle: "Login",
    path: "login",
    errorMessage: errMessage,
    validMessage: validMessage
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash("error", "No Email Found");
          return res.redirect("/reset");
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        if (result) {
          req.flash("valid", "An Email has been Sent");
          res.redirect('/reset');
          transporter.sendMail({
            to: req.body.email,
            from: "ahmadmed7at77@gmail.com",
            subject: "Password Reset",
            html: `
            <p>Click <a href="http://localhost:3000/reset/${token}">Here</a> to Reset Your Password</p>
          `,
          });
        }
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      let errMessage = req.flash("error");
      if (errMessage.length > 0) {
        errMessage = errMessage[0];
      } else {
        errMessage = null;
      }
      res.render("auth/new-password", {
        pageTitle: "New Password",
        path: "new-password",
        errorMessage: errMessage,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  const newPassword = req.body.password;
  let resetUser;
  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(() => {
      res.redirect("/login");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
