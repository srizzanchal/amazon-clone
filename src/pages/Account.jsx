import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../api";
import { addressErrors, errMsg } from "../utils";
import { useTitle } from "../hooks";
import { toast } from "../toast";
import Modal from "../components/Modal.jsx";
import { Spinner } from "../components/Skeleton.jsx";

const EMPTY = { fullName: "", phone: "", address: "", city: "", postalCode: "", isDefault: false };

function AddressForm({ initial, onSaved, onClose }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = addressErrors(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const body = { ...form };
      const res = initial?._id ? await api.put(`/addresses/${initial._id}`, body) : await api.post("/addresses", body);
      toast.success("Address saved");
      onSaved(res.data);
    } catch (err) {
      toast.error(errMsg(err));
      setBusy(false);
    }
  };

  const f = (k, label, extra = {}) => (
    <label className={extra.wide ? "span2" : ""}>
      {label}
      <input value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} {...extra.input} />
      {errors[k] && <span className="field-error">{errors[k]}</span>}
    </label>
  );

  return (
    <Modal title={initial?._id ? "Edit address" : "Add a new address"} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="form-grid">
          {f("fullName", "Full name")}
          {f("phone", "Mobile number", { input: { type: "tel", placeholder: "10-digit number" } })}
          {f("address", "Address", { wide: true, input: { placeholder: "House no., street, area" } })}
          {f("city", "City")}
          {f("postalCode", "PIN code", { input: { inputMode: "numeric", maxLength: 6 } })}
        </div>
        <label className="check"><input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} /> Make this my default address</label>
        <div className="row">
          <button className="btn btn-yellow" disabled={busy}>{busy ? "Saving…" : "Save address"}</button>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Account() {
  useTitle("Your account");
  const user = useSelector((s) => s.user.user);
  const [addresses, setAddresses] = useState(null);
  const [editing, setEditing] = useState(null); // null | {} (new) | address
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/addresses").then((r) => setAddresses(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  const remove = async (a) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      setAddresses((await api.delete(`/addresses/${a._id}`)).data);
      toast.success("Address deleted");
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  const makeDefault = async (a) => {
    try {
      setAddresses((await api.put(`/addresses/${a._id}`, { ...a, isDefault: true })).data);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };

  return (
    <div className="panel">
      <h1>Your account</h1>
      <div className="two-col">
        <div><h3>Name</h3><p>{user.name}</p></div>
        <div><h3>Email</h3><p>{user.email}{user.role === "admin" && <span className="tag">Admin</span>}</p></div>
      </div>
      <p><Link to="/orders">Your orders</Link> · <Link to="/wishlist">Your wishlist</Link></p>

      <div className="section-head">
        <h2>Saved addresses</h2>
        <button className="btn btn-yellow" onClick={() => setEditing({})}>+ Add address</button>
      </div>
      {error && <p className="error">{error}</p>}
      {!addresses && !error && <Spinner />}
      {addresses?.length === 0 && <p className="muted">You haven't saved any addresses yet.</p>}
      <div className="address-grid">
        {addresses?.map((a) => (
          <div className="address-card" key={a._id}>
            {a.isDefault && <span className="tag">Default</span>}
            <b>{a.fullName}</b>
            <p>{a.address}<br />{a.city} – {a.postalCode}<br />Phone: {a.phone}</p>
            <div className="row">
              <button className="linklike" onClick={() => setEditing(a)}>Edit</button>
              <button className="linklike" onClick={() => remove(a)}>Delete</button>
              {!a.isDefault && <button className="linklike" onClick={() => makeDefault(a)}>Set as default</button>}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <AddressForm
          initial={editing._id ? editing : undefined}
          onClose={() => setEditing(null)}
          onSaved={(list) => { setAddresses(list); setEditing(null); }}
        />
      )}
    </div>
  );
}
