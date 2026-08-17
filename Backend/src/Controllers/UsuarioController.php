<?php

namespace App\Controllers;

use App\Repositories\UsuarioRepository;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;


class UsuarioController
{
    private UsuarioRepository $usuarios;


    private const PERFIS = [
        'administrador',
        'secretaria',
        'professor'
    ];


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
    // PERFIL VÁLIDO
    // ==================================================

    private function perfilValido(
        string $perfil
    ): bool {

        return in_array(
            $perfil,
            self::PERFIS,
            true
        );
    }


    // ==================================================
    // LISTAR
    // ==================================================

    public function listar(
        Request $request,
        Response $response
    ): Response {

        return $this->responderJson(
            $response,
            [
                'sucesso' =>
                    true,

                'dados' =>
                    $this
                        ->usuarios
                        ->listar()
            ]
        );
    }


    // ==================================================
    // BUSCAR
    // ==================================================

    public function buscar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        $id =
            (int) (
                $args['id']
                ??
                0
            );


        $usuario =
            $this
                ->usuarios
                ->buscarPorId(
                    $id
                );


        if (!$usuario) {

            return $this->responderJson(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Usuário não encontrado.'
                ],
                404
            );
        }


        return $this->responderJson(
            $response,
            [
                'sucesso' =>
                    true,

                'dados' =>
                    $usuario
            ]
        );
    }


    // ==================================================
    // CRIAR
    // ==================================================

    public function criar(
        Request $request,
        Response $response
    ): Response {

        $dados =
            $request->getParsedBody()
            ??
            [];


        $nome =
            trim(
                (string) (
                    $dados['nome']
                    ??
                    ''
                )
            );


        $email =
            strtolower(
                trim(
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


        $perfil =
            strtolower(
                trim(
                    (string) (
                        $dados['perfil']
                        ??
                        'secretaria'
                    )
                )
            );


        $professorId =
            isset(
                $dados['professor_id']
            )
            &&
            $dados['professor_id'] !== ''
                ? (int) $dados['professor_id']
                : null;


        // ----------------------------------------------
        // NOME
        // ----------------------------------------------

        if ($nome === '') {

            return $this->responderJson(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Informe o nome do usuário.'
                ],
                422
            );
        }


        // ----------------------------------------------
        // E-MAIL
        // ----------------------------------------------

        if (
            $email === ''
            ||
            !filter_var(
                $email,
                FILTER_VALIDATE_EMAIL
            )
        ) {

            return $this->responderJson(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Informe um e-mail válido.'
                ],
                422
            );
        }


        // ----------------------------------------------
        // SENHA
        // ----------------------------------------------

        if ($senha === '') {

            return $this->responderJson(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Informe a senha.'
                ],
                422
            );
        }


        // ----------------------------------------------
        // PERFIL
        // ----------------------------------------------

        if (
            !$this->perfilValido(
                $perfil
            )
        ) {

            return $this->responderJson(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Perfil de usuário inválido.'
                ],
                422
            );
        }


        // ----------------------------------------------
        // ADMINISTRADOR / SECRETARIA NÃO TÊM PROFESSOR
        // ----------------------------------------------

        if (
            $perfil !== 'professor'
        ) {

            $professorId =
                null;
        }


        // ----------------------------------------------
        // PERFIL PROFESSOR EXIGE VÍNCULO
        // ----------------------------------------------

        if (
            $perfil === 'professor'
        ) {

            if (
                !$professorId
                ||
                $professorId <= 0
            ) {

                return $this->responderJson(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'Selecione o professor vinculado a este usuário.'
                    ],
                    422
                );
            }


            if (
                !$this
                    ->usuarios
                    ->professorAtivoExiste(
                        $professorId
                    )
            ) {

                return $this->responderJson(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'O professor selecionado não existe ou está desativado.'
                    ],
                    422
                );
            }


            if (
                $this
                    ->usuarios
                    ->professorJaVinculado(
                        $professorId
                    )
            ) {

                return $this->responderJson(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'Este professor já está vinculado a outro usuário.'
                    ],
                    409
                );
            }
        }


        // ----------------------------------------------
        // E-MAIL DUPLICADO
        // ----------------------------------------------

        if (
            $this
                ->usuarios
                ->buscarPorEmail(
                    $email
                )
        ) {

            return $this->responderJson(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Já existe um usuário com este e-mail.'
                ],
                409
            );
        }


        // ----------------------------------------------
        // CRIAR
        // ----------------------------------------------

        $id =
            $this
                ->usuarios
                ->criar(
                    $nome,
                    $email,
                    $senha,
                    $perfil,
                    $professorId
                );


        return $this->responderJson(
            $response,
            [
                'sucesso' =>
                    true,

                'mensagem' =>
                    'Usuário criado com sucesso.',

                'dados' =>
                    $this
                        ->usuarios
                        ->buscarPorId(
                            $id
                        )
            ],
            201
        );
    }


    // ==================================================
    // ATUALIZAR
    // ==================================================

    public function atualizar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        $id =
            (int) (
                $args['id']
                ??
                0
            );


        $usuarioAtual =
            $this
                ->usuarios
                ->buscarPorId(
                    $id
                );


        if (!$usuarioAtual) {

            return $this->responderJson(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Usuário não encontrado.'
                ],
                404
            );
        }


        $dados =
            $request->getParsedBody()
            ??
            [];


        $nome =
            trim(
                (string) (
                    $dados['nome']
                    ??
                    $usuarioAtual['nome']
                )
            );


        $email =
            strtolower(
                trim(
                    (string) (
                        $dados['email']
                        ??
                        $usuarioAtual['email']
                    )
                )
            );


        $senha =
            array_key_exists(
                'senha',
                $dados
            )
                ? (string) $dados['senha']
                : null;


        $perfil =
            strtolower(
                trim(
                    (string) (
                        $dados['perfil']
                        ??
                        $usuarioAtual['perfil']
                    )
                )
            );


        if (
            array_key_exists(
                'professor_id',
                $dados
            )
        ) {

            $professorId =
                $dados['professor_id'] !== null
                &&
                $dados['professor_id'] !== ''
                    ? (int) $dados['professor_id']
                    : null;

        } else {

            $professorId =
                $usuarioAtual['professor_id'] !== null
                    ? (int) $usuarioAtual['professor_id']
                    : null;
        }


        $ativo =
            array_key_exists(
                'ativo',
                $dados
            )
                ? (
                    (int) $dados['ativo'] === 1
                        ? 1
                        : 0
                )
                : (int)
                    $usuarioAtual['ativo'];


        // ----------------------------------------------
        // NOME
        // ----------------------------------------------

        if ($nome === '') {

            return $this->responderJson(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Informe o nome do usuário.'
                ],
                422
            );
        }


        // ----------------------------------------------
        // E-MAIL
        // ----------------------------------------------

        if (
            !filter_var(
                $email,
                FILTER_VALIDATE_EMAIL
            )
        ) {

            return $this->responderJson(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Informe um e-mail válido.'
                ],
                422
            );
        }


        // ----------------------------------------------
        // PERFIL
        // ----------------------------------------------

        if (
            !$this->perfilValido(
                $perfil
            )
        ) {

            return $this->responderJson(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Perfil de usuário inválido.'
                ],
                422
            );
        }


        // ----------------------------------------------
        // NÃO ALTERAR PRÓPRIO PERFIL
        // ----------------------------------------------

        $usuarioLogadoId =
            (int) (
                $_SESSION['usuario_id']
                ??
                0
            );


        if (
            $usuarioLogadoId === $id
            &&
            $perfil !== $usuarioAtual['perfil']
        ) {

            return $this->responderJson(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Você não pode alterar o perfil do usuário que está utilizando.'
                ],
                409
            );
        }


        // ----------------------------------------------
        // ADMIN / SECRETARIA NÃO POSSUEM VÍNCULO
        // ----------------------------------------------

        if (
            $perfil !== 'professor'
        ) {

            $professorId =
                null;
        }


        // ----------------------------------------------
        // PROFESSOR EXIGE PROFESSOR_ID
        // ----------------------------------------------

        if (
            $perfil === 'professor'
        ) {

            if (
                !$professorId
                ||
                $professorId <= 0
            ) {

                return $this->responderJson(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'Selecione o professor vinculado a este usuário.'
                    ],
                    422
                );
            }


            if (
                !$this
                    ->usuarios
                    ->professorAtivoExiste(
                        $professorId
                    )
            ) {

                return $this->responderJson(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'O professor selecionado não existe ou está desativado.'
                    ],
                    422
                );
            }


            if (
                $this
                    ->usuarios
                    ->professorJaVinculado(
                        $professorId,
                        $id
                    )
            ) {

                return $this->responderJson(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'Este professor já está vinculado a outro usuário.'
                    ],
                    409
                );
            }
        }


        // ----------------------------------------------
        // E-MAIL DUPLICADO
        // ----------------------------------------------

        if (
            $this
                ->usuarios
                ->emailPertenceAOutroUsuario(
                    $email,
                    $id
                )
        ) {

            return $this->responderJson(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Já existe outro usuário com este e-mail.'
                ],
                409
            );
        }


        // ----------------------------------------------
        // NÃO DESATIVA PRÓPRIA CONTA
        // ----------------------------------------------

        if (
            $usuarioLogadoId === $id
            &&
            $ativo === 0
        ) {

            return $this->responderJson(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Você não pode desativar o usuário que está utilizando.'
                ],
                409
            );
        }


        // ----------------------------------------------
        // ATUALIZAR
        // ----------------------------------------------

        $this
            ->usuarios
            ->atualizar(
                $id,
                $nome,
                $email,
                $senha,
                $perfil,
                $professorId,
                $ativo
            );


        // ----------------------------------------------
        // ATUALIZA A PRÓPRIA SESSÃO
        // ----------------------------------------------

        if (
            $usuarioLogadoId === $id
        ) {

            $_SESSION['usuario_nome'] =
                $nome;


            $_SESSION['usuario_email'] =
                $email;


            $_SESSION['usuario_perfil'] =
                $perfil;


            $_SESSION['usuario_professor_id'] =
                $professorId;
        }


        return $this->responderJson(
            $response,
            [
                'sucesso' =>
                    true,

                'mensagem' =>
                    'Usuário atualizado com sucesso.',

                'dados' =>
                    $this
                        ->usuarios
                        ->buscarPorId(
                            $id
                        )
            ]
        );
    }


    // ==================================================
    // DESATIVAR
    // ==================================================

    public function excluir(
        Request $request,
        Response $response,
        array $args
    ): Response {

        $id =
            (int) (
                $args['id']
                ??
                0
            );


        $usuario =
            $this
                ->usuarios
                ->buscarPorId(
                    $id
                );


        if (!$usuario) {

            return $this->responderJson(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Usuário não encontrado.'
                ],
                404
            );
        }


        if (
            (int) (
                $_SESSION['usuario_id']
                ??
                0
            )
            ===
            $id
        ) {

            return $this->responderJson(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Você não pode desativar o usuário que está utilizando.'
                ],
                409
            );
        }


        $this
            ->usuarios
            ->desativar(
                $id
            );


        return $this->responderJson(
            $response,
            [
                'sucesso' =>
                    true,

                'mensagem' =>
                    'Usuário desativado com sucesso.'
            ]
        );
    }
}