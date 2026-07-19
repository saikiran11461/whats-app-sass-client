import { motion } from "framer-motion";
import { Plus, Package, Search, Filter, Edit, Trash2, Eye, Tag, ShoppingBag } from "lucide-react";
import { useState } from "react";

const products = [
  { name: "Wireless Earbuds Pro", sku: "WEB-001", price: 4999, stock: 245, category: "Electronics", status: "active", image: "🎧" },
  { name: "Cotton T-Shirt", sku: "TSH-042", price: 799, stock: 1200, category: "Apparel", status: "active", image: "👕" },
  { name: "Ceramic Coffee Mug", sku: "MUG-018", price: 349, stock: 0, category: "Home", status: "out_of_stock", image: "☕" },
  { name: "Yoga Mat Premium", sku: "YOG-007", price: 1499, stock: 89, category: "Fitness", status: "active", image: "🧘" },
  { name: "Bluetooth Speaker", sku: "SPK-023", price: 2499, stock: 45, category: "Electronics", status: "active", image: "🔊" },
  { name: "Leather Wallet", sku: "WAL-011", price: 1299, stock: 156, category: "Accessories", status: "draft", image: "👛" },
];

const statusColors: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  out_of_stock: "bg-destructive/10 text-destructive",
  draft: "bg-secondary text-muted-foreground",
};

export default function Catalog() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = products.filter(p => (categoryFilter === "all" || p.category === categoryFilter) && (statusFilter === "all" || p.status === statusFilter));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Product Catalog</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage products for WhatsApp Commerce</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl glass-card stat-card-glow p-5">
          <div className="flex items-center gap-2 text-muted-foreground"><Package className="h-4 w-4" /><span className="text-[10px] font-medium uppercase tracking-wider">Total Products</span></div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{products.length}</p>
        </div>
        <div className="rounded-xl glass-card stat-card-glow p-5">
          <div className="flex items-center gap-2 text-muted-foreground"><ShoppingBag className="h-4 w-4" /><span className="text-[10px] font-medium uppercase tracking-wider">In Stock</span></div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{products.filter(p => p.stock > 0).length}</p>
        </div>
        <div className="rounded-xl glass-card stat-card-glow p-5">
          <div className="flex items-center gap-2 text-muted-foreground"><Tag className="h-4 w-4" /><span className="text-[10px] font-medium uppercase tracking-wider">Categories</span></div>
          <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{new Set(products.map(p => p.category)).size}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg glass-card px-4 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search products by name or SKU..." className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${showFilters ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex flex-wrap items-center gap-4 rounded-lg glass-card p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Category:</span>
            {["all", "Electronics", "Apparel", "Home", "Fitness", "Accessories"].map(c => (
              <button key={c} onClick={() => setCategoryFilter(c)} className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${categoryFilter === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{c === "all" ? "All" : c}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Status:</span>
            {["all", "active", "out_of_stock", "draft"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{s === "all" ? "All" : s.replace("_", " ")}</button>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="rounded-xl glass-card stat-card-glow p-5 hover-lift">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary text-2xl">{p.image}</div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{p.name}</h3>
                  <p className="text-xs tabular-nums text-muted-foreground">{p.sku}</p>
                </div>
              </div>
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusColors[p.status]}`}>{p.status.replace("_", " ")}</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Price</span>
                <p className="text-sm font-semibold tabular-nums text-foreground">₹{p.price.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Stock</span>
                <p className={`text-sm font-semibold tabular-nums ${p.stock === 0 ? "text-destructive" : "text-foreground"}`}>{p.stock}</p>
              </div>
              <div>
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Category</span>
                <p className="text-xs text-foreground">{p.category}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
              <button className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"><Eye className="h-3 w-3" /> Preview</button>
              <button className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"><Edit className="h-3 w-3" /> Edit</button>
              <button className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}