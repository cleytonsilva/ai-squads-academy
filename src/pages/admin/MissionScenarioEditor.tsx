import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// Types based on the new DB schema
interface Mission {
  id: string;
  title: string;
}

interface MissionScenario {
  id?: string;
  mission_id: string;
  title: string;
  initial_scenario: string;
  ai_system_prompt: string;
  created_by?: string;
}

const MissionScenarioEditor = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [scenarios, setScenarios] = useState<MissionScenario[]>([]);
  const [selectedMission, setSelectedMission] = useState<string>('');
  const [editingScenario, setEditingScenario] = useState<MissionScenario | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<Omit<MissionScenario, 'id' | 'created_by'>>({
    mission_id: '',
    title: '',
    initial_scenario: '',
    ai_system_prompt: `Você é um mestre de jogo (GM) em um RPG de texto. Seu objetivo é guiar o aluno por um cenário de aprendizado interativo.
Regras:
1. Apresente desafios realistas baseados no cenário.
2. Avalie as respostas do aluno de forma justa.
3. Sua resposta DEVE ser um JSON com a seguinte estrutura: {"evaluation": "correct" | "partial" | "incorrect", "reason": "sua justificativa", "response": "sua resposta narrativa para o aluno", "xp_change": valor}.
4. Seja criativo e mantenha o engajamento.`
  });

  useEffect(() => {
    const fetchMissions = async () => {
      const { data, error } = await supabase.from('missions').select('id, title');
      if (error) {
        toast.error('Failed to fetch missions');
        console.error(error);
      } else {
        setMissions(data);
      }
    };
    fetchMissions();
  }, []);

  useEffect(() => {
    if (selectedMission) {
      fetchScenarios(selectedMission);
    } else {
      setScenarios([]);
    }
  }, [selectedMission]);

  const fetchScenarios = async (missionId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('mission_scenarios')
      .select('*')
      .eq('mission_id', missionId);

    if (error) {
      toast.error('Failed to fetch scenarios');
      console.error(error);
    } else {
      setScenarios(data);
    }
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const resetForm = () => {
    setEditingScenario(null);
    setFormData({
      mission_id: selectedMission,
      title: '',
      initial_scenario: '',
      ai_system_prompt: `Você é um mestre de jogo (GM) em um RPG de texto. Seu objetivo é guiar o aluno por um cenário de aprendizado interativo.
Regras:
1. Apresente desafios realistas baseados no cenário.
2. Avalie as respostas do aluno de forma justa.
3. Sua resposta DEVE ser um JSON com a seguinte estrutura: {"evaluation": "correct" | "partial" | "incorrect", "reason": "sua justificativa", "response": "sua resposta narrativa para o aluno", "xp_change": valor}.
4. Seja criativo e mantenha o engajamento.`
    });
  };

  const handleSave = async () => {
    if (!selectedMission || !formData.title) {
      return toast.error('Mission and Title are required.');
    }

    setIsSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user?.id).single();

    const dataToSave = {
      ...formData,
      mission_id: selectedMission,
      created_by: profile?.id,
    };

    let error;
    if (editingScenario) {
      ({ error } = await supabase.from('mission_scenarios').update(dataToSave).eq('id', editingScenario.id));
    } else {
      ({ error } = await supabase.from('mission_scenarios').insert(dataToSave));
    }

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Scenario ${editingScenario ? 'updated' : 'created'} successfully!`);
      resetForm();
      fetchScenarios(selectedMission);
    }
    setIsSaving(false);
  };

  const handleEdit = (scenario: MissionScenario) => {
    setSelectedMission(scenario.mission_id);
    setEditingScenario(scenario);
    setFormData({
        mission_id: scenario.mission_id,
        title: scenario.title,
        initial_scenario: scenario.initial_scenario,
        ai_system_prompt: scenario.ai_system_prompt
    })
  }

  const handleDelete = async (scenarioId?: string) => {
    if(!scenarioId || !confirm('Are you sure?')) return;

    const { error } = await supabase.from('mission_scenarios').delete().eq('id', scenarioId);
    if(error) {
        toast.error(error.message)
    } else {
        toast.success('Scenario deleted!');
        fetchScenarios(selectedMission);
    }
  }

  return (
    <div className="p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Mission Scenario Editor</CardTitle>
          <CardDescription>Create and manage interactive RPG scenarios for missions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="mission-select">Select Mission</Label>
            <Select value={selectedMission} onValueChange={setSelectedMission}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a mission..." />
              </SelectTrigger>
              <SelectContent>
                {missions.map(mission => (
                  <SelectItem key={mission.id} value={mission.id}>{mission.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMission && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold">{editingScenario ? 'Edit Scenario' : 'Create New Scenario'}</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Scenario Title</Label>
                  <Input id="title" value={formData.title} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="initial_scenario">Initial Scenario (What the user sees first)</Label>
                  <Textarea id="initial_scenario" value={formData.initial_scenario} onChange={handleInputChange} rows={5} />
                </div>
                <div>
                  <Label htmlFor="ai_system_prompt">AI System Prompt (Instructions for the GM)</Label>
                  <Textarea id="ai_system_prompt" value={formData.ai_system_prompt} onChange={handleInputChange} rows={8} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span className="ml-2">{editingScenario ? 'Update' : 'Save'}</span>
                  </Button>
                  {editingScenario && <Button variant="outline" onClick={resetForm}>Cancel</Button>}
                </div>
              </div>
            </div>
          )}

          {isLoading && <Loader2 className="w-8 h-8 animate-spin" />}

          {scenarios.length > 0 && (
            <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold">Existing Scenarios</h3>
                <div className="space-y-2">
                    {scenarios.map(scenario => (
                        <Card key={scenario.id} className="p-4 flex justify-between items-center">
                            <span>{scenario.title}</span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(scenario)}>Edit</Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(scenario.id)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MissionScenarioEditor;
