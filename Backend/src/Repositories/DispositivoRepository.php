<?php

namespace App\Repositories;

use App\Config\Database;


class DispositivoRepository
{
    private Database $database;


    public function __construct(Database $database)
    {
        $this->database = $database;
    }


    // --------------------------------------------------
    // Lista todos os dispositivos.
    // --------------------------------------------------

    public function listar(): array
    {
        $pdo = $this->database->connect();

        $sql = "
            SELECT
                id,
                nome,
                identificador,
                ativo,
                ultimo_acesso,
                criado_em,
                atualizado_em

            FROM dispositivos

            ORDER BY nome
        ";

        $stmt = $pdo->query($sql);

        return $stmt->fetchAll();
    }


    // --------------------------------------------------
    // Busca dispositivo pelo ID.
    // --------------------------------------------------

    public function buscarPorId(int $id): ?array
    {
        $pdo = $this->database->connect();

        $sql = "
            SELECT
                id,
                nome,
                identificador,
                ativo,
                ultimo_acesso,
                criado_em,
                atualizado_em

            FROM dispositivos

            WHERE id = :id

            LIMIT 1
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'id' => $id
        ]);

        $dispositivo = $stmt->fetch();

        return $dispositivo ?: null;
    }


    // --------------------------------------------------
    // Busca pelo identificador.
    //
    // Usado principalmente para verificar
    // duplicidades no cadastro.
    // --------------------------------------------------

    public function buscarPorIdentificador(
        string $identificador
    ): ?array {

        $pdo = $this->database->connect();

        $sql = "
            SELECT
                id,
                nome,
                identificador,
                ativo,
                ultimo_acesso,
                criado_em,
                atualizado_em

            FROM dispositivos

            WHERE identificador = :identificador

            LIMIT 1
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'identificador' => $identificador
        ]);

        $dispositivo = $stmt->fetch();

        return $dispositivo ?: null;
    }


    // --------------------------------------------------
    // Busca somente dispositivo ativo.
    //
    // É este método que será usado pelo tablet.
    // --------------------------------------------------

    public function buscarAtivoPorIdentificador(
        string $identificador
    ): ?array {

        $pdo = $this->database->connect();

        $sql = "
            SELECT
                id,
                nome,
                identificador,
                ativo,
                ultimo_acesso

            FROM dispositivos

            WHERE identificador = :identificador
              AND ativo = 1

            LIMIT 1
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'identificador' => $identificador
        ]);

        $dispositivo = $stmt->fetch();

        return $dispositivo ?: null;
    }


    // --------------------------------------------------
    // Verifica duplicidade de identificador.
    // --------------------------------------------------

    public function identificadorExiste(
        string $identificador,
        ?int $ignorarId = null
    ): bool {

        $pdo = $this->database->connect();

        $sql = "
            SELECT id

            FROM dispositivos

            WHERE identificador = :identificador
        ";

        $parametros = [
            'identificador' => $identificador
        ];


        if ($ignorarId !== null) {

            $sql .= "
                AND id <> :id
            ";

            $parametros['id'] = $ignorarId;
        }


        $sql .= "
            LIMIT 1
        ";


        $stmt = $pdo->prepare($sql);

        $stmt->execute($parametros);

        return $stmt->fetch() !== false;
    }


    // --------------------------------------------------
    // Cria dispositivo.
    // --------------------------------------------------

    public function criar(
        string $nome,
        string $identificador
    ): int {

        $pdo = $this->database->connect();

        $sql = "
            INSERT INTO dispositivos
                (
                    nome,
                    identificador,
                    ativo
                )

            VALUES
                (
                    :nome,
                    :identificador,
                    1
                )
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'nome' => $nome,
            'identificador' => $identificador
        ]);

        return (int) $pdo->lastInsertId();
    }


    // --------------------------------------------------
    // Atualiza dispositivo.
    // --------------------------------------------------

    public function atualizar(
        int $id,
        string $nome,
        string $identificador,
        int $ativo
    ): bool {

        $pdo = $this->database->connect();

        $sql = "
            UPDATE dispositivos

            SET
                nome = :nome,
                identificador = :identificador,
                ativo = :ativo

            WHERE id = :id
        ";

        $stmt = $pdo->prepare($sql);

        return $stmt->execute([
            'nome' => $nome,
            'identificador' => $identificador,
            'ativo' => $ativo,
            'id' => $id
        ]);
    }


    // --------------------------------------------------
    // Desativação lógica.
    // --------------------------------------------------

    public function desativar(int $id): bool
    {
        $pdo = $this->database->connect();

        $sql = "
            UPDATE dispositivos

            SET ativo = 0

            WHERE id = :id
        ";

        $stmt = $pdo->prepare($sql);

        return $stmt->execute([
            'id' => $id
        ]);
    }


    // --------------------------------------------------
    // Atualiza o último acesso.
    //
    // Será chamado sempre que o tablet utilizar
    // a API própria dele.
    // --------------------------------------------------

    public function registrarAcesso(int $id): void
    {
        $pdo = $this->database->connect();

        $sql = "
            UPDATE dispositivos

            SET ultimo_acesso = CURRENT_TIMESTAMP

            WHERE id = :id
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'id' => $id
        ]);
    }
}