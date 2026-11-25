import mongoose from 'mongoose';

const SyncHistorySnapshotItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, default: '' },
  sku: { type: String, default: '' },
  isNewlyCreated: { type: Boolean, default: false },
  previousState: {
    stock: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: false },
    price: { type: Number, default: 0 },
    priceDetail: { type: Number, default: 0 },
    priceDetailReparation: { type: Number, default: 0 },
    priceReparation: { type: Number, default: 0 },
    demiGrosPrice: { type: Number, default: 0 },
    priceDemiGros: { type: Number, default: 0 },
    superGrosPrice: { type: Number, default: 0 },
    priceSuperGros: { type: Number, default: 0 },
    discountPrice: { type: Number, default: 0 },
    pricePromo: { type: Number, default: 0 }
  }
}, { _id: false });

const SyncHistorySchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    default: 'import.xlsx'
  },
  stats: {
    totalExcelRows: { type: Number, default: 0 },
    matchedInDb: { type: Number, default: 0 },
    priceUpdatedCount: { type: Number, default: 0 },
    restoredStockCount: { type: Number, default: 0 },
    createdCount: { type: Number, default: 0 },
    markedOutOfStockCount: { type: Number, default: 0 },
    totalDbProducts: { type: Number, default: 0 }
  },
  priceChangedItems: {
    type: Array,
    default: []
  },
  outOfStockSamples: {
    type: Array,
    default: []
  },
  status: {
    type: String,
    enum: ['completed', 'reverted'],
    default: 'completed'
  },
  revertedAt: {
    type: Date
  },
  syncedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  revertedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  snapshot: [SyncHistorySnapshotItemSchema]
}, {
  timestamps: true
});

export default mongoose.model('SyncHistory', SyncHistorySchema);
