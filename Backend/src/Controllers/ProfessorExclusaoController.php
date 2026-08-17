<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;
use PDOException;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;


class ProfessorExclusaoController
{
    private Database $database;


    public function __construct(
        Database $database
    ) {
        $this->database = $database;
    }


    // ==================================================
    // EXCLUSÃO DEFINITIVA DE PROFESSOR SEM HISTÓRICO
    //
    // Regras:
    // 1. O professor precisa existir.
    // 2. O professor precisa estar inativo.
    // 3. Não pode possuir nenhuma turma vinculada.
    // 4. Não pode possuir nenhuma aula vinculada.
    // 5. Não pode possuir usuário de acesso vinculado.
    // 6. Tudo acontece dentro de uma transação.
    // ==================================================

    public function excluirDefinitivamente(
        Request $request,
        Response $response,
        array $args
    ): Response {

        $professorId =
            isset($args['id'])
                ? (int) $args['id']
                : 0;


        if ($professorId <= 0) {

            return $this->json(
                $response,
                [
                    'mensagem' =>
                        'Identificador do professor inválido.'
                ],
                400
            );
        }


        $pdo =
            $this->database->connect();


        try {

            $pdo->beginTransaction();


            // ------------------------------------------
            // Bloqueia o professor durante a validação.
            // ------------------------------------------

            $stmtProfessor =
                $pdo->prepare(
                    "
                    SELECT
                        id,
                        nome,
                        ativo
                    FROM professores
                    WHERE id = :id
                    LIMIT 1
                    FOR UPDATE
                    "
                );


            $stmtProfessor->execute([
                'id' => $professorId
            ]);


            $professor =
                $stmtProfessor->fetch(
                    PDO::FETCH_ASSOC
                );


            if (!$professor) {

                $pdo->rollBack();

                return $this->json(
                    $response,
                    [
                        'mensagem' =>
                            'Professor não encontrado.'
                    ],
                    404
                );
            }


            // ------------------------------------------
            // Primeiro precisa estar inativo.
            // ------------------------------------------

            if (
                (int) $professor['ativo'] === 1
            ) {

                $pdo->rollBack();

                return $this->json(
                    $response,
                    [
                        'mensagem' =>
                            'O professor precisa estar inativo antes de ser excluído definitivamente.'
                    ],
                    409
                );
            }


            // ------------------------------------------
            // Qualquer turma vinculada é considerada
            // parte do histórico do professor.
            // ------------------------------------------

            $stmtTurmas =
                $pdo->prepare(
                    "
                    SELECT COUNT(*)
                    FROM turmas
                    WHERE professor_id = :professor_id
                    "
                );


            $stmtTurmas->execute([
                'professor_id' => $professorId
            ]);


            $totalTurmas =
                (int) $stmtTurmas->fetchColumn();


            if ($totalTurmas > 0) {

                $pdo->rollBack();

                return $this->json(
                    $response,
                    [
                        'mensagem' =>
                            'Este professor não pode ser excluído definitivamente porque possui turmas vinculadas. Mantenha-o como inativo para preservar o histórico.',

                        'total_turmas' =>
                            $totalTurmas
                    ],
                    409
                );
            }


            // ------------------------------------------
            // Aulas também bloqueiam a exclusão, mesmo se
            // a turma relacionada já tiver sido alterada.
            // ------------------------------------------

            $stmtAulas =
                $pdo->prepare(
                    "
                    SELECT COUNT(*)
                    FROM aulas
                    WHERE professor_id = :professor_id
                    "
                );


            $stmtAulas->execute([
                'professor_id' => $professorId
            ]);


            $totalAulas =
                (int) $stmtAulas->fetchColumn();


            if ($totalAulas > 0) {

                $pdo->rollBack();

                return $this->json(
                    $response,
                    [
                        'mensagem' =>
                            'Este professor não pode ser excluído definitivamente porque possui histórico de aulas. Mantenha-o como inativo para preservar os registros.',

                        'total_aulas' =>
                            $totalAulas
                    ],
                    409
                );
            }


            // ------------------------------------------
            // Um usuário do perfil professor depende do
            // vínculo professor_id para autenticação e
            // isolamento das aulas. Não o deixamos órfão.
            // ------------------------------------------

            $stmtUsuarios =
                $pdo->prepare(
                    "
                    SELECT COUNT(*)
                    FROM usuarios
                    WHERE professor_id = :professor_id
                    "
                );


            $stmtUsuarios->execute([
                'professor_id' => $professorId
            ]);


            $totalUsuarios =
                (int) $stmtUsuarios->fetchColumn();


            if ($totalUsuarios > 0) {

                $pdo->rollBack();

                return $this->json(
                    $response,
                    [
                        'mensagem' =>
                            'Este professor possui um usuário de acesso vinculado. Desvincule ou ajuste esse usuário antes da exclusão definitiva.',

                        'total_usuarios' =>
                            $totalUsuarios
                    ],
                    409
                );
            }


            // ------------------------------------------
            // Exclusão física do professor.
            // ------------------------------------------

            $stmtExcluirProfessor =
                $pdo->prepare(
                    "
                    DELETE FROM professores
                    WHERE id = :id
                    "
                );


            $stmtExcluirProfessor->execute([
                'id' => $professorId
            ]);


            if (
                $stmtExcluirProfessor->rowCount() !== 1
            ) {

                throw new PDOException(
                    'O professor não pôde ser excluído.'
                );
            }


            $pdo->commit();


            return $this->json(
                $response,
                [
                    'mensagem' =>
                        'Professor excluído definitivamente com sucesso.',

                    'professor' => [
                        'id' =>
                            $professorId,

                        'nome' =>
                            $professor['nome']
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


            if (
                $erro instanceof PDOException
                &&
                $erro->getCode() === '23000'
            ) {

                return $this->json(
                    $response,
                    [
                        'mensagem' =>
                            'O professor possui registros relacionados e não pode ser excluído definitivamente.'
                    ],
                    409
                );
            }


            return $this->json(
                $response,
                [
                    'mensagem' =>
                        'Não foi possível excluir definitivamente o professor.'
                ],
                500
            );
        }
    }


    // ==================================================
    // JSON
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
