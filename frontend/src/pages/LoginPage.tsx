import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { login, googleLogin } from "../api/authApi";
import type { LoginFormData } from "../types/auth";
import { saveTokens } from "../utils/auth";

import { GoogleLogin } from "@react-oauth/google";

function LoginPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await login(data);

      saveTokens(response.accessToken, response.refreshToken);

      navigate("/");
    } catch (error: any) {
      const message = error?.response?.data?.message || "Login failed";

      alert(message);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const response = await googleLogin(credentialResponse.credential);

      saveTokens(response.accessToken, response.refreshToken);

      navigate("/");
    } catch (error) {
      console.error(error);

      alert("Google login failed");
    }
  };

  return (
    <div>
      <h1>Login</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          placeholder="Email"
          {...register("email", {
            required: true,
          })}
        />

        {errors.email && <p>Email required</p>}

        <input
          type="password"
          placeholder="Password"
          {...register("password", {
            required: true,
          })}
        />

        {errors.password && <p>Password required</p>}

        <button type="submit" disabled={isSubmitting}>
          Login
        </button>
      </form>

      <hr />

      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => alert("Google login failed")}
      />
    </div>
  );
}

export default LoginPage;
