import {
    Link
} from 'react-router';

import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from 'react';


import {
    apiDelete,
    apiGet,
    apiPut
} from '../services/api';


import TurmaModal
    from '../components/TurmaModal';


function Turmas() {

    // ==================================================
    // ESTADOS
    // ==================================================

    const [turmas, setTurmas] =
        useState([]);


    const [busca, setBusca] =
        useState('');


    const [carregando, setCarregando] =
        useState(true);


    const [erro, setErro] =
        useState('');


    const [
        modalAberto,
        setModalAberto
    ] = useState(false);


    const [
        turmaEditando,
        setTurmaEditando
    ] = useState(null);


    const [
        processandoId,
        setProcessandoId
    ] = useState(null);


    const [
        mensagemSucesso,
        setMensagemSucesso
    ] = useState('');


    // ==================================================
    // CARREGAR TURMAS
    // ==================================================

    const carregarTurmas =
        useCallback(
            async () => {

                try {

                    setCarregando(true);

                    setErro('');


                    const resposta =
                        await apiGet(
                            '/turmas'
                        );


                    setTurmas(
                        resposta.dados || []
                    );

                } catch (erro) {

                    console.error(erro);


                    setErro(
                        erro.message ||
                        'Não foi possível carregar as turmas.'
                    );

                } finally {

                    setCarregando(false);
                }
            },
            []
        );


    // ==================================================
    // CARREGAMENTO INICIAL
    // ==================================================

    useEffect(() => {

        carregarTurmas();

    }, [carregarTurmas]);


    // ==================================================
    // TOAST
    // ==================================================

    useEffect(() => {

        if (!mensagemSucesso) {
            return undefined;
        }


        const timer =
            setTimeout(
                () =>
                    setMensagemSucesso(''),
                3500
            );


        return () =>
            clearTimeout(timer);

    }, [mensagemSucesso]);


    // ==================================================
    // FILTRO
    // ==================================================

    const turmasFiltradas =
        useMemo(() => {

            const texto =
                busca
                    .trim()
                    .toLowerCase();


            if (!texto) {
                return turmas;
            }


            return turmas.filter(
                (turma) => {

                    const campos = [

                        turma.nome,

                        turma.modalidade_nome,

                        turma.professor_nome,

                        turma.sala,

                        turma.tipo

                    ]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase();


                    return campos.includes(
                        texto
                    );
                }
            );

        }, [
            turmas,
            busca
        ]);


    // ==================================================
    // TOTAIS
    // ==================================================

    const totais =
        useMemo(() => {

            const ativas =
                turmas.filter(
                    (turma) =>
                        Number(
                            turma.ativo
                        ) === 1
                ).length;


            return {

                total:
                    turmas.length,

                ativas,

                inativas:
                    turmas.length - ativas

            };

        }, [turmas]);


    // ==================================================
    // ABRIR NOVA TURMA
    // ==================================================

    function abrirNovaTurma() {

        setTurmaEditando(null);

        setModalAberto(true);
    }


    // ==================================================
    // EDITAR TURMA
    // ==================================================

    function abrirEdicao(turma) {

        setTurmaEditando(turma);

        setModalAberto(true);
    }


    // ==================================================
    // FECHAR MODAL
    // ==================================================

    function fecharModal() {

        setModalAberto(false);

        setTurmaEditando(null);
    }


    // ==================================================
    // TURMA SALVA
    // ==================================================

    async function handleSalvo(acao) {

        await carregarTurmas();


        setMensagemSucesso(

            acao === 'editada'

                ? 'Turma atualizada com sucesso.'

                : 'Turma cadastrada com sucesso.'
        );
    }


    // ==================================================
    // DESATIVAR
    // ==================================================

    async function desativar(turma) {

        const confirmou =
            window.confirm(
                `Deseja desativar a turma ${turma.nome}?`
            );


        if (!confirmou) {
            return;
        }


        try {

            setProcessandoId(
                turma.id
            );


            setErro('');


            await apiDelete(
                `/turmas/${turma.id}`
            );


            await carregarTurmas();


            setMensagemSucesso(
                'Turma desativada com sucesso.'
            );

        } catch (erro) {

            console.error(erro);


            setErro(
                erro.message ||
                'Não foi possível desativar a turma.'
            );

        } finally {

            setProcessandoId(null);
        }
    }


    // ==================================================
    // REATIVAR
    // ==================================================

    async function reativar(turma) {

        try {

            setProcessandoId(
                turma.id
            );


            setErro('');


            /*
             * O backend preserva os demais campos
             * quando eles não são enviados.
             */

            await apiPut(
                `/turmas/${turma.id}`,
                {
                    ativo: 1
                }
            );


            await carregarTurmas();


            setMensagemSucesso(
                'Turma reativada com sucesso.'
            );

        } catch (erro) {

            console.error(erro);


            setErro(
                erro.message ||
                'Não foi possível reativar a turma.'
            );

        } finally {

            setProcessandoId(null);
        }
    }


    // ==================================================
    // INTERFACE
    // ==================================================

    return (

        <div className="pagina">


            {/* =====================================
                TOAST
            ====================================== */}

            {mensagemSucesso && (

                <div className="toast-sucesso">

                    <span className="toast-icone">
                        ✓
                    </span>

                    {mensagemSucesso}

                </div>

            )}


            {/* =====================================
                CABEÇALHO
            ====================================== */}

            <header className="pagina-header">

                <div>

                    <h1>
                        Turmas
                    </h1>

                    <p>
                        Organize as turmas,
                        professores e modalidades.
                    </p>

                </div>


                <button
                    type="button"

                    className=
                    "botao-primario"

                    onClick={
                        abrirNovaTurma
                    }
                >
                    + Nova turma
                </button>

            </header>


            {/* =====================================
                RESUMO
            ====================================== */}

            <section
                className="turmas-resumo"

                aria-label=
                "Resumo das turmas"
            >

                <div className="turma-resumo-card">

                    <span>
                        Total
                    </span>

                    <strong>
                        {totais.total}
                    </strong>

                </div>


                <div className="turma-resumo-card">

                    <span>
                        Ativas
                    </span>

                    <strong>
                        {totais.ativas}
                    </strong>

                </div>


                <div className="turma-resumo-card">

                    <span>
                        Inativas
                    </span>

                    <strong>
                        {totais.inativas}
                    </strong>

                </div>

            </section>


            {/* =====================================
                PESQUISA
            ====================================== */}

            <section className="barra-ferramentas">

                <div className="campo-busca">

                    <span>
                        ⌕
                    </span>


                    <input
                        type="search"

                        placeholder=
                        "Buscar turma, professor ou modalidade..."

                        value={
                            busca
                        }

                        onChange={
                            (evento) =>
                                setBusca(
                                    evento.target.value
                                )
                        }
                    />

                </div>


                <span className="contador">

                    {
                        turmasFiltradas.length
                    }

                    {' '}

                    {
                        turmasFiltradas.length === 1
                            ? 'turma'
                            : 'turmas'
                    }

                </span>

            </section>


            {/* =====================================
                ERRO
            ====================================== */}

            {erro && (

                <div className="mensagem-erro turmas-erro">

                    <strong>
                        Não foi possível concluir
                        a operação.
                    </strong>

                    <span>
                        {erro}
                    </span>

                    {
                        turmas.length === 0
                        &&
                        (

                            <div>

                                <button
                                    type="button"

                                    className=
                                    "botao-secundario"

                                    onClick={
                                        carregarTurmas
                                    }
                                >
                                    Tentar novamente
                                </button>

                            </div>

                        )
                    }

                </div>

            )}


            {/* =====================================
                CARREGANDO
            ====================================== */}

            {
                carregando &&
                    turmas.length === 0

                    ? (

                        <div className="estado-pagina">

                            <div className="spinner" />

                            <p>
                                Carregando turmas...
                            </p>

                        </div>

                    )

                    : (

                        /* =================================
                            LISTA
                        ================================== */

                        <section className="lista-card turmas-lista">

                            {
                                turmasFiltradas.length === 0

                                    ? (

                                        <div className="estado-pagina">

                                            <p>
                                                Nenhuma turma encontrada.
                                            </p>

                                        </div>

                                    )

                                    : (

                                        turmasFiltradas.map(
                                            (turma) => {

                                                const ativa =
                                                    Number(
                                                        turma.ativo
                                                    ) === 1;


                                                const processando =
                                                    processandoId
                                                    ===
                                                    turma.id;


                                                return (

                                                    <div
                                                        className=
                                                        "turma-item"

                                                        key={
                                                            turma.id
                                                        }
                                                    >

                                                        {/* Ícone */}

                                                        <div
                                                            className=
                                                            "turma-icone"
                                                        >
                                                            ♫
                                                        </div>


                                                        {/* Dados */}

                                                        <div
                                                            className=
                                                            "turma-info"
                                                        >

                                                            <strong>
                                                                {
                                                                    turma.nome
                                                                }
                                                            </strong>


                                                            <span>

                                                                {
                                                                    turma.modalidade_nome
                                                                }

                                                                {' • '}

                                                                {
                                                                    turma.professor_nome
                                                                }

                                                            </span>


                                                            <span
                                                                className=
                                                                "turma-detalhe"
                                                            >

                                                                {
                                                                    turma.tipo ===
                                                                        'individual'
                                                                        ? 'Individual'
                                                                        : 'Coletiva'
                                                                }


                                                                {
                                                                    turma.sala
                                                                    &&
                                                                    (
                                                                        <>
                                                                            {' • '}
                                                                            {
                                                                                turma.sala
                                                                            }
                                                                        </>
                                                                    )
                                                                }

                                                            </span>

                                                        </div>


                                                        {/* Status */}

                                                        <div className="turma-status">

                                                            <span
                                                                className={
                                                                    `badge ${ativa
                                                                        ? 'ativo'
                                                                        : 'inativo'
                                                                    }`
                                                                }
                                                            >

                                                                {
                                                                    ativa
                                                                        ? 'Ativa'
                                                                        : 'Inativa'
                                                                }

                                                            </span>

                                                        </div>


                                                        {/* Ações */}

                                                        <div className="turma-acoes">
                                                            <Link
                                                                to={`/turmas/${turma.id}`}

                                                                className=
                                                                "botao-secundario turma-botao"
                                                            >
                                                                Abrir
                                                            </Link>
                                                            <button
                                                                type="button"

                                                                className=
                                                                "botao-secundario turma-botao"

                                                                onClick={
                                                                    () =>
                                                                        abrirEdicao(
                                                                            turma
                                                                        )
                                                                }

                                                                disabled={
                                                                    processando
                                                                }
                                                            >
                                                                Editar
                                                            </button>


                                                            {
                                                                ativa

                                                                    ? (

                                                                        <button
                                                                            type="button"

                                                                            className=
                                                                            "botao-perigo-secundario turma-botao"

                                                                            onClick={
                                                                                () =>
                                                                                    desativar(
                                                                                        turma
                                                                                    )
                                                                            }

                                                                            disabled={
                                                                                processando
                                                                            }
                                                                        >

                                                                            {
                                                                                processando
                                                                                    ? 'Aguarde...'
                                                                                    : 'Desativar'
                                                                            }

                                                                        </button>

                                                                    )

                                                                    : (

                                                                        <button
                                                                            type="button"

                                                                            className=
                                                                            "botao-primario turma-botao"

                                                                            onClick={
                                                                                () =>
                                                                                    reativar(
                                                                                        turma
                                                                                    )
                                                                            }

                                                                            disabled={
                                                                                processando
                                                                            }
                                                                        >

                                                                            {
                                                                                processando
                                                                                    ? 'Aguarde...'
                                                                                    : 'Reativar'
                                                                            }

                                                                        </button>

                                                                    )
                                                            }

                                                        </div>

                                                    </div>

                                                );
                                            }
                                        )

                                    )
                            }

                        </section>

                    )
            }


            {/* =====================================
                MODAL
            ====================================== */}

            <TurmaModal

                aberto={
                    modalAberto
                }

                turma={
                    turmaEditando
                }

                onFechar={
                    fecharModal
                }

                onSalvo={
                    handleSalvo
                }

            />

        </div>
    );
}


export default Turmas;