<?php

namespace App\Controllers;

use App\Config\Database;
use PDO;
use PDOException;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;


class AlunoExclusaoController
{
    private Database $database;


    public function __construct(
        Database $database
    ) {
        $this->database = $database;
    }


    // ==================================================
    // EXCLUSÃO DEFINITIVA DE ALUNO INATIVO SEM HISTÓRICO REAL
    //
    // Regras:
    // 1. O aluno precisa existir.
    // 2. O aluno precisa estar inativo.
    // 3. O simples snapshot em aula_alunos NÃO bloqueia a exclusão.
    // 4. Ausência automática gerada no encerramento da aula NÃO
    //    bloqueia a exclusão e é removida junto com o cadastro.
    // 5. Qualquer outro registro em presencas bloqueia a exclusão.
    // 6. Snapshots, matrículas e vínculos com responsáveis são
    //    removidos junto com o cadastro.
    // 7. A foto local é removida somente depois do COMMIT.
    // 8. Toda a operação de banco ocorre em transação.
    // ==================================================

    public function excluirDefinitivamente(
        Request $request,
        Response $response,
        array $args
    ): Response {

        $alunoId =
            isset($args['id'])
                ? (int) $args['id']
                : 0;


        if ($alunoId <= 0) {

            return $this->json(
                $response,
                [
                    'mensagem' =>
                        'Identificador do aluno inválido.'
                ],
                400
            );
        }


        $pdo =
            $this->database->connect();


        try {

            $pdo->beginTransaction();


            // ------------------------------------------
            // Bloqueia o cadastro do aluno durante toda
            // a validação e exclusão.
            // ------------------------------------------

            $stmtAluno =
                $pdo->prepare(
                    "
                    SELECT
                        id,
                        nome,
                        foto_url,
                        ativo
                    FROM alunos
                    WHERE id = :id
                    LIMIT 1
                    FOR UPDATE
                    "
                );


            $stmtAluno->execute([
                'id' => $alunoId
            ]);


            $aluno =
                $stmtAluno->fetch(
                    PDO::FETCH_ASSOC
                );


            if (!$aluno) {

                $pdo->rollBack();

                return $this->json(
                    $response,
                    [
                        'mensagem' =>
                            'Aluno não encontrado.'
                    ],
                    404
                );
            }


            // ------------------------------------------
            // Primeiro o aluno precisa estar inativo.
            // ------------------------------------------

            if (
                (int) $aluno['ativo'] === 1
            ) {

                $pdo->rollBack();

                return $this->json(
                    $response,
                    [
                        'mensagem' =>
                            'O aluno precisa estar inativo antes de ser excluído definitivamente.'
                    ],
                    409
                );
            }


            // ------------------------------------------
            // Bloqueia os snapshots desse aluno.
            //
            // A existência do snapshot, por si só, não
            // representa histórico real de presença.
            // Ele pode ter sido criado automaticamente
            // quando uma aula foi aberta.
            // ------------------------------------------

            $stmtSnapshots =
                $pdo->prepare(
                    "
                    SELECT id
                    FROM aula_alunos
                    WHERE aluno_id = :aluno_id
                    FOR UPDATE
                    "
                );


            $stmtSnapshots->execute([
                'aluno_id' => $alunoId
            ]);


            $snapshotIds =
                $stmtSnapshots->fetchAll(
                    PDO::FETCH_COLUMN
                );


            $totalSnapshots =
                count($snapshotIds);


            // ------------------------------------------
            // HISTÓRICO REAL
            //
            // A ausência gerada automaticamente quando a aula
            // é encerrada não representa participação real do
            // aluno. Ela é identificada pela combinação abaixo:
            //
            // situacao   = ausente
            // origem     = professor
            // observacao = Ausência registrada no encerramento da aula.
            //
            // Qualquer outro registro em presencas impede a
            // exclusão definitiva.
            // ------------------------------------------

            $stmtPresencasReais =
                $pdo->prepare(
                    "
                    SELECT COUNT(*)
                    FROM presencas p
                    INNER JOIN aula_alunos aa
                        ON aa.id = p.aula_aluno_id
                    WHERE aa.aluno_id = :aluno_id
                      AND NOT (
                            p.situacao = 'ausente'
                        AND p.origem = 'professor'
                        AND p.observacao = 'Ausência registrada no encerramento da aula.'
                      )
                    "
                );


            $stmtPresencasReais->execute([
                'aluno_id' => $alunoId
            ]);


            $totalPresencasReais =
                (int) $stmtPresencasReais->fetchColumn();


            if ($totalPresencasReais > 0) {

                $pdo->rollBack();

                return $this->json(
                    $response,
                    [
                        'mensagem' =>
                            'Este aluno possui histórico real de presença e não pode ser excluído definitivamente. Mantenha-o como inativo para preservar os registros.',

                        'total_presencas_reais' =>
                            $totalPresencasReais
                    ],
                    409
                );
            }


            // ------------------------------------------
            // AUSÊNCIAS AUTOMÁTICAS
            //
            // Como já confirmamos que não há histórico real,
            // podemos remover as ausências geradas automaticamente
            // no encerramento das aulas antes de apagar os snapshots.
            // ------------------------------------------

            $stmtContarAusenciasAutomaticas =
                $pdo->prepare(
                    "
                    SELECT COUNT(*)
                    FROM presencas p
                    INNER JOIN aula_alunos aa
                        ON aa.id = p.aula_aluno_id
                    WHERE aa.aluno_id = :aluno_id
                      AND p.situacao = 'ausente'
                      AND p.origem = 'professor'
                      AND p.observacao = 'Ausência registrada no encerramento da aula.'
                    "
                );


            $stmtContarAusenciasAutomaticas->execute([
                'aluno_id' => $alunoId
            ]);


            $totalAusenciasAutomaticas =
                (int) $stmtContarAusenciasAutomaticas->fetchColumn();


            $stmtExcluirAusenciasAutomaticas =
                $pdo->prepare(
                    "
                    DELETE p
                    FROM presencas p
                    INNER JOIN aula_alunos aa
                        ON aa.id = p.aula_aluno_id
                    WHERE aa.aluno_id = :aluno_id
                      AND p.situacao = 'ausente'
                      AND p.origem = 'professor'
                      AND p.observacao = 'Ausência registrada no encerramento da aula.'
                    "
                );


            $stmtExcluirAusenciasAutomaticas->execute([
                'aluno_id' => $alunoId
            ]);


            // ------------------------------------------
            // Quantidades apenas para retorno informativo.
            // ------------------------------------------

            $stmtMatriculas =
                $pdo->prepare(
                    "
                    SELECT COUNT(*)
                    FROM turma_alunos
                    WHERE aluno_id = :aluno_id
                    "
                );


            $stmtMatriculas->execute([
                'aluno_id' => $alunoId
            ]);


            $totalMatriculas =
                (int) $stmtMatriculas->fetchColumn();


            $stmtResponsaveis =
                $pdo->prepare(
                    "
                    SELECT COUNT(*)
                    FROM aluno_responsavel
                    WHERE aluno_id = :aluno_id
                    "
                );


            $stmtResponsaveis->execute([
                'aluno_id' => $alunoId
            ]);


            $totalResponsaveis =
                (int) $stmtResponsaveis->fetchColumn();


            // ------------------------------------------
            // Remove snapshots automáticos sem presença.
            //
            // Isso é necessário porque aula_alunos possui
            // chave estrangeira para alunos sem ON DELETE
            // CASCADE.
            // ------------------------------------------

            $stmtExcluirSnapshots =
                $pdo->prepare(
                    "
                    DELETE FROM aula_alunos
                    WHERE aluno_id = :aluno_id
                    "
                );


            $stmtExcluirSnapshots->execute([
                'aluno_id' => $alunoId
            ]);


            // ------------------------------------------
            // Remove matrículas.
            // ------------------------------------------

            $stmtExcluirMatriculas =
                $pdo->prepare(
                    "
                    DELETE FROM turma_alunos
                    WHERE aluno_id = :aluno_id
                    "
                );


            $stmtExcluirMatriculas->execute([
                'aluno_id' => $alunoId
            ]);


            // ------------------------------------------
            // Remove apenas o vínculo com responsáveis.
            // O cadastro do responsável é preservado.
            // ------------------------------------------

            $stmtExcluirResponsaveis =
                $pdo->prepare(
                    "
                    DELETE FROM aluno_responsavel
                    WHERE aluno_id = :aluno_id
                    "
                );


            $stmtExcluirResponsaveis->execute([
                'aluno_id' => $alunoId
            ]);


            // ------------------------------------------
            // Exclui fisicamente o aluno.
            // ------------------------------------------

            $stmtExcluirAluno =
                $pdo->prepare(
                    "
                    DELETE FROM alunos
                    WHERE id = :id
                    "
                );


            $stmtExcluirAluno->execute([
                'id' => $alunoId
            ]);


            if (
                $stmtExcluirAluno->rowCount() !== 1
            ) {

                throw new PDOException(
                    'O aluno não pôde ser excluído.'
                );
            }


            $pdo->commit();


            // ------------------------------------------
            // A foto não faz parte da transação SQL.
            // Somente depois do COMMIT removemos o arquivo
            // físico, evitando perda da foto caso o banco
            // precise fazer rollback.
            // ------------------------------------------

            $this->removerArquivoFotoLocal(
                $aluno['foto_url'] ?? null
            );


            return $this->json(
                $response,
                [
                    'mensagem' =>
                        'Aluno excluído definitivamente com sucesso.',

                    'aluno' => [
                        'id' =>
                            $alunoId,

                        'nome' =>
                            $aluno['nome']
                    ],

                    'removidos' => [
                        'ausencias_automaticas' =>
                            $totalAusenciasAutomaticas,

                        'snapshots' =>
                            $totalSnapshots,

                        'matriculas' =>
                            $totalMatriculas,

                        'vinculos_responsaveis' =>
                            $totalResponsaveis
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
                            'O aluno possui registros relacionados que impedem a exclusão definitiva.'
                    ],
                    409
                );
            }


            return $this->json(
                $response,
                [
                    'mensagem' =>
                        'Não foi possível excluir definitivamente o aluno.'
                ],
                500
            );
        }
    }


    // ==================================================
    // REMOVE FOTO LOCAL
    // ==================================================

    private function removerArquivoFotoLocal(
        ?string $fotoUrl
    ): void {

        if (!$fotoUrl) {
            return;
        }


        $caminho =
            parse_url(
                $fotoUrl,
                PHP_URL_PATH
            );


        if (
            !is_string($caminho)
            ||
            !str_contains(
                $caminho,
                '/uploads/alunos/'
            )
        ) {
            return;
        }


        $nomeArquivo =
            basename($caminho);


        if ($nomeArquivo === '') {
            return;
        }


        $arquivo =
            dirname(__DIR__, 2)
            . DIRECTORY_SEPARATOR
            . 'public'
            . DIRECTORY_SEPARATOR
            . 'uploads'
            . DIRECTORY_SEPARATOR
            . 'alunos'
            . DIRECTORY_SEPARATOR
            . $nomeArquivo;


        if (is_file($arquivo)) {
            @unlink($arquivo);
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
