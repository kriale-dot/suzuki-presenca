<?php

// =====================================================
// SESSÃO DE AUTENTICAÇÃO
// =====================================================

session_name(
    'suzuki_presenca'
);


$https =
    !empty($_SERVER['HTTPS'])
    &&
    $_SERVER['HTTPS']
    !==
    'off';


session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => $https,
    'httponly' => true,
    'samesite' => 'Lax'
]);


if (
    session_status()
    !==
    PHP_SESSION_ACTIVE
) {

    session_start();
}


use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Factory\AppFactory;

use App\Config\Database;
use App\Config\Env;

use App\Repositories\ModalidadeRepository;
use App\Controllers\ModalidadeController;

use App\Repositories\ProfessorRepository;
use App\Controllers\ProfessorController;
use App\Controllers\ProfessorExclusaoController;

use App\Repositories\AlunoRepository;
use App\Controllers\AlunoController;
use App\Controllers\AlunoExclusaoController;

use App\Repositories\ResponsavelRepository;
use App\Controllers\ResponsavelController;

use App\Repositories\AlunoResponsavelRepository;
use App\Controllers\AlunoResponsavelController;

use App\Repositories\TurmaRepository;
use App\Controllers\TurmaController;
use App\Controllers\TurmaExclusaoController;

use App\Repositories\TurmaAlunoRepository;
use App\Controllers\TurmaAlunoController;

use App\Repositories\HorarioRepository;
use App\Controllers\HorarioController;

use App\Repositories\AulaRepository;
use App\Controllers\AulaController;
use App\Controllers\AulaExclusaoController;

use App\Repositories\PresencaRepository;
use App\Controllers\PresencaController;

use App\Repositories\DispositivoRepository;

use App\Controllers\DispositivoController;
use App\Controllers\TabletController;
use App\Controllers\TabletCorrecaoController;

use App\Controllers\GeracaoAulasController;
use App\Repositories\GeracaoAulasRepository;

use App\Repositories\UsuarioRepository;
use App\Controllers\AuthController;
use App\Controllers\UsuarioController;

use App\Middleware\AuthMiddleware;

// =====================================================
// COMPOSER
// =====================================================

require __DIR__
    . '/../vendor/autoload.php';


// =====================================================
// AMBIENTE
// =====================================================

Env::load(
    __DIR__
    . '/../.env'
);


$debug =
    Env::bool(
        'APP_DEBUG',
        true
    );


$basePath =
    Env::get(
        'APP_BASE_PATH',
        ''
    )
    ??
    '';


$frontendOrigin =
    Env::get(
        'FRONTEND_ORIGIN',
        'http://localhost:5173'
    )
    ??
    'http://localhost:5173';


$timezone =
    Env::get(
        'APP_TIMEZONE',
        'America/Sao_Paulo'
    )
    ??
    'America/Sao_Paulo';


date_default_timezone_set(
    $timezone
);


// =====================================================
// CRIAÇÃO DA APLICAÇÃO
// =====================================================

$app =
    AppFactory::create();


// =====================================================
// DEPENDÊNCIAS
// =====================================================

$database =
    new Database();


// -----------------------------------------------------
// MODALIDADES
// -----------------------------------------------------

$modalidadeRepository =
    new ModalidadeRepository(
        $database
    );


$modalidadeController =
    new ModalidadeController(
        $modalidadeRepository
    );


// -----------------------------------------------------
// PROFESSORES
// -----------------------------------------------------

$professorRepository =
    new ProfessorRepository(
        $database
    );


$professorController =
    new ProfessorController(
        $professorRepository
    );


$professorExclusaoController =
    new ProfessorExclusaoController(
        $database
    );


// -----------------------------------------------------
// ALUNOS
// -----------------------------------------------------

$alunoRepository =
    new AlunoRepository(
        $database
    );


$alunoController =
    new AlunoController(
        $alunoRepository
    );


$alunoExclusaoController =
    new AlunoExclusaoController(
        $database
    );


// -----------------------------------------------------
// RESPONSÁVEIS
// -----------------------------------------------------

$responsavelRepository =
    new ResponsavelRepository(
        $database
    );


$responsavelController =
    new ResponsavelController(
        $responsavelRepository
    );


$alunoResponsavelRepository =
    new AlunoResponsavelRepository(
        $database
    );


