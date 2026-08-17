import {
    useCallback,
    useEffect,
    useRef,
    useState
} from 'react';


import {
    useParams
} from 'react-router';


import {
    apiArquivoUrl,
    apiGet,
    apiPost
} from '../services/api';


function TabletPresenca() {

    // ==================================================
    // PARÂMETROS DA URL
    //
    // Exemplo:
    //
    // /tablet/tablet-sala-1/aulas/4
    //
    // identificador = tablet-sala-1
    // aulaId        = 4
    // ==================================================

    const {
        identificador,
        aulaId
    } = useParams();


    // ==================================================
    // DADOS DA TELA
    // ==================================================

    const [
        dados,
        setDados
    ] = useState(null);


    // ==================================================
    // CARREGAMENTO
    // ==================================================

    const [
        carregando,
        setCarregando
    ] = useState(true);


    // ==================================================
    // ERROS
    // ==================================================

    const [
        erro,
        setErro
    ] = useState('');


    const [
        erroRegistro,
        setErroRegistro
    ] = useState('');


    // ==================================================
    // DISPONIBILIDADE DA AULA
    //
    // true  = pode registrar presença
    // false = não pode registrar presença
    // ==================================================

    const [
        disponivel,
        setDisponivel
    ] = useState(false);


    // ==================================================
    // CONTROLE DA ATUALIZAÇÃO AUTOMÁTICA
    //
    // Quando recebemos 409 porque a aula está fechada,
    // paramos o polling para não gerar requisições
    // repetidamente no console.
    // ==================================================

    const [
        atualizacaoAutomatica,
        setAtualizacaoAutomatica
    ] = useState(true);


    // ==================================================
    // ALUNO SENDO REGISTRADO
    // ==================================================

    const [
        registrandoId,
        setRegistrandoId
    ] = useState(null);


    // ==================================================
    // ALUNO SENDO DESMARCADO
    // ==================================================

    const [
        desmarcandoId,
        setDesmarcandoId
    ] = useState(null);


    // ==================================================
    // CARTÃO SENDO PRESSIONADO POR 5 SEGUNDOS
    // ==================================================

    const [
        pressionandoId,
        setPressionandoId
    ] = useState(null);


    // ==================================================
    // MENSAGEM APÓS DESFAZER UMA MARCAÇÃO
    // ==================================================

    const [
        mensagemCorrecao,
        setMensagemCorrecao
    ] = useState('');


    // ==================================================
    // TELA DE CONFIRMAÇÃO
    // ==================================================

    const [
        confirmacao,
        setConfirmacao
    ] = useState(null);


    // ==================================================
    // TIMER DA CONFIRMAÇÃO
    // ==================================================

    const timerConfirmacao =
        useRef(null);


    // ==================================================
    // TIMER DO TOQUE LONGO PARA DESFAZER PRESENÇA
    // ==================================================

    const timerDesmarcar =
        useRef(null);


    // ==================================================
    // TIMER DA MENSAGEM DE CORREÇÃO
    // ==================================================

    const timerMensagemCorrecao =
        useRef(null);


    // ==================================================
    // CARREGA A TELA DO TABLET
    // ==================================================

    const carregarTablet =
        useCallback(
            async (
                mostrarCarregando = true
            ) => {

                try {

                    // ----------------------------------
                    // Mostra carregamento somente quando
                    // necessário.
                    //
                    // Nas atualizações automáticas não
                    // queremos fazer a tela piscar.
                    // ----------------------------------

                    if (
                        mostrarCarregando
                    ) {

                        setCarregando(
                            true
                        );
                    }


                    setErro('');


                    // ----------------------------------
                    // Consulta a API.
                    // ----------------------------------

                    const resposta =
                        await apiGet(
                            `/tablet/${identificador}/aulas/${aulaId}`
                        );


                    // ----------------------------------
                    // Aula disponível.
                    // ----------------------------------

                    setDados(
                        resposta
                    );


                    setDisponivel(
                        true
                    );


                    /*
                     * Se a aula voltou a ficar acessível,
                     * permitimos novamente o polling.
                     */
                    setAtualizacaoAutomatica(
                        true
                    );

                } catch (erro) {

                    // ==================================
                    // 409 = AULA NÃO ESTÁ ABERTA
                    //
                    // Esse não é um erro inesperado.
                    //
                    // A aula existe, mas seu estado
                    // atual não permite registro.
                    // ==================================

                    if (
                        erro.status === 409
                    ) {

                        setDisponivel(
                            false
                        );


                        /*
                         * Eliminamos os dados antigos da
                         * tela para não deixar os cartões
                         * dos alunos visíveis como se a
                         * aula ainda estivesse aberta.
                         */
                        setDados(
                            null
                        );


                        setErro(
                            erro.message
                            ||
                            'Esta aula não está aberta para registro de presença.'
                        );


                        /*
                         * Muito importante:
                         *
                         * paramos de consultar a API a
                         * cada 15 segundos.
                         *
                         * Isso evita:
                         *
                         * 409
                         * 409
                         * 409
                         * 409...
                         */
                        setAtualizacaoAutomatica(
                            false
                        );


                        return;
                    }


                    // ==================================
                    // OUTROS ERROS
                    // ==================================

                    console.error(
                        'Erro ao carregar tablet:',
                        erro
                    );


                    setDisponivel(
                        false
                    );


                    setErro(
                        erro.message
                        ||
                        'Não foi possível carregar esta aula.'
                    );

                } finally {

                    if (
                        mostrarCarregando
                    ) {

                        setCarregando(
                            false
                        );
                    }
                }
            },
            [
                identificador,
                aulaId
            ]
        );


    // ==================================================
    // CARREGAMENTO INICIAL
    // ==================================================

    useEffect(() => {

        carregarTablet();

    }, [
        carregarTablet
    ]);


    // ==================================================
    // ATUALIZAÇÃO AUTOMÁTICA
    //
    // A cada 15 segundos verificamos:
    //
    // - novos registros
    // - alterações feitas pelo professor
    // - encerramento da aula
    //
    // Se o backend responder 409, o próprio
    // carregarTablet() desativa este mecanismo.
    // ==================================================

    useEffect(() => {

        if (
            !atualizacaoAutomatica
        ) {

            return undefined;
        }


        const intervalo =
            window.setInterval(
                () => {

                    /*
                     * Não atualizamos enquanto:
                     *
                     * - uma presença está sendo enviada;
                     * - a confirmação está na tela.
                     */

                    if (
                        registrandoId === null
                        &&
                        desmarcandoId === null
                        &&
                        pressionandoId === null
                        &&
                        !confirmacao
                    ) {

                        carregarTablet(
                            false
                        );
                    }

                },
                15000
            );


        return () => {

            window.clearInterval(
                intervalo
            );
        };

    }, [
        carregarTablet,
        registrandoId,
        desmarcandoId,
        pressionandoId,
        confirmacao,
        atualizacaoAutomatica
    ]);


    // ==================================================
    // LIMPEZA DO TIMER DE CONFIRMAÇÃO
    // ==================================================

    useEffect(() => {

        return () => {

            if (
                timerConfirmacao.current
            ) {

                window.clearTimeout(
                    timerConfirmacao.current
                );
            }


            if (
                timerDesmarcar.current
            ) {

                window.clearTimeout(
                    timerDesmarcar.current
                );
            }


            if (
                timerMensagemCorrecao.current
            ) {

                window.clearTimeout(
                    timerMensagemCorrecao.current
                );
            }
        };

    }, []);


    // ==================================================
    // INICIAIS DO ALUNO
    //
    // Ana Beatriz -> AB
    //
    // João       -> JO
    // ==================================================

    function obterIniciais(
        nome
    ) {

        if (!nome) {
            return '';
        }


        const partes =
            nome
                .trim()
                .split(' ')
                .filter(Boolean);


        if (
            partes.length === 1
        ) {

            return partes[0]
                .substring(
                    0,
                    2
                )
                .toUpperCase();
        }


        return (

            partes[0][0]

            +

            partes[
            partes.length - 1
            ][0]

        ).toUpperCase();
    }


    // ==================================================
    // FORMATA HORÁRIO
    //
    // 14:00:00 -> 14:00
    // ==================================================

    function formatarHora(
        hora
    ) {

        if (!hora) {
            return '';
        }


        return hora.substring(
            0,
            5
        );
    }


    // ==================================================
    // REGISTRAR PRESENÇA
    // ==================================================

    async function registrarPresenca(
        aluno
    ) {

        // ----------------------------------------------
        // Não permite registrar se:
        //
        // - já existe presença;
        // - outra requisição está acontecendo;
        // - aula não está disponível.
        // ----------------------------------------------

        if (
            aluno.registrado
            ||
            registrandoId !== null
            ||
            !disponivel
        ) {

            return;
        }


        try {

            setRegistrandoId(
                aluno.aula_aluno_id
            );


            setErroRegistro('');


            // ------------------------------------------
            // Envia somente o identificador do aluno
            // dentro daquela aula.
            // ------------------------------------------

            const resposta =
                await apiPost(
                    `/tablet/${identificador}/aulas/${aulaId}/presencas`,
                    {
                        aula_aluno_id:
                            aluno.aula_aluno_id
                    }
                );


            // ==========================================
            // ATUALIZA IMEDIATAMENTE A TELA
            //
            // Não esperamos a próxima consulta de
            // 15 segundos.
            // ==========================================

            setDados(
                (dadosAtuais) => {

                    if (
                        !dadosAtuais
                    ) {

                        return dadosAtuais;
                    }


                    return {

                        ...dadosAtuais,


                        alunos:
                            (
                                dadosAtuais.alunos
                                ||
                                []
                            ).map(
                                (item) => {

                                    if (
                                        item.aula_aluno_id
                                        ===
                                        aluno.aula_aluno_id
                                    ) {

                                        return {

                                            ...item,

                                            registrado:
                                                true,

                                            presente:
                                                true
                                        };
                                    }


                                    return item;
                                }
                            )
                    };
                }
            );


            // ==========================================
            // CONFIRMAÇÃO PARA A CRIANÇA
            // ==========================================

            setConfirmacao({

                nome:
                    resposta.aluno?.nome
                    ||
                    aluno.nome,

                fotoUrl:
                    aluno.foto_url
                    ||
                    null,

                mensagem:
                    resposta.mensagem
                    ||
                    'Presença registrada!'

            });


            // ------------------------------------------
            // Limpa um eventual timer anterior.
            // ------------------------------------------

            if (
                timerConfirmacao.current
            ) {

                window.clearTimeout(
                    timerConfirmacao.current
                );
            }


            // ------------------------------------------
            // Depois de 2,5 segundos voltamos
            // automaticamente à lista.
            // ------------------------------------------

            timerConfirmacao.current =
                window.setTimeout(
                    () => {

                        setConfirmacao(
                            null
                        );


                        /*
                         * Atualizamos novamente a lista
                         * para garantir sincronização com
                         * o backend.
                         */
                        carregarTablet(
                            false
                        );

                    },
                    2500
                );

        } catch (erro) {

            // ==========================================
            // A AULA PODE TER SIDO ENCERRADA
            // EXATAMENTE DURANTE O TOQUE
            // ==========================================

            if (
                erro.status === 409
            ) {

                setErroRegistro(
                    erro.message
                    ||
                    'Não foi possível registrar esta presença.'
                );


                /*
                 * Consultamos novamente a aula.
                 *
                 * Se ela tiver sido encerrada,
                 * carregarTablet() receberá o 409
                 * e colocará a interface no estado
                 * "Presença indisponível".
                 */
                await carregarTablet(
                    false
                );


                return;
            }


            // ==========================================
            // OUTROS ERROS
            // ==========================================

            console.error(
                'Erro ao registrar presença:',
                erro
            );


            setErroRegistro(
                erro.message
                ||
                'Não foi possível registrar a presença.'
            );

        } finally {

            setRegistrandoId(
                null
            );
        }
    }

    // ==================================================
    // CANCELAR TOQUE LONGO
    // ==================================================

    function cancelarPressao() {

        if (
            timerDesmarcar.current
        ) {

            window.clearTimeout(
                timerDesmarcar.current
            );

            timerDesmarcar.current =
                null;
        }


        setPressionandoId(
            null
        );
    }


    // ==================================================
    // DESFAZER PRESENÇA REGISTRADA PELO ALUNO
    //
    // Só é chamada depois de o cartão permanecer
    // pressionado por 5 segundos.
    // ==================================================

    async function desfazerPresenca(
        aluno
    ) {

        if (
            !aluno.registrado
            ||
            !aluno.presente
            ||
            registrandoId !== null
            ||
            desmarcandoId !== null
            ||
            !disponivel
        ) {

            return;
        }


        try {

            setDesmarcandoId(
                aluno.aula_aluno_id
            );


            setErroRegistro('');


            const resposta =
                await apiPost(
                    `/tablet/${identificador}/aulas/${aulaId}/presencas/desfazer`,
                    {
                        aula_aluno_id:
                            aluno.aula_aluno_id
                    }
                );


            // ------------------------------------------
            // Atualiza imediatamente o cartão.
            // ------------------------------------------

            setDados(
                (dadosAtuais) => {

                    if (
                        !dadosAtuais
                    ) {

                        return dadosAtuais;
                    }


                    return {

                        ...dadosAtuais,

                        alunos:
                            (
                                dadosAtuais.alunos
                                ||
                                []
                            ).map(
                                (item) => {

                                    if (
                                        item.aula_aluno_id
                                        ===
                                        aluno.aula_aluno_id
                                    ) {

                                        return {

                                            ...item,

                                            registrado:
                                                false,

                                            presente:
                                                false
                                        };
                                    }


                                    return item;
                                }
                            )
                    };
                }
            );


            const mensagem =
                resposta.mensagem
                ||
                'Marcação desfeita. Agora o aluno correto pode registrar a presença.';


            setMensagemCorrecao(
                mensagem
            );


            if (
                timerMensagemCorrecao.current
            ) {

                window.clearTimeout(
                    timerMensagemCorrecao.current
                );
            }


            timerMensagemCorrecao.current =
                window.setTimeout(
                    () => {

                        setMensagemCorrecao('');

                    },
                    3500
                );


            // ------------------------------------------
            // Confere a situação novamente no backend.
            // ------------------------------------------

            await carregarTablet(
                false
            );

        } catch (erro) {

            if (
                erro.status === 409
            ) {

                setErroRegistro(
                    erro.message
                    ||
                    'Esta presença não pode ser desfeita pelo tablet. Peça ajuda ao professor.'
                );


                await carregarTablet(
                    false
                );


                return;
            }


            console.error(
                'Erro ao desfazer presença:',
                erro
            );


            setErroRegistro(
                erro.message
                ||
                'Não foi possível desfazer a presença.'
            );

        } finally {

            setDesmarcandoId(
                null
            );
        }
    }


    // ==================================================
    // INICIAR TOQUE LONGO DE 5 SEGUNDOS
    // ==================================================

    function iniciarPressao(
        evento,
        aluno
    ) {

        if (
            !aluno.registrado
            ||
            !aluno.presente
            ||
            registrandoId !== null
            ||
            desmarcandoId !== null
            ||
            !disponivel
        ) {

            return;
        }


        evento.preventDefault();


        cancelarPressao();


        setPressionandoId(
            aluno.aula_aluno_id
        );


        timerDesmarcar.current =
            window.setTimeout(
                () => {

                    timerDesmarcar.current =
                        null;


                    setPressionandoId(
                        null
                    );


                    desfazerPresenca(
                        aluno
                    );

                },
                5000
            );
    }


    // ==================================================
    // TELA CHEIA
    // ==================================================

    async function entrarTelaCheia() {

        try {

            if (
                document.fullscreenElement
            ) {

                await document.exitFullscreen();

                return;
            }


            await document.documentElement
                .requestFullscreen();

        } catch (erro) {

            console.error(
                'Não foi possível ativar tela cheia:',
                erro
            );
        }
    }

    // ==================================================
    // TENTAR NOVAMENTE
    //
    // Usado quando a tela está indisponível.
    //
    // Exemplo:
    //
    // professor ainda não abriu a aula
    //             ↓
    // tablet mostra indisponível
    //             ↓
    // professor abre a aula
    //             ↓
    // criança/professor toca em
    // "Tentar novamente"
    // ==================================================

    function tentarNovamente() {

        setAtualizacaoAutomatica(
            true
        );


        setErroRegistro('');


        carregarTablet(
            true
        );
    }


    // ==================================================
    // CARREGANDO
    // ==================================================

    if (
        carregando
        &&
        !dados
    ) {

        return (

            <main
                className=
                "tablet-presenca-page"
            >

                <div
                    className=
                    "tablet-estado-central"
                >

                    <div
                        className=
                        "tablet-spinner"
                    />


                    <h1>
                        Preparando a aula...
                    </h1>


                    <p>
                        Só um instante.
                    </p>

                </div>

            </main>
        );
    }


    // ==================================================
    // AULA NÃO DISPONÍVEL
    //
    // Exemplos:
    //
    // - aula ainda agendada
    // - aula encerrada
    // - aula cancelada
    // - tablet não autorizado
    // ==================================================

    if (!dados) {

        return (

            <main
                className=
                "tablet-presenca-page"
            >

                <div
                    className=
                    "tablet-estado-central"
                >

                    <div
                        className=
                        "tablet-estado-icone"
                    >
                        ♫
                    </div>


                    <h1>
                        Presença indisponível
                    </h1>


                    <p>

                        {
                            erro
                            ||
                            'Esta aula não está disponível para registro de presença.'
                        }

                    </p>


                    <button
                        type="button"

                        className=
                        "tablet-botao-tentar"

                        onClick={
                            tentarNovamente
                        }
                    >
                        Tentar novamente
                    </button>

                </div>

            </main>
        );
    }


    // ==================================================
    // ALUNOS
    // ==================================================

    const alunos =
        dados.alunos || [];


    // ==================================================
    // TELA DE CONFIRMAÇÃO
    //
    // Aparece por aproximadamente 2,5 segundos.
    // ==================================================

    if (confirmacao) {

        /*
         * Mostramos somente o primeiro nome.
         *
         * Ana Beatriz -> Ana
         */

        const primeiroNome =
            confirmacao.nome
                ?.trim()
                .split(' ')[0]
            ||
            'Aluno';


        return (

            <main
                className=
                "tablet-presenca-page tablet-confirmacao-page"
            >

                <div
                    className=
                    "tablet-confirmacao"
                >

                    <div
                        className=
                            "tablet-confirmacao-avatar"
                    >

                        {
                            confirmacao.fotoUrl

                                ? (
                                    <img
                                        src={
                                            apiArquivoUrl(
                                                confirmacao.fotoUrl
                                            )
                                        }
                                        alt={
                                            confirmacao.nome
                                            ||
                                            ''
                                        }
                                    />
                                )

                                : (
                                    <span>
                                        {
                                            obterIniciais(
                                                confirmacao.nome
                                                ||
                                                'Aluno'
                                            )
                                        }
                                    </span>
                                )
                        }

                    </div>


                    <div
                        className=
                            "tablet-confirmacao-check"
                    >
                        ✓
                    </div>


                    <h1>
                        Pronto, {
                            primeiroNome
                        }!
                    </h1>


                    <p>
                        {
                            confirmacao.mensagem
                        }
                    </p>


                    <span>
                        Boa aula! ♫
                    </span>

                </div>

            </main>
        );
    }


    // ==================================================
    // INTERFACE PRINCIPAL
    // ==================================================

    return (

        <main
            className=
            "tablet-presenca-page"
        >

            {/* =====================================
                CABEÇALHO
            ====================================== */}

            <header
                className=
                "tablet-header"
            >

                {/* MARCA */}

                <div
                    className=
                    "tablet-marca"
                >

                    <div
                        className=
                        "tablet-marca-icone"
                    >
                        ♫
                    </div>


                    <div>

                        <strong>
                            Estúdio Suzuki
                        </strong>


                        <span>
                            Presença
                        </span>

                    </div>

                </div>


                {/* AULA */}

                <div className="tablet-header-direita">

                    <div
                        className=
                        "tablet-aula-info"
                    >

                        <strong>

                            {
                                dados.aula?.turma
                            }

                        </strong>


                        <span>

                            {
                                formatarHora(
                                    dados.aula?.hora_inicio
                                )
                            }

                            {' — '}

                            {
                                formatarHora(
                                    dados.aula?.hora_fim
                                )
                            }

                        </span>

                    </div>


                    <button
                        type="button"

                        className=
                        "tablet-tela-cheia"

                        onClick={
                            entrarTelaCheia
                        }

                        title=
                        "Ativar tela cheia"
                    >
                        ⛶ Tela cheia
                    </button>

                </div>

            </header>


            {/* =====================================
                CONTEÚDO
            ====================================== */}

            <section
                className=
                "tablet-conteudo"
            >

                {/* =================================
                    INSTRUÇÃO
                ================================== */}

                <div
                    className=
                    "tablet-instrucao"
                >

                    <span
                        className=
                        "tablet-instrucao-icone"
                    >
                        👋
                    </span>


                    <div>

                        <h1>
                            Toque no seu nome
                        </h1>


                        <p>
                            Encontre você na lista
                            e toque uma vez. Se alguém
                            marcou a foto errada, segure
                            o cartão verde por 5 segundos
                            para desfazer.
                        </p>

                    </div>

                </div>


                {/* =================================
                    AVISO GERAL
                ================================== */}

                {
                    erro
                    &&
                    (

                        <div
                            className=
                            "tablet-aviso"
                        >

                            <strong>
                                Atenção
                            </strong>


                            <span>
                                {erro}
                            </span>

                        </div>

                    )
                }


                {/* =================================
                    ERRO AO REGISTRAR
                ================================== */}

                {
                    erroRegistro
                    &&
                    (

                        <div
                            className=
                            "tablet-aviso tablet-aviso-registro"
                        >

                            <strong>
                                Não foi possível registrar
                            </strong>


                            <span>
                                {erroRegistro}
                            </span>

                        </div>

                    )
                }


                {/* =================================
                    CORREÇÃO CONCLUÍDA
                ================================== */}

                {
                    mensagemCorrecao
                    &&
                    (

                        <div
                            className=
                            "tablet-aviso tablet-aviso-sucesso"
                        >

                            <strong>
                                Marcação corrigida
                            </strong>


                            <span>
                                {mensagemCorrecao}
                            </span>

                        </div>

                    )
                }


                {/* =================================
                    SEM ALUNOS
                ================================== */}

                {
                    alunos.length === 0

                        ? (

                            <div
                                className=
                                "tablet-sem-alunos"
                            >

                                <span>
                                    ♫
                                </span>


                                <h2>
                                    Nenhum aluno nesta aula
                                </h2>


                                <p>
                                    Peça ajuda ao professor.
                                </p>

                            </div>

                        )

                        : (

                            // =============================
                            // GRID DE ALUNOS
                            // =============================

                            <div
                                className=
                                "tablet-alunos-grid"
                            >

                                {
                                    alunos.map(
                                        (aluno) => {

                                            /*
                                             * O backend atual já converte
                                             * registrado e presente para
                                             * boolean.
                                             *
                                             * Mesmo assim usamos comparação
                                             * explícita para deixar a regra
                                             * clara.
                                             */

                                            const registrado =
                                                aluno.registrado
                                                === true;


                                            const presente =
                                                aluno.presente
                                                === true;


                                            const registrando =
                                                registrandoId
                                                ===
                                                aluno.aula_aluno_id;


                                            const desmarcando =
                                                desmarcandoId
                                                ===
                                                aluno.aula_aluno_id;


                                            const pressionando =
                                                pressionandoId
                                                ===
                                                aluno.aula_aluno_id;


                                            // --------------------------
                                            // Classe visual do cartão.
                                            // --------------------------

                                            let classeStatus =
                                                '';


                                            if (
                                                registrado
                                                &&
                                                presente
                                            ) {

                                                classeStatus =
                                                    ' registrado';


                                                if (
                                                    pressionando
                                                ) {

                                                    classeStatus +=
                                                        ' pressionando';
                                                }


                                                if (
                                                    desmarcando
                                                ) {

                                                    classeStatus +=
                                                        ' desmarcando';
                                                }

                                            } else if (
                                                registrado
                                                &&
                                                !presente
                                            ) {

                                                classeStatus =
                                                    ' verificar';
                                            }


                                            return (

                                                <button
                                                    type="button"

                                                    key={
                                                        aluno.aula_aluno_id
                                                    }

                                                    className={
                                                        `tablet-aluno-card${classeStatus}`
                                                    }

                                                    onClick={
                                                        () =>
                                                            registrarPresenca(
                                                                aluno
                                                            )
                                                    }

                                                    onPointerDown={
                                                        (evento) =>
                                                            iniciarPressao(
                                                                evento,
                                                                aluno
                                                            )
                                                    }

                                                    onPointerUp={
                                                        cancelarPressao
                                                    }

                                                    onPointerCancel={
                                                        cancelarPressao
                                                    }

                                                    onPointerLeave={
                                                        cancelarPressao
                                                    }

                                                    onContextMenu={
                                                        (evento) =>
                                                            evento.preventDefault()
                                                    }

                                                    disabled={
                                                        registrandoId !== null
                                                        ||
                                                        desmarcandoId !== null
                                                        ||
                                                        !disponivel
                                                        ||
                                                        (
                                                            registrado
                                                            &&
                                                            !presente
                                                        )
                                                    }
                                                >

                                                    {/* =================
                                                    FOTO / AVATAR
                                                ================== */}

                                                    <div
                                                        className=
                                                        "tablet-aluno-avatar"
                                                    >

                                                        {
                                                            aluno.foto_url

                                                                ? (

                                                                    <img
                                                                        src={
                                                                            apiArquivoUrl(
                                                                                aluno.foto_url
                                                                            )
                                                                        }

                                                                        alt={
                                                                            aluno.nome
                                                                        }
                                                                    />

                                                                )

                                                                : (

                                                                    <span>

                                                                        {
                                                                            obterIniciais(
                                                                                aluno.nome
                                                                            )
                                                                        }

                                                                    </span>

                                                                )
                                                        }

                                                    </div>


                                                    {/* =================
                                                    NOME
                                                ================== */}

                                                    <strong
                                                        className=
                                                        "tablet-aluno-nome"
                                                    >

                                                        {
                                                            aluno.nome
                                                        }

                                                    </strong>


                                                    {/* =================
                                                    STATUS
                                                ================== */}

                                                    <div
                                                        className=
                                                        "tablet-aluno-status"
                                                    >

                                                        {
                                                            registrando

                                                                ? (

                                                                    <>

                                                                        <span
                                                                            className=
                                                                            "tablet-mini-spinner"
                                                                        />

                                                                        Registrando...

                                                                    </>

                                                                )

                                                                : desmarcando

                                                                    ? (

                                                                        <>

                                                                            <span
                                                                                className=
                                                                                "tablet-mini-spinner"
                                                                            />

                                                                            Desfazendo...

                                                                        </>

                                                                    )

                                                                    : pressionando

                                                                        ? (

                                                                            <>

                                                                                <span>
                                                                                    ⏳
                                                                                </span>

                                                                                Continue segurando...

                                                                            </>

                                                                        )

                                                                        : registrado
                                                                            &&
                                                                            presente

                                                                            ? (

                                                                                <>

                                                                                    <span>
                                                                                        ✓
                                                                                    </span>

                                                                                    <span
                                                                                        className=
                                                                                        "tablet-status-textos"
                                                                                    >
                                                                                        <strong>
                                                                                            Presença registrada
                                                                                        </strong>

                                                                                        <small>
                                                                                            Segure 5s para corrigir
                                                                                        </small>
                                                                                    </span>

                                                                                </>

                                                                            )

                                                                    : registrado
                                                                        &&
                                                                        !presente

                                                                        ? (

                                                                            <>

                                                                                <span>
                                                                                    !
                                                                                </span>

                                                                                Fale com o professor

                                                                            </>

                                                                        )

                                                                        : (

                                                                            <>

                                                                                <span>
                                                                                    →
                                                                                </span>

                                                                                Sou eu

                                                                            </>

                                                                        )
                                                        }

                                                    </div>

                                                </button>

                                            );
                                        }
                                    )
                                }

                            </div>

                        )
                }

            </section>


            {/* =====================================
                RODAPÉ
            ====================================== */}

            <footer
                className=
                "tablet-footer"
            >

                <span>

                    {
                        dados.dispositivo?.nome
                        ||
                        'Tablet'
                    }

                </span>


                <span>
                    Suzuki Presença
                </span>

            </footer>

        </main>
    );
}


export default TabletPresenca;