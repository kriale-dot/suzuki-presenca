import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    Link
} from 'react-router';

import {
    apiArquivoUrl,
    apiGet
} from '../services/api';

import NovoAlunoModal
    from '../components/NovoAlunoModal';

import {
    formatarData,
    obterIniciais
} from '../utils/formatters';


function Alunos() {
    const [alunos, setAlunos] = useState([]);
    const [busca, setBusca] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [modalNovoAluno, setModalNovoAluno] = useState(false);
    const [mensagemSucesso, setMensagemSucesso] = useState('');


    const carregarAlunos =
        useCallback(
            async () => {
                try {
                    setCarregando(true);
                    setErro('');

                    const resposta =
                        await apiGet('/alunos');

                    setAlunos(
                        resposta.dados
                        ||
                        []
                    );

                } catch (err) {
                    console.error(err);

                    setErro(
                        err.message
                        ||
                        'Não foi possível carregar os alunos.'
                    );

                } finally {
                    setCarregando(false);
                }
            },
            []
        );


    useEffect(
        () => {
            carregarAlunos();
        },
        [carregarAlunos]
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


    async function handleAlunoCriado() {
        await carregarAlunos();

        setMensagemSucesso(
            'Aluno cadastrado com sucesso.'
        );
    }


    const alunosFiltrados =
        useMemo(
            () => {
                const texto =
                    busca
                        .trim()
                        .toLowerCase();

                if (!texto) {
                    return alunos;
                }

                return alunos.filter(
                    (aluno) =>
                        aluno.nome
                            .toLowerCase()
                            .includes(texto)
                );
            },
            [
                alunos,
                busca
            ]
        );


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

            <header className="pagina-header">
                <div>
                    <h1>Alunos</h1>
                    <p>Consulte e administre os alunos cadastrados.</p>
                </div>

                <button
                    type="button"
                    className="botao-primario"
                    onClick={() => setModalNovoAluno(true)}
                >
                    + Novo aluno
                </button>
            </header>

            <section className="barra-ferramentas">
                <div className="campo-busca">
                    <span>⌕</span>

                    <input
                        type="search"
                        placeholder="Buscar aluno pelo nome..."
                        value={busca}
                        onChange={(event) => setBusca(event.target.value)}
                    />
                </div>

                <span className="contador">
                    {alunosFiltrados.length}{' '}
                    {alunosFiltrados.length === 1 ? 'aluno' : 'alunos'}
                </span>
            </section>

            {
                carregando
                &&
                (
                    <div className="estado-pagina">
                        <div className="spinner" />
                        <p>Carregando alunos...</p>
                    </div>
                )
            }

            {
                !carregando
                &&
                erro
                &&
                (
                    <div className="mensagem-erro">
                        <strong>Não foi possível carregar os alunos.</strong>
                        <span>{erro}</span>

                        <div>
                            <button
                                type="button"
                                className="botao-secundario"
                                onClick={carregarAlunos}
                            >
                                Tentar novamente
                            </button>
                        </div>
                    </div>
                )
            }

            {
                !carregando
                &&
                !erro
                &&
                (
                    <section className="lista-card">
                        {
                            alunosFiltrados.length === 0
                                ? (
                                    <div className="estado-pagina">
                                        <p>Nenhum aluno encontrado.</p>
                                    </div>
                                )
                                : alunosFiltrados.map(
                                    (aluno) => {
                                        const foto =
                                            apiArquivoUrl(
                                                aluno.foto_url
                                            );

                                        return (
                                            <div className="aluno-item" key={aluno.id}>
                                                <div className="aluno-avatar">
                                                    {
                                                        foto
                                                            ? (
                                                                <img
                                                                    src={foto}
                                                                    alt={aluno.nome}
                                                                />
                                                            )
                                                            : (
                                                                <span>
                                                                    {obterIniciais(aluno.nome)}
                                                                </span>
                                                            )
                                                    }
                                                </div>

                                                <div className="aluno-info">
                                                    <strong>{aluno.nome}</strong>
                                                    <span>
                                                        Nascimento: {formatarData(aluno.data_nascimento)}
                                                    </span>
                                                </div>

                                                <div className="aluno-status">
                                                    <span
                                                        className={
                                                            `badge ${Number(aluno.ativo) === 1 ? 'ativo' : 'inativo'}`
                                                        }
                                                    >
                                                        {Number(aluno.ativo) === 1 ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                </div>

                                                <Link
                                                    to={`/alunos/${aluno.id}`}
                                                    className="botao-detalhes"
                                                    aria-label={`Abrir ficha de ${aluno.nome}`}
                                                >
                                                    ›
                                                </Link>
                                            </div>
                                        );
                                    }
                                )
                        }
                    </section>
                )
            }

            <NovoAlunoModal
                aberto={modalNovoAluno}
                onFechar={() => setModalNovoAluno(false)}
                onCriado={handleAlunoCriado}
            />
        </div>
    );
}


export default Alunos;
