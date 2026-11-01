import AuthForm from "./AuthForm.jsx";
import { login } from "../store/userSlice";

export default function Login() {
  return <AuthForm mode="login" thunk={login} />;
}
