<?php

namespace App\Controllers;

use App\Config\Env;
use App\Repositories\TurmaRepository;
use App\Repositories\ModalidadeRepository;
use App\Repositories\ProfessorRepository;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

use Throwable;


class TurmaController
{
    private TurmaRepository $repository;

    private ModalidadeRepository $modalidadeRepository;

    private ProfessorRepository $professorRepository;


    public function __construct(
        TurmaRepository $repository,
        ModalidadeRepository $modalidadeRepository,
        ProfessorRepository $professorRepository
    ) {
        $this->repository = $repository;

        $this->modalidadeRepository =
            $modalidadeRepository;

        $this->professorRepository =
            $professorRepository;
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
    // GET /api/turmas
    // ==================================================

    public function listar(
        Request $request,
        Response $response
    ): Response {

        try {

            $turmas =
                $this->repository->listar();

            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'total' => count($turmas),
                    'dados' => $turmas
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Não foi possível consultar as turmas.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // GET /api/turmas/{id}
    // ==================================================

    public function buscar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $id = (int) $args['id'];

            $turma =
                $this->repository->buscarPorId($id);


            if ($turma === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Turma não encontrada.'
                    ],
                    404
                );
            }


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'dados' => $turma
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao consultar turma.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // POST /api/turmas
    // ==================================================

    public function criar(
        Request $request,
        Response $response
    ): Response {

        try {

            $dados =
                $request->getParsedBody();

            if (!is_array($dados)) {
                $dados = [];
            }


            $nome = trim(
                (string) ($dados['nome'] ?? '')
            );

            $modalidadeId =
                (int) ($dados['modalidade_id'] ?? 0);

            $professorId =
                (int) ($dados['professor_id'] ?? 0);

            $tipo = trim(
                (string) ($dados['tipo'] ?? '')
            );

            $sala = trim(
                (string) ($dados['sala'] ?? '')
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
                            'O nome da turma é obrigatório.'
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
                            'O nome da turma deve possuir no máximo 150 caracteres.'
                    ],
                    422
                );
            }


            // ------------------------------------------
            // Modalidade
            // ------------------------------------------

            if ($modalidadeId <= 0) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'A modalidade é obrigatória.'
                    ],
                    422
                );
            }


            $modalidade =
                $this->modalidadeRepository
                    ->buscarPorId($modalidadeId);


            if ($modalidade === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Modalidade não encontrada.'
                    ],
                    404
                );
            }


            if ((int) $modalidade['ativo'] !== 1) {
                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' => 'Não é possível criar turma com uma modalidade inativa.'
                    ],
                    422
                );
            }


            // ------------------------------------------
            // Professor
            // ------------------------------------------

            if ($professorId <= 0) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O professor é obrigatório.'
                    ],
                    422
                );
            }


            $professor =
                $this->professorRepository
                    ->buscarPorId($professorId);


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


            if ((int) $professor['ativo'] !== 1) {
                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' => 'Não é possível criar turma com um professor inativo.'
                    ],
                    422
                );
            }


            // ------------------------------------------
            // Tipo
            // ------------------------------------------

            if (
                !in_array(
                    $tipo,
                    [
                        'individual',
                        'coletiva'
                    ],
                    true
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O tipo deve ser individual ou coletiva.'
                    ],
                    422
                );
            }


            // ------------------------------------------
            // Sala
            // ------------------------------------------

            if (mb_strlen($sala) > 80) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'A sala deve possuir no máximo 80 caracteres.'
                    ],
                    422
                );
            }


            $sala =
                $sala === ''
                ? null
                : $sala;


            $id =
                $this->repository->criar(
                    $nome,
                    $modalidadeId,
                    $professorId,
                    $tipo,
                    $sala
                );


            $turma =
                $this->repository->buscarPorId($id);


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' =>
                        'Turma criada com sucesso.',
                    'dados' => $turma
                ],
                201
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao criar turma.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // PUT /api/turmas/{id}
    // ==================================================

    public function atualizar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $id =
                (int) $args['id'];


            $turmaAtual =
                $this->repository
                    ->buscarPorId($id);


            if ($turmaAtual === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Turma não encontrada.'
                    ],
                    404
                );
            }


            $dados =
                $request->getParsedBody();

            if (!is_array($dados)) {
                $dados = [];
            }


            // ------------------------------------------
            // Mantemos o valor atual caso
            // o campo não seja enviado.
            // ------------------------------------------

            $nome =
                array_key_exists('nome', $dados)
                ? trim((string) $dados['nome'])
                : $turmaAtual['nome'];


            $modalidadeId =
                array_key_exists(
                    'modalidade_id',
                    $dados
                )
                ? (int) $dados['modalidade_id']
                : (int) $turmaAtual['modalidade_id'];


            $professorId =
                array_key_exists(
                    'professor_id',
                    $dados
                )
                ? (int) $dados['professor_id']
                : (int) $turmaAtual['professor_id'];


            $tipo =
                array_key_exists('tipo', $dados)
                ? trim((string) $dados['tipo'])
                : $turmaAtual['tipo'];


            $sala =
                array_key_exists('sala', $dados)
                ? trim((string) $dados['sala'])
                : $turmaAtual['sala'];


            $ativo =
                $dados['ativo']
                ?? $turmaAtual['ativo'];

            $ativo =
                (int) $ativo;


            // ------------------------------------------
            // Validações
            // ------------------------------------------

            if ($nome === '') {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O nome da turma é obrigatório.'
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
                            'O nome da turma deve possuir no máximo 150 caracteres.'
                    ],
                    422
                );
            }


            $modalidade =
                $this->modalidadeRepository
                    ->buscarPorId($modalidadeId);


            if ($modalidade === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Modalidade não encontrada.'
                    ],
                    404
                );
            }


            $professor =
                $this->professorRepository
                    ->buscarPorId($professorId);


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


            // Uma turma ativa não pode depender de cadastro inativo.
            if ($ativo === 1 && (int) $modalidade['ativo'] !== 1) {
                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' => 'Uma turma ativa precisa utilizar uma modalidade ativa.'
                    ],
                    422
                );
            }


            if ($ativo === 1 && (int) $professor['ativo'] !== 1) {
                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' => 'Uma turma ativa precisa possuir um professor ativo.'
                    ],
                    422
                );
            }


            if (
                !in_array(
                    $tipo,
                    [
                        'individual',
                        'coletiva'
                    ],
                    true
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O tipo deve ser individual ou coletiva.'
                    ],
                    422
                );
            }


            if (
                $sala !== null &&
                mb_strlen($sala) > 80
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'A sala deve possuir no máximo 80 caracteres.'
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


            $sala =
                $sala === ''
                ? null
                : $sala;


            $this->repository->atualizar(
                $id,
                $nome,
                $modalidadeId,
                $professorId,
                $tipo,
                $sala,
                $ativo
            );


            $turma =
                $this->repository
                    ->buscarPorId($id);


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' =>
                        'Turma atualizada com sucesso.',
                    'dados' => $turma
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao atualizar turma.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // DELETE /api/turmas/{id}
    // ==================================================

    public function excluir(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $id =
                (int) $args['id'];


            $turma =
                $this->repository
                    ->buscarPorId($id);


            if ($turma === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Turma não encontrada.'
                    ],
                    404
                );
            }


            $this->repository
                ->desativar($id);


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' =>
                        'Turma desativada com sucesso.'
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao desativar turma.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }
}