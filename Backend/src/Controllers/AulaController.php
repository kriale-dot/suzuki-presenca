<?php

namespace App\Controllers;

use App\Config\Env;
use App\Repositories\AulaRepository;
use App\Repositories\TurmaRepository;

use DateTime;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

use Throwable;


class AulaController
{
    private AulaRepository $repository;

    private TurmaRepository $turmaRepository;


    public function __construct(
        AulaRepository $repository,
        TurmaRepository $turmaRepository
    ) {
        $this->repository =
            $repository;


        $this->turmaRepository =
            $turmaRepository;
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
    // DATA
    // ==================================================

    private function dataValida(
        string $data
    ): bool {

        $objeto =
            DateTime::createFromFormat(
                'Y-m-d',
                $data
            );


        return
            $objeto !== false
            &&
            $objeto->format(
                'Y-m-d'
            )
            ===
            $data;
    }


    // ==================================================
    // HORA
    // ==================================================

    private function horaValida(
        string $hora
    ): bool {

        $formatos = [
            'H:i',
            'H:i:s'
        ];


        foreach (
            $formatos as $formato
        ) {

            $objeto =
                DateTime::createFromFormat(
                    $formato,
                    $hora
                );


            if (
                $objeto !== false
                &&
                $objeto->format(
                    $formato
                )
                ===
                $hora
            ) {

                return true;
            }
        }


        return false;
    }


    private function normalizarHora(
        string $hora
    ): string {

        if (
            strlen($hora)
            ===
            5
        ) {

            return $hora
                .
                ':00';
        }


        return $hora;
    }


    // ==================================================
    // PERFIL LOGADO
    // ==================================================

    private function perfilLogado(): string
    {
        return (string) (
            $_SESSION['usuario_perfil']
            ??
            ''
        );
    }


    // ==================================================
    // PROFESSOR VINCULADO À SESSÃO
    // ==================================================

    private function professorIdLogado(): ?int
    {
        $professorId =
            (int) (
                $_SESSION[
                    'usuario_professor_id'
                ]
                ??
                0
            );


        return $professorId > 0
            ? $professorId
            : null;
    }


    // ==================================================
    // AUTORIZAÇÃO DE UMA AULA
    // ==================================================

    private function validarAcessoProfessorAula(
        array $aula,
        Response $response
    ): ?Response {

        if (
            $this->perfilLogado()
            !==
            'professor'
        ) {

            return null;
        }


        $professorId =
            $this->professorIdLogado();


        if ($professorId === null) {

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
                        'Você não tem permissão para acessar esta aula.'
                ],
                403
            );
        }


