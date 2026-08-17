<?php

namespace App\Controllers;

use App\Config\Env;
use App\Repositories\AlunoRepository;
use DateTime;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\UploadedFileInterface;
use Throwable;

class AlunoController
{
    private const FOTO_MAX_BYTES = 3145728; // 3 MB

    private const FOTO_MIMES = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    private AlunoRepository $repository;

    public function __construct(
        AlunoRepository $repository
    ) {
        $this->repository = $repository;
    }

    // ==================================================
    // JSON
    // ==================================================

    private function json(
        Response $response,
        array $dados,
        int $status = 200
    ): Response {
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
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }

    // ==================================================
    // DATA
    // ==================================================

    private function dataValida(string $data): bool
    {
        $objetoData = DateTime::createFromFormat(
            'Y-m-d',
            $data
        );

        return
            $objetoData !== false &&
            $objetoData->format('Y-m-d') === $data;
    }

    // ==================================================
    // DIRETÓRIO DAS FOTOS
    // ==================================================

    private function diretorioFotos(): string
    {
        return dirname(__DIR__, 2)
            . DIRECTORY_SEPARATOR
            . 'public'
            . DIRECTORY_SEPARATOR
            . 'uploads'
            . DIRECTORY_SEPARATOR
            . 'alunos';
    }

    // ==================================================
    // MIME REAL DA IMAGEM
    // ==================================================

    private function detectarMime(
        UploadedFileInterface $arquivo
    ): ?string {
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $stream = $arquivo->getStream();
        $uri = $stream->getMetadata('uri');

        if (
            is_string($uri) &&
            $uri !== '' &&
            is_file($uri)
        ) {
            $mime = $finfo->file($uri);

            return is_string($mime)
                ? $mime
                : null;
        }

        $stream->rewind();

        $conteudo = $stream->read(
            min(
                max((int) ($arquivo->getSize() ?? 0), 1),
                65536
            )
        );

        $stream->rewind();

        $mime = $finfo->buffer($conteudo);

        return is_string($mime)
            ? $mime
            : null;
    }

    // ==================================================
    // VALIDAR FOTO
    // ==================================================

    private function validarFoto(
        UploadedFileInterface $arquivo
    ): array {
        if ($arquivo->getError() !== UPLOAD_ERR_OK) {
            return [
                'valida' => false,
                'mensagem' => 'Não foi possível receber a foto enviada.',
            ];
        }

        $tamanho = (int) ($arquivo->getSize() ?? 0);

        if ($tamanho <= 0) {
            return [
                'valida' => false,
                'mensagem' => 'A foto enviada está vazia.',
            ];
        }

        if ($tamanho > self::FOTO_MAX_BYTES) {
            return [
                'valida' => false,
                'mensagem' => 'A foto deve possuir no máximo 3 MB.',
            ];
        }

        $mime = $this->detectarMime($arquivo);

        if (
            $mime === null ||
            !array_key_exists($mime, self::FOTO_MIMES)
        ) {
            return [
                'valida' => false,
                'mensagem' => 'Use uma foto JPG, PNG ou WebP.',
            ];
        }

        return [
            'valida' => true,
            'mime' => $mime,
            'extensao' => self::FOTO_MIMES[$mime],
        ];
    }

    // ==================================================
    // SALVAR FOTO NO DISCO
    //
    // No banco guardamos somente:
    // /uploads/alunos/nome-do-arquivo.jpg
    //
    // O frontend monta a URL absoluta a partir de
    // VITE_API_URL, evitando prender as fotos a um IP
    // ou domínio específico.
    // ==================================================

    private function salvarFoto(
        UploadedFileInterface $arquivo,
        int $alunoId,
        string $extensao
    ): string {
        $diretorio = $this->diretorioFotos();

        if (
            !is_dir($diretorio) &&
            !mkdir($diretorio, 0755, true) &&
            !is_dir($diretorio)
        ) {
            throw new \RuntimeException(
                'Não foi possível criar o diretório de fotos dos alunos.'
            );
        }

        if (!is_writable($diretorio)) {
            throw new \RuntimeException(
                'O diretório de fotos dos alunos não possui permissão de escrita.'
            );
        }

        $nomeArquivo = sprintf(
            'aluno-%d-%s.%s',
            $alunoId,
            bin2hex(random_bytes(8)),
            $extensao
        );

        $destino = $diretorio
            . DIRECTORY_SEPARATOR
            . $nomeArquivo;

        $arquivo->moveTo($destino);

        return '/uploads/alunos/' . $nomeArquivo;
    }

    // ==================================================
    // REMOVER ARQUIVO LOCAL ANTIGO
    // ==================================================

    private function removerArquivoFotoLocal(
        ?string $fotoUrl
    ): void {
        if (!$fotoUrl) {
            return;
        }

        $caminho = parse_url(
            $fotoUrl,
            PHP_URL_PATH
        );

        if (!is_string($caminho)) {
            return;
        }

        if (!str_contains($caminho, '/uploads/alunos/')) {
            return;
        }

        $nomeArquivo = basename($caminho);

        if ($nomeArquivo === '') {
            return;
        }

        $arquivo = $this->diretorioFotos()
            . DIRECTORY_SEPARATOR
            . $nomeArquivo;

        if (is_file($arquivo)) {
            @unlink($arquivo);
        }
    }

    // ==================================================
    // GET /api/alunos
    // ==================================================

    public function listar(
        Request $request,
        Response $response
    ): Response {
        try {
            $alunos = $this->repository->listar();

            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'total' => count($alunos),
                    'dados' => $alunos,
                ]
            );

        } catch (Throwable $erro) {
            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' => 'Não foi possível consultar os alunos.',
                    'detalhe' => $erro->getMessage(),
                ],
                500
            );
        }
    }

    // ==================================================
    // GET /api/alunos/{id}
    // ==================================================

    public function buscar(
        Request $request,
        Response $response,
        array $args
    ): Response {
        try {
            $id = (int) $args['id'];
            $aluno = $this->repository->buscarPorId($id);

            if ($aluno === null) {
                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' => 'Aluno não encontrado.',
                    ],
                    404
                );
            }

            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'dados' => $aluno,
                ]
            );

        } catch (Throwable $erro) {
            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' => 'Erro ao consultar aluno.',
                    'detalhe' => $erro->getMessage(),
                ],
                500
            );
        }
    }

    // ==================================================
    // POST /api/alunos
    //
    // Aceita JSON tradicional ou multipart/form-data.
    // No multipart, o campo do arquivo deve se chamar "foto".
    // ==================================================

    public function criar(
        Request $request,
        Response $response
    ): Response {
        $idCriado = null;
        $fotoNova = null;

        try {
            $dados = $request->getParsedBody();

            if (!is_array($dados)) {
                $dados = [];
            }

            $nome = trim(
                (string) ($dados['nome'] ?? '')
            );

            $dataNascimento = trim(
                (string) ($dados['data_nascimento'] ?? '')
            );

            if ($nome === '') {
                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' => 'O nome do aluno é obrigatório.',
                    ],
                    422
                );
            }

            if (mb_strlen($nome) > 150) {
                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' => 'O nome deve possuir no máximo 150 caracteres.',
                    ],
                    422
                );
            }

            if (
                $dataNascimento !== '' &&
                !$this->dataValida($dataNascimento)
            ) {
                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' => 'A data de nascimento deve estar no formato YYYY-MM-DD.',
                    ],
                    422
                );
            }

            $arquivos = $request->getUploadedFiles();
            $foto = $arquivos['foto'] ?? null;
            $validacaoFoto = null;

            if ($foto instanceof UploadedFileInterface) {
                $validacaoFoto = $this->validarFoto($foto);

                if (!$validacaoFoto['valida']) {
                    return $this->json(
                        $response,
                        [
                            'sucesso' => false,
                            'mensagem' => $validacaoFoto['mensagem'],
                        ],
                        422
                    );
                }
            }

            $dataNascimento = $dataNascimento === ''
                ? null
                : $dataNascimento;

            $idCriado = $this->repository->criar(
                $nome,
                $dataNascimento,
                null
            );

            if (
                $foto instanceof UploadedFileInterface &&
                $validacaoFoto !== null
            ) {
                $fotoNova = $this->salvarFoto(
                    $foto,
                    $idCriado,
                    $validacaoFoto['extensao']
                );

                $this->repository->atualizarFoto(
                    $idCriado,
                    $fotoNova
                );
            }

            $aluno = $this->repository->buscarPorId($idCriado);

            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' => 'Aluno criado com sucesso.',
                    'dados' => $aluno,
                ],
                201
            );

        } catch (Throwable $erro) {
            // Se o cadastro acabou de ser criado e a etapa da foto falhou,
            // desfazemos o registro para não deixar cadastro parcial.
            if ($idCriado !== null) {
                try {
                    $this->repository->excluirFisicamente($idCriado);
                } catch (Throwable) {
                    // Mantemos o erro original.
                }
            }

            if ($fotoNova !== null) {
                $this->removerArquivoFotoLocal($fotoNova);
            }

            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' => 'Erro ao criar aluno.',
                    'detalhe' => $erro->getMessage(),
                ],
                500
            );
        }
    }

    // ==================================================
    // PUT /api/alunos/{id}
    //
    // Dados cadastrais. A foto é gerenciada pelos
    // endpoints específicos de foto abaixo.
    // ==================================================

    public function atualizar(
        Request $request,
        Response $response,
        array $args
    ): Response {
        try {
            $id = (int) $args['id'];
            $alunoAtual = $this->repository->buscarPorId($id);

            if ($alunoAtual === null) {
                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' => 'Aluno não encontrado.',
                    ],
                    404
                );
            }

            $dados = $request->getParsedBody();

            if (!is_array($dados)) {
                $dados = [];
            }

            $nome = array_key_exists('nome', $dados)
                ? trim((string) $dados['nome'])
                : $alunoAtual['nome'];

            $dataNascimento = array_key_exists('data_nascimento', $dados)
                ? trim((string) $dados['data_nascimento'])
                : $alunoAtual['data_nascimento'];

            // Não aceitamos alteração arbitrária de foto_url pelo JSON.
            // A foto é alterada apenas pelo upload validado.
            $fotoUrl = $alunoAtual['foto_url'];

            $ativo = (int) (
                $dados['ativo']
                ?? $alunoAtual['ativo']
            );

            if ($nome === '') {
                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' => 'O nome do aluno é obrigatório.',
                    ],
                    422
                );
            }

            if (mb_strlen($nome) > 150) {
                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' => 'O nome deve possuir no máximo 150 caracteres.',
                    ],
                    422
                );
            }

            if (
                $dataNascimento !== null &&
                $dataNascimento !== '' &&
                !$this->dataValida($dataNascimento)
            ) {
                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' => 'A data de nascimento deve estar no formato YYYY-MM-DD.',
                    ],
                    422
                );
            }

            if (!in_array($ativo, [0, 1], true)) {
                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' => 'O campo ativo deve ser 0 ou 1.',
                    ],
                    422
                );
            }

            $dataNascimento = $dataNascimento === ''
                ? null
                : $dataNascimento;

            $this->repository->atualizar(
                $id,
                $nome,
                $dataNascimento,
                $fotoUrl,
                $ativo
            );

            $aluno = $this->repository->buscarPorId($id);

            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' => 'Aluno atualizado com sucesso.',
                    'dados' => $aluno,
                ]
            );

        } catch (Throwable $erro) {
            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' => 'Erro ao atualizar aluno.',
                    'detalhe' => $erro->getMessage(),
                ],
                500
            );
        }
    }

    // ==================================================
    // POST /api/alunos/{id}/foto
    // ==================================================

    public function foto(
        Request $request,
        Response $response,
        array $args
    ): Response {
        $fotoNova = null;

        try {
            $id = (int) $args['id'];
            $aluno = $this->repository->buscarPorId($id);

            if ($aluno === null) {
                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' => 'Aluno não encontrado.',
                    ],
                    404
                );
            }

            $arquivos = $request->getUploadedFiles();
            $foto = $arquivos['foto'] ?? null;

            if (!$foto instanceof UploadedFileInterface) {
                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' => 'Selecione uma foto para enviar.',
                    ],
                    422
                );
            }

            $validacao = $this->validarFoto($foto);

            if (!$validacao['valida']) {
                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' => $validacao['mensagem'],
                    ],
                    422
                );
            }

            $fotoNova = $this->salvarFoto(
                $foto,
                $id,
                $validacao['extensao']
            );

            try {
                $this->repository->atualizarFoto(
                    $id,
                    $fotoNova
                );
            } catch (Throwable $erro) {
                $this->removerArquivoFotoLocal($fotoNova);
                $fotoNova = null;
                throw $erro;
            }

            // Só removemos a foto anterior depois de o banco
            // apontar com sucesso para o novo arquivo.
            $this->removerArquivoFotoLocal(
                $aluno['foto_url'] ?? null
            );

            $alunoAtualizado = $this->repository->buscarPorId($id);

            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' => 'Foto atualizada com sucesso.',
                    'dados' => $alunoAtualizado,
                ]
            );

        } catch (Throwable $erro) {
            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' => 'Erro ao atualizar a foto do aluno.',
                    'detalhe' => $erro->getMessage(),
                ],
                500
            );
        }
    }

    // ==================================================
    // DELETE /api/alunos/{id}/foto
    // ==================================================

    public function removerFoto(
        Request $request,
        Response $response,
        array $args
    ): Response {
        try {
            $id = (int) $args['id'];
            $aluno = $this->repository->buscarPorId($id);

            if ($aluno === null) {
                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' => 'Aluno não encontrado.',
                    ],
                    404
                );
            }

            $fotoAnterior = $aluno['foto_url'] ?? null;

            $this->repository->atualizarFoto(
                $id,
                null
            );

            $this->removerArquivoFotoLocal(
                $fotoAnterior
            );

            $alunoAtualizado = $this->repository->buscarPorId($id);

            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' => 'Foto removida com sucesso.',
                    'dados' => $alunoAtualizado,
                ]
            );

        } catch (Throwable $erro) {
            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' => 'Erro ao remover a foto do aluno.',
                    'detalhe' => $erro->getMessage(),
                ],
                500
            );
        }
    }

    // ==================================================
    // DELETE /api/alunos/{id}
    // ==================================================

    public function excluir(
        Request $request,
        Response $response,
        array $args
    ): Response {
        try {
            $id = (int) $args['id'];
            $aluno = $this->repository->buscarPorId($id);

            if ($aluno === null) {
                return $this->json(
                    $response,
                    [
                        'sucesso' => false,
                        'mensagem' => 'Aluno não encontrado.',
                    ],
                    404
                );
            }

            if ((int) $aluno['ativo'] === 0) {
                return $this->json(
                    $response,
                    [
                        'sucesso' => true,
                        'mensagem' => 'O aluno já estava inativo.',
                        'dados' => $aluno,
                    ]
                );
            }

            $this->repository->desativar($id);

            $alunoAtualizado = $this->repository->buscarPorId($id);

            return $this->json(
                $response,
                [
                    'sucesso' => true,
                    'mensagem' => 'Aluno desativado com sucesso.',
                    'dados' => $alunoAtualizado,
                ]
            );

        } catch (Throwable $erro) {
            return $this->json(
                $response,
                [
                    'sucesso' => false,
                    'mensagem' => 'Erro ao desativar aluno.',
                    'detalhe' => $erro->getMessage(),
                ],
                500
            );
        }
    }
}
