import {
    useMemo,
    useState
} from 'react';

import {
    QRCodeSVG
} from 'qrcode.react';


function TabletLoginQrCard() {

    const [
        copiado,
        setCopiado
    ] = useState(false);


    const baseUrl =
        (
            import.meta.env.VITE_PUBLIC_APP_URL
            ||
            window.location.origin
        )
            .trim()
            .replace(/\/+$/, '');


    const loginUrl =
        useMemo(
            () => {
                return `${baseUrl}/login`;
            },
            [baseUrl]
        );


    async function copiarLink() {

        try {

            await navigator.clipboard.writeText(
                loginUrl
            );

            setCopiado(true);

            setTimeout(
                () => setCopiado(false),
                2500
            );

        } catch (erro) {

            console.error(
                'Erro ao copiar link:',
                erro
            );
        }
    }


    return (
        <section className="tablet-qrcode-card">

            <div className="tablet-qrcode-card-header">
                <div>
                    <h2>
                        Acesso rápido no tablet
                    </h2>

                    <p>
                        Escaneie este QR Code para abrir a tela de login
                        do Suzuki Presença em um tablet ou celular.
                    </p>
                </div>
            </div>


            <div className="tablet-qrcode-card-conteudo">

                <div className="tablet-qrcode-area">
                    <QRCodeSVG
                        value={loginUrl}
                        size={180}
                        includeMargin={true}
                    />
                </div>


                <div className="tablet-qrcode-info">

                    <label>
                        Link para o tablet
                    </label>

                    <div className="tablet-qrcode-link-box">
                        <code>
                            {loginUrl}
                        </code>
                    </div>

                    <div className="tablet-qrcode-acoes">

                        <button
                            type="button"
                            className="botao-secundario"
                            onClick={copiarLink}
                        >
                            {copiado ? 'Link copiado!' : 'Copiar link'}
                        </button>

                        <a
                            href={loginUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="botao-primario"
                        >
                            Abrir link
                        </a>

                    </div>

                    <small className="tablet-qrcode-aviso">
                        Importante: este QR Code deve usar o endereço
                        de rede do computador, e não "localhost".
                    </small>

                </div>

            </div>

        </section>
    );
}


export default TabletLoginQrCard;