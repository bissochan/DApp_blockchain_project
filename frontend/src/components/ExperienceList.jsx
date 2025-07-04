import { useEffect, useState } from "react";
import { getUserCertificates } from "../services/api";

function ExperienceList({ currentUser }) {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchExperiences = async () => {
      try {
        const response = await getUserCertificates(currentUser.id);
        setCerts(response.data);
      } catch (err) {
        setError("Errore durante il caricamento delle esperienze.");
      } finally {
        setLoading(false);
      }
    };
    fetchExperiences();
  }, [currentUser]);

  if (loading) return <p>Caricamento...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">
        Le Tue Esperienze Certificate
      </h2>
      {certs.length === 0 ? (
        <p>Nessuna esperienza trovata.</p>
      ) : (
        <div className="space-y-4">
          {certs.map((exp) => (
            <div key={exp.certificateHash} className="border-b pb-2">
              <p className="text-sm text-gray-700">
                <span className="font-medium">CID:</span> {exp.cid}
              </p>
              <p className="text-sm text-gray-700 break-all">
                <span className="font-medium">Hash:</span> {exp.certificateHash}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExperienceList;
