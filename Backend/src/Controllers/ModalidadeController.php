<?php

namespace App\Controllers;

use App\Config\Env;
use App\Repositories\ModalidadeRepository;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;

class ModalidadeController
{
    private ModalidadeRepository $repository;


    // --------------------------------------------------
    // Construtor
    // --------------------------------------------------

    public function __construct(
        ModalidadeRepository $repository
    ) {
        $this->repository = $repository;
    }


    // --------------------------------------------------
    // Função auxiliar para gerar respostas JSON
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
    // GET /api/modalidades
    // ==================================================

    public function listar(
        Request $request,
        Response $response
    ): Response {

        try {

            $modalidades =
                $this->repository->listar();

            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'total' => count($modalidades),
                    'dados' => $modalidades
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Não foi possível consultar as modalidades.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // GET /api/modalidades/{id}
    // ==================================================

    public function buscar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $id = (int) $args['id'];

            $modalidade =
                $this->repository->buscarPorId($id);


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


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'dados' => $modalidade
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao consultar a modalidade.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // POST /api/modalidades
    // ==================================================

    public function criar(
        Request $request,
        Response $response
    ): Response {

        try {

            // Recupera o JSON enviado pelo cliente.
            $dados = $request->getParsedBody();

            if (!is_array($dados)) {
                $dados = [];
            }


            // Recupera e limpa o nome.
            $nome = trim(
                (string) ($dados['nome'] ?? '')
            );


            // ------------------------------------------
            // Validação
            // ------------------------------------------

            if ($nome === '') {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O nome da modalidade é obrigatório.'
                    ],
                    422
                );
            }


            if (mb_strlen($nome) > 100) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O nome deve possuir no máximo 100 caracteres.'
                    ],
                    422
                );
            }


            // Verifica duplicação.
            if (
                $this->repository
                    ->nomeExiste($nome)
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Já existe uma modalidade com esse nome.'
                    ],
                    409
                );
            }


            // Cria o registro.
            $id =
                $this->repository->criar($nome);


            // Busca novamente para retornar
            // o registro completo.
            $modalidade =
                $this->repository->buscarPorId($id);


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' =>
                        'Modalidade criada com sucesso.',
                    'dados' => $modalidade
                ],
                201
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao criar modalidade.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // PUT /api/modalidades/{id}
    // ==================================================

    public function atualizar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $id = (int) $args['id'];


            // Primeiro verificamos se a modalidade existe.
            $modalidadeAtual =
                $this->repository->buscarPorId($id);


            if ($modalidadeAtual === null) {

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


            $dados = $request->getParsedBody();

            if (!is_array($dados)) {
                $dados = [];
            }


            // Para o PUT exigiremos o nome.
            $nome = trim(
                (string) ($dados['nome'] ?? '')
            );


            if ($nome === '') {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O nome da modalidade é obrigatório.'
                    ],
                    422
                );
            }


            if (mb_strlen($nome) > 100) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O nome deve possuir no máximo 100 caracteres.'
                    ],
                    422
                );
            }


            // Se "ativo" não for enviado,
            // mantém o valor atual.
            $ativo =
                $dados['ativo']
                ?? $modalidadeAtual['ativo'];


            $ativo = (int) $ativo;


            if (!in_array($ativo, [0, 1], true)) {

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


            // Verifica se outro registro já possui
            // esse mesmo nome.
            if (
                $this->repository->nomeExiste(
                    $nome,
                    $id
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Já existe outra modalidade com esse nome.'
                    ],
                    409
                );
            }


            if (
                $ativo === 0 &&
                (int) $modalidadeAtual['ativo'] === 1 &&
                $this->repository->possuiTurmasAtivas($id)
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Esta modalidade possui turma ativa. Desative ou altere a turma antes de desativar a modalidade.'
                    ],
                    409
                );
            }


            $this->repository->atualizar(
                $id,
                $nome,
                $ativo
            );


            $modalidade =
                $this->repository->buscarPorId($id);


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' =>
                        'Modalidade atualizada com sucesso.',
                    'dados' => $modalidade
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao atualizar modalidade.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // DELETE /api/modalidades/{id}
    // ==================================================

    public function excluir(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $id = (int) $args['id'];


            $modalidade =
                $this->repository->buscarPorId($id);


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


            if ($this->repository->possuiTurmasAtivas($id)) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Esta modalidade possui turma ativa. Desative ou altere a turma antes de desativar a modalidade.'
                    ],
                    409
                );
            }


            // Não apagaremos fisicamente.
            // Apenas marcamos como inativa.
            $this->repository->desativar($id);


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' =>
                        'Modalidade desativada com sucesso.'
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao desativar modalidade.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }
}