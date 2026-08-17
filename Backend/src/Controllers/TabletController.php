<?php

namespace App\Controllers;

use App\Config\Env;
use App\Repositories\DispositivoRepository;
use App\Repositories\AulaRepository;
use App\Repositories\PresencaRepository;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

use Throwable;


class TabletController
{
    private DispositivoRepository
        $dispositivoRepository;

    private AulaRepository
        $aulaRepository;

    private PresencaRepository
        $presencaRepository;


    public function __construct(
        DispositivoRepository $dispositivoRepository,
        AulaRepository $aulaRepository,
        PresencaRepository $presencaRepository
    ) {
        $this->dispositivoRepository =
            $dispositivoRepository;

        $this->aulaRepository =
            $aulaRepository;

        $this->presencaRepository =
            $presencaRepository;
    }


    // --------------------------------------------------
    // Resposta JSON.
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


    // ==================================================
    // GET
    //
    // /api/tablet/{identificador}/aulas/{aulaId}
    //
    // Abre a tela que os alunos verão.
    // ==================================================

    public function aula(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {

            $identificador =
                trim(
                    (string)
                    $args['identificador']
                );


            $aulaId =
                (int) $args['aulaId'];


            // ------------------------------------------
            // Tablet autorizado?
            // ------------------------------------------

            $dispositivo =
                $this->dispositivoRepository
                    ->buscarAtivoPorIdentificador(
                        $identificador
                    );


            if ($dispositivo === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Tablet não autorizado.'
                    ],
                    403
                );
            }


            // Atualiza ultimo_acesso.
            $this->dispositivoRepository
                ->registrarAcesso(
                    (int) $dispositivo['id']
                );


            // ------------------------------------------
            // Aula existe?
            // ------------------------------------------

            $aula =
                $this->aulaRepository
                    ->buscarPorId($aulaId);


            if ($aula === null) {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Aula não encontrada.'
                    ],
                    404
                );
            }


            // ------------------------------------------
            // O tablet somente funciona durante
            // uma aula aberta.
            // ------------------------------------------

            if ($aula['status'] !== 'aberta') {

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' =>
                            'Esta aula não está aberta para registro de presença.'
                    ],
                    409
                );
            }


            $alunos =
                $this->presencaRepository
                    ->listarParaTablet($aulaId);


            // Convertemos 0/1 do MySQL em boolean.
            foreach ($alunos as &$aluno) {

                $aluno['registrado'] =
                    (bool) $aluno['registrado'];

                $aluno['presente'] =
                    (bool) $aluno['presente'];
            }

            unset($aluno);


            return $this->json(
                $response,
                [
                    'sucesso' => true,

                    'dispositivo' => [
                        'nome' =>
                            $dispositivo['nome']
                    ],

                    'aula' => [
                        'id' =>
                            $aula['id'],

                        'turma' =>
                            $aula['turma_nome'],

                        'data' =>
                            $aula['data_aula'],

                        'hora_inicio' =>
                            $aula['hora_inicio'],

                        'hora_fim' =>
                            $aula['hora_fim']
                    ],

                    'total' =>
                        count($alunos),

                    'alunos' =>
                        $alunos
                ]
            );

        } catch (Throwable $erro) {

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' =>
                        'Erro ao carregar tela do tablet.',
                    'detalhe' =>
                        $erro->getMessage()
                ],
                500
            );
        }
    }


    // ==================================================
    // POST
    //
    // /api/tablet/{identificador}/
    // aulas/{aulaId}/presencas
    //
    // A criança toca no próprio nome.
    // ==================================================

    public function registrarPresenca(
        Request $request,
        Response $response,
        array $args
    ): Response {

        try {
            $identificador = trim((string) $args['identificador']);
            $aulaId = (int) $args['aulaId'];

            $dispositivo = $this->dispositivoRepository
                ->buscarAtivoPorIdentificador($identificador);

            if ($dispositivo === null) {
                return $this->json(
                    $response,
                    ['sucesso' => false, 'mensagem' => 'Tablet não autorizado.'],
                    403
                );
            }

            $this->dispositivoRepository->registrarAcesso(
                (int) $dispositivo['id']
            );

            $dados = $request->getParsedBody();

            if (!is_array($dados)) {
                $dados = [];
            }

            $aulaAlunoId = (int) ($dados['aula_aluno_id'] ?? 0);

            if ($aulaAlunoId <= 0) {
                return $this->json(
                    $response,
                    ['sucesso' => false, 'mensagem' => 'O aluno da aula é obrigatório.'],
                    422
                );
            }

            $aluno = $this->presencaRepository->buscarAulaAluno(
                $aulaId,
                $aulaAlunoId
            );

            if ($aluno === null) {
                return $this->json(
                    $response,
                    ['sucesso' => false, 'mensagem' => 'Aluno não pertence a esta aula.'],
                    404
                );
            }

            $resultado = $this->presencaRepository->registrarAlunoSeguro(
                $aulaId,
                $aulaAlunoId,
                (int) $dispositivo['id']
            );

            if ($resultado['resultado'] === 'aula_nao_encontrada') {
                return $this->json(
                    $response,
                    ['sucesso' => false, 'mensagem' => 'Aula não encontrada.'],
                    404
                );
            }

            if ($resultado['resultado'] === 'aula_fechada') {
                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' => 'A aula não está aberta para registro de presença.'
                    ],
                    409
                );
            }

            if ($resultado['resultado'] === 'aluno_nao_pertence') {
                return $this->json(
                    $response,
                    ['sucesso' => false, 'mensagem' => 'Aluno não pertence a esta aula.'],
                    404
                );
            }

            $presenca = $resultado['presenca'];

            if ($resultado['resultado'] === 'existente') {
                if (($presenca['situacao'] ?? null) === 'presente') {
                    return $this->json(
                        $response,
                        [
                            'sucesso' => true,
                            'mensagem' => 'Sua presença já foi registrada!',
                            'aluno' => [
                                'id' => $aluno['aluno_id'],
                                'nome' => $aluno['aluno_nome']
                            ],
                            'registrado' => true
                        ]
                    );
                }

                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' => 'Este registro precisa ser verificado pelo professor.'
                    ],
                    409
                );
            }

            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' => 'Presença registrada!',
                    'aluno' => [
                        'id' => $aluno['aluno_id'],
                        'nome' => $aluno['aluno_nome']
                    ],
                    'registrado' => true
                ],
                201
            );
        } catch (Throwable $erro) {
            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' => 'Erro ao registrar presença.',
                    'detalhe' => $erro->getMessage()
                ],
                500
            );
        }
    }

}