import { Hono } from 'hono';
import type { Env } from '../types';
import { Database } from '../db';

const products = new Hono<{ Bindings: Env }>();

products.get('/', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const categoryId = c.req.query('category');
  const featured = c.req.query('featured') === 'true';
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('limit') || '12');

  // 支持 featured=true 过滤（首页 Featured Products 使用）
  const result = await db.getProducts(
    categoryId ? parseInt(categoryId) : undefined,
    page,
    pageSize,
    featured
  );

  const items = result.items.map((p: any) => ({
    ...p,
    images: p.images ? JSON.parse(p.images) : []
  }));

  return c.json({
    success: true,
    data: {
      items,
      total: result.total,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize)
    }
  });
});

products.get('/featured', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const limit = parseInt(c.req.query('limit') || '6');
  const featuredProducts = await db.getFeaturedProducts(limit);
  
  return c.json({
    success: true,
    data: featuredProducts.map((p: any) => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : []
    }))
  });
});

products.get('/:slug', async (c) => {
  const db = new Database(c.env.DB, c.env.CACHE);
  const slug = c.req.param('slug');
  
  const product = await db.getProductBySlug(slug);
  if (!product) {
    return c.json({ success: false, error: 'Product not found' }, 404);
  }
  
  const category = product.category_id 
    ? await db.getCategoryById(product.category_id) 
    : null;
  
  return c.json({
    success: true,
    data: {
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      specifications: product.specifications ? JSON.parse(product.specifications) : {},
      category
    }
  });
});

export default products;