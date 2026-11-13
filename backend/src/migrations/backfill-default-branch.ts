import 'reflect-metadata';
import mongoose, { Types } from 'mongoose';

const DEFAULT_BRANCH = {
  name: 'Main Branch',
  code: 'main',
  isActive: true,
};

async function backfillDefaultBranch() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required to run the backfill');
  await mongoose.connect(uri);

  const branches = mongoose.connection.collection('branches');
  const products = mongoose.connection.collection('products');
  const inventories = mongoose.connection.collection('inventories');
  const orders = mongoose.connection.collection('orders');

  const branch = await branches.findOneAndUpdate(
    { code: DEFAULT_BRANCH.code },
    { $setOnInsert: DEFAULT_BRANCH },
    { upsert: true, returnDocument: 'after' },
  );
  if (!branch?._id)
    throw new Error('Could not create or find the default branch');
  const branchId = branch._id as Types.ObjectId;
  if (branch.isActive === false) {
    throw new Error(
      'The default branch exists but is inactive; activate it before migration',
    );
  }

  await branches.createIndex({ code: 1 }, { unique: true });
  await inventories.createIndex(
    { branchId: 1, productId: 1 },
    { unique: true },
  );

  const productCursor = products.find({}, { projection: { _id: 1, stock: 1 } });
  let batch: Array<{
    updateOne: {
      filter: { branchId: Types.ObjectId; productId: Types.ObjectId };
      update: { $setOnInsert: { stock: number } };
      upsert: true;
    };
  }> = [];
  for await (const product of productCursor) {
    const stock = typeof product.stock === 'number' ? product.stock : 0;
    if (!Number.isFinite(stock) || stock < 0) {
      throw new Error(`Product ${String(product._id)} has invalid stock`);
    }
    batch.push({
      updateOne: {
        filter: { branchId, productId: product._id as Types.ObjectId },
        update: { $setOnInsert: { stock } },
        upsert: true,
      },
    });

    if (batch.length === 500) {
      await inventories.bulkWrite(batch, { ordered: false });
      batch = [];
    }
  }
  if (batch.length) await inventories.bulkWrite(batch, { ordered: false });

  await orders.updateMany(
    { branchId: { $exists: false } },
    { $set: { branchId } },
  );
  await products.updateMany(
    { stock: { $exists: true } },
    { $unset: { stock: '' } },
  );

  console.log('Default branch backfill completed.');
}

try {
  await backfillDefaultBranch();
} finally {
  await mongoose.disconnect();
}