$alunoResponsavelController =
    new AlunoResponsavelController(
        $alunoRepository,
        $responsavelRepository,
        $alunoResponsavelRepository
    );


// -----------------------------------------------------
// TURMAS
// -----------------------------------------------------

$turmaRepository =
    new TurmaRepository(
        $database
    );


$turmaController =
    new TurmaController(
        $turmaRepository,
        $modalidadeRepository,
        $professorRepository
    );


$turmaExclusaoController =
    new TurmaExclusaoController(
        $database
    );


// -----------------------------------------------------
// MATRÍCULAS
// -----------------------------------------------------

$turmaAlunoRepository =
    new TurmaAlunoRepository(
        $database
    );


$turmaAlunoController =
    new TurmaAlunoController(
        $turmaAlunoRepository,
        $turmaRepository,
        $alunoRepository
    );


// -----------------------------------------------------
// HORÁRIOS
// -----------------------------------------------------

$horarioRepository =
    new HorarioRepository(
        $database
    );


$horarioController =
    new HorarioController(
        $horarioRepository,
        $turmaRepository
    );


// -----------------------------------------------------
// AULAS
// -----------------------------------------------------

$aulaRepository =
    new AulaRepository(
        $database
    );


$aulaController =
    new AulaController(
        $aulaRepository,
        $turmaRepository
    );


$aulaExclusaoController =
    new AulaExclusaoController(
        $database
    );


// -----------------------------------------------------
// PRESENÇAS
// -----------------------------------------------------

$presencaRepository =
    new PresencaRepository(
        $database
    );


$presencaController =
    new PresencaController(
        $presencaRepository,
        $aulaRepository
    );


// -----------------------------------------------------
// DISPOSITIVOS / TABLET
// -----------------------------------------------------

$dispositivoRepository =
    new DispositivoRepository(
        $database
    );


$dispositivoController =
    new DispositivoController(
        $dispositivoRepository
    );


$tabletController =
    new TabletController(
        $dispositivoRepository,
        $aulaRepository,
        $presencaRepository
    );


$tabletCorrecaoController =
    new TabletCorrecaoController(
        $database
    );


// -----------------------------------------------------
// GERAÇÃO AUTOMÁTICA
// -----------------------------------------------------

$geracaoAulasRepository =
    new GeracaoAulasRepository(
        $database
    );


$geracaoAulasController =
    new GeracaoAulasController(
        $geracaoAulasRepository
    );


// -----------------------------------------------------
// AUTENTICAÇÃO
// -----------------------------------------------------

$usuarioRepository =
    new UsuarioRepository(
        $database
    );


$authController =
    new AuthController(
        $usuarioRepository
    );

$usuarioController =
    new UsuarioController(
        $usuarioRepository
    );

$authMiddleware =
    new AuthMiddleware(
        $app->getResponseFactory(),
        $usuarioRepository
    );

// =====================================================
// BASE PATH
// =====================================================

if (
    $basePath !== ''
) {

    $app->setBasePath(
        $basePath
    );
}


// =====================================================
// BODY PARSING
// =====================================================

$app->addBodyParsingMiddleware();

// =====================================================
// AUTENTICAÇÃO
// =====================================================

$app->add(
    $authMiddleware
);

// =====================================================
// ROUTING
// =====================================================

$app->addRoutingMiddleware();


// =====================================================
// ERROS
// =====================================================

$app->addErrorMiddleware(
    $debug,
    $debug,
    $debug
);


// =====================================================
// CORS
// =====================================================

$app->add(
    function (
        Request $request,
        RequestHandlerInterface $handler
    ) use (
        $app,
        $frontendOrigin
    ): Response {

        // ---------------------------------------------
        // PREFLIGHT
        // ---------------------------------------------

        if (
            $request->getMethod()
            ===
            'OPTIONS'
        ) {

            $response =
                $app
                    ->getResponseFactory()
                    ->createResponse();

        } else {

            $response =
                $handler->handle(
                    $request
                );
        }


        return $response

            ->withHeader(
                'Access-Control-Allow-Origin',
                $frontendOrigin
            )

            // =========================================
            // NECESSÁRIO PARA A SESSÃO PHP
            // =========================================

            ->withHeader(
                'Access-Control-Allow-Credentials',
                'true'
            )

            ->withHeader(
                'Access-Control-Allow-Headers',
                'Content-Type, Accept, Origin, Authorization'
            )

            ->withHeader(
                'Access-Control-Allow-Methods',
                'GET, POST, PUT, DELETE, OPTIONS'
            );
    }
);


