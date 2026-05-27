type Props = {
  title: string;
  description?: string;
};

/**
 * Cabeçalho padrão de página — usa Fraunces para o título e
 * text-ink-500 para a descrição, exatamente como todas as páginas
 * faziam com inline style repetido.
 */
export function PageHeader({ title, description }: Props) {
  return (
    <div className="mb-5">
      <h2
        style={{
          fontFamily: 'Fraunces, Georgia, serif',
          fontWeight: 600,
          fontSize: 28,
          letterSpacing: '-0.02em',
          margin: '0 0 4px',
          color: '#0f1622',
          lineHeight: 1.15,
        }}
      >
        {title}
      </h2>
      {description && (
        <p style={{ fontSize: 14, color: '#5b667a', margin: 0 }}>
          {description}
        </p>
      )}
    </div>
  );
}
