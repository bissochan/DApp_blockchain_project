import { useEffect, useState } from "react";
import ExperienceForm from "../components/ExperienceForm";
import ExperienceList from "../components/ExperienceList";
import Navbar from "../components/Navbar";
import UserSwitcher from "../components/UserSwitcher";
import { getUserCertificates, postExperience } from "../services/api";
import RequestWhitelistForm from "../components/RequestWhitelistForm";

function WorkerDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [newExperience, setNewExperience] = useState({
    companyName: "",
    role: "",
    startDate: "",
    endDate: "",
    description: "",
  });
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loadingCertificates, setLoadingCertificates] = useState(true);

  useEffect(() => {
    async function loadCertificates() {
      if (currentUser?.id) {
        try {
          console.log("Caricamento certificati per userId:", currentUser.id); // Debug
          const res = await getUserCertificates(currentUser.id);
          setCertificates(res.data || []);
        } catch (err) {
          console.error("Errore caricamento certificati:", err.response?.data); // Debug
          setError("Errore durante il caricamento dei certificati.");
        } finally {
          setLoadingCertificates(false);
        }
      }
    }
    loadCertificates();
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExperience((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!currentUser?.id) {
      setError("Seleziona un utente prima di inviare l'esperienza.");
      return;
    }

    const payload = {
      userId: currentUser.id,
      companyName: newExperience.companyName,
      role: newExperience.role,
      startDate: newExperience.startDate,
      endDate: newExperience.endDate || null,
      description: newExperience.description,
    };

    console.log("Invio esperienza:", payload); // Debug

    try {
      const response = await postExperience(payload);
      console.log("Risposta dal backend:", response.data); // Debug
      setSuccessMessage("Esperienza inviata con successo!");
      setNewExperience({
        companyName: "",
        role: "",
        startDate: "",
        endDate: "",
        description: "",
      });
    } catch (err) {
      console.error("Errore invio esperienza:", err.response?.data); // Debug
      setError(err.response?.data?.error || "Errore durante l'invio dell'esperienza.");
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-secondary">
        <Navbar />
        <div className="container mx-auto py-8">
          <UserSwitcher
            currentUser={currentUser}
            onChangeUser={setCurrentUser}
            filter="users"
          />
          <p className="text-center text-gray-600">
            Seleziona un utente per continuare.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard Lavoratore</h1>

        <UserSwitcher
          currentUser={currentUser}
          onChangeUser={setCurrentUser}
          filter="users"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form per aggiungere esperienza */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Aggiungi Esperienza</h2>
            {successMessage && <p className="text-green-600 mb-4">{successMessage}</p>}
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Nome Azienda
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={newExperience.companyName}
                  onChange={handleInputChange}
                  className="mt-1 p-2 w-full border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Ruolo
                </label>
                <input
                  type="text"
                  name="role"
                  value={newExperience.role}
                  onChange={handleInputChange}
                  className="mt-1 p-2 w-full border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Data Inizio
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={newExperience.startDate}
                  onChange={handleInputChange}
                  className="mt-1 p-2 w-full border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Data Fine (opzionale)
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={newExperience.endDate}
                  onChange={handleInputChange}
                  className="mt-1 p-2 w-full border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Descrizione
                </label>
                <textarea
                  name="description"
                  value={newExperience.description}
                  onChange={handleInputChange}
                  className="mt-1 p-2 w-full border rounded"
                  rows="4"
                ></textarea>
              </div>
              <button
                type="submit"
                className="bg-primary text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Invia Esperienza
              </button>
            </form>
          </div>

          {/* Lista certificati */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">I Miei Certificati</h2>
            {loadingCertificates ? (
              <p>Caricamento certificati...</p>
            ) : certificates.length === 0 ? (
              <p>Nessun certificato trovato.</p>
            ) : (
              <div className="space-y-4">
                {certificates.map((cert) => (
                  <div key={cert.id} className="border-b pb-2">
                    <p className="text-sm text-gray-600">
                      CID: {cert.cid}
                    </p>
                    <p className="text-sm text-gray-600">
                      Hash: {cert.certificateHash}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form per richiedere whitelist */}
          {/*<RequestWhitelistForm currentUser={currentUser} />*/}
        </div>
      </div>
    </div>
  );
}

export default WorkerDashboard;