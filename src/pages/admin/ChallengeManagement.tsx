import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChallengeManagement from '@/components/admin/ChallengeManagement';
import { Target, Trophy, Users } from 'lucide-react';
import DashboardLayout from '@/components/admin/DashboardLayout';

const AdminChallengeManagement = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Target className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Desafios</h1>
          <p className="text-muted-foreground">Crie e gerencie desafios para engajar os alunos</p>
        </div>
      </div>

      <Tabs defaultValue="challenges" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Desafios
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Ranking
          </TabsTrigger>
          <TabsTrigger value="participants" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Participantes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="challenges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Desafios</CardTitle>
              <CardDescription>
                Crie, edite e gerencie desafios para motivar os alunos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChallengeManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ranking dos Desafios</CardTitle>
              <CardDescription>
                Visualize o desempenho dos alunos nos desafios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Funcionalidade de ranking em desenvolvimento
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Participantes dos Desafios</CardTitle>
              <CardDescription>
                Gerencie a participação dos alunos nos desafios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Funcionalidade de gerenciamento de participantes em desenvolvimento
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminChallengeManagement;