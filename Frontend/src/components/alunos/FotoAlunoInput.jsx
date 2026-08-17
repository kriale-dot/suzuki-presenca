import {
    useEffect,
    useMemo,
    useState
} from 'react';

import {
    apiArquivoUrl
} from '../../services/api';

import {
    obterIniciais
} from '../../utils/formatters';


const TIPOS_PERMITIDOS = [
    'image/jpeg',
    'image/png',
    'image/webp'
];


const TAMANHO_MAXIMO =
    3 * 1024 * 1024;


function FotoAlunoInput({
    nome,
    fotoAtual,
    arquivo,
    removerFoto = false,
    disabled = false,
    onSelecionarArquivo,
    onRemoverFoto
}) {

    const [erro, setErro] =
        useState('');


    const [previewArquivo, setPreviewArquivo] =
        useState('');


    useEffect(
        () => {

            if (!arquivo) {
                setPreviewArquivo('');
                return undefined;
            }


            const url =
                URL.createObjectURL(
                    arquivo
                );


            setPreviewArquivo(
                url
            );


            return () => {
                URL.revokeObjectURL(
                    url
                );
            };

        },
        [arquivo]
    );


    const fotoExibida =
        useMemo(
            () => {

                if (previewArquivo) {
                    return previewArquivo;
                }


                if (
                    !removerFoto
                    &&
                    fotoAtual
                ) {

                    return apiArquivoUrl(
                        fotoAtual
                    );
                }


                return '';

            },
            [
                previewArquivo,
                removerFoto,
                fotoAtual
            ]
        );


    function selecionarFoto(
        event
    ) {

        const file =
            event.target.files?.[0]
            ||
            null;


        event.target.value = '';


        if (!file) {
            return;
        }


        setErro('');


        if (
            !TIPOS_PERMITIDOS.includes(
                file.type
            )
        ) {

            setErro(
                'Use uma foto JPG, PNG ou WebP.'
            );

            return;
        }


        if (
            file.size > TAMANHO_MAXIMO
        ) {

            setErro(
                'A foto deve possuir no máximo 3 MB.'
            );

            return;
        }


        onSelecionarArquivo?.(
            file
        );
    }


    function remover() {
        setErro('');
        onRemoverFoto?.();
    }


    return (

        <div className="foto-aluno-campo">

            <div className="foto-aluno-preview">

                {
                    fotoExibida

                        ? (
                            <img
                                src={fotoExibida}
                                alt={`Foto de ${nome || 'aluno'}`}
                            />
                        )

                        : (
                            <span>
                                {obterIniciais(nome || 'Aluno')}
                            </span>
                        )
                }

            </div>


            <div className="foto-aluno-controles">

                <div>
                    <strong>Foto do aluno</strong>

                    <p>
                        JPG, PNG ou WebP. Máximo de 3 MB.
                    </p>
                </div>


                <div className="foto-aluno-acoes">

                    <label
                        className={
                            `botao-secundario foto-aluno-botao${
                                disabled
                                    ? ' desabilitado'
                                    : ''
                            }`
                        }
                    >
                        {
                            fotoExibida
                                ? 'Trocar foto'
                                : 'Selecionar foto'
                        }

                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={selecionarFoto}
                            disabled={disabled}
                        />
                    </label>


                    {
                        fotoExibida
                        &&
                        (
                            <button
                                type="button"
                                className="botao-link-perigo"
                                onClick={remover}
                                disabled={disabled}
                            >
                                Remover foto
                            </button>
                        )
                    }

                </div>


                {
                    erro
                    &&
                    (
                        <span className="foto-aluno-erro">
                            {erro}
                        </span>
                    )
                }

            </div>

        </div>
    );
}


export default FotoAlunoInput;
