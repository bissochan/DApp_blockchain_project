import Navbar from "../components/navbar";
import ExperienceForm from "../components/ExperienceForm";
import ExperienceList from "../components/ExperienceList";

function WorkerDashboard() {
  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard Lavoratore</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ExperienceForm />
          <ExperienceList />
        </div>
      </div>
    </div>
  );
}

export default WorkerDashboard;