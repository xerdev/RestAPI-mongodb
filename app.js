import express from 'express';
import cors from 'cors';
import * as db from './database.js'
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Helper untuk menangani request async dan error handling standar
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next))
        .catch((error) => {
            console.error(error);
            res.status(500).json({ success: false, error: error.message });
        });
};

// Helper untuk parsing parameter (menangani angka, boolean, dan JSON string untuk object/array)
const parseParam = (value) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (!isNaN(value) && value.trim() !== '') return Number(value);
    try {
        // Coba parse sebagai JSON (untuk array/object)
        return JSON.parse(value);
    } catch (e) {
        // Jika gagal, return sebagai string biasa
        return value;
    }
};

// Helper khusus untuk memecah string koma menjadi array (fallback jika bukan JSON array)
const parseArray = (value) => {
    try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
        return [parsed];
    } catch (e) {
        return value ? value.split(',') : [];
    }
};

// Route Dasar
app.get('/', (req, res) => {
    res.json({ message: "API Database is Running. Use defined endpoints." });
});

// ================= USER ROUTES =================

app.get('/api/user/register', asyncHandler(async (req, res) => {
    const { id, name } = req.query;
    const result = await db.userRegister(parseParam(id), name);
    res.json(result);
}));

app.get('/api/user/check', asyncHandler(async (req, res) => {
    const { id } = req.query;
    const result = await db.checkUser(parseParam(id));
    res.json(result);
}));

app.get('/api/user/detail', asyncHandler(async (req, res) => {
    const { id } = req.query;
    const result = await db.dbUser(parseParam(id));
    res.json(result);
}));

app.get('/api/user/edit-balance', asyncHandler(async (req, res) => {
    const { id, amount } = req.query;
    const result = await db.editBalance(parseParam(id), parseParam(amount));
    res.json(result);
}));

app.get('/api/user/edit-role', asyncHandler(async (req, res) => {
    const { id, role } = req.query;
    const result = await db.editRole(parseParam(id), role);
    res.json(result);
}));

app.get('/api/user/all', asyncHandler(async (req, res) => {
    const result = await db.getAllUsers();
    res.json(result);
}));

app.get('/api/user/delete', asyncHandler(async (req, res) => {
    const { userId } = req.query;
    const result = await db.deleteUser(parseParam(userId));
    res.json(result);
}));

app.get('/api/user/telegram', asyncHandler(async (req, res) => {
    const result = await db.getTelegramUsers();
    res.json({ success: true, data: result });
}));

app.get('/api/user/add-transaction', asyncHandler(async (req, res) => {
    const { userId, totalTransaksi, totalMembeli, nominal } = req.query;
    const result = await db.addUserTransaction(parseParam(userId), parseParam(totalTransaksi), parseParam(totalMembeli), parseParam(nominal));
    res.json(result);
}));

// ================= BOT ROUTES =================

app.get('/api/bot/check', asyncHandler(async (req, res) => {
    const { id } = req.query;
    const result = await db.checkDbBot(parseParam(id));
    res.json(result);
}));

app.get('/api/bot/create', asyncHandler(async (req, res) => {
    const { id, name } = req.query;
    const result = await db.createDbBot(parseParam(id), name);
    res.json(result);
}));

app.get('/api/bot/detail', asyncHandler(async (req, res) => {
    const { id } = req.query;
    const result = await db.dbBot(parseParam(id));
    res.json(result);
}));

// ================= PRODUCT & CATEGORY ROUTES =================

app.get('/api/category/list', asyncHandler(async (req, res) => {
    const { botId } = req.query;
    const result = await db.getCategory(parseParam(botId));
    res.json(result);
}));

app.get('/api/category/add', asyncHandler(async (req, res) => {
    const { botId, categoryName, productIds } = req.query;
    // productIds diharapkan array, bisa JSON string atau comma separated
    const pIds = parseArray(productIds);
    const result = await db.addCategory(parseParam(botId), categoryName, pIds);
    res.json(result);
}));

