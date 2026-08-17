<?php

namespace App\Controllers;

use App\Config\Env;
use App\Repositories\HorarioRepository;
use App\Repositories\TurmaRepository;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

use Throwable;


class HorarioController
{
    private HorarioRepository $repository;

    private TurmaRepository $turmaRepository;


    public function __construct(
        HorarioRepository $repository,
        TurmaRepository $turmaRepository
    ) {
        $this->repository = $repository;

        $this->turmaRepository =
            $turmaRepository;
    }


    // --------------------------------------------------
    // Resposta JSON
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
    // Valida uma hora.
    //
    // Aceitamos:
    //
    // HH:MM
    // HH:MM:SS
    // --------------------------------------------------

    private function horaValida(string $hora): bool
    {
        $formatos = [
            'H:i',
            'H:i:s'
        ];


        foreach ($formatos as $formato) {

            $objeto =
                \DateTime::createFromFormat(
                    $formato,
                    $hora
                );


            if (
                $objeto !== false &&
                $objeto->format($formato) === $hora
            ) {
                return true;
            }
        }


        return false;
    }


    // --------------------------------------------------
    // Normaliza HH:MM para HH:MM:SS
    // --------------------------------------------------

    private function normalizarHora(
        string $hora
    ): string {

        if (strlen($hora) === 5) {
            return $hora . ':00';
        }

        return $hora;
    }


    // --------------------------------------------------
    // Nome do dia
    // --------------------------------------------------

    private function nomeDia(
        int $diaSemana
    ): string {

        $dias = [
            1 => 'Segunda-feira',
            2 => 'Terça-feira',
            3 => 'Quarta-feira',
            4 => 'Quinta-feira',
            5 => 'Sexta-feira',
            6 => 'Sábado',
            7 => 'Domingo'
        ];

        return $dias[$diaSemana] ?? '';
    }


    // ==================================================
    // GET /api/turmas/{turmaId}/horarios
    // ==================================================

    public function listar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $turmaId =
                (int) $args['turmaId'];


            $turma =
                $this->turmaRepository
                    ->buscarPorId($turmaId);


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


            $horarios =
                $this->repository
                    ->listarPorTurma($turmaId);


            // Acrescentamos o nome do dia
            // sem precisar armazená-lo no banco.
            foreach ($horarios as &$horario) {

                $horario['dia_semana_nome'] =
                    $this->nomeDia(
                        (int) $horario['dia_semana']
                    );
            }

            unset($horario);


            return $this->json(
                $response,
                [
                    'sucesso' => true,

                    'turma' => [
                        'id' => $turma['id'],
                        'nome' => $turma['nome']
                    ],

                    'total' =>
                        count($horarios),

                    'dados' =>
                        $horarios
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao consultar horários da turma.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // GET /api/turmas/{turmaId}/horarios/{horarioId}
    // ==================================================

    public function buscar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $turmaId =
                (int) $args['turmaId'];

            $horarioId =
                (int) $args['horarioId'];


            $horario =
                $this->repository->buscarPorId(
                    $turmaId,
                    $horarioId
                );


            if ($horario === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Horário não encontrado.'
                    ],
                    404
                );
            }


            $horario['dia_semana_nome'] =
                $this->nomeDia(
                    (int) $horario['dia_semana']
                );


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'dados' => $horario
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao consultar horário.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // POST /api/turmas/{turmaId}/horarios
    // ==================================================

    public function criar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $turmaId =
                (int) $args['turmaId'];


            // ------------------------------------------
            // Turma
            // ------------------------------------------

            $turma =
                $this->turmaRepository
                    ->buscarPorId($turmaId);


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


