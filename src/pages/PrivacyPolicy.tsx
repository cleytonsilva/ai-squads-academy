import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Mail, Phone, MapPin } from "lucide-react";

/**
 * Página de Política de Privacidade da Esquads
 * Baseada na Lei Geral de Proteção de Dados (LGPD) brasileira
 */
export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Política de Privacidade | Esquads</title>
        <meta name="description" content="Política de Privacidade da Esquads - Como coletamos, usamos e protegemos seus dados pessoais de acordo com a LGPD." />
        <link rel="canonical" href={`${window.location.origin}/privacy-policy`} />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Política de Privacidade</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Esta Política de Privacidade descreve como a Esquads coleta, usa e protege suas informações pessoais,
            em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
          </p>
          <p className="text-sm text-gray-500 mt-2">
            <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div className="space-y-6">
          {/* Seção 1: Informações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">1. Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                A Esquads é uma plataforma educacional de cibersegurança comprometida com a proteção da privacidade
                e dos dados pessoais de seus usuários. Esta política se aplica a todos os serviços oferecidos pela
                nossa plataforma.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Definições Importantes:</h4>
                <ul className="text-blue-800 space-y-1 text-sm">
                  <li><strong>Dados Pessoais:</strong> Informações que identificam ou podem identificar uma pessoa natural</li>
                  <li><strong>Titular:</strong> Pessoa natural a quem se referem os dados pessoais</li>
                  <li><strong>Controlador:</strong> Esquads, responsável pelas decisões sobre o tratamento de dados</li>
                  <li><strong>Tratamento:</strong> Qualquer operação realizada com dados pessoais</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Seção 2: Dados Coletados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">2. Dados Pessoais Coletados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Dados de Cadastro:</h4>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• Nome completo</li>
                    <li>• Endereço de e-mail</li>
                    <li>• Nome de usuário</li>
                    <li>• Senha (criptografada)</li>
                    <li>• Data de nascimento (opcional)</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Dados de Uso:</h4>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• Progresso nos cursos</li>
                    <li>• Resultados de avaliações</li>
                    <li>• Tempo de estudo</li>
                    <li>• Preferências de aprendizado</li>
                    <li>• Logs de acesso</li>
                  </ul>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Dados Técnicos:</h4>
                <p className="text-gray-700 text-sm">
                  Endereço IP, tipo de navegador, sistema operacional, dados de cookies e outras informações
                  técnicas necessárias para o funcionamento da plataforma.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Seção 3: Finalidades do Tratamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">3. Finalidades do Tratamento de Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-gray-900">Prestação de Serviços Educacionais</h4>
                  <p className="text-gray-700 text-sm">Fornecer acesso aos cursos, acompanhar progresso e personalizar a experiência de aprendizado.</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-gray-900">Comunicação</h4>
                  <p className="text-gray-700 text-sm">Enviar notificações sobre cursos, atualizações da plataforma e suporte técnico.</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-gray-900">Melhoria dos Serviços</h4>
                  <p className="text-gray-700 text-sm">Analisar uso da plataforma para melhorar funcionalidades e desenvolver novos recursos.</p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold text-gray-900">Segurança</h4>
                  <p className="text-gray-700 text-sm">Proteger a plataforma contra fraudes, abusos e garantir a segurança dos usuários.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção 4: Base Legal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">4. Base Legal para o Tratamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Execução de Contrato</h4>
                  <p className="text-blue-800 text-sm">
                    Dados necessários para fornecer os serviços educacionais contratados.
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">Consentimento</h4>
                  <p className="text-green-800 text-sm">
                    Para comunicações de marketing e funcionalidades opcionais.
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">Interesse Legítimo</h4>
                  <p className="text-purple-800 text-sm">
                    Para melhoria dos serviços e segurança da plataforma.
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-orange-900 mb-2">Cumprimento Legal</h4>
                  <p className="text-orange-800 text-sm">
                    Para atender obrigações legais e regulamentares.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção 5: Compartilhamento de Dados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">5. Compartilhamento de Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                A Esquads não vende, aluga ou comercializa dados pessoais. Compartilhamos informações apenas nas seguintes situações:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Prestadores de Serviços</h4>
                    <p className="text-gray-700 text-sm">Com empresas que nos auxiliam na operação da plataforma (hospedagem, pagamentos, análises).</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Obrigações Legais</h4>
                    <p className="text-gray-700 text-sm">Quando exigido por lei, ordem judicial ou autoridades competentes.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Proteção de Direitos</h4>
                    <p className="text-gray-700 text-sm">Para proteger nossos direitos, propriedade ou segurança, ou de nossos usuários.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção 6: Segurança */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">6. Segurança dos Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Implementamos medidas técnicas e organizacionais adequadas para proteger seus dados pessoais:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 text-sm">Criptografia</h4>
                  <p className="text-gray-600 text-xs">Dados sensíveis são criptografados</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 text-sm">Controle de Acesso</h4>
                  <p className="text-gray-600 text-xs">Acesso restrito e monitorado</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-gray-900 text-sm">Backup Seguro</h4>
                  <p className="text-gray-600 text-xs">Backups regulares e seguros</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção 7: Retenção de Dados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">7. Retenção de Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Mantemos seus dados pessoais apenas pelo tempo necessário para as finalidades descritas:
              </p>
              <div className="space-y-3">
                <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-900">Dados de Conta Ativa: </h4>
                  <p className="text-blue-800 text-sm">Enquanto a conta estiver ativa e por até 5 anos após o encerramento.</p>
                </div>
                <div className="bg-green-50 p-3 rounded border-l-4 border-green-500">
                  <h4 className="font-semibold text-green-900">Dados de Progresso: </h4>
                  <p className="text-green-800 text-sm">Mantidos para fins educacionais por até 10 anos.</p>
                </div>
                <div className="bg-purple-50 p-3 rounded border-l-4 border-purple-500">
                  <h4 className="font-semibold text-purple-900">Logs de Segurança: </h4>
                  <p className="text-purple-800 text-sm">Mantidos por até 2 anos para fins de segurança.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção 8: Direitos dos Titulares */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">8. Seus Direitos (LGPD)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Como titular de dados pessoais, você possui os seguintes direitos garantidos pela LGPD:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 text-xs font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Confirmação e Acesso</h4>
                      <p className="text-gray-600 text-xs">Confirmar se tratamos seus dados e acessá-los</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 text-xs font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Correção</h4>
                      <p className="text-gray-600 text-xs">Corrigir dados incompletos ou inexatos</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 text-xs font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Anonimização/Eliminação</h4>
                      <p className="text-gray-600 text-xs">Solicitar anonimização ou eliminação</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-600 text-xs font-bold">4</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Portabilidade</h4>
                      <p className="text-gray-600 text-xs">Solicitar portabilidade dos dados</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600 text-xs font-bold">5</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Eliminação</h4>
                      <p className="text-gray-600 text-xs">Eliminar dados tratados com consentimento</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-yellow-600 text-xs font-bold">6</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Informação</h4>
                      <p className="text-gray-600 text-xs">Informações sobre compartilhamento</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600 text-xs font-bold">7</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Revogação</h4>
                      <p className="text-gray-600 text-xs">Revogar consentimento a qualquer momento</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-pink-600 text-xs font-bold">8</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Oposição</h4>
                      <p className="text-gray-600 text-xs">Opor-se ao tratamento em certas situações</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção 9: Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">9. Cookies e Tecnologias Similares</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Utilizamos cookies e tecnologias similares para melhorar sua experiência na plataforma:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">Cookies Essenciais</h4>
                  <p className="text-blue-800 text-sm">Necessários para o funcionamento básico da plataforma.</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">Cookies de Performance</h4>
                  <p className="text-green-800 text-sm">Ajudam a melhorar o desempenho e funcionalidades.</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">Cookies Analíticos</h4>
                  <p className="text-purple-800 text-sm">Permitem analisar como você usa a plataforma.</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Você pode gerenciar suas preferências de cookies através das configurações do seu navegador.
              </p>
            </CardContent>
          </Card>

          {/* Seção 10: Contato e DPO */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">10. Contato e Encarregado de Dados (DPO)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Para exercer seus direitos ou esclarecer dúvidas:</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">E-mail do DPO</p>
                        <p className="text-gray-600 text-sm">dpo@esquads.com.br</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">Suporte Geral</p>
                        <p className="text-gray-600 text-sm">contato@esquads.com.br</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-medium text-gray-900">Telefone</p>
                        <p className="text-gray-600 text-sm">+55 (11) 9999-9999</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Endereço da Empresa:</h4>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-orange-600 mt-1" />
                    <div>
                      <p className="text-gray-700 text-sm">
                        Esquads Educação em Cibersegurança Ltda.<br />
                        Rua da Tecnologia, 123<br />
                        São Paulo - SP, 01234-567<br />
                        Brasil
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <Separator className="my-6" />
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-2">Autoridade Nacional de Proteção de Dados (ANPD)</h4>
                <p className="text-yellow-800 text-sm">
                  Caso não seja possível resolver sua solicitação conosco, você pode contatar a ANPD através do site:
                  <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="underline ml-1">
                    www.gov.br/anpd
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Seção 11: Alterações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">11. Alterações nesta Política</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Esta Política de Privacidade pode ser atualizada periodicamente para refletir mudanças em nossas
                práticas ou na legislação aplicável. Notificaremos sobre alterações significativas através de:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-gray-700 text-sm">E-mail para usuários registrados</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <p className="text-gray-700 text-sm">Aviso destacado na plataforma</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <p className="text-gray-700 text-sm">Atualização da data de "última atualização"</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Recomendamos que você revise esta política periodicamente para se manter informado sobre como
                protegemos suas informações.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer da página */}
        <div className="mt-12 text-center">
          <div className="bg-gray-100 p-6 rounded-lg">
            <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Compromisso com a Privacidade</h3>
            <p className="text-gray-600 text-sm max-w-2xl mx-auto">
              A Esquads está comprometida em proteger sua privacidade e manter a transparência sobre como
              tratamos seus dados pessoais. Esta política reflete nosso compromisso com a conformidade à LGPD
              e às melhores práticas de proteção de dados.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}