import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import WorkerDashboard from "./pages/WorkerDashboard";
import CertifierDashboard from "./pages/CertifierDashboard";
import VerifierDashboard from "./pages/VerifierDashboard";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/worker", element: <WorkerDashboard /> },
  { path: "/certifier", element: <CertifierDashboard /> },
  { path: "/verifier", element: <VerifierDashboard /> },
]);

export default router;