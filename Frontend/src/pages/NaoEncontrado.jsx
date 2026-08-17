import {
    Link
} from 'react-router';


function NaoEncontrado() {

    return (

        <div className="pagina">

            <header className="pagina-header">

                <div>

                    <h1>
                        Página não encontrada
                    </h1>

                    <p>
                        O endereço informado não existe
                        no Suzuki Presença.
                    </p>

                </div>

            </header>


            <section className="estado-pagina">

                <strong>
                    Erro 404
                </strong>


                <p>
                    Verifique o endereço ou volte
                    para o painel principal.
                </p>


                <Link
                    to="/"
                    className="botao-primario"
                >
                    Voltar ao painel
                </Link>

            </section>

        </div>
    );
}


export default NaoEncontrado;