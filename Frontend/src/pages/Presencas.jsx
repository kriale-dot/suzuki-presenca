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


import DataInputBR
    from '../components/DataInputBR';


function Presencas() {

    // ==================================================
    // DATA DE HOJE
    //
    // Internamente:
    // YYYY-MM-DD
    //
    // Exibição:
    // DD/MM/AAAA
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
        busca,
        setBusca
    ] = useState('');


    const [
        carregando,
        setCarregando
    ] = useState(true);


    const [
        carregandoResumos,
        setCarregandoResumos
    ] = useState(false);


    const [
        erro,
        setErro
    ] = useState('');


    /*
     * Estrutura:
     *
     * {
     *     1: {
     *         total: 3,
     *         presentes: 2,
     *         ausentes: 1,
     *         justificadas: 0,
     *         nao_registrados: 0
     *     }
     * }
     */
    const [
        resumos,
        setResumos
    ] = useState({});


    // ==================================================
    // CARREGA TODAS AS AULAS
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
                        'Erro ao carregar aulas:',
                        erro
                    );


                    setErro(
                        erro.message
                        ||
                        'Não foi possível carregar as aulas.'
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
    // AULAS DA DATA SELECIONADA
    // ==================================================

    const aulasDoDia =
        useMemo(
            () => {

                const texto =
                    busca
                        .trim()
                        .toLowerCase();


                return aulas

                    .filter(
                        (aula) =>
                            aula.data_aula
                            ===
                            dataSelecionada
                    )

                    .filter(
                        (aula) => {

                            if (!texto) {
                                return true;
                            }


                            const campos = [

                                aula.turma_nome,

                                aula.modalidade_nome,

                                aula.professor_nome,

                                aula.tipo,

                                aula.status

                            ]
                                .filter(Boolean)
                                .join(' ')
                                .toLowerCase();


                            return campos.includes(
                                texto
                            );
                        }
                    )

                    .sort(
                        (a, b) =>
                            (
                                a.hora_inicio
                                ||
                                ''
                            ).localeCompare(
                                b.hora_inicio
                                ||
                                ''
                            )
                    );

            },
            [
                aulas,
                dataSelecionada,
                busca
            ]
        );


    // ==================================================
    // BUSCA OS RESUMOS DE PRESENÇA
    // ==================================================

    useEffect(() => {

        let cancelado =
            false;


        async function carregarResumos() {

            const aulasConsultar =
                aulasDoDia.filter(
                    (aula) =>
                        aula.status === 'aberta'
                        ||
                        aula.status === 'encerrada'
                );


            if (
                aulasConsultar.length === 0
            ) {

                setResumos({});


                setCarregandoResumos(
                    false
                );


                return;
            }


            try {

                setCarregandoResumos(
                    true
                );


                const resultados =
                    await Promise.all(

                        aulasConsultar.map(
                            async (aula) => {

                                try {

                                    const resposta =
                                        await apiGet(
                                            `/aulas/${aula.id}/presencas`
                                        );


                                    return {

                                        aulaId:
                                            aula.id,

                                        resumo:
                                            resposta.resumo || {

                                                total:
                                                    0,

                                                presentes:
                                                    0,

                                                ausentes:
                                                    0,

                                                justificadas:
                                                    0,

                                                nao_registrados:
                                                    0

                                            }

                                    };

                                } catch (erro) {

                                    console.error(
                                        `Erro ao carregar presenças da aula ${aula.id}:`,
                                        erro
                                    );


                                    return {

                                        aulaId:
                                            aula.id,

                                        resumo: {

                                            erro:
                                                true

                                        }

                                    };
                                }
                            }
                        )
                    );


                if (cancelado) {
                    return;
                }


                const novoObjeto = {};


                resultados.forEach(
                    (resultado) => {

                        novoObjeto[
                            resultado.aulaId
                        ] =
                            resultado.resumo;
                    }
                );


                setResumos(
                    novoObjeto
                );

            } finally {

                if (!cancelado) {

                    setCarregandoResumos(
                        false
                    );
                }
            }
        }


        carregarResumos();


        return () => {

            cancelado =
                true;
        };

    }, [
        aulasDoDia
    ]);


    // ==================================================
    // RESUMO GERAL DO DIA
    // ==================================================

    const resumoGeral =
        useMemo(
            () => {

                const resultado = {

                    aulas:
                        aulasDoDia.length,

                    presentes:
                        0,

                    ausentes:
                        0,

                    justificadas:
                        0,

                    naoRegistrados:
                        0

                };


                aulasDoDia.forEach(
                    (aula) => {

                        const resumo =
                            resumos[
                                aula.id
                            ];


                        if (
                            !resumo
                            ||
                            resumo.erro
                        ) {

                            return;
                        }


                        resultado.presentes +=
                            Number(
                                resumo.presentes
                                ||
                                0
                            );


                        resultado.ausentes +=
                            Number(
                                resumo.ausentes
                                ||
                                0
                            );


                        resultado.justificadas +=
                            Number(
                                resumo.justificadas
                                ||
                                0
                            );


                        resultado.naoRegistrados +=
                            Number(
                                resumo.nao_registrados
                                ||
                                0
                            );
                    }
                );


                return resultado;

            },
            [
                aulasDoDia,
                resumos
            ]
        );


    // ==================================================
    // FORMATA DATA
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


    // ==================================================
    // FORMATA HORA
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


    // ==================================================
    // NOME DO STATUS
    // ==================================================

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


        return nomes[
            status
        ] || status;
    }


    // ==================================================
    // ALTERA O DIA
    //
    // dataSelecionada continua no formato YYYY-MM-DD.
    // ==================================================

    function mudarDia(
        quantidade
    ) {

        const data =
            new Date(
                `${dataSelecionada}T12:00:00`
            );


        data.setDate(
            data.getDate()
            +
            quantidade
        );


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


        setDataSelecionada(
            `${ano}-${mes}-${dia}`
        );
    }


    // ==================================================
    // INTERFACE
    // ==================================================

    return (

        <div className="pagina">


            {/* =====================================
                CABEÇALHO
            ====================================== */}

            <header
                className=
                    "pagina-header"
            >

                <div>

                    <h1>
                        Presenças
                    </h1>


                    <p>
                        Consulte os registros
                        de presença das aulas.
                    </p>

                </div>

            </header>


            {/* =====================================
                FILTROS
            ====================================== */}

            <section
                className=
                    "presencas-filtros"
            >

                <div
                    className=
                        "presencas-navegacao-data"
                >

                    {/* DIA ANTERIOR */}

                    <button
                        type=
                            "button"

                        className=
                            "botao-secundario"

                        onClick={
                            () =>
                                mudarDia(
                                    -1
                                )
                        }

                        title=
                            "Dia anterior"
                    >
                        ←
                    </button>


                    {/* DATA */}

                    <div
                        className=
                            "campo-formulario presencas-data"
                    >

                        <label
                            htmlFor=
                                "presencas-data"
                        >
                            Data
                        </label>


                        <DataInputBR
                            id=
                                "presencas-data"

                            value={
                                dataSelecionada
                            }

                            onChange={
                                setDataSelecionada
                            }

                            required
                        />

                    </div>


                    {/* PRÓXIMO DIA */}

                    <button
                        type=
                            "button"

                        className=
                            "botao-secundario"

                        onClick={
                            () =>
                                mudarDia(
                                    1
                                )
                        }

                        title=
                            "Próximo dia"
                    >
                        →
                    </button>


                    {/* HOJE */}

                    <button
                        type=
                            "button"

                        className=
                            "botao-secundario"

                        onClick={
                            () =>
                                setDataSelecionada(
                                    obterHoje()
                                )
                        }
                    >
                        Hoje
                    </button>

                </div>


                {/* BUSCA */}

                <div
                    className=
                        "campo-busca presencas-busca"
                >

                    <span>
                        ⌕
                    </span>


                    <input
                        type=
                            "search"

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

            </section>


            {/* =====================================
                DATA ATUAL
            ====================================== */}

            <div
                className=
                    "presencas-data-titulo"
            >

                Registros de{' '}

                <strong>
                    {
                        formatarData(
                            dataSelecionada
                        )
                    }
                </strong>

            </div>


            {/* =====================================
                RESUMO
            ====================================== */}

            <section
                className=
                    "relatorio-presenca-resumo"
            >

                <div
                    className=
                        "relatorio-presenca-card"
                >

                    <span>
                        Aulas
                    </span>

                    <strong>
                        {
                            resumoGeral.aulas
                        }
                    </strong>

                </div>


                <div
                    className=
                        "relatorio-presenca-card presente"
                >

                    <span>
                        Presentes
                    </span>

                    <strong>
                        {
                            resumoGeral.presentes
                        }
                    </strong>

                </div>


                <div
                    className=
                        "relatorio-presenca-card ausente"
                >

                    <span>
                        Ausentes
                    </span>

                    <strong>
                        {
                            resumoGeral.ausentes
                        }
                    </strong>

                </div>


                <div
                    className=
                        "relatorio-presenca-card justificada"
                >

                    <span>
                        Justificadas
                    </span>

                    <strong>
                        {
                            resumoGeral.justificadas
                        }
                    </strong>

                </div>


                <div
                    className=
                        "relatorio-presenca-card pendente"
                >

                    <span>
                        Não registrados
                    </span>

                    <strong>
                        {
                            resumoGeral.naoRegistrados
                        }
                    </strong>

                </div>

            </section>


            {/* =====================================
                ERRO
            ====================================== */}

            {
                erro
                &&
                (

                    <div
                        className=
                            "mensagem-erro presencas-erro"
                    >

                        <strong>
                            Não foi possível carregar
                            as presenças.
                        </strong>


                        <span>
                            {erro}
                        </span>


                        <div>

                            <button
                                type=
                                    "button"

                                className=
                                    "botao-secundario"

                                onClick={
                                    carregarAulas
                                }
                            >
                                Tentar novamente
                            </button>

                        </div>

                    </div>

                )
            }


            {/* =====================================
                CARREGAMENTO
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
                                Carregando presenças...
                            </p>

                        </div>

                    )

                    : aulasDoDia.length === 0

                        ? (

                            <section
                                className=
                                    "presencas-vazio"
                            >

                                <strong>
                                    Nenhuma aula encontrada
                                </strong>


                                <p>
                                    Não existem aulas nesta
                                    data com os filtros atuais.
                                </p>

                            </section>

                        )

                        : (

                            /* =============================
                               LISTA DE AULAS
                            ============================== */

                            <section
                                className=
                                    "relatorio-presenca-lista"
                            >

                                {
                                    aulasDoDia.map(
                                        (aula) => {

                                            const resumo =
                                                resumos[
                                                    aula.id
                                                ];


                                            return (

                                                <article
                                                    className=
                                                        "relatorio-presenca-aula"

                                                    key={
                                                        aula.id
                                                    }
                                                >

                                                    {/* HORÁRIO */}

                                                    <div
                                                        className=
                                                            "relatorio-presenca-hora"
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


                                                    {/* AULA */}

                                                    <div
                                                        className=
                                                            "relatorio-presenca-info"
                                                    >

                                                        <div
                                                            className=
                                                                "relatorio-presenca-titulo"
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

                                                    </div>


                                                    {/* RESUMO */}

                                                    <div
                                                        className=
                                                            "relatorio-presenca-numeros"
                                                    >

                                                        {
                                                            aula.status
                                                            ===
                                                            'agendada'

                                                                ? (

                                                                    <span
                                                                        className=
                                                                            "relatorio-presenca-mensagem"
                                                                    >
                                                                        Aguardando abertura
                                                                    </span>

                                                                )

                                                                : aula.status
                                                                  ===
                                                                  'cancelada'

                                                                    ? (

                                                                        <span
                                                                            className=
                                                                                "relatorio-presenca-mensagem cancelada"
                                                                        >
                                                                            Aula cancelada
                                                                        </span>

                                                                    )

                                                                    : carregandoResumos
                                                                      &&
                                                                      !resumo

                                                                        ? (

                                                                            <span
                                                                                className=
                                                                                    "relatorio-presenca-mensagem"
                                                                            >
                                                                                Carregando...
                                                                            </span>

                                                                        )

                                                                        : resumo?.erro

                                                                            ? (

                                                                                <span
                                                                                    className=
                                                                                        "relatorio-presenca-mensagem erro"
                                                                                >
                                                                                    Erro ao carregar
                                                                                </span>

                                                                            )

                                                                            : (

                                                                                <>

                                                                                    <div>

                                                                                        <span>
                                                                                            Presentes
                                                                                        </span>

                                                                                        <strong>
                                                                                            {
                                                                                                resumo?.presentes
                                                                                                ||
                                                                                                0
                                                                                            }
                                                                                        </strong>

                                                                                    </div>


                                                                                    <div>

                                                                                        <span>
                                                                                            Ausentes
                                                                                        </span>

                                                                                        <strong>
                                                                                            {
                                                                                                resumo?.ausentes
                                                                                                ||
                                                                                                0
                                                                                            }
                                                                                        </strong>

                                                                                    </div>


                                                                                    <div>

                                                                                        <span>
                                                                                            Justificadas
                                                                                        </span>

                                                                                        <strong>
                                                                                            {
                                                                                                resumo?.justificadas
                                                                                                ||
                                                                                                0
                                                                                            }
                                                                                        </strong>

                                                                                    </div>


                                                                                    <div>

                                                                                        <span>
                                                                                            Pendentes
                                                                                        </span>

                                                                                        <strong>
                                                                                            {
                                                                                                resumo?.nao_registrados
                                                                                                ||
                                                                                                0
                                                                                            }
                                                                                        </strong>

                                                                                    </div>

                                                                                </>

                                                                            )
                                                        }

                                                    </div>


                                                    {/* AÇÃO */}

                                                    <div
                                                        className=
                                                            "relatorio-presenca-acao"
                                                    >

                                                        <Link
                                                            to={
                                                                `/aulas/${aula.id}`
                                                            }

                                                            className=
                                                                "botao-secundario"
                                                        >
                                                            Ver aula
                                                        </Link>

                                                    </div>

                                                </article>

                                            );
                                        }
                                    )
                                }

                            </section>

                        )
            }

        </div>
    );
}


export default Presencas;