import { useState, useEffect } from 'react';
import { Search, MoreHorizontal, Eye, Trash2, Globe, Database, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Alert, AlertDescription } from './ui/alert';

interface Document {
  chunks_count: number;
  id: number;
  source: string;
  doc_type: string;
  namespace: string;
  created_at: string;
  content_preview: string;
}

interface ApiResponse {
  documents: Document[];
  total: number;
  limit: number;
  offset: number;
}

export function DocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Fetch documents from API
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:8000/documents');

      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      setDocuments(data.documents);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  // Fetch documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Filter documents based on search term and filters
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.content_preview.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.doc_type === typeFilter;
    const matchesNamespace = statusFilter === 'all' || doc.namespace === statusFilter;

    return matchesSearch && matchesType && matchesNamespace;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDocumentTypeIcon = (docType: string) => {
    switch (docType) {
      case 'web':
        return <Globe className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getNamespaceBadgeVariant = (namespace: string) => {
    switch (namespace) {
      case 'customer':
        return 'default';
      case 'internal':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Management</CardTitle>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Name</TableHead>
              <TableHead>Namespace</TableHead>
              <TableHead>Doc Type</TableHead>
              <TableHead>Chunks</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell style={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <div>
                    <p className="font-medium">{doc.source}</p>
                    <p className="text-sm text-muted-foreground capitalize">{doc.content_preview}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getNamespaceBadgeVariant(doc.namespace)}>
                    {doc.namespace.charAt(0).toUpperCase() + doc.namespace.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  <span className="inline-flex items-center gap-1">
                    {getDocumentTypeIcon(doc.doc_type)}
                    {doc.doc_type}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{doc.chunks_count}</TableCell>
                <TableCell className="text-sm">
                  {formatDate(doc.created_at)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => { /* handleDelete(doc.id) */ }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredDocuments.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No documents found matching your criteria.</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading documents...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
