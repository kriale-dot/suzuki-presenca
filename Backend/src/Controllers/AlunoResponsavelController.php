<?php

namespace App\Controllers;

use App\Config\Env;
use App\Repositories\AlunoRepository;
use App\Repositories\ResponsavelRepository;
use App\Repositories\AlunoResponsavelRepository;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

use Throwable;


class AlunoResponsavelController
{
    private AlunoRepository $alunoRepository;

    private ResponsavelRepository $responsavelRepository;

    private AlunoResponsavelRepository $repository;


    public function __construct(
        AlunoRepository $alunoRepository,
        ResponsavelRepository $responsavelRepository,
        AlunoResponsavelRepository $repository
    ) {

        $this->alunoRepository = $alunoRepository;

        $this->responsavelRepository =
            $responsavelRepository;

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
    // GET /api/alunos/{alunoId}/responsaveis
    // ==================================================

    public function listar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $alunoId =
                (int) $args['alunoId'];


            $aluno =
                $this->alunoRepository
                    ->buscarPorId($alunoId);


            if ($aluno === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Aluno não encontrado.'
                    ],
                    404
                );
            }


            $responsaveis =
                $this->repository
                    ->listarPorAluno($alunoId);


            return $this->json(
                $response,
                [
                    'sucesso' => true,

                    'aluno' => [
                        'id' => $aluno['id'],
                        'nome' => $aluno['nome']
                    ],

                    'total' =>
                        count($responsaveis),

                    'dados' =>
                        $responsaveis
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao consultar os responsáveis do aluno.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // GET vínculo específico
    // ==================================================

    public function buscar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $alunoId =
                (int) $args['alunoId'];

            $responsavelId =
                (int) $args['responsavelId'];


            $vinculo =
                $this->repository->buscarVinculo(
                    $alunoId,
                    $responsavelId
                );


            if ($vinculo === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Vínculo entre aluno e responsável não encontrado.'
                    ],
                    404
                );
            }


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'dados' => $vinculo
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao consultar o vínculo.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // POST /api/alunos/{alunoId}/responsaveis
    // ==================================================

    public function criar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $alunoId =
                (int) $args['alunoId'];


            // ------------------------------------------
            // Verifica se o aluno existe
            // ------------------------------------------

            $aluno =
                $this->alunoRepository
                    ->buscarPorId($alunoId);


            if ($aluno === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Aluno não encontrado.'
                    ],
                    404
                );
            }


            $dados =
                $request->getParsedBody();


            if (!is_array($dados)) {
                $dados = [];
            }


            $responsavelId =
                (int) ($dados['responsavel_id'] ?? 0);


            $parentesco = trim(
                (string) ($dados['parentesco'] ?? '')
            );


            $principal =
                (int) ($dados['principal'] ?? 0);


            // ------------------------------------------
            // Responsável
            // ------------------------------------------

            if ($responsavelId <= 0) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O responsável é obrigatório.'
                    ],
                    422
                );
            }


            $responsavel =
                $this->responsavelRepository
                    ->buscarPorId($responsavelId);


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


            // ------------------------------------------
            // Parentesco
            // ------------------------------------------

            if (mb_strlen($parentesco) > 50) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O parentesco deve possuir no máximo 50 caracteres.'
                    ],
                    422
                );
            }


            // ------------------------------------------
            // Principal
            // ------------------------------------------

            if (
                !in_array(
                    $principal,
                    [0, 1],
                    true
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O campo principal deve ser 0 ou 1.'
                    ],
                    422
                );
            }


            // ------------------------------------------
            // Verifica duplicidade
            // ------------------------------------------

            if (
                $this->repository->vinculoExiste(
                    $alunoId,
                    $responsavelId
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Este responsável já está vinculado ao aluno.'
                    ],
                    409
                );
            }


            $parentesco =
                $parentesco === ''
                ? null
                : $parentesco;


            $this->repository->criar(
                $alunoId,
                $responsavelId,
                $parentesco,
                $principal
            );


            $vinculo =
                $this->repository->buscarVinculo(
                    $alunoId,
                    $responsavelId
                );


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' =>
                        'Responsável vinculado ao aluno com sucesso.',
                    'dados' =>
                        $vinculo
                ],
                201
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao vincular responsável ao aluno.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // PUT vínculo
    // ==================================================

    public function atualizar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $alunoId =
                (int) $args['alunoId'];

            $responsavelId =
                (int) $args['responsavelId'];


            $vinculoAtual =
                $this->repository->buscarVinculo(
                    $alunoId,
                    $responsavelId
                );


            if ($vinculoAtual === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Vínculo não encontrado.'
                    ],
                    404
                );
            }


            $dados =
                $request->getParsedBody();


            if (!is_array($dados)) {
                $dados = [];
            }


            // Se não for enviado, mantém o valor atual.

            $parentesco =
                array_key_exists(
                    'parentesco',
                    $dados
                )
                ? trim(
                    (string) $dados['parentesco']
                )
                : $vinculoAtual['parentesco'];


            $principal =
                $dados['principal']
                ?? $vinculoAtual['principal'];

            $principal =
                (int) $principal;


            if (
                $parentesco !== null &&
                mb_strlen($parentesco) > 50
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O parentesco deve possuir no máximo 50 caracteres.'
                    ],
                    422
                );
            }


            if (
                !in_array(
                    $principal,
                    [0, 1],
                    true
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O campo principal deve ser 0 ou 1.'
                    ],
                    422
                );
            }


            $parentesco =
                $parentesco === ''
                ? null
                : $parentesco;


            $this->repository->atualizar(
                $alunoId,
                $responsavelId,
                $parentesco,
                $principal
            );


            $vinculo =
                $this->repository->buscarVinculo(
                    $alunoId,
                    $responsavelId
                );


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' =>
                        'Vínculo atualizado com sucesso.',
                    'dados' =>
                        $vinculo
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao atualizar vínculo.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // DELETE vínculo
    // ==================================================

    public function excluir(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $alunoId =
                (int) $args['alunoId'];

            $responsavelId =
                (int) $args['responsavelId'];


            $vinculo =
                $this->repository->buscarVinculo(
                    $alunoId,
                    $responsavelId
                );


            if ($vinculo === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Vínculo não encontrado.'
                    ],
                    404
                );
            }


            $this->repository->excluir(
                $alunoId,
                $responsavelId
            );


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' =>
                        'Vínculo removido com sucesso.'
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao remover vínculo.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }
}