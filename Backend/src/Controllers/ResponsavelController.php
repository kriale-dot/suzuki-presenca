<?php

namespace App\Controllers;

use App\Config\Env;
use App\Repositories\ResponsavelRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;

class ResponsavelController
{
    private ResponsavelRepository $repository;


    public function __construct(
        ResponsavelRepository $repository
    ) {
        $this->repository = $repository;
    }


    // --------------------------------------------------
    // Resposta JSON padronizada
    // --------------------------------------------------

    private function json(
        Response $response,
        array $dados,
        int $status = 200
    ): Response {

        // Em produção não exponha detalhes internos de exceções/SQL.
        if (!Env::bool('APP_DEBUG', true)) {
            unset($dados['detalhe']);
        }


        $response->getBody()->write(
            json_encode(
                $dados,
                JSON_UNESCAPED_UNICODE |
                JSON_PRETTY_PRINT
            )
        );

        return $response
            ->withHeader(
                'Content-Type',
                'application/json'
            )
            ->withStatus($status);
    }


    // ==================================================
    // GET /api/responsaveis
    // ==================================================

    public function listar(
        Request $request,
        Response $response
    ): Response {

        try {

            $responsaveis =
                $this->repository->listar();

            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'total' => count($responsaveis),
                    'dados' => $responsaveis
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Não foi possível consultar os responsáveis.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // GET /api/responsaveis/{id}
    // ==================================================

    public function buscar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $id = (int) $args['id'];

            $responsavel =
                $this->repository->buscarPorId($id);


            if ($responsavel === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Responsável não encontrado.'
                    ],
                    404
                );
            }


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'dados' => $responsavel
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao consultar responsável.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // POST /api/responsaveis
    // ==================================================

    public function criar(
        Request $request,
        Response $response
    ): Response {

        try {

            $dados = $request->getParsedBody();

            if (!is_array($dados)) {
                $dados = [];
            }


            $nome = trim(
                (string) ($dados['nome'] ?? '')
            );

            $telefone = trim(
                (string) ($dados['telefone'] ?? '')
            );

            $email = trim(
                (string) ($dados['email'] ?? '')
            );


            // ------------------------------------------
            // Nome
            // ------------------------------------------

            if ($nome === '') {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O nome do responsável é obrigatório.'
                    ],
                    422
                );
            }


            if (mb_strlen($nome) > 150) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O nome deve possuir no máximo 150 caracteres.'
                    ],
                    422
                );
            }


            // ------------------------------------------
            // Telefone
            // ------------------------------------------

            if (mb_strlen($telefone) > 30) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O telefone deve possuir no máximo 30 caracteres.'
                    ],
                    422
                );
            }


            // ------------------------------------------
            // Email
            // ------------------------------------------

            if (mb_strlen($email) > 150) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O email deve possuir no máximo 150 caracteres.'
                    ],
                    422
                );
            }


            if (
                $email !== '' &&
                !filter_var(
                    $email,
                    FILTER_VALIDATE_EMAIL
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O email informado é inválido.'
                    ],
                    422
                );
            }


            // Strings vazias viram NULL.
            $telefone =
                $telefone === ''
                ? null
                : $telefone;

            $email =
                $email === ''
                ? null
                : $email;


            $id =
                $this->repository->criar(
                    $nome,
                    $telefone,
                    $email
                );


            $responsavel =
                $this->repository->buscarPorId($id);


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' =>
                        'Responsável criado com sucesso.',
                    'dados' => $responsavel
                ],
                201
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao criar responsável.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // PUT /api/responsaveis/{id}
    // ==================================================

    public function atualizar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $id = (int) $args['id'];

            $responsavelAtual =
                $this->repository->buscarPorId($id);


            if ($responsavelAtual === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Responsável não encontrado.'
                    ],
                    404
                );
            }


            $dados = $request->getParsedBody();

            if (!is_array($dados)) {
                $dados = [];
            }


            // Se não receber determinado campo,
            // mantém o valor atual.

            $nome = array_key_exists(
                'nome',
                $dados
            )
                ? trim((string) $dados['nome'])
                : $responsavelAtual['nome'];


            $telefone = array_key_exists(
                'telefone',
                $dados
            )
                ? trim((string) $dados['telefone'])
                : $responsavelAtual['telefone'];


            $email = array_key_exists(
                'email',
                $dados
            )
                ? trim((string) $dados['email'])
                : $responsavelAtual['email'];


            // ------------------------------------------
            // Validações
            // ------------------------------------------

            if ($nome === '') {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O nome do responsável é obrigatório.'
                    ],
                    422
                );
            }


            if (mb_strlen($nome) > 150) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O nome deve possuir no máximo 150 caracteres.'
                    ],
                    422
                );
            }


            if (
                $telefone !== null &&
                mb_strlen($telefone) > 30
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O telefone deve possuir no máximo 30 caracteres.'
                    ],
                    422
                );
            }


            if (
                $email !== null &&
                mb_strlen($email) > 150
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O email deve possuir no máximo 150 caracteres.'
                    ],
                    422
                );
            }


            if (
                $email !== null &&
                $email !== '' &&
                !filter_var(
                    $email,
                    FILTER_VALIDATE_EMAIL
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O email informado é inválido.'
                    ],
                    422
                );
            }


            $telefone =
                $telefone === ''
                ? null
                : $telefone;

            $email =
                $email === ''
                ? null
                : $email;


            $this->repository->atualizar(
                $id,
                $nome,
                $telefone,
                $email
            );


            $responsavel =
                $this->repository->buscarPorId($id);


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' =>
                        'Responsável atualizado com sucesso.',
                    'dados' => $responsavel
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao atualizar responsável.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // DELETE /api/responsaveis/{id}
    // ==================================================

    public function excluir(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $id = (int) $args['id'];

            $responsavel =
                $this->repository->buscarPorId($id);


            if ($responsavel === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Responsável não encontrado.'
                    ],
                    404
                );
            }


            $this->repository->excluir($id);


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' =>
                        'Responsável excluído com sucesso.'
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao excluir responsável.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }
}