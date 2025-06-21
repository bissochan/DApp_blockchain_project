import { useState, useEffect } from "react";
import { getAllExperiences } from "../services/api";

function ExperienceList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExperiences = async () => {
      try {
        const response = await getAllExperiences();
        setData(response.data);
      } catch (err) {
        setError("Errore durante il caricamento delle esperienze.");
      } finally {
        setLoading(false);
      }
    };
    fetchExperiences();
  }, []);

  if (loading) return <p>Caricamento...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Le Tue Esperienze</h2>
      {data.length === 0 ? (
        <p>Nessuna esperienza trovata.</p>
      ) : (
        <div className="space-y-4">
          {data.map((exp, index) => (
            <div key={index} className="border-b pb-2">
              <h3 className="font-semibold">{exp.company}</h3>
              <p>{exp.role}</p>
              <p className="text-gray-600">
                {exp.startDate} - {exp.endDate || "In corso"}
              </p>
              <p className="text-sm text-gray-500">{exp.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExperienceList;