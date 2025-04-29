
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface ChatErrorAlertProps {
  errorMessage: string | null;
}

const ChatErrorAlert = ({ errorMessage }: ChatErrorAlertProps) => {
  if (!errorMessage) return null;
  
  return (
    <Alert variant="destructive" className="mx-4 mt-4">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{errorMessage}</AlertDescription>
    </Alert>
  );
};

export default ChatErrorAlert;
