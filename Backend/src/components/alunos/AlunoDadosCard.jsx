import { formatarData } from '../../utils/formatters';

function AlunoDadosCard({ aluno }) {
    const ativo = Number(aluno.ativo) === 1;

    return (
        <section className="ficha-card">
            <div className="ficha-card-header">
                <div>
                    <h2>Dados do aluno</h2>
                    <p>Informações básicas do cadastro.</p>
                </div>
            </div>

            <div className="ficha-dados">
                <div className="ficha-campo">
                    <span>Nome completo</span>
                    <strong>{aluno.nome}</strong>
                </div>

                <div className="ficha-campo">
                    <span>Data de nascimento</span>
                    <strong>{formatarData(aluno.data_nascimento)}</strong>
                </div>

                <div className="ficha-campo">
                    <span>Situação</span>
                    <strong>{ativo ? 'Aluno ativo' : 'Aluno inativo'}</strong>
                </div>
            </div>
        </section>
    );
}

export default AlunoDadosCard;
