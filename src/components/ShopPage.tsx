import { useEffect, useState } from 'react';
import { ArrowLeft, Heart, Search, ShoppingCart } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { Product, ProductCategory } from '../types.ts';
import { formatINR } from '../utils/invoicePdf.ts';
import { ResilientImage } from './ResilientImage.tsx';

export function ShopPage() {
  const {
    products,
    selectedProductSlug,
    navigate,
    shopCategoryFilter,
    setShopCategoryFilter,
    addToCart,
    wishlistIds,
    toggleWishlist,
  } = useApp();

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'featured' | 'price_asc' | 'price_desc'>('featured');
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.categories) setCategories(d.categories);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setActiveImageIdx(0);
  }, [selectedProductSlug]);

  const detailProduct = selectedProductSlug
    ? products.find((p) => p.slug === selectedProductSlug)
    : null;

  if (detailProduct) {
    const related = products
      .filter(
        (p) => p.categoryName === detailProduct.categoryName && p.id !== detailProduct.id
      )
      .slice(0, 4);
    const images = detailProduct.images.length
      ? detailProduct.images
      : ['/src/assets/images/product_wifi_router_1795011448054.jpg'];
    const isWishlisted = wishlistIds.includes(detailProduct.id);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        <button
          onClick={() => navigate('shop', { productSlug: '' })}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Hardware Store
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Gallery */}
          <div className="lg:col-span-6 space-y-4">
            <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-white">
              <ResilientImage
                src={images[activeImageIdx] || images[0]}
                alt={detailProduct.name}
                fallbackLabel={detailProduct.name}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-3">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-20 h-16 rounded-lg overflow-hidden border-2 cursor-pointer ${
                      activeImageIdx === idx ? 'border-blue-600' : 'border-slate-200'
                    }`}
                  >
                    <ResilientImage
                      src={img}
                      alt={`${detailProduct.name} view ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Contiguous Purchase Module */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="text-xs text-slate-500">
                {detailProduct.categoryName} · {detailProduct.brand} · Model{' '}
                <span className="font-mono">{detailProduct.modelNumber}</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-950 mt-2">
                {detailProduct.name}
              </h1>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="font-display text-3xl font-extrabold text-slate-950 tabular-nums">
                  {formatINR(detailProduct.sellingPrice)}
                </span>
                {Number(detailProduct.originalPrice) >
                  Number(detailProduct.sellingPrice) && (
                  <>
                    <span className="text-base text-slate-400 line-through tabular-nums">
                      {formatINR(detailProduct.originalPrice)}
                    </span>
                    <span className="text-xs font-semibold text-blue-700 tabular-nums">
                      Save {detailProduct.discountPercent}%
                    </span>
                  </>
                )}
              </div>
              <div className="mt-2 text-xs text-slate-600 tabular-nums">
                {detailProduct.stockQuantity > 0
                  ? `In Stock (${detailProduct.stockQuantity} units available) · ${detailProduct.warranty}`
                  : 'Currently Out of Stock'}
              </div>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed">
              {detailProduct.description}
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => addToCart(detailProduct)}
                disabled={detailProduct.stockQuantity <= 0}
                className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                <ShoppingCart className="w-4 h-4" />
                {detailProduct.stockQuantity > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
              <button
                onClick={() => toggleWishlist(detailProduct.id)}
                className={`px-4 py-3 rounded-lg border text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
                  isWishlisted
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-blue-600' : ''}`} />
                {isWishlisted ? 'Wishlisted' : 'Wishlist'}
              </button>
            </div>

            {/* Technical Specifications */}
            <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700">
                Technical Specifications
              </div>
              <dl className="divide-y divide-slate-100 text-sm">
                {Object.entries(detailProduct.specs || {}).map(([key, val]) => (
                  <div key={key} className="px-5 py-3 flex justify-between gap-4">
                    <dt className="text-slate-500">{key}</dt>
                    <dd className="font-medium text-slate-950 text-right">{val}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="pt-8 border-t border-slate-200">
            <h2 className="font-display text-xl font-bold text-slate-950 mb-6">
              Related Hardware
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isWishlisted={wishlistIds.includes(p.id)}
                  onSelect={() => navigate('shop', { productSlug: p.slug })}
                  onAddToCart={() => addToCart(p)}
                  onToggleWishlist={() => toggleWishlist(p.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const filtered = products
    .filter((p) => {
      if (shopCategoryFilter !== 'All' && p.categoryName !== shopCategoryFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.modelNumber.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === 'price_asc') return Number(a.sellingPrice) - Number(b.sellingPrice);
      if (sort === 'price_desc') return Number(b.sellingPrice) - Number(a.sellingPrice);
      return Number(b.isFeatured) - Number(a.isFeatured) || a.id - b.id;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 mb-1">
            Star Fibernet Equipment Store
          </p>
          <h1 className="font-display text-3xl font-extrabold text-slate-950">
            Networking Devices & Fiber Hardware
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search routers, ONT, cables, model..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:border-blue-600"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:border-blue-600"
          >
            <option value="featured">Sort: Featured</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Category Filter Strip across all 14 categories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setShopCategoryFilter('All')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            shopCategoryFilter === 'All'
              ? 'bg-slate-950 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          All Devices
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setShopCategoryFilter(cat.name)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              shopCategoryFilter === cat.name
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-900">
            No matching networking devices found
          </p>
          <p className="text-xs text-slate-500">
            Try clearing your search or switching back to All Devices.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setShopCategoryFilter('All');
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              isWishlisted={wishlistIds.includes(p.id)}
              onSelect={() => navigate('shop', { productSlug: p.slug })}
              onAddToCart={() => addToCart(p)}
              onToggleWishlist={() => toggleWishlist(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({
  product,
  isWishlisted,
  onSelect,
  onAddToCart,
  onToggleWishlist,
}: {
  product: Product;
  isWishlisted: boolean;
  onSelect: () => void;
  onAddToCart: () => void;
  onToggleWishlist: () => void;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div>
        <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
          <div onClick={onSelect} className="w-full h-full cursor-pointer">
            <ResilientImage
              src={product.images[0]}
              alt={product.name}
              fallbackLabel={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={onToggleWishlist}
            aria-label="Toggle wishlist"
            className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/90 border border-slate-200 flex items-center justify-center text-slate-700 hover:text-blue-600 cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 ${isWishlisted ? 'fill-blue-600 text-blue-600' : ''}`}
            />
          </button>
        </div>

        <div className="p-5">
          <div className="text-xs text-slate-500 mb-1 truncate">
            {product.categoryName} · {product.brand}
          </div>
          <h3
            onClick={onSelect}
            className="font-display text-sm font-bold text-slate-950 line-clamp-2 cursor-pointer hover:text-blue-700"
          >
            {product.name}
          </h3>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-base font-bold text-slate-950 tabular-nums">
              {formatINR(product.sellingPrice)}
            </span>
            {Number(product.originalPrice) > Number(product.sellingPrice) && (
              <span className="text-xs text-slate-400 line-through tabular-nums">
                {formatINR(product.originalPrice)}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1 tabular-nums">
            {product.stockQuantity > 0
              ? `${product.stockQuantity} in stock`
              : 'Out of stock'}
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 flex gap-2">
        <button
          onClick={onAddToCart}
          disabled={product.stockQuantity <= 0}
          className="flex-1 py-2 px-3 rounded-lg bg-slate-950 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
        >
          {product.stockQuantity > 0 ? 'Add to Cart' : 'Unavailable'}
        </button>
        <button
          onClick={onSelect}
          className="py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
        >
          Specs
        </button>
      </div>
    </div>
  );
}
