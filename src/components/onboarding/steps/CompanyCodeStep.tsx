
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CompanyCodeStepProps {
  companyCode: string;
  onCompanyCodeChange: (code: string) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const CompanyCodeStep = ({ 
  companyCode, 
  onCompanyCodeChange, 
  onNext, 
  onPrevious 
}: CompanyCodeStepProps) => {
  return (
    <div className="space-y-2">
      <div>
        <h3 className="text-xl font-semibold mb-2">Company Code</h3>
        <p className="text-sm text-muted-foreground mb-4">
          If you have an 8-digit company code, enter it below. Otherwise, you can skip this step.
        </p>
        <Input
          placeholder="Enter 8-digit company code"
          value={companyCode}
          onChange={(e) => {
            // Only allow numeric input with max 8 digits
            const value = e.target.value.replace(/\D/g, '').slice(0, 8);
            onCompanyCodeChange(value);
          }}
          className="font-mono"
          maxLength={8}
          inputMode="numeric"
        />
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={onNext}>
          {companyCode.length > 0 ? "Next" : "Skip"}
        </Button>
      </div>
    </div>
  );
};

export default CompanyCodeStep;
