import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { DownloadPage } from './pages/download'
import { IndexPage } from './pages/index.tsx'
import { SignInRedirect } from './pages/SignInRedirect'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/sign-in" element={<SignInRedirect />} />
        <Route path="/download" element={<DownloadPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export { App }