            if ((int) $turma['ativo'] !== 1) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Não é possível cadastrar horário para uma turma inativa.'
                    ],
                    422
                );
            }


            $dados =
                $request->getParsedBody();


            if (!is_array($dados)) {
                $dados = [];
            }


            $diaSemana =
                (int) ($dados['dia_semana'] ?? 0);


            $horaInicio = trim(
                (string) ($dados['hora_inicio'] ?? '')
            );


            $horaFim = trim(
                (string) ($dados['hora_fim'] ?? '')
            );


            // ------------------------------------------
            // Dia da semana
            // ------------------------------------------

            if (
                !in_array(
                    $diaSemana,
                    [1, 2, 3, 4, 5, 6, 7],
                    true
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O dia da semana deve possuir um valor entre 1 e 7.'
                    ],
                    422
                );
            }


            // ------------------------------------------
            // Horas
            // ------------------------------------------

            if (
                !$this->horaValida($horaInicio)
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'A hora inicial é inválida.'
                    ],
                    422
                );
            }


            if (
                !$this->horaValida($horaFim)
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'A hora final é inválida.'
                    ],
                    422
                );
            }


            $horaInicio =
                $this->normalizarHora(
                    $horaInicio
                );

            $horaFim =
                $this->normalizarHora(
                    $horaFim
                );


            // Hora final obrigatoriamente
            // deve ser posterior.
            if ($horaFim <= $horaInicio) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'A hora final deve ser posterior à hora inicial.'
                    ],
                    422
                );
            }


            // ------------------------------------------
            // Conflito
            // ------------------------------------------

            if (
                $this->repository
                    ->existeConflito(
                        $turmaId,
                        $diaSemana,
                        $horaInicio,
                        $horaFim
                    )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Este horário entra em conflito com outro horário ativo da turma.'
                    ],
                    409
                );
            }


            $horarioId =
                $this->repository->criar(
                    $turmaId,
                    $diaSemana,
                    $horaInicio,
                    $horaFim
                );


            $horario =
                $this->repository->buscarPorId(
                    $turmaId,
                    $horarioId
                );


            $horario['dia_semana_nome'] =
                $this->nomeDia($diaSemana);


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' =>
                        'Horário criado com sucesso.',
                    'dados' =>
                        $horario
                ],
                201
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao criar horário.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // PUT /api/turmas/{turmaId}/horarios/{horarioId}
    // ==================================================

    public function atualizar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $turmaId =
                (int) $args['turmaId'];

            $horarioId =
                (int) $args['horarioId'];


            $horarioAtual =
                $this->repository->buscarPorId(
                    $turmaId,
                    $horarioId
                );


            if ($horarioAtual === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Horário não encontrado.'
                    ],
                    404
                );
            }


            $dados =
                $request->getParsedBody();


            if (!is_array($dados)) {
                $dados = [];
            }


            $diaSemana =
                array_key_exists(
                    'dia_semana',
                    $dados
                )
                ? (int) $dados['dia_semana']
                : (int) $horarioAtual['dia_semana'];


            $horaInicio =
                array_key_exists(
                    'hora_inicio',
                    $dados
                )
                ? trim(
                    (string) $dados['hora_inicio']
                )
                : $horarioAtual['hora_inicio'];


            $horaFim =
                array_key_exists(
                    'hora_fim',
                    $dados
                )
                ? trim(
                    (string) $dados['hora_fim']
                )
                : $horarioAtual['hora_fim'];


            $ativo =
                $dados['ativo']
                ?? $horarioAtual['ativo'];

            $ativo =
                (int) $ativo;


            // ------------------------------------------
            // Validações
            // ------------------------------------------

            if (
                !in_array(
                    $diaSemana,
                    [1, 2, 3, 4, 5, 6, 7],
                    true
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O dia da semana deve possuir um valor entre 1 e 7.'
                    ],
                    422
                );
            }


            if (
                !$this->horaValida($horaInicio) ||
                !$this->horaValida($horaFim)
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'O horário informado é inválido.'
                    ],
                    422
                );
            }


            $horaInicio =
                $this->normalizarHora(
                    $horaInicio
                );

            $horaFim =
                $this->normalizarHora(
                    $horaFim
                );


            if ($horaFim <= $horaInicio) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'A hora final deve ser posterior à hora inicial.'
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


            // Só verificamos conflito se o
            // horário permanecer ativo.
            if (
                $ativo === 1 &&
                $this->repository
                    ->existeConflito(
                        $turmaId,
                        $diaSemana,
                        $horaInicio,
                        $horaFim,
                        $horarioId
                    )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Este horário entra em conflito com outro horário ativo da turma.'
                    ],
                    409
                );
            }


            $this->repository->atualizar(
                $horarioId,
                $diaSemana,
                $horaInicio,
                $horaFim,
                $ativo
            );


            $horario =
                $this->repository->buscarPorId(
                    $turmaId,
                    $horarioId
                );


            $horario['dia_semana_nome'] =
                $this->nomeDia(
                    $diaSemana
                );


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' =>
                        'Horário atualizado com sucesso.',
                    'dados' =>
                        $horario
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao atualizar horário.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // DELETE
    // ==================================================

    public function excluir(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $turmaId =
                (int) $args['turmaId'];

            $horarioId =
                (int) $args['horarioId'];


            $horario =
                $this->repository->buscarPorId(
                    $turmaId,
                    $horarioId
                );


            if ($horario === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Horário não encontrado.'
                    ],
                    404
                );
            }


            $this->repository
                ->desativar($horarioId);


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' =>
                        'Horário desativado com sucesso.'
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao desativar horário.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }
}