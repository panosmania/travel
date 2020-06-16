const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');
const AppError = require('../utils/appError');

exports.getOverview = async (req, res, next) => {
  try {
    // 1) Get tour data from collection
    const tours = await Tour.find();

    // 2) Build template
    // 3) Render that template using tour data form 1)

    res.status(200).render('overview', {
      title: 'All Tours',
      tours: tours,
    });
  } catch (err) {
    next(err);
  }
};

exports.getTour = async (req, res, next) => {
  try {
    // 1) get the data, for the requested tour (including reviews and quides)
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
      path: 'reviews',
      fields: 'review rating user',
    });

    if (!tour) {
      return next(new AppError('There is no tour with that name.', 404));
    }

    // 2) Build template
    // 3) Render that template using tour data form 1)

    res.status(200).render('tour', {
      title: `${tour.name} Tour`,
      tour: tour,
    });
  } catch (err) {
    next(err);
  }
};

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getSignForm = (req, res) => {
  res.status(200).render('signup', {
    title: 'Create your account!',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account!',
  });
};

exports.getMyTours = async (req, res, next) => {
  try {
    // 1) Find all bookings
    const bookings = await Booking.find({ user: req.user.id });
    //console.log('bookingg', bookings);

    // 2) Find tours with the returned IDs
    const tourIDs = bookings.map((el) => el.tour.id);
    //console.log('tourIDs', tourIDs);

    const tours = await Tour.find({ _id: { $in: tourIDs } });
    //console.log('tours', tours);

    res.status(200).render('overview', {
      title: 'My Tours',
      tours: tours,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateUserData = async (req, res, next) => {
  try {
    //console.log('UPDATING USER', req.body);

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        name: req.body.name,
        email: req.body.email,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).render('account', {
      title: 'Your account!',
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};
