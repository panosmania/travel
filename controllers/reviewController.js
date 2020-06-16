const Review = require('./../models/reviewModel');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

exports.GetAllReviews = factory.getAll(Review);
// exports.GetAllReviews = async (req, res, next) => {
//   try {
//     let filter = {};
//     if (req.params.tourId) filter = { tour: req.params.tourId };

//     const reviews = await Review.find(filter);

//     res.status(200).json({
//       status: 'success',
//       results: reviews.length,
//       data: {
//         reviews: reviews,
//       },
//     });
//   } catch (err) {
//     next(err);
//   }
// };

exports.CreateReview = async (req, res, next) => {
  try {
    //Allow nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    const newReview = await Review.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        review: newReview,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getReview = factory.getOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
