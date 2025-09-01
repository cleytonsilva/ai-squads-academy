import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, Users, Shield, AlertTriangle, BookOpen, CreditCard } from "lucide-react";

/**
 * Página de Termos de Uso da Esquads
 * Termos específicos para plataforma educacional de cibersegurança
 */
export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Termos de Uso | Esquads</title>
        <meta name="description" content="Termos de Uso da Esquads - Condições para utilização da plataforma educacional de cibersegurança." />
        <link rel="canonical" href={`${window.location.origin}/terms-of-service`} />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Termos de Uso</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Estes Termos de Uso estabelecem as condições para utilização da plataforma educacional Esquads,
            especializada em cibersegurança e tecnologia.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div className="space-y-6">
          {/* Seção 1: Aceitação dos Termos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">1. Aceitação dos Termos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Ao acessar e utilizar a plataforma Esquads, você concorda em cumprir e estar vinculado a estes
                Termos de Uso. Se você não concordar com qualquer parte destes termos, não deve utilizar nossos serviços.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Importante:</h4>
                <ul className="text-blue-800 space-y-1 text-sm">
                  <li>• Estes termos constituem um acordo legal entre você e a Esquads</li>
                  <li>• O uso continuado da plataforma implica aceitação de eventuais atualizações</li>
                  <li>• Usuários menores de 18 anos devem ter autorização dos responsáveis legais</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Seção 2: Descrição dos Serviços */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">2. Descrição dos Serviços</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                A Esquads é uma plataforma educacional online que oferece cursos, treinamentos e recursos
                relacionados à cibersegurança, tecnologia e áreas correlatas.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-2">Serviços Educacionais:</h4>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• Cursos online de cibersegurança</li>
                    <li>• Laboratórios práticos e simulações</li>
                    <li>• Avaliações e certificações</li>
                    <li>• Conteúdo didático especializado</li>
                    <li>• Acompanhamento de progresso</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Users className="w-6 h-6 text-green-600 mb-2" />
                  <h4 className="font-semibold text-gray-900 mb-2">Recursos da Comunidade:</h4>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• Fóruns de discussão</li>
                    <li>• Rankings e gamificação</li>
                    <li>• Networking profissional</li>
                    <li>• Eventos e webinars</li>
                    <li>• Suporte técnico</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção 3: Cadastro e Conta do Usuário */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">3. Cadastro e Conta do Usuário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-gray-900">Requisitos para Cadastro</h4>
                  <p className="text-gray-700 text-sm">
                    Você deve fornecer informações precisas, atuais e completas durante o processo de cadastro
                    e manter essas informações atualizadas.
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-gray-900">Responsabilidade pela Conta</h4>
                  <p className="text-gray-700 text-sm">
                    Você é responsável por manter a confidencialidade de sua senha e por todas as atividades
                    que ocorram em sua conta.
                  </p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold text-gray-900">Uso Pessoal</h4>
                  <p className="text-gray-700 text-sm">
                    Sua conta é pessoal e intransferível. O compartilhamento de credenciais é proibido e pode
                    resultar no encerramento da conta.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção 4: Uso Aceitável */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">4. Política de Uso Aceitável</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Ao utilizar a plataforma Esquads, você concorda em NÃO:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <h4 className="font-semibold text-red-900 text-sm mb-1">Atividades Proibidas:</h4>
                    <ul className="text-red-800 space-y-1 text-xs">
                      <li>• Usar a plataforma para atividades ilegais</li>
                      <li>• Tentar hackear ou comprometer a segurança</li>
                      <li>• Distribuir malware ou código malicioso</li>
                      <li>• Fazer engenharia reversa do sistema</li>
                      <li>• Criar contas falsas ou múltiplas</li>
                    </ul>
                  </div>
                  <div className="bg-orange-50 p-3 rounded border border-orange-200">
                    <h4 className="font-semibold text-orange-900 text-sm mb-1">Conteúdo Inadequado:</h4>
                    <ul className="text-orange-800 space-y-1 text-xs">
                      <li>• Publicar conteúdo ofensivo ou discriminatório</li>
                      <li>• Compartilhar informações confidenciais</li>
                      <li>• Violar direitos autorais de terceiros</li>
                      <li>• Fazer spam ou propaganda não autorizada</li>
                    </ul>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-purple-50 p-3 rounded border border-purple-200">
                    <h4 className="font-semibold text-purple-900 text-sm mb-1">Uso Comercial Não Autorizado:</h4>
                    <ul className="text-purple-800 space-y-1 text-xs">
                      <li>• Revender acesso à plataforma</li>
                      <li>• Usar conteúdo para fins comerciais sem autorização</li>
                      <li>• Criar produtos concorrentes baseados em nosso conteúdo</li>
                      <li>• Extrair dados em massa (web scraping)</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <h4 className="font-semibold text-yellow-900 text-sm mb-1">Interferência no Serviço:</h4>
                    <ul className="text-yellow-800 space-y-1 text-xs">
                      <li>• Sobrecarregar nossos servidores</li>
                      <li>• Interferir na experiência de outros usuários</li>
                      <li>• Contornar medidas de segurança</li>
                      <li>• Usar bots ou automação não autorizada</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção 5: Propriedade Intelectual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">5. Propriedade Intelectual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Conteúdo da Esquads</h4>
                  <p className="text-blue-800 text-sm">
                    Todo o conteúdo da plataforma (cursos, textos, vídeos, imagens, código, etc.) é protegido por
                    direitos autorais e outras leis de propriedade intelectual. É propriedade exclusiva da Esquads
                    ou de seus licenciadores.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <h4 className="font-semibold text-green-900 text-sm mb-2">Você PODE:</h4>
                    <ul className="text-green-800 space-y-1 text-xs">
                      <li>• Acessar e visualizar o conteúdo para uso pessoal</li>
                      <li>• Fazer anotações para estudo próprio</li>
                      <li>• Compartilhar links para a plataforma</li>
                      <li>• Usar conhecimentos adquiridos profissionalmente</li>
                    </ul>
                  </div>
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <h4 className="font-semibold text-red-900 text-sm mb-2">Você NÃO PODE:</h4>
                    <ul className="text-red-800 space-y-1 text-xs">
                      <li>• Copiar, distribuir ou reproduzir o conteúdo</li>
                      <li>• Criar obras derivadas sem autorização</li>
                      <li>• Remover marcas d'água ou avisos de copyright</li>
                      <li>• Usar o conteúdo para criar cursos concorrentes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção 6: Pagamentos e Assinaturas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">6. Pagamentos e Assinaturas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <CreditCard className="w-5 h-5 text-blue-600 mb-2" />
                    <h4 className="font-semibold text-blue-900 text-sm mb-1">Planos e Preços</h4>
                    <p className="text-blue-800 text-xs">
                      Os preços estão sujeitos a alterações. Usuários ativos serão notificados com antecedência
                      sobre mudanças que afetem suas assinaturas.
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <h4 className="font-semibold text-green-900 text-sm mb-1">Renovação Automática</h4>
                    <p className="text-green-800 text-xs">
                      Assinaturas são renovadas automaticamente. Você pode cancelar a qualquer momento através
                      das configurações da conta.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-purple-50 p-3 rounded border border-purple-200">
                    <h4 className="font-semibold text-purple-900 text-sm mb-1">Política de Reembolso</h4>
                    <p className="text-purple-800 text-xs">
                      Oferecemos reembolso integral em até 7 dias após a compra, desde que o uso da plataforma
                      seja inferior a 20% do conteúdo disponível.
                    </p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded border border-orange-200">
                    <h4 className="font-semibold text-orange-900 text-sm mb-1">Impostos</h4>
                    <p className="text-orange-800 text-xs">
                      Os preços podem não incluir impostos aplicáveis. Impostos adicionais podem ser cobrados
                      conforme a legislação local.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção 7: Privacidade e Dados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">7. Privacidade e Proteção de Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                A coleta, uso e proteção de seus dados pessoais são regidos por nossa
                <a href="/privacy-policy" className="text-blue-600 hover:underline ml-1">Política de Privacidade</a>,
                que faz parte integrante destes Termos de Uso.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <Shield className="w-6 h-6 text-blue-600 mb-2" />
                <h4 className="font-semibold text-blue-900 mb-2">Compromissos de Segurança:</h4>
                <ul className="text-blue-800 space-y-1 text-sm">
                  <li>• Conformidade com a LGPD (Lei Geral de Proteção de Dados)</li>
                  <li>• Criptografia de dados sensíveis</li>
                  <li>• Controles de acesso rigorosos</li>
                  <li>• Monitoramento contínuo de segurança</li>
                  <li>• Transparência sobre uso de dados</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Seção 8: Limitações de Responsabilidade */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">8. Limitações de Responsabilidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <AlertTriangle className="w-6 h-6 text-yellow-600 mb-2" />
                <h4 className="font-semibold text-yellow-900 mb-2">Importante - Leia Atentamente:</h4>
                <p className="text-yellow-800 text-sm">
                  A Esquads fornece a plataforma educacional "como está" e não garante resultados específicos
                  de aprendizado ou sucesso profissional.
                </p>
              </div>
              <div className="space-y-3">
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold text-gray-900">Exclusões de Garantia</h4>
                  <p className="text-gray-700 text-sm">
                    Não garantimos que a plataforma será ininterrupta, livre de erros ou que atenderá a todas
                    as suas expectativas específicas.
                  </p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold text-gray-900">Limitação de Danos</h4>
                  <p className="text-gray-700 text-sm">
                    Nossa responsabilidade total não excederá o valor pago por você nos últimos 12 meses
                    pelos serviços que deram origem à reclamação.
                  </p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-gray-900">Conteúdo de Terceiros</h4>
                  <p className="text-gray-700 text-sm">
                    Não somos responsáveis por conteúdo, links ou serviços de terceiros acessíveis através
                    de nossa plataforma.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção 9: Encerramento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">9. Encerramento de Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Encerramento pelo Usuário</h4>
                  <p className="text-blue-800 text-sm mb-2">
                    Você pode encerrar sua conta a qualquer momento através das configurações da plataforma
                    ou entrando em contato conosco.
                  </p>
                  <ul className="text-blue-800 space-y-1 text-xs">
                    <li>• Acesso imediato será interrompido</li>
                    <li>• Dados serão tratados conforme Política de Privacidade</li>
                    <li>• Reembolsos conforme política aplicável</li>
                  </ul>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-900 mb-2">Encerramento pela Esquads</h4>
                  <p className="text-red-800 text-sm mb-2">
                    Podemos encerrar ou suspender sua conta em caso de violação destes termos ou por outros
                    motivos legítimos.
                  </p>
                  <ul className="text-red-800 space-y-1 text-xs">
                    <li>• Notificação prévia quando possível</li>
                    <li>• Oportunidade de correção em casos aplicáveis</li>
                    <li>• Preservação de dados conforme legislação</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção 10: Disposições Gerais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">10. Disposições Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-gray-900">Lei Aplicável</h4>
                  <p className="text-gray-700 text-sm">
                    Estes termos são regidos pelas leis brasileiras. Disputas serão resolvidas nos tribunais
                    competentes do Brasil.
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-gray-900">Alterações dos Termos</h4>
                  <p className="text-gray-700 text-sm">
                    Podemos atualizar estes termos periodicamente. Alterações significativas serão comunicadas
                    com antecedência mínima de 30 dias.
                  </p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-gray-900">Divisibilidade</h4>
                  <p className="text-gray-700 text-sm">
                    Se qualquer disposição destes termos for considerada inválida, as demais permanecerão
                    em pleno vigor e efeito.
                  </p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold text-gray-900">Acordo Integral</h4>
                  <p className="text-gray-700 text-sm">
                    Estes termos, juntamente com a Política de Privacidade, constituem o acordo integral
                    entre você e a Esquads.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção 11: Contato */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">11. Contato</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Para dúvidas sobre estes Termos de Uso ou questões relacionadas à plataforma:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Suporte Geral</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700"><strong>E-mail:</strong> contato@esquads.com.br</p>
                    <p className="text-gray-700"><strong>Telefone:</strong> +55 (11) 9999-9999</p>
                    <p className="text-gray-700"><strong>Horário:</strong> Segunda a Sexta, 9h às 18h</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Questões Legais</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700"><strong>E-mail:</strong> legal@esquads.com.br</p>
                    <p className="text-gray-700"><strong>Endereço:</strong> Rua da Tecnologia, 123</p>
                    <p className="text-gray-700">São Paulo - SP, 01234-567</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer da página */}
        <div className="mt-12 text-center">
          <div className="bg-gray-100 p-6 rounded-lg">
            <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Termos Claros e Transparentes</h3>
            <p className="text-gray-600 text-sm max-w-2xl mx-auto">
              Estes termos foram elaborados para ser claros e compreensíveis. Se você tiver dúvidas sobre
              qualquer seção, não hesite em entrar em contato conosco. Estamos aqui para ajudar você a
              aproveitar ao máximo nossa plataforma educacional.
            </p>
            <div className="mt-4 flex justify-center gap-4 text-xs text-gray-500">
              <span>Versão 1.0</span>
              <span>•</span>
              <span>Válido a partir de {new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}