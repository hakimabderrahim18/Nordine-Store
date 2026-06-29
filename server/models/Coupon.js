import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage',
    required: true
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount value cannot be negative']
  },
  minPurchaseAmount: {
    type: Number,
    default: 0,
    min: [0, 'Minimum purchase amount cannot be negative']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required']
  },
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  usageCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

CouponSchema.methods.isValid = function(purchaseAmount) {
  const now = new Date();
  if (this.status !== 'active') return false;
  if (this.expiryDate && this.expiryDate < now) return false;
  if (this.usageLimit !== null && this.usageCount >= this.usageLimit) return false;
  if (purchaseAmount && purchaseAmount < this.minPurchaseAmount) return false;
  return true;
};

const Coupon = mongoose.model('Coupon', CouponSchema);
export default Coupon;
