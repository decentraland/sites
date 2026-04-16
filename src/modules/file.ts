const triggerFileDownload = (link: string): void => {
  const a = document.createElement('a')
  a.href = link

  try {
    const url = new URL(link, window.location.href)
    if (url.origin === window.location.origin) {
      a.setAttribute('download', '')
    }
  } catch {
    // cross-origin or invalid URL, skip download attribute
  }

  document.body.appendChild(a)
  a.click()
  requestAnimationFrame(() => {
    a.remove()
  })
}

export { triggerFileDownload }
