
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const Regulamento = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="lsb-container py-12">
        <div className="lsb-content">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">
                Regulamento da Biblioteca Digital
              </h1>
              
              <div className="prose prose-lg max-w-none">
                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    1. Termos de Uso
                  </h2>
                  <p className="p2-text">
                    A Biblioteca Digital LSB é um serviço oferecido pela Instituição de Ensino LSB 
                    para facilitar o acesso a recursos educacionais e de pesquisa. Ao utilizar esta 
                    plataforma, você concorda em seguir todas as diretrizes e regulamentações aqui 
                    estabelecidas.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    2. Direitos Autorais e Propriedade Intelectual
                  </h2>
                  <p className="p2-text">
                    Todo o conteúdo disponibilizado na Biblioteca Digital está protegido por direitos 
                    autorais. O uso dos materiais deve ser restrito para fins educacionais e de pesquisa, 
                    respeitando sempre os direitos dos autores e editoras.
                  </p>
                  <ul className="list-disc pl-6 p2-text">
                    <li>É proibida a reprodução comercial de qualquer material</li>
                    <li>Citações devem seguir as normas acadêmicas adequadas</li>
                    <li>O compartilhamento deve respeitar os termos de licença de cada obra</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    3. Regras de Acesso e Uso
                  </h2>
                  <p className="p2-text">
                    Para garantir a qualidade do serviço e o acesso equitativo a todos os usuários:
                  </p>
                  <ul className="list-disc pl-6 p2-text">
                    <li>Mantenha suas credenciais de acesso seguras e não as compartilhe</li>
                    <li>Use os recursos de forma responsável e ética</li>
                    <li>Respeite os limites de download e visualização estabelecidos</li>
                    <li>Reporte problemas técnicos ou conteúdo inadequado imediatamente</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    4. Condutas Proibidas
                  </h2>
                  <p className="p2-text">
                    As seguintes atividades são estritamente proibidas:
                  </p>
                  <ul className="list-disc pl-6 p2-text">
                    <li>Tentativas de acesso não autorizado aos sistemas</li>
                    <li>Distribuição massiva ou comercialização do conteúdo</li>
                    <li>Uso de ferramentas automatizadas para download em larga escala</li>
                    <li>Violação dos direitos autorais ou propriedade intelectual</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    5. Responsabilidades da Instituição
                  </h2>
                  <p className="p2-text">
                    A LSB se compromete a:
                  </p>
                  <ul className="list-disc pl-6 p2-text">
                    <li>Manter a plataforma funcional e segura</li>
                    <li>Proteger os dados pessoais dos usuários</li>
                    <li>Atualizar regularmente o acervo com novos recursos</li>
                    <li>Oferecer suporte técnico adequado</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    6. Alterações no Regulamento
                  </h2>
                  <p className="p2-text">
                    Este regulamento pode ser atualizado periodicamente. Os usuários serão notificados 
                    sobre mudanças significativas e devem revisar regularmente estas diretrizes.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    7. Contato
                  </h2>
                  <p className="p2-text">
                    Para dúvidas sobre este regulamento ou para reportar violações, entre em contato 
                    com nossa equipe através dos canais oficiais da LSB.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Regulamento;