app.get('/api/category/update', asyncHandler(async (req, res) => {
    const { botId, categoryName, productIds } = req.query;
    const pIds = parseArray(productIds);
    const result = await db.updateCategory(parseParam(botId), categoryName, pIds);
    res.json(result);
}));

app.get('/api/category/delete', asyncHandler(async (req, res) => {
    const { botId, categoryName } = req.query;
    const result = await db.deleteCategory(parseParam(botId), categoryName);
    res.json(result);
}));

// --- Product View ---

app.get('/api/product/view/create', asyncHandler(async (req, res) => {
    const { botId, title } = req.query;
    const result = await db.createProductView(parseParam(botId), title);
    res.json(result);
}));

app.get('/api/product/view/add', asyncHandler(async (req, res) => {
    const { botId, title, accounts } = req.query;
    const accs = parseArray(accounts);
    const result = await db.addProductView(parseParam(botId), title, accs);
    res.json(result);
}));

// --- Product Management ---

app.get('/api/product/list', asyncHandler(async (req, res) => {
    const { botId } = req.query;
    const result = await db.getProductList(parseParam(botId));
    res.json(result);
}));

app.get('/api/product/detail', asyncHandler(async (req, res) => {
    const { botId, productId } = req.query;
    const result = await db.getProductDetails(parseParam(botId), productId);
    res.json(result);
}));

app.get('/api/product/add', asyncHandler(async (req, res) => {
    const { botId, productData } = req.query;
    // productData HARUS berupa JSON String yang valid, contoh: {"id":"p1","name":"Test","price":1000}
    const pData = typeof productData === 'string' ? JSON.parse(productData) : productData;
    const result = await db.addProduct(parseParam(botId), pData);
    res.json(result);
}));

app.get('/api/product/delete', asyncHandler(async (req, res) => {
    const { botId, productId } = req.query;
    // Menggunakan deleteProduct (sama dengan delProduct tapi beda nama export di db)
    const result = await db.deleteProduct(parseParam(botId), productId);
    res.json(result);
}));

// --- Editing Products ---

app.get('/api/product/edit/name', asyncHandler(async (req, res) => {
    const { botId, productId, newName } = req.query;
    const result = await db.editProductName(parseParam(botId), productId, newName);
    res.json(result);
}));

app.get('/api/product/edit/price', asyncHandler(async (req, res) => {
    const { botId, productId, newPrice } = req.query;
    const result = await db.editProductPrice(parseParam(botId), productId, parseParam(newPrice));
    res.json(result);
}));

app.get('/api/product/edit/desc', asyncHandler(async (req, res) => {
    const { botId, productId, newDesc } = req.query;
    const result = await db.editProductDesk(parseParam(botId), productId, newDesc);
    res.json(result);
}));

app.get('/api/product/edit/snk', asyncHandler(async (req, res) => {
    const { botId, productId, newSnk } = req.query;
    const result = await db.editProductSnk(parseParam(botId), productId, newSnk);
    res.json(result);
}));

app.get('/api/product/edit/id', asyncHandler(async (req, res) => {
    const { botId, oldId, newId } = req.query;
    const result = await db.editProductID(parseParam(botId), oldId, newId);
    res.json(result);
}));

// --- Stock Management ---

app.get('/api/product/stock/add', asyncHandler(async (req, res) => {
    const { botId, productId, accounts } = req.query;
    const accs = parseArray(accounts);
    const result = await db.addStock(parseParam(botId), productId, accs);
    res.json(result);
}));

app.get('/api/product/account', asyncHandler(async (req, res) => {
    const { botId, productId, total } = req.query;
    const result = await db.getProductAccount(parseParam(botId), productId, parseParam(total));
    res.json(result);
}));

app.get('/api/product/take', asyncHandler(async (req, res) => {
    const { botId, productId, total } = req.query;
    const result = await db.takeProductAccount(parseParam(botId), productId, parseParam(total));
    res.json(result);
}));

app.get('/api/product/sold/add', asyncHandler(async (req, res) => {
    const { botId, productId, totalTerjual } = req.query;
    const result = await db.addProductSold(parseParam(botId), productId, parseParam(totalTerjual));
    res.json(result);
}));

// ================= TRANSACTION ROUTES =================

app.get('/api/transaction/record-sale', asyncHandler(async (req, res) => {
    const { botId, productCode, quantity, finalPrice } = req.query;
    // recordSale tidak return value di db.js, jadi kita bungkus
    await db.recordSale(parseParam(botId), productCode, parseParam(quantity), parseParam(finalPrice));
    res.json({ success: true, message: "Sale recorded successfully" });
}));

app.get('/api/transaction/add-history', asyncHandler(async (req, res) => {
    const { userId, botId, productId, productName, quantity, price, accounts, status, paymentMethod, snk, reffId } = req.query;
    const accs = parseArray(accounts);
    const result = await db.addTransactionHistory(
        parseParam(userId), parseParam(botId), productId, productName, 
        parseParam(quantity), parseParam(price), accs, status, paymentMethod, snk, reffId
    );
    res.json(result);
}));

app.get('/api/transaction/user-history', asyncHandler(async (req, res) => {
    const { userId, limit, skip } = req.query;
    const result = await db.getUserTransactionHistory(parseParam(userId), parseParam(limit), parseParam(skip));
    res.json(result);
}));

app.get('/api/transaction/bot-history', asyncHandler(async (req, res) => {
    const { botId, limit, skip } = req.query;
    const result = await db.getBotGlobalTransactionHistory(parseParam(botId), parseParam(limit), parseParam(skip));
    res.json(result);
}));

app.get('/api/transaction/all', asyncHandler(async (req, res) => {
    const { botId } = req.query;
    const result = await db.getAllTransactions(parseParam(botId));
    res.json(result);
}));

// ================= STATS ROUTES =================

app.get('/api/stats/admin', asyncHandler(async (req, res) => {
    const { botId } = req.query;
    const result = await db.getAdminStats(parseParam(botId));
    res.json(result);
}));

app.get('/api/stats/public', asyncHandler(async (req, res) => {
    const { botId } = req.query;
    const result = await db.getPublicStats(parseParam(botId));
    res.json(result);
}));

app.get('/api/stats/total-transaction', asyncHandler(async (req, res) => {
    const { botId } = req.query;
    const result = await db.totalTransaksi(parseParam(botId));
    res.json({ success: true, data: result });
}));

app.get('/api/stats/add-bot-trx', asyncHandler(async (req, res) => {
    const { botId, totalTransaksi, totalNominal } = req.query;
    const result = await db.addBotTransaction(parseParam(botId), parseParam(totalTransaksi), parseParam(totalNominal));
    res.json(result);
}));

app.get('/api/stats/revenue', asyncHandler(async (req, res) => {
    const result = await db.calculateTotalRevenue();
    res.json({ success: true, data: result });
}));

app.get('/api/stats/revenue-date', asyncHandler(async (req, res) => {
    const { start, end } = req.query;
    const result = await db.getRevenueByDate(new Date(start), new Date(end));
    res.json({ success: true, data: result });
}));

app.get('/api/stats/total-pcs', asyncHandler(async (req, res) => {
    const result = await db.calculateTotalPcs();
    res.json({ success: true, data: result });
}));

app.get('/api/stats/pcs-per-product', asyncHandler(async (req, res) => {
    const result = await db.getPcsPerProduk();
    res.json({ success: true, data: result });
}));

app.get('/api/stats/pcs-sold-product', asyncHandler(async (req, res) => {
    const { productId } = req.query;
    const result = await db.getPcsTerjualPerProduk(productId);
    res.json({ success: true, data: result });
}));


// Jalankan Server dan Konek DB
(async () => {
    try {
        await db.connectDB();
        app.listen(PORT, () => {
            console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Gagal menjalankan server:", err);
    }
})();