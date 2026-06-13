import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { register as registerUser, googleLogin } from "../api/authApi";
import type { RegisterFormData } from "../types/auth";
import { saveTokens } from "../utils/auth";
import { GoogleLogin } from "@react-oauth/google";

function RegisterPage() {
  const navigate = useNavigate();
  const [errorVal, setErrorVal] = useState<string | null>(null);
  const [successVal, setSuccessVal] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setErrorVal(null);
    setSuccessVal(null);
    try {
      const response = await googleLogin(credentialResponse.credential);
      saveTokens(response.accessToken, response.refreshToken);
      setSuccessVal("Google login successful! Redirecting...");
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      console.error(error);
      setErrorVal("Google registration failed. Verify developer console.");
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>();

  const onSubmit = async (data: RegisterFormData) => {
    setErrorVal(null);
    setSuccessVal(null);
    try {
      await registerUser(data);
      setSuccessVal("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error: any) {
      const message = error?.response?.data?.message || "Registration failed. Email might already be registered.";
      setErrorVal(message);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #090d16 0%, #111827 100%)",
        color: "#f3f4f6",
        padding: "20px",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "40px 32px",
          backgroundColor: "rgba(17, 24, 39, 0.7)",
          backdropFilter: "blur(16px)",
          borderRadius: "var(--border-radius-md)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "800",
              fontFamily: "var(--font-display)",
              background: "linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: "0 0 8px",
            }}
          >
            Create Account
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>
            Join LifeOS to track goals and build structured roadmaps
          </p>
        </div>

        {errorVal && (
          <div style={{
            padding: "10px 14px",
            backgroundColor: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "var(--border-radius-sm)",
            color: "#f87171",
            fontSize: "12px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorVal}</span>
          </div>
        )}

        {successVal && (
          <div style={{
            padding: "10px 14px",
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            borderRadius: "var(--border-radius-sm)",
            color: "#34d399",
            fontSize: "12px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successVal}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="grid-cols-2" style={{ gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)" }}>First Name</label>
              <input
                type="text"
                className="input"
                placeholder="John"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#f3f4f6",
                  padding: "10px 14px",
                }}
                {...register("firstName", { required: true })}
              />
              {errors.firstName && (
                <span style={{ color: "var(--danger)", fontSize: "11px" }}>Required</span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)" }}>Last Name</label>
              <input
                type="text"
                className="input"
                placeholder="Doe"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#f3f4f6",
                  padding: "10px 14px",
                }}
                {...register("lastName")}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)" }}>Email Address</label>
            <input
              type="email"
              className="input"
              placeholder="john@example.com"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#f3f4f6",
                padding: "10px 14px",
              }}
              {...register("email", { required: true })}
            />
            {errors.email && (
              <span style={{ color: "var(--danger)", fontSize: "11px" }}>Email is required</span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)" }}>Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#f3f4f6",
                padding: "10px 14px",
              }}
              {...register("password", { required: true })}
            />
            {errors.password && (
              <span style={{ color: "var(--danger)", fontSize: "11px" }}>Password is required</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{
              padding: "12px",
              fontSize: "14px",
              fontWeight: "600",
              background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
              border: "none",
              marginTop: "8px",
            }}
          >
            {isSubmitting ? "Registering..." : "Create Account"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "8px 0" }}>
          <div style={{ flexGrow: 1, height: "1px", backgroundColor: "rgba(255, 255, 255, 0.08)" }}></div>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Or Register With</span>
          <div style={{ flexGrow: 1, height: "1px", backgroundColor: "rgba(255, 255, 255, 0.08)" }}></div>
        </div>

        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setErrorVal("Google registration failed. Origin might not be whitelisted or browser blocked.")}
          />
        </div>

        <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "16px", textAlign: "center" }}>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: "#a78bfa", fontWeight: "600", textDecoration: "underline" }}>
              Login
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
