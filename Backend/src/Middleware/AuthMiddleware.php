<?php

namespace App\Middleware;

use App\Repositories\UsuarioRepository;

use Psr\Http\Message\ResponseFactoryInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;


class AuthMiddleware implements MiddlewareInterface
{
    private ResponseFactoryInterface $responseFactory;

    private UsuarioRepository $usuarioRepository;


    public function __construct(
        ResponseFactoryInterface $responseFactory,
        UsuarioRepository $usuarioRepository
    ) {
        $this->responseFactory =
            $responseFactory;

        $this->usuarioRepository =
            $usuarioRepository;
    }


    // ==================================================
    // CAMINHO DA API
    //
    // Extrai apenas a parte iniciada em /api.
    //
    // Exemplo:
    //
    // /estudio-suzuki-api/public/api/aulas
    //
    // torna-se:
    //
    // /api/aulas
    // ==================================================

    private function caminhoApi(
        ServerRequestInterface $request
    ): string {

        $path =
            rtrim(
                $request
                    ->getUri()
                    ->getPath(),
                '/'
            );


        $posicao =
            strpos(
                $path,
                '/api/'
            );


        if ($posicao !== false) {

            return substr(
                $path,
                $posicao
            );
        }


        if (
            str_ends_with(
                $path,
                '/api'
            )
        ) {

            return '/api';
        }


        return $path;
    }


    // ==================================================
    // ROTAS PÚBLICAS
    //
    // Estas rotas não exigem usuário autenticado.
    // ==================================================

    private function rotaPublica(
        ServerRequestInterface $request
    ): bool {

        $metodo =
            strtoupper(
                $request->getMethod()
            );


        $caminho =
            $this->caminhoApi(
                $request
            );


        // --------------------------------------------------
        // CORS / PREFLIGHT
        // --------------------------------------------------

        if ($metodo === 'OPTIONS') {

            return true;
        }


        // --------------------------------------------------
        // AUTENTICAÇÃO
        //
        // Login, logout e /me possuem tratamento próprio.
        // --------------------------------------------------

        if (
            preg_match(
                '#^/api/auth(?:/|$)#',
                $caminho
            )
        ) {

            return true;
        }


        // --------------------------------------------------
        // TABLET
        //
        // O tablet possui sua própria validação por
        // identificador de dispositivo e aula.
        // --------------------------------------------------

        if (
            preg_match(
                '#^/api/tablet(?:/|$)#',
                $caminho
            )
        ) {

            return true;
        }


        // --------------------------------------------------
        // STATUS DA API
        // --------------------------------------------------

        if (
            $caminho === '/api/status'
        ) {

            return true;
        }


        return false;
    }


    // ==================================================
    // RESPOSTA JSON PADRÃO
    // ==================================================

    private function responder(
        int $status,
        string $mensagem
    ): ResponseInterface {

        $response =
            $this
                ->responseFactory
                ->createResponse(
                    $status
                );


        $response
            ->getBody()
            ->write(
                json_encode(
                    [
                        'sucesso' =>
                            false,

                        'mensagem' =>
                            $mensagem
                    ],
                    JSON_UNESCAPED_UNICODE
                    |
                    JSON_UNESCAPED_SLASHES
                )
            );


        return $response

            ->withHeader(
                'Content-Type',
                'application/json; charset=utf-8'
            )

            ->withStatus(
                $status
            );
    }


    // ==================================================
    // ENCERRAR SESSÃO
    //
    // Usado quando a conta:
    //
    // - foi desativada
    // - deixou de existir
    // - perdeu vínculo válido
    // - possui perfil inválido
    // ==================================================

    private function encerrarSessao(): void
    {
        $_SESSION = [];


        // --------------------------------------------------
        // REMOVE COOKIE DA SESSÃO
        // --------------------------------------------------

        if (
            ini_get(
                'session.use_cookies'
            )
        ) {

            $parametros =
                session_get_cookie_params();


            setcookie(
                session_name(),
                '',
                time() - 42000,
                $parametros['path'],
                $parametros['domain'],
                $parametros['secure'],
                $parametros['httponly']
            );
        }


        // --------------------------------------------------
        // DESTRÓI SESSÃO PHP
        // --------------------------------------------------

        if (
            session_status()
            ===
            PHP_SESSION_ACTIVE
        ) {

            session_destroy();
        }
    }


    // ==================================================
    // SINCRONIZAR SESSÃO COM O BANCO
    //
    // O banco é a fonte atual das permissões.
    //
    // Assim, alterações feitas pelo administrador passam
    // a valer já na próxima requisição do usuário.
    // ==================================================

