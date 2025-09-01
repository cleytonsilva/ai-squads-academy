import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Construction, 
  Calendar, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  Target,
  Brain,
  BarChart3
} from 'lucide-react';
import DashboardLayout from '@/components/admin/DashboardLayout';

const AdminSimulados = () => {
  const roadmapItems = [
    {
      title: "Sistema de Criação de Simulados",
      description: "Interface para criar e configurar simulados personalizados",
      status: "planned",
      estimatedDate: "Q2 2024"
    },
    {
      title: "Banco de Questões",
      description: "Repositório centralizado de questões categorizadas por tema",
      status: "planned",
      estimatedDate: "Q2 2024"
    },
    {
      title: "Relatórios de Performance",
      description: "Analytics detalhados sobre desempenho dos alunos",
      status: "planned",
      estimatedDate: "Q3 2024"
    },
    {
      title: "Simulados Adaptativos",
      description: "IA para ajustar dificuldade baseada no desempenho",
      status: "planned",
      estimatedDate: "Q3 2024"
    },
    {
      title: "Integração com Certificações",
      description: "Conexão automática com sistema de badges e certificados",
      status: "planned",
      estimatedDate: "Q4 2024"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Target className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Concluído</Badge>;
      case 'in-progress':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Em Andamento</Badge>;
      default:
        return <Badge variant="secondary">Planejado</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Simulados</h1>
            <p className="text-muted-foreground">Sistema de simulados e avaliações em desenvolvimento</p>
          </div>
        </div>

        {/* Status Card */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Construction className="h-6 w-6 text-orange-600" />
              <div>
                <CardTitle className="text-orange-800">Funcionalidade em Construção</CardTitle>
                <CardDescription className="text-orange-700">
                  Estamos desenvolvendo um sistema completo de simulados para aprimorar a experiência de aprendizado
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                <Brain className="h-8 w-8 text-blue-500" />
                <div>
                  <h3 className="font-semibold">IA Integrada</h3>
                  <p className="text-sm text-muted-foreground">Simulados adaptativos com inteligência artificial</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                <BarChart3 className="h-8 w-8 text-green-500" />
                <div>
                  <h3 className="font-semibold">Analytics Avançados</h3>
                  <p className="text-sm text-muted-foreground">Relatórios detalhados de performance</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                <Target className="h-8 w-8 text-purple-500" />
                <div>
                  <h3 className="font-semibold">Personalização</h3>
                  <p className="text-sm text-muted-foreground">Simulados customizáveis por área</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roadmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Roadmap de Desenvolvimento
            </CardTitle>
            <CardDescription>
              Cronograma planejado para implementação das funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roadmapItems.map((item, index) => (
                <div key={index} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(item.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{item.title}</h3>
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Previsão: {item.estimatedDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feedback Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Feedback e Sugestões
            </CardTitle>
            <CardDescription>
              Sua opinião é importante para o desenvolvimento desta funcionalidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                Tem ideias ou sugestões para o sistema de simulados? Queremos ouvir você!
              </p>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => {
                  // Aqui pode ser implementada a lógica para abrir um modal de feedback
                  // ou redirecionar para um formulário de sugestões
                  alert('Funcionalidade de feedback será implementada em breve!');
                }}
              >
                <MessageSquare className="h-4 w-4" />
                Enviar Feedback
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Launch Estimate */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-800">Lançamento Estimado</h3>
              </div>
              <p className="text-2xl font-bold text-green-700 mb-1">Q2 2024</p>
              <p className="text-sm text-green-600">
                Primeira versão do sistema de simulados com funcionalidades básicas
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminSimulados;