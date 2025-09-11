import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
interface WelcomeStepProps {
  onNext: () => void;
}
const WelcomeStep = ({
  onNext
}: WelcomeStepProps) => {
  return <div className="space-y-4">
      <div className="flex items-center justify-center mb-4">
        <MessageSquare className="h-8 w-8 text-blue-600 mr-2" />
        <h3 className="text-xl font-medium">About Frits</h3>
      </div>
      
      <div className="space-y-3 text-sm">
        <p>Frits is a digital AI Interviewer created to support data-driven assessments.</p>
        
        <p className="font-medium mt-2">
          What to expect:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Frits asks short, easy-to-follow questions</li>
          <li>You reply however you want, that's it</li>
        </ul>
        <p className="font-medium mt-2">
          Good to know:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Questions can take up to 30 seconds to load sometimes</li>
          <li>Frits knows his role and is adaptable so feel free to ask anything! 
(Example: kan je dit interview in het Nederlands doen?)</li>
        </ul>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={onNext}>
          Next
        </Button>
      </div>
    </div>;
};
export default WelcomeStep;