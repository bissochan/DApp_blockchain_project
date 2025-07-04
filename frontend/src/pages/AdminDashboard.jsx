import { useState } from "react";
import CertifierList from "../components/CertifierList";
import Navbar from "../components/Navbar";
import RequestWhitelistForm from "../components/RequestWhitelistForm";
import UserSwitcher from "../components/UserSwitcher";

function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState({
    id: "admin1",
    username: "admin",
    role: "admin",
  });

  if (!currentUser) return <div className="p-8">Loading admin...</div>;
  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Admin's Dashboard</h1>

        <UserSwitcher
          currentUser={currentUser}
          onChangeUser={setCurrentUser}
          filter="all"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RequestWhitelistForm currentUser={currentUser} />
          <CertifierList currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
