<?php

namespace App\Controllers;

use App\Config\Env;
use App\Repositories\TurmaAlunoRepository;
use App\Repositories\TurmaRepository;
use App\Repositories\AlunoRepository;

use DateTime;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

use Throwable;


class TurmaAlunoController
{
    private TurmaAlunoRepository $repository;

    private TurmaRepository $turmaRepository;

    private AlunoRepository $alunoRepository;


    public function __construct(
        TurmaAlunoRepository $repository,
        TurmaRepository $turmaRepository,
        AlunoRepository $alunoRepository
    ) {
        $this->repository = $repository;

        $this->turmaRepository =
            $turmaRepository;

        $this->alunoRepository =
            $alunoRepository;
    }


    // --------------------------------------------------
    // Resposta JSON padronizada
    // --------------------------------------------------

    private function json(
        Response $response,
        array $dados,
        int $status = 200
    ): Response {

        // Em produção não exponha detalhes internos de exceções/SQL.
        if (!Env::bool('APP_DEBUG', true)) {
            unset($dados['detalhe']);
        }


        $response->getBody()->write(
            json_encode(
                $dados,
                JSON_UNESCAPED_UNICODE |
                    JSON_PRETTY_PRINT
            )
        );

        return $response
            ->withHeader(
                'Content-Type',
                'application/json'
            )
            ->withStatus($status);
    }


    // --------------------------------------------------
    // Valida data YYYY-MM-DD
    // --------------------------------------------------

    private function dataValida(string $data): bool
    {
        $objetoData =
            DateTime::createFromFormat(
                'Y-m-d',
                $data
            );

        return
            $objetoData !== false &&
            $objetoData->format('Y-m-d') === $data;
    }


    // ==================================================
    // GET /api/turmas/{turmaId}/alunos
    // ==================================================

    public function listar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $turmaId =
                (int) $args['turmaId'];


            $turma =
                $this->turmaRepository
                ->buscarPorId($turmaId);


