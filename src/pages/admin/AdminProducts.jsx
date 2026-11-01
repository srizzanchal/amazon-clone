import { useCallback, useEffect, useState } from "react";
import api from "../../api";
import { errMsg, money } from "../../utils";
import { toast } from "../../toast";
import Modal from "../../components/Modal.jsx";
import Pagination from "../../components/Pagination.jsx";
import { Spinner } from "../../components/Skeleton.jsx";

const EMPTY = { name: "", image: "", brand: "", category: "", description: "", price: "", countInStock: "" };

function ProductForm({ initial, categories, onSaved, onClose }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial, category: initial?.category || categories[0] || "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const editing = Boolean(initial?._id);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = { ...form, price: Number(form.price), countInStock: Number(form.countInStock) };
    try {
      if (editing) await api.put(`/products/${initial._id}`, body);
      else await api.post("/products", body);
      toast.success(editing ? "Product updated" : "Product created");
      onSaved();
    } catch (err) {
      setError(errMsg(err)); // server validation message
      setBusy(false);
    }
  };

  return (
    <Modal title={editing ? "Edit product" : "Add product"} onClose={onClose}>
      <form onSubmit={submit}>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="form-grid">
          <label className="span2">Name<input required maxLength={200} value={form.name} onChange={set("name")} /></label>
          <label className="span2">Image URL<input required type="url" placeholder="https://…" value={form.image} onChange={set("image")} /></label>
          <label>Brand<input maxLength={100} value={form.brand} onChange={set("brand")} /></label>
          <label>Category
            <select required value={form.category} onChange={set("category")}>
              {categories.length === 0 && <option value="">Create a category first</option>}
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>Price (₹)<input required type="number" min="0" step="0.01" value={form.price} onChange={set("price")} /></label>
          <label>Stock<input required type="number" min="0" step="1" value={form.countInStock} onChange={set("countInStock")} /></label>
          <label className="span2">Description<textarea rows="4" maxLength={5000} value={form.description} onChange={set("description")} /></label>
        </div>
        <div className="row">
          <button className="btn btn-yellow" disabled={busy || !form.category}>{busy ? "Saving…" : "Save product"}</button>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminProducts() {
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState(null); // null until loaded
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // null | {} (new) | product
  const [error, setError] = useState("");

  const load = useCallback(() => {
    const qs = new URLSearchParams({ page, limit: 10 });
    if (search) qs.set("keyword", search);
    return api.get(`/products?${qs}`).then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get("/admin/categories").then((r) => setCategories(r.data.map((c) => c.name))).catch(() => {});
  }, []);

  const remove = async (p) => {
    if (!window.confirm(`Delete “${p.name}”? This also removes its reviews.`)) return;
    try {
      await api.delete(`/products/${p._id}`);
      toast.success("Product deleted");
      load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <>
      <div className="section-head">
        <h1>Products</h1>
        <button className="btn btn-yellow" onClick={() => setEditing({})}>+ Add product</button>
      </div>

      <form className="admin-search" onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(keyword.trim()); }}>
        <input placeholder="Search products…" aria-label="Search products" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        <button className="btn">Search</button>
        {search && <button type="button" className="btn" onClick={() => { setKeyword(""); setSearch(""); setPage(1); }}>Clear</button>}
      </form>

      {error && <p className="error">{error}</p>}
      {!data ? (
        <Spinner />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Sold</th><th></th></tr>
            </thead>
            <tbody>
              {data.products.map((p) => (
                <tr key={p._id}>
                  <td><img className="thumb" src={p.image} alt="" /></td>
                  <td>{p.name}<br /><small className="muted">{p.brand}</small></td>
                  <td>{p.category}</td>
                  <td>{money(p.price)}</td>
                  <td className={p.countInStock === 0 ? "out" : p.countInStock <= 5 ? "low" : ""}>{p.countInStock}</td>
                  <td>{p.sold ?? 0}</td>
                  <td className="nowrap">
                    <button className="linklike" onClick={() => setEditing(p)}>Edit</button>{" · "}
                    <button className="linklike" onClick={() => remove(p)}>Delete</button>
                  </td>
                </tr>
              ))}
              {data.products.length === 0 && <tr><td colSpan="7" className="muted">No products found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={data.page} pages={data.pages} onChange={setPage} />}

      {editing && categories && (
        <ProductForm
          initial={editing._id ? editing : undefined}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </>
  );
}
