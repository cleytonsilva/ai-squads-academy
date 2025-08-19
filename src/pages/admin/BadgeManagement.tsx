import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminBadgeManagement from '@/components/admin/AdminBadgeManagement';
import BadgeEditor from '@/components/admin/BadgeEditor';
import CertificateEditor from '@/components/admin/CertificateEditor';
import { Shield, Award } from 'lucide-react';
import DashboardLayout from '@/components/admin/DashboardLayout';

const BadgeManagement = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Badges e Certificados</h1>
          <p className="text-muted-foreground">Crie e gerencie badges e certificados para os cursos</p>
        </div>
      </div>

      <Tabs defaultValue="badges" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="badges" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Badges
          </TabsTrigger>
          <TabsTrigger value="badge-editor" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Editor de Badges
          </TabsTrigger>
          <TabsTrigger value="certificates" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Certificados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Badges</CardTitle>
              <CardDescription>
                Visualize, edite e gerencie todos os badges disponíveis na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminBadgeManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badge-editor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Editor de Badges</CardTitle>
              <CardDescription>
                Crie novos badges ou edite badges existentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BadgeEditor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Editor de Certificados</CardTitle>
              <CardDescription>
                Crie e personalize certificados para os cursos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CertificateEditor />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default BadgeManagement;