const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
      role: req.body.role,
    });
    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url);

    await new Email(newUser, url).sendWelcome();

    const token = signToken(newUser._id);
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
    };

    //if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    if (req.secure || req.headers('x-forwarded-proto') === 'https')
      cookieOptions.secure = true;
    res.cookie('jwt', token, cookieOptions);

    //Remove the password from the output
    newUser.password = undefined;

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return next(new AppError('Please provide email and password!', 400));
    }

    // 2) Check if user exist && password is correct
    const user = await User.findOne({ email: email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    //console.log(user);

    // 3) If everything ok send the JWT TOKEN  to the client
    const token = signToken(user._id);
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
    };

    //if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    // if (req.secure || req.headers('x-forwarded-proto') === 'https')
    //   cookieOptions.secure = true;
    res.cookie('jwt', token, cookieOptions);
    res.status(200).json({
      status: 'success',
      token,
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'logout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

exports.protect = async (req, res, next) => {
  try {
    // 1) Getting token and check of it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    //console.log(token);

    if (!token) {
      return next(
        new AppError('You are not logged in! Please log in to get access.', 401)
      );
    }

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    //console.log(decoded);

    // 3) Check if user still exist
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError(
          'The user belonging to this token does no longer exist',
          401
        )
      );
    }

    // 4) Check if user changed password after the JWT TOKEN was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError(
          'User recently changed password! Please log in again.',
          401
        )
      );
    }
    // GRANT ACCESS TO PROTECTED ROUTE
    //console.log(currentUser);
    req.user = currentUser;
    //console.log('hii', req.user);
    res.locals.user = currentUser;

    next();
  } catch (err) {
    next(err);
  }
};

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      //console.log(decoded);

      // 2) Check if user still exist
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 4) Check if user changed password after the JWT TOKEN was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      // THERE IS A LOGGED IN USER
      //console.log(currentUser);
      res.locals.user = currentUser;

      //console.log('hii', res.locals.user);

      return next();
    } catch (err) {
      return next();
    }
  }

  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is a array ['admin','lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = async (req, res, next) => {
  try {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new AppError('There is no user with email address.', 404));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's Email

    // const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
      let resetURL = '';
      const url = `${req.protocol}://${req.get('host')}`;
      if (
        url === 'http://127.0.0.1:3000' ||
        url === 'https://tse-travels-app.herokuapp.com'
      ) {
        resetURL = `${url}/reset-Password/${resetToken}`;
      } else {
        resetURL = `${url}/api/v1/users/resetPassword/${resetToken}`;
      }

      // const resetURL = `${req.protocol}://${req.get(
      //   'host'
      // )}/api/v1/users/resetPassword/${resetToken}`;

      // await sendEmail({
      //   email: user.email,
      //   subject: 'Your password reset token (valid for 10 min)',
      //   message,
      // });
      await new Email(user, resetURL).sendPasswordReset();

      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!',
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new AppError(
          'There was an error sending the email. Try again later!',
          500
        )
      );
    }
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    //console.log('hashedToken', hashedToken);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    //console.log('user', user);

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      return next(new AppError('Token is invalid or has expired!', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    // 3) Update changePasswordAt property for the user

    // 4) Log the user in, send JWT
    const token = signToken(user._id);
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
    };

    //if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    if (req.secure || req.headers('x-forwarded-proto') === 'https')
      cookieOptions.secure = true;
    res.cookie('jwt', token, cookieOptions);
    res.status(200).json({
      status: 'success',
      token,
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePasswords = async (req, res, next) => {
  try {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if POSTed current password is correct
    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      return next(new AppError('Your current password is wrong.', 401));
    }

    // 3) If so, update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // 4) Log user in, send JWT
    const token = signToken(user._id);
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
    };

    //if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    if (req.secure || req.headers('x-forwarded-proto') === 'https')
      cookieOptions.secure = true;
    res.cookie('jwt', token, cookieOptions);
    res.status(200).json({
      status: 'success',
      token,
    });
  } catch (err) {
    next(err);
  }
};
