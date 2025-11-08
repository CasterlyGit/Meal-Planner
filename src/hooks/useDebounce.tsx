import { useEffect, useState } from "react"
export default function useDebounce<T>(value: T, ms = 400) {
  const [v, setV] = useState(value)
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t) }, [value, ms])
  return v
}
