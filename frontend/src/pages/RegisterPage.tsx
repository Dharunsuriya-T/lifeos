import { useState, useEffect } from "react";
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
  const [isVerifyingGoogle, setIsVerifyingGoogle] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setErrorVal(null);
    setSuccessVal(null);
    setIsVerifyingGoogle(true);
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
    } finally {
      setIsVerifyingGoogle(false);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>();

  const [showColdStartNotice, setShowColdStartNotice] = useState(false);

  useEffect(() => {
    let timer: any;
    if (isSubmitting || isVerifyingGoogle) {
      timer = setTimeout(() => {
        setShowColdStartNotice(true);
      }, 3000);
    } else {
      setShowColdStartNotice(false);
    }
    return () => clearTimeout(timer);
  }, [isSubmitting, isVerifyingGoogle]);

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
    <div className="auth-container">
      <div className="auth-card">
        <div>
          <h1 className="auth-title">Create Account</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0, textAlign: "center" }}>
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

        {showColdStartNotice && (
          <div style={{
            padding: "10px 14px",
            backgroundColor: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            borderRadius: "var(--border-radius-sm)",
            color: "#fbbf24",
            fontSize: "12px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            lineHeight: "1.4"
          }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Connecting... The server is waking up from cold-start sleep. This can take up to 50 seconds. Please keep this screen open.</span>
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
                className="input auth-input"
                placeholder="John"
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
                className="input auth-input"
                placeholder="Doe"
                {...register("lastName")}
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-muted)" }}>Email Address</label>
            <input
              type="email"
              className="input auth-input"
              placeholder="john@example.com"
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
              className="input auth-input"
              placeholder="••••••••"
              {...register("password", { required: true })}
            />
            {errors.password && (
              <span style={{ color: "var(--danger)", fontSize: "11px" }}>Password is required</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || isVerifyingGoogle}
            style={{
              padding: "12px",
              fontSize: "14px",
              fontWeight: "600",
              border: "none",
              marginTop: "8px",
            }}
          >
            {isSubmitting ? "Registering..." : isVerifyingGoogle ? "Verifying..." : "Create Account"}
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
