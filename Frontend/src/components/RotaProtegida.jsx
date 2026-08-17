import {
    Navigate,
    useLocation
} from 'react-router';


import {
    useAuth
} from '../contexts/AuthContext';


function RotaProtegida({
    children
}) {

    const {
        autenticado,
        carregando
    } = useAuth();


    const location =
        useLocation();


    // =================================================
    // AINDA ESTAMOS CONSULTANDO /auth/me
    // =================================================

    if (carregando) {

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
                    Verificando sessão...
                </p>

            </div>

        );
    }


    // =================================================
    // NÃO AUTENTICADO
    //
    // Guarda também o endereço que o usuário estava
    // tentando acessar.
    // =================================================

    if (!autenticado) {

        return (

            <Navigate
                to="/login"

                replace

                state={{
                    from:
                        location.pathname
                }}
            />

        );
    }


    // =================================================
    // AUTENTICADO
    // =================================================

    return children;
}


export default RotaProtegida;