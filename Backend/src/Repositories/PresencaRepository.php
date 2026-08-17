<?php

namespace App\Repositories;

use App\Config\Database;


class PresencaRepository
{
    private Database $database;


    public function __construct(Database $database)
    {
        $this->database = $database;
    }


    // --------------------------------------------------
    // Lista a situação de todos os alunos de uma aula.
    //
    // LEFT JOIN é importante porque precisamos mostrar
    // também alunos que ainda NÃO registraram presença.
    // --------------------------------------------------

    public function listarPorAula(int $aulaId): array
    {
        $pdo = $this->database->connect();

        $sql = "
            SELECT
                aa.id AS aula_aluno_id,
                aa.aula_id,
                aa.aluno_id,

                al.nome AS aluno_nome,
                al.foto_url,

                p.id AS presenca_id,
                p.situacao,
                p.origem,
                p.dispositivo_id,

                d.nome AS dispositivo_nome,

                p.registrado_em,
                p.observacao,
                p.criado_em,
                p.atualizado_em

            FROM aula_alunos aa

            INNER JOIN alunos al
                ON al.id = aa.aluno_id

            LEFT JOIN presencas p
                ON p.aula_aluno_id = aa.id

            LEFT JOIN dispositivos d
                ON d.id = p.dispositivo_id

            WHERE aa.aula_id = :aula_id

            ORDER BY al.nome
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'aula_id' => $aulaId
        ]);

        return $stmt->fetchAll();
    }


    // --------------------------------------------------
    // Busca um aluno pertencente ao snapshot da aula.
    //
    // Isso evita que alguém registre presença
    // utilizando um aula_aluno_id de outra aula.
    // --------------------------------------------------

    public function buscarAulaAluno(
        int $aulaId,
        int $aulaAlunoId
    ): ?array {

        $pdo = $this->database->connect();

        $sql = "
            SELECT
                aa.id AS aula_aluno_id,
                aa.aula_id,
                aa.aluno_id,
                al.nome AS aluno_nome,
                al.foto_url

            FROM aula_alunos aa

            INNER JOIN alunos al
                ON al.id = aa.aluno_id

            WHERE aa.id = :aula_aluno_id
              AND aa.aula_id = :aula_id

            LIMIT 1
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'aula_aluno_id' => $aulaAlunoId,
            'aula_id' => $aulaId
        ]);

        $aluno = $stmt->fetch();

        return $aluno ?: null;
    }


    // --------------------------------------------------
    // Busca a presença de determinado aluno da aula
    // --------------------------------------------------

    public function buscarPorAulaAluno(
        int $aulaAlunoId
    ): ?array {

        $pdo = $this->database->connect();

        $sql = "
            SELECT
                p.id,
                p.aula_aluno_id,
                p.situacao,
                p.origem,
                p.dispositivo_id,
                d.nome AS dispositivo_nome,
                p.registrado_em,
                p.observacao,
                p.criado_em,
                p.atualizado_em

            FROM presencas p

            LEFT JOIN dispositivos d
                ON d.id = p.dispositivo_id

            WHERE p.aula_aluno_id = :aula_aluno_id

            LIMIT 1
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'aula_aluno_id' => $aulaAlunoId
        ]);

        $presenca = $stmt->fetch();

        return $presenca ?: null;
    }


    // --------------------------------------------------
    // Verifica se determinado dispositivo existe
    // e está ativo.
    // --------------------------------------------------

    public function buscarDispositivoAtivo(
        int $dispositivoId
    ): ?array {

        $pdo = $this->database->connect();

        $sql = "
            SELECT
                id,
                nome,
                identificador,
                ativo

            FROM dispositivos

            WHERE id = :id
              AND ativo = 1

            LIMIT 1
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'id' => $dispositivoId
        ]);

        $dispositivo = $stmt->fetch();

        return $dispositivo ?: null;
    }


    // --------------------------------------------------
    // Registro feito pelo próprio aluno no tablet
    // --------------------------------------------------

    public function registrarAluno(
        int $aulaAlunoId,
        ?int $dispositivoId
    ): int {

        $pdo = $this->database->connect();

        $sql = "
            INSERT INTO presencas
                (
                    aula_aluno_id,
                    situacao,
                    origem,
                    dispositivo_id
                )

            VALUES
                (
                    :aula_aluno_id,
                    'presente',
                    'aluno',
                    :dispositivo_id
                )
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'aula_aluno_id' => $aulaAlunoId,
            'dispositivo_id' => $dispositivoId
        ]);

        return (int) $pdo->lastInsertId();
    }


    // --------------------------------------------------
    // Professor cria manualmente uma presença
    // --------------------------------------------------

    public function criarPorProfessor(
        int $aulaAlunoId,
        string $situacao,
        ?string $observacao
    ): int {

        $pdo = $this->database->connect();

        $sql = "
            INSERT INTO presencas
                (
                    aula_aluno_id,
                    situacao,
                    origem,
                    dispositivo_id,
                    observacao
                )

            VALUES
                (
                    :aula_aluno_id,
                    :situacao,
                    'professor',
                    NULL,
                    :observacao
                )
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'aula_aluno_id' => $aulaAlunoId,
            'situacao' => $situacao,
            'observacao' => $observacao
        ]);

        return (int) $pdo->lastInsertId();
    }


    // --------------------------------------------------
    // Professor corrige um registro existente.
    //
    // atualizado_em guardará o momento da correção.
    // --------------------------------------------------

    public function atualizarPorProfessor(
        int $aulaAlunoId,
        string $situacao,
        ?string $observacao
    ): bool {

        $pdo = $this->database->connect();

        $sql = "
            UPDATE presencas

            SET
                situacao = :situacao,
                origem = 'professor',
                dispositivo_id = NULL,
                observacao = :observacao

            WHERE aula_aluno_id = :aula_aluno_id
        ";

        $stmt = $pdo->prepare($sql);

        return $stmt->execute([
            'situacao' => $situacao,
            'observacao' => $observacao,
            'aula_aluno_id' => $aulaAlunoId
        ]);
    }

// --------------------------------------------------
// Retorna somente as informações necessárias
// para a tela infantil do tablet.
//
// Não enviamos:
// - data de nascimento
// - observações
// - informações de responsáveis
// - dados administrativos
// --------------------------------------------------

public function listarParaTablet(
    int $aulaId
): array {

    $pdo = $this->database->connect();

    $sql = "
        SELECT
            aa.id AS aula_aluno_id,
            aa.aluno_id,

            al.nome,
            al.foto_url,

            IF(
                p.id IS NULL,
                0,
                1
            ) AS registrado,

            IF(
                p.situacao = 'presente',
                1,
                0
            ) AS presente

        FROM aula_alunos aa

        INNER JOIN alunos al
            ON al.id = aa.aluno_id

        LEFT JOIN presencas p
            ON p.aula_aluno_id = aa.id

        WHERE aa.aula_id = :aula_id

        ORDER BY al.nome
    ";

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        'aula_id' => $aulaId
    ]);

    return $stmt->fetchAll();
}    

    // --------------------------------------------------
    // Registro idempotente feito pelo aluno/tablet.
    //
    // A aula é bloqueada com FOR UPDATE. O encerramento da aula
    // usa o mesmo bloqueio, eliminando a corrida entre "toque" e
    // "encerrar aula". Um toque duplicado retorna o registro que
    // já existe em vez de provocar erro de chave UNIQUE.
    // --------------------------------------------------

    public function registrarAlunoSeguro(
        int $aulaId,
        int $aulaAlunoId,
        ?int $dispositivoId
    ): array {

        $pdo = $this->database->connect();
        $pdo->beginTransaction();

        try {
            $stmt = $pdo->prepare("
                SELECT id, status
                FROM aulas
                WHERE id = :aula_id
                FOR UPDATE
            ");

            $stmt->execute(['aula_id' => $aulaId]);
            $aula = $stmt->fetch();

            if (!$aula) {
                $pdo->rollBack();

                return [
                    'resultado' => 'aula_nao_encontrada',
                    'presenca' => null,
                ];
            }

            if ($aula['status'] !== 'aberta') {
                $pdo->rollBack();

                return [
                    'resultado' => 'aula_fechada',
                    'presenca' => null,
                ];
            }

            // Garante que o identificador do aluno pertence a esta aula.
            $stmt = $pdo->prepare("
                SELECT id
                FROM aula_alunos
                WHERE id = :aula_aluno_id
                  AND aula_id = :aula_id
                FOR UPDATE
            ");

            $stmt->execute([
                'aula_aluno_id' => $aulaAlunoId,
                'aula_id' => $aulaId,
            ]);

            if (!$stmt->fetch()) {
                $pdo->rollBack();

                return [
                    'resultado' => 'aluno_nao_pertence',
                    'presenca' => null,
                ];
            }

            $stmt = $pdo->prepare("
                SELECT
                    id,
                    aula_aluno_id,
                    situacao,
                    origem,
                    dispositivo_id,
                    registrado_em,
                    observacao,
                    criado_em,
                    atualizado_em
                FROM presencas
                WHERE aula_aluno_id = :aula_aluno_id
                LIMIT 1
                FOR UPDATE
            ");

            $stmt->execute(['aula_aluno_id' => $aulaAlunoId]);
            $existente = $stmt->fetch();

            if ($existente) {
                $pdo->commit();

                return [
                    'resultado' => 'existente',
                    'presenca' => $existente,
                ];
            }

            $stmt = $pdo->prepare("
                INSERT INTO presencas
                    (aula_aluno_id, situacao, origem, dispositivo_id)
                VALUES
                    (:aula_aluno_id, 'presente', 'aluno', :dispositivo_id)
            ");

            $stmt->execute([
                'aula_aluno_id' => $aulaAlunoId,
                'dispositivo_id' => $dispositivoId,
            ]);

            $id = (int) $pdo->lastInsertId();

            $stmt = $pdo->prepare("
                SELECT
                    id,
                    aula_aluno_id,
                    situacao,
                    origem,
                    dispositivo_id,
                    registrado_em,
                    observacao,
                    criado_em,
                    atualizado_em
                FROM presencas
                WHERE id = :id
                LIMIT 1
            ");

            $stmt->execute(['id' => $id]);
            $presenca = $stmt->fetch();

            $pdo->commit();

            return [
                'resultado' => 'criada',
                'presenca' => $presenca ?: null,
            ];
        } catch (\Throwable $erro) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            throw $erro;
        }
    }


    // --------------------------------------------------
    // Cria ou corrige o registro do professor em uma única
    // operação atômica. Isso elimina a corrida entre SELECT e INSERT.
    // --------------------------------------------------

    public function registrarOuAtualizarPorProfessor(
        int $aulaAlunoId,
        string $situacao,
        ?string $observacao
    ): void {

        $pdo = $this->database->connect();

        $sql = "
            INSERT INTO presencas
                (
                    aula_aluno_id,
                    situacao,
                    origem,
                    dispositivo_id,
                    observacao
                )
            VALUES
                (
                    :aula_aluno_id,
                    :situacao,
                    'professor',
                    NULL,
                    :observacao
                )
            ON DUPLICATE KEY UPDATE
                situacao = VALUES(situacao),
                origem = 'professor',
                dispositivo_id = NULL,
                observacao = VALUES(observacao)
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'aula_aluno_id' => $aulaAlunoId,
            'situacao' => $situacao,
            'observacao' => $observacao,
        ]);
    }

}