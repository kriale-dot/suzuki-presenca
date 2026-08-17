<?php

namespace App\Repositories;

use App\Config\Database;

class ResponsavelRepository
{
    private Database $database;


    public function __construct(Database $database)
    {
        $this->database = $database;
    }


    // --------------------------------------------------
    // Lista todos os responsáveis
    // --------------------------------------------------

    public function listar(): array
    {
        $pdo = $this->database->connect();

        $sql = "
            SELECT
                id,
                nome,
                telefone,
                email,
                criado_em,
                atualizado_em
            FROM responsaveis
            ORDER BY nome
        ";

        $stmt = $pdo->query($sql);

        return $stmt->fetchAll();
    }


    // --------------------------------------------------
    // Busca um responsável pelo ID
    // --------------------------------------------------

    public function buscarPorId(int $id): ?array
    {
        $pdo = $this->database->connect();

        $sql = "
            SELECT
                id,
                nome,
                telefone,
                email,
                criado_em,
                atualizado_em
            FROM responsaveis
            WHERE id = :id
            LIMIT 1
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'id' => $id
        ]);

        $responsavel = $stmt->fetch();

        return $responsavel ?: null;
    }


    // --------------------------------------------------
    // Cria um responsável
    // --------------------------------------------------

    public function criar(
        string $nome,
        ?string $telefone,
        ?string $email
    ): int {

        $pdo = $this->database->connect();

        $sql = "
            INSERT INTO responsaveis
                (
                    nome,
                    telefone,
                    email
                )
            VALUES
                (
                    :nome,
                    :telefone,
                    :email
                )
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'nome' => $nome,
            'telefone' => $telefone,
            'email' => $email
        ]);

        return (int) $pdo->lastInsertId();
    }


    // --------------------------------------------------
    // Atualiza um responsável
    // --------------------------------------------------

    public function atualizar(
        int $id,
        string $nome,
        ?string $telefone,
        ?string $email
    ): bool {

        $pdo = $this->database->connect();

        $sql = "
            UPDATE responsaveis
            SET
                nome = :nome,
                telefone = :telefone,
                email = :email
            WHERE id = :id
        ";

        $stmt = $pdo->prepare($sql);

        return $stmt->execute([
            'nome' => $nome,
            'telefone' => $telefone,
            'email' => $email,
            'id' => $id
        ]);
    }


    // --------------------------------------------------
    // Exclui fisicamente um responsável
    // --------------------------------------------------

    public function excluir(int $id): bool
    {
        $pdo = $this->database->connect();

        $sql = "
            DELETE FROM responsaveis
            WHERE id = :id
        ";

        $stmt = $pdo->prepare($sql);

        return $stmt->execute([
            'id' => $id
        ]);
    }
}