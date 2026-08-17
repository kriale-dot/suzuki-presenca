import {
    useEffect,
    useState
} from 'react';


import {
    apiPut
} from '../services/api';


import DataInputBR
    from './DataInputBR';


function EncerrarMatriculaModal({
    aberto,
    turmaId,
    matricula,
    onFechar,
    onEncerrada
}) {

    const [
        dataFim,
        setDataFim
    ] = useState('');


    const [
        salvando,
        setSalvando
    ] = useState(false);


    const [
        erro,
        setErro
    ] = useState('');


    // ==================================================
    // HOJE
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
    // PREPARA MODAL
    // ==================================================

    useEffect(() => {

        if (!aberto) {
            return;
        }


        setDataFim(
            obterHoje()
        );


        setErro('');


        setSalvando(
            false
        );

    }, [
        aberto,
        matricula
    ]);


    if (
        !aberto
        ||
        !matricula
    ) {

        return null;
    }

    const turmaIdEfetivo =
        turmaId
        ??
        matricula.turma_id;


    const matriculaIdEfetivo =
        matricula.id
        ??
        matricula.matricula_id;

    // ==================================================
    // ENCERRAR
    // ==================================================

    async function encerrar(
        evento
    ) {

        evento.preventDefault();


        setErro('');


        if (!dataFim) {

            setErro(
                'Informe a data de término.'
            );

            return;
        }


        /*
         * Como as duas datas estão em YYYY-MM-DD,
         * a comparação textual funciona corretamente.
         */
        if (
            matricula.data_inicio
            &&
            dataFim
            <
            matricula.data_inicio
        ) {

            setErro(
                'A data de término não pode ser anterior à data de início.'
            );

            return;
        }


        try {

            setSalvando(
                true
            );


            console.log(
                'DEBUG ENCERRAR MATRÍCULA:',
                {
                    turmaId: turmaId,
                    matricula: matricula,
                    id: matricula?.id,
                    matricula_id: matricula?.matricula_id,
                    turma_id: matricula?.turma_id
                }
            );
            await apiPut(
                `/turmas/${turmaIdEfetivo}/alunos/${matriculaIdEfetivo}`,
                {
                    data_fim:
                        dataFim,

                    ativo:
                        0
                }
            );


            await onEncerrada();


            onFechar();

        } catch (erro) {

            console.error(
                erro
            );


            setErro(
                erro.message
                ||
                'Não foi possível encerrar a matrícula.'
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
                            Encerrar matrícula
                        </h2>


                        <p>
                            {
                                matricula.aluno_nome
                            }
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
                        encerrar
                    }
                >

                    <div
                        className=
                        "modal-body"
                    >

                        <div
                            className=
                            "encerrar-matricula-aviso"
                        >

                            Esta ação não apagará o histórico.

                            O aluno deixará de participar
                            das novas aulas desta turma a
                            partir da data informada.

                        </div>


                        <div
                            className=
                            "campo-formulario"
                        >

                            <label
                                htmlFor=
                                "matricula-fim"
                            >
                                Data de término
                            </label>


                            <DataInputBR
                                id=
                                "matricula-fim"

                                value={
                                    dataFim
                                }

                                onChange={
                                    setDataFim
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
                            matricula.data_inicio
                            &&
                            (

                                <small>
                                    A data de término não pode ser anterior ao início da matrícula.
                                </small>

                            )
                        }


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
                            "botao-perigo-secundario"

                            disabled={
                                salvando
                            }
                        >

                            {
                                salvando
                                    ? 'Encerrando...'
                                    : 'Encerrar matrícula'
                            }

                        </button>

                    </footer>

                </form>

            </section>

        </div>
    );
}


export default EncerrarMatriculaModal;