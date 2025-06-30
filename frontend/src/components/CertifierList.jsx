import { useEffect, useState } from "react";
import { fetchCompanies, removeCertifier } from "../services/api";

function CertifierList({ currentUser }) {
  const [certifiers, setCertifiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchCertifiers = async () => {
      try {
        const response = await fetchCompanies();
        setCertifiers(response.data.filter((c) => c.approvalStatus === "approved"));
      } catch (err) {
        setError("Errore durante il caricamento dei certificatori.");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.role === "admin") fetchCertifiers();
  }, [currentUser]);

  const handleRemove = async (username) => {
    setError(null);
    setSuccessMessage(null);
    try {
      await removeCertifier({ username });
      setCertifiers(certifiers.filter((c) => c.username !== username));
      setSuccessMessage(`Certificatore ${username} rimosso con successo.`);
    } catch (err) {
      setError("Errore durante la rimozione del certificatore.");
    }
  };

  if (currentUser?.role !== "admin") {
    return <p className="text-red-500 p-6">Accesso non autorizzato.</p>;
  }

  if (loading) return <p className="p-6">Caricamento...</p>;
  if (error) return <p className="text-red-500 p-6">{error}</p>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Elenco Certificatori</h2>
      {successMessage && <p className="text-green-600 mb-4">{successMessage}</p>}
      {certifiers.length === 0 ? (
        <p>Nessun certificatore trovato.</p>
      ) : (
        <div className="space-y-4">
          {certifiers.map((certifier) => (
            <div
              key={certifier.id}
              className="border-b pb-2 flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold">{certifier.username}</h3>
                <p className="text-sm text-gray-600">
                  Wallet: {certifier.walletAddress}
                </p>
              </div>
              <button
                onClick={() => handleRemove(certifier.username)}
                className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
              >
                Rimuovi
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CertifierList;