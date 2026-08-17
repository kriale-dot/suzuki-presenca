<?php

namespace App\Repositories;

use App\Config\Database;
use RuntimeException;
use Throwable;


class AulaRepository
{
    private Database $database;


    public function __construct(
        Database $database
    ) {
        $this->database =
            $database;
    }


    // ==================================================
    // LISTAR AULAS
    //
    // Administrador / secretaria:
    //      todas as aulas
    //
    // Professor:
    //      somente as aulas dele
    // ==================================================

    public function listar(
        ?int $professorId = null
    ): array {

        $pdo =
            $this->database->connect();


        $sql = "
            SELECT
                a.id,
                a.turma_id,
                t.nome AS turma_nome,

                t.modalidade_id,
                m.nome AS modalidade_nome,

                a.professor_id,
                p.nome AS professor_nome,

                a.horario_id,

                a.data_aula,
                a.hora_inicio,
                a.hora_fim,

                a.tipo,
                a.status,

                a.aberta_em,
                a.encerrada_em,
                a.motivo_cancelamento,

                a.criado_em,
                a.atualizado_em

            FROM aulas a

            INNER JOIN turmas t
                ON t.id = a.turma_id

            INNER JOIN modalidades m
                ON m.id = t.modalidade_id

            INNER JOIN professores p
                ON p.id = a.professor_id
        ";


        $parametros = [];


        if ($professorId !== null) {

            $sql .= "
                WHERE a.professor_id = :professor_id
            ";


            $parametros['professor_id'] =
                $professorId;
        }


        $sql .= "
            ORDER BY
                a.data_aula DESC,
                a.hora_inicio DESC
        ";


        $stmt =
            $pdo->prepare(
                $sql
            );


        $stmt->execute(
            $parametros
        );


        return $stmt->fetchAll();
    }


    // ==================================================
    // BUSCAR POR ID
    // ==================================================

    public function buscarPorId(
        int $id
    ): ?array {

        $pdo =
            $this->database->connect();


        $sql = "
            SELECT
                a.id,
                a.turma_id,
                t.nome AS turma_nome,

                t.modalidade_id,
                m.nome AS modalidade_nome,

                a.professor_id,
                p.nome AS professor_nome,

                a.horario_id,

                a.data_aula,
                a.hora_inicio,
                a.hora_fim,

                a.tipo,
                a.status,

                a.aberta_em,
                a.encerrada_em,
                a.motivo_cancelamento,

                a.criado_em,
                a.atualizado_em

            FROM aulas a

            INNER JOIN turmas t
                ON t.id = a.turma_id

            INNER JOIN modalidades m
                ON m.id = t.modalidade_id

            INNER JOIN professores p
                ON p.id = a.professor_id

            WHERE a.id = :id

            LIMIT 1
        ";


        $stmt =
            $pdo->prepare(
                $sql
            );


        $stmt->execute([
            'id' => $id
        ]);


        $aula =
            $stmt->fetch();


        return $aula
            ?: null;
    }


    // ==================================================
    // VERIFICA DUPLICIDADE
    // ==================================================

