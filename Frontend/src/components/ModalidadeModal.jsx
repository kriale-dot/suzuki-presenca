import { useEffect, useState } from 'react';
import { apiPost, apiPut } from '../services/api';

function ModalidadeModal({ aberto, modalidade, onFechar, onSalvo }) {
    const editando = Boolean(modalidade);
    const [nome, setNome] = useState('');
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState('');

    useEffect(() => {
        if (!aberto) return;

        setNome(modalidade?.nome || '');
        setErro('');
        setSalvando(false);
    }, [aberto, modalidade]);

    if (!aberto) return null;

    function fecharPeloFundo(event) {
        if (event.target === event.currentTarget && !salvando) {
            onFechar();
        }
    }

    async function salvar(event) {
        event.preventDefault();

        const nomeLimpo = nome.trim();

        if (!nomeLimpo) {
            setErro('Informe o nome da modalidade.');
            return;
        }

        try {
            setSalvando(true);
            setErro('');

            if (editando) {
                await apiPut(`/modalidades/${modalidade.id}`, {
                    nome: nomeLimpo,
                    ativo: Number(modalidade.ativo)
                });
            } else {
                await apiPost('/modalidades', {
                    nome: nomeLimpo
                });
            }

            await onSalvo(editando ? 'editada' : 'criada');
            onFechar();
        } catch (err) {
            console.error(err);
            setErro(
                err.message ||
                `Não foi possível ${editando ? 'atualizar' : 'cadastrar'} a modalidade.`
            );
        } finally {
            setSalvando(false);
        }
    }

    return (
        <div className="modal-overlay" onMouseDown={fecharPeloFundo}>
            <section
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modalidade-modal-titulo"
            >
                <header className="modal-header">
                    <div>
                        <h2 id="modalidade-modal-titulo">
                            {editando ? 'Editar modalidade' : 'Nova modalidade'}
                        </h2>
                        <p>
                            {editando
                                ? 'Altere o nome da modalidade.'
                                : 'Cadastre uma modalidade oferecida pelo Estúdio Suzuki.'}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="modal-fechar"
                        onClick={onFechar}
                        disabled={salvando}
                        aria-label="Fechar janela"
                    >
                        ×
                    </button>
                </header>

                <form onSubmit={salvar}>
                    <div className="modal-body">
                        <div className="campo-formulario">
                            <label htmlFor="modalidade-nome">
                                Nome da modalidade <span className="campo-obrigatorio">*</span>
                            </label>

                            <input
                                id="modalidade-nome"
                                type="text"
                                autoFocus
                                maxLength={100}
                                placeholder="Ex.: Violino, Piano, Musicalização"
                                value={nome}
                                onChange={(event) => setNome(event.target.value)}
                                disabled={salvando}
                            />

                            <small>Use um nome curto e fácil de identificar.</small>
                        </div>

                        {erro && <div className="formulario-erro">{erro}</div>}
                    </div>

                    <footer className="modal-footer">
                        <button
                            type="button"
                            className="botao-secundario"
                            onClick={onFechar}
                            disabled={salvando}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="botao-primario"
                            disabled={salvando}
                        >
                            {salvando
                                ? 'Salvando...'
                                : editando
                                    ? 'Salvar alterações'
                                    : 'Cadastrar modalidade'}
                        </button>
                    </footer>
                </form>
            </section>
        </div>
    );
}

export default ModalidadeModal;