            if ($turma === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                        'Turma não encontrada.'
                    ],
                    404
                );
            }


            $matriculas =
                $this->repository
                ->listarPorTurma($turmaId);


            return $this->json(
                $response,
                [
                    'sucesso' => true,

                    'turma' => [
                        'id' => $turma['id'],
                        'nome' => $turma['nome']
                    ],

                    'total' =>
                    count($matriculas),

                    'dados' =>
                    $matriculas
                ]
            );
        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                    'Erro ao consultar alunos da turma.',
                    'detalhe' =>
                    $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // GET /api/turmas/{turmaId}/alunos/{matriculaId}
    // ==================================================

    public function buscar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $turmaId =
                (int) $args['turmaId'];

            $matriculaId =
                (int) $args['matriculaId'];


            $matricula =
                $this->repository->buscarPorId(
                    $turmaId,
                    $matriculaId
                );


            if ($matricula === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                        'Matrícula não encontrada.'
                    ],
                    404
                );
            }


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'dados' => $matricula
                ]
            );
        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                    'Erro ao consultar matrícula.',
                    'detalhe' =>
                    $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // POST /api/turmas/{turmaId}/alunos
    // ==================================================

    public function criar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $turmaId =
                (int) $args['turmaId'];


            // ------------------------------------------
            // Verifica a turma
            // ------------------------------------------

            $turma =
                $this->turmaRepository
                ->buscarPorId($turmaId);


            if ($turma === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                        'Turma não encontrada.'
                    ],
                    404
                );
            }


            if ((int) $turma['ativo'] !== 1) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                        'Não é possível matricular aluno em uma turma inativa.'
                    ],
                    422
                );
            }


            $dados =
                $request->getParsedBody();


            if (!is_array($dados)) {
                $dados = [];
            }


            $alunoId =
                (int) ($dados['aluno_id'] ?? 0);


            $dataInicio = trim(
                (string) ($dados['data_inicio'] ?? '')
            );


            $dataFim = trim(
                (string) ($dados['data_fim'] ?? '')
            );


            // ------------------------------------------
            // Aluno
            // ------------------------------------------

            if ($alunoId <= 0) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                        'O aluno é obrigatório.'
                    ],
                    422
                );
            }


            $aluno =
                $this->alunoRepository
                ->buscarPorId($alunoId);


            if ($aluno === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                        'Aluno não encontrado.'
                    ],
                    404
                );
            }


            if ((int) $aluno['ativo'] !== 1) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                        'Não é possível matricular um aluno inativo.'
                    ],
                    422
                );
            }


            // ------------------------------------------
            // Data de início
            // ------------------------------------------

            if ($dataInicio === '') {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                        'A data de início é obrigatória.'
                    ],
                    422
                );
            }


            if (!$this->dataValida($dataInicio)) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                        'A data de início deve estar no formato YYYY-MM-DD.'
                    ],
                    422
                );
            }


            // ------------------------------------------
            // Data de término
            // ------------------------------------------

            if (
                $dataFim !== '' &&
                !$this->dataValida($dataFim)
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                        'A data de término deve estar no formato YYYY-MM-DD.'
                    ],
                    422
                );
            }


            if (
                $dataFim !== '' &&
                $dataFim < $dataInicio
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                        'A data de término não pode ser anterior à data de início.'
                    ],
                    422
                );
            }


            if ($dataFim !== '' && $dataFim < date('Y-m-d')) {
                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' => 'Uma nova matrícula ativa não pode terminar em uma data passada.'
                    ],
                    422
                );
            }


            // ------------------------------------------
            // Não permitimos duas matrículas ativas
            // do mesmo aluno na mesma turma.
            // ------------------------------------------

            if (
                $this->repository
                ->possuiMatriculaAtiva(
                    $turmaId,
                    $alunoId
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                        'O aluno já possui uma matrícula ativa nesta turma.'
                    ],
                    409
                );
            }


            // ------------------------------------------
            // Verifica a chave única do banco
            // ------------------------------------------

            if (
                $this->repository->matriculaExiste(
                    $turmaId,
                    $alunoId,
                    $dataInicio
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                        'Já existe uma matrícula deste aluno nesta turma com a mesma data de início.'
                    ],
                    409
                );
            }


            $dataFim =
                $dataFim === ''
                ? null
                : $dataFim;


            $matriculaId =
                $this->repository->criar(
                    $turmaId,
                    $alunoId,
                    $dataInicio,
                    $dataFim
                );


            $matricula =
                $this->repository->buscarPorId(
                    $turmaId,
                    $matriculaId
                );


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' =>
                    'Aluno matriculado na turma com sucesso.',
                    'dados' =>
                    $matricula
                ],
                201
            );
        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                    'Erro ao matricular aluno na turma.',
                    'detalhe' =>
                    $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // PUT /api/turmas/{turmaId}/alunos/{matriculaId}
    // ==================================================

    public function atualizar(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $turmaId =
                (int) $args['turmaId'];

            $matriculaId =
                (int) $args['matriculaId'];


            $matriculaAtual =
                $this->repository->buscarPorId(
                    $turmaId,
                    $matriculaId
                );


            if ($matriculaAtual === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                        'Matrícula não encontrada.'
                    ],
                    404
                );
            }


            $dados =
                $request->getParsedBody();


            if (!is_array($dados)) {
                $dados = [];
            }


            $dataInicio =
                array_key_exists(
                    'data_inicio',
                    $dados
                )
                ? trim(
                    (string) $dados['data_inicio']
                )
                : $matriculaAtual['data_inicio'];


            $dataFim =
                array_key_exists(
                    'data_fim',
                    $dados
                )
                ? trim(
                    (string) $dados['data_fim']
                )
                : $matriculaAtual['data_fim'];


            $ativo =
                $dados['ativo']
                ?? $matriculaAtual['ativo'];

            $ativo =
                (int) $ativo;


            // ------------------------------------------
            // Validações
            // ------------------------------------------

            if (
                $dataInicio === '' ||
                !$this->dataValida($dataInicio)
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                        'A data de início deve estar no formato YYYY-MM-DD.'
                    ],
                    422
                );
            }


            if (
                $dataFim !== null &&
                $dataFim !== '' &&
                !$this->dataValida($dataFim)
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                        'A data de término deve estar no formato YYYY-MM-DD.'
                    ],
                    422
                );
            }


            if (
                $dataFim !== null &&
                $dataFim !== '' &&
                $dataFim < $dataInicio
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                        'A data de término não pode ser anterior à data de início.'
                    ],
                    422
                );
            }


            if (
                !in_array(
                    $ativo,
                    [0, 1],
                    true
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                        'O campo ativo deve ser 0 ou 1.'
                    ],
                    422
                );
            }


            $alunoId =
                (int) $matriculaAtual['aluno_id'];


            // Ao ativar/reativar uma matrícula, tanto o aluno quanto
            // a turma precisam continuar ativos.
            if ($ativo === 1) {
                $turma = $this->turmaRepository->buscarPorId($turmaId);
                $aluno = $this->alunoRepository->buscarPorId($alunoId);

                if ($turma === null || (int) $turma['ativo'] !== 1) {
                    return $this->json(
                        $response,
                        [
                            'sucesso' => false,
                            'mensagem' => 'Não é possível ativar matrícula em uma turma inativa.'
                        ],
                        422
                    );
                }

                if ($aluno === null || (int) $aluno['ativo'] !== 1) {
                    return $this->json(
                        $response,
                        [
                            'sucesso' => false,
                            'mensagem' => 'Não é possível ativar matrícula de um aluno inativo.'
                        ],
                        422
                    );
                }
            }


            // Mantém coerência entre o estado e o período da matrícula.
            if ($ativo === 0 && ($dataFim === null || $dataFim === '')) {
                $dataFim = date('Y-m-d');
            }

            if ($ativo === 0 && $dataFim > date('Y-m-d')) {
                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' => 'A data de encerramento não pode estar no futuro.'
                    ],
                    422
                );
            }

            if (
                $ativo === 1 &&
                $dataFim !== null &&
                $dataFim !== '' &&
                $dataFim < date('Y-m-d')
            ) {
                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' => 'Uma matrícula ativa não pode possuir data de término no passado.'
                    ],
                    422
                );
            }


            // Se estiver sendo reativada,
            // não pode existir outra matrícula ativa.
            if (
                $ativo === 1 &&
                $this->repository
                ->possuiMatriculaAtiva(
                    $turmaId,
                    $alunoId,
                    $matriculaId
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                        'Já existe outra matrícula ativa deste aluno nesta turma.'
                    ],
                    409
                );
            }


            if (
                $this->repository->matriculaExiste(
                    $turmaId,
                    $alunoId,
                    $dataInicio,
                    $matriculaId
                )
            ) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                        'Já existe outra matrícula com esta mesma data de início.'
                    ],
                    409
                );
            }


            $dataFim =
                $dataFim === ''
                ? null
                : $dataFim;


            $this->repository->atualizar(
                $matriculaId,
                $dataInicio,
                $dataFim,
                $ativo
            );


            $matricula =
                $this->repository->buscarPorId(
                    $turmaId,
                    $matriculaId
                );


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' =>
                    'Matrícula atualizada com sucesso.',
                    'dados' =>
                    $matricula
                ]
            );
        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                    'Erro ao atualizar matrícula.',
                    'detalhe' =>
                    $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // DELETE /api/turmas/{turmaId}/alunos/{matriculaId}
    // ==================================================

    public function excluir(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $turmaId =
                (int) $args['turmaId'];

            $matriculaId =
                (int) $args['matriculaId'];


            $matricula =
                $this->repository->buscarPorId(
                    $turmaId,
                    $matriculaId
                );


            if ($matricula === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                        'Matrícula não encontrada.'
                    ],
                    404
                );
            }


            $this->repository
                ->desativar(
                    $matriculaId,
                    date('Y-m-d')
                );


            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' =>
                    'Matrícula encerrada com sucesso.'
                ]
            );
        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                    'Erro ao encerrar matrícula.',
                    'detalhe' =>
                    $erro->getMessage()
                ],
                500
            );
        }
    }

    // ==================================================
    // GET /api/alunos/{alunoId}/turmas
    //
    // Lista o histórico de matrículas do aluno.
    // ==================================================

    public function listarPorAluno(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $alunoId =
                (int) $args['alunoId'];


            // ------------------------------------------
            // Confirma se o aluno existe.
            // ------------------------------------------

            $aluno =
                $this->alunoRepository
                ->buscarPorId($alunoId);


            if ($aluno === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                        'Aluno não encontrado.'
                    ],
                    404
                );
            }


            // ------------------------------------------
            // Busca as matrículas.
            // ------------------------------------------

            $matriculas =
                $this->repository
                ->listarPorAluno(
                    $alunoId
                );


            return $this->json(
                $response,
                [
                    'sucesso' => true,

                    'aluno' => [
                        'id' =>
                        $aluno['id'],

                        'nome' =>
                        $aluno['nome']
                    ],

                    'total' =>
                    count($matriculas),

                    'dados' =>
                    $matriculas
                ]
            );
        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,

                    'mensagem' =>
                    'Erro ao consultar matrículas do aluno.',

                    'detalhe' =>
                    $erro->getMessage()
                ],
                500
            );
        }
    }
}
