import {
    useEffect,
    useMemo,
    useState
} from 'react';


import {
    apiGet,
    apiPost
} from '../services/api';


import {
    obterDataHoje
} from '../utils/formatters';


import DataInputBR
    from './DataInputBR';


function MatricularAlunoModal({
    aberto,
    aluno,
    matriculas,
    onFechar,
    onMatriculado
}) {

    const [
        turmas,
        setTurmas
    ] = useState([]);


    const [
        turmaId,
        setTurmaId
    ] = useState('');


    const [
        dataInicio,
        setDataInicio
    ] = useState('');


    const [
        carregando,
        setCarregando
    ] = useState(false);


    const [
        salvando,
        setSalvando
    ] = useState(false);


    const [
        erro,
        setErro
    ] = useState('');


    // ==================================================
    // PREPARA O MODAL
    // ==================================================

    useEffect(() => {

        if (!aberto) {
            return;
        }


        async function carregarTurmas() {

            try {

                setCarregando(
                    true
                );


                setErro('');


                setTurmaId('');


                /*
                 * obterDataHoje() já retorna
                 * YYYY-MM-DD.
                 */
                setDataInicio(
                    obterDataHoje()
                );


                const resposta =
                    await apiGet(
                        '/turmas'
                    );


                setTurmas(
                    resposta.dados || []
                );

            } catch (err) {

                console.error(
                    err
                );


                setErro(
                    err.message
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
    // TURMAS ATIVAS EM QUE O ALUNO JÁ ESTÁ
    // ==================================================

    const turmasAtivasDoAluno =
        useMemo(
            () => {

                return new Set(

                    matriculas

                        .filter(
                            (matricula) =>
                                Number(
                                    matricula.matricula_ativa
                                ) === 1
                        )

                        .map(
                            (matricula) =>
                                Number(
                                    matricula.turma_id
                                )
                        )
                );

            },
            [
                matriculas
            ]
        );


    // ==================================================
    // TURMAS DISPONÍVEIS
    // ==================================================

    const turmasDisponiveis =
        useMemo(
            () => {

                return turmas.filter(
                    (turma) =>
                        Number(
                            turma.ativo
                        ) === 1
                        &&
                        !turmasAtivasDoAluno.has(
                            Number(
                                turma.id
                            )
                        )
                );

            },
            [
                turmas,
                turmasAtivasDoAluno
            ]
        );


    if (!aberto) {
        return null;
    }


    // ==================================================
    // FECHAR PELO FUNDO
    // ==================================================

    function fecharPeloFundo(
        event
    ) {

        if (
            event.target
            ===
            event.currentTarget
            &&
            !salvando
        ) {

            onFechar();
        }
    }


    // ==================================================
    // SALVAR
    // ==================================================

    async function handleSubmit(
        event
    ) {

        event.preventDefault();


        setErro('');


        if (!turmaId) {

            setErro(
                'Selecione uma turma.'
            );

            return;
        }


        if (!dataInicio) {

            setErro(
                'Informe a data de início.'
            );

            return;
        }


        try {

            setSalvando(
                true
            );


            await apiPost(
                `/turmas/${turmaId}/alunos`,
                {
                    aluno_id:
                        Number(
                            aluno.id
                        ),

                    data_inicio:
                        dataInicio,

                    data_fim:
                        null,

                    ativo:
                        1
                }
            );


            await onMatriculado();


            onFechar();

        } catch (err) {

            console.error(
                err
            );


            setErro(
                err.message
                ||
                'Não foi possível realizar a matrícula.'
            );

        } finally {

            setSalvando(
                false
            );
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
                    "matricula-titulo"
            >

                <header
                    className=
                        "modal-header"
                >

                    <div>

                        <h2
                            id=
                                "matricula-titulo"
                        >
                            Matricular aluno
                        </h2>


                        <p>
                            {aluno.nome}
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
                            salvando
                        }

                        aria-label=
                            "Fechar janela"
                    >
                        ×
                    </button>

                </header>


                <form
                    onSubmit={
                        handleSubmit
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

                                        {/* TURMA */}

                                        <div
                                            className=
                                                "campo-formulario"
                                        >

                                            <label
                                                htmlFor=
                                                    "matricula-turma"
                                            >

                                                Turma

                                                {' '}

                                                <span
                                                    className=
                                                        "campo-obrigatorio"
                                                >
                                                    *
                                                </span>

                                            </label>


                                            <select
                                                id=
                                                    "matricula-turma"

                                                value={
                                                    turmaId
                                                }

                                                onChange={
                                                    (event) =>
                                                        setTurmaId(
                                                            event.target.value
                                                        )
                                                }

                                                disabled={
                                                    salvando
                                                    ||
                                                    turmasDisponiveis.length
                                                    ===
                                                    0
                                                }
                                            >

                                                <option value="">
                                                    Selecione uma turma
                                                </option>


                                                {
                                                    turmasDisponiveis.map(
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

                                                                {
                                                                    turma.modalidade_nome
                                                                        ? ` — ${turma.modalidade_nome}`
                                                                        : ''
                                                                }

                                                            </option>

                                                        )
                                                    )
                                                }

                                            </select>


                                            {
                                                turmasDisponiveis.length
                                                ===
                                                0
                                                &&
                                                (

                                                    <small>
                                                        Não há outras turmas ativas disponíveis para este aluno.
                                                    </small>

                                                )
                                            }

                                        </div>


                                        {/* DATA */}

                                        <div
                                            className=
                                                "campo-formulario"
                                        >

                                            <label
                                                htmlFor=
                                                    "matricula-data"
                                            >

                                                Data de início

                                                {' '}

                                                <span
                                                    className=
                                                        "campo-obrigatorio"
                                                >
                                                    *
                                                </span>

                                            </label>


                                            <DataInputBR
                                                id=
                                                    "matricula-data"

                                                value={
                                                    dataInicio
                                                }

                                                onChange={
                                                    setDataInicio
                                                }

                                                disabled={
                                                    salvando
                                                }

                                                required
                                            />


                                            <small>
                                                Formato dd/mm/aaaa
                                            </small>

                                        </div>


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
                                salvando
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
                                salvando
                                ||
                                carregando
                                ||
                                turmasDisponiveis.length
                                ===
                                0
                            }
                        >

                            {
                                salvando
                                    ? 'Matriculando...'
                                    : 'Matricular'
                            }

                        </button>

                    </footer>

                </form>

            </section>

        </div>
    );
}


export default MatricularAlunoModal;