import { useEffect, useState } from "react";
import api from "../../api";
import { errMsg } from "../../utils";
import { toast } from "../../toast";
import { Spinner } from "../../components/Skeleton.jsx";

export default function AdminCategories() {
  const [list, setList] = useState(null);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");

  const load = () => api.get("/admin/categories").then((r) => setList(r.data)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/categories", { name });
      setName("");
      toast.success("Category added");
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const rename = async (c) => {
    try {
      await api.put(`/admin/categories/${c._id}`, { name: editName });
      setEditId(null);
      toast.success("Category renamed (products updated)");
      load();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete category “${c.name}”?`)) return;
    try {
      await api.delete(`/admin/categories/${c._id}`);
      toast.success("Category deleted");
      load();
    } catch (err) {
      toast.error(errMsg(err)); // e.g. "Move or delete the products in this category first"
    }
  };

  return (
    <>
      <h1>Categories</h1>
      <form className="admin-search" onSubmit={add}>
        <input required maxLength={60} placeholder="New category name" aria-label="New category name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-yellow">Add category</button>
      </form>

      {error && <p className="error">{error}</p>}
      {!list ? (
        <Spinner />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Products</th><th></th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c._id}>
                  <td>
                    {editId === c._id ? (
                      <input autoFocus maxLength={60} aria-label="Category name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    ) : c.name}
                  </td>
                  <td>{c.productCount}</td>
                  <td className="nowrap">
                    {editId === c._id ? (
                      <>
                        <button className="linklike" onClick={() => rename(c)}>Save</button>{" · "}
                        <button className="linklike" onClick={() => setEditId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="linklike" onClick={() => { setEditId(c._id); setEditName(c.name); }}>Rename</button>{" · "}
                        <button className="linklike" onClick={() => remove(c)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan="3" className="muted">No categories yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
