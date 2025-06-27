import { useEffect, useState } from "react";
import { getAllRequestExperiences, postExperienceCertification } from "../services/api";

function CertificationForm() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await getAllRequestExperiences();
        setRequests(response.data);
      } catch (err) {
        setError("Errore durante il caricamento delle richieste.");
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const handleCertify = async (id, isApproved) => {
    try {
      await postExperienceCertification({ id, isApproved });
      setRequests(requests.filter((req) => req.id !== id));
    } catch (err) {
      setError("Errore durante la certificazione.");
    }
  };

  if (loading) return <p>Caricamento...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Richieste di Certificazione</h2>
      {requests.length === 0 ? (
        <p>Nessuna richiesta trovata.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="border-b pb-2 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">CV certification required by: {req.username}</h3>
                <p>{req.company}</p>
                <p>{req.role}</p>
                <p className="text-gray-600">{req.startDate} - {req.endDate}</p>
                <p className="text-gray-600">{req.description}</p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => handleCertify(req.id, true)}
                  className="bg-green-600 text-white px-2 py-1 rounded"
                >
                  Approva
                </button>
                <button
                  onClick={() => handleCertify(req.id, false)}
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