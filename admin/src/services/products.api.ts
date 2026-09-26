import { productApiService, ProductItem } from './productApiService';
import { TopProduct, InventoryItem, StockStatus } from '../types';

export const productsApi = {
  getProducts: async (): Promise<any[]> => {
    try {
      const items = await productApiService.getAll();
      return items;
    } catch {
      return [];
    }
  },

  getTopSelling: async (): Promise<TopProduct[]> => {
    try {
      const items: ProductItem[] = await productApiService.getAll();
      return items.map((p) => ({
        id: String(p.id),
        name: p.name,
        sold: Math.floor(25 + Math.random() * 75),
        revenue: (p.price || 2500) * 45,
        image: p.main_image || '/shilajit-surp.png',
        category: p.category_name || 'Shilajit',
      }));
    } catch {
      return [];
    }
  },

  getStockOverview: async (): Promise<InventoryItem[]> => {
    try {
      const items: ProductItem[] = await productApiService.getAll();
      return items.map((p) => {
        const stock = p.stock_quantity ?? 0;
        let status: StockStatus = 'In Stock';
        if (stock === 0) status = 'Out of Stock';
        else if (stock < 10) status = 'Low Stock';

        return {
          id: String(p.id),
          name: p.name,
          sku: p.sku || 'SKU-001',
          stock: stock,
          status: status,
          image: p.main_image || '/shilajit-surp.png',
          price: p.price || 0,
        };
      });
    } catch {
      return [];
    }
  },
};
