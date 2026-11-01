import AuthForm from "./AuthForm.jsx";
import { register } from "../store/userSlice";

export default function Register() {
  return <AuthForm mode="register" thunk={register} />;
}
