<?php

namespace App\Repositories;

use App\Config\Database;

class ModalidadeRepository
{
    private Database $database;


    // --------------------------------------------------
    // Construtor
    // --------------------------------------------------

    public function __construct(Database $database)
    {
        $this->database = $database;
    }


    // --------------------------------------------------
    // Lista todas as modalidades
    // --------------------------------------------------

    public function listar(): array
    {
        $pdo = $this->database->connect();

        $sql = "
            SELECT
                id,
                nome,
                ativo,
                criado_em
            FROM modalidades
            ORDER BY nome
        ";

        $stmt = $pdo->query($sql);

        return $stmt->fetchAll();
    }


    // --------------------------------------------------
    // Busca uma modalidade pelo ID
    // --------------------------------------------------

    public function buscarPorId(int $id): ?array
    {
        $pdo = $this->database->connect();

        $sql = "
            SELECT
                id,
                nome,
                ativo,
                criado_em
            FROM modalidades
            WHERE id = :id
            LIMIT 1
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'id' => $id
        ]);

        $modalidade = $stmt->fetch();

        if (!$modalidade) {
            return null;
        }

        return $modalidade;
    }


    // --------------------------------------------------
    // Verifica se já existe uma modalidade com o nome
    // informado.
    //
    // O parâmetro $ignorarId será utilizado durante
    // uma alteração.
    // --------------------------------------------------

    public function nomeExiste(
        string $nome,
        ?int $ignorarId = null
    ): bool {

        $pdo = $this->database->connect();


        if ($ignorarId === null) {

            $sql = "
                SELECT id
                FROM modalidades
                WHERE nome = :nome
                LIMIT 1
            ";

            $stmt = $pdo->prepare($sql);

            $stmt->execute([
                'nome' => $nome
            ]);

        } else {

            $sql = "
                SELECT id
                FROM modalidades
                WHERE nome = :nome
                  AND id <> :id
                LIMIT 1
            ";

            $stmt = $pdo->prepare($sql);

            $stmt->execute([
                'nome' => $nome,
                'id' => $ignorarId
            ]);
        }


        return $stmt->fetch() !== false;
    }


    // --------------------------------------------------
    // Cria uma modalidade
    // --------------------------------------------------

    public function criar(string $nome): int
    {
        $pdo = $this->database->connect();

        $sql = "
            INSERT INTO modalidades
                (nome, ativo)
            VALUES
                (:nome, 1)
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'nome' => $nome
        ]);


        // Retorna o ID gerado pelo AUTO_INCREMENT.
        return (int) $pdo->lastInsertId();
    }


    // --------------------------------------------------
    // Atualiza uma modalidade
    // --------------------------------------------------

    public function atualizar(
        int $id,
        string $nome,
        int $ativo
    ): bool {

        $pdo = $this->database->connect();

        $sql = "
            UPDATE modalidades
            SET
                nome = :nome,
                ativo = :ativo
            WHERE id = :id
        ";

        $stmt = $pdo->prepare($sql);

        return $stmt->execute([
            'nome' => $nome,
            'ativo' => $ativo,
            'id' => $id
        ]);
    }


    // --------------------------------------------------
    // Verifica se a modalidade está vinculada a alguma
    // turma ativa. Isso evita desativar uma modalidade
    // que ainda está em uso pela escola.
    // --------------------------------------------------

    public function possuiTurmasAtivas(int $id): bool
    {
        $pdo = $this->database->connect();

        $sql = "
            SELECT id
            FROM turmas
            WHERE modalidade_id = :modalidade_id
              AND ativo = 1
            LIMIT 1
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'modalidade_id' => $id
        ]);

        return $stmt->fetch() !== false;
    }


    // --------------------------------------------------
    // Desativação lógica
    // --------------------------------------------------

    public function desativar(int $id): bool
    {
        $pdo = $this->database->connect();

        $sql = "
            UPDATE modalidades
            SET ativo = 0
            WHERE id = :id
        ";

        $stmt = $pdo->prepare($sql);

        return $stmt->execute([
            'id' => $id
        ]);
    }
}