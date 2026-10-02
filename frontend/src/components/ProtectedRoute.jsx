import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loading } from "./Feedback";

export default function ProtectedRoute({ children }) {
  const { token, ready } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  // Wait until the server has confirmed who this user is (and who they are)
  if (!ready) return <Loading />;
  return children;
}