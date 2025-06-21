import Navbar from "../components/navbar";
import VerificationForm from "../components/VerificationForm";

function VerifierDashboard() {
  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard Verificatore</h1>
        <VerificationForm />
      </div>
    </div>
  );
}

export default VerifierDashboard;