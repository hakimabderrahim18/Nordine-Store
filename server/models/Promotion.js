import mongoose from 'mongoose';

const PromotionSchema = new mongoose.Schema({
  image: {
    type: String,
    required: [true, 'Image path is required']
  },
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  badge: {
    type: String,
    default: 'PROMO'
  },
  discountText: {
    type: String,
    default: ''
  },
  link: {
    type: String,
    default: '/shop'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Promotion = mongoose.model('Promotion', PromotionSchema);
export default Promotion;