    private function sincronizarSessao(
        array $usuario
    ): void {

        $perfil =
            (string) (
                $usuario['perfil']
                ??
                ''
            );


        $professorId =
            null;


        if (
            $perfil === 'professor'
            &&
            !empty(
                $usuario[
                    'professor_id'
                ]
            )
        ) {

            $professorId =
                (int)
                    $usuario[
                        'professor_id'
                    ];
        }


        $_SESSION['usuario_id'] =
            (int)
                $usuario['id'];


        $_SESSION['usuario_nome'] =
            (string)
                $usuario['nome'];


        $_SESSION['usuario_email'] =
            (string)
                $usuario['email'];


        $_SESSION['usuario_perfil'] =
            $perfil;


        $_SESSION['usuario_professor_id'] =
            $professorId;
    }


    // ==================================================
    // VALIDAR USUÁRIO ATUAL
    //
    // Executado em toda requisição protegida.
    //
    // Confere:
    //
    // - usuário existe
    // - usuário está ativo
    // - perfil é válido
    // - professor possui vínculo
    // - professor vinculado está ativo
    // ==================================================

    private function validarUsuarioAtual(): ?array
    {
        $usuarioId =
            (int) (
                $_SESSION[
                    'usuario_id'
                ]
                ??
                0
            );


        // --------------------------------------------------
        // NÃO EXISTE USUÁRIO NA SESSÃO
        // --------------------------------------------------

        if ($usuarioId <= 0) {

            return null;
        }


        // --------------------------------------------------
        // BUSCA NOVAMENTE NO BANCO
        // --------------------------------------------------

        $usuario =
            $this
                ->usuarioRepository
                ->buscarPorId(
                    $usuarioId
                );


        if ($usuario === null) {

            return null;
        }


        // --------------------------------------------------
        // USUÁRIO DESATIVADO
        // --------------------------------------------------

        if (
            (int) (
                $usuario['ativo']
                ??
                0
            )
            !==
            1
        ) {

            return null;
        }


        // --------------------------------------------------
        // PERFIL
        // --------------------------------------------------

        $perfil =
            (string) (
                $usuario['perfil']
                ??
                ''
            );


        if (
            !in_array(
                $perfil,
                [
                    'administrador',
                    'secretaria',
                    'professor'
                ],
                true
            )
        ) {

            return null;
        }


        // --------------------------------------------------
        // VALIDAÇÃO ESPECÍFICA DO PROFESSOR
        // --------------------------------------------------

        if (
            $perfil === 'professor'
        ) {

            $professorId =
                (int) (
                    $usuario[
                        'professor_id'
                    ]
                    ??
                    0
                );


            $professorAtivo =
                (int) (
                    $usuario[
                        'professor_ativo'
                    ]
                    ??
                    0
                );


            // Professor precisa estar vinculado.

            if ($professorId <= 0) {

                return null;
            }


            // Professor vinculado precisa estar ativo.

            if ($professorAtivo !== 1) {

                return null;
            }
        }


        return $usuario;
    }


    // ==================================================
    // PERMISSÕES DA SECRETARIA
    // ==================================================

    private function secretariaPode(
        string $caminho
    ): bool {

        // --------------------------------------------------
        // USUÁRIOS
        //
        // Somente administrador.
        // --------------------------------------------------

        if (
            preg_match(
                '#^/api/usuarios(?:/|$)#',
                $caminho
            )
        ) {

            return false;
        }


        // --------------------------------------------------
        // DISPOSITIVOS
        //
        // Somente administrador.
        // --------------------------------------------------

        if (
            preg_match(
                '#^/api/dispositivos(?:/|$)#',
                $caminho
            )
        ) {

            return false;
        }


        // --------------------------------------------------
        // TESTE TÉCNICO DO BANCO
        // --------------------------------------------------

        if (
            $caminho === '/api/database'
        ) {

            return false;
        }


        // --------------------------------------------------
        // RESTANTE DO SISTEMA
        // --------------------------------------------------

        return true;
    }


    // ==================================================
    // PERMISSÕES DO PROFESSOR
    //
    // O professor possui acesso somente às rotas
    // necessárias para:
    //
    // - consultar suas aulas
    // - abrir sua aula
    // - encerrar sua aula
    // - consultar alunos da aula
    // - consultar presenças
    // - corrigir presenças
    //
    // A verificação de propriedade da aula é feita
    // novamente nos Controllers.
    // ==================================================

