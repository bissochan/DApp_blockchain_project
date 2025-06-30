import Navbar from "../components/Navbar";

function Home() {
  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />
      <div className="container mx-auto py-12">
        <h1 className="text-4xl font-bold text-center mb-4">Smart CV Platform</h1>
        <p className="text-lg text-center mb-6">
          Una piattaforma per certificare e verificare esperienze lavorative tramite blockchain.
        </p>
        <div className="flex justify-center space-x-4">
          <a
            href="/worker"
            className="bg-primary text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Lavoratore
          </a>
          <a
            href="/certifier"
            className="bg-primary text-white px-6 py-2 rounded hover-bg-blue-700"
          >
            Certificatore
          </a>
          <a
            href="/verifier"
            className="bg-primary text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Verificatore
          </a>
        </div>
      </div>
    </div>
  );
}

export default Home;