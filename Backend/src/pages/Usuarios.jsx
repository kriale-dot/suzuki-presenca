import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from 'react';


import {
    apiDelete,
    apiGet,
    apiPut
} from '../services/api';


import {
    useAuth
} from '../contexts/AuthContext';


import UsuarioModal
    from '../components/UsuarioModal';


import '../styles/usuarios.css';


function Usuarios() {

    const {
        usuario: usuarioLogado,
        verificarSessao
    } = useAuth();


    const [
        usuarios,
        setUsuarios
    ] = useState([]);


    const [
        busca,
        setBusca
    ] = useState('');


    const [
        carregando,
        setCarregando
    ] = useState(true);


    const [
        processandoId,
        setProcessandoId
    ] = useState(null);


    const [
        erro,
        setErro
    ] = useState('');


    const [
        mensagem,
        setMensagem
    ] = useState('');


    const [
        modalAberto,
        setModalAberto
    ] = useState(false);


    const [
        usuarioEditando,
        setUsuarioEditando
    ] = useState(null);


    // ==================================================
    // CARREGAR
    // ==================================================

    const carregarUsuarios =
        useCallback(
            async () => {

                try {

                    setCarregando(
                        true
                    );


                    setErro('');


                    const resposta =
                        await apiGet(
                            '/usuarios'
                        );


                    setUsuarios(
                        resposta.dados
                        ||
                        []
                    );

                } catch (erro) {

                    console.error(
                        'Erro ao carregar usuários:',
                        erro
                    );


                    setErro(
                        erro.message
                        ||
                        'Não foi possível carregar os usuários.'
                    );

                } finally {

                    setCarregando(
                        false
                    );
                }
            },
            []
        );


    useEffect(() => {

        carregarUsuarios();

    }, [
        carregarUsuarios
    ]);


    // ==================================================
    // MENSAGEM AUTOMÁTICA
    // ==================================================

    useEffect(() => {

        if (!mensagem) {
            return undefined;
        }


        const timer =
            setTimeout(
                () =>
                    setMensagem(''),
                4000
            );


        return () =>
            clearTimeout(
                timer
            );

    }, [
        mensagem
    ]);


    // ==================================================
    // FILTRO
    // ==================================================

    const usuariosFiltrados =
        useMemo(
            () => {

                const texto =
                    busca
                        .trim()
                        .toLowerCase();


                if (!texto) {
                    return usuarios;
                }


                return usuarios.filter(
                    (usuario) => {

                        const campos = `
                            ${usuario.nome || ''}
                            ${usuario.email || ''}
                            ${usuario.perfil || ''}
                            ${usuario.professor_nome || ''}
                        `
                            .toLowerCase();


                        return campos.includes(
                            texto
                        );
                    }
                );

            },
            [
                usuarios,
                busca
            ]
        );


    // ==================================================
    // NOME DO PERFIL
    // ==================================================

    function nomePerfil(
        perfil
    ) {

        switch (perfil) {

            case 'administrador':
                return 'Administrador';

            case 'secretaria':
                return 'Secretaria';

            case 'professor':
                return 'Professor';

            default:
                return perfil;
        }
    }


    // ==================================================
    // NOVO
    // ==================================================

    function novoUsuario() {

        setErro('');


        setUsuarioEditando(
            null
        );


        setModalAberto(
            true
        );
    }


    // ==================================================
    // EDITAR
    // ==================================================

    function editarUsuario(
        usuario
    ) {

        setErro('');


        setUsuarioEditando(
            usuario
        );


        setModalAberto(
            true
        );
    }


    // ==================================================
    // SALVO
    // ==================================================

    async function usuarioSalvo(
        usuarioSalvo,
        acao
    ) {

        await carregarUsuarios();


        if (
            Number(
                usuarioSalvo?.id
            )
            ===
            Number(
                usuarioLogado?.id
            )
        ) {

            await verificarSessao();
        }


        setMensagem(
            acao === 'editado'
                ? 'Usuário atualizado com sucesso.'
                : 'Usuário criado com sucesso.'
        );
    }


    // ==================================================
    // DESATIVAR
    // ==================================================

    async function desativarUsuario(
        usuario
    ) {

        setErro('');


        if (
            Number(
                usuario.id
            )
            ===
            Number(
                usuarioLogado?.id
            )
        ) {

            setErro(
                'Você não pode desativar a própria conta.'
            );

            return;
        }


        const confirmou =
            window.confirm(
                `Desativar o usuário "${usuario.nome}"?`
            );


        if (!confirmou) {
            return;
        }


        try {

            setProcessandoId(
                usuario.id
            );


            await apiDelete(
                `/usuarios/${usuario.id}`
            );


            await carregarUsuarios();


            setMensagem(
                'Usuário desativado com sucesso.'
            );

        } catch (erro) {

            console.error(
                'Erro ao desativar usuário:',
                erro
            );


            setErro(
                erro.message
                ||
                'Não foi possível desativar o usuário.'
            );

        } finally {

            setProcessandoId(
                null
            );
        }
    }


    // ==================================================
    // ATIVAR
    // ==================================================

    async function ativarUsuario(
        usuario
    ) {

        setErro('');


        try {

            setProcessandoId(
                usuario.id
            );


            await apiPut(
                `/usuarios/${usuario.id}`,
                {
                    ativo: 1
                }
            );


            await carregarUsuarios();


            setMensagem(
                'Usuário reativado com sucesso.'
            );

        } catch (erro) {

            console.error(
                'Erro ao reativar usuário:',
                erro
            );


            setErro(
                erro.message
                ||
                'Não foi possível reativar o usuário.'
            );

        } finally {

            setProcessandoId(
                null
            );
        }
    }


    // ==================================================
    // FORMATAR DATA
    // ==================================================

    function formatarDataHora(
        valor
    ) {

        if (!valor) {
            return 'Nunca';
        }


        const data =
            new Date(
                valor.replace(
                    ' ',
                    'T'
                )
            );


        if (
            Number.isNaN(
                data.getTime()
            )
        ) {

            return valor;
        }


        return data.toLocaleString(
            'pt-BR'
        );
    }


    // ==================================================
    // INTERFACE
    // ==================================================

    return (

        <div className="pagina">


            {
                mensagem
                &&
                (

                    <div className="toast-sucesso">

                        <span className="toast-icone">
                            ✓
                        </span>

                        {mensagem}

                    </div>

                )
            }


            <header className="pagina-header">

                <div>

                    <h1>
                        Usuários
                    </h1>


                    <p>
                        Gerencie usuários, níveis de acesso e vínculos com professores.
                    </p>

                </div>


                <button
                    type="button"

                    className="botao-primario"

                    onClick={
                        novoUsuario
                    }
                >
                    + Novo usuário
                </button>

            </header>


            {/* =========================================
                BUSCA
            ========================================== */}

            <section className="usuarios-filtros">

                <div className="campo-busca usuarios-busca">

                    <span>
                        ⌕
                    </span>


                    <input
                        type="search"

                        placeholder=
                            "Buscar por nome, e-mail ou professor..."

                        value={
                            busca
                        }

                        onChange={
                            (evento) =>
                                setBusca(
                                    evento.target.value
                                )
                        }
                    />

                </div>

            </section>


            {/* =========================================
                ERRO
            ========================================== */}

            {
                erro
                &&
                (

                    <div className="mensagem-erro usuarios-erro">
                        {erro}
                    </div>

                )
            }


            {/* =========================================
                CONTEÚDO
            ========================================== */}

            {
                carregando

                    ? (

                        <div className="estado-pagina">

                            <div className="spinner" />


                            <p>
                                Carregando usuários...
                            </p>

                        </div>

                    )

                    : usuariosFiltrados.length === 0

                        ? (

                            <section className="usuarios-vazio">

                                <strong>
                                    Nenhum usuário encontrado
                                </strong>


                                <p>
                                    Cadastre um usuário ou altere os termos da busca.
                                </p>

                            </section>

                        )

                        : (

                            <section className="usuarios-lista">

                                {
                                    usuariosFiltrados.map(
                                        (usuario) => {

                                            const ativo =
                                                Number(
                                                    usuario.ativo
                                                )
                                                ===
                                                1;


                                            const atual =
                                                Number(
                                                    usuario.id
                                                )
                                                ===
                                                Number(
                                                    usuarioLogado?.id
                                                );


                                            const processando =
                                                Number(
                                                    processandoId
                                                )
                                                ===
                                                Number(
                                                    usuario.id
                                                );


                                            return (

                                                <article
                                                    key={
                                                        usuario.id
                                                    }

                                                    className="usuario-card"
                                                >


                                                    {/* AVATAR */}

                                                    <div className="usuario-avatar">

                                                        {
                                                            usuario.nome
                                                                ?.trim()
                                                                ?.charAt(0)
                                                                ?.toUpperCase()
                                                            ||
                                                            'U'
                                                        }

                                                    </div>


                                                    {/* INFORMAÇÕES */}

                                                    <div className="usuario-info">

                                                        <div className="usuario-nome-linha">

                                                            <strong>
                                                                {usuario.nome}
                                                            </strong>


                                                            {
                                                                atual
                                                                &&
                                                                (

                                                                    <span className="usuario-atual">
                                                                        Você
                                                                    </span>

                                                                )
                                                            }


                                                            <span
                                                                className={
                                                                    ativo
                                                                        ? 'usuario-status ativo'
                                                                        : 'usuario-status inativo'
                                                                }
                                                            >

                                                                {
                                                                    ativo
                                                                        ? 'Ativo'
                                                                        : 'Inativo'
                                                                }

                                                            </span>


                                                            <span
                                                                className={
                                                                    `usuario-perfil ${usuario.perfil}`
                                                                }
                                                            >

                                                                {
                                                                    nomePerfil(
                                                                        usuario.perfil
                                                                    )
                                                                }

                                                            </span>

                                                        </div>


                                                        <span>
                                                            {usuario.email}
                                                        </span>


                                                        {
                                                            usuario.perfil === 'professor'
                                                            &&
                                                            (

                                                                <small className="usuario-professor-vinculado">

                                                                    Professor vinculado:{' '}

                                                                    <strong>
                                                                        {
                                                                            usuario.professor_nome
                                                                            ||
                                                                            'Não vinculado'
                                                                        }
                                                                    </strong>

                                                                </small>

                                                            )
                                                        }


                                                        <small>

                                                            Último acesso:{' '}

                                                            {
                                                                formatarDataHora(
                                                                    usuario.ultimo_login_em
                                                                )
                                                            }

                                                        </small>

                                                    </div>


                                                    {/* AÇÕES */}

                                                    <div className="usuario-acoes">

                                                        <button
                                                            type="button"

                                                            className="botao-secundario"

                                                            onClick={
                                                                () =>
                                                                    editarUsuario(
                                                                        usuario
                                                                    )
                                                            }

                                                            disabled={
                                                                processando
                                                            }
                                                        >
                                                            Editar
                                                        </button>


                                                        {
                                                            ativo

                                                                ? (

                                                                    <button
                                                                        type="button"

                                                                        className=
                                                                            "botao-perigo-secundario"

                                                                        onClick={
                                                                            () =>
                                                                                desativarUsuario(
                                                                                    usuario
                                                                                )
                                                                        }

                                                                        disabled={
                                                                            processando
                                                                            ||
                                                                            atual
                                                                        }
                                                                    >

                                                                        {
                                                                            processando
                                                                                ? 'Processando...'
                                                                                : 'Desativar'
                                                                        }

                                                                    </button>

                                                                )

                                                                : (

                                                                    <button
                                                                        type="button"

                                                                        className="botao-primario"

                                                                        onClick={
                                                                            () =>
                                                                                ativarUsuario(
                                                                                    usuario
                                                                                )
                                                                        }

                                                                        disabled={
                                                                            processando
                                                                        }
                                                                    >

                                                                        {
                                                                            processando
                                                                                ? 'Processando...'
                                                                                : 'Ativar'
                                                                        }

                                                                    </button>

                                                                )
                                                        }

                                                    </div>

                                                </article>
                                            );
                                        }
                                    )
                                }

                            </section>

                        )
            }


            <UsuarioModal
                aberto={
                    modalAberto
                }

                usuario={
                    usuarioEditando
                }

                onFechar={
                    () => {

                        setModalAberto(
                            false
                        );


                        setUsuarioEditando(
                            null
                        );
                    }
                }

                onSalvo={
                    usuarioSalvo
                }
            />

        </div>
    );
}


export default Usuarios;