import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import UserSwitcher from "../components/UserSwitcher";
import WhitelistRequestForm from "../components/WhitelistRequestForm";
import CertifierList from "../components/CertifierList";
import { admins } from "../database.js";

function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (admins.length > 0) {
      setCurrentUser(admins[0]); // Imposta il primo admin come default
    }
  }, []);

  if (!currentUser) return <div className="p-8">Caricamento admin...</div>;

  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard Admin</h1>

        <UserSwitcher
          currentUser={currentUser}
          onChangeUser={setCurrentUser}
          filter="all"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WhitelistRequestForm currentUser={currentUser} />
          <CertifierList currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;