<?php

namespace App\Controllers;

use App\Config\Env;
use App\Repositories\PresencaRepository;
use App\Repositories\AulaRepository;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

use Throwable;


class PresencaController
{
    private PresencaRepository $repository;

    private AulaRepository $aulaRepository;


    public function __construct(
        PresencaRepository $repository,
        AulaRepository $aulaRepository
    ) {
        $this->repository =
            $repository;


        $this->aulaRepository =
            $aulaRepository;
    }


    // ==================================================
    // JSON
    // ==================================================

    private function json(
        Response $response,
        array $dados,
        int $status = 200
    ): Response {

        if (
            !Env::bool(
                'APP_DEBUG',
                true
            )
        ) {

            unset(
                $dados['detalhe']
            );
        }


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
    // AUTORIZAÇÃO DO PROFESSOR
    // ==================================================

    private function validarAcessoProfessorAula(
        array $aula,
        Response $response
    ): ?Response {

        $perfil =
            (string) (
                $_SESSION[
                    'usuario_perfil'
                ]
                ??
                ''
            );


        if ($perfil !== 'professor') {

            return null;
        }


        $professorId =
            (int) (
                $_SESSION[
                    'usuario_professor_id'
                ]
                ??
                0
            );


        if ($professorId <= 0) {

            return $this->json(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Usuário professor sem vínculo válido.'
                ],
                403
            );
        }


        if (
            (int) $aula['professor_id']
            !==
            $professorId
        ) {

            return $this->json(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Você não tem permissão para acessar as presenças desta aula.'
                ],
                403
            );
        }


