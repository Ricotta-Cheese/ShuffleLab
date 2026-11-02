// 아직 구현하지 않은 화면 자리
export default function Placeholder({ title, desc }: { title: string; desc: string }) {
  return (
    <section className="rounded-lg border border-dashed border-slate-300 bg-white p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </section>
  )
}
