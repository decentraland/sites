function readDataAttributes(element: Element): Record<string, string> {
  const payload: Record<string, string> = {}

  Array.from(element.attributes).forEach(attr => {
    if (!attr.name.startsWith('data-')) return
    if (attr.value === '') return

    const key = attr.name
      .slice(5)
      .split('-')
      .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
      .join('')

    payload[key] = attr.value
  })

  return payload
}

export { readDataAttributes }