        return null;
    }


    // ==================================================
    // PROFESSOR NÃO ADMINISTRA A ESTRUTURA DA AGENDA
    // ==================================================

    private function bloquearOperacaoAdministrativaProfessor(
        Response $response
    ): ?Response {

        if (
            $this->perfilLogado()
            !==
            'professor'
        ) {

            return null;
        }


        return $this->json(
            $response,
            [
                'sucesso' =>
                    false,

                'mensagem' =>
                    'O perfil Professor não pode criar, editar ou cancelar aulas.'
            ],
            403
        );
    }


    // ==================================================
    // GET /api/aulas
    // ==================================================

    public function listar(
        Request $request,
        Response $response
    ): Response {

        try {

            $professorId =
                null;


            if (
                $this->perfilLogado()
                ===
                'professor'
            ) {

                $professorId =
                    $this->professorIdLogado();


                if ($professorId === null) {

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
            }


            $aulas =
                $this
                    ->repository
                    ->listar(
                        $professorId
                    );


            return $this->json(
                $response,
                [
                    'sucesso' =>
                        true,

                    'total' =>
                        count(
                            $aulas
                        ),

                    'dados' =>
                        $aulas
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Erro ao consultar aulas.',

                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // GET /api/aulas/{id}
    // ==================================================

    public function buscar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $id =
                (int) $args['id'];


            $aula =
                $this
                    ->repository
                    ->buscarPorId(
                        $id
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


            return $this->json(
                $response,
                [
                    'sucesso' =>
                        true,

                    'dados' =>
                        $aula
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Erro ao consultar aula.',

                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // POST /api/aulas
    // ==================================================

    public function criar(
        Request $request,
        Response $response
    ): Response {

        try {

            $bloqueio =
                $this
                    ->bloquearOperacaoAdministrativaProfessor(
                        $response
                    );


            if ($bloqueio !== null) {

                return $bloqueio;
            }


            $dados =
                $request->getParsedBody();


            if (!is_array($dados)) {

                $dados = [];
            }


            $turmaId =
                (int) (
                    $dados['turma_id']
                    ??
                    0
                );


            $dataAula =
                trim(
                    (string) (
                        $dados['data_aula']
                        ??
                        ''
                    )
                );


            $horaInicio =
                trim(
                    (string) (
                        $dados['hora_inicio']
                        ??
                        ''
                    )
                );


            $horaFim =
                trim(
                    (string) (
                        $dados['hora_fim']
                        ??
                        ''
                    )
                );


            $tipo =
                trim(
                    (string) (
                        $dados['tipo']
                        ??
                        'regular'
                    )
                );


            // ==========================================
            // TURMA
            // ==========================================

            $turma =
                $this
                    ->turmaRepository
                    ->buscarPorId(
                        $turmaId
                    );


            if ($turma === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'Turma não encontrada.'
                    ],
                    404
                );
            }


            if (
                (int) $turma['ativo']
                !==
                1
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'Não é possível criar aula para uma turma inativa.'
                    ],
                    422
                );
            }


            if (
                (int) (
                    $turma['modalidade_ativa']
                    ??
                    0
                )
                !==
                1
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'A modalidade desta turma está inativa.'
                    ],
                    422
                );
            }


            if (
                (int) (
                    $turma['professor_ativo']
                    ??
                    0
                )
                !==
                1
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'O professor desta turma está inativo.'
                    ],
                    422
                );
            }


            // ==========================================
            // DATA
            // ==========================================

            if (
                $dataAula === ''
                ||
                !$this->dataValida(
                    $dataAula
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'A data da aula deve estar no formato YYYY-MM-DD.'
                    ],
                    422
                );
            }


            // ==========================================
            // HORÁRIOS
            // ==========================================

            if (
                !$this->horaValida(
                    $horaInicio
                )
                ||
                !$this->horaValida(
                    $horaFim
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'O horário da aula é inválido.'
                    ],
                    422
                );
            }


            $horaInicio =
                $this->normalizarHora(
                    $horaInicio
                );


            $horaFim =
                $this->normalizarHora(
                    $horaFim
                );


            if (
                $horaFim
                <=
                $horaInicio
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'A hora final deve ser posterior à hora inicial.'
                    ],
                    422
                );
            }


            // ==========================================
            // TIPO
            // ==========================================

            if (
                !in_array(
                    $tipo,
                    [
                        'regular',
                        'reposicao',
                        'extra'
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
                            'O tipo deve ser regular, reposicao ou extra.'
                    ],
                    422
                );
            }


            // ==========================================
            // DUPLICIDADE
            // ==========================================

            if (
                $this
                    ->repository
                    ->aulaExiste(
                        $turmaId,
                        $dataAula,
                        $horaInicio
                    )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'Já existe uma aula desta turma neste dia e horário.'
                    ],
                    409
                );
            }


            $professorId =
                (int)
                    $turma[
                        'professor_id'
                    ];


            $id =
                $this
                    ->repository
                    ->criar(
                        $turmaId,
                        $professorId,
                        $dataAula,
                        $horaInicio,
                        $horaFim,
                        $tipo
                    );


            $aula =
                $this
                    ->repository
                    ->buscarPorId(
                        $id
                    );


            return $this->json(
                $response,
                [
                    'sucesso' =>
                        true,

                    'mensagem' =>
                        'Aula criada com sucesso.',

                    'dados' =>
                        $aula
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
                        'Erro ao criar aula.',

                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // PUT /api/aulas/{id}
    // ==================================================

    public function atualizar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $bloqueio =
                $this
                    ->bloquearOperacaoAdministrativaProfessor(
                        $response
                    );


            if ($bloqueio !== null) {

                return $bloqueio;
            }


            $id =
                (int) $args['id'];


            $aulaAtual =
                $this
                    ->repository
                    ->buscarPorId(
                        $id
                    );


            if ($aulaAtual === null) {

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
                $aulaAtual['status']
                !==
                'agendada'
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'Somente aulas agendadas podem ser alteradas.'
                    ],
                    409
                );
            }


            $dados =
                $request->getParsedBody();


            if (!is_array($dados)) {

                $dados = [];
            }


            $dataAula =
                array_key_exists(
                    'data_aula',
                    $dados
                )
                    ? trim(
                        (string)
                            $dados['data_aula']
                    )
                    : $aulaAtual[
                        'data_aula'
                    ];


            $horaInicio =
                array_key_exists(
                    'hora_inicio',
                    $dados
                )
                    ? trim(
                        (string)
                            $dados['hora_inicio']
                    )
                    : $aulaAtual[
                        'hora_inicio'
                    ];


            $horaFim =
                array_key_exists(
                    'hora_fim',
                    $dados
                )
                    ? trim(
                        (string)
                            $dados['hora_fim']
                    )
                    : $aulaAtual[
                        'hora_fim'
                    ];


            $tipo =
                array_key_exists(
                    'tipo',
                    $dados
                )
                    ? trim(
                        (string)
                            $dados['tipo']
                    )
                    : $aulaAtual['tipo'];


            if (
                !$this->dataValida(
                    $dataAula
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'A data da aula é inválida.'
                    ],
                    422
                );
            }


            if (
                !$this->horaValida(
                    $horaInicio
                )
                ||
                !$this->horaValida(
                    $horaFim
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'O horário da aula é inválido.'
                    ],
                    422
                );
            }


            $horaInicio =
                $this->normalizarHora(
                    $horaInicio
                );


            $horaFim =
                $this->normalizarHora(
                    $horaFim
                );


            if (
                $horaFim
                <=
                $horaInicio
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'A hora final deve ser posterior à hora inicial.'
                    ],
                    422
                );
            }


            if (
                !in_array(
                    $tipo,
                    [
                        'regular',
                        'reposicao',
                        'extra'
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
                            'O tipo da aula é inválido.'
                    ],
                    422
                );
            }


            if (
                $this
                    ->repository
                    ->aulaExiste(
                        (int)
                            $aulaAtual[
                                'turma_id'
                            ],
                        $dataAula,
                        $horaInicio,
                        $id
                    )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'Já existe outra aula desta turma neste dia e horário.'
                    ],
                    409
                );
            }


            $this
                ->repository
                ->atualizar(
                    $id,
                    $dataAula,
                    $horaInicio,
                    $horaFim,
                    $tipo
                );


            $aula =
                $this
                    ->repository
                    ->buscarPorId(
                        $id
                    );


            return $this->json(
                $response,
                [
                    'sucesso' =>
                        true,

                    'mensagem' =>
                        'Aula atualizada com sucesso.',

                    'dados' =>
                        $aula
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Erro ao atualizar aula.',

                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // POST /api/aulas/{id}/abrir
    // ==================================================

    public function abrir(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $id =
                (int) $args['id'];


            $aula =
                $this
                    ->repository
                    ->buscarPorId(
                        $id
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


            if (
                $aula['status']
                !==
                'agendada'
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'Somente aulas agendadas podem ser abertas.'
                    ],
                    409
                );
            }


            $totalAlunos =
                $this
                    ->repository
                    ->abrir(
                        $id
                    );


            $aula =
                $this
                    ->repository
                    ->buscarPorId(
                        $id
                    );


            return $this->json(
                $response,
                [
                    'sucesso' =>
                        true,

                    'mensagem' =>
                        'Aula aberta com sucesso.',

                    'alunos_adicionados' =>
                        $totalAlunos,

                    'dados' =>
                        $aula
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Erro ao abrir aula.',

                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // GET /api/aulas/{id}/alunos
    // ==================================================

    public function listarAlunos(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $id =
                (int) $args['id'];


            $aula =
                $this
                    ->repository
                    ->buscarPorId(
                        $id
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


            $alunos =
                $this
                    ->repository
                    ->listarAlunos(
                        $id
                    );


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
                            $aula['status']
                    ],

                    'total' =>
                        count(
                            $alunos
                        ),

                    'dados' =>
                        $alunos
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Erro ao consultar alunos da aula.',

                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // POST /api/aulas/{id}/encerrar
    // ==================================================

    public function encerrar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $id =
                (int) $args['id'];


            $aula =
                $this
                    ->repository
                    ->buscarPorId(
                        $id
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


            if (
                $aula['status']
                !==
                'aberta'
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'Somente aulas abertas podem ser encerradas.'
                    ],
                    409
                );
            }


            $totalAusencias =
                $this
                    ->repository
                    ->encerrar(
                        $id
                    );


            $aula =
                $this
                    ->repository
                    ->buscarPorId(
                        $id
                    );


            return $this->json(
                $response,
                [
                    'sucesso' =>
                        true,

                    'mensagem' =>
                        'Aula encerrada com sucesso.',

                    'ausencias_registradas' =>
                        $totalAusencias,

                    'dados' =>
                        $aula
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Erro ao encerrar aula.',

                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // POST /api/aulas/{id}/cancelar
    // ==================================================

    public function cancelar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $bloqueio =
                $this
                    ->bloquearOperacaoAdministrativaProfessor(
                        $response
                    );


            if ($bloqueio !== null) {

                return $bloqueio;
            }


            $id =
                (int) $args['id'];


            $aula =
                $this
                    ->repository
                    ->buscarPorId(
                        $id
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


            if (
                $aula['status']
                !==
                'agendada'
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            'Somente aulas agendadas podem ser canceladas.'
                    ],
                    409
                );
            }


            $dados =
                $request->getParsedBody();


            if (!is_array($dados)) {

                $dados = [];
            }


            $motivo =
                trim(
                    (string) (
                        $dados['motivo']
                        ??
                        ''
                    )
                );


            $motivo =
                $motivo === ''
                    ? null
                    : $motivo;


            $this
                ->repository
                ->cancelar(
                    $id,
                    $motivo
                );


            $aula =
                $this
                    ->repository
                    ->buscarPorId(
                        $id
                    );


            return $this->json(
                $response,
                [
                    'sucesso' =>
                        true,

                    'mensagem' =>
                        'Aula cancelada com sucesso.',

                    'dados' =>
                        $aula
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' =>
                        false,

                    'mensagem' =>
                        'Erro ao cancelar aula.',

                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }
}