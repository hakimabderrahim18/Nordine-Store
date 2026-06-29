import mongoose from 'mongoose';

const SpecificationSchema = new mongoose.Schema({
  key: { type: String, required: true },
  value: { type: String, required: true }
}, { _id: false });

const VariantSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., 'Color', 'Quality'
  options: [{ type: String, required: true }] // e.g., ['Black', 'White', 'Blue'] or ['OEM', 'Original']
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  sku: {
    type: String,
    required: [true, 'Product SKU is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  longDescription: {
    type: String
  },
  price: {
    type: Number,
    default: 0,
    min: [0, 'Price cannot be negative']
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price cannot be negative']
  },
  demiGrosPrice: {
    type: Number,
    min: [0, 'Demi-gros price cannot be negative']
  },
  superGrosPrice: {
    type: Number,
    min: [0, 'Super-gros price cannot be negative']
  },
  priceDetail: {
    type: Number,
    default: 0
  },
  priceDetailReparation: {
    type: Number,
    default: 0
  },
  priceReparation: {
    type: Number,
    default: 0
  },
  priceDemiGros: {
    type: Number,
    default: 0
  },
  priceSuperGros: {
    type: Number,
    default: 0
  },
  pricePromo: {
    type: Number,
    default: 0
  },
  famille: {
    type: String,
    trim: true
  },
  sousFamille: {
    type: String,
    trim: true
  },
  marque: {
    type: String,
    trim: true
  },
  images: {
    type: [String],
    default: []
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: false
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: false
  },
  stock: {
    type: Number,
    required: [true, 'Product stock is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  variants: [VariantSchema],
  specifications: [SpecificationSchema],
  isFeatured: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

ProductSchema.pre('save', function(next) {
  if (this.priceDetail !== undefined && this.priceDetail !== 0) {
    this.price = this.priceDetail;
  } else if (this.price !== undefined && this.price !== 0) {
    this.priceDetail = this.price;
  }

  if (this.priceDemiGros !== undefined && this.priceDemiGros !== 0) {
    this.demiGrosPrice = this.priceDemiGros;
  } else if (this.demiGrosPrice !== undefined && this.demiGrosPrice !== 0) {
    this.priceDemiGros = this.demiGrosPrice;
  }

  if (this.priceSuperGros !== undefined && this.priceSuperGros !== 0) {
    this.superGrosPrice = this.priceSuperGros;
  } else if (this.superGrosPrice !== undefined && this.superGrosPrice !== 0) {
    this.priceSuperGros = this.superGrosPrice;
  }

  if (this.pricePromo !== undefined && this.pricePromo !== 0) {
    this.discountPrice = this.pricePromo;
  } else if (this.discountPrice !== undefined && this.discountPrice !== 0) {
    this.pricePromo = this.discountPrice;
  }

  next();
});

// Text index for search functionality
ProductSchema.index({ name: 'text', description: 'text', sku: 'text' });

const Product = mongoose.model('Product', ProductSchema);
export default Product;
