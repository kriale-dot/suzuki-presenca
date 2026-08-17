import {
    useEffect,
    useMemo,
    useState
} from 'react';


import {
    QRCodeSVG
} from 'qrcode.react';


import {
    apiGet
} from '../services/api';



function Dashboard() {

    // ==================================================
    // ESTADOS
    // ==================================================

    const [
        alunos,
        setAlunos
    ] = useState([]);


    const [
        professores,
        setProfessores
    ] = useState([]);


    const [
        turmas,
        setTurmas
    ] = useState([]);


    const [
        carregando,
        setCarregando
    ] = useState(true);


    const [
        erro,
        setErro
    ] = useState('');


    // ==================================================
    // ENDEREÇO PARA O TABLET
    // ==================================================

    const loginTabletUrl =
        useMemo(
            () => {

                const configurada =
                    import.meta.env
                        .VITE_TABLET_LOGIN_URL;


                if (
                    configurada
                ) {

                    return configurada;
                }


                return `${window.location.origin}/login`;

            },
            []
        );


    // ==================================================
    // LOCALHOST?
    // ==================================================

    const usandoLocalhost =
        useMemo(
            () => {

                try {

                    const url =
                        new URL(
                            loginTabletUrl
                        );


                    return (
                        url.hostname
                        ===
                        'localhost'
                        ||
                        url.hostname
                        ===
                        '127.0.0.1'
                    );

                } catch {

                    return false;
                }

            },
            [
                loginTabletUrl
            ]
        );


    // ==================================================
    // CARREGAR DADOS
    // ==================================================

    useEffect(
        () => {

            let componenteAtivo =
                true;


            async function carregar() {

                try {

                    setCarregando(
                        true
                    );


                    setErro('');


                    const [
                        respostaAlunos,
                        respostaProfessores,
                        respostaTurmas
                    ] =
                        await Promise.all([

                            apiGet(
                                '/alunos'
                            ),

                            apiGet(
                                '/professores'
                            ),

                            apiGet(
                                '/turmas'
                            )

                        ]);


                    if (
                        !componenteAtivo
                    ) {

                        return;
                    }


                    setAlunos(
                        respostaAlunos
                            ?.dados
                        ||
                        []
                    );


                    setProfessores(
                        respostaProfessores
                            ?.dados
                        ||
                        []
                    );


                    setTurmas(
                        respostaTurmas
                            ?.dados
                        ||
                        []
                    );

                } catch (erro) {

                    console.error(
                        'Erro ao carregar painel:',
                        erro
                    );


                    if (
                        componenteAtivo
                    ) {

                        setErro(
                            erro.message
                            ||
                            'Não foi possível carregar o painel.'
                        );
                    }

                } finally {

                    if (
                        componenteAtivo
                    ) {

                        setCarregando(
                            false
                        );
                    }
                }
            }


            carregar();


            return () => {

                componenteAtivo =
                    false;
            };

        },
        []
    );


    // ==================================================
    // CONTADORES
    // ==================================================

    const totalAlunos =
        useMemo(
            () => {

                return alunos.filter(
                    (aluno) =>
                        Number(
                            aluno.ativo
                        )
                        ===
                        1
                ).length;

            },
            [
                alunos
            ]
        );


    const totalProfessores =
        useMemo(
            () => {

                return professores.filter(
                    (professor) =>
                        Number(
                            professor.ativo
                        )
                        ===
                        1
                ).length;

            },
            [
                professores
            ]
        );


    const totalTurmas =
        useMemo(
            () => {

                return turmas.filter(
                    (turma) =>
                        Number(
                            turma.ativo
                        )
                        ===
                        1
                ).length;

            },
            [
                turmas
            ]
        );


    // ==================================================
    // INTERFACE
    // ==================================================

    return (

        <div className="pagina">


            {/* =====================================
                CABEÇALHO
            ====================================== */}

            <header className="pagina-header">

                <div>

                    <h1>
                        Painel
                    </h1>


                    <p>
                        Visão geral do Estúdio Suzuki.
                    </p>

                </div>

            </header>


            {/* =====================================
                ERRO
            ====================================== */}

            {
                erro
                &&
                (

                    <div className="mensagem-erro dashboard-erro">

                        {erro}

                    </div>

                )
            }


            {/* =====================================
                CARREGAMENTO
            ====================================== */}

            {
                carregando

                    ? (

                        <div className="estado-pagina">

                            <div className="spinner" />


                            <p>
                                Carregando painel...
                            </p>

                        </div>

                    )

                    : (

                        <>


                            {/* =========================
                                CARDS
                            ========================== */}

                            <section className="dashboard-cards">


                                <article className="dashboard-card">

                                    <span className="dashboard-label">
                                        Alunos ativos
                                    </span>


                                    <strong className="dashboard-numero">

                                        {totalAlunos}

                                    </strong>


                                    <span className="dashboard-descricao">

                                        Alunos atualmente cadastrados.

                                    </span>

                                </article>


                                <article className="dashboard-card">

                                    <span className="dashboard-label">
                                        Professores ativos
                                    </span>


                                    <strong className="dashboard-numero">

                                        {totalProfessores}

                                    </strong>


                                    <span className="dashboard-descricao">

                                        Professores disponíveis no sistema.

                                    </span>

                                </article>


                                <article className="dashboard-card">

                                    <span className="dashboard-label">
                                        Turmas ativas
                                    </span>


                                    <strong className="dashboard-numero">

                                        {totalTurmas}

                                    </strong>


                                    <span className="dashboard-descricao">

                                        Turmas atualmente em funcionamento.

                                    </span>

                                </article>

                            </section>


                            {/* =========================
                                ACESSO PELO TABLET
                            ========================== */}

                            <section className="dashboard-tablet">


                                {/* INFORMAÇÕES */}

                                <div className="dashboard-tablet-conteudo">

                                    <span className="dashboard-tablet-tag">

                                        Tablet

                                    </span>


                                    <h2>

                                        Abrir Suzuki Presença no tablet

                                    </h2>


                                    <p>

                                        Escaneie o QR Code com a câmera
                                        do tablet para abrir diretamente
                                        a tela de login.

                                    </p>


                                    <div className="dashboard-tablet-endereco">

                                        <span>
                                            Endereço para acesso
                                        </span>


                                        <code>

                                            {
                                                loginTabletUrl
                                            }

                                        </code>

                                    </div>


                                    {
                                        usandoLocalhost
                                        &&
                                        (

                                            <div className="dashboard-tablet-aviso">

                                                O endereço está usando
                                                localhost. Configure
                                                VITE_TABLET_LOGIN_URL
                                                com o IP do computador
                                                para permitir o acesso
                                                pelo tablet.

                                            </div>

                                        )
                                    }


                                    <a
                                        href={
                                            loginTabletUrl
                                        }

                                        target="_blank"

                                        rel="noreferrer"

                                        className="botao-secundario dashboard-tablet-botao"
                                    >
                                        Abrir endereço
                                    </a>

                                </div>


                                {/* QR CODE */}

                                <div className="dashboard-tablet-qr-area">

                                    <div className="dashboard-tablet-qr">

                                        <QRCodeSVG
                                            value={
                                                loginTabletUrl
                                            }

                                            size={
                                                190
                                            }

                                            level="M"

                                            marginSize={
                                                3
                                            }
                                        />

                                    </div>


                                    <span className="dashboard-tablet-qr-legenda">

                                        Aponte a câmera do tablet

                                    </span>

                                </div>

                            </section>

                        </>

                    )
            }

        </div>
    );
}


export default Dashboard;