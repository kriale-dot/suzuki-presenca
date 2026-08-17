import {
    useEffect,
    useState
} from 'react';


import {
    apiPost
} from '../services/api';


function CancelarAulaModal({
    aberto,
    aula,
    onFechar,
    onCancelada
}) {

    const [
        motivo,
        setMotivo
    ] = useState('');


    const [
        salvando,
        setSalvando
    ] = useState(false);


    const [
        erro,
        setErro
    ] = useState('');


    useEffect(() => {

        if (!aberto) {
            return;
        }


        setMotivo('');

        setErro('');

        setSalvando(false);

    }, [
        aberto,
        aula
    ]);


    if (
        !aberto ||
        !aula
    ) {

        return null;
    }


    async function cancelar(
        evento
    ) {

        evento.preventDefault();


        try {

            setSalvando(true);

            setErro('');


            await apiPost(
                `/aulas/${aula.id}/cancelar`,
                {
                    motivo:
                        motivo.trim() ||
                        null
                }
            );


            await onCancelada();


            onFechar();

        } catch (erro) {

            console.error(
                erro
            );


            setErro(
                erro.message ||
                'Não foi possível cancelar a aula.'
            );

        } finally {

            setSalvando(false);
        }
    }


    return (

        <div className="modal-overlay">

            <section
                className="modal"

                role="dialog"

                aria-modal="true"
            >

                <header className="modal-header">

                    <div>

                        <h2>
                            Cancelar aula
                        </h2>

                        <p>
                            {aula.turma_nome}
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
                        cancelar
                    }
                >

                    <div className="modal-body">

                        <div className="cancelar-aula-aviso">

                            A aula ficará registrada
                            como cancelada no histórico.

                        </div>


                        <div
                            className=
                                "campo-formulario"
                        >

                            <label
                                htmlFor=
                                    "motivo-cancelamento"
                            >
                                Motivo
                            </label>


                            <textarea
                                id=
                                    "motivo-cancelamento"

                                maxLength={255}

                                rows={4}

                                placeholder=
                                    "Ex.: Professor indisponível"

                                value={
                                    motivo
                                }

                                onChange={
                                    (evento) =>
                                        setMotivo(
                                            evento.target.value
                                        )
                                }

                                disabled={
                                    salvando
                                }
                            />

                            <small>
                                Campo opcional
                            </small>

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


                    <footer className="modal-footer">

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
                            Voltar
                        </button>


                        <button
                            type="submit"

                            className=
                                "botao-perigo-secundario"

                            disabled={
                                salvando
                            }
                        >

                            {
                                salvando
                                    ? 'Cancelando...'
                                    : 'Cancelar aula'
                            }

                        </button>

                    </footer>

                </form>

            </section>

        </div>
    );
}


export default CancelarAulaModal;