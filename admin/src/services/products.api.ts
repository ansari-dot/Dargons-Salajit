import { api } from './api';
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
    const response = await api.get('/dashboard/stats');
    const items = response.data?.data?.topProducts;
    if (!Array.isArray(items)) {
      throw new Error('The dashboard API did not return top-selling products.');
    }
    return items.map((product: Record<string, unknown>) => ({
      id: String(product.id),
      name: String(product.name || 'Product'),
      sold: Number(product.sold || 0),
      revenue: Number(product.revenue || 0),
      image: String(product.image || '/shilajit-surp.png'),
      category: String(product.category || 'General'),
    }));
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
