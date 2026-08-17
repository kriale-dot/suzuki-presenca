import {
    Routes,
    Route
} from 'react-router';


import {
    AuthProvider
} from './contexts/AuthContext';


import RotaProtegida
    from './components/RotaProtegida';


import RotaPermitida
    from './components/RotaPermitida';


import AdminLayout
    from './components/AdminLayout';


import Dashboard
    from './pages/Dashboard';


import Alunos
    from './pages/Alunos';


import AlunoDetalhes
    from './pages/AlunoDetalhes';


import Professores
    from './pages/Professores';


import ProfessorDetalhes
    from './pages/ProfessorDetalhes';


import Modalidades
    from './pages/Modalidades';


import Turmas
    from './pages/Turmas';


import TurmaDetalhes
    from './pages/TurmaDetalhes';


import Agenda
    from './pages/Agenda';


import Aulas
    from './pages/Aulas';


import AulaDetalhes
    from './pages/AulaDetalhes';


import Presencas
    from './pages/Presencas';


import Usuarios
    from './pages/Usuarios';


import TabletPresenca
    from './pages/TabletPresenca';


import Login
    from './pages/Login';


import NaoEncontrado
    from './pages/NaoEncontrado';


import './App.css';


function App() {

    const perfisAdministrativos = [
        'administrador',
        'secretaria'
    ];


    const todosPerfis = [
        'administrador',
        'secretaria',
        'professor'
    ];


    return (

        <AuthProvider>

            <Routes>


                {/* LOGIN */}

                <Route
                    path="/login"
                    element={
                        <Login />
                    }
                />


                {/* TABLET - PÚBLICO */}

                <Route
                    path="/tablet/:identificador/aulas/:aulaId"

                    element={
                        <TabletPresenca />
                    }
                />


                {/* ÁREA AUTENTICADA */}

                <Route
                    path="/"

                    element={

                        <RotaProtegida>

                            <AdminLayout />

                        </RotaProtegida>

                    }
                >


                    {/* PAINEL */}

                    <Route
                        index

                        element={

                            <RotaPermitida
                                perfis={
                                    perfisAdministrativos
                                }
                            >

                                <Dashboard />

                            </RotaPermitida>
                        }
                    />


                    {/* ALUNOS */}

                    <Route
                        path="alunos"

                        element={

                            <RotaPermitida
                                perfis={
                                    perfisAdministrativos
                                }
                            >

                                <Alunos />

                            </RotaPermitida>
                        }
                    />


                    <Route
                        path="alunos/:id"

                        element={

                            <RotaPermitida
                                perfis={
                                    perfisAdministrativos
                                }
                            >

                                <AlunoDetalhes />

                            </RotaPermitida>
                        }
                    />


                    {/* PROFESSORES */}

                    <Route
                        path="professores"

                        element={

                            <RotaPermitida
                                perfis={
                                    perfisAdministrativos
                                }
                            >

                                <Professores />

                            </RotaPermitida>
                        }
                    />


                    <Route
                        path="professores/:id"

                        element={

                            <RotaPermitida
                                perfis={
                                    perfisAdministrativos
                                }
                            >

                                <ProfessorDetalhes />

                            </RotaPermitida>
                        }
                    />


                    {/* MODALIDADES */}

                    <Route
                        path="modalidades"

                        element={

                            <RotaPermitida
                                perfis={
                                    perfisAdministrativos
                                }
                            >

                                <Modalidades />

                            </RotaPermitida>
                        }
                    />


                    {/* TURMAS */}

                    <Route
                        path="turmas"

                        element={

                            <RotaPermitida
                                perfis={
                                    perfisAdministrativos
                                }
                            >

                                <Turmas />

                            </RotaPermitida>
                        }
                    />


                    <Route
                        path="turmas/:id"

                        element={

                            <RotaPermitida
                                perfis={
                                    perfisAdministrativos
                                }
                            >

                                <TurmaDetalhes />

                            </RotaPermitida>
                        }
                    />


                    {/* AGENDA */}

                    <Route
                        path="agenda"

                        element={

                            <RotaPermitida
                                perfis={
                                    todosPerfis
                                }
                            >

                                <Agenda />

                            </RotaPermitida>
                        }
                    />


                    {/* AULAS */}

                    <Route
                        path="aulas"

                        element={

                            <RotaPermitida
                                perfis={
                                    todosPerfis
                                }
                            >

                                <Aulas />

                            </RotaPermitida>
                        }
                    />


                    {/* DETALHES DA AULA */}

                    <Route
                        path="aulas/:id"

                        element={

                            <RotaPermitida
                                perfis={
                                    todosPerfis
                                }
                            >

                                <AulaDetalhes />

                            </RotaPermitida>
                        }
                    />


                    {/* PRESENÇAS */}

                    <Route
                        path="presencas"

                        element={

                            <RotaPermitida
                                perfis={
                                    todosPerfis
                                }
                            >

                                <Presencas />

                            </RotaPermitida>
                        }
                    />


                    {/* USUÁRIOS */}

                    <Route
                        path="usuarios"

                        element={

                            <RotaPermitida
                                perfis={[
                                    'administrador'
                                ]}
                            >

                                <Usuarios />

                            </RotaPermitida>
                        }
                    />


                </Route>


                {/* 404 */}

                <Route
                    path="*"

                    element={
                        <NaoEncontrado />
                    }
                />


            </Routes>

        </AuthProvider>
    );
}


export default App;