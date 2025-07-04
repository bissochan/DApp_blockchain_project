import { useEffect, useState } from "react";
import CertificationForm from "../components/CertificationForm";
import Navbar from "../components/Navbar";
import UserSwitcher from "../components/UserSwitcher";
import { fetchCompanies } from "../services/api";

function CertifierDashboard() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    async function loadInitialCompany() {
      try {
        const res = await fetchCompanies();
        if (res.data.length > 0) {
          setCurrentUser(res.data[0]);
        }
      } catch (err) {
        console.error("Failed to load companies", err);
      }
    }

    loadInitialCompany();
  }, []);

  if (!currentUser) return <div className="p-8">Loading company...</div>;

  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Certifier's Dashboard</h1>

        <UserSwitcher
          currentUser={currentUser}
          onChangeUser={setCurrentUser}
          filter="companies"
        />

        <CertificationForm key={currentUser.id} currentUser={currentUser} />
      </div>
    </div>
  );
}

export default CertifierDashboard;
