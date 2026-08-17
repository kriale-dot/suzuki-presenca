import {
    useCallback,
    useEffect,
    useState
} from 'react';

import {
    Link,
    useNavigate,
    useParams
} from 'react-router';

import {
    apiDelete,
    apiGet,
    apiPostFormData,
    apiPut
} from '../services/api';

import AlunoCabecalho
    from '../components/alunos/AlunoCabecalho';

import AlunoDadosCard
    from '../components/alunos/AlunoDadosCard';

import AlunoEditarForm
    from '../components/alunos/AlunoEditarForm';

import AlunoMatriculasCard
    from '../components/alunos/AlunoMatriculasCard';

import MatricularAlunoModal
    from '../components/MatricularAlunoModal';

import EncerrarMatriculaModal
    from '../components/EncerrarMatriculaModal';


function AlunoDetalhes() {
    const { id } =
        useParams();

    const navigate =
        useNavigate();

    const [aluno, setAluno] =
        useState(null);

    const [carregando, setCarregando] =
        useState(true);

    const [erro, setErro] =
        useState('');

    const [editando, setEditando] =
        useState(false);

    const [salvando, setSalvando] =
        useState(false);

    const [mensagemSucesso, setMensagemSucesso] =
        useState('');

    const [processandoExclusao, setProcessandoExclusao] =
        useState(false);

    const [nome, setNome] =
        useState('');

    const [dataNascimento, setDataNascimento] =
        useState('');

    const [fotoArquivo, setFotoArquivo] =
        useState(null);

    const [removerFoto, setRemoverFoto] =
        useState(false);

    const [matriculas, setMatriculas] =
        useState([]);

    const [carregandoMatriculas, setCarregandoMatriculas] =
        useState(true);

    const [erroMatriculas, setErroMatriculas] =
        useState('');

    const [modalMatricula, setModalMatricula] =
        useState(false);

    const [matriculaParaEncerrar, setMatriculaParaEncerrar] =
        useState(null);


    const carregarAluno =
        useCallback(
            async () => {
                try {
                    setCarregando(true);
                    setErro('');

                    const resposta =
                        await apiGet(
                            `/alunos/${id}`
                        );

                    setAluno(
                        resposta.dados
                    );

                } catch (err) {
                    console.error(err);

                    setErro(
                        err.message
                        ||
                        'Não foi possível carregar o aluno.'
                    );

                } finally {
                    setCarregando(false);
                }
            },
            [id]
        );


    const carregarMatriculas =
        useCallback(
            async () => {
                try {
                    setCarregandoMatriculas(true);
                    setErroMatriculas('');

                    const resposta =
                        await apiGet(
                            `/alunos/${id}/turmas`
                        );

                    setMatriculas(
                        resposta.dados
                        ||
                        []
                    );

                } catch (err) {
                    console.error(err);

                    setErroMatriculas(
                        err.message
                        ||
                        'Não foi possível carregar as matrículas.'
                    );

                } finally {
                    setCarregandoMatriculas(false);
                }
            },
            [id]
        );


    useEffect(
        () => {
            carregarAluno();
            carregarMatriculas();
        },
        [
            carregarAluno,
            carregarMatriculas
        ]
    );


    useEffect(
        () => {
            if (!mensagemSucesso) {
                return undefined;
            }

            const timer =
                setTimeout(
                    () => setMensagemSucesso(''),
                    3500
                );

            return () => clearTimeout(timer);
        },
        [mensagemSucesso]
    );


    function iniciarEdicao() {
        setNome(
            aluno.nome
            ||
            ''
        );

        setDataNascimento(
            aluno.data_nascimento
            ||
            ''
        );

        setFotoArquivo(null);
        setRemoverFoto(false);
        setErro('');
        setEditando(true);
    }


    function cancelarEdicao() {
        setEditando(false);
        setFotoArquivo(null);
        setRemoverFoto(false);
        setErro('');
    }


    async function salvarEdicao(event) {
        event.preventDefault();

        const nomeLimpo =
            nome.trim();

        if (!nomeLimpo) {
            setErro(
                'Informe o nome do aluno.'
            );
            return;
        }

        try {
            setSalvando(true);
            setErro('');

            await apiPut(
                `/alunos/${id}`,
                {
                    nome: nomeLimpo,
                    data_nascimento:
                        dataNascimento
                        ||
                        null
                }
            );

            if (removerFoto) {
                await apiDelete(
                    `/alunos/${id}/foto`
                );
            } else if (fotoArquivo) {
                const formData =
                    new FormData();

                formData.append(
                    'foto',
                    fotoArquivo
                );

                await apiPostFormData(
                    `/alunos/${id}/foto`,
                    formData
                );
            }

            await carregarAluno();

            setEditando(false);
            setFotoArquivo(null);
            setRemoverFoto(false);

            setMensagemSucesso(
                'Dados do aluno atualizados com sucesso.'
            );

        } catch (err) {
            console.error(err);

            setErro(
                err.message
                ||
                'Não foi possível atualizar o aluno.'
            );

        } finally {
            setSalvando(false);
        }
    }


    async function desativarAluno() {
        const confirmou =
            window.confirm(
                `Deseja desativar ${aluno.nome}? As matrículas ativas serão encerradas na data de hoje.`
            );

        if (!confirmou) {
            return;
        }

        try {
            setSalvando(true);
            setErro('');

            await apiDelete(
                `/alunos/${id}`
            );

            await Promise.all([
                carregarAluno(),
                carregarMatriculas()
            ]);

            setMensagemSucesso(
                'Aluno desativado e matrículas ativas encerradas.'
            );

        } catch (err) {
            console.error(err);

            setErro(
                err.message
                ||
                'Não foi possível desativar o aluno.'
            );

        } finally {
            setSalvando(false);
        }
    }


    async function reativarAluno() {
        try {
            setSalvando(true);
            setErro('');

            await apiPut(
                `/alunos/${id}`,
                {
                    ativo: 1
                }
            );

            await carregarAluno();

            setMensagemSucesso(
                'Aluno reativado. Matrículas antigas permanecem no histórico.'
            );

        } catch (err) {
            console.error(err);

            setErro(
                err.message
                ||
                'Não foi possível reativar o aluno.'
            );

        } finally {
            setSalvando(false);
        }
    }


    // ==================================================
    // EXCLUSÃO DEFINITIVA
    // ==================================================

    async function excluirAlunoDefinitivamente() {
        if (
            Number(
                aluno?.ativo
            ) === 1
        ) {
            window.alert(
                'Desative o aluno antes de tentar excluí-lo definitivamente.'
            );
            return;
        }

        const confirmou =
            window.confirm(
                `Excluir definitivamente ${aluno.nome}?

Esta operação não poderá ser desfeita. Se existir qualquer histórico de aula ou presença, o sistema bloqueará a exclusão.`
            );

        if (!confirmou) {
            return;
        }

        const confirmacaoDigitada =
            window.prompt(
                'Para confirmar, digite EXCLUIR:'
            );

        if (
            confirmacaoDigitada
                ?.trim()
                .toUpperCase()
            !==
            'EXCLUIR'
        ) {
            return;
        }

        try {
            setProcessandoExclusao(true);
            setErro('');

            const resposta =
                await apiDelete(
                    `/alunos/${id}/definitivo`
                );

            window.alert(
                resposta.mensagem
                ||
                'Aluno excluído definitivamente.'
            );

            navigate(
                '/alunos',
                {
                    replace: true
                }
            );

        } catch (err) {
            console.error(
                'Erro ao excluir aluno definitivamente:',
                err
            );

            window.alert(
                err.message
                ||
                'Não foi possível excluir definitivamente o aluno.'
            );

        } finally {
            setProcessandoExclusao(false);
        }
    }


    async function handleMatriculado() {
        await carregarMatriculas();
        setMensagemSucesso('Aluno matriculado com sucesso.');
    }


    async function handleMatriculaEncerrada() {
        await carregarMatriculas();
        setMensagemSucesso('Matrícula encerrada com sucesso.');
    }


    if (
        carregando
        &&
        !aluno
    ) {
        return (
            <div className="estado-pagina">
                <div className="spinner" />
                <p>Carregando aluno...</p>
            </div>
        );
    }


    if (!aluno) {
        return (
            <div className="pagina">
                <Link to="/alunos" className="voltar-link">
                    ← Voltar para alunos
                </Link>

                <div className="mensagem-erro">
                    <strong>Não foi possível abrir esta ficha.</strong>
                    <span>{erro}</span>
                </div>
            </div>
        );
    }


    return (
        <div className="pagina">
            {
                mensagemSucesso
                &&
                (
                    <div className="toast-sucesso">
                        <span className="toast-icone">✓</span>
                        {mensagemSucesso}
                    </div>
                )
            }

            <Link to="/alunos" className="voltar-link">
                ← Voltar para alunos
            </Link>

            <AlunoCabecalho
                aluno={aluno}
                editando={editando}
                salvando={salvando}
                onEditar={iniciarEdicao}
                onDesativar={desativarAluno}
                onReativar={reativarAluno}
                onExcluirDefinitivamente={excluirAlunoDefinitivamente}
                processandoExclusao={processandoExclusao}
            />

            {
                Number(aluno.ativo) === 0
                &&
                (
                    <div
                        className="mensagem-erro"
                        style={{ marginBottom: '20px' }}
                    >
                        <strong>
                            Exclusão definitiva
                        </strong>

                        <span>
                            Use esta opção apenas para um cadastro criado por engano. Ausências geradas automaticamente no encerramento da aula podem ser removidas, mas qualquer presença real ou correção registrada bloqueará a exclusão para preservar o histórico.
                        </span>
                    </div>
                )
            }

            {
                erro
                &&
                (
                    <div className="mensagem-erro ficha-erro">
                        {erro}
                    </div>
                )
            }

            {
                editando

                    ? (
                        <AlunoEditarForm
                            nome={nome}
                            dataNascimento={dataNascimento}
                            fotoUrl={aluno.foto_url}
                            fotoArquivo={fotoArquivo}
                            removerFoto={removerFoto}
                            salvando={salvando}
                            onNomeChange={setNome}
                            onDataChange={setDataNascimento}
                            onFotoArquivoChange={setFotoArquivo}
                            onRemoverFotoChange={setRemoverFoto}
                            onCancelar={cancelarEdicao}
                            onSubmit={salvarEdicao}
                        />
                    )

                    : (
                        <AlunoDadosCard aluno={aluno} />
                    )
            }

            <AlunoMatriculasCard
                aluno={aluno}
                matriculas={matriculas}
                carregando={carregandoMatriculas}
                erro={erroMatriculas}
                onTentarNovamente={carregarMatriculas}
                onMatricular={() => setModalMatricula(true)}
                onEncerrar={setMatriculaParaEncerrar}
            />

            <MatricularAlunoModal
                aberto={modalMatricula}
                aluno={aluno}
                matriculas={matriculas}
                onFechar={() => setModalMatricula(false)}
                onMatriculado={handleMatriculado}
            />

            <EncerrarMatriculaModal
                aberto={Boolean(matriculaParaEncerrar)}
                matricula={matriculaParaEncerrar}
                onFechar={() => setMatriculaParaEncerrar(null)}
                onEncerrada={handleMatriculaEncerrada}
            />
        </div>
    );
}


export default AlunoDetalhes;