    private function professorPode(
        string $metodo,
        string $caminho
    ): bool {

        // --------------------------------------------------
        // GET /api/aulas
        //
        // Lista filtrada pelo professor.
        // --------------------------------------------------

        if (
            $metodo === 'GET'
            &&
            $caminho === '/api/aulas'
        ) {

            return true;
        }


        // --------------------------------------------------
        // GET /api/aulas/{id}
        // --------------------------------------------------

        if (
            $metodo === 'GET'
            &&
            preg_match(
                '#^/api/aulas/\d+$#',
                $caminho
            )
        ) {

            return true;
        }


        // --------------------------------------------------
        // GET /api/aulas/{id}/alunos
        // --------------------------------------------------

        if (
            $metodo === 'GET'
            &&
            preg_match(
                '#^/api/aulas/\d+/alunos$#',
                $caminho
            )
        ) {

            return true;
        }


        // --------------------------------------------------
        // GET /api/aulas/{id}/presencas
        // --------------------------------------------------

        if (
            $metodo === 'GET'
            &&
            preg_match(
                '#^/api/aulas/\d+/presencas$#',
                $caminho
            )
        ) {

            return true;
        }


        // --------------------------------------------------
        // POST /api/aulas/{id}/abrir
        // --------------------------------------------------

        if (
            $metodo === 'POST'
            &&
            preg_match(
                '#^/api/aulas/\d+/abrir$#',
                $caminho
            )
        ) {

            return true;
        }


        // --------------------------------------------------
        // POST /api/aulas/{id}/encerrar
        // --------------------------------------------------

        if (
            $metodo === 'POST'
            &&
            preg_match(
                '#^/api/aulas/\d+/encerrar$#',
                $caminho
            )
        ) {

            return true;
        }


        // --------------------------------------------------
        // PUT /api/aulas/{aulaId}/presencas/{aulaAlunoId}
        // --------------------------------------------------

        if (
            $metodo === 'PUT'
            &&
            preg_match(
                '#^/api/aulas/\d+/presencas/\d+$#',
                $caminho
            )
        ) {

            return true;
        }


        // --------------------------------------------------
        // QUALQUER OUTRA ROTA É NEGADA
        // --------------------------------------------------

        return false;
    }


    // ==================================================
    // VERIFICAR PERMISSÃO POR PERFIL
    // ==================================================

    private function temPermissao(
        ServerRequestInterface $request,
        string $perfil
    ): bool {

        $metodo =
            strtoupper(
                $request->getMethod()
            );


        $caminho =
            $this->caminhoApi(
                $request
            );


        // --------------------------------------------------
        // ADMINISTRADOR
        //
        // Acesso completo.
        // --------------------------------------------------

        if (
            $perfil === 'administrador'
        ) {

            return true;
        }


        // --------------------------------------------------
        // SECRETARIA
        // --------------------------------------------------

        if (
            $perfil === 'secretaria'
        ) {

            return $this
                ->secretariaPode(
                    $caminho
                );
        }


        // --------------------------------------------------
        // PROFESSOR
        // --------------------------------------------------

        if (
            $perfil === 'professor'
        ) {

            return $this
                ->professorPode(
                    $metodo,
                    $caminho
                );
        }


        return false;
    }


    // ==================================================
    // PROCESSAR REQUISIÇÃO
    //
    // Esta função é executada automaticamente pelo Slim
    // antes das rotas protegidas.
    // ==================================================

    public function process(
        ServerRequestInterface $request,
        RequestHandlerInterface $handler
    ): ResponseInterface {

        // --------------------------------------------------
        // ROTAS PÚBLICAS
        // --------------------------------------------------

        if (
            $this->rotaPublica(
                $request
            )
        ) {

            return $handler->handle(
                $request
            );
        }


        // --------------------------------------------------
        // VERIFICA SE EXISTE SESSÃO
        // --------------------------------------------------

        if (
            empty(
                $_SESSION[
                    'usuario_id'
                ]
            )
        ) {

            return $this->responder(
                401,
                'Usuário não autenticado.'
            );
        }


        // ==================================================
        // REVALIDAR USUÁRIO NO BANCO
        // ==================================================

        $usuario =
            $this
                ->validarUsuarioAtual();


        // --------------------------------------------------
        // SESSÃO NÃO É MAIS VÁLIDA
        //
        // Exemplos:
        //
        // - usuário foi desativado
        // - usuário foi excluído
        // - professor foi desativado
        // - professor perdeu vínculo
        // --------------------------------------------------

        if ($usuario === null) {

            $this
                ->encerrarSessao();


            return $this->responder(
                401,
                'Sua sessão não é mais válida. Faça login novamente.'
            );
        }


        // ==================================================
        // ATUALIZAR SESSÃO
        //
        // Isso permite que alterações no perfil ou no
        // professor vinculado tenham efeito imediatamente.
        // ==================================================

        $this
            ->sincronizarSessao(
                $usuario
            );


        $perfil =
            (string) (
                $usuario['perfil']
                ??
                ''
            );


        // --------------------------------------------------
        // VERIFICA AUTORIZAÇÃO PARA A ROTA
        // --------------------------------------------------

        if (
            !$this->temPermissao(
                $request,
                $perfil
            )
        ) {

            return $this->responder(
                403,
                'Você não tem permissão para realizar esta operação.'
            );
        }


        // --------------------------------------------------
        // AUTORIZADO
        // --------------------------------------------------

        return $handler->handle(
            $request
        );
    }
}