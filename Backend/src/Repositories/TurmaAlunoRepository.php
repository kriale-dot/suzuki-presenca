<?php

namespace App\Repositories;

use App\Config\Database;

class TurmaAlunoRepository
{
    private Database $database;


    public function __construct(Database $database)
    {
        $this->database = $database;
    }


    // --------------------------------------------------
    // Lista todas as matrículas de uma turma
    // --------------------------------------------------

    public function listarPorTurma(int $turmaId): array
    {
        $pdo = $this->database->connect();

        $sql = "
            SELECT
                ta.id,
                ta.turma_id,
                ta.aluno_id,

                a.nome AS aluno_nome,
                a.data_nascimento,
                a.foto_url,

                ta.data_inicio,
                ta.data_fim,
                ta.ativo,
                ta.criado_em

            FROM turma_alunos ta

            INNER JOIN alunos a
                ON a.id = ta.aluno_id

            WHERE ta.turma_id = :turma_id

            ORDER BY
                ta.ativo DESC,
                a.nome,
                ta.data_inicio DESC
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'turma_id' => $turmaId
        ]);

        return $stmt->fetchAll();
    }


    // --------------------------------------------------
    // Busca uma matrícula específica
    // --------------------------------------------------

    public function buscarPorId(
        int $turmaId,
        int $matriculaId
    ): ?array {

        $pdo = $this->database->connect();

        $sql = "
            SELECT
                ta.id,
                ta.turma_id,
                ta.aluno_id,

                a.nome AS aluno_nome,
                a.data_nascimento,
                a.foto_url,

                ta.data_inicio,
                ta.data_fim,
                ta.ativo,
                ta.criado_em

            FROM turma_alunos ta

            INNER JOIN alunos a
                ON a.id = ta.aluno_id

            WHERE ta.id = :id
              AND ta.turma_id = :turma_id

            LIMIT 1
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'id' => $matriculaId,
            'turma_id' => $turmaId
        ]);

        $matricula = $stmt->fetch();

        return $matricula ?: null;
    }


    // --------------------------------------------------
    // Verifica se existe matrícula com a mesma
    // turma, aluno e data de início.
    //
    // O banco também possui uma restrição UNIQUE
    // para esses três campos.
    // --------------------------------------------------

    public function matriculaExiste(
        int $turmaId,
        int $alunoId,
        string $dataInicio,
        ?int $ignorarId = null
    ): bool {

        $pdo = $this->database->connect();


        if ($ignorarId === null) {

            $sql = "
                SELECT id
                FROM turma_alunos

                WHERE turma_id = :turma_id
                  AND aluno_id = :aluno_id
                  AND data_inicio = :data_inicio

                LIMIT 1
            ";

            $stmt = $pdo->prepare($sql);

            $stmt->execute([
                'turma_id' => $turmaId,
                'aluno_id' => $alunoId,
                'data_inicio' => $dataInicio
            ]);
        } else {

            $sql = "
                SELECT id
                FROM turma_alunos

                WHERE turma_id = :turma_id
                  AND aluno_id = :aluno_id
                  AND data_inicio = :data_inicio
                  AND id <> :id

                LIMIT 1
            ";

            $stmt = $pdo->prepare($sql);

            $stmt->execute([
                'turma_id' => $turmaId,
                'aluno_id' => $alunoId,
                'data_inicio' => $dataInicio,
                'id' => $ignorarId
            ]);
        }


        return $stmt->fetch() !== false;
    }


    // --------------------------------------------------
    // Verifica se o aluno já possui uma matrícula
    // ATIVA nesta turma.
    // --------------------------------------------------

    public function possuiMatriculaAtiva(
        int $turmaId,
        int $alunoId,
        ?int $ignorarId = null
    ): bool {

        $pdo = $this->database->connect();


        if ($ignorarId === null) {

            $sql = "
                SELECT id
                FROM turma_alunos

                WHERE turma_id = :turma_id
                  AND aluno_id = :aluno_id
                  AND ativo = 1

                LIMIT 1
            ";

            $stmt = $pdo->prepare($sql);

            $stmt->execute([
                'turma_id' => $turmaId,
                'aluno_id' => $alunoId
            ]);
        } else {

            $sql = "
                SELECT id
                FROM turma_alunos

                WHERE turma_id = :turma_id
                  AND aluno_id = :aluno_id
                  AND ativo = 1
                  AND id <> :id

                LIMIT 1
            ";

            $stmt = $pdo->prepare($sql);

            $stmt->execute([
                'turma_id' => $turmaId,
                'aluno_id' => $alunoId,
                'id' => $ignorarId
            ]);
        }


        return $stmt->fetch() !== false;
    }


    // --------------------------------------------------
    // Cria uma matrícula
    // --------------------------------------------------

    public function criar(
        int $turmaId,
        int $alunoId,
        string $dataInicio,
        ?string $dataFim
    ): int {

        $pdo = $this->database->connect();

        $sql = "
            INSERT INTO turma_alunos
                (
                    turma_id,
                    aluno_id,
                    data_inicio,
                    data_fim,
                    ativo
                )
            VALUES
                (
                    :turma_id,
                    :aluno_id,
                    :data_inicio,
                    :data_fim,
                    1
                )
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'turma_id' => $turmaId,
            'aluno_id' => $alunoId,
            'data_inicio' => $dataInicio,
            'data_fim' => $dataFim
        ]);

        return (int) $pdo->lastInsertId();
    }


    // --------------------------------------------------
    // Atualiza a matrícula
    // --------------------------------------------------

    public function atualizar(
        int $matriculaId,
        string $dataInicio,
        ?string $dataFim,
        int $ativo
    ): bool {

        $pdo = $this->database->connect();

        $sql = "
            UPDATE turma_alunos

            SET
                data_inicio = :data_inicio,
                data_fim = :data_fim,
                ativo = :ativo

            WHERE id = :id
        ";

        $stmt = $pdo->prepare($sql);

        return $stmt->execute([
            'data_inicio' => $dataInicio,
            'data_fim' => $dataFim,
            'ativo' => $ativo,
            'id' => $matriculaId
        ]);
    }


    // --------------------------------------------------
    // Desativa a matrícula.
    //
    // Não apagamos o registro para preservar
    // o histórico do aluno na turma.
    // --------------------------------------------------

    public function desativar(
        int $matriculaId,
        ?string $dataFim = null
    ): bool {

        $pdo = $this->database->connect();
        $dataFim = $dataFim ?? date('Y-m-d');

        $sql = "
            UPDATE turma_alunos
            SET
                ativo = 0,
                data_fim = CASE
                    WHEN data_inicio > :data_inicio_limite
                        THEN data_inicio
                    WHEN data_fim IS NULL OR data_fim > :data_fim_limite
                        THEN :data_fim_valor
                    ELSE data_fim
                END
            WHERE id = :id
        ";

        $stmt = $pdo->prepare($sql);

        return $stmt->execute([
            'data_inicio_limite' => $dataFim,
            'data_fim_limite' => $dataFim,
            'data_fim_valor' => $dataFim,
            'id' => $matriculaId
        ]);
    }
    // --------------------------------------------------
    // Lista todas as matrículas de um determinado aluno.
    //
    // Incluímos informações da turma, modalidade
    // e professor para que o frontend não precise fazer
    // várias requisições separadas.
    // --------------------------------------------------

    public function listarPorAluno(
        int $alunoId
    ): array {

        $pdo = $this->database->connect();

        $sql = "
        SELECT
            ta.id AS matricula_id,

            ta.aluno_id,

            ta.turma_id,
            t.nome AS turma_nome,
            t.tipo AS turma_tipo,
            t.sala,
            t.ativo AS turma_ativa,

            t.modalidade_id,
            m.nome AS modalidade_nome,

            t.professor_id,
            p.nome AS professor_nome,

            ta.data_inicio,
            ta.data_fim,

            ta.ativo AS matricula_ativa,

            ta.criado_em

        FROM turma_alunos ta

        INNER JOIN turmas t
            ON t.id = ta.turma_id

        INNER JOIN modalidades m
            ON m.id = t.modalidade_id

        INNER JOIN professores p
            ON p.id = t.professor_id

        WHERE ta.aluno_id = :aluno_id

        ORDER BY
            ta.ativo DESC,
            ta.data_inicio DESC,
            t.nome
    ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'aluno_id' => $alunoId
        ]);

        return $stmt->fetchAll();
    }
}
