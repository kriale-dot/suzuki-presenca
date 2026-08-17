import {
    useEffect,
    useState
} from 'react';


import {
    apiPost,
    apiPut
} from '../services/api';


function HorarioModal({
    aberto,
    turmaId,
    horario,
    onFechar,
    onSalvo
}) {

    // Se recebeu um horário, estamos editando.
    const editando =
        Boolean(horario);


    // ==================================================
    // ESTADOS
    // ==================================================

    const [
        diaSemana,
        setDiaSemana
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
        salvando,
        setSalvando
    ] = useState(false);


    const [
        erro,
        setErro
    ] = useState('');


    // ==================================================
    // PREENCHE O FORMULÁRIO
    // ==================================================

    useEffect(() => {

        if (!aberto) {
            return;
        }


        setDiaSemana(
            horario?.dia_semana
                ? String(
                    horario.dia_semana
                )
                : ''
        );


        setHoraInicio(
            horario?.hora_inicio
                ? horario.hora_inicio.substring(
                    0,
                    5
                )
                : ''
        );


        setHoraFim(
            horario?.hora_fim
                ? horario.hora_fim.substring(
                    0,
                    5
                )
                : ''
        );


        setErro('');

        setSalvando(false);

    }, [
        aberto,
        horario
    ]);


    // ==================================================
    // MODAL FECHADO
    // ==================================================

    if (!aberto) {
        return null;
    }


    // ==================================================
    // FECHAR PELO FUNDO
    // ==================================================

    function fecharPeloFundo(
        evento
    ) {

        if (
            evento.target ===
            evento.currentTarget
            &&
            !salvando
        ) {

            onFechar();
        }
    }


    // ==================================================
    // SALVAR
    // ==================================================

    async function salvar(
        evento
    ) {

        evento.preventDefault();


        setErro('');


        if (!diaSemana) {

            setErro(
                'Selecione o dia da semana.'
            );

            return;
        }


        if (!horaInicio) {

            setErro(
                'Informe a hora inicial.'
            );

            return;
        }


        if (!horaFim) {

            setErro(
                'Informe a hora final.'
            );

            return;
        }


        if (
            horaFim <= horaInicio
        ) {

            setErro(
                'A hora final deve ser posterior à hora inicial.'
            );

            return;
        }


        try {

            setSalvando(true);


            const dados = {

                dia_semana:
                    Number(
                        diaSemana
                    ),

                hora_inicio:
                    horaInicio,

                hora_fim:
                    horaFim

            };


            if (editando) {

                await apiPut(
                    `/turmas/${turmaId}/horarios/${horario.id}`,
                    {
                        ...dados,

                        ativo:
                            Number(
                                horario.ativo
                            )
                    }
                );

            } else {

                await apiPost(
                    `/turmas/${turmaId}/horarios`,
                    dados
                );
            }


            await onSalvo(
                editando
                    ? 'editado'
                    : 'criado'
            );


            onFechar();

        } catch (erro) {

            console.error(
                erro
            );


            setErro(
                erro.message ||
                'Não foi possível salvar o horário.'
            );

        } finally {

            setSalvando(false);
        }
    }


    // ==================================================
    // INTERFACE
    // ==================================================

    return (

        <div
            className="modal-overlay"

            onMouseDown={
                fecharPeloFundo
            }
        >

            <section
                className="modal"

                role="dialog"

                aria-modal="true"

                aria-labelledby=
                    "horario-modal-titulo"
            >

                <header className="modal-header">

                    <div>

                        <h2
                            id=
                                "horario-modal-titulo"
                        >

                            {
                                editando
                                    ? 'Editar horário'
                                    : 'Novo horário'
                            }

                        </h2>


                        <p>

                            {
                                editando
                                    ? 'Altere o dia ou horário da turma.'
                                    : 'Cadastre um horário semanal para esta turma.'
                            }

                        </p>

                    </div>


                    <button
                        type="button"

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

                    <div className="modal-body">


                        {/* DIA */}

                        <div
                            className=
                                "campo-formulario"
                        >

                            <label
                                htmlFor=
                                    "horario-dia"
                            >

                                Dia da semana

                                <span
                                    className=
                                        "campo-obrigatorio"
                                >
                                    *
                                </span>

                            </label>


                            <select
                                id="horario-dia"

                                value={
                                    diaSemana
                                }

                                onChange={
                                    (evento) =>
                                        setDiaSemana(
                                            evento.target.value
                                        )
                                }

                                disabled={
                                    salvando
                                }
                            >

                                <option value="">
                                    Selecione
                                </option>

                                <option value="1">
                                    Segunda-feira
                                </option>

                                <option value="2">
                                    Terça-feira
                                </option>

                                <option value="3">
                                    Quarta-feira
                                </option>

                                <option value="4">
                                    Quinta-feira
                                </option>

                                <option value="5">
                                    Sexta-feira
                                </option>

                                <option value="6">
                                    Sábado
                                </option>

                                <option value="7">
                                    Domingo
                                </option>

                            </select>

                        </div>


                        {/* HORAS */}

                        <div className="horario-form-grid">


                            <div
                                className=
                                    "campo-formulario"
                            >

                                <label
                                    htmlFor=
                                        "horario-inicio"
                                >
                                    Início
                                </label>


                                <input
                                    id=
                                        "horario-inicio"

                                    type="time"

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
                                        "horario-fim"
                                >
                                    Término
                                </label>


                                <input
                                    id="horario-fim"

                                    type="time"

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


                        {erro && (

                            <div
                                className=
                                    "formulario-erro"
                            >
                                {erro}
                            </div>

                        )}

                    </div>


                    <footer
                        className=
                            "modal-footer"
                    >

                        <button
                            type="button"

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
                            type="submit"

                            className=
                                "botao-primario"

                            disabled={
                                salvando
                            }
                        >

                            {
                                salvando
                                    ? 'Salvando...'
                                    : editando
                                        ? 'Salvar alterações'
                                        : 'Cadastrar horário'
                            }

                        </button>

                    </footer>

                </form>

            </section>

        </div>
    );
}


export default HorarioModal;