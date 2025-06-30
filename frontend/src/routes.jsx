import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import WorkerDashboard from "./pages/WorkerDashboard";
import CertifierDashboard from "./pages/CertifierDashboard";
import VerifierDashboard from "./pages/VerifierDashboard";
import AdminDashboard from "./pages/AdminDashboard";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/worker", element: <WorkerDashboard /> },
  { path: "/certifier", element: <CertifierDashboard /> },
  { path: "/verifier", element: <VerifierDashboard /> },
  { path: "/admin", element: <AdminDashboard /> },
]);

export default router;