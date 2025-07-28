
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { sanitizeCompanyCode } from "@/lib/input-validation";

interface CompanyCodeFieldProps {
  companyCode: string;
  isEditingCode: boolean;
  codeError?: string;
  onCodeChange: (code: string) => void;
  onEditClick: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
}

const CompanyCodeField = ({
  companyCode,
  isEditingCode,
  codeError,
  onCodeChange,
  onEditClick,
  onCancelEdit,
  onSaveEdit,
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
              const sanitized = sanitizeCompanyCode(e.target.value);
              onCodeChange(sanitized);
            }}
            className="w-full font-mono"
            placeholder="Enter 8-digit company code"
            maxLength={8}
            inputMode="numeric"
            autoComplete="off"
            spellCheck="false"
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
              onClick={onSaveEdit}
            >
              Save
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
