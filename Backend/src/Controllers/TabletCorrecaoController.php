<?php

namespace App\Controllers;

use App\Config\Database;
use App\Config\Env;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use RuntimeException;
use Throwable;

class TabletCorrecaoController
{
    private Database $database;


    public function __construct(
        Database $database
    ) {

        $this->database =
            $database;
    }


    // ==================================================
    // RESPOSTA JSON
    // ==================================================

    private function json(
        Response $response,
        array $dados,
        int $status = 200
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


    // ==================================================
    // DESFAZER PRESENÇA MARCADA POR ENGANO NO TABLET
    //
    // Regras de segurança:
    // - a aula precisa estar aberta;
    // - o dispositivo precisa estar ativo;
    // - o aluno precisa pertencer ao snapshot da aula;
    // - somente situacao=presente e origem=aluno;
    // - quando dispositivo_id está preenchido, somente o
    //   mesmo tablet pode desfazer;
    // - correções feitas por professor/secretaria nunca
    //   são apagadas por esta operação.
    // ==================================================

    public function desfazer(
        Request $request,
        Response $response,
        array $args
    ): Response {

        $identificador =
            trim(
                (string) (
                    $args['identificador']
                    ??
                    ''
                )
            );


        $aulaId =
            (int) (
                $args['aulaId']
                ??
                0
            );


        $body =
            (array) (
                $request->getParsedBody()
                ??
                []
            );


        $aulaAlunoId =
            (int) (
                $body['aula_aluno_id']
                ??
                0
            );


        if (
            $identificador === ''
            ||
            $aulaId <= 0
            ||
            $aulaAlunoId <= 0
        ) {

            return $this->json(
                $response,
                [
                    'mensagem' =>
                        'Dados inválidos para desfazer a presença.'
                ],
                422
            );
        }


        $pdo =
            null;


        try {

            $pdo =
                $this
                    ->database
                    ->connect();


            $pdo->beginTransaction();


            // =========================================
            // DISPOSITIVO
            // =========================================

            $stmtDispositivo =
                $pdo->prepare(
                    'SELECT id, nome, ativo
                     FROM dispositivos
                     WHERE identificador = :identificador
                     LIMIT 1
                     FOR UPDATE'
                );


            $stmtDispositivo->execute([
                'identificador' =>
                    $identificador
            ]);


            $dispositivo =
                $stmtDispositivo->fetch();


            if (
                !$dispositivo
                ||
                (int) $dispositivo['ativo'] !== 1
            ) {

                $pdo->rollBack();


                return $this->json(
                    $response,
                    [
                        'mensagem' =>
                            'Este tablet não está autorizado.'
                    ],
                    403
                );
            }


            // =========================================
            // AULA
            // =========================================

            $stmtAula =
                $pdo->prepare(
                    'SELECT id, status
                     FROM aulas
                     WHERE id = :aula_id
                     LIMIT 1
                     FOR UPDATE'
                );


            $stmtAula->execute([
                'aula_id' =>
                    $aulaId
            ]);


            $aula =
                $stmtAula->fetch();


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


            if (
                $aula['status'] !== 'aberta'
            ) {

                $pdo->rollBack();


                return $this->json(
                    $response,
                    [
                        'mensagem' =>
                            'Esta aula não está aberta para correção pelo tablet.'
                    ],
                    409
                );
            }


            // =========================================
            // ALUNO DO SNAPSHOT DA AULA
            // =========================================

            $stmtAluno =
                $pdo->prepare(
                    'SELECT
                        aa.id AS aula_aluno_id,
                        al.nome AS aluno_nome
                     FROM aula_alunos aa
                     INNER JOIN alunos al
                        ON al.id = aa.aluno_id
                     WHERE aa.id = :aula_aluno_id
                       AND aa.aula_id = :aula_id
                     LIMIT 1'
                );


            $stmtAluno->execute([
                'aula_aluno_id' =>
                    $aulaAlunoId,

                'aula_id' =>
                    $aulaId
            ]);


            $aluno =
                $stmtAluno->fetch();


            if (!$aluno) {

                $pdo->rollBack();


                return $this->json(
                    $response,
                    [
                        'mensagem' =>
                            'Aluno não encontrado nesta aula.'
                    ],
                    404
                );
            }


            // =========================================
            // PRESENÇA ATUAL
            // =========================================

            $stmtPresenca =
                $pdo->prepare(
                    'SELECT
                        id,
                        situacao,
                        origem,
                        dispositivo_id
                     FROM presencas
                     WHERE aula_aluno_id = :aula_aluno_id
                     LIMIT 1
                     FOR UPDATE'
                );


            $stmtPresenca->execute([
                'aula_aluno_id' =>
                    $aulaAlunoId
            ]);


            $presenca =
                $stmtPresenca->fetch();


            // -----------------------------------------
            // Idempotência:
            // se outra requisição já desmarcou, não
            // tratamos como erro.
            // -----------------------------------------

            if (!$presenca) {

                $this->registrarAcessoDispositivo(
                    $pdo,
                    (int) $dispositivo['id']
                );


                $pdo->commit();


                return $this->json(
                    $response,
                    [
                        'mensagem' =>
                            'A presença já estava desmarcada.',

                        'aluno' => [
                            'nome' =>
                                $aluno['aluno_nome']
                        ]
                    ]
                );
            }


            // =========================================
            // NÃO APAGA CORREÇÕES DO PROFESSOR
            // OU DA SECRETARIA
            // =========================================

            if (
                $presenca['situacao'] !== 'presente'
                ||
                $presenca['origem'] !== 'aluno'
            ) {

                $pdo->rollBack();


                return $this->json(
                    $response,
                    [
                        'mensagem' =>
                            'Este registro foi alterado pelo professor ou pela secretaria. Peça ajuda para corrigi-lo.'
                    ],
                    409
                );
            }


            // =========================================
            // MESMO TABLET
            // =========================================

            if (
                $presenca['dispositivo_id'] !== null
                &&
                (int) $presenca['dispositivo_id']
                !==
                (int) $dispositivo['id']
            ) {

                $pdo->rollBack();


                return $this->json(
                    $response,
                    [
                        'mensagem' =>
                            'Esta presença foi registrada em outro dispositivo. Peça ajuda ao professor.'
                    ],
                    409
                );
            }


            // =========================================
            // EXCLUI O REGISTRO
            // =========================================

            $stmtExcluir =
                $pdo->prepare(
                    'DELETE FROM presencas
                     WHERE id = :id
                       AND situacao = :situacao
                       AND origem = :origem'
                );


            $stmtExcluir->execute([
                'id' =>
                    (int) $presenca['id'],

                'situacao' =>
                    'presente',

                'origem' =>
                    'aluno'
            ]);


            if (
                $stmtExcluir->rowCount() !== 1
            ) {

                throw new RuntimeException(
                    'Não foi possível remover a presença.'
                );
            }


            $this->registrarAcessoDispositivo(
                $pdo,
                (int) $dispositivo['id']
            );


            $pdo->commit();


            return $this->json(
                $response,
                [
                    'mensagem' =>
                        'Marcação desfeita. Agora o aluno correto pode tocar na própria foto.',

                    'aluno' => [
                        'nome' =>
                            $aluno['aluno_nome']
                    ]
                ]
            );

        } catch (Throwable $erro) {

            if (
                $pdo
                &&
                $pdo->inTransaction()
            ) {

                $pdo->rollBack();
            }


            $dadosErro = [
                'mensagem' =>
                    'Não foi possível desfazer a presença.'
            ];


            if (
                Env::bool(
                    'APP_DEBUG',
                    true
                )
            ) {

                $dadosErro['detalhe'] =
                    $erro->getMessage();
            }


            return $this->json(
                $response,
                $dadosErro,
                500
            );
        }
    }


    // ==================================================
    // ATUALIZA ÚLTIMO ACESSO DO TABLET
    // ==================================================

    private function registrarAcessoDispositivo(
        \PDO $pdo,
        int $dispositivoId
    ): void {

        $stmt =
            $pdo->prepare(
                'UPDATE dispositivos
                 SET ultimo_acesso = NOW()
                 WHERE id = :id'
            );


        $stmt->execute([
            'id' =>
                $dispositivoId
        ]);
    }
}
