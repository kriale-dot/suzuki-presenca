<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;
use PDOException;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;


class TurmaExclusaoController
{
    private Database $database;


    public function __construct(
        Database $database
    ) {
        $this->database = $database;
    }


    // ==================================================
    // EXCLUSÃO DEFINITIVA DE TURMA INATIVA
    //
    // Regras:
    // 1. A turma precisa existir.
    // 2. A turma precisa estar inativa.
    // 3. A turma não pode possuir nenhuma aula.
    // 4. Matrículas e horários sem histórico de aula são
    //    removidos junto com a turma.
    // 5. Tudo acontece dentro de uma transação.
    // ==================================================

    public function excluirDefinitivamente(
        Request $request,
        Response $response,
        array $args
    ): Response {

        $turmaId =
            isset($args['id'])
                ? (int) $args['id']
                : 0;


        if ($turmaId <= 0) {

            return $this->json(
                $response,
                [
                    'mensagem' =>
                        'Identificador da turma inválido.'
                ],
                400
            );
        }


        $pdo =
            $this->database->connect();


        try {

            $pdo->beginTransaction();


            // ------------------------------------------
            // Bloqueia a linha da turma durante a operação.
            // ------------------------------------------

            $stmtTurma =
                $pdo->prepare(
                    "
                    SELECT
                        id,
                        nome,
                        ativo
                    FROM turmas
                    WHERE id = :id
                    LIMIT 1
                    FOR UPDATE
                    "
                );


            $stmtTurma->execute([
                'id' => $turmaId
            ]);


            $turma =
                $stmtTurma->fetch(
                    PDO::FETCH_ASSOC
                );


            if (!$turma) {

                $pdo->rollBack();

                return $this->json(
                    $response,
                    [
                        'mensagem' =>
                            'Turma não encontrada.'
                    ],
                    404
                );
            }


            // ------------------------------------------
            // Nunca permite excluir uma turma ativa.
            // ------------------------------------------

            if (
                (int) $turma['ativo'] === 1
            ) {

                $pdo->rollBack();

                return $this->json(
                    $response,
                    [
                        'mensagem' =>
                            'A turma precisa estar inativa antes de ser excluída definitivamente.'
                    ],
                    409
                );
            }


            // ------------------------------------------
            // Histórico de aula bloqueia a exclusão.
            //
            // Isso preserva também os snapshots e as
            // presenças vinculadas às aulas.
            // ------------------------------------------

            $stmtAulas =
                $pdo->prepare(
                    "
                    SELECT COUNT(*)
                    FROM aulas
                    WHERE turma_id = :turma_id
                    "
                );


            $stmtAulas->execute([
                'turma_id' => $turmaId
            ]);


            $totalAulas =
                (int) $stmtAulas->fetchColumn();


            if ($totalAulas > 0) {

                $pdo->rollBack();

                return $this->json(
                    $response,
                    [
                        'mensagem' =>
                            'Esta turma não pode ser excluída definitivamente porque possui histórico de aulas. Mantenha-a como inativa para preservar os registros.',

                        'total_aulas' =>
                            $totalAulas
                    ],
                    409
                );
            }


            // ------------------------------------------
            // Quantidades apenas para informar o resultado.
            // ------------------------------------------

            $stmtMatriculas =
                $pdo->prepare(
                    "
                    SELECT COUNT(*)
                    FROM turma_alunos
                    WHERE turma_id = :turma_id
                    "
                );


            $stmtMatriculas->execute([
                'turma_id' => $turmaId
            ]);


            $totalMatriculas =
                (int) $stmtMatriculas->fetchColumn();


            $stmtHorarios =
                $pdo->prepare(
                    "
                    SELECT COUNT(*)
                    FROM horarios
                    WHERE turma_id = :turma_id
                    "
                );


            $stmtHorarios->execute([
                'turma_id' => $turmaId
            ]);


            $totalHorarios =
                (int) $stmtHorarios->fetchColumn();


            // ------------------------------------------
            // Remove vínculos sem histórico.
            //
            // As FKs atuais também possuem CASCADE, mas
            // fazemos explicitamente para deixar a regra
            // de negócio clara e previsível.
            // ------------------------------------------

            $stmtExcluirMatriculas =
                $pdo->prepare(
                    "
                    DELETE FROM turma_alunos
                    WHERE turma_id = :turma_id
                    "
                );


            $stmtExcluirMatriculas->execute([
                'turma_id' => $turmaId
            ]);


            $stmtExcluirHorarios =
                $pdo->prepare(
                    "
                    DELETE FROM horarios
                    WHERE turma_id = :turma_id
                    "
                );


            $stmtExcluirHorarios->execute([
                'turma_id' => $turmaId
            ]);


            // ------------------------------------------
            // Exclui a turma.
            // ------------------------------------------

            $stmtExcluirTurma =
                $pdo->prepare(
                    "
                    DELETE FROM turmas
                    WHERE id = :id
                    "
                );


            $stmtExcluirTurma->execute([
                'id' => $turmaId
            ]);


            if (
                $stmtExcluirTurma->rowCount() !== 1
            ) {

                throw new PDOException(
                    'A turma não pôde ser excluída.'
                );
            }


            $pdo->commit();


            return $this->json(
                $response,
                [
                    'mensagem' =>
                        'Turma excluída definitivamente com sucesso.',

                    'turma' => [
                        'id' =>
                            $turmaId,

                        'nome' =>
                            $turma['nome']
                    ],

                    'removidos' => [
                        'matriculas' =>
                            $totalMatriculas,

                        'horarios' =>
                            $totalHorarios
                    ]
                ],
                200
            );

        } catch (Throwable $erro) {

            if (
                $pdo->inTransaction()
            ) {

                $pdo->rollBack();
            }


            // ------------------------------------------
            // Se alguma FK impedir a exclusão por causa
            // de vínculo criado simultaneamente, tratamos
            // como conflito e preservamos os dados.
            // ------------------------------------------

            if (
                $erro instanceof PDOException
                &&
                $erro->getCode() === '23000'
            ) {

                return $this->json(
                    $response,
                    [
                        'mensagem' =>
                            'A turma possui registros relacionados e não pode ser excluída definitivamente.'
                    ],
                    409
                );
            }


            return $this->json(
                $response,
                [
                    'mensagem' =>
                        'Não foi possível excluir definitivamente a turma.'
                ],
                500
            );
        }
    }


    // ==================================================
    // RESPOSTA JSON
    // ==================================================

    private function json(
        Response $response,
        array $dados,
        int $status
    ): Response {

        $response
            ->getBody()
            ->write(
                json_encode(
                    $dados,
                    JSON_UNESCAPED_UNICODE
                    |
                    JSON_PRETTY_PRINT
                )
            );


        return $response
            ->withHeader(
                'Content-Type',
                'application/json'
            )
            ->withStatus(
                $status
            );
    }
}
