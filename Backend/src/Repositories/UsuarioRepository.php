<?php

namespace App\Repositories;

use App\Config\Database;
use PDO;


class UsuarioRepository
{
    private PDO $pdo;


    // ==================================================
    // CONSTRUTOR
    // ==================================================

    public function __construct(
        Database $database
    ) {
        $this->pdo =
            $database->connect();
    }


    // ==================================================
    // LISTAR
    // ==================================================

    public function listar(): array
    {
        $sql = "
            SELECT
                u.id,
                u.nome,
                u.email,
                u.perfil,
                u.professor_id,

                p.nome AS professor_nome,
                p.ativo AS professor_ativo,

                u.ativo,
                u.ultimo_login_em,
                u.criado_em,
                u.atualizado_em

            FROM usuarios u

            LEFT JOIN professores p
                ON p.id = u.professor_id

            ORDER BY u.nome ASC
        ";


        $stmt =
            $this->pdo->query(
                $sql
            );


        return $stmt->fetchAll(
            PDO::FETCH_ASSOC
        );
    }


    // ==================================================
    // BUSCAR POR ID
    // ==================================================

    public function buscarPorId(
        int $id
    ): ?array {

        $sql = "
            SELECT
                u.id,
                u.nome,
                u.email,
                u.perfil,
                u.professor_id,

                p.nome AS professor_nome,
                p.ativo AS professor_ativo,

                u.ativo,
                u.ultimo_login_em,
                u.criado_em,
                u.atualizado_em

            FROM usuarios u

            LEFT JOIN professores p
                ON p.id = u.professor_id

            WHERE u.id = :id

            LIMIT 1
        ";


        $stmt =
            $this->pdo->prepare(
                $sql
            );


        $stmt->execute([
            'id' => $id
        ]);


        $usuario =
            $stmt->fetch(
                PDO::FETCH_ASSOC
            );


        return $usuario
            ?: null;
    }


    // ==================================================
    // BUSCAR POR E-MAIL
    //
    // Usado durante o login.
    // ==================================================

    public function buscarPorEmail(
        string $email
    ): ?array {

        $sql = "
            SELECT
                u.id,
                u.nome,
                u.email,
                u.senha,
                u.perfil,
                u.professor_id,

                p.nome AS professor_nome,
                p.ativo AS professor_ativo,

                u.ativo,
                u.ultimo_login_em,
                u.criado_em,
                u.atualizado_em

            FROM usuarios u

            LEFT JOIN professores p
                ON p.id = u.professor_id

            WHERE u.email = :email

            LIMIT 1
        ";


        $stmt =
            $this->pdo->prepare(
                $sql
            );


        $stmt->execute([
            'email' => $email
        ]);


        $usuario =
            $stmt->fetch(
                PDO::FETCH_ASSOC
            );


        return $usuario
            ?: null;
    }


    // ==================================================
    // E-MAIL PERTENCE A OUTRO USUÁRIO?
    // ==================================================

    public function emailPertenceAOutroUsuario(
        string $email,
        int $usuarioId
    ): bool {

        $sql = "
            SELECT id

            FROM usuarios

            WHERE email = :email
              AND id <> :id

            LIMIT 1
        ";


        $stmt =
            $this->pdo->prepare(
                $sql
            );


        $stmt->execute([
            'email' =>
                $email,

            'id' =>
                $usuarioId
        ]);


        return (bool)
            $stmt->fetchColumn();
    }


    // ==================================================
    // PROFESSOR EXISTE E ESTÁ ATIVO?
    // ==================================================

    public function professorAtivoExiste(
        int $professorId
    ): bool {

        $sql = "
            SELECT id

            FROM professores

            WHERE id = :id
              AND ativo = 1

            LIMIT 1
        ";


        $stmt =
            $this->pdo->prepare(
                $sql
            );


        $stmt->execute([
            'id' =>
                $professorId
        ]);


        return (bool)
            $stmt->fetchColumn();
    }


    // ==================================================
    // PROFESSOR JÁ ESTÁ VINCULADO?
    // ==================================================

