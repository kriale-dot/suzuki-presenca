<?php

namespace App\Repositories;

use App\Config\Database;
use DateInterval;
use DatePeriod;
use DateTimeImmutable;
use PDO;
use Throwable;


class GeracaoAulasRepository
{
    private Database $database;


    public function __construct(
        Database $database
    ) {
        $this->database = $database;
    }


    /**
     * Gera aulas a partir dos horários semanais.
     *
     * Se $turmaId for null:
     *     considera todas as turmas ativas.
     *
     * Se $turmaId tiver valor:
     *     considera somente aquela turma.
     */
    public function gerar(
        string $dataInicio,
        string $dataFim,
        ?int $turmaId = null
    ): array {

        $pdo =
            $this->database->connect();


        // =================================================
        // BUSCA HORÁRIOS ATIVOS
        // =================================================

        $sql = "
            SELECT
                h.id AS horario_id,
                h.turma_id,
                h.dia_semana,
                h.hora_inicio,
                h.hora_fim,

                t.nome AS turma_nome,
                t.professor_id,

                p.nome AS professor_nome,

                m.nome AS modalidade_nome

            FROM horarios h

            INNER JOIN turmas t
                ON t.id = h.turma_id

            INNER JOIN professores p
                ON p.id = t.professor_id

            INNER JOIN modalidades m
                ON m.id = t.modalidade_id

            WHERE
                h.ativo = 1

                AND t.ativo = 1

                AND p.ativo = 1

                AND m.ativo = 1
        ";


        $parametros = [];


        if ($turmaId !== null) {

            $sql .= "
                AND t.id = :turma_id
            ";


            $parametros['turma_id'] =
                $turmaId;
        }


        $sql .= "
            ORDER BY
                t.nome,
                h.dia_semana,
                h.hora_inicio
        ";


        $stmt =
            $pdo->prepare(
                $sql
            );


        $stmt->execute(
            $parametros
        );


        $horarios =
            $stmt->fetchAll(
                PDO::FETCH_ASSOC
            );


        // =================================================
        // PREPARA PERÍODO
        //
        // DatePeriod normalmente não inclui o último dia.
        // Por isso acrescentamos 1 dia ao término.
        // =================================================

        $inicio =
            new DateTimeImmutable(
                $dataInicio
            );


        $fim =
            new DateTimeImmutable(
                $dataFim
            );


        $fimInclusivo =
            $fim->add(
                new DateInterval(
                    'P1D'
                )
            );


        $periodo =
            new DatePeriod(
                $inicio,
                new DateInterval(
                    'P1D'
                ),
                $fimInclusivo
            );


        // =================================================
        // INSERT
        //
        // Já temos duas proteções no banco:
        //
        // 1.
        // UNIQUE(turma_id, data_aula, hora_inicio)
        //
        // 2.
        // UNIQUE(horario_id, data_aula)
        //
        // ON DUPLICATE KEY evita erro quando a aula já
        // estiver cadastrada.
        // =================================================

        $sqlInsert = "
            INSERT INTO aulas (
                turma_id,
                professor_id,
                horario_id,
                data_aula,
                hora_inicio,
                hora_fim,
                tipo,
                status
            )

            VALUES (
                :turma_id,
                :professor_id,
                :horario_id,
                :data_aula,
                :hora_inicio,
                :hora_fim,
                'regular',
                'agendada'
            )

            ON DUPLICATE KEY UPDATE
                id = id
        ";


        $stmtInsert =
            $pdo->prepare(
                $sqlInsert
            );


        // =================================================
        // CONTADORES
        // =================================================

        $aulasCriadas = 0;

        $aulasExistentes = 0;

        $diasProcessados = 0;


        $detalhes = [];


        try {

            $pdo->beginTransaction();


            // =============================================
            // PERCORRE CADA DATA
            // =============================================

            foreach (
                $periodo as $data
            ) {

                $diasProcessados++;


                /*
                 * PHP:
                 *
                 * N =
                 * 1 segunda
                 * 2 terça
                 * ...
                 * 7 domingo
                 *
                 * É exatamente a convenção que escolhemos
                 * para horarios.dia_semana.
                 */
                $diaSemana =
                    (int) $data->format(
                        'N'
                    );


                $dataSql =
                    $data->format(
                        'Y-m-d'
                    );


                // =========================================
                // PROCURA HORÁRIOS DAQUELE DIA
                // =========================================

                foreach (
                    $horarios as $horario
                ) {

                    if (
                        (int) $horario['dia_semana']
                        !==
                        $diaSemana
                    ) {
                        continue;
                    }


                    $stmtInsert->execute([
                        'turma_id' =>
                            (int) $horario['turma_id'],

                        'professor_id' =>
                            (int) $horario['professor_id'],

                        'horario_id' =>
                            (int) $horario['horario_id'],

                        'data_aula' =>
                            $dataSql,

                        'hora_inicio' =>
                            $horario['hora_inicio'],

                        'hora_fim' =>
                            $horario['hora_fim']
                    ]);


                    /*
                     * INSERT novo:
                     * rowCount() = 1
                     *
                     * ON DUPLICATE sem alteração:
                     * normalmente rowCount() = 0
                     */
                    if (
                        $stmtInsert->rowCount() === 1
                    ) {

                        $aulasCriadas++;


                        $detalhes[] = [

                            'data_aula' =>
                                $dataSql,

                            'turma_id' =>
                                (int) $horario['turma_id'],

                            'turma_nome' =>
                                $horario['turma_nome'],

                            'horario_id' =>
                                (int) $horario['horario_id'],

                            'hora_inicio' =>
                                $horario['hora_inicio'],

                            'hora_fim' =>
                                $horario['hora_fim']
                        ];

                    } else {

                        $aulasExistentes++;
                    }
                }
            }


            $pdo->commit();


            return [

                'horarios_considerados' =>
                    count(
                        $horarios
                    ),

                'dias_processados' =>
                    $diasProcessados,

                'aulas_criadas' =>
                    $aulasCriadas,

                'aulas_ja_existentes' =>
                    $aulasExistentes,

                'detalhes' =>
                    $detalhes
            ];

        } catch (Throwable $erro) {

            if (
                $pdo->inTransaction()
            ) {

                $pdo->rollBack();
            }


            throw $erro;
        }
    }
}