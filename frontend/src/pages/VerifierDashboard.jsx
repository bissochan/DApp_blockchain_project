import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import UserSwitcher from "../components/UserSwitcher";
import VerificationForm from "../components/VerificationForm";
import {
  fetchCompanies,
  fetchUsers,
  fundUser,
  getUserTokenBalance,
} from "../services/api";

function VerifierDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userSwitchKey, setUserSwitchKey] = useState(0);
  const [fundingStatus, setFundingStatus] = useState(null);
  const [fundingDetails, setFundingDetails] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

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
      const res = await fundUser({
        username: currentUser.username,
        amount: 10,
      });
      setFundingStatus("success");
      setFundingDetails(res.data);
    } catch (err) {
      console.error("Errore nel funding:", err);
      setFundingStatus("error");
    }
  };

  const handleCheckBalance = async () => {
    setBalanceLoading(true);
    setTokenBalance(null);
    try {
      const res = await getUserTokenBalance({ username: currentUser.username });
      setTokenBalance(res.data.balance);
    } catch (err) {
      console.error("Errore nel recupero del balance:", err);
      setTokenBalance("Errore");
    } finally {
      setBalanceLoading(false);
    }
  };

  if (!currentUser) return <div className="p-8">Loading User...</div>;

  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Verifier's Dashboard</h1>

        <UserSwitcher
          currentUser={currentUser}
          onChangeUser={(user) => {
            setCurrentUser(user);
            setUserSwitchKey((prev) => prev + 1);
            setFundingStatus(null);
            setFundingDetails(null);
            setTokenBalance(null);
          }}
          filter="all"
        />

        <VerificationForm
          currentUser={currentUser}
          resetSignal={userSwitchKey}
        />

        <div className="mt-6 flex flex-col items-center space-y-4">
          <button
            onClick={handleFund}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Simulate Token Funding
          </button>
          {fundingStatus === "loading" && <p>⏳ Acquisto in corso...</p>}
          {fundingStatus === "success" && (
            <div className="text-green-600 text-sm text-center">
              ✅ Simulazione acquisto riuscita!
              <br />
              <span className="block text-xs text-gray-700 mt-1">
                User: {fundingDetails?.username}
                <br />
                Wallet: {fundingDetails?.wallet}
                <br />
                Token Founded: {fundingDetails?.tokenAmount} token
                <br />
                Paid in ETH: {fundingDetails?.paidInEther} ETH
              </span>
            </div>
          )}

          {fundingStatus === "error" && (
            <p className="text-red-600">❌ Error during Funding.</p>
          )}

          <button
            onClick={handleCheckBalance}
            disabled={balanceLoading}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
          >
            {balanceLoading ? "Controllo in corso..." : "Mostra Balance Token"}
          </button>
          {tokenBalance !== null && (
            <p className="text-sm text-gray-800">
              Balance: {tokenBalance} token
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerifierDashboard;