        return null;
    }


    // ==================================================
    // GET /api/aulas/{aulaId}/presencas
    // ==================================================

    public function listar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $aulaId =
                (int)
                    $args['aulaId'];


            $aula =
                $this
                    ->aulaRepository
                    ->buscarPorId(
                        $aulaId
                    );


            if ($aula === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'Aula não encontrada.'
                    ],
                    404
                );
            }


            $acessoNegado =
                $this
                    ->validarAcessoProfessorAula(
                        $aula,
                        $response
                    );


            if ($acessoNegado !== null) {

                return $acessoNegado;
            }


            $presencas =
                $this
                    ->repository
                    ->listarPorAula(
                        $aulaId
                    );


            $presentes =
                0;


            $ausentes =
                0;


            $justificadas =
                0;


            $naoRegistrados =
                0;


            foreach (
                $presencas as $item
            ) {

                switch (
                    $item['situacao']
                ) {

                    case 'presente':

                        $presentes++;

                        break;


                    case 'ausente':

                        $ausentes++;

                        break;


                    case 'justificada':

                        $justificadas++;

                        break;


                    default:

                        $naoRegistrados++;

                        break;
                }
            }


            return $this->json(
                $response,
                [
                    'sucesso' =>
                        true,

                    'aula' => [
                        'id' =>
                            $aula['id'],

                        'turma' =>
                            $aula[
                                'turma_nome'
                            ],

                        'data' =>
                            $aula[
                                'data_aula'
                            ],

                        'status' =>
                            $aula[
                                'status'
                            ]
                    ],

                    'resumo' => [
                        'total' =>
                            count(
                                $presencas
                            ),

                        'presentes' =>
                            $presentes,

                        'ausentes' =>
                            $ausentes,

                        'justificadas' =>
                            $justificadas,

                        'nao_registrados' =>
                            $naoRegistrados
                    ],

                    'dados' =>
                        $presencas
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Erro ao consultar presenças.',

                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // POST /api/aulas/{aulaId}/presencas/aluno
    //
    // Endpoint legado.
    //
    // O tablet atual usa /api/tablet/...
    // ==================================================

    public function registrarAluno(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $aulaId =
                (int)
                    $args['aulaId'];


            $dados =
                $request->getParsedBody();


            if (!is_array($dados)) {

                $dados = [];
            }


            $aulaAlunoId =
                (int) (
                    $dados[
                        'aula_aluno_id'
                    ]
                    ??
                    0
                );


            $dispositivoId =
                isset(
                    $dados[
                        'dispositivo_id'
                    ]
                )
                    ? (int)
                        $dados[
                            'dispositivo_id'
                        ]
                    : null;


            if ($aulaAlunoId <= 0) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'O aluno da aula é obrigatório.'
                    ],
                    422
                );
            }


            $aluno =
                $this
                    ->repository
                    ->buscarAulaAluno(
                        $aulaId,
                        $aulaAlunoId
                    );


            if ($aluno === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'Aluno não pertence a esta aula.'
                    ],
                    404
                );
            }


            if (
                $dispositivoId !== null
                &&
                $dispositivoId > 0
            ) {

                $dispositivo =
                    $this
                        ->repository
                        ->buscarDispositivoAtivo(
                            $dispositivoId
                        );


                if ($dispositivo === null) {

                    return $this->json(
                        $response,
                        [
                            'sucesso' =>
                                false,

                            'mensagem' =>
                                'Dispositivo não autorizado.'
                        ],
                        403
                    );
                }

            } else {

                $dispositivoId =
                    null;
            }


            $resultado =
                $this
                    ->repository
                    ->registrarAlunoSeguro(
                        $aulaId,
                        $aulaAlunoId,
                        $dispositivoId
                    );


            if (
                $resultado['resultado']
                ===
                'aula_nao_encontrada'
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'Aula não encontrada.'
                    ],
                    404
                );
            }


            if (
                $resultado['resultado']
                ===
                'aula_fechada'
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'A aula não está aberta para registro de presença.'
                    ],
                    409
                );
            }


            if (
                $resultado['resultado']
                ===
                'aluno_nao_pertence'
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'Aluno não pertence a esta aula.'
                    ],
                    404
                );
            }


            $presenca =
                $resultado[
                    'presenca'
                ];


            if (
                $resultado['resultado']
                ===
                'existente'
            ) {

                if (
                    (
                        $presenca['situacao']
                        ??
                        null
                    )
                    ===
                    'presente'
                ) {

                    return $this->json(
                        $response,
                        [
                            'sucesso' =>
                                true,

                            'mensagem' =>
                                'Presença já estava registrada.',

                            'aluno' => [
                                'id' =>
                                    $aluno[
                                        'aluno_id'
                                    ],

                                'nome' =>
                                    $aluno[
                                        'aluno_nome'
                                    ]
                            ],

                            'dados' =>
                                $presenca
                        ]
                    );
                }


                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'Já existe um registro para este aluno. Procure o professor.'
                    ],
                    409
                );
            }


            return $this->json(
                $response,
                [
                    'sucesso' =>
                        true,

                    'mensagem' =>
                        'Presença registrada com sucesso!',

                    'aluno' => [
                        'id' =>
                            $aluno[
                                'aluno_id'
                            ],

                        'nome' =>
                            $aluno[
                                'aluno_nome'
                            ]
                    ],

                    'dados' =>
                        $presenca
                ],
                201
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Erro ao registrar presença.',

                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // PUT /api/aulas/{aulaId}/presencas/{aulaAlunoId}
    // ==================================================

    public function registrarProfessor(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $aulaId =
                (int)
                    $args['aulaId'];


            $aulaAlunoId =
                (int)
                    $args[
                        'aulaAlunoId'
                    ];


            $aula =
                $this
                    ->aulaRepository
                    ->buscarPorId(
                        $aulaId
                    );


            if ($aula === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'Aula não encontrada.'
                    ],
                    404
                );
            }


            // ==========================================
            // VERIFICA SE A AULA PERTENCE AO PROFESSOR
            // ==========================================

            $acessoNegado =
                $this
                    ->validarAcessoProfessorAula(
                        $aula,
                        $response
                    );


            if ($acessoNegado !== null) {

                return $acessoNegado;
            }


            if (
                !in_array(
                    $aula['status'],
                    [
                        'aberta',
                        'encerrada'
                    ],
                    true
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'Esta aula não permite registro de presença.'
                    ],
                    409
                );
            }


            $aluno =
                $this
                    ->repository
                    ->buscarAulaAluno(
                        $aulaId,
                        $aulaAlunoId
                    );


            if ($aluno === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'Aluno não pertence a esta aula.'
                    ],
                    404
                );
            }


            $dados =
                $request->getParsedBody();


            if (!is_array($dados)) {

                $dados = [];
            }


            $situacao =
                trim(
                    (string) (
                        $dados['situacao']
                        ??
                        ''
                    )
                );


            $observacao =
                trim(
                    (string) (
                        $dados['observacao']
                        ??
                        ''
                    )
                );


            if (
                !in_array(
                    $situacao,
                    [
                        'presente',
                        'ausente',
                        'justificada'
                    ],
                    true
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'A situação deve ser presente, ausente ou justificada.'
                    ],
                    422
                );
            }


            if (
                mb_strlen(
                    $observacao
                )
                >
                500
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'A observação deve possuir no máximo 500 caracteres.'
                    ],
                    422
                );
            }


            $observacao =
                $observacao === ''
                    ? null
                    : $observacao;


            $this
                ->repository
                ->registrarOuAtualizarPorProfessor(
                    $aulaAlunoId,
                    $situacao,
                    $observacao
                );


            $presenca =
                $this
                    ->repository
                    ->buscarPorAulaAluno(
                        $aulaAlunoId
                    );


            return $this->json(
                $response,
                [
                    'sucesso' =>
                        true,

                    'mensagem' =>
                        'Presença atualizada com sucesso.',

                    'aluno' => [
                        'id' =>
                            $aluno[
                                'aluno_id'
                            ],

                        'nome' =>
                            $aluno[
                                'aluno_nome'
                            ]
                    ],

                    'dados' =>
                        $presenca
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Erro ao atualizar presença.',

                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }
}