import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../api";
import { clearCart, selectCartTotal } from "../store/cartSlice";
import { addressErrors, errMsg, money, shippingFor } from "../utils";
import { useTitle } from "../hooks";
import { toast } from "../toast";
import { Spinner } from "../components/Skeleton.jsx";

const EMPTY = { fullName: "", phone: "", address: "", city: "", postalCode: "" };

export default function Checkout() {
  useTitle("Checkout");
  const items = useSelector((s) => s.cart.items);
  const user = useSelector((s) => s.user.user);
  const itemsPrice = useSelector(selectCartTotal);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [saved, setSaved] = useState(null); // saved addresses (null = loading)
  const [choice, setChoice] = useState("new"); // address _id or "new"
  const [form, setForm] = useState({ ...EMPTY, fullName: user?.name || "" });
  const [errors, setErrors] = useState({});
  const [saveIt, setSaveIt] = useState(true);
  const [cardAvailable, setCardAvailable] = useState(true);
  const [method, setMethod] = useState("Stripe");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/addresses").then((r) => {
      setSaved(r.data);
      const def = r.data.find((a) => a.isDefault) || r.data[0];
      if (def) setChoice(def._id);
    }).catch(() => setSaved([]));
    api.get("/health").then((r) => {
      if (!r.data.cardPayments) {
        setCardAvailable(false);
        setMethod("COD");
      }
    }).catch(() => {});
  }, []);

  if (!items.length) return <Navigate to="/cart" replace />;
  if (items.some((i) => i.countInStock < 1)) return <Navigate to="/cart" replace />;
  if (!saved) return <Spinner />;

  const shipping = shippingFor(itemsPrice);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const usingNew = choice === "new";

  const placeOrder = async (e) => {
    e.preventDefault();
    setError("");
    let address;
    if (usingNew) {
      const errs = addressErrors(form);
      setErrors(errs);
      if (Object.keys(errs).length) return;
      address = form;
    } else {
      const { fullName, phone, address: street, city, postalCode } = saved.find((a) => a._id === choice);
      address = { fullName, phone, address: street, city, postalCode };
    }

    setBusy(true);
    try {
      if (usingNew && saveIt) {
        try {
          await api.post("/addresses", address);
        } catch (err) {
          toast.info(`Address not saved: ${errMsg(err)}`); // never block the order on this
        }
      }
      const { data } = await api.post("/orders", {
        items: items.map(({ product, qty }) => ({ product, qty })),
        shippingAddress: address,
        paymentMethod: method,
      });
      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl); // hosted Stripe Checkout; cart is cleared after payment is verified
        return;
      }
      dispatch(clearCart());
      navigate(`/order/${data.order._id}?placed=1`, { replace: true });
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  const field = (k, label, props = {}) => (
    <label className={props.wide ? "span2" : ""}>
      {label}
      <input value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} {...props.input} />
      {errors[k] && <span className="field-error">{errors[k]}</span>}
    </label>
  );

  return (
    <form className="cart-layout" onSubmit={placeOrder} noValidate>
      <section className="panel">
        <h1>Checkout</h1>
        {error && <p className="error" role="alert">{error}</p>}

        <h3>1. Delivery address</h3>
        {saved.map((a) => (
          <label className="radio address-option" key={a._id}>
            <input type="radio" name="addr" checked={choice === a._id} onChange={() => setChoice(a._id)} />
            <span><b>{a.fullName}</b>{a.isDefault && <span className="tag">Default</span>}<br />{a.address}, {a.city} – {a.postalCode}<br />Phone: {a.phone}</span>
          </label>
        ))}
        {saved.length > 0 && (
          <label className="radio"><input type="radio" name="addr" checked={usingNew} onChange={() => setChoice("new")} /> Use a different address</label>
        )}
        {usingNew && (
          <>
            <div className="form-grid">
              {field("fullName", "Full name", { input: { autoComplete: "name" } })}
              {field("phone", "Mobile number", { input: { type: "tel", autoComplete: "tel", placeholder: "10-digit number" } })}
              {field("address", "Address", { wide: true, input: { autoComplete: "street-address", placeholder: "House no., street, area" } })}
              {field("city", "City", { input: { autoComplete: "address-level2" } })}
              {field("postalCode", "PIN code", { input: { inputMode: "numeric", maxLength: 6, autoComplete: "postal-code" } })}
            </div>
            <label className="check"><input type="checkbox" checked={saveIt} onChange={(e) => setSaveIt(e.target.checked)} /> Save this address to my account</label>
          </>
        )}

        <h3>2. Payment method</h3>
        <label className={`radio ${cardAvailable ? "" : "disabled"}`}>
          <input type="radio" name="pm" disabled={!cardAvailable} checked={method === "Stripe"} onChange={() => setMethod("Stripe")} />
          <span>Credit / Debit card (secure payment via Stripe){!cardAvailable && <em> – not configured on this server</em>}
            {cardAvailable && method === "Stripe" && <small className="muted block">Test mode: use card 4242 4242 4242 4242, any future expiry and any CVC. No real money is charged.</small>}
          </span>
        </label>
        <label className="radio"><input type="radio" name="pm" checked={method === "COD"} onChange={() => setMethod("COD")} /> Cash on Delivery</label>

        <h3>3. Review items</h3>
        {items.map((i) => (
          <div className="cart-row compact" key={i.product}>
            <img src={i.image} alt={i.name} />
            <div className="grow">{i.name}<div className="muted">Qty: {i.qty}</div></div>
            <div>{money(i.price * i.qty)}</div>
          </div>
        ))}
        <Link to="/cart">Edit cart</Link>
      </section>

      <aside className="panel summary">
        <button className="btn btn-yellow block" disabled={busy}>{busy ? "Placing order…" : method === "Stripe" ? "Pay now" : "Place your order"}</button>
        <h3>Order Summary</h3>
        <div className="sum"><span>Items</span><span>{money(itemsPrice)}</span></div>
        <div className="sum"><span>Delivery</span><span>{shipping ? money(shipping) : "FREE"}</span></div>
        <div className="sum total"><span>Order Total</span><span>{money(itemsPrice + shipping)}</span></div>
      </aside>
    </form>
  );
}
