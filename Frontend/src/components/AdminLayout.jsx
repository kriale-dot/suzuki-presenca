import {
    NavLink,
    Outlet,
    useNavigate
} from 'react-router';


import {
    useState
} from 'react';


import {
    FiHome,
    FiCalendar,
    FiClipboard,
    FiCheckSquare,
    FiLogOut
} from 'react-icons/fi';


import {
    PiStudent,
    PiChalkboardTeacher
} from 'react-icons/pi';


import {
    MdLibraryMusic
} from 'react-icons/md';


import {
    HiOutlineUserGroup
} from 'react-icons/hi2';


import {
    FaUserGear
} from 'react-icons/fa6';


import {
    useAuth
} from '../contexts/AuthContext';


import '../styles/menu-icons.css';


function AdminLayout() {

    const {
        usuario,
        sair
    } = useAuth();


    const navigate =
        useNavigate();


    const [
        saindo,
        setSaindo
    ] = useState(false);


    const administrador =
        usuario?.perfil
        ===
        'administrador';


    const secretaria =
        usuario?.perfil
        ===
        'secretaria';


    const professor =
        usuario?.perfil
        ===
        'professor';


    // ==================================================
    // SAIR
    // ==================================================

    async function handleSair() {

        if (saindo) {
            return;
        }


        try {

            setSaindo(
                true
            );


            await sair();


            navigate(
                '/login',
                {
                    replace: true
                }
            );

        } finally {

            setSaindo(
                false
            );
        }
    }


    // ==================================================
    // CLASSE DO ITEM DO MENU
    // ==================================================

    function classeMenu({
        isActive
    }) {

        return isActive
            ? 'menu-item ativo'
            : 'menu-item';
    }


    return (

        <div className="admin-layout">


            {/* =====================================
                MENU LATERAL
            ====================================== */}

            <aside className="sidebar">


                {/* =================================
                    LOGOTIPO
                ================================== */}

                <div className="sidebar-logo">

                    <div className="logo-symbol">
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
                    MENU
                ================================== */}

                <nav className="sidebar-menu">


                    {/* =============================
                        PAINEL
                    ============================== */}

                    {
                        !professor
                        &&
                        (

                            <NavLink
                                to="/"
                                end
                                className={
                                    classeMenu
                                }
                            >

                                <span
                                    className="
                                        menu-icon
                                        menu-icon-painel
                                    "
                                >

                                    <FiHome />

                                </span>

                                <span>
                                    Painel
                                </span>

                            </NavLink>

                        )
                    }


                    {/* =============================
                        ALUNOS
                    ============================== */}

                    {
                        (
                            administrador
                            ||
                            secretaria
                        )
                        &&
                        (

                            <NavLink
                                to="/alunos"
                                className={
                                    classeMenu
                                }
                            >

                                <span
                                    className="
                                        menu-icon
                                        menu-icon-alunos
                                    "
                                >

                                    <PiStudent />

                                </span>

                                <span>
                                    Alunos
                                </span>

                            </NavLink>

                        )
                    }


                    {/* =============================
                        PROFESSORES
                    ============================== */}

                    {
                        (
                            administrador
                            ||
                            secretaria
                        )
                        &&
                        (

                            <NavLink
                                to="/professores"
                                className={
                                    classeMenu
                                }
                            >

                                <span
                                    className="
                                        menu-icon
                                        menu-icon-professores
                                    "
                                >

                                    <PiChalkboardTeacher />

                                </span>

                                <span>
                                    Professores
                                </span>

                            </NavLink>

                        )
                    }


                    {/* =============================
                        MODALIDADES
                    ============================== */}

                    {
                        (
                            administrador
                            ||
                            secretaria
                        )
                        &&
                        (

                            <NavLink
                                to="/modalidades"
                                className={
                                    classeMenu
                                }
                            >

                                <span
                                    className="
                                        menu-icon
                                        menu-icon-modalidades
                                    "
                                >

                                    <MdLibraryMusic />

                                </span>

                                <span>
                                    Modalidades
                                </span>

                            </NavLink>

                        )
                    }


                    {/* =============================
                        TURMAS
                    ============================== */}

                    {
                        (
                            administrador
                            ||
                            secretaria
                        )
                        &&
                        (

                            <NavLink
                                to="/turmas"
                                className={
                                    classeMenu
                                }
                            >

                                <span
                                    className="
                                        menu-icon
                                        menu-icon-turmas
                                    "
                                >

                                    <HiOutlineUserGroup />

                                </span>

                                <span>
                                    Turmas
                                </span>

                            </NavLink>

                        )
                    }


                    {/* =============================
                        AGENDA
                    ============================== */}

                    <NavLink
                        to="/agenda"
                        className={
                            classeMenu
                        }
                    >

                        <span
                            className="
                                menu-icon
                                menu-icon-agenda
                            "
                        >

                            <FiCalendar />

                        </span>

                        <span>
                            Agenda
                        </span>

                    </NavLink>


                    {/* =============================
                        AULAS
                    ============================== */}

                    <NavLink
                        to="/aulas"
                        end
                        className={
                            classeMenu
                        }
                    >

                        <span
                            className="
                                menu-icon
                                menu-icon-aulas
                            "
                        >

                            <FiClipboard />

                        </span>

                        <span>
                            Aulas
                        </span>

                    </NavLink>


                    {/* =============================
                        PRESENÇAS
                    ============================== */}

                    <NavLink
                        to="/presencas"
                        className={
                            classeMenu
                        }
                    >

                        <span
                            className="
                                menu-icon
                                menu-icon-presencas
                            "
                        >

                            <FiCheckSquare />

                        </span>

                        <span>
                            Presenças
                        </span>

                    </NavLink>


                    {/* =============================
                        USUÁRIOS
                        SOMENTE ADMINISTRADOR
                    ============================== */}

                    {
                        administrador
                        &&
                        (

                            <NavLink
                                to="/usuarios"
                                className={
                                    classeMenu
                                }
                            >

                                <span
                                    className="
                                        menu-icon
                                        menu-icon-usuarios
                                    "
                                >

                                    <FaUserGear />

                                </span>

                                <span>
                                    Usuários
                                </span>

                            </NavLink>

                        )
                    }

                </nav>


                {/* =================================
                    USUÁRIO LOGADO
                ================================== */}

                <div className="sidebar-footer">

                    <div className="sidebar-usuario">

                        <div className="sidebar-usuario-info">

                            <strong>
                                {usuario?.nome}
                            </strong>


                            <span>
                                {usuario?.email}
                            </span>


                            <span>

                                {
                                    usuario?.perfil
                                    ===
                                    'administrador'

                                        ? 'Administrador'

                                        : usuario?.perfil
                                        ===
                                        'secretaria'

                                            ? 'Secretaria'

                                            : 'Professor'
                                }

                            </span>

                        </div>


                        <button
                            type="button"

                            className="sidebar-sair"

                            onClick={
                                handleSair
                            }

                            disabled={
                                saindo
                            }
                        >

                            <FiLogOut />

                            <span>

                                {
                                    saindo
                                        ? 'Saindo...'
                                        : 'Sair'
                                }

                            </span>

                        </button>

                    </div>


                    <span className="sidebar-versao">
                        Suzuki Presença
                    </span>

                </div>

            </aside>


            {/* =====================================
                CONTEÚDO PRINCIPAL
            ====================================== */}

            <main className="admin-content">

                <Outlet />

            </main>

        </div>
    );
}


export default AdminLayout;