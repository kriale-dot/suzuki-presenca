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
    apiDelete,
    apiGet,
    apiPost
} from '../services/api';


import AulaModal
    from '../components/AulaModal';


import CancelarAulaModal
    from '../components/CancelarAulaModal';


import GerarAulasModal
    from '../components/GerarAulasModal';


import {
    useAuth
} from '../contexts/AuthContext';


function Agenda() {

    const { possuiPerfil } =
        useAuth();


    // ==================================================
    // DATA DE HOJE
    // ==================================================

    function obterHoje() {

        const hoje =
            new Date();


        const ano =
            hoje.getFullYear();


        const mes =
            String(
                hoje.getMonth() + 1
            ).padStart(
                2,
                '0'
            );


        const dia =
            String(
                hoje.getDate()
            ).padStart(
                2,
                '0'
            );


        return `${ano}-${mes}-${dia}`;
    }


    // ==================================================
    // UTILITÁRIOS DE DATA / PERÍODO
    // ==================================================

    function criarDataLocal(
        dataISO
    ) {

        return new Date(
            `${dataISO}T12:00:00`
        );
    }


    function formatarDataISO(
        data
    ) {

        const ano =
            data.getFullYear();


        const mes =
            String(
                data.getMonth() + 1
            ).padStart(
                2,
                '0'
            );


        const dia =
            String(
                data.getDate()
            ).padStart(
                2,
                '0'
            );


        return `${ano}-${mes}-${dia}`;
    }


    function obterInicioSemana(
        dataISO
    ) {

        const data =
            criarDataLocal(
                dataISO
            );


        const diaSemana =
            data.getDay();


        const deslocamento =
            diaSemana === 0
                ? -6
                : 1 - diaSemana;


        data.setDate(
            data.getDate()
            +
            deslocamento
        );


        return formatarDataISO(
            data
        );
    }


    function obterFimSemana(
        dataISO
    ) {

        const data =
            criarDataLocal(
                obterInicioSemana(
                    dataISO
                )
            );


        data.setDate(
            data.getDate() + 6
        );


        return formatarDataISO(
            data
        );
    }


    function obterInicioMes(
        dataISO
    ) {

        const data =
            criarDataLocal(
                dataISO
            );


        data.setDate(
            1
        );


        return formatarDataISO(
            data
        );
    }


    function obterFimMes(
        dataISO
    ) {

        const data =
            criarDataLocal(
                dataISO
            );


        data.setMonth(
            data.getMonth() + 1,
            0
        );


        return formatarDataISO(
            data
        );
    }


    function mudarPeriodo(
        quantidade
    ) {

        const data =
            criarDataLocal(
                dataSelecionada
            );


        if (
            modoVisualizacao
            ===
            'semana'
        ) {

            data.setDate(
                data.getDate()
                +
                (quantidade * 7)
            );

        } else if (
            modoVisualizacao
            ===
            'mes'
        ) {

            const diaOriginal =
                data.getDate();


            data.setDate(
                1
            );


            data.setMonth(
                data.getMonth()
                +
                quantidade
            );


            const ultimoDiaDoMes =
                new Date(
                    data.getFullYear(),
                    data.getMonth() + 1,
                    0
                ).getDate();


            data.setDate(
                Math.min(
                    diaOriginal,
                    ultimoDiaDoMes
                )
            );

        } else {

            data.setDate(
                data.getDate()
                +
                quantidade
            );
        }


        setDataSelecionada(
            formatarDataISO(
                data
            )
        );
    }


    // ==================================================
    // ESTADOS
    // ==================================================

    const [
        aulas,
        setAulas
    ] = useState([]);


    const [
        dataSelecionada,
        setDataSelecionada
    ] = useState(
        obterHoje()
    );


    const [
        modoVisualizacao,
        setModoVisualizacao
    ] = useState(
        'dia'
    );


    const [
        carregando,
        setCarregando
    ] = useState(true);


    const [
        erro,
        setErro
    ] = useState('');


    const [
        mensagemSucesso,
        setMensagemSucesso
    ] = useState('');


    // ==================================================
    // MODAL DE AULA
    // ==================================================

    const [
        modalAula,
        setModalAula
    ] = useState(false);


    const [
        aulaEditando,
        setAulaEditando
    ] = useState(null);


    // ==================================================
    // CANCELAMENTO
    // ==================================================

    const [
        aulaCancelando,
        setAulaCancelando
    ] = useState(null);


    // ==================================================
    // GERAÇÃO AUTOMÁTICA
    // ==================================================

    const [
        modalGeracao,
        setModalGeracao
    ] = useState(false);


    // ==================================================
    // PROCESSAMENTO
    // ==================================================

    const [
        processandoId,
        setProcessandoId
    ] = useState(null);


    // ==================================================
    // CARREGAR AULAS
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
                        resposta.dados || []
                    );

                } catch (erro) {

                    console.error(
                        'Erro ao carregar agenda:',
                        erro
                    );


                    setErro(
                        erro.message
                        ||
                        'Não foi possível carregar a agenda.'
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

    useEffect(() => {

        carregarAulas();

    }, [
        carregarAulas
    ]);


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
                    setMensagemSucesso(
                        ''
                    ),
                4000
            );


        return () =>
            clearTimeout(
                timer
            );

    }, [
        mensagemSucesso
    ]);


    // ==================================================
    // PERÍODO VISÍVEL
    // ==================================================

    const periodoVisivel =
        useMemo(
            () => {

                if (
                    modoVisualizacao
                    ===
                    'semana'
                ) {

                    return {
                        inicio:
                            obterInicioSemana(
                                dataSelecionada
                            ),

                        fim:
                            obterFimSemana(
                                dataSelecionada
                            )
                    };
                }


                if (
                    modoVisualizacao
                    ===
                    'mes'
                ) {

                    return {
                        inicio:
                            obterInicioMes(
                                dataSelecionada
                            ),

                        fim:
                            obterFimMes(
                                dataSelecionada
                            )
                    };
                }


                return {
                    inicio:
                        dataSelecionada,

                    fim:
                        dataSelecionada
                };
            },
            [
                dataSelecionada,
                modoVisualizacao
            ]
        );


    // ==================================================
    // AULAS DO PERÍODO
    // ==================================================

    const aulasDoPeriodo =
        useMemo(
            () => {

                return aulas

                    .filter(
                        (aula) =>
                            aula.data_aula
                            >=
                            periodoVisivel.inicio
                            &&
                            aula.data_aula
                            <=
                            periodoVisivel.fim
                    )

                    .sort(
                        (a, b) => {

                            const comparacaoData =
                                (
                                    a.data_aula
                                    ||
                                    ''
                                ).localeCompare(
                                    b.data_aula
                                    ||
                                    ''
                                );


                            if (
                                comparacaoData
                                !==
                                0
                            ) {
                                return comparacaoData;
                            }


                            return (
                                a.hora_inicio
                                ||
                                ''
                            ).localeCompare(
                                b.hora_inicio
                                ||
                                ''
                            );
                        }
                    );

            },
            [
                aulas,
                periodoVisivel
            ]
        );


    // ==================================================
    // AGRUPAMENTO POR DATA
    // ==================================================

    const aulasPorData =
        useMemo(
            () => {

                const grupos =
                    new Map();


                aulasDoPeriodo.forEach(
                    (aula) => {

                        if (
                            !grupos.has(
                                aula.data_aula
                            )
                        ) {

                            grupos.set(
                                aula.data_aula,
                                []
                            );
                        }


                        grupos
                            .get(
                                aula.data_aula
                            )
                            .push(
                                aula
                            );
                    }
                );


                return grupos;

            },
            [
                aulasDoPeriodo
            ]
        );


    const datasDaSemana =
        useMemo(
            () => {

                if (
                    modoVisualizacao
                    !==
                    'semana'
                ) {
                    return [];
                }


                const datas = [];


                const data =
                    criarDataLocal(
                        periodoVisivel.inicio
                    );


                for (
                    let indice = 0;
                    indice < 7;
                    indice += 1
                ) {

                    datas.push(
                        formatarDataISO(
                            data
                        )
                    );


                    data.setDate(
                        data.getDate() + 1
                    );
                }


                return datas;

            },
            [
                modoVisualizacao,
                periodoVisivel
            ]
        );


    // ==================================================
    // RESUMO DO PERÍODO
    // ==================================================

    const resumo =
        useMemo(
            () => {

                return {

                    total:
                        aulasDoPeriodo.length,


                    abertas:
                        aulasDoPeriodo.filter(
                            (aula) =>
                                aula.status
                                ===
                                'aberta'
                        ).length,


                    agendadas:
                        aulasDoPeriodo.filter(
                            (aula) =>
                                aula.status
                                ===
                                'agendada'
                        ).length

                };

            },
            [
                aulasDoPeriodo
            ]
        );


    // ==================================================
    // FORMATADORES
    // ==================================================

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


    function formatarData(
        data
    ) {

        if (!data) {
            return '';
        }


        const [
            ano,
            mes,
            dia
        ] = data.split('-');


        return `${dia}/${mes}/${ano}`;
    }


    function primeiraLetraMaiuscula(
        texto
    ) {

        if (!texto) {
            return '';
        }


        return texto.charAt(
            0
        ).toUpperCase()
        +
        texto.slice(
            1
        );
    }


    function formatarDataExtenso(
        dataISO
    ) {

        const texto =
            new Intl.DateTimeFormat(
                'pt-BR',
                {
                    weekday:
                        'long',

                    day:
                        '2-digit',

                    month:
                        'long',

                    year:
                        'numeric'
                }
            ).format(
                criarDataLocal(
                    dataISO
                )
            );


        return primeiraLetraMaiuscula(
            texto
        );
    }


    function formatarMesAno(
        dataISO
    ) {

        const texto =
            new Intl.DateTimeFormat(
                'pt-BR',
                {
                    month:
                        'long',

                    year:
                        'numeric'
                }
            ).format(
                criarDataLocal(
                    dataISO
                )
            );


        return primeiraLetraMaiuscula(
            texto
        );
    }


    function tituloPagina() {

        if (
            modoVisualizacao
            ===
            'semana'
        ) {
            return 'Aulas da Semana';
        }


        if (
            modoVisualizacao
            ===
            'mes'
        ) {
            return 'Aulas do Mês';
        }


        return 'Aulas do Dia';
    }


    function descricaoPagina() {

        if (
            modoVisualizacao
            ===
            'semana'
        ) {

            return 'Visualize rapidamente as aulas desta semana e encontre os próximos horários.';
        }


        if (
            modoVisualizacao
            ===
            'mes'
        ) {

            return 'Consulte as aulas do mês e localize com facilidade os próximos compromissos.';
        }


        return 'Consulte, gere, abra e acompanhe as aulas programadas para a data selecionada.';
    }


    function legendaPeriodo() {

        if (
            modoVisualizacao
            ===
            'semana'
        ) {

            return `${formatarData(
                periodoVisivel.inicio
            )} a ${formatarData(
                periodoVisivel.fim
            )}`;
        }


        if (
            modoVisualizacao
            ===
            'mes'
        ) {

            return formatarMesAno(
                dataSelecionada
            );
        }


        return formatarDataExtenso(
            dataSelecionada
        );
    }


    function mensagemPeriodoVazio() {

        if (
            modoVisualizacao
            ===
            'semana'
        ) {
            return 'Nenhuma aula nesta semana';
        }


        if (
            modoVisualizacao
            ===
            'mes'
        ) {
            return 'Nenhuma aula neste mês';
        }


        return `Nenhuma aula em ${formatarData(
            dataSelecionada
        )}`;
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
            || tipo;
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
            || status;
    }


    // ==================================================
    // NOVA AULA
    // ==================================================

    function novaAula() {

        setAulaEditando(
            null
        );


        setModalAula(
            true
        );
    }


    // ==================================================
    // EDITAR AULA
    // ==================================================

    function editarAula(
        aula
    ) {

        setAulaEditando(
            aula
        );


        setModalAula(
            true
        );
    }


    // ==================================================
    // AULA SALVA
    // ==================================================

    async function aulaSalva(
        acao
    ) {

        await carregarAulas();


        setMensagemSucesso(

            acao === 'editada'

                ? 'Aula atualizada com sucesso.'

                : 'Aula agendada com sucesso.'
        );
    }


    // ==================================================
    // AULAS GERADAS AUTOMATICAMENTE
    // ==================================================

    async function aulasGeradas(
        resumoGeracao
    ) {

        await carregarAulas();


        const criadas =
            resumoGeracao?.aulas_criadas
            ??
            0;


        const existentes =
            resumoGeracao?.aulas_ja_existentes
            ??
            0;


        setMensagemSucesso(
            `${criadas} aula(s) criada(s). ${existentes} já existia(m).`
        );
    }


    // ==================================================
    // ABRIR AULA
    // ==================================================

    async function abrirAula(
        aula
    ) {

        const confirmou =
            window.confirm(
                `Abrir a aula de ${aula.turma_nome}?`
            );


        if (!confirmou) {
            return;
        }


        try {

            setProcessandoId(
                aula.id
            );


            setErro('');


            const resposta =
                await apiPost(
                    `/aulas/${aula.id}/abrir`,
                    {}
                );


            await carregarAulas();


            setMensagemSucesso(
                `Aula aberta. ${
                    resposta.alunos_adicionados
                    ??
                    0
                } aluno(s) preparado(s) para presença.`
            );

        } catch (erro) {

            console.error(
                'Erro ao abrir aula:',
                erro
            );


            setErro(
                erro.message
                ||
                'Não foi possível abrir a aula.'
            );

        } finally {

            setProcessandoId(
                null
            );
        }
    }


    // ==================================================
    // AULA CANCELADA
    // ==================================================

    async function aulaCancelada() {

        await carregarAulas();


        setMensagemSucesso(
            'Aula cancelada com sucesso.'
        );
    }


    // ==================================================
    // EXCLUIR AULA DEFINITIVAMENTE
    //
    // Esta opção é destinada apenas a aulas criadas por
    // engano. O backend bloqueia qualquer aula que já
    // tenha sido aberta, possua snapshot de alunos ou
    // registros de presença.
    // ==================================================

    async function excluirAulaDefinitivamente(
        aula
    ) {

        if (
            ![
                'agendada',
                'cancelada'
            ].includes(
                aula.status
            )
        ) {

            window.alert(
                'Somente aulas agendadas ou canceladas podem ser excluídas definitivamente.'
            );

            return;
        }


        const avisoGeracao =
            aula.horario_id

                ? '\n\nEsta aula foi gerada automaticamente. Se você executar novamente a geração para este período, ela poderá ser criada outra vez.'

                : '';


        const confirmou =
            window.confirm(
                `Excluir definitivamente a aula de ${aula.turma_nome} em ${formatarData(aula.data_aula)} às ${formatarHora(aula.hora_inicio)}?\n\nEsta operação não poderá ser desfeita.${avisoGeracao}`
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

            setProcessandoId(
                aula.id
            );


            setErro('');


            const resposta =
                await apiDelete(
                    `/aulas/${aula.id}/definitivo`
                );


            await carregarAulas();


            setMensagemSucesso(
                resposta.mensagem
                ||
                'Aula excluída definitivamente.'
            );

        } catch (erro) {

            console.error(
                'Erro ao excluir aula definitivamente:',
                erro
            );


            window.alert(
                erro.message
                ||
                'Não foi possível excluir definitivamente a aula.'
            );

        } finally {

            setProcessandoId(
                null
            );
        }
    }


    // ==================================================
    // CARD DE AULA
    // ==================================================

    function renderizarAulaCard(
        aula
    ) {

        const processando =
            processandoId
            ===
            aula.id;


        return (

            <article
                className=
                    "agenda-aula-card"

                key={
                    aula.id
                }
            >

                <div
                    className=
                        "agenda-hora"
                >

                    <strong>
                        {
                            formatarHora(
                                aula.hora_inicio
                            )
                        }
                    </strong>


                    <span>
                        {
                            formatarHora(
                                aula.hora_fim
                            )
                        }
                    </span>

                </div>


                <div
                    className=
                        "agenda-aula-info"
                >

                    <div
                        className=
                            "agenda-aula-titulo"
                    >

                        <h2>
                            {
                                aula.turma_nome
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
                        }

                        {' • '}

                        {
                            aula.professor_nome
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


                <div
                    className=
                        "agenda-acoes"
                >

                    <Link
                        to={
                            `/aulas/${aula.id}`
                        }

                        className=
                            "botao-secundario"
                    >
                        Abrir ficha
                    </Link>


                    {
                        aula.status
                        ===
                        'agendada'
                        &&
                        (
                            <>

                                <button
                                    type="button"

                                    className=
                                        "botao-secundario"

                                    onClick={
                                        () =>
                                            editarAula(
                                                aula
                                            )
                                    }

                                    disabled={
                                        processando
                                    }
                                >
                                    Editar
                                </button>


                                <button
                                    type="button"

                                    className=
                                        "botao-primario"

                                    onClick={
                                        () =>
                                            abrirAula(
                                                aula
                                            )
                                    }

                                    disabled={
                                        processando
                                    }
                                >
                                    {
                                        processando
                                            ? 'Abrindo...'
                                            : 'Abrir aula'
                                    }
                                </button>


                                <button
                                    type="button"

                                    className=
                                        "botao-perigo-secundario"

                                    onClick={
                                        () =>
                                            setAulaCancelando(
                                                aula
                                            )
                                    }

                                    disabled={
                                        processando
                                    }
                                >
                                    Cancelar
                                </button>

                            </>
                        )
                    }


                    {
                        possuiPerfil(
                            'administrador',
                            'secretaria'
                        )
                        &&
                        [
                            'agendada',
                            'cancelada'
                        ].includes(
                            aula.status
                        )
                        &&
                        (
                            <button
                                type="button"

                                className=
                                    "botao-perigo-secundario"

                                onClick={
                                    () =>
                                        excluirAulaDefinitivamente(
                                            aula
                                        )
                                }

                                disabled={
                                    processando
                                }
                            >
                                {
                                    processando
                                        ? 'Excluindo...'
                                        : 'Excluir definitivamente'
                                }
                            </button>
                        )
                    }

                </div>

            </article>
        );
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

                <div
                    className=
                        "toast-sucesso"
                >

                    <span
                        className=
                            "toast-icone"
                    >
                        ✓
                    </span>


                    {
                        mensagemSucesso
                    }

                </div>

            )}


            {/* =====================================
                CABEÇALHO
            ====================================== */}

            <header
                className=
                    "pagina-header"
            >

                <div>

                    <h1>
                        {
                            tituloPagina()
                        }
                    </h1>


                    <p>
                        {
                            descricaoPagina()
                        }
                    </p>

                </div>


                <div
                    className=
                        "agenda-header-acoes"
                >

                    <button
                        type="button"

                        className=
                            "botao-secundario"

                        onClick={
                            () =>
                                setModalGeracao(
                                    true
                                )
                        }
                    >
                        ⚙ Gerar aulas
                    </button>


                    <button
                        type="button"

                        className=
                            "botao-primario"

                        onClick={
                            novaAula
                        }
                    >
                        + Nova aula
                    </button>

                </div>

            </header>


            {/* =====================================
                DATA
            ====================================== */}

            <section
                className=
                    "agenda-filtros"
            >

                <button
                    type="button"

                    className=
                        "botao-secundario agenda-seta-data"

                    onClick={
                        () =>
                            mudarPeriodo(
                                -1
                            )
                    }

                    aria-label={
                        modoVisualizacao
                        ===
                        'semana'
                            ? 'Semana anterior'
                            : modoVisualizacao
                                ===
                                'mes'
                                    ? 'Mês anterior'
                                    : 'Dia anterior'
                    }
                >
                    ←
                </button>


                <div
                    className=
                        "campo-formulario agenda-data"
                >

                    <label
                        htmlFor=
                            "agenda-data"
                    >
                        Data
                    </label>


                    <input
                        id=
                            "agenda-data"

                        type="date"

                        value={
                            dataSelecionada
                        }

                        onChange={
                            (evento) =>
                                setDataSelecionada(
                                    evento.target.value
                                )
                        }
                    />

                </div>


                <button
                    type="button"

                    className=
                        "botao-secundario agenda-seta-data"

                    onClick={
                        () =>
                            mudarPeriodo(
                                1
                            )
                    }

                    aria-label={
                        modoVisualizacao
                        ===
                        'semana'
                            ? 'Próxima semana'
                            : modoVisualizacao
                                ===
                                'mes'
                                    ? 'Próximo mês'
                                    : 'Próximo dia'
                    }
                >
                    →
                </button>


                <button
                    type="button"

                    className=
                        "botao-secundario agenda-hoje"

                    onClick={
                        () =>
                            setDataSelecionada(
                                obterHoje()
                            )
                    }
                >
                    Hoje
                </button>


                <div
                    className=
                        "agenda-modos"

                    role="group"

                    aria-label=
                        "Modo de visualização da agenda"
                >

                    {[
                        [
                            'dia',
                            'Dia'
                        ],
                        [
                            'semana',
                            'Semana'
                        ],
                        [
                            'mes',
                            'Mês'
                        ]
                    ].map(
                        ([
                            valor,
                            rotulo
                        ]) => (

                            <button
                                key={
                                    valor
                                }

                                type="button"

                                className={
                                    `agenda-modo ${
                                        modoVisualizacao
                                        ===
                                        valor
                                            ? 'ativo'
                                            : ''
                                    }`
                                }

                                onClick={
                                    () =>
                                        setModoVisualizacao(
                                            valor
                                        )
                                }
                            >
                                {rotulo}
                            </button>
                        )
                    )}

                </div>

            </section>


            <div
                className=
                    "agenda-periodo-atual"
            >
                {
                    legendaPeriodo()
                }
            </div>

            {/* =====================================
                RESUMO
            ====================================== */}

            <section
                className=
                    "agenda-resumo"
            >

                <div
                    className=
                        "agenda-resumo-card"
                >

                    <span>
                        Aulas
                    </span>


                    <strong>
                        {
                            resumo.total
                        }
                    </strong>

                </div>


                <div
                    className=
                        "agenda-resumo-card"
                >

                    <span>
                        Agendadas
                    </span>


                    <strong>
                        {
                            resumo.agendadas
                        }
                    </strong>

                </div>


                <div
                    className=
                        "agenda-resumo-card"
                >

                    <span>
                        Abertas
                    </span>


                    <strong>
                        {
                            resumo.abertas
                        }
                    </strong>

                </div>

            </section>


            {/* =====================================
                ERRO
            ====================================== */}

            {erro && (

                <div
                    className=
                        "mensagem-erro agenda-erro"
                >
                    {erro}
                </div>

            )}


            {/* =====================================
                CARREGAMENTO / LISTA
            ====================================== */}

            {
                carregando

                    ? (

                        <div
                            className=
                                "estado-pagina"
                        >

                            <div
                                className=
                                    "spinner"
                            />


                            <p>
                                Carregando agenda...
                            </p>

                        </div>

                    )

                    : aulasDoPeriodo.length === 0

                        ? (

                            <section
                                className=
                                    "agenda-vazia"
                            >

                                <strong>
                                    {
                                        mensagemPeriodoVazio()
                                    }
                                </strong>


                                <p>
                                    Você pode cadastrar
                                    uma aula manualmente
                                    ou gerar as aulas
                                    automaticamente pelos
                                    horários semanais.
                                </p>

                            </section>

                        )

                        : modoVisualizacao === 'dia'

                            ? (

                                <section
                                    className=
                                        "agenda-lista"
                                >
                                    {
                                        aulasDoPeriodo.map(
                                            renderizarAulaCard
                                        )
                                    }
                                </section>

                            )

                            : (

                                <section
                                    className=
                                        "agenda-periodos-lista"
                                >

                                    {
                                        (
                                            modoVisualizacao
                                            ===
                                            'semana'
                                                ? datasDaSemana
                                                : Array.from(
                                                    aulasPorData.keys()
                                                )
                                        ).map(
                                            (data) => {

                                                const aulasDaData =
                                                    aulasPorData.get(
                                                        data
                                                    )
                                                    ||
                                                    [];


                                                const ehHoje =
                                                    data
                                                    ===
                                                    obterHoje();


                                                return (

                                                    <section
                                                        className={
                                                            `agenda-dia-grupo ${
                                                                ehHoje
                                                                    ? 'hoje'
                                                                    : ''
                                                            }`
                                                        }

                                                        key={
                                                            data
                                                        }
                                                    >

                                                        <header
                                                            className=
                                                                "agenda-dia-header"
                                                        >

                                                            <div>

                                                                <h2>
                                                                    {
                                                                        formatarDataExtenso(
                                                                            data
                                                                        )
                                                                    }
                                                                </h2>


                                                                {
                                                                    ehHoje
                                                                    &&
                                                                    (
                                                                        <span
                                                                            className=
                                                                                "agenda-dia-hoje"
                                                                        >
                                                                            Hoje
                                                                        </span>
                                                                    )
                                                                }

                                                            </div>


                                                            <span
                                                                className=
                                                                    "agenda-dia-contagem"
                                                            >
                                                                {
                                                                    aulasDaData.length
                                                                }
                                                                {' '}
                                                                {
                                                                    aulasDaData.length
                                                                    ===
                                                                    1
                                                                        ? 'aula'
                                                                        : 'aulas'
                                                                }
                                                            </span>

                                                        </header>


                                                        {
                                                            aulasDaData.length === 0

                                                                ? (

                                                                    <div
                                                                        className=
                                                                            "agenda-dia-vazio"
                                                                    >
                                                                        Sem aulas programadas.
                                                                    </div>

                                                                )

                                                                : (

                                                                    <div
                                                                        className=
                                                                            "agenda-lista"
                                                                    >
                                                                        {
                                                                            aulasDaData.map(
                                                                                renderizarAulaCard
                                                                            )
                                                                        }
                                                                    </div>
                                                                )
                                                        }

                                                    </section>
                                                );
                                            }
                                        )
                                    }

                                </section>
                            )
            }


            {/* =====================================
                MODAL NOVA/EDITAR AULA
            ====================================== */}

            <AulaModal

                aberto={
                    modalAula
                }

                aula={
                    aulaEditando
                }

                dataInicial={
                    dataSelecionada
                }

                onFechar={
                    () => {

                        setModalAula(
                            false
                        );


                        setAulaEditando(
                            null
                        );
                    }
                }

                onSalva={
                    aulaSalva
                }

            />


            {/* =====================================
                MODAL CANCELAR AULA
            ====================================== */}

            <CancelarAulaModal

                aberto={
                    Boolean(
                        aulaCancelando
                    )
                }

                aula={
                    aulaCancelando
                }

                onFechar={
                    () =>
                        setAulaCancelando(
                            null
                        )
                }

                onCancelada={
                    aulaCancelada
                }

            />


            {/* =====================================
                MODAL GERAR AULAS
            ====================================== */}

            <GerarAulasModal

                aberto={
                    modalGeracao
                }

                onFechar={
                    () =>
                        setModalGeracao(
                            false
                        )
                }

                onGeradas={
                    aulasGeradas
                }

            />

        </div>
    );
}


export default Agenda;