<?php

namespace App\Repositories;

use App\Config\Database;

class TurmaRepository
{
    private Database $database;


    public function __construct(Database $database)
    {
        $this->database = $database;
    }


    // --------------------------------------------------
    // Lista todas as turmas
    // --------------------------------------------------

    public function listar(): array
    {
        $pdo = $this->database->connect();

        $sql = "
            SELECT
                t.id,
                t.nome,
                t.modalidade_id,
                m.nome AS modalidade_nome,
                m.ativo AS modalidade_ativa,
                t.professor_id,
                p.nome AS professor_nome,
                p.ativo AS professor_ativo,
                t.tipo,
                t.sala,
                t.ativo,
                t.criado_em,
                t.atualizado_em

            FROM turmas t

            INNER JOIN modalidades m
                ON m.id = t.modalidade_id

            INNER JOIN professores p
                ON p.id = t.professor_id

            ORDER BY t.nome
        ";

        $stmt = $pdo->query($sql);

        return $stmt->fetchAll();
    }


    // --------------------------------------------------
    // Busca uma turma pelo ID
    // --------------------------------------------------

    public function buscarPorId(int $id): ?array
    {
        $pdo = $this->database->connect();

        $sql = "
            SELECT
                t.id,
                t.nome,
                t.modalidade_id,
                m.nome AS modalidade_nome,
                m.ativo AS modalidade_ativa,
                t.professor_id,
                p.nome AS professor_nome,
                p.ativo AS professor_ativo,
                t.tipo,
                t.sala,
                t.ativo,
                t.criado_em,
                t.atualizado_em

            FROM turmas t

            INNER JOIN modalidades m
                ON m.id = t.modalidade_id

            INNER JOIN professores p
                ON p.id = t.professor_id

            WHERE t.id = :id

            LIMIT 1
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'id' => $id
        ]);

        $turma = $stmt->fetch();

        return $turma ?: null;
    }


    // --------------------------------------------------
    // Cria uma turma
    // --------------------------------------------------

    public function criar(
        string $nome,
        int $modalidadeId,
        int $professorId,
        string $tipo,
        ?string $sala
    ): int {

        $pdo = $this->database->connect();

        $sql = "
            INSERT INTO turmas
                (
                    nome,
                    modalidade_id,
                    professor_id,
                    tipo,
                    sala,
                    ativo
                )
            VALUES
                (
                    :nome,
                    :modalidade_id,
                    :professor_id,
                    :tipo,
                    :sala,
                    1
                )
        ";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            'nome' => $nome,
            'modalidade_id' => $modalidadeId,
            'professor_id' => $professorId,
            'tipo' => $tipo,
            'sala' => $sala
        ]);

        return (int) $pdo->lastInsertId();
    }


    // --------------------------------------------------
    // Atualiza uma turma
    // --------------------------------------------------

    public function atualizar(
        int $id,
        string $nome,
        int $modalidadeId,
        int $professorId,
        string $tipo,
        ?string $sala,
        int $ativo
    ): bool {

        $pdo = $this->database->connect();

        $sql = "
            UPDATE turmas
            SET
                nome = :nome,
                modalidade_id = :modalidade_id,
                professor_id = :professor_id,
                tipo = :tipo,
                sala = :sala,
                ativo = :ativo
            WHERE id = :id
        ";

        $stmt = $pdo->prepare($sql);

        return $stmt->execute([
            'nome' => $nome,
            'modalidade_id' => $modalidadeId,
            'professor_id' => $professorId,
            'tipo' => $tipo,
            'sala' => $sala,
            'ativo' => $ativo,
            'id' => $id
        ]);
    }


    // --------------------------------------------------
    // Desativa uma turma
    // --------------------------------------------------

    public function desativar(int $id): bool
    {
        $pdo = $this->database->connect();

        $sql = "
            UPDATE turmas
            SET ativo = 0
            WHERE id = :id
        ";

        $stmt = $pdo->prepare($sql);

        return $stmt->execute([
            'id' => $id
        ]);
    }
}