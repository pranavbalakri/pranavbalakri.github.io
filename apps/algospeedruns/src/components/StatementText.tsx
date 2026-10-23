export default function StatementText({ children }: { children: string }) {
  return <>{children.split(/(`[^`]+`)/g).map((part, index) =>
    part.startsWith('`') && part.endsWith('`')
      ? <code key={index}>{part.slice(1, -1)}</code>
      : part
  )}</>;
}
