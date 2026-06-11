import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { register as registerUser } from "../api/authApi";

import type { RegisterFormData } from "../types/auth";

function RegisterPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>();

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data);

      alert("Registration successful");

      navigate("/login");
    } catch (error: any) {
      const message = error?.response?.data?.message || "Registration failed";

      alert(message);
    }
  };

  return (
    <div>
      <h1>Register</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          placeholder="First Name"
          {...register("firstName", {
            required: true,
          })}
        />

        {errors.firstName && <p>First name required</p>}

        <input placeholder="Last Name" {...register("lastName")} />

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
          Register
        </button>
      </form>
    </div>
  );
}

export default RegisterPage;
