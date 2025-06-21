import Navbar from "../components/navbar";
import CertificationForm from "../components/CertificationForm";

function CertifierDashboard() {
  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard Certificatore</h1>
        <CertificationForm />
      </div>
    </div>
  );
}

export default CertifierDashboard;