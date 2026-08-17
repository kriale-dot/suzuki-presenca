import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from 'react';


import {
    Link,
    useParams
} from 'react-router';


import {
    QRCodeSVG
} from 'qrcode.react';


import {
    apiGet,
    apiPost,
    apiPut
} from '../services/api';


function AulaDetalhes() {

    const { id } =
        useParams();


    // ==================================================
    // CONFIGURAÇÃO DO TABLET
    // ==================================================

    const identificadorTablet =
        import.meta.env
            .VITE_TABLET_IDENTIFICADOR
        ||
        'tablet-sala-1';


    // ==================================================
    // ESTADOS
    // ==================================================

    const [
        aula,
        setAula
    ] = useState(null);


    const [
        presencas,
        setPresencas
    ] = useState([]);


    const [
        resumo,
        setResumo
    ] = useState({
        total: 0,
        presentes: 0,
        ausentes: 0,
        justificadas: 0,
        nao_registrados: 0
    });


    const [
        carregando,
        setCarregando
    ] = useState(true);


    const [
        erro,
        setErro
    ] = useState('');


    const [
        processando,
        setProcessando
    ] = useState(false);


    const [
        processandoAlunoId,
        setProcessandoAlunoId
    ] = useState(null);


    const [
        mensagemSucesso,
        setMensagemSucesso
    ] = useState('');


    // ==================================================
    // ORIGEM DO FRONTEND PARA O TABLET
    //
    // Se VITE_TABLET_BASE_URL estiver configurada,
    // usamos diretamente.
    //
    // Caso contrário, aproveitamos a origem de
    // VITE_TABLET_LOGIN_URL.
    //
    // Exemplo:
    //
    // VITE_TABLET_LOGIN_URL=
    // http://192.168.15.8:5173/login
    //
    // Origem:
    // http://192.168.15.8:5173
    // ==================================================

    const origemTablet =
        useMemo(
            () => {

                // --------------------------------------
                // OPÇÃO 1
                // URL BASE ESPECÍFICA
                // --------------------------------------

                const baseConfigurada =
                    import.meta.env
                        .VITE_TABLET_BASE_URL;


                if (baseConfigurada) {

                    return baseConfigurada.replace(
                        /\/$/,
                        ''
                    );
                }


                // --------------------------------------
                // OPÇÃO 2
                // EXTRAI A ORIGEM DA URL DE LOGIN
                // --------------------------------------

                const loginConfigurado =
                    import.meta.env
                        .VITE_TABLET_LOGIN_URL;


                if (loginConfigurado) {

                    try {

                        return new URL(
                            loginConfigurado
                        ).origin;

                    } catch (erro) {

                        console.warn(
                            'VITE_TABLET_LOGIN_URL inválida:',
                            erro
                        );
                    }
                }


                // --------------------------------------
                // OPÇÃO 3
                // ENDEREÇO ATUAL DO FRONTEND
                // --------------------------------------

                return window.location.origin;

            },
            []
        );


    // ==================================================
    // URL DO TABLET PARA ESTA AULA
    //
    // Exemplo:
    //
    // http://192.168.15.8:5173
    // /tablet/tablet-sala-1/aulas/6
    // ==================================================

    const urlTablet =
        useMemo(
            () => {

                if (!aula) {

                    return '';
                }


                return (
                    `${origemTablet}`
                    +
                    `/tablet/${
                        encodeURIComponent(
                            identificadorTablet
                        )
                    }`
                    +
                    `/aulas/${
                        encodeURIComponent(
                            aula.id
                        )
                    }`
                );

            },
            [
                aula,
                origemTablet,
                identificadorTablet
            ]
        );


    // ==================================================
    // CARREGA A AULA E AS PRESENÇAS
    // ==================================================

    const carregar =
        useCallback(
            async () => {

                try {

                    setCarregando(
                        true
                    );


                    setErro('');


                    const [
                        respostaAula,
                        respostaPresencas
                    ] =
                        await Promise.all([

                            apiGet(
                                `/aulas/${id}`
                            ),

                            apiGet(
                                `/aulas/${id}/presencas`
                            )

                        ]);


                    setAula(
                        respostaAula.dados
                    );


                    setPresencas(
                        respostaPresencas.dados
                        ||
                        []
                    );


                    setResumo(
                        respostaPresencas.resumo
                        ||
                        {
                            total: 0,
                            presentes: 0,
                            ausentes: 0,
                            justificadas: 0,
                            nao_registrados: 0
                        }
                    );

                } catch (erro) {

                    console.error(
                        'Erro ao carregar aula:',
                        erro
                    );


                    setErro(
                        erro.message
                        ||
                        'Não foi possível carregar a aula.'
                    );

                } finally {

                    setCarregando(
                        false
                    );
                }
            },
            [
                id
            ]
        );


    // ==================================================
    // CARREGAMENTO INICIAL
    // ==================================================

    useEffect(
        () => {

            carregar();

        },
        [
            carregar
        ]
    );


    // ==================================================
    // MENSAGEM DE SUCESSO
    // ==================================================

    useEffect(
        () => {

            if (!mensagemSucesso) {

                return undefined;
            }


            const timer =
                setTimeout(
                    () =>
                        setMensagemSucesso(
                            ''
                        ),
                    3000
                );


            return () =>
                clearTimeout(
                    timer
                );

        },
        [
            mensagemSucesso
        ]
    );


    // ==================================================
    // FORMATAR DATA
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
        ] =
            data.split('-');


        return `${dia}/${mes}/${ano}`;
    }


    // ==================================================
    // FORMATAR HORA
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


        return nomes[status]
            ||
            status;
    }


    // ==================================================
    // ALTERAR PRESENÇA
    // ==================================================

    async function alterarPresenca(
        aluno,
        situacao
    ) {

        try {

            setProcessandoAlunoId(
                aluno.aula_aluno_id
            );


            setErro('');


            await apiPut(
                `/aulas/${id}/presencas/${aluno.aula_aluno_id}`,
                {
                    situacao,

                    observacao:
                        null
                }
            );


            await carregar();

        } catch (erro) {

            console.error(
                'Erro ao alterar presença:',
                erro
            );


            setErro(
                erro.message
                ||
                'Não foi possível alterar a presença.'
            );

        } finally {

            setProcessandoAlunoId(
                null
            );
        }
    }


    // ==================================================
    // ABRIR AULA
    // ==================================================

    async function abrirAula() {

        try {

            setProcessando(
                true
            );


            setErro('');


            await apiPost(
                `/aulas/${id}/abrir`,
                {}
            );


            await carregar();


            setMensagemSucesso(
                'Aula aberta com sucesso.'
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

            setProcessando(
                false
            );
        }
    }


    // ==================================================
    // ENCERRAR AULA
    // ==================================================

    async function encerrarAula() {

        const confirmou =
            window.confirm(
                'Encerrar esta aula? Alunos ainda não registrados serão marcados como ausentes.'
            );


        if (!confirmou) {

            return;
        }


        try {

            setProcessando(
                true
            );


            setErro('');


            const resposta =
                await apiPost(
                    `/aulas/${id}/encerrar`,
                    {}
                );


            await carregar();


            setMensagemSucesso(
                `Aula encerrada. ${
                    resposta.ausencias_registradas
                    ??
                    0
                } ausência(s) registrada(s) automaticamente.`
            );

        } catch (erro) {

            console.error(
                'Erro ao encerrar aula:',
                erro
            );


            setErro(
                erro.message
                ||
                'Não foi possível encerrar a aula.'
            );

        } finally {

            setProcessando(
                false
            );
        }
    }


    // ==================================================
    // ABRIR TELA DO TABLET
    //
    // Agora utiliza a URL absoluta preparada para
    // acesso pela rede.
    //
    // Portanto, mesmo que a administração esteja
    // aberta em localhost, o tablet poderá receber
    // uma URL como:
    //
    // http://192.168.15.8:5173/...
    // ==================================================

    function abrirTelaTablet() {

        if (!urlTablet) {

            return;
        }


        const janela =
            window.open(
                urlTablet,
                '_blank',
                'noopener,noreferrer'
            );


        if (janela) {

            janela.opener =
                null;
        }
    }


    // ==================================================
    // ORDENA ALUNOS
    // ==================================================

    const alunosOrdenados =
        useMemo(
            () => {

                return [
                    ...presencas
                ].sort(
                    (a, b) =>
                        (
                            a.aluno_nome
                            ||
                            ''
                        ).localeCompare(
                            b.aluno_nome
                            ||
                            '',
                            'pt-BR'
                        )
                );

            },
            [
                presencas
            ]
        );


    // ==================================================
    // CARREGANDO
    // ==================================================

    if (
        carregando
        &&
        !aula
    ) {

        return (

            <div className="estado-pagina">

                <div className="spinner" />


                <p>
                    Carregando aula...
                </p>

            </div>
        );
    }


    // ==================================================
    // ERRO PRINCIPAL
    // ==================================================

    if (!aula) {

        return (

            <div className="pagina">

                <Link
                    to="/agenda"

                    className="voltar-link"
                >
                    ← Voltar para agenda
                </Link>


                <div className="mensagem-erro">

                    {erro}

                </div>

            </div>
        );
    }


    // ==================================================
    // INTERFACE
    // ==================================================

    return (

        <div className="pagina">


            {/* =====================================
                MENSAGEM DE SUCESSO
            ====================================== */}

            {
                mensagemSucesso
                &&
                (

                    <div className="toast-sucesso">

                        <span className="toast-icone">
                            ✓
                        </span>


                        {mensagemSucesso}

                    </div>

                )
            }


            {/* =====================================
                VOLTAR
            ====================================== */}

            <Link
                to="/agenda"

                className="voltar-link"
            >
                ← Voltar para agenda
            </Link>


            {/* =====================================
                CABEÇALHO
            ====================================== */}

            <header className="aula-detalhes-header">

                <div>

                    <div className="titulo-com-status">

                        <h1>

                            {
                                aula.turma_nome
                            }

                        </h1>


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


                    <p>

                        {
                            formatarData(
                                aula.data_aula
                            )
                        }

                        {' • '}

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

                    </p>


                    <span className="aula-professor">

                        {
                            aula.professor_nome
                        }

                    </span>

                </div>


                {/* =================================
                    AÇÕES DA AULA
                ================================== */}

                <div className="aula-detalhes-acoes">


                    {/* -----------------------------
                        AULA AGENDADA
                    ------------------------------ */}

                    {
                        aula.status
                        ===
                        'agendada'
                        &&
                        (

                            <button
                                type="button"

                                className="botao-primario"

                                onClick={
                                    abrirAula
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

                        )
                    }


                    {/* -----------------------------
                        AULA ABERTA
                    ------------------------------ */}

                    {
                        aula.status
                        ===
                        'aberta'
                        &&
                        (

                            <>

                                <button
                                    type="button"

                                    className="botao-tablet"

                                    onClick={
                                        abrirTelaTablet
                                    }
                                >
                                    ▣ Abrir tela do tablet
                                </button>


                                <button
                                    type="button"

                                    className="botao-primario"

                                    onClick={
                                        encerrarAula
                                    }

                                    disabled={
                                        processando
                                    }
                                >

                                    {
                                        processando
                                            ? 'Encerrando...'
                                            : 'Encerrar aula'
                                    }

                                </button>

                            </>

                        )
                    }

                </div>

            </header>


            {/* =====================================
                ERRO
            ====================================== */}

            {
                erro
                &&
                (

                    <div className="mensagem-erro aula-erro">

                        {erro}

                    </div>

                )
            }


            {/* =====================================
                TABLET + QR CODE
            ====================================== */}

            {
                aula.status
                ===
                'aberta'
                &&
                (

                    <section className="aula-tablet-aviso">


                        {/* ÍCONE */}

                        <div className="aula-tablet-aviso-icone">
                            ▣
                        </div>


                        {/* INFORMAÇÕES */}

                        <div className="aula-tablet-aviso-conteudo">

                            <strong>
                                Tablet disponível
                            </strong>


                            <span>

                                Os alunos já podem registrar
                                a própria presença nesta aula.

                            </span>


                            <small className="aula-tablet-url">

                                {urlTablet}

                            </small>

                        </div>


                        {/* QR CODE / AÇÕES */}

                        <div className="aula-tablet-acoes">

                            <div className="aula-tablet-qrcode">

                                <QRCodeSVG
                                    value={
                                        urlTablet
                                    }

                                    size={
                                        118
                                    }

                                    level="M"

                                    marginSize={
                                        2
                                    }

                                    title=
                                        "Abrir esta aula no tablet"
                                />


                                <span>
                                    Escaneie no tablet
                                </span>

                            </div>


                            <button
                                type="button"

                                className="botao-secundario"

                                onClick={
                                    abrirTelaTablet
                                }
                            >
                                Abrir tablet
                            </button>

                        </div>

                    </section>

                )
            }


            {/* =====================================
                RESUMO
            ====================================== */}

            <section className="presenca-resumo">


                <div className="presenca-resumo-card">

                    <span>
                        Alunos
                    </span>


                    <strong>

                        {
                            resumo.total
                            ||
                            0
                        }

                    </strong>

                </div>


                <div className="presenca-resumo-card">

                    <span>
                        Presentes
                    </span>


                    <strong>

                        {
                            resumo.presentes
                            ||
                            0
                        }

                    </strong>

                </div>


                <div className="presenca-resumo-card">

                    <span>
                        Ausentes
                    </span>


                    <strong>

                        {
                            resumo.ausentes
                            ||
                            0
                        }

                    </strong>

                </div>


                <div className="presenca-resumo-card">

                    <span>
                        Justificadas
                    </span>


                    <strong>

                        {
                            resumo.justificadas
                            ||
                            0
                        }

                    </strong>

                </div>


                <div className="presenca-resumo-card">

                    <span>
                        Não registrados
                    </span>


                    <strong>

                        {
                            resumo.nao_registrados
                            ||
                            0
                        }

                    </strong>

                </div>

            </section>


            {/* =====================================
                PRESENÇAS
            ====================================== */}

            <section className="ficha-card">

                <div className="ficha-card-header">

                    <div>

                        <h2>
                            Presenças
                        </h2>


                        <p>
                            Acompanhe e corrija
                            os registros da aula.
                        </p>

                    </div>

                </div>


                {
                    alunosOrdenados.length
                    ===
                    0

                        ? (

                            <div className="ficha-vazio">

                                <strong>
                                    Nenhum aluno nesta aula
                                </strong>


                                <p>

                                    {
                                        aula.status
                                        ===
                                        'agendada'

                                            ? 'Abra a aula para criar a lista de alunos.'

                                            : 'Esta aula não possui alunos.'
                                    }

                                </p>

                            </div>

                        )

                        : (

                            <div className="presenca-lista">

                                {
                                    alunosOrdenados.map(
                                        (aluno) => {

                                            const situacao =
                                                aluno.situacao;


                                            const processandoAluno =
                                                processandoAlunoId
                                                ===
                                                aluno.aula_aluno_id;


                                            return (

                                                <div
                                                    className="presenca-item"

                                                    key={
                                                        aluno.aula_aluno_id
                                                    }
                                                >


                                                    {/* ALUNO */}

                                                    <div className="presenca-aluno">

                                                        <strong>

                                                            {
                                                                aluno.aluno_nome
                                                            }

                                                        </strong>


                                                        <span>

                                                            {
                                                                situacao

                                                                    ? `Origem: ${
                                                                        aluno.origem
                                                                        ||
                                                                        '—'
                                                                    }`

                                                                    : 'Ainda não registrado'
                                                            }

                                                        </span>

                                                    </div>


                                                    {/* STATUS */}

                                                    <div className="presenca-situacao">

                                                        <span
                                                            className={
                                                                `presenca-badge ${
                                                                    situacao
                                                                    ||
                                                                    'nao-registrada'
                                                                }`
                                                            }
                                                        >

                                                            {
                                                                situacao
                                                                ===
                                                                'presente'

                                                                    ? 'Presente'

                                                                    : situacao
                                                                      ===
                                                                      'ausente'

                                                                        ? 'Ausente'

                                                                        : situacao
                                                                          ===
                                                                          'justificada'

                                                                            ? 'Justificada'

                                                                            : 'Não registrado'
                                                            }

                                                        </span>

                                                    </div>


                                                    {/* AÇÕES */}

                                                    <div className="presenca-acoes">

                                                        <button
                                                            type="button"

                                                            className="botao-presenca"

                                                            onClick={
                                                                () =>
                                                                    alterarPresenca(
                                                                        aluno,
                                                                        'presente'
                                                                    )
                                                            }

                                                            disabled={
                                                                processandoAluno
                                                            }
                                                        >
                                                            Presente
                                                        </button>


                                                        <button
                                                            type="button"

                                                            className="botao-presenca"

                                                            onClick={
                                                                () =>
                                                                    alterarPresenca(
                                                                        aluno,
                                                                        'ausente'
                                                                    )
                                                            }

                                                            disabled={
                                                                processandoAluno
                                                            }
                                                        >
                                                            Ausente
                                                        </button>


                                                        <button
                                                            type="button"

                                                            className="botao-presenca"

                                                            onClick={
                                                                () =>
                                                                    alterarPresenca(
                                                                        aluno,
                                                                        'justificada'
                                                                    )
                                                            }

                                                            disabled={
                                                                processandoAluno
                                                            }
                                                        >
                                                            Justificada
                                                        </button>

                                                    </div>

                                                </div>

                                            );
                                        }
                                    )
                                }

                            </div>

                        )
                }

            </section>

        </div>
    );
}


export default AulaDetalhes;