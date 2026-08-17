<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;
use PDOException;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;


class AulaExclusaoController
{
    private Database $database;


    public function __construct(
        Database $database
    ) {
        $this->database = $database;
    }


    // ==================================================
    // EXCLUSÃO DEFINITIVA DE AULA CRIADA POR ENGANO
    //
    // Regras de segurança:
    // 1. A aula precisa existir.
    // 2. Somente aulas AGENDADAS ou CANCELADAS podem
    //    ser excluídas definitivamente.
    // 3. A aula nunca pode ter sido aberta/encerrada.
    // 4. Não pode existir snapshot em aula_alunos.
    // 5. Não pode existir qualquer presença vinculada.
    // 6. Tudo acontece dentro de uma transação.
    //
    // Dessa forma, aulas que já viraram histórico de
    // atendimento permanecem preservadas.
    // ==================================================

    public function excluirDefinitivamente(
        Request $request,
        Response $response,
        array $args
    ): Response {

        $aulaId =
            isset($args['id'])
                ? (int) $args['id']
                : 0;


        if ($aulaId <= 0) {

            return $this->json(
                $response,
                [
                    'mensagem' =>
                        'Identificador da aula inválido.'
                ],
                400
            );
        }


        $pdo =
            $this->database->connect();


        try {

            $pdo->beginTransaction();


            // ------------------------------------------
            // Bloqueia a aula durante a validação.
            // ------------------------------------------

            $stmtAula =
                $pdo->prepare(
                    "
                    SELECT
                        a.id,
                        a.turma_id,
                        a.horario_id,
                        a.data_aula,
                        a.hora_inicio,
                        a.hora_fim,
                        a.status,
                        a.aberta_em,
                        a.encerrada_em,
                        t.nome AS turma_nome
                    FROM aulas a
                    INNER JOIN turmas t
                        ON t.id = a.turma_id
                    WHERE a.id = :id
                    LIMIT 1
                    FOR UPDATE
                    "
                );


            $stmtAula->execute([
                'id' => $aulaId
            ]);


            $aula =
                $stmtAula->fetch(
                    PDO::FETCH_ASSOC
                );


            if (!$aula) {

                $pdo->rollBack();

                return $this->json(
                    $response,
                    [
                        'mensagem' =>
                            'Aula não encontrada.'
                    ],
                    404
                );
            }


            // ------------------------------------------
            // Aula aberta ou encerrada já faz parte do
            // histórico e nunca deve ser apagada.
            // ------------------------------------------

            if (
                !in_array(
                    $aula['status'],
                    [
                        'agendada',
                        'cancelada'
                    ],
                    true
                )
            ) {

                $pdo->rollBack();

                return $this->json(
                    $response,
                    [
                        'mensagem' =>
                            'Somente aulas agendadas ou canceladas, sem histórico de atendimento, podem ser excluídas definitivamente.'
                    ],
                    409
                );
            }


            // ------------------------------------------
            // Mesmo que o status tenha sido alterado,
            // timestamps de abertura/encerramento indicam
            // que a aula já foi utilizada.
            // ------------------------------------------

            if (
                $aula['aberta_em'] !== null
                ||
                $aula['encerrada_em'] !== null
            ) {

                $pdo->rollBack();

                return $this->json(
                    $response,
                    [
                        'mensagem' =>
                            'Esta aula já foi utilizada e não pode ser excluída definitivamente. Cancele ou mantenha o registro para preservar o histórico.'
                    ],
                    409
                );
            }


            // ------------------------------------------
            // Snapshot de alunos significa que a aula já
            // foi aberta/preparada em algum momento.
            // ------------------------------------------

            $stmtSnapshots =
                $pdo->prepare(
                    "
                    SELECT COUNT(*)
                    FROM aula_alunos
                    WHERE aula_id = :aula_id
                    "
                );


            $stmtSnapshots->execute([
                'aula_id' => $aulaId
            ]);


            $totalSnapshots =
                (int) $stmtSnapshots->fetchColumn();


            if ($totalSnapshots > 0) {

                $pdo->rollBack();

                return $this->json(
                    $response,
                    [
                        'mensagem' =>
                            'Esta aula já possui alunos preparados para presença e não pode ser excluída definitivamente. Mantenha o registro para preservar o histórico.',

                        'total_alunos_snapshot' =>
                            $totalSnapshots
                    ],
                    409
                );
            }


            // ------------------------------------------
            // Verificação adicional de presenças.
            // Na estrutura atual, presença depende de
            // aula_alunos, mas mantemos esta checagem
            // explícita como proteção de integridade.
            // ------------------------------------------

            $stmtPresencas =
                $pdo->prepare(
                    "
                    SELECT COUNT(*)
                    FROM presencas p
                    INNER JOIN aula_alunos aa
                        ON aa.id = p.aula_aluno_id
                    WHERE aa.aula_id = :aula_id
                    "
                );


            $stmtPresencas->execute([
                'aula_id' => $aulaId
            ]);


            $totalPresencas =
                (int) $stmtPresencas->fetchColumn();


            if ($totalPresencas > 0) {

                $pdo->rollBack();

                return $this->json(
                    $response,
                    [
                        'mensagem' =>
                            'Esta aula possui registros de presença e não pode ser excluída definitivamente.',

                        'total_presencas' =>
                            $totalPresencas
                    ],
                    409
                );
            }


            // ------------------------------------------
            // Exclusão física da aula.
            // ------------------------------------------

            $stmtExcluir =
                $pdo->prepare(
                    "
                    DELETE FROM aulas
                    WHERE id = :id
                    "
                );


            $stmtExcluir->execute([
                'id' => $aulaId
            ]);


            if (
                $stmtExcluir->rowCount() !== 1
            ) {

                throw new PDOException(
                    'A aula não pôde ser excluída.'
                );
            }


            $pdo->commit();


            return $this->json(
                $response,
                [
                    'mensagem' =>
                        'Aula excluída definitivamente com sucesso.',

                    'aula' => [
                        'id' =>
                            $aulaId,

                        'turma_nome' =>
                            $aula['turma_nome'],

                        'data_aula' =>
                            $aula['data_aula'],

                        'hora_inicio' =>
                            $aula['hora_inicio'],

                        'gerada_automaticamente' =>
                            $aula['horario_id'] !== null
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
                            'A aula possui registros relacionados e não pode ser excluída definitivamente.'
                    ],
                    409
                );
            }


            return $this->json(
                $response,
                [
                    'mensagem' =>
                        'Não foi possível excluir definitivamente a aula.'
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
