<?php

namespace App\Config;

use PDO;
use PDOException;

class Database
{
    private string $host;
    private string $port;
    private string $database;
    private string $username;
    private string $password;
    private ?PDO $connection = null;

    public function __construct()
    {
        $this->host = Env::get('DB_HOST', '127.0.0.1') ?? '127.0.0.1';
        $this->port = Env::get('DB_PORT', '3306') ?? '3306';
        $this->database = Env::get('DB_NAME', 'estudio_suzuki_db') ?? 'estudio_suzuki_db';
        $this->username = Env::get('DB_USER', 'root') ?? 'root';
        $this->password = Env::get('DB_PASS', '') ?? '';
    }

    /**
     * Cria e retorna uma conexão PDO com o MySQL/MariaDB.
     */
    public function connect(): PDO
    {
        if ($this->connection instanceof PDO) {
            return $this->connection;
        }

        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            $this->host,
            $this->port,
            $this->database
        );

        try {
            $this->connection = new PDO(
                $dsn,
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );

            return $this->connection;
        } catch (PDOException $e) {
            // Em desenvolvimento preservamos a causa; em produção a resposta
            // pública é sanitizada pelos Controllers.
            throw new PDOException(
                'Erro ao conectar ao banco de dados: ' . $e->getMessage(),
                (int) $e->getCode(),
                $e
            );
        }
    }
}
