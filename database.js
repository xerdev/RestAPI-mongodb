import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

// --- ID BOT APLIKASI WEB ---
// Diambil dari file APKPremium/config.js Anda
export const WEB_BOT_ID = 8323651234;

// --- KONEKSI DATABASE (dari database.js) ---
let isConnected = false;

export async function connectDB() {
  if (isConnected) return mongoose.connection;

  // Prefer environment variables; fall back to localhost for development
  const url = process.env.MONGODB_URL || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';

  if (!process.env.MONGODB_URL && !process.env.MONGO_URL) {
    console.warn('⚠️ Environment variable MONGODB_URL / MONGO_URL not set — attempting local MongoDB at mongodb://127.0.0.1:27017');
  }

  try {
    await mongoose.connect(url, { dbName: 'test' });
    await startInit();
    console.log("✅ Berhasil connect ke MongoDB.");
    isConnected = true;
    return mongoose.connection;
  } catch (err) {
    console.error("❌ Gagal connect ke MongoDB:", err);
    throw err;
  }
}

// ----------------- Schema & Model (dari database.js) -----------------
const transactionSchema = new mongoose.Schema({
  userId: { type: Number, required: true, index: true },
  botId: { type: Number, required: true, index: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true },
  status: { type: String, default: "completed" },
  accounts: { type: [String], default: [] },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, default: "balance" },
  snk: { type: String, default: "" },
  reffId: { type: String, default: "" },
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, default: "No Name" },
  role: { type: String, default: "member" },
  balance: { type: Number, default: 0 },
  transaksi: { type: Number, default: 0 },
  membeli: { type: Number, default: 0 },
  isTelegram: { type: Boolean, default: true },
  total_nominal_transaksi: { type: Number, default: 0 }, 
  banned: { type: Boolean, default: false },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  id: { type: String, required: true },
  price: { type: Number, required: true },
  desc: { type: String, default: "" },
  snk: { type: String, default: "" },
  terjual: { type: Number, default: 0 },
  account: { type: [String], default: [] }
}, { _id: false });

const productViewSchema = new mongoose.Schema({
  id: { type: [String], default: [] }
})

const botSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  terjual: { type: Number, default: 0 },
  transaksi: { type: Number, default: 0 },
  soldtoday: { type: Number, default: 0 },
  trxtoday: { type: Number, default: 0 },
  total_nominal_transaksi: { type: Number, default: 0 },
  nominaltoday: { type: Number, default: 0 }, 
  product: {
    type: Map,
    of: productSchema,
    default: {}
  },
  product_view: {
    type: Map,
    of: productViewSchema,
    default: {}
  }
}, { timestamps: true });


export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Bot = mongoose.models.Bot || mongoose.model("Bot", botSchema);
export const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);


export async function startInit() {
  await User.init();
  await Bot.init();
  await Transaction.init();
}

// --- Skema Otentikasi Web (dari mongodb.js asli) ---
const authUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, sparse: true }, 
  email: { type: String, required: true, unique: true, sparse: true },
  password: { type: String, required: true },
  telegramId: { type: Number, required: true, unique: true } 
}, { timestamps: true });

// Pre-save hook untuk hash password
authUserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Metode untuk membandingkan password
authUserSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Model untuk otentikasi web
export const AuthUser = mongoose.models.AuthUser || mongoose.model("AuthUser", authUserSchema);