    public function professorJaVinculado(
        int $professorId,
        ?int $ignorarUsuarioId = null
    ): bool {

        if ($ignorarUsuarioId !== null) {

            $sql = "
                SELECT id

                FROM usuarios

                WHERE professor_id = :professor_id
                  AND id <> :usuario_id

                LIMIT 1
            ";


            $stmt =
                $this->pdo->prepare(
                    $sql
                );


            $stmt->execute([
                'professor_id' =>
                    $professorId,

                'usuario_id' =>
                    $ignorarUsuarioId
            ]);


            return (bool)
                $stmt->fetchColumn();
        }


        $sql = "
            SELECT id

            FROM usuarios

            WHERE professor_id = :professor_id

            LIMIT 1
        ";


        $stmt =
            $this->pdo->prepare(
                $sql
            );


        $stmt->execute([
            'professor_id' =>
                $professorId
        ]);


        return (bool)
            $stmt->fetchColumn();
    }


    // ==================================================
    // CRIAR
    // ==================================================

    public function criar(
        string $nome,
        string $email,
        string $senha,
        string $perfil,
        ?int $professorId
    ): int {

        $sql = "
            INSERT INTO usuarios (
                nome,
                email,
                senha,
                perfil,
                professor_id,
                ativo
            )
            VALUES (
                :nome,
                :email,
                :senha,
                :perfil,
                :professor_id,
                1
            )
        ";


        $stmt =
            $this->pdo->prepare(
                $sql
            );


        $stmt->execute([
            'nome' =>
                $nome,

            'email' =>
                $email,

            'senha' =>
                $senha,

            'perfil' =>
                $perfil,

            'professor_id' =>
                $professorId
        ]);


        return (int)
            $this
                ->pdo
                ->lastInsertId();
    }


    // ==================================================
    // ATUALIZAR
    // ==================================================

    public function atualizar(
        int $id,
        string $nome,
        string $email,
        ?string $senha,
        string $perfil,
        ?int $professorId,
        int $ativo
    ): void {

        // ----------------------------------------------
        // COM NOVA SENHA
        // ----------------------------------------------

        if (
            $senha !== null
            &&
            $senha !== ''
        ) {

            $sql = "
                UPDATE usuarios

                SET
                    nome = :nome,
                    email = :email,
                    senha = :senha,
                    perfil = :perfil,
                    professor_id = :professor_id,
                    ativo = :ativo

                WHERE id = :id
            ";


            $stmt =
                $this->pdo->prepare(
                    $sql
                );


            $stmt->execute([
                'nome' =>
                    $nome,

                'email' =>
                    $email,

                'senha' =>
                    $senha,

                'perfil' =>
                    $perfil,

                'professor_id' =>
                    $professorId,

                'ativo' =>
                    $ativo,

                'id' =>
                    $id
            ]);


            return;
        }


        // ----------------------------------------------
        // SEM ALTERAR A SENHA
        // ----------------------------------------------

        $sql = "
            UPDATE usuarios

            SET
                nome = :nome,
                email = :email,
                perfil = :perfil,
                professor_id = :professor_id,
                ativo = :ativo

            WHERE id = :id
        ";


        $stmt =
            $this->pdo->prepare(
                $sql
            );


        $stmt->execute([
            'nome' =>
                $nome,

            'email' =>
                $email,

            'perfil' =>
                $perfil,

            'professor_id' =>
                $professorId,

            'ativo' =>
                $ativo,

            'id' =>
                $id
        ]);
    }


    // ==================================================
    // DESATIVAR
    // ==================================================

    public function desativar(
        int $id
    ): void {

        $sql = "
            UPDATE usuarios

            SET ativo = 0

            WHERE id = :id
        ";


        $stmt =
            $this->pdo->prepare(
                $sql
            );


        $stmt->execute([
            'id' => $id
        ]);
    }


    // ==================================================
    // ÚLTIMO LOGIN
    // ==================================================

    public function atualizarUltimoLogin(
        int $usuarioId
    ): void {

        $sql = "
            UPDATE usuarios

            SET ultimo_login_em = NOW()

            WHERE id = :id
        ";


        $stmt =
            $this->pdo->prepare(
                $sql
            );


        $stmt->execute([
            'id' =>
                $usuarioId
        ]);
    }
}