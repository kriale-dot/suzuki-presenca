import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';


import {
    apiGet,
    apiPost
} from '../services/api';


// ==================================================
// CONTEXTO
// ==================================================

const AuthContext =
    createContext(
        null
    );


// ==================================================
// PROVIDER
// ==================================================

export function AuthProvider({
    children
}) {

    // ==================================================
    // ESTADOS
    // ==================================================

    const [
        usuario,
        setUsuario
    ] = useState(
        null
    );


    const [
        carregando,
        setCarregando
    ] = useState(
        true
    );


    // ==================================================
    // CONTROLE DE REVALIDAÇÃO
    //
    // Evita várias chamadas simultâneas para /auth/me
    // quando focus e visibilitychange são disparados
    // praticamente ao mesmo tempo.
    // ==================================================

    const verificacaoEmAndamentoRef =
        useRef(
            false
        );


    const ultimaVerificacaoRef =
        useRef(
            0
        );


    // ==================================================
    // LIMPAR USUÁRIO LOCAL
    // ==================================================

    const limparUsuario =
        useCallback(
            () => {

                setUsuario(
                    null
                );

            },
            []
        );


    // ==================================================
    // VERIFICAR SESSÃO
    //
    // Consulta /auth/me.
    //
    // O backend devolve os dados atuais do banco.
    //
    // Portanto, se outro administrador tiver:
    //
    // - alterado o perfil
    // - alterado o nome
    // - alterado o professor vinculado
    // - desativado o usuário
    //
    // a mudança será percebida aqui.
    // ==================================================

    const verificarSessao =
        useCallback(
            async (
                exibirCarregamento = false
            ) => {

                // ------------------------------------------
                // EVITA REQUISIÇÕES DUPLICADAS
                // ------------------------------------------

                if (
                    verificacaoEmAndamentoRef.current
                ) {

                    return null;
                }


                verificacaoEmAndamentoRef.current =
                    true;


                if (
                    exibirCarregamento
                ) {

                    setCarregando(
                        true
                    );
                }


                try {

                    const resposta =
                        await apiGet(
                            '/auth/me'
                        );


                    const usuarioAtual =
                        resposta?.usuario
                        ??
                        null;


                    setUsuario(
                        usuarioAtual
                    );


                    ultimaVerificacaoRef.current =
                        Date.now();


                    return usuarioAtual;

                } catch (erro) {

                    // --------------------------------------
                    // Sessão inexistente ou inválida.
                    //
                    // api.js também dispara
                    // suzuki:nao-autenticado em caso de 401.
                    // --------------------------------------

                    setUsuario(
                        null
                    );


                    return null;

                } finally {

                    verificacaoEmAndamentoRef.current =
                        false;


                    if (
                        exibirCarregamento
                    ) {

                        setCarregando(
                            false
                        );
                    }
                }
            },
            []
        );


    // ==================================================
    // LOGIN
    // ==================================================

    const entrar =
        useCallback(
            async (
                email,
                senha
            ) => {

                const resposta =
                    await apiPost(
                        '/auth/login',
                        {
                            email,
                            senha
                        }
                    );


                const usuarioLogado =
                    resposta?.usuario
                    ??
                    null;


                setUsuario(
                    usuarioLogado
                );


                ultimaVerificacaoRef.current =
                    Date.now();


                return resposta;
            },
            []
        );


    // ==================================================
    // LOGOUT
    // ==================================================

    const sair =
        useCallback(
            async () => {

                try {

                    await apiPost(
                        '/auth/logout',
                        {}
                    );

                } catch (erro) {

                    // Mesmo que a requisição falhe,
                    // limpamos o estado local para impedir
                    // que a interface continue se
                    // comportando como autenticada.

                    console.error(
                        'Erro ao encerrar sessão:',
                        erro
                    );

                } finally {

                    setUsuario(
                        null
                    );


                    ultimaVerificacaoRef.current =
                        0;
                }
            },
            []
        );


    // ==================================================
    // CARREGAMENTO INICIAL
    //
    // Ao abrir/recarregar o React, perguntamos ao backend
    // se já existe uma sessão válida.
    // ==================================================

    useEffect(
        () => {

            verificarSessao(
                true
            );

        },
        [
            verificarSessao
        ]
    );


    // ==================================================
    // EVENTO GLOBAL DE 401
    //
    // api.js dispara:
    //
    // suzuki:nao-autenticado
    //
    // quando uma chamada protegida recebe HTTP 401.
    // ==================================================

    useEffect(
        () => {

            function tratarNaoAutenticado() {

                setUsuario(
                    null
                );


                ultimaVerificacaoRef.current =
                    0;
            }


            window.addEventListener(
                'suzuki:nao-autenticado',
                tratarNaoAutenticado
            );


            return () => {

                window.removeEventListener(
                    'suzuki:nao-autenticado',
                    tratarNaoAutenticado
                );
            };

        },
        []
    );


    // ==================================================
    // REVALIDAÇÃO AUTOMÁTICA
    //
    // Quando o usuário volta para a janela do sistema,
    // atualizamos /auth/me.
    //
    // Isso é útil quando outro administrador modificou
    // a conta em outra janela ou outro computador.
    // ==================================================

    useEffect(
        () => {

            // Sem usuário autenticado não há necessidade
            // de consultar /auth/me a cada mudança de foco.

            if (!usuario) {

                return undefined;
            }


            // ------------------------------------------
            // EVITA DUAS VERIFICAÇÕES EM SEGUIDA
            // ------------------------------------------

            function podeVerificarAgora() {

                const agora =
                    Date.now();


                const intervalo =
                    agora
                    -
                    ultimaVerificacaoRef.current;


                // 2 segundos são suficientes para evitar
                // duplicação causada por focus +
                // visibilitychange.

                return intervalo
                    >=
                    2000;
            }


            // ------------------------------------------
            // JANELA RECEBEU FOCO
            // ------------------------------------------

            function aoReceberFoco() {

                if (
                    !podeVerificarAgora()
                ) {

                    return;
                }


                verificarSessao(
                    false
                );
            }


            // ------------------------------------------
            // ABA VOLTOU A FICAR VISÍVEL
            // ------------------------------------------

            function aoMudarVisibilidade() {

                if (
                    document.visibilityState
                    !==
                    'visible'
                ) {

                    return;
                }


                if (
                    !podeVerificarAgora()
                ) {

                    return;
                }


                verificarSessao(
                    false
                );
            }


            window.addEventListener(
                'focus',
                aoReceberFoco
            );


            document.addEventListener(
                'visibilitychange',
                aoMudarVisibilidade
            );


            return () => {

                window.removeEventListener(
                    'focus',
                    aoReceberFoco
                );


                document.removeEventListener(
                    'visibilitychange',
                    aoMudarVisibilidade
                );
            };

        },
        [
            usuario,
            verificarSessao
        ]
    );


    // ==================================================
    // VERIFICAÇÃO DE PERFIL
    //
    // Exemplos:
    //
    // possuiPerfil('administrador')
    //
    // possuiPerfil(
    //     'administrador',
    //     'secretaria'
    // )
    // ==================================================

    const possuiPerfil =
        useCallback(
            (
                ...perfis
            ) => {

                if (
                    !usuario
                ) {

                    return false;
                }


                return perfis.includes(
                    usuario.perfil
                );
            },
            [
                usuario
            ]
        );


    // ==================================================
    // VALORES DERIVADOS
    // ==================================================

    const autenticado =
        Boolean(
            usuario
        );


    // ==================================================
    // VALOR DO CONTEXTO
    // ==================================================

    const valor =
        useMemo(
            () => ({

                usuario,

                autenticado,

                carregando,

                entrar,

                sair,

                verificarSessao,

                possuiPerfil,

                limparUsuario

            }),
            [
                usuario,
                autenticado,
                carregando,
                entrar,
                sair,
                verificarSessao,
                possuiPerfil,
                limparUsuario
            ]
        );


    // ==================================================
    // PROVIDER
    // ==================================================

    return (

        <AuthContext.Provider
            value={
                valor
            }
        >

            {children}

        </AuthContext.Provider>
    );
}


// ==================================================
// HOOK
// ==================================================

export function useAuth() {

    const contexto =
        useContext(
            AuthContext
        );


    if (!contexto) {

        throw new Error(
            'useAuth deve ser utilizado dentro de AuthProvider.'
        );
    }


    return contexto;
}


export default AuthContext;