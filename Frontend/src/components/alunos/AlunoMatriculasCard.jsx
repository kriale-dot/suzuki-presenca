import { formatarData } from '../../utils/formatters';

function AlunoMatriculasCard({
    aluno,
    matriculas,
    carregando,
    erro,
    onTentarNovamente,
    onMatricular,
    onEncerrar
}) {
    const alunoAtivo = Number(aluno.ativo) === 1;

    return (
        <section className="ficha-card">
            <div className="ficha-card-header">
                <div>
                    <h2>Turmas</h2>
                    <p>Matrículas deste aluno.</p>
                </div>

                {alunoAtivo && (
                    <button type="button" className="botao-secundario" onClick={onMatricular}>
                        + Matricular
                    </button>
                )}
            </div>

            {carregando && (
                <div className="ficha-vazio">
                    <div className="spinner" />
                    <p>Carregando matrículas...</p>
                </div>
            )}

            {!carregando && erro && (
                <div className="estado-erro-card">
                    <strong>Não foi possível carregar as matrículas.</strong>
                    <span>{erro}</span>
                    <button type="button" className="botao-secundario" onClick={onTentarNovamente}>
                        Tentar novamente
                    </button>
                </div>
            )}

            {!carregando && !erro && matriculas.length === 0 && (
                <div className="ficha-vazio">
                    <span className="ficha-vazio-icone">♫</span>
                    <strong>Nenhuma matrícula</strong>
                    <p>Este aluno ainda não está matriculado em nenhuma turma.</p>
                </div>
            )}

            {!carregando && !erro && matriculas.length > 0 && (
                <div className="matriculas-lista">
                    {matriculas.map((matricula) => {
                        const ativa = Number(matricula.matricula_ativa) === 1;

                        return (
                            <div className="matricula-item" key={matricula.matricula_id}>
                                <div className="matricula-icone">♫</div>

                                <div className="matricula-info">
                                    <strong>{matricula.turma_nome}</strong>
                                    <span>
                                        {matricula.modalidade_nome} • {matricula.professor_nome}
                                    </span>
                                    <span className="matricula-periodo">
                                        Desde {formatarData(matricula.data_inicio)}
                                        {matricula.data_fim && ` até ${formatarData(matricula.data_fim)}`}
                                    </span>
                                </div>

                                <div className="matricula-sala">{matricula.sala || 'Sem sala'}</div>

                                <div className="matricula-acoes">
                                    <span className={`badge ${ativa ? 'ativo' : 'inativo'}`}>
                                        {ativa ? 'Ativa' : 'Encerrada'}
                                    </span>

                                    {ativa && alunoAtivo && (
                                        <button
                                            type="button"
                                            className="botao-link-perigo"
                                            onClick={() => onEncerrar(matricula)}
                                        >
                                            Encerrar
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default AlunoMatriculasCard;
