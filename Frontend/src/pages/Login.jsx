import {
    Navigate,
    useLocation,
    useNavigate
} from 'react-router';


import {
    useState
} from 'react';


import {
    useAuth
} from '../contexts/AuthContext';


import '../styles/login.css';


function Login() {

    const {
        autenticado,
        entrar
    } = useAuth();


    const navigate =
        useNavigate();


    const location =
        useLocation();


    // =================================================
    // CAMPOS
    // =================================================

    const [
        email,
        setEmail
    ] = useState('');


    const [
        senha,
        setSenha
    ] = useState('');


    // =================================================
    // ESTADOS
    // =================================================

    const [
        entrando,
        setEntrando
    ] = useState(false);


    const [
        erro,
        setErro
    ] = useState('');


    // =================================================
    // SE JÁ ESTÁ AUTENTICADO, NÃO PRECISA VER LOGIN
    // =================================================

    if (autenticado) {

        return (

            <Navigate
                to="/"

                replace
            />

        );
    }


    // =================================================
    // REALIZA LOGIN
    // =================================================

    async function handleSubmit(
        evento
    ) {

        evento.preventDefault();


        setErro('');


        // ---------------------------------------------
        // VALIDAÇÃO BÁSICA
        // ---------------------------------------------

        if (
            !email.trim()
            ||
            !senha
        ) {

            setErro(
                'Informe o e-mail e a senha.'
            );

            return;
        }


        try {

            setEntrando(
                true
            );


            // -----------------------------------------
            // CHAMA POST /auth/login
            // -----------------------------------------

            await entrar(
                email.trim(),
                senha
            );


            /*
             * Se o usuário tentou acessar diretamente
             * uma página protegida, retornamos para ela.
             *
             * Exemplo:
             *
             * /agenda
             *    ↓
             * /login
             *    ↓
             * login
             *    ↓
             * /agenda
             */

            const destino =
                location.state?.from
                ||
                '/';


            navigate(
                destino,
                {
                    replace:
                        true
                }
            );

        } catch (erro) {

            console.error(
                'Erro de login:',
                erro
            );


            setErro(
                erro.message
                ||
                'Não foi possível entrar.'
            );

        } finally {

            setEntrando(
                false
            );
        }
    }


    // =================================================
    // INTERFACE
    // =================================================

    return (

        <main
            className=
                "login-pagina"
        >

            <section
                className=
                    "login-card"
            >

                {/* =================================
                    MARCA
                ================================== */}

                <div
                    className=
                        "login-marca"
                >

                    <div
                        className=
                            "login-logo"
                    >
                        ♪
                    </div>


                    <div>

                        <strong>
                            Estúdio Suzuki
                        </strong>


                        <span>
                            Controle de presença
                        </span>

                    </div>

                </div>


                {/* =================================
                    CABEÇALHO
                ================================== */}

                <div
                    className=
                        "login-cabecalho"
                >

                    <h1>
                        Entrar
                    </h1>


                    <p>
                        Acesse a área administrativa.
                    </p>

                </div>


                {/* =================================
                    FORMULÁRIO
                ================================== */}

                <form
                    onSubmit={
                        handleSubmit
                    }
                >

                    {/* E-MAIL */}

                    <div
                        className=
                            "campo-formulario"
                    >

                        <label
                            htmlFor=
                                "login-email"
                        >
                            E-mail
                        </label>


                        <input
                            id=
                                "login-email"

                            type=
                                "email"

                            value={
                                email
                            }

                            onChange={
                                (evento) =>
                                    setEmail(
                                        evento.target.value
                                    )
                            }

                            autoComplete=
                                "username"

                            disabled={
                                entrando
                            }

                            autoFocus
                        />

                    </div>


                    {/* SENHA */}

                    <div
                        className=
                            "campo-formulario"
                    >

                        <label
                            htmlFor=
                                "login-senha"
                        >
                            Senha
                        </label>


                        <input
                            id=
                                "login-senha"

                            type=
                                "password"

                            value={
                                senha
                            }

                            onChange={
                                (evento) =>
                                    setSenha(
                                        evento.target.value
                                    )
                            }

                            autoComplete=
                                "current-password"

                            disabled={
                                entrando
                            }
                        />

                    </div>


                    {/* ERRO */}

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


                    {/* BOTÃO */}

                    <button
                        type=
                            "submit"

                        className=
                            "botao-primario login-botao"

                        disabled={
                            entrando
                        }
                    >

                        {
                            entrando
                                ? 'Entrando...'
                                : 'Entrar'
                        }

                    </button>

                </form>

            </section>

        </main>

    );
}


export default Login;