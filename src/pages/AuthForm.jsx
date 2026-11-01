import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearError } from "../store/userSlice";
import { PASSWORD_HINT, passwordError } from "../utils";
import { useTitle } from "../hooks";

// Shared by Login and Register
export default function AuthForm({ mode, thunk }) {
  const isRegister = mode === "register";
  useTitle(isRegister ? "Create account" : "Sign in");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const { user, status, error } = useSelector((s) => s.user);
  const dispatch = useDispatch();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  useEffect(() => { dispatch(clearError()); }, [dispatch, mode]);

  if (user) return <Navigate to={from} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (isRegister && !form.name.trim()) errs.name = "Enter your name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Enter a valid email address";
    if (isRegister) {
      const pe = passwordError(form.password);
      if (pe) errs.password = pe;
    } else if (!form.password) errs.password = "Enter your password";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    dispatch(thunk(isRegister ? form : { email: form.email, password: form.password }));
  };

  return (
    <form className="auth panel" onSubmit={submit} noValidate>
      <h1>{isRegister ? "Create account" : "Sign in"}</h1>
      {error && <p className="error" role="alert">{error}</p>}

      {isRegister && (
        <label>Your name
          <input value={form.name} onChange={set("name")} autoComplete="name" aria-invalid={!!errors.name} />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </label>
      )}
      <label>Email
        <input type="email" value={form.email} onChange={set("email")} autoComplete="email" aria-invalid={!!errors.email} />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </label>
      <label>Password
        <span className="pw-wrap">
          <input
            type={show ? "text" : "password"}
            value={form.password}
            onChange={set("password")}
            autoComplete={isRegister ? "new-password" : "current-password"}
            placeholder={isRegister ? PASSWORD_HINT : ""}
            aria-invalid={!!errors.password}
          />
          <button type="button" className="pw-toggle" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}>{show ? "Hide" : "Show"}</button>
        </span>
        {errors.password && <span className="field-error">{errors.password}</span>}
      </label>

      <button className="btn btn-yellow block" disabled={status === "loading"}>
        {status === "loading" ? "Please wait…" : isRegister ? "Create your account" : "Sign in"}
      </button>
      <p className="muted">
        {isRegister ? "Already have an account? " : "New here? "}
        <Link to={isRegister ? "/login" : "/register"} state={location.state}>{isRegister ? "Sign in" : "Create your account"}</Link>
      </p>
    </form>
  );
}