// ----------------- Fungsi CRUD User (dari database.js) -----------------
export async function userRegister(id, name) {
  await connectDB();
  try {
    const exist = await User.findOne({ id });
    if (exist) return { success: false, error: "ID sudah digunakan." };

    const create = await User.create({ id, name });
    return { success: true, data: create };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function editBalance(id, amount) {
  await connectDB();
  try {
    if (!id || amount == null) throw new Error("Masukan data id dan amount!");
    if (isNaN(amount)) throw new Error("Nominal harus berupa angka!");

    const update = await User.findOneAndUpdate(
      { id },
      { $inc: { balance: amount } },
      { new: true }
    );

    if (!update) return { success: false, error: "ID tidak ditemukan." };
    return { success: true, data: update };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function editRole(id, role) {
  await connectDB();
  try {
    if (!id || !role) throw new Error("Masukan data id dan role!");

    const update = await User.findOneAndUpdate(
      { id },
      { $set: { role } },
      { new: true }
    );

    if (!update) return { success: false, error: "ID tidak ditemukan." };
    return { success: true, data: update };
  } catch (err) {
    return { success: false, error: err.message };
  }
}


export async function checkUser(id) {
  await connectDB();
  try {
    const exist = await User.findOne({ id });
    return { success: true, data: !!exist };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function dbUser(id) {
  await connectDB();
  try {
    const exist = await User.findOne({ id });
    return { success: true, data: exist };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ----------------- Fungsi CRUD Bot (dari database.js) -----------------
export async function checkDbBot(id) {
  await connectDB();
  try {
    const exist = await Bot.findOne({ id });
    return { success: true, data: !!exist };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function createDbBot(id, name) {
  await connectDB();
  try {
    const exist = await Bot.findOne({ id });
    if (exist) return { success: false, error: "ID bot sudah terdaftar." };

    const create = await Bot.create({ id, name });
    return { success: true, data: create };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function dbBot(id) {
  await connectDB()
  try {
    const cek = await Bot.findOne({ id })
    return { success: true, data: cek }
  } catch (e) {
    return { success: false, message: e.message }
  }
}

// ----------------- Fungsi CRUD Stok (dari database.js) -----------------
export async function createProductView(botId, title) {
  await connectDB();
  try {
    const bot = await Bot.findOne({ id: botId });
    if (!bot) return { success: false, error: "Bot tidak ditemukan." };

    if (bot.product_view.has(title)) return { exist: true }
    
    bot.product_view.set(title, { id: [] })
    
    bot.markModified('product_view');
    await bot.save();
    return { success: true, data: bot.product_view.get(title) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function addProductView(botId, title, accounts = []) {
  await connectDB();
  try {
    const bot = await Bot.findOne({ id: botId });
    if (!bot) return { success: false, error: "Bot tidak ditemukan." };

    const productView = bot.product_view.get(title);
    if (!productView) return { success: false, error: "Title tidak ditemukan di product_view." };

    productView.id.push(...accounts);
    bot.product_view.set(title, productView);

    bot.markModified('product_view');
    await bot.save();

    return { success: true, data: productView };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getProductDetails(botId, productId) {
  await connectDB();
  try {
    const bot = await Bot.findOne({ id: botId });
    if (!bot) return { success: false, error: "Bot tidak ditemukan." };

    const product = bot.product.get(productId);
    if (!product) return { success: false, error: "Produk tidak ditemukan." };

    return { success: true, data: product };
  } catch (err) {
    return { success: false, error: err.message };
  }
}



export async function addStock(botId, productId, accounts = []) {
  await connectDB();
  try {
    const bot = await Bot.findOne({ id: botId });
    if (!bot) return { success: false, error: "Bot tidak ditemukan." };

    const product = bot.product.get(productId);
    if (!product) return { success: false, error: "Produk tidak ditemukan." };

    product.account.push(...accounts);
    bot.product.set(productId, product);

    bot.markModified('product');
    await bot.save();

    return { success: true, data: product };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function delProduct(botId, productId) {
  await connectDB();
  try {
    const bot = await Bot.findOne({ id: botId });
    if (!bot) return { success: false, error: "Bot tidak ditemukan." };

    if (!bot.product.has(productId))
      return { success: false, error: "Produk tidak ditemukan." };

    bot.product.delete(productId);

    bot.markModified('product');
    await bot.save();

    return { success: true, data: `Produk ${productId} berhasil dihapus.` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function editProductName(botId, productId, newName) {
  await connectDB();
  try {
    const bot = await Bot.findOne({ id: botId });
    if (!bot) return { success: false, error: "Bot tidak ditemukan." };

    const product = bot.product.get(productId);
    if (!product) return { success: false, error: "Produk tidak ditemukan." };

    product.name = newName;
    bot.product.set(productId, product);

    bot.markModified('product');
    await bot.save();

    return { success: true, data: product };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function editProductPrice(botId, productId, newPrice) {
  await connectDB();
  try {
    const bot = await Bot.findOne({ id: botId });
    if (!bot) return { success: false, error: "Bot tidak ditemukan." };

    const product = bot.product.get(productId);
    if (!product) return { success: false, error: "Produk tidak ditemukan." };

    product.price = Number(newPrice);
    bot.product.set(productId, product);

    bot.markModified('product');
    await bot.save();

    return { success: true, data: product };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function editProductDesk(botId, productId, newDesc) {
  await connectDB();
  try {
    const bot = await Bot.findOne({ id: botId });
    if (!bot) return { success: false, error: "Bot tidak ditemukan." };

    const product = bot.product.get(productId);
    if (!product) return { success: false, error: "Produk tidak ditemukan." };

    product.desc = newDesc;
    bot.product.set(productId, product);

    bot.markModified('product');
    await bot.save();

    return { success: true, data: product };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function editProductSnk(botId, productId, newSnk) {
  await connectDB();
  try {
    const bot = await Bot.findOne({ id: botId });
    if (!bot) return { success: false, error: "Bot tidak ditemukan." };

    const product = bot.product.get(productId);
    if (!product) return { success: false, error: "Produk tidak ditemukan." };

    product.snk = newSnk;
    bot.product.set(productId, product);

    bot.markModified('product');
    await bot.save();

    return { success: true, data: product };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function editProductID(botId, oldId, newId) {
  await connectDB();
  try {
    const bot = await Bot.findOne({ id: botId });
    if (!bot) return { success: false, error: "Bot tidak ditemukan." };

    const product = bot.product.get(oldId);
    if (!product) return { success: false, error: "Produk tidak ditemukan." };
    if (bot.product.has(newId))
      return { success: false, error: "ID baru sudah digunakan." };

    product.id = newId;
    bot.product.delete(oldId);
    bot.product.set(newId, product);

    bot.markModified('product');
    await bot.save();

    return { success: true, data: product };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getProductAccount(botId, productId, total = 1) {
  await connectDB();
  try {
    const bot = await Bot.findOne({ id: botId });
    if (!bot) return { success: false, error: "Bot tidak ditemukan." };

    const product = bot.product.get(productId);
    if (!product) return { success: false, error: "Produk tidak ditemukan." };

    const slice = product.account.slice(0, total);
    return { success: true, data: slice };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getProductList(botId) {
  await connectDB();
  try {
    const bot = await Bot.findOne({ id: botId });
    if (!bot) return { success: false, error: "Bot tidak ditemukan." };

    const list = Array.from(bot.product.values()).map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      desc: p.desc,
      snk: p.snk,
      stock: p.account.length,
      terjual: p.terjual
    }));

    return { success: true, data: list };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ===================== ADMIN FUNCTIONS =====================

// Get all users for admin
export async function getAllUsers() {
  await connectDB();
  try {
    const users = await User.find({}).select('-__v').lean();
    return { success: true, data: users };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Delete user by ID
export async function deleteUser(userId) {
  await connectDB();
  try {
    const user = await User.findOneAndDelete({ id: userId });
    if (!user) return { success: false, error: "User tidak ditemukan." };
    
    // Also delete from AuthUser if exists
    await AuthUser.deleteOne({ telegramId: userId });
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Add product to bot
export async function addProduct(botId, productData) {
  await connectDB();
  try {
    const bot = await Bot.findOne({ id: botId });
    if (!bot) return { success: false, error: "Bot tidak ditemukan." };
    
    if (bot.product.has(productData.id)) {
      return { success: false, error: "ID produk sudah ada." };
    }
    
    const newProduct = {
      id: productData.id,
      name: productData.name,
      price: productData.price,
      desc: productData.desc || "",
      snk: productData.snk || "",
      terjual: 0,
      account: []
    };
    
    bot.product.set(productData.id, newProduct);
    bot.markModified('product');
    await bot.save();
    
    return { success: true, data: newProduct };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Delete product from bot
export async function deleteProduct(botId, productId) {
  await connectDB();
  try {
    const bot = await Bot.findOne({ id: botId });
    if (!bot) return { success: false, error: "Bot tidak ditemukan." };
    
    if (!bot.product.has(productId)) {
      return { success: false, error: "Produk tidak ditemukan." };
    }
    
    bot.product.delete(productId);
    bot.markModified('product');
    await bot.save();
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Add stock/accounts to product
export async function addProductStock(botId, productId, accounts) {
  await connectDB();
  try {
    const bot = await Bot.findOne({ id: botId });
    if (!bot) return { success: false, error: "Bot tidak ditemukan." };
    
    const product = bot.product.get(productId);
    if (!product) return { success: false, error: "Produk tidak ditemukan." };
    
    product.account.push(...accounts);
    bot.product.set(productId, product);
    bot.markModified('product');
    await bot.save();
    
    return { success: true, data: { stock: product.account.length } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Add category
export async function addCategory(botId, categoryName, productIds) {
  await connectDB();
  try {
    const bot = await Bot.findOne({ id: botId });
    if (!bot) return { success: false, error: "Bot tidak ditemukan." };
    
    if (bot.product_view.has(categoryName)) {
      return { success: false, error: "Kategori sudah ada." };
    }
    
    bot.product_view.set(categoryName, { id: productIds });
    bot.markModified('product_view');
    await bot.save();
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Update category
export async function updateCategory(botId, categoryName, productIds) {
  await connectDB();
  try {
    const bot = await Bot.findOne({ id: botId });
    if (!bot) return { success: false, error: "Bot tidak ditemukan." };
    
    if (!bot.product_view.has(categoryName)) {
      return { success: false, error: "Kategori tidak ditemukan." };
    }
    
    bot.product_view.set(categoryName, { id: productIds });
    bot.markModified('product_view');
    await bot.save();
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Delete category
export async function deleteCategory(botId, categoryName) {
  await connectDB();
  try {
    const bot = await Bot.findOne({ id: botId });
    if (!bot) return { success: false, error: "Bot tidak ditemukan." };
    
    if (!bot.product_view.has(categoryName)) {
      return { success: false, error: "Kategori tidak ditemukan." };
    }
    
    bot.product_view.delete(categoryName);
    bot.markModified('product_view');
    await bot.save();
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Get all transactions for admin
export async function getAllTransactions(botId) {
  await connectDB();
  try {
    const transactions = await Transaction.find({ botId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return { success: true, data: transactions };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Get admin stats
export async function getAdminStats(botId) {
  await connectDB();
  try {
    const totalUsers = await User.countDocuments({});
    const totalTransactions = await Transaction.countDocuments({ botId });
    const bot = await Bot.findOne({ id: botId });
    
    if (!bot) return { success: false, error: "Bot tidak ditemukan." };
    
    const totalProducts = bot.product.size;
    const totalRevenue = bot.total_nominal_transaksi || 0;
    const totalProductsSold = bot.terjual || 0; // Total products sold in pcs
    
    return {
      success: true,
      data: {
        totalUsers,
        totalTransactions,
        totalProducts,
        totalRevenue,
        totalProductsSold
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Get public stats (no auth required)
export async function getPublicStats(botId) {
  await connectDB();
  try {
    const bot = await Bot.findOne({ id: botId });
    
    if (!bot) return { success: false, error: "Bot tidak ditemukan." };
    
    const totalRevenue = bot.total_nominal_transaksi || 0;
    const totalProductsSold = bot.terjual || 0;
    
    return {
      success: true,
      data: {
        totalRevenue,
        totalProductsSold
      }
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}


export async function takeProductAccount(botId, productId, total = 1) {
  await connectDB();
  try {
    const bot = await Bot.findOne({ id: botId });
    if (!bot) return { success: false, error: "Bot tidak ditemukan." };
    const product = bot.product.get(productId);
    if (!product) return { success: false, error: "Produk tidak ditemukan." };
    if (product.account.length < total)
      return { success: false, error: "Stok tidak mencukupi." };

    const takenAccounts = product.account.slice(0, total);
    product.account.splice(0, total);
    bot.product.set(productId, product);

    bot.markModified('product');
    await bot.save();

    return { success: true, data: takenAccounts };
  } catch (err) {
    return { success: false, error: err.message };
  }
}


// ----------------- Fungsi untuk mengambil daftar ketegori (dari database.js)
export async function getCategory(botId) {
  await connectDB();
  try {
    const bot = await Bot.findOne({ id: botId });
    if (!bot) return { success: false, error: "Bot tidak ditemukan." };
    const category = bot.product_view
    let data = {}
    for (let [key, id] of category) {
      data[key] = id.id
    }
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}


// ----------------- Fungsi untuk mempermudah developer:) (dari database.js)
export async function getDBData(fn, ...args) {
  try {
    const result = await fn(...args)
    if (!result.success) throw new Error(result.message)
    return result.data
  } catch (e) {
    console.error('Error database :\n' + e)
    return null
  }
}

// untuk mencatat transaksi (dari database.js)
export async function recordSale(botId, productCode, quantity, finalPrice) {
  try {
    const { data: botData } = await dbBot(botId);
    if (!botData)
      throw new Error(
        "Data bot tidak ditemukan untuk pembaruan statistik."
      );

    const product = botData.product.get(productCode);
    if (product) {
      product.sold = (product.sold || 0) + quantity;
      botData.product.set(productCode, product);
      
      botData.markModified('product');
    }

    botData.terjual = (botData.terjual || 0) + quantity;
    botData.soldtoday = (botData.soldtoday || 0) + quantity;
    botData.trxtoday = (botData.trxtoday || 0) + finalPrice;

    await botData.save();
  } catch (dbError) {
    console.error("Gagal memperbarui statistik penjualan:", dbError);
  }
}

export async function addTransactionHistory(userId, botId, productId, productName, quantity, price, accounts = [], status = "completed", paymentMethod = "balance", snk = "", reffId = "") {
  await connectDB();
  try {
    const totalAmount = price * quantity;

    const newTransaction = await Transaction.create({
      userId,
      botId,
      productId,
      productName,
      quantity,
      price,
      status,
      accounts,
      totalAmount,
      paymentMethod,
      snk,
      reffId,
    });

    return { success: true, data: newTransaction };
  } catch (err) {
    console.error("❌ Gagal mencatat riwayat transaksi:", err);
    return { success: false, error: err.message };
  }
}

export async function getUserTransactionHistory(userId, limit = 10, skip = 0) {
  await connectDB();
  try {
    const history = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    return { success: true, data: history };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getBotGlobalTransactionHistory(botId, limit = 10, skip = 0) {
  await connectDB();
  try {
    const history = await Transaction.find({ botId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    return { success: true, data: history };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Detailed update (kept for compatibility/internal use)
export async function addBotTransactionDetailed(botId, totalTransaksi, totalTerjual, totalSoldToday, totalTrxToday, nominalLifetime, nominalToday) {
  await connectDB();
  try {
    const update = await Bot.findOneAndUpdate(
      { id: botId },
      {
        $inc: {
          transaksi: totalTransaksi,
          terjual: totalTerjual,
          soldtoday: totalSoldToday,
          trxtoday: totalTrxToday,
          total_nominal_transaksi: nominalLifetime,
          nominaltoday: nominalToday, 
        },
      },
      { new: true }
    );

    if (!update) return { success: false, error: "ID Bot tidak ditemukan." };
    return { success: true, data: update };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Simple helper: increment transaction count and nominal revenue for a bot
export async function addBotTransaction(botId, totalTransaksi = 1, totalNominal = 0) {
  await connectDB();
  try {
    const update = await Bot.findOneAndUpdate(
      { id: botId },
      {
        $inc: {
          transaksi: totalTransaksi,
          total_nominal_transaksi: totalNominal,
        },
      },
      { new: true }
    );
    if (!update) return { success: false, error: "ID Bot tidak ditemukan." };
    return { success: true, data: update };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Aggregation helpers
export async function calculateTotalRevenue() {
  await connectDB();
  try {
    const result = await Transaction.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    return result[0]?.total || 0;
  } catch (err) {
    return 0;
  }
}

export async function getRevenueByDate(startDate, endDate) {
  await connectDB();
  try {
    const result = await Transaction.aggregate([
      { $match: { status: "completed", createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    return result[0]?.total || 0;
  } catch (err) {
    return 0;
  }
}

export async function calculateTotalPcs() {
  await connectDB();
  try {
    const result = await Transaction.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, totalPcs: { $sum: "$quantity" } } }
    ]);
    return result[0]?.totalPcs || 0;
  } catch (err) {
    return 0;
  }
}

export async function getPcsPerProduk() {
  await connectDB();
  try {
    const result = await Transaction.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: "$productId", productName: { $first: "$productName" }, totalPcs: { $sum: "$quantity" }, totalRevenue: { $sum: "$totalAmount" } } },
      { $sort: { totalPcs: -1 } }
    ]);
    return result;
  } catch (err) {
    return [];
  }
}

export async function getPcsTerjualPerProduk(productId) {
  await connectDB();
  try {
    const result = await Transaction.aggregate([
      { $match: { status: "completed", productId } },
      { $group: { _id: "$productId", totalPcs: { $sum: "$quantity" } } }
    ]);
    return result[0]?.totalPcs || 0;
  } catch (err) {
    return 0;
  }
}

export async function addUserTransaction(userId, totalTransaksi, totalMembeli, nominal) {
  await connectDB();
  try {
    const update = await User.findOneAndUpdate(
      { id: userId },
      {
        $inc: {
          transaksi: totalTransaksi,
          membeli: totalMembeli,
          total_nominal_transaksi: nominal, 
        },
      },
      { new: true }
    );

    if (!update) return { success: false, error: "ID User tidak ditemukan." };
    return { success: true, data: update };
  } catch (err) {
    return { success: false, error: err.message };
  }
}


export async function addProductSold(botId, productId, totalTerjual) {
  await connectDB();
  try {
    const update = await Bot.findOneAndUpdate(
      { id: botId, [`product.${productId}`]: { $exists: true } },
      {
        $inc: {
          [`product.${productId}.terjual`]: totalTerjual,
          terjual: totalTerjual, // Update bot's total products sold
        },
      },
      { new: true }
    );

    if (!update) return { success: false, error: "Bot atau Produk tidak ditemukan.", message: update};

    const updatedProduct = update.product.get(productId);
    return { success: true, data: updatedProduct };
  } catch (err) {
    return { success: false, error: err.message };
  }
}


async function pcsPerProdukDariTransaksi(botId) {
  await connectDB();

  const hasil = await Transaction.aggregate([
    { $match: { status: "completed", botId } },
    { $group: { 
        _id: "$productId",
        namaProduk: { $first: "$productName" },
        totalPcs: { $sum: "$quantity" },
        totalPendapatan: { $sum: "$totalAmount" }
    }},
    { $sort: { totalPcs: -1 } }
  ]);

  return hasil;
}

export async function totalTransaksi(botId) {
  try {
    let data = await pcsPerProdukDariTransaksi(botId);
    let totalPcs = 0;
    let totalPendapatan = 0;

    if (Array.isArray(data) && data.length > 0) {
      data.forEach(item => {
        totalPcs += Number(item.totalPcs || 0);
        totalPendapatan += Number(item.totalPendapatan || 0);
      });
    } else {
      // Fallback: aggregate over Transaction collection
      totalPcs = await calculateTotalPcs();
      totalPendapatan = await calculateTotalRevenue();
    }

    // ensure numbers
    totalPcs = Number(totalPcs || 0);
    totalPendapatan = Number(totalPendapatan || 0);

    return { totalPcs, totalPendapatan };
  } catch (e) {
    console.log('Gagal menghitung total transaksi:', e);
    return { totalPcs: 0, totalPendapatan: 0 };
  }
}

export async function getTelegramUsers() {
    try {
        await connectDB();
        let data = await User.find({ isTelegram: true });
        return data;
    } catch (error) {
        console.error("Error fetching Telegram users:", error);
        return [];
    }
}