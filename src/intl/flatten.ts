interface NestedMessages {
  [key: string]: string | NestedMessages
}

export function flattenMessages(nestedMessages: NestedMessages, prefix = ''): Record<string, string> {
  return Object.keys(nestedMessages).reduce(
    (messages, key) => {
      const value = nestedMessages[key]
      const prefixedKey = prefix ? `${prefix}.${key}` : key

      if (typeof value === 'string') {
        messages[prefixedKey] = value
      } else {
        Object.assign(messages, flattenMessages(value, prefixedKey))
      }

      return messages
    },
    {} as Record<string, string>
  )
}
