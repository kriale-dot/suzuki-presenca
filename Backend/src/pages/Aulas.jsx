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
    apiGet
} from '../services/api';


const ITENS_POR_PAGINA = 20;


function Aulas() {

    // ==================================================
    // ESTADOS
    // ==================================================

    const [
        aulas,
        setAulas
    ] = useState([]);


    const [
        carregando,
        setCarregando
    ] = useState(true);


    const [
        erro,
        setErro
    ] = useState('');


    const [
        dataInicial,
        setDataInicial
    ] = useState('');


    const [
        dataFinal,
        setDataFinal
    ] = useState('');


    const [
        statusSelecionado,
        setStatusSelecionado
    ] = useState('');


    const [
        turmaSelecionada,
        setTurmaSelecionada
    ] = useState('');


    const [
        professorSelecionado,
        setProfessorSelecionado
    ] = useState('');


    const [
        tipoSelecionado,
        setTipoSelecionado
    ] = useState('');


    const [
        paginaAtual,
        setPaginaAtual
    ] = useState(1);


    // ==================================================
    // CARREGAR AULAS
    //
    // O backend já aplica o isolamento por perfil.
    // Administrador/secretaria recebem todas as aulas.
    // Professor recebe apenas as próprias aulas.
    // ==================================================

    const carregarAulas =
        useCallback(
            async () => {

                try {

                    setCarregando(
                        true
                    );


                    setErro('');


                    const resposta =
                        await apiGet(
                            '/aulas'
                        );


                    setAulas(
                        resposta.dados
                        ||
                        []
                    );

                } catch (erro) {

                    console.error(
                        'Erro ao carregar aulas:',
                        erro
                    );


                    setErro(
                        erro.message
                        ||
                        'Não foi possível carregar a relação de aulas.'
                    );

                } finally {

                    setCarregando(
                        false
                    );
                }
            },
            []
        );


    // ==================================================
    // CARREGAMENTO INICIAL
    // ==================================================

    useEffect(
        () => {

            carregarAulas();

        },
        [
            carregarAulas
        ]
    );


    // ==================================================
    // FORMATADORES
    // ==================================================

    function formatarData(
        data
    ) {

        if (!data) {
            return '—';
        }


        const [
            ano,
            mes,
            dia
        ] = data.split('-');


        return `${dia}/${mes}/${ano}`;
    }


    function formatarHora(
        hora
    ) {

        if (!hora) {
            return '—';
        }


        return hora.substring(
            0,
            5
        );
    }


    function nomeStatus(
        status
    ) {

        const nomes = {

            agendada:
                'Agendada',

            aberta:
                'Aberta',

            encerrada:
                'Encerrada',

            cancelada:
                'Cancelada'

        };


        return nomes[status]
            ||
            status
            ||
            '—';
    }


    function nomeTipo(
        tipo
    ) {

        const nomes = {

            regular:
                'Regular',

            reposicao:
                'Reposição',

            extra:
                'Extra'

        };


        return nomes[tipo]
            ||
            tipo
            ||
            '—';
    }


    function chaveTurma(
        aula
    ) {

        return String(
            aula.turma_id
            ??
            aula.turma_nome
            ??
            ''
        );
    }


    function chaveProfessor(
        aula
    ) {

        return String(
            aula.professor_id
            ??
            aula.professor_nome
            ??
            ''
        );
    }


    // ==================================================
    // OPÇÕES DE TURMA
    // ==================================================

    const turmasDisponiveis =
        useMemo(
            () => {

                const mapa =
                    new Map();


                aulas.forEach(
                    (aula) => {

                        const chave =
                            chaveTurma(
                                aula
                            );


                        if (
                            chave
                            &&
                            aula.turma_nome
                            &&
                            !mapa.has(
                                chave
                            )
                        ) {

                            mapa.set(
                                chave,
                                aula.turma_nome
                            );
                        }
                    }
                );


                return Array.from(
                    mapa.entries()
                )
                    .map(
                        ([
                            value,
                            label
                        ]) => ({
                            value,
                            label
                        })
                    )
                    .sort(
                        (a, b) =>
                            a.label.localeCompare(
                                b.label,
                                'pt-BR'
                            )
                    );

            },
            [
                aulas
            ]
        );


    // ==================================================
    // OPÇÕES DE PROFESSOR
    // ==================================================

    const professoresDisponiveis =
        useMemo(
            () => {

                const mapa =
                    new Map();


                aulas.forEach(
                    (aula) => {

                        const chave =
                            chaveProfessor(
                                aula
                            );


                        if (
                            chave
                            &&
                            aula.professor_nome
                            &&
                            !mapa.has(
                                chave
                            )
                        ) {

                            mapa.set(
                                chave,
                                aula.professor_nome
                            );
                        }
                    }
                );


                return Array.from(
                    mapa.entries()
                )
                    .map(
                        ([
                            value,
                            label
                        ]) => ({
                            value,
                            label
                        })
                    )
                    .sort(
                        (a, b) =>
                            a.label.localeCompare(
                                b.label,
                                'pt-BR'
                            )
                    );

            },
            [
                aulas
            ]
        );


    // ==================================================
    // FILTRAGEM E ORDENAÇÃO
    // ==================================================

    const aulasFiltradas =
        useMemo(
            () => {

                return aulas
                    .filter(
                        (aula) => {

                            if (
                                dataInicial
                                &&
                                aula.data_aula
                                <
                                dataInicial
                            ) {
                                return false;
                            }


                            if (
                                dataFinal
                                &&
                                aula.data_aula
                                >
                                dataFinal
                            ) {
                                return false;
                            }


                            if (
                                statusSelecionado
                                &&
                                aula.status
                                !==
                                statusSelecionado
                            ) {
                                return false;
                            }


                            if (
                                turmaSelecionada
                                &&
                                chaveTurma(
                                    aula
                                )
                                !==
                                turmaSelecionada
                            ) {
                                return false;
                            }


                            if (
                                professorSelecionado
                                &&
                                chaveProfessor(
                                    aula
                                )
                                !==
                                professorSelecionado
                            ) {
                                return false;
                            }


                            if (
                                tipoSelecionado
                                &&
                                aula.tipo
                                !==
                                tipoSelecionado
                            ) {
                                return false;
                            }


                            return true;
                        }
                    )
                    .sort(
                        (a, b) => {

                            const dataHoraA =
                                `${a.data_aula || ''} ${a.hora_inicio || ''}`;


                            const dataHoraB =
                                `${b.data_aula || ''} ${b.hora_inicio || ''}`;


                            const comparacao =
                                dataHoraB.localeCompare(
                                    dataHoraA
                                );


                            if (
                                comparacao
                                !==
                                0
                            ) {
                                return comparacao;
                            }


                            return (
                                Number(
                                    b.id
                                )
                                -
                                Number(
                                    a.id
                                )
                            );
                        }
                    );

            },
            [
                aulas,
                dataInicial,
                dataFinal,
                statusSelecionado,
                turmaSelecionada,
                professorSelecionado,
                tipoSelecionado
            ]
        );


    // ==================================================
    // PAGINAÇÃO
    // ==================================================

    const totalPaginas =
        Math.max(
            1,
            Math.ceil(
                aulasFiltradas.length
                /
                ITENS_POR_PAGINA
            )
        );


    useEffect(
        () => {

            setPaginaAtual(
                1
            );

        },
        [
            dataInicial,
            dataFinal,
            statusSelecionado,
            turmaSelecionada,
            professorSelecionado,
            tipoSelecionado
        ]
    );


    useEffect(
        () => {

            if (
                paginaAtual
                >
                totalPaginas
            ) {

                setPaginaAtual(
                    totalPaginas
                );
            }

        },
        [
            paginaAtual,
            totalPaginas
        ]
    );


    const aulasDaPagina =
        useMemo(
            () => {

                const inicio =
                    (
                        paginaAtual
                        -
                        1
                    )
                    *
                    ITENS_POR_PAGINA;


                return aulasFiltradas.slice(
                    inicio,
                    inicio
                    +
                    ITENS_POR_PAGINA
                );

            },
            [
                aulasFiltradas,
                paginaAtual
            ]
        );


    // ==================================================
    // FILTROS ATIVOS
    // ==================================================

    const possuiFiltros =
        Boolean(
            dataInicial
            ||
            dataFinal
            ||
            statusSelecionado
            ||
            turmaSelecionada
            ||
            professorSelecionado
            ||
            tipoSelecionado
        );


    function limparFiltros() {

        setDataInicial('');
        setDataFinal('');
        setStatusSelecionado('');
        setTurmaSelecionada('');
        setProfessorSelecionado('');
        setTipoSelecionado('');
        setPaginaAtual(1);
    }


    // ==================================================
    // INTERFACE
    // ==================================================

    return (

        <div className="pagina">


            {/* =====================================
                CABEÇALHO
            ====================================== */}

            <header className="pagina-header">

                <div>

                    <h1>
                        Aulas
                    </h1>


                    <p>
                        Consulte a relação de aulas criadas e acesse o histórico de cada aula.
                    </p>

                </div>

            </header>


            {/* =====================================
                FILTROS
            ====================================== */}

            <section className="aulas-filtros-card">

                <div className="aulas-filtros-cabecalho">

                    <div>

                        <strong>
                            Filtros
                        </strong>


                        <span>
                            Refine a relação por período, situação, turma, professor ou tipo.
                        </span>

                    </div>


                    <button
                        type="button"
                        className="botao-secundario"
                        onClick={
                            limparFiltros
                        }
                        disabled={
                            !possuiFiltros
                        }
                    >
                        Limpar filtros
                    </button>

                </div>


                <div className="aulas-filtros-grid">

                    <div className="campo-formulario">

                        <label htmlFor="aulas-data-inicial">
                            Data inicial
                        </label>


                        <input
                            id="aulas-data-inicial"
                            type="date"
                            value={
                                dataInicial
                            }
                            onChange={
                                (evento) =>
                                    setDataInicial(
                                        evento.target.value
                                    )
                            }
                        />

                    </div>


                    <div className="campo-formulario">

                        <label htmlFor="aulas-data-final">
                            Data final
                        </label>


                        <input
                            id="aulas-data-final"
                            type="date"
                            value={
                                dataFinal
                            }
                            min={
                                dataInicial
                                ||
                                undefined
                            }
                            onChange={
                                (evento) =>
                                    setDataFinal(
                                        evento.target.value
                                    )
                            }
                        />

                    </div>


                    <div className="campo-formulario">

                        <label htmlFor="aulas-status">
                            Status
                        </label>


                        <select
                            id="aulas-status"
                            value={
                                statusSelecionado
                            }
                            onChange={
                                (evento) =>
                                    setStatusSelecionado(
                                        evento.target.value
                                    )
                            }
                        >

                            <option value="">
                                Todos
                            </option>

                            <option value="agendada">
                                Agendada
                            </option>

                            <option value="aberta">
                                Aberta
                            </option>

                            <option value="encerrada">
                                Encerrada
                            </option>

                            <option value="cancelada">
                                Cancelada
                            </option>

                        </select>

                    </div>


                    <div className="campo-formulario">

                        <label htmlFor="aulas-turma">
                            Turma
                        </label>


                        <select
                            id="aulas-turma"
                            value={
                                turmaSelecionada
                            }
                            onChange={
                                (evento) =>
                                    setTurmaSelecionada(
                                        evento.target.value
                                    )
                            }
                        >

                            <option value="">
                                Todas
                            </option>


                            {
                                turmasDisponiveis.map(
                                    (turma) => (

                                        <option
                                            key={
                                                turma.value
                                            }
                                            value={
                                                turma.value
                                            }
                                        >
                                            {turma.label}
                                        </option>
                                    )
                                )
                            }

                        </select>

                    </div>


                    <div className="campo-formulario">

                        <label htmlFor="aulas-professor">
                            Professor
                        </label>


                        <select
                            id="aulas-professor"
                            value={
                                professorSelecionado
                            }
                            onChange={
                                (evento) =>
                                    setProfessorSelecionado(
                                        evento.target.value
                                    )
                            }
                        >

                            <option value="">
                                Todos
                            </option>


                            {
                                professoresDisponiveis.map(
                                    (professor) => (

                                        <option
                                            key={
                                                professor.value
                                            }
                                            value={
                                                professor.value
                                            }
                                        >
                                            {professor.label}
                                        </option>
                                    )
                                )
                            }

                        </select>

                    </div>


                    <div className="campo-formulario">

                        <label htmlFor="aulas-tipo">
                            Tipo
                        </label>


                        <select
                            id="aulas-tipo"
                            value={
                                tipoSelecionado
                            }
                            onChange={
                                (evento) =>
                                    setTipoSelecionado(
                                        evento.target.value
                                    )
                            }
                        >

                            <option value="">
                                Todos
                            </option>

                            <option value="regular">
                                Regular
                            </option>

                            <option value="reposicao">
                                Reposição
                            </option>

                            <option value="extra">
                                Extra
                            </option>

                        </select>

                    </div>

                </div>

            </section>


            {/* =====================================
                ERRO
            ====================================== */}

            {
                erro
                &&
                (

                    <div className="mensagem-erro aulas-erro">
                        {erro}
                    </div>

                )
            }


            {/* =====================================
                CARREGAMENTO
            ====================================== */}

            {
                carregando

                    ? (

                        <div className="estado-pagina">

                            <div className="spinner" />


                            <p>
                                Carregando aulas...
                            </p>

                        </div>

                    )

                    : (

                        <>

                            {/* =========================
                                CABEÇALHO DA RELAÇÃO
                            ========================== */}

                            <div className="aulas-lista-cabecalho">

                                <div>

                                    <strong>
                                        {
                                            aulasFiltradas.length
                                        }
                                        {' '}
                                        aula(s) encontrada(s)
                                    </strong>


                                    <span>
                                        Ordenadas da mais recente para a mais antiga.
                                    </span>

                                </div>


                                {
                                    aulas.length
                                    !==
                                    aulasFiltradas.length
                                    &&
                                    (

                                        <span className="aulas-total-geral">
                                            Total cadastrado: {aulas.length}
                                        </span>

                                    )
                                }

                            </div>


                            {/* =========================
                                LISTA VAZIA
                            ========================== */}

                            {
                                aulasFiltradas.length
                                ===
                                0

                                    ? (

                                        <section className="aulas-vazia">

                                            <strong>
                                                Nenhuma aula encontrada
                                            </strong>


                                            <p>
                                                Ajuste os filtros ou consulte a Agenda para criar e acompanhar as aulas do dia.
                                            </p>

                                        </section>

                                    )

                                    : (

                                        <section className="aulas-lista">

                                            {
                                                aulasDaPagina.map(
                                                    (aula) => (

                                                        <article
                                                            className="aulas-item"
                                                            key={
                                                                aula.id
                                                            }
                                                        >

                                                            {/* DATA / HORÁRIO */}

                                                            <div className="aulas-item-data">

                                                                <strong>
                                                                    {
                                                                        formatarData(
                                                                            aula.data_aula
                                                                        )
                                                                    }
                                                                </strong>


                                                                <span>
                                                                    {
                                                                        formatarHora(
                                                                            aula.hora_inicio
                                                                        )
                                                                    }
                                                                    {' às '}
                                                                    {
                                                                        formatarHora(
                                                                            aula.hora_fim
                                                                        )
                                                                    }
                                                                </span>

                                                            </div>


                                                            {/* INFORMAÇÕES */}

                                                            <div className="aulas-item-info">

                                                                <div className="aulas-item-titulo">

                                                                    <h2>
                                                                        {
                                                                            aula.turma_nome
                                                                            ||
                                                                            'Turma sem nome'
                                                                        }
                                                                    </h2>


                                                                    <span
                                                                        className={
                                                                            `aula-status ${aula.status}`
                                                                        }
                                                                    >
                                                                        {
                                                                            nomeStatus(
                                                                                aula.status
                                                                            )
                                                                        }
                                                                    </span>

                                                                </div>


                                                                <span>
                                                                    {
                                                                        aula.modalidade_nome
                                                                        ||
                                                                        'Sem modalidade'
                                                                    }

                                                                    {' • '}

                                                                    {
                                                                        aula.professor_nome
                                                                        ||
                                                                        'Sem professor'
                                                                    }
                                                                </span>


                                                                <small>
                                                                    {
                                                                        nomeTipo(
                                                                            aula.tipo
                                                                        )
                                                                    }


                                                                    {
                                                                        aula.horario_id
                                                                        &&
                                                                        (
                                                                            <>
                                                                                {' • '}
                                                                                Gerada automaticamente
                                                                            </>
                                                                        )
                                                                    }
                                                                </small>

                                                            </div>


                                                            {/* AÇÃO */}

                                                            <div className="aulas-item-acoes">

                                                                <Link
                                                                    to={
                                                                        `/aulas/${aula.id}`
                                                                    }
                                                                    className="botao-secundario"
                                                                >
                                                                    Abrir ficha
                                                                </Link>

                                                            </div>

                                                        </article>
                                                    )
                                                )
                                            }

                                        </section>

                                    )
                            }


                            {/* =========================
                                PAGINAÇÃO
                            ========================== */}

                            {
                                aulasFiltradas.length
                                >
                                ITENS_POR_PAGINA
                                &&
                                (

                                    <nav
                                        className="aulas-paginacao"
                                        aria-label="Paginação das aulas"
                                    >

                                        <button
                                            type="button"
                                            className="botao-secundario"
                                            onClick={
                                                () =>
                                                    setPaginaAtual(
                                                        (pagina) =>
                                                            Math.max(
                                                                1,
                                                                pagina - 1
                                                            )
                                                    )
                                            }
                                            disabled={
                                                paginaAtual
                                                ===
                                                1
                                            }
                                        >
                                            ← Anterior
                                        </button>


                                        <span>
                                            Página {paginaAtual} de {totalPaginas}
                                        </span>


                                        <button
                                            type="button"
                                            className="botao-secundario"
                                            onClick={
                                                () =>
                                                    setPaginaAtual(
                                                        (pagina) =>
                                                            Math.min(
                                                                totalPaginas,
                                                                pagina + 1
                                                            )
                                                    )
                                            }
                                            disabled={
                                                paginaAtual
                                                ===
                                                totalPaginas
                                            }
                                        >
                                            Próxima →
                                        </button>

                                    </nav>

                                )
                            }

                        </>

                    )
            }

        </div>
    );
}


export default Aulas;
