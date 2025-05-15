
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface WelcomeStepProps {
  onNext: () => void;
}

const WelcomeStep = ({ onNext }: WelcomeStepProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center mb-4">
        <MessageSquare className="h-8 w-8 text-blue-600 mr-2" />
        <h3 className="text-xl font-medium">About Frits</h3>
      </div>
      
      <div className="space-y-3 text-sm">
        <p>
          Welcome to Frits - Your AI Readiness assessor
        </p>
        <p>
          Frits is your personal assistant for assessing how prepared your organization is for using AI. In just 20 minutes, he helps you:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Identify opportunities for AI adoption</li>
          <li>Spot gaps or challenges in your current approach</li>
          <li>Understand next steps, tailored to your experience level</li>
        </ul>
        <p className="font-medium mt-2">
          What to expect:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Frits asks short, easy-to-follow questions</li>
          <li>He adapts to your knowledge – no AI background needed</li>
          <li>Just type your goal or question to begin</li>
        </ul>
        <p className="font-medium mt-2">
          Good to know:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>First response may take up to 2 minutes</li>
          <li>After that, replies arrive in about 20 seconds</li>
          <li>Frits knows his role well – feel free to ask anything</li>
        </ul>
        <p className="font-medium mt-2">
          Start your session by simply saying what you'd like help with!
        </p>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default WelcomeStep;