// =====================================================
// STATUS DA API
// =====================================================

$app->get(
    '/api/status',

    function (
        Request $request,
        Response $response
    ) {

        $dados = [
            'api' =>
                'Estúdio Suzuki',

            'status' =>
                'online',

            'versao' =>
                '1.0'
        ];


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
            );
    }
);


// =====================================================
// TESTE DO BANCO
// =====================================================

$app->get(
    '/api/database',

    function (
        Request $request,
        Response $response
    ) use (
        $debug
    ) {

        try {

            $database =
                new Database();


            $pdo =
                $database->connect();


            $resultado =
                $pdo->query(
                    'SELECT DATABASE() AS banco'
                );


            $dadosBanco =
                $resultado->fetch();


            $dados = [
                'status' =>
                    'conectado',

                'database' =>
                    $dadosBanco['banco']
            ];


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
                );

        } catch (
            Throwable $erro
        ) {

            $dados = [
                'status' =>
                    'erro',

                'mensagem' =>
                    $debug
                        ? $erro->getMessage()
                        : 'Não foi possível conectar ao banco de dados.'
            ];


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
                    500
                );
        }
    }
);


// =====================================================
// AUTENTICAÇÃO
// =====================================================

$app->post(
    '/api/auth/login',
    [
        $authController,
        'login'
    ]
);


$app->get(
    '/api/auth/me',
    [
        $authController,
        'me'
    ]
);


$app->post(
    '/api/auth/logout',
    [
        $authController,
        'logout'
    ]
);


// =====================================================
// MODALIDADES
// =====================================================

$app->get(
    '/api/modalidades',
    [
        $modalidadeController,
        'listar'
    ]
);


$app->get(
    '/api/modalidades/{id}',
    [
        $modalidadeController,
        'buscar'
    ]
);


$app->post(
    '/api/modalidades',
    [
        $modalidadeController,
        'criar'
    ]
);


$app->put(
    '/api/modalidades/{id}',
    [
        $modalidadeController,
        'atualizar'
    ]
);


$app->delete(
    '/api/modalidades/{id}',
    [
        $modalidadeController,
        'excluir'
    ]
);


// =====================================================
// PROFESSORES
// =====================================================

$app->get(
    '/api/professores',
    [
        $professorController,
        'listar'
    ]
);


$app->get(
    '/api/professores/{id}',
    [
        $professorController,
        'buscar'
    ]
);


$app->post(
    '/api/professores',
    [
        $professorController,
        'criar'
    ]
);


$app->put(
    '/api/professores/{id}',
    [
        $professorController,
        'atualizar'
    ]
);


$app->delete(
    '/api/professores/{id}',
    [
        $professorController,
        'excluir'
    ]
);


// Exclusão física controlada.
// Somente professor inativo, sem turmas, aulas ou usuário vinculado.
$app->delete(
    '/api/professores/{id}/definitivo',
    [
        $professorExclusaoController,
        'excluirDefinitivamente'
    ]
);


// =====================================================
// ALUNOS
// =====================================================

$app->get(
    '/api/alunos',
    [
        $alunoController,
        'listar'
    ]
);


$app->get(
    '/api/alunos/{id}',
    [
        $alunoController,
        'buscar'
    ]
);


$app->post(
    '/api/alunos',
    [
        $alunoController,
        'criar'
    ]
);


$app->put(
    '/api/alunos/{id}',
    [
        $alunoController,
        'atualizar'
    ]
);


// -----------------------------------------------------
// FOTO DO ALUNO
//
// POST   /api/alunos/{id}/foto   -> enviar/trocar foto
// DELETE /api/alunos/{id}/foto   -> remover foto
// -----------------------------------------------------

$app->post(
    '/api/alunos/{id}/foto',
    [
        $alunoController,
        'foto'
    ]
);


$app->delete(
    '/api/alunos/{id}/foto',
    [
        $alunoController,
        'removerFoto'
    ]
);


$app->delete(
    '/api/alunos/{id}',
    [
        $alunoController,
        'excluir'
    ]
);


