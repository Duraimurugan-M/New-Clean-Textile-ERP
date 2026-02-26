import Inventory from "../models/Inventory.js";

// ➕ Add Stock
export const addStock = async (data, session = null) => {
  if (session) {
    const [stock] = await Inventory.create([data], { session });
    return stock;
  }
  return await Inventory.create(data);
};

// ➖ Deduct Stock (Used in Production)
export const deductStock = async ({
  materialType,
  lotNumber,
  quantity,
  session = null,
}) => {
  const stock = await Inventory.findOne({
    materialType,
    lotNumber,
    status: "Available",
  }).session(session);

  if (!stock) {
    throw new Error("Stock not found");
  }

  if (stock.quantity < quantity) {
    throw new Error("Insufficient stock");
  }

  stock.quantity -= quantity;

  if (stock.quantity === 0) {
    stock.status = "Consumed";
  }

  await stock.save({ session });
  return stock;
};

// 📦 Get All Stock
export const getAllStock = async () => {
  return await Inventory.find();
};