    public function aulaExiste(
        int $turmaId,
        string $dataAula,
        string $horaInicio,
        ?int $ignorarId = null
    ): bool {

        $pdo =
            $this->database->connect();


        $sql = "
            SELECT id

            FROM aulas

            WHERE turma_id = :turma_id
              AND data_aula = :data_aula
              AND hora_inicio = :hora_inicio
        ";


        $parametros = [
            'turma_id' =>
                $turmaId,

            'data_aula' =>
                $dataAula,

            'hora_inicio' =>
                $horaInicio
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


        $stmt =
            $pdo->prepare(
                $sql
            );


        $stmt->execute(
            $parametros
        );


        return $stmt->fetch()
            !==
            false;
    }


    // ==================================================
    // CRIAR AULA
    // ==================================================

    public function criar(
        int $turmaId,
        int $professorId,
        string $dataAula,
        string $horaInicio,
        string $horaFim,
        string $tipo
    ): int {

        $pdo =
            $this->database->connect();


        $sql = "
            INSERT INTO aulas
                (
                    turma_id,
                    professor_id,
                    data_aula,
                    hora_inicio,
                    hora_fim,
                    tipo,
                    status
                )

            VALUES
                (
                    :turma_id,
                    :professor_id,
                    :data_aula,
                    :hora_inicio,
                    :hora_fim,
                    :tipo,
                    'agendada'
                )
        ";


        $stmt =
            $pdo->prepare(
                $sql
            );


        $stmt->execute([
            'turma_id' =>
                $turmaId,

            'professor_id' =>
                $professorId,

            'data_aula' =>
                $dataAula,

            'hora_inicio' =>
                $horaInicio,

            'hora_fim' =>
                $horaFim,

            'tipo' =>
                $tipo
        ]);


        return (int)
            $pdo->lastInsertId();
    }


    // ==================================================
    // ATUALIZAR AULA AGENDADA
    // ==================================================

    public function atualizar(
        int $id,
        string $dataAula,
        string $horaInicio,
        string $horaFim,
        string $tipo
    ): bool {

        $pdo =
            $this->database->connect();


        $sql = "
            UPDATE aulas

            SET
                data_aula = :data_aula,
                hora_inicio = :hora_inicio,
                hora_fim = :hora_fim,
                tipo = :tipo

            WHERE id = :id
              AND status = 'agendada'
        ";


        $stmt =
            $pdo->prepare(
                $sql
            );


        return $stmt->execute([
            'data_aula' =>
                $dataAula,

            'hora_inicio' =>
                $horaInicio,

            'hora_fim' =>
                $horaFim,

            'tipo' =>
                $tipo,

            'id' =>
                $id
        ]);
    }


    // ==================================================
    // ABRIR AULA
    //
    // Cria o snapshot dos alunos e abre a aula.
    // ==================================================

    public function abrir(
        int $aulaId
    ): int {

        $pdo =
            $this->database->connect();


        $pdo->beginTransaction();


        try {

            $sql = "
                SELECT
                    id,
                    turma_id,
                    data_aula,
                    status

                FROM aulas

                WHERE id = :id

                FOR UPDATE
            ";


            $stmt =
                $pdo->prepare(
                    $sql
                );


            $stmt->execute([
                'id' =>
                    $aulaId
            ]);


            $aula =
                $stmt->fetch();


            if (!$aula) {

                throw new RuntimeException(
                    'Aula não encontrada.'
                );
            }


            if (
                $aula['status']
                !==
                'agendada'
            ) {

                throw new RuntimeException(
                    'Somente aulas agendadas podem ser abertas.'
                );
            }


            // ==========================================
            // SNAPSHOT DOS ALUNOS
            // ==========================================

            $sql = "
                INSERT IGNORE INTO aula_alunos
                    (
                        aula_id,
                        aluno_id
                    )

                SELECT
                    :aula_id,
                    ta.aluno_id

                FROM turma_alunos ta

                INNER JOIN alunos al
                    ON al.id = ta.aluno_id

                WHERE ta.turma_id = :turma_id
                  AND ta.ativo = 1
                  AND al.ativo = 1
                  AND ta.data_inicio <= :data_aula_inicio
                  AND (
                      ta.data_fim IS NULL
                      OR ta.data_fim >= :data_aula_fim
                  )
            ";


            $stmt =
                $pdo->prepare(
                    $sql
                );


            $stmt->execute([
                'aula_id' =>
                    $aulaId,

                'turma_id' =>
                    $aula['turma_id'],

                'data_aula_inicio' =>
                    $aula['data_aula'],

                'data_aula_fim' =>
                    $aula['data_aula']
            ]);


            $totalAlunos =
                $stmt->rowCount();


            // ==========================================
            // ALTERA STATUS
            // ==========================================

            $sql = "
                UPDATE aulas

                SET
                    status = 'aberta',
                    aberta_em = CURRENT_TIMESTAMP

                WHERE id = :id
            ";


            $stmt =
                $pdo->prepare(
                    $sql
                );


            $stmt->execute([
                'id' =>
                    $aulaId
            ]);


            $pdo->commit();


            return $totalAlunos;

        } catch (Throwable $erro) {

            if (
                $pdo->inTransaction()
            ) {

                $pdo->rollBack();
            }


            throw $erro;
        }
    }


    // ==================================================
    // SNAPSHOT DOS ALUNOS
    // ==================================================

    public function listarAlunos(
        int $aulaId
    ): array {

        $pdo =
            $this->database->connect();


        $sql = "
            SELECT
                aa.id AS aula_aluno_id,
                aa.aula_id,
                aa.aluno_id,

                al.nome AS aluno_nome,
                al.data_nascimento,
                al.foto_url,

                aa.criado_em

            FROM aula_alunos aa

            INNER JOIN alunos al
                ON al.id = aa.aluno_id

            WHERE aa.aula_id = :aula_id

            ORDER BY al.nome
        ";


        $stmt =
            $pdo->prepare(
                $sql
            );


        $stmt->execute([
            'aula_id' =>
                $aulaId
        ]);


        return $stmt->fetchAll();
    }


    // ==================================================
    // ENCERRAR AULA
    //
    // Alunos sem registro tornam-se ausentes.
    // ==================================================

    public function encerrar(
        int $aulaId
    ): int {

        $pdo =
            $this->database->connect();


        $pdo->beginTransaction();


        try {

            $sql = "
                SELECT
                    id,
                    status

                FROM aulas

                WHERE id = :id

                FOR UPDATE
            ";


            $stmt =
                $pdo->prepare(
                    $sql
                );


            $stmt->execute([
                'id' =>
                    $aulaId
            ]);


            $aula =
                $stmt->fetch();


            if (!$aula) {

                throw new RuntimeException(
                    'Aula não encontrada.'
                );
            }


            if (
                $aula['status']
                !==
                'aberta'
            ) {

                throw new RuntimeException(
                    'Somente aulas abertas podem ser encerradas.'
                );
            }


            // ==========================================
            // AUSÊNCIAS AUTOMÁTICAS
            // ==========================================

            $sql = "
                INSERT INTO presencas
                    (
                        aula_aluno_id,
                        situacao,
                        origem,
                        dispositivo_id,
                        observacao
                    )

                SELECT
                    aa.id,
                    'ausente',
                    'professor',
                    NULL,
                    'Ausência registrada no encerramento da aula.'

                FROM aula_alunos aa

                LEFT JOIN presencas p
                    ON p.aula_aluno_id = aa.id

                WHERE aa.aula_id = :aula_id
                  AND p.id IS NULL
            ";


            $stmt =
                $pdo->prepare(
                    $sql
                );


            $stmt->execute([
                'aula_id' =>
                    $aulaId
            ]);


            $totalAusencias =
                $stmt->rowCount();


            // ==========================================
            // ENCERRA
            // ==========================================

            $sql = "
                UPDATE aulas

                SET
                    status = 'encerrada',
                    encerrada_em = CURRENT_TIMESTAMP

                WHERE id = :id
            ";


            $stmt =
                $pdo->prepare(
                    $sql
                );


            $stmt->execute([
                'id' =>
                    $aulaId
            ]);


            $pdo->commit();


            return $totalAusencias;

        } catch (Throwable $erro) {

            if (
                $pdo->inTransaction()
            ) {

                $pdo->rollBack();
            }


            throw $erro;
        }
    }


    // ==================================================
    // CANCELAR
    // ==================================================

    public function cancelar(
        int $aulaId,
        ?string $motivo
    ): bool {

        $pdo =
            $this->database->connect();


        $sql = "
            UPDATE aulas

            SET
                status = 'cancelada',
                motivo_cancelamento = :motivo

            WHERE id = :id
              AND status = 'agendada'
        ";


        $stmt =
            $pdo->prepare(
                $sql
            );


        $stmt->execute([
            'motivo' =>
                $motivo,

            'id' =>
                $aulaId
        ]);


        return $stmt->rowCount()
            >
            0;
    }
}