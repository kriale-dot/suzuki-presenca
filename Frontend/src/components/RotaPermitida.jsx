import {
    Navigate
} from 'react-router';


import {
    useAuth
} from '../contexts/AuthContext';


function RotaPermitida({
    perfis,
    children
}) {

    const {
        usuario
    } = useAuth();


    const permitido =
        perfis.includes(
            usuario?.perfil
        );


    if (permitido) {

        return children;
    }


    // ==================================================
    // DESTINO SE NÃO TIVER PERMISSÃO
    // ==================================================

    if (
        usuario?.perfil
        ===
        'professor'
    ) {

        return (

            <Navigate
                to="/agenda"
                replace
            />

        );
    }


    return (

        <Navigate
            to="/"
            replace
        />

    );
}


export default RotaPermitida;