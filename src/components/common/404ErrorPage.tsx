import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { useView } from "@/contexts/viewContext";

const ErrorPage = () => {
  const navigate = useNavigate();
  const { currentView } = useView(); // 🔹 Detect current dashboard (admin/client)

  const handleGoHome = () => {
    // 🔹 Navigate dynamically based on current view
    if (currentView === "admin") {
      navigate("/");
    } else {
      navigate("/client");
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen text-center px-4">
      <h1 className="text-4xl font-bold mb-2">404 | Page Not Found</h1>
      <p className="text-muted-foreground mb-6">
        The page you requested does not exist or has been moved.
      </p>

      <div className="flex gap-3">
        <Button variant="outline" onClick={handleGoBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
        <Button onClick={handleGoHome}>
          <Home className="mr-2 h-4 w-4" />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default ErrorPage;
