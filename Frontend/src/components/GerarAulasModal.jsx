import {
    useEffect,
    useState
} from 'react';


import {
    apiGet,
    apiPost
} from '../services/api';


import DataInputBR
    from './DataInputBR';


function GerarAulasModal({
    aberto,
    onFechar,
    onGeradas
}) {

    // ==================================================
    // ESTADOS
    // ==================================================

    const [
        turmas,
        setTurmas
    ] = useState([]);


    const [
        turmaId,
        setTurmaId
    ] = useState('');


    /*
     * IMPORTANTE:
     *
     * As datas continuam armazenadas internamente
     * no formato:
     *
     * YYYY-MM-DD
     *
     * Exemplo:
     *
     * 2026-08-12
     *
     * O DataInputBR cuida apenas da apresentação:
     *
     * 12/08/2026
     */
    const [
        dataInicio,
        setDataInicio
    ] = useState('');


    const [
        dataFim,
        setDataFim
    ] = useState('');


    const [
        carregando,
        setCarregando
    ] = useState(false);


    const [
        gerando,
        setGerando
    ] = useState(false);


    const [
        erro,
        setErro
    ] = useState('');


    // ==================================================
    // DATA DE HOJE
    //
    // Retorna YYYY-MM-DD.
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
    // DATA PADRÃO:
    // TRÊS MESES À FRENTE
    //
    // Também retorna YYYY-MM-DD.
    // ==================================================

    function obterFimPadrao() {

        const data =
            new Date();


        data.setMonth(
            data.getMonth() + 3
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


        return `${ano}-${mes}-${dia}`;
    }


    // ==================================================
    // ABERTURA DO MODAL
    // ==================================================

    useEffect(() => {

        if (!aberto) {
            return;
        }


        setTurmaId('');


        setDataInicio(
            obterHoje()
        );


        setDataFim(
            obterFimPadrao()
        );


        setErro('');


        setGerando(
            false
        );


        // ==============================================
        // CARREGA TURMAS
        // ==============================================

        async function carregarTurmas() {

            try {

                setCarregando(
                    true
                );


                const resposta =
                    await apiGet(
                        '/turmas'
                    );


                setTurmas(
                    resposta.dados || []
                );

            } catch (erro) {

                console.error(
                    'Erro ao carregar turmas:',
                    erro
                );


                setErro(
                    erro.message
                    ||
                    'Não foi possível carregar as turmas.'
                );

            } finally {

                setCarregando(
                    false
                );
            }
        }


        carregarTurmas();

    }, [
        aberto
    ]);


    // ==================================================
    // MODAL FECHADO
    // ==================================================

    if (!aberto) {
        return null;
    }


    // ==================================================
    // TURMAS ATIVAS
    // ==================================================

    const turmasAtivas =
        turmas.filter(
            (turma) =>
                Number(
                    turma.ativo
                ) === 1
        );


    // ==================================================
    // GERAR AULAS
    // ==================================================

    async function gerar(
        evento
    ) {

        evento.preventDefault();


        setErro('');


        // ----------------------------------------------
        // Datas obrigatórias.
        // ----------------------------------------------

        if (
            !dataInicio
            ||
            !dataFim
        ) {

            setErro(
                'Informe o período.'
            );

            return;
        }


        // ----------------------------------------------
        // Como as datas estão armazenadas como
        // YYYY-MM-DD, a comparação textual funciona
        // corretamente.
        // ----------------------------------------------

        if (
            dataFim
            <
            dataInicio
        ) {

            setErro(
                'A data final não pode ser anterior à data inicial.'
            );

            return;
        }


        try {

            setGerando(
                true
            );


            // ==========================================
            // ENVIO PARA A API
            //
            // Mesmo que o usuário esteja vendo:
            //
            // 12/08/2026
            //
            // a API recebe:
            //
            // 2026-08-12
            // ==========================================

            const resposta =
                await apiPost(
                    '/agenda/gerar-aulas',
                    {
                        data_inicio:
                            dataInicio,


                        data_fim:
                            dataFim,


                        turma_id:
                            turmaId
                                ? Number(
                                    turmaId
                                )
                                : null
                    }
                );


            await onGeradas(
                resposta.resumo
            );


            onFechar();

        } catch (erro) {

            console.error(
                'Erro ao gerar aulas:',
                erro
            );


            setErro(
                erro.message
                ||
                'Não foi possível gerar as aulas.'
            );

        } finally {

            setGerando(
                false
            );
        }
    }


    // ==================================================
    // FECHAR CLICANDO NO FUNDO
    // ==================================================

    function fecharPeloFundo(
        evento
    ) {

        if (
            evento.target
            ===
            evento.currentTarget
            &&
            !gerando
        ) {

            onFechar();
        }
    }


    // ==================================================
    // INTERFACE
    // ==================================================

    return (

        <div
            className=
                "modal-overlay"

            onMouseDown={
                fecharPeloFundo
            }
        >

            <section
                className=
                    "modal"

                role=
                    "dialog"

                aria-modal=
                    "true"

                aria-labelledby=
                    "gerar-aulas-titulo"
            >

                {/* =================================
                    CABEÇALHO
                ================================== */}

                <header
                    className=
                        "modal-header"
                >

                    <div>

                        <h2
                            id=
                                "gerar-aulas-titulo"
                        >
                            Gerar aulas
                        </h2>


                        <p>
                            Crie automaticamente
                            a agenda a partir dos
                            horários semanais.
                        </p>

                    </div>


                    <button
                        type=
                            "button"

                        className=
                            "modal-fechar"

                        onClick={
                            onFechar
                        }

                        disabled={
                            gerando
                        }

                        aria-label=
                            "Fechar"
                    >
                        ×
                    </button>

                </header>


                {/* =================================
                    FORMULÁRIO
                ================================== */}

                <form
                    onSubmit={
                        gerar
                    }
                >

                    <div
                        className=
                            "modal-body"
                    >

                        {
                            carregando

                                ? (

                                    <div
                                        className=
                                            "estado-modal"
                                    >

                                        <div
                                            className=
                                                "spinner"
                                        />


                                        <span>
                                            Carregando turmas...
                                        </span>

                                    </div>

                                )

                                : (

                                    <>

                                        {/* =================
                                            AVISO
                                        ================== */}

                                        <div
                                            className=
                                                "geracao-aulas-aviso"
                                        >

                                            O sistema criará
                                            somente as aulas
                                            que ainda não existem.

                                            Aulas já cadastradas,
                                            inclusive canceladas,
                                            não serão duplicadas.

                                        </div>


                                        {/* =================
                                            TURMA
                                        ================== */}

                                        <div
                                            className=
                                                "campo-formulario"
                                        >

                                            <label
                                                htmlFor=
                                                    "geracao-turma"
                                            >
                                                Turma
                                            </label>


                                            <select
                                                id=
                                                    "geracao-turma"

                                                value={
                                                    turmaId
                                                }

                                                onChange={
                                                    (evento) =>
                                                        setTurmaId(
                                                            evento.target.value
                                                        )
                                                }

                                                disabled={
                                                    gerando
                                                }
                                            >

                                                <option value="">
                                                    Todas as turmas
                                                </option>


                                                {
                                                    turmasAtivas.map(
                                                        (turma) => (

                                                            <option
                                                                key={
                                                                    turma.id
                                                                }

                                                                value={
                                                                    turma.id
                                                                }
                                                            >
                                                                {
                                                                    turma.nome
                                                                }
                                                            </option>

                                                        )
                                                    )
                                                }

                                            </select>


                                            <small>
                                                Deixe em Todas
                                                as turmas para
                                                gerar a agenda
                                                completa.
                                            </small>

                                        </div>


                                        {/* =================
                                            PERÍODO
                                        ================== */}

                                        <div
                                            className=
                                                "geracao-periodo-grid"
                                        >

                                            {/* DATA INICIAL */}

                                            <div
                                                className=
                                                    "campo-formulario"
                                            >

                                                <label
                                                    htmlFor=
                                                        "geracao-inicio"
                                                >
                                                    De
                                                </label>


                                                <DataInputBR
                                                    id=
                                                        "geracao-inicio"

                                                    value={
                                                        dataInicio
                                                    }

                                                    onChange={
                                                        setDataInicio
                                                    }

                                                    disabled={
                                                        gerando
                                                    }

                                                    required
                                                />


                                                <small>
                                                    Formato dd/mm/aaaa
                                                </small>

                                            </div>


                                            {/* DATA FINAL */}

                                            <div
                                                className=
                                                    "campo-formulario"
                                            >

                                                <label
                                                    htmlFor=
                                                        "geracao-fim"
                                                >
                                                    Até
                                                </label>


                                                <DataInputBR
                                                    id=
                                                        "geracao-fim"

                                                    value={
                                                        dataFim
                                                    }

                                                    onChange={
                                                        setDataFim
                                                    }

                                                    disabled={
                                                        gerando
                                                    }

                                                    required
                                                />


                                                <small>
                                                    Formato dd/mm/aaaa
                                                </small>

                                            </div>

                                        </div>


                                        {/* =================
                                            ERRO
                                        ================== */}

                                        {
                                            erro
                                            &&
                                            (

                                                <div
                                                    className=
                                                        "formulario-erro"
                                                >
                                                    {erro}
                                                </div>

                                            )
                                        }

                                    </>

                                )
                        }

                    </div>


                    {/* =================================
                        RODAPÉ
                    ================================== */}

                    <footer
                        className=
                            "modal-footer"
                    >

                        <button
                            type=
                                "button"

                            className=
                                "botao-secundario"

                            onClick={
                                onFechar
                            }

                            disabled={
                                gerando
                            }
                        >
                            Cancelar
                        </button>


                        <button
                            type=
                                "submit"

                            className=
                                "botao-primario"

                            disabled={
                                gerando
                                ||
                                carregando
                            }
                        >

                            {
                                gerando
                                    ? 'Gerando aulas...'
                                    : 'Gerar aulas'
                            }

                        </button>

                    </footer>

                </form>

            </section>

        </div>
    );
}


export default GerarAulasModal;