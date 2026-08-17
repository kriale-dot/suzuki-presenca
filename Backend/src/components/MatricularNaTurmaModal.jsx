import {
    useEffect,
    useMemo,
    useState
} from 'react';


import {
    apiGet,
    apiPost
} from '../services/api';


import DataInputBR
    from './DataInputBR';


function MatricularNaTurmaModal({
    aberto,
    turma,
    matriculas,
    onFechar,
    onMatriculado
}) {

    const [
        alunos,
        setAlunos
    ] = useState([]);


    const [
        alunoId,
        setAlunoId
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
    // CARREGA ALUNOS
    // ==================================================

    useEffect(() => {

        if (!aberto) {
            return;
        }


        async function carregar() {

            try {

                setCarregando(
                    true
                );


                setErro('');


                setAlunoId('');


                setDataInicio(
                    obterHoje()
                );


                const resposta =
                    await apiGet(
                        '/alunos'
                    );


                setAlunos(
                    resposta.dados || []
                );

            } catch (erro) {

                console.error(
                    erro
                );


                setErro(
                    erro.message
                    ||
                    'Não foi possível carregar os alunos.'
                );

            } finally {

                setCarregando(
                    false
                );
            }
        }


        carregar();

    }, [
        aberto
    ]);


    // ==================================================
    // QUEM JÁ POSSUI MATRÍCULA ATIVA?
    // ==================================================

    const alunosJaMatriculados =
        useMemo(
            () => {

                return new Set(

                    matriculas

                        .filter(
                            (matricula) =>
                                Number(
                                    matricula.ativo
                                ) === 1
                        )

                        .map(
                            (matricula) =>
                                Number(
                                    matricula.aluno_id
                                )
                        )
                );

            },
            [
                matriculas
            ]
        );


    // ==================================================
    // ALUNOS DISPONÍVEIS
    // ==================================================

    const alunosDisponiveis =
        useMemo(
            () => {

                return alunos

                    .filter(
                        (aluno) =>
                            Number(
                                aluno.ativo
                            ) === 1
                    )

                    .filter(
                        (aluno) =>
                            !alunosJaMatriculados
                                .has(
                                    Number(
                                        aluno.id
                                    )
                                )
                    )

                    .sort(
                        (a, b) =>
                            a.nome.localeCompare(
                                b.nome,
                                'pt-BR'
                            )
                    );

            },
            [
                alunos,
                alunosJaMatriculados
            ]
        );


    // ==================================================
    // MODAL FECHADO
    // ==================================================

    if (!aberto) {
        return null;
    }


    // ==================================================
    // SALVAR
    // ==================================================

    async function salvar(
        evento
    ) {

        evento.preventDefault();


        setErro('');


        if (!alunoId) {

            setErro(
                'Selecione o aluno.'
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
                `/turmas/${turma.id}/alunos`,
                {
                    aluno_id:
                        Number(
                            alunoId
                        ),

                    data_inicio:
                        dataInicio,

                    data_fim:
                        null
                }
            );


            await onMatriculado();


            onFechar();

        } catch (erro) {

            console.error(
                erro
            );


            setErro(
                erro.message
                ||
                'Não foi possível matricular o aluno.'
            );

        } finally {

            setSalvando(
                false
            );
        }
    }


    return (

        <div
            className=
                "modal-overlay"

            onMouseDown={
                (evento) => {

                    if (
                        evento.target
                        ===
                        evento.currentTarget
                        &&
                        !salvando
                    ) {

                        onFechar();
                    }
                }
            }
        >

            <section
                className=
                    "modal"

                role=
                    "dialog"

                aria-modal=
                    "true"
            >

                <header
                    className=
                        "modal-header"
                >

                    <div>

                        <h2>
                            Matricular aluno
                        </h2>


                        <p>
                            {turma.nome}
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
                    >
                        ×
                    </button>

                </header>


                <form
                    onSubmit={
                        salvar
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
                                            Carregando alunos...
                                        </span>

                                    </div>

                                )

                                : (

                                    <>

                                        {/* ALUNO */}

                                        <div
                                            className=
                                                "campo-formulario"
                                        >

                                            <label
                                                htmlFor=
                                                    "matricula-aluno"
                                            >

                                                Aluno

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
                                                    "matricula-aluno"

                                                value={
                                                    alunoId
                                                }

                                                onChange={
                                                    (evento) =>
                                                        setAlunoId(
                                                            evento.target.value
                                                        )
                                                }

                                                disabled={
                                                    salvando
                                                    ||
                                                    alunosDisponiveis.length
                                                    ===
                                                    0
                                                }
                                            >

                                                <option value="">
                                                    Selecione um aluno
                                                </option>


                                                {
                                                    alunosDisponiveis.map(
                                                        (aluno) => (

                                                            <option
                                                                key={
                                                                    aluno.id
                                                                }

                                                                value={
                                                                    aluno.id
                                                                }
                                                            >
                                                                {
                                                                    aluno.nome
                                                                }
                                                            </option>

                                                        )
                                                    )
                                                }

                                            </select>


                                            {
                                                alunosDisponiveis.length
                                                ===
                                                0
                                                &&
                                                (

                                                    <small>
                                                        Não há outros alunos ativos disponíveis.
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
                                                    "matricula-inicio"
                                            >
                                                Data de início
                                            </label>


                                            <DataInputBR
                                                id=
                                                    "matricula-inicio"

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
                                alunosDisponiveis.length
                                ===
                                0
                            }
                        >

                            {
                                salvando
                                    ? 'Matriculando...'
                                    : 'Matricular aluno'
                            }

                        </button>

                    </footer>

                </form>

            </section>

        </div>
    );
}


export default MatricularNaTurmaModal;