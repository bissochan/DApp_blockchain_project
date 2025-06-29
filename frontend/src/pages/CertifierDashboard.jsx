import { useEffect, useState } from "react";
import CertificationForm from "../components/CertificationForm";
import Navbar from "../components/navbar";
import UserSwitcher from "../components/UserSwitcher";
import { fetchCompanies } from "../services/api";

function CertifierDashboard() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function loadInitialCompany() {
      try {
        const res = await fetchCompanies();
        if (res.data.length > 0) {
          setCurrentUser(res.data[0]); // Prima company disponibile
        }
      } catch (err) {
        console.error("Failed to load companies", err);
      }
    }

    loadInitialCompany();
  }, []);

  if (!currentUser) return <div className="p-8">Caricamento company...</div>;

  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard Certificatore</h1>

        <UserSwitcher
          currentUser={currentUser}
          onChangeUser={setCurrentUser}
          filter="companies"
        />

        <CertificationForm currentUser={currentUser} />
      </div>
    </div>
  );
}

export default CertifierDashboard;
