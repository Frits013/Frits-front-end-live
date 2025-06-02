
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, FileJson, FileSpreadsheet, Users, Calendar } from 'lucide-react';
import { useCompanyInfoMessages, CompanyInfoMessage } from '@/hooks/use-company-info-messages';
import { exportToJSON, exportToCSV } from '@/utils/export-utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const CompanyDataExport = () => {
  const { loading, companies, infoMessages, fetchCompanies, fetchInfoMessagesByCompany } = useCompanyInfoMessages();
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCompanySelect = (companyId: string) => {
    setSelectedCompany(companyId);
    const company = companies.find(c => c.company_id === companyId);
    setSelectedCompanyName(company?.company_name || `Company ${company?.code}`);
    fetchInfoMessagesByCompany(companyId);
  };

  const handleExportJSON = () => {
    if (infoMessages.length === 0) return;
    const filename = `company-info-messages-${selectedCompanyName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}`;
    exportToJSON(infoMessages, filename);
  };

  const handleExportCSV = () => {
    if (infoMessages.length === 0) return;
    const filename = `company-info-messages-${selectedCompanyName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}`;
    exportToCSV(infoMessages, filename);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatContentDict = (contentDict: any) => {
    if (!contentDict) return 'N/A';
    return JSON.stringify(contentDict, null, 2);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Company Info Messages Export
          </CardTitle>
          <CardDescription>
            Select a company to view and download their info messages with category "company"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedCompany} onValueChange={handleCompanySelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a company..." />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.company_id} value={company.company_id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{company.company_name || `Company ${company.code}`}</span>
                        <Badge variant="secondary" className="ml-2">
                          <Users className="h-3 w-3 mr-1" />
                          {company.user_count} users
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedCompany && infoMessages.length > 0 && (
              <div className="flex gap-2">
                <Button onClick={handleExportJSON} variant="outline" size="sm">
                  <FileJson className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
                <Button onClick={handleExportCSV} variant="outline" size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            )}
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" text="Loading data..." />
            </div>
          )}

          {selectedCompany && !loading && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Info Messages for {selectedCompanyName}
                </CardTitle>
                <CardDescription className="flex items-center gap-4">
                  <span>Total messages: {infoMessages.length}</span>
                  {infoMessages.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Latest: {formatDate(infoMessages[0].created_at)}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {infoMessages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No info messages found for this company
                  </div>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Info ID</TableHead>
                          <TableHead>User ID</TableHead>
                          <TableHead>Content String</TableHead>
                          <TableHead>Content Dict</TableHead>
                          <TableHead>Created At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {infoMessages.map((message) => (
                          <TableRow key={message.info_id}>
                            <TableCell className="font-mono text-xs">
                              {message.info_id.substring(0, 8)}...
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {message.user_id.substring(0, 8)}...
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {message.content_str || 'N/A'}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <pre className="text-xs overflow-auto max-h-20">
                                {formatContentDict(message.content_dict)}
                              </pre>
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(message.created_at)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyDataExport;
