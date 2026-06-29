import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    trim: true
  },
  response: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// A user can only review a product once
ReviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Static method to calculate average rating of product
ReviewSchema.statics.calculateAverageRating = async function(productId) {
  const stats = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: '$product',
        numReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' }
      }
    }
  ]);

  try {
    if (stats.length > 0) {
      await mongoose.model('Product').findByIdAndUpdate(productId, {
        rating: Math.round(stats[0].averageRating * 10) / 10,
        numReviews: stats[0].numReviews
      });
    } else {
      await mongoose.model('Product').findByIdAndUpdate(productId, {
        rating: 0,
        numReviews: 0
      });
    }
  } catch (error) {
    console.error('Error updating average rating:', error);
  }
};

// Recalculate average rating after saving
ReviewSchema.post('save', async function() {
  await this.constructor.calculateAverageRating(this.product);
});

// Recalculate average rating after deleting
ReviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await mongoose.model('Review').calculateAverageRating(doc.product);
  }
});

const Review = mongoose.model('Review', ReviewSchema);
export default Review;
