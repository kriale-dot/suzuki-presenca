<?php

namespace App\Repositories;

use App\Config\Database;


class HorarioRepository
{
    private Database $database;


    public function __construct(Database $database)
    {
        $this->database = $database;
    }


    // --------------------------------------------------
    // Lista todos os horários de uma turma
    // --------------------------------------------------

    public function listarPorTurma(int $turmaId): array
    {
        $pdo = $this->database->connect();

        $sql = "
            SELECT
                h.id,
                h.turma_id,
                h.dia_semana,
                h.hora_inicio,
                h.hora_fim,
                h.ativo,
                h.criado_em

            FROM horarios h

            WHERE h.turma_id = :turma_id

            ORDER BY
                h.dia_semana,
                h.hora_inicio
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'turma_id' => $turmaId
        ]);

        return $stmt->fetchAll();
    }


    // --------------------------------------------------
    // Busca um horário específico
    // --------------------------------------------------

    public function buscarPorId(
        int $turmaId,
        int $horarioId
    ): ?array {

        $pdo = $this->database->connect();

        $sql = "
            SELECT
                id,
                turma_id,
                dia_semana,
                hora_inicio,
                hora_fim,
                ativo,
                criado_em

            FROM horarios

            WHERE id = :id
              AND turma_id = :turma_id

            LIMIT 1
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'id' => $horarioId,
            'turma_id' => $turmaId
        ]);

        $horario = $stmt->fetch();

        return $horario ?: null;
    }


    // --------------------------------------------------
    // Verifica conflito de horário dentro
    // da mesma turma.
    //
    // Existe conflito quando:
    //
    // novo_inicio < horario_existente_fim
    //
    // E
    //
    // novo_fim > horario_existente_inicio
    // --------------------------------------------------

    public function existeConflito(
        int $turmaId,
        int $diaSemana,
        string $horaInicio,
        string $horaFim,
        ?int $ignorarId = null
    ): bool {

        $pdo = $this->database->connect();


        $sql = "
            SELECT id

            FROM horarios

            WHERE turma_id = :turma_id
              AND dia_semana = :dia_semana
              AND ativo = 1

              AND :hora_inicio < hora_fim
              AND :hora_fim > hora_inicio
        ";


        $parametros = [
            'turma_id' => $turmaId,
            'dia_semana' => $diaSemana,
            'hora_inicio' => $horaInicio,
            'hora_fim' => $horaFim
        ];


        if ($ignorarId !== null) {

            $sql .= "
                AND id <> :id
            ";

            $parametros['id'] =
                $ignorarId;
        }


        $sql .= "
            LIMIT 1
        ";


        $stmt = $pdo->prepare($sql);

        $stmt->execute($parametros);

        return $stmt->fetch() !== false;
    }


    // --------------------------------------------------
    // Cria um horário
    // --------------------------------------------------

    public function criar(
        int $turmaId,
        int $diaSemana,
        string $horaInicio,
        string $horaFim
    ): int {

        $pdo = $this->database->connect();

        $sql = "
            INSERT INTO horarios
                (
                    turma_id,
                    dia_semana,
                    hora_inicio,
                    hora_fim,
                    ativo
                )

            VALUES
                (
                    :turma_id,
                    :dia_semana,
                    :hora_inicio,
                    :hora_fim,
                    1
                )
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'turma_id' => $turmaId,
            'dia_semana' => $diaSemana,
            'hora_inicio' => $horaInicio,
            'hora_fim' => $horaFim
        ]);

        return (int) $pdo->lastInsertId();
    }


    // --------------------------------------------------
    // Atualiza um horário
    // --------------------------------------------------

    public function atualizar(
        int $horarioId,
        int $diaSemana,
        string $horaInicio,
        string $horaFim,
        int $ativo
    ): bool {

        $pdo = $this->database->connect();

        $sql = "
            UPDATE horarios

            SET
                dia_semana = :dia_semana,
                hora_inicio = :hora_inicio,
                hora_fim = :hora_fim,
                ativo = :ativo

            WHERE id = :id
        ";

        $stmt = $pdo->prepare($sql);

        return $stmt->execute([
            'dia_semana' => $diaSemana,
            'hora_inicio' => $horaInicio,
            'hora_fim' => $horaFim,
            'ativo' => $ativo,
            'id' => $horarioId
        ]);
    }


    // --------------------------------------------------
    // Desativa o horário
    // --------------------------------------------------

    public function desativar(int $horarioId): bool
    {
        $pdo = $this->database->connect();

        $sql = "
            UPDATE horarios

            SET ativo = 0

            WHERE id = :id
        ";

        $stmt = $pdo->prepare($sql);

        return $stmt->execute([
            'id' => $horarioId
        ]);
    }
}