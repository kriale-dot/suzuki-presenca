import {
    useEffect,
    useState
} from 'react';


import {
    apiGet,
    apiPost,
    apiPut
} from '../services/api';


import DataInputBR
    from './DataInputBR';


function AulaModal({
    aberto,
    aula,
    dataInicial,
    onFechar,
    onSalva
}) {

    const editando =
        Boolean(aula);


    // ==================================================
    // CAMPOS
    // ==================================================

    const [
        turmaId,
        setTurmaId
    ] = useState('');


    /*
     * Internamente:
     * YYYY-MM-DD
     *
     * Visualmente:
     * DD/MM/AAAA
     */
    const [
        dataAula,
        setDataAula
    ] = useState('');


    const [
        horaInicio,
        setHoraInicio
    ] = useState('');


    const [
        horaFim,
        setHoraFim
    ] = useState('');


    const [
        tipo,
        setTipo
    ] = useState('regular');


    // ==================================================
    // DADOS AUXILIARES
    // ==================================================

    const [
        turmas,
        setTurmas
    ] = useState([]);


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


        setTurmaId(
            aula?.turma_id
                ? String(
                    aula.turma_id
                )
                : ''
        );


        setDataAula(
            aula?.data_aula
            ||
            dataInicial
            ||
            ''
        );


        setHoraInicio(
            aula?.hora_inicio
                ? aula.hora_inicio.substring(
                    0,
                    5
                )
                : ''
        );


        setHoraFim(
            aula?.hora_fim
                ? aula.hora_fim.substring(
                    0,
                    5
                )
                : ''
        );


        setTipo(
            aula?.tipo
            ||
            'regular'
        );


        setErro('');

        setSalvando(
            false
        );


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
        aberto,
        aula,
        dataInicial
    ]);


    if (!aberto) {
        return null;
    }


    // ==================================================
    // TURMAS DISPONÍVEIS
    // ==================================================

    const turmasDisponiveis =
        turmas.filter(
            (turma) => {

                if (
                    Number(
                        turma.ativo
                    ) === 1
                ) {

                    return true;
                }


                return (
                    editando
                    &&
                    Number(
                        turma.id
                    )
                    ===
                    Number(
                        aula.turma_id
                    )
                );
            }
        );


    // ==================================================
    // SALVAR
    // ==================================================

    async function salvar(
        evento
    ) {

        evento.preventDefault();


        setErro('');


        if (!turmaId) {

            setErro(
                'Selecione uma turma.'
            );

            return;
        }


        if (!dataAula) {

            setErro(
                'Informe a data da aula.'
            );

            return;
        }


        if (
            !horaInicio
            ||
            !horaFim
        ) {

            setErro(
                'Informe o horário da aula.'
            );

            return;
        }


        if (
            horaFim <= horaInicio
        ) {

            setErro(
                'O horário final deve ser posterior ao horário inicial.'
            );

            return;
        }


        try {

            setSalvando(
                true
            );


            const dados = {

                data_aula:
                    dataAula,

                hora_inicio:
                    horaInicio,

                hora_fim:
                    horaFim,

                tipo
            };


            if (editando) {

                await apiPut(
                    `/aulas/${aula.id}`,
                    dados
                );

            } else {

                await apiPost(
                    '/aulas',
                    {
                        turma_id:
                            Number(
                                turmaId
                            ),

                        ...dados
                    }
                );
            }


            await onSalva(
                editando
                    ? 'editada'
                    : 'criada'
            );


            onFechar();

        } catch (erro) {

            console.error(
                erro
            );


            setErro(
                erro.message
                ||
                'Não foi possível salvar a aula.'
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

                            {
                                editando
                                    ? 'Editar aula'
                                    : 'Nova aula'
                            }

                        </h2>


                        <p>

                            {
                                editando
                                    ? 'Altere os dados da aula agendada.'
                                    : 'Agende uma nova aula.'
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
                                                    "aula-turma"
                                            >
                                                Turma
                                            </label>


                                            <select
                                                id=
                                                    "aula-turma"

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
                                                    salvando
                                                    ||
                                                    editando
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
                                                            </option>

                                                        )
                                                    )
                                                }

                                            </select>


                                            {
                                                editando
                                                &&
                                                (

                                                    <small>
                                                        A turma não pode ser alterada depois que a aula foi criada.
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
                                                    "aula-data"
                                            >
                                                Data
                                            </label>


                                            <DataInputBR
                                                id=
                                                    "aula-data"

                                                value={
                                                    dataAula
                                                }

                                                onChange={
                                                    setDataAula
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


                                        {/* HORÁRIOS */}

                                        <div
                                            className=
                                                "aula-horarios-grid"
                                        >

                                            <div
                                                className=
                                                    "campo-formulario"
                                            >

                                                <label
                                                    htmlFor=
                                                        "aula-inicio"
                                                >
                                                    Início
                                                </label>


                                                <input
                                                    id=
                                                        "aula-inicio"

                                                    type=
                                                        "time"

                                                    value={
                                                        horaInicio
                                                    }

                                                    onChange={
                                                        (evento) =>
                                                            setHoraInicio(
                                                                evento.target.value
                                                            )
                                                    }

                                                    disabled={
                                                        salvando
                                                    }
                                                />

                                            </div>


                                            <div
                                                className=
                                                    "campo-formulario"
                                            >

                                                <label
                                                    htmlFor=
                                                        "aula-fim"
                                                >
                                                    Término
                                                </label>


                                                <input
                                                    id=
                                                        "aula-fim"

                                                    type=
                                                        "time"

                                                    value={
                                                        horaFim
                                                    }

                                                    onChange={
                                                        (evento) =>
                                                            setHoraFim(
                                                                evento.target.value
                                                            )
                                                    }

                                                    disabled={
                                                        salvando
                                                    }
                                                />

                                            </div>

                                        </div>


                                        {/* TIPO */}

                                        <div
                                            className=
                                                "campo-formulario"
                                        >

                                            <label
                                                htmlFor=
                                                    "aula-tipo"
                                            >
                                                Tipo
                                            </label>


                                            <select
                                                id=
                                                    "aula-tipo"

                                                value={
                                                    tipo
                                                }

                                                onChange={
                                                    (evento) =>
                                                        setTipo(
                                                            evento.target.value
                                                        )
                                                }

                                                disabled={
                                                    salvando
                                                }
                                            >

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
                            }
                        >

                            {
                                salvando
                                    ? 'Salvando...'
                                    : editando
                                        ? 'Salvar alterações'
                                        : 'Agendar aula'
                            }

                        </button>

                    </footer>

                </form>

            </section>

        </div>
    );
}


export default AulaModal;