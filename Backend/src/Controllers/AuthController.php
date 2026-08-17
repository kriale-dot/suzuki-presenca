<?php

namespace App\Controllers;

use App\Repositories\UsuarioRepository;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;


class AuthController
{
    private UsuarioRepository $usuarios;


    public function __construct(
        UsuarioRepository $usuarios
    ) {
        $this->usuarios =
            $usuarios;
    }


    // ==================================================
    // JSON
    // ==================================================

    private function responderJson(
        Response $response,
        array $dados,
        int $status = 200
    ): Response {

        $response
            ->getBody()
            ->write(
                json_encode(
                    $dados,
                    JSON_UNESCAPED_UNICODE
                    |
                    JSON_UNESCAPED_SLASHES
                )
            );


        return $response

            ->withHeader(
                'Content-Type',
                'application/json; charset=utf-8'
            )

            ->withStatus(
                $status
            );
    }


    // ==================================================
    // USUÁRIO PARA RESPOSTA
    // ==================================================

    private function dadosUsuario(
        array $usuario
    ): array {

        return [
            'id' =>
                (int) $usuario['id'],

            'nome' =>
                $usuario['nome'],

            'email' =>
                $usuario['email'],

            'perfil' =>
                $usuario['perfil'],

            'professor_id' =>
                $usuario['professor_id'] !== null
                    ? (int) $usuario['professor_id']
                    : null,

            'professor_nome' =>
                $usuario['professor_nome']
                ??
                null
        ];
    }


    // ==================================================
    // LOGIN
    // ==================================================

    public function login(
        Request $request,
        Response $response
    ): Response {

        $dados =
            $request->getParsedBody()
            ??
            [];


        $email =
            trim(
                strtolower(
                    (string) (
                        $dados['email']
                        ??
                        ''
                    )
                )
            );


        $senha =
            (string) (
                $dados['senha']
                ??
                ''
            );


        if (
            $email === ''
            ||
            $senha === ''
        ) {

            return $this->responderJson(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Informe o e-mail e a senha.'
                ],
                422
            );
        }


        $usuario =
            $this
                ->usuarios
                ->buscarPorEmail(
                    $email
                );


        if (!$usuario) {

            return $this->responderJson(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'E-mail ou senha inválidos.'
                ],
                401
            );
        }


        if (
            (int) $usuario['ativo']
            !==
            1
        ) {

            return $this->responderJson(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Este usuário está desativado.'
                ],
                403
            );
        }


        // =================================================
        // SENHA
        //
        // Mantém o modelo atual escolhido para o projeto.
        // =================================================

        if (
            $senha
            !==
            (string) $usuario['senha']
        ) {

            return $this->responderJson(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'E-mail ou senha inválidos.'
                ],
                401
            );
        }


        // =================================================
        // USUÁRIO PROFESSOR PRECISA ESTAR VINCULADO
        // =================================================

        if (
            $usuario['perfil']
            ===
            'professor'
        ) {

            if (
                empty(
                    $usuario['professor_id']
                )
            ) {

                return $this->responderJson(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'Este usuário não está vinculado a um professor.'
                    ],
                    403
                );
            }


            if (
                (int) (
                    $usuario['professor_ativo']
                    ??
                    0
                )
                !==
                1
            ) {

                return $this->responderJson(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'O professor vinculado a este usuário está desativado.'
                    ],
                    403
                );
            }
        }


        // =================================================
        // NOVO ID DE SESSÃO
        // =================================================

        session_regenerate_id(
            true
        );


        // =================================================
        // DADOS DA SESSÃO
        // =================================================

        $_SESSION['usuario_id'] =
            (int) $usuario['id'];


        $_SESSION['usuario_nome'] =
            $usuario['nome'];


        $_SESSION['usuario_email'] =
            $usuario['email'];


        $_SESSION['usuario_perfil'] =
            $usuario['perfil'];


        $_SESSION['usuario_professor_id'] =
            $usuario['professor_id'] !== null
                ? (int) $usuario['professor_id']
                : null;


        // =================================================
        // ÚLTIMO LOGIN
        // =================================================

        $this
            ->usuarios
            ->atualizarUltimoLogin(
                (int) $usuario['id']
            );


        return $this->responderJson(
            $response,
            [
                'sucesso' =>
                    true,

                'mensagem' =>
                    'Login realizado com sucesso.',

                'usuario' =>
                    $this->dadosUsuario(
                        $usuario
                    )
            ]
        );
    }


    // ==================================================
    // USUÁRIO ATUAL
    // ==================================================

    public function me(
        Request $request,
        Response $response
    ): Response {

        $usuarioId =
            (int) (
                $_SESSION['usuario_id']
                ??
                0
            );


        if ($usuarioId <= 0) {

            return $this->responderJson(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Usuário não autenticado.'
                ],
                401
            );
        }


        $usuario =
            $this
                ->usuarios
                ->buscarPorId(
                    $usuarioId
                );


        // ----------------------------------------------
        // USUÁRIO INEXISTENTE OU DESATIVADO
        // ----------------------------------------------

        if (
            !$usuario
            ||
            (int) $usuario['ativo'] !== 1
        ) {

            $_SESSION = [];


            return $this->responderJson(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Sessão inválida.'
                ],
                401
            );
        }


        // ----------------------------------------------
        // PROFESSOR PRECISA CONTINUAR VÁLIDO
        // ----------------------------------------------

        if (
            $usuario['perfil']
            ===
            'professor'
            &&
            (
                empty(
                    $usuario['professor_id']
                )
                ||
                (int) (
                    $usuario['professor_ativo']
                    ??
                    0
                )
                !==
                1
            )
        ) {

            $_SESSION = [];


            return $this->responderJson(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'O vínculo deste usuário com o professor não é válido.'
                ],
                401
            );
        }


        // ----------------------------------------------
        // ATUALIZA A SESSÃO
        // ----------------------------------------------

        $_SESSION['usuario_nome'] =
            $usuario['nome'];


        $_SESSION['usuario_email'] =
            $usuario['email'];


        $_SESSION['usuario_perfil'] =
            $usuario['perfil'];


        $_SESSION['usuario_professor_id'] =
            $usuario['professor_id'] !== null
                ? (int) $usuario['professor_id']
                : null;


        return $this->responderJson(
            $response,
            [
                'sucesso' =>
                    true,

                'usuario' =>
                    $this->dadosUsuario(
                        $usuario
                    )
            ]
        );
    }


    // ==================================================
    // LOGOUT
    // ==================================================

    public function logout(
        Request $request,
        Response $response
    ): Response {

        $_SESSION = [];


        if (
            ini_get(
                'session.use_cookies'
            )
        ) {

            $params =
                session_get_cookie_params();


            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }


        if (
            session_status()
            ===
            PHP_SESSION_ACTIVE
        ) {

            session_destroy();
        }


        return $this->responderJson(
            $response,
            [
                'sucesso' =>
                    true,

                'mensagem' =>
                    'Logout realizado com sucesso.'
            ]
        );
    }
}