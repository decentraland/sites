const triggerFileDownload = (link: string): void => {
  const a = document.createElement('a')
  a.href = link
  a.setAttribute('download', '')
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export { triggerFileDownload }
