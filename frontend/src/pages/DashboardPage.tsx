import { useNavigate } from "react-router-dom";

import { clearTokens } from "../utils/auth";

import { getRefreshToken } from "../utils/auth";

import { logout } from "../api/authApi";

function DashboardPage() {
  const navigate = useNavigate();

  const logoutHandler = async () => {
    try {
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        await logout(refreshToken);
      }
    } catch (error) {
      console.error(error);
    }

    clearTokens();

    navigate("/login");
  };

  return (
    <div>
      <h1>LifeOS Dashboard</h1>

      <button onClick={logoutHandler}>Logout</button>
    </div>
  );
}

export default DashboardPage;
