<?php

namespace App\Controllers;

use App\Config\Env;
use App\Repositories\ProfessorRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;

class ProfessorController
{
    private ProfessorRepository $repository;


    public function __construct(
        ProfessorRepository $repository
    ) {
        $this->repository = $repository;
    }


    // --------------------------------------------------
    // Gera uma resposta JSON padronizada
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
    // GET /api/professores
    // ==================================================

    public function listar(
        Request $request,
        Response $response
    ): Response {

        try {

            $professores =
                $this->repository->listar();

            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'total' => count($professores),
                    'dados' => $professores
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Não foi possível consultar os professores.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // GET /api/professores/{id}
    // ==================================================

    public function buscar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $id = (int) $args['id'];

            $professor =
                $this->repository->buscarPorId($id);


            if ($professor === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Professor não encontrado.'
                    ],
                    404
                );
            }


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'dados' => $professor
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao consultar professor.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // POST /api/professores
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

            $email = trim(
                (string) ($dados['email'] ?? '')
            );

            $telefone = trim(
                (string) ($dados['telefone'] ?? '')
            );


            // ------------------------------------------
            // Validação do nome
            // ------------------------------------------

            if ($nome === '') {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O nome do professor é obrigatório.'
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
            // Validação do email
            // ------------------------------------------

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


            // ------------------------------------------
            // Validação do telefone
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


            // Campos vazios serão gravados como NULL.
            $email =
                $email === ''
                ? null
                : $email;

            $telefone =
                $telefone === ''
                ? null
                : $telefone;


            $id =
                $this->repository->criar(
                    $nome,
                    $email,
                    $telefone
                );


            $professor =
                $this->repository->buscarPorId($id);


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' =>
                        'Professor criado com sucesso.',
                    'dados' => $professor
                ],
                201
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao criar professor.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // PUT /api/professores/{id}
    // ==================================================

    public function atualizar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $id = (int) $args['id'];

            $professorAtual =
                $this->repository->buscarPorId($id);


            if ($professorAtual === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Professor não encontrado.'
                    ],
                    404
                );
            }


            $dados = $request->getParsedBody();

            if (!is_array($dados)) {
                $dados = [];
            }


            // Se algum campo não for enviado,
            // mantemos o valor atual.

            $nome = array_key_exists(
                'nome',
                $dados
            )
                ? trim((string) $dados['nome'])
                : $professorAtual['nome'];


            $email = array_key_exists(
                'email',
                $dados
            )
                ? trim((string) $dados['email'])
                : $professorAtual['email'];


            $telefone = array_key_exists(
                'telefone',
                $dados
            )
                ? trim((string) $dados['telefone'])
                : $professorAtual['telefone'];


            $ativo =
                $dados['ativo']
                ?? $professorAtual['ativo'];

            $ativo = (int) $ativo;


            // ------------------------------------------
            // Validações
            // ------------------------------------------

            if ($nome === '') {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O nome do professor é obrigatório.'
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
                !in_array(
                    $ativo,
                    [0, 1],
                    true
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O campo ativo deve ser 0 ou 1.'
                    ],
                    422
                );
            }


            // Strings vazias viram NULL.
            $email =
                $email === ''
                ? null
                : $email;

            $telefone =
                $telefone === ''
                ? null
                : $telefone;


            // Um professor vinculado a turma ativa não
            // pode ser desativado, pois a turma ficaria
            // sem um professor disponível.
            if (
                $ativo === 0 &&
                (int) $professorAtual['ativo'] === 1 &&
                $this->repository->possuiTurmasAtivas($id)
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Este professor possui turma ativa. Reorganize ou desative a turma antes de desativar o professor.'
                    ],
                    409
                );
            }


            $this->repository->atualizar(
                $id,
                $nome,
                $email,
                $telefone,
                $ativo
            );


            $professor =
                $this->repository->buscarPorId($id);


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' =>
                        'Professor atualizado com sucesso.',
                    'dados' => $professor
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao atualizar professor.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // DELETE /api/professores/{id}
    // ==================================================

    public function excluir(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $id = (int) $args['id'];

            $professor =
                $this->repository->buscarPorId($id);


            if ($professor === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Professor não encontrado.'
                    ],
                    404
                );
            }


            if ($this->repository->possuiTurmasAtivas($id)) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Este professor possui turma ativa. Reorganize ou desative a turma antes de desativar o professor.'
                    ],
                    409
                );
            }


            $this->repository->desativar($id);


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' =>
                        'Professor desativado com sucesso.'
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao desativar professor.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }
}