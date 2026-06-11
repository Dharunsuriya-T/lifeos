import { Navigate } from "react-router-dom";

import { getAccessToken } from "../utils/auth";

interface Props {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: Props) {
  const token = getAccessToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
