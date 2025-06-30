import { useEffect, useState } from "react";
import { approveWhitelistRequest, getPendingWhitelistRequests, rejectWhitelistRequest } from "../services/api";

function WhitelistRequestForm({ currentUser }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await getPendingWhitelistRequests();
        setRequests(response.data);
      } catch (err) {
        setError("Errore durante il caricamento delle richieste.");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.role === "admin") fetchRequests();
  }, [currentUser]);

  const handleRequest = async (requestId, isApproved) => {
    setError(null);
    setSuccessMessage(null);
    setProcessingId(requestId);
    try {
      const response = isApproved
        ? await approveWhitelistRequest({ requestId })
        : await rejectWhitelistRequest({ requestId });
      setRequests(requests.filter((req) => req.requestId !== requestId));
      setSuccessMessage(
        isApproved
          ? "Richiesta approvata con successo."
          : "Richiesta rifiutata correttamente."
      );
    } catch (err) {
      setError("Errore durante l'elaborazione della richiesta.");
    } finally {
      setProcessingId(null);
    }
  };

  if (currentUser?.role !== "admin") {
    return <p className="text-red-500 p-6">Accesso non autorizzato.</p>;
  }

  if (loading) return <p className="p-6">Caricamento...</p>;
  if (error) return <p className="text-red-500 p-6">{error}</p>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Richieste di Whitelist</h2>
      {successMessage && <p className="text-green-600 mb-4">{successMessage}</p>}
      {requests.length === 0 ? (
        <p>Nessuna richiesta trovata.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.requestId}
              className="border-b pb-2 flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold">Utente: {req.username}</h3>
                <p className="text-sm text-gray-600">
                  Wallet: {req.walletAddress}
                </p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => handleRequest(req.requestId, true)}
                  className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                >
                  Approva
                </button>
                <button
                  onClick={() => handleRequest(req.requestId, false)}
                  className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                >
                  Rifiuta
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WhitelistRequestForm;