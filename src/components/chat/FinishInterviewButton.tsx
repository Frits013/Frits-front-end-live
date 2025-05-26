
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface FinishInterviewButtonProps {
  onFinish: () => void;
  show: boolean;
}

const FinishInterviewButton = ({ onFinish, show }: FinishInterviewButtonProps) => {
  if (!show) return null;

  return (
    <div className="sticky bottom-[120px] mx-4 mb-2 z-10">
      <div className="relative">
        {/* Button glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl blur-lg opacity-25 group-hover:opacity-40 transition duration-300"></div>
        
        <Button 
          onClick={onFinish}
          className="relative w-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 text-white flex items-center justify-center gap-3 py-4 rounded-xl shadow-lg hover:shadow-green-500/30 transition-all duration-300 transform hover:scale-[1.02] border border-green-400/20"
        >
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">Finish Interview</span>
        </Button>
      </div>
    </div>
  );
};

export default FinishInterviewButton;
