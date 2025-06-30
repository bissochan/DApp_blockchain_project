import { useEffect, useState } from "react";
import { getMyRequestExperiences, postExperienceCertification } from "../services/api";

function CertificationForm({ currentUser }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await getMyRequestExperiences(currentUser.id);
        setRequests(response.data);
      } catch (err) {
        const message = err.response?.data?.error;
        if (message === "Company approval is still pending") {
          setError("La tua richiesta di registrazione come azienda è ancora in attesa.");
        } else if (message === "Company registration was rejected") {
          setError("La tua richiesta di registrazione come azienda è stata rifiutata.");
        } else {
          setError("Errore durante il caricamento delle richieste.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.id) fetchRequests();
  }, [currentUser?.id]);

  const handleCertify = async (id, isApproved) => {
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await postExperienceCertification({
        claimId: id,
        companyUsername: currentUser.username,
        isApproved
      });
      setRequests(requests.filter((req) => req.claimId !== id));

      if (isApproved) {
        setSuccessMessage("Certificato approvato e salvato con successo.");
      } else {
        setSuccessMessage("Richiesta rifiutata correttamente.");
      }
    } catch (err) {
      setError("Errore durante la certificazione.");
    }
  };


  if (loading) return <p>Caricamento...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Richieste di Certificazione</h2>

      {successMessage && <p className="text-green-600">{successMessage}</p>}

      {requests.length === 0 ? (
        <p>Nessuna richiesta trovata.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.claimId} className="border-b pb-2 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">
                  CV certification required by userId: {req.claim.userId}
                </h3>
                <p>Company ID: {req.claim.companyId}</p>
                <p>Ruolo: {req.claim.role}</p>
                <p className="text-gray-600">
                  {req.claim.startDate} - {req.claim.endDate || "In corso"}
                </p>
                <p className="text-gray-600">{req.claim.description}</p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => handleCertify(req.claimId, true)}
                  className="bg-green-600 text-white px-2 py-1 rounded"
                >
                  Approva
                </button>
                <button
                  onClick={() => handleCertify(req.claimId, false)}
                  className="bg-red-600 text-white px-2 py-1 rounded"
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

export default CertificationForm;
