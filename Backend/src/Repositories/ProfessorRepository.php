<?php

namespace App\Repositories;

use App\Config\Database;

class ProfessorRepository
{
    private Database $database;


    public function __construct(Database $database)
    {
        $this->database = $database;
    }


    // --------------------------------------------------
    // Lista todos os professores
    // --------------------------------------------------

    public function listar(): array
    {
        $pdo = $this->database->connect();

        $sql = "
            SELECT
                id,
                nome,
                email,
                telefone,
                ativo,
                criado_em,
                atualizado_em
            FROM professores
            ORDER BY nome
        ";

        $stmt = $pdo->query($sql);

        return $stmt->fetchAll();
    }


    // --------------------------------------------------
    // Busca um professor pelo ID
    // --------------------------------------------------

    public function buscarPorId(int $id): ?array
    {
        $pdo = $this->database->connect();

        $sql = "
            SELECT
                id,
                nome,
                email,
                telefone,
                ativo,
                criado_em,
                atualizado_em
            FROM professores
            WHERE id = :id
            LIMIT 1
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'id' => $id
        ]);

        $professor = $stmt->fetch();

        return $professor ?: null;
    }


    // --------------------------------------------------
    // Cria um professor
    // --------------------------------------------------

    public function criar(
        string $nome,
        ?string $email,
        ?string $telefone
    ): int {

        $pdo = $this->database->connect();

        $sql = "
            INSERT INTO professores
                (
                    nome,
                    email,
                    telefone,
                    ativo
                )
            VALUES
                (
                    :nome,
                    :email,
                    :telefone,
                    1
                )
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'nome' => $nome,
            'email' => $email,
            'telefone' => $telefone
        ]);

        return (int) $pdo->lastInsertId();
    }


    // --------------------------------------------------
    // Atualiza um professor
    // --------------------------------------------------

    public function atualizar(
        int $id,
        string $nome,
        ?string $email,
        ?string $telefone,
        int $ativo
    ): bool {

        $pdo = $this->database->connect();

        $sql = "
            UPDATE professores
            SET
                nome = :nome,
                email = :email,
                telefone = :telefone,
                ativo = :ativo
            WHERE id = :id
        ";

        $stmt = $pdo->prepare($sql);

        return $stmt->execute([
            'nome' => $nome,
            'email' => $email,
            'telefone' => $telefone,
            'ativo' => $ativo,
            'id' => $id
        ]);
    }


    // --------------------------------------------------
    // Verifica se o professor está vinculado a alguma
    // turma ativa. Professores com turmas ativas não
    // devem ser desativados sem antes reorganizar as
    // turmas, evitando cadastros inconsistentes.
    // --------------------------------------------------

    public function possuiTurmasAtivas(int $id): bool
    {
        $pdo = $this->database->connect();

        $sql = "
            SELECT id
            FROM turmas
            WHERE professor_id = :professor_id
              AND ativo = 1
            LIMIT 1
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'professor_id' => $id
        ]);

        return $stmt->fetch() !== false;
    }


    // --------------------------------------------------
    // Desativa o professor
    // --------------------------------------------------

    public function desativar(int $id): bool
    {
        $pdo = $this->database->connect();

        $sql = "
            UPDATE professores
            SET ativo = 0
            WHERE id = :id
        ";

        $stmt = $pdo->prepare($sql);

        return $stmt->execute([
            'id' => $id
        ]);
    }
}