// Exclusão física controlada.
// Somente aluno inativo e sem qualquer histórico de aula/presença.
$app->delete(
    '/api/alunos/{id}/definitivo',
    [
        $alunoExclusaoController,
        'excluirDefinitivamente'
    ]
);


// =====================================================
// RESPONSÁVEIS
// =====================================================

$app->get(
    '/api/responsaveis',
    [
        $responsavelController,
        'listar'
    ]
);


$app->get(
    '/api/responsaveis/{id}',
    [
        $responsavelController,
        'buscar'
    ]
);


$app->post(
    '/api/responsaveis',
    [
        $responsavelController,
        'criar'
    ]
);


$app->put(
    '/api/responsaveis/{id}',
    [
        $responsavelController,
        'atualizar'
    ]
);


$app->delete(
    '/api/responsaveis/{id}',
    [
        $responsavelController,
        'excluir'
    ]
);


// =====================================================
// ALUNO x RESPONSÁVEL
// =====================================================

$app->get(
    '/api/alunos/{alunoId}/responsaveis',
    [
        $alunoResponsavelController,
        'listar'
    ]
);


$app->get(
    '/api/alunos/{alunoId}/responsaveis/{responsavelId}',
    [
        $alunoResponsavelController,
        'buscar'
    ]
);


$app->post(
    '/api/alunos/{alunoId}/responsaveis',
    [
        $alunoResponsavelController,
        'criar'
    ]
);


$app->put(
    '/api/alunos/{alunoId}/responsaveis/{responsavelId}',
    [
        $alunoResponsavelController,
        'atualizar'
    ]
);


$app->delete(
    '/api/alunos/{alunoId}/responsaveis/{responsavelId}',
    [
        $alunoResponsavelController,
        'excluir'
    ]
);


// =====================================================
// TURMAS
// =====================================================

$app->get(
    '/api/turmas',
    [
        $turmaController,
        'listar'
    ]
);


$app->get(
    '/api/turmas/{id}',
    [
        $turmaController,
        'buscar'
    ]
);


$app->post(
    '/api/turmas',
    [
        $turmaController,
        'criar'
    ]
);


$app->put(
    '/api/turmas/{id}',
    [
        $turmaController,
        'atualizar'
    ]
);


$app->delete(
    '/api/turmas/{id}',
    [
        $turmaController,
        'excluir'
    ]
);


// Exclusão física controlada.
// Somente turma inativa e sem qualquer aula.
$app->delete(
    '/api/turmas/{id}/definitivo',
    [
        $turmaExclusaoController,
        'excluirDefinitivamente'
    ]
);


// =====================================================
// TURMA x ALUNOS
// =====================================================

$app->get(
    '/api/turmas/{turmaId}/alunos',
    [
        $turmaAlunoController,
        'listar'
    ]
);


$app->get(
    '/api/turmas/{turmaId}/alunos/{matriculaId}',
    [
        $turmaAlunoController,
        'buscar'
    ]
);


$app->post(
    '/api/turmas/{turmaId}/alunos',
    [
        $turmaAlunoController,
        'criar'
    ]
);


$app->put(
    '/api/turmas/{turmaId}/alunos/{matriculaId}',
    [
        $turmaAlunoController,
        'atualizar'
    ]
);


$app->delete(
    '/api/turmas/{turmaId}/alunos/{matriculaId}',
    [
        $turmaAlunoController,
        'excluir'
    ]
);


// =====================================================
// HORÁRIOS
// =====================================================

$app->get(
    '/api/turmas/{turmaId}/horarios',
    [
        $horarioController,
        'listar'
    ]
);


$app->get(
    '/api/turmas/{turmaId}/horarios/{horarioId}',
    [
        $horarioController,
        'buscar'
    ]
);


$app->post(
    '/api/turmas/{turmaId}/horarios',
    [
        $horarioController,
        'criar'
    ]
);


$app->put(
    '/api/turmas/{turmaId}/horarios/{horarioId}',
    [
        $horarioController,
        'atualizar'
    ]
);


$app->delete(
    '/api/turmas/{turmaId}/horarios/{horarioId}',
    [
        $horarioController,
        'excluir'
    ]
);


// =====================================================
// AULAS
// =====================================================

$app->get(
    '/api/aulas',
    [
        $aulaController,
        'listar'
    ]
);


$app->get(
    '/api/aulas/{id}',
    [
        $aulaController,
        'buscar'
    ]
);


$app->post(
    '/api/aulas',
    [
        $aulaController,
        'criar'
    ]
);


$app->put(
    '/api/aulas/{id}',
    [
        $aulaController,
        'atualizar'
    ]
);


$app->post(
    '/api/aulas/{id}/abrir',
    [
        $aulaController,
        'abrir'
    ]
);


$app->get(
    '/api/aulas/{id}/alunos',
    [
        $aulaController,
        'listarAlunos'
    ]
);


$app->post(
    '/api/aulas/{id}/encerrar',
    [
        $aulaController,
        'encerrar'
    ]
);


$app->post(
    '/api/aulas/{id}/cancelar',
    [
        $aulaController,
        'cancelar'
    ]
);


// Exclusão física controlada.
// Somente aula agendada/cancelada que nunca foi aberta
// e que não possui snapshot/presenças.
$app->delete(
    '/api/aulas/{id}/definitivo',
    [
        $aulaExclusaoController,
        'excluirDefinitivamente'
    ]
);


// =====================================================
// PRESENÇAS
// =====================================================

$app->get(
    '/api/aulas/{aulaId}/presencas',
    [
        $presencaController,
        'listar'
    ]
);


$app->post(
    '/api/aulas/{aulaId}/presencas/aluno',
    [
        $presencaController,
        'registrarAluno'
    ]
);


$app->put(
    '/api/aulas/{aulaId}/presencas/{aulaAlunoId}',
    [
        $presencaController,
        'registrarProfessor'
    ]
);


// =====================================================
// DISPOSITIVOS
// =====================================================

$app->get(
    '/api/dispositivos',
    [
        $dispositivoController,
        'listar'
    ]
);


$app->get(
    '/api/dispositivos/{id}',
    [
        $dispositivoController,
        'buscar'
    ]
);


$app->post(
    '/api/dispositivos',
    [
        $dispositivoController,
        'criar'
    ]
);


$app->put(
    '/api/dispositivos/{id}',
    [
        $dispositivoController,
        'atualizar'
    ]
);


$app->delete(
    '/api/dispositivos/{id}',
    [
        $dispositivoController,
        'excluir'
    ]
);


// =====================================================
// TABLET
//
// Continuará público quando colocarmos o middleware
// de autenticação administrativa.
// =====================================================

$app->get(
    '/api/tablet/{identificador}/aulas/{aulaId}',
    [
        $tabletController,
        'aula'
    ]
);


$app->post(
    '/api/tablet/{identificador}/aulas/{aulaId}/presencas',
    [
        $tabletController,
        'registrarPresenca'
    ]
);


// -----------------------------------------------------
// DESFAZER UM TOQUE FEITO POR ENGANO
// -----------------------------------------------------

$app->post(
    '/api/tablet/{identificador}/aulas/{aulaId}/presencas/desfazer',
    [
        $tabletCorrecaoController,
        'desfazer'
    ]
);


// =====================================================
// MATRÍCULAS POR ALUNO
// =====================================================

$app->get(
    '/api/alunos/{alunoId}/turmas',
    [
        $turmaAlunoController,
        'listarPorAluno'
    ]
);


// =====================================================
// GERAÇÃO AUTOMÁTICA
// =====================================================

$app->post(
    '/api/agenda/gerar-aulas',
    [
        $geracaoAulasController,
        'gerar'
    ]
);


// =====================================================
// OPTIONS
// =====================================================

$app->options(
    '/{routes:.+}',

    function (
        Request $request,
        Response $response
    ) {

        return $response;
    }
);


// =====================================================
// USUÁRIOS
//
// Estas rotas são administrativas.
// O AuthMiddleware exige login.
// =====================================================

$app->get(
    '/api/usuarios',
    [
        $usuarioController,
        'listar'
    ]
);


$app->get(
    '/api/usuarios/{id}',
    [
        $usuarioController,
        'buscar'
    ]
);


$app->post(
    '/api/usuarios',
    [
        $usuarioController,
        'criar'
    ]
);


$app->put(
    '/api/usuarios/{id}',
    [
        $usuarioController,
        'atualizar'
    ]
);


$app->delete(
    '/api/usuarios/{id}',
    [
        $usuarioController,
        'excluir'
    ]
);

// =====================================================
// EXECUTA A APLICAÇÃO
// =====================================================

$app->run();