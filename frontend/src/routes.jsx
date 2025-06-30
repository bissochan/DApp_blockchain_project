import { createBrowserRouter } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard";
import CertifierDashboard from "./pages/CertifierDashboard";
import Home from "./pages/Home";
import VerifierDashboard from "./pages/VerifierDashboard";
import WorkerDashboard from "./pages/WorkerDashboard";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/worker", element: <WorkerDashboard /> },
  { path: "/certifier", element: <CertifierDashboard /> },
  { path: "/verifier", element: <VerifierDashboard /> },
  { path: "/admin", element: <AdminDashboard /> },
]);

export default router;