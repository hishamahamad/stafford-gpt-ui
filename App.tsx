import { useState } from 'react';
import { UploadCloud, FileText, MessageCircle, Menu } from 'lucide-react';
import { Button } from './components/ui/button';
import { Separator } from './components/ui/separator';
import { DocumentUpload } from './components/DocumentUpload';
import { DocumentManagement } from './components/DocumentManagement';
import { ChatInterface } from './components/ChatInterface';

type TabType = 'upload' | 'documents' | 'chat';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { id: 'chat', name: 'Chat Assistant', icon: MessageCircle },
    { id: 'upload', name: 'Upload Documents', icon: UploadCloud },
    { id: 'documents', name: 'Manage Documents', icon: FileText },
  ] as const;

  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <div className="space-y-6">
            <div>
              <h1>Chat Assistant</h1>
              <p className="text-muted-foreground">
                Choose between Customer mode (public website content) or Internal mode (includes confidential business data).
              </p>
            </div>
            <ChatInterface />
          </div>
        );
      case 'upload':
        return (
          <div className="space-y-6">
            <div>
              <h1>Upload Documents</h1>
              <p className="text-muted-foreground">
                Add new documents to your RAG pipeline for processing and indexing.
              </p>
            </div>
            <DocumentUpload />
          </div>
        );
      case 'documents':
        return (
          <div className="space-y-6">
            <div>
              <h1>Document Management</h1>
              <p className="text-muted-foreground">
                View, manage, and monitor all documents in your RAG pipeline.
              </p>
            </div>
            <DocumentManagement />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 border-r bg-card`}>
        <div className="flex items-center justify-between p-4">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">RAG Dashboard</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        <nav className="p-4 space-y-2">
          {navigation.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              className={`w-full justify-start ${!sidebarOpen && 'p-2'}`}
              onClick={() => setActiveTab(item.id as TabType)}
            >
              <item.icon className={`h-4 w-4 ${sidebarOpen ? 'mr-2' : ''}`} />
              {sidebarOpen && item.name}
            </Button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
