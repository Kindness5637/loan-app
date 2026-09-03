import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

const ErrorPage = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen">
        <div className="flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold">404 | Page Not Found</h1>
        <p className="text-muted-foreground">The page you requested does not exist or has been moved.</p>

        <div className="flex gap-2 mt-4">
        <Button variant="link" onClick={handleGoBack}> <ArrowLeft /> Go Back</Button>
        <Button variant="link" onClick={handleGoHome}> <Home /> Go to Dashboard</Button></div>
        </div>

    </div>
  );
};

export default ErrorPage;