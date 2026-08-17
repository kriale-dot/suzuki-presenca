<?php

namespace App\Repositories;

use App\Config\Database;
use Throwable;

class AlunoRepository
{
    private Database $database;

    public function __construct(Database $database)
    {
        $this->database = $database;
    }

    // ==================================================
    // LISTAR
    // ==================================================

    public function listar(): array
    {
        $pdo = $this->database->connect();

        $stmt = $pdo->query("
            SELECT
                id,
                nome,
                data_nascimento,
                foto_url,
                ativo,
                criado_em,
                atualizado_em
            FROM alunos
            ORDER BY nome
        ");

        return $stmt->fetchAll();
    }

    // ==================================================
    // BUSCAR POR ID
    // ==================================================

    public function buscarPorId(int $id): ?array
    {
        $pdo = $this->database->connect();

        $stmt = $pdo->prepare("
            SELECT
                id,
                nome,
                data_nascimento,
                foto_url,
                ativo,
                criado_em,
                atualizado_em
            FROM alunos
            WHERE id = :id
            LIMIT 1
        ");

        $stmt->execute([
            'id' => $id,
        ]);

        $aluno = $stmt->fetch();

        return $aluno ?: null;
    }

    // ==================================================
    // CRIAR
    // ==================================================

    public function criar(
        string $nome,
        ?string $dataNascimento,
        ?string $fotoUrl = null
    ): int {
        $pdo = $this->database->connect();

        $stmt = $pdo->prepare("
            INSERT INTO alunos
                (
                    nome,
                    data_nascimento,
                    foto_url,
                    ativo
                )
            VALUES
                (
                    :nome,
                    :data_nascimento,
                    :foto_url,
                    1
                )
        ");

        $stmt->execute([
            'nome' => $nome,
            'data_nascimento' => $dataNascimento,
            'foto_url' => $fotoUrl,
        ]);

        return (int) $pdo->lastInsertId();
    }

    // ==================================================
    // ATUALIZAR DADOS DO ALUNO
    // ==================================================

    public function atualizar(
        int $id,
        string $nome,
        ?string $dataNascimento,
        ?string $fotoUrl,
        int $ativo
    ): bool {
        $pdo = $this->database->connect();

        if ($ativo === 1) {
            $stmt = $pdo->prepare("
                UPDATE alunos
                SET
                    nome = :nome,
                    data_nascimento = :data_nascimento,
                    foto_url = :foto_url,
                    ativo = 1
                WHERE id = :id
            ");

            return $stmt->execute([
                'nome' => $nome,
                'data_nascimento' => $dataNascimento,
                'foto_url' => $fotoUrl,
                'id' => $id,
            ]);
        }

        // Se o PUT também estiver desativando o aluno,
        // encerramos as matrículas ativas na data de hoje.
        $dataFim = date('Y-m-d');

        $pdo->beginTransaction();

        try {
            $stmt = $pdo->prepare("
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
                WHERE aluno_id = :aluno_id
                  AND ativo = 1
            ");

            $stmt->execute([
                'data_inicio_limite' => $dataFim,
                'data_fim_limite' => $dataFim,
                'data_fim_valor' => $dataFim,
                'aluno_id' => $id,
            ]);

            $stmt = $pdo->prepare("
                UPDATE alunos
                SET
                    nome = :nome,
                    data_nascimento = :data_nascimento,
                    foto_url = :foto_url,
                    ativo = 0
                WHERE id = :id
            ");

            $stmt->execute([
                'nome' => $nome,
                'data_nascimento' => $dataNascimento,
                'foto_url' => $fotoUrl,
                'id' => $id,
            ]);

            $pdo->commit();

            return true;

        } catch (Throwable $erro) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            throw $erro;
        }
    }

    // ==================================================
    // ATUALIZAR SOMENTE A FOTO
    // ==================================================

    public function atualizarFoto(
        int $id,
        ?string $fotoUrl
    ): bool {
        $pdo = $this->database->connect();

        $stmt = $pdo->prepare("
            UPDATE alunos
            SET foto_url = :foto_url
            WHERE id = :id
        ");

        return $stmt->execute([
            'foto_url' => $fotoUrl,
            'id' => $id,
        ]);
    }

    // ==================================================
    // EXCLUSÃO FÍSICA
    //
    // Usada apenas para desfazer um cadastro recém-criado
    // caso o salvamento da foto falhe imediatamente depois.
    // ==================================================

    public function excluirFisicamente(int $id): bool
    {
        $pdo = $this->database->connect();

        $stmt = $pdo->prepare("
            DELETE FROM alunos
            WHERE id = :id
        ");

        $stmt->execute([
            'id' => $id,
        ]);

        return $stmt->rowCount() > 0;
    }

    // ==================================================
    // DESATIVAR
    // ==================================================

    public function desativar(int $id): bool
    {
        $pdo = $this->database->connect();
        $dataFim = date('Y-m-d');

        $pdo->beginTransaction();

        try {
            $stmt = $pdo->prepare("
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
                WHERE aluno_id = :aluno_id
                  AND ativo = 1
            ");

            $stmt->execute([
                'data_inicio_limite' => $dataFim,
                'data_fim_limite' => $dataFim,
                'data_fim_valor' => $dataFim,
                'aluno_id' => $id,
            ]);

            $stmt = $pdo->prepare("
                UPDATE alunos
                SET ativo = 0
                WHERE id = :id
            ");

            $stmt->execute([
                'id' => $id,
            ]);

            $alterado = $stmt->rowCount() > 0;

            $pdo->commit();

            return $alterado;

        } catch (Throwable $erro) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }

            throw $erro;
        }
    }
}
