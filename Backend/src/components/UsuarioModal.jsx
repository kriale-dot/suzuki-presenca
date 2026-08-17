import {
    useEffect,
    useState
} from 'react';


import {
    apiGet,
    apiPost,
    apiPut
} from '../services/api';


import {
    useAuth
} from '../contexts/AuthContext';


function UsuarioModal({
    aberto,
    usuario,
    onFechar,
    onSalvo
}) {

    const {
        usuario: usuarioLogado
    } = useAuth();


    const editando =
        Boolean(usuario);


    const editandoProprioUsuario =
        Number(
            usuario?.id
        )
        ===
        Number(
            usuarioLogado?.id
        );


    // ==================================================
    // CAMPOS
    // ==================================================

    const [
        nome,
        setNome
    ] = useState('');


    const [
        email,
        setEmail
    ] = useState('');


    const [
        senha,
        setSenha
    ] = useState('');


    const [
        perfil,
        setPerfil
    ] = useState('secretaria');


    const [
        professorId,
        setProfessorId
    ] = useState('');


    // ==================================================
    // PROFESSORES
    // ==================================================

    const [
        professores,
        setProfessores
    ] = useState([]);


    const [
        carregandoProfessores,
        setCarregandoProfessores
    ] = useState(false);


    // ==================================================
    // ESTADOS
    // ==================================================

    const [
        salvando,
        setSalvando
    ] = useState(false);


    const [
        erro,
        setErro
    ] = useState('');


    // ==================================================
    // PREPARAR MODAL
    // ==================================================

    useEffect(() => {

        if (!aberto) {
            return;
        }


        setNome(
            usuario?.nome
            ||
            ''
        );


        setEmail(
            usuario?.email
            ||
            ''
        );


        setSenha('');


        setPerfil(
            usuario?.perfil
            ||
            'secretaria'
        );


        setProfessorId(
            usuario?.professor_id
                ? String(
                    usuario.professor_id
                )
                : ''
        );


        setErro('');


        setSalvando(
            false
        );

    }, [
        aberto,
        usuario
    ]);


    // ==================================================
    // CARREGAR PROFESSORES
    // ==================================================

    useEffect(() => {

        if (!aberto) {
            return;
        }


        let cancelado =
            false;


        async function carregarProfessores() {

            try {

                setCarregandoProfessores(
                    true
                );


                const resposta =
                    await apiGet(
                        '/professores'
                    );


                if (cancelado) {
                    return;
                }


                const lista =
                    resposta.dados
                    ||
                    [];


                /*
                 * Mostramos professores ativos.
                 *
                 * Se o usuário já estiver vinculado
                 * a algum professor, mantemos também
                 * esse professor na lista.
                 */
                const filtrados =
                    lista.filter(
                        (professor) => {

                            const ativo =
                                Number(
                                    professor.ativo
                                )
                                ===
                                1;


                            const atual =
                                Number(
                                    professor.id
                                )
                                ===
                                Number(
                                    usuario?.professor_id
                                );


                            return ativo
                                ||
                                atual;
                        }
                    );


                setProfessores(
                    filtrados
                );

            } catch (erro) {

                if (!cancelado) {

                    console.error(
                        'Erro ao carregar professores:',
                        erro
                    );


                    setErro(
                        erro.message
                        ||
                        'Não foi possível carregar os professores.'
                    );
                }

            } finally {

                if (!cancelado) {

                    setCarregandoProfessores(
                        false
                    );
                }
            }
        }


        carregarProfessores();


        return () => {

            cancelado =
                true;
        };

    }, [
        aberto,
        usuario
    ]);


    // ==================================================
    // MODAL FECHADO
    // ==================================================

    if (!aberto) {
        return null;
    }


    // ==================================================
    // ALTERAR PERFIL
    // ==================================================

    function alterarPerfil(
        novoPerfil
    ) {

        setPerfil(
            novoPerfil
        );


        /*
         * Se deixar de ser professor,
         * removemos o vínculo no formulário.
         */
        if (
            novoPerfil
            !==
            'professor'
        ) {

            setProfessorId('');
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


        if (!nome.trim()) {

            setErro(
                'Informe o nome do usuário.'
            );

            return;
        }


        if (!email.trim()) {

            setErro(
                'Informe o e-mail.'
            );

            return;
        }


        if (
            !editando
            &&
            !senha
        ) {

            setErro(
                'Informe a senha.'
            );

            return;
        }


        if (
            perfil === 'professor'
            &&
            !professorId
        ) {

            setErro(
                'Selecione o professor vinculado.'
            );

            return;
        }


        try {

            setSalvando(
                true
            );


            const dados = {

                nome:
                    nome.trim(),

                email:
                    email
                        .trim()
                        .toLowerCase(),

                perfil,

                professor_id:
                    perfil === 'professor'
                        ? Number(
                            professorId
                        )
                        : null
            };


            if (
                !editando
                ||
                senha
            ) {

                dados.senha =
                    senha;
            }


            let resposta;


            if (editando) {

                resposta =
                    await apiPut(
                        `/usuarios/${usuario.id}`,
                        dados
                    );

            } else {

                resposta =
                    await apiPost(
                        '/usuarios',
                        dados
                    );
            }


            await onSalvo(
                resposta.dados,
                editando
                    ? 'editado'
                    : 'criado'
            );


            onFechar();

        } catch (erro) {

            console.error(
                'Erro ao salvar usuário:',
                erro
            );


            setErro(
                erro.message
                ||
                'Não foi possível salvar o usuário.'
            );

        } finally {

            setSalvando(
                false
            );
        }
    }


    // ==================================================
    // INTERFACE
    // ==================================================

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

                            {
                                editando
                                    ? 'Editar usuário'
                                    : 'Novo usuário'
                            }

                        </h2>


                        <p>
                            Configure os dados e o perfil de acesso.
                        </p>

                    </div>


                    <button
                        type="button"

                        className="modal-fechar"

                        onClick={
                            onFechar
                        }

                        disabled={
                            salvando
                        }

                        aria-label="Fechar"
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


                        {/* =================================
                            NOME
                        ================================== */}

                        <div className="campo-formulario">

                            <label
                                htmlFor="usuario-nome"
                            >
                                Nome
                            </label>


                            <input
                                id="usuario-nome"

                                type="text"

                                value={
                                    nome
                                }

                                onChange={
                                    (evento) =>
                                        setNome(
                                            evento.target.value
                                        )
                                }

                                disabled={
                                    salvando
                                }

                                autoFocus
                            />

                        </div>


                        {/* =================================
                            E-MAIL
                        ================================== */}

                        <div className="campo-formulario">

                            <label
                                htmlFor="usuario-email"
                            >
                                E-mail
                            </label>


                            <input
                                id="usuario-email"

                                type="email"

                                value={
                                    email
                                }

                                onChange={
                                    (evento) =>
                                        setEmail(
                                            evento.target.value
                                        )
                                }

                                disabled={
                                    salvando
                                }

                                autoComplete="username"
                            />

                        </div>


                        {/* =================================
                            PERFIL
                        ================================== */}

                        <div className="campo-formulario">

                            <label
                                htmlFor="usuario-perfil"
                            >
                                Perfil de acesso
                            </label>


                            <select
                                id="usuario-perfil"

                                value={
                                    perfil
                                }

                                onChange={
                                    (evento) =>
                                        alterarPerfil(
                                            evento.target.value
                                        )
                                }

                                disabled={
                                    salvando
                                    ||
                                    editandoProprioUsuario
                                }
                            >

                                <option value="administrador">
                                    Administrador
                                </option>


                                <option value="secretaria">
                                    Secretaria
                                </option>


                                <option value="professor">
                                    Professor
                                </option>

                            </select>


                            {
                                editandoProprioUsuario
                                &&
                                (

                                    <small>
                                        Você não pode alterar o perfil da própria conta.
                                    </small>

                                )
                            }

                        </div>


                        {/* =================================
                            PROFESSOR VINCULADO
                        ================================== */}

                        {
                            perfil === 'professor'
                            &&
                            (

                                <div className="campo-formulario">

                                    <label
                                        htmlFor="usuario-professor"
                                    >
                                        Professor vinculado
                                    </label>


                                    <select
                                        id="usuario-professor"

                                        value={
                                            professorId
                                        }

                                        onChange={
                                            (evento) =>
                                                setProfessorId(
                                                    evento.target.value
                                                )
                                        }

                                        disabled={
                                            salvando
                                            ||
                                            carregandoProfessores
                                        }
                                    >

                                        <option value="">
                                            {
                                                carregandoProfessores
                                                    ? 'Carregando professores...'
                                                    : 'Selecione o professor'
                                            }
                                        </option>


                                        {
                                            professores.map(
                                                (professor) => (

                                                    <option
                                                        key={
                                                            professor.id
                                                        }

                                                        value={
                                                            professor.id
                                                        }
                                                    >

                                                        {
                                                            professor.nome
                                                        }

                                                        {
                                                            Number(
                                                                professor.ativo
                                                            )
                                                            !==
                                                            1
                                                                ? ' — inativo'
                                                                : ''
                                                        }

                                                    </option>

                                                )
                                            )
                                        }

                                    </select>


                                    <small>
                                        Este vínculo será usado para mostrar somente as aulas deste professor.
                                    </small>

                                </div>

                            )
                        }


                        {/* =================================
                            SENHA
                        ================================== */}

                        <div className="campo-formulario">

                            <label
                                htmlFor="usuario-senha"
                            >

                                {
                                    editando
                                        ? 'Nova senha'
                                        : 'Senha'
                                }

                            </label>


                            <input
                                id="usuario-senha"

                                type="password"

                                value={
                                    senha
                                }

                                onChange={
                                    (evento) =>
                                        setSenha(
                                            evento.target.value
                                        )
                                }

                                disabled={
                                    salvando
                                }

                                autoComplete="new-password"
                            />


                            {
                                editando
                                &&
                                (

                                    <small>
                                        Deixe em branco para manter a senha atual.
                                    </small>

                                )
                            }

                        </div>


                        {/* =================================
                            ERRO
                        ================================== */}

                        {
                            erro
                            &&
                            (

                                <div className="formulario-erro">
                                    {erro}
                                </div>

                            )
                        }

                    </div>


                    <footer className="modal-footer">

                        <button
                            type="button"

                            className="botao-secundario"

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

                            className="botao-primario"

                            disabled={
                                salvando
                                ||
                                carregandoProfessores
                            }
                        >

                            {
                                salvando
                                    ? 'Salvando...'
                                    : editando
                                        ? 'Salvar alterações'
                                        : 'Criar usuário'
                            }

                        </button>

                    </footer>

                </form>

            </section>

        </div>
    );
}


export default UsuarioModal;