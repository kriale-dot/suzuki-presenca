<?php

namespace App\Controllers;

use App\Config\Env;
use App\Repositories\DispositivoRepository;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

use Throwable;


class DispositivoController
{
    private DispositivoRepository $repository;


    public function __construct(
        DispositivoRepository $repository
    ) {
        $this->repository = $repository;
    }


    // --------------------------------------------------
    // Resposta JSON.
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


    // --------------------------------------------------
    // Valida o identificador.
    //
    // Exemplos válidos:
    //
    // tablet-sala-1
    // tablet_piano
    // ipad.01
    // --------------------------------------------------

    private function identificadorValido(
        string $identificador
    ): bool {

        return preg_match(
            '/^[A-Za-z0-9._-]+$/',
            $identificador
        ) === 1;
    }


    // ==================================================
    // GET /api/dispositivos
    // ==================================================

    public function listar(
        Request $request,
        Response $response
    ): Response {

        try {

            $dispositivos =
                $this->repository->listar();


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'total' =>
                        count($dispositivos),
                    'dados' =>
                        $dispositivos
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao consultar dispositivos.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // GET /api/dispositivos/{id}
    // ==================================================

    public function buscar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $id =
                (int) $args['id'];


            $dispositivo =
                $this->repository
                    ->buscarPorId($id);


            if ($dispositivo === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Dispositivo não encontrado.'
                    ],
                    404
                );
            }


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'dados' =>
                        $dispositivo
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao consultar dispositivo.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // POST /api/dispositivos
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


            $identificador = trim(
                (string) (
                    $dados['identificador']
                    ?? ''
                )
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
                            'O nome do dispositivo é obrigatório.'
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


            // ------------------------------------------
            // Identificador
            // ------------------------------------------

            if ($identificador === '') {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O identificador do dispositivo é obrigatório.'
                    ],
                    422
                );
            }


            if (
                mb_strlen($identificador) > 150
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O identificador deve possuir no máximo 150 caracteres.'
                    ],
                    422
                );
            }


            if (
                !$this->identificadorValido(
                    $identificador
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O identificador deve conter apenas letras, números, ponto, hífen ou sublinhado.'
                    ],
                    422
                );
            }


            if (
                $this->repository
                    ->identificadorExiste(
                        $identificador
                    )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Já existe um dispositivo com este identificador.'
                    ],
                    409
                );
            }


            $id =
                $this->repository->criar(
                    $nome,
                    $identificador
                );


            $dispositivo =
                $this->repository
                    ->buscarPorId($id);


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' =>
                        'Dispositivo criado com sucesso.',
                    'dados' =>
                        $dispositivo
                ],
                201
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao criar dispositivo.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // PUT /api/dispositivos/{id}
    // ==================================================

    public function atualizar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $id =
                (int) $args['id'];


            $atual =
                $this->repository
                    ->buscarPorId($id);


            if ($atual === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Dispositivo não encontrado.'
                    ],
                    404
                );
            }


            $dados =
                $request->getParsedBody();


            if (!is_array($dados)) {
                $dados = [];
            }


            $nome =
                array_key_exists(
                    'nome',
                    $dados
                )
                ? trim(
                    (string) $dados['nome']
                )
                : $atual['nome'];


            $identificador =
                array_key_exists(
                    'identificador',
                    $dados
                )
                ? trim(
                    (string)
                    $dados['identificador']
                )
                : $atual['identificador'];


            $ativoRecebido =
                $dados['ativo']
                ?? $atual['ativo'];


            if (
                !in_array(
                    $ativoRecebido,
                    [0, 1, '0', '1'],
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


            $ativo =
                (int) $ativoRecebido;


            if (
                $nome === '' ||
                mb_strlen($nome) > 100
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O nome do dispositivo é inválido.'
                    ],
                    422
                );
            }


            if (
                $identificador === '' ||
                mb_strlen($identificador) > 150 ||
                !$this->identificadorValido(
                    $identificador
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O identificador do dispositivo é inválido.'
                    ],
                    422
                );
            }


            if (
                $this->repository
                    ->identificadorExiste(
                        $identificador,
                        $id
                    )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Já existe outro dispositivo com este identificador.'
                    ],
                    409
                );
            }


            $this->repository->atualizar(
                $id,
                $nome,
                $identificador,
                $ativo
            );


            $dispositivo =
                $this->repository
                    ->buscarPorId($id);


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' =>
                        'Dispositivo atualizado com sucesso.',
                    'dados' =>
                        $dispositivo
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao atualizar dispositivo.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // DELETE /api/dispositivos/{id}
    // ==================================================

    public function excluir(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $id =
                (int) $args['id'];


            $dispositivo =
                $this->repository
                    ->buscarPorId($id);


            if ($dispositivo === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Dispositivo não encontrado.'
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
                        'Dispositivo desativado com sucesso.'
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao desativar dispositivo.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }
}