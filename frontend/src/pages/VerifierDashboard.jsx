import { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import UserSwitcher from "../components/UserSwitcher";
import VerificationForm from "../components/VerificationForm";
import { fetchCompanies, fetchUsers, fundUser } from "../services/api";

function VerifierDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [fundingStatus, setFundingStatus] = useState(null);
  const [fundingDetails, setFundingDetails] = useState(null);

  useEffect(() => {
    async function loadFirstUserOrCompany() {
      try {
        const [userRes, companyRes] = await Promise.all([
          fetchUsers(),
          fetchCompanies(),
        ]);
        const combined = [...userRes.data, ...companyRes.data];
        if (combined.length > 0) {
          setCurrentUser(combined[0]);
        }
      } catch (err) {
        console.error("Failed to load users/companies", err);
      }
    }

    loadFirstUserOrCompany();
  }, []);

  const handleFund = async () => {
    setFundingStatus("loading");
    setFundingDetails(null);
    try {
      const res = await fundUser({ username: currentUser.username, amount: 10 });
      setFundingStatus("success");
      setFundingDetails(res.data);
    } catch (err) {
      console.error("Errore nel funding:", err);
      setFundingStatus("error");
    }
  };

  if (!currentUser) return <div className="p-8">Caricamento utente...</div>;

  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard Verificatore</h1>

        <UserSwitcher
          currentUser={currentUser}
          onChangeUser={setCurrentUser}
          filter="all"
        />

        <VerificationForm currentUser={currentUser} />

        {/* BOTTONE CENTRATO */}
        <div className="mt-6 flex flex-col items-center">
          <button
            onClick={handleFund}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Simula Acquisto Token
          </button>
          {fundingStatus === "loading" && <p className="mt-2">⏳ Acquisto in corso...</p>}
          {fundingStatus === "success" && (
            <div className="mt-2 text-green-600 text-sm text-center">
              ✅ Token ricevuti!<br />
              <span className="block text-xs text-gray-700">
                Utente: {fundingDetails?.username}<br />
                Wallet: {fundingDetails?.wallet}<br />
                Amount: {fundingDetails?.amount} token
              </span>
            </div>
          )}
          {fundingStatus === "error" && <p className="mt-2 text-red-600">❌ Errore durante il funding.</p>}
        </div>
      </div>
    </div>
  );
}

export default VerifierDashboard;
