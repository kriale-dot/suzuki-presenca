<?php

namespace App\Controllers;

use App\Repositories\GeracaoAulasRepository;
use DateTimeImmutable;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;


class GeracaoAulasController
{
    private GeracaoAulasRepository $repository;


    public function __construct(
        GeracaoAulasRepository $repository
    ) {
        $this->repository =
            $repository;
    }


    // =====================================================
    // GERA AULAS
    // =====================================================

    public function gerar(
        Request $request,
        Response $response
    ): Response {

        try {

            $dados =
                $request->getParsedBody()
                ?? [];


            $dataInicio =
                trim(
                    (string) (
                        $dados['data_inicio']
                        ?? ''
                    )
                );


            $dataFim =
                trim(
                    (string) (
                        $dados['data_fim']
                        ?? ''
                    )
                );


            $turmaId = null;


            if (
                isset(
                    $dados['turma_id']
                )
                &&
                $dados['turma_id'] !== ''
                &&
                $dados['turma_id'] !== null
            ) {

                $turmaId =
                    (int) $dados['turma_id'];


                if (
                    $turmaId <= 0
                ) {

                    return $this->json(
                        $response,
                        [
                            'sucesso' =>
                                false,

                            'mensagem' =>
                                'Turma inválida.'
                        ],
                        422
                    );
                }
            }


            // =================================================
            // VALIDA DATAS
            // =================================================

            if (
                !$this->dataValida(
                    $dataInicio
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'Informe uma data inicial válida.'
                    ],
                    422
                );
            }


            if (
                !$this->dataValida(
                    $dataFim
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'Informe uma data final válida.'
                    ],
                    422
                );
            }


            $inicio =
                new DateTimeImmutable(
                    $dataInicio
                );


            $fim =
                new DateTimeImmutable(
                    $dataFim
                );


            if (
                $fim < $inicio
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'A data final não pode ser anterior à data inicial.'
                    ],
                    422
                );
            }


            // =================================================
            // LIMITA O INTERVALO
            //
            // Evita alguém gerar acidentalmente
            // muitos anos de agenda.
            // =================================================

            $dias =
                (int) $inicio
                    ->diff(
                        $fim
                    )
                    ->format(
                        '%a'
                    );


            if (
                $dias > 366
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'O período máximo para geração é de 366 dias.'
                    ],
                    422
                );
            }


            // =================================================
            // GERA
            // =================================================

            $resultado =
                $this->repository
                    ->gerar(
                        $dataInicio,
                        $dataFim,
                        $turmaId
                    );


            return $this->json(
                $response,
                [
                    'sucesso' =>
                        true,

                    'mensagem' =>
                        'Geração de aulas concluída.',

                    'resumo' =>
                        $resultado
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Não foi possível gerar as aulas.'
                ],
                500
            );
        }
    }


    // =====================================================
    // VALIDA DATA YYYY-MM-DD
    // =====================================================

    private function dataValida(
        string $data
    ): bool {

        if (
            !preg_match(
                '/^\d{4}-\d{2}-\d{2}$/',
                $data
            )
        ) {
            return false;
        }


        $objeto =
            DateTimeImmutable::createFromFormat(
                '!Y-m-d',
                $data
            );


        return (
            $objeto !== false
            &&
            $objeto->format(
                'Y-m-d'
            ) ===
            $data
        );
    }


    // =====================================================
    // JSON
    // =====================================================

    private function json(
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
}