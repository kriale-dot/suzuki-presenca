<?php

namespace App\Repositories;

use App\Config\Database;
use Throwable;

class AlunoResponsavelRepository
{
    private Database $database;


    public function __construct(Database $database)
    {
        $this->database = $database;
    }


    // --------------------------------------------------
    // Lista os responsáveis vinculados a um aluno
    // --------------------------------------------------

    public function listarPorAluno(int $alunoId): array
    {
        $pdo = $this->database->connect();

        $sql = "
            SELECT
                ar.aluno_id,
                ar.responsavel_id,
                r.nome,
                r.telefone,
                r.email,
                ar.parentesco,
                ar.principal
            FROM aluno_responsavel ar

            INNER JOIN responsaveis r
                ON r.id = ar.responsavel_id

            WHERE ar.aluno_id = :aluno_id

            ORDER BY
                ar.principal DESC,
                r.nome
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'aluno_id' => $alunoId
        ]);

        return $stmt->fetchAll();
    }


    // --------------------------------------------------
    // Busca um vínculo específico
    // --------------------------------------------------

    public function buscarVinculo(
        int $alunoId,
        int $responsavelId
    ): ?array {

        $pdo = $this->database->connect();

        $sql = "
            SELECT
                ar.aluno_id,
                ar.responsavel_id,
                r.nome,
                r.telefone,
                r.email,
                ar.parentesco,
                ar.principal
            FROM aluno_responsavel ar

            INNER JOIN responsaveis r
                ON r.id = ar.responsavel_id

            WHERE ar.aluno_id = :aluno_id
              AND ar.responsavel_id = :responsavel_id

            LIMIT 1
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'aluno_id' => $alunoId,
            'responsavel_id' => $responsavelId
        ]);

        $vinculo = $stmt->fetch();

        return $vinculo ?: null;
    }


    // --------------------------------------------------
    // Verifica se já existe o vínculo
    // --------------------------------------------------

    public function vinculoExiste(
        int $alunoId,
        int $responsavelId
    ): bool {

        $pdo = $this->database->connect();

        $sql = "
            SELECT
                aluno_id
            FROM aluno_responsavel
            WHERE aluno_id = :aluno_id
              AND responsavel_id = :responsavel_id
            LIMIT 1
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'aluno_id' => $alunoId,
            'responsavel_id' => $responsavelId
        ]);

        return $stmt->fetch() !== false;
    }


    // --------------------------------------------------
    // Cria o vínculo
    // --------------------------------------------------

    public function criar(
        int $alunoId,
        int $responsavelId,
        ?string $parentesco,
        int $principal
    ): void {

        $pdo = $this->database->connect();

        $pdo->beginTransaction();

        try {

            // Se este responsável será o principal,
            // retiramos essa condição dos demais.
            if ($principal === 1) {

                $sql = "
                    UPDATE aluno_responsavel
                    SET principal = 0
                    WHERE aluno_id = :aluno_id
                ";

                $stmt = $pdo->prepare($sql);

                $stmt->execute([
                    'aluno_id' => $alunoId
                ]);
            }


            $sql = "
                INSERT INTO aluno_responsavel
                    (
                        aluno_id,
                        responsavel_id,
                        parentesco,
                        principal
                    )
                VALUES
                    (
                        :aluno_id,
                        :responsavel_id,
                        :parentesco,
                        :principal
                    )
            ";

            $stmt = $pdo->prepare($sql);

            $stmt->execute([
                'aluno_id' => $alunoId,
                'responsavel_id' => $responsavelId,
                'parentesco' => $parentesco,
                'principal' => $principal
            ]);


            $pdo->commit();

        } catch (Throwable $erro) {

            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            throw $erro;
        }
    }


    // --------------------------------------------------
    // Atualiza o vínculo
    // --------------------------------------------------

    public function atualizar(
        int $alunoId,
        int $responsavelId,
        ?string $parentesco,
        int $principal
    ): void {

        $pdo = $this->database->connect();

        $pdo->beginTransaction();

        try {

            // Se o responsável passou a ser principal,
            // remove o status principal dos demais.
            if ($principal === 1) {

                $sql = "
                    UPDATE aluno_responsavel
                    SET principal = 0
                    WHERE aluno_id = :aluno_id
                ";

                $stmt = $pdo->prepare($sql);

                $stmt->execute([
                    'aluno_id' => $alunoId
                ]);
            }


            $sql = "
                UPDATE aluno_responsavel
                SET
                    parentesco = :parentesco,
                    principal = :principal

                WHERE aluno_id = :aluno_id
                  AND responsavel_id = :responsavel_id
            ";

            $stmt = $pdo->prepare($sql);

            $stmt->execute([
                'parentesco' => $parentesco,
                'principal' => $principal,
                'aluno_id' => $alunoId,
                'responsavel_id' => $responsavelId
            ]);


            $pdo->commit();

        } catch (Throwable $erro) {

            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            throw $erro;
        }
    }


    // --------------------------------------------------
    // Remove somente o vínculo
    // --------------------------------------------------

    public function excluir(
        int $alunoId,
        int $responsavelId
    ): bool {

        $pdo = $this->database->connect();

        $sql = "
            DELETE FROM aluno_responsavel

            WHERE aluno_id = :aluno_id
              AND responsavel_id = :responsavel_id
        ";

        $stmt = $pdo->prepare($sql);

        return $stmt->execute([
            'aluno_id' => $alunoId,
            'responsavel_id' => $responsavelId
        ]);
    }
}