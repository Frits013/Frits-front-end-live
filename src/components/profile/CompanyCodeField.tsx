
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface CompanyCodeFieldProps {
  companyCode: string;
  isEditingCode: boolean;
  codeError?: string;
  onCodeChange: (code: string) => void;
  onEditClick: () => void;
  onCancelEdit: () => void;
  onConfirmEdit: () => void;
}

const CompanyCodeField = ({
  companyCode,
  isEditingCode,
  codeError,
  onCodeChange,
  onEditClick,
  onCancelEdit,
  onConfirmEdit,
}: CompanyCodeFieldProps) => {
  return (
    <div className="grid gap-2">
      <Label htmlFor="companyCode">Company Code</Label>
      {isEditingCode ? (
        <div className="space-y-2">
          <Input
            id="companyCode"
            value={companyCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 8);
              onCodeChange(value);
            }}
            className="w-full font-mono"
            placeholder="Enter 8-digit company code"
            maxLength={8}
            inputMode="numeric"
          />
          {codeError && (
            <p className="text-sm text-destructive">{codeError}</p>
          )}
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCancelEdit}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={onConfirmEdit}
            >
              Confirm
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <Input
            id="companyCode"
            value={companyCode}
            disabled
            className="w-full font-mono bg-muted"
          />
          <Button 
            variant="outline" 
            onClick={onEditClick}
          >
            Edit
          </Button>
        </div>
      )}
    </div>
  );
};

export default CompanyCodeField;
