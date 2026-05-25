function Bone({ w, h = 'h-9' }: { w?: string; h?: string }) {
  return <div className={`skeleton-bone ${h} ${w ?? 'w-full'}`} />;
}

function LabeledBone({ w }: { w?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Bone h="h-3" w="w-20" />
      <Bone w={w} />
    </div>
  );
}

const sectionHead: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: '#2a3344',
  fontFamily: 'Manrope, system-ui, sans-serif',
  borderBottom: '1px solid #e3e7ee', paddingBottom: 8, marginBottom: 12,
};

export function EmpenhoFormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse-none">
      {/* Title */}
      <Bone h="h-7" w="w-64" />

      {/* Exercício e Tipo */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <LabeledBone />
        <LabeledBone />
        <LabeledBone />
        <LabeledBone />
      </section>

      {/* Classificação Orçamentária */}
      <section>
        <div style={sectionHead}><Bone h="h-4" w="w-48" /></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <LabeledBone />
          <div className="sm:col-span-3"><LabeledBone /></div>
          <div className="sm:col-span-2"><LabeledBone /></div>
          <LabeledBone />
          <div>
            <div className="flex flex-col gap-1.5">
              <Bone h="h-3" w="w-24" />
              <div className="flex gap-1">
                <Bone />
                <Bone w="w-10" />
              </div>
              <Bone />
            </div>
          </div>
        </div>
      </section>

      {/* Credor */}
      <section>
        <div style={sectionHead}><Bone h="h-4" w="w-20" /></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <LabeledBone />
          <div className="sm:col-span-3"><LabeledBone /></div>
        </div>
      </section>

      {/* Dados do Empenho */}
      <section>
        <div style={sectionHead}><Bone h="h-4" w="w-40" /></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <div className="flex flex-col gap-1.5">
              <Bone h="h-3" w="w-32" />
              <Bone h="h-20" />
            </div>
          </div>
          <LabeledBone />
        </div>
      </section>

      {/* Descontos — seção vazia */}
      <section>
        <div className="flex items-center justify-between" style={{ borderBottom: '1px solid #e3e7ee', paddingBottom: 8, marginBottom: 12 }}>
          <Bone h="h-4" w="w-40" />
          <Bone h="h-7" w="w-24" />
        </div>
      </section>

      {/* Liquidação */}
      <section>
        <div style={sectionHead}><Bone h="h-4" w="w-28" /></div>
        <div className="rounded-lg border border-line p-4 bg-bg-soft">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <LabeledBone />
            <LabeledBone />
            <LabeledBone />
            <LabeledBone />
            <LabeledBone />
            <div className="sm:col-span-3"><LabeledBone /></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3">
        <Bone h="h-9" w="w-24" />
        <Bone h="h-9" w="w-36" />
      </div>
    </div>
  );
}
