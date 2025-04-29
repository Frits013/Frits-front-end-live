
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConsultCompleteDialogProps {
  open: boolean;
  onClose: () => void;
  onFinish: () => void;
}

const ConsultCompleteDialog = ({ open, onClose, onFinish }: ConsultCompleteDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Consult Session Complete</DialogTitle>
          <DialogDescription>
            This consult session is marked as complete in the database.
            Would you like to end the session or continue chatting?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-2">
          <Button onClick={onClose} variant="outline">
            Continue Chatting
          </Button>
          <Button onClick={onFinish} className="bg-green-600 hover:bg-green-700">
            End Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConsultCompleteDialog;
