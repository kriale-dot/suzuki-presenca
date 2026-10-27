import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from 'react';


import {
    Link,
    useNavigate,
    useParams
} from 'react-router';


import {
    apiArquivoUrl,
    apiDelete,
    apiGet,
    apiPut
} from '../services/api';


import HorarioModal
    from '../components/HorarioModal';


import MatricularNaTurmaModal
    from '../components/MatricularNaTurmaModal';


import EncerrarMatriculaModal
    from '../components/EncerrarMatriculaModal';


function TurmaDetalhes() {

    const { id } =
        useParams();


    const navigate =
        useNavigate();


    // ==================================================
    // DADOS
    // ==================================================

    const [
        turma,
        setTurma
    ] = useState(null);


    const [
        alunos,
        setAlunos
    ] = useState([]);


    const [
        horarios,
        setHorarios
    ] = useState([]);


    // ==================================================
    // CARREGAMENTO / ERROS
    // ==================================================

    const [
        carregando,
        setCarregando
    ] = useState(true);


    const [
        carregandoAlunos,
        setCarregandoAlunos
    ] = useState(true);


    const [
        carregandoHorarios,
        setCarregandoHorarios
    ] = useState(true);


    const [
        erro,
        setErro
    ] = useState('');


    const [
        erroAlunos,
        setErroAlunos
    ] = useState('');


    const [
        erroHorarios,
        setErroHorarios
    ] = useState('');


    const [
        mensagemSucesso,
        setMensagemSucesso
    ] = useState('');


    // ==================================================
    // MODAIS
    // ==================================================

    const [
        modalHorario,
        setModalHorario
    ] = useState(false);


    const [
        horarioEditando,
        setHorarioEditando
    ] = useState(null);


    const [
        modalMatricula,
        setModalMatricula
    ] = useState(false);


    const [
        matriculaEncerrando,
        setMatriculaEncerrando
    ] = useState(null);


    // ==================================================
    // PROCESSAMENTO
    // ==================================================

    const [
        processandoHorarioId,
        setProcessandoHorarioId
    ] = useState(null);


    const [
        processandoExclusao,
        setProcessandoExclusao
    ] = useState(false);


    // ==================================================
    // CARREGA TURMA
    // ==================================================

    const carregarTurma =
        useCallback(
            async () => {

                try {

                    setCarregando(true);

                    setErro('');


                    const resposta =
                        await apiGet(
                            `/turmas/${id}`
                        );


                    setTurma(
                        resposta.dados
                    );

                } catch (erro) {

                    console.error(
                        erro
                    );


                    setErro(
                        erro.message ||
                        'Não foi possível carregar a turma.'
                    );

                } finally {

                    setCarregando(false);
                }
            },
            [id]
        );


    // ==================================================
    // CARREGA MATRÍCULAS
    // ==================================================

    const carregarAlunos =
        useCallback(
            async () => {

                try {

                    setCarregandoAlunos(
                        true
                    );

                    setErroAlunos('');


                    const resposta =
                        await apiGet(
                            `/turmas/${id}/alunos`
                        );


                    setAlunos(
                        resposta.dados || []
                    );

                } catch (erro) {

                    console.error(
                        erro
                    );


                    setErroAlunos(
                        erro.message ||
                        'Não foi possível carregar os alunos.'
                    );

                } finally {

                    setCarregandoAlunos(
                        false
                    );
                }
            },
            [id]
        );


    // ==================================================
    // CARREGA HORÁRIOS
    // ==================================================

    const carregarHorarios =
        useCallback(
            async () => {

                try {

                    setCarregandoHorarios(
                        true
                    );

                    setErroHorarios('');


                    const resposta =
                        await apiGet(
                            `/turmas/${id}/horarios`
                        );


                    setHorarios(
                        resposta.dados || []
                    );

                } catch (erro) {

                    console.error(
                        erro
                    );


                    setErroHorarios(
                        erro.message ||
                        'Não foi possível carregar os horários.'
                    );

                } finally {

                    setCarregandoHorarios(
                        false
                    );
                }
            },
            [id]
        );


    // ==================================================
    // CARREGAMENTO INICIAL
    // ==================================================

    useEffect(() => {

        carregarTurma();

        carregarAlunos();

        carregarHorarios();

    }, [
        carregarTurma,
        carregarAlunos,
        carregarHorarios
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
                    setMensagemSucesso(''),
                3500
            );


        return () =>
            clearTimeout(
                timer
            );

    }, [mensagemSucesso]);


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


    function formatarPercentual(
        valor
    ) {

        return Number(
            valor || 0
        ).toLocaleString(
            'pt-BR',
            {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            }
        ) + '%';
    }


    function nomeDiaSemana(
        numero
    ) {

        const dias = {

            1: 'Segunda-feira',
            2: 'Terça-feira',
            3: 'Quarta-feira',
            4: 'Quinta-feira',
            5: 'Sexta-feira',
            6: 'Sábado',
            7: 'Domingo'

        };


        return dias[
            Number(numero)
        ] || '—';
    }


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
    // ORDENA MATRÍCULAS
    // ==================================================

    const matriculasOrdenadas =
        useMemo(
            () => {

                return [
                    ...alunos
                ].sort(
                    (a, b) => {

                        const ativoA =
                            Number(
                                a.ativo
                            );


                        const ativoB =
                            Number(
                                b.ativo
                            );


                        if (
                            ativoA !== ativoB
                        ) {

                            return (
                                ativoB -
                                ativoA
                            );
                        }


                        return (
                            a.aluno_nome || ''
                        ).localeCompare(
                            b.aluno_nome || '',
                            'pt-BR'
                        );
                    }
                );

            },
            [alunos]
        );


    const totalAtivos =
        matriculasOrdenadas.filter(
            (matricula) =>
                Number(
                    matricula.ativo
                ) === 1
        ).length;


    // ==================================================
    // ORDENA HORÁRIOS
    // ==================================================

    const horariosOrdenados =
        useMemo(
            () => {

                return [
                    ...horarios
                ].sort(
                    (a, b) => {

                        const ativoA =
                            Number(
                                a.ativo
                            );


                        const ativoB =
                            Number(
                                b.ativo
                            );


                        if (
                            ativoA !== ativoB
                        ) {

                            return (
                                ativoB -
                                ativoA
                            );
                        }


                        if (
                            Number(
                                a.dia_semana
                            )
                            !==
                            Number(
                                b.dia_semana
                            )
                        ) {

                            return (
                                Number(
                                    a.dia_semana
                                )
                                -
                                Number(
                                    b.dia_semana
                                )
                            );
                        }


                        return (
                            a.hora_inicio || ''
                        ).localeCompare(
                            b.hora_inicio || ''
                        );
                    }
                );

            },
            [horarios]
        );


    // ==================================================
    // NOVO HORÁRIO
    // ==================================================

    function novoHorario() {

        setHorarioEditando(
            null
        );

        setModalHorario(
            true
        );
    }


    // ==================================================
    // EDITAR HORÁRIO
    // ==================================================

    function editarHorario(
        horario
    ) {

        setHorarioEditando(
            horario
        );

        setModalHorario(
            true
        );
    }


    // ==================================================
    // HORÁRIO SALVO
    // ==================================================

    async function horarioSalvo(
        acao
    ) {

        await carregarHorarios();


        setMensagemSucesso(

            acao === 'editado'

                ? 'Horário atualizado com sucesso.'

                : 'Horário cadastrado com sucesso.'
        );
    }


    // ==================================================
    // DESATIVAR HORÁRIO
    // ==================================================

    async function desativarHorario(
        horario
    ) {

        const confirmou =
            window.confirm(
                'Deseja desativar este horário?'
            );


        if (!confirmou) {
            return;
        }


        try {

            setProcessandoHorarioId(
                horario.id
            );


            await apiDelete(
                `/turmas/${id}/horarios/${horario.id}`
            );


            await carregarHorarios();


            setMensagemSucesso(
                'Horário desativado com sucesso.'
            );

        } catch (erro) {

            setErroHorarios(
                erro.message ||
                'Não foi possível desativar o horário.'
            );

        } finally {

            setProcessandoHorarioId(
                null
            );
        }
    }


    // ==================================================
    // REATIVAR HORÁRIO
    // ==================================================

    async function reativarHorario(
        horario
    ) {

        try {

            setProcessandoHorarioId(
                horario.id
            );


            await apiPut(
                `/turmas/${id}/horarios/${horario.id}`,
                {
                    ativo: 1
                }
            );


            await carregarHorarios();


            setMensagemSucesso(
                'Horário reativado com sucesso.'
            );

        } catch (erro) {

            setErroHorarios(
                erro.message ||
                'Não foi possível reativar o horário.'
            );

        } finally {

            setProcessandoHorarioId(
                null
            );
        }
    }


    // ==================================================
    // MATRÍCULA
    // ==================================================

    async function matriculaCriada() {

        await carregarAlunos();


        setMensagemSucesso(
            'Aluno matriculado com sucesso.'
        );
    }


    async function matriculaEncerrada() {

        await carregarAlunos();


        setMensagemSucesso(
            'Matrícula encerrada com sucesso.'
        );
    }


    // ==================================================
    // EXCLUIR TURMA DEFINITIVAMENTE
    //
    // A API só permite a exclusão quando:
    // - a turma está inativa;
    // - não existe nenhuma aula vinculada.
    //
    // Matrículas e horários sem histórico são removidos
    // junto com a turma.
    // ==================================================

    async function excluirTurmaDefinitivamente() {

        if (
            Number(
                turma?.ativo
            ) === 1
        ) {

            window.alert(
                'Desative a turma antes de tentar excluí-la definitivamente.'
            );

            return;
        }


        const confirmou =
            window.confirm(
                'Excluir definitivamente esta turma?\n\nEsta operação não poderá ser desfeita. Se houver qualquer aula vinculada, o sistema bloqueará a exclusão para preservar o histórico.'
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

            setProcessandoExclusao(
                true
            );


            const resposta =
                await apiDelete(
                    `/turmas/${id}/definitivo`
                );


            window.alert(
                resposta.mensagem
                ||
                'Turma excluída definitivamente.'
            );


            navigate(
                '/turmas',
                {
                    replace: true
                }
            );

        } catch (erro) {

            console.error(
                'Erro ao excluir turma definitivamente:',
                erro
            );


            window.alert(
                erro.message
                ||
                'Não foi possível excluir definitivamente a turma.'
            );

        } finally {

            setProcessandoExclusao(
                false
            );
        }
    }


    // ==================================================
    // CARREGANDO
    // ==================================================

    if (
        carregando &&
        !turma
    ) {

        return (

            <div
                className=
                    "estado-pagina"
            >

                <div
                    className=
                        "spinner"
                />

                <p>
                    Carregando turma...
                </p>

            </div>
        );
    }


    // ==================================================
    // ERRO
    // ==================================================

    if (!turma) {

        return (

            <div className="pagina">

                <Link
                    to="/turmas"

                    className=
                        "voltar-link"
                >
                    ← Voltar para turmas
                </Link>


                <div
                    className=
                        "mensagem-erro"
                >

                    <strong>
                        Não foi possível abrir esta turma.
                    </strong>

                    <span>
                        {erro}
                    </span>

                </div>

            </div>
        );
    }


    // ==================================================
    // INTERFACE
    // ==================================================

    return (

        <div className="pagina">


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

                    {mensagemSucesso}

                </div>

            )}


            <Link
                to="/turmas"

                className=
                    "voltar-link"
            >
                ← Voltar para turmas
            </Link>


            {/* =====================================
                CABEÇALHO
            ====================================== */}

            <header
                className=
                    "turma-detalhes-header"
            >

                <div
                    className=
                        "turma-detalhes-identidade"
                >

                    <div
                        className=
                            "turma-avatar-grande"
                    >
                        ♫
                    </div>


                    <div>

                        <div
                            className=
                                "titulo-com-status"
                        >

                            <h1>
                                {
                                    turma.nome
                                }
                            </h1>


                            <span
                                className={
                                    `badge ${
                                        Number(
                                            turma.ativo
                                        ) === 1
                                            ? 'ativo'
                                            : 'inativo'
                                    }`
                                }
                            >

                                {
                                    Number(
                                        turma.ativo
                                    ) === 1
                                        ? 'Ativa'
                                        : 'Inativa'
                                }

                            </span>

                        </div>


                        <p>

                            {
                                turma.modalidade_nome
                            }

                            {' • '}

                            {
                                turma.tipo ===
                                'individual'
                                    ? 'Individual'
                                    : 'Coletiva'
                            }

                        </p>

                    </div>

                </div>


                {
                    Number(
                        turma.ativo
                    ) === 0
                    &&
                    (

                        <button
                            type="button"

                            className=
                                "botao-perigo-secundario"

                            onClick={
                                excluirTurmaDefinitivamente
                            }

                            disabled={
                                processandoExclusao
                            }
                        >
                            {
                                processandoExclusao
                                    ? 'Excluindo...'
                                    : 'Excluir definitivamente'
                            }
                        </button>

                    )
                }

            </header>


            {
                Number(
                    turma.ativo
                ) === 0
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
                            Use esta opção apenas para uma turma criada por engano. Turmas com qualquer aula registrada não poderão ser excluídas, preservando o histórico de presença.
                        </span>
                    </div>

                )
            }


            {/* =====================================
                DADOS
            ====================================== */}

            <section
                className=
                    "ficha-card"
            >

                <div
                    className=
                        "ficha-card-header"
                >

                    <div>

                        <h2>
                            Dados da turma
                        </h2>

                        <p>
                            Informações principais desta turma.
                        </p>

                    </div>

                </div>


                <div
                    className=
                        "turma-dados-grid"
                >

                    <div
                        className=
                            "ficha-campo"
                    >

                        <span>
                            Modalidade
                        </span>

                        <strong>
                            {
                                turma.modalidade_nome
                            }
                        </strong>

                    </div>


                    <div
                        className=
                            "ficha-campo"
                    >

                        <span>
                            Professor
                        </span>

                        <strong>
                            {
                                turma.professor_nome
                            }
                        </strong>

                    </div>


                    <div
                        className=
                            "ficha-campo"
                    >

                        <span>
                            Tipo
                        </span>

                        <strong>

                            {
                                turma.tipo ===
                                'individual'
                                    ? 'Individual'
                                    : 'Coletiva'
                            }

                        </strong>

                    </div>


                    <div
                        className=
                            "ficha-campo"
                    >

                        <span>
                            Sala
                        </span>

                        <strong>
                            {
                                turma.sala ||
                                'Não informada'
                            }
                        </strong>

                    </div>

                </div>

            </section>


            {/* =====================================
                HORÁRIOS
            ====================================== */}

            <section
                className=
                    "ficha-card"
            >

                <div
                    className=
                        "ficha-card-header"
                >

                    <div>

                        <h2>
                            Horários
                        </h2>

                        <p>
                            Horários semanais da turma.
                        </p>

                    </div>


                    {
                        Number(
                            turma.ativo
                        ) === 1
                        &&
                        (

                            <button
                                type="button"

                                className=
                                    "botao-secundario"

                                onClick={
                                    novoHorario
                                }
                            >
                                + Novo horário
                            </button>

                        )
                    }

                </div>


                {carregandoHorarios && (

                    <div
                        className=
                            "ficha-vazio"
                    >

                        <div
                            className=
                                "spinner"
                        />

                        <p>
                            Carregando horários...
                        </p>

                    </div>

                )}


                {
                    !carregandoHorarios
                    &&
                    erroHorarios
                    &&
                    (

                        <div
                            className=
                                "ficha-conteudo"
                        >

                            <div
                                className=
                                    "mensagem-erro"
                            >
                                {erroHorarios}
                            </div>

                        </div>

                    )
                }


                {
                    !carregandoHorarios
                    &&
                    !erroHorarios
                    &&
                    horariosOrdenados.length === 0
                    &&
                    (

                        <div
                            className=
                                "ficha-vazio"
                        >

                            <strong>
                                Nenhum horário cadastrado
                            </strong>

                        </div>

                    )
                }


                {
                    !carregandoHorarios
                    &&
                    !erroHorarios
                    &&
                    horariosOrdenados.length > 0
                    &&
                    (

                        <div
                            className=
                                "horarios-lista"
                        >

                            {
                                horariosOrdenados.map(
                                    (horario) => {

                                        const ativo =
                                            Number(
                                                horario.ativo
                                            ) === 1;


                                        const processando =
                                            processandoHorarioId
                                            ===
                                            horario.id;


                                        return (

                                            <div
                                                className=
                                                    "horario-item horario-item-gerenciavel"

                                                key={
                                                    horario.id
                                                }
                                            >

                                                <div
                                                    className=
                                                        "horario-dia-icone"
                                                >
                                                    ◷
                                                </div>


                                                <div
                                                    className=
                                                        "horario-info"
                                                >

                                                    <strong>

                                                        {
                                                            horario.dia_semana_nome
                                                            ||
                                                            nomeDiaSemana(
                                                                horario.dia_semana
                                                            )
                                                        }

                                                    </strong>


                                                    <span>

                                                        {
                                                            formatarHora(
                                                                horario.hora_inicio
                                                            )
                                                        }

                                                        {' às '}

                                                        {
                                                            formatarHora(
                                                                horario.hora_fim
                                                            )
                                                        }

                                                    </span>

                                                </div>


                                                <span
                                                    className={
                                                        `badge ${
                                                            ativo
                                                                ? 'ativo'
                                                                : 'inativo'
                                                        }`
                                                    }
                                                >

                                                    {
                                                        ativo
                                                            ? 'Ativo'
                                                            : 'Inativo'
                                                    }

                                                </span>


                                                <div
                                                    className=
                                                        "horario-acoes"
                                                >

                                                    <button
                                                        type="button"

                                                        className=
                                                            "botao-secundario"

                                                        onClick={
                                                            () =>
                                                                editarHorario(
                                                                    horario
                                                                )
                                                        }

                                                        disabled={
                                                            processando
                                                        }
                                                    >
                                                        Editar
                                                    </button>


                                                    {
                                                        ativo

                                                        ? (

                                                            <button
                                                                type="button"

                                                                className=
                                                                    "botao-perigo-secundario"

                                                                onClick={
                                                                    () =>
                                                                        desativarHorario(
                                                                            horario
                                                                        )
                                                                }

                                                                disabled={
                                                                    processando
                                                                }
                                                            >
                                                                Desativar
                                                            </button>

                                                        )

                                                        : (

                                                            <button
                                                                type="button"

                                                                className=
                                                                    "botao-primario"

                                                                onClick={
                                                                    () =>
                                                                        reativarHorario(
                                                                            horario
                                                                        )
                                                                }

                                                                disabled={
                                                                    processando
                                                                }
                                                            >
                                                                Reativar
                                                            </button>

                                                        )
                                                    }

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


            {/* =====================================
                ALUNOS
            ====================================== */}

            <section
                className=
                    "ficha-card"
            >

                <div
                    className=
                        "ficha-card-header"
                >

                    <div>

                        <h2>
                            Alunos
                        </h2>

                        <p>

                            {totalAtivos}

                            {' '}

                            {
                                totalAtivos === 1
                                    ? 'matrícula ativa'
                                    : 'matrículas ativas'
                            }

                        </p>

                    </div>


                    {
                        Number(
                            turma.ativo
                        ) === 1
                        &&
                        (

                            <button
                                type="button"

                                className=
                                    "botao-secundario"

                                onClick={
                                    () =>
                                        setModalMatricula(
                                            true
                                        )
                                }
                            >
                                + Matricular aluno
                            </button>

                        )
                    }

                </div>


                <div
                    className=
                        "turma-frequencia-legenda"
                >
                    Frequência calculada somente com aulas encerradas. Faltas justificadas são contabilizadas como faltas.
                </div>


                {carregandoAlunos && (

                    <div
                        className=
                            "ficha-vazio"
                    >

                        <div
                            className=
                                "spinner"
                        />

                        <p>
                            Carregando alunos...
                        </p>

                    </div>

                )}


                {
                    !carregandoAlunos
                    &&
                    erroAlunos
                    &&
                    (

                        <div
                            className=
                                "ficha-conteudo"
                        >

                            <div
                                className=
                                    "mensagem-erro"
                            >
                                {erroAlunos}
                            </div>

                        </div>

                    )
                }


                {
                    !carregandoAlunos
                    &&
                    !erroAlunos
                    &&
                    matriculasOrdenadas.length === 0
                    &&
                    (

                        <div
                            className=
                                "ficha-vazio"
                        >

                            <strong>
                                Nenhuma matrícula
                            </strong>

                            <p>
                                Esta turma ainda não possui alunos.
                            </p>

                        </div>

                    )
                }


                {
                    !carregandoAlunos
                    &&
                    !erroAlunos
                    &&
                    matriculasOrdenadas.length > 0
                    &&
                    (

                        <div
                            className=
                                "turma-alunos-lista"
                        >

                            {
                                matriculasOrdenadas.map(
                                    (matricula) => {

                                        const ativo =
                                            Number(
                                                matricula.ativo
                                            ) === 1;


                                        return (

                                            <div
                                                className=
                                                    "turma-aluno-item turma-aluno-item-gerenciavel"

                                                key={
                                                    matricula.id
                                                }
                                            >

                                                <div
                                                    className=
                                                        "aluno-avatar"
                                                >

                                                    {
                                                        matricula.foto_url

                                                        ? (

                                                            <img
                                                                src={
                                                                    apiArquivoUrl(
                                                                        matricula.foto_url
                                                                    )
                                                                }

                                                                alt={
                                                                    matricula.aluno_nome
                                                                }
                                                            />

                                                        )

                                                        : (

                                                            <span>

                                                                {
                                                                    obterIniciais(
                                                                        matricula.aluno_nome
                                                                    )
                                                                }

                                                            </span>

                                                        )
                                                    }

                                                </div>


                                                <div
                                                    className=
                                                        "turma-aluno-info"
                                                >

                                                    <strong>
                                                        {
                                                            matricula.aluno_nome
                                                        }
                                                    </strong>


                                                    <span>

                                                        Início:{' '}

                                                        {
                                                            formatarData(
                                                                matricula.data_inicio
                                                            )
                                                        }

                                                    </span>


                                                    {
                                                        matricula.data_fim
                                                        &&
                                                        (

                                                            <span>

                                                                Término:{' '}

                                                                {
                                                                    formatarData(
                                                                        matricula.data_fim
                                                                    )
                                                                }

                                                            </span>

                                                        )
                                                    }

                                                </div>


                                                <div
                                                    className=
                                                        "turma-aluno-frequencia"
                                                >

                                                    <div
                                                        className=
                                                            "turma-frequencia-card presenca"
                                                    >
                                                        <span>
                                                            Presenças
                                                        </span>

                                                        <div>
                                                            <strong>
                                                                {
                                                                    Number(
                                                                        matricula.presencas || 0
                                                                    )
                                                                }
                                                            </strong>

                                                            <small>
                                                                {
                                                                    formatarPercentual(
                                                                        matricula.percentual_presencas
                                                                    )
                                                                }
                                                            </small>
                                                        </div>
                                                    </div>


                                                    <div
                                                        className=
                                                            "turma-frequencia-card falta"
                                                    >
                                                        <span>
                                                            Faltas
                                                        </span>

                                                        <div>
                                                            <strong>
                                                                {
                                                                    Number(
                                                                        matricula.faltas || 0
                                                                    )
                                                                }
                                                            </strong>

                                                            <small>
                                                                {
                                                                    formatarPercentual(
                                                                        matricula.percentual_faltas
                                                                    )
                                                                }
                                                            </small>
                                                        </div>
                                                    </div>

                                                </div>


                                                <span
                                                    className={
                                                        `badge ${
                                                            ativo
                                                                ? 'ativo'
                                                                : 'inativo'
                                                        }`
                                                    }
                                                >

                                                    {
                                                        ativo
                                                            ? 'Ativa'
                                                            : 'Encerrada'
                                                    }

                                                </span>


                                                <div
                                                    className=
                                                        "matricula-acoes"
                                                >

                                                    <Link
                                                        to={
                                                            `/alunos/${matricula.aluno_id}`
                                                        }

                                                        className=
                                                            "botao-secundario"
                                                    >
                                                        Ver aluno
                                                    </Link>


                                                    {
                                                        ativo
                                                        &&
                                                        (

                                                            <button
                                                                type="button"

                                                                className=
                                                                    "botao-perigo-secundario"

                                                                onClick={
                                                                    () =>
                                                                        setMatriculaEncerrando(
                                                                            matricula
                                                                        )
                                                                }
                                                            >
                                                                Encerrar
                                                            </button>

                                                        )
                                                    }

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


            {/* =====================================
                MODAIS
            ====================================== */}

            <HorarioModal

                aberto={
                    modalHorario
                }

                turmaId={
                    id
                }

                horario={
                    horarioEditando
                }

                onFechar={
                    () => {

                        setModalHorario(
                            false
                        );

                        setHorarioEditando(
                            null
                        );
                    }
                }

                onSalvo={
                    horarioSalvo
                }

            />


            <MatricularNaTurmaModal

                aberto={
                    modalMatricula
                }

                turma={
                    turma
                }

                matriculas={
                    alunos
                }

                onFechar={
                    () =>
                        setModalMatricula(
                            false
                        )
                }

                onMatriculado={
                    matriculaCriada
                }

            />


            <EncerrarMatriculaModal

                aberto={
                    Boolean(
                        matriculaEncerrando
                    )
                }

                turmaId={
                    id
                }

                matricula={
                    matriculaEncerrando
                }

                onFechar={
                    () =>
                        setMatriculaEncerrando(
                            null
                        )
                }

                onEncerrada={
                    matriculaEncerrada
                }

            />

        </div>
    );
}


export default TurmaDetalhes